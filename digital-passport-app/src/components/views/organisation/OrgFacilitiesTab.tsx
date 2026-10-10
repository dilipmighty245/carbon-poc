import React, { useState, useEffect } from 'react';
import { getOrgFacilities, saveOrgFacility, deleteOrgFacility } from '../../../api/client';
import { LiveTelemetryModal } from '../../telemetry/LiveTelemetryModal';
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
  Trash2,
  Activity,
  Radio
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

export const initialFacilities: Facility[] = [];

export const OrgFacilitiesTab: React.FC = () => {
  const [facilitiesList, setFacilitiesList] = useState<Facility[]>([]);
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFacility, setSelectedFacility] = useState<Facility | null>(null);
  const [isAddOpen, setIsAddOpen] = useState(false);

  useEffect(() => {
    getOrgFacilities()
      .then((data) => {
        if (Array.isArray(data)) {
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

  const [activeTelemetryMeter, setActiveTelemetryMeter] = useState<{
    meterId: string;
    facilityId: string;
    facilityName: string;
  } | null>(null);

  const handleAddFacility = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFacilityName) return;

    const facIndex = facilitiesList.length + 1;
    const facId = `FAC-GH-${String(facIndex).padStart(3, '0')}`;
    const meterId = `MTR-GH-${String(facIndex).padStart(3, '0')}`;

    const newFac: Facility = {
      id: facId,
      name: newFacilityName,
      type: newFacilityType,
      country: newFacilityCountry,
      countryCode: "GH",
      address: newFacilityAddress || "Industrial Zone, Ghana",
      status: "Active",
      processesCount: 1,
      devicesCount: 1, // 1 Sattric EM6400 IoT meter connected automatically
      dataCompleteness: 100,
      emissions: "0 tCO₂e", // Baseline zero emissions
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
      processTree: [
        {
          id: `PRC-${String(facIndex).padStart(3, '0')}`,
          name: `${newFacilityName} Processing Line`,
          lines: [
            {
              id: "LINE-01",
              name: "Primary Infeed & Feeder",
              meters: [
                {
                  name: `Sattric EM6400 Smart Meter (${meterId})`,
                  type: "kWh Telemetry · EM6400",
                },
              ],
            },
          ],
        },
      ],
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

  // Dynamic Telemetry & Emissions Calculations (Zero baseline for clean slate)
  const activeSitesCount = facilitiesList.length;

  const totalSattricMeters = facilitiesList.reduce(
    (sum, f) => sum + (typeof f.devicesCount === 'number' && f.devicesCount > 0 ? f.devicesCount : 1),
    0
  );

  const avgCompleteness =
    activeSitesCount > 0
      ? Math.round(
          facilitiesList.reduce((sum, f) => sum + (f.dataCompleteness || 0), 0) /
            activeSitesCount
        )
      : 0;

  const totalEmissionsVal = facilitiesList.reduce((acc, f) => {
    if (!f.emissions) return acc;
    const clean = f.emissions.replace(/,/g, '');
    const match = clean.match(/([\d.]+)/);
    if (!match) return acc;
    let val = parseFloat(match[1]);
    if (clean.toLowerCase().includes('kgco2') || clean.toLowerCase().includes('kg co2')) {
      val = val / 1000;
    }
    return acc + (isNaN(val) ? 0 : val);
  }, 0);

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
            <span className="text-xl font-black text-slate-900">
              {activeSitesCount} {activeSitesCount === 1 ? 'Facility' : 'Facilities'}
            </span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-3">
          <div className="p-3 bg-emerald-50 text-emerald-800 rounded-xl">
            <Cpu className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-mono font-bold text-slate-400 uppercase block">Connected Telemetry</span>
            <span className="text-xl font-black text-slate-900">
              {totalSattricMeters} {totalSattricMeters === 1 ? 'Sattric Meter' : 'Sattric Meters'}
            </span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-3">
          <div className="p-3 bg-emerald-50 text-emerald-800 rounded-xl">
            <Gauge className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-mono font-bold text-slate-400 uppercase block">Avg Data Completeness</span>
            <span className="text-xl font-black text-emerald-700">
              {activeSitesCount > 0 ? `${avgCompleteness}%` : '0%'}
            </span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-3">
          <div className="p-3 bg-emerald-50 text-emerald-800 rounded-xl">
            <Zap className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-mono font-bold text-slate-400 uppercase block">Total Emissions Scope</span>
            <span className="text-xl font-black text-slate-900">
              {activeSitesCount === 0 || totalEmissionsVal === 0
                ? '0 tCO₂e'
                : `${Math.round(totalEmissionsVal).toLocaleString()} tCO₂e`}
            </span>
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
      {filteredFacilities.length === 0 ? (
        <div className="bg-white p-12 rounded-3xl border border-dashed border-slate-300 text-center space-y-4 shadow-xs">
          <div className="w-16 h-16 mx-auto bg-emerald-50 text-emerald-800 rounded-2xl flex items-center justify-center border border-emerald-100">
            <Factory className="w-8 h-8 text-emerald-600" />
          </div>
          <div className="max-w-md mx-auto space-y-1.5">
            <h3 className="text-base font-black text-slate-900 tracking-tight">
              {facilitiesList.length === 0 ? 'No Operating Facilities Registered' : 'No Facilities Match Search'}
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              {facilitiesList.length === 0
                ? 'Your organisation starts with a zero baseline. When you register a facility, 1 Sattric EM6400 IoT Smart Telemetry Meter is automatically connected to stream live kWh load and Scope 1/2 emissions.'
                : 'Try adjusting your search criteria or clear active filters.'}
            </p>
          </div>
          {facilitiesList.length === 0 && (
            <button
              onClick={() => setIsAddOpen(true)}
              className="px-5 py-2.5 bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs rounded-xl shadow-xs transition-colors inline-flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              <span>Add First Facility</span>
            </button>
          )}
        </div>
      ) : viewMode === 'grid' ? (
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
                <div className="flex items-center gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveTelemetryMeter({
                        meterId: `MTR-GH-${f.id.split('-').pop() || '001'}`,
                        facilityId: f.id,
                        facilityName: f.name,
                      });
                    }}
                    className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold text-[10px] rounded-lg border border-emerald-200 flex items-center gap-1 transition-colors"
                    title="Inspect live EM6400 industrial telemetry"
                  >
                    <Activity className="w-3 h-3 text-emerald-600 animate-pulse" />
                    <span>Telemetry</span>
                  </button>
                  <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold px-2.5 py-1 rounded-md">
                    {f.readiness}
                  </span>
                </div>
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
                  <span><strong className="text-slate-900">{f.processesCount || 1}</strong> Processes</span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span><strong className="text-slate-900">{f.devicesCount || 1}</strong> Sattric {(f.devicesCount || 1) === 1 ? 'Meter' : 'Meters'}</span>
                  </span>
                </div>
                <span className="font-mono font-bold text-slate-900">{f.emissions || '0 tCO₂e'}</span>
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
                  <td className="py-3.5 px-4 font-mono font-bold text-slate-900">{f.emissions || '0 tCO₂e'}</td>
                  <td className="py-3.5 px-4">
                    <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold px-2 py-0.5 rounded">
                      {f.readiness}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => {
                          const mtrId = `MTR-GH-${f.id.split('-').pop() || '001'}`;
                          setActiveTelemetryMeter({
                            meterId: mtrId,
                            facilityId: f.id,
                            facilityName: f.name,
                          });
                        }}
                        className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold rounded-lg text-[11px] transition-colors border border-emerald-200 flex items-center gap-1"
                        title="View Live EM6400 Telemetry"
                      >
                        <Activity className="w-3 h-3 text-emerald-600 animate-pulse" />
                        <span>Feed</span>
                      </button>
                      <button
                        onClick={() => setSelectedFacility(f)}
                        className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg text-[11px] transition-colors"
                      >
                        View Details
                      </button>
                    </div>
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

              {/* Data Hierarchy Tree */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-slate-900 text-sm">Telemetry Data Hierarchy</h4>
                  <span className="text-[10px] font-mono text-slate-400">Organisation → Facility → Process → Line → Meter</span>
                </div>

                <div className="p-4 bg-slate-50/80 rounded-2xl border border-slate-200 space-y-2 text-xs font-mono">
                  {/* Root Node: Facility */}
                  <div className="flex items-center gap-2 p-2.5 bg-emerald-50 text-emerald-900 rounded-xl border border-emerald-200 font-bold">
                    <span>🏢 {selectedFacility.name} ({selectedFacility.id})</span>
                  </div>

                  {/* Level 1: Processes */}
                  {(selectedFacility.processTree || []).map((proc) => (
                    <div key={proc.id} className="pl-4 border-l-2 border-slate-300 space-y-2 my-1">
                      <div className="flex items-center gap-2 p-2 bg-sky-50 text-sky-900 rounded-xl border border-sky-200 font-semibold">
                        <span>⚙️ Process: {proc.name} ({proc.id})</span>
                      </div>

                      {/* Level 2: Lines */}
                      {(proc.lines || []).map((line) => (
                        <div key={line.id} className="pl-4 border-l-2 border-slate-300 space-y-2 my-1">
                          <div className="flex items-center gap-2 p-2 bg-slate-100 text-slate-800 rounded-xl border border-slate-200 font-medium">
                            <span>🏭 Line: {line.name} ({line.id})</span>
                          </div>

                          {/* Level 3: Meters / Sensors */}
                          {(line.meters || []).map((meter, mIdx) => (
                            <div key={mIdx} className="pl-4 border-l-2 border-emerald-400 my-1">
                              <div className="flex items-center justify-between p-2.5 bg-white text-emerald-800 rounded-xl border border-emerald-100 font-mono text-[11px] gap-2">
                                <div className="flex items-center gap-2 min-w-0">
                                  <span>📡</span>
                                  <span className="font-bold truncate">{meter.name}</span>
                                </div>
                                <div className="flex items-center gap-2 shrink-0">
                                  <span className="text-[9px] bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded border border-emerald-200 font-bold">
                                    {meter.type}
                                  </span>
                                  <button
                                    onClick={() => {
                                      const extractedMtr = meter.name.match(/\(([^)]+)\)/)?.[1] || `MTR-GH-${selectedFacility.id.split('-').pop() || '001'}`;
                                      setActiveTelemetryMeter({
                                        meterId: extractedMtr,
                                        facilityId: selectedFacility.id,
                                        facilityName: selectedFacility.name,
                                      });
                                    }}
                                    className="flex items-center gap-1 px-2.5 py-1 bg-emerald-700 hover:bg-emerald-800 text-white font-sans font-bold text-[10px] rounded-lg transition-colors shadow-xs"
                                  >
                                    <Activity className="w-3 h-3 animate-pulse" />
                                    <span>Live Feed</span>
                                  </button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
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

      {/* Live EM6400 Industrial Telemetry Modal */}
      {activeTelemetryMeter && (
        <LiveTelemetryModal
          meterId={activeTelemetryMeter.meterId}
          facilityId={activeTelemetryMeter.facilityId}
          facilityName={activeTelemetryMeter.facilityName}
          onClose={() => setActiveTelemetryMeter(null)}
        />
      )}
    </div>
  );
};
