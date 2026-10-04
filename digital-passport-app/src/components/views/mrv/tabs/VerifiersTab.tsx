import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, ShieldCheck, UserCheck, ArrowRight } from 'lucide-react';
import { useMrv } from '../../../../context/MrvContext';
import { VERIFIER_ORGS, VERIFIER_TEAM } from '../../../../data/mrvMockData';
import { Kpi, StatusBadge, Field, SectionCard } from '../shared';
import type { VerifierOrgItem } from '../../../../types/mrv';
import { toast } from '../../../../utils/toast';

export const VerifiersTab: React.FC = () => {
  const { engagement } = useMrv();
  const navigate = useNavigate();
  const [sel, setSel] = useState<VerifierOrgItem | null>(null);

  const handleAssign = (orgName: string) => {
    toast.success(`Assigned ${orgName} — opening verifier team onboarding.`);
    navigate('/mrv/onboarding');
  };

  return (
    <div className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Kpi testid="kpi-verifier-orgs" label="Verifier Organisations" value={VERIFIER_ORGS.length} />
        <Kpi testid="kpi-available-verifiers" label="Available Verifiers" value={10} />
        <Kpi testid="kpi-assigned-engagements" label="Assigned Engagements" value={4} tone="green" />
        <Kpi testid="kpi-expiring-credentials" label="Expiring Credentials" value={1} tone="amber" />
      </div>

      <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-xs text-amber-800">
        <ShieldCheck className="mt-0.5 h-5 w-5 text-amber-600 shrink-0" />
        <p>
          Accreditation is <b>not</b> assumed. The platform stores documentary recognition references and certificates only — it does not automatically certify a verifier as accredited.
        </p>
      </div>

      <SectionCard 
        title="Verifier Organisations" 
        testid="verifier-orgs"
        action={
          <button
            onClick={() => handleAssign('Meridian Assurance Ltd')}
            className="text-xs font-bold text-slate-950 bg-[#00E599] hover:bg-[#00c985] px-3 py-1.5 rounded-xl transition-colors flex items-center gap-1.5 shadow-xs"
          >
            <UserCheck className="w-3.5 h-3.5" />
            <span>Assign Verifier</span>
          </button>
        }
      >
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-left text-xs font-bold uppercase tracking-wide text-slate-400">
                {["Organisation", "Country", "Scope", "Recognition Ref", "Validity", "Personnel", "Engagements", "Status", "Actions"].map((h) => (
                  <th key={h} className="py-2.5 pr-3">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {VERIFIER_ORGS.map((o) => (
                <tr key={o.org} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                  <td className="py-3 pr-3 font-semibold text-slate-800">{o.org}</td>
                  <td className="py-3 pr-3 text-slate-500">{o.country}</td>
                  <td className="py-3 pr-3 text-slate-500">{o.scope}</td>
                  <td className="py-3 pr-3 text-slate-500">{o.ref}</td>
                  <td className="py-3 pr-3 text-slate-500">{o.validity}</td>
                  <td className="py-3 pr-3 text-slate-500">{o.personnel}</td>
                  <td className="py-3 pr-3 text-slate-500">{o.engagements}</td>
                  <td className="py-3 pr-3"><StatusBadge status={o.status} /></td>
                  <td className="py-3 pr-3">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleAssign(o.org)}
                        className="text-xs font-bold text-slate-950 bg-[#00E599] hover:bg-[#00c985] px-2.5 py-1 rounded-lg transition-colors flex items-center gap-1"
                      >
                        <span>Assign Verifier</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => setSel(o)}
                        className="text-xs font-bold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-lg hover:bg-slate-200"
                      >
                        Profile
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SectionCard>

      <SectionCard
        title="Verification Team"
        testid="verification-team"
        action={<StatusBadge status={engagement.planApproved ? "VERIFIER ASSIGNED" : "UNASSIGNED"} />}
      >
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {VERIFIER_TEAM.map((m) => (
            <div key={m.name} className="rounded-xl border border-slate-200 p-4 space-y-1">
              <p className="text-[10px] font-bold uppercase tracking-wide text-emerald-600">{m.role}</p>
              <p className="font-bold text-slate-800 text-sm">{m.name}</p>
              <p className="text-xs text-slate-500">{m.qual}</p>
              <p className="text-xs text-slate-500">{m.sector}</p>
              <div className="pt-2 flex items-center justify-between text-xs border-t border-slate-100 mt-2">
                <span className="text-slate-400 text-[11px]">{m.engagements} engagements</span>
                <StatusBadge status={m.independence} />
              </div>
            </div>
          ))}
        </div>
      </SectionCard>

      {/* Profile Drawer */}
      {sel && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex justify-end z-50">
          <div className="bg-white w-full max-w-lg h-full p-6 overflow-y-auto space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Building2 className="h-5 w-5 text-emerald-600" />
                <h3 className="font-bold text-slate-900 text-base">{sel.org}</h3>
              </div>
              <button onClick={() => setSel(null)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>
            <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl text-xs">
              <Field label="Address" value={sel.address} />
              <Field label="Country" value={sel.country} />
              <Field label="Website" value={sel.website} />
              <Field label="Contact" value={sel.contact} />
              <Field label="Scope" value={sel.scope} />
              <Field label="Sector" value={sel.sector} />
              <Field label="Certificate" value={sel.cert} mono />
              <Field label="Validity" value={sel.validity} />
            </div>
            <div className="pt-4 flex justify-end">
              <button
                onClick={() => setSel(null)}
                className="px-4 py-2 bg-slate-900 text-white font-bold text-xs rounded-xl"
              >
                Close Profile
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
