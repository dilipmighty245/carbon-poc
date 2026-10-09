package nexus

import (
	"encoding/json"
	"time"
)

// Carbon Passport Lifecycle Statuses
const (
	StatusDraft               = "Draft"
	StatusDataCompleted       = "DataCompleted"
	StatusSubmitted           = "Submitted"
	StatusUnderVerification   = "UnderVerification"
	StatusCorrectionsRequired = "CorrectionsRequired"
	StatusVerified            = "Verified"
	StatusIssued              = "Issued"
	StatusSubmittedToAgency   = "SubmittedToAgency"
)

// CarbonPassportModel represents a calculated or verified passport in the Nexus graph.
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
	DataHash           string          `json:"data_hash"`
	IssuedAt           time.Time       `json:"issued_at"`
}

// PassportAuditTrailModel records an immutable transition in a passport's lifecycle.
type PassportAuditTrailModel struct {
	PassportID    string          `json:"passport_id"`
	ActionType    string          `json:"action_type"`
	PreviousHash  string          `json:"previous_hash"`
	CurrentHash   string          `json:"current_hash"`
	ChangePayload json.RawMessage `json:"change_payload"`
	Timestamp     time.Time       `json:"timestamp"`
}

// ProductEventType defines lifecycle events on Product nodes.
type ProductEventType string

const (
	ProductEventAdded    ProductEventType = "ADDED"
	ProductEventUpdated  ProductEventType = "UPDATED"
	ProductEventDeleted  ProductEventType = "DELETED"
	ProductEventFallback ProductEventType = "FALLBACK"
)

// ProductEvent is an event published to reconciler subscribers.
type ProductEvent struct {
	Type      ProductEventType `json:"type"`
	ProductID string           `json:"product_id"`
	TenantID  string           `json:"tenant_id"`
	Product   *ProductModel    `json:"product,omitempty"`
}

// ProductModel represents a batch product tracked in the inventory branch.
type ProductModel struct {
	Name             string    `json:"name"`
	Namespace        string    `json:"namespace"`
	TenantID         string    `json:"tenant_id"`
	FacilityID       string    `json:"facility_id"`
	BatchID          string    `json:"batch_id"`
	ProductName      string    `json:"product_name"`
	CommodityType    string    `json:"commodity_type"`
	CnCode           string    `json:"cn_code,omitempty"`
	HsCode           string    `json:"hs_code,omitempty"`
	ActivityDataRaw  string    `json:"activity_data_raw"`
	RulebookRefName  string    `json:"rulebook_ref_name"`
	Phase            string    `json:"phase"`
	PassportID       string    `json:"passport_id,omitempty"`
	TotalFootprintKg float64   `json:"total_footprint_kg,omitempty"`
	DataHash         string    `json:"data_hash,omitempty"`
	CreatedAt        time.Time `json:"created_at"`
	LastUpdated      time.Time `json:"last_updated"`
}

// RulebookModel defines a calculation rulebook specification.
type RulebookModel struct {
	ID             string          `json:"id,omitempty"`
	Name           string          `json:"name,omitempty"`
	RulebookID     string          `json:"rulebook_id"`
	Namespace      string          `json:"namespace,omitempty"`
	Label          string          `json:"label,omitempty"`
	CommodityType  string          `json:"commodity_type"`
	Version        string          `json:"version"`
	AccountingMode string          `json:"accounting_mode"`
	Standard       string          `json:"standard,omitempty"`
	FunctionalUnit string          `json:"functional_unit"`
	BatchQuantity  float64         `json:"batch_quantity"`
	Scope1Formula  string          `json:"scope1_formula"`
	Scope2Formula  string          `json:"scope2_formula"`
	Scope3Formula  string          `json:"scope3_formula"`
	RulesRaw       json.RawMessage `json:"rules_raw"`
	CreatedAt      time.Time       `json:"created_at,omitempty"`
}

// TenantProfileModel represents legal entity and organisation profile metadata.
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

// FacilityModel represents an operating facility under a Tenant.
type FacilityModel struct {
	ID                 string          `json:"id"`
	TenantID           string          `json:"tenant_id"`
	Name               string          `json:"name"`
	Type               string          `json:"type"`
	Country            string          `json:"country"`
	CountryCode        string          `json:"country_code"`
	Address            string          `json:"address"`
	Status             string          `json:"status"`
	ProcessesCount     int             `json:"processes_count"`
	DevicesCount       int             `json:"devices_count"`
	DataCompleteness   float64         `json:"data_completeness"`
	Emissions          string          `json:"emissions"`
	Readiness          string          `json:"readiness"`
	Geo                json.RawMessage `json:"geo,omitempty"`
	ProductionCapacity string          `json:"production_capacity,omitempty"`
	OperatingHours     string          `json:"operating_hours,omitempty"`
	Manager            json.RawMessage `json:"manager,omitempty"`
	EnergySources      json.RawMessage `json:"energy_sources,omitempty"`
	Utilities          json.RawMessage `json:"utilities,omitempty"`
	Products           json.RawMessage `json:"products,omitempty"`
	EmissionSources    json.RawMessage `json:"emission_sources,omitempty"`
	ProcessTree        json.RawMessage `json:"process_tree,omitempty"`
	CreatedAt          time.Time       `json:"created_at"`
	UpdatedAt          time.Time       `json:"updated_at"`
}

