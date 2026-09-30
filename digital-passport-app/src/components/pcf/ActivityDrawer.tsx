import React from 'react';
import type { ActivityRecord } from '../../types/pcf';
import { StatusChip } from './common/StatusChip';
import { CheckCircle2, FileText, ArrowRight, X } from 'lucide-react';
import { fmtNum } from '../../utils/format';

interface ActivityDrawerProps {
  activity: ActivityRecord | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function Row({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-slate-100 py-2.5 last:border-0">
      <span className="text-xs font-bold uppercase tracking-wider text-slate-400">{label}</span>
      <span className="text-right text-xs font-bold text-slate-900">{value}</span>
    </div>
  );
}

export function ActivityDrawer({ activity, open, onOpenChange }: ActivityDrawerProps) {
  if (!open || !activity) return null;
  const a = activity;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/40 backdrop-blur-xs">
      <div 
        className="w-full max-w-xl bg-white h-full shadow-2xl p-6 overflow-y-auto space-y-5 animate-in slide-in-from-right duration-200"
        data-testid="activity-drawer"
      >
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div>
            <h3 className="text-lg font-bold text-slate-900">{a.activity}</h3>
            <p className="text-xs font-medium text-slate-400">{a.id} · {a.stage}</p>
          </div>
          <div className="flex items-center gap-3">
            <StatusChip status={a.status} />
            <button 
              onClick={() => onOpenChange(false)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-x-6">
          <Row label="Activity ID" value={a.id} />
          <Row label="Scope" value={a.scope} />
          <Row label="Facility" value={a.facility} />
          <Row label="Process" value={a.process} />
          <Row label="Equipment" value={a.equipment} />
          <Row label="Meter" value={a.meter} />
          <Row label="Category" value={a.category} />
          <Row label="Lifecycle Stage" value={a.stage} />
          <Row label="Quantity" value={`${fmtNum(a.quantity)} ${a.unit}`} />
          <Row label="Timestamp" value={a.timestamp} />
          <Row label="Source System" value={a.sourceSystem} />
          <Row label="Supplier" value={a.supplier} />
          <Row label="Emission Factor" value={a.ef} />
          <Row label="Factor Version" value={a.factorVersion} />
          <Row label="Data Quality" value={`${a.quality}/100`} />
          <Row label="Created By" value={a.createdBy} />
          <Row label="Last Updated" value={a.lastUpdated} />
          <Row label="Calculated CO₂e" value={`${fmtNum(a.co2e)} kgCO₂e`} />
        </div>

        {/* Evidence */}
        <div className="flex items-center gap-2.5 rounded-xl border border-emerald-200/80 bg-emerald-50/60 p-3 text-xs font-bold text-emerald-800">
          <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
          <span>Evidence attached</span>
          <FileText className="ml-auto h-4 w-4 text-slate-400 shrink-0" />
          <span className="text-[11px] text-slate-500 font-mono">{a.id}-evidence.pdf</span>
        </div>

        {/* Provenance */}
        <div className="space-y-2">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900">Provenance / Traceability</h4>
          <div className="flex flex-wrap items-center gap-2">
            {a.provenance.map((p, i) => (
              <React.Fragment key={p}>
                <span className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-700">
                  {p}
                </span>
                {i < a.provenance.length - 1 && <ArrowRight className="h-3.5 w-3.5 text-slate-400 shrink-0" />}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Calculation line */}
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-2">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900">Calculation</h4>
          <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
            <code className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-slate-800">{fmtNum(a.quantity)} {a.unit}</code>
            <span className="text-slate-400">×</span>
            <code className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-slate-800">{a.ef}</code>
            <span className="text-slate-400">=</span>
            <code className="rounded-lg bg-slate-900 px-2.5 py-1 font-bold text-emerald-400">{fmtNum(a.co2e)} kgCO₂e</code>
          </div>
        </div>
      </div>
    </div>
  );
}
