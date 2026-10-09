import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, RefreshCw, Download, Search, Building2, Factory, Package, Zap, Calculator, ShieldCheck, Lock, ArrowRight } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

export const CompanyDashboardView: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('Overview');
  const tabs = ['Overview', 'Priority Tasks', 'Notifications', 'Recent Activity'];

  const journeySteps = [
    { num: 1, label: 'Organisation', icon: Building2, path: '/organisation' },
    { num: 2, label: 'Facility', icon: Factory, path: '/organisation?tab=asset-tree' },
    { num: 3, label: 'Product Batch', icon: Package, path: '/products/new' },
    { num: 4, label: 'Inputs & Evidence', icon: Zap, path: '/data?tab=telemetry' },
    { num: 5, label: 'Calculation v1.0', icon: Calculator, path: '/pcf?tab=inventory' },
    { num: 6, label: 'Submit Verification', icon: ShieldCheck, path: '/passport/readiness' },
    { num: 7, label: 'Issued Passport', icon: Lock, path: '/passport/registry' },
  ];

  const kpis = [
    { title: 'Total CCF', val: '12,842 tCO₂e', subtitle: '↓ 8.4% vs baseline', color: 'text-emerald-600' },
    { title: 'PCF Intensity', val: '2.84 kgCO₂e/kg', subtitle: '↓ 6.1% latest batch', color: 'text-emerald-600' },
    { title: 'Data Completeness', val: '94.2%', subtitle: '↑ 4.6% this period', color: 'text-emerald-600' },
    { title: 'Passport Readiness', val: '8 of 10 gates', subtitle: '2 verification actions open', color: 'text-emerald-600' },
  ];

  const monthData = [
    { month: 'O', val: 42, fill: '#f59e0b' },
    { month: 'N', val: 56, fill: '#10b981' },
    { month: 'D', val: 48, fill: '#06b6d4' },
    { month: 'J', val: 68, fill: '#06b6d4' },
    { month: 'F', val: 52, fill: '#10b981' },
    { month: 'M', val: 76, fill: '#f59e0b' },
    { month: 'A', val: 62, fill: '#06b6d4' },
    { month: 'M', val: 82, fill: '#10b981' },
    { month: 'J', val: 70, fill: '#06b6d4' },
    { month: 'J', val: 88, fill: '#06b6d4' },
    { month: 'A', val: 78, fill: '#10b981' },
    { month: 'S', val: 94, fill: '#06b6d4' },
  ];

  const gates = [
    {
      title: 'Identity and boundary',
      subtitle: 'Complete and approved',
      badge: 'PASSED',
      badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200/60',
      icon: Check,
      iconClass: 'text-emerald-600 bg-emerald-50',
    },
    {
      title: 'Evidence and data quality',
      subtitle: 'Two items need attention',
      badge: 'REVIEW',
      badgeClass: 'bg-amber-50 text-amber-700 border-amber-200/60',
      icon: RefreshCw,
      iconClass: 'text-amber-600 bg-amber-50',
    },
    {
      title: 'Version provenance',
      subtitle: 'Immutable calculation trace',
      badge: 'AVAILABLE',
      badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200/60',
      icon: Check,
      iconClass: 'text-emerald-600 bg-emerald-50',
    },
  ];

  const records = [
    { name: 'Passport Draft: Hot-Rolled Steel Coil', type: 'Batch ST-2026-00981', status: 'Draft', statusClass: 'bg-slate-100 text-slate-700 border-slate-300', val: '1.63 kgCO₂e/kg', path: '/passport/readiness?id=pas-st-2026-00981' },
    { name: 'Independent Verification Queue', type: 'Batch CB-2026-00481 (Cocoa)', status: 'Submitted', statusClass: 'bg-blue-100 text-blue-800 border-blue-300', val: 'Under Bureau Veritas', path: '/mrv' },
    { name: 'Verified Claim: Aluminium Housing', type: 'Batch AL-2026-0012', status: 'Verified', statusClass: 'bg-emerald-100 text-emerald-800 border-emerald-300', val: 'Sign & Issue Ready', path: '/passport/sign-issue' },
    { name: 'Issued Passport: Portland Cement', type: 'Batch CEM-2026-08', status: 'Issued', statusClass: 'bg-indigo-100 text-indigo-800 border-indigo-300', val: 'Minted & Sealed', path: '/passport/registry' },
    { name: 'EU Customs Submission', type: 'Batch ST-2026-0042', status: 'Submitted to Agency', statusClass: 'bg-teal-100 text-teal-900 border-teal-300', val: 'EU CBAM Lodged', path: '/passport/registry' },
  ];

  return (
    <div className="space-y-6">
      {/* Top Header Row with Breadcrumb & Filters */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
          <span className="hover:text-slate-800">Home</span>
          <span>/</span>
          <span className="text-slate-900 font-bold">Company Dashboard</span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
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
              placeholder="Search records"
              className="bg-white border border-slate-200 rounded-lg pl-8 pr-3 py-1 text-xs text-slate-700 focus:outline-none focus:border-emerald-500 w-36 md:w-44"
            />
          </div>
          <span className="bg-sky-100 text-sky-800 text-[10px] font-mono font-bold px-2.5 py-1 rounded-md tracking-wider">
            SIMULATED
          </span>
        </div>
      </div>

      {/* Main Title Banner & Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Company Dashboard</h1>
          <p className="text-xs text-slate-500 font-medium">Carbon, data quality, compliance and issuance health at a glance</p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/trace')}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center gap-2"
          >
            <Search className="w-3.5 h-3.5 text-emerald-400" />
            <span>Trace Carbon Number</span>
          </button>
          <button className="px-4 py-2 bg-[#00E599] hover:bg-[#00c985] text-slate-950 text-xs font-bold rounded-xl shadow-xs transition-colors">
            Primary action
          </button>
        </div>
      </div>

      {/* PoC End-to-End Product Journey Card */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 p-5 rounded-2xl border border-slate-800 shadow-md text-white">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="bg-emerald-500/20 text-emerald-400 text-[10px] font-extrabold px-2.5 py-0.5 rounded-md border border-emerald-500/30 uppercase tracking-wider">
                END-TO-END DEMO JOURNEY
              </span>
              <span className="text-slate-400 text-xs font-mono">7-STEP PROVENANCE PIPELINE</span>
            </div>
            <h2 className="text-base font-bold text-white tracking-tight">Complete Product Carbon Passport Journey</h2>
          </div>
          <button
            onClick={() => navigate('/trace')}
            className="text-xs bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold px-3.5 py-1.5 rounded-lg transition flex items-center gap-1.5"
          >
            <span>Trace Carbon #PASS-2026-981-v1.0</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
          {journeySteps.map((st) => {
            const Icon = st.icon;
            return (
              <button
                key={st.num}
                onClick={() => navigate(st.path)}
                className="flex flex-col items-center p-3 rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 hover:border-emerald-500/50 transition text-center group cursor-pointer"
              >
                <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 group-hover:bg-emerald-500 group-hover:text-slate-950 transition mb-1.5">
                  <Icon className="w-4 h-4" />
                </div>
                <span className="text-[10px] font-mono font-bold text-slate-400 group-hover:text-slate-300">STEP {st.num}</span>
                <span className="text-[11px] font-bold text-slate-100 group-hover:text-white truncate w-full mt-0.5">
                  {st.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Sub Navigation Tabs */}
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

      {/* KPI Cards (4 columns) */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {kpis.map((k, i) => (
          <div key={i} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
            <span className="text-xs font-semibold text-slate-400 block mb-1">{k.title}</span>
            <span className="text-2xl font-black text-slate-900 tracking-tight">{k.val}</span>
            <span className={`text-xs font-semibold block mt-1 ${k.color}`}>{k.subtitle}</span>
          </div>
        ))}
      </div>

      {/* Middle Row (2/3 Chart + 1/3 Priority actions) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2/3: Emissions by scope */}
        <div className="lg:col-span-2 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <h3 className="font-bold text-slate-900 text-sm mb-4">Emissions by scope</h3>

          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthData} barCategoryGap="25%">
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <YAxis hide />
                <Tooltip />
                <Bar dataKey="val" radius={[4, 4, 0, 0]}>
                  {monthData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-slate-100 text-xs">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#06b6d4]"></span>
                <span className="text-slate-600 font-medium text-[11px]">Current period</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#10b981]"></span>
                <span className="text-slate-600 font-medium text-[11px]">Verified / primary data</span>
              </div>
            </div>
            <span className="text-[11px] text-slate-400 font-medium">Units and boundary shown in every chart</span>
          </div>
        </div>

        {/* Right 1/3: Priority actions */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between space-y-4">
          <h3 className="font-bold text-slate-900 text-sm">Priority actions</h3>

          <div className="space-y-3 flex-1 flex flex-col justify-center">
            {gates.map((g, i) => {
              const IconComp = g.icon;
              return (
                <div key={i} className="p-3.5 bg-slate-50/70 rounded-xl border border-slate-100 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className={`p-1.5 rounded-lg shrink-0 ${g.iconClass}`}>
                      <IconComp className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="font-bold text-xs text-slate-900">{g.title}</h4>
                      <p className="text-[11px] text-slate-400">{g.subtitle}</p>
                    </div>
                  </div>
                  <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold border tracking-wider ${g.badgeClass}`}>
                    {g.badge}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Bottom Card: Records and provenance */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-slate-900 text-sm">Records and provenance</h3>

          <div className="flex items-center gap-2">
            <button className="px-3 py-1 bg-sky-50 hover:bg-sky-100 border border-sky-200 text-sky-700 font-bold text-[10px] rounded-md tracking-wider transition-colors">
              EXPORT CSV
            </button>
            <button className="px-3 py-1 bg-sky-50 hover:bg-sky-100 border border-sky-200 text-sky-700 font-bold text-[10px] rounded-md tracking-wider transition-colors">
              PRINTABLE HTML
            </button>
          </div>
        </div>

        <div className="divide-y divide-slate-100 text-xs">
          {records.map((r, i) => (
            <div
              key={i}
              onClick={() => r.path && navigate(r.path)}
              className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/80 px-2 rounded-xl transition cursor-pointer"
            >
              <div className="w-64">
                <span className="font-bold text-slate-900 block">{r.name}</span>
              </div>
              <div className="w-48 text-slate-500 font-medium">
                <span>{r.type}</span>
              </div>
              <div className="w-44">
                <span className={`border font-semibold px-3 py-1 rounded-full text-[11px] inline-block ${r.statusClass}`}>
                  {r.status}
                </span>
              </div>
              <div className="text-right font-medium text-slate-500 text-[11px] w-36">
                <span>{r.val}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
