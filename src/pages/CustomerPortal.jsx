import React, { useState, useMemo, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useLocalState } from '../context/useLocalState';
import { useLanguage } from '../context/LanguageContext';
import { getCustomerStatus } from '../utils/stages';
import { DESIGN_CATEGORIES } from '../utils/designCategories';
import DesignDetailModal from '../components/DesignDetailModal';
import DesignThumb from '../components/DesignThumb';
import PaginationControls from '../components/PaginationControls';
import PortalFooter from '../components/PortalFooter';
import { matchesNameSearch, sortByNameMatch } from '../utils/nameSearch';
import HighlightedName from '../components/HighlightedName';
import {
  User, LogOut, Scissors, Phone, Mail, Home, Search, ClipboardList,
  Palette, Star, Hash, Calendar, PackageCheck, Copy, Check, Loader2, Maximize2,
} from 'lucide-react';

// A short colored tick before each section title — a small, consistent
// wayfinding device, rather than a plain <h2> blending into the page.
const SectionHeading = ({ children, eyebrow }) => (
  <div className="mb-5">
    {eyebrow && <p className="text-[11px] font-bold text-primary/70 uppercase tracking-[0.2em] mb-1">{eyebrow}</p>}
    <div className="flex items-center gap-2.5">
      <span className="w-1.5 h-6 rounded-full bg-primary flex-shrink-0" />
      <h2 className="font-display text-2xl font-extrabold text-slate-900">{children}</h2>
    </div>
  </div>
);

// The order's journey has exactly three real stops (Pending → In Progress →
// Completed) — rather than a single status pill, this renders it as a
// stitched thread line with a bead at each stop, in keeping with the shop's
// own craft. The current stop is filled and pulses faintly; finished stops
// are solid; stops ahead are hollow. This is the card's primary status
// display, not decoration alongside a badge.
// ✅ Labels are (en, ur) pairs now instead of a single fixed string, so the
// tracker shows only whichever language the portal's toggle is set to,
// never both scripts glued together on the same bead.
const STAGE_META = {
  Pending: { labelEn: 'Order Received', labelUr: 'آرڈر موصول ہوا', color: '#B45309', bg: '#FEF3C7' },
  'In Progress': { labelEn: 'In Progress', labelUr: 'جاری ہے', color: '#1D4ED8', bg: '#DBEAFE' },
  Completed: { labelEn: 'Ready', labelUr: 'تیار ہے', color: '#047857', bg: '#D1FAE5' },
};
const CUSTOMER_STAGES = ['Pending', 'In Progress', 'Completed'];

