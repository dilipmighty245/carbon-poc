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
  return await res.json();
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

