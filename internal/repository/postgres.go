package repository

import (
	"context"
	"database/sql"
	"encoding/json"
	"fmt"
	"time"

	_ "github.com/lib/pq"
	"saurient-platform/internal/tenant"
)

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

type PostgresRepository struct {
	db *sql.DB
}

func NewPostgresRepository(db *sql.DB) *PostgresRepository {
	return &PostgresRepository{db: db}
}

// WithTenantTx wraps database operations in a transaction and enforces PostgreSQL Row-Level Security (RLS)
// by setting the local configuration variable app.current_tenant to the context's tenant_id.
func (r *PostgresRepository) WithTenantTx(ctx context.Context, fn func(tx *sql.Tx) error) error {
	tenantID, err := tenant.GetTenant(ctx)
	if err != nil {
		return fmt.Errorf("failed to retrieve tenant ID from context for RLS enforcement: %w", err)
	}

	tx, err := r.db.BeginTx(ctx, &sql.TxOptions{})
	if err != nil {
		return fmt.Errorf("failed to begin transaction: %w", err)
	}

	defer func() {
		if p := recover(); p != nil {
			_ = tx.Rollback()
			panic(p)
		}
	}()

	// Enforce Postgres RLS policy via set_config
	_, err = tx.ExecContext(ctx, "SELECT set_config('app.current_tenant', $1, true);", tenantID)
	if err != nil {
		_ = tx.Rollback()
		return fmt.Errorf("failed to set app.current_tenant for RLS: %w", err)
	}

	if err := fn(tx); err != nil {
		_ = tx.Rollback()
		return err
	}

	if err := tx.Commit(); err != nil {
		return fmt.Errorf("failed to commit transaction: %w", err)
	}

	return nil
}

// SavePassportAndAudit writes a new passport snapshot and audit record atomically within an RLS transaction.
func (r *PostgresRepository) SavePassportAndAudit(ctx context.Context, p *CarbonPassportModel, audit *PassportAuditTrailModel) error {
	return r.WithTenantTx(ctx, func(tx *sql.Tx) error {
		queryPassport := `
			INSERT INTO carbon_passports (
				tenant_id, facility_id, batch_number, commodity_type,
				verification_status, scope_1_kg_co2e, scope_2_kg_co2e, scope_3_kg_co2e,
				calculation_details, issued_at, data_hash
			) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
			RETURNING passport_id, total_footprint_kg;
		`

		calcDetailsJSON := p.CalculationDetails
		if len(calcDetailsJSON) == 0 {
			calcDetailsJSON = []byte("{}")
		}

		err := tx.QueryRowContext(
			ctx,
			queryPassport,
			p.TenantID,
			p.FacilityID,
			p.BatchNumber,
			p.CommodityType,
			p.VerificationStatus,
			p.Scope1KgCO2e,
			p.Scope2KgCO2e,
			p.Scope3KgCO2e,
			calcDetailsJSON,
			time.Now().UTC(),
			p.DataHash,
		).Scan(&p.PassportID, &p.TotalFootprintKg)

		if err != nil {
			return fmt.Errorf("failed to insert carbon passport: %w", err)
		}

		auditPayloadJSON := audit.ChangePayload
		if len(auditPayloadJSON) == 0 {
			auditPayloadJSON = []byte("{}")
		}

		queryAudit := `
			INSERT INTO passport_audit_trail (
				passport_id, previous_hash, current_hash, action_type, timestamp, change_payload
			) VALUES ($1, $2, $3, $4, $5, $6)
			RETURNING audit_id;
		`

		err = tx.QueryRowContext(
			ctx,
			queryAudit,
			p.PassportID,
			audit.PreviousHash,
			p.DataHash,
			audit.ActionType,
			time.Now().UTC(),
			auditPayloadJSON,
		).Scan(&audit.AuditID)

		if err != nil {
			return fmt.Errorf("failed to insert passport audit trail: %w", err)
		}

		return nil
	})
}

// UpdatePassportAndAudit updates an existing passport and logs an audit trail record within an RLS transaction.
func (r *PostgresRepository) UpdatePassportAndAudit(ctx context.Context, p *CarbonPassportModel, audit *PassportAuditTrailModel) error {
	return r.WithTenantTx(ctx, func(tx *sql.Tx) error {
		queryPassport := `
			UPDATE carbon_passports
			SET facility_id = $1, batch_number = $2, commodity_type = $3,
			    verification_status = $4, scope_1_kg_co2e = $5, scope_2_kg_co2e = $6, scope_3_kg_co2e = $7,
			    calculation_details = $8, data_hash = $9
			WHERE passport_id = $10 AND tenant_id = current_setting('app.current_tenant', true)::uuid
			RETURNING total_footprint_kg;
		`

		calcDetailsJSON := p.CalculationDetails
		if len(calcDetailsJSON) == 0 {
			calcDetailsJSON = []byte("{}")
		}

		err := tx.QueryRowContext(
			ctx,
			queryPassport,
			p.FacilityID,
			p.BatchNumber,
			p.CommodityType,
			p.VerificationStatus,
			p.Scope1KgCO2e,
			p.Scope2KgCO2e,
			p.Scope3KgCO2e,
			calcDetailsJSON,
			p.DataHash,
			p.PassportID,
		).Scan(&p.TotalFootprintKg)

		if err != nil {
			return fmt.Errorf("failed to update carbon passport: %w", err)
		}

		auditPayloadJSON := audit.ChangePayload
		if len(auditPayloadJSON) == 0 {
			auditPayloadJSON = []byte("{}")
		}

		queryAudit := `
			INSERT INTO passport_audit_trail (
				passport_id, previous_hash, current_hash, action_type, timestamp, change_payload
			) VALUES ($1, $2, $3, $4, $5, $6)
			RETURNING audit_id;
		`

		err = tx.QueryRowContext(
			ctx,
			queryAudit,
			p.PassportID,
			audit.PreviousHash,
			p.DataHash,
			audit.ActionType,
			time.Now().UTC(),
			auditPayloadJSON,
		).Scan(&audit.AuditID)

		if err != nil {
			return fmt.Errorf("failed to insert passport audit trail on update: %w", err)
		}

		return nil
	})
}

// GetPassportByID retrieves a passport enforcing RLS.
func (r *PostgresRepository) GetPassportByID(ctx context.Context, passportID string) (*CarbonPassportModel, error) {
	var p CarbonPassportModel
	var calcDetails []byte

	err := r.WithTenantTx(ctx, func(tx *sql.Tx) error {
		query := `
			SELECT passport_id, tenant_id, facility_id, batch_number, commodity_type,
			       verification_status, scope_1_kg_co2e, scope_2_kg_co2e, scope_3_kg_co2e,
			       total_footprint_kg, calculation_details, issued_at, data_hash
			FROM carbon_passports
			WHERE passport_id = $1 AND tenant_id = current_setting('app.current_tenant', true)::uuid;
		`
		return tx.QueryRowContext(ctx, query, passportID).Scan(
			&p.PassportID,
			&p.TenantID,
			&p.FacilityID,
			&p.BatchNumber,
			&p.CommodityType,
			&p.VerificationStatus,
			&p.Scope1KgCO2e,
			&p.Scope2KgCO2e,
			&p.Scope3KgCO2e,
			&p.TotalFootprintKg,
			&calcDetails,
			&p.IssuedAt,
			&p.DataHash,
		)
	})

	if err != nil {
		return nil, err
	}

	p.CalculationDetails = calcDetails
	return &p, nil
}
