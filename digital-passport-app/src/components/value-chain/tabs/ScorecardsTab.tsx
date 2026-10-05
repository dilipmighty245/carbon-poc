import React, { useState, useEffect } from 'react';
import { useVC } from '../../../context/ValueChainContext';
import { KpiCard, StatusChip, QualityBar, IntensityPill, fmtPct } from '../primitives';
import { ScorecardRadar } from '../Analytics';
import type { Supplier } from '../../../types/valueChain';
import { TrendingDown, TrendingUp, X, Plus } from 'lucide-react';
import { toast } from '../../../utils/toast';

interface ScorecardsTabProps {
  search?: string;
  registerPrimary?: (key: string, fn: () => void) => void;
}

const OPPS = [
  'Provide Primary Energy Data',
  'Replace Proxy Factor',
  'Submit Current PCF',
  'Provide Verification Evidence',
  'Update Expired Declaration',
  'Improve Transport Data',
  'Submit Facility-Specific Data',
  'Replace Secondary Data with Primary Data',
];

const match = (o: unknown, q?: string) => !q || JSON.stringify(o).toLowerCase().includes(q.toLowerCase());

export const ScorecardsTab: React.FC<ScorecardsTabProps> = ({ search, registerPrimary }) => {
  const { suppliers, scope3ContributionFor, addImprovement, supplierName } = useVC();
  const [selected, setSelected] = useState<Supplier | null>(null);
  const [reqOpen, setReqOpen] = useState(false);
  const [f, setF] = useState({
    supplierId: '',
    issue: OPPS[0],
    action: '',
    priority: 'High' as 'High' | 'Medium' | 'Low',
    due: '2026-04-30',
    owner: 'Procurement',
    expectedGain: '+15 quality',
  });

  useEffect(() => {
    registerPrimary?.('scorecards', () => setReqOpen(true));
  }, [registerPrimary]);

  const rows = suppliers.filter((s) => match(s, search));
  const avg = Math.round(suppliers.reduce((a, s) => a + s.score, 0) / suppliers.length);
  const high = suppliers.filter((s) => s.score >= 90).length;
  const action = suppliers.filter((s) => (s.score >= 60 && s.score < 75) || s.status === 'ACTION REQUIRED').length;
  const critical = suppliers.filter((s) => s.score < 60).length;

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!f.supplierId) return toast.error('Select a supplier');
    addImprovement(f);
    toast.success('Improvement request created', {
      description: `${supplierName(f.supplierId)} · ${f.issue}`,
    });
    setReqOpen(false);
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        <KpiCard label="Average Supplier Score" value={`${avg}/100`} testId="sc-kpi-avg" />
        <KpiCard label="High Quality" value={high} testId="sc-kpi-high" />
        <KpiCard label="Action Required" value={action} subTone="warn" testId="sc-kpi-action" />
        <KpiCard label="Critical Data Gaps" value={critical} subTone="down" testId="sc-kpi-critical" />
      </div>

      <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-xs">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50 text-[10px] font-bold uppercase tracking-wider text-slate-400">
              <th className="py-3 px-4">Supplier</th>
              <th className="py-3 px-4">Data Quality</th>
              <th className="py-3 px-4">Primary Data %</th>
              <th className="py-3 px-4">PCF Coverage</th>
              <th className="py-3 px-4">Evidence %</th>
              <th className="py-3 px-4">Verification</th>
              <th className="py-3 px-4">Carbon Intensity</th>
              <th className="py-3 px-4">Scope 3 %</th>
              <th className="py-3 px-4">YoY Trend</th>
              <th className="py-3 px-4">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map((s) => (
              <tr
                key={s.id}
                className="cursor-pointer hover:bg-emerald-50/40 transition-colors"
                onClick={() => setSelected(s)}
                data-testid={`sc-row-${s.id}`}
              >
                <td className="py-3 px-4 font-bold text-slate-900">{s.name}</td>
                <td className="py-3 px-4">
                  <QualityBar score={s.score} />
                </td>
                <td className="py-3 px-4 font-mono text-slate-700">{s.scores.primaryData}%</td>
                <td className="py-3 px-4 font-mono text-slate-700">{s.scores.pcfAvailability}%</td>
                <td className="py-3 px-4 font-mono text-slate-700">{s.scores.evidence}%</td>
                <td className="py-3 px-4">
                  <StatusChip status={s.verification} />
                </td>
                <td className="py-3 px-4">
                  <IntensityPill value={s.pcfIntensity} unit={s.volume > 1 ? 'kgCO2e/kg' : 'kgCO2e'} />
                </td>
                <td className="py-3 px-4 font-mono font-bold text-slate-700">
                  {fmtPct(scope3ContributionFor(s.id), 1)}
                </td>
                <td className="py-3 px-4">
                  {s.yoyChange <= 0 ? (
                    <span className="flex items-center gap-1 text-emerald-600 font-bold text-xs">
                      <TrendingDown className="w-3.5 h-3.5" />
                      {s.yoyChange}%
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-rose-600 font-bold text-xs">
                      <TrendingUp className="w-3.5 h-3.5" />+{s.yoyChange}%
                    </span>
                  )}
                </td>
                <td className="py-3 px-4">
                  <StatusChip status={s.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Scorecard Modal */}
      {selected && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-end">
          <div className="bg-white h-full w-full max-w-2xl shadow-2xl border-l border-slate-200 overflow-y-auto p-6 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <span className="text-[10px] font-mono font-bold text-slate-400 uppercase">
                  {selected.id} Scorecard
                </span>
                <h2 className="text-xl font-bold text-slate-900">{selected.name}</h2>
              </div>
              <button
                onClick={() => setSelected(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex items-center gap-4 rounded-xl border border-emerald-200 bg-emerald-50 p-4">
              <div className="text-4xl font-extrabold text-emerald-700 font-mono">
                {selected.score}
                <span className="text-lg text-emerald-600 font-normal">/100</span>
              </div>
              <div className="text-xs text-emerald-900 font-medium">
                Overall Carbon <strong>Data Quality Score</strong>. Strictly evaluated separately from carbon performance intensity.
              </div>
            </div>

            <ScorecardRadar scores={selected.scores} />

            <div className="grid grid-cols-2 gap-2">
              {Object.entries(selected.scores).map(([k, v]) => (
                <div
                  key={k}
                  className="flex items-center justify-between rounded-xl border border-slate-200 p-2.5 text-xs bg-slate-50/50"
                >
                  <span className="capitalize font-medium text-slate-700">
                    {k.replace(/([A-Z])/g, ' $1')}
                  </span>
                  <QualityBar score={v} />
                </div>
              ))}
            </div>

            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-xs space-y-2">
              <div className="font-bold text-amber-900 uppercase text-[10px] tracking-wider">
                Carbon Performance (Separate Metrics)
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <div className="text-slate-500 text-[10px]">Intensity</div>
                  <div className="font-bold text-slate-900">{selected.pcfIntensity} kgCO2e/kg</div>
                </div>
                <div>
                  <div className="text-slate-500 text-[10px]">Our Scope 3 Share</div>
                  <div className="font-bold text-slate-900">
                    {fmtPct(scope3ContributionFor(selected.id), 1)}
                  </div>
                </div>
                <div>
                  <div className="text-slate-500 text-[10px]">YoY Trend</div>
                  <div className="font-bold text-slate-900">{selected.yoyChange}%</div>
                </div>
              </div>
            </div>

            <div className="border-t border-slate-100 pt-4">
              <button
                onClick={() => {
                  setF({ ...f, supplierId: selected.id });
                  setReqOpen(true);
                }}
                data-testid="sc-create-imp"
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" /> Create Improvement Request
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Improvement Request Modal */}
      {reqOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
            <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <h3 className="font-bold text-slate-900 text-sm">Create Improvement Request</h3>
              <button onClick={() => setReqOpen(false)} className="p-1 text-slate-400 hover:text-slate-600 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={submit} className="p-5 space-y-4 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Target Supplier *</label>
                <select
                  value={f.supplierId}
                  onChange={(e) => setF({ ...f, supplierId: e.target.value })}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-emerald-600 bg-white"
                >
                  <option value="">-- Choose Supplier --</option>
                  {suppliers.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Issue / Opportunity *</label>
                <select
                  value={f.issue}
                  onChange={(e) => setF({ ...f, issue: e.target.value })}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-emerald-600 bg-white"
                >
                  {OPPS.map((o) => (
                    <option key={o} value={o}>
                      {o}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Recommended Action</label>
                <input
                  type="text"
                  placeholder="e.g. Provide meter-level kWh electricity data"
                  value={f.action}
                  onChange={(e) => setF({ ...f, action: e.target.value })}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-emerald-600"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Target Due Date</label>
                <input
                  type="date"
                  value={f.due}
                  onChange={(e) => setF({ ...f, due: e.target.value })}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-emerald-600"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setReqOpen(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl font-bold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-xs"
                >
                  Issue Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ScorecardsTab;
