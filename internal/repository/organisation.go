package repository

import (
	"context"
	"database/sql"
	"encoding/json"
	"time"

	_ "github.com/lib/pq"
)

// --- Struct Models for Organisation Sub-Tabs ---

// 1. Profile
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

// 2. Facility
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

// 3. Process
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

// 4. User Member & Auth
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

// 5. Reporting Period
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

// 6. Localisation Config
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

// 7. Approval Request (SoD)
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

// --- Repository Methods for Organisation ---

// Profile: Get Profile
func (r *PostgresRepository) GetTenantProfile(ctx context.Context) (*TenantProfileModel, error) {
	var p TenantProfileModel
	var primaryContact, sustainabilityContact, boundary, verification []byte

	err := r.WithTenantTx(ctx, func(tx *sql.Tx) error {
		query := `
			SELECT tenant_id, legal_name, trading_name, organisation_id, registration_number,
			       country_of_incorporation, registered_address, headquarters, industry, nace_code,
			       primary_products, website, tax_id, lei, primary_contact, sustainability_contact,
			       boundary, status, verification, created_at, updated_at
			FROM tenants_profile
			WHERE tenant_id = current_setting('app.current_tenant', true);
		`
		return tx.QueryRowContext(ctx, query).Scan(
			&p.TenantID, &p.LegalName, &p.TradingName, &p.OrganisationID, &p.RegistrationNumber,
			&p.CountryOfIncorporation, &p.RegisteredAddress, &p.Headquarters, &p.Industry, &p.NaceCode,
			&p.PrimaryProducts, &p.Website, &p.TaxID, &p.LEI, &primaryContact, &sustainabilityContact,
			&boundary, &p.Status, &verification, &p.CreatedAt, &p.UpdatedAt,
		)
	})

	if err != nil {
		return nil, err
	}

	p.PrimaryContact = primaryContact
	p.SustainabilityContact = sustainabilityContact
	p.Boundary = boundary
	p.Verification = verification
	return &p, nil
}

// Profile: Save Profile
func (r *PostgresRepository) SaveTenantProfile(ctx context.Context, p *TenantProfileModel) error {
	return r.WithTenantTx(ctx, func(tx *sql.Tx) error {
		if len(p.PrimaryContact) == 0 {
			p.PrimaryContact = json.RawMessage("{}")
		}
		if len(p.SustainabilityContact) == 0 {
			p.SustainabilityContact = json.RawMessage("{}")
		}
		if len(p.Boundary) == 0 {
			p.Boundary = json.RawMessage("{}")
		}
		if len(p.Verification) == 0 {
			p.Verification = json.RawMessage("{}")
		}
		if p.OrganisationID == "" {
			p.OrganisationID = "ORG-" + p.TenantID
		}
		if p.Status == "" {
			p.Status = "Active"
		}

		query := `
			INSERT INTO tenants_profile (
				tenant_id, legal_name, trading_name, organisation_id, registration_number,
				country_of_incorporation, registered_address, headquarters, industry, nace_code,
				primary_products, website, tax_id, lei, primary_contact, sustainability_contact,
				boundary, status, verification, updated_at
			) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20)
			ON CONFLICT (tenant_id) DO UPDATE SET
				legal_name = EXCLUDED.legal_name,
				trading_name = EXCLUDED.trading_name,
				registration_number = EXCLUDED.registration_number,
				registered_address = EXCLUDED.registered_address,
				headquarters = EXCLUDED.headquarters,
				industry = EXCLUDED.industry,
				nace_code = EXCLUDED.nace_code,
				tax_id = EXCLUDED.tax_id,
				lei = EXCLUDED.lei,
				primary_contact = EXCLUDED.primary_contact,
				sustainability_contact = EXCLUDED.sustainability_contact,
				boundary = EXCLUDED.boundary,
				status = EXCLUDED.status,
				verification = EXCLUDED.verification,
				updated_at = EXCLUDED.updated_at;
		`
		now := time.Now().UTC()
		_, err := tx.ExecContext(ctx, query,
			p.TenantID, p.LegalName, p.TradingName, p.OrganisationID, p.RegistrationNumber,
			p.CountryOfIncorporation, p.RegisteredAddress, p.Headquarters, p.Industry, p.NaceCode,
			p.PrimaryProducts, p.Website, p.TaxID, p.LEI, p.PrimaryContact, p.SustainabilityContact,
			p.Boundary, p.Status, p.Verification, now,
		)
		return err
	})
}

