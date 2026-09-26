import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Leaf, ShieldCheck, ArrowRight } from 'lucide-react';

export const LoginView: React.FC = () => {
  const navigate = useNavigate();
  const [role, setRole] = useState('Company Operator');
  const [email, setEmail] = useState('operator@saurient.demo');
  const [password, setPassword] = useState('••••••••••••');

  const roles = [
    { title: 'Company Operator', email: 'operator@saurient.demo' },
    { title: 'Verifier', email: 'verifier@saurient.demo' },
    { title: 'Passport Officer', email: 'officer@saurient.demo' },
    { title: 'Public Viewer', email: 'No login required' },
  ];

  const handleSelectRole = (r: { title: string; email: string }) => {
    setRole(r.title);
    if (r.email !== 'No login required') {
      setEmail(r.email);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col md:flex-row items-center justify-between p-8 md:p-16">
      {/* Left Branding Column */}
      <div className="max-w-xl space-y-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500 text-slate-950 flex items-center justify-center font-bold text-xl shadow-lg">
            S
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">SAURIENT</h1>
            <p className="text-xs text-slate-400 font-medium">Carbon Passport Platform</p>
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
        <h3 className="text-2xl font-bold mb-1">Welcome back</h3>
        <p className="text-xs text-slate-500 mb-6">Choose a demo role or use the prefilled account.</p>

        {/* Demo Roles Selectors */}
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
              <p className="text-[10px] text-slate-500 font-mono mt-0.5">{r.email}</p>
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
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-slate-50"
            />
          </div>

          <button
            type="submit"
            className="w-full py-3 bg-slate-950 hover:bg-slate-900 text-white font-bold text-sm rounded-xl shadow-md transition-colors flex items-center justify-center gap-2"
          >
            <span>Sign in to demo workspace</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="mt-6 text-center text-xs text-slate-500 space-y-1">
          <p>Forgot password • <Link to="/registration" className="text-emerald-600 font-semibold hover:underline">Register company</Link></p>
          <p className="text-sky-600 font-semibold hover:underline cursor-pointer" onClick={() => navigate('/passport')}>Public passport verification</p>
        </div>
      </div>
    </div>
  );
};
