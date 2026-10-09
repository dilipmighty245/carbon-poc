package nexus

import (
	"context"
	"encoding/json"
	"fmt"
	"os"
	"sync"
	"time"

	"saurient-platform/internal/tenant"
)

// --- Struct Models ---

// Carbon Passport Models
type CarbonPassportModel struct {
	PassportID         string          `json:"passport_id"`
	TenantID           string          `json:"tenant_id"`
	FacilityID         string          `json:"facility_id"`
	BatchNumber        string          `json:"batch_number"`
	CommodityType      string          `json:"commodity_type"`
	VerificationStatus string          `json:"verification_status"`
	Scope1KgCO2e       float64         `json:"scope_1_kg_co2e"`
	Scope2KgCO2e       float64         `json:"scope_2_kg_co2e"`
	Scope3KgCO2e       float64         `json:"scope_3_kg_co2e"`
	TotalFootprintKg   float64         `json:"total_footprint_kg"`
	CalculationDetails json.RawMessage `json:"calculation_details"`
	IssuedAt           time.Time       `json:"issued_at"`
	DataHash           string          `json:"data_hash"`
}

type PassportAuditTrailModel struct {
	AuditID       string          `json:"audit_id,omitempty"`
	PassportID    string          `json:"passport_id"`
	PreviousHash  string          `json:"previous_hash,omitempty"`
	CurrentHash   string          `json:"current_hash"`
	ActionType    string          `json:"action_type"`
	Timestamp     time.Time       `json:"timestamp"`
	ChangePayload json.RawMessage `json:"change_payload"`
}

// Product Models
type ProductModel struct {
	Name             string    `json:"name"`
	Namespace        string    `json:"namespace"`
	TenantID         string    `json:"tenant_id"`
	FacilityID       string    `json:"facility_id"`
	BatchID          string    `json:"batch_id"`
	ProductName      string    `json:"product_name"`
	CommodityType    string    `json:"commodity_type"`
	ActivityDataRaw  string    `json:"activity_data_raw"`
	RulebookRefName  string    `json:"rulebook_ref_name"`
	Phase            string    `json:"phase"`
	PassportID       string    `json:"passport_id"`
	TotalFootprintKg float64   `json:"total_footprint_kg"`
	DataHash         string    `json:"data_hash"`
	CreatedAt        time.Time `json:"created_at"`
	LastUpdated      time.Time `json:"last_updated"`
}

// Product Event Types for Reconciler
type ProductEventType string

const (
	ProductEventCreated ProductEventType = "CREATED"
	ProductEventUpdated ProductEventType = "UPDATED"
	ProductEventDeleted ProductEventType = "DELETED"
)

// ProductEvent encapsulates an asynchronous state change notification for a Product node.
type ProductEvent struct {
	Type      ProductEventType `json:"type"`
	TenantID  string           `json:"tenant_id"`
	ProductID string           `json:"product_id"`
	Product   *ProductModel    `json:"product,omitempty"`
}

// Rulebook Models
type RulebookModel struct {
	ID             string    `json:"id"`
	Name           string    `json:"name"`
	Namespace      string    `json:"namespace"`
	Label          string    `json:"label"`
	CommodityType  string    `json:"commodity_type"`
	Version        string    `json:"version,omitempty"`
	AccountingMode string    `json:"accounting_mode,omitempty"`
	Standard       string    `json:"standard,omitempty"`
	FunctionalUnit string    `json:"functional_unit,omitempty"`
	BatchQuantity  float64   `json:"batch_quantity,omitempty"`
	RulesRaw       string    `json:"rules_raw,omitempty"`
	Scope1Formula  string    `json:"scope_1_formula,omitempty"`
	Scope2Formula  string    `json:"scope_2_formula,omitempty"`
	Scope3Formula  string    `json:"scope_3_formula,omitempty"`
	CreatedAt      time.Time `json:"created_at"`
}

// Organisation Models
type TenantProfileModel struct {
	TenantID               string          `json:"tenant_id"`
	LegalName              string          `json:"legalName"`
	TradingName            string          `json:"tradingName"`
	OrganisationID         string          `json:"organisationId"`
	RegistrationNumber     string          `json:"registrationNumber"`
	CountryOfIncorporation string          `json:"countryOfIncorporation"`
	RegisteredAddress      string          `json:"registeredAddress"`
	Headquarters           string          `json:"headquarters"`
	Industry               string          `json:"industry"`
	NaceCode               string          `json:"naceCode"`
	PrimaryProducts        string          `json:"primaryProducts"`
	Website                string          `json:"website"`
	TaxID                  string          `json:"taxId"`
	LEI                    string          `json:"lei"`
	PrimaryContact         json.RawMessage `json:"primaryContact"`
	SustainabilityContact json.RawMessage `json:"sustainabilityContact"`
	Boundary               json.RawMessage `json:"boundary"`
	Status                 string          `json:"status"`
	Verification           json.RawMessage `json:"verification"`
	CreatedAt              time.Time       `json:"created_at"`
	UpdatedAt              time.Time       `json:"updated_at"`
}

type FacilityModel struct {
	ID                 string          `json:"id"`
	TenantID           string          `json:"tenant_id"`
	Name               string          `json:"name"`
	Type               string          `json:"type"`
	Country            string          `json:"country"`
	CountryCode        string          `json:"countryCode"`
	Address            string          `json:"address"`
	Status             string          `json:"status"`
	ProcessesCount     int             `json:"processesCount"`
	DevicesCount       int             `json:"devicesCount"`
	DataCompleteness   float64         `json:"dataCompleteness"`
	Emissions          string          `json:"emissions"`
	Readiness          string          `json:"readiness"`
	Geo                json.RawMessage `json:"geo"`
	ProductionCapacity string          `json:"productionCapacity"`
	OperatingHours     string          `json:"operatingHours"`
	Manager            json.RawMessage `json:"manager"`
	EnergySources      json.RawMessage `json:"energySources"`
	Utilities          json.RawMessage `json:"utilities"`
	Products           json.RawMessage `json:"products"`
	EmissionSources    json.RawMessage `json:"emissionSources"`
	ProcessTree        json.RawMessage `json:"processTree"`
	CreatedAt          time.Time       `json:"created_at"`
	UpdatedAt          time.Time       `json:"updated_at"`
}

