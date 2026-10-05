import React, { useState, useRef } from 'react';
import { ValueChainProvider, useVC } from '../../context/ValueChainContext';
import { Analytics } from '../value-chain/Analytics';
import { AuditDrawer } from '../value-chain/AuditDrawer';
import { SuppliersTab } from '../value-chain/tabs/SuppliersTab';
import { InvitationsTab } from '../value-chain/tabs/InvitationsTab';
import { DeclarationsTab } from '../value-chain/tabs/DeclarationsTab';
import { EvidenceTab } from '../value-chain/tabs/EvidenceTab';
import { ScorecardsTab } from '../value-chain/tabs/ScorecardsTab';
import { SupplyCatalogueTab } from '../value-chain/tabs/SupplyCatalogueTab';
import { CustomerRequestsTab } from '../value-chain/tabs/CustomerRequestsTab';
import { CustomerCatalogueTab } from '../value-chain/tabs/CustomerCatalogueTab';
import { Download, Search, Plus, BarChart2, History, ChevronDown } from 'lucide-react';
import { toast } from '../../utils/toast';

const TABS = [
  { key: 'suppliers', label: 'Suppliers', primary: 'Add Supplier' },
  { key: 'invitations', label: 'Invitations', primary: 'Invite Supplier' },
  { key: 'declarations', label: 'Declarations', primary: 'Review Declaration' },
  { key: 'evidence', label: 'Evidence', primary: 'Review Evidence' },
  { key: 'scorecards', label: 'Scorecards', primary: 'Create Improvement Request' },
  { key: 'catalogue', label: 'Supply Catalogue', primary: 'Add Catalogue Product' },
  { key: 'customer-requests', label: 'Customer Requests', primary: 'Respond to Request' },
  { key: 'customer-catalogue', label: 'Customer Catalogue', primary: 'Share Product Carbon Data' },
];

const DOWNLOADS = [
  'Supplier Register',
  'Supplier Carbon Data Report',
  'Declaration Register',
  'Evidence Register',
  'Supplier Scorecards',
  'Supply Catalogue',
  'Primary Data Coverage Report',
  'Scope 3 Supplier Report',
  'Supplier Data Gap Report',
  'Customer Request Register',
  'Customer Catalogue',
  'Value Chain Audit Trail',
];