// ProcessModel represents an industrial process line inside a facility.
type ProcessModel struct {
	ID             string          `json:"id"`
	TenantID       string          `json:"tenant_id"`
	FacilityID     string          `json:"facility_id"`
	FacilityName   string          `json:"facility_name"`
	Name           string          `json:"name"`
	ProductionLine string          `json:"production_line"`
	EnergySource   string          `json:"energy_source"`
	Inputs         json.RawMessage `json:"inputs"`
	Outputs        json.RawMessage `json:"outputs"`
	Meters         json.RawMessage `json:"meters"`
	Scopes         json.RawMessage `json:"scopes"`
	Status         string          `json:"status"`
	Description    string          `json:"description"`
	PCFTrace       json.RawMessage `json:"pcf_trace"`
	CreatedAt      time.Time       `json:"created_at"`
	UpdatedAt      time.Time       `json:"updated_at"`
}

// OrganisationUserModel represents an authenticated or invited platform user.
type OrganisationUserModel struct {
	ID            string    `json:"id"`
	TenantID      string    `json:"tenant_id"`
	Name          string    `json:"name"`
	Email         string    `json:"email"`
	PasswordHash  string    `json:"-"`
	Salt          string    `json:"-"`
	Role          string    `json:"role"`
	FacilityScope string    `json:"facility_scope"`
	LastLogin     string    `json:"last_login"`
	Status        string    `json:"status"`
	CreatedAt     time.Time `json:"created_at"`
}

// ReportingPeriodModel represents a temporal MRV boundary period.
type ReportingPeriodModel struct {
	ID                 string    `json:"id"`
	TenantID           string    `json:"tenant_id"`
	Name               string    `json:"name"`
	Year               int       `json:"year"`
	Quarter            string    `json:"quarter"`
	StartDate          string    `json:"start_date"`
	EndDate            string    `json:"end_date"`
	Status             string    `json:"status"`
	EmissionsTotal     float64   `json:"emissions_total"`
	DataCompleteness   float64   `json:"data_completeness"`
	VerificationStatus string    `json:"verification_status"`
	CreatedAt          time.Time `json:"created_at"`
}

// LocalisationModel stores tenant localisation preferences.
type LocalisationModel struct {
	TenantID            string          `json:"tenant_id"`
	Country             string          `json:"country,omitempty"`
	Currency            string          `json:"currency,omitempty"`
	Timezone            string          `json:"timezone,omitempty"`
	Language            string          `json:"language,omitempty"`
	Units               json.RawMessage `json:"units,omitempty"`
	Regulatory          json.RawMessage `json:"regulatory,omitempty"`
	DefaultLanguage     string          `json:"default_language,omitempty"`
	DefaultCurrency     string          `json:"default_currency,omitempty"`
	DefaultTimezone     string          `json:"default_timezone,omitempty"`
	DefaultEmissionUnit string          `json:"default_emission_unit,omitempty"`
	NumberFormat        string          `json:"number_format,omitempty"`
	DateFormat          string          `json:"date_format,omitempty"`
}

// ApprovalModel tracks governance approval requests.
type ApprovalModel struct {
	ID              string    `json:"id"`
	TenantID        string    `json:"tenant_id"`
	PassportID      string    `json:"passport_id"`
	BatchNumber     string    `json:"batch_number"`
	RequestedBy     string    `json:"requested_by"`
	Role            string    `json:"role"`
	Status          string    `json:"status"` // PENDING, APPROVED, REJECTED
	ApproverComment string    `json:"approver_comment,omitempty"`
	SubmittedAt     time.Time `json:"submitted_at"`
	ResolvedAt      time.Time `json:"resolved_at,omitempty"`
}

