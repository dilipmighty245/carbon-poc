# End-to-End Testing Workflow Guide: DAG Rule Chaining, Accounting Modes, & API Gateway Integration

This document provides a step-by-step guide to testing the **Saurient Carbon Passport Platform** end-to-end on a local Kubernetes (Kind) cluster. It covers cluster creation, microservice deployment, custom rulebook definitions with DAG rule chaining, product telemetry ingestion, operator reconciliation, and API Gateway HTTP REST & GraphQL interaction.

---

## 📋 Table of Contents

1. [Prerequisites & Environment Verification](#1-prerequisites--environment-verification)
2. [Step 1: Automated Cluster Setup & Deployment (`make dev-setup`)](#step-1-automated-cluster-setup--deployment-make-dev-setup)
3. [Step 2: Define Calculation Rulebook with DAG Rules & Accounting Modes](#step-2-define-calculation-rulebook-with-dag-rules--accounting-modes)
4. [Step 3: Register Product Batch with Activity Telemetry](#step-3-register-product-batch-with-activity-telemetry)
5. [Step 4: Inspect Operator Reconciliation & CarbonPassport CR](#step-4-inspect-operator-reconciliation--carbonpassport-cr)
6. [Step 5: API Gateway (API GW) HTTP REST & GraphQL Interaction](#step-5-api-gateway-api-gw-http-rest--graphql-interaction)
   - [5.1 API Gateway Overview & Tenant Authentication](#51-api-gateway-overview--tenant-authentication)
   - [5.2 Register Calculation Rulebook (`POST /api/v1/rules`)](#52-register-calculation-rulebook-post-apiv1rules)
   - [5.3 Register Product Batch (`POST /api/v1/products`)](#53-register-product-batch-post-apiv1products)
   - [5.4 Create Carbon Passport (`POST /api/v1/passports`)](#54-create-carbon-passport-post-apiv1passports)
   - [5.5 Fetch Digital Carbon Passport (`GET /api/v1/passports/{id}`)](#55-fetch-digital-carbon-passport-get-apiv1passportsid)
   - [5.6 GraphQL Query Interface (`POST /graphql`)](#56-graphql-query-interface-post-graphql)
   - [5.7 Tanzu Nexus Graph Overview (`GET /api/v1/nexus/graph`)](#57-tanzu-nexus-graph-overview-get-apiv1nexusgraph)
7. [Teardown & Cleanup](#teardown--cleanup)

---

## 1. Prerequisites & Environment Verification

Ensure `docker`, `kind`, `kubectl`, `make`, `curl`, and `jq` are installed and available in your shell environment:

```bash
make check-prereqs
```

**Expected Output:**
```text
==> Checking required CLI tools...
Prerequisites verified: kind, kubectl, docker.
```

---

## Step 1: Automated Cluster Setup & Deployment (`make dev-setup`)

Run `make dev-setup` to delete any pre-existing `saurient-dev` cluster, spin up a fresh Kind cluster, build microservice Docker images, apply database migrations, deploy CRDs, and launch all services:

```bash
make dev-setup
```

### What `make dev-setup` performs automatically:
1. **Kind Cluster Creation**: Spins up cluster `saurient-dev` with port mappings for host port `8080` (API Gateway) and `5432` (PostgreSQL).
2. **Docker Image Builds**: Builds `saurient-controller:dev` and `saurient-api:dev` and loads them directly into Kind.
3. **Database & Cache Deployment**: Deploys PostgreSQL and Redis into namespace `saurient-system`.
4. **PostgreSQL RLS Schema Migration**: Executes `migrations/001_init_schema.sql` to set up `carbon_passports` and `passport_audit_trail` tables with Row-Level Security (RLS) policies.
5. **CRD Installation**: Installs `carbonpassports.saurient.io`, `calculationrulebooks.saurient.io`, and `products.saurient.io`.
6. **Microservice Rollout**: Deploys `saurient-controller` and `saurient-api` deployments.

### Verification of Cluster Pods:
```bash
kubectl get pods -n saurient-system
```

**Expected Output:**
```text
NAME                                   READY   STATUS    RESTARTS   AGE
postgres-6dcc8d68f-vkxm2               1/1     Running   0          90s
redis-554cc449bf-wk48r                 1/1     Running   0          90s
saurient-api-77b6bd47c4-ng457          1/1     Running   0          15s
saurient-controller-5b66469459-fhrjt   1/1     Running   0          15s
```

---

## Step 2: Define Calculation Rulebook with DAG Rules & Accounting Modes

Create a `CalculationRulebook` Custom Resource (`rice-rulebook-2026`) that defines a multi-stage **Directed Acyclic Graph (DAG)** calculation workflow ($R01 \dots R07 \rightarrow R08 \rightarrow R09$), explicit accounting scopes (`scope1`, `scope2`, `scope3`, `intermediate`), and accounting standard modes (`pcf`, `ghg`, `cbam`).

```bash
kubectl apply -f - << 'EOF'
apiVersion: saurient.io/v1alpha1
kind: CalculationRulebook
metadata:
  name: rice-rulebook-2026
  namespace: default
spec:
  commodityType: "Rice"
  version: "2026.1"
  accountingMode: "pcf"
  functionalUnit: "kg CO2e per kg"
  batchQuantity: 1000.0
  rules:
    - id: "R01"
      name: "Rice Methane"
      scope: "scope1"
      mode: "pcf"
      formula: "methane_factor * flooded_hectares"
    - id: "R02"
      name: "Fertilizer Emissions"
      scope: "scope1"
      mode: "pcf"
      formula: "fertilizer_kg * N2O_ef"
    - id: "R03"
      name: "Farm Electricity"
      scope: "scope2"
      mode: "pcf"
      formula: "electricity_kwh * grid_ef"
    - id: "R04"
      name: "Milling Emissions"
      scope: "scope2"
      mode: "pcf"
      formula: "milling_kwh * grid_ef"
    - id: "R05"
      name: "Packaging"
      scope: "scope3"
      mode: "pcf"
      formula: "packaging_kg * pack_ef"
    - id: "R06"
      name: "Transport"
      scope: "scope3"
      mode: "pcf"
      formula: "freight_km * trans_ef"
    - id: "R07"
      name: "Carbon Removal"
      scope: "scope3"
      mode: "pcf"
      formula: "-1.0 * (removal_ton * 1000.0)"
    - id: "R08"
      name: "Total Gross Emissions"
      scope: "intermediate"
      mode: "pcf"
      outputType: "total_footprint"
      formula: "R01 + R02 + R03 + R04 + R05 + R06 + R07"
    - id: "R09"
      name: "Intensity per Kg"
      scope: "intermediate"
      mode: "pcf"
      outputType: "intensity"
      formula: "R08 / total_kg_rice"
EOF
```

---

## Step 3: Register Product Batch with Activity Telemetry

Deploy a `Product` Custom Resource (`rice-product-001`) representing a batch of **Premium Basmati Rice** produced by tenant `org_saurient_demo` at facility `fac_punjab_farm_01`.

```bash
kubectl apply -f - << 'EOF'
apiVersion: saurient.io/v1alpha1
kind: Product
metadata:
  name: rice-product-001
  namespace: default
spec:
  tenantID: "org_saurient_demo"
  facilityID: "fac_punjab_farm_01"
  batchID: "BATCH-RICE-2026-001"
  productName: "Premium Basmati Rice"
  commodityType: "Rice"
  rulebookRef:
    name: rice-rulebook-2026
    namespace: default
  activityDataRaw: |
    {
      "methane_factor": 50.0,
      "flooded_hectares": 10.0,
      "fertilizer_kg": 100.0,
      "N2O_ef": 2.0,
      "electricity_kwh": 400.0,
      "grid_ef": 0.5,
      "milling_kwh": 200.0,
      "packaging_kg": 50.0,
      "pack_ef": 1.0,
      "freight_km": 300.0,
      "trans_ef": 0.5,
      "removal_ton": 0.1,
      "total_kg_rice": 1000.0
    }
EOF
```

---

## Step 4: Inspect Operator Reconciliation & CarbonPassport CR

### 4.1 Inspect `Product` CR Status
The `ProductReconciler` automatically evaluates the CEL DAG rules, stores calculated metrics in PostgreSQL and Redis, creates a child `CarbonPassport` CR, and updates `.status`:

```bash
kubectl get product rice-product-001 -o yaml
```

**Expected Key Output:**
```yaml
status:
  dataHash: e7cfeff11ffa2cc602b6bb19bfe29aa2a2347c8b7c14aaf3f25a233657ece9be
  lastUpdated: "2026-09-25T06:20:29Z"
  passportID: b3ca13e5-fd83-4436-af11-00c3825bdba3
  passportRef:
    name: rice-product-001-passport
    namespace: default
  phase: Calculated
  totalFootprintKg: 1100
```

### 4.2 Inspect Child `CarbonPassport` CR
Check the auto-generated child `CarbonPassport` CR (`rice-product-001-passport`):

```bash
kubectl get carbonpassport rice-product-001-passport -o yaml
```

**Expected Calculations Breakdown:**
- **Scope 1 Direct**: `700 kg CO2e` ($R01: 500 + R02: 200$)
- **Scope 2 Indirect Energy**: `300 kg CO2e` ($R03: 200 + R04: 100$)
- **Scope 3 Value Chain**: `100 kg CO2e` ($R05: 50 + R06: 150 + R07: -100$)
- **Total Batch Footprint ($R08$)**: `1100 kg CO2e`
- **Intensity per Unit ($R09$)**: `1.1 kg CO2e / kg`
- **Rule Results Trace**: Stored inside `spec.calculationDetails.rule_results` for complete transparency.

---

## Step 5: API Gateway (API GW) HTTP REST & GraphQL Interaction

### 5.1 API Gateway Overview & Tenant Authentication
The **API Gateway (`saurient-api`)** serves as the central entry point for REST, GraphQL, and Open API/Swagger interfaces on port `8080`.

- **Base URL**: `http://localhost:8080`
- **Mandatory Tenant Header**: All requests require `X-Tenant-ID: <tenant_id>` (e.g., `X-Tenant-ID: org_saurient_demo`). Missing headers result in `401 Unauthorized` or `400 Bad Request`.
- **Prerequisite Dependency Flow**: In carbon accounting, **Calculation Rulebooks must always be registered before Product batches**. A `Product` batch references a `CalculationRulebook` by name; if the rulebook does not exist in the platform, the Kubernetes controller cannot evaluate activity data formulas during reconciliation.

---

### 5.2 Register Calculation Rulebook (`POST /api/v1/rules`)

Deploys a custom calculation rulebook via HTTP API. This rulebook uses the **DAG Rule Chaining** engine (`rules` array with scopes, output types, formulas, and accounting modes).

#### HTTP Request
- **Method**: `POST`
- **Endpoint**: `http://localhost:8080/api/v1/rules`
- **Headers**:
  - `Content-Type: application/json`
  - `X-Tenant-ID: org_saurient_demo`

#### HTTP Request Body:
```json
{
  "name": "steel-rulebook-2026",
  "namespace": "default",
  "commodity_type": "Steel",
  "version": "2026.1",
  "accounting_mode": "pcf",
  "functional_unit": "kg CO2e per ton",
  "batch_quantity": 1000.0,
  "rules": [
    {
      "id": "R01",
      "name": "Coal Combustion",
      "scope": "scope1",
      "mode": "pcf",
      "formula": "coal_tons * 2.42"
    },
    {
      "id": "R02",
      "name": "Natural Gas Direct",
      "scope": "scope1",
      "mode": "pcf",
      "formula": "natural_gas_mmbtu * 0.053"
    },
    {
      "id": "R03",
      "name": "Grid Power",
      "scope": "scope2",
      "mode": "pcf",
      "formula": "grid_kwh * 0.385"
    },
    {
      "id": "R04",
      "name": "Scrap Metal Upstream",
      "scope": "scope3",
      "mode": "pcf",
      "formula": "scrap_metal_tons * 0.08"
    },
    {
      "id": "R05",
      "name": "Freight Logistics",
      "scope": "scope3",
      "mode": "pcf",
      "formula": "transport_km * 0.12"
    },
    {
      "id": "R06",
      "name": "Total Footprint",
      "scope": "intermediate",
      "mode": "pcf",
      "outputType": "total_footprint",
      "formula": "R01 + R02 + R03 + R04 + R05"
    }
  ]
}
```

#### Curl Command:
```bash
curl -i -X POST http://localhost:8080/api/v1/rules \
  -H "Content-Type: application/json" \
  -H "X-Tenant-ID: org_saurient_demo" \
  -d '{
    "name": "steel-rulebook-2026",
    "namespace": "default",
    "commodity_type": "Steel",
    "version": "2026.1",
    "accounting_mode": "pcf",
    "functional_unit": "kg CO2e per ton",
    "batch_quantity": 1000.0,
    "rules": [
      {
        "id": "R01",
        "name": "Coal Combustion",
        "scope": "scope1",
        "mode": "pcf",
        "formula": "coal_tons * 2.42"
      },
      {
        "id": "R02",
        "name": "Natural Gas Direct",
        "scope": "scope1",
        "mode": "pcf",
        "formula": "natural_gas_mmbtu * 0.053"
      },
      {
        "id": "R03",
        "name": "Grid Power",
        "scope": "scope2",
        "mode": "pcf",
        "formula": "grid_kwh * 0.385"
      },
      {
        "id": "R04",
        "name": "Scrap Metal Upstream",
        "scope": "scope3",
        "mode": "pcf",
        "formula": "scrap_metal_tons * 0.08"
      },
      {
        "id": "R05",
        "name": "Freight Logistics",
        "scope": "scope3",
        "mode": "pcf",
        "formula": "transport_km * 0.12"
      },
      {
        "id": "R06",
        "name": "Total Footprint",
        "scope": "intermediate",
        "mode": "pcf",
        "outputType": "total_footprint",
        "formula": "R01 + R02 + R03 + R04 + R05"
      }
    ]
  }'
```

---

### 5.3 Register Product Batch (`POST /api/v1/products`)

Registers a new product batch with activity telemetry. The payload references the pre-existing `steel-rulebook-2026` registered in Step 5.2 (or `rice-rulebook-2026` from Step 2). This provisions a Kubernetes `Product` CR and triggers operator reconciliation.

#### HTTP Request
- **Method**: `POST`
- **Endpoint**: `http://localhost:8080/api/v1/products`
- **Headers**:
  - `Content-Type: application/json`
  - `X-Tenant-ID: org_saurient_demo`

#### HTTP Request Body:
```json
{
  "tenant_id": "org_saurient_demo",
  "facility_id": "fac_rotterdam_01",
  "batch_id": "steel-batch-2026-001",
  "product_name": "Structural Steel Beams",
  "commodity_type": "Steel",
  "rulebook_ref": {
    "name": "steel-rulebook-2026",
    "namespace": "default"
  },
  "batch_data": {
    "product_name": "Structural Steel Beams",
    "commodity": "Steel",
    "batch_id": "steel-batch-2026-001",
    "facility_name": "fac_rotterdam_01",
    "facility_location": "Rotterdam Industrial Zone",
    "batch_size_quantity": 1000.0,
    "unit_of_measure": "tons",
    "export_market": "European Union"
  },
  "activity_data": {
    "coal_tons": 500.0,
    "natural_gas_mmbtu": 1200.0,
    "grid_kwh": 15000.0,
    "scrap_metal_tons": 800.0,
    "transport_km": 450.0
  }
}
```

#### Curl Command:
```bash
curl -i -X POST http://localhost:8080/api/v1/products \
  -H "Content-Type: application/json" \
  -H "X-Tenant-ID: org_saurient_demo" \
  -d '{
    "tenant_id": "org_saurient_demo",
    "facility_id": "fac_rotterdam_01",
    "batch_id": "steel-batch-2026-001",
    "product_name": "Structural Steel Beams",
    "commodity_type": "Steel",
    "rulebook_ref": {
      "name": "steel-rulebook-2026",
      "namespace": "default"
    },
    "activity_data": {
      "coal_tons": 500.0,
      "natural_gas_mmbtu": 1200.0,
      "grid_kwh": 15000.0,
      "scrap_metal_tons": 800.0,
      "transport_km": 450.0
    }
  }'
```

#### Expected HTTP Response (`201 Created`):
```json
{
  "name": "product-steel-batch-2026-001",
  "namespace": "default",
  "tenant_id": "org_saurient_demo",
  "facility_id": "fac_rotterdam_01",
  "batch_id": "steel-batch-2026-001",
  "product_name": "Structural Steel Beams",
  "commodity_type": "Steel",
  "status": "Created",
  "created_at": "2026-09-25T07:12:00Z"
}
```

---

### 5.4 Create Carbon Passport (`POST /api/v1/passports`)

Registers a raw activity dataset directly to create a Carbon Passport record in PostgreSQL and Redis.

#### HTTP Request
- **Method**: `POST`
- **Endpoint**: `http://localhost:8080/api/v1/passports`
- **Headers**:
  - `Content-Type: application/json`
  - `X-Tenant-ID: org_saurient_demo`

#### HTTP Request Body:
```json
{
  "tenant_id": "org_saurient_demo",
  "facility_id": "fac_rotterdam_01",
  "batch_number": "cement-batch-001",
  "commodity_type": "Cement",
  "batch_data": {
    "product_name": "Structural Cement CEM I",
    "commodity": "Cement",
    "batch_id": "cement-batch-001",
    "facility_name": "Rotterdam Cement Facility",
    "facility_location": "Rotterdam, Netherlands",
    "batch_size_quantity": 100.0,
    "unit_of_measure": "tons",
    "export_market": "European Union"
  },
  "activity_data": {
    "scope_1_direct": {
      "fuel_consumed_liters": 2500.0
    },
    "scope_2_indirect": {
      "electricity_consumed_kwh": 5000.0
    },
    "scope_3_upstream": {
      "packaging": {
        "quantity": 100.0
      }
    }
  }
}
```

#### Curl Command:
```bash
curl -i -X POST http://localhost:8080/api/v1/passports \
  -H "Content-Type: application/json" \
  -H "X-Tenant-ID: org_saurient_demo" \
  -d '{
    "tenant_id": "org_saurient_demo",
    "facility_id": "fac_rotterdam_01",
    "batch_number": "cement-batch-001",
    "commodity_type": "Cement",
    "batch_data": {
      "product_name": "Structural Cement CEM I",
      "commodity": "Cement",
      "batch_id": "cement-batch-001",
      "facility_name": "Rotterdam Cement Facility",
      "facility_location": "Rotterdam, Netherlands",
      "batch_size_quantity": 100.0,
      "unit_of_measure": "tons",
      "export_market": "European Union"
    },
    "activity_data": {
      "scope_1_direct": {
        "fuel_consumed_liters": 2500.0
      },
      "scope_2_indirect": {
        "electricity_consumed_kwh": 5000.0
      },
      "scope_3_upstream": {
        "packaging": {
          "quantity": 100.0
        }
      }
    }
  }'
```

---

### 5.5 Fetch Digital Carbon Passport (`GET /api/v1/passports/{id}`)

Query the API Gateway REST endpoint (`GET /api/v1/passports/{passport_id}`) to retrieve the rich passport payload.

#### HTTP Request
- **Method**: `GET`
- **Endpoint**: `http://localhost:8080/api/v1/passports/${PASSPORT_ID}`
- **Headers**:
  - `X-Tenant-ID: org_saurient_demo`

#### Curl Command:
```bash
PASSPORT_ID=$(kubectl get carbonpassport rice-product-001-passport -o jsonpath='{.status.passportID}')

curl -s -H "X-Tenant-ID: org_saurient_demo" \
  http://localhost:8080/api/v1/passports/${PASSPORT_ID} | jq .
```

#### Sample JSON Response:
```json
{
  "passport_metadata": {
    "passport_id": "b3ca13e5-fd83-4436-af11-00c3825bdba3",
    "unique_qr_code": "https://verify.saurient.com/passport/b3ca13e5-fd83-4436-af11-00c3825bdba3",
    "cryptographic_hash": "e7cfeff11ffa2cc602b6bb19bfe29aa2a2347c8b7c14aaf3f25a233657ece9be",
    "issuance_date": "2026-09-25T06:20:29Z",
    "status": "Calculated"
  },
  "product_summary": {
    "commodity": "Rice",
    "product_name": "Rice",
    "batch_number": "BATCH-RICE-2026-001",
    "producer_organization": "org_saurient_demo",
    "facility": {
      "name": "fac_punjab_farm_01",
      "location": "",
      "country_of_origin": ""
    },
    "production_date": "0001-01-01",
    "batch_size": {
      "quantity": 1000,
      "unit": "kg"
    }
  },
  "carbon_footprint": {
    "total_batch_footprint_kg_co2e": 1100,
    "intensity_per_unit": {
      "value": 1.1,
      "unit": "kg CO2e per kg"
    },
    "scope_breakdown": {
      "scope_1_direct": {
        "value_kg_co2e": 700,
        "percentage": 63.64
      },
      "scope_2_indirect_energy": {
        "value_kg_co2e": 300,
        "percentage": 27.27
      },
      "scope_3_value_chain": {
        "value_kg_co2e": 100,
        "percentage": 9.09
      }
    }
  }
}
```

---

### 5.6 GraphQL Query Interface (`POST /graphql`)

The API Gateway supports GraphQL queries for fetching passports, facilities, and enterprise topologies.

#### HTTP Request
- **Method**: `POST`
- **Endpoint**: `http://localhost:8080/graphql`
- **Headers**:
  - `Content-Type: application/json`
  - `X-Tenant-ID: org_saurient_demo`

#### HTTP Request Body:
```json
{
  "query": "{ carbonPassports { passport_id tenant_id facility_id commodity_type total_footprint_kg intensity_per_unit verification_status } }"
}
```

#### Curl Command:
```bash
curl -s -X POST http://localhost:8080/graphql \
  -H "Content-Type: application/json" \
  -H "X-Tenant-ID: org_saurient_demo" \
  -d '{"query": "{ carbonPassports { passport_id tenant_id facility_id commodity_type total_footprint_kg intensity_per_unit verification_status } }"}' | jq .
```

#### Expected GraphQL Response:
```json
{
  "data": {
    "carbonPassports": [
      {
        "passport_id": "4806cae0-30f4-49e9-aaad-7a83b7cbf34b",
        "tenant_id": "org_saurient_demo",
        "facility_id": "fac-rotterdam-01",
        "commodity_type": "Cement",
        "total_footprint_kg": 7765,
        "intensity_per_unit": 77.65,
        "verification_status": "Calculated"
      }
    ]
  }
}
```

---

### 5.7 Tanzu Nexus Graph Overview (`GET /api/v1/nexus/graph`)

Retrieve the platform's Nexus Graph node count and entity counts.

#### Curl Command:
```bash
curl -s -H "X-Tenant-ID: org_saurient_demo" \
  http://localhost:8080/api/v1/nexus/graph | jq .
```

#### Expected JSON Response:
```json
{
  "graph_overview": {
    "node_count": 10
  },
  "enterprises": [
    { "id": "ent-saurient-global", "name": "Saurient Industrial Group" }
  ],
  "facilities": [
    { "id": "fac-rotterdam-01", "name": "Rotterdam Cement Plant", "enterprise_id": "ent-saurient-global" }
  ]
}
```

---

## Teardown & Cleanup

When you have finished testing, run the `clean` target in the Makefile to tear down the Kind cluster and delete binary build artifacts:

```bash
make clean
```
