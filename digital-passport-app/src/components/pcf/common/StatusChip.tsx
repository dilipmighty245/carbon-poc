import React from 'react';

const STYLES: Record<string, string> = {
  green: 'bg-emerald-50 text-emerald-700 border-emerald-200/80',
  amber: 'bg-amber-50 text-amber-800 border-amber-200/80',
  red: 'bg-rose-50 text-rose-700 border-rose-200/80',
  blue: 'bg-sky-50 text-sky-700 border-sky-200/80',
  slate: 'bg-slate-100 text-slate-700 border-slate-200/80',
  navy: 'bg-slate-900 text-white border-slate-900',
};

const TONE: Record<string, string> = {
  'DRAFT': 'slate', 'Draft': 'slate',
  'DATA COLLECTION': 'blue',
  'DATA COMPLETE': 'blue',
  'CALCULATION READY': 'blue', 'Calculation Ready': 'blue',
  'CALCULATED': 'green', 'Calculated': 'green',
  'REVIEW': 'amber',
  'VERIFICATION READY': 'green', 'Ready': 'green',
  'SUBMITTED': 'amber', 'Submitted': 'amber',
  'Awaiting Verification': 'amber', 'Pending': 'amber',
  'VERIFIED': 'green', 'Verified': 'green',
  'LOCKED': 'navy',
  'CHANGE DETECTED': 'amber',
  'RECALCULATION REQUIRED': 'red',
  'RECONCILED': 'green',
  'ALLOCATION MISMATCH': 'red',
  'In': 'green', 'Out': 'slate',
  'Validated': 'green', 'Warning': 'amber', 'Info': 'blue',
  'High': 'red', 'Medium': 'amber', 'Low': 'slate', 'Excluded': 'slate',
};

interface StatusChipProps {
  status: string;
  tone?: string;
  className?: string;
  testId?: string;
}

export function StatusChip({ status, tone, className = '', testId }: StatusChipProps) {
  const t = tone || TONE[status] || 'slate';
  const styleClass = STYLES[t] || STYLES.slate;
  return (
    <span
      data-testid={testId}
      className={`inline-flex items-center gap-1 rounded-md border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${styleClass} ${className}`}
    >
      {status}
    </span>
  );
}