// AgencyModel represents an accredited verification agency.
type AgencyModel struct {
	AgencyID            string          `json:"agency_id"`
	TenantID            string          `json:"tenant_id"`
	Name                string          `json:"name"`
	AccreditationNumber string          `json:"accreditation_number"`
	AccreditationBody   string          `json:"accreditation_body"` // e.g. NABCB, DAkkS
	AccreditationStatus string          `json:"accreditation_status"` // Accredited, Suspended, Expired
	AccreditationExpiry time.Time       `json:"accreditation_expiry,omitempty"`
	Scopes              json.RawMessage `json:"scopes"` // e.g. ["Steel", "Cement", "Aluminium"]
	ValidFrom           string          `json:"valid_from"`
	ValidTo             string          `json:"valid_to"`
	ContactEmail        string          `json:"contact_email"`
	ContactPhone        string          `json:"contact_phone"`
	LeadAuditor         string          `json:"lead_auditor"`
	CreatedAt           time.Time       `json:"created_at"`
	UpdatedAt           time.Time       `json:"updated_at"`
}

// VerificationEngagementModel represents an engagement between a tenant and an agency.
type VerificationEngagementModel struct {
	EngagementID     string          `json:"engagement_id"`
	TenantID         string          `json:"tenant_id"`
	AgencyID         string          `json:"agency_id"`
	PassportID       string          `json:"passport_id"`
	BatchID          string          `json:"batch_id"`
	Period           string          `json:"period"`
	Methodology      string          `json:"methodology"`
	SnapshotHash     string          `json:"snapshot_hash"`
	Status           string          `json:"status"` // Assigned, InProgress, SignedOff, Rejected
	AssignedVerifier string          `json:"assigned_verifier"`
	ScopeMatch       bool            `json:"scope_match"`
	FindingsCount    int             `json:"findings_count"`
	Timeline         json.RawMessage `json:"timeline"`
	CreatedAt        time.Time       `json:"created_at"`
	UpdatedAt        time.Time       `json:"updated_at"`
}

// EngagementTeamMemberModel defines an auditor assigned to an engagement.
type EngagementTeamMemberModel struct {
	MemberID     string    `json:"member_id"`
	EngagementID string    `json:"engagement_id"`
	TenantID     string    `json:"tenant_id"`
	Name         string    `json:"name"`
	Role         string    `json:"role"` // Lead Verifier, Technical Expert, Peer Reviewer
	Email        string    `json:"email"`
	AssignedAt   time.Time `json:"assigned_at"`
}

// COIDeclarationModel captures conflict-of-interest sign-offs.
type COIDeclarationModel struct {
	DeclarationID string    `json:"declaration_id"`
	EngagementID  string    `json:"engagement_id"`
	TenantID      string    `json:"tenant_id"`
	AuditorName   string    `json:"auditor_name"`
	AuditorEmail  string    `json:"auditor_email"`
	HasConflict   bool      `json:"has_conflict"`
	Explanation   string    `json:"explanation,omitempty"`
	DeclaredAt    time.Time `json:"declared_at"`
}

// FindingModel represents a non-conformity or observation during audit.
type FindingModel struct {
	FindingID    string    `json:"finding_id"`
	EngagementID string    `json:"engagement_id"`
	TenantID     string    `json:"tenant_id"`
	Category     string    `json:"category"` // Materiality, Methodology, Discrepancy, Scope
	Severity     string    `json:"severity"` // NonConformity, Observation, Opportunity
	Status       string    `json:"status"`   // Open, Resolved, Waived
	Description  string    `json:"description"`
	Discrepancy  float64   `json:"discrepancy_pct,omitempty"`
	RaisedBy     string    `json:"raised_by"`
	ResolvedBy   string    `json:"resolved_by,omitempty"`
	CreatedAt    time.Time `json:"created_at"`
	UpdatedAt    time.Time `json:"updated_at"`
}

// ReviewSignoffModel records the final independent verification verdict.
type ReviewSignoffModel struct {
	SignoffID    string    `json:"signoff_id"`
	EngagementID string    `json:"engagement_id"`
	TenantID     string    `json:"tenant_id"`
	PassportID   string    `json:"passport_id"`
	LeadAuditor  string    `json:"lead_auditor"`
	PeerReviewer string    `json:"peer_reviewer"`
	Opinion      string    `json:"opinion"` // Unqualified, Qualified, Adverse, Disclaimer
	StatementRef string    `json:"statement_ref"`
	Frozen       bool      `json:"frozen"`
	SignedAt     time.Time `json:"signed_at"`
}

// PublicPassportSummaryModel is the non-confidential public QR verification payload.
type PublicPassportSummaryModel struct {
	PassportID         string    `json:"passport_id"`
	CommodityType      string    `json:"commodity_type"`
	TotalFootprintKg   float64   `json:"total_footprint_kg"`
	VerificationStatus string    `json:"verificationStatus"`
	ReviewOpinion      string    `json:"reviewOpinion"`
	IssuedAt           time.Time `json:"issued_at"`
}
