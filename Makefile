# Saurient Carbon Passport Platform Makefile

ETCD_CONTAINER ?= saurient-etcd
ETCD_IMAGE ?= quay.io/coreos/etcd:v3.5.10
CONTROLLER_IMG ?= saurient-controller:dev
API_IMG ?= saurient-api:dev

.PHONY: all build test test-e2e e2e e2e-no-mocks dev-setup dev-setup-nomock dev-setup-seed clean check-prereqs etcd-start etcd-stop

all: test build

build:
	@echo "==> Building Go binaries..."
	go build -v -o bin/controller ./cmd/controller
	go build -v -o bin/api ./cmd/api

test:
	@echo "==> Running unit tests..."
	go test -v ./...

test-e2e-no-mocks: check-prereqs clean etcd-start build
	@echo "==> Starting backend API Gateway & Controller Manager background servers [NO MOCK DATA]..."
	@./bin/api > api.log 2>&1 & echo $$! > .api.pid
	@./bin/controller > controller.log 2>&1 & echo $$! > .controller.pid
	@echo "==> Starting UI Frontend (digital-passport-app) dev server..."
	@cd digital-passport-app && npm run dev -- --host 127.0.0.1 --port 5173 > ../ui.log 2>&1 & echo $$! > ../.ui.pid
	@echo "==> Polling until API (http://localhost:8080) and UI (http://localhost:5173) are active..."
	@for i in $$(seq 1 30); do \
		if curl -s http://localhost:8080/healthz >/dev/null 2>&1 && curl -s http://localhost:5173 >/dev/null 2>&1; then \
			echo "   [OK] API Gateway (8080) & UI Frontend (5173) are ready!"; \
			break; \
		fi; \
		sleep 1; \
	done
	@echo "==> Running Backend Go E2E Integration Test Suite..."
	go test -v ./tests/...
	@echo "==> Cleaning up background servers..."
	@$(MAKE) clean

e2e-no-mocks: test-e2e-no-mocks

test-e2e: check-prereqs clean etcd-start build
	@echo "==> Starting backend API Gateway & Controller Manager background servers..."
	@./bin/api > api.log 2>&1 & echo $$! > .api.pid
	@./bin/controller > controller.log 2>&1 & echo $$! > .controller.pid
	@echo "==> Starting UI Frontend (digital-passport-app) dev server..."
	@cd digital-passport-app && npm run dev -- --host 127.0.0.1 --port 5173 > ../ui.log 2>&1 & echo $$! > ../.ui.pid
	@echo "==> Polling until API (http://localhost:8080) and UI (http://localhost:5173) are active..."
	@for i in $$(seq 1 30); do \
		if curl -s http://localhost:8080/healthz >/dev/null 2>&1 && curl -s http://localhost:5173 >/dev/null 2>&1; then \
			echo "   [OK] API Gateway (8080) & UI Frontend (5173) are ready!"; \
			break; \
		fi; \
		sleep 1; \
	done
	@echo "==> 1/2 Running Backend Go E2E Integration Test Suite..."
	go test -v ./tests/...
	@echo "==> 2/2 Running Full UI to Backend Integration E2E Test..."
	node scripts/e2e_ui_backend_test.mjs
	@echo "==> Cleaning up background servers..."
	@$(MAKE) clean

e2e: test-e2e

check-prereqs:
	@echo "==> Checking required CLI tools..."
	@command -v docker >/dev/null 2>&1 || { echo "Error: 'docker' is not installed."; exit 1; }
	@command -v go >/dev/null 2>&1 || { echo "Error: 'go' is not installed."; exit 1; }
	@command -v node >/dev/null 2>&1 || { echo "Error: 'node' is not installed."; exit 1; }
	@echo "Prerequisites verified: docker, go, node."

etcd-start:
	@echo "==> Starting local etcd container ($(ETCD_CONTAINER))..."
	-docker rm -f $(ETCD_CONTAINER) >/dev/null 2>&1
	docker run -d --name $(ETCD_CONTAINER) \
		-p 2379:2379 -p 2380:2380 \
		-e ALLOW_NONE_AUTHENTICATION=yes \
		$(ETCD_IMAGE) \
		etcd --listen-client-urls 'http://0.0.0.0:2379' --advertise-client-urls 'http://0.0.0.0:2379'
	@echo "==> etcd is running on localhost:2379"