// Facilities: List
func (r *PostgresRepository) ListFacilities(ctx context.Context) ([]*FacilityModel, error) {
	var list []*FacilityModel
	err := r.WithTenantTx(ctx, func(tx *sql.Tx) error {
		query := `
			SELECT facility_id, tenant_id, name, type, country, country_code, address, status,
			       processes_count, devices_count, data_completeness, emissions, readiness,
			       geo, production_capacity, operating_hours, manager, energy_sources, utilities,
			       products, emission_sources, process_tree, created_at, updated_at
			FROM facilities
			WHERE tenant_id = current_setting('app.current_tenant', true)
			ORDER BY created_at ASC;
		`
		rows, err := tx.QueryContext(ctx, query)
		if err != nil {
			return err
		}
		defer rows.Close()

		for rows.Next() {
			var f FacilityModel
			var geo, manager, energySources, utilities, products, emissionSources, processTree []byte
			if err := rows.Scan(
				&f.ID, &f.TenantID, &f.Name, &f.Type, &f.Country, &f.CountryCode, &f.Address, &f.Status,
				&f.ProcessesCount, &f.DevicesCount, &f.DataCompleteness, &f.Emissions, &f.Readiness,
				&geo, &f.ProductionCapacity, &f.OperatingHours, &manager, &energySources, &utilities,
				&products, &emissionSources, &processTree, &f.CreatedAt, &f.UpdatedAt,
			); err != nil {
				return err
			}
			f.Geo = geo
			f.Manager = manager
			f.EnergySources = energySources
			f.Utilities = utilities
			f.Products = products
			f.EmissionSources = emissionSources
			f.ProcessTree = processTree
			list = append(list, &f)
		}
		return rows.Err()
	})
	if err != nil {
		return nil, err
	}
	return list, nil
}

// Facilities: Save / Upsert
func (r *PostgresRepository) SaveFacility(ctx context.Context, f *FacilityModel) error {
	return r.WithTenantTx(ctx, func(tx *sql.Tx) error {
		if len(f.Geo) == 0 {
			f.Geo = json.RawMessage("{}")
		}
		if len(f.Manager) == 0 {
			f.Manager = json.RawMessage("{}")
		}
		if len(f.EnergySources) == 0 {
			f.EnergySources = json.RawMessage("[]")
		}
		if len(f.Utilities) == 0 {
			f.Utilities = json.RawMessage("[]")
		}
		if len(f.Products) == 0 {
			f.Products = json.RawMessage("[]")
		}
		if len(f.EmissionSources) == 0 {
			f.EmissionSources = json.RawMessage("[]")
		}
		if len(f.ProcessTree) == 0 {
			f.ProcessTree = json.RawMessage("[]")
		}

		query := `
			INSERT INTO facilities (
				facility_id, tenant_id, name, type, country, country_code, address, status,
				processes_count, devices_count, data_completeness, emissions, readiness,
				geo, production_capacity, operating_hours, manager, energy_sources, utilities,
				products, emission_sources, process_tree, updated_at
			) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23)
			ON CONFLICT (facility_id) DO UPDATE SET
				name = EXCLUDED.name,
				type = EXCLUDED.type,
				country = EXCLUDED.country,
				address = EXCLUDED.address,
				status = EXCLUDED.status,
				data_completeness = EXCLUDED.data_completeness,
				emissions = EXCLUDED.emissions,
				readiness = EXCLUDED.readiness,
				production_capacity = EXCLUDED.production_capacity,
				manager = EXCLUDED.manager,
				updated_at = EXCLUDED.updated_at;
		`
		now := time.Now().UTC()
		_, err := tx.ExecContext(ctx, query,
			f.ID, f.TenantID, f.Name, f.Type, f.Country, f.CountryCode, f.Address, f.Status,
			f.ProcessesCount, f.DevicesCount, f.DataCompleteness, f.Emissions, f.Readiness,
			f.Geo, f.ProductionCapacity, f.OperatingHours, f.Manager, f.EnergySources, f.Utilities,
			f.Products, f.EmissionSources, f.ProcessTree, now,
		)
		return err
	})
}

// Facilities: Delete
func (r *PostgresRepository) DeleteFacility(ctx context.Context, facilityID string) error {
	return r.WithTenantTx(ctx, func(tx *sql.Tx) error {
		_, err := tx.ExecContext(ctx, `
			DELETE FROM facilities
			WHERE facility_id = $1 AND tenant_id = current_setting('app.current_tenant', true);
		`, facilityID)
		return err
	})
}

