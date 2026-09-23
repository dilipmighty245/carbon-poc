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
