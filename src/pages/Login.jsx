import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useLocalState } from '../context/useLocalState';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Lock, ArrowRight, ShieldAlert, Scissors } from 'lucide-react';
import AuthUnderlineField from '../components/AuthUnderlineField';

const fadeUp = (i = 0) => ({
  initial: { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.4, delay: i * 0.08, ease: 'easeOut' },
});

// Accent used across this page's form controls, links and button — back
// to the app's teal family (a few different teal shades), with a touch of
// cream mixed into the decorative background for warmth.
const ACCENT_LINE = 'linear-gradient(90deg, #4FA6B8, #1C6B82, #0B5E63)';
const ACCENT_SOLID = '#1C6B82';
const ACCENT_BUTTON = 'linear-gradient(90deg, #4FA6B8 0%, #1C6B82 55%, #0B5E63 100%)';
const CREAM = '#F5E9D3';

// One login page for everyone. Admin and workers both sign in here with
// their own email and password — the backend decides who they are and
// sends them to the right place.
const Login = () => {
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(true);
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
      setError(err.response?.data?.error || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-[100dvh] w-full flex items-center justify-center overflow-y-auto relative px-4 py-8 sm:py-12"
      style={{ background: 'linear-gradient(135deg, #083840 0%, #0B5E63 45%, #1C6B82 100%)' }}
    >
      {/* ── decorative outer backdrop, echoing the reference's diagonal bars ── */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden opacity-40">
        <div className="absolute -top-10 -left-16 w-64 h-16 rounded-full rotate-[-35deg]" style={{ background: `${CREAM}25` }} />
        <div className="absolute -top-2 left-20 w-40 h-12 bg-white/10 rounded-full rotate-[-35deg]" />
        <div className="absolute top-24 -left-10 w-52 h-14 rounded-full rotate-[-35deg]" style={{ background: '#D9A44122' }} />
        <div className="absolute -bottom-12 -right-16 w-72 h-16 rounded-full rotate-[-35deg]" style={{ background: `${CREAM}25` }} />
        <div className="absolute bottom-16 right-4 w-44 h-12 rounded-full rotate-[-35deg]" style={{ background: '#FF9E8022' }} />
        <div className="absolute bottom-40 -right-10 w-56 h-14 bg-white/10 rounded-full rotate-[-35deg]" />
        <div className="hidden sm:block absolute top-1/3 left-6 w-24 h-24 rounded-full border-4 border-white/10" />
        <div className="hidden sm:block absolute bottom-10 right-1/4 w-16 h-16 rounded-full" style={{ background: '#CBD5C822' }} />
      </div>

      {/* ── right-side decorative cluster — the spot marked out on the
          reference mock, built from the requested Memphis palette:
          white, gold/mustard, coral/peach, cream/ivory, silver/gray
          and soft pink, floating over the teal background. ── */}
      <svg
        className="hidden lg:block pointer-events-none absolute right-6 xl:right-14 top-1/2 -translate-y-1/2 opacity-90"
        width="150" height="230" viewBox="0 0 150 230" fill="none"
      >
        {/* soft white ring, top */}
        <circle cx="70" cy="34" r="22" stroke="#FFFFFF" strokeOpacity="0.85" strokeWidth="5" />
        {/* gold/mustard ring, slightly offset */}
        <circle cx="112" cy="70" r="15" stroke="#D9A441" strokeWidth="5" />
        {/* coral/peach cross */}
        <path d="M20 96 L44 120 M20 120 L44 96" stroke="#FF9E80" strokeWidth="7" strokeLinecap="round" />
        {/* cream/ivory filled dot */}
        <circle cx="90" cy="140" r="10" fill="#F5E9D3" />
        {/* silver/gray zigzag */}
        <path d="M18 168 h18 v14 h18" stroke="#CBD5C8" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
        {/* soft pink dot, bottom */}
        <circle cx="118" cy="204" r="9" fill="#F4B8C4" />
        {/* small white dot for balance */}
        <circle cx="46" cy="210" r="5" fill="#FFFFFF" fillOpacity="0.7" />
      </svg>

      {/* ── CARD ── */}
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="relative z-10 w-full max-w-[500px] rounded-[28px] overflow-hidden shadow-2xl bg-white"
      >
        {/* ── colorful header panel ── */}
        <div
          className="relative overflow-hidden px-7 pt-8 pb-14"
          style={{ background: 'linear-gradient(135deg, #4FA6B8 0%, #1C6B82 55%, #0B5E63 100%)' }}
        >
          {/* Memphis-style decorative shapes — kept clear of the logo and
              text column (left ~60%), clustered on the right instead, with
              a mix of gold, coral, cream, silver and soft-pink accents
              against the teal gradient. */}
          <svg className="absolute inset-0 w-full h-full" viewBox="0 0 500 260" preserveAspectRatio="none">
            {/* soft ribbon texture, right side only */}
            <path d="M300 0 C 340 40, 300 70, 360 90" stroke="#ffffff" strokeOpacity="0.12" strokeWidth="22" fill="none" />
            <path d="M420 260 C 380 220, 430 190, 400 150" stroke="#083840" strokeOpacity="0.15" strokeWidth="24" fill="none" />

            {/* gold/mustard ring, top right */}
            <circle cx="452" cy="34" r="17" fill="none" stroke="#D9A441" strokeWidth="5" opacity="0.95" />
            {/* coral/peach X, below the ring */}
            <path d="M436 92 L450 78 M436 78 L450 92" stroke="#FF9E80" strokeWidth="6" strokeLinecap="round" />
            {/* soft pink dot */}
            <circle cx="468" cy="120" r="6" fill="#F4B8C4" opacity="0.9" />
            {/* silver/gray zigzag stairs */}
            <path d="M392 168 h14 v10 h14" fill="none" stroke="#CBD5C8" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" opacity="0.9" />
            {/* cream ring, lower right */}
            <circle cx="430" cy="216" r="9" fill="none" stroke={CREAM} strokeWidth="4" opacity="0.85" />
            {/* small cream dot, far bottom-left, clear of the subtitle text */}
            <circle cx="20" cy="238" r="7" fill={CREAM} opacity="0.6" />
          </svg>

          <div className="relative z-10 flex items-center gap-2.5 mb-6">
            <div className="w-9 h-9 bg-white/20 rounded-lg flex items-center justify-center backdrop-blur-sm border border-white/20">
              <Scissors className="text-white" size={16} />
            </div>
            <span className="text-white font-black text-sm tracking-[0.2em] uppercase">Smart Master</span>
          </div>

          <h1 className="relative z-10 text-white font-black text-[28px] sm:text-[32px] leading-[1.1] tracking-tight max-w-[300px]">
            Welcome to<br />our website
          </h1>
          <p className="relative z-10 mt-3 text-white/85 text-[13px] leading-relaxed max-w-[320px]">
            Sign in to manage orders, track measurements and stay on top of every job — all in one place.
          </p>
        </div>

        {/* ── white login panel, overlapping the header like the reference ── */}
        <div className="relative -mt-8 rounded-t-[28px] px-7 pt-7 pb-8" style={{ background: '#FFFDF7' }}>
          <h2 className="text-center font-black text-xl tracking-[0.15em] text-slate-800 uppercase mb-6">
            Log In
          </h2>

          <form onSubmit={handleSubmit} className="space-y-5">
            <motion.div {...fadeUp(0)}>
              <AuthUnderlineField
                label="Email Address"
                type="email"
                placeholder="Enter your username or email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                autoFocus
                accent={ACCENT_LINE}
              />
            </motion.div>

            <motion.div {...fadeUp(1)}>
              <div className="flex items-center justify-between">
                <label className="text-[13px] font-bold tracking-wide text-slate-400 uppercase">
                  Password
                </label>
                <Link
                  to="/forgot-password"
                  className="text-[12px] font-bold hover:underline"
                  style={{ color: ACCENT_SOLID }}
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative mt-2">
                <input
                  type="password"
                  placeholder="Enter your password"
                  className="w-full bg-transparent outline-none text-slate-700 placeholder:text-slate-300 text-[15px] py-1.5"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                />
                <div className="absolute bottom-0 left-0 right-0 h-[2px] rounded-full" style={{ background: ACCENT_LINE }} />
              </div>
            </motion.div>

            <motion.div {...fadeUp(2)} className="flex items-center text-sm pt-1">
              <label className="flex items-center gap-2 text-slate-500 font-medium cursor-pointer select-none text-[13px]">
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={e => setRemember(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-300"
                  style={{ accentColor: ACCENT_SOLID }}
                />
                Remember me
              </label>
            </motion.div>

            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -8, height: 0 }}
                  animate={{ opacity: 1, y: 0, height: 'auto' }}
                  exit={{ opacity: 0, y: -8, height: 0 }}
                  transition={{ duration: 0.25, ease: 'easeOut' }}
                  className="overflow-hidden"
                >
                  <motion.div
                    animate={{ x: [0, -6, 6, -4, 4, 0] }}
                    transition={{ duration: 0.4 }}
                    className="flex items-center gap-3 bg-red-50 border border-red-100 text-red-600 px-5 py-4 rounded-xl text-sm font-bold"
                  >
                    <ShieldAlert size={18} className="flex-shrink-0" />
                    {error}
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>

            <motion.button
              {...fadeUp(3)}
              type="submit"
              disabled={loading}
              whileHover={{ scale: loading ? 1 : 1.015 }}
              whileTap={{ scale: loading ? 1 : 0.98 }}
              className="w-full py-4 rounded-xl flex items-center justify-center gap-3 text-base font-black text-white shadow-xl disabled:opacity-60 group tracking-widest uppercase mt-2"
              style={{ background: ACCENT_BUTTON }}
            >
              {loading ? (
                <span className="flex items-center gap-2 normal-case tracking-normal">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
                  </svg>
                  Signing in...
                </span>
              ) : (
                <>
                  Login
                  <ArrowRight size={20} className="transition-transform group-hover:translate-x-1" />
                </>
              )}
            </motion.button>
          </form>

          <p className="text-center text-slate-400 text-xs font-medium leading-relaxed mt-6">
            Need a worker account?{' '}
            <Link to="/register" className="font-black hover:underline" style={{ color: ACCENT_SOLID }}>Create your account</Link>
            <br />
            <span className="inline-block mt-1">
              Need a customer account?{' '}
              <Link to="/customer-register" className="font-black hover:underline" style={{ color: ACCENT_SOLID }}>Sign Up</Link>
            </span>
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default Login;
