# Saurient Carbon Passport Platform

An event-driven, graph-native enterprise microservice platform built with the **Nexus Graph Framework**, **Google CEL (Common Expression Language)** calculation engine, **Kubernetes Controller Runtime**, and multi-tenant **PostgreSQL Row-Level Security (RLS)** storage.

---

## 🏛️ Architecture Overview

- **Declarative 3-CRD Architecture (`api/v1alpha1/`)**:
  - `CalculationRulebook` (`crb`): Dynamic CEL formulas for Scope 1–3 greenhouse gas emissions, functional unit definitions, and batch quantities per commodity.
  - `Product` (`prod`): Product batch registrations holding telemetry/activity data payloads, tenant context, facility ID, and `rulebookRef`.
  - `CarbonPassport` (`cp`): Auto-generated child Custom Resource managed by the `ProductReconciler` containing calculated Scope 1–3 emissions, intensity, and SHA-256 cryptographic audit digests.
- **Nexus Graph Data Model (`pkg/nexus/types.go`)**: Declares the hierarchical graph model (`Enterprise` $\rightarrow$ `Facility` $\rightarrow$ `ProductType` $\rightarrow$ `CarbonPassport`).
- **Dynamic CEL Calculation Engine (`internal/engine/`)**: Compiles and evaluates Scope 1, Scope 2, Scope 3 greenhouse gas formulas dynamically.
- **Kubernetes Operator / Reconciler (`internal/controller/`)**: Listens to `Product` CR events, evaluates CEL rules, constructs child `CarbonPassport` CRs (`ownerReferences`), writes to PostgreSQL & Redis, and updates CR `.status`.
- **Multi-Tenant PostgreSQL Storage (`migrations/`, `internal/repository/`)**: RLS-isolated database schema with append-only audit trail logging (`passport_audit_trail`).
- **API Gateway & Schema Explorer (`cmd/api/`)**:
  - Interactive **Swagger UI** at `http://localhost:8080/swagger/`
  - **GraphQL Playground** at `http://localhost:8080/graphql/playground`
  - REST Verification & Product CRUD Endpoints at `/api/v1/products` and `/api/v1/passports`

---

## 🚀 Prerequisites

Before setting up the platform locally, ensure your host environment meets the following requirements:

### 1. Required CLI Tools & Runtimes

