package inventory

import "github.com/dilipmighty245/graph-framework-for-microservices/nexus/nexus"

// Workspace records are owned by their Tenant and persisted as Nexus nodes.

type Process struct {
	nexus.Node
	RecordID       string `json:"recordID,omitempty" mapstructure:"recordID,omitempty"`
	TenantID       string `json:"tenant_id,omitempty" mapstructure:"tenant_id,omitempty"`
	FacilityID     string `json:"facility_id,omitempty" mapstructure:"facility_id,omitempty"`
	FacilityName   string `json:"facility_name,omitempty" mapstructure:"facility_name,omitempty"`
	Name           string `json:"name,omitempty" mapstructure:"name,omitempty"`
	ProductionLine string `json:"production_line,omitempty" mapstructure:"production_line,omitempty"`
	EnergySource   string `json:"energy_source,omitempty" mapstructure:"energy_source,omitempty"`
	Inputs         string `json:"inputs,omitempty" mapstructure:"inputs,omitempty"`
	Outputs        string `json:"outputs,omitempty" mapstructure:"outputs,omitempty"`
	Meters         string `json:"meters,omitempty" mapstructure:"meters,omitempty"`
	Scopes         string `json:"scopes,omitempty" mapstructure:"scopes,omitempty"`
	Status         string `json:"status,omitempty" mapstructure:"status,omitempty"`
	Description    string `json:"description,omitempty" mapstructure:"description,omitempty"`
	PCFTrace       string `json:"pcf_trace,omitempty" mapstructure:"pcf_trace,omitempty"`
	CreatedAt      string `json:"created_at,omitempty" mapstructure:"created_at,omitempty"`
	UpdatedAt      string `json:"updated_at,omitempty" mapstructure:"updated_at,omitempty"`
}

type ReportingPeriod struct {
	nexus.Node
	RecordID           string  `json:"recordID,omitempty" mapstructure:"recordID,omitempty"`
	TenantID           string  `json:"tenant_id,omitempty" mapstructure:"tenant_id,omitempty"`
	Name               string  `json:"name,omitempty" mapstructure:"name,omitempty"`
	Year               int     `json:"year,omitempty" mapstructure:"year,omitempty"`
	Quarter            string  `json:"quarter,omitempty" mapstructure:"quarter,omitempty"`
	StartDate          string  `json:"start_date,omitempty" mapstructure:"start_date,omitempty"`
	EndDate            string  `json:"end_date,omitempty" mapstructure:"end_date,omitempty"`
	Status             string  `json:"status,omitempty" mapstructure:"status,omitempty"`
	EmissionsTotal     float64 `json:"emissions_total,omitempty" mapstructure:"emissions_total,omitempty"`
	DataCompleteness   float64 `json:"data_completeness,omitempty" mapstructure:"data_completeness,omitempty"`
	VerificationStatus string  `json:"verification_status,omitempty" mapstructure:"verification_status,omitempty"`
	CreatedAt          string  `json:"created_at,omitempty" mapstructure:"created_at,omitempty"`
}

type Localisation struct {
	nexus.Node
	TenantID            string `json:"tenant_id,omitempty" mapstructure:"tenant_id,omitempty"`
	Country             string `json:"country,omitempty" mapstructure:"country,omitempty"`
	Currency            string `json:"currency,omitempty" mapstructure:"currency,omitempty"`
	Timezone            string `json:"timezone,omitempty" mapstructure:"timezone,omitempty"`
	Language            string `json:"language,omitempty" mapstructure:"language,omitempty"`
	Units               string `json:"units,omitempty" mapstructure:"units,omitempty"`
	Regulatory          string `json:"regulatory,omitempty" mapstructure:"regulatory,omitempty"`
	DefaultLanguage     string `json:"default_language,omitempty" mapstructure:"default_language,omitempty"`
	DefaultCurrency     string `json:"default_currency,omitempty" mapstructure:"default_currency,omitempty"`
	DefaultTimezone     string `json:"default_timezone,omitempty" mapstructure:"default_timezone,omitempty"`
	DefaultEmissionUnit string `json:"default_emission_unit,omitempty" mapstructure:"default_emission_unit,omitempty"`
	NumberFormat        string `json:"number_format,omitempty" mapstructure:"number_format,omitempty"`
	DateFormat          string `json:"date_format,omitempty" mapstructure:"date_format,omitempty"`
}

