import React, { useEffect, useState } from 'react';
import { usePcf } from '../../../context/PcfContext';
import { KpiCard } from '../common/KpiCard';
import { Section } from '../common/Section';
import { StatusChip } from '../common/StatusChip';
import { DataQualityPanel } from '../common/DataQualityPanel';
import { ActivityDrawer } from '../ActivityDrawer';
import type { ActivityRecord } from '../../../types/pcf';
import { VALIDATION_ISSUES } from '../../../data/pcfData';
import { fmtNum } from '../../../utils/format';
import { Database, Cpu, FileCheck2, Gauge, AlertCircle, Plus, Upload, X } from 'lucide-react';
import { toast } from '../../../utils/toast';

const BADGE_TONE: Record<string, string> = {
  'SATTRIC+': 'bg-purple-100 text-purple-700',
  'PAS800': 'bg-sky-100 text-sky-700',
  'ERP': 'bg-slate-200 text-slate-700',
  'SUPPLIER': 'bg-amber-100 text-amber-700',
  'MANUAL': 'bg-rose-100 text-rose-700',
  'API': 'bg-emerald-100 text-emerald-700',
  'CSV': 'bg-indigo-100 text-indigo-700',
};

function SourceBadge({ s }: { s: string }) {
  return (
    <span className={`rounded px-1.5 py-0.5 text-[10px] font-bold uppercase ${BADGE_TONE[s] || 'bg-slate-100 text-slate-600'}`}>
      {s}
    </span>
  );
}

interface InventoryTabProps {
  registerPrimary: (fn: () => void) => void;
  search: string;
}

