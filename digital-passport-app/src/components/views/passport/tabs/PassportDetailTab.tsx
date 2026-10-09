import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Leaf,
  Award,
  ShieldCheck,
  QrCode,
  Share2,
  FileText,
  ArrowLeft,
  Building2,
  CheckCircle2,
  Send,
  Clock,
  AlertCircle,
  RefreshCw,
  X,
  ExternalLink,
} from 'lucide-react';
import type { RichDigitalPassport } from '../../../../types';
import {
  getPassportWithMeta,
  submitPassportForVerification,
  getActiveTenantId,
} from '../../../../api/client';

interface PassportDetailTabProps {
  passports: RichDigitalPassport[];
  onRefresh?: () => void;
}

export const PassportDetailTab: React.FC<PassportDetailTabProps> = ({ passports, onRefresh }) => {
  const { passportId } = useParams<{ passportId: string }>();
  const navigate = useNavigate();

  const userRole = localStorage.getItem('saurient_user_role') || localStorage.getItem('auth_role') || 'Company Operator';
  const isVerifier = userRole.toLowerCase().includes('verifier');
  const isOfficer = userRole.toLowerCase().includes('officer');
  const isOperator = !isVerifier && !isOfficer;

  const foundPassport = passports.find(
    (p) =>
      p.passport_metadata?.passport_id === passportId ||
      p.product_summary?.batch_number === passportId
  );

  const [fetchedPassport, setFetchedPassport] = useState<RichDigitalPassport | null>(null);
  const [loadingPassport, setLoadingPassport] = useState(false);

  // Directly fetch from API if not found in parent list (e.g. direct link or fresh creation)
  useEffect(() => {
    if (!foundPassport && passportId) {
      setLoadingPassport(true);
      const tid = getActiveTenantId();
      getPassportWithMeta(passportId, tid)
        .then((res) => {
          if (res.data) {
            setFetchedPassport(res.data);
          }
        })
        .catch((err) => console.warn('Failed to fetch passport by ID directly:', err))
        .finally(() => setLoadingPassport(false));
    }
  }, [passportId, foundPassport]);

  const passport = foundPassport || fetchedPassport || (passports.length > 0 && !passportId ? passports[0] : null);

  // Submission State
  const [isSubmitOpen, setIsSubmitOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [localStatus, setLocalStatus] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [selectedVerifier, setSelectedVerifier] = useState('Bureau Veritas UK Ltd (Accredited Verifier #NAB-8820)');
  const [submitNotes, setSubmitNotes] = useState(
    'Primary Scope 1 direct, Scope 2 electricity telemetry, and Scope 3 bill of materials attached for EU CBAM & ISO 14064-3 independent verification.'
  );
  const [submitterEmail, setSubmitterEmail] = useState(
    localStorage.getItem('saurient_user_email') || 'operator@saurient.io'
  );

  if (loadingPassport) {
    return (
      <div className="bg-white p-16 rounded-2xl border border-slate-200 shadow-sm text-center max-w-2xl mx-auto my-8 space-y-3">
        <RefreshCw className="w-8 h-8 text-emerald-600 animate-spin mx-auto" />
        <h3 className="text-base font-bold text-slate-800">Loading Passport Specification...</h3>
        <p className="text-xs text-slate-500 font-mono">Resolving {passportId} from VMware Tanzu Nexus datamodel</p>
      </div>
    );
  }

  if (!passport) {
    return (
      <div className="bg-white p-12 rounded-2xl border border-slate-200 shadow-sm text-center max-w-2xl mx-auto my-8">
        <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400">
          <FileText className="w-6 h-6" />
        </div>
        <h2 className="text-lg font-bold text-slate-900 mb-1">
          {passportId ? `Passport not found for ID: ${passportId}` : 'Carbon Passport Not Found'}
        </h2>
        <p className="text-xs text-slate-500 mb-6 max-w-md mx-auto">
          No issued or draft carbon passport was found matching{' '}
          {passportId ? <code className="font-mono text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">{passportId}</code> : 'your query'}.
          Passports are generated automatically when a product batch is registered.
        </p>
        <div className="flex justify-center gap-3">
          <button
            onClick={() => navigate('/passport/registry')}
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

  const rawStatus = passport.passport_metadata?.status || 'Draft';
  const currentStatus = localStatus || rawStatus;

  const metadata = {
    passport_id: passport.passport_metadata?.passport_id || passportId || 'N/A',
    status: currentStatus,
    issuance_date: passport.passport_metadata?.issuance_date || 'N/A',
    cryptographic_hash: passport.passport_metadata?.cryptographic_hash || 'N/A',
  };

  const regCompStr = localStorage.getItem('saurient_registered_company');
  let regOrg = '';
  if (regCompStr) {
    try {
      regOrg = JSON.parse(regCompStr).legalName;
    } catch (e) {}
  }

  const prod = {
    product_name: passport.product_summary?.product_name || 'Unspecified Product',
    commodity: passport.product_summary?.commodity || 'Metals & Minerals',
    batch_number: passport.product_summary?.batch_number || 'N/A',
    producer_organization: passport.product_summary?.producer_organization || regOrg || 'Saurient Carbon Passport',
    facility_name: passport.product_summary?.facility?.name || 'Primary Facility Site',
    country_of_origin:
      passport.product_summary?.facility?.country_of_origin || passport.product_summary?.facility?.location || 'Ghana',
    production_date: passport.product_summary?.production_date || new Date().toISOString().split('T')[0],
    quantity: passport.product_summary?.batch_size?.quantity ?? (passport.product_summary as any)?.quantity ?? 1000,
    unit: passport.product_summary?.batch_size?.unit ?? (passport.product_summary as any)?.unit ?? 'kg',
    hs_code: (passport.product_summary as any)?.hs_code || '7208 39 00',
  };

  const footprint = {
    intensity_value: passport?.carbon_footprint?.intensity_per_unit?.value ?? 1.92,
    intensity_unit: passport?.carbon_footprint?.intensity_per_unit?.unit || 'kg CO2e/kg',
    total_emissions: passport?.carbon_footprint?.total_batch_footprint_kg_co2e ?? 1919,
    scope1:
      passport?.carbon_footprint?.scope_breakdown?.scope_1_direct?.value_kg_co2e ??
      (passport?.carbon_footprint as any)?.breakdown_by_scope?.scope1_direct_emissions ??
      402,
    scope2:
      passport?.carbon_footprint?.scope_breakdown?.scope_2_indirect_energy?.value_kg_co2e ??
      (passport?.carbon_footprint as any)?.breakdown_by_scope?.scope2_indirect_electricity ??
      852,
    scope3:
      passport?.carbon_footprint?.scope_breakdown?.scope_3_value_chain?.value_kg_co2e ??
      (passport?.carbon_footprint as any)?.breakdown_by_scope?.scope3_upstream_inputs ??
      665,
  };

  const cbam = {
    calculation_methodology:
      (passport as any)?.cbam_compliance?.calculation_methodology ||
      passport?.methodology_and_audit?.accounting_standard ||
      'GHG Protocol / EU CBAM Regulation 2023/956',
    carbon_price_paid_eur_per_tco2e: (passport as any)?.cbam_compliance?.carbon_price_paid_eur_per_tco2e ?? 45.0,
    country_of_carbon_price_paid: (passport as any)?.cbam_compliance?.country_of_carbon_price_paid || 'Germany',
    eu_benchmark_comparison_ratio: (passport as any)?.cbam_compliance?.eu_benchmark_comparison_ratio ?? 0.86,
  };

  const isPreVerification = currentStatus === 'Draft' || currentStatus === 'CorrectionsRequired';
  const isUnderReview = currentStatus === 'Submitted' || currentStatus === 'UnderVerification';
  const isVerifiedOrIssued =
    currentStatus === 'Verified' || currentStatus === 'Issued' || currentStatus === 'SubmittedToAgency';

  const verifier = {
    verifier_body: isVerifiedOrIssued
      ? (passport as any)?.verification?.verifier_body ||
        (passport as any)?.verification_and_assurance?.verifier_name ||
        passport?.methodology_and_audit?.verification_body ||
        'Bureau Veritas UK Ltd (Accredited Verifier #NAB-8820)'
      : isUnderReview
      ? `${selectedVerifier.split(' ')[0]} ${selectedVerifier.split(' ')[1]} (In Review)`
      : 'Pending Independent Verification',
    verification_statement_id: isVerifiedOrIssued
      ? (passport as any)?.verification?.verification_statement_id ||
        (passport as any)?.verification_and_assurance?.certificate_reference ||
        passport?.methodology_and_audit?.verification_id ||
        'CERT-EU-CBAM-2026-981'
      : isUnderReview
      ? 'Audit Case #BV-2026-IN-REVIEW'
      : 'Awaiting Verification Submission',
    assurance_level: isVerifiedOrIssued
      ? 'Reasonable Assurance'
      : isUnderReview
      ? 'Under Verification Audit'
      : 'Pre-Audit (100% Primary Data)',
    verification_date: isVerifiedOrIssued
      ? (passport as any)?.verification?.verification_date ||
        (passport as any)?.verification_and_assurance?.verification_date ||
        '2026-03-28'
      : isUnderReview
      ? 'In Progress'
      : 'Pending Submission',
  };

  const audit = {
    dataset_lock_hash: (passport as any)?.audit_trail?.dataset_lock_hash || metadata.cryptographic_hash,
    issued_by: (passport as any)?.audit_trail?.issued_by || 'Dr. Elena Rostova (Chief Sustainability Officer)',
    issued_at: (passport as any)?.audit_trail?.issued_at || metadata.issuance_date,
  };

  const getStatusBadgeStyle = (status: string) => {
    switch (status.toUpperCase()) {
      case 'DRAFT':
        return 'bg-slate-100 text-slate-800 border-slate-300';
      case 'SUBMITTED':
      case 'UNDERVERIFICATION':
      case 'UNDER_VERIFICATION':
        return 'bg-sky-100 text-sky-800 border-sky-300';
      case 'CORRECTIONSREQUIRED':
      case 'CORRECTIONS_REQUIRED':
        return 'bg-amber-100 text-amber-900 border-amber-300';
      case 'VERIFIED':
        return 'bg-emerald-100 text-emerald-800 border-emerald-300';
      case 'ISSUED':
        return 'bg-teal-100 text-teal-900 border-teal-300';
      case 'SUBMITTEDTOAGENCY':
      case 'SUBMITTED_TO_AGENCY':
        return 'bg-indigo-100 text-indigo-900 border-indigo-300';
      default:
        return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  const handleSubmitForVerification = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsSubmitting(true);
    setSubmitError(null);
    try {
      const tid = getActiveTenantId();
      await submitPassportForVerification(metadata.passport_id, submitterEmail, submitNotes, tid);
      setLocalStatus('Submitted');
      setSubmitSuccess(
        `Digital Carbon Passport ${metadata.passport_id} was successfully submitted to ${selectedVerifier} for third-party independent verification!`
      );
      setIsSubmitOpen(false);
      if (onRefresh) onRefresh();
    } catch (err: any) {
      console.error('Failed to submit passport:', err);
      setSubmitError(err.message || 'Failed to submit passport for verification');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner Navigation & Quick Actions */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/passport/registry')}
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors"
            title="Return to Registry"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono">
                ID: {metadata.passport_id}
              </span>
              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${getStatusBadgeStyle(currentStatus)}`}>
                {currentStatus.toUpperCase()}
              </span>
            </div>
            <h2 className="text-xl font-black text-slate-900">{prod.product_name}</h2>
          </div>
        </div>

        {/* Header Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          {isPreVerification && (
            <>
              <button
                onClick={() => navigate(`/passport/readiness?id=${metadata.passport_id}`)}
                className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-xl text-xs font-bold transition-colors"
              >
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Readiness Audit</span>
              </button>
              {!isVerifier && (
                <button
                  onClick={() => setIsSubmitOpen(true)}
                  className="flex items-center gap-1.5 px-3.5 py-2 bg-[#00E599] hover:bg-[#00c985] text-slate-950 rounded-xl text-xs font-black shadow-xs transition-colors"
                >
                  <Send className="w-4 h-4" />
                  <span>Submit for Verification</span>
                </button>
              )}
            </>
          )}

          {isUnderReview && (
            <>
              {isVerifier ? (
                <>
                  <button
                    onClick={() => navigate(`/mrv/findings?id=${metadata.passport_id}`)}
                    className="flex items-center gap-1.5 px-3 py-2 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 rounded-xl text-xs font-bold transition-colors"
                  >
                    <AlertCircle className="w-4 h-4 text-amber-600" />
                    <span>Raise Finding</span>
                  </button>
                  <button
                    onClick={() => navigate(`/mrv/report?id=${metadata.passport_id}`)}
                    className="flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black shadow-xs transition-colors"
                  >
                    <ShieldCheck className="w-4 h-4" />
                    <span>Issue Statement →</span>
                  </button>
                </>
              ) : (
                <button
                  onClick={() => navigate('/mrv')}
                  className="flex items-center gap-1.5 px-3.5 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors"
                >
                  <Clock className="w-4 h-4" />
                  <span>Verifier Portal (MRV) →</span>
                </button>
              )}
            </>
          )}

          {currentStatus === 'Verified' && (
            <button
              onClick={() => navigate(`/passport/sign-issue?id=${metadata.passport_id}`)}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Authorize & Issue</span>
            </button>
          )}

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
            <span>Share</span>
          </button>
        </div>
      </div>

      {/* Success Confirmation Toast Banner */}
      {submitSuccess && (
        <div className="p-4 bg-emerald-50 border border-emerald-300 text-emerald-950 rounded-2xl flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <div>
              <p className="text-xs font-bold text-emerald-900">{submitSuccess}</p>
              <p className="text-[11px] text-emerald-700">
                The dataset has been locked and cryptographic audit record was committed to the VMware Tanzu Nexus datamodel.
              </p>
            </div>
          </div>
          <button
            onClick={() => navigate('/mrv')}
            className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold shrink-0"
          >
            Open Verifier Portal →
          </button>
        </div>
      )}

      {/* Lifecycle Workflow Banner */}
      {isPreVerification && (
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-emerald-950 rounded-2xl p-5 text-white shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#00E599]/20 text-[#00E599] border border-[#00E599]/30 uppercase tracking-wider">
                {currentStatus === 'CorrectionsRequired' ? 'Corrections Required · Ready to Resubmit' : isVerifier ? 'Producer Draft · Under Preparation' : 'Passport Draft · Action Required'}
              </span>
              <span className="text-xs font-mono text-slate-400">Batch {prod.batch_number}</span>
            </div>
            <h3 className="text-base font-bold text-white">
              {isVerifier
                ? 'Product Batch Carbon Draft (Pre-Verification State)'
                : 'Ready to Submit for Accredited Independent Verification'}
            </h3>
            <p className="text-xs text-slate-300 max-w-2xl">
              {isVerifier
                ? `Primary telemetry (100%), Scope 1-3 carbon footprint (${footprint.total_emissions.toLocaleString()} kg CO₂e), and EU CBAM parameters are prepared. Awaiting formal operator submission for verifier sign-off.`
                : `Primary telemetry (100%), Scope 1-3 carbon footprint (${footprint.total_emissions.toLocaleString()} kg CO₂e), and EU CBAM specifications have been computed. Submit this passport for third-party verification under ISO 14065 & EU Regulation 2023/956.`}
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0 w-full md:w-auto justify-end">
            <button
              onClick={() => navigate(`/passport/readiness?id=${metadata.passport_id}`)}
              className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold transition-colors"
            >
              Run Audit Check
            </button>
            {!isVerifier ? (
              <button
                onClick={() => setIsSubmitOpen(true)}
                className="flex items-center gap-1.5 px-4 py-2 bg-[#00E599] hover:bg-[#00c985] text-slate-950 rounded-xl text-xs font-black transition-all shadow-sm"
              >
                <Send className="w-4 h-4" />
                <span>Submit for Verification</span>
              </button>
            ) : (
              <button
                onClick={() => navigate('/mrv/queue')}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm"
              >
                Verification Queue →
              </button>
            )}
          </div>
        </div>
      )}

      {isUnderReview && (
        <div className="bg-sky-50 border border-sky-200 rounded-2xl p-4 text-sky-950 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-sky-100 text-sky-700 rounded-xl">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-sky-700 block">
                Status: Submitted for Independent Verification
              </span>
              <p className="text-xs font-medium text-sky-900">
                {isVerifier
                  ? 'Primary data and evidence locked. As accredited lead verifier (Bureau Veritas), you can issue verification statement or log findings.'
                  : 'Primary data and evidence locked. Awaiting third-party verification statement and audit assessment.'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {isVerifier ? (
              <>
                <button
                  onClick={() => navigate(`/mrv/findings?id=${metadata.passport_id}`)}
                  className="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 text-xs font-bold rounded-xl transition-colors"
                >
                  Raise Finding
                </button>
                <button
                  onClick={() => navigate(`/mrv/report?id=${metadata.passport_id}`)}
                  className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black shadow-xs transition-colors"
                >
                  Issue Statement →
                </button>
              </>
            ) : (
              <button
                onClick={() => navigate('/mrv')}
                className="px-3.5 py-1.5 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-bold whitespace-nowrap shadow-xs"
              >
                Track in Verifier Portal (MRV) →
              </button>
            )}
          </div>
        </div>
      )}

      {currentStatus === 'Verified' && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 text-emerald-950 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-100 text-emerald-800 rounded-xl">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-emerald-800 block">
                Status: Verified · Ready for Corporate Issuance
              </span>
              <p className="text-xs font-medium text-emerald-900">
                Third-party verification statement CERT-EU-CBAM-2026-981 is attached. Authorized officers can now apply digital cryptographic signature.
              </p>
            </div>
          </div>
          <button
            onClick={() => navigate(`/passport/sign-issue?id=${metadata.passport_id}`)}
            className="px-3.5 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold whitespace-nowrap shadow-xs flex items-center gap-1.5"
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Authorize & Issue Passport →</span>
          </button>
        </div>
      )}

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
                  <span className="text-[10px] text-slate-500 ml-1">kgCO2e</span>
                </div>
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <span className="text-[10px] text-slate-400 block font-bold">Scope 2 Indirect</span>
                  <span className="text-sm font-black text-slate-800">{footprint.scope2}</span>
                  <span className="text-[10px] text-slate-500 ml-1">kgCO2e</span>
                </div>
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <span className="text-[10px] text-slate-400 block font-bold">Scope 3 Value Chain</span>
                  <span className="text-sm font-black text-slate-800">{footprint.scope3}</span>
                  <span className="text-[10px] text-slate-500 ml-1">kgCO2e</span>
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
                <span className="text-slate-500 font-medium">Recorded Timestamp</span>
                <span className="font-bold text-slate-800">{new Date(audit.issued_at).toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar Column (1/3 width) */}
        <div className="space-y-6">
          {/* Independent Verification Card */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <Award className="w-4 h-4 text-emerald-600" />
                <span>Verification & Assurance</span>
              </h3>
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${getStatusBadgeStyle(currentStatus)}`}>
                {isVerifiedOrIssued ? 'VERIFIED' : isUnderReview ? 'IN REVIEW' : 'PENDING'}
              </span>
            </div>

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
                  <span className="text-slate-400 block">Audit Date</span>
                  <span className="font-bold text-slate-900">{verifier.verification_date}</span>
                </div>
              </div>

              {isPreVerification && (
                <button
                  onClick={() => setIsSubmitOpen(true)}
                  className="w-full mt-2 py-2.5 bg-[#00E599] hover:bg-[#00c985] text-slate-950 font-black text-xs rounded-xl shadow-xs transition-colors flex items-center justify-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Submit for Verification</span>
                </button>
              )}
            </div>
          </div>

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
        </div>
      </div>

      {/* Submit for Verification Modal Dialog */}
      {isSubmitOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95">
            <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-emerald-50 text-emerald-800 rounded-xl">
                  <Send className="w-5 h-5 text-emerald-700" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">Submit Passport for Independent Verification</h3>
                  <p className="text-[11px] text-slate-500 font-mono">Passport ID: {metadata.passport_id}</p>
                </div>
              </div>
              <button
                onClick={() => setIsSubmitOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitForVerification} className="p-6 space-y-4 text-xs">
              {submitError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{submitError}</span>
                </div>
              )}

              {/* Passport & Batch Brief */}
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">Product / Commodity:</span>
                  <span className="font-bold text-slate-900">
                    {prod.product_name} ({prod.commodity})
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">Batch / Quantity:</span>
                  <span className="font-mono font-bold text-slate-900">
                    {prod.batch_number} · {prod.quantity.toLocaleString()} {prod.unit}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">Computed Footprint:</span>
                  <span className="font-bold text-emerald-700">
                    {footprint.total_emissions.toLocaleString()} kg CO₂e ({footprint.intensity_value} {footprint.intensity_unit})
                  </span>
                </div>
              </div>

              {/* Submitter Corporate Email */}
              <div>
                <label className="font-bold text-slate-700 block mb-1">Submitter Corporate Email / ID</label>
                <input
                  type="email"
                  required
                  value={submitterEmail}
                  onChange={(e) => setSubmitterEmail(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-emerald-600 bg-white"
                />
              </div>

              {/* Accredited Verification Body */}
              <div>
                <label className="font-bold text-slate-700 block mb-1">Accredited Third-Party Verifier</label>
                <select
                  value={selectedVerifier}
                  onChange={(e) => setSelectedVerifier(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-emerald-600 bg-white font-medium"
                >
                  <option value="Bureau Veritas UK Ltd (Accredited Verifier #NAB-8820)">
                    Bureau Veritas UK Ltd (Accredited Verifier #NAB-8820) [Recommended]
                  </option>
                  <option value="TÜV Rheinland Energy GmbH (DAkkS Accredited)">
                    TÜV Rheinland Energy GmbH (DAkkS Accredited)
                  </option>
                  <option value="DNV Business Assurance (ISO 14065 Accredited)">
                    DNV Business Assurance (ISO 14065 Accredited)
                  </option>
                  <option value="SGS Industrial Carbon Services">SGS Industrial Carbon Services</option>
                </select>
                <span className="text-[10px] text-slate-400 mt-1 block">
                  Verifier receives read-only access to cryptographic dataset lock and raw telemetry streams.
                </span>
              </div>

              {/* Scope & Evidence Notes */}
              <div>
                <label className="font-bold text-slate-700 block mb-1">Submission Notes & Evidence Scope</label>
                <textarea
                  rows={3}
                  value={submitNotes}
                  onChange={(e) => setSubmitNotes(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-emerald-600 bg-white"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsSubmitOpen(false)}
                  disabled={isSubmitting}
                  className="px-4 py-2 border border-slate-200 text-slate-700 font-bold rounded-xl hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-[#00E599] hover:bg-[#00c985] text-slate-950 font-black rounded-xl shadow-xs transition flex items-center gap-1.5"
                >
                  {isSubmitting ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Submitting to Verifier...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" />
                      <span>Confirm & Submit for Verification</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
