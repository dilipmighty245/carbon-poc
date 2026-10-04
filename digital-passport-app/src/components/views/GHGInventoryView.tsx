import React from 'react';
import { useSearchParams } from 'react-router-dom';
import { Check, RefreshCw, Download, Search } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { useScenario } from '../../context/ScenarioContext';

export const GHGInventoryView: React.FC = () => {
  const { scenario } = useScenario();
  const [searchParams, setSearchParams] = useSearchParams();
  const requestedTab = searchParams.get('tab');
  const tabs = [
    'Overview',
    'Boundary',
    'Source Map',
    'Scope 1',
    'Scope 2 Location',
    'Scope 2 Market',
    'Scope 3',
    'Calculations',
    'Review',
    'Report',
  ];

  const activeTab =
    tabs.find((t) => t.toLowerCase().replace(/\s+/g, '-') === requestedTab?.toLowerCase()) || 'Overview';

  const handleTabChange = (t: string) => {
    setSearchParams({ tab: t.toLowerCase().replace(/\s+/g, '-') });
  };

  const isSteel = scenario === 'steel';

  const kpis = isSteel
    ? [
        { title: 'Scope 1 (Furnace Gas)', val: '4,200 kgCO₂e', subtitle: '25.7% of batch total', color: 'text-rose-600' },
        { title: 'Scope 2 (PAS800 Power)', val: '3,580 kgCO₂e', subtitle: '21.9% of batch total', color: 'text-sky-600' },
        { title: 'Scope 3 (Precursors)', val: '8,550 kgCO₂e', subtitle: '52.4% of batch total', color: 'text-emerald-600' },
        { title: 'Primary Telemetry', val: '94%', subtitle: 'Schneider PAS800 & GAIL meters', color: 'text-emerald-600' },
      ]
    : [
        { title: 'Scope 1', val: '3,148 tCO₂e', subtitle: '24.5% of total', color: 'text-emerald-600' },
        { title: 'Scope 2', val: '4,266 tCO₂e', subtitle: '33.2% of total', color: 'text-emerald-600' },
        { title: 'Scope 3', val: '5,428 tCO₂e', subtitle: '42.3% of total', color: 'text-emerald-600' },
        { title: 'Primary Data', val: '81%', subtitle: 'Target 85%', color: 'text-emerald-600' },
      ];

  const monthData = isSteel
    ? [
        { month: 'Oct', val: 1420, fill: '#10b981' },
        { month: 'Nov', val: 1380, fill: '#10b981' },
        { month: 'Dec', val: 1450, fill: '#06b6d4' },
        { month: 'Jan', val: 1520, fill: '#06b6d4' },
        { month: 'Feb', val: 1490, fill: '#10b981' },
        { month: 'Mar', val: 1633, fill: '#10b981' },
        { month: 'Apr', val: 1580, fill: '#06b6d4' },
        { month: 'May', val: 1610, fill: '#10b981' },
        { month: 'Jun', val: 1550, fill: '#06b6d4' },
        { month: 'Jul', val: 1620, fill: '#06b6d4' },
        { month: 'Aug', val: 1590, fill: '#10b981' },
        { month: 'Sep', val: 1633, fill: '#10b981' },
      ]
    : [
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
          title: 'Identity and boundary',
          subtitle: 'Saurient Demo Steel Industries Ltd · Hyderabad Plant',
          badge: 'PASSED',
          badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200/60',
          icon: Check,
          iconClass: 'text-emerald-600 bg-emerald-50',
        },
        {
          title: 'Telemetry & SCADA integrity',
          subtitle: 'Schneider PAS800 SCADA & GAIL Gas Flow Meters',
          badge: 'PASSED',
          badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200/60',
          icon: Check,
          iconClass: 'text-emerald-600 bg-emerald-50',
        },
        {
          title: 'Version provenance',
          subtitle: 'Google CEL DAG Rule Engine (STEEL-PCF-2026-v1.0)',
          badge: 'AVAILABLE',
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
        { name: 'Natural gas · Reheating Furnace F-01', qty: '2,000 m³', factor: '2.100 kgCO₂e/m³', emissions: '4,200 kgCO₂e' },
        { name: 'EAF Substation power · PAS800 SCADA', qty: '5,000 kWh', factor: '0.716 kgCO₂e/kWh', emissions: '3,580 kgCO₂e' },
        { name: 'Direct Reduced Iron (DRI) precursor', qty: '11,000 kg', factor: '0.777 kgCO₂e/kg', emissions: '8,550 kgCO₂e' },
        { name: 'Inbound Electric Rail freight (Odisha -> Hyd)', qty: '10,200 tkm', factor: '0.028 kgCO₂e/tkm', emissions: '285.6 kgCO₂e' },
        { name: 'Outbound Sea freight (Nhava Sheva -> Antwerp)', qty: '125,000 tkm', factor: '0.012 kgCO₂e/tkm', emissions: '1,500 kgCO₂e' },
      ]
    : [
        { name: 'Natural gas · Boiler 2', qty: '182,400 Nm³', factor: '2.021 kgCO₂e/Nm³', emissions: '368.7 tCO₂e' },
        { name: 'Grid electricity · Tema', qty: '2,410 MWh', factor: '0.385 kgCO₂e/kWh', emissions: '927.9 tCO₂e' },
        { name: 'Purchased cocoa beans', qty: '8,460 t', factor: '0.412 tCO₂e/t', emissions: '3,485.5 tCO₂e' },
        { name: 'Outbound freight', qty: '3.8m tkm', factor: '0.071 kgCO₂e/tkm', emissions: '269.8 tCO₂e' },
      ];

  return (
    <div className="space-y-6">
      {/* Top Header Row with Breadcrumb & Filters */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
          <span className="hover:text-slate-800">Carbon Accounting</span>
          <span>/</span>
          <span className="text-slate-900 font-bold">CCF & GHG Inventory</span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="bg-white border border-slate-200 rounded-lg px-3 py-1 text-xs font-medium text-slate-700 shadow-xs flex items-center gap-1.5">
            <span>{scenario === 'steel' ? 'Hyderabad Steel Facility' : 'Tema Processing Plant'}</span>
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
          <span className="bg-sky-100 text-sky-800 text-[10px] font-mono font-bold px-2.5 py-1 rounded-md tracking-wider">
            SIMULATED
          </span>
        </div>
      </div>

      {/* Main Title Banner & Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">CCF & GHG Inventory</h1>
          <p className="text-xs text-slate-500 font-medium">Scope 1, Scope 2 and Scope 3 accounting with full provenance</p>
        </div>

        <div className="flex items-center gap-3">
          <button className="px-4 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center gap-2">
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Download</span>
          </button>
          <button className="px-4 py-2 bg-[#00E599] hover:bg-[#00c985] text-slate-950 text-xs font-bold rounded-xl shadow-xs transition-colors">
            Primary action
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

      {/* Middle Row (2/3 Contribution Chart + 1/3 Calculation Status) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2/3: Monthly emissions by scope */}
        <div className="lg:col-span-2 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <h3 className="font-bold text-slate-900 text-sm mb-4">Monthly emissions by scope</h3>

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
                <span className="text-slate-600 font-medium text-[11px]">Verified / primary data</span>
              </div>
            </div>
            <span className="text-[11px] text-slate-400 font-medium">Units and boundary shown in every chart</span>
          </div>
        </div>

        {/* Right 1/3: Calculation status */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between space-y-4">
          <h3 className="font-bold text-slate-900 text-sm">Calculation status</h3>

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
              <div className="w-36 text-slate-500 font-medium">
                <span>{r.qty}</span>
              </div>
              <div className="w-44">
                <span className="bg-emerald-50 text-emerald-700 border border-emerald-100 font-semibold px-3 py-1 rounded-full text-[11px] inline-block">
                  {r.factor}
                </span>
              </div>
              <div className="text-right font-bold text-slate-900 w-32">
                <span>{r.emissions}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
