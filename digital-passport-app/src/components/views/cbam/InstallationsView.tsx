import React from 'react';
import { Building2, MapPin, Gauge, ShieldCheck, Check } from 'lucide-react';
import type { CBAMProductData } from '../../../types/cbam';

interface InstallationsViewProps {
  product: CBAMProductData;
}

export const InstallationsView: React.FC<InstallationsViewProps> = ({ product }) => {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2/3: Installation Profile & System Boundary */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-black text-slate-900 tracking-tight">Installation Profile & Production Routes</h2>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Operator credentials, physical boundaries, production routes and process metering.
              </p>
            </div>
            <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2.5 py-0.5 rounded tracking-wider">
              OPERATOR VALIDATED
            </span>
          </div>

          {/* 3x3 Installation Fields */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-[10px] font-bold text-slate-400 block mb-1 uppercase tracking-wider">INSTALLATION NAME</span>
              <span className="font-bold text-slate-900">{product.installationName}</span>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-[10px] font-bold text-slate-400 block mb-1 uppercase tracking-wider">OPERATOR LEGAL ENTITY</span>
              <span className="font-bold text-slate-900">{product.installationOperator}</span>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-[10px] font-bold text-slate-400 block mb-1 uppercase tracking-wider">COUNTRY & LOCATION</span>
              <span className="font-bold text-slate-900">{product.countryOfProduction} (5.6037° N, 0.0166° W)</span>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-[10px] font-bold text-slate-400 block mb-1 uppercase tracking-wider">SECTOR ROUTE</span>
              <span className="font-bold text-slate-900">EAF-Scrap / Electric Arc Process</span>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-[10px] font-bold text-slate-400 block mb-1 uppercase tracking-wider">PERMIT / PERM REF</span>
              <span className="font-bold text-slate-900 font-mono">EPA-GH-TEMA-2026-081</span>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-[10px] font-bold text-slate-400 block mb-1 uppercase tracking-wider">MONITORING PLAN STATUS</span>
              <span className="font-bold text-emerald-700">APPROVED VERSION v2.1</span>
            </div>
          </div>

          {/* System Boundary Diagram */}
          <div className="space-y-3 pt-2">
            <h3 className="font-bold text-xs text-slate-900 uppercase tracking-wider">System Boundary & Operations Covered</h3>
            <div className="p-5 bg-slate-900 text-white rounded-2xl space-y-4">
              <div className="flex items-center justify-between text-xs border-b border-slate-800 pb-3">
                <span className="font-bold text-[#00E599]">CBAM DEFINITIVE BOUNDARY DIAGRAM</span>
                <span className="text-slate-400 font-mono">SECTOR: {product.sector.toUpperCase()}</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-center text-xs">
                <div className="p-3 bg-slate-800/80 rounded-xl border border-emerald-500/30">
                  <span className="text-[10px] font-bold text-slate-400 block uppercase">PRECURSORS</span>
                  <span className="font-bold text-white text-xs mt-1 block">Iron Ore Pellets / Direct Reduced Iron</span>
                </div>
                <div className="p-3 bg-slate-800/80 rounded-xl border border-emerald-500/30">
                  <span className="text-[10px] font-bold text-slate-400 block uppercase">DIRECT PROCESS</span>
                  <span className="font-bold text-white text-xs mt-1 block">EAF Melting & Refining</span>
                </div>
                <div className="p-3 bg-slate-800/80 rounded-xl border border-emerald-500/30">
                  <span className="text-[10px] font-bold text-slate-400 block uppercase">INDIRECT ENERGY</span>
                  <span className="font-bold text-white text-xs mt-1 block">Smelter Electricity (Supporting)</span>
                </div>
                <div className="p-3 bg-slate-800/80 rounded-xl border border-rose-500/30">
                  <span className="text-[10px] font-bold text-slate-400 block uppercase">EXCLUDED</span>
                  <span className="font-bold text-slate-400 text-xs mt-1 block">Cutting, Welding, Machining</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right 1/3: Meter & Equipment Verification */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
          <h3 className="font-bold text-slate-900 text-sm">Meters & Quality Control</h3>

          <div className="space-y-3 text-xs">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between">
              <div>
                <h4 className="font-bold text-slate-900">Main Electricity Meter</h4>
                <p className="text-[10px] font-mono text-slate-400">MTR-TEMA-E01 · Calibrated</p>
              </div>
              <span className="bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded text-[10px]">PASSED</span>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between">
              <div>
                <h4 className="font-bold text-slate-900">Natural Gas Flow Meter</h4>
                <p className="text-[10px] font-mono text-slate-400">MTR-TEMA-G04 · Calibrated</p>
              </div>
              <span className="bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded text-[10px]">PASSED</span>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between">
              <div>
                <h4 className="font-bold text-slate-900">Output Weighbridge</h4>
                <p className="text-[10px] font-mono text-slate-400">WB-TEMA-02 · Verified</p>
              </div>
              <span className="bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded text-[10px]">PASSED</span>
            </div>
          </div>

          <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-xl text-xs text-emerald-900 font-semibold space-y-1">
            <h4>Installation Readiness Gate</h4>
            <p className="text-[11px] text-emerald-700">
              Installation identity, operator, coordinates and metering records pass mandatory rule INS-001.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
