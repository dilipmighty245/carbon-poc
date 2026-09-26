import React, { useState } from 'react';
import { SimpleWordsCard } from '../common/SimpleWordsCard';
import { Zap, Fuel, Users, Building, Truck, FileArchive, Upload, CheckCircle2, AlertCircle, Clock, Search } from 'lucide-react';

export const EvidenceVerification: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('All');

  const evidenceDocs = [
    { type: 'Electricity Bills', name: 'ECG_Bill_Jan2024.pdf', icon: Zap, color: 'text-amber-500 bg-amber-50', date: '12 Jan 2024', data: 'Electricity Use (1,250 kWh)', status: 'Approved' },
    { type: 'Fuel Invoices', name: 'Diesel_Invoice_0456.pdf', icon: Fuel, color: 'text-rose-500 bg-rose-50', date: '15 Jan 2024', data: 'Diesel Consumption (3,200 L)', status: 'Reviewed' },
    { type: 'Supplier Declarations', name: 'Limestone_Supplier_Doc.pdf', icon: Users, color: 'text-purple-500 bg-purple-50', date: '18 Jan 2024', data: 'Raw Materials (Limestone)', status: 'Pending' },
    { type: 'Production Records', name: 'Production_Log_Jan2024.pdf', icon: Building, color: 'text-emerald-500 bg-emerald-50', date: '20 Jan 2024', data: 'Clinker Production (500 tonnes)', status: 'Approved' },
    { type: 'Shipment / Logistics Records', name: 'Transport_Logistics.pdf', icon: Truck, color: 'text-sky-500 bg-sky-50', date: '22 Jan 2024', data: 'Product Transport (Accra -> Tema)', status: 'Need Clarification' },
    { type: 'Manual Evidence Files', name: 'Site_Photos.zip', icon: FileArchive, color: 'text-slate-500 bg-slate-50', date: '25 Jan 2024', data: 'Plant Operations', status: 'Reviewed' },
  ];

  const checklistItems = [
    { label: 'Document is readable and complete', checked: true },
    { label: 'Matches reported data', checked: true },
    { label: 'Covers the correct time period', checked: true },
    { label: 'From a credible source', checked: false },
    { label: 'No discrepancies', checked: false },
    { label: 'Additional information needed', checked: false },
  ];

  const simpleWordsPoints = [
    { step: 1, text: 'Every important number should have proof behind it.' },
    { step: 2, text: 'Reviewers can check documents and ask questions.' },
    { step: 3, text: 'Only verified data moves into the final passport.' },
  ];

  const filteredDocs = evidenceDocs.filter(doc => {
    const matchesSearch = doc.name.toLowerCase().includes(searchTerm.toLowerCase()) || doc.data.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = selectedStatus === 'All' || doc.status === selectedStatus;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Evidence & Verification Screen</h1>
          <p className="text-slate-500 text-sm">Supporting every carbon number with proof</p>
        </div>

        <button className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-sm rounded-xl shadow-sm transition-colors flex items-center gap-2">
          <Upload className="w-4 h-4" />
          <span>Upload Evidence</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Main Table Area */}
        <div className="lg:col-span-3 space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <h2 className="font-bold text-lg text-slate-900">Evidence Documents</h2>

              <div className="flex items-center gap-3">
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search documents..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9 pr-4 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 w-48"
                  />
                </div>

                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="All">All Statuses</option>
                  <option value="Approved">Approved</option>
                  <option value="Reviewed">Reviewed</option>
                  <option value="Pending">Pending</option>
                  <option value="Need Clarification">Need Clarification</option>
                </select>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-400 font-semibold uppercase bg-slate-50/50">
                    <th className="py-3 px-4">Document Type</th>
                    <th className="py-3 px-4">File Name</th>
                    <th className="py-3 px-4">Date Uploaded</th>
                    <th className="py-3 px-4">Related Data</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredDocs.map((doc, idx) => {
                    const Icon = doc.icon;
                    return (
                      <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3.5 px-4 font-semibold text-slate-900">
                          <div className="flex items-center gap-2">
                            <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${doc.color}`}>
                              <Icon className="w-4 h-4" />
                            </div>
                            <span>{doc.type}</span>
                          </div>
                        </td>
                        <td className="py-3.5 px-4 font-mono text-slate-700">{doc.name}</td>
                        <td className="py-3.5 px-4 text-slate-500">{doc.date}</td>
                        <td className="py-3.5 px-4 text-slate-700 font-medium">{doc.data}</td>
                        <td className="py-3.5 px-4">
                          <span className={`px-2.5 py-1 rounded-full text-[11px] font-semibold flex items-center gap-1 w-max ${
                            doc.status === 'Approved'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : doc.status === 'Reviewed'
                              ? 'bg-blue-50 text-blue-700 border border-blue-200'
                              : doc.status === 'Pending'
                              ? 'bg-amber-50 text-amber-700 border border-amber-200'
                              : 'bg-rose-50 text-rose-700 border border-rose-200'
                          }`}>
                            {doc.status === 'Approved' && <CheckCircle2 className="w-3 h-3" />}
                            {doc.status === 'Need Clarification' && <AlertCircle className="w-3 h-3" />}
                            {doc.status === 'Pending' && <Clock className="w-3 h-3" />}
                            {doc.status}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right font-bold text-slate-400 hover:text-slate-600 cursor-pointer">
                          •••
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Verification Timeline Footer */}
            <div className="pt-6 border-t border-slate-100">
              <h3 className="font-bold text-slate-900 text-sm mb-1">Verification Timeline</h3>
              <p className="text-xs text-slate-500 mb-4">Track the progress from submission to final verification</p>

              <div className="grid grid-cols-3 gap-4 text-center">
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <div className="w-7 h-7 rounded-full bg-emerald-500 text-white font-bold mx-auto flex items-center justify-center text-xs mb-2">✓</div>
                  <h4 className="font-bold text-slate-900 text-xs">Submitted</h4>
                  <p className="text-[10px] text-slate-500 mt-0.5">12 Jan 2024, 10:24</p>
                  <p className="text-[10px] text-slate-400">Documents uploaded by supplier</p>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <div className="w-7 h-7 rounded-full bg-blue-600 text-white font-bold mx-auto flex items-center justify-center text-xs mb-2">🔍</div>
                  <h4 className="font-bold text-slate-900 text-xs">Reviewed</h4>
                  <p className="text-[10px] text-slate-500 mt-0.5">18 Jan 2024, 14:30</p>
                  <p className="text-[10px] text-slate-400">Reviewed by auditor (AMA Ghana)</p>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <div className="w-7 h-7 rounded-full bg-emerald-600 text-white font-bold mx-auto flex items-center justify-center text-xs mb-2">🛡️</div>
                  <h4 className="font-bold text-slate-900 text-xs">Verified</h4>
                  <p className="text-[10px] text-slate-500 mt-0.5">22 Jan 2024, 09:15</p>
                  <p className="text-[10px] text-slate-400">Approved for carbon passport</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side Auditor Review Panel */}
        <div className="space-y-6">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="font-bold text-slate-900 text-sm">Reviewer Checklist</h3>
            <div className="space-y-2 text-xs">
              {checklistItems.map((item, idx) => (
                <label key={idx} className="flex items-center gap-2.5 cursor-pointer text-slate-700">
                  <input type="checkbox" defaultChecked={item.checked} className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4" />
                  <span>{item.label}</span>
                </label>
              ))}
            </div>

            <div className="pt-3 border-t border-slate-100 space-y-2">
              <h4 className="font-bold text-slate-900 text-xs">Reviewer Comments</h4>
              <textarea
                rows={3}
                placeholder="Please provide a clearer copy of the transport log showing distance and vehicle type."
                className="w-full rounded-xl border border-slate-200 p-3 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <span className="text-[10px] text-slate-400 block text-right">0/500</span>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button type="button" className="flex-1 py-2 px-3 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50">
                Request Clarification
              </button>
              <button type="button" className="flex-1 py-2 px-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold">
                Mark as Reviewed
              </button>
            </div>
          </div>

          <SimpleWordsCard points={simpleWordsPoints} />
        </div>
      </div>
    </div>
  );
};
