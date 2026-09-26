import React from 'react';
import { SimpleWordsCard } from '../common/SimpleWordsCard';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { CheckCircle2, AlertCircle, ShieldCheck, Download } from 'lucide-react';

export const CompanyDashboardView: React.FC = () => {
  const kpis = [
    { title: 'Total CCF', val: '12,842 tCO2e', subtitle: '↓ 8.4% vs baseline' },
    { title: 'PCF Intensity', val: '2.84 kgCO2e/kg', subtitle: '↓ 6.1% latest batch' },
    { title: 'Data Completeness', val: '94.2%', subtitle: '↑ 4.6% this period' },
    { title: 'Passport Readiness', val: '8 of 10 gates', subtitle: '2 verification actions open' },
  ];

  const monthlyEmissions = [
    { month: 'O', val: 140 }, { month: 'N', val: 180 }, { month: 'D', val: 160 },
    { month: 'J', val: 210 }, { month: 'F', val: 170 }, { month: 'M', val: 235 },
    { month: 'A', val: 195 }, { month: 'M', val: 240 }, { month: 'J', val: 220 },
    { month: 'J', val: 260 }, { month: 'A', val: 245 }, { month: 'S', val: 270 },
  ];

  const records = [
    { name: 'PCF calculation v3.2', desc: 'Refined Cocoa Butter', status: 'LOCKED', badge: 'bg-emerald-50 text-emerald-700', val: '2.84 kgCO2e/kg' },
    { name: 'Supplier declaration', desc: 'Aqua Packaging Ghana', status: 'REVIEW', badge: 'bg-amber-50 text-amber-700', val: '86% complete' },
    { name: 'Passport CP-GH-2026-00481', desc: 'Batch CB-2026-001', status: 'READY', badge: 'bg-emerald-50 text-emerald-700', val: '8/10 gates' },
    { name: 'CBAM assessment', desc: 'Aluminium Housing', status: 'ACTION', badge: 'bg-rose-50 text-rose-700', val: '€86,300 exposure' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <span>Home</span>
            <span>/</span>
            <span className="text-slate-700 font-semibold">Company Dashboard</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mt-1">Company Dashboard</h1>
          <p className="text-xs text-slate-500">Carbon, data quality, compliance and issuance health at a glance</p>
        </div>

        <div className="flex items-center gap-3">
          <select className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 bg-white shadow-xs">
            <option>Tema Processing Plant</option>
            <option>Kumasi Milling Unit</option>
          </select>
          <select className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 bg-white shadow-xs">
            <option>FY 2026</option>
            <option>FY 2025</option>
          </select>
          <button className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs rounded-xl shadow-sm">
            Primary action
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {kpis.map((k, i) => (
          <div key={i} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <span className="text-xs font-semibold text-slate-400 block mb-1">{k.title}</span>
            <span className="text-2xl font-black text-slate-900">{k.val}</span>
            <span className="text-xs font-semibold text-emerald-600 block mt-1">{k.subtitle}</span>
          </div>
        ))}
      </div>

      {/* Main Charts & Priority Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <h3 className="font-bold text-slate-900 text-sm">Emissions by scope</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyEmissions}>
                <XAxis dataKey="month" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip />
                <Bar dataKey="val" fill="#0284c7" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Priority Actions */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
          <h3 className="font-bold text-slate-900 text-sm">Priority actions</h3>

          <div className="space-y-3 text-xs">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between">
              <div>
                <h4 className="font-bold text-slate-900">Identity and boundary</h4>
                <p className="text-[10px] text-slate-500">Complete and approved</p>
              </div>
              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">PASSED</span>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between">
              <div>
                <h4 className="font-bold text-slate-900">Evidence and data quality</h4>
                <p className="text-[10px] text-slate-500">Two items need attention</p>
              </div>
              <span className="text-[10px] font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded">REVIEW</span>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between">
              <div>
                <h4 className="font-bold text-slate-900">Version provenance</h4>
                <p className="text-[10px] text-slate-500">Immutable calculation trace</p>
              </div>
              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">AVAILABLE</span>
            </div>
          </div>
        </div>
      </div>

      {/* Records and Provenance Table */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <h3 className="font-bold text-slate-900 text-sm mb-4">Records and provenance</h3>
        <div className="space-y-2 text-xs">
          {records.map((r, i) => (
            <div key={i} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
              <div>
                <h4 className="font-bold text-slate-900">{r.name}</h4>
                <p className="text-[10px] text-slate-500">{r.desc}</p>
              </div>
              <div className="flex items-center gap-4">
                <span className={`px-2.5 py-1 rounded font-bold text-[10px] ${r.badge}`}>{r.status}</span>
                <span className="font-mono font-semibold text-slate-700">{r.val}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
