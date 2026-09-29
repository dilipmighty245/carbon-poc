import React, { useState, useEffect } from 'react';
import { useVC } from '../../../context/ValueChainContext';
import { KpiCard, StatusChip, ClassBadge, DetailRow, QualityBar, fmtKg, fmtInt } from '../primitives';
import type { Declaration, DataClass } from '../../../types/valueChain';
import { DATA_CLASS_CONFIG } from '../primitives';
import { X } from 'lucide-react';
import { toast } from '../../../utils/toast';

interface DeclarationsTabProps {
  search?: string;
  registerPrimary?: (key: string, fn: () => void) => void;
  goToTab: (tabKey: string) => void;
}

const match = (o: unknown, q?: string, name?: string) =>
  !q || (JSON.stringify(o) + (name || '')).toLowerCase().includes(q.toLowerCase());

export const DeclarationsTab: React.FC<DeclarationsTabProps> = ({ search, registerPrimary, goToTab }) => {
  const { declarations, supplierName, reviewDeclaration } = useVC();
  const [selected, setSelected] = useState<Declaration | null>(null);

  useEffect(() => {
    registerPrimary?.('declarations', () => {
      const r = declarations.find((x) => x.status === 'UNDER REVIEW') || declarations[0];
      if (r) setSelected(r);
    });
  }, [registerPrimary, declarations]);

  const rows = declarations.filter((d) => match(d, search, supplierName(d.supplierId)));
  const total = declarations.length;
  const accepted = declarations.filter((d) => d.status === 'ACCEPTED').length;
  const review = declarations.filter((d) => d.status === 'UNDER REVIEW').length;
  const correction = declarations.filter((d) => d.status === 'CORRECTION REQUIRED').length;

  const act = (action: 'accept' | 'correct' | 'reject' | 'clarify', label: string) => {
    if (!selected) return;
    reviewDeclaration(selected.id, action);
    toast.success(`${label}: ${selected.id}`);
    setSelected(null);
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        <KpiCard label="Declarations" value={total} testId="dec-kpi-total" />
        <KpiCard label="Accepted" value={accepted} testId="dec-kpi-accepted" />
        <KpiCard label="Under Review" value={review} subTone="warn" testId="dec-kpi-review" />
        <KpiCard label="Correction Required" value={correction} subTone="down" testId="dec-kpi-correction" />
      </div>

      <div className="flex flex-wrap gap-2 py-1">
        {(Object.keys(DATA_CLASS_CONFIG) as DataClass[]).map((c) => (
          <ClassBadge key={c} dataClass={c} full />
        ))}
      </div>

      <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-xs">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50 text-[10px] font-bold uppercase tracking-wider text-slate-400">
              <th className="py-3 px-4">Declaration ID</th>
              <th className="py-3 px-4">Supplier</th>
              <th className="py-3 px-4">Facility</th>
              <th className="py-3 px-4">Product</th>
              <th className="py-3 px-4">Period</th>
              <th className="py-3 px-4">Quantity</th>
              <th className="py-3 px-4">Declared PCF</th>
              <th className="py-3 px-4">Boundary</th>
              <th className="py-3 px-4">Data Type</th>
              <th className="py-3 px-4">Evidence</th>
              <th className="py-3 px-4">Verification</th>
              <th className="py-3 px-4">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map((d) => (
              <tr
                key={d.id}
                className="cursor-pointer hover:bg-emerald-50/40 transition-colors"
                onClick={() => setSelected(d)}
                data-testid={`dec-row-${d.id}`}
              >
                <td className="py-3 px-4 font-mono font-bold text-slate-500">{d.id}</td>
                <td className="py-3 px-4 font-bold text-slate-900">{supplierName(d.supplierId)}</td>
                <td className="py-3 px-4 text-slate-700">{d.facility}</td>
                <td className="py-3 px-4 text-slate-700">{d.product}</td>
                <td className="py-3 px-4 text-slate-500">{d.period}</td>
                <td className="py-3 px-4 font-mono text-slate-700">
                  {d.unit === 'kg' ? fmtKg(d.quantity) : `${d.quantity} ${d.unit}`}
                </td>
                <td className="py-3 px-4 font-mono text-slate-700">
                  {d.pcf} {d.declaredUnit === 'kg' ? 'kgCO2e/kg' : `kgCO2e/${d.declaredUnit}`}
                </td>
                <td className="py-3 px-4 text-slate-600">{d.boundary}</td>
                <td className="py-3 px-4">
                  <ClassBadge dataClass={d.dataClass} />
                </td>
                <td className="py-3 px-4 text-slate-600">{d.evidence}</td>
                <td className="py-3 px-4 text-slate-600">{d.verification}</td>
                <td className="py-3 px-4">
                  <StatusChip status={d.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Declaration Detail Modal */}
      {selected && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-end">
          <div className="bg-white h-full w-full max-w-2xl shadow-2xl border-l border-slate-200 overflow-y-auto p-6 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <span className="text-[10px] font-mono font-bold text-slate-400 uppercase">{selected.id}</span>
                <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  {selected.product} <StatusChip status={selected.status} />
                </h2>
              </div>
              <button onClick={() => setSelected(null)} className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex items-center gap-2">
              <ClassBadge dataClass={selected.dataClass} full />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-1 text-xs">
              <DetailRow label="Supplier" value={supplierName(selected.supplierId)} />
              <DetailRow label="Facility" value={selected.facility} />
              <DetailRow label="Product" value={selected.product} />
              <DetailRow label="Product Code" value={selected.productCode} mono />
              <DetailRow label="Quantity" value={`${fmtInt(selected.quantity)} ${selected.unit}`} />
              <DetailRow label="Declared Unit" value={selected.declaredUnit} />
              <DetailRow label="PCF Intensity" value={`${selected.pcf} kgCO2e/kg`} />
              <DetailRow label="Total Emissions" value={`${fmtInt(Math.round(selected.pcf * selected.quantity))} kgCO2e`} />
              <DetailRow label="Boundary" value={selected.boundary} />
              <DetailRow label="Methodology" value={selected.methodology} />
              <DetailRow label="GWP Basis" value={selected.gwp} />
              <DetailRow label="EF Dataset" value={selected.efDataset} />
              <DetailRow label="Calc Version" value={selected.calcVersion} mono />
              <DetailRow label="Data Quality" value={<QualityBar score={selected.quality} />} />
              <DetailRow label="Verification" value={selected.verification} />
              <DetailRow label="Verifier Ref" value={selected.verifierRef} mono />
            </div>

            <div className="p-3.5 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-900 font-semibold">
              Supplier-provided data is <strong>not</strong> automatically verified. Data classification flows directly into all product carbon footprint calculation layers.
            </div>

            <div className="flex flex-wrap items-center gap-2 border-t border-slate-100 pt-4">
              <button
                onClick={() => act('accept', 'Accepted')}
                data-testid="dec-accept"
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs"
              >
                Accept
              </button>
              <button
                onClick={() => act('correct', 'Returned for correction')}
                data-testid="dec-correct"
                className="px-4 py-2 border border-slate-200 text-slate-700 hover:bg-slate-50 font-bold text-xs rounded-xl"
              >
                Return for Correction
              </button>
              <button
                onClick={() => { toast.info('Evidence requested'); goToTab('evidence'); setSelected(null); }}
                className="px-4 py-2 border border-slate-200 text-slate-700 hover:bg-slate-50 font-bold text-xs rounded-xl"
              >
                Request Evidence
              </button>
              <button
                onClick={() => act('reject', 'Rejected')}
                className="px-4 py-2 border border-rose-200 text-rose-600 hover:bg-rose-50 font-bold text-xs rounded-xl"
              >
                Reject
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DeclarationsTab;
