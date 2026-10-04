import React from 'react';
import { useNavigate } from 'react-router-dom';
import { UserCheck, ShieldCheck, CheckCircle2, Award, FileText, ArrowRight, Building2, User } from 'lucide-react';
import { useMrv } from '../../../../context/MrvContext';
import { VERIFIER_ORGS, VERIFIER_TEAM } from '../../../../data/mrvMockData';
import { Kpi, StatusBadge, Field, SectionCard } from '../shared';
import { toast } from '../../../../utils/toast';

export const OnboardingTab: React.FC = () => {
  const navigate = useNavigate();
  const { meta } = useMrv();

  const assignedOrg = VERIFIER_ORGS.find((o) => o.org === meta.verifierOrg) || VERIFIER_ORGS[0];

  const onboardingChecklist = [
    { label: 'ISO 14065 / ISO 14066 Competency Verification', status: 'PASSED', detail: 'UKAS 0042 Documentary reference on file' },
    { label: 'Lead Verifier Sector Qualification', status: 'PASSED', detail: `${meta.leadVerifier} · ISO 14064-3 Certified Lead Verifier` },
    { label: 'Technical Reviewer Independence', status: 'PASSED', detail: 'Ir. Anneke de Vries · Independent Technical Peer Reviewer' },
    { label: 'Document Access & Evidence Vault Permission', status: 'GRANTED', detail: 'Read-only access granted to frozen dataset V1.0' },
    { label: 'Terms of Reference & Engagement Contract', status: 'SIGNED', detail: 'Ref: TOR-2026-ST-0981' },
  ];

  return (
    <div className="space-y-5">
      {/* Top Summary Banner */}
      <div className="rounded-2xl border border-emerald-500/30 bg-slate-900 p-6 text-white shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-emerald-400 uppercase tracking-widest">
            <UserCheck className="w-4 h-4 text-emerald-400" />
            <span>Verifier Onboarding & Qualification Status</span>
          </div>
          <h2 className="text-xl font-extrabold text-white mt-1">
            {assignedOrg.org} · Assigned Verification Team
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Accredited Verification Body for {meta.organisation} ({meta.facility}) · Batch <span className="font-mono text-emerald-300 font-bold">{meta.batch}</span>
          </p>
        </div>

        <button
          onClick={() => {
            toast.success('Onboarding complete. Proceeding to Conflict of Interest check.');
            navigate('/mrv/conflict');
          }}
          className="px-4 py-2.5 bg-[#00E599] hover:bg-[#00c985] text-slate-950 font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-2 shrink-0"
        >
          <span>Run Conflict Check</span>
          <ArrowRight className="w-4 h-4 stroke-[2.5]" />
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Kpi testid="kpi-[#00E599]-lead" label="Lead Verifier" value={meta.leadVerifier} tone="green" />
        <Kpi testid="kpi-tech-reviewer" label="Technical Reviewer" value={meta.technicalReviewer} />
        <Kpi testid="kpi-accreditation" label="Accreditation Body" value={assignedOrg.ref.split(' ')[0] || 'UKAS'} tone="green" />
        <Kpi testid="kpi-onboarding-status" label="Onboarding Status" value="AUTHORISED" tone="green" />
      </div>

      {/* Verification Body Profile */}
      <SectionCard title="Assigned Verification Body Profile" testid="verifier-body-profile">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-3 flex-1">
            <div className="flex items-center gap-2">
              <Building2 className="w-5 h-5 text-emerald-600" />
              <h3 className="font-extrabold text-slate-900 text-base">{assignedOrg.org}</h3>
              <StatusBadge status="ACTIVE ACCREDITED" />
            </div>

            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 text-xs bg-slate-50 p-4 rounded-xl border border-slate-200">
              <Field label="Country" value={assignedOrg.country} />
              <Field label="Recognition Reference" value={assignedOrg.ref} />
              <Field label="Certificate ID" value={assignedOrg.cert} mono />
              <Field label="Accreditation Period" value={assignedOrg.validity} />
              <Field label="Authorized Scope" value={assignedOrg.scope} />
              <Field label="Sector Experience" value={assignedOrg.sector} />
              <Field label="Address" value={assignedOrg.address} />
              <Field label="Contact" value={assignedOrg.contact} />
            </div>
          </div>
        </div>
      </SectionCard>

      {/* Verification Team & Qualifications */}
      <SectionCard
        title="Assigned Verification Team & Credentials"
        testid="verification-team-qualifications"
        action={<StatusBadge status="TEAM ASSIGNED" />}
      >
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {VERIFIER_TEAM.map((m) => (
            <div key={m.name} className="rounded-xl border border-slate-200 bg-white p-4 space-y-2 shadow-xs hover:border-emerald-300 transition-colors">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <span className="text-[10px] font-bold uppercase tracking-wide text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  {m.role}
                </span>
                <User className="w-4 h-4 text-slate-400" />
              </div>

              <div>
                <p className="font-bold text-slate-900 text-sm">{m.name}</p>
                <p className="text-xs text-slate-600 font-medium mt-0.5">{m.qual}</p>
                <p className="text-[11px] text-slate-500 mt-1">{m.sector}</p>
              </div>

              <div className="pt-2 flex items-center justify-between text-xs border-t border-slate-100 mt-2">
                <span className="text-slate-400 text-[10px] font-mono">{m.engagements} engagements</span>
                <StatusBadge status={m.independence} />
              </div>
            </div>
          ))}
        </div>
      </SectionCard>

      {/* Onboarding Compliance Checklist */}
      <SectionCard title="Onboarding & Independence Checklist" testid="onboarding-checklist">
        <div className="space-y-2.5">
          {onboardingChecklist.map((item, idx) => (
            <div
              key={idx}
              className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs"
            >
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <div>
                  <span className="font-bold text-slate-900 block">{item.label}</span>
                  <span className="text-[11px] text-slate-500">{item.detail}</span>
                </div>
              </div>
              <StatusBadge status={item.status} />
            </div>
          ))}
        </div>

        <div className="pt-4 flex items-center justify-between border-t border-slate-100 mt-4">
          <span className="text-xs text-slate-500 font-medium">
            All 5 onboarding criteria verified. Ready for independence & conflict of interest declaration.
          </span>
          <button
            onClick={() => {
              toast.success('Navigating to Conflict Check...');
              navigate('/mrv/conflict');
            }}
            className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
          >
            <span>Proceed to Conflict Check</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </SectionCard>
    </div>
  );
};
