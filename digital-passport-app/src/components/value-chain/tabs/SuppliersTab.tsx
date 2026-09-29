import React, { useState, useEffect } from 'react';
import { useVC } from '../../../context/ValueChainContext';
import {
  KpiCard,
  StatusChip,
  QualityBar,
  ClassBadge,
  DetailRow,
  LineageFlow,
  IntensityPill,
  fmtKg,
  fmtPct,
} from '../primitives';
import type { Supplier } from '../../../types/valueChain';
import { MoreHorizontal, X, Plus } from 'lucide-react';
import { toast } from '../../../utils/toast';

interface SuppliersTabProps {
  search?: string;
  registerPrimary?: (key: string, fn: () => void) => void;
  goToTab: (tabKey: string) => void;
}

const match = (o: unknown, q?: string) => !q || JSON.stringify(o).toLowerCase().includes(q.toLowerCase());

export const SuppliersTab: React.FC<SuppliersTabProps> = ({ search, registerPrimary, goToTab }) => {
  const { suppliers, addSupplier, scope3ContributionFor, dependenciesFor } = useVC();
  const [selected, setSelected] = useState<Supplier | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: '', country: 'Ghana', material: '', volume: '' });

  useEffect(() => {
    registerPrimary?.('suppliers', () => setAddOpen(true));
  }, [registerPrimary]);

  const rows = suppliers.filter((s) => match(s, search));
  const active = suppliers.filter((s) => s.status === 'ACTIVE').length;
  const primary = suppliers.filter((s) => s.primaryData).length;
  const verified = suppliers.filter((s) => s.verification === 'VERIFIED').length;
  const incomplete = suppliers.filter((s) => s.status === 'ACTION REQUIRED').length;

  const submitAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name) return toast.error('Supplier name required');
    addSupplier({
      name: form.name,
      country: form.country,
      material: form.material || 'Raw Materials',
      volume: Number(form.volume) || 0,
      materialCode: 'MAT-NEW',
      facility: `${form.name} Facility`,
      legalName: form.name,
      tradingName: form.name,
    });
    toast.success(`Supplier added: ${form.name}`, { description: 'Status: ONBOARDING · workflow started' });
    setAddOpen(false);
    setForm({ name: '', country: 'Ghana', material: '', volume: '' });
  };

  const dep = selected ? dependenciesFor(selected.id) : null;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        <KpiCard label="Active Suppliers" value={active} testId="sup-kpi-active" />
        <KpiCard label="Primary Data Enabled" value={primary} testId="sup-kpi-primary" />
        <KpiCard label="Verified PCF Suppliers" value={verified} testId="sup-kpi-verified" />
        <KpiCard label="Incomplete Suppliers" value={incomplete} subTone="warn" sub="Action required" testId="sup-kpi-incomplete" />
      </div>

      <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-xs">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50 text-[10px] font-bold uppercase tracking-wider text-slate-400">
              <th className="py-3 px-4">Supplier ID</th>
              <th className="py-3 px-4">Name</th>
              <th className="py-3 px-4">Country</th>
              <th className="py-3 px-4">Tier</th>
              <th className="py-3 px-4">Materials</th>
              <th className="py-3 px-4">Annual Volume</th>
              <th className="py-3 px-4">Primary</th>
              <th className="py-3 px-4">PCF</th>
              <th className="py-3 px-4">Verification</th>
              <th className="py-3 px-4">Data Quality</th>
              <th className="py-3 px-4">Scope 3 %</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map((s) => (
              <tr
                key={s.id}
                className="cursor-pointer hover:bg-emerald-50/40 transition-colors"
                onClick={() => setSelected(s)}
                data-testid={`supplier-row-${s.id}`}
              >
                <td className="py-3 px-4 font-mono font-bold text-slate-500">{s.id}</td>
                <td className="py-3 px-4 font-bold text-slate-900">{s.name}</td>
                <td className="py-3 px-4 text-slate-600">{s.country}</td>
                <td className="py-3 px-4 text-slate-600">{s.tier}</td>
                <td className="py-3 px-4 text-slate-700 font-medium">{s.material}</td>
                <td className="py-3 px-4 font-mono text-slate-700">
                  {s.volume > 1 ? fmtKg(s.volume) : 'Service'}
                </td>
                <td className="py-3 px-4">
                  {s.primaryData ? (
                    <span className="text-emerald-600 font-bold text-[11px]">YES</span>
                  ) : (
                    <span className="text-slate-400 font-semibold text-[11px]">NO</span>
                  )}
                </td>
                <td className="py-3 px-4">
                  {s.pcfAvailable ? (
                    <span className="text-emerald-600 font-bold text-[11px]">YES</span>
                  ) : (
                    <span className="text-slate-400 font-semibold text-[11px]">NO</span>
                  )}
                </td>
                <td className="py-3 px-4">
                  <StatusChip status={s.verification} />
                </td>
                <td className="py-3 px-4">
                  <QualityBar score={s.score} />
                </td>
                <td className="py-3 px-4 font-mono font-bold text-slate-700">
                  {fmtPct(scope3ContributionFor(s.id), 1)}
                </td>
                <td className="py-3 px-4">
                  <StatusChip status={s.status} />
                </td>
                <td className="py-3 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                  <div className="relative inline-block text-left">
                    <button
                      onClick={() => setMenuOpenId(menuOpenId === s.id ? null : s.id)}
                      className="p-1 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100"
                    >
                      <MoreHorizontal className="w-4 h-4" />
                    </button>
                    {menuOpenId === s.id && (
                      <div className="absolute right-0 z-20 mt-1 w-44 rounded-xl bg-white shadow-lg border border-slate-200 py-1 text-left text-xs font-semibold">
                        <button
                          onClick={() => { setSelected(s); setMenuOpenId(null); }}
                          className="w-full px-3 py-1.5 hover:bg-slate-50 text-slate-700 text-left block"
                        >
                          Open Supplier
                        </button>
                        <button
                          onClick={() => { goToTab('invitations'); setMenuOpenId(null); toast.info('Request data via Invitations'); }}
                          className="w-full px-3 py-1.5 hover:bg-slate-50 text-slate-700 text-left block"
                        >
                          Request Data
                        </button>
                        <button
                          onClick={() => { setMenuOpenId(null); toast.success(`Invitation sent to ${s.contact}`); }}
                          className="w-full px-3 py-1.5 hover:bg-slate-50 text-slate-700 text-left block"
                        >
                          Invite Contact
                        </button>
                        <button
                          onClick={() => { goToTab('catalogue'); setMenuOpenId(null); }}
                          className="w-full px-3 py-1.5 hover:bg-slate-50 text-slate-700 text-left block"
                        >
                          View Catalogue
                        </button>
                        <button
                          onClick={() => { goToTab('declarations'); setMenuOpenId(null); }}
                          className="w-full px-3 py-1.5 hover:bg-slate-50 text-slate-700 text-left block"
                        >
                          View Declarations
                        </button>
                        <button
                          onClick={() => { setMenuOpenId(null); toast(`${s.name} disabled (simulated)`); }}
                          className="w-full px-3 py-1.5 hover:bg-rose-50 text-rose-600 text-left block border-t border-slate-100"
                        >
                          Disable Supplier
                        </button>
                      </div>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Supplier Profile Drawer / Modal */}
      {selected && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-end">
          <div className="bg-white h-full w-full max-w-2xl shadow-2xl border-l border-slate-200 overflow-y-auto p-6 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <span className="text-[10px] font-mono font-bold text-slate-400 uppercase">{selected.id}</span>
                <h2 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
                  {selected.name} <StatusChip status={selected.status} />
                </h2>
              </div>
              <button onClick={() => setSelected(null)} className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
              <div>
                <h4 className="mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">Profile</h4>
                <DetailRow label="Legal Name" value={selected.legalName} />
                <DetailRow label="Trading Name" value={selected.tradingName} />
                <DetailRow label="Country" value={selected.country} />
                <DetailRow label="Registration" value={selected.reg} mono />
                <DetailRow label="Address" value={selected.address} />
                <DetailRow label="Contact" value={selected.contact} />
                <DetailRow label="Email" value={selected.email} />
                <DetailRow label="Industry" value={selected.industry} />
                <DetailRow label="Tier" value={selected.tier} />
                <DetailRow label="Facility" value={selected.facility} />
              </div>

              <div>
                <h4 className="mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">Carbon & PCF Summary</h4>
                <DetailRow label="Annual Volume" value={selected.volume > 1 ? fmtKg(selected.volume) : 'Service'} />
                <DetailRow label="PCF Intensity" value={<IntensityPill value={selected.pcfIntensity} />} />
                <DetailRow label="Classification" value={<ClassBadge dataClass={selected.dataClass} full />} />
                <DetailRow label="Data Quality Score" value={<QualityBar score={selected.score} />} />
                <DetailRow label="Scope 3 Contribution" value={fmtPct(scope3ContributionFor(selected.id), 1)} mono />
              </div>
            </div>

            {dep && (
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-700">Product Lineage Dependencies</h4>
                <LineageFlow
                  steps={[
                    { label: 'Supplier', value: selected.name, highlight: true },
                    { label: 'Materials', value: dep.materials.join(', ') || 'None' },
                    { label: 'Internal Products', value: dep.products.join(', ') || 'None' },
                    { label: 'Passports', value: dep.passports.join(', ') || 'None' },
                  ]}
                />
              </div>
            )}
          </div>
        </div>
      )}

      {/* Add Supplier Modal */}
      {addOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
            <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <Plus className="w-4 h-4 text-emerald-600" /> Add New Supplier
              </h3>
              <button onClick={() => setAddOpen(false)} className="p-1 text-slate-400 hover:text-slate-600 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={submitAdd} className="p-5 space-y-4 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Company Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Volta Agro Supplies"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-emerald-600"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Country</label>
                <select
                  value={form.country}
                  onChange={(e) => setForm({ ...form, country: e.target.value })}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-emerald-600 bg-white"
                >
                  <option value="Ghana">Ghana</option>
                  <option value="Côte d'Ivoire">Côte d'Ivoire</option>
                  <option value="Netherlands">Netherlands</option>
                  <option value="Nigeria">Nigeria</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Material / Service Supplied</label>
                <input
                  type="text"
                  placeholder="e.g. Raw Cocoa Beans"
                  value={form.material}
                  onChange={(e) => setForm({ ...form, material: e.target.value })}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-emerald-600"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Estimated Annual Volume (kg)</label>
                <input
                  type="number"
                  placeholder="e.g. 50000"
                  value={form.volume}
                  onChange={(e) => setForm({ ...form, volume: e.target.value })}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-emerald-600"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setAddOpen(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl font-bold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-xs"
                >
                  Add Supplier
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SuppliersTab;
