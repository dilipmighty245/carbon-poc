import React, { useRef, useState } from 'react';
import { PassportQrCode } from '../../../common/PassportQrCode';
import { getPassportVerificationUrl, isPassportPublic } from '../../../../utils/passportQr';
import { useSearchParams, useParams } from 'react-router-dom';
import { QrCode, Copy, Download, ExternalLink } from 'lucide-react';
import type { RichDigitalPassport } from '../../../../types';

interface QrVerificationTabProps {
  passports: RichDigitalPassport[];
}

export const QrVerificationTab: React.FC<QrVerificationTabProps> = ({ passports }) => {
  const [searchParams] = useSearchParams();
  const { passportId: pathPassportId } = useParams();
  const passportId = pathPassportId || searchParams.get('id');
  const qrRef = useRef<SVGSVGElement>(null);
  const [copyStatus, setCopyStatus] = useState('');
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

  if (!isPassportPublic(passport.passport_metadata?.status)) {
    return <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center space-y-2">
      <h2 className="text-lg font-bold text-slate-900">Passport not yet public</h2>
      <p className="text-sm text-slate-600">QR codes and public sharing are available after independent verification, issuance, and submission to the agency.</p>
      <p className="text-xs text-slate-500">Current status: {passport.passport_metadata?.status || 'Draft'}</p>
    </div>;
  }

  const id = passport.passport_metadata.passport_id;
  const verificationUrl = getPassportVerificationUrl(id);
  const isLoopback = ['localhost', '127.0.0.1', '[::1]'].includes(new URL(verificationUrl).hostname);

  const copyUrl = async () => {
    try {
      await navigator.clipboard.writeText(verificationUrl);
      setCopyStatus('Verification URL copied.');
    } catch {
      setCopyStatus('Copy unavailable. Select and copy the URL above.');
    }
  };

  const downloadQr = () => {
    if (!qrRef.current) return;
    const blob = new Blob([new XMLSerializer().serializeToString(qrRef.current)], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `passport-${id.replace(/[^a-zA-Z0-9_-]/g, '_')}-qr.svg`;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm text-center space-y-2">
        <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto">
          <QrCode className="w-6 h-6" />
        </div>
        <h2 className="text-xl font-black text-slate-900">Customs & Public QR Verification</h2>
        <p className="text-xs text-slate-500">
          Scan with your phone camera to view this passport and its recorded verification status.
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-8 shadow-sm text-center space-y-6">
        {/* QR Visual Card */}
        <div className="p-4 sm:p-6 max-w-full bg-slate-900 rounded-3xl inline-block shadow-xl border-4 border-emerald-500/30">
          <PassportQrCode ref={qrRef} value={verificationUrl} size={256}
            title={`View carbon passport ${id}`}
            data-testid="passport-qr" className="max-w-full h-auto" />
          <span className="text-[10px] font-mono text-slate-300 break-all block mt-3 uppercase tracking-widest">
            {id}
          </span>
        </div>

        {isLoopback && <p className="text-xs text-amber-800 bg-amber-50 p-3 rounded-xl">
          This link only opens on this computer. To scan from a phone, open the app using its shared website address or your computer’s network address on the same Wi-Fi.
        </p>}
        <div className="flex flex-wrap justify-center gap-4 text-xs font-bold text-emerald-700">
          <a href={verificationUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1"><ExternalLink size={16} /> Open passport</a>
          <button onClick={downloadQr} className="inline-flex items-center gap-1"><Download size={16} /> Download QR (SVG)</button>
        </div>
        {/* Info Box */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs space-y-2 text-left">
          <div className="flex justify-between items-center border-b border-slate-200 pb-1.5">
            <span className="text-slate-500 font-medium">Product Name</span>
            <span className="font-bold text-slate-900">{passport?.product_summary?.product_name || 'Not recorded'}</span>
          </div>
          <div className="flex justify-between items-center border-b border-slate-200 pb-1.5">
            <span className="text-slate-500 font-medium">Carbon Intensity</span>
            <span className="font-bold text-emerald-700">
              {passport?.carbon_footprint?.intensity_per_unit?.value ?? '—'} {passport?.carbon_footprint?.intensity_per_unit?.unit || 'kgCO2e'}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-slate-500 font-medium">Verification Status</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
              {passport?.passport_metadata?.status || 'Not recorded'}
            </span>
          </div>
        </div>

        {/* Verification Link Input */}
        <div className="flex items-center gap-2">
          <input
            aria-label="Verification URL"
            type="text"
            readOnly
            value={verificationUrl}
            className="min-w-0 w-full text-xs font-mono bg-slate-100 border border-slate-200 rounded-xl px-3 py-2 text-slate-700"
          />
          <button
            onClick={copyUrl}
            className="flex items-center gap-1 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-xl transition-colors shrink-0"
          >
            <Copy className="w-3.5 h-3.5" />
            <span>Copy</span>
          </button>
        </div>
        <p role="status" className="text-xs text-slate-600">{copyStatus}</p>
      </div>
    </div>
  );
};