type ProcessModel struct {
	ID             string          `json:"id"`
	TenantID       string          `json:"tenant_id"`
	FacilityID     string          `json:"facilityId"`
	FacilityName   string          `json:"facilityName"`
	Name           string          `json:"name"`
	ProductionLine string          `json:"productionLine"`
	EnergySource   string          `json:"energySource"`
	Inputs         json.RawMessage `json:"inputs"`
	Outputs        json.RawMessage `json:"outputs"`
	Meters         json.RawMessage `json:"meters"`
	Scopes         json.RawMessage `json:"scopes"`
	Status         string          `json:"status"`
	Description    string          `json:"description"`
	PCFTrace       json.RawMessage `json:"pcfTrace"`
	CreatedAt      time.Time       `json:"created_at"`
	UpdatedAt      time.Time       `json:"updated_at"`
}

type OrganisationUserModel struct {
	ID            string    `json:"id"`
	TenantID      string    `json:"tenant_id"`
	Name          string    `json:"name"`
	Email         string    `json:"email"`
	PasswordHash  string    `json:"-"`
	Role          string    `json:"role"`
	FacilityScope string    `json:"facilityScope"`
	LastLogin     string    `json:"lastLogin"`
	Status        string    `json:"status"`
	CreatedAt     time.Time `json:"created_at"`
}

type ReportingPeriodModel struct {
	ID                 string          `json:"id"`
	TenantID           string          `json:"tenant_id"`
	Name               string          `json:"name"`
	StartDate          string          `json:"startDate"`
	EndDate            string          `json:"endDate"`
	FacilitiesScope    string          `json:"facilitiesScope"`
	CCFStatus          string          `json:"ccfStatus"`
	DataCompleteness   float64         `json:"dataCompleteness"`
	VerificationStatus string          `json:"verificationStatus"`
	CurrentStepIndex   int             `json:"currentStepIndex"`
	Versions           json.RawMessage `json:"versions"`
	CreatedAt          time.Time       `json:"created_at"`
	UpdatedAt          time.Time       `json:"updated_at"`
}

type LocalisationModel struct {
	TenantID   string          `json:"tenant_id"`
	Country    string          `json:"country"`
	Currency   string          `json:"currency"`
	Timezone   string          `json:"timezone"`
	Language   string          `json:"language"`
	Units      json.RawMessage `json:"units"`
	Regulatory json.RawMessage `json:"regulatory"`
	UpdatedAt  time.Time       `json:"updated_at"`
}

type ApprovalModel struct {
	ID            string          `json:"id"`
	TenantID      string          `json:"tenant_id"`
	Title         string          `json:"title"`
	Type          string          `json:"type"`
	Facility      string          `json:"facility"`
	SubmittedBy   json.RawMessage `json:"submittedBy"`
	SubmittedDate string          `json:"submittedDate"`
	RiskLevel     string          `json:"riskLevel"`
	Status        string          `json:"status"`
	WhatChanged   json.RawMessage `json:"whatChanged"`
	Evidence      string          `json:"evidence"`
	History       json.RawMessage `json:"history"`
	CreatedAt     time.Time       `json:"created_at"`
	UpdatedAt     time.Time       `json:"updated_at"`
}

// ACV Models
type AgencyModel struct {
	AgencyID             string          `json:"agency_id"`
	TenantID             string          `json:"tenant_id"`
	LegalName            string          `json:"legalName"`
	AccreditationBody    string          `json:"accreditationBody"`
	AccreditationNumber  string          `json:"accreditationNumber"`
	AccreditationStatus  string          `json:"accreditationStatus"`
	AccreditationExpiry  time.Time       `json:"accreditationExpiry"`
	ScopeOfAccreditation json.RawMessage `json:"scopeOfAccreditation"`
	CreatedAt            time.Time       `json:"created_at"`
	UpdatedAt            time.Time       `json:"updated_at"`
}

type VerificationEngagementModel struct {
	EngagementID string          `json:"engagement_id"`
	TenantID     string          `json:"tenant_id"`
	AgencyID     string          `json:"agency_id"`
	PeriodID     string          `json:"period_id"`
	Scope        json.RawMessage `json:"scope"`
	Status       string          `json:"status"`
	AcceptedBy   string          `json:"accepted_by,omitempty"`
	AcceptedAt   *time.Time      `json:"accepted_at,omitempty"`
	CreatedAt    time.Time       `json:"created_at"`
	UpdatedAt    time.Time       `json:"updated_at"`
}

type EngagementTeamMemberModel struct {
	MemberID              string    `json:"member_id"`
	TenantID              string    `json:"tenant_id"`
	EngagementID          string    `json:"engagement_id"`
	UserRef               string    `json:"user_ref"`
	Role                  string    `json:"role"`
	IsIndependentReviewer bool      `json:"is_independent_reviewer"`
	AssignedAt            time.Time `json:"assigned_at"`
}

type COIDeclarationModel struct {
	DeclarationID   string    `json:"declaration_id"`
	TenantID        string    `json:"tenant_id"`
	EngagementID    string    `json:"engagement_id"`
	UserRef         string    `json:"user_ref"`
	HasConflict     bool      `json:"has_conflict"`
	ConflictDetails string    `json:"conflict_details,omitempty"`
	Status          string    `json:"status"`
	DeclaredAt      time.Time `json:"declared_at"`
}

type FindingModel struct {
	FindingID    string    `json:"finding_id"`
	TenantID     string    `json:"tenant_id"`
	EngagementID string    `json:"engagement_id"`
	Severity     string    `json:"severity"`
	Status       string    `json:"status"`
	Description  string    `json:"description"`
	CreatedAt    time.Time `json:"created_at"`
	UpdatedAt    time.Time `json:"updated_at"`
}

type ReviewSignoffModel struct {
	SignoffID                  string    `json:"signoff_id"`
	TenantID                   string    `json:"tenant_id"`
	EngagementID               string    `json:"engagement_id"`
	PassportID                 string    `json:"passport_id"`
	ReviewerID                 string    `json:"reviewer_id"`
	Opinion                    string    `json:"opinion"`
	SignedAt                   time.Time `json:"signed_at"`
	FrozenCalculationVersionID string    `json:"frozen_calculation_version_id"`
}

type PublicPassportSummaryModel struct {
	PassportID         string    `json:"passport_id"`
	CommodityType      string    `json:"commodity_type"`
	TotalFootprintKg   float64   `json:"total_footprint_kg"`
	VerificationStatus string    `json:"verificationStatus"`
	ReviewOpinion      string    `json:"reviewOpinion"`
	IssuedAt           time.Time `json:"issued_at"`
}

// --- Nexus Graph Store Implementation ---

