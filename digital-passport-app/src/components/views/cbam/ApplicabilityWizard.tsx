import React, { useState } from 'react';
import { Search, CheckCircle2, AlertCircle, ShieldAlert, ArrowRight, HelpCircle } from 'lucide-react';
import type { CBAMProductData } from '../../../types/cbam';

interface ApplicabilityWizardProps {
  product: CBAMProductData;
}

export const ApplicabilityWizard: React.FC<ApplicabilityWizardProps> = ({ product }) => {
  const [cnCodeInput, setCnCodeInput] = useState(product.cnCode);
  const [annualVolumeInput, setAnnualVolumeInput] = useState(product.annualVolumeTonnes.toString());
  const [sectorInput, setSectorInput] = useState(product.sector);

  const isElectricityOrHydrogen = sectorInput.toLowerCase().includes('electricity') || sectorInput.toLowerCase().includes('hydrogen');
  const volumeNumber = parseFloat(annualVolumeInput) || 0;
  const isBelowThreshold = volumeNumber < 50 && !isElectricityOrHydrogen;
  const isOutOfScope = cnCodeInput.startsWith('1001') || sectorInput.toLowerCase().includes('agriculture');

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
        <div>
          <h2 className="text-lg font-black text-slate-900 tracking-tight">Interactive CBAM Applicability Wizard</h2>
          <p className="text-xs text-slate-500 font-medium mt-1">
            Evaluates 8-digit CN/TARIC classification, Annex I sector coverage, 50-tonne declarant mass threshold, and country exemptions.
          </p>
        </div>

        {/* Wizard Form Inputs */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div>
            <label className="text-[10px] font-bold text-slate-400 block mb-1 uppercase tracking-wider">
              8-DIGIT CN CODE (TARIC)
            </label>
            <div className="relative">
              <input
                type="text"
                value={cnCodeInput}
                onChange={(e) => setCnCodeInput(e.target.value)}
                placeholder="e.g. 7308 90 98"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 font-mono font-bold focus:outline-none focus:border-emerald-500"
              />
              <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
            </div>
          </div>

          <div>
            <label className="text-[10px] font-bold text-slate-400 block mb-1 uppercase tracking-wider">
              SECTOR / COMMODITY TYPE
            </label>
            <select
              value={sectorInput}
              onChange={(e) => setSectorInput(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 font-bold focus:outline-none focus:border-emerald-500"
            >
              <option value="Iron and steel">Iron and steel</option>
              <option value="Aluminium">Aluminium</option>
              <option value="Cement">Cement</option>
              <option value="Fertilisers">Fertilisers</option>
              <option value="Hydrogen">Hydrogen</option>
              <option value="Electricity">Electricity</option>
              <option value="Cocoa / Outside Scope">Cocoa / Foodstuff (Outside Scope)</option>
            </select>
          </div>

          <div>
            <label className="text-[10px] font-bold text-slate-400 block mb-1 uppercase tracking-wider">
              ANNUAL DECLARANT NET MASS (TONNES)
            </label>
            <input
              type="number"
              value={annualVolumeInput}
              onChange={(e) => setAnnualVolumeInput(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 font-mono font-bold focus:outline-none focus:border-emerald-500"
            />
          </div>
        </div>

        {/* Dynamic Evaluator Decision Result Banner */}
        <div className="p-6 rounded-2xl border space-y-4 shadow-xs" style={{
          backgroundColor: isOutOfScope ? '#f8fafc' : isBelowThreshold ? '#fffbeb' : '#f0fdf4',
          borderColor: isOutOfScope ? '#cbd5e1' : isBelowThreshold ? '#fcd34d' : '#86efac',
        }}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {isOutOfScope ? (
                <AlertCircle className="w-6 h-6 text-slate-500" />
              ) : isBelowThreshold ? (
                <ShieldAlert className="w-6 h-6 text-amber-600" />
              ) : (
                <CheckCircle2 className="w-6 h-6 text-emerald-600" />
              )}
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">EVALUATION OUTCOME</span>
                <h3 className="text-lg font-black text-slate-900">
                  {isOutOfScope
                    ? 'OUTSIDE CURRENT EU CBAM SCOPE'
                    : isBelowThreshold
                    ? 'THRESHOLD EXEMPTION APPLIES (<50 TONNES/YEAR)'
                    : 'CBAM APPLICABLE — MANDATORY REPORTING & VERIFICATION'}
                </h3>
              </div>
            </div>

            <span className={`px-3 py-1 text-xs font-bold rounded-full ${
              isOutOfScope ? 'bg-slate-200 text-slate-800' : isBelowThreshold ? 'bg-amber-100 text-amber-900' : 'bg-emerald-100 text-emerald-900'
            }`}>
              {isOutOfScope ? 'OUT_OF_SCOPE' : isBelowThreshold ? 'THRESHOLD_EXEMPT' : 'APPLICABLE'}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border-t border-slate-200/60 pt-4 text-xs">
            <div>
              <span className="text-slate-400 text-[10px] font-bold block">RULE EVALUATION (APP-001/002)</span>
              <p className="font-semibold text-slate-800 mt-0.5">
                {isOutOfScope
                  ? 'CN code not present in Annex I catalogue.'
                  : `Matched active Annex I catalogue for ${sectorInput}.`}
              </p>
            </div>
            <div>
              <span className="text-slate-400 text-[10px] font-bold block">50-TONNE THRESHOLD (THR-001/002)</span>
              <p className="font-semibold text-slate-800 mt-0.5">
                {isElectricityOrHydrogen
                  ? 'Bypassed: Electricity and Hydrogen require authorization regardless of mass.'
                  : `${volumeNumber} t declared vs 50 t threshold limit.`}
              </p>
            </div>
            <div>
              <span className="text-slate-400 text-[10px] font-bold block">COUNTRY EXEMPTION (APP-005)</span>
              <p className="font-semibold text-slate-800 mt-0.5">
                {product.countryOfOrigin} is not in the EFTA/exempt list; CBAM rules apply.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
