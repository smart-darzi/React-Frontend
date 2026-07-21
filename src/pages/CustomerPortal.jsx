import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useLocalState } from '../context/useLocalState';
import { getCustomerStatus } from '../utils/stages';
import { DESIGN_CATEGORIES } from '../utils/designCategories';
import DesignDetailModal from '../components/DesignDetailModal';
import PortalFooter from '../components/PortalFooter';
import { matchesNameSearch, sortByNameMatch, highlightNameMatch } from '../utils/nameSearch';
import {
  User, LogOut, Scissors, Phone, Mail, Home, Search, ClipboardList,
  Palette, Star, Hash, Calendar, PackageCheck, Copy, Check, Loader2,
} from 'lucide-react';

// Highlights the matched portion of a design/order name — same treatment
// used on the Admin's Customers/Designs search, reused here for consistency.
const HighlightedName = ({ name, term }) => (
  <>
    {highlightNameMatch(name, term).map((seg, i) =>
      seg.match
        ? <span key={i} className="bg-yellow-200 text-slate-800 rounded px-0.5">{seg.text}</span>
        : <span key={i}>{seg.text}</span>
    )}
  </>
);

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
const STAGE_META = {
  Pending: { label: 'Order Received', color: '#B45309', bg: '#FEF3C7' },
  'In Progress': { label: 'In Progress', color: '#1D4ED8', bg: '#DBEAFE' },
  Completed: { label: 'Ready', color: '#047857', bg: '#D1FAE5' },
};
const CUSTOMER_STAGES = ['Pending', 'In Progress', 'Completed'];

const StitchTracker = ({ order }) => {
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
                  {meta.label}
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
const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good Morning';
  if (hour < 17) return 'Good Afternoon';
  return 'Good Evening';
};

