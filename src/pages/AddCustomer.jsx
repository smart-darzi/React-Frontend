import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, Link } from 'react-router-dom';
import { useLocalState } from '../context/useLocalState';
import { UserPlus, User, Phone, MapPin, ArrowRight, CheckCircle2, Loader2, Eye } from 'lucide-react';
import { cleanPhoneInput, validatePhone } from '../utils/validators';
import { useLanguage } from '../context/LanguageContext';

const AddCustomer = () => {
  const [formData, setFormData] = useState({ name: '', phoneNumber: '', address: '' });
  const [isSuccess,         setIsSuccess]         = useState(false);
  const [loading,           setLoading]           = useState(false);
  const [error,             setError]             = useState('');
  const [phoneTouched,      setPhoneTouched]      = useState(false);
  const [existingCustomerId,setExistingCustomerId] = useState(null);
  const { addCustomer } = useLocalState();
  const navigate = useNavigate();
  const { t } = useLanguage();

  // ── Phone helpers ──────────────────────────────────────
  // No auto-correcting/forcing digits into place — that silently rewrites
  // what the user typed, which is confusing. We just restrict to digits and
  // a max length, and let validatePhone show a clear error if the format
  // is wrong (must be 11 digits starting with 03).
  const handlePhoneChange = (e) => {
    const val = cleanPhoneInput(e.target.value);
    setFormData(p => ({ ...p, phoneNumber: val }));
    if (!phoneTouched) setPhoneTouched(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setExistingCustomerId(null);

    const phoneError = validatePhone(formData.phoneNumber);
    if (phoneError) { setError(phoneError); return; }

    setLoading(true);
    try {
      const customer = await addCustomer({
        ...formData,
        familyName: formData.address,
        id: Math.floor(Math.random() * 100000),
      });
      setIsSuccess(true);
      setTimeout(() => navigate(`/customer/${customer._id}`), 1500);
    } catch (err) {
      setError(err.response?.data?.error || t('Failed to register customer.', 'کسٹمر رجسٹر نہیں ہو سکا۔'));
      if (err.response?.data?.customerId) {
        setExistingCustomerId(err.response.data.customerId);
      }
    } finally {
      setLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.35, ease: 'easeOut' }}
        className="h-[70vh] flex flex-col items-center justify-center space-y-6"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 260, damping: 18, delay: 0.1 }}
          className="w-24 h-24 bg-emerald-500 rounded-full flex items-center justify-center text-white shadow-2xl shadow-emerald-200"
        >
          <CheckCircle2 size={48} />
        </motion.div>
        <div className="text-center">
          <h2 className="text-3xl font-black text-slate-800 tracking-tighter uppercase">{t('Saved Successfully!', 'کامیابی سے محفوظ ہو گیا!')}</h2>
          <p className="text-slate-500 font-medium mt-1">{t('Redirecting to profile...', 'پروفائل پر بھیجا جا رہا ہے...')}</p>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      className="max-w-3xl mx-auto"
    >
      <header className="mb-10">
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-800 tracking-tighter uppercase flex items-center gap-3 sm:gap-4">
          <div className="bg-primary p-2.5 sm:p-3 rounded-2xl text-white shadow-lg flex-shrink-0"><UserPlus size={24} className="sm:hidden" /><UserPlus size={32} className="hidden sm:block" /></div>
          {t('Add New Customer', 'نیا کسٹمر شامل کریں')}
        </h1>
        <p className="text-slate-500 mt-2 font-medium text-sm sm:text-lg ml-[52px] sm:ml-16">{t('Enter details to begin the tailoring journey.', 'درزی کا سفر شروع کرنے کے لیے تفصیلات درج کریں۔')}</p>
      </header>

      <div className="glass-card p-6 sm:p-8 lg:p-10 rounded-[2rem] sm:rounded-[2.5rem] lg:rounded-[3rem]">
        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-3">
              <label className="flex items-center gap-2 text-sm font-black text-slate-700 uppercase tracking-widest">
                <User size={16} className="text-primary" /> {t('Full Name', 'نام')}
              </label>
              <input
                type="text"
                className="input-field"
                placeholder={t('e.g. Shahbaz Nawaz', 'مثلاً شہباز نواز')}
                value={formData.name}
                onChange={e => setFormData(p => ({ ...p, name: e.target.value }))}
                required
              />
            </div>

            <div className="space-y-3">
              <label className="flex items-center gap-2 text-sm font-black text-slate-700 uppercase tracking-widest">
                <Phone size={16} className="text-primary" /> {t('Phone', 'فون نمبر')}
              </label>
              <input
                type="tel"
                inputMode="numeric"
                className={`input-field font-mono tracking-wider ${phoneTouched && validatePhone(formData.phoneNumber) ? 'border-2 border-red-400 focus:border-red-500' : ''}`}
                placeholder="03XXXXXXXXX"
                value={formData.phoneNumber}
                onChange={handlePhoneChange}
                onBlur={() => setPhoneTouched(true)}
                maxLength={11}
                required
              />
              {phoneTouched && validatePhone(formData.phoneNumber) && (
                <p className="text-xs text-red-600 font-bold px-1 flex items-center gap-1">
                  ⚠ {validatePhone(formData.phoneNumber)}
                </p>
              )}
            </div>
          </div>

          <div className="space-y-3">
            <label className="flex items-center gap-2 text-sm font-black text-slate-700 uppercase tracking-widest">
              <MapPin size={16} className="text-primary" /> {t('Address', 'پتہ')}
            </label>
            <textarea
              dir="ltr"
              className="input-field min-h-[110px] resize-none py-4"
              placeholder={t('Full address details...', 'مکمل پتہ لکھیں...')}
              value={formData.address}
              onChange={e => setFormData(p => ({ ...p, address: e.target.value }))}
              required
            />
          </div>

          {error && (
            <div className="bg-red-50 text-red-600 p-4 rounded-2xl text-sm font-bold border border-red-100 space-y-3">
              <p>{error}</p>
              {existingCustomerId && (
                <Link
                  to={`/customer/${existingCustomerId}`}
                  className="inline-flex items-center gap-2 bg-red-600 text-white px-5 py-2.5 rounded-xl hover:bg-red-700 transition-all"
                >
                  <Eye size={16} /> {t('View Existing Profile', 'موجودہ پروفائل دیکھیں')}
                </Link>
              )}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            onClick={() => setPhoneTouched(true)}
            className="primary-btn w-full py-5 rounded-[2rem] flex items-center justify-center gap-3 text-lg shadow-2xl shadow-primary/30 disabled:opacity-60"
          >
            {loading ? <Loader2 className="animate-spin" size={24} /> : <>{t('Register & Continue', 'رجسٹر کریں')} <ArrowRight /></>}
          </button>
        </form>
      </div>
    </motion.div>
  );
};

export default AddCustomer;
