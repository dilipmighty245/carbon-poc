import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { GitBranch, ArrowRight, Lock, Plus } from 'lucide-react';
import { useMrv } from '../../../../context/MrvContext';
import { Kpi, StatusBadge, Field, SectionCard, RefLink } from '../shared';
import type { CorrectionItem } from '../../../../types/mrv';

const WF = ["Finding", "Company Response", "Correction", "Recalculate", "V1.1", "Verifier Review", "Accept / Reject", "Close Finding"];

export const CorrectionsTab: React.FC = () => {
  const navigate = useNavigate();
  const { meta, corrections } = useMrv();
  const [sel, setSel] = useState<CorrectionItem | null>(null);

  const counts = {
    required: corrections.filter((c) => c.status === "SUBMITTED").length,
    submitted: corrections.filter((c) => c.status === "SUBMITTED").length,
    accepted: corrections.filter((c) => c.status === "APPROVED").length,
    rejected: corrections.filter((c) => c.status === "REJECTED").length,
  };

  return (
    <div className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <Kpi testid="kpi-corrections-required" label="Corrections Required" value={counts.required} tone={counts.required ? "amber" : "green"} />
        <Kpi testid="kpi-corrections-submitted" label="Submitted" value={counts.submitted} />
        <Kpi testid="kpi-corrections-accepted" label="Accepted" value={counts.accepted} tone="green" />
        <Kpi testid="kpi-corrections-rejected" label="Rejected" value={counts.rejected} tone="red" />
        <Kpi testid="kpi-recalc-required" label="Recalculation Req." value={counts.accepted ? "Yes" : "Pending"} />
      </div>

      <SectionCard title="Corrections Register" testid="corrections-table">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-left text-xs font-bold uppercase tracking-wide text-slate-400">
                {["Correction ID", "Finding", "Affected Record", "Original", "Proposed", "PCF Impact", "Submitted By", "Status"].map((h) => (
                  <th key={h} className="py-2.5 pr-3">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {corrections.map((c) => (
                <tr key={c.id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors cursor-pointer" onClick={() => setSel(c)}>
                  <td className="py-3 pr-3"><RefLink id={c.id} onClick={() => setSel(c)} /></td>
                  <td className="py-3 pr-3 font-mono text-xs text-emerald-700">{c.finding}</td>
                  <td className="py-3 pr-3 text-slate-600 text-xs">{c.record}</td>
                  <td className="py-3 pr-3 text-slate-500 text-xs">{c.origQty.toLocaleString()} {c.origUnit}</td>
                  <td className="py-3 pr-3 text-slate-700 font-bold text-xs">{Number(c.newQty).toLocaleString()} {c.newUnit}</td>
                  <td className="py-3 pr-3 font-semibold text-slate-800 text-xs">+{c.pcfImpact} kg</td>
                  <td className="py-3 pr-3 text-slate-500 text-xs">{c.submittedBy}</td>
                  <td className="py-3 pr-3"><StatusBadge status={c.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SectionCard>

      <div className="grid gap-5 lg:grid-cols-2">
        <SectionCard title="Version Control" testid="version-control">
          <div className="flex items-center gap-3">
            <div className="rounded-xl border border-slate-300 bg-slate-50 p-4 text-center">
              <p className="font-mono text-base font-extrabold text-slate-700">V1.0</p>
              <div className="mt-1 flex items-center justify-center gap-1"><Lock className="h-3 w-3 text-slate-400" /><StatusBadge status="SUBMITTED" /></div>
              <p className="mt-1 text-[10px] font-bold uppercase text-slate-400">Frozen</p>
            </div>
            <ArrowRight className="h-5 w-5 text-slate-300" />
            <div className="rounded-xl border border-emerald-300 bg-emerald-50 p-4 text-center">
              <p className="font-mono text-base font-extrabold text-emerald-700">V1.1</p>
              <StatusBadge status={counts.accepted ? "ACCEPTED" : "PENDING"} />
              <p className="mt-1 text-[10px] font-bold uppercase text-emerald-600">{counts.accepted ? "Corrected" : "Pending review"}</p>
            </div>
          </div>
          <p className="mt-3 text-xs text-slate-500">The frozen V1.0 snapshot is never modified. Corrections create a new calculation version (V1.1) for verifier review.</p>
        </SectionCard>

        <SectionCard title="Correction Workflow" testid="correction-workflow">
          <div className="flex flex-wrap items-center gap-1.5 text-xs">
            {WF.map((w, i) => (
              <React.Fragment key={w}>
                <span className="rounded-md bg-slate-100 px-2 py-1 font-semibold text-slate-600">{w}</span>
                {i < WF.length - 1 && <ArrowRight className="h-3 w-3 text-slate-300" />}
              </React.Fragment>
            ))}
          </div>
        </SectionCard>
      </div>

      {sel && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex justify-end z-50">
          <div className="bg-white w-full max-w-lg h-full p-6 overflow-y-auto space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <GitBranch className="h-5 w-5 text-emerald-600" />
                <h3 className="font-bold text-slate-900 text-base">{sel.id}</h3>
              </div>
              <button onClick={() => setSel(null)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>
            <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl text-xs">
              <Field label="Finding" value={sel.finding} mono />
              <Field label="Record" value={sel.record} />
              <Field label="Original Qty" value={`${sel.origQty} ${sel.origUnit}`} />
              <Field label="New Qty" value={`${sel.newQty} ${sel.newUnit}`} />
              <Field label="Submitted By" value={sel.submittedBy} />
              <Field label="Reason" value={sel.reason} />
            </div>
            <div className="pt-4 flex justify-end">
              <button
                onClick={() => setSel(null)}
                className="px-4 py-2 bg-slate-900 text-white font-bold text-xs rounded-xl"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
