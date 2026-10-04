import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Flame, Zap, Truck, Leaf, CheckCircle2, Database, Code, Play, RefreshCw, Cpu, Layers } from 'lucide-react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { useScenario } from '../../context/ScenarioContext';

export const EmissionsCalculation: React.FC = () => {
  const { scenario } = useScenario();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const requestedTab = searchParams.get('tab');

  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    if (requestedTab === 'factors') {
      setActiveTab('factors');
    } else if (requestedTab === 'rules') {
      setActiveTab('rules');
    } else if (requestedTab === 'overview') {
      setActiveTab('overview');
    } else {
      setActiveTab('overview');
    }
  }, [requestedTab]);

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    navigate(`/emissions?tab=${tab}`, { replace: true });
  };

  const isSteel = scenario === 'steel';

  const scopeData = isSteel
    ? [
        { title: 'Scope 1 (Direct)', subtitle: 'Reheating furnace gas combustion', val: '4,200', unit: 'kgCO₂e (0.420/kg)', icon: Flame, color: 'text-rose-600 bg-rose-50 border-rose-100' },
        { title: 'Scope 2 (Indirect Energy)', subtitle: 'Schneider PAS800 SCADA EAF power', val: '3,580', unit: 'kgCO₂e (0.358/kg)', icon: Zap, color: 'text-sky-600 bg-sky-50 border-sky-100' },
        { title: 'Scope 3 (Precursors & Freight)', subtitle: 'Odisha DRI precursor + transport', val: '8,550', unit: 'kgCO₂e (0.855/kg)', icon: Truck, color: 'text-emerald-600 bg-emerald-50 border-emerald-100' },
      ]
    : [
        { title: 'Scope 1', subtitle: 'Direct emissions (on-site fuel use)', val: '120', unit: 'kgCO2e per batch', icon: Flame, color: 'text-rose-600 bg-rose-50 border-rose-100' },
        { title: 'Scope 2', subtitle: 'Purchased electricity', val: '85', unit: 'kgCO2e per batch', icon: Zap, color: 'text-sky-600 bg-sky-50 border-sky-100' },
        { title: 'Scope 3', subtitle: 'Upstream and downstream (supply chain)', val: '395', unit: 'kgCO2e per batch', icon: Truck, color: 'text-emerald-600 bg-emerald-50 border-emerald-100' },
      ];

  const pieData = isSteel
    ? [
        { name: 'Direct Reduced Iron (DRI)', value: 8550, percentage: 52.4, color: '#10b981' },
        { name: 'Furnace Natural Gas', value: 4200, percentage: 25.7, color: '#06b6d4' },
        { name: 'PAS800 Grid Electricity', value: 3580, percentage: 21.9, color: '#f59e0b' },
      ]
    : [
        { name: 'Electricity', value: 170, percentage: 28, color: '#16a34a' },
        { name: 'Fuel (on-site)', value: 70, percentage: 12, color: '#0284c7' },
        { name: 'Logistics', value: 120, percentage: 20, color: '#f97316' },
        { name: 'Materials', value: 210, percentage: 35, color: '#a855f7' },
        { name: 'Packaging', value: 30, percentage: 5, color: '#64748b' },
      ];

  const steelFactors = [
    { code: 'EF-IND-EL-2026', name: 'Central India Electricity Grid 2026', val: '0.716', unit: 'kgCO₂e/kWh', source: 'CEA India / WorldSteel 2026', geo: 'IN-TG (Telangana)', status: 'APPROVED' },
    { code: 'EF-GAIL-NG-02', name: 'Natural Gas High-Heating Combust', val: '2.100', unit: 'kgCO₂e/m³', source: 'IPCC AR6 / GAIL India', geo: 'National (IN)', status: 'APPROVED' },
    { code: 'EF-DRI-OD-01', name: 'Saurient Odisha DRI Precursor Intensity', val: '0.777', unit: 'kgCO₂e/kg', source: 'Primary Verifier Report VR-DRI-01', geo: 'IN-OR (Odisha)', status: 'VERIFIED' },
    { code: 'EF-RAIL-IN-01', name: 'Freight Electric Rail (Odisha -> Hyd)', val: '0.028', unit: 'kgCO₂e/t·km', source: 'GLEC Framework v3.0', geo: 'India Rail Network', status: 'APPROVED' },
  ];

  const celRules = [
    { id: 'CEL-ST-001', name: 'Direct Combustion Rule', code: 'activity.quantity * activity.efValue', target: 'Scope 1 Furnace Fuel', status: 'VALIDATED' },
    { id: 'CEL-ST-002', name: 'Indirect Grid Telemetry Rule', code: 'pas800.kwh * ef.grid_india_2026', target: 'Scope 2 EAF Mill', status: 'VALIDATED' },
    { id: 'CEL-ST-003', name: 'Precursor Attributed Mass Balance', code: 'dri.mass_kg * dri.verified_intensity', target: 'Scope 3 Precursors', status: 'VALIDATED' },
    { id: 'CEL-ST-004', name: 'ISO 14067 Cradle-to-Gate Aggregator', code: 'sum(scope1, scope2, scope3) / batch.quantity_kg', target: 'Product Carbon Footprint (1.633)', status: 'EXECUTION READY' },
  ];

  return (
    <div className="space-y-6 font-sans">
      {/* Top Title Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            {isSteel ? 'Saurient Steel — Carbon Rule Engine & Emission Factors' : 'Emission Calculation Dashboard'}
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            {isSteel
              ? 'Google CEL DAG calculation rulebook (STEEL-PCF-2026-v1.0) and versioned emission factor registry'
              : 'Turning activity data into a product carbon footprint'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => handleTabChange('factors')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
              activeTab === 'factors' ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
            }`}
          >
            Emission Factors
          </button>
          <button
            onClick={() => handleTabChange('rules')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
              activeTab === 'rules' ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
            }`}
          >
            CEL Rule Engine
          </button>
          <button
            onClick={() => handleTabChange('overview')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
              activeTab === 'overview' ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
            }`}
          >
            Footprint Overview
          </button>
        </div>
      </div>

      {/* Product Banner */}
      <div className="bg-slate-900 text-white p-5 rounded-2xl border border-slate-800 flex flex-wrap items-center justify-between gap-4 shadow-md">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-[#00E599] text-slate-950 font-black text-xl flex items-center justify-center">
            {isSteel ? 'ST' : 'CB'}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">CALCULATION ENGINE RUNTIME</span>
              <span className="text-[10px] font-bold text-[#00E599] bg-emerald-950/80 border border-emerald-500/40 px-2.5 py-0.5 rounded-full">
                STEEL-PCF-2026-v1.0 (GOOGLE CEL DAG)
              </span>
            </div>
            <h2 className="text-xl font-bold text-white mt-0.5">
              {isSteel ? 'Hot-Rolled Steel Coil (Batch ST-2026-00981)' : 'Refined Cocoa Butter Batch'}
            </h2>
            <p className="text-xs text-slate-400 mt-0.5 font-mono">
              {isSteel
                ? 'Batch Size: 10,000 kg · Facility: Hyderabad Manufacturing Plant · HS Code: 7208 39 00'
                : 'Batch Size: 1,000 kg · Facility: Tema Processing Plant, Ghana'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right">
            <span className="text-[10px] text-slate-400 font-bold block uppercase">VERIFIED INTENSITY</span>
            <span className="text-2xl font-black text-[#00E599]">
              {isSteel ? '1.633 kgCO₂e/kg' : '0.60 kgCO₂e/kg'}
            </span>
          </div>
        </div>
      </div>

      {/* Tab View: Emission Factors Registry */}
      {activeTab === 'factors' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-3">
              <Database className="w-5 h-5 text-emerald-600" />
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Governed Emission Factor Registry</h3>
                <p className="text-xs text-slate-500">Version-controlled factors mapped by geography, sector, and AR6 GWP set</p>
              </div>
            </div>
            <span className="bg-emerald-50 text-emerald-800 text-[10px] font-mono font-bold px-3 py-1 rounded-md border border-emerald-200">
              IPCC AR6 GWP100 APPROVED
            </span>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden text-xs">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-[10px] font-mono uppercase text-slate-400">
                  <th className="py-3 px-4">Factor Code & Name</th>
                  <th className="py-3 px-4">Value</th>
                  <th className="py-3 px-4">Unit</th>
                  <th className="py-3 px-4">Source Database</th>
                  <th className="py-3 px-4">Geography</th>
                  <th className="py-3 px-4 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono">
                {steelFactors.map((f, i) => (
                  <tr key={i} className="hover:bg-slate-50">
                    <td className="py-3 px-4">
                      <span className="font-bold text-slate-900 block font-sans">{f.name}</span>
                      <span className="text-[10px] text-slate-400">{f.code}</span>
                    </td>
                    <td className="py-3 px-4 font-bold text-emerald-700 text-sm">{f.val}</td>
                    <td className="py-3 px-4 text-slate-600">{f.unit}</td>
                    <td className="py-3 px-4 text-slate-600 font-sans font-medium">{f.source}</td>
                    <td className="py-3 px-4 text-slate-600">{f.geo}</td>
                    <td className="py-3 px-4 text-right">
                      <span className="bg-emerald-50 text-emerald-800 text-[10px] font-bold px-2.5 py-0.5 rounded border border-emerald-200">
                        {f.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab View: CEL Rule Engine */}
      {activeTab === 'rules' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-3">
              <Code className="w-5 h-5 text-indigo-600" />
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Google Common Expression Language (CEL) DAG Rule Engine</h3>
                <p className="text-xs text-slate-500">Configurable rule DAGs executed per commodity ruleset</p>
              </div>
            </div>
            <span className="bg-indigo-50 text-indigo-800 text-[10px] font-mono font-bold px-3 py-1 rounded-md border border-indigo-200">
              CEL ENGINE 4.2 RUNNING
            </span>
          </div>

          <div className="space-y-3 font-mono text-xs">
            {celRules.map((r, i) => (
              <div key={i} className="p-4 bg-slate-900 text-white rounded-xl border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-[#00E599] font-bold text-xs">{r.id}</span>
                    <span className="font-bold font-sans text-sm text-white">{r.name}</span>
                  </div>
                  <span className="bg-emerald-500/20 text-[#00E599] text-[10px] font-bold px-2.5 py-0.5 rounded border border-emerald-500/40">
                    {r.status}
                  </span>
                </div>
                <div className="p-2.5 bg-slate-950 rounded-lg text-emerald-400 font-bold border border-slate-800 text-[11px]">
                  <code>{r.code}</code>
                </div>
                <div className="text-[10px] text-slate-400 font-sans">
                  Target Scope: <strong className="text-slate-200">{r.target}</strong>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Overview Cards & Breakdown */}
      {activeTab === 'overview' && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {scopeData.map((scope, idx) => {
              const Icon = scope.icon;
              return (
                <div key={idx} className={`p-5 rounded-2xl border ${scope.color} shadow-sm bg-white space-y-2`}>
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-slate-900">{scope.title}</span>
                    <Icon className="w-5 h-5" />
                  </div>
                  <p className="text-[11px] text-slate-500">{scope.subtitle}</p>
                  <div className="flex items-baseline gap-1 pt-1">
                    <span className="text-2xl font-black text-slate-900">{scope.val}</span>
                    <span className="text-[10px] text-slate-500 font-medium">{scope.unit}</span>
                  </div>
                </div>
              );
            })}

            <div className="p-5 rounded-2xl border border-emerald-300 bg-gradient-to-br from-emerald-900 to-slate-900 text-white shadow-sm flex flex-col justify-between">
              <div className="flex items-center gap-2 text-[#00E599]">
                <Leaf className="w-5 h-5" />
                <h3 className="font-bold text-xs">Total Batch Footprint</h3>
              </div>
              <div>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-black text-[#00E599]">
                    {isSteel ? '16,330' : '600'}
                  </span>
                  <span className="text-xs font-medium text-slate-300">kgCO₂e</span>
                </div>
                <p className="text-xs font-bold text-emerald-400 mt-1">
                  {isSteel ? '1.633 kgCO₂e per kg' : '0.60 kgCO₂e per batch'}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="font-bold text-slate-900 text-sm">Emissions Breakdown by Source</h3>
            <div className="flex items-center justify-between h-56">
              <div className="w-1/2 h-full relative flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={pieData} innerRadius={55} outerRadius={80} dataKey="value" paddingAngle={3}>
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="w-1/2 space-y-2 text-xs">
                {pieData.map((p, i) => (
                  <div key={i} className="flex items-center justify-between p-2 bg-slate-50 rounded-xl border border-slate-200/60">
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full" style={{ backgroundColor: p.color }}></span>
                      <span className="font-bold text-slate-800">{p.name}</span>
                    </div>
                    <span className="font-mono font-bold text-slate-900">{p.percentage}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
