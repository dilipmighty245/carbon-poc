# Validation Strategy: Rule Chaining (DAG), Accounting Modes, & Storage Isolation

## 1. Unit Test Verification
Run all unit tests across packages:
```bash
go test -v ./...
```
Expected output: All packages (`api/v1alpha1`, `cmd/api`, `internal/controller`, `internal/engine`, `internal/tenant`) pass.

## 2. DAG Engine & Accounting Mode Scenarios
- **Test 1: Rice DAG Rule Chaining** (`TestCELEngine_DAG_RiceScenario`): Validates multi-stage calculations ($R01 \dots R07 \rightarrow R08 \rightarrow R09$) with correct intermediate rule breakdown.
- **Test 2: Cycle Detection** (`TestCELEngine_DAG_CycleDetection`): Validates circular dependency detection in Kahn's topological sorter.
- **Test 3: Accounting Modes** (`TestCELEngine_AccountingModes`): Validates filtering rules by accounting standard (`pcf`, `ghg`, `cbam`).
