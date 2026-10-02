import type {
  PcfProject, ProjectRow, ActivityRecord, LogisticsLeg, AllocationData,
  BoundaryStage, BoundaryExclusion, CalculationVersion, ReadinessCheck
} from '../types/pcf';

export const PROJECT: PcfProject = {
  id: 'PCF-GH-2026-001',
  organisation: 'Asante Cocoa Cooperative',
  facility: 'Tema Processing Plant',
  country: 'Ghana',
  reportingPeriod: 'FY 2026',
  product: 'Refined Cocoa Butter',
  productCode: 'CCB-001',
  productCategory: 'Cocoa Products',
  batch: 'CB-2026-001',
  productionQuantity: 100000,
  declaredUnit: '1 kg Refined Cocoa Butter',
  packagingUnit: '25 kg carton',
  productGrade: 'Refined Food Grade',
  boundary: 'Cradle-to-Gate',
  destinationMarket: 'European Union',
  productionDate: '12 March 2026',
  hsCode: '1804.00',
  customer: '—',
  methodology: 'GHG Protocol Product Standard (ISO 14067)',
  gwpBasis: 'IPCC AR6 (GWP100)',
  efDataset: 'ecoinvent v3.10 + IPCC',
  datasetVersion: 'v3.10',
  engineVersion: 'Saurient CalcEngine 4.2',
  dataQuality: 92,
  verification: 'Ready',
  status: 'Calculated',
};

export const PROJECT_KPIS = {
  total: 12,
  draft: 3,
  calcReady: 2,
  awaitingVerification: 2,
  verified: 5,
};

export const PROJECT_ROWS: ProjectRow[] = [
  {
    id: 'PCF-GH-2026-001',
    product: 'Refined Cocoa Butter',
    batch: 'CB-2026-001',
    facility: 'Tema Processing Plant',
    productionQuantity: 100000,
    boundary: 'Cradle-to-Gate',
    intensity: '2.84',
    dataQuality: 92,
    status: 'Calculated',
    verification: 'Ready',
    primary: true,
  },
  {
    id: 'PCF-GH-2026-002',
    product: 'Natural Cocoa Powder',
    batch: 'CP-2026-004',
    facility: 'Tema Processing Plant',
    productionQuantity: 120000,
    boundary: 'Cradle-to-Gate',
    intensity: '1.92',
    dataQuality: 90,
    status: 'Calculation Ready',
    verification: 'Pending',
  },
  {
    id: 'PCF-GH-2026-003',
    product: 'Cocoa Liquor',
    batch: 'CL-2026-002',
    facility: 'Kumasi Facility',
    productionQuantity: 80000,
    boundary: 'Cradle-to-Gate',
    intensity: '2.41',
    dataQuality: 87,
    status: 'Draft',
    verification: '—',
  },
  {
    id: 'PCF-GH-2025-014',
    product: 'Refined Cocoa Butter',
    batch: 'CB-2025-031',
    facility: 'Tema Processing Plant',
    productionQuantity: 95000,
    boundary: 'Cradle-to-Gate',
    intensity: '2.91',
    dataQuality: 93,
    status: 'Verified',
    verification: 'Verified',
  },
  {
    id: 'PCF-GH-2025-011',
    product: 'Cocoa Cake',
    batch: 'CK-2025-020',
    facility: 'Kumasi Facility',
    productionQuantity: 140000,
    boundary: 'Cradle-to-Gate',
    intensity: '1.68',
    dataQuality: 89,
    status: 'Awaiting Verification',
    verification: 'Submitted',
  },
];

