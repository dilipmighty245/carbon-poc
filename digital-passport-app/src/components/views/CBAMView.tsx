import React, { useState } from 'react';
import { Download, Search, AlertTriangle, ShieldCheck } from 'lucide-react';
import type { CBAMSubTab, CBAMProductData } from '../../types/cbam';
import { BlockerDrawer } from './cbam/BlockerDrawer';
import { CBAMOverview } from './cbam/CBAMOverview';
import { ApplicabilityWizard } from './cbam/ApplicabilityWizard';
import { CNClassificationView } from './cbam/CNClassificationView';
import { InstallationsView } from './cbam/InstallationsView';
import { MonitoringPlansView } from './cbam/MonitoringPlansView';
import { ProcessesPrecursorsView } from './cbam/ProcessesPrecursorsView';
import { CalculationsTraceView } from './cbam/CalculationsTraceView';
import { DeclarantsView } from './cbam/DeclarantsView';
import { ExposureView } from './cbam/ExposureView';
import { CostAnalysisView } from './cbam/CostAnalysisView';
import { DataPackGeneratorView } from './cbam/DataPackGeneratorView';
import { RegistryTransferView } from './cbam/RegistryTransferView';

export const CBAMView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<CBAMSubTab>('Overview');
  const [isBlockerDrawerOpen, setIsBlockerDrawerOpen] = useState(false);

  // Initial Seeded Demo Products
  const initialProducts: CBAMProductData[] = [
    {
      id: 'prod-steel-00981',
      name: 'Hot-Rolled Steel Coil (ST-2026-00981)',
      sku: 'SKU-ST-7208',
      cnCode: '7208 39 00',
      sector: 'Iron & Steel',
      isSimpleGood: false,
      functionalUnit: 'Tonne of steel product',
      annualVolumeTonnes: 10000,
      reportingYear: 2026,
      countryOfOrigin: 'India',
      countryOfProduction: 'India',
      installationName: 'Hyderabad Manufacturing Facility',
      installationOperator: 'Saurient Demo Steel Industries Ltd',
      status: 'CALCULATED',
      directEmissionsIntensity: 0.420,
      indirectEmissionsIntensity: 0.358,
      precursorEmissionsIntensity: 0.855,
      totalSpecificEmissions: 1.633,
      estimatedExposureEUR: 1339060,
      verifiedSharePct: 100,
      precursors: [
        {
          id: 'prec-st-001',
          name: 'Direct Reduced Iron (DRI)',
          cnCode: '7203 10 00',
          quantityTonnes: 11000,
          originInstallation: 'Saurient Odisha DRI Facility',
          country: 'India',
          method: 'ACTUAL',
          embeddedEmissionsIntensity: 0.777,
          isVerified: true,
        },
      ],
      rules: [
        { ruleId: 'APP-001', ruleVersion: 'EU-CBAM-2026.1', sector: 'Iron & Steel', title: '8-Digit CN Classification (7208 39 00)', description: 'Valid Annex I CN code present', outcome: 'PASS', severity: 'BLOCKER', requiredEvidenceTypes: ['CUSTOMS_ENTRY'], ownerRole: 'TRADE_COMPLIANCE' },
        { ruleId: 'APP-003', ruleVersion: 'EU-CBAM-2026.1', sector: 'Iron & Steel', title: 'Country of Origin Specified (India)', description: 'Valid non-EU origin recorded', outcome: 'PASS', severity: 'BLOCKER', requiredEvidenceTypes: ['ORIGIN_CERT'], ownerRole: 'TRADE_COMPLIANCE' },
        { ruleId: 'THR-001', ruleVersion: 'EU-CBAM-2026.1', sector: 'Iron & Steel', title: '50-Tonne Annual Mass Threshold', description: 'Imports exceed 50 t threshold limit', outcome: 'PASS', severity: 'BLOCKER', requiredEvidenceTypes: ['CUSTOMS_MANIFEST'], ownerRole: 'TRADE_COMPLIANCE' },
        { ruleId: 'INS-001', ruleVersion: 'EU-CBAM-2026.1', sector: 'Iron & Steel', title: 'Installation & Operator Identity', description: 'Saurient Demo Steel Industries Ltd permit registered', outcome: 'PASS', severity: 'BLOCKER', requiredEvidenceTypes: ['PERMIT'], ownerRole: 'PLANT_OPERATOR' },
        { ruleId: 'MON-001', ruleVersion: 'EU-CBAM-2026.1', sector: 'Iron & Steel', title: 'Approved Monitoring Plan', description: 'Monitoring plan approved for FY 2026', outcome: 'PASS', severity: 'BLOCKER', requiredEvidenceTypes: ['MONITORING_PLAN'], ownerRole: 'SUSTAINABILITY_MANAGER' },
        { ruleId: 'VER-001', ruleVersion: 'EU-CBAM-2026.1', sector: 'Iron & Steel', title: 'Verified Carbon Passport Statement', description: '100% verified primary data statement', outcome: 'PASS', severity: 'BLOCKER', requiredEvidenceTypes: ['VERIFICATION_STATEMENT'], ownerRole: 'VERIFIER' },
      ],
      calculationLines: [
        { id: 'cl-st-1', category: 'Direct Fuel', sourceName: 'Reheating Furnace Natural Gas', activityValue: 2000, activityUnit: 'm³', emissionFactor: 2.10, factorUnit: 'kgCO₂e/m³', formula: 'Activity x Factor', emissionstCO2e: 4.20, evidenceRef: 'MTR-GAS-02', status: 'VALIDATED' },
        { id: 'cl-st-2', category: 'Indirect Electricity', sourceName: 'EAF & Mill Schneider PAS800 Power', activityValue: 5000, activityUnit: 'kWh', emissionFactor: 0.716, factorUnit: 'kgCO₂e/kWh', formula: 'Activity x Factor', emissionstCO2e: 3.58, evidenceRef: 'MTR-PAS800-EL01', status: 'VALIDATED' },
        { id: 'cl-st-3', category: 'Precursor', sourceName: 'Direct Reduced Iron (DRI)', activityValue: 11000, activityUnit: 'kg', emissionFactor: 0.777, factorUnit: 'kgCO₂e/kg', formula: 'Attributed Precursor Intensity', emissionstCO2e: 8.55, evidenceRef: 'EVD-DRI-IND-01', status: 'VALIDATED' },
      ],
      datasetFrozen: true,
    },
    {
      id: 'prod-steel-001',
      name: 'Steel Process Frames',
      sku: 'SKU-ST-7308',
      cnCode: '7308 90',
      sector: 'Iron & Steel',
      isSimpleGood: false,
      functionalUnit: 'Tonne of steel product',
      annualVolumeTonnes: 1820,
      reportingYear: 2026,
      countryOfOrigin: 'Ghana',
      countryOfProduction: 'Ghana',
      installationName: 'Tema Processing Plant',
      installationOperator: 'Saurient Demo Manufacturing Ltd.',
      status: 'DATA_PENDING',
      directEmissionsIntensity: 0.642,
      indirectEmissionsIntensity: 0.421,
      precursorEmissionsIntensity: 1.102,
      totalSpecificEmissions: 2.165,
      estimatedExposureEUR: 126800,
      verifiedSharePct: 72,
      precursors: [
        {
          id: 'prec-001',
          name: 'Iron Ore Pellets',
          cnCode: '2601 12 00',
          quantityTonnes: 1450,
          originInstallation: 'Monrovia Ore Prep Plant',
          country: 'Liberia',
          method: 'ACTUAL',
          embeddedEmissionsIntensity: 1.102,
          isVerified: false, // Blocker trigger!
        },
      ],
      rules: [
        { ruleId: 'APP-001', ruleVersion: 'EU-CBAM-2026.1', sector: 'Universal', title: '8-Digit CN Classification', description: 'Valid Annex I CN code present', outcome: 'PASS', severity: 'BLOCKER', requiredEvidenceTypes: ['CUSTOMS_ENTRY'], ownerRole: 'TRADE_COMPLIANCE' },
        { ruleId: 'APP-003', ruleVersion: 'EU-CBAM-2026.1', sector: 'Universal', title: 'Country of Origin Specified', description: 'Valid non-EU origin recorded', outcome: 'PASS', severity: 'BLOCKER', requiredEvidenceTypes: ['ORIGIN_CERT'], ownerRole: 'TRADE_COMPLIANCE' },
        { ruleId: 'THR-001', ruleVersion: 'EU-CBAM-2026.1', sector: 'Universal', title: '50-Tonne Annual Mass Threshold', description: 'Imports exceed 50 t threshold limit', outcome: 'PASS', severity: 'BLOCKER', requiredEvidenceTypes: ['CUSTOMS_MANIFEST'], ownerRole: 'TRADE_COMPLIANCE' },
        { ruleId: 'INS-001', ruleVersion: 'EU-CBAM-2026.1', sector: 'Universal', title: 'Installation & Operator Identity', description: 'Valid operator registration & coordinates', outcome: 'PASS', severity: 'BLOCKER', requiredEvidenceTypes: ['PERMIT'], ownerRole: 'PLANT_OPERATOR' },
        { ruleId: 'MON-001', ruleVersion: 'EU-CBAM-2026.1', sector: 'Universal', title: 'Approved Monitoring Plan', description: 'Monitoring methodology approved for FY 2026', outcome: 'PASS', severity: 'BLOCKER', requiredEvidenceTypes: ['MONITORING_PLAN'], ownerRole: 'SUSTAINABILITY_MANAGER' },
        { ruleId: 'CAL-001', ruleVersion: 'EU-CBAM-2026.1', sector: 'Universal', title: 'Direct Emissions Reconciled', description: 'Direct process fuel emissions verified', outcome: 'PASS', severity: 'BLOCKER', requiredEvidenceTypes: ['FUEL_INVOICE'], ownerRole: 'SUSTAINABILITY_MANAGER' },
        { ruleId: 'PRE-001', ruleVersion: 'EU-CBAM-2026.1', sector: 'Universal', title: 'Precursor Verification Report Missing', description: 'Iron ore pellets actual emissions require verifier report', outcome: 'FAIL', severity: 'BLOCKER', requiredEvidenceTypes: ['PRECURSOR_VERIFICATION_REPORT'], ownerRole: 'SUSTAINABILITY_MANAGER', message: 'Precursor report missing for Iron Ore Pellets' },
      ],
      calculationLines: [
        { id: 'cl-1', category: 'Direct Fuel', sourceName: 'Natural Gas Reheating', activityValue: 12400, activityUnit: 'GJ', emissionFactor: 0.0561, factorUnit: 'tCO₂/GJ', formula: 'Activity x Factor', emissionstCO2e: 695.6, evidenceRef: 'MTR-TEMA-G04', status: 'VALIDATED' },
        { id: 'cl-2', category: 'Direct Fuel', sourceName: 'Anode Carbon Consumption', activityValue: 142, activityUnit: 't', emissionFactor: 3.32, factorUnit: 'tCO₂/t', formula: 'Activity x Factor', emissionstCO2e: 471.4, evidenceRef: 'ERP-BATCH-882', status: 'VALIDATED' },
        { id: 'cl-3', category: 'Indirect Electricity', sourceName: 'EAF Smelter Power', activityValue: 1820, activityUnit: 'MWh', emissionFactor: 0.421, factorUnit: 'tCO₂/MWh', formula: 'Activity x Factor', emissionstCO2e: 766.2, evidenceRef: 'MTR-TEMA-E01', status: 'VALIDATED' },
        { id: 'cl-4', category: 'Precursor', sourceName: 'Iron Ore Pellets', activityValue: 1450, activityUnit: 't', emissionFactor: 1.102, factorUnit: 'tCO₂/t', formula: 'Attributed Precursor Intensity', emissionstCO2e: 1597.9, evidenceRef: 'EVD-PRE-LIB-01', status: 'WARNING' },
      ],
      datasetFrozen: false,
    },
    {
      id: 'prod-cocoa-002',
      name: 'Refined Cocoa Butter',
      sku: 'SKU-CB-1804',
      cnCode: '1804 00',
      sector: 'Foodstuff',
      isSimpleGood: true,
      functionalUnit: 'kg of cocoa butter',
      annualVolumeTonnes: 450,
      reportingYear: 2026,
      countryOfOrigin: 'Ghana',
      countryOfProduction: 'Ghana',
      installationName: 'Tema Processing Plant',
      installationOperator: 'Saurient Demo Manufacturing Ltd.',
      status: 'OUT_OF_SCOPE',
      directEmissionsIntensity: 0.42,
      indirectEmissionsIntensity: 0.18,
      precursorEmissionsIntensity: 2.24,
      totalSpecificEmissions: 2.84,
      estimatedExposureEUR: 0,
      verifiedSharePct: 100,
      precursors: [],
      rules: [
        { ruleId: 'APP-002', ruleVersion: 'EU-CBAM-2026.1', sector: 'Universal', title: 'Annex I Catalogue Check', description: 'Foodstuff / Cocoa Butter is not listed in Regulation (EU) 2023/956 Annex I', outcome: 'NA', severity: 'INFO', requiredEvidenceTypes: [], ownerRole: 'TRADE_COMPLIANCE' },
      ],
      calculationLines: [
        { id: 'cl-cb-1', category: 'Direct Fuel', sourceName: 'Boiler Steam', activityValue: 3200, activityUnit: 'GJ', emissionFactor: 0.0561, factorUnit: 'tCO₂/GJ', formula: 'Activity x Factor', emissionstCO2e: 179.5, evidenceRef: 'MTR-STEAM-01', status: 'VALIDATED' },
      ],
      datasetFrozen: true,
      freezeManifestHash: 'sha256:8f4e9102b37194628ab83719027c819230198401829370129371029370192837',
      freezeTimestamp: '2026-09-26T14:30:00Z',
    },
  ];

  const [products, setProducts] = useState<CBAMProductData[]>(initialProducts);
  const [selectedProductId, setSelectedProductId] = useState<string>('prod-steel-001');

  const selectedProduct = products.find((p) => p.id === setSelectedProductId ? selectedProductId : p.id) || products[0];

  const handleSelectProduct = (p: CBAMProductData) => {
    setSelectedProductId(p.id);
  };

  // Interactive Blocker Resolution Handler
  const handleResolveRule = (ruleId: string) => {
    setProducts((prev) =>
      prev.map((p) => {
        if (p.id !== selectedProductId) return p;

        const updatedRules = p.rules.map((r) =>
          r.ruleId === ruleId
            ? { ...r, outcome: 'PASS' as const, severity: 'INFO' as const, message: undefined, resolved: true }
            : r
        );

        const updatedPrecursors = p.precursors.map((prec) =>
          prec.id === 'prec-001'
            ? { ...prec, isVerified: true, verificationReportId: 'VR-PREC-2026-0091', embeddedEmissionsIntensity: 0.779 }
            : prec
        );

        const updatedLines = p.calculationLines.map((line) =>
          line.id === 'cl-4'
            ? { ...line, emissionFactor: 0.779, emissionstCO2e: 1129.5, status: 'VALIDATED' as const }
            : line
        );

        // Recalculate emissions intensity
        const newPrecursorIntensity = 0.779;
        const newTotal = p.directEmissionsIntensity + p.indirectEmissionsIntensity + newPrecursorIntensity;

        return {
          ...p,
          status: 'READY_FOR_VERIFICATION' as const,
          precursorEmissionsIntensity: newPrecursorIntensity,
          totalSpecificEmissions: newTotal,
          rules: updatedRules,
          precursors: updatedPrecursors,
          calculationLines: updatedLines,
          verifiedSharePct: 94,
        };
      })
    );
  };

  // Interactive Dataset Freeze Handler
  const handleFreezeDataset = () => {
    setProducts((prev) =>
      prev.map((p) => {
        if (p.id !== selectedProductId) return p;
        return {
          ...p,
          status: 'READY_FOR_HANDOVER' as const,
          datasetFrozen: true,
          freezeManifestHash: 'sha256:e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
          freezeTimestamp: new Date().toISOString(),
          verifierReportId: 'VR-2026-TEMA-8841',
          verifierOpinion: 'UNMODIFIED' as const,
        };
      })
    );
  };

  const tabs: CBAMSubTab[] = [
    'Overview',
    'Applicability',
    'CN Classification',
    'Installations',
    'Monitoring Plans',
    'Processes',
    'Calculations',
    'Declarants',
    'Exposure',
    'Cost',
    'Data Pack',
    'Registry Transfer',
  ];

  return (
    <div className="space-y-6 font-sans">
      {/* Top Header Row with Breadcrumb & Filters */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
          <span className="hover:text-slate-800">CBAM</span>
          <span>/</span>
          <span className="text-slate-900 font-bold">{activeTab}</span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="bg-white border border-slate-200 rounded-lg px-3 py-1 text-xs font-medium text-slate-700 shadow-xs flex items-center gap-1.5">
            <span>{selectedProduct.installationName}</span>
            <span className="text-slate-400 text-[10px]">▾</span>
          </div>
          <div className="bg-white border border-slate-200 rounded-lg px-3 py-1 text-xs font-medium text-slate-700 shadow-xs flex items-center gap-1.5">
            <span>FY {selectedProduct.reportingYear}</span>
            <span className="text-slate-400 text-[10px]">▾</span>
          </div>
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search records"
              className="bg-white border border-slate-200 rounded-lg pl-8 pr-3 py-1 text-xs text-slate-700 focus:outline-none focus:border-emerald-500 w-36 md:w-44"
            />
          </div>
          <span className="bg-sky-100 text-sky-800 text-[10px] font-mono font-bold px-2.5 py-1 rounded-md tracking-wider">
            SAURIENT DEMO
          </span>
        </div>
      </div>

      {/* Main Title Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">CBAM Verification Readiness Platform</h1>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Versioned rules, evidence validation, calculation provenance and verifier handover
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsBlockerDrawerOpen(true)}
            className="px-4 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center gap-2"
          >
            <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
            <span>Checklist & Blockers</span>
          </button>
          <button
            onClick={() => setActiveTab('Data Pack')}
            className="px-4 py-2 bg-[#00E599] hover:bg-[#00c985] text-slate-950 text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center gap-2"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Generate Dossier</span>
          </button>
        </div>
      </div>

      {/* 12 Sub Navigation Tabs */}
      <div className="flex items-center gap-1 border-b border-slate-200 overflow-x-auto pb-px">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-xs font-semibold whitespace-nowrap border-b-2 transition-colors ${
              activeTab === tab
                ? 'border-emerald-600 text-emerald-700 bg-emerald-50/40 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Sub-Tab View Switching */}
      {activeTab === 'Overview' && (
        <CBAMOverview
          products={products}
          selectedProduct={selectedProduct}
          onSelectProduct={handleSelectProduct}
          onOpenBlockers={() => setIsBlockerDrawerOpen(true)}
        />
      )}

      {activeTab === 'Applicability' && <ApplicabilityWizard product={selectedProduct} />}

      {activeTab === 'CN Classification' && <CNClassificationView product={selectedProduct} />}

      {activeTab === 'Installations' && <InstallationsView product={selectedProduct} />}

      {activeTab === 'Monitoring Plans' && <MonitoringPlansView product={selectedProduct} />}

      {activeTab === 'Processes' && (
        <ProcessesPrecursorsView product={selectedProduct} onResolveBlocker={handleResolveRule} />
      )}

      {activeTab === 'Calculations' && <CalculationsTraceView product={selectedProduct} />}

      {activeTab === 'Declarants' && <DeclarantsView product={selectedProduct} />}

      {activeTab === 'Exposure' && <ExposureView product={selectedProduct} />}

      {activeTab === 'Cost' && <CostAnalysisView product={selectedProduct} />}

      {activeTab === 'Data Pack' && (
        <DataPackGeneratorView product={selectedProduct} onFreezeDataset={handleFreezeDataset} />
      )}

      {activeTab === 'Registry Transfer' && <RegistryTransferView product={selectedProduct} />}

      {/* Reusable Blocker Drawer Component */}
      <BlockerDrawer
        isOpen={isBlockerDrawerOpen}
        onClose={() => setIsBlockerDrawerOpen(false)}
        rules={selectedProduct.rules}
        onResolveRule={(ruleId) => {
          handleResolveRule(ruleId);
          setIsBlockerDrawerOpen(false);
        }}
      />
    </div>
  );
};
