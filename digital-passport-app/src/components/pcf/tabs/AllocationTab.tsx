import React, { useEffect, useState } from 'react';
import { usePcf } from '../../../context/PcfContext';
import { Section, Field } from '../common/Section';
import { StatusChip } from '../common/StatusChip';
import { fmtNum } from '../../../utils/format';
import type { AllocationProduct } from '../../../types/pcf';
import { CheckCircle2 } from 'lucide-react';
import { toast } from '../../../utils/toast';

const METHODS: Record<string, (p: AllocationProduct) => number> = {
  'Physical / Mass': (p) => p.qty,
  'Energy Content': (p) => p.qty * (p.name.includes('Butter') ? 1.35 : p.name.includes('Cake') ? 0.9 : 1.0),
  'Economic': (p) => p.qty * (p.name.includes('Butter') ? 3.2 : p.name.includes('Cake') ? 1.1 : 0.5),
  'Custom Justified Method': (p) => p.qty,
};

interface AllocationTabProps {
  registerPrimary: (fn: () => void) => void;
}

export function AllocationTab({ registerPrimary }: AllocationTabProps) {
  const { allocation, allocationMethod, setAllocationMethod } = usePcf();
  const [validated, setValidated] = useState(true);

  useEffect(() => {
    registerPrimary(() => {
      setValidated(true);
      toast.success('Allocation validated & reconciled.');
    });
  }, [registerPrimary]);

  const weightFn = METHODS[allocationMethod] || METHODS['Physical / Mass'];
  const weights = allocation.products.map((p) => ({ ...p, w: weightFn(p) }));
  const totalW = weights.reduce((s, p) => s + p.w, 0);
  const rows = weights.map((p) => {
    const share = p.w / totalW;
    return { ...p, share, allocated: Math.round(allocation.totalSharedKg * share) };
  });
  const allocatedSum = rows.reduce((s, r) => s + r.allocated, 0);
  const reconciled = Math.abs(allocatedSum - allocation.totalSharedKg) <= 5;
  const target = rows.find((r) => r.isTarget);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2">
        <Section title="Shared Process" testId="section-shared-process">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-lg font-bold text-slate-900">{allocation.sharedProcess}</div>
              <p className="text-xs text-slate-500 font-medium">
                Energy + Fuel + Process emissions shared across co-products
              </p>
            </div>
          </div>
        </Section>
        <Section title="Total Shared Emissions" testId="section-total-shared">
          <div className="text-3xl font-black tabular tracking-tight text-slate-900">
            {fmtNum(allocation.totalSharedKg)}{' '}
            <span className="text-base font-semibold text-slate-400">kgCO₂e</span>
          </div>
          <p className="mt-1 text-xs text-slate-500 font-medium">
            {(allocation.totalSharedKg / 1000).toFixed(1)} tCO₂e to be allocated
          </p>
        </Section>
      </div>

      <Section
        title="Co-product Allocation"
        testId="section-allocation-table"
        right={
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
            <span>Method</span>
            <select
              value={allocationMethod}
              onChange={(e) => setAllocationMethod(e.target.value)}
              data-testid="select-allocation-method"
              className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-xs font-bold text-slate-900 focus:outline-none focus:border-emerald-500 shadow-xs"
            >
              <option value="Physical / Mass">Physical / Mass</option>
              <option value="Energy Content">Energy Content</option>
              <option value="Economic">Economic</option>
              <option value="Custom Justified Method">Custom Justified Method</option>
            </select>
          </div>
        }
      >
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/80 text-left text-[11px] uppercase tracking-wider text-slate-400 font-bold">
                {['Product Name', 'Production Quantity', 'Allocation Factor / Weight', 'Calculated Share %', 'Allocated Emissions (kgCO₂e)', 'Target'].map((h) => (
                  <th key={h} className="px-4 py-3 font-bold">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.map((r) => (
                <tr key={r.name} className={r.isTarget ? 'bg-emerald-50/30 font-bold' : ''}>
                  <td className="px-4 py-3 text-slate-900">{r.name}</td>
                  <td className="px-4 py-3 text-slate-600 font-medium">{fmtNum(r.qty)} kg</td>
                  <td className="px-4 py-3 font-mono text-slate-600">{fmtNum(Math.round(r.w))}</td>
                  <td className="px-4 py-3 font-mono text-emerald-700 font-bold">{(r.share * 100).toFixed(1)}%</td>
                  <td className="px-4 py-3 font-bold text-slate-900">{fmtNum(r.allocated)} kgCO₂e</td>
                  <td className="px-4 py-3">
                    {r.isTarget && (
                      <span className="inline-flex items-center gap-1 font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md text-[10px]">
                        <CheckCircle2 className="h-3 w-3" /> Target Product
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* reconciliation bar */}
        <div className="mt-5 flex flex-wrap items-center justify-between rounded-xl border border-slate-200 bg-slate-50/70 p-4 text-xs font-semibold">
          <div className="flex items-center gap-2">
            <span className="text-slate-500 font-medium">Allocated Sum:</span>
            <span className="font-bold text-slate-900">{fmtNum(allocatedSum)} kgCO₂e</span>
            <span className="text-slate-400">vs</span>
            <span className="font-bold text-slate-900">{fmtNum(allocation.totalSharedKg)} kgCO₂e</span>
          </div>
          {reconciled ? (
            <StatusChip status="RECONCILED" tone="green" />
          ) : (
            <StatusChip status="ALLOCATION MISMATCH" tone="red" />
          )}
        </div>
      </Section>

      {/* Target allocation summary card */}
      {target && (
        <div className="rounded-2xl border border-emerald-500/30 bg-emerald-50/40 p-5 shadow-xs flex flex-wrap items-center justify-between gap-4">
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-800">Target Product Allocation</h4>
            <p className="text-sm font-bold text-slate-900 mt-1">
              {target.name} receives <span className="text-emerald-700 font-extrabold">{fmtNum(target.allocated)} kgCO₂e</span> ({(target.share * 100).toFixed(1)}% of shared emissions)
            </p>
          </div>
          <div className="text-right">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Method Basis</span>
            <span className="text-xs font-bold text-slate-800">{allocationMethod}</span>
          </div>
        </div>
      )}
    </div>
  );
}
