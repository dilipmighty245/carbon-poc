import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { QrCode, RefreshCw } from 'lucide-react';
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
        scope_1_direct: { value_kg_co2e: 4200, percentage: 25.7 },
        scope_2_indirect_energy: { value_kg_co2e: 3580, percentage: 21.9 },
        scope_3_value_chain: { value_kg_co2e: 8550, percentage: 52.4 },
      },
      source_breakdown: {
        raw_materials: { value_kg_co2e: 6800, percentage: 41.6 },
        electricity: { value_kg_co2e: 3580, percentage: 21.9 },
        logistics_transport: { value_kg_co2e: 1300, percentage: 8.0 },
        on_site_fuel: { value_kg_co2e: 4200, percentage: 25.7 },
        packaging: { value_kg_co2e: 450, percentage: 2.8 },
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
      product_name: 'Organic Cocoa Butter Batch #408',
      batch_number: 'CB-2026-001',
      producer_organization: 'Asante Cocoa Cooperative',
      facility: {
        name: 'Tema Processing Plant',
        location: 'Tema, Ghana',
        country_of_origin: 'Ghana',
      },
      production_date: '2026-03-15',
      batch_size: {
        quantity: 5000,
        unit: 'kg',
      },
      hs_code: '1804.00',
    },
    carbon_footprint: {
      total_batch_footprint_kg_co2e: 12250,
      intensity_per_unit: {
        value: 2.450,
        unit: 'kg CO2e/kg',
      },
      scope_breakdown: {
        scope_1_direct: { value_kg_co2e: 1750, percentage: 14.3 },
        scope_2_indirect_energy: { value_kg_co2e: 2500, percentage: 20.4 },
        scope_3_value_chain: { value_kg_co2e: 8000, percentage: 65.3 },
      },
      source_breakdown: {
        raw_materials: { value_kg_co2e: 7000, percentage: 57.1 },
        electricity: { value_kg_co2e: 2500, percentage: 20.4 },
        logistics_transport: { value_kg_co2e: 1000, percentage: 8.2 },
        on_site_fuel: { value_kg_co2e: 1750, percentage: 14.3 },
        packaging: { value_kg_co2e: 0, percentage: 0.0 },
      },
    },
    methodology_and_audit: {
      calculation_rulebook: 'cocoa-rulebook-2026',
      accounting_standard: 'GHG Protocol Product Standard',
      verification_body: 'Meridian Assurance Ltd',
      assurance_level: 'Reasonable Assurance',
      verification_id: 'VER-2026-001',
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
  const { tab = 'registry', passportId } = useParams<{ tab?: string; passportId?: string }>();
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

  const activeTabId = tab.toLowerCase();

  const handleTabChange = (newTabId: string) => {
    navigate(`/passport/${newTabId}`);
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
  const passports = fetchedPassports.length > 0 ? fetchedPassports : DEFAULT_FALLBACK_PASSPORTS;

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
      </div>

      {/* Render Active Sub-View */}
      {activeTabId === 'registry' && <PassportRegistryTab passports={passports} tenantId={tenantId} />}
      {activeTabId === 'readiness' && <PassportReadinessTab passports={passports} />}
      {activeTabId === 'preview' && <PassportPreviewTab passports={passports} />}
      {activeTabId === 'sign-issue' && <SignAndIssueTab passports={passports} />}
      {(activeTabId === 'detail' || activeTabId === 'passport-detail') && (
        <PassportDetailTab passports={passports} />
      )}
      {activeTabId === 'qr' && <QrVerificationTab passports={passports} />}
      {activeTabId === 'sharing' && <PassportSharingTab passports={passports} />}
      {activeTabId === 'versions' && <PassportVersionsTab passports={passports} />}
    </div>
  );
};
