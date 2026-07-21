import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Settings as SettingsIcon, Store, Phone, MapPin, Save, CheckCircle } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

const STORAGE_KEY = 'smart_master_settings';

const defaultSettings = {
  shopName: 'Smart Master',
  ownerName: '',
  phone: '',
  address: '',
  city: '',
};

const loadSettings = () => {
  try {
    return { ...defaultSettings, ...JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}') };
  } catch {
    return defaultSettings;
  }
};

const Field = ({ label, value, onChange, placeholder }) => (
  <div className="space-y-3">
    <label className="text-xs font-black text-slate-400 uppercase tracking-widest px-1">{label}</label>
    <input
      type="text"
      className="input-field"
      placeholder={placeholder}
      value={value}
      onChange={onChange}
    />
  </div>
);

const Settings = () => {
  const { t } = useLanguage();
  const [settings, setSettings] = useState(loadSettings);
  const [saved, setSaved] = useState(false);
  const [phoneTouched, setPhoneTouched] = useState(false);

  const set = (key) => (e) => setSettings(p => ({ ...p, [key]: e.target.value }));

  // ── Phone helpers — same 11-digit, starts-with-03 rule used on Add
  // Customer / Workers. Don't auto-correct what's typed, just restrict to
  // digits and a max length, and show a clear error if the final value
  // isn't a valid 03XXXXXXXXX number. Phone stays optional here (empty is
  // fine) — it only needs to be valid if the shop owner actually fills it in.
  const handlePhoneChange = (e) => {
    const val = e.target.value.replace(/\D/g, '').slice(0, 11);
    setSettings(p => ({ ...p, phone: val }));
    if (!phoneTouched) setPhoneTouched(true);
  };

  const validatePhone = (phone) => {
    if (!phone) return null;
    if (!/^03\d{9}$/.test(phone)) {
      return t('Invalid number format — must be 11 digits starting with 03 (e.g. 03XXXXXXXXX)', 'نمبر درست نہیں — 11 ہندسوں کا ہونا چاہیے اور 03 سے شروع ہونا چاہیے (مثلاً 03XXXXXXXXX)');
    }
    return null;
  };

  const handleSave = () => {
    setPhoneTouched(true);
    const phoneError = validatePhone(settings.phone);
    if (phoneError) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <div className="space-y-10 pb-20 max-w-3xl mx-auto">
      <motion.header
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: 'easeOut' }}
      >
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-800 tracking-tighter uppercase flex items-center gap-3 sm:gap-4">
          <div className="bg-primary p-2.5 sm:p-3 rounded-2xl text-white shadow-lg flex-shrink-0"><SettingsIcon size={24} className="sm:hidden" /><SettingsIcon size={32} className="hidden sm:block" /></div>
          {t('Settings', 'ترتیبات')}
        </h1>
        <p className="text-slate-500 mt-2 font-medium text-sm sm:text-lg ml-[52px] sm:ml-16">{t('App ki settings customize karein', 'ایپ کی ترتیبات تبدیل کریں')}</p>
      </motion.header>

      {/* Shop Info */}
      <div className="glass-card p-6 sm:p-8 lg:p-10 rounded-[2rem] sm:rounded-[2.5rem] lg:rounded-[3rem] space-y-8">
        <div className="flex items-center gap-4 border-b border-slate-100 pb-6">
          <div className="bg-primary/10 p-3 rounded-2xl text-primary"><Store size={24} /></div>
          <h2 className="text-2xl font-black text-slate-800 tracking-tighter uppercase">{t('Shop Information', 'دکان کی معلومات')}</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Field label={t('Shop Name', 'دکان کا نام')} value={settings.shopName} onChange={set('shopName')} placeholder="Smart Master Tailoring..." />
          <Field label={t('Owner Name', 'مالک کا نام')} value={settings.ownerName} onChange={set('ownerName')} placeholder="Apna naam..." />
          <div className="space-y-3">
            <label className="text-xs font-black text-slate-400 uppercase tracking-widest px-1">{t('Phone', 'فون نمبر')}</label>
            <input
              type="tel"
              inputMode="numeric"
              className={`input-field font-mono tracking-wider ${phoneTouched && validatePhone(settings.phone) ? 'border-2 border-red-400 focus:border-red-500' : ''}`}
              placeholder="03XXXXXXXXX"
              value={settings.phone}
              onChange={handlePhoneChange}
              onBlur={() => setPhoneTouched(true)}
              maxLength={11}
            />
            {phoneTouched && validatePhone(settings.phone) && (
              <p className="text-xs text-red-600 font-bold px-1 flex items-center gap-1">
                ⚠ {validatePhone(settings.phone)}
              </p>
            )}
          </div>
          <Field label={t('City', 'شہر')} value={settings.city} onChange={set('city')} placeholder="Lahore, Karachi..." />
          <div className="md:col-span-2 space-y-3">
            <label className="text-xs font-black text-slate-400 uppercase tracking-widest px-1">{t('Address', 'پتہ')}</label>
            <textarea
              dir="ltr"
              className="input-field !h-24 resize-none"
              placeholder={t('Dukaan ka mukammal pata...', 'دکان کا مکمل پتہ...')}
              value={settings.address}
              onChange={set('address')}
            />
          </div>
        </div>
      </div>

      {/* App Info */}
      <div className="glass-card p-6 sm:p-8 lg:p-10 rounded-[2rem] sm:rounded-[2.5rem] lg:rounded-[3rem] space-y-4">
        <div className="flex items-center gap-4 border-b border-slate-100 pb-6">
          <div className="bg-primary/10 p-3 rounded-2xl text-primary"><SettingsIcon size={24} /></div>
          <h2 className="text-2xl font-black text-slate-800 tracking-tighter uppercase">{t('App Info', 'ایپ کی معلومات')}</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[
            [t('Version', 'ورژن'), '1.0.0'],
            [t('Mode', 'موڈ'), t('Offline', 'آف لائن')],
            [t('Platform', 'پلیٹ فارم'), 'Smart Master POS'],
            [t('Built for', 'کس کے لیے بنایا گیا'), t('Tailoring Shops', 'درزی کی دکانوں کے لیے')],
          ].map(([k, v]) => (
            <div key={k} className="bg-slate-50 p-4 rounded-2xl">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{k}</p>
              <p className="font-bold text-slate-700 mt-1">{v}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Save button */}
      <div className="flex justify-end">
        <button
          onClick={handleSave}
          className={`flex items-center gap-3 px-12 py-5 rounded-2xl font-black text-lg shadow-2xl transition-all ${
            saved
              ? 'bg-emerald-500 text-white shadow-emerald-200 scale-[1.02]'
              : 'primary-btn shadow-primary/20 hover:scale-[1.03]'
          }`}
        >
          {saved ? <><CheckCircle size={24} /> {t('Saved!', 'محفوظ!')}</> : <><Save size={24} /> {t('Save Settings', 'محفوظ کریں')}</>}
        </button>
      </div>
    </div>
  );
};

export default Settings;
