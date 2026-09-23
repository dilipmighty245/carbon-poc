package engine

import "time"

type CalculationRulebook struct {
	RulebookID     string  `json:"rulebook_id,omitempty"`
	CommodityType  string  `json:"commodity_type"`
	Version        string  `json:"version"`
	Scope1Formula  string  `json:"scope_1_formula"`
	Scope2Formula  string  `json:"scope_2_formula"`
	Scope3Formula  string  `json:"scope_3_formula"`
	FunctionalUnit string  `json:"functional_unit"`
	BatchQuantity  float64 `json:"batch_quantity"`
}

type CalculationResult struct {
	Scope1Kg         float64                `json:"scope_1_kg_co2e"`
	Scope2Kg         float64                `json:"scope_2_kg_co2e"`
	Scope3Kg         float64                `json:"scope_3_kg_co2e"`
	TotalFootprintKg float64                `json:"total_footprint_kg"`
	IntensityPerUnit float64                `json:"intensity_per_unit"`
	FunctionalUnit   string                 `json:"functional_unit"`
	DataHash         string                 `json:"data_hash"`
	RulebookVersion  string                 `json:"rulebook_version"`
	ExecutionTime    time.Time              `json:"execution_time"`
	VariableSnapshot map[string]interface{} `json:"variable_snapshot"`
}
