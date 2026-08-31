import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Lock, ArrowRight, ShieldAlert, ArrowLeft, KeyRound, CheckCircle2 } from 'lucide-react';
import { authService } from '../api/api';
import { useLanguage } from '../context/LanguageContext';
import { validatePassword } from '../utils/validators';
import AuthSplitCard from '../components/AuthSplitCard';

// Lands here from the link in the reset-password email:
// /reset-password?token=...&email=...
// Both are opaque to the user — they just type their new password twice.
//
// Single centered card, same as Login and Forgot Password — brand panel
// and form panel together in one box, language toggle inside it.
const ResetPassword = () => {
  const { language, setLanguage, t } = useLanguage();
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
      setError(t('This reset link is invalid — please request a new one', 'یہ ری سیٹ لنک غلط ہے — براہ کرم نیا لنک حاصل کریں'));
      return;
    }
    const passwordError = validatePassword(password);
    if (passwordError) { setError(passwordError); return; }
    if (password !== confirmPassword) {
      setError(t('Passwords do not match', 'پاس ورڈ مماثل نہیں ہیں'));
      return;
    }

    setLoading(true);
    try {
      await authService.resetPassword({ email, token, newPassword: password });
      setDone(true);
      setTimeout(() => navigate('/login'), 2500);
    } catch (err) {
      setError(err.response?.data?.error || t('This reset link is invalid or has expired. Please request a new one.', 'یہ ری سیٹ لنک غلط ہے یا میعاد ختم ہو چکی ہے۔ براہ کرم نیا لنک حاصل کریں۔'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthSplitCard
      badgeIcon={KeyRound}
      badge={t('Password Reset', 'پاس ورڈ ری سیٹ')}
      panelTitle={language === 'ur' ? (
        <>نیا<br /><span className="text-white/50">پاس ورڈ</span><br />بنائیں</>
      ) : (
        <>Create<br /><span className="text-white/50">New</span><br />Password</>
      )}
      panelSubtitle={t('Set a new password to log back in.', 'نیا پاس ورڈ سیٹ کریں۔')}
    >
      <div className="space-y-6">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          {!done ? (
            <Link to="/login" className="inline-flex items-center gap-2 text-xs sm:text-sm font-bold text-slate-500 hover:text-primary transition-colors">
              <ArrowLeft size={14} className="sm:w-4 sm:h-4" /> {t('Back to Login', 'لاگ ان پر واپس جائیں')}
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

        {done ? (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            <div className="space-y-3">
              <div className="w-14 h-14 bg-emerald-50 ring-8 ring-emerald-50/60 rounded-full flex items-center justify-center text-emerald-600">
                <CheckCircle2 size={26} />
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-800 tracking-tighter">{t('Password Reset Successful', 'پاس ورڈ کامیابی سے ری سیٹ ہو گیا')}</h2>
              <p className="text-slate-500 font-medium">{t('You can now log in with your new password. Redirecting to the login page...', 'اب آپ اپنے نئے پاس ورڈ سے لاگ ان کر سکتے ہیں۔ لاگ ان پیج پر بھیجا جا رہا ہے...')}</p>
            </div>
            <Link to="/login" className="primary-btn w-full py-4 rounded-xl flex items-center justify-center gap-3 text-base font-black shadow-md shadow-primary/15">
              {t('Go to Login', 'لاگ ان پر جائیں')} <ArrowRight size={20} />
            </Link>
          </motion.div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <h2 className="text-2xl sm:text-3xl font-black text-slate-800 tracking-tighter">{t('Set New Password', 'نیا پاس ورڈ سیٹ کریں')}</h2>
              <p className="text-slate-500 font-medium text-sm sm:text-base break-words">
                {email ? <>{t('Account:', 'اکاؤنٹ:')} <span className="font-black text-slate-700 break-all">{email}</span></> : t('Enter your new password', 'اپنا نیا پاس ورڈ درج کریں')}
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
                  className="flex-1 min-w-0 px-4 py-3.5 text-base bg-transparent outline-none text-slate-700 placeholder:text-slate-400"
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
                  className="flex-1 min-w-0 px-4 py-3.5 text-base bg-transparent outline-none text-slate-700 placeholder:text-slate-400"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  required
                />
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-3 bg-red-50 border border-red-100 text-red-600 px-4 py-3 rounded-xl text-sm font-bold">
                <ShieldAlert size={18} className="flex-shrink-0" />
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="primary-btn w-full py-4 rounded-xl flex items-center justify-center gap-3 text-base font-black shadow-md shadow-primary/15 disabled:opacity-60"
            >
              {loading ? t('Resetting...', 'ری سیٹ ہو رہا ہے...') : (
                <>{t('Reset Password', 'پاس ورڈ ری سیٹ کریں')} <ArrowRight size={20} /></>
              )}
            </button>
          </form>
        )}
      </div>
    </AuthSplitCard>
  );
};

export default ResetPassword;
