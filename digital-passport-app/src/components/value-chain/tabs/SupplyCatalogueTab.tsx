import React, { useState, useEffect } from 'react';
import { useVC } from '../../../context/ValueChainContext';
import type { ChangeEvent } from '../../../context/ValueChainContext';
import { KpiCard, StatusChip, ClassBadge, DetailRow, LineageFlow, IntensityPill } from '../primitives';
import type { CatalogueItem } from '../../../types/valueChain';
import { MoreHorizontal, Check, X, Zap } from 'lucide-react';
import { toast } from '../../../utils/toast';

interface SupplyCatalogueTabProps {
  search?: string;
  registerPrimary?: (key: string, fn: () => void) => void;
}

const match = (o: unknown, q?: string, name?: string) =>
  !q || (JSON.stringify(o) + (name || '')).toLowerCase().includes(q.toLowerCase());

function selectionChecks(c: CatalogueItem) {
  const ok = c.dataClass !== 'PROXY' && c.dataClass !== 'SECONDARY';
  return [
    { label: 'Supplier product mapping', pass: c.mapped },
    { label: 'Supplier PCF available', pass: !!c.pcf },
    { label: 'Correct product & facility', pass: true },
    { label: 'Valid reporting period', pass: c.validUntil >= '2026-06-01' },
    { label: 'Compatible boundary', pass: c.boundary === 'Cradle-to-Gate' || c.boundary === 'Well-to-Wheel' },
    { label: 'Appropriate declared unit', pass: true },
    { label: 'Evidence available', pass: ok },
    { label: 'Verification status', pass: c.verification === 'Verified' },
    { label: 'Data quality acceptable', pass: ok },
  ];
}

