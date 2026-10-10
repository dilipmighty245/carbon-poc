import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  GitMerge, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  ArrowRight, 
  Search, 
  RefreshCw, 
  ShieldCheck, 
  Building2, 
  FileCheck,
  Eye,
  SlidersHorizontal
} from 'lucide-react';
import { getAllPassportsWithMeta } from '../../../../api/client';
import type { RichDigitalPassport } from '../../../../types';

export const VerificationQueueTab: React.FC = () => {
  const navigate = useNavigate();
  const [passports, setPassports] = useState<RichDigitalPassport[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'SUBMITTED' | 'DRAFT' | 'VERIFIED' | 'CORRECTIONS'>('ALL');

  const loadQueue = async () => {
    setLoading(true);
    try {
      const res = await getAllPassportsWithMeta('all');
      if (res && res.data) {
        setPassports(res.data);
      }
    } catch (err) {
      console.error('Failed to load passports queue:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadQueue();
  }, []);

  const filteredPassports = passports.filter((p) => {
    const meta = p.passport_metadata;
    const prod = p.product_summary;
    const status = (meta?.status || 'Draft').toUpperCase();

    const matchesSearch =
      !searchQuery ||
      prod?.product_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      prod?.batch_number?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      prod?.producer_organization?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      meta?.passport_id?.toLowerCase().includes(searchQuery.toLowerCase());

    let matchesStatus = true;
    if (statusFilter === 'SUBMITTED') {
      matchesStatus = status === 'SUBMITTED' || status === 'UNDERVERIFICATION' || status === 'UNDER_VERIFICATION';
    } else if (statusFilter === 'DRAFT') {
      matchesStatus = status === 'DRAFT';
    } else if (statusFilter === 'VERIFIED') {
      matchesStatus = status === 'VERIFIED' || status === 'ISSUED';
    } else if (statusFilter === 'CORRECTIONS') {
      matchesStatus = status === 'CORRECTIONSREQUIRED' || status === 'CORRECTIONS_REQUIRED';
    }

    return matchesSearch && matchesStatus;
  });

  const submittedCount = passports.filter(p => {
    const s = (p.passport_metadata?.status || '').toUpperCase();
    return s === 'SUBMITTED' || s === 'UNDERVERIFICATION';
  }).length;

  const verifiedCount = passports.filter(p => {
    const s = (p.passport_metadata?.status || '').toUpperCase();
    return s === 'VERIFIED' || s === 'ISSUED';
  }).length;

  const getStatusBadge = (status: string) => {
    const s = status.toUpperCase();
    if (s === 'SUBMITTED' || s === 'UNDERVERIFICATION' || s === 'UNDER_VERIFICATION') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-sky-100 text-sky-800 border border-sky-300">
          <Clock className="w-3 h-3 text-sky-600 animate-pulse" />
          Awaiting Verification
        </span>
      );
    }
    if (s === 'VERIFIED') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
          Third-Party Verified
        </span>
      );
    }
    if (s === 'CORRECTIONSREQUIRED' || s === 'CORRECTIONS_REQUIRED') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300">
          <AlertTriangle className="w-3 h-3 text-amber-600" />
          Corrections Required
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-300">
        Draft In Preparation
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* KPI Overview Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Awaiting Audit</p>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-black text-sky-700">{submittedCount}</span>
            <span className="text-xs font-bold text-sky-600">Batches</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Ready for verifier opinion</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Verified Passports</p>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-black text-emerald-700">{verifiedCount}</span>
            <span className="text-xs font-bold text-emerald-600">Approved</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Reasonable assurance</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Auditing Agency</p>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-base font-black text-slate-900 truncate">Bureau Veritas UK</span>
          </div>
          <p className="text-[11px] text-indigo-600 font-bold mt-1">Accreditation #NAB-8820</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Nexus Products</p>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-black text-slate-800">{passports.length}</span>
            <span className="text-xs font-semibold text-slate-500">In Graph</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Across all producer tenants</p>
        </div>
      </div>

      {/* Control Header & Filters */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search product, batch number, tenant or passport ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800 font-medium"
            />
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={loadQueue}
              className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors flex items-center gap-1.5"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh Queue</span>
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pt-1">
          <span className="text-xs font-bold text-slate-400 flex items-center gap-1 shrink-0">
            <SlidersHorizontal className="w-3.5 h-3.5" />
            Status:
          </span>
          {(
            [
              { id: 'ALL', label: `All Passports (${passports.length})` },
              { id: 'SUBMITTED', label: `Awaiting Verification (${submittedCount})` },
              { id: 'VERIFIED', label: `Verified (${verifiedCount})` },
              { id: 'DRAFT', label: 'Drafts' },
              { id: 'CORRECTIONS', label: 'Corrections Required' },
            ] as const
          ).map((f) => (
            <button
              key={f.id}
              onClick={() => setStatusFilter(f.id)}
              className={`px-3 py-1 rounded-xl text-xs font-bold whitespace-nowrap transition-colors ${
                statusFilter === f.id
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Table / Card View */}
      {loading ? (
        <div className="bg-white p-16 rounded-2xl border border-slate-200 text-center space-y-3">
          <RefreshCw className="w-8 h-8 text-indigo-600 animate-spin mx-auto" />
          <p className="text-sm font-semibold text-slate-700">Loading submitted product passports from Nexus graph...</p>
        </div>
      ) : filteredPassports.length === 0 ? (
        <div className="bg-white p-16 rounded-2xl border border-slate-200 text-center space-y-3">
          <div className="w-12 h-12 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mx-auto">
            <GitMerge className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-800">No Passports in Queue</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            {searchQuery || statusFilter !== 'ALL'
              ? 'No passports matched your search criteria. Try adjusting your filters.'
              : 'No product passports have been registered or submitted across organisation tenants yet.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredPassports.map((p) => {
            const meta = p.passport_metadata;
            const prod = p.product_summary;
            const fp = p.carbon_footprint;
            const pId = meta?.passport_id || '';
            const status = meta?.status || 'Draft';
            const isSubmitted = status.toUpperCase() === 'SUBMITTED' || status.toUpperCase() === 'UNDERVERIFICATION';

            return (
              <div
                key={pId}
                className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs hover:border-indigo-300 transition-all flex flex-col lg:flex-row lg:items-center justify-between gap-4"
              >
                <div className="space-y-2 flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    {getStatusBadge(status)}
                    <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-slate-100 text-slate-700">
                      Batch: {prod?.batch_number || 'N/A'}
                    </span>
                    <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-slate-100 text-slate-600 flex items-center gap-1">
                      <Building2 className="w-3 h-3 text-slate-500" />
                      {prod?.producer_organization && prod.producer_organization !== 'org_saurient_demo' ? prod.producer_organization : 'Saurient Industrial Ltd'}
                    </span>
                    {prod?.facility?.name && (
                      <span className="text-xs text-slate-500">
                        • Facility: <strong>{prod.facility.name}</strong> ({prod.facility.country_of_origin})
                      </span>
                    )}
                  </div>

                  <div>
                    <h3 className="text-base font-black text-slate-900 truncate">
                      {prod?.product_name || 'Industrial Batch Product'}
                    </h3>
                    <p className="text-xs text-slate-400 font-mono mt-0.5 truncate">
                      Passport ID: {pId}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-4 text-xs pt-1">
                    <div>
                      <span className="text-slate-400">Total Emissions: </span>
                      <strong className="text-slate-900 font-mono">
                        {fp?.total_batch_footprint_kg_co2e ? fp.total_batch_footprint_kg_co2e.toLocaleString() : '0'} kg CO₂e
                      </strong>
                    </div>
                    <div>
                      <span className="text-slate-400">Carbon Intensity: </span>
                      <strong className="text-emerald-700 font-mono font-bold">
                        {fp?.intensity_per_unit?.value ?? '0'} {fp?.intensity_per_unit?.unit || 'kg CO2e/kg'}
                      </strong>
                    </div>
                    <div>
                      <span className="text-slate-400">Primary Data: </span>
                      <strong className="text-indigo-700 font-semibold">100% Primary Telemetry</strong>
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 shrink-0 pt-3 lg:pt-0 border-t lg:border-t-0 border-slate-100">
                  <button
                    onClick={() => navigate(`/passport/detail/${pId}`)}
                    className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl transition-colors flex items-center gap-1.5"
                  >
                    <Eye className="w-3.5 h-3.5 text-slate-500" />
                    <span>Audit & Review</span>
                  </button>

                  <button
                    onClick={() => navigate(`/passport/readiness?id=${pId}`)}
                    className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-colors"
                  >
                    Readiness
                  </button>

                  {isSubmitted && (
                    <>
                      <button
                        onClick={() => navigate(`/mrv/findings?id=${pId}`)}
                        className="px-3 py-2 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 text-xs font-bold rounded-xl transition-colors"
                      >
                        Raise Finding
                      </button>

                      <button
                        onClick={() => navigate(`/mrv/report?id=${pId}`)}
                        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
                      >
                        <FileCheck className="w-3.5 h-3.5" />
                        <span>Issue Verifier Statement</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    </>
                  )}

                  {status.toUpperCase() === 'VERIFIED' && (
                    <div className="flex items-center gap-2">
                      <span className="px-3 py-2 bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold rounded-xl flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Verified & Sealed</span>
                      </span>
                      <button
                        onClick={() => navigate(`/passport/detail/${pId}`)}
                        className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center gap-1"
                      >
                        <span>View Passport</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
