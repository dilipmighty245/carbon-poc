# Saurient Carbon Passport Platform - Complete API Architecture & Catalog

This document defines the comprehensive API specification, database schemas, and screen-by-screen endpoint requirements for the **Saurient Carbon Passport Platform**.

---

## 1. Overview & Architectural Principles

The platform follows a **3-CRD Kubernetes & Microservice Architecture** (`CalculationRulebook` $\rightarrow$ `Product` $\rightarrow$ `CarbonPassport`). It provides both REST API endpoints (`/api/v1/*`) and a Nexus GraphQL Reflection Engine (`/graphql`).

### Key Principles
* **Multi-Tenant Isolation:** Enforced via PostgreSQL Row-Level Security (RLS) and mandatory `X-Tenant-ID` HTTP headers.
* **Deterministic Cryptography:** Product payloads are hashed using SHA-256 for immutable provenance and QR verification.
* **High-Performance Edge Caching:** Verified Carbon Passports are cached in Redis edge instances (`{tenant_id}:{passport_id}`).

---

## 2. Register Organisation API Specification

The **Register Organisation API** ingests the 10-step company onboarding flow from `RegistrationView.tsx` and persists corporate identities, account owner credentials, fiscal profile, facilities, trade identifiers, departmental leads, and verification documents.

### 2.1 Database Schema (PostgreSQL)

