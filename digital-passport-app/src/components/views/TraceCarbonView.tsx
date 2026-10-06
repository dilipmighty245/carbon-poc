import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  Factory, 
  Package, 
  Zap, 
  Flame, 
  Truck, 
  Calculator, 
  CheckCircle2, 
  Lock, 
  RefreshCw, 
  ArrowRight, 
  AlertTriangle,
  GitBranch,
  ShieldCheck,
  Search,
  FileCheck,
  Link2,
  FileText,
  Database,
  Layers,
  ArrowUpRight
} from 'lucide-react';
import { 
  getLineageDAG, 
  correctSupplierInput
} from '../../api/client';
import type {
  LineageDAGData, 
  InputCorrectionRes 
} from '../../api/client';

export const TraceCarbonView: React.FC = () => {
  const [dag, setDag] = useState<LineageDAGData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Correction Simulation State
  const [newValue, setNewValue] = useState<number>(0.720);
  const [reason, setReason] = useState<string>('Supplier Apex Steel submitted audited Scope 3 declaration with updated scrap ratio.');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [correctionResult, setCorrectionResult] = useState<InputCorrectionRes | null>(null);
  const [activeStep, setActiveStep] = useState<number>(7);

  const fetchLineage = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getLineageDAG('PASS-2026-981-v1.0');
      setDag(res);
    } catch (err: any) {
      setError(err.message || 'Failed to load lineage graph');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLineage();
  }, []);

  const handleSimulateCorrection = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await correctSupplierInput({
        input_node_id: 'NODE_IN_SUP_409',
        new_value: newValue,
        unit: 'kgCO2e/kg',
        reason: reason,
        user_ref: 'user-lead-auditor',
      });
      setCorrectionResult(res);
      await fetchLineage();
    } catch (err: any) {
      alert('Correction simulation failed: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const steps = [
    { num: 1, label: 'Organisation', icon: Building2 },
    { num: 2, label: 'Facility', icon: Factory },
    { num: 3, label: 'Product Batch', icon: Package },
    { num: 4, label: 'Inputs & Evidence', icon: Zap },
    { num: 5, label: 'Calculation v1.0', icon: Calculator },
    { num: 6, label: 'ACV Verification', icon: ShieldCheck },
    { num: 7, label: 'Issued Passport', icon: Lock },
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 font-sans">
      {/* Top Banner & Title */}
      <div className="bg-slate-900 text-white p-6 rounded-2xl shadow-lg border border-slate-800 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="bg-emerald-500/20 text-emerald-400 text-[11px] font-extrabold px-2.5 py-0.5 rounded-md border border-emerald-500/30 uppercase tracking-wider">
              NEXUS LINEAGE DAG ENGINE
            </span>
            <span className="text-slate-400 text-xs font-mono">ID: PASS-2026-981-v1.0</span>
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
            Trace This Carbon Number
            <Search className="w-5 h-5 text-emerald-400" />
          </h1>
          <p className="text-slate-400 text-xs mt-1 max-w-2xl">
            Demonstrates complete lineage tracing from Organisation down to Issued Passport. Features live supplier input correction impact analysis while preserving original passport immutability.
          </p>
        </div>

        <button
          onClick={fetchLineage}
          className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded-xl text-xs font-bold border border-slate-700 transition"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh Lineage Graph
        </button>
      </div>

      {/* 7-Step Product Journey Breadcrumbs */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
        <p className="text-[10px] font-black uppercase text-slate-400 tracking-wider mb-3">
          1-PRODUCT JOURNEY LINEAGE SEQUENCE
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2">
          {steps.map((st) => {
            const Icon = st.icon;
            const isActive = activeStep >= st.num;
            return (
              <button
                key={st.num}
                onClick={() => setActiveStep(st.num)}
                className={`flex flex-col items-center p-2.5 rounded-xl border transition-all text-center ${
                  isActive
                    ? 'bg-emerald-50/80 border-emerald-300 text-emerald-900 font-bold shadow-xs'
                    : 'bg-slate-50 border-slate-200 text-slate-500'
                }`}
              >
                <div className={`p-1.5 rounded-lg mb-1 ${isActive ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-600'}`}>
                  <Icon className="w-4 h-4" />
                </div>
                <span className="text-[10px] font-extrabold uppercase tracking-wide truncate w-full">
                  {st.num}. {st.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Content Area: Visual Lineage Graph + Simulation Drawer */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Visual Lineage Graph Tree (2 Cols) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <h2 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                <GitBranch className="w-4 h-4 text-emerald-600" />
                Interactive Lineage Graph Topology
              </h2>
              <span className="text-xs text-slate-500 font-medium">
                {dag?.nodes.length || 0} Nodes • {dag?.edges.length || 0} Edges
              </span>
            </div>

            {loading ? (
              <div className="p-8 text-center text-slate-400 text-xs">Loading Nexus Lineage DAG...</div>
            ) : error ? (
              <div className="p-4 bg-red-50 text-red-700 text-xs rounded-lg">{error}</div>
            ) : (
              <div className="space-y-4">
                
                {/* Stage 1: Organisation & Facility */}
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                  <div className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">
                    STEP 1 & 2: GOVERNANCE & LOCATION
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="bg-white p-3 rounded-lg border border-slate-200 flex items-center gap-3">
                      <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                        <Building2 className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-900">Sattric Industrial Corp</p>
                        <p className="text-[10px] text-slate-500">Org ID: ORG-9001 • India</p>
                      </div>
                    </div>

                    <div className="bg-white p-3 rounded-lg border border-slate-200 flex items-center gap-3">
                      <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                        <Factory className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-900">Bellary Integrated Steel Plant</p>
                        <p className="text-[10px] text-slate-500">FAC-042 • 500,000 tpy</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex justify-center">
                  <ArrowRight className="w-4 h-4 text-slate-300 rotate-90" />
                </div>

                {/* Stage 2: Product Batch & Raw Inputs */}
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                  <div className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">
                    STEP 3 & 4: PRODUCT BATCH & PRIMARY TELEMETRY INVENTORIES
                  </div>

                  <div className="bg-white p-3 rounded-lg border border-slate-200 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
                        <Package className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-900">Hot-Rolled Steel Coil Batch</p>
                        <p className="text-[10px] text-slate-500">Batch ST-2026-00981 • CN 7208 10 00 • 10,000 kg</p>
                      </div>
                    </div>
                    <span className="text-[10px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-bold">10.0 Tonnes</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
                    <div className="bg-amber-50/60 p-2.5 rounded-lg border border-amber-200/80">
                      <div className="flex items-center gap-1.5 text-amber-800 text-[11px] font-bold">
                        <Flame className="w-3.5 h-3.5 text-amber-600" />
                        Scope 1 Diesel Fuel
                      </div>
                      <p className="text-xs font-black text-slate-900 mt-1">2,450 Liters</p>
                      <p className="text-[10px] text-slate-500">6,566 kgCO2e • Sattric Meter 01</p>
                    </div>

                    <div className="bg-blue-50/60 p-2.5 rounded-lg border border-blue-200/80">
                      <div className="flex items-center gap-1.5 text-blue-800 text-[11px] font-bold">
                        <Zap className="w-3.5 h-3.5 text-blue-600" />
                        Scope 2 Electricity
                      </div>
                      <p className="text-xs font-black text-slate-900 mt-1">14,200 kWh</p>
                      <p className="text-[10px] text-slate-500">10,082 kgCO2e • CEA Grid</p>
                    </div>

                    <div className={`p-2.5 rounded-lg border transition-all ${
                      correctionResult ? 'bg-amber-100 border-amber-400 ring-2 ring-amber-300' : 'bg-purple-50/60 border-purple-200/80'
                    }`}>
                      <div className="flex items-center gap-1.5 text-purple-800 text-[11px] font-bold">
                        <Truck className="w-3.5 h-3.5 text-purple-600" />
                        Scope 3 HBI Raw Material
                      </div>
                      <p className="text-xs font-black text-slate-900 mt-1">
                        {correctionResult ? `${correctionResult.new_value} kgCO2e/kg` : '0.650 kgCO2e/kg'}
                      </p>
                      <p className="text-[10px] text-slate-500">
                        {correctionResult ? 'CORRECTED • Apex Steel' : 'SUP-DEC-409 • Apex Steel'}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex justify-center">
                  <ArrowRight className="w-4 h-4 text-slate-300 rotate-90" />
                </div>

                {/* Stage 3: Calculations, Verification, and Passport */}
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                  <div className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">
                    STEP 5, 6 & 7: CALCULATION, VERIFICATION & PASSPORT ISSUANCE
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* Baseline Calculation v1.0 */}
                    <div className="bg-white p-3 rounded-lg border border-slate-200">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] font-extrabold text-slate-500 uppercase">CALCULATION V1.0</span>
                        <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded">CEL Engine</span>
                      </div>
                      <p className="text-lg font-black text-slate-900">1.850 kgCO2e/kg</p>
                      <p className="text-[10px] text-slate-500">Total Footprint: 18,500 kgCO2e</p>
                    </div>

                    {/* ACV Verification Sign-off */}
                    <div className="bg-white p-3 rounded-lg border border-slate-200">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] font-extrabold text-slate-500 uppercase">ACV VERIFICATION</span>
                        <span className="text-[10px] bg-blue-100 text-blue-800 font-bold px-2 py-0.5 rounded">NABCB</span>
                      </div>
                      <p className="text-xs font-bold text-slate-900 flex items-center gap-1 mt-1">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        Unqualified Opinion
                      </p>
                      <p className="text-[10px] text-slate-500">Verifier: TUV Rheinland India</p>
                    </div>
                  </div>

                  {/* Issued Passport Certificate (v1.0 Frozen) */}
                  <div className="bg-gradient-to-r from-emerald-900 to-slate-900 text-white p-4 rounded-xl shadow-md border border-emerald-500/30 flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <Lock className="w-4 h-4 text-emerald-400" />
                        <h3 className="font-extrabold text-sm text-white">Carbon Passport PASS-2026-981-v1.0</h3>
                      </div>
                      <p className="text-[10px] text-emerald-300 font-mono mt-0.5">
                        Hash: e3b0c44298fc1c149afbf4c899...991b7852b855
                      </p>
                    </div>

                    <div className="text-right">
                      <span className="inline-block bg-emerald-500 text-slate-950 text-[10px] font-black px-2.5 py-1 rounded-md uppercase tracking-wider">
                        FROZEN & VERIFIED
                      </span>
                      <p className="text-[10px] text-slate-300 mt-1">Intensity: 1.850 kgCO2e/kg</p>
                    </div>
                  </div>

                  {/* Impact Analysis Node: Spawned Draft Passport v1.1 if correction executed */}
                  {correctionResult && (
                    <div className="bg-amber-50 p-4 rounded-xl border border-amber-300 space-y-2 animate-fade-in">
                      <div className="flex items-center justify-between text-amber-900 font-extrabold text-xs">
                        <span className="flex items-center gap-1.5">
                          <AlertTriangle className="w-4 h-4 text-amber-600" />
                          SPAWNED NEW RE-CALCULATED VERSION (v1.1)
                        </span>
                        <span className="bg-amber-200 text-amber-900 px-2 py-0.5 rounded text-[10px]">
                          IMMUTABILITY GUARANTEED
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-3 text-xs bg-white p-3 rounded-lg border border-amber-200">
                        <div>
                          <p className="text-slate-500 text-[10px]">Original Passport (v1.0)</p>
                          <p className="font-bold text-slate-900">1.850 kgCO2e/kg (FROZEN)</p>
                        </div>
                        <div>
                          <p className="text-slate-500 text-[10px]">Recalculated Target (v1.1)</p>
                          <p className="font-black text-amber-700">{correctionResult.new_intensity_kg_co2e.toFixed(4)} kgCO2e/kg (DRAFT)</p>
                        </div>
                      </div>

                      <p className="text-[10px] text-amber-800">
                        Notice: Previously issued Passport <span className="font-bold">PASS-2026-981-v1.0</span> remains 100% untouched (`frozen=true`). Draft Passport <span className="font-bold">{correctionResult.new_draft_passport_id}</span> was created for verification.
                      </p>
                    </div>
                  )}

                </div>
              </div>
            )}
          </div>

          {/* EXPLICIT CROSS-HIERARCHY RECORD CONNECTIONS CARD */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h2 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <Link2 className="w-4 h-4 text-emerald-600" />
                  Explicit Cross-Hierarchy Record Connections
                </h2>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Direct record pointers linking Issued Passport ➔ Calculation Version ➔ Production Batch ➔ Telemetry Meters ➔ Supplier Inputs ➔ Emission Factors ➔ Evidence Package
                </p>
              </div>
              <span className="text-[10px] bg-emerald-100 text-emerald-900 font-extrabold px-2.5 py-1 rounded-md border border-emerald-300 uppercase tracking-wider">
                Full Provenance Chain
              </span>
            </div>

            <div className="space-y-3">
              {/* Passport -> Calculation & Batch Explicit Connection Card */}
              <div className="bg-slate-900 text-white p-4 rounded-xl border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Lock className="w-4 h-4 text-emerald-400" />
                    <span className="text-xs font-black text-white">PASSPORT RECORD: PASS-2026-981-v1.0</span>
                  </div>
                  <span className="text-[10px] bg-emerald-500/20 text-emerald-300 font-mono px-2 py-0.5 rounded border border-emerald-500/30">
                    FROZEN IMMUTABLE
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                  <div className="bg-slate-800/80 p-2.5 rounded-lg border border-slate-700/80">
                    <span className="text-[10px] font-bold text-slate-400 uppercase block">1. Connects To Calculation</span>
                    <p className="font-bold text-emerald-400 mt-0.5 flex items-center gap-1">
                      CALC-2026-981-V1
                      <ArrowUpRight className="w-3 h-3 text-emerald-400" />
                    </p>
                    <p className="text-[10px] text-slate-400 mt-0.5">1.850 kgCO2e/kg (v1.0)</p>
                  </div>

                  <div className="bg-slate-800/80 p-2.5 rounded-lg border border-slate-700/80">
                    <span className="text-[10px] font-bold text-slate-400 uppercase block">2. Connects To Batch</span>
                    <p className="font-bold text-indigo-300 mt-0.5 flex items-center gap-1">
                      ST-2026-00981
                      <ArrowUpRight className="w-3 h-3 text-indigo-300" />
                    </p>
                    <p className="text-[10px] text-slate-400 mt-0.5">10,000 kg Steel Coil</p>
                  </div>

                  <div className="bg-slate-800/80 p-2.5 rounded-lg border border-slate-700/80">
                    <span className="text-[10px] font-bold text-slate-400 uppercase block">3. Connects To Verification</span>
                    <p className="font-bold text-blue-300 mt-0.5 flex items-center gap-1">
                      ACV-2026-088
                      <ArrowUpRight className="w-3 h-3 text-blue-300" />
                    </p>
                    <p className="text-[10px] text-slate-400 mt-0.5">TUV Rheinland India</p>
                  </div>
                </div>
              </div>

              {/* Calculation -> Inputs, Factors, Evidence Explicit Connection Card */}
              <div className="bg-emerald-950/20 p-4 rounded-xl border border-emerald-200/80 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Calculator className="w-4 h-4 text-emerald-700" />
                    <span className="text-xs font-black text-emerald-950">CALCULATION RECORD: CALC-2026-981-V1</span>
                  </div>
                  <span className="text-[10px] bg-emerald-100 text-emerald-900 font-bold px-2 py-0.5 rounded">
                    CEL ENGINE v1.0
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 text-xs">
                  {/* Connected Meters */}
                  <div className="bg-white p-2.5 rounded-lg border border-emerald-200 shadow-2xs">
                    <span className="text-[10px] font-extrabold text-amber-800 uppercase flex items-center gap-1">
                      <Flame className="w-3 h-3 text-amber-600" />
                      Meter Readings
                    </span>
                    <p className="font-bold text-slate-900 text-[11px] mt-1">MTR-S1-001 (Diesel)</p>
                    <p className="font-bold text-slate-900 text-[11px]">MTR-S2-001 (Grid)</p>
                    <p className="text-[9px] text-slate-500 mt-1 font-mono">Telemetry verified</p>
                  </div>

                  {/* Connected Supplier Inputs */}
                  <div className="bg-white p-2.5 rounded-lg border border-emerald-200 shadow-2xs">
                    <span className="text-[10px] font-extrabold text-purple-800 uppercase flex items-center gap-1">
                      <Truck className="w-3 h-3 text-purple-600" />
                      Supplier Inputs
                    </span>
                    <p className="font-bold text-slate-900 text-[11px] mt-1">SUP-DEC-409</p>
                    <p className="text-[10px] text-slate-600">Apex Steel (0.650 kgCO2e/kg)</p>
                    <p className="text-[9px] text-slate-500 mt-1 font-mono">Scope 3 Declaration</p>
                  </div>

                  {/* Connected Emission Factors */}
                  <div className="bg-white p-2.5 rounded-lg border border-emerald-200 shadow-2xs">
                    <span className="text-[10px] font-extrabold text-blue-800 uppercase flex items-center gap-1">
                      <Database className="w-3 h-3 text-blue-600" />
                      Emission Factors Used
                    </span>
                    <p className="font-bold text-slate-900 text-[11px] mt-1">EF-DEFRA-2026</p>
                    <p className="text-[10px] text-slate-600">Diesel 2.68 kg/L • Grid 0.71 kg/kWh</p>
                    <p className="text-[9px] text-slate-500 mt-1 font-mono">DEFRA / CEA 2026 DB</p>
                  </div>

                  {/* Connected Evidence Documents */}
                  <div className="bg-white p-2.5 rounded-lg border border-emerald-200 shadow-2xs">
                    <span className="text-[10px] font-extrabold text-teal-800 uppercase flex items-center gap-1">
                      <FileText className="w-3 h-3 text-teal-600" />
                      Evidence Package Used
                    </span>
                    <p className="font-bold text-slate-900 text-[11px] mt-1">EVD-00176</p>
                    <p className="text-[10px] text-slate-600">Audited Invoices & Scraps Cert</p>
                    <p className="text-[9px] text-slate-500 mt-1 font-mono">TUV Rheinland Audit</p>
                  </div>
                </div>
              </div>

              {/* Factors and Evidence Explicit Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div className="bg-blue-50/70 p-3 rounded-lg border border-blue-200 flex items-start gap-3">
                  <div className="p-2 bg-blue-100 text-blue-800 rounded-lg">
                    <Database className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-900">Emission Factor Standard: EF-DEFRA-2026</p>
                    <p className="text-[10px] text-slate-600 mt-0.5">
                      Explicitly connects DEFRA 2026 v1.2 & Central Electricity Authority (CEA) grid intensity factors directly to Calculation <code className="text-blue-900 font-mono font-bold">CALC-2026-981-V1</code>.
                    </p>
                  </div>
                </div>

                <div className="bg-teal-50/70 p-3 rounded-lg border border-teal-200 flex items-start gap-3">
                  <div className="p-2 bg-teal-100 text-teal-800 rounded-lg">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-900">Evidence Document Package: EVD-00176</p>
                    <p className="text-[10px] text-slate-600 mt-0.5">
                      Explicitly connects <code className="text-teal-900 font-mono font-bold">Fuel_Invoice_Jan2026.pdf</code>, <code className="text-teal-900 font-mono font-bold">CEA_Grid_Cert_2026.pdf</code>, and <code className="text-teal-900 font-mono font-bold">Apex_Scrap_Audit_EVD.pdf</code> directly to telemetry meters and calculation v1.0.
                    </p>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>

        {/* Supplier Input Correction Simulation Panel (1 Col) */}
        <div className="space-y-4">
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
            <h2 className="font-bold text-slate-900 text-sm flex items-center gap-2 border-b border-slate-100 pb-3 mb-4">
              <RefreshCw className="w-4 h-4 text-emerald-600" />
              Simulate Supplier Input Correction
            </h2>

            <p className="text-xs text-slate-500 mb-4">
              Correct an upstream supplier declaration parameter to trigger downstream impact analysis across the calculation DAG.
            </p>

            <form onSubmit={handleSimulateCorrection} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Target Input Parameter</label>
                <input
                  type="text"
                  readOnly
                  value="NODE_IN_SUP_409 (Apex Steel HBI)"
                  className="w-full bg-slate-100 border border-slate-300 rounded-lg p-2 font-mono text-slate-700"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Original Emission Factor</label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value="0.650"
                    className="w-full bg-slate-100 border border-slate-300 rounded-lg p-2 font-bold text-slate-500"
                  />
                  <span className="text-slate-500 text-[10px]">kgCO2e/kg</span>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">New Audited Emission Factor</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    step="0.001"
                    value={newValue}
                    onChange={(e) => setNewValue(parseFloat(e.target.value) || 0)}
                    className="w-full bg-white border border-emerald-400 focus:ring-2 focus:ring-emerald-500 rounded-lg p-2 font-black text-emerald-800"
                  />
                  <span className="text-slate-500 text-[10px]">kgCO2e/kg</span>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Audit Correction Reason</label>
                <textarea
                  rows={3}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-lg p-2 text-slate-800 text-xs"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2.5 rounded-xl transition shadow-md flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>Running Impact Engine...</>
                ) : (
                  <>
                    <FileCheck className="w-4 h-4" />
                    Submit & Evaluate Impact DAG
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Immutability Rules Card */}
          <div className="bg-slate-900 text-slate-300 p-4 rounded-xl border border-slate-800 text-xs space-y-2">
            <h3 className="font-extrabold text-white flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              Saurient Immutability Guarantees
            </h3>
            <ul className="space-y-1.5 text-[11px] text-slate-400">
              <li className="flex items-start gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                Issued passports with <code className="text-emerald-300">frozen=true</code> can never be modified in-place.
              </li>
              <li className="flex items-start gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                Upstream changes spawn successor calculation nodes (<code className="text-emerald-300">v1.1</code> / <code className="text-emerald-300">v2.0</code>).
              </li>
              <li className="flex items-start gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                Complete SHA-256 audit log maintained across calculation versions.
              </li>
            </ul>
          </div>
        </div>

      </div>
    </div>
  );
};

export default TraceCarbonView;
