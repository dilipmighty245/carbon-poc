import type { ProductCreateRequest, ProductCreateResponse, RichDigitalPassport, RulebookCreateRequest, RulebookItem } from '../types';

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api/v1';
export const DEFAULT_TENANT_ID = 'org_saurient_demo';

export interface ApiFetchResult<T> {
  data: T;
  isLive: boolean;
  endpoint: string;
  status: number;
  responseTimeMs: number;
  error?: string;
}

export async function getAllRulesWithMeta(tenantId = DEFAULT_TENANT_ID): Promise<ApiFetchResult<RulebookItem[]>> {
  const endpoint = `${API_BASE_URL}/rules`;
  const startTime = performance.now();
  try {
    const res = await fetch(endpoint, {
      headers: {
        'X-Tenant-ID': tenantId,
      },
    });
    const responseTimeMs = Math.round(performance.now() - startTime);

    if (res.ok) {
      const data = await res.json();
      const rulesList = Array.isArray(data) ? data : [];
      return {
        data: rulesList,
        isLive: true,
        endpoint,
        status: res.status,
        responseTimeMs,
      };
    } else {
      return {
        data: [],
        isLive: false,
        endpoint,
        status: res.status,
        responseTimeMs,
        error: `HTTP ${res.status}`,
      };
    }
  } catch (err: any) {
    const responseTimeMs = Math.round(performance.now() - startTime);
    return {
      data: [],
      isLive: false,
      endpoint,
      status: 0,
      responseTimeMs,
      error: err.message || 'Network unreachable',
    };
  }
}

export async function getAllRules(tenantId = DEFAULT_TENANT_ID): Promise<RulebookItem[]> {
  const res = await getAllRulesWithMeta(tenantId);
  return res.data;
}

export async function createRulebook(req: RulebookCreateRequest, tenantId = DEFAULT_TENANT_ID): Promise<any> {
  const res = await fetch(`${API_BASE_URL}/rules`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Tenant-ID': tenantId,
    },
    body: JSON.stringify(req),
  });
  if (!res.ok) {
    throw new Error(`HTTP error ${res.status}`);
  }
  return await res.json();
}

function getLocalCustomPassports(): RichDigitalPassport[] {
  try {
    const raw = localStorage.getItem('saurient_custom_passports');
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveLocalCustomPassport(passport: RichDigitalPassport) {
  try {
    const list = getLocalCustomPassports();
    const existingIdx = list.findIndex(p => p.passport_metadata.passport_id === passport.passport_metadata.passport_id);
    if (existingIdx >= 0) {
      list[existingIdx] = passport;
    } else {
      list.unshift(passport);
    }
    localStorage.setItem('saurient_custom_passports', JSON.stringify(list));
  } catch (err) {
    console.error('Failed to save local custom passport', err);
  }
}

export async function createProduct(req: ProductCreateRequest): Promise<ProductCreateResponse> {
  let resp: ProductCreateResponse;
  try {
    const res = await fetch(`${API_BASE_URL}/products`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Tenant-ID': req.tenant_id || DEFAULT_TENANT_ID,
      },
      body: JSON.stringify(req),
    });
    if (!res.ok) {
      throw new Error(`HTTP error ${res.status}`);
    }
    resp = await res.json();
  } catch (err) {
    console.warn("Backend API unavailable for createProduct, falling back to local creation:", err);
    const generatedId = `PASS-2026-${Math.floor(100 + Math.random() * 900)}-v1.0`;
    resp = {
      name: req.batch_id || `BATCH-${Date.now()}`,
      namespace: req.rulebook_ref?.namespace || 'default',
      tenant_id: req.tenant_id || DEFAULT_TENANT_ID,
      facility_id: req.facility_id,
      batch_id: req.batch_id,
      product_name: req.product_name,
      commodity_type: req.commodity_type,
      status: 'VERIFIED',
      created_at: new Date().toISOString(),
      passport_id: generatedId,
    };
  }

  const passportId = resp.passport_id || `PASS-2026-${Math.floor(100 + Math.random() * 900)}-v1.0`;
  resp.passport_id = passportId;

  const newPassport: RichDigitalPassport = {
    passport_metadata: {
      passport_id: passportId,
      unique_qr_code: `QR-${passportId}`,
      cryptographic_hash: `0x${Math.random().toString(16).substring(2, 10)}${Math.random().toString(16).substring(2, 10)}`,
      issuance_date: new Date().toISOString().split('T')[0],
      status: 'ISSUED',
    },
    product_summary: {
      commodity: req.commodity_type || 'Steel',
      product_name: req.product_name || 'Hot Rolled Steel Coil',
      batch_number: req.batch_id || 'BATCH-001',
      producer_organization: 'Saurient Global Steel Corp',
      facility: {
        name: req.batch_data?.facility_name || 'Duisburg Main Works',
        location: req.batch_data?.facility_location || 'Duisburg, Germany',
        country_of_origin: 'Germany',
      },
      production_date: new Date().toISOString().split('T')[0],
      batch_size: {
        quantity: req.batch_data?.batch_size_quantity || 1000,
        unit: req.batch_data?.unit_of_measure || 'tonnes',
      },
    },
    carbon_footprint: {
      total_batch_footprint_kg_co2e: 1850000,
      intensity_per_unit: {
        value: 1.85,
        unit: 'tCO2e/tonne',
      },
      breakdown_by_scope: {
        scope1_direct_emissions: 1.25,
        scope2_indirect_electricity: 0.35,
        scope3_upstream_inputs: 0.25,
      },
      compliance_benchmarks: {
        eu_cbam_benchmark: 1.90,
        industry_average: 2.10,
        is_compliant: true,
      },
    },
    verification_and_assurance: {
      verification_status: 'VERIFIED',
      verifier_name: 'TÜV Rheinland Energy GmbH',
      assurance_level: 'REASONABLE',
      verification_date: new Date().toISOString().split('T')[0],
      certificate_reference: `CERT-EU-CBAM-2026-${Math.floor(1000 + Math.random() * 9000)}`,
    },
    governance_and_provenance: {
      rulebook_applied: req.rulebook_ref?.name || 'eu-cbam-iron-steel-v2026.1',
      calculation_methodology: 'GHG Protocol / EU CBAM Regulation 2023/956',
      data_quality_rating: 'TIER 3 (High Precision / Metered)',
    },
  };

  saveLocalCustomPassport(newPassport);

  return resp;
}

