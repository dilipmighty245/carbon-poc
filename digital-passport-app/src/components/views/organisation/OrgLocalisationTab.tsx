import React, { useState, useEffect } from 'react';
import { getOrgLocalisation, saveOrgLocalisation } from '../../../api/client';
import {
  Globe,
  Sliders,
  Scale,
  FileCheck,
  CheckCircle2,
  X,
  RotateCcw,
  Save,
  Check
} from 'lucide-react';

export interface LocalisationConfig {
  country: string;
  currency: string;
  timezone: string;
  language: string;
  units: {
    energy: string;
    fuel: string;
    mass: string;
    emissions: string;
  };
  regulatory: {
    gridRegion: string;
    efDataset: string;
    cbamDestination: string;
  };
}

export const initialLocalisation: LocalisationConfig = {
  country: 'Ghana (GH)',
  currency: 'GHS (₵) / EUR (€)',
  timezone: 'GMT (UTC+0)',
  language: 'English (UK)',
  units: {
    energy: 'kWh / MWh',
    fuel: 'Litres (L)',
    mass: 'Metric Tonnes (t)',
    emissions: 'tCO₂e',
  },
  regulatory: {
    gridRegion: 'Sub-Saharan Africa · West Africa Power Pool (WAPP)',
    efDataset: 'DEFRA 2025 / IPCC AR6 / Ecoinvent v3.10',
    cbamDestination: 'European Union (EU Annex I Declarant)',
  },
};

export const jurisdictionRoadmap = [
  { country: 'Ghana', code: 'GH', status: 'Active Operating HQ', active: true },
  { country: 'European Union', code: 'EU', status: 'Primary CBAM Market', active: true },
  { country: 'India', code: 'IN', status: 'Secondary Supply Chain', active: false },
  { country: 'United Kingdom', code: 'UK', status: 'UK CBAM 2027 Alignment', active: false },
];

