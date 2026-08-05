import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, Link } from 'react-router-dom';
import { useLocalState } from '../context/useLocalState';
import { UserPlus, User, Phone, MapPin, ArrowRight, CheckCircle2, Loader2, Eye, X } from 'lucide-react';
import { cleanPhoneInput, validatePhone } from '../utils/validators';
import { useTranslation } from 'react-i18next';

const AddCustomer = () => {
  const [formData, setFormData] = useState({ name: '', phoneNumber: '', address: '' });
  const [isSuccess,         setIsSuccess]         = useState(false);
  const [loading,           setLoading]           = useState(false);
  const [error,             setError]             = useState('');
  const [phoneTouched,      setPhoneTouched]      = useState(false);
  const [existingCustomerId,setExistingCustomerId] = useState(null);
  const { addCustomer } = useLocalState();
  const navigate = useNavigate();
  const { t } = useTranslation();

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

    const phoneError = validatePhone(formData.phoneNumber, { t });
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
      setError(err.response?.data?.error || t('customers.addCustomer.failedToRegister'));
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
          <h2 className="text-3xl font-black text-slate-800 tracking-tighter uppercase">{t('customers.addCustomer.savedSuccessfully')}</h2>
          <p className="text-slate-500 font-medium mt-1">{t('customers.addCustomer.redirecting')}</p>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      className="max-w-4xl mx-auto"
    >
      <div
        className="rounded-2xl p-5 sm:p-10"
        style={{ background: 'linear-gradient(165deg, #10707F 0%, #0E606E 45%, #0A4A55 100%)' }}
      >
        <div className="flex flex-col lg:flex-row gap-5 sm:gap-6 items-start">
          {/* Left — live preview card, mirrors the "user profile" mini-card:
              avatar + name/subtitle up top, a couple of quick-glance facts
              below instead of a nav menu (there's nothing to navigate to
              here — this panel just previews what's being typed). */}
          <div className="w-full lg:w-72 bg-white rounded-xl p-6 flex-shrink-0">
            <div className="flex items-center gap-3 pb-5 mb-5 border-b border-slate-100">
              <span className="w-12 h-12 rounded-full text-white flex items-center justify-center text-lg font-black flex-shrink-0" style={{ background: 'linear-gradient(135deg, #10707F, #0A4A55)' }}>
                {formData.name.trim() ? formData.name.trim().charAt(0).toUpperCase() : <User size={20} />}
              </span>
              <div className="min-w-0">
                <p className="font-bold text-slate-800 truncate">{formData.name.trim() || t('customers.addCustomer.namePlaceholder')}</p>
                <p className="text-xs text-slate-400 truncate">{t('customers.addCustomer.title')}</p>
              </div>
            </div>
            <div className="space-y-4">
              <div className="flex items-center gap-3 text-slate-600">
                <Phone size={16} className="text-primary flex-shrink-0" />
                <span className="text-sm truncate">{formData.phoneNumber || '—'}</span>
              </div>
              <div className="flex items-center gap-3 text-slate-600">
                <MapPin size={16} className="text-primary flex-shrink-0" />
                <span className="text-sm truncate">{formData.address || '—'}</span>
              </div>
            </div>
          </div>

          {/* Right — the actual form, styled as label-left/input-right rows
              inside one white card, same shape as the reference's edit
              panel. */}
          <div className="flex-1 w-full bg-white rounded-xl p-6 sm:p-8">
            <div className="flex items-center justify-between gap-3 pb-5 mb-2 border-b border-slate-100">
              <div className="flex items-center gap-3 min-w-0">
                <span className="w-11 h-11 rounded-full text-white flex items-center justify-center text-base font-black flex-shrink-0" style={{ background: 'linear-gradient(135deg, #10707F, #0A4A55)' }}>
                  <UserPlus size={20} />
                </span>
                <div className="min-w-0">
                  <h1 className="font-bold text-slate-800 truncate">{t('customers.addCustomer.title')}</h1>
                  <p className="text-xs text-slate-400 truncate">{t('customers.addCustomer.subtitle')}</p>
                </div>
              </div>
              <Link to="/view-customers" className="text-slate-400 hover:text-slate-600 flex-shrink-0" aria-label="Cancel">
                <X size={20} />
              </Link>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="divide-y divide-slate-100">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 sm:gap-4 py-4">
                  <label className="flex items-center gap-2 text-sm font-bold text-slate-700 flex-shrink-0">
                    <User size={15} className="text-primary" /> {t('customers.addCustomer.fullName')}
                  </label>
                  <input
                    type="text"
                    className="flex-1 text-left bg-transparent border-none focus:outline-none focus:ring-0 text-slate-600 placeholder:text-slate-300 min-w-0"
                    placeholder={t('customers.addCustomer.namePlaceholder')}
                    value={formData.name}
                    onChange={e => setFormData(p => ({ ...p, name: e.target.value }))}
                    required
                  />
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 sm:gap-4 py-4">
                  <label className="flex items-center gap-2 text-sm font-bold text-slate-700 flex-shrink-0">
                    <Phone size={15} className="text-primary" /> {t('customers.addCustomer.phone')}
                  </label>
                  <div className="flex-1 min-w-0 text-left">
                    <input
                      type="tel"
                      inputMode="numeric"
                      className="w-full text-left bg-transparent border-none focus:outline-none focus:ring-0 text-slate-600 font-mono tracking-wider placeholder:text-slate-300 placeholder:font-sans"
                      placeholder="03XXXXXXXXX"
                      value={formData.phoneNumber}
                      onChange={handlePhoneChange}
                      onBlur={() => setPhoneTouched(true)}
                      maxLength={11}
                      required
                    />
                    {phoneTouched && validatePhone(formData.phoneNumber, { t }) && (
                      <p className="text-xs text-red-600 font-bold mt-1 flex items-center justify-end gap-1">
                        ⚠ {validatePhone(formData.phoneNumber, { t })}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-1.5 sm:gap-4 py-4">
                  <label className="flex items-center gap-2 text-sm font-bold text-slate-700 flex-shrink-0 sm:pt-2">
                    <MapPin size={15} className="text-primary" /> {t('customers.addCustomer.address')}
                  </label>
                  <textarea
                    dir="ltr"
                    className="flex-1 text-left bg-transparent border-none focus:outline-none focus:ring-0 resize-none min-h-[60px] text-slate-600 placeholder:text-slate-300 min-w-0"
                    placeholder={t('customers.addCustomer.addressPlaceholder')}
                    value={formData.address}
                    onChange={e => setFormData(p => ({ ...p, address: e.target.value }))}
                    required
                  />
                </div>
              </div>

              {error && (
                <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm font-bold border border-red-100 space-y-3 mt-6">
                  <p>{error}</p>
                  {existingCustomerId && (
                    <Link
                      to={`/customer/${existingCustomerId}`}
                      className="inline-flex items-center gap-2 bg-red-600 text-white px-5 py-2.5 rounded-xl hover:bg-red-700 transition-all"
                    >
                      <Eye size={16} /> {t('customers.addCustomer.viewExistingProfile')}
                    </Link>
                  )}
                </div>
              )}

              <div className="flex justify-end mt-6">
                <button
                  type="submit"
                  disabled={loading}
                  onClick={() => setPhoneTouched(true)}
                  className="primary-btn px-8 py-3.5 rounded-xl flex items-center justify-center gap-2.5 shadow-lg shadow-primary/20 disabled:opacity-60"
                >
                  {loading ? <Loader2 className="animate-spin" size={20} /> : <>{t('customers.addCustomer.registerContinue')} <ArrowRight size={18} /></>}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default AddCustomer;
