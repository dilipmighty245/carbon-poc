import React from 'react';
import { useSearchParams } from 'react-router-dom';
import { History, GitCommit, ShieldCheck, ArrowRight, Clock } from 'lucide-react';
import type { RichDigitalPassport } from '../../../../types';

interface PassportVersionsTabProps {
  passports: RichDigitalPassport[];
}

export const PassportVersionsTab: React.FC<PassportVersionsTabProps> = ({ passports }) => {
  const [searchParams] = useSearchParams();
  const passportId = searchParams.get('id');
  const passport = passports.find((p) => p.passport_metadata.passport_id === passportId) || passports[0];

  const versionHistory = [
    {
      version: 'v1.1 (Current Issued)',
      date: passport?.audit_trail.issued_at || '2026-03-28T14:30:00Z',
      author: passport?.audit_trail.issued_by || 'Dr. Elena Rostova',
      changes: 'Updated CBAM carbon price paid reconciliation & finalized verifier statement',
      hash: passport?.audit_trail.dataset_lock_hash || '0xa7b4c9e1f2d34890',
      active: true,
    },
    {
      version: 'v1.0 (Initial Draft)',
      date: '2026-03-20T10:15:00Z',
      author: 'Marcus Vance (Sustainability Ops)',
      changes: 'Initial MRV dataset snapshot lock and baseline footprint calculation',
      hash: '0x8849201f99c2d104',
      active: false,
    },
  ];

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-2">
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">
          Immutable Cryptographic Version Control
        </span>
        <h2 className="text-xl font-black text-slate-900">Passport Version & Revision History</h2>
        <p className="text-xs text-slate-500">
          Track historical dataset revisions, signature updates, and audit trail modifications for this passport.
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6">
        {/* Passport Target */}
        <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex justify-between items-center text-xs">
          <span className="font-bold text-slate-500">Target Product:</span>
          <span className="font-bold text-slate-900">
            {passport?.product_summary.product_name} ({passport?.passport_metadata.passport_id})
          </span>
        </div>

        {/* Timeline */}
        <div className="relative border-l-2 border-emerald-200 ml-4 space-y-6 text-xs">
          {versionHistory.map((item, idx) => (
            <div key={idx} className="relative pl-6">
              {/* Dot */}
              <div
                className={`absolute -left-[9px] top-0 w-4 h-4 rounded-full border-2 bg-white flex items-center justify-center ${
                  item.active ? 'border-emerald-600 bg-emerald-600' : 'border-slate-300'
                }`}
              >
                {item.active && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 text-sm">{item.version}</span>
                    {item.active && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                        Active Published
                      </span>
                    )}
                  </div>
                  <span className="text-slate-400 text-[11px] flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    {new Date(item.date).toLocaleString()}
                  </span>
                </div>

                <p className="text-slate-700 font-medium">{item.changes}</p>

                <div className="pt-2 border-t border-slate-200 flex flex-wrap items-center justify-between text-[11px] text-slate-500 gap-2">
                  <span>Author: <strong className="text-slate-800">{item.author}</strong></span>
                  <span className="font-mono bg-white px-2 py-0.5 rounded border border-slate-200 text-slate-700">
                    Hash: {item.hash}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
