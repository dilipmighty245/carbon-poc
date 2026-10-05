import React, { useEffect, useState } from 'react';
import { usePcf } from '../../../context/PcfContext';
import { Section } from '../common/Section';
import { StatusChip } from '../common/StatusChip';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
} from 'recharts';
import { fmtNum } from '../../../utils/format';
import { CHART_COLORS } from '../../../data/pcfData';
import { TrendingUp, Layers, Lightbulb, X } from 'lucide-react';
import { toast } from '../../../utils/toast';

const SCENARIO_PRESETS = [
  { id: 'renew', label: 'Grid Electricity → Renewable Electricity', target: 'Energy', reduction: 0.75 },
  { id: 'fuel', label: 'Diesel → Lower Carbon Fuel', target: 'Fuel', reduction: 0.30 },
  { id: 'supplier', label: 'Supplier A → Supplier B', target: 'Raw Materials', reduction: 0.12 },
  { id: 'route', label: 'Current Logistics → Optimised Route', target: 'Logistics', reduction: 0.22 },
  { id: 'pack', label: 'Current Packaging → Recycled Packaging', target: 'Packaging', reduction: 0.40 },
];

interface HotspotsTabProps {
  registerPrimary: (fn: () => void) => void;
}

export function HotspotsTab({ registerPrimary }: HotspotsTabProps) {
  const { categoryTotals, officialTotalKg, scenarios, addScenario } = usePcf();
  const [scOpen, setScOpen] = useState(false);
  const [preset, setPreset] = useState(SCENARIO_PRESETS[0].id);
  const [intensityCut, setIntensityCut] = useState(75);

  useEffect(() => {
    registerPrimary(() => setScOpen(true));
  }, [registerPrimary]);

  const cats = Object.entries(categoryTotals).sort((a, b) => b[1] - a[1]);

  const hotspotRows = cats.map(([name, kg]) => ({
    source: name,
    kg,
    pct: (kg / officialTotalKg) * 100,
    dq: name === 'Raw Materials' ? 88 : name === 'Waste' ? 84 : 92,
    trend: name === 'Raw Materials' ? 'up' : name === 'Energy' ? 'down' : 'flat',
    opportunity: SCENARIO_PRESETS.find((s) => s.target === name)?.label.split(' → ')[1] || '—',
  }));

  const createScenario = () => {
    const p = SCENARIO_PRESETS.find((s) => s.id === preset) || SCENARIO_PRESETS[0];
    const targetKg = categoryTotals[p.target] || 0;
    const savedKg = Math.round(targetKg * (intensityCut / 100));
    const scenarioTotal = officialTotalKg - savedKg;
    const newIntensity = +(scenarioTotal / 100000).toFixed(2);

    addScenario({
      id: `SC-${Date.now().toString().slice(-4)}`,
      label: p.label,
      target: p.target,
      reductionPct: intensityCut,
      savedKg,
      newTotalKg: scenarioTotal,
      newIntensity,
    });
    setScOpen(false);
    toast.success(`Scenario created — saved ${(savedKg / 1000).toFixed(1)} tCO₂e!`);
  };

  return (
    <div className="space-y-6">
      {/* Pareto Drivers */}
      <Section title="Key Emission Hotspots (Pareto Breakdown)" testId="section-hotspots-table">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/80 text-left text-[11px] uppercase tracking-wider text-slate-400 font-bold">
                {['Hotspot Category', 'Emissions (kgCO₂e)', 'Footprint Share %', 'Data Quality', 'Primary Opportunity'].map((h) => (
                  <th key={h} className="px-4 py-3 font-bold">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {hotspotRows.map((h, i) => (
                <tr key={h.source} className={i < 2 ? 'bg-amber-50/20 font-bold' : ''}>
                  <td className="px-4 py-3 text-slate-900 flex items-center gap-2">
                    {i < 2 && <StatusChip status="HOTSPOT" tone="amber" />}
                    <span>{h.source}</span>
                  </td>
                  <td className="px-4 py-3 text-slate-900">{fmtNum(h.kg)} kgCO₂e</td>
                  <td className="px-4 py-3 font-mono font-bold text-emerald-700">{h.pct.toFixed(1)}%</td>
                  <td className="px-4 py-3 font-bold text-slate-700">{h.dq}/100</td>
                  <td className="px-4 py-3 text-slate-600 font-medium">{h.opportunity}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      {/* Scenarios matrix */}
      <Section
        title="Decarbonisation Scenarios & What-If Simulations"
        testId="section-scenarios"
        right={
          <button
            onClick={() => setScOpen(true)}
            data-testid="btn-add-scenario"
            className="px-3 py-1.5 bg-[#00E599] hover:bg-[#00c985] text-slate-950 font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
          >
            <Lightbulb className="h-4 w-4" /> Simulate New Scenario
          </button>
        }
      >
        {scenarios.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-500 font-medium">
            No active scenarios simulated yet. Click "Simulate New Scenario" to model renewable energy, low-carbon fuels, or supplier shifts.
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {scenarios.map((sc) => (
              <div key={sc.id} className="rounded-2xl border border-emerald-500/30 bg-emerald-50/30 p-5 shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900">{sc.label}</span>
                  <StatusChip status="SIMULATED" tone="green" />
                </div>
                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div>
                    <span className="text-[10px] uppercase text-slate-400 font-bold block">Emissions Saved</span>
                    <span className="text-base font-extrabold text-emerald-600">{(sc.savedKg / 1000).toFixed(1)} tCO₂e</span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase text-slate-400 font-bold block">New PCF Intensity</span>
                    <span className="text-base font-extrabold text-slate-900">{sc.newIntensity} kg/kg</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Section>

      {/* Scenario modal */}
      {scOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Simulate Decarbonisation Scenario</h3>
              <button onClick={() => setScOpen(false)} className="p-1 rounded-lg text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-3 text-xs">
              <div>
                <label className="text-[11px] font-bold uppercase text-slate-500 block mb-1">Select Scenario Preset</label>
                <select
                  value={preset}
                  onChange={(e) => setPreset(e.target.value)}
                  className="w-full h-9 rounded-lg border border-slate-200 px-3 text-xs font-semibold focus:outline-none focus:border-emerald-500"
                >
                  {SCENARIO_PRESETS.map((sp) => (
                    <option key={sp.id} value={sp.id}>
                      {sp.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-[11px] font-bold uppercase text-slate-500">Target Category Reduction</label>
                  <span className="font-bold text-emerald-600">{intensityCut}%</span>
                </div>
                <input
                  type="range"
                  min="5"
                  max="100"
                  value={intensityCut}
                  onChange={(e) => setIntensityCut(Number(e.target.value))}
                  className="w-full accent-emerald-500"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                onClick={() => setScOpen(false)}
                className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-800"
              >
                Cancel
              </button>
              <button
                onClick={createScenario}
                className="px-4 py-2 bg-[#00E599] hover:bg-[#00c985] text-slate-950 font-bold text-xs rounded-xl shadow-xs"
              >
                Apply Simulation
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