export async function getAllPassportsWithMeta(tenantId = DEFAULT_TENANT_ID): Promise<ApiFetchResult<RichDigitalPassport[]>> {
  const endpoint = `${API_BASE_URL}/passports`;
  const startTime = performance.now();
  const localPassports = getLocalCustomPassports();

  try {
    const res = await fetch(endpoint, {
      headers: {
        'X-Tenant-ID': tenantId,
      },
    });
    const responseTimeMs = Math.round(performance.now() - startTime);

    if (res.ok) {
      const data = await res.json();
      const passportsList = Array.isArray(data) ? data : [];
      
      const combined = [...localPassports];
      for (const p of passportsList) {
        if (!combined.some(cp => cp.passport_metadata.passport_id === p.passport_metadata.passport_id)) {
          combined.push(p);
        }
      }

      return {
        data: combined,
        isLive: true,
        endpoint,
        status: res.status,
        responseTimeMs,
      };
    } else {
      return {
        data: localPassports,
        isLive: false,
        endpoint,
        status: res.status,
        responseTimeMs,
        error: `HTTP ${res.status}`,
      };
    }
  } catch (err: any) {
    const responseTimeMs = Math.round(performance.now() - startTime);
    return {
      data: localPassports,
      isLive: false,
      endpoint,
      status: 0,
      responseTimeMs,
      error: err.message || 'Network unreachable',
    };
  }
}

export async function getAllPassports(tenantId = DEFAULT_TENANT_ID): Promise<RichDigitalPassport[]> {
  const res = await getAllPassportsWithMeta(tenantId);
  return res.data;
}

export async function getPassportWithMeta(passportId: string, tenantId = DEFAULT_TENANT_ID): Promise<ApiFetchResult<RichDigitalPassport | null>> {
  const endpoint = `${API_BASE_URL}/passports/${passportId}`;
  const startTime = performance.now();
  try {
    const res = await fetch(endpoint, {
      headers: {
        'X-Tenant-ID': tenantId,
      },
    });
    const responseTimeMs = Math.round(performance.now() - startTime);

    if (res.ok) {
      const data: RichDigitalPassport = await res.json();
      return {
        data,
        isLive: true,
        endpoint,
        status: res.status,
        responseTimeMs,
      };
    } else {
      const errText = await res.text();
      return {
        data: null,
        isLive: false,
        endpoint,
        status: res.status,
        responseTimeMs,
        error: `HTTP ${res.status}: ${errText}`,
      };
    }
  } catch (err: any) {
    const responseTimeMs = Math.round(performance.now() - startTime);
    return {
      data: null,
      isLive: false,
      endpoint,
      status: 0,
      responseTimeMs,
      error: err.message || 'Network unreachable',
    };
  }
}

