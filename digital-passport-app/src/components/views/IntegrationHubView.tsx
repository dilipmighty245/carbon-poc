import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Check, RefreshCw, Download, Search, Radio, AlertTriangle, ShieldCheck, Database, Server } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { useScenario } from '../../context/ScenarioContext';

export const IntegrationHubView: React.FC = () => {
  const { scenario } = useScenario();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const requestedTab = searchParams.get('tab');

  const [activeTab, setActiveTab] = useState('Connections');

  useEffect(() => {
    if (requestedTab === 'telemetry') {
      setActiveTab('Telemetry');
    } else if (requestedTab === 'exceptions' || requestedTab === 'quality') {
      setActiveTab('Exceptions');
    } else if (requestedTab === 'connections') {
      setActiveTab('Connections');
    } else if (requestedTab) {
      const match = tabs.find((t) => t.toLowerCase().replace(/\s+/g, '-') === requestedTab);
      if (match) setActiveTab(match);
    } else {
      setActiveTab('Connections');
    }
  }, [requestedTab]);

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    const paramMap: Record<string, string> = {
      'Telemetry': 'telemetry',
      'Exceptions': 'quality',
      'Connections': 'connections',
    };
    const param = paramMap[tab] || tab.toLowerCase().replace(/\s+/g, '-');
    navigate(`/data?tab=${param}`);
  };

  const tabs = ['Connections', 'Mapping Studio', 'Sync Controls', 'Import Jobs', 'Exceptions', 'Telemetry', 'Manual Entry', 'Bulk Upload'];

  const isSteel = scenario === 'steel';

  const kpis = isSteel
    ? [
        { title: 'Active Industrial Gateways', val: '4', subtitle: 'Schneider PAS800, GAIL Gas, SAP, DRI', color: 'text-[#10b981]' },
        { title: 'Telemetry Records Today', val: '142,800', subtitle: '1-min live readings accepted', color: 'text-[#10b981]' },
        { title: 'Data Quality Inbox', val: '0 Blockers', subtitle: '98% completeness achieved', color: 'text-emerald-600' },
        { title: 'PAS800 SCADA Uptime', val: '99.9%', subtitle: 'Continuous cast telemetry', color: 'text-emerald-600' },
      ]
    : [
        { title: 'Active Sources', val: '7', subtitle: 'SAP, CRM, meters and files', color: 'text-[#10b981]' },
        { title: 'Records Today', val: '18,420', subtitle: '99.3% accepted', color: 'text-[#10b981]' },
        { title: 'Data Exceptions', val: '14', subtitle: '5 require action', color: 'text-amber-600' },
        { title: 'Device Uptime', val: '98.7%', subtitle: '35 of 38 online', color: 'text-slate-400' },
      ];

  const monthData = [
    { month: 'O', val: 42, fill: '#f59e0b' },
    { month: 'N', val: 56, fill: '#10b981' },
    { month: 'D', val: 48, fill: '#06b6d4' },
    { month: 'J', val: 68, fill: '#06b6d4' },
    { month: 'F', val: 52, fill: '#10b981' },
    { month: 'M', val: 76, fill: '#f59e0b' },
    { month: 'A', val: 62, fill: '#06b6d4' },
    { month: 'M', val: 82, fill: '#10b981' },
    { month: 'J', val: 70, fill: '#06b6d4' },
    { month: 'J', val: 88, fill: '#06b6d4' },
    { month: 'A', val: 78, fill: '#10b981' },
    { month: 'S', val: 94, fill: '#06b6d4' },
  ];

  const gates = isSteel
    ? [
        {
          title: 'Schneider PAS800 SCADA Gateway',
          subtitle: 'Modbus TCP/IP · 1-minute power telemetry feed',
          badge: 'CONNECTED',
          badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200/60',
          icon: Check,
          iconClass: 'text-emerald-600 bg-emerald-50',
        },
        {
          title: 'GAIL Natural Gas Flow Meter (F-01)',
          subtitle: 'HART 4-20mA · Reheating furnace fuel feed',
          badge: 'ONLINE',
          badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200/60',
          icon: Check,
          iconClass: 'text-emerald-600 bg-emerald-50',
        },
        {
          title: 'Saurient Odisha DRI Supplier Feed',
          subtitle: 'Precursor actual intensity (0.777 tCO₂e/t)',
          badge: 'VERIFIED',
          badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200/60',
          icon: Check,
          iconClass: 'text-emerald-600 bg-emerald-50',
        },
      ]
    : [
        {
          title: 'Identity and boundary',
          subtitle: 'Complete and approved',
          badge: 'PASSED',
          badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200/60',
          icon: Check,
          iconClass: 'text-emerald-600 bg-emerald-50',
        },
        {
          title: 'Evidence and data quality',
          subtitle: 'Two items need attention',
          badge: 'REVIEW',
          badgeClass: 'bg-amber-50 text-amber-700 border-amber-200/60',
          icon: RefreshCw,
          iconClass: 'text-amber-600 bg-amber-50',
        },
        {
          title: 'Version provenance',
          subtitle: 'Immutable calculation trace',
          badge: 'AVAILABLE',
          badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200/60',
          icon: Check,
          iconClass: 'text-emerald-600 bg-emerald-50',
        },
      ];

  const records = isSteel
    ? [
        { name: 'MTR-PAS800-EL01 (Schneider)', type: 'EAF & Mill Power Telemetry', status: 'HEALTHY', statusClass: 'bg-emerald-50 text-emerald-700 border-emerald-100', time: 'Live (1-min)' },
        { name: 'MTR-GAS-02 (GAIL Meter)', type: 'Reheating Furnace Natural Gas', status: 'HEALTHY', statusClass: 'bg-emerald-50 text-emerald-700 border-emerald-100', time: '5 min ago' },
        { name: 'Saurient Odisha DRI Feed', type: 'Precursor Material Declaration', status: 'VERIFIED', statusClass: 'bg-emerald-50 text-emerald-700 border-emerald-100', time: 'Batch ST-00981' },
        { name: 'SAP S/4HANA ERP', type: 'Production Order & Weighbridge', status: 'SYNCED', statusClass: 'bg-emerald-50 text-emerald-700 border-emerald-100', time: '10,000 kg Steel' },
      ]
    : [
        { name: 'SAP S/4HANA', type: 'Production & purchasing', status: 'HEALTHY', statusClass: 'bg-emerald-50 text-emerald-700 border-emerald-100', time: '12 min ago' },
        { name: 'Sattric+ Gateway', type: 'Energy telemetry', status: 'HEALTHY', statusClass: 'bg-emerald-50 text-emerald-700 border-emerald-100', time: 'Live' },
        { name: 'Salesforce', type: 'Customers & requests', status: 'HEALTHY', statusClass: 'bg-emerald-50 text-emerald-700 border-emerald-100', time: '1 hr ago' },
        { name: 'Supplier PCF CSV', type: 'Monthly upload', status: 'WARNING', statusClass: 'bg-amber-50 text-amber-700 border-amber-100', time: '14 rejected' },
      ];

  return (
    <div className="space-y-6 font-sans">
      {/* Top Header Row with Breadcrumb & Filters */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
          <span className="hover:text-slate-800">Data</span>
          <span>/</span>
          <span className="text-slate-900 font-bold">Integration Hub</span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="bg-white border border-slate-200 rounded-lg px-3 py-1 text-xs font-medium text-slate-700 shadow-xs flex items-center gap-1.5">
            <span>{isSteel ? 'Hyderabad Manufacturing Facility' : 'Tema Processing Plant'}</span>
            <span className="text-slate-400 text-[10px]">▾</span>
          </div>
          <div className="bg-white border border-slate-200 rounded-lg px-3 py-1 text-xs font-medium text-slate-700 shadow-xs flex items-center gap-1.5">
            <span>FY 2026</span>
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
          <span className="bg-[#15342A] text-[#00E599] text-[10px] font-mono font-bold px-2.5 py-1 rounded-md tracking-wider border border-emerald-500/30">
            {isSteel ? 'SAURIENT STEEL INGESTION' : 'SIMULATED'}
          </span>
        </div>
      </div>

      {/* Main Title Banner & Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            {isSteel ? 'Industrial Telemetry & Data Acquisition Hub' : 'Integration Hub'}
          </h1>
          <p className="text-xs text-slate-500 font-medium">
            {isSteel
              ? 'Schneider PAS800 SCADA, gas flow meters, and supplier pre-assessment feeds'
              : 'Connect systems, devices and files to the canonical carbon model'}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button className="px-4 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center gap-2">
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Export Ingestion Log</span>
          </button>
          <button className="px-4 py-2 bg-[#00E599] hover:bg-[#00c985] text-slate-950 text-xs font-bold rounded-xl shadow-xs transition-colors">
            {isSteel ? 'Connect PAS800 Gateway' : 'Primary action'}
          </button>
        </div>
      </div>

      {/* Sub Navigation Tabs */}
      <div className="flex items-center gap-1 border-b border-slate-200 overflow-x-auto pb-px">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => handleTabChange(tab)}
            className={`px-4 py-2 text-xs font-semibold whitespace-nowrap border-b-2 transition-colors ${
              activeTab === tab
                ? 'border-emerald-600 text-emerald-700 bg-emerald-50/40 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Dynamic Sub-view Render for Telemetry vs Exceptions */}
      {activeTab === 'Telemetry' && (
        <div className="p-6 bg-slate-900 text-white rounded-2xl border border-slate-800 space-y-4 font-mono text-xs">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-3">
              <Radio className="w-5 h-5 text-[#00E599] animate-pulse" />
              <div>
                <span className="text-[#00E599] font-bold block text-sm">LIVE SCHNEIDER PAS800 TELEMETRY FEED</span>
                <span className="text-slate-400 text-[10px]">Gateway ID: GW-HYD-PAS800-01 · 1-Minute Sampling</span>
              </div>
            </div>
            <span className="bg-emerald-500/20 text-[#00E599] border border-emerald-500/40 text-[10px] font-bold px-2.5 py-1 rounded-md">
              FEED ACTIVE & SYNCED
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-sans text-xs">
            <div className="p-4 bg-slate-800/80 rounded-xl border border-slate-700">
              <span className="text-[10px] font-bold text-slate-400 block uppercase">EAF TRANSFORMER POWER</span>
              <span className="text-2xl font-black text-white mt-1 block">5,000 kWh</span>
              <span className="text-[10px] text-emerald-400 block font-mono">Factor: 0.716 kgCO₂e/kWh → 3.58 tCO₂e</span>
            </div>
            <div className="p-4 bg-slate-800/80 rounded-xl border border-slate-700">
              <span className="text-[10px] font-bold text-slate-400 block uppercase">REHEATING FURNACE NATURAL GAS</span>
              <span className="text-2xl font-black text-white mt-1 block">2,000 m³</span>
              <span className="text-[10px] text-emerald-400 block font-mono">Factor: 2.10 kgCO₂e/m³ → 4.20 tCO₂e</span>
            </div>
            <div className="p-4 bg-slate-800/80 rounded-xl border border-slate-700">
              <span className="text-[10px] font-bold text-slate-400 block uppercase">DRI PRECURSOR ATTRIBUTED</span>
              <span className="text-2xl font-black text-white mt-1 block">11,000 kg</span>
              <span className="text-[10px] text-emerald-400 block font-mono">Factor: 0.777 kgCO₂e/kg → 8.55 tCO₂e</span>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'Exceptions' && (
        <div className="p-6 bg-white rounded-2xl border border-slate-200 space-y-4 text-xs font-sans">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-3">
              <ShieldCheck className="w-5 h-5 text-emerald-600" />
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Data Quality Inbox & Exception Audit</h3>
                <p className="text-xs text-slate-500">Automated validation of telemetry gaps, range spikes, and missing evidence</p>
              </div>
            </div>
            <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-3 py-1 rounded-md">
              98% QUALITY SCORE · 0 BLOCKERS
            </span>
          </div>

          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-900 font-semibold flex items-center justify-between">
            <span>✓ All Schneider PAS800 SCADA telemetry feeds and GAIL gas invoices have passed automated audit checks.</span>
            <span className="font-mono text-xs font-bold bg-white text-emerald-800 px-2.5 py-1 rounded border border-emerald-300">
              AUDIT READY
            </span>
          </div>
        </div>
      )}

      {/* KPI Cards (4 columns) */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {kpis.map((k, i) => (
          <div key={i} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
            <span className="text-xs font-semibold text-slate-400 block mb-1">{k.title}</span>
            <span className="text-2xl font-black text-slate-900 tracking-tight">{k.val}</span>
            <span className={`text-xs font-semibold block mt-1 ${k.color}`}>{k.subtitle}</span>
          </div>
        ))}
      </div>

      {/* Middle Row (2/3 Chart + 1/3 Connection health) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2/3: Ingestion volume and quality */}
        <div className="lg:col-span-2 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <h3 className="font-bold text-slate-900 text-sm mb-4">
            {isSteel ? 'PAS800 Telemetry & Ingestion Volume' : 'Ingestion volume and quality'}
          </h3>

          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthData} barCategoryGap="25%">
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <YAxis hide />
                <Tooltip />
                <Bar dataKey="val" radius={[4, 4, 0, 0]}>
                  {monthData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-slate-100 text-xs">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#06b6d4]"></span>
                <span className="text-slate-600 font-medium text-[11px]">Current period</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#10b981]"></span>
                <span className="text-slate-600 font-medium text-[11px]">Verified primary data</span>
              </div>
            </div>
            <span className="text-[11px] text-slate-400 font-medium">Units and boundary shown in every chart</span>
          </div>
        </div>

        {/* Right 1/3: Connection health */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between space-y-4">
          <h3 className="font-bold text-slate-900 text-sm">Connection health</h3>

          <div className="space-y-3 flex-1 flex flex-col justify-center">
            {gates.map((g, i) => {
              const IconComp = g.icon;
              return (
                <div key={i} className="p-3.5 bg-slate-50/70 rounded-xl border border-slate-100 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className={`p-1.5 rounded-lg shrink-0 ${g.iconClass}`}>
                      <IconComp className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="font-bold text-xs text-slate-900">{g.title}</h4>
                      <p className="text-[11px] text-slate-400">{g.subtitle}</p>
                    </div>
                  </div>
                  <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold border tracking-wider ${g.badgeClass}`}>
                    {g.badge}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Bottom Card: Records and provenance */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-slate-900 text-sm">Records and provenance</h3>

          <div className="flex items-center gap-2">
            <button className="px-3 py-1 bg-sky-50 hover:bg-sky-100 border border-sky-200 text-sky-700 font-bold text-[10px] rounded-md tracking-wider transition-colors">
              EXPORT CSV
            </button>
            <button className="px-3 py-1 bg-sky-50 hover:bg-sky-100 border border-sky-200 text-sky-700 font-bold text-[10px] rounded-md tracking-wider transition-colors">
              PRINTABLE HTML
            </button>
          </div>
        </div>

        <div className="divide-y divide-slate-100 text-xs">
          {records.map((r, i) => (
            <div key={i} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="w-56">
                <span className="font-bold text-slate-900">{r.name}</span>
              </div>
              <div className="w-44 text-slate-500 font-medium">
                <span>{r.type}</span>
              </div>
              <div className="w-36">
                <span className={`border font-semibold px-3 py-1 rounded-full text-[11px] inline-block ${r.statusClass}`}>
                  {r.status}
                </span>
              </div>
              <div className="text-right font-medium text-slate-500 text-[11px] w-32">
                <span>{r.time}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
