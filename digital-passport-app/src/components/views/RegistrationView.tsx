import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2, Upload, User, Building, MapPin, Globe, Shield, Activity, Mail, FileText, Check, ArrowLeft, ArrowRight, Save } from 'lucide-react';

export const RegistrationView: React.FC = () => {
  const navigate = useNavigate();

  const [activeStep, setActiveStep] = useState<number>(0); // Starts at Step 1: Account Owner

  // Dynamic step statuses - only completed steps get green check marks
  const [stepStatuses, setStepStatuses] = useState<string[]>([
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
  ]);

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
    setActiveStep(index);
    if (stepStatuses[index] === 'Not started') {
      const updated = [...stepStatuses];
      updated[index] = 'In progress';
      setStepStatuses(updated);
    }
  };

  const handleContinue = () => {
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
      navigate('/dashboard');
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
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate('/dashboard')}>
          <div className="w-8 h-8 rounded-lg bg-emerald-500 text-slate-950 font-black flex items-center justify-center text-base">S</div>
          <div>
            <h1 className="font-bold text-sm tracking-wide text-white">SAURIENT</h1>
            <p className="text-[10px] text-slate-400 font-medium">Company Registration</p>
          </div>
        </div>

        <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
          <p className="text-[11px] text-slate-400 font-mono">Application SAU-REG-260941</p>
          <div className="flex items-center justify-between text-[10px] text-emerald-400 font-bold">
            <span>AUTOSAVED</span>
            <span>{completionPercentage}% DONE</span>
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
              <span className="text-xs font-bold text-blue-600 bg-blue-50 px-3 py-1.5 rounded-full border border-blue-100">
                {completionPercentage}% COMPLETE
              </span>
            </div>
          </div>

          {/* DYNAMIC FORM CARD FOR STEP 1 TO 10 */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-6">
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
                    <input type="text" defaultValue="Kwame Mensah" className="w-full rounded-xl border border-slate-200 p-2.5 text-xs text-slate-900 bg-slate-50" />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Corporate Work Email *</label>
                    <input type="email" defaultValue="kwame.mensah@saurientcocoa.com" className="w-full rounded-xl border border-slate-200 p-2.5 text-xs text-slate-900 bg-slate-50" />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Direct Phone Number *</label>
                    <input type="text" defaultValue="+233 24 412 8092" className="w-full rounded-xl border border-slate-200 p-2.5 text-xs text-slate-900 bg-slate-50" />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Role / Executive Position *</label>
                    <input type="text" defaultValue="Head of Sustainability & Supply Chain" className="w-full rounded-xl border border-slate-200 p-2.5 text-xs text-slate-900 bg-slate-50" />
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
                    <input type="text" defaultValue="Ghana Cocoa Processing Corporation Ltd." className="w-full rounded-xl border border-slate-200 p-2.5 text-xs text-slate-900 bg-slate-50" />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Trade Name / DBA</label>
                    <input type="text" defaultValue="Saurient Premium Cocoa Exports" className="w-full rounded-xl border border-slate-200 p-2.5 text-xs text-slate-900 bg-slate-50" />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Company Registration No. *</label>
                    <input type="text" defaultValue="CS1029482024" className="w-full rounded-xl border border-slate-200 p-2.5 text-xs text-slate-900 font-mono bg-slate-50" />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Incorporation Date *</label>
                    <input type="date" defaultValue="2012-04-18" className="w-full rounded-xl border border-slate-200 p-2.5 text-xs text-slate-900 bg-slate-50" />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Legal Form *</label>
                    <select className="w-full rounded-xl border border-slate-200 p-2.5 text-xs text-slate-900 bg-slate-50">
                      <option>Private Limited Company (Ltd)</option>
                      <option>Public Limited Company (PLC)</option>
                      <option>State Owned Enterprise (SOE)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Country of Registration *</label>
                    <input type="text" defaultValue="Ghana" className="w-full rounded-xl border border-slate-200 p-2.5 text-xs text-slate-900 bg-slate-50" />
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
                    <input type="text" defaultValue="14 Independence Avenue" className="w-full rounded-xl border border-slate-200 p-2.5 text-xs text-slate-900 bg-slate-50" />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold uppercase text-slate-500 mb-1">Address Line 2</label>
                    <input type="text" defaultValue="Industrial Area" className="w-full rounded-xl border border-slate-200 p-2.5 text-xs text-slate-900 bg-slate-50" />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold uppercase text-slate-500 mb-1">City *</label>
                    <input type="text" defaultValue="Tema" className="w-full rounded-xl border border-slate-200 p-2.5 text-xs text-slate-900 bg-slate-50" />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold uppercase text-slate-500 mb-1">Region *</label>
                    <input type="text" defaultValue="Greater Accra" className="w-full rounded-xl border border-slate-200 p-2.5 text-xs text-slate-900 bg-slate-50" />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold uppercase text-slate-500 mb-1">Postal Code *</label>
                    <input type="text" defaultValue="GT-020-4821" className="w-full rounded-xl border border-slate-200 p-2.5 text-xs text-slate-900 bg-slate-50" />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold uppercase text-slate-500 mb-1">Country *</label>
                    <input type="text" defaultValue="Ghana" className="w-full rounded-xl border border-slate-200 p-2.5 text-xs text-slate-900 bg-slate-50" />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold uppercase text-slate-500 mb-1">Tax Residency *</label>
                    <input type="text" defaultValue="Ghana" className="w-full rounded-xl border border-slate-200 p-2.5 text-xs text-slate-900 bg-slate-50" />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold uppercase text-slate-500 mb-1">Reporting Currency *</label>
                    <input type="text" defaultValue="GHS — Ghanaian Cedi" className="w-full rounded-xl border border-slate-200 p-2.5 text-xs text-slate-900 bg-slate-50" />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold uppercase text-slate-500 mb-1">Tax Identification Number *</label>
                    <input type="text" defaultValue="C0012345678" className="w-full rounded-xl border border-slate-200 p-2.5 text-xs text-slate-900 font-mono bg-slate-50" />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold uppercase text-slate-500 mb-1">VAT / GST Number</label>
                    <input type="text" defaultValue="VAT-GH-2400882" className="w-full rounded-xl border border-slate-200 p-2.5 text-xs text-slate-900 font-mono bg-slate-50" />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold uppercase text-slate-500 mb-1">Fiscal Year Start *</label>
                    <input type="text" defaultValue="01 January" className="w-full rounded-xl border border-slate-200 p-2.5 text-xs text-slate-900 bg-slate-50" />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold uppercase text-slate-500 mb-1">Document Classification</label>
                    <input type="text" defaultValue="Confidential" className="w-full rounded-xl border border-slate-200 p-2.5 text-xs text-slate-900 bg-slate-50" />
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
                    <input type="text" defaultValue="GB123456789000" className="w-full rounded-xl border border-slate-200 p-2.5 text-xs text-slate-900 font-mono bg-slate-50" />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Primary HS Code Tariff Chapter *</label>
                    <input type="text" defaultValue="1801.00 — Cocoa beans, whole or broken" className="w-full rounded-xl border border-slate-200 p-2.5 text-xs text-slate-900 bg-slate-50" />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Primary Export Departure Ports *</label>
                    <input type="text" defaultValue="Tema Sea Port, Takoradi Commercial Hub" className="w-full rounded-xl border border-slate-200 p-2.5 text-xs text-slate-900 bg-slate-50" />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Destination Target Markets *</label>
                    <input type="text" defaultValue="European Union (CBAM Zone), North America" className="w-full rounded-xl border border-slate-200 p-2.5 text-xs text-slate-900 bg-slate-50" />
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
                    <input type="text" defaultValue="Cocoa Processing & Export" className="w-full rounded-xl border border-slate-200 p-2.5 text-xs text-slate-900 bg-slate-50" />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Annual Production Volume *</label>
                    <input type="text" defaultValue="45,000 Metric Tons / Year" className="w-full rounded-xl border border-slate-200 p-2.5 text-xs text-slate-900 bg-slate-50" />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Active Processing Facilities *</label>
                    <input type="text" defaultValue="3 Plants (Tema, Kumasi, Takoradi)" className="w-full rounded-xl border border-slate-200 p-2.5 text-xs text-slate-900 bg-slate-50" />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Primary Grid Electricity Supplier</label>
                    <input type="text" defaultValue="Electricity Company of Ghana (ECG)" className="w-full rounded-xl border border-slate-200 p-2.5 text-xs text-slate-900 bg-slate-50" />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Renewable Energy PPA Share</label>
                    <input type="text" defaultValue="35% Solar Rooftop Installation" className="w-full rounded-xl border border-slate-200 p-2.5 text-xs text-slate-900 bg-slate-50" />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">ISO 14064 / 14067 Audit Status</label>
                    <input type="text" defaultValue="Certified (TÜV Rheinland)" className="w-full rounded-xl border border-slate-200 p-2.5 text-xs text-slate-900 bg-slate-50" />
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
                    <input type="text" defaultValue="SAP S/4HANA Cloud" className="w-full rounded-xl border border-slate-200 p-2.5 text-xs text-slate-900 bg-slate-50" />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">IoT Energy Meters Operational</label>
                    <input type="text" defaultValue="24 Digital Telemetry Meters (Modbus TCP)" className="w-full rounded-xl border border-slate-200 p-2.5 text-xs text-slate-900 bg-slate-50" />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Primary Data Coverage *</label>
                    <input type="text" defaultValue="88% Verified Sensor Telemetry" className="w-full rounded-xl border border-slate-200 p-2.5 text-xs text-slate-900 bg-slate-50" />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">API Integration Gateway</label>
                    <input type="text" defaultValue="REST API / MQTT Connected" className="w-full rounded-xl border border-slate-200 p-2.5 text-xs text-slate-900 bg-slate-50" />
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
                    <input type="text" defaultValue="Ama Asantewaa (ama@saurientcocoa.com)" className="w-full rounded-xl border border-slate-200 p-2.5 text-xs text-slate-900 bg-slate-50" />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Compliance Officer *</label>
                    <input type="text" defaultValue="Kofi Boateng (kofi@saurientcocoa.com)" className="w-full rounded-xl border border-slate-200 p-2.5 text-xs text-slate-900 bg-slate-50" />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Customs & Logistics Contact *</label>
                    <input type="text" defaultValue="Esi Osei (esi@saurientcocoa.com)" className="w-full rounded-xl border border-slate-200 p-2.5 text-xs text-slate-900 bg-slate-50" />
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
                      <p className="font-bold text-slate-900">EU Deforestation Regulation (EUDR) Compliance</p>
                      <p className="text-slate-600">We declare that all cocoa batches exported carry polygon plot coordinates with zero deforestation after Dec 31, 2020.</p>
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
                    <p className="text-slate-600"><strong className="text-slate-900">Entity:</strong> Ghana Cocoa Processing Corp Ltd.</p>
                    <p className="text-slate-600"><strong className="text-slate-900">Reg No:</strong> CS1029482024 (Ghana)</p>
                    <p className="text-slate-600"><strong className="text-slate-900">EORI:</strong> GB123456789000</p>
                    <p className="text-slate-600"><strong className="text-slate-900">Facility Hub:</strong> Tema Industrial Area</p>
                  </div>

                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                    <span className="font-bold text-slate-900 block">System Verification Readiness</span>
                    <p className="text-emerald-700 flex items-center gap-1.5 font-semibold">
                      <Check className="w-4 h-4 text-emerald-600" />
                      Legal identity verified
                    </p>
                    <p className="text-emerald-700 flex items-center gap-1.5 font-semibold">
                      <Check className="w-4 h-4 text-emerald-600" />
                      Tax profile & EORI active
                    </p>
                    <p className="text-emerald-700 flex items-center gap-1.5 font-semibold">
                      <Check className="w-4 h-4 text-emerald-600" />
                      Verification documents attached
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Autosave Banner */}
            <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-xl text-xs text-emerald-800 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Registration data is autosaved. System credentials are collected later in the Integration Hub.</span>
            </div>
          </div>

          {/* Navigation Action Buttons */}
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={handleBack}
              className="px-5 py-2.5 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors flex items-center gap-1"
            >
              <ArrowLeft className="w-4 h-4" />
              {activeStep === 0 ? 'Back to Login' : 'Back'}
            </button>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => navigate('/dashboard')}
                className="px-5 py-2.5 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors flex items-center gap-1"
              >
                <Save className="w-4 h-4 text-slate-500" />
                Save draft
              </button>

              <button
                type="button"
                onClick={handleContinue}
                className="px-6 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
              >
                {activeStep === 9 ? 'Submit Company Registration' : 'Continue'}
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};
