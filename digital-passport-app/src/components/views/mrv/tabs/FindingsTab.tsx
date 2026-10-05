import React, { useState } from 'react';
import { Flag, Plus } from 'lucide-react';
import { useMrv } from '../../../../context/MrvContext';
import { Kpi, StatusBadge, Field, SectionCard, RefLink } from '../shared';
import type { FindingItem } from '../../../../types/mrv';

const FILTERS = ["All", "Open", "Clarification", "Observation", "Non-conformity", "Potential Misstatement", "Material Issue", "Closed"];
const CLASSES = ["Clarification", "Observation", "Non-conformity", "Potential Misstatement", "Material Issue"];

export const FindingsTab: React.FC = () => {
  const { findings, resolveFinding } = useMrv();
  const [filter, setFilter] = useState("All");
  const [sel, setSel] = useState<FindingItem | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [area, setArea] = useState('');
  const [desc, setDesc] = useState('');
  const [classification, setClassification] = useState('Clarification');

  const rows = findings.filter((f) => {
    if (filter === "All") return true;
    if (filter === "Open") return f.status !== "CLOSED";
    if (filter === "Closed") return f.status === "CLOSED";
    return f.classification === filter;
  });

  const counts = {
    open: findings.filter((f) => f.status !== "CLOSED").length,
    material: findings.filter((f) => (f.classification === "Potential Misstatement" || f.classification === "Material Issue") && f.status !== "CLOSED").length,
    minor: findings.filter((f) => f.status !== "CLOSED" && f.classification !== "Potential Misstatement" && f.classification !== "Material Issue").length,
    closed: findings.filter((f) => f.status === "CLOSED").length,
  };

  return (
    <div className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Kpi testid="kpi-open-findings" label="Open Findings" value={counts.open} tone={counts.open ? "amber" : "green"} />
        <Kpi testid="kpi-material-findings" label="Potentially Material" value={counts.material} tone={counts.material ? "red" : "green"} />
        <Kpi testid="kpi-minor-findings" label="Minor" value={counts.minor} />
        <Kpi testid="kpi-closed-findings" label="Closed" value={counts.closed} tone="green" />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-1.5">
          {FILTERS.map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`rounded-full border px-3 py-1 text-xs font-semibold transition-colors ${
                filter === f
                  ? "border-emerald-500 bg-emerald-600 text-white"
                  : "border-slate-200 bg-white text-slate-600 hover:border-emerald-300"
              }`}
            >
              {f}
            </button>
          ))}
        </div>

        <button
          onClick={() => setAddOpen(true)}
          className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs flex items-center gap-1.5 shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Raise Finding</span>
        </button>
      </div>

      <SectionCard title={`Findings Register (${rows.length})`} testid="findings-table">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-left text-xs font-bold uppercase tracking-wide text-slate-400">
                {["Finding ID", "Classification", "Area", "Description", "Activity", "Calc", "Impact", "Owner", "Due", "Status"].map((h) => (
                  <th key={h} className="py-2.5 pr-3">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((f) => (
                <tr key={f.id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                  <td className="py-3 pr-3"><RefLink id={f.id} onClick={() => setSel(f)} /></td>
                  <td className="py-3 pr-3"><StatusBadge status={f.classification} /></td>
                  <td className="py-3 pr-3 text-slate-600 text-xs">{f.area}</td>
                  <td className="py-3 pr-3 max-w-xs truncate text-slate-600 text-xs">{f.desc}</td>
                  <td className="py-3 pr-3 font-mono text-xs text-emerald-700">{f.activity}</td>
                  <td className="py-3 pr-3 font-mono text-xs text-emerald-700">{f.calc}</td>
                  <td className="py-3 pr-3 text-slate-500 text-xs">{f.impact}</td>
                  <td className="py-3 pr-3 text-slate-500 text-xs">{f.owner}</td>
                  <td className="py-3 pr-3 text-slate-500 text-xs">{f.due}</td>
                  <td className="py-3 pr-3"><StatusBadge status={f.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SectionCard>

      {/* Detail Drawer */}
      {sel && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex justify-end z-50">
          <div className="bg-white w-full max-w-lg h-full p-6 overflow-y-auto space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Flag className="h-5 w-5 text-red-500" />
                <h3 className="font-bold text-slate-900 text-base">{sel.id}</h3>
              </div>
              <button onClick={() => setSel(null)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>
            <div className="flex items-center gap-2">
              <StatusBadge status={sel.classification} />
              <StatusBadge status={sel.status} />
            </div>
            <p className="text-xs text-slate-700 font-medium">{sel.desc}</p>
            <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl text-xs">
              <Field label="Created By" value={sel.createdBy} />
              <Field label="Created At" value={sel.createdAt} />
              <Field label="Requirement" value={sel.requirement} />
              <Field label="Activity" value={sel.activity} mono />
              <Field label="Calculation" value={sel.calc} mono />
              <Field label="Impact" value={sel.impact} />
            </div>
            <div className="pt-4 flex justify-between gap-2 border-t border-slate-100">
              {sel.status !== 'RESOLVED' && sel.status !== 'CLOSED' && (
                <button
                  onClick={() => {
                    resolveFinding(sel.id);
                    setSel(null);
                  }}
                  className="px-4 py-2 bg-emerald-600 text-white font-bold text-xs rounded-xl hover:bg-emerald-700"
                >
                  Resolve Finding
                </button>
              )}
              <button
                onClick={() => setSel(null)}
                className="px-4 py-2 bg-slate-100 text-slate-700 font-bold text-xs rounded-xl"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Raise Modal */}
      {addOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white w-full max-w-md rounded-2xl p-6 space-y-4 shadow-xl">
            <h3 className="text-base font-bold text-slate-900">Raise Verification Finding</h3>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                setAddOpen(false);
              }}
              className="space-y-3 text-xs"
            >
              <div>
                <label className="block font-bold text-slate-600 mb-1">Classification</label>
                <select
                  value={classification}
                  onChange={(e) => setClassification(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-800"
                >
                  {CLASSES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block font-bold text-slate-600 mb-1">Area</label>
                <input
                  type="text"
                  value={area}
                  onChange={(e) => setArea(e.target.value)}
                  placeholder="e.g. Supplier Data"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-800"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-600 mb-1">Description</label>
                <textarea
                  required
                  value={desc}
                  onChange={(e) => setDesc(e.target.value)}
                  placeholder="Describe finding..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-800 h-20"
                />
              </div>
              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setAddOpen(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700"
                >
                  Raise Finding
                </button>
              </div>
            </form>
          </div>
        </div >
      )}
    </div>
  );
};
