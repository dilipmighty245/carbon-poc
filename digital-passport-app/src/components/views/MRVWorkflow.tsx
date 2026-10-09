import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Download, Search, GitMerge, ShieldCheck, AlertTriangle } from 'lucide-react';
import { MrvProvider, useMrv } from '../../context/MrvContext';
import { TABS } from '../../data/mrvMockData';
import { ReadinessTab } from './mrv/tabs/ReadinessTab';
import { EvidenceVaultTab } from './mrv/tabs/EvidenceVaultTab';
import { CalculationReviewTab } from './mrv/tabs/CalculationReviewTab';
import { DataFreezeTab } from './mrv/tabs/DataFreezeTab';
import { VerifiersTab } from './mrv/tabs/VerifiersTab';
import { EngagementsTab } from './mrv/tabs/EngagementsTab';
import { ConflictCheckTab } from './mrv/tabs/ConflictCheckTab';
import { PlanTab } from './mrv/tabs/PlanTab';
import { SiteVisitsTab } from './mrv/tabs/SiteVisitsTab';
import { FindingsTab } from './mrv/tabs/FindingsTab';
import { CorrectionsTab } from './mrv/tabs/CorrectionsTab';
import { ReportTab } from './mrv/tabs/ReportTab';

const TAB_COMPONENTS: Record<string, React.FC> = {
  readiness: ReadinessTab,
  evidence: EvidenceVaultTab,
  calculation: CalculationReviewTab,
  freeze: DataFreezeTab,
  verifiers: VerifiersTab,
  engagements: EngagementsTab,
  conflict: ConflictCheckTab,
  plan: PlanTab,
  sitevisits: SiteVisitsTab,
  findings: FindingsTab,
  corrections: CorrectionsTab,
  report: ReportTab,
};

function InnerMRVWorkflow() {
  const { tab = 'readiness' } = useParams<{ tab?: string }>();
  const navigate = useNavigate();
  const { meta, freezeDataset } = useMrv();

  const userRole = localStorage.getItem('saurient_user_role') || localStorage.getItem('auth_role') || 'Company Operator';
  const isVerifier = userRole.toLowerCase().includes('verifier');

  if (!isVerifier) {
    return (
      <div className="bg-white p-10 rounded-2xl border border-slate-200 shadow-sm max-w-2xl mx-auto my-12 text-center space-y-5">
        <div className="w-14 h-14 bg-indigo-50 border border-indigo-200 rounded-full flex items-center justify-center mx-auto text-indigo-700 shadow-xs">
          <GitMerge className="w-7 h-7" />
        </div>
        <div>
          <span className="px-3 py-1 bg-amber-100 text-amber-900 border border-amber-300 font-bold text-[10px] rounded-full uppercase tracking-wider">
            Restricted Auditor Access • Segregation of Duties
          </span>
          <h2 className="text-xl font-black text-slate-900 mt-2.5">Accredited Verifier Portal</h2>
          <p className="text-xs text-slate-600 mt-2 leading-relaxed max-w-lg mx-auto">
            Under EU CBAM (Regulation EU 2023/956) and ISO 14064-3, reporting companies cannot conduct or approve their own carbon verification. This workspace is reserved for certified third-party verification bodies (Bureau Veritas).
          </p>
        </div>
        <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-left text-xs space-y-1.5">
          <p className="font-bold text-slate-800">Company Operator Workflow:</p>
          <p className="text-slate-600">Company operators can submit product batches for review and monitor audit status in the Passport Readiness gate.</p>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          <button
            onClick={() => navigate('/passport/readiness')}
            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition"
          >
            Go to Passport Readiness Gate
          </button>
          <button
            onClick={() => {
              localStorage.setItem('saurient_user_role', 'Verifier');
              localStorage.setItem('auth_role', 'Verifier');
              window.location.reload();
            }}
            className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs transition"
          >
            Switch to Verifier Mode (Bureau Veritas)
          </button>
        </div>
      </div>
    );
  }

  const activeTabKey = TAB_COMPONENTS[tab.toLowerCase()] ? tab.toLowerCase() : 'readiness';
  const ActiveComponent = TAB_COMPONENTS[activeTabKey];

  return (
    <div className="space-y-6">
      {/* Top Header Row with Breadcrumb & Filters */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
          <span className="text-indigo-700 font-bold">Bureau Veritas Portal</span>
          <span>/</span>
          <span className="text-slate-900 font-bold">Accredited MRV Audit Workspace</span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="bg-white border border-slate-200 rounded-lg px-3 py-1 text-xs font-medium text-slate-700 shadow-xs flex items-center gap-1.5">
            <span>{meta.facility}</span>
            <span className="text-slate-400 text-[10px]">▾</span>
          </div>
          <div className="bg-white border border-slate-200 rounded-lg px-3 py-1 text-xs font-medium text-slate-700 shadow-xs flex items-center gap-1.5">
            <span>{meta.reportingPeriod}</span>
            <span className="text-slate-400 text-[10px]">▾</span>
          </div>
          <span className="bg-indigo-100 text-indigo-900 border border-indigo-200 text-[10px] font-mono font-bold px-2.5 py-1 rounded-md tracking-wider">
            BV ACCREDITED (NAB-8820)
          </span>
        </div>
      </div>

      {/* Main Title Banner & Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-100 text-indigo-900 border border-indigo-200 uppercase">
              Lead Auditor: Bureau Veritas
            </span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Accredited Verifier Portal</h1>
          <p className="text-xs text-slate-500 font-medium">Independent ISO 14064-3 & EU CBAM calculation and evidence verification</p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => alert('Downloading verification manifest package...')}
            className="px-4 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center gap-2"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Download Audit Package</span>
          </button>
        </div>
      </div>

      {/* Sub Navigation Tabs */}
      <div className="flex items-center gap-1 border-b border-slate-200 overflow-x-auto pb-px">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => navigate(`/mrv/${t.key}`)}
            className={`px-4 py-2 text-xs font-semibold whitespace-nowrap border-b-2 transition-colors ${
              activeTabKey === t.key
                ? 'border-emerald-600 text-emerald-700 bg-emerald-50/40 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Active Tab Sub-view Component */}
      <div className="pt-2">
        <ActiveComponent />
      </div>
    </div>
  );
}

export const MRVWorkflow: React.FC = () => {
  return (
    <MrvProvider>
      <InnerMRVWorkflow />
    </MrvProvider>
  );
};