type GraphStore struct {
	storeMu          sync.RWMutex
	passports        map[string]*CarbonPassportModel
	products         map[string]*ProductModel
	rulebooks        map[string]*RulebookModel
	auditTrails      map[string][]*PassportAuditTrailModel
	tenantProfiles   map[string]*TenantProfileModel
	facilities       map[string][]*FacilityModel
	processes        map[string][]*ProcessModel
	users            map[string][]*OrganisationUserModel
	reportingPeriods map[string][]*ReportingPeriodModel
	localisations    map[string]*LocalisationModel
	approvals        map[string][]*ApprovalModel

	agencies        map[string][]*AgencyModel
	engagements     map[string][]*VerificationEngagementModel
	teamMembers     map[string][]*EngagementTeamMemberModel
	coiDeclarations map[string][]*COIDeclarationModel
	findings        map[string][]*FindingModel
	signoffs        map[string][]*ReviewSignoffModel
	cacheMap        map[string][]byte
}

var (
	globalGraphStore *GraphStore
	storeOnce        sync.Once
)

func getStore() *GraphStore {
	storeOnce.Do(func() {
		globalGraphStore = &GraphStore{
			passports:        make(map[string]*CarbonPassportModel),
			products:         make(map[string]*ProductModel),
			rulebooks:        make(map[string]*RulebookModel),
			auditTrails:      make(map[string][]*PassportAuditTrailModel),
			tenantProfiles:   make(map[string]*TenantProfileModel),
			facilities:       make(map[string][]*FacilityModel),
			processes:        make(map[string][]*ProcessModel),
			users:            make(map[string][]*OrganisationUserModel),
			reportingPeriods: make(map[string][]*ReportingPeriodModel),
			localisations:    make(map[string]*LocalisationModel),
			approvals:        make(map[string][]*ApprovalModel),
			agencies:         make(map[string][]*AgencyModel),
			engagements:      make(map[string][]*VerificationEngagementModel),
			teamMembers:      make(map[string][]*EngagementTeamMemberModel),
			coiDeclarations:  make(map[string][]*COIDeclarationModel),
			findings:         make(map[string][]*FindingModel),
			signoffs:         make(map[string][]*ReviewSignoffModel),
			cacheMap:         make(map[string][]byte),
		}
		if os.Getenv("SEED_DEMO_DATA") == "true" {
			globalGraphStore.seedDefaultData()
		}
	})
	return globalGraphStore
}

