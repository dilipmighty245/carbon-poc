import React, { useState } from 'react';
import { AlertCircle, AlertTriangle, CheckCircle2, FileText, Check, X, ShieldAlert, ArrowRight, ExternalLink } from 'lucide-react';
import type { DataException, CorrectionHistoryItem } from '../types';

interface ExceptionsTabProps {
  onNavigateTab: (tab: string) => void;
}

export const ExceptionsTab: React.FC<ExceptionsTabProps> = ({ onNavigateTab }) => {
  const [exceptions, setExceptions] = useState<DataException[]>([
    {
      id: 'EX-001',
      record: 'ACT-004',
      severity: 'Blocking',
      reason: 'Unknown unit MWhh',
      status: 'Open',
      detectedTime: 'Today 09:42',
      details: 'Supported units: kWh, MWh, L, tonne, tonne-km',
    },
    {
      id: 'EX-002',
      record: 'SUP-002',
      severity: 'Blocking',
      reason: 'Missing mandatory supplier evidence',
      status: 'Open',
      detectedTime: 'Today 09:12',
      details: 'Requires supplier declaration document reference',
    },
    {
      id: 'EX-003',
      record: 'MTR-003',
      severity: 'Warning',
      reason: 'No recent readings',
      status: 'Open',
      detectedTime: 'Today 08:10',
      details: 'Packing line meter has been silent for 60+ minutes',
    },
    {
      id: 'EX-004',
      record: 'ACT-006',
      severity: 'Warning',
      reason: 'Meter/bill discrepancy',
      status: 'Open',
      detectedTime: 'Today 09:30',
      details: '16.67% variance between sub-meter readings and utility invoice',
    },
  ]);

  const [history, setHistory] = useState<CorrectionHistoryItem[]>([]);
  const [activeModal, setActiveModal] = useState<
    'fix-unit' | 'fix-evidence' | 'reconciliation' | 'device-trace' | null
  >(null);
  const [selectedException, setSelectedException] = useState<DataException | null>(null);

  // Form states inside modals
  const [unitValue, setUnitValue] = useState('kWh');
  const [evidenceValue, setEvidenceValue] = useState('EV-SUP-002');
  const [conflictNote, setConflictNote] = useState('');

  const handleOpenUnitFix = (ex: DataException) => {
    setSelectedException(ex);
    setUnitValue('kWh');
    setActiveModal('fix-unit');
  };

  const handleOpenEvidenceFix = (ex: DataException) => {
    setSelectedException(ex);
    setEvidenceValue('EV-SUP-002');
    setActiveModal('fix-evidence');
  };

  const handleOpenConflict = (ex: DataException) => {
    setSelectedException(ex);
    setActiveModal('reconciliation');
  };

  const handleOpenDevice = (ex: DataException) => {
    setSelectedException(ex);
    setActiveModal('device-trace');
  };

  const handleSaveUnitFix = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedException) return;

    const validUnits = ['kWh', 'MWh', 'L', 'tonne', 'tonne-km'];
    if (!validUnits.includes(unitValue)) {
      alert('Unsupported unit. Please choose kWh, MWh, L, tonne, or tonne-km.');
      return;
    }

    setExceptions((prev) =>
      prev.map((item) =>
        item.id === selectedException.id ? { ...item, status: 'Resolved' } : item
      )
    );

    const newHist: CorrectionHistoryItem = {
      id: `HIST-${Date.now().toString().slice(-4)}`,
      issueId: selectedException.id,
      recordId: selectedException.record,
      action: 'Corrected Unit',
      correctedValue: unitValue,
      timestamp: 'Just now',
      note: `${selectedException.id} corrected to ${unitValue} • new demo revision created; actual evidence review pending.`,
    };
    setHistory([newHist, ...history]);
    setActiveModal(null);
  };

  const handleSaveEvidenceFix = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedException || !evidenceValue.trim()) return;

    setExceptions((prev) =>
      prev.map((item) =>
        item.id === selectedException.id ? { ...item, status: 'Resolved' } : item
      )
    );

    const newHist: CorrectionHistoryItem = {
      id: `HIST-${Date.now().toString().slice(-4)}`,
      issueId: selectedException.id,
      recordId: selectedException.record,
      action: 'Attached Evidence Reference',
      correctedValue: evidenceValue.trim(),
      timestamp: 'Just now',
      note: `${selectedException.id} attached document ref ${evidenceValue.trim()} • new demo revision created; actual evidence review pending.`,
    };
    setHistory([newHist, ...history]);
    setActiveModal(null);
  };

  const handleAcknowledgeConflict = () => {
    if (!selectedException) return;

    setExceptions((prev) =>
      prev.map((item) =>
        item.id === selectedException.id ? { ...item, status: 'In Review' } : item
      )
    );

    const newHist: CorrectionHistoryItem = {
      id: `HIST-${Date.now().toString().slice(-4)}`,
      issueId: selectedException.id,
      recordId: selectedException.record,
      action: 'Flagged Conflict for Auditor Workpapers',
      correctedValue: '16.67% delta flagged',
      timestamp: 'Just now',
      note: `${selectedException.id}: Preserved both meter (50,000 kWh) and utility bill (60,000 kWh). Variance forwarded to MRV findings.`,
    };
    setHistory([newHist, ...history]);
    setActiveModal(null);
  };

  return (
    <div className="space-y-6">
      {/* Notice Banner */}
      <div className="p-3.5 bg-rose-50 border border-rose-200/80 rounded-xl text-xs text-rose-800 leading-relaxed">
        <strong className="font-bold">Governance Rule:</strong> Never resolve a mandatory evidence gap merely by marking it acknowledged. Corrected records create immutable new draft revisions—previously issued passports retain their historical state until re-authorized.
      </div>

      {/* Exceptions Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="font-bold text-slate-900 text-sm">Open data exceptions</h2>
            <p className="text-xs text-slate-500">Unresolved schema mismatches, missing evidence, and sensor discrepancies</p>
          </div>
          <span className="text-xs font-mono font-bold px-2.5 py-1 rounded bg-amber-50 text-amber-800 border border-amber-200">
            {exceptions.filter((e) => e.status !== 'Resolved').length} Active Issues
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50/70 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3 px-5">Issue ID</th>
                <th className="py-3 px-4">Record</th>
                <th className="py-3 px-4">Severity</th>
                <th className="py-3 px-4">Reason</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {exceptions.map((ex) => (
                <tr key={ex.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="py-3.5 px-5 font-mono font-bold text-slate-900">{ex.id}</td>
                  <td className="py-3.5 px-4 font-mono font-semibold text-slate-700">{ex.record}</td>
                  <td className="py-3.5 px-4">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${
                        ex.severity === 'Blocking'
                          ? 'bg-rose-50 text-rose-700 border-rose-200'
                          : 'bg-amber-50 text-amber-700 border-amber-200'
                      }`}
                    >
                      {ex.severity}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-slate-800 font-medium">
                    {ex.reason}
                    <span className="block text-[11px] text-slate-400 mt-0.5">{ex.details}</span>
                  </td>
                  <td className="py-3.5 px-4">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${
                        ex.status === 'Resolved'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : ex.status === 'In Review'
                          ? 'bg-sky-50 text-sky-700 border-sky-200'
                          : 'bg-slate-100 text-slate-700 border-slate-200'
                      }`}
                    >
                      {ex.status}
                    </span>
                  </td>
                  <td className="py-3.5 px-5 text-right">
                    {ex.id === 'EX-001' ? (
                      <button
                        onClick={() => handleOpenUnitFix(ex)}
                        disabled={ex.status === 'Resolved'}
                        className={`px-3 py-1 font-bold rounded-lg shadow-2xs text-[11px] transition-colors ${
                          ex.status === 'Resolved'
                            ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                            : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200'
                        }`}
                      >
                        {ex.status === 'Resolved' ? 'Corrected' : 'Correct record'}
                      </button>
                    ) : ex.id === 'EX-002' ? (
                      <button
                        onClick={() => handleOpenEvidenceFix(ex)}
                        disabled={ex.status === 'Resolved'}
                        className={`px-3 py-1 font-bold rounded-lg shadow-2xs text-[11px] transition-colors ${
                          ex.status === 'Resolved'
                            ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                            : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200'
                        }`}
                      >
                        {ex.status === 'Resolved' ? 'Attached' : 'Attach reference'}
                      </button>
                    ) : ex.id === 'EX-003' ? (
                      <button
                        onClick={() => handleOpenDevice(ex)}
                        className="px-3 py-1 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-bold rounded-lg shadow-2xs text-[11px] transition-colors"
                      >
                        View device
                      </button>
                    ) : (
                      <button
                        onClick={() => handleOpenConflict(ex)}
                        className="px-3 py-1 bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-800 font-bold rounded-lg shadow-2xs text-[11px] transition-colors"
                      >
                        Review conflict
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Correction History Section */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h3 className="font-bold text-slate-900 text-sm">Correction history & revisions</h3>
            <p className="text-xs text-slate-500">Immutable ledger of data remediation actions</p>
          </div>
          <span className="text-[10px] font-mono text-emerald-600 font-bold">IMMUTABLE LOG</span>
        </div>

        {history.length > 0 ? (
          <div className="space-y-2.5">
            {history.map((h) => (
              <div
                key={h.id}
                className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2"
              >
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span className="font-semibold text-slate-800">{h.note}</span>
                </div>
                <span className="text-[11px] font-mono text-slate-400 shrink-0">{h.timestamp}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-slate-400 italic">
            No corrections made in this browser session. Corrections create draft revisions; issued snapshots require verifier re-approval before replacement.
          </p>
        )}
      </div>

      {/* MODAL 1: Fix Unit */}
      {activeModal === 'fix-unit' && selectedException && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs" onClick={() => setActiveModal(null)} />
          <div className="relative bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-sm">Correct Activity Unit: {selectedException.record}</h3>
              <button onClick={() => setActiveModal(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveUnitFix} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Supported Unit</label>
                <select
                  value={unitValue}
                  onChange={(e) => setUnitValue(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-emerald-500"
                >
                  <option value="kWh">kWh (Kilowatt-hour - Electricity)</option>
                  <option value="MWh">MWh (Megawatt-hour - Bulk Power)</option>
                  <option value="L">L (Litre - Liquid Fuel)</option>
                  <option value="tonne">tonne (Metric Tonne - Mass)</option>
                  <option value="tonne-km">tonne-km (Freight Transport)</option>
                </select>
                <p className="text-[11px] text-slate-500">Corrects corrupted ingestion value <code className="font-mono text-rose-600">MWhh</code></p>
              </div>

              <div className="p-3 bg-sky-50 rounded-xl border border-sky-100 text-[11px] text-sky-800">
                Correcting this record creates a new draft revision. Downstream calculation pipelines will flag this unit change for verifier reconciliation.
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setActiveModal(null)}
                  className="px-4 py-2 bg-white border border-slate-200 text-slate-700 text-xs font-bold rounded-xl hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#00E599] hover:bg-[#00c985] text-slate-950 text-xs font-bold rounded-xl shadow-xs"
                >
                  Revalidate Demo Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Attach Evidence Reference */}
      {activeModal === 'fix-evidence' && selectedException && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs" onClick={() => setActiveModal(null)} />
          <div className="relative bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-sm">Attach Supplier Evidence: {selectedException.record}</h3>
              <button onClick={() => setActiveModal(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEvidenceFix} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Evidence Reference / Vault ID</label>
                <input
                  type="text"
                  required
                  value={evidenceValue}
                  onChange={(e) => setEvidenceValue(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-emerald-500 font-mono"
                  placeholder="e.g. EV-SUP-002, CERT-ISO-14064"
                />
                <p className="text-[11px] text-slate-500">Reference identifier linking this declaration to the Value Chain Evidence Vault.</p>
              </div>

              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200/80 text-[11px] text-amber-800">
                Reference registration only; document cryptographic authenticity is evaluated independently during MRV verification.
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setActiveModal(null)}
                  className="px-4 py-2 bg-white border border-slate-200 text-slate-700 text-xs font-bold rounded-xl hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#00E599] hover:bg-[#00c985] text-slate-950 text-xs font-bold rounded-xl shadow-xs"
                >
                  Attach & Revalidate
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: Meter & Bill Reconciliation Conflict */}
      {activeModal === 'reconciliation' && selectedException && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs" onClick={() => setActiveModal(null)} />
          <div className="relative bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-sm">Meter & Utility Bill Reconciliation</h3>
              <button onClick={() => setActiveModal(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
                <div>
                  <span className="text-[11px] text-slate-500 block">Sub-meter Reading:</span>
                  <span className="font-mono font-bold text-slate-900 text-sm">50,000 kWh</span>
                </div>
                <div>
                  <span className="text-[11px] text-slate-500 block">Utility Bill Reading:</span>
                  <span className="font-mono font-bold text-slate-900 text-sm">60,000 kWh</span>
                </div>
              </div>

              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-amber-900 space-y-1">
                <div className="flex items-center justify-between font-bold">
                  <span>Bill-Relative Difference:</span>
                  <span className="font-mono text-rose-700 text-sm">16.67%</span>
                </div>
                <div className="flex items-center justify-between text-[11px] text-amber-700">
                  <span>System Tolerance Threshold:</span>
                  <span className="font-mono font-semibold">5.0%</span>
                </div>
              </div>

              <p className="text-[11px] text-slate-600 leading-relaxed">
                <strong className="text-slate-800">Governance Principle:</strong> Needs review. Do not silently overwrite either source. Preserve both records and request operational explanation before passport issuance.
              </p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="px-4 py-2 bg-white border border-slate-200 text-slate-700 text-xs font-bold rounded-xl hover:bg-slate-50"
              >
                Close
              </button>
              <button
                type="button"
                onClick={handleAcknowledgeConflict}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl shadow-xs"
              >
                Flag for Auditor Review
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: Device Reading Provenance */}
      {activeModal === 'device-trace' && selectedException && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs" onClick={() => setActiveModal(null)} />
          <div className="relative bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-sm">Device Provenance: {selectedException.record}</h3>
              <button onClick={() => setActiveModal(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="space-y-1.5 p-3 bg-slate-50 rounded-xl border border-slate-200 font-mono text-[11px] text-slate-700">
                <p><strong>Source:</strong> Plant energy gateway (Modbus TCP)</p>
                <p><strong>Device:</strong> MTR-003 (Schneider EM6400)</p>
                <p><strong>Facility:</strong> FAC-001 (Tema Processing Plant)</p>
                <p><strong>Evidence fixture:</strong> EV-MTR-003</p>
              </div>

              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-amber-800 text-[11px]">
                Device MTR-003 has recorded 0 packets in the last 60-minute window. Inspect physical gateway or restart telemetry polling server.
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="px-4 py-2 bg-white border border-slate-200 text-slate-700 text-xs font-bold rounded-xl hover:bg-slate-50"
              >
                Dismiss
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveModal(null);
                  onNavigateTab('Telemetry');
                }}
                className="px-4 py-2 bg-[#00E599] hover:bg-[#00c985] text-slate-950 text-xs font-bold rounded-xl shadow-xs"
              >
                Open Telemetry
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
