package config

import (
	"github.com/vmware-tanzu/graph-framework-for-microservices/nexus/nexus"
)

type Config struct {
	nexus.SingletonNode

	Rulebooks        Rulebook        `nexus:"children"`
	CbamBenchmarks   CbamBenchmark   `nexus:"children"`
	StoryboardScenes StoryboardScene `nexus:"children"`
}

type Rulebook struct {
	nexus.Node

	RulebookID       string  `json:"rulebookId,omitempty" mapstructure:"rulebookId,omitempty"`
	CommodityType    string  `json:"commodityType,omitempty" mapstructure:"commodityType,omitempty"`
	Version          string  `json:"version,omitempty" mapstructure:"version,omitempty"`
	AccountingMode   string  `json:"accountingMode,omitempty" mapstructure:"accountingMode,omitempty"`
	Standard         string  `json:"standard,omitempty" mapstructure:"standard,omitempty"`
	RulesRaw         string  `json:"rulesRaw,omitempty" mapstructure:"rulesRaw,omitempty"`
	Scope1Formula    string  `json:"scope1Formula,omitempty" mapstructure:"scope1Formula,omitempty"`
	Scope2Formula    string  `json:"scope2Formula,omitempty" mapstructure:"scope2Formula,omitempty"`
	Scope3Formula    string  `json:"scope3Formula,omitempty" mapstructure:"scope3Formula,omitempty"`
	FunctionalUnit   string  `json:"functionalUnit,omitempty" mapstructure:"functionalUnit,omitempty"`
	BatchQuantity    float64 `json:"batchQuantity,omitempty" mapstructure:"batchQuantity,omitempty"`
	BoundaryType     string  `json:"boundaryType,omitempty" mapstructure:"boundaryType,omitempty"`
	AllocationMethod string  `json:"allocationMethod,omitempty" mapstructure:"allocationMethod,omitempty"`
}

type CbamBenchmark struct {
	nexus.Node

	CnCode            string  `json:"cnCode,omitempty" mapstructure:"cnCode,omitempty"`
	CommodityName     string  `json:"commodityName,omitempty" mapstructure:"commodityName,omitempty"`
	BfBofBenchmark    float64 `json:"bfBofBenchmark,omitempty" mapstructure:"bfBofBenchmark,omitempty"`
	DriEafBenchmark   float64 `json:"driEafBenchmark,omitempty" mapstructure:"driEafBenchmark,omitempty"`
	ScrapEafBenchmark float64 `json:"scrapEafBenchmark,omitempty" mapstructure:"scrapEafBenchmark,omitempty"`
	DefaultFallback   float64 `json:"defaultFallback,omitempty" mapstructure:"defaultFallback,omitempty"`
	RegulationRef     string  `json:"regulationRef,omitempty" mapstructure:"regulationRef,omitempty"`
}

type StoryboardScene struct {
	nexus.Node

	SceneNumber        int    `json:"sceneNumber,omitempty" mapstructure:"sceneNumber,omitempty"`
	Title              string `json:"title,omitempty" mapstructure:"title,omitempty"`
	ScreenRoute        string `json:"screenRoute,omitempty" mapstructure:"screenRoute,omitempty"`
	PresenterNarration string `json:"presenterNarration,omitempty" mapstructure:"presenterNarration,omitempty"`
	PrimaryAction      string `json:"primaryAction,omitempty" mapstructure:"primaryAction,omitempty"`
	TargetModule       string `json:"targetModule,omitempty" mapstructure:"targetModule,omitempty"`
}
