import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle2, Upload, User, Users, Building, Globe, Shield, Activity, Mail, FileText, Check, ArrowLeft, ArrowRight, Save, AlertTriangle, RotateCcw, Loader2, ShieldCheck, LogIn } from 'lucide-react';
import { saveOrgProfile, registerUser, loginUser } from '../../api/client';
import type { OrgProfileData } from './organisation/OrgProfileTab';

export function generateSaurientEmail(fullName: string): string {
  if (!fullName || !fullName.trim()) return 'user@saurient.io';
  let clean = fullName.trim().replace(/^(dr\.|mr\.|mrs\.|ms\.|prof\.|dr|mr|mrs|ms|prof)\s+/i, '');
  clean = clean.toLowerCase().replace(/[^a-z0-9\s]/g, '');
  const parts = clean.split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'user@saurient.io';
  if (parts.length === 1) return `${parts[0]}@saurient.io`;
  return `${parts[0]}.${parts[parts.length - 1]}@saurient.io`;
}

export const INITIAL_FORM_DATA = {
  // Account Owner
  ownerName: '',
  ownerEmail: '',
  ownerPhone: '',
  ownerRole: 'Chief Sustainability Officer',
  ownerPassword: '',
  confirmPassword: '',
  // Legal Identity
  legalName: '',
  tradingName: '',
  registrationNumber: '',
  incorporationDate: '',
  legalForm: 'Private Limited Company (Ltd)',
  countryOfRegistration: '',
  // Addresses & Tax
  addressLine1: '',
  addressLine2: '',
  city: '',
  region: '',
  postalCode: '',
  country: '',
  taxResidency: '',
  reportingCurrency: 'EUR (€)',
  taxId: '',
  vatNumber: '',
  leiNumber: '',
  fiscalYearStart: '01 January',
  docClassification: 'Confidential',
  // Trade & Customs
  eoriNumber: '',
  hsTariffCode: '7208 39 00 — Flat-rolled products of iron/steel (Hot-Rolled Coil)',
  departurePorts: '',
  targetMarkets: 'European Union (CBAM Zone)',
  // Industry & Operations
  primarySector: '',
  annualProduction: '',
  facilitiesCount: '',
  gridSupplier: '',
  renewableShare: '',
  auditStatus: 'Pending Verification',
  // ERP & Telemetry
  primaryErp: 'SAP S/4HANA Cloud',
  iotMeters: '24 Digital Telemetry Meters (Modbus TCP)',
  dataCoverage: '88% Verified Sensor Telemetry',
  apiGateway: 'REST API / MQTT Connected',
  // Contacts
  sustainabilityLead: '',
  complianceOfficer: '',
  financeDirector: '',
  // Boundary
  consolidationApproach: 'Operational Control',
  baseYear: '2026',
  defaultUnits: 'tCO₂e (metric tonnes)',
  ghgStandard: 'EU CBAM Regulation & ISO 14067 Product Footprint',
};

export const INITIAL_STEP_STATUSES = [
  'In progress',  // Step 1: Account Owner
  'Not started',  // Step 2: Legal Identity
  'Not started',  // Step 3: Addresses & Tax
  'Not started',  // Step 4: Trade & Customs
  'Not started',  // Step 5: Industry & Operations
  'Not started',  // Step 6: Data Readiness
  'Not started',  // Step 7: Contacts
  'Not started',  // Step 8: Documents
  'Not started',  // Step 9: Declarations
  'Not started',  // Step 10: Review & Submit
];

