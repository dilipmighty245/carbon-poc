import React, { useState } from 'react';
import { Upload, Download, CheckCircle2, AlertCircle, FileText, Check, ArrowRight } from 'lucide-react';
import type { ParsedCsvRow } from '../types';

interface BulkUploadTabProps {
  onNavigateTab: (tab: string) => void;
}

export const BulkUploadTab: React.FC<BulkUploadTabProps> = ({ onNavigateTab }) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isParsing, setIsParsing] = useState(false);
  const [parsedRows, setParsedRows] = useState<ParsedCsvRow[]>([]);
  const [acceptedCount, setAcceptedCount] = useState(0);
  const [rejectedCount, setRejectedCount] = useState(0);
  const [importStatus, setImportStatus] = useState<string | null>(null);

  const handleDownloadTemplate = () => {
    const templateContent =
      'record_id,facility_id,batch_id,activity_type,quantity,unit,evidence_ref\n' +
      'ACT-001,FAC-001,BATCH-001,Electricity,125.4,kWh,EV-001\n' +
      'ACT-002,FAC-001,BATCH-001,Fuel,32.7,L,EV-002\n' +
      'ACT-003,FAC-001,BATCH-001,Material input,85.0,tonne,EV-003\n' +
      'ACT-004,FAC-999,BATCH-001,Electricity,50.0,MWhh,EV-004\n';

    const blob = new Blob([templateContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'activity-template.csv';
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
      setParsedRows([]);
      setAcceptedCount(0);
      setRejectedCount(0);
      setImportStatus(null);
    }
  };

  const handleValidateFile = async () => {
    if (!selectedFile) {
      alert('Please choose a CSV file first or download the sample template.');
      return;
    }

    setIsParsing(true);
    try {
      const text = await selectedFile.text();
      const lines = text.trim().split(/\r?\n/);
      if (lines.length < 2) {
        alert('CSV file is empty or missing data rows.');
        setIsParsing(false);
        return;
      }

      const headers = lines[0].split(',').map((h) => h.trim());
      const required = ['record_id', 'facility_id', 'batch_id', 'activity_type', 'quantity', 'unit', 'evidence_ref'];
      const missing = required.filter((r) => !headers.includes(r));
      if (missing.length > 0) {
        alert(`Missing required headers: ${missing.join(', ')}`);
        setIsParsing(false);
        return;
      }

      const seenIds = new Set<string>();
      const validUnits: Record<string, string> = {
        Electricity: 'kWh',
        Fuel: 'L',
        'Material input': 'tonne',
        Transport: 'tonne-km',
      };

      let accepted = 0;
      let rejected = 0;
      const rows: ParsedCsvRow[] = [];

      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        const cells = line.split(',').map((c) => c.trim());
        const rowObj: any = {};
        headers.forEach((h, idx) => {
          rowObj[h] = cells[idx] || '';
        });

        const errors: string[] = [];
        if (cells.length !== headers.length) {
          errors.push('Column count mismatch');
        }
        if (required.some((h) => !rowObj[h])) {
          errors.push('Missing required value');
        }
        if (rowObj.facility_id !== 'FAC-001') {
          errors.push(`Unknown facility ${rowObj.facility_id || '(empty)'} (must resolve in Organisation)`);
        }
        if (rowObj.batch_id !== 'BATCH-001') {
          errors.push(`Unknown batch ${rowObj.batch_id || '(empty)'}`);
        }

        const q = Number(rowObj.quantity);
        if (!Number.isFinite(q) || q <= 0) {
          errors.push('Invalid quantity (must be positive number)');
        }

        const expectedUnit = validUnits[rowObj.activity_type];
        if (expectedUnit && rowObj.unit !== expectedUnit) {
          errors.push(`Unit mismatch: ${rowObj.activity_type} requires ${expectedUnit}, got ${rowObj.unit}`);
        }

        if (seenIds.has(rowObj.record_id)) {
          errors.push(`Duplicate record ID ${rowObj.record_id}`);
        } else if (rowObj.record_id) {
          seenIds.add(rowObj.record_id);
        }

        const isRowAccepted = errors.length === 0;
        if (isRowAccepted) {
          accepted++;
        } else {
          rejected++;
        }

        rows.push({
          rowNum: i + 1,
          record_id: rowObj.record_id || `ROW-${i}`,
          facility_id: rowObj.facility_id || '',
          batch_id: rowObj.batch_id || '',
          activity_type: rowObj.activity_type || '',
          quantity: rowObj.quantity || '',
          unit: rowObj.unit || '',
          evidence_ref: rowObj.evidence_ref || '',
          status: isRowAccepted ? 'Accepted' : 'Rejected',
          errors,
        });
      }

      setParsedRows(rows);
      setAcceptedCount(accepted);
      setRejectedCount(rejected);
    } catch (err) {
      console.error('CSV Parsing error:', err);
      alert('Failed to parse CSV file.');
    } finally {
      setIsParsing(false);
    }
  };

  const handleImportAcceptedRows = () => {
    if (acceptedCount === 0) {
      alert('Validate a file with accepted rows first.');
      return;
    }

    setImportStatus(
      `Demo import complete: ${acceptedCount} accepted rows staged into canonical carbon pipeline. Traceable job created in Import Jobs register.`
    );
  };

  return (
    <div className="space-y-6">
      {/* Notice Banner */}
      <div className="p-3.5 bg-sky-50 border border-sky-100 rounded-xl text-xs text-sky-800 leading-relaxed">
        <strong className="font-bold">File Ingestion Engine:</strong> Uploaded CSV rows are validated client-side against tenant boundaries, unit normalization standards, and required evidence tags.
      </div>

      {/* Main Upload Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <h2 className="font-bold text-slate-900 text-sm">Upload activity CSV</h2>
            <p className="text-xs text-slate-500">Choose a CSV file and validate rows before committing</p>
          </div>
          <button
            onClick={handleDownloadTemplate}
            className="px-4 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold rounded-xl shadow-2xs transition-colors flex items-center gap-2 self-start sm:self-auto"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Download CSV template</span>
          </button>
        </div>

        {/* File Drop / Select Area */}
        <div className="p-6 border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50/50 flex flex-col items-center justify-center text-center space-y-3">
          <Upload className="w-8 h-8 text-slate-400" />
          <div>
            <label className="cursor-pointer px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl text-xs font-bold text-slate-700 shadow-2xs inline-block">
              <span>Choose CSV file</span>
              <input type="file" accept=".csv" onChange={handleFileChange} className="hidden" />
            </label>
            <p className="text-[11px] text-slate-500 mt-2">
              {selectedFile ? (
                <span className="font-mono font-bold text-emerald-700">{selectedFile.name}</span>
              ) : (
                'No file selected. Required headers: record_id, facility_id, batch_id, activity_type, quantity, unit, evidence_ref.'
              )}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={handleValidateFile}
            disabled={!selectedFile || isParsing}
            className={`px-4 py-2.5 text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center gap-2 ${
              !selectedFile || isParsing
                ? 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed'
                : 'bg-white hover:bg-slate-50 border border-slate-300 text-slate-800'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>{isParsing ? 'Validating...' : 'Validate file'}</span>
          </button>

          <button
            onClick={handleImportAcceptedRows}
            disabled={acceptedCount === 0}
            className={`px-5 py-2.5 text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center gap-2 ${
              acceptedCount === 0
                ? 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'
                : 'bg-[#00E599] hover:bg-[#00c985] text-slate-950'
            }`}
          >
            <Check className="w-4 h-4" />
            <span>Import accepted rows ({acceptedCount})</span>
          </button>
        </div>

        {/* Import Status Alert */}
        {importStatus && (
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-900 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span className="font-semibold">{importStatus}</span>
            </div>
            <button
              onClick={() => onNavigateTab('Import Jobs')}
              className="text-xs font-bold text-emerald-800 hover:text-emerald-950 underline flex items-center gap-1 self-start sm:self-auto"
            >
              <span>Open Import Jobs Register</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Validation Outcomes Breakdown */}
        {parsedRows.length > 0 && (
          <div className="space-y-4 pt-2">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider">
                Validation Report ({parsedRows.length} Rows Evaluated)
              </h3>
              <div className="flex items-center gap-3 text-xs font-bold font-mono">
                <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  {acceptedCount} Accepted
                </span>
                <span className="text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                  {rejectedCount} Rejected
                </span>
              </div>
            </div>

            <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden text-xs">
              {parsedRows.map((row) => (
                <div
                  key={row.rowNum}
                  className={`p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                    row.status === 'Accepted' ? 'bg-white' : 'bg-rose-50/40'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="font-mono font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                      Row {row.rowNum}
                    </span>
                    <span className="font-mono font-semibold text-slate-800">{row.record_id}</span>
                    <span className="text-slate-500 font-medium">
                      {row.activity_type} • {row.quantity} {row.unit}
                    </span>
                  </div>

                  <div>
                    {row.status === 'Accepted' ? (
                      <span className="text-[10px] font-bold px-2.5 py-1 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 inline-flex items-center gap-1">
                        <Check className="w-3 h-3" />
                        <span>Accepted</span>
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-rose-50 text-rose-700 border border-rose-200">
                        {row.errors.join('; ')}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Import Safeguards Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-3">
        <h3 className="font-bold text-slate-900 text-sm">Import safeguards</h3>
        <p className="text-xs text-slate-600 leading-relaxed">
          Rejected rows remain visible with clear correction guidance. Missing evidence is never replaced with invented data. Duplicate record IDs are flagged immediately. Imports in this session simulate production intake without modifying database records.
        </p>
      </div>
    </div>
  );
};
