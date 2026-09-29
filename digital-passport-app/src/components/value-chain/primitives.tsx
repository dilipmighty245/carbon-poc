import React, { ReactNode } from 'react';
import { Check, Circle, AlertTriangle, X } from 'lucide-react';
import type { DataClass } from '../../types/valueChain';

export const CHART_COLORS = [
  '#00E599',
  '#00B8D9',
  '#F59E0B',
  '#10B981',
  '#EF4444',
  '#8B5CF6',
  '#06B6D4',
];

export const STATUS_TONE: Record<string, string> = {
  ACTIVE: 'emerald',
  VERIFIED: 'emerald',
  ACCEPTED: 'emerald',
  VALIDATED: 'emerald',
  MAPPED: 'emerald',
  COMPLETED: 'emerald',
  'PASSPORT ACTIVE': 'emerald',
  'READY TO SHARE': 'emerald',
  READY: 'emerald',
  CONNECTED: 'blue',
  SUBMITTED: 'blue',
  OPENED: 'blue',
  SENT: 'blue',
  'IN PROGRESS': 'blue',
  'UNDER REVIEW': 'amber',
  'DATA REQUESTED': 'amber',
  PENDING: 'amber',
  'CORRECTION REQUIRED': 'amber',
  RETURNED: 'amber',
  'ACTION REQUIRED': 'amber',
  ESTIMATED: 'amber',
  'RECALCULATION REQUIRED': 'amber',
  DRAFT: 'slate',
  INVITED: 'slate',
  EXPIRED: 'rose',
  DECLINED: 'rose',
  REJECTED: 'rose',
  BLOCKED: 'rose',
  MISSING: 'rose',
  CRITICAL: 'rose',
};

export const toneClasses: Record<string, string> = {
  emerald: 'bg-emerald-50 text-emerald-700 border-emerald-200/80',
  blue: 'bg-blue-50 text-blue-700 border-blue-200/80',
  amber: 'bg-amber-50 text-amber-700 border-amber-200/80',
  rose: 'bg-rose-50 text-rose-700 border-rose-200/80',
  violet: 'bg-purple-50 text-purple-700 border-purple-200/80',
  slate: 'bg-slate-100 text-slate-700 border-slate-200/80',
};

export const DATA_CLASS_CONFIG: Record<DataClass, { label: string; short: string; tone: string }> = {
  PRIMARY_VERIFIED: { label: 'Verified Primary Data', short: 'VERIFIED PRIMARY', tone: 'emerald' },
  PRIMARY_DECLARED: { label: 'Supplier-Declared Primary Data', short: 'SUPPLIER DECLARED', tone: 'blue' },
  SECONDARY: { label: 'Secondary Data', short: 'SECONDARY', tone: 'amber' },
  PROXY: { label: 'Estimated / Proxy Data', short: 'PROXY', tone: 'rose' },
};

export const SHARING_CONFIG: Record<string, { label: string; tone: string }> = {
  PUBLIC: { label: 'Public', tone: 'emerald' },
  CUSTOMER: { label: 'Customer Shareable', tone: 'blue' },
  CONFIDENTIAL: { label: 'Confidential', tone: 'amber' },
  VERIFIER: { label: 'Verifier Only', tone: 'violet' },
  INTERNAL: { label: 'Internal Only', tone: 'slate' },
};

export function qualityTone(score: number): 'emerald' | 'blue' | 'amber' | 'rose' {
  if (score >= 85) return 'emerald';
  if (score >= 70) return 'blue';
  if (score >= 55) return 'amber';
  return 'rose';
}

export function fmtInt(n?: number | null): string {
  return typeof n === 'number' ? n.toLocaleString('en-US') : n ?? '—';
}

export function fmtPct(n?: number | null, digits = 0): string {
  return n === null || n === undefined ? '—' : `${Number(n).toFixed(digits)}%`;
}

export function fmtKg(n?: number | null): string {
  return `${fmtInt(n)} kg`;
}

export function fmtTonnes(kg?: number | null): string {
  return kg === null || kg === undefined
    ? '—'
    : `${(kg / 1000).toLocaleString('en-US', { maximumFractionDigits: 1 })} tCO2e`;
}

export interface StatusChipProps {
  status: string;
  className?: string;
}

