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
  ArrowUpRight,
  Layers,
  Network,
  Share2,
  ChevronDown
} from 'lucide-react';
import { 
  getLineageDAG, 
  correctSupplierInput,
  getAllPassports
} from '../../api/client';
import type {
  LineageDAGData, 
  LineageNodeData,
  InputCorrectionRes 
} from '../../api/client';
import type { RichDigitalPassport } from '../../types';

export const TraceCarbonView: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const urlPassportId = searchParams.get('passport_id') || searchParams.get('id') || '';

  const [passportsList, setPassportsList] = useState<RichDigitalPassport[]>([]);
  const [dag, setDag] = useState<LineageDAGData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchId, setSearchId] = useState<string>(urlPassportId);

  // View Mode: 'tree' (Interactive Visual DAG Flow) or 'cards' (Sequential Journey)
  const [viewMode, setViewMode] = useState<'tree' | 'cards'>('tree');
  const [selectedNode, setSelectedNode] = useState<LineageNodeData | null>(null);

  // Correction Simulation State
  const [newValue, setNewValue] = useState<number>(0.350);
  const [reason, setReason] = useState<string>('Supplier submitted audited Scope 3 declaration with verified emission factor.');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [correctionResult, setCorrectionResult] = useState<InputCorrectionRes | null>(null);
  const [activeStep, setActiveStep] = useState<number>(7);

  const fetchLineage = async (idToFetch?: string) => {
    const targetId = idToFetch !== undefined ? idToFetch : searchId;
    if (!targetId || targetId === 'default') {
      setDag(null);
      setLoading(false);
      setError(null);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await getLineageDAG(targetId);
      if (!res || !res.nodes || res.nodes.length === 0) {
        setDag(null);
        setError(`Passport not found for ID: ${targetId}`);
        return;
      }
      setDag(res);
      if (res.passport_id) {
        setSearchId(res.passport_id);
      }
    } catch (err: any) {
      setDag(null);
      setError(err.message || `Passport not found for ID: ${targetId}`);
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
        } else {
          setLoading(false);
        }
      })
      .catch(() => {
        if (isMounted) setLoading(false);
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
      {/* Top Banner & Passport Selector */}
      <div className="bg-slate-900 text-white p-6 rounded-2xl shadow-lg border border-slate-800 flex flex-col gap-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="bg-emerald-500/20 text-emerald-400 text-[11px] font-extrabold px-2.5 py-0.5 rounded-md border border-emerald-500/30 uppercase tracking-wider">
                NEXUS LINEAGE DAG ENGINE
              </span>
              {searchId && searchId !== 'default' && (
                <span className="text-slate-400 text-xs font-mono">ID: {searchId}</span>
              )}
            </div>
            <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
              Trace Carbon Lineage
              <Search className="w-5 h-5 text-emerald-400" />
            </h1>
            <p className="text-slate-400 text-xs mt-1 max-w-2xl">
              Trace complete lineage from Enterprise Organisation down to Issued Passport. Features live supplier input correction impact analysis while preserving original passport immutability.
            </p>
          </div>

          {dag && (
            <button
              onClick={() => fetchLineage(searchId)}
              className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded-xl text-xs font-bold border border-slate-700 transition self-start md:self-auto"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              Refresh Lineage Graph
            </button>
          )}
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
                className="w-full bg-slate-800 border border-slate-700 text-emerald-300 text-xs font-mono rounded-xl px-3 py-2.5 focus:outline-none focus:border-emerald-500 cursor-pointer"
              >
                <option value="">Select Registered Passport...</option>
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

      {/* Loading State */}
      {loading && (
        <div className="bg-white p-12 rounded-2xl border border-slate-200 shadow-xs text-center space-y-3">
          <RefreshCw className="w-8 h-8 text-emerald-600 animate-spin mx-auto" />
          <p className="text-sm font-bold text-slate-800">Loading Nexus Lineage Graph...</p>
          <p className="text-xs text-slate-500 font-mono">Tracing graph pointers for {searchId}</p>
        </div>
      )}

      {/* Error State */}
      {error && !loading && (
        <div className="bg-red-50/70 p-8 rounded-2xl border border-red-200 text-center space-y-2">
          <div className="w-10 h-10 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-2">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <h3 className="text-sm font-bold text-red-900">{error}</h3>
          <p className="text-xs text-red-600 font-medium">Please select a registered passport from the dropdown or verify the ID.</p>
        </div>
      )}

      {/* Empty State when no passport is selected / loaded */}
      {!dag && !loading && !error && (
        <div className="bg-white p-12 rounded-2xl border border-slate-200 shadow-sm text-center space-y-4">
          <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto border border-emerald-100 shadow-xs">
            <GitBranch className="w-8 h-8 text-emerald-600" />
          </div>
          <div className="max-w-md mx-auto space-y-1">
            <h3 className="text-base font-bold text-slate-900">Select a Passport to Trace Lineage</h3>
            <p className="text-xs text-slate-500">
              Select a registered passport from the dropdown selector above or type a Passport ID / Batch Number to render its live Nexus Lineage DAG graph topology.
            </p>
          </div>
          {passportsList.length > 0 && (
            <div className="pt-2 flex flex-wrap justify-center gap-2 max-w-xl mx-auto">
              {passportsList.slice(0, 4).map((p) => {
                const pid = p.passport_metadata?.passport_id || p.product_summary?.batch_number || '';
                return (
                  <button
                    key={pid}
                    onClick={() => {
                      setSearchId(pid);
                      fetchLineage(pid);
                    }}
                    className="px-3 py-1.5 bg-slate-50 hover:bg-emerald-50 border border-slate-200 hover:border-emerald-300 text-slate-700 hover:text-emerald-900 rounded-xl text-xs font-semibold transition flex items-center gap-1.5"
                  >
                    <Package className="w-3.5 h-3.5 text-emerald-600" />
                    <span>{p.product_summary?.product_name || 'Passport'} ({pid})</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Loaded Passport State: Full Lineage Graph & Provenance Chain */}
      {dag && !loading && (
        <>
          {/* Top Bar Switcher & Step Indicator */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <p className="text-[10px] font-black uppercase text-slate-400 tracking-wider">
                1-PRODUCT JOURNEY LINEAGE SEQUENCE
              </p>
              <p className="text-xs font-bold text-slate-900 mt-0.5">
                Active Lineage: <span className="text-emerald-700 font-mono">{dag.passport_id}</span> • {dag.nodes.length} Graph Nodes • {dag.edges.length} Edges
              </p>
            </div>

            {/* View Switcher Buttons */}
            <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-xl shrink-0">
              <button
                onClick={() => setViewMode('tree')}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition flex items-center gap-1.5 ${
                  viewMode === 'tree'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Network className="w-3.5 h-3.5" />
                <span>DAG Graph Tree</span>
              </button>
              <button
                onClick={() => setViewMode('cards')}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition flex items-center gap-1.5 ${
                  viewMode === 'cards'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Sequential Cards</span>
              </button>
            </div>
          </div>

          {/* 7-Step Sequence Breadcrumbs */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
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

          {/* Main Workspace Grid: Topology & Simulation Drawer */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

            {/* Left 2 Cols: Interactive Graph Tree / Topology */}
            <div className="lg:col-span-2 space-y-4">
              
              {/* DAG GRAPH TREE VISUALIZATION */}
              {viewMode === 'tree' ? (
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-2">
                      <Network className="w-5 h-5 text-emerald-600" />
                      <div>
                        <h2 className="font-bold text-slate-900 text-sm">Interactive Visual Lineage Graph Tree</h2>
                        <p className="text-[11px] text-slate-500">Multi-tier DAG dependency topology from Enterprise Root down to Issued Passport</p>
                      </div>
                    </div>
                    <span className="bg-emerald-100 text-emerald-900 text-[10px] font-extrabold px-2.5 py-1 rounded-full uppercase tracking-wider">
                      LIVE GRAPH TOPOLOGY
                    </span>
                  </div>

                  {/* VISUAL DAG NODE TREE DIAGRAM */}
                  <div className="space-y-6 overflow-x-auto py-2">
                    
                    {/* TIER 1: GOVERNANCE & LOCATION */}
                    <div className="space-y-2">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">
                        TIER 1 • GOVERNANCE & FACILITY LAYER
                      </span>
                      <div className="flex flex-wrap gap-3">
                        <div 
                          onClick={() => setSelectedNode(orgNode || null)}
                          className="bg-blue-50 border border-blue-200 hover:border-blue-400 p-3.5 rounded-xl shadow-2xs cursor-pointer transition flex items-center gap-3 min-w-[240px]"
                        >
                          <div className="p-2 bg-blue-600 text-white rounded-lg">
                            <Building2 className="w-5 h-5" />
                          </div>
                          <div>
                            <span className="text-[9px] font-extrabold bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded uppercase">ORGANISATION</span>
                            <p className="text-xs font-bold text-slate-900 mt-0.5">{orgNode?.label || 'Enterprise Org'}</p>
                            <p className="text-[10px] text-slate-500 font-mono">{orgNode?.reference_id || 'ORG-9001'}</p>
                          </div>
                        </div>

                        <div 
                          onClick={() => setSelectedNode(facNode || null)}
                          className="bg-indigo-50 border border-indigo-200 hover:border-indigo-400 p-3.5 rounded-xl shadow-2xs cursor-pointer transition flex items-center gap-3 min-w-[240px]"
                        >
                          <div className="p-2 bg-indigo-600 text-white rounded-lg">
                            <Factory className="w-5 h-5" />
                          </div>
                          <div>
                            <span className="text-[9px] font-extrabold bg-indigo-100 text-indigo-800 px-1.5 py-0.5 rounded uppercase">FACILITY</span>
                            <p className="text-xs font-bold text-slate-900 mt-0.5">{facNode?.label || 'Production Site'}</p>
                            <p className="text-[10px] text-slate-500 font-mono">{facNode?.reference_id || 'FAC-042'}</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-center my-1">
                      <div className="h-6 w-0.5 bg-slate-300"></div>
                    </div>

                    {/* TIER 2: PRODUCT BATCH */}
                    <div className="space-y-2">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">
                        TIER 2 • PRODUCT BATCH
                      </span>
                      <div 
                        onClick={() => setSelectedNode(batchNode || null)}
                        className="bg-emerald-50 border border-emerald-300 hover:border-emerald-500 p-4 rounded-xl shadow-xs cursor-pointer transition flex items-center justify-between max-w-xl"
                      >
                        <div className="flex items-center gap-3">
                          <div className="p-2.5 bg-emerald-600 text-white rounded-xl">
                            <Package className="w-5 h-5" />
                          </div>
                          <div>
                            <span className="text-[9px] font-extrabold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded uppercase">PRODUCT BATCH</span>
                            <p className="text-xs font-bold text-slate-900 mt-0.5">{String(batchNode?.properties?.product_name || batchNode?.label || 'Product Batch')}</p>
                            <p className="text-[10px] text-slate-500 font-mono">{batchNode?.reference_id || 'BATCH-01'} • CN: {batchNode?.properties?.cn_code || '7208 10 00'}</p>
                          </div>
                        </div>
                        <span className="text-xs bg-white text-emerald-900 border border-emerald-200 px-3 py-1 rounded-lg font-bold">
                          {((batchNode?.properties?.quantity_kg || 10000) / 1000).toFixed(1)} Tonnes
                        </span>
                      </div>
                    </div>

                    <div className="flex justify-center my-1">
                      <div className="h-6 w-0.5 bg-slate-300"></div>
                    </div>

                    {/* TIER 3: INPUT TELEMETRY & INVENTORIES */}
                    <div className="space-y-2">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">
                        TIER 3 • TELEMETRY METER READINGS & SUPPLIER INVENTORIES
                      </span>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        {/* Scope 1 */}
                        <div 
                          onClick={() => setSelectedNode(s1Node || null)}
                          className="bg-amber-50/80 border border-amber-200 hover:border-amber-400 p-3 rounded-xl shadow-2xs cursor-pointer transition space-y-1.5"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-[9px] font-black bg-amber-100 text-amber-900 px-1.5 py-0.5 rounded uppercase flex items-center gap-1">
                              <Flame className="w-3 h-3 text-amber-600" /> SCOPE 1
                            </span>
                            <span className="text-[9px] font-mono text-slate-500">{s1Node?.reference_id || 'MTR-S1-001'}</span>
                          </div>
                          <p className="text-xs font-bold text-slate-900">{s1Node?.label || 'Direct Fuel Meter'}</p>
                          <p className="text-[11px] font-black text-amber-900">
                            {(s1Node?.properties?.value || 0).toLocaleString()} {s1Node?.properties?.unit || 'L'}
                          </p>
                        </div>

                        {/* Scope 2 */}
                        <div 
                          onClick={() => setSelectedNode(s2Node || null)}
                          className="bg-blue-50/80 border border-blue-200 hover:border-blue-400 p-3 rounded-xl shadow-2xs cursor-pointer transition space-y-1.5"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-[9px] font-black bg-blue-100 text-blue-900 px-1.5 py-0.5 rounded uppercase flex items-center gap-1">
                              <Zap className="w-3 h-3 text-blue-600" /> SCOPE 2
                            </span>
                            <span className="text-[9px] font-mono text-slate-500">{s2Node?.reference_id || 'MTR-S2-001'}</span>
                          </div>
                          <p className="text-xs font-bold text-slate-900">{s2Node?.label || 'Grid Energy Meter'}</p>
                          <p className="text-[11px] font-black text-blue-900">
                            {(s2Node?.properties?.value || 0).toLocaleString()} {s2Node?.properties?.unit || 'kWh'}
                          </p>
                        </div>

                        {/* Scope 3 */}
                        <div 
                          onClick={() => setSelectedNode(s3Node || null)}
                          className={`border p-3 rounded-xl shadow-2xs cursor-pointer transition space-y-1.5 ${
                            correctionResult 
                              ? 'bg-amber-100 border-amber-400 ring-2 ring-amber-300' 
                              : 'bg-purple-50/80 border-purple-200 hover:border-purple-400'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-[9px] font-black bg-purple-100 text-purple-900 px-1.5 py-0.5 rounded uppercase flex items-center gap-1">
                              <Truck className="w-3 h-3 text-purple-600" /> SCOPE 3
                            </span>
                            <span className="text-[9px] font-mono text-slate-500">{s3Node?.reference_id || 'SUP-DEC-409'}</span>
                          </div>
                          <p className="text-xs font-bold text-slate-900">{s3Node?.label || 'Supplier Input'}</p>
                          <p className="text-[11px] font-black text-purple-900">
                            {correctionResult ? `${correctionResult.new_value} kgCO2e/kg` : `${(s3Node?.properties?.value || 0.25).toFixed(3)} kgCO2e/kg`}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-center my-1">
                      <div className="h-6 w-0.5 bg-slate-300"></div>
                    </div>

                    {/* TIER 4: CALCULATION & VERIFICATION */}
                    <div className="space-y-2">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">
                        TIER 4 • CALCULATION ENGINE & AUDIT ASSURANCE
                      </span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div 
                          onClick={() => setSelectedNode(calcNode || null)}
                          className="bg-emerald-950 text-white p-4 rounded-xl shadow-md border border-emerald-500/30 cursor-pointer hover:border-emerald-400 transition"
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-[9px] font-extrabold bg-emerald-500/30 text-emerald-300 px-2 py-0.5 rounded uppercase">CEL CALCULATION ENGINE</span>
                            <span className="text-[10px] text-emerald-400 font-mono">{calcNode?.reference_id || 'CALC-V1'}</span>
                          </div>
                          <p className="text-xl font-black text-emerald-400 mt-1">
                            {(calcNode?.properties?.intensity_kgCO2e_per_kg || 0).toFixed(2)} kgCO2e/kg
                          </p>
                          <p className="text-[10px] text-slate-300 mt-1">
                            Total Footprint: {(calcNode?.properties?.total_footprint_kg || 0).toLocaleString()} kgCO2e
                          </p>
                        </div>

                        <div 
                          onClick={() => setSelectedNode(verNode || null)}
                          className="bg-slate-900 text-white p-4 rounded-xl shadow-md border border-slate-800 cursor-pointer hover:border-slate-700 transition"
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-[9px] font-extrabold bg-blue-500/30 text-blue-300 px-2 py-0.5 rounded uppercase">ACV AUDIT VERIFICATION</span>
                            <span className="text-[10px] text-blue-300 font-mono">{verNode?.reference_id || 'ACV-01'}</span>
                          </div>
                          <p className="text-sm font-bold text-white flex items-center gap-1.5 mt-2">
                            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                            {verNode?.properties?.opinion || verNode?.properties?.status || 'Unqualified Opinion'}
                          </p>
                          <p className="text-[10px] text-slate-400 mt-1">
                            Verifier: {verNode?.properties?.verifier || 'TUV Rheinland India'}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-center my-1">
                      <div className="h-6 w-0.5 bg-slate-300"></div>
                    </div>

                    {/* TIER 5: ISSUED CARBON PASSPORT */}
                    <div className="space-y-2">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">
                        TIER 5 • ISSUED CARBON PASSPORT CERTIFICATE
                      </span>
                      <div 
                        onClick={() => setSelectedNode(passNode || null)}
                        className="bg-gradient-to-r from-emerald-900 via-slate-900 to-slate-950 text-white p-5 rounded-2xl shadow-lg border border-emerald-500/40 cursor-pointer hover:border-emerald-400 transition"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <Lock className="w-4 h-4 text-emerald-400" />
                              <h3 className="font-black text-base text-white">
                                Carbon Passport {passNode?.reference_id || searchId}
                              </h3>
                            </div>
                            <p className="text-[10px] text-emerald-300 font-mono">
                              Hash: {passNode?.properties?.data_hash ? passNode.properties.data_hash.substring(0, 36) + '...' : 'e3b0c44298fc1c149afbf4c8996fb92427ae...'}
                            </p>
                          </div>

                          <div className="text-left sm:text-right shrink-0">
                            <span className="inline-block bg-emerald-500 text-slate-950 text-[10px] font-black px-3 py-1 rounded-lg uppercase tracking-wider">
                              FROZEN & VERIFIED
                            </span>
                            <p className="text-xs font-bold text-white mt-1">
                              Intensity: {(passNode?.properties?.intensity || 0).toFixed(2)} kgCO2e/kg
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                  </div>
                </div>
              ) : (
                /* SEQUENTIAL CARDS VIEW */
                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <h2 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                      <GitBranch className="w-4 h-4 text-emerald-600" />
                      Sequential Journey Breakdown
                    </h2>
                    <span className="text-xs text-slate-500 font-medium">
                      {dag.nodes.length} Nodes • {dag.edges.length} Edges
                    </span>
                  </div>

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
                              Org ID: {orgNode?.reference_id || 'ORG-DEMO'} • {orgNode?.properties?.country || 'India'}
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

                    {/* Stage 2: Product Batch & Inventories */}
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
                    </div>

                    {/* Stage 3: Calculations & Verification */}
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                      <div className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">
                        STEP 5, 6 & 7: CALCULATION, VERIFICATION & PASSPORT ISSUANCE
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="bg-white p-3 rounded-lg border border-slate-200">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-[10px] font-extrabold text-slate-500 uppercase">CALCULATION V1.0</span>
                            <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded">CEL Engine</span>
                          </div>
                          <p className="text-lg font-black text-slate-900">
                            {(calcNode?.properties?.intensity_kgCO2e_per_kg || 0).toFixed(2)} kgCO2e/kg
                          </p>
                        </div>

                        <div className="bg-white p-3 rounded-lg border border-slate-200">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-[10px] font-extrabold text-slate-500 uppercase">ACV VERIFICATION</span>
                            <span className="text-[10px] bg-blue-100 text-blue-800 font-bold px-2 py-0.5 rounded">AUDITED</span>
                          </div>
                          <p className="text-xs font-bold text-slate-900 flex items-center gap-1 mt-1">
                            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                            {verNode?.properties?.opinion || verNode?.properties?.status || 'Calculated'}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* EXPLICIT CROSS-HIERARCHY RECORD CONNECTIONS CARD (ONLY rendered when passport DAG exists) */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
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

                  {/* Calculation -> Inputs, Factors, Evidence Connection Card */}
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
                      </div>

                      {/* Connected Supplier Inputs */}
                      <div className="bg-white p-2.5 rounded-lg border border-emerald-200 shadow-2xs">
                        <span className="text-[10px] font-extrabold text-purple-800 uppercase flex items-center gap-1">
                          <Truck className="w-3 h-3 text-purple-600" />
                          Supplier Inputs
                        </span>
                        <p className="font-bold text-slate-900 text-[11px] mt-1">{s3Node?.reference_id || 'SUP-DEC-409'}</p>
                        <p className="text-[10px] text-slate-600">{(s3Node?.properties?.value || 0.25).toFixed(3)} kgCO2e/kg</p>
                      </div>

                      {/* Connected Emission Factors */}
                      <div className="bg-white p-2.5 rounded-lg border border-emerald-200 shadow-2xs">
                        <span className="text-[10px] font-extrabold text-blue-800 uppercase flex items-center gap-1">
                          <Database className="w-3 h-3 text-blue-600" />
                          Emission Factors
                        </span>
                        <p className="font-bold text-slate-900 text-[11px] mt-1">{efNode?.reference_id || 'EF-DEFRA-2026'}</p>
                        <p className="text-[10px] text-slate-600">DEFRA 2024 / IPCC 2021</p>
                      </div>

                      {/* Connected Evidence Documents */}
                      <div className="bg-white p-2.5 rounded-lg border border-emerald-200 shadow-2xs">
                        <span className="text-[10px] font-extrabold text-teal-800 uppercase flex items-center gap-1">
                          <FileText className="w-3 h-3 text-teal-600" />
                          Evidence Package
                        </span>
                        <p className="font-bold text-slate-900 text-[11px] mt-1">{evdNode?.reference_id || 'EVD-00176'}</p>
                        <p className="text-[10px] text-slate-600">Audited Activity Invoices</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

            </div>

            {/* Right 1 Col: Simulation Drawer & Immutability Guarantees */}
            <div className="space-y-4">
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                <h2 className="font-bold text-slate-900 text-sm flex items-center gap-2 border-b border-slate-100 pb-3">
                  <RefreshCw className="w-4 h-4 text-emerald-600" />
                  Simulate Supplier Input Correction
                </h2>

                <p className="text-xs text-slate-500">
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
                    className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2.5 rounded-xl transition shadow-md flex items-center justify-center gap-2 cursor-pointer"
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
        </>
      )}
    </div>
  );
};

export default TraceCarbonView;