| Tool | Minimum Version | Installation / Description |
| :--- | :--- | :--- |
| **Go** | `v1.22+` | Required for building binaries and running unit/integration tests ([Download Go](https://go.dev/dl/)) |
| **Docker Engine / Desktop** | `v24.0+` | Daemon must be running with at least **4 GB RAM** allocated ([Download Docker](https://www.docker.com/)) |
| **Kind** (Kubernetes in Docker) | `v0.20.0+` | Creates local Kubernetes dev cluster (`saurient-dev`) ([Install Kind](https://kind.sigs.k8s.io/docs/user/quick-start/#installation)) |
| **kubectl** | `v1.28+` | Kubernetes command-line tool ([Install kubectl](https://kubernetes.io/docs/tasks/tools/)) |
| **GNU Make** | Standard | Executes automated build, setup, and teardown workflows (`make dev-setup`) |
| **curl** & **jq** | Any recent | Required for running REST/GraphQL API verification scripts and formatting JSON output |

---

### 2. Network & Host Port Requirements

The local `saurient-dev` Kind cluster maps host ports for external access. Ensure these host ports are **free and not bound** by other local applications:

- **`8080`**: Saurient API Gateway (REST endpoints, Swagger UI, GraphQL Playground)
- **`5432`**: PostgreSQL Database (Direct database access)

> **Note**: If you have a local PostgreSQL daemon or web server running on ports `5432` or `8080`, stop them prior to executing `make dev-setup`:
> ```bash
> # Stop local Postgres service if active (macOS / Linux)
> brew services stop postgresql  # macOS Homebrew
> sudo systemctl stop postgresql # Linux systemd
> ```

---

### 3. Verify Prerequisites

To quickly verify that all required CLI tools are present in your `PATH`, run:

```bash
make check-prereqs
```

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
  tenantID: "org_saurient_demo"
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

Submit a new product batch with rich activity and telemetry details directly through the REST API Gateway:

```bash
curl -s -X POST http://localhost:8080/api/v1/products \
  -H "Content-Type: application/json" \
  -d '{
  "tenant_id": "org_saurient_demo",
  "batch_data": {
    "product_name": "Cocoa Butter",
    "commodity": "Cocoa",
    "batch_id": "CB-2024-001",
    "production_date": "2024-03-12T00:00:00Z",
    "facility_name": "Tema Processing Plant",
    "facility_location": "Tema, Ghana",
    "batch_size_quantity": 1000,
    "unit_of_measure": "kg",
    "export_market": "European Union (EU)"
  },
  "activity_data": {
    "scope_1_direct": {
      "fuel_type": "Diesel",
      "fuel_consumed_liters": 32.7,
      "data_source": "Sattric_Fuel_Meter_01"
    },
    "scope_2_indirect": {
      "electricity_consumed_kwh": 125.4,
      "data_source": "Sattric_Energy_Meter_Main"
    },
    "scope_3_upstream": {
      "bill_of_materials": [
        { "material_name": "Raw Cocoa Beans", "supplier_name": "Asunafo Farmers Cooperative", "quantity": 1200, "unit": "kg" },
        { "material_name": "Water", "quantity": 500, "unit": "L" }
      ],
      "packaging": { "packaging_type": "Jute Bags", "quantity": 16, "capacity_per_unit": "60 kg" },
      "logistics": { "transport_mode": "Truck", "route_origin": "Asunafo", "route_destination": "Tema" }
    }
  },
  "telemetry_context": {
    "average_temperature_c": 28.3,
    "average_humidity_percent": 64
  }
}'
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

Fetch the calculated digital carbon passport details from the API Gateway using the assigned `passport_id`:

```bash
curl -s -H "X-Tenant-ID: org_saurient_demo" \
  http://localhost:8080/api/v1/passports/aa3fd96b-46cc-46ae-89c4-ff4d6fe50c4b | jq .
```

*Expected JSON Response*:
```json
{
  "passport_metadata": {
    "passport_id": "aa3fd96b-46cc-46ae-89c4-ff4d6fe50c4b",
    "unique_qr_code": "https://verify.saurient.com/passport/aa3fd96b-46cc-46ae-89c4-ff4d6fe50c4b",
    "cryptographic_hash": "e456452758969dd26ac73b23621353eb0a6e349c80030eba307ccabe34c3403e",
    "issuance_date": "2026-09-23T16:57:04Z",
    "status": "Calculated"
  },
  "product_summary": {
    "commodity": "Cocoa",
    "product_name": "Cocoa Butter",
    "batch_number": "CB-2024-001",
    "producer_organization": "org_saurient_demo",
    "facility": {
      "name": "Tema Processing Plant",
      "location": "Tema, Ghana",
      "country_of_origin": "Ghana"
    },
    "production_date": "2024-03-12",
    "batch_size": {
      "quantity": 1000,
      "unit": "kg"
    }
  },
  "carbon_footprint": {
    "total_batch_footprint_kg_co2e": 591.57,
    "intensity_per_unit": {
      "value": 0.59,
      "unit": "kg CO2e per kg"
    },
    "scope_breakdown": {
      "scope_1_direct": {
        "value_kg_co2e": 87.64,
        "percentage": 14.81
      },
      "scope_2_indirect_energy": {
        "value_kg_co2e": 56.43,
        "percentage": 9.54
      },
      "scope_3_value_chain": {
        "value_kg_co2e": 447.5,
        "percentage": 75.65
      }
    },
    "source_breakdown": {
      "raw_materials": {
        "value_kg_co2e": 297.5,
        "percentage": 50.29
      },
      "electricity": {
        "value_kg_co2e": 56.43,
        "percentage": 9.54
      },
      "logistics_transport": {
        "value_kg_co2e": 120,
        "percentage": 20.29
      },
      "on_site_fuel": {
        "value_kg_co2e": 87.64,
        "percentage": 14.81
      },
      "packaging": {
        "value_kg_co2e": 30,
        "percentage": 5.07
      }
    }
  },
  "methodology_and_audit": {
    "standard_aligned": "GHG Protocol (Product Life Cycle Accounting)",
    "system_boundary": "Cradle-to-Gate",
    "emission_factor_database": "DEFRA 2024 (Ghana-specific factors)",
    "calculation_version": "v1.2.0",
    "data_quality_score": {
      "primary_data_percent": 70,
      "secondary_data_percent": 30,
      "overall_quality": "98%"
    },
    "verification_details": {
      "verifier_name": "AMA Ghana Independent Verification",
      "verification_date": "2026-09-23T16:57:04Z",
      "verifier_comments": "Verified against electricity meter logs, fuel invoices, and logistics logs.",
      "evidence_documents_attached": [
        "Sattric_Fuel_Meter_01_log.pdf",
        "Sattric_Energy_Meter_Main_log.pdf"
      ]
    }
  },
  "compliance_exports": {
    "cbam_ready": true,
    "target_export_market": "European Union (EU)",
    "export_formats_available": [
      "JSON",
      "XML",
      "PDF_Certificate"
    ]
  }
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
  tenantID: "org_saurient_demo"
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
curl -s -H "X-Tenant-ID: org_saurient_demo" \
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

## 💻 Web UI Dashboard (`digital-passport-app`)

The repository includes a modern React 18 + TypeScript + Tailwind CSS web dashboard (`digital-passport-app`) for viewing digital carbon passports, monitoring emissions, and creating product batches via live REST API integration.

### Starting the UI App:
```bash
cd digital-passport-app
yarn install
yarn dev
```
Open **`http://localhost:5173`** in your browser. For more details, see [`digital-passport-app/README.md`](./digital-passport-app/README.md).

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