func (s *GraphStore) seedDefaultData() {
	s.storeMu.Lock()
	defer s.storeMu.Unlock()

	defaultTenant := "tenant-default"

	// Seed Tenant Profile
	s.tenantProfiles[defaultTenant] = &TenantProfileModel{
		TenantID:               defaultTenant,
		LegalName:              "Sattric Industrial Corp Ltd",
		TradingName:            "Sattric Steel & Energy",
		OrganisationID:         "ORG-9001",
		RegistrationNumber:     "CIN-L27100KA2026PLC09812",
		CountryOfIncorporation: "India",
		RegisteredAddress:      "Plot 42, Industrial Area, Bellary, Karnataka, India",
		Headquarters:           "Bengaluru, Karnataka, India",
		Industry:               "Basic Metals & Steel Manufacturing",
		NaceCode:               "24.10",
		PrimaryProducts:        "Hot-Rolled Steel Coil, Direct Reduced Iron, Aluminum Ingot",
		Website:                "https://sattric.io",
		TaxID:                  "29AAACS9812K1Z5",
		LEI:                    "33580012345678901234",
		PrimaryContact:         json.RawMessage(`{"name":"Rajesh Kumar","email":"rajesh@sattric.io","phone":"+91 9876543210"}`),
		SustainabilityContact: json.RawMessage(`{"name":"Dr. Ananya Sharma","email":"sustainability@sattric.io","phone":"+91 9876543211"}`),
		Boundary:               json.RawMessage(`{"approach":"Operational Control","scopesIncluded":["Scope 1","Scope 2","Scope 3 Cat 1 (Purchased Goods)"]}`),
		Status:                 "Active",
		Verification:           json.RawMessage(`{"status":"Verified","agency":"TUV Rheinland India","verifiedUntil":"2026-12-31"}`),
		CreatedAt:              time.Now().Add(-180 * 24 * time.Hour),
		UpdatedAt:              time.Now(),
	}

	// Seed Facility
	s.facilities[defaultTenant] = []*FacilityModel{
		{
			ID:                 "FAC-042",
			TenantID:           defaultTenant,
			Name:               "Bellary Integrated Steel Plant",
			Type:               "Manufacturing",
			Country:            "India",
			CountryCode:        "IN",
			Address:            "Bellary Industrial Zone, Karnataka, India",
			Status:             "Active",
			ProcessesCount:     4,
			DevicesCount:       12,
			DataCompleteness:   98.5,
			Emissions:          "18500 kgCO2e/batch",
			Readiness:          "Ready",
			Geo:                json.RawMessage(`{"latitude":15.1394,"longitude":76.9214}`),
			ProductionCapacity: "500000 tpy",
			OperatingHours:     "24/7 Continuous",
			Manager:            json.RawMessage(`{"name":"Vikram Singh","email":"v.singh@sattric.io"}`),
			EnergySources:      json.RawMessage(`["Grid Electricity","Industrial Diesel"]`),
			Utilities:          json.RawMessage(`["Karnataka State Electricity Board","KPTCL Grid"]`),
			Products:           json.RawMessage(`["Hot-Rolled Steel Coil"]`),
			EmissionSources:    json.RawMessage(`["Diesel Generators","Electric Arc Furnace","Blast Furnace"]`),
			ProcessTree:        json.RawMessage(`{"root":"Smelting","branches":["Refining","Casting","Rolling"]}`),
			CreatedAt:          time.Now().Add(-180 * 24 * time.Hour),
			UpdatedAt:          time.Now(),
		},
	}

	// Seed Process
	s.processes[defaultTenant] = []*ProcessModel{
		{
			ID:             "PROC-001",
			TenantID:       defaultTenant,
			FacilityID:     "FAC-042",
			FacilityName:   "Bellary Integrated Steel Plant",
			Name:           "Direct Reduced Iron Smelting & Rolling",
			ProductionLine: "Line 1 - Hot Strip Mill",
			EnergySource:   "Electric Arc + Diesel Backup",
			Inputs:         json.RawMessage(`[{"name":"Iron Ore Pellets","quantity":15000,"unit":"kg"},{"name":"Industrial Diesel","quantity":2450,"unit":"L"}]`),
			Outputs:        json.RawMessage(`[{"name":"Hot-Rolled Steel Coil","quantity":10000,"unit":"kg"}]`),
			Meters:         json.RawMessage(`["MTR-S1-001","MTR-S2-001"]`),
			Scopes:         json.RawMessage(`["Scope 1","Scope 2","Scope 3"]`),
			Status:         "Active",
			Description:    "Primary smelting and rolling process for steel coil production.",
			PCFTrace:       json.RawMessage(`{"intensity":1.850,"unit":"kgCO2e/kg"}`),
			CreatedAt:      time.Now().Add(-180 * 24 * time.Hour),
			UpdatedAt:      time.Now(),
		},
	}

	// Seed User
	s.users[defaultTenant] = []*OrganisationUserModel{
		{
			ID:            "USR-001",
			TenantID:      defaultTenant,
			Name:          "Rajesh Kumar",
			Email:         "rajesh@sattric.io",
			Role:          "Admin",
			FacilityScope: "All Facilities",
			LastLogin:     time.Now().Add(-2 * time.Hour).Format(time.RFC3339),
			Status:        "Active",
			CreatedAt:     time.Now().Add(-180 * 24 * time.Hour),
		},
		{
			ID:            "USR-002",
			TenantID:      defaultTenant,
			Name:          "Dr. Ananya Sharma",
			Email:         "ananya@sattric.io",
			Role:          "Sustainability Lead",
			FacilityScope: "FAC-042",
			LastLogin:     time.Now().Add(-1 * time.Hour).Format(time.RFC3339),
			Status:        "Active",
			CreatedAt:     time.Now().Add(-120 * 24 * time.Hour),
		},
	}

	// Seed Reporting Period
	s.reportingPeriods[defaultTenant] = []*ReportingPeriodModel{
		{
			ID:                 "PERIOD-2026-Q1",
			TenantID:           defaultTenant,
			Name:               "FY2026 Q1 Carbon Reporting",
			StartDate:          "2026-01-01",
			EndDate:            "2026-03-31",
			FacilitiesScope:    "FAC-042",
			CCFStatus:          "Verified",
			DataCompleteness:   99.2,
			VerificationStatus: "Verified",
			CurrentStepIndex:   4,
			Versions:           json.RawMessage(`[{"version":"v1.0","calculatedAt":"2026-03-31T23:59:59Z"}]`),
			CreatedAt:          time.Now().Add(-90 * 24 * time.Hour),
			UpdatedAt:          time.Now(),
		},
	}

	// Seed Localisation
	s.localisations[defaultTenant] = &LocalisationModel{
		TenantID:   defaultTenant,
		Country:    "India",
		Currency:   "INR",
		Timezone:   "Asia/Kolkata",
		Language:   "en-IN",
		Units:      json.RawMessage(`{"mass":"kg","energy":"kWh","volume":"liter","carbon":"tCO2e"}`),
		Regulatory: json.RawMessage(`{"frameworks":["EU CBAM","ISO 14067","GHG Protocol"],"cbamRegistryID":"IN-CBAM-9001"}`),
		UpdatedAt:  time.Now(),
	}

	// Seed Approvals
	s.approvals[defaultTenant] = []*ApprovalModel{
		{
			ID:            "APP-2026-001",
			TenantID:      defaultTenant,
			Title:         "CBAM Q1 Passport Batch Issue Signoff",
			Type:          "Passport Issuance",
			Facility:      "Bellary Integrated Steel Plant",
			SubmittedBy:   json.RawMessage(`{"name":"Dr. Ananya Sharma","email":"ananya@sattric.io"}`),
			SubmittedDate: time.Now().Add(-2 * 24 * time.Hour).Format("2006-01-02"),
			RiskLevel:     "Low",
			Status:        "Approved",
			WhatChanged:   json.RawMessage(`{"batchID":"ST-2026-00981","footprintKg":18500.0}`),
			Evidence:      "Verification Report ACV-2026-088",
			History:       json.RawMessage(`[{"action":"Submitted","by":"Dr. Ananya Sharma"},{"action":"Approved","by":"Rajesh Kumar"}]`),
			CreatedAt:     time.Now().Add(-2 * 24 * time.Hour),
			UpdatedAt:     time.Now(),
		},
	}

	// Seed Agency
	s.agencies[defaultTenant] = []*AgencyModel{
		{
			AgencyID:             "AGENCY-001",
			TenantID:             defaultTenant,
			LegalName:            "TUV Rheinland India Pvt Ltd",
			AccreditationBody:    "NABCB / EA Accredited",
			AccreditationNumber:  "NABCB-ACV-2026-042",
			AccreditationStatus:  "Accredited",
			AccreditationExpiry:  time.Now().Add(365 * 24 * time.Hour),
			ScopeOfAccreditation: json.RawMessage(`{"sectors":["Iron & Steel","Aluminum","Fertilizers"],"standards":["ISO 14065","ISO 14064-3","EU CBAM Verification"]}`),
			CreatedAt:            time.Now().Add(-180 * 24 * time.Hour),
			UpdatedAt:            time.Now(),
		},
	}

	// Seed Engagements
	s.engagements[defaultTenant] = []*VerificationEngagementModel{
		{
			EngagementID: "ENG-2026-001",
			TenantID:     defaultTenant,
			AgencyID:     "AGENCY-001",
			PeriodID:     "PERIOD-2026-Q1",
			Scope:        json.RawMessage(`{"facilities":["FAC-042"],"standards":["EU CBAM Implementing Reg 2023/1773","ISO 14067"]}`),
			Status:       "Accepted",
			AcceptedBy:   "Rajesh Kumar",
			CreatedAt:    time.Now().Add(-30 * 24 * time.Hour),
			UpdatedAt:    time.Now(),
		},
	}

	// Seed Passport
	passID := "PASS-2026-981-v1.0"
	s.passports[passID] = &CarbonPassportModel{
		PassportID:         passID,
		TenantID:           defaultTenant,
		FacilityID:         "FAC-042",
		BatchNumber:        "ST-2026-00981",
		CommodityType:      "Steel",
		VerificationStatus: "Verified",
		Scope1KgCO2e:       6566.0,
		Scope2KgCO2e:       10082.0,
		Scope3KgCO2e:       1852.0,
		TotalFootprintKg:   18500.0,
		CalculationDetails: json.RawMessage(`{"intensity_per_kg":1.85,"cel_rulebook":"RULE-CBAM-STEEL-2026","lineage_dag_root":"NODE_ORG_9001","batch_data":{"product_name":"Hot-Rolled Steel Coil","commodity":"Steel","batch_id":"ST-2026-00981","batch_size_quantity":10000,"facility_name":"Bellary Integrated Steel Plant","facility_location":"Karnataka, India"}}`),
		IssuedAt:           time.Now().Add(-1 * 24 * time.Hour),
		DataHash:           "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
	}

	s.auditTrails[passID] = []*PassportAuditTrailModel{
		{
			AuditID:       "AUD-001",
			PassportID:    passID,
			PreviousHash:  "",
			CurrentHash:   "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
			ActionType:    "ISSUE_PASSPORT",
			Timestamp:     time.Now().Add(-1 * 24 * time.Hour),
			ChangePayload: json.RawMessage(`{"action":"Passport Issued","status":"Verified","intensity":1.850}`),
		},
	}
}

