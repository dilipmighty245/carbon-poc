import React, { useState } from 'react';
import {
  ShieldAlert,
  CheckCircle2,
  Clock,
  RotateCcw,
  XCircle,
  AlertTriangle,
  FileText,
  X,
  Send,
  User,
  Check,
  Building
} from 'lucide-react';

export interface ApprovalRequest {
  id: string;
  title: string;
  type: string;
  facility: string;
  submittedBy: { name: string; role: string; email: string };
  submittedDate: string;
  riskLevel: 'High' | 'Medium' | 'Low';
  status: 'Pending' | 'Approved' | 'Returned' | 'Rejected';
  whatChanged: { field: string; oldValue: string; newValue: string }[];
  evidence: string;
  history: { date: string; action: string; actor: string; comment?: string }[];
}

export const initialApprovals: ApprovalRequest[] = [
  {
    id: 'APR-2026-081',
    title: 'Recalculate 2025 Q4 Grid Emission Factor',
    type: 'Methodology Recalculation',
    facility: 'Tema Processing Plant',
    submittedBy: {
      name: 'Kwame Mensah',
      role: 'Plant Operations Manager',
      email: 'k.mensah@saurient-carbon.com',
    },
    submittedDate: '2026-09-27 10:15 UTC',
    riskLevel: 'High',
    status: 'Pending',
    whatChanged: [
      { field: 'Grid Factor (kWh)', oldValue: '0.380 kg CO₂e / kWh', newValue: '0.245 kg CO₂e / kWh' },
      { field: 'Base Year Attribution', oldValue: 'WAPP Grid Default', newValue: 'Solar 1.2 MW PPA Verified' },
    ],
    evidence: 'PPA_Solar_Contract_Tema_2026.pdf (SHA256: 0x9a8f...11b2)',
    history: [
      { date: '2026-09-27 10:15', action: 'Submitted', actor: 'Kwame Mensah', comment: 'Updated solar PPA proof attached.' },
    ],
  },
  {
    id: 'APR-2026-079',
    title: 'Precursor Verification Report Link (PRE-001)',
    type: 'Evidence Attachment',
    facility: 'Tema Processing Plant',
    submittedBy: {
      name: 'Abena Serwaa',
      role: 'Data Operator',
      email: 'a.serwaa@saurient-carbon.com',
    },
    submittedDate: '2026-09-26 14:30 UTC',
    riskLevel: 'Medium',
    status: 'Pending',
    whatChanged: [
      { field: 'Precursor Document', oldValue: 'UNVERIFIED', newValue: 'Verified Supplier Report VR-2026-001.pdf' },
    ],
    evidence: 'Supplier_Precursor_Report_VR-2026-001.pdf',
    history: [
      { date: '2026-09-26 14:30', action: 'Submitted', actor: 'Abena Serwaa', comment: 'Supplier provided verified lab report.' },
    ],
  },
  {
    id: 'APR-2026-075',
    title: '2026 Q1 Operational Data Lock Release',
    type: 'Period State Transition',
    facility: 'Kumasi Materials Hub',
    submittedBy: {
      name: 'Esi Badu',
      role: 'Facility Manager',
      email: 'e.badu@saurient-carbon.com',
    },
    submittedDate: '2026-09-20 09:00 UTC',
    riskLevel: 'Low',
    status: 'Approved',
    whatChanged: [
      { field: 'Period Status', oldValue: 'OPEN', newValue: 'DATA LOCKED' },
    ],
    evidence: 'Data_Freeze_Manifest_Q1_2026.json',
    history: [
      { date: '2026-09-20 09:00', action: 'Submitted', actor: 'Esi Badu' },
      { date: '2026-09-20 11:20', action: 'Approved', actor: 'Dr. Lena Hoffmann', comment: 'All telemetry feeds verified complete.' },
    ],
  },
];

