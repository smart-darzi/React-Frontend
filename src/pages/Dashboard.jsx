import React from 'react';
import { motion } from 'framer-motion';
import { useLocalState } from '../context/useLocalState';
import { useNavigate } from 'react-router-dom';
import { Users, ClipboardList, CheckCircle, Scissors, UserPlus, Loader2, Clock, PlusCircle, ArrowRight } from 'lucide-react';
import { STAGES, STAGE_URDU_LABELS } from '../utils/stages';
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
  const { t, td } = useLanguage();
  const stats = getStats();

  if (loading) {
    return (
      <div className="h-[60vh] flex flex-col items-center justify-center space-y-4">
        <Loader2 className="animate-spin text-primary" size={48} />
        <p className="text-slate-500 font-bold animate-pulse uppercase tracking-tighter">{t('Loading Dashboard...', 'ڈیش بورڈ لوڈ ہو رہا ہے...')}</p>
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
    return c ? c.name : t('Unknown', 'نامعلوم');
  };

  const statusColor = (s) => ({
    'Pending':              'bg-amber-100 text-amber-700',
    'Active':               'bg-blue-100 text-blue-700',
    'In Progress':          'bg-indigo-100 text-indigo-700',
    'Completed':            'bg-emerald-100 text-emerald-700',
    'Received By Customer': 'bg-purple-100 text-purple-700',
  }[s] || 'bg-slate-100 text-slate-600');

  // Order status values are fixed internal strings (used for filtering,
  // matching the backend, etc.) — this only maps them to Urdu for display,
  // it never changes the underlying value anything else depends on.
  const statusLabel = (s) => t(s, {
    'Pending': 'زیر التوا',
    'Active': 'فعال',
    'In Progress': 'جاری',
    'Completed': 'مکمل',
    'Received By Customer': 'حوالے شدہ',
  }[s] || s);

  const statCards = [
    { icon: Users,         label: t('Total Customers', 'کل کسٹمر'),   value: stats.totalCustomers, color: 'bg-blue-500',    shadow: 'shadow-blue-200',  onClick: () => navigate('/view-customers') },
    { icon: Clock,         label: t('Pending Orders', 'زیر عمل آرڈرز'),      value: stats.pendingOrders,  color: 'bg-amber-500',  shadow: 'shadow-amber-200', onClick: () => navigate('/view-orders', { state: { statusFilter: 'Pending' } }) },
    { icon: ClipboardList, label: t('Active Orders', 'فعال آرڈرز'),    value: stats.activeOrders,   color: 'bg-primary',    shadow: 'shadow-primary/20', onClick: () => navigate('/view-orders', { state: { statusFilter: 'Active' } }) },
    { icon: CheckCircle,   label: t('Completed Today', 'آج مکمل'),     value: stats.completedToday, color: 'bg-emerald-500',shadow: 'shadow-emerald-200', onClick: () => navigate('/view-orders', { state: { statusFilter: 'CompletedToday' } }) },
  ];

  return (
    <div className="space-y-10">
      <motion.header {...fadeUp(0)} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <p className="text-primary/70 text-[11px] font-bold uppercase tracking-[0.2em] mb-1">{t('Smart Master Admin', 'اسمارٹ ماسٹر ایڈمن')}</p>
          <h1 className="font-display text-3xl sm:text-4xl font-extrabold text-slate-900">{t('Dashboard', 'ڈیش بورڈ')}</h1>
          <p className="text-slate-500 mt-1.5 font-medium">{t('Tailoring Management', 'درزی کا انتظام')}</p>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4">
          <button
            onClick={() => navigate('/add-order')}
            className="flex items-center justify-center gap-3 px-6 py-3.5 rounded-xl font-bold bg-white text-primary border border-primary/20 shadow-sm hover:bg-primary-light transition-all whitespace-nowrap"
          >
            <PlusCircle size={20} /> {t('New Order', 'نیا آرڈر')}
          </button>
          <button
            onClick={() => navigate('/add-customer')}
            className="primary-btn px-6 py-3.5 rounded-xl flex items-center justify-center gap-3 shadow-sm whitespace-nowrap"
          >
            <UserPlus size={20} /> {t('New Customer', 'نیا کسٹمر')}
          </button>
        </div>
      </motion.header>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        {statCards.map(({ icon: Icon, label, value, color, shadow, onClick }, i) => (
          <motion.button
            key={label}
            {...fadeUp(i + 1)}
            onClick={onClick}
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.98 }}
            className="glass-card p-5 sm:p-6 rounded-2xl flex items-center justify-between group text-left hover:shadow-lg transition-shadow"
          >
            <div className="min-w-0">
              <p className="text-slate-500 font-bold text-[11px] uppercase tracking-widest leading-tight">{label}</p>
              <h3 className="font-display text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1.5">{value}</h3>
            </div>
            <div className={`w-12 h-12 rounded-xl ${color} shadow-lg ${shadow} flex items-center justify-center text-white group-hover:rotate-6 transition-transform flex-shrink-0`}>
              <Icon size={22} />
            </div>
          </motion.button>
        ))}
      </div>

      {/* Order Flow — a live pipeline view of how many orders sit at each
          stage right now, so the admin can see the whole workflow (Pending
          → Cutting → Sewing → Embroidery → Ironing → Completed → Delivered)
          at a glance instead of digging into the Orders list. Replaces the
          old Team Overview block, which just duplicated the Workers page. */}
      <motion.div {...fadeUp(5)} className="glass-card p-5 sm:p-7 rounded-[2rem]">
        <SectionHeading
          action={<button onClick={() => navigate('/view-orders')} className="text-primary font-bold text-sm hover:underline whitespace-nowrap">{t('View All →', 'سب دیکھیں ←')}</button>}
        >
          {t('Order Flow', 'آرڈر کا بہاؤ')}
        </SectionHeading>
        {/* Vertical stack on mobile (each stage full-width, arrow pointing
            down to the next one) — a 7-step horizontal pipeline is cramped
            and scroll-y on a phone screen. From lg upward it's the original
            horizontal row with side-by-side arrows. */}
        <div className="flex flex-col lg:flex-row items-stretch gap-2">
          {[
            { key: 'Pending', label: t('Pending', 'زیر التوا'), count: stats.pendingOrders, color: 'bg-amber-500', light: 'bg-amber-50 text-amber-700 border-amber-200' },
            ...STAGES.map(stage => ({
              key: stage,
              label: t(stage, STAGE_URDU_LABELS[stage] || stage),
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
                className={`lg:flex-1 w-full lg:min-w-[110px] rounded-xl border p-3 sm:p-4 text-center flex-shrink-0 ${step.light}`}
              >
                <p className="font-display text-2xl font-extrabold">{step.count}</p>
                <p className="text-[10px] font-black uppercase tracking-widest mt-1">{step.label}</p>
              </motion.div>
              {i < arr.length - 1 && (
                <div className="flex items-center justify-center flex-shrink-0 text-slate-300 px-0.5 py-0.5">
                  <ArrowRight size={18} className="rotate-90 lg:rotate-0" />
                </div>
              )}
            </React.Fragment>
          ))}
        </div>
      </motion.div>

      <div className="grid grid-cols-1 gap-8">
        {/* Recent Orders — Quick Actions removed here since every one of
            those shortcuts already lives in the sidebar navigation. */}
        <motion.div {...fadeUp(6)} className="glass-card p-5 sm:p-7 rounded-[2rem]">
          <SectionHeading
            action={<button onClick={() => navigate('/view-orders')} className="text-primary font-bold text-sm hover:underline">{t('View All →', 'سب دیکھیں ←')}</button>}
          >
            {t('Recent Orders', 'حالیہ آرڈرز')}
          </SectionHeading>
          {recentOrders.length === 0 ? (
            <div className="text-center py-10 text-slate-400">
              <ClipboardList size={36} className="mx-auto mb-3 opacity-30" />
              <p className="font-medium">{t('No orders yet', 'ابھی کوئی آرڈر نہیں')}</p>
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
                            <span className="text-primary/70 font-bold"> ({t(o.workStage, STAGE_URDU_LABELS[o.workStage] || o.workStage)})</span>
                          )}
                        </span>
                      )}
                    </p>
                  </div>
                  <span className={`text-[10px] font-black uppercase px-3 py-1 rounded-full ${statusColor(o.orderStatus)}`}>
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
