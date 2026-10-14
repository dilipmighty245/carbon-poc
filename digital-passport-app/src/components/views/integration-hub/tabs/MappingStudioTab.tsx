import React, { useState } from 'react';
import { CheckCircle2, AlertTriangle, Play, Save, Check, RefreshCw } from 'lucide-react';
import type { MappingField } from '../types';

export const MappingStudioTab: React.FC = () => {
  const [selectedSource, setSelectedSource] = useState('ERP purchase feed');
  const [recordType, setRecordType] = useState('Material receipt');
  const [mappingVersion, setMappingVersion] = useState('MAP-ERP-v1');
  const [previewResult, setPreviewResult] = useState<{
    tested: boolean;
    row1: { status: 'accepted'; text: string };
    row2: { status: 'rejected'; text: string };
  } | null>(null);
  const [savedNotification, setSavedNotification] = useState<string | null>(null);

  const initialFields: MappingField[] = [
    {
      sourceField: 'PlantCode',
      example: 'FAC-001',
      destination: 'Facility ID',
      treatment: 'Resolve organisation reference',
      status: 'Mapped',
    },
    {
      sourceField: 'MaterialCode',
      example: 'STEEL-IN-01',
      destination: 'Material ID',
      treatment: 'Resolve Value Chain catalogue',
      status: 'Mapped',
    },
    {
      sourceField: 'Quantity',
      example: '110',
      destination: 'Quantity',
      treatment: 'Numeric, greater than zero',
      status: 'Mapped',
    },
    {
      sourceField: 'Unit',
      example: 'tonne',
      destination: 'Unit',
      treatment: 'Normalise supported units',
      status: 'Mapped',
    },
    {
      sourceField: 'BatchCode',
      example: 'BATCH-001',
      destination: 'Batch ID',
      treatment: 'Resolve product batch',
      status: 'Mapped',
    },
    {
      sourceField: 'DocumentRef',
      example: 'EV-001',
      destination: 'Evidence ID',
      treatment: 'Retain source reference',
      status: 'Mapped',
    },
  ];

  const [fields, setFields] = useState<MappingField[]>(initialFields);

  const handlePreview = () => {
    setPreviewResult({
      tested: true,
      row1: {
        status: 'accepted',
        text: 'Row 1: accepted • FAC-001 / BATCH-001 / 110 tonne',
      },
      row2: {
        status: 'rejected',
        text: 'Row 2: rejected • Unknown facility FAC-999. Resolve in Organisation before import.',
      },
    });
  };

  const handleSave = () => {
    setMappingVersion('MAP-ERP-v2');
    setSavedNotification(
      'Demo mapping revision MAP-ERP-v2 registered. Target schemas are linked to future import jobs.'
    );
    setTimeout(() => {
      setSavedNotification(null);
    }, 4000);
  };

  return (
    <div className="space-y-6">
      {/* Notice Banner */}
      <div className="p-3.5 bg-amber-50 border border-amber-200/80 rounded-xl text-xs text-amber-800 leading-relaxed">
        <strong className="font-bold">Boundary Rule:</strong> Suggest scope/category only after the approved organisational boundary and accounting method are confirmed. Source mapping must not silently approve a carbon accounting classification.
      </div>

      {/* Main Card: Map Source Fields */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="font-bold text-slate-900 text-sm">Map source fields</h2>
            <p className="text-xs text-slate-500">Configure transformation rules between ingestion columns and Saurient canonical schemas</p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-500">Source:</span>
              <select
                value={selectedSource}
                onChange={(e) => setSelectedSource(e.target.value)}
                className="bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-xs text-slate-700 font-medium focus:outline-none focus:border-emerald-500"
              >
                <option value="ERP purchase feed">ERP purchase feed</option>
                <option value="Plant energy gateway">Plant energy gateway</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-500">Record type:</span>
              <select
                value={recordType}
                onChange={(e) => setRecordType(e.target.value)}
                className="bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-xs text-slate-700 font-medium focus:outline-none focus:border-emerald-500"
              >
                <option value="Material receipt">Material receipt</option>
                <option value="Activity">Activity</option>
                <option value="Production output">Production output</option>
              </select>
            </div>

            <span className="px-2.5 py-1 bg-slate-100 text-slate-700 text-xs font-mono font-bold rounded-md">
              {mappingVersion}
            </span>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50/70 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3 px-5">Source field</th>
                <th className="py-3 px-4">Example</th>
                <th className="py-3 px-4">Destination</th>
                <th className="py-3 px-4">Treatment</th>
                <th className="py-3 px-5 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {fields.map((f, i) => (
                <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                  <td className="py-3.5 px-5 font-mono font-bold text-slate-900">{f.sourceField}</td>
                  <td className="py-3.5 px-4 font-mono text-slate-500">{f.example}</td>
                  <td className="py-3.5 px-4 font-bold text-emerald-800">{f.destination}</td>
                  <td className="py-3.5 px-4 text-slate-600">{f.treatment}</td>
                  <td className="py-3.5 px-5 text-right">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200">
                      {f.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Actions Bar */}
        <div className="p-4 bg-slate-50/50 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
          <div className="text-xs text-slate-500 font-medium">
            Preview validates 2 sample records against target schema before persisting version.
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handlePreview}
              className="px-4 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold rounded-xl shadow-2xs transition-colors flex items-center gap-1.5"
            >
              <Play className="w-3.5 h-3.5 text-slate-500" />
              <span>Preview validation</span>
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-2 bg-[#00E599] hover:bg-[#00c985] text-slate-950 text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Save demo mapping</span>
            </button>
          </div>
        </div>
      </div>

      {/* Save Notification Toast / Banner */}
      {savedNotification && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span className="font-semibold">{savedNotification}</span>
        </div>
      )}

      {/* Mapping Preview Results Section */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
        <h3 className="font-bold text-slate-900 text-sm">Mapping preview</h3>
        {previewResult ? (
          <div className="space-y-2 text-xs">
            <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-xl flex items-center gap-2 text-emerald-800 font-medium">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{previewResult.row1.text}</span>
            </div>
            <div className="p-3 bg-rose-50/70 border border-rose-200 rounded-xl flex items-center gap-2 text-rose-800 font-medium">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{previewResult.row2.text}</span>
            </div>
          </div>
        ) : (
          <p className="text-xs text-slate-400">
            Run preview to inspect sample rows. Saving creates an immutable new mapping revision.
          </p>
        )}
      </div>
    </div>
  );
};
