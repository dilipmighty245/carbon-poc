-- Enable pgcrypto extension for UUID generation if not present
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. Organisation Profile & Boundary
CREATE TABLE IF NOT EXISTS tenants_profile (
    tenant_id VARCHAR(64) PRIMARY KEY,
    legal_name VARCHAR(255) NOT NULL,
    trading_name VARCHAR(255),
    organisation_id VARCHAR(64) UNIQUE NOT NULL,
    registration_number VARCHAR(64) NOT NULL,
    country_of_incorporation VARCHAR(128) NOT NULL,
    registered_address TEXT NOT NULL,
    headquarters VARCHAR(255),
    industry VARCHAR(128),
    nace_code VARCHAR(64),
    primary_products TEXT,
    website VARCHAR(255),
    tax_id VARCHAR(64),
    lei VARCHAR(64),
    primary_contact JSONB NOT NULL DEFAULT '{}'::jsonb,
    sustainability_contact JSONB NOT NULL DEFAULT '{}'::jsonb,
    boundary JSONB NOT NULL DEFAULT '{}'::jsonb,
    status VARCHAR(32) DEFAULT 'Verified',
    verification JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 2. Operating Facilities
CREATE TABLE IF NOT EXISTS facilities (
    facility_id VARCHAR(64) PRIMARY KEY,
    tenant_id VARCHAR(64) NOT NULL,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(64) NOT NULL,
    country VARCHAR(64) NOT NULL,
    country_code VARCHAR(8) DEFAULT 'GH',
    address TEXT NOT NULL,
    status VARCHAR(32) DEFAULT 'Active',
    processes_count INT DEFAULT 0,
    devices_count INT DEFAULT 0,
    data_completeness NUMERIC(5,2) DEFAULT 100.0,
    emissions VARCHAR(64) DEFAULT '0 tCO2e',
    readiness VARCHAR(64) DEFAULT 'Audit-Ready',
    geo JSONB DEFAULT '{}'::jsonb,
    production_capacity VARCHAR(128),
    operating_hours VARCHAR(128),
    manager JSONB DEFAULT '{}'::jsonb,
    energy_sources JSONB DEFAULT '[]'::jsonb,
    utilities JSONB DEFAULT '[]'::jsonb,
    products JSONB DEFAULT '[]'::jsonb,
    emission_sources JSONB DEFAULT '[]'::jsonb,
    process_tree JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 3. Industrial Processes
CREATE TABLE IF NOT EXISTS organisation_processes (
    process_id VARCHAR(64) PRIMARY KEY,
    tenant_id VARCHAR(64) NOT NULL,
    facility_id VARCHAR(64) REFERENCES facilities(facility_id) ON DELETE CASCADE,
    facility_name VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    production_line VARCHAR(128),
    energy_source VARCHAR(255),
    inputs JSONB DEFAULT '[]'::jsonb,
    outputs JSONB DEFAULT '[]'::jsonb,
    meters JSONB DEFAULT '[]'::jsonb,
    scopes JSONB DEFAULT '[]'::jsonb,
    status VARCHAR(32) DEFAULT 'Active',
    description TEXT,
    pcf_trace JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 4. Organisation Users & Access Control (Authenticated Users)
CREATE TABLE IF NOT EXISTS organisation_users (
    user_id VARCHAR(64) PRIMARY KEY,
    tenant_id VARCHAR(64) NOT NULL,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL DEFAULT '$2a$10$7EqJtq98hPqEX7fNZaFWoO...demo',
    role VARCHAR(64) NOT NULL,
    facility_scope VARCHAR(255) DEFAULT 'All Facilities',
    last_login VARCHAR(64) DEFAULT 'Never',
    status VARCHAR(32) DEFAULT 'Active',
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 5. Reporting Periods
CREATE TABLE IF NOT EXISTS reporting_periods (
    period_id VARCHAR(64) PRIMARY KEY,
    tenant_id VARCHAR(64) NOT NULL,
    name VARCHAR(255) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    facilities_scope VARCHAR(255) DEFAULT 'All Facilities',
    ccf_status VARCHAR(128) DEFAULT 'Active Telemetry Ingestion',
    data_completeness NUMERIC(5,2) DEFAULT 100.0,
    verification_status VARCHAR(32) DEFAULT 'OPEN',
    current_step_index INT DEFAULT 0,
    versions JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 6. Localisation & Regulatory Configs
CREATE TABLE IF NOT EXISTS organisation_localisation (
    tenant_id VARCHAR(64) PRIMARY KEY,
    country VARCHAR(128) DEFAULT 'Ghana (GH)',
    currency VARCHAR(64) DEFAULT 'GHS (₵) / EUR (€)',
    timezone VARCHAR(64) DEFAULT 'GMT (UTC+0)',
    language VARCHAR(64) DEFAULT 'English (UK)',
    units JSONB DEFAULT '{}'::jsonb,
    regulatory JSONB DEFAULT '{}'::jsonb,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 7. Approval Requests (Segregation of Duties - SoD)
CREATE TABLE IF NOT EXISTS organisation_approvals (
    approval_id VARCHAR(64) PRIMARY KEY,
    tenant_id VARCHAR(64) NOT NULL,
    title VARCHAR(255) NOT NULL,
    type VARCHAR(128) NOT NULL,
    facility VARCHAR(255) NOT NULL,
    submitted_by JSONB NOT NULL DEFAULT '{}'::jsonb,
    submitted_date VARCHAR(64) NOT NULL,
    risk_level VARCHAR(32) DEFAULT 'Medium',
    status VARCHAR(32) DEFAULT 'Pending',
    what_changed JSONB DEFAULT '[]'::jsonb,
    evidence VARCHAR(512),
    history JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Row-Level Security (RLS) Policies
ALTER TABLE tenants_profile ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenants_profile FORCE ROW LEVEL SECURITY;

ALTER TABLE facilities ENABLE ROW LEVEL SECURITY;
ALTER TABLE facilities FORCE ROW LEVEL SECURITY;

ALTER TABLE organisation_processes ENABLE ROW LEVEL SECURITY;
ALTER TABLE organisation_processes FORCE ROW LEVEL SECURITY;

ALTER TABLE organisation_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE organisation_users FORCE ROW LEVEL SECURITY;

ALTER TABLE reporting_periods ENABLE ROW LEVEL SECURITY;
ALTER TABLE reporting_periods FORCE ROW LEVEL SECURITY;

ALTER TABLE organisation_localisation ENABLE ROW LEVEL SECURITY;
ALTER TABLE organisation_localisation FORCE ROW LEVEL SECURITY;

ALTER TABLE organisation_approvals ENABLE ROW LEVEL SECURITY;
ALTER TABLE organisation_approvals FORCE ROW LEVEL SECURITY;

-- Tenant Isolation RLS Policies
DROP POLICY IF EXISTS profile_tenant_policy ON tenants_profile;
CREATE POLICY profile_tenant_policy ON tenants_profile
    USING (tenant_id = NULLIF(current_setting('app.current_tenant', true), ''));

DROP POLICY IF EXISTS facilities_tenant_policy ON facilities;
CREATE POLICY facilities_tenant_policy ON facilities
    USING (tenant_id = NULLIF(current_setting('app.current_tenant', true), ''));

DROP POLICY IF EXISTS processes_tenant_policy ON organisation_processes;
CREATE POLICY processes_tenant_policy ON organisation_processes
    USING (tenant_id = NULLIF(current_setting('app.current_tenant', true), ''));

DROP POLICY IF EXISTS users_tenant_policy ON organisation_users;
CREATE POLICY users_tenant_policy ON organisation_users
    USING (tenant_id = NULLIF(current_setting('app.current_tenant', true), ''));

DROP POLICY IF EXISTS periods_tenant_policy ON reporting_periods;
CREATE POLICY periods_tenant_policy ON reporting_periods
    USING (tenant_id = NULLIF(current_setting('app.current_tenant', true), ''));

DROP POLICY IF EXISTS localisation_tenant_policy ON organisation_localisation;
CREATE POLICY localisation_tenant_policy ON organisation_localisation
    USING (tenant_id = NULLIF(current_setting('app.current_tenant', true), ''));

DROP POLICY IF EXISTS approvals_tenant_policy ON organisation_approvals;
CREATE POLICY approvals_tenant_policy ON organisation_approvals
    USING (tenant_id = NULLIF(current_setting('app.current_tenant', true), ''));

-- Performance Indexes
CREATE INDEX IF NOT EXISTS idx_facilities_tenant ON facilities (tenant_id, facility_id);
CREATE INDEX IF NOT EXISTS idx_processes_tenant ON organisation_processes (tenant_id, facility_id);
CREATE INDEX IF NOT EXISTS idx_users_tenant ON organisation_users (tenant_id, email);
CREATE INDEX IF NOT EXISTS idx_periods_tenant ON reporting_periods (tenant_id, period_id);
CREATE INDEX IF NOT EXISTS idx_approvals_tenant ON organisation_approvals (tenant_id, status);
