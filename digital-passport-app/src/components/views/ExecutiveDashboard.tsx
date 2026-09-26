import React from 'react';
import { SimpleWordsCard } from '../common/SimpleWordsCard';
import { Users, Building2, Leaf, FileCheck, Cloud, ShieldCheck, MapPin, CheckCircle2 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

export const ExecutiveDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = React.useState('Overview');
  const tabs = ['Overview', 'Priority Tasks', 'Notifications', 'Recent Activity'];

  const kpis = [
    { label: 'Exporters onboarded', val: '124', change: '+24% vs. last quarter', icon: Users, color: 'text-emerald-600 bg-emerald-50' },
    { label: 'Facilities connected', val: '312', change: '+40% vs. last quarter', icon: Building2, color: 'text-blue-600 bg-blue-50' },
    { label: 'Commodities tracked', val: '5', change: '+0 vs. last quarter', icon: Leaf, color: 'text-emerald-600 bg-emerald-50' },
    { label: 'Verified passports issued', val: '1,842', change: '+62% vs. last quarter', icon: FileCheck, color: 'text-indigo-600 bg-indigo-50' },
    { label: 'tCO2e estimated emissions', val: '98,500', change: '+35% vs. last quarter', icon: Cloud, color: 'text-sky-600 bg-sky-50' },
    { label: 'Compliance readiness score', val: '87%', change: '+12 pp vs. last quarter', icon: ShieldCheck, color: 'text-emerald-600 bg-emerald-50' },
  ];

  const sectorData = [
    { name: 'Cocoa', val: 120, color: '#16a34a' },
    { name: 'Cashew', val: 68, color: '#2563eb' },
    { name: 'Textiles', val: 46, color: '#0284c7' },
    { name: 'Processed Foods', val: 42, color: '#4f46e5' },
    { name: 'Metals', val: 36, color: '#64748b' },
  ];

  const hotspotsData = [
    { name: 'Greater Accra', emissions: 28400 },
    { name: 'Ashanti', emissions: 22100 },
    { name: 'Western', emissions: 18600 },
    { name: 'Eastern', emissions: 12300 },
    { name: 'Brong Ahafo', emissions: 8200 },
    { name: 'Northern', emissions: 6900 },
  ];

  const commodities = [
    { name: 'Cocoa', icon: '🍫', exporters: 48, facilities: 132, passports: 780, emissions: '42,500', readiness: 90 },
    { name: 'Cashew', icon: '🥜', exporters: 32, facilities: 68, passports: 420, emissions: '18,200', readiness: 86 },
    { name: 'Textiles', icon: '👕', exporters: 18, facilities: 46, passports: 260, emissions: '12,300', readiness: 78 },
    { name: 'Processed Foods', icon: '🥫', exporters: 16, facilities: 42, passports: 240, emissions: '15,800', readiness: 84 },
    { name: 'Metals', icon: '🪨', exporters: 10, facilities: 24, passports: 142, emissions: '9,700', readiness: 71 },
  ];

  const simpleWordsPoints = [
    { step: 1, text: 'Leaders can see progress across sectors.' },
    { step: 2, text: 'The dashboard highlights readiness, risks, and opportunities.' },
    { step: 3, text: 'This helps Ghana plan climate-smart trade and compliance.' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Executive Dashboard for Ghana</h1>
        <p className="text-slate-500 text-sm mb-4">A high-level view for leadership, policy, and export readiness</p>

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

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {kpis.map((kpi, idx) => {
          const Icon = kpi.icon;
          return (
            <div key={idx} className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
              <div className="flex items-center justify-between mb-2">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${kpi.color}`}>
                  <Icon className="w-5 h-5" />
                </div>
              </div>
              <div>
                <span className="text-2xl font-extrabold text-slate-900">{kpi.val}</span>
                <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">{kpi.label}</p>
                <p className="text-[11px] font-semibold text-emerald-600 mt-1">{kpi.change}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3 space-y-6">
          {/* Map + Sector Adoption + Hotspots */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Map Widget */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <h3 className="font-bold text-slate-900 text-sm">Facility Locations Across Ghana</h3>
              <p className="text-xs text-slate-500 mb-4">Connected facilities and exporters</p>
              
              <div className="relative bg-emerald-50/50 rounded-xl p-4 h-56 border border-emerald-100 flex flex-col justify-between overflow-hidden">
                {/* SVG Outline Representation of Ghana */}
                <div className="absolute inset-0 flex items-center justify-center opacity-20 text-emerald-600">
                  <svg className="w-full h-full p-4" viewBox="0 0 100 100" fill="currentColor">
                    <path d="M 30 10 L 70 10 L 75 40 L 80 80 L 50 95 L 20 85 L 25 40 Z" />
                  </svg>
                </div>

                {/* Map Pins */}
                <div className="relative z-10 space-y-2 text-xs font-semibold">
                  <div className="flex items-center gap-1.5 text-slate-700">
                    <MapPin className="w-4 h-4 text-emerald-600" />
                    <span>Tamale (Northern)</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-700 ml-4">
                    <MapPin className="w-4 h-4 text-blue-600" />
                    <span>Kumasi (Ashanti)</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-700 ml-8">
                    <MapPin className="w-4 h-4 text-indigo-600" />
                    <span>Takoradi (Western)</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-900 font-bold ml-12">
                    <MapPin className="w-4 h-4 text-emerald-700" />
                    <span>Accra (Capital & Port)</span>
                  </div>
                </div>

                <div className="relative z-10 pt-2 border-t border-emerald-200/50 flex flex-wrap gap-2 text-[10px]">
                  <span className="flex items-center gap-1 text-slate-600"><span className="w-2 h-2 rounded-full bg-emerald-500"></span> Exporter</span>
                  <span className="flex items-center gap-1 text-slate-600"><span className="w-2 h-2 rounded-full bg-blue-500"></span> Processing</span>
                  <span className="flex items-center gap-1 text-slate-600"><span className="w-2 h-2 rounded-full bg-indigo-500"></span> Port Hub</span>
                </div>
              </div>
            </div>

            {/* Sector Adoption Bar Chart */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <h3 className="font-bold text-slate-900 text-sm">Sector Adoption</h3>
              <p className="text-xs text-slate-500 mb-2">Connected facilities by sector</p>
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={sectorData}>
                    <XAxis dataKey="name" tick={{ fontSize: 10 }} interval={0} />
                    <YAxis tick={{ fontSize: 10 }} />
                    <Tooltip />
                    <Bar dataKey="val" radius={[6, 6, 0, 0]}>
                      {sectorData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Emission Hotspots Bar Chart */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <h3 className="font-bold text-slate-900 text-sm">Emission Hotspots</h3>
              <p className="text-xs text-slate-500 mb-2">Estimated emissions by location (tCO2e)</p>
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={hotspotsData} layout="vertical">
                    <XAxis type="number" tick={{ fontSize: 10 }} />
                    <YAxis dataKey="name" type="category" tick={{ fontSize: 10 }} width={80} />
                    <Tooltip />
                    <Bar dataKey="emissions" fill="#0284c7" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Commodities Overview Table */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <h3 className="font-bold text-slate-900 text-base mb-1">Commodities Overview</h3>
            <p className="text-xs text-slate-500 mb-4">Verified passports and estimated emissions by commodity</p>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500 text-xs uppercase bg-slate-50/50">
                    <th className="py-3 px-4">Commodity</th>
                    <th className="py-3 px-4">Exporters</th>
                    <th className="py-3 px-4">Facilities</th>
                    <th className="py-3 px-4">Verified Passports</th>
                    <th className="py-3 px-4">Estimated Emissions (tCO2e)</th>
                    <th className="py-3 px-4">Readiness</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {commodities.map((item, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4 font-semibold text-slate-900 flex items-center gap-2">
                        <span>{item.icon}</span>
                        {item.name}
                      </td>
                      <td className="py-3 px-4 text-slate-600">{item.exporters}</td>
                      <td className="py-3 px-4 text-slate-600">{item.facilities}</td>
                      <td className="py-3 px-4 text-slate-600">{item.passports}</td>
                      <td className="py-3 px-4 font-mono font-semibold text-slate-900">{item.emissions}</td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <div className="w-24 bg-slate-100 rounded-full h-2 overflow-hidden">
                            <div className="bg-emerald-500 h-2 rounded-full" style={{ width: `${item.readiness}%` }}></div>
                          </div>
                          <span className="text-xs font-semibold text-slate-700">{item.readiness}%</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Side Cards */}
        <div className="space-y-6">
          <SimpleWordsCard
            points={simpleWordsPoints}
            extraCard={
              <div className="bg-gradient-to-br from-emerald-600 to-teal-700 text-white rounded-2xl p-5 shadow-sm space-y-3">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">🇬🇭</span>
                  <h4 className="font-bold text-lg">A stronger, greener Ghana</h4>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-300 shrink-0" />
                    <span>More competitive exports</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-300 shrink-0" />
                    <span>Lower emissions</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-300 shrink-0" />
                    <span>Greater access to global markets</span>
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
