import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { QrCode, RefreshCw } from 'lucide-react';
import { getAllPassportsWithMeta, DEFAULT_TENANT_ID, getActiveTenantId, type ApiFetchResult } from '../../api/client';
import type { RichDigitalPassport } from '../../types';

import { PassportRegistryTab } from './passport/tabs/PassportRegistryTab';
import { PassportDetailTab } from './passport/tabs/PassportDetailTab';
import { PassportReadinessTab } from './passport/tabs/PassportReadinessTab';
import { PassportPreviewTab } from './passport/tabs/PassportPreviewTab';
import { SignAndIssueTab } from './passport/tabs/SignAndIssueTab';
import { QrVerificationTab } from './passport/tabs/QrVerificationTab';
import { PassportSharingTab } from './passport/tabs/PassportSharingTab';
import { PassportVersionsTab } from './passport/tabs/PassportVersionsTab';

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

  const userRole = localStorage.getItem('saurient_user_role') || localStorage.getItem('auth_role') || 'Company Operator';
  const isVerifier = userRole.toLowerCase().includes('verifier');
  const isOfficer = userRole.toLowerCase().includes('officer');
  const isOperator = !isVerifier && !isOfficer;

  const [passportsResult, setPassportsResult] = useState<ApiFetchResult<RichDigitalPassport[]> | null>(null);
  const [loading, setLoading] = useState(true);
  const tenantId = getActiveTenantId();

  const loadData = async () => {
    setLoading(true);
    const listRes = await getAllPassportsWithMeta(tenantId);
    setPassportsResult(listRes);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, [tenantId]);

  const validTabs = ['registry', 'readiness', 'preview', 'sign-issue', 'detail', 'passport-detail', 'qr', 'sharing', 'versions'];
  const activeTabId = validTabs.includes(tab.toLowerCase()) ? tab.toLowerCase() : 'registry';

  // Company login should NOT see or access "Sign & Issue"
  useEffect(() => {
    if (isOperator && activeTabId === 'sign-issue') {
      navigate('/passport/readiness', { replace: true });
    }
  }, [isOperator, activeTabId, navigate]);

  const visibleTabs = PASSPORT_TABS.filter((t) => {
    if (isOperator && t.id === 'sign-issue') return false;
    return true;
  });

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

  const passports = passportsResult?.data || [];

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
            {visibleTabs.map((t) => (
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
      {activeTabId === 'registry' && <PassportRegistryTab passports={passports} tenantId={tenantId} onRefresh={loadData} />}
      {activeTabId === 'readiness' && <PassportReadinessTab passports={passports} />}
      {activeTabId === 'preview' && <PassportPreviewTab passports={passports} />}
      {activeTabId === 'sign-issue' && <SignAndIssueTab passports={passports} />}
      {(activeTabId === 'detail' || activeTabId === 'passport-detail') && (
        <PassportDetailTab passports={passports} onRefresh={loadData} />
      )}
      {activeTabId === 'qr' && <QrVerificationTab passports={passports} />}
      {activeTabId === 'sharing' && <PassportSharingTab passports={passports} />}
      {activeTabId === 'versions' && <PassportVersionsTab passports={passports} />}
    </div>
  );
};
