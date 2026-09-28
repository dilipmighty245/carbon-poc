import React, { useState } from 'react';
import { Calculator, Euro, TrendingUp, AlertCircle } from 'lucide-react';
import type { CBAMProductData } from '../../../types/cbam';

interface ExposureViewProps {
  product: CBAMProductData;
}

export const ExposureView: React.FC<ExposureViewProps> = ({ product }) => {
  const [certPrice, setCertPrice] = useState(82);
  const [freeAllocPct, setFreeAllocPct] = useState(97.5); // 2026 phase-out start
  const [carbonPricePaid, setCarbonPricePaid] = useState(0);

  const grossEmissionsTonnes = product.totalSpecificEmissions * product.annualVolumeTonnes;
  const netTaxableEmissions = Math.max(0, grossEmissionsTonnes * (1 - freeAllocPct / 100));
  const grossExposureEUR = grossEmissionsTonnes * certPrice;
  const netLiabilityEUR = Math.max(0, netTaxableEmissions * certPrice - carbonPricePaid);

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
        <div>
          <h2 className="text-lg font-black text-slate-900 tracking-tight">Interactive CBAM Exposure & Scenario Modeling</h2>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Model financial liability under EU ETS certificate price scenarios, free allocation phase-out, and origin carbon taxes.
          </p>
        </div>

        {/* Interactive Controls */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-slate-50 p-5 rounded-2xl border border-slate-200 text-xs">
          <div>
            <div className="flex justify-between font-bold text-slate-900 mb-2">
              <span>CBAM Certificate Price (€/tCO₂e)</span>
              <span className="font-mono text-emerald-600">€{certPrice}/t</span>
            </div>
            <input
              type="range"
              min="40"
              max="150"
              value={certPrice}
              onChange={(e) => setCertPrice(parseFloat(e.target.value))}
              className="w-full accent-emerald-500 cursor-pointer"
            />
          </div>

          <div>
            <div className="flex justify-between font-bold text-slate-900 mb-2">
              <span>EU Free Allocation Coverage (%)</span>
              <span className="font-mono text-sky-600">{freeAllocPct}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              step="2.5"
              value={freeAllocPct}
              onChange={(e) => setFreeAllocPct(parseFloat(e.target.value))}
              className="w-full accent-sky-500 cursor-pointer"
            />
          </div>

          <div>
            <div className="flex justify-between font-bold text-slate-900 mb-2">
              <span>Origin Carbon Tax Paid (€)</span>
              <span className="font-mono text-amber-600">€{carbonPricePaid}</span>
            </div>
            <input
              type="number"
              value={carbonPricePaid}
              onChange={(e) => setCarbonPricePaid(parseFloat(e.target.value) || 0)}
              className="w-full bg-white border border-slate-300 rounded-xl px-3 py-1.5 font-bold font-mono focus:outline-none focus:border-emerald-500"
            />
          </div>
        </div>

        {/* Scenario Results Banner */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="p-5 bg-slate-900 text-white rounded-2xl">
            <span className="text-[10px] font-bold text-slate-400 block uppercase">GROSS EMBEDDED EMISSIONS</span>
            <span className="text-2xl font-black text-white mt-1 block">
              {grossEmissionsTonnes.toLocaleString(undefined, { maximumFractionDigits: 1 })} <span className="text-sm font-normal text-slate-400">tCO₂e</span>
            </span>
            <span className="text-[10px] text-slate-400 mt-1 block">Annual volume × Specific intensity</span>
          </div>

          <div className="p-5 bg-slate-900 text-white rounded-2xl">
            <span className="text-[10px] font-bold text-slate-400 block uppercase">NET TAXABLE EMISSIONS</span>
            <span className="text-2xl font-black text-sky-400 mt-1 block">
              {netTaxableEmissions.toLocaleString(undefined, { maximumFractionDigits: 1 })} <span className="text-sm font-normal text-slate-400">tCO₂e</span>
            </span>
            <span className="text-[10px] text-slate-400 mt-1 block">After {freeAllocPct}% EU free allocation</span>
          </div>

          <div className="p-5 bg-slate-900 text-white rounded-2xl">
            <span className="text-[10px] font-bold text-slate-400 block uppercase">NET CBAM FINANCIAL LIABILITY</span>
            <span className="text-2xl font-black text-[#00E599] mt-1 block">
              €{netLiabilityEUR.toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </span>
            <span className="text-[10px] text-slate-400 mt-1 block">Net liability at €{certPrice}/tCO₂e</span>
          </div>
        </div>
      </div>
    </div>
  );
};
