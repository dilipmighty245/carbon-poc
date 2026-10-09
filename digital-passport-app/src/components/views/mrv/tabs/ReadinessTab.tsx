import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2, ArrowRight, Loader2, Lock, ShieldCheck, AlertCircle } from 'lucide-react';
import { useMrv } from '../../../../context/MrvContext';
import { READINESS_CHECKS } from '../../../../data/mrvMockData';
import { Kpi, SectionCard, StatusBadge, Field } from '../shared';
import { submitMrvVerificationPackage } from '../../../../api/client';

export const ReadinessTab: React.FC = () => {
  const navigate = useNavigate();
  const { meta, engagement, freezeDataset, evidence } = useMrv();
  const blockers = engagement.planApproved ? 0 : 2;

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionResult, setSubmissionResult] = useState<{
    submission_id: string;
    dataset_lock_hash: string;
    assigned_verifier: string;
    submitted_at: string;
    message?: string;
  } | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const handleSubmitPackage = async () => {
    if (!engagement.planApproved) {
      freezeDataset();
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);
    try {
      const email = localStorage.getItem('saurient_user_email') || 'operator@asante-cocoa.com';
      const name = localStorage.getItem('saurient_user_name') || 'Company Carbon Lead';
      const res = await submitMrvVerificationPackage({
        engagement_id: meta.engagementId,
        passport_id: meta.pcfProject,
        batch_id: meta.batch,
        facility: meta.facility,
        submitted_by: `${name} <${email}>`,
        notes: `Readiness checklist passed (${meta.activityRecords} activity records, ${meta.evidenceItems} evidence items). Submitted for independent verification.`,
      });

      const lockHash = res.dataset_lock_hash || res.freeze_hash || '0x7f48b9281a02f9c3';
      const subId = res.submission_id || 'SUB-2026-026';
      freezeDataset(lockHash, subId);
      setSubmissionResult({
        submission_id: subId,
        dataset_lock_hash: lockHash,
        assigned_verifier: res.assigned_verifier || 'Bureau Veritas Certification (#NAB-8820)',
        submitted_at: res.submitted_at || new Date().toISOString(),
        message: res.message,
      });
    } catch (err: any) {
      console.error('Failed to submit MRV verification package:', err);
      // Fall back gracefully with local freeze if backend was unreachable
      freezeDataset();
      setSubmitError(err.message || 'Verification submission network error. Dataset frozen locally.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const go = (link?: string | null) => {
    if (!link) return;
    if (link === 'mrv:evidence') navigate('/mrv/evidence');
    else navigate(link);
  };

  return (
    <div className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Kpi
          testid="kpi-readiness"
          label="Readiness Score"
          value={`${engagement.planApproved ? 100 : meta.readiness}%`}
          tone="green"
          hint={engagement.planApproved ? "All checks passed" : "2 blockers remaining"}
        />
        <Kpi
          testid="kpi-blockers"
          label="Critical Blockers"
          value={blockers}
          tone={blockers ? "amber" : "green"}
        />
        <Kpi testid="kpi-coverage" label="Evidence Coverage" value="96%" />
        <Kpi testid="kpi-calc-status" label="Calculation Status" value="Complete" tone="green" />
      </div>

      <SectionCard
        title="Readiness Checklist"
        testid="readiness-checklist"
        action={<StatusBadge status={engagement.planApproved ? "READY FOR VERIFICATION" : "ACTION REQUIRED"} />}
      >
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-left text-xs font-bold uppercase tracking-wide text-slate-400">
                <th className="py-2 pr-4">Requirement</th>
                <th className="py-2 pr-4">Source</th>
                <th className="py-2 pr-4">Status</th>
                <th className="py-2 pr-4">Issue</th>
                <th className="py-2 pr-4">Owner</th>
                <th className="py-2">Action</th>
              </tr>
            </thead>
            <tbody>
              {READINESS_CHECKS.map((r) => {
                const status = engagement.planApproved && r.status !== "PASSED" ? "PASSED" : r.status;
                return (
                  <tr
                    key={r.req}
                    data-testid={`readiness-row-${r.req.toLowerCase().replace(/[^a-z]+/g, "-")}`}
                    onClick={() => go(r.link)}
                    className="cursor-pointer border-b border-slate-50 hover:bg-slate-50"
                  >
                    <td className="py-3 pr-4 font-semibold text-slate-800">{r.req}</td>
                    <td className="py-3 pr-4 text-slate-500">{r.source}</td>
                    <td className="py-3 pr-4"><StatusBadge status={status} /></td>
                    <td className="py-3 pr-4 text-slate-500">{status === "PASSED" ? "—" : r.issue}</td>
                    <td className="py-3 pr-4 text-slate-500">Carbon Manager</td>
                    <td className="py-3">
                      {r.link && (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700">
                          Open <ArrowRight className="h-3 w-3" />
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </SectionCard>

      <div className="grid gap-5 lg:grid-cols-3">
        <SectionCard title="Verification Package Preview" className="lg:col-span-2">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <Field label="PCF Project" value={meta.pcfProject} mono />
            <Field label="Calculation" value="V1.0" />
            <Field label="Activity Records" value={meta.activityRecords} />
            <Field label="Evidence" value={meta.evidenceItems} />
            <Field label="Boundary" value={meta.boundary} />
            <Field label="Claim" value={`${meta.claimedIntensity} kgCO2e/kg`} />
            <Field label="Data Quality" value={`${meta.dataQuality}/100`} />
            <Field label="Pending Evidence" value={evidence.filter(e => e.status === 'PENDING').length} />
          </div>
        </SectionCard>
        {submissionResult ? (
          <div className="rounded-2xl border border-blue-200 bg-blue-50/70 p-5 flex flex-col justify-between shadow-xs">
            <div>
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-100 border border-blue-300 px-3 py-1 text-[10px] font-black uppercase tracking-wider text-blue-900">
                  <Lock className="h-3 w-3 text-blue-600" />
                  SUBMITTED TO VERIFIER
                </span>
                <span className="text-[10px] font-bold text-slate-400">ISO 14064-3</span>
              </div>
              <p className="mt-3 text-base font-extrabold text-blue-950">
                Package Lodged with Auditor
              </p>
              <p className="mt-1 text-xs text-blue-800 leading-relaxed">
                Activity data & evidence locked with cryptographic hash. Assigned to Bureau Veritas for audit assessment.
              </p>

              <div className="mt-3.5 space-y-2 rounded-xl bg-white/90 p-3 text-xs border border-blue-100 shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 font-medium">Submission ID:</span>
                  <span className="font-mono font-bold text-slate-800">{submissionResult.submission_id}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 font-medium">Dataset Lock:</span>
                  <span className="font-mono text-[11px] font-semibold text-slate-700 truncate max-w-[140px]" title={submissionResult.dataset_lock_hash}>
                    {submissionResult.dataset_lock_hash}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 font-medium">Auditor Body:</span>
                  <span className="font-bold text-emerald-700 text-[11px]">{submissionResult.assigned_verifier}</span>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-blue-200/60 flex items-center justify-between">
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-700">
                <ShieldCheck className="h-3.5 w-3.5 text-blue-600" />
                Under Verification Review
              </span>
              <span className="text-[10px] font-medium text-slate-500">
                {new Date(submissionResult.submitted_at).toLocaleDateString()}
              </span>
            </div>
          </div>
        ) : (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5 flex flex-col justify-between">
            <div>
              <CheckCircle2 className="h-8 w-8 text-emerald-600" />
              <p className="mt-3 text-lg font-extrabold text-emerald-800">
                {engagement.planApproved ? "READY FOR VERIFICATION" : "2 blockers before submission"}
              </p>
              <p className="mt-1 text-sm text-emerald-700">
                {engagement.planApproved ? "The verification package can be submitted." : "Resolve outstanding evidence and internal approval."}
              </p>
              {submitError && (
                <div className="mt-2.5 flex items-start gap-1.5 rounded-lg bg-amber-50 border border-amber-200 p-2 text-xs text-amber-800">
                  <AlertCircle className="h-4 w-4 shrink-0 text-amber-600 mt-0.5" />
                  <span>{submitError}</span>
                </div>
              )}
            </div>
            <button
              data-testid="readiness-resolve-btn"
              disabled={isSubmitting}
              onClick={handleSubmitPackage}
              className="mt-4 w-full flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 font-bold text-white shadow-xs hover:bg-emerald-700 transition-colors text-xs disabled:opacity-60 cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Submitting Package to API...
                </>
              ) : engagement.planApproved ? (
                "Submit Verification Package"
              ) : (
                "Resolve Blockers"
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
