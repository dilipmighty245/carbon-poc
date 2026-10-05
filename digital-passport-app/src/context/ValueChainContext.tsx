import React, { createContext, useContext, useMemo, useState, useCallback, ReactNode } from 'react';
import type {
  Supplier,
  Invitation,
  Declaration,
  EvidenceItem,
  CatalogueItem,
  ImprovementRequest,
  CustomerRequest,
  CustomerProduct,
  CustomerPackage,
  AuditLogEntry,
  InternalMaterial,
  VCOrg,
  VCAggregateMetrics,
} from '../types/valueChain';
import {
  ORG,
  INTERNAL_MATERIALS,
  SUPPLIERS,
  CONTACTS,
  INVITATIONS,
  DECLARATIONS,
  EVIDENCE,
  CATALOGUE,
  IMPROVEMENTS,
  CUSTOMER_REQUESTS,
  CUSTOMER_CATALOGUE,
  CUSTOMER_PACKAGES,
  AGG,
  AUDIT_SEED,
  WORKFLOW_STAGES,
} from '../data/valueChainMockData';

let seq = 100;
const nextId = (prefix: string) => `${prefix}-${++seq}`;

export interface Scope3Row {
  id: string;
  name: string;
  material: string;
  materialCode: string;
  emissions: number;
  dataClass: string;
  score: number;
  pcfIntensity: number;
  contribution?: number;
}

export interface Scope3ByMaterialRow {
  code: string;
  name: string;
  emissions: number;
}

export interface ImpactAnalysisResult {
  supplier?: string;
  changeType: string;
  materials: string[];
  boms: string[];
  products: string[];
  batches: string[];
  pcfProjects: string[];
  passports: string[];
  recalcRequired: boolean;
  reverifyRequired: boolean;
}

export interface ChangeEvent extends ImpactAnalysisResult {
  id: string;
  supplierId: string;
  ts: string;
  status: string;
}

export interface VCContextType {
  ORG: VCOrg;
  WORKFLOW_STAGES: string[];
  INTERNAL_MATERIALS: InternalMaterial[];
  CONTACTS: Record<string, { name: string; role: string; email: string }[]>;
  AGG: VCAggregateMetrics;
  suppliers: Supplier[];
  invitations: Invitation[];
  declarations: Declaration[];
  evidence: EvidenceItem[];
  catalogue: CatalogueItem[];
  improvements: ImprovementRequest[];
  customerRequests: CustomerRequest[];
  customerCatalogue: CustomerProduct[];
  packages: CustomerPackage[];
  changeEvents: ChangeEvent[];
  audit: AuditLogEntry[];
  supplierById: (id: string) => Supplier | undefined;
  supplierName: (id: string) => string;
  scope3: { rows: Scope3Row[]; total: number };
  scope3ContributionFor: (id: string) => number;
  scope3ByMaterial: Scope3ByMaterialRow[];
  metrics: {
    primaryDataCoverage: number;
    scope3SupplierSpecific: number;
    proxyDependency: number;
    evidenceCoverage: number;
    supplierPcfCoverage: number;
    avgDataQuality: number;
    declarationsExpiring: number;
    openCustomerRequests: number;
  };
  addSupplier: (s: Partial<Supplier>) => Supplier;
  addInvitation: (inv: Partial<Invitation>) => Invitation;
  updateInvitationStatus: (id: string, status: Invitation['status']) => void;
  reviewDeclaration: (id: string, action: 'accept' | 'correct' | 'reject' | 'clarify') => void;
  reviewEvidence: (id: string, action: 'accept' | 'reject' | 'replace') => void;
  mapCatalogue: (id: string, internalMaterial: string) => void;
  addCatalogueProduct: (c: Partial<CatalogueItem>) => CatalogueItem;
  addImprovement: (imp: Partial<ImprovementRequest>) => ImprovementRequest;
  respondCustomerRequest: (id: string, status: CustomerRequest['status']) => void;
  generatePackage: (pkg: Partial<CustomerPackage>) => CustomerPackage;
  runImpactAnalysis: (supplierId: string, changeType: string) => ChangeEvent;
  dependenciesFor: (supplierId: string) => {
    catalogue: CatalogueItem[];
    materials: string[];
    products: string[];
    pcfProjects: string[];
    passports: string[];
  };
  logAudit: (object: string, objectId: string, prev: string, next: string, reason: string, user?: string, role?: string) => void;
}

