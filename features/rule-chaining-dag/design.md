# Design Specification: Rule Chaining (DAG), Accounting Modes, & Storage Isolation

## Overview

This specification introduces **Rule Chaining via Directed Acyclic Graphs (DAG)**, explicit **Carbon Accounting Standard Modes (`PCF`, `GHG`, `CBAM`)**, **Day-1 Tenant Isolation**, and clear architectural storage boundaries between **Kubernetes CRDs/etcd** and **Time-Series Telemetry (Sattric+)**.

---

## 1. System Architecture & Component Boundaries

### 1.1 Architectural Storage Boundaries
- **Kubernetes CRDs & etcd (Declarative State Only)**: etcd holds exclusively high-level rulebook configurations (`CalculationRulebook`), product metadata/batch parameters (`Product`), and calculated output certificates (`CarbonPassport`). Individual meter/sensor readings are strictly excluded from etcd.
- **Time-Series Database (Sattric+ Telemetry)**: High-frequency meter pulses, SCADA data, and continuous energy telemetry are stored in an external Time-Series DB (e.g., TimescaleDB / InfluxDB). The CEL engine consumes pre-aggregated batch activity summaries passed in the `Product` payload or retrieved from the Time-Series DB.
- **PostgreSQL Multi-Tenant Storage (RLS)**: Persists `carbon_passports` and append-only `passport_audit_trail` with PostgreSQL Row-Level Security (`app.current_tenant` setting) enforcing strict tenant isolation.

### 1.2 Multi-Accounting Modes (`PCF`, `GHG`, `CBAM`)
Each rule definition specifies its target accounting standard:
- `pcf`: Product Carbon Footprint (ISO 14067 / cradle-to-gate functional unit intensity).
- `ghg`: GHG Protocol Corporate Value Chain (Scope 1, 2, and 3 emissions).
- `cbam`: EU Carbon Border Adjustment Mechanism (embedded direct/indirect emissions for specified EU tariffs).

---

## 2. CRD Data Model & Engine Extensions

### 2.1 `CalculationRulebook` CRD Extensions (`api/v1alpha1/calculationrulebook_types.go`)

```go
type RuleScope string
type RuleOutputType string
type AccountingMode string

const (
	Scope1       RuleScope = "scope1"
	Scope2       RuleScope = "scope2"
	Scope3       RuleScope = "scope3"
	Intermediate RuleScope = "intermediate"

	OutputNone           RuleOutputType = "none"
	OutputTotalFootprint RuleOutputType = "total_footprint"
	OutputIntensity      RuleOutputType = "intensity"

	ModePCF  AccountingMode = "pcf"
	ModeGHG  AccountingMode = "ghg"
	ModeCBAM AccountingMode = "cbam"
	ModeAll  AccountingMode = "all"
)

type RuleDefinition struct {
	ID          string         `json:"id"`                    // e.g. "R01", "R08", "R09"
	Name        string         `json:"name,omitempty"`       // Human readable name (e.g. "Rice Methane")
	Scope       RuleScope      `json:"scope"`                 // scope1 | scope2 | scope3 | intermediate
	Mode        AccountingMode `json:"mode,omitempty"`        // pcf | ghg | cbam | all
	OutputType  RuleOutputType `json:"outputType,omitempty"`  // total_footprint | intensity | none
	Formula     string         `json:"formula"`               // CEL expression (e.g. "R01 + R02 + R03 - R07")
	Description string         `json:"description,omitempty"`
}

type CalculationRulebookSpec struct {
	CommodityType  string           `json:"commodityType"`
	Version        string           `json:"version"`
	AccountingMode AccountingMode   `json:"accountingMode,omitempty"` // Default accounting mode
	Rules          []RuleDefinition `json:"rules,omitempty"`          // Chained DAG rules
	Scope1Formula  string           `json:"scope1Formula,omitempty"`  // Legacy fallback
	Scope2Formula  string           `json:"scope2Formula,omitempty"`  // Legacy fallback
	Scope3Formula  string           `json:"scope3Formula,omitempty"`  // Legacy fallback
	FunctionalUnit string           `json:"functionalUnit"`
	BatchQuantity  float64          `json:"batchQuantity,omitempty"`
}
```

---

## 3. DAG Evaluation Algorithm (Kahn's Algorithm)

The `CELEngine` (`internal/engine/cel_engine.go`) implements topological sorting and DAG cycle detection:

1. **AST Identifier Parsing & Dependency Graph Construction**:
   - For each `RuleDefinition`, parse its CEL formula expression to extract variable identifiers.
   - Build a Directed Graph $G = (V, E)$ where nodes $V$ are rule IDs and an edge $(R_j, R_i)$ exists if rule $R_i$ references rule $R_j$.
2. **Cycle Detection (Kahn's Algorithm)**:
   - Compute in-degrees for all nodes.
   - Queue nodes with in-degree 0 (rules depending solely on raw activity data variables).
   - If total processed nodes $< |V|$ when queue is empty, reject the rulebook with a `CircularDependencyError`.
3. **Incremental CEL Context Evaluation**:
   - Evaluate rules sequentially according to topological order.
   - Inject each rule's output value into the evaluation variable context (`normalizedVars[rule.ID] = value`).
   - Downstream rules (e.g., $R08 = R01 + R02 + \dots - R07$ and $R09 = R08 / \text{total\_kg\_rice}$) evaluate natively with zero redundancy.

---

## 4. Verification & Testing Strategy

- **Unit Tests**:
  - Test DAG topological sort and cycle detection (e.g., $R01 \rightarrow R02 \rightarrow R01$ throws error).
  - Test complex Rice calculation scenario ($R01 \dots R07 \rightarrow R08 \rightarrow R09$).
  - Test legacy backward-compatibility when `Rules` array is empty.
- **Integration Tests**:
  - Reconcile `CalculationRulebook` CR with DAG rules.
  - Reconcile `Product` CR and verify child `CarbonPassport` contains `rule_results` trace in `calculationDetails`.

---

## Implementation Tasks

- [ ] Task 1: Update CRD types in `api/v1alpha1/calculationrulebook_types.go` and internal engine types in `internal/engine/types.go`
- [ ] Task 2: Update CRD manifest `deploy/crd-manifests.yaml` to include `rules`, `mode`, and `outputType` in `calculationrulebooks.saurient.io` openAPIV3Schema
- [ ] Task 3: Implement Kahn's Algorithm DAG topological sorter & cycle detector in `internal/engine/cel_engine.go`
- [ ] Task 4: Add unit tests for DAG rule chaining, cycle detection, and accounting modes in `internal/engine/cel_engine_test.go`
- [ ] Task 5: Update controllers (`internal/controller/product_controller.go` & `carbonpassport_controller.go`) to use DAG evaluation & rich passport serialization
- [ ] Task 6: Code review: `rocket-agent route --task-type code-review --prompt "/code-review <branch> high --fix"`
- [ ] Task 7: Validation: write `features/rule-chaining-dag/validation.md` + `features/rule-chaining-dag/validate.sh`; run `bash features/rule-chaining-dag/validate.sh`
- [ ] Task 8: Squash and finish: invoke `tanzu-finishing-a-development-branch`
