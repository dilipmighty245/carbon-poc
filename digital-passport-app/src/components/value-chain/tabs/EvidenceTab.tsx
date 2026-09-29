import React, { useState, useEffect } from 'react';
import { useVC } from '../../../context/ValueChainContext';
import { KpiCard, StatusChip, DetailRow, LineageFlow } from '../primitives';
import type { EvidenceItem } from '../../../types/valueChain';
import { FileText, X } from 'lucide-react';
import { toast } from '../../../utils/toast';

interface EvidenceTabProps {
  search?: string;
  registerPrimary?: (key: string, fn: () => void) => void;
  goToTab: (tabKey: string) => void;
}

const CATS = [
  'All',
  'Supplier Invoice',
  'Production Records',
  'Meter Data',
  'Utility Bills',
  'Fuel Records',
  'Transport Records',
  'PCF Reports',
  'Verification Statements',
  'Certificates',
  'Methodology',
  'Emission Factors',
  'Photos',
  'Other',
];

const match = (o: unknown, q?: string, name?: string) =>
  !q || (JSON.stringify(o) + (name || '')).toLowerCase().includes(q.toLowerCase());

export const EvidenceTab: React.FC<EvidenceTabProps> = ({ search, registerPrimary, goToTab }) => {
  const { evidence, supplierName, reviewEvidence } = useVC();
  const [selected, setSelected] = useState<EvidenceItem | null>(null);
  const [cat, setCat] = useState('All');

  useEffect(() => {
    registerPrimary?.('evidence', () => {
      setSelected(evidence.find((e) => e.status === 'UNDER REVIEW') || evidence[0]);
    });
  }, [registerPrimary, evidence]);

  const rows = evidence.filter(
    (e) => (cat === 'All' || e.category === cat) && match(e, search, supplierName(e.supplierId))
  );
  const total = evidence.length;
  const accepted = evidence.filter((e) => e.status === 'ACCEPTED').length;
  const review = evidence.filter((e) => e.status === 'UNDER REVIEW').length;
  const rejected = evidence.filter((e) => ['REJECTED', 'MISSING'].includes(e.status)).length;

  const act = (action: 'accept' | 'reject' | 'replace', label: string) => {
    if (!selected) return;
    reviewEvidence(selected.id, action);
    toast.success(`${label}: ${selected.id}`, {
      description: 'Version & audit history preserved — never silently deleted.',
    });
    setSelected(null);
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        <KpiCard label="Evidence Items" value={total} testId="evd-kpi-total" />
        <KpiCard label="Accepted" value={accepted} testId="evd-kpi-accepted" />
        <KpiCard label="Under Review" value={review} subTone="warn" testId="evd-kpi-review" />
        <KpiCard label="Rejected / Missing" value={rejected} subTone="down" testId="evd-kpi-rejected" />
      </div>

      <div className="flex flex-wrap gap-1.5 py-1">
        {CATS.map((c) => (
          <button
            key={c}
            onClick={() => setCat(c)}
            data-testid={`evd-filter-${c.replace(/[^a-z]+/gi, '-').toLowerCase()}`}
            className={`rounded-full border px-3 py-1 text-xs font-bold transition-all ${
              cat === c
                ? 'border-emerald-300 bg-emerald-50 text-emerald-700 shadow-2xs'
                : 'border-slate-200 bg-white text-slate-500 hover:border-emerald-200'
            }`}
          >
            {c}
          </button>
        ))}
      </div>

      <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-xs">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50 text-[10px] font-bold uppercase tracking-wider text-slate-400">
              <th className="py-3 px-4">Evidence ID</th>
              <th className="py-3 px-4">Supplier</th>
              <th className="py-3 px-4">Product</th>
              <th className="py-3 px-4">Category</th>
              <th className="py-3 px-4">Declaration</th>
              <th className="py-3 px-4">Period</th>
              <th className="py-3 px-4">Source</th>
              <th className="py-3 px-4">Uploaded By</th>
              <th className="py-3 px-4">Hash</th>
              <th className="py-3 px-4">Ver.</th>
              <th className="py-3 px-4">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map((e) => (
              <tr
                key={e.id}
                className="cursor-pointer hover:bg-emerald-50/40 transition-colors"
                onClick={() => setSelected(e)}
                data-testid={`evd-row-${e.id}`}
              >
                <td className="py-3 px-4 font-mono font-bold text-slate-500">{e.id}</td>
                <td className="py-3 px-4 font-bold text-slate-900">{supplierName(e.supplierId)}</td>
                <td className="py-3 px-4 text-slate-700">{e.product}</td>
                <td className="py-3 px-4 text-slate-600">{e.category}</td>
                <td className="py-3 px-4 font-mono text-slate-500">{e.declaration}</td>
                <td className="py-3 px-4 text-slate-500">{e.period}</td>
                <td className="py-3 px-4 text-slate-600">{e.source}</td>
                <td className="py-3 px-4 text-slate-600">{e.uploadedBy}</td>
                <td className="py-3 px-4 font-mono text-[11px] text-slate-400">{e.hash}</td>
                <td className="py-3 px-4 font-mono font-bold text-slate-700">v{e.version}</td>
                <td className="py-3 px-4">
                  <StatusChip status={e.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Evidence Detail Modal */}
      {selected && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-end">
          <div className="bg-white h-full w-full max-w-2xl shadow-2xl border-l border-slate-200 overflow-y-auto p-6 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <span className="text-[10px] font-mono font-bold text-slate-400 uppercase">{selected.id}</span>
                <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  {selected.title} <StatusChip status={selected.status} />
                </h2>
              </div>
              <button onClick={() => setSelected(null)} className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex items-center gap-3 p-4 rounded-xl border border-slate-200 bg-slate-50">
              <div className="p-2 bg-emerald-100 text-emerald-800 rounded-lg">
                <FileText className="w-6 h-6" />
              </div>
              <div>
                <div className="font-bold text-slate-900 text-sm">{selected.file}</div>
                <div className="text-xs text-slate-500 font-medium">
                  {selected.category} · Revision v{selected.version}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-1 text-xs">
              <DetailRow label="Evidence ID" value={selected.id} mono />
              <DetailRow label="Supplier" value={supplierName(selected.supplierId)} />
              <DetailRow label="Product" value={selected.product} />
              <DetailRow label="Declaration" value={selected.declaration} mono />
              <DetailRow label="Reporting Period" value={selected.period} />
              <DetailRow label="Source" value={selected.source} />
              <DetailRow label="Uploaded By" value={selected.uploadedBy} />
              <DetailRow label="Uploaded Date" value={selected.uploadedDate} />
              <DetailRow label="Hash" value={selected.hash} mono />
              <DetailRow label="Version" value={`v${selected.version}`} />
            </div>

            <div className="space-y-3 border-t border-slate-100 pt-4">
              <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Traceability & Lineage</h4>
              <LineageFlow
                steps={[
                  { label: 'Evidence', value: selected.id, highlight: true },
                  { label: 'Declaration', value: selected.declaration },
                  { label: 'Supplier Product', value: selected.product },
                  { label: 'Internal Material', value: 'MAT-COCOA-001' },
                  { label: 'Our Product PCF', value: '2.84 kgCO2e/kg' },
                ]}
              />
            </div>

            <div className="flex flex-wrap items-center gap-2 border-t border-slate-100 pt-4">
              <button
                onClick={() => act('accept', 'Evidence accepted')}
                data-testid="evd-accept"
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs"
              >
                Accept Evidence
              </button>
              <button
                onClick={() => act('reject', 'Evidence rejected')}
                data-testid="evd-reject"
                className="px-4 py-2 border border-rose-200 text-rose-600 hover:bg-rose-50 font-bold text-xs rounded-xl"
              >
                Reject Evidence
              </button>
              <button
                onClick={() => act('replace', 'Replacement requested (new version)')}
                className="px-4 py-2 border border-slate-200 text-slate-700 hover:bg-slate-50 font-bold text-xs rounded-xl"
              >
                Request Replacement
              </button>
              <button
                onClick={() => { goToTab('declarations'); setSelected(null); }}
                className="px-4 py-2 border border-slate-200 text-slate-700 hover:bg-slate-50 font-bold text-xs rounded-xl"
              >
                View Declaration
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EvidenceTab;
