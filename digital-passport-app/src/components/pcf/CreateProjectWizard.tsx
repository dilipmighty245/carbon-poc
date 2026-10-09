import React, { useState, useEffect } from 'react';
import { Check, X } from 'lucide-react';
import { toast } from '../../utils/toast';
import { getOrgFacilities } from '../../api/client';

const STEPS = [
  'Organisation', 'Facility', 'Product', 'Batch', 'Reporting Period',
  'PCF Methodology', 'Declared / Functional Unit', 'Boundary', 'Review', 'Create',
];

const DEFAULTS = {
  organisation: 'Asante Cocoa Cooperative',
  facility: 'Tema Processing Plant',
  product: 'Refined Cocoa Butter',
  batch: 'CB-2026-001',
  period: 'FY 2026',
  methodology: 'GHG Protocol Product Standard (ISO 14067)',
  unit: '1 kg Refined Cocoa Butter',
  boundary: 'Cradle-to-Gate',
};

interface CreateProjectWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateProjectWizard({ open, onOpenChange }: CreateProjectWizardProps) {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState(DEFAULTS);
  const [facilityOptions, setFacilityOptions] = useState<string[]>([]);

  useEffect(() => {
    getOrgFacilities()
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          const names = data.map((f: any) => f.name || 'Unnamed Facility');
          setFacilityOptions(names);
          if (names[0]) setForm((prev) => ({ ...prev, facility: names[0] }));
        }
      })
      .catch((err) => console.warn('Failed to fetch facilities for wizard:', err));
  }, []);

  if (!open) return null;

  const set = (k: keyof typeof DEFAULTS, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const close = () => {
    onOpenChange(false);
    setTimeout(() => setStep(0), 200);
  };
  const next = () => setStep((s) => Math.min(s + 1, STEPS.length - 1));
  const back = () => setStep((s) => Math.max(s - 1, 0));
  const create = () => {
    toast.success('PCF project created (simulated). Opening PCF-GH-2026-001.');
    close();
  };

  const Sel = ({ k, options }: { k: keyof typeof DEFAULTS; options: string[] }) => (
    <select
      value={form[k]}
      onChange={(e) => set(k, e.target.value)}
      data-testid={`wizard-select-${k}`}
      className="w-full h-10 rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-800 focus:outline-none focus:border-emerald-500 shadow-xs"
    >
      {options.map((o) => (
        <option key={o} value={o}>
          {o}
        </option>
      ))}
    </select>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
      <div className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-xl border border-slate-200 space-y-5 animate-in fade-in zoom-in-95 duration-150" data-testid="create-project-wizard">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h3 className="text-base font-bold text-slate-900">Create PCF Project</h3>
          <button onClick={close} className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* step rail */}
        <div className="flex flex-wrap gap-1.5">
          {STEPS.map((s, i) => (
            <div
              key={s}
              className={`flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-bold ${
                i === step
                  ? 'border-emerald-500 bg-emerald-50 text-emerald-800'
                  : i < step
                  ? 'border-emerald-200 text-emerald-600'
                  : 'border-slate-200 text-slate-400'
              }`}
            >
              <span className="flex h-4 w-4 items-center justify-center rounded-full bg-white text-[10px] font-bold">
                {i < step ? <Check className="h-3 w-3 text-emerald-600" /> : i + 1}
              </span>
              <span>{s}</span>
            </div>
          ))}
        </div>

        <div className="min-h-[180px] py-2">
          {step === 0 && (
            <Field label="Select Organisation">
              <Sel k="organisation" options={['Asante Cocoa Cooperative', 'Kumasi Growers Union', 'Volta Cocoa Ltd']} />
            </Field>
          )}
          {step === 1 && (
            <Field label="Select Facility">
              <Sel k="facility" options={facilityOptions} />
            </Field>
          )}
          {step === 2 && (
            <Field label="Select Product">
              <Sel k="product" options={['Refined Cocoa Butter', 'Natural Cocoa Powder', 'Cocoa Liquor']} />
            </Field>
          )}
          {step === 3 && (
            <Field label="Select Batch">
              <Sel k="batch" options={['CB-2026-001', 'CB-2026-002', 'CB-2026-003']} />
            </Field>
          )}
          {step === 4 && (
            <Field label="Select Reporting Period">
              <Sel k="period" options={['FY 2026', 'FY 2025']} />
            </Field>
          )}
          {step === 5 && (
            <Field label="Select PCF Methodology">
              <Sel k="methodology" options={['GHG Protocol Product Standard (ISO 14067)', 'PAS 2050', 'PEF (Product Environmental Footprint)']} />
            </Field>
          )}
          {step === 6 && (
            <div className="space-y-3">
              <Field label="Declared / Functional Unit">
                <input
                  type="text"
                  value={form.unit}
                  onChange={(e) => set('unit', e.target.value)}
                  data-testid="wizard-unit-input"
                  className="w-full h-10 rounded-xl border border-slate-200 px-3 text-xs font-semibold text-slate-900 focus:outline-none focus:border-emerald-500"
                />
              </Field>
              <p className="text-xs text-slate-500 font-medium">Batch production: 100,000 kg · Packaging unit: 25 kg carton</p>
            </div>
          )}
          {step === 7 && (
            <Field label="Choose Boundary">
              <Sel k="boundary" options={['Cradle-to-Gate', 'Gate-to-Gate', 'Cradle-to-Grave', 'Custom']} />
            </Field>
          )}
          {step === 8 && (
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <h4 className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-900">Review</h4>
              <dl className="grid grid-cols-2 gap-x-6 gap-y-2 text-xs font-medium">
                {Object.entries({
                  Organisation: form.organisation,
                  Facility: form.facility,
                  Product: form.product,
                  Batch: form.batch,
                  Period: form.period,
                  Methodology: form.methodology,
                  'Declared Unit': form.unit,
                  Boundary: form.boundary,
                }).map(([k, v]) => (
                  <div key={k}>
                    <dt className="text-[10px] uppercase text-slate-400 font-bold">{k}</dt>
                    <dd className="font-bold text-slate-900">{v}</dd>
                  </div>
                ))}
              </dl>
            </div>
          )}
          {step === 9 && (
            <div className="flex flex-col items-center justify-center py-6 text-center">
              <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100">
                <Check className="h-6 w-6 text-emerald-600" />
              </div>
              <p className="text-sm font-bold text-slate-900">Ready to create</p>
              <p className="mt-1 text-xs text-slate-500 font-medium">
                A new PCF project will be initialised for {form.product} · {form.batch}.
              </p>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between border-t border-slate-100 pt-4">
          <button
            type="button"
            onClick={close}
            data-testid="wizard-cancel"
            className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-800"
          >
            Cancel
          </button>
          <div className="flex gap-2">
            {step > 0 && (
              <button
                type="button"
                onClick={back}
                data-testid="wizard-back"
                className="px-4 py-2 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-xl shadow-xs"
              >
                Back
              </button>
            )}
            {step < STEPS.length - 1 ? (
              <button
                type="button"
                onClick={next}
                data-testid="wizard-next"
                className="px-4 py-2 bg-[#00E599] hover:bg-[#00c985] text-slate-950 text-xs font-bold rounded-xl shadow-xs"
              >
                Continue
              </button>
            ) : (
              <button
                type="button"
                onClick={create}
                data-testid="wizard-create"
                className="px-4 py-2 bg-[#00E599] hover:bg-[#00c985] text-slate-950 text-xs font-bold rounded-xl shadow-xs"
              >
                Create Project
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">{label}</label>
      {children}
    </div>
  );
}
