import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useLocalState } from '../context/useLocalState';
import { motion, AnimatePresence } from 'framer-motion';
import DesignThumb from '../components/DesignThumb';
import PaginationControls from '../components/PaginationControls';
import {
  ClipboardList, Calendar, HardHat, ArrowRight, Loader2, Scissors, Search, X,
} from 'lucide-react';
import { getAdminStatusLabel, getAdminStatusColor } from '../utils/stages';
import { matchesNameSearch, highlightNameMatch } from '../utils/nameSearch';
import { useLanguage } from '../context/LanguageContext';
import { useTranslation } from 'react-i18next';

// Highlights the matched portion of order type / customer name — same
// treatment used across Customers/Designs search so results look and
// behave consistently everywhere in the app.
const HighlightedName = ({ name, term }) => (
  <>
    {highlightNameMatch(name, term).map((seg, i) =>
      seg.match
        ? <span key={i} className="bg-yellow-200 text-slate-800 rounded px-0.5">{seg.text}</span>
        : <span key={i}>{seg.text}</span>
    )}
  </>
);

// One row per order — same compact directory style as Customers/Workers,
// with just enough to identify + spot-check an order at a glance. Every
// action (Process Order, Assign Worker, Mark Done, Edit, Delete, ...) lives
// on the order's own detail page now, opened by clicking the row — nothing
// clutters the list itself.
const PAGE_SIZE = 5;

const OrderRow = ({ order, customerName, searchTerm, language, tn, td, t }) => {
  const navigate = useNavigate();
  return (
    <div
      onClick={() => navigate(`/order/${order._id}`)}
      className="flex items-center justify-between gap-3 sm:gap-4 px-3.5 py-3 sm:px-6 sm:py-4 cursor-pointer hover:bg-primary/5 transition-colors min-w-0"
    >
      <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1">
        {order.selectedDesignImage ? (
          <div className="w-10 h-10 sm:w-14 sm:h-14 flex-shrink-0 rounded-xl overflow-hidden bg-white border-2 border-primary/10 shadow-sm">
            <DesignThumb src={order.selectedDesignImage} alt={td(order.orderType)} className="w-full h-full object-cover object-center" iconSize={18} />
          </div>
        ) : (
          <div className="w-10 h-10 sm:w-14 sm:h-14 bg-primary/10 rounded-xl flex items-center justify-center text-primary flex-shrink-0">
            <Scissors size={18} />
          </div>
        )}

        <div className="flex-1 min-w-0">
          <h3 className="text-xs sm:text-base font-black text-slate-800 uppercase truncate">
            <HighlightedName name={td(order.orderType)} term={searchTerm} />
          </h3>
          <div className="text-slate-500 font-medium text-[11px] sm:text-xs truncate flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-0.5">
            <span className="truncate">{language === 'ur' ? tn(customerName) : <HighlightedName name={customerName} term={searchTerm} />}</span>
            {order.assignedWorkerName && (
              <span className="flex items-center gap-1 text-slate-400 text-[10px] sm:text-xs truncate">
                <HardHat size={11} className="flex-shrink-0" /> {language === 'ur' ? tn(order.assignedWorkerName) : order.assignedWorkerName}
              </span>
            )}
          </div>
          <p className="text-slate-400 font-medium text-[10px] sm:text-xs flex items-center gap-1 mt-0.5">
            <Calendar size={11} className="flex-shrink-0" />
            {new Date(order.createdAt).toLocaleDateString()}
          </p>
        </div>
      </div>

      <div className="flex flex-col items-end gap-1 flex-shrink-0">
        <span className={`px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full text-[8px] sm:text-[10px] font-black uppercase tracking-widest border-2 whitespace-nowrap ${getAdminStatusColor(order)}`}>
          {getAdminStatusLabel(order, language)}
        </span>
      </div>
    </div>
  );
};

