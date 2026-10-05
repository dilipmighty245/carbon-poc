import React from 'react';
import { useVC } from '../../context/ValueChainContext';
import { X, History } from 'lucide-react';

interface AuditDrawerProps {
  open: boolean;
  onClose: () => void;
}

export const AuditDrawer: React.FC<AuditDrawerProps> = ({ open, onClose }) => {
  const { audit } = useVC();

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-end">
      <div className="bg-white h-full w-full max-w-xl shadow-2xl border-l border-slate-200 overflow-y-auto p-6 space-y-6">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-2">
            <History className="w-5 h-5 text-emerald-600" />
            <h2 className="text-lg font-bold text-slate-900">Value Chain Audit Trail</h2>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-3 text-xs">
          {audit.map((entry) => (
            <div
              key={entry.id}
              className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5"
            >
              <div className="flex items-center justify-between">
                <span className="font-mono font-bold text-slate-500">{entry.id}</span>
                <span className="font-mono text-[10px] text-slate-400">
                  {new Date(entry.ts).toLocaleString()}
                </span>
              </div>
              <div className="font-bold text-slate-900">
                {entry.object} ({entry.objectId})
              </div>
              <div className="text-slate-600">
                Action: <span className="font-mono text-emerald-700 font-bold">{entry.next}</span> (from {entry.prev})
              </div>
              <div className="text-slate-500 italic">{entry.reason}</div>
              <div className="text-[10px] text-slate-400 pt-1 border-t border-slate-100">
                By: {entry.user} ({entry.role})
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AuditDrawer;
