import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Scissors, Lock, ArrowRight, ShieldAlert, ArrowLeft, KeyRound, CheckCircle2 } from 'lucide-react';
import { authService } from '../api/api';
import { validatePassword } from '../utils/validators';

// Lands here from the link in the reset-password email:
// /reset-password?token=...&email=...
// Both are opaque to the user — they just type their new password twice.
const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';
  const email = searchParams.get('email') || '';

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!token || !email) {
      setError('This reset link is invalid — please request a new one');
      return;
    }
    const passwordError = validatePassword(password);
    if (passwordError) { setError(passwordError); return; }
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      await authService.resetPassword({ email, token, newPassword: password });
      setDone(true);
      setTimeout(() => navigate('/login'), 2500);
    } catch (err) {
      setError(err.response?.data?.error || 'This reset link is invalid or has expired. Please request a new one.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[100dvh] flex flex-col lg:flex-row overflow-y-auto">
      {/* ── LEFT BRAND PANEL ── */}
      <div
        className="flex flex-row lg:flex-col items-center lg:items-stretch justify-start lg:justify-between w-full lg:w-[48%] gap-4 lg:gap-0 p-5 lg:p-[clamp(1.5rem,4vh,3.5rem)] relative overflow-hidden shrink-0"
        style={{ background: 'linear-gradient(145deg, #0E606E 0%, #0A4A55 50%, #083840 100%)' }}
      >
        <div className="hidden lg:block absolute -top-24 -left-24 w-96 h-96 rounded-full opacity-10"
             style={{ background: 'radial-gradient(circle, white, transparent)' }} />
        <div className="hidden lg:block absolute bottom-0 right-0 w-72 h-72 rounded-full opacity-10 translate-x-1/3 translate-y-1/3"
             style={{ background: 'radial-gradient(circle, white, transparent)' }} />

        {/* ── night-sky illustration: shooting stars up top, scattered
            dots for stars, and a soft cloud/hill silhouette resting
            along the bottom edge — same idea as the reference mock,
            recoloured into the app's teal family instead of blue. ── */}
        <svg
          className="hidden lg:block pointer-events-none absolute inset-0 w-full h-full"
          viewBox="0 0 500 900" preserveAspectRatio="none"
        >
          {/* shooting stars */}
          <g stroke="#EAF6F4" strokeWidth="2.5" strokeLinecap="round" opacity="0.55">
            <line x1="80" y1="70" x2="140" y2="20" />
            <line x1="150" y1="120" x2="195" y2="80" />
            <line x1="330" y1="55" x2="380" y2="10" />
          </g>
          <g fill="#EAF6F4">
            <circle cx="145" cy="18" r="3" opacity="0.9" />
            <circle cx="382" cy="8" r="3" opacity="0.9" />
          </g>
          {/* scattered small stars */}
          <g fill="#FFFFFF" opacity="0.5">
            <circle cx="60" cy="180" r="2" />
            <circle cx="230" cy="140" r="2.5" />
            <circle cx="410" cy="200" r="2" />
            <circle cx="300" cy="260" r="1.8" />
            <circle cx="120" cy="300" r="2" />
            <circle cx="430" cy="330" r="2.2" />
            <circle cx="40" cy="380" r="1.8" />
          </g>
          {/* soft hill / cloud silhouette along the bottom */}
          <path
            d="M0 620 C 60 560, 140 560, 190 610 C 230 560, 300 560, 340 610 C 380 570, 450 575, 500 615 L500 900 L0 900 Z"
            fill="#0A4A55" opacity="0.55"
          />
          <path
            d="M0 700 C 80 650, 160 660, 210 700 C 260 655, 340 660, 390 705 C 430 675, 470 680, 500 705 L500 900 L0 900 Z"
            fill="#083840" opacity="0.7"
          />
        </svg>

        <div className="flex items-center gap-3 relative z-10">
          <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm border border-white/10">
            <Scissors className="text-white" size={22} />
          </div>
          <div>
            <p className="text-white font-black text-lg tracking-widest uppercase">Smart Master</p>
            <p className="text-white/50 text-xs font-medium tracking-widest">TAILORING MANAGEMENT</p>
          </div>
        </div>

        <div className="hidden lg:block relative z-10 space-y-[clamp(0.75rem,3vh,2rem)]">
          <div className="inline-flex items-center gap-2 bg-white/10 border border-white/10 px-4 py-2 rounded-full backdrop-blur-sm">
            <KeyRound size={14} className="text-white/80" />
            <span className="text-white/80 text-xs font-bold tracking-widest uppercase">Password Reset</span>
          </div>
          <h1 className="text-[clamp(1.75rem,5.5vh,3.75rem)] font-black text-white leading-[1.1] tracking-tighter">
            Create<br/>
            <span className="text-white/50">New</span><br/>
            Password
          </h1>
          <p className="text-white/60 text-[clamp(0.8rem,2.2vh,1.125rem)] font-medium leading-relaxed max-w-sm">
            Set your new password and log back into your account.
          </p>
        </div>

        <p className="hidden lg:block text-white/30 text-sm font-medium relative z-10">
          © {new Date().getFullYear()} Smart Master
        </p>
      </div>

      {/* ── RIGHT FORM PANEL ── */}
      <div className="flex-1 flex items-start lg:items-center justify-center p-[clamp(1rem,4vh,2rem)] px-[clamp(1.25rem,5vw,2rem)] bg-slate-50">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="w-full max-w-md space-y-[clamp(1rem,4vh,2rem)] my-[clamp(0.5rem,2vh,1rem)]"
        >
          {done ? (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
              <div className="space-y-3">
                <div className="w-14 h-14 bg-emerald-50 ring-8 ring-emerald-50/60 rounded-full flex items-center justify-center text-emerald-600">
                  <CheckCircle2 size={26} />
                </div>
                <h2 className="text-3xl font-black text-slate-800 tracking-tighter">Password Reset Successful</h2>
                <p className="text-slate-500 font-medium">You can now log in with your new password. Redirecting to the login page...</p>
              </div>
              <Link to="/login" className="primary-btn w-full py-5 rounded-xl flex items-center justify-center gap-3 text-base font-black shadow-2xl shadow-primary/25">
                Go to Login <ArrowRight size={20} />
              </Link>
            </motion.div>
          ) : (
            <>
              <Link to="/login" className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-primary transition-colors">
                <ArrowLeft size={16} /> Back to Login
              </Link>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <h2 className="text-4xl font-black text-slate-800 tracking-tighter">Set New Password</h2>
                  <p className="text-slate-500 font-medium text-lg">
                    {email ? <>Account: <span className="font-black text-slate-700">{email}</span></> : 'Enter your new password'}
                  </p>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-500 uppercase tracking-widest">
                    New Password
                  </label>
                  <div className="flex items-stretch border border-slate-200 rounded-xl overflow-hidden bg-white/50 focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary/30 transition-all">
                    <div className="flex items-center justify-center px-4 bg-slate-100/80 border-r border-slate-200 min-w-[52px]">
                      <Lock size={18} className="text-slate-400" />
                    </div>
                    <input
                      type="password"
                      placeholder="••••••••"
                      className="flex-1 px-4 py-5 text-base bg-transparent outline-none text-slate-700 placeholder:text-slate-400"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      required
                      autoFocus
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-500 uppercase tracking-widest">
                    Confirm Password
                  </label>
                  <div className="flex items-stretch border border-slate-200 rounded-xl overflow-hidden bg-white/50 focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary/30 transition-all">
                    <div className="flex items-center justify-center px-4 bg-slate-100/80 border-r border-slate-200 min-w-[52px]">
                      <Lock size={18} className="text-slate-400" />
                    </div>
                    <input
                      type="password"
                      placeholder="••••••••"
                      className="flex-1 px-4 py-5 text-base bg-transparent outline-none text-slate-700 placeholder:text-slate-400"
                      value={confirmPassword}
                      onChange={e => setConfirmPassword(e.target.value)}
                      required
                    />
                  </div>
                </div>

                {error && (
                  <div className="flex items-center gap-3 bg-red-50 border border-red-100 text-red-600 px-5 py-4 rounded-xl text-sm font-bold">
                    <ShieldAlert size={18} className="flex-shrink-0" />
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="primary-btn w-full py-5 rounded-xl flex items-center justify-center gap-3 text-base font-black shadow-2xl shadow-primary/25 disabled:opacity-60"
                >
                  {loading ? 'Resetting...' : (
                    <>Reset Password <ArrowRight size={20} /></>
                  )}
                </button>
              </form>
            </>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default ResetPassword;
