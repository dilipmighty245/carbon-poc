# Task 1 Report: Define CRD Go Types and YAML Manifests

## Status: DONE

## Changes Made

### 1. Created `api/v1alpha1/product_types.go`
- `LocalObjectReference` struct with `Name` and `Namespace` (shared by Product and CarbonPassport)
- `ProductSpec`: TenantID, FacilityID, BatchID, ProductName, CommodityType, ActivityDataRaw, RulebookRef (LocalObjectReference)
- `ProductStatus`: Phase (Pending/Calculated/Failed), PassportRef (LocalObjectReference), TotalFootprintKg, DataHash, LastUpdated
- `Product` and `ProductList` with kubebuilder annotations (`+kubebuilder:object:root=true`, `+kubebuilder:subresource:status`, `shortName=prod`) and full DeepCopy methods

### 2. Updated `api/v1alpha1/carbonpassport_types.go`
- Replaced old `ActivityDataRaw`/`RulebookVersion` spec fields with 3-CRD spec: ProductRef, DataHash, Scope1KgCO2e, Scope2KgCO2e, Scope3KgCO2e, TotalFootprintKg, CalculationDetails
- Updated `CarbonPassportStatus`: replaced DataHash/TotalFootprintKg with CryptographicHash and IssuedAt

### 3. Updated `api/v1alpha1/groupversion_info.go`
- Registered `Product` and `ProductList` in `addKnownTypes`

### 4. Updated `deploy/crd-manifests.yaml`
- Rewrote carbonpassports CRD schema to match new spec/status fields
- Added new `products.saurient.io` CRD with full openAPIV3Schema, `shortName=prod`, status subresource

### 5. Updated `internal/controller/carbonpassport_controller.go`
- Fixed field references to compile with new types (ActivityDataRaw→CalculationDetails, DataHash moved to Spec, RulebookVersion removed, TotalFootprintKg moved to Spec, Status uses CryptographicHash)

## Validation

```
$ go test ./api/v1alpha1/... -v
=== RUN   TestProductSpec
--- PASS: TestProductSpec (0.00s)
=== RUN   TestProductStatus
--- PASS: TestProductStatus (0.00s)
=== RUN   TestProductDeepCopy
--- PASS: TestProductDeepCopy (0.00s)
=== RUN   TestCarbonPassportSpec
--- PASS: TestCarbonPassportSpec (0.00s)
=== RUN   TestCarbonPassportStatus
--- PASS: TestCarbonPassportStatus (0.00s)
PASS
ok  	saurient-platform/api/v1alpha1	0.260s

$ go build ./...
(exit 0 — no errors)

$ go test ./...
ok  	saurient-platform/api/v1alpha1	0.260s
ok  	saurient-platform/internal/engine	1.151s
ok  	saurient-platform/internal/tenant	0.635s
```

---

## Round 1 Fixes — Quality Review Findings

### Finding 1: Example CRs updated in `deploy/app-manifests.yaml`
- Added a `Product` CR example (`cement-product-001`) with all current `ProductSpec` fields: `tenantID`, `facilityID`, `batchID`, `productName`, `commodityType`, `activityDataRaw`, `rulebookRef`.
- Replaced the old `CarbonPassport` example that used deleted fields (`rulebookVersion`, `activityDataRaw`) with a corrected example using new fields: `productRef`, `dataHash`, `scope1KgCO2e`, `scope2KgCO2e`, `scope3KgCO2e`, `totalFootprintKg`, `calculationDetails`.

### Finding 2: ClusterRole updated in `deploy/app-manifests.yaml`
- Added `products` and `products/status` to the `saurient.io` apiGroup resource list so the controller SA has RBAC permission to manage the new Product CRD.

### Finding 3: UUID assigned before `SavePassportAndAudit` in `internal/controller/carbonpassport_controller.go`
- When `passport.Status.PassportID == ""`, a `uuid.New().String()` is now assigned to `passportModel.PassportID` and `auditModel.PassportID` **before** calling `SavePassportAndAudit`, ensuring the Postgres row and audit trail both carry a valid, stable identifier from creation.

### Round 1 Validation

```
$ go build ./...
(exit 0 — no errors)

$ go test ./api/v1alpha1/... ./internal/engine/... ./internal/tenant/...
ok  	saurient-platform/api/v1alpha1	(cached)
ok  	saurient-platform/internal/engine	(cached)
ok  	saurient-platform/internal/tenant	(cached)
```