export const ACTIVITIES: ActivityRecord[] = [
  {
    id: 'ACT-001', stage: 'Energy', category: 'Energy', activity: 'Grid Electricity',
    quantity: 125400, unit: 'kWh', scope: 'Scope 2', process: 'Utilities',
    source: 'PAS800', sourceSystem: 'PAS800', ef: '0.359 kgCO2e/kWh', efValue: 0.359,
    factorVersion: 'Ghana Grid 2026', co2e: 45000, evidence: true, quality: 97, status: 'Validated',
    facility: 'Tema Processing Plant', equipment: 'Main incomer', meter: 'MTR-EL-01',
    timestamp: '2026-03-12 09:20', supplier: 'ECG Ghana', createdBy: 'system.pas800',
    lastUpdated: '2026-03-31', provenance: ['PAS800', 'API Gateway', 'Raw Reading', 'Validated Reading', 'Inventory Record'],
  },
  {
    id: 'ACT-002', stage: 'Fuel', category: 'Fuel', activity: 'Diesel / Boiler Fuel',
    quantity: 32700, unit: 'L', scope: 'Scope 1', process: 'Boiler',
    source: 'MANUAL', sourceSystem: 'Fuel Meter', ef: '0.612 kgCO2e/L', efValue: 0.612,
    factorVersion: 'IPCC AR6', co2e: 20000, evidence: true, quality: 95, status: 'Validated',
    facility: 'Tema Processing Plant', equipment: 'Steam boiler B-2', meter: 'MTR-FL-03',
    timestamp: '2026-03-12 10:00', supplier: 'GOIL', createdBy: 'j.mensah',
    lastUpdated: '2026-03-30', provenance: ['Fuel Meter', 'Raw Reading', 'Validated Reading', 'Inventory Record'],
  },
  {
    id: 'ACT-003', stage: 'Raw Materials', category: 'Raw Materials', activity: 'Raw Cocoa Beans',
    quantity: 130000, unit: 'kg', scope: 'Scope 3', process: 'Receiving',
    source: 'SUPPLIER', sourceSystem: 'Supplier Declaration', ef: '1.269 kgCO2e/kg', efValue: 1.269,
    factorVersion: 'ecoinvent v3.10', co2e: 165000, evidence: true, quality: 88, status: 'Validated',
    facility: 'Tema Processing Plant', equipment: '—', meter: '—',
    timestamp: '2026-03-05', supplier: 'Asante Farmer Groups', createdBy: 'supplier.portal',
    lastUpdated: '2026-03-28', provenance: ['Supplier Declaration', 'Evidence', 'Validation', 'Inventory Record'],
  },
  {
    id: 'ACT-004', stage: 'Packaging', category: 'Packaging', activity: 'Packaging Material',
    quantity: 4000, unit: 'kg', scope: 'Scope 3', process: 'Packaging',
    source: 'ERP', sourceSystem: 'ERP', ef: '3.00 kgCO2e/kg', efValue: 3.0,
    factorVersion: 'ecoinvent v3.10', co2e: 12000, evidence: true, quality: 90, status: 'Validated',
    facility: 'Tema Processing Plant', equipment: 'Carton line', meter: '—',
    timestamp: '2026-03-18', supplier: 'Tema Packaging Ltd', createdBy: 'erp.sync',
    lastUpdated: '2026-03-29', provenance: ['ERP', 'Validation', 'Inventory Record'],
  },
  {
    id: 'ACT-005', stage: 'Process Emissions', category: 'Process Emissions', activity: 'Refrigerant Leakage',
    quantity: 8, unit: 'kg', scope: 'Scope 1', process: 'Refrigeration',
    source: 'MANUAL', sourceSystem: 'Manual Entry', ef: '500 kgCO2e/kg (GWP)', efValue: 500,
    factorVersion: 'IPCC AR6 GWP100', co2e: 4000, evidence: true, quality: 85, status: 'Validated',
    facility: 'Tema Processing Plant', equipment: 'Chiller CH-1', meter: '—',
    timestamp: '2026-03-20', supplier: '—', createdBy: 'k.owusu',
    lastUpdated: '2026-03-30', provenance: ['Manual Entry', 'Validation', 'Inventory Record'],
  },
  {
    id: 'ACT-006', stage: 'Waste', category: 'Waste', activity: 'Waste Treatment',
    quantity: 15000, unit: 'kg', scope: 'Scope 3', process: 'Waste',
    source: 'ERP', sourceSystem: 'ERP', ef: '0.533 kgCO2e/kg', efValue: 0.533,
    factorVersion: 'ecoinvent v3.10', co2e: 8000, evidence: true, quality: 84, status: 'Validated',
    facility: 'Tema Processing Plant', equipment: '—', meter: '—',
    timestamp: '2026-03-25', supplier: 'Zoomlion', createdBy: 'erp.sync',
    lastUpdated: '2026-03-30', provenance: ['ERP', 'Validation', 'Inventory Record'],
  },
];

