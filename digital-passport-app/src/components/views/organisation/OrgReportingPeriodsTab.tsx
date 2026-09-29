import React, { useState, useEffect } from 'react';
import { getOrgReportingPeriods, saveOrgReportingPeriod } from '../../../api/client';
import {
  Calendar,
  Lock,
  CheckCircle2,
  AlertCircle,
  Plus,
  Search,
  X,
  History,
  FileCheck,
  ChevronRight,
  ShieldCheck
} from 'lucide-react';

export interface ReportingPeriodItem {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  facilitiesScope: string;
  ccfStatus: string;
  dataCompleteness: number;
  verificationStatus: 'VERIFIED' | 'SUBMITTED' | 'DATA LOCKED' | 'OPEN';
  currentStepIndex: number; // 0: OPEN, 1: DATA LOCKED, 2: SUBMITTED, 3: VERIFIED, 4: CLOSED
  versions: { version: string; date: string; author: string; reason: string }[];
}

export const initialPeriods: ReportingPeriodItem[] = [
  {
    id: 'PER-2026-FY',
    name: 'FY 2026 (Apr 2025 – Mar 2026)',
    startDate: '2025-04-01',
    endDate: '2026-03-31',
    facilitiesScope: 'All 4 Ghana Facilities',
    ccfStatus: 'Calculated & Verified',
    dataCompleteness: 98,
    verificationStatus: 'VERIFIED',
    currentStepIndex: 3,
    versions: [
      { version: 'v1.0', date: '2026-01-15', author: 'Bureau Veritas Auditor', reason: 'Initial Reasonable Assurance sign-off' },
      { version: 'v1.1', date: '2026-02-10', author: 'Dr. Lena Hoffmann', reason: 'Controlled recalculation post-grid factor adjustment' },
    ],
  },
  {
    id: 'PER-2026-Q1',
    name: '2026 Q1 (Jan 2026 – Mar 2026)',
    startDate: '2026-01-01',
    endDate: '2026-03-31',
    facilitiesScope: 'Tema & Kumasi Sites',
    ccfStatus: 'In Submission Queue',
    dataCompleteness: 94,
    verificationStatus: 'SUBMITTED',
    currentStepIndex: 2,
    versions: [
      { version: 'v1.0', date: '2026-03-31', author: 'Kwame Mensah', reason: 'Data locked and submitted for audit' },
    ],
  },
  {
    id: 'PER-2026-Q2',
    name: '2026 Q2 (Apr 2026 – Jun 2026)',
    startDate: '2026-04-01',
    endDate: '2026-06-30',
    facilitiesScope: 'All Facilities',
    ccfStatus: 'Data Lock Imposed',
    dataCompleteness: 89,
    verificationStatus: 'DATA LOCKED',
    currentStepIndex: 1,
    versions: [
      { version: 'v1.0', date: '2026-06-30', author: 'Dr. Lena Hoffmann', reason: 'Operational data freeze' },
    ],
  },
  {
    id: 'PER-2026-Q3',
    name: '2026 Q3 (Jul 2026 – Sep 2026)',
    startDate: '2026-07-01',
    endDate: '2026-09-30',
    facilitiesScope: 'All Facilities',
    ccfStatus: 'Active Telemetry Ingestion',
    dataCompleteness: 76,
    verificationStatus: 'OPEN',
    currentStepIndex: 0,
    versions: [],
  },
];

export const lifecycleSteps = [
  { index: 0, name: 'OPEN', desc: 'Data Ingestion & Telemetry Active' },
  { index: 1, name: 'DATA LOCKED', desc: 'Operational Data Freeze Imposed' },
  { index: 2, name: 'SUBMITTED', desc: 'Submitted for Third-Party Audit' },
  { index: 3, name: 'VERIFIED', desc: 'Reasonable Assurance Certificate Issued' },
  { index: 4, name: 'CLOSED', desc: 'Immutable Archive State' },
];

