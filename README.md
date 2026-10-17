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

Open **http://carbon-passport-dev**. This target runs on macOS, Linux, native
Windows, and WSL using Node.js, Go, and Docker (Linux containers). It runs Vite on
**http://localhost:5173** and a Docker nginx proxy on `127.0.0.1:80`; port 80 must
be available. The proxy supports hot reload and forwards `/api` through Vite.

Install UI dependencies once with `npm install` in `digital-passport-app`.
Then run `make dev-setup-nomock` from the repository root. Without Make (including
Windows PowerShell), the equivalent command is:

```sh
node scripts/dev_environment.mjs start
```

Setup adds `127.0.0.1 carbon-passport-dev` to the OS hosts file if missing:
`/etc/hosts` on macOS/Linux, or
`%SystemRoot%\System32\drivers\etc\hosts` on Windows. It requests `sudo` on
macOS/Linux or Windows UAC elevation only when a write needs administrator access.
Conflicting entries stop setup with instructions to fix them. Under WSL it updates
both Linux and Windows hosts files; Windows PowerShell interoperability must be
enabled, and Docker must be available inside WSL.

Stop the UI with Ctrl+C. Backend services and containers remain available until
`make clean` or `node scripts/dev_environment.mjs clean`. Cleanup stops processes
recorded in the repository PID files and removes the dev containers, binaries,
and logs. The hosts entry remains for reuse. As before, starting this workflow
resets the local development data. Other development and E2E Make targets still
use their existing Unix shell commands.

### Option B: Development Setup With Live Seeded Data
Starts local etcd, builds Go binaries, launches backend services, and automatically seeds live non-mock sample rulebooks, product batches, and passports via API Gateway HTTP calls:

```bash
make dev-setup
# or
make dev-setup-seed
```

---

## 🧪 Testing & Automation

### Organisation registration

The wizard submits one `POST /api/v1/organisation/register` request containing `profile`, `owner` credentials, and explicit `declarations`. The API generates the tenant ID, rejects duplicate emails and duplicate registration-number/country pairs, and returns a matching owner, tenant, profile, and token. New organisations start as `Pending Verification`; documents are collected during verification.

Profiles are stored as `spec.profileRaw` in the Tenant resource. Deploy the updated Tenant CRD and API together. Kubernetes-backed data survives API restarts; the development FakeClient remains intentionally in memory and loses all data when its process stops. Apply the compiler-generated CRDs in `build/crds` for a Nexus deployment.

Tenant and User writes use compensating rollback because Kubernetes cannot transact across both resources. Duplicate checks are serialized within one API process. Multi-replica registration requires a shared lock or transactional uniqueness store before enabling concurrent registration writers. Interrupted registrations remain marked `Registration Pending` for review.

### Review existing registrations

Export the deployed records and audit them without modifying any data:

```bash
kubectl get tenants.inventory.saurient.io -o json > tenants.json
kubectl get users.inventory.saurient.io -o json > users.json
node scripts/audit_registrations.mjs tenants.json users.json
```

The audit flags incomplete legacy profiles, missing active owners, duplicate identities, and interrupted registrations. Exit code 2 means findings exist. Legacy fields lost before this change must be recovered from an existing company export or re-entered by its owner; do not invent verification details or passwords. Review each interrupted registration before retrying or deleting it. User exports contain credential hashes: keep them private and do not commit them.

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
- **Passport Detail**: `http://localhost:5173/passport?id=PASS-2026-981-v1.0`
- **Product Setup**: `http://localhost:5173/products/new`
- **Trace Carbon Lineage**: `http://localhost:5173/trace`
- **Government Dashboard**: `http://localhost:5173/government`

To run the UI manually:
```bash
cd digital-passport-app
npm install
npm run dev
```
