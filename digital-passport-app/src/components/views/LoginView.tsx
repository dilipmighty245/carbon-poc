import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, AlertTriangle, Building, LogIn, Loader2, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { loginUser } from '../../api/client';

export const LoginView: React.FC = () => {
  const navigate = useNavigate();

  const [loginError, setLoginError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [registeredCompany, setRegisteredCompany] = useState<any | null>(null);

  const DEMO_ACCOUNTS: Record<string, { name: string; email: string; pass: string; route: string; desc: string; badge: string; tenantId: string }> = {
    'Company Operator': {
      name: 'Kofi Asante (Lead Operator)',
      email: 'operator@asante-cocoa.com',
      pass: 'DemoPassword2026!',
      route: '/company-dashboard',
      desc: 'Facility & ESG Operations',
      badge: 'Opens: Company Dashboard',
      tenantId: 'org_asante_cocoa',
    },
    'Verifier': {
      name: 'Sarah Jenkins (Lead Verifier)',
      email: 'auditor@bureau-veritas.com',
      pass: 'DemoPassword2026!',
      route: '/mrv',
      desc: 'Accredited Verifier (Bureau Veritas)',
      badge: 'Opens: Verifier MRV Portal',
      tenantId: 'tenant-verifier-agency',
    },
    'Passport Officer': {
      name: 'Dr. Elena Rostova',
      email: 'officer@saurient.com',
      pass: 'DemoPassword2026!',
      route: '/passport/sign-issue',
      desc: 'Issuance & Governance Authority',
      badge: 'Opens: Sign & Issue',
      tenantId: 'org_saurient_demo',
    },
    'Public Viewer': {
      name: 'Public Customs Auditor',
      email: '',
      pass: '',
      route: '/passport/registry',
      desc: 'Customs & Public Registry',
      badge: 'Opens: Public Registry',
      tenantId: 'public',
    },
  };

  const [role, setRole] = useState('Company Operator');
  const [email, setEmail] = useState(DEMO_ACCOUNTS['Company Operator'].email);
  const [password, setPassword] = useState(DEMO_ACCOUNTS['Company Operator'].pass);

  useEffect(() => {
    const regStr = localStorage.getItem('saurient_registered_company');
    if (regStr) {
      try {
        const parsed = JSON.parse(regStr);
        setRegisteredCompany(parsed);
      } catch (e) {
        console.warn('Failed to parse registered company:', e);
      }
    }
  }, []);

  const roles = [
    { 
      title: 'Company Operator', 
      desc: 'Facility & ESG Operations',
      badge: 'Opens: Company Dashboard',
    },
    { 
      title: 'Verifier', 
      desc: 'Accredited Verifier', 
      badge: 'Opens: Verifier MRV Portal',
    },
    { 
      title: 'Passport Officer', 
      desc: 'Issuance & Governance', 
      badge: 'Opens: Sign & Issue',
    },
    { 
      title: 'Public Viewer', 
      desc: 'No login required', 
      badge: 'Opens: Public Registry',
    },
  ];

  const handleSelectRole = (r: { title: string; desc: string; badge?: string }) => {
    setRole(r.title);
    setLoginError(null);
    setSuccessMsg(null);
    const acc = DEMO_ACCOUNTS[r.title];
    if (acc) {
      setEmail(acc.email);
      setPassword(acc.pass);
    }
  };

  const handleSelectRegisteredCompany = () => {
    if (!registeredCompany) return;
    setRole('Organisation Admin');
    setEmail(registeredCompany.ownerEmail || '');
    setPassword(registeredCompany.ownerPassword || 'DemoPassword2026!');
    setLoginError(null);
    setSuccessMsg(null);
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    setSuccessMsg(null);

    if (role === 'Public Viewer') {
      localStorage.setItem('saurient_user_role', 'Public Viewer');
      localStorage.setItem('auth_role', 'Public Viewer');
      navigate('/passport/registry');
      return;
    }

    if (!email.trim() || !password) {
      setLoginError('Please enter your work email and password.');
      return;
    }

    setIsSubmitting(true);
    try {
      const resp = await loginUser(email.trim(), password);
      if (resp && resp.token && resp.user) {
        localStorage.setItem('saurient_auth_token', resp.token);
        localStorage.setItem('saurient_user_role', resp.user.role || role);
        localStorage.setItem('auth_role', resp.user.role || role);
        localStorage.setItem('saurient_user_email', resp.user.email);
        localStorage.setItem('saurient_user_name', resp.user.name);
        localStorage.setItem('saurient_user_id', resp.user.id);
        localStorage.setItem('saurient_tenant_id', resp.user.tenant_id);

        const targetRoute = resp.user.role === 'Organisation Admin'
          ? '/company-dashboard'
          : DEMO_ACCOUNTS[resp.user.role]?.route || DEMO_ACCOUNTS[role]?.route || '/company-dashboard';
        navigate(targetRoute);
      }
    } catch (err: any) {
      setLoginError(err.message || 'Login failed. User credentials not verified in Nexus Datamodel.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col md:flex-row items-center justify-between p-8 md:p-16 relative">
      {/* Left Branding Column */}
      <div className="max-w-xl space-y-8">
        <div className="flex items-center gap-5">
          <img
            src="/saurient-logo.png"
            alt="Saurient Logo"
            className="w-28 h-28 md:w-36 md:h-36 object-contain rounded-3xl drop-shadow-2xl shrink-0"
          />
          <div>
            <h1 className="text-4xl md:text-5xl font-black tracking-widest text-white">SAURIENT</h1>
            <p className="text-xs md:text-sm text-emerald-400 font-bold uppercase tracking-wider mt-1">Carbon Passport Platform</p>
          </div>
        </div>

        <span className="inline-block bg-slate-800 border border-slate-700 text-slate-300 text-xs font-semibold px-3 py-1 rounded-full uppercase tracking-wider">
          ENTERPRISE CBAM PLATFORM
        </span>

        <h2 className="text-4xl md:text-5xl font-black leading-tight tracking-tight">
          Trusted carbon data. <br />
          <span className="text-emerald-400">One product passport.</span>
        </h2>

        <p className="text-slate-400 text-sm leading-relaxed">
          Powered by VMware Tanzu Nexus Graph Framework. Users, roles, and credential secrets are strictly partitioned under registered organisation tenants in the Nexus datamodel.
        </p>

        <div className="flex items-center gap-2 pt-4">
          {['Register Org', 'Add Users & Roles', 'Calculate', 'Verify & Issue'].map((step, idx) => (
            <React.Fragment key={idx}>
              <div className="bg-slate-900 border border-slate-800 px-3.5 py-2 rounded-xl text-xs font-semibold text-emerald-400">
                {step}
              </div>
              {idx < 3 && <span className="text-slate-600 text-xs">→</span>}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Right Sign In Card */}
      <div className="w-full max-w-md bg-white text-slate-900 rounded-3xl p-8 shadow-2xl mt-8 md:mt-0">
        {/* Onboarding Callout: Register Organisation */}
        <div className="mb-6 p-3 bg-slate-50 rounded-2xl flex items-center justify-between border border-slate-200">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0">
              <Building className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-900">New Organisation?</p>
              <p className="text-[10px] text-slate-500">Register company to establish admin & team roles</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => navigate('/registration?step=0&new=true')}
            className="py-1.5 px-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-xs shrink-0"
          >
            <span>Register Org</span>
            <ArrowRight className="w-3 h-3 text-emerald-400" />
          </button>
        </div>

        {/* Registered Organisation Quick-Use Pill (if registered previously) */}
        {registeredCompany && (
          <div className="mb-5 p-3 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center justify-between">
            <div>
              <span className="text-[9px] font-bold uppercase tracking-wider text-emerald-800 bg-emerald-100/80 px-2 py-0.5 rounded-md">
                Registered Organisation Admin
              </span>
              <p className="text-xs font-bold text-slate-900 mt-1">{registeredCompany.legalName || 'Registered Organisation'}</p>
              <p className="text-[10px] font-mono text-slate-600">{registeredCompany.ownerEmail}</p>
            </div>
            <button
              type="button"
              onClick={handleSelectRegisteredCompany}
              className={`text-xs font-bold px-3 py-1.5 rounded-xl border transition-all ${
                role === 'Organisation Admin'
                  ? 'bg-emerald-700 text-white border-emerald-800'
                  : 'bg-white text-emerald-800 border-emerald-300 hover:bg-emerald-100/60'
              }`}
            >
              {role === 'Organisation Admin' ? 'Selected' : 'Use Admin'}
            </button>
          </div>
        )}

        <div className="mb-4">
          <div className="flex items-center gap-2 mb-1">
            <LogIn className="w-4 h-4 text-emerald-600" />
            <h3 className="text-xl font-black text-slate-900 tracking-tight">Sign In</h3>
          </div>
          <p className="text-xs text-slate-500">
            Authenticate with enterprise credentials stored in the Nexus graph.
          </p>
        </div>

        {/* Demo Roles Quick Selectors */}
        <div className="grid grid-cols-2 gap-2.5 mb-5">
          {roles.map((r, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleSelectRole(r)}
              className={`p-2.5 rounded-xl border text-left transition-all ${
                role === r.title
                  ? 'border-emerald-500 bg-emerald-50/60 ring-2 ring-emerald-500/20'
                  : 'border-slate-200 hover:border-slate-300 bg-slate-50/50'
              }`}
            >
              <h4 className="font-bold text-xs text-slate-900">{r.title}</h4>
              <p className="text-[10px] text-slate-500 mt-0.5 truncate">{r.desc}</p>
              <span className="inline-block mt-1 text-[9px] font-bold text-emerald-700 bg-emerald-100/70 px-1.5 py-0.5 rounded">
                {r.badge}
              </span>
            </button>
          ))}
        </div>

        {/* Sign In Form */}
        <form onSubmit={handleSignIn} autoComplete="off" className="space-y-4">
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">Work Email</label>
            <input
              type="email"
              placeholder="name@company.com"
              value={email}
              autoComplete="off"
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-slate-50"
            />
          </div>

          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500">Password</label>
            </div>
            <input
              type="password"
              placeholder="Enter password"
              value={password}
              autoComplete="current-password"
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-slate-50"
            />
          </div>

          {loginError && (
            <div className="p-3.5 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl space-y-2">
              <div className="flex items-center gap-2 font-bold">
                <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
                <span>{loginError}</span>
              </div>
              <div className="pt-2 border-t border-red-200 flex items-center justify-between">
                <span className="text-[11px] text-red-600 font-normal">Organisation not registered yet?</span>
                <button
                  type="button"
                  onClick={() => navigate('/registration?step=0&new=true')}
                  className="text-xs text-red-800 font-bold underline hover:text-red-900 flex items-center gap-1"
                >
                  <span>Register Organisation</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          )}

          {successMsg && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold rounded-xl flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3 bg-slate-950 hover:bg-slate-900 disabled:opacity-60 text-white font-bold text-sm rounded-xl shadow-md transition-colors flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Authenticating via Nexus Datamodel...</span>
              </>
            ) : (
              <>
                <span>Sign in to workspace</span>
                <ArrowRight className="w-4 h-4 text-emerald-400" />
              </>
            )}
          </button>
        </form>

        <div className="mt-5 text-center text-xs text-slate-500">
          <p className="text-sky-600 font-semibold hover:underline cursor-pointer" onClick={() => navigate('/passport')}>
            Public passport verification
          </p>
        </div>
      </div>
    </div>
  );
};
