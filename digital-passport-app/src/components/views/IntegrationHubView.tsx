import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Download,
  Search,
  Radio,
  Workflow,
  Clock,
  Inbox,
  AlertTriangle,
  Zap,
  FileEdit,
  UploadCloud,
  ChevronDown,
  Layers,
  Plus,
} from 'lucide-react';

import type { DataSource } from './integration-hub/types';
import { ConnectionsTab } from './integration-hub/tabs/ConnectionsTab';
import { MappingStudioTab } from './integration-hub/tabs/MappingStudioTab';
import { SyncControlsTab } from './integration-hub/tabs/SyncControlsTab';
import { ImportJobsTab } from './integration-hub/tabs/ImportJobsTab';
import { ExceptionsTab } from './integration-hub/tabs/ExceptionsTab';
import { TelemetryTab } from './integration-hub/tabs/TelemetryTab';
import { ManualEntryTab } from './integration-hub/tabs/ManualEntryTab';
import { BulkUploadTab } from './integration-hub/tabs/BulkUploadTab';
import { MenuHandoffDrawer } from './integration-hub/drawers/MenuHandoffDrawer';
import { AddConnectionDrawer } from './integration-hub/drawers/AddConnectionDrawer';

export const IntegrationHubView: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  const tabMapping: Record<string, string> = {
    connections: 'Connections',
    'mapping-studio': 'Mapping Studio',
    mapping: 'Mapping Studio',
    'sync-controls': 'Sync Controls',
    sync: 'Sync Controls',
    'import-jobs': 'Import Jobs',
    jobs: 'Import Jobs',
    exceptions: 'Exceptions',
    telemetry: 'Telemetry',
    'manual-entry': 'Manual Entry',
    manual: 'Manual Entry',
    'bulk-upload': 'Bulk Upload',
    upload: 'Bulk Upload',
  };

  const getInitialTab = (): string => {
    const raw = searchParams.get('tab')?.toLowerCase();
    if (raw && tabMapping[raw]) {
      return tabMapping[raw];
    }
    return 'Connections';
  };

  const [activeTab, setActiveTab] = useState<string>(getInitialTab);
  const [isHandoffOpen, setIsHandoffOpen] = useState(false);
  const [isAddConnectionOpen, setIsAddConnectionOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Context filters
  const [selectedFacility, setSelectedFacility] = useState('Tema Processing Plant');
  const [selectedPeriod, setSelectedPeriod] = useState('September 2026');

  // Initial Data Sources state
  const [sources, setSources] = useState<DataSource[]>([
    {
      id: 'SRC-001',
      name: 'ERP purchase feed',
      type: 'File connector',
      mode: 'Simulated',
      lastImport: 'Today 09:42',
      health: 'Healthy',
      facility: 'FAC-001',
      recordsCount: 80,
    },
    {
      id: 'SRC-002',
      name: 'Plant energy gateway',
      type: 'Meter simulation',
      mode: 'Simulated',
      lastImport: 'Today 09:45',
      health: 'Healthy',
      facility: 'FAC-001',
      recordsCount: 38,
    },
    {
      id: 'SRC-003',
      name: 'Supplier declarations',
      type: 'Manual entry',
      mode: 'Manual',
      lastImport: 'Today 09:12',
      health: 'Needs evidence',
      facility: 'FAC-001',
      recordsCount: 2,
    },
  ]);

  useEffect(() => {
    const raw = searchParams.get('tab')?.toLowerCase();
    if (raw && tabMapping[raw]) {
      setActiveTab(tabMapping[raw]);
    }
  }, [searchParams]);

  const handleTabSelect = (tabName: string) => {
    setActiveTab(tabName);
    const slug = tabName.toLowerCase().replace(/\s+/g, '-');
    setSearchParams({ tab: slug }, { replace: true });
  };

  const handleAddConnection = (newSource: DataSource) => {
    setSources((prev) => [newSource, ...prev]);
  };

  const handleDownloadSourceRegister = () => {
    const header = 'source,type,mode,status,last_import,facility\n';
    const rows = sources
      .map(
        (s) =>
          `"${s.name}","${s.type}","${s.mode}","${s.health}","${s.lastImport}","${s.facility}"`
      )
      .join('\n');

    const blob = new Blob([header + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'source-register.csv';
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const tabs = [
    { id: 'Connections', label: 'Connections', icon: Radio },
    { id: 'Mapping Studio', label: 'Mapping Studio', icon: Workflow },
    { id: 'Sync Controls', label: 'Sync Controls', icon: Clock },
    { id: 'Import Jobs', label: 'Import Jobs', icon: Inbox },
    { id: 'Exceptions', label: 'Exceptions', icon: AlertTriangle },
    { id: 'Telemetry', label: 'Telemetry', icon: Zap },
    { id: 'Manual Entry', label: 'Manual Entry', icon: FileEdit },
    { id: 'Bulk Upload', label: 'Bulk Upload', icon: UploadCloud },
  ];

  const getPrimaryActionLabel = () => {
    switch (activeTab) {
      case 'Connections':
        return 'Add Connection';
      case 'Mapping Studio':
        return 'Save Mapping';
      case 'Sync Controls':
        return 'Sync Now';
      case 'Import Jobs':
        return 'View Job Errors';
      case 'Exceptions':
        return 'Resolve Exceptions';
      case 'Telemetry':
        return 'View Device Trace';
      case 'Manual Entry':
        return 'Add Activity';
      case 'Bulk Upload':
        return 'Validate Upload';
      default:
        return 'Primary action';
    }
  };

  const handlePrimaryActionClick = () => {
    if (activeTab === 'Connections') {
      setIsAddConnectionOpen(true);
    } else if (activeTab === 'Exceptions') {
      // scroll or focus
    } else if (activeTab === 'Import Jobs') {
      handleTabSelect('Exceptions');
    } else if (activeTab === 'Telemetry') {
      setIsHandoffOpen(true);
    } else {
      setIsAddConnectionOpen(true);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header Row with Breadcrumbs & Context Filters */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
          <span className="hover:text-slate-800">Data</span>
          <span>/</span>
          <span className="text-slate-900 font-bold">Integration Hub</span>
          <span>/</span>
          <span className="text-emerald-700 font-bold">{activeTab}</span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Facility Filter */}
          <div className="bg-white border border-slate-200 rounded-lg px-3 py-1 text-xs font-medium text-slate-700 shadow-2xs flex items-center gap-1.5">
            <span>{selectedFacility}</span>
            <ChevronDown className="w-3 h-3 text-slate-400" />
          </div>

          {/* Period Filter */}
          <div className="bg-white border border-slate-200 rounded-lg px-3 py-1 text-xs font-medium text-slate-700 shadow-2xs flex items-center gap-1.5">
            <span>{selectedPeriod} (FY 2026)</span>
            <ChevronDown className="w-3 h-3 text-slate-400" />
          </div>

          {/* Search Records */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search records, source IDs..."
              className="bg-white border border-slate-200 rounded-lg pl-8 pr-3 py-1 text-xs text-slate-700 focus:outline-none focus:border-emerald-500 w-36 md:w-48 shadow-2xs"
            />
          </div>

          <span className="bg-sky-100 text-sky-800 text-[10px] font-mono font-bold px-2.5 py-1 rounded-md tracking-wider">
            DEMO DATA
          </span>
        </div>
      </div>

      {/* Main Title Banner & Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Integration Hub
          </h1>
          <p className="text-xs text-slate-500 font-medium">
            Connect systems, devices and files to the canonical carbon model
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleDownloadSourceRegister}
            className="px-4 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold rounded-xl shadow-2xs transition-colors flex items-center gap-2"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Download Source Register</span>
          </button>
          <button
            onClick={handlePrimaryActionClick}
            className="px-4 py-2 bg-[#00E599] hover:bg-[#00c985] text-slate-950 text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center gap-2"
          >
            {activeTab === 'Connections' && <Plus className="w-3.5 h-3.5" />}
            <span>{getPrimaryActionLabel()}</span>
          </button>
        </div>
      </div>

      {/* Sub Navigation Tabs Bar */}
      <div className="flex items-center gap-1 border-b border-slate-200 overflow-x-auto pb-px">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => handleTabSelect(tab.id)}
              className={`px-4 py-2.5 text-xs font-bold whitespace-nowrap border-b-2 transition-all flex items-center gap-2 ${
                isActive
                  ? 'border-emerald-600 text-emerald-800 bg-emerald-50/60 shadow-2xs'
                  : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-700' : 'text-slate-400'}`} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Dynamic Tab Render */}
      <div className="pt-2">
        {activeTab === 'Connections' && (
          <ConnectionsTab
            sources={sources}
            onNavigateTab={handleTabSelect}
            onOpenAddConnection={() => setIsAddConnectionOpen(true)}
            onOpenHandoff={() => setIsHandoffOpen(true)}
          />
        )}
        {activeTab === 'Mapping Studio' && <MappingStudioTab />}
        {activeTab === 'Sync Controls' && <SyncControlsTab />}
        {activeTab === 'Import Jobs' && (
          <ImportJobsTab onNavigateTab={handleTabSelect} />
        )}
        {activeTab === 'Exceptions' && (
          <ExceptionsTab onNavigateTab={handleTabSelect} />
        )}
        {activeTab === 'Telemetry' && (
          <TelemetryTab
            onNavigateTab={handleTabSelect}
            onOpenHandoff={() => setIsHandoffOpen(true)}
          />
        )}
        {activeTab === 'Manual Entry' && <ManualEntryTab />}
        {activeTab === 'Bulk Upload' && (
          <BulkUploadTab onNavigateTab={handleTabSelect} />
        )}
      </div>

      {/* Context-Preserving Menu Handoff Drawer */}
      <MenuHandoffDrawer
        isOpen={isHandoffOpen}
        onClose={() => setIsHandoffOpen(false)}
        facility={`${selectedFacility} (FAC-001)`}
        period={`${selectedPeriod} (FY 2026)`}
        batch="Steel coil / BATCH-001"
      />

      {/* Add Connection Drawer */}
      <AddConnectionDrawer
        isOpen={isAddConnectionOpen}
        onClose={() => setIsAddConnectionOpen(false)}
        onAddConnection={handleAddConnection}
      />
    </div>
  );
};
