package engine

import (
	"context"
	"testing"
)

func TestCELEngine_CementScenario(t *testing.T) {
	engine := NewCELEngine()

	rulebook := CalculationRulebook{
		CommodityType:  "Cement",
		Version:        "2026.1",
		Scope1Formula:  "(fuel_liters * fuel_ef) + (limestone_tons * calcination_ef)",
		Scope2Formula:  "(electricity_kwh * grid_ef) - (renewable_ppa_kwh * ppa_offset_ef)",
		Scope3Formula:  "(raw_material_kg * material_ef) + (freight_ton_km * transport_ef)",
		FunctionalUnit: "metric ton",
		BatchQuantity:  100.0,
	}

	activityData := map[string]interface{}{
		"fuel_liters":        500.0,
		"fuel_ef":            2.68,   // 500 * 2.68 = 1340 kg CO2e
		"limestone_tons":     10.0,
		"calcination_ef":     440.0,  // 10 * 440 = 4400 kg CO2e => Scope 1 = 5740
		"electricity_kwh":    2000.0,
		"grid_ef":            0.85,   // 2000 * 0.85 = 1700 kg CO2e
		"renewable_ppa_kwh":  500.0,
		"ppa_offset_ef":      0.85,   // 500 * 0.85 = 425 kg CO2e => Scope 2 = 1275
		"raw_material_kg":    5000.0,
		"material_ef":        0.12,   // 5000 * 0.12 = 600 kg CO2e
		"freight_ton_km":     1000.0,
		"transport_ef":       0.15,   // 1000 * 0.15 = 150 kg CO2e => Scope 3 = 750
	}

	result, err := engine.Evaluate(context.Background(), rulebook, activityData)
	if err != nil {
		t.Fatalf("Evaluate failed: %v", err)
	}

	expectedScope1 := 5740.0
	expectedScope2 := 1275.0
	expectedScope3 := 750.0
	expectedTotal := expectedScope1 + expectedScope2 + expectedScope3 // 7765.0
	expectedIntensity := expectedTotal / 100.0                       // 77.65

	if result.Scope1Kg != expectedScope1 {
		t.Errorf("Scope 1 expected %f, got %f", expectedScope1, result.Scope1Kg)
	}

	if result.Scope2Kg != expectedScope2 {
		t.Errorf("Scope 2 expected %f, got %f", expectedScope2, result.Scope2Kg)
	}

	if result.Scope3Kg != expectedScope3 {
		t.Errorf("Scope 3 expected %f, got %f", expectedScope3, result.Scope3Kg)
	}

	if result.TotalFootprintKg != expectedTotal {
		t.Errorf("Total footprint expected %f, got %f", expectedTotal, result.TotalFootprintKg)
	}

	if result.IntensityPerUnit != expectedIntensity {
		t.Errorf("Intensity per unit expected %f, got %f", expectedIntensity, result.IntensityPerUnit)
	}

	if len(result.DataHash) != 64 {
		t.Errorf("expected 64 character SHA-256 hash, got %s (len %d)", result.DataHash, len(result.DataHash))
	}
}

func TestCELEngine_ZeroBatchQuantityHandling(t *testing.T) {
	engine := NewCELEngine()

	rulebook := CalculationRulebook{
		CommodityType:  "Steel",
		Version:        "1.0",
		Scope1Formula:  "coal_tons * 2400.0",
		Scope2Formula:  "electricity_kwh * 0.5",
		Scope3Formula:  "0.0",
		FunctionalUnit: "ton",
		BatchQuantity:  0.0, // Zero batch quantity test
	}

	activityData := map[string]interface{}{
		"coal_tons":       2.0,
		"electricity_kwh": 1000.0,
	}

	result, err := engine.Evaluate(context.Background(), rulebook, activityData)
	if err != nil {
		t.Fatalf("Evaluate failed: %v", err)
	}

	expectedTotal := (2.0 * 2400.0) + (1000.0 * 0.5) // 4800 + 500 = 5300
	if result.TotalFootprintKg != expectedTotal {
		t.Errorf("expected total %f, got %f", expectedTotal, result.TotalFootprintKg)
	}

	// Batch quantity 0 should default to 1.0 to avoid division by zero
	if result.IntensityPerUnit != expectedTotal {
		t.Errorf("expected intensity %f, got %f", expectedTotal, result.IntensityPerUnit)
	}
}

