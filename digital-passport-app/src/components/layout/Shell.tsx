import React from 'react';
import { NavLink } from 'react-router-dom';
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
  PlusCircle
} from 'lucide-react';

interface ShellProps {
  children: React.ReactNode;
}

export const Shell: React.FC<ShellProps> = ({ children }) => {
  const userRole = localStorage.getItem('saurient_user_role') || localStorage.getItem('auth_role') || 'Company Operator';
  const isVerifier = userRole.toLowerCase().includes('verifier');
  const isOfficer = userRole.toLowerCase().includes('officer');
  const isOperator = !isVerifier && !isOfficer;

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
                isVerifier 
                  ? 'bg-indigo-400 text-slate-950' 
                  : isOfficer 
                  ? 'bg-amber-400 text-slate-950' 
                  : 'bg-emerald-400 text-slate-950'
              }`}>
                {isVerifier ? 'VERIFIER WORKSPACE' : isOfficer ? 'ISSUANCE AUTHORITY' : 'COMPANY WORKSPACE'}
              </span>
            </div>
            {isVerifier ? (
              <>
                <p className="text-xs font-bold text-white truncate">Bureau Veritas</p>
                <p className="text-[10px] text-slate-400 mt-0.5">Accredited Lead Auditor (#NAB-8820)</p>
              </>
            ) : (() => {
              const regStr = localStorage.getItem('saurient_registered_company');
              let compName = 'Saurient Carbon Passport';
              if (regStr) {
                try {
                  const c = JSON.parse(regStr);
                  if (c.legalName) compName = c.legalName;
                } catch (e) {}
              }
              return (
                <>
                  <p className="text-xs font-bold text-white truncate">{compName}</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    {isOfficer ? 'Passport Officer • Governance' : 'Company Operator • FY 2026'}
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
                {isVerifier ? 'Independent Verification (Bureau Veritas)' : 'Company Workspace'}
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
                  <span>Accredited Auditor: Bureau Veritas (#NAB-8820)</span>
                </span>
              )}

              <NavLink
                to="/login"
                className="text-xs font-bold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-2.5 py-1 rounded-lg transition-colors"
                title="Switch demo account"
              >
                Switch Role ({isVerifier ? 'Verifier' : isOfficer ? 'Officer' : 'Operator'})
              </NavLink>

              <button className="p-1.5 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg relative transition-colors">
                <Bell className="w-4 h-4" />
                <span className="w-2 h-2 rounded-full bg-emerald-500 absolute top-1.5 right-1.5"></span>
              </button>

              <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
                <div className={`w-7 h-7 rounded-full text-white font-semibold text-xs flex items-center justify-center ${
                  isVerifier ? 'bg-indigo-600' : isOfficer ? 'bg-amber-600' : 'bg-emerald-600'
                }`}>
                  {isVerifier ? 'V' : isOfficer ? 'P' : 'O'}
                </div>
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