// Processes: List
func (r *PostgresRepository) ListProcesses(ctx context.Context) ([]*ProcessModel, error) {
	var list []*ProcessModel
	err := r.WithTenantTx(ctx, func(tx *sql.Tx) error {
		query := `
			SELECT process_id, tenant_id, facility_id, facility_name, name, production_line, energy_source,
			       inputs, outputs, meters, scopes, status, description, pcf_trace, created_at, updated_at
			FROM organisation_processes
			WHERE tenant_id = current_setting('app.current_tenant', true)
			ORDER BY created_at ASC;
		`
		rows, err := tx.QueryContext(ctx, query)
		if err != nil {
			return err
		}
		defer rows.Close()

		for rows.Next() {
			var p ProcessModel
			var inputs, outputs, meters, scopes, pcfTrace []byte
			if err := rows.Scan(
				&p.ID, &p.TenantID, &p.FacilityID, &p.FacilityName, &p.Name, &p.ProductionLine, &p.EnergySource,
				&inputs, &outputs, &meters, &scopes, &p.Status, &p.Description, &pcfTrace, &p.CreatedAt, &p.UpdatedAt,
			); err != nil {
				return err
			}
			p.Inputs = inputs
			p.Outputs = outputs
			p.Meters = meters
			p.Scopes = scopes
			p.PCFTrace = pcfTrace
			list = append(list, &p)
		}
		return rows.Err()
	})
	if err != nil {
		return nil, err
	}
	return list, nil
}

// Processes: Save / Upsert
func (r *PostgresRepository) SaveProcess(ctx context.Context, p *ProcessModel) error {
	return r.WithTenantTx(ctx, func(tx *sql.Tx) error {
		query := `
			INSERT INTO organisation_processes (
				process_id, tenant_id, facility_id, facility_name, name, production_line, energy_source,
				inputs, outputs, meters, scopes, status, description, pcf_trace, updated_at
			) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
			ON CONFLICT (process_id) DO UPDATE SET
				name = EXCLUDED.name,
				facility_name = EXCLUDED.facility_name,
				production_line = EXCLUDED.production_line,
				energy_source = EXCLUDED.energy_source,
				description = EXCLUDED.description,
				updated_at = EXCLUDED.updated_at;
		`
		now := time.Now().UTC()
		_, err := tx.ExecContext(ctx, query,
			p.ID, p.TenantID, p.FacilityID, p.FacilityName, p.Name, p.ProductionLine, p.EnergySource,
			p.Inputs, p.Outputs, p.Meters, p.Scopes, p.Status, p.Description, p.PCFTrace, now,
		)
		return err
	})
}

// Processes: Delete
func (r *PostgresRepository) DeleteProcess(ctx context.Context, processID string) error {
	return r.WithTenantTx(ctx, func(tx *sql.Tx) error {
		_, err := tx.ExecContext(ctx, `
			DELETE FROM organisation_processes
			WHERE process_id = $1 AND tenant_id = current_setting('app.current_tenant', true);
		`, processID)
		return err
	})
}

// Users: List
func (r *PostgresRepository) ListOrganisationUsers(ctx context.Context) ([]*OrganisationUserModel, error) {
	var list []*OrganisationUserModel
	err := r.WithTenantTx(ctx, func(tx *sql.Tx) error {
		query := `
			SELECT user_id, tenant_id, name, email, role, facility_scope, last_login, status, created_at
			FROM organisation_users
			WHERE tenant_id = current_setting('app.current_tenant', true)
			ORDER BY created_at ASC;
		`
		rows, err := tx.QueryContext(ctx, query)
		if err != nil {
			return err
		}
		defer rows.Close()

		for rows.Next() {
			var u OrganisationUserModel
			if err := rows.Scan(
				&u.ID, &u.TenantID, &u.Name, &u.Email, &u.Role, &u.FacilityScope, &u.LastLogin, &u.Status, &u.CreatedAt,
			); err != nil {
				return err
			}
			list = append(list, &u)
		}
		return rows.Err()
	})
	if err != nil {
		return nil, err
	}
	return list, nil
}

