import React, { useState, useEffect } from 'react';
import { useVC } from '../../../context/ValueChainContext';
import { KpiCard, StatusChip, LineageFlow } from '../primitives';
import type { Invitation } from '../../../types/valueChain';
import { REQUEST_TYPES } from '../../../data/valueChainMockData';
import { X, Send } from 'lucide-react';
import { toast } from '../../../utils/toast';

interface InvitationsTabProps {
  search?: string;
  registerPrimary?: (key: string, fn: () => void) => void;
}

const match = (o: unknown, q?: string, name?: string) =>
  !q || (JSON.stringify(o) + (name || '')).toLowerCase().includes(q.toLowerCase());

const STEPS = [
  'Select Supplier',
  'Select Contact',
  'Select Material',
  'Reporting Period',
  'Required Information',
  'Set Due Date',
  'Add Instructions',
  'Preview Request',
  'Send Invitation',
];

export const InvitationsTab: React.FC<InvitationsTabProps> = ({ search, registerPrimary }) => {
  const { invitations, suppliers, supplierName, CONTACTS, addInvitation } = useVC();
  const [wizard, setWizard] = useState(false);
  const [step, setStep] = useState(0);
  const [selected, setSelected] = useState<Invitation | null>(null);
  const [d, setD] = useState({
    supplierId: '',
    contact: '',
    material: '',
    period: 'FY 2026',
    requested: [] as string[],
    due: '',
    instructions: '',
  });

  useEffect(() => {
    registerPrimary?.('invitations', () => {
      setWizard(true);
      setStep(0);
    });
  }, [registerPrimary]);

  const rows = invitations.filter((i) => match(i, search, supplierName(i.supplierId)));
  const sent = invitations.length;
  const accepted = invitations.filter((i) => i.status === 'ACCEPTED').length;
  const pending = invitations.filter((i) =>
    ['SENT', 'OPENED', 'IN PROGRESS'].includes(i.status)
  ).length;
  const expired = invitations.filter((i) => i.status === 'EXPIRED').length;

  const toggleReq = (r: string) =>
    setD((p) => ({
      ...p,
      requested: p.requested.includes(r)
        ? p.requested.filter((x) => x !== r)
        : [...p.requested, r],
    }));

  const finish = () => {
    addInvitation({
      supplierId: d.supplierId,
      contact: d.contact,
      material: d.material,
      requested: d.requested,
      due: d.due || '2026-04-30',
    });
    toast.success('Secure invitation sent', {
      description: `${supplierName(d.supplierId)} · lightweight Supplier Portal link generated`,
    });
    setWizard(false);
    setD({
      supplierId: '',
      contact: '',
      material: '',
      period: 'FY 2026',
      requested: [],
      due: '',
      instructions: '',
    });
  };

  const canNext = [
    !!d.supplierId,
    !!d.contact,
    !!d.material,
    !!d.period,
    d.requested.length > 0,
    true,
    true,
    true,
    true,
  ][step];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        <KpiCard label="Invitations Sent" value={sent} testId="inv-kpi-sent" />
        <KpiCard label="Accepted" value={accepted} testId="inv-kpi-accepted" />
        <KpiCard label="Pending" value={pending} subTone="warn" testId="inv-kpi-pending" />
        <KpiCard label="Expired" value={expired} subTone="down" testId="inv-kpi-expired" />
      </div>

      <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-xs">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50 text-[10px] font-bold uppercase tracking-wider text-slate-400">
              <th className="py-3 px-4">Invitation ID</th>
              <th className="py-3 px-4">Supplier</th>
              <th className="py-3 px-4">Contact</th>
              <th className="py-3 px-4">Material</th>
              <th className="py-3 px-4">Requested Info</th>
              <th className="py-3 px-4">Sent</th>
              <th className="py-3 px-4">Due</th>
              <th className="py-3 px-4">Opened</th>
              <th className="py-3 px-4">Progress</th>
              <th className="py-3 px-4">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map((i) => (
              <tr
                key={i.id}
                className="cursor-pointer hover:bg-emerald-50/40 transition-colors"
                onClick={() => setSelected(i)}
                data-testid={`inv-row-${i.id}`}
              >
                <td className="py-3 px-4 font-mono font-bold text-slate-500">{i.id}</td>
                <td className="py-3 px-4 font-bold text-slate-900">{supplierName(i.supplierId)}</td>
                <td className="py-3 px-4 text-slate-700">{i.contact}</td>
                <td className="py-3 px-4 text-slate-700">{i.material}</td>
                <td className="py-3 px-4 text-slate-500">{i.requested.length} items</td>
                <td className="py-3 px-4 font-mono text-slate-600">{i.sent}</td>
                <td className="py-3 px-4 font-mono text-slate-600">{i.due}</td>
                <td className="py-3 px-4 font-semibold text-slate-700">{i.opened ? 'Yes' : 'No'}</td>
                <td className="py-3 px-4 w-28">
                  <div className="flex items-center gap-2">
                    <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-emerald-500 rounded-full"
                        style={{ width: `${i.progress}%` }}
                      />
                    </div>
                    <span className="font-mono text-[10px] font-bold text-slate-600">{i.progress}%</span>
                  </div>
                </td>
                <td className="py-3 px-4">
                  <StatusChip status={i.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Invitation detail modal */}
      {selected && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-end">
          <div className="bg-white h-full w-full max-w-lg shadow-2xl border-l border-slate-200 overflow-y-auto p-6 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <span className="text-[10px] font-mono font-bold text-slate-400 uppercase">
                  {selected.id}
                </span>
                <h2 className="text-lg font-bold text-slate-900">{supplierName(selected.supplierId)}</h2>
              </div>
              <button
                onClick={() => setSelected(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-1 text-xs">
              <div className="font-bold text-slate-900">
                {selected.contact} · {selected.material}
              </div>
              <div className="text-slate-500 flex items-center gap-2">
                <span>Status:</span> <StatusChip status={selected.status} />
              </div>
            </div>

            <div>
              <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                Requested Data Items
              </h4>
              <div className="flex flex-wrap gap-1.5">
                {selected.requested.map((r) => (
                  <span
                    key={r}
                    className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-700"
                  >
                    {r}
                  </span>
                ))}
              </div>
            </div>

            <div className="space-y-3 border-t border-slate-100 pt-4">
              <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Supplier Response Workflow
              </h4>
              <LineageFlow
                steps={[
                  { label: '1', value: 'Invitation' },
                  { label: '2', value: 'Supplier Portal' },
                  { label: '3', value: 'Data Entry' },
                  { label: '4', value: 'Upload' },
                  { label: '5', value: 'Declaration' },
                  { label: '6', value: 'Submit' },
                ]}
              />
            </div>
          </div>
        </div>
      )}

      {/* 9-Step Onboarding & Data Request Wizard */}
      {wizard && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
            <div className="p-5 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-mono font-bold text-emerald-700 uppercase">
                  Step {step + 1} of 9
                </span>
                <h3 className="font-bold text-slate-900 text-sm">{STEPS[step]}</h3>
              </div>
              <button
                onClick={() => setWizard(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="w-full bg-slate-100 h-1">
              <div
                className="bg-emerald-500 h-full transition-all duration-300"
                style={{ width: `${((step + 1) / 9) * 100}%` }}
              />
            </div>

            <div className="p-6 space-y-4 text-xs min-h-[220px]">
              {step === 0 && (
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Select Supplier *</label>
                  <select
                    value={d.supplierId}
                    onChange={(e) => {
                      const id = e.target.value;
                      const sup = suppliers.find((s) => s.id === id);
                      setD({ ...d, supplierId: id, material: sup?.material || '' });
                    }}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-emerald-600 bg-white"
                  >
                    <option value="">-- Choose Supplier --</option>
                    {suppliers.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.country})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {step === 1 && (
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Contact Person *</label>
                  <select
                    value={d.contact}
                    onChange={(e) => setD({ ...d, contact: e.target.value })}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-emerald-600 bg-white"
                  >
                    <option value="">-- Choose Contact --</option>
                    {(CONTACTS[d.supplierId] || [{ name: 'Kwame Osei', role: 'Main Contact' }]).map(
                      (c, idx) => (
                        <option key={idx} value={c.name}>
                          {c.name} ({c.role})
                        </option>
                      )
                    )}
                  </select>
                </div>
              )}

              {step === 2 && (
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Material / Service *</label>
                  <input
                    type="text"
                    value={d.material}
                    onChange={(e) => setD({ ...d, material: e.target.value })}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-emerald-600"
                  />
                </div>
              )}

              {step === 3 && (
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Reporting Period *</label>
                  <input
                    type="text"
                    value={d.period}
                    onChange={(e) => setD({ ...d, period: e.target.value })}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-emerald-600"
                  />
                </div>
              )}

              {step === 4 && (
                <div>
                  <label className="font-bold text-slate-700 block mb-2">
                    Select Required Information Types *
                  </label>
                  <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
                    {REQUEST_TYPES.map((r) => (
                      <label
                        key={r}
                        className={`flex items-center gap-2 p-2 rounded-lg border text-xs cursor-pointer ${
                          d.requested.includes(r)
                            ? 'bg-emerald-50 border-emerald-300 text-emerald-900 font-bold'
                            : 'border-slate-200 text-slate-700'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={d.requested.includes(r)}
                          onChange={() => toggleReq(r)}
                          className="rounded text-emerald-600 focus:ring-emerald-500"
                        />
                        <span>{r}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {step === 5 && (
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Response Due Date</label>
                  <input
                    type="date"
                    value={d.due}
                    onChange={(e) => setD({ ...d, due: e.target.value })}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-emerald-600"
                  />
                </div>
              )}

              {step === 6 && (
                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    Instructions / Message to Supplier
                  </label>
                  <textarea
                    rows={4}
                    placeholder="Please submit primary product PCF and ISO 14065 verification statement..."
                    value={d.instructions}
                    onChange={(e) => setD({ ...d, instructions: e.target.value })}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-emerald-600"
                  />
                </div>
              )}

              {step === 7 && (
                <div className="space-y-2 p-4 bg-slate-50 rounded-xl border border-slate-200">
                  <h4 className="font-bold text-slate-900">Request Preview</h4>
                  <p>
                    <strong>Supplier:</strong> {supplierName(d.supplierId)}
                  </p>
                  <p>
                    <strong>Contact:</strong> {d.contact}
                  </p>
                  <p>
                    <strong>Material:</strong> {d.material}
                  </p>
                  <p>
                    <strong>Requested Items:</strong> {d.requested.join(', ')}
                  </p>
                  <p>
                    <strong>Due Date:</strong> {d.due || '2026-04-30'}
                  </p>
                </div>
              )}

              {step === 8 && (
                <div className="text-center py-4 space-y-3">
                  <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto">
                    <Send className="w-6 h-6" />
                  </div>
                  <h4 className="font-bold text-slate-900 text-sm">Ready to Send Invitation</h4>
                  <p className="text-slate-500">
                    Clicking send will issue an email invitation with a secure link to the Supplier Portal.
                  </p>
                </div>
              )}
            </div>

            <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
              <button
                type="button"
                disabled={step === 0}
                onClick={() => setStep(step - 1)}
                className="px-4 py-2 border border-slate-200 rounded-xl font-bold text-slate-600 hover:bg-slate-100 disabled:opacity-40"
              >
                Back
              </button>

              {step < 8 ? (
                <button
                  type="button"
                  disabled={!canNext}
                  onClick={() => setStep(step + 1)}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white font-bold rounded-xl shadow-xs"
                >
                  Next Step
                </button>
              ) : (
                <button
                  type="button"
                  onClick={finish}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-xs flex items-center gap-1.5"
                >
                  <Send className="w-4 h-4" /> Issue Invitation
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InvitationsTab;
