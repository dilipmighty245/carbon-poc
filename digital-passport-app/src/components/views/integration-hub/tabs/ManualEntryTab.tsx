import React, { useState } from 'react';
import { Save, AlertCircle, CheckCircle2, ShieldAlert, FileText, Check } from 'lucide-react';
import type { ActivityDraft } from '../types';

export const ManualEntryTab: React.FC = () => {
  const [facility, setFacility] = useState('Tema Processing Plant');
  const [productBatch, setProductBatch] = useState('Steel coil / BATCH-001');
  const [activityType, setActivityType] = useState<'Electricity' | 'Fuel' | 'Material input' | 'Transport'>('Electricity');
  const [quantity, setQuantity] = useState<string>('125.4');
  const [unit, setUnit] = useState<string>('kWh');
  const [observationDate, setObservationDate] = useState('2026-09-14');
  const [process, setProcess] = useState('Rolling line');
  const [evidenceRef, setEvidenceRef] = useState('EV-003');
  const [sourceDescription, setSourceDescription] = useState('Utility invoice backup meter reading');
  const [candidateScope, setCandidateScope] = useState<'Scope 1' | 'Scope 2' | 'Scope 3'>('Scope 2');

  const [validationResult, setValidationResult] = useState<{
    status: 'success' | 'error' | 'draft';
    message: string;
  } | null>(null);

  const handleActivityTypeChange = (type: 'Electricity' | 'Fuel' | 'Material input' | 'Transport') => {
    setActivityType(type);
    if (type === 'Electricity') {
      setUnit('kWh');
      setCandidateScope('Scope 2');
    } else if (type === 'Fuel') {
      setUnit('L');
      setCandidateScope('Scope 1');
    } else if (type === 'Material input') {
      setUnit('tonne');
      setCandidateScope('Scope 3');
    } else if (type === 'Transport') {
      setUnit('tonne-km');
      setCandidateScope('Scope 3');
    }
  };

  const handleValidateAndSave = (e: React.FormEvent) => {
    e.preventDefault();
    const qNum = Number(quantity);

    if (!Number.isFinite(qNum) || qNum <= 0 || !evidenceRef.trim()) {
      setValidationResult({
        status: 'error',
        message: 'Validation failed: Quantity must be positive and an evidence reference is required.',
      });
      return;
    }

    setValidationResult({
      status: 'success',
      message:
        'Demo activity validated and draft preview saved. Proposed classification needs operator confirmation before verifier workpapers.',
    });
  };

  const handleSaveIncompleteDraft = () => {
    setValidationResult({
      status: 'draft',
      message:
        'Incomplete draft preview saved. Drafts are allowed during operations, but missing evidence will block calculation readiness gates.',
    });
  };

  return (
    <div className="space-y-6">
      {/* Notice Banner */}
      <div className="p-3.5 bg-amber-50 border border-amber-200/80 rounded-xl text-xs text-amber-800 leading-relaxed">
        <strong className="font-bold">Accounting Boundary Notice:</strong> Proposed scope classification depends on the approved organizational boundary. Saving manual data does not verify it.
      </div>

      {/* Main Form Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-6">
        <div className="border-b border-slate-100 pb-4">
          <h2 className="font-bold text-slate-900 text-sm">Add activity record</h2>
          <p className="text-xs text-slate-500">Log manual operational data with full audit trail</p>
        </div>

        <form onSubmit={handleValidateAndSave} className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">Operating Facility</label>
              <input
                type="text"
                value={facility}
                onChange={(e) => setFacility(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">Product / Production Batch</label>
              <input
                type="text"
                value={productBatch}
                onChange={(e) => setProductBatch(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-emerald-500 font-mono"
              />
            </div>
          </div>

          {/* Activity Type Toggle Buttons */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700">Activity Type</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {(['Electricity', 'Fuel', 'Material input', 'Transport'] as const).map((t) => (
                <button
                  type="button"
                  key={t}
                  onClick={() => handleActivityTypeChange(t)}
                  className={`py-2 text-xs font-bold rounded-xl border transition-all text-center ${
                    activityType === t
                      ? 'bg-emerald-50 border-emerald-500 text-emerald-800 shadow-2xs'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Quantity and Unit */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">
                Quantity <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                step="any"
                required
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                placeholder="e.g. 125.4"
                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-emerald-500 font-mono font-bold"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">Unit of Measure</label>
              <input
                type="text"
                readOnly
                value={unit}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-700 font-mono font-bold cursor-not-allowed"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">Observation Date</label>
              <input
                type="date"
                value={observationDate}
                onChange={(e) => setObservationDate(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          {/* Process and Evidence */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">Process Area</label>
              <select
                value={process}
                onChange={(e) => setProcess(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-emerald-500"
              >
                <option value="Rolling line">Rolling line</option>
                <option value="Furnace">Furnace</option>
                <option value="Packing">Packing</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">
                Evidence Reference <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={evidenceRef}
                onChange={(e) => setEvidenceRef(e.target.value)}
                placeholder="e.g. EV-003, INV-2026-09"
                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-emerald-500 font-mono"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700">Source Description & Notes</label>
            <input
              type="text"
              value={sourceDescription}
              onChange={(e) => setSourceDescription(e.target.value)}
              placeholder="e.g. Utility invoice backup meter reading for Tema site"
              className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-emerald-500"
            />
          </div>

          {/* Proposed Classification */}
          <div className="space-y-2 pt-1">
            <label className="text-xs font-bold text-slate-700">
              Proposed Scope Classification (Needs operator confirmation)
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {(['Scope 1', 'Scope 2', 'Scope 3'] as const).map((sc) => (
                <div
                  key={sc}
                  onClick={() => setCandidateScope(sc)}
                  className={`p-3 rounded-xl border cursor-pointer transition-all ${
                    candidateScope === sc
                      ? 'bg-emerald-50 border-emerald-500 text-emerald-900 shadow-2xs'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs">{sc} Candidate</span>
                    {candidateScope === sc && <Check className="w-4 h-4 text-emerald-600" />}
                  </div>
                  <span className="text-[11px] text-slate-500 block mt-1">
                    {sc === 'Scope 1'
                      ? 'Direct combustion & processes'
                      : sc === 'Scope 2'
                      ? 'Purchased electricity / steam'
                      : 'Value chain & logistics'}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Result Alert */}
          {validationResult && (
            <div
              className={`p-4 rounded-xl text-xs flex items-center gap-2 border ${
                validationResult.status === 'success'
                  ? 'bg-emerald-50 text-emerald-900 border-emerald-200'
                  : validationResult.status === 'error'
                  ? 'bg-rose-50 text-rose-900 border-rose-200'
                  : 'bg-sky-50 text-sky-900 border-sky-200'
              }`}
            >
              {validationResult.status === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : validationResult.status === 'error' ? (
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              ) : (
                <FileText className="w-4 h-4 text-sky-600 shrink-0" />
              )}
              <span className="font-semibold">{validationResult.message}</span>
            </div>
          )}

          {/* Submit Action Buttons */}
          <div className="flex flex-wrap items-center gap-3 pt-3 border-t border-slate-100">
            <button
              type="submit"
              className="px-5 py-2.5 bg-[#00E599] hover:bg-[#00c985] text-slate-950 text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              <span>Validate and save demo draft</span>
            </button>
            <button
              type="button"
              onClick={handleSaveIncompleteDraft}
              className="px-4 py-2.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold rounded-xl shadow-2xs transition-colors"
            >
              Save incomplete draft
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
