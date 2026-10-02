import React from 'react';
import type { LucideIcon } from 'lucide-react';

interface KpiCardProps {
  label: string;
  value: string | number;
  sub?: string;
  accent?: boolean;
  onClick?: () => void;
  testId?: string;
  icon?: LucideIcon;
}

export function KpiCard({ label, value, sub, accent = false, onClick, testId, icon: Icon }: KpiCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      data-testid={testId}
      className={`group flex flex-col items-start rounded-xl border p-4 text-left transition-all shadow-xs ${
        onClick ? 'cursor-pointer hover:shadow-md' : 'cursor-default'
      } ${
        accent ? 'border-emerald-500/30 bg-emerald-50/60' : 'border-slate-200 bg-white'
      }`}
    >
      <div className="flex w-full items-center justify-between">
        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">{label}</span>
        {Icon && <Icon className={`h-4 w-4 ${accent ? 'text-emerald-600' : 'text-slate-400'}`} />}
      </div>
      <span className="mt-2 text-2xl font-black tracking-tight text-slate-900">{value}</span>
      {sub && <span className="mt-0.5 text-xs text-slate-500 font-medium">{sub}</span>}
    </button>
  );
}
