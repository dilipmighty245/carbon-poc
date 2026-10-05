import React from 'react';
import { useNavigate } from 'react-router-dom';
import { UserPlus, FileSearch, MessageSquare, Flag, RefreshCw, CheckCircle2 } from 'lucide-react';
import { useMrv } from '../../../../context/MrvContext';
import { Kpi, StatusBadge, Field, SectionCard } from '../shared';

const TIMELINE = [
  "SUBMITTED", "ACCEPTED", "CONFLICT CHECK", "PLANNING", "EVIDENCE REVIEW",
  "CALCULATION REVIEW", "SITE VISIT", "FINDINGS", "CORRECTIONS", "TECHNICAL REVIEW", "FINAL OPINION"
];

export const EngagementsTab: React.FC = () => {
  const navigate = useNavigate();
  const { meta, engagement, audit, findings } = useMrv();

  const openFindingsCount = findings.filter(f => f.status === 'OPEN').length;
  const stageIndex = engagement.planApproved ? 5 : 3;

  const feed = [
    { icon: Flag, text: "Finding raised — FND-026-003", when: audit[0]?.ts },
    { icon: FileSearch, text: "Evidence reviewed — EVD-00184 accepted", when: "2026-05-12 11:30" },
    { icon: MessageSquare, text: "Query raised on CALC-0048", when: "2026-05-11 14:15" },
    { icon: UserPlus, text: "Verifier assigned — " + meta.verifierOrg, when: "2026-04-21 09:15" },
    { icon: RefreshCw, text: "Calculation frozen — V1.0 snapshot", when: "2026-04-18 14:00" },
  ];

  return (
    <div className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Kpi testid="kpi-active-engagements" label="Active Engagements" value={1} />
        <Kpi testid="kpi-current-stage" label="Current Stage" value="In Review" tone="green" />
        <Kpi testid="kpi-days-open" label="Days Open" value={57} />
        <Kpi testid="kpi-outstanding-actions" label="Outstanding Actions" value={openFindingsCount} tone={openFindingsCount ? "amber" : "green"} />
      </div>

      <SectionCard testid="engagement-card">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <span className="rounded-lg bg-emerald-500 px-3 py-1 font-mono text-sm font-bold text-slate-900">{meta.engagementId}</span>
              <h3 className="text-xl font-extrabold text-slate-900">Independent PCF Verification</h3>
              <StatusBadge status="IN REVIEW" />
            </div>
            <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 text-xs">
              <Field label="Organisation" value={meta.organisation} />
              <Field label="Facility" value={meta.facility} />
              <Field label="Product" value={meta.product} />
              <Field label="Batch" value={meta.batch} mono />
              <Field label="PCF Project" value={meta.pcfProject} mono />
              <Field label="Submitted Calculation" value="V1.0" />
              <Field label="Claim" value={`${meta.claimedIntensity} kgCO2e/kg`} />
              <Field label="Verifier" value={meta.verifierOrg} />
              <Field label="Lead Verifier" value={meta.leadVerifier} />
            </div>
          </div>
          <button
            data-testid="engagement-open-btn"
            onClick={() => navigate("/mrv/readiness")}
            className="rounded-xl bg-emerald-600 px-4 py-2 font-bold text-white shadow-xs hover:bg-emerald-700 transition-colors text-xs"
          >
            Open Readiness
          </button>
        </div>
      </SectionCard>

      <div className="grid gap-5 lg:grid-cols-3">
        <SectionCard title="Engagement Information" className="lg:col-span-2" testid="engagement-info">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 text-xs">
            <Field label="Start Date" value="2026-04-08" />
            <Field label="Target Completion" value="2026-06-05" />
            <Field label="Verification Scope" value="Cradle-to-Gate PCF" />
            <Field label="Boundary" value={meta.boundary} />
            <Field label="Verification Criteria" value="ISO 14064-3" />
            <Field label="Applicable Methodology" value="ISO 14067" />
            <Field label="Materiality Criteria" value="5% of total footprint" />
            <Field label="Assurance Level" value="Reasonable assurance" />
            <Field label="Assigned Team" value="4 members" />
          </div>
        </SectionCard>

        <SectionCard title="Activity Feed" testid="engagement-feed">
          <ul className="space-y-3">
            {feed.map((f, i) => {
              const Icon = f.icon;
              return (
                <li key={i} className="flex items-start gap-3 text-xs">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                    <Icon className="h-3.5 w-3.5" />
                  </span>
                  <div>
                    <p className="font-medium text-slate-700">{f.text}</p>
                    {f.when && <p className="text-[10px] text-slate-400">{f.when}</p>}
                  </div>
                </li>
              );
            })}
          </ul>
        </SectionCard>
      </div>

      <SectionCard title="Engagement Timeline" testid="engagement-timeline">
        <div className="overflow-x-auto pb-2">
          <div className="flex min-w-max items-center gap-2">
            {TIMELINE.map((t, i) => (
              <React.Fragment key={t}>
                <div className="flex flex-col items-center gap-1.5">
                  <span className={`flex h-6 w-6 items-center justify-center rounded-full border text-xs font-bold ${
                    i <= stageIndex ? "border-emerald-500 bg-emerald-500 text-white" : "border-slate-300 bg-white text-slate-400"
                  }`}>
                    {i <= stageIndex ? <CheckCircle2 className="h-3.5 w-3.5" /> : i + 1}
                  </span>
                  <span className={`text-[10px] font-bold uppercase ${i <= stageIndex ? "text-emerald-700" : "text-slate-400"}`}>{t}</span>
                </div>
                {i < TIMELINE.length - 1 && <span className="text-slate-300">→</span>}
              </React.Fragment>
            ))}
          </div>
        </div>
      </SectionCard>
    </div>
  );
};
