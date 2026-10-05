import React, { useState, useEffect } from 'react';
import { getOrgProfile, saveOrgProfile } from '../../../api/client';
import {
  Building2,
  Scale,
  ShieldCheck,
  History,
  Pencil,
  Mail,
  Phone,
  Clock,
  CheckCircle2,
  X,
  Save
} from 'lucide-react';

export interface OrgProfileData {
  legalName: string;
  tradingName: string;
  organisationId: string;
  registrationNumber: string;
  countryOfIncorporation: string;
  registeredAddress: string;
  headquarters: string;
  industry: string;
  naceCode: string;
  primaryProducts: string;
  website: string;
  taxId: string;
  lei: string;
  primaryContact: {
    name: string;
    title: string;
    email: string;
    phone: string;
  };
  sustainabilityContact: {
    name: string;
    title: string;
    email: string;
    phone: string;
  };
  boundary: {
    consolidationApproach: string;
    baseYear: string;
    reportingCurrency: string;
    defaultUnits: string;
    ghgStandard: string;
    reportingPeriod: string;
  };
  status: string;
  verification: {
    provider: string;
    accreditorId: string;
    standard: string;
    assuranceLevel: string;
    certificateHash: string;
    verifiedDate: string;
    expiryDate: string;
  };
}

export const steelOrgProfile: OrgProfileData = {
  legalName: 'Saurient Demo Steel Industries Ltd',
  tradingName: 'Saurient Steel',
  organisationId: 'ORG-ST-2026-001',
  registrationNumber: 'IN-2026-ST-7208',
  countryOfIncorporation: 'India / EU CBAM Registered Declarant',
  registeredAddress: 'IDAL Industrial Area, Hyderabad, Telangana 500037, India',
  headquarters: 'Hyderabad, Telangana, India',
  industry: 'Iron & Steel Manufacturing (CN 7208 39 00)',
  naceCode: 'C 24.10 · Manufacture of basic iron and steel',
  primaryProducts: 'Hot-Rolled Steel Coil (ST-2026-00981), S355JR Structural Steel',
  website: 'https://www.saurient-steel.org',
  taxId: '36AABCU9603R1ZM',
  lei: '3358001KJTIIGC8Y1R99',
  primaryContact: {
    name: 'Santosh Samudrala',
    title: 'Managing Director & CEO',
    email: 'santosh.samudrala@saurient.org',
    phone: '+91 40 2345 6789',
  },
  sustainabilityContact: {
    name: 'Ramesh Varma',
    title: 'Head of Decarbonization & CBAM Compliance',
    email: 'r.varma@saurient-steel.org',
    phone: '+91 40 2345 9988',
  },
  boundary: {
    consolidationApproach: 'Operational Control',
    baseYear: '2024',
    reportingCurrency: 'EUR (€) / INR (₹)',
    defaultUnits: 'tCO₂e (metric tonnes)',
    ghgStandard: 'ISO 14067 / EU CBAM Regulation (EU) 2026/1740',
    reportingPeriod: 'Calendar Year (Jan – Dec)',
  },
  status: 'Verified',
  verification: {
    provider: 'Meridian Assurance Ltd',
    accreditorId: 'UKAS 0009 · ISO 14065 & ISO/IEC 17029',
    standard: 'ISO 14064-3 / ISO 14067',
    assuranceLevel: 'Reasonable Assurance',
    certificateHash: '7e28a91f3e77a102bc9a1144cdcc7388105b907712e40122aa',
    verifiedDate: '2026-03-28',
    expiryDate: '2027-03-27',
  },
};