export function InventoryTab({ registerPrimary, search }: InventoryTabProps) {
  const { activities, addActivity } = usePcf();
  const [selected, setSelected] = useState<ActivityRecord | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [dqOpen, setDqOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [form, setForm] = useState({
    activity: '',
    quantity: '',
    unit: 'kWh',
    scope: 'Scope 2',
    ef: '0.5',
    category: 'Energy',
  });

  useEffect(() => {
    registerPrimary(() => setAddOpen(true));
  }, [registerPrimary]);

  const openRow = (a: ActivityRecord) => {
    setSelected(a);
    setDrawerOpen(true);
  };

  const submitAdd = () => {
    const qty = Number(form.quantity) || 0;
    const efv = Number(form.ef) || 0;
    const rec: ActivityRecord = {
      id: `ACT-${String(activities.length + 1).padStart(3, '0')}`,
      stage: form.category,
      category: form.category,
      activity: form.activity || 'New Activity',
      quantity: qty,
      unit: form.unit,
      scope: form.scope,
      process: 'Manual',
      source: 'MANUAL',
      sourceSystem: 'Manual Entry',
      ef: `${efv} kgCO2e/${form.unit}`,
      efValue: efv,
      factorVersion: 'Manual',
      co2e: Math.round(qty * efv),
      evidence: false,
      quality: 70,
      status: 'Validated',
      facility: 'Tema Processing Plant',
      equipment: '—',
      meter: '—',
      timestamp: new Date().toISOString().slice(0, 10),
      supplier: '—',
      createdBy: 'a.boateng',
      lastUpdated: new Date().toISOString().slice(0, 10),
      provenance: ['Manual Entry', 'Validation', 'Inventory Record'],
    };
    addActivity(rec);
    setAddOpen(false);
    toast.success(`${rec.id} added — recalculation required.`);
  };

  const filtered = activities.filter((a) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return [a.id, a.activity, a.category, a.scope, a.source, a.supplier].some((v) =>
      String(v).toLowerCase().includes(q)
    );
  });

  const pas800Count = activities.filter((a) => a.source === 'PAS800' || a.sourceSystem === 'PAS800').length;
  const erpCount = activities.filter((a) => a.source === 'ERP' || a.source === 'SUPPLIER').length;
  const totalCo2e = activities.reduce((s, a) => s + a.co2e, 0);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <KpiCard label="Inventory Records" value={activities.length} icon={Database} testId="kpi-inventory-records" />
        <KpiCard label="Automated Feeds" value={`${pas800Count + erpCount}`} sub="PAS800 + ERP" icon={Cpu} testId="kpi-automated-feeds" />
        <KpiCard label="Evidence Verified" value="100%" sub="All primary records linked" icon={FileCheck2} testId="kpi-evidence-verified" />
        <KpiCard
          label="Data Quality Score"
          value="92 / 100"
          sub="Click for breakdown"
          accent
          icon={Gauge}
          onClick={() => setDqOpen(true)}
          testId="kpi-dq-score"
        />
      </div>

      {/* action bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Activity Inventory</span>
          <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-bold text-slate-700">
            {filtered.length} items
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setAddOpen(true)}
            data-testid="btn-add-activity"
            className="px-3 py-1.5 bg-[#00E599] hover:bg-[#00c985] text-slate-950 font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
          >
            <Plus className="h-4 w-4" /> Add Activity Record
          </button>
          <button
            onClick={() => toast.info('CSV upload simulation.')}
            data-testid="btn-upload-csv"
            className="px-3 py-1.5 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
          >
            <Upload className="h-4 w-4 text-slate-500" /> Upload CSV
          </button>
        </div>
      </div>

      {/* inventory table */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/80 text-left text-[11px] uppercase tracking-wider text-slate-400 font-bold">
                {[
                  'ID',
                  'Category',
                  'Activity Name',
                  'Scope',
                  'Quantity',
                  'Unit',
                  'Emission Factor',
                  'Factor Dataset',
                  'Calculated CO₂e',
                  'Source',
                  'Quality',
                  'Status',
                ].map((h) => (
                  <th key={h} className="whitespace-nowrap px-4 py-3 font-bold">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((a) => (
                <tr
                  key={a.id}
                  onClick={() => openRow(a)}
                  className="cursor-pointer hover:bg-slate-50/80 transition-colors"
                  data-testid={`row-${a.id}`}
                >
                  <td className="whitespace-nowrap px-4 py-3 font-mono font-bold text-slate-900">{a.id}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-slate-600 font-medium">{a.category}</td>
                  <td className="whitespace-nowrap px-4 py-3 font-bold text-slate-900">{a.activity}</td>
                  <td className="whitespace-nowrap px-4 py-3 font-mono font-bold text-slate-700">{a.scope}</td>
                  <td className="whitespace-nowrap px-4 py-3 font-bold text-slate-900">{fmtNum(a.quantity)}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-slate-500 font-medium">{a.unit}</td>
                  <td className="whitespace-nowrap px-4 py-3 font-mono text-slate-600">{a.ef}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-slate-500 font-medium">{a.factorVersion}</td>
                  <td className="whitespace-nowrap px-4 py-3 font-bold text-slate-900">{fmtNum(a.co2e)} kgCO₂e</td>
                  <td className="whitespace-nowrap px-4 py-3">
                    <SourceBadge s={a.source} />
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 font-bold text-emerald-600">{a.quality}/100</td>
                  <td className="whitespace-nowrap px-4 py-3">
                    <StatusChip status={a.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* validation warnings panel */}
      <Section title="Validation & Evidence Audit" testId="section-validation">
        <div className="space-y-2">
          {VALIDATION_ISSUES.map((v, i) => (
            <div
              key={i}
              className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50/70 px-4 py-2.5 text-xs font-semibold"
            >
              <div className="flex items-center gap-2.5">
                <AlertCircle className="h-4 w-4 text-amber-600 shrink-0" />
                <span className="font-bold text-slate-900">{v.type}</span>
                <span className="text-slate-500">• {v.record}</span>
              </div>
              <span className="text-slate-600 font-medium">{v.detail}</span>
            </div>
          ))}
        </div>
      </Section>

      {/* add modal */}
      {addOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Add Activity Record</h3>
              <button onClick={() => setAddOpen(false)} className="p-1 rounded-lg text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-3 text-xs">
              <div>
                <label className="text-[11px] font-bold uppercase text-slate-500 block mb-1">Activity Name</label>
                <input
                  type="text"
                  placeholder="e.g. Purchased Steam"
                  value={form.activity}
                  onChange={(e) => setForm({ ...form, activity: e.target.value })}
                  className="w-full h-9 rounded-lg border border-slate-200 px-3 text-xs font-semibold focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold uppercase text-slate-500 block mb-1">Category</label>
                  <select
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                    className="w-full h-9 rounded-lg border border-slate-200 px-3 text-xs font-semibold focus:outline-none focus:border-emerald-500"
                  >
                    <option value="Energy">Energy</option>
                    <option value="Fuel">Fuel</option>
                    <option value="Raw Materials">Raw Materials</option>
                    <option value="Packaging">Packaging</option>
                    <option value="Process Emissions">Process Emissions</option>
                    <option value="Waste">Waste</option>
                  </select>
                </div>
                <div>
                  <label className="text-[11px] font-bold uppercase text-slate-500 block mb-1">Scope</label>
                  <select
                    value={form.scope}
                    onChange={(e) => setForm({ ...form, scope: e.target.value })}
                    className="w-full h-9 rounded-lg border border-slate-200 px-3 text-xs font-semibold focus:outline-none focus:border-emerald-500"
                  >
                    <option value="Scope 1">Scope 1</option>
                    <option value="Scope 2">Scope 2</option>
                    <option value="Scope 3">Scope 3</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold uppercase text-slate-500 block mb-1">Quantity</label>
                  <input
                    type="number"
                    value={form.quantity}
                    onChange={(e) => setForm({ ...form, quantity: e.target.value })}
                    className="w-full h-9 rounded-lg border border-slate-200 px-3 text-xs font-semibold focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold uppercase text-slate-500 block mb-1">Unit</label>
                  <input
                    type="text"
                    value={form.unit}
                    onChange={(e) => setForm({ ...form, unit: e.target.value })}
                    className="w-full h-9 rounded-lg border border-slate-200 px-3 text-xs font-semibold focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>
              <div>
                <label className="text-[11px] font-bold uppercase text-slate-500 block mb-1">EF (kgCO₂e/unit)</label>
                <input
                  type="number"
                  step="0.001"
                  value={form.ef}
                  onChange={(e) => setForm({ ...form, ef: e.target.value })}
                  className="w-full h-9 rounded-lg border border-slate-200 px-3 text-xs font-semibold focus:outline-none focus:border-emerald-500"
                />
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
                Save Record
              </button>
            </div>
          </div>
        </div>
      )}

      <ActivityDrawer activity={selected} open={drawerOpen} onOpenChange={setDrawerOpen} />
      <DataQualityPanel open={dqOpen} onOpenChange={setDqOpen} />
    </div>
  );
}
