import React, { useState } from 'react';
import { Lock, Snowflake, AlertTriangle } from 'lucide-react';
import { useMrv } from '../../../../context/MrvContext';
import { Kpi, StatusBadge, Field, SectionCard } from '../shared';

const CONTENTS = [
  "Organisation snapshot", "Facility snapshot", "Product snapshot", "Batch snapshot",
  "Boundary snapshot", "Inventory snapshot", "Allocation snapshot", "Logistics snapshot",
  "Emission factors", "Calculation results", "Evidence manifest", "Audit trail",
];

export const DataFreezeTab: React.FC = () => {
  const { meta, engagement, freezeDataset } = useMrv();
  const [confirm, setConfirm] = useState(false);
  const [reason, setReason] = useState('');
  const frozen = !!engagement.freezeInfo?.ts;
  const info = engagement.freezeInfo;

  const handleFreeze = (e: React.FormEvent) => {
    e.preventDefault();
    freezeDataset();
    setConfirm(false);
  };

  return (
    <div className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <Kpi testid="kpi-freeze-status" label="Freeze Status" value={frozen ? "LOCKED" : "OPEN"} tone={frozen ? "green" : "amber"} />
        <Kpi testid="kpi-dataset-records" label="Dataset Records" value={meta.activityRecords} />
        <Kpi testid="kpi-freeze-evidence" label="Evidence Count" value={meta.evidenceItems} />
        <Kpi testid="kpi-freeze-version" label="Calculation Version" value="V1.0" />
        <Kpi testid="kpi-freeze-pcf" label="Claimed PCF" value={`${meta.claimedIntensity}`} />
      </div>

      {frozen && (
        <div className="flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
          <Lock className="h-6 w-6 text-emerald-600" />
          <div>
            <p className="font-extrabold text-emerald-800">VERIFICATION DATASET LOCKED</p>
            <p className="text-sm text-emerald-700">Later operational changes cannot modify this frozen snapshot.</p>
          </div>
          <StatusBadge status="DATA FROZEN" className="ml-auto" />
        </div>
      )}

      <div className="grid gap-5 lg:grid-cols-3">
        <SectionCard title="Freeze Package" className="lg:col-span-2" testid="freeze-package">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            <Field label="Freeze ID" value={info.id} mono />
            <Field label="PCF Project" value={meta.pcfProject} mono />
            <Field label="Calculation" value="V1.0" />
            <Field label="Activity Records" value={meta.activityRecords} />
            <Field label="Evidence" value={meta.evidenceItems} />
            <Field label="Boundary Version" value="V1.1" />
            <Field label="Emission Factor Dataset" value="DEFRA 2025" />
            <Field label="Production Quantity" value={meta.productionQuantity} />
            <Field label="Total PCF" value={`${meta.claimedTotal} tCO2e`} />
            <Field label="Intensity" value={`${meta.claimedIntensity} kgCO2e/kg`} />
          </div>
          {frozen && (
            <div className="mt-4 grid grid-cols-2 gap-4 rounded-xl bg-slate-50 p-4 sm:grid-cols-4">
              <Field label="Snapshot Hash" value={info.hash} mono />
              <Field label="Freeze Timestamp" value={info.ts} />
              <Field label="Frozen By" value={info.frozenBy} />
              <Field label="Status" value="FROZEN" />
            </div>
          )}
        </SectionCard>

        <SectionCard title="Freeze Contents" testid="freeze-contents">
          <ul className="space-y-2 text-xs">
            {CONTENTS.map((c) => (
              <li key={c} className="flex items-center gap-2 text-slate-700">
                <span className={`h-2 w-2 rounded-full ${frozen ? "bg-emerald-500" : "bg-slate-300"}`} />{c}
              </li>
            ))}
          </ul>
          {!frozen && (
            <button
              onClick={() => setConfirm(true)}
              className="mt-4 w-full rounded-xl bg-emerald-600 px-4 py-2.5 font-bold text-white shadow-xs hover:bg-emerald-700 flex items-center justify-center gap-2 text-xs transition-colors"
            >
              <Snowflake className="h-4 w-4" /> Freeze Verification Dataset
            </button>
          )}
        </SectionCard>
      </div>

      <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4">
        <AlertTriangle className="mt-0.5 h-5 w-5 text-amber-600 shrink-0" />
        <div className="text-xs text-amber-800">
          <p className="font-bold">If source data changes: SOURCE DATA CHANGED</p>
          <p>A NEW CALCULATION VERSION is required and RE-VERIFICATION may be triggered. The frozen snapshot always remains unchanged.</p>
        </div>
      </div>

      {confirm && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white w-full max-w-md rounded-2xl p-6 space-y-4 shadow-xl">
            <h3 className="text-base font-bold text-slate-900">Freeze Verification Dataset</h3>
            <p className="text-xs text-slate-600">
              You are creating an immutable verification snapshot for <span className="font-mono font-semibold">{meta.pcfProject}</span> Calculation V1.0.
            </p>
            <form onSubmit={handleFreeze} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Reason for freeze</label>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="e.g. Audit package submission..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-800 h-20"
                />
              </div>
              <div className="pt-2 flex justify-end gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => setConfirm(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700"
                >
                  Confirm & Freeze
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
