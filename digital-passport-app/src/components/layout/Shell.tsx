import React, { useState, useRef, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { 
  Home, 
  Building2, 
  Database, 
  BarChart3, 
  Package, 
  Calculator,
  Shield, 
  GitMerge, 
  QrCode, 
  TrendingUp, 
  Compass,
  Landmark,
  Settings,
  Bell,
  Network,
  PlusCircle,
  ChevronDown,
  LogOut,
  UserCheck
} from 'lucide-react';

interface ShellProps {
  children: React.ReactNode;
}

export const Shell: React.FC<ShellProps> = ({ children }) => {
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const userRole = localStorage.getItem('saurient_user_role') || localStorage.getItem('auth_role') || 'Company Operator';
  const roleNorm = userRole.toLowerCase().replace(/[\s_]/g, '');
  const isOrgOwner = roleNorm === 'organisationowner';
  const isOrgAdmin = roleNorm === 'organisationadmin';
  const isOwnerOrAdmin = isOrgOwner || isOrgAdmin;
  const isVerifier = userRole.toLowerCase().includes('verifier');
  const isOfficer = userRole.toLowerCase().includes('officer');
  const isOperator = !isVerifier && !isOfficer && !isOwnerOrAdmin;

  const userEmail = localStorage.getItem('saurient_user_email') || (
    isVerifier ? 'auditor@bureau-veritas.com' : isOfficer ? 'officer@saurient.com' : 'operator@asante-cocoa.com'
  );
  const userName = localStorage.getItem('saurient_user_name') || (
    isVerifier ? 'Sarah Jenkins' : isOfficer ? 'Helena Vance' : 'Kwame Mensah'
  );
  const userInitials = isVerifier ? 'V' : isOfficer ? 'P' : isOrgOwner ? 'O' : isOrgAdmin ? 'A' : 'O';

  const currentTenant = localStorage.getItem('saurient_tenant_id') || 'org_asante_cocoa';

  const verifierAgencyName = (() => {
    const custom = localStorage.getItem('saurient_verifier_agency');
    if (custom) return custom;
    if (userEmail.includes('@sgs')) return 'SGS Global Verification (#NAB-7410)';
    if (userEmail.includes('@tuv')) return 'TÜV Rheinland Energy (#NAB-9102)';
    if (userEmail.includes('@dnv')) return 'DNV Business Assurance (#NAB-6234)';
    if (userEmail.includes('@bureau-veritas')) return 'Bureau Veritas UK Ltd (#NAB-8820)';
    return 'Accredited Verification Body';
  })();

  const companyName = (() => {
    if (isVerifier) return verifierAgencyName;
    if (isOfficer) return 'Saurient Issuance Authority';
    if (currentTenant === 'org_asante_cocoa') return 'Asante Cocoa Ltd';
    if (currentTenant === 'org_saurient_demo') return 'Saurient Industrial Ltd';
    const regStr = localStorage.getItem('saurient_registered_company');
    if (regStr) {
      try {
        const c = JSON.parse(regStr);
        if (c.tenantId === currentTenant && c.legalName) return c.legalName;
        if (c.legalName) return c.legalName;
      } catch (e) {}
    }
    if (currentTenant && currentTenant !== 'tenant-default') {
      return currentTenant.replace(/^org_/, '').replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
    }
    return 'Saurient Carbon Passport';
  })();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, []);

  const handleLogout = () => {
    localStorage.clear();
    sessionStorage.clear();
    navigate('/login');
  };

  const verifierNavItems = [
    { to: '/mrv', label: 'Verification Queue', icon: GitMerge, end: true },
    { to: '/mrv/evidence', label: 'Evidence Vault', icon: Database },
    { to: '/mrv/calculation', label: 'Calculation Review', icon: Calculator },
    { to: '/mrv/findings', label: 'Findings Register', icon: Shield },
    { to: '/mrv/report', label: 'Verification Statement', icon: BarChart3 },
    { to: '/trace', label: 'Trace Lineage', icon: Network },
    { to: '/passport/registry', label: 'Public Registry', icon: QrCode },
  ];

  const operatorNavItems = [
    { to: '/dashboard', label: 'Home', icon: Home, end: true },
    { to: '/organisation', label: 'Organisation', icon: Building2 },
    { to: '/data', label: 'Data & Telemetry', icon: Database },
    { to: '/carbon-accounting', label: 'Carbon Accounting', icon: BarChart3 },
    { to: '/value-chain', label: 'Value Chain', icon: Package },
    { to: '/pcf', label: 'PCF Calculations', icon: Calculator },
    { to: '/cbam', label: 'CBAM Compliance', icon: Shield },
    { to: '/passport', label: 'Carbon Passports', icon: QrCode },
    { to: '/trace', label: 'Trace Carbon', icon: Network },
    { to: '/analytics', label: 'Analytics', icon: TrendingUp },
  ];

  const officerNavItems = [
    { to: '/dashboard', label: 'Home', icon: Home, end: true },
    { to: '/passport/registry', label: 'Passport Registry', icon: QrCode },
    { to: '/passport/sign-issue', label: 'Sign & Issue', icon: Shield },
    { to: '/trace', label: 'Trace Carbon', icon: Network },
    { to: '/cbam', label: 'CBAM Compliance', icon: BarChart3 },
    { to: '/analytics', label: 'Analytics', icon: TrendingUp },
  ];

  const navItems = isVerifier ? verifierNavItems : isOfficer ? officerNavItems : operatorNavItems;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <div className="flex flex-1 min-h-screen">
        {/* Left Navigation Sidebar - Dark Theme matching screenshot UI */}
        <aside className="w-64 bg-[#0C1322] text-white flex flex-col justify-between hidden md:flex shrink-0 border-r border-slate-800">
          <div>
            {/* Logo Header */}
            <div className="p-4 flex items-center gap-3.5 border-b border-slate-800/80">
              <img
                src="/saurient-logo.png"
                alt="Saurient Logo"
                className="w-20 h-20 object-contain rounded-2xl drop-shadow-xl shrink-0"
              />
              <div>
                <h1 className="font-black text-lg tracking-widest text-white uppercase leading-tight">SAURIENT</h1>
                <p className="text-xs text-emerald-400 font-bold tracking-wide">Carbon Passport</p>
              </div>
            </div>

            {/* Nav Menu */}
            <div className="p-3">
              <p className="px-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">WORKSPACE</p>
              <nav className="space-y-1">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      end={item.end}
                      className={({ isActive }) =>
                        `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs transition-all ${
                          isActive
                            ? 'bg-[#15342A] text-[#00E599] font-bold shadow-xs border border-emerald-500/20'
                            : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200 font-medium'
                        }`
                      }
                    >
                      <Icon className="w-4 h-4 shrink-0" />
                      <span>{item.label}</span>
                    </NavLink>
                  );
                })}
              </nav>
            </div>
          </div>

          {/* Footer Demo Info */}
          <div className="p-4 border-t border-slate-800/80">
            <div className="mb-2">
              <span className={`inline-block px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-wider rounded-md shadow-xs ${
                isOrgOwner
                  ? 'bg-purple-400 text-slate-950'
                  : isOrgAdmin
                  ? 'bg-purple-400 text-slate-950'
                  : isVerifier 
                  ? 'bg-indigo-400 text-slate-950' 
                  : isOfficer 
                  ? 'bg-amber-400 text-slate-950' 
                  : 'bg-emerald-400 text-slate-950'
              }`}>
                {isOrgOwner ? 'ORGANISATION OWNER' : isOrgAdmin ? 'ORGANISATION ADMIN' : isVerifier ? 'VERIFIER WORKSPACE' : isOfficer ? 'ISSUANCE AUTHORITY' : 'COMPANY WORKSPACE'}
              </span>
            </div>
            {isVerifier ? (
              <>
                <p className="text-xs font-bold text-white truncate">{verifierAgencyName}</p>
                <p className="text-[10px] text-slate-400 mt-0.5">Accredited Lead Auditor</p>
              </>
            ) : isOfficer ? (
              <>
                <p className="text-xs font-bold text-white truncate">Saurient Passport Authority</p>
                <p className="text-[10px] text-slate-400 mt-0.5">Independent Issuance Authority</p>
              </>
            ) : (() => {
              let compName = 'Saurient Carbon Passport';
              if (currentTenant === 'org_saurient_demo') {
                compName = 'Saurient Authority';
              } else if (currentTenant === 'org_asante_cocoa') {
                compName = 'Asante Cocoa Ltd';
              } else {
                const regStr = localStorage.getItem('saurient_registered_company');
                if (regStr) {
                  try {
                    const c = JSON.parse(regStr);
                    if (c.tenantId === currentTenant && c.legalName) compName = c.legalName;
                  } catch (e) {}
                }
              }
              return (
                <>
                  <p className="text-xs font-bold text-white truncate">{compName}</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    {isOrgOwner ? 'Organisation Owner • Entity Lead' : isOrgAdmin ? 'Organisation Admin • Enterprise Admin' : isOfficer ? 'Passport Officer • Governance' : 'Company Operator • FY 2026'}
                  </p>
                </>
              );
            })()}
          </div>
        </aside>

        {/* Main Content & Top Header Area */}
        <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
          {/* Top Bar */}
          <header className="h-14 bg-white border-b border-slate-200 px-6 flex items-center justify-between sticky top-0 z-40">
            <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
              <span>{isVerifier ? 'Verifier Portal' : 'Workspace'}</span>
              <span>/</span>
              <span className="text-slate-900 font-semibold">
                {isVerifier ? `Independent Verification (${verifierAgencyName.split(' ')[0]})` : isOwnerOrAdmin ? 'Organisation Administration' : 'Company Workspace'}
              </span>
            </div>

            <div className="flex items-center gap-3">
              {!isVerifier && (
                <NavLink 
                  to="/products/new" 
                  className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-colors shadow-xs"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>Create Product Batch</span>
                </NavLink>
              )}

              {isVerifier && (
                <span className="hidden sm:inline-flex items-center gap-1.5 bg-indigo-50 border border-indigo-200 text-indigo-900 px-3 py-1 rounded-lg text-xs font-bold">
                  <span className="w-2 h-2 rounded-full bg-indigo-600 animate-pulse"></span>
                  <span>Accredited Auditor: {verifierAgencyName}</span>
                </span>
              )}

              <button className="p-1.5 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg relative transition-colors" title="Notifications">
                <Bell className="w-4 h-4" />
                <span className="w-2 h-2 rounded-full bg-emerald-500 absolute top-1.5 right-1.5"></span>
              </button>

              {/* Interactive User Profile & Log Out Popover */}
              <div className="relative pl-2 border-l border-slate-200" ref={dropdownRef}>
                <button
                  type="button"
                  data-testid="user-profile-menu-button"
                  onClick={() => setDropdownOpen((prev) => !prev)}
                  className="flex items-center gap-2 p-1 rounded-xl hover:bg-slate-100 active:bg-slate-200 transition-colors cursor-pointer select-none focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  aria-expanded={dropdownOpen}
                  aria-haspopup="true"
                  title="Click to open user menu"
                >
                  <div
                    className={`w-8 h-8 rounded-full text-white font-black text-xs flex items-center justify-center shadow-xs ${
                      isOwnerOrAdmin ? 'bg-purple-600 ring-2 ring-purple-200' : isVerifier ? 'bg-indigo-600 ring-2 ring-indigo-200' : isOfficer ? 'bg-amber-600 ring-2 ring-amber-200' : 'bg-emerald-600 ring-2 ring-emerald-200'
                    }`}
                  >
                    {userInitials}
                  </div>
                  <div className="hidden sm:block text-left">
                    <p className="text-xs font-bold text-slate-800 leading-tight">
                      {userName}
                    </p>
                    <p className="text-[10px] text-slate-400 leading-tight">
                      {isOrgOwner ? 'Organisation Owner' : isOrgAdmin ? 'Organisation Admin' : isVerifier ? 'Accredited Verifier' : isOfficer ? 'Passport Officer' : 'Company Operator'}
                    </p>
                  </div>
                  <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${dropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                {/* Dropdown Menu Popover */}
                {dropdownOpen && (
                  <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-slate-200 py-1.5 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                    <div className="px-4 py-3 border-b border-slate-100 bg-slate-50/70">
                      <div className="flex items-center gap-2.5">
                        <div
                          className={`w-9 h-9 rounded-full text-white font-black text-sm flex items-center justify-center shrink-0 ${
                            isOwnerOrAdmin ? 'bg-purple-600' : isVerifier ? 'bg-indigo-600' : isOfficer ? 'bg-amber-600' : 'bg-emerald-600'
                          }`}
                        >
                          {userInitials}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-bold text-slate-900 truncate">{userName}</p>
                          <p className="text-[11px] text-slate-500 truncate mt-0.5">{userEmail}</p>
                        </div>
                      </div>
                      <div className="mt-2.5 flex items-center gap-1.5">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${
                            isOwnerOrAdmin
                              ? 'bg-purple-100 text-purple-800 border border-purple-200'
                              : isVerifier
                              ? 'bg-indigo-100 text-indigo-800 border border-indigo-200'
                              : isOfficer
                              ? 'bg-amber-100 text-amber-800 border border-amber-200'
                              : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                          }`}
                        >
                          {isOrgOwner ? 'Organisation Owner' : isOrgAdmin ? 'Organisation Admin' : isVerifier ? 'Accredited Verifier' : isOfficer ? 'Passport Officer' : 'Company Operator'}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-400 mt-1 truncate">
                        {companyName}
                      </p>
                    </div>

                    <div className="py-1">
                      {!isVerifier && (
                        <NavLink
                          to="/organisation"
                          onClick={() => setDropdownOpen(false)}
                          className="flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors"
                        >
                          <Building2 className="w-4 h-4 text-slate-400" />
                          <span>Organisation & Facility</span>
                        </NavLink>
                      )}

                      <NavLink
                        to="/login"
                        onClick={() => setDropdownOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors"
                      >
                        <UserCheck className="w-4 h-4 text-slate-400" />
                        <span>Switch Workspace / Role</span>
                      </NavLink>
                    </div>

                    <div className="pt-1 border-t border-slate-100">
                      <button
                        type="button"
                        data-testid="logout-button"
                        onClick={handleLogout}
                        className="w-full flex items-center gap-2.5 px-4 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50 hover:text-rose-700 transition-colors cursor-pointer text-left"
                      >
                        <LogOut className="w-4 h-4 text-rose-500" />
                        <span>Log Out</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </header>

          <main className="flex-1 p-6 overflow-x-hidden bg-slate-50">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
};
