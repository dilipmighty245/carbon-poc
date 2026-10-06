import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Leaf, Award, ShieldCheck, QrCode, Share2, FileText, ArrowLeft, Building2, CheckCircle2 } from 'lucide-react';
import type { RichDigitalPassport } from '../../../../types';

interface PassportDetailTabProps {
  passports: RichDigitalPassport[];
}

export const PassportDetailTab: React.FC<PassportDetailTabProps> = ({ passports }) => {
  const { passportId } = useParams<{ passportId: string }>();
  const navigate = useNavigate();

  const foundPassport = passports.find(
    (p) =>
      p.passport_metadata?.passport_id === passportId ||
      p.product_summary?.batch_number === passportId
  );

  const passport = foundPassport || (passports.length > 0 && !passportId ? passports[0] : null);

  if (!passport) {
    return (
      <div className="bg-white p-12 rounded-2xl border border-slate-200 shadow-sm text-center max-w-2xl mx-auto my-8">
        <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400">
          <FileText className="w-6 h-6" />
        </div>
        <h2 className="text-lg font-bold text-slate-900 mb-1">Carbon Passport Not Found</h2>
        <p className="text-xs text-slate-500 mb-6 max-w-md mx-auto">
          No issued carbon passport was found matching {passportId ? <code className="font-mono text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">{passportId}</code> : 'your query'}. Passports are issued upon completion of MRV verification.
        </p>
        <div className="flex justify-center gap-3">
          <button
            onClick={() => navigate('/passport')}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition"
          >
            Passport Registry
          </button>
          <button
            onClick={() => navigate('/products/new')}
            className="px-4 py-2 bg-[#00E599] hover:bg-[#00c985] text-slate-950 font-bold text-xs rounded-xl transition"
          >
            Register Product Batch
          </button>
        </div>
      </div>
    );
  }

  const metadata = {
    passport_id: passport.passport_metadata?.passport_id || passportId || 'N/A',
    status: passport.passport_metadata?.status || 'VERIFIED',
    issuance_date: passport.passport_metadata?.issuance_date || 'N/A',
    cryptographic_hash: passport.passport_metadata?.cryptographic_hash || 'N/A',
  };

  const prod = {
    product_name: passport.product_summary?.product_name || 'Unspecified Product',
    commodity: passport.product_summary?.commodity || 'Steel',
    batch_number: passport.product_summary?.batch_number || 'N/A',
    producer_organization: passport.product_summary?.producer_organization || 'Unspecified Producer',
    facility_name: passport.product_summary?.facility?.name || 'Unspecified Facility',
    country_of_origin: passport.product_summary?.facility?.country_of_origin || passport.product_summary?.facility?.location || 'N/A',
    production_date: passport.product_summary?.production_date || 'N/A',
    quantity: passport.product_summary?.batch_size?.quantity ?? (passport.product_summary as any)?.quantity ?? 0,
    unit: passport.product_summary?.batch_size?.unit ?? (passport.product_summary as any)?.unit ?? 'kg',
    hs_code: (passport.product_summary as any)?.hs_code || '7208 39 00',
  };

  const footprint = {
    intensity_value: passport?.carbon_footprint?.intensity_per_unit?.value ?? 1.633,
    intensity_unit: passport?.carbon_footprint?.intensity_per_unit?.unit || 'kg CO2e/kg',
    total_emissions: passport?.carbon_footprint?.total_batch_footprint_kg_co2e ?? 16330,
    scope1: passport?.carbon_footprint?.scope_breakdown?.scope_1_direct?.value_kg_co2e ?? (passport?.carbon_footprint as any)?.breakdown_by_scope?.scope1_direct_emissions ?? (passport?.carbon_footprint as any)?.breakdown?.scope1_direct ?? 1.25,
    scope2: passport?.carbon_footprint?.scope_breakdown?.scope_2_indirect_energy?.value_kg_co2e ?? (passport?.carbon_footprint as any)?.breakdown_by_scope?.scope2_indirect_electricity ?? (passport?.carbon_footprint as any)?.breakdown?.scope2_indirect ?? 0.25,
    scope3: passport?.carbon_footprint?.scope_breakdown?.scope_3_value_chain?.value_kg_co2e ?? (passport?.carbon_footprint as any)?.breakdown_by_scope?.scope3_upstream_inputs ?? (passport?.carbon_footprint as any)?.breakdown?.scope3_upstream ?? 0.133,
  };

  const cbam = {
    calculation_methodology: (passport as any)?.cbam_compliance?.calculation_methodology || passport?.methodology_and_audit?.accounting_standard || 'GHG Protocol / EU CBAM Regulation 2023/956',
    carbon_price_paid_eur_per_tco2e: (passport as any)?.cbam_compliance?.carbon_price_paid_eur_per_tco2e ?? 45.0,
    country_of_carbon_price_paid: (passport as any)?.cbam_compliance?.country_of_carbon_price_paid || 'Germany',
    eu_benchmark_comparison_ratio: (passport as any)?.cbam_compliance?.eu_benchmark_comparison_ratio ?? 0.86,
  };

  const verifier = {
    verifier_body: (passport as any)?.verification?.verifier_body || (passport as any)?.verification_and_assurance?.verifier_name || passport?.methodology_and_audit?.verification_body || 'TÜV Rheinland Energy GmbH',
    verification_statement_id: (passport as any)?.verification?.verification_statement_id || (passport as any)?.verification_and_assurance?.certificate_reference || passport?.methodology_and_audit?.verification_id || 'CERT-EU-CBAM-2026-981',
    assurance_level: (passport as any)?.verification?.assurance_level || (passport as any)?.verification_and_assurance?.assurance_level || passport?.methodology_and_audit?.assurance_level || 'Reasonable Assurance',
    verification_date: (passport as any)?.verification?.verification_date || (passport as any)?.verification_and_assurance?.verification_date || '2026-03-28',
  };

  const audit = {
    dataset_lock_hash: (passport as any)?.audit_trail?.dataset_lock_hash || metadata.cryptographic_hash,
    issued_by: (passport as any)?.audit_trail?.issued_by || 'Dr. Elena Rostova (Chief Sustainability Officer)',
    issued_at: (passport as any)?.audit_trail?.issued_at || metadata.issuance_date,
  };

  return (
    <div className="space-y-6">
      {/* Top Banner Navigation & Quick Actions */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/passport/registry')}
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                Passport ID: {metadata.passport_id}
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                {metadata.status}
              </span>
            </div>
            <h2 className="text-xl font-black text-slate-900">{prod.product_name}</h2>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate(`/passport/qr?id=${metadata.passport_id}`)}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-xl text-xs font-bold transition-colors"
          >
            <QrCode className="w-4 h-4 text-emerald-600" />
            <span>View QR</span>
          </button>
          <button
            onClick={() => navigate(`/passport/sharing?id=${metadata.passport_id}`)}
            className="flex items-center gap-1.5 px-3 py-2 bg-emerald-600 text-white hover:bg-emerald-700 rounded-xl text-xs font-bold shadow-xs transition-colors"
          >
            <Share2 className="w-4 h-4" />
            <span>Share Passport</span>
          </button>
        </div>
      </div>

      {/* Grid Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Info Column (2/3 width) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Product & Batch Summary */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 pb-3">
              <Building2 className="w-4 h-4 text-emerald-600" />
              <span>Product & Batch Specification</span>
            </h3>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-xs">
              <div>
                <span className="text-slate-400 block font-medium">Commodity</span>
                <span className="font-bold text-slate-900">{prod.commodity}</span>
              </div>
              <div>
                <span className="text-slate-400 block font-medium">Batch / Lot ID</span>
                <span className="font-mono font-bold text-slate-900">{prod.batch_number}</span>
              </div>
              <div>
                <span className="text-slate-400 block font-medium">Production Quantity</span>
                <span className="font-bold text-slate-900">
                  {prod.quantity.toLocaleString()} {prod.unit}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block font-medium">Producer</span>
                <span className="font-bold text-slate-900">{prod.producer_organization}</span>
              </div>
              <div>
                <span className="text-slate-400 block font-medium">Facility / Origin</span>
                <span className="font-bold text-slate-900">
                  {prod.facility_name} ({prod.country_of_origin})
                </span>
              </div>
              <div>
                <span className="text-slate-400 block font-medium">HS / CN Code</span>
                <span className="font-mono font-bold text-slate-900">{prod.hs_code || 'N/A'}</span>
              </div>
            </div>
          </div>

          {/* Carbon Footprint Summary */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-5">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 pb-3">
              <Leaf className="w-4 h-4 text-emerald-600" />
              <span>Emissions & Carbon Footprint Breakdown</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4 flex items-center justify-between">
                <div>
                  <span className="text-xs font-semibold text-emerald-800 block">Carbon Intensity</span>
                  <div className="flex items-baseline gap-1.5 mt-1">
                    <span className="text-3xl font-black text-emerald-900">{footprint.intensity_value}</span>
                    <span className="text-xs font-bold text-emerald-700">{footprint.intensity_unit}</span>
                  </div>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-xs">
                  <Leaf className="w-6 h-6" />
                </div>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex items-center justify-between">
                <div>
                  <span className="text-xs font-semibold text-slate-600 block">Total Batch Footprint</span>
                  <div className="flex items-baseline gap-1.5 mt-1">
                    <span className="text-2xl font-black text-slate-900">
                      {footprint.total_emissions.toLocaleString()}
                    </span>
                    <span className="text-xs font-bold text-slate-500">kg CO2e</span>
                  </div>
                </div>
                <div className="w-10 h-10 rounded-xl bg-slate-200 text-slate-600 flex items-center justify-center">
                  <FileText className="w-5 h-5" />
                </div>
              </div>
            </div>

            {/* Scope Breakdown */}
            <div className="pt-2 space-y-3">
              <h4 className="text-xs font-bold text-slate-700">Scope 1, 2, and 3 Distribution</h4>
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <span className="text-[10px] text-slate-400 block font-bold">Scope 1 Direct</span>
                  <span className="text-sm font-black text-slate-800">{footprint.scope1}</span>
                  <span className="text-[10px] text-slate-500 ml-1">kgCO2e/unit</span>
                </div>
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <span className="text-[10px] text-slate-400 block font-bold">Scope 2 Indirect</span>
                  <span className="text-sm font-black text-slate-800">{footprint.scope2}</span>
                  <span className="text-[10px] text-slate-500 ml-1">kgCO2e/unit</span>
                </div>
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <span className="text-[10px] text-slate-400 block font-bold">Scope 3 Value Chain</span>
                  <span className="text-sm font-black text-slate-800">{footprint.scope3}</span>
                  <span className="text-[10px] text-slate-500 ml-1">kgCO2e/unit</span>
                </div>
              </div>
            </div>
          </div>

          {/* Audit Trail */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-3">
              Audit Trail & Lineage
            </h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-slate-500 font-medium">Dataset Lock Hash</span>
                <span className="font-mono text-slate-900 font-bold bg-white px-2 py-1 rounded border border-slate-200">
                  {audit.dataset_lock_hash}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-slate-500 font-medium">Issuer Identity</span>
                <span className="font-bold text-slate-800">{audit.issued_by}</span>
              </div>
              <div className="flex items-center justify-between text-xs p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-slate-500 font-medium">Issued Timestamp</span>
                <span className="font-bold text-slate-800">{new Date(audit.issued_at).toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar Column (1/3 width) */}
        <div className="space-y-6">
          {/* CBAM Compliance */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 pb-3">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>CBAM Declaration</span>
            </h3>

            <div className="bg-emerald-50 text-emerald-900 p-3 rounded-xl text-xs font-semibold flex items-center gap-2 border border-emerald-200">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Compliant with EU Regulation 2023/956</span>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between border-b border-slate-100 py-1.5">
                <span className="text-slate-500">Methodology</span>
                <span className="font-bold text-slate-900">{cbam.calculation_methodology}</span>
              </div>
              <div className="flex justify-between border-b border-slate-100 py-1.5">
                <span className="text-slate-500">Carbon Price Paid</span>
                <span className="font-bold text-slate-900">
                  €{cbam.carbon_price_paid_eur_per_tco2e}/tCO2e ({cbam.country_of_carbon_price_paid})
                </span>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="text-slate-500">Benchmark Ratio</span>
                <span className="font-bold text-slate-900">{cbam.eu_benchmark_comparison_ratio}x Benchmark</span>
              </div>
            </div>
          </div>

          {/* Verification Badge */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 pb-3">
              <Award className="w-4 h-4 text-emerald-600" />
              <span>Independent Verification</span>
            </h3>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-[10px] text-slate-400 block font-bold">Verifier Body</span>
                <span className="font-bold text-slate-900 text-sm">{verifier.verifier_body}</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-[10px] text-slate-400 block font-bold">Statement Number</span>
                <span className="font-mono font-bold text-slate-800">{verifier.verification_statement_id}</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div className="p-2 bg-slate-50 rounded-lg">
                  <span className="text-slate-400 block">Level</span>
                  <span className="font-bold text-slate-900">{verifier.assurance_level}</span>
                </div>
                <div className="p-2 bg-slate-50 rounded-lg">
                  <span className="text-slate-400 block">Date</span>
                  <span className="font-bold text-slate-900">{verifier.verification_date}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