export const StatusChip: React.FC<StatusChipProps> = ({ status, className = '' }) => {
  const tone = STATUS_TONE[status?.toUpperCase()] || 'slate';
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
        toneClasses[tone] || toneClasses.slate
      } ${className}`}
    >
      {status}
    </span>
  );
};

export interface ClassBadgeProps {
  dataClass: DataClass;
  full?: boolean;
}

export const ClassBadge: React.FC<ClassBadgeProps> = ({ dataClass, full = false }) => {
  const c = DATA_CLASS_CONFIG[dataClass] || DATA_CLASS_CONFIG.PROXY;
  return (
    <span
      className={`inline-flex items-center rounded-md border px-2 py-0.5 text-[10px] font-bold uppercase ${
        toneClasses[c.tone] || toneClasses.slate
      }`}
    >
      {full ? c.label : c.short}
    </span>
  );
};

export interface SharingBadgeProps {
  level: string;
}

export const SharingBadge: React.FC<SharingBadgeProps> = ({ level }) => {
  const c = SHARING_CONFIG[level] || SHARING_CONFIG.INTERNAL;
  return (
    <span
      className={`inline-flex items-center rounded-md border px-2 py-0.5 text-[10px] font-bold ${
        toneClasses[c.tone] || toneClasses.slate
      }`}
    >
      {c.label}
    </span>
  );
};

export interface QualityBarProps {
  score: number;
  showValue?: boolean;
  className?: string;
}

export const QualityBar: React.FC<QualityBarProps> = ({ score, showValue = true, className = '' }) => {
  const tone = qualityTone(score);
  const barColor = {
    emerald: 'bg-emerald-500',
    blue: 'bg-blue-500',
    amber: 'bg-amber-500',
    rose: 'bg-rose-500',
  }[tone];

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className="h-1.5 w-16 overflow-hidden rounded-full bg-slate-200">
        <div className={`h-full rounded-full ${barColor}`} style={{ width: `${score}%` }} />
      </div>
      {showValue && <span className="text-xs font-bold text-slate-700 font-mono">{score}/100</span>}
    </div>
  );
};

export interface IntensityPillProps {
  value: number;
  unit?: string;
}

export const IntensityPill: React.FC<IntensityPillProps> = ({ value, unit = 'kgCO2e/kg' }) => {
  const tone = value <= 1.5 ? 'emerald' : value <= 2.5 ? 'amber' : 'rose';
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-xs font-bold font-mono ${
        toneClasses[tone]
      }`}
    >
      {typeof value === 'number' ? value.toFixed(2) : value}{' '}
      <span className="opacity-70 font-normal text-[10px]">{unit}</span>
    </span>
  );
};

export interface KpiCardProps {
  label: string;
  value: string | number;
  sub?: string;
  subTone?: 'muted' | 'up' | 'warn' | 'down';
  active?: boolean;
  onClick?: () => void;
  testId?: string;
}

export const KpiCard: React.FC<KpiCardProps> = ({
  label,
  value,
  sub,
  subTone = 'muted',
  active,
  onClick,
  testId,
}) => {
  const subColor =
    {
      muted: 'text-slate-500',
      up: 'text-emerald-600',
      warn: 'text-amber-600',
      down: 'text-rose-600',
    }[subTone] || 'text-slate-500';

  return (
    <button
      type="button"
      onClick={onClick}
      data-testid={testId}
      className={`group flex w-full flex-col items-start rounded-2xl border bg-white p-5 text-left transition-all hover:shadow-md ${
        active ? 'border-emerald-500 ring-2 ring-emerald-100' : 'border-slate-200'
      }`}
    >
      <span className="text-xs font-bold uppercase tracking-wide text-slate-400">{label}</span>
      <span className="mt-2 text-3xl font-black text-slate-900 tracking-tight">{value}</span>
      {sub && <span className={`mt-1 text-xs font-semibold ${subColor}`}>{sub}</span>}
    </button>
  );
};

export interface MetricCardProps {
  label: string;
  value: string | number;
  hint?: string;
  onClick?: () => void;
  testId?: string;
}

export const MetricCard: React.FC<MetricCardProps> = ({ label, value, hint, onClick, testId }) => {
  return (
    <button
      type="button"
      onClick={onClick}
      data-testid={testId}
      className="flex flex-col items-start rounded-xl border border-slate-200 bg-white p-3.5 text-left transition-all hover:border-emerald-300 hover:shadow-sm"
    >
      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{label}</span>
      <span className="mt-1 text-xl font-extrabold text-slate-900 font-mono">{value}</span>
      {hint && <span className="mt-0.5 text-[10px] text-slate-400 font-medium">{hint}</span>}
    </button>
  );
};

export interface SectionTitleProps {
  children: ReactNode;
  right?: ReactNode;
}

