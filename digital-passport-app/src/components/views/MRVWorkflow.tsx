import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Download, Search } from 'lucide-react';
import { MrvProvider, useMrv } from '../../context/MrvContext';
import { TABS } from '../../data/mrvMockData';
import { ReadinessTab } from './mrv/tabs/ReadinessTab';
import { EvidenceVaultTab } from './mrv/tabs/EvidenceVaultTab';
import { CalculationReviewTab } from './mrv/tabs/CalculationReviewTab';
import { DataFreezeTab } from './mrv/tabs/DataFreezeTab';
import { VerifiersTab } from './mrv/tabs/VerifiersTab';
import { OnboardingTab } from './mrv/tabs/OnboardingTab';
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
  onboarding: OnboardingTab,
  engagements: EngagementsTab,
  conflict: ConflictCheckTab,
  plan: PlanTab,
  sitevisits: SiteVisitsTab,
  findings: FindingsTab,
  corrections: CorrectionsTab,
  report: ReportTab,
  statement: ReportTab,
};

function InnerMRVWorkflow() {
  const { tab = 'readiness' } = useParams<{ tab?: string }>();
  const navigate = useNavigate();
  const { meta, freezeDataset } = useMrv();

  const activeTabKey = TAB_COMPONENTS[tab.toLowerCase()] ? tab.toLowerCase() : 'readiness';
  const ActiveComponent = TAB_COMPONENTS[activeTabKey];

  return (
    <div className="space-y-6">
      {/* Top Header Row with Breadcrumb & Filters */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
          <span className="hover:text-slate-800 cursor-pointer" onClick={() => navigate('/mrv')}>MRV & Verification</span>
          <span>/</span>
          <span className="text-slate-900 font-bold">MRV & Independent Verification</span>
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
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search records"
              className="bg-white border border-slate-200 rounded-lg pl-8 pr-3 py-1 text-xs text-slate-700 focus:outline-none focus:border-emerald-500 w-36 md:w-44"
            />
          </div>
          <span className="bg-sky-100 text-sky-800 text-[10px] font-mono font-bold px-2.5 py-1 rounded-md tracking-wider">
            SIMULATED
          </span>
        </div>
      </div>

      {/* Main Title Banner & Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">MRV & Independent Verification</h1>
          <p className="text-xs text-slate-500 font-medium">Evidence, data freeze, findings and accredited verification workflow</p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => alert('Downloading verification manifest package...')}
            className="px-4 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center gap-2"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Download</span>
          </button>
          <button
            onClick={freezeDataset}
            className="px-4 py-2 bg-[#00E599] hover:bg-[#00c985] text-slate-950 text-xs font-bold rounded-xl shadow-xs transition-colors"
          >
            Primary action
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
