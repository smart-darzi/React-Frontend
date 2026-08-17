import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { HardHat, X, UserCheck, Phone, Mail, Briefcase, Loader2, UserPlus, Hash, MapPin, CalendarClock } from 'lucide-react';
import { useLocalState } from '../context/useLocalState';
import { useLanguage } from '../context/LanguageContext';

// Shown on top of any admin page as soon as a worker creates their own
// (pending) account. Shows the worker's submitted details right there and
// lets the admin approve — and grant portal access — in one click, without
// having to leave the page they're on.
const NewWorkerAlert = () => {
  const {
    pendingWorkerAlerts,
    dismissWorkerAlert,
    approveWorker,
    pendingCustomerAlerts,
    dismissCustomerAlert,
  } = useLocalState();
  const { t, td, tn, language } = useLanguage();
  const navigate = useNavigate();
  const [approvingId, setApprovingId] = useState(null);

  const workerAlerts = pendingWorkerAlerts || [];
  const customerAlerts = pendingCustomerAlerts || [];
  const hasAlerts = workerAlerts.length > 0 || customerAlerts.length > 0;

  if (!hasAlerts) return null;

  const handleApprove = async (worker) => {
    setApprovingId(worker._id);
    try {
      await approveWorker(worker._id);
      dismissWorkerAlert(worker._id);
    } catch {
      alert(t('Could not approve the worker. Please try again from the Workers page.', 'ورکر منظور نہیں ہو سکا۔ براہ کرم Workers page سے دوبارہ کوشش کریں۔'));
    } finally {
      setApprovingId(null);
    }
  };

  const viewInWorkers = (worker) => {
    dismissWorkerAlert(worker._id);
    navigate('/workers');
  };

  const viewCustomerProfile = (customer) => {
    dismissCustomerAlert(customer._id);
    navigate(`/customer/${customer._id}`);
  };

  const customerAddress = (customer) => customer.familyName || customer.address || t('Not provided', 'دیا نہیں گیا');

  const formatDate = (dateVal) => {
    if (!dateVal) return t('Unknown', 'نامعلوم');
    const d = new Date(dateVal);
    if (Number.isNaN(d.getTime())) return t('Unknown', 'نامعلوم');
    return d.toLocaleString(language === 'ur' ? 'ur-PK' : 'en-US');
  };

  return (
    <div className="fixed top-4 left-4 right-4 sm:top-6 sm:left-auto sm:right-6 z-[100] flex flex-col gap-3 sm:w-full sm:max-w-sm">
      <AnimatePresence>
        {workerAlerts.map(worker => (
          <motion.div
            key={worker._id}
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, x: 60, scale: 0.9 }}
            className="glass-card bg-white rounded-xl shadow-2xl border border-slate-100 p-6 space-y-4"
          >
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center text-primary flex-shrink-0">
                <HardHat size={22} />
              </div>
              <div className="flex-1">
                <p className="font-black text-slate-800 uppercase tracking-tight text-sm">{t('New worker request', 'نئی ورکر درخواست')}</p>
                <p className="text-slate-500 text-xs font-medium mt-1">
                  {t('Waiting for portal access - check the details below.', 'پورٹل رسائی کا انتظار ہے - نیچے تفصیل دیکھیں۔')}
                </p>
              </div>
              <button
                onClick={() => dismissWorkerAlert(worker._id)}
                className="text-slate-300 hover:text-slate-500 transition-colors flex-shrink-0"
                title={t('Dismiss', 'بند کریں')}
              >
                <X size={18} />
              </button>
            </div>

            {/* Worker's submitted details — everything the admin needs to
                decide, right here in the popup. */}
            <div className="bg-slate-50 rounded-xl p-4 space-y-2">
              <p className="font-black text-slate-800 text-base">{language === 'ur' ? tn(worker.name) : worker.name}</p>
              <div className="flex items-center gap-2 text-slate-500 text-xs font-semibold">
                <Briefcase size={13} className="text-primary flex-shrink-0" /> {td(worker.role)}
              </div>
              {worker.phone && (
                <div className="flex items-center gap-2 text-slate-500 text-xs font-semibold">
                  <Phone size={13} className="text-primary flex-shrink-0" /> {worker.phone}
                </div>
              )}
              {worker.email && (
                <div className="flex items-center gap-2 text-slate-500 text-xs font-semibold">
                  <Mail size={13} className="text-primary flex-shrink-0" /> {worker.email}
                </div>
              )}
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => handleApprove(worker)}
                disabled={approvingId === worker._id}
                className="primary-btn flex-1 py-2.5 rounded-xl text-sm font-black flex items-center justify-center gap-2 disabled:opacity-70"
              >
                {approvingId === worker._id
                  ? <Loader2 className="animate-spin" size={16} />
                  : <UserCheck size={16} />}
                {t('Approve & Give Access', 'منظور کریں اور رسائی دیں')}
              </button>
              <button
                onClick={() => viewInWorkers(worker)}
                className="px-4 py-2.5 rounded-xl text-sm font-bold text-slate-500 bg-slate-100 hover:bg-slate-200 transition-colors whitespace-nowrap"
              >
                {t('View', 'دیکھیں')}
              </button>
            </div>
          </motion.div>
        ))}

        {customerAlerts.map(customer => (
          <motion.div
            key={`customer-${customer._id}`}
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, x: 60, scale: 0.9 }}
            className="glass-card bg-white rounded-xl shadow-2xl border border-slate-100 p-6 space-y-4"
          >
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center text-emerald-600 flex-shrink-0">
                <UserPlus size={22} />
              </div>
              <div className="flex-1">
                <p className="font-black text-slate-800 uppercase tracking-tight text-sm">{t('New customer account', 'نیا کسٹمر اکاؤنٹ')}</p>
                <p className="text-slate-500 text-xs font-medium mt-1">
                  {t('Customer created a portal account - details are below.', 'کسٹمر نے پورٹل اکاؤنٹ بنایا ہے - تفصیل نیچے موجود ہے۔')}
                </p>
              </div>
              <button
                onClick={() => dismissCustomerAlert(customer._id)}
                className="text-slate-300 hover:text-slate-500 transition-colors flex-shrink-0"
                title={t('Dismiss', 'بند کریں')}
              >
                <X size={18} />
              </button>
            </div>

            <div className="bg-slate-50 rounded-xl p-4 space-y-2">
              <p className="font-black text-slate-800 text-base">{language === 'ur' ? tn(customer.name) : customer.name}</p>
              <div className="flex items-center gap-2 text-slate-500 text-xs font-semibold">
                <Hash size={13} className="text-emerald-600 flex-shrink-0" />
                {t('Customer ID', 'کسٹمر آئی ڈی')}: {customer.id || customer._id}
              </div>
              {customer.phoneNumber && (
                <div className="flex items-center gap-2 text-slate-500 text-xs font-semibold">
                  <Phone size={13} className="text-emerald-600 flex-shrink-0" /> {customer.phoneNumber}
                </div>
              )}
              {customer.email && (
                <div className="flex items-center gap-2 text-slate-500 text-xs font-semibold break-all">
                  <Mail size={13} className="text-emerald-600 flex-shrink-0" /> {customer.email}
                </div>
              )}
              <div className="flex items-start gap-2 text-slate-500 text-xs font-semibold">
                <MapPin size={13} className="text-emerald-600 flex-shrink-0 mt-0.5" />
                <span>{customerAddress(customer)}</span>
              </div>
              <div className="flex items-center gap-2 text-slate-500 text-xs font-semibold">
                <CalendarClock size={13} className="text-emerald-600 flex-shrink-0" />
                {t('Created', 'بنایا گیا')}: {formatDate(customer.createdAt)}
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => viewCustomerProfile(customer)}
                className="primary-btn flex-1 py-2.5 rounded-xl text-sm font-black"
              >
                {t('Open Profile', 'پروفائل کھولیں')}
              </button>
              <button
                onClick={() => {
                  dismissCustomerAlert(customer._id);
                  navigate('/view-customers');
                }}
                className="px-4 py-2.5 rounded-xl text-sm font-bold text-slate-500 bg-slate-100 hover:bg-slate-200 transition-colors whitespace-nowrap"
              >
                {t('View', 'دیکھیں')}
              </button>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};

export default NewWorkerAlert;
