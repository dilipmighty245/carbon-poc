import React from 'react';
import { AlertTriangle, CheckCircle2, ShieldCheck, FileText, ArrowRight } from 'lucide-react';
import type { CBAMProductData } from '../../../types/cbam';

interface ProcessesPrecursorsViewProps {
  product: CBAMProductData;
  onResolveBlocker: (ruleId: string) => void;
}

export const ProcessesPrecursorsView: React.FC<ProcessesPrecursorsViewProps> = ({
  product,
  onResolveBlocker,
}) => {
  const missingPrecursorReport = product.precursors.some((p) => !p.isVerified && p.method === 'ACTUAL');

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-black text-slate-900 tracking-tight">Processes & Precursors Mass Balance</h2>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Tracking complex-good precursor embedded emissions, production routes and supplier verification reports.
            </p>
          </div>
          <span className={`text-[10px] font-bold px-3 py-1 rounded-md tracking-wider ${
            missingPrecursorReport ? 'bg-rose-100 text-rose-800' : 'bg-emerald-100 text-emerald-800'
          }`}>
            {missingPrecursorReport ? 'PRE-001 BLOCKER ACTIVE' : 'PRE-001 PASSED'}
          </span>
        </div>

        {/* Precursor Warning Banner if missing report */}
        {missingPrecursorReport && (
          <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
              <div>
                <h4 className="font-bold text-xs text-rose-900">Missing Precursor Verification Report (`PRE-001`)</h4>
                <p className="text-[11px] text-rose-700 mt-0.5">
                  Iron ore pellets actual emissions require an accredited verifier report or fallback to Commission default values.
                </p>
              </div>
            </div>
            <button
              onClick={() => onResolveBlocker('PRE-001')}
              className="px-4 py-2 bg-[#00E599] hover:bg-[#00c985] text-slate-950 font-bold text-xs rounded-xl shadow-xs transition-colors shrink-0 flex items-center gap-1.5"
            >
              <span>Apply Verified Report</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Precursors Register Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                <th className="pb-3 pr-4">PRECURSOR NAME</th>
                <th className="pb-3 px-4">CN CODE</th>
                <th className="pb-3 px-4">CONSUMPTION (TONNES)</th>
                <th className="pb-3 px-4">ORIGIN INSTALLATION</th>
                <th className="pb-3 px-4">CALCULATION PATH</th>
                <th className="pb-3 px-4">EMISSIONS INTENSITY</th>
                <th className="pb-3 pl-4">VERIFICATION REPORT</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {product.precursors.map((prec) => (
                <tr key={prec.id} className={!prec.isVerified ? 'bg-rose-50/40' : ''}>
                  <td className="py-3.5 pr-4 font-bold text-slate-900">{prec.name}</td>
                  <td className="py-3.5 px-4 font-mono text-slate-700">{prec.cnCode}</td>
                  <td className="py-3.5 px-4 font-mono text-slate-900">{prec.quantityTonnes.toLocaleString()} t</td>
                  <td className="py-3.5 px-4 text-slate-600">{prec.originInstallation} ({prec.country})</td>
                  <td className="py-3.5 px-4">
                    <span className="bg-slate-100 text-slate-800 font-bold px-2 py-0.5 rounded text-[10px]">
                      {prec.method}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 font-bold text-slate-900">
                    {prec.embeddedEmissionsIntensity.toFixed(3)} tCO₂e/t
                  </td>
                  <td className="py-3.5 pl-4">
                    {prec.isVerified ? (
                      <span className="bg-emerald-100 text-emerald-800 font-bold px-2.5 py-0.5 rounded text-[10px] flex items-center gap-1 w-fit">
                        <CheckCircle2 className="w-3 h-3" /> VERIFIED
                      </span>
                    ) : (
                      <span className="bg-rose-100 text-rose-800 font-bold px-2.5 py-0.5 rounded text-[10px] flex items-center gap-1 w-fit">
                        <AlertTriangle className="w-3 h-3" /> REPORT MISSING
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
