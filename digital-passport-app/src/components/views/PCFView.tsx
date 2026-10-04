import React, { useState, useCallback, useRef, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { PcfProvider, usePcf } from '../../context/PcfContext';
import { ReadinessTracker } from '../pcf/ReadinessTracker';
import { ProjectsTab } from '../pcf/tabs/ProjectsTab';
import { OutputDefinitionTab } from '../pcf/tabs/OutputDefinitionTab';
import { BoundaryTab } from '../pcf/tabs/BoundaryTab';
import { InventoryTab } from '../pcf/tabs/InventoryTab';
import { AllocationTab } from '../pcf/tabs/AllocationTab';
import { LogisticsTab } from '../pcf/tabs/LogisticsTab';
import { CalculationTab } from '../pcf/tabs/CalculationTab';
import { HotspotsTab } from '../pcf/tabs/HotspotsTab';
import { ReportTab } from '../pcf/tabs/ReportTab';
import { Search, Download } from 'lucide-react';
import { toast } from '../../utils/toast';

interface TabConfig {
  key: string;
  label: string;
  Comp: React.ComponentType<{ registerPrimary: (fn: () => void) => void; search: string }>;
}

const TABS: TabConfig[] = [
  { key: 'projects', label: 'Projects', Comp: ProjectsTab },
  { key: 'output', label: 'Output Definition', Comp: OutputDefinitionTab },
  { key: 'boundary', label: 'Boundary', Comp: BoundaryTab },
  { key: 'inventory', label: 'Inventory', Comp: InventoryTab },
  { key: 'allocation', label: 'Allocation', Comp: AllocationTab },
  { key: 'logistics', label: 'Logistics', Comp: LogisticsTab },
  { key: 'calculation', label: 'Calculation', Comp: CalculationTab },
  { key: 'hotspots', label: 'Hotspots', Comp: HotspotsTab },
  { key: 'report', label: 'Report', Comp: ReportTab },
];

function InnerPCFWorkspace() {
  const { activeTab, setActiveTab, project } = usePcf();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const requestedTab = searchParams.get('tab');

  useEffect(() => {
    if (requestedTab) {
      const match = TABS.find((t) => 
        t.key === requestedTab || 
        t.key.startsWith(requestedTab) || 
        (requestedTab === 'result' && t.key === 'calculation') || 
        (requestedTab === 'lineage' && t.key === 'hotspots')
      );
      if (match) {
        setActiveTab(match.key);
      }
    }
  }, [requestedTab, setActiveTab]);
  const [search, setSearch] = useState('');
  const primaryRef = useRef<() => void>(() => toast.info('No action bound for this stage.'));

  const registerPrimary = useCallback((fn: () => void) => {
    primaryRef.current = fn;
  }, []);

  const handlePrimary = () => {
    if (primaryRef.current) primaryRef.current();
  };

  const handleDownload = () => {
    toast.success(`Preparing PCF export for ${project.id}…`);
  };

  const ActiveComponent = TABS.find((t) => t.key === activeTab)?.Comp || ProjectsTab;

  return (
    <div className="space-y-6">
      {/* Top Header Row with Breadcrumb & Search/Filters */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
          <span className="hover:text-slate-800">Carbon Accounting</span>
          <span>/</span>
          <span className="text-slate-900 font-bold">Product Carbon Footprint</span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="bg-white border border-slate-200 rounded-lg px-3 py-1 text-xs font-semibold text-slate-700 shadow-xs flex items-center gap-1.5">
            <span>{project.facility}</span>
            <span className="text-slate-400 text-[10px]">▾</span>
          </div>
          <div className="bg-white border border-slate-200 rounded-lg px-3 py-1 text-xs font-semibold text-slate-700 shadow-xs flex items-center gap-1.5">
            <span>{project.reportingPeriod}</span>
            <span className="text-slate-400 text-[10px]">▾</span>
          </div>
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search workspace..."
              className="bg-white border border-slate-200 rounded-lg pl-8 pr-3 py-1 text-xs text-slate-700 focus:outline-none focus:border-emerald-500 w-36 md:w-48 shadow-xs"
            />
          </div>
          <span className="bg-emerald-100 text-emerald-800 text-[10px] font-mono font-bold px-2.5 py-1 rounded-md tracking-wider">
            LIVE ENGINE
          </span>
        </div>
      </div>

      {/* Main Title Banner & Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Product Carbon Footprint</h1>
          <p className="text-xs text-slate-500 font-medium">
            Batch-level lifecycle footprint for {project.product} · <span className="font-mono font-bold text-slate-700">{project.batch}</span> ({project.id})
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleDownload}
            className="px-4 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center gap-2"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Export PCF</span>
          </button>
          <button
            onClick={handlePrimary}
            className="px-4 py-2 bg-[#00E599] hover:bg-[#00c985] text-slate-950 text-xs font-bold rounded-xl shadow-xs transition-colors"
          >
            Stage Primary Action
          </button>
        </div>
      </div>

      {/* Readiness Tracker Progress Bar */}
      <ReadinessTracker />

      {/* Workspace Sub Navigation Tabs */}
      <div className="flex items-center gap-1 border-b border-slate-200 overflow-x-auto pb-px">
        {TABS.map((tab, i) => (
          <button
            key={tab.key}
            onClick={() => {
              setActiveTab(tab.key);
              navigate(`/pcf?tab=${tab.key}`);
            }}
            data-testid={`tab-${tab.key}`}
            className={`px-3.5 py-2 text-xs font-semibold whitespace-nowrap border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === tab.key
                ? 'border-emerald-600 text-emerald-700 bg-emerald-50/40 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
            }`}
          >
            <span className="text-[10px] text-slate-400 font-mono">{i + 1}</span>
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Dynamic Active Tab Renderer */}
      <div className="pt-2">
        <ActiveComponent registerPrimary={registerPrimary} search={search} />
      </div>
    </div>
  );
}

export const PCFView: React.FC = () => {
  return (
    <PcfProvider>
      <InnerPCFWorkspace />
    </PcfProvider>
  );
};
