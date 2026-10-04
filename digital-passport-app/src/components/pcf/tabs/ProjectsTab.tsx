import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePcf } from '../../../context/PcfContext';
import { useScenario } from '../../../context/ScenarioContext';
import { KpiCard } from '../common/KpiCard';
import { StatusChip } from '../common/StatusChip';
import { CreateProjectWizard } from '../CreateProjectWizard';
import { PROJECT_ROWS, PROJECT_KPIS } from '../../../data/pcfData';
import { STEEL_PROJECT_ROWS } from '../../../data/steelData';
import type { ProjectRow } from '../../../types/pcf';
import { FolderKanban, FileEdit, Calculator, Clock, BadgeCheck, MoreHorizontal } from 'lucide-react';
import { toast } from '../../../utils/toast';

interface ProjectsTabProps {
  registerPrimary: (fn: () => void) => void;
  search: string;
}

export function ProjectsTab({ registerPrimary, search }: ProjectsTabProps) {
  const { setActiveTab } = usePcf();
  const { scenario } = useScenario();
  const navigate = useNavigate();
  const [wizardOpen, setWizardOpen] = useState(false);

  useEffect(() => {
    registerPrimary(() => setWizardOpen(true));
  }, [registerPrimary]);

  const isSteel = scenario === 'steel';
  const projectRows = isSteel ? STEEL_PROJECT_ROWS : PROJECT_ROWS;

  const kpis = isSteel
    ? { total: 3, draft: 1, calcReady: 1, awaitingVerification: 0, verified: 1 }
    : PROJECT_KPIS;

  const rows = projectRows.filter((r) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return [r.id, r.product, r.batch, r.facility, r.status].some((v) =>
      String(v).toLowerCase().includes(q)
    );
  });

  const open = (r: ProjectRow) => {
    if (r.primary || r.id === 'PCF-ST-2026-001' || r.id === 'PCF-GH-2026-001') {
      toast.success(`Opened ${r.id} (${r.product})`);
      setActiveTab('output');
      navigate('/pcf?tab=output');
    } else {
      toast.info(`${r.id} is a demo record — only ${isSteel ? 'PCF-ST-2026-001' : 'PCF-GH-2026-001'} is fully populated.`);
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
        <KpiCard label="Total PCF Projects" value={kpis.total} icon={FolderKanban} testId="kpi-total" />
        <KpiCard label="Draft" value={kpis.draft} icon={FileEdit} testId="kpi-draft" />
        <KpiCard label="Calculation Ready" value={kpis.calcReady} icon={Calculator} testId="kpi-calcready" />
        <KpiCard label="Awaiting Verification" value={kpis.awaitingVerification} icon={Clock} testId="kpi-awaiting" />
        <KpiCard label="Verified" value={kpis.verified} accent icon={BadgeCheck} testId="kpi-verified" />
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">PCF Projects</h3>
          <button
            onClick={() => setWizardOpen(true)}
            data-testid="create-project-btn"
            className="px-3.5 py-1.5 bg-[#00E599] hover:bg-[#00c985] text-slate-950 font-bold text-xs rounded-xl shadow-xs transition-colors"
          >
            Create PCF Project
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/80 text-left text-[11px] uppercase tracking-wider text-slate-400 font-bold">
                {[
                  'PCF Project ID',
                  'Product',
                  'Batch',
                  'Facility',
                  'Production Qty',
                  'Boundary',
                  'PCF Intensity',
                  'Data Quality',
                  'Status',
                  'Verification',
                  'Actions',
                ].map((h) => (
                  <th key={h} className="whitespace-nowrap px-4 py-3 font-bold">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.map((r) => (
                <tr
                  key={r.id}
                  onClick={() => open(r)}
                  className={`cursor-pointer transition-colors ${
                    r.primary ? 'bg-emerald-50/20 hover:bg-emerald-50/40' : 'hover:bg-slate-50'
                  }`}
                >
                  <td className="whitespace-nowrap px-4 py-3 font-mono font-bold text-slate-900">{r.id}</td>
                  <td className="whitespace-nowrap px-4 py-3 font-bold text-slate-800">{r.product}</td>
                  <td className="whitespace-nowrap px-4 py-3 font-mono text-slate-600">{r.batch}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-slate-600 font-medium">{r.facility}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-slate-600 font-medium">{r.productionQuantity.toLocaleString()} kg</td>
                  <td className="whitespace-nowrap px-4 py-3 text-slate-600 font-medium">{r.boundary}</td>
                  <td className="whitespace-nowrap px-4 py-3 font-bold text-slate-900">{r.intensity} kgCO₂e/kg</td>
                  <td className="whitespace-nowrap px-4 py-3 font-bold text-emerald-600">{r.dataQuality}/100</td>
                  <td className="whitespace-nowrap px-4 py-3">
                    <StatusChip status={r.status} />
                  </td>
                  <td className="whitespace-nowrap px-4 py-3">
                    <StatusChip status={r.verification} />
                  </td>
                  <td className="whitespace-nowrap px-4 py-3">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        open(r);
                      }}
                      className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
                    >
                      <MoreHorizontal className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <CreateProjectWizard open={wizardOpen} onOpenChange={setWizardOpen} />
    </div>
  );
}
