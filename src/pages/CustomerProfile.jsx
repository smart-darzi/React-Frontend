import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useLocalState } from '../context/useLocalState';
import { useLanguage } from '../context/LanguageContext';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import OrderDetailsModal from '../components/OrderDetailsModal';
import Dropdown from '../components/Dropdown';
import {
  User, Phone, MapPin, Ruler, History, Plus,
  ChevronDown, Save, Trash2, Scissors,
  ClipboardCheck, Clock, Loader2
} from 'lucide-react';
import { getAdminStatusLabel, getAdminStatusColor, getCustomerStatus } from '../utils/stages';

const SIZE_FIELD_KEYS = [
  'length',
  'shoulder',
  'chest',
  'neck',
  'armRound',
  'waist',
  'lengthOfTrouser',
  'ankleWidth',
  'armscye',
];

const PROFILE_ERROR_KEYS = {
  ALL_MEASUREMENTS_REQUIRED: '__ALL_MEASUREMENTS_REQUIRED__',
  SAVE_SIZE_FAILED: '__SAVE_SIZE_FAILED__',
};

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
  const selected = value || '';
  const pleaseSelect = t('Please Select', 'منتخب کریں');
  return (
    <div className="space-y-1.5 sm:space-y-2">
      <label className="text-[10px] sm:text-xs font-black text-slate-500 uppercase tracking-widest px-1 block leading-relaxed">
        {field.label}
      </label>
      <Dropdown
        value={selected}
        options={options}
        onChange={onChange}
        disabled={disabled}
        placeholder={pleaseSelect}
        showClearOption
        clearLabel={pleaseSelect}
        triggerClassName="input-field !px-2.5 sm:!px-5 !py-2 sm:!py-3 !h-10 sm:!h-14 w-full flex items-center justify-between text-[11px] sm:text-base font-semibold text-slate-700 disabled:opacity-60 disabled:cursor-not-allowed"
        renderTrigger={({ open, selectedLabel, selected: hasValue }) => (
          <>
            <span className={`truncate ${hasValue ? 'text-slate-800' : 'text-slate-400'}`}>
              {hasValue ? selectedLabel : pleaseSelect}
            </span>
            <ChevronDown size={14} className={`sm:hidden text-slate-400 transition-transform flex-shrink-0 ml-1 ${open ? 'rotate-180' : ''}`} />
            <ChevronDown size={18} className={`hidden sm:block text-slate-400 transition-transform flex-shrink-0 ml-2 ${open ? 'rotate-180' : ''}`} />
          </>
        )}
      />
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

  // Loads sizing data exactly once per customer id — deliberately NOT
  // re-run just because `sizes`/`fetchSize` got new references (which
  // happens on every LocalStateProvider re-render, e.g. the 20s worker
  // poll). Previously this effect depended on a `loadSize` callback that
  // was recreated on every such re-render, so its useEffect kept firing
  // mid-edit and silently reset the form back to the last-saved values —
  // wiping out whatever the user had just picked before hitting Save All.
  const loadedIdRef = useRef(null);
  useEffect(() => {
    if (loadedIdRef.current === id) return;
    loadedIdRef.current = id;
    let cancelled = false;
    (async () => {
      if (sizes[id]) {
        setSizeForm(sizes[id]);
        return;
      }
      setFetchingSize(true);
      try {
        const data = await fetchSize(id);
        if (!cancelled && data) setSizeForm(data);
      } catch (error) {
        console.error('Error loading size:', error);
      } finally {
        if (!cancelled) setFetchingSize(false);
      }
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  if (!customer) return <div className="p-10 text-center">Customer not found.</div>;

  const handleSaveSize = async () => {
    const hasAllValues = SIZE_FIELD_KEYS.every((key) => {
      const val = sizeForm?.[key];
      return val !== undefined && val !== null && String(val).trim() !== '';
    });

    if (!hasAllValues) {
      setError(PROFILE_ERROR_KEYS.ALL_MEASUREMENTS_REQUIRED);
      return;
    }

    setLoading(true);
    setError('');
    try {
      const saved = await saveSize(id, sizeForm);
      setSizeForm(saved || sizeForm);
      setIsEditingSize(false);
    } catch {
      setError(PROFILE_ERROR_KEYS.SAVE_SIZE_FAILED);
    } finally {
      setLoading(false);
    }
  };

  const resolvedError = (() => {
    if (!error) return '';
    if (error === PROFILE_ERROR_KEYS.ALL_MEASUREMENTS_REQUIRED) {
      return t('All measurements must be added before saving.', 'محفوظ کرنے سے پہلے تمام پیمائشیں درج کرنا ضروری ہیں۔');
    }
    if (error === PROFILE_ERROR_KEYS.SAVE_SIZE_FAILED) {
      return t('Failed to save size. Please try again.', 'ماپ محفوظ نہیں ہو سکی۔ دوبارہ کوشش کریں۔');
    }
    return error;
  })();

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
        className="glass-card p-4 sm:p-6 lg:p-10 rounded-xl shadow-2xl shadow-primary/5"
      >
        <div className="flex flex-col lg:flex-row gap-4 sm:gap-6 lg:gap-12">
          {/* Avatar column */}
          <div className="flex flex-col items-center text-center gap-2 flex-shrink-0 lg:w-44">
            <div className="w-16 h-16 sm:w-24 sm:h-24 lg:w-28 lg:h-28 rounded-full bg-primary flex items-center justify-center text-white text-2xl sm:text-3xl lg:text-4xl font-black shadow-2xl shadow-primary/30 flex-shrink-0">
              {customer.name.charAt(0)}
            </div>
            <p className="text-slate-400 font-bold uppercase tracking-[0.15em] text-[10px] break-all">
              {t('Customer ID', 'کسٹمر آئی ڈی')}: {customer._id}
            </p>
          </div>

          {/* Actions — "New Order" stays the primary filled action; Delete
              is now a clearly-labeled outline button instead of a bare red
              icon square, so it reads as a deliberate, secondary action
              rather than an alarming unlabeled symbol. Below lg it sits
              right under the avatar (order-2, side by side as a row)
              instead of pushed all the way below Account Info — keeps the
              card shorter and the actions visible up front. At lg it
              becomes the right-hand column (order-3), after the Fields
              column, matching the desktop layout. */}
          <div className="grid grid-cols-2 lg:flex lg:flex-col gap-2 sm:gap-3 flex-shrink-0 lg:w-56 order-2 lg:order-3">
            <button onClick={() => navigate('/add-order', { state: { customerId: id } })} className="primary-btn px-2 sm:px-4 py-2.5 lg:py-4 rounded-xl flex items-center justify-center gap-1.5 sm:gap-2 text-xs sm:text-base shadow-xl shadow-primary/20 lg:whitespace-nowrap">
              <Plus className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" /> {t('New Order', 'نیا آرڈر')}
            </button>
            <button
              onClick={handleDelete}
              disabled={loading}
              className="flex items-center justify-center gap-1.5 sm:gap-2 bg-white text-red-500 border-2 border-red-100 px-2 sm:px-4 py-2.5 lg:py-4 rounded-xl hover:bg-red-50 hover:border-red-200 transition-all font-bold text-xs sm:text-base disabled:opacity-50 lg:whitespace-nowrap"
            >
              {loading ? <Loader2 className="animate-spin w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" /> : <Trash2 className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />} {t('Delete Customer', 'کسٹمر حذف کریں')}
            </button>
          </div>

          {/* Fields column */}
          <div className="flex-1 min-w-0 space-y-4 sm:space-y-6 order-3 lg:order-2">
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
            <div className="pt-4 sm:pt-5 border-t border-slate-100 space-y-1.5">
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
        </div>
        {resolvedError && <p className="text-red-500 text-sm font-bold mt-4 text-center">{resolvedError}</p>}
      </motion.div>

      {/* Tabs Section */}
      <div className="flex gap-2 sm:gap-4 p-1.5 sm:p-2 bg-slate-100 rounded-xl max-w-lg mx-auto lg:mx-0">
        <button onClick={() => setActiveTab('sizing')} className={`flex-1 py-2.5 sm:py-4 flex items-center justify-center gap-2 sm:gap-3 rounded-xl font-black uppercase tracking-widest text-xs sm:text-sm transition-all ${activeTab === 'sizing' ? 'bg-white text-primary shadow-xl' : 'text-slate-400'}`}>
          <Ruler size={16} className="sm:hidden" /><Ruler size={18} className="hidden sm:block" /> {t('Sizing', 'ماپ')}
        </button>
        <button onClick={() => setActiveTab('history')} className={`flex-1 py-2.5 sm:py-4 flex items-center justify-center gap-2 sm:gap-3 rounded-xl font-black uppercase tracking-widest text-xs sm:text-sm transition-all ${activeTab === 'history' ? 'bg-white text-primary shadow-xl' : 'text-slate-400'}`}>
          <History size={16} className="sm:hidden" /><History size={18} className="hidden sm:block" /> {t('History', 'تاریخ')}
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
                {!isEditingSize && (
                  <div className="mb-3 sm:mb-4 rounded-xl border border-amber-200 bg-amber-50 text-amber-800 px-3.5 sm:px-4 py-2.5 sm:py-3 text-xs sm:text-sm font-semibold">
                    {t('Please click "Edit Dimensions" first to update measurements.', 'پیمائش تبدیل کرنے کے لیے پہلے "تبدیلی" بٹن دبائیں۔')}
                  </div>
                )}
                <div className="overflow-x-auto -mx-1 px-1 lg:mx-0 lg:px-0 lg:overflow-visible scrollbar-hide">
                  <div className="grid grid-cols-3 gap-3 sm:gap-6 min-w-[520px] sm:min-w-[640px] lg:min-w-0">
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

                  <div className="flex flex-col sm:flex-row gap-2 sm:gap-2.5 flex-shrink-0 w-full sm:w-auto">
                    <button
                      onClick={() => setSelectedOrder(order)}
                      className="px-5 py-2.5 bg-primary text-white rounded-full font-bold text-xs sm:text-sm hover:bg-primary-dark shadow-lg shadow-primary/20 transition-all whitespace-nowrap w-full sm:w-auto"
                    >
                      {t('Order Details', 'آرڈر کی تفصیل')}
                    </button>
                    <button
                      onClick={() => handleDeleteOrder(order._id)}
                      disabled={deletingOrderId === order._id}
                      className="px-5 py-2.5 bg-white text-red-500 border-2 border-red-100 rounded-full font-bold text-xs sm:text-sm hover:bg-red-50 hover:border-red-200 transition-all disabled:opacity-50 whitespace-nowrap flex items-center justify-center gap-1.5 w-full sm:w-auto"
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