export const LOGISTICS_LEGS: LogisticsLeg[] = [
  {
    id: 'LEG-01', tab: 'Inbound', from: 'Cocoa Farm', to: 'Collection Hub', material: 'Raw Cocoa',
    weightT: 130, distanceKm: 75, mode: 'Truck', vehicle: 'Rigid HGV (Diesel)', fuel: 'Diesel',
    basis: 'Tonne-km', tonneKm: 9750, ef: '0.769 kgCO2e/t·km', co2e: 7500, boundary: 'In',
    evidence: true, loadFactor: '80%', returnTrip: 'Empty return incl.', tempControlled: 'No',
    carrier: 'Asante Logistics', distanceSource: 'GPS actual',
  },
  {
    id: 'LEG-02', tab: 'Inbound', from: 'Collection Hub', to: 'Tema Processing Plant', material: 'Raw Cocoa',
    weightT: 130, distanceKm: 210, mode: 'Truck', vehicle: 'Articulated HGV (Diesel)', fuel: 'Diesel',
    basis: 'Tonne-km', tonneKm: 27300, ef: '0.714 kgCO2e/t·km', co2e: 19500, boundary: 'In',
    evidence: true, loadFactor: '90%', returnTrip: 'Empty return incl.', tempControlled: 'No',
    carrier: 'Asante Logistics', distanceSource: 'GPS actual',
  },
  {
    id: 'LEG-03', tab: 'Inbound', from: 'Tema Packaging Ltd', to: 'Tema Processing Plant', material: 'Packaging',
    weightT: 4, distanceKm: 45, mode: 'Truck', vehicle: 'Light truck (Diesel)', fuel: 'Diesel',
    basis: 'Tonne-km', tonneKm: 180, ef: '16.67 kgCO2e/t·km', co2e: 3000, boundary: 'In',
    evidence: true, loadFactor: '35%', returnTrip: 'N/A', tempControlled: 'No',
    carrier: 'Tema Packaging Ltd', distanceSource: 'Map estimate',
  },
  {
    id: 'LEG-04', tab: 'Internal', from: 'Warehouse A', to: 'Processing Line 01', material: 'Raw Cocoa',
    weightT: 130, distanceKm: 1.2, mode: 'Forklift', vehicle: 'Electric forklift', fuel: 'Electric',
    basis: 'Vehicle-km', tonneKm: 156, ef: 'negligible', co2e: 0, boundary: 'In',
    evidence: true, loadFactor: '—', returnTrip: '—', tempControlled: 'No',
    carrier: 'Internal', distanceSource: 'Site layout',
  },
  {
    id: 'LEG-05', tab: 'Outbound', from: 'Tema Processing Plant', to: 'Port of Rotterdam', material: 'Cocoa Butter',
    weightT: 100, distanceKm: 6200, mode: 'Container Ship', vehicle: 'Reefer container', fuel: 'HFO',
    basis: 'Tonne-km', tonneKm: 620000, ef: '0.014 kgCO2e/t·km', co2e: 8680, boundary: 'Out',
    evidence: true, loadFactor: '95%', returnTrip: 'N/A', tempControlled: 'Yes',
    carrier: 'Maersk', distanceSource: 'Sea route',
  },
];

