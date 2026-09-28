import React from 'react';
import { FileCheck, ShieldCheck, Clock, Download } from 'lucide-react';
import type { CBAMProductData } from '../../../types/cbam';

interface MonitoringPlansViewProps {
  product: CBAMProductData;
}

export const MonitoringPlansView: React.FC<MonitoringPlansViewProps> = ({ product }) => {
  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-black text-slate-900 tracking-tight">Approved Monitoring Plan</h2>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Versioned monitoring methodology, emission factor sources, activity data streams and metering controls.
            </p>
          </div>
          <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-3 py-1 rounded-md tracking-wider">
            MON-001 PASSED
          </span>
        </div>

        {/* Monitoring Plan Details Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
            <span className="text-[10px] font-bold text-slate-400 block mb-1 uppercase tracking-wider">PLAN REFERENCE</span>
            <span className="font-bold text-slate-900 font-mono">MP-TEMA-2026-v2.1</span>
          </div>
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
            <span className="text-[10px] font-bold text-slate-400 block mb-1 uppercase tracking-wider">REPORTING PERIOD</span>
            <span className="font-bold text-slate-900">FY 2026 (1 Jan – 31 Dec)</span>
          </div>
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
            <span className="text-[10px] font-bold text-slate-400 block mb-1 uppercase tracking-wider">METHODOLOGY</span>
            <span className="font-bold text-slate-900">Calculation-based (Standard)</span>
          </div>
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
            <span className="text-[10px] font-bold text-slate-400 block mb-1 uppercase tracking-wider">APPROVAL STATUS</span>
            <span className="font-bold text-emerald-700">Approved by Competent Authority</span>
          </div>
        </div>

        {/* Monitoring Streams Table */}
        <div className="space-y-3 pt-2">
          <h3 className="font-bold text-xs text-slate-900 uppercase tracking-wider">Monitored Source Streams</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  <th className="pb-3 pr-4">STREAM ID</th>
                  <th className="pb-3 px-4">STREAM TYPE</th>
                  <th className="pb-3 px-4">ACTIVITY SOURCE</th>
                  <th className="pb-3 px-4">METER / INVOICE REF</th>
                  <th className="pb-3 px-4">EMISSION FACTOR DATASET</th>
                  <th className="pb-3 pl-4">STATUS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                <tr>
                  <td className="py-3.5 pr-4 font-mono font-bold text-slate-900">STR-001</td>
                  <td className="py-3.5 px-4 font-semibold text-slate-800">Natural Gas Combustion</td>
                  <td className="py-3.5 px-4 text-slate-600">Reheating Furnace</td>
                  <td className="py-3.5 px-4 font-mono text-slate-600">MTR-TEMA-G04</td>
                  <td className="py-3.5 px-4 text-slate-600">IPCC 2006 Guidelines (v2026.1)</td>
                  <td className="py-3.5 pl-4">
                    <span className="bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded text-[10px]">VERIFIED</span>
                  </td>
                </tr>
                <tr>
                  <td className="py-3.5 pr-4 font-mono font-bold text-slate-900">STR-002</td>
                  <td className="py-3.5 px-4 font-semibold text-slate-800">Grid Electricity</td>
                  <td className="py-3.5 px-4 text-slate-600">EAF Melt Shop</td>
                  <td className="py-3.5 px-4 font-mono text-slate-600">MTR-TEMA-E01</td>
                  <td className="py-3.5 px-4 text-slate-600">Ghana National Grid Factor (0.421 tCO₂/MWh)</td>
                  <td className="py-3.5 pl-4">
                    <span className="bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded text-[10px]">VERIFIED</span>
                  </td>
                </tr>
                <tr>
                  <td className="py-3.5 pr-4 font-mono font-bold text-slate-900">STR-003</td>
                  <td className="py-3.5 px-4 font-semibold text-slate-800">Carbon Electrodes</td>
                  <td className="py-3.5 px-4 text-slate-600">Anode Consumption</td>
                  <td className="py-3.5 px-4 font-mono text-slate-600">Weighbridge ERP Batch</td>
                  <td className="py-3.5 px-4 text-slate-600">Supplier Quality Spec v1.4</td>
                  <td className="py-3.5 pl-4">
                    <span className="bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded text-[10px]">VERIFIED</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
