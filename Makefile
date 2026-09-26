# Saurient Carbon Passport Platform Makefile

CLUSTER_NAME ?= saurient-dev
CONTROLLER_IMG ?= saurient-controller:dev
API_IMG ?= saurient-api:dev

.PHONY: all build test dev-setup clean check-prereqs

all: test build

build:
	@echo "==> Building Go binaries..."
	go build -v -o bin/controller ./cmd/controller
	go build -v -o bin/api ./cmd/api

test:
	@echo "==> Running unit tests..."
	go test -v ./...

check-prereqs:
	@echo "==> Checking required CLI tools..."
	@command -v kind >/dev/null 2>&1 || { echo "Error: 'kind' is not installed."; exit 1; }
	@command -v kubectl >/dev/null 2>&1 || { echo "Error: 'kubectl' is not installed."; exit 1; }
	@command -v docker >/dev/null 2>&1 || { echo "Error: 'docker' is not installed."; exit 1; }
	@echo "Prerequisites verified: kind, kubectl, docker."

dev-setup: check-prereqs
	@echo "==> Setting up local Kind cluster: $(CLUSTER_NAME)..."
	-kind delete cluster --name $(CLUSTER_NAME)
	kind create cluster --config deploy/kind-config.yaml --name $(CLUSTER_NAME)

	@echo "==> Building Docker images..."
	docker build -f deploy/Dockerfile.controller -t $(CONTROLLER_IMG) .
	docker build -f deploy/Dockerfile.api -t $(API_IMG) .

	@echo "==> Loading Docker images into Kind..."
	kind load docker-image $(CONTROLLER_IMG) --name $(CLUSTER_NAME)
	kind load docker-image $(API_IMG) --name $(CLUSTER_NAME)

	@echo "==> Deploying PostgreSQL and Redis..."
	kubectl apply -f deploy/postgres-manifests.yaml
	kubectl rollout status deployment/postgres -n saurient-system --timeout=120s
	kubectl rollout status deployment/redis -n saurient-system --timeout=120s

	@echo "==> Applying database schema migrations..."
	@until kubectl exec -n saurient-system deploy/postgres -- pg_isready -U saurient >/dev/null 2>&1; do sleep 1; done
	kubectl exec -n saurient-system deploy/postgres -i -- psql -U saurient -d saurient_db < migrations/001_init_schema.sql

	@echo "==> Deploying Custom Resource Definitions (CRDs)..."
	kubectl apply -f deploy/crd-manifests.yaml
	kubectl wait --for=condition=established --timeout=60s crd/carbonpassports.saurient.io crd/calculationrulebooks.saurient.io

	@echo "==> Deploying Saurient Controller & API Gateway..."
	kubectl apply -f deploy/app-manifests.yaml
	kubectl rollout status deployment/saurient-controller -n saurient-system --timeout=120s
	kubectl rollout status deployment/saurient-api -n saurient-system --timeout=120s

	@echo "=========================================================================="
	@echo "Saurient Carbon Passport Platform local dev cluster is UP & READY!"
	@echo "=========================================================================="
	@echo "API Gateway endpoint: http://localhost:8080/healthz"
	@echo "Sample CarbonPassport CR created: 'cement-batch-001'"
	@echo "Check pods: kubectl get pods -A"
	@echo "Check CarbonPassport CRs: kubectl get carbonpassport -A"
	@echo "=========================================================================="

clean:
	@echo "==> Cleaning up Kind cluster and build artifacts..."
	-kind delete cluster --name $(CLUSTER_NAME)
	rm -rf bin/
