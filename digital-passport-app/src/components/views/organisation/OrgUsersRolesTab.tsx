import React, { useState, useEffect } from 'react';
import { getOrgUsers, saveOrgUser, updateOrgUserRole } from '../../../api/client';
import {
  UserPlus,
  Search,
  Check,
  X,
  Key
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
  { name: 'Organisation Admin', desc: 'Full administrative access across all settings, billing, and user management.' },
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
  const stored = localStorage.getItem('saurient_registered_company');
  if (stored) {
    try {
      const c = JSON.parse(stored);
      return [
        {
          id: 'USR-REG-001',
          name: c.ownerName || 'Account Admin',
          email: c.ownerEmail || 'admin@saurient.io',
          role: c.ownerRole || 'Organisation Admin',
          facilityScope: 'All Facilities',
          lastLogin: 'Active Now',
          status: 'Active',
        },
      ];
    } catch (e) {
      console.warn('Failed to parse registered user:', e);
    }
  }
  return [];
};

export const OrgUsersRolesTab: React.FC = () => {
  const [users, setUsers] = useState<UserMember[]>(getInitialUsers());
  const [activeTab, setActiveTab] = useState<'users' | 'matrix'>('users');
  const [actingRole, setActingRole] = useState<string>('Organisation Admin');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUserForRole, setSelectedUserForRole] = useState<UserMember | null>(null);
  const [isInviteOpen, setIsInviteOpen] = useState(false);

  useEffect(() => {
    const initUsers = getInitialUsers();
    setUsers(initUsers);

    getOrgUsers()
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setUsers(data);
        } else if (initUsers.length > 0) {
          setUsers(initUsers);
        } else if (Array.isArray(data)) {
          setUsers([]);
        }
      })
      .catch((err) => console.warn('Failed to fetch users from backend:', err));
  }, []);

  // Invite form
  const [inviteName, setInviteName] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('Data Operator');

  const filteredUsers = users.filter(
    (u) =>
      (u.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (u.email || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (u.role || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleInviteUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail) return;

    const newU: UserMember = {
      id: `USR-00${users.length + 1}`,
      name: inviteName || 'New Teammate',
      email: inviteEmail,
      role: inviteRole,
      facilityScope: 'All Facilities',
      lastLogin: 'Never',
      status: 'Pending',
    };

    try {
      await saveOrgUser(newU);
    } catch (err) {
      console.warn('Backend save user failed, saving locally:', err);
    }

    setUsers([...users, newU]);
    setIsInviteOpen(false);
    setInviteName('');
    setInviteEmail('');
  };

  const handleUpdateRole = async (newRole: string) => {
    if (!selectedUserForRole) return;
    try {
      await updateOrgUserRole(selectedUserForRole.id, newRole);
    } catch (err) {
      console.warn('Backend update role failed, updating locally:', err);
    }
    setUsers(users.map((u) => (u.id === selectedUserForRole.id ? { ...u, role: newRole } : u)));
    setSelectedUserForRole(null);
  };

  return (
    <div className="space-y-6">
      {/* Active Role Switcher (RBAC Banner) */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-emerald-50 text-emerald-800 rounded-xl">
            <Key className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono font-bold uppercase text-slate-400">RBAC Role Context</span>
              <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold px-2 py-0.5 rounded">
                ACTIVE SESSION
              </span>
            </div>
            <h3 className="text-sm font-bold text-slate-900">Acting Role: <span className="text-emerald-800">{actingRole}</span></h3>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs font-semibold text-slate-500 hidden sm:inline">Switch Acting Role:</span>
          <select
            value={actingRole}
            onChange={(e) => setActingRole(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:border-emerald-600"
          >
            {rolesList.map((r) => (
              <option key={r.name} value={r.name}>
                {r.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Internal Navigation Tabs */}
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
            Team Members ({users.length})
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
            <span>Invite Team Member</span>
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
                      <span className="bg-slate-100 text-slate-800 font-bold px-2.5 py-1 rounded-md text-[11px] border border-slate-200">
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

      {/* Invite Member Modal */}
      {isInviteOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
            <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <h3 className="font-bold text-slate-900 text-sm">Invite Team Member</h3>
              <button onClick={() => setIsInviteOpen(false)} className="p-1 text-slate-400 hover:text-slate-600 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleInviteUser} className="p-5 space-y-4 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Full Name</label>
                <input
                  type="text"
                  placeholder="e.g. Kwame Asante"
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
                  placeholder="k.asante@saurient-carbon.com"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-emerald-600"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Assign Initial Role</label>
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-slate-900 bg-white focus:outline-none focus:border-emerald-600"
                >
                  {rolesList.map((r) => (
                    <option key={r.name} value={r.name}>
                      {r.name}
                    </option>
                  ))}
                </select>
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
                  className="px-4 py-2 bg-emerald-800 hover:bg-emerald-900 text-white font-bold rounded-xl shadow-xs"
                >
                  Send Invitation
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
              <span className="text-slate-500 font-medium block">Select new role capability level:</span>
              <div className="space-y-1.5 max-h-60 overflow-y-auto pr-1">
                {rolesList.map((r) => (
                  <button
                    key={r.name}
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
