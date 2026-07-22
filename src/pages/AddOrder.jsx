import React, { useState, useRef, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { useLocalState } from '../context/useLocalState';
import {
  Scissors, Search, ClipboardList,
  Palette, Library, CheckCircle,
  ChevronRight, ArrowLeft, Loader2, Check, X, Ruler, AlertTriangle
} from 'lucide-react';
import { isDigitsOnly, matchesPhoneSearch, splitPhoneMatch } from '../utils/phoneSearch';
import { validateDesignNumber } from '../utils/validators';
import { matchesNameSearch, sortByNameMatch, highlightNameMatch } from '../utils/nameSearch';
import { DESIGN_CATEGORIES } from '../utils/designCategories';
import DesignDetailModal from '../components/DesignDetailModal';

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
const Section = ({ title, icon, children }) => {
  const Icon = icon;
  return (
    <div className="glass-card p-6 sm:p-8 lg:p-10 rounded-[2rem] sm:rounded-[2.5rem] lg:rounded-[3rem] space-y-8">
      <div className="flex items-center gap-4 border-b border-slate-100 pb-6">
        <div className="bg-primary/10 p-3 rounded-2xl text-primary"><Icon size={24} /></div>
        <h2 className="text-2xl font-black text-slate-800 tracking-tighter uppercase">{title}</h2>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {children}
      </div>
    </div>
  );
};

const Dropdown = ({ label, options, value, onChange }) => (
  <div className="space-y-3">
    <label className="text-xs font-black text-slate-400 uppercase tracking-widest px-1">{label}</label>
    <select
      className="input-field appearance-none cursor-pointer"
      value={value}
      onChange={(e) => onChange(e.target.value)}
    >
      {options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
    </select>
  </div>
);
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
      setError('Please select a customer first / پہلے کسٹمر منتخب کریں');
      setLoading(false);
      return;
    }

    if (!hasMeasurements) {
      setError('Pehle customer ki measurements add karein, phir order banayein / Please add the customer\'s measurements before creating an order');
      setLoading(false);
      return;
    }

    const designNumberError = validateDesignNumber(formData.designNumber);
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
      setError(err.response?.data?.error || err.message || 'Failed to save order. Please try again.');
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
          {isEditMode ? 'Order Updated Successfully!' : 'Order Saved Successfully!'}
        </h2>
        <p className="text-slate-500 font-medium">Redirecting to orders...</p>
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
            <div className="bg-primary p-2 sm:p-3 rounded-2xl text-white shadow-lg flex-shrink-0"><Scissors size={20} className="sm:hidden" /><Scissors size={32} className="hidden sm:block" /></div>
            <span className="truncate">{isEditMode ? 'Edit Tailoring Order' : 'New Tailoring Order'}</span>
          </h1>
          <p className="text-slate-500 mt-1.5 sm:mt-2 font-medium text-xs sm:text-lg ml-[44px] sm:ml-16 truncate">
            {isEditMode ? 'Update the details for this order.' : 'Custom craft perfection for every client.'}
          </p>
        </div>
        <button onClick={() => navigate(-1)} className="p-3 sm:p-4 bg-white rounded-2xl text-slate-400 hover:text-primary transition-colors shadow-xl shadow-slate-200 flex-shrink-0">
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
          <Section title="Customer / کسٹمر کا انتخاب" icon={Search}>
            <div className="lg:col-span-3 space-y-4">
              {selectedCustomer ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between bg-primary/5 p-6 rounded-[2rem] border-2 border-primary/10">
                    <div className="flex items-center gap-6">
                      <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center text-white text-2xl font-black">
                        {selectedCustomer.name?.charAt(0) || '?'}
                      </div>
                      <div>
                        <h3 className="text-xl font-black text-slate-800 uppercase">{selectedCustomer.name}</h3>
                        <p className="text-primary font-bold">{selectedCustomer.phoneNumber}</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setFormData(p => ({ ...p, customerId: '' }))}
                      disabled={isEditMode}
                      className="text-slate-400 font-bold hover:text-red-500 transition-colors disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:text-slate-400"
                    >
                      Change Customer
                    </button>
                  </div>

                  {!isEditMode && !checkingSize && !hasMeasurements && (
                    <div className="flex flex-col sm:flex-row sm:items-center gap-4 bg-amber-50 border-2 border-amber-200 p-6 rounded-[2rem]">
                      <div className="flex items-center gap-3 flex-1">
                        <AlertTriangle className="text-amber-500 flex-shrink-0" size={24} />
                        <p className="text-amber-700 font-bold text-sm">
                          Is customer ki measurements abhi tak add nahi hui — order banane se pehle measurements zaroori hain.
                          <br className="hidden sm:block" />
                          This customer has no measurements on file yet — required before an order can be created.
                        </p>
                      </div>
                      <Link
                        to={`/customer/${selectedCustomer._id}`}
                        className="flex-shrink-0 flex items-center justify-center gap-2 px-5 py-3 bg-amber-500 hover:bg-amber-600 text-white font-black text-sm rounded-2xl transition-all whitespace-nowrap"
                      >
                        <Ruler size={16} /> Measurements Add Karein
                      </Link>
                    </div>
                  )}
                </div>
              ) : (
                <div className="relative" ref={searchBoxRef}>
                  <div className="flex items-stretch border border-slate-200 rounded-[2.5rem] overflow-hidden bg-white/50 focus-within:ring-2 focus-within:ring-primary/20 transition-all">
                    <div className="flex items-center justify-center px-5 bg-slate-100/80 border-r border-slate-200 min-w-[60px]">
                      <Search size={20} className="text-slate-400" />
                    </div>
                    <input
                      type="text"
                      placeholder="Search customer by name or phone (start with 0)..."
                      className="flex-1 px-5 py-6 text-lg bg-transparent outline-none text-slate-700 placeholder:text-slate-400"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      onFocus={() => setIsSearchFocused(true)}
                    />
                  </div>
                  {searchTerm && filteredCustomers.length > 0 && isSearchFocused && (
                    <div className="absolute top-full left-0 right-0 mt-4 bg-white rounded-[2rem] shadow-2xl border border-slate-100 p-4 z-50 max-h-[300px] overflow-y-auto custom-scrollbar">
                      {filteredCustomers.map(c => (
                        <button
                          key={c._id}
                          type="button"
                          onClick={() => { setFormData(p => ({ ...p, customerId: c._id })); setSearchTerm(''); setIsSearchFocused(false); }}
                          className="w-full p-4 hover:bg-slate-50 rounded-2xl flex items-center justify-between text-left group/item"
                        >
                          <div>
                            <p className="font-black text-slate-800 uppercase">
                              {searchingByPhone ? c.name : <HighlightedName name={c.name} term={searchTerm} />}
                            </p>
                            <p className="text-xs text-slate-400 font-bold">
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
                          <ChevronRight className="text-slate-300 group-hover/item:text-primary transition-colors" />
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
        <Section title="Dress Styling / پرہیز" icon={Palette}>
          <Dropdown
            label="Order Category / آرڈر کٹیگری"
            value={formData.orderCategory}
            onChange={set('orderCategory')}
            options={['Gents / مردانہ', 'Ladies / زنانہ', 'Kids / بچوں کا']}
          />
          <Dropdown
            label="Order Type / آرڈر کی قسم"
            value={formData.orderType}
            onChange={set('orderType')}
            options={['Shalwar Qamees / شلوار قمیص', 'Shirt / شرٹ', 'Kurta Shalwar / کُرتا پاجامہ', 'Waist Coat / ویس کوٹ', 'Trouser / ٹراؤزر']}
          />
          <Dropdown
            label="Neck Style / گلا"
            value={formData.neckStyle}
            onChange={set('neckStyle')}
            options={['Collar / کالر', 'Ban / بین']}
          />
          <Dropdown
            label="Cuff Style / کف"
            value={formData.cuffStyle}
            onChange={set('cuffStyle')}
            options={['Cuff / کف والے بازو', 'Simple / سادہ بازو']}
          />
          <Dropdown
            label="Lap Style / لیپ"
            value={formData.lapStyle}
            onChange={set('lapStyle')}
            options={['Single Lap / سنگل لیپ', 'Double Lap / ڈبل لیپ', 'No Lap / بغیر لیپ']}
          />
          <Dropdown
            label="Pant Style / پینٹ"
            value={formData.pantStyle}
            onChange={set('pantStyle')}
            options={['Shalwar / شلوار', 'Trouser / ٹراؤزر', 'Pajama / پاجامہ', 'Narrow Shalwar / نیرو شلوار']}
          />
          <Dropdown
            label="Pocket Style / جیب"
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
            label="Button Style / بٹن"
            value={formData.buttonStyle}
            onChange={set('buttonStyle')}
            options={['Fancy / فینسی بٹن', 'Simple / سادہ بٹن', 'Metallic / میٹل بٹن']}
          />
          <Dropdown
            label="Elastic / لاسٹک"
            value={formData.elastic}
            onChange={set('elastic')}
            options={['Elastic / لاسٹک', 'Simple / نالا']}
          />
        </Section>

        {/* ── Embroidery ── */}
        <Section title="Embroidery / کڑھائی" icon={Library}>
          <Dropdown
            label="Embroidery / کڑھائی"
            value={formData.embroidery}
            onChange={set('embroidery')}
            options={['No / کوئی نہیں', 'Yes / ہاں']}
          />
          <Dropdown
            label="Embroidery Style / کڑہائی کا سٹائل"
            value={formData.style}
            onChange={set('style')}
            options={['Single Salai / سنگل سلائی', 'Double Salai / ڈبل سلائی', 'Raishmi Single / ریشمی سنگل', 'Raishmi Double / ریشمی ڈبل']}
          />
          <Dropdown
            label="Book Number / کتاب کا نمبر"
            value={formData.bookNumber}
            onChange={set('bookNumber')}
            options={['1', '2', '3']}
          />
          <div className="space-y-3">
            <label className="text-xs font-black text-slate-400 uppercase tracking-widest px-1">Design Number / ڈیزائن نمبر</label>
            <input
              type="text"
              inputMode="numeric"
              className={`input-field ${designNumberTouched && validateDesignNumber(formData.designNumber) ? 'border-red-400 focus:border-red-400 focus:ring-red-100' : ''}`}
              placeholder="Enter design code..."
              value={formData.designNumber}
              onChange={(e) => {
                setDesignNumberTouched(true);
                setFormData(p => ({ ...p, designNumber: e.target.value }));
              }}
              onBlur={() => setDesignNumberTouched(true)}
            />
            {designNumberTouched && validateDesignNumber(formData.designNumber) && (
              <p className="text-xs text-red-600 font-bold px-1 flex items-center gap-1">⚠ {validateDesignNumber(formData.designNumber)}</p>
            )}
          </div>
        </Section>

        {/* ── Design Catalog (optional) ── */}
        {designs.length > 0 && (
          <div className="glass-card p-6 sm:p-8 lg:p-10 rounded-[2rem] sm:rounded-[2.5rem] lg:rounded-[3rem] space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-6">
              <div className="flex items-center gap-4">
                <div className="bg-primary/10 p-3 rounded-2xl text-primary"><Palette size={24} /></div>
                <h2 className="text-2xl font-black text-slate-800 tracking-tighter uppercase">Design Catalog / ڈیزائن کیٹلاگ (Optional)</h2>
              </div>
              {selectedCatalogDesign && (
                <button
                  type="button"
                  onClick={() => setFormData(p => ({ ...p, selectedDesignId: '' }))}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-red-50 text-red-500 text-xs font-black uppercase tracking-wider hover:bg-red-100"
                >
                  <X size={14} /> Clear
                </button>
              )}
            </div>

            {selectedCatalogDesign && (
              <div className="flex items-center gap-4 p-4 bg-primary/5 border-2 border-primary/20 rounded-2xl">
                <img src={selectedCatalogDesign.images?.[0]?.url} alt={selectedCatalogDesign.name} className="w-16 h-16 rounded-xl object-cover" />
                <div className="flex-1 min-w-0">
                  <p className="font-black text-slate-800 uppercase truncate">{selectedCatalogDesign.name}</p>
                  <p className="text-xs text-slate-400 font-bold">{selectedCatalogDesign.category}</p>
                </div>
                {selectedCatalogDesign.images?.length > 1 && (
                  <button
                    type="button"
                    onClick={() => setViewingDesign(selectedCatalogDesign)}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white border-2 border-primary/20 text-primary text-xs font-black uppercase tracking-wider hover:bg-primary/10 whitespace-nowrap"
                  >
                    <Library size={14} /> Sab Tasveerein ({selectedCatalogDesign.images.length})
                  </button>
                )}
              </div>
            )}

            <div className="flex flex-col md:flex-row md:items-center gap-4">
              <div className="flex items-stretch border border-slate-200 rounded-2xl overflow-hidden bg-white/50 flex-1">
                <div className="flex items-center justify-center px-4 bg-slate-100/80 border-r border-slate-200">
                  <Search size={18} className="text-slate-400" />
                </div>
                <input
                  type="text"
                  placeholder="Design search karein..."
                  className="flex-1 px-4 py-3 bg-transparent outline-none text-slate-700 placeholder:text-slate-400"
                  value={designSearch}
                  onChange={(e) => setDesignSearch(e.target.value)}
                />
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => setDesignCategoryFilter('All')}
                  className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${designCategoryFilter === 'All' ? 'bg-primary text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
                >
                  All
                </button>
                {DESIGN_CATEGORIES.map(c => (
                  <button
                    type="button"
                    key={c}
                    onClick={() => setDesignCategoryFilter(c)}
                    className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all whitespace-nowrap ${designCategoryFilter === c ? 'bg-primary text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
                  >
                    {c.split(' / ')[0]}
                  </button>
                ))}
              </div>
            </div>

            {filteredCatalogDesigns.length === 0 ? (
              <p className="text-slate-400 font-medium text-center py-6">Koi matching design nahi mila</p>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 max-h-[420px] overflow-y-auto custom-scrollbar pr-1">
                {filteredCatalogDesigns.map(d => {
                  const isSelected = formData.selectedDesignId === d._id;
                  return (
                    <button
                      type="button"
                      key={d._id}
                      onClick={() => setFormData(p => ({ ...p, selectedDesignId: isSelected ? '' : d._id }))}
                      className={`relative rounded-2xl overflow-hidden border-2 transition-all text-left ${isSelected ? 'border-primary ring-4 ring-primary/20' : 'border-slate-100 hover:border-primary/40'}`}
                    >
                      <div className="relative">
                        <img src={d.images?.[0]?.url} alt={d.name} className="w-full h-28 object-contain bg-slate-50" />
                        {d.images?.length > 1 && (
                          <span className="absolute bottom-2 left-2 px-2 py-0.5 rounded-full text-[9px] font-black bg-black/50 text-white backdrop-blur-sm">
                            +{d.images.length - 1}
                          </span>
                        )}
                        {isSelected && (
                          <div className="absolute top-2 right-2 p-1.5 bg-primary text-white rounded-lg shadow">
                            <Check size={14} />
                          </div>
                        )}
                      </div>
                      <div className="p-2 bg-white">
                        <p className="text-xs font-black text-slate-700 uppercase truncate">
                          <HighlightedName name={d.name} term={designSearch} />
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {error && (
          <div className="bg-red-50 text-red-600 p-6 rounded-[2rem] text-center font-bold border border-red-100">
            {error}
          </div>
        )}

        <div className="flex justify-center sm:justify-end pt-8">
          <button
            type="submit"
            disabled={loading}
            aria-disabled={!formData.customerId || !hasMeasurements || checkingSize}
            className={`primary-btn w-full sm:w-auto px-8 sm:px-16 py-4 sm:py-6 rounded-3xl flex items-center justify-center gap-4 text-base sm:text-xl shadow-2xl shadow-primary/30 transition-all ${
              !formData.customerId || !hasMeasurements || checkingSize || loading ? 'opacity-50' : 'hover:scale-[1.05]'
            }`}
          >
            {loading ? (
              <Loader2 className="animate-spin" size={28} />
            ) : isEditMode ? (
              <>Update Order / آرڈر اپ ڈیٹ کریں <ClipboardList size={28} /></>
            ) : (
              <>Save Order & Finish / آرڈر محفوظ کریں <ClipboardList size={28} /></>
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
