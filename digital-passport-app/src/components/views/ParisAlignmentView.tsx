import React, { useState } from 'react';
import { Search, Check, QrCode, ArrowUpRight, Copy } from 'lucide-react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip } from 'recharts';

export const ParisAlignmentView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<
    'ndc_mapping' | 'company_target' | 'mitigation_actions' | 'transparency_score' | 'passport_summary'
  >('ndc_mapping');

  const [copiedLink, setCopiedLink] = useState(false);

  const tabs = [
    { id: 'ndc_mapping', label: 'NDC Mapping' },
    { id: 'company_target', label: 'Company Climate Target' },
    { id: 'mitigation_actions', label: 'Mitigation Actions' },
    { id: 'transparency_score', label: 'Transparency Score' },
    { id: 'passport_summary', label: 'Passport Summary' },
  ];

  // Data for Reduction Pathway Chart (Company Target Screen)
  const pathwayData = [
    { year: '2024', pct: 0 },
    { year: '2026', pct: 8.4 },
    { year: '2027', pct: 15 },
    { year: '2029', pct: 24 },
    { year: '2030', pct: 30 },
  ];

  const handleCopyLink = () => {
    navigator.clipboard.writeText('https://saurient.io/verify/CP-GH-2026-00481');
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Top Controls Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
          <span>Paris Alignment</span>
          <span>/</span>
          <span className="text-slate-900 font-bold">
            {activeTab === 'ndc_mapping' && 'NDC Mapping'}
            {activeTab === 'company_target' && 'Company Climate Target'}
            {activeTab === 'mitigation_actions' && 'Mitigation Action Register'}
            {activeTab === 'transparency_score' && 'Transparency Score'}
            {activeTab === 'passport_summary' && 'Paris-Aligned Passport Summary'}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="bg-white border border-slate-200 rounded-lg px-3 py-1 text-xs font-medium text-slate-700 shadow-xs flex items-center gap-1.5">
            <span>Saurient Demo Manufacturing</span>
            <span className="text-slate-400 text-[10px]">▾</span>
          </div>
          <div className="bg-white border border-slate-200 rounded-lg px-3 py-1 text-xs font-medium text-slate-700 shadow-xs flex items-center gap-1.5">
            <span>Tema Processing Plant</span>
            <span className="text-slate-400 text-[10px]">▾</span>
          </div>
          <div className="bg-white border border-slate-200 rounded-lg px-3 py-1 text-xs font-medium text-slate-700 shadow-xs flex items-center gap-1.5">
            <span>FY 2026</span>
            <span className="text-slate-400 text-[10px]">▾</span>
          </div>
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search climate records"
              className="bg-white border border-slate-200 rounded-lg pl-8 pr-3 py-1 text-xs text-slate-700 focus:outline-none focus:border-emerald-500 w-36 md:w-44"
            />
          </div>
          <span className="bg-sky-100 text-sky-800 text-[10px] font-mono font-bold px-2.5 py-1 rounded-md tracking-wider">
            SIMULATED
          </span>
        </div>
      </div>

      {/* Main Screen Title Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            {activeTab === 'ndc_mapping' && 'NDC Mapping'}
            {activeTab === 'company_target' && 'Company Climate Target'}
            {activeTab === 'mitigation_actions' && 'Mitigation Action Register'}
            {activeTab === 'transparency_score' && 'Transparency Score'}
            {activeTab === 'passport_summary' && 'Paris-Aligned Passport Summary'}
          </h1>
          <p className="text-xs text-slate-500 font-medium">
            {activeTab === 'ndc_mapping' &&
              'Map company emissions and mitigation activities to the applicable national climate commitment'}
            {activeTab === 'company_target' &&
              'Define the corporate baseline, interim milestones and measurable reduction pathway'}
            {activeTab === 'mitigation_actions' &&
              'Track planned and verified reductions without changing historical carbon records'}
            {activeTab === 'transparency_score' &&
              'Assess whether the climate record is transparent, accurate, complete, consistent and comparable'}
            {activeTab === 'passport_summary' &&
              'Public-facing summary of NDC mapping, company progress and verified product carbon data'}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button className="px-4 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold rounded-xl shadow-xs transition-colors">
            Audit history
          </button>
          <button className="px-4 py-2 bg-[#00E599] hover:bg-[#00c985] text-slate-950 text-xs font-bold rounded-xl shadow-xs transition-colors">
            Save configuration
          </button>
        </div>
      </div>

      {/* Sub Navigation Tabs */}
      <div className="flex items-center gap-1 border-b border-slate-200 overflow-x-auto pb-px">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id as any)}
            className={`px-4 py-2 text-xs font-semibold whitespace-nowrap border-b-2 transition-colors ${
              activeTab === t.id
                ? 'border-emerald-600 text-emerald-700 bg-emerald-50/40 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: NDC MAPPING SCREEN */}
      {/* ========================================================================= */}
      {activeTab === 'ndc_mapping' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left 2/3: National commitment configuration */}
            <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-slate-900 text-sm">National commitment configuration</h3>
                <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-2.5 py-0.5 rounded tracking-wider">
                  DRAFT MAPPING
                </span>
              </div>

              {/* 3x4 Field Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 block mb-1 uppercase tracking-wider">
                    COUNTRY
                  </label>
                  <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 font-semibold text-slate-800">
                    Ghana
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 block mb-1 uppercase tracking-wider">
                    NDC REFERENCE
                  </label>
                  <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 font-semibold text-slate-800 truncate">
                    Ghana National NDC mapping
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 block mb-1 uppercase tracking-wider">
                    NDC VERSION
                  </label>
                  <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 font-semibold text-slate-800">
                    Current configured version
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-400 block mb-1 uppercase tracking-wider">
                    BASE YEAR
                  </label>
                  <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 font-semibold text-slate-800">
                    2019
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 block mb-1 uppercase tracking-wider">
                    TARGET YEAR
                  </label>
                  <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 font-semibold text-slate-800">
                    2030
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 block mb-1 uppercase tracking-wider">
                    TARGET TYPE
                  </label>
                  <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 font-semibold text-slate-800 truncate">
                    Economy-wide + sector measures
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-400 block mb-1 uppercase tracking-wider">
                    APPLICABLE SECTOR
                  </label>
                  <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 font-semibold text-slate-800">
                    Industry and manufacturing
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 block mb-1 uppercase tracking-wider">
                    NATIONAL REDUCTION TARGET
                  </label>
                  <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 font-semibold text-slate-800">
                    Configure from official NDC
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 block mb-1 uppercase tracking-wider">
                    TARGET CONDITIONALITY
                  </label>
                  <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 font-semibold text-slate-800 truncate">
                    Unconditional + conditional measures
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-400 block mb-1 uppercase tracking-wider">
                    COVERED GASES
                  </label>
                  <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 font-semibold text-slate-800">
                    CO₂, CH₄, N₂O, HFCs
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 block mb-1 uppercase tracking-wider">
                    COMPANY INVENTORY MAPPING
                  </label>
                  <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 font-semibold text-slate-800 truncate">
                    Scope 1, 2 and selected Scope 3
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 block mb-1 uppercase tracking-wider">
                    SOURCE URL
                  </label>
                  <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 font-semibold text-slate-800 truncate flex items-center justify-between">
                    <span>Official UNFCCC NDC Registry</span>
                    <ArrowUpRight className="w-3.5 h-3.5 text-slate-400" />
                  </div>
                </div>
              </div>

              {/* Mapped company contribution areas */}
              <div className="space-y-3 pt-2">
                <h4 className="font-bold text-slate-900 text-xs">Mapped company contribution areas</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                      <div>
                        <h5 className="font-bold text-slate-900">Industrial energy efficiency</h5>
                        <p className="text-[10px] text-slate-400">Linked to mitigation register</p>
                      </div>
                    </div>
                    <span className="bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded text-[10px]">
                      MATCHED
                    </span>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                      <div>
                        <h5 className="font-bold text-slate-900">Renewable electricity</h5>
                        <p className="text-[10px] text-slate-400">Linked to mitigation register</p>
                      </div>
                    </div>
                    <span className="bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded text-[10px]">
                      MATCHED
                    </span>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <Check className="w-4 h-4 text-amber-500 shrink-0" />
                      <div>
                        <h5 className="font-bold text-slate-900">Low-carbon transport</h5>
                        <p className="text-[10px] text-slate-400">Linked to mitigation register</p>
                      </div>
                    </div>
                    <span className="bg-amber-100 text-amber-800 font-bold px-2 py-0.5 rounded text-[10px]">
                      PARTIAL
                    </span>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                      <div>
                        <h5 className="font-bold text-slate-900">Waste and circularity</h5>
                        <p className="text-[10px] text-slate-400">Linked to mitigation register</p>
                      </div>
                    </div>
                    <span className="bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded text-[10px]">
                      MATCHED
                    </span>
                  </div>
                </div>
              </div>

              {/* Note Banner */}
              <div className="p-3.5 bg-amber-50 border border-amber-100 rounded-xl text-xs text-amber-800 font-medium">
                Demo configuration: validate all targets and source links against the latest official national NDC.
              </div>
            </div>

            {/* Right 1/3: Mapping readiness */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
              <h3 className="font-bold text-slate-900 text-sm">Mapping readiness</h3>

              {/* Donut Score */}
              <div className="text-center py-2 space-y-2">
                <div className="relative w-36 h-36 mx-auto flex items-center justify-center">
                  <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                    <path
                      className="text-slate-100"
                      strokeWidth="3.5"
                      stroke="currentColor"
                      fill="none"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                    <path
                      className="text-[#00E599]"
                      strokeDasharray="82, 100"
                      strokeWidth="3.5"
                      strokeLinecap="round"
                      stroke="currentColor"
                      fill="none"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-3xl font-black text-slate-900">82%</span>
                  </div>
                </div>
                <h4 className="font-bold text-xs text-slate-900">8 of 10 fields</h4>
                <p className="text-[11px] text-slate-400">Mandatory mapping complete</p>
                <span className="inline-block bg-amber-100 text-amber-800 text-[10px] font-bold px-2.5 py-0.5 rounded">
                  REVIEW REQUIRED
                </span>
              </div>

              {/* Quality checks */}
              <div className="space-y-2.5 pt-2">
                <h4 className="font-bold text-slate-900 text-xs">Quality checks</h4>
                <div className="space-y-2 text-xs">
                  <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                    <span className="text-slate-700 font-medium">Country and sector</span>
                    <span className="text-emerald-700 bg-emerald-100 text-[10px] font-bold px-2 py-0.5 rounded">
                      PASSED
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                    <span className="text-slate-700 font-medium">Target period</span>
                    <span className="text-emerald-700 bg-emerald-100 text-[10px] font-bold px-2 py-0.5 rounded">
                      PASSED
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                    <span className="text-slate-700 font-medium">Official source version</span>
                    <span className="text-amber-800 bg-amber-100 text-[10px] font-bold px-2 py-0.5 rounded">
                      REVIEW
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                    <span className="text-slate-700 font-medium">National target value</span>
                    <span className="text-amber-800 bg-amber-100 text-[10px] font-bold px-2 py-0.5 rounded">
                      REVIEW
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                    <span className="text-slate-700 font-medium">Inventory-category mapping</span>
                    <span className="text-emerald-700 bg-emerald-100 text-[10px] font-bold px-2 py-0.5 rounded">
                      PASSED
                    </span>
                  </div>
                </div>
              </div>

              {/* Purpose Green Box */}
              <div className="p-4 bg-emerald-50/70 border border-emerald-100 rounded-xl space-y-1">
                <h4 className="font-bold text-xs text-emerald-900">Purpose</h4>
                <p className="text-[11px] text-emerald-700 leading-relaxed">
                  Shows how company data may contribute to national climate reporting and targets. It is not government
                  certification.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: COMPANY CLIMATE TARGET SCREEN */}
      {/* ========================================================================= */}
      {activeTab === 'company_target' && (
        <div className="space-y-6">
          {/* Top 4 KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <span className="text-xs font-semibold text-slate-400 block mb-1">Baseline emissions</span>
              <span className="text-2xl font-black text-slate-900">12,842 tCO₂e</span>
              <span className="text-xs font-semibold text-slate-400 block mt-1">FY 2024 · Scope 1, 2 and selected 3</span>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <span className="text-xs font-semibold text-slate-400 block mb-1">Current progress</span>
              <span className="text-2xl font-black text-emerald-600">-8.4%</span>
              <span className="text-xs font-semibold text-emerald-600 block mt-1">1,079 tCO₂e reduction</span>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <span className="text-xs font-semibold text-slate-400 block mb-1">2030 target</span>
              <span className="text-2xl font-black text-slate-900">-30%</span>
              <span className="text-xs font-semibold text-slate-400 block mt-1">Target emissions 8,989 tCO₂e</span>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <span className="text-xs font-semibold text-slate-400 block mb-1">Net-zero ambition</span>
              <span className="text-2xl font-black text-slate-900">2050</span>
              <span className="text-xs font-semibold text-slate-400 block mt-1">Board-approved ambition</span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left 2/3: Target configuration & Reduction pathway */}
            <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-slate-900 text-sm">Target configuration</h3>
                <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2.5 py-0.5 rounded tracking-wider">
                  BOARD APPROVED
                </span>
              </div>

              {/* 2x3 Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 block mb-1 uppercase tracking-wider">
                    BASELINE YEAR
                  </label>
                  <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 font-semibold text-slate-800">
                    FY 2024
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 block mb-1 uppercase tracking-wider">
                    TARGET YEAR
                  </label>
                  <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 font-semibold text-slate-800">
                    2030
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 block mb-1 uppercase tracking-wider">
                    TARGET METHOD
                  </label>
                  <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 font-semibold text-slate-800">
                    Absolute emissions reduction
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-400 block mb-1 uppercase tracking-wider">
                    SCOPE COVERAGE
                  </label>
                  <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 font-semibold text-slate-800">
                    Scope 1 + 2 + material Scope 3
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 block mb-1 uppercase tracking-wider">
                    REDUCTION TARGET
                  </label>
                  <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 font-semibold text-slate-800">
                    30% below FY 2024
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 block mb-1 uppercase tracking-wider">
                    NET-ZERO YEAR
                  </label>
                  <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 font-semibold text-slate-800">
                    2050
                  </div>
                </div>
              </div>

              {/* Reduction Pathway Chart */}
              <div className="space-y-3 pt-2">
                <h4 className="font-bold text-slate-900 text-xs">Reduction pathway</h4>
                <div className="h-52 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={pathwayData} margin={{ top: 20, right: 30, left: 10, bottom: 5 }}>
                      <XAxis dataKey="year" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                      <YAxis hide domain={[0, 35]} />
                      <Tooltip formatter={(value: any) => [`${value}% reduction`, 'Progress']} />
                      <Line
                        type="monotone"
                        dataKey="pct"
                        stroke="#00E599"
                        strokeWidth={4}
                        dot={{ r: 6, fill: '#00E599', stroke: '#ffffff', strokeWidth: 2 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Banner Note */}
              <div className="p-3.5 bg-emerald-50 border border-emerald-100 rounded-xl text-xs text-emerald-800 font-semibold">
                On track: current reduction is 0.9 percentage points ahead of the FY 2026 milestone.
              </div>
            </div>

            {/* Right 1/3: Milestones and ownership */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6 flex flex-col justify-between">
              <div>
                <h3 className="font-bold text-slate-900 text-sm mb-4">Milestones and ownership</h3>
                <div className="space-y-3 text-xs">
                  <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-slate-900">FY 2026</h4>
                      <p className="text-[10px] text-slate-500">7.5% reduction</p>
                    </div>
                    <span className="bg-emerald-100 text-emerald-800 font-bold px-2.5 py-0.5 rounded text-[10px]">
                      ACHIEVED
                    </span>
                  </div>

                  <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-slate-900">FY 2027</h4>
                      <p className="text-[10px] text-slate-500">15% reduction</p>
                    </div>
                    <span className="bg-emerald-100 text-emerald-800 font-bold px-2.5 py-0.5 rounded text-[10px]">
                      ON TRACK
                    </span>
                  </div>

                  <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-slate-900">FY 2029</h4>
                      <p className="text-[10px] text-slate-500">24% reduction</p>
                    </div>
                    <span className="bg-sky-100 text-sky-800 font-bold px-2.5 py-0.5 rounded text-[10px]">
                      PLANNED
                    </span>
                  </div>

                  <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-slate-900">FY 2030</h4>
                      <p className="text-[10px] text-slate-500">30% reduction</p>
                    </div>
                    <span className="bg-sky-100 text-sky-800 font-bold px-2.5 py-0.5 rounded text-[10px]">
                      TARGET
                    </span>
                  </div>
                </div>
              </div>

              {/* Ownership details */}
              <div className="border-t border-slate-100 pt-4 space-y-3 text-xs">
                <div>
                  <span className="text-[10px] text-slate-400 font-semibold block">Target owner</span>
                  <span className="font-bold text-slate-900">Sustainability Manager</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-semibold block">Approval authority</span>
                  <span className="font-bold text-slate-900">Company Board / Authorised Signatory</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-semibold block">Next review</span>
                  <span className="font-bold text-slate-900">31 December 2026</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: MITIGATION ACTION REGISTER SCREEN */}
      {/* ========================================================================= */}
      {activeTab === 'mitigation_actions' && (
        <div className="space-y-6">
          {/* 4 Top KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <span className="text-xs font-semibold text-slate-400 block mb-1">Active initiatives</span>
              <span className="text-2xl font-black text-slate-900">8</span>
              <span className="text-xs font-semibold text-slate-400 block mt-1">Four shown in PoC</span>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <span className="text-xs font-semibold text-slate-400 block mb-1">Expected reduction</span>
              <span className="text-2xl font-black text-slate-900">2,180 tCO₂e/year</span>
              <span className="text-xs font-semibold text-slate-400 block mt-1">Across approved actions</span>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <span className="text-xs font-semibold text-slate-400 block mb-1">Verified reduction</span>
              <span className="text-2xl font-black text-emerald-600">1,079 tCO₂e</span>
              <span className="text-xs font-semibold text-emerald-600 block mt-1">Current reporting period</span>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <span className="text-xs font-semibold text-slate-400 block mb-1">Committed investment</span>
              <span className="text-2xl font-black text-slate-900">₹3.84 Cr</span>
              <span className="text-xs font-semibold text-slate-400 block mt-1">Approved capex and opex</span>
            </div>
          </div>

          {/* Mitigation Portfolio Table Card */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-900 text-sm">Mitigation portfolio</h3>
              <div className="flex items-center gap-2">
                <button className="px-3 py-1 bg-sky-50 hover:bg-sky-100 border border-sky-200 text-sky-700 font-bold text-[10px] rounded-md tracking-wider">
                  EXPORT CSV
                </button>
                <button className="px-3 py-1 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-800 font-bold text-[10px] rounded-md tracking-wider">
                  ADD ACTION
                </button>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    <th className="pb-3 pr-4">ACTION</th>
                    <th className="pb-3 px-4">FACILITY / TYPE</th>
                    <th className="pb-3 px-4">EXPECTED</th>
                    <th className="pb-3 px-4">ACTUAL VERIFIED</th>
                    <th className="pb-3 px-4">INVESTMENT</th>
                    <th className="pb-3 px-4">STATUS</th>
                    <th className="pb-3 pl-4">NDC AREA</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  <tr>
                    <td className="py-4 pr-4">
                      <span className="font-bold text-slate-900 block">1.2 MW rooftop solar</span>
                      <span className="text-[10px] text-slate-400 font-mono">ACT-001 · FY 2026</span>
                    </td>
                    <td className="py-4 px-4 text-slate-600 font-medium">Tema · Renewable electricity</td>
                    <td className="py-4 px-4 font-bold text-slate-900">1,260 tCO₂e</td>
                    <td className="py-4 px-4 font-bold text-emerald-600">642 tCO₂e</td>
                    <td className="py-4 px-4 font-bold text-slate-900">₹2.40 Cr</td>
                    <td className="py-4 px-4">
                      <span className="bg-sky-100 text-sky-800 font-bold px-2.5 py-0.5 rounded text-[10px]">
                        IN PROGRESS
                      </span>
                    </td>
                    <td className="py-4 pl-4 text-slate-600 font-medium">Renewable power</td>
                  </tr>

                  <tr>
                    <td className="py-4 pr-4">
                      <span className="font-bold text-slate-900 block">Boiler efficiency upgrade</span>
                      <span className="text-[10px] text-slate-400 font-mono">ACT-002 · FY 2026</span>
                    </td>
                    <td className="py-4 px-4 text-slate-600 font-medium">Tema · Energy efficiency</td>
                    <td className="py-4 px-4 font-bold text-slate-900">420 tCO₂e</td>
                    <td className="py-4 px-4 font-bold text-emerald-600">286 tCO₂e</td>
                    <td className="py-4 px-4 font-bold text-slate-900">₹68 L</td>
                    <td className="py-4 px-4">
                      <span className="bg-emerald-100 text-emerald-800 font-bold px-2.5 py-0.5 rounded text-[10px]">
                        VERIFIED
                      </span>
                    </td>
                    <td className="py-4 pl-4 text-slate-600 font-medium">Industrial efficiency</td>
                  </tr>

                  <tr>
                    <td className="py-4 pr-4">
                      <span className="font-bold text-slate-900 block">VFD motors and controls</span>
                      <span className="text-[10px] text-slate-400 font-mono">ACT-003 · FY 2026</span>
                    </td>
                    <td className="py-4 px-4 text-slate-600 font-medium">Tema · Energy efficiency</td>
                    <td className="py-4 px-4 font-bold text-slate-900">310 tCO₂e</td>
                    <td className="py-4 px-4 font-bold text-emerald-600">151 tCO₂e</td>
                    <td className="py-4 px-4 font-bold text-slate-900">₹46 L</td>
                    <td className="py-4 px-4">
                      <span className="bg-emerald-100 text-emerald-800 font-bold px-2.5 py-0.5 rounded text-[10px]">
                        VERIFIED
                      </span>
                    </td>
                    <td className="py-4 pl-4 text-slate-600 font-medium">Industrial efficiency</td>
                  </tr>

                  <tr>
                    <td className="py-4 pr-4">
                      <span className="font-bold text-slate-900 block">Low-carbon packaging</span>
                      <span className="text-[10px] text-slate-400 font-mono">ACT-004 · FY 2026</span>
                    </td>
                    <td className="py-4 px-4 text-slate-600 font-medium">Supply chain · Supplier action</td>
                    <td className="py-4 px-4 font-bold text-slate-900">190 tCO₂e</td>
                    <td className="py-4 px-4 font-medium text-slate-400">Pending</td>
                    <td className="py-4 px-4 font-bold text-slate-900">₹30 L</td>
                    <td className="py-4 px-4">
                      <span className="bg-amber-100 text-amber-800 font-bold px-2.5 py-0.5 rounded text-[10px]">
                        DATA REVIEW
                      </span>
                    </td>
                    <td className="py-4 pl-4 text-slate-600 font-medium">Circular economy</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Note banner */}
            <div className="p-3.5 bg-amber-50 border border-amber-100 rounded-xl text-xs text-amber-800 font-medium mt-4">
              Reductions are reported only after evidence review; expected reductions remain clearly separated from verified results.
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: TRANSPARENCY SCORE SCREEN */}
      {/* ========================================================================= */}
      {activeTab === 'transparency_score' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left 1/3: Overall transparency score */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
              <h3 className="font-bold text-slate-900 text-sm">Overall transparency score</h3>

              {/* Big Donut Gauge */}
              <div className="text-center py-4 space-y-3">
                <div className="relative w-44 h-44 mx-auto flex items-center justify-center">
                  <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                    <path
                      className="text-slate-100"
                      strokeWidth="3.5"
                      stroke="currentColor"
                      fill="none"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                    <path
                      className="text-[#00E599]"
                      strokeDasharray="91, 100"
                      strokeWidth="3.5"
                      strokeLinecap="round"
                      stroke="currentColor"
                      fill="none"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-4xl font-black text-slate-900">91</span>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                      OUT OF 100
                    </span>
                  </div>
                </div>
                <span className="inline-block bg-emerald-100 text-emerald-800 text-xs font-bold px-3 py-1 rounded-full">
                  HIGH CONFIDENCE
                </span>
              </div>

              {/* Score interpretation */}
              <div className="space-y-3 pt-2">
                <h4 className="font-bold text-slate-900 text-xs">Score interpretation</h4>
                <div className="p-3.5 bg-emerald-50 border border-emerald-100 rounded-xl">
                  <h5 className="font-bold text-xs text-emerald-900">Ready for independent verification</h5>
                  <p className="text-[11px] text-emerald-700 mt-0.5">Two non-material improvements remain open.</p>
                </div>
              </div>

              {/* Audit Details */}
              <div className="border-t border-slate-100 pt-4 space-y-2 text-xs">
                <div>
                  <span className="text-[10px] text-slate-400 font-semibold block">Last calculated</span>
                  <span className="font-bold text-slate-900">26 September 2026 · Calculation v3.2</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-semibold block">Scoring rulebook</span>
                  <span className="font-bold text-slate-900 font-mono">PARIS-ETF-DEMO-v1.0</span>
                </div>
              </div>

              {/* Demo Notice Box */}
              <div className="p-3.5 bg-amber-50 border border-amber-100 rounded-xl text-xs text-amber-800 font-medium">
                Demo score—not an official UNFCCC assessment.
              </div>
            </div>

            {/* Right 2/3: Transparency dimensions */}
            <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
              <h3 className="font-bold text-slate-900 text-sm">Transparency dimensions</h3>

              {/* 8 Dimension Bars */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
                {/* 1. Transparency */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900">Transparency</span>
                    <span className="font-bold text-slate-900">96%</span>
                  </div>
                  <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-[#00E599] rounded-full" style={{ width: '96%' }} />
                  </div>
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="text-slate-400">Sources, methods and assumptions visible</span>
                    <span className="bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.5 rounded">PASSED</span>
                  </div>
                </div>

                {/* 2. Accuracy */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900">Accuracy</span>
                    <span className="font-bold text-slate-900">92%</span>
                  </div>
                  <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-[#00E599] rounded-full" style={{ width: '92%' }} />
                  </div>
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="text-slate-400">Factors validated and unit checks passed</span>
                    <span className="bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.5 rounded">PASSED</span>
                  </div>
                </div>

                {/* 3. Completeness */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900">Completeness</span>
                    <span className="font-bold text-slate-900">94%</span>
                  </div>
                  <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-[#00E599] rounded-full" style={{ width: '94%' }} />
                  </div>
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="text-slate-400">Six minor data gaps remain</span>
                    <span className="bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.5 rounded">PASSED</span>
                  </div>
                </div>

                {/* 4. Consistency */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900">Consistency</span>
                    <span className="font-bold text-slate-900">90%</span>
                  </div>
                  <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-[#00E599] rounded-full" style={{ width: '90%' }} />
                  </div>
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="text-slate-400">Version and recalculation history complete</span>
                    <span className="bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.5 rounded">PASSED</span>
                  </div>
                </div>

                {/* 5. Comparability */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900">Comparability</span>
                    <span className="font-bold text-slate-900">88%</span>
                  </div>
                  <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-[#00E599] rounded-full" style={{ width: '88%' }} />
                  </div>
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="text-slate-400">Units and boundaries standardised</span>
                    <span className="bg-amber-100 text-amber-800 font-bold px-1.5 py-0.5 rounded">IMPROVE</span>
                  </div>
                </div>

                {/* 6. Primary data */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900">Primary data</span>
                    <span className="font-bold text-slate-900">81%</span>
                  </div>
                  <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-sky-400 rounded-full" style={{ width: '81%' }} />
                  </div>
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="text-slate-400">Target is 85% for material activities</span>
                    <span className="bg-amber-100 text-amber-800 font-bold px-1.5 py-0.5 rounded">IMPROVE</span>
                  </div>
                </div>

                {/* 7. Evidence coverage */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900">Evidence coverage</span>
                    <span className="font-bold text-slate-900">95%</span>
                  </div>
                  <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-[#00E599] rounded-full" style={{ width: '95%' }} />
                  </div>
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="text-slate-400">179 of 186 evidence items accepted</span>
                    <span className="bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.5 rounded">PASSED</span>
                  </div>
                </div>

                {/* 8. Verification */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900">Verification</span>
                    <span className="font-bold text-slate-900">91%</span>
                  </div>
                  <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-[#00E599] rounded-full" style={{ width: '91%' }} />
                  </div>
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="text-slate-400">Independent review in progress</span>
                    <span className="bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.5 rounded">PASSED</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 5: PARIS-ALIGNED PASSPORT SUMMARY SCREEN */}
      {/* ========================================================================= */}
      {activeTab === 'passport_summary' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left 2/3: Main Passport Document Card */}
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                {/* Dark Banner Header */}
                <div className="bg-[#0C1322] text-white p-6 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-[#00E599] text-slate-950 font-black text-xl flex items-center justify-center">
                      S
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 tracking-wider uppercase block">
                        SAURIENT CARBON PASSPORT
                      </span>
                      <h2 className="text-xl font-bold tracking-tight">Paris Alignment Summary</h2>
                    </div>
                  </div>

                  <span className="bg-[#15342A] text-[#00E599] border border-emerald-500/30 text-xs font-bold px-3 py-1 rounded-full">
                    ISSUED
                  </span>
                </div>

                {/* White Card Body */}
                <div className="p-6 space-y-6">
                  {/* Product Header */}
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                      PRODUCT
                    </span>
                    <h3 className="text-xl font-bold text-slate-900">Refined Cocoa Butter</h3>
                    <p className="text-xs text-slate-500 font-medium mt-0.5">
                      Batch <span className="font-mono text-slate-800">CB-2026-001</span> · Tema Processing Plant · Ghana
                    </p>
                  </div>

                  {/* 3 KPI Summary Boxes */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                      <span className="text-slate-400 text-[10px] font-semibold block mb-1">Product footprint</span>
                      <span className="text-xl font-black text-slate-900">2.84 kgCO₂e/kg</span>
                      <span className="text-[10px] text-slate-400 block mt-1">Cradle-to-gate</span>
                    </div>

                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                      <span className="text-slate-400 text-[10px] font-semibold block mb-1">Company progress</span>
                      <span className="text-xl font-black text-emerald-600">-8.4%</span>
                      <span className="text-[10px] text-emerald-600 block mt-1">Against FY 2024 baseline</span>
                    </div>

                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                      <span className="text-slate-400 text-[10px] font-semibold block mb-1">Verified reductions</span>
                      <span className="text-xl font-black text-slate-900">1,079 tCO₂e</span>
                      <span className="text-[10px] text-slate-400 block mt-1">Current reporting period</span>
                    </div>
                  </div>

                  {/* NDC alignment section */}
                  <div className="space-y-3 pt-2">
                    <h4 className="font-bold text-slate-900 text-xs">NDC alignment</h4>
                    <div className="p-4 bg-slate-50/80 rounded-xl border border-slate-200/80 space-y-4 text-xs">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div>
                          <span className="text-[10px] text-slate-400 font-semibold block mb-1">Country</span>
                          <span className="font-bold text-slate-900">Ghana</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 font-semibold block mb-1">Sector mapping</span>
                          <span className="font-bold text-slate-900">Industry and manufacturing</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 font-semibold block mb-1">Target period</span>
                          <span className="font-bold text-slate-900">2030</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 font-semibold block mb-1">Contribution areas</span>
                          <span className="font-bold text-slate-900">Efficiency · Renewable power</span>
                        </div>
                      </div>

                      <div>
                        <span className="inline-block bg-sky-100 text-sky-800 font-bold px-2.5 py-1 rounded text-[10px] tracking-wider">
                          MAPPED TO COMPANY ACTIONS
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Trust and verification */}
                  <div className="pt-2">
                    <h4 className="font-bold text-slate-900 text-xs mb-2">Trust and verification</h4>
                  </div>

                  {/* Disclaimer Note */}
                  <div className="p-4 bg-amber-50 border border-amber-100 rounded-xl text-xs text-amber-900 font-semibold text-center">
                    Paris-aligned data record—not a UNFCCC or government certification.
                  </div>
                </div>
              </div>
            </div>

            {/* Right 1/3: Public verification card */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6 flex flex-col justify-between">
              <div>
                <h3 className="font-bold text-slate-900 text-sm mb-4">Public verification</h3>

                {/* QR Code Box */}
                <div className="text-center p-6 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                  <div className="w-36 h-36 mx-auto bg-white p-2.5 rounded-xl border border-slate-200 shadow-xs flex items-center justify-center">
                    <QrCode className="w-28 h-28 text-slate-900" />
                  </div>
                  <div>
                    <h4 className="font-bold text-xs text-slate-900">Scan to verify</h4>
                    <p className="text-[11px] text-slate-400 font-mono mt-0.5">Passport CP-GH-2026-00481</p>
                  </div>
                  <span className="inline-block bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2.5 py-0.5 rounded tracking-wider">
                    SIGNATURE VALID
                  </span>
                </div>

                {/* Verification status box */}
                <div className="mt-4 p-4 bg-emerald-50/80 border border-emerald-100 rounded-xl space-y-1">
                  <span className="text-[10px] text-slate-400 font-semibold block">Verification status</span>
                  <p className="text-xs font-bold text-emerald-900">Issued · Valid · Not revoked</p>
                </div>

                {/* Publicly displayed list */}
                <div className="mt-4 space-y-1 text-xs">
                  <span className="text-[10px] text-slate-400 font-semibold block">Publicly displayed</span>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    Product identity, footprint, issuer, verifier, Paris-alignment summary and current status.
                  </p>
                </div>
              </div>

              {/* Action Button */}
              <button
                onClick={handleCopyLink}
                className="w-full py-3 bg-[#00E599] hover:bg-[#00c985] text-slate-950 font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2"
              >
                <Copy className="w-4 h-4" />
                <span>{copiedLink ? 'Link Copied!' : 'Copy public verification link'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
