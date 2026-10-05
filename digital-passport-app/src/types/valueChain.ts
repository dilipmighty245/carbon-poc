export type DataClass = 'PRIMARY_VERIFIED' | 'PRIMARY_DECLARED' | 'SECONDARY' | 'PROXY';

export type VerificationStatus = 'VERIFIED' | 'SUBMITTED' | 'ESTIMATED' | 'NOT VERIFIED';

export type SupplierStatus = 'ACTIVE' | 'ACTION REQUIRED' | 'INACTIVE' | 'ONBOARDING';

export type WorkflowStage =
  | 'SUPPLIER'
  | 'INVITED'
  | 'CONNECTED'
  | 'DECLARATION'
  | 'EVIDENCE'
  | 'REVIEW'
  | 'PCF APPROVED'
  | 'CATALOGUE'
  | 'MATERIAL MAPPED'
  | 'PCF CONNECTED'
  | 'UNDER REVIEW'
  | 'DATA REQUESTED';

export interface SupplierScores {
  primaryData: number;
  evidence: number;
  pcfAvailability: number;
  verification: number;
  freshness: number;
  methodology: number;
  timeliness: number;
  traceability: number;
}

export interface Supplier {
  id: string;
  name: string;
  legalName: string;
  tradingName: string;
  country: string;
  tier: string;
  reg: string;
  address: string;
  contact: string;
  email: string;
  industry: string;
  facility: string;
  material: string;
  materialCode: string;
  volume: number;
  primaryData: boolean;
  pcfAvailable: boolean;
  verification: VerificationStatus;
  dataClass: DataClass;
  score: number;
  pcfIntensity: number;
  status: SupplierStatus;
  lastUpdate: string;
  workflow: WorkflowStage | string;
  declarations: number;
  evidenceComplete: number;
  yoyChange: number;
  scores: SupplierScores;
}

export interface Contact {
  name: string;
  role: string;
  email: string;
}

export interface Invitation {
  id: string;
  supplierId: string;
  contact: string;
  material: string;
  requested: string[];
  sent: string;
  due: string;
  opened: boolean;
  progress: number;
  status: 'ACCEPTED' | 'SUBMITTED' | 'IN PROGRESS' | 'OPENED' | 'SENT' | 'EXPIRED';
}

export interface Declaration {
  id: string;
  supplierId: string;
  facility: string;
  product: string;
  productCode: string;
  period: string;
  quantity: number;
  unit: string;
  declaredUnit: string;
  pcf: number;
  boundary: string;
  dataClass: DataClass;
  evidence: string;
  verification: string;
  verifierRef: string;
  methodology: string;
  gwp: string;
  efDataset: string;
  calcVersion: string;
  quality: number;
  evidenceCount: number;
  declarationDate: string;
  declarant: string;
  status: 'UNDER REVIEW' | 'ACCEPTED' | 'CORRECTION REQUIRED' | 'REJECTED';
}

export interface EvidenceItem {
  id: string;
  supplierId: string;
  product: string;
  category: string;
  declaration: string;
  period: string;
  source: string;
  uploadedBy: string;
  uploadedDate: string;
  hash: string;
  version: number;
  status: 'ACCEPTED' | 'UNDER REVIEW' | 'MISSING' | 'REJECTED';
  title: string;
  file: string;
}

export interface CatalogueItem {
  id: string;
  supplierId: string;
  product: string;
  code: string;
  internalMaterial: string;
  unit: string;
  pcf: number;
  boundary: string;
  dataClass: DataClass;
  verification: string;
  validFrom: string;
  validUntil: string;
  status: 'ACTIVE' | 'ACTION REQUIRED' | 'DEPRECATED';
  pcfVersion: string;
  mapped: boolean;
  bomComponent: string;
  qtyUsed: number;
  unitConversion: string;
  mappingConfidence: 'High' | 'Medium' | 'Low';
  pcfSource: string;
}

export interface InternalMaterial {
  code: string;
  name: string;
  qty: number;
  unit: string;
  bomComponent: string;
}

export interface ImprovementRequest {
  id: string;
  supplierId: string;
  issue: string;
  action: string;
  priority: 'High' | 'Medium' | 'Low';
  due: string;
  owner: string;
  expectedGain: string;
  status: 'IN PROGRESS' | 'SENT' | 'COMPLETED' | 'CANCELLED';
}

export interface CustomerRequest {
  id: string;
  customer: string;
  contact: string;
  country: string;
  product: string;
  batch: string;
  quantity: number;
  market: string;
  requested: string[];
  purpose: string;
  requestedDate: string;
  due: string;
  sharing: 'CUSTOMER' | 'PUBLIC' | 'CONFIDENTIAL';
  owner: string;
  status: 'READY TO SHARE' | 'UNDER REVIEW' | 'OVERDUE' | 'COMPLETED';
  notes: string;
}

export interface CustomerProduct {
  id: string;
  product: string;
  code: string;
  facility: string;
  batch: string;
  pcf: number;
  boundary: string;
  verification: 'VERIFIED' | 'SUBMITTED' | 'ESTIMATED';
  passport: string;
  passportId: string;
  cbam: string;
  sharing: 'CUSTOMER' | 'PUBLIC' | 'CONFIDENTIAL';
  status: string;
  pcfProject: string;
  production: number;
  calcVersion: string;
  methodology: string;
  verifierRef: string;
  issueDate: string;
  validity: string;
}

export interface CustomerPackage {
  id: string;
  customer: string;
  product: string;
  batch: string;
  generated: string;
  by: string;
  docs: string[];
  sharing: 'CUSTOMER' | 'PUBLIC' | 'CONFIDENTIAL';
  expiry: string;
  access: number;
}

export interface AuditLogEntry {
  id: string;
  object: string;
  objectId: string;
  user: string;
  role: string;
  prev: string;
  next: string;
  ts: string;
  reason: string;
}

export interface VCOrg {
  organisation: string;
  facility: string;
  country: string;
  reportingPeriod: string;
  product: string;
  productCode: string;
  batch: string;
  production: number;
  pcfProject: string;
  currentPCF: number;
  boundary: string;
}

export interface VCAggregateMetrics {
  activeSuppliers: number;
  primaryDataEnabled: number;
  verifiedPCFs: number;
  incompleteRecords: number;
  responseRate: number;
  responseDelta: number;
  supplierCoverage: number;
  invitationsSent: number;
  invitationsAccepted: number;
  invitationsPending: number;
  invitationsExpired: number;
  declarationsTotal: number;
  declarationsAccepted: number;
  declarationsUnderReview: number;
  declarationsCorrection: number;
  evidenceItems: number;
  evidenceAccepted: number;
  evidenceUnderReview: number;
  evidenceRejected: number;
  supplierProducts: number;
  catPcfAvailable: number;
  catVerifiedPcf: number;
  catProxy: number;
  avgScore: number;
  highQuality: number;
  actionRequired: number;
  criticalGaps: number;
  customerProducts: number;
  customerVerified: number;
  activePassports: number;
  cbamReady: number;
  declarationsExpiring: number;
}
