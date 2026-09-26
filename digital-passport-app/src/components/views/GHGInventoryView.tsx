import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

export const GHGInventoryView: React.FC = () => {
  const [activeTab, setActiveTab] = React.useState('Overview');
  const tabs = ['Overview', 'Boundary', 'Source Map', 'Scope 1', 'Scope 2 Location', 'Scope 2 Market', 'Scope 3', 'Calculations', 'Review', 'Report'];

  const kpis = [
    { title: 'Total GHG', val: '4,820 t', subtitle: 'GHG Protocol standard' },
    { title: 'Scope 1 Direct', val: '920 t', subtitle: 'Fuel & boiler emissions' },
    { title: 'Scope 2 Indirect', val: '1,450 t', subtitle: 'Purchased electricity' },
    { title: 'Scope 3 Supply Chain', val: '2,450 t', subtitle: 'Upstream & transport' },
  ];

  const chartData = [
    { category: 'Stationary Comb.', scope1: 620, scope2: 0, scope3: 0 },
    { category: 'Grid Electricity', scope1: 0, scope2: 1450, scope3: 0 },
    { category: 'Raw Materials', scope1: 0, scope2: 0, scope3: 1800 },
    { category: 'Logistics/Freight', scope1: 300, scope2: 0, scope3: 650 },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">GHG Inventory</h1>
        <p className="text-xs text-slate-500 mb-4">Corporate-level emissions disclosure based on GHG Protocol standard</p>

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
        <h3 className="font-bold text-slate-900 text-sm">Emissions Breakdown by Category & Scope</h3>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <XAxis dataKey="category" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="scope1" name="Scope 1" fill="#10B981" stackId="a" />
              <Bar dataKey="scope2" name="Scope 2" fill="#3B82F6" stackId="a" />
              <Bar dataKey="scope3" name="Scope 3" fill="#6366F1" stackId="a" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