export const OrgLocalisationTab: React.FC = () => {
  const [config, setConfig] = useState<LocalisationConfig>(initialLocalisation);
  const [isConfigOpen, setIsCreateOpen] = useState(false);
  const [draftConfig, setDraftConfig] = useState<LocalisationConfig>(initialLocalisation);
  const [savedToast, setSavedToast] = useState(false);

  useEffect(() => {
    getOrgLocalisation()
      .then((data) => {
        if (data && data.country) {
          const merged: LocalisationConfig = {
            ...initialLocalisation,
            ...data,
            units: { ...initialLocalisation.units, ...(data.units || {}) },
            regulatory: { ...initialLocalisation.regulatory, ...(data.regulatory || {}) },
          };
          setConfig(merged);
          setDraftConfig(merged);
        }
      })
      .catch((err) => console.warn('Failed to fetch localisation from backend:', err));
  }, []);

  const handleApplyPreset = (preset: 'Ghana' | 'India' | 'EU' | 'UK') => {
    if (preset === 'Ghana') {
      setDraftConfig(initialLocalisation);
    } else if (preset === 'India') {
      setDraftConfig({
        country: 'India (IN)',
        currency: 'INR (₹) / EUR (€)',
        timezone: 'IST (UTC+5:30)',
        language: 'English (IN)',
        units: { energy: 'kWh', fuel: 'Litres', mass: 'Metric Tonnes', emissions: 'tCO₂e' },
        regulatory: {
          gridRegion: 'CEA India National Grid Factor 2025',
          efDataset: 'IPCC AR6 / Ecoinvent',
          cbamDestination: 'European Union (EU CBAM)',
        },
      });
    } else if (preset === 'EU') {
      setDraftConfig({
        country: 'Germany / EU',
        currency: 'EUR (€)',
        timezone: 'CET (UTC+1)',
        language: 'English (EU)',
        units: { energy: 'MWh', fuel: 'Cubic Meters (m³)', mass: 'Metric Tonnes', emissions: 'tCO₂e' },
        regulatory: {
          gridRegion: 'EU ENTSO-E Grid Average',
          efDataset: 'EU CBAM Default Values Reg 2023/1773',
          cbamDestination: 'European Union',
        },
      });
    }
  };

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await saveOrgLocalisation(draftConfig);
    } catch (err) {
      console.warn('Backend save localisation failed, saving locally:', err);
    }
    setConfig(draftConfig);
    setIsCreateOpen(false);
    setSavedToast(true);
    setTimeout(() => setSavedToast(false), 4000);
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {savedToast && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-4 rounded-xl flex items-center justify-between text-xs font-semibold shadow-xs">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Localisation and regulatory settings updated!</span>
          </div>
          <button onClick={() => setSavedToast(false)} className="text-emerald-600">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Jurisdiction Roadmap Strip */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-[10px] font-mono font-bold uppercase text-emerald-800 tracking-wider">Multi-Jurisdiction Alignment</span>
            <h3 className="text-base font-bold text-slate-900">Regional Compliance & Export Roadmap</h3>
          </div>
          <button
            onClick={() => {
              setDraftConfig({ ...config });
              setIsCreateOpen(true);
            }}
            className="px-4 py-2 bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs rounded-xl shadow-xs transition-colors"
          >
            Configure Localisation
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          {jurisdictionRoadmap.map((j) => (
            <div
              key={j.country}
              className={`p-4 rounded-xl border transition-all ${
                j.active ? 'bg-emerald-50/50 border-emerald-200' : 'bg-slate-50 border-slate-200 opacity-75'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="font-bold text-slate-900 text-xs">{j.country} ({j.code})</span>
                {j.active ? (
                  <span className="bg-emerald-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded">ACTIVE</span>
                ) : (
                  <span className="bg-slate-200 text-slate-600 text-[9px] font-bold px-1.5 py-0.5 rounded">ROADMAP</span>
                )}
              </div>
              <span className="text-[11px] text-slate-500 font-medium block">{j.status}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Main Settings Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Regional Settings */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-5">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-50 text-emerald-800 rounded-xl">
              <Globe className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Regional Profile</h3>
              <p className="text-xs text-slate-500">Legal jurisdiction & currency defaults</p>
            </div>
          </div>

          <div className="space-y-3 text-xs">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
              <span className="text-[10px] font-mono text-slate-400 block uppercase">Primary Operating Country</span>
              <span className="font-bold text-slate-900 block mt-0.5">{config.country}</span>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
              <span className="text-[10px] font-mono text-slate-400 block uppercase">Reporting Currency</span>
              <span className="font-bold text-slate-900 block mt-0.5">{config.currency}</span>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
              <span className="text-[10px] font-mono text-slate-400 block uppercase">System Timezone</span>
              <span className="font-mono font-bold text-slate-900 block mt-0.5">{config.timezone}</span>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
              <span className="text-[10px] font-mono text-slate-400 block uppercase">Default Language</span>
              <span className="font-bold text-slate-900 block mt-0.5">{config.language}</span>
            </div>
          </div>
        </div>

        {/* Standard Units Configuration */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-5">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-50 text-emerald-800 rounded-xl">
              <Scale className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Unit Conversions</h3>
              <p className="text-xs text-slate-500">Standardized physical units</p>
            </div>
          </div>

          <div className="space-y-3 text-xs">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between">
              <span className="text-slate-500 font-medium">Electricity & Energy</span>
              <span className="font-mono font-bold text-slate-900">{config.units?.energy || 'kWh'}</span>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between">
              <span className="text-slate-500 font-medium">Fuel & Liquids</span>
              <span className="font-mono font-bold text-slate-900">{config.units?.fuel || 'Litres'}</span>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between">
              <span className="text-slate-500 font-medium">Mass & Production</span>
              <span className="font-mono font-bold text-slate-900">{config.units?.mass || 'Tonnes'}</span>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between">
              <span className="text-slate-500 font-medium">GHG Emissions</span>
              <span className="font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                {config.units?.emissions || 'tCO₂e'}
              </span>
            </div>
          </div>
        </div>

        {/* Regulatory Frameworks */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-5">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-50 text-emerald-800 rounded-xl">
              <FileCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Regulatory Datasets</h3>
              <p className="text-xs text-slate-500">Grid factors & default factors</p>
            </div>
          </div>

          <div className="space-y-3 text-xs">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
              <span className="text-[10px] font-mono text-slate-400 block uppercase">Grid Emission Factor Region</span>
              <span className="font-bold text-slate-900 block">{config.regulatory?.gridRegion || 'Standard Grid'}</span>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
              <span className="text-[10px] font-mono text-slate-400 block uppercase">Emission Factor Database</span>
              <span className="font-bold text-slate-900 block">{config.regulatory?.efDataset || 'IPCC AR6'}</span>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
              <span className="text-[10px] font-mono text-slate-400 block uppercase">CBAM Destination Framework</span>
              <span className="font-bold text-emerald-800 block">{config.regulatory?.cbamDestination || 'European Union'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Configure Modal */}
      {isConfigOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
            <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <h3 className="font-bold text-slate-900 text-sm">Configure Localisation & Regulatory Presets</h3>
              <button onClick={() => setIsCreateOpen(false)} className="p-1 text-slate-400 hover:text-slate-600 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveConfig} className="p-5 space-y-4 text-xs">
              <div>
                <span className="font-bold text-slate-700 block mb-2">Apply Regional Preset</span>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => handleApplyPreset('Ghana')}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-emerald-50 text-slate-800 font-bold rounded-lg border border-slate-200"
                  >
                    Ghana (Default)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleApplyPreset('EU')}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-emerald-50 text-slate-800 font-bold rounded-lg border border-slate-200"
                  >
                    European Union
                  </button>
                  <button
                    type="button"
                    onClick={() => handleApplyPreset('India')}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-emerald-50 text-slate-800 font-bold rounded-lg border border-slate-200"
                  >
                    India
                  </button>
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Primary Operating Country</label>
                <input
                  type="text"
                  value={draftConfig.country}
                  onChange={(e) => setDraftConfig({ ...draftConfig, country: e.target.value })}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-emerald-600"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Reporting Currency</label>
                <input
                  type="text"
                  value={draftConfig.currency}
                  onChange={(e) => setDraftConfig({ ...draftConfig, currency: e.target.value })}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-emerald-600"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Grid Emission Factor Region</label>
                <input
                  type="text"
                  value={draftConfig.regulatory.gridRegion}
                  onChange={(e) =>
                    setDraftConfig({
                      ...draftConfig,
                      regulatory: { ...draftConfig.regulatory, gridRegion: e.target.value },
                    })
                  }
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-emerald-600"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-700 font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-800 hover:bg-emerald-900 text-white font-bold rounded-xl shadow-xs"
                >
                  Save Settings
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
