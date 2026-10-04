import React, { useState } from 'react';
import { Check, RefreshCw, Download, Search, ShieldCheck } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { useScenario } from '../../context/ScenarioContext';

export const CompanyDashboardView: React.FC = () => {
  const { scenario } = useScenario();
  const [activeTab, setActiveTab] = useState('Overview');
  const tabs = ['Overview', 'Priority Tasks', 'Notifications', 'Recent Activity'];

  const isSteel = scenario === 'steel';

  const kpis = isSteel
    ? [
        { title: 'Total CCF (Corporate)', val: '16,330 tCO₂e', subtitle: '↓ 12.2% vs 2025 baseline', color: 'text-emerald-600' },
        { title: 'PCF Steel Intensity', val: '1.633 kgCO₂e/kg', subtitle: 'Batch ST-2026-00981 verified', color: 'text-emerald-600' },
        { title: 'Data Completeness', val: '98.0%', subtitle: 'PAS800 SCADA Telemetry active', color: 'text-emerald-600' },
        { title: 'Passport Readiness', val: '10 of 10 gates', subtitle: '100% verified & issuance ready', color: 'text-emerald-600' },
      ]
    : [
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
      subtitle: 'Complete and approved (ISO 14067)',
      badge: 'PASSED',
      badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200/60',
      icon: Check,
      iconClass: 'text-emerald-600 bg-emerald-50',
    },
    {
      title: 'Evidence and data quality',
      subtitle: isSteel ? 'PAS800 SCADA telemetry 98% complete' : 'Two items need attention',
      badge: isSteel ? 'PASSED' : 'REVIEW',
      badgeClass: isSteel ? 'bg-emerald-50 text-emerald-700 border-emerald-200/60' : 'bg-amber-50 text-amber-700 border-amber-200/60',
      icon: isSteel ? Check : RefreshCw,
      iconClass: isSteel ? 'text-emerald-600 bg-emerald-50' : 'text-amber-600 bg-amber-50',
    },
    {
      title: 'Version provenance',
      subtitle: 'Immutable calculation trace (CEL DAG)',
      badge: 'AVAILABLE',
      badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200/60',
      icon: Check,
      iconClass: 'text-emerald-600 bg-emerald-50',
    },
  ];

  const records = isSteel
    ? [
        { name: 'PCF Steel Coil v1.0', type: 'Hot-Rolled Steel Coil (ST-2026-00981)', status: 'LOCKED', statusClass: 'bg-emerald-50 text-emerald-700 border-emerald-100', val: '1.633 kgCO₂e/kg' },
        { name: 'Supplier declaration', type: 'Saurient Odisha DRI Facility', status: 'VERIFIED', statusClass: 'bg-emerald-50 text-emerald-700 border-emerald-100', val: '100% primary data' },
        { name: 'Passport pas-st-2026-00981', type: 'Batch ST-2026-00981', status: 'READY', statusClass: 'bg-emerald-50 text-emerald-700 border-emerald-100', val: '10/10 gates' },
        { name: 'EU CBAM Assessment', type: 'CN 7208 39 00 Steel Coil', status: 'COMPLIANT', statusClass: 'bg-emerald-50 text-emerald-700 border-emerald-100', val: '€1,339,060 exposure' },
      ]
    : [
        { name: 'PCF calculation v3.2', type: 'Refined Cocoa Butter', status: 'LOCKED', statusClass: 'bg-emerald-50 text-emerald-700 border-emerald-100', val: '2.84 kgCO₂e/kg' },
        { name: 'Supplier declaration', type: 'Aqua Packaging Ghana', status: 'REVIEW', statusClass: 'bg-amber-50 text-amber-700 border-amber-100', val: '86% complete' },
        { name: 'Passport CP-GH-2026-00481', type: 'Batch CB-2026-001', status: 'READY', statusClass: 'bg-emerald-50 text-emerald-700 border-emerald-100', val: '8/10 gates' },
        { name: 'CBAM assessment', type: 'Aluminium Housing', status: 'ACTION', statusClass: 'bg-rose-50 text-rose-700 border-rose-100', val: '€86,300 exposure' },
      ];

  return (
    <div className="space-y-6 font-sans">
      {/* Top Header Row with Breadcrumb & Filters */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
          <span className="hover:text-slate-800">Home</span>
          <span>/</span>
          <span className="text-slate-900 font-bold">Company Dashboard</span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="bg-white border border-slate-200 rounded-lg px-3 py-1 text-xs font-medium text-slate-700 shadow-xs flex items-center gap-1.5">
            <span>{isSteel ? 'Hyderabad Manufacturing Facility' : 'Tema Processing Plant'}</span>
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
            {isSteel ? 'SAURIENT STEEL DEMO' : 'SIMULATED'}
          </span>
        </div>
      </div>

      {/* Main Title Banner & Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            {isSteel ? 'Saurient Steel Industries — Executive Dashboard' : 'Company Dashboard'}
          </h1>
          <p className="text-xs text-slate-500 font-medium">
            {isSteel 
              ? 'Hot-Rolled Steel Coil Batch ST-2026-00981 carbon footprints, PAS800 telemetry, and CBAM readiness'
              : 'Carbon, data quality, compliance and issuance health at a glance'}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button className="px-4 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center gap-2">
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Download</span>
          </button>
          <button className="px-4 py-2 bg-[#00E599] hover:bg-[#00c985] text-slate-950 text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4" />
            <span>Verification Status: Active</span>
          </button>
        </div>
      </div>

      {/* Sub Navigation Tabs */}
      <div className="flex items-center gap-1 border-b border-slate-200 overflow-x-auto pb-px">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-xs font-bold whitespace-nowrap border-b-2 transition-all ${
              activeTab === tab
                ? 'border-emerald-600 text-emerald-800 bg-emerald-50/60'
                : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi, idx) => (
          <div key={idx} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-1">
            <span className="text-[11px] font-bold text-slate-400 block uppercase tracking-wider">{kpi.title}</span>
            <div className="text-2xl font-black text-slate-900 tracking-tight">{kpi.val}</div>
            <div className={`text-xs font-bold ${kpi.color}`}>{kpi.subtitle}</div>
          </div>
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Monthly Trend Chart & Gates */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">
                  {isSteel ? 'Monthly Steel Emissions & Output Telemetry' : 'Monthly Emissions Trend'}
                </h3>
                <p className="text-xs text-slate-500">FY 2026 PAS800 SCADA meter readings and production logs</p>
              </div>
              <span className="text-[10px] font-mono font-bold bg-slate-100 text-slate-700 px-2.5 py-1 rounded">
                tCO₂e / Tonne
              </span>
            </div>

            <div className="h-60 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthData} barCategoryGap="20%">
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
          </div>

          {/* Verification Gates Box */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <h3 className="font-bold text-slate-900 text-sm">Verification Gates & Compliance Audit Status</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {gates.map((g, i) => {
                const Icon = g.icon;
                return (
                  <div key={i} className="p-4 bg-slate-50/80 rounded-xl border border-slate-200 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className={`p-1.5 rounded-lg ${g.iconClass}`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${g.badgeClass}`}>
                        {g.badge}
                      </span>
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 text-xs">{g.title}</h4>
                      <p className="text-slate-500 text-[11px] mt-0.5">{g.subtitle}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column: Recent Records */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="font-bold text-slate-900 text-sm">Active Product & Passport Records</h3>
            <span className="text-[10px] font-mono text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded">LIVE</span>
          </div>

          <div className="space-y-3">
            {records.map((r, i) => (
              <div key={i} className="p-3.5 bg-slate-50/80 rounded-xl border border-slate-200/80 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 text-xs">{r.name}</span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${r.statusClass}`}>
                    {r.status}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 font-medium">{r.type}</p>
                <div className="pt-1 text-[11px] font-mono font-bold text-slate-800">{r.val}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
