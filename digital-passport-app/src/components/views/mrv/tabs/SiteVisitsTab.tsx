import React, { useState } from 'react';
import { MapPin, Plus } from 'lucide-react';
import { useMrv } from '../../../../context/MrvContext';
import { SITE_AGENDA, SITE_CHECKLIST, SITE_OBSERVATIONS } from '../../../../data/mrvMockData';
import { Kpi, StatusBadge, Field, SectionCard, RefLink } from '../shared';
import type { SiteObservationItem } from '../../../../types/mrv';

export const SiteVisitsTab: React.FC = () => {
  const { meta, engagement } = useMrv();
  const [checks, setChecks] = useState<Record<string, boolean>>(() =>
    SITE_CHECKLIST.reduce((a, c, i) => ({ ...a, [c]: i < 9 }), {})
  );
  const [obs, setObs] = useState<SiteObservationItem[]>(SITE_OBSERVATIONS);
  const [addOpen, setAddOpen] = useState(false);
  const [newArea, setNewArea] = useState('');
  const [newDesc, setNewDesc] = useState('');

  const done = Object.values(checks).filter(Boolean).length;

  const handleAddObs = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDesc) return;
    const newRecord: SiteObservationItem = {
      id: `OBS-026-0${obs.length + 1}`,
      area: newArea || 'General',
      desc: newDesc,
      activity: '—',
      evidence: '—',
      verifier: meta.leadVerifier,
      severity: 'MEDIUM',
      followUp: 'Yes',
    };
    setObs((prev) => [...prev, newRecord]);
    setAddOpen(false);
    setNewArea('');
    setNewDesc('');
  };

  return (
    <div className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Kpi testid="kpi-scheduled-visits" label="Scheduled Visits" value={1} />
        <Kpi testid="kpi-completed-visits" label="Completed Visits" value={engagement.siteVisitComplete ? 1 : 0} tone={engagement.siteVisitComplete ? "green" : "amber"} />
        <Kpi testid="kpi-open-observations" label="Open Observations" value={obs.filter((o) => o.followUp === "Yes").length} tone="amber" />
        <Kpi testid="kpi-evidence-collected" label="Evidence Collected" value={2} />
      </div>

      <SectionCard testid="visit-card" action={<StatusBadge status={engagement.siteVisitComplete ? "COMPLETE" : "IN PROGRESS"} />}>
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
            <MapPin className="h-5 w-5" />
          </span>
          <div>
            <p className="font-mono text-xs font-bold text-emerald-700">VIS-026-01</p>
            <p className="font-bold text-slate-900 text-sm">{meta.facility}</p>
          </div>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4 text-xs">
          <Field label="Visit Type" value="On-site" />
          <Field label="Date" value="2026-05-12" />
          <Field label="Verification Team" value="Dr. Kofi Mensah, S. Boateng" />
          <Field label="Facility Contacts" value="K. Adjei (Carbon Manager)" />
        </div>
      </SectionCard>

      <div className="grid gap-5 lg:grid-cols-2">
        <SectionCard title="Site Visit Agenda" testid="visit-agenda">
          <ol className="space-y-2 text-xs">
            {SITE_AGENDA.map((a, i) => (
              <li key={a} className="flex items-center gap-3 text-slate-700">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-100 text-[10px] font-bold text-slate-500">{i + 1}</span>
                {a}
              </li>
            ))}
          </ol>
        </SectionCard>

        <SectionCard title={`Site Visit Checklist (${done}/${SITE_CHECKLIST.length})`} testid="visit-checklist">
          <div className="space-y-2 text-xs">
            {SITE_CHECKLIST.map((c) => (
              <label key={c} className="flex cursor-pointer items-center gap-2 text-slate-700">
                <input
                  type="checkbox"
                  checked={!!checks[c]}
                  onChange={(e) => setChecks((s) => ({ ...s, [c]: e.target.checked }))}
                  className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                />
                {c}
              </label>
            ))}
          </div>
        </SectionCard>
      </div>

      <SectionCard
        title="Observation Records"
        testid="visit-observations"
        action={
          <button
            onClick={() => setAddOpen(true)}
            className="px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold rounded-xl flex items-center gap-1"
          >
            <Plus className="h-3.5 w-3.5" /> Add Observation
          </button>
        }
      >
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-left text-xs font-bold uppercase tracking-wide text-slate-400">
                {["Obs ID", "Area", "Description", "Activity", "Evidence", "Verifier", "Severity", "Follow-up"].map((h) => (
                  <th key={h} className="py-2.5 pr-3">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {obs.map((o) => (
                <tr key={o.id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                  <td className="py-3 pr-3 font-mono text-xs font-semibold text-emerald-700">{o.id}</td>
                  <td className="py-3 pr-3 text-slate-600 text-xs">{o.area}</td>
                  <td className="py-3 pr-3 text-slate-600 text-xs">{o.desc}</td>
                  <td className="py-3 pr-3 text-xs">{o.activity !== "—" ? <RefLink id={o.activity} /> : "—"}</td>
                  <td className="py-3 pr-3 text-xs">{o.evidence !== "—" ? <RefLink id={o.evidence} /> : "—"}</td>
                  <td className="py-3 pr-3 text-slate-500 text-xs">{o.verifier}</td>
                  <td className="py-3 pr-3"><StatusBadge status={o.severity} /></td>
                  <td className="py-3 pr-3 text-xs font-bold text-slate-600">{o.followUp}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SectionCard>

      {addOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white w-full max-w-md rounded-2xl p-6 space-y-4 shadow-xl">
            <h3 className="text-base font-bold text-slate-900">Add Site Observation</h3>
            <form onSubmit={handleAddObs} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-600 mb-1">Area / Location</label>
                <input
                  type="text"
                  value={newArea}
                  onChange={(e) => setNewArea(e.target.value)}
                  placeholder="e.g. Meter Inspection"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-800"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-600 mb-1">Description</label>
                <textarea
                  required
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  placeholder="Observation notes..."
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
                  Save Observation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
