import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { 
  Building, 
  MapPin, 
  ShieldCheck, 
  TrendingDown, 
  FileCheck2, 
  Lock, 
  Eye, 
  ChevronRight,
  ArrowRight,
  Sparkles,
  BarChart3,
  CheckCircle2,
  Globe2
} from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell } from 'recharts';

export const GovernmentView: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const requestedTab = searchParams.get('tab') as 'overview' | 'drilldown' | 'ndc' | 'policy' | null;

  const [activeTab, setActiveTab] = useState<'overview' | 'drilldown' | 'ndc' | 'policy'>(
    requestedTab && ['overview', 'drilldown', 'ndc', 'policy'].includes(requestedTab) ? requestedTab : 'overview'
  );

  useEffect(() => {
    if (requestedTab && ['overview', 'drilldown', 'ndc', 'policy'].includes(requestedTab)) {
      setActiveTab(requestedTab);
    }
  }, [requestedTab]);

  const handleTabSwitch = (tab: 'overview' | 'drilldown' | 'ndc' | 'policy') => {
    setActiveTab(tab);
    navigate(`/government?tab=${tab}`);
  };
  const [privacyMode, setPrivacyMode] = useState<boolean>(true);
  const [selectedRegion, setSelectedRegion] = useState<'all' | 'telangana' | 'odisha'>('telangana');

  const sectorData = [
    { sector: 'Iron & Steel', count: 12, avgIntensity: '1.63 tCO₂e/t', cbamReady: '92%' },
    { sector: 'Aluminium', count: 6, avgIntensity: '2.10 tCO₂e/t', cbamReady: '84%' },
    { sector: 'Cement', count: 7, avgIntensity: '0.62 tCO₂e/t', cbamReady: '88%' },
    { sector: 'Chemicals', count: 3, avgIntensity: '1.85 tCO₂e/t', cbamReady: '75%' },
  ];

  const chartData = [
    { name: 'Hyderabad Steel', val: 1.63, benchmark: 2.15, fill: '#00E599' },
    { name: 'Odisha Mill', val: 1.81, benchmark: 2.15, fill: '#0EA5E9' },
    { name: 'Telangana Rebar', val: 1.45, benchmark: 2.15, fill: '#10B981' },
    { name: 'Gujarat Sponge', val: 2.05, benchmark: 2.15, fill: '#F59E0B' },
  ];

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900 text-white p-6 rounded-2xl shadow-lg border border-slate-800">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="bg-emerald-500/20 text-emerald-400 text-[10px] font-bold px-2.5 py-0.5 rounded-full border border-emerald-500/30 uppercase tracking-widest flex items-center gap-1">
              <Sparkles className="w-3 h-3" />
              GOVERNMENT & POLICY PORTAL
            </span>
            <span className="bg-slate-800 text-slate-300 text-[10px] font-mono px-2 py-0.5 rounded">
              MINISTRY OF STEEL & ENVIRONMENT
            </span>
          </div>
          <h1 className="text-2xl font-black tracking-tight">National Carbon Intelligence & CBAM Governance</h1>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl">
            Real-time aggregate sector intelligence, CBAM export exposure monitoring, and NDC climate target mapping across registered industrial facilities.
          </p>
        </div>

        {/* Top Right Privacy Toggle */}
        <div className="flex items-center gap-3 bg-slate-950 p-2.5 rounded-xl border border-slate-800">
          <div className="text-right">
            <p className="text-[11px] font-bold text-slate-200">Commercial Confidentiality</p>
            <p className="text-[9px] text-slate-400">{privacyMode ? 'Anonymized Aggregates' : 'Full Audit View'}</p>
          </div>
          <button
            onClick={() => setPrivacyMode(!privacyMode)}
            className={`p-2 rounded-lg transition-all ${
              privacyMode ? 'bg-emerald-500 text-slate-950 font-bold' : 'bg-amber-500 text-slate-950 font-bold'
            }`}
            title="Toggle Commercial Privacy Shield"
          >
            {privacyMode ? <Lock className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Top 4 KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
          <span className="text-xs font-semibold text-slate-400 block">Registered Facilities</span>
          <div className="flex items-baseline justify-between">
            <span className="text-3xl font-black text-slate-900">28</span>
            <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded">
              +4 THIS MONTH
            </span>
          </div>
          <span className="text-[11px] text-slate-500 block">Across 4 Industrial Corridors</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
          <span className="text-xs font-semibold text-slate-400 block">Issued Carbon Passports</span>
          <div className="flex items-baseline justify-between">
            <span className="text-3xl font-black text-slate-900">142</span>
            <span className="text-[10px] font-bold bg-sky-100 text-sky-800 px-2 py-0.5 rounded">
              VERIFIED
            </span>
          </div>
          <span className="text-[11px] text-slate-500 block">Cryptographically Signed</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
          <span className="text-xs font-semibold text-slate-400 block">EU CBAM Export Readiness</span>
          <div className="flex items-baseline justify-between">
            <span className="text-3xl font-black text-emerald-600">89%</span>
            <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded">
              HIGH
            </span>
          </div>
          <span className="text-[11px] text-slate-500 block">Primary Verified Emissions</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
          <span className="text-xs font-semibold text-slate-400 block">Avoided CBAM Penalty</span>
          <div className="flex items-baseline justify-between">
            <span className="text-3xl font-black text-slate-900">€4.28M</span>
            <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded">
              SAVINGS
            </span>
          </div>
          <span className="text-[11px] text-slate-500 block">Vs Default Fallback Rates</span>
        </div>
      </div>

      {/* Sub Navigation Bar */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-px">
        {[
          { id: 'overview', label: 'Sector Overview' },
          { id: 'drilldown', label: 'Geographic Drilldown' },
          { id: 'ndc', label: 'NDC & Paris Alignment' },
          { id: 'policy', label: 'Decarbonization Policy Cards' },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => handleTabSwitch(t.id as any)}
            className={`px-4 py-2 text-xs font-bold whitespace-nowrap border-b-2 transition-colors ${
              activeTab === t.id
                ? 'border-emerald-600 text-emerald-700 bg-emerald-50/50 rounded-t-xl'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Main Tab Content */}
      {activeTab === 'overview' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left 2/3: Sector Intensity Chart */}
            <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Steel Sector Verified Intensity vs Global Baseline</h3>
                  <p className="text-xs text-slate-500">Comparing verified batch intensities across regional manufacturing clusters</p>
                </div>
                <span className="bg-emerald-50 text-emerald-700 text-xs font-bold px-3 py-1 rounded-lg border border-emerald-200">
                  Avg: 1.633 tCO₂e/t
                </span>
              </div>

              <div className="h-64 w-full pt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} barCategoryGap="30%">
                    <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: '#64748b' }} unit=" t" />
                    <Tooltip formatter={(val: any) => [`${val} tCO₂e/t`, 'Carbon Intensity']} />
                    <Bar dataKey="val" radius={[6, 6, 0, 0]}>
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Right 1/3: Sector Breakdown Cards */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <h3 className="text-sm font-bold text-slate-900">Registered Sector Summary</h3>
              <div className="space-y-3">
                {sectorData.map((sec, idx) => (
                  <div key={idx} className="p-3.5 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-xs text-slate-900">{sec.sector}</h4>
                      <p className="text-[10px] text-slate-400">{sec.count} Facilities • Avg {sec.avgIntensity}</p>
                    </div>
                    <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded">
                      {sec.cbamReady} Ready
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              onClick={() => handleTabSwitch('drilldown')}
              className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
            >
              <span>Drill Down by Region</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {activeTab === 'drilldown' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900">Regional & Industrial Corridor Drilldown</h3>
              <p className="text-xs text-slate-500">National Total → Steel Sector → Telangana State → Hyderabad Industrial Zone</p>
            </div>
            <div className="flex items-center gap-2">
              {(['all', 'telangana', 'odisha'] as const).map((r) => (
                <button
                  key={r}
                  onClick={() => setSelectedRegion(r)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase transition-all ${
                    selectedRegion === r
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">State / Zone</span>
              <span className="text-base font-bold text-slate-900">Telangana Industrial Belt</span>
              <span className="text-[11px] text-slate-500 block mt-1">14 Registered Facilities</span>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Primary Power Grid</span>
              <span className="text-base font-bold text-slate-900">Telangana Central Grid</span>
              <span className="text-[11px] text-slate-500 block mt-1">0.716 kgCO₂e/kWh Factor</span>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Telemetry Integration</span>
              <span className="text-base font-bold text-emerald-600">PAS800 SCADA Feeds</span>
              <span className="text-[11px] text-slate-500 block mt-1">94% Average Data Quality</span>
            </div>
          </div>

          <div className="flex justify-end pt-2 border-t border-slate-100">
            <button
              onClick={() => navigate('/paris-alignment')}
              className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
            >
              <span>Check Paris Alignment</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {activeTab === 'ndc' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900">2030 NDC Climate Target & Paris Agreement Mapping</h3>
              <p className="text-xs text-slate-500">Mapping industrial decarbonization against national emission reduction commitments</p>
            </div>
            <span className="bg-emerald-100 text-emerald-800 text-xs font-bold px-3 py-1 rounded-full">
              TARGET: -30% BY 2030
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
            <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200 space-y-2">
              <h4 className="font-bold text-emerald-900 text-sm">Industrial Energy Efficiency</h4>
              <p className="text-emerald-800">
                Furnace upgrades, waste heat recovery, and variable speed drives across 18 manufacturing facilities contribute 1.2M tCO₂e annual reduction.
              </p>
            </div>

            <div className="p-4 bg-sky-50 rounded-xl border border-sky-200 space-y-2">
              <h4 className="font-bold text-sky-900 text-sm">Renewable Power Transition</h4>
              <p className="text-sky-800">
                Rooftop solar PV installations and open access green power PPAs reduced Scope 2 emissions by 24% across registered sites.
              </p>
            </div>
          </div>

          <div className="flex justify-end pt-2 border-t border-slate-100">
            <button
              onClick={() => handleTabSwitch('policy')}
              className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
            >
              <span>View Reduction Insights</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {activeTab === 'policy' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
          <h3 className="text-base font-bold text-slate-900">Actionable Decarbonization Policy Cards</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
              <span className="bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded text-[10px]">
                HIGH IMPACT
              </span>
              <h4 className="font-bold text-slate-900 text-sm">DRI-EAF Conversion Incentive</h4>
              <p className="text-slate-600">
                Transitioning traditional blast furnaces to Direct Reduced Iron + Electric Arc Furnaces lowers intensity from 2.15 to 0.481 tCO₂e/t.
              </p>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
              <span className="bg-sky-100 text-sky-800 font-bold px-2 py-0.5 rounded text-[10px]">
                CBAM SAFEGUARD
              </span>
              <h4 className="font-bold text-slate-900 text-sm">Verifiable Primary Data Mandate</h4>
              <p className="text-slate-600">
                Requiring smart-meter telemetry for CBAM exports eliminates default penalty markups and protects EU export revenues.
              </p>
            </div>
          </div>

          <div className="flex justify-end pt-2 border-t border-slate-100">
            <button
              onClick={() => navigate('/admin?tab=architecture')}
              className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
            >
              <span>View System Architecture</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
