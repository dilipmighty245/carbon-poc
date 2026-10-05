import React from 'react';
import { DATA_QUALITY } from '../../../data/pcfData';
import { AlertTriangle, X } from 'lucide-react';

interface DataQualityPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DataQualityPanel({ open, onOpenChange }: DataQualityPanelProps) {
  if (!open) return null;
  const dq = DATA_QUALITY;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
      <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl border border-slate-200 space-y-5 animate-in fade-in zoom-in-95 duration-150" data-testid="data-quality-dialog">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <h3 className="text-base font-bold text-slate-900">Data Quality Breakdown</h3>
            <span className="text-2xl font-black text-emerald-600 tabular tracking-tight">{dq.overall}/100</span>
          </div>
          <button 
            onClick={() => onOpenChange(false)}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-3.5">
          {dq.breakdown.map((b) => (
            <div key={b.label}>
              <div className="mb-1 flex items-center justify-between text-xs font-semibold">
                <span className="text-slate-600">{b.label}</span>
                <span className="font-bold tabular text-slate-900">{b.score}</span>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                <div 
                  className="h-full bg-emerald-500 rounded-full transition-all duration-300"
                  style={{ width: `${b.score}%` }}
                />
              </div>
            </div>
          ))}
        </div>

        <div className="rounded-xl border border-amber-200 bg-amber-50/70 p-4 space-y-2">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-800">
            <AlertTriangle className="h-4 w-4 text-amber-600" />
            <span>Records reducing the score</span>
          </div>
          <ul className="space-y-1.5 text-xs font-medium">
            {dq.detractors.map((d) => (
              <li key={d.record} className="flex items-center justify-between text-slate-700">
                <span>{d.record}</span>
                <span className="text-slate-500">
                  {d.reason} <span className="font-bold text-rose-600 ml-1">{d.impact}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>

        <div className="flex justify-end pt-2">
          <button
            onClick={() => onOpenChange(false)}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-xs transition-colors"
          >
            Close Panel
          </button>
        </div>
      </div>
    </div>
  );
}