type Approval struct {
	nexus.Node
	RecordID        string `json:"recordID,omitempty" mapstructure:"recordID,omitempty"`
	TenantID        string `json:"tenant_id,omitempty" mapstructure:"tenant_id,omitempty"`
	PassportID      string `json:"passport_id,omitempty" mapstructure:"passport_id,omitempty"`
	BatchNumber     string `json:"batch_number,omitempty" mapstructure:"batch_number,omitempty"`
	RequestedBy     string `json:"requested_by,omitempty" mapstructure:"requested_by,omitempty"`
	Role            string `json:"role,omitempty" mapstructure:"role,omitempty"`
	Status          string `json:"status,omitempty" mapstructure:"status,omitempty"`
	ApproverComment string `json:"approver_comment,omitempty" mapstructure:"approver_comment,omitempty"`
	SubmittedAt     string `json:"submitted_at,omitempty" mapstructure:"submitted_at,omitempty"`
	ResolvedAt      string `json:"resolved_at,omitempty" mapstructure:"resolved_at,omitempty"`
}

type VerificationAgency struct {
	nexus.Node
	AgencyID            string `json:"agency_id,omitempty" mapstructure:"agency_id,omitempty"`
	TenantID            string `json:"tenant_id,omitempty" mapstructure:"tenant_id,omitempty"`
	Name                string `json:"name,omitempty" mapstructure:"name,omitempty"`
	AccreditationNumber string `json:"accreditation_number,omitempty" mapstructure:"accreditation_number,omitempty"`
	AccreditationBody   string `json:"accreditation_body,omitempty" mapstructure:"accreditation_body,omitempty"`
	AccreditationStatus string `json:"accreditation_status,omitempty" mapstructure:"accreditation_status,omitempty"`
	AccreditationExpiry string `json:"accreditation_expiry,omitempty" mapstructure:"accreditation_expiry,omitempty"`
	Scopes              string `json:"scopes,omitempty" mapstructure:"scopes,omitempty"`
	ValidFrom           string `json:"valid_from,omitempty" mapstructure:"valid_from,omitempty"`
	ValidTo             string `json:"valid_to,omitempty" mapstructure:"valid_to,omitempty"`
	ContactEmail        string `json:"contact_email,omitempty" mapstructure:"contact_email,omitempty"`
	ContactPhone        string `json:"contact_phone,omitempty" mapstructure:"contact_phone,omitempty"`
	LeadAuditor         string `json:"lead_auditor,omitempty" mapstructure:"lead_auditor,omitempty"`
	CreatedAt           string `json:"created_at,omitempty" mapstructure:"created_at,omitempty"`
	UpdatedAt           string `json:"updated_at,omitempty" mapstructure:"updated_at,omitempty"`
}

type VerificationEngagement struct {
	nexus.Node
	EngagementID     string `json:"engagement_id,omitempty" mapstructure:"engagement_id,omitempty"`
	TenantID         string `json:"tenant_id,omitempty" mapstructure:"tenant_id,omitempty"`
	AgencyID         string `json:"agency_id,omitempty" mapstructure:"agency_id,omitempty"`
	PassportID       string `json:"passport_id,omitempty" mapstructure:"passport_id,omitempty"`
	BatchID          string `json:"batch_id,omitempty" mapstructure:"batch_id,omitempty"`
	Period           string `json:"period,omitempty" mapstructure:"period,omitempty"`
	Methodology      string `json:"methodology,omitempty" mapstructure:"methodology,omitempty"`
	SnapshotHash     string `json:"snapshot_hash,omitempty" mapstructure:"snapshot_hash,omitempty"`
	Status           string `json:"status,omitempty" mapstructure:"status,omitempty"`
	AssignedVerifier string `json:"assigned_verifier,omitempty" mapstructure:"assigned_verifier,omitempty"`
	ScopeMatch       bool   `json:"scope_match,omitempty" mapstructure:"scope_match,omitempty"`
	FindingsCount    int    `json:"findings_count,omitempty" mapstructure:"findings_count,omitempty"`
	Timeline         string `json:"timeline,omitempty" mapstructure:"timeline,omitempty"`
	CreatedAt        string `json:"created_at,omitempty" mapstructure:"created_at,omitempty"`
	UpdatedAt        string `json:"updated_at,omitempty" mapstructure:"updated_at,omitempty"`
}

