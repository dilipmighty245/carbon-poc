# Saurient Carbon Passport Platform Makefile

ETCD_CONTAINER ?= saurient-etcd
ETCD_IMAGE ?= quay.io/coreos/etcd:v3.5.10
CONTROLLER_IMG ?= saurient-controller:dev
API_IMG ?= saurient-api:dev

.PHONY: all build test dev-setup clean check-prereqs etcd-start etcd-stop

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

dev-setup: check-prereqs etcd-start build
	@echo "=========================================================================="
	@echo "Saurient Carbon Passport Platform local dev environment is UP & READY!"
	@echo "=========================================================================="
	@echo "etcd Endpoint:                 http://localhost:2379"
	@echo "API Gateway Binary:            ./bin/api"
	@echo "Controller Manager Binary:     ./bin/controller"
	@echo "Nexus Graph Engine:            Embedded In-Memory & etcd Key-Value Store"
	@echo "=========================================================================="
	@echo "==> Building & Starting Digital Passport App (React / Vite)..."
	cd digital-passport-app && npm run dev

clean: etcd-stop
	@echo "==> Cleaning up build artifacts..."
	rm -rf bin/
	rm -f digital-passport-app/yarn.lock yarn.lock
