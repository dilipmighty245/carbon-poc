import React from 'react';
import { SimpleWordsCard } from '../common/SimpleWordsCard';
import { Flame, Zap, Truck, Leaf, CheckCircle2 } from 'lucide-react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';

export const EmissionsCalculation: React.FC = () => {
  const scopeData = [
    { title: 'Scope 1', subtitle: 'Direct emissions (on-site fuel use)', val: '120', unit: 'kgCO2e per batch', icon: Flame, color: 'text-rose-600 bg-rose-50 border-rose-100' },
    { title: 'Scope 2', subtitle: 'Purchased electricity', val: '85', unit: 'kgCO2e per batch', icon: Zap, color: 'text-sky-600 bg-sky-50 border-sky-100' },
    { title: 'Scope 3', subtitle: 'Upstream and downstream (supply chain)', val: '395', unit: 'kgCO2e per batch', icon: Truck, color: 'text-emerald-600 bg-emerald-50 border-emerald-100' },
  ];

  const pieData = [
    { name: 'Electricity', value: 170, percentage: 28, color: '#16a34a' },
    { name: 'Fuel (on-site)', value: 70, percentage: 12, color: '#0284c7' },
    { name: 'Logistics', value: 120, percentage: 20, color: '#f97316' },
    { name: 'Materials', value: 210, percentage: 35, color: '#a855f7' },
    { name: 'Packaging', value: 30, percentage: 5, color: '#64748b' },
  ];

  const methodologyDetails = [
    { label: 'Emission factor database', val: 'DEFRA 2024 (with Ghana-specific factors)' },
    { label: 'Methodology', val: 'GHG Protocol (Product Life Cycle Accounting)' },
    { label: 'System boundary', val: 'Cradle-to-gate (with selected downstream)' },
    { label: 'Data quality', val: 'Primary data (70%) / Secondary data (30%)' },
    { label: 'Calculation version', val: 'v1.2.0' },
    { label: 'Last updated', val: '12 Mar 2024' },
  ];

  const simpleWordsPoints = [
    { step: 1, text: 'The system converts real activity data into carbon emissions.' },
    { step: 2, text: 'It shows exactly where emissions come from across Scopes 1, 2, and 3.' },
    { step: 3, text: 'This helps companies reduce emissions and prepare for export requirements.' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Emission Calculation Dashboard</h1>
        <p className="text-slate-500 text-sm">Turning activity data into a product carbon footprint</p>
      </div>

      {/* Top Banner Card */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-amber-100 border border-amber-200 flex items-center justify-center text-3xl shadow-sm">
            🧈
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">Carbon Passport Calculation Engine</span>
              <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">COLLECT • CALCULATE • VERIFY • ISSUE</span>
            </div>
            <h2 className="text-xl font-bold text-slate-900">Cocoa Butter Batch</h2>
            <p className="text-xs text-slate-500">Refined cocoa butter for export | Production date: 12 Mar 2024 | Batch size: 1,000 kg | Facility: Tema, Ghana</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <select className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-50">
            <option>Cocoa Butter Batch</option>
            <option>Fermented Cocoa Beans</option>
          </select>
          <span className="font-mono text-xs font-semibold text-slate-500 bg-slate-100 px-3 py-2 rounded-xl">CB-2024-001</span>
        </div>
      </div>

      {/* Scope Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {scopeData.map((scope, idx) => {
          const Icon = scope.icon;
          return (
            <div key={idx} className={`p-5 rounded-2xl border ${scope.color} shadow-sm bg-white`}>
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold text-sm text-slate-900">{scope.title}</span>
                <Icon className="w-5 h-5" />
              </div>
              <p className="text-[11px] text-slate-500 mb-3">{scope.subtitle}</p>
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-extrabold text-slate-900">{scope.val}</span>
                <span className="text-xs text-slate-500 font-medium">{scope.unit}</span>
              </div>
            </div>
          );
        })}

        {/* Total Product Footprint Box */}
        <div className="p-5 rounded-2xl border border-emerald-300 bg-gradient-to-br from-emerald-50 to-teal-50 shadow-sm flex flex-col justify-between">
          <div className="flex items-center gap-2 text-emerald-800">
            <Leaf className="w-5 h-5 text-emerald-600" />
            <h3 className="font-bold text-sm">Total Product Footprint</h3>
          </div>
          <div>
            <div className="flex items-baseline gap-1">
              <span className="text-4xl font-black text-slate-900">600</span>
              <span className="text-xs font-semibold text-slate-600">kgCO2e per batch</span>
            </div>
            <p className="text-xs font-bold text-emerald-700 mt-1">0.60 tCO2e per batch</p>
          </div>
        </div>
      </div>

      {/* Main Breakdown Section */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Emissions by Source Donut Chart */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <h3 className="font-bold text-slate-900 text-sm">Emissions by Source</h3>
            <p className="text-xs text-slate-500 mb-4">Share of total product footprint (600 kgCO2e)</p>

            <div className="flex items-center justify-between h-56">
              <div className="w-1/2 h-full relative flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={pieData} innerRadius={55} outerRadius={80} dataKey="value" paddingAngle={3}>
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute text-center">
                  <span className="text-xl font-bold text-slate-900">600</span>
                  <span className="text-[10px] text-slate-500 block">kgCO2e</span>
                </div>
              </div>

              <div className="w-1/2 space-y-2 text-xs">
                {pieData.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: item.color }}></span>
                      <span className="text-slate-700 font-medium">{item.name}</span>
                    </div>
                    <div className="text-right font-mono">
                      <span className="font-bold text-slate-900">{item.percentage}%</span>
                      <span className="text-slate-400 text-[11px] ml-1">({item.value}kg)</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Emission Factors & Methodology */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
            <h3 className="font-bold text-slate-900 text-sm">Emission Factors & Methodology</h3>

            <div className="divide-y divide-slate-100 text-xs pt-1">
              {methodologyDetails.map((item, idx) => (
                <div key={idx} className="py-2 flex items-center justify-between">
                  <span className="text-slate-500 font-medium">{item.label}</span>
                  <span className="font-semibold text-slate-900 text-right">{item.val}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Explanatory Side Cards */}
        <div className="space-y-6">
          <SimpleWordsCard
            points={simpleWordsPoints}
            extraCard={
              <div className="bg-emerald-700 text-white rounded-2xl p-5 shadow-sm space-y-3">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">🇬🇭</span>
                  <h4 className="font-bold text-sm">Why it matters</h4>
                </div>
                <div className="space-y-2 text-xs text-emerald-100">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-300 shrink-0" />
                    <span>Identify biggest emission hotspots</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-300 shrink-0" />
                    <span>Take targeted action to reduce emissions</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-300 shrink-0" />
                    <span>Build trust with buyers and meet international requirements</span>
                  </div>
                </div>
              </div>
            }
          />
        </div>
      </div>
    </div>
  );
};
