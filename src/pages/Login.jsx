import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useLocalState } from '../context/useLocalState';
import { motion, AnimatePresence } from 'framer-motion';
import { Scissors, Mail, Lock, ArrowRight, ShieldAlert } from 'lucide-react';

const fadeUp = (i = 0) => ({
  initial: { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.4, delay: i * 0.08, ease: 'easeOut' },
});

// Reveals a heading letter by letter on mount — the transition happens on
// every single character (not the whole word at once), like a typewriter.
// Each word is kept in its own nowrap wrapper so it never splits mid-word
// across a line, but every letter inside it is its own animated span.
// `tokens` lets a word be marked dim (its own className) or force a line
// break after it, so the original heading layout is kept.
const TypewriterHeading = ({ tokens, startDelay = 0.15, letterGap = 0.035, className, dimClassName }) => {
  let letterIndex = -1;
  return (
    <h1 className={className}>
      {tokens.map((token, ti) => (
        <React.Fragment key={ti}>
          <span style={{ display: 'inline-block', whiteSpace: 'nowrap' }} className={token.dim ? dimClassName : undefined}>
            {token.text.split('').map((letter, li) => {
              letterIndex += 1;
              const delay = startDelay + letterIndex * letterGap;
              return (
                <motion.span
                  key={li}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25, delay, ease: 'easeOut' }}
                  style={{ display: 'inline-block' }}
                >
                  {letter}
                </motion.span>
              );
            })}
          </span>
          {token.break ? <br /> : (() => { letterIndex += 1; return ' '; })()}
        </React.Fragment>
      ))}
    </h1>
  );
};