const ValueChainContent: React.FC = () => {
  const { ORG } = useVC();
  const [activeTab, setActiveTab] = useState('suppliers');
  const [search, setSearch] = useState('');
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [auditOpen, setAuditOpen] = useState(false);
  const [downloadOpen, setDownloadOpen] = useState(false);

  const primaryRefs = useRef<Record<string, () => void>>({});

  const registerPrimary = (key: string, fn: () => void) => {
    primaryRefs.current[key] = fn;
  };

  const runPrimary = () => {
    primaryRefs.current[activeTab]?.();
  };

  const currentTab = TABS.find((t) => t.key === activeTab) || TABS[0];

  return (
    <div className="space-y-6">
      {/* Top Header Row with Breadcrumb & Filters */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
            <span className="hover:text-slate-800">Value Chain</span>
            <span>/</span>
            <span className="text-slate-900 font-bold">Supplier & Customer Network</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight mt-1">
            Supplier & Customer Network
          </h1>
          <p className="text-xs text-slate-500 font-medium">
            Primary carbon data, declarations, evidence and improvement workflow
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="bg-emerald-100 text-emerald-800 text-[10px] font-mono font-bold px-2.5 py-1 rounded-md tracking-wider uppercase">
            LIVE NETWORK
          </span>

          <button
            onClick={() => setShowAnalytics(!showAnalytics)}
            className={`px-3 py-1.5 border text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center gap-1.5 ${
              showAnalytics
                ? 'bg-emerald-600 text-white border-emerald-600'
                : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700'
            }`}
          >
            <BarChart2 className="w-3.5 h-3.5" />
            <span>Analytics</span>
          </button>

          <button
            onClick={() => setAuditOpen(true)}
            data-testid="audit-btn"
            className="px-3 py-1.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
          >
            <History className="w-3.5 h-3.5 text-slate-500" />
            <span>Audit Trail</span>
          </button>

          <div className="relative">
            <button
              onClick={() => setDownloadOpen(!downloadOpen)}
              data-testid="download-btn"
              className="px-3 py-1.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5 text-slate-500" />
              <span>Download</span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>
            {downloadOpen && (
              <div className="absolute right-0 z-30 mt-1 w-60 bg-white border border-slate-200 rounded-xl shadow-xl py-2 text-xs font-semibold">
                <div className="px-3 py-1 text-[10px] font-mono text-slate-400 uppercase font-bold border-b border-slate-100">
                  Value Chain Exports
                </div>
                {DOWNLOADS.map((d) => (
                  <button
                    key={d}
                    onClick={() => {
                      setDownloadOpen(false);
                      toast.success(`Exporting: ${d}`, { description: 'Generating .xlsx report' });
                    }}
                    className="w-full text-left px-3 py-1.5 hover:bg-slate-50 text-slate-700 block truncate"
                  >
                    {d}
                  </button>
                ))}
              </div>
            )}
          </div>

          <button
            onClick={runPrimary}
            data-testid="primary-action-btn"
            className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{currentTab.primary}</span>
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-2">
          <div className="text-xs font-bold text-slate-700 px-2 py-1 bg-slate-100 rounded-lg">
            Facility: {ORG.facility}
          </div>
          <div className="text-xs font-bold text-slate-700 px-2 py-1 bg-slate-100 rounded-lg">
            Period: {ORG.reportingPeriod}
          </div>
        </div>

        <div className="relative">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search network records..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-emerald-500 w-56 md:w-64"
          />
        </div>
      </div>

      {/* Analytics Expandable Panel */}
      {showAnalytics && (
        <div className="p-4 bg-slate-50/80 rounded-2xl border border-slate-200">
          <Analytics onFilter={(tabKey) => setActiveTab(tabKey)} />
        </div>
      )}

      {/* Sub Navigation Tabs */}
      <div className="flex items-center gap-1 border-b border-slate-200 overflow-x-auto pb-px">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2 text-xs font-bold whitespace-nowrap border-b-2 transition-colors ${
              activeTab === tab.key
                ? 'border-emerald-600 text-emerald-800 bg-emerald-50/50'
                : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Contents */}
      {activeTab === 'suppliers' && (
        <SuppliersTab search={search} registerPrimary={registerPrimary} goToTab={setActiveTab} />
      )}
      {activeTab === 'invitations' && (
        <InvitationsTab search={search} registerPrimary={registerPrimary} />
      )}
      {activeTab === 'declarations' && (
        <DeclarationsTab search={search} registerPrimary={registerPrimary} goToTab={setActiveTab} />
      )}
      {activeTab === 'evidence' && (
        <EvidenceTab search={search} registerPrimary={registerPrimary} goToTab={setActiveTab} />
      )}
      {activeTab === 'scorecards' && (
        <ScorecardsTab search={search} registerPrimary={registerPrimary} />
      )}
      {activeTab === 'catalogue' && (
        <SupplyCatalogueTab search={search} registerPrimary={registerPrimary} />
      )}
      {activeTab === 'customer-requests' && (
        <CustomerRequestsTab search={search} registerPrimary={registerPrimary} goToTab={setActiveTab} />
      )}
      {activeTab === 'customer-catalogue' && (
        <CustomerCatalogueTab search={search} registerPrimary={registerPrimary} />
      )}

      {/* Slide-over Audit Trail */}
      <AuditDrawer open={auditOpen} onClose={() => setAuditOpen(false)} />
    </div>
  );
};

export const SuppliersView: React.FC = () => {
  return (
    <ValueChainProvider>
      <ValueChainContent />
    </ValueChainProvider>
  );
};

export default SuppliersView;
