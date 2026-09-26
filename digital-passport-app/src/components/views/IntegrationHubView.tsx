import React from 'react';
import { Database, Radio, CheckCircle2, AlertTriangle } from 'lucide-react';

export const IntegrationHubView: React.FC = () => {
  const [activeTab, setActiveTab] = React.useState('Connections');
  const tabs = ['Connections', 'Mapping Studio', 'Sync Controls', 'Import Jobs', 'Exceptions', 'Telemetry', 'Manual Entry', 'Bulk Upload'];

  const kpis = [
    { title: 'Active Sources', val: '7', subtitle: 'SAP, CRM, meters and files' },
    { title: 'Records Today', val: '18,420', subtitle: '99.3% accepted' },
    { title: 'Data Exceptions', val: '14', subtitle: '5 require action' },
    { title: 'Device Uptime', val: '98.7%', subtitle: '35 of 38 online' },
  ];

  const connections = [
    { name: 'SAP S/4HANA', type: 'Production & purchasing', status: 'HEALTHY', badge: 'bg-emerald-100 text-emerald-800', time: '12 min ago' },
    { name: 'Sattric+ Gateway', type: 'Energy telemetry', status: 'HEALTHY', badge: 'bg-emerald-100 text-emerald-800', time: 'Live' },
    { name: 'Salesforce', type: 'Customers & requests', status: 'HEALTHY', badge: 'bg-emerald-100 text-emerald-800', time: '1 hr ago' },
    { name: 'Supplier PCF CSV', type: 'Monthly upload', status: 'WARNING', badge: 'bg-amber-100 text-amber-800', time: '14 rejected' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Integration Hub</h1>
        <p className="text-xs text-slate-500 mb-4">Connect systems, devices and files to the canonical carbon model</p>

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
        <h3 className="font-bold text-slate-900 text-sm">Active Data Connections</h3>
        <div className="space-y-2 text-xs">
          {connections.map((c, i) => (
            <div key={i} className="flex items-center justify-between p-3.5 bg-slate-50 rounded-xl border border-slate-100">
              <div className="flex items-center gap-3">
                <Database className="w-5 h-5 text-blue-600" />
                <div>
                  <h4 className="font-bold text-slate-900">{c.name}</h4>
                  <p className="text-[10px] text-slate-500">{c.type}</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <span className={`px-2.5 py-0.5 rounded font-bold text-[10px] ${c.badge}`}>{c.status}</span>
                <span className="font-mono text-slate-500">{c.time}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