// Users: Save / Invite
func (r *PostgresRepository) SaveOrganisationUser(ctx context.Context, u *OrganisationUserModel) error {
	return r.WithTenantTx(ctx, func(tx *sql.Tx) error {
		query := `
			INSERT INTO organisation_users (
				user_id, tenant_id, name, email, password_hash, role, facility_scope, last_login, status
			) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
			ON CONFLICT (email) DO UPDATE SET
				name = EXCLUDED.name,
				role = EXCLUDED.role,
				facility_scope = EXCLUDED.facility_scope,
				status = EXCLUDED.status;
		`
		pwHash := u.PasswordHash
		if pwHash == "" {
			pwHash = "$2a$10$defaultDemoHashForTestingPurpose123"
		}
		_, err := tx.ExecContext(ctx, query,
			u.ID, u.TenantID, u.Name, u.Email, pwHash, u.Role, u.FacilityScope, u.LastLogin, u.Status,
		)
		return err
	})
}

// Users: Update Role
func (r *PostgresRepository) UpdateUserRole(ctx context.Context, userID, newRole string) error {
	return r.WithTenantTx(ctx, func(tx *sql.Tx) error {
		_, err := tx.ExecContext(ctx, `
			UPDATE organisation_users
			SET role = $1
			WHERE user_id = $2 AND tenant_id = current_setting('app.current_tenant', true);
		`, newRole, userID)
		return err
	})
}

// Reporting Periods: List
func (r *PostgresRepository) ListReportingPeriods(ctx context.Context) ([]*ReportingPeriodModel, error) {
	var list []*ReportingPeriodModel
	err := r.WithTenantTx(ctx, func(tx *sql.Tx) error {
		query := `
			SELECT period_id, tenant_id, name, start_date, end_date, facilities_scope, ccf_status,
			       data_completeness, verification_status, current_step_index, versions, created_at, updated_at
			FROM reporting_periods
			WHERE tenant_id = current_setting('app.current_tenant', true)
			ORDER BY start_date DESC;
		`
		rows, err := tx.QueryContext(ctx, query)
		if err != nil {
			return err
		}
		defer rows.Close()

		for rows.Next() {
			var p ReportingPeriodModel
			var versions []byte
			var startDate, endDate time.Time
			if err := rows.Scan(
				&p.ID, &p.TenantID, &p.Name, &startDate, &endDate, &p.FacilitiesScope, &p.CCFStatus,
				&p.DataCompleteness, &p.VerificationStatus, &p.CurrentStepIndex, &versions, &p.CreatedAt, &p.UpdatedAt,
			); err != nil {
				return err
			}
			p.StartDate = startDate.Format("2006-01-02")
			p.EndDate = endDate.Format("2006-01-02")
			p.Versions = versions
			list = append(list, &p)
		}
		return rows.Err()
	})
	if err != nil {
		return nil, err
	}
	return list, nil
}

// Reporting Periods: Save
func (r *PostgresRepository) SaveReportingPeriod(ctx context.Context, p *ReportingPeriodModel) error {
	return r.WithTenantTx(ctx, func(tx *sql.Tx) error {
		if p.StartDate == "" {
			p.StartDate = time.Now().Format("2006") + "-01-01"
		}
		if p.EndDate == "" {
			p.EndDate = time.Now().Format("2006") + "-12-31"
		}
		if len(p.Versions) == 0 {
			p.Versions = json.RawMessage("[]")
		}

		query := `
			INSERT INTO reporting_periods (
				period_id, tenant_id, name, start_date, end_date, facilities_scope, ccf_status,
				data_completeness, verification_status, current_step_index, versions, updated_at
			) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
			ON CONFLICT (period_id) DO UPDATE SET
				name = EXCLUDED.name,
				facilities_scope = EXCLUDED.facilities_scope,
				ccf_status = EXCLUDED.ccf_status,
				data_completeness = EXCLUDED.data_completeness,
				verification_status = EXCLUDED.verification_status,
				current_step_index = EXCLUDED.current_step_index,
				versions = EXCLUDED.versions,
				updated_at = EXCLUDED.updated_at;
		`
		now := time.Now().UTC()
		_, err := tx.ExecContext(ctx, query,
			p.ID, p.TenantID, p.Name, p.StartDate, p.EndDate, p.FacilitiesScope, p.CCFStatus,
			p.DataCompleteness, p.VerificationStatus, p.CurrentStepIndex, p.Versions, now,
		)
		return err
	})
}