export const ALLOCATION: AllocationData = {
  sharedProcess: 'Cocoa Processing Line 01',
  totalSharedKg: 155250,
  residualKg: 0,
  products: [
    { name: 'Cocoa Butter', qty: 100000, isTarget: true },
    { name: 'Cocoa Cake / Powder', qty: 120000 },
    { name: 'Other By-products', qty: 5000 },
  ],
  justification: {
    reason: 'Refining line produces butter, cake and fines from a single mass flow; physical mass reflects processing effort.',
    dataset: 'Plant mass balance FY2026',
    evidence: 'MB-2026-Q1.xlsx',
    approvedBy: 'A. Boateng (Sustainability Lead)',
    version: 'v1.0',
  },
};

export const BOUNDARY_STAGES: BoundaryStage[] = [
  { stage: 'Raw Cocoa Beans', included: true, scope: 'Scope 3', reason: 'Primary raw material', materiality: 'High', evidence: true },
  { stage: 'Supplier Processing', included: true, scope: 'Scope 3', reason: 'Upstream fermentation & drying', materiality: 'High', evidence: true },
  { stage: 'Inbound Transport', included: true, scope: 'Scope 3', reason: 'Farm to gate haulage', materiality: 'Medium', evidence: true },
  { stage: 'Purchased Electricity', included: true, scope: 'Scope 2', reason: 'Grid power for processing', materiality: 'High', evidence: true },
  { stage: 'Diesel / Boiler Fuel', included: true, scope: 'Scope 1', reason: 'On-site steam generation', materiality: 'Medium', evidence: true },
  { stage: 'Process Emissions', included: true, scope: 'Scope 1', reason: 'Refrigerant leakage', materiality: 'Low', evidence: true },
  { stage: 'Packaging', included: true, scope: 'Scope 3', reason: 'Cartons & liners', materiality: 'Medium', evidence: true },
  { stage: 'Waste Treatment', included: true, scope: 'Scope 3', reason: 'Process waste disposal', materiality: 'Low', evidence: true },
  { stage: 'Distribution after Factory Gate', included: false, scope: '—', reason: 'Outside selected boundary', materiality: 'Excluded', evidence: false },
  { stage: 'Consumer Use', included: false, scope: '—', reason: 'Outside Cradle-to-Gate', materiality: 'Excluded', evidence: false },
  { stage: 'End of Life', included: false, scope: '—', reason: 'Outside Cradle-to-Gate', materiality: 'Excluded', evidence: false },
];

export const LIFECYCLE_FLOW = [
  { key: 'raw', label: 'Raw Materials', inCTG: true },
  { key: 'supplier', label: 'Supplier Processing', inCTG: true },
  { key: 'inbound', label: 'Inbound Logistics', inCTG: true },
  { key: 'mfg', label: 'Manufacturing', inCTG: true },
  { key: 'energy', label: 'Energy', inCTG: true },
  { key: 'pack', label: 'Packaging', inCTG: true },
  { key: 'gate', label: 'Factory Gate', inCTG: true },
];

export const EXCLUSIONS: BoundaryExclusion[] = [
  { activity: 'Distribution after Factory Gate', reason: 'Outside Cradle-to-Gate boundary', materiality: '~3% (est.)', justification: 'Downstream logistics assessed separately in Passport transport module', approvedBy: 'A. Boateng', date: '2026-03-22' },
  { activity: 'Consumer Use', reason: 'Not applicable to Cradle-to-Gate', materiality: 'N/A', justification: 'Ingredient product; no use-phase energy', approvedBy: 'A. Boateng', date: '2026-03-22' },
  { activity: 'End of Life', reason: 'Not applicable to Cradle-to-Gate', materiality: 'N/A', justification: 'Assessed in downstream product PCF', approvedBy: 'A. Boateng', date: '2026-03-22' },
];

