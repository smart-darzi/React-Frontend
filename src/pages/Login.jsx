import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useLocalState } from '../context/useLocalState';
import { motion, AnimatePresence} from 'framer-motion';
import { Mail, Lock, ShieldAlert, Scissors } from 'lucide-react';
import AuthUnderlineField from '../components/AuthUnderlineField';
import { useLanguage } from '../context/LanguageContext';
import PortalFooter from '../components/PortalFooter';

const fadeUp = (i = 0) => ({
  initial: { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.4, delay: i * 0.08, ease: 'easeOut' },
});

// Accent used across this page's form controls, links and button — the
// app's teal family. The page itself is a clean white/cream, so teal is
// reserved for the interactive bits (underline, links, icon, button) —
// the teal gradient backdrop lives on the admin dashboard, not here.
const ACCENT_LINE = 'linear-gradient(90deg, #4FA6B8, #1C6B82, #0B5E63)';
const ACCENT_SOLID = '#1C6B82';
const ACCENT_BUTTON = 'linear-gradient(90deg, #4FA6B8 0%, #1C6B82 55%, #0B5E63 100%)';
const CREAM = '#FBF6EA';

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
  const { language, setLanguage, t } = useLanguage();

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
      setError(err.response?.data?.error || t('Invalid email or password', 'ای میل یا پاس ورڈ غلط ہے'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[100dvh] w-full flex flex-col overflow-y-auto relative" style={{ background: CREAM }}>
      {/* ── HEADER ── */}
      <div
        className="shrink-0 px-4 sm:px-6 py-3 sm:py-4"
        style={{ background: '#0E606E' }}
      >
        <div className="w-full flex items-center justify-between gap-1.5 sm:gap-3 flex-nowrap">
          <div className="flex items-center gap-1.5 sm:gap-2 min-w-0 flex-1">
            <div className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 bg-white/15 rounded-lg flex items-center justify-center backdrop-blur-sm border border-white/10 flex-shrink-0">
              <Scissors className="text-white" size={12} />
            </div>
            <span className="text-white font-black text-[10px] sm:text-xs md:text-sm tracking-widest uppercase truncate">Smart Master</span>
          </div>
          <div className="flex items-center gap-1.5 sm:gap-3 flex-shrink-0">
            <div className="flex items-center bg-white/10 border border-white/15 rounded-lg p-0.5 gap-0.5 backdrop-blur-sm">
              <button
                type="button"
                onClick={() => setLanguage('en')}
                className="px-1.5 sm:px-2 md:px-2.5 py-0.5 sm:py-1 rounded-md text-[9px] sm:text-[10px] md:text-xs font-black transition-all"
                style={language === 'en' ? { background: '#fff', color: '#0E606E' } : { color: 'rgba(255,255,255,0.7)' }}
              >
                English
              </button>
              <button
                type="button"
                onClick={() => setLanguage('ur')}
                className="px-1.5 sm:px-2 md:px-2.5 py-0.5 sm:py-1 rounded-md text-[9px] sm:text-[10px] md:text-xs font-black transition-all"
                style={language === 'ur' ? { background: '#fff', color: '#0E606E' } : { color: 'rgba(255,255,255,0.7)' }}
              >
                اردو
              </button>
            </div>
            <span className="inline-block text-white/70 text-[9px] sm:text-[11px] md:text-xs font-bold tracking-wide whitespace-nowrap truncate max-w-[90px] sm:max-w-none">
              {new Date().toLocaleDateString(language === 'ur' ? 'ur-PK' : 'en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
            </span>
          </div>
        </div>
      </div>

      <div className="flex-1 w-full flex flex-col items-center justify-center px-3 sm:px-6 py-6 sm:py-10 md:py-12">
      {/* ── CARD ── */}
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="relative z-10 w-full max-w-[440px] sm:max-w-[480px] md:max-w-[560px] lg:max-w-[600px] rounded-[20px] sm:rounded-[28px] overflow-hidden shadow-md bg-white border-2"
        style={{ borderColor: '#1C6B82' }}
      >
        {/* ── header panel, teal gradient (matches the app's brand accent) ── */}
        <div
          className="relative px-5 pt-7 pb-9 sm:px-7 sm:pt-9 sm:pb-11 md:px-9 md:pt-10 md:pb-12"
          style={{ background: 'linear-gradient(135deg, #10707F 0%, #0E606E 55%, #0A4A55 100%)' }}
        >
          <h1 className="relative z-10 text-white font-black text-2xl sm:text-[28px] md:text-[32px] leading-[1.1] tracking-tight max-w-full sm:max-w-[300px]">
            {language === 'ur' ? (
              <>ہماری<br />دکان میں خوش آمدید</>
            ) : (
              <>Welcome to<br />our Shop</>
            )}
          </h1>
          <p className="relative z-10 mt-3 text-white/75 text-[13px] leading-relaxed max-w-full sm:max-w-[320px]">
            {t('Sign in to manage orders, track measurements and stay on top of every job — all in one place.', 'آرڈرز کا انتظام کرنے، پیمائشیں ٹریک کرنے اور ہر کام پر نظر رکھنے کے لیے لاگ ان کریں — سب کچھ ایک ہی جگہ پر۔')}
          </p>
        </div>

        {/* ── login form panel ── */}
        <div className="relative px-5 pt-6 pb-7 sm:px-7 sm:pt-7 sm:pb-8 md:px-9 md:pt-8 md:pb-10 bg-white">
          <h2 className="flex justify-center mb-5 sm:mb-6">
            <span
              className="inline-block px-5 py-2 sm:px-6 sm:py-2.5 rounded-full text-sm sm:text-base font-black tracking-widest uppercase"
              style={{ background: 'rgba(28,107,130,0.1)', color: '#1C6B82' }}
            >
              {t('Log In', 'لاگ ان')}
            </span>
          </h2>

          <form onSubmit={handleSubmit} className="space-y-5">
            <motion.div {...fadeUp(0)}>
              <AuthUnderlineField
                label={t('Email Address', 'ای میل ایڈریس')}
                type="email"
                placeholder={t('Enter your username or email', 'اپنا یوزر نیم یا ای میل درج کریں')}
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                autoFocus
                accent={ACCENT_LINE}
              />
            </motion.div>

            <motion.div {...fadeUp(1)}>
              <div className="flex items-center justify-between flex-wrap gap-x-3 gap-y-1">
                <label className="text-[13px] font-bold tracking-wide text-slate-400 uppercase">
                  {t('Password', 'پاس ورڈ')}
                </label>
                <Link
                  to="/forgot-password"
                  className="text-[12px] font-bold hover:underline"
                  style={{ color: ACCENT_SOLID }}
                >
                  {t('Forgot password?', 'پاس ورڈ بھول گئے؟')}
                </Link>
              </div>
              <div className="relative mt-2">
                <input
                  type="password"
                  placeholder={t('Enter your password', 'اپنا پاس ورڈ درج کریں')}
                  className="w-full bg-transparent outline-none text-slate-700 placeholder:text-slate-300 text-base sm:text-[15px] py-1.5"
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
                {t('Remember me', 'مجھے یاد رکھیں')}
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
                    className="flex items-center gap-3 bg-red-50 border border-red-100 text-red-600 px-4 py-3 sm:px-5 sm:py-4 rounded-xl text-sm font-bold"
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
              className="w-full py-4 rounded-xl flex items-center justify-center gap-3 text-base font-black text-white shadow-md disabled:opacity-60 group tracking-widest uppercase mt-2"
              style={{ background: ACCENT_BUTTON }}
            >
              {loading ? (
                <span className="flex items-center gap-2 normal-case tracking-normal">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
                  </svg>
                  {t('Signing in...', 'لاگ ان ہو رہا ہے...')}
                </span>
              ) : (
                t('Login', 'لاگ ان')
              )}
            </motion.button>
          </form>

          <p className="text-center text-slate-400 text-xs font-medium leading-relaxed mt-6">
            {t('Need a worker account?', 'ورکر اکاؤنٹ چاہیے؟')}{' '}
            <Link to="/register" className="font-black hover:underline" style={{ color: ACCENT_SOLID }}>{t('Create your account', 'اپنا اکاؤنٹ بنائیں')}</Link>
            <br />
            <span className="inline-block mt-1">
              {t('Need a customer account?', 'کسٹمر اکاؤنٹ چاہیے؟')}{' '}
              <Link to="/customer-register" className="font-black hover:underline" style={{ color: ACCENT_SOLID }}>{t('Sign Up', 'سائن اپ')}</Link>
            </span>
          </p>
        </div>
      </motion.div>
      </div>
      <PortalFooter />
    </div>
  );
};

export default Login;
