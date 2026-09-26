import React from 'react';
import { Package, Award, Sparkles } from 'lucide-react';

export const PCFView: React.FC = () => {
  const [activeTab, setActiveTab] = React.useState('Projects');
  const tabs = ['Projects', 'Output Definition', 'Boundary', 'Inventory', 'Allocation', 'Logistics', 'Calculation', 'Hotspots', 'Report'];

  const kpis = [
    { title: 'Passports Issued', val: '12', subtitle: '9 cocoa • 3 aluminum' },
    { title: 'Avg Carbon Intensity', val: '0.42 kg/kg', subtitle: '-18% vs industry avg' },
    { title: 'Primary Data Share', val: '74%', subtitle: 'Audited source data' },
    { title: 'EU Battery / Digital Ready', val: '100%', subtitle: 'Full compliance ready' },
  ];

  const products = [
    { name: 'Organic Cocoa Butter (Batch GH-2026-X8)', footprint: '0.38 kg CO2e/kg', status: 'VERIFIED', scope1: '0.08', scope2: '0.12', scope3: '0.18' },
    { name: 'Processed Cocoa Mass (Batch GH-2026-X9)', footprint: '0.45 kg CO2e/kg', status: 'VERIFIED', scope1: '0.10', scope2: '0.15', scope3: '0.20' },
    { name: 'Smelter Grade Aluminum Ingot', footprint: '1.24 kg CO2e/kg', status: 'DRAFT', scope1: '0.40', scope2: '0.50', scope3: '0.34' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Product Carbon Footprint (PCF)</h1>
        <p className="text-xs text-slate-500 mb-4">ISO 14067 compliant lifecycle footprinting per product SKU</p>

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
        <h3 className="font-bold text-slate-900 text-sm">Product Footprint Declarations</h3>
        <div className="space-y-3 text-xs">
          {products.map((p, i) => (
            <div key={i} className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <Package className="w-6 h-6 text-emerald-600" />
                <div>
                  <h4 className="font-bold text-slate-900">{p.name}</h4>
                  <p className="text-[10px] text-slate-500">Scopes: S1 ({p.scope1}) | S2 ({p.scope2}) | S3 ({p.scope3})</p>
                </div>
              </div>
              <div className="flex items-center gap-6">
                <div className="text-right">
                  <span className="text-base font-black text-emerald-700">{p.footprint}</span>
                </div>
                <span className="bg-emerald-100 text-emerald-800 font-bold px-3 py-1 rounded-full text-[10px]">{p.status}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