export const DATA_QUALITY = {
  overall: 92,
  breakdown: [
    { label: 'Primary Data Coverage', score: 95 },
    { label: 'Evidence Coverage', score: 94 },
    { label: 'Temporal Relevance', score: 90 },
    { label: 'Geographical Relevance', score: 91 },
    { label: 'Technological Relevance', score: 93 },
    { label: 'Supplier Data Quality', score: 88 },
    { label: 'Meter Data Quality', score: 97 },
  ],
  detractors: [
    { record: 'Raw Cocoa Beans (ACT-003)', reason: 'Supplier-declared secondary data', impact: '-4' },
    { record: 'Waste Treatment (ACT-006)', reason: 'Proxy emission factor', impact: '-3' },
    { record: 'Refrigerant Leakage (ACT-005)', reason: 'Estimated leakage rate', impact: '-1' },
  ],
};

export const VALIDATION_ISSUES = [
  { type: 'Missing Evidence', record: 'ACT-007 (Steam)', severity: 'Warning', detail: 'No supporting document attached' },
  { type: 'Meter Gap', record: 'MTR-EL-01', severity: 'Info', detail: '4h gap on 2026-03-14, interpolated' },
  { type: 'Missing Record', record: 'Water treatment', severity: 'Warning', detail: '3 expected records not received' },
];

export const EMISSION_FACTORS = [
  { name: 'Ghana Grid Electricity', value: '0.359 kgCO2e/kWh', source: 'IEA / Ghana Grid', version: '2026', scope: 'Scope 2' },
  { name: 'Diesel combustion', value: '0.612 kgCO2e/L', source: 'IPCC AR6', version: 'AR6', scope: 'Scope 1' },
  { name: 'Cocoa beans (farm)', value: '1.269 kgCO2e/kg', source: 'ecoinvent', version: 'v3.10', scope: 'Scope 3' },
  { name: 'Carton packaging', value: '3.00 kgCO2e/kg', source: 'ecoinvent', version: 'v3.10', scope: 'Scope 3' },
  { name: 'Refrigerant R-404A', value: '500 GWP100', source: 'IPCC AR6', version: 'AR6', scope: 'Scope 1' },
  { name: 'Road freight (HGV)', value: '0.71 kgCO2e/t·km', source: 'GLEC Framework', version: 'v3', scope: 'Scope 3' },
];

export const BASELINE_VERSION: CalculationVersion = {
  version: 'V1.0',
  totalKg: 284000,
  calculatedAt: '2026-03-31 14:20',
  calculatedBy: 'A. Boateng',
  note: 'Initial batch calculation',
};

export const READINESS_CHECKS: ReadinessCheck[] = [
  { label: 'Output Definition complete', ok: true },
  { label: 'Boundary approved', ok: true },
  { label: 'Inventory complete', ok: true },
  { label: 'No critical data errors', ok: true },
  { label: 'Allocation validated', ok: true },
  { label: 'Logistics complete', ok: true },
  { label: 'Emission factors assigned', ok: true },
  { label: 'Calculation complete', ok: true },
  { label: 'Data quality threshold satisfied (≥85)', ok: true },
  { label: 'Evidence attached', ok: true },
  { label: 'Report generated', ok: true },
];

export const CHART_COLORS = ['#178047', '#1f9d55', '#4bb87c', '#0e7490', '#15304d', '#c77700', '#8aa1b4'];
export const SCOPE_COLORS: Record<string, string> = {
  'Scope 1': '#c77700',
  'Scope 2': '#0e7490',
  'Scope 3': '#178047'
};

export const PROCESS_EMISSIONS = [
  { process: 'Receiving', kg: 6000 },
  { process: 'Roasting', kg: 18000 },
  { process: 'Grinding', kg: 12000 },
  { process: 'Pressing', kg: 21000 },
  { process: 'Refining', kg: 20000 },
  { process: 'Packaging', kg: 12000 },
];
