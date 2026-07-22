import React, { useState, useEffect } from 'react';
import { useLocalState } from '../context/useLocalState';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Phone, ArrowRight, Loader2, ChevronLeft, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { isDigitsOnly, matchesPhoneSearch, splitPhoneMatch } from '../utils/phoneSearch';
import { matchesNameSearch, sortByNameMatch, highlightNameMatch } from '../utils/nameSearch';
import { useLanguage } from '../context/LanguageContext';

// Highlights the matched portion of a name so similarly-named customers
// (e.g. "Tahir" vs "Amina Tahir") are easy to tell apart in results.
const HighlightedName = ({ name, term }) => (
  <>
    {highlightNameMatch(name, term).map((seg, i) =>
      seg.match
        ? <span key={i} className="bg-yellow-200 text-slate-800 rounded px-0.5">{seg.text}</span>
        : <span key={i}>{seg.text}</span>
    )}
  </>
);

// Shown one row (5 cards) at a time instead of the whole directory dumping
// onto the page at once — Prev/Next below the grid pages through the rest.
const PAGE_SIZE = 5;

const ViewCustomers = () => {
  const { customers, loading } = useLocalState();
  const { t } = useLanguage();
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);

  const searchingByPhone = isDigitsOnly(searchTerm) && searchTerm.trim().length > 0;

  // Filter first, then rank so exact/whole-word matches (a standalone
  // "Tahir") come before loose partial matches (e.g. "Amina Tahir" or
  // "Tahira") instead of showing up in arbitrary order.
  const filteredCustomers = searchingByPhone
    ? customers.filter(c => matchesPhoneSearch(c.phoneNumber, searchTerm))
    : sortByNameMatch(customers.filter(c => matchesNameSearch(c.name, searchTerm)), searchTerm);

  const totalPages = Math.max(1, Math.ceil(filteredCustomers.length / PAGE_SIZE));
  // Searching/filtering changes what "page 1" even means, so jump back to
  // it whenever the search term changes rather than leaving the user
  // stranded on a now out-of-range page.
  useEffect(() => { setPage(1); }, [searchTerm]);
  const safePage = Math.min(page, totalPages);
  const pageCustomers = filteredCustomers.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  if (loading) {
    return (
      <div className="h-[60vh] flex flex-col items-center justify-center space-y-4">
        <Loader2 className="animate-spin text-primary" size={48} />
        <p className="text-slate-500 font-bold animate-pulse uppercase tracking-tighter">{t('Loading Directory...', 'ڈائریکٹری لوڈ ہو رہی ہے...')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-10">
      <motion.header
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: 'easeOut' }}
        className="flex flex-col md:flex-row md:items-center justify-between gap-6"
      >
        <div>
          <h1 className="text-4xl font-black text-slate-800 tracking-tighter uppercase">{t('Customer Directory', 'کسٹمر ڈائریکٹری')}</h1>
          <p className="text-slate-500 mt-1.5 font-medium italic text-base sm:text-lg">{t('Manage your elite clientele.', 'اپنے کسٹمرز کی فہرست کا انتظام کریں۔')}</p>
        </div>

        <div className="flex items-stretch border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-lg max-w-md w-full focus-within:ring-2 focus-within:ring-primary/20 transition-all">
          <div className="flex items-center justify-center px-4 bg-slate-100/80 border-r border-slate-200 min-w-[52px]">
            <Search size={18} className="text-slate-400" />
          </div>
          <input
            type="text"
            placeholder={t('Search by name or phone (start with 0)...', 'نام یا فون نمبر سے تلاش کریں (0 سے شروع)...')}
            className="flex-1 px-4 py-4 bg-transparent outline-none text-slate-700 placeholder:text-slate-400"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
      </motion.header>

      {/* Newest first — backend already sorts by createdAt desc. Cards are
          compact: just enough to identify the customer and jump to their
          full profile. Editing/deleting happens only from that profile.
          One row of 5 at a time (see PAGE_SIZE) with Prev/Next below,
          instead of the entire directory rendering onto the page at once. */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        <AnimatePresence mode="popLayout">
          {pageCustomers.map((c, i) => (
            <motion.div
              layout
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ delay: i * 0.03 }}
              whileHover={{ y: -3 }}
              key={c._id}
            >
              <Link
                to={`/customer/${c._id}`}
                className="glass-card p-5 rounded-[1.75rem] flex flex-col items-center text-center gap-2.5 hover:shadow-xl hover:shadow-primary/10 transition-shadow group"
              >
                <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary text-lg font-black">
                  {c.name?.charAt(0).toUpperCase() || '?'}
                </div>
                <div className="min-w-0 w-full">
                  <h3 className="text-base font-black text-slate-800 uppercase tracking-tight truncate">
                    {searchingByPhone ? c.name : <HighlightedName name={c.name} term={searchTerm} />}
                  </h3>
                  <p className="text-slate-400 text-sm font-medium flex items-center justify-center gap-1 mt-0.5 truncate">
                    <Phone size={11} className="flex-shrink-0" />
                    {searchingByPhone ? (
                      (() => {
                        const { matched, rest } = splitPhoneMatch(c.phoneNumber, searchTerm);
                        return matched ? (
                          <span>
                            <span className="bg-yellow-200 text-slate-800 font-black rounded px-0.5">{matched}</span>
                            {rest}
                          </span>
                        ) : c.phoneNumber;
                      })()
                    ) : c.phoneNumber}
                  </p>
                </div>
                <span className="text-xs font-bold text-primary flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  {t('View Profile', 'پروفائل دیکھیں')} <ArrowRight size={12} />
                </span>
              </Link>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Pagination — only shown once there's more than one page's worth of
          results, so it doesn't clutter small directories. */}
      {filteredCustomers.length > PAGE_SIZE && (
        <div className="flex items-center justify-center gap-4">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={safePage === 1}
            className="w-10 h-10 rounded-xl flex items-center justify-center bg-white border border-slate-200 text-slate-600 shadow-sm hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft size={18} />
          </button>
          <span className="text-sm font-bold text-slate-500">
            {t('Page', 'صفحہ')} {safePage} / {totalPages}
          </span>
          <button
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={safePage === totalPages}
            className="w-10 h-10 rounded-xl flex items-center justify-center bg-white border border-slate-200 text-slate-600 shadow-sm hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      )}

      {filteredCustomers.length === 0 && (
        <div className="text-center py-20 bg-slate-50 rounded-[3rem] border-2 border-dashed border-slate-200">
          <Search size={32} className="mx-auto mb-4 text-slate-300" />
          <h3 className="text-xl font-bold text-slate-500">{t('No customers found', 'کوئی کسٹمر نہیں ملا')}</h3>
          <p className="text-slate-400 mt-1 text-sm">{t('Phone number ko 0 se shuru kar ke search karein', 'فون نمبر 0 سے شروع کر کے تلاش کریں')}</p>
        </div>
      )}
    </div>
  );
};

export default ViewCustomers;
