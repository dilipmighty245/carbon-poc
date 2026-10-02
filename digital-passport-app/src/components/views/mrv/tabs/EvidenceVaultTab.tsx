import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileCheck2, Link2, Plus, Check, X, HelpCircle, Search } from 'lucide-react';
import { useMrv } from '../../../../context/MrvContext';
import { EVIDENCE_CATEGORIES } from '../../../../data/mrvMockData';
import { Kpi, StatusBadge, Field, SectionCard, RefLink } from '../shared';
import type { EvidenceItem } from '../../../../types/mrv';

export const EvidenceVaultTab: React.FC = () => {
  const navigate = useNavigate();
  const { meta, evidence, addEvidence } = useMrv();
  const [cat, setCat] = useState("All");
  const [sel, setSel] = useState<EvidenceItem | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState('Meter Data');
  const [newActivity, setNewActivity] = useState('');
  const [newDesc, setNewDesc] = useState('');

  const rows = evidence.filter((e) => cat === "All" || e.category === cat);
  const pending = evidence.filter((e) => e.status === "PENDING").length;
  const rejected = evidence.filter((e) => e.status === "REJECTED").length;
  const accepted = evidence.filter((e) => e.status === "ACCEPTED").length;

  const handleUpload = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle) return;
    addEvidence({
      title: newTitle,
      category: newCategory,
      activity: newActivity || '—',
      desc: newDesc,
    });
    setAddOpen(false);
    setNewTitle('');
    setNewActivity('');
    setNewDesc('');
  };

  return (
    <div className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Kpi testid="kpi-evidence-items" label="Evidence Items" value={meta.evidenceItems} />
        <Kpi testid="kpi-evidence-accepted" label="Accepted" value={accepted} tone="green" />
        <Kpi testid="kpi-evidence-pending" label="Pending Review" value={pending} tone="amber" />
        <Kpi testid="kpi-evidence-rejected" label="Rejected / Missing" value={rejected} tone="red" />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-1.5">
          {EVIDENCE_CATEGORIES.map((c) => (
            <button
              key={c}
              onClick={() => setCat(c)}
              className={`rounded-full border px-3 py-1 text-xs font-semibold transition-colors ${
                cat === c
                  ? "border-emerald-500 bg-emerald-600 text-white"
                  : "border-slate-200 bg-white text-slate-600 hover:border-emerald-300"
              }`}
            >
              {c}
            </button>
          ))}
        </div>

        <button
          onClick={() => setAddOpen(true)}
          className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs flex items-center gap-1.5 shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Upload Evidence</span>
        </button>
      </div>

      <SectionCard title={`Attached Evidence Register (${rows.length})`} testid="evidence-table">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-left text-xs font-bold uppercase tracking-wide text-slate-400">
                {["Evidence ID", "Document / Dataset", "Category", "Linked Activity", "Linked Calc", "Source", "Period", "Hash", "Ver", "Status", "Actions"].map((h) => (
                  <th key={h} className="py-2.5 pr-3">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((e) => (
                <tr key={e.id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                  <td className="py-3 pr-3"><RefLink id={e.id} onClick={() => setSel(e)} /></td>
                  <td className="py-3 pr-3 font-semibold text-slate-800">{e.title}</td>
                  <td className="py-3 pr-3 text-slate-500">{e.category}</td>
                  <td className="py-3 pr-3">{e.activity !== "—" ? <RefLink id={e.activity} /> : "—"}</td>
                  <td className="py-3 pr-3">{e.calc !== "—" ? <RefLink id={e.calc} /> : "—"}</td>
                  <td className="py-3 pr-3 text-slate-500">{e.source}</td>
                  <td className="py-3 pr-3 text-slate-500">{e.period}</td>
                  <td className="py-3 pr-3 font-mono text-xs text-slate-400">{e.hash}</td>
                  <td className="py-3 pr-3 text-slate-500">{e.version}</td>
                  <td className="py-3 pr-3"><StatusBadge status={e.status} /></td>
                  <td className="py-3 pr-3">
                    <button
                      onClick={() => setSel(e)}
                      className="text-xs font-bold text-emerald-700 hover:text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-lg"
                    >
                      Open
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SectionCard>

      {/* Detail Modal / Drawer */}
      {sel && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex justify-end z-50">
          <div className="bg-white w-full max-w-xl h-full p-6 overflow-y-auto space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2">
                <FileCheck2 className="h-5 w-5 text-emerald-600" />
                <span className="font-mono font-bold text-slate-900">{sel.id}</span>
              </div>
              <button onClick={() => setSel(null)} className="p-1 rounded-lg hover:bg-slate-100 text-slate-400">
                ✕
              </button>
            </div>

            <div>
              <h2 className="text-lg font-bold text-slate-900">{sel.title}</h2>
              <p className="mt-1 text-xs text-slate-500">{sel.desc}</p>
              <div className="mt-2"><StatusBadge status={sel.status} /></div>
            </div>

            <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl text-xs">
              <Field label="Category" value={sel.category} />
              <Field label="Original Source" value={sel.source} />
              <Field label="Source System" value={sel.sourceSystem} />
              <Field label="Linked Facility" value={meta.facility} />
              <Field label="Linked Activity" value={sel.activity} mono />
              <Field label="Linked Calculation" value={sel.calc} mono />
              <Field label="Document Hash" value={sel.hash} mono />
              <Field label="Uploaded By" value={sel.uploadedBy} />
            </div>

            <div>
              <p className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-400">Provenance chain</p>
              <div className="flex flex-wrap items-center gap-1.5 text-xs">
                {sel.provenance.map((p, i) => (
                  <React.Fragment key={i}>
                    <span className="rounded-md bg-emerald-50 px-2 py-1 font-semibold text-emerald-700">{p}</span>
                    {i < sel.provenance.length - 1 && <span className="text-slate-300">→</span>}
                  </React.Fragment>
                ))}
              </div>
            </div>

            <div className="pt-4 flex items-center justify-end gap-2 border-t border-slate-100">
              <button
                onClick={() => setSel(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Upload Modal */}
      {addOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white w-full max-w-lg rounded-2xl p-6 space-y-4 shadow-xl">
            <h3 className="text-base font-bold text-slate-900">Upload Verification Evidence</h3>
            <form onSubmit={handleUpload} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-600 font-bold mb-1">Title</label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Utility Invoice Q1"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800"
                />
              </div>
              <div>
                <label className="block text-slate-600 font-bold mb-1">Category</label>
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800"
                >
                  {EVIDENCE_CATEGORIES.filter((c) => c !== 'All').map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-slate-600 font-bold mb-1">Linked Activity Code (Optional)</label>
                <input
                  type="text"
                  value={newActivity}
                  onChange={(e) => setNewActivity(e.target.value)}
                  placeholder="e.g. ACT-0021"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800"
                />
              </div>
              <div>
                <label className="block text-slate-600 font-bold mb-1">Description</label>
                <textarea
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  placeholder="Evidence metadata and notes..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 h-20"
                />
              </div>
              <div className="pt-3 flex justify-end gap-2">
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
                  Save & Add
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
