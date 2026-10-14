import React from 'react';
import { useNavigate } from 'react-router-dom';
import { X, ExternalLink, ShieldCheck, Database, Layers, ArrowRight } from 'lucide-react';

interface MenuHandoffDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  facility?: string;
  period?: string;
  batch?: string;
}

export const MenuHandoffDrawer: React.FC<MenuHandoffDrawerProps> = ({
  isOpen,
  onClose,
  facility = 'Tema Processing Plant (FAC-001)',
  period = 'September 2026 (FY 2026)',
  batch = 'Steel coil / BATCH-001',
}) => {
  const navigate = useNavigate();

  if (!isOpen) return null;

  const menuConnections = [
    {
      title: 'Home / Executive Dashboard',
      route: '/dashboard',
      tag: 'Executive Overview',
      summary: 'Source health, active data issues, and daily accepted records rollup.',
      context: 'Syncs current facility and period metrics to the main operational scorecard.',
    },
    {
      title: 'Organisation & Settings',
      route: '/organisation',
      tag: 'Master Data',
      summary: 'Resolve unmapped facility codes, boundary definitions, meter tags, and process IDs.',
      context: 'Maps incoming PlantCode and MeterID directly to certified organization entities.',
    },
    {
      title: 'Carbon Accounting (GHG Protocol)',
      route: '/carbon-accounting',
      tag: 'Scope 1, 2 & 3',
      summary: 'Aggregates validated activity inventories into corporate-level emissions ledgers.',
      context: 'Requires explicit confirmation before applying emission factors to raw records.',
    },
    {
      title: 'Value Chain Network',
      route: '/value-chain',
      tag: 'Supplier Ingestion',
      summary: 'Links incoming supplier PCF declarations, raw material receipts, and logistics lots.',
      context: 'Associates SupplierID and MaterialCode with supplier declarations in the portal.',
    },
    {
      title: 'Product Carbon Footprint (PCF)',
      route: '/pcf',
      tag: 'Product Allocation',
      summary: 'Allocates validated sub-meter energy and raw material lots to specific production batches.',
      context: 'Feeds batch allocation rules directly for BATCH-001 steel coil calculation.',
    },
    {
      title: 'CBAM Compliance Engine',
      route: '/cbam',
      tag: 'Regulatory EU',
      summary: 'Calculates direct installation emissions and precursor embedded emissions per EU regulation.',
      context: 'Applies verified production data to EU CBAM communication templates.',
    },
    {
      title: 'MRV & Verification Workspace',
      route: '/mrv',
      tag: 'Auditor Workpapers',
      summary: 'Auditors inspect frozen ingestion snapshots, primary evidence references, and resolution history.',
      context: 'Data exceptions must be cleared or formally approved before verifier sign-off.',
    },
    {
      title: 'Carbon Passports',
      route: '/passport',
      tag: 'Digital Credentials',
      summary: 'Gateways for readiness check, preview, cryptographic signing, registry, and QR verification.',
      context: 'Changes to ingested data generate new revisions without altering issued snapshots.',
    },
    {
      title: 'Trace Carbon Lineage',
      route: '/trace',
      tag: 'End-to-End Lineage',
      summary: 'Interactive graph tracing raw telemetry/ERP records through to the final passport hash.',
      context: 'Inspect the complete immutable provenance chain from sensor to public credential.',
    },
    {
      title: 'Analytics & Insights',
      route: '/analytics',
      tag: 'Intelligence',
      summary: 'Multi-period trends, primary data share metrics, and emission intensity analytics.',
      context: 'Distinguishes between primary meter readings, supplier declarations, and secondary estimates.',
    },
  ];

  const handleNavigate = (path: string) => {
    onClose();
    navigate(path);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-xl bg-white shadow-2xl flex flex-col">
          {/* Header */}
          <div className="px-6 py-5 bg-[#0C1322] text-white flex items-center justify-between border-b border-slate-800">
            <div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                <span className="text-[10px] font-mono tracking-widest text-emerald-400 uppercase font-bold">
                  PORTAL HANDOFF REFERENCE
                </span>
              </div>
              <h2 className="text-lg font-black text-white tracking-tight mt-1">
                Internal Menu Connections
              </h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Active Context Banner */}
          <div className="px-6 py-3.5 bg-slate-50 border-b border-slate-200 text-xs flex flex-wrap items-center gap-x-4 gap-y-1">
            <span className="font-semibold text-slate-500">Active Pipeline Context:</span>
            <span className="font-mono text-emerald-800 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200/60">
              {facility}
            </span>
            <span className="font-mono text-slate-700 bg-slate-200/60 px-2 py-0.5 rounded">
              {period}
            </span>
            <span className="font-mono text-slate-700 bg-slate-200/60 px-2 py-0.5 rounded">
              {batch}
            </span>
          </div>

          {/* Body Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            <div className="p-3.5 bg-sky-50/70 border border-sky-100 rounded-xl text-xs text-sky-800 leading-relaxed">
              <span className="font-bold">Context Preserving Links:</span> Data accepted in Integration Hub feeds downstream calculations while preserving tenant, facility, and audit provenance. Select any destination module below to transition with active context.
            </div>

            <div className="space-y-3">
              {menuConnections.map((item, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-xl border border-slate-200 hover:border-emerald-300 hover:shadow-sm transition-all bg-white group flex flex-col justify-between"
                >
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-sm text-slate-900 group-hover:text-emerald-800 transition-colors">
                          {item.title}
                        </h3>
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                          {item.tag}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 mt-1 font-medium">{item.summary}</p>
                    </div>
                  </div>

                  <div className="pt-2.5 mt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                    <span className="truncate pr-2 italic">{item.context}</span>
                    <button
                      onClick={() => handleNavigate(item.route)}
                      className="shrink-0 px-3 py-1 bg-emerald-50 hover:bg-emerald-600 text-emerald-800 hover:text-white font-bold rounded-lg transition-all flex items-center gap-1.5"
                    >
                      <span>Open</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
            <span className="text-xs text-slate-500 font-medium">Saurient Data Pipeline Architecture</span>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 rounded-xl text-xs font-bold transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
