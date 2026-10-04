import React, { useState } from 'react';
import { 
  Building2, 
  Factory, 
  Workflow, 
  Cpu, 
  Gauge, 
  CheckCircle2, 
  ChevronDown, 
  ChevronRight, 
  Search, 
  Zap, 
  Layers, 
  Activity, 
  Radio, 
  Server,
  Share2,
  Maximize2
} from 'lucide-react';
import { useScenario } from '../../../context/ScenarioContext';

export interface AssetNode {
  id: string;
  name: string;
  type: 'entity' | 'facility' | 'process' | 'line' | 'meter';
  status: 'ONLINE' | 'ACTIVE' | 'CALIBRATED' | 'STANDBY';
  telemetryType?: string;
  protocol?: string;
  samplingInterval?: string;
  qualityScore?: number;
  children?: AssetNode[];
}

export const STEEL_ASSET_TREE: AssetNode = {
  id: 'ORG-ST-2026-001',
  name: 'Saurient Demo Steel Industries Ltd',
  type: 'entity',
  status: 'ONLINE',
  children: [
    {
      id: 'FAC-ST-001',
      name: 'Hyderabad Manufacturing Facility (Telangana Industrial Corridor)',
      type: 'facility',
      status: 'ONLINE',
      qualityScore: 98,
      children: [
        {
          id: 'PRC-ST-01',
          name: 'Electric Arc Furnace (EAF) & Melting Shop',
          type: 'process',
          status: 'ACTIVE',
          children: [
            {
              id: 'LINE-EAF-01',
              name: 'EAF Melt Shop Line 1',
              type: 'line',
              status: 'ACTIVE',
              children: [
                {
                  id: 'MTR-STTR-EL01',
                  name: 'Sattric Smart Meter SCADA Power Gateway',
                  type: 'meter',
                  status: 'ONLINE',
                  telemetryType: 'kWh Power & Demand Telemetry',
                  protocol: 'Modbus TCP/IP via Sattric Gateway',
                  samplingInterval: '1-Minute Instantaneous',
                  qualityScore: 99,
                },
                {
                  id: 'MTR-SUB-01',
                  name: '132kV Primary Substation Transformer Meter T-01',
                  type: 'meter',
                  status: 'ONLINE',
                  telemetryType: 'High-Voltage Grid Import',
                  protocol: 'DNP3 / IEC 61850',
                  samplingInterval: '15-Minute Settled',
                  qualityScore: 98,
                },
              ],
            },
          ],
        },
        {
          id: 'PRC-ST-02',
          name: 'Reheating Furnace & Hot Rolling Mill',
          type: 'process',
          status: 'ACTIVE',
          children: [
            {
              id: 'LINE-MILL-01',
              name: 'Hot Strip Mill Line A (7208 39 00 Production)',
              type: 'line',
              status: 'ACTIVE',
              children: [
                {
                  id: 'MTR-GAS-02',
                  name: 'GAIL Natural Gas Flow Meter F-01',
                  type: 'meter',
                  status: 'ONLINE',
                  telemetryType: 'Volumetric Gas Flow (m³)',
                  protocol: 'HART / 4-20mA Analog',
                  samplingInterval: '5-Minute Totalized',
                  qualityScore: 96,
                },
                {
                  id: 'MTR-THERM-04',
                  name: 'Reheating Furnace Multi-Zone Temperature Logger TS-04',
                  type: 'meter',
                  status: 'CALIBRATED',
                  telemetryType: 'Thermal Energy Input (°C / GJ)',
                  protocol: 'RS485 Modbus RTU',
                  samplingInterval: 'Real-time Continuous',
                  qualityScore: 95,
                },
              ],
            },
          ],
        },
        {
          id: 'PRC-ST-03',
          name: 'Direct Reduced Iron (DRI) Precursor Processing (Odisha Plant)',
          type: 'process',
          status: 'ACTIVE',
          children: [
            {
              id: 'LINE-DRI-01',
              name: 'Saurient Odisha Kiln Line 1',
              type: 'line',
              status: 'ACTIVE',
              children: [
                {
                  id: 'MTR-DRI-MASS-01',
                  name: 'DRI Precursor Batch Mass Counter',
                  type: 'meter',
                  status: 'ONLINE',
                  telemetryType: 'Mass Flow (Tonne/hr)',
                  protocol: 'Profibus DP',
                  samplingInterval: 'Shift Totalized',
                  qualityScore: 97,
                },
              ],
            },
          ],
        },
        {
          id: 'PRC-ST-04',
          name: 'Coil Finishing, Strapping & Outbound Port Freight',
          type: 'process',
          status: 'ACTIVE',
          children: [
            {
              id: 'LINE-STRAP-01',
              name: 'Automatic Steel Strapping & Bundle Marking',
              type: 'line',
              status: 'ACTIVE',
              children: [
                {
                  id: 'MTR-SCALE-01',
                  name: 'Certified Finished Goods Scale & QR Scanner S-01',
                  type: 'meter',
                  status: 'ONLINE',
                  telemetryType: 'Verified Net Mass (kg)',
                  protocol: 'TCP/IP Socket + Barcode API',
                  samplingInterval: 'Per Batch Event',
                  qualityScore: 100,
                },
              ],
            },
          ],
        },
      ],
    },
  ],
};

