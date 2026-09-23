# Design Document: Saurient Carbon Passport Platform (3-CRD Architecture)

## Context & Overview
The Saurient Carbon Passport Platform is a multi-tenant agritech & industrial carbon accounting solution built on top of Kubernetes Custom Resource Definitions (CRDs), PostgreSQL Row-Level Security (RLS), and Redis caching.

This design updates the system to a declarative **3-CRD architecture**:
1. `CalculationRulebook` (`crb`): Defines dynamic CEL calculation formulas and functional units for commodities.
2. `Product` (`prod`): Represents registered product batches with activity and telemetry metrics.
3. `CarbonPassport` (`cp`): Child CR generated and managed automatically by the `ProductReconciler`, containing computed Scope 1-3 greenhouse gas emissions, unit intensity, and cryptographic audit digests.

---

## Architectural Principles
- **SOLID & Modular Design**: Single responsibility per CRD; decoupled calculation engine from API gateway and persistence layers.
- **Declarative Parent-Child Ownership**: `Product` CR controls `CarbonPassport` CR lifecycle using Kubernetes `ownerReferences`, enabling automatic garbage collection.
- **Multi-Tenant Row-Level Security (RLS)**: PostgreSQL queries enforced with `FORCE ROW LEVEL SECURITY` and `SET LOCAL app.current_tenant`.
- **Sub-Millisecond Read Performance**: High-throughput GET API reads directly from Redis cache (`tenant_id:passport_id`).

---

## CRD Schemas & Data Models

### 1. CalculationRulebook CRD (`calculationrulebooks.saurient.io`)
- **Group/Version**: `saurient.io/v1alpha1`
- **Scope**: Namespaced
- **Spec**:
  - `commodityType`: `string` (e.g. "Cocoa", "Cement")
  - `version`: `string` (e.g. "v1.2.0")
  - `scope1Formula`: `string` (CEL expression)
  - `scope2Formula`: `string` (CEL expression)
  - `scope3Formula`: `string` (CEL expression)
  - `functionalUnit`: `string` (e.g. "kg CO2e per kg")
  - `batchQuantity`: `float64`

### 2. Product CRD (`products.saurient.io`)
- **Group/Version**: `saurient.io/v1alpha1`
- **Scope**: Namespaced
- **Spec**:
  - `tenantID`: `string`
  - `facilityID`: `string`
  - `batchID`: `string`
  - `productName`: `string`
  - `commodityType`: `string`
  - `activityDataRaw`: `string` (JSON payload containing Scope 1-3 fuel, power, materials, packaging, logistics)
  - `rulebookRef`: `LocalObjectReference` (`name`, `namespace`)
- **Status**:
  - `phase`: `string` (`Pending`, `Calculated`, `Failed`)
  - `passportRef`: `LocalObjectReference` (`name`, `namespace`)
  - `totalFootprintKg`: `float64`
  - `dataHash`: `string`
  - `lastUpdated`: `metav1.Time`

### 3. CarbonPassport CRD (`carbonpassports.saurient.io`)
- **Group/Version**: `saurient.io/v1alpha1`
- **Scope**: Namespaced
- **Spec**:
  - `tenantID`: `string`
  - `facilityID`: `string`
  - `batchID`: `string`
  - `commodityType`: `string`
  - `productRef`: `string`
  - `scope1KgCO2e`: `float64`
  - `scope2KgCO2e`: `float64`
  - `scope3KgCO2e`: `float64`
  - `totalFootprintKg`: `float64`
  - `dataHash`: `string`
  - `calculationDetails`: `string` (JSON snapshot)
- **Status**:
  - `phase`: `string` (`Verified`, `Calculated`)
  - `passportID`: `string`
  - `cryptographicHash`: `string`
  - `issuedAt`: `metav1.Time`
  - `lastUpdated`: `metav1.Time`

---

## Controller Reconciler Pipeline Flow

```
+-------------------+      1. Watch Event       +-------------------+
|    Product CR     | ------------------------> | ProductReconciler |
+-------------------+                           +-------------------+
                                                          |
                                                          | 2. Fetch Rule
                                                          v
                                               +----------------------+
                                               | CalculationRulebook  |
                                               +----------------------+
                                                          |
                                                          | 3. Evaluate CEL
                                                          v
                                               +----------------------+
                                               |  Dynamic CEL Engine  |
                                               +----------------------+
                                                          |
                                                          | 4. Create/Update Child
                                                          v
                                               +----------------------+
                                               |  CarbonPassport CR   |
                                               +----------------------+
                                                          |
                                                          | 5. Sync Stores
                                                          v
                                               +----------------------+
                                               | Postgres RLS & Redis |
                                               +----------------------+
```

1. **Reconciler Trigger**: `ProductReconciler` intercepts `Product` CR events.
2. **Rulebook Resolution**: Fetches `CalculationRulebook` CR referenced in `spec.rulebookRef` (or fallback defaults).
3. **CEL Formula Evaluation**: Evaluates `scope1Formula`, `scope2Formula`, `scope3Formula` against activity data.
4. **Child CarbonPassport Management**: Creates/updates child `CarbonPassport` CR using `metav1.SetControllerReference(product, passport, scheme)`.
5. **Backing Store Sync**: Persists to PostgreSQL via RLS transaction (`SavePassportAndAudit` / `UpdatePassportAndAudit`) and caches rich passport payload in Redis (`tenant_id:passport_id`).
6. **Status Update**: Updates `Product.status` (`passportRef`, `phase: Calculated`, `dataHash`).

---

## API Gateway REST Endpoints

1. `POST /api/v1/products`: Accepts batch/activity payload, creates a `Product` CR in Kubernetes via `k8sClient`.
2. `POST /api/v1/passports`: Creates `Product` CR, triggers evaluation, and returns calculated rich Digital Carbon Passport JSON.
3. `GET /api/v1/passports/{id}`: Sub-millisecond lookup from Redis cache with PostgreSQL RLS fallback.

---

## Implementation Tasks

### Task 1: Define CRD Go Structs and YAML Manifests
- Create `api/v1alpha1/product_types.go` with `ProductSpec` and `ProductStatus`.
- Update `api/v1alpha1/carbonpassport_types.go` and `api/v1alpha1/calculationrulebook_types.go`.
- Update `deploy/crd-manifests.yaml` to include CustomResourceDefinition for `products.saurient.io`, `carbonpassports.saurient.io`, and `calculationrulebooks.saurient.io`.

### Task 2: Implement ProductReconciler
- Create `internal/controller/product_controller.go` implementing `ProductReconciler`.
- On `Product` CR reconciliation: fetch referenced `CalculationRulebook`, evaluate CEL formulas, create/update child `CarbonPassport` CR using `metav1.SetControllerReference`, persist to Postgres RLS DB & Redis cache, and set `Product.status`.

### Task 3: Update API Gateway Endpoints
- Update `cmd/api/main.go` to support `POST /api/v1/products` (creates Product CR) and `GET /api/v1/passports/{id}` (queries Redis/Postgres).

### Task 4: Code Review
- Code review: `rocket-agent route --task-type code-review --prompt "/code-review feature/saurient-carbon-passport high --fix"`

### Task 5: End-to-End Validation
- Write `features/saurient-carbon-passport/validation.md` + `features/saurient-carbon-passport/validate.sh`; run `bash features/saurient-carbon-passport/validate.sh`.

### Task 6: Branch Completion
- Squash and finish: invoke `tanzu-finishing-a-development-branch`.
