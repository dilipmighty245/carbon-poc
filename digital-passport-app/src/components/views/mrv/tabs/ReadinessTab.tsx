import React from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2, ArrowRight } from 'lucide-react';
import { useMrv } from '../../../../context/MrvContext';
import { READINESS_CHECKS } from '../../../../data/mrvMockData';
import { Kpi, SectionCard, StatusBadge, Field } from '../shared';

export const ReadinessTab: React.FC = () => {
  const navigate = useNavigate();
  const { meta, engagement, freezeDataset, evidence } = useMrv();
  const blockers = engagement.planApproved ? 0 : 2;

  const go = (link?: string | null) => {
    if (!link) return;
    if (link === 'mrv:evidence') navigate('/mrv/evidence');
    else navigate(link);
  };

  return (
    <div className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Kpi
          testid="kpi-readiness"
          label="Readiness Score"
          value={`${engagement.planApproved ? 100 : meta.readiness}%`}
          tone="green"
          hint={engagement.planApproved ? "All checks passed" : "2 blockers remaining"}
        />
        <Kpi
          testid="kpi-blockers"
          label="Critical Blockers"
          value={blockers}
          tone={blockers ? "amber" : "green"}
        />
        <Kpi testid="kpi-coverage" label="Evidence Coverage" value="96%" />
        <Kpi testid="kpi-calc-status" label="Calculation Status" value="Complete" tone="green" />
      </div>

      <SectionCard
        title="Readiness Checklist"
        testid="readiness-checklist"
        action={<StatusBadge status={engagement.planApproved ? "READY FOR VERIFICATION" : "ACTION REQUIRED"} />}
      >
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-left text-xs font-bold uppercase tracking-wide text-slate-400">
                <th className="py-2 pr-4">Requirement</th>
                <th className="py-2 pr-4">Source</th>
                <th className="py-2 pr-4">Status</th>
                <th className="py-2 pr-4">Issue</th>
                <th className="py-2 pr-4">Owner</th>
                <th className="py-2">Action</th>
              </tr>
            </thead>
            <tbody>
              {READINESS_CHECKS.map((r) => {
                const status = engagement.planApproved && r.status !== "PASSED" ? "PASSED" : r.status;
                return (
                  <tr
                    key={r.req}
                    data-testid={`readiness-row-${r.req.toLowerCase().replace(/[^a-z]+/g, "-")}`}
                    onClick={() => go(r.link)}
                    className="cursor-pointer border-b border-slate-50 hover:bg-slate-50"
                  >
                    <td className="py-3 pr-4 font-semibold text-slate-800">{r.req}</td>
                    <td className="py-3 pr-4 text-slate-500">{r.source}</td>
                    <td className="py-3 pr-4"><StatusBadge status={status} /></td>
                    <td className="py-3 pr-4 text-slate-500">{status === "PASSED" ? "—" : r.issue}</td>
                    <td className="py-3 pr-4 text-slate-500">Carbon Manager</td>
                    <td className="py-3">
                      {r.link && (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700">
                          Open <ArrowRight className="h-3 w-3" />
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </SectionCard>

      <div className="grid gap-5 lg:grid-cols-3">
        <SectionCard title="Verification Package Preview" className="lg:col-span-2">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <Field label="PCF Project" value={meta.pcfProject} mono />
            <Field label="Calculation" value="V1.0" />
            <Field label="Activity Records" value={meta.activityRecords} />
            <Field label="Evidence" value={meta.evidenceItems} />
            <Field label="Boundary" value={meta.boundary} />
            <Field label="Claim" value={`${meta.claimedIntensity} kgCO2e/kg`} />
            <Field label="Data Quality" value={`${meta.dataQuality}/100`} />
            <Field label="Pending Evidence" value={evidence.filter(e => e.status === 'PENDING').length} />
          </div>
        </SectionCard>
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5 flex flex-col justify-between">
          <div>
            <CheckCircle2 className="h-8 w-8 text-emerald-600" />
            <p className="mt-3 text-lg font-extrabold text-emerald-800">
              {engagement.planApproved ? "READY FOR VERIFICATION" : "2 blockers before submission"}
            </p>
            <p className="mt-1 text-sm text-emerald-700">
              {engagement.planApproved ? "The verification package can be submitted." : "Resolve outstanding evidence and internal approval."}
            </p>
          </div>
          <button
            data-testid="readiness-resolve-btn"
            onClick={freezeDataset}
            className="mt-4 w-full rounded-xl bg-emerald-600 px-4 py-2.5 font-bold text-white shadow-xs hover:bg-emerald-700 transition-colors text-xs"
          >
            {engagement.planApproved ? "Submit Verification Package" : "Resolve Blockers"}
          </button>
        </div>
      </div>
    </div>
  );
};
