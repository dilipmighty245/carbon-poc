import React, { useState } from 'react';
import { ShieldCheck } from 'lucide-react';
import { useMrv } from '../../../../context/MrvContext';
import { CONFLICT_ITEMS } from '../../../../data/mrvMockData';
import { StatusBadge, Field, SectionCard } from '../shared';

export const ConflictCheckTab: React.FC = () => {
  const { meta, engagement } = useMrv();
  const [answers, setAnswers] = useState<Record<number, string>>(
    CONFLICT_ITEMS.reduce((acc, _, idx) => ({ ...acc, [idx]: 'NO' }), {})
  );

  const anyYes = Object.values(answers).some((a) => a === 'YES');
  const result = anyYes ? "POTENTIAL CONFLICT" : "NO CONFLICT IDENTIFIED";

  return (
    <div className="space-y-5">
      <SectionCard testid="conflict-header">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-6">
            <Field label="Engagement" value={meta.engagementId} mono />
            <Field label="Verifier" value={meta.verifierOrg} />
          </div>
          <StatusBadge status={result} className="text-sm" />
        </div>
      </SectionCard>

      <SectionCard title="Conflict Checklist" testid="conflict-checklist">
        <div className="space-y-3">
          {CONFLICT_ITEMS.map((q, i) => (
            <div key={i} className="rounded-xl border border-slate-200 p-4 flex flex-wrap items-center justify-between gap-3 text-xs">
              <p className="font-semibold text-slate-800 text-sm">{q}</p>
              <div className="flex gap-1.5">
                {["YES", "NO", "N/A"].map((opt) => (
                  <button
                    key={opt}
                    onClick={() => setAnswers((prev) => ({ ...prev, [i]: opt }))}
                    className={`rounded-full border px-3 py-1 text-xs font-bold transition-colors ${
                      answers[i] === opt
                        ? opt === "YES"
                          ? "border-red-400 bg-red-500 text-white"
                          : "border-emerald-500 bg-emerald-600 text-white"
                        : "border-slate-200 bg-white text-slate-500 hover:border-slate-300"
                    }`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </SectionCard>

      <div className="grid gap-5 lg:grid-cols-3">
        <SectionCard title="Conflict Declaration" className="lg:col-span-2" testid="conflict-declaration">
          <div className="grid grid-cols-2 gap-4 text-xs">
            <Field label="Verifier" value={meta.verifierOrg} />
            <Field label="Date" value="2026-04-22" />
            <Field label="Digital Approval Record" value="SIG-CFL-026 · signed" mono />
            <Field label="Supporting Document" value="EVD-00132" mono />
          </div>
          <p className="mt-3 rounded-lg bg-slate-50 p-3 text-xs text-slate-600">
            The verification team declares that it has assessed all independence risks in relation to {meta.organisation} and confirms it can perform this engagement objectively and impartially in accordance with ISO 14064-3.
          </p>
        </SectionCard>

        <div className={`rounded-2xl border p-5 ${result.includes("NO CONFLICT") ? "border-emerald-200 bg-emerald-50" : "border-amber-200 bg-amber-50"}`}>
          <ShieldCheck className={`h-8 w-8 ${result.includes("NO CONFLICT") ? "text-emerald-600" : "text-amber-600"}`} />
          <p className="mt-3 text-lg font-extrabold text-slate-800">{result}</p>
          <p className="mt-1 text-xs text-slate-600">
            {result.includes("NO CONFLICT") ? "Independence confirmed — engagement may proceed." : "An unresolved blocking independence issue prevents the engagement from progressing."}
          </p>
          <button
            onClick={() => alert("Independence declaration recorded")}
            className="mt-4 w-full rounded-xl bg-emerald-600 px-4 py-2.5 font-bold text-white shadow-xs hover:bg-emerald-700 transition-colors text-xs"
          >
            Confirm & Save Declaration
          </button>
        </div>
      </div>
    </div>
  );
};
