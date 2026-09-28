import React from 'react';
import { Building, ShieldCheck, CheckCircle2, FileText, UserCheck } from 'lucide-react';
import type { CBAMProductData } from '../../../types/cbam';

interface DeclarantsViewProps {
  product: CBAMProductData;
}

export const DeclarantsView: React.FC<DeclarantsViewProps> = ({ product }) => {
  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-black text-slate-900 tracking-tight">EU Importer & Authorised CBAM Declarant</h2>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Legal declarant mapping, EORI registration, EU CBAM registry account linkage and authorization checks.
            </p>
          </div>
          <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-3 py-1 rounded-md tracking-wider">
            DEC-001 PASSED
          </span>
        </div>

        {/* Declarant Card */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">AUTHORISED DECLARANT</span>
            <span className="font-bold text-slate-900 text-sm block">EuroMetals Import GmbH</span>
            <span className="text-slate-500 text-[10px]">Rotterdam, Netherlands</span>
          </div>

          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">EORI NUMBER</span>
            <span className="font-bold text-slate-900 font-mono text-sm block">NL849201938000</span>
            <span className="text-emerald-700 font-bold text-[10px] flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" /> EU Customs Verified
            </span>
          </div>

          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">CBAM REGISTRY ACCOUNT</span>
            <span className="font-bold text-slate-900 font-mono text-sm block">CBAM-ACC-EU-2026-940</span>
            <span className="text-emerald-700 font-bold text-[10px] flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" /> Status: Authorised Declarant
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
