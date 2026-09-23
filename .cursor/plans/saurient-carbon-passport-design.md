# Design Specification: Saurient Carbon Passport Platform

**Feature Name:** `saurient-carbon-passport`  
**Branch:** `feature/saurient-carbon-passport`  
**Author:** Principal Cloud-Native Architect & Lead Go Engineer  
**Date:** Sep 23, 2026  
**Status:** Approved Draft  

---

## 1. Overview & System Context
The **Saurient Carbon Passport Platform** is an event-driven, graph-native microservice system that ingests telemetry (Sattric+ IoT devices), ERP webhooks, and supplier data, calculates Scope 1, Scope 2, and Scope 3 greenhouse gas emissions using runtime-evaluated Google CEL formula rulebooks, and produces verifiable digital Carbon Passports with CBAM compliance artifacts.

---

## 2. Technical Stack & Architecture
- **Language & Runtime:** Go 1.27.1+ following standard project layout (`/cmd`, `/internal`, `/api`, `/migrations`, `/deploy`).
- **Graph & Controller Layer:** Tanzu Nexus DSL / K8s Operator Pattern using `controller-runtime`.
- **Calculation Engine:** Google Common Expression Language (`github.com/google/cel-go`).
- **Data & Caching:** PostgreSQL 16 (Multi-tenant with Row-Level Security), Redis 7 (Public QR verification cache).
- **Local Devbed:** Kind (`saurient-dev`), Docker, `Makefile` (`make dev-setup`).

---

## 3. Detailed Component Specification

### 3.1 Multi-Tenant PostgreSQL Schema (`migrations/001_init_schema.sql`)
- **Extensions:** `pgcrypto` / `uuid-ossp`.
- **Table `carbon_passports`:**
  - `passport_id` (UUID PRIMARY KEY DEFAULT gen_random_uuid())
  - `tenant_id` (UUID NOT NULL)
  - `facility_id` (VARCHAR(255)), `batch_number` (VARCHAR(255)), `commodity_type` (VARCHAR(255)), `verification_status` (VARCHAR(50))
  - `scope_1_kg_co2e` (NUMERIC(18,4)), `scope_2_kg_co2e` (NUMERIC(18,4)), `scope_3_kg_co2e` (NUMERIC(18,4))
  - `total_footprint_kg` GENERATED ALWAYS AS (scope_1_kg_co2e + scope_2_kg_co2e + scope_3_kg_co2e) STORED
  - `calculation_details` (JSONB)
  - `issued_at` (TIMESTAMPTZ DEFAULT NOW()), `data_hash` (CHAR(64))
- **Table `passport_audit_trail` (Append-Only):**
  - `audit_id` (UUID PRIMARY KEY DEFAULT gen_random_uuid())
  - `passport_id` (UUID REFERENCES carbon_passports(passport_id))
  - `previous_hash` (CHAR(64)), `current_hash` (CHAR(64)), `action_type` (VARCHAR(50)), `timestamp` (TIMESTAMPTZ DEFAULT NOW()), `change_payload` (JSONB)
  - Rule: `CREATE RULE prevent_audit_update AS ON UPDATE TO passport_audit_trail DO INSTEAD NOTHING;`
  - Rule: `CREATE RULE prevent_audit_delete AS ON DELETE TO passport_audit_trail DO INSTEAD NOTHING;`
- **PostgreSQL Row-Level Security (RLS):**
  - `ALTER TABLE carbon_passports ENABLE ROW LEVEL SECURITY;`
  - `ALTER TABLE passport_audit_trail ENABLE ROW LEVEL SECURITY;`
  - `CREATE POLICY tenant_isolation_policy ON carbon_passports USING (tenant_id = current_setting('app.current_tenant', true)::uuid);`
  - `CREATE POLICY tenant_isolation_audit_policy ON passport_audit_trail USING (passport_id IN (SELECT passport_id FROM carbon_passports WHERE tenant_id = current_setting('app.current_tenant', true)::uuid));`

### 3.2 Multi-Tenant Context Manager (`internal/tenant/context.go` & `internal/repository/postgres.go`)
- `WithTenant(ctx context.Context, tenantID string) context.Context`
- `GetTenant(ctx context.Context) (string, error)`
- Database Tx Wrapper: Runs `SET LOCAL app.current_tenant = $1` inside database transactions prior to running queries.

