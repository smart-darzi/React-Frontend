import React from 'react';
import { motion } from 'framer-motion';
import { useLocalState } from '../context/useLocalState';
import { useNavigate } from 'react-router-dom';
import { Users, ClipboardList, CheckCircle, Scissors, UserPlus, Loader2, Clock, PlusCircle, ArrowRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { STAGES } from '../utils/stages';
import { useLanguage } from '../context/LanguageContext';

// Shared entrance animation
const fadeUp = (i = 0) => ({
  initial: { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.35, delay: i * 0.05, ease: 'easeOut' },
});

// Section Heading
const SectionHeading = ({ children, action }) => (
  <div className="flex items-center justify-between gap-2 mb-4 sm:mb-6 min-w-0">
    <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
      <span className="w-1.5 h-5 sm:h-6 rounded-full bg-primary flex-shrink-0" />
      <h2 className="font-display text-lg sm:text-xl font-extrabold text-slate-900 truncate">{children}</h2>
    </div>
    {action}
  </div>
);

const Dashboard = () => {
  const { getStats, orders, customers, workers, loading } = useLocalState();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { td, tn } = useLanguage();
  const stats = getStats();

  if (loading) {
    return (
      <div className="h-[60vh] flex flex-col items-center justify-center space-y-4">
        <Loader2 className="animate-spin text-primary" size={48} />
        <p className="text-slate-500 font-bold animate-pulse uppercase tracking-tighter text-sm sm:text-base">{t('dashboard.loading')}</p>
      </div>
    );
  }

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
    'Pending':              'bg-amber-100 text-amber-700 border-amber-200',
    'Active':               'bg-blue-100 text-blue-700 border-blue-200',
    'In Progress':          'bg-indigo-100 text-indigo-700 border-indigo-200',
    'Completed':            'bg-emerald-100 text-emerald-700 border-emerald-200',
    'Received By Customer': 'bg-purple-100 text-purple-700 border-purple-200',
  }[s] || 'bg-slate-100 text-slate-600 border-slate-200');

  const statusLabel = (s) => t(`orderStatus.${s}`, { defaultValue: s });

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
    <div className="space-y-6 sm:space-y-8 lg:space-y-10 w-full max-w-full min-w-0 overflow-x-hidden">
      {/* Title Header */}
      <motion.header {...fadeUp(0)} className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 w-full min-w-0">
        <div className="min-w-0 flex-1">
          <p className="hidden sm:block text-primary/70 text-[11px] font-bold uppercase tracking-[0.2em] mb-1">{t('dashboard.smartMasterAdmin')}</p>
          <h1 className="font-display text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-900 tracking-tight truncate">{t('dashboard.title')}</h1>
          <p className="text-slate-500 mt-1 text-xs sm:text-sm font-medium truncate">{t('dashboard.tailoringManagement')}</p>
        </div>
        <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto flex-wrap sm:flex-nowrap flex-shrink-0">
          <button
            onClick={() => navigate('/add-order')}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-3 py-2.5 sm:px-5 sm:py-3 rounded-xl font-bold text-xs sm:text-sm bg-white text-primary border border-primary/20 shadow-sm hover:bg-primary-light transition-all whitespace-nowrap"
          >
            <PlusCircle className="w-4 h-4 flex-shrink-0" />
            <span>{t('dashboard.newOrder')}</span>
          </button>
          <button
            onClick={() => navigate('/add-customer')}
            className="primary-btn flex-1 sm:flex-none flex items-center justify-center gap-2 px-3 py-2.5 sm:px-5 sm:py-3 rounded-xl text-xs sm:text-sm shadow-sm whitespace-nowrap"
          >
            <UserPlus className="w-4 h-4 flex-shrink-0" />
            <span>{t('dashboard.newCustomer')}</span>
          </button>
        </div>
      </motion.header>

      {/* Stat Cards - Single Row Horizontal Scroll with Hidden Scrollbar */}
      <div className="flex overflow-x-auto items-stretch gap-3 sm:gap-5 pb-1 -mx-1 px-1 sm:mx-0 sm:px-0 scrollbar-hide snap-x snap-mandatory min-w-0 w-full">
        {statCards.map(({ icon: Icon, label, value, color, shadow, onClick, trend, trendType }, i) => (
          <motion.button
            key={label}
            {...fadeUp(i + 1)}
            onClick={onClick}
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.98 }}
            className="glass-card relative flex-shrink-0 w-[45vw] min-w-[150px] max-w-[220px] sm:w-auto sm:flex-1 p-4 sm:p-6 rounded-2xl group text-left hover:shadow-lg transition-all flex flex-col justify-between snap-start"
          >
            <div className="flex items-start justify-between gap-1.5 w-full">
              {trend ? (
                <span className={`inline-flex items-center gap-0.5 text-[9px] sm:text-[10px] font-black px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full ${trendType === 'up' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                  {trendType === 'up' ? '↑' : '↓'} {trend}
                </span>
              ) : <span />}
              <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl ${color} shadow-md ${shadow} flex items-center justify-center text-white group-hover:rotate-6 transition-transform flex-shrink-0`}>
                <Icon size={18} />
              </div>
            </div>
            <div className="mt-3 sm:mt-4 min-w-0">
              <h3 className="font-display text-2xl sm:text-3xl font-extrabold text-slate-900 truncate">{value}</h3>
              <p className="text-slate-500 font-bold text-[10px] sm:text-[11px] uppercase tracking-wider leading-tight mt-1 truncate">{label}</p>
            </div>
          </motion.button>
        ))}
      </div>

      {/* Order Flow - Single Row Horizontal Scroll with Hidden Scrollbar */}
      <motion.div {...fadeUp(5)} className="glass-card p-4 sm:p-7 rounded-2xl w-full min-w-0">
        <SectionHeading
          action={
            <button onClick={() => navigate('/view-orders')} className="text-primary font-bold text-xs sm:text-sm hover:underline whitespace-nowrap">
              {t('dashboard.viewAll')}
            </button>
          }
        >
          {t('dashboard.orderFlow')}
        </SectionHeading>

        <div className="flex overflow-x-auto items-stretch gap-2.5 sm:gap-4 pb-1 -mx-1 px-1 scrollbar-hide snap-x snap-mandatory min-w-0 w-full">
          {[
            { key: 'Pending', label: t('stages.Pending'), count: stats.pendingOrders, light: 'bg-amber-50/80 text-amber-700 border-amber-200/80' },
            ...STAGES.map(stage => ({
              key: stage,
              label: t(`stages.${stage}`, { defaultValue: stage }),
              count: orders.filter(o => o.orderStatus === 'Active' && o.workStage === stage).length,
              light: 'bg-indigo-50/80 text-indigo-700 border-indigo-200/80',
            })),
          ].map((step, i) => (
            <motion.div
              key={step.key}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.25, delay: i * 0.05 }}
              whileHover={{ y: -2 }}
              onClick={() => navigate('/view-orders', { state: { stageFilter: step.key } })}
              className={`relative flex-shrink-0 w-[38vw] min-w-[125px] max-w-[180px] sm:w-auto sm:flex-1 rounded-xl border p-3 sm:p-4 text-center cursor-pointer transition-all hover:shadow-md flex flex-col justify-center snap-start ${step.light}`}
            >
              <span className="text-slate-400 text-[10px] font-bold absolute top-1.5 right-2 opacity-50">#{i + 1}</span>
              <p className="font-display text-2xl sm:text-3xl font-extrabold tracking-tight">{step.count}</p>
              <p className="text-[10px] sm:text-xs font-black uppercase tracking-wider mt-1 truncate">{step.label}</p>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Recent Orders */}
      <motion.div {...fadeUp(6)} className="glass-card p-4 sm:p-7 rounded-2xl w-full min-w-0">
        <SectionHeading
          action={
            <button onClick={() => navigate('/view-orders')} className="text-primary font-bold text-xs sm:text-sm hover:underline">
              {t('dashboard.viewAll')}
            </button>
          }
        >
          {t('dashboard.recentOrders')}
        </SectionHeading>

        {recentOrders.length === 0 ? (
          <div className="text-center py-8 sm:py-10 text-slate-400">
            <ClipboardList size={36} className="mx-auto mb-3 opacity-30" />
            <p className="font-medium text-sm sm:text-base">{t('dashboard.noOrdersYet')}</p>
          </div>
        ) : (
          <div className="space-y-3 w-full min-w-0">
            {recentOrders.map((o, i) => (
              <motion.div
                key={o._id}
                {...fadeUp(i * 0.1)}
                onClick={() => navigate('/view-orders')}
                whileHover={{ x: 4 }}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 sm:p-4 bg-slate-50/80 rounded-xl hover:bg-slate-100/90 transition-colors cursor-pointer border border-slate-100 min-w-0"
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className="w-9 h-9 sm:w-10 sm:h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary flex-shrink-0">
                    <Scissors size={18} />
                  </div>
                  <div className="min-w-0 flex-1">
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
                </div>
                <div className="flex items-center justify-between sm:justify-end gap-2 flex-shrink-0">
                  <span className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-full whitespace-nowrap border ${statusColor(o.orderStatus)}`}>
                    {statusLabel(o.orderStatus)}
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default Dashboard;