export const SectionTitle: React.FC<SectionTitleProps> = ({ children, right }) => {
  return (
    <div className="mb-3 flex items-center justify-between">
      <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-700">{children}</h3>
      {right}
    </div>
  );
};

export interface DetailRowProps {
  label: string;
  value?: ReactNode;
  mono?: boolean;
}

export const DetailRow: React.FC<DetailRowProps> = ({ label, value, mono }) => {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-slate-100 py-2 last:border-0">
      <span className="text-xs font-medium text-slate-500">{label}</span>
      <span className={`text-right text-xs font-semibold text-slate-900 ${mono ? 'font-mono' : ''}`}>
        {value ?? '—'}
      </span>
    </div>
  );
};

export interface WorkflowTrackerProps {
  stages: string[];
  currentIndex: number;
  actionIndex?: number;
}

export const WorkflowTracker: React.FC<WorkflowTrackerProps> = ({ stages, currentIndex, actionIndex }) => {
  const stageIcon = {
    complete: <Check className="h-3 w-3" />,
    pending: <Circle className="h-3 w-3" />,
    action: <AlertTriangle className="h-3 w-3" />,
    blocked: <X className="h-3 w-3" />,
  };

  const stageColor = {
    complete: 'bg-emerald-500 text-white border-emerald-500',
    pending: 'bg-white text-slate-400 border-slate-300',
    action: 'bg-amber-500 text-white border-amber-500',
    blocked: 'bg-rose-500 text-white border-rose-500',
  };

  return (
    <div className="flex items-center gap-1 overflow-x-auto pb-1">
      {stages.map((stage, i) => {
        let state: 'complete' | 'pending' | 'action' | 'blocked' =
          i < currentIndex ? 'complete' : i === currentIndex ? 'action' : 'pending';
        if (actionIndex === i) state = 'action';
        return (
          <React.Fragment key={stage}>
            <div className="flex shrink-0 flex-col items-center gap-1">
              <span
                className={`flex h-6 w-6 items-center justify-center rounded-full border ${stageColor[state]}`}
              >
                {stageIcon[state]}
              </span>
              <span
                className={`whitespace-nowrap text-[9px] font-bold uppercase ${
                  i <= currentIndex ? 'text-slate-800' : 'text-slate-400'
                }`}
              >
                {stage}
              </span>
            </div>
            {i < stages.length - 1 && (
              <div
                className={`h-0.5 w-4 shrink-0 md:w-8 ${
                  i < currentIndex ? 'bg-emerald-400' : 'bg-slate-200'
                }`}
              />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
};

export interface LineageStep {
  label: string;
  value: string;
  highlight?: boolean;
}

export interface LineageFlowProps {
  steps: LineageStep[];
  vertical?: boolean;
  onStepClick?: (step: LineageStep, index: number) => void;
}

export const LineageFlow: React.FC<LineageFlowProps> = ({ steps, vertical = false, onStepClick }) => {
  return (
    <div className={`flex gap-2 ${vertical ? 'flex-col' : 'flex-wrap items-center'}`}>
      {steps.map((s, i) => (
        <React.Fragment key={i}>
          <button
            type="button"
            onClick={() => onStepClick?.(s, i)}
            className={`rounded-xl border px-3 py-2 text-left transition-all ${
              s.highlight
                ? 'border-emerald-400 bg-emerald-50/60'
                : 'border-slate-200 bg-white hover:border-emerald-300'
            } ${onStepClick ? 'cursor-pointer' : ''}`}
          >
            <div className="text-[9px] font-bold uppercase tracking-wider text-slate-400">{s.label}</div>
            <div className="text-xs font-bold text-slate-800">{s.value}</div>
          </button>
          {i < steps.length - 1 && (
            <span className={`text-emerald-500 font-bold ${vertical ? 'self-center rotate-90' : ''}`}>
              →
            </span>
          )}
        </React.Fragment>
      ))}
    </div>
  );
};

export const Legend: React.FC = () => {
  return (
    <div className="flex flex-wrap items-center gap-4 text-[11px] font-semibold text-slate-500">
      <span className="flex items-center gap-1">
        <Check className="h-3 w-3 text-emerald-500" /> Complete
      </span>
      <span className="flex items-center gap-1">
        <Circle className="h-3 w-3 text-slate-400" /> Pending
      </span>
      <span className="flex items-center gap-1">
        <AlertTriangle className="h-3 w-3 text-amber-500" /> Action Required
      </span>
      <span className="flex items-center gap-1">
        <X className="h-3 w-3 text-rose-500" /> Blocked
      </span>
    </div>
  );
};
