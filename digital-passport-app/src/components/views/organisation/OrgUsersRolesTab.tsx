import React, { useState, useEffect } from 'react';
import { getOrgUsers, saveOrgUser, updateOrgUserRole } from '../../../api/client';
import {
  UserPlus,
  Search,
  Check,
  X,
  Key,
  ShieldCheck,
  CheckCircle2,
  Lock,
  Building2,
  AlertCircle
} from 'lucide-react';

export interface UserMember {
  id: string;
  name: string;
  email: string;
  role: string;
  facilityScope: string;
  lastLogin: string;
  status: 'Active' | 'Pending' | 'Deactivated';
}

export const initialUsers: UserMember[] = [
  {
    id: 'USR-001',
    name: 'Amara Okafor',
    email: 'a.okafor@saurient-carbon.com',
    role: 'Organisation Admin',
    facilityScope: 'All Facilities (4 Sites)',
    lastLogin: '2026-09-28 15:40',
    status: 'Active',
  },
  {
    id: 'USR-002',
    name: 'Dr. Lena Hoffmann',
    email: 'l.hoffmann@saurient-carbon.com',
    role: 'Compliance Manager',
    facilityScope: 'All Facilities (4 Sites)',
    lastLogin: '2026-09-28 14:12',
    status: 'Active',
  },
  {
    id: 'USR-003',
    name: 'Kwame Mensah',
    email: 'k.mensah@saurient-carbon.com',
    role: 'Facility Manager',
    facilityScope: 'Tema Processing Plant',
    lastLogin: '2026-09-27 11:05',
    status: 'Active',
  },
  {
    id: 'USR-004',
    name: 'Abena Serwaa',
    email: 'a.serwaa@saurient-carbon.com',
    role: 'Data Operator',
    facilityScope: 'Kumasi Materials Hub',
    lastLogin: '2026-09-26 09:30',
    status: 'Active',
  },
  {
    id: 'USR-005',
    name: 'Bureau Veritas Lead',
    email: 'auditor@bureauveritas.com',
    role: 'Verifier',
    facilityScope: 'Tema & Kumasi Sites',
    lastLogin: '2026-09-18 16:00',
    status: 'Active',
  },
];

export const rolesList = [
  { name: 'Organisation Admin', desc: 'Full administrative access across entity profile, settings, and user role provisioning.' },
  { name: 'Compliance Manager', desc: 'Manages CBAM verification readiness, evidence dossiers, and declarant links.' },
  { name: 'Facility Manager', desc: 'Oversees site telemetry, process lines, and facility data completeness.' },
  { name: 'Carbon Manager', desc: 'Configures GHG calculation rulebooks, emission factors, and PCF models.' },
  { name: 'Data Operator', desc: 'Uploads activity data, CSV logs, and resolves minor unit anomalies.' },
  { name: 'Verifier', desc: 'External accredited third-party auditor with review and sign-off rights.' },
  { name: 'Auditor', desc: 'Read-only access to immutable audit trails, SHA256 manifests, and certificates.' },
  { name: 'Viewer', desc: 'Read-only dashboard access for general stakeholders.' },
];

export const permissionsMatrix = [
  { key: 'view', label: 'View Data', allowedRoles: ['Organisation Admin', 'Compliance Manager', 'Facility Manager', 'Carbon Manager', 'Data Operator', 'Verifier', 'Auditor', 'Viewer'] },
  { key: 'create', label: 'Create Records', allowedRoles: ['Organisation Admin', 'Compliance Manager', 'Facility Manager', 'Carbon Manager', 'Data Operator'] },
  { key: 'edit', label: 'Edit Drafts', allowedRoles: ['Organisation Admin', 'Compliance Manager', 'Facility Manager', 'Carbon Manager', 'Data Operator'] },
  { key: 'submit', label: 'Submit for Review', allowedRoles: ['Organisation Admin', 'Compliance Manager', 'Facility Manager', 'Carbon Manager'] },
  { key: 'verify', label: 'Verify / Sign-off', allowedRoles: ['Organisation Admin', 'Compliance Manager', 'Verifier'] },
  { key: 'approve', label: 'Approve & Close Period', allowedRoles: ['Organisation Admin', 'Compliance Manager'] },
  { key: 'issue', label: 'Issue Passport', allowedRoles: ['Organisation Admin', 'Compliance Manager'] },
  { key: 'revoke', label: 'Revoke Passport', allowedRoles: ['Organisation Admin'] },
  { key: 'export', label: 'Export Dossiers', allowedRoles: ['Organisation Admin', 'Compliance Manager', 'Facility Manager', 'Carbon Manager', 'Verifier', 'Auditor'] },
];

