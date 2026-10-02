import React, { useState, useEffect } from 'react';
import { useVC } from '../../../context/ValueChainContext';
import { KpiCard, StatusChip, SharingBadge, DetailRow, IntensityPill, fmtInt } from '../primitives';
import type { CustomerProduct } from '../../../types/valueChain';
import { QrCode, X, PackagePlus } from 'lucide-react';
import { toast } from '../../../utils/toast';

interface CustomerCatalogueTabProps {
  search?: string;
  registerPrimary?: (key: string, fn: () => void) => void;
}

const PKG_DOCS = [
  'Product Carbon Summary',
  'Verified PCF',
  'Carbon Passport',
  'Verification Summary',
  'CBAM Information',
  'Methodology Summary',
  'Boundary',
  'Scope Breakdown',
  'Evidence Summary',
  'Data Quality',
  'Validity',
];

const SHARE_PANEL = [
  { level: 'PUBLIC', items: 'Product name, verified PCF, passport ID, QR verification' },
  { level: 'CUSTOMER', items: 'Batch footprint, methodology, boundary, scope breakdown' },
  { level: 'CONFIDENTIAL', items: 'Supplier-specific evidence, supplier PCF detail' },
  { level: 'VERIFIER', items: 'Full evidence chain, verifier references' },
  { level: 'INTERNAL', items: 'Internal costing, mapping confidence, audit notes' },
];

const match = (o: unknown, q?: string) => !q || JSON.stringify(o).toLowerCase().includes(q.toLowerCase());

