import React from 'react';
import { ShieldCheck, Key, Settings, UserCheck } from 'lucide-react';

export const AdminView: React.FC = () => {
  const kpis = [
    { title: 'System Status', val: 'OPERATIONAL', subtitle: '99.99% uptime' },
    { title: 'Active Users', val: '24', subtitle: 'Across 4 organization roles' },
    { title: 'API Gateway Requests', val: '142.8k / day', subtitle: 'Avg latency 42ms' },
    { title: 'Security Audit Log', val: 'PASSING', subtitle: 'Zero compliance flags' },
  ];

  const users = [
    { name: 'Kofi Mensah', role: 'Sustainability Lead / Admin', email: 'kofi@saurient.org', status: 'ACTIVE' },
    { name: 'Ama Osei', role: 'Verifier / Auditor', email: 'ama.osei@verifier.gh', status: 'ACTIVE' },
    { name: 'Kwame Nkrumah', role: 'Factory Operations Manager', email: 'kwame@plant.saurient.org', status: 'ACTIVE' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Platform Governance & Administration</h1>
        <p className="text-xs text-slate-500">Manage user permissions, security keys, audit logs and system settings</p>
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
        <h3 className="font-bold text-slate-900 text-sm">User Access Management</h3>
        <div className="space-y-3 text-xs">
          {users.map((u, i) => (
            <div key={i} className="flex items-center justify-between p-3.5 bg-slate-50 rounded-xl border border-slate-100">
              <div className="flex items-center gap-3">
                <UserCheck className="w-5 h-5 text-emerald-600" />
                <div>
                  <h4 className="font-bold text-slate-900">{u.name}</h4>
                  <p className="text-[10px] text-slate-500">{u.email} • {u.role}</p>
                </div>
              </div>
              <span className="bg-emerald-100 text-emerald-800 font-bold px-2.5 py-0.5 rounded text-[10px]">{u.status}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