const getInitialUsers = (): UserMember[] => {
  const activeTenant = localStorage.getItem('saurient_tenant_id') || 'org_saurient_demo';
  const stored = localStorage.getItem('saurient_registered_company');
  const loggedEmail = localStorage.getItem('saurient_user_email');
  const loggedName = localStorage.getItem('saurient_user_name');
  const loggedRole = localStorage.getItem('saurient_user_role') || 'Organisation Admin';

  if (stored) {
    try {
      const c = JSON.parse(stored);
      if (!c.tenantId || c.tenantId === activeTenant) {
        return [
          {
            id: 'USR-REG-001',
            name: c.ownerName || `${c.ownerFirstName || 'Org'} ${c.ownerLastName || 'Admin'}`.trim() || 'Organisation Admin',
            email: c.ownerEmail || 'admin@saurient.io',
            role: 'Organisation Admin',
            facilityScope: 'All Facilities',
            lastLogin: 'Active Now',
            status: 'Active',
          },
        ];
      }
    } catch (e) {
      console.warn('Failed to parse registered user:', e);
    }
  }

  if (loggedEmail) {
    return [
      {
        id: localStorage.getItem('saurient_user_id') || 'USR-CURRENT',
        name: loggedName || 'Admin User',
        email: loggedEmail,
        role: loggedRole,
        facilityScope: 'All Facilities',
        lastLogin: 'Active Now',
        status: 'Active',
      },
    ];
  }

  return [];
};