etcd-stop:
	@echo "==> Stopping local etcd container..."
	-docker rm -f $(ETCD_CONTAINER) >/dev/null 2>&1

dev-setup-nomock: check-prereqs clean etcd-start build
	@echo "=========================================================================="
	@echo "Starting Backend Services (API Gateway & Controller Manager) [NO MOCK DATA]..."
	@echo "=========================================================================="
	@./bin/api > api.log 2>&1 & echo $$! > .api.pid
	@./bin/controller > controller.log 2>&1 & echo $$! > .controller.pid
	@echo "==> Waiting for API Gateway (http://localhost:8080) to be ready..."
	@for i in $$(seq 1 15); do \
		if curl -s http://localhost:8080/healthz >/dev/null 2>&1; then \
			echo "   [OK] API Gateway is live!"; \
			break; \
		fi; \
		sleep 1; \
	done
	@echo "=========================================================================="
	@echo "Saurient Carbon Passport Platform local dev environment is UP & READY!"
	@echo "=========================================================================="
	@echo "etcd Endpoint:                 http://localhost:2379"
	@echo "API Gateway Endpoint:          http://localhost:8080/api/v1"
	@echo "Controller Manager Binary:     ./bin/controller"
	@echo "=========================================================================="
	@echo "==> Starting Digital Passport App (React / Vite)..."
	cd digital-passport-app && npm run dev

dev-setup-seed: dev-setup

dev-setup: check-prereqs clean etcd-start build
	@echo "=========================================================================="
	@echo "Starting Backend Services (API Gateway & Controller Manager)..."
	@echo "=========================================================================="
	@./bin/api > api.log 2>&1 & echo $$! > .api.pid
	@./bin/controller > controller.log 2>&1 & echo $$! > .controller.pid
	@echo "==> Waiting for API Gateway (http://localhost:8080) to be ready..."
	@for i in $$(seq 1 15); do \
		if curl -s http://localhost:8080/healthz >/dev/null 2>&1; then \
			echo "   [OK] API Gateway is live!"; \
			break; \
		fi; \
		sleep 1; \
	done
	@echo "==> Seeding live non-mock data via API Gateway HTTP endpoints..."
	@node scripts/seed_live_data.mjs
	@echo "=========================================================================="
	@echo "Saurient Carbon Passport Platform local dev environment is UP & READY!"
	@echo "=========================================================================="
	@echo "etcd Endpoint:                 http://localhost:2379"
	@echo "API Gateway Endpoint:          http://localhost:8080/api/v1"
	@echo "Controller Manager Binary:     ./bin/controller"
	@echo "=========================================================================="
	@echo "==> Starting Digital Passport App (React / Vite)..."
	cd digital-passport-app && npm run dev

clean: etcd-stop
	@echo "==> Stopping UI frontend server, backend API Gateway, controller, and etcd..."
	-@if [ -f .api.pid ]; then kill -9 $$(cat .api.pid) >/dev/null 2>&1 || true; rm -f .api.pid; fi
	-@if [ -f .controller.pid ]; then kill -9 $$(cat .controller.pid) >/dev/null 2>&1 || true; rm -f .controller.pid; fi
	-@if [ -f .ui.pid ]; then kill -9 $$(cat .ui.pid) >/dev/null 2>&1 || true; rm -f .ui.pid; fi
	-@pkill -f "./bin/api" >/dev/null 2>&1 || true
	-@pkill -f "./bin/controller" >/dev/null 2>&1 || true
	-@pkill -f "vite" >/dev/null 2>&1 || true
	-@lsof -ti:8080 | xargs kill -9 >/dev/null 2>&1 || true
	-@lsof -ti:5173 | xargs kill -9 >/dev/null 2>&1 || true
	@echo "==> Cleaning up build artifacts and temporary log files..."
	rm -rf bin/
	rm -f api.log controller.log ui.log digital-passport-app/yarn.lock yarn.lock
	@echo "Clean completed."