const StitchTracker = ({ order }) => {
  const { t } = useLanguage();
  const current = getCustomerStatus(order);
  const currentIdx = CUSTOMER_STAGES.indexOf(current);
  return (
    <div className="pt-1">
      <div className="flex items-center">
        {CUSTOMER_STAGES.map((stage, i) => {
          const done = i < currentIdx;
          const active = i === currentIdx;
          const meta = STAGE_META[stage];
          return (
            <React.Fragment key={stage}>
              <div className="flex flex-col items-center flex-shrink-0" style={{ width: 84 }}>
                <span
                  className={`flex items-center justify-center rounded-full flex-shrink-0 transition-all ${active ? 'w-4 h-4' : 'w-3 h-3'}`}
                  style={{
                    backgroundColor: done || active ? meta.color : '#fff',
                    border: `2px solid ${done || active ? meta.color : '#CBD5E1'}`,
                    boxShadow: active ? `0 0 0 4px ${meta.bg}` : 'none',
                  }}
                />
                <span className={`mt-2 text-[10px] font-bold uppercase tracking-wide text-center leading-tight ${active ? '' : done ? 'text-slate-400' : 'text-slate-300'}`} style={active ? { color: meta.color } : undefined}>
                  {t(meta.labelEn, meta.labelUr)}
                </span>
              </div>
              {i < CUSTOMER_STAGES.length - 1 && (
                <div
                  className="stitch-line flex-1 -mt-4"
                  style={{ color: i < currentIdx ? STAGE_META[stage].color : '#CBD5E1' }}
                />
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};

// Time-based greeting — small touch that makes the header feel like it's
// actually addressing the person who's logged in, not just labeling a role.
// ✅ Returns a key now instead of a hardcoded English string, so the caller
// can pick the matching English or Urdu greeting off the current language
// toggle instead of always showing English.
const GREETINGS = {
  morning: { en: 'Good Morning', ur: 'صبح بخیر' },
  afternoon: { en: 'Good Afternoon', ur: 'دوپہر بخیر' },
  evening: { en: 'Good Evening', ur: 'شام بخیر' },
};
const getGreetingKey = () => {
  const hour = new Date().getHours();
  if (hour < 12) return 'morning';
  if (hour < 17) return 'afternoon';
  return 'evening';
};

const CustomerPortal = () => {
  const { currentCustomer, customerLogout, orders, designs, loading } = useLocalState();
  const { language, setLanguage, t, td, tn } = useLanguage();
  const navigate = useNavigate();

  // ✅ Two real tabs instead of one long stacked scroll (Track Order / My
  // Orders / Browse Designs). That old layout is what produced the big
  // blank gaps: a tall "no orders yet" placeholder sitting above a design
  // grid pushed everything far down the page. Now only one view renders at
  // a time, and "Browse Designs" opens first — customers land on the
  // catalog instead of an empty order-tracking box.
  const [activeTab, setActiveTab] = useState('designs');

  // ── My Orders — search by order name only. The old "Track Order by ID"
  // box (paste a raw Mongo ID) has been removed entirely; customers can only
  // ever see their own orders anyway, so a simple name filter over that list
  // covers "find my order" without ever needing an ID.
  const [orderNameSearch, setOrderNameSearch] = useState('');
  const [copied, setCopied] = useState(null);

  // ── Browse Designs (read-only catalog) ──
  const [designSearch, setDesignSearch] = useState('');
  const [designCategoryFilter, setDesignCategoryFilter] = useState('All');
  const [viewingDesign, setViewingDesign] = useState(null);

  const handleLogout = () => {
    customerLogout();
    navigate('/login');
  };

  // This customer's own orders, newest first.
  const myOrders = useMemo(() => {
    return orders
      .filter(o => o.customerId?.toString() === currentCustomer?._id?.toString())
      .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
  }, [orders, currentCustomer]);

  const filteredMyOrders = useMemo(() => {
    const base = myOrders.filter(o => matchesNameSearch(o.orderType, orderNameSearch));
    return sortByNameMatch(base.map(o => ({ ...o, name: o.orderType })), orderNameSearch);
  }, [myOrders, orderNameSearch]);

  // Featured designs — shown as a "Recommended" strip at the very top of
  // the Designs tab, ahead of the full searchable grid, per the shop's
  // request that recommended designs surface first.
  const recommendedDesigns = useMemo(
    () => designs.filter(d => d.isFeatured).slice(0, 8),
    [designs]
  );

  const filteredCatalogDesigns = useMemo(() => {
    const base = designs.filter(d => {
      if (designCategoryFilter !== 'All' && d.category !== designCategoryFilter) return false;
      if (!matchesNameSearch(d.name, designSearch)) return false;
      return true;
    });
    return sortByNameMatch(base, designSearch);
  }, [designs, designSearch, designCategoryFilter]);

  // ✅ Shown 6 at a time (two rows), same as the Admin's Designs catalog —
  // Prev/Next below the grid pages through the rest instead of dumping the
  // whole catalog onto the screen at once.
  const DESIGN_PAGE_SIZE = 6;
  const [designPage, setDesignPage] = useState(1);
  useEffect(() => { setDesignPage(1); }, [designSearch, designCategoryFilter]);
  const totalDesignPages = Math.max(1, Math.ceil(filteredCatalogDesigns.length / DESIGN_PAGE_SIZE));
  const safeDesignPage = Math.min(designPage, totalDesignPages);
  const pagedCatalogDesigns = filteredCatalogDesigns.slice(
    (safeDesignPage - 1) * DESIGN_PAGE_SIZE,
    safeDesignPage * DESIGN_PAGE_SIZE
  );
  // Other designs in the same category, shown inside the detail modal so a
  // customer browsing "Gents" designs can keep exploring similar options
  // without closing the modal and re-filtering by hand.
  const relatedDesigns = viewingDesign
    ? designs.filter(d => d._id !== viewingDesign._id && d.category === viewingDesign.category).slice(0, 6)
    : [];

  const copyId = (id) => {
    navigator.clipboard?.writeText(id);
    setCopied(id);
    setTimeout(() => setCopied(null), 1500);
  };

  // ✅ A design's own name — prefers the Urdu name when the toggle is set
  // to Urdu, otherwise the English one, so a design card never shows both
  // scripts glued together. Falls back to whichever name exists.
  const designName = (d) => (language === 'ur' && d?.nameUrdu ? d.nameUrdu : d?.name);

  if (loading) {
    return (
      <div className="h-screen flex flex-col items-center justify-center space-y-4">
        <Loader2 className="animate-spin text-primary" size={48} />
        <p className="text-slate-500 font-bold animate-pulse uppercase tracking-tighter">{t('Loading...', 'لوڈ ہو رہا ہے...')}</p>
      </div>
    );
  }

  // A single order's card — used for "My Orders".
  const OrderCard = ({ order, index = 0 }) => (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05, ease: 'easeOut' }}
      whileHover={{ y: -3 }}
      className="relative bg-white rounded-xl border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow overflow-hidden"
    >
      <div className="p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="w-11 h-11 bg-primary-light border border-primary/10 rounded-xl flex items-center justify-center text-primary flex-shrink-0">
              <Scissors size={19} />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{td(order.orderCategory)}</p>
              <h3 className="font-display text-lg font-bold text-slate-900 truncate">
                <HighlightedName name={td(order.orderType)} term={orderNameSearch} />
              </h3>
            </div>
          </div>
        </div>

        <div className="mt-5 pl-1 pr-2">
          <StitchTracker order={order} />
        </div>

        {(order.createdAt || order.deliveredAt) && (
          <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 mt-4">
            {order.createdAt && (
              <div className="flex items-center gap-1.5 text-[11px] text-slate-500 font-bold">
                <Calendar size={13} className="text-slate-400" />
                {t('Order Date', 'آرڈر کی تاریخ')}: {new Date(order.createdAt).toLocaleDateString()}
              </div>
            )}
            {order.deliveredAt && (
              <div className="flex items-center gap-1.5 text-[11px] text-emerald-600 font-bold">
                <PackageCheck size={13} />
                {t('Delivered', 'ڈیلیور ہو گیا')}: {new Date(order.deliveredAt).toLocaleDateString()}
              </div>
            )}
          </div>
        )}

        {order._id && (
          <div className="flex items-center gap-2 mt-5 pt-4 border-t border-slate-100">
            <span className="flex items-center gap-1 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              <Hash size={11} /> {t('Order ID', 'آرڈر آئی ڈی')}
            </span>
            <code className="text-[11px] font-mono text-slate-500 bg-slate-50 border border-slate-100 px-2 py-0.5 rounded-xl">{order._id}</code>
            <button
              onClick={() => copyId(order._id)}
              className="text-slate-400 hover:text-primary transition-colors"
              title={t('Copy Order ID', 'آرڈر آئی ڈی کاپی کریں')}
            >
              {copied === order._id ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} />}
            </button>
          </div>
        )}

        {/* ✅ Reference design picture — same treatment as the Worker
            Portal's card: shown with a "+N more" badge when the catalog
            design has extra photos, and clickable (when the catalog
            record still exists) so the customer can flip through every
            reference photo, not just the one cover shot saved on the
            order itself. */}
        {order.selectedDesignImage && (() => {
          const linkedDesign = order.selectedDesignId
            ? designs.find(d => d._id === order.selectedDesignId)
            : null;
          const extraCount = linkedDesign?.images?.length > 1 ? linkedDesign.images.length - 1 : 0;
          const Wrapper = linkedDesign ? 'button' : 'div';
          const displayName = language === 'ur'
            ? (linkedDesign?.nameUrdu || order.selectedDesignNameUrdu || linkedDesign?.name || order.selectedDesignName)
            : (linkedDesign?.name || order.selectedDesignName);
          return (
            <Wrapper
              type={linkedDesign ? 'button' : undefined}
              onClick={linkedDesign ? () => setViewingDesign(linkedDesign) : undefined}
              className={`flex items-center gap-3 mt-4 bg-slate-50 border border-slate-100 rounded-xl p-2.5 pr-4 text-left w-full ${linkedDesign ? 'hover:bg-slate-100 hover:border-slate-200 transition-colors cursor-pointer' : 'hover:border-slate-200 transition-colors'}`}
            >
              <div className="relative flex-shrink-0">
                <DesignThumb src={order.selectedDesignImage} alt={displayName || 'Design'} className="w-11 h-11 rounded-xl object-cover" iconSize={16} />
                {extraCount > 0 && (
                  <span className="absolute -bottom-1 -right-1 px-1.5 py-0.5 rounded-full text-[8px] font-bold bg-black/60 text-white">
                    +{extraCount}
                  </span>
                )}
              </div>
              <div className="min-w-0">
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{t('Your Design', 'آپ کا ڈیزائن')}</p>
                <p dir={language === 'ur' && (linkedDesign?.nameUrdu || order.selectedDesignNameUrdu) ? 'rtl' : 'ltr'} className="text-xs font-bold text-slate-700 truncate">
                  {displayName}
                </p>
                {linkedDesign && (
                  <p className="text-[10px] font-bold text-primary flex items-center gap-1 mt-0.5">
                    <Maximize2 size={10} /> {t('View all photos', 'تمام تصاویر دیکھیں')}
                  </p>
                )}
              </div>
            </Wrapper>
          );
        })()}
      </div>
    </motion.div>
  );

  return (
    <div className="min-h-screen flex flex-col justify-between fabric-bg p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-8 w-full flex-1 flex flex-col justify-between">

        {/* ── Header / Profile ── */}
        <motion.header
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
          className="relative rounded-xl overflow-hidden"
          style={{ background: 'linear-gradient(155deg, #10707F 0%, #0E606E 50%, #0A4A55 100%)', boxShadow: '0 20px 40px -20px rgba(10,74,85,0.5)' }}
        >
          <div className="absolute inset-0 opacity-[0.07]" style={{ backgroundImage: 'repeating-linear-gradient(90deg, #fff 0px, #fff 1px, transparent 1px, transparent 10px)' }} />
          <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-5 p-6 md:p-7">
            <div className="flex items-center gap-4 min-w-0">
              <div className="w-14 h-14 bg-white/15 border border-white/20 rounded-xl flex items-center justify-center text-white flex-shrink-0">
                <User size={22} />
              </div>
              <div className="min-w-0">
                <p className="text-white/60 text-[10px] font-bold uppercase tracking-[0.2em] mb-0.5">{t('Customer Portal', 'کسٹمر پورٹل')}</p>
                <h1 className="font-display text-xl font-extrabold text-white truncate">
                  {t(GREETINGS[getGreetingKey()].en, GREETINGS[getGreetingKey()].ur)}, {tn(currentCustomer?.name?.split(' ')[0]) || 'there'}
                </h1>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1.5 text-white/70 text-xs font-medium">
                  {currentCustomer?.phoneNumber && (
                    <span className="flex items-center gap-1"><Phone size={12} /> {currentCustomer.phoneNumber}</span>
                  )}
                  {currentCustomer?.email && (
                    <>
                      <span className="text-white/30">·</span>
                      <span className="flex items-center gap-1"><Mail size={12} /> {currentCustomer.email}</span>
                    </>
                  )}
                  {currentCustomer?.familyName && (
                    <>
                      <span className="text-white/30">·</span>
                      <span className="flex items-center gap-1"><Home size={12} /> {currentCustomer.familyName}</span>
                    </>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2.5 flex-shrink-0">
              {/* ✅ Language toggle — mirrors the Worker Portal's toggle so
                  customers get the same single-language control instead of
                  every bilingual string being shown at once. */}
              <div className="flex items-center bg-white/15 border border-white/20 rounded-xl p-1 gap-0.5">
                <button
                  type="button"
                  onClick={() => setLanguage('en')}
                  className={`px-3 py-2 rounded-xl text-xs font-black transition-all ${language === 'en' ? 'bg-white text-primary shadow-sm' : 'text-white/60 hover:text-white/90'}`}
                >
                  English
                </button>
                <button
                  type="button"
                  onClick={() => setLanguage('ur')}
                  className={`px-3 py-2 rounded-xl text-xs font-black transition-all ${language === 'ur' ? 'bg-white text-primary shadow-sm' : 'text-white/60 hover:text-white/90'}`}
                >
                  اردو
                </button>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center justify-center gap-2 px-5 py-2.5 bg-white/10 border border-white/15 text-white text-sm font-bold rounded-xl hover:bg-white/20 transition-all self-start md:self-auto flex-shrink-0"
              >
                <LogOut size={16} /> {t('Logout', 'لاگ آؤٹ')}
              </button>
            </div>
          </div>

          {/* ── Tabs — Browse Designs opens first, My Orders second. Only the
              active tab's content renders below, so there's never a big
              empty placeholder sitting on top of the section you actually
              want. ── */}
          <nav className="relative flex items-center gap-1 px-4 md:px-5 border-t border-white/15 overflow-x-auto scrollbar-hide">
            {[
              { id: 'designs', label: t('Browse Designs', 'ڈیزائن دیکھیں') },
              { id: 'orders', label: `${t('My Orders', 'میرے آرڈرز')}${myOrders.length ? ` (${myOrders.length})` : ''}` },
            ].map(({ id, label }) => (
              <button
                key={id}
                type="button"
                onClick={() => setActiveTab(id)}
                className={`relative flex-shrink-0 px-3.5 py-3 text-xs font-bold transition-colors whitespace-nowrap ${activeTab === id ? 'text-white' : 'text-white/60 hover:text-white/90'}`}
              >
                {label}
                {activeTab === id && (
                  <span className="absolute left-3.5 right-3.5 bottom-0 h-[2px] bg-white rounded-full" />
                )}
              </button>
            ))}
          </nav>
        </motion.header>

        {/* ── Browse Designs (opens first) ── */}
        {activeTab === 'designs' && (
          <div className="space-y-8">
            {recommendedDesigns.length > 0 && (
              <div>
                <SectionHeading eyebrow={t('Just for you', 'آپ کے لیے')}>{t('Recommended Designs', 'تجویز کردہ ڈیزائنز')}</SectionHeading>
                <div className="flex gap-4 overflow-x-auto scrollbar-hide pb-2 -mx-1 px-1">
                  {recommendedDesigns.map((d, i) => (
                    <motion.button
                      key={d._id}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: i * 0.04, ease: 'easeOut' }}
                      onClick={() => setViewingDesign(d)}
                      className="relative flex-shrink-0 w-44 glass-card rounded-2xl overflow-hidden group cursor-pointer hover:shadow-xl hover:shadow-primary/10 hover:-translate-y-0.5 transition-all p-4 flex flex-col items-center text-center"
                    >
                      <div className="relative w-28 h-28 sm:w-32 sm:h-32 flex-shrink-0">
                        <div className="w-full h-full rounded-2xl overflow-hidden bg-white border border-slate-100">
                          <DesignThumb src={d.images?.[0]?.url} alt={designName(d)} className="w-full h-full object-cover object-center group-hover:scale-[1.03] transition-transform duration-300" iconSize={22} />
                        </div>
                        <span className="absolute top-1.5 left-1.5 flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-400 text-white">
                          <Star size={10} fill="currentColor" /> {t('Featured', 'نمایاں')}
                        </span>
                      </div>
                      <div className="w-full mt-3 space-y-1">
                        <div className="flex items-center justify-center gap-2">
                          <h3 dir={language === 'ur' && d.nameUrdu ? 'rtl' : 'ltr'} className="text-sm font-black text-slate-800 uppercase truncate">{designName(d)}</h3>
                          {d.price !== null && d.price !== undefined && (
                            <span className="text-primary font-black text-xs whitespace-nowrap">Rs {d.price}</span>
                          )}
                        </div>
                        <div className="flex justify-center">
                          <span className="inline-block px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest bg-indigo-100 text-indigo-600">
                            {td(d.category)}
                          </span>
                        </div>
                      </div>
                    </motion.button>
                  ))}
                </div>
              </div>
            )}

            <div>
              <SectionHeading eyebrow={t(`${designs.length} design${designs.length === 1 ? '' : 's'}`, `${designs.length} ڈیزائنز`)}>{t('Browse Designs', 'ڈیزائن دیکھیں')}</SectionHeading>

              {designs.length === 0 ? (
                <div className="bg-white rounded-xl border border-dashed border-slate-200 p-10 text-center">
                  <div className="w-14 h-14 bg-primary-light ring-8 ring-primary-light/40 rounded-full flex items-center justify-center mx-auto mb-4 text-primary/40">
                    <Palette size={26} />
                  </div>
                  <h3 className="text-lg font-bold text-slate-400">{t('No designs yet', 'ابھی تک کوئی ڈیزائن نہیں')}</h3>
                  <p className="text-slate-400 text-sm font-medium mt-1.5">{t('The shop will add new designs soon.', 'جلد ہی شاپ نئے ڈیزائن شامل کرے گی۔')}</p>
                </div>
              ) : (
                <>
                  <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 flex flex-col md:flex-row md:items-center gap-4 mb-5">
                    <div className="flex items-stretch border border-slate-200 rounded-xl overflow-hidden bg-slate-50 flex-1">
                      <div className="flex items-center justify-center px-3.5 text-slate-400">
                        <Search size={16} />
                      </div>
                      <input
                        type="text"
                        placeholder={t('Search designs...', 'ڈیزائن تلاش کریں...')}
                        className="flex-1 pr-4 py-2.5 bg-transparent outline-none text-slate-700 placeholder:text-slate-400 text-sm"
                        value={designSearch}
                        onChange={e => setDesignSearch(e.target.value)}
                      />
                    </div>
                    <div className="flex flex-wrap items-center gap-1.5">
                      <button
                        onClick={() => setDesignCategoryFilter('All')}
                        className={`px-3.5 py-1.5 rounded-xl text-[11px] font-bold uppercase tracking-wide transition-all ${designCategoryFilter === 'All' ? 'bg-primary text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
                      >
                        {t('All', 'تمام')}
                      </button>
                      {DESIGN_CATEGORIES.map(c => (
                        <button
                          key={c}
                          onClick={() => setDesignCategoryFilter(c)}
                          className={`px-3.5 py-1.5 rounded-xl text-[11px] font-bold uppercase tracking-wide transition-all whitespace-nowrap ${designCategoryFilter === c ? 'bg-primary text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
                        >
                          {td(c)}
                        </button>
                      ))}
                    </div>
                  </div>

                  {filteredCatalogDesigns.length === 0 ? (
                    <div className="bg-white rounded-xl border border-dashed border-slate-200 p-10 text-center">
                      <Palette size={30} className="mx-auto mb-4 text-slate-300" />
                      <h3 className="text-lg font-bold text-slate-400">{t('No matching designs', 'کوئی ملتا جلتا ڈیزائن نہیں')}</h3>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {pagedCatalogDesigns.map((d, i) => (
                        <motion.button
                          key={d._id}
                          initial={{ opacity: 0, y: 16 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.3, delay: i * 0.04, ease: 'easeOut' }}
                          onClick={() => setViewingDesign(d)}
                          className="glass-card rounded-2xl overflow-hidden group cursor-pointer hover:shadow-xl hover:shadow-primary/10 hover:-translate-y-0.5 transition-all p-4 flex flex-col items-center text-center"
                        >
                          <div className="relative w-28 h-28 sm:w-32 sm:h-32 flex-shrink-0">
                            <div className="w-full h-full rounded-2xl overflow-hidden bg-white border border-slate-100">
                              <DesignThumb src={d.images?.[0]?.url} alt={designName(d)} className="w-full h-full object-cover object-center" iconSize={22} />
                            </div>
                            {d.images?.length > 1 && (
                              <span className="absolute bottom-1.5 left-1.5 px-2 py-0.5 rounded-full text-[10px] font-black bg-black/50 text-white backdrop-blur-sm">
                                +{d.images.length - 1}
                              </span>
                            )}
                            {d.isFeatured && (
                              <span className="absolute top-1.5 left-1.5 flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-400 text-white">
                                <Star size={10} fill="currentColor" /> {t('Featured', 'نمایاں')}
                              </span>
                            )}
                          </div>
                          <div className="w-full mt-3 space-y-1">
                            <div className="flex items-center justify-center gap-2">
                              <h3 dir={language === 'ur' && d.nameUrdu ? 'rtl' : 'ltr'} className="text-sm font-black text-slate-800 uppercase truncate">
                                {language === 'ur' && d.nameUrdu
                                  ? d.nameUrdu
                                  : <HighlightedName name={d.name} term={designSearch} />}
                              </h3>
                              {d.price !== null && d.price !== undefined && (
                                <span className="text-primary font-black text-xs whitespace-nowrap">Rs {d.price}</span>
                              )}
                            </div>
                            <div className="flex justify-center">
                              <span className="inline-block px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest bg-indigo-100 text-indigo-600">
                                {td(d.category)}
                              </span>
                            </div>
                            {d.description && (
                              <p dir={language === 'ur' && d.descriptionUrdu ? 'rtl' : 'ltr'} className="text-slate-500 text-xs font-medium line-clamp-2 pt-1">
                                {language === 'ur' && d.descriptionUrdu ? d.descriptionUrdu : d.description}
                              </p>
                            )}
                          </div>
                        </motion.button>
                      ))}
                    </div>
                  )}
                  <PaginationControls
                    currentPage={safeDesignPage}
                    totalPages={totalDesignPages}
                    onPrev={() => setDesignPage(p => Math.max(1, p - 1))}
                    onNext={() => setDesignPage(p => Math.min(totalDesignPages, p + 1))}
                    className="mt-5"
                  />
                </>
              )}
            </div>
          </div>
        )}

        {/* ── My Orders — search by name only ── */}
        {activeTab === 'orders' && (
          <div>
            <SectionHeading eyebrow={t(`${myOrders.length} order${myOrders.length === 1 ? '' : 's'}`, `${myOrders.length} آرڈرز`)}>{t('My Orders', 'میرے آرڈرز')}</SectionHeading>

            {myOrders.length > 0 && (
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 mb-5">
                <div className="flex items-stretch border border-slate-200 rounded-xl overflow-hidden bg-slate-50 focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary/30 transition-all">
                  <div className="flex items-center justify-center px-3.5 text-slate-400">
                    <Search size={16} />
                  </div>
                  <input
                    type="text"
                    placeholder={t("Type your order's name (e.g. 'Shalwar Qamees')...", "اپنے آرڈر کا نام لکھیں (جیسے 'شلوار قمیض')...")}
                    className="flex-1 pr-4 py-3 bg-transparent outline-none text-slate-700 placeholder:text-slate-400 text-sm"
                    value={orderNameSearch}
                    onChange={e => setOrderNameSearch(e.target.value)}
                  />
                </div>
              </div>
            )}

            {myOrders.length === 0 ? (
              <div className="bg-white rounded-xl border border-dashed border-slate-200 p-10 text-center">
                <div className="w-14 h-14 bg-primary-light ring-8 ring-primary-light/40 rounded-full flex items-center justify-center mx-auto mb-4 text-primary/40">
                  <ClipboardList size={26} />
                </div>
                <h3 className="text-lg font-bold text-slate-400">{t('No orders yet', 'ابھی تک کوئی آرڈر نہیں')}</h3>
                <p className="text-slate-400 text-sm font-medium mt-1.5">{t('Once the shop adds your order, it will show up here.', 'جب شاپ آپ کا آرڈر شامل کرے گی، یہ یہاں نظر آئے گا۔')}</p>
              </div>
            ) : filteredMyOrders.length === 0 ? (
              <div className="bg-white rounded-xl border border-dashed border-slate-200 p-10 text-center">
                <Search size={26} className="mx-auto mb-4 text-slate-300" />
                <h3 className="text-lg font-bold text-slate-400">{t('No order found with this name', 'اس نام سے کوئی آرڈر نہیں ملا')}</h3>
                <p className="text-slate-400 text-sm font-medium mt-1.5">{t('Please double-check the order name.', 'براہ کرم آرڈر کا نام دوبارہ چیک کریں۔')}</p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredMyOrders.map((order, i) => <OrderCard key={order._id} order={order} index={i} />)}
              </div>
            )}
          </div>
        )}

        <PortalFooter />
      </div>

      {viewingDesign && (
        <DesignDetailModal
          design={viewingDesign}
          relatedDesigns={relatedDesigns}
          onSelectRelated={(d) => setViewingDesign(d)}
          onClose={() => setViewingDesign(null)}
        />
      )}
    </div>
  );
};

export default CustomerPortal;
