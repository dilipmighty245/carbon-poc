package runtime

import (
	"saurient-platform/datamodel/config"
	"saurient-platform/datamodel/inventory"

	"github.com/dilipmighty245/graph-framework-for-microservices/nexus/nexus"
)

type Runtime struct {
	nexus.SingletonNode

	TelemetryReadings TelemetryReading `nexus:"children"`
	Engagements       ACVEngagement    `nexus:"children"`
	Passports         CarbonPassport   `nexus:"children"`
}

type TelemetryReading struct {
	nexus.Node

	MeterRef    inventory.Meter `nexus:"link"`
	Value       float64         `json:"value,omitempty" mapstructure:"value,omitempty"`
	Unit        string          `json:"unit,omitempty" mapstructure:"unit,omitempty"`
	ReadingType string          `json:"readingType,omitempty" mapstructure:"readingType,omitempty"`
	IngestedAt  string          `json:"ingestedAt,omitempty" mapstructure:"ingestedAt,omitempty"`
}

type ACVEngagement struct {
	nexus.Node

	EngagementID string `json:"engagementID,omitempty" mapstructure:"engagementID,omitempty"`
	AgencyID     string `json:"agencyID,omitempty" mapstructure:"agencyID,omitempty"`
	Status       string `json:"status,omitempty" mapstructure:"status,omitempty"`
	AcceptedBy   string `json:"acceptedBy,omitempty" mapstructure:"acceptedBy,omitempty"`
	SignedBy     string `json:"signedBy,omitempty" mapstructure:"signedBy,omitempty"`
	Opinion      string `json:"opinion,omitempty" mapstructure:"opinion,omitempty"`
}

type CarbonPassport struct {
	nexus.Node

	PassportID         string  `json:"passportID,omitempty" mapstructure:"passportID,omitempty"`
	TenantID           string  `json:"tenantID,omitempty" mapstructure:"tenantID,omitempty"`
	FacilityID         string  `json:"facilityID,omitempty" mapstructure:"facilityID,omitempty"`
	BatchID            string  `json:"batchID,omitempty" mapstructure:"batchID,omitempty"`
	CommodityType      string  `json:"commodityType,omitempty" mapstructure:"commodityType,omitempty"`
	TotalFootprintKg   float64 `json:"totalFootprintKg,omitempty" mapstructure:"totalFootprintKg,omitempty"`
	Scope1Kg           float64 `json:"scope1Kg,omitempty" mapstructure:"scope1Kg,omitempty"`
	Scope2Kg           float64 `json:"scope2Kg,omitempty" mapstructure:"scope2Kg,omitempty"`
	Scope3Kg           float64 `json:"scope3Kg,omitempty" mapstructure:"scope3Kg,omitempty"`
	IntensityPerUnit   float64 `json:"intensityPerUnit,omitempty" mapstructure:"intensityPerUnit,omitempty"`
	VerificationStatus string  `json:"verificationStatus,omitempty" mapstructure:"verificationStatus,omitempty"`
	CalculationDetails string  `json:"calculationDetails,omitempty" mapstructure:"calculationDetails,omitempty"`
	PassportDataRaw    string  `json:"passportDataRaw,omitempty" mapstructure:"passportDataRaw,omitempty"`
	DataHash           string  `json:"dataHash,omitempty" mapstructure:"dataHash,omitempty"`
	Frozen             bool    `json:"frozen,omitempty" mapstructure:"frozen,omitempty"`
	FrozenAt           string  `json:"frozenAt,omitempty" mapstructure:"frozenAt,omitempty"`
	IssuedAt           string  `json:"issuedAt,omitempty" mapstructure:"issuedAt,omitempty"`
	Version            string  `json:"version,omitempty" mapstructure:"version,omitempty"`

	// Soft Cross-Graph Links
	ProductRef    inventory.Product `nexus:"link"`
	EngagementRef ACVEngagement     `nexus:"link"`
	RulebookRef   config.Rulebook   `nexus:"link"`

	AuditRecords AuditRecord `nexus:"children"`
}

type AuditRecord struct {
	nexus.Node

	ActionType   string `json:"actionType,omitempty" mapstructure:"actionType,omitempty"`
	PreviousHash string `json:"previousHash,omitempty" mapstructure:"previousHash,omitempty"`
	CurrentHash  string `json:"currentHash,omitempty" mapstructure:"currentHash,omitempty"`
	Timestamp    string `json:"timestamp,omitempty" mapstructure:"timestamp,omitempty"`
	UserRef      string `json:"userRef,omitempty" mapstructure:"userRef,omitempty"`
}
