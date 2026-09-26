import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, Upload, ArrowRight } from 'lucide-react';

export const RegistrationView: React.FC = () => {
  const navigate = useNavigate();

  const steps = [
    { title: 'Account Owner', status: 'Complete' },
    { title: 'Legal Identity', status: 'Complete' },
    { title: 'Addresses & Tax', status: 'In progress', active: true },
    { title: 'Trade & Customs', status: 'Not started' },
    { title: 'Industry & Operations', status: 'Not started' },
    { title: 'Data Readiness', status: 'Not started' },
    { title: 'Contacts', status: 'Not started' },
    { title: 'Documents', status: 'Not started' },
    { title: 'Declarations', status: 'Not started' },
    { title: 'Review & Submit', status: 'Not started' },
  ];

  return (
    <div className="min-h-screen bg-slate-100 flex">
      {/* Left Stepper Sidebar */}
      <aside className="w-72 bg-slate-950 text-white p-6 space-y-6 hidden md:block shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-emerald-500 text-slate-950 font-bold flex items-center justify-center">S</div>
          <div>
            <h1 className="font-bold text-sm">SAURIENT</h1>
            <p className="text-[10px] text-slate-400">Company Registration</p>
          </div>
        </div>

        <p className="text-[11px] text-slate-400 font-mono">Application SAU-REG-260941 • Autosaved</p>

        <div className="space-y-3 pt-4">
          {steps.map((s, idx) => (
            <div key={idx} className="flex items-center gap-3 text-xs">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${
                s.status === 'Complete'
                  ? 'bg-emerald-500 text-slate-950'
                  : s.active
                  ? 'bg-blue-600 text-white ring-2 ring-blue-400'
                  : 'bg-slate-800 text-slate-500'
              }`}>
                {s.status === 'Complete' ? '✓' : idx + 1}
              </div>
              <div>
                <p className={`font-semibold ${s.active ? 'text-white' : s.status === 'Complete' ? 'text-emerald-400' : 'text-slate-400'}`}>{s.title}</p>
                <p className="text-[10px] text-slate-500">{s.status}</p>
              </div>
            </div>
          ))}
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 p-8 overflow-y-auto">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-slate-900">Addresses and tax profile</h2>
              <p className="text-xs text-slate-500">Step 3 of 10 • Required fields are marked *</p>
            </div>
            <span className="text-xs font-bold text-blue-600 bg-blue-50 px-3 py-1 rounded-full">62% COMPLETE</span>
          </div>

          {/* Form Card */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-6">
            <div className="flex border-b border-slate-200 gap-6 text-xs font-bold text-slate-500">
              <span className="text-emerald-600 border-b-2 border-emerald-500 pb-2">Registered Address</span>
              <span className="hover:text-slate-900 cursor-pointer">Operating Address</span>
              <span className="hover:text-slate-900 cursor-pointer">Billing Address</span>
              <span className="hover:text-slate-900 cursor-pointer">Tax & Identifiers</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-[11px] font-bold uppercase text-slate-500 mb-1">Address Line 1 *</label>
                <input type="text" defaultValue="14 Independence Avenue" className="w-full rounded-xl border border-slate-200 p-2.5 text-xs text-slate-900 bg-slate-50" />
              </div>
              <div>
                <label className="block text-[11px] font-bold uppercase text-slate-500 mb-1">Address Line 2</label>
                <input type="text" defaultValue="Industrial Area" className="w-full rounded-xl border border-slate-200 p-2.5 text-xs text-slate-900 bg-slate-50" />
              </div>
              <div>
                <label className="block text-[11px] font-bold uppercase text-slate-500 mb-1">City *</label>
                <input type="text" defaultValue="Tema" className="w-full rounded-xl border border-slate-200 p-2.5 text-xs text-slate-900 bg-slate-50" />
              </div>
              <div>
                <label className="block text-[11px] font-bold uppercase text-slate-500 mb-1">Region *</label>
                <input type="text" defaultValue="Greater Accra" className="w-full rounded-xl border border-slate-200 p-2.5 text-xs text-slate-900 bg-slate-50" />
              </div>
              <div>
                <label className="block text-[11px] font-bold uppercase text-slate-500 mb-1">Postal Code *</label>
                <input type="text" defaultValue="GT-020-4821" className="w-full rounded-xl border border-slate-200 p-2.5 text-xs text-slate-900 bg-slate-50" />
              </div>
              <div>
                <label className="block text-[11px] font-bold uppercase text-slate-500 mb-1">Country *</label>
                <input type="text" defaultValue="Ghana" className="w-full rounded-xl border border-slate-200 p-2.5 text-xs text-slate-900 bg-slate-50" />
              </div>
            </div>

            {/* Document Upload Area */}
            <div className="border-2 border-dashed border-slate-200 rounded-xl p-6 text-center text-xs text-slate-500 space-y-1 hover:bg-slate-50 cursor-pointer">
              <Upload className="w-6 h-6 text-slate-400 mx-auto mb-2" />
              <p className="font-semibold text-slate-700">Upload proof of registered-office address</p>
              <p className="text-[10px] text-slate-400">PDF, PNG, JPG up to 10MB</p>
            </div>

            <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-xl text-xs text-emerald-800 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Registration data is autosaved. System credentials are collected later in the Integration Hub.</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between">
            <button type="button" onClick={() => navigate('/login')} className="px-5 py-2.5 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50">
              ← Back
            </button>
            <div className="flex items-center gap-3">
              <button type="button" className="px-5 py-2.5 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50">
                Save draft
              </button>
              <button type="button" onClick={() => navigate('/dashboard')} className="px-6 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs rounded-xl shadow-sm">
                Continue →
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};
