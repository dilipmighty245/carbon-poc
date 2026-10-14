import React, { useState } from 'react';
import { Play, Pause, Save, CheckCircle2, RefreshCw, Calendar, Clock, ShieldCheck } from 'lucide-react';
import type { SyncRun } from '../types';

export const SyncControlsTab: React.FC = () => {
  const [source, setSource] = useState('ERP purchase feed');
  const [schedule, setSchedule] = useState<'Manual only' | 'Hourly' | 'Daily'>('Manual only');
  const [timezone, setTimezone] = useState('Africa/Accra');
  const [fromDate, setFromDate] = useState('2026-09-01');
  const [toDate, setToDate] = useState('2026-09-30');
  const [paused, setPaused] = useState(false);
  const [syncStatus, setSyncStatus] = useState<string>(
    'Demo source enabled • Last run today 09:42 • No live schedule is running.'
  );
  const [savedBanner, setSavedBanner] = useState<string | null>(null);

  const [runs, setRuns] = useState<SyncRun[]>([
    {
      id: 'RUN-001',
      coverage: 'September 2026',
      state: 'Completed',
      accepted: 116,
      rejected: 4,
      timestamp: 'Today 09:42',
    },
    {
      id: 'RUN-002',
      coverage: 'September 2026',
      state: 'Retry completed',
      accepted: 2,
      rejected: 0,
      timestamp: 'Today 10:15',
    },
  ]);

  const handleSimulateSync = () => {
    setSyncStatus('Simulated sync completed • 2 sample records accepted • No external data requested.');
    const newRun: SyncRun = {
      id: `RUN-00${runs.length + 1}`,
      coverage: 'September 2026',
      state: 'Completed',
      accepted: 2,
      rejected: 0,
      timestamp: 'Just now',
    };
    setRuns([newRun, ...runs]);
  };

  const handleTogglePause = () => {
    const nextState = !paused;
    setPaused(nextState);
    setSyncStatus(nextState ? 'Demo source paused.' : 'Demo source resumed.');
  };

  const handleSaveSchedule = () => {
    setSavedBanner('Schedule preview saved. Connect a backend scheduler daemon to enable cron runs.');
    setTimeout(() => setSavedBanner(null), 3500);
  };

  return (
    <div className="space-y-6">
      {/* Notice Banner */}
      <div className="p-3.5 bg-sky-50 border border-sky-100 rounded-xl text-xs text-sky-800 leading-relaxed">
        <strong className="font-bold">Idempotency Policy:</strong> Ingestion pipelines enforce composite deduplication: <code className="font-mono bg-white px-1.5 py-0.5 rounded border border-sky-200">Source ID + External Record ID + Revision</code>. Retries never inflate totals or accept duplicate records.
      </div>

      {savedBanner && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span className="font-semibold">{savedBanner}</span>
        </div>
      )}

      {/* Sync Configuration Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <h2 className="font-bold text-slate-900 text-sm">Synchronisation configuration</h2>
            <p className="text-xs text-slate-500">Configure ingestion cadence, timezones, and date ranges</p>
          </div>

          <div className="flex items-center gap-2">
            <span
              className={`text-[11px] font-bold px-2.5 py-1 rounded-md border ${
                paused
                  ? 'bg-amber-50 text-amber-800 border-amber-200'
                  : 'bg-emerald-50 text-emerald-800 border-emerald-200'
              }`}
            >
              {paused ? 'PAUSED' : 'SCHEDULE ACTIVE'}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700">Source</label>
            <select
              value={source}
              onChange={(e) => setSource(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-emerald-500"
            >
              <option value="ERP purchase feed">ERP purchase feed</option>
              <option value="Plant energy gateway">Plant energy gateway</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700">Schedule Cadence</label>
            <select
              value={schedule}
              onChange={(e) => setSchedule(e.target.value as any)}
              className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-emerald-500"
            >
              <option value="Manual only">Manual only</option>
              <option value="Hourly">Hourly</option>
              <option value="Daily">Daily</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700">Reporting Timezone</label>
            <select
              value={timezone}
              onChange={(e) => setTimezone(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-emerald-500"
            >
              <option value="Africa/Accra">Africa/Accra (UTC+0)</option>
              <option value="Asia/Kolkata">Asia/Kolkata (UTC+5:30)</option>
              <option value="UTC">UTC (Universal)</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700">Duplicate Rule</label>
            <input
              type="text"
              readOnly
              value="Source ID + external record ID + revision"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono text-slate-600 cursor-not-allowed"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <span>From Date</span>
            </label>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <span>To Date</span>
            </label>
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-emerald-500"
            />
          </div>
        </div>

        {/* Live Status String */}
        <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs font-medium text-slate-700 flex items-center gap-2">
          <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <span>{syncStatus}</span>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-3 pt-2">
          <button
            onClick={handleSaveSchedule}
            className="px-4 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold rounded-xl shadow-2xs transition-colors flex items-center gap-2"
          >
            <Save className="w-3.5 h-3.5" />
            <span>Save demo schedule</span>
          </button>
          <button
            onClick={handleSimulateSync}
            className="px-4 py-2 bg-[#00E599] hover:bg-[#00c985] text-slate-950 text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center gap-2"
          >
            <Play className="w-3.5 h-3.5" />
            <span>Simulate sync now</span>
          </button>
          <button
            onClick={handleTogglePause}
            className="px-4 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold rounded-xl shadow-2xs transition-colors flex items-center gap-2"
          >
            {paused ? <Play className="w-3.5 h-3.5 text-emerald-600" /> : <Pause className="w-3.5 h-3.5 text-amber-600" />}
            <span>{paused ? 'Resume sync' : 'Pause sync'}</span>
          </button>
        </div>
      </div>

      {/* Recent Runs Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-slate-900 text-sm">Recent runs</h3>
            <p className="text-xs text-slate-500">Execution log of scheduled and simulated intake synchronisations</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50/70 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3 px-5">Run ID</th>
                <th className="py-3 px-4">Coverage</th>
                <th className="py-3 px-4">State</th>
                <th className="py-3 px-4">Accepted / Rejected</th>
                <th className="py-3 px-5 text-right">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {runs.map((r) => (
                <tr key={r.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="py-3.5 px-5 font-mono font-bold text-slate-900">{r.id}</td>
                  <td className="py-3.5 px-4 font-medium text-slate-600">{r.coverage}</td>
                  <td className="py-3.5 px-4">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${
                        r.state.includes('Completed')
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : 'bg-amber-50 text-amber-700 border-amber-200'
                      }`}
                    >
                      {r.state}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 font-mono font-semibold">
                    <span className="text-emerald-700">{r.accepted}</span>
                    <span className="text-slate-400"> / </span>
                    <span className={r.rejected > 0 ? 'text-rose-600' : 'text-slate-500'}>
                      {r.rejected}
                    </span>
                  </td>
                  <td className="py-3.5 px-5 text-right text-slate-500">{r.timestamp}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