const ValueChainContext = createContext<VCContextType | null>(null);

export const useVC = (): VCContextType => {
  const ctx = useContext(ValueChainContext);
  if (!ctx) {
    throw new Error('useVC must be used within a ValueChainProvider');
  }
  return ctx;
};

export const ValueChainProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [suppliers, setSuppliers] = useState<Supplier[]>(SUPPLIERS);
  const [invitations, setInvitations] = useState<Invitation[]>(INVITATIONS);
  const [declarations, setDeclarations] = useState<Declaration[]>(DECLARATIONS);
  const [evidence, setEvidence] = useState<EvidenceItem[]>(EVIDENCE);
  const [catalogue, setCatalogue] = useState<CatalogueItem[]>(CATALOGUE);
  const [improvements, setImprovements] = useState<ImprovementRequest[]>(IMPROVEMENTS);
  const [customerRequests, setCustomerRequests] = useState<CustomerRequest[]>(CUSTOMER_REQUESTS);
  const [customerCatalogue] = useState<CustomerProduct[]>(CUSTOMER_CATALOGUE);
  const [packages, setPackages] = useState<CustomerPackage[]>(CUSTOMER_PACKAGES);
  const [changeEvents, setChangeEvents] = useState<ChangeEvent[]>([]);
  const [audit, setAudit] = useState<AuditLogEntry[]>(AUDIT_SEED);

  const logAudit = useCallback((object: string, objectId: string, prev: string, next: string, reason: string, user = 'A. Boateng', role = 'Org Admin') => {
    setAudit((a) => [
      { id: nextId('AUD'), object, objectId, user, role, prev, next, reason, ts: new Date().toISOString() },
      ...a,
    ]);
  }, []);

  const supplierById = useCallback((id: string) => suppliers.find((s) => s.id === id), [suppliers]);
  const supplierName = useCallback((id: string) => supplierById(id)?.name || id, [supplierById]);

  // Derived Scope 3 emissions
  const scope3 = useMemo(() => {
    const rows: Scope3Row[] = suppliers.map((s) => {
      const kg = s.volume > 1 ? s.volume : 1;
      const emissions = Math.round(kg * s.pcfIntensity);
      return {
        id: s.id,
        name: s.name,
        material: s.material,
        materialCode: s.materialCode,
        emissions,
        dataClass: s.dataClass,
        score: s.score,
        pcfIntensity: s.pcfIntensity,
      };
    });
    const total = rows.reduce((a, r) => a + r.emissions, 0);
    rows.forEach((r) => {
      r.contribution = total ? (r.emissions / total) * 100 : 0;
    });
    return { rows, total };
  }, [suppliers]);

  const scope3ContributionFor = useCallback(
    (id: string) => scope3.rows.find((r) => r.id === id)?.contribution ?? 0,
    [scope3]
  );

  const scope3ByMaterial = useMemo(() => {
    const map: Record<string, Scope3ByMaterialRow> = {};
    scope3.rows.forEach((r) => {
      map[r.materialCode] = map[r.materialCode] || {
        code: r.materialCode,
        name: INTERNAL_MATERIALS.find((m) => m.code === r.materialCode)?.name || r.materialCode,
        emissions: 0,
      };
      map[r.materialCode].emissions += r.emissions;
    });
    return Object.values(map).sort((a, b) => b.emissions - a.emissions);
  }, [scope3]);

  // Derived module metrics
  const metrics = useMemo(() => {
    const primaryClasses = ['PRIMARY_VERIFIED', 'PRIMARY_DECLARED'];
    const primaryCat = catalogue.filter((c) => primaryClasses.includes(c.dataClass));
    const proxyCat = catalogue.filter((c) => c.dataClass === 'PROXY' || c.dataClass === 'SECONDARY');
    const withEvidence = suppliers.filter((s) => s.evidenceComplete >= 70).length;
    const avgQuality = Math.round(suppliers.reduce((a, s) => a + s.score, 0) / suppliers.length);
    const withPcf = catalogue.filter((c) => c.pcf).length;

    return {
      primaryDataCoverage: Math.round((primaryCat.length / catalogue.length) * 100),
      scope3SupplierSpecific: Math.round((primaryCat.length / catalogue.length) * 100),
      proxyDependency: Math.round((proxyCat.length / catalogue.length) * 100),
      evidenceCoverage: Math.round((withEvidence / suppliers.length) * 100),
      supplierPcfCoverage: Math.round((withPcf / catalogue.length) * 100),
      avgDataQuality: avgQuality,
      declarationsExpiring: AGG.declarationsExpiring,
      openCustomerRequests: customerRequests.filter((r) => r.status !== 'COMPLETED').length,
    };
  }, [catalogue, suppliers, customerRequests]);

  // Actions
  const addSupplier = useCallback((s: Partial<Supplier>) => {
    const id = `SUP-GH-${String(Math.floor(Math.random() * 900) + 100)}`;
    const rec: Supplier = {
      id,
      name: s.name || 'New Supplier',
      legalName: s.legalName || s.name || 'New Supplier Ltd',
      tradingName: s.tradingName || s.name || 'New Supplier',
      country: s.country || 'Ghana',
      tier: s.tier || 'Tier 1',
      reg: s.reg || 'GH-RC-000000',
      address: s.address || 'Accra, Ghana',
      contact: s.contact || 'Main Contact',
      email: s.email || 'contact@supplier.gh',
      industry: s.industry || 'Manufacturing',
      facility: s.facility || 'Main Facility',
      material: s.material || 'Raw Materials',
      materialCode: s.materialCode || 'MAT-COCOA-001',
      volume: s.volume || 10000,
      primaryData: false,
      pcfAvailable: false,
      verification: 'ESTIMATED',
      dataClass: 'PROXY',
      score: 55,
      pcfIntensity: s.pcfIntensity || 2.0,
      status: 'ONBOARDING',
      lastUpdate: new Date().toISOString().split('T')[0],
      workflow: 'SUPPLIER',
      declarations: 0,
      evidenceComplete: 0,
      yoyChange: 0,
      scores: { primaryData: 20, evidence: 10, pcfAvailability: 0, verification: 0, freshness: 90, methodology: 40, timeliness: 80, traceability: 30 },
      ...s,
    };
    setSuppliers((p) => [rec, ...p]);
    logAudit('Supplier', id, '—', 'CREATED', 'New supplier added');
    return rec;
  }, [logAudit]);

  const addInvitation = useCallback((inv: Partial<Invitation>) => {
    const id = nextId('INV');
    const rec: Invitation = {
      id,
      supplierId: inv.supplierId || 'SUP-GH-001',
      contact: inv.contact || 'Kwame Osei',
      material: inv.material || 'Raw Cocoa Beans',
      requested: inv.requested || ['Product PCF', 'Declaration'],
      sent: new Date().toISOString().split('T')[0],
      due: inv.due || '2026-04-30',
      opened: false,
      progress: 0,
      status: 'SENT',
      ...inv,
    };
    setInvitations((p) => [rec, ...p]);
    logAudit('Invitation', id, 'DRAFT', 'SENT', `Invited ${supplierName(rec.supplierId)}`);
    return rec;
  }, [logAudit, supplierName]);

  const updateInvitationStatus = useCallback((id: string, status: Invitation['status']) => {
    setInvitations((p) =>
      p.map((i) =>
        i.id === id
          ? {
              ...i,
              status,
              progress: status === 'SUBMITTED' || status === 'ACCEPTED' ? 100 : i.progress,
            }
          : i
      )
    );
    logAudit('Invitation', id, '—', status, 'Status change');
  }, [logAudit]);

  const reviewDeclaration = useCallback((id: string, action: 'accept' | 'correct' | 'reject' | 'clarify') => {
    const map: Record<string, Declaration['status']> = {
      accept: 'ACCEPTED',
      correct: 'CORRECTION REQUIRED',
      reject: 'REJECTED',
      clarify: 'UNDER REVIEW',
    };
    const status = map[action] || 'UNDER REVIEW';
    setDeclarations((p) => p.map((d) => (d.id === id ? { ...d, status } : d)));
    logAudit('Declaration', id, 'UNDER REVIEW', status, `Review: ${action}`);
  }, [logAudit]);

  const reviewEvidence = useCallback((id: string, action: 'accept' | 'reject' | 'replace') => {
    const map: Record<string, EvidenceItem['status']> = {
      accept: 'ACCEPTED',
      reject: 'REJECTED',
      replace: 'UNDER REVIEW',
    };
    const status = map[action] || 'UNDER REVIEW';
    setEvidence((p) =>
      p.map((e) =>
        e.id === id
          ? { ...e, status, version: action === 'replace' ? e.version + 1 : e.version }
          : e
      )
    );
    logAudit('Evidence', id, '—', status, `Evidence ${action}`);
  }, [logAudit]);

  const mapCatalogue = useCallback((id: string, internalMaterial: string) => {
    setCatalogue((p) =>
      p.map((c) => (c.id === id ? { ...c, mapped: true, internalMaterial, status: 'ACTIVE' } : c))
    );
    logAudit('Catalogue', id, 'UNMAPPED', 'MAPPED', `Mapped to ${internalMaterial}`);
  }, [logAudit]);

  const addCatalogueProduct = useCallback((c: Partial<CatalogueItem>) => {
    const id = nextId('CAT');
    const rec: CatalogueItem = {
      id,
      supplierId: c.supplierId || 'SUP-GH-001',
      product: c.product || 'New Product',
      code: c.code || 'PRD-000',
      internalMaterial: c.internalMaterial || 'MAT-COCOA-001',
      unit: c.unit || 'kg',
      pcf: c.pcf || 2.0,
      boundary: c.boundary || 'Cradle-to-Gate',
      dataClass: c.dataClass || 'PROXY',
      verification: c.verification || 'Not verified',
      validFrom: c.validFrom || '2026-01-01',
      validUntil: c.validUntil || '2026-12-31',
      status: 'ACTION REQUIRED',
      pcfVersion: 'v1.0',
      mapped: false,
      bomComponent: 'Input Component',
      qtyUsed: 1000,
      unitConversion: '1:1',
      mappingConfidence: 'Medium',
      pcfSource: 'Supplier PCF',
      ...c,
    };
    setCatalogue((p) => [rec, ...p]);
    logAudit('Catalogue', id, '—', 'CREATED', 'Catalogue product added');
    return rec;
  }, [logAudit]);

  const addImprovement = useCallback((imp: Partial<ImprovementRequest>) => {
    const id = nextId('IMP');
    const rec: ImprovementRequest = {
      id,
      supplierId: imp.supplierId || 'SUP-GH-001',
      issue: imp.issue || 'Data quality enhancement required',
      action: imp.action || 'Provide primary evidence',
      priority: imp.priority || 'High',
      due: imp.due || '2026-04-30',
      owner: imp.owner || 'Carbon Manager',
      expectedGain: imp.expectedGain || '+15 quality',
      status: 'SENT',
      ...imp,
    };
    setImprovements((p) => [rec, ...p]);
    logAudit('Improvement', id, '—', 'CREATED', `Improvement request for ${supplierName(rec.supplierId)}`);
    return rec;
  }, [logAudit, supplierName]);

  const respondCustomerRequest = useCallback((id: string, status: CustomerRequest['status']) => {
    setCustomerRequests((p) => p.map((r) => (r.id === id ? { ...r, status } : r)));
    logAudit('CustomerRequest', id, '—', status, 'Customer request response');
  }, [logAudit]);

  const generatePackage = useCallback((pkg: Partial<CustomerPackage>) => {
    const id = nextId('PKG');
    const rec: CustomerPackage = {
      id,
      customer: pkg.customer || 'Customer',
      product: pkg.product || ORG.product,
      batch: pkg.batch || ORG.batch,
      generated: new Date().toISOString().split('T')[0],
      by: 'Carbon Manager',
      docs: pkg.docs || ['Verified PCF', 'Carbon Passport'],
      sharing: pkg.sharing || 'CUSTOMER',
      expiry: '2026-09-01',
      access: 0,
      ...pkg,
    };
    setPackages((p) => [rec, ...p]);
    logAudit('CustomerPackage', id, '—', 'GENERATED', `Package for ${pkg.customer}`);
    return rec;
  }, [logAudit]);

  // Supplier data change impact engine
  const runImpactAnalysis = useCallback((supplierId: string, changeType: string) => {
    const s = supplierById(supplierId);
    const cats = catalogue.filter((c) => c.supplierId === supplierId);
    const materials = [...new Set(cats.map((c) => c.internalMaterial))];
    const affectedMaterials = INTERNAL_MATERIALS.filter((m) => materials.includes(m.code));
    const affectsProduct = affectedMaterials.length > 0;

    const result: ImpactAnalysisResult = {
      supplier: s?.name,
      changeType,
      materials: affectedMaterials.map((m) => m.code),
      boms: affectsProduct ? [ORG.product] : [],
      products: affectsProduct ? [ORG.product] : [],
      batches: affectsProduct ? [ORG.batch] : [],
      pcfProjects: affectsProduct ? [ORG.pcfProject] : [],
      passports: affectsProduct ? ['CP-GH-2026-0001'] : [],
      recalcRequired: affectsProduct,
      reverifyRequired: affectsProduct && s?.verification === 'VERIFIED',
    };

    const ev: ChangeEvent = {
      id: nextId('CHG'),
      supplierId,
      ts: new Date().toISOString(),
      status: 'RECALCULATION REQUIRED',
      ...result,
    };

    setChangeEvents((p) => [ev, ...p]);
    logAudit('ChangeEvent', ev.id, '—', 'IMPACT ANALYSIS', `Supplier ${s?.name} changed ${changeType}`);
    logAudit('PCF', ORG.pcfProject, 'VERIFIED', 'RECALCULATION REQUIRED', 'Supplier data change impact');
    return ev;
  }, [supplierById, catalogue, logAudit]);

  const dependenciesFor = useCallback((supplierId: string) => {
    const cats = catalogue.filter((c) => c.supplierId === supplierId);
    return {
      catalogue: cats,
      materials: [...new Set(cats.map((c) => c.internalMaterial))],
      products: cats.length ? [ORG.product] : [],
      pcfProjects: cats.length ? [ORG.pcfProject] : [],
      passports: cats.length ? ['CP-GH-2026-0001'] : [],
    };
  }, [catalogue]);

  const value: VCContextType = {
    ORG,
    WORKFLOW_STAGES,
    INTERNAL_MATERIALS,
    CONTACTS,
    AGG,
    suppliers,
    invitations,
    declarations,
    evidence,
    catalogue,
    improvements,
    customerRequests,
    customerCatalogue,
    packages,
    changeEvents,
    audit,
    supplierById,
    supplierName,
    scope3,
    scope3ContributionFor,
    scope3ByMaterial,
    metrics,
    addSupplier,
    addInvitation,
    updateInvitationStatus,
    reviewDeclaration,
    reviewEvidence,
    mapCatalogue,
    addCatalogueProduct,
    addImprovement,
    respondCustomerRequest,
    generatePackage,
    runImpactAnalysis,
    dependenciesFor,
    logAudit,
  };

  return <ValueChainContext.Provider value={value}>{children}</ValueChainContext.Provider>;
};
