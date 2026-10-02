import React from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Leaf, Award, ShieldCheck, QrCode, FileText, ArrowRight, Printer } from 'lucide-react';
import type { RichDigitalPassport } from '../../../../types';

interface PassportPreviewTabProps {
  passports: RichDigitalPassport[];
}

export const PassportPreviewTab: React.FC<PassportPreviewTabProps> = ({ passports }) => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const passportId = searchParams.get('id');

  const passport = passports.find((p) => p.passport_metadata.passport_id === passportId) || passports[0];

  if (!passport) {
    return (
      <div className="p-8 text-center bg-white rounded-2xl border border-slate-200 shadow-sm max-w-xl mx-auto">
        <h3 className="text-base font-bold text-slate-900">No Passport Selected for Preview</h3>
      </div>
    );
  }

  const prod = passport.product_summary;
  const footprint = passport.carbon_footprint;
  const verifier = passport.verification;

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200 uppercase tracking-widest">
            Pre-Issuance Watermark Preview
          </span>
          <h2 className="text-xl font-black text-slate-900 mt-1">Digital Carbon Passport Certificate</h2>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors"
          >
            <Printer className="w-4 h-4" />
            <span>Print PDF</span>
          </button>
          <button
            onClick={() => navigate(`/passport/sign-issue?id=${passport.passport_metadata.passport_id}`)}
            className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors shadow-xs"
          >
            <span>Proceed to Sign & Issue</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Styled Digital Passport Card Artifact */}
      <div className="bg-white rounded-3xl border-2 border-emerald-600/30 p-8 shadow-xl max-w-3xl mx-auto space-y-8 relative overflow-hidden">
        {/* Watermark Background */}
        <div className="absolute -right-20 -bottom-20 opacity-5 pointer-events-none text-emerald-950">
          <Leaf className="w-96 h-96" />
        </div>

        {/* Passport Header */}
        <div className="flex items-start justify-between border-b-2 border-emerald-100 pb-6">
          <div className="space-y-1">
            <span className="text-[10px] font-black uppercase tracking-widest text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md">
              EU CBAM Compliant Digital Carbon Passport
            </span>
            <h1 className="text-2xl font-black text-slate-900 pt-1">{prod.product_name}</h1>
            <p className="text-xs text-slate-500 font-medium">
              Produced by <span className="font-bold text-slate-800">{prod.producer_organization}</span>
            </p>
          </div>

          <div className="text-right space-y-1">
            <span className="text-[10px] font-mono text-slate-400 block">PASSPORT ID</span>
            <span className="text-xs font-mono font-bold text-slate-900 bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200 block">
              {passport.passport_metadata.passport_id}
            </span>
          </div>
        </div>

        {/* Main Grid: Carbon Intensity & Key Data */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Carbon Highlight */}
          <div className="bg-gradient-to-br from-emerald-600 to-teal-800 rounded-2xl p-6 text-white shadow-md space-y-3">
            <span className="text-[11px] font-bold text-emerald-200 uppercase tracking-wider block">
              Verified Carbon Intensity
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-black">{footprint.intensity_per_unit.value}</span>
              <span className="text-xs font-bold text-emerald-200">{footprint.intensity_per_unit.unit}</span>
            </div>
            <div className="pt-2 border-t border-emerald-500/40 text-xs text-emerald-100 flex items-center justify-between">
              <span>Total Batch Emissions</span>
              <span className="font-bold text-white">{footprint.total_batch_footprint_kg_co2e.toLocaleString()} kgCO2e</span>
            </div>
          </div>

          {/* Verification Badge */}
          <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200 space-y-3">
            <div className="flex items-center gap-2 text-emerald-800 font-bold text-xs">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Verified Assurance</span>
            </div>
            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">Body:</span>
                <span className="font-bold text-slate-800">{verifier.verifier_body}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Statement:</span>
                <span className="font-mono font-bold text-slate-800">{verifier.verification_statement_id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Level:</span>
                <span className="font-bold text-emerald-700">{verifier.assurance_level}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Details Table */}
        <div className="border border-slate-200 rounded-2xl overflow-hidden text-xs">
          <div className="bg-slate-100 px-4 py-2.5 font-bold text-slate-700 border-b border-slate-200">
            Batch & Production Metadata
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-y divide-slate-100 bg-white">
            <div className="p-3">
              <span className="text-[10px] text-slate-400 block font-medium">Batch Number</span>
              <span className="font-mono font-bold text-slate-800">{prod.batch_number}</span>
            </div>
            <div className="p-3">
              <span className="text-[10px] text-slate-400 block font-medium">Batch Quantity</span>
              <span className="font-bold text-slate-800">{prod.quantity.toLocaleString()} {prod.unit}</span>
            </div>
            <div className="p-3">
              <span className="text-[10px] text-slate-400 block font-medium">Facility / Origin</span>
              <span className="font-bold text-slate-800">{prod.facility.name} ({prod.facility.country_of_origin})</span>
            </div>
            <div className="p-3">
              <span className="text-[10px] text-slate-400 block font-medium">CN / HS Code</span>
              <span className="font-mono font-bold text-slate-800">{prod.hs_code || 'N/A'}</span>
            </div>
          </div>
        </div>

        {/* Footer Signature Seal */}
        <div className="flex items-center justify-between border-t border-slate-200 pt-6 text-xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-emerald-100 border border-emerald-300 flex items-center justify-center text-emerald-700">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <span className="font-bold text-slate-900 block">Digitally Signed & Sealed</span>
              <span className="text-[10px] text-slate-400">Cryptographic SHA-256 Lineage Hash</span>
            </div>
          </div>

          <div className="text-right font-mono text-[10px] text-slate-400">
            Issued: {new Date(passport.audit_trail.issued_at).toLocaleDateString()}
          </div>
        </div>
      </div>
    </div>
  );
};
