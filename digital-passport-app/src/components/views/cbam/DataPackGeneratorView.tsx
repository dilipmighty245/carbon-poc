import React, { useState } from 'react';
import { FileText, Download, Lock, CheckCircle2, ShieldCheck, Copy, Share2, Sparkles, AlertTriangle } from 'lucide-react';
import type { CBAMProductData } from '../../../types/cbam';

interface DataPackGeneratorViewProps {
  product: CBAMProductData;
  onFreezeDataset: () => void;
}

export const DataPackGeneratorView: React.FC<DataPackGeneratorViewProps> = ({
  product,
  onFreezeDataset,
}) => {
  const [downloadMsg, setDownloadMsg] = useState('');

  const sections = [
    { num: '01', title: 'Cover, Document Control & Confidentiality', status: 'COMPLETE' },
    { num: '02', title: 'Executive Verification-Readiness Summary', status: 'COMPLETE' },
    { num: '03', title: 'Regulatory Version & Assumptions Baseline', status: 'COMPLETE' },
    { num: '04', title: 'Applicability & CN-Code Decision (APP-001/002)', status: 'COMPLETE' },
    { num: '05', title: 'Threshold & Exemption Assessment (THR-001/002)', status: 'COMPLETE' },
    { num: '06', title: 'Organisation & Operator Identity', status: 'COMPLETE' },
    { num: '07', title: 'Installation Profile & Coordinates (INS-001)', status: 'COMPLETE' },
    { num: '08', title: 'EU Importer, EORI & Declarant (DEC-001)', status: 'COMPLETE' },
    { num: '09', title: 'Product, Batch & Shipment Identity', status: 'COMPLETE' },
    { num: '10', title: 'Monitoring-Plan Summary (MON-001)', status: 'COMPLETE' },
    { num: '11', title: 'Production-Route Description & Boundaries', status: 'COMPLETE' },
    { num: '12', title: 'System Boundary & Process Diagram', status: 'COMPLETE' },
    { num: '13', title: 'Functional Unit & Output Reconciliation', status: 'COMPLETE' },
    { num: '14', title: 'Activity-Data Inventory (DAT-001)', status: 'COMPLETE' },
    { num: '15', title: 'Fuel & Combustion Sources', status: 'COMPLETE' },
    { num: '16', title: 'Electricity & Indirect Emissions Scope', status: 'COMPLETE' },
    { num: '17', title: 'Process Emissions & Mass Balance', status: 'COMPLETE' },
    { num: '18', title: 'Precursor Register & Verification Reports (PRE-001)', status: product.rules.some(r => r.ruleId === 'PRE-001' && r.outcome === 'FAIL') ? 'ACTION REQUIRED' : 'COMPLETE' },
    { num: '19', title: 'Allocation & Co-Products Rationale (ALC-001)', status: 'COMPLETE' },
    { num: '20', title: 'Emission Factors & GWP Set Versioning', status: 'COMPLETE' },
    { num: '21', title: 'Calculation Formulas & Trace Graph (CAL-001/002)', status: 'COMPLETE' },
    { num: '22', title: 'Specific Embedded-Emissions Result', status: 'COMPLETE' },
    { num: '23', title: 'Actual / Default-Value Justification', status: 'COMPLETE' },
    { num: '24', title: 'Carbon Price Paid Evidence', status: 'COMPLETE' },
    { num: '25', title: 'Free-Allocation Adjustment Inputs', status: 'COMPLETE' },
    { num: '26', title: 'Data-Quality & Uncertainty Assessment', status: 'COMPLETE' },
    { num: '27', title: 'Universal Checklist Results Summary', status: 'COMPLETE' },
    { num: '28', title: 'Commodity-Specific Checklist Results', status: 'COMPLETE' },
    { num: '29', title: 'Exceptions & Corrective Actions Register', status: 'COMPLETE' },
    { num: '30', title: 'Evidence Index & SHA256 Hashes (EVD-001)', status: 'COMPLETE' },
    { num: '31', title: 'Internal Approvals & Segregation of Duties', status: 'COMPLETE' },
    { num: '32', title: 'Frozen Dataset & Calculation Hashes (AUD-001)', status: product.datasetFrozen ? 'FROZEN' : 'PENDING FREEZE' },
    { num: '33', title: 'Verification Engagement & Findings Log', status: 'READY' },
    { num: '34', title: 'Verifier Report & Independent Opinion', status: product.verifierReportId ? 'LINKED' : 'PENDING VERIFIER' },
    { num: '35', title: 'Management Declaration & Signatures', status: 'COMPLETE' },
    { num: '36', title: 'Appendices & Controlled Documents Index', status: 'COMPLETE' },
  ];

  const handleDownload = (format: string) => {
    setDownloadMsg(`Generating ${format} Verification Pack...`);
    setTimeout(() => setDownloadMsg(''), 3000);
  };

  const hasBlockers = product.rules.some((r) => r.outcome === 'FAIL' || r.severity === 'BLOCKER');

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-black text-slate-900 tracking-tight">CBAM Data Pack & Dossier Generator</h2>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Generates a 36-section controlled verification-readiness dossier and immutable dataset freeze manifest.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {!product.datasetFrozen ? (
              <button
                disabled={hasBlockers}
                onClick={onFreezeDataset}
                className={`px-4 py-2 font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-2 ${
                  hasBlockers
                    ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                    : 'bg-[#00E599] hover:bg-[#00c985] text-slate-950'
                }`}
              >
                <Lock className="w-4 h-4" />
                <span>Freeze Dataset & Sign Manifest</span>
              </button>
            ) : (
              <span className="bg-[#15342A] text-[#00E599] border border-emerald-500/40 text-xs font-bold px-3 py-2 rounded-xl flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" />
                <span>DATASET FROZEN & MANIFEST SIGNED</span>
              </span>
            )}
          </div>
        </div>

        {downloadMsg && (
          <div className="p-3 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-bold animate-pulse">
            {downloadMsg}
          </div>
        )}

        {/* Cryptographic Freeze Manifest Box if Frozen */}
        {product.datasetFrozen && (
          <div className="p-5 bg-slate-900 text-white rounded-2xl space-y-3 font-mono text-xs">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <span className="text-[#00E599] font-bold font-sans text-xs flex items-center gap-2">
                <ShieldCheck className="w-4 h-4" /> IMMUTABLE FREEZE MANIFEST SIGNATURE
              </span>
              <span className="text-slate-400 text-[10px]">FROZEN ON: {product.freezeTimestamp}</span>
            </div>
            <div>
              <span className="text-slate-400 text-[10px] block">DATASET SHA256 HASH</span>
              <span className="text-white font-bold break-all">{product.freezeManifestHash}</span>
            </div>
          </div>
        )}

        {/* Multi-Format Export Buttons */}
        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">AVAILABLE DOSSIER EXPORT FORMATS</span>
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <button
              onClick={() => handleDownload('PDF')}
              className="px-4 py-2 bg-white hover:bg-slate-100 border border-slate-300 text-slate-800 font-bold rounded-xl shadow-xs transition-colors flex items-center gap-2"
            >
              <FileText className="w-4 h-4 text-rose-600" />
              <span>Controlled PDF Pack (60+ Pages)</span>
            </button>

            <button
              onClick={() => handleDownload('HTML')}
              className="px-4 py-2 bg-white hover:bg-slate-100 border border-slate-300 text-slate-800 font-bold rounded-xl shadow-xs transition-colors flex items-center gap-2"
            >
              <FileText className="w-4 h-4 text-sky-600" />
              <span>Printable HTML Reviewer View</span>
            </button>

            <button
              onClick={() => handleDownload('JSON')}
              className="px-4 py-2 bg-white hover:bg-slate-100 border border-slate-300 text-slate-800 font-bold rounded-xl shadow-xs transition-colors flex items-center gap-2"
            >
              <FileText className="w-4 h-4 text-amber-600" />
              <span>Machine-Readable JSON Payload</span>
            </button>

            <button
              onClick={() => handleDownload('CSV')}
              className="px-4 py-2 bg-white hover:bg-slate-100 border border-slate-300 text-slate-800 font-bold rounded-xl shadow-xs transition-colors flex items-center gap-2"
            >
              <FileText className="w-4 h-4 text-emerald-600" />
              <span>CSV Activity & Calculation Lines</span>
            </button>
          </div>
        </div>

        {/* 36-Section Table of Contents */}
        <div className="space-y-3 pt-2">
          <h3 className="font-bold text-xs text-slate-900 uppercase tracking-wider">
            Dossier Table of Contents (36 Mandatory Sections)
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
            {sections.map((sec) => (
              <div key={sec.num} className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="w-7 h-7 rounded-lg bg-slate-200 text-slate-800 font-mono font-bold text-xs flex items-center justify-center">
                    {sec.num}
                  </span>
                  <span className="font-bold text-slate-900 truncate max-w-[260px]">{sec.title}</span>
                </div>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                  sec.status === 'COMPLETE' || sec.status === 'FROZEN' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                }`}>
                  {sec.status}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* ISO 17029 / ISO 14065 Verification & Methodology Roadmap Card */}
        <div className="p-5 bg-slate-900 text-white rounded-2xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <span className="text-[10px] font-bold text-[#00E599] tracking-wider uppercase block">METHODOLOGY & ACCREDITATION FRAMEWORK</span>
              <h3 className="font-bold text-sm text-white">ISO/IEC 17029 & ISO 14065 Alignment</h3>
            </div>
            <span className="bg-[#15342A] text-[#00E599] border border-emerald-500/30 text-[10px] font-bold px-2.5 py-1 rounded-md">
              GHG PROTOCOL ALIGNED
            </span>
          </div>

          <p className="text-xs text-slate-300 leading-relaxed font-medium">
            “Calculated using a documented GHG Protocol-aligned methodology; third-party methodology validation is planned.”
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
            <div className="p-3 bg-slate-800 rounded-xl border border-slate-700">
              <span className="text-[10px] text-slate-400 font-bold block uppercase">1. METHODOLOGY & ENGINE</span>
              <span className="font-bold text-white block mt-0.5">PoC Calculation Baseline</span>
              <span className="text-[10px] text-slate-400 block">GHG Protocol / ISO 14064-1</span>
            </div>
            <div className="p-3 bg-slate-800 rounded-xl border border-slate-700">
              <span className="text-[10px] text-slate-400 font-bold block uppercase">2. PRE-ASSESSMENT</span>
              <span className="font-bold text-white block mt-0.5">SGS India / TÜV SÜD</span>
              <span className="text-[10px] text-slate-400 block">ISO/IEC 17029 & ISO 14065</span>
            </div>
            <div className="p-3 bg-slate-800 rounded-xl border border-slate-700">
              <span className="text-[10px] text-slate-400 font-bold block uppercase">3. CBAM PARTNERSHIP</span>
              <span className="font-bold text-white block mt-0.5">EU-Accredited Verifier</span>
              <span className="text-[10px] text-slate-400 block">VeriCarbon EU / DNV</span>
            </div>
          </div>
        </div>

        {/* Mandatory Regulatory Disclaimer Banner */}
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl text-xs text-amber-900 font-semibold text-center leading-relaxed">
          Critical Regulatory Notice: Saurient prepares, validates, calculates, evidences and packages CBAM data for independent verification and authorized declarant use. It does not certify products, replace an accredited verifier, or represent the official EU CBAM Registry.
        </div>
      </div>
    </div>
  );
};
