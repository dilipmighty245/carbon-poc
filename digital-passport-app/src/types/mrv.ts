export interface EngagementMeta {
  organisation: string;
  facility: string;
  country: string;
  reportingPeriod: string;
  product: string;
  productCode: string;
  batch: string;
  pcfProject: string;
  submittedVersion: string;
  productionQuantity: string;
  productionQuantityKg: number;
  boundary: string;
  claimedTotal: number;
  claimedIntensity: number;
  dataQuality: number;
  engagementId: string;
  evidenceItems: number;
  acceptedEvidence: number;
  readiness: number;
  activityRecords: number;
  verifierOrg: string;
  leadVerifier: string;
  technicalReviewer: string;
}

export interface ReadinessCheckItem {
  req: string;
  source: string;
  status: 'PASSED' | 'WARNING' | 'PENDING' | 'FAILED';
  issue?: string;
  link?: string | null;
}

export interface EvidenceItem {
  id: string;
  title: string;
  desc: string;
  category: string;
  activity: string;
  calc: string;
  source: string;
  sourceSystem: string;
  period: string;
  uploadedBy: string;
  uploadedAt: string;
  hash: string;
  version: string;
  status: 'ACCEPTED' | 'PENDING' | 'REJECTED' | 'QUERY';
  reviewer: string;
  reviewDate: string;
  comment: string;
  provenance: string[];
}

export interface CalculationLineItem {
  id: string;
  category: string;
  scope: string;
  activity: string;
  qty: number;
  unit: string;
  ef: string;
  efSource: string;
  allocation: string;
  co2e: number;
  evidence: string;
  status: 'ACCEPTED' | 'QUERY' | 'PENDING' | 'REJECTED';
  comment: string;
}

export interface CheckEngineItem {
  name: string;
  status: 'PASS' | 'FAIL' | 'WARN';
  detail?: string;
}

export interface VerifierOrgItem {
  org: string;
  country: string;
  scope: string;
  ref: string;
  validity: string;
  personnel: number;
  engagements: number;
  status: string;
  address: string;
  website: string;
  contact: string;
  sector: string;
  body: string;
  cert: string;
  from: string;
  until: string;
  certDoc: string;
}

export interface VerifierTeamMember {
  name: string;
  role: string;
  qual: string;
  sector: string;
  engagements: number;
  independence: 'CONFIRMED' | 'PENDING' | 'FLAGGED';
}

export interface RiskAssessmentItem {
  area: string;
  inherent: 'HIGH' | 'MEDIUM' | 'LOW';
  control: 'HIGH' | 'MEDIUM' | 'LOW';
  impact: 'HIGH' | 'MEDIUM' | 'LOW';
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  procedure: string;
}

export interface SamplingPlanItem {
  pop: string;
  size: string;
  selection: string;
  reason: string;
  evidence: string;
  verifier: string;
}

export interface PlanScheduleTask {
  task: string;
  owner: string;
  start: string;
  due: string;
  status: 'COMPLETE' | 'IN PROGRESS' | 'PLANNED';
}

export interface SiteObservationItem {
  id: string;
  area: string;
  desc: string;
  activity: string;
  evidence: string;
  verifier: string;
  severity: 'INFO' | 'MEDIUM' | 'HIGH';
  followUp: 'Yes' | 'No';
}

export interface FindingItem {
  id: string;
  classification: string;
  area: string;
  desc: string;
  activity: string;
  calc: string;
  impact: string;
  owner: string;
  due: string;
  status: 'OPEN' | 'IN_REVIEW' | 'CLOSED' | 'RESOLVED';
  createdBy: string;
  createdAt: string;
  requirement: string;
  materiality: string;
  comment: string;
  response: string;
  correction: string;
  attachments: string[];
}

export interface CorrectionItem {
  id: string;
  finding: string;
  record: string;
  origQty: number;
  origUnit: string;
  origEf: string;
  origEfVersion: string;
  origCo2e: number;
  evidence: string;
  newQty: number;
  newUnit: string;
  newEf: string;
  newEvidence: string;
  reason: string;
  submittedBy: string;
  pcfImpact: number;
  status: 'SUBMITTED' | 'APPROVED' | 'REJECTED' | 'UNDER_REVIEW';
}

export interface AuditLogItem {
  id: string;
  objectType: string;
  objectId: string;
  user: string;
  role: string;
  org: string;
  action: string;
  prev: string;
  next: string;
  ts: string;
  comment: string;
  evidence: string;
  finding: string;
  calcVersion: string;
}
