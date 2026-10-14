import React from 'react';
import { CheckCircle2, AlertTriangle, Radio, ArrowUpRight, ShieldCheck, Activity, Layers } from 'lucide-react';
import type { DataSource } from '../types';

interface ConnectionsTabProps {
  sources: DataSource[];
  onNavigateTab: (tab: string) => void;
  onOpenAddConnection: () => void;
  onOpenHandoff: () => void;
}

export const ConnectionsTab: React.FC<ConnectionsTabProps> = ({
  sources,
  onNavigateTab,
  onOpenAddConnection,
  onOpenHandoff,
}) => {
  const simulatedCount = sources.filter((s) => s.mode === 'Simulated').length;
  const manualCount = sources.filter((s) => s.mode === 'Manual').length;

  return (
    <div className="space-y-6">
      {/* Notice Banner */}
      <div className="p-3.5 bg-sky-50 border border-sky-100 rounded-xl flex items-center justify-between text-xs text-sky-800">
        <div className="flex items-center gap-2.5">
          <span className="w-2 h-2 rounded-full bg-sky-500 animate-pulse"></span>
          <span>
            <strong className="font-bold">Frontend handover preview:</strong> Sample records and actions are simulated; no live integrations, database or verifier approval.
          </span>
        </div>
        <button
          onClick={onOpenHandoff}
          className="text-xs font-bold text-sky-700 hover:text-sky-900 underline flex items-center gap-1"
        >
          <span>Data Journey & Lineage</span>
          <ArrowUpRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* KPI 4-Card Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <span className="text-xs font-semibold text-slate-400">Enabled sources</span>
          <span className="text-2xl font-black text-slate-900 tracking-tight mt-1">{sources.length}</span>
          <span className="text-[11px] font-medium text-slate-500 mt-1">
            {simulatedCount} simulated • {manualCount} manual
          </span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <span className="text-xs font-semibold text-slate-400">Records today</span>
          <span className="text-2xl font-black text-emerald-700 tracking-tight mt-1">120</span>
          <span className="text-[11px] font-medium text-emerald-600 mt-1">
            116 accepted • 4 rejected
          </span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <span className="text-xs font-semibold text-slate-400">Open exceptions</span>
          <span className="text-2xl font-black text-amber-600 tracking-tight mt-1">4</span>
          <span className="text-[11px] font-medium text-amber-700 mt-1">
            2 blocking • 2 warnings
          </span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <span className="text-xs font-semibold text-slate-400">Devices online</span>
          <span className="text-2xl font-black text-slate-900 tracking-tight mt-1">2 / 3</span>
          <span className="text-[11px] font-medium text-slate-500 mt-1">
            Current demo snapshot
          </span>
        </div>
      </div>

      {/* Data Sources Register Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="font-bold text-slate-900 text-sm">Data sources</h2>
            <p className="text-xs text-slate-500">Configured intake connectors mapped to canonical models</p>
          </div>
          <button
            onClick={onOpenAddConnection}
            className="px-3.5 py-1.5 bg-[#00E599] hover:bg-[#00c985] text-slate-950 font-bold text-xs rounded-xl shadow-2xs transition-colors"
          >
            Add Connection
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50/70 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3 px-5">Source</th>
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4">Mode</th>
                <th className="py-3 px-4">Last Import</th>
                <th className="py-3 px-4">Health</th>
                <th className="py-3 px-5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {sources.map((s) => (
                <tr key={s.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="py-3.5 px-5 font-bold text-slate-900">
                    <div className="flex items-center gap-2">
                      <Radio className="w-3.5 h-3.5 text-slate-400" />
                      <span>{s.name}</span>
                    </div>
                  </td>
                  <td className="py-3.5 px-4 text-slate-600 font-medium">{s.type}</td>
                  <td className="py-3.5 px-4">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-md border tracking-wider ${
                        s.mode === 'Live'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : s.mode === 'Manual'
                          ? 'bg-purple-50 text-purple-700 border-purple-200'
                          : 'bg-sky-50 text-sky-700 border-sky-200'
                      }`}
                    >
                      {s.mode}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-slate-500">{s.lastImport}</td>
                  <td className="py-3.5 px-4">
                    <span
                      className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full inline-flex items-center gap-1.5 ${
                        s.health === 'Healthy'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          s.health === 'Healthy' ? 'bg-emerald-500' : 'bg-amber-500'
                        }`}
                      ></span>
                      <span>{s.health}</span>
                    </span>
                  </td>
                  <td className="py-3.5 px-5 text-right">
                    {s.type.includes('file') || s.type.includes('ERP') ? (
                      <button
                        onClick={() => onNavigateTab('Import Jobs')}
                        className="px-3 py-1 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-bold rounded-lg shadow-2xs text-[11px] transition-colors"
                      >
                        View jobs
                      </button>
                    ) : s.type.includes('Meter') || s.type.includes('simulation') ? (
                      <button
                        onClick={() => onNavigateTab('Telemetry')}
                        className="px-3 py-1 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-bold rounded-lg shadow-2xs text-[11px] transition-colors"
                      >
                        View readings
                      </button>
                    ) : (
                      <button
                        onClick={() => onNavigateTab('Exceptions')}
                        className="px-3 py-1 bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-800 font-bold rounded-lg shadow-2xs text-[11px] transition-colors"
                      >
                        Resolve
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Two Column Grid: Connection Health & Data Journey */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Connection Health */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-bold text-slate-900 text-sm">Connection health</h2>
              <span className="text-[10px] font-mono text-slate-400">DIAGNOSTICS</span>
            </div>

            <div className="space-y-3">
              <div className="p-3 bg-slate-50/70 border border-slate-100 rounded-xl">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-slate-900">ERP purchase feed</span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                    Healthy
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  Authentication: demo configuration • Latest import: completed with 2 errors
                </p>
              </div>

              <div className="p-3 bg-amber-50/50 border border-amber-100 rounded-xl">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-slate-900">Plant gateway</span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200">
                    Stale device
                  </span>
                </div>
                <p className="text-[11px] text-amber-700 mt-1">
                  Device MTR-003 has no recent readings in current 30-min window.
                </p>
              </div>
            </div>
          </div>

          <button
            onClick={() => onNavigateTab('Exceptions')}
            className="w-full py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors"
          >
            Inspect exceptions
          </button>
        </div>

        {/* Data Journey */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-bold text-slate-900 text-sm">Data journey & Lineage</h2>
              <span className="text-[10px] font-mono text-emerald-600 font-bold">VERIFIED TRACE</span>
            </div>

            <div className="p-3 bg-slate-50/70 border border-slate-100 rounded-xl space-y-2">
              <div className="flex items-center gap-2 text-xs font-mono font-bold text-slate-700">
                <span>Sources</span>
                <span className="text-slate-400">→</span>
                <span>Activities</span>
                <span className="text-slate-400">→</span>
                <span>PCF / CBAM</span>
                <span className="text-slate-400">→</span>
                <span>MRV</span>
                <span className="text-slate-400">→</span>
                <span className="text-emerald-700">Passport</span>
              </div>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Accepted records connect to the facility, process, and batch before downstream calculations run. Open a source record from any downstream calculation to inspect its provenance.
              </p>
            </div>
          </div>

          <button
            onClick={onOpenHandoff}
            className="w-full py-2 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-800 text-xs font-bold rounded-xl transition-colors flex items-center justify-center gap-2"
          >
            <Layers className="w-3.5 h-3.5 text-emerald-700" />
            <span>Explore internal links</span>
          </button>
        </div>
      </div>
    </div>
  );
};
