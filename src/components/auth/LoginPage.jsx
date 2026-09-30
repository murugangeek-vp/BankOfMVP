import React, { useState } from 'react';
import {
  Landmark, ShieldCheck, Lock, User, Eye, EyeOff, KeyRound, ArrowRight,
  UserCheck, Building2, Wallet, Settings2, Sparkles, CheckCircle2, AlertCircle,
  ShieldAlert, Fingerprint, RefreshCw, Layers, Check, X, Globe, Building
} from 'lucide-react';

const PRESET_ROLES = [
  {
    role: 'RETAIL_USER',
    username: 'john_retail',
    name: 'Johnathan Doe',
    title: 'Personal Savings Customer',
    desc: 'Retail banking, savings goals, overdraft limits & personal loans',
    icon: Wallet,
    color: 'from-blue-500/20 to-blue-600/10 border-blue-500/30 text-blue-400',
    badgeBg: 'bg-blue-500/20 text-blue-300'
  },
  {
    role: 'CORPORATE_MAKER',
    username: 'alice_maker',
    name: 'Alice Smith',
    title: 'Corporate Treasury Maker',
    desc: 'Initiate high-value transfers, payroll batches & sub-user requests',
    icon: Building2,
    color: 'from-amber-500/20 to-amber-600/10 border-amber-500/30 text-amber-400',
    badgeBg: 'bg-amber-500/20 text-amber-300'
  },
  {
    role: 'CORPORATE_CHECKER',
    username: 'bob_checker',
    name: 'Bob Vance',
    title: 'Corporate Compliance Checker',
    desc: 'Authorize/reject pending maker requests & dual-signature signoffs',
    icon: UserCheck,
    color: 'from-purple-500/20 to-purple-600/10 border-purple-500/30 text-purple-400',
    badgeBg: 'bg-purple-500/20 text-purple-300'
  },
  {
    role: 'BANK_MANAGER',
    username: 'sarah_manager',
    name: 'Sarah Jenkins',
    title: 'Vice President & Bank Admin',
    desc: 'Master Data rule engine, credit score thresholds & security audit logs',
    icon: Settings2,
    color: 'from-emerald-500/20 to-emerald-600/10 border-emerald-500/30 text-emerald-400',
    badgeBg: 'bg-emerald-500/20 text-emerald-300'
  }
];

const SSO_PROVIDERS = [
  { id: 'Azure_AD', name: 'Microsoft Azure AD / Entra ID', domain: 'acmecorp.com', icon: Building },
  { id: 'Okta_Enterprise', name: 'Okta Enterprise SSO (OIDC)', domain: 'acmecorp.com', icon: ShieldCheck },
  { id: 'CoreBank_IDP', name: 'CoreBank OAuth2 / SAML2 IDP', domain: 'corebank.com', icon: Globe },
];

