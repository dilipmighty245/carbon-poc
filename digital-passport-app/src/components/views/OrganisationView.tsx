import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Download, Building2, Factory, Workflow, Users, Calendar, Globe, ShieldAlert, Building } from 'lucide-react';
import { OrgProfileTab } from './organisation/OrgProfileTab';
import { OrgFacilitiesTab } from './organisation/OrgFacilitiesTab';
import { OrgProcessesTab } from './organisation/OrgProcessesTab';
import { OrgUsersRolesTab } from './organisation/OrgUsersRolesTab';
import { OrgReportingPeriodsTab } from './organisation/OrgReportingPeriodsTab';
import { OrgLocalisationTab } from './organisation/OrgLocalisationTab';
import { OrgApprovalsTab } from './organisation/OrgApprovalsTab';

export const OrganisationView: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const getInitialTab = (): string => {
    const tab = searchParams.get('tab');
    if (tab) {
      const lower = tab.toLowerCase();
      if (lower === 'users' || lower === 'users & roles' || lower === 'roles') {
        return 'Users & Roles';
      }
      if (lower === 'facilities') return 'Facilities';
      if (lower === 'processes') return 'Processes';
      if (lower === 'reporting periods' || lower === 'periods') return 'Reporting Periods';
      if (lower === 'localisation') return 'Localisation';
      if (lower === 'approvals') return 'Approvals';
      if (lower === 'profile') return 'Profile';
    }
    return 'Profile';
  };

  const [activeTab, setActiveTab] = useState(getInitialTab);

  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab) {
      const lower = tab.toLowerCase();
      if (lower === 'users' || lower === 'users & roles' || lower === 'roles') {
        setActiveTab('Users & Roles');
      }
    }
  }, [searchParams]);

  const tabs = [
    { id: 'Profile', label: 'Profile', icon: Building2 },
    { id: 'Facilities', label: 'Facilities', icon: Factory },
    { id: 'Processes', label: 'Processes', icon: Workflow },
    { id: 'Users & Roles', label: 'Users & Roles', icon: Users },
    { id: 'Reporting Periods', label: 'Reporting Periods', icon: Calendar },
    { id: 'Localisation', label: 'Localisation', icon: Globe },
    { id: 'Approvals', label: 'Approvals', icon: ShieldAlert },
  ];

  return (
    <div className="space-y-6">
      {/* Top Header Row with Breadcrumb & Context Filters */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
          <span className="hover:text-slate-800">Organisation</span>
          <span>/</span>
          <span className="text-slate-900 font-bold">Internal Registry & Settings</span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="bg-white border border-slate-200 rounded-lg px-3 py-1 text-xs font-medium text-slate-700 shadow-xs flex items-center gap-1.5">
            <span>Tema Processing Plant</span>
            <span className="text-slate-400 text-[10px]">▾</span>
          </div>
          <div className="bg-white border border-slate-200 rounded-lg px-3 py-1 text-xs font-medium text-slate-700 shadow-xs flex items-center gap-1.5">
            <span>FY 2026</span>
            <span className="text-slate-400 text-[10px]">▾</span>
          </div>
          <span className="bg-sky-100 text-sky-800 text-[10px] font-mono font-bold px-2.5 py-1 rounded-md tracking-wider">
            EMERGENT COMPLIANCE SAMPLE
          </span>
        </div>
      </div>

      {/* Main Title Banner & Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Organisation & Internal Workspace</h1>
          <p className="text-xs text-slate-500 font-medium">
            Manage entity legal identity, operating sites, process flows, RBAC roles, reporting periods, and approvals
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/registration')}
            className="px-4 py-2 bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center gap-2"
          >
            <Building className="w-3.5 h-3.5" />
            <span>Registration Wizard</span>
          </button>
          <button className="px-4 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center gap-2">
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Export Registry Dossier</span>
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
              onClick={() => setActiveTab(tab.id)}
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
        {activeTab === 'Facilities' && <OrgFacilitiesTab />}
        {activeTab === 'Processes' && <OrgProcessesTab />}
        {activeTab === 'Users & Roles' && <OrgUsersRolesTab />}
        {activeTab === 'Reporting Periods' && <OrgReportingPeriodsTab />}
        {activeTab === 'Localisation' && <OrgLocalisationTab />}
        {activeTab === 'Approvals' && <OrgApprovalsTab />}
      </div>
    </div>
  );
};