export const OrgUsersRolesTab: React.FC = () => {
  const loggedInEmail = localStorage.getItem('saurient_user_email') || '';
  const loggedInName = localStorage.getItem('saurient_user_name') || 'Organisation Admin';
  const loggedInRole = localStorage.getItem('saurient_user_role') || 'Organisation Admin';
  const activeTenant = localStorage.getItem('saurient_tenant_id') || 'org_saurient_demo';

  const [users, setUsers] = useState<UserMember[]>(getInitialUsers());
  const [activeTab, setActiveTab] = useState<'users' | 'matrix'>('users');
  const [actingRole, setActingRole] = useState<string>(() => localStorage.getItem('saurient_user_role') || 'Organisation Admin');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUserForRole, setSelectedUserForRole] = useState<UserMember | null>(null);
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<{ text: string; type: 'success' | 'info' } | null>(null);

  // Invite / Add User Form State
  const [inviteName, setInviteName] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('Data Operator');
  const [inviteScope, setInviteScope] = useState('All Facilities');
  const [invitePassword, setInvitePassword] = useState('');
  const [isSavingUser, setIsSavingUser] = useState(false);

  useEffect(() => {
    const initUsers = getInitialUsers();

    getOrgUsers()
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          const map = new Map<string, UserMember>();
          data.forEach((u: any) => {
            const member: UserMember = {
              id: u.id || u.userID || `USR-${Math.random().toString(36).slice(2, 6)}`,
              name: u.name,
              email: u.email,
              role: u.role || 'Organisation Admin',
              facilityScope: u.facility_scope || u.facilityScope || 'All Facilities',
              lastLogin: u.last_login || u.lastLogin || 'Active',
              status: (u.status === 'ACTIVE' || u.status === 'Active') ? 'Active' : 'Pending',
            };
            map.set(member.email.toLowerCase(), member);
          });
          initUsers.forEach((u) => {
            if (!map.has(u.email.toLowerCase())) {
              map.set(u.email.toLowerCase(), u);
            }
          });
          setUsers(Array.from(map.values()));
        } else if (initUsers.length > 0) {
          setUsers(initUsers);
        } else {
          if (activeTenant === 'org_saurient_demo' || activeTenant === 'org_asante_cocoa') {
            setUsers(initialUsers);
          } else {
            setUsers(initUsers);
          }
        }
      })
      .catch((err) => {
        console.warn('Failed to fetch users from backend, fallback to local:', err);
        if (initUsers.length > 0) {
          setUsers(initUsers);
        }
      });
  }, [activeTenant]);

  const filteredUsers = users.filter(
    (u) =>
      (u.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (u.email || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (u.role || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim() || !inviteName.trim()) return;

    setIsSavingUser(true);
    const newId = `usr-${Math.random().toString(36).substring(2, 10)}`;
    const newU: UserMember = {
      id: newId,
      name: inviteName.trim(),
      email: inviteEmail.trim(),
      role: inviteRole,
      facilityScope: inviteScope || 'All Facilities',
      lastLogin: 'Never',
      status: 'Active',
    };

    try {
      await saveOrgUser({
        ...newU,
        password: invitePassword.trim() || 'DemoPassword2026!',
      });
      setFeedbackMsg({
        text: `User "${newU.name}" successfully created with role "${newU.role}" in Nexus Datamodel. Credentials are active for login.`,
        type: 'success',
      });
    } catch (err) {
      console.warn('Backend save user failed, saving locally:', err);
      setFeedbackMsg({
        text: `User "${newU.name}" added with role "${newU.role}" (active in session).`,
        type: 'info',
      });
    } finally {
      setIsSavingUser(false);
    }

    setUsers((prev) => [...prev, newU]);
    setIsInviteOpen(false);
    setInviteName('');
    setInviteEmail('');
    setInvitePassword('');
    setInviteScope('All Facilities');
  };

  const handleUpdateRole = async (newRole: string) => {
    if (!selectedUserForRole) return;
    try {
      await updateOrgUserRole(selectedUserForRole.id, newRole);
      setFeedbackMsg({
        text: `Role for "${selectedUserForRole.name}" updated to "${newRole}" in Nexus Datamodel.`,
        type: 'success',
      });
    } catch (err) {
      console.warn('Backend update role failed, updating locally:', err);
      setFeedbackMsg({
        text: `Role for "${selectedUserForRole.name}" updated to "${newRole}".`,
        type: 'info',
      });
    }
    setUsers(users.map((u) => (u.id === selectedUserForRole.id ? { ...u, role: newRole } : u)));
    setSelectedUserForRole(null);
  };

  return (
    <div className="space-y-6">
      {/* Organisation Admin & RBAC Authority Banner */}
      <div className="bg-slate-900 text-white p-5 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 border border-slate-800 shadow-sm">
        <div className="flex items-start md:items-center gap-3">
          <div className="p-3 bg-purple-500/10 text-purple-400 rounded-xl border border-purple-500/20 shrink-0">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-black tracking-wide text-white uppercase">Organisation Administration & RBAC</span>
              <span className="bg-purple-500/20 text-purple-300 text-[10px] font-bold px-2 py-0.5 rounded border border-purple-500/30">
                Administrative Authority Active
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Active User: <strong className="text-white">{loggedInName}</strong> ({loggedInEmail}) • Role: <strong className="text-purple-300">{loggedInRole}</strong>.
              Use your administrative credentials to create users and assign operational roles across facilities.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <span className="text-xs text-slate-400 font-medium">Acting RBAC View:</span>
          <select
            value={actingRole}
            onChange={(e) => setActingRole(e.target.value)}
            className="bg-slate-800 border border-slate-700 text-white rounded-xl px-3 py-1.5 text-xs font-bold focus:outline-none focus:border-purple-500"
          >
            {rolesList.map((r) => (
              <option key={r.name} value={r.name}>
                {r.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Action Notification Banner */}
      {feedbackMsg && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-bold rounded-2xl flex items-center justify-between shadow-2xs">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{feedbackMsg.text}</span>
          </div>
          <button
            onClick={() => setFeedbackMsg(null)}
            className="text-emerald-700 hover:text-emerald-900 text-xs font-semibold px-2 py-0.5 rounded"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Internal Navigation Tabs & Top Actions */}
      <div className="flex items-center justify-between gap-4 border-b border-slate-200 pb-px">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('users')}
            className={`px-4 py-2 text-xs font-bold border-b-2 transition-colors ${
              activeTab === 'users'
                ? 'border-emerald-600 text-emerald-800 bg-emerald-50/50'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Organisation Users ({users.length})
          </button>
          <button
            onClick={() => setActiveTab('matrix')}
            className={`px-4 py-2 text-xs font-bold border-b-2 transition-colors ${
              activeTab === 'matrix'
                ? 'border-emerald-600 text-emerald-800 bg-emerald-50/50'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Roles & Permissions Matrix (8×9)
          </button>
        </div>

        {activeTab === 'users' && (
          <button
            onClick={() => setIsInviteOpen(true)}
            className="px-4 py-2 bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-2"
          >
            <UserPlus className="w-4 h-4" />
            <span>Add User to Organisation</span>
          </button>
        )}
      </div>

      {/* Users Tab View */}
      {activeTab === 'users' && (
        <div className="space-y-4">
          <div className="relative max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search member by name, email, or role..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-emerald-600 shadow-xs"
            />
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-[10px] font-mono uppercase text-slate-400 bg-slate-50">
                  <th className="py-3 px-4">Member Name & Email</th>
                  <th className="py-3 px-4">Assigned Role</th>
                  <th className="py-3 px-4">Facility Access Scope</th>
                  <th className="py-3 px-4">Last Active</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3.5 px-4">
                      <span className="font-bold text-slate-900 block">{u.name}</span>
                      <span className="font-mono text-[11px] text-slate-500">{u.email}</span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`font-bold px-2.5 py-1 rounded-md text-[11px] border ${
                        u.role === 'Organisation Admin'
                          ? 'bg-purple-50 text-purple-800 border-purple-200'
                          : u.role === 'Verifier'
                          ? 'bg-blue-50 text-blue-800 border-blue-200'
                          : 'bg-slate-100 text-slate-800 border-slate-200'
                      }`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 font-medium">{u.facilityScope}</td>
                    <td className="py-3.5 px-4 font-mono text-[11px] text-slate-500">{u.lastLogin}</td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                          u.status === 'Active'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-amber-50 text-amber-700 border-amber-200'
                        }`}
                      >
                        {u.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => setSelectedUserForRole(u)}
                        className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg text-[11px] transition-colors"
                      >
                        Assign Role
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Matrix Tab View */}
      {activeTab === 'matrix' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-6">
          <div>
            <h3 className="font-bold text-slate-900 text-base">RBAC Capability Matrix (8 Roles × 9 Permissions)</h3>
            <p className="text-xs text-slate-500">Fine-grained operational permissions governing the Carbon Passport platform</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border border-slate-200 rounded-xl overflow-hidden">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-mono uppercase text-slate-500">
                  <th className="py-3 px-4 w-48">Capability / Action</th>
                  {rolesList.map((r) => (
                    <th key={r.name} className="py-3 px-2 text-center w-28">
                      <span className="block truncate font-bold text-slate-900">{r.name}</span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {permissionsMatrix.map((p) => (
                  <tr key={p.key} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-4 font-bold text-slate-900 bg-slate-50/50">{p.label}</td>
                    {rolesList.map((r) => {
                      const isAllowed = p.allowedRoles.includes(r.name);
                      return (
                        <td key={r.name} className="py-3 px-2 text-center">
                          {isAllowed ? (
                            <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-emerald-100 text-emerald-700">
                              <Check className="w-3.5 h-3.5" />
                            </span>
                          ) : (
                            <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-slate-100 text-slate-300">
                              <X className="w-3.5 h-3.5" />
                            </span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add User Modal */}
      {isInviteOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
            <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-emerald-700" />
                <h3 className="font-bold text-slate-900 text-sm">Add User to Organisation</h3>
              </div>
              <button onClick={() => setIsInviteOpen(false)} className="p-1 text-slate-400 hover:text-slate-600 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddUser} className="p-5 space-y-4 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Kwame Mensah"
                  value={inviteName}
                  onChange={(e) => setInviteName(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-emerald-600"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Corporate Email Address</label>
                <input
                  type="email"
                  required
                  placeholder="k.mensah@company.com"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-emerald-600"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Assign User Role</label>
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-slate-900 bg-white focus:outline-none focus:border-emerald-600 font-medium"
                >
                  {rolesList.map((r) => (
                    <option key={r.name} value={r.name}>
                      {r.name} — {r.desc.slice(0, 40)}...
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Facility Access Scope</label>
                <input
                  type="text"
                  placeholder="e.g. Tema Processing Plant or All Facilities"
                  value={inviteScope}
                  onChange={(e) => setInviteScope(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-emerald-600"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Initial Password (Optional)</label>
                <input
                  type="password"
                  placeholder="Enter initial temporary password"
                  value={invitePassword}
                  onChange={(e) => setInvitePassword(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-emerald-600"
                />
                <p className="text-[10px] text-slate-400 mt-1">
                  Credentials are cryptographically salted and hashed into the Nexus User node.
                </p>
              </div>

              <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsInviteOpen(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-700 font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingUser}
                  className="px-4 py-2 bg-emerald-800 hover:bg-emerald-900 disabled:opacity-60 text-white font-bold rounded-xl shadow-xs flex items-center gap-1.5"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>{isSavingUser ? 'Persisting to Nexus...' : 'Add User'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Assign Role Modal */}
      {selectedUserForRole && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-sm rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
            <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <h3 className="font-bold text-slate-900 text-sm">Assign Role to {selectedUserForRole.name}</h3>
              <button onClick={() => setSelectedUserForRole(null)} className="p-1 text-slate-400 hover:text-slate-600 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-3 text-xs">
              <span className="text-slate-500 font-medium block">Select role capability level:</span>
              <div className="space-y-1.5 max-h-64 overflow-y-auto pr-1">
                {rolesList.map((r) => (
                  <button
                    key={r.name}
                    type="button"
                    onClick={() => handleUpdateRole(r.name)}
                    className={`w-full text-left p-2.5 rounded-xl border transition-colors ${
                      selectedUserForRole.role === r.name
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-900 font-bold'
                        : 'border-slate-200 hover:bg-slate-50 text-slate-700 font-medium'
                    }`}
                  >
                    <span className="block">{r.name}</span>
                    <span className="text-[10px] text-slate-400 font-normal block truncate">{r.desc}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
