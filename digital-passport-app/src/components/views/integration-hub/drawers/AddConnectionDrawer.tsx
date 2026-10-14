import React, { useState } from 'react';
import { X, ShieldAlert, CheckCircle2, Server, KeyRound } from 'lucide-react';
import type { DataSource } from '../types';

interface AddConnectionDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onAddConnection: (newSource: DataSource) => void;
}

export const AddConnectionDrawer: React.FC<AddConnectionDrawerProps> = ({
  isOpen,
  onClose,
  onAddConnection,
}) => {
  const [name, setName] = useState('');
  const [type, setType] = useState('ERP file connector');
  const [mode, setMode] = useState<'Simulated' | 'Manual' | 'Live'>('Simulated');
  const [facility, setFacility] = useState('FAC-001');
  const [isSubmitted, setIsSubmitted] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const newSource: DataSource = {
      id: `SRC-${Date.now().toString().slice(-4)}`,
      name: name.trim(),
      type,
      mode,
      lastImport: 'Just now',
      health: 'Healthy',
      facility,
      recordsCount: 0,
      owner: 'Platform Operator',
    };

    onAddConnection(newSource);
    setIsSubmitted(true);
    setTimeout(() => {
      setIsSubmitted(false);
      setName('');
      onClose();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div 
        className="absolute inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white shadow-2xl flex flex-col">
          {/* Header */}
          <div className="px-6 py-5 bg-[#0C1322] text-white flex items-center justify-between border-b border-slate-800">
            <div>
              <div className="flex items-center gap-2">
                <Server className="w-4 h-4 text-emerald-400" />
                <span className="text-[10px] font-mono tracking-widest text-emerald-400 uppercase font-bold">
                  NEW INGESTION SOURCE
                </span>
              </div>
              <h2 className="text-lg font-black text-white tracking-tight mt-1">
                Add Connection
              </h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
            {isSubmitted ? (
              <div className="p-6 bg-emerald-50 border border-emerald-200 rounded-2xl text-center space-y-3 my-auto">
                <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto" />
                <h3 className="font-bold text-base text-emerald-900">Demo Connection Saved</h3>
                <p className="text-xs text-emerald-700">
                  Configuration preview registered for this workspace session. No live external data was requested.
                </p>
              </div>
            ) : (
              <>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">
                    Source Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Oracle ERP Inbound, Modbus Gateway 4"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-emerald-500 shadow-2xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">Source Type</label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value)}
                    className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-emerald-500 shadow-2xs"
                  >
                    <option value="ERP file connector">ERP file connector (CSV / SFTP)</option>
                    <option value="Meter simulation">Meter simulation (IoT Telemetry / Modbus)</option>
                    <option value="Manual supplier records">Manual supplier records</option>
                    <option value="REST / Webhook Ingestion">REST / Webhook Ingestion</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">Ingestion Mode</label>
                  <div className="grid grid-cols-3 gap-2">
                    {(['Simulated', 'Manual', 'Live'] as const).map((m) => (
                      <button
                        type="button"
                        key={m}
                        onClick={() => setMode(m)}
                        className={`py-2 text-xs font-bold rounded-xl border text-center transition-all ${
                          mode === m
                            ? 'bg-emerald-50 border-emerald-500 text-emerald-800 shadow-2xs'
                            : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        {m}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">Assigned Facility</label>
                  <input
                    type="text"
                    required
                    value={facility}
                    onChange={(e) => setFacility(e.target.value)}
                    className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-emerald-500 shadow-2xs"
                  />
                  <p className="text-[11px] text-slate-400">Must resolve to an authorized facility in Organisation master data.</p>
                </div>

                <div className="p-4 bg-amber-50/70 border border-amber-200/80 rounded-xl flex items-start gap-3">
                  <KeyRound className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div className="text-[11px] text-amber-800 leading-relaxed">
                    <span className="font-bold">Security & Credential Masking:</span> No client secrets or credentials are exchanged in the UI. Configure production credentials and token vault server-side.
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 bg-white border border-slate-200 text-slate-700 text-xs font-bold rounded-xl hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-[#00E599] hover:bg-[#00c985] text-slate-950 text-xs font-bold rounded-xl shadow-xs transition-colors"
                  >
                    Save Demo Connection
                  </button>
                </div>
              </>
            )}
          </form>
        </div>
      </div>
    </div>
  );
};
