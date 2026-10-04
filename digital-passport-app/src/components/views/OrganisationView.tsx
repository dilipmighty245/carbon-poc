import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Download, Building2, Factory, Workflow, Users, Calendar, Globe, ShieldAlert, Building, Layers } from 'lucide-react';
import { OrgProfileTab } from './organisation/OrgProfileTab';
import { OrgFacilitiesTab } from './organisation/OrgFacilitiesTab';
import { OrgProcessesTab } from './organisation/OrgProcessesTab';
import { OrgUsersRolesTab } from './organisation/OrgUsersRolesTab';
import { OrgReportingPeriodsTab } from './organisation/OrgReportingPeriodsTab';
import { OrgLocalisationTab } from './organisation/OrgLocalisationTab';
import { OrgApprovalsTab } from './organisation/OrgApprovalsTab';
import { OrgAssetTreeTab } from './organisation/OrgAssetTreeTab';

export const OrganisationView: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const requestedTab = searchParams.get('tab');

  const [activeTab, setActiveTab] = useState('Profile');

  useEffect(() => {
    if (requestedTab === 'asset-tree' || requestedTab === 'tree') {
      setActiveTab('Asset Tree');
    } else if (requestedTab === 'facilities') {
      setActiveTab('Facilities');
    } else if (requestedTab === 'profile') {
      setActiveTab('Profile');
    } else if (requestedTab === 'processes') {
      setActiveTab('Processes');
    } else if (requestedTab === 'users') {
      setActiveTab('Users & Roles');
    } else if (requestedTab === 'periods') {
      setActiveTab('Reporting Periods');
    } else if (requestedTab === 'localisation') {
      setActiveTab('Localisation');
    } else if (requestedTab === 'approvals') {
      setActiveTab('Approvals');
    } else {
      setActiveTab('Profile');
    }
  }, [requestedTab]);

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
    const paramMap: Record<string, string> = {
      'Profile': 'profile',
      'Facilities': 'facilities',
      'Asset Tree': 'asset-tree',
      'Processes': 'processes',
      'Users & Roles': 'users',
      'Reporting Periods': 'periods',
      'Localisation': 'localisation',
      'Approvals': 'approvals',
    };
    const param = paramMap[tabId] || 'profile';
    navigate(`/organisation?tab=${param}`);
  };

  const tabs = [
    { id: 'Profile', label: 'Profile', icon: Building2 },
    { id: 'Facilities', label: 'Facilities', icon: Factory },
    { id: 'Asset Tree', label: 'Asset Tree', icon: Layers },
    { id: 'Processes', label: 'Processes', icon: Workflow },
    { id: 'Users & Roles', label: 'Users & Roles', icon: Users },
    { id: 'Reporting Periods', label: 'Reporting Periods', icon: Calendar },
    { id: 'Localisation', label: 'Localisation', icon: Globe },
    { id: 'Approvals', label: 'Approvals', icon: ShieldAlert },
  ];

  return (
    <div className="space-y-6 font-sans">
      {/* Top Header Row with Breadcrumb & Context Filters */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
          <span className="hover:text-slate-800">Organisation</span>
          <span>/</span>
          <span className="text-slate-900 font-bold">Internal Registry & Settings</span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="bg-white border border-slate-200 rounded-lg px-3 py-1 text-xs font-medium text-slate-700 shadow-xs flex items-center gap-1.5">
            <span>Hyderabad Steel / Tema Plant</span>
            <span className="text-slate-400 text-[10px]">▾</span>
          </div>
          <div className="bg-white border border-slate-200 rounded-lg px-3 py-1 text-xs font-medium text-slate-700 shadow-xs flex items-center gap-1.5">
            <span>FY 2026</span>
            <span className="text-slate-400 text-[10px]">▾</span>
          </div>
          <span className="bg-sky-100 text-sky-800 text-[10px] font-mono font-bold px-2.5 py-1 rounded-md tracking-wider">
            SAURIENT DEMO COMPLIANCE
          </span>
        </div>
      </div>

      {/* Main Title Banner & Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Organisation & Internal Workspace</h1>
          <p className="text-xs text-slate-500 font-medium">
            Manage entity legal identity, operating sites, PAS800 telemetry asset tree, process flows, and RBAC roles
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => handleTabChange('Asset Tree')}
            className="px-4 py-2 bg-[#00E599] hover:bg-[#00c985] text-slate-950 text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center gap-2"
          >
            <Layers className="w-3.5 h-3.5" />
            <span>View Asset Tree</span>
          </button>
          <button
            onClick={() => navigate('/registration')}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center gap-2"
          >
            <Building className="w-3.5 h-3.5" />
            <span>Registration Wizard</span>
          </button>
          <button className="px-4 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center gap-2">
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Export Dossier</span>
          </button>
        </div>
      </div>

      {/* Sub Navigation Tabs Bar */}
      <div className="flex items-center gap-1 border-b border-slate-200 overflow-x-auto pb-px">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              className={`px-4 py-2.5 text-xs font-bold whitespace-nowrap border-b-2 transition-all flex items-center gap-2 ${
                activeTab === tab.id
                  ? 'border-emerald-600 text-emerald-800 bg-emerald-50/60 shadow-2xs'
                  : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
              }`}
            >
              <Icon className={`w-4 h-4 ${activeTab === tab.id ? 'text-emerald-700' : 'text-slate-400'}`} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Dynamic Subview Tab Render */}
      <div className="pt-2">
        {activeTab === 'Profile' && <OrgProfileTab />}
        {activeTab === 'Facilities' && <OrgFacilitiesTab onSelectAssetTree={() => handleTabChange('Asset Tree')} />}
        {activeTab === 'Asset Tree' && <OrgAssetTreeTab />}
        {activeTab === 'Processes' && <OrgProcessesTab />}
        {activeTab === 'Users & Roles' && <OrgUsersRolesTab />}
        {activeTab === 'Reporting Periods' && <OrgReportingPeriodsTab />}
        {activeTab === 'Localisation' && <OrgLocalisationTab />}
        {activeTab === 'Approvals' && <OrgApprovalsTab />}
      </div>
    </div>
  );
};
