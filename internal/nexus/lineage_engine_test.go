package nexus

import (
	"context"
	"testing"
)

func TestNexusEngine_GetLineageDAG(t *testing.T) {
	getStore().seedDefaultData()
	engine := GetNexusEngine()
	ctx := context.Background()

	dag, err := engine.GetLineageDAG(ctx, "PASS-2026-981-v1.0")
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	if dag == nil {
		t.Fatalf("expected non-nil lineage DAG")
	}

	if len(dag.Nodes) < 9 {
		t.Errorf("expected at least 9 Nexus graph nodes, got %d", len(dag.Nodes))
	}

	if len(dag.Edges) < 10 {
		t.Errorf("expected at least 10 Nexus graph edges, got %d", len(dag.Edges))
	}
}

func TestNexusEngine_CorrectSupplierInput_Immutability(t *testing.T) {
	getStore().seedDefaultData()
	engine := GetNexusEngine()
	ctx := context.Background()

	req := InputCorrectionRequest{
		InputNodeID: "NODE_IN_SUP_409",
		NewValue:    0.720,
		Unit:        "kgCO2e/kg",
		Reason:      "Supplier updated Scope 3 declaration with revised scrap percentage",
		UserRef:     "user-audit-lead",
	}

	res, err := engine.CorrectSupplierInput(ctx, req)
	if err != nil {
		t.Fatalf("unexpected error during supplier input correction: %v", err)
	}

	if !res.OriginalPassportFrozen {
		t.Errorf("CRITICAL SECURITY RISK: Original passport v1.0 must remain frozen! Got frozen=%v", res.OriginalPassportFrozen)
	}

	if res.OriginalCalcVersion != "v1.0" || res.NewCalcVersion != "v1.1" {
		t.Errorf("expected version transition v1.0 -> v1.1, got %s -> %s", res.OriginalCalcVersion, res.NewCalcVersion)
	}

	if res.NewIntensityKgCO2e <= res.OriginalIntensityKgCO2e {
		t.Errorf("expected intensity to increase from %f, got %f", res.OriginalIntensityKgCO2e, res.NewIntensityKgCO2e)
	}

	// Verify updated DAG contains new nodes v1.1
	updatedDAG, _ := engine.GetLineageDAG(ctx, "PASS-2026-981-v1.0")
	foundNewCalc := false
	for _, n := range updatedDAG.Nodes {
		if n.NodeID == "NODE_CALC_V1_1" {
			foundNewCalc = true
			break
		}
	}
	if !foundNewCalc {
		t.Errorf("expected new calculation node NODE_CALC_V1_1 to be present in updated Nexus graph")
	}
}