export const COCOA_ASSET_TREE: AssetNode = {
  id: 'ORG-CP-2026-009841',
  name: 'Asante Cocoa Processing Cooperative',
  type: 'entity',
  status: 'ONLINE',
  children: [
    {
      id: 'FAC-GH-001',
      name: 'Tema Processing Plant (Heavy Industrial Area, Ghana)',
      type: 'facility',
      status: 'ONLINE',
      qualityScore: 96,
      children: [
        {
          id: 'PRC-001',
          name: 'Bean Roasting & Grinding Unit',
          type: 'process',
          status: 'ACTIVE',
          children: [
            {
              id: 'LINE-01',
              name: 'Roasting Line A',
              type: 'line',
              status: 'ACTIVE',
              children: [
                {
                  id: 'M-101',
                  name: 'Gas Meter M-101 (Natural Gas Flow)',
                  type: 'meter',
                  status: 'ONLINE',
                  telemetryType: 'Volumetric Gas (m³)',
                  protocol: 'Pulse Output / Modbus',
                  samplingInterval: '15-Minute',
                  qualityScore: 97,
                },
                {
                  id: 'E-201',
                  name: 'Power Meter E-201 (kWh Telemetry)',
                  type: 'meter',
                  status: 'ONLINE',
                  telemetryType: 'Electricity kWh',
                  protocol: 'Modbus RTU',
                  samplingInterval: '5-Minute',
                  qualityScore: 98,
                },
              ],
            },
          ],
        },
      ],
    },
  ],
};

