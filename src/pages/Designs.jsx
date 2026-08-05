import React, { useState, useRef, useMemo, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useLocalState } from '../context/useLocalState';
import { DESIGN_CATEGORIES } from '../utils/designCategories';
import { Palette, Plus, Loader2, Save, ImagePlus, X, Search, Star, Link2, Upload, Clock, Users, Sparkles, ArrowRight } from 'lucide-react';
import { matchesNameSearch, sortByNameMatch, highlightNameMatch } from '../utils/nameSearch';
import DesignDetailModal from '../components/DesignDetailModal';
import DesignThumb from '../components/DesignThumb';
import PaginationControls from '../components/PaginationControls';
import { useLanguage } from '../context/LanguageContext';

// Highlights the matched portion of a design name — same yellow-highlight
// treatment already used on the Customers search (utils/nameSearch.js),
// reused here instead of a separate copy so both searches look and behave
// identically.
const HighlightedName = ({ name, term }) => (
  <>
    {highlightNameMatch(name, term).map((seg, i) =>
      seg.match
        ? <span key={i} className="bg-yellow-200 text-slate-800 rounded px-0.5">{seg.text}</span>
        : <span key={i}>{seg.text}</span>
    )}
  </>
);

const EMPTY = { name: '', nameUrdu: '', description: '', descriptionUrdu: '', category: DESIGN_CATEGORIES[0], price: '', isFeatured: false };
const EMPTY_FORM = { name: '', description: '', descriptionUrdu: '', category: DESIGN_CATEGORIES[0], price: '', isFeatured: false };

// Small inline error line shown directly under a field, instead of one
// generic error banner at the bottom of the form.
const FieldError = ({ message }) => {
  if (!message) return null;
  return <p className="text-red-500 text-xs font-bold mt-1">⚠ {message}</p>;
};