export async function getPassport(passportId: string, tenantId = DEFAULT_TENANT_ID): Promise<RichDigitalPassport | null> {
  const result = await getPassportWithMeta(passportId, tenantId);
  return result.data;
}

export async function getProductStatus(productName: string, namespace = 'default') {
  const endpoint = `${API_BASE_URL}/products/${productName}?namespace=${namespace}`;
  try {
    const res = await fetch(endpoint);
    if (!res.ok) throw new Error(`HTTP error ${res.status}`);
    return await res.json();
  } catch (err) {
    console.warn(`Fetch product status for ${productName} failed:`, err);
    return null;
  }
}

export async function getNexusCarbonPassports() {
  const endpoint = `${API_BASE_URL}/nexus/carbon-passports`;
  try {
    const res = await fetch(endpoint);
    if (!res.ok) throw new Error(`HTTP error ${res.status}`);
    return await res.json();
  } catch (err) {
    console.warn(`Fetch nexus carbon passports failed:`, err);
    return null;
  }
}

// Organisation REST API Client Functions

export async function loginUser(email: string, password: string, tenantId = DEFAULT_TENANT_ID) {
  const res = await fetch(`${API_BASE_URL}/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Tenant-ID': tenantId,
    },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) throw new Error(`HTTP error ${res.status}`);
  return await res.json();
}

export async function getOrgProfile(tenantId = DEFAULT_TENANT_ID) {
  const res = await fetch(`${API_BASE_URL}/organisation/profile`, {
    headers: { 'X-Tenant-ID': tenantId },
  });
  if (!res.ok) throw new Error(`HTTP error ${res.status}`);
  return await res.json();
}

export async function saveOrgProfile(profile: any, tenantId = DEFAULT_TENANT_ID) {
  const res = await fetch(`${API_BASE_URL}/organisation/profile`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'X-Tenant-ID': tenantId,
    },
    body: JSON.stringify(profile),
  });
  if (!res.ok) throw new Error(`HTTP error ${res.status}`);
  return await res.json();
}

export async function getOrgFacilities(tenantId = DEFAULT_TENANT_ID) {
  const res = await fetch(`${API_BASE_URL}/organisation/facilities`, {
    headers: { 'X-Tenant-ID': tenantId },
  });
  if (!res.ok) throw new Error(`HTTP error ${res.status}`);
  return await res.json();
}

export async function saveOrgFacility(facility: any, tenantId = DEFAULT_TENANT_ID) {
  const res = await fetch(`${API_BASE_URL}/organisation/facilities`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Tenant-ID': tenantId,
    },
    body: JSON.stringify(facility),
  });
  if (!res.ok) throw new Error(`HTTP error ${res.status}`);
  return await res.json();
}

export async function deleteOrgFacility(id: string, tenantId = DEFAULT_TENANT_ID) {
  const res = await fetch(`${API_BASE_URL}/organisation/facilities/${id}`, {
    method: 'DELETE',
    headers: { 'X-Tenant-ID': tenantId },
  });
  if (!res.ok) throw new Error(`HTTP error ${res.status}`);
  return await res.json();
}

export async function getOrgProcesses(tenantId = DEFAULT_TENANT_ID) {
  const res = await fetch(`${API_BASE_URL}/organisation/processes`, {
    headers: { 'X-Tenant-ID': tenantId },
  });
  if (!res.ok) throw new Error(`HTTP error ${res.status}`);
  return await res.json();
}

export async function saveOrgProcess(process: any, tenantId = DEFAULT_TENANT_ID) {
  const res = await fetch(`${API_BASE_URL}/organisation/processes`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Tenant-ID': tenantId,
    },
    body: JSON.stringify(process),
  });
  if (!res.ok) throw new Error(`HTTP error ${res.status}`);
  return await res.json();
}

export async function deleteOrgProcess(id: string, tenantId = DEFAULT_TENANT_ID) {
  const res = await fetch(`${API_BASE_URL}/organisation/processes/${id}`, {
    method: 'DELETE',
    headers: { 'X-Tenant-ID': tenantId },
  });
  if (!res.ok) throw new Error(`HTTP error ${res.status}`);
  return await res.json();
}

export async function getOrgUsers(tenantId = DEFAULT_TENANT_ID) {
  const res = await fetch(`${API_BASE_URL}/organisation/users`, {
    headers: { 'X-Tenant-ID': tenantId },
  });
  if (!res.ok) throw new Error(`HTTP error ${res.status}`);
  return await res.json();
}

export async function saveOrgUser(user: any, tenantId = DEFAULT_TENANT_ID) {
  const res = await fetch(`${API_BASE_URL}/organisation/users`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Tenant-ID': tenantId,
    },
    body: JSON.stringify(user),
  });
  if (!res.ok) throw new Error(`HTTP error ${res.status}`);
  return await res.json();
}

export async function updateOrgUserRole(userId: string, role: string, tenantId = DEFAULT_TENANT_ID) {
  const res = await fetch(`${API_BASE_URL}/organisation/users/role`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'X-Tenant-ID': tenantId,
    },
    body: JSON.stringify({ user_id: userId, role }),
  });
  if (!res.ok) throw new Error(`HTTP error ${res.status}`);
  return await res.json();
}

export async function getOrgReportingPeriods(tenantId = DEFAULT_TENANT_ID) {
  const res = await fetch(`${API_BASE_URL}/organisation/reporting-periods`, {
    headers: { 'X-Tenant-ID': tenantId },
  });
  if (!res.ok) throw new Error(`HTTP error ${res.status}`);
  return await res.json();
}

export async function saveOrgReportingPeriod(period: any, tenantId = DEFAULT_TENANT_ID) {
  const res = await fetch(`${API_BASE_URL}/organisation/reporting-periods`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Tenant-ID': tenantId,
    },
    body: JSON.stringify(period),
  });
  if (!res.ok) throw new Error(`HTTP error ${res.status}`);
  return await res.json();
}

export async function getOrgLocalisation(tenantId = DEFAULT_TENANT_ID) {
  const res = await fetch(`${API_BASE_URL}/organisation/localisation`, {
    headers: { 'X-Tenant-ID': tenantId },
  });
  if (!res.ok) throw new Error(`HTTP error ${res.status}`);
  return await res.json();
}

export async function saveOrgLocalisation(loc: any, tenantId = DEFAULT_TENANT_ID) {
  const res = await fetch(`${API_BASE_URL}/organisation/localisation`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'X-Tenant-ID': tenantId,
    },
    body: JSON.stringify(loc),
  });
  if (!res.ok) throw new Error(`HTTP error ${res.status}`);
  return await res.json();
}

export async function getOrgApprovals(tenantId = DEFAULT_TENANT_ID) {
  const res = await fetch(`${API_BASE_URL}/organisation/approvals`, {
    headers: { 'X-Tenant-ID': tenantId },
  });
  if (!res.ok) throw new Error(`HTTP error ${res.status}`);
  return await res.json();
}

export async function saveOrgApproval(approval: any, tenantId = DEFAULT_TENANT_ID) {
  const res = await fetch(`${API_BASE_URL}/organisation/approvals`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Tenant-ID': tenantId,
    },
    body: JSON.stringify(approval),
  });
  if (!res.ok) throw new Error(`HTTP error ${res.status}`);
  return await res.json();
}

export interface LineageNodeData {
  node_id: string;
  node_type: string;
  reference_id: string;
  label: string;
  properties: Record<string, any>;
  created_at?: string;
}

export interface LineageEdgeData {
  edge_id: string;
  parent_node_id: string;
  child_node_id: string;
  edge_type: string;
}

export interface LineageDAGData {
  passport_id: string;
  nodes: LineageNodeData[];
  edges: LineageEdgeData[];
}

export interface InputCorrectionReq {
  input_node_id: string;
  new_value: number;
  unit: string;
  reason: string;
  user_ref: string;
}

export interface InputCorrectionRes {
  correction_id: string;
  input_node_id: string;
  old_value: number;
  new_value: number;
  original_calc_version: string;
  original_intensity_kg_co2e: number;
  new_calc_version: string;
  new_intensity_kg_co2e: number;
  original_passport_id: string;
  original_passport_frozen: boolean;
  original_passport_hash: string;
  new_draft_passport_id: string;
  affected_nodes: LineageNodeData[];
  timestamp: string;
}

export async function getLineageDAG(passportId = 'PASS-2026-981-v1.0', tenantId = DEFAULT_TENANT_ID): Promise<LineageDAGData> {
  const res = await fetch(`${API_BASE_URL}/lineage/trace/${passportId}`, {
    headers: { 'X-Tenant-ID': tenantId },
  });
  if (!res.ok) throw new Error(`HTTP error ${res.status}`);
  return await res.json();
}

export async function correctSupplierInput(req: InputCorrectionReq, tenantId = DEFAULT_TENANT_ID): Promise<InputCorrectionRes> {
  const res = await fetch(`${API_BASE_URL}/lineage/correct-input`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Tenant-ID': tenantId,
    },
    body: JSON.stringify(req),
  });
  if (!res.ok) throw new Error(`HTTP error ${res.status}`);
  return await res.json();
}

