import React, { useEffect, useState } from 'react';
import { usePcf } from '../../../context/PcfContext';
import { KpiCard } from '../common/KpiCard';
import { Section } from '../common/Section';
import type { LogisticsLeg } from '../../../types/pcf';
import { fmtNum } from '../../../utils/format';
import { Truck, Route, Gauge, Leaf, Plus, X } from 'lucide-react';
import { toast } from '../../../utils/toast';

const SUBTABS = ['Inbound', 'Internal', 'Outbound'];

interface LogisticsTabProps {
  registerPrimary: (fn: () => void) => void;
}

export function LogisticsTab({ registerPrimary }: LogisticsTabProps) {
  const { legs, addLeg, logisticsInboundKg } = usePcf();
  const [sub, setSub] = useState('Inbound');
  const [addOpen, setAddOpen] = useState(false);
  const [form, setForm] = useState({
    from: '',
    to: '',
    material: 'Raw Cocoa',
    weightT: '',
    distanceKm: '',
    mode: 'Truck',
    basis: 'Tonne-km',
    co2e: '',
    boundary: 'Inbound',
  });

  useEffect(() => {
    registerPrimary(() => setAddOpen(true));
  }, [registerPrimary]);

  const filtered = legs.filter((l) => l.tab === sub);
  const totalDistance = legs.reduce((s, l) => s + l.distanceKm, 0);
  const totalTkm = legs.reduce((s, l) => s + (l.tonneKm || 0), 0);

  const submitAdd = () => {
    const leg: LogisticsLeg = {
      id: `LEG-${String(legs.length + 1).padStart(2, '0')}`,
      tab: form.boundary,
      from: form.from || 'Origin',
      to: form.to || 'Destination',
      material: form.material,
      weightT: Number(form.weightT) || 0,
      distanceKm: Number(form.distanceKm) || 0,
      mode: form.mode,
      vehicle: `${form.mode} (Diesel)`,
      fuel: 'Diesel',
      basis: form.basis,
      tonneKm: (Number(form.weightT) || 0) * (Number(form.distanceKm) || 0),
      ef: 'custom',
      co2e: Number(form.co2e) || 0,
      boundary: form.boundary === 'Outbound' ? 'Out' : 'In',
      evidence: true,
      loadFactor: '—',
      returnTrip: '—',
      tempControlled: 'No',
      carrier: 'Manual',
      distanceSource: 'Manual',
    };
    addLeg(leg);
    setAddOpen(false);
    toast.success(`${leg.id} added — recalculation required.`);
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <KpiCard label="Transport Legs" value={legs.length} icon={Truck} testId="kpi-legs" />
        <KpiCard label="Total Distance" value={`${fmtNum(totalDistance)} km`} icon={Route} testId="kpi-distance" />
        <KpiCard label="Freight Activity" value={`${fmtNum(totalTkm)} t·km`} icon={Gauge} testId="kpi-freight" />
        <KpiCard
          label="Logistics CO₂e (in-boundary)"
          value={`${(logisticsInboundKg / 1000).toFixed(1)} t`}
          accent
          icon={Leaf}
          testId="kpi-logistics-co2e"
        />
      </div>

      {/* subtabs */}
      <div className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white p-1.5 shadow-xs">
        {SUBTABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setSub(tab)}
            data-testid={`subtab-${tab.toLowerCase()}`}
            className={`flex-1 rounded-lg px-3 py-2 text-xs font-bold transition-colors ${
              sub === tab ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            {tab} Transport
          </button>
        ))}
      </div>

      <Section
        title={`${sub} Logistics Legs`}
        testId="section-logistics-table"
        right={
          <button
            onClick={() => setAddOpen(true)}
            data-testid="btn-add-leg"
            className="px-3 py-1.5 bg-[#00E599] hover:bg-[#00c985] text-slate-950 font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
          >
            <Plus className="h-4 w-4" /> Add Transport Leg
          </button>
        }
      >
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/80 text-left text-[11px] uppercase tracking-wider text-slate-400 font-bold">
                {['ID', 'Origin → Destination', 'Material', 'Weight (t)', 'Distance (km)', 'Mode / Vehicle', 'Activity (t·km)', 'EF', 'Emissions (kgCO₂e)', 'Boundary'].map((h) => (
                  <th key={h} className="px-4 py-3 font-bold">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((l) => (
                <tr key={l.id} className="hover:bg-slate-50/60">
                  <td className="px-4 py-3 font-mono font-bold text-slate-900">{l.id}</td>
                  <td className="px-4 py-3 font-bold text-slate-800">
                    {l.from} → {l.to}
                  </td>
                  <td className="px-4 py-3 text-slate-600 font-medium">{l.material}</td>
                  <td className="px-4 py-3 font-bold text-slate-900">{l.weightT} t</td>
                  <td className="px-4 py-3 text-slate-600 font-medium">{fmtNum(l.distanceKm)} km</td>
                  <td className="px-4 py-3 text-slate-600 font-medium">{l.vehicle}</td>
                  <td className="px-4 py-3 font-mono text-slate-600">{fmtNum(l.tonneKm)}</td>
                  <td className="px-4 py-3 font-mono text-slate-500">{l.ef}</td>
                  <td className="px-4 py-3 font-bold text-slate-900">{fmtNum(l.co2e)} kgCO₂e</td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded px-2 py-0.5 text-[10px] font-bold uppercase ${
                        l.boundary === 'In' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {l.boundary === 'In' ? 'In-Boundary' : 'Out-of-Boundary'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      {/* modal */}
      {addOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Add Transport Leg</h3>
              <button onClick={() => setAddOpen(false)} className="p-1 rounded-lg text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold uppercase text-slate-500 block mb-1">Origin</label>
                  <input
                    type="text"
                    placeholder="e.g. Farm"
                    value={form.from}
                    onChange={(e) => setForm({ ...form, from: e.target.value })}
                    className="w-full h-9 rounded-lg border border-slate-200 px-3 text-xs font-semibold focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold uppercase text-slate-500 block mb-1">Destination</label>
                  <input
                    type="text"
                    placeholder="e.g. Plant"
                    value={form.to}
                    onChange={(e) => setForm({ ...form, to: e.target.value })}
                    className="w-full h-9 rounded-lg border border-slate-200 px-3 text-xs font-semibold focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold uppercase text-slate-500 block mb-1">Weight (tonnes)</label>
                  <input
                    type="number"
                    value={form.weightT}
                    onChange={(e) => setForm({ ...form, weightT: e.target.value })}
                    className="w-full h-9 rounded-lg border border-slate-200 px-3 text-xs font-semibold focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold uppercase text-slate-500 block mb-1">Distance (km)</label>
                  <input
                    type="number"
                    value={form.distanceKm}
                    onChange={(e) => setForm({ ...form, distanceKm: e.target.value })}
                    className="w-full h-9 rounded-lg border border-slate-200 px-3 text-xs font-semibold focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold uppercase text-slate-500 block mb-1">Transport Mode</label>
                  <select
                    value={form.mode}
                    onChange={(e) => setForm({ ...form, mode: e.target.value })}
                    className="w-full h-9 rounded-lg border border-slate-200 px-3 text-xs font-semibold focus:outline-none focus:border-emerald-500"
                  >
                    <option value="Truck">Truck</option>
                    <option value="Train">Train</option>
                    <option value="Container Ship">Container Ship</option>
                    <option value="Air Freight">Air Freight</option>
                  </select>
                </div>
                <div>
                  <label className="text-[11px] font-bold uppercase text-slate-500 block mb-1">Emissions (kgCO₂e)</label>
                  <input
                    type="number"
                    value={form.co2e}
                    onChange={(e) => setForm({ ...form, co2e: e.target.value })}
                    className="w-full h-9 rounded-lg border border-slate-200 px-3 text-xs font-semibold focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                onClick={() => setAddOpen(false)}
                className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-800"
              >
                Cancel
              </button>
              <button
                onClick={submitAdd}
                className="px-4 py-2 bg-[#00E599] hover:bg-[#00c985] text-slate-950 font-bold text-xs rounded-xl shadow-xs"
              >
                Save Leg
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
