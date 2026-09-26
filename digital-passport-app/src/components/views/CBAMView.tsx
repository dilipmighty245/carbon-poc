import React from 'react';
import { Landmark, ShieldAlert, FileText, Globe } from 'lucide-react';

export const CBAMView: React.FC = () => {
  const [activeTab, setActiveTab] = React.useState('Overview');
  const tabs = ['Overview', 'Applicability', 'CN Classification', 'Installations', 'Monitoring Plans', 'Processes', 'Calculations', 'Declarants', 'Exposure', 'Cost', 'Data Pack', 'Registry Transfer'];

  const kpis = [
    { title: 'CBAM Eligible Goods', val: '2 Categories', subtitle: 'Aluminum & Fertilizers' },
    { title: 'Export Volume (EU)', val: '14,200 metric tons', subtitle: 'Q3 2026 period' },
    { title: 'Est. Certificate Liability', val: '€ 42,800', subtitle: 'Based on €85/ton ETS price' },
    { title: 'Quarterly Report Status', val: 'READY FOR SUBMISSION', subtitle: 'EU Registry format XML' },
  ];

  const declarations = [
    { code: 'CN 7601 10 00', product: 'Unwrought Non-Alloyed Aluminum', embedded: '1.24 t CO2e/t', benchmark: '1.45 t CO2e/t', liability: '€ 28,400' },
    { code: 'CN 3102 10 10', product: 'Urea Fertilizer Granules', embedded: '2.10 t CO2e/t', benchmark: '2.30 t CO2e/t', liability: '€ 14,400' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">CBAM Compliance Hub</h1>
        <p className="text-xs text-slate-500 mb-4">EU Carbon Border Adjustment Mechanism calculations and declaration filings</p>

        {/* Sub Navigation Tabs */}
        <div className="flex items-center gap-1 border-b border-slate-200 overflow-x-auto pb-px">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 text-xs font-semibold whitespace-nowrap border-b-2 transition-colors ${
                activeTab === tab
                  ? 'border-emerald-600 text-emerald-700 bg-emerald-50/50 rounded-t-lg'
                  : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {kpis.map((k, i) => (
          <div key={i} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <span className="text-xs font-semibold text-slate-400 block mb-1">{k.title}</span>
            <span className="text-2xl font-black text-slate-900">{k.val}</span>
            <span className="text-xs font-semibold text-emerald-600 block mt-1">{k.subtitle}</span>
          </div>
        ))}
      </div>

      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <h3 className="font-bold text-slate-900 text-sm">EU Export Declarations & Embedded Emissions</h3>
        <div className="space-y-3 text-xs">
          {declarations.map((d, i) => (
            <div key={i} className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <Landmark className="w-6 h-6 text-blue-600" />
                <div>
                  <h4 className="font-bold text-slate-900">{d.product} <span className="font-mono text-slate-400">({d.code})</span></h4>
                  <p className="text-[10px] text-slate-500">Embedded: {d.embedded} | EU Benchmark: {d.benchmark}</p>
                </div>
              </div>
              <div className="flex items-center gap-6">
                <span className="font-bold text-slate-800">Est. Tax: {d.liability}</span>
                <button className="bg-emerald-600 text-white font-bold px-3 py-1.5 rounded-lg text-[10px] hover:bg-emerald-700">Export XML</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
