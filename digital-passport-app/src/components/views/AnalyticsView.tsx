import React from 'react';
import { BarChart3, TrendingUp, Zap, Target } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

export const AnalyticsView: React.FC = () => {
  const [activeTab, setActiveTab] = React.useState('Executive');
  const tabs = ['Executive', 'Facilities', 'Products', 'Value Chain', 'Trade Exposure', 'Scenarios'];

  const kpis = [
    { title: 'YTD Emission Reduction', val: '-14.2%', subtitle: 'vs 2025 Baseline' },
    { title: 'Decarbonization ROI', val: '$142,000', subtitle: 'Energy cost savings' },
    { title: 'Renewable Energy %', val: '48.5%', subtitle: 'Solar & hydro share' },
    { title: 'Target Alignment', val: 'ON TRACK', subtitle: 'Net Zero 2040 Plan' },
  ];

  const trendData = [
    { month: 'Jan', emissions: 480 },
    { month: 'Feb', emissions: 460 },
    { month: 'Mar', emissions: 430 },
    { month: 'Apr', emissions: 410 },
    { month: 'May', emissions: 390 },
    { month: 'Jun', emissions: 375 },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Analytics & Forecasting</h1>
        <p className="text-xs text-slate-500 mb-4">Decarbonization trajectory, predictive trends & financial impact analysis</p>

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
        <h3 className="font-bold text-slate-900 text-sm">Monthly Emission Trend (t CO2e)</h3>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={trendData}>
              <XAxis dataKey="month" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Line type="monotone" dataKey="emissions" stroke="#10B981" strokeWidth={3} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
