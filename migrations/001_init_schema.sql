-- Enable pgcrypto extension for UUID generation
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create carbon_passports table
CREATE TABLE IF NOT EXISTS carbon_passports (
    passport_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id VARCHAR(255) NOT NULL,
    facility_id VARCHAR(255) NOT NULL,
    batch_number VARCHAR(255) NOT NULL,
    commodity_type VARCHAR(255) NOT NULL,
    verification_status VARCHAR(50) NOT NULL DEFAULT 'Draft',
    scope_1_kg_co2e NUMERIC(18, 4) NOT NULL DEFAULT 0.0000,
    scope_2_kg_co2e NUMERIC(18, 4) NOT NULL DEFAULT 0.0000,
    scope_3_kg_co2e NUMERIC(18, 4) NOT NULL DEFAULT 0.0000,
    total_footprint_kg NUMERIC(18, 4) GENERATED ALWAYS AS (scope_1_kg_co2e + scope_2_kg_co2e + scope_3_kg_co2e) STORED,
    calculation_details JSONB NOT NULL DEFAULT '{}'::jsonb,
    issued_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    data_hash CHAR(64) NOT NULL
);

-- Create append-only passport_audit_trail table
CREATE TABLE IF NOT EXISTS passport_audit_trail (
    audit_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    passport_id UUID NOT NULL REFERENCES carbon_passports(passport_id) ON DELETE CASCADE,
    previous_hash CHAR(64),
    current_hash CHAR(64) NOT NULL,
    action_type VARCHAR(50) NOT NULL,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    change_payload JSONB NOT NULL DEFAULT '{}'::jsonb
);

-- Rules blocking UPDATE and DELETE on passport_audit_trail (Append-Only)
CREATE OR REPLACE RULE prevent_audit_update AS
    ON UPDATE TO passport_audit_trail DO INSTEAD NOTHING;

CREATE OR REPLACE RULE prevent_audit_delete AS
    ON DELETE TO passport_audit_trail DO INSTEAD NOTHING;

-- Enable Row-Level Security (RLS) on carbon_passports and passport_audit_trail
ALTER TABLE carbon_passports ENABLE ROW LEVEL SECURITY;
ALTER TABLE carbon_passports FORCE ROW LEVEL SECURITY;
ALTER TABLE passport_audit_trail ENABLE ROW LEVEL SECURITY;
ALTER TABLE passport_audit_trail FORCE ROW LEVEL SECURITY;

-- Tenant isolation RLS policies
DROP POLICY IF EXISTS tenant_isolation_policy ON carbon_passports;
CREATE POLICY tenant_isolation_policy ON carbon_passports
    USING (tenant_id = NULLIF(current_setting('app.current_tenant', true), ''));

DROP POLICY IF EXISTS tenant_isolation_audit_policy ON passport_audit_trail;
CREATE POLICY tenant_isolation_audit_policy ON passport_audit_trail
    USING (passport_id IN (
        SELECT passport_id FROM carbon_passports
        WHERE tenant_id = NULLIF(current_setting('app.current_tenant', true), '')
    ));

-- Indexes for query performance
CREATE INDEX IF NOT EXISTS idx_carbon_passports_tenant_passport ON carbon_passports (tenant_id, passport_id);
CREATE INDEX IF NOT EXISTS idx_carbon_passports_calculation_details ON carbon_passports USING gin (calculation_details);
CREATE INDEX IF NOT EXISTS idx_passport_audit_trail_passport_id ON passport_audit_trail (passport_id);