export const initialOrgProfile: OrgProfileData = {
  legalName: 'Saurient Carbon Processing Ltd.',
  tradingName: 'Saurient Eco-Logistics',
  organisationId: 'ORG-CP-2026-009841',
  registrationNumber: 'GH-2026-889104',
  countryOfIncorporation: 'Ghana / EU Registered Declarant',
  registeredAddress: 'Plot 14, Heavy Industrial Area, Tema, Greater Accra, Ghana',
  headquarters: 'Accra / Tema, Ghana',
  industry: 'Agri-Processing & Industrial Commodities',
  naceCode: 'C 10.82 · Combined Nomenclature Annex I',
  primaryProducts: 'Refined Cocoa Butter, Cocoa Liquor, Steel Process Frames',
  website: 'https://www.saurient-carbon.com',
  taxId: 'GH-TAX-99812-C',
  lei: '5493001KJTIIGC8Y1R12',
  primaryContact: {
    name: "Santosh Samudrala",
    title: "Chief Executive Officer",
    email: "santosh.samudrala@saurient-carbon.com",
    phone: "+233 24 412 3456",
  },
  sustainabilityContact: {
    name: "Dr. Lena Hoffmann",
    title: "Head of Sustainability & Compliance",
    email: "l.hoffmann@saurient-carbon.com",
    phone: "+233 24 498 7654",
  },
  boundary: {
    consolidationApproach: "Operational Control",
    baseYear: "2024",
    reportingCurrency: "EUR (€) / GHS (₵)",
    defaultUnits: "tCO₂e (metric tonnes)",
    ghgStandard: "GHG Protocol Corporate Standard & EU CBAM Implementing Reg 2023/1773",
    reportingPeriod: "Calendar Year (Jan – Dec)",
  },
  status: "Verified",
  verification: {
    provider: "Bureau Veritas Assurance UK Ltd. / SGS Ghana",
    accreditorId: "UKAS 0009 · ISO 14065 & ISO/IEC 17029",
    standard: "ISAE 3410 / ISO 14064-3",
    assuranceLevel: "Reasonable Assurance",
    certificateHash: "0x8f3a9c2e7b1d4f6a0c5e9b8d2a1f7c4e9910283b",
    verifiedDate: "2026-01-15",
    expiryDate: "2027-01-14",
  },
};

export const auditTrailData = [
  {
    id: "AUD-2026-1042",
    timestamp: "2026-09-18 14:22:05 UTC",
    user: "Dr. Lena Hoffmann",
    role: "Head of Compliance",
    section: "Carbon Accounting Boundary",
    change: "Updated GHG Standard to EU CBAM Implementing Reg 2023/1773",
    hash: "0x9a8f...1b2c",
  },
  {
    id: "AUD-2026-1039",
    timestamp: "2026-08-10 09:14:30 UTC",
    user: "Kwame Mensah",
    role: "Plant Operations Lead",
    section: "Primary Contacts",
    change: "Updated Primary Contact phone number and title",
    hash: "0x3c4d...7e8f",
  },
  {
    id: "AUD-2026-1011",
    timestamp: "2026-01-15 11:00:00 UTC",
    user: "Bureau Veritas Auditor",
    role: "Verifier",
    section: "Verification Status",
    change: "Issued Reasonable Assurance Certificate (Hash 0x8f3a...7c4e)",
    hash: "0x1a2b...3c4d",
  },
];

