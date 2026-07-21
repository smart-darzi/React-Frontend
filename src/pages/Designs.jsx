import React, { useState, useRef, useMemo, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useLocalState } from '../context/useLocalState';
import { DESIGN_CATEGORIES } from '../utils/designCategories';
import { Palette, Plus, Pencil, Trash2, Loader2, Save, ImagePlus, X, Search, Star, Link2, Upload, Keyboard, ChevronLeft, ChevronRight } from 'lucide-react';
import { matchesNameSearch, sortByNameMatch, highlightNameMatch } from '../utils/nameSearch';
import DesignDetailModal from '../components/DesignDetailModal';
import UrduKeyboard from '../components/UrduKeyboard';
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

const EMPTY = { name: '', nameUrdu: '', description: '', category: DESIGN_CATEGORIES[0], price: '', isFeatured: false };

// Small inline error line shown directly under a field, instead of one
// generic error banner at the bottom of the form.
const FieldError = ({ message }) => {
  if (!message) return null;
  return <p className="text-red-500 text-xs font-bold mt-1">⚠ {message}</p>;
};

const Designs = () => {
  const { designs, loading, addDesign, updateDesign, deleteDesign } = useLocalState();
  const { t, language } = useLanguage();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY);
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
  const urduInputRef = useRef(null);
  const descriptionInputRef = useRef(null);
  // ✅ Kayi devices (phone/laptop) mein pehle se hi Urdu keyboard/IME hota
  // hai — un logon ke liye on-screen keyboard zabardasti khulna nahi
  // chahiye. Isliye yeh sirf tab khulta hai jab user khud "Show Keyboard"
  // dabaye, aur uska choice (on/off) localStorage mein yaad rakha jata hai
  // taake agli baar bhi wahi tarjeeh chale — kabhi khud-b-khud focus par
  // pop-up nahi hota.
  const [showUrduKeyboard, setShowUrduKeyboard] = useState(() => {
    try { return localStorage.getItem('smartmaster_urdu_keyboard') === 'on'; } catch { return false; }
  });
  const toggleUrduKeyboard = (next) => {
    setShowUrduKeyboard(next);
    try { localStorage.setItem('smartmaster_urdu_keyboard', next ? 'on' : 'off'); } catch { /* ignore */ }
  };
  // Same idea, but for the Description field — it's just as often written
  // in Urdu as the Urdu Name field, so it gets its own on-screen keyboard
  // toggle too (kept as a separate flag since the two fields can be shown
  // independently of each other).
  const [showDescKeyboard, setShowDescKeyboard] = useState(() => {
    try { return localStorage.getItem('smartmaster_desc_keyboard') === 'on'; } catch { return false; }
  });
  const toggleDescKeyboard = (next) => {
    setShowDescKeyboard(next);
    try { localStorage.setItem('smartmaster_desc_keyboard', next ? 'on' : 'off'); } catch { /* ignore */ }
  };
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

  // Shown 3 at a time (one row) instead of the whole catalog at once —
  // Prev/Next below the grid pages through the rest.
  const DESIGN_PAGE_SIZE = 3;
  const [designPage, setDesignPage] = useState(1);
  useEffect(() => { setDesignPage(1); }, [searchTerm, categoryFilter, featuredOnly]);
  const totalDesignPages = Math.max(1, Math.ceil(filteredDesigns.length / DESIGN_PAGE_SIZE));
  const safeDesignPage = Math.min(designPage, totalDesignPages);
  const pagedDesigns = filteredDesigns.slice((safeDesignPage - 1) * DESIGN_PAGE_SIZE, safeDesignPage * DESIGN_PAGE_SIZE);

  // ── On-screen Urdu keyboard helpers ──
  // Inserts a character at the current cursor position of the Urdu Name
  // field (falls back to appending at the end), then puts focus/cursor
  // right back so multiple clicks type in the correct order.
  const insertAtCursor = (text) => {
    const el = urduInputRef.current;
    const start = el?.selectionStart ?? form.nameUrdu.length;
    const end = el?.selectionEnd ?? form.nameUrdu.length;
    const next = form.nameUrdu.slice(0, start) + text + form.nameUrdu.slice(end);
    setForm(p => ({ ...p, nameUrdu: next }));
    requestAnimationFrame(() => {
      if (el) {
        const pos = start + text.length;
        el.focus();
        el.setSelectionRange(pos, pos);
      }
    });
  };
  const backspaceAtCursor = () => {
    const el = urduInputRef.current;
    const start = el?.selectionStart ?? form.nameUrdu.length;
    const end = el?.selectionEnd ?? form.nameUrdu.length;
    const hasSelection = start !== end;
    const from = hasSelection ? start : Math.max(0, start - 1);
    const next = form.nameUrdu.slice(0, from) + form.nameUrdu.slice(end);
    setForm(p => ({ ...p, nameUrdu: next }));
    requestAnimationFrame(() => {
      if (el) { el.focus(); el.setSelectionRange(from, from); }
    });
  };

  // Same two helpers, targeting the Description textarea instead.
  const insertAtCursorDesc = (text) => {
    const el = descriptionInputRef.current;
    const start = el?.selectionStart ?? form.description.length;
    const end = el?.selectionEnd ?? form.description.length;
    const next = form.description.slice(0, start) + text + form.description.slice(end);
    setForm(p => ({ ...p, description: next }));
    requestAnimationFrame(() => {
      if (el) {
        const pos = start + text.length;
        el.focus();
        el.setSelectionRange(pos, pos);
      }
    });
  };
  const backspaceAtCursorDesc = () => {
    const el = descriptionInputRef.current;
    const start = el?.selectionStart ?? form.description.length;
    const end = el?.selectionEnd ?? form.description.length;
    const hasSelection = start !== end;
    const from = hasSelection ? start : Math.max(0, start - 1);
    const next = form.description.slice(0, from) + form.description.slice(end);
    setForm(p => ({ ...p, description: next }));
    requestAnimationFrame(() => {
      if (el) { el.focus(); el.setSelectionRange(from, from); }
    });
  };

  const openAdd = () => {
    setEditingId(null);
    setForm(EMPTY);
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
      nameUrdu: d.nameUrdu || '',
      description: d.description || '',
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
    setForm(EMPTY);
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
      setFieldErrors(fe => ({ ...fe, image: 'Sirf image files select karein / Please select image files only' }));
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
      setFieldErrors(fe => ({ ...fe, image: 'Sahi image URL likhein (http:// ya https:// se shuru) / Enter a valid image URL' }));
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
    if (!form.name.trim()) errors.name = 'Design ka naam zaroori hai / Name is required';
    if (!form.description.trim()) errors.description = 'Description zaroori hai / Description is required';
    if (imageItems.length === 0) errors.image = 'Kam az kam ek tasveer zaroori hai / At least one image is required';
    if (Object.keys(errors).length > 0) { setFieldErrors(errors); return; }

    setFieldErrors({});
    setSaving(true); setError('');
    try {
      const payload = {
        name: form.name,
        nameUrdu: form.nameUrdu,
        description: form.description,
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
    if (!window.confirm('Is design ko delete karein?')) return;
    setDeletingId(id);
    try { await deleteDesign(id); } catch { alert('Failed to delete design.'); } finally { setDeletingId(null); }
  };

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
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
      >
        <div className="min-w-0">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-800 tracking-tighter uppercase flex items-center gap-3 sm:gap-4">
            <div className="bg-primary p-2.5 sm:p-3 rounded-2xl text-white shadow-lg flex-shrink-0"><Palette size={24} className="sm:hidden" /><Palette size={32} className="hidden sm:block" /></div>
            <span className="truncate">{t('Designs', 'ڈیزائنز')}</span>
          </h1>
          <p className="text-slate-500 mt-2 font-medium text-sm sm:text-lg ml-[52px] sm:ml-16">
            {t(`${designs.length} design${designs.length === 1 ? '' : 's'} in catalog`, `کیٹلاگ میں ${designs.length} ڈیزائنز`)}
          </p>
        </div>
        {!showForm && (
          <button onClick={openAdd} className="primary-btn w-full sm:w-auto px-8 py-4 rounded-2xl flex items-center justify-center gap-3 shadow-xl shadow-primary/20 whitespace-nowrap">
            <Plus size={22} /> {t('Add Design', 'نیا ڈیزائن')}
          </button>
        )}
      </motion.header>

      {/* Add/Edit Form */}
      {showForm && (
        <div className="glass-card p-6 sm:p-8 lg:p-10 rounded-[2rem] sm:rounded-[2.5rem] lg:rounded-[3rem] space-y-6">
          <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tighter">
            {editingId ? t('Edit Design', 'ترمیم کریں') : t('New Design', 'نیا ڈیزائن')}
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Image picker */}
            <div className="space-y-2">
              <label className="text-xs font-black text-slate-400 uppercase tracking-widest">{t('Design Images', 'تصاویر')} *</label>
              <input ref={fileInputRef} type="file" accept="image/*" multiple onChange={handleFileChange} className="hidden" />

              {imageItems.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {imageItems.map((item) => (
                    <div key={item.id} className="relative group rounded-2xl overflow-hidden border-2 border-slate-100 aspect-square">
                      <img src={item.previewUrl} alt="Design" className="w-full h-full object-cover" />
                      {item.kind === 'url' && (
                        <span className="absolute bottom-1.5 left-1.5 p-1 bg-black/50 rounded-md text-white">
                          <Link2 size={10} />
                        </span>
                      )}
                      <button
                        onClick={() => removeImageItem(item.id)}
                        className="absolute top-1.5 right-1.5 p-1.5 bg-white/90 hover:bg-white text-red-500 rounded-lg shadow"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {imageItems.length === 0 && (
                <div className="w-full py-10 rounded-2xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center gap-1.5 text-slate-300">
                  <ImagePlus size={28} />
                  <span className="font-bold text-xs text-slate-400">Koi tasveer add nahi hui abhi tak</span>
                </div>
              )}

              {/* Two explicit ways to add an image: pick a file, or paste a
                  URL — both append to the grid above rather than replacing
                  it, and both are available from the very first image. */}
              <div className="space-y-2">
                {showUrlInput && (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      className="input-field flex-1"
                      placeholder="https://... image URL paste karein"
                      value={urlInput}
                      onChange={(e) => setUrlInput(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddUrl(); } if (e.key === 'Escape') { setShowUrlInput(false); setUrlInput(''); } }}
                      autoFocus
                    />
                    <button
                      type="button"
                      onClick={handleAddUrl}
                      className="px-5 rounded-2xl bg-primary text-white font-black text-sm hover:bg-primary-dark transition-all whitespace-nowrap"
                    >
                      Add
                    </button>
                    <button
                      type="button"
                      onClick={() => { setShowUrlInput(false); setUrlInput(''); }}
                      aria-label="Cancel adding via URL"
                      className="px-4 rounded-2xl border-2 border-slate-200 text-slate-400 hover:text-red-500 hover:border-red-300 hover:bg-red-50 transition-all flex-shrink-0"
                    >
                      <X size={18} />
                    </button>
                  </div>
                )}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="py-3 rounded-2xl border-2 border-dashed border-slate-300 hover:border-primary hover:bg-primary/5 transition-all flex items-center justify-center gap-2 text-slate-400 hover:text-primary font-bold text-sm"
                  >
                    <Upload size={16} /> Upload File
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowUrlInput(p => !p)}
                    className={`py-3 rounded-2xl border-2 border-dashed transition-all flex items-center justify-center gap-2 font-bold text-sm ${showUrlInput ? 'border-primary bg-primary/5 text-primary' : 'border-slate-300 hover:border-primary hover:bg-primary/5 text-slate-400 hover:text-primary'}`}
                  >
                    <Link2 size={16} /> Add via URL
                  </button>
                </div>
              </div>
              <FieldError message={fieldErrors.image} />
            </div>

            {/* Name + description + category + price + featured */}
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-xs font-black text-slate-400 uppercase tracking-widest">{t('Name', 'نام')} *</label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="Design ka naam..."
                  value={form.name}
                  onChange={e => {
                    setForm(p => ({ ...p, name: e.target.value }));
                    if (fieldErrors.name) setFieldErrors(fe => ({ ...fe, name: undefined }));
                  }}
                />
                <FieldError message={fieldErrors.name} />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest">{t('Urdu Name (optional)', 'اردو نام (اختیاری)')}</label>
                  <button
                    type="button"
                    onClick={() => toggleUrduKeyboard(!showUrduKeyboard)}
                    className={`flex items-center gap-1.5 text-[10px] font-black uppercase px-3 py-1.5 rounded-lg transition-all ${
                      showUrduKeyboard ? 'bg-primary text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                    }`}
                  >
                    <Keyboard size={13} /> {showUrduKeyboard ? 'Hide' : 'Show'} Keyboard
                  </button>
                </div>
                {/* Agar aapke device mein pehle se Urdu keyboard/IME hai to
                    seedha yahan type karein — neeche wala on-screen keyboard
                    bilkul optional hai, khud khulta nahi. */}
                <input
                  ref={urduInputRef}
                  type="text"
                  dir="rtl"
                  lang="ur"
                  className="input-field text-right font-medium"
                  placeholder="ڈیزائن کا اردو نام لکھیں یا اپنے کی بورڈ سے ٹائپ کریں..."
                  value={form.nameUrdu}
                  onChange={e => setForm(p => ({ ...p, nameUrdu: e.target.value }))}
                />
                <p className="text-[11px] text-slate-400 font-medium">
                  Apne device ka Urdu keyboard use kar sakte hain, ya "Show Keyboard" dabayein.
                </p>
                {showUrduKeyboard && (
                  <UrduKeyboard
                    value={form.nameUrdu}
                    onKey={insertAtCursor}
                    onBackspace={backspaceAtCursor}
                    onSpace={() => insertAtCursor(' ')}
                    onClose={() => setShowUrduKeyboard(false)}
                    onDone={() => setShowUrduKeyboard(false)}
                  />
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest">{t('Category', 'کیٹگری')}</label>
                  <select
                    className="input-field appearance-none cursor-pointer"
                    value={form.category}
                    onChange={e => setForm(p => ({ ...p, category: e.target.value }))}
                  >
                    {DESIGN_CATEGORIES.map(c => { const [cEn, cUr] = c.split(' / '); return <option key={c} value={c}>{t(cEn, cUr || cEn)}</option>; })}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest">{t('Price (optional)', 'قیمت (اختیاری)')}</label>
                  <input
                    type="number"
                    min="0"
                    className="input-field"
                    placeholder="e.g. 3500"
                    value={form.price}
                    onChange={e => setForm(p => ({ ...p, price: e.target.value }))}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest">{t('Description', 'تفصیل')} *</label>
                  <button
                    type="button"
                    onClick={() => toggleDescKeyboard(!showDescKeyboard)}
                    className={`flex items-center gap-1.5 text-[10px] font-black uppercase px-3 py-1.5 rounded-lg transition-all ${
                      showDescKeyboard ? 'bg-primary text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                    }`}
                  >
                    <Keyboard size={13} /> {showDescKeyboard ? 'Hide' : 'Show'} Keyboard
                  </button>
                </div>
                <textarea
                  ref={descriptionInputRef}
                  dir="ltr"
                  className="input-field min-h-[100px] resize-none"
                  placeholder="Design ke baare mein tafseel likhein..."
                  value={form.description}
                  onChange={e => {
                    setForm(p => ({ ...p, description: e.target.value }));
                    if (fieldErrors.description) setFieldErrors(fe => ({ ...fe, description: undefined }));
                  }}
                />
                <FieldError message={fieldErrors.description} />
                <p className="text-[11px] text-slate-400 font-medium">
                  Apne device ka Urdu keyboard use kar sakte hain, ya "Show Keyboard" dabayein.
                </p>
                {showDescKeyboard && (
                  <UrduKeyboard
                    value={form.description}
                    onKey={insertAtCursorDesc}
                    onBackspace={backspaceAtCursorDesc}
                    onSpace={() => insertAtCursorDesc(' ')}
                    onClose={() => setShowDescKeyboard(false)}
                    onDone={() => setShowDescKeyboard(false)}
                  />
                )}
              </div>

              <button
                type="button"
                onClick={() => setForm(p => ({ ...p, isFeatured: !p.isFeatured }))}
                className={`w-full flex items-center justify-center gap-2 py-3 rounded-2xl font-black transition-all border-2 ${
                  form.isFeatured
                    ? 'bg-amber-400 text-white border-amber-400 shadow-lg shadow-amber-100'
                    : 'bg-white text-slate-500 border-slate-200 hover:border-amber-300'
                }`}
              >
                <Star size={18} fill={form.isFeatured ? 'currentColor' : 'none'} />
                {form.isFeatured ? t('Marked as Featured', 'نمایاں کر دیا گیا') : t('Mark as Featured', 'نمایاں کریں')}
              </button>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 text-red-600 p-4 rounded-2xl text-sm font-bold border border-red-100">
              ⚠ {error}
            </div>
          )}

          <div className="flex gap-4">
            <button onClick={handleSave} disabled={saving} className="primary-btn px-10 py-4 rounded-2xl flex items-center gap-2 disabled:opacity-60">
              {saving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
              {editingId ? t('Update', 'اپڈیٹ کریں') : t('Save', 'محفوظ کریں')}
            </button>
            <button onClick={closeForm} className="px-10 py-4 rounded-2xl bg-slate-100 text-slate-600 font-bold hover:bg-slate-200 transition-all">{t('Cancel', 'منسوخ کریں')}</button>
          </div>
        </div>
      )}

      {/* Search + Filters */}
      {!showForm && designs.length > 0 && (
        <div className="glass-card p-6 rounded-[2.5rem] flex flex-col md:flex-row md:items-center gap-4">
          <div className="flex items-stretch border border-slate-200 rounded-2xl overflow-hidden bg-white/50 flex-1">
            <div className="flex items-center justify-center px-4 bg-slate-100/80 border-r border-slate-200">
              <Search size={18} className="text-slate-400" />
            </div>
            <input
              type="text"
              placeholder={t('Design ka naam search karein...', 'ڈیزائن کا نام تلاش کریں...')}
              className="flex-1 px-4 py-3 bg-transparent outline-none text-slate-700 placeholder:text-slate-400"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setCategoryFilter('All')}
              className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${categoryFilter === 'All' ? 'bg-primary text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
            >
              {t('All', 'تمام')}
            </button>
            {DESIGN_CATEGORIES.map(c => {
              const [en, ur] = c.split(' / ');
              return (
                <button
                  key={c}
                  onClick={() => setCategoryFilter(c)}
                  className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all whitespace-nowrap ${categoryFilter === c ? 'bg-primary text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
                >
                  {t(en, ur || en)}
                </button>
              );
            })}
            <button
              onClick={() => setFeaturedOnly(p => !p)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${featuredOnly ? 'bg-amber-400 text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
            >
              <Star size={14} fill={featuredOnly ? 'currentColor' : 'none'} /> {t('Featured', 'نمایاں')}
            </button>
          </div>
        </div>
      )}

      {/* Designs Grid */}
      {designs.length === 0 ? (
        <div className="glass-card p-20 rounded-[3rem] text-center">
          <Palette size={48} className="mx-auto mb-4 text-slate-300" />
          <h3 className="text-3xl font-black text-slate-400 uppercase tracking-tighter">{t('No designs yet', 'ابھی کوئی ڈیزائن نہیں')}</h3>
          <p className="text-slate-400 font-medium mt-2">{t('Add Design button se pehla design upload karein', 'Add Design بٹن سے پہلا ڈیزائن اپلوڈ کریں')}</p>
        </div>
      ) : filteredDesigns.length === 0 ? (
        <div className="glass-card p-16 rounded-[3rem] text-center">
          <Search size={40} className="mx-auto mb-4 text-slate-300" />
          <h3 className="text-2xl font-black text-slate-400 uppercase tracking-tighter">{t('No matching designs', 'کوئی مماثل ڈیزائن نہیں')}</h3>
          <p className="text-slate-400 font-medium mt-2">{t('Search ya filters badal kar dobara koshish karein', 'تلاش یا فلٹرز تبدیل کر کے دوبارہ کوشش کریں')}</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {pagedDesigns.map((d, i) => (
              <motion.div
                key={d._id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: i * 0.04, ease: 'easeOut' }}
                onClick={() => setViewingDesign(d)}
                className="glass-card rounded-[2.5rem] overflow-hidden group cursor-pointer hover:shadow-xl hover:shadow-primary/10 hover:-translate-y-0.5 transition-all"
              >
                <div className="relative">
                  <img src={d.images?.[0]?.url} alt={d.name} className="w-full h-56 object-contain bg-slate-50" />
                  {d.images?.length > 1 && (
                    <span className="absolute bottom-3 left-3 px-3 py-1 rounded-full text-xs font-black bg-black/50 text-white backdrop-blur-sm">
                      +{d.images.length - 1} {t('more', 'مزید')}
                    </span>
                  )}
                  {d.isFeatured && (
                    <span className="absolute top-3 left-3 flex items-center gap-1 px-3 py-1 rounded-full text-xs font-black bg-amber-400 text-white">
                      <Star size={12} fill="currentColor" /> {t('Featured', 'نمایاں')}
                    </span>
                  )}
                  <div className="absolute top-3 right-3 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-all">
                    <button onClick={(e) => { e.stopPropagation(); openEdit(d); }} className="p-3 bg-white/90 text-blue-500 rounded-xl hover:bg-blue-500 hover:text-white transition-all shadow-lg"><Pencil size={16} /></button>
                    <button onClick={(e) => { e.stopPropagation(); handleDelete(d._id); }} disabled={deletingId === d._id} className="p-3 bg-white/90 text-red-400 rounded-xl hover:bg-red-500 hover:text-white transition-all shadow-lg disabled:opacity-40">
                      {deletingId === d._id ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                    </button>
                  </div>
                </div>
                <div className="p-6 space-y-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <h3
                      dir={language === 'ur' && d.nameUrdu ? 'rtl' : 'ltr'}
                      className="text-lg font-black text-slate-800 uppercase truncate"
                    >
                      {language === 'ur' && d.nameUrdu
                        ? d.nameUrdu
                        : <HighlightedName name={d.name} term={searchTerm} />}
                    </h3>
                    {d.price !== null && d.price !== undefined && (
                      <span className="text-primary font-black text-sm whitespace-nowrap">Rs {d.price}</span>
                    )}
                  </div>
                  <span className="inline-block px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-indigo-100 text-indigo-600">
                    {(() => { const [en, ur] = (d.category || '').split(' / '); return t(en, ur || en); })()}
                  </span>
                  {d.description && <p className="text-slate-500 text-sm font-medium line-clamp-2 pt-1">{d.description}</p>}
                </div>
              </motion.div>
            ))}
          </div>

          {filteredDesigns.length > DESIGN_PAGE_SIZE && (
            <div className="flex items-center justify-center gap-4">
              <button
                onClick={() => setDesignPage(p => Math.max(1, p - 1))}
                disabled={safeDesignPage === 1}
                className="w-10 h-10 rounded-xl flex items-center justify-center bg-white border border-slate-200 text-slate-600 shadow-sm hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft size={18} />
              </button>
              <span className="text-sm font-bold text-slate-500">
                {t('Page', 'صفحہ')} {safeDesignPage} / {totalDesignPages}
              </span>
              <button
                onClick={() => setDesignPage(p => Math.min(totalDesignPages, p + 1))}
                disabled={safeDesignPage === totalDesignPages}
                className="w-10 h-10 rounded-xl flex items-center justify-center bg-white border border-slate-200 text-slate-600 shadow-sm hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          )}
        </>
      )}

      {viewingDesign && (
        <DesignDetailModal
          design={viewingDesign}
          onClose={() => setViewingDesign(null)}
        />
      )}
    </div>
  );
};

export default Designs;