export const OrgAssetTreeTab: React.FC = () => {
  const { scenario } = useScenario();
  const [selectedTree, setSelectedTree] = useState<'steel' | 'cocoa'>('steel');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedNodes, setExpandedNodes] = useState<Record<string, boolean>>({
    'ORG-ST-2026-001': true,
    'FAC-ST-001': true,
    'PRC-ST-01': true,
    'PRC-ST-02': true,
    'ORG-CP-2026-009841': true,
    'FAC-GH-001': true,
    'PRC-001': true,
  });

  const rootData = selectedTree === 'steel' ? STEEL_ASSET_TREE : COCOA_ASSET_TREE;

  const toggleNode = (id: string) => {
    setExpandedNodes((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const expandAll = () => {
    setExpandedNodes({
      'ORG-ST-2026-001': true, 'FAC-ST-001': true, 'PRC-ST-01': true, 'LINE-EAF-01': true,
      'PRC-ST-02': true, 'LINE-MILL-01': true, 'PRC-ST-03': true, 'LINE-DRI-01': true,
      'PRC-ST-04': true, 'LINE-STRAP-01': true,
      'ORG-CP-2026-009841': true, 'FAC-GH-001': true, 'PRC-001': true, 'LINE-01': true,
    });
  };

  const collapseAll = () => {
    setExpandedNodes({});
  };

  const getNodeIcon = (type: AssetNode['type']) => {
    switch (type) {
      case 'entity': return <Building2 className="w-4 h-4 text-emerald-600" />;
      case 'facility': return <Factory className="w-4 h-4 text-sky-600" />;
      case 'process': return <Workflow className="w-4 h-4 text-amber-600" />;
      case 'line': return <Layers className="w-4 h-4 text-indigo-600" />;
      case 'meter': return <Radio className="w-4 h-4 text-emerald-500" />;
      default: return <Server className="w-4 h-4 text-slate-500" />;
    }
  };

  const getNodeBadge = (type: AssetNode['type']) => {
    switch (type) {
      case 'entity': return <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded">ENTITY</span>;
      case 'facility': return <span className="bg-sky-100 text-sky-800 text-[10px] font-bold px-2 py-0.5 rounded">OPERATING SITE</span>;
      case 'process': return <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-0.5 rounded">PROCESS STEP</span>;
      case 'line': return <span className="bg-indigo-100 text-indigo-800 text-[10px] font-bold px-2 py-0.5 rounded">PRODUCTION LINE</span>;
      case 'meter': return <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-mono font-bold px-2 py-0.5 rounded">TELEMETRY METER</span>;
    }
  };

  const renderNode = (node: AssetNode, level: number = 0) => {
    const isExpanded = expandedNodes[node.id] !== false;
    const hasChildren = node.children && node.children.length > 0;
    const matchesSearch = searchQuery === '' || 
      node.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      node.id.toLowerCase().includes(searchQuery.toLowerCase());

    return (
      <div key={node.id} className="space-y-2">
        <div 
          onClick={() => hasChildren && toggleNode(node.id)}
          className={`flex flex-col md:flex-row md:items-center justify-between gap-3 p-3.5 rounded-2xl border transition-all ${
            node.type === 'entity'
              ? 'bg-slate-900 text-white border-slate-800 shadow-md'
              : node.type === 'facility'
              ? 'bg-sky-950/20 border-sky-200 hover:border-sky-400'
              : node.type === 'process'
              ? 'bg-amber-50/40 border-amber-200 hover:border-amber-400'
              : node.type === 'line'
              ? 'bg-indigo-50/30 border-indigo-200'
              : 'bg-white border-emerald-200 hover:border-emerald-400 shadow-2xs'
          } ${hasChildren ? 'cursor-pointer' : ''}`}
          style={{ marginLeft: `${level * 16}px` }}
        >
          <div className="flex items-center gap-3 min-w-0">
            {hasChildren ? (
              <button className="p-1 rounded-md text-slate-400 hover:text-slate-700">
                {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
              </button>
            ) : (
              <span className="w-6 h-6 flex items-center justify-center text-emerald-500 font-bold">•</span>
            )}

            <div className="p-2 rounded-xl bg-white/80 border border-slate-200 shadow-2xs shrink-0">
              {getNodeIcon(node.type)}
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className={`font-mono text-[10px] font-bold ${node.type === 'entity' ? 'text-slate-400' : 'text-slate-500'}`}>
                  {node.id}
                </span>
                {getNodeBadge(node.type)}
                {node.qualityScore && (
                  <span className="bg-emerald-500/20 text-emerald-700 font-mono text-[10px] font-bold px-2 py-0.5 rounded border border-emerald-400/30">
                    Quality: {node.qualityScore}%
                  </span>
                )}
              </div>
              <h4 className={`font-bold text-sm tracking-tight truncate mt-0.5 ${node.type === 'entity' ? 'text-white' : 'text-slate-900'}`}>
                {node.name}
              </h4>
            </div>
          </div>

          {/* Metadata Specs for Meters */}
          {node.type === 'meter' && (
            <div className="flex items-center gap-3 text-xs font-mono shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-slate-100">
              <div className="text-right">
                <span className="text-[10px] text-slate-400 block">TELEMETRY TYPE</span>
                <span className="font-bold text-slate-800">{node.telemetryType}</span>
              </div>
              <div className="text-right hidden xl:block">
                <span className="text-[10px] text-slate-400 block">PROTOCOL</span>
                <span className="font-medium text-emerald-700">{node.protocol}</span>
              </div>
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" title="Gateway Signal Active"></span>
            </div>
          )}
        </div>

        {/* Child Tree Recursive Render */}
        {hasChildren && isExpanded && (
          <div className="space-y-2">
            {node.children!.map((child) => renderNode(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Top Banner Control Bar */}
      <div className="p-6 bg-slate-900 text-white rounded-2xl border border-slate-800 shadow-md space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#00E599] text-slate-950 font-black text-xl flex items-center justify-center">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider">OPERATIONAL BOUNDARY</span>
                <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 text-[10px] font-bold px-2 py-0.5 rounded">
                  PAS800 SCADA CONNECTED
                </span>
              </div>
              <h2 className="text-xl font-bold tracking-tight text-white mt-0.5">
                Organisation Operational Asset Tree
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                4-tier traceable hierarchy: Legal Entity → Operating Facility → Production Line → PAS800 SCADA Telemetry Meter
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <select
              value={selectedTree}
              onChange={(e) => setSelectedTree(e.target.value as 'steel' | 'cocoa')}
              className="bg-slate-800 text-white text-xs font-semibold px-3.5 py-2 rounded-xl border border-slate-700 focus:outline-none focus:border-[#00E599]"
            >
              <option value="steel">Saurient Steel (Hyderabad Facility)</option>
              <option value="cocoa">Asante Cocoa (Tema Facility)</option>
            </select>

            <button
              onClick={expandAll}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-xl border border-slate-700 transition-colors"
            >
              Expand All
            </button>
            <button
              onClick={collapseAll}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-xl border border-slate-700 transition-colors"
            >
              Collapse
            </button>
          </div>
        </div>

        {/* Search & Statistics Strip */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
          <div className="relative w-full sm:w-80">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search meters, gateways, or lines..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 text-white placeholder-slate-400 rounded-xl pl-8 pr-3 py-1.5 focus:outline-none focus:border-[#00E599]"
            />
          </div>

          <div className="flex items-center gap-4 text-slate-300 font-mono text-[11px]">
            <span>1 Entity</span>
            <span>•</span>
            <span>1 Facility</span>
            <span>•</span>
            <span>4 Lines</span>
            <span>•</span>
            <span className="text-[#00E599] font-bold">5 SCADA Meters Online</span>
          </div>
        </div>
      </div>

      {/* Main Interactive Asset Tree Box */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-3">
        <div className="flex items-center justify-between text-xs font-bold text-slate-500 border-b border-slate-100 pb-3">
          <span>Hierarchy Tree Structure</span>
          <span>Telemetry Quality & Protocol</span>
        </div>

        {renderNode(rootData, 0)}
      </div>
    </div>
  );
};