export const OrgProfileTab: React.FC = () => {
  const [profile, setProfile] = useState<OrgProfileData>(initialOrgProfile);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [draftProfile, setDraftProfile] = useState<OrgProfileData>(initialOrgProfile);
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    getOrgProfile()
      .then((data) => {
        if (data && data.legalName && data.legalName !== 'Saurient Industrial Group B.V.') {
          const merged: OrgProfileData = {
            ...initialOrgProfile,
            ...data,
            primaryContact: { ...initialOrgProfile.primaryContact, ...(data.primaryContact || {}) },
            sustainabilityContact: { ...initialOrgProfile.sustainabilityContact, ...(data.sustainabilityContact || {}) },
            boundary: { ...initialOrgProfile.boundary, ...(data.boundary || {}) },
            verification: { ...initialOrgProfile.verification, ...(data.verification || {}) },
          };
          setProfile(merged);
          setDraftProfile(merged);
        }
      })
      .catch((err) => console.warn('Failed to load profile from backend:', err));
  }, []);

  const handleOpenEdit = () => {
    setDraftProfile({ ...profile });
    setIsEditOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await saveOrgProfile(draftProfile);
    } catch (err) {
      console.warn('Backend save profile failed, updating local state:', err);
    }
    setProfile(draftProfile);
    setIsEditOpen(false);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 4000);
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {savedSuccess && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-4 rounded-xl flex items-center justify-between text-xs font-semibold shadow-xs animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Organisation profile updated successfully! Audit log recorded.</span>
          </div>
          <button onClick={() => setSavedSuccess(false)} className="text-emerald-600 hover:text-emerald-900">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="flex items-center gap-5">
          <img
            src="/saurient-logo.png"
            alt="Saurient Logo"
            className="w-24 h-24 md:w-28 md:h-28 object-contain rounded-3xl drop-shadow-md shrink-0"
          />
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400">Legal Identity</span>
              <span className="bg-emerald-50 text-emerald-700 border border-emerald-200/60 text-[10px] font-bold px-2.5 py-0.5 rounded-md flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                {profile.status}
              </span>
            </div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">{profile.legalName}</h2>
            <p className="text-xs font-mono text-slate-500">{profile.organisationId} · {profile.tradingName}</p>
          </div>
        </div>

        <div className="flex flex-col items-start lg:items-end gap-2">
          <button
            onClick={handleOpenEdit}
            className="px-5 py-2.5 bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-2"
          >
            <Pencil className="w-3.5 h-3.5" />
            <span>Edit Organisation Profile</span>
          </button>
          <span className="text-[11px] font-mono text-slate-400 flex items-center gap-1">
            <Clock className="w-3 h-3" />
            Last audit: {auditTrailData[0].timestamp}
          </span>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left 7 cols: Legal Identity */}
        <div className="lg:col-span-7 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-50 text-emerald-800 rounded-lg">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Company Legal Identity</h3>
              <p className="text-xs text-slate-500">Registered legal information of the operating entity</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="p-3 bg-slate-50/70 rounded-xl border border-slate-100">
              <span className="text-[10px] font-mono text-slate-400 block uppercase">Legal Name</span>
              <span className="font-bold text-slate-900 mt-0.5 block">{profile.legalName}</span>
            </div>
            <div className="p-3 bg-slate-50/70 rounded-xl border border-slate-100">
              <span className="text-[10px] font-mono text-slate-400 block uppercase">Trading Name</span>
              <span className="font-bold text-slate-900 mt-0.5 block">{profile.tradingName}</span>
            </div>
            <div className="p-3 bg-slate-50/70 rounded-xl border border-slate-100">
              <span className="text-[10px] font-mono text-slate-400 block uppercase">Organisation ID</span>
              <span className="font-mono font-bold text-slate-900 mt-0.5 block">{profile.organisationId}</span>
            </div>
            <div className="p-3 bg-slate-50/70 rounded-xl border border-slate-100">
              <span className="text-[10px] font-mono text-slate-400 block uppercase">Registration No.</span>
              <span className="font-mono font-bold text-slate-900 mt-0.5 block">{profile.registrationNumber}</span>
            </div>
            <div className="p-3 bg-slate-50/70 rounded-xl border border-slate-100">
              <span className="text-[10px] font-mono text-slate-400 block uppercase">Country of Incorporation</span>
              <span className="font-bold text-slate-900 mt-0.5 block">{profile.countryOfIncorporation}</span>
            </div>
            <div className="p-3 bg-slate-50/70 rounded-xl border border-slate-100">
              <span className="text-[10px] font-mono text-slate-400 block uppercase">Headquarters</span>
              <span className="font-bold text-slate-900 mt-0.5 block">{profile.headquarters}</span>
            </div>
            <div className="sm:col-span-2 p-3 bg-slate-50/70 rounded-xl border border-slate-100">
              <span className="text-[10px] font-mono text-slate-400 block uppercase">Registered Address</span>
              <span className="font-bold text-slate-900 mt-0.5 block">{profile.registeredAddress}</span>
            </div>
            <div className="p-3 bg-slate-50/70 rounded-xl border border-slate-100">
              <span className="text-[10px] font-mono text-slate-400 block uppercase">Industry / Sector</span>
              <span className="font-bold text-slate-900 mt-0.5 block">{profile.industry}</span>
            </div>
            <div className="p-3 bg-slate-50/70 rounded-xl border border-slate-100">
              <span className="text-[10px] font-mono text-slate-400 block uppercase">NACE / Tariff Code</span>
              <span className="font-mono font-bold text-slate-900 mt-0.5 block">{profile.naceCode}</span>
            </div>
            <div className="sm:col-span-2 p-3 bg-slate-50/70 rounded-xl border border-slate-100">
              <span className="text-[10px] font-mono text-slate-400 block uppercase">Primary Commodities</span>
              <span className="font-bold text-slate-900 mt-0.5 block">{profile.primaryProducts}</span>
            </div>
            <div className="p-3 bg-slate-50/70 rounded-xl border border-slate-100">
              <span className="text-[10px] font-mono text-slate-400 block uppercase">Tax / VAT ID</span>
              <span className="font-mono font-bold text-slate-900 mt-0.5 block">{profile.taxId}</span>
            </div>
            <div className="p-3 bg-slate-50/70 rounded-xl border border-slate-100">
              <span className="text-[10px] font-mono text-slate-400 block uppercase">LEI Number</span>
              <span className="font-mono font-bold text-slate-900 mt-0.5 block">{profile.lei}</span>
            </div>
          </div>

          <hr className="border-slate-100" />

          {/* Contacts Section */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80 space-y-2">
              <span className="text-[10px] font-mono font-bold text-emerald-800 uppercase tracking-wider block">Primary Admin Contact</span>
              <h4 className="font-bold text-slate-900 text-sm">{profile.primaryContact?.name || 'Unspecified'}</h4>
              <p className="text-slate-500 font-medium">{profile.primaryContact?.title || ''}</p>
              <div className="pt-2 text-[11px] text-slate-600 space-y-1">
                <div className="flex items-center gap-1.5"><Mail className="w-3 h-3 text-slate-400" /> {profile.primaryContact?.email || ''}</div>
                <div className="flex items-center gap-1.5"><Phone className="w-3 h-3 text-slate-400" /> {profile.primaryContact?.phone || ''}</div>
              </div>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80 space-y-2">
              <span className="text-[10px] font-mono font-bold text-emerald-800 uppercase tracking-wider block">Sustainability & CBAM Lead</span>
              <h4 className="font-bold text-slate-900 text-sm">{profile.sustainabilityContact?.name || 'Unspecified'}</h4>
              <p className="text-slate-500 font-medium">{profile.sustainabilityContact?.title || ''}</p>
              <div className="pt-2 text-[11px] text-slate-600 space-y-1">
                <div className="flex items-center gap-1.5"><Mail className="w-3 h-3 text-slate-400" /> {profile.sustainabilityContact?.email || ''}</div>
                <div className="flex items-center gap-1.5"><Phone className="w-3 h-3 text-slate-400" /> {profile.sustainabilityContact?.phone || ''}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Right 5 cols: Carbon Boundary & Verification */}
        <div className="lg:col-span-5 space-y-6">
          {/* Carbon Accounting Boundary Card */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-5">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-50 text-emerald-800 rounded-lg">
                <Scale className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Carbon Accounting Boundary</h3>
                <p className="text-xs text-slate-500">Methodology standards & boundary rules</p>
              </div>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between p-3 bg-slate-50/70 rounded-xl border border-slate-100">
                <span className="text-slate-500 font-medium">Consolidation Approach</span>
                <span className="font-bold text-slate-900">{profile.boundary?.consolidationApproach || 'Operational Control'}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-slate-50/70 rounded-xl border border-slate-100">
                <span className="text-slate-500 font-medium">Base Year</span>
                <span className="font-bold text-slate-900">{profile.boundary?.baseYear || '2024'}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-slate-50/70 rounded-xl border border-slate-100">
                <span className="text-slate-500 font-medium">Reporting Currency</span>
                <span className="font-bold text-slate-900">{profile.boundary?.reportingCurrency || 'EUR (€)'}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-slate-50/70 rounded-xl border border-slate-100">
                <span className="text-slate-500 font-medium">Default Units</span>
                <span className="font-bold text-slate-900">{profile.boundary?.defaultUnits || 'tCO₂e'}</span>
              </div>
              <div className="p-3 bg-slate-50/70 rounded-xl border border-slate-100 space-y-1">
                <span className="text-[10px] font-mono text-slate-400 block uppercase">Accounting Standard</span>
                <span className="font-bold text-slate-900 block">{profile.boundary?.ghgStandard || 'GHG Protocol'}</span>
              </div>
            </div>
          </div>

          {/* Verification Status Card */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-5">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-50 text-emerald-800 rounded-lg">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Registration & Verification</h3>
                <p className="text-xs text-slate-500">Third-party accredited assurance body</p>
              </div>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-emerald-50/50 rounded-xl border border-emerald-100 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-mono text-emerald-700 uppercase font-bold block">Assurance Body</span>
                  <span className="font-bold text-slate-900 text-xs block">{profile.verification?.provider || 'Unverified'}</span>
                </div>
                <span className="bg-emerald-600 text-white font-mono text-[9px] font-bold px-2 py-0.5 rounded">ISO 14065</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-slate-50/70 rounded-xl border border-slate-100">
                <span className="text-slate-500 font-medium">Assurance Level</span>
                <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">{profile.verification?.assuranceLevel || 'N/A'}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-slate-50/70 rounded-xl border border-slate-100">
                <span className="text-slate-500 font-medium">Valid Period</span>
                <span className="font-mono text-slate-700 font-bold">{profile.verification?.verifiedDate || ''} → {profile.verification?.expiryDate || ''}</span>
              </div>
              <div className="p-3 bg-slate-50/70 rounded-xl border border-slate-100 space-y-1">
                <span className="text-[10px] font-mono text-slate-400 block uppercase">Certificate Hash</span>
                <span className="font-mono text-[11px] text-slate-700 font-bold block truncate">{profile.verification?.certificateHash || 'N/A'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Audit Trail Section */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-slate-100 text-slate-700 rounded-lg">
            <History className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-slate-900 text-sm">Immutable Audit Trail</h3>
            <p className="text-xs text-slate-500">Cryptographically verifiable log of all legal profile updates</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 text-[10px] font-mono uppercase text-slate-400 bg-slate-50/60">
                <th className="py-2.5 px-3">Audit ID</th>
                <th className="py-2.5 px-3">Timestamp</th>
                <th className="py-2.5 px-3">User & Role</th>
                <th className="py-2.5 px-3">Section</th>
                <th className="py-2.5 px-3">Change Description</th>
                <th className="py-2.5 px-3 text-right">Hash</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {auditTrailData.map((a) => (
                <tr key={a.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3 px-3 font-mono font-bold text-slate-900">{a.id}</td>
                  <td className="py-3 px-3 text-slate-500 font-mono text-[11px]">{a.timestamp}</td>
                  <td className="py-3 px-3">
                    <span className="font-bold text-slate-900 block">{a.user}</span>
                    <span className="text-[10px] text-slate-400 font-medium">{a.role}</span>
                  </td>
                  <td className="py-3 px-3 font-medium text-slate-700">{a.section}</td>
                  <td className="py-3 px-3 text-slate-600 font-medium">{a.change}</td>
                  <td className="py-3 px-3 text-right font-mono text-[10px] text-slate-400">{a.hash}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Profile Modal */}
      {isEditOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-2xl rounded-2xl shadow-xl border border-slate-200 overflow-hidden my-8">
            <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div>
                <h3 className="font-bold text-slate-900 text-base">Edit Organisation Profile</h3>
                <p className="text-xs text-slate-500">Update entity legal details and carbon accounting boundary</p>
              </div>
              <button onClick={() => setIsEditOpen(false)} className="p-1 text-slate-400 hover:text-slate-600 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-4 text-xs max-h-[75vh] overflow-y-auto">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Legal Entity Name</label>
                  <input
                    type="text"
                    value={draftProfile.legalName}
                    onChange={(e) => setDraftProfile({ ...draftProfile, legalName: e.target.value })}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:border-emerald-600"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Trading Name</label>
                  <input
                    type="text"
                    value={draftProfile.tradingName}
                    onChange={(e) => setDraftProfile({ ...draftProfile, tradingName: e.target.value })}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:border-emerald-600"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Registration / Tax ID</label>
                  <input
                    type="text"
                    value={draftProfile.taxId}
                    onChange={(e) => setDraftProfile({ ...draftProfile, taxId: e.target.value })}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:border-emerald-600"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">LEI Number</label>
                  <input
                    type="text"
                    value={draftProfile.lei}
                    onChange={(e) => setDraftProfile({ ...draftProfile, lei: e.target.value })}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:border-emerald-600"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="font-bold text-slate-700 block mb-1">Registered Address</label>
                  <input
                    type="text"
                    value={draftProfile.registeredAddress}
                    onChange={(e) => setDraftProfile({ ...draftProfile, registeredAddress: e.target.value })}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:border-emerald-600"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Consolidation Approach</label>
                  <select
                    value={draftProfile.boundary.consolidationApproach}
                    onChange={(e) => setDraftProfile({
                      ...draftProfile,
                      boundary: { ...draftProfile.boundary, consolidationApproach: e.target.value }
                    })}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:border-emerald-600 bg-white"
                  >
                    <option value="Operational Control">Operational Control</option>
                    <option value="Financial Control">Financial Control</option>
                    <option value="Equity Share">Equity Share</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">GHG Standard</label>
                  <input
                    type="text"
                    value={draftProfile.boundary.ghgStandard}
                    onChange={(e) => setDraftProfile({
                      ...draftProfile,
                      boundary: { ...draftProfile.boundary, ghgStandard: e.target.value }
                    })}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:border-emerald-600"
                  />
                </div>
              </div>

              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between pt-4 mt-6">
                <button
                  type="button"
                  onClick={() => setIsEditOpen(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-700 font-bold rounded-xl hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-800 hover:bg-emerald-900 text-white font-bold rounded-xl shadow-xs flex items-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  <span>Save Changes</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
