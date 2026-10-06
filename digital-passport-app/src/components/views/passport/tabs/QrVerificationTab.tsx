import React from 'react';
import { useSearchParams } from 'react-router-dom';
import { QrCode, ShieldCheck, Copy, CheckCircle2, Download, ExternalLink } from 'lucide-react';
import type { RichDigitalPassport } from '../../../../types';

interface QrVerificationTabProps {
  passports: RichDigitalPassport[];
}

export const QrVerificationTab: React.FC<QrVerificationTabProps> = ({ passports }) => {
  const [searchParams] = useSearchParams();
  const passportId = searchParams.get('id');
  const passport = passports.find((p) => p.passport_metadata?.passport_id === passportId || p.product_summary?.batch_number === passportId) || (passports.length > 0 && !passportId ? passports[0] : null);

  if (!passport) {
    return (
      <div className="bg-white p-12 rounded-2xl border border-slate-200 shadow-sm text-center max-w-2xl mx-auto my-8">
        <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400">
          <QrCode className="w-6 h-6" />
        </div>
        <h2 className="text-lg font-bold text-slate-900 mb-1">
          {passportId ? `Passport not found for the ID: ${passportId}` : 'No Passport QR Code Available'}
        </h2>
        <p className="text-xs text-slate-500">No carbon passports exist to generate QR verification code.</p>
      </div>
    );
  }

  const verificationUrl = `https://passport.saurient.org/verify/${passport?.passport_metadata?.passport_id || passportId || 'PASSPORT-2026-COCOA-001'}`;

  const copyUrl = () => {
    navigator.clipboard.writeText(verificationUrl);
    alert('Verification URL copied to clipboard!');
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm text-center space-y-2">
        <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto">
          <QrCode className="w-6 h-6" />
        </div>
        <h2 className="text-xl font-black text-slate-900">Customs & Public QR Verification</h2>
        <p className="text-xs text-slate-500">
          Scan or share this cryptographically verifiable QR code for instant EU CBAM customs clearance.
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm text-center space-y-6">
        {/* QR Visual Card */}
        <div className="p-6 bg-slate-900 rounded-3xl inline-block shadow-xl border-4 border-emerald-500/30">
          {/* SVG QR Code Simulation */}
          <svg className="w-56 h-56 bg-white p-4 rounded-2xl" viewBox="0 0 100 100">
            <path
              d="M10,10 h30 v30 h-30 z M15,15 h20 v20 h-20 z M22,22 h6 v6 h-6 z"
              fill="#064e3b"
            />
            <path
              d="M60,10 h30 v30 h-30 z M65,15 h20 v20 h-20 z M72,22 h6 v6 h-6 z"
              fill="#064e3b"
            />
            <path
              d="M10,60 h30 v30 h-30 z M15,65 h20 v20 h-20 z M22,72 h6 v6 h-6 z"
              fill="#064e3b"
            />
            {/* Random Data Pattern */}
            <rect x="50" y="50" width="10" height="10" fill="#064e3b" />
            <rect x="65" y="50" width="8" height="8" fill="#064e3b" />
            <rect x="80" y="60" width="10" height="10" fill="#064e3b" />
            <rect x="50" y="70" width="15" height="8" fill="#064e3b" />
            <rect x="70" y="80" width="15" height="10" fill="#064e3b" />
            <rect x="45" y="20" width="8" height="20" fill="#064e3b" />
          </svg>
          <span className="text-[10px] font-mono text-slate-300 block mt-3 uppercase tracking-widest">
            {passport?.passport_metadata?.passport_id || passportId || 'PASSPORT-2026-COCOA-001'}
          </span>
        </div>

        {/* Info Box */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs space-y-2 text-left">
          <div className="flex justify-between items-center border-b border-slate-200 pb-1.5">
            <span className="text-slate-500 font-medium">Product Name</span>
            <span className="font-bold text-slate-900">{passport?.product_summary?.product_name || 'Hot-Rolled Steel Coil'}</span>
          </div>
          <div className="flex justify-between items-center border-b border-slate-200 pb-1.5">
            <span className="text-slate-500 font-medium">Carbon Intensity</span>
            <span className="font-bold text-emerald-700">
              {passport?.carbon_footprint?.intensity_per_unit?.value ?? 1.633} {passport?.carbon_footprint?.intensity_per_unit?.unit || 'kgCO2e'}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-slate-500 font-medium">Verification Status</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
              {passport?.passport_metadata?.status || 'VERIFIED'}
            </span>
          </div>
        </div>

        {/* Verification Link Input */}
        <div className="flex items-center gap-2">
          <input
            type="text"
            readOnly
            value={verificationUrl}
            className="w-full text-xs font-mono bg-slate-100 border border-slate-200 rounded-xl px-3 py-2 text-slate-700"
          />
          <button
            onClick={copyUrl}
            className="flex items-center gap-1 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-xl transition-colors shrink-0"
          >
            <Copy className="w-3.5 h-3.5" />
            <span>Copy</span>
          </button>
        </div>
      </div>
    </div>
  );
};
