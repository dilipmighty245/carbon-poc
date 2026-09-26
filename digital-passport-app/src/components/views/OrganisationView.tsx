import React from 'react';
import { Building2, Radio, CheckCircle2 } from 'lucide-react';

export const OrganisationView: React.FC = () => {
  const [activeTab, setActiveTab] = React.useState('Facilities');
  const tabs = ['Profile', 'Facilities', 'Processes', 'Users & Roles', 'Reporting Periods', 'Localisation', 'Approvals'];

  const kpis = [
    { title: 'Active Facilities', val: '4', subtitle: '3 production • 1 warehouse' },
    { title: 'Connected Devices', val: '38', subtitle: '35 online' },
    { title: 'Reporting Coverage', val: '96%', subtitle: 'Across active sites' },
    { title: 'Open Tasks', val: '7', subtitle: '2 high priority' },
  ];

  const facilities = [
    { name: 'Tema Processing Plant', location: 'Ghana', status: 'ACTIVE', coverage: '96%' },
    { name: 'Kumasi Materials Hub', location: 'Ghana', status: 'ACTIVE', coverage: '91%' },
    { name: 'Takoradi Export Warehouse', location: 'Ghana', status: 'ACTIVE', coverage: '98%' },
    { name: 'Accra Corporate Office', location: 'Ghana', status: 'ACTIVE', coverage: '88%' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Organisation & Facilities</h1>
        <p className="text-xs text-slate-500 mb-4">Manage company identity, operating sites, roles and reporting periods</p>

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
        <h3 className="font-bold text-slate-900 text-sm">Active Operating Sites</h3>
        <div className="space-y-2 text-xs">
          {facilities.map((f, i) => (
            <div key={i} className="flex items-center justify-between p-3.5 bg-slate-50 rounded-xl border border-slate-100">
              <div className="flex items-center gap-3">
                <Building2 className="w-5 h-5 text-emerald-600" />
                <div>
                  <h4 className="font-bold text-slate-900">{f.name}</h4>
                  <p className="text-[10px] text-slate-500">🇬🇭 {f.location}</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <span className="bg-emerald-100 text-emerald-800 font-bold px-2.5 py-0.5 rounded text-[10px]">{f.status}</span>
                <span className="font-semibold text-slate-700">Coverage: {f.coverage}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