const ViewOrders = () => {
  const location = useLocation();
  const { orders, customers, loading } = useLocalState();
  const { t } = useTranslation();
  const { td, tn, language } = useLanguage();
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);

  const [statusFilter, setStatusFilter] = useState(location.state?.statusFilter || null);
  useEffect(() => {
    if (location.state?.statusFilter) {
      setStatusFilter(location.state.statusFilter);
      window.history.replaceState({}, '');
    }
  }, [location.state]);

  const STATUS_FILTER_LABELS = {
    Pending: t('viewOrders.pendingOrders'),
    Active: t('viewOrders.activeOrders'),
    CompletedToday: t('viewOrders.completedToday'),
  };
  const matchesStatusFilter = (order) => {
    if (!statusFilter) return true;
    if (statusFilter === 'Pending') return order.orderStatus === 'Pending';
    if (statusFilter === 'Active') return order.orderStatus === 'Active';
    if (statusFilter === 'CompletedToday') {
      return ['Completed', 'Received By Customer'].includes(order.orderStatus) &&
        new Date(order.updatedAt || order.createdAt).toDateString() === new Date().toDateString();
    }
    return true;
  };

  const getCustomerName = (id) => {
    const c = customers.find(c => c._id === id);
    return c ? c.name : t('viewOrders.unknownCustomer');
  };

  const matchesOrderSearch = (order, term) => {
    if (!term.trim()) return true;
    const customerName = getCustomerName(order.customerId);
    return (
      matchesNameSearch(order.orderType, term) ||
      matchesNameSearch(customerName, term) ||
      matchesNameSearch(order.assignedWorkerName, term)
    );
  };

  const searchedOrders = orders.filter(o => matchesStatusFilter(o) && matchesOrderSearch(o, searchTerm));
  const sortedOrders = [...searchedOrders].sort((a, b) =>
    new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
  );

  const totalPages = Math.max(1, Math.ceil(sortedOrders.length / PAGE_SIZE));
  useEffect(() => { setPage(1); }, [searchTerm, statusFilter]);
  const safePage = Math.min(page, totalPages);
  const pageOrders = sortedOrders.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  if (loading) {
    return (
      <div className="h-[60vh] flex flex-col items-center justify-center space-y-4">
        <Loader2 className="animate-spin text-primary" size={48} />
        <p className="text-slate-500 font-bold animate-pulse uppercase tracking-tighter">{t('viewOrders.loadingOrders')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 sm:space-y-8">
      <motion.header
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: 'easeOut' }}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 sm:gap-6 min-w-0"
      >
        <div className="min-w-0">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-800 tracking-tighter uppercase truncate">{t('viewOrders.orderQueue')}</h1>
          <p className="text-slate-500 mt-1 font-medium italic text-xs sm:text-base truncate">{t('viewOrders.managingFlowCraftsmanship')}</p>
        </div>

        {/* Compact Search Bar */}
        <div className="flex items-stretch border border-slate-200 rounded-xl overflow-hidden bg-white shadow-sm w-full sm:w-64 md:w-72 flex-shrink-0 focus-within:ring-2 focus-within:ring-primary/20 transition-all min-w-0">
          <div className="flex items-center justify-center px-3 bg-slate-50 border-r border-slate-200 flex-shrink-0">
            <Search size={16} className="text-slate-400" />
          </div>
          <input
            type="text"
            placeholder={t('viewOrders.orderTypeCustomerYaWorkerSe')}
            className="w-full px-3 py-2.5 bg-transparent outline-none text-slate-700 placeholder:text-slate-400 text-xs sm:text-sm min-w-0 truncate"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
      </motion.header>

      {statusFilter && (
        <div className="flex items-center gap-3">
          <span className="text-slate-400 text-xs sm:text-sm font-bold">{t('viewOrders.filter')}</span>
          <span className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-primary/10 text-primary text-xs font-black uppercase tracking-wider">
            {STATUS_FILTER_LABELS[statusFilter] || statusFilter}
            <button onClick={() => setStatusFilter(null)} className="hover:text-primary-dark">
              <X size={14} />
            </button>
          </span>
        </div>
      )}

      {searchTerm.trim() && (
        <p className="text-slate-400 text-xs sm:text-sm font-bold -mt-3 sm:-mt-4">
          {sortedOrders.length} {t('viewOrders.resultCount', { count: sortedOrders.length })} {t('viewOrders.forLabel')} "{searchTerm}"
        </p>
      )}

      {orders.length === 0 ? (
        <div className="text-center py-20 sm:py-32 glass-card rounded-xl border-4 border-dashed border-slate-100 bg-transparent">
          <div className="w-16 h-16 sm:w-24 sm:h-24 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6 text-slate-300">
            <ClipboardList size={36} />
          </div>
          <h3 className="text-xl sm:text-3xl font-black text-slate-400 uppercase tracking-tighter">{t('viewOrders.yourQueueEmpty')}</h3>
          <p className="text-slate-400 font-medium mt-1.5 text-xs sm:text-sm">{t('viewOrders.readyNewMasterpiece')}</p>
        </div>
      ) : sortedOrders.length === 0 ? (
        <div className="text-center py-20 sm:py-32 glass-card rounded-xl border-4 border-dashed border-slate-100 bg-transparent">
          <div className="w-16 h-16 sm:w-24 sm:h-24 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6 text-slate-300">
            <Search size={36} />
          </div>
          <h3 className="text-xl sm:text-3xl font-black text-slate-400 uppercase tracking-tighter">{t('viewOrders.noMatchingOrders')}</h3>
          <p className="text-slate-400 font-medium mt-1.5 text-xs sm:text-sm">{t('viewOrders.searchBadalKarDobaraKoshishKarein')}</p>
        </div>
      ) : (
        <>
          <div className="glass-card rounded-xl divide-y divide-slate-100 overflow-hidden">
            <AnimatePresence mode="popLayout">
              {pageOrders.map((order, i) => (
                <motion.div
                  key={order._id}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3, delay: i * 0.03, ease: 'easeOut' }}
                  className="group"
                >
                  <OrderRow
                    order={order}
                    customerName={getCustomerName(order.customerId)}
                    searchTerm={searchTerm}
                    language={language}
                    tn={tn}
                    td={td}
                    t={t}
                  />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          <PaginationControls
            currentPage={safePage}
            totalPages={totalPages}
            onPrev={() => setPage(p => Math.max(1, p - 1))}
            onNext={() => setPage(p => Math.min(totalPages, p + 1))}
            className="pt-2"
          />
        </>
      )}
    </div>
  );
};

export default ViewOrders;
