import React, { useState, useEffect } from 'react';
import { getOrgProcesses, saveOrgProcess, deleteOrgProcess } from '../../../api/client';
import {
  Workflow,
  Plus,
  Search,
  ChevronRight,
  Zap,
  Gauge,
  X,
  Layers,
  CheckCircle2,
  AlertCircle,
  FileCode,
  ArrowRight,
  Trash2
} from 'lucide-react';

export interface ProcessItem {
  id: string;
  name: string;
  facilityId: string;
  facilityName: string;
  inputs: string[];
  outputs: string[];
  productionLine: string;
  energySource: string;
  meters: string[];
  scopes: string[];
  status: 'Active' | 'Draft' | 'Under Review';
  description: string;
  pcfTrace: {
    product: string;
    batch: string;
    activityRate: string;
    emissionFactor: string;
    calculatedEmissions: string;
  };
}

export const initialProcesses: ProcessItem[] = [
  {
    id: 'PRC-GH-001',
    name: 'Raw Cocoa Bean Receiving & Cleaning',
    facilityId: 'FAC-GH-001',
    facilityName: 'Tema Processing Plant',
    inputs: ['Raw cocoa beans (in bags)', 'Grid electricity'],
    outputs: ['Cleaned cocoa beans', 'Foreign debris waste'],
    productionLine: 'Inbound Line 1',
    energySource: 'Grid electricity (VRA)',
    meters: ['E-101 Intake Telemetry'],
    scopes: ['Scope 2'],
    status: 'Active',
    description: 'Initial quality gate where raw beans are destoned, magnet-separated, and weighed.',
    pcfTrace: {
      product: 'Refined Cocoa Butter',
      batch: 'BATCH-2026-GH-881',
      activityRate: '1,200 kg / hour',
      emissionFactor: '0.245 kg CO₂e / kWh',
      calculatedEmissions: '294 kg CO₂e / batch',
    },
  },
  {
    id: 'PRC-GH-002',
    name: 'Continuous Bean Roasting',
    facilityId: 'FAC-GH-001',
    facilityName: 'Tema Processing Plant',
    inputs: ['Cleaned beans', 'Natural gas', 'Backup diesel'],
    outputs: ['Roasted cocoa nibs', 'Combustion exhaust'],
    productionLine: 'Roasting Line A',
    energySource: 'Natural gas pipeline & Genset',
    meters: ['Gas Meter M-101', 'Genset Diesel Meter D-02'],
    scopes: ['Scope 1', 'Scope 2'],
    status: 'Active',
    description: 'High-temperature thermal roasting process required for flavor development and sterilization.',
    pcfTrace: {
      product: 'Refined Cocoa Butter',
      batch: 'BATCH-2026-GH-881',
      activityRate: '850 kg nibs / hour',
      emissionFactor: '2.02 kg CO₂e / m³ gas',
      calculatedEmissions: '1,420 kg CO₂e / batch',
    },
  },
  {
    id: 'PRC-GH-003',
    name: 'Nib Grinding & Liquor Milling',
    facilityId: 'FAC-GH-001',
    facilityName: 'Tema Processing Plant',
    inputs: ['Roasted nibs', 'Electric power'],
    outputs: ['Unrefined cocoa liquor (mass)'],
    productionLine: 'Grinding Mill B',
    energySource: 'Grid electricity & Solar 1.2 MW',
    meters: ['Mill Power Meter E-202'],
    scopes: ['Scope 2'],
    status: 'Active',
    description: 'Impact milling reducing roasted cocoa nibs into fine liquid cocoa mass.',
    pcfTrace: {
      product: 'Refined Cocoa Butter',
      batch: 'BATCH-2026-GH-881',
      activityRate: '800 kg liquor / hour',
      emissionFactor: '0.180 kg CO₂e / kWh (Solar offset)',
      calculatedEmissions: '540 kg CO₂e / batch',
    },
  },
  {
    id: 'PRC-GH-004',
    name: 'Hydraulic Cocoa Butter Pressing',
    facilityId: 'FAC-GH-001',
    facilityName: 'Tema Processing Plant',
    inputs: ['Cocoa liquor', 'High-pressure steam'],
    outputs: ['Raw cocoa butter', 'Press cake'],
    productionLine: 'Press Line C',
    energySource: 'Industrial steam boiler',
    meters: ['Steam Meter S-301'],
    scopes: ['Scope 1', 'Scope 2'],
    status: 'Active',
    description: 'Mechanical extraction separating cocoa butter lipid fraction from solid cocoa cake.',
    pcfTrace: {
      product: 'Refined Cocoa Butter',
      batch: 'BATCH-2026-GH-881',
      activityRate: '450 kg butter / hour',
      emissionFactor: '0.088 kg CO₂e / kg steam',
      calculatedEmissions: '810 kg CO₂e / batch',
    },
  },
  {
    id: 'PRC-GH-005',
    name: 'Deodorization & Butter Refining',
    facilityId: 'FAC-GH-001',
    facilityName: 'Tema Processing Plant',
    inputs: ['Raw cocoa butter', 'Vacuum steam', 'Filter earth'],
    outputs: ['Refined EU-compliant cocoa butter'],
    productionLine: 'Refining Unit D',
    energySource: 'Boiler steam & chilling loop',
    meters: ['Refining Steam S-302', 'Chiller E-401'],
    scopes: ['Scope 1', 'Scope 2'],
    status: 'Active',
    description: 'Final refining, filtration, and deodorization meeting EU Food Safety & CBAM guidelines.',
    pcfTrace: {
      product: 'Refined Cocoa Butter',
      batch: 'BATCH-2026-GH-881',
      activityRate: '400 kg refined butter / hour',
      emissionFactor: '0.310 kg CO₂e / kg refined',
      calculatedEmissions: '620 kg CO₂e / batch',
    },
  },
  {
    id: 'PRC-GH-006',
    name: 'Bulk Bagging & Storage',
    facilityId: 'FAC-GH-002',
    facilityName: 'Kumasi Materials Hub',
    inputs: ['Refined cocoa butter', 'Pallets & liners'],
    outputs: ['Export-ready commodity pallets'],
    productionLine: 'Packaging Line 1',
    energySource: 'Grid electricity & Forklift fleet',
    meters: ['Warehouse Meter W-101'],
    scopes: ['Scope 2', 'Scope 3'],
    status: 'Active',
    description: 'Cold-chain packaging and palletization prior to port transport.',
    pcfTrace: {
      product: 'Refined Cocoa Butter',
      batch: 'BATCH-2026-GH-881',
      activityRate: '20 tonnes packaged / day',
      emissionFactor: '0.045 kg CO₂e / t-km haulage',
      calculatedEmissions: '180 kg CO₂e / batch',
    },
  },
];