export const OrgApprovalsTab: React.FC = () => {
  const [approvalsList, setApprovalsList] = useState<ApprovalRequest[]>(initialApprovals);
  const [filterStatus, setFilterStatus] = useState<string>('All');
  const [selectedRequest, setSelectedRequest] = useState<ApprovalRequest | null>(null);
  const [reviewComment, setReviewComment] = useState('');
  const [actionSuccessToast, setActionSuccessToast] = useState<string | null>(null);

  // Current acting role for SoD check (simulated)
  const currentActingRole = 'Compliance Manager'; // e.g. Dr. Lena Hoffmann

  const pendingCount = approvalsList.filter((a) => a.status === 'Pending').length;
  const approvedCount = approvalsList.filter((a) => a.status === 'Approved').length;
  const returnedCount = approvalsList.filter((a) => a.status === 'Returned').length;

  const filteredApprovals = approvalsList.filter((a) => {
    if (filterStatus === 'All') return true;
    return a.status === filterStatus;
  });

  const handleDecision = (action: 'Approved' | 'Returned' | 'Rejected') => {
    if (!selectedRequest) return;

    const updated = approvalsList.map((a) => {
      if (a.id === selectedRequest.id) {
        return {
          ...a,
          status: action,
          history: [
            ...a.history,
            {
              date: new Date().toISOString().replace('T', ' ').slice(0, 16),
              action: action,
              actor: 'Dr. Lena Hoffmann (Compliance Manager)',
              comment: reviewComment || `Request ${action.toLowerCase()} during review.`,
            },
          ],
        };
      }
      return a;
    });

    setApprovalsList(updated);
    setSelectedRequest(null);
    setReviewComment('');
    setActionSuccessToast(`Approval request ${selectedRequest.id} marked as ${action.toUpperCase()}.`);
    setTimeout(() => setActionSuccessToast(null), 4000);
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {actionSuccessToast && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-4 rounded-xl flex items-center justify-between text-xs font-semibold shadow-xs">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{actionSuccessToast}</span>
          </div>
          <button onClick={() => setActionSuccessToast(null)} className="text-emerald-600">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Segregation of Duties (SoD) Warning Banner */}
      <div className="p-4 bg-amber-50/80 border border-amber-200 rounded-2xl flex items-start gap-3 text-xs">
        <ShieldAlert className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
        <div>
          <h4 className="font-bold text-amber-900">Segregation of Duties (SoD) Enforced</h4>
          <p className="text-amber-800/90 font-medium mt-0.5">
            Under ISO 14065 & EU CBAM compliance rules, submitters cannot self-approve their own methodology or data change requests.
          </p>
        </div>
      </div>

      {/* Summary KPI Tiles as Clickable Filters */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div
          onClick={() => setFilterStatus('Pending')}
          className={`p-4 rounded-2xl border shadow-xs cursor-pointer transition-all flex items-center justify-between ${
            filterStatus === 'Pending' ? 'bg-amber-50 border-amber-300 ring-2 ring-amber-500/20' : 'bg-white border-slate-200 hover:border-amber-300'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-100 text-amber-800 rounded-xl">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-mono font-bold uppercase text-slate-400 block">Pending My Approval</span>
              <span className="text-xl font-black text-slate-900">{pendingCount} Requests</span>
            </div>
          </div>
        </div>

        <div
          onClick={() => setFilterStatus('Approved')}
          className={`p-4 rounded-2xl border shadow-xs cursor-pointer transition-all flex items-center justify-between ${
            filterStatus === 'Approved' ? 'bg-emerald-50 border-emerald-300 ring-2 ring-emerald-500/20' : 'bg-white border-slate-200 hover:border-emerald-300'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-100 text-emerald-800 rounded-xl">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-mono font-bold uppercase text-slate-400 block">Approved Changes</span>
              <span className="text-xl font-black text-slate-900">{approvedCount} Requests</span>
            </div>
          </div>
        </div>

        <div
          onClick={() => setFilterStatus('All')}
          className={`p-4 rounded-2xl border shadow-xs cursor-pointer transition-all flex items-center justify-between ${
            filterStatus === 'All' ? 'bg-slate-100 border-slate-300 ring-2 ring-slate-400/20' : 'bg-white border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-slate-100 text-slate-700 rounded-xl">
              <RotateCcw className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-mono font-bold uppercase text-slate-400 block">Total Requests Queue</span>
              <span className="text-xl font-black text-slate-900">{approvalsList.length} Requests</span>
            </div>
          </div>
        </div>
      </div>

      {/* Approval Requests Queue Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-slate-200 text-[10px] font-mono uppercase text-slate-400 bg-slate-50">
              <th className="py-3 px-4">Request ID & Title</th>
              <th className="py-3 px-4">Type & Facility</th>
              <th className="py-3 px-4">Submitted By</th>
              <th className="py-3 px-4">Risk Level</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredApprovals.map((a) => (
              <tr key={a.id} className="hover:bg-slate-50 transition-colors">
                <td className="py-3.5 px-4">
                  <span className="font-bold text-slate-900 block">{a.title}</span>
                  <span className="font-mono text-[10px] text-slate-400">{a.id}</span>
                </td>
                <td className="py-3.5 px-4">
                  <span className="font-medium text-slate-900 block">{a.type}</span>
                  <span className="text-[10px] text-slate-400 font-mono">{a.facility}</span>
                </td>
                <td className="py-3.5 px-4">
                  <span className="font-bold text-slate-900 block">{a.submittedBy.name}</span>
                  <span className="text-[10px] text-slate-400 font-mono">{a.submittedBy.role}</span>
                </td>
                <td className="py-3.5 px-4">
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                      a.riskLevel === 'High'
                        ? 'bg-rose-50 text-rose-700 border-rose-200'
                        : a.riskLevel === 'Medium'
                        ? 'bg-amber-50 text-amber-700 border-amber-200'
                        : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    }`}
                  >
                    {a.riskLevel} Risk
                  </span>
                </td>
                <td className="py-3.5 px-4">
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                      a.status === 'Approved'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : a.status === 'Pending'
                        ? 'bg-amber-50 text-amber-700 border-amber-200'
                        : 'bg-rose-50 text-rose-700 border-rose-200'
                    }`}
                  >
                    {a.status}
                  </span>
                </td>
                <td className="py-3.5 px-4 text-right">
                  <button
                    onClick={() => setSelectedRequest(a)}
                    className="px-3 py-1 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-lg text-[11px] transition-colors"
                  >
                    Review Request
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Review Diff Modal */}
      {selectedRequest && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-2xl rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
            <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div>
                <span className="text-[10px] font-mono font-bold text-slate-400 uppercase">{selectedRequest.id} · {selectedRequest.type}</span>
                <h3 className="font-bold text-slate-900 text-base">{selectedRequest.title}</h3>
              </div>
              <button onClick={() => setSelectedRequest(null)} className="p-1 text-slate-400 hover:text-slate-600 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-5 text-xs max-h-[70vh] overflow-y-auto">
              {/* Submitter Info */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-mono text-slate-400 block uppercase">Submitted By</span>
                  <span className="font-bold text-slate-900 block">{selectedRequest.submittedBy.name} ({selectedRequest.submittedBy.role})</span>
                </div>
                <span className="font-mono text-[10px] text-slate-500">{selectedRequest.submittedDate}</span>
              </div>

              {/* What Changed Diff Viewer */}
              <div className="space-y-2">
                <span className="text-[10px] font-mono font-bold text-slate-400 uppercase block">What Changed (Proposed Modifications)</span>
                <div className="space-y-2">
                  {selectedRequest.whatChanged.map((diff, idx) => (
                    <div key={idx} className="p-3 bg-slate-50 rounded-xl border border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <div className="p-2 bg-rose-50/70 rounded-lg border border-rose-100">
                        <span className="text-[9px] font-mono font-bold text-rose-700 block uppercase">Old Value ({diff.field})</span>
                        <span className="font-mono font-bold text-slate-800 block text-[11px] mt-0.5">{diff.oldValue}</span>
                      </div>
                      <div className="p-2 bg-emerald-50/70 rounded-lg border border-emerald-100">
                        <span className="text-[9px] font-mono font-bold text-emerald-700 block uppercase">New Proposed Value</span>
                        <span className="font-mono font-bold text-slate-900 block text-[11px] mt-0.5">{diff.newValue}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Evidence Document */}
              <div className="p-3 bg-emerald-50/50 rounded-xl border border-emerald-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-emerald-700" />
                  <span className="font-bold text-slate-900">{selectedRequest.evidence}</span>
                </div>
                <span className="text-[10px] font-mono font-bold text-emerald-700">VERIFIED PROOF</span>
              </div>

              {/* Reviewer Comments Form */}
              {selectedRequest.status === 'Pending' && (
                <div className="space-y-2 pt-2">
                  <label className="font-bold text-slate-800 block">Auditor / Reviewer Comments</label>
                  <textarea
                    rows={2}
                    placeholder="Provide compliance review comments or reason for approval / return..."
                    value={reviewComment}
                    onChange={(e) => setReviewComment(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl p-3 text-slate-900 focus:outline-none focus:border-emerald-600"
                  />
                </div>
              )}
            </div>

            {/* Modal Action Footer */}
            <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
              <button
                onClick={() => setSelectedRequest(null)}
                className="px-4 py-2 border border-slate-200 text-slate-700 font-bold rounded-xl"
              >
                Close
              </button>

              {selectedRequest.status === 'Pending' && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleDecision('Returned')}
                    className="px-4 py-2 bg-amber-100 hover:bg-amber-200 text-amber-900 font-bold rounded-xl"
                  >
                    Return for Correction
                  </button>
                  <button
                    onClick={() => handleDecision('Approved')}
                    className="px-5 py-2 bg-emerald-800 hover:bg-emerald-900 text-white font-bold rounded-xl shadow-xs"
                  >
                    Approve Change
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
