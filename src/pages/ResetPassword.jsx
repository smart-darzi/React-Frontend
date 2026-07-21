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
      setError('Yeh reset link invalid hai — dobara request karein / This reset link is invalid — please request a new one');
      return;
    }
    const passwordError = validatePassword(password);
    if (passwordError) { setError(passwordError); return; }
    if (password !== confirmPassword) {
      setError('Dono passwords match nahi ho rahe / Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      await authService.resetPassword({ email, token, newPassword: password });
      setDone(true);
      setTimeout(() => navigate('/login'), 2500);
    } catch (err) {
      setError(err.response?.data?.error || 'Reset link ghalat ya expire ho chuka hai. Dobara request karein.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* ── LEFT BRAND PANEL ── */}
      <div
        className="hidden lg:flex flex-col justify-between w-[48%] p-14 relative overflow-hidden"
        style={{ background: 'linear-gradient(145deg, #0E606E 0%, #0A4A55 50%, #083840 100%)' }}
      >
        <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full opacity-10"
             style={{ background: 'radial-gradient(circle, white, transparent)' }} />
        <div className="absolute bottom-0 right-0 w-72 h-72 rounded-full opacity-10 translate-x-1/3 translate-y-1/3"
             style={{ background: 'radial-gradient(circle, white, transparent)' }} />

        <div className="flex items-center gap-3 relative z-10">
          <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm border border-white/10">
            <Scissors className="text-white" size={22} />
          </div>
          <div>
            <p className="text-white font-black text-lg tracking-widest uppercase">Smart Master</p>
            <p className="text-white/50 text-xs font-medium tracking-widest">TAILORING MANAGEMENT</p>
          </div>
        </div>

        <div className="relative z-10 space-y-8">
          <div className="inline-flex items-center gap-2 bg-white/10 border border-white/10 px-4 py-2 rounded-full backdrop-blur-sm">
            <KeyRound size={14} className="text-white/80" />
            <span className="text-white/80 text-xs font-bold tracking-widest uppercase">Password Reset</span>
          </div>
          <h1 className="text-5xl xl:text-6xl font-black text-white leading-[1.1] tracking-tighter">
            Naya<br/>
            <span className="text-white/50">Password</span><br/>
            Banayein
          </h1>
          <p className="text-white/60 text-lg font-medium leading-relaxed max-w-sm">
            Apna naya password set karein aur wapas apne account mein login karein.
          </p>
        </div>

        <p className="text-white/30 text-sm font-medium relative z-10">
          © {new Date().getFullYear()} Smart Master
        </p>
      </div>

      {/* ── RIGHT FORM PANEL ── */}
      <div className="flex-1 flex items-center justify-center p-8 bg-slate-50">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="w-full max-w-md space-y-8"
        >
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-3">
            <div className="w-12 h-12 bg-primary rounded-2xl flex items-center justify-center shadow-lg shadow-primary/30">
              <Scissors className="text-white" size={22} />
            </div>
            <div>
              <p className="font-black text-slate-800 text-lg tracking-wide uppercase">Smart Master</p>
              <p className="text-slate-400 text-xs font-medium">Tailoring Management</p>
            </div>
          </div>

          {done ? (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
              <div className="space-y-3">
                <div className="w-14 h-14 bg-emerald-50 ring-8 ring-emerald-50/60 rounded-full flex items-center justify-center text-emerald-600">
                  <CheckCircle2 size={26} />
                </div>
                <h2 className="text-3xl font-black text-slate-800 tracking-tighter">Password reset ho gaya</h2>
                <p className="text-slate-500 font-medium">Ab aap apne naye password se login kar saktay hain. Login page par bhej rahe hain...</p>
              </div>
              <Link to="/login" className="primary-btn w-full py-5 rounded-2xl flex items-center justify-center gap-3 text-base font-black shadow-2xl shadow-primary/25">
                Login par jayein <ArrowRight size={20} />
              </Link>
            </motion.div>
          ) : (
            <>
              <Link to="/login" className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-primary transition-colors">
                <ArrowLeft size={16} /> Login par wapas jayein
              </Link>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <h2 className="text-4xl font-black text-slate-800 tracking-tighter">Naya password set karein</h2>
                  <p className="text-slate-500 font-medium text-lg">
                    {email ? <>Account: <span className="font-black text-slate-700">{email}</span></> : 'Apna naya password darj karein'}
                  </p>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-500 uppercase tracking-widest">
                    New Password / نیا پاس ورڈ
                  </label>
                  <div className="flex items-stretch border border-slate-200 rounded-2xl overflow-hidden bg-white/50 focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary/30 transition-all">
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
                    Confirm Password / پاس ورڈ دوبارہ
                  </label>
                  <div className="flex items-stretch border border-slate-200 rounded-2xl overflow-hidden bg-white/50 focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary/30 transition-all">
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
                  <div className="flex items-center gap-3 bg-red-50 border border-red-100 text-red-600 px-5 py-4 rounded-2xl text-sm font-bold">
                    <ShieldAlert size={18} className="flex-shrink-0" />
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="primary-btn w-full py-5 rounded-2xl flex items-center justify-center gap-3 text-base font-black shadow-2xl shadow-primary/25 disabled:opacity-60"
                >
                  {loading ? 'Reset ho raha hai...' : (
                    <>Password Reset Karein <ArrowRight size={20} /></>
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
