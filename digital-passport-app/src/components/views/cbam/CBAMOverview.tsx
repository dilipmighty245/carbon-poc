import React from 'react';
import { AlertTriangle, ShieldCheck, ArrowUpRight, BarChart3, Database } from 'lucide-react';
import type { CBAMProductData } from '../../../types/cbam';
import { CBAM_STATUS_MAP } from '../../../types/cbam';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface CBAMOverviewProps {
  products: CBAMProductData[];
  selectedProduct: CBAMProductData;
  onSelectProduct: (p: CBAMProductData) => void;
  onOpenBlockers: () => void;
}

export const CBAMOverview: React.FC<CBAMOverviewProps> = ({
  products,
  selectedProduct,
  onSelectProduct,
  onOpenBlockers,
}) => {
  const blockers = selectedProduct.rules.filter((r) => r.outcome === 'FAIL' || r.severity === 'BLOCKER');
  const statusInfo = CBAM_STATUS_MAP[selectedProduct.status];

  const monthData = [
    { month: 'Oct', val: 42, fill: '#f59e0b' },
    { month: 'Nov', val: 56, fill: '#10b981' },
    { month: 'Dec', val: 48, fill: '#06b6d4' },
    { month: 'Jan', val: 68, fill: '#06b6d4' },
    { month: 'Feb', val: 52, fill: '#10b981' },
    { month: 'Mar', val: 76, fill: '#f59e0b' },
    { month: 'Apr', val: 62, fill: '#06b6d4' },
    { month: 'May', val: 82, fill: '#10b981' },
    { month: 'Jun', val: 70, fill: '#06b6d4' },
    { month: 'Jul', val: 88, fill: '#06b6d4' },
    { month: 'Aug', val: 78, fill: '#10b981' },
    { month: 'Sep', val: 94, fill: '#06b6d4' },
  ];

  return (
    <div className="space-y-6">
      {/* Active Product Selector Banner */}
      <div className="p-5 bg-slate-900 text-white rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-md">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-[#00E599] text-slate-950 font-black text-xl flex items-center justify-center">
            S
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">ACTIVE DEMO PRODUCT</span>
              <span className={`border text-[10px] font-bold px-2.5 py-0.5 rounded-full ${statusInfo.badgeClass}`}>
                {statusInfo.label}
              </span>
            </div>
            <h2 className="text-xl font-bold tracking-tight text-white mt-0.5">{selectedProduct.name}</h2>
            <p className="text-xs text-slate-400 font-mono mt-0.5">
              CN {selectedProduct.cnCode} · {selectedProduct.sector} · {selectedProduct.installationName}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={selectedProduct.id}
            onChange={(e) => {
              const found = products.find((p) => p.id === e.target.value);
              if (found) onSelectProduct(found);
            }}
            className="bg-slate-800 text-white text-xs font-semibold px-3 py-2 rounded-xl border border-slate-700 focus:outline-none focus:border-[#00E599]"
          >
            {products.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} ({p.cnCode})
              </option>
            ))}
          </select>

          {blockers.length > 0 && (
            <button
              onClick={onOpenBlockers}
              className="px-4 py-2 bg-rose-500 hover:bg-rose-600 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-2"
            >
              <AlertTriangle className="w-4 h-4" />
              <span>{blockers.length} Blocker{blockers.length > 1 ? 's' : ''} Active</span>
            </button>
          )}
        </div>
      </div>

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-xs font-semibold text-slate-400 block mb-1">Covered Volume</span>
          <span className="text-2xl font-black text-slate-900 tracking-tight">
            {selectedProduct.annualVolumeTonnes.toLocaleString()} t
          </span>
          <span className="text-xs font-semibold text-slate-400 block mt-1">
            {selectedProduct.isSimpleGood ? 'Simple Good' : 'Complex Good'}
          </span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-xs font-semibold text-slate-400 block mb-1">Embedded Emissions</span>
          <span className="text-2xl font-black text-slate-900 tracking-tight">
            {selectedProduct.totalSpecificEmissions.toFixed(2)} <span className="text-sm font-normal text-slate-500">tCO₂e/t</span>
          </span>
          <span className="text-xs font-semibold text-emerald-600 block mt-1">
            Verified share {selectedProduct.verifiedSharePct}%
          </span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-xs font-semibold text-slate-400 block mb-1">Estimated Exposure</span>
          <span className="text-2xl font-black text-slate-900 tracking-tight">
            {selectedProduct.estimatedExposureEUR > 0 ? `€${selectedProduct.estimatedExposureEUR.toLocaleString()}` : 'N/A'}
          </span>
          <span className="text-xs font-semibold text-slate-400 block mt-1">Scenario assumption (€82/tCO₂e)</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-xs font-semibold text-slate-400 block mb-1">Compliance Blockers</span>
          <span className={`text-2xl font-black tracking-tight ${blockers.length > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
            {blockers.length}
          </span>
          <span className="text-xs font-semibold text-slate-400 block mt-1">
            {blockers.length > 0 ? 'Action required' : 'Ready for verification'}
          </span>
        </div>
      </div>

      {/* Middle Row: Exposure Chart & Status Interpretation */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-slate-900 text-sm">Monthly Emission & Production Trend</h3>
            <span className="text-[11px] font-semibold text-slate-400">Reporting Year FY {selectedProduct.reportingYear}</span>
          </div>

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

          <div className="flex items-center justify-between pt-4 border-t border-slate-100 text-xs text-slate-500 font-medium">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-[#06b6d4]"></span> Verified Primary Data</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-[#f59e0b]"></span> Review Required</span>
            </div>
            <span>Specific unit: tCO₂e / Tonne</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <h3 className="font-bold text-slate-900 text-sm">Status Rationale & Governance</h3>

          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">CURRENT STATE</span>
            <div className="font-bold text-slate-900 text-sm">{statusInfo.label}</div>
            <p className="text-xs text-slate-600 leading-relaxed">{statusInfo.description}</p>
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-500">Installation Operator</span>
              <span className="font-bold text-slate-900">{selectedProduct.installationOperator}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-500">Country of Origin</span>
              <span className="font-bold text-slate-900">{selectedProduct.countryOfOrigin}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-500">Precursors Count</span>
              <span className="font-bold text-slate-900">{selectedProduct.precursors.length} items</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-slate-500">Dataset Freeze Status</span>
              <span className={`font-bold ${selectedProduct.datasetFrozen ? 'text-emerald-600' : 'text-amber-600'}`}>
                {selectedProduct.datasetFrozen ? 'FROZEN & SIGNED' : 'UNFROZEN / DRAFT'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