const Designs = () => {
  const { designs, customers, orders, loading, addDesign, updateDesign, deleteDesign, translateMissingDesigns } = useLocalState();
  const { t, language } = useLanguage();
  const [translating, setTranslating] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  // Unified list so existing (already-uploaded), newly-picked files, and
  // pasted URLs can all sit side by side and be added to / removed from
  // individually — instead of any new pick wiping out everything else.
  // Each item: { id, kind: 'existing' | 'new' | 'url', previewUrl, file?, publicId? }
  const [imageItems, setImageItems] = useState([]);
  const [urlInput, setUrlInput] = useState('');
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [viewingDesign, setViewingDesign] = useState(null);
  const fileInputRef = useRef(null);
  const nextItemId = useRef(0);
  const autoTranslateTriggered = useRef(false);
  const newItemId = () => `img-${nextItemId.current++}`;

  // ── Search / filter ──
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [featuredOnly, setFeaturedOnly] = useState(false);

  const filteredDesigns = useMemo(() => {
    const base = designs.filter(d => {
      if (featuredOnly && !d.isFeatured) return false;
      if (categoryFilter !== 'All' && d.category !== categoryFilter) return false;
      if (!matchesNameSearch(d.name, searchTerm)) return false;
      return true;
    });
    // Closest matches first (a design literally named "Aesthetic" should
    // rank above one merely containing those letters somewhere), same
    // ranking logic already used for Customers search.
    return sortByNameMatch(base, searchTerm);
  }, [designs, searchTerm, categoryFilter, featuredOnly]);

  // Shown 6 at a time (two rows) instead of the whole catalog at once —
  // Prev/Next below the grid pages through the rest.
  const DESIGN_PAGE_SIZE = 6;
  const [designPage, setDesignPage] = useState(1);
  useEffect(() => { setDesignPage(1); }, [searchTerm, categoryFilter, featuredOnly]);
  const totalDesignPages = Math.max(1, Math.ceil(filteredDesigns.length / DESIGN_PAGE_SIZE));
  const safeDesignPage = Math.min(designPage, totalDesignPages);
  const pagedDesigns = filteredDesigns.slice((safeDesignPage - 1) * DESIGN_PAGE_SIZE, safeDesignPage * DESIGN_PAGE_SIZE);

  // Other designs in the same category, shown inside the detail modal —
  // mirrors the "Related Designs" section customers see so admin's view
  // has the same modal content/styling either way.
  const relatedDesigns = viewingDesign
    ? designs.filter(d => d._id !== viewingDesign._id && d.category === viewingDesign.category).slice(0, 6)
    : [];

  // ── Hero "Pick of the Day" — a real featured design (falling back to the
  // most recently added one if nothing is marked Featured yet), with an
  // honest countdown to local midnight. No invented discount or price —
  // just the design's actual price, if it has one.
  const pickOfTheDay = useMemo(() => {
    const featured = designs.filter(d => d.isFeatured);
    const pool = featured.length > 0 ? featured : designs;
    return [...pool].sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))[0] || null;
  }, [designs]);

  const [timeLeft, setTimeLeft] = useState({ h: 0, m: 0, s: 0 });
  useEffect(() => {
    const tick = () => {
      const now = new Date();
      const midnight = new Date(now); midnight.setHours(24, 0, 0, 0);
      const diff = Math.max(0, midnight - now);
      setTimeLeft({
        h: Math.floor(diff / 3.6e6),
        m: Math.floor((diff % 3.6e6) / 6e4),
        s: Math.floor((diff % 6e4) / 1000),
      });
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);
  const pad = (n) => String(n).padStart(2, '0');

  // ── Real catalog stats for the "trusted by" strip — actual counts, no
  // invented review quotes since no design-review data exists.
  const catalogStats = [
    { icon: Palette, value: designs.length, label: t('Designs in catalog', 'کیٹلاگ میں ڈیزائنز') },
    { icon: Star, value: designs.filter(d => d.isFeatured).length, label: t('Featured designs', 'نمایاں ڈیزائنز') },
    { icon: Users, value: customers.length, label: t('Customers served', 'کسٹمرز') },
    { icon: Sparkles, value: orders.filter(o => ['Completed', 'Received By Customer'].includes(o.orderStatus)).length, label: t('Orders completed', 'مکمل آرڈرز') },
  ];

  // ── "Shop by Category" showcase — one real picture per category (Gents/
  // Ladies/Kids/Bridal/Other), so the admin can see + jump straight into
  // each category from the front of the page instead of only via the
  // filter pills further down. Picking one shows every design in that
  // category below (id="catalog"), where clicking any design opens the
  // existing edit/delete modal — no separate edit/delete UI needed here.
  const categoryShowcase = useMemo(() => {
    return DESIGN_CATEGORIES.map(cat => {
      const inCategory = designs.filter(d => d.category === cat);
      if (inCategory.length === 0) return null;
      const cover = inCategory.find(d => d.isFeatured) || inCategory[0];
      return { category: cat, cover, count: inCategory.length };
    }).filter(Boolean);
  }, [designs]);

  const goToCategory = (cat) => {
    setCategoryFilter(cat);
    document.getElementById('catalog')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const openAdd = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setImageItems([]);
    setUrlInput('');
    setShowUrlInput(false);
    setError('');
    setFieldErrors({});
    setShowForm(true);
    // The form renders at the top of the page, above the grid — without
    // this, editing a design further down the (possibly long, scrolled)
    // grid opens the form off-screen above the current scroll position,
    // and it looks like nothing happened until you scroll up manually.
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  const openEdit = (d) => {
    setEditingId(d._id);
    setForm({
      name: d.name,
      description: d.description || '',
      descriptionUrdu: d.descriptionUrdu || '',
      category: d.category || DESIGN_CATEGORIES[0],
      price: d.price !== null && d.price !== undefined ? String(d.price) : '',
      isFeatured: Boolean(d.isFeatured),
    });
    setImageItems((d.images || []).map(img => ({
      id: newItemId(), kind: 'existing', previewUrl: img.url, publicId: img.publicId,
    })));
    setUrlInput('');
    setShowUrlInput(false);
    setError('');
    setFieldErrors({});
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  const closeForm = () => {
    setShowForm(false);
    setEditingId(null);
    setForm(EMPTY_FORM);
    setImageItems([]);
    setUrlInput('');
    setShowUrlInput(false);
    setError('');
    setFieldErrors({});
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    const badFile = files.find(f => !f.type.startsWith('image/'));
    if (badFile) {
      setFieldErrors(fe => ({ ...fe, image: 'Please select image files only' }));
      return;
    }
    setFieldErrors(fe => ({ ...fe, image: undefined }));
    // Appends to whatever is already there — existing images, and any
    // other new picks or pasted URLs, are all kept.
    setImageItems(prev => [
      ...prev,
      ...files.map(file => ({ id: newItemId(), kind: 'new', file, previewUrl: URL.createObjectURL(file) })),
    ]);
    e.target.value = ''; // allow picking the same file again later if removed
  };

  const handleAddUrl = () => {
    const url = urlInput.trim();
    if (!url) return;
    if (!/^https?:\/\//i.test(url)) {
      setFieldErrors(fe => ({ ...fe, image: 'Enter a valid image URL (starting with http:// or https://)' }));
      return;
    }
    setFieldErrors(fe => ({ ...fe, image: undefined }));
    setImageItems(prev => [...prev, { id: newItemId(), kind: 'url', previewUrl: url, sourceUrl: url }]);
    setUrlInput('');
  };

  const removeImageItem = (id) => {
    setImageItems(prev => prev.filter(item => item.id !== id));
  };

  const handleSave = async () => {
    const errors = {};
    if (!form.name.trim()) errors.name = t('Name is required', 'نام درج کرنا ضروری ہے');
    if (!form.description.trim()) errors.description = t('Description is required', 'تفصیل درج کرنا ضروری ہے');
    if (imageItems.length === 0) errors.image = t('At least one image is required', 'کم از کم ایک تصویر درکار ہے');
    if (Object.keys(errors).length > 0) { setFieldErrors(errors); return; }

    setFieldErrors({});
    setSaving(true); setError('');
    try {
      const payload = {
        name: form.name,
        description: form.description,
        descriptionUrdu: form.descriptionUrdu,
        category: form.category,
        price: form.price === '' ? null : Number(form.price),
        isFeatured: form.isFeatured,
        imageFiles: imageItems.filter(i => i.kind === 'new').map(i => i.file),
        imageUrls: imageItems.filter(i => i.kind === 'url').map(i => i.sourceUrl),
        // Only meaningful (and only sent) on update — tells the backend
        // which of the design's current images to keep as-is.
        existingImages: editingId
          ? imageItems.filter(i => i.kind === 'existing').map(i => ({ url: i.previewUrl, publicId: i.publicId }))
          : undefined,
      };
      editingId ? await updateDesign(editingId, payload) : await addDesign(payload);
      closeForm();
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Failed to save.');
    } finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm(t('Delete this design? This will permanently remove it.', 'کیا اس ڈیزائن کو حذف کیا جائے؟ یہ مستقل طور پر ختم ہو جائے گا۔'))) return false;
    setDeletingId(id);
    try {
      await deleteDesign(id);
      return true;
    } catch {
      alert(t('Failed to delete design.', 'ڈیزائن حذف نہیں ہو سکا۔'));
      return false;
    } finally {
      setDeletingId(null);
    }
  };

  // Auto-run the backend backfill the first time Urdu is selected so the
  // catalog shows translated titles/descriptions without a manual button.
  useEffect(() => {
    if (language !== 'ur' || autoTranslateTriggered.current) return;
    autoTranslateTriggered.current = true;
    const run = async () => {
      setTranslating(true);
      try {
        await translateMissingDesigns();
      } catch (err) {
        autoTranslateTriggered.current = false;
        alert(err.response?.data?.error || err.message || 'Translation failed.');
      } finally {
        setTranslating(false);
      }
    };
    run();
  }, [language, translateMissingDesigns]);

  if (loading) return (
    <div className="h-[60vh] flex flex-col items-center justify-center space-y-4">
      <Loader2 className="animate-spin text-primary" size={48} />
      <p className="text-slate-500 font-bold animate-pulse uppercase tracking-tighter">{t('Loading Designs...', 'ڈیزائنز لوڈ ہو رہے ہیں...')}</p>
    </div>
  );

  return (
    <div className="space-y-10 pb-20">
      <motion.header
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: 'easeOut' }}
        className="flex flex-row items-start sm:items-center justify-between gap-3 sm:gap-4"
      >
        <div className="min-w-0">
          <h1 className="text-2xl sm:text-4xl lg:text-5xl font-black text-slate-800 tracking-tighter uppercase flex items-center gap-2 sm:gap-4">
            <div className="bg-primary p-2 sm:p-3 rounded-xl text-white shadow-lg flex-shrink-0"><Palette size={20} className="sm:hidden" /><Palette size={32} className="hidden sm:block" /></div>
            <span className="truncate">{t('Designs', 'ڈیزائنز')}</span>
          </h1>
          <p className="text-slate-500 mt-2 font-medium text-xs sm:text-lg ml-[44px] sm:ml-16">
            {t(`${designs.length} design${designs.length === 1 ? '' : 's'} in catalog`, `کیٹلاگ میں ${designs.length} ڈیزائنز`)}
          </p>
        </div>
        {!showForm && (
          <div className="flex-shrink-0">
            <button onClick={openAdd} className="primary-btn px-3 py-2 text-xs sm:px-8 sm:py-4 sm:text-base rounded-xl flex items-center justify-center gap-1.5 sm:gap-3 shadow-xl shadow-primary/20 whitespace-nowrap">
              <Plus size={14} className="sm:hidden" /><Plus size={22} className="hidden sm:block" /> {t('Add Design', 'نیا ڈیزائن')}
            </button>
          </div>
        )}
      </motion.header>

      {/* Landing-style hero — big heading + a real "pick of the day" design
          showcased with a decorative arch backdrop, mirroring the product
          site look the admin asked for. Real price, no invented discount. */}
      {!showForm && designs.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
          className="rounded-2xl sm:rounded-3xl overflow-hidden p-6 sm:p-10 lg:p-14 bg-gradient-to-br from-primary/5 via-white to-primary/10 border border-primary/10"
        >
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
            <div>
              <span className="inline-flex items-center gap-1.5 text-[11px] font-black uppercase tracking-widest text-primary bg-primary/10 rounded-full px-3 py-1.5 mb-4">
                <Sparkles size={13} /> {t('Your Design Catalog', 'آپ کا ڈیزائن کیٹلاگ')}
              </span>
              <h2 className="text-3xl sm:text-5xl font-black text-slate-900 tracking-tight leading-[1.05]">
                {t('Beautiful Designs For', 'خوبصورت ڈیزائنز')}<br />
                <span className="text-primary">{t('Every Occasion', 'ہر موقع کے لیے')}</span>
              </h2>
              <p className="text-slate-500 font-medium mt-4 max-w-md">
                {t('Browse, add and manage the design catalog your customers pick from when placing an order.', 'وہ ڈیزائن کیٹلاگ دیکھیں، شامل کریں اور منظم کریں جس میں سے آپ کے کسٹمرز آرڈر کرتے وقت انتخاب کرتے ہیں۔')}
              </p>
              <div className="flex flex-wrap items-center gap-3 mt-6">
                <button onClick={openAdd} className="primary-btn px-6 py-3 rounded-xl flex items-center gap-2 shadow-lg shadow-primary/20">
                  <Plus size={18} /> {t('Add Design', 'نیا ڈیزائن')}
                </button>
                <a href="#catalog" className="px-6 py-3 rounded-xl border border-slate-200 bg-white text-slate-600 font-bold flex items-center gap-2 hover:border-primary/30 hover:text-primary transition-all">
                  {t('Browse Catalog', 'کیٹلاگ دیکھیں')} <ArrowRight size={16} />
                </a>
              </div>
            </div>

            {/* Pick of the day */}
            {pickOfTheDay && (
              <div className="relative">
                <div className="relative rounded-[2rem] bg-gradient-to-b from-slate-100 to-slate-200/60 overflow-hidden aspect-[4/3] flex items-center justify-center">
                  <div className="absolute inset-0 rounded-full bg-white/40 scale-75 top-1/4" />
                  <DesignThumb src={pickOfTheDay.images?.[0]?.url} alt={pickOfTheDay.name} className="relative w-full h-full object-contain p-8" iconSize={40} />
                </div>
                <div className="absolute -bottom-5 left-1/2 -translate-x-1/2 sm:left-auto sm:translate-x-0 sm:-right-2 bg-white rounded-2xl shadow-xl border border-slate-100 px-5 py-4 w-[calc(100%-2rem)] sm:w-56">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-1.5">
                    <Star size={11} className="text-amber-400" fill="currentColor" /> {t("Today's Pick", 'آج کا انتخاب')}
                  </p>
                  <h3 className="font-black text-slate-800 truncate mt-1">{language === 'ur' && pickOfTheDay.nameUrdu ? pickOfTheDay.nameUrdu : pickOfTheDay.name}</h3>
                  {pickOfTheDay.price !== null && pickOfTheDay.price !== undefined && (
                    <p className="text-primary font-black text-lg mt-1">Rs {pickOfTheDay.price}</p>
                  )}
                  <div className="flex items-center gap-1.5 mt-3 text-slate-600">
                    <Clock size={13} className="text-primary flex-shrink-0" />
                    <span className="text-xs font-bold">{t('Resets in', 'دوبارہ ترتیب')} {pad(timeLeft.h)}:{pad(timeLeft.m)}:{pad(timeLeft.s)}</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Real catalog stats strip — no invented testimonials/quotes since
              there's no design-review data; genuine counts instead. */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mt-14 sm:mt-10">
            {catalogStats.map(({ icon: Icon, value, label }, i) => (
              <motion.div
                key={label}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: i * 0.06, ease: 'easeOut' }}
                className="bg-white rounded-xl p-4 sm:p-5 flex items-center gap-3 border border-slate-100"
              >
                <span className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
                  <Icon size={18} />
                </span>
                <div className="min-w-0">
                  <p className="font-black text-xl sm:text-2xl text-slate-900 leading-none">{value}</p>
                  <p className="text-[10px] sm:text-[11px] font-bold text-slate-400 uppercase tracking-widest mt-1 truncate">{label}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Shop by Category — real picture + count for each category that
          has designs (Gents/Ladies/Kids/Bridal/Other), tappable to jump
          straight to that category in the catalog below. Editing/deleting
          a specific design still happens by clicking into it (existing
          modal) — this row is just a visual entry point per category. */}
      {!showForm && categoryShowcase.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg sm:text-2xl font-black text-slate-800 tracking-tight px-1">
            {t('Shop by Category', 'کیٹیگری کے مطابق دیکھیں')}
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
            {categoryShowcase.map(({ category, cover, count }, i) => {
              const [en, ur] = category.split(' / ');
              return (
                <motion.button
                  key={category}
                  type="button"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: i * 0.05, ease: 'easeOut' }}
                  onClick={() => goToCategory(category)}
                  className={`relative rounded-xl sm:rounded-2xl overflow-hidden aspect-[4/5] group text-left transition-all ${categoryFilter === category ? 'ring-4 ring-primary/40' : 'hover:-translate-y-1'}`}
                >
                  <DesignThumb src={cover.images?.[0]?.url} alt={category} className="absolute inset-0 w-full h-full object-cover" iconSize={28} />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-3 sm:p-4">
                    <p className="text-white font-black text-sm sm:text-lg uppercase tracking-tight truncate">{t(en, ur || en)}</p>
                    <p className="text-white/80 text-[10px] sm:text-xs font-bold">{count} {t(count === 1 ? 'design' : 'designs', 'ڈیزائنز')}</p>
                  </div>
                </motion.button>
              );
            })}
          </div>
        </div>
      )}

      {/* Add/Edit Form — styled like a product hero: big image showcase on
          one side, large editorial-style text fields (name/price/desc) on
          the other, instead of the old plain two-column form grid. */}
      {showForm && (
        <div className="rounded-2xl sm:rounded-3xl p-5 sm:p-10 bg-gradient-to-br from-slate-50 via-white to-primary/5 border border-slate-100">
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-start">

            {/* Left — editorial text fields */}
            <div className="space-y-6 order-2 lg:order-1">
              <div className="flex items-center gap-2 flex-wrap">
                <select
                  className="text-[11px] font-black uppercase tracking-widest text-primary bg-primary/5 border border-primary/10 rounded-full px-3 py-1.5 cursor-pointer focus:outline-none"
                  value={form.category}
                  onChange={e => setForm(p => ({ ...p, category: e.target.value }))}
                >
                  {DESIGN_CATEGORIES.map(c => { const [cEn, cUr] = c.split(' / '); return <option key={c} value={c}>{t(cEn, cUr || cEn)}</option>; })}
                </select>
              </div>

              <div>
                <input
                  type="text"
                  className="w-full bg-transparent border-none focus:outline-none focus:ring-0 text-xl sm:text-2xl font-black text-slate-900 tracking-tight placeholder:text-slate-200 p-0"
                  placeholder={t('Design name...', 'ڈیزائن کا نام...')}
                  value={form.name}
                  onChange={e => {
                    setForm(p => ({ ...p, name: e.target.value }));
                    if (fieldErrors.name) setFieldErrors(fe => ({ ...fe, name: undefined }));
                  }}
                />
                <FieldError message={fieldErrors.name} />
              </div>

              <div className="flex items-center gap-2">
                <span className="text-lg font-black text-slate-900">Rs</span>
                <input
                  type="number"
                  min="0"
                  className="w-24 bg-transparent border-none focus:outline-none focus:ring-0 text-lg font-black text-slate-900 placeholder:text-slate-200 p-0"
                  placeholder="0"
                  value={form.price}
                  onChange={e => setForm(p => ({ ...p, price: e.target.value }))}
                />
                <span className="text-xs text-slate-400 font-bold">{t('(optional)', '(اختیاری)')}</span>
              </div>

              <div>
                <textarea
                  dir="ltr"
                  className="w-full bg-transparent border-none focus:outline-none focus:ring-0 resize-none min-h-[70px] text-slate-500 font-medium placeholder:text-slate-300 p-0"
                  placeholder={t('Write the design description...', 'ڈیزائن کے بارے میں تفصیل لکھیں...')}
                  value={form.description}
                  onChange={e => {
                    setForm(p => ({ ...p, description: e.target.value }));
                    if (fieldErrors.description) setFieldErrors(fe => ({ ...fe, description: undefined }));
                  }}
                />
                <FieldError message={fieldErrors.description} />
              </div>

              <button
                type="button"
                onClick={() => setForm(p => ({ ...p, isFeatured: !p.isFeatured }))}
                className={`inline-flex items-center gap-2 px-4 py-2 text-sm rounded-full font-black transition-all border-2 ${
                  form.isFeatured
                    ? 'bg-amber-400 text-white border-amber-400 shadow-lg shadow-amber-100'
                    : 'bg-white text-slate-500 border-slate-200 hover:border-amber-300'
                }`}
              >
                <Star size={16} fill={form.isFeatured ? 'currentColor' : 'none'} />
                {form.isFeatured ? t('Marked as Featured', 'نمایاں کر دیا گیا') : t('Mark as Featured', 'نمایاں کریں')}
              </button>

              {error && (
                <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm font-bold border border-red-100">
                  ⚠ {error}
                </div>
              )}

              {/* Buttons — layout/classes unchanged from before, just moved
                  into this column. */}
              <div className="flex gap-3 sm:gap-4 pt-2">
                <button onClick={handleSave} disabled={saving} className="primary-btn px-6 py-3 text-sm sm:px-8 sm:py-3.5 sm:text-base lg:px-10 lg:py-4 rounded-xl flex items-center gap-2 disabled:opacity-60">
                  {saving ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
                  {editingId ? t('Update', 'اپڈیٹ کریں') : t('Save', 'محفوظ کریں')}
                </button>
                <button onClick={closeForm} className="px-6 py-3 text-sm sm:px-8 sm:py-3.5 sm:text-base lg:px-10 lg:py-4 rounded-xl bg-slate-100 text-slate-600 font-bold hover:bg-slate-200 transition-all">{t('Cancel', 'منسوخ کریں')}</button>
              </div>
            </div>

            {/* Right — image showcase */}
            <div className="order-1 lg:order-2">
              <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3">
                {editingId ? t('Edit Design', 'ترمیم کریں') : t('New Design', 'نیا ڈیزائن')} · {t('Design Images', 'تصاویر')} *
              </h2>
              <input ref={fileInputRef} type="file" accept="image/*" multiple onChange={handleFileChange} className="hidden" />

              <div className="relative rounded-[2rem] bg-gradient-to-b from-slate-100 to-slate-200/60 overflow-hidden aspect-square flex items-center justify-center">
                <div className="absolute inset-0 rounded-full bg-white/40 scale-75 top-1/4" />
                {imageItems.length > 0 ? (
                  <img src={imageItems[0].previewUrl} alt="Design" className="relative w-full h-full object-contain p-8" />
                ) : (
                  <div className="relative flex flex-col items-center gap-2 text-slate-400">
                    <ImagePlus size={40} />
                    <span className="font-bold text-xs">{t('No images added yet', 'ابھی تک کوئی تصویر شامل نہیں کی گئی')}</span>
                  </div>
                )}
              </div>

              {imageItems.length > 0 && (
                <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 mt-3">
                  {imageItems.map((item) => (
                    <div key={item.id} className="relative group rounded-lg overflow-hidden border-2 border-slate-100 aspect-square">
                      <img src={item.previewUrl} alt="Design" className="w-full h-full object-cover" />
                      {item.kind === 'url' && (
                        <span className="absolute bottom-1 left-1 p-1 bg-black/50 rounded-lg text-white">
                          <Link2 size={9} />
                        </span>
                      )}
                      <button
                        onClick={() => removeImageItem(item.id)}
                        className="absolute top-1 right-1 p-1 bg-white/90 hover:bg-white text-red-500 rounded-lg shadow"
                      >
                        <X size={10} />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div className="space-y-2 mt-3">
                {showUrlInput && (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      className="input-field flex-1"
                      placeholder={t('https://... paste image URL', 'https://... تصویر کا لنک پیسٹ کریں')}
                      value={urlInput}
                      onChange={(e) => setUrlInput(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddUrl(); } if (e.key === 'Escape') { setShowUrlInput(false); setUrlInput(''); } }}
                      autoFocus
                    />
                    <button
                      type="button"
                      onClick={handleAddUrl}
                      className="px-5 rounded-xl bg-primary text-white font-black text-sm hover:bg-primary-dark transition-all whitespace-nowrap"
                    >
                      Add
                    </button>
                    <button
                      type="button"
                      onClick={() => { setShowUrlInput(false); setUrlInput(''); }}
                      aria-label="Cancel adding via URL"
                      className="px-4 rounded-xl border-2 border-slate-200 text-slate-400 hover:text-red-500 hover:border-red-300 hover:bg-red-50 transition-all flex-shrink-0"
                    >
                      <X size={18} />
                    </button>
                  </div>
                )}
                <div className="grid grid-cols-2 gap-1.5 sm:gap-2">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="py-2.5 sm:py-3 px-1 rounded-xl border-2 border-dashed border-slate-300 hover:border-primary hover:bg-primary/5 transition-all flex items-center justify-center gap-1 sm:gap-2 text-slate-400 hover:text-primary font-bold text-[11px] sm:text-sm whitespace-nowrap"
                  >
                    <Upload size={14} className="sm:hidden flex-shrink-0" /><Upload size={16} className="hidden sm:block flex-shrink-0" /> Upload File
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowUrlInput(p => !p)}
                    className={`py-2.5 sm:py-3 px-1 rounded-xl border-2 border-dashed transition-all flex items-center justify-center gap-1 sm:gap-2 font-bold text-[11px] sm:text-sm whitespace-nowrap ${showUrlInput ? 'border-primary bg-primary/5 text-primary' : 'border-slate-300 hover:border-primary hover:bg-primary/5 text-slate-400 hover:text-primary'}`}
                  >
                    <Link2 size={14} className="sm:hidden flex-shrink-0" /><Link2 size={16} className="hidden sm:block flex-shrink-0" /> Add via URL
                  </button>
                </div>
              </div>
              <FieldError message={fieldErrors.image} />
            </div>
          </div>
        </div>
      )}

      {/* Search + Filters */}
      {!showForm && designs.length > 0 && (
        <div id="catalog" className="glass-card p-4 sm:p-6 rounded-xl flex flex-col md:flex-row md:items-center gap-3 sm:gap-4 min-w-0">
          <div className="flex items-stretch border border-slate-200 rounded-xl overflow-hidden bg-white/50 flex-1">
            <div className="flex items-center justify-center px-3 sm:px-4 bg-slate-100/80 border-r border-slate-200">
              <Search size={16} className="text-slate-400 sm:hidden" /><Search size={18} className="text-slate-400 hidden sm:block" />
            </div>
            <input
              type="text"
              placeholder={t('Search design name...', 'ڈیزائن کا نام تلاش کریں...')}
              className="flex-1 min-w-0 px-3 py-2.5 sm:px-4 sm:py-3 text-sm sm:text-base bg-transparent outline-none text-slate-700 placeholder:text-slate-400"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto scrollbar-hide -mx-1 px-1 min-w-0">
            <button
              onClick={() => setCategoryFilter('All')}
              className={`flex-shrink-0 px-2.5 py-1.5 sm:px-4 sm:py-2 rounded-xl text-[10px] sm:text-xs font-black uppercase tracking-wider transition-all whitespace-nowrap ${categoryFilter === 'All' ? 'bg-primary text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
            >
              {t('All', 'تمام')}
            </button>
            {DESIGN_CATEGORIES.map(c => {
              const [en, ur] = c.split(' / ');
              return (
                <button
                  key={c}
                  onClick={() => setCategoryFilter(c)}
                  className={`flex-shrink-0 px-2.5 py-1.5 sm:px-4 sm:py-2 rounded-xl text-[10px] sm:text-xs font-black uppercase tracking-wider transition-all whitespace-nowrap ${categoryFilter === c ? 'bg-primary text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
                >
                  {t(en, ur || en)}
                </button>
              );
            })}
            <button
              onClick={() => setFeaturedOnly(p => !p)}
              className={`flex-shrink-0 flex items-center gap-1 sm:gap-1.5 px-2.5 py-1.5 sm:px-4 sm:py-2 rounded-xl text-[10px] sm:text-xs font-black uppercase tracking-wider transition-all whitespace-nowrap ${featuredOnly ? 'bg-amber-400 text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
            >
              <Star size={12} className="sm:hidden" fill={featuredOnly ? 'currentColor' : 'none'} /><Star size={14} className="hidden sm:block" fill={featuredOnly ? 'currentColor' : 'none'} /> {t('Featured', 'نمایاں')}
            </button>
          </div>
        </div>
      )}

      {/* Designs Grid */}
      {designs.length === 0 ? (
        <div className="glass-card p-20 rounded-xl text-center">
          <Palette size={48} className="mx-auto mb-4 text-slate-300" />
          <h3 className="text-3xl font-black text-slate-400 uppercase tracking-tighter">{t('No designs yet', 'ابھی کوئی ڈیزائن نہیں')}</h3>
          <p className="text-slate-400 font-medium mt-2">{t('Use the Add Design button to upload your first design', 'Add Design بٹن سے پہلا ڈیزائن اپلوڈ کریں')}</p>
        </div>
      ) : filteredDesigns.length === 0 ? (
        <div className="glass-card p-16 rounded-xl text-center">
          <Search size={40} className="mx-auto mb-4 text-slate-300" />
          <h3 className="text-2xl font-black text-slate-400 uppercase tracking-tighter">{t('No matching designs', 'کوئی مماثل ڈیزائن نہیں')}</h3>
          <p className="text-slate-400 font-medium mt-2">{t('Try changing your search or filters', 'تلاش یا فلٹرز تبدیل کر کے دوبارہ کوشش کریں')}</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-3 gap-2 sm:gap-3 lg:gap-4">
            {pagedDesigns.map((d, i) => (
              <motion.div
                key={d._id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: i * 0.04, ease: 'easeOut' }}
                onClick={() => setViewingDesign(d)}
                className="glass-card rounded-xl sm:rounded-2xl overflow-hidden group cursor-pointer hover:shadow-xl hover:shadow-primary/10 hover:-translate-y-0.5 transition-all p-2 sm:p-4 flex flex-col items-center text-center"
              >
                <div className="relative w-14 h-14 sm:w-28 sm:h-28 lg:w-32 lg:h-32 flex-shrink-0">
                  <div className="w-full h-full rounded-lg sm:rounded-2xl overflow-hidden bg-white border border-slate-100">
                    <DesignThumb src={d.images?.[0]?.url} alt={d.name} className="w-full h-full object-cover object-center" iconSize={22} />
                  </div>
                  {d.images?.length > 1 && (
                    <span className="absolute bottom-0.5 left-0.5 sm:bottom-1.5 sm:left-1.5 px-1 py-0.5 sm:px-2 sm:py-0.5 rounded-full text-[7px] sm:text-[10px] font-black bg-black/50 text-white backdrop-blur-sm">
                      +{d.images.length - 1} {t('more', 'مزید')}
                    </span>
                  )}
                  {d.isFeatured && (
                    <span className="absolute top-0.5 left-0.5 sm:top-1.5 sm:left-1.5 flex items-center gap-0.5 sm:gap-1 px-1 py-0.5 sm:px-2 sm:py-0.5 rounded-full text-[7px] sm:text-[10px] font-black bg-amber-400 text-white">
                      <Star size={8} className="sm:hidden" fill="currentColor" /><Star size={10} className="hidden sm:block" fill="currentColor" /> <span className="hidden sm:inline">{t('Featured', 'نمایاں')}</span>
                    </span>
                  )}
                </div>
                <div className="w-full mt-1 sm:mt-3 space-y-0.5 sm:space-y-1">
                  <div className="flex flex-col sm:flex-row items-center justify-center gap-0 sm:gap-2">
                    <h3
                      dir={language === 'ur' && d.nameUrdu ? 'rtl' : 'ltr'}
                      className="text-[9px] sm:text-sm font-black text-slate-800 uppercase truncate w-full"
                    >
                      {language === 'ur' && d.nameUrdu
                        ? d.nameUrdu
                        : <HighlightedName name={d.name} term={searchTerm} />}
                    </h3>
                    {d.price !== null && d.price !== undefined && (
                      <span className="text-primary font-black text-[8px] sm:text-xs whitespace-nowrap">Rs {d.price}</span>
                    )}
                  </div>
                  <div className="flex justify-center">
                    <span className="inline-block px-1 py-0.5 sm:px-2 sm:py-0.5 rounded-full text-[6px] sm:text-[9px] font-black uppercase tracking-widest bg-indigo-100 text-indigo-600 truncate max-w-full">
                      {(() => { const [en, ur] = (d.category || '').split(' / '); return t(en, ur || en); })()}
                    </span>
                  </div>
                  {d.description && (
                    <p
                      dir={language === 'ur' && d.descriptionUrdu ? 'rtl' : 'ltr'}
                      className="hidden sm:block text-slate-500 text-xs font-medium line-clamp-2 pt-1"
                    >
                      {language === 'ur' && d.descriptionUrdu ? d.descriptionUrdu : d.description}
                    </p>
                  )}
                </div>
              </motion.div>
            ))}
          </div>

          <PaginationControls
            label={t('Page', 'صفحہ')}
            currentPage={safeDesignPage}
            totalPages={totalDesignPages}
            onPrev={() => setDesignPage(p => Math.max(1, p - 1))}
            onNext={() => setDesignPage(p => Math.min(totalDesignPages, p + 1))}
            className="mt-6"
          />
        </>
      )}

      {viewingDesign && (
        <DesignDetailModal
          design={viewingDesign}
          relatedDesigns={relatedDesigns}
          onSelectRelated={(d) => setViewingDesign(d)}
          onClose={() => setViewingDesign(null)}
          onEdit={(d) => { setViewingDesign(null); openEdit(d); }}
          onDelete={async (d) => { const ok = await handleDelete(d._id); if (ok) setViewingDesign(null); }}
          deleting={deletingId === viewingDesign._id}
        />
      )}
    </div>
  );
};

export default Designs;
