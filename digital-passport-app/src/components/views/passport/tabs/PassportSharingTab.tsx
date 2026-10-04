import React, { useState } from 'react';
import { useSearchParams, useParams } from 'react-router-dom';
import { Share2, Lock, Eye, Globe, Shield, CheckCircle2, UserPlus } from 'lucide-react';
import type { RichDigitalPassport } from '../../../../types';

interface PassportSharingTabProps {
  passports: RichDigitalPassport[];
}

export const PassportSharingTab: React.FC<PassportSharingTabProps> = ({ passports }) => {
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

  const [shareMode, setShareMode] = useState<'PUBLIC' | 'RESTRICTED' | 'CUSTOMS_ONLY'>('RESTRICTED');
  const [allowedEmails, setAllowedEmails] = useState('customs-clearance@eu.europa.eu, auditor@bureauveritas.com');
  const [isSaved, setIsSaved] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-2">
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">
          Access Control & Data Privacy Controls
        </span>
        <h2 className="text-xl font-black text-slate-900">Passport Access & Sharing Settings</h2>
        <p className="text-xs text-slate-500">
          Configure granular permission rules, selective disclosure of proprietary data, and customs access.
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6">
        {/* Selected Target */}
        <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex justify-between items-center text-xs">
          <span className="font-bold text-slate-500">Target Passport:</span>
          <span className="font-bold text-slate-900">{passport?.product_summary?.product_name || 'Hot-Rolled Steel Coil'} ({passport?.passport_metadata?.passport_id || 'pas-st-2026-00981'})</span>
        </div>

        <form onSubmit={handleSave} className="space-y-6 text-xs">
          {/* Privacy Level */}
          <div className="space-y-3">
            <label className="block font-bold text-slate-900 text-xs">Visibility & Access Policy</label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div
                onClick={() => setShareMode('PUBLIC')}
                className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                  shareMode === 'PUBLIC'
                    ? 'border-emerald-600 bg-emerald-50/50'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                <Globe className="w-5 h-5 text-emerald-600 mb-2" />
                <h4 className="font-bold text-slate-900">Public Access</h4>
                <p className="text-[11px] text-slate-500 mt-1">Anyone with the QR code or URL can view full passport</p>
              </div>

              <div
                onClick={() => setShareMode('RESTRICTED')}
                className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                  shareMode === 'RESTRICTED'
                    ? 'border-emerald-600 bg-emerald-50/50'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                <Lock className="w-5 h-5 text-emerald-600 mb-2" />
                <h4 className="font-bold text-slate-900">Restricted Share</h4>
                <p className="text-[11px] text-slate-500 mt-1">Only authenticated partners & emails specified below</p>
              </div>

              <div
                onClick={() => setShareMode('CUSTOMS_ONLY')}
                className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                  shareMode === 'CUSTOMS_ONLY'
                    ? 'border-emerald-600 bg-emerald-50/50'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                <Shield className="w-5 h-5 text-emerald-600 mb-2" />
                <h4 className="font-bold text-slate-900">Customs Only</h4>
                <p className="text-[11px] text-slate-500 mt-1">Strictly limited to EU Customs Authority verification API</p>
              </div>
            </div>
          </div>

          {/* Email Allow List */}
          {shareMode === 'RESTRICTED' && (
            <div>
              <label className="block font-bold text-slate-700 mb-1">Authorized Recipients (Comma Separated)</label>
              <textarea
                rows={3}
                value={allowedEmails}
                onChange={(e) => setAllowedEmails(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 font-mono text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          )}

          {isSaved && (
            <div className="p-3 bg-emerald-100 text-emerald-900 rounded-xl text-xs font-bold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Sharing policies saved successfully!</span>
            </div>
          )}

          <div className="pt-2">
            <button
              type="submit"
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors"
            >
              Update Sharing Settings
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
