export interface PcfProject {
  id: string;
  organisation: string;
  facility: string;
  country: string;
  reportingPeriod: string;
  product: string;
  productCode: string;
  productCategory: string;
  batch: string;
  productionQuantity: number;
  declaredUnit: string;
  packagingUnit: string;
  productGrade: string;
  boundary: string;
  destinationMarket: string;
  productionDate: string;
  hsCode: string;
  customer: string;
  methodology: string;
  gwpBasis: string;
  efDataset: string;
  datasetVersion: string;
  engineVersion: string;
  dataQuality: number;
  verification: string;
  status: string;
}

export interface ProjectRow {
  id: string;
  product: string;
  batch: string;
  facility: string;
  productionQuantity: number;
  boundary: string;
  intensity: string;
  dataQuality: number;
  status: string;
  verification: string;
  primary?: boolean;
}

export interface ActivityRecord {
  id: string;
  stage: string;
  category: string;
  activity: string;
  quantity: number;
  unit: string;
  scope: string;
  process: string;
  source: string;
  sourceSystem: string;
  ef: string;
  efValue: number;
  factorVersion: string;
  co2e: number;
  evidence: boolean;
  quality: number;
  status: string;
  facility: string;
  equipment: string;
  meter: string;
  timestamp: string;
  supplier: string;
  createdBy: string;
  lastUpdated: string;
  provenance: string[];
}

export interface LogisticsLeg {
  id: string;
  tab: string;
  from: string;
  to: string;
  material: string;
  weightT: number;
  distanceKm: number;
  mode: string;
  vehicle: string;
  fuel: string;
  basis: string;
  tonneKm: number;
  ef: string;
  co2e: number;
  boundary: string;
  evidence: boolean;
  loadFactor: string;
  returnTrip: string;
  tempControlled: string;
  carrier: string;
  distanceSource: string;
}

export interface AllocationProduct {
  name: string;
  qty: number;
  isTarget?: boolean;
}

export interface AllocationData {
  sharedProcess: string;
  totalSharedKg: number;
  residualKg: number;
  products: AllocationProduct[];
  justification: {
    reason: string;
    dataset: string;
    evidence: string;
    approvedBy: string;
    version: string;
  };
}

export interface BoundaryStage {
  stage: string;
  included: boolean;
  scope: string;
  reason: string;
  materiality: string;
  evidence: boolean;
}

export interface BoundaryExclusion {
  activity: string;
  reason: string;
  materiality: string;
  justification: string;
  approvedBy: string;
  date: string;
}

export interface CalculationVersion {
  version: string;
  totalKg: number;
  calculatedAt: string;
  calculatedBy: string;
  note: string;
}

export interface ReadinessCheck {
  label: string;
  ok: boolean;
}

export interface Scenario {
  id: string;
  label: string;
  target: string;
  reductionPct: number;
  savedKg: number;
  newTotalKg: number;
  newIntensity: number;
}
