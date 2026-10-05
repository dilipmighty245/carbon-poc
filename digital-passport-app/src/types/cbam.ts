export type CBAMStatusCode =
  | 'OUT_OF_SCOPE'
  | 'APPLICABLE'
  | 'DATA_PENDING'
  | 'CALCULATING'
  | 'INTERNAL_REVIEW'
  | 'READY_FOR_VERIFICATION'
  | 'VERIFICATION_IN_PROGRESS'
  | 'CORRECTION_REQUIRED'
  | 'VERIFIED'
  | 'READY_FOR_HANDOVER'
  | 'HANDED_OVER';

export interface CBAMStatusInfo {
  code: CBAMStatusCode;
  label: string;
  badgeClass: string;
  description: string;
}

export const CBAM_STATUS_MAP: Record<CBAMStatusCode, CBAMStatusInfo> = {
  OUT_OF_SCOPE: {
    code: 'OUT_OF_SCOPE',
    label: 'Outside CBAM Scope',
    badgeClass: 'bg-slate-100 text-slate-700 border-slate-200',
    description: 'CN code not in the active Annex I rule set or exemption applies.',
  },
  APPLICABLE: {
    code: 'APPLICABLE',
    label: 'CBAM Applicable',
    badgeClass: 'bg-sky-50 text-sky-700 border-sky-200',
    description: 'CN code and trade context match active rules.',
  },
  DATA_PENDING: {
    code: 'DATA_PENDING',
    label: 'Data Collection Pending',
    badgeClass: 'bg-amber-50 text-amber-800 border-amber-200',
    description: 'Required activity data or evidence items missing.',
  },
  CALCULATING: {
    code: 'CALCULATING',
    label: 'Calculation in Progress',
    badgeClass: 'bg-blue-50 text-blue-700 border-blue-200',
    description: 'Valid activity data exists; calculation running.',
  },
  INTERNAL_REVIEW: {
    code: 'INTERNAL_REVIEW',
    label: 'Internal Review Required',
    badgeClass: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    description: 'Calculation produced warnings or pending approvals.',
  },
  READY_FOR_VERIFICATION: {
    code: 'READY_FOR_VERIFICATION',
    label: 'Ready for Verification',
    badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    description: 'All validation gates passed and dataset is frozen.',
  },
  VERIFICATION_IN_PROGRESS: {
    code: 'VERIFICATION_IN_PROGRESS',
    label: 'Verification in Progress',
    badgeClass: 'bg-purple-50 text-purple-700 border-purple-200',
    description: 'Accredited verifier engagement is active.',
  },
  CORRECTION_REQUIRED: {
    code: 'CORRECTION_REQUIRED',
    label: 'Correction Required',
    badgeClass: 'bg-rose-50 text-rose-700 border-rose-200',
    description: 'Verifier raised misstatement or missing evidence.',
  },
  VERIFIED: {
    code: 'VERIFIED',
    label: 'Verified',
    badgeClass: 'bg-emerald-100 text-emerald-900 border-emerald-300 font-bold',
    description: 'Accepted verifier report linked to frozen dataset.',
  },
  READY_FOR_HANDOVER: {
    code: 'READY_FOR_HANDOVER',
    label: 'Ready for Importer Handover',
    badgeClass: 'bg-[#15342A] text-[#00E599] border-emerald-500/40',
    description: 'Verified package and recipient permissions complete.',
  },
  HANDED_OVER: {
    code: 'HANDED_OVER',
    label: 'Handover Completed',
    badgeClass: 'bg-slate-900 text-white border-slate-700',
    description: 'Package delivered to declarant/importer.',
  },
};

export type CBAMSubTab =
  | 'Overview'
  | 'Applicability'
  | 'CN Classification'
  | 'Installations'
  | 'Monitoring Plans'
  | 'Processes'
  | 'Calculations'
  | 'Declarants'
  | 'Exposure'
  | 'Cost'
  | 'Data Pack'
  | 'Registry Transfer';

export interface CBAMChecklistRule {
  ruleId: string;
  ruleVersion: string;
  sector: 'Universal' | 'Steel' | 'Aluminium' | 'Cement' | 'Fertilisers' | 'Hydrogen' | 'Electricity';
  title: string;
  description: string;
  outcome: 'PASS' | 'WARN' | 'FAIL' | 'NA';
  severity: 'BLOCKER' | 'WARNING' | 'INFO';
  requiredEvidenceTypes: string[];
  ownerRole: string;
  message?: string;
  resolved?: boolean;
}

export interface PrecursorRecord {
  id: string;
  name: string;
  cnCode: string;
  quantityTonnes: number;
  originInstallation: string;
  country: string;
  method: 'ACTUAL' | 'DEFAULT';
  embeddedEmissionsIntensity: number; // tCO2e / tonne
  verificationReportId?: string;
  isVerified: boolean;
}

export interface CalculationLineItem {
  id: string;
  category: 'Direct Fuel' | 'Process Emissions' | 'Indirect Electricity' | 'Precursor';
  sourceName: string;
  activityValue: number;
  activityUnit: string;
  emissionFactor: number;
  factorUnit: string;
  factorSource: string;
  formula: string;
  emissionstCO2e: number;
  evidenceRef: string;
  status: 'VALIDATED' | 'WARNING' | 'MISSING';
}

export interface CBAMProductData {
  id: string;
  name: string;
  sku: string;
  cnCode: string;
  sector: string;
  isSimpleGood: boolean;
  functionalUnit: string;
  annualVolumeTonnes: number;
  reportingYear: number;
  countryOfOrigin: string;
  countryOfProduction: string;
  installationName: string;
  installationOperator: string;
  status: CBAMStatusCode;
  directEmissionsIntensity: number;
  indirectEmissionsIntensity: number;
  precursorEmissionsIntensity: number;
  totalSpecificEmissions: number; // tCO2e per tonne
  estimatedExposureEUR: number;
  verifiedSharePct: number;
  precursors: PrecursorRecord[];
  rules: CBAMChecklistRule[];
  calculationLines: CalculationLineItem[];
  datasetFrozen: boolean;
  freezeManifestHash?: string;
  freezeTimestamp?: string;
  verifierReportId?: string;
  verifierOpinion?: 'UNMODIFIED' | 'MODIFIED' | 'ADVERSE' | 'DISCLAIMER';
}

export interface FreezeManifest {
  freezeId: string;
  datasetHash: string;
  calculationHash: string;
  evidenceManifestHash: string;
  signer: string;
  timestamp: string;
  productIds: string[];
  rulesEvaluatedCount: number;
}
