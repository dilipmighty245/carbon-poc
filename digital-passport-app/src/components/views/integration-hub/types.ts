export interface DataSource {
  id: string;
  name: string;
  type: string;
  mode: 'Simulated' | 'Manual' | 'Live';
  lastImport: string;
  health: 'Healthy' | 'Needs evidence' | 'Warning' | 'Error';
  owner?: string;
  facility: string;
  recordsCount?: number;
}

export interface MappingField {
  sourceField: string;
  example: string;
  destination: string;
  treatment: string;
  status: 'Mapped' | 'Unmapped' | 'Pending';
}

export interface MappingRevision {
  id: string;
  source: string;
  version: string;
  recordType: string;
  updatedAt: string;
  fields: MappingField[];
}

export interface SyncConfig {
  source: string;
  schedule: 'Manual only' | 'Hourly' | 'Daily';
  timezone: string;
  fromDate: string;
  toDate: string;
  duplicateRule: string;
  paused: boolean;
  lastRun?: string;
}

export interface SyncRun {
  id: string;
  coverage: string;
  state: 'Completed' | 'Retry completed' | 'Running' | 'Failed';
  accepted: number;
  rejected: number;
  timestamp: string;
}

export interface ImportJob {
  id: string;
  source: string;
  mapping: string;
  state: 'Completed' | 'With errors' | 'Failed validation' | 'Queued' | 'Running';
  received: number;
  accepted: number;
  rejected: number;
  timestamp: string;
  errors?: { row: number; field: string; error: string }[];
}

export interface DataException {
  id: string;
  record: string;
  severity: 'Blocking' | 'Warning';
  reason: string;
  status: 'Open' | 'Resolved' | 'In Review';
  detectedTime: string;
  details?: string;
}

export interface CorrectionHistoryItem {
  id: string;
  issueId: string;
  recordId: string;
  action: string;
  correctedValue: string;
  timestamp: string;
  note: string;
}

export interface TelemetryReading {
  device: string;
  process: string;
  parameter: string;
  value: string;
  unit: string;
  observedUtc: string;
  quality: 'Accepted' | 'Gap' | 'Warning';
  evidenceRef: string;
}

export interface ActivityDraft {
  facility: string;
  productBatch: string;
  activityType: 'Electricity' | 'Fuel' | 'Material input' | 'Transport';
  quantity: number | '';
  unit: string;
  observationDate: string;
  process: string;
  evidenceRef: string;
  sourceDescription: string;
  candidateScope: 'Scope 1' | 'Scope 2' | 'Scope 3';
}

export interface ParsedCsvRow {
  rowNum: number;
  record_id: string;
  facility_id: string;
  batch_id: string;
  activity_type: string;
  quantity: string;
  unit: string;
  evidence_ref: string;
  status: 'Accepted' | 'Rejected';
  errors: string[];
}
