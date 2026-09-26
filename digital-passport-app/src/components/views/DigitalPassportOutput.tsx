import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { SimpleWordsCard } from '../common/SimpleWordsCard';
import { getPassportWithMeta, getAllPassportsWithMeta, DEFAULT_TENANT_ID, type ApiFetchResult } from '../../api/client';
import type { RichDigitalPassport } from '../../types';
import {
  Leaf,
  Download,
  FileText,
  Share2,
  QrCode,
  ArrowLeft,
  CheckCircle2,
  ShieldCheck,
  Radio,
  RefreshCw,
  Code2,
  Copy,
  Check,
  Search,
  ChevronRight
} from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

export const DigitalPassportOutput: React.FC = () => {
  const { id } = useParams<{ id?: string }>();
  const navigate = useNavigate();

  // State for single passport view
  const [passportResult, setPassportResult] = useState<ApiFetchResult<RichDigitalPassport | null> | null>(null);
  
  // State for gallery / list view
  const [passportsResult, setPassportsResult] = useState<ApiFetchResult<RichDigitalPassport[]> | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCommodity, setSelectedCommodity] = useState<string>('ALL');

  const [activeTab, setActiveTab] = useState<'summary' | 'evidence' | 'supply_chain' | 'certificate' | 'api_json'>('summary');
  const [copied, setCopied] = useState(false);
  const [copiedJson, setCopiedJson] = useState(false);
  const [loading, setLoading] = useState(true);
  const tenantId = DEFAULT_TENANT_ID;

  // Load data depending on whether id parameter is present
  const loadData = async () => {
    setLoading(true);
    if (id) {
      const res = await getPassportWithMeta(id, tenantId);
      setPassportResult(res);
    } else {
      const listRes = await getAllPassportsWithMeta(tenantId);
      setPassportsResult(listRes);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, [id, tenantId]);

  // Loading state
  if (loading) {
    return (
      <div className="p-16 text-center space-y-3">
        <RefreshCw className="w-8 h-8 text-emerald-600 animate-spin mx-auto" />
        <p className="text-sm font-semibold text-slate-700">Connecting to Saurient API Gateway...</p>
        <p className="text-xs text-slate-400 font-mono">
          {id ? `GET http://localhost:8080/api/v1/passports/${id}` : `GET http://localhost:8080/api/v1/passports`}
        </p>
      </div>
    );
  }

  // =========================================================================
  // VIEW 1: PASSPORTS GALLERY / TILES VIEW (when no :id parameter is specified)
  // =========================================================================
  if (!id && passportsResult) {
    const allPassports = passportsResult.data;

    // Filter passports based on search query and commodity filter
    const filteredPassports = allPassports.filter(p => {
      const matchesSearch =
        p.product_summary.product_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.product_summary.batch_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.product_summary.commodity.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.passport_metadata.passport_id.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesCommodity =
        selectedCommodity === 'ALL' ||
        p.product_summary.commodity.toUpperCase().includes(selectedCommodity.toUpperCase());

      return matchesSearch && matchesCommodity;
    });

    const commodities = ['ALL', 'COCOA', 'ALUMINIUM', 'CEMENT'];

    return (
      <div className="space-y-6">
        {/* Top API Gateway Banner */}
        <div className="bg-slate-900 text-white p-4 rounded-2xl shadow-md border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
              <Radio className={`w-5 h-5 ${passportsResult.isLive ? 'animate-pulse text-emerald-400' : 'text-amber-400'}`} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm text-white">Saurient Go REST API Gateway — Passport Gallery</span>
                <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${passportsResult.isLive ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-slate-800 text-emerald-400 border border-slate-700'}`}>
                  {allPassports.length} Passports Fetched ({passportsResult.responseTimeMs}ms)
                </span>
              </div>
              <p className="text-xs text-slate-400 font-mono">
                Endpoint: <span className="text-emerald-400">GET /api/v1/passports</span> • Tenant: <span className="text-sky-300">{tenantId}</span>
              </p>
            </div>
          </div>

          <button
            onClick={() => loadData()}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg border border-slate-700 flex items-center gap-1.5 transition-colors self-start md:self-auto"
          >
            <RefreshCw className="w-3.5 h-3.5 text-slate-400" />
            <span>Refetch Passports</span>
          </button>
        </div>

        {/* Gallery Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <QrCode className="w-6 h-6 text-emerald-600" />
              <h1 className="text-2xl font-bold text-slate-900">Digital Carbon Passports</h1>
            </div>
            <p className="text-xs text-slate-500">
              Select any passport tile to view detailed Scope 1-3 lifecycle footprints, audit proofs, and EU compliance artifacts.
            </p>
          </div>

          <Link
            to="/products/new"
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-sm flex items-center gap-2 self-start md:self-auto"
          >
            <span>+ Create New Product Passport</span>
          </Link>
        </div>

        {/* Search & Commodity Filters */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          {/* Search Input */}
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by product, batch ID, or commodity..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* Commodity Filter Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
            {commodities.map(comm => (
              <button
                key={comm}
                onClick={() => setSelectedCommodity(comm)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  selectedCommodity === comm
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {comm}
              </button>
            ))}
          </div>
        </div>

        {/* Passport Tiles Grid */}
        {filteredPassports.length === 0 ? (
          <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 shadow-sm space-y-4 max-w-xl mx-auto my-6">
            <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center mx-auto">
              <FileText className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">No Passports Found</h3>
            <p className="text-xs text-slate-500">
              {searchQuery || selectedCommodity !== 'ALL'
                ? `No carbon passports match your search term or commodity filter.`
                : `No carbon passports have been returned from the backend REST API for tenant "${tenantId}".`}
            </p>
            <div className="pt-2">
              <Link
                to="/products/new"
                className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs rounded-xl shadow-xs transition-colors"
              >
                <span>+ Create New Product Batch</span>
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPassports.map((p, idx) => {
              const status = p.passport_metadata.status;
              const statusColor =
                status.toUpperCase() === 'VERIFIED'
                  ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                  : 'bg-sky-100 text-sky-800 border-sky-200';

              return (
                <div
                  key={p.passport_metadata.passport_id || idx}
                  onClick={() => navigate(`/passport/${p.passport_metadata.passport_id}`)}
                  className="bg-white rounded-2xl border border-slate-200 hover:border-emerald-500/50 shadow-sm hover:shadow-md transition-all cursor-pointer overflow-hidden flex flex-col justify-between group"
                >
                  {/* Tile Header */}
                  <div className="p-5 border-b border-slate-100 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">
                        {p.product_summary.commodity}
                      </span>
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${statusColor}`}>
                        {status}
                      </span>
                    </div>

                    <div>
                      <h3 className="font-bold text-slate-900 text-base group-hover:text-emerald-700 transition-colors">
                        {p.product_summary.product_name}
                      </h3>
                      <p className="text-xs text-slate-500 font-medium">{p.product_summary.producer_organization}</p>
                    </div>

                    <div className="flex items-center gap-3 text-xs pt-1">
                      <span className="font-mono bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-[11px]">
                        🏷️ {p.product_summary.batch_number}
                      </span>
                      <span className="text-slate-500 flex items-center gap-1 text-[11px]">
                        📍 {p.product_summary.facility.country_of_origin}
                      </span>
                    </div>
                  </div>

                  {/* Footprint Summary Box */}
                  <div className="p-5 bg-slate-50/50 space-y-4">
                    <div className="bg-emerald-50/80 border border-emerald-100 p-3.5 rounded-xl flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center shadow-xs">
                          <Leaf className="w-4 h-4" />
                        </div>
                        <div>
                          <span className="text-[10px] font-semibold text-slate-500 block">Carbon Intensity</span>
                          <span className="text-lg font-black text-slate-900">
                            {p.carbon_footprint.intensity_per_unit.value}
                          </span>
                          <span className="text-[10px] text-slate-600 ml-1">
                            {p.carbon_footprint.intensity_per_unit.unit}
                          </span>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="text-[10px] text-slate-400 block">Batch Total</span>
                        <span className="text-xs font-bold text-slate-900">
                          {p.carbon_footprint.total_batch_footprint_kg_co2e.toLocaleString()} kgCO2e
                        </span>
                      </div>
                    </div>

                    {/* Scope Pills */}
                    <div className="grid grid-cols-3 gap-2 text-center text-[10px]">
                      <div className="p-2 rounded-lg bg-white border border-slate-200">
                        <span className="text-slate-400 block">Scope 1</span>
                        <span className="font-bold text-slate-900">{p.carbon_footprint.scope_breakdown.scope_1_direct.percentage}%</span>
                      </div>
                      <div className="p-2 rounded-lg bg-white border border-slate-200">
                        <span className="text-slate-400 block">Scope 2</span>
                        <span className="font-bold text-slate-900">{p.carbon_footprint.scope_breakdown.scope_2_indirect_energy.percentage}%</span>
                      </div>
                      <div className="p-2 rounded-lg bg-white border border-slate-200">
                        <span className="text-slate-400 block">Scope 3</span>
                        <span className="font-bold text-slate-900">{p.carbon_footprint.scope_breakdown.scope_3_value_chain.percentage}%</span>
                      </div>
                    </div>

                    {/* Bottom Action Footer */}
                    <div className="pt-2 flex items-center justify-between text-xs text-emerald-700 font-bold group-hover:translate-x-0.5 transition-transform">
                      <span>View Digital Passport Details</span>
                      <ChevronRight className="w-4 h-4 text-emerald-600" />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  // =========================================================================
  // VIEW 2: INDIVIDUAL PASSPORT DETAIL VIEW (when an ID parameter is selected)
  // =========================================================================
  if (!passportResult || !passportResult.data) {
    return (
      <div className="p-12 text-center space-y-4 max-w-lg mx-auto bg-white rounded-2xl border border-slate-200 shadow-sm mt-8">
        <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto font-bold text-lg">!</div>
        <h2 className="text-xl font-bold text-slate-900">Carbon Passport Not Found</h2>
        <p className="text-xs text-slate-500">
          Could not retrieve passport record <code className="bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded font-mono">{id}</code> from the Saurient REST API Gateway.
        </p>
        {passportResult?.error && (
          <div className="p-3 bg-rose-50 border border-rose-100 rounded-xl text-xs text-rose-700 font-mono text-left">
            {passportResult.error}
          </div>
        )}
        <Link to="/passport" className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 text-white font-semibold text-xs rounded-xl hover:bg-slate-800 transition-colors">
          <ArrowLeft className="w-4 h-4" />
          <span>Return to Passport Gallery</span>
        </Link>
      </div>
    );
  }

  const passport = passportResult.data;
  const { product_summary, carbon_footprint, passport_metadata, methodology_and_audit, compliance_exports } = passport;

  const donutData = [
    { name: 'Scope 1', value: carbon_footprint.scope_breakdown.scope_1_direct.value_kg_co2e, percentage: carbon_footprint.scope_breakdown.scope_1_direct.percentage, color: '#16a34a' },
    { name: 'Scope 2', value: carbon_footprint.scope_breakdown.scope_2_indirect_energy.value_kg_co2e, percentage: carbon_footprint.scope_breakdown.scope_2_indirect_energy.percentage, color: '#0284c7' },
    { name: 'Scope 3', value: carbon_footprint.scope_breakdown.scope_3_value_chain.value_kg_co2e, percentage: carbon_footprint.scope_breakdown.scope_3_value_chain.percentage, color: '#2563eb' },
  ];

  const simpleWordsPoints = [
    { step: 1, text: 'This digital passport is served directly from the Saurient REST API Gateway.' },
    { step: 2, text: 'Displays verified Scope 1-3 footprint and cryptographic SHA-256 hash.' },
    { step: 3, text: 'QR code enables instant EU CBAM and battery passport verification.' },
  ];

  const handleCopyLink = () => {
    navigator.clipboard.writeText(passport_metadata.unique_qr_code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCopyJson = () => {
    navigator.clipboard.writeText(JSON.stringify(passport, null, 2));
    setCopiedJson(true);
    setTimeout(() => setCopiedJson(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Top API Integration Bar */}
      <div className="bg-slate-900 text-white p-4 rounded-2xl shadow-md border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
            <Radio className={`w-5 h-5 ${passportResult.isLive ? 'animate-pulse text-emerald-400' : 'text-amber-400'}`} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm text-white">Saurient Go REST API Gateway</span>
              <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${passportResult.isLive ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'}`}>
                {passportResult.isLive ? `200 OK (${passportResult.responseTimeMs}ms)` : `Fallback Data (${passportResult.status || 'Offline'})`}
              </span>
            </div>
            <p className="text-xs text-slate-400 font-mono">
              Endpoint: <span className="text-emerald-400">GET /api/v1/passports/{id}</span> • Tenant: <span className="text-sky-300">{tenantId}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => loadData()}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg border border-slate-700 flex items-center gap-1.5 transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5 text-slate-400" />
            <span>Refetch API</span>
          </button>
          <button
            onClick={() => setActiveTab('api_json')}
            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors shadow-xs"
          >
            <Code2 className="w-3.5 h-3.5" />
            <span>Inspect JSON API Payload</span>
          </button>
        </div>
      </div>

      {/* Back Link Header */}
      <div className="flex items-center justify-between">
        <Link to="/passport" className="text-xs font-semibold text-slate-600 hover:text-slate-900 flex items-center gap-1.5 bg-white border border-slate-200 px-3 py-1.5 rounded-xl shadow-sm">
          <ArrowLeft className="w-4 h-4" />
          <span>Back to All Passports Gallery</span>
        </Link>

        <div className="flex items-center gap-2">
          <span className="bg-emerald-100 text-emerald-800 text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            {passport_metadata.status}
          </span>
          <span className="text-slate-400 font-bold text-xs">•••</span>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3 space-y-6">
          {/* Top Product Banner Card */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-6">
            {/* Product Thumbnail */}
            <div className="relative w-full md:w-56 h-48 rounded-xl overflow-hidden bg-amber-100 shrink-0 border border-slate-100">
              <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url('https://images.unsplash.com/photo-1541781774459-bb2af2f05b55?auto=format&fit=crop&q=80&w=400')` }} />
              <div className="absolute bottom-2 left-2 right-2 bg-emerald-600/90 backdrop-blur-sm text-white p-2 rounded-lg text-[10px] font-bold flex items-center gap-1.5">
                <Leaf className="w-3.5 h-3.5 shrink-0" />
                <span>LOWER EMISSIONS BRIGHTER OPPORTUNITIES</span>
              </div>
            </div>

            {/* Product Details */}
            <div className="flex-1 space-y-4">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">SAURIENT CARBON PASSPORT API</span>
                <h1 className="text-2xl font-bold text-slate-900">{product_summary.product_name}</h1>
                <p className="text-xs font-semibold text-slate-600">{product_summary.producer_organization}</p>
              </div>

              <div className="grid grid-cols-2 gap-y-2 text-xs">
                <div className="flex items-center gap-2">
                  <span className="text-slate-400">📦 Commodity:</span>
                  <span className="font-semibold text-slate-900">{product_summary.commodity}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-slate-400">🏷️ Batch Number:</span>
                  <span className="font-mono font-semibold text-slate-900 bg-slate-100 px-2 py-0.5 rounded">{product_summary.batch_number}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-slate-400">📍 Country of Origin:</span>
                  <span className="font-semibold text-slate-900 flex items-center gap-1">📍 {product_summary.facility.country_of_origin}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-slate-400">📅 Production Date:</span>
                  <span className="font-semibold text-slate-900">{product_summary.production_date}</span>
                </div>
              </div>

              {/* Footprint Box inside Banner */}
              <div className="bg-emerald-50/60 border border-emerald-100 p-4 rounded-xl flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500 text-white flex items-center justify-center shadow-sm">
                    <Leaf className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="text-[11px] font-semibold text-slate-500 block">Total Carbon Footprint</span>
                    <span className="text-2xl font-black text-slate-900">{carbon_footprint.intensity_per_unit.value}</span>
                    <span className="text-xs text-slate-600 font-medium ml-1.5">{carbon_footprint.intensity_per_unit.unit}</span>
                  </div>
                </div>

                <div className="flex items-center gap-4 text-xs border-l border-emerald-200/60 pl-4">
                  <div>
                    <span className="text-slate-400 text-[10px] block">Scope 1</span>
                    <span className="font-bold text-slate-900">{carbon_footprint.scope_breakdown.scope_1_direct.value_kg_co2e} kgCO2e/kg</span>
                    <span className="text-emerald-600 text-[10px] block font-semibold">• {carbon_footprint.scope_breakdown.scope_1_direct.percentage}%</span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px] block">Scope 2</span>
                    <span className="font-bold text-slate-900">{carbon_footprint.scope_breakdown.scope_2_indirect_energy.value_kg_co2e} kgCO2e/kg</span>
                    <span className="text-sky-600 text-[10px] block font-semibold">• {carbon_footprint.scope_breakdown.scope_2_indirect_energy.percentage}%</span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px] block">Scope 3</span>
                    <span className="font-bold text-slate-900">{carbon_footprint.scope_breakdown.scope_3_value_chain.value_kg_co2e} kgCO2e/kg</span>
                    <span className="text-blue-600 text-[10px] block font-semibold">• {carbon_footprint.scope_breakdown.scope_3_value_chain.percentage}%</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-xs">
                  <span className="bg-emerald-100 text-emerald-800 font-bold px-3 py-1.5 rounded-lg flex items-center gap-1">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    Verified
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Interactive Tabs */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="flex border-b border-slate-200 bg-slate-50/50">
              {[
                { id: 'summary', label: 'Summary', icon: '📊' },
                { id: 'evidence', label: 'Evidence', icon: '📄' },
                { id: 'supply_chain', label: 'Supply Chain', icon: '🔗' },
                { id: 'certificate', label: 'Certificate', icon: '📜' },
                { id: 'api_json', label: 'Raw API Payload', icon: '⚡' },
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex-1 py-3 px-4 text-xs font-bold flex items-center justify-center gap-2 border-b-2 transition-all ${
                    activeTab === tab.id
                      ? 'border-emerald-500 text-emerald-700 bg-white shadow-xs'
                      : 'border-transparent text-slate-500 hover:text-slate-900 hover:bg-slate-100/50'
                  }`}
                >
                  <span>{tab.icon}</span>
                  <span>{tab.label}</span>
                </button>
              ))}
            </div>

            <div className="p-6">
              {activeTab === 'summary' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Emissions Donut Breakdown */}
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm mb-1">Emissions Breakdown</h3>
                    <p className="text-xs text-slate-500 mb-4">kg CO2e per kg product</p>

                    <div className="h-56 relative flex items-center justify-center">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie data={donutData} innerRadius={60} outerRadius={85} dataKey="value" paddingAngle={4}>
                            {donutData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                      <div className="absolute text-center">
                        <span className="text-2xl font-black text-slate-900">{carbon_footprint.intensity_per_unit.value}</span>
                        <span className="text-[10px] text-slate-500 block">kg CO2e/kg</span>
                      </div>
                    </div>

                    <div className="space-y-2 text-xs pt-2">
                      {donutData.map((d, i) => (
                        <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-slate-50">
                          <div className="flex items-center gap-2">
                            <span className="w-3 h-3 rounded-full" style={{ backgroundColor: d.color }}></span>
                            <span className="font-semibold text-slate-800">{d.name}</span>
                          </div>
                          <div className="font-mono text-slate-900 font-bold">
                            {d.value} kgCO2e ({d.percentage}%)
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Key Highlights */}
                  <div className="space-y-4">
                    <h3 className="font-bold text-slate-900 text-sm">Key Highlights</h3>

                    <div className="space-y-3">
                      <div className="p-4 rounded-xl bg-emerald-50/50 border border-emerald-100 flex items-start gap-3">
                        <Leaf className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                        <div>
                          <h4 className="font-bold text-slate-900 text-xs">100% traceable to source</h4>
                          <p className="text-[11px] text-slate-500">From farm to export</p>
                        </div>
                      </div>

                      <div className="p-4 rounded-xl bg-emerald-50/50 border border-emerald-100 flex items-start gap-3">
                        <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                        <div>
                          <h4 className="font-bold text-slate-900 text-xs">Verified by independent auditors</h4>
                          <p className="text-[11px] text-slate-500">Aligned with global standards ({methodology_and_audit.standard_aligned})</p>
                        </div>
                      </div>

                      <div className="p-4 rounded-xl bg-emerald-50/50 border border-emerald-100 flex items-start gap-3">
                        <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                        <div>
                          <h4 className="font-bold text-slate-900 text-xs">Supports low-carbon trade</h4>
                          <p className="text-[11px] text-slate-500">A cleaner, brighter future.</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'evidence' && (
                <div className="space-y-3">
                  <h3 className="font-bold text-slate-900 text-sm mb-2">Attached Verification Evidence</h3>
                  {methodology_and_audit.verification_details.evidence_documents_attached.length > 0 ? (
                    methodology_and_audit.verification_details.evidence_documents_attached.map((doc, idx) => (
                      <div key={idx} className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4 text-emerald-600" />
                          <span className="font-mono font-medium text-slate-800">{doc}</span>
                        </div>
                        <span className="text-emerald-700 bg-emerald-100 px-2.5 py-0.5 rounded font-semibold text-[10px]">Verified Audit Proof</span>
                      </div>
                    ))
                  ) : (
                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 text-xs text-slate-500">
                      No explicit documents attached. Telemetry log data hash verified.
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'supply_chain' && (
                <div className="space-y-3 text-xs">
                  <h3 className="font-bold text-slate-900 text-sm mb-2">Supply Chain Provenance</h3>
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 space-y-2">
                    <p><span className="font-semibold text-slate-700">Facility:</span> {product_summary.facility.name} ({product_summary.facility.location})</p>
                    <p><span className="font-semibold text-slate-700">Producer Org:</span> {product_summary.producer_organization}</p>
                    <p><span className="font-semibold text-slate-700">Export Market:</span> {compliance_exports.target_export_market}</p>
                  </div>
                </div>
              )}

              {activeTab === 'certificate' && (
                <div className="p-6 bg-emerald-50/50 rounded-2xl border border-emerald-200 text-center space-y-3">
                  <h3 className="font-bold text-emerald-900 text-lg">Official Digital Carbon Certificate</h3>
                  <p className="text-xs text-slate-600 font-mono">SHA-256 Hash: {passport_metadata.cryptographic_hash}</p>
                  <p className="text-xs text-slate-500">Issued: {passport_metadata.issuance_date} | Status: {passport_metadata.status}</p>
                </div>
              )}

              {activeTab === 'api_json' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-bold text-slate-900 text-sm">JSON Response from API Gateway</h3>
                      <p className="text-xs text-slate-500 font-mono">GET http://localhost:8080/api/v1/passports/{id}</p>
                    </div>
                    <button
                      onClick={handleCopyJson}
                      className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5"
                    >
                      {copiedJson ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                      <span>{copiedJson ? 'Copied!' : 'Copy JSON'}</span>
                    </button>
                  </div>
                  <pre className="bg-slate-950 text-emerald-400 p-4 rounded-xl text-[11px] font-mono overflow-x-auto max-h-96 border border-slate-800">
                    {JSON.stringify(passport, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Side Share & Download Panel */}
        <div className="space-y-6">
          <SimpleWordsCard points={simpleWordsPoints} />

          {/* Share & Download Box */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="font-bold text-slate-900 text-sm">Share & Download</h3>

            {/* QR Code Box */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col items-center text-center space-y-2">
              <div className="w-32 h-32 bg-white border border-slate-200 p-2 rounded-xl flex items-center justify-center shadow-xs">
                <QrCode className="w-full h-full text-slate-900" />
              </div>
              <span className="text-[11px] font-semibold text-slate-700">Scan to verify</span>
              <span className="text-[10px] text-slate-400">View live passport</span>
            </div>

            {/* Action Buttons */}
            <div className="space-y-2">
              <button
                type="button"
                onClick={() => alert('Downloading official PDF Carbon Passport certificate...')}
                className="w-full p-3 rounded-xl border border-slate-200 hover:bg-slate-50 transition-colors flex items-center justify-between text-xs font-semibold text-slate-800"
              >
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-rose-500" />
                  <span>Download PDF Certificate</span>
                </div>
                <Download className="w-4 h-4 text-slate-400" />
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('api_json')}
                className="w-full p-3 rounded-xl border border-slate-200 hover:bg-slate-50 transition-colors flex items-center justify-between text-xs font-semibold text-slate-800"
              >
                <div className="flex items-center gap-2">
                  <Share2 className="w-4 h-4 text-blue-500" />
                  <span>Export via API (JSON / XML)</span>
                </div>
                <span className="text-slate-400">→</span>
              </button>

              <button
                type="button"
                onClick={handleCopyLink}
                className="w-full p-3 rounded-xl border border-slate-200 hover:bg-slate-50 transition-colors flex items-center justify-between text-xs font-semibold text-slate-800"
              >
                <div className="flex items-center gap-2">
                  <Share2 className="w-4 h-4 text-emerald-500" />
                  <span>{copied ? 'Link Copied!' : 'Share Link (Copy verified URL)'}</span>
                </div>
                <span className="text-slate-400">→</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
