import React, { useEffect, useState } from 'react';
import { usePcf } from '../../../context/PcfContext';
import { KpiCard } from '../common/KpiCard';
import { Section } from '../common/Section';
import { StatusChip } from '../common/StatusChip';
import { DataQualityPanel } from '../common/DataQualityPanel';
import {
  PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend,
} from 'recharts';
import { fmtNum } from '../../../utils/format';
import { CHART_COLORS, SCOPE_COLORS } from '../../../data/pcfData';
import { ChevronRight, ChevronDown, Leaf, Factory, Gauge, AlertTriangle, X } from 'lucide-react';
import { toast } from '../../../utils/toast';

interface CalculationTabProps {
  registerPrimary: (fn: () => void) => void;
}

export function CalculationTab({ registerPrimary }: CalculationTabProps) {
  const {
    activities, legs, categoryTotals, scopeTotals, officialTotalKg, officialIntensity,
    liveTotalKg, liveIntensity, recalcRequired, recalculate, versions,
  } = usePcf();

  const [expanded, setExpanded] = useState<Record<string, boolean>>({ 'Raw Materials': true });
  const [dqOpen, setDqOpen] = useState(false);
  const [formulaOpen, setFormulaOpen] = useState(false);

  useEffect(() => {
    registerPrimary(() => {
      const v = recalculate();
      toast.success(`Recalculated — created ${v.version} (${(v.totalKg / 1000).toFixed(1)} tCO₂e).`);
    });
  }, [registerPrimary, recalculate]);

  const categories = Object.entries(categoryTotals).sort((a, b) => b[1] - a[1]);
  const scopeData = Object.entries(scopeTotals).map(([k, v]) => ({ name: k, value: v }));
  const barData = categories.map(([name, kg]) => ({ name, tCO2e: +(kg / 1000).toFixed(1) }));

  return (
    <div className="space-y-6">
      {recalcRequired && (
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-rose-200 bg-rose-50/80 p-4" data-testid="recalc-banner">
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-rose-600 shrink-0" />
            <div>
              <div className="flex items-center gap-2">
                <StatusChip status="CHANGE DETECTED" tone="amber" />
                <StatusChip status="RECALCULATION REQUIRED" tone="red" />
              </div>
              <p className="mt-1 text-xs text-slate-600 font-medium">
                Live inventory total is <b className="font-bold text-slate-900">{(liveTotalKg / 1000).toFixed(1)} t</b> vs official <b className="font-bold text-slate-900">{(officialTotalKg / 1000).toFixed(1)} t</b>. Recalculate to create a new version.
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              const v = recalculate();
              toast.success(`Created ${v.version}.`);
            }}
            data-testid="btn-recalc-inline"
            className="px-4 py-2 bg-[#00E599] hover:bg-[#00c985] text-slate-950 font-bold text-xs rounded-xl shadow-xs"
          >
            Recalculate PCF
          </button>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
        <KpiCard label="Total PCF (Official)" value={`${(officialTotalKg / 1000).toFixed(1)} t`} sub={`${fmtNum(officialTotalKg)} kgCO₂e`} icon={Leaf} testId="kpi-official-total" />
        <KpiCard label="PCF Intensity" value={`${officialIntensity}`} sub="kgCO₂e / kg product" accent icon={Factory} testId="kpi-intensity" />
        <KpiCard label="Live Total (Draft)" value={`${(liveTotalKg / 1000).toFixed(1)} t`} sub={`Intensity: ${liveIntensity}`} icon={Leaf} testId="kpi-live-total" />
        <KpiCard label="Calculation Version" value={versions[0]?.version || 'V1.0'} sub={versions[0]?.calculatedAt} icon={Gauge} testId="kpi-version" />
        <KpiCard label="Data Quality Score" value="92 / 100" sub="High confidence" accent icon={Gauge} onClick={() => setDqOpen(true)} testId="kpi-dq-calc" />
      </div>

      {/* Visual charts */}
      <div className="grid gap-6 md:grid-cols-2">
        <Section title="Scope 1 / 2 / 3 Breakdown" testId="section-scope-chart">
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={scopeData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={(e) => `${e.name}: ${(e.value / 1000).toFixed(1)}t`}>
                  {scopeData.map((entry) => (
                    <Cell key={entry.name} fill={SCOPE_COLORS[entry.name] || '#64748b'} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => [`${fmtNum(value)} kgCO₂e`, 'Emissions']} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Section>

        <Section title="Emissions by Lifecycle Category" testId="section-cat-chart">
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData} layout="vertical" margin={{ left: 30 }}>
                <XAxis type="number" unit=" t" tick={{ fontSize: 11 }} />
                <YAxis dataKey="name" type="category" tick={{ fontSize: 11 }} width={90} />
                <Tooltip formatter={(val: number) => [`${val} tCO₂e`, 'Emissions']} />
                <Bar dataKey="tCO2e" radius={[0, 4, 4, 0]}>
                  {barData.map((entry, index) => (
                    <Cell key={entry.name} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Section>
      </div>

      {/* Category breakdown accordion */}
      <Section
        title="Category Calculation Details"
        testId="section-calc-tree"
        right={
          <button
            onClick={() => setFormulaOpen(true)}
            className="px-3 py-1.5 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs rounded-xl shadow-xs"
          >
            View Formula Logic
          </button>
        }
      >
        <div className="space-y-3">
          {categories.map(([catName, catKg]) => {
            const isOpen = expanded[catName];
            const pct = ((catKg / liveTotalKg) * 100).toFixed(1);
            return (
              <div key={catName} className="rounded-xl border border-slate-200 bg-slate-50/60 overflow-hidden">
                <button
                  onClick={() => setExpanded({ ...expanded, [catName]: !isOpen })}
                  className="w-full p-4 flex items-center justify-between text-left hover:bg-slate-100/60 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    {isOpen ? <ChevronDown className="w-4 h-4 text-slate-500" /> : <ChevronRight className="w-4 h-4 text-slate-500" />}
                    <span className="font-bold text-xs text-slate-900">{catName}</span>
                    <span className="text-xs font-mono font-bold text-emerald-600 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md">
                      {pct}%
                    </span>
                  </div>
                  <span className="font-bold text-xs text-slate-900">{fmtNum(catKg)} kgCO₂e</span>
                </button>

                {isOpen && (
                  <div className="p-4 border-t border-slate-200 bg-white space-y-2 text-xs">
                    <p className="text-slate-500 font-medium">Included activity records for {catName}:</p>
                    <div className="divide-y divide-slate-100">
                      {activities
                        .filter((a) => a.category === catName)
                        .map((a) => (
                          <div key={a.id} className="py-2 flex items-center justify-between">
                            <span className="font-bold text-slate-800">{a.activity}</span>
                            <div className="flex items-center gap-4 text-slate-600 font-medium">
                              <span>{fmtNum(a.quantity)} {a.unit}</span>
                              <span className="font-mono text-slate-400">× {a.ef}</span>
                              <span className="font-bold text-slate-900">{fmtNum(a.co2e)} kgCO₂e</span>
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </Section>

      {/* Formula modal */}
      {formulaOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">GHG Protocol Calculation Logic</h3>
              <button onClick={() => setFormulaOpen(false)} className="p-1 rounded-lg text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-3 text-xs text-slate-700 font-medium">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 font-mono text-[11px]">
                PCF Intensity = Σ (Activity Quantity × Emission Factor) / Production Batch Quantity
              </div>
              <p>
                Calculations adhere strictly to ISO 14067 and the GHG Protocol Product Life Cycle Accounting and Reporting Standard using GWP100 AR6 values.
              </p>
            </div>
            <div className="flex justify-end pt-2">
              <button
                onClick={() => setFormulaOpen(false)}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-xs"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      <DataQualityPanel open={dqOpen} onOpenChange={setDqOpen} />
    </div>
  );
}