// --- Passport Operations ---

func (e *NexusGraphEngine) SavePassportAndAudit(ctx context.Context, p *CarbonPassportModel, audit *PassportAuditTrailModel) error {
	s := getStore()
	s.storeMu.Lock()
	defer s.storeMu.Unlock()

	tenantID, _ := tenant.GetTenant(ctx)
	if tenantID != "" {
		p.TenantID = tenantID
	}
	if p.IssuedAt.IsZero() {
		p.IssuedAt = time.Now()
	}

	s.passports[p.PassportID] = p
	if audit != nil {
		s.auditTrails[p.PassportID] = append(s.auditTrails[p.PassportID], audit)
	}

	// Also index in Nexus graph topology node map
	e.mu.Lock()
	e.nodes[p.PassportID] = LineageNode{
		NodeID:      p.PassportID,
		NodeType:    "PASSPORT",
		ReferenceID: p.BatchNumber,
		Label:       fmt.Sprintf("Carbon Passport %s", p.BatchNumber),
		Properties: map[string]interface{}{
			"tenant_id":           p.TenantID,
			"facility_id":         p.FacilityID,
			"commodity":           p.CommodityType,
			"verification_status": p.VerificationStatus,
			"total_footprint_kg":  p.TotalFootprintKg,
			"data_hash":           p.DataHash,
		},
		CreatedAt: p.IssuedAt,
	}
	e.mu.Unlock()

	return nil
}

func (e *NexusGraphEngine) UpdatePassportAndAudit(ctx context.Context, p *CarbonPassportModel, audit *PassportAuditTrailModel) error {
	return e.SavePassportAndAudit(ctx, p, audit)
}

func (e *NexusGraphEngine) GetPassportByID(ctx context.Context, passportID string) (*CarbonPassportModel, error) {
	s := getStore()
	s.storeMu.RLock()
	defer s.storeMu.RUnlock()

	p, ok := s.passports[passportID]
	if !ok {
		return nil, fmt.Errorf("passport not found: %s", passportID)
	}
	return p, nil
}

func (e *NexusGraphEngine) GetPassportByBatchNumber(ctx context.Context, batchNumber string) (*CarbonPassportModel, error) {
	s := getStore()
	s.storeMu.RLock()
	defer s.storeMu.RUnlock()

	for _, p := range s.passports {
		if p.BatchNumber == batchNumber {
			return p, nil
		}
	}
	return nil, fmt.Errorf("passport for batch number %s not found", batchNumber)
}

func (e *NexusGraphEngine) ListPassports(ctx context.Context) ([]*CarbonPassportModel, error) {
	s := getStore()
	s.storeMu.RLock()
	defer s.storeMu.RUnlock()

	tenantID, _ := tenant.GetTenant(ctx)
	var result []*CarbonPassportModel
	for _, p := range s.passports {
		if tenantID == "" || p.TenantID == tenantID {
			result = append(result, p)
		}
	}
	return result, nil
}

func (e *NexusGraphEngine) DeletePassportByPassportID(ctx context.Context, passportID string) error {
	s := getStore()
	s.storeMu.Lock()
	defer s.storeMu.Unlock()

	delete(s.passports, passportID)
	delete(s.auditTrails, passportID)

	e.mu.Lock()
	delete(e.nodes, passportID)
	e.mu.Unlock()

	return nil
}

func (e *NexusGraphEngine) DeletePassportByBatchNumber(ctx context.Context, batchNumber string) error {
	s := getStore()
	s.storeMu.Lock()
	defer s.storeMu.Unlock()

	for id, p := range s.passports {
		if p.BatchNumber == batchNumber {
			delete(s.passports, id)
			delete(s.auditTrails, id)

			e.mu.Lock()
			delete(e.nodes, id)
			e.mu.Unlock()
			break
		}
	}
	return nil
}

// --- Product Operations ---

func (e *NexusGraphEngine) SaveProduct(ctx context.Context, p *ProductModel) error {
	s := getStore()
	s.storeMu.Lock()
	defer s.storeMu.Unlock()

	tenantID, _ := tenant.GetTenant(ctx)
	if tenantID != "" && p.TenantID == "" {
		p.TenantID = tenantID
	}
	if p.CreatedAt.IsZero() {
		p.CreatedAt = time.Now()
	}
	p.LastUpdated = time.Now()

	s.products[p.Name] = p
	if p.BatchID != "" {
		s.products[p.BatchID] = p
	}

	// Also index in Nexus graph topology node map
	e.mu.Lock()
	e.nodes[p.BatchID] = LineageNode{
		NodeID:      p.BatchID,
		NodeType:    "BATCH",
		ReferenceID: p.BatchID,
		Label:       fmt.Sprintf("Batch %s (%s)", p.BatchID, p.CommodityType),
		Properties: map[string]interface{}{
			"tenant_id":        p.TenantID,
			"facility_id":      p.FacilityID,
			"product_name":     p.ProductName,
			"commodity_type":   p.CommodityType,
			"phase":            p.Phase,
			"passport_id":      p.PassportID,
			"total_footprint":  p.TotalFootprintKg,
			"data_hash":        p.DataHash,
		},
		CreatedAt: p.CreatedAt,
	}
	e.mu.Unlock()

	return nil
}

func (e *NexusGraphEngine) GetProduct(ctx context.Context, identifier string) (*ProductModel, error) {
	s := getStore()
	s.storeMu.RLock()
	defer s.storeMu.RUnlock()

	if p, ok := s.products[identifier]; ok {
		return p, nil
	}
	for _, prod := range s.products {
		if prod.Name == identifier || prod.BatchID == identifier {
			return prod, nil
		}
	}
	return nil, fmt.Errorf("product not found: %s", identifier)
}

