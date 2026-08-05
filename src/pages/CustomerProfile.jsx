import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useLocalState } from '../context/useLocalState';
import { useLanguage } from '../context/LanguageContext';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import OrderDetailsModal from '../components/OrderDetailsModal';
import {
  User, Phone, MapPin, Ruler, History, Plus,
  ChevronDown, Save, Trash2, Scissors,
  ClipboardCheck, Clock, Loader2
} from 'lucide-react';
import { getAdminStatusLabel, getAdminStatusColor, getCustomerStatus } from '../utils/stages';

// Generate quarter-inch options. `t` (from useLanguage) picks the English
// or Urdu label depending on the active language — never both at once.
const generateOptions = (min, max, t) => {
  const opts = [];
  for (let whole = min; whole <= max; whole++) {
    opts.push({ value: `${whole}`, label: `${whole}` });
    if (whole < max) {
      opts.push({ value: `${whole} 1/4`, label: t(`${whole} 1/4`, `${whole} سوا`) });
      opts.push({ value: `${whole} 1/2`, label: t(`${whole} 1/2`, `${whole} آدھا`) });
      opts.push({ value: `${whole} 3/4`, label: t(`${whole} 3/4`, `${whole} پونا`) });
    }
  }
  return opts;
};

// Hoisted to module scope — was previously defined *inside* CustomerProfile,
// which meant React saw a brand-new component type on every re-render
// (every keystroke / selection). That forced every dropdown to fully
// unmount + remount, which is what caused the page to jump to the top
// each time a value was picked. Living outside the component now, it's a
// stable component type across re-renders, so it just updates in place.
const MeasureDropdown = ({ field, value, disabled, onChange }) => {
  const { t } = useLanguage();
  const options = generateOptions(field.range[0], field.range[1], t);
  const [open, setOpen] = useState(false);
  const selected = value || '';
  const selectedLabel = options.find(o => o.value === selected)?.label || selected;
  const pleaseSelect = t('Please Select', 'منتخب کریں');
  return (
    <div className="space-y-1.5 sm:space-y-2 relative">
      <label className="text-[10px] sm:text-xs font-black text-slate-500 uppercase tracking-widest px-1 block leading-relaxed">
        {field.label}
      </label>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen(o => !o)}
        className="input-field !py-2 sm:!py-3 !h-10 sm:!h-14 flex items-center justify-between text-sm sm:text-base font-semibold text-slate-700 disabled:opacity-60 disabled:cursor-not-allowed"
      >
        <span className={`truncate ${selected ? 'text-slate-800' : 'text-slate-400'}`}>
          {selected ? selectedLabel : pleaseSelect}
        </span>
        <ChevronDown size={18} className={`text-slate-400 transition-transform flex-shrink-0 ml-2 ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-white border border-slate-200 rounded-xl shadow-2xl overflow-hidden">
          <div className="overflow-y-auto max-h-[220px] custom-scrollbar">
            <button
              type="button"
              onClick={() => { onChange(''); setOpen(false); }}
              className="w-full text-left px-4 py-2 text-sm text-slate-400 hover:bg-slate-50 font-medium"
            >
              {pleaseSelect}
            </button>
            {options.map(opt => (
              <button
                key={opt.value}
                type="button"
                onClick={() => { onChange(opt.value); setOpen(false); }}
                className={`w-full text-left px-4 py-2 text-sm font-semibold hover:bg-primary/10 hover:text-primary transition-colors ${
                  selected === opt.value ? 'bg-primary text-white' : 'text-slate-700'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const CustomerProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { customers, sizes, orders, designs, fetchSize, saveSize, deleteCustomer, deleteOrder } = useLocalState();
  const { t, td, tn, language } = useLanguage();
  const { t: ti } = useTranslation();

  const customer = customers.find(c => c._id === id);
  const customerSize = sizes[id] || {};
  const customerOrders = orders.filter(o => o.customerId?.toString() === id?.toString());

  const [activeTab, setActiveTab] = useState('sizing');
  const [isEditingSize, setIsEditingSize] = useState(false);
  const [sizeForm, setSizeForm] = useState(customerSize);
  const [loading, setLoading] = useState(false);
  const [fetchingSize, setFetchingSize] = useState(false);
  const [error, setError] = useState('');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [deletingOrderId, setDeletingOrderId] = useState(null);

  const loadSize = useCallback(async () => {
    if (id && !sizes[id]) {
      setFetchingSize(true);
      try {
        const data = await fetchSize(id);
        if (data) setSizeForm(data);
      } catch (error) {
        console.error('Error loading size:', error);
      } finally {
        setFetchingSize(false);
      }
    } else if (sizes[id]) {
      setSizeForm(sizes[id]);
    }
  }, [fetchSize, id, sizes]);

  useEffect(() => {
    loadSize();
  }, [loadSize]);

  if (!customer) return <div className="p-10 text-center">Customer not found.</div>;

  const handleSaveSize = async () => {
    setLoading(true);
    setError('');
    try {
      await saveSize(id, sizeForm);
      setIsEditingSize(false);
    } catch {
      setError(t('Failed to save size. Please try again.', 'ماپ محفوظ نہیں ہو سکی۔ دوبارہ کوشش کریں۔'));
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (window.confirm(t('Are you sure you want to delete this customer?', 'کیا آپ واقعی اس کسٹمر کو حذف کرنا چاہتے ہیں؟'))) {
      setLoading(true);
      try {
        await deleteCustomer(id);
        navigate('/view-customers');
      } catch {
        setError(t('Failed to delete customer.', 'کسٹمر حذف نہیں ہو سکا۔'));
        setLoading(false);
      }
    }
  };

  const handleDeleteOrder = async (orderId) => {
    if (!window.confirm(ti('validation.confirmDeleteOrder'))) return;
    setDeletingOrderId(orderId);
    try {
      await deleteOrder(orderId);
    } catch (error) {
      alert((language === 'ur' ? 'آرڈر حذف نہیں ہو سکا: ' : 'Could not delete the order: ') + (error.response?.data?.error || error.message));
    } finally {
      setDeletingOrderId(null);
    }
  };

  const sizingFields = [
    { key: 'length', en: 'Length of Shirt', ur: 'قمیص کی لمبائی', range: [10, 50] },
    { key: 'shoulder', en: 'Shoulder', ur: 'کندھے/تیرا', range: [10, 23] },
    { key: 'chest', en: 'Chest', ur: 'چھاتی', range: [20, 60] },
    { key: 'neck', en: 'Neck', ur: 'گلا', range: [10, 20] },
    { key: 'armRound', en: 'Arm Round', ur: 'بازو کی گولائی', range: [4, 10] },
    { key: 'waist', en: 'Waist/Fitting', ur: 'کمر', range: [15, 60] },
    { key: 'lengthOfTrouser', en: 'Length of Pant', ur: 'پتلون یا شلوار کی لمبائی', range: [20, 60] },
    { key: 'ankleWidth', en: 'Ankle Width', ur: 'پانچہ', range: [4, 20] },
    { key: 'armscye', en: 'Armscye (Optional)', ur: 'آرم سائی (اختیاری)', range: [5, 15] },
  ].map(f => ({ ...f, label: t(f.en, f.ur) }));


  return (
    <div className="space-y-8 pb-20">
      {/* Header Profile Section — laid out like a "My Profile" card: avatar
          on the left, labeled field boxes on the right, a secondary
          account-info block below them. Button corner-radius intentionally
          left untouched (rounded-xl, same as every other button in the
          app) — only the card's internal layout changes. */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: 'easeOut' }}
        className="glass-card p-6 sm:p-8 lg:p-10 rounded-xl shadow-2xl shadow-primary/5"
      >
        <div className="flex flex-col lg:flex-row gap-8 lg:gap-12">
          {/* Avatar column */}
          <div className="flex flex-col items-center text-center gap-2.5 flex-shrink-0 lg:w-44">
            <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-primary flex items-center justify-center text-white text-3xl sm:text-4xl font-black shadow-2xl shadow-primary/30 flex-shrink-0">
              {customer.name.charAt(0)}
            </div>
            <p className="text-slate-400 font-bold uppercase tracking-[0.15em] text-[10px] break-all">
              {t('Customer ID', 'کسٹمر آئی ڈی')}: {customer._id}
            </p>
          </div>

          {/* Fields column */}
          <div className="flex-1 min-w-0 space-y-6">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-800 tracking-tighter uppercase break-words">
              {tn(customer.name)}
            </h1>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
              <div className="space-y-1.5">
                <label className="text-[10px] sm:text-xs font-black text-slate-400 uppercase tracking-widest px-1">
                  {t('Full Name', 'پورا نام')}
                </label>
                <div className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-bold text-slate-700 flex items-center gap-2.5 truncate">
                  <User size={16} className="text-primary flex-shrink-0" /> <span className="truncate">{tn(customer.name)}</span>
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] sm:text-xs font-black text-slate-400 uppercase tracking-widest px-1">
                  {t('Phone Number', 'فون نمبر')}
                </label>
                <div className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-bold text-slate-700 flex items-center gap-2.5 truncate">
                  <Phone size={16} className="text-primary flex-shrink-0" /> <span className="truncate">{customer.phoneNumber}</span>
                </div>
              </div>
              {customer.address && (
                <div className="sm:col-span-2 space-y-1.5">
                  <label className="text-[10px] sm:text-xs font-black text-slate-400 uppercase tracking-widest px-1">
                    {t('Address', 'پتہ')}
                  </label>
                  <div className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-bold text-slate-700 flex items-center gap-2.5">
                    <MapPin size={16} className="text-primary flex-shrink-0" /> <span className="truncate">{customer.address}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Secondary info block — same spirit as a profile card's
                "Authentication" section, just showing what's actually
                relevant here: when this customer record was created and
                whether they have portal login access. */}
            <div className="pt-5 border-t border-slate-100 space-y-1.5">
              <h2 className="text-[10px] sm:text-xs font-black text-slate-400 uppercase tracking-widest px-1">
                {t('Account Info', 'اکاؤنٹ کی معلومات')}
              </h2>
              <div className="flex flex-wrap items-center gap-x-6 gap-y-1 text-slate-500 text-xs sm:text-sm font-medium px-1">
                {customer.createdAt && (
                  <span>{t('Registered on', 'رجسٹرڈ')}: {new Date(customer.createdAt).toLocaleDateString()}</span>
                )}
                <span>{customer.email ? t('Portal access: enabled', 'پورٹل رسائی: فعال') : t('Portal access: not set up', 'پورٹل رسائی: قائم نہیں')}</span>
              </div>
            </div>
          </div>

          {/* Actions — "New Order" stays the primary filled action; Delete
              is now a clearly-labeled outline button instead of a bare red
              icon square, so it reads as a deliberate, secondary action
              rather than an alarming unlabeled symbol. */}
          <div className="flex lg:flex-col gap-2 sm:gap-3 justify-center flex-shrink-0">
            <button onClick={() => navigate('/add-order', { state: { customerId: id } })} className="primary-btn px-3 sm:px-6 py-2 sm:py-4 rounded-xl flex items-center justify-center gap-1.5 sm:gap-2 text-xs sm:text-base shadow-xl shadow-primary/20 whitespace-nowrap">
              <Plus className="w-3.5 h-3.5 sm:w-5 sm:h-5 flex-shrink-0" /> {t('New Order', 'نیا آرڈر')}
            </button>
            <button
              onClick={handleDelete}
              disabled={loading}
              className="flex items-center justify-center gap-1.5 sm:gap-2 bg-white text-red-500 border-2 border-red-100 px-3 sm:px-6 py-2 sm:py-4 rounded-xl hover:bg-red-50 hover:border-red-200 transition-all font-bold text-xs sm:text-base disabled:opacity-50 whitespace-nowrap flex-shrink-0"
            >
              {loading ? <Loader2 className="animate-spin w-3.5 h-3.5 sm:w-5 sm:h-5" /> : <Trash2 className="w-3.5 h-3.5 sm:w-5 sm:h-5" />} {t('Delete Customer', 'کسٹمر حذف کریں')}
            </button>
          </div>
        </div>
        {error && <p className="text-red-500 text-sm font-bold mt-4 text-center">{error}</p>}
      </motion.div>

      {/* Tabs Section */}
      <div className="flex gap-4 p-2 bg-slate-100 rounded-xl max-w-lg mx-auto md:mx-0">
        <button onClick={() => setActiveTab('sizing')} className={`flex-1 py-4 flex items-center justify-center gap-3 rounded-xl font-black uppercase tracking-widest text-sm transition-all ${activeTab === 'sizing' ? 'bg-white text-primary shadow-xl' : 'text-slate-400'}`}>
          <Ruler size={18} /> {t('Sizing', 'ماپ')}
        </button>
        <button onClick={() => setActiveTab('history')} className={`flex-1 py-4 flex items-center justify-center gap-3 rounded-xl font-black uppercase tracking-widest text-sm transition-all ${activeTab === 'history' ? 'bg-white text-primary shadow-xl' : 'text-slate-400'}`}>
          <History size={18} /> {t('History', 'تاریخ')}
        </button>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'sizing' ? (
          <motion.div
            key="sizing"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="glass-card p-4 sm:p-8 lg:p-10 rounded-xl"
          >
            <div className="flex justify-between items-center gap-3 mb-4 sm:mb-10">
              <h2 className="text-lg sm:text-3xl font-black text-slate-800 tracking-tighter uppercase">{t('Measurement Table', 'ناپ کی جدول')}</h2>
              {!isEditingSize ? (
                <button onClick={() => setIsEditingSize(true)} className="text-primary font-bold flex items-center gap-2 text-xs sm:text-base bg-primary/5 px-3 sm:px-5 py-1.5 sm:py-2.5 rounded-xl hover:bg-primary/10 transition-all whitespace-nowrap flex-shrink-0">
                  {t('Edit Dimensions', 'تبدیلی')}
                </button>
              ) : (
                <button
                  onClick={handleSaveSize}
                  disabled={loading}
                  className="bg-primary text-white font-bold flex items-center gap-2 text-xs sm:text-base px-3 sm:px-8 py-1.5 sm:py-3 rounded-xl shadow-xl shadow-primary/20 hover:scale-[1.05] transition-all disabled:opacity-70 whitespace-nowrap flex-shrink-0"
                >
                  {loading ? <Loader2 className="animate-spin w-3.5 h-3.5 sm:w-[18px] sm:h-[18px]" /> : <Save className="w-3.5 h-3.5 sm:w-[18px] sm:h-[18px]" />} {t('Save All', 'محفوظ کریں')}
                </button>
              )}
            </div>

            {fetchingSize ? (
              <div className="py-20 flex flex-col items-center justify-center space-y-4">
                <Loader2 className="animate-spin text-primary" size={40} />
                <p className="text-slate-400 font-bold uppercase tracking-widest">Fetching measurements...</p>
              </div>
            ) : (
              <div className="pb-2">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 sm:gap-6">
                  {sizingFields.map(field => (
                    <MeasureDropdown
                      key={field.key}
                      field={field}
                      value={sizeForm[field.key]}
                      disabled={!isEditingSize}
                      onChange={(val) => setSizeForm(prev => ({ ...prev, [field.key]: val }))}
                    />
                  ))}
                </div>
              </div>
            )}
            {sizes[id] && (
              <p className="mt-10 text-center text-slate-400 text-sm italic">Last updated: {new Date(sizes[id].updatedAt).toLocaleString()}</p>
            )}
          </motion.div>
        ) : (
          <motion.div
            key="history"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="space-y-6"
          >
            {customerOrders.length === 0 ? (
              <div className="glass-card p-20 rounded-xl text-center">
                <p className="text-slate-400 font-bold uppercase tracking-widest">{t('No orders yet', 'ابھی تک کوئی آرڈر نہیں ہے')}</p>
                <button onClick={() => navigate('/add-order', { state: { customerId: id } })} className="mt-6 text-primary font-black hover:underline px-6 py-3 rounded-xl bg-primary/5 transition-all">Create your first order?</button>
              </div>
            ) : (
              customerOrders.map((order, i) => {
                // Slim 3-step progress bar (Pending -> In Progress ->
                // Completed) — same simplified vocabulary customers see,
                // just enough to show progress at a glance without
                // reproducing the full Admin stage pipeline here.
                const customerStatus = getCustomerStatus(order);
                const progressPct = customerStatus === 'Completed' ? 100 : customerStatus === 'In Progress' ? 55 : 15;
                return (
                <motion.div
                  key={order._id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: i * 0.05, ease: 'easeOut' }}
                  className="glass-card p-5 sm:p-7 rounded-xl flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6 group hover:shadow-xl hover:shadow-primary/5 transition-all"
                >
                  <div className={`w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0 border-2 ${order.orderStatus === 'Completed' || order.orderStatus === 'Received By Customer' ? 'bg-emerald-50 text-emerald-500 border-emerald-100' : 'bg-primary/5 text-primary border-primary/10'}`}>
                    <Scissors size={22} />
                  </div>

                  <div className="flex-1 min-w-0 space-y-2">
                    <div className="flex items-center flex-wrap gap-2.5">
                      <h3 className="text-lg font-black text-slate-800 tracking-tighter uppercase truncate">{td(order.orderType)}</h3>
                      <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border-2 whitespace-nowrap ${getAdminStatusColor(order)}`}>
                        {getAdminStatusLabel(order, language)}
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-x-5 gap-y-1 text-slate-500 text-xs sm:text-sm font-medium">
                      <span className="flex items-center gap-1.5"><ClipboardCheck size={13} /> {order.neckStyle} / {order.cuffStyle}</span>
                      <span className="flex items-center gap-1.5"><Clock size={13} /> {new Date(order.createdAt).toLocaleDateString()}</span>
                    </div>
                    {/* Progress bar */}
                    <div className="w-full max-w-xs h-1.5 bg-slate-100 rounded-full overflow-hidden mt-1">
                      <div
                        className={`h-full rounded-full transition-all ${customerStatus === 'Completed' ? 'bg-emerald-400' : 'bg-primary'}`}
                        style={{ width: `${progressPct}%` }}
                      />
                    </div>
                  </div>

                  <div className="flex gap-2.5 flex-shrink-0">
                    <button
                      onClick={() => setSelectedOrder(order)}
                      className="px-5 py-2.5 bg-primary text-white rounded-full font-bold text-xs sm:text-sm hover:bg-primary-dark shadow-lg shadow-primary/20 transition-all whitespace-nowrap"
                    >
                      {t('Order Details', 'آرڈر کی تفصیل')}
                    </button>
                    <button
                      onClick={() => handleDeleteOrder(order._id)}
                      disabled={deletingOrderId === order._id}
                      className="px-5 py-2.5 bg-white text-red-500 border-2 border-red-100 rounded-full font-bold text-xs sm:text-sm hover:bg-red-50 hover:border-red-200 transition-all disabled:opacity-50 whitespace-nowrap flex items-center gap-1.5"
                    >
                      {deletingOrderId === order._id ? <Loader2 className="animate-spin" size={14} /> : t('Cancel Order', 'آرڈر منسوخ کریں')}
                    </button>
                  </div>
                </motion.div>
                );
              })
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {selectedOrder && (
        <OrderDetailsModal
          order={selectedOrder}
          customerName={customer.name}
          onClose={() => setSelectedOrder(null)}
          onEdit={(order) => { setSelectedOrder(null); navigate('/add-order', { state: { editOrder: order } }); }}
          designs={designs}
        />
      )}
    </div>
  );
};

export default CustomerProfile;