import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, AlertTriangle, Building, ShieldAlert, PlusCircle, LogIn } from 'lucide-react';
import { loginUser } from '../../api/client';

export const LoginView: React.FC = () => {
  const navigate = useNavigate();

  // Multi-tenant Org Selection Mode: 'existing' (log into workspace) or 'new' (create new org)
  const [orgMode, setOrgMode] = useState<'existing' | 'new'>('existing');

  const [showRegModal, setShowRegModal] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const DEMO_ACCOUNTS: Record<string, { email: string; pass: string; route: string; desc: string; badge: string }> = {
    'Company Operator': {
      email: 'operator@asante-cocoa.com',
      pass: 'DemoPassword2026!',
      route: '/company-dashboard',
      desc: 'Facility & ESG Operations',
      badge: 'Opens: Company Dashboard',
    },
    'Verifier': {
      email: 'auditor@bureau-veritas.com',
      pass: 'DemoPassword2026!',
      route: '/mrv',
      desc: 'Accredited Verifier (Bureau Veritas)',
      badge: 'Opens: Verifier MRV Portal',
    },
    'Passport Officer': {
      email: 'officer@saurient.com',
      pass: 'DemoPassword2026!',
      route: '/passport/sign-issue',
      desc: 'Issuance & Governance Authority',
      badge: 'Opens: Sign & Issue',
    },
    'Public Viewer': {
      email: '',
      pass: '',
      route: '/passport/registry',
      desc: 'Customs & Public Registry',
      badge: 'Opens: Public Registry',
    },
  };

  const [role, setRole] = useState('Company Operator');
  const [email, setEmail] = useState(DEMO_ACCOUNTS['Company Operator'].email);
  const [password, setPassword] = useState(DEMO_ACCOUNTS['Company Operator'].pass);

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
    if (orgMode === 'new' && r.title !== 'Public Viewer') {
      setShowRegModal(true);
      return;
    }
    const acc = DEMO_ACCOUNTS[r.title];
    if (acc) {
      setEmail(acc.email);
      setPassword(acc.pass);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);

    if (orgMode === 'new') {
      setShowRegModal(true);
      return;
    }

    if (role !== 'Public Viewer' && (!email.trim() || !password)) {
      setLoginError('Please enter your work email and password.');
      return;
    }

    localStorage.setItem('saurient_user_role', role);
    localStorage.setItem('auth_role', role);
    localStorage.setItem('saurient_user_email', email.trim() || 'demo@saurient.io');

    try {
      if (email.trim() && password) {
        await loginUser(email.trim(), password);
      }
    } catch (err) {
      console.warn('Backend login check failed, proceeding in session mode:', err);
    }

    const targetRoute = DEMO_ACCOUNTS[role]?.route || '/dashboard';
    navigate(targetRoute);
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
          INVESTOR DEMO
        </span>

        <h2 className="text-4xl md:text-5xl font-black leading-tight tracking-tight">
          Trusted carbon data. <br />
          <span className="text-emerald-400">One product passport.</span>
        </h2>

        <p className="text-slate-400 text-sm leading-relaxed">
          Convert operational, supplier and energy data into verified product footprints, CBAM-ready evidence and shareable Carbon Passports.
        </p>

        <div className="flex items-center gap-2 pt-4">
          {['Data', 'Calculate', 'Verify', 'Issue'].map((step, idx) => (
            <React.Fragment key={idx}>
              <div className="bg-slate-900 border border-slate-800 px-4 py-2 rounded-xl text-xs font-semibold text-emerald-400">
                {step}
              </div>
              {idx < 3 && <span className="text-slate-600 text-xs">→</span>}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Right Login Card */}
      <div className="w-full max-w-md bg-white text-slate-900 rounded-3xl p-8 shadow-2xl mt-8 md:mt-0">
        {/* Multi-Tenant Action Toggle */}
        <div className="mb-6 p-1 bg-slate-100 rounded-2xl flex items-center border border-slate-200">
          <button
            type="button"
            onClick={() => {
              setOrgMode('existing');
              setLoginError(null);
            }}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
              orgMode === 'existing'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <LogIn className="w-3.5 h-3.5 text-emerald-600" />
            <span>Sign in Existing Org User</span>
          </button>

          <button
            type="button"
            onClick={() => navigate('/registration')}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
              orgMode === 'new'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <PlusCircle className="w-3.5 h-3.5 text-amber-600" />
            <span>Register Organization</span>
          </button>
        </div>

        <h3 className="text-2xl font-bold mb-1">Welcome back</h3>
        <p className="text-xs text-slate-500 mb-6">Choose an authorized user role and enter your workspace credentials.</p>

        {/* Roles Selectors */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          {roles.map((r, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleSelectRole(r)}
              className={`p-3 rounded-xl border text-left transition-all ${
                role === r.title
                  ? 'border-emerald-500 bg-emerald-50/60 ring-2 ring-emerald-500/20'
                  : 'border-slate-200 hover:border-slate-300 bg-slate-50/50'
              }`}
            >
              <h4 className="font-bold text-xs text-slate-900">{r.title}</h4>
              <p className="text-[10px] text-slate-500 mt-0.5 truncate">{r.desc}</p>
              <span className="inline-block mt-1.5 text-[9px] font-bold text-emerald-700 bg-emerald-100/70 px-1.5 py-0.5 rounded">
                {r.badge}
              </span>
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} autoComplete="off" className="space-y-4">
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
              autoComplete="new-password"
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-slate-50"
            />
          </div>

          {loginError && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs font-semibold rounded-xl flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
              <span>{loginError}</span>
            </div>
          )}

          <button
            type="submit"
            className="w-full py-3 bg-slate-950 hover:bg-slate-900 text-white font-bold text-sm rounded-xl shadow-md transition-colors flex items-center justify-center gap-2"
          >
            <span>Sign in to workspace</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="mt-6 text-center text-xs text-slate-500">
          <p className="text-sky-600 font-semibold hover:underline cursor-pointer" onClick={() => navigate('/passport')}>
            Public passport verification
          </p>
        </div>
      </div>

      {/* Registration Required Enforcement Modal */}
      {showRegModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white text-slate-900 rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="w-12 h-12 bg-amber-100 text-amber-700 rounded-2xl flex items-center justify-center">
              <ShieldAlert className="w-6 h-6" />
            </div>

            <div>
              <h3 className="text-lg font-bold text-slate-900">Company Registration Required</h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                You must register your organisation and authorized users before logging in. Complete the 10-step company onboarding wizard to create your enterprise profile.
              </p>
            </div>

            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1">
              <p className="font-semibold text-slate-800">What happens during registration?</p>
              <p className="text-slate-500">• Sets up company legal identity & tax residency</p>
              <p className="text-slate-500">• Registers facilities, grid suppliers & CBAM boundaries</p>
              <p className="text-slate-500">• Grants verified operator & verifier access roles</p>
            </div>

            <div className="flex flex-col gap-2 pt-2">
              <button
                onClick={() => navigate('/registration')}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md transition-colors flex items-center justify-center gap-2"
              >
                <Building className="w-4 h-4" />
                <span>Go to Company Registration</span>
              </button>

              <button
                onClick={() => setShowRegModal(false)}
                className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
