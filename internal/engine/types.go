package engine

import "time"

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
	ID          string         `json:"id"`
	Name        string         `json:"name,omitempty"`
	Scope       RuleScope      `json:"scope"`
	Mode        AccountingMode `json:"mode,omitempty"`
	OutputType  RuleOutputType `json:"output_type,omitempty"`
	Formula     string         `json:"formula"`
	Description string         `json:"description,omitempty"`
}

type RuleExecutionResult struct {
	ID          string  `json:"id"`
	Name        string  `json:"name,omitempty"`
	Scope       string  `json:"scope"`
	Value       float64 `json:"value"`
	Formula     string  `json:"formula"`
}

type CalculationRulebook struct {
	RulebookID     string           `json:"rulebook_id,omitempty"`
	CommodityType  string           `json:"commodity_type"`
	Version        string           `json:"version"`
	AccountingMode AccountingMode   `json:"accounting_mode,omitempty"`
	Rules          []RuleDefinition `json:"rules,omitempty"`
	Scope1Formula  string           `json:"scope_1_formula,omitempty"`
	Scope2Formula  string           `json:"scope_2_formula,omitempty"`
	Scope3Formula  string           `json:"scope_3_formula,omitempty"`
	FunctionalUnit string           `json:"functional_unit"`
	BatchQuantity  float64          `json:"batch_quantity"`
}

type CalculationResult struct {
	Scope1Kg         float64                        `json:"scope_1_kg_co2e"`
	Scope2Kg         float64                        `json:"scope_2_kg_co2e"`
	Scope3Kg         float64                        `json:"scope_3_kg_co2e"`
	TotalFootprintKg float64                        `json:"total_footprint_kg"`
	IntensityPerUnit float64                        `json:"intensity_per_unit"`
	FunctionalUnit   string                         `json:"functional_unit"`
	DataHash         string                         `json:"data_hash"`
	RulebookVersion  string                         `json:"rulebook_version"`
	ExecutionTime    time.Time                      `json:"execution_time"`
	VariableSnapshot map[string]interface{}         `json:"variable_snapshot"`
	RuleResults      map[string]RuleExecutionResult `json:"rule_results,omitempty"`
}
