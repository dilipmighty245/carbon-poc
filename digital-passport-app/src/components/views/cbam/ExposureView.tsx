import React, { useState } from 'react';
import { Calculator, Euro, TrendingUp, AlertCircle, ShieldCheck, Sparkles, CheckCircle2 } from 'lucide-react';
import type { CBAMProductData } from '../../../types/cbam';
import { STEEL_CBAM_BENCHMARKS } from '../../../data/steelData';

interface ExposureViewProps {
  product: CBAMProductData;
}

export const ExposureView: React.FC<ExposureViewProps> = ({ product }) => {
  const [certPrice, setCertPrice] = useState(82);
  const [freeAllocPct, setFreeAllocPct] = useState(97.5); // 2026 phase-out start
  const [carbonPricePaid, setCarbonPricePaid] = useState(0);

  const grossEmissionsTonnes = product.totalSpecificEmissions * product.annualVolumeTonnes;
  const netTaxableEmissions = Math.max(0, grossEmissionsTonnes * (1 - freeAllocPct / 100));
  const netLiabilityEUR = Math.max(0, netTaxableEmissions * certPrice - carbonPricePaid);

  // Financial savings of actual verified data vs EU default fallback
  const defaultFallbackIntensity = STEEL_CBAM_BENCHMARKS.defaultFallbackRate2026; // 3.4837
  const verifiedIntensity = product.totalSpecificEmissions; // e.g. 1.633
  const savingsPerTonne = Math.max(0, defaultFallbackIntensity - verifiedIntensity);
  const totalSavingsEUR = savingsPerTonne * product.annualVolumeTonnes * certPrice;

  return (
    <div className="space-y-6">
      {/* Official 2026 EU CBAM Steel Benchmark Comparison Card */}
      <div className="bg-[#0C1322] p-6 rounded-2xl border border-emerald-500/30 text-white shadow-lg space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 text-[10px] font-extrabold px-2.5 py-0.5 rounded-md uppercase">
                EU REGULATION (EU) 2026/1740 BENCHMARKS
              </span>
              <span className="text-slate-400 text-xs font-mono">CN 7208 39 00 · Steel Coil</span>
            </div>
            <h2 className="text-xl font-bold tracking-tight text-white">
              Official 2026 CBAM Steel Benchmarks & Financial Advantage
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Comparison of actual verified passport data against official production-route benchmarks and default fallbacks.
            </p>
          </div>

          <div className="bg-emerald-950/60 p-3.5 rounded-xl border border-emerald-500/40 text-right">
            <span className="text-[10px] font-bold text-slate-400 uppercase block">VERIFIED FINANCIAL ADVANTAGE</span>
            <span className="text-2xl font-black text-[#00E599] mt-0.5 block">
              +€{totalSavingsEUR.toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </span>
            <span className="text-[10px] text-emerald-300 block">Savings vs EU Default Fallback Penalty</span>
          </div>
        </div>

        {/* 4 Benchmark Cards Comparison Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-2">
          {/* 1. Actual Verified Footprint */}
          <div className="bg-slate-900/90 p-4 rounded-xl border-2 border-emerald-500 relative">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] font-bold text-emerald-400 uppercase">SAURIENT VERIFIED PASSPORT</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            </div>
            <span className="text-2xl font-black text-white block">
              {verifiedIntensity.toFixed(3)} <span className="text-xs text-slate-400 font-normal">tCO₂e/t</span>
            </span>
            <span className="text-[10px] text-slate-400 mt-1 block font-mono">Batch ST-2026-00981</span>
          </div>

          {/* 2. Official BF-BOF Benchmark */}
          <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800">
            <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">BF-BOF EU BENCHMARK</span>
            <span className="text-2xl font-black text-sky-400 block">
              {STEEL_CBAM_BENCHMARKS.bfBofBenchmark.toFixed(3)} <span className="text-xs text-slate-400 font-normal">tCO₂e/t</span>
            </span>
            <span className="text-[10px] text-slate-400 mt-1 block">Blast Furnace / Oxygen Route</span>
          </div>

          {/* 3. DRI-EAF Benchmark */}
          <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800">
            <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">DRI-EAF EU BENCHMARK</span>
            <span className="text-2xl font-black text-amber-400 block">
              {STEEL_CBAM_BENCHMARKS.driEafBenchmark.toFixed(3)} <span className="text-xs text-slate-400 font-normal">tCO₂e/t</span>
            </span>
            <span className="text-[10px] text-slate-400 mt-1 block">Direct Reduced Iron Route</span>
          </div>

          {/* 4. Default Fallback Penalty */}
          <div className="bg-slate-900/60 p-4 rounded-xl border border-rose-900/60">
            <span className="text-[10px] font-bold text-rose-400 uppercase block mb-1">UNVERIFIED DEFAULT (2026)</span>
            <span className="text-2xl font-black text-rose-400 block">
              {defaultFallbackIntensity.toFixed(4)} <span className="text-xs text-slate-400 font-normal">tCO₂e/t</span>
            </span>
            <span className="text-[10px] text-rose-300 mt-1 block">Includes 10% penalty markup for 2026</span>
          </div>
        </div>
      </div>

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
