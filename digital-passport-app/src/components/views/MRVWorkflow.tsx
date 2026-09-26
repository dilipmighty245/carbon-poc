import React from 'react';
import { SimpleWordsCard } from '../common/SimpleWordsCard';
import { Radio, FileSpreadsheet, CheckCircle2, ShieldAlert, FileText, ArrowRight, Clock } from 'lucide-react';

export const MRVWorkflow: React.FC = () => {
  const simpleWordsPoints = [
    { step: 1, text: 'Measure means collecting the real-world operational and energy telemetry data.' },
    { step: 2, text: 'Report means organizing data into standardized product batch records.' },
    { step: 3, text: 'Verify means checking that every carbon calculation is supported by third-party evidence.' },
  ];

  const recentDocs = [
    { name: 'Fuel_invoices_Jan2024.pdf', time: '2 days ago', size: '1.2 MB' },
    { name: 'Energy_meter_telemetry.csv', time: '3 days ago', size: '4.8 MB' },
    { name: 'Production_manifest_batch_001.xlsx', time: '5 days ago', size: '850 KB' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">MRV Workflow – Measure, Report, Verify</h1>
        <p className="text-slate-500 text-sm">The trust process behind every Digital Carbon Passport</p>
      </div>

      {/* 3-Step Process Header */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Step 1: Measure */}
        <div className="bg-white p-5 rounded-2xl border border-emerald-200 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="w-8 h-8 rounded-full bg-emerald-500 text-white font-bold text-sm flex items-center justify-center">1</span>
              <h3 className="font-bold text-lg text-slate-900">Measure</h3>
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-md">Collect Data</span>
          </div>
          <p className="text-xs text-slate-500 mb-4">IoT sensors, energy meters, fuel invoices & supplier declarations</p>
          <div className="grid grid-cols-3 gap-2 text-center text-xs">
            <div className="bg-slate-50 p-2 rounded-xl border border-slate-100 flex flex-col items-center">
              <Radio className="w-5 h-5 text-emerald-600 mb-1" />
              <span className="font-medium text-slate-700 text-[11px]">Telemetry</span>
            </div>
            <div className="bg-slate-50 p-2 rounded-xl border border-slate-100 flex flex-col items-center">
              <FileSpreadsheet className="w-5 h-5 text-emerald-600 mb-1" />
              <span className="font-medium text-slate-700 text-[11px]">Meters</span>
            </div>
            <div className="bg-slate-50 p-2 rounded-xl border border-slate-100 flex flex-col items-center">
              <FileText className="w-5 h-5 text-emerald-600 mb-1" />
              <span className="font-medium text-slate-700 text-[11px]">Invoices</span>
            </div>
          </div>
        </div>

        {/* Step 2: Report */}
        <div className="bg-white p-5 rounded-2xl border border-blue-200 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="w-8 h-8 rounded-full bg-blue-600 text-white font-bold text-sm flex items-center justify-center">2</span>
              <h3 className="font-bold text-lg text-slate-900">Report</h3>
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-2.5 py-1 rounded-md">Consolidate</span>
          </div>
          <p className="text-xs text-slate-500 mb-4">Organize batch inputs into GHG & PCF accounting formulas</p>
          <div className="grid grid-cols-2 gap-2 text-center text-xs">
            <div className="bg-slate-50 p-2 rounded-xl border border-slate-100 flex flex-col items-center">
              <span className="font-bold text-blue-600 text-sm">v3.2</span>
              <span className="font-medium text-slate-700 text-[11px]">CEL DAG Engine</span>
            </div>
            <div className="bg-slate-50 p-2 rounded-xl border border-slate-100 flex flex-col items-center">
              <span className="font-bold text-blue-600 text-sm">94.2%</span>
              <span className="font-medium text-slate-700 text-[11px]">Completeness</span>
            </div>
          </div>
        </div>

        {/* Step 3: Verify */}
        <div className="bg-white p-5 rounded-2xl border border-indigo-200 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="w-8 h-8 rounded-full bg-indigo-600 text-white font-bold text-sm flex items-center justify-center">3</span>
              <h3 className="font-bold text-lg text-slate-900">Verify</h3>
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-md">Audit & Issue</span>
          </div>
          <p className="text-xs text-slate-500 mb-4">Auditor approval, SHA-256 integrity hash & passport issuance</p>
          <div className="grid grid-cols-2 gap-2 text-center text-xs">
            <div className="bg-slate-50 p-2 rounded-xl border border-slate-100 flex flex-col items-center">
              <CheckCircle2 className="w-5 h-5 text-indigo-600 mb-1" />
              <span className="font-medium text-slate-700 text-[11px]">AMA Ghana Approved</span>
            </div>
            <div className="bg-slate-50 p-2 rounded-xl border border-slate-100 flex flex-col items-center">
              <ShieldAlert className="w-5 h-5 text-indigo-600 mb-1" />
              <span className="font-medium text-slate-700 text-[11px]">Immutable Proof</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3 space-y-6">
          {/* Active Batch Progress Card */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-100">
              <div>
                <div className="flex items-center gap-3">
                  <h3 className="font-bold text-xl text-slate-900">Batch GH-2024-001</h3>
                  <span className="bg-emerald-100 text-emerald-800 text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                    In Verification
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-1">Product: Cocoa Butter | Facility: Tema, Ghana | Period: Jan – Mar 2024</p>
              </div>

              <button className="px-4 py-2 bg-slate-900 text-white rounded-xl font-semibold text-sm hover:bg-slate-800 transition-colors flex items-center gap-2">
                <span>View Full Audit Vault</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            {/* Progress Timeline */}
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Verification Pipeline</p>
              <div className="relative flex items-center justify-between">
                <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-1 bg-slate-100 z-0"></div>
                <div className="absolute left-0 w-3/4 top-1/2 -translate-y-1/2 h-1 bg-emerald-500 z-0 transition-all"></div>

                {[
                  { label: 'Data collected', date: '12 Jan 2024, 10:24', done: true },
                  { label: 'Report submitted', date: '18 Jan 2024, 14:30', done: true },
                  { label: 'Under verification', date: 'In progress', active: true },
                  { label: 'Approved & Issued', date: 'Pending signature', pending: true },
                ].map((step, idx) => (
                  <div key={idx} className="relative z-10 flex flex-col items-center text-center bg-white px-2">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shadow-sm ${
                      step.done
                        ? 'bg-emerald-500 text-white'
                        : step.active
                        ? 'bg-blue-600 text-white ring-4 ring-blue-100'
                        : 'bg-slate-200 text-slate-500'
                    }`}>
                      {step.done ? '✓' : idx + 1}
                    </div>
                    <span className="text-xs font-bold text-slate-900 mt-2">{step.label}</span>
                    <span className="text-[10px] text-slate-500 mt-0.5">{step.date}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Recent Documents Table */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <h3 className="font-bold text-slate-900 text-base mb-1">Attached Verification Documents</h3>
            <p className="text-xs text-slate-500 mb-4">Evidence documents submitted for auditor review</p>

            <div className="space-y-3">
              {recentDocs.map((doc, idx) => (
                <div key={idx} className="flex items-center justify-between p-3.5 bg-slate-50/80 rounded-xl border border-slate-100 hover:bg-slate-100/80 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-slate-900 text-sm">{doc.name}</h4>
                      <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                        <Clock className="w-3.5 h-3.5" />
                        <span>Uploaded {doc.time}</span>
                        <span>•</span>
                        <span>{doc.size}</span>
                      </div>
                    </div>
                  </div>

                  <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100">
                    Verified
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Explanatory Side Panel */}
        <div className="space-y-6">
          <SimpleWordsCard points={simpleWordsPoints} />
        </div>
      </div>
    </div>
  );
};
