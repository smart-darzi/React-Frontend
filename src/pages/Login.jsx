import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useLocalState } from '../context/useLocalState';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldAlert, LogIn, Mail, Lock } from 'lucide-react';
import AuthBoxField from '../components/AuthBoxField';
import AuthSplitCard from '../components/AuthSplitCard';
import { useLanguage } from '../context/LanguageContext';

const fadeUp = (i = 0) => ({
  initial: { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.4, delay: i * 0.08, ease: 'easeOut' },
});

// Accent used across this page's form controls, links and button — the
// app's teal family.
const ACCENT_SOLID = '#1C6B82';
const ACCENT_BUTTON = 'linear-gradient(90deg, #4FA6B8 0%, #1C6B82 55%, #0B5E63 100%)';

// One login page for everyone. Admin and workers both sign in here with
// their own email and password — the backend decides who they are and
// sends them to the right place.
//
// Single centered card: brand panel + form panel together, no top header
// bar and no site footer.
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
    <AuthSplitCard
      badgeIcon={LogIn}
      badge={t('Sign In', 'سائن ان')}
      panelTitle={language === 'ur' ? (
        <>ہماری<br /><span className="text-white/50">دکان</span><br />میں خوش آمدید</>
      ) : (
        <>Welcome<br /><span className="text-white/50">to our</span><br />Shop</>
      )}
      panelSubtitle={t('Manage orders and track every job, all in one place.', 'تمام آرڈرز اور کام ایک ہی جگہ سنبھالیں۔')}
      boxHeight="lg:h-[620px]"
    >
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className="space-y-6"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-2">
            <h2 className="text-3xl sm:text-4xl font-black text-slate-800 tracking-tighter">{t('Log In', 'لاگ ان')}</h2>
            <p className="text-slate-500 font-medium text-sm sm:text-base">{t('Enter your details to access your account', 'اپنے اکاؤنٹ تک رسائی کے لیے تفصیلات درج کریں')}</p>
          </div>
          <div className="flex items-center bg-slate-100 rounded-xl p-1 gap-0.5 shrink-0">
            <button
              type="button"
              onClick={() => setLanguage('en')}
              className={`px-2.5 sm:px-3 py-1.5 rounded-xl text-[10px] sm:text-xs font-black transition-all ${language === 'en' ? 'bg-white text-primary shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
            >
              English
            </button>
            <button
              type="button"
              onClick={() => setLanguage('ur')}
              className={`px-2.5 sm:px-3 py-1.5 rounded-xl text-[10px] sm:text-xs font-black transition-all ${language === 'ur' ? 'bg-white text-primary shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
            >
              اردو
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <motion.div {...fadeUp(0)}>
            <AuthBoxField
              icon={Mail}
              label={t('Email Address', 'ای میل ایڈریس')}
              type="email"
              placeholder={t('Enter your username or email', 'اپنا یوزر نیم یا ای میل درج کریں')}
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              autoFocus
              accent={ACCENT_SOLID}
            />
          </motion.div>

          <motion.div {...fadeUp(1)}>
            <div className="flex items-center justify-between flex-wrap gap-x-3 gap-y-1 mb-1.5">
              <label className="text-[13px] font-bold tracking-wide text-slate-500">
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
            <AuthBoxField
              icon={Lock}
              type="password"
              placeholder={t('Enter your password', 'اپنا پاس ورڈ درج کریں')}
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              accent={ACCENT_SOLID}
            />
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

        {/* New here? Both self-signup flows (customer, worker) start from
            this page — without this, there was no way in from Login to
            either register screen at all. */}
        <motion.div {...fadeUp(4)} className="pt-2 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-center gap-x-2 gap-y-1 text-sm">
          <span className="text-slate-400 font-medium">{t("New here?", 'نئے صارف؟')}</span>
          <span className="flex items-center gap-1.5">
            <Link to="/customer-register" className="font-bold hover:underline" style={{ color: ACCENT_SOLID }}>
              {t('Sign up as Customer', 'کسٹمر کے طور پر سائن اپ کریں')}
            </Link>
            <span className="text-slate-300">·</span>
            <Link to="/register" className="font-bold hover:underline" style={{ color: ACCENT_SOLID }}>
              {t('Sign up as Worker', 'ورکر کے طور پر سائن اپ کریں')}
            </Link>
          </span>
        </motion.div>
      </motion.div>
    </AuthSplitCard>
  );
};

export default Login;
