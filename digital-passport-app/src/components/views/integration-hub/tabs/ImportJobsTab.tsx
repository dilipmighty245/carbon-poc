import React, { useState } from 'react';
import { Download, AlertCircle, CheckCircle2, ChevronRight, FileText, ArrowRight } from 'lucide-react';
import type { ImportJob } from '../types';

interface ImportJobsTabProps {
  onNavigateTab: (tab: string) => void;
}

export const ImportJobsTab: React.FC<ImportJobsTabProps> = ({ onNavigateTab }) => {
  const [jobs, setJobs] = useState<ImportJob[]>([
    {
      id: 'JOB-001',
      source: 'ERP purchase feed',
      mapping: 'MAP-ERP-v1',
      state: 'With errors',
      received: 80,
      accepted: 78,
      rejected: 2,
      timestamp: 'Today 09:42',
      errors: [
        { row: 12, field: 'unit', error: 'Unsupported unit MWhh' },
        { row: 29, field: 'evidence_ref', error: 'Required reference missing' },
      ],
    },
    {
      id: 'JOB-002',
      source: 'Plant energy gateway',
      mapping: 'MAP-MTR-v1',
      state: 'Completed',
      received: 38,
      accepted: 38,
      rejected: 0,
      timestamp: 'Today 09:45',
    },
    {
      id: 'JOB-003',
      source: 'Supplier records',
      mapping: 'Manual',
      state: 'Failed validation',
      received: 2,
      accepted: 0,
      rejected: 2,
      timestamp: 'Today 09:12',
      errors: [
        { row: 1, field: 'evidence_ref', error: 'Missing mandatory supplier declaration document' },
        { row: 2, field: 'batch_id', error: 'Unassigned batch code' },
      ],
    },
  ]);

  const [selectedJob, setSelectedJob] = useState<ImportJob | null>(jobs[0]);

  const handleDownloadErrors = (job: ImportJob) => {
    let csvContent = 'row,field,error\n';
    if (job.errors && job.errors.length > 0) {
      job.errors.forEach((err) => {
        csvContent += `${err.row},${err.field},"${err.error}"\n`;
      });
    } else {
      csvContent += '12,unit,Unsupported unit MWhh\n29,evidence_ref,Required reference missing\n';
    }

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${job.id}-import-errors.csv`;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  return (
    <div className="space-y-6">
      {/* Notice */}
      <div className="p-3.5 bg-sky-50 border border-sky-100 rounded-xl text-xs text-sky-800 leading-relaxed">
        <strong className="font-bold">Execution Register:</strong> Ingestion jobs track row-level parsing outcomes. Download error CSVs to correct records at source without re-importing unchanged accepted data.
      </div>

      {/* Main Jobs Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="font-bold text-slate-900 text-sm">Import job register</h2>
            <p className="text-xs text-slate-500">Historical ledger of batch and continuous ingestion runs</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50/70 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3 px-5">Job ID</th>
                <th className="py-3 px-4">Source</th>
                <th className="py-3 px-4">Mapping</th>
                <th className="py-3 px-4">State</th>
                <th className="py-3 px-4">Received</th>
                <th className="py-3 px-4">Accepted</th>
                <th className="py-3 px-4">Rejected</th>
                <th className="py-3 px-5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {jobs.map((j) => (
                <tr
                  key={j.id}
                  onClick={() => setSelectedJob(j)}
                  className={`cursor-pointer transition-colors ${
                    selectedJob?.id === j.id ? 'bg-emerald-50/40' : 'hover:bg-slate-50/50'
                  }`}
                >
                  <td className="py-3.5 px-5 font-mono font-bold text-slate-900">{j.id}</td>
                  <td className="py-3.5 px-4 font-semibold text-slate-800">{j.source}</td>
                  <td className="py-3.5 px-4 font-mono text-slate-500">{j.mapping}</td>
                  <td className="py-3.5 px-4">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${
                        j.state === 'Completed'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : j.state === 'With errors'
                          ? 'bg-amber-50 text-amber-700 border-amber-200'
                          : 'bg-rose-50 text-rose-700 border-rose-200'
                      }`}
                    >
                      {j.state}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 font-mono text-slate-600">{j.received}</td>
                  <td className="py-3.5 px-4 font-mono font-bold text-emerald-700">{j.accepted}</td>
                  <td className="py-3.5 px-4 font-mono font-bold text-rose-600">
                    {j.rejected > 0 ? j.rejected : '-'}
                  </td>
                  <td className="py-3.5 px-5 text-right">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedJob(j);
                      }}
                      className="px-3 py-1 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-bold rounded-lg shadow-2xs text-[11px] transition-colors"
                    >
                      Inspect job
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Selected Job Detail Card */}
      {selectedJob && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-emerald-600" />
                <h3 className="font-bold text-slate-900 text-sm">
                  Job Detail: {selectedJob.id}
                </h3>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Source: <span className="font-semibold text-slate-700">{selectedJob.source}</span> • Version:{' '}
                <span className="font-mono text-slate-700">{selectedJob.mapping}</span> • Timestamp:{' '}
                {selectedJob.timestamp}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => handleDownloadErrors(selectedJob)}
                className="px-4 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold rounded-xl shadow-2xs transition-colors flex items-center gap-2"
              >
                <Download className="w-3.5 h-3.5 text-slate-500" />
                <span>Download error CSV</span>
              </button>
              {selectedJob.rejected > 0 && (
                <button
                  onClick={() => onNavigateTab('Exceptions')}
                  className="px-4 py-2 bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-900 text-xs font-bold rounded-xl shadow-2xs transition-colors flex items-center gap-2"
                >
                  <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                  <span>Review failed records</span>
                </button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-center">
              <span className="text-xs text-slate-500 block">Received Rows</span>
              <span className="text-xl font-black text-slate-900 mt-0.5 block">{selectedJob.received}</span>
            </div>
            <div className="p-4 bg-emerald-50/60 rounded-xl border border-emerald-200 text-center">
              <span className="text-xs text-emerald-700 block">Accepted Rows</span>
              <span className="text-xl font-black text-emerald-700 mt-0.5 block">{selectedJob.accepted}</span>
            </div>
            <div className="p-4 bg-rose-50/60 rounded-xl border border-rose-200 text-center">
              <span className="text-xs text-rose-700 block">Rejected Rows</span>
              <span className="text-xl font-black text-rose-700 mt-0.5 block">{selectedJob.rejected}</span>
            </div>
          </div>

          {selectedJob.errors && selectedJob.errors.length > 0 ? (
            <div className="space-y-2 pt-2">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Row-Level Exceptions ({selectedJob.errors.length})
              </h4>
              <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden text-xs">
                {selectedJob.errors.map((err, idx) => (
                  <div key={idx} className="p-3 bg-white flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <span className="font-mono font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                        Row {err.row}
                      </span>
                      <span className="font-bold text-slate-800">{err.field}:</span>
                      <span className="text-rose-700 font-medium">{err.error}</span>
                    </div>
                    <button
                      onClick={() => onNavigateTab('Exceptions')}
                      className="text-xs text-emerald-700 hover:text-emerald-900 font-bold underline flex items-center gap-1"
                    >
                      <span>Fix in Exceptions</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="p-4 bg-emerald-50/40 rounded-xl border border-emerald-100 text-xs text-emerald-800 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>All records in this ingestion batch passed schema validation and canonical normalization.</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
