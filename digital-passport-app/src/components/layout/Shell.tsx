import React from 'react';
import { NavLink, Link } from 'react-router-dom';
import { 
  LayoutDashboard, 
  PackagePlus, 
  Radio, 
  GitMerge, 
  FileCheck2, 
  Calculator, 
  QrCode, 
  Bell, 
  Leaf,
  LogOut,
  Building2,
  Database,
  BarChart3,
  Package,
  Users,
  Landmark,
  TrendingUp,
  ShieldCheck,
  UserPlus
} from 'lucide-react';

interface ShellProps {
  children: React.ReactNode;
}

export const Shell: React.FC<ShellProps> = ({ children }) => {
  const mainNavItems = [
    { to: '/', label: 'Executive Dashboard', icon: LayoutDashboard },
    { to: '/company-dashboard', label: 'Company Overview', icon: Building2 },
    { to: '/products/new', label: 'Product Batch Setup', icon: PackagePlus },
    { to: '/mrv', label: 'MRV Workflow', icon: GitMerge },
    { to: '/evidence', label: 'Evidence Audit', icon: FileCheck2 },
    { to: '/emissions', label: 'Emissions Engine', icon: Calculator },
    { to: '/passport/GH-CB-2024-001', label: 'Digital Carbon Passport', icon: QrCode },
  ];

  const platformNavItems = [
    { to: '/organisation', label: 'Organisation & Sites', icon: Users },
    { to: '/data', label: 'Integration Hub', icon: Database },
    { to: '/ghg', label: 'GHG Inventory', icon: BarChart3 },
    { to: '/pcf', label: 'Product Carbon Footprint', icon: Package },
    { to: '/suppliers', label: 'Supplier Network', icon: Users },
    { to: '/cbam', label: 'CBAM Compliance', icon: Landmark },
    { to: '/analytics', label: 'Analytics & Forecast', icon: TrendingUp },
    { to: '/admin', label: 'Governance & Admin', icon: ShieldCheck },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      {/* Top Navbar */}
      <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between sticky top-0 z-50 shadow-xs">
        <div className="flex items-center gap-3">
          <Link to="/" className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-md">
              <Leaf className="w-5 h-5" />
            </div>
            <div>
              <h1 className="font-bold text-lg text-slate-900 tracking-tight leading-none">Saurient</h1>
              <span className="text-xs font-medium text-slate-500">Carbon Passport Platform</span>
            </div>
          </Link>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden md:flex items-center gap-2 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-medium text-slate-700">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            Ghana Regional Hub
          </div>

          <Link
            to="/login"
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg border border-slate-200 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5 text-slate-500" />
            <span>Login Screen</span>
          </Link>

          <Link
            to="/registration"
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-800 bg-emerald-100 hover:bg-emerald-200 rounded-lg transition-colors"
          >
            <UserPlus className="w-3.5 h-3.5 text-emerald-600" />
            <span>Register</span>
          </Link>

          <button className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg relative transition-colors">
            <Bell className="w-4 h-4" />
            <span className="w-2 h-2 rounded-full bg-emerald-500 absolute top-2 right-2"></span>
          </button>

          <div className="flex items-center gap-3 pl-2 border-l border-slate-200">
            <div className="w-8 h-8 rounded-full bg-emerald-600 text-white font-semibold text-xs flex items-center justify-center shadow-xs">
              AK
            </div>
            <div className="hidden sm:block text-left">
              <p className="text-xs font-semibold text-slate-900 leading-tight">Ama K.</p>
              <p className="text-[10px] text-slate-500">Site Manager</p>
            </div>
          </div>
        </div>
      </header>

      <div className="flex flex-1">
        {/* Left Navigation Sidebar */}
        <aside className="w-64 bg-white border-r border-slate-200 p-4 space-y-4 hidden md:block shrink-0 overflow-y-auto max-h-[calc(100vh-4rem)]">
          <div>
            <p className="px-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">Core Platform</p>
            <div className="space-y-1">
              {mainNavItems.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.to === '/'}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-all ${
                        isActive
                          ? 'bg-emerald-50 text-emerald-700 font-bold shadow-xs border border-emerald-100'
                          : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                      }`
                    }
                  >
                    <Icon className="w-4 h-4" />
                    {item.label}
                  </NavLink>
                );
              })}
            </div>
          </div>

          <div>
            <p className="px-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">Modules & Reports</p>
            <div className="space-y-1">
              {platformNavItems.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                        isActive
                          ? 'bg-emerald-50 text-emerald-700 font-bold shadow-xs border border-emerald-100'
                          : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                      }`
                    }
                  >
                    <Icon className="w-3.5 h-3.5" />
                    {item.label}
                  </NavLink>
                );
              })}
            </div>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 p-6 overflow-x-hidden">
          {children}
        </main>
      </div>

      {/* Footer Branding */}
      <footer className="bg-white border-t border-slate-200 py-3 px-6 text-xs text-slate-500 flex items-center justify-between">
        <p>Real Data. Lower Emissions. Brighter Opportunities.</p>
        <p className="font-mono text-[10px] uppercase text-slate-400">Saurient Carbon Passport Platform</p>
      </footer>
    </div>
  );
};
