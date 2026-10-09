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
    return resp;
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
    return resp;
  }
}

export async function getAllPassportsWithMeta(tenantId = DEFAULT_TENANT_ID): Promise<ApiFetchResult<RichDigitalPassport[]>> {
  const endpoint = `${API_BASE_URL}/passports`;
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
      const passportsList = Array.isArray(data) ? data : [];

      return {
        data: passportsList,
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

export async function submitPassportForVerification(passportId: string, submittedBy = 'Company Operator', notes = '', tenantId = DEFAULT_TENANT_ID) {
  const res = await fetch(`${API_BASE_URL}/passports/${passportId}/submit`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Tenant-ID': tenantId,
      'X-User-Role': localStorage.getItem('saurient_user_role') || 'Company Operator',
      'X-User-Email': localStorage.getItem('saurient_user_email') || submittedBy,
    },
    body: JSON.stringify({ submitted_by: submittedBy, notes }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
    throw new Error(err.error || `Failed to submit passport: ${res.status}`);
  }
  return await res.json();
}

export async function requestPassportCorrections(passportId: string, verifierName = 'Sarah Jenkins (Lead Verifier)', findingTitle = 'Material Finding', description = '', tenantId = DEFAULT_TENANT_ID) {
  const res = await fetch(`${API_BASE_URL}/passports/${passportId}/request-corrections`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Tenant-ID': tenantId,
      'X-User-Role': localStorage.getItem('saurient_user_role') || 'Verifier',
      'X-User-Email': localStorage.getItem('saurient_user_email') || 'auditor@bureau-veritas.com',
    },
    body: JSON.stringify({
      verifier_name: verifierName,
      finding_title: findingTitle,
      finding_description: description,
    }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
    throw new Error(err.error || `Failed to request corrections: ${res.status}`);
  }
  return await res.json();
}

export async function verifyPassport(passportId: string, verifierName = 'Sarah Jenkins (Lead Verifier)', agencyName = 'Bureau Veritas UK Ltd (Accreditation #NAB-8820)', opinion = 'Verified Without Qualification', tenantId = DEFAULT_TENANT_ID) {
  const userRole = localStorage.getItem('saurient_user_role') || 'Verifier';
  const res = await fetch(`${API_BASE_URL}/passports/${passportId}/verify`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Tenant-ID': tenantId,
      'X-User-Role': userRole,
      'X-User-Email': localStorage.getItem('saurient_user_email') || 'auditor@bureau-veritas.com',
    },
    body: JSON.stringify({
      verifier_name: verifierName,
      agency_name: agencyName,
      assurance_level: 'Reasonable Assurance',
      opinion,
    }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
    throw new Error(err.error || `Failed to verify passport: ${res.status}`);
  }
  return await res.json();
}

export async function signAndIssuePassport(passportId: string, signerName = 'Dr. Elena Rostova', signerRole = 'Chief Sustainability Officer', keyId = '0xKEY-ORATOR-PROD-SECURE-ED25519-88492', tenantId = DEFAULT_TENANT_ID) {
  const res = await fetch(`${API_BASE_URL}/passports/${passportId}/sign`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Tenant-ID': tenantId,
      'X-User-Role': localStorage.getItem('saurient_user_role') || 'Passport Officer',
      'X-User-Email': localStorage.getItem('saurient_user_email') || 'officer@saurient.com',
    },
    body: JSON.stringify({
      signer_name: signerName,
      signer_role: signerRole,
      key_id: keyId,
    }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
    throw new Error(err.error || `Failed to sign passport: ${res.status}`);
  }
  return await res.json();
}

export async function submitPassportToAgency(passportId: string, agencyName = 'EU CBAM Transitional Registry & National Competent Authority', declarantId = 'DEC-EU-2026-901', tenantId = DEFAULT_TENANT_ID) {
  const res = await fetch(`${API_BASE_URL}/passports/${passportId}/submit-agency`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Tenant-ID': tenantId,
      'X-User-Role': localStorage.getItem('saurient_user_role') || 'Company Operator',
      'X-User-Email': localStorage.getItem('saurient_user_email') || 'operator@asante-cocoa.com',
    },
    body: JSON.stringify({
      agency_name: agencyName,
      declarant_id: declarantId,
    }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
    throw new Error(err.error || `Failed to submit to agency: ${res.status}`);
  }
  return await res.json();
}

export interface MrvSubmitPackagePayload {
  engagement_id?: string;
  passport_id?: string;
  batch_id?: string;
  facility?: string;
  submitted_by?: string;
  notes?: string;
  dataset_hash?: string;
}

export async function submitMrvVerificationPackage(payload: MrvSubmitPackagePayload, tenantId = DEFAULT_TENANT_ID) {
  const userRole = localStorage.getItem('saurient_user_role') || 'Company Operator';
  const userEmail = localStorage.getItem('saurient_user_email') || payload.submitted_by || 'operator@asante-cocoa.com';
  const res = await fetch(`${API_BASE_URL}/mrv/readiness/submit`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Tenant-ID': tenantId,
      'X-User-Role': userRole,
      'X-User-Email': userEmail,
    },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
    throw new Error(err.error || `Failed to submit verification package: ${res.status}`);
  }
  return await res.json();
}

export async function freezeMrvDataset(payload: { engagement_id?: string; passport_id?: string; batch_id?: string; reason?: string; frozen_by?: string }, tenantId = DEFAULT_TENANT_ID) {
  const userRole = localStorage.getItem('saurient_user_role') || 'Company Operator';
  const userEmail = localStorage.getItem('saurient_user_email') || payload.frozen_by || 'operator@asante-cocoa.com';
  const res = await fetch(`${API_BASE_URL}/mrv/freeze`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Tenant-ID': tenantId,
      'X-User-Role': userRole,
      'X-User-Email': userEmail,
    },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
    throw new Error(err.error || `Failed to freeze dataset: ${res.status}`);
  }
  return await res.json();
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

// Authentication & Organisation REST API Client Functions

export interface AuthUser {
  id: string;
  tenant_id: string;
  name: string;
  email: string;
  role: string;
  facilityScope?: string;
  lastLogin?: string;
  status: string;
}

export interface AuthResponse {
  token: string;
  user: AuthUser;
  expires_in?: number;
}

export async function loginUser(email: string, password: string, tenantId = DEFAULT_TENANT_ID): Promise<AuthResponse> {
  const res = await fetch(`${API_BASE_URL}/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Tenant-ID': tenantId,
    },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) {
    const errorBody = await res.json().catch(() => ({}));
    throw new Error(errorBody.error || `Authentication failed (${res.status})`);
  }
  return await res.json();
}

export async function registerUser(payload: {
  tenant_id?: string;
  name: string;
  email: string;
  password: string;
  role: string;
  facility_scope?: string;
}): Promise<AuthResponse> {
  const res = await fetch(`${API_BASE_URL}/auth/register`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Tenant-ID': payload.tenant_id || DEFAULT_TENANT_ID,
    },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const errorBody = await res.json().catch(() => ({}));
    throw new Error(errorBody.error || `Registration failed (${res.status})`);
  }
  return await res.json();
}

export async function getCurrentUser(): Promise<AuthUser> {
  const token = localStorage.getItem('saurient_auth_token');
  const res = await fetch(`${API_BASE_URL}/auth/me`, {
    headers: {
      'Authorization': token ? `Bearer ${token}` : '',
      'X-Tenant-ID': localStorage.getItem('saurient_tenant_id') || DEFAULT_TENANT_ID,
    },
  });
  if (!res.ok) {
    const errorBody = await res.json().catch(() => ({}));
    throw new Error(errorBody.error || `Failed to fetch current user (${res.status})`);
  }
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

export function getActiveTenantId(): string {
  if (typeof window !== 'undefined' && window.localStorage) {
    const t = localStorage.getItem('saurient_tenant_id');
    if (t) return t;
  }
  return DEFAULT_TENANT_ID;
}

export async function getOrgUsers(tenantId?: string) {
  const tid = tenantId || getActiveTenantId();
  const res = await fetch(`${API_BASE_URL}/organisation/users`, {
    headers: { 'X-Tenant-ID': tid },
  });
  if (!res.ok) throw new Error(`HTTP error ${res.status}`);
  return await res.json();
}

export async function saveOrgUser(user: any, tenantId?: string) {
  const tid = tenantId || getActiveTenantId();
  const res = await fetch(`${API_BASE_URL}/organisation/users`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Tenant-ID': tid,
    },
    body: JSON.stringify(user),
  });
  if (!res.ok) throw new Error(`HTTP error ${res.status}`);
  return await res.json();
}

export async function updateOrgUserRole(userId: string, role: string, tenantId?: string) {
  const tid = tenantId || getActiveTenantId();
  const res = await fetch(`${API_BASE_URL}/organisation/users/role`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'X-Tenant-ID': tid,
    },
    body: JSON.stringify({ userId, newRole: role, user_id: userId, role }),
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
  if (!res.ok) {
    const errBody = await res.json().catch(() => ({}));
    throw new Error(errBody.error || `Passport not found for the ID: ${passportId}`);
  }
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