export const OrgProcessesTab: React.FC = () => {
  const [processesList, setProcessesList] = useState<ProcessItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFacilityFilter, setSelectedFacilityFilter] = useState<string>('all');
  const [selectedProcess, setSelectedProcess] = useState<ProcessItem | null>(null);
  const [isAddOpen, setIsAddOpen] = useState(false);

  useEffect(() => {
    getOrgProcesses()
      .then((data) => {
        if (Array.isArray(data)) {
          setProcessesList(data);
        }
      })
      .catch((err) => console.warn('Failed to fetch processes from backend:', err));
  }, []);

  // New Process Form
  const [newProcessName, setNewProcessName] = useState('');
  const [newFacilityName, setNewFacilityName] = useState('Tema Processing Plant');
  const [newEnergySource, setNewEnergySource] = useState('Grid electricity');

  const filteredProcesses = processesList
    .filter((p) => (selectedFacilityFilter === 'all' ? true : p.facilityName === selectedFacilityFilter))
    .filter(
      (p) =>
        (p.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.id || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.productionLine || '').toLowerCase().includes(searchQuery.toLowerCase())
    );

  const uniqueFacilities = Array.from(new Set(processesList.map((p) => p.facilityName).filter(Boolean)));

  const handleAddProcess = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProcessName) return;

    const newP: ProcessItem = {
      id: `PRC-GH-00${processesList.length + 1}`,
      name: newProcessName,
      facilityId: 'FAC-GH-001',
      facilityName: newFacilityName,
      inputs: ['Raw materials', 'Energy'],
      outputs: ['Processed commodity'],
      productionLine: 'Line 1',
      energySource: newEnergySource,
      meters: ['Telemetry Meter'],
      scopes: ['Scope 1', 'Scope 2'],
      status: 'Active',
      description: 'Newly defined operational process.',
      pcfTrace: {
        product: 'Standard Product',
        batch: 'BATCH-NEW',
        activityRate: '100 units / hr',
        emissionFactor: '0.150 kg CO₂e / unit',
        calculatedEmissions: '150 kg CO₂e',
      },
    };

    try {
      await saveOrgProcess(newP);
    } catch (err) {
      console.warn('Backend save process failed, saving locally:', err);
    }

    setProcessesList([...processesList, newP]);
    setIsAddOpen(false);
    setNewProcessName('');
  };

  const handleDeleteProcess = async (id: string) => {
    try {
      await deleteOrgProcess(id);
    } catch (err) {
      console.warn('Backend delete process failed, removing locally:', err);
    }
    setProcessesList((prev) => prev.filter((p) => p.id !== id));
    if (selectedProcess && selectedProcess.id === id) {
      setSelectedProcess(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Ordered Process Flow Strip Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <span className="text-[10px] font-mono font-bold uppercase text-emerald-800 tracking-wider">Sequential Process Flow Strip</span>
            <h3 className="text-base font-bold text-slate-900">Tema Processing Plant — Cocoa Butter Refining Flow</h3>
          </div>
          <span className="bg-emerald-50 text-emerald-700 border border-emerald-200/80 text-[10px] font-bold px-2.5 py-1 rounded-md">
            ISO 14067 & CBAM Compliant Flow
          </span>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-2 text-xs">
          {processesList.slice(0, 5).map((p, idx) => (
            <React.Fragment key={p.id}>
              <div
                onClick={() => setSelectedProcess(p)}
                className="p-3 bg-slate-50 hover:bg-emerald-50/50 border border-slate-200 rounded-xl shrink-0 cursor-pointer transition-colors space-y-1 w-48"
              >
                <span className="text-[9px] font-mono font-bold text-slate-400 block">{p.id}</span>
                <h4 className="font-bold text-slate-900 truncate text-[11px]">{p.name}</h4>
                <div className="flex items-center gap-1 pt-1">
                  {(p.scopes || []).map((s, sIdx) => (
                    <span key={sIdx} className="bg-white text-[9px] font-mono font-bold text-slate-700 px-1.5 py-0.5 rounded border border-slate-200">
                      {s}
                    </span>
                  ))}
                </div>
              </div>
              {idx < 4 && <ChevronRight className="w-4 h-4 text-slate-300 shrink-0" />}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex flex-wrap items-center gap-3 flex-1">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search process name, ID, or line..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-emerald-600"
            />
          </div>

          <select
            value={selectedFacilityFilter}
            onChange={(e) => setSelectedFacilityFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-700 focus:outline-none focus:border-emerald-600"
          >
            <option value="all">All Operating Facilities</option>
            {uniqueFacilities.map((f) => (
              <option key={f} value={f}>
                {f}
              </option>
            ))}
          </select>
        </div>

        <button
          onClick={() => setIsAddOpen(true)}
          className="px-4 py-2 bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          <span>Add Process</span>
        </button>
      </div>

      {/* Process Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-slate-200 text-[10px] font-mono uppercase text-slate-400 bg-slate-50">
              <th className="py-3 px-4">Process ID & Name</th>
              <th className="py-3 px-4">Facility & Line</th>
              <th className="py-3 px-4">Inputs → Outputs</th>
              <th className="py-3 px-4">Energy & Telemetry</th>
              <th className="py-3 px-4">GHG Scope</th>
              <th className="py-3 px-4 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredProcesses.map((p) => (
              <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                <td className="py-3.5 px-4">
                  <span className="font-bold text-slate-900 block">{p.name}</span>
                  <span className="font-mono text-[10px] text-slate-400">{p.id}</span>
                </td>
                <td className="py-3.5 px-4">
                  <span className="font-medium text-slate-900 block">{p.facilityName}</span>
                  <span className="text-[10px] text-slate-400 font-mono">{p.productionLine}</span>
                </td>
                <td className="py-3.5 px-4 max-w-xs">
                  <div className="flex items-center gap-1.5 text-[11px]">
                    <span className="text-slate-600 font-medium truncate">{(p.inputs || []).join(', ') || 'None'}</span>
                    <ArrowRight className="w-3 h-3 text-slate-400 shrink-0" />
                    <span className="text-emerald-800 font-bold truncate">{(p.outputs || []).join(', ') || 'None'}</span>
                  </div>
                </td>
                <td className="py-3.5 px-4">
                  <span className="font-medium text-slate-700 block">{p.energySource}</span>
                  <span className="font-mono text-[10px] text-slate-400">{(p.meters || []).join(', ') || 'None'}</span>
                </td>
                <td className="py-3.5 px-4">
                  <div className="flex items-center gap-1">
                    {(p.scopes || []).map((s, idx) => (
                      <span
                        key={idx}
                        className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded border ${
                          s === 'Scope 1'
                            ? 'bg-amber-50 text-amber-800 border-amber-200'
                            : s === 'Scope 2'
                            ? 'bg-sky-50 text-sky-800 border-sky-200'
                            : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                        }`}
                      >
                        {s}
                      </span>
                    ))}
                  </div>
                </td>
                <td className="py-3.5 px-4 text-right">
                  <button
                    onClick={() => setSelectedProcess(p)}
                    className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg text-[11px] transition-colors"
                  >
                    PCF Trace
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Process Detail & PCF Trace Modal */}
      {selectedProcess && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-2xl rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
            <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-emerald-50 text-emerald-800 rounded-xl">
                  <Workflow className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[10px] font-mono text-slate-400 font-bold uppercase">{selectedProcess.id}</span>
                  <h3 className="font-bold text-slate-900 text-base">{selectedProcess.name}</h3>
                </div>
              </div>
              <button onClick={() => setSelectedProcess(null)} className="p-1 text-slate-400 hover:text-slate-600 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-5 text-xs">
              <p className="text-slate-600 font-medium leading-relaxed">{selectedProcess.description}</p>

              {/* Input -> Output Flow */}
              <div className="grid grid-cols-2 gap-4 p-4 bg-slate-50 rounded-xl border border-slate-200">
                <div className="space-y-1">
                  <span className="text-[10px] font-mono font-bold text-slate-400 uppercase block">Process Inputs</span>
                  <ul className="list-disc list-inside text-slate-800 font-medium space-y-0.5">
                    {(selectedProcess.inputs || []).map((i, idx) => (
                      <li key={idx}>{i}</li>
                    ))}
                  </ul>
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] font-mono font-bold text-emerald-800 uppercase block">Process Outputs</span>
                  <ul className="list-disc list-inside text-slate-800 font-medium space-y-0.5">
                    {(selectedProcess.outputs || []).map((o, idx) => (
                      <li key={idx}>{o}</li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* PCF Lineage Trace */}
              <div className="p-5 bg-emerald-50/50 rounded-2xl border border-emerald-100 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono font-bold text-emerald-800 uppercase tracking-wider">PCF Lineage & Calculation Trace</span>
                  <span className="bg-emerald-600 text-white font-mono text-[9px] font-bold px-2 py-0.5 rounded">PASSED</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-slate-800">
                  <div className="p-2.5 bg-white rounded-lg border border-emerald-100">
                    <span className="text-[9px] font-mono text-slate-400 block uppercase">Linked Product</span>
                    <span className="font-bold text-slate-900 block truncate">{selectedProcess.pcfTrace?.product || 'N/A'}</span>
                  </div>
                  <div className="p-2.5 bg-white rounded-lg border border-emerald-100">
                    <span className="text-[9px] font-mono text-slate-400 block uppercase">Batch Code</span>
                    <span className="font-mono font-bold text-slate-900 block truncate">{selectedProcess.pcfTrace?.batch || 'N/A'}</span>
                  </div>
                  <div className="p-2.5 bg-white rounded-lg border border-emerald-100">
                    <span className="text-[9px] font-mono text-slate-400 block uppercase">Activity Rate</span>
                    <span className="font-bold text-slate-900 block">{selectedProcess.pcfTrace?.activityRate || 'N/A'}</span>
                  </div>
                  <div className="p-2.5 bg-white rounded-lg border border-emerald-100">
                    <span className="text-[9px] font-mono text-slate-400 block uppercase">Emission Factor</span>
                    <span className="font-mono font-bold text-slate-900 block">{selectedProcess.pcfTrace?.emissionFactor || 'N/A'}</span>
                  </div>
                  <div className="sm:col-span-2 p-2.5 bg-white rounded-lg border border-emerald-200">
                    <span className="text-[9px] font-mono text-slate-400 block uppercase">Attributed Process Emissions</span>
                    <span className="font-black text-emerald-700 text-sm block">{selectedProcess.pcfTrace?.calculatedEmissions || 'N/A'}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
              <button
                onClick={() => handleDeleteProcess(selectedProcess.id)}
                className="px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs rounded-xl border border-rose-200 flex items-center gap-1.5 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                <span>Delete Process</span>
              </button>
              <button
                onClick={() => setSelectedProcess(null)}
                className="px-4 py-2 bg-slate-900 text-white font-bold text-xs rounded-xl hover:bg-slate-800"
              >
                Close Trace
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Process Modal */}
      {isAddOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
            <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <h3 className="font-bold text-slate-900 text-sm">Add New Industrial Process</h3>
              <button onClick={() => setIsAddOpen(false)} className="p-1 text-slate-400 hover:text-slate-600 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddProcess} className="p-5 space-y-4 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Process Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Steam Sterilization"
                  value={newProcessName}
                  onChange={(e) => setNewProcessName(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-emerald-600"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Operating Facility</label>
                <select
                  value={newFacilityName}
                  onChange={(e) => setNewFacilityName(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-slate-900 bg-white focus:outline-none focus:border-emerald-600"
                >
                  {uniqueFacilities.map((f) => (
                    <option key={f} value={f}>
                      {f}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Primary Energy Source</label>
                <input
                  type="text"
                  placeholder="e.g. Natural Gas / Grid electricity"
                  value={newEnergySource}
                  onChange={(e) => setNewEnergySource(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-emerald-600"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddOpen(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-700 font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-800 hover:bg-emerald-900 text-white font-bold rounded-xl shadow-xs"
                >
                  Save Process
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
