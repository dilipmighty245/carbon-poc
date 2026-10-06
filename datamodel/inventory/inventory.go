package inventory

import (
	"github.com/xmen4xp/graph-framework-for-microservices/nexus/nexus"
)

type Inventory struct {
	nexus.SingletonNode

	Agencies  ACVAgency `nexus:"children"`
	Tenants   Tenant    `nexus:"children"`
	Suppliers Supplier  `nexus:"children"`
}

type ACVAgency struct {
	nexus.Node

	AgencyID            string `json:"agencyID,omitempty" mapstructure:"agencyID,omitempty"`
	LegalName           string `json:"legalName,omitempty" mapstructure:"legalName,omitempty"`
	AccreditationBody   string `json:"accreditationBody,omitempty" mapstructure:"accreditationBody,omitempty"`
	AccreditationNumber string `json:"accreditationNumber,omitempty" mapstructure:"accreditationNumber,omitempty"`
	AccreditationStatus string `json:"accreditationStatus,omitempty" mapstructure:"accreditationStatus,omitempty"`
	AccreditationExpiry string `json:"accreditationExpiry,omitempty" mapstructure:"accreditationExpiry,omitempty"`
}

type Tenant struct {
	nexus.Node

	TenantID   string     `json:"tenantID,omitempty" mapstructure:"tenantID,omitempty"`
	LegalName  string     `json:"legalName,omitempty" mapstructure:"legalName,omitempty"`
	Country    string     `json:"country,omitempty" mapstructure:"country,omitempty"`
	Industry   string     `json:"industry,omitempty" mapstructure:"industry,omitempty"`
	Facilities Facility   `nexus:"children"`
	Products   Product    `nexus:"children"`
}

type Facility struct {
	nexus.Node

	FacilityID  string `json:"facilityID,omitempty" mapstructure:"facilityID,omitempty"`
	Name        string `json:"name,omitempty" mapstructure:"name,omitempty"`
	Location    string `json:"location,omitempty" mapstructure:"location,omitempty"`
	CountryCode string `json:"countryCode,omitempty" mapstructure:"countryCode,omitempty"`
	Meters      Meter  `nexus:"children"`
}

type Meter struct {
	nexus.Node

	MeterID      string `json:"meterID,omitempty" mapstructure:"meterID,omitempty"`
	MeterType    string `json:"meterType,omitempty" mapstructure:"meterType,omitempty"`
	Manufacturer string `json:"manufacturer,omitempty" mapstructure:"manufacturer,omitempty"`
}

type Product struct {
	nexus.Node

	ProductID     string       `json:"productID,omitempty" mapstructure:"productID,omitempty"`
	ProductName   string       `json:"productName,omitempty" mapstructure:"productName,omitempty"`
	CommodityType string       `json:"commodityType,omitempty" mapstructure:"commodityType,omitempty"`
	BatchID       string       `json:"batchID,omitempty" mapstructure:"batchID,omitempty"`
	CnCode        string       `json:"cnCode,omitempty" mapstructure:"cnCode,omitempty"`
	HsCode        string       `json:"hsCode,omitempty" mapstructure:"hsCode,omitempty"`
	Unit          string       `json:"unit,omitempty" mapstructure:"unit,omitempty"`
	LogisticsLegs LogisticsLeg `nexus:"children"`
}

type LogisticsLeg struct {
	nexus.Node

	LegSequence          int     `json:"legSequence,omitempty" mapstructure:"legSequence,omitempty"`
	Mode                 string  `json:"mode,omitempty" mapstructure:"mode,omitempty"`
	Origin               string  `json:"origin,omitempty" mapstructure:"origin,omitempty"`
	Destination          string  `json:"destination,omitempty" mapstructure:"destination,omitempty"`
	DistanceKm           float64 `json:"distanceKm,omitempty" mapstructure:"distanceKm,omitempty"`
	CarrierName          string  `json:"carrierName,omitempty" mapstructure:"carrierName,omitempty"`
	TransportEmissionsKg float64 `json:"transportEmissionsKg,omitempty" mapstructure:"transportEmissionsKg,omitempty"`
}

type Supplier struct {
	nexus.Node

	SupplierID   string      `json:"supplierID,omitempty" mapstructure:"supplierID,omitempty"`
	LegalName    string      `json:"legalName,omitempty" mapstructure:"legalName,omitempty"`
	Country      string      `json:"country,omitempty" mapstructure:"country,omitempty"`
	Tier         string      `json:"tier,omitempty" mapstructure:"tier,omitempty"`
	Declarations Declaration `nexus:"children"`
}

type Declaration struct {
	nexus.Node

	DeclarationID       string  `json:"declarationID,omitempty" mapstructure:"declarationID,omitempty"`
	MaterialName        string  `json:"materialName,omitempty" mapstructure:"materialName,omitempty"`
	ClaimedPcfIntensity float64 `json:"claimedPcfIntensity,omitempty" mapstructure:"claimedPcfIntensity,omitempty"`
	Unit                string  `json:"unit,omitempty" mapstructure:"unit,omitempty"`
	DataClassification  string  `json:"dataClassification,omitempty" mapstructure:"dataClassification,omitempty"`
}
