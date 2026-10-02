package nexusdsl

import "time"

// Nexus Node Marker Interface & Tag Specs representing Nexus Graph DSL.
// In Nexus (graph-framework-for-microservices), domain models are declared
// using Go structs annotated with `nexus:"child"`, `nexus:"link"`, and `nexus:"status"`.
// The Nexus compiler auto-generates Kubernetes CRDs, API Gateways, and event-driven Reconcilers.
//
// Graph Hierarchy defined in HLD:
// Enterprise (Root)
//   ├── Facility (Node)
//   │     ├── Device (Node)
//   │     │     └── TelemetryMetric (Node)
//   │     └── ProductionBatch (Node)
//   └── ProductType (Node)
//         ├── CalculationRulebook (Node)
//         └── CarbonPassport (Node)
//               ├── EmissionSnapshot (Child)
//               ├── VerificationRecord (Child)
//               └── ComplianceArtifact (Child)

type Node struct{}

// Enterprise Root Node
type Enterprise struct {
	Node
	Facilities   FacilityMap    `nexus:"child"`
	ProductTypes ProductTypeMap `nexus:"child"`
}

type FacilityMap map[string]Facility
type ProductTypeMap map[string]ProductType

// Facility Node
type Facility struct {
	Node
	Devices          DeviceMap          `nexus:"child"`
	ProductionBatches ProductionBatchMap `nexus:"child"`
}

type DeviceMap map[string]Device
type ProductionBatchMap map[string]ProductionBatch

// Device Node (e.g., Sattric+ Smart Meter)
type Device struct {
	Node
	TelemetryMetrics TelemetryMetricMap `nexus:"child"`
}

type TelemetryMetricMap map[string]TelemetryMetric

// TelemetryMetric Node
type TelemetryMetric struct {
	Node
	MetricType string    `json:"metricType"` // e.g., electricity_kwh, fuel_liters
	Value      float64   `json:"value"`
	Timestamp  time.Time `json:"timestamp"`
}

// ProductionBatch Node
type ProductionBatch struct {
	Node
	BatchNumber   string  `json:"batchNumber"`
	Quantity      float64 `json:"quantity"`
	FunctionalUnit string  `json:"functionalUnit"`
}

// ProductType Node (e.g., Structural Steel, Cement)
type ProductType struct {
	Node
	Rulebooks CalculationRulebookMap `nexus:"child"`
	Passports CarbonPassportMap    `nexus:"child"`
}

type CalculationRulebookMap map[string]CalculationRulebookNode
type CarbonPassportMap map[string]CarbonPassportNode

// CalculationRulebookNode represents dynamic CEL calculation formulas
type CalculationRulebookNode struct {
	Node
	CommodityType  string  `json:"commodityType"`
	Version        string  `json:"version"`
	Scope1Formula  string  `json:"scope1Formula"`
	Scope2Formula  string  `json:"scope2Formula"`
	Scope3Formula  string  `json:"scope3Formula"`
	FunctionalUnit string  `json:"functionalUnit"`
	BatchQuantity  float64 `json:"batchQuantity"`
}

// CarbonPassportNode represents product carbon passport
type CarbonPassportNode struct {
	Node
	TenantID        string `json:"tenantID"`
	FacilityID      string `json:"facilityID"`
	BatchID         string `json:"batchID"`
	CommodityType   string `json:"commodityType"`
	ActivityDataRaw string `json:"activityDataRaw"`
	RulebookVersion string `json:"rulebookVersion"`

	Snapshots          EmissionSnapshotMap   `nexus:"child"`
	VerificationRecords VerificationRecordMap `nexus:"child"`
	ComplianceArtifacts ComplianceArtifactMap `nexus:"child"`

	Status CarbonPassportStatusNode `nexus:"status"`
}

type EmissionSnapshotMap map[string]EmissionSnapshot
type VerificationRecordMap map[string]VerificationRecord
type ComplianceArtifactMap map[string]ComplianceArtifact

type EmissionSnapshot struct {
	Node
	Scope1KgCO2e     float64 `json:"scope1KgCO2e"`
	Scope2KgCO2e     float64 `json:"scope2KgCO2e"`
	Scope3KgCO2e     float64 `json:"scope3KgCO2e"`
	TotalFootprintKg float64 `json:"totalFootprintKg"`
	DataHash         string  `json:"dataHash"`
}

type VerificationRecord struct {
	Node
	VerifierID string    `json:"verifierID"`
	Status     string    `json:"status"` // Draft, Submitted, Under Review, Verified
	VerifiedAt time.Time `json:"verifiedAt"`
}

type ComplianceArtifact struct {
	Node
	ArtifactType string `json:"artifactType"` // CBAM_XML, EPD_PDF
	StorageURI   string `json:"storageURI"`
}

type CarbonPassportStatusNode struct {
	Phase            string  `json:"phase"`
	PassportID       string  `json:"passportID"`
	TotalFootprintKg float64 `json:"totalFootprintKg"`
	DataHash         string  `json:"dataHash"`
}
