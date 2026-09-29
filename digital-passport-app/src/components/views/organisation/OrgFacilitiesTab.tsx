import React, { useState, useEffect } from 'react';
import { getOrgFacilities, saveOrgFacility, deleteOrgFacility } from '../../../api/client';
import {
  Factory,
  MapPin,
  Cpu,
  Gauge,
  Plus,
  LayoutGrid,
  Rows3,
  Search,
  X,
  CheckCircle2,
  AlertTriangle,
  ChevronRight,
  User,
  Zap,
  Globe,
  PlusCircle,
  Trash2
} from 'lucide-react';

export interface Facility {
  id: string;
  name: string;
  type: string;
  country: string;
  countryCode: string;
  address: string;
  status: string;
  processesCount: number;
  devicesCount: number;
  dataCompleteness: number;
  emissions: string;
  readiness: string;
  geo: { lat: string; lng: string; timezone: string };
  productionCapacity: string;
  operatingHours: string;
  manager: { name: string; title: string; email: string };
  energySources: string[];
  utilities: string[];
  products: string[];
  emissionSources: { name: string; scope: string }[];
  processTree: {
    id: string;
    name: string;
    lines: { id: string; name: string; meters: { name: string; type: string }[] }[];
  }[];
}

export const initialFacilities: Facility[] = [
  {
    id: "FAC-GH-001",
    name: "Tema Processing Plant",
    type: "Production Facility",
    country: "Ghana",
    countryCode: "GH",
    address: "Heavy Industrial Area, Tema, Greater Accra, Ghana",
    status: "Active",
    processesCount: 6,
    devicesCount: 18,
    dataCompleteness: 96,
    emissions: "12,480 tCO₂e",
    readiness: "Audit-Ready",
    geo: { lat: "5.6698° N", lng: "0.0166° W", timezone: "GMT (UTC+0)" },
    productionCapacity: "84,000 tonnes / year",
    operatingHours: "24/7 · 3 shifts",
    manager: {
      name: "Kwame Mensah",
      title: "Plant Operations Manager",
      email: "k.mensah@saurient-carbon.com",
    },
    energySources: ["Grid electricity (VRA)", "On-site solar 1.2 MW", "Diesel backup gensets"],
    utilities: ["Ghana Water Company", "Natural gas pipeline", "Fibre + industrial LAN"],
    products: ["Refined cocoa liquor", "Cocoa butter", "Packaged cocoa powder"],
    emissionSources: [
      { name: "Stationary combustion (roasting gensets)", scope: "Scope 1" },
      { name: "Purchased electricity (grid)", scope: "Scope 2" },
      { name: "Process refrigerants", scope: "Scope 1" },
      { name: "Inbound bean transport", scope: "Scope 3" },
    ],
    processTree: [
      {
        id: "PRC-001",
        name: "Bean Roasting & Grinding",
        lines: [
          {
            id: "LINE-01",
            name: "Roasting Line A",
            meters: [
              { name: "Gas Meter M-101", type: "Natural Gas Flow" },
              { name: "Power Meter E-201", type: "kWh Telemetry" },
            ],
          },
          {
            id: "LINE-02",
            name: "Grinding Mill B",
            meters: [{ name: "Mill Power Meter E-202", type: "kWh Telemetry" }],
          },
        ],
      },
      {
        id: "PRC-002",
        name: "Cocoa Butter Refining & Pressing",
        lines: [
          {
            id: "LINE-03",
            name: "Press Line C",
            meters: [{ name: "Press Steam Meter S-301", type: "Steam Flow" }],
          },
        ],
      },
    ],
  },
  {
    id: "FAC-GH-002",
    name: "Kumasi Materials Hub",
    type: "Aggregation Warehouse",
    country: "Ghana",
    countryCode: "GH",
    address: "Boankra Inland Port Zone, Kumasi, Ashanti, Ghana",
    status: "Active",
    processesCount: 2,
    devicesCount: 8,
    dataCompleteness: 91,
    emissions: "3,120 tCO₂e",
    readiness: "Audit-Ready",
    geo: { lat: "6.6885° N", lng: "1.6244° W", timezone: "GMT (UTC+0)" },
    productionCapacity: "120,000 tonnes storage",
    operatingHours: "16/5 · 2 shifts",
    manager: {
      name: "Abena Serwaa",
      title: "Logistics Hub Supervisor",
      email: "a.serwaa@saurient-carbon.com",
    },
    energySources: ["Grid electricity", "Solar rooftop 400 kW"],
    utilities: ["Municipal water", "Logistics fleet EV chargers"],
    products: ["Raw cocoa beans", "Pre-bagged commodities"],
    emissionSources: [
      { name: "Forklift diesel combustion", scope: "Scope 1" },
      { name: "Purchased warehouse electricity", scope: "Scope 2" },
      { name: "Local farm aggregation haulage", scope: "Scope 3" },
    ],
    processTree: [
      {
        id: "PRC-003",
        name: "Sorting & Moisture Testing",
        lines: [
          {
            id: "LINE-04",
            name: "Sorting Bay 1",
            meters: [{ name: "Telemetry Scale W-101", type: "Weight Sensor" }],
          },
        ],
      },
    ],
  },
  {
    id: "FAC-GH-003",
    name: "Takoradi Export Terminal",
    type: "Port Terminal",
    country: "Ghana",
    countryCode: "GH",
    address: "Takoradi Port Container Terminal, Western Region, Ghana",
    status: "Active",
    processesCount: 3,
    devicesCount: 12,
    dataCompleteness: 98,
    emissions: "1,850 tCO₂e",
    readiness: "Audit-Ready",
    geo: { lat: "4.8845° N", lng: "1.7554° W", timezone: "GMT (UTC+0)" },
    productionCapacity: "200,000 TEU / year",
    operatingHours: "24/7 · 3 shifts",
    manager: {
      name: "Kofi Annan",
      title: "Port Terminal Operations Lead",
      email: "k.annan@saurient-carbon.com",
    },
    energySources: ["Shore power connection", "Grid electricity"],
    utilities: ["Port authority water & power"],
    products: ["Export-packaged cocoa butter & steel frames"],
    emissionSources: [
      { name: "Container crane diesel", scope: "Scope 1" },
      { name: "Terminal lighting grid", scope: "Scope 2" },
    ],
    processTree: [],
  },
  {
    id: "FAC-GH-004",
    name: "Accra Corporate Office",
    type: "Administrative HQ",
    country: "Ghana",
    countryCode: "GH",
    address: "Airport Residential Area, Accra, Ghana",
    status: "Active",
    processesCount: 1,
    devicesCount: 4,
    dataCompleteness: 88,
    emissions: "420 tCO₂e",
    readiness: "In Review",
    geo: { lat: "5.6037° N", lng: "0.1870° W", timezone: "GMT (UTC+0)" },
    productionCapacity: "Corporate administration",
    operatingHours: "08:00 - 17:00 (Mon - Fri)",
    manager: {
      name: "Esi Badu",
      title: "Facility Manager",
      email: "e.badu@saurient-carbon.com",
    },
    energySources: ["Grid electricity", "Rooftop solar"],
    utilities: ["Commercial internet & power"],
    products: ["Executive management"],
    emissionSources: [
      { name: "HVAC purchased electricity", scope: "Scope 2" },
      { name: "Employee commuting", scope: "Scope 3" },
    ],
    processTree: [],
  },
];

