import React, { useEffect } from 'react';
import { usePcf } from '../../../context/PcfContext';
import { Section, Field, ReadValue } from '../common/Section';
import { StatusChip } from '../common/StatusChip';
import { CheckCircle2 } from 'lucide-react';
import { toast } from '../../../utils/toast';

interface OutputDefinitionTabProps {
  registerPrimary: (fn: () => void) => void;
}

export function OutputDefinitionTab({ registerPrimary }: OutputDefinitionTabProps) {
  const { project, setActiveTab } = usePcf();

  useEffect(() => {
    registerPrimary(() => toast.success('Output definition saved.'));
  }, [registerPrimary]);

  const completeness = [
    'Product identity',
    'Functional unit',
    'Production quantity',
    'Assessment period',
    'Methodology',
  ];

  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-2">
        <Section title="1 · Product Identity" testId="section-product-identity">
          <div className="grid grid-cols-2 gap-4">
            <Field label="Product Name">
              <ReadValue value={project.product} />
            </Field>
            <Field label="Product Code">
              <ReadValue value={project.productCode} />
            </Field>
            <Field label="Batch">
              <ReadValue value={project.batch} />
            </Field>
            <Field label="Product Category">
              <ReadValue value={project.productCategory} />
            </Field>
            <Field label="Facility">
              <ReadValue value={project.facility} />
            </Field>
            <Field label="Country">
              <ReadValue value={project.country} />
            </Field>
            <Field label="Production Date">
              <ReadValue value={project.productionDate} />
            </Field>
            <Field label="Destination Market">
              <ReadValue value={project.destinationMarket} />
            </Field>
            <Field label="CN / HS Commodity Code">
              <input
                type="text"
                defaultValue={project.hsCode}
                data-testid="input-hscode"
                className="w-full h-9 rounded-lg border border-slate-200 px-3 text-xs font-semibold text-slate-900 focus:outline-none focus:border-emerald-500"
              />
            </Field>
            <Field label="Customer (optional)">
              <input
                type="text"
                defaultValue=""
                placeholder="—"
                data-testid="input-customer"
                className="w-full h-9 rounded-lg border border-slate-200 px-3 text-xs font-semibold text-slate-900 focus:outline-none focus:border-emerald-500"
              />
            </Field>
          </div>
        </Section>

        <Section title="2 · Declared / Functional Unit" testId="section-functional-unit">
          <div className="grid grid-cols-2 gap-4">
            <Field label="Declared Unit">
              <input
                type="text"
                defaultValue="1 kg"
                data-testid="input-declared-qty"
                className="w-full h-9 rounded-lg border border-slate-200 px-3 text-xs font-semibold text-slate-900 focus:outline-none focus:border-emerald-500"
              />
            </Field>
            <Field label="Unit Basis">
              <select
                defaultValue="kg"
                data-testid="select-unit-basis"
                className="w-full h-9 rounded-lg border border-slate-200 px-3 text-xs font-semibold text-slate-900 focus:outline-none focus:border-emerald-500"
              >
                <option value="kg">kg {project.product}</option>
                <option value="t">tonne {project.product}</option>
                <option value="unit">Packaging Unit ({project.packagingUnit})</option>
              </select>
            </Field>
            <Field label="Batch Production">
              <ReadValue value={`${project.productionQuantity.toLocaleString()} kg`} />
            </Field>
            <Field label="Packaging Unit">
              <ReadValue value={project.packagingUnit} />
            </Field>
            <Field label="Product Grade">
              <ReadValue value={project.productGrade} />
            </Field>
          </div>
          <div className="mt-4 rounded-xl border border-emerald-200/80 bg-emerald-50/60 px-3.5 py-2.5 text-xs font-medium text-emerald-900">
            <span className="font-bold text-emerald-800">Declared unit:</span> {project.declaredUnit}
          </div>
        </Section>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Section title="3 · Assessment Period & Standards" testId="section-standards">
          <div className="grid grid-cols-2 gap-4">
            <Field label="Reporting Period">
              <ReadValue value={project.reportingPeriod} />
            </Field>
            <Field label="Methodology">
              <ReadValue value={project.methodology} />
            </Field>
            <Field label="GWP Basis">
              <ReadValue value={project.gwpBasis} />
            </Field>
            <Field label="EF Dataset">
              <ReadValue value={project.efDataset} />
            </Field>
          </div>
        </Section>

        <Section title="Completeness Checklist" testId="section-checklist">
          <div className="space-y-2">
            {completeness.map((item) => (
              <div key={item} className="flex items-center gap-2.5 rounded-lg border border-slate-100 bg-slate-50/70 px-3.5 py-2 text-xs font-semibold text-slate-800">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                <span>{item}</span>
                <span className="ml-auto text-[10px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md">COMPLETE</span>
              </div>
            ))}
          </div>

          <div className="mt-5 flex justify-end">
            <button
              onClick={() => {
                toast.success('Output definition confirmed.');
                setActiveTab('boundary');
              }}
              className="px-4 py-2 bg-[#00E599] hover:bg-[#00c985] text-slate-950 font-bold text-xs rounded-xl shadow-xs transition-colors"
            >
              Proceed to Boundary →
            </button>
          </div>
        </Section>
      </div>
    </div>
  );
}
