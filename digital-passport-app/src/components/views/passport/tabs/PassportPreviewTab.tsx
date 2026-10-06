import React from 'react';
import { useSearchParams, useParams, useNavigate } from 'react-router-dom';
import { Leaf, Award, ShieldCheck, QrCode, FileText, ArrowRight, Printer } from 'lucide-react';
import type { RichDigitalPassport } from '../../../../types';

interface PassportPreviewTabProps {
  passports: RichDigitalPassport[];
}

export const PassportPreviewTab: React.FC<PassportPreviewTabProps> = ({ passports }) => {
  const { passportId: pathPassportId } = useParams<{ passportId?: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const passportId = pathPassportId || searchParams.get('id');

  const passport =
    passports.find(
      (p) =>
        p.passport_metadata?.passport_id === passportId ||
        p.product_summary?.batch_number === passportId
    ) || (passports.length > 0 && !passportId ? passports[0] : null);

  if (!passport) {
    return (
      <div className="bg-white p-12 rounded-2xl border border-slate-200 shadow-sm text-center max-w-2xl mx-auto my-8">
        <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400">
          <FileText className="w-6 h-6" />
        </div>
        <h2 className="text-lg font-bold text-slate-900 mb-1">
          {passportId ? `Passport not found for the ID: ${passportId}` : 'No Passport Preview Available'}
        </h2>
        <p className="text-xs text-slate-500 mb-6">No passport was found to generate certificate preview.</p>
        <button
          onClick={() => navigate('/passport')}
          className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition"
        >
          Passport Registry
        </button>
      </div>
    );
  }

  const issuedAt =
    (passport as any)?.audit_trail?.issued_at ||
    passport?.passport_metadata?.issuance_date ||
    '2026-03-28T10:00:00Z';

  const prod = {
    product_name: passport?.product_summary?.product_name || 'Hot-Rolled Steel Coil',
    producer_organization: passport?.product_summary?.producer_organization || (() => {
      const regCompStr = localStorage.getItem('saurient_registered_company');
      if (regCompStr) {
        try { return JSON.parse(regCompStr).legalName; } catch (e) {}
      }
      return 'Saurient Carbon Passport';
    })(),
    batch_number: passport?.product_summary?.batch_number || 'ST-2026-00981',
    quantity: passport?.product_summary?.batch_size?.quantity ?? (passport?.product_summary as any)?.quantity ?? 10000,
    unit: passport?.product_summary?.batch_size?.unit ?? (passport?.product_summary as any)?.unit ?? 'kg',
    facility_name: passport?.product_summary?.facility?.name || 'Hyderabad Manufacturing Facility',
    country_of_origin: passport?.product_summary?.facility?.country_of_origin || 'India',
    hs_code: passport?.product_summary?.hs_code || '7208 39 00',
  };

  const footprint = {
    intensity_value: passport?.carbon_footprint?.intensity_per_unit?.value ?? 1.633,
    intensity_unit: passport?.carbon_footprint?.intensity_per_unit?.unit || 'kg CO2e/kg',
    total_emissions: passport?.carbon_footprint?.total_batch_footprint_kg_co2e ?? 16330,
  };

  const verifier = {
    body: (passport as any)?.verification?.verifier_body || passport?.methodology_and_audit?.verification_body || 'Meridian Assurance Ltd',
    statement_id: (passport as any)?.verification?.verification_statement_id || passport?.methodology_and_audit?.verification_id || 'ST-VER-2026-0981',
    assurance_level: (passport as any)?.verification?.assurance_level || passport?.methodology_and_audit?.assurance_level || 'Reasonable Assurance',
  };

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
            onClick={() => {
              const targetId = passport?.passport_metadata?.passport_id;
              if (targetId) navigate(`/passport/sign-issue?id=${targetId}`);
              else navigate('/passport/sign-issue');
            }}
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
          <div className="flex items-start gap-4">
            <img
              src="/saurient-logo.png"
              alt="Saurient Platform Logo"
              className="w-20 h-20 md:w-24 md:h-24 object-contain rounded-2xl drop-shadow-md shrink-0"
            />
            <div className="space-y-1">
              <span className="text-[10px] font-black uppercase tracking-widest text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md">
                EU CBAM Compliant Digital Carbon Passport
              </span>
              <h1 className="text-2xl font-black text-slate-900 pt-1">{prod.product_name}</h1>
              <p className="text-xs text-slate-500 font-medium">
                Produced by <span className="font-bold text-slate-800">{prod.producer_organization}</span>
              </p>
            </div>
          </div>

          <div className="text-right space-y-1">
            <span className="text-[10px] font-mono text-slate-400 block">PASSPORT ID</span>
            <span className="text-xs font-mono font-bold text-slate-900 bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200 block">
              {passport?.passport_metadata?.passport_id || 'N/A'}
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
              <span className="text-4xl font-black">{footprint.intensity_value}</span>
              <span className="text-xs font-bold text-emerald-200">{footprint.intensity_unit}</span>
            </div>
            <div className="pt-2 border-t border-emerald-500/40 text-xs text-emerald-100 flex items-center justify-between">
              <span>Total Batch Emissions</span>
              <span className="font-bold text-white">{footprint.total_emissions.toLocaleString()} kgCO2e</span>
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
                <span className="font-bold text-slate-800">{verifier.body}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Statement:</span>
                <span className="font-mono font-bold text-slate-800">{verifier.statement_id}</span>
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
              <span className="font-bold text-slate-800">{prod.facility_name} ({prod.country_of_origin})</span>
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
            Issued: {new Date(issuedAt).toLocaleDateString()}
          </div>
        </div>
      </div>
    </div>
  );
};
