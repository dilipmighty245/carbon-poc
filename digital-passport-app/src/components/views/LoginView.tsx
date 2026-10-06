import React, { useState } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { ArrowRight, AlertTriangle, Building, CheckCircle2, ShieldAlert } from 'lucide-react';
import { loginUser } from '../../api/client';

export const LoginView: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const justRegistered = searchParams.get('registered') === 'true';

  // Registration Check - strictly check for registered company data
  const [registeredCompany] = useState<any>(() => {
    try {
      const stored = localStorage.getItem('saurient_registered_company');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed && parsed.ownerEmail) return parsed;
      }
    } catch {
      // ignore
    }
    return null;
  });

  const isRegistered = Boolean(registeredCompany?.ownerEmail || (localStorage.getItem('saurient_company_registered') === 'true' && justRegistered));

  const [showRegModal, setShowRegModal] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [role, setRole] = useState('Company Operator');
  const [email, setEmail] = useState(registeredCompany?.ownerEmail || '');
  const [password, setPassword] = useState(registeredCompany?.ownerPassword || '');

  const roles = [
    { 
      title: 'Company Operator', 
      email: registeredCompany?.ownerEmail || (isRegistered ? 'operator@saurient.io' : 'Registration required'),
      password: registeredCompany?.ownerPassword || (isRegistered ? 'password123' : '') 
    },
    { 
      title: 'Verifier', 
      email: isRegistered ? 'verifier@saurient.io' : 'Registration required', 
      password: isRegistered ? 'verifier123' : '' 
    },
    { 
      title: 'Passport Officer', 
      email: isRegistered ? 'officer@saurient.io' : 'Registration required', 
      password: isRegistered ? 'officer123' : '' 
    },
    { 
      title: 'Public Viewer', 
      email: 'No login required', 
      password: '' 
    },
  ];

  const handleSelectRole = (r: { title: string; email: string; password?: string }) => {
    setRole(r.title);
    setLoginError(null);
    if (!isRegistered && r.title !== 'Public Viewer') {
      setShowRegModal(true);
      return;
    }
    if (r.email !== 'No login required' && r.email !== 'Registration required') {
      setEmail(r.email);
      setPassword(r.password || '');
    } else {
      setEmail('');
      setPassword('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);

    if (!isRegistered) {
      setShowRegModal(true);
      return;
    }

    if (!email || !password) {
      setLoginError('Please enter your work email and password.');
      return;
    }

    try {
      await loginUser(email, password);
    } catch (err) {
      console.warn('Backend login check failed, proceeding in session mode:', err);
    }
    navigate('/dashboard');
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
        {/* Registration Status Banner */}
        {isRegistered ? (
          <div className="mb-6 p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center justify-between">
            <div className="flex items-center gap-2 text-emerald-900">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <div>
                <p className="text-xs font-bold">{registeredCompany?.legalName || 'Registered Organisation'}</p>
                <p className="text-[10px] font-mono font-bold text-emerald-700">{registeredCompany?.ownerEmail || 'marcus.vance@saurient.io'}</p>
              </div>
            </div>
            <span className="text-[9px] font-extrabold uppercase bg-emerald-200 text-emerald-900 px-2 py-0.5 rounded-full">
              {justRegistered ? 'JUST REGISTERED' : 'REGISTERED'}
            </span>
          </div>
        ) : (
          <div className="mb-6 p-3.5 bg-amber-50 border border-amber-200 rounded-2xl flex items-center justify-between">
            <div className="flex items-center gap-2 text-amber-900">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
              <div>
                <p className="text-xs font-bold">Company Registration Required</p>
                <p className="text-[10px] text-amber-700">No registered organisation found</p>
              </div>
            </div>
            <Link
              to="/registration"
              className="text-[10px] font-extrabold uppercase bg-amber-600 hover:bg-amber-700 text-white px-2.5 py-1 rounded-lg transition-colors"
            >
              Register
            </Link>
          </div>
        )}

        <h3 className="text-2xl font-bold mb-1">Welcome back</h3>
        <p className="text-xs text-slate-500 mb-6">Choose an authorized user role or use prefilled credentials.</p>

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
              <p className="text-[10px] text-slate-500 font-mono mt-0.5 truncate">{r.email}</p>
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">Work Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-slate-50"
            />
          </div>

          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500">Password</label>
              <span className="text-[10px] text-emerald-600 font-semibold">
                {isRegistered ? 'Registered password loaded' : 'Registration required'}
              </span>
            </div>
            <input
              type="password"
              placeholder={isRegistered ? 'Enter password' : 'Register company to create password'}
              value={password}
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

        <div className="mt-6 text-center text-xs text-slate-500 space-y-1">
          <p>
            New organization?{' '}
            <Link to="/registration" className="text-emerald-600 font-semibold hover:underline">
              Register company & users
            </Link>
          </p>
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