export const OrgReportingPeriodsTab: React.FC = () => {
  const [periods, setPeriods] = useState<ReportingPeriodItem[]>(initialPeriods);
  const [selectedPeriod, setSelectedPeriod] = useState<ReportingPeriodItem | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  useEffect(() => {
    getOrgReportingPeriods()
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setPeriods(data);
        }
      })
      .catch((err) => console.warn('Failed to fetch reporting periods from backend:', err));
  }, []);

  // New period form
  const [newPeriodName, setNewPeriodName] = useState('');
  const [newPeriodType, setNewPeriodType] = useState('Quarterly');
  const [newStartDate, setNewStartDate] = useState('2026-10-01');
  const [newEndDate, setNewEndDate] = useState('2026-12-31');

  // Correction request form
  const [isCorrectionOpen, setIsCorrectionOpen] = useState(false);
  const [correctionReason, setCorrectionReason] = useState('');

  const filteredPeriods = periods.filter(
    (p) =>
      (p.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.id || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCreatePeriod = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPeriodName) return;

    const newP: ReportingPeriodItem = {
      id: `PER-2026-NEW${periods.length + 1}`,
      name: newPeriodName,
      startDate: newStartDate,
      endDate: newEndDate,
      facilitiesScope: 'All Facilities',
      ccfStatus: 'Active Data Ingestion',
      dataCompleteness: 100,
      verificationStatus: 'OPEN',
      currentStepIndex: 0,
      versions: [],
    };

    try {
      await saveOrgReportingPeriod(newP);
    } catch (err) {
      console.warn('Backend save period failed, saving locally:', err);
    }

    setPeriods([...periods, newP]);
    setIsCreateOpen(false);
    setNewPeriodName('');
  };

  const handleAdvanceStep = async (periodId: string) => {
    const updatedList = periods.map((p) => {
      if (p.id === periodId && p.currentStepIndex < 4) {
        const nextIdx = p.currentStepIndex + 1;
        const statusMap: ('OPEN' | 'DATA LOCKED' | 'SUBMITTED' | 'VERIFIED')[] = ['OPEN', 'DATA LOCKED', 'SUBMITTED', 'VERIFIED'];
        const nextStatus = statusMap[nextIdx] || 'VERIFIED';
        const updated = {
          ...p,
          currentStepIndex: nextIdx,
          verificationStatus: nextStatus,
        };
        saveOrgReportingPeriod(updated).catch((err) => console.warn('Backend update period failed:', err));
        return updated;
      }
      return p;
    });

    setPeriods(updatedList);
    if (selectedPeriod && selectedPeriod.id === periodId && selectedPeriod.currentStepIndex < 4) {
      const nextIdx = selectedPeriod.currentStepIndex + 1;
      const statusMap: ('OPEN' | 'DATA LOCKED' | 'SUBMITTED' | 'VERIFIED')[] = ['OPEN', 'DATA LOCKED', 'SUBMITTED', 'VERIFIED'];
      setSelectedPeriod({
        ...selectedPeriod,
        currentStepIndex: nextIdx,
        verificationStatus: statusMap[nextIdx] || 'VERIFIED',
      });
    }
  };

  const handleRequestCorrection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPeriod || !correctionReason) return;

    const newVerNum = (selectedPeriod.versions || []).length + 1;
    const newVer = {
      version: `v1.${newVerNum}`,
      date: new Date().toISOString().split('T')[0],
      author: 'Dr. Lena Hoffmann (Compliance Lead)',
      reason: correctionReason,
    };

    const updated = {
      ...selectedPeriod,
      versions: [...(selectedPeriod.versions || []), newVer],
    };

    try {
      await saveOrgReportingPeriod(updated);
    } catch (err) {
      console.warn('Backend update period failed:', err);
    }

    setPeriods(periods.map((p) => (p.id === updated.id ? updated : p)));
    setSelectedPeriod(updated);
    setIsCorrectionOpen(false);
    setCorrectionReason('');
  };

  return (
    <div className="space-y-6">
      {/* Header & Create Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search reporting period name or ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-emerald-600"
          />
        </div>

        <button
          onClick={() => setIsCreateOpen(true)}
          className="px-4 py-2 bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          <span>Create Reporting Period</span>
        </button>
      </div>

      {/* Reporting Periods Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-slate-200 text-[10px] font-mono uppercase text-slate-400 bg-slate-50">
              <th className="py-3 px-4">Period ID & Name</th>
              <th className="py-3 px-4">Dates</th>
              <th className="py-3 px-4">Facility Scope</th>
              <th className="py-3 px-4">Data Completeness</th>
              <th className="py-3 px-4">Lifecycle Status</th>
              <th className="py-3 px-4 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredPeriods.map((p) => (
              <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                <td className="py-3.5 px-4">
                  <span className="font-bold text-slate-900 block">{p.name}</span>
                  <span className="font-mono text-[10px] text-slate-400">{p.id}</span>
                </td>
                <td className="py-3.5 px-4 font-mono text-[11px] text-slate-600">
                  {p.startDate} → {p.endDate}
                </td>
                <td className="py-3.5 px-4 text-slate-700 font-medium">{p.facilitiesScope}</td>
                <td className="py-3.5 px-4">
                  <div className="flex items-center gap-2">
                    <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-emerald-600 rounded-full" style={{ width: `${p.dataCompleteness}%` }} />
                    </div>
                    <span className="font-mono text-[10px] font-bold text-slate-700">{p.dataCompleteness}%</span>
                  </div>
                </td>
                <td className="py-3.5 px-4">
                  <span
                    className={`text-[10px] font-bold px-2.5 py-1 rounded-md border ${
                      p.verificationStatus === 'VERIFIED'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : p.verificationStatus === 'SUBMITTED'
                        ? 'bg-sky-50 text-sky-700 border-sky-200'
                        : p.verificationStatus === 'DATA LOCKED'
                        ? 'bg-amber-50 text-amber-700 border-amber-200'
                        : 'bg-slate-100 text-slate-700 border-slate-200'
                    }`}
                  >
                    {p.verificationStatus}
                  </span>
                </td>
                <td className="py-3.5 px-4 text-right">
                  <button
                    onClick={() => setSelectedPeriod(p)}
                    className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg text-[11px] transition-colors"
                  >
                    Manage Lifecycle
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Period Detail & Lifecycle Stepper Modal */}
      {selectedPeriod && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-3xl rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
            <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-emerald-50 text-emerald-800 rounded-xl">
                  <Calendar className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[10px] font-mono text-slate-400 font-bold uppercase">{selectedPeriod.id}</span>
                  <h3 className="font-bold text-slate-900 text-base">{selectedPeriod.name}</h3>
                </div>
              </div>
              <button onClick={() => setSelectedPeriod(null)} className="p-1 text-slate-400 hover:text-slate-600 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6 text-xs">
              {/* Stepper Progress */}
              <div className="space-y-3">
                <span className="text-[10px] font-mono font-bold text-slate-400 uppercase block">Audited Lifecycle Stepper</span>
                <div className="grid grid-cols-5 gap-2">
                  {lifecycleSteps.map((step) => {
                    const isDone = selectedPeriod.currentStepIndex >= step.index;
                    const isCurrent = selectedPeriod.currentStepIndex === step.index;
                    return (
                      <div
                        key={step.index}
                        className={`p-3 rounded-xl border text-center transition-all ${
                          isCurrent
                            ? 'bg-emerald-800 text-white border-emerald-900 shadow-xs'
                            : isDone
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                            : 'bg-slate-50 text-slate-400 border-slate-200'
                        }`}
                      >
                        <span className="text-[10px] font-mono font-bold block">STEP 0{step.index + 1}</span>
                        <span className="font-bold block text-[11px] mt-0.5">{step.name}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Data Lock Notice & Request Correction for Audited / Locked Periods */}
              {selectedPeriod.currentStepIndex >= 1 && (
                <div className="p-4 bg-amber-50/80 border border-amber-200 rounded-xl flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 text-amber-900 font-semibold">
                    <Lock className="w-4 h-4 text-amber-700 shrink-0" />
                    <span>Period data is locked under ISO 14065 audit rules. Any change creates a controlled recalculation version.</span>
                  </div>
                  <button
                    onClick={() => setIsCorrectionOpen(true)}
                    className="px-3 py-1.5 bg-amber-100 hover:bg-amber-200 text-amber-900 font-bold rounded-lg border border-amber-300 text-xs shrink-0 cursor-pointer"
                  >
                    Request Correction
                  </button>
                </div>
              )}

              {/* Action Buttons for Lifecycle Advancement */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                <div>
                  <span className="font-bold text-slate-900 block text-xs">Lifecycle State Advancement</span>
                  <span className="text-slate-500 text-[11px]">Advance period state under strict RBAC auditing rules</span>
                </div>

                {selectedPeriod.currentStepIndex < 4 ? (
                  <button
                    onClick={() => handleAdvanceStep(selectedPeriod.id)}
                    className="px-4 py-2 bg-emerald-800 hover:bg-emerald-900 text-white font-bold rounded-xl shadow-xs text-xs"
                  >
                    Advance to {lifecycleSteps[selectedPeriod.currentStepIndex + 1]?.name}
                  </button>
                ) : (
                  <span className="bg-emerald-50 text-emerald-700 font-bold px-3 py-1 rounded-md text-xs border border-emerald-200">
                    FULLY CLOSED & ARCHIVED
                  </span>
                )}
              </div>

              {/* Version History Log */}
              <div className="space-y-3">
                <span className="text-[10px] font-mono font-bold text-slate-400 uppercase block">Recalculation & Version Log</span>
                {(selectedPeriod.versions || []).length > 0 ? (
                  <div className="space-y-2">
                    {(selectedPeriod.versions || []).map((v, idx) => (
                      <div key={idx} className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                        <div>
                          <span className="font-mono font-bold text-slate-900 mr-2">{v.version}</span>
                          <span className="text-slate-600 font-medium">{v.reason}</span>
                        </div>
                        <div className="text-right text-[10px] font-mono text-slate-400">
                          <span className="block text-slate-700 font-bold">{v.author}</span>
                          <span>{v.date}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-slate-400 italic text-[11px]">No post-audit recalculation versions recorded for this period.</p>
                )}
              </div>
            </div>

            <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-end">
              <button
                onClick={() => setSelectedPeriod(null)}
                className="px-4 py-2 bg-slate-900 text-white font-bold text-xs rounded-xl hover:bg-slate-800"
              >
                Close View
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Request Correction Modal */}
      {isCorrectionOpen && selectedPeriod && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
            <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-amber-50">
              <div className="flex items-center gap-2">
                <Lock className="w-5 h-5 text-amber-700" />
                <h3 className="font-bold text-slate-900 text-sm">Request Controlled Recalculation</h3>
              </div>
              <button onClick={() => setIsCorrectionOpen(false)} className="p-1 text-slate-400 hover:text-slate-600 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRequestCorrection} className="p-5 space-y-4 text-xs">
              <p className="text-slate-600">
                Reporting Period <strong className="text-slate-900">{selectedPeriod.name}</strong> is locked. Submitting a correction request will spawn a new recalculation version entry (e.g. v1.{(selectedPeriod.versions || []).length + 1}) for audit trail compliance.
              </p>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Reason for Recalculation / Correction *</label>
                <textarea
                  required
                  rows={3}
                  placeholder="Describe updated activity data, meter calibration correction, or emission factor update..."
                  value={correctionReason}
                  onChange={(e) => setCorrectionReason(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-amber-600 text-xs"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsCorrectionOpen(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl font-bold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl shadow-xs"
                >
                  Submit Recalculation Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Period Modal */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
            <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <h3 className="font-bold text-slate-900 text-sm">Create New Reporting Period</h3>
              <button onClick={() => setIsCreateOpen(false)} className="p-1 text-slate-400 hover:text-slate-600 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreatePeriod} className="p-5 space-y-4 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Period Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 2026 Q4 (Oct – Dec)"
                  value={newPeriodName}
                  onChange={(e) => setNewPeriodName(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-emerald-600"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Period Type</label>
                <select
                  value={newPeriodType}
                  onChange={(e) => setNewPeriodType(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-slate-900 bg-white focus:outline-none focus:border-emerald-600"
                >
                  <option value="Quarterly">Quarterly</option>
                  <option value="Monthly">Monthly</option>
                  <option value="Financial Year">Financial Year</option>
                  <option value="Calendar Year">Calendar Year</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Start Date</label>
                  <input
                    type="date"
                    value={newStartDate}
                    onChange={(e) => setNewStartDate(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-emerald-600"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">End Date</label>
                  <input
                    type="date"
                    value={newEndDate}
                    onChange={(e) => setNewEndDate(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-emerald-600"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-700 font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-800 hover:bg-emerald-900 text-white font-bold rounded-xl shadow-xs"
                >
                  Save Period
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
