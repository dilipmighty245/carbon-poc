import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronDown, ChevronRight, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { useMrv } from '../../../../context/MrvContext';
import { CALC_LINES, CHECK_ENGINE } from '../../../../data/mrvMockData';
import { Kpi, StatusBadge, SectionCard, Field, RefLink } from '../shared';
import type { CalculationLineItem } from '../../../../types/mrv';

const SCOPES = ["Scope 1", "Scope 2", "Scope 3"];

export const CalculationReviewTab: React.FC = () => {
  const navigate = useNavigate();
  const { meta, engagement } = useMrv();
  const [open, setOpen] = useState<Record<string, boolean>>({ "Scope 2": true });
  const [sel, setSel] = useState<CalculationLineItem | null>(null);

  const passed = CHECK_ENGINE.filter((c) => c.status === "PASS").length;

  return (
    <div className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Kpi testid="kpi-claimed-pcf" label="Claimed PCF" value={`${meta.claimedIntensity} kgCO2e/kg`} />
        <Kpi testid="kpi-total-footprint" label="Total Footprint" value={`${meta.claimedTotal} tCO2e`} />
        <Kpi testid="kpi-calc-version" label="Calculation Version" value="V1.0" />
        <Kpi testid="kpi-checks" label="Checks Passed" value={`${passed + 45}/49`} tone={passed + 45 === 49 ? "green" : "amber"} />
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        <SectionCard
          title="Calculation Tree"
          className="lg:col-span-2"
          testid="calc-tree"
          action={<StatusBadge status={engagement.planApproved ? "CALCULATION REVIEW COMPLETE" : "IN REVIEW"} />}
        >
          <div className="mb-3 rounded-xl bg-emerald-50 p-3">
            <p className="text-xs font-bold uppercase tracking-wide text-emerald-700">PCF Total</p>
            <p className="text-2xl font-extrabold text-emerald-800">{meta.claimedTotal} tCO2e</p>
          </div>
          {SCOPES.map((scope) => {
            const lines = CALC_LINES.filter((l) => l.scope === scope);
            const sum = lines.reduce((s, l) => s + l.co2e, 0);
            const isOpen = open[scope];
            return (
              <div key={scope} className="border-b border-slate-100 last:border-0">
                <button
                  onClick={() => setOpen((o) => ({ ...o, [scope]: !o[scope] }))}
                  className="flex w-full items-center justify-between py-3 text-left"
                >
                  <span className="flex items-center gap-2 font-bold text-slate-800 text-xs">
                    {isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}{scope}
                  </span>
                  <span className="text-xs font-semibold text-slate-500">{sum.toFixed(2)} tCO2e</span>
                </button>
                {isOpen && (
                  <div className="pb-2 pl-6 space-y-1">
                    {lines.map((l) => (
                      <button
                        key={l.id}
                        onClick={() => setSel(l)}
                        className="flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-left text-xs hover:bg-slate-50 transition-colors"
                      >
                        <span className="flex items-center gap-2">
                          <span className="font-mono text-xs font-semibold text-emerald-700">{l.id}</span>
                          <span className="text-slate-600">{l.category} · {l.activity}</span>
                          {l.status === "QUERY" && <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />}
                        </span>
                        <span className="font-semibold text-slate-700">{l.co2e.toFixed(2)} t</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </SectionCard>

        <SectionCard title="Check Engine" testid="check-engine">
          <div className="space-y-1.5">
            {CHECK_ENGINE.map((c) => (
              <div
                key={c.name}
                className={`flex items-start gap-2 rounded-lg px-3 py-2 text-xs ${
                  c.status === "FAIL" ? "bg-red-50 text-red-700" : "bg-slate-50 text-slate-700"
                }`}
              >
                {c.status === "PASS" ? (
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                ) : (
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-red-600" />
                )}
                <div>
                  <p className="font-semibold">{c.name}</p>
                  {c.detail && <p className="text-[11px] text-red-600 mt-0.5">{c.detail}</p>}
                </div>
              </div>
            ))}
          </div>
        </SectionCard>
      </div>

      <SectionCard title="Calculation Review Lines" testid="calc-review-table">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-left text-xs font-bold uppercase tracking-wide text-slate-400">
                {["Calc ID", "Category", "Activity", "Qty", "Unit", "Emission Factor", "Source", "Alloc", "CO2e (t)", "Evidence", "Status"].map((h) => (
                  <th key={h} className="py-2.5 pr-3">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {CALC_LINES.map((l) => (
                <tr key={l.id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                  <td className="py-3 pr-3"><RefLink id={l.id} onClick={() => setSel(l)} /></td>
                  <td className="py-3 pr-3 text-slate-600">{l.category}</td>
                  <td className="py-3 pr-3 text-slate-600">{l.activity}</td>
                  <td className="py-3 pr-3 text-slate-600">{l.qty.toLocaleString()}</td>
                  <td className="py-3 pr-3 text-slate-500">{l.unit}</td>
                  <td className="py-3 pr-3 text-slate-600">{l.ef}</td>
                  <td className="py-3 pr-3 text-slate-500">{l.efSource}</td>
                  <td className="py-3 pr-3 text-slate-500">{l.allocation}</td>
                  <td className="py-3 pr-3 font-semibold text-slate-800">{l.co2e.toFixed(2)}</td>
                  <td className="py-3 pr-3">{l.evidence !== "—" ? <RefLink id={l.evidence} onClick={() => navigate("/mrv/evidence")} /> : "—"}</td>
                  <td className="py-3 pr-3"><StatusBadge status={l.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SectionCard>

      {/* Detail Modal */}
      {sel && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex justify-end z-50">
          <div className="bg-white w-full max-w-lg h-full p-6 overflow-y-auto space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-base">{sel.id} · {sel.category}</h3>
              <button onClick={() => setSel(null)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>
            <div className="bg-slate-50 p-4 rounded-xl space-y-2 text-xs">
              <Field label="Scope" value={sel.scope} />
              <Field label="Activity" value={sel.activity} />
              <Field label="Calculated Result" value={`${sel.co2e.toFixed(2)} tCO2e`} />
              <Field label="Formula Basis" value={`${sel.qty.toLocaleString()} ${sel.unit} × ${sel.ef}`} />
              <Field label="Emission Factor Source" value={sel.efSource} />
              <Field label="Evidence Reference" value={sel.evidence} mono />
            </div>
            {sel.comment && (
              <div className="p-3 bg-amber-50 border border-amber-100 rounded-xl text-xs text-amber-800">
                {sel.comment}
              </div>
            )}
            <div className="pt-4 flex justify-end">
              <button
                onClick={() => setSel(null)}
                className="px-4 py-2 bg-slate-900 text-white font-bold text-xs rounded-xl"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
