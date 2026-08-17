import React from 'react';
import { motion } from 'framer-motion';
import { useLocalState } from '../context/useLocalState';
import { useNavigate } from 'react-router-dom';
import { Users, ClipboardList, CheckCircle, Scissors, UserPlus, Loader2, Clock, PlusCircle, ArrowRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { STAGES } from '../utils/stages';
import { useLanguage } from '../context/LanguageContext';

// Shared entrance animation — a gentle rise + fade, staggered by index so
// lists of cards feel like they're settling into place rather than
// popping in all at once.
const fadeUp = (i = 0) => ({
  initial: { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.35, delay: i * 0.05, ease: 'easeOut' },
});

// A short colored tick before each section title — the same wayfinding
// device used on the Customer/Worker portals, so the admin's dashboard
// reads as part of the same product rather than an older, separate style.
const SectionHeading = ({ children, action }) => (
  <div className="flex items-center justify-between mb-6">
    <div className="flex items-center gap-2.5">
      <span className="w-1.5 h-6 rounded-full bg-primary flex-shrink-0" />
      <h2 className="font-display text-xl font-extrabold text-slate-900">{children}</h2>
    </div>
    {action}
  </div>
);

const Dashboard = () => {
  const { getStats, orders, customers, workers, loading } = useLocalState();
  const navigate = useNavigate();
  const { t } = useTranslation();
  // `td` reads bilingual DATA values saved in the DB as "English / اردو"
  // (order type, etc.) — that's a data-formatting helper, not a UI string
  // translation, so it stays on the old LanguageContext for now regardless
  // of which translation system a given page's UI strings use.
  const { td, tn } = useLanguage();
  const stats = getStats();

  if (loading) {
    return (
      <div className="h-[60vh] flex flex-col items-center justify-center space-y-4">
        <Loader2 className="animate-spin text-primary" size={48} />
        <p className="text-slate-500 font-bold animate-pulse uppercase tracking-tighter">{t('dashboard.loading')}</p>
      </div>
    );
  }

  // ✅ Sort by most recently *updated* (falling back to createdAt for
  // orders that were never touched again) instead of only createdAt.
  // Previously this sorted purely by creation date, so an order that just
  // got marked Completed (or moved to a new stage) wouldn't surface here
  // at all if it happened to be created a while ago — it stayed buried
  // behind newer-but-untouched orders. Now finishing/updating an order
  // brings it back to the top as recent activity.
  // Recent Orders used to be simply "the 8 most recently updated orders" —
  // but if, say, 3 orders are in Sewing and 2 in Embroidery and they all
  // happen to have been touched more recently than the one order sitting
  // in Ironing, that Ironing order would get pushed off the list entirely
  // and the admin would never see it here even though it's actively in
  // progress. Now every active stage that has at least one order is
  // guaranteed a spot (its most recently updated order), and any
  // remaining slots are filled with the overall most recently updated
  // orders (including Pending/Completed/Delivered) so the list still
  // feels current.
  const byRecency = (a, b) => new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt);
  const RECENT_ORDERS_LIMIT = 3;
  const activeByStage = STAGES
    .map(stage => [...orders].filter(o => o.orderStatus === 'Active' && o.workStage === stage).sort(byRecency)[0])
    .filter(Boolean);
  const remainingSlots = Math.max(0, RECENT_ORDERS_LIMIT - activeByStage.length);
  const guaranteedIds = new Set(activeByStage.map(o => o._id));
  const rest = [...orders]
    .filter(o => !guaranteedIds.has(o._id))
    .sort(byRecency)
    .slice(0, remainingSlots);
  const recentOrders = [...activeByStage, ...rest].sort(byRecency).slice(0, RECENT_ORDERS_LIMIT);

  const getCustomerName = (id) => {
    const c = customers.find(c => c._id?.toString() === id?.toString());
    return c ? tn(c.name) : t('dashboard.unknown');
  };

  const statusColor = (s) => ({
    'Pending':              'bg-amber-100 text-amber-700',
    'Active':               'bg-blue-100 text-blue-700',
    'In Progress':          'bg-indigo-100 text-indigo-700',
    'Completed':            'bg-emerald-100 text-emerald-700',
    'Received By Customer': 'bg-purple-100 text-purple-700',
  }[s] || 'bg-slate-100 text-slate-600');

  // Order status values are fixed internal strings (used for filtering,
  // matching the backend, etc.) — this only maps them to Urdu for display
  // via the "orderStatus.<value>" keys in locales/en.json + ur.json, and
  // never changes the underlying value anything else depends on.
  // defaultValue falls back to the raw status if a new status is ever
  // added without a matching translation key yet.
  const statusLabel = (s) => t(`orderStatus.${s}`, { defaultValue: s });

  // ── Trend badge — only for a metric where a real, honest comparison
  // exists (no invented percentages). Completed Today vs yesterday is a
  // real diff between two actual daily counts. Pending/Active Orders and
  // Total Customers are point-in-time snapshots with no natural "vs what"
  // to compare against, so they stay plain.
  const now = new Date();
  const yesterday = new Date(now); yesterday.setDate(now.getDate() - 1);
  const completedYesterday = orders.filter(o =>
    ['Completed', 'Received By Customer'].includes(o.orderStatus) &&
    new Date(o.updatedAt || o.createdAt).toDateString() === yesterday.toDateString()
  ).length;
  const completedDiff = stats.completedToday - completedYesterday;

  const statCards = [
    {
      icon: Users, label: t('dashboard.stats.totalCustomers'), value: stats.totalCustomers,
      color: 'bg-blue-500', shadow: 'shadow-blue-200', onClick: () => navigate('/view-customers'),
    },
    { icon: Clock, label: t('dashboard.stats.pendingOrders'), value: stats.pendingOrders, color: 'bg-amber-500', shadow: 'shadow-amber-200', onClick: () => navigate('/view-orders', { state: { statusFilter: 'Pending' } }) },
    { icon: ClipboardList, label: t('dashboard.stats.activeOrders'), value: stats.activeOrders, color: 'bg-primary', shadow: 'shadow-primary/20', onClick: () => navigate('/view-orders', { state: { statusFilter: 'Active' } }) },
    {
      icon: CheckCircle, label: t('dashboard.stats.completedToday'), value: stats.completedToday,
      color: 'bg-emerald-500', shadow: 'shadow-emerald-200', onClick: () => navigate('/view-orders', { state: { statusFilter: 'CompletedToday' } }),
      trend: completedDiff !== 0 ? `${completedDiff > 0 ? '+' : ''}${completedDiff} ${t('dashboard.vsYesterday', 'کل کے مقابلے میں')}` : null,
      trendType: completedDiff > 0 ? 'up' : 'down',
    },
  ];

  return (
    <div className="space-y-10">
      {/* Title and the New Order / New Customer buttons stay in one
          horizontal row at every width, and the buttons always keep their
          label (icon + text) — just at a smaller size/padding on phones —
          instead of collapsing to icon-only, which looked cut off/unclear. */}
      <motion.header {...fadeUp(0)} className="flex flex-row items-center justify-between gap-2 sm:gap-3">
        <div className="min-w-0 flex-1">
          <h1 className="font-display text-lg min-[400px]:text-xl sm:text-3xl lg:text-4xl font-extrabold text-slate-900 truncate">{t('dashboard.title')}</h1>
          <p className="hidden sm:block text-slate-500 mt-1.5 font-medium truncate">{t('dashboard.tailoringManagement')}</p>
        </div>
        <div className="flex flex-row items-center gap-1.5 sm:gap-4 flex-shrink-0">
          <button
            onClick={() => navigate('/add-order')}
            className="primary-btn flex items-center justify-center gap-1 sm:gap-3 px-2.5 py-2 sm:px-6 sm:py-3.5 rounded-xl text-[11px] sm:text-base shadow-sm whitespace-nowrap flex-shrink-0"
          >
            <PlusCircle className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" /> {t('dashboard.newOrder')}
          </button>
          <button
            onClick={() => navigate('/add-customer')}
            className="primary-btn flex items-center justify-center gap-1 sm:gap-3 px-2.5 py-2 sm:px-6 sm:py-3.5 rounded-xl text-[11px] sm:text-base shadow-sm whitespace-nowrap flex-shrink-0"
          >
            <UserPlus className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" /> {t('dashboard.newCustomer')}
          </button>
        </div>
      </motion.header>


      {/* Stat Cards — a horizontally scrollable single row on mobile (each
          card a fixed width, swipe to see the rest) instead of stacking
          full-width, since 4 stacked cards ate too much vertical space on
          phones. From sm upward this reverts to the original grid exactly
          as before. */}
      <div className="flex sm:grid overflow-x-auto sm:overflow-visible sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 -mx-4 px-4 sm:mx-0 sm:px-0 pb-2 sm:pb-0 snap-x snap-mandatory sm:snap-none scrollbar-hide">
        {statCards.map(({ icon: Icon, label, value, color, shadow, onClick, trend, trendType }, i) => (
          <motion.button
            key={label}
            {...fadeUp(i + 1)}
            onClick={onClick}
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.98 }}
            className="glass-card relative w-44 flex-shrink-0 snap-start sm:w-auto sm:flex-shrink sm:snap-align-none p-5 sm:p-6 rounded-xl group text-left hover:shadow-lg transition-shadow"
          >
            <div className="flex items-start justify-between gap-2">
              {trend ? (
                <span className={`inline-flex items-center gap-1 text-[10px] font-black px-2 py-1 rounded-full ${trendType === 'up' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                  {trendType === 'up' ? '↑' : '↓'} {trend}
                </span>
              ) : <span />}
              <div className={`w-10 h-10 rounded-full ${color} shadow-lg ${shadow} flex items-center justify-center text-white group-hover:rotate-6 transition-transform flex-shrink-0`}>
                <Icon size={18} />
              </div>
            </div>
            <h3 className="font-display text-2xl sm:text-3xl font-extrabold text-slate-900 mt-4">{value}</h3>
            <p className="text-slate-500 font-bold text-[11px] uppercase tracking-widest leading-tight mt-1">{label}</p>
          </motion.button>
        ))}
      </div>


      {/* Order Flow — a live pipeline view of how many orders sit at each
          stage right now, so the admin can see the whole workflow (Pending
          → Cutting → Sewing → Embroidery → Ironing → Completed → Delivered)
          at a glance instead of digging into the Orders list. Replaces the
          old Team Overview block, which just duplicated the Workers page. */}
      <motion.div {...fadeUp(5)} className="glass-card p-5 sm:p-7 rounded-xl">
        <SectionHeading
          action={<button onClick={() => navigate('/view-orders')} className="text-primary font-bold text-sm hover:underline whitespace-nowrap">{t('dashboard.viewAll')}</button>}
        >
          {t('dashboard.orderFlow')}
        </SectionHeading>
        {/* Single scrollable row on mobile too now (swipe to see later
            stages) instead of stacking vertically full-width — a vertical
            stack of 5 boxes ate too much space on phones. From lg upward
            this is unchanged: the original flex-1 row that fits without
            scrolling. */}
        <div className="flex flex-row overflow-x-auto lg:overflow-visible items-stretch gap-2 pb-1 lg:pb-0 snap-x snap-mandatory lg:snap-none scrollbar-hide">
          {[
            { key: 'Pending', label: t('stages.Pending'), count: stats.pendingOrders, color: 'bg-amber-500', light: 'bg-amber-50 text-amber-700 border-amber-200' },
            ...STAGES.map(stage => ({
              key: stage,
              label: t(`stages.${stage}`, { defaultValue: stage }),
              count: orders.filter(o => o.orderStatus === 'Active' && o.workStage === stage).length,
              color: 'bg-indigo-500',
              light: 'bg-indigo-50 text-indigo-700 border-indigo-200',
            })),
            // Completed and Delivered used to be shown here too (7 boxes
            // total), but that made the dashboard pipeline crowded. Only
            // the first 5 steps (Pending → Cutting → Sewing → Embroidery →
            // Ironing) show here now; Completed/Delivered counts are still
            // fully visible via "View All" → View Orders.
          ].map((step, i, arr) => (
            <React.Fragment key={step.key}>
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3, delay: i * 0.06, ease: 'easeOut' }}
                whileHover={{ y: -3 }}
                className={`w-28 flex-shrink-0 snap-start lg:snap-align-none lg:flex-1 lg:w-auto lg:min-w-[110px] rounded-xl border p-3 sm:p-4 text-center ${step.light}`}
              >
                <p className="font-display text-2xl font-extrabold">{step.count}</p>
                <p className="text-[10px] font-black uppercase tracking-widest mt-1">{step.label}</p>
              </motion.div>
              {i < arr.length - 1 && (
                <div className="flex items-center justify-center flex-shrink-0 text-slate-300 px-0.5 py-0.5">
                  <ArrowRight size={18} />
                </div>
              )}
            </React.Fragment>
          ))}
        </div>
      </motion.div>

      <div className="grid grid-cols-1 gap-8">
        {/* Recent Orders — Quick Actions removed here since every one of
            those shortcuts already lives in the sidebar navigation. */}
        <motion.div {...fadeUp(6)} className="glass-card p-5 sm:p-7 rounded-xl">
          <SectionHeading
            action={<button onClick={() => navigate('/view-orders')} className="text-primary font-bold text-sm hover:underline">{t('dashboard.viewAll')}</button>}
          >
            {t('dashboard.recentOrders')}
          </SectionHeading>
          {recentOrders.length === 0 ? (
            <div className="text-center py-10 text-slate-400">
              <ClipboardList size={36} className="mx-auto mb-3 opacity-30" />
              <p className="font-medium">{t('dashboard.noOrdersYet')}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentOrders.map((o, i) => (
                <motion.div
                  key={o._id}
                  {...fadeUp(i * 0.4)}
                  onClick={() => navigate('/view-orders')}
                  whileHover={{ x: 4 }}
                  className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer group"
                >
                  <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary flex-shrink-0">
                    <Scissors size={18} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-slate-800 text-sm truncate">{td(o.orderType)}</p>
                    <p className="text-xs text-slate-500 font-medium truncate">
                      {getCustomerName(o.customerId)}
                      {o.assignedWorkerName && (
                        <span className="text-slate-400">
                          {' · '}{o.assignedWorkerName}
                          {o.workStage && o.orderStatus === 'Active' && (
                            <span className="text-primary/70 font-bold"> ({t(`stages.${o.workStage}`, { defaultValue: o.workStage })})</span>
                          )}
                        </span>
                      )}
                    </p>
                  </div>
                  <span className={`text-[10px] font-black uppercase px-3 py-1 rounded-full flex-shrink-0 whitespace-nowrap ${statusColor(o.orderStatus)}`}>
                    {statusLabel(o.orderStatus)}
                  </span>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default Dashboard;
