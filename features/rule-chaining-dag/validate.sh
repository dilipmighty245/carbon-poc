#!/usr/bin/env bash
set -e

echo "==> Running Go unit tests for DAG Rule Chaining, Accounting Modes, and CRD spec..."
go test -v ./...

echo "==> All validation checks passed successfully!"
