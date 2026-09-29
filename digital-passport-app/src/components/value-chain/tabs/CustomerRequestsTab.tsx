import React, { useState, useEffect } from 'react';
import { useVC } from '../../../context/ValueChainContext';
import { KpiCard, StatusChip, SharingBadge, DetailRow, LineageFlow, fmtInt } from '../primitives';
import type { CustomerRequest } from '../../../types/valueChain';
import { Check, X } from 'lucide-react';
import { toast } from '../../../utils/toast';

interface CustomerRequestsTabProps {
  search?: string;
  registerPrimary?: (key: string, fn: () => void) => void;
  goToTab: (tabKey: string) => void;
}

const match = (o: unknown, q?: string) => !q || JSON.stringify(o).toLowerCase().includes(q.toLowerCase());

export const CustomerRequestsTab: React.FC<CustomerRequestsTabProps> = ({ search, registerPrimary, goToTab }) => {
  const { customerRequests, respondCustomerRequest, generatePackage } = useVC();
  const [selected, setSelected] = useState<CustomerRequest | null>(null);

  useEffect(() => {
    registerPrimary?.('customer-requests', () => {
      setSelected(
        customerRequests.find((r) => r.status === 'UNDER REVIEW' || r.status === 'READY TO SHARE') ||
          customerRequests[0]
      );
    });
  }, [registerPrimary, customerRequests]);

  const rows = customerRequests.filter((r) => match(r, search));
  const open = customerRequests.filter((r) => r.status !== 'COMPLETED').length;
  const dueWeek = customerRequests.filter(
    (r) => r.status === 'UNDER REVIEW' || r.status === 'READY TO SHARE'
  ).length;
  const completed = customerRequests.filter((r) => r.status === 'COMPLETED').length;
  const overdue = customerRequests.filter((r) => r.status === 'OVERDUE').length;

  const checks = [
    { k: 'Product PCF', v: true },
    { k: 'Verification Report', v: true },
    { k: 'Carbon Passport', v: true },
    { k: 'CBAM Information', v: true },
  ];

  const genPackage = () => {
    if (!selected) return;
    generatePackage({
      customer: selected.customer,
      product: selected.product,
      batch: selected.batch,
      docs: ['Verified PCF', 'Carbon Passport', 'Verification Summary'],
      sharing: selected.sharing,
    });
    respondCustomerRequest(selected.id, 'COMPLETED');
    toast.success('Customer package generated & shared securely', {
      description: `${selected.customer} · secure link (expires 90 days)`,
    });
    setSelected(null);
    goToTab('customer-catalogue');
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        <KpiCard label="Open Requests" value={open} testId="crq-kpi-open" />
        <KpiCard label="Due This Week" value={dueWeek} subTone="warn" testId="crq-kpi-due" />
        <KpiCard label="Completed" value={completed} testId="crq-kpi-completed" />
        <KpiCard label="Overdue" value={overdue} subTone="down" testId="crq-kpi-overdue" />
      </div>

      <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-xs">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50 text-[10px] font-bold uppercase tracking-wider text-slate-400">
              <th className="py-3 px-4">Request ID</th>
              <th className="py-3 px-4">Customer</th>
              <th className="py-3 px-4">Country</th>
              <th className="py-3 px-4">Product</th>
              <th className="py-3 px-4">Batch</th>
              <th className="py-3 px-4">Requested Info</th>
              <th className="py-3 px-4">Requested</th>
              <th className="py-3 px-4">Due</th>
              <th className="py-3 px-4">Sharing</th>
              <th className="py-3 px-4">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map((r) => (
              <tr
                key={r.id}
                className="cursor-pointer hover:bg-emerald-50/40 transition-colors"
                onClick={() => setSelected(r)}
                data-testid={`crq-row-${r.id}`}
              >
                <td className="py-3 px-4 font-mono font-bold text-slate-500">{r.id}</td>
                <td className="py-3 px-4 font-bold text-slate-900">{r.customer}</td>
                <td className="py-3 px-4 text-slate-700">{r.country}</td>
                <td className="py-3 px-4 text-slate-700">{r.product}</td>
                <td className="py-3 px-4 font-mono text-slate-500">{r.batch}</td>
                <td className="py-3 px-4 text-slate-500">{r.requested.length} items</td>
                <td className="py-3 px-4 font-mono text-slate-500">{r.requestedDate}</td>
                <td className="py-3 px-4 font-mono text-slate-500">{r.due}</td>
                <td className="py-3 px-4">
                  <SharingBadge level={r.sharing} />
                </td>
                <td className="py-3 px-4">
                  <StatusChip status={r.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Detail Modal */}
      {selected && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-end">
          <div className="bg-white h-full w-full max-w-2xl shadow-2xl border-l border-slate-200 overflow-y-auto p-6 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <span className="text-[10px] font-mono font-bold text-slate-400 uppercase">{selected.id}</span>
                <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                  {selected.customer} <StatusChip status={selected.status} />
                </h2>
              </div>
              <button onClick={() => setSelected(null)} className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-1 text-xs">
              <DetailRow label="Customer" value={selected.customer} />
              <DetailRow label="Contact" value={selected.contact} />
              <DetailRow label="Product" value={selected.product} />
              <DetailRow label="Batch" value={selected.batch} mono />
              <DetailRow label="Quantity" value={`${fmtInt(selected.quantity)} kg`} />
              <DetailRow label="Destination Market" value={selected.market} />
              <DetailRow label="Purpose" value={selected.purpose} />
              <DetailRow label="Due Date" value={selected.due} mono />
              <DetailRow label="Internal Owner" value={selected.owner} />
              <DetailRow label="Sharing Permission" value={<SharingBadge level={selected.sharing} />} />
            </div>

            <div>
              <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                Requested Information
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
              <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Request Workflow</h4>
              <LineageFlow
                steps={[
                  { label: '1', value: 'Identify Product' },
                  { label: '2', value: 'Identify Batch' },
                  { label: '3', value: 'Latest PCF' },
                  { label: '4', value: 'Verification' },
                  { label: '5', value: 'Passport' },
                  { label: '6', value: 'Sharing Check' },
                  { label: '7', value: 'Package' },
                ]}
              />
            </div>

            <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50 text-xs space-y-2">
              <div className="font-bold text-emerald-900 uppercase text-[10px] tracking-wider">
                {selected.product} · {selected.batch}
              </div>
              <div className="grid grid-cols-2 gap-2">
                {checks.map((c) => (
                  <div key={c.k} className="flex items-center gap-2 font-semibold text-emerald-800">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>{c.k}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 border-t border-slate-100 pt-4">
              <button
                onClick={() => {
                  respondCustomerRequest(selected.id, 'READY TO SHARE');
                  toast.success('Sharing approved');
                }}
                data-testid="crq-approve"
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs"
              >
                Approve Sharing
              </button>
              <button
                onClick={genPackage}
                data-testid="crq-generate"
                className="px-4 py-2 border border-slate-200 text-slate-700 hover:bg-slate-50 font-bold text-xs rounded-xl"
              >
                Generate Package
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomerRequestsTab;