### 3.3 Dynamic CEL Formula Calculation Engine (`internal/engine/`)
- `CalculationRulebook`: Scope1Formula, Scope2Formula, Scope3Formula, Version, FunctionalUnit, BatchQuantity.
- `CalculationResult`: Scope1Kg, Scope2Kg, Scope3Kg, TotalFootprintKg, IntensityPerUnit, DataHash (SHA-256), ExecutionSnapshot.
- `CELEngine`:
  - Compiles CEL expressions using `github.com/google/cel-go`.
  - Evaluates Scope 1, Scope 2, Scope 3 expressions safely against activity data maps.
  - Computes `TotalFootprintKg / BatchQuantity`.
  - Generates SHA-256 cryptographic digest of inputs + rulebook version + calculated outputs for CBAM compliance proof.
- `cel_engine_test.go`: Unit tests for real scenarios (e.g. Steel or Cement calculations).

### 3.4 Kubernetes CRD Specs & Reconciler Loop (`api/v1alpha1/` & `internal/controller/`)
- CRD `CarbonPassport`:
  - `CarbonPassportSpec`: TenantID, FacilityID, BatchID, CommodityType, ActivityDataRaw (JSON string), RulebookVersion.
  - `CarbonPassportStatus`: Phase (`Pending`, `Calculated`, `Verified`), PassportID (UUID), TotalFootprintKg, DataHash, LastUpdated.
- CRD `CalculationRulebook`:
  - `CalculationRulebookSpec`: CommodityType, Version, Scope1Formula, Scope2Formula, Scope3Formula, FunctionalUnit.
- Controller (`carbonpassport_controller.go`):
  - Fetches `CarbonPassport` CR.
  - Injects `TenantID` into Go `context.Context`.
  - Executes `CELEngine.Evaluate()`.
  - Saves snapshot and append-only audit trail in PostgreSQL.
  - Caches verified snapshot in Redis.
  - Updates CR `.status` with `PassportID`, `TotalFootprintKg`, `DataHash`, and `Phase = Calculated`.

### 3.5 Public API & Local Development Automation (`cmd/api/`, `deploy/`, `Makefile`)
- `cmd/api/main.go`: REST verification endpoint `/api/v1/passports/{passport_id}` reading from Redis cache (with fallback to Postgres).
- `deploy/kind-config.yaml`: Kind cluster configuration mapping port 8080 (API) and 5432 (Postgres).
- `deploy/postgres-manifests.yaml` & `deploy/app-manifests.yaml`: Kubernetes manifests for PostgreSQL 16, Redis 7, controller, and API server.
- `Makefile`:
  - `make dev-setup`: Performs prerequisite check, recreates `saurient-dev` Kind cluster, builds & loads Docker images, deploys Postgres/Redis, waits for rollout status, runs migrations (`001_init_schema.sql`), deploys CRDs & apps, applies sample CR, prints verification endpoint URL.
  - `make clean`: Tears down Kind cluster and temp artifacts.
  - `make test`: Runs `go test -v ./...`.

---

## Implementation Tasks

- [ ] Task 1: Multi-Tenant Database Schema (`migrations/001_init_schema.sql`)
- [ ] Task 2: Multi-Tenant Context Manager (`internal/tenant/context.go` & `internal/repository/postgres.go`)
- [ ] Task 3: Dynamic CEL Emission Engine (`internal/engine/cel_engine.go`, `types.go`, `cel_engine_test.go`)
- [ ] Task 4: Kubernetes CRD & Controller (`api/v1alpha1/carbonpassport_types.go`, `calculationrulebook_types.go`, `internal/controller/carbonpassport_controller.go`, `cmd/controller/main.go`, `cmd/api/main.go`)
- [ ] Task 5: Local Development Automation (`Makefile`, `deploy/kind-config.yaml`, `deploy/postgres-manifests.yaml`, `deploy/app-manifests.yaml`)
- [ ] Code review: `rocket-agent route --task-type code-review --prompt "/code-review <branch> high --fix"`
- [ ] Validation: write `features/saurient-carbon-passport/validation.md` + `features/saurient-carbon-passport/validate.sh`; run `bash features/saurient-carbon-passport/validate.sh`
- [ ] Squash and finish: invoke `tanzu-finishing-a-development-branch`
