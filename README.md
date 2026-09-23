# Saurient Carbon Passport Platform

An event-driven, graph-native enterprise microservice platform built with the **Tanzu Nexus Graph Framework**, **Google CEL (Common Expression Language)** calculation engine, **Kubernetes Controller Runtime**, and multi-tenant **PostgreSQL Row-Level Security (RLS)** storage.

---

## 🏛️ Architecture Overview

- **Declarative 3-CRD Architecture (`api/v1alpha1/`)**:
  - `CalculationRulebook` (`crb`): Dynamic CEL formulas for Scope 1–3 greenhouse gas emissions, functional unit definitions, and batch quantities per commodity.
  - `Product` (`prod`): Product batch registrations holding telemetry/activity data payloads, tenant context, facility ID, and `rulebookRef`.
  - `CarbonPassport` (`cp`): Auto-generated child Custom Resource managed by the `ProductReconciler` containing calculated Scope 1–3 emissions, intensity, and SHA-256 cryptographic audit digests.
- **Tanzu Nexus Graph Data Model (`pkg/nexus/types.go`)**: Declares the hierarchical graph model (`Enterprise` $\rightarrow$ `Facility` $\rightarrow$ `ProductType` $\rightarrow$ `CarbonPassport`).
- **Dynamic CEL Calculation Engine (`internal/engine/`)**: Compiles and evaluates Scope 1, Scope 2, Scope 3 greenhouse gas formulas dynamically.
- **Kubernetes Operator / Reconciler (`internal/controller/`)**: Listens to `Product` CR events, evaluates CEL rules, constructs child `CarbonPassport` CRs (`ownerReferences`), writes to PostgreSQL & Redis, and updates CR `.status`.
- **Multi-Tenant PostgreSQL Storage (`migrations/`, `internal/repository/`)**: RLS-isolated database schema with append-only audit trail logging (`passport_audit_trail`).
- **API Gateway & Schema Explorer (`cmd/api/`)**:
  - Interactive **Swagger UI** at `http://localhost:8080/swagger/`
  - **GraphQL Playground** at `http://localhost:8080/graphql/playground`
  - REST Verification & Product CRUD Endpoints at `/api/v1/products` and `/api/v1/passports`

---

## 🚀 Prerequisites

Ensure the following CLI tools are installed on your host:
- **Go** ($\ge 1.22$)
- **Docker** & **Kind**
- **kubectl**
- **curl** & **jq**

---

## 🛠️ Step 1: Cluster Setup & Deployment

Run the automated setup target in the `Makefile` to spin up the Kind cluster (`saurient-dev`), deploy PostgreSQL & Redis, apply database migrations, install CRDs, build Docker images, and deploy services:

```bash
make dev-setup
```

---

## 🧪 Step 2: Manual End-to-End Testing Workflow

### 2.1 Option A: Create a Product via Kubernetes CRD (`kubectl`)

Deploy a `CalculationRulebook` CR and a `Product` CR (`cement-product-001` with `fuel_liters: 500.0`):

```bash
kubectl apply -f - << 'EOF'
apiVersion: saurient.io/v1alpha1
kind: CalculationRulebook
metadata:
  name: cement-rulebook-2026
  namespace: default
spec:
  commodityType: "Cement"
  version: "2026.1"
  scope1Formula: "(fuel_liters * fuel_ef) + (limestone_tons * calcination_ef)"
  scope2Formula: "(electricity_kwh * grid_ef) - (renewable_ppa_kwh * ppa_offset_ef)"
  scope3Formula: "(raw_material_kg * material_ef) + (freight_ton_km * transport_ef)"
  functionalUnit: "kg CO2e per metric ton"
  batchQuantity: 100.0
---
apiVersion: saurient.io/v1alpha1
kind: Product
metadata:
  name: cement-product-001
  namespace: default
spec:
  tenantID: "123e4567-e89b-12d3-a456-426614174000"
  facilityID: "fac-rotterdam-01"
  batchID: "batch-2026-09-A"
  productName: "Portland Cement Grade 52.5"
  commodityType: "Cement"
  rulebookRef:
    name: cement-rulebook-2026
    namespace: default
  activityDataRaw: |
    {
      "fuel_liters": 500.0,
      "fuel_ef": 2.68,
      "limestone_tons": 10.0,
      "calcination_ef": 440.0,
      "electricity_kwh": 2000.0,
      "grid_ef": 0.85,
      "renewable_ppa_kwh": 500.0,
      "ppa_offset_ef": 0.85,
      "raw_material_kg": 5000.0,
      "material_ef": 0.12,
      "freight_ton_km": 1000.0,
      "transport_ef": 0.15
    }
EOF
```

---

### 2.1 Option B: Create a Product via API Gateway (`curl`)

Submit a new product batch directly through the REST API Gateway:

```bash
curl -s -X POST http://localhost:8080/api/v1/products \
  -H "Content-Type: application/json" \
  -H "X-Tenant-ID: 123e4567-e89b-12d3-a456-426614174000" \
  -d '{
    "tenant_id": "123e4567-e89b-12d3-a456-426614174000",
    "facility_id": "fac-rotterdam-01",
    "batch_id": "batch-2026-09-B",
    "product_name": "Portland Cement Grade 42.5",
    "commodity_type": "Cement",
    "activity_data_raw": "{\"fuel_liters\":500,\"fuel_ef\":2.68,\"limestone_tons\":10,\"calcination_ef\":440,\"electricity_kwh\":2000,\"grid_ef\":0.85,\"renewable_ppa_kwh\":500,\"ppa_offset_ef\":0.85,\"raw_material_kg\":5000,\"material_ef\":0.12,\"freight_ton_km\":1000,\"transport_ef\":0.15}"
  }' | jq .
```