func (e *NexusGraphEngine) ListProducts(ctx context.Context, tenantID string) ([]*ProductModel, error) {
	s := getStore()
	s.storeMu.RLock()
	defer s.storeMu.RUnlock()

	seen := make(map[string]bool)
	var result []*ProductModel
	for _, p := range s.products {
		if seen[p.BatchID] {
			continue
		}
		if tenantID == "" || p.TenantID == tenantID || tenantID == "all" {
			seen[p.BatchID] = true
			result = append(result, p)
		}
	}
	return result, nil
}

func (e *NexusGraphEngine) DeleteProduct(ctx context.Context, identifier string) error {
	s := getStore()
	s.storeMu.Lock()
	defer s.storeMu.Unlock()

	var batchID string
	if p, ok := s.products[identifier]; ok {
		batchID = p.BatchID
		delete(s.products, p.Name)
		delete(s.products, p.BatchID)
	} else {
		delete(s.products, identifier)
		batchID = identifier
	}

	if batchID != "" {
		e.mu.Lock()
		delete(e.nodes, batchID)
		e.mu.Unlock()
	}

	return nil
}

// --- Rulebook Operations ---

func (e *NexusGraphEngine) SaveRulebook(ctx context.Context, r *RulebookModel) error {
	s := getStore()
	s.storeMu.Lock()
	defer s.storeMu.Unlock()

	if r.CreatedAt.IsZero() {
		r.CreatedAt = time.Now()
	}
	s.rulebooks[r.Name] = r
	if r.ID != "" {
		s.rulebooks[r.ID] = r
	}

	return nil
}

func (e *NexusGraphEngine) GetRulebook(ctx context.Context, name string) (*RulebookModel, error) {
	s := getStore()
	s.storeMu.RLock()
	defer s.storeMu.RUnlock()

	if r, ok := s.rulebooks[name]; ok {
		return r, nil
	}
	return nil, fmt.Errorf("rulebook not found: %s", name)
}

func (e *NexusGraphEngine) ListRulebooks(ctx context.Context) ([]*RulebookModel, error) {
	s := getStore()
	s.storeMu.RLock()
	defer s.storeMu.RUnlock()

	seen := make(map[string]bool)
	var result []*RulebookModel
	for _, r := range s.rulebooks {
		if seen[r.Name] {
			continue
		}
		seen[r.Name] = true
		result = append(result, r)
	}
	return result, nil
}

// --- Redis Replacement In-Memory Cache Operations ---

func (e *NexusGraphEngine) CachePassport(ctx context.Context, cacheKey string, data interface{}, ttl time.Duration) error {
	s := getStore()
	s.storeMu.Lock()
	defer s.storeMu.Unlock()

	bytes, err := json.Marshal(data)
	if err != nil {
		return err
	}
	s.cacheMap[cacheKey] = bytes
	return nil
}

func (e *NexusGraphEngine) GetPassportCache(ctx context.Context, cacheKey string) ([]byte, error) {
	s := getStore()
	s.storeMu.RLock()
	defer s.storeMu.RUnlock()

	bytes, ok := s.cacheMap[cacheKey]
	if !ok {
		return nil, fmt.Errorf("cache miss for key: %s", cacheKey)
	}
	return bytes, nil
}

func (e *NexusGraphEngine) DeletePassportCache(ctx context.Context, cacheKey string) error {
	s := getStore()
	s.storeMu.Lock()
	defer s.storeMu.Unlock()

	delete(s.cacheMap, cacheKey)
	return nil
}

// --- Organisation Operations ---

func (e *NexusGraphEngine) GetTenantProfile(ctx context.Context) (*TenantProfileModel, error) {
	s := getStore()
	s.storeMu.RLock()
	defer s.storeMu.RUnlock()

	tID, _ := tenant.GetTenant(ctx)
	if tID == "" {
		tID = "tenant-default"
	}

	p, ok := s.tenantProfiles[tID]
	if !ok {
		return nil, fmt.Errorf("profile not found for tenant: %s", tID)
	}
	return p, nil
}

func (e *NexusGraphEngine) SaveTenantProfile(ctx context.Context, p *TenantProfileModel) error {
	s := getStore()
	s.storeMu.Lock()
	defer s.storeMu.Unlock()

	tID, _ := tenant.GetTenant(ctx)
	if tID != "" {
		p.TenantID = tID
	} else if p.TenantID == "" {
		p.TenantID = "tenant-default"
	}
	p.UpdatedAt = time.Now()
	if p.CreatedAt.IsZero() {
		p.CreatedAt = time.Now()
	}

	s.tenantProfiles[p.TenantID] = p

	return nil
}

func (e *NexusGraphEngine) ListFacilities(ctx context.Context) ([]*FacilityModel, error) {
	s := getStore()
	s.storeMu.RLock()
	defer s.storeMu.RUnlock()

	tID, _ := tenant.GetTenant(ctx)
	if tID == "" {
		tID = "tenant-default"
	}
	return s.facilities[tID], nil
}

func (e *NexusGraphEngine) SaveFacility(ctx context.Context, f *FacilityModel) error {
	s := getStore()
	s.storeMu.Lock()
	defer s.storeMu.Unlock()

	tID, _ := tenant.GetTenant(ctx)
	if tID != "" {
		f.TenantID = tID
	} else if f.TenantID == "" {
		f.TenantID = "tenant-default"
	}

	f.UpdatedAt = time.Now()
	if f.CreatedAt.IsZero() {
		f.CreatedAt = time.Now()
	}

	facs := s.facilities[f.TenantID]
	found := false
	for idx, existing := range facs {
		if existing.ID == f.ID {
			facs[idx] = f
			found = true
			break
		}
	}
	if !found {
		s.facilities[f.TenantID] = append(facs, f)
	}

	return nil
}

func (e *NexusGraphEngine) DeleteFacility(ctx context.Context, facilityID string) error {
	s := getStore()
	s.storeMu.Lock()
	defer s.storeMu.Unlock()

	tID, _ := tenant.GetTenant(ctx)
	if tID == "" {
		tID = "tenant-default"
	}

	facs := s.facilities[tID]
	var updated []*FacilityModel
	for _, f := range facs {
		if f.ID != facilityID {
			updated = append(updated, f)
		}
	}
	s.facilities[tID] = updated

	return nil
}

