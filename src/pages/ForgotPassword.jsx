import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Scissors, Mail, ArrowRight, ShieldAlert, ArrowLeft, KeyRound, MailCheck } from 'lucide-react';
import { authService } from '../api/api';

// Public "forgot password" page — worker and customer accounts only (the
// admin account lives in .env, not the database, so there's nothing to
// email a reset link to). Submitting always shows the same "check your
// email" confirmation regardless of whether the email is registered, so
// this can't be used to check which emails have accounts.
const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await authService.forgotPassword(email.trim());
      setSent(true);
    } catch (err) {
      setError(err.response?.data?.error || 'Kuch ghalat ho gaya. Dobara koshish karein.');
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
            Password<br/>
            <span className="text-white/50">Bhool</span><br/>
            Gaye?
          </h1>
          <p className="text-white/60 text-lg font-medium leading-relaxed max-w-sm">
            Apna email likhein — hum aapko password reset karne ka link bhej dein gay.
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

          <Link to="/login" className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-primary transition-colors">
            <ArrowLeft size={16} /> Login par wapas jayein
          </Link>

          <AnimatePresence mode="wait">
            {sent ? (
              <motion.div
                key="sent"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                <div className="space-y-3">
                  <div className="w-14 h-14 bg-primary-light ring-8 ring-primary-light/40 rounded-full flex items-center justify-center text-primary">
                    <MailCheck size={26} />
                  </div>
                  <h2 className="text-3xl font-black text-slate-800 tracking-tighter">Email check karein</h2>
                  <p className="text-slate-500 font-medium">
                    Agar <span className="font-black text-slate-700">{email}</span> se account maujood hai, to reset link bhej diya gaya hai. Apna inbox (aur spam folder) check karein.
                  </p>
                </div>
                <Link to="/login" className="primary-btn w-full py-5 rounded-2xl flex items-center justify-center gap-3 text-base font-black shadow-2xl shadow-primary/25">
                  Login par jayein <ArrowRight size={20} />
                </Link>
              </motion.div>
            ) : (
              <motion.form
                key="form"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                onSubmit={handleSubmit}
                className="space-y-6"
              >
                <div className="space-y-2">
                  <h2 className="text-4xl font-black text-slate-800 tracking-tighter">Password reset karein</h2>
                  <p className="text-slate-500 font-medium text-lg">Apna account email darj karein</p>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-500 uppercase tracking-widest">
                    Email / ای میل
                  </label>
                  <div className="flex items-stretch border border-slate-200 rounded-2xl overflow-hidden bg-white/50 focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary/30 transition-all">
                    <div className="flex items-center justify-center px-4 bg-slate-100/80 border-r border-slate-200 min-w-[52px]">
                      <Mail size={18} className="text-slate-400" />
                    </div>
                    <input
                      type="email"
                      placeholder="you@example.com"
                      className="flex-1 px-4 py-5 text-base bg-transparent outline-none text-slate-700 placeholder:text-slate-400"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      required
                      autoFocus
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
                  {loading ? 'Bhej rahe hain...' : (
                    <>Reset Link Bhejein <ArrowRight size={20} /></>
                  )}
                </button>
              </motion.form>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  );
};

export default ForgotPassword;
