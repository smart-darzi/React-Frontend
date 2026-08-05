import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useLocalState } from '../context/useLocalState';
import { useLanguage } from '../context/LanguageContext';
import { useTranslation } from 'react-i18next';
import { ROLES } from '../utils/stages';
import { ArrowRight, ShieldAlert, CheckCircle2, ArrowLeft, User, Briefcase, Phone as PhoneIcon, Mail, Lock } from 'lucide-react';
import { cleanPhoneInput, validatePhone, validateEmail, validatePassword } from '../utils/validators';
import AuthCardShell from '../components/AuthCardShell';
import AuthBoxField from '../components/AuthBoxField';

const EMPTY = { name: '', role: '', phone: '', email: '', password: '' };
const ACCENT = '#1C6B82';
const ACCENT_GRADIENT = 'linear-gradient(90deg, #4FA6B8 0%, #1C6B82 55%, #0B5E63 100%)';

// Public "create your own account" page for workers. Submitting here does
// NOT log the worker in — it creates a pending account that the admin has
// to approve from the Workers page first. This keeps self-signup possible
// without letting a random person grant themselves access straight away.
const WorkerRegister = () => {
  const [form, setForm] = useState(EMPTY);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [phoneTouched, setPhoneTouched] = useState(false);
  const [emailTouched, setEmailTouched] = useState(false);
  const [passwordTouched, setPasswordTouched] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const { registerWorker } = useLocalState();
  const { t, td } = useLanguage();
  const { t: ti } = useTranslation();
  const navigate = useNavigate();

  const handlePhoneChange = (e) => {
    const val = cleanPhoneInput(e.target.value);
    setForm(p => ({ ...p, phone: val }));
    if (!phoneTouched) setPhoneTouched(true);
  };

  // Phone is optional for workers — same rule everywhere, just not required here.
  const checkPhone = (phone) => validatePhone(phone, { required: false, t: ti });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setPhoneTouched(true);
    setEmailTouched(true);
    setPasswordTouched(true);
    setError('');

    if (!form.name.trim() || !form.role.trim() || !form.email.trim()) {
      setError(t('Name, role, and email are required', 'نام، رول اور ای میل ضروری ہیں'));
      return;
    }
    const phoneError = checkPhone(form.phone);
    if (phoneError) { setError(phoneError); return; }
    const emailError = validateEmail(form.email, { t: ti });
    if (emailError) { setError(emailError); return; }
    const passwordError = validatePassword(form.password, { t: ti });
    if (passwordError) { setError(passwordError); return; }

    setLoading(true);
    try {
      await registerWorker({
        name: form.name.trim(),
        role: form.role,
        phone: form.phone || undefined,
        email: form.email.trim(),
        password: form.password,
      });
      setSubmitted(true);
    } catch (err) {
      setError(err.response?.data?.error || err.message || t('Could not create the account. Please try again.', 'اکاؤنٹ نہیں بن سکا۔ دوبارہ کوشش کریں۔'));
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <AuthCardShell
        heading={t('Request submitted', 'درخواست جمع ہو گئی')}
        subtitle={null}
      >
        <div className="text-center space-y-6">
          <div className="w-16 h-16 mx-auto rounded-xl bg-emerald-50 flex items-center justify-center">
            <CheckCircle2 className="text-emerald-600" size={32} />
          </div>
          <p className="text-slate-500 font-medium leading-relaxed">
            {t(
              'Your account request has been sent to the admin. You can log in with the same email and password after approval.',
              'آپ کی اکاؤنٹ درخواست ایڈمن کو بھیج دی گئی ہے۔ منظور ہونے کے بعد آپ اسی ای میل اور پاس ورڈ سے لاگ ان کر سکیں گے۔'
            )}
          </p>
          <button
            onClick={() => navigate('/login')}
            className="w-full py-3.5 rounded-xl flex items-center justify-center gap-2 font-black text-white"
            style={{ background: ACCENT_GRADIENT }}
          >
            <ArrowLeft size={18} /> {t('Back to login', 'لاگ ان پر واپس جائیں')}
          </button>
        </div>
      </AuthCardShell>
    );
  }

  return (
    <AuthCardShell
      heading={t("Let's get you set up", 'آئیے آپ کا اکاؤنٹ بناتے ہیں')}
      subtitle={t(
        'Fill out the form and your request will be sent to the admin for approval.',
        'فارم پُر کریں، آپ کی درخواست ایڈمن کو بھیج دی جائے گی۔'
      )}
      footer={
        <p className="text-slate-400 text-sm font-medium">
          {t('Already have an account?', 'پہلے سے اکاؤنٹ ہے؟')}{' '}
          <Link to="/login" className="font-black hover:underline" style={{ color: ACCENT }}>{t('Login', 'لاگ ان')}</Link>
        </p>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        <AuthBoxField
          icon={User}
          label={t('Your name', 'آپ کا نام')}
          required
          type="text"
          placeholder={t('e.g. Ali Khan', 'مثال: علی خان')}
          value={form.name}
          onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
          autoFocus
          accent={ACCENT}
        />

        <AuthBoxField
          icon={Briefcase}
          label={t('Your role', 'آپ کا کام')}
          required
          as="select"
          value={form.role}
          onChange={e => setForm(p => ({ ...p, role: e.target.value }))}
          accent={ACCENT}
        >
          <option value="">{t('Select role...', 'کام منتخب کریں...')}</option>
          {ROLES.map(r => <option key={r} value={r}>{td(r)}</option>)}
        </AuthBoxField>

        <AuthBoxField
          icon={PhoneIcon}
          label={t('Your phone', 'آپ کا فون')}
          type="tel"
          inputMode="numeric"
          placeholder="03XXXXXXXXX"
          className="font-mono tracking-wider"
          value={form.phone}
          onChange={handlePhoneChange}
          onBlur={() => setPhoneTouched(true)}
          maxLength={11}
          error={phoneTouched && checkPhone(form.phone)}
          accent={ACCENT}
        />

        <AuthBoxField
          icon={Mail}
          label={t('Your email', 'آپ کا ای میل')}
          required
          type="email"
          placeholder={t('e.g. ali@example.com', 'مثال: ali@example.com')}
          value={form.email}
          onChange={e => { setForm(p => ({ ...p, email: e.target.value })); if (!emailTouched) setEmailTouched(true); }}
          onBlur={() => setEmailTouched(true)}
          error={emailTouched && validateEmail(form.email, { t: ti })}
          accent={ACCENT}
        />

        <AuthBoxField
          icon={Lock}
          label={t('Your password', 'آپ کا پاس ورڈ')}
          required
          type="password"
          placeholder={t('e.g. ilovemywork123', 'مثال: password123')}
          value={form.password}
          onChange={e => { setForm(p => ({ ...p, password: e.target.value })); if (!passwordTouched) setPasswordTouched(true); }}
          onBlur={() => setPasswordTouched(true)}
          error={passwordTouched && validatePassword(form.password, { t: ti })}
          hint={t('At least 8 characters, including both letters and numbers', 'کم از کم 8 حروف، جن میں حروفِ تہجی اور نمبر دونوں شامل ہوں')}
          accent={ACCENT}
        />

        {error && (
          <div className="flex items-center gap-3 bg-red-50 border border-red-100 text-red-600 px-5 py-4 rounded-xl text-sm font-bold">
            <ShieldAlert size={18} className="flex-shrink-0" />
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3.5 rounded-xl flex items-center justify-center gap-3 text-base font-black text-white shadow-lg shadow-teal-900/20 disabled:opacity-60"
          style={{ background: ACCENT_GRADIENT }}
        >
          {loading ? (
            <span className="flex items-center gap-2">
              <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
              </svg>
              {t('Submitting...', 'جمع کیا جا رہا ہے...')}
            </span>
          ) : (
            <>{t('Request Account', 'درخواست بھیجیں')} <ArrowRight size={20} /></>
          )}
        </button>
      </form>
    </AuthCardShell>
  );
};

export default WorkerRegister;
