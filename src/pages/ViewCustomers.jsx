import React, { useState, useEffect } from 'react';
import { useLocalState } from '../context/useLocalState';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Phone, MapPin, ArrowRight, Loader2, UserPlus } from 'lucide-react';
import { Link } from 'react-router-dom';
import { isDigitsOnly, matchesPhoneSearch, splitPhoneMatch } from '../utils/phoneSearch';
import { matchesNameSearch, sortByNameMatch, highlightNameMatch } from '../utils/nameSearch';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '../context/LanguageContext';
import PaginationControls from '../components/PaginationControls';
import DirectoryHero from '../components/DirectoryHero';
import PageWaveBackdrop from '../components/PageWaveBackdrop';
import { getBadgeColor } from '../utils/badgeColors';

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

// One row per customer, like the Workers list — compact enough that we can
// show more per page than the old card grid did.
const PAGE_SIZE = 10;

// A single contact-list row: avatar initial with a small colour badge tucked
// at its corner (echoing the little category icons in the reference mock),
// name + a two-line subtitle (address, phone), and a rounded status pill
// on the right that doubles as a "view profile" hint on hover.
const CustomerRow = ({ c, searchTerm, searchingByPhone, language, tn, t }) => {
  const badge = getBadgeColor(c._id || c.name);
  return (
    <Link
      to={`/customer/${c._id}`}
      className="flex items-center gap-3 sm:gap-5 px-3 py-3 sm:px-6 sm:py-4 hover:bg-primary/5 transition-colors min-w-0 group"
    >
      <div className="relative flex-shrink-0">
        <div className="w-11 h-11 sm:w-14 sm:h-14 bg-primary/10 rounded-full flex items-center justify-center text-primary text-base sm:text-xl font-black ring-2 ring-white shadow-sm">
          {c.name?.charAt(0).toUpperCase() || '?'}
        </div>
        <span
          className="absolute -bottom-0.5 -right-0.5 w-4 h-4 sm:w-5 sm:h-5 rounded-full flex items-center justify-center ring-2 ring-white"
          style={{ background: badge.bg }}
        >
          <Phone size={9} className="text-white" />
        </span>
      </div>
      <div className="flex-1 min-w-0">
        <h3 className="text-sm sm:text-lg font-black uppercase truncate" style={{ color: '#0E606E' }}>
          {language === 'ur' ? tn(c.name) : (searchingByPhone ? c.name : <HighlightedName name={c.name} term={searchTerm} />)}
        </h3>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-0.5">
          {c.familyName && (
            <p className="text-slate-400 font-medium text-[11px] sm:text-xs flex items-center gap-1 truncate">
              <MapPin size={10} className="flex-shrink-0" /> {language === 'ur' ? tn(c.familyName) : c.familyName}
            </p>
          )}
          <p className="text-slate-400 font-medium text-[11px] sm:text-xs flex items-center gap-1 truncate">
            <Phone size={10} className="flex-shrink-0" />
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
      </div>
      <span
        className="hidden sm:flex items-center justify-center w-9 h-9 rounded-full flex-shrink-0 transition-all group-hover:scale-105"
        style={{ background: `${badge.bg}14`, color: badge.bg }}
        title={t('customers.directory.viewProfile')}
      >
        <ArrowRight size={16} />
      </span>
      <ArrowRight size={16} className="sm:hidden text-slate-300 flex-shrink-0" />
    </Link>
  );
};

const ViewCustomers = () => {
  const { customers, loading } = useLocalState();
  const { t } = useTranslation();
  const { language, tn, t: tb } = useLanguage();
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
        <p className="text-slate-500 font-bold animate-pulse uppercase tracking-tighter">{t('customers.directory.loading')}</p>
      </div>
    );
  }

  return (
    <PageWaveBackdrop>
      <motion.header
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: 'easeOut' }}
      >
        <DirectoryHero
          eyebrow={tb('Directory', 'ڈائریکٹری')}
          heading={t('customers.directory.title')}
          description={t('customers.directory.subtitle')}
          cta={
            <Link
              to="/add-customer"
              className="inline-flex items-center gap-2 bg-white text-primary font-black text-sm px-6 py-3.5 rounded-full shadow-lg hover:scale-[1.03] transition-transform"
            >
              <UserPlus size={16} /> {tb('Add Customer', 'کسٹمر شامل کریں')}
            </Link>
          }
          rightContent={
            <div className="bg-white rounded-2xl shadow-xl border border-slate-100 p-5 space-y-4">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{tb('Find a customer', 'کسٹمر تلاش کریں')}</p>
              <div className="flex items-stretch border border-slate-200 rounded-xl overflow-hidden bg-slate-50 focus-within:ring-2 focus-within:ring-primary/20 transition-all">
                <div className="flex items-center justify-center px-3.5 bg-slate-100/80 border-r border-slate-200">
                  <Search size={16} className="text-slate-400" />
                </div>
                <input
                  type="text"
                  placeholder={t('customers.directory.searchPlaceholder')}
                  className="flex-1 px-3.5 py-3.5 bg-transparent outline-none text-slate-700 placeholder:text-slate-400 text-sm"
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                />
              </div>
              <p className="text-xs text-slate-400 font-medium">
                {customers.length} {tb('customers total', 'کل کسٹمرز')}
              </p>
            </div>
          }
        />
      </motion.header>

      {/* Newest first — backend already sorts by createdAt desc. Contact-list
          style rows (same pattern as the Workers list): just enough to
          identify the customer and jump to their full profile.
          Editing/deleting happens only from that profile. */}
      <div className="glass-card rounded-xl divide-y divide-slate-100 overflow-hidden">
        <AnimatePresence mode="popLayout">
          {pageCustomers.map((c, i) => (
            <motion.div
              layout
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3, delay: i * 0.03, ease: 'easeOut' }}
              key={c._id}
            >
              <CustomerRow
                c={c}
                searchTerm={searchTerm}
                searchingByPhone={searchingByPhone}
                language={language}
                tn={tn}
                t={t}
              />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Pagination — only shown once there's more than one page's worth of
          results, so it doesn't clutter small directories. */}
      <PaginationControls
        label={t('customers.directory.page')}
        currentPage={safePage}
        totalPages={totalPages}
        onPrev={() => setPage(p => Math.max(1, p - 1))}
        onNext={() => setPage(p => Math.min(totalPages, p + 1))}
        className="mt-2"
      />

      {filteredCustomers.length === 0 && (
        <div className="text-center py-20 bg-white/80 backdrop-blur-sm rounded-xl border-2 border-dashed border-slate-200">
          <Search size={32} className="mx-auto mb-4 text-slate-300" />
          <h3 className="text-xl font-bold text-slate-500">{t('customers.directory.noCustomersFound')}</h3>
          <p className="text-slate-400 mt-1 text-sm">{t('customers.directory.noCustomersHint')}</p>
        </div>
      )}
    </PageWaveBackdrop>
  );
};

export default ViewCustomers;