// One login page for everyone. Admin and workers both sign in here with
// their own email and password — the backend decides who they are and
// sends them to the right place.
const Login = () => {
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [error,    setError]    = useState('');
  const [loading,  setLoading]  = useState(false);
  const { login } = useLocalState();
  const navigate  = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await login(email, password);
      if (res.role === 'admin') {
        navigate('/');
      } else if (res.role === 'worker') {
        navigate('/worker-portal');
      } else if (res.role === 'customer') {
        navigate('/customer-portal');
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Email ya password galat hai / Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex overflow-hidden">

      {/* ── LEFT BRAND PANEL ── */}
      <motion.div
        initial={{ opacity: 0, x: -24 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="hidden lg:flex flex-col justify-between w-[48%] p-14 relative overflow-hidden"
        style={{ background: 'linear-gradient(145deg, #0E606E 0%, #0A4A55 50%, #083840 100%)' }}
      >
        {/* Decorative circles — slow, subtle, continuous drift so the
            panel doesn't feel static, but never distracting enough to
            compete with the form. */}
        <motion.div
          className="absolute -top-24 -left-24 w-96 h-96 rounded-full opacity-10"
          style={{ background: 'radial-gradient(circle, white, transparent)' }}
          animate={{ scale: [1, 1.08, 1], opacity: [0.1, 0.14, 0.1] }}
          transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute bottom-0 right-0 w-72 h-72 rounded-full opacity-10 translate-x-1/3 translate-y-1/3"
          style={{ background: 'radial-gradient(circle, white, transparent)' }}
          animate={{ scale: [1, 1.12, 1], opacity: [0.1, 0.16, 0.1] }}
          transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
        />
        <motion.div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full opacity-[0.04]"
          style={{ background: 'radial-gradient(circle, white, transparent)' }}
          animate={{ rotate: 360 }}
          transition={{ duration: 60, repeat: Infinity, ease: 'linear' }}
        />

        {/* Top logo */}
        <motion.div {...fadeUp(0)} className="flex items-center gap-3 relative z-10">
          <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm border border-white/10">
            <Scissors className="text-white" size={22} />
          </div>
          <div>
            <p className="text-white font-black text-lg tracking-widest uppercase">Smart Master</p>
            <p className="text-white/50 text-xs font-medium tracking-widest">TAILORING MANAGEMENT</p>
          </div>
        </motion.div>

        {/* Center content */}
        <div className="relative z-10 space-y-8">
          <TypewriterHeading
            className="text-5xl xl:text-6xl font-black text-white leading-[1.1] tracking-tighter"
            dimClassName="text-white/50"
            startDelay={0.15}
            letterGap={0.035}
            tokens={[
              { text: 'Apni' },
              { text: 'Dukaan', break: true },
              { text: 'Ka', dim: true },
              { text: 'Smart', dim: true, break: true },
              { text: 'Hisaab' },
            ]}
          />
          <motion.p {...fadeUp(2)} className="text-white/60 text-lg font-medium leading-relaxed max-w-sm">
            Customers, orders, measurements aur workers — sab ek jagah manage karein.
          </motion.p>
        </div>

        {/* Bottom tagline */}
        <motion.p {...fadeUp(3)} className="text-white/30 text-sm font-medium relative z-10">
          © {new Date().getFullYear()} Smart Master
        </motion.p>
      </motion.div>

      {/* ── RIGHT FORM PANEL ── */}
      <div className="flex-1 flex items-center justify-center p-8 bg-slate-50">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="w-full max-w-md space-y-10"
        >

          {/* Mobile logo (hidden on desktop) */}
          <motion.div {...fadeUp(0)} className="lg:hidden flex items-center gap-3">
            <div className="w-12 h-12 bg-primary rounded-2xl flex items-center justify-center shadow-lg shadow-primary/30">
              <Scissors className="text-white" size={22} />
            </div>
            <div>
              <p className="font-black text-slate-800 text-lg tracking-wide uppercase">Smart Master</p>
              <p className="text-slate-400 text-xs font-medium">Tailoring Management</p>
            </div>
          </motion.div>

          {/* Heading */}
          <motion.div {...fadeUp(1)} className="space-y-2">
            <h2 className="text-4xl font-black text-slate-800 tracking-tighter">Welcome back</h2>
            <p className="text-slate-500 font-medium text-lg">Apna account sign in karein</p>
          </motion.div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email */}
            <motion.div {...fadeUp(2)} className="space-y-2">
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
            </motion.div>

            {/* Password */}
            <motion.div {...fadeUp(3)} className="space-y-2">
              <label className="text-xs font-black text-slate-500 uppercase tracking-widest">
                Password / پاس ورڈ
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
                />
              </div>
            </motion.div>

            {/* Error */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -8, height: 0 }}
                  animate={{ opacity: 1, y: 0, height: 'auto' }}
                  exit={{ opacity: 0, y: -8, height: 0 }}
                  transition={{ duration: 0.25, ease: 'easeOut' }}
                  className="space-y-2 overflow-hidden"
                >
                  <motion.div
                    animate={{ x: [0, -6, 6, -4, 4, 0] }}
                    transition={{ duration: 0.4 }}
                    className="flex items-center gap-3 bg-red-50 border border-red-100 text-red-600 px-5 py-4 rounded-2xl text-sm font-bold"
                  >
                    <ShieldAlert size={18} className="flex-shrink-0" />
                    {error}
                  </motion.div>
                  <p className="text-xs text-slate-400 font-medium px-1">
                    Account nahi hai?{' '}
                    <Link to="/customer-register" className="text-primary font-black hover:underline">Sign Up</Link>
                  </p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Submit */}
            <motion.button
              {...fadeUp(4)}
              type="submit"
              disabled={loading}
              whileHover={{ scale: loading ? 1 : 1.015 }}
              whileTap={{ scale: loading ? 1 : 0.98 }}
              className="primary-btn w-full py-5 rounded-2xl flex items-center justify-center gap-3 text-base font-black shadow-2xl shadow-primary/25 mt-2 disabled:opacity-60 group"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
                  </svg>
                  Signing in...
                </span>
              ) : (
                <>
                  Sign In
                  <ArrowRight size={20} className="transition-transform group-hover:translate-x-1" />
                </>
              )}
            </motion.button>
          </form>

          <motion.p {...fadeUp(5)} className="text-center text-slate-400 text-xs font-medium leading-relaxed">
            Naya worker hain?{' '}
            <Link to="/register" className="text-primary font-black hover:underline">Apna account banayein</Link>
            <br />
            <span className="inline-block mt-1">
              Customer hain aur account nahi hai?{' '}
              <Link to="/customer-register" className="text-primary font-black hover:underline">Sign Up karein</Link>
            </span>
          </motion.p>

        </motion.div>
      </div>
    </div>
  );
};

export default Login;
