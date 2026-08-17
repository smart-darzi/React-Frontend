import React, { useState, useRef, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { useLocalState } from '../context/useLocalState';
import {
  Scissors, Search, ClipboardList,
  Palette, Library, CheckCircle,
  ChevronRight, ArrowLeft, Loader2, Check, X, Ruler, AlertTriangle, RefreshCcw
} from 'lucide-react';
import { isDigitsOnly, matchesPhoneSearch, splitPhoneMatch } from '../utils/phoneSearch';
import { validateDesignNumber } from '../utils/validators';
import { matchesNameSearch, sortByNameMatch, highlightNameMatch } from '../utils/nameSearch';
import { DESIGN_CATEGORIES } from '../utils/designCategories';
import DesignDetailModal from '../components/DesignDetailModal';
import DesignThumb from '../components/DesignThumb';
import { useLanguage } from '../context/LanguageContext';
import { useTranslation } from 'react-i18next';

// Renders a name with the matched search portion highlighted, e.g.
// searching "Tahir" against "Amina Tahir" highlights just "Tahir" so
// customers with similar names don't blur together in the results.
const HighlightedName = ({ name, term }) => (
  <>
    {highlightNameMatch(name, term).map((seg, i) =>
      seg.match
        ? <span key={i} className="bg-yellow-200 text-slate-800 rounded px-0.5">{seg.text}</span>
        : <span key={i}>{seg.text}</span>
    )}
  </>
);

// ─── Defined OUTSIDE AddOrder so they never remount on state change ───────────
const Section = ({ title, icon, children, fullWidth = false }) => {
  const Icon = icon;
  return (
    <div className="glass-card p-4 sm:p-6 lg:p-10 rounded-xl space-y-5 sm:space-y-6 lg:space-y-8">
      <div className="flex items-center gap-3 sm:gap-4 border-b border-slate-100 pb-4 sm:pb-6">
        <div className="bg-primary/10 p-2 sm:p-3 rounded-xl text-primary"><Icon className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6" /></div>
        <h2 className="text-base sm:text-xl lg:text-2xl font-black text-slate-800 tracking-tighter uppercase">{title}</h2>
      </div>
      {fullWidth ? (
        // Single-block content (e.g. the Customer card) — always full width,
        // never squeezed into 1/3 of a 3-column grid or forced to scroll.
        children
      ) : (
        /* Always 3 fields per row, even on phones — on narrow screens the
           row scrolls horizontally instead of stacking (scrollbar-hide
           keeps the track invisible so it doesn't clutter the design). */
        <div className="overflow-x-auto pb-1 -mx-1 px-1 lg:mx-0 lg:px-0 lg:overflow-visible scrollbar-hide">
          <div className="grid grid-cols-3 gap-3 sm:gap-5 lg:gap-8 min-w-[560px] sm:min-w-[680px] lg:min-w-0">
            {children}
          </div>
        </div>
      )}
    </div>
  );
};

const Dropdown = ({ label, options, value, onChange }) => {
  const { td } = useLanguage();
  return (
    <div className="space-y-1.5 sm:space-y-3 min-w-0">
      <label className="text-[10px] sm:text-xs font-black text-slate-400 uppercase tracking-widest px-1 truncate block">{label}</label>
      <select
        className="input-field appearance-none cursor-pointer !py-2.5 !px-3 sm:!py-4 sm:!px-5"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        {/* Stored value stays the full "English / اردو" string (that's the
            convention the rest of the app's td() reads back out) — only the
            visible option text is narrowed to the current language. */}
        {options.map(opt => <option key={opt} value={opt}>{td(opt)}</option>)}
      </select>
    </div>
  );
};
// ─────────────────────────────────────────────────────────────────────────────

// Mirrors backend/controllers/order.controller.js SIZE_FIELDS — a customer
// "has measurements" only once at least one of these is actually filled in,
// not just because a (possibly empty) Size document exists for them.
const SIZE_FIELDS = ['length', 'shoulder', 'armscye', 'chest', 'neck', 'armLength', 'armRound', 'waist', 'lap', 'lengthOfTrouser', 'ankleWidth', 'hips'];
const hasRealMeasurements = (sizeDoc) =>
  Boolean(sizeDoc) && SIZE_FIELDS.some(f => String(sizeDoc[f] ?? '').trim() !== '');

const AddOrder = () => {
  const location = useLocation();
  const navigate  = useNavigate();
  const { customers, designs, sizes, fetchSize, addOrder, updateOrder } = useLocalState();
  const { t } = useTranslation();
  const { td, tn, language } = useLanguage();

  const editingOrder = location.state?.editOrder || null;
  const isEditMode = Boolean(editingOrder);

  const [formData, setFormData] = useState({
    customerId:    editingOrder?.customerId || location.state?.customerId || '',
    orderCategory: editingOrder?.orderCategory || 'Gents / مردانہ',
    orderType:     editingOrder?.orderType || 'Shalwar Qamees / شلوار قمیص',
    neckStyle:     editingOrder?.neckStyle || 'Collar / کالر',
    cuffStyle:     editingOrder?.cuffStyle || 'Cuff / کف والے بازو',
    lapStyle:      editingOrder?.lapStyle || 'Single Lap / سنگل لیپ',
    pantStyle:     editingOrder?.pantStyle || 'Shalwar / شلوار',
    pocketStyle:   editingOrder?.pocketStyle || 'Front Pocket / سامنے والی جیب',
    buttonStyle:   editingOrder?.buttonStyle || 'Fancy / فینسی بٹن',
    elastic:       editingOrder?.elastic || 'Elastic / لاسٹک',
    embroidery:    editingOrder?.embroidery || 'No / کوئی نہیں',
    style:         editingOrder?.style || 'Single Salai / سنگل سلائی',
    bookNumber:    editingOrder?.bookNumber?.toString() || '1',
    designNumber:  editingOrder?.designNumber?.toString() || '5',
    selectedDesignId: editingOrder?.selectedDesignId || '',
  });

  // ── Design catalog picker (search/category filter for the gallery below) ──
  const [designSearch, setDesignSearch] = useState('');
  const [designCategoryFilter, setDesignCategoryFilter] = useState('All');
  const filteredCatalogDesigns = useMemo(() => {
    const base = designs.filter(d => {
      if (designCategoryFilter !== 'All' && d.category !== designCategoryFilter) return false;
      if (!matchesNameSearch(d.name, designSearch)) return false;
      return true;
    });
    return sortByNameMatch(base, designSearch);
  }, [designs, designSearch, designCategoryFilter]);
  const selectedCatalogDesign = designs.find(d => d._id === formData.selectedDesignId);
  const [viewingDesign, setViewingDesign] = useState(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [isSuccess,  setIsSuccess]  = useState(false);
  const [loading,    setLoading]    = useState(false);
  const [error,      setError]      = useState('');
  const [designNumberTouched, setDesignNumberTouched] = useState(false);

  // Closing the dropdown used to rely on the input's onBlur + a setTimeout,
  // racing against the click on a result — sometimes the dropdown would
  // unmount right as the click landed, so the result never got selected.
  // A click-outside listener on the whole search box is reliable instead:
  // it only closes when the click is genuinely outside, so clicking a
  // result always registers.
  const searchBoxRef = useRef(null);
  useEffect(() => {
    if (!isSearchFocused) return;
    const handleClickOutside = (e) => {
      if (searchBoxRef.current && !searchBoxRef.current.contains(e.target)) {
        setIsSearchFocused(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isSearchFocused]);

  const selectedCustomer  = customers.find(c => c._id === formData.customerId);
  const searchingByPhone  = isDigitsOnly(searchTerm) && searchTerm.trim().length > 0;

  // ── Measurements gate ── a customer must have real measurements on file
  // before an order can be created for them (a tailor can't cut fabric
  // without them). Fetch their Size doc as soon as they're selected, so we
  // know whether to block the form before the admin fills everything else in.
  const [checkingSize, setCheckingSize] = useState(false);
  useEffect(() => {
    if (!formData.customerId) return;
    if (sizes[formData.customerId] !== undefined) return;
    setCheckingSize(true);
    fetchSize(formData.customerId).finally(() => setCheckingSize(false));
  }, [formData.customerId]);
  const customerSize = sizes[formData.customerId];
  const hasMeasurements = isEditMode || hasRealMeasurements(customerSize);

  // Filter first, then rank so exact/whole-word matches (a standalone
  // "Tahir") float above loose partial matches (e.g. "Amina Tahir" or
  // "Tahira") instead of appearing in arbitrary order.
  const filteredCustomers = searchingByPhone
    ? customers.filter(c => matchesPhoneSearch(c.phoneNumber, searchTerm))
    : sortByNameMatch(customers.filter(c => matchesNameSearch(c.name, searchTerm)), searchTerm);

  const set = (key) => (v) => setFormData(prev => ({ ...prev, [key]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (!formData.customerId) {
      setError(t('addOrder.pleaseSelectCustomerFirst'));
      setLoading(false);
      return;
    }

    if (!hasMeasurements) {
      setError(t('addOrder.pleaseAddCustomerSMeasurementsBefore'));
      setLoading(false);
      return;
    }

    const designNumberError = validateDesignNumber(formData.designNumber, { t });
    if (designNumberError) {
      setDesignNumberTouched(true);
      setError(designNumberError);
      setLoading(false);
      return;
    }

    try {
      const payload = {
        ...formData,
        selectedDesignName: selectedCatalogDesign?.name || null,
        selectedDesignNameUrdu: selectedCatalogDesign?.nameUrdu || null,
        selectedDesignImage: selectedCatalogDesign?.images?.[0]?.url || null,
      };
      if (isEditMode) {
        await updateOrder(editingOrder._id, payload);
      } else {
        await addOrder(payload);
      }
      setIsSuccess(true);
      setTimeout(() => navigate('/view-orders'), 1500);
    } catch (err) {
      setError(err.response?.data?.error || err.message || t('addOrder.failedSaveOrderPleaseTryAgain'));
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
          className="w-24 h-24 bg-primary rounded-full flex items-center justify-center text-white shadow-2xl"
        >
          <CheckCircle size={48} />
        </motion.div>
        <h2 className="text-3xl font-black text-slate-800 uppercase tracking-tighter">
          {isEditMode
            ? t('addOrder.orderUpdatedSuccessfully')
            : t('addOrder.orderSavedSuccessfully')}
        </h2>
        <p className="text-slate-500 font-medium">{t('addOrder.redirectingOrders')}</p>
      </motion.div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-12 pb-20">
      <motion.header
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: 'easeOut' }}
        className="flex items-center justify-between gap-4"
      >
        <div className="min-w-0">
          <h1 className="text-xl sm:text-3xl lg:text-4xl font-black text-slate-800 tracking-tighter uppercase flex items-center gap-3 sm:gap-4">
            <div className="bg-primary p-2 sm:p-3 rounded-xl text-white shadow-lg flex-shrink-0"><Scissors size={20} className="sm:hidden" /><Scissors size={32} className="hidden sm:block" /></div>
            <span className="truncate">
              {isEditMode ? t('addOrder.editTailoringOrder') : t('addOrder.newTailoringOrder')}
            </span>
          </h1>
          <p className="text-slate-500 mt-1.5 sm:mt-2 font-medium text-xs sm:text-lg ml-[44px] sm:ml-16 truncate">
            {isEditMode
              ? t('addOrder.updateDetailsOrder')
              : t('addOrder.customCraftPerfectionEveryClient')}
          </p>
        </div>
        <button onClick={() => navigate(-1)} className="p-3 sm:p-4 bg-white rounded-xl text-slate-400 hover:text-primary transition-colors shadow-xl shadow-slate-200 flex-shrink-0">
          <ArrowLeft size={20} className="sm:hidden" /><ArrowLeft size={24} className="hidden sm:block" />
        </button>
      </motion.header>

      <form onSubmit={handleSubmit} className="space-y-8">

        {/* ── Customer Selection ──
            Wrapped in relative + z-20: the "glass-card" style uses
            backdrop-blur, which creates its own CSS stacking context. That
            trapped the search dropdown's z-index *inside* this card, so no
            matter how high its z-index was, the next card (Dress Styling,
            also glass-card) — being later in the page — still painted on
            top of it wherever they overlapped. Giving this whole card an
            explicit z-index lifts the entire card, dropdown included,
            above the cards that follow it. */}
        <div className="relative z-20">
          <Section title={t('addOrder.customer')} icon={Search} fullWidth>
            <div className="space-y-4">
              {selectedCustomer ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between gap-1.5 sm:gap-4 bg-primary/5 p-2 sm:p-6 rounded-xl border-2 border-primary/10">
                    <div className="flex items-center gap-1.5 sm:gap-6 min-w-0 flex-1">
                      <div className="w-8 h-8 sm:w-16 sm:h-16 flex-shrink-0 bg-primary rounded-lg sm:rounded-xl flex items-center justify-center text-white text-xs sm:text-2xl font-black">
                        {selectedCustomer.name?.charAt(0) || '?'}
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="text-[11px] sm:text-xl font-black text-slate-800 uppercase truncate">{tn(selectedCustomer.name)}</h3>
                        <p className="text-primary font-bold text-[10px] sm:text-base truncate">{selectedCustomer.phoneNumber}</p>
                      </div>
                    </div>
                    {/* Icon-only on phone (text label has nowhere to fit next to
                        the name/phone without pushing them out); full text
                        label returns from sm and up where there's room. */}
                    <button
                      type="button"
                      onClick={() => setFormData(p => ({ ...p, customerId: '' }))}
                      disabled={isEditMode}
                      title={t('addOrder.changeCustomer')}
                      className="flex-shrink-0 flex items-center gap-1.5 p-1.5 sm:p-0 text-slate-400 font-bold text-base sm:text-base hover:text-red-500 transition-colors disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:text-slate-400"
                    >
                      <RefreshCcw size={14} className="sm:hidden" />
                      <span className="hidden sm:inline text-base">{t('addOrder.changeCustomer')}</span>
                    </button>
                  </div>

                  {!isEditMode && !checkingSize && !hasMeasurements && (
                    <div className="flex flex-row flex-nowrap items-center gap-1.5 sm:gap-4 bg-amber-50 border-2 border-amber-200 p-2 sm:p-6 rounded-xl">
                      <div className="flex items-center gap-1.5 sm:gap-3 flex-1 min-w-0">
                        <AlertTriangle className="text-amber-500 flex-shrink-0" size={14} />
                        <p className="text-amber-700 font-bold text-[10px] sm:text-sm leading-snug whitespace-nowrap sm:whitespace-normal">
                          <span className="sm:hidden">{t('addOrder.customerNoMeasurementsShort')}</span>
                          <span className="hidden sm:inline">{t('addOrder.customerNoMeasurementsFileYetRequired')}</span>
                        </p>
                      </div>
                      <Link
                        to={`/customer/${selectedCustomer._id}`}
                        className="flex-shrink-0 flex items-center justify-center gap-1 sm:gap-1.5 px-2 py-1.5 sm:px-5 sm:py-3 bg-amber-500 hover:bg-amber-600 text-white font-black text-[10px] sm:text-sm rounded-lg sm:rounded-xl transition-all whitespace-nowrap"
                      >
                        <Ruler size={11} className="flex-shrink-0" /> {t('addOrder.addMeasurements')}
                      </Link>
                    </div>
                  )}
                </div>
              ) : (
                <div className="relative" ref={searchBoxRef}>
                  <div className="flex items-stretch border border-slate-200 rounded-xl overflow-hidden bg-white/50 focus-within:ring-2 focus-within:ring-primary/20 transition-all">
                    <div className="flex items-center justify-center px-3 sm:px-5 bg-slate-100/80 border-r border-slate-200 min-w-[48px] sm:min-w-[60px]">
                      <Search size={18} className="text-slate-400 sm:hidden" /><Search size={20} className="text-slate-400 hidden sm:block" />
                    </div>
                    <input
                      type="text"
                      placeholder={t('addOrder.searchCustomerByNameOrPhone')}
                      className="flex-1 min-w-0 px-3 sm:px-5 py-4 sm:py-6 text-sm sm:text-lg bg-transparent outline-none text-slate-700 placeholder:text-slate-400"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      onFocus={() => setIsSearchFocused(true)}
                    />
                  </div>
                  {searchTerm && filteredCustomers.length > 0 && isSearchFocused && (
                    <div className="absolute top-full left-0 right-0 mt-3 sm:mt-4 bg-white rounded-xl shadow-2xl border border-slate-100 p-2 sm:p-4 z-50 max-h-[300px] overflow-y-auto custom-scrollbar">
                      {filteredCustomers.map(c => (
                        <button
                          key={c._id}
                          type="button"
                          onClick={() => { setFormData(p => ({ ...p, customerId: c._id })); setSearchTerm(''); setIsSearchFocused(false); }}
                          className="w-full p-2.5 sm:p-4 hover:bg-slate-50 rounded-xl flex items-center justify-between text-left group/item"
                        >
                          <div className="min-w-0">
                            <p className="font-black text-slate-800 uppercase text-sm sm:text-base truncate">
                              {language === 'ur' ? tn(c.name) : (searchingByPhone ? c.name : <HighlightedName name={c.name} term={searchTerm} />)}
                            </p>
                            <p className="text-[11px] sm:text-xs text-slate-400 font-bold truncate">
                              {searchingByPhone ? (
                                (() => {
                                  const { matched, rest } = splitPhoneMatch(c.phoneNumber, searchTerm);
                                  return matched ? (
                                    <span>
                                      <span className="bg-yellow-200 text-slate-800 rounded px-0.5">{matched}</span>
                                      {rest}
                                    </span>
                                  ) : c.phoneNumber;
                                })()
                              ) : c.phoneNumber}
                            </p>
                          </div>
                          <ChevronRight className="text-slate-300 group-hover/item:text-primary transition-colors flex-shrink-0" size={18} />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </Section>
        </div>

        {/* ── Dress Styling ── */}
        <Section title={t('addOrder.dressStyling')} icon={Palette}>
          <Dropdown
            label={t('addOrder.orderCategory')}
            value={formData.orderCategory}
            onChange={set('orderCategory')}
            options={['Gents / مردانہ', 'Ladies / زنانہ', 'Kids / بچوں کا']}
          />
          <Dropdown
            label={t('addOrder.orderType')}
            value={formData.orderType}
            onChange={set('orderType')}
            options={['Shalwar Qamees / شلوار قمیص', 'Shirt / شرٹ', 'Kurta Shalwar / کُرتا پاجامہ', 'Waist Coat / ویس کوٹ', 'Trouser / ٹراؤزر']}
          />
          <Dropdown
            label={t('addOrder.neckStyle')}
            value={formData.neckStyle}
            onChange={set('neckStyle')}
            options={['Collar / کالر', 'Ban / بین']}
          />
          <Dropdown
            label={t('addOrder.cuffStyle')}
            value={formData.cuffStyle}
            onChange={set('cuffStyle')}
            options={['Cuff / کف والے بازو', 'Simple / سادہ بازو']}
          />
          <Dropdown
            label={t('addOrder.lapStyle')}
            value={formData.lapStyle}
            onChange={set('lapStyle')}
            options={['Single Lap / سنگل لیپ', 'Double Lap / ڈبل لیپ', 'No Lap / بغیر لیپ']}
          />
          <Dropdown
            label={t('addOrder.pantStyle')}
            value={formData.pantStyle}
            onChange={set('pantStyle')}
            options={['Shalwar / شلوار', 'Trouser / ٹراؤزر', 'Pajama / پاجامہ', 'Narrow Shalwar / نیرو شلوار']}
          />
          <Dropdown
            label={t('addOrder.pocketStyle')}
            value={formData.pocketStyle}
            onChange={set('pocketStyle')}
            options={[
              'Front Pocket / سامنے والی جیب',
              '2 Side Pockets / سائڈ جیب',
              'Trouser Pocket / ٹراؤزر جیب',
              '1 Front + 2 Side + 1 Shalwar',
              '0 Front + 0 Side + 0 Shalwar',
              '0 Front + 2 Side + 1 Trouser',
              '2 Front + 2 Side + 1 Shalwar',
              '0 Front + 1 Left Side + 0 Shalwar',
              '0 Front + 1 Right Side + 0 Shalwar',
            ]}
          />
          <Dropdown
            label={t('addOrder.buttonStyle')}
            value={formData.buttonStyle}
            onChange={set('buttonStyle')}
            options={['Fancy / فینسی بٹن', 'Simple / سادہ بٹن', 'Metallic / میٹل بٹن']}
          />
          <Dropdown
            label={t('addOrder.elastic')}
            value={formData.elastic}
            onChange={set('elastic')}
            options={['Elastic / لاسٹک', 'Simple / نالا']}
          />
        </Section>

        {/* ── Embroidery ── */}
        <Section title={t('addOrder.embroidery')} icon={Library}>
          <Dropdown
            label={t('addOrder.embroidery')}
            value={formData.embroidery}
            onChange={set('embroidery')}
            options={['No / کوئی نہیں', 'Yes / ہاں']}
          />
          <Dropdown
            label={t('addOrder.embroideryStyle')}
            value={formData.style}
            onChange={set('style')}
            options={['Single Salai / سنگل سلائی', 'Double Salai / ڈبل سلائی', 'Raishmi Single / ریشمی سنگل', 'Raishmi Double / ریشمی ڈبل']}
          />
          <Dropdown
            label={t('addOrder.bookNumber')}
            value={formData.bookNumber}
            onChange={set('bookNumber')}
            options={['1', '2', '3']}
          />
          <div className="space-y-1.5 sm:space-y-3 min-w-0">
            <label className="text-[10px] sm:text-xs font-black text-slate-400 uppercase tracking-widest px-1 truncate block">{t('addOrder.designNumber')}</label>
            <input
              type="text"
              inputMode="numeric"
              className={`input-field !py-2.5 !px-3 sm:!py-4 sm:!px-5 ${designNumberTouched && validateDesignNumber(formData.designNumber, { t }) ? 'border-red-400 focus:border-red-400 focus:ring-red-100' : ''}`}
              placeholder={t('addOrder.enterDesignCode')}
              value={formData.designNumber}
              onChange={(e) => {
                setDesignNumberTouched(true);
                setFormData(p => ({ ...p, designNumber: e.target.value }));
              }}
              onBlur={() => setDesignNumberTouched(true)}
            />
            {designNumberTouched && validateDesignNumber(formData.designNumber, { t }) && (
              <p className="text-[10px] sm:text-xs text-red-600 font-bold px-1 flex items-center gap-1">⚠ {validateDesignNumber(formData.designNumber, { t })}</p>
            )}
          </div>
        </Section>

        {/* ── Design Catalog (optional) ── */}
        {designs.length > 0 && (
          <div className="glass-card p-4 sm:p-8 lg:p-10 rounded-xl space-y-4 sm:space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4 sm:pb-6">
              <div className="flex items-center gap-2.5 sm:gap-4 min-w-0">
                <div className="bg-primary/10 p-2 sm:p-3 rounded-xl text-primary flex-shrink-0"><Palette size={18} className="sm:hidden" /><Palette size={24} className="hidden sm:block" /></div>
                <h2 className="text-base sm:text-2xl font-black text-slate-800 tracking-tighter uppercase truncate">
                  {t('addOrder.designCatalogOptional')}
                </h2>
              </div>
              {selectedCatalogDesign && (
                <button
                  type="button"
                  onClick={() => setFormData(p => ({ ...p, selectedDesignId: '' }))}
                  className="flex items-center gap-1.5 px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl bg-red-50 text-red-500 text-[10px] sm:text-xs font-black uppercase tracking-wider hover:bg-red-100"
                >
                  <X size={14} /> {t('addOrder.clear')}
                </button>
              )}
            </div>

            {selectedCatalogDesign && (
              <div className="flex items-center gap-3 sm:gap-4 p-3 sm:p-4 bg-primary/5 border-2 border-primary/20 rounded-xl">
                <div className="relative flex-shrink-0">
                  <DesignThumb src={selectedCatalogDesign.images?.[0]?.url} alt={selectedCatalogDesign.name} className="w-12 h-12 sm:w-16 sm:h-16 rounded-xl object-cover" iconSize={20} />
                  {selectedCatalogDesign.images?.length > 1 && (
                    <span className="absolute -bottom-1 -right-1 px-1.5 py-0.5 rounded-full text-[9px] font-black bg-black/60 text-white">
                      +{selectedCatalogDesign.images.length - 1}
                    </span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-black text-slate-800 uppercase truncate text-xs sm:text-base">{selectedCatalogDesign.name}</p>
                  <p className="text-[10px] sm:text-xs text-slate-400 font-bold">{td(selectedCatalogDesign.category)}</p>
                </div>
                {selectedCatalogDesign.images?.length > 1 && (
                  <button
                    type="button"
                    onClick={() => setViewingDesign(selectedCatalogDesign)}
                    className="flex items-center gap-1.5 px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-xl bg-white border-2 border-primary/20 text-primary text-[10px] sm:text-xs font-black uppercase tracking-wider hover:bg-primary/10 whitespace-nowrap"
                  >
                    <Library size={14} /> <span className="hidden sm:inline">{t('addOrder.allPhotos')} </span>({selectedCatalogDesign.images.length})
                  </button>
                )}
              </div>
            )}

            <div className="flex flex-col md:flex-row md:items-center gap-3 sm:gap-4">
              <div className="flex items-stretch border border-slate-200 rounded-xl overflow-hidden bg-white/50 flex-1">
                <div className="flex items-center justify-center px-3 sm:px-4 bg-slate-100/80 border-r border-slate-200">
                  <Search size={16} className="text-slate-400 sm:hidden" /><Search size={18} className="text-slate-400 hidden sm:block" />
                </div>
                <input
                  type="text"
                  placeholder={t('addOrder.searchDesigns')}
                  className="flex-1 min-w-0 px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base bg-transparent outline-none text-slate-700 placeholder:text-slate-400"
                  value={designSearch}
                  onChange={(e) => setDesignSearch(e.target.value)}
                />
              </div>
              <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                <button
                  type="button"
                  onClick={() => setDesignCategoryFilter('All')}
                  className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl text-[10px] sm:text-xs font-black uppercase tracking-wider transition-all ${designCategoryFilter === 'All' ? 'bg-primary text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
                >
                  {t('addOrder.all')}
                </button>
                {DESIGN_CATEGORIES.map(c => (
                  <button
                    type="button"
                    key={c}
                    onClick={() => setDesignCategoryFilter(c)}
                    className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl text-[10px] sm:text-xs font-black uppercase tracking-wider transition-all whitespace-nowrap ${designCategoryFilter === c ? 'bg-primary text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
                  >
                    {td(c)}
                  </button>
                ))}
              </div>
            </div>

            {filteredCatalogDesigns.length === 0 ? (
              <p className="text-slate-400 font-medium text-center py-6">{t('addOrder.noMatchingDesignFound')}</p>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5 sm:gap-3 max-h-[420px] overflow-y-auto scrollbar-hide pr-1">
                {filteredCatalogDesigns.map(d => {
                  const isSelected = formData.selectedDesignId === d._id;
                  return (
                    <button
                      type="button"
                      key={d._id}
                      onClick={() => setFormData(p => ({ ...p, selectedDesignId: isSelected ? '' : d._id }))}
                      className={`glass-card rounded-2xl overflow-hidden group cursor-pointer hover:shadow-xl hover:shadow-primary/10 hover:-translate-y-0.5 transition-all p-2.5 sm:p-4 flex flex-col items-center text-center border-2 ${isSelected ? 'border-primary ring-4 ring-primary/20' : 'border-transparent hover:border-primary/40'}`}
                    >
                      <div className="relative w-20 h-20 sm:w-28 sm:h-28 lg:w-32 lg:h-32 flex-shrink-0">
                        <div className="w-full h-full rounded-2xl overflow-hidden bg-white border border-slate-100">
                          <DesignThumb src={d.images?.[0]?.url} alt={d.name} className="w-full h-full object-cover object-center" iconSize={22} />
                        </div>
                        {d.images?.length > 1 && (
                          <span className="absolute bottom-1.5 left-1.5 px-2 py-0.5 rounded-full text-[10px] font-black bg-black/50 text-white backdrop-blur-sm">
                            +{d.images.length - 1}
                          </span>
                        )}
                        {isSelected && (
                          <div className="absolute top-1.5 right-1.5 p-1.5 bg-primary text-white rounded-xl shadow">
                            <Check size={14} />
                          </div>
                        )}
                      </div>
                      <div className="w-full mt-2 sm:mt-3 space-y-1">
                        <h3 className="text-[11px] sm:text-sm font-black text-slate-800 uppercase truncate">
                          <HighlightedName name={d.name} term={designSearch} />
                        </h3>
                        <div className="flex justify-center">
                          <span className="inline-block px-2 py-0.5 rounded-full text-[8px] sm:text-[9px] font-black uppercase tracking-widest bg-indigo-100 text-indigo-600">
                            {td(d.category)}
                          </span>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {error && (
          <div className="bg-red-50 text-red-600 p-4 sm:p-6 rounded-xl text-center font-bold border border-red-100 text-sm sm:text-base">
            {error}
          </div>
        )}

        <div className="flex justify-center sm:justify-end pt-8">
          <button
            type="submit"
            disabled={loading}
            aria-disabled={!formData.customerId || !hasMeasurements || checkingSize}
            className={`primary-btn w-full sm:w-auto px-8 sm:px-16 py-4 sm:py-6 rounded-xl flex items-center justify-center gap-4 text-base sm:text-xl shadow-2xl shadow-primary/30 transition-all ${
              !formData.customerId || !hasMeasurements || checkingSize || loading ? 'opacity-50' : 'hover:scale-[1.05]'
            }`}
          >
            {loading ? (
              <Loader2 className="animate-spin" size={28} />
            ) : isEditMode ? (
              <>{t('addOrder.updateOrder')} <ClipboardList size={28} /></>
            ) : (
              <>{t('addOrder.saveOrderFinish')} <ClipboardList size={28} /></>
            )}
          </button>
        </div>

      </form>

      {viewingDesign && (
        <DesignDetailModal
          design={viewingDesign}
          onClose={() => setViewingDesign(null)}
        />
      )}
    </div>
  );
};

export default AddOrder;
