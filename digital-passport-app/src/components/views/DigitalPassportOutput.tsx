import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { QrCode, RefreshCw, Plus } from 'lucide-react';
import { getAllPassportsWithMeta, DEFAULT_TENANT_ID, type ApiFetchResult } from '../../api/client';
import type { RichDigitalPassport } from '../../types';

import { PassportRegistryTab } from './passport/tabs/PassportRegistryTab';
import { PassportDetailTab } from './passport/tabs/PassportDetailTab';
import { PassportReadinessTab } from './passport/tabs/PassportReadinessTab';
import { PassportPreviewTab } from './passport/tabs/PassportPreviewTab';
import { SignAndIssueTab } from './passport/tabs/SignAndIssueTab';
import { QrVerificationTab } from './passport/tabs/QrVerificationTab';
import { PassportSharingTab } from './passport/tabs/PassportSharingTab';
import { PassportVersionsTab } from './passport/tabs/PassportVersionsTab';

export const DEFAULT_FALLBACK_PASSPORTS: RichDigitalPassport[] = [
  {
    passport_metadata: {
      passport_id: 'pas-st-2026-00981',
      unique_qr_code: 'https://passport.saurient.org/verify/pas-st-2026-00981',
      cryptographic_hash: '7e28a91f3e77a102bc9a1144cdcc7388105b907712e40122aa',
      issuance_date: '2026-03-28T10:00:00Z',
      status: 'VERIFIED',
    },
    product_summary: {
      commodity: 'Steel',
      product_name: 'Hot-Rolled Steel Coil',
      batch_number: 'ST-2026-00981',
      producer_organization: 'Saurient Demo Steel Industries Ltd',
      facility: {
        name: 'Hyderabad Manufacturing Facility',
        location: 'Hyderabad, Telangana, India',
        country_of_origin: 'India',
      },
      production_date: '2026-03-18',
      batch_size: {
        quantity: 10000,
        unit: 'kg',
      },
      hs_code: '7208 39 00',
    },
    carbon_footprint: {
      total_batch_footprint_kg_co2e: 16330,
      intensity_per_unit: {
        value: 1.633,
        unit: 'kg CO2e/kg',
      },
      scope_breakdown: {
        scope_1_direct: { value_kg_co2e: 10288, percentage: 63.0 },
        scope_2_indirect_energy: { value_kg_co2e: 3593, percentage: 22.0 },
        scope_3_value_chain: { value_kg_co2e: 2449, percentage: 15.0 },
      },
      source_breakdown: {
        raw_materials: { value_kg_co2e: 1300, percentage: 8.0 },
        electricity: { value_kg_co2e: 3593, percentage: 22.0 },
        logistics_transport: { value_kg_co2e: 800, percentage: 4.9 },
        on_site_fuel: { value_kg_co2e: 10288, percentage: 63.0 },
        packaging: { value_kg_co2e: 349, percentage: 2.1 },
      },
    },
    methodology_and_audit: {
      calculation_rulebook: 'steel-rulebook-2026',
      accounting_standard: 'ISO 14067 / EU CBAM Regulation (EU) 2026/1740',
      verification_body: 'Meridian Assurance Ltd',
      assurance_level: 'Reasonable Assurance',
      verification_id: 'ST-VER-2026-0981',
    },
  },
  {
    passport_metadata: {
      passport_id: 'PASPORT-2026-COCOA-001',
      unique_qr_code: 'https://passport.saurient.org/verify/PASPORT-2026-COCOA-001',
      cryptographic_hash: '3f90a182c8120ef918239012389102839102381203',
      issuance_date: '2026-03-25T08:30:00Z',
      status: 'VERIFIED',
    },
    product_summary: {
      commodity: 'Cocoa',
      product_name: 'Fermented Cocoa Beans',
      batch_number: 'CB-2026-9852',
      producer_organization: 'org_saurient_demo',
      facility: {
        name: 'Tema Processing Plant',
        location: 'Tema, Greater Accra, Ghana',
        country_of_origin: 'Ghana',
      },
      production_date: '2026-03-25',
      batch_size: {
        quantity: 1000,
        unit: 'kg',
      },
      hs_code: '1801.00',
    },
    carbon_footprint: {
      total_batch_footprint_kg_co2e: 359,
      intensity_per_unit: {
        value: 0.359,
        unit: 'kg CO2e/kg',
      },
      scope_breakdown: {
        scope_1_direct: { value_kg_co2e: 161, percentage: 45.0 },
        scope_2_indirect_energy: { value_kg_co2e: 54, percentage: 15.0 },
        scope_3_value_chain: { value_kg_co2e: 144, percentage: 40.0 },
      },
      source_breakdown: {
        raw_materials: { value_kg_co2e: 144, percentage: 40.0 },
        electricity: { value_kg_co2e: 54, percentage: 15.0 },
        logistics_transport: { value_kg_co2e: 30, percentage: 8.3 },
        on_site_fuel: { value_kg_co2e: 131, percentage: 36.5 },
        packaging: { value_kg_co2e: 0, percentage: 0.0 },
      },
    },
    methodology_and_audit: {
      calculation_rulebook: 'cocoa-rulebook-2026',
      accounting_standard: 'ISO 14067 Product Footprint',
      verification_body: 'Meridian Assurance Ltd',
      assurance_level: 'Reasonable Assurance',
      verification_id: 'GH-VER-2026-0852',
    },
  },
];

