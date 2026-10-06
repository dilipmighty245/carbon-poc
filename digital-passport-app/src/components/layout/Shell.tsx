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
  const navItems = [
    { to: '/dashboard', label: 'Home', icon: Home, end: true },
    { to: '/products/new', label: 'Product Creation', icon: PlusCircle },
    { to: '/organisation', label: 'Organisation', icon: Building2 },
    { to: '/data', label: 'Data', icon: Database },
    { to: '/carbon-accounting', label: 'Carbon Accounting', icon: BarChart3 },
    { to: '/value-chain', label: 'Value Chain', icon: Package },
    { to: '/pcf', label: 'PCF', icon: Calculator },
    { to: '/cbam', label: 'CBAM', icon: Shield },
    { to: '/mrv', label: 'MRV & Verification', icon: GitMerge },
    { to: '/passport', label: 'Carbon Passports', icon: QrCode },
    { to: '/trace', label: 'Trace Carbon', icon: Network },
    { to: '/analytics', label: 'Analytics', icon: TrendingUp },
    { to: '/government', label: 'Government Policy', icon: Landmark },
    { to: '/paris-alignment', label: 'Paris Alignment', icon: Compass },
    { to: '/admin', label: 'Administration', icon: Settings },
  ];

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
              <span className="inline-block px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-wider text-slate-900 bg-white rounded-md shadow-xs">
                DEMO
              </span>
            </div>
            <p className="text-xs font-bold text-white truncate">Saurient Demo Manufacturing Ltd.</p>
            <p className="text-[10px] text-slate-400 mt-0.5">Company Operator • FY 2026</p>
          </div>
        </aside>

        {/* Main Content & Top Header Area */}
        <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
          {/* Top Bar */}
          <header className="h-14 bg-white border-b border-slate-200 px-6 flex items-center justify-between sticky top-0 z-40">
            <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
              <span>Home</span>
              <span>/</span>
              <span className="text-slate-900 font-semibold">Workspace Overview</span>
            </div>

            <div className="flex items-center gap-3">
              <NavLink 
                to="/products/new" 
                className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-colors shadow-xs"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Create Product Batch</span>
              </NavLink>

              <a 
                href="http://localhost:8080/swagger/" 
                target="_blank" 
                rel="noreferrer"
                className="hidden lg:flex items-center gap-1.5 bg-emerald-50 hover:bg-emerald-100 px-3 py-1 rounded-lg border border-emerald-200 text-xs font-bold text-emerald-800 transition-colors"
                title="Open OpenAPI / Swagger Gateway Documentation"
              >
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>REST API Gateway: localhost:8080</span>
              </a>

              <div className="hidden md:flex items-center gap-2 bg-slate-100 px-3 py-1 rounded-lg border border-slate-200 text-xs font-medium text-slate-700">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                Tema Processing Plant
              </div>

              <button className="p-1.5 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg relative transition-colors">
                <Bell className="w-4 h-4" />
                <span className="w-2 h-2 rounded-full bg-emerald-500 absolute top-1.5 right-1.5"></span>
              </button>

              <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
                <div className="w-7 h-7 rounded-full bg-emerald-600 text-white font-semibold text-xs flex items-center justify-center">
                  S
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
