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
        className="min-h-[60vh] py-10 flex flex-col items-center justify-center space-y-6 text-center px-4"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 260, damping: 18, delay: 0.1 }}
          className="w-20 h-20 sm:w-24 sm:h-24 bg-emerald-500 rounded-full flex items-center justify-center text-white shadow-2xl shadow-emerald-200 flex-shrink-0"
        >
          <CheckCircle2 size={42} />
        </motion.div>
        <div className="text-center max-w-md min-w-0">
          <h2 className="text-2xl sm:text-3xl font-black text-slate-800 tracking-tight uppercase truncate">{t('customers.addCustomer.savedSuccessfully')}</h2>
          <p className="text-slate-500 font-medium text-sm sm:text-base mt-1">{t('customers.addCustomer.redirecting')}</p>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      className="max-w-4xl mx-auto w-full min-w-0 overflow-x-hidden"
    >
      <div className="bg-white rounded-2xl sm:rounded-3xl p-5 sm:p-8 lg:p-10 shadow-xl border border-slate-100/80 w-full min-w-0">
        <div className="flex flex-col lg:flex-row gap-6 items-stretch w-full min-w-0">
          {/* Form Side */}
          <div className="flex-1 w-full min-w-0 flex flex-col justify-between">
            <div>
              {/* Header */}
              <div className="flex items-center justify-between gap-3 pb-4 mb-6 border-b border-slate-100 min-w-0">
                <div className="flex items-center gap-3 min-w-0">
                  <span className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl text-white flex items-center justify-center text-sm sm:text-base font-black flex-shrink-0" style={{ background: 'linear-gradient(135deg, #10707F, #0A4A55)' }}>
                    <UserPlus className="w-5 h-5" />
                  </span>
                  <div className="min-w-0">
                    <h1 className="font-bold text-slate-900 text-lg sm:text-xl truncate">{t('customers.addCustomer.title')}</h1>
                    <p className="text-xs text-slate-400 truncate">{t('customers.addCustomer.subtitle')}</p>
                  </div>
                </div>
                <Link to="/view-customers" className="text-slate-400 hover:text-slate-600 p-1.5 rounded-xl hover:bg-slate-100 transition-colors flex-shrink-0" aria-label="Cancel">
                  <X size={20} />
                </Link>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-4 w-full min-w-0">
                {/* Full Name */}
                <div className="space-y-1.5 w-full min-w-0">
                  <label className="flex items-center gap-2 text-xs font-bold text-slate-700 uppercase tracking-wider">
                    <User size={14} className="text-primary flex-shrink-0" /> {t('customers.addCustomer.fullName')}
                  </label>
                  <input
                    type="text"
                    className="w-full px-4 py-2.5 sm:py-3 bg-slate-50/70 border border-slate-200 rounded-xl text-sm focus:outline-none focus:bg-white focus:border-primary focus:ring-2 focus:ring-primary/15 text-slate-800 placeholder:text-slate-400 transition-all min-w-0"
                    placeholder={t('customers.addCustomer.namePlaceholder')}
                    value={formData.name}
                    onChange={e => setFormData(p => ({ ...p, name: e.target.value }))}
                    required
                  />
                </div>

                {/* Phone */}
                <div className="space-y-1.5 w-full min-w-0">
                  <label className="flex items-center gap-2 text-xs font-bold text-slate-700 uppercase tracking-wider">
                    <Phone size={14} className="text-primary flex-shrink-0" /> {t('customers.addCustomer.phone')}
                  </label>
                  <input
                    type="tel"
                    inputMode="numeric"
                    className="w-full px-4 py-2.5 sm:py-3 bg-slate-50/70 border border-slate-200 rounded-xl text-sm focus:outline-none focus:bg-white focus:border-primary focus:ring-2 focus:ring-primary/15 text-slate-800 font-mono tracking-wider placeholder:text-slate-400 placeholder:font-sans transition-all min-w-0"
                    placeholder="03XXXXXXXXX"
                    value={formData.phoneNumber}
                    onChange={handlePhoneChange}
                    onBlur={() => setPhoneTouched(true)}
                    maxLength={11}
                    required
                  />
                  {phoneTouched && validatePhone(formData.phoneNumber, { t }) && (
                    <p className="text-xs text-red-600 font-bold mt-1 flex items-center gap-1">
                      ⚠ {validatePhone(formData.phoneNumber, { t })}
                    </p>
                  )}
                </div>

                {/* Address */}
                <div className="space-y-1.5 w-full min-w-0">
                  <label className="flex items-center gap-2 text-xs font-bold text-slate-700 uppercase tracking-wider">
                    <MapPin size={14} className="text-primary flex-shrink-0" /> {t('customers.addCustomer.address')}
                  </label>
                  <textarea
                    dir="ltr"
                    className="w-full px-4 py-2.5 sm:py-3 bg-slate-50/70 border border-slate-200 rounded-xl text-sm focus:outline-none focus:bg-white focus:border-primary focus:ring-2 focus:ring-primary/15 resize-none min-h-[75px] text-slate-800 placeholder:text-slate-400 transition-all min-w-0"
                    placeholder={t('customers.addCustomer.addressPlaceholder')}
                    value={formData.address}
                    onChange={e => setFormData(p => ({ ...p, address: e.target.value }))}
                    required
                  />
                </div>

                {error && (
                  <div className="bg-red-50 text-red-600 p-3.5 rounded-xl text-xs sm:text-sm font-bold border border-red-100 space-y-2 mt-4">
                    <p>{error}</p>
                    {existingCustomerId && (
                      <Link
                        to={`/customer/${existingCustomerId}`}
                        className="inline-flex items-center gap-2 bg-red-600 text-white px-3.5 py-1.5 rounded-lg text-xs hover:bg-red-700 transition-all"
                      >
                        <Eye size={14} /> {t('customers.addCustomer.viewExistingProfile')}
                      </Link>
                    )}
                  </div>
                )}

                <div className="pt-2 w-full">
                  <button
                    type="submit"
                    disabled={loading}
                    onClick={() => setPhoneTouched(true)}
                    className="primary-btn w-full py-3.5 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-primary/20 disabled:opacity-60 text-sm font-bold"
                  >
                    {loading ? <Loader2 className="animate-spin" size={18} /> : <>{t('customers.addCustomer.registerContinue')} <ArrowRight size={16} /></>}
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* Live Preview Panel - Visible on all devices */}
          <div className="flex w-full lg:w-72 bg-slate-50/80 border border-slate-200/60 rounded-2xl p-5 sm:p-6 flex-col justify-between flex-shrink-0 min-w-0 shadow-sm">
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3 sm:mb-4">Preview</p>
              <div className="flex items-center gap-3 pb-3 sm:pb-4 border-b border-slate-200/60 min-w-0">
                <span className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl text-white flex items-center justify-center text-base sm:text-lg font-black flex-shrink-0" style={{ background: 'linear-gradient(135deg, #10707F, #0A4A55)' }}>
                  {formData.name.trim() ? formData.name.trim().charAt(0).toUpperCase() : <User size={20} />}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="font-bold text-slate-800 text-sm truncate">{formData.name.trim() || t('customers.addCustomer.namePlaceholder')}</p>
                  <p className="text-xs text-slate-400 truncate">{t('customers.addCustomer.title')}</p>
                </div>
              </div>
              <div className="space-y-2.5 sm:space-y-3 mt-3 sm:mt-4 min-w-0">
                <div className="flex items-center gap-2.5 text-slate-600 min-w-0">
                  <Phone size={15} className="text-primary flex-shrink-0" />
                  <span className="text-xs font-medium truncate">{formData.phoneNumber || '—'}</span>
                </div>
                <div className="flex items-center gap-2.5 text-slate-600 min-w-0">
                  <MapPin size={15} className="text-primary flex-shrink-0" />
                  <span className="text-xs font-medium truncate">{formData.address || '—'}</span>
                </div>
              </div>
            </div>
            <div className="mt-4 sm:mt-6 pt-3 sm:pt-4 border-t border-slate-200/60 text-[11px] text-slate-400 font-medium">
              Smart Master Tailoring
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default AddCustomer;