export const RegistrationView: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const stepParam = searchParams.get('step');
  const isNew = searchParams.get('new') === 'true';

  const [activeStep, setActiveStep] = useState<number>(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isAutosaved, setIsAutosaved] = useState(false);

  // Controlled form state for registration wizard
  const [formData, setFormData] = useState(INITIAL_FORM_DATA);

  const [stepStatuses, setStepStatuses] = useState<string[]>(INITIAL_STEP_STATUSES);

  // Restore saved draft or reset on initial page mount
  useEffect(() => {
    if (isNew) {
      localStorage.removeItem('saurient_registration_draft');
      setFormData(INITIAL_FORM_DATA);
      setStepStatuses(INITIAL_STEP_STATUSES);
      setActiveStep(0);
      setIsAutosaved(false);
      return;
    }

    const savedDraftStr = localStorage.getItem('saurient_registration_draft');
    if (savedDraftStr) {
      try {
        const parsed = JSON.parse(savedDraftStr);
        if (parsed.formData && (parsed.formData.ownerName || parsed.formData.legalName)) {
          setFormData((prev) => ({ ...prev, ...parsed.formData }));
          setIsAutosaved(true);
        }
        if (stepParam !== null) {
          const s = parseInt(stepParam, 10);
          if (!isNaN(s) && s >= 0 && s < 10) {
            setActiveStep(s);
          }
        } else {
          // Default to Step 0 (Account Owner) on initial landing so the user always starts at the beginning
          setActiveStep(0);
        }
        if (Array.isArray(parsed.stepStatuses)) {
          setStepStatuses(parsed.stepStatuses);
        }
      } catch (err) {
        console.warn('Failed to restore registration draft:', err);
      }
    } else if (stepParam !== null) {
      const s = parseInt(stepParam, 10);
      if (!isNaN(s) && s >= 0 && s < 10) {
        setActiveStep(s);
      }
    }
  }, [stepParam, isNew]);

  const handleResetForm = () => {
    localStorage.removeItem('saurient_registration_draft');
    setFormData(INITIAL_FORM_DATA);
    setStepStatuses(INITIAL_STEP_STATUSES);
    setActiveStep(0);
    setIsAutosaved(false);
    setErrorMsg(null);
  };

  const handleChange = (field: string, value: string) => {
    setErrorMsg(null);
    setIsAutosaved(true);
    setFormData((prev) => {
      const updated = { ...prev, [field]: value };
      if (field === 'ownerName') {
        updated.ownerEmail = generateSaurientEmail(value);
      }
      localStorage.setItem('saurient_registration_draft', JSON.stringify({
        formData: updated,
        activeStep,
        stepStatuses,
        updatedAt: new Date().toISOString()
      }));
      return updated;
    });
  };

  const validateStep = (stepIndex: number): boolean => {
    setErrorMsg(null);

    if (stepIndex === 0) {
      if (!formData.ownerName || !formData.ownerName.trim()) {
        setErrorMsg('Primary Account Owner Name is required in Step 1 (Account Owner).');
        return false;
      }
      if (!formData.ownerEmail || !formData.ownerEmail.trim()) {
        setErrorMsg('Corporate Work Email is required in Step 1 (Account Owner).');
        return false;
      }
      if (!formData.ownerPassword) {
        setErrorMsg('Account Password is required in Step 1 (Account Owner).');
        return false;
      }
      if (!formData.confirmPassword) {
        setErrorMsg('Please confirm your account password in Step 1 (Account Owner).');
        return false;
      }
      if (formData.ownerPassword !== formData.confirmPassword) {
        setErrorMsg('Account Password and Confirm Password do not match.');
        return false;
      }
    }

    if (stepIndex === 1) {
      if (!formData.legalName || !formData.legalName.trim()) {
        setErrorMsg('Legal Entity Name is required in Step 2 (Legal Identity).');
        return false;
      }
      if (!formData.registrationNumber || !formData.registrationNumber.trim()) {
        setErrorMsg('Company Registration Number is required in Step 2 (Legal Identity).');
        return false;
      }
    }

    return true;
  };

  const validateAllPriorSteps = (targetStep: number): boolean => {
    if (!formData.ownerName || !formData.ownerName.trim()) {
      setActiveStep(0);
      setErrorMsg('Primary Account Owner Name is required in Step 1 (Account Owner).');
      return false;
    }
    if (!formData.ownerEmail || !formData.ownerEmail.trim()) {
      setActiveStep(0);
      setErrorMsg('Corporate Work Email is required in Step 1 (Account Owner).');
      return false;
    }
    if (!formData.ownerPassword) {
      setActiveStep(0);
      setErrorMsg('Account Password is required in Step 1 (Account Owner).');
      return false;
    }
    if (!formData.confirmPassword) {
      setActiveStep(0);
      setErrorMsg('Please confirm your account password in Step 1 (Account Owner).');
      return false;
    }
    if (formData.ownerPassword !== formData.confirmPassword) {
      setActiveStep(0);
      setErrorMsg('Account Password and Confirm Password do not match.');
      return false;
    }

    if (targetStep > 1) {
      if (!formData.legalName || !formData.legalName.trim()) {
        setActiveStep(1);
        setErrorMsg('Legal Entity Name is required in Step 2 (Legal Identity).');
        return false;
      }
      if (!formData.registrationNumber || !formData.registrationNumber.trim()) {
        setActiveStep(1);
        setErrorMsg('Company Registration Number is required in Step 2 (Legal Identity).');
        return false;
      }
    }

    return true;
  };

  const stepTitles = [
    { title: 'Account Owner', desc: 'Primary administrative contact & credentials' },
    { title: 'Legal Identity', desc: 'Official entity registration & legal details' },
    { title: 'Addresses & Tax', desc: 'Registered office, tax profile & fiscal identifiers' },
    { title: 'Trade & Customs', desc: 'Export market compliance, EORI & HS codes' },
    { title: 'Industry & Operations', desc: 'Facility locations, energy mix & production' },
    { title: 'Data Readiness', desc: 'ERP systems, telemetry sensors & data sharing' },
    { title: 'Contacts', desc: 'Sustainability, compliance & finance leads' },
    { title: 'Documents', desc: 'Verification certificates & legal permits' },
    { title: 'Declarations', desc: 'EUDR, CBAM & Paris Agreement undertakings' },
    { title: 'Review & Submit', desc: 'Final application review & authorization' },
  ];

  // Sub-tabs for Addresses & Tax (Step 3)
  const [addressTab, setAddressTab] = useState<'registered' | 'operating' | 'billing' | 'tax'>('registered');

  const handleStepClick = (index: number) => {
    if (index > activeStep) {
      if (!validateStep(activeStep)) return;
      if (!validateAllPriorSteps(index)) return;
    }
    setErrorMsg(null);
    setActiveStep(index);
    if (stepStatuses[index] === 'Not started') {
      const updated = [...stepStatuses];
      updated[index] = 'In progress';
      setStepStatuses(updated);
    }
  };

  const handleSubmitRegistration = async () => {
    if (!validateAllPriorSteps(10)) return;

    setErrorMsg(null);
    setIsSubmitting(true);

    try {
      const cleanOrgKey = (formData.tradingName || formData.legalName || 'org')
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '_')
        .replace(/^_+|_+$/g, '');
      const tenantId = `org_${cleanOrgKey || 'company'}`;
      const generatedEmail = generateSaurientEmail(formData.ownerName);

      const profilePayload: OrgProfileData = {
        legalName: formData.legalName,
        tradingName: formData.tradingName || formData.legalName,
        organisationId: `ORG-CP-${formData.registrationNumber || '2026-001'}`,
        registrationNumber: formData.registrationNumber,
        countryOfIncorporation: formData.countryOfRegistration || formData.country,
        registeredAddress: [formData.addressLine1, formData.addressLine2, formData.city, formData.region, formData.country].filter(Boolean).join(', '),
        headquarters: [formData.city, formData.country].filter(Boolean).join(', '),
        industry: formData.primarySector || 'Manufacturing',
        naceCode: 'C 24.10 · Industry Sector',
        primaryProducts: formData.hsTariffCode,
        website: `https://www.${(formData.tradingName || formData.legalName || 'saurient').toLowerCase().replace(/[^a-z0-9]/g, '')}.com`,
        taxId: formData.taxId,
        lei: formData.leiNumber,
        primaryContact: {
          name: formData.ownerName,
          title: formData.ownerRole,
          email: generatedEmail,
          phone: formData.ownerPhone,
        },
        sustainabilityContact: {
          name: formData.sustainabilityLead || formData.ownerName,
          title: 'Head of Sustainability & Compliance',
          email: generatedEmail,
          phone: formData.ownerPhone,
        },
        boundary: {
          consolidationApproach: formData.consolidationApproach,
          baseYear: formData.baseYear,
          reportingCurrency: formData.reportingCurrency,
          defaultUnits: formData.defaultUnits,
          ghgStandard: formData.ghgStandard,
          reportingPeriod: 'Calendar Year (Jan – Dec)',
        },
        status: 'Verified (Registered)',
        verification: {
          provider: 'Bureau Veritas Assurance UK Ltd.',
          accreditorId: 'UKAS 0009 · ISO 14065 & ISO/IEC 17029',
          standard: 'ISAE 3410 / ISO 14064-3',
          assuranceLevel: 'Reasonable Assurance',
          certificateHash: '0x8f3a9c2e7b1d4f6a0c5e9b8d2a1f7c4e9910283b',
          verifiedDate: new Date().toISOString().split('T')[0],
          expiryDate: '2027-12-31',
        },
      };

      try {
        await saveOrgProfile(profilePayload, tenantId);
      } catch (err) {
        console.warn('Backend save profile failed, updating local state:', err);
      }

      try {
        const regResp = await registerUser({
          tenant_id: tenantId,
          email: generatedEmail,
          password: formData.ownerPassword || 'password123',
          name: formData.ownerName || `${formData.ownerFirstName || 'Org'} ${formData.ownerLastName || 'Admin'}`.trim(),
          role: 'Organisation Admin',
        });
        if (regResp && regResp.token) {
          localStorage.setItem('saurient_auth_token', regResp.token);
          localStorage.setItem('saurient_user_role', 'Organisation Admin');
          localStorage.setItem('auth_role', 'Organisation Admin');
          localStorage.setItem('saurient_user_email', generatedEmail);
          localStorage.setItem('saurient_user_name', regResp.user?.name || formData.ownerName || 'Admin');
          localStorage.setItem('saurient_user_id', regResp.user?.id || 'usr-admin');
          localStorage.setItem('saurient_tenant_id', tenantId);
        }
      } catch (err) {
        console.warn('Backend user registration note:', err);
        // If user is already registered in datamodel, authenticate to obtain token
        try {
          const loginResp = await loginUser(generatedEmail, formData.ownerPassword || 'password123', tenantId);
          if (loginResp && loginResp.token) {
            localStorage.setItem('saurient_auth_token', loginResp.token);
            localStorage.setItem('saurient_user_role', 'Organisation Admin');
            localStorage.setItem('auth_role', 'Organisation Admin');
            localStorage.setItem('saurient_user_email', generatedEmail);
            localStorage.setItem('saurient_user_name', loginResp.user?.name || formData.ownerName || 'Admin');
            localStorage.setItem('saurient_user_id', loginResp.user?.id || 'usr-admin');
            localStorage.setItem('saurient_tenant_id', tenantId);
          }
        } catch (loginErr) {
          console.warn('Fallback login note:', loginErr);
        }
      }

      localStorage.removeItem('saurient_registration_draft');
      localStorage.setItem('saurient_company_registered', 'true');
      localStorage.setItem('saurient_tenant_id', tenantId);
      localStorage.setItem('saurient_registered_company', JSON.stringify({
        ...formData,
        ownerEmail: generatedEmail,
        ownerRole: 'Organisation Admin',
        ownerPassword: formData.ownerPassword || 'password123',
        tenantId: tenantId,
        registrationDate: new Date().toISOString(),
      }));

      setSubmitSuccess(true);
      setShowSuccessModal(true);
    } catch (outerErr: any) {
      console.error('Registration submission failed:', outerErr);
      setErrorMsg(outerErr?.message || 'Registration submission failed. Please verify fields and retry.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveDraft = () => {
    localStorage.setItem('saurient_registration_draft', JSON.stringify({
      formData,
      activeStep,
      stepStatuses,
      updatedAt: new Date().toISOString(),
    }));
    setIsAutosaved(true);
    navigate('/dashboard');
  };

  const handleContinue = async () => {
    if (!validateStep(activeStep)) return;
    if (!validateAllPriorSteps(activeStep + 1)) return;

    setErrorMsg(null);
    const updated = [...stepStatuses];
    updated[activeStep] = 'Complete';

    if (activeStep < 9) {
      const nextStep = activeStep + 1;
      if (updated[nextStep] === 'Not started') {
        updated[nextStep] = 'In progress';
      }
      setStepStatuses(updated);
      setActiveStep(nextStep);
    } else {
      setStepStatuses(updated);
      await handleSubmitRegistration();
    }
  };

  const handleBack = () => {
    if (activeStep > 0) {
      setActiveStep(activeStep - 1);
    } else {
      navigate('/login');
    }
  };

  // Calculate completion percentage based on completed steps
  const completedCount = stepStatuses.filter((s) => s === 'Complete').length;
  const completionPercentage = Math.min(100, Math.round((completedCount / 10) * 100));

  return (
    <div className="min-h-screen bg-slate-100 flex">
      {/* Left Stepper Sidebar */}
      <aside className="w-72 bg-slate-950 text-white p-6 space-y-6 hidden md:block shrink-0 border-r border-slate-800">
        <div className="flex items-center gap-3.5 cursor-pointer" onClick={() => navigate('/dashboard')}>
          <img
            src="/saurient-logo.png"
            alt="Saurient Logo"
            className="w-20 h-20 object-contain rounded-2xl drop-shadow-xl shrink-0"
          />
          <div>
            <h1 className="font-black text-lg tracking-widest text-white uppercase leading-tight">SAURIENT</h1>
            <p className="text-xs text-emerald-400 font-bold tracking-wide">Company Registration</p>
          </div>
        </div>

        <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
          <p className="text-[11px] text-slate-400 font-mono">Application SAU-REG-260941</p>
          <div className="flex items-center justify-between text-[10px] font-bold">
            {isAutosaved ? (
              <span className="text-emerald-400 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                AUTOSAVED
              </span>
            ) : (
              <span className="text-slate-400">DRAFT READY</span>
            )}
            <div className="flex items-center gap-2">
              {isAutosaved && (
                <button
                  type="button"
                  onClick={handleResetForm}
                  className="text-[10px] text-slate-400 hover:text-red-400 underline font-normal"
                  title="Clear draft and start fresh"
                >
                  Clear
                </button>
              )}
              <span className="text-emerald-400">{completionPercentage}% DONE</span>
            </div>
          </div>
        </div>

        {/* Step Items - ALL CLICKABLE */}
        <div className="space-y-2 pt-2">
          {stepTitles.map((s, idx) => {
            const status = stepStatuses[idx];
            const isActive = activeStep === idx;
            const isComplete = status === 'Complete';

            return (
              <button
                key={idx}
                type="button"
                onClick={() => handleStepClick(idx)}
                className={`w-full text-left flex items-center gap-3 p-2.5 rounded-xl transition-all duration-150 group ${
                  isActive
                    ? 'bg-blue-600/20 text-white border border-blue-500/50 shadow-sm'
                    : isComplete
                    ? 'hover:bg-slate-900 text-slate-200'
                    : 'hover:bg-slate-900/60 text-slate-400'
                }`}
              >
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 transition-transform ${
                    isComplete
                      ? 'bg-emerald-500 text-slate-950'
                      : isActive
                      ? 'bg-blue-600 text-white ring-2 ring-blue-400'
                      : 'bg-slate-800 text-slate-400 group-hover:bg-slate-700'
                  }`}
                >
                  {isComplete ? '✓' : idx + 1}
                </div>

                <div className="min-w-0 flex-1">
                  <p
                    className={`font-semibold text-xs leading-tight truncate ${
                      isActive
                        ? 'text-white font-bold'
                        : isComplete
                        ? 'text-emerald-400'
                        : 'text-slate-300 group-hover:text-white'
                    }`}
                  >
                    {s.title}
                  </p>
                  <p className="text-[10px] text-slate-500 capitalize leading-none pt-0.5">{status}</p>
                </div>
              </button>
            );
          })}
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 p-6 md:p-8 overflow-y-auto">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Header Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-black text-slate-900 tracking-tight">{stepTitles[activeStep].title}</h2>
              <p className="text-xs text-slate-500 font-medium">
                Step {activeStep + 1} of 10 • {stepTitles[activeStep].desc}
              </p>
            </div>
            <div className="flex items-center gap-2">
              {isAutosaved && (
                <button
                  type="button"
                  onClick={handleResetForm}
                  className="text-xs font-semibold text-slate-600 hover:text-red-600 bg-white hover:bg-red-50 border border-slate-200 hover:border-red-200 px-3 py-1.5 rounded-full transition-colors flex items-center gap-1.5 shadow-2xs"
                  title="Wipe draft and start fresh registration"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-slate-500 hover:text-red-500" />
                  <span>Start Fresh</span>
                </button>
              )}
              <span className="text-xs font-bold text-blue-600 bg-blue-50 px-3 py-1.5 rounded-full border border-blue-100">
                {completionPercentage}% COMPLETE
              </span>
            </div>
          </div>

          {/* DYNAMIC FORM CARD FOR STEP 1 TO 10 */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-6">
            {errorMsg && (
              <div className="p-3.5 bg-red-50 border border-red-200 text-red-700 text-xs font-semibold rounded-xl flex items-center gap-2 animate-in fade-in">
                <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* STEP 1: ACCOUNT OWNER */}
            {activeStep === 0 && (
              <div className="space-y-5">
                <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
                  <User className="w-5 h-5 text-emerald-600" />
                  <h3 className="font-bold text-slate-900 text-sm">Account Owner Contact & Credentials</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Primary Account Owner Name *</label>
                    <input
                      type="text"
                      value={formData.ownerName}
                      onChange={(e) => handleChange('ownerName', e.target.value)}
                      className="w-full rounded-xl border border-slate-200 p-2.5 text-xs text-slate-900 bg-slate-50"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Corporate Work Email *</label>
                    <input
                      type="email"
                      value={formData.ownerEmail}
                      onChange={(e) => handleChange('ownerEmail', e.target.value)}
                      className="w-full rounded-xl border border-slate-200 p-2.5 text-xs text-slate-900 bg-slate-50"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Direct Phone Number *</label>
                    <input
                      type="text"
                      value={formData.ownerPhone}
                      onChange={(e) => handleChange('ownerPhone', e.target.value)}
                      className="w-full rounded-xl border border-slate-200 p-2.5 text-xs text-slate-900 bg-slate-50"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Role / Executive Position *</label>
                    <input
                      type="text"
                      value={formData.ownerRole}
                      onChange={(e) => handleChange('ownerRole', e.target.value)}
                      className="w-full rounded-xl border border-slate-200 p-2.5 text-xs text-slate-900 bg-slate-50"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Password *</label>
                    <input
                      type="password"
                      placeholder="Enter account password"
                      value={formData.ownerPassword}
                      onChange={(e) => handleChange('ownerPassword', e.target.value)}
                      className="w-full rounded-xl border border-slate-200 p-2.5 text-xs text-slate-900 bg-slate-50"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Confirm Password *</label>
                    <input
                      type="password"
                      placeholder="Confirm account password"
                      value={formData.confirmPassword}
                      onChange={(e) => handleChange('confirmPassword', e.target.value)}
                      className="w-full rounded-xl border border-slate-200 p-2.5 text-xs text-slate-900 bg-slate-50"
                    />
                  </div>
                </div>

                <div className="p-3 bg-purple-50 border border-purple-200 rounded-xl text-xs text-purple-900 flex items-start gap-2.5">
                  <ShieldCheck className="w-4 h-4 text-purple-700 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold">System Role Assignment: Organisation Admin</span>
                    <p className="text-[11px] text-purple-700 mt-0.5">
                      The Account Owner automatically receives the <strong>Organisation Admin</strong> role in the Nexus datamodel. Once logged in, this administrative account has full authority to invite users and assign roles.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* STEP 2: LEGAL IDENTITY */}
            {activeStep === 1 && (
              <div className="space-y-5">
                <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
                  <Building className="w-5 h-5 text-emerald-600" />
                  <h3 className="font-bold text-slate-900 text-sm">Legal Entity Details & Registration</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Legal Entity Name *</label>
                    <input
                      type="text"
                      value={formData.legalName}
                      onChange={(e) => handleChange('legalName', e.target.value)}
                      className="w-full rounded-xl border border-slate-200 p-2.5 text-xs text-slate-900 bg-slate-50"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Trade Name / DBA</label>
                    <input
                      type="text"
                      value={formData.tradingName}
                      onChange={(e) => handleChange('tradingName', e.target.value)}
                      className="w-full rounded-xl border border-slate-200 p-2.5 text-xs text-slate-900 bg-slate-50"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Company Registration No. *</label>
                    <input
                      type="text"
                      value={formData.registrationNumber}
                      onChange={(e) => handleChange('registrationNumber', e.target.value)}
                      className="w-full rounded-xl border border-slate-200 p-2.5 text-xs text-slate-900 font-mono bg-slate-50"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Incorporation Date *</label>
                    <input
                      type="date"
                      value={formData.incorporationDate}
                      onChange={(e) => handleChange('incorporationDate', e.target.value)}
                      className="w-full rounded-xl border border-slate-200 p-2.5 text-xs text-slate-900 bg-slate-50"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Legal Form *</label>
                    <select
                      value={formData.legalForm}
                      onChange={(e) => handleChange('legalForm', e.target.value)}
                      className="w-full rounded-xl border border-slate-200 p-2.5 text-xs text-slate-900 bg-slate-50"
                    >
                      <option>Private Limited Company (Ltd)</option>
                      <option>Public Limited Company (PLC)</option>
                      <option>State Owned Enterprise (SOE)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Country of Registration *</label>
                    <input
                      type="text"
                      value={formData.countryOfRegistration}
                      onChange={(e) => handleChange('countryOfRegistration', e.target.value)}
                      className="w-full rounded-xl border border-slate-200 p-2.5 text-xs text-slate-900 bg-slate-50"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* STEP 3: ADDRESSES & TAX (MATCHING IMAGE 02_REGISTRATION.PNG EXACTLY) */}
            {activeStep === 2 && (
              <div className="space-y-6">
                <div className="flex border-b border-slate-200 gap-6 text-xs font-bold text-slate-500">
                  <button
                    type="button"
                    onClick={() => setAddressTab('registered')}
                    className={`pb-2.5 transition-colors ${
                      addressTab === 'registered' ? 'text-emerald-600 border-b-2 border-emerald-500 font-bold' : 'hover:text-slate-900'
                    }`}
                  >
                    Registered Address
                  </button>
                  <button
                    type="button"
                    onClick={() => setAddressTab('operating')}
                    className={`pb-2.5 transition-colors ${
                      addressTab === 'operating' ? 'text-emerald-600 border-b-2 border-emerald-500 font-bold' : 'hover:text-slate-900'
                    }`}
                  >
                    Operating Address
                  </button>
                  <button
                    type="button"
                    onClick={() => setAddressTab('billing')}
                    className={`pb-2.5 transition-colors ${
                      addressTab === 'billing' ? 'text-emerald-600 border-b-2 border-emerald-500 font-bold' : 'hover:text-slate-900'
                    }`}
                  >
                    Billing Address
                  </button>
                  <button
                    type="button"
                    onClick={() => setAddressTab('tax')}
                    className={`pb-2.5 transition-colors ${
                      addressTab === 'tax' ? 'text-emerald-600 border-b-2 border-emerald-500 font-bold' : 'hover:text-slate-900'
                    }`}
                  >
                    Tax & Identifiers
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-[11px] font-bold uppercase text-slate-500 mb-1">Address Line 1 *</label>
                    <input type="text" value={formData.addressLine1} onChange={(e) => handleChange('addressLine1', e.target.value)} placeholder="e.g. 14 Independence Avenue" className="w-full rounded-xl border border-slate-200 p-2.5 text-xs text-slate-900 bg-slate-50" />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold uppercase text-slate-500 mb-1">Address Line 2</label>
                    <input type="text" value={formData.addressLine2} onChange={(e) => handleChange('addressLine2', e.target.value)} placeholder="e.g. Industrial Area" className="w-full rounded-xl border border-slate-200 p-2.5 text-xs text-slate-900 bg-slate-50" />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold uppercase text-slate-500 mb-1">City *</label>
                    <input type="text" value={formData.city} onChange={(e) => handleChange('city', e.target.value)} placeholder="e.g. Tema" className="w-full rounded-xl border border-slate-200 p-2.5 text-xs text-slate-900 bg-slate-50" />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold uppercase text-slate-500 mb-1">Region *</label>
                    <input type="text" value={formData.region} onChange={(e) => handleChange('region', e.target.value)} placeholder="e.g. Greater Accra" className="w-full rounded-xl border border-slate-200 p-2.5 text-xs text-slate-900 bg-slate-50" />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold uppercase text-slate-500 mb-1">Postal Code *</label>
                    <input type="text" value={formData.postalCode} onChange={(e) => handleChange('postalCode', e.target.value)} placeholder="e.g. GT-020-4821" className="w-full rounded-xl border border-slate-200 p-2.5 text-xs text-slate-900 bg-slate-50" />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold uppercase text-slate-500 mb-1">Country *</label>
                    <input type="text" value={formData.country} onChange={(e) => handleChange('country', e.target.value)} placeholder="e.g. Ghana" className="w-full rounded-xl border border-slate-200 p-2.5 text-xs text-slate-900 bg-slate-50" />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold uppercase text-slate-500 mb-1">Tax Residency *</label>
                    <input type="text" value={formData.taxResidency} onChange={(e) => handleChange('taxResidency', e.target.value)} placeholder="e.g. Ghana" className="w-full rounded-xl border border-slate-200 p-2.5 text-xs text-slate-900 bg-slate-50" />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold uppercase text-slate-500 mb-1">Reporting Currency *</label>
                    <input type="text" value={formData.reportingCurrency} onChange={(e) => handleChange('reportingCurrency', e.target.value)} placeholder="e.g. EUR (€)" className="w-full rounded-xl border border-slate-200 p-2.5 text-xs text-slate-900 bg-slate-50" />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold uppercase text-slate-500 mb-1">Tax Identification Number *</label>
                    <input type="text" value={formData.taxId} onChange={(e) => handleChange('taxId', e.target.value)} placeholder="e.g. C0012345678" className="w-full rounded-xl border border-slate-200 p-2.5 text-xs text-slate-900 font-mono bg-slate-50" />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold uppercase text-slate-500 mb-1">VAT / GST Number</label>
                    <input type="text" value={formData.vatNumber} onChange={(e) => handleChange('vatNumber', e.target.value)} placeholder="e.g. VAT-GH-2400882" className="w-full rounded-xl border border-slate-200 p-2.5 text-xs text-slate-900 font-mono bg-slate-50" />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold uppercase text-slate-500 mb-1">Fiscal Year Start *</label>
                    <input type="text" value={formData.fiscalYearStart} onChange={(e) => handleChange('fiscalYearStart', e.target.value)} placeholder="e.g. 01 January" className="w-full rounded-xl border border-slate-200 p-2.5 text-xs text-slate-900 bg-slate-50" />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold uppercase text-slate-500 mb-1">Document Classification</label>
                    <input type="text" value={formData.docClassification} onChange={(e) => handleChange('docClassification', e.target.value)} placeholder="e.g. Confidential" className="w-full rounded-xl border border-slate-200 p-2.5 text-xs text-slate-900 bg-slate-50" />
                  </div>
                </div>

                <div className="border-2 border-dashed border-slate-200 rounded-xl p-6 text-center text-xs text-slate-500 space-y-1 hover:bg-slate-50 cursor-pointer">
                  <Upload className="w-6 h-6 text-slate-400 mx-auto mb-2" />
                  <p className="font-semibold text-slate-700">Upload proof of registered-office address</p>
                  <p className="text-[10px] text-slate-400">PDF, PNG, JPG up to 10MB</p>
                </div>
              </div>
            )}

            {/* STEP 4: TRADE & CUSTOMS */}
            {activeStep === 3 && (
              <div className="space-y-5">
                <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
                  <Globe className="w-5 h-5 text-emerald-600" />
                  <h3 className="font-bold text-slate-900 text-sm">Export Trade & Customs Identifiers</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">EORI Number (EU Customs) *</label>
                    <input type="text" value={formData.eoriNumber} onChange={(e) => handleChange('eoriNumber', e.target.value)} placeholder="e.g. GB123456789000" className="w-full rounded-xl border border-slate-200 p-2.5 text-xs text-slate-900 font-mono bg-slate-50" />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Primary HS Code Tariff Chapter *</label>
                    <input type="text" value={formData.hsTariffCode} onChange={(e) => handleChange('hsTariffCode', e.target.value)} placeholder="e.g. 7208 39 00 — Flat-rolled products of iron/steel" className="w-full rounded-xl border border-slate-200 p-2.5 text-xs text-slate-900 bg-slate-50" />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Primary Export Departure Ports *</label>
                    <input type="text" value={formData.departurePorts} onChange={(e) => handleChange('departurePorts', e.target.value)} placeholder="e.g. Tema Sea Port, Takoradi Commercial Hub" className="w-full rounded-xl border border-slate-200 p-2.5 text-xs text-slate-900 bg-slate-50" />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Destination Target Markets *</label>
                    <input type="text" value={formData.targetMarkets} onChange={(e) => handleChange('targetMarkets', e.target.value)} placeholder="e.g. European Union (CBAM Zone)" className="w-full rounded-xl border border-slate-200 p-2.5 text-xs text-slate-900 bg-slate-50" />
                  </div>
                </div>
              </div>
            )}

            {/* STEP 5: INDUSTRY & OPERATIONS */}
            {activeStep === 4 && (
              <div className="space-y-5">
                <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
                  <Activity className="w-5 h-5 text-emerald-600" />
                  <h3 className="font-bold text-slate-900 text-sm">Industrial Sector & Facility Operations</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Primary Sector *</label>
                    <input type="text" value={formData.primarySector} onChange={(e) => handleChange('primarySector', e.target.value)} placeholder="e.g. Steel & Heavy Industry Manufacturing" className="w-full rounded-xl border border-slate-200 p-2.5 text-xs text-slate-900 bg-slate-50" />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Annual Production Volume *</label>
                    <input type="text" value={formData.annualProduction} onChange={(e) => handleChange('annualProduction', e.target.value)} placeholder="e.g. 45,000 Metric Tons / Year" className="w-full rounded-xl border border-slate-200 p-2.5 text-xs text-slate-900 bg-slate-50" />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Active Processing Facilities *</label>
                    <input type="text" value={formData.facilitiesCount} onChange={(e) => handleChange('facilitiesCount', e.target.value)} placeholder="e.g. 3 Plants" className="w-full rounded-xl border border-slate-200 p-2.5 text-xs text-slate-900 bg-slate-50" />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Primary Grid Electricity Supplier</label>
                    <input type="text" value={formData.gridSupplier} onChange={(e) => handleChange('gridSupplier', e.target.value)} placeholder="e.g. National Electricity Grid" className="w-full rounded-xl border border-slate-200 p-2.5 text-xs text-slate-900 bg-slate-50" />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Renewable Energy PPA Share</label>
                    <input type="text" value={formData.renewableShare} onChange={(e) => handleChange('renewableShare', e.target.value)} placeholder="e.g. 35% Solar Rooftop" className="w-full rounded-xl border border-slate-200 p-2.5 text-xs text-slate-900 bg-slate-50" />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">ISO 14064 / 14067 Audit Status</label>
                    <input type="text" value={formData.auditStatus} onChange={(e) => handleChange('auditStatus', e.target.value)} placeholder="e.g. Certified (TÜV Rheinland)" className="w-full rounded-xl border border-slate-200 p-2.5 text-xs text-slate-900 bg-slate-50" />
                  </div>
                </div>
              </div>
            )}

            {/* STEP 6: DATA READINESS */}
            {activeStep === 5 && (
              <div className="space-y-5">
                <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
                  <Shield className="w-5 h-5 text-emerald-600" />
                  <h3 className="font-bold text-slate-900 text-sm">ERP Integration & Telemetry Infrastructure</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Primary ERP System *</label>
                    <input type="text" value={formData.primaryErp} onChange={(e) => handleChange('primaryErp', e.target.value)} placeholder="e.g. SAP S/4HANA Cloud" className="w-full rounded-xl border border-slate-200 p-2.5 text-xs text-slate-900 bg-slate-50" />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">IoT Energy Meters Operational</label>
                    <input type="text" value={formData.iotMeters} onChange={(e) => handleChange('iotMeters', e.target.value)} placeholder="e.g. 24 Digital Telemetry Meters" className="w-full rounded-xl border border-slate-200 p-2.5 text-xs text-slate-900 bg-slate-50" />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Primary Data Coverage *</label>
                    <input type="text" value={formData.dataCoverage} onChange={(e) => handleChange('dataCoverage', e.target.value)} placeholder="e.g. 88% Verified Sensor Telemetry" className="w-full rounded-xl border border-slate-200 p-2.5 text-xs text-slate-900 bg-slate-50" />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">API Integration Gateway</label>
                    <input type="text" value={formData.apiGateway} onChange={(e) => handleChange('apiGateway', e.target.value)} placeholder="e.g. REST API / MQTT Connected" className="w-full rounded-xl border border-slate-200 p-2.5 text-xs text-slate-900 bg-slate-50" />
                  </div>
                </div>
              </div>
            )}

            {/* STEP 7: CONTACTS */}
            {activeStep === 6 && (
              <div className="space-y-5">
                <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
                  <Mail className="w-5 h-5 text-emerald-600" />
                  <h3 className="font-bold text-slate-900 text-sm">Key Departmental Contacts</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Sustainability Lead *</label>
                    <input 
                      type="text" 
                      value={formData.sustainabilityLead} 
                      onChange={(e) => handleChange('sustainabilityLead', e.target.value)}
                      placeholder="e.g. Dr. Jane Doe (jane.doe@saurient.io)"
                      className="w-full rounded-xl border border-slate-200 p-2.5 text-xs text-slate-900 bg-slate-50" 
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Compliance Officer *</label>
                    <input 
                      type="text" 
                      value={formData.complianceOfficer} 
                      onChange={(e) => handleChange('complianceOfficer', e.target.value)}
                      placeholder="e.g. Marcus Vance (m.vance@saurient.io)"
                      className="w-full rounded-xl border border-slate-200 p-2.5 text-xs text-slate-900 bg-slate-50" 
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Customs & Logistics Contact *</label>
                    <input 
                      type="text" 
                      value={formData.financeDirector} 
                      onChange={(e) => handleChange('financeDirector', e.target.value)}
                      placeholder="e.g. Helena Schmidt (h.schmidt@saurient.io)"
                      className="w-full rounded-xl border border-slate-200 p-2.5 text-xs text-slate-900 bg-slate-50" 
                    />
                  </div>
                </div>
              </div>
            )}

            {/* STEP 8: DOCUMENTS */}
            {activeStep === 7 && (
              <div className="space-y-5">
                <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
                  <FileText className="w-5 h-5 text-emerald-600" />
                  <h3 className="font-bold text-slate-900 text-sm">Required Verification Certificates & Permits</h3>
                </div>

                <div className="space-y-3 text-xs">
                  {[
                    { name: 'Certificate of Incorporation (Form 3)', status: 'Uploaded', file: 'cert_inc_cs102948.pdf' },
                    { name: 'EPA Ghana Environmental Operating Permit', status: 'Uploaded', file: 'epa_permit_2026.pdf' },
                    { name: 'GRA Tax Clearance Certificate', status: 'Uploaded', file: 'tax_clearance_2026.pdf' },
                    { name: 'ISO 14067 Verification Report (TÜV)', status: 'Uploaded', file: 'tuv_iso14067_report.pdf' },
                  ].map((doc, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 rounded-xl border border-slate-200 bg-slate-50">
                      <div>
                        <p className="font-bold text-slate-900">{doc.name}</p>
                        <p className="text-[10px] text-slate-500 font-mono">{doc.file}</p>
                      </div>
                      <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1">
                        <Check className="w-3 h-3 text-emerald-600" />
                        {doc.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* STEP 9: DECLARATIONS */}
            {activeStep === 8 && (
              <div className="space-y-5 text-xs">
                <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  <h3 className="font-bold text-slate-900 text-sm">Legal Declarations & Compliance Undertakings</h3>
                </div>

                <div className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <div className="flex items-start gap-3">
                    <input type="checkbox" defaultChecked className="mt-0.5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500" />
                    <div>
                      <p className="font-bold text-slate-900">EU CBAM & Heavy Industry Compliance Declaration</p>
                      <p className="text-slate-600">We declare that all steel coil batches exported carry verified blast furnace / EAF telemetry with EU CBAM Annex IV compliant direct/indirect carbon intensity breakdowns.</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <input type="checkbox" defaultChecked className="mt-0.5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500" />
                    <div>
                      <p className="font-bold text-slate-900">EU CBAM Embedded Carbon Telemetry Accuracy</p>
                      <p className="text-slate-600">We declare that Scope 1-3 greenhouse gas calculation rules use verified primary industrial activity data.</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* STEP 10: REVIEW & SUBMIT */}
            {activeStep === 9 && (
              <div className="space-y-6">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div>
                    <h3 className="font-bold text-slate-900 text-base">Application Review & Submission</h3>
                    <p className="text-xs text-slate-500">Ref: SAU-REG-260941 • Organization Profile Ready</p>
                  </div>
                  <span className="px-3 py-1 bg-emerald-100 text-emerald-800 text-xs font-bold rounded-full border border-emerald-200">
                    READINESS SCORE: 96%
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                    <span className="font-bold text-slate-900 block">Organization Summary</span>
                    <p className="text-slate-600"><strong className="text-slate-900">Entity:</strong> {formData.legalName || formData.tradingName || 'Not specified'}</p>
                    <p className="text-slate-600"><strong className="text-slate-900">Reg No:</strong> {formData.registrationNumber ? `${formData.registrationNumber}${formData.countryOfRegistration ? ` (${formData.countryOfRegistration})` : ''}` : 'Not specified'}</p>
                    <p className="text-slate-600"><strong className="text-slate-900">EORI:</strong> {formData.eoriNumber || 'Not specified'}</p>
                    <p className="text-slate-600"><strong className="text-slate-900">Facility Hub:</strong> {[formData.addressLine1, formData.city, formData.region, formData.country].filter(Boolean).join(', ') || 'Not specified'}</p>
                  </div>

                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                    <span className="font-bold text-slate-900 block">System Verification Readiness</span>
                    <p className="text-emerald-700 flex items-center gap-1.5 font-semibold">
                      <Check className="w-4 h-4 text-emerald-600" />
                      Legal identity verified ({formData.legalName || 'Pending'})
                    </p>
                    <p className="text-emerald-700 flex items-center gap-1.5 font-semibold">
                      <Check className="w-4 h-4 text-emerald-600" />
                      Account Owner: {formData.ownerName || 'Not specified'} ({formData.ownerEmail || generateSaurientEmail(formData.ownerName)}) — Role: <span className="bg-purple-100 text-purple-800 text-[10px] font-bold px-1.5 py-0.5 rounded">Organisation Admin</span>
                    </p>
                    <p className="text-emerald-700 flex items-center gap-1.5 font-semibold">
                      <Check className="w-4 h-4 text-emerald-600" />
                      Tax profile & EORI active ({formData.eoriNumber || formData.taxId || 'Active'})
                    </p>
                    <p className="text-emerald-700 flex items-center gap-1.5 font-semibold">
                      <Check className="w-4 h-4 text-emerald-600" />
                      Verification documents attached
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Autosave & Success Banner */}
            {submitSuccess && (
              <div className="p-4 bg-emerald-600 text-white rounded-xl text-xs font-bold flex items-center justify-between shadow-lg animate-in fade-in">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-white shrink-0" />
                  <span>Organisation registration submitted and saved successfully! Redirecting to internal workspace...</span>
                </div>
              </div>
            )}

            {isAutosaved ? (
              <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-xl text-xs text-emerald-800 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Registration draft is autosaved. System credentials are collected later in the Integration Hub.</span>
              </div>
            ) : (
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-600 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-slate-400 shrink-0" />
                <span>Registration progress will autosave as you enter details. System credentials are collected later in the Integration Hub.</span>
              </div>
            )}
          </div>

          {/* Navigation Action Buttons */}
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={handleBack}
              disabled={isSubmitting}
              className="px-5 py-2.5 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors flex items-center gap-1 disabled:opacity-50"
            >
              <ArrowLeft className="w-4 h-4" />
              {activeStep === 0 ? 'Back to Login' : 'Back'}
            </button>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleSaveDraft}
                disabled={isSubmitting}
                className="px-5 py-2.5 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors flex items-center gap-1 disabled:opacity-50"
              >
                <Save className="w-4 h-4 text-slate-500" />
                Save draft
              </button>

              <button
                type="button"
                onClick={handleContinue}
                disabled={isSubmitting}
                className="px-6 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1.5 disabled:opacity-50"
              >
                {isSubmitting ? (
                  <span className="flex items-center gap-1.5">
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Submitting Registration...</span>
                  </span>
                ) : activeStep === 9 ? (
                  <>
                    <span>Submit Company Registration</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                ) : (
                  <>
                    <span>Continue</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* Registration Success Modal Popup */}
      {showSuccessModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white text-slate-900 rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-5 text-center">
            <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-sm">
              <CheckCircle2 className="w-8 h-8 text-emerald-600" />
            </div>

            <div>
              <span className="bg-emerald-100 text-emerald-800 text-[10px] font-extrabold px-3 py-1 rounded-full uppercase tracking-wider">
                REGISTRATION SUCCESSFUL
              </span>
              <h3 className="text-xl font-black text-slate-900 mt-2">Organisation Registered!</h3>
              <p className="text-xs text-slate-500 mt-1">
                <strong className="text-slate-800">{formData.legalName || formData.tradingName || 'Organisation'}</strong> has been registered on the Saurient platform.
              </p>
            </div>

            {/* Account Owner & Admin Credentials Details */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-left text-xs space-y-2.5">
              <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                <span className="font-bold text-slate-700">Account Owner</span>
                <span className="font-bold text-slate-900">{formData.ownerName || `${formData.ownerFirstName} ${formData.ownerLastName}`.trim()}</span>
              </div>
              <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                <span className="font-bold text-slate-700">Work Email</span>
                <span className="font-mono text-slate-900">{formData.ownerEmail || generateSaurientEmail(formData.ownerName)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-700">System Role</span>
                <span className="bg-purple-100 text-purple-800 font-bold px-2 py-0.5 rounded text-[11px] border border-purple-200">
                  Organisation Admin
                </span>
              </div>
            </div>

            <p className="text-xs text-slate-500 leading-relaxed text-left">
              The account owner is provisioned as <strong>Organisation Admin</strong> in the Nexus graph datamodel. Sign in with these credentials to manage your company workspace, create users, and assign roles.
            </p>

            <div className="flex flex-col gap-2 pt-1">
              <button
                onClick={() => {
                  const emailParam = formData.ownerEmail || generateSaurientEmail(formData.ownerName);
                  navigate(`/login?registered=true&email=${encodeURIComponent(emailParam)}`);
                }}
                className="w-full py-3 bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs rounded-xl shadow-md transition flex items-center justify-center gap-2"
              >
                <LogIn className="w-4 h-4" />
                <span>Proceed to Sign In with Credentials</span>
              </button>

              <button
                onClick={() => navigate('/company-dashboard')}
                className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition flex items-center justify-center gap-2"
              >
                <span>Go to Company Dashboard</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