---

### 2.2 Verify Processed CR Statuses

#### A) Check `Product` CR Status
```bash
kubectl get product cement-product-001 -n default -o yaml
```
*Expected Output (`status` section)*:
```yaml
status:
  dataHash: 9c1b07962f969092b9835faa1897e07408e613a9e02997aa1dfc719a75589ca8
  lastUpdated: "2026-09-23T15:39:01Z"
  passportRef:
    name: cement-product-001-passport
    namespace: default
  phase: Calculated
  totalFootprintKg: 7765
```

#### B) Check Auto-Generated Child `CarbonPassport` CR
```bash
kubectl get carbonpassport cement-product-001-passport -n default -o yaml
```
*Expected Output (`status` section)*:
```yaml
status:
  cryptographicHash: 9c1b07962f969092b9835faa1897e07408e613a9e02997aa1dfc719a75589ca8
  passportID: <UUID_ASSIGNED_BY_DB>
  phase: Issued
```

---

### 2.3 Query GET API Endpoint

Extract the auto-assigned `passportID` from the child CR and fetch the passport details from the API Gateway:

```bash
PASSPORT_ID=$(kubectl get carbonpassport cement-product-001-passport -n default -o jsonpath='{.status.passportID}')

curl -s -H "X-Tenant-ID: 123e4567-e89b-12d3-a456-426614174000" \
  http://localhost:8080/api/v1/passports/${PASSPORT_ID} | jq .
```

*Expected JSON Response*:
```json
{
  "passport_id": "...",
  "tenant_id": "123e4567-e89b-12d3-a456-426614174000",
  "facility_id": "fac-rotterdam-01",
  "batch_number": "batch-2026-09-A",
  "commodity_type": "Cement",
  "scope_1_kg_co2e": 5740,
  "scope_2_kg_co2e": 1275,
  "scope_3_kg_co2e": 750,
  "total_footprint_kg": 7765,
  "intensity_per_unit": 77.65,
  "data_hash": "9c1b07962f969092b9835faa1897e07408e613a9e02997aa1dfc719a75589ca8",
  "verification_status": "Calculated"
}
```

---

### 2.4 Update Product Activity Data & Verify Audit Trail

Increase fuel consumption (`fuel_liters` from `500.0` to `800.0`):

```bash
kubectl apply -f - << 'EOF'
apiVersion: saurient.io/v1alpha1
kind: Product
metadata:
  name: cement-product-001
  namespace: default
spec:
  tenantID: "123e4567-e89b-12d3-a456-426614174000"
  facilityID: "fac-rotterdam-01"
  batchID: "batch-2026-09-A"
  productName: "Portland Cement Grade 52.5"
  commodityType: "Cement"
  rulebookRef:
    name: cement-rulebook-2026
    namespace: default
  activityDataRaw: |
    {
      "fuel_liters": 800.0,
      "fuel_ef": 2.68,
      "limestone_tons": 10.0,
      "calcination_ef": 440.0,
      "electricity_kwh": 2000.0,
      "grid_ef": 0.85,
      "renewable_ppa_kwh": 500.0,
      "ppa_offset_ef": 0.85,
      "raw_material_kg": 5000.0,
      "material_ef": 0.12,
      "freight_ton_km": 1000.0,
      "transport_ef": 0.15
    }
EOF
```

#### A) Check Updated GET API Response
```bash
curl -s -H "X-Tenant-ID: 123e4567-e89b-12d3-a456-426614174000" \
  http://localhost:8080/api/v1/passports/${PASSPORT_ID} | jq .
```
*Expected Output*: Total footprint updated to **8569 kg CO2e** with a new cryptographic SHA-256 data hash.

#### B) Query PostgreSQL Append-Only Audit Trail
```bash
kubectl exec -n saurient-system deploy/postgres -- psql -U saurient -d saurient_db \
  -c "SELECT audit_id, passport_id, action_type, previous_hash, current_hash, timestamp FROM passport_audit_trail;"
```

---

## 🌐 Core API Gateway Endpoints Summary

| Interface | Method | Endpoint | Purpose |
| :--- | :--- | :--- | :--- |
| **Interactive Swagger UI** | GET | `http://localhost:8080/swagger/` | Clean OpenAPI dashboard for interactive testing |
| **Create Product** | POST | `http://localhost:8080/api/v1/products` | Registers a Product batch and creates a Product CR |
| **Get Product Status** | GET | `http://localhost:8080/api/v1/products/{name}` | Fetches Product CR reconciliation phase & total footprint |
| **Create Rulebook** | POST | `http://localhost:8080/api/v1/rules` | Registers a new CalculationRulebook CR with CEL formulas |
| **Get Carbon Passport** | GET | `http://localhost:8080/api/v1/passports/{passport_id}` | Retrieves verified Digital Carbon Passport details |

---

## 🧹 Cleaning Up

- **To clean data (truncate tables, flush cache, remove CRs)**:
  ```bash
  kubectl exec -n saurient-system deploy/postgres -- psql -U saurient -d saurient_db -c "TRUNCATE carbon_passports, passport_audit_trail RESTART IDENTITY CASCADE;"
  kubectl exec -n saurient-system deploy/redis -- redis-cli FLUSHALL
  kubectl delete product --all -n default
  kubectl delete carbonpassport --all -n default
  ```

- **To completely destroy the local Kind cluster**:
  ```bash
  make clean
  ```
