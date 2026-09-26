import React, { useState } from 'react';
import { SimpleWordsCard } from '../common/SimpleWordsCard';
import { createProduct, DEFAULT_TENANT_ID } from '../../api/client';
import { Building, Factory, Leaf, Package, FileText, CheckCircle2, AlertCircle, Radio, Code2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const ProductSetup: React.FC = () => {
  const navigate = useNavigate();

  // Form states with fresh default batch ID generator
  const [commodity, setCommodity] = useState('Cocoa');
  const [productName, setProductName] = useState('Fermented Cocoa Beans');
  const [facility, setFacility] = useState('Tema Processing Plant');
  const [batchId, setBatchId] = useState(`CB-2026-${Math.floor(1000 + Math.random() * 9000)}`);
  const [supplier, setSupplier] = useState('Asunafo Farmers Cooperative');
  const [bom, setBom] = useState('Cocoa beans (raw), water, packaging');
  const [packaging, setPackaging] = useState('60 kg jute bags');
  const [unitOfMeasure, setUnitOfMeasure] = useState('kg');
  const [batchQuantity, setBatchQuantity] = useState<number>(1000);
  const [exportMarket, setExportMarket] = useState('European Union (EU)');

  // Activity telemetry input states
  const [fuelLiters, setFuelLiters] = useState<number>(150);
  const [elecKwh, setElecKwh] = useState<number>(1200);

  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [apiResponseJson, setApiResponseJson] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setSuccessMsg('');
    setErrorMsg('');
    setApiResponseJson(null);

    try {
      const resp = await createProduct({
        tenant_id: DEFAULT_TENANT_ID,
        facility_id: facility,
        batch_id: batchId,
        product_name: productName,
        commodity_type: commodity,
        batch_data: {
          product_name: productName,
          commodity,
          batch_id: batchId,
          facility_name: facility,
          facility_location: 'Tema, Greater Accra, Ghana',
          batch_size_quantity: Number(batchQuantity),
          unit_of_measure: unitOfMeasure,
          export_market: exportMarket,
        },
        activity_data: {
          scope_1_direct: { fuel_consumed_liters: Number(fuelLiters) },
          scope_2_indirect: { electricity_consumed_kwh: Number(elecKwh) },
          scope_3_upstream: { bill_of_materials: [{ name: bom, quantity: Number(batchQuantity) }] },
        },
      });

      setApiResponseJson(JSON.stringify(resp, null, 2));
      setSuccessMsg(`Product CR registered in Kubernetes: ${resp.name} (Status: ${resp.status})`);
      
      if (resp.passport_id) {
        setTimeout(() => {
          navigate(`/passport/${resp.passport_id}`);
        }, 2000);
      }
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Failed to create product batch on backend gateway');
    } fontFinally: {
      setSubmitting(false);
    }
  };

  const simpleWordsPoints = [
    { step: 1, text: 'This form submits a POST /api/v1/products call to the Go backend.' },
    { step: 2, text: 'Registers a new Product Custom Resource (CR) in Kubernetes.' },
    { step: 3, text: 'CEL rulebook calculates Scope 1-3 emissions and generates a Carbon Passport.' },
  ];

  const workflowSteps = [
    { name: 'Company', desc: 'Your organization', icon: Building, color: 'bg-blue-100 text-blue-700' },
    { name: 'Facility', desc: 'Production site', icon: Factory, color: 'bg-blue-100 text-blue-700' },
    { name: 'Commodity', desc: 'Export commodity', icon: Leaf, color: 'bg-emerald-500 text-white' },
    { name: 'Product', desc: 'Specific product', icon: Package, color: 'bg-emerald-500 text-white' },
    { name: 'Batch', desc: 'Production batch/lot', icon: FileText, color: 'bg-emerald-700 text-white' },
  ];

  return (
    <div className="space-y-6">
      {/* Top API Integration Bar */}
      <div className="bg-slate-900 text-white p-4 rounded-2xl shadow-md border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
            <Radio className="w-5 h-5 text-emerald-400 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm text-white">Saurient Go REST API Gateway</span>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                POST /api/v1/products
              </span>
            </div>
            <p className="text-xs text-slate-400 font-mono">
              Creates Kubernetes Product CR & Triggers CarbonPassportReconciler Pipeline
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400 font-mono">Tenant: <span className="text-sky-300">{DEFAULT_TENANT_ID}</span></span>
        </div>
      </div>

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Commodity & Product Setup</h1>
        <p className="text-slate-500 text-sm">Register export commodity batches with industrial activity telemetry</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left Export Templates Sidebar */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Ghana Export Commodities</p>
          <p className="text-xs text-slate-500">Pre-configured templates for key export sectors</p>

          <div className="space-y-3 pt-2">
            {[
              { name: 'Cocoa', desc: 'Beans, cocoa butter, cocoa powder, chocolate', icon: '🍫', active: commodity === 'Cocoa' },
              { name: 'Cashew', desc: 'Raw cashew nuts, processed kernels', icon: '🥜', active: commodity === 'Cashew' },
              { name: 'Textiles', desc: 'Cotton, woven fabrics, apparel (Made in Ghana)', icon: '👕', active: commodity === 'Textiles' },
              { name: 'Processed Foods', desc: 'Pineapple, mango, shea products, fruit juices', icon: '🥫', active: commodity === 'Processed Foods' },
              { name: 'Metals', desc: 'Gold, bauxite, manganese, processed minerals', icon: '🪨', active: commodity === 'Metals' },
            ].map((item, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  setCommodity(item.name);
                  if (item.name === 'Cocoa') setProductName('Fermented Cocoa Beans');
                  else if (item.name === 'Cashew') setProductName('Raw Processed Cashew Nuts');
                  else if (item.name === 'Textiles') setProductName('Organic Cotton Fabric');
                  else if (item.name === 'Processed Foods') setProductName('Shea Butter Granules');
                  else if (item.name === 'Metals') setProductName('Low-Carbon Aluminium Ingot');
                }}
                className={`w-full text-left p-3 rounded-xl border transition-all flex items-start gap-3 ${
                  item.active
                    ? 'border-emerald-500 bg-emerald-50/50 shadow-sm'
                    : 'border-slate-100 hover:border-slate-200 hover:bg-slate-50'
                }`}
              >
                <span className="text-2xl">{item.icon}</span>
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">{item.name}</h4>
                  <p className="text-xs text-slate-500 leading-tight">{item.desc}</p>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Main Form Area */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-slate-900 mb-0.5">Register Product Batch</h2>
              <p className="text-xs text-slate-500">Submits live data to POST /api/v1/products endpoint</p>
            </div>
          </div>

          {successMsg && (
            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm space-y-2">
              <div className="flex items-center gap-2 font-bold">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                <span>{successMsg}</span>
              </div>
              <p className="text-xs text-emerald-700">Redirecting to Digital Carbon Passport screen...</p>
              {apiResponseJson && (
                <pre className="bg-slate-900 text-emerald-300 p-3 rounded-lg text-[10px] font-mono overflow-x-auto max-h-40 border border-slate-800">
                  {apiResponseJson}
                </pre>
              )}
            </div>
          )}

          {errorMsg && (
            <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-sm flex items-center gap-2 font-semibold">
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Commodity *</label>
                <select
                  value={commodity}
                  onChange={(e) => setCommodity(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="Cocoa">Cocoa</option>
                  <option value="Cashew">Cashew</option>
                  <option value="Textiles">Textiles & Apparel</option>
                  <option value="Processed Foods">Processed Foods</option>
                  <option value="Metals">Metals & Minerals</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Product Name *</label>
                <input
                  type="text"
                  value={productName}
                  onChange={(e) => setProductName(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Plant / Facility *</label>
                <select
                  value={facility}
                  onChange={(e) => setFacility(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="Tema Processing Plant">Tema Processing Plant</option>
                  <option value="Kumasi Milling Unit">Kumasi Milling Unit</option>
                  <option value="Takoradi Export Hub">Takoradi Export Hub</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Batch / Lot Number *</label>
                <input
                  type="text"
                  value={batchId}
                  onChange={(e) => setBatchId(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Supplier Organization *</label>
              <input
                type="text"
                value={supplier}
                onChange={(e) => setSupplier(e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Batch Size Quantity *</label>
                <input
                  type="number"
                  value={batchQuantity}
                  onChange={(e) => setBatchQuantity(Number(e.target.value))}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Unit of Measure *</label>
                <select
                  value={unitOfMeasure}
                  onChange={(e) => setUnitOfMeasure(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="kg">kg</option>
                  <option value="Metric Tons">Metric Tons</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Export Market *</label>
                <select
                  value={exportMarket}
                  onChange={(e) => setExportMarket(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="European Union (EU)">European Union (EU)</option>
                  <option value="North America (USA/Canada)">North America (USA/Canada)</option>
                  <option value="Asia Pacific">Asia Pacific</option>
                </select>
              </div>
            </div>

            {/* Industrial Telemetry Inputs */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
              <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <Radio className="w-4 h-4 text-emerald-600" />
                Industrial Activity Telemetry Inputs (for CEL Engine)
              </span>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="block text-slate-600 mb-1">Scope 1: Diesel / On-Site Fuel (Liters)</label>
                  <input
                    type="number"
                    value={fuelLiters}
                    onChange={(e) => setFuelLiters(Number(e.target.value))}
                    className="w-full rounded-lg border border-slate-200 px-3 py-1.5 text-xs bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 mb-1">Scope 2: Grid Electricity Consumed (kWh)</label>
                  <input
                    type="number"
                    value={elecKwh}
                    onChange={(e) => setElecKwh(Number(e.target.value))}
                    className="w-full rounded-lg border border-slate-200 px-3 py-1.5 text-xs bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => navigate('/passport')}
                className="px-4 py-2 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm rounded-xl shadow-sm transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {submitting ? 'Calling POST /api/v1/products...' : 'Save & Register Product'}
              </button>
            </div>
          </form>
        </div>

        {/* Workflow & Explanatory Side Panel */}
        <div className="space-y-6">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="font-bold text-slate-900 text-sm">Product Setup Workflow</h3>
            <p className="text-xs text-slate-500">From company to batch in five simple steps</p>

            <div className="flex items-center justify-between pt-2">
              {workflowSteps.map((step, idx) => {
                const Icon = step.icon;
                return (
                  <React.Fragment key={idx}>
                    <div className="flex flex-col items-center text-center">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step.color} shadow-sm mb-1`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <span className="text-[11px] font-semibold text-slate-900">{step.name}</span>
                    </div>
                    {idx < workflowSteps.length - 1 && (
                      <span className="text-slate-300 font-bold text-xs">→</span>
                    )}
                  </React.Fragment>
                );
              })}
            </div>
          </div>

          <SimpleWordsCard
            points={simpleWordsPoints}
            extraCard={
              <div className="bg-slate-900 text-white rounded-2xl p-5 shadow-sm space-y-3">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">🇬🇭</span>
                  <h4 className="font-bold text-sm">Same platform, different commodity templates.</h4>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Whether it&apos;s cocoa for Europe, cashew for global markets, textiles for sustainable fashion, processed foods, or minerals, Saurient adapts to your product.
                </p>
              </div>
            }
          />
        </div>
      </div>
    </div>
  );
};
