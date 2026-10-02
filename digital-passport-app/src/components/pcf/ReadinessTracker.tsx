import React from 'react';
import { usePcf } from '../../context/PcfContext';
import { Check } from 'lucide-react';

interface Step {
  key: string;
  label: string;
  tab: string | null;
  done: boolean;
}

const STEPS: Step[] = [
  { key: 'output', label: 'Output', tab: 'output', done: true },
  { key: 'boundary', label: 'Boundary', tab: 'boundary', done: true },
  { key: 'inventory', label: 'Inventory', tab: 'inventory', done: true },
  { key: 'allocation', label: 'Allocation', tab: 'allocation', done: true },
  { key: 'logistics', label: 'Logistics', tab: 'logistics', done: true },
  { key: 'calculation', label: 'Calculation', tab: 'calculation', done: true },
  { key: 'report', label: 'Report', tab: 'report', done: true },
  { key: 'verification', label: 'Verification', tab: 'report', done: false },
  { key: 'passport', label: 'Passport', tab: null, done: false },
];

export function ReadinessTracker() {
  const { setActiveTab, reportStatus } = usePcf();

  return (
    <div className="flex flex-wrap items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-xs">
      {STEPS.map((s, i) => {
        const done = s.key === 'verification' ? reportStatus === 'SUBMITTED' : s.done;
        const clickable = done && Boolean(s.tab);
        return (
          <React.Fragment key={s.key}>
            <button
              disabled={!clickable}
              onClick={() => clickable && s.tab && setActiveTab(s.tab)}
              data-testid={`tracker-${s.key}`}
              className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-bold transition-all ${
                done ? 'text-emerald-700' : 'text-slate-400'
              } ${clickable ? 'hover:bg-emerald-50 cursor-pointer' : 'cursor-default'}`}
            >
              <span
                className={`flex h-4 w-4 items-center justify-center rounded-full border text-[10px] ${
                  done ? 'border-emerald-500 bg-emerald-500 text-white' : 'border-slate-300 bg-white'
                }`}
              >
                {done ? <Check className="h-3 w-3" /> : <span className="h-1.5 w-1.5 rounded-full bg-slate-300" />}
              </span>
              <span>{s.label}</span>
            </button>
            {i < STEPS.length - 1 && <span className="h-px w-3 bg-slate-200 shrink-0" />}
          </React.Fragment>
        );
      })}
    </div>
  );
}