```sql
-- 1. Tenants / Organisations Table
CREATE TABLE IF NOT EXISTS tenants (
    tenant_id VARCHAR(64) PRIMARY KEY,
    legal_name VARCHAR(255) NOT NULL,
    trade_name VARCHAR(255),
    company_reg_no VARCHAR(64) UNIQUE NOT NULL,
    incorporation_date DATE,
    legal_form VARCHAR(64),
    country_of_registration VARCHAR(64) NOT NULL,
    fiscal_year_start VARCHAR(32) DEFAULT '01 January',
    reporting_currency VARCHAR(8) DEFAULT 'GHS',
    tax_id_number VARCHAR(64),
    vat_gst_number VARCHAR(64),
    eori_number VARCHAR(64),
    primary_hs_code VARCHAR(64),
    primary_sector VARCHAR(128),
    annual_production_volume VARCHAR(128),
    primary_erp_system VARCHAR(128),
    registration_status VARCHAR(32) DEFAULT 'PENDING_VERIFICATION',
    readiness_score INT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Organisation Users Table (Account Owner & Staff)
CREATE TABLE IF NOT EXISTS tenant_users (
    user_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id VARCHAR(64) REFERENCES tenants(tenant_id) ON DELETE CASCADE,
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone_number VARCHAR(64),
    role VARCHAR(64) NOT NULL, -- 'ACCOUNT_OWNER', 'SUSTAINABILITY_LEAD', 'COMPLIANCE_OFFICER'
    password_hash VARCHAR(255) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    mfa_enabled BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Organisation Addresses Table
CREATE TABLE IF NOT EXISTS tenant_addresses (
    address_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id VARCHAR(64) REFERENCES tenants(tenant_id) ON DELETE CASCADE,
    address_type VARCHAR(32) NOT NULL, -- 'REGISTERED', 'OPERATING', 'BILLING'
    address_line_1 VARCHAR(255) NOT NULL,
    address_line_2 VARCHAR(255),
    city VARCHAR(128) NOT NULL,
    region VARCHAR(128) NOT NULL,
    postal_code VARCHAR(32),
    country VARCHAR(64) NOT NULL,
    is_primary BOOLEAN DEFAULT FALSE
);

-- 4. Facilities Table
CREATE TABLE IF NOT EXISTS facilities (
    facility_id VARCHAR(64) PRIMARY KEY,
    tenant_id VARCHAR(64) REFERENCES tenants(tenant_id) ON DELETE CASCADE,
    facility_name VARCHAR(255) NOT NULL,
    facility_type VARCHAR(64) NOT NULL, -- 'PROCESSING_PLANT', 'MILLING_UNIT', 'EXPORT_HUB'
    city VARCHAR(128) NOT NULL,
    region VARCHAR(128) NOT NULL,
    country VARCHAR(64) NOT NULL,
    grid_supplier VARCHAR(255),
    renewable_ppa_share_pct NUMERIC(5,2) DEFAULT 0.00,
    iso_audit_status VARCHAR(128),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. Verification Documents Table
CREATE TABLE IF NOT EXISTS tenant_documents (
    document_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id VARCHAR(64) REFERENCES tenants(tenant_id) ON DELETE CASCADE,
    document_type VARCHAR(128) NOT NULL, -- 'FORM_3_INCORPORATION', 'EPA_PERMIT', 'TAX_CLEARANCE', 'ISO_14067'
    file_name VARCHAR(255) NOT NULL,
    storage_uri VARCHAR(512) NOT NULL,
    verification_status VARCHAR(32) DEFAULT 'PENDING',
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 6. Declarations & Compliance Undertakings Table
CREATE TABLE IF NOT EXISTS tenant_declarations (
    declaration_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id VARCHAR(64) REFERENCES tenants(tenant_id) ON DELETE CASCADE,
    declaration_type VARCHAR(64) NOT NULL, -- 'EUDR_DEFORESTATION', 'EU_CBAM_TELEMETRY'
    is_accepted BOOLEAN DEFAULT FALSE,
    accepted_by_user_id UUID REFERENCES tenant_users(user_id),
    accepted_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

### 2.2 Register Organisation Endpoint

* **HTTP Method:** `POST`
* **Path:** `/api/v1/organisations/register`
* **Content-Type:** `application/json`

#### Request Payload
```json
{
  "account_owner": {
    "full_name": "Kwame Mensah",
    "email": "kwame.mensah@saurientcocoa.com",
    "phone_number": "+233 24 412 8092",
    "role": "Head of Sustainability & Supply Chain",
    "password": "SecurePassword123!"
  },
  "legal_identity": {
    "legal_name": "Ghana Cocoa Processing Corporation Ltd.",
    "trade_name": "Saurient Premium Cocoa Exports",
    "company_reg_no": "CS1029482024",
    "incorporation_date": "2012-04-18",
    "legal_form": "Private Limited Company (Ltd)",
    "country_of_registration": "Ghana"
  },
  "addresses": [
    {
      "address_type": "REGISTERED",
      "address_line_1": "14 Independence Avenue",
      "address_line_2": "Industrial Area",
      "city": "Tema",
      "region": "Greater Accra",
      "postal_code": "GT-020-4821",
      "country": "Ghana"
    }
  ],
  "tax_and_customs": {
    "tax_id_number": "C0012345678",
    "vat_gst_number": "VAT-GH-2400882",
    "reporting_currency": "GHS",
    "fiscal_year_start": "01 January",
    "eori_number": "GB123456789000",
    "primary_hs_code": "1801.00",
    "export_ports": ["Tema Sea Port", "Takoradi Commercial Hub"],
    "target_markets": ["European Union (CBAM Zone)", "North America"]
  },
  "industry_and_operations": {
    "primary_sector": "Cocoa Processing & Export",
    "annual_production_volume": "45000 Metric Tons / Year",
    "grid_supplier": "Electricity Company of Ghana (ECG)",
    "renewable_ppa_share_pct": 35.0,
    "iso_audit_status": "Certified (TÜV Rheinland)",
    "facilities": [
      {
        "facility_name": "Tema Processing Plant",
        "facility_type": "PROCESSING_PLANT",
        "city": "Tema",
        "region": "Greater Accra",
        "country": "Ghana"
      }
    ]
  },
  "data_readiness": {
    "primary_erp_system": "SAP S/4HANA Cloud",
    "iot_meters_count": 24,
    "primary_data_coverage_pct": 88.0,
    "api_gateway": "REST API / MQTT Connected"
  },
  "contacts": [
    { "full_name": "Ama Asantewaa", "email": "ama@saurientcocoa.com", "role": "SUSTAINABILITY_LEAD" },
    { "full_name": "Kofi Boateng", "email": "kofi@saurientcocoa.com", "role": "COMPLIANCE_OFFICER" }
  ],
  "declarations": {
    "eudr_compliance": true,
    "cbam_telemetry_accuracy": true
  }
}
```

#### Response Payload (`201 Created`)
```json
{
  "status": "SUCCESS",
  "message": "Organisation and primary account owner successfully registered",
  "registration_id": "SAU-REG-260941",
  "tenant_id": "org_ghana_cocoa_corp",
  "account_owner": {
    "user_id": "8f3b20c1-4b3f-42e1-8d2a-91a27e408e1a",
    "email": "kwame.mensah@saurientcocoa.com"
  },
  "readiness_score": 96,
  "created_at": "2026-09-28T09:40:00Z"
}
```

---

## 3. Comprehensive Screen & Sub-Tab API Catalog

This catalog outlines all dynamic API requirements across all 18 views and sub-tabs in the application.

---

### 3.1 Authentication & Role Selection (`/login`, `/`)

| Sub-Tab / View | Method | Endpoint Path | Description |
| :--- | :--- | :--- | :--- |
| **All Roles** | `POST` | `/api/v1/auth/login` | Authenticates email & password, returns JWT session token and role claims |
| **Me** | `GET` | `/api/v1/auth/me` | Fetches current user profile, active tenant ID, and permissions |
| **Logout** | `POST` | `/api/v1/auth/logout` | Invalidates active user JWT session |
| **Token Refresh** | `POST` | `/api/v1/auth/refresh-token` | Refreshes JWT bearer token |

---

### 3.2 Company Registration (`/registration`)

| Step / Section | Method | Endpoint Path | Description |
| :--- | :--- | :--- | :--- |
| **Onboarding Submit** | `POST` | `/api/v1/organisations/register` | Primary onboarding registration endpoint |
| **Draft Saver** | `POST` | `/api/v1/organisations/draft` | Autosaves in-progress registration draft state |
| **Resume Onboarding** | `GET` | `/api/v1/organisations/draft/{draft_id}` | Loads saved draft state upon resuming onboarding |
| **Document Upload** | `POST` | `/api/v1/organisations/documents/upload` | Uploads verification certificates (Form 3, EPA permit, Tax clearance, ISO 14067 report) |
| **Reg No. Validation**| `GET` | `/api/v1/organisations/validate-reg-no` | Validates company registration number uniqueness |

---

### 3.3 Company Dashboard (`/dashboard`, `/company-dashboard`)

| Sub-Tab | Method | Endpoint Path | Description |
| :--- | :--- | :--- | :--- |
| **Overview** | `GET` | `/api/v1/dashboard/company/kpis` | Returns Total CCF, PCF Intensity, Data Completeness %, Passport Readiness gates count |
| **Overview** | `GET` | `/api/v1/dashboard/company/emissions-chart` | Returns 12-month rolling emissions by scope and data origin (verified vs estimated) |
| **Priority Tasks** | `GET` | `/api/v1/dashboard/company/priority-tasks` | Returns priority action items and readiness gate review alerts |
| **Notifications** | `GET` | `/api/v1/dashboard/company/notifications` | Returns system alerts, verifier comments, and supplier declaration updates |
| **Recent Activity** | `GET` | `/api/v1/dashboard/company/records` | Returns recent PCF calculations, supplier declarations, and CBAM exposure logs |
| **Export** | `GET` | `/api/v1/dashboard/company/export` | Downloads CSV / printable HTML dashboard summary report |

---

### 3.4 Executive Dashboard for Ghana (`/executive-dashboard`)

| Sub-Tab | Method | Endpoint Path | Description |
| :--- | :--- | :--- | :--- |
| **Overview** | `GET` | `/api/v1/dashboard/executive/kpis` | Returns national KPIs (exporters onboarded, facilities connected, commodities tracked, verified passports issued) |
| **Overview** | `GET` | `/api/v1/dashboard/executive/map-locations` | Returns facility coordinates across Ghana regions (Tamale, Kumasi, Takoradi, Accra) |
| **Overview** | `GET` | `/api/v1/dashboard/executive/sector-adoption` | Bar chart data of connected facilities by sector (Cocoa, Cashew, Textiles, Foods, Metals) |
| **Overview** | `GET` | `/api/v1/dashboard/executive/emission-hotspots` | Estimated emissions by region (Greater Accra, Ashanti, Western, etc.) |
| **Overview** | `GET` | `/api/v1/dashboard/executive/commodities-table` | Table of exporters, facilities, passports, emissions, and readiness % per commodity |

---

### 3.5 Commodity & Product Setup (`/products/new`)

| Component | Method | Endpoint Path | Description |
| :--- | :--- | :--- | :--- |
| **List Rulebooks** | `GET` | `/api/v1/rules` | Lists all registered `CalculationRulebook` Custom Resources |
| **Create Rulebook** | `POST` | `/api/v1/rules` | Deploys a new `CalculationRulebook` CR defining CEL DAG rules ($R01 \dots R05$), accounting mode, and functional unit |
| **Register Product** | `POST` | `/api/v1/products` | Registers a new `Product` CR, triggering automated reconciliation and issuing a child `CarbonPassport` CR |
| **Commodity Templates**| `GET` | `/api/v1/products/templates` | Fetches sector commodity templates (Cocoa, Cashew, Textiles, Processed Foods, Metals) |

---

### 3.6 CCF & GHG Inventory (`/ghg`, `/carbon-accounting`)

| Sub-Tab | Method | Endpoint Path | Description |
| :--- | :--- | :--- | :--- |
| **Overview** | `GET` | `/api/v1/ghg/kpis` | Returns Scope 1, Scope 2, Scope 3 totals, and Primary Data % |
| **Overview** | `GET` | `/api/v1/ghg/monthly-chart` | Monthly emissions bar chart by scope |
| **Boundary** | `GET` | `/api/v1/ghg/boundary` | Returns organizational & operational boundary definitions |
| **Source Map** | `GET` | `/api/v1/ghg/sources` | Maps all emission sources across facilities and equipment |
| **Scope 1** | `GET` | `/api/v1/ghg/scope1` | Direct emissions line items (boilers, generators, fleet) |
| **Scope 2 Location** | `GET` | `/api/v1/ghg/scope2-location` | Location-based grid electricity accounting |
| **Scope 2 Market** | `GET` | `/api/v1/ghg/scope2-market` | Market-based electricity accounting (RECs, PPAs) |
| **Scope 3** | `GET` | `/api/v1/ghg/scope3` | Upstream and downstream value chain Scope 3 categories |
| **Calculations** | `GET` | `/api/v1/ghg/calculations` | Audit log of calculation formulas and DEFRA emission factors applied |
| **Review & Report** | `GET` | `/api/v1/ghg/records` | Records and provenance table |
| **Report Export** | `GET` | `/api/v1/ghg/report/export` | Generates official Corporate Greenhouse Gas Inventory Report (CSV / HTML / PDF) |

---

### 3.7 Product Carbon Footprint - PCF (`/pcf`, `/carbon-accounting`)

| Sub-Tab | Method | Endpoint Path | Description |
| :--- | :--- | :--- | :--- |
| **Projects** | `GET` | `/api/v1/pcf/projects` | Returns active PCF calculation projects and batch status |
| **Output Definition** | `GET` | `/api/v1/pcf/{batch_id}/output-definition` | Functional unit definition (e.g. kg CO₂e per kg Refined Cocoa Butter) |
| **Boundary** | `GET` | `/api/v1/pcf/{batch_id}/boundary` | Lifecycle boundary (Cradle-to-Gate vs Cradle-to-Grave) |
| **Inventory** | `GET` | `/api/v1/pcf/{batch_id}/inventory` | Bill of materials and process inputs inventory |
| **Allocation** | `GET` | `/api/v1/pcf/{batch_id}/allocation` | Co-product mass/economic allocation rules |
| **Logistics** | `GET` | `/api/v1/pcf/{batch_id}/logistics` | Upstream transport and export freight logistics footprint |
| **Calculation** | `GET` | `/api/v1/pcf/{batch_id}/calculation-trace` | Immutable CEL calculation DAG evaluation steps |
| **Hotspots** | `GET` | `/api/v1/pcf/{batch_id}/hotspots` | Lifecycle stage contribution bar chart and hotspot ranking |
| **Report** | `GET` | `/api/v1/pcf/{batch_id}/report` | Formats ISO 14067 Product Footprint report |

---

### 3.8 Supplier & Customer Network (`/suppliers`, `/value-chain`)

| Sub-Tab | Method | Endpoint Path | Description |
| :--- | :--- | :--- | :--- |
| **Suppliers** | `GET` | `/api/v1/suppliers` | Active supplier metrics, response rates %, verified PCF coverage, incomplete records |
| **Invitations** | `POST` | `/api/v1/suppliers/invite` | Invites tier-1 supply chain partners to submit carbon declarations |
| **Declarations** | `GET` | `/api/v1/suppliers/declarations` | Supplier PCF declarations & status (`CORRECTION`, `ASSUMPTION`, `OVERDUE`) |
| **Evidence** | `GET` | `/api/v1/suppliers/evidence` | Supplier attached energy bills and emission factor proofs |
| **Scorecards** | `GET` | `/api/v1/suppliers/scorecards` | Primary data completeness and carbon intensity supplier scorecards |
| **Customer Requests**| `GET` | `/api/v1/customers/requests` | Incoming downstream customer PCF data requests |

---

### 3.9 EU CBAM Exposure (`/cbam`)

| Sub-Tab | Method | Endpoint Path | Description |
| :--- | :--- | :--- | :--- |
| **Overview** | `GET` | `/api/v1/cbam/overview` | Covered import/export volume (tons), embedded emissions (tCO₂e), estimated liability (€) |
| **CN Classification**| `GET` | `/api/v1/cbam/cn-classifications` | Tariff classification table (CN 1804 00, CN 7308 90, CN 7616 99) and CBAM scope status |
| **Installations** | `GET` | `/api/v1/cbam/installations` | Registered non-EU production installation IDs |
| **Monitoring Plans** | `GET` | `/api/v1/cbam/monitoring-plans` | EU CBAM Annex IV compliant monitoring methodology |
| **Exposure & Cost** | `GET` | `/api/v1/cbam/exposure-scenarios` | Financial exposure model using live EU ETS carbon certificate prices (€/tCO₂e) |
| **Data Pack** | `GET` | `/api/v1/cbam/data-pack/export` | Generates official EU CBAM XML Communication Structure for EU importers |

---

### 3.10 Executive Carbon Analytics (`/analytics`)

| Sub-Tab | Method | Endpoint Path | Description |
| :--- | :--- | :--- | :--- |
| **Executive** | `GET` | `/api/v1/analytics/executive-summary` | CCF reduction %, verified portfolio %, 12-month energy savings %, avoided cost (€) |
| **Executive** | `GET` | `/api/v1/analytics/emissions-trend` | Multi-period emissions, production volume, and carbon intensity trend chart |
| **Facilities** | `GET` | `/api/v1/analytics/facilities` | Site-by-site carbon intensity and efficiency benchmarking |
| **Products** | `GET` | `/api/v1/analytics/products` | Portfolio product carbon footprint comparison |
| **Scenarios** | `POST` | `/api/v1/analytics/scenarios/run` | Climate scenario modeling (carbon tax, grid decarbonisation impact) |

---

### 3.11 Organisation & Facilities (`/organisation`)

| Sub-Tab | Method | Endpoint Path | Description |
| :--- | :--- | :--- | :--- |
| **Profile** | `GET` | `/api/v1/organisation/profile` | Fetches corporate identity, legal entity details, tax IDs, and registration numbers |
| **Facilities** | `GET` | `/api/v1/organisation/facilities` | Active operating site records (Tema, Kumasi, Takoradi, Accra) and data coverage % |
| **Facilities** | `POST` | `/api/v1/organisation/facilities` | Adds new manufacturing or processing facility |
| **Users & Roles** | `GET` | `/api/v1/organisation/users` | List organization users, roles, and access permissions |
| **Reporting Periods**| `GET` | `/api/v1/organisation/reporting-periods` | Fiscal reporting years (FY2024 baseline, FY2026 active) |

---

### 3.12 Integration Hub (`/data`)

| Sub-Tab | Method | Endpoint Path | Description |
| :--- | :--- | :--- | :--- |
| **Connections** | `GET` | `/api/v1/integrations/connections` | Active data sources (SAP S/4HANA, Sattric+ Smart Meter, Salesforce), health status, sync time |
| **Ingestion Chart** | `GET` | `/api/v1/integrations/ingestion-volume` | Hourly/daily telemetry ingestion volume and accepted record % |
| **Exceptions** | `GET` | `/api/v1/integrations/exceptions` | Data pipeline validation exceptions and rejected row logs |
| **Bulk Upload** | `POST` | `/api/v1/integrations/bulk-upload` | Uploads supplier PCF or energy telemetry CSV files |
| **Telemetry Stream**| `GET` | `/api/v1/integrations/telemetry/live` | WebSocket / SSE stream for real-time Sattric+ smart meter feeds |

---

### 3.13 MRV & Independent Verification (`/mrv`)

| Sub-Tab | Method | Endpoint Path | Description |
| :--- | :--- | :--- | :--- |
| **Readiness** | `GET` | `/api/v1/mrv/readiness-summary` | Readiness score (%), evidence items accepted count, open findings, verifier status |
| **Data Freeze** | `POST` | `/api/v1/mrv/data-freeze` | Freezes inventory data for accredited third-party verification |
| **Verifiers** | `GET` | `/api/v1/mrv/verifiers` | Accredited verifier directory (TÜV Rheinland, DNV GL) |
| **Findings** | `GET` | `/api/v1/mrv/findings` | Verification audit findings table (`F-021`, `F-018`, severity, status) |
| **Corrections** | `POST` | `/api/v1/mrv/findings/{finding_id}/correct` | Submits corrective action and updated evidence for auditor review |
| **Report** | `GET` | `/api/v1/mrv/verification-report` | Downloads accredited Third-Party Verification Statement |

---

### 3.14 Evidence & Verification Screen (`/evidence`)

| Component | Method | Endpoint Path | Description |
| :--- | :--- | :--- | :--- |
| **List Documents** | `GET` | `/api/v1/evidence` | Fetches uploaded proof documents filtered by status (`Approved`, `Reviewed`, `Pending`, `Need Clarification`) |
| **Upload File** | `POST` | `/api/v1/evidence/upload` | Uploads electricity bills, fuel invoices, supplier declarations, or production logs |
| **Auditor Review** | `POST` | `/api/v1/evidence/{doc_id}/review` | Updates reviewer checklist, saves auditor comments, and transitions verification status |

---

### 3.15 Emission Calculation Dashboard (`/emissions`)

| Component | Method | Endpoint Path | Description |
| :--- | :--- | :--- | :--- |
| **Scope Cards** | `GET` | `/api/v1/emissions/summary/{batch_id}` | Returns calculated Scope 1, 2, 3 values and total product footprint for batch |
| **Source Breakdown**| `GET` | `/api/v1/emissions/source-breakdown/{batch_id}` | Donut chart data (Electricity %, Fuel %, Logistics %, Materials %, Packaging %) |
| **Methodology** | `GET` | `/api/v1/emissions/methodology/{batch_id}` | Emission factor database references (DEFRA, IPCC, GHG Protocol alignment) |

---

### 3.16 Digital Carbon Passport Output & Gallery (`/passport`, `/passport/:id`)

| View / Sub-Tab | Method | Endpoint Path | Description |
| :--- | :--- | :--- | :--- |
| **Gallery View** | `GET` | `/api/v1/passports` | Lists all rich digital carbon passports with search & commodity filters (`COCOA`, `ALUMINIUM`, `CEMENT`) |
| **Detail View** | `GET` | `/api/v1/passports/{id}` | Fetches verified rich passport details from Redis cache or PostgreSQL RLS storage |
| **Sign & Issue** | `POST` | `/api/v1/passports/{id}/issue` | Generates SHA-256 cryptographic hash proof and issues passport |
| **PDF Certificate** | `GET` | `/api/v1/passports/{id}/pdf` | Downloads official PDF Carbon Passport certificate |
| **QR Verification**| `GET` | `/api/v1/passports/{id}/qr-verify` | Public QR code verification endpoint for EU customs & buyers |

---

### 3.17 Paris Alignment (`/paris-alignment`)

| Sub-Tab | Method | Endpoint Path | Description |
| :--- | :--- | :--- | :--- |
| **NDC Mapping** | `GET` | `/api/v1/paris-alignment/ndc-mapping` | National commitment configuration (Ghana NDC), contribution areas, mapping readiness score % |
| **Company Target**| `GET` | `/api/v1/paris-alignment/company-target` | Baseline emissions (12,842 tCO₂e), reduction pathway chart data (2024–2030), interim milestones |
| **Mitigation Actions**| `GET` | `/api/v1/paris-alignment/mitigation-actions` | Mitigation portfolio table (rooftop solar, boiler upgrade, VFD motors, low-carbon packaging) |
| **Add Mitigation** | `POST` | `/api/v1/paris-alignment/mitigation-actions` | Registers a new carbon mitigation initiative with expected vs verified reduction |
| **Transparency Score**| `GET` | `/api/v1/paris-alignment/transparency-score` | Overall gauge score (0–100) and 8 dimension bars |
| **Passport Summary**| `GET` | `/api/v1/paris-alignment/passport-summary/{id}` | Public-facing Paris Alignment summary with QR verification link |

---

### 3.18 Platform Administration (`/admin`)

| Sub-Tab | Method | Endpoint Path | Description |
| :--- | :--- | :--- | :--- |
| **Configuration** | `GET` | `/api/v1/admin/kpis` | Active users count, MFA enforcement %, 30-day audit events, API success rate %, backup status |
| **Users & Roles** | `GET` | `/api/v1/admin/users` | Platform user management and RBAC privilege configuration |
| **Audit Trail** | `GET` | `/api/v1/admin/audit-trail` | Cryptographic audit event stream with event ID, user, action, timestamp, and SHA-256 hash |
| **System Health** | `GET` | `/api/v1/admin/system-health` | Kind Kubernetes cluster node status, Postgres connection pool, Redis edge cache latency |
| **Reference Data** | `GET` | `/api/v1/admin/reference-data` | Global DEFRA / IPCC emission factor database table management |

---

## 4. Implementation Strategy & Roadmap

1. **Phase 1 — Auth & Onboarding:** Implement `POST /api/v1/organisations/register`, `/api/v1/auth/*`, and core database schemas.
2. **Phase 2 — Dashboards & Carbon Accounting:** Build `/api/v1/dashboard/*`, `/api/v1/ghg/*`, and `/api/v1/suppliers/*`.
3. **Phase 3 — Trade, MRV & Paris Alignment:** Deliver `/api/v1/cbam/*`, `/api/v1/mrv/*`, and `/api/v1/paris-alignment/*`.
