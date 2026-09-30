import React, { useEffect, useState } from 'react';
import { usePcf } from '../../../context/PcfContext';
import { Section } from '../common/Section';
import { StatusChip } from '../common/StatusChip';
import { READINESS_CHECKS } from '../../../data/pcfData';
import { fmtNum } from '../../../utils/format';
import { CheckCircle2, FileDown, Lock, ShieldCheck, X } from 'lucide-react';
import { toast } from '../../../utils/toast';

const SECTIONS = [
  'Organisation',
  'Facility',
  'Product',
  'Batch',
  'Declared / Functional Unit',
  'Assessment Period',
  'System Boundary',
  'Methodology',
  'Inventory Summary',
  'Allocation Methodology',
  'Logistics Methodology',
  'Emission Factors',
  'Total PCF',
  'PCF Intensity',
  'Scope Breakdown',
  'Lifecycle Breakdown',
  'Data Quality',
  'Exclusions',
  'Assumptions',
  'Limitations / Uncertainty',
  'Calculation Version',
  'Evidence Register',
  'Approval History',
  'Verification Status',
];

interface ReportTabProps {
  registerPrimary: (fn: () => void) => void;
}

export function ReportTab({ registerPrimary }: ReportTabProps) {
  const {
    project, officialTotalKg, officialIntensity, officialVersion, reportStatus,
    submitForVerification, recalcRequired,
  } = usePcf();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [submittedReq, setSubmittedReq] = useState<string | null>(null);

  const allReady = READINESS_CHECKS.every((c) => c.ok) && !recalcRequired;

  useEffect(() => {
    registerPrimary(() => {
      if (reportStatus === 'SUBMITTED') {
        toast.info('Already submitted and locked.');
        return;
      }
      if (!allReady) {
        toast.error('Verification not ready — resolve outstanding checks.');
        return;
      }
      setConfirmOpen(true);
    });
  }, [registerPrimary, reportStatus, allReady]);

  const doSubmit = () => {
    submitForVerification();
    setSubmittedReq('VR-GH-2026-014');
    setConfirmOpen(false);
    toast.success('Submitted to MRV & Verification queue. Calculation version locked.');
  };

  return (
    <div className="space-y-6">
      {/* Header banner */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-900 bg-slate-900 p-6 text-white shadow-md">
        <div>
          <div className="text-[10px] font-bold uppercase tracking-widest text-[#00E599]">PCF Report & ISO 14067 Audit Trail</div>
          <h2 className="text-2xl font-black tracking-tight text-white mt-1">{project.product} · {project.batch}</h2>
          <p className="text-xs text-slate-400 font-medium mt-1">
            {project.id} · {project.facility} ({project.country}) · {project.reportingPeriod}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => toast.success('Exporting official PDF report...')}
            className="px-4 py-2 border border-slate-700 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-2"
          >
            <FileDown className="h-4 w-4 text-emerald-400" /> Export PDF
          </button>
          {reportStatus === 'SUBMITTED' ? (
            <div className="flex items-center gap-2 px-4 py-2 bg-emerald-500/20 border border-emerald-500/40 text-[#00E599] font-bold text-xs rounded-xl">
              <Lock className="h-4 w-4" /> Version Locked & Submitted
            </div>
          ) : (
            <button
              onClick={() => setConfirmOpen(true)}
              data-testid="btn-submit-mrv"
              className="px-4 py-2 bg-[#00E599] hover:bg-[#00c985] text-slate-950 font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-2"
            >
              <ShieldCheck className="h-4 w-4" /> Submit to MRV Verification
            </button>
          )}
        </div>
      </div>

      {/* Summary KPI grid */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
          <span className="text-[10px] uppercase font-bold text-slate-400 block">Total PCF</span>
          <span className="text-2xl font-black text-slate-900 mt-1 block">{(officialTotalKg / 1000).toFixed(1)} tCO₂e</span>
          <span className="text-xs text-slate-500 font-medium">{fmtNum(officialTotalKg)} kgCO₂e</span>
        </div>
        <div className="rounded-2xl border border-emerald-500/30 bg-emerald-50/40 p-5 shadow-xs">
          <span className="text-[10px] uppercase font-bold text-emerald-800 block">PCF Intensity</span>
          <span className="text-2xl font-black text-slate-900 mt-1 block">{officialIntensity}</span>
          <span className="text-xs text-emerald-700 font-bold">kgCO₂e / kg product</span>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
          <span className="text-[10px] uppercase font-bold text-slate-400 block">Calculation Version</span>
          <span className="text-2xl font-black text-slate-900 mt-1 block">{officialVersion.version}</span>
          <span className="text-xs text-slate-500 font-medium">{officialVersion.calculatedAt}</span>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
          <span className="text-[10px] uppercase font-bold text-slate-400 block">Verification Status</span>
          <span className="text-2xl font-black text-slate-900 mt-1 block">{reportStatus === 'SUBMITTED' ? 'Queued' : 'Ready'}</span>
          <StatusChip status={reportStatus === 'SUBMITTED' ? 'Submitted' : 'Ready'} />
        </div>
      </div>

      {/* Readiness checklist & report outline */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Section title="Verification Readiness Gates" testId="section-readiness-checks">
          <div className="space-y-2">
            {READINESS_CHECKS.map((c) => (
              <div key={c.label} className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50/70 px-4 py-2.5 text-xs font-semibold">
                <div className="flex items-center gap-2.5">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                  <span className="text-slate-800">{c.label}</span>
                </div>
                <StatusChip status="PASSED" tone="green" />
              </div>
            ))}
          </div>
        </Section>

        <Section title="Report Outline & 24 Section Preview" testId="section-report-outline">
          <div className="grid grid-cols-2 gap-2 max-h-80 overflow-y-auto pr-2">
            {SECTIONS.map((sec, idx) => (
              <div key={sec} className="rounded-lg border border-slate-100 bg-slate-50/60 p-2.5 text-xs font-semibold text-slate-700 flex items-center gap-2">
                <span className="text-[10px] font-mono text-slate-400 w-5">{idx + 1}.</span>
                <span className="truncate">{sec}</span>
              </div>
            ))}
          </div>
        </Section>
      </div>

      {/* Submit Confirmation Modal */}
      {confirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Confirm Submission to MRV</h3>
              <button onClick={() => setConfirmOpen(false)} className="p-1 rounded-lg text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-xs text-slate-600 font-medium">
              Submitting will lock calculation version <b className="font-bold text-slate-900">{officialVersion.version}</b> and transfer the PCF dataset to the independent MRV verification pipeline.
            </p>
            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button onClick={() => setConfirmOpen(false)} className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-800">
                Cancel
              </button>
              <button onClick={doSubmit} className="px-4 py-2 bg-[#00E599] hover:bg-[#00c985] text-slate-950 font-bold text-xs rounded-xl shadow-xs">
                Confirm & Lock
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