func (e *NexusGraphEngine) ListProcesses(ctx context.Context) ([]*ProcessModel, error) {
	s := getStore()
	s.storeMu.RLock()
	defer s.storeMu.RUnlock()

	tID, _ := tenant.GetTenant(ctx)
	if tID == "" {
		tID = "tenant-default"
	}
	return s.processes[tID], nil
}

func (e *NexusGraphEngine) SaveProcess(ctx context.Context, p *ProcessModel) error {
	s := getStore()
	s.storeMu.Lock()
	defer s.storeMu.Unlock()

	tID, _ := tenant.GetTenant(ctx)
	if tID != "" {
		p.TenantID = tID
	} else if p.TenantID == "" {
		p.TenantID = "tenant-default"
	}

	p.UpdatedAt = time.Now()
	if p.CreatedAt.IsZero() {
		p.CreatedAt = time.Now()
	}

	procs := s.processes[p.TenantID]
	found := false
	for idx, existing := range procs {
		if existing.ID == p.ID {
			procs[idx] = p
			found = true
			break
		}
	}
	if !found {
		s.processes[p.TenantID] = append(procs, p)
	}

	return nil
}

func (e *NexusGraphEngine) DeleteProcess(ctx context.Context, processID string) error {
	s := getStore()
	s.storeMu.Lock()
	defer s.storeMu.Unlock()

	tID, _ := tenant.GetTenant(ctx)
	if tID == "" {
		tID = "tenant-default"
	}

	procs := s.processes[tID]
	var updated []*ProcessModel
	for _, p := range procs {
		if p.ID != processID {
			updated = append(updated, p)
		}
	}
	s.processes[tID] = updated

	return nil
}

func (e *NexusGraphEngine) ListOrganisationUsers(ctx context.Context) ([]*OrganisationUserModel, error) {
	s := getStore()
	s.storeMu.RLock()
	defer s.storeMu.RUnlock()

	tID, _ := tenant.GetTenant(ctx)
	if tID == "" {
		tID = "tenant-default"
	}
	return s.users[tID], nil
}

func (e *NexusGraphEngine) SaveOrganisationUser(ctx context.Context, u *OrganisationUserModel) error {
	s := getStore()
	s.storeMu.Lock()
	defer s.storeMu.Unlock()

	tID, _ := tenant.GetTenant(ctx)
	if tID != "" {
		u.TenantID = tID
	} else if u.TenantID == "" {
		u.TenantID = "tenant-default"
	}

	if u.CreatedAt.IsZero() {
		u.CreatedAt = time.Now()
	}

	usrs := s.users[u.TenantID]
	found := false
	for idx, existing := range usrs {
		if existing.ID == u.ID {
			usrs[idx] = u
			found = true
			break
		}
	}
	if !found {
		s.users[u.TenantID] = append(usrs, u)
	}
	return nil
}

func (e *NexusGraphEngine) UpdateUserRole(ctx context.Context, userID, newRole string) error {
	s := getStore()
	s.storeMu.Lock()
	defer s.storeMu.Unlock()

	tID, _ := tenant.GetTenant(ctx)
	if tID == "" {
		tID = "tenant-default"
	}

	for _, u := range s.users[tID] {
		if u.ID == userID {
			u.Role = newRole
			return nil
		}
	}
	return fmt.Errorf("user %s not found", userID)
}

func (e *NexusGraphEngine) ListReportingPeriods(ctx context.Context) ([]*ReportingPeriodModel, error) {
	s := getStore()
	s.storeMu.RLock()
	defer s.storeMu.RUnlock()

	tID, _ := tenant.GetTenant(ctx)
	if tID == "" {
		tID = "tenant-default"
	}
	return s.reportingPeriods[tID], nil
}

func (e *NexusGraphEngine) SaveReportingPeriod(ctx context.Context, p *ReportingPeriodModel) error {
	s := getStore()
	s.storeMu.Lock()
	defer s.storeMu.Unlock()

	tID, _ := tenant.GetTenant(ctx)
	if tID != "" {
		p.TenantID = tID
	} else if p.TenantID == "" {
		p.TenantID = "tenant-default"
	}

	p.UpdatedAt = time.Now()
	if p.CreatedAt.IsZero() {
		p.CreatedAt = time.Now()
	}

	periods := s.reportingPeriods[p.TenantID]
	found := false
	for idx, existing := range periods {
		if existing.ID == p.ID {
			periods[idx] = p
			found = true
			break
		}
	}
	if !found {
		s.reportingPeriods[p.TenantID] = append(periods, p)
	}
	return nil
}

func (e *NexusGraphEngine) GetLocalisation(ctx context.Context) (*LocalisationModel, error) {
	s := getStore()
	s.storeMu.RLock()
	defer s.storeMu.RUnlock()

	tID, _ := tenant.GetTenant(ctx)
	if tID == "" {
		tID = "tenant-default"
	}

	loc, ok := s.localisations[tID]
	if !ok {
		return nil, fmt.Errorf("localisation not found for tenant: %s", tID)
	}
	return loc, nil
}

func (e *NexusGraphEngine) SaveLocalisation(ctx context.Context, loc *LocalisationModel) error {
	s := getStore()
	s.storeMu.Lock()
	defer s.storeMu.Unlock()

	tID, _ := tenant.GetTenant(ctx)
	if tID != "" {
		loc.TenantID = tID
	} else if loc.TenantID == "" {
		loc.TenantID = "tenant-default"
	}
	loc.UpdatedAt = time.Now()

	s.localisations[loc.TenantID] = loc
	return nil
}

func (e *NexusGraphEngine) ListApprovals(ctx context.Context) ([]*ApprovalModel, error) {
	s := getStore()
	s.storeMu.RLock()
	defer s.storeMu.RUnlock()

	tID, _ := tenant.GetTenant(ctx)
	if tID == "" {
		tID = "tenant-default"
	}
	return s.approvals[tID], nil
}

func (e *NexusGraphEngine) SaveApproval(ctx context.Context, a *ApprovalModel) error {
	s := getStore()
	s.storeMu.Lock()
	defer s.storeMu.Unlock()

	tID, _ := tenant.GetTenant(ctx)
	if tID != "" {
		a.TenantID = tID
	} else if a.TenantID == "" {
		a.TenantID = "tenant-default"
	}

	a.UpdatedAt = time.Now()
	if a.CreatedAt.IsZero() {
		a.CreatedAt = time.Now()
	}

	apps := s.approvals[a.TenantID]
	found := false
	for idx, existing := range apps {
		if existing.ID == a.ID {
			apps[idx] = a
			found = true
			break
		}
	}
	if !found {
		s.approvals[a.TenantID] = append(apps, a)
	}
	return nil
}