export const OrgFacilitiesTab: React.FC = () => {
  const [facilitiesList, setFacilitiesList] = useState<Facility[]>(initialFacilities);
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFacility, setSelectedFacility] = useState<Facility | null>(null);
  const [isAddOpen, setIsAddOpen] = useState(false);

  useEffect(() => {
    getOrgFacilities()
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setFacilitiesList(data);
        }
      })
      .catch((err) => console.warn('Failed to fetch facilities from backend:', err));
  }, []);

  // New facility form state
  const [newFacilityName, setNewFacilityName] = useState('');
  const [newFacilityType, setNewFacilityType] = useState('Production Facility');
  const [newFacilityCountry, setNewFacilityTypeCountry] = useState('Ghana');
  const [newFacilityAddress, setNewFacilityAddress] = useState('');

  const filteredFacilities = facilitiesList.filter(
    (f) =>
      (f.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (f.id || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (f.country || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleAddFacility = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFacilityName) return;

    const newFac: Facility = {
      id: `FAC-GH-00${facilitiesList.length + 1}`,
      name: newFacilityName,
      type: newFacilityType,
      country: newFacilityCountry,
      countryCode: "GH",
      address: newFacilityAddress || "Industrial Zone, Ghana",
      status: "Active",
      processesCount: 1,
      devicesCount: 2,
      dataCompleteness: 100,
      emissions: "0 tCO₂e",
      readiness: "Audit-Ready",
      geo: { lat: "5.6000° N", lng: "0.2000° W", timezone: "GMT (UTC+0)" },
      productionCapacity: "50,000 tonnes / year",
      operatingHours: "24/7 · 3 shifts",
      manager: {
        name: "New Manager",
        title: "Facility Lead",
        email: "manager@saurient-carbon.com",
      },
      energySources: ["Grid electricity"],
      utilities: ["Industrial water"],
      products: ["Commodities"],
      emissionSources: [{ name: "Electricity", scope: "Scope 2" }],
      processTree: [],
    };

    try {
      await saveOrgFacility(newFac);
    } catch (err) {
      console.warn('Backend save facility failed, saving locally:', err);
    }

    setFacilitiesList([...facilitiesList, newFac]);
    setIsAddOpen(false);
    setNewFacilityName('');
    setNewFacilityAddress('');
  };

  const handleDeleteFacility = async (id: string) => {
    try {
      await deleteOrgFacility(id);
    } catch (err) {
      console.warn('Backend delete facility failed, removing locally:', err);
    }
    setFacilitiesList((prev) => prev.filter((f) => f.id !== id));
    if (selectedFacility && selectedFacility.id === id) {
      setSelectedFacility(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Stats Bar */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-3">
          <div className="p-3 bg-emerald-50 text-emerald-800 rounded-xl">
            <Factory className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-mono font-bold text-slate-400 uppercase block">Active Sites</span>
            <span className="text-xl font-black text-slate-900">{facilitiesList.length} Facilities</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-3">
          <div className="p-3 bg-emerald-50 text-emerald-800 rounded-xl">
            <Cpu className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-mono font-bold text-slate-400 uppercase block">Connected Telemetry</span>
            <span className="text-xl font-black text-slate-900">42 Sensors & Meters</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-3">
          <div className="p-3 bg-emerald-50 text-emerald-800 rounded-xl">
            <Gauge className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-mono font-bold text-slate-400 uppercase block">Avg Data Completeness</span>
            <span className="text-xl font-black text-emerald-700">93.2%</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-3">
          <div className="p-3 bg-emerald-50 text-emerald-800 rounded-xl">
            <Zap className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-mono font-bold text-slate-400 uppercase block">Total Emissions Scope</span>
            <span className="text-xl font-black text-slate-900">17,870 tCO₂e</span>
          </div>
        </div>
      </div>

      {/* Filter and View Toggle Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search facility name, ID, or location..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-emerald-600"
          />
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg text-xs font-bold transition-colors ${
                viewMode === 'grid' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-lg text-xs font-bold transition-colors ${
                viewMode === 'table' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <Rows3 className="w-4 h-4" />
            </button>
          </div>

          <button
            onClick={() => setIsAddOpen(true)}
            className="px-4 py-2 bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>Add Facility</span>
          </button>
        </div>
      </div>

      {/* Main Facilities View */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredFacilities.map((f) => (
            <div
              key={f.id}
              onClick={() => setSelectedFacility(f)}
              className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs hover:border-emerald-500/50 hover:shadow-md transition-all cursor-pointer space-y-4 group"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-slate-100 group-hover:bg-emerald-50 text-slate-700 group-hover:text-emerald-800 rounded-xl transition-colors">
                    <Factory className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="text-[10px] font-mono text-slate-400 font-bold uppercase">{f.id} · {f.type}</span>
                    <h3 className="font-bold text-slate-900 text-base group-hover:text-emerald-800 transition-colors">{f.name}</h3>
                  </div>
                </div>
                <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold px-2.5 py-1 rounded-md">
                  {f.readiness}
                </span>
              </div>

              <div className="flex items-center gap-2 text-xs text-slate-500">
                <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span className="truncate">{f.address}</span>
              </div>

              {/* Data Completeness Bar */}
              <div className="space-y-1">
                <div className="flex justify-between text-[11px] font-mono font-bold">
                  <span className="text-slate-500">Data Completeness</span>
                  <span className="text-emerald-700">{f.dataCompleteness}%</span>
                </div>
                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-600 rounded-full transition-all"
                    style={{ width: `${f.dataCompleteness}%` }}
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-medium text-slate-600">
                <div className="flex items-center gap-4">
                  <span><strong className="text-slate-900">{f.processesCount}</strong> Processes</span>
                  <span><strong className="text-slate-900">{f.devicesCount}</strong> Telemetry Devices</span>
                </div>
                <span className="font-mono font-bold text-slate-900">{f.emissions}</span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-[10px] font-mono uppercase text-slate-400 bg-slate-50">
                <th className="py-3 px-4">Facility ID & Name</th>
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4">Location</th>
                <th className="py-3 px-4">Completeness</th>
                <th className="py-3 px-4">Emissions</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredFacilities.map((f) => (
                <tr key={f.id} className="hover:bg-slate-50 transition-colors">
                  <td className="py-3.5 px-4">
                    <span className="font-bold text-slate-900 block">{f.name}</span>
                    <span className="font-mono text-[10px] text-slate-400">{f.id}</span>
                  </td>
                  <td className="py-3.5 px-4 text-slate-600 font-medium">{f.type}</td>
                  <td className="py-3.5 px-4 text-slate-600 font-medium">{f.country}</td>
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-2">
                      <div className="w-20 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full bg-emerald-600 rounded-full" style={{ width: `${f.dataCompleteness}%` }} />
                      </div>
                      <span className="font-mono text-[10px] font-bold text-slate-700">{f.dataCompleteness}%</span>
                    </div>
                  </td>
                  <td className="py-3.5 px-4 font-mono font-bold text-slate-900">{f.emissions}</td>
                  <td className="py-3.5 px-4">
                    <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold px-2 py-0.5 rounded">
                      {f.readiness}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <button
                      onClick={() => setSelectedFacility(f)}
                      className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg text-[11px] transition-colors"
                    >
                      View Details
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Facility Detail Drawer */}
      {selectedFacility && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex justify-end">
          <div className="bg-white w-full max-w-xl h-full shadow-2xl border-l border-slate-200 flex flex-col justify-between overflow-hidden animate-in slide-in-from-right">
            <div className="p-6 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-emerald-50 text-emerald-800 rounded-xl">
                  <Factory className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-[10px] font-mono text-slate-400 font-bold uppercase">{selectedFacility.id}</span>
                  <h3 className="font-bold text-slate-900 text-lg">{selectedFacility.name}</h3>
                </div>
              </div>
              <button onClick={() => setSelectedFacility(null)} className="p-1 text-slate-400 hover:text-slate-600 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6 overflow-y-auto flex-1 text-xs">
              <div className="grid grid-cols-2 gap-3 p-4 bg-slate-50 rounded-xl border border-slate-200/80">
                <div>
                  <span className="text-[10px] font-mono text-slate-400 uppercase block">Facility Type</span>
                  <span className="font-bold text-slate-900">{selectedFacility.type}</span>
                </div>
                <div>
                  <span className="text-[10px] font-mono text-slate-400 uppercase block">Capacity</span>
                  <span className="font-bold text-slate-900">{selectedFacility.productionCapacity}</span>
                </div>
                <div className="col-span-2 pt-2 border-t border-slate-200/60">
                  <span className="text-[10px] font-mono text-slate-400 uppercase block">Physical Address</span>
                  <span className="font-bold text-slate-900">{selectedFacility.address}</span>
                </div>
              </div>

              {/* Operations Manager */}
              <div className="p-4 bg-emerald-50/50 rounded-xl border border-emerald-100 space-y-2">
                <span className="text-[10px] font-mono font-bold text-emerald-800 uppercase block">Operations Manager</span>
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm">{selectedFacility.manager?.name || 'Unassigned'}</h4>
                    <p className="text-slate-500 font-medium text-[11px]">{selectedFacility.manager?.title || ''}</p>
                  </div>
                  <span className="font-mono text-[11px] text-slate-600 font-medium">{selectedFacility.manager?.email || ''}</span>
                </div>
              </div>

              {/* Energy Mix & Utilities */}
              <div className="space-y-3">
                <h4 className="font-bold text-slate-900 text-sm">Energy Mix & Utility Connectivity</h4>
                <div className="flex flex-wrap gap-2">
                  {(selectedFacility.energySources || []).map((e, idx) => (
                    <span key={idx} className="bg-slate-100 text-slate-800 font-medium px-3 py-1 rounded-lg text-xs border border-slate-200">
                      ⚡ {e}
                    </span>
                  ))}
                  {(selectedFacility.utilities || []).map((u, idx) => (
                    <span key={idx} className="bg-slate-100 text-slate-800 font-medium px-3 py-1 rounded-lg text-xs border border-slate-200">
                      💧 {u}
                    </span>
                  ))}
                </div>
              </div>

              {/* Process Tree Hierarchy */}
              {(selectedFacility.processTree || []).length > 0 && (
                <div className="space-y-3">
                  <h4 className="font-bold text-slate-900 text-sm">Process Lines & Connected Telemetry</h4>
                  <div className="space-y-3">
                    {(selectedFacility.processTree || []).map((p) => (
                      <div key={p.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                        <span className="font-bold text-slate-900 block">{p.name} ({p.id})</span>
                        {(p.lines || []).map((l) => (
                          <div key={l.id} className="pl-3 border-l-2 border-emerald-500 space-y-1">
                            <span className="font-medium text-slate-700 block">{l.name}</span>
                            <div className="flex flex-wrap gap-1.5">
                              {(l.meters || []).map((m, mIdx) => (
                                <span key={mIdx} className="bg-white font-mono text-[10px] text-slate-700 px-2 py-0.5 rounded border border-slate-200">
                                  📡 {m.name} ({m.type})
                                </span>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
              <button
                onClick={() => handleDeleteFacility(selectedFacility.id)}
                className="px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs rounded-xl border border-rose-200 flex items-center gap-1.5 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                <span>Delete Facility</span>
              </button>
              <button
                onClick={() => setSelectedFacility(null)}
                className="px-4 py-2 bg-slate-900 text-white font-bold text-xs rounded-xl hover:bg-slate-800"
              >
                Close View
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Facility Modal */}
      {isAddOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
            <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <h3 className="font-bold text-slate-900 text-sm">Add New Operating Facility</h3>
              <button onClick={() => setIsAddOpen(false)} className="p-1 text-slate-400 hover:text-slate-600 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddFacility} className="p-5 space-y-4 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Facility Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Takoradi Grain Silos"
                  value={newFacilityName}
                  onChange={(e) => setNewFacilityName(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-emerald-600"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Facility Type</label>
                <select
                  value={newFacilityType}
                  onChange={(e) => setNewFacilityType(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-slate-900 bg-white focus:outline-none focus:border-emerald-600"
                >
                  <option value="Production Facility">Production Facility</option>
                  <option value="Aggregation Warehouse">Aggregation Warehouse</option>
                  <option value="Port Terminal">Port Terminal</option>
                  <option value="Administrative HQ">Administrative HQ</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Physical Address</label>
                <textarea
                  rows={2}
                  placeholder="Street, City, Region..."
                  value={newFacilityAddress}
                  onChange={(e) => setNewFacilityAddress(e.target.value)}
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
                  Save Facility
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
