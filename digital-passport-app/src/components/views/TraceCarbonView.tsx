import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
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
  ArrowUpRight
} from 'lucide-react';
import { 
  getLineageDAG, 
  correctSupplierInput,
  getAllPassports
} from '../../api/client';
import type {
  LineageDAGData, 
  InputCorrectionRes 
} from '../../api/client';
import type { RichDigitalPassport } from '../../types';

export const TraceCarbonView: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const urlPassportId = searchParams.get('passport_id') || searchParams.get('id') || '';

  const [passportsList, setPassportsList] = useState<RichDigitalPassport[]>([]);
  const [dag, setDag] = useState<LineageDAGData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchId, setSearchId] = useState<string>(urlPassportId);

  // Correction Simulation State
  const [newValue, setNewValue] = useState<number>(0.350);
  const [reason, setReason] = useState<string>('Supplier submitted audited Scope 3 declaration with verified emission factor.');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [correctionResult, setCorrectionResult] = useState<InputCorrectionRes | null>(null);
  const [activeStep, setActiveStep] = useState<number>(7);

  const fetchLineage = async (idToFetch?: string) => {
    setLoading(true);
    setError(null);
    const targetId = idToFetch !== undefined ? idToFetch : searchId;
    try {
      const res = await getLineageDAG(targetId || 'default');
      if (!res || !res.nodes || res.nodes.length === 0) {
        setDag(null);
        setError(`Passport not found for the ID: ${targetId}`);
        return;
      }
      setDag(res);
      if (res.passport_id) {
        setSearchId(res.passport_id);
      }
    } catch (err: any) {
      setDag(null);
      setError(err.message || `Passport not found for the ID: ${targetId}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let isMounted = true;
    getAllPassports()
      .then((list) => {
        if (!isMounted) return;
        setPassportsList(list);
        if (urlPassportId) {
          setSearchId(urlPassportId);
          fetchLineage(urlPassportId);
        } else if (list.length > 0) {
          const firstId = list[0].passport_metadata?.passport_id || list[0].product_summary?.batch_number || '';
          setSearchId(firstId);
          fetchLineage(firstId);
        } else {
          fetchLineage('default');
        }
      })
      .catch(() => {
        if (isMounted) fetchLineage(urlPassportId || 'default');
      });

    return () => {
      isMounted = false;
    };
  }, [urlPassportId]);

  // Extract Nodes from DAG dynamically
  const orgNode = dag?.nodes?.find((n) => n.node_type === 'ORGANISATION');
  const facNode = dag?.nodes?.find((n) => n.node_type === 'FACILITY');
  const batchNode = dag?.nodes?.find((n) => n.node_type === 'PRODUCT_BATCH');
  const s1Node = dag?.nodes?.find((n) => n.node_type === 'INPUT_TELEMETRY' && (n.node_id.includes('SCOPE1') || n.label.toLowerCase().includes('scope 1') || n.label.toLowerCase().includes('fuel')));
  const s2Node = dag?.nodes?.find((n) => n.node_type === 'INPUT_TELEMETRY' && (n.node_id.includes('SCOPE2') || n.label.toLowerCase().includes('scope 2') || n.label.toLowerCase().includes('electricity')));
  const s3Node = dag?.nodes?.find((n) => n.node_type === 'SUPPLIER_DECLARATION' || n.node_id.includes('SUP') || n.node_id.includes('SCOPE3'));
  const calcNode = dag?.nodes?.find((n) => n.node_type === 'CALC_VERSION' && !n.node_id.includes('V1_1'));
  const verNode = dag?.nodes?.find((n) => n.node_type === 'VERIFICATION');
  const passNode = dag?.nodes?.find((n) => n.node_type === 'PASSPORT' && !n.node_id.includes('V1_1'));
  const efNode = dag?.nodes?.find((n) => n.node_type === 'EMISSION_FACTOR');
  const evdNode = dag?.nodes?.find((n) => n.node_type === 'EVIDENCE_DOCUMENT');

  const handleSimulateCorrection = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await correctSupplierInput({
        input_node_id: s3Node?.node_id || 'NODE_IN_SUP_409',
        new_value: newValue,
        unit: 'kgCO2e/kg',
        reason: reason,
        user_ref: 'user-lead-auditor',
      });
      setCorrectionResult(res);
      await fetchLineage(searchId);
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
      {/* Top Banner & Search Selector */}
      <div className="bg-slate-900 text-white p-6 rounded-2xl shadow-lg border border-slate-800 flex flex-col gap-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="bg-emerald-500/20 text-emerald-400 text-[11px] font-extrabold px-2.5 py-0.5 rounded-md border border-emerald-500/30 uppercase tracking-wider">
                NEXUS LINEAGE DAG ENGINE
              </span>
              <span className="text-slate-400 text-xs font-mono">ID: {searchId}</span>
            </div>
            <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
              Trace Carbon Lineage
              <Search className="w-5 h-5 text-emerald-400" />
            </h1>
            <p className="text-slate-400 text-xs mt-1 max-w-2xl">
              Trace complete lineage from Organisation down to Issued Passport. Features live supplier input correction impact analysis while preserving original passport immutability.
            </p>
          </div>

          <button
            onClick={() => fetchLineage(searchId)}
            className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded-xl text-xs font-bold border border-slate-700 transition self-start md:self-auto"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh Lineage Graph
          </button>
        </div>

        {/* Search Input Bar & Registered Passports Selector */}
        <div className="pt-2 border-t border-slate-800 flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchId}
              onChange={(e) => setSearchId(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') fetchLineage(searchId);
              }}
              placeholder="Enter Carbon Passport ID or Batch ID..."
              className="w-full bg-slate-800 border border-slate-700 text-white text-xs rounded-xl pl-10 pr-4 py-2.5 focus:outline-none focus:border-emerald-500 transition font-mono"
            />
          </div>

          <button
            onClick={() => fetchLineage(searchId)}
            className="w-full sm:w-auto px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-xl transition shadow-xs flex items-center justify-center gap-2 shrink-0"
          >
            <Search className="w-3.5 h-3.5" />
            <span>Trace Number</span>
          </button>

          {/* Registered Passports Dropdown Selector */}
          {passportsList.length > 0 && (
            <div className="w-full sm:w-auto shrink-0">
              <select
                value={searchId}
                onChange={(e) => {
                  setSearchId(e.target.value);
                  fetchLineage(e.target.value);
                }}
                className="w-full bg-slate-800 border border-slate-700 text-emerald-300 text-xs font-mono rounded-xl px-3 py-2.5 focus:outline-none focus:border-emerald-500"
              >
                <option value="" disabled>Select Registered Passport...</option>
                {passportsList.map((p) => {
                  const pid = p.passport_metadata?.passport_id || p.product_summary?.batch_number || '';
                  const label = `${p.product_summary?.product_name || 'Product'} (${p.product_summary?.batch_number || pid})`;
                  return (
                    <option key={pid} value={pid}>
                      {label}
                    </option>
                  );
                })}
              </select>
            </div>
          )}
        </div>
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
                {dag?.nodes?.length || 0} Nodes • {dag?.edges?.length || 0} Edges
              </span>
            </div>

            {loading ? (
              <div className="p-8 text-center text-slate-400 text-xs">Loading Nexus Lineage DAG...</div>
            ) : error ? (
              <div className="p-8 text-center bg-red-50/60 border border-red-200/80 rounded-2xl my-2 space-y-2">
                <div className="w-10 h-10 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-2">
                  <AlertTriangle className="w-5 h-5 text-red-600" />
                </div>
                <h3 className="text-sm font-bold text-red-900">{error}</h3>
                <p className="text-xs text-red-600 font-medium">Please verify the Passport ID or Batch Number and try again.</p>
              </div>
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
                        <p className="text-xs font-bold text-slate-900">
                          {orgNode?.label || orgNode?.reference_id || 'Enterprise Organisation'}
                        </p>
                        <p className="text-[10px] text-slate-500">
                          Org ID: {orgNode?.reference_id || 'ORG-DEMO'} • {orgNode?.properties?.country || 'Ghana'}
                        </p>
                      </div>
                    </div>

                    <div className="bg-white p-3 rounded-lg border border-slate-200 flex items-center gap-3">
                      <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                        <Factory className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-900">
                          {facNode?.label || facNode?.reference_id || 'Production Site'}
                        </p>
                        <p className="text-[10px] text-slate-500">
                          {facNode?.reference_id || 'FAC-01'} • {facNode?.properties?.location || 'Tema, Ghana'}
                        </p>
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
                        <p className="text-xs font-bold text-slate-900">
                          {String(batchNode?.properties?.product_name || batchNode?.label || batchNode?.reference_id || 'Product Batch')}
                        </p>
                        <p className="text-[10px] text-slate-500">
                          Batch {batchNode?.reference_id || ''} • Commodity: {batchNode?.properties?.commodity || 'General'}
                        </p>
                      </div>
                    </div>
                    <span className="text-[10px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-bold">
                      {((batchNode?.properties?.quantity_kg || 1000) / 1000).toFixed(1)} Tonnes
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
                    <div className="bg-amber-50/60 p-2.5 rounded-lg border border-amber-200/80">
                      <div className="flex items-center gap-1.5 text-amber-800 text-[11px] font-bold">
                        <Flame className="w-3.5 h-3.5 text-amber-600" />
                        Scope 1 Direct Fuel
                      </div>
                      <p className="text-xs font-black text-slate-900 mt-1">
                        {(s1Node?.properties?.value || 0).toLocaleString()} {s1Node?.properties?.unit || 'Liters'}
                      </p>
                      <p className="text-[10px] text-slate-500">
                        {(s1Node?.properties?.emission_kg || 0).toLocaleString()} kgCO2e • Fuel Meter
                      </p>
                    </div>

                    <div className="bg-blue-50/60 p-2.5 rounded-lg border border-blue-200/80">
                      <div className="flex items-center gap-1.5 text-blue-800 text-[11px] font-bold">
                        <Zap className="w-3.5 h-3.5 text-blue-600" />
                        Scope 2 Grid Electricity
                      </div>
                      <p className="text-xs font-black text-slate-900 mt-1">
                        {(s2Node?.properties?.value || 0).toLocaleString()} {s2Node?.properties?.unit || 'kWh'}
                      </p>
                      <p className="text-[10px] text-slate-500">
                        {(s2Node?.properties?.emission_kg || 0).toLocaleString()} kgCO2e • Grid Energy Meter
                      </p>
                    </div>

                    <div className={`p-2.5 rounded-lg border transition-all ${
                      correctionResult ? 'bg-amber-100 border-amber-400 ring-2 ring-amber-300' : 'bg-purple-50/60 border-purple-200/80'
                    }`}>
                      <div className="flex items-center gap-1.5 text-purple-800 text-[11px] font-bold">
                        <Truck className="w-3.5 h-3.5 text-purple-600" />
                        Scope 3 Value Chain
                      </div>
                      <p className="text-xs font-black text-slate-900 mt-1">
                        {correctionResult ? `${correctionResult.new_value} kgCO2e/kg` : `${(s3Node?.properties?.value || 0.25).toFixed(3)} kgCO2e/kg`}
                      </p>
                      <p className="text-[10px] text-slate-500">
                        {correctionResult ? 'CORRECTED • Audited Declaration' : `${s3Node?.reference_id || 'SUP-DEC'} • Supplier Material Declaration`}
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
                      <p className="text-lg font-black text-slate-900">
                        {(calcNode?.properties?.intensity_kgCO2e_per_kg || 0).toFixed(2)} kgCO2e/kg
                      </p>
                      <p className="text-[10px] text-slate-500">
                        Total Footprint: {(calcNode?.properties?.total_footprint_kg || 0).toLocaleString()} kgCO2e
                      </p>
                    </div>

                    {/* ACV Verification Sign-off */}
                    <div className="bg-white p-3 rounded-lg border border-slate-200">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] font-extrabold text-slate-500 uppercase">ACV VERIFICATION</span>
                        <span className="text-[10px] bg-blue-100 text-blue-800 font-bold px-2 py-0.5 rounded">AUDITED</span>
                      </div>
                      <p className="text-xs font-bold text-slate-900 flex items-center gap-1 mt-1">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        {verNode?.properties?.opinion || verNode?.properties?.status || 'Calculated'}
                      </p>
                      <p className="text-[10px] text-slate-500">
                        Verifier: {verNode?.properties?.verifier || 'Independent Verifier'}
                      </p>
                    </div>
                  </div>

                  {/* Issued Passport Certificate (v1.0 Frozen) */}
                  <div className="bg-gradient-to-r from-emerald-900 to-slate-900 text-white p-4 rounded-xl shadow-md border border-emerald-500/30 flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <Lock className="w-4 h-4 text-emerald-400" />
                        <h3 className="font-extrabold text-sm text-white">
                          Carbon Passport {passNode?.reference_id || searchId}
                        </h3>
                      </div>
                      <p className="text-[10px] text-emerald-300 font-mono mt-0.5">
                        Hash: {passNode?.properties?.data_hash ? passNode.properties.data_hash.substring(0, 32) + '...' : 'e3b0c44298fc1c149afbf4c8...'}
                      </p>
                    </div>

                    <div className="text-right">
                      <span className="inline-block bg-emerald-500 text-slate-950 text-[10px] font-black px-2.5 py-1 rounded-md uppercase tracking-wider">
                        FROZEN & VERIFIED
                      </span>
                      <p className="text-[10px] text-slate-300 mt-1">
                        Intensity: {(passNode?.properties?.intensity || 0).toFixed(2)} kgCO2e/kg
                      </p>
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
                          <p className="text-slate-500 text-[10px]">Original Passport</p>
                          <p className="font-bold text-slate-900">
                            {(calcNode?.properties?.intensity_kgCO2e_per_kg || 0).toFixed(2)} kgCO2e/kg (FROZEN)
                          </p>
                        </div>
                        <div>
                          <p className="text-slate-500 text-[10px]">Recalculated Target (v1.1)</p>
                          <p className="font-black text-amber-700">{correctionResult.new_intensity_kg_co2e.toFixed(4)} kgCO2e/kg (DRAFT)</p>
                        </div>
                      </div>

                      <p className="text-[10px] text-amber-800">
                        Notice: Previously issued Passport <span className="font-bold">{passNode?.reference_id || searchId}</span> remains 100% untouched (`frozen=true`). Draft Passport <span className="font-bold">{correctionResult.new_draft_passport_id}</span> was created for verification.
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
                    <span className="text-xs font-black text-white">
                      PASSPORT RECORD: {passNode?.reference_id || searchId}
                    </span>
                  </div>
                  <span className="text-[10px] bg-emerald-500/20 text-emerald-300 font-mono px-2 py-0.5 rounded border border-emerald-500/30">
                    FROZEN IMMUTABLE
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                  <div className="bg-slate-800/80 p-2.5 rounded-lg border border-slate-700/80">
                    <span className="text-[10px] font-bold text-slate-400 uppercase block">1. Connects To Calculation</span>
                    <p className="font-bold text-emerald-400 mt-0.5 flex items-center gap-1">
                      {calcNode?.reference_id || 'CALC-V1'}
                      <ArrowUpRight className="w-3 h-3 text-emerald-400" />
                    </p>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      {(calcNode?.properties?.intensity_kgCO2e_per_kg || 0).toFixed(2)} kgCO2e/kg
                    </p>
                  </div>

                  <div className="bg-slate-800/80 p-2.5 rounded-lg border border-slate-700/80">
                    <span className="text-[10px] font-bold text-slate-400 uppercase block">2. Connects To Batch</span>
                    <p className="font-bold text-indigo-300 mt-0.5 flex items-center gap-1">
                      {batchNode?.reference_id || 'BATCH-01'}
                      <ArrowUpRight className="w-3 h-3 text-indigo-300" />
                    </p>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      {(batchNode?.properties?.quantity_kg || 1000).toLocaleString()} kg {batchNode?.properties?.commodity || ''}
                    </p>
                  </div>

                  <div className="bg-slate-800/80 p-2.5 rounded-lg border border-slate-700/80">
                    <span className="text-[10px] font-bold text-slate-400 uppercase block">3. Connects To Verification</span>
                    <p className="font-bold text-blue-300 mt-0.5 flex items-center gap-1">
                      {verNode?.reference_id || 'ACV-01'}
                      <ArrowUpRight className="w-3 h-3 text-blue-300" />
                    </p>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      {verNode?.properties?.verifier || 'Independent Auditor'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Calculation -> Inputs, Factors, Evidence Explicit Connection Card */}
              <div className="bg-emerald-950/20 p-4 rounded-xl border border-emerald-200/80 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Calculator className="w-4 h-4 text-emerald-700" />
                    <span className="text-xs font-black text-emerald-950">
                      CALCULATION RECORD: {calcNode?.reference_id || 'CALC-V1'}
                    </span>
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
                    <p className="font-bold text-slate-900 text-[11px] mt-1">{s1Node?.reference_id || 'MTR-S1-001'} (Scope 1)</p>
                    <p className="font-bold text-slate-900 text-[11px]">{s2Node?.reference_id || 'MTR-S2-001'} (Scope 2)</p>
                    <p className="text-[9px] text-slate-500 mt-1 font-mono">Telemetry verified</p>
                  </div>

                  {/* Connected Supplier Inputs */}
                  <div className="bg-white p-2.5 rounded-lg border border-emerald-200 shadow-2xs">
                    <span className="text-[10px] font-extrabold text-purple-800 uppercase flex items-center gap-1">
                      <Truck className="w-3 h-3 text-purple-600" />
                      Supplier Inputs
                    </span>
                    <p className="font-bold text-slate-900 text-[11px] mt-1">{s3Node?.reference_id || 'SUP-DEC-409'}</p>
                    <p className="text-[10px] text-slate-600">{(s3Node?.properties?.value || 0.25).toFixed(3)} kgCO2e/kg</p>
                    <p className="text-[9px] text-slate-500 mt-1 font-mono">Scope 3 Declaration</p>
                  </div>

                  {/* Connected Emission Factors */}
                  <div className="bg-white p-2.5 rounded-lg border border-emerald-200 shadow-2xs">
                    <span className="text-[10px] font-extrabold text-blue-800 uppercase flex items-center gap-1">
                      <Database className="w-3 h-3 text-blue-600" />
                      Emission Factors Used
                    </span>
                    <p className="font-bold text-slate-900 text-[11px] mt-1">{efNode?.reference_id || 'EF-DEFRA-2026'}</p>
                    <p className="text-[10px] text-slate-600">DEFRA 2024 / IPCC 2021</p>
                    <p className="text-[9px] text-slate-500 mt-1 font-mono">Verified EF DB</p>
                  </div>

                  {/* Connected Evidence Documents */}
                  <div className="bg-white p-2.5 rounded-lg border border-emerald-200 shadow-2xs">
                    <span className="text-[10px] font-extrabold text-teal-800 uppercase flex items-center gap-1">
                      <FileText className="w-3 h-3 text-teal-600" />
                      Evidence Package Used
                    </span>
                    <p className="font-bold text-slate-900 text-[11px] mt-1">{evdNode?.reference_id || 'EVD-00176'}</p>
                    <p className="text-[10px] text-slate-600">Audited Activity Invoices</p>
                    <p className="text-[9px] text-slate-500 mt-1 font-mono">Audited & Verified</p>
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
                    <p className="text-xs font-bold text-slate-900">
                      Emission Factor Standard: {efNode?.reference_id || 'EF-DEFRA-2026'}
                    </p>
                    <p className="text-[10px] text-slate-600 mt-0.5">
                      Explicitly connects DEFRA 2024 & IPCC 2021 emission factors directly to Calculation <code className="text-blue-900 font-mono font-bold">{calcNode?.reference_id || 'CALC-V1'}</code>.
                    </p>
                  </div>
                </div>

                <div className="bg-teal-50/70 p-3 rounded-lg border border-teal-200 flex items-start gap-3">
                  <div className="p-2 bg-teal-100 text-teal-800 rounded-lg">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-900">
                      Evidence Document Package: {evdNode?.reference_id || 'EVD-00176'}
                    </p>
                    <p className="text-[10px] text-slate-600 mt-0.5">
                      Explicitly connects audited utility bills and supplier declarations directly to telemetry meters and calculation v1.0.
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
                  value={`${s3Node?.node_id || 'NODE_IN_SUP'} (${s3Node?.label || 'Scope 3 Input'})`}
                  className="w-full bg-slate-100 border border-slate-300 rounded-lg p-2 font-mono text-slate-700"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Original Emission Factor</label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={(s3Node?.properties?.value || 0.250).toFixed(3)}
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
