import React, { ReactNode } from 'react';

interface SectionProps {
  title?: string;
  desc?: string;
  right?: ReactNode;
  children: ReactNode;
  className?: string;
  testId?: string;
}

export function Section({ title, desc, right, children, className = '', testId }: SectionProps) {
  return (
    <div data-testid={testId} className={`rounded-2xl border border-slate-200 bg-white shadow-xs ${className}`}>
      {(title || right) && (
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <div>
            {title && <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900">{title}</h3>}
            {desc && <p className="mt-0.5 text-xs text-slate-500 font-medium">{desc}</p>}
          </div>
          {right}
        </div>
      )}
      <div className="p-6">{children}</div>
    </div>
  );
}

interface FieldProps {
  label: string;
  children: ReactNode;
  hint?: string;
}

export function Field({ label, children, hint }: FieldProps) {
  return (
    <div className="space-y-1.5">
      <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">{label}</label>
      {children}
      {hint && <p className="text-[11px] text-slate-400 font-medium">{hint}</p>}
    </div>
  );
}

interface ReadValueProps {
  value: string | number;
}

export function ReadValue({ value }: ReadValueProps) {
  return (
    <div className="flex h-9 items-center rounded-lg border border-slate-200 bg-slate-50/80 px-3 text-xs font-semibold text-slate-900">
      {value}
    </div>
  );
}