export const CustomerCatalogueTab: React.FC<CustomerCatalogueTabProps> = ({ search, registerPrimary }) => {
  const { customerCatalogue, AGG, generatePackage, packages } = useVC();
  const [selected, setSelected] = useState<CustomerProduct | null>(null);
  const [pkgOpen, setPkgOpen] = useState<CustomerProduct | null>(null);
  const [docs, setDocs] = useState<string[]>([
    'Product Carbon Summary',
    'Verified PCF',
    'Carbon Passport',
  ]);

  useEffect(() => {
    registerPrimary?.('customer-catalogue', () => setPkgOpen(customerCatalogue[0]));
  }, [registerPrimary, customerCatalogue]);

  const rows = customerCatalogue.filter((p) => match(p, search));

  const toggleDoc = (d: string) =>
    setDocs((p) => (p.includes(d) ? p.filter((x) => x !== d) : [...p, d]));

  const gen = () => {
    if (!pkgOpen) return;
    generatePackage({
      customer: 'Selected Customer',
      product: pkgOpen.product,
      batch: pkgOpen.batch,
      docs,
      sharing: pkgOpen.sharing,
    });
    toast.success('Customer Carbon Data Package generated', {
      description: `${docs.length} documents · sharing respects confidentiality`,
    });
    setPkgOpen(null);
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        <KpiCard label="Products" value={AGG.customerProducts} testId="cc-kpi-products" />
        <KpiCard label="Verified PCFs" value={AGG.customerVerified} testId="cc-kpi-verified" />
        <KpiCard label="Active Passports" value={AGG.activePassports} testId="cc-kpi-passports" />
        <KpiCard label="CBAM Ready" value={AGG.cbamReady} testId="cc-kpi-cbam" />
      </div>

      <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-xs">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50 text-[10px] font-bold uppercase tracking-wider text-slate-400">
              <th className="py-3 px-4">Product</th>
              <th className="py-3 px-4">Code</th>
              <th className="py-3 px-4">Facility</th>
              <th className="py-3 px-4">Latest Batch</th>
              <th className="py-3 px-4">PCF Intensity</th>
              <th className="py-3 px-4">Boundary</th>
              <th className="py-3 px-4">Verification</th>
              <th className="py-3 px-4">Passport</th>
              <th className="py-3 px-4">CBAM</th>
              <th className="py-3 px-4">Sharing</th>
              <th className="py-3 px-4">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map((p) => (
              <tr
                key={p.id}
                className="cursor-pointer hover:bg-emerald-50/40 transition-colors"
                onClick={() => setSelected(p)}
                data-testid={`cc-row-${p.id}`}
              >
                <td className="py-3 px-4 font-bold text-slate-900">{p.product}</td>
                <td className="py-3 px-4 font-mono font-bold text-slate-500">{p.code}</td>
                <td className="py-3 px-4 text-slate-700">{p.facility}</td>
                <td className="py-3 px-4 font-mono text-slate-500">{p.batch}</td>
                <td className="py-3 px-4">
                  <IntensityPill value={p.pcf} />
                </td>
                <td className="py-3 px-4 text-slate-600">{p.boundary}</td>
                <td className="py-3 px-4">
                  <StatusChip status={p.verification} />
                </td>
                <td className="py-3 px-4">
                  <StatusChip status={p.passport} />
                </td>
                <td className="py-3 px-4 text-slate-600 font-medium">{p.cbam}</td>
                <td className="py-3 px-4">
                  <SharingBadge level={p.sharing} />
                </td>
                <td className="py-3 px-4">
                  <StatusChip status={p.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {packages.length > 0 && (
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-3">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Generated Customer Packages ({packages.length})
          </div>
          <div className="space-y-2">
            {packages.map((pk) => (
              <div
                key={pk.id}
                className="flex items-center justify-between rounded-xl border border-slate-200 p-3 text-xs bg-slate-50/50"
                data-testid={`pkg-row-${pk.id}`}
              >
                <div>
                  <span className="font-mono font-bold text-slate-500 mr-2">{pk.id}</span>
                  <strong className="text-slate-900">{pk.customer}</strong> · {pk.product} ·{' '}
                  <span className="text-slate-600 font-medium">{pk.docs.length} docs included</span>
                </div>
                <div className="flex items-center gap-3">
                  <SharingBadge level={pk.sharing} />
                  <span className="text-[10px] font-mono text-slate-400">Expires {pk.expiry}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Product Carbon Profile Modal */}
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

            <div className="flex items-start justify-between rounded-xl border border-slate-200 bg-slate-50 p-4">
              <div>
                <div className="text-3xl font-black text-slate-900 font-mono">{selected.pcf} <span className="text-sm font-normal text-slate-500">kgCO2e/kg</span></div>
                <div className="text-xs text-slate-500 font-medium">Verified PCF · {selected.boundary}</div>
              </div>
              <div className="flex flex-col items-center gap-1 text-slate-800">
                <QrCode className="w-10 h-10 text-emerald-600" />
                <span className="text-[10px] font-bold text-emerald-700">Digital Passport</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-1 text-xs">
              <DetailRow label="Product Code" value={selected.code} mono />
              <DetailRow label="Producer" value="Asante Cocoa Cooperative" />
              <DetailRow label="Country of Origin" value="Ghana" />
              <DetailRow label="Facility" value={selected.facility} />
              <DetailRow label="Latest Batch" value={selected.batch} mono />
              <DetailRow label="Batch Footprint" value={`${fmtInt(Math.round(selected.pcf * selected.production))} kgCO2e`} />
              <DetailRow label="Methodology" value={selected.methodology} />
              <DetailRow label="Calculation Version" value={selected.calcVersion} mono />
              <DetailRow label="Verification" value={<StatusChip status={selected.verification} />} />
              <DetailRow label="Verifier Reference" value={selected.verifierRef} mono />
              <DetailRow label="Carbon Passport ID" value={selected.passportId} mono />
              <DetailRow label="Passport Status" value={<StatusChip status={selected.passport} />} />
            </div>

            <div className="space-y-2 border-t border-slate-100 pt-4">
              <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Confidentiality & Sharing Matrix
              </h4>
              <div className="space-y-1 text-xs">
                {SHARE_PANEL.map((item) => (
                  <div key={item.level} className="flex items-start gap-2 p-2 bg-slate-50 rounded-lg border border-slate-100">
                    <SharingBadge level={item.level} />
                    <span className="text-slate-600">{item.items}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="border-t border-slate-100 pt-4 flex gap-2">
              <button
                onClick={() => {
                  setPkgOpen(selected);
                  setSelected(null);
                }}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-1.5"
              >
                <PackagePlus className="w-4 h-4" /> Build Customer Package
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Package Builder Modal */}
      {pkgOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
            <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <h3 className="font-bold text-slate-900 text-sm">Build Customer Data Package</h3>
              <button onClick={() => setPkgOpen(null)} className="p-1 text-slate-400 hover:text-slate-600 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              <p className="text-slate-600">
                Select documents to include in package for <strong>{pkgOpen.product}</strong> ({pkgOpen.batch}).
              </p>

              <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto pr-1">
                {PKG_DOCS.map((d) => (
                  <label
                    key={d}
                    className={`flex items-center gap-2 p-2 rounded-lg border cursor-pointer ${
                      docs.includes(d)
                        ? 'bg-emerald-50 border-emerald-300 text-emerald-900 font-bold'
                        : 'border-slate-200 text-slate-700'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={docs.includes(d)}
                      onChange={() => toggleDoc(d)}
                      className="rounded text-emerald-600 focus:ring-emerald-500"
                    />
                    <span>{d}</span>
                  </label>
                ))}
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setPkgOpen(null)}
                  className="px-4 py-2 border border-slate-200 rounded-xl font-bold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={gen}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-xs"
                >
                  Generate Package
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomerCatalogueTab;
