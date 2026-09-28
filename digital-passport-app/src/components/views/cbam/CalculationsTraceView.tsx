import React from 'react';
import { GitBranch, ShieldCheck, CheckCircle2, FileText, Layers } from 'lucide-react';
import type { CBAMProductData } from '../../../types/cbam';

interface CalculationsTraceViewProps {
  product: CBAMProductData;
}

export const CalculationsTraceView: React.FC<CalculationsTraceViewProps> = ({ product }) => {
  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-black text-slate-900 tracking-tight">Calculation Provenance & Audit Graph</h2>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Deterministic calculation trace linking activity records, emission factors, formula versions and cryptographic hashes.
            </p>
          </div>
          <span className="bg-emerald-100 text-emerald-800 text-[10px] font-mono font-bold px-3 py-1 rounded-md tracking-wider">
            CAL-001 / CAL-002 PASSED
          </span>
        </div>

        {/* Specific Emissions Summary Bar */}
        <div className="p-5 bg-slate-900 text-white rounded-2xl grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
          <div>
            <span className="text-[10px] font-bold text-slate-400 block uppercase">DIRECT INTENSITY</span>
            <span className="text-xl font-black text-[#00E599] mt-0.5 block">
              {product.directEmissionsIntensity.toFixed(3)} tCO₂e/t
            </span>
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 block uppercase">INDIRECT INTENSITY</span>
            <span className="text-xl font-black text-sky-400 mt-0.5 block">
              {product.indirectEmissionsIntensity.toFixed(3)} tCO₂e/t
            </span>
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 block uppercase">PRECURSOR INTENSITY</span>
            <span className="text-xl font-black text-amber-400 mt-0.5 block">
              {product.precursorEmissionsIntensity.toFixed(3)} tCO₂e/t
            </span>
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 block uppercase">TOTAL SPECIFIC EMBEDDED</span>
            <span className="text-xl font-black text-white mt-0.5 block">
              {product.totalSpecificEmissions.toFixed(3)} tCO₂e/t
            </span>
          </div>
        </div>

        {/* Calculation Line Items Table */}
        <div className="space-y-3 pt-2">
          <h3 className="font-bold text-xs text-slate-900 uppercase tracking-wider">Line-by-Line Provenance Trace</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  <th className="pb-3 pr-4">CATEGORY</th>
                  <th className="pb-3 px-4">SOURCE STREAM</th>
                  <th className="pb-3 px-4">ACTIVITY QUANTITY</th>
                  <th className="pb-3 px-4">EMISSION FACTOR</th>
                  <th className="pb-3 px-4">FORMULA APPLIED</th>
                  <th className="pb-3 px-4">EMISSIONS (tCO₂e)</th>
                  <th className="pb-3 pl-4">EVIDENCE REF</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono">
                {product.calculationLines.map((line) => (
                  <tr key={line.id}>
                    <td className="py-3.5 pr-4">
                      <span className="bg-slate-100 text-slate-800 font-bold px-2 py-0.5 rounded text-[10px] font-sans">
                        {line.category}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-sans font-bold text-slate-900">{line.sourceName}</td>
                    <td className="py-3.5 px-4 text-slate-900 font-bold">
                      {line.activityValue.toLocaleString()} {line.activityUnit}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600">
                      {line.emissionFactor} {line.factorUnit}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 font-sans">{line.formula}</td>
                    <td className="py-3.5 px-4 text-emerald-700 font-bold">
                      {line.emissionstCO2e.toLocaleString()} tCO₂e
                    </td>
                    <td className="py-3.5 pl-4 text-slate-500 font-sans">{line.evidenceRef}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