const PASSPORT_TABS = [
  { id: 'registry', label: 'Registry' },
  { id: 'readiness', label: 'Readiness' },
  { id: 'preview', label: 'Preview' },
  { id: 'sign-issue', label: 'Sign & Issue' },
  { id: 'detail', label: 'Passport Detail' },
  { id: 'qr', label: 'QR Verification' },
  { id: 'sharing', label: 'Sharing' },
  { id: 'versions', label: 'Versions' },
];

export const DigitalPassportOutput: React.FC = () => {
  const { tab = 'registry', passportId: pathPassportId } = useParams<{ tab?: string; passportId?: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [passportsResult, setPassportsResult] = useState<ApiFetchResult<RichDigitalPassport[]> | null>(null);
  const [loading, setLoading] = useState(true);
  const tenantId = DEFAULT_TENANT_ID;

  const loadData = async () => {
    setLoading(true);
    const listRes = await getAllPassportsWithMeta(tenantId);
    setPassportsResult(listRes);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, [tenantId]);

  const knownTabs = ['registry', 'readiness', 'preview', 'sign-issue', 'detail', 'passport-detail', 'qr', 'sharing', 'versions'];
  const isKnownTab = knownTabs.includes(tab.toLowerCase());
  const activeTabId = isKnownTab ? tab.toLowerCase() : 'detail';
  const effectivePassportId = isKnownTab ? (pathPassportId || searchParams.get('id')) : tab;

  const handleTabChange = (newTabId: string) => {
    if (effectivePassportId) {
      navigate(`/passport/${newTabId}/${effectivePassportId}`);
    } else {
      navigate(`/passport/${newTabId}`);
    }
  };

  if (loading) {
    return (
      <div className="p-16 text-center space-y-3">
        <RefreshCw className="w-8 h-8 text-emerald-600 animate-spin mx-auto" />
        <p className="text-sm font-semibold text-slate-700">Loading Saurient Digital Carbon Passports...</p>
      </div>
    );
  }

  const fetchedPassports = passportsResult?.data || [];
  let passports = fetchedPassports.length > 0 ? fetchedPassports : DEFAULT_FALLBACK_PASSPORTS;

  const steelIdx = passports.findIndex(
    (p) =>
      p.passport_metadata?.passport_id === 'pas-st-2026-00981' ||
      p.product_summary?.batch_number === 'ST-2026-00981' ||
      p.product_summary?.commodity?.toLowerCase().includes('steel')
  );

  if (steelIdx === -1) {
    passports = [DEFAULT_FALLBACK_PASSPORTS[0], ...passports];
  } else if (steelIdx > 0) {
    const steelItem = passports[steelIdx];
    const rest = passports.filter((_, idx) => idx !== steelIdx);
    passports = [steelItem, ...rest];
  }

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <QrCode className="w-6 h-6 text-emerald-600" />
            <h1 className="text-2xl font-bold text-slate-900">Digital Carbon Passports</h1>
          </div>
          <p className="text-xs text-slate-500 mb-3">
            Manage, verify, and issue EU CBAM-compliant digital product passports and Scope 1-3 footprint audit trails.
          </p>

          {/* Sub Navigation Tabs */}
          <div className="flex items-center gap-1 border-b border-slate-200 overflow-x-auto pb-px">
            {PASSPORT_TABS.map((t) => (
              <button
                key={t.id}
                onClick={() => handleTabChange(t.id)}
                className={`px-3 py-1.5 text-xs font-semibold whitespace-nowrap border-b-2 transition-colors ${
                  activeTabId === t.id
                    ? 'border-emerald-600 text-emerald-700 bg-emerald-50/50 rounded-t-lg'
                    : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/products/new')}
            className="px-4 py-2 bg-[#00E599] hover:bg-[#00c985] text-slate-950 text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Create Product Batch</span>
          </button>
        </div>
      </div>

      {/* Render Active Sub-View */}
      {activeTabId === 'registry' && <PassportRegistryTab passports={passports} tenantId={tenantId} />}
      {activeTabId === 'readiness' && <PassportReadinessTab passports={passports} />}
      {activeTabId === 'preview' && <PassportPreviewTab passports={passports} />}
      {activeTabId === 'sign-issue' && <SignAndIssueTab passports={passports} />}
      {(activeTabId === 'detail' || activeTabId === 'passport-detail') && (
        <PassportDetailTab passports={passports} selectedPassportId={effectivePassportId} />
      )}
      {activeTabId === 'qr' && <QrVerificationTab passports={passports} />}
      {activeTabId === 'sharing' && <PassportSharingTab passports={passports} />}
      {activeTabId === 'versions' && <PassportVersionsTab passports={passports} />}
    </div>
  );
};
