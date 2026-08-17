import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useLocalState } from '../context/useLocalState';
import { useLanguage } from '../context/LanguageContext';
import { useTranslation } from 'react-i18next';
import { ArrowRight, ShieldAlert, ArrowLeft, User, Phone as PhoneIcon, MapPin, Mail, Lock } from 'lucide-react';
import { cleanPhoneInput, validatePhone, validateEmail, validatePassword } from '../utils/validators';
import AuthCardShell from '../components/AuthCardShell';
import AuthBoxField from '../components/AuthBoxField';

const EMPTY = { name: '', phone: '', address: '', email: '', password: '' };
const ACCENT = '#1C6B82';
const ACCENT_GRADIENT = 'linear-gradient(90deg, #4FA6B8 0%, #1C6B82 55%, #0B5E63 100%)';

// Public "create your own account" page for customers. Unlike the worker
// version, this does NOT need admin approval — submitting here logs the
// customer straight into their own portal, same flow as: enter email +
// password on the shared Login page, see "Not have an account?", tap
// Sign Up, fill this form, tap Create Account, land on the portal.
const CustomerRegister = () => {
  const [form, setForm] = useState(EMPTY);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [phoneTouched, setPhoneTouched] = useState(false);
  const [emailTouched, setEmailTouched] = useState(false);
  const [passwordTouched, setPasswordTouched] = useState(false);
  const { registerCustomer } = useLocalState();
  const { t } = useLanguage();
  const { t: ti } = useTranslation();
  const navigate = useNavigate();

  const handlePhoneChange = (e) => {
    const val = cleanPhoneInput(e.target.value);
    setForm(p => ({ ...p, phone: val }));
    if (error) setError('');
    if (!phoneTouched) setPhoneTouched(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setPhoneTouched(true);
    setEmailTouched(true);
    setPasswordTouched(true);
    setError('');

    if (!form.name.trim()) {
      setError(t('Name is required', 'نام ضروری ہے'));
      return;
    }
    const phoneError = validatePhone(form.phone, { t: ti });
    if (phoneError) { setError(phoneError); return; }
    const emailError = validateEmail(form.email, { t: ti });
    if (emailError) { setError(emailError); return; }
    const passwordError = validatePassword(form.password, { t: ti });
    if (passwordError) { setError(passwordError); return; }

    setLoading(true);
    try {
      await registerCustomer({
        name: form.name.trim(),
        phoneNumber: form.phone,
        familyName: form.address || undefined,
        email: form.email.trim(),
        password: form.password,
      });
      navigate('/customer-portal');
    } catch (err) {
      setError(err.response?.data?.error || err.message || t('Could not create the account. Please try again.', 'اکاؤنٹ نہیں بن سکا۔ دوبارہ کوشش کریں۔'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthCardShell
      badge={t('Customer Sign Up', 'کسٹمر سائن اپ')}
      heading={t("Let's get started", 'چلیں شروع کرتے ہیں')}
      subtitle={t(
        'Create an account and view your orders, tracking, and details anytime.',
        'اکاؤنٹ بنائیں اور اپنے آرڈرز، ٹریکنگ اور تفصیلات کبھی بھی دیکھیں۔'
      )}
      footer={
        <p className="text-slate-400 text-sm font-medium">
          {t('Already have an account?', 'پہلے سے اکاؤنٹ ہے؟')}{' '}
          <Link to="/login" className="font-black hover:underline inline-flex items-center gap-1" style={{ color: ACCENT }}>
            <ArrowLeft size={12} /> {t('Login', 'لاگ ان')}
          </Link>
        </p>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        <AuthBoxField
          icon={User}
          label={t('Your name', 'آپ کا نام')}
          required
          type="text"
          placeholder={t('e.g. Ayesha Malik', 'مثال: عائشہ ملک')}
          value={form.name}
          onChange={e => {
            setForm(p => ({ ...p, name: e.target.value }));
            if (error) setError('');
          }}
          autoFocus
          accent={ACCENT}
        />

        <AuthBoxField
          icon={PhoneIcon}
          label={t('Your phone', 'آپ کا فون')}
          required
          type="tel"
          inputMode="numeric"
          placeholder="03XXXXXXXXX"
          className="font-mono tracking-wider"
          value={form.phone}
          onChange={handlePhoneChange}
          onBlur={() => setPhoneTouched(true)}
          maxLength={11}
          error={phoneTouched && validatePhone(form.phone, { t: ti })}
          accent={ACCENT}
        />

        <AuthBoxField
          icon={MapPin}
          label={t('Your address', 'آپ کا پتہ')}
          type="text"
          placeholder={t('e.g. House 12, Street 4, Karachi', 'مثال: گھر 12، گلی 4، کراچی')}
          value={form.address}
          onChange={e => {
            setForm(p => ({ ...p, address: e.target.value }));
            if (error) setError('');
          }}
          accent={ACCENT}
        />

        <AuthBoxField
          icon={Mail}
          label={t('Your email', 'آپ کا ای میل')}
          required
          type="email"
          placeholder={t('e.g. ayesha@example.com', 'مثال: ayesha@example.com')}
          value={form.email}
          onChange={e => {
            setForm(p => ({ ...p, email: e.target.value }));
            if (error) setError('');
          }}
          onBlur={() => setEmailTouched(true)}
          error={emailTouched && validateEmail(form.email, { t: ti })}
          accent={ACCENT}
        />

        <AuthBoxField
          icon={Lock}
          label={t('Your password', 'آپ کا پاس ورڈ')}
          required
          type="password"
          placeholder={t('e.g. ilovesmartmaster123', 'مثال: password123')}
          value={form.password}
          onChange={e => {
            setForm(p => ({ ...p, password: e.target.value }));
            if (error) setError('');
            if (!passwordTouched) setPasswordTouched(true);
          }}
          onBlur={() => setPasswordTouched(true)}
          error={passwordTouched && validatePassword(form.password, { t: ti })}
          hint={ti('validation.passwordHint')}
          accent={ACCENT}
        />

        {error && (
          <div className="flex items-center gap-3 bg-red-50 border border-red-100 text-red-600 px-4 py-3 sm:px-5 sm:py-4 rounded-xl text-sm font-bold">
            <ShieldAlert size={18} className="flex-shrink-0" />
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3.5 rounded-xl flex items-center justify-center gap-3 text-base font-black text-white shadow-md shadow-teal-900/15 disabled:opacity-60"
          style={{ background: ACCENT_GRADIENT }}
        >
          {loading ? (
            <span className="flex items-center gap-2">
              <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
              </svg>
              {t('Creating account...', 'اکاؤنٹ بنایا جا رہا ہے...')}
            </span>
          ) : (
            <>{t('Create Account', 'اکاؤنٹ بنائیں')} <ArrowRight size={20} /></>
          )}
        </button>
      </form>
    </AuthCardShell>
  );
};

export default CustomerRegister;