const CustomerPortal = () => {
  const { currentCustomer, customerLogout, orders, designs, loading } = useLocalState();
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

  if (loading) {
    return (
      <div className="h-screen flex flex-col items-center justify-center space-y-4">
        <Loader2 className="animate-spin text-primary" size={48} />
        <p className="text-slate-500 font-bold animate-pulse uppercase tracking-tighter">Loading...</p>
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
      className="relative bg-white rounded-[2.5rem] border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow overflow-hidden"
    >
      <div className="p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="w-11 h-11 bg-primary-light border border-primary/10 rounded-xl flex items-center justify-center text-primary flex-shrink-0">
              <Scissors size={19} />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{order.orderCategory}</p>
              <h3 className="font-display text-lg font-bold text-slate-900 truncate">
                <HighlightedName name={order.orderType} term={orderNameSearch} />
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
                Order Date: {new Date(order.createdAt).toLocaleDateString()}
              </div>
            )}
            {order.deliveredAt && (
              <div className="flex items-center gap-1.5 text-[11px] text-emerald-600 font-bold">
                <PackageCheck size={13} />
                Delivered: {new Date(order.deliveredAt).toLocaleDateString()}
              </div>
            )}
          </div>
        )}

        {order._id && (
          <div className="flex items-center gap-2 mt-5 pt-4 border-t border-slate-100">
            <span className="flex items-center gap-1 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              <Hash size={11} /> Order ID
            </span>
            <code className="text-[11px] font-mono text-slate-500 bg-slate-50 border border-slate-100 px-2 py-0.5 rounded-md">{order._id}</code>
            <button
              onClick={() => copyId(order._id)}
              className="text-slate-400 hover:text-primary transition-colors"
              title="Copy Order ID"
            >
              {copied === order._id ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} />}
            </button>
          </div>
        )}

        {order.selectedDesignImage && (
          <div className="flex items-center gap-3 mt-4 bg-slate-50 border border-slate-100 hover:border-slate-200 transition-colors rounded-xl p-2.5 pr-4">
            <img src={order.selectedDesignImage} alt={order.selectedDesignName || 'Design'} className="w-11 h-11 rounded-lg object-cover flex-shrink-0" />
            <div className="min-w-0">
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Aapka Design</p>
              <p className="text-xs font-bold text-slate-700 truncate">{order.selectedDesignName}</p>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );

  return (
    <div className="min-h-screen fabric-bg p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-8">

        {/* ── Header / Profile ── */}
        <motion.header
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
          className="relative rounded-[2rem] overflow-hidden"
          style={{ background: 'linear-gradient(155deg, #10707F 0%, #0E606E 50%, #0A4A55 100%)', boxShadow: '0 20px 40px -20px rgba(10,74,85,0.5)' }}
        >
          <div className="absolute inset-0 opacity-[0.07]" style={{ backgroundImage: 'repeating-linear-gradient(90deg, #fff 0px, #fff 1px, transparent 1px, transparent 10px)' }} />
          <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-5 p-6 md:p-7">
            <div className="flex items-center gap-4 min-w-0">
              <div className="w-14 h-14 bg-white/15 border border-white/20 rounded-2xl flex items-center justify-center text-white flex-shrink-0">
                <User size={22} />
              </div>
              <div className="min-w-0">
                <p className="text-white/60 text-[10px] font-bold uppercase tracking-[0.2em] mb-0.5">Customer Portal</p>
                <h1 className="font-display text-xl font-extrabold text-white truncate">
                  {getGreeting()}, {currentCustomer?.name?.split(' ')[0] || 'there'}
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
            <button
              onClick={handleLogout}
              className="flex items-center justify-center gap-2 px-5 py-2.5 bg-white/10 border border-white/15 text-white text-sm font-bold rounded-xl hover:bg-white/20 transition-all self-start md:self-auto flex-shrink-0"
            >
              <LogOut size={16} /> Logout
            </button>
          </div>

          {/* ── Tabs — Browse Designs opens first, My Orders second. Only the
              active tab's content renders below, so there's never a big
              empty placeholder sitting on top of the section you actually
              want. ── */}
          <nav className="relative flex items-center gap-1 px-4 md:px-5 border-t border-white/15 overflow-x-auto">
            {[
              { id: 'designs', label: 'Browse Designs' },
              { id: 'orders', label: `My Orders${myOrders.length ? ` (${myOrders.length})` : ''}` },
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
                <SectionHeading eyebrow="Just for you">Recommended Designs / تجویز کردہ ڈیزائنز</SectionHeading>
                <div className="flex gap-4 overflow-x-auto scrollbar-hide pb-2 -mx-1 px-1">
                  {recommendedDesigns.map((d, i) => (
                    <motion.button
                      key={d._id}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: i * 0.04, ease: 'easeOut' }}
                      whileHover={{ y: -2 }}
                      onClick={() => setViewingDesign(d)}
                      className="relative flex-shrink-0 w-40 bg-white rounded-2xl border border-slate-200 overflow-hidden text-left hover:shadow-md hover:border-slate-300 transition-colors group"
                    >
                      <div className="relative">
                        <img src={d.images?.[0]?.url} alt={d.name} className="w-full h-40 object-contain bg-slate-50 group-hover:scale-[1.03] transition-transform duration-300" />
                        <span className="absolute top-2 left-2 flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-400 text-white">
                          <Star size={9} fill="currentColor" /> Featured
                        </span>
                      </div>
                      <div className="p-3 space-y-1">
                        <h3 className="text-xs font-bold text-slate-800 truncate">{d.name}</h3>
                        {d.price !== null && d.price !== undefined && (
                          <span className="inline-block bg-primary/10 text-primary font-bold text-[11px] px-2 py-0.5 rounded-md">Rs {d.price}</span>
                        )}
                      </div>
                    </motion.button>
                  ))}
                </div>
              </div>
            )}

            <div>
              <SectionHeading eyebrow={`${designs.length} design${designs.length === 1 ? '' : 's'}`}>Browse Designs / ڈیزائن دیکھیں</SectionHeading>

              {designs.length === 0 ? (
                <div className="bg-white rounded-[2.5rem] border border-dashed border-slate-200 p-10 text-center">
                  <div className="w-14 h-14 bg-primary-light ring-8 ring-primary-light/40 rounded-full flex items-center justify-center mx-auto mb-4 text-primary/40">
                    <Palette size={26} />
                  </div>
                  <h3 className="text-lg font-bold text-slate-400">Abhi tak koi design nahi</h3>
                  <p className="text-slate-400 text-sm font-medium mt-1.5">Jald hi shop naye designs add karegi.</p>
                </div>
              ) : (
                <>
                  <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm p-5 flex flex-col md:flex-row md:items-center gap-4 mb-5">
                    <div className="flex items-stretch border border-slate-200 rounded-xl overflow-hidden bg-slate-50 flex-1">
                      <div className="flex items-center justify-center px-3.5 text-slate-400">
                        <Search size={16} />
                      </div>
                      <input
                        type="text"
                        placeholder="Design search karein..."
                        className="flex-1 pr-4 py-2.5 bg-transparent outline-none text-slate-700 placeholder:text-slate-400 text-sm"
                        value={designSearch}
                        onChange={e => setDesignSearch(e.target.value)}
                      />
                    </div>
                    <div className="flex flex-wrap items-center gap-1.5">
                      <button
                        onClick={() => setDesignCategoryFilter('All')}
                        className={`px-3.5 py-1.5 rounded-lg text-[11px] font-bold uppercase tracking-wide transition-all ${designCategoryFilter === 'All' ? 'bg-primary text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
                      >
                        All
                      </button>
                      {DESIGN_CATEGORIES.map(c => (
                        <button
                          key={c}
                          onClick={() => setDesignCategoryFilter(c)}
                          className={`px-3.5 py-1.5 rounded-lg text-[11px] font-bold uppercase tracking-wide transition-all whitespace-nowrap ${designCategoryFilter === c ? 'bg-primary text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
                        >
                          {c.split(' / ')[0]}
                        </button>
                      ))}
                    </div>
                  </div>

                  {filteredCatalogDesigns.length === 0 ? (
                    <div className="bg-white rounded-[2.5rem] border border-dashed border-slate-200 p-10 text-center">
                      <Palette size={30} className="mx-auto mb-4 text-slate-300" />
                      <h3 className="text-lg font-bold text-slate-400">No matching designs</h3>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                      {filteredCatalogDesigns.map((d, i) => (
                        <motion.button
                          key={d._id}
                          initial={{ opacity: 0, y: 12 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.3, delay: i * 0.03, ease: 'easeOut' }}
                          whileHover={{ y: -2 }}
                          onClick={() => setViewingDesign(d)}
                          className="bg-white rounded-xl border border-slate-200 overflow-hidden text-left hover:shadow-md hover:border-slate-300 transition-colors group"
                        >
                          <div className="relative">
                            <img src={d.images?.[0]?.url} alt={d.name} className="w-full h-36 object-contain bg-slate-50 group-hover:scale-[1.03] transition-transform duration-300" />
                            {d.images?.length > 1 && (
                              <span className="absolute bottom-2 right-2 px-2 py-0.5 rounded-md text-[10px] font-bold bg-black/50 text-white backdrop-blur-sm">
                                +{d.images.length - 1}
                              </span>
                            )}
                            {d.isFeatured && (
                              <span className="absolute top-2 left-2 flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-400 text-white">
                                <Star size={9} fill="currentColor" /> Featured
                              </span>
                            )}
                          </div>
                          <div className="p-3.5 space-y-1.5">
                            <div className="flex items-center justify-between gap-2">
                              <h3 className="text-xs font-bold text-slate-800 truncate">
                                <HighlightedName name={d.name} term={designSearch} />
                              </h3>
                              {d.price !== null && d.price !== undefined && (
                                <span className="flex-shrink-0 bg-primary/10 text-primary font-bold text-[11px] px-2 py-0.5 rounded-md whitespace-nowrap">Rs {d.price}</span>
                              )}
                            </div>
                            <span className="inline-block px-2 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wide bg-indigo-50 text-indigo-600">
                              {d.category}
                            </span>
                            {d.description && <p className="text-slate-400 text-[11px] font-medium line-clamp-2 pt-0.5">{d.description}</p>}
                          </div>
                        </motion.button>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        )}

        {/* ── My Orders — search by name only ── */}
        {activeTab === 'orders' && (
          <div>
            <SectionHeading eyebrow={`${myOrders.length} order${myOrders.length === 1 ? '' : 's'}`}>My Orders / میرے آرڈرز</SectionHeading>

            {myOrders.length > 0 && (
              <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm p-5 mb-5">
                <div className="flex items-stretch border border-slate-200 rounded-xl overflow-hidden bg-slate-50 focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary/30 transition-all">
                  <div className="flex items-center justify-center px-3.5 text-slate-400">
                    <Search size={16} />
                  </div>
                  <input
                    type="text"
                    placeholder="Apne order ka naam likhein (jaise 'Shalwar Qamees')..."
                    className="flex-1 pr-4 py-3 bg-transparent outline-none text-slate-700 placeholder:text-slate-400 text-sm"
                    value={orderNameSearch}
                    onChange={e => setOrderNameSearch(e.target.value)}
                  />
                </div>
              </div>
            )}

            {myOrders.length === 0 ? (
              <div className="bg-white rounded-[2.5rem] border border-dashed border-slate-200 p-10 text-center">
                <div className="w-14 h-14 bg-primary-light ring-8 ring-primary-light/40 rounded-full flex items-center justify-center mx-auto mb-4 text-primary/40">
                  <ClipboardList size={26} />
                </div>
                <h3 className="text-lg font-bold text-slate-400">Abhi tak koi order nahi</h3>
                <p className="text-slate-400 text-sm font-medium mt-1.5">Jab shop aapka order add karegi, wo yahan dikhega.</p>
              </div>
            ) : filteredMyOrders.length === 0 ? (
              <div className="bg-white rounded-[2.5rem] border border-dashed border-slate-200 p-10 text-center">
                <Search size={26} className="mx-auto mb-4 text-slate-300" />
                <h3 className="text-lg font-bold text-slate-400">Is naam se koi order nahi mila</h3>
                <p className="text-slate-400 text-sm font-medium mt-1.5">Order ka naam dobara check karein.</p>
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