type EngagementTeamMember struct {
	nexus.Node
	MemberID     string `json:"member_id,omitempty" mapstructure:"member_id,omitempty"`
	EngagementID string `json:"engagement_id,omitempty" mapstructure:"engagement_id,omitempty"`
	TenantID     string `json:"tenant_id,omitempty" mapstructure:"tenant_id,omitempty"`
	Name         string `json:"name,omitempty" mapstructure:"name,omitempty"`
	Role         string `json:"role,omitempty" mapstructure:"role,omitempty"`
	Email        string `json:"email,omitempty" mapstructure:"email,omitempty"`
	AssignedAt   string `json:"assigned_at,omitempty" mapstructure:"assigned_at,omitempty"`
}

type COIDeclaration struct {
	nexus.Node
	DeclarationID string `json:"declaration_id,omitempty" mapstructure:"declaration_id,omitempty"`
	EngagementID  string `json:"engagement_id,omitempty" mapstructure:"engagement_id,omitempty"`
	TenantID      string `json:"tenant_id,omitempty" mapstructure:"tenant_id,omitempty"`
	AuditorName   string `json:"auditor_name,omitempty" mapstructure:"auditor_name,omitempty"`
	AuditorEmail  string `json:"auditor_email,omitempty" mapstructure:"auditor_email,omitempty"`
	HasConflict   bool   `json:"has_conflict,omitempty" mapstructure:"has_conflict,omitempty"`
	Explanation   string `json:"explanation,omitempty" mapstructure:"explanation,omitempty"`
	DeclaredAt    string `json:"declared_at,omitempty" mapstructure:"declared_at,omitempty"`
}

type Finding struct {
	nexus.Node
	FindingID    string  `json:"finding_id,omitempty" mapstructure:"finding_id,omitempty"`
	EngagementID string  `json:"engagement_id,omitempty" mapstructure:"engagement_id,omitempty"`
	TenantID     string  `json:"tenant_id,omitempty" mapstructure:"tenant_id,omitempty"`
	Category     string  `json:"category,omitempty" mapstructure:"category,omitempty"`
	Severity     string  `json:"severity,omitempty" mapstructure:"severity,omitempty"`
	Status       string  `json:"status,omitempty" mapstructure:"status,omitempty"`
	Description  string  `json:"description,omitempty" mapstructure:"description,omitempty"`
	Discrepancy  float64 `json:"discrepancy_pct,omitempty" mapstructure:"discrepancy_pct,omitempty"`
	RaisedBy     string  `json:"raised_by,omitempty" mapstructure:"raised_by,omitempty"`
	ResolvedBy   string  `json:"resolved_by,omitempty" mapstructure:"resolved_by,omitempty"`
	CreatedAt    string  `json:"created_at,omitempty" mapstructure:"created_at,omitempty"`
	UpdatedAt    string  `json:"updated_at,omitempty" mapstructure:"updated_at,omitempty"`
}

type ReviewVerdict struct {
	nexus.Node
	SignoffID    string `json:"signoff_id,omitempty" mapstructure:"signoff_id,omitempty"`
	EngagementID string `json:"engagement_id,omitempty" mapstructure:"engagement_id,omitempty"`
	TenantID     string `json:"tenant_id,omitempty" mapstructure:"tenant_id,omitempty"`
	PassportID   string `json:"passport_id,omitempty" mapstructure:"passport_id,omitempty"`
	LeadAuditor  string `json:"lead_auditor,omitempty" mapstructure:"lead_auditor,omitempty"`
	PeerReviewer string `json:"peer_reviewer,omitempty" mapstructure:"peer_reviewer,omitempty"`
	Opinion      string `json:"opinion,omitempty" mapstructure:"opinion,omitempty"`
	StatementRef string `json:"statement_ref,omitempty" mapstructure:"statement_ref,omitempty"`
	Frozen       bool   `json:"frozen,omitempty" mapstructure:"frozen,omitempty"`
	SignedAt     string `json:"signed_at,omitempty" mapstructure:"signed_at,omitempty"`
}

// InputCorrection preserves correction history; its derived nodes can be rebuilt.
type InputCorrection struct {
	nexus.Node
	CorrectionID string  `json:"correction_id,omitempty"`
	TenantID     string  `json:"tenant_id,omitempty"`
	InputNodeID  string  `json:"input_node_id,omitempty"`
	NewValue     float64 `json:"new_value,omitempty"`
	Reason       string  `json:"reason,omitempty"`
	ResultRaw    string  `json:"result_raw,omitempty"`
	NodesRaw     string  `json:"nodes_raw,omitempty"`
	EdgesRaw     string  `json:"edges_raw,omitempty"`
	CreatedAt    string  `json:"created_at,omitempty"`
}
