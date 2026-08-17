import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { Mail, Lock, ArrowRight, ShieldAlert, ArrowLeft, CheckCircle2, Scissors } from 'lucide-react';
import { authService } from '../api/api';
import { useLanguage } from '../context/LanguageContext';
import { validateEmail, validatePassword } from '../utils/validators';
import PortalFooter from '../components/PortalFooter';

// Public "forgot password" page — worker and customer accounts only (the
// admin account lives in .env, not the database, so there's nothing to
// reset here for that one).
//
// Single page, two steps, no emailed link to wait on:
//   1. Type your account email, hit Continue — we just confirm the
//      account exists.
//   2. Type your new password twice, right here, and you're done.
const ForgotPassword = () => {
  const [step, setStep] = useState('email'); // 'email' | 'password' | 'done'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { language, setLanguage, t } = useLanguage();
  const { t: ti } = useTranslation();

  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const emailError = validateEmail(email, { t: ti });
    if (emailError) { setError(emailError); return; }

    setLoading(true);
    try {
      await authService.checkResetEmail(email.trim());
      setStep('password');
    } catch (err) {
      setError(err.response?.data?.error || t('No account found with this email.', 'اس ای میل کے ساتھ کوئی اکاؤنٹ نہیں ملا۔'));
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const passwordError = validatePassword(password, { t: ti });
    if (passwordError) { setError(passwordError); return; }
    if (password !== confirmPassword) {
      setError(t('Passwords do not match', 'پاس ورڈ مماثل نہیں ہیں'));
      return;
    }

    setLoading(true);
    try {
      await authService.resetPasswordDirect({ email: email.trim(), newPassword: password });
      setStep('done');
      setTimeout(() => navigate('/login'), 2500);
    } catch (err) {
      setError(err.response?.data?.error || t('Something went wrong. Please try again.', 'کچھ غلط ہو گیا۔ دوبارہ کوشش کریں۔'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[100dvh] flex flex-col overflow-y-auto" style={{ background: '#FBF6EA' }}>
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
          <span className="inline-block text-white/70 text-[9px] sm:text-[11px] md:text-xs font-bold tracking-wide whitespace-nowrap truncate max-w-[90px] sm:max-w-none flex-shrink-0">
            {new Date().toLocaleDateString(language === 'ur' ? 'ur-PK' : 'en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
          </span>
        </div>
      </div>

      {/* ── FORM PANEL ── */}
      <div className="flex-1 flex flex-col items-center justify-center p-[clamp(1rem,4vh,2rem)] px-[clamp(1.25rem,5vw,2rem)]">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="w-full max-w-[440px] sm:max-w-[480px] md:max-w-[560px] lg:max-w-[600px] space-y-[clamp(1rem,4vh,2rem)] my-[clamp(0.5rem,2vh,1rem)] bg-white rounded-2xl shadow-md border-2 p-5 sm:p-6 md:p-8 lg:p-10"
          style={{ borderColor: '#1C6B82' }}
        >
          <div className="flex items-center justify-between gap-3 flex-wrap">
            {step !== 'done' ? (
              <Link
                to="/login"
                onClick={() => { if (step === 'password') { setStep('email'); setError(''); } }}
                className="inline-flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm font-bold text-slate-500 hover:text-primary transition-colors"
              >
                <ArrowLeft size={14} className="sm:w-4 sm:h-4 flex-shrink-0" /> {step === 'password' ? t('Back', 'واپس') : t('Back to Login', 'لاگ ان پر واپس جائیں')}
              </Link>
            ) : <span />}

            <div className="flex items-center bg-slate-100 rounded-xl p-1 gap-0.5 shrink-0">
              <button
                type="button"
                onClick={() => setLanguage('en')}
                className={`px-2 sm:px-2.5 md:px-3 py-1 sm:py-1.5 rounded-xl text-[10px] sm:text-xs font-black transition-all ${language === 'en' ? 'bg-white text-primary shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
              >
                English
              </button>
              <button
                type="button"
                onClick={() => setLanguage('ur')}
                className={`px-2 sm:px-2.5 md:px-3 py-1 sm:py-1.5 rounded-xl text-[10px] sm:text-xs font-black transition-all ${language === 'ur' ? 'bg-white text-primary shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
              >
                اردو
              </button>
            </div>
          </div>

          <AnimatePresence mode="wait">
            {step === 'done' ? (
              <motion.div
                key="done"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                <div className="space-y-3">
                  <div className="w-14 h-14 bg-emerald-50 ring-8 ring-emerald-50/60 rounded-full flex items-center justify-center text-emerald-600">
                    <CheckCircle2 size={26} />
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-black text-slate-800 tracking-tighter">{t('Password Reset Successful', 'پاس ورڈ کامیابی سے ری سیٹ ہو گیا')}</h2>
                  <p className="text-slate-500 font-medium">{t('You can now log in with your new password. Redirecting to the login page...', 'اب آپ اپنے نئے پاس ورڈ سے لاگ ان کر سکتے ہیں۔ لاگ ان پیج پر بھیجا جا رہا ہے...')}</p>
                </div>
                <Link to="/login" className="primary-btn w-full py-4 sm:py-5 rounded-xl flex items-center justify-center gap-3 text-base font-black shadow-md shadow-primary/15">
                  {t('Go to Login', 'لاگ ان پر جائیں')} <ArrowRight size={20} />
                </Link>
              </motion.div>
            ) : step === 'password' ? (
              <motion.form
                key="password-step"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                onSubmit={handlePasswordSubmit}
                className="space-y-5 sm:space-y-6"
              >
                <div className="space-y-2">
                  <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-slate-800 tracking-tighter">{t('Set New Password', 'نیا پاس ورڈ سیٹ کریں')}</h2>
                  <p className="text-slate-500 font-medium text-base sm:text-lg break-words">
                    {t('Account:', 'اکاؤنٹ:')} <span className="font-black text-slate-700 break-all">{email}</span>
                  </p>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-500 uppercase tracking-widest">
                    {t('New Password', 'نیا پاس ورڈ')}
                  </label>
                  <div className="flex items-stretch border border-slate-200 rounded-xl overflow-hidden bg-white/50 focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary/30 transition-all">
                    <div className="flex items-center justify-center px-3 sm:px-4 bg-slate-100/80 border-r border-slate-200 min-w-[44px] sm:min-w-[52px]">
                      <Lock size={18} className="text-slate-400" />
                    </div>
                    <input
                      type="password"
                      placeholder="••••••••"
                      className="flex-1 px-4 py-4 sm:py-5 text-base bg-transparent outline-none text-slate-700 placeholder:text-slate-400"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      required
                      autoFocus
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-500 uppercase tracking-widest">
                    {t('Confirm Password', 'پاس ورڈ کی تصدیق کریں')}
                  </label>
                  <div className="flex items-stretch border border-slate-200 rounded-xl overflow-hidden bg-white/50 focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary/30 transition-all">
                    <div className="flex items-center justify-center px-3 sm:px-4 bg-slate-100/80 border-r border-slate-200 min-w-[44px] sm:min-w-[52px]">
                      <Lock size={18} className="text-slate-400" />
                    </div>
                    <input
                      type="password"
                      placeholder="••••••••"
                      className="flex-1 px-4 py-4 sm:py-5 text-base bg-transparent outline-none text-slate-700 placeholder:text-slate-400"
                      value={confirmPassword}
                      onChange={e => setConfirmPassword(e.target.value)}
                      required
                    />
                  </div>
                </div>

                {error && (
                  <div className="flex items-center gap-3 bg-red-50 border border-red-100 text-red-600 px-4 py-3 sm:px-5 sm:py-4 rounded-xl text-sm font-bold">
                    <ShieldAlert size={18} className="flex-shrink-0" />
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="primary-btn w-full py-4 sm:py-5 rounded-xl flex items-center justify-center gap-3 text-base font-black shadow-md shadow-primary/15 disabled:opacity-60"
                >
                  {loading ? t('Resetting...', 'ری سیٹ ہو رہا ہے...') : (
                    <>{t('Reset Password', 'پاس ورڈ ری سیٹ کریں')} <ArrowRight size={20} /></>
                  )}
                </button>
              </motion.form>
            ) : (
              <motion.form
                key="email-step"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                onSubmit={handleEmailSubmit}
                className="space-y-5 sm:space-y-6"
              >
                <div className="space-y-2">
                  <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-slate-800 tracking-tighter">{t('Reset your password', 'اپنا پاس ورڈ ری سیٹ کریں')}</h2>
                  <p className="text-slate-500 font-medium text-base sm:text-lg">{t('Enter your account email to continue', 'جاری رکھنے کے لیے اپنا اکاؤنٹ ای میل درج کریں')}</p>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-500 uppercase tracking-widest">
                    {t('Email Address', 'ای میل ایڈریس')}
                  </label>
                  <div className="flex items-stretch border border-slate-200 rounded-xl overflow-hidden bg-white/50 focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary/30 transition-all">
                    <div className="flex items-center justify-center px-3 sm:px-4 bg-slate-100/80 border-r border-slate-200 min-w-[44px] sm:min-w-[52px]">
                      <Mail size={18} className="text-slate-400" />
                    </div>
                    <input
                      type="email"
                      placeholder="you@example.com"
                      className="flex-1 min-w-0 px-4 py-4 sm:py-5 text-base bg-transparent outline-none text-slate-700 placeholder:text-slate-400"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      required
                      autoFocus
                    />
                  </div>
                </div>

                {error && (
                  <div className="flex items-center gap-3 bg-red-50 border border-red-100 text-red-600 px-4 py-3 sm:px-5 sm:py-4 rounded-xl text-sm font-bold">
                    <ShieldAlert size={18} className="flex-shrink-0" />
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="primary-btn w-full py-4 sm:py-5 rounded-xl flex items-center justify-center gap-3 text-base font-black shadow-md shadow-primary/15 disabled:opacity-60"
                >
                  {loading ? t('Checking...', 'جانچا جا رہا ہے...') : (
                    <>{t('Continue', 'جاری رکھیں')} <ArrowRight size={20} /></>
                  )}
                </button>
              </motion.form>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
      <PortalFooter />
    </div>
  );
};

export default ForgotPassword;
