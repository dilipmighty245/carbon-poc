import React from 'react';
import { DollarSign, Calendar, Clock, CreditCard } from 'lucide-react';
import type { CBAMProductData } from '../../../types/cbam';
import { ExposureView } from './ExposureView';

interface CostAnalysisViewProps {
  product: CBAMProductData;
}

export const CostAnalysisView: React.FC<CostAnalysisViewProps> = ({ product }) => {
  return (
    <div className="space-y-6">
      {/* Financial Exposure & EU ETS Scenario Modeling */}
      <ExposureView product={product} />

      {/* Financial Obligations & Certificate Surrender Timeline */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-black text-slate-900 tracking-tight">Cost Analysis & Certificate Surrender Timeline</h2>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Financial obligation schedule, quarterly certificate purchasing requirements and regulatory deadlines.
            </p>
          </div>
          <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-3 py-1 rounded-md tracking-wider">
            DEFINITIVE PHASE ACTIVE
          </span>
        </div>

        {/* Financial Timelines */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
            <span className="text-[10px] font-bold text-slate-400 block uppercase">ANNUAL DECLARATION DEADLINE</span>
            <span className="font-bold text-slate-900 text-sm block font-mono">30 September 2027</span>
            <span className="text-slate-500 text-[10px]">For reporting year FY 2026</span>
          </div>

          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
            <span className="text-[10px] font-bold text-slate-400 block uppercase">QUARTERLY MINIMUM SURRENDER</span>
            <span className="font-bold text-slate-900 text-sm block font-mono">80% of Cumulative Imports</span>
            <span className="text-slate-500 text-[10px]">Held in CBAM Registry Account</span>
          </div>

          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
            <span className="text-[10px] font-bold text-slate-400 block uppercase">CERTIFICATE PRICE INDEX</span>
            <span className="font-bold text-slate-900 text-sm block font-mono">€82.40 / tCO₂e</span>
            <span className="text-slate-500 text-[10px]">Weekly average EU ETS auction price</span>
          </div>
        </div>
      </div>
    </div>
  );
};
