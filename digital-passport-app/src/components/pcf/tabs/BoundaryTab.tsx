import React, { useEffect, useState } from 'react';
import { usePcf } from '../../../context/PcfContext';
import { Section } from '../common/Section';
import { StatusChip } from '../common/StatusChip';
import { BOUNDARY_STAGES, LIFECYCLE_FLOW, EXCLUSIONS } from '../../../data/pcfData';
import { ArrowRight, CheckCircle2, XCircle, FileText, ShieldAlert } from 'lucide-react';
import { toast } from '../../../utils/toast';

const SCOPE_MAP = [
  { scope: 'Scope 1', tone: 'amber', items: ['Direct combustion', 'Diesel', 'Gas', 'Refrigerants', 'Process emissions'] },
  { scope: 'Scope 2', tone: 'blue', items: ['Purchased electricity', 'Purchased energy'] },
  { scope: 'Scope 3', tone: 'green', items: ['Raw materials', 'Suppliers', 'Transport', 'Packaging', 'Waste'] },
];

interface BoundaryTabProps {
  registerPrimary: (fn: () => void) => void;
}

export function BoundaryTab({ registerPrimary }: BoundaryTabProps) {
  const { boundaryType, setBoundaryType, boundaryApproved, setBoundaryApproved } = usePcf();
  const [approved, setApproved] = useState(boundaryApproved);

  useEffect(() => {
    registerPrimary(() => {
      setApproved(true);
      setBoundaryApproved(true);
      toast.success('Boundary approved.');
    });
  }, [registerPrimary, setBoundaryApproved]);

  return (
    <div className="space-y-6">
      <Section
        title="Boundary Type"
        testId="section-boundary-type"
        right={approved ? <StatusChip status="BOUNDARY APPROVED" tone="green" /> : <StatusChip status="REVIEW" />}
      >
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
            <span>Selected boundary</span>
            <select
              value={boundaryType}
              onChange={(e) => setBoundaryType(e.target.value)}
              data-testid="select-boundary-type"
              className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-xs font-bold text-slate-900 focus:outline-none focus:border-emerald-500 shadow-xs"
            >
              <option value="Cradle-to-Gate">Cradle-to-Gate</option>
              <option value="Gate-to-Gate">Gate-to-Gate</option>
              <option value="Cradle-to-Grave">Cradle-to-Grave</option>
              <option value="Custom">Custom</option>
            </select>
          </div>
          <div className="rounded-full bg-slate-900 px-3.5 py-1 text-xs font-bold uppercase tracking-wider text-white shadow-xs">
            {boundaryType}
          </div>
        </div>

        {/* Lifecycle visual */}
        <div className="mt-5 flex flex-wrap items-center gap-2 overflow-x-auto rounded-xl border border-slate-200 bg-slate-50/70 p-4">
          {LIFECYCLE_FLOW.map((s, i) => (
            <React.Fragment key={s.key}>
              <div
                className={`whitespace-nowrap rounded-lg border px-3.5 py-2 text-xs font-bold uppercase tracking-wider ${
                  s.inCTG
                    ? 'border-emerald-500/40 bg-white text-slate-900 shadow-xs'
                    : 'border-slate-200 bg-slate-100 text-slate-300 line-through'
                }`}
              >
                {s.label}
              </div>
              {i < LIFECYCLE_FLOW.length - 1 && <ArrowRight className="h-4 w-4 shrink-0 text-slate-400" />}
            </React.Fragment>
          ))}
        </div>
      </Section>

      {/* Scope mappings */}
      <div className="grid gap-4 md:grid-cols-3">
        {SCOPE_MAP.map((sc) => (
          <div key={sc.scope} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-900">{sc.scope}</span>
              <StatusChip status="INCLUDED" tone={sc.tone} />
            </div>
            <ul className="space-y-1.5 text-xs font-medium text-slate-600">
              {sc.items.map((it) => (
                <li key={it} className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  {it}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {/* Lifecycle stages table */}
      <Section title="System Boundary Breakdown" testId="section-stages">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/80 text-left text-[11px] uppercase tracking-wider text-slate-400 font-bold">
                {['Lifecycle Stage', 'Included in Boundary', 'Scope', 'Reason / Description', 'Materiality', 'Evidence'].map((h) => (
                  <th key={h} className="px-4 py-2.5 font-bold">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {BOUNDARY_STAGES.map((s) => (
                <tr key={s.stage} className="hover:bg-slate-50/60">
                  <td className="px-4 py-3 font-bold text-slate-900">{s.stage}</td>
                  <td className="px-4 py-3">
                    {s.included ? (
                      <span className="inline-flex items-center gap-1 font-bold text-emerald-700">
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" /> Yes
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 font-semibold text-slate-400">
                        <XCircle className="h-3.5 w-3.5" /> No
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 font-mono font-bold text-slate-700">{s.scope}</td>
                  <td className="px-4 py-3 text-slate-600 font-medium">{s.reason}</td>
                  <td className="px-4 py-3">
                    <StatusChip status={s.materiality} />
                  </td>
                  <td className="px-4 py-3">
                    {s.evidence ? <FileText className="h-4 w-4 text-emerald-600" /> : <span className="text-slate-300">—</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      {/* Exclusions */}
      <Section title="Boundary Exclusions & Cutoff Justification" testId="section-exclusions">
        <div className="space-y-3">
          {EXCLUSIONS.map((ex) => (
            <div key={ex.activity} className="rounded-xl border border-slate-200 bg-slate-50/60 p-4 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs text-slate-900">{ex.activity}</span>
                <span className="text-[11px] font-bold text-slate-400">Est. Impact: {ex.materiality}</span>
              </div>
              <p className="text-xs text-slate-600 font-medium">{ex.justification}</p>
              <div className="flex items-center justify-between pt-1 text-[10px] text-slate-400 font-medium">
                <span>Reason: {ex.reason}</span>
                <span>Approved by {ex.approvedBy} on {ex.date}</span>
              </div>
            </div>
          ))}
        </div>
      </Section>
    </div>
  );
}