export const SupplyCatalogueTab: React.FC<SupplyCatalogueTabProps> = ({ search, registerPrimary }) => {
  const { catalogue, suppliers, supplierName, INTERNAL_MATERIALS, mapCatalogue, addCatalogueProduct, runImpactAnalysis } = useVC();
  const [selected, setSelected] = useState<CatalogueItem | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [mapOpen, setMapOpen] = useState<CatalogueItem | null>(null);
  const [mapTo, setMapTo] = useState('');
  const [impact, setImpact] = useState<ChangeEvent | null>(null);
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
  const [f, setF] = useState({ supplierId: '', product: '', code: '', unit: 'kg', pcf: '', boundary: 'Cradle-to-Gate' });

  useEffect(() => {
    registerPrimary?.('catalogue', () => setAddOpen(true));
  }, [registerPrimary]);

  const rows = catalogue.filter((c) => match(c, search, supplierName(c.supplierId)));
  const total = catalogue.length;
  const pcfAvail = catalogue.filter((c) => c.pcf).length;
  const verified = catalogue.filter((c) => c.verification === 'Verified').length;
  const proxy = catalogue.filter((c) => ['PROXY', 'SECONDARY'].includes(c.dataClass)).length;

  const doMap = (e: React.FormEvent) => {
    e.preventDefault();
    if (!mapOpen || !mapTo) return;
    mapCatalogue(mapOpen.id, mapTo);
    toast.success(`Mapped ${mapOpen.code} → ${mapTo}`);
    setMapOpen(null);
    setMapTo('');
  };

  const submitAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!f.supplierId || !f.product) return toast.error('Supplier & product required');
    addCatalogueProduct({
      supplierId: f.supplierId,
      product: f.product,
      code: f.code || 'PRD-000',
      unit: f.unit,
      pcf: Number(f.pcf) || 0,
      boundary: f.boundary,
      internalMaterial: '—',
      validFrom: '2026-01-01',
      validUntil: '2026-12-31',
      pcfVersion: 'v0.1',
      pcfSource: 'Pending',
      qtyUsed: 0,
      mappingConfidence: 'Low',
    });
    toast.success(`Catalogue product added: ${f.product}`);
    setAddOpen(false);
    setF({ supplierId: '', product: '', code: '', unit: 'kg', pcf: '', boundary: 'Cradle-to-Gate' });
  };

  const doImpact = (c: CatalogueItem) => {
    const r = runImpactAnalysis(c.supplierId, 'PCF update');
    setImpact(r);
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        <KpiCard label="Supplier Products" value={total} testId="cat-kpi-total" />
        <KpiCard label="PCF Available" value={pcfAvail} testId="cat-kpi-pcf" />
        <KpiCard label="Verified PCF" value={verified} testId="cat-kpi-verified" />
        <KpiCard label="Using Proxy Factors" value={proxy} subTone="warn" testId="cat-kpi-proxy" />
      </div>

      <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-xs">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50 text-[10px] font-bold uppercase tracking-wider text-slate-400">
              <th className="py-3 px-4">Supplier</th>
              <th className="py-3 px-4">Product</th>
              <th className="py-3 px-4">Code</th>
              <th className="py-3 px-4">Internal Material</th>
              <th className="py-3 px-4">Unit</th>
              <th className="py-3 px-4">PCF Intensity</th>
              <th className="py-3 px-4">Boundary</th>
              <th className="py-3 px-4">Data Type</th>
              <th className="py-3 px-4">Verification</th>
              <th className="py-3 px-4">Valid Until</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map((c) => (
              <tr
                key={c.id}
                className="cursor-pointer hover:bg-emerald-50/40 transition-colors"
                onClick={() => setSelected(c)}
                data-testid={`cat-row-${c.id}`}
              >
                <td className="py-3 px-4 font-bold text-slate-900">{supplierName(c.supplierId)}</td>
                <td className="py-3 px-4 text-slate-800">{c.product}</td>
                <td className="py-3 px-4 font-mono font-bold text-slate-500">{c.code}</td>
                <td className="py-3 px-4 font-mono">
                  {c.mapped ? (
                    <span className="text-slate-800 font-bold">{c.internalMaterial}</span>
                  ) : (
                    <span className="text-amber-600 font-bold">Unmapped</span>
                  )}
                </td>
                <td className="py-3 px-4 text-slate-600">{c.unit}</td>
                <td className="py-3 px-4">
                  <IntensityPill value={c.pcf} unit={`kgCO2e/${c.unit}`} />
                </td>
                <td className="py-3 px-4 text-slate-600">{c.boundary}</td>
                <td className="py-3 px-4">
                  <ClassBadge dataClass={c.dataClass} />
                </td>
                <td className="py-3 px-4 text-slate-600">{c.verification}</td>
                <td className="py-3 px-4 font-mono text-slate-500">{c.validUntil}</td>
                <td className="py-3 px-4">
                  <StatusChip status={c.status} />
                </td>
                <td className="py-3 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                  <div className="relative inline-block text-left">
                    <button
                      onClick={() => setMenuOpenId(menuOpenId === c.id ? null : c.id)}
                      className="p-1 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100"
                    >
                      <MoreHorizontal className="w-4 h-4" />
                    </button>
                    {menuOpenId === c.id && (
                      <div className="absolute right-0 z-20 mt-1 w-48 rounded-xl bg-white shadow-lg border border-slate-200 py-1 text-left text-xs font-semibold">
                        <button
                          onClick={() => {
                            setMapOpen(c);
                            setMapTo(c.internalMaterial !== '—' ? c.internalMaterial : '');
                            setMenuOpenId(null);
                          }}
                          className="w-full px-3 py-1.5 hover:bg-slate-50 text-slate-700 text-left block"
                        >
                          Map / Replace Mapping
                        </button>
                        <button
                          onClick={() => {
                            doImpact(c);
                            setMenuOpenId(null);
                          }}
                          className="w-full px-3 py-1.5 hover:bg-emerald-50 text-emerald-800 text-left block font-bold"
                        >
                          Simulate PCF Impact
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

      {/* Catalogue Detail Drawer */}
      {selected && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-end">
          <div className="bg-white h-full w-full max-w-2xl shadow-2xl border-l border-slate-200 overflow-y-auto p-6 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <span className="text-[10px] font-mono font-bold text-slate-400 uppercase">{selected.code}</span>
                <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                  {selected.product} <StatusChip status={selected.status} />
                </h2>
              </div>
              <button onClick={() => setSelected(null)} className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-1 text-xs">
              <DetailRow label="Supplier" value={supplierName(selected.supplierId)} />
              <DetailRow label="Product Code" value={selected.code} mono />
              <DetailRow label="Internal Material" value={selected.internalMaterial} mono />
              <DetailRow label="PCF Intensity" value={<IntensityPill value={selected.pcf} unit={`kgCO2e/${selected.unit}`} />} />
              <DetailRow label="Boundary" value={selected.boundary} />
              <DetailRow label="Data Class" value={<ClassBadge dataClass={selected.dataClass} full />} />
              <DetailRow label="Verification" value={selected.verification} />
              <DetailRow label="Validity Period" value={`${selected.validFrom} → ${selected.validUntil}`} mono />
            </div>

            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
              <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-700">Supplier PCF Selection Engine Checks</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                {selectionChecks(selected).map((chk, idx) => (
                  <div key={idx} className="flex items-center gap-2 p-2 bg-white rounded-lg border border-slate-100">
                    {chk.pass ? (
                      <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                    ) : (
                      <X className="w-4 h-4 text-rose-500 shrink-0" />
                    )}
                    <span className={chk.pass ? 'text-slate-800 font-semibold' : 'text-slate-400'}>{chk.label}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="border-t border-slate-100 pt-4 flex gap-2">
              <button
                onClick={() => doImpact(selected)}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-1.5"
              >
                <Zap className="w-4 h-4" /> Run PCF Change Impact Engine
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Impact Simulation Result Modal */}
      {impact && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
            <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-amber-50">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-600" /> Supplier Data Change Impact Results
              </h3>
              <button onClick={() => setImpact(null)} className="p-1 text-slate-400 hover:text-slate-600 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              <div className="p-3 bg-amber-100/60 border border-amber-300 rounded-xl text-amber-950 font-bold">
                Status: RECALCULATION REQUIRED across dependent BOMs & Carbon Passports.
              </div>

              <div className="space-y-1">
                <DetailRow label="Supplier" value={impact.supplier} />
                <DetailRow label="Change Event" value={impact.changeType} />
                <DetailRow label="Affected Internal Materials" value={impact.materials.join(', ')} mono />
                <DetailRow label="Affected Product BOMs" value={impact.boms.join(', ')} />
                <DetailRow label="Affected Passports" value={impact.passports.join(', ')} mono />
              </div>
            </div>

            <div className="p-4 border-t border-slate-200 bg-slate-50 flex justify-end">
              <button
                onClick={() => setImpact(null)}
                className="px-4 py-2 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800"
              >
                Acknowledge Impact
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Map Catalogue Modal */}
      {mapOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
            <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <h3 className="font-bold text-slate-900 text-sm">Map Catalogue Item to Internal Material</h3>
              <button onClick={() => setMapOpen(null)} className="p-1 text-slate-400 hover:text-slate-600 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={doMap} className="p-5 space-y-4 text-xs">
              <p className="text-slate-600 font-medium">
                Map <strong>{mapOpen.product}</strong> ({mapOpen.code}) to an internal feed material BOM component.
              </p>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Select Internal Material *</label>
                <select
                  value={mapTo}
                  onChange={(e) => setMapTo(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-emerald-600 bg-white"
                >
                  <option value="">-- Choose Material --</option>
                  {INTERNAL_MATERIALS.map((m) => (
                    <option key={m.code} value={m.code}>
                      {m.code} — {m.name} ({m.bomComponent})
                    </option>
                  ))}
                </select>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setMapOpen(null)}
                  className="px-4 py-2 border border-slate-200 rounded-xl font-bold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!mapTo}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white font-bold rounded-xl shadow-xs"
                >
                  Save Mapping
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Catalogue Product Modal */}
      {addOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
            <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <h3 className="font-bold text-slate-900 text-sm">Add Catalogue Product</h3>
              <button onClick={() => setAddOpen(false)} className="p-1 text-slate-400 hover:text-slate-600 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={submitAdd} className="p-5 space-y-4 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Supplier *</label>
                <select
                  value={f.supplierId}
                  onChange={(e) => setF({ ...f, supplierId: e.target.value })}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-emerald-600 bg-white"
                >
                  <option value="">-- Choose Supplier --</option>
                  {suppliers.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Product Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Raw Cocoa Beans Grade A"
                  value={f.product}
                  onChange={(e) => setF({ ...f, product: e.target.value })}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-emerald-600"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Product Code</label>
                <input
                  type="text"
                  placeholder="e.g. RCB-GH-009"
                  value={f.code}
                  onChange={(e) => setF({ ...f, code: e.target.value })}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-emerald-600"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">PCF Intensity (kgCO2e/unit)</label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="e.g. 1.95"
                  value={f.pcf}
                  onChange={(e) => setF({ ...f, pcf: e.target.value })}
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
                  Add Product
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SupplyCatalogueTab;
