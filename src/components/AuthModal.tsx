import React, { useState } from 'react';
import { GraduationCap, Lock, User, Hash, AlertCircle, Sparkles, CheckCircle2 } from 'lucide-react';
import { useSchedule } from '../context/ScheduleContext';

interface AuthModalProps {
  isOpen: boolean;
  onClose?: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen }) => {
  const { login, signup } = useSchedule();
  const [mode, setMode] = useState<'login' | 'signup'>('login');

  // Login state
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Signup state
  const [fullName, setFullName] = useState('');
  const [regNumber, setRegNumber] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [section, setSection] = useState('');
  const [batch, setBatch] = useState('');
  const [branch, setBranch] = useState('');

  // Status state
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!loginIdentifier || !loginPassword) {
      setErrorMsg('Please fill in all required fields.');
      return;
    }

    setLoading(true);
    const res = await login(loginIdentifier, loginPassword);
    setLoading(false);

    if (!res.success) {
      setErrorMsg(res.message);
    }
  };

  const handleSignupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!fullName || !regNumber || !password || !confirmPassword) {
      setErrorMsg('Please fill in all required fields.');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMsg('Passwords do not match.');
      return;
    }

    setLoading(true);
    const res = await signup({
      fullName,
      regNumber,
      password,
      confirmPassword,
      section,
      batch,
      branch
    });
    setLoading(false);

    if (!res.success) {
      setErrorMsg(res.message);
    } else {
      setSuccessMsg('Account created successfully! Redirecting...');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-md bg-white dark:bg-campus-card-dark border border-campus-border-light dark:border-campus-border-dark rounded-campus shadow-2xl overflow-hidden text-campus-primary-light dark:text-campus-primary-dark transition-all">
        {/* Header Banner */}
        <div className="p-6 bg-campus-bg-light dark:bg-campus-bg-dark/40 border-b border-campus-border-light dark:border-campus-border-dark text-center relative">
          <div className="mx-auto h-12 w-12 bg-black dark:bg-white text-white dark:text-black rounded-2xl flex items-center justify-center shadow-soft-md mb-3">
            <GraduationCap className="h-6 w-6" />
          </div>
          <h2 className="text-xl font-bold tracking-tight">Welcome to Idea Lab Management</h2>
          <p className="text-xs text-campus-secondary-light dark:text-campus-secondary-dark mt-1">
            Idea Lab Schedule & Academic Management Platform
          </p>

          {/* Mode Tabs */}
          <div className="flex bg-white dark:bg-campus-card-dark p-1 rounded-xl border border-campus-border-light dark:border-campus-border-dark mt-5">
            <button
              type="button"
              onClick={() => { setMode('login'); setErrorMsg(''); setSuccessMsg(''); }}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                mode === 'login'
                  ? 'bg-black dark:bg-white text-white dark:text-black shadow-soft-sm'
                  : 'text-campus-secondary-light dark:text-campus-secondary-dark hover:text-campus-primary-light dark:hover:text-campus-primary-dark'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => { setMode('signup'); setErrorMsg(''); setSuccessMsg(''); }}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                mode === 'signup'
                  ? 'bg-black dark:bg-white text-white dark:text-black shadow-soft-sm'
                  : 'text-campus-secondary-light dark:text-campus-secondary-dark hover:text-campus-primary-light dark:hover:text-campus-primary-dark'
              }`}
            >
              Create Account
            </button>
          </div>
        </div>

        {/* Body Content */}
        <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          {errorMsg && (
            <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 rounded-lg text-xs font-medium">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="flex items-center gap-2 p-3 bg-green-500/10 border border-green-500/20 text-green-600 dark:text-green-400 rounded-lg text-xs font-medium">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {mode === 'login' ? (
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold mb-1 text-campus-secondary-light dark:text-campus-secondary-dark">
                  Registration Number OR Full Name
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-2.5 h-4 w-4 text-campus-secondary-light dark:text-campus-secondary-dark" />
                  <input
                    type="text"
                    required
                    value={loginIdentifier}
                    onChange={(e) => setLoginIdentifier(e.target.value)}
                    placeholder="e.g. PCEA25CS123 or Piyush"
                    className="w-full pl-9 pr-3 py-2 bg-campus-bg-light dark:bg-campus-bg-dark border border-campus-border-light dark:border-campus-border-dark rounded-lg text-xs font-medium focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1 text-campus-secondary-light dark:text-campus-secondary-dark">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-2.5 h-4 w-4 text-campus-secondary-light dark:text-campus-secondary-dark" />
                  <input
                    type="password"
                    required
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-9 pr-3 py-2 bg-campus-bg-light dark:bg-campus-bg-dark border border-campus-border-light dark:border-campus-border-dark rounded-lg text-xs font-medium focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white transition"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 bg-black dark:bg-white text-white dark:text-black font-semibold text-xs rounded-lg shadow-soft-sm hover:opacity-90 transition disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <span className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" />
                    <span>Sign In to Dashboard</span>
                  </>
                )}
              </button>
            </form>
          ) : (
            <form onSubmit={handleSignupSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold mb-1 text-campus-secondary-light dark:text-campus-secondary-dark">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-2.5 h-4 w-4 text-campus-secondary-light dark:text-campus-secondary-dark" />
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. Piyush"
                    className="w-full pl-9 pr-3 py-2 bg-campus-bg-light dark:bg-campus-bg-dark border border-campus-border-light dark:border-campus-border-dark rounded-lg text-xs font-medium focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1 text-campus-secondary-light dark:text-campus-secondary-dark">
                  Registration Number <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Hash className="absolute left-3 top-2.5 h-4 w-4 text-campus-secondary-light dark:text-campus-secondary-dark" />
                  <input
                    type="text"
                    required
                    value={regNumber}
                    onChange={(e) => setRegNumber(e.target.value)}
                    placeholder="e.g. PCEA25CS123"
                    className="w-full pl-9 pr-3 py-2 bg-campus-bg-light dark:bg-campus-bg-dark border border-campus-border-light dark:border-campus-border-dark rounded-lg text-xs font-medium focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white transition uppercase"
                  />
                </div>
                <span className="text-[10px] text-campus-secondary-light dark:text-campus-secondary-dark mt-0.5 block">
                  Must be unique. Only one account per registration number.
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-[11px] font-semibold mb-1 text-campus-secondary-light dark:text-campus-secondary-dark">Section</label>
                  <input
                    type="text"
                    placeholder="B"
                    value={section}
                    onChange={(e) => setSection(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-campus-bg-light dark:bg-campus-bg-dark border border-campus-border-light dark:border-campus-border-dark rounded-lg text-xs font-medium focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold mb-1 text-campus-secondary-light dark:text-campus-secondary-dark">Batch</label>
                  <input
                    type="text"
                    placeholder="2"
                    value={batch}
                    onChange={(e) => setBatch(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-campus-bg-light dark:bg-campus-bg-dark border border-campus-border-light dark:border-campus-border-dark rounded-lg text-xs font-medium focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold mb-1 text-campus-secondary-light dark:text-campus-secondary-dark">Branch</label>
                  <input
                    type="text"
                    placeholder="CSE"
                    value={branch}
                    onChange={(e) => setBranch(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-campus-bg-light dark:bg-campus-bg-dark border border-campus-border-light dark:border-campus-border-dark rounded-lg text-xs font-medium focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold mb-1 text-campus-secondary-light dark:text-campus-secondary-dark">
                    Password <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-3 py-2 bg-campus-bg-light dark:bg-campus-bg-dark border border-campus-border-light dark:border-campus-border-dark rounded-lg text-xs font-medium focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1 text-campus-secondary-light dark:text-campus-secondary-dark">
                    Confirm Password <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-3 py-2 bg-campus-bg-light dark:bg-campus-bg-dark border border-campus-border-light dark:border-campus-border-dark rounded-lg text-xs font-medium focus:outline-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 bg-black dark:bg-white text-white dark:text-black font-semibold text-xs rounded-lg shadow-soft-sm hover:opacity-90 transition disabled:opacity-50 flex items-center justify-center gap-2 mt-2"
              >
                {loading ? (
                  <span className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <GraduationCap className="h-4 w-4" />
                    <span>Create Account</span>
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
