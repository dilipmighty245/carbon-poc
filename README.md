# Saurient Carbon Passport Platform

An event-driven, graph-native enterprise microservice platform built with the **Nexus Graph Framework**, **Google CEL (Common Expression Language)** calculation engine, **Kubernetes Controller Runtime**, **etcd**, and multi-tenant **Digital Carbon Passport** verification storage.

---

## 🏛️ Architecture Overview

- **Declarative 3-CRD Architecture (`api/v1alpha1/`)**:
  - `CalculationRulebook` (`crb`): Dynamic CEL formulas for Scope 1–3 greenhouse gas emissions, functional unit definitions, and batch quantities per commodity.
  - `Product` (`prod`): Product batch registrations holding telemetry/activity data payloads, tenant context, facility ID, and `rulebookRef`.
  - `CarbonPassport` (`cp`): Auto-generated child resource managed by the `ProductReconciler` containing calculated Scope 1–3 emissions, intensity, and SHA-256 cryptographic audit digests.
- **Nexus Graph Data Model (`internal/nexus/`)**: In-memory and etcd-backed hierarchical graph store (`Enterprise` $\rightarrow$ `Facility` $\rightarrow$ `ProductType` $\rightarrow$ `CarbonPassport`).
- **Dynamic CEL Calculation Engine (`internal/engine/`)**: Compiles and evaluates Scope 1, Scope 2, Scope 3 greenhouse gas formulas dynamically.
- **API Gateway & Controller Manager (`cmd/api/`, `cmd/controller/`)**:
  - REST Verification & Product CRUD Endpoints at `/api/v1/products`, `/api/v1/passports`, `/api/v1/rules`, and `/api/v1/lineage/trace/{id}`.
  - Interactive **Swagger UI** at `http://localhost:8080/swagger/`
- **React Web UI (`digital-passport-app/`)**: React 18 + TypeScript + Tailwind CSS enterprise dashboard for managing passports, product setup, MRV calculations, and value chain intelligence.

---

## 🚀 Prerequisites

Ensure your host environment has the following CLI tools installed:

| Tool | Minimum Version | Description |
| :--- | :--- | :--- |
| **Go** | `v1.22+` | Builds API Gateway and Controller Manager binaries |
| **Node.js & npm** | `v18+` | Runs React/Vite UI frontend (`digital-passport-app`) |
| **Docker Engine** | `v24.0+` | Runs local `etcd` key-value store container (`saurient-etcd`) |
| **GNU Make** | Standard | Executes automated build, dev setup, and test workflows |
| **curl** & **jq** | Recent | Tests REST API endpoints |

To verify that prerequisites are available in your path:

```bash
make check-prereqs
```

---

## 🛠️ Local Development Setup

We provide Makefile targets for starting the full local environment (etcd, Go API Gateway, Controller Manager, and React Vite UI):

### Option A: Development Setup Without Mock Data (Clean State)
Starts local etcd container, builds Go binaries, launches API Gateway and Controller Manager background processes, and starts the Vite UI server — **without seeding mock data**:

```bash
make dev-setup-nomock
```

### Option B: Development Setup With Live Seeded Data
Starts local etcd, builds Go binaries, launches backend services, and automatically seeds live non-mock sample rulebooks, product batches, and passports via API Gateway HTTP calls:

```bash
make dev-setup
# or
make dev-setup-seed
```

---

## 🧪 Testing & Automation

### Run Unit Tests
```bash
make test
```

### Run End-to-End Integration Tests
Launches background etcd container, API Gateway, Controller, and Vite UI, then executes the full backend Go E2E suite and UI-to-Backend node integration test:

```bash
make e2e
```

### Run End-to-End Tests Without Mock / Seed Data
Launches background etcd container, API Gateway, Controller, and Vite UI without seeding mock data, then executes the Go E2E integration test suite:

```bash
make e2e-no-mocks
```

### Teardown & Clean Up
Stops background API Gateway, Controller, Vite UI servers, removes PID files, and cleans up the etcd container:

```bash
make clean
```

---

## 🌐 Core API Gateway Endpoints Summary

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/healthz` | Health check endpoint |
| `POST` | `/api/v1/rules` | Register a new calculation rulebook with CEL formulas |
| `GET` | `/api/v1/rules` | List registered calculation rulebooks |
| `POST` | `/api/v1/products` | Register a product batch and trigger passport issuance |
| `GET` | `/api/v1/passports` | List all registered digital carbon passports |
| `GET` | `/api/v1/passports/{id}` | Get detailed carbon passport by ID |
| `GET` | `/api/v1/lineage/trace/{id}` | Trace cross-hierarchy lineage DAG for a passport |

---

## 💻 Web UI Dashboard (`digital-passport-app`)

The repository includes a modern React web application in `digital-passport-app/`.

- **Registry View**: `http://localhost:5173/passport`
- **Passport Detail**: `http://localhost:5173/passport/detail/PASS-2026-375-v1.0`
- **Product Setup**: `http://localhost:5173/setup`
- **Government Dashboard**: `http://localhost:5173/government`

To run the UI manually:
```bash
cd digital-passport-app
npm install
npm run dev
```