export default function LoginPage({ onLoginSuccess, onSSOLoginSuccess }) {
  const [authMode, setAuthMode] = useState('STANDARD'); // 'STANDARD' | 'SSO' | 'POLICY_VAL'
  const [username, setUsername] = useState('john_retail');
  const [password, setPassword] = useState('password123');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedPersona, setSelectedPersona] = useState('RETAIL_USER');

  // SSO State
  const [ssoProvider, setSsoProvider] = useState('Azure_AD');
  const [ssoEmail, setSsoEmail] = useState('alice@acmecorp.com');

  // Real-Time Password Evaluator State
  const [testPassword, setTestPassword] = useState('SecureP@ssw0rd2026!');

  const handlePersonaSelect = (persona) => {
    setSelectedPersona(persona.role);
    setUsername(persona.username);
    setPassword('password123');
    setError(null);
  };

  const handleStandardSubmit = async (e) => {
    e.preventDefault();
    if (!username.trim()) {
      setError('Please enter a valid username or email address.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await onLoginSuccess({ username, password, role: selectedPersona });
    } catch (err) {
      const msg = err.response?.data?.error || 'Authentication failed. Please check your credentials.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleSSOSubmit = async (e) => {
    e.preventDefault();
    if (!ssoEmail.trim()) {
      setError('Please enter your corporate email address.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await onSSOLoginSuccess({ provider: ssoProvider, ssoEmail });
    } catch (err) {
      setError(err.response?.data?.error || 'Single Sign-On authentication failed.');
    } finally {
      setLoading(false);
    }
  };

  // Password Policy Evaluation Math
  const evaluateTestPassword = (pwd) => {
    const hasLen = pwd.length >= 12;
    const hasUpper = /[A-Z]/.test(pwd);
    const hasLower = /[a-z]/.test(pwd);
    const hasNum = /[0-9]/.test(pwd);
    const hasSym = /[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]/.test(pwd);
    
    let score = 0;
    if (hasLen) score += 25;
    if (hasUpper) score += 20;
    if (hasLower) score += 20;
    if (hasNum) score += 15;
    if (hasSym) score += 20;

    let level = 'WEAK';
    let color = 'bg-rose-500 text-rose-300';
    if (score >= 90) { level = 'BANK_GRADE'; color = 'bg-emerald-500 text-emerald-300'; }
    else if (score >= 70) { level = 'STRONG'; color = 'bg-blue-500 text-blue-300'; }
    else if (score >= 50) { level = 'MEDIUM'; color = 'bg-amber-500 text-amber-300'; }

    return { hasLen, hasUpper, hasLower, hasNum, hasSym, score, level, color };
  };

  const pwdEval = evaluateTestPassword(testPassword);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4 md:p-8 relative overflow-hidden font-sans">
      {/* Background Orbs */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-blue-600/15 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-emerald-600/15 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-purple-600/5 rounded-full blur-[140px] pointer-events-none" />

      <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-12 gap-8 relative z-10 items-stretch">
        
        {/* Left Side: Persona Selector (7 cols) */}
        <div className="lg:col-span-7 flex flex-col justify-between space-y-6 glass-card p-6 md:p-8 rounded-3xl border border-slate-800/80 bg-slate-900/60 backdrop-blur-xl">
          <div>
            {/* Header Brand */}
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-emerald-500 p-0.5 shadow-lg shadow-blue-500/20">
                <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center text-emerald-400">
                  <Landmark className="w-6 h-6" />
                </div>
              </div>
              <div>
                <h1 className="text-2xl font-black tracking-tight text-white font-outfit flex items-center space-x-2">
                  <span>CoreBank</span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 font-mono">SOC2 Bank-Grade</span>
                </h1>
                <p className="text-xs text-slate-400 font-mono">Enterprise Multi-Tier Banking & SSO Gateway</p>
              </div>
            </div>

            <div className="space-y-2 mb-6">
              <h2 className="text-xl font-bold text-slate-100">Select Test Persona or SSO Identity</h2>
              <p className="text-xs text-slate-400 leading-relaxed">
                Protected by 15-minute inactivity session management, 5-attempt account lockout guard, and SAML2/OIDC Single Sign-On.
              </p>
            </div>

            {/* Quick Persona Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {PRESET_ROLES.map((persona) => {
                const IconComp = persona.icon;
                const isSelected = selectedPersona === persona.role;

                return (
                  <button
                    key={persona.role}
                    type="button"
                    onClick={() => handlePersonaSelect(persona)}
                    className={`text-left p-3.5 rounded-2xl border transition-all duration-200 relative overflow-hidden group ${
                      isSelected
                        ? `bg-gradient-to-br ${persona.color} shadow-lg ring-1 ring-blue-400/30`
                        : 'bg-slate-900/80 border-slate-800 hover:border-slate-700 hover:bg-slate-850'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${persona.badgeBg}`}>
                        <IconComp className="w-4 h-4" />
                      </div>
                      {isSelected && (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 animate-fadeIn" />
                      )}
                    </div>
                    <div className="mt-2.5">
                      <h4 className="text-xs font-bold text-white group-hover:text-blue-300 transition">{persona.title}</h4>
                      <span className="text-[11px] font-mono text-slate-400 block mb-1">@{persona.username}</span>
                      <p className="text-[11px] text-slate-400 line-clamp-2 leading-snug">{persona.desc}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Compliance & Security Footer */}
          <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-500 font-mono">
            <div className="flex items-center space-x-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>BCrypt Salt12 • OAuth2 / OIDC SAML2</span>
            </div>
            <span>Lockout Max 5 Attempts</span>
          </div>
        </div>

        {/* Right Side: Auth Mode Tabs & Form (5 cols) */}
        <div className="lg:col-span-5 flex flex-col justify-between glass-card p-6 md:p-8 rounded-3xl border border-slate-800 bg-slate-900/90 backdrop-blur-2xl shadow-2xl relative">
          
          <div>
            {/* Mode Switcher Tabs */}
            <div className="flex bg-slate-950 p-1 rounded-2xl border border-slate-800 mb-6 text-xs font-mono">
              <button
                type="button"
                onClick={() => { setAuthMode('STANDARD'); setError(null); }}
                className={`flex-1 py-2 rounded-xl font-bold transition flex items-center justify-center space-x-1 ${
                  authMode === 'STANDARD' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Lock className="w-3.5 h-3.5" />
                <span>Password</span>
              </button>

              <button
                type="button"
                onClick={() => { setAuthMode('SSO'); setError(null); }}
                className={`flex-1 py-2 rounded-xl font-bold transition flex items-center justify-center space-x-1 ${
                  authMode === 'SSO' ? 'bg-purple-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Fingerprint className="w-3.5 h-3.5" />
                <span>SSO (OIDC)</span>
              </button>

              <button
                type="button"
                onClick={() => { setAuthMode('POLICY_VAL'); setError(null); }}
                className={`flex-1 py-2 rounded-xl font-bold transition flex items-center justify-center space-x-1 ${
                  authMode === 'POLICY_VAL' ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <ShieldAlert className="w-3.5 h-3.5" />
                <span>Policy</span>
              </button>
            </div>

            {error && (
              <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center space-x-2 animate-fadeIn">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* TAB 1: Standard Password Login */}
            {authMode === 'STANDARD' && (
              <form onSubmit={handleStandardSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-mono text-slate-400 mb-1">Username / Email ID</label>
                  <div className="relative">
                    <User className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                    <input
                      type="text"
                      required
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="e.g. john_retail"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-blue-500 transition font-mono"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-xs font-mono text-slate-400">Bank Password</label>
                    <span className="text-[11px] text-blue-400 font-mono">Demo: password123</span>
                  </div>
                  <div className="relative">
                    <Lock className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••••••"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-10 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-blue-500 transition font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-3 text-slate-500 hover:text-slate-300 transition"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs pt-1">
                  <label className="flex items-center space-x-2 cursor-pointer text-slate-400">
                    <input type="checkbox" defaultChecked className="accent-blue-500 rounded cursor-pointer" />
                    <span>Enforce CSRF & Lockout Check</span>
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full mt-2 py-3 px-4 rounded-xl bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white font-bold text-sm shadow-lg shadow-blue-500/25 flex items-center justify-center space-x-2 transition disabled:opacity-50 cursor-pointer"
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <span>Sign In with Password</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            )}

            {/* TAB 2: Corporate Single Sign-On (SSO) */}
            {authMode === 'SSO' && (
              <form onSubmit={handleSSOSubmit} className="space-y-4 animate-fadeIn">
                <div>
                  <label className="block text-xs font-mono text-slate-400 mb-1">Corporate Identity Provider</label>
                  <select
                    value={ssoProvider}
                    onChange={(e) => setSsoProvider(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-sm text-white font-medium focus:outline-none focus:border-purple-500"
                  >
                    {SSO_PROVIDERS.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-mono text-slate-400 mb-1">Corporate Email Address</label>
                  <div className="relative">
                    <User className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                    <input
                      type="email"
                      required
                      value={ssoEmail}
                      onChange={(e) => setSsoEmail(e.target.value)}
                      placeholder="alice@acmecorp.com"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-purple-500 transition font-mono"
                    />
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-purple-500/10 border border-purple-500/20 text-xs text-purple-300 space-y-1">
                  <span className="font-bold block">Enterprise SAML2 / OIDC Assertions:</span>
                  <p className="text-[11px] text-slate-400">Authenticates directly against corporate directory with single token grant.</p>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-500 hover:to-purple-400 text-white font-bold text-sm shadow-lg shadow-purple-500/25 flex items-center justify-center space-x-2 transition disabled:opacity-50 cursor-pointer"
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <span>Continue with Corporate SSO</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            )}

            {/* TAB 3: Password Policy Evaluator */}
            {authMode === 'POLICY_VAL' && (
              <div className="space-y-4 animate-fadeIn">
                <div>
                  <label className="block text-xs font-mono text-slate-400 mb-1">Test Password Strength Evaluator</label>
                  <input
                    type="text"
                    value={testPassword}
                    onChange={(e) => setTestPassword(e.target.value)}
                    placeholder="Enter password to test policy..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-emerald-400 font-mono focus:outline-none focus:border-emerald-500"
                  />
                </div>

                {/* Score Bar */}
                <div className="space-y-1">
                  <div className="flex justify-between text-xs font-mono">
                    <span className="text-slate-400">Bank-Grade Entropic Rating:</span>
                    <span className={`font-bold px-2 py-0.5 rounded text-[10px] ${pwdEval.color}`}>
                      {pwdEval.level} ({pwdEval.score}%)
                    </span>
                  </div>
                  <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden border border-slate-800">
                    <div
                      className={`h-full transition-all duration-300 ${
                        pwdEval.score >= 90 ? 'bg-emerald-500' : pwdEval.score >= 70 ? 'bg-blue-500' : pwdEval.score >= 50 ? 'bg-amber-500' : 'bg-rose-500'
                      }`}
                      style={{ width: `${pwdEval.score}%` }}
                    />
                  </div>
                </div>

                {/* Checklist */}
                <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 space-y-2 text-xs font-mono">
                  <div className="flex items-center space-x-2">
                    {pwdEval.hasLen ? <Check className="w-4 h-4 text-emerald-400" /> : <X className="w-4 h-4 text-rose-500" />}
                    <span className={pwdEval.hasLen ? 'text-slate-200' : 'text-slate-500'}>Minimum 12 Characters</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    {pwdEval.hasUpper ? <Check className="w-4 h-4 text-emerald-400" /> : <X className="w-4 h-4 text-rose-500" />}
                    <span className={pwdEval.hasUpper ? 'text-slate-200' : 'text-slate-500'}>Uppercase Letter (A-Z)</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    {pwdEval.hasLower ? <Check className="w-4 h-4 text-emerald-400" /> : <X className="w-4 h-4 text-rose-500" />}
                    <span className={pwdEval.hasLower ? 'text-slate-200' : 'text-slate-500'}>Lowercase Letter (a-z)</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    {pwdEval.hasNum ? <Check className="w-4 h-4 text-emerald-400" /> : <X className="w-4 h-4 text-rose-500" />}
                    <span className={pwdEval.hasNum ? 'text-slate-200' : 'text-slate-500'}>Numeric Digit (0-9)</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    {pwdEval.hasSym ? <Check className="w-4 h-4 text-emerald-400" /> : <X className="w-4 h-4 text-rose-500" />}
                    <span className={pwdEval.hasSym ? 'text-slate-200' : 'text-slate-500'}>Special Symbol (!@#$%^&*)</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Quick Credential Helper Pill */}
          <div className="mt-6 p-3 rounded-2xl bg-slate-950/80 border border-slate-800/80 text-[11px] font-mono text-slate-400 space-y-1">
            <div className="text-slate-300 font-bold flex items-center space-x-1.5">
              <KeyRound className="w-3.5 h-3.5 text-amber-400" />
              <span>Demo Persona Helper</span>
            </div>
            <p className="text-slate-400">User: <span className="text-emerald-400 font-bold">{username}</span> | Password: <span className="text-blue-400 font-bold">password123</span></p>
          </div>

        </div>

      </div>
    </div>
  );
}
