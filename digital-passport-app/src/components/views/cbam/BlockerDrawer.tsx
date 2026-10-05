import React from 'react';
import { X, AlertTriangle, CheckCircle2, ShieldAlert, ArrowRight, FileText, UserCheck } from 'lucide-react';
import type { CBAMChecklistRule } from '../../../types/cbam';

interface BlockerDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  rules: CBAMChecklistRule[];
  onResolveRule: (ruleId: string) => void;
}

export const BlockerDrawer: React.FC<BlockerDrawerProps> = ({
  isOpen,
  onClose,
  rules,
  onResolveRule,
}) => {
  if (!isOpen) return null;

  const blockers = rules.filter((r) => r.outcome === 'FAIL' || r.severity === 'BLOCKER');
  const warnings = rules.filter((r) => r.outcome === 'WARN' && r.severity === 'WARNING');
  const passed = rules.filter((r) => r.outcome === 'PASS');

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/40 backdrop-blur-xs flex justify-end">
      <div className="w-full max-w-lg bg-white h-full shadow-2xl flex flex-col justify-between border-l border-slate-200 animate-in slide-in-from-right duration-200">
        {/* Drawer Header */}
        <div className="p-6 border-b border-slate-200 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-400/20 border border-amber-400/40 text-amber-400 flex items-center justify-center">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-base text-white">Compliance Blockers & Readiness</h2>
              <p className="text-xs text-slate-400">Universal & Sector Rulebook Evaluator</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Drawer Body */}
        <div className="p-6 space-y-6 overflow-y-auto flex-1 bg-slate-50">
          {/* Summary Alert */}
          {blockers.length > 0 ? (
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <h4 className="font-bold text-xs text-rose-900">
                  {blockers.length} Mandatory Blocker{blockers.length > 1 ? 's' : ''} Active
                </h4>
                <p className="text-[11px] text-rose-700 mt-0.5 leading-relaxed">
                  Data freeze and verifier handover are blocked until all mandatory rules pass or an authorized fallback is configured.
                </p>
              </div>
            </div>
          ) : (
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <h4 className="font-bold text-xs text-emerald-900">All Validation Gates Passed</h4>
                <p className="text-[11px] text-emerald-700 mt-0.5">
                  Dataset is verified ready for third-party verification and dataset freezing.
                </p>
              </div>
            </div>
          )}

          {/* Active Blockers List */}
          {blockers.length > 0 && (
            <div className="space-y-3">
              <h3 className="font-bold text-xs text-slate-900 uppercase tracking-wider">
                Active Mandatory Blockers ({blockers.length})
              </h3>
              {blockers.map((b) => (
                <div key={b.ruleId} className="p-4 bg-white rounded-2xl border border-rose-200 shadow-xs space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-rose-700 bg-rose-50 px-2.5 py-0.5 rounded-md border border-rose-100">
                      {b.ruleId}
                    </span>
                    <span className="text-[10px] font-bold text-rose-700 bg-rose-100 px-2 py-0.5 rounded uppercase">
                      BLOCKER
                    </span>
                  </div>

                  <div>
                    <h4 className="font-bold text-xs text-slate-900">{b.title}</h4>
                    <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">{b.description}</p>
                    {b.message && (
                      <p className="text-[11px] font-semibold text-rose-600 mt-1 bg-rose-50/60 p-2 rounded-lg border border-rose-100/60">
                        {b.message}
                      </p>
                    )}
                  </div>

                  <div className="border-t border-slate-100 pt-3 flex items-center justify-between text-[10px]">
                    <div className="flex items-center gap-1.5 text-slate-500 font-medium">
                      <UserCheck className="w-3.5 h-3.5" />
                      <span>Owner: {b.ownerRole}</span>
                    </div>
                    <div className="flex items-center gap-1 text-slate-500 font-medium">
                      <FileText className="w-3.5 h-3.5" />
                      <span>Req: {b.requiredEvidenceTypes.join(', ')}</span>
                    </div>
                  </div>

                  <button
                    onClick={() => onResolveRule(b.ruleId)}
                    className="w-full py-2.5 bg-[#00E599] hover:bg-[#00c985] text-slate-950 font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2"
                  >
                    <span>Resolve Blocker (Apply Verified Data)</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Warnings List */}
          {warnings.length > 0 && (
            <div className="space-y-3">
              <h3 className="font-bold text-xs text-slate-900 uppercase tracking-wider">
                Warnings & Non-Material Items ({warnings.length})
              </h3>
              {warnings.map((w) => (
                <div key={w.ruleId} className="p-4 bg-white rounded-2xl border border-amber-200 shadow-xs space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-amber-800 bg-amber-50 px-2.5 py-0.5 rounded-md">
                      {w.ruleId}
                    </span>
                    <span className="text-[10px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded uppercase">
                      WARNING
                    </span>
                  </div>
                  <h4 className="font-bold text-xs text-slate-900">{w.title}</h4>
                  <p className="text-[11px] text-slate-600">{w.description}</p>
                </div>
              ))}
            </div>
          )}

          {/* Passed Checks Summary */}
          {passed.length > 0 && (
            <div className="space-y-3">
              <h3 className="font-bold text-xs text-slate-900 uppercase tracking-wider">
                Passed Validation Gates ({passed.length})
              </h3>
              <div className="bg-white p-4 rounded-2xl border border-slate-200 space-y-2 text-xs">
                {passed.map((p) => (
                  <div key={p.ruleId} className="flex items-center justify-between py-1 border-b border-slate-50 last:border-0">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      <span className="font-mono font-bold text-slate-700 text-[11px]">{p.ruleId}</span>
                      <span className="text-slate-600 font-medium truncate max-w-[200px]">{p.title}</span>
                    </div>
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                      PASSED
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Drawer Footer */}
        <div className="p-4 border-t border-slate-200 bg-white flex items-center justify-between">
          <span className="text-xs text-slate-500 font-medium">Saurient Validation Engine v1.0</span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-xs transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
