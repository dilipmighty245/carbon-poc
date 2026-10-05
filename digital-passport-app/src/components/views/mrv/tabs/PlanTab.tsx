import React from 'react';
import { CheckCircle2 } from 'lucide-react';
import { useMrv } from '../../../../context/MrvContext';
import { RISK_ASSESSMENT, SAMPLING_PLAN, PROCEDURES, PLAN_SCHEDULE } from '../../../../data/mrvMockData';
import { StatusBadge, Field, SectionCard } from '../shared';

const OBJECTIVES = [
  ["Claim Being Verified", "2.84 kgCO2e/kg (284.0 tCO2e)"],
  ["Verification Scope", "Full cradle-to-gate PCF"],
  ["System Boundary", "Cradle-to-Gate"],
  ["Verification Criteria", "ISO 14064-3"],
  ["Methodology", "ISO 14067"],
  ["Verification Approach", "Recalculation + evidence testing"],
  ["Materiality Approach", "5% of total footprint"],
  ["Sampling Approach", "Risk-based judgemental sampling"],
];

export const PlanTab: React.FC = () => {
  const { meta, engagement, freezeDataset } = useMrv();

  return (
    <div className="space-y-5">
      <SectionCard testid="plan-top" action={<StatusBadge status={engagement.planApproved ? "PLAN APPROVED" : "DRAFT"} />}>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-7 text-xs">
          <Field label="Engagement" value={meta.engagementId} mono />
          <Field label="Organisation" value={meta.organisation} />
          <Field label="Facility" value={meta.facility} />
          <Field label="Product" value={meta.product} />
          <Field label="Batch" value={meta.batch} mono />
          <Field label="Claim" value={`${meta.claimedIntensity} kg`} />
          <Field label="Reporting Period" value={meta.reportingPeriod} />
        </div>
      </SectionCard>

      <SectionCard title="Verification Objectives" testid="plan-objectives">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 text-xs">
          {OBJECTIVES.map(([l, v]) => <Field key={l} label={l} value={v} />)}
        </div>
      </SectionCard>

      <SectionCard title="Risk Assessment" testid="plan-risk">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-left text-xs font-bold uppercase tracking-wide text-slate-400">
                {["Area", "Inherent Risk", "Control Risk", "Impact", "Priority", "Planned Procedure"].map((h) => <th key={h} className="py-2.5 pr-3">{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {RISK_ASSESSMENT.map((r) => (
                <tr key={r.area} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                  <td className="py-3 pr-3 font-semibold text-slate-800">{r.area}</td>
                  <td className="py-3 pr-3"><StatusBadge status={r.inherent} /></td>
                  <td className="py-3 pr-3"><StatusBadge status={r.control} /></td>
                  <td className="py-3 pr-3"><StatusBadge status={r.impact} /></td>
                  <td className="py-3 pr-3"><StatusBadge status={r.priority} /></td>
                  <td className="py-3 pr-3 text-slate-500 text-xs">{r.procedure}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SectionCard>

      <SectionCard title="Sampling Plan" testid="plan-sampling">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-left text-xs font-bold uppercase tracking-wide text-slate-400">
                {["Population", "Sample Size", "Selection", "Reason", "Evidence", "Verifier"].map((h) => <th key={h} className="py-2.5 pr-3">{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {SAMPLING_PLAN.map((s) => (
                <tr key={s.pop} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                  <td className="py-3 pr-3 font-semibold text-slate-800">{s.pop}</td>
                  <td className="py-3 pr-3 text-slate-600 text-xs">{s.size}</td>
                  <td className="py-3 pr-3 text-slate-500 text-xs">{s.selection}</td>
                  <td className="py-3 pr-3 text-slate-500 text-xs">{s.reason}</td>
                  <td className="py-3 pr-3 font-mono text-xs text-emerald-700">{s.evidence}</td>
                  <td className="py-3 pr-3 text-slate-500 text-xs">{s.verifier}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SectionCard>

      <div className="grid gap-5 lg:grid-cols-3">
        <SectionCard title="Verification Procedures" testid="plan-procedures">
          <div className="flex flex-wrap gap-2">
            {PROCEDURES.map((p) => (
              <span key={p} className="rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 border border-emerald-100">{p}</span>
            ))}
          </div>
        </SectionCard>

        <SectionCard title="Plan Schedule" className="lg:col-span-2" testid="plan-schedule">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-left text-xs font-bold uppercase tracking-wide text-slate-400">
                  {["Task", "Owner", "Start", "Due", "Status"].map((h) => <th key={h} className="py-2.5 pr-3">{h}</th>)}
                </tr>
              </thead>
              <tbody>
                {PLAN_SCHEDULE.map((s) => (
                  <tr key={s.task} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                    <td className="py-3 pr-3 font-semibold text-slate-800 text-xs">{s.task}</td>
                    <td className="py-3 pr-3 text-slate-500 text-xs">{s.owner}</td>
                    <td className="py-3 pr-3 text-slate-500 text-xs">{s.start}</td>
                    <td className="py-3 pr-3 text-slate-500 text-xs">{s.due}</td>
                    <td className="py-3 pr-3"><StatusBadge status={s.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </SectionCard>
      </div>

      <div className="flex items-center justify-between rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
        <div className="flex items-center gap-3">
          <CheckCircle2 className="h-6 w-6 text-emerald-600" />
          <p className="font-bold text-emerald-800 text-xs">{engagement.planApproved ? "PLAN APPROVED" : "Awaiting approval"}</p>
        </div>
        <button
          data-testid="plan-approve-btn"
          onClick={freezeDataset}
          className="rounded-xl bg-emerald-600 px-4 py-2 font-bold text-white shadow-xs hover:bg-emerald-700 transition-colors text-xs"
        >
          Approve Verification Plan
        </button>
      </div>
    </div>
  );
};
