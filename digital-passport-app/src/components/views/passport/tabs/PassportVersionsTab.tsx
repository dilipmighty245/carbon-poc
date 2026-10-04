import React from 'react';
import { useSearchParams, useParams } from 'react-router-dom';
import { History, GitCommit, ShieldCheck, ArrowRight, Clock } from 'lucide-react';
import type { RichDigitalPassport } from '../../../../types';

interface PassportVersionsTabProps {
  passports: RichDigitalPassport[];
}

export const PassportVersionsTab: React.FC<PassportVersionsTabProps> = ({ passports }) => {
  const { passportId: pathPassportId } = useParams<{ passportId?: string }>();
  const [searchParams] = useSearchParams();
  const passportId = searchParams.get('id') || pathPassportId;

  const targetId = passportId || 'pas-st-2026-00981';

  const passport =
    passports.find(
      (p) =>
        p.passport_metadata?.passport_id === targetId ||
        p.product_summary?.batch_number === targetId ||
        p.passport_metadata?.passport_id?.toLowerCase() === targetId.toLowerCase()
    ) || passports[0];

  const issuedAt =
    (passport as any)?.audit_trail?.issued_at ||
    passport?.passport_metadata?.issuance_date ||
    '2026-03-28T14:30:00Z';

  const issuedBy =
    (passport as any)?.audit_trail?.issued_by ||
    passport?.methodology_and_audit?.verification_body ||
    'Dr. Elena Rostova (Meridian Assurance Ltd)';

  const lockHash =
    (passport as any)?.audit_trail?.dataset_lock_hash ||
    passport?.passport_metadata?.cryptographic_hash ||
    '7e28a91f3e77a102bc9a1144cdcc7388105b907712e40122aa';

  const versionHistory = [
    {
      version: 'v1.1 (Current Issued)',
      date: issuedAt,
      author: issuedBy,
      changes: 'Updated CBAM carbon price paid reconciliation & finalized verifier statement',
      hash: lockHash,
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
            {passport?.product_summary?.product_name || 'Hot-Rolled Steel Coil'} ({passport?.passport_metadata?.passport_id || targetId})
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