// Localisation: Get
func (r *PostgresRepository) GetLocalisation(ctx context.Context) (*LocalisationModel, error) {
	var loc LocalisationModel
	var units, regulatory []byte

	err := r.WithTenantTx(ctx, func(tx *sql.Tx) error {
		query := `
			SELECT tenant_id, country, currency, timezone, language, units, regulatory, updated_at
			FROM organisation_localisation
			WHERE tenant_id = current_setting('app.current_tenant', true);
		`
		return tx.QueryRowContext(ctx, query).Scan(
			&loc.TenantID, &loc.Country, &loc.Currency, &loc.Timezone, &loc.Language,
			&units, &regulatory, &loc.UpdatedAt,
		)
	})

	if err != nil {
		return nil, err
	}
	loc.Units = units
	loc.Regulatory = regulatory
	return &loc, nil
}

// Localisation: Save
func (r *PostgresRepository) SaveLocalisation(ctx context.Context, loc *LocalisationModel) error {
	return r.WithTenantTx(ctx, func(tx *sql.Tx) error {
		query := `
			INSERT INTO organisation_localisation (
				tenant_id, country, currency, timezone, language, units, regulatory, updated_at
			) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
			ON CONFLICT (tenant_id) DO UPDATE SET
				country = EXCLUDED.country,
				currency = EXCLUDED.currency,
				timezone = EXCLUDED.timezone,
				language = EXCLUDED.language,
				units = EXCLUDED.units,
				regulatory = EXCLUDED.regulatory,
				updated_at = EXCLUDED.updated_at;
		`
		now := time.Now().UTC()
		_, err := tx.ExecContext(ctx, query,
			loc.TenantID, loc.Country, loc.Currency, loc.Timezone, loc.Language,
			loc.Units, loc.Regulatory, now,
		)
		return err
	})
}

// Approvals: List
func (r *PostgresRepository) ListApprovals(ctx context.Context) ([]*ApprovalModel, error) {
	var list []*ApprovalModel
	err := r.WithTenantTx(ctx, func(tx *sql.Tx) error {
		query := `
			SELECT approval_id, tenant_id, title, type, facility, submitted_by, submitted_date,
			       risk_level, status, what_changed, evidence, history, created_at, updated_at
			FROM organisation_approvals
			WHERE tenant_id = current_setting('app.current_tenant', true)
			ORDER BY created_at DESC;
		`
		rows, err := tx.QueryContext(ctx, query)
		if err != nil {
			return err
		}
		defer rows.Close()

		for rows.Next() {
			var a ApprovalModel
			var submittedBy, whatChanged, history []byte
			if err := rows.Scan(
				&a.ID, &a.TenantID, &a.Title, &a.Type, &a.Facility, &submittedBy, &a.SubmittedDate,
				&a.RiskLevel, &a.Status, &whatChanged, &a.Evidence, &history, &a.CreatedAt, &a.UpdatedAt,
			); err != nil {
				return err
			}
			a.SubmittedBy = submittedBy
			a.WhatChanged = whatChanged
			a.History = history
			list = append(list, &a)
		}
		return rows.Err()
	})
	if err != nil {
		return nil, err
	}
	return list, nil
}

// Approvals: Save / Update Decision
func (r *PostgresRepository) SaveApproval(ctx context.Context, a *ApprovalModel) error {
	return r.WithTenantTx(ctx, func(tx *sql.Tx) error {
		if len(a.SubmittedBy) == 0 {
			a.SubmittedBy = json.RawMessage(`{"name":"Admin User","role":"Sustainability Lead"}`)
		}
		if a.SubmittedDate == "" {
			a.SubmittedDate = time.Now().Format("2006-01-02")
		}
		if len(a.WhatChanged) == 0 {
			a.WhatChanged = json.RawMessage("[]")
		}
		if len(a.History) == 0 {
			a.History = json.RawMessage("[]")
		}

		query := `
			INSERT INTO organisation_approvals (
				approval_id, tenant_id, title, type, facility, submitted_by, submitted_date,
				risk_level, status, what_changed, evidence, history, updated_at
			) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
			ON CONFLICT (approval_id) DO UPDATE SET
				status = EXCLUDED.status,
				history = EXCLUDED.history,
				updated_at = EXCLUDED.updated_at;
		`
		now := time.Now().UTC()
		_, err := tx.ExecContext(ctx, query,
			a.ID, a.TenantID, a.Title, a.Type, a.Facility, a.SubmittedBy, a.SubmittedDate,
			a.RiskLevel, a.Status, a.WhatChanged, a.Evidence, a.History, now,
		)
		return err
	})
}
