import React, { useState } from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell } from 'recharts';
import { Activity, Radio, AlertTriangle, CheckCircle2, ArrowRight, Zap, Info } from 'lucide-react';
import type { TelemetryReading } from '../types';

interface TelemetryTabProps {
  onNavigateTab: (tab: string) => void;
  onOpenHandoff: () => void;
}

export const TelemetryTab: React.FC<TelemetryTabProps> = ({ onNavigateTab, onOpenHandoff }) => {
  const [readings] = useState<TelemetryReading[]>([
    {
      device: 'MTR-001',
      process: 'Rolling line',
      parameter: 'Interval energy',
      value: '125.4 kWh',
      unit: 'kWh',
      observedUtc: '09:30',
      quality: 'Accepted',
      evidenceRef: 'EV-MTR-001',
    },
    {
      device: 'MTR-002',
      process: 'Furnace',
      parameter: 'Cumulative energy',
      value: '14,210 kWh',
      unit: 'kWh',
      observedUtc: '09:30',
      quality: 'Accepted',
      evidenceRef: 'EV-MTR-002',
    },
    {
      device: 'MTR-003',
      process: 'Packing',
      parameter: 'Interval energy',
      value: 'Missing',
      unit: 'kWh',
      observedUtc: '08:10',
      quality: 'Gap',
      evidenceRef: 'EV-MTR-003',
    },
  ]);

  const [selectedReading, setSelectedReading] = useState<TelemetryReading | null>(null);

  const trendData = [
    { time: '07:00', val: 98.2, fill: '#06b6d4' },
    { time: '07:30', val: 112.5, fill: '#06b6d4' },
    { time: '08:00', val: 104.8, fill: '#06b6d4' },
    { time: '08:30', val: 130.1, fill: '#10b981' },
    { time: '09:00', val: 118.6, fill: '#06b6d4' },
    { time: '09:30', val: 125.4, fill: '#10b981' },
  ];

  return (
    <div className="space-y-6">
      {/* Notice Banner */}
      <div className="p-3.5 bg-sky-50 border border-sky-100 rounded-xl text-xs text-sky-800 leading-relaxed flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Zap className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>
            <strong className="font-bold">Raw Telemetry Stream:</strong> Primary sub-meter measurements are preserved immutably. Derived emissions are calculated downstream in PCF and GHG inventories.
          </span>
        </div>
        <span className="font-mono text-[10px] bg-sky-200/60 px-2 py-0.5 rounded font-bold text-sky-900">
          SSE: 8085 LIVE
        </span>
      </div>

      {/* KPI 4-Card Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <span className="text-xs font-semibold text-slate-400">Energy interval</span>
          <span className="text-2xl font-black text-slate-900 tracking-tight mt-1">125.4 kWh</span>
          <span className="text-[11px] font-medium text-emerald-600 mt-1">Latest illustrative period</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <span className="text-xs font-semibold text-slate-400">Devices online</span>
          <span className="text-2xl font-black text-slate-900 tracking-tight mt-1">2 / 3</span>
          <span className="text-[11px] font-medium text-slate-500 mt-1">Simulated readings</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <span className="text-xs font-semibold text-slate-400">Data gaps</span>
          <span className="text-2xl font-black text-amber-600 tracking-tight mt-1">1</span>
          <span className="text-[11px] font-medium text-amber-700 mt-1">Requires review</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <span className="text-xs font-semibold text-slate-400">Sampling period</span>
          <span className="text-2xl font-black text-slate-900 tracking-tight mt-1">30 min</span>
          <span className="text-[11px] font-medium text-slate-500 mt-1">09:00–09:30 UTC</span>
        </div>
      </div>

      {/* Device Readings Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="font-bold text-slate-900 text-sm">Device readings</h2>
            <p className="text-xs text-slate-500">Live operational energy streams from physical sub-meters</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50/70 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3 px-5">Device</th>
                <th className="py-3 px-4">Process</th>
                <th className="py-3 px-4">Parameter</th>
                <th className="py-3 px-4">Value</th>
                <th className="py-3 px-4">Observed UTC</th>
                <th className="py-3 px-4">Quality</th>
                <th className="py-3 px-5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {readings.map((r, i) => (
                <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                  <td className="py-3.5 px-5 font-mono font-bold text-slate-900">
                    <div className="flex items-center gap-2">
                      <Radio className="w-3.5 h-3.5 text-slate-400" />
                      <span>{r.device}</span>
                    </div>
                  </td>
                  <td className="py-3.5 px-4 font-semibold text-slate-800">{r.process}</td>
                  <td className="py-3.5 px-4 text-slate-600">{r.parameter}</td>
                  <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                    {r.quality === 'Gap' ? (
                      <span className="text-rose-600">Missing</span>
                    ) : (
                      r.value
                    )}
                  </td>
                  <td className="py-3.5 px-4 font-mono text-slate-500">{r.observedUtc}</td>
                  <td className="py-3.5 px-4">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${
                        r.quality === 'Accepted'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : 'bg-amber-50 text-amber-700 border-amber-200'
                      }`}
                    >
                      {r.quality}
                    </span>
                  </td>
                  <td className="py-3.5 px-5 text-right">
                    {r.quality === 'Accepted' ? (
                      <button
                        onClick={() => setSelectedReading(r)}
                        className="px-3 py-1 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-bold rounded-lg shadow-2xs text-[11px] transition-colors"
                      >
                        Reading trace
                      </button>
                    ) : (
                      <button
                        onClick={() => onNavigateTab('Exceptions')}
                        className="px-3 py-1 bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-800 font-bold rounded-lg shadow-2xs text-[11px] transition-colors"
                      >
                        Review gap
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Two Column Grid: Energy Trend & Activity Derivation */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Trend Chart */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-slate-900 text-sm">Energy trend in kWh</h3>
              <span className="text-[10px] font-mono text-slate-400">30-MIN INTERVALS</span>
            </div>

            <div className="h-48 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={trendData} barCategoryGap="25%">
                  <XAxis dataKey="time" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                  <Tooltip />
                  <Bar dataKey="val" radius={[4, 4, 0, 0]}>
                    {trendData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <p className="text-[11px] text-slate-400 pt-3 border-t border-slate-100 font-medium">
            Illustrative 30-minute interval data. No carbon emissions are implied by this raw energy chart.
          </p>
        </div>

        {/* Activity Derivation Box */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-slate-900 text-sm">Activity derivation</h3>
              <span className="text-[10px] font-mono text-emerald-700 font-bold">ALGORITHM</span>
            </div>

            <div className="p-3.5 bg-slate-50/70 border border-slate-100 rounded-xl space-y-2 text-xs">
              <div className="font-mono font-bold text-slate-800 text-[11px] leading-relaxed">
                Counter difference → interval consumption → approved process/batch allocation → activity input
              </div>
              <p className="text-slate-600 text-[11px] leading-relaxed">
                For cumulative energy counters, derive consumption from interval differences using explicit reset/rollover rules. Deduplicate readings, handle out-of-order arrivals, and identify gaps. Do not silently substitute zero for missing readings.
              </p>
            </div>
          </div>

          <button
            onClick={onOpenHandoff}
            className="w-full py-2.5 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-800 text-xs font-bold rounded-xl transition-colors flex items-center justify-center gap-2"
          >
            <span>Open PCF allocation</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Reading Trace Modal */}
      {selectedReading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs" onClick={() => setSelectedReading(null)} />
          <div className="relative bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-sm">Reading Provenance: {selectedReading.device}</h3>
              <button onClick={() => setSelectedReading(null)} className="text-slate-400 hover:text-slate-600">
                ✕
              </button>
            </div>

            <div className="space-y-2 text-xs font-mono text-slate-700 bg-slate-50 p-4 rounded-xl border border-slate-200">
              <p><strong>Device ID:</strong> {selectedReading.device}</p>
              <p><strong>Process Area:</strong> {selectedReading.process}</p>
              <p><strong>Parameter:</strong> {selectedReading.parameter}</p>
              <p><strong>Measured Value:</strong> {selectedReading.value}</p>
              <p><strong>Observed Timestamp:</strong> {selectedReading.observedUtc} UTC</p>
              <p><strong>Evidence Vault Fixture:</strong> {selectedReading.evidenceRef}</p>
            </div>

            <p className="text-[11px] text-slate-500 leading-relaxed">
              Simulated primary measurement stream. Gaps, reset flags, and rollover boundaries are verified before allocation to production batches.
            </p>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSelectedReading(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl"
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
