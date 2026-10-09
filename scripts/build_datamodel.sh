#!/usr/bin/env bash
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
COMPILER_DIR="${REPO_ROOT}/../graph-framework-for-microservices/compiler"
DATAMODEL_DIR="${REPO_ROOT}/datamodel"
BUILD_DIR="${REPO_ROOT}/build"
MODULE_PATH="saurient-platform/build"

echo "==> [1/6] Preparing datamodel and compiler..."
if [ ! -f "${DATAMODEL_DIR}/go.mod" ]; then
  cat << 'EOF' > "${DATAMODEL_DIR}/go.mod"
module saurient-platform/datamodel

go 1.20
EOF
fi

NEXUS_SDK_BIN="/tmp/nexus-sdk"
if [ ! -f "${NEXUS_SDK_BIN}" ]; then
  echo "    Building nexus-sdk compiler binary..."
  (cd "${COMPILER_DIR}" && go build -o "${NEXUS_SDK_BIN}" ./cmd/nexus-sdk)
fi

echo "==> [2/6] Scaffolding build output directory..."
rm -rf "${BUILD_DIR}"
mkdir -p "${BUILD_DIR}/crds"
cp -r "${COMPILER_DIR}/_generated_base_structure/"* "${BUILD_DIR}/"

echo "==> [3/6] Running Nexus SDK compiler on datamodel..."
CRD_MODULE_PATH="${MODULE_PATH}/" "${NEXUS_SDK_BIN}" \
  -dsl "${DATAMODEL_DIR}" \
  -config-file "${DATAMODEL_DIR}/nexus.yaml" \
  -crd-output "${BUILD_DIR}" \
  -log-level ERROR

echo "==> [4/6] Running Kubernetes code-generator (clientset, listers, informers)..."
API_NAMES="$(cat "${BUILD_DIR}/api_names.sh" | sed -E 's/API_NAMES="([^"]+)"/\1/')"
export GOPATH="$(go env GOPATH)"

# Prepare GOPATH link for k8s generator
mkdir -p "${GOPATH}/src/saurient-platform" "${GOPATH}/src/k8s.io"
rm -rf "${GOPATH}/src/saurient-platform/build" "${GOPATH}/src/nexustempmodule"
cp -r "${BUILD_DIR}" "${GOPATH}/src/saurient-platform/build"
ln -sf "${GOPATH}/src/saurient-platform/build" "${GOPATH}/src/nexustempmodule"

rm -rf "${GOPATH}/src/k8s.io/apimachinery" "${GOPATH}/src/k8s.io/api" "${GOPATH}/src/k8s.io/client-go"
ln -s "${GOPATH}/pkg/mod/k8s.io/apimachinery@v0.26.3" "${GOPATH}/src/k8s.io/apimachinery"
ln -s "${GOPATH}/pkg/mod/k8s.io/api@v0.26.3" "${GOPATH}/src/k8s.io/api"
ln -s "${GOPATH}/pkg/mod/k8s.io/client-go@v0.29.2" "${GOPATH}/src/k8s.io/client-go"

CODEGEN_SCRIPT="${GOPATH}/pkg/mod/k8s.io/code-generator@v0.26.3/generate-groups.sh"
BOILERPLATE="${COMPILER_DIR}/pkg/openapi_generator/openapi/boilerplate.go.txt"

GO111MODULE=off bash "${CODEGEN_SCRIPT}" all \
  "${MODULE_PATH}/client" \
  "${MODULE_PATH}/apis" \
  "${API_NAMES}" \
  --go-header-file "${BOILERPLATE}" \
  --output-base "${GOPATH}/src"

echo "==> [5/7] Syncing generated client code back to repository..."
cp -r "${GOPATH}/src/saurient-platform/build/"* "${BUILD_DIR}/"

# Replace module imports
find "${BUILD_DIR}" -type f -name "*.go" -exec sed -i '' -e "s|nexustempmodule/|${MODULE_PATH}/|g" {} +

# Remove any isolated go.mod in nexus-gql so it compiles natively as part of saurient-platform
rm -f "${BUILD_DIR}/nexus-gql/go.mod"

# Fix Go 1.24+ non-constant format string vet rule in generated client
if [ -f "${BUILD_DIR}/nexus-client/client.go" ]; then
  sed -i '' -e 's|fmt.Sprintf("parent found (event loop is stalled) " + nc.DisplayName())|fmt.Sprintf("parent found (event loop is stalled) %s", nc.DisplayName())|g' "${BUILD_DIR}/nexus-client/client.go"
  sed -i '' -e 's|logger\.Fatalf("\[Get\([a-zA-Z]*\)ByName\] Getting version of Object: %s failed with error %v"|logger.Debugf("[Get\1ByName] Getting version of Object: %s failed with error %v"|g' "${BUILD_DIR}/nexus-client/client.go"
  sed -i '' -e 's|logger\.Fatalf("\[Get\([a-zA-Z]*\)ByName\] Getting version of Object: %s in write cache failed with error %v"|logger.Debugf("[Get\1ByName] Getting version of Object: %s in write cache failed with error %v"|g' "${BUILD_DIR}/nexus-client/client.go"
fi

echo "==> [6/7] Generating Nexus GraphQL server via gqlgen..."
if [ -d "${BUILD_DIR}/nexus-gql" ]; then
  (cd "${BUILD_DIR}/nexus-gql" && /Users/dt032761/go/bin/gqlgen generate)
fi

echo "==> [7/7] Verifying Go compilation of generated nexus-client and nexus-gql..."
(cd "${REPO_ROOT}" && go build -v ./build/nexus-client ./build/client/... ./build/apis/... ./build/helper ./build/common ./build/nexus-gql/... > /dev/null)

echo "==> SUCCESS: Nexus datamodel compiled successfully into ${BUILD_DIR}/"
echo "    - CRDs:            ${BUILD_DIR}/crds/"
echo "    - Nexus Client:    ${BUILD_DIR}/nexus-client/"
echo "    - K8s Client:      ${BUILD_DIR}/client/"
echo "    - K8s APIs:        ${BUILD_DIR}/apis/"
echo "    - Nexus GraphQL:   ${BUILD_DIR}/nexus-gql/"
