# Validation Report: Saurient Carbon Passport Platform (3-CRD Architecture)

## Overview
This document details the end-to-end validation plan and execution evidence for the 3-CRD architecture (`Product`, `CalculationRulebook`, `CarbonPassport`).

---

## Validation Checklist

1. **Unit & Integration Tests**:
   - `go test ./...` verifies all Go packages (`v1alpha1`, `api`, `controller`, `engine`, `tenant`).
2. **Binary Compilation**:
   - `go build` compiles `bin/api` and `bin/controller` without warnings or errors.
3. **Cluster & Container Rollout**:
   - Docker builds `saurient-api:dev` and `saurient-controller:dev`.
   - Kind cluster `saurient-dev` loads images and applies CRDs and deployment manifests.
4. **End-to-End Reconciler & API Lifecycle**:
   - Creating a `Product` CR triggers `ProductReconciler`.
   - Reconciler resolves `CalculationRulebook`, evaluates CEL formulas, generates child `CarbonPassport` CR with ownerReferences, and persists metrics to Postgres RLS & Redis cache.
