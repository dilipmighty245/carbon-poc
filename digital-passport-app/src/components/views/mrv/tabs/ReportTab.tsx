import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, ShieldCheck, CheckCircle2, Eye, Download, ScrollText, History, BadgeCheck } from 'lucide-react';
import { useMrv } from '../../../../context/MrvContext';
import { Kpi, StatusBadge, Field, SectionCard } from '../shared';

const SECTIONS = [
  "Organisation Information", "Facility Information", "Verification Subject", "Carbon Claim",
  "Reporting Period", "Product and Batch", "Functional / Declared Unit", "System Boundary",
  "Verification Criteria", "Methodology", "Verification Scope", "Verification Approach",
  "Materiality Approach", "Evidence Reviewed", "Calculation Review", "Sampling Activities",
  "Site Visit", "Findings", "Corrections", "Remaining Limitations", "Final Calculation Version",
  "Final Verified Carbon Result", "Verification Conclusion / Opinion", "Lead Verifier",
  "Technical Reviewer", "Verification Organisation", "Verification Date", "Verification Reference",
  "Supporting Evidence Manifest",
];

export const ReportTab: React.FC = () => {
  const navigate = useNavigate();
  const { meta, engagement, audit } = useMrv();
  const [auditOpen, setAuditOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);

  const isReleased = engagement.planApproved;
  const reportStatus = isReleased ? "VERIFIED" : "IN REVIEW";
  const verifiedTotal = meta.claimedTotal;
  const verifiedIntensity = meta.claimedIntensity;

  const download = () => {
    const body = `INDEPENDENT VERIFICATION REPORT\nEngagement: ${meta.engagementId}\nOrganisation: ${meta.organisation}\nFacility: ${meta.facility}\nProduct: ${meta.product} (${meta.batch})\nPCF Project: ${meta.pcfProject}\nVerified Total Footprint: ${verifiedTotal} tCO2e\nVerified PCF Intensity: ${verifiedIntensity} kgCO2e/kg\nStatus: ${reportStatus}\n`;
    const blob = new Blob([body], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `verification_report_${meta.engagementId}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-5">
      <SectionCard testid="report-header">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
              <FileText className="h-6 w-6" />
            </span>
            <div>
              <h3 className="text-xl font-extrabold text-slate-900">Independent Verification Report</h3>
              <p className="text-xs text-slate-500">{meta.engagementId} · {meta.organisation} · {meta.facility}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <StatusBadge status={reportStatus} />
          </div>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6 text-xs">
          <Field label="Product" value={meta.product} />
          <Field label="Batch" value={meta.batch} mono />
          <Field label="PCF Project" value={meta.pcfProject} mono />
          <Field label="Verified Version" value="V1.0-VERIFIED" />
          <Field label="Boundary" value={meta.boundary} />
          <Field label="Report Status" value={<StatusBadge status={reportStatus} />} />
        </div>
      </SectionCard>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Kpi testid="kpi-verified-total" label="Verified Total Footprint" value={`${verifiedTotal} tCO2e`} tone="green" />
        <Kpi testid="kpi-verified-intensity" label="Verified PCF Intensity" value={`${verifiedIntensity} kgCO2e/kg`} tone="green" />
        <Kpi testid="kpi-final-version" label="Final Calculation Version" value="V1.0" hint="as submitted" />
        <Kpi testid="kpi-verification-status" label="Verification Status" value={reportStatus} tone={isReleased ? "green" : "amber"} />
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        <SectionCard title="Report Sections" className="lg:col-span-2" testid="report-sections">
          <ol className="grid gap-2 sm:grid-cols-2 text-xs">
            {SECTIONS.map((s, i) => (
              <li key={s} className="flex items-center gap-2 text-slate-600">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-50 text-[10px] font-bold text-emerald-700">{i + 1}</span>
                {s}
              </li>
            ))}
          </ol>
        </SectionCard>

        <SectionCard title="Report Actions" testid="report-actions">
          <div className="space-y-2 text-xs">
            <button
              onClick={() => setPreviewOpen(true)}
              className="w-full py-2.5 px-3 rounded-xl border border-slate-200 hover:bg-slate-50 flex items-center gap-2 font-semibold text-slate-700"
            >
              <Eye className="h-4 w-4 text-emerald-600" /> Preview Report
            </button>
            <button
              onClick={download}
              className="w-full py-2.5 px-3 rounded-xl border border-slate-200 hover:bg-slate-50 flex items-center gap-2 font-semibold text-slate-700"
            >
              <Download className="h-4 w-4 text-emerald-600" /> Download Verification Report
            </button>
            <button
              onClick={() => setAuditOpen(true)}
              className="w-full py-2.5 px-3 rounded-xl border border-slate-200 hover:bg-slate-50 flex items-center gap-2 font-semibold text-slate-700"
            >
              <History className="h-4 w-4 text-emerald-600" /> View Audit Trail
            </button>
          </div>
        </SectionCard>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-emerald-300 bg-emerald-50 p-5">
        <div className="flex items-center gap-3">
          <BadgeCheck className="h-8 w-8 text-emerald-600" />
          <div>
            <p className="text-lg font-extrabold text-emerald-800">Carbon Passport Unlocked</p>
            <p className="text-xs text-emerald-700">Verified result feeds digital passport issuance.</p>
          </div>
        </div>
        <button
          onClick={() => navigate("/passport")}
          className="px-4 py-2 bg-emerald-600 text-white font-bold text-xs rounded-xl hover:bg-emerald-700"
        >
          Open Carbon Passports →
        </button>
      </div>

      {/* Preview Modal */}
      {previewOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex justify-end z-50">
          <div className="bg-white w-full max-w-xl h-full p-6 overflow-y-auto space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-base">Report Preview — {meta.engagementId}</h3>
              <button onClick={() => setPreviewOpen(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>
            <div className="bg-slate-50 p-4 rounded-xl space-y-3 text-xs">
              <p className="font-bold text-slate-900">INDEPENDENT VERIFICATION STATEMENT</p>
              <p className="text-slate-600">
                Based on the procedures performed, nothing has come to our attention that causes us to believe the PCF of {verifiedIntensity} kgCO2e/kg ({verifiedTotal} tCO2e, {meta.boundary}) is materially misstated.
              </p>
              <Field label="Lead Verifier" value={meta.leadVerifier} />
              <Field label="Technical Reviewer" value={meta.technicalReviewer} />
              <Field label="Organisation" value={meta.verifierOrg} />
            </div>
            <div className="pt-4 flex justify-end">
              <button
                onClick={() => setPreviewOpen(false)}
                className="px-4 py-2 bg-slate-900 text-white font-bold text-xs rounded-xl"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Audit Modal */}
      {auditOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex justify-end z-50">
          <div className="bg-white w-full max-w-xl h-full p-6 overflow-y-auto space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-base">Audit Log</h3>
              <button onClick={() => setAuditOpen(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>
            <div className="space-y-3 text-xs">
              {audit.map((a) => (
                <div key={a.id} className="border-l-2 border-emerald-500 pl-3 py-1">
                  <div className="flex justify-between font-bold text-slate-800">
                    <span>{a.action}</span>
                    <span className="text-[10px] text-slate-400">{a.ts}</span>
                  </div>
                  <p className="text-slate-500">{a.objectType} · {a.user} ({a.role})</p>
                </div>
              ))}
            </div>
            <div className="pt-4 flex justify-end">
              <button
                onClick={() => setAuditOpen(false)}
                className="px-4 py-2 bg-slate-900 text-white font-bold text-xs rounded-xl"
              >
                Close Log
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
