import type { ProductCreateRequest, ProductCreateResponse, RichDigitalPassport, RulebookCreateRequest } from '../types';

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
