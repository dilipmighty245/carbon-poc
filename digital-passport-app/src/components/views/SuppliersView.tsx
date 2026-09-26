import React from 'react';
import { Users, Truck, CheckCircle2, ShieldAlert } from 'lucide-react';

export const SuppliersView: React.FC = () => {
  const [activeTab, setActiveTab] = React.useState('Suppliers');
  const tabs = ['Suppliers', 'Invitations', 'Declarations', 'Evidence', 'Scorecards', 'Supply Catalogue', 'Customer Requests', 'Customer Catalogue'];

  const kpis = [
    { title: 'Onboarded Suppliers', val: '42', subtitle: 'Scope 3 data network' },
    { title: 'Verified Declarations', val: '86%', subtitle: 'Third-party audited' },
    { title: 'Data Request Rate', val: '94%', subtitle: 'Response rate within 14 days' },
    { title: 'High-Risk Suppliers', val: '3', subtitle: 'Requires remediation' },
  ];

  const suppliers = [
    { name: 'Ashanti Farmers Cooperative', region: 'Ashanti, Ghana', status: 'VERIFIED', rating: 'A (0.14 kg CO2e/kg)', coverage: '100% trace' },
    { name: 'Western Cocoa Growers Assn', region: 'Western, Ghana', status: 'VERIFIED', rating: 'A (0.16 kg CO2e/kg)', coverage: '98% trace' },
    { name: 'Volta Logistics & Transport Ltd', region: 'Greater Accra, Ghana', status: 'PENDING AUDIT', rating: 'B (0.28 kg CO2e/km)', coverage: '85% trace' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Supplier Management</h1>
        <p className="text-xs text-slate-500 mb-4">Upstream primary emission data capture & supplier sustainability scoring</p>

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
        <h3 className="font-bold text-slate-900 text-sm">Supply Chain Partners</h3>
        <div className="space-y-3 text-xs">
          {suppliers.map((s, i) => (
            <div key={i} className="flex items-center justify-between p-3.5 bg-slate-50 rounded-xl border border-slate-100">
              <div className="flex items-center gap-3">
                <Users className="w-5 h-5 text-emerald-600" />
                <div>
                  <h4 className="font-bold text-slate-900">{s.name}</h4>
                  <p className="text-[10px] text-slate-500">{s.region} • Rating: {s.rating}</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-slate-600 font-medium">{s.coverage}</span>
                <span className="bg-emerald-100 text-emerald-800 font-bold px-2.5 py-0.5 rounded text-[10px]">{s.status}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
