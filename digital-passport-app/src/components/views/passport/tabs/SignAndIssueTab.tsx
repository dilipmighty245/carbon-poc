import React, { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { KeyRound, ShieldCheck, CheckCircle2, Lock, ArrowRight, Loader2 } from 'lucide-react';
import type { RichDigitalPassport } from '../../../../types';

interface SignAndIssueTabProps {
  passports: RichDigitalPassport[];
}

export const SignAndIssueTab: React.FC<SignAndIssueTabProps> = ({ passports }) => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const passportId = searchParams.get('id');

  const passport = passports.find((p) => p.passport_metadata?.passport_id === passportId || p.product_summary?.batch_number === passportId) || (passports.length > 0 && !passportId ? passports[0] : null);

  if (!passport) {
    return (
      <div className="bg-white p-12 rounded-2xl border border-slate-200 shadow-sm text-center max-w-2xl mx-auto my-8">
        <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400">
          <Lock className="w-6 h-6" />
        </div>
        <h2 className="text-lg font-bold text-slate-900 mb-1">
          {passportId ? `Passport not found for the ID: ${passportId}` : 'No Passport Available to Issue'}
        </h2>
        <p className="text-xs text-slate-500 mb-6 max-w-md mx-auto">
          No carbon passport is ready for signing and issuance. Please create a product batch and complete MRV verification first.
        </p>
        <button
          onClick={() => navigate('/products/new')}
          className="px-4 py-2 bg-[#00E599] hover:bg-[#00c985] text-slate-950 font-bold text-xs rounded-xl transition"
        >
          Register Product Batch
        </button>
      </div>
    );
  }

  const [signingKey, setSigningKey] = useState('0xKEY-ORATOR-PROD-SECURE-ED25519-88492');
  const [authorizedSigner, setAuthorizedSigner] = useState('Dr. Elena Rostova (Chief Sustainability Officer)');
  const [isSigning, setIsSigning] = useState(false);
  const [isSigned, setIsSigned] = useState(passport?.passport_metadata?.status === 'VERIFIED');

  const handleSign = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSigning(true);
    setTimeout(() => {
      setIsSigning(false);
      setIsSigned(true);
    }, 1500);
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-2">
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">
          Cryptographic Digital Signature & Registry Publishing
        </span>
        <h2 className="text-xl font-black text-slate-900">Sign & Issue Carbon Passport</h2>
        <p className="text-xs text-slate-500">
          Apply organizational private keys to mint and publish immutable passport credentials for customs verification.
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6">
        {/* Passport Target Summary */}
        <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2 text-xs">
          <div className="flex justify-between items-center border-b border-slate-200 pb-2">
            <span className="font-bold text-slate-500">Target Product</span>
            <span className="font-bold text-slate-900">{passport?.product_summary?.product_name || 'Hot-Rolled Steel Coil'}</span>
          </div>
          <div className="flex justify-between items-center border-b border-slate-200 pb-2">
            <span className="font-bold text-slate-500">Batch ID</span>
            <span className="font-mono text-slate-900">{passport?.product_summary?.batch_number || 'ST-2026-00981'}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="font-bold text-slate-500">Dataset Lock Hash</span>
            <span className="font-mono text-emerald-700 font-bold">
              {(passport as any)?.audit_trail?.dataset_lock_hash || passport?.passport_metadata?.cryptographic_hash || '0x8849201f99c2d104'}
            </span>
          </div>
        </div>

        {isSigned ? (
          <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-6 text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-emerald-600 text-white flex items-center justify-center mx-auto shadow-xs">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-emerald-950">Passport Successfully Signed & Published!</h3>
              <p className="text-xs text-emerald-800 mt-1">
                Digital Carbon Passport ID <span className="font-mono font-bold">{passport?.passport_metadata?.passport_id || passportId || 'N/A'}</span> is live on the registry.
              </p>
            </div>

            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                onClick={() => {
                  const targetId = passport?.passport_metadata?.passport_id || passportId;
                  if (targetId) navigate(`/passport/detail/${targetId}`);
                  else navigate('/passport/registry');
                }}
                className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl transition-colors"
              >
                View Passport Details
              </button>
              <button
                onClick={() => {
                  const targetId = passport?.passport_metadata?.passport_id || passportId;
                  if (targetId) navigate(`/passport/qr?id=${targetId}`);
                  else navigate('/passport/registry');
                }}
                className="px-4 py-2 bg-white text-emerald-900 border border-emerald-300 font-bold text-xs rounded-xl hover:bg-emerald-100 transition-colors"
              >
                Get Verification QR
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSign} className="space-y-4 text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Authorized Signer Identity</label>
              <input
                type="text"
                value={authorizedSigner}
                onChange={(e) => setAuthorizedSigner(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                required
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Organizational Key Identifier</label>
              <div className="relative">
                <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={signingKey}
                  onChange={(e) => setSigningKey(e.target.value)}
                  className="w-full font-mono bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  required
                />
              </div>
            </div>

            <div className="pt-4">
              <button
                type="submit"
                disabled={isSigning}
                className="w-full flex items-center justify-center gap-2 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs shadow-md transition-colors disabled:opacity-50"
              >
                {isSigning ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Minting & Signing Passport...</span>
                  </>
                ) : (
                  <>
                    <Lock className="w-4 h-4" />
                    <span>Authorize Digital Signature & Issue</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
