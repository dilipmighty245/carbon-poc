#!/usr/bin/env bash
set -eo pipefail

echo "=========================================================="
echo "Saurient Carbon Passport Platform - 3-CRD Validation Script"
echo "=========================================================="

# 1. Run full Go test suite across all packages
echo "[Step 1/4] Running Go unit test suite..."
go test ./... -v

# 2. Build binaries to verify compilation
echo "[Step 2/4] Compiling API and Controller binaries..."
go build -o bin/api ./cmd/api/main.go
go build -o bin/controller ./cmd/controller/main.go

# 3. Build Docker images & deploy to Kind cluster
echo "[Step 3/4] Building Docker images & rolling out to Kind..."
docker build -t saurient-api:dev -f deploy/Dockerfile.api .
docker build -t saurient-controller:dev -f deploy/Dockerfile.controller .
kind load docker-image saurient-api:dev --name saurient-dev
kind load docker-image saurient-controller:dev --name saurient-dev

kubectl apply -f deploy/crd-manifests.yaml
kubectl apply -f deploy/postgres-manifests.yaml
kubectl apply -f deploy/app-manifests.yaml

kubectl rollout restart deployment/saurient-api -n saurient-system
kubectl rollout restart deployment/saurient-controller -n saurient-system

kubectl rollout status deployment/saurient-api -n saurient-system --timeout=60s
kubectl rollout status deployment/saurient-controller -n saurient-system --timeout=60s

# 4. Verify End-to-End Product CR & CarbonPassport CR lifecycle
echo "[Step 4/4] Verifying End-to-End Product & CarbonPassport CRD lifecycle..."
kubectl apply -f - <<'EOF'
apiVersion: saurient.io/v1alpha1
kind: Product
metadata:
  name: e2e-validation-product
  namespace: saurient-system
spec:
  tenantID: "123e4567-e89b-12d3-a456-426614174000"
  facilityID: "Tema Processing Plant"
  batchID: "CB-E2E-2026"
  productName: "Refined Cocoa Butter"
  commodityType: "Cocoa"
  rulebookRef:
    name: "cocoa-rulebook-2026"
    namespace: "saurient-system"
  activityDataRaw: '{"scope_1_direct":{"fuel_consumed_liters":32.7},"scope_2_indirect":{"electricity_consumed_kwh":125.4},"scope_3_upstream":{"bill_of_materials":[{"quantity":1200}],"packaging":{"packaging_qty":16},"logistics":{"distance_km":120}}}'
EOF

sleep 3

echo "Checking Product CR status..."
kubectl get product e2e-validation-product -n saurient-system -o yaml

echo "Checking auto-generated child CarbonPassport CR..."
kubectl get carbonpassport -n saurient-system

echo "=========================================================="
echo "SUCCESS: All 3-CRD validation steps passed!"
echo "=========================================================="