// --- ACV Verification Operations ---

func (e *NexusGraphEngine) CreateAgency(ctx context.Context, agency *AgencyModel) error {
	s := getStore()
	s.storeMu.Lock()
	defer s.storeMu.Unlock()

	tID, _ := tenant.GetTenant(ctx)
	if tID != "" {
		agency.TenantID = tID
	} else if agency.TenantID == "" {
		agency.TenantID = "tenant-default"
	}
	if agency.CreatedAt.IsZero() {
		agency.CreatedAt = time.Now()
	}
	agency.UpdatedAt = time.Now()

	s.agencies[agency.TenantID] = append(s.agencies[agency.TenantID], agency)
	return nil
}

func (e *NexusGraphEngine) ListAgencies(ctx context.Context) ([]*AgencyModel, error) {
	s := getStore()
	s.storeMu.RLock()
	defer s.storeMu.RUnlock()

	tID, _ := tenant.GetTenant(ctx)
	if tID == "" {
		tID = "tenant-default"
	}
	return s.agencies[tID], nil
}

func (e *NexusGraphEngine) CreateEngagement(ctx context.Context, eng *VerificationEngagementModel) error {
	s := getStore()
	s.storeMu.Lock()
	defer s.storeMu.Unlock()

	tID, _ := tenant.GetTenant(ctx)
	if tID != "" {
		eng.TenantID = tID
	} else if eng.TenantID == "" {
		eng.TenantID = "tenant-default"
	}
	if eng.CreatedAt.IsZero() {
		eng.CreatedAt = time.Now()
	}
	eng.UpdatedAt = time.Now()

	s.engagements[eng.TenantID] = append(s.engagements[eng.TenantID], eng)
	return nil
}

func (e *NexusGraphEngine) ListEngagements(ctx context.Context) ([]*VerificationEngagementModel, error) {
	s := getStore()
	s.storeMu.RLock()
	defer s.storeMu.RUnlock()

	tID, _ := tenant.GetTenant(ctx)
	if tID == "" {
		tID = "tenant-default"
	}
	return s.engagements[tID], nil
}

func (e *NexusGraphEngine) AssignTeamMember(ctx context.Context, m *EngagementTeamMemberModel) error {
	s := getStore()
	s.storeMu.Lock()
	defer s.storeMu.Unlock()

	tID, _ := tenant.GetTenant(ctx)
	if tID != "" {
		m.TenantID = tID
	} else if m.TenantID == "" {
		m.TenantID = "tenant-default"
	}
	if m.AssignedAt.IsZero() {
		m.AssignedAt = time.Now()
	}

	s.teamMembers[m.TenantID] = append(s.teamMembers[m.TenantID], m)
	return nil
}

func (e *NexusGraphEngine) SubmitCOIDeclaration(ctx context.Context, c *COIDeclarationModel) error {
	s := getStore()
	s.storeMu.Lock()
	defer s.storeMu.Unlock()

	tID, _ := tenant.GetTenant(ctx)
	if tID != "" {
		c.TenantID = tID
	} else if c.TenantID == "" {
		c.TenantID = "tenant-default"
	}
	if c.DeclaredAt.IsZero() {
		c.DeclaredAt = time.Now()
	}

	s.coiDeclarations[c.TenantID] = append(s.coiDeclarations[c.TenantID], c)
	return nil
}

func (e *NexusGraphEngine) CreateFinding(ctx context.Context, f *FindingModel) error {
	s := getStore()
	s.storeMu.Lock()
	defer s.storeMu.Unlock()

	tID, _ := tenant.GetTenant(ctx)
	if tID != "" {
		f.TenantID = tID
	} else if f.TenantID == "" {
		f.TenantID = "tenant-default"
	}
	if f.CreatedAt.IsZero() {
		f.CreatedAt = time.Now()
	}
	f.UpdatedAt = time.Now()

	s.findings[f.TenantID] = append(s.findings[f.TenantID], f)
	return nil
}

func (e *NexusGraphEngine) ListFindings(ctx context.Context, engagementID string) ([]*FindingModel, error) {
	s := getStore()
	s.storeMu.RLock()
	defer s.storeMu.RUnlock()

	tID, _ := tenant.GetTenant(ctx)
	if tID == "" {
		tID = "tenant-default"
	}
	var res []*FindingModel
	for _, f := range s.findings[tID] {
		if engagementID == "" || f.EngagementID == engagementID {
			res = append(res, f)
		}
	}
	return res, nil
}

func (e *NexusGraphEngine) SignoffEngagement(ctx context.Context, s *ReviewSignoffModel, frozenBy string) error {
	st := getStore()
	st.storeMu.Lock()
	defer st.storeMu.Unlock()

	tID, _ := tenant.GetTenant(ctx)
	if tID != "" {
		s.TenantID = tID
	} else if s.TenantID == "" {
		s.TenantID = "tenant-default"
	}
	if s.SignedAt.IsZero() {
		s.SignedAt = time.Now()
	}

	st.signoffs[s.TenantID] = append(st.signoffs[s.TenantID], s)

	// Update passport status if matching passport exists
	if p, ok := st.passports[s.PassportID]; ok {
		p.VerificationStatus = "Verified"
	}

	return nil
}

func (e *NexusGraphEngine) GetPublicPassportSummary(ctx context.Context, passportID string) (*PublicPassportSummaryModel, error) {
	s := getStore()
	s.storeMu.RLock()
	defer s.storeMu.RUnlock()

	p, ok := s.passports[passportID]
	if !ok {
		return nil, fmt.Errorf("passport not found: %s", passportID)
	}

	opinion := "Unqualified"
	tID, _ := tenant.GetTenant(ctx)
	if tID == "" {
		tID = "tenant-default"
	}
	for _, sign := range s.signoffs[tID] {
		if sign.PassportID == passportID {
			opinion = sign.Opinion
			break
		}
	}

	return &PublicPassportSummaryModel{
		PassportID:         p.PassportID,
		CommodityType:      p.CommodityType,
		TotalFootprintKg:   p.TotalFootprintKg,
		VerificationStatus: p.VerificationStatus,
		ReviewOpinion:      opinion,
		IssuedAt:           p.IssuedAt,
	}, nil
}