func TestCELEngine_DAG_RiceScenario(t *testing.T) {
	engine := NewCELEngine()

	rulebook := CalculationRulebook{
		CommodityType:  "Rice",
		Version:        "2026.1",
		FunctionalUnit: "kg CO2e per kg rice",
		BatchQuantity:  1000.0,
		Rules: []RuleDefinition{
			{ID: "R01", Name: "Rice Methane", Scope: Scope1, Formula: "methane_factor * flooded_hectares"},
			{ID: "R02", Name: "Fertilizer Emissions", Scope: Scope1, Formula: "fertilizer_kg * N2O_ef"},
			{ID: "R03", Name: "Farm Electricity", Scope: Scope2, Formula: "electricity_kwh * grid_ef"},
			{ID: "R04", Name: "Milling Emissions", Scope: Scope2, Formula: "milling_kwh * grid_ef"},
			{ID: "R05", Name: "Packaging", Scope: Scope3, Formula: "packaging_kg * pack_ef"},
			{ID: "R06", Name: "Transport", Scope: Scope3, Formula: "freight_km * trans_ef"},
			{ID: "R07", Name: "Carbon Removal", Scope: Scope3, Formula: "-1.0 * (removal_ton * 1000.0)"},
			{ID: "R08", Name: "Total Gross Emissions", Scope: Intermediate, OutputType: OutputTotalFootprint, Formula: "R01 + R02 + R03 + R04 + R05 + R06 + R07"},
			{ID: "R09", Name: "Intensity per Kg", Scope: Intermediate, OutputType: OutputIntensity, Formula: "R08 / total_kg_rice"},
		},
	}

	activityData := map[string]interface{}{
		"methane_factor":   50.0,
		"flooded_hectares": 10.0,  // R01 = 500
		"fertilizer_kg":    100.0,
		"N2O_ef":           2.0,   // R02 = 200 => Scope1 = 700
		"electricity_kwh":  400.0,
		"grid_ef":          0.5,   // R03 = 200
		"milling_kwh":      200.0, // R04 = 100 => Scope2 = 300
		"packaging_kg":     50.0,
		"pack_ef":          1.0,   // R05 = 50
		"freight_km":       300.0,
		"trans_ef":         0.5,   // R06 = 150
		"removal_ton":      0.1,   // R07 = 100 => Scope3 = 50 + 150 - 100 = 100
		"total_kg_rice":    1000.0,
	}

	result, err := engine.Evaluate(context.Background(), rulebook, activityData)
	if err != nil {
		t.Fatalf("Evaluate failed: %v", err)
	}

	if result.Scope1Kg != 700.0 {
		t.Errorf("Scope 1 expected 700.0, got %f", result.Scope1Kg)
	}
	if result.Scope2Kg != 300.0 {
		t.Errorf("Scope 2 expected 300.0, got %f", result.Scope2Kg)
	}
	if result.Scope3Kg != 100.0 {
		t.Errorf("Scope 3 expected 100.0, got %f", result.Scope3Kg)
	}
	if result.TotalFootprintKg != 1100.0 {
		t.Errorf("Total footprint expected 1100.0, got %f", result.TotalFootprintKg)
	}
	if result.IntensityPerUnit != 1.1 {
		t.Errorf("Intensity expected 1.1, got %f", result.IntensityPerUnit)
	}

	if r08, ok := result.RuleResults["R08"]; !ok || r08.Value != 1100.0 {
		t.Errorf("Rule R08 expected 1100.0, got %v", r08)
	}
	if r09, ok := result.RuleResults["R09"]; !ok || r09.Value != 1.1 {
		t.Errorf("Rule R09 expected 1.1, got %v", r09)
	}
}

func TestCELEngine_DAG_CycleDetection(t *testing.T) {
	engine := NewCELEngine()

	rulebook := CalculationRulebook{
		CommodityType: "Rice",
		Version:       "1.0",
		Rules: []RuleDefinition{
			{ID: "R01", Scope: Scope1, Formula: "R02 + 10.0"},
			{ID: "R02", Scope: Scope1, Formula: "R01 * 2.0"},
		},
	}

	_, err := engine.Evaluate(context.Background(), rulebook, map[string]interface{}{})
	if err == nil {
		t.Fatal("expected error due to circular dependency, got nil")
	}
}

func TestCELEngine_AccountingModes(t *testing.T) {
	engine := NewCELEngine()

	rulebook := CalculationRulebook{
		CommodityType:  "Steel",
		Version:        "1.0",
		AccountingMode: ModeCBAM,
		FunctionalUnit: "ton",
		BatchQuantity:  10.0,
		Rules: []RuleDefinition{
			{ID: "R01", Scope: Scope1, Mode: ModeCBAM, Formula: "direct_fuel * 2.5"},
			{ID: "R02", Scope: Scope2, Mode: ModePCF, Formula: "grid_kwh * 0.8"}, // Should be filtered out in CBAM mode
			{ID: "R03", Scope: Scope3, Mode: ModeAll, Formula: "trans_km * 0.1"},
		},
	}

	activityData := map[string]interface{}{
		"direct_fuel": 100.0,
		"grid_kwh":    500.0,
		"trans_km":    200.0,
	}

	result, err := engine.Evaluate(context.Background(), rulebook, activityData)
	if err != nil {
		t.Fatalf("Evaluate failed: %v", err)
	}

	if result.Scope1Kg != 250.0 {
		t.Errorf("Scope 1 expected 250.0, got %f", result.Scope1Kg)
	}
	if result.Scope2Kg != 0.0 {
		t.Errorf("Scope 2 expected 0.0 (filtered out), got %f", result.Scope2Kg)
	}
	if result.Scope3Kg != 20.0 {
		t.Errorf("Scope 3 expected 20.0, got %f", result.Scope3Kg)
	}
	if result.TotalFootprintKg != 270.0 {
		t.Errorf("Total footprint expected 270.0, got %f", result.TotalFootprintKg)
	}
}
