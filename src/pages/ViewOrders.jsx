import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useLocalState } from '../context/useLocalState';
import { motion, AnimatePresence } from 'framer-motion';
import OrderDetailsModal from '../components/OrderDetailsModal';
import ConfirmModal from '../components/ConfirmModal';
import AssignWorkerModal from '../components/AssignWorkerModal';
import GuidanceModal from '../components/GuidanceModal';
import DesignDetailModal from '../components/DesignDetailModal';
import {
  ClipboardList, CheckCircle, Clock,
  User, Scissors, Calendar, HardHat,
  ArrowRight, Loader2, PackageCheck, Clock3, RotateCcw, OctagonAlert, MessageSquareWarning, Search, X, UserCog
} from 'lucide-react';
import { STAGES, STAGE_URDU_LABELS, getEffectiveStages, isMasterTailorOrder, getAdminStatus, getAdminStatusLabel, getAdminStatusColor } from '../utils/stages';
import { matchesNameSearch, sortByNameMatch, highlightNameMatch } from '../utils/nameSearch';
import { useLanguage } from '../context/LanguageContext';

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

const ViewOrders = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { orders, customers, workers, designs, updateOrderStatus, deleteOrder, sendGuidance, loading } = useLocalState();
  const { t, td, language } = useLanguage();
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [assignModal, setAssignModal] = useState(null); // { order, title, stageOptions, nextStage, nextStatus }
  const [confirmModal, setConfirmModal] = useState(null); // { order, title, message, tone, nextStatus, nextStage }
  const [guidanceModal, setGuidanceModal] = useState(null); // { order }
  const [sendingGuidance, setSendingGuidance] = useState(false);
  const [busy, setBusy] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  // Dashboard's stat cards deep-link here with a status to pre-filter by
  // (e.g. clicking "Pending Orders" should show only Pending orders, not
  // the whole queue). Read once from navigation state on arrival.
  const [statusFilter, setStatusFilter] = useState(location.state?.statusFilter || null);
  useEffect(() => {
    if (location.state?.statusFilter) {
      setStatusFilter(location.state.statusFilter);
      // Clear the navigation state so a manual refresh or back/forward
      // doesn't keep re-applying it after the admin has cleared the filter.
      window.history.replaceState({}, '');
    }
  }, [location.state]);

  const STATUS_FILTER_LABELS = {
    Pending: t('Pending Orders', 'زیر التوا آرڈرز'),
    Active: t('Active Orders', 'فعال آرڈرز'),
    CompletedToday: t('Completed Today', 'آج مکمل'),
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
  const [viewingDesign, setViewingDesign] = useState(null);

  const handleSendGuidance = async (text) => {
    if (!guidanceModal) return;
    setSendingGuidance(true);
    try {
      await sendGuidance(guidanceModal.order._id, { guidance: text, adminName: 'Admin' });
      setGuidanceModal(null);
    } catch (error) {
      alert('Guidelines bhejne mein masla: ' + (error.response?.data?.error || error.message));
    } finally {
      setSendingGuidance(false);
    }
  };


  const handleEdit = (order) => {
    navigate('/add-order', { state: { editOrder: order } });
  };

  const handleDelete = async (orderId) => {
    if (!window.confirm('Kya aap is order ko delete karna chahti hain? Yeh permanently remove ho jayega.')) return;
    setDeletingId(orderId);
    try {
      await deleteOrder(orderId);
    } catch (error) {
      alert('Failed to delete order: ' + (error.response?.data?.error || error.message));
    } finally {
      setDeletingId(null);
    }
  };

  const getCustomerName = (id) => {
    const c = customers.find(c => c._id === id);
    return c ? c.name : t('Unknown Customer', 'نامعلوم کسٹمر');
  };

  // Admin-facing counters — mirrors the 5-step Admin flow (Awaiting ->
  // Assigned -> Re-Assign -> Approved -> Delivered) instead of the raw
  // orderStatus values.
  const statusMetrics = {
    awaiting: orders.filter(o => getAdminStatus(o) === 'Awaiting').length,
    assigned: orders.filter(o => getAdminStatus(o) === 'Assigned').length,
    reassign: orders.filter(o => getAdminStatus(o) === 'Re-Assign').length,
    approved: orders.filter(o => getAdminStatus(o) === 'Approved').length,
    delivered: orders.filter(o => getAdminStatus(o) === 'Delivered').length,
  };

  // ── Assign-worker modal (used to start work or move to the next stage) ──
  const runAssignAction = async ({ stage, assignedWorkerId, assignedWorkerName }) => {
    if (!assignModal) return;
    setBusy(true);
    try {
      await updateOrderStatus(assignModal.order._id, {
        orderStatus: assignModal.nextStatus,
        workStage: stage,
        assignedWorkerId,
        assignedWorkerName,
        wasReassigned: Boolean(assignModal.wasReassigned),
      });
      setAssignModal(null);
    } catch (error) {
      alert('Failed to update order: ' + (error.response?.data?.error || error.message));
    } finally {
      setBusy(false);
    }
  };

  // ── Simple Yes/No confirm modal (Completed / Received) ──
  const runConfirmAction = async () => {
    if (!confirmModal) return;
    setBusy(true);
    try {
      await updateOrderStatus(confirmModal.order._id, {
        orderStatus: confirmModal.nextStatus,
        workStage: confirmModal.nextStage,
      });
      setConfirmModal(null);
    } catch (error) {
      alert('Failed to update order: ' + (error.response?.data?.error || error.message));
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return (
      <div className="h-[60vh] flex flex-col items-center justify-center space-y-4">
        <Loader2 className="animate-spin text-primary" size={48} />
        <p className="text-slate-500 font-bold animate-pulse uppercase tracking-tighter">{t('Loading Orders...', 'آرڈرز لوڈ ہو رہے ہیں...')}</p>
      </div>
    );
  }

  // Sort orders purely by recency — the most recently created order always
  // shows up on top, and the oldest sinks to the bottom, regardless of
  // status. (Previously this grouped by status first, which meant an old
  // Pending order could sit above a brand-new Active one — that's what
  // was fixed here.)
  // Search matches order type, customer name, or assigned worker name —
  // whichever the admin is more likely to remember about an order — with
  // the same ranking/highlight treatment used on Customers/Designs search.
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

  return (
    <div className="space-y-12 pb-20">
      <motion.header
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: 'easeOut' }}
        className="flex flex-col md:flex-row md:items-center justify-between gap-8"
      >
        <div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-800 tracking-tighter uppercase">{t('Order Queue', 'آرڈر قطار')}</h1>
          <p className="text-slate-500 mt-2 font-medium tracking-wide">{t('Managing the flow of craftsmanship.', 'کاریگری کے بہاؤ کا انتظام۔')}</p>
        </div>

        <div className="flex items-stretch border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-lg max-w-md w-full focus-within:ring-2 focus-within:ring-primary/20 transition-all">
          <div className="flex items-center justify-center px-4 bg-slate-100/80 border-r border-slate-200 min-w-[52px]">
            <Search size={18} className="text-slate-400" />
          </div>
          <input
            type="text"
            placeholder={t('Order type, customer, ya worker se search karein...', 'آرڈر کی قسم، کسٹمر، یا ورکر سے تلاش کریں...')}
            className="flex-1 px-4 py-4 bg-transparent outline-none text-slate-700 placeholder:text-slate-400"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
      </motion.header>

      {statusFilter && (
        <div className="flex items-center gap-3">
          <span className="text-slate-400 text-sm font-bold">{t('Filter:', 'فلٹر:')}</span>
          <span className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary/10 text-primary text-xs font-black uppercase tracking-wider">
            {STATUS_FILTER_LABELS[statusFilter] || statusFilter}
            <button onClick={() => setStatusFilter(null)} className="hover:text-primary-dark">
              <X size={14} />
            </button>
          </span>
        </div>
      )}

      <div className="flex gap-4 flex-wrap">
          <div className="glass-card px-6 py-4 rounded-2xl flex items-center gap-4 border-amber-200 bg-amber-50">
            <Clock className="text-amber-500" />
            <div>
              <p className="text-[10px] font-black text-amber-600 uppercase">{t('Awaiting', 'زیر التواء')}</p>
              <p className="text-xl font-black text-slate-800">{statusMetrics.awaiting}</p>
            </div>
          </div>
          <div className="glass-card px-6 py-4 rounded-2xl flex items-center gap-4 border-blue-200 bg-blue-50">
            <HardHat className="text-blue-500" />
            <div>
              <p className="text-[10px] font-black text-blue-600 uppercase">{t('Assigned', 'تفویض شدہ')}</p>
              <p className="text-xl font-black text-slate-800">{statusMetrics.assigned}</p>
            </div>
          </div>
          <div className="glass-card px-6 py-4 rounded-2xl flex items-center gap-4 border-red-200 bg-red-50">
            <RotateCcw className="text-red-500" />
            <div>
              <p className="text-[10px] font-black text-red-600 uppercase">{t('Re-Assign', 'دوبارہ تفویض')}</p>
              <p className="text-xl font-black text-slate-800">{statusMetrics.reassign}</p>
            </div>
          </div>
          <div className="glass-card px-6 py-4 rounded-2xl flex items-center gap-4 border-emerald-200 bg-emerald-50">
            <CheckCircle className="text-emerald-500" />
            <div>
              <p className="text-[10px] font-black text-emerald-600 uppercase">{t('Approved', 'منظور شدہ')}</p>
              <p className="text-xl font-black text-slate-800">{statusMetrics.approved}</p>
            </div>
          </div>
          <div className="glass-card px-6 py-4 rounded-2xl flex items-center gap-4 border-purple-200 bg-purple-50">
            <PackageCheck className="text-purple-500" />
            <div>
              <p className="text-[10px] font-black text-purple-600 uppercase">{t('Delivered', 'حوالے شدہ')}</p>
              <p className="text-xl font-black text-slate-800">{statusMetrics.delivered}</p>
            </div>
          </div>
      </div>

      {searchTerm.trim() && (
        <p className="text-slate-400 text-sm font-bold -mt-8">
          {sortedOrders.length} {t('result' + (sortedOrders.length === 1 ? '' : 's'), 'نتیجہ')} {t('for', 'کے لیے')} "{searchTerm}"
        </p>
      )}

      <div className="space-y-6">
        <AnimatePresence mode="popLayout">
          {sortedOrders.map((order) => {
            const effectiveStages = getEffectiveStages(order);
            const stageIndex = effectiveStages.indexOf(order.workStage);
            const isLastStage = stageIndex === effectiveStages.length - 1;
            const orderIsMasterTailor = isMasterTailorOrder(order, workers);
            // ✅ Gate: admin can only move an order to the next stage (or mark
            // it fully finished) once the worker currently holding this stage
            // has tapped "Mark Done" in their portal (pendingCompletion set
            // for this exact stage). Until then the move/finish buttons stay
            // locked so the admin can't skip ahead of the worker's own
            // confirmation.
            const workerConfirmedDone = order.pendingCompletion
              && order.pendingCompletion.stage === order.workStage;

            return (
            <motion.div
              key={order._id}
              layout
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
              className="glass-card p-6 sm:p-8 lg:p-10 rounded-[2rem] sm:rounded-[2.5rem] lg:rounded-[3rem] group hover:scale-[1.01] transition-all hover:shadow-2xl hover:shadow-primary/5"
            >
              <div className="flex flex-col lg:flex-row items-center gap-10">
                <div className="w-24 h-24 bg-primary/5 rounded-[2rem] flex items-center justify-center text-primary text-3xl font-black border-2 border-primary/10 group-hover:rotate-6 transition-transform">
                  <Scissors size={32} />
                </div>

                <div className="flex-1 space-y-4 text-center lg:text-left">
                  <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4">
                    <h3 className="text-3xl font-black text-slate-800 tracking-tighter uppercase">
                      <HighlightedName name={td(order.orderType)} term={searchTerm} />
                    </h3>
                    <span className={`px-5 py-1.5 rounded-full text-xs font-black uppercase tracking-widest border-2 ${getAdminStatusColor(order)}`}>
                      {getAdminStatusLabel(order, t('en', 'ur'))}
                    </span>
                    {order.orderStatus === 'Active' && stageIndex !== -1 && (
                      <span className="px-5 py-1.5 rounded-full text-xs font-black uppercase tracking-widest border-2 bg-indigo-100 text-indigo-600 border-indigo-200">
                        {t('Stage', 'مرحلہ')}: {t(order.workStage, STAGE_URDU_LABELS[order.workStage] || order.workStage)}
                      </span>
                    )}
                    {order.orderStatus === 'Active' && orderIsMasterTailor && (
                      <span className="px-5 py-1.5 rounded-full text-xs font-black uppercase tracking-widest border-2 bg-violet-100 text-violet-600 border-violet-200 flex items-center gap-1.5">
                        <UserCog size={14} /> {t('Master Tailor', 'ماسٹر درزی')}
                      </span>
                    )}
                  </div>

                  {order.pendingCompletion && order.pendingCompletion.stage === order.workStage && (
                    <div className="flex items-center gap-2 justify-center lg:justify-start text-amber-700 bg-amber-50 border-2 border-amber-200 px-4 py-2 rounded-2xl text-sm font-bold w-fit mx-auto lg:mx-0">
                      <Clock3 size={16} />
                      {orderIsMasterTailor
                        ? (order.wasReassigned
                            ? <>{order.pendingCompletion.workerName || 'Worker'} (Master Tailor) ne dobara (re-assign ke baad) bataya hai ke poora order mukammal ho gaya hai — neeche button se confirm karein.</>
                            : <>{order.pendingCompletion.workerName || 'Worker'} (Master Tailor) ne bataya hai ke poora order (Cutting se {order.pendingCompletion.stage} tak) mukammal ho gaya hai — neeche button se confirm karein.</>)
                        : (order.wasReassigned
                            ? <>{order.pendingCompletion.workerName || 'Worker'} ne dobara (re-assign ke baad) bataya hai ke {order.pendingCompletion.stage} mukammal ho gaya hai — neeche button se confirm karein.</>
                            : <>{order.pendingCompletion.workerName || 'Worker'} ne bataya hai ke {order.pendingCompletion.stage} mukammal ho gaya hai — neeche button se confirm karein.</>)
                      }
                    </div>
                  )}

                  {order.workerStatus === 'Blocked' && (
                    <div className="flex items-center gap-2 justify-center lg:justify-start text-red-600 bg-red-50 border-2 border-red-200 px-4 py-2 rounded-2xl text-sm font-bold w-fit mx-auto lg:mx-0">
                      <OctagonAlert size={16} />
                      {order.assignedWorkerName || 'Worker'} ne {order.workStage} par rukawat report ki hai{order.workerBlockReason ? `: ${order.workerBlockReason}` : ''}
                    </div>
                  )}

                  {order.workerStatus === 'Blocked' && order.workerWantsGuidance && !order.adminGuidance && (
                    <div className="flex items-center gap-2 justify-center lg:justify-start text-amber-700 bg-amber-50 border-2 border-amber-200 px-4 py-2 rounded-2xl text-sm font-bold w-fit mx-auto lg:mx-0">
                      <Clock3 size={16} />
                      Worker ne guidelines mangi hain — jab tak nahi bhejenge, wo resume/complete nahi kar sakega.
                    </div>
                  )}

                  {order.workerStatus === 'Blocked' && order.adminGuidance && (
                    <div className="flex items-center gap-2 justify-center lg:justify-start text-emerald-700 bg-emerald-50 border-2 border-emerald-200 px-4 py-2 rounded-2xl text-sm font-bold w-fit mx-auto lg:mx-0">
                      <MessageSquareWarning size={16} />
                      Aapki guidelines bhej di gayi hain: "{order.adminGuidance}"
                    </div>
                  )}

                  <div className="flex flex-wrap items-center justify-center lg:justify-start gap-x-8 gap-y-3">
                    <div className="flex items-center gap-2 text-slate-600 font-bold">
                      <User size={18} className="text-primary" />
                      <HighlightedName name={getCustomerName(order.customerId)} term={searchTerm} />
                    </div>
                    <div className="flex items-center gap-2 text-slate-500 font-medium">
                      <Calendar size={18} />
                      {new Date(order.createdAt).toLocaleDateString()} · {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                    {order.deliveredAt && (
                      <div className="flex items-center gap-2 text-emerald-600 font-medium">
                        <PackageCheck size={18} />
                        {t('Delivered', 'ڈیلیور')}: {new Date(order.deliveredAt).toLocaleDateString()} · {new Date(order.deliveredAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    )}
                    {order.assignedWorkerName && (
                      <div className="flex items-center gap-2 text-slate-500 font-medium">
                        <HardHat size={18} className="text-primary" />
                        <HighlightedName name={order.assignedWorkerName} term={searchTerm} />
                      </div>
                    )}
                  </div>

                </div>

                <div className="flex flex-col gap-3 min-w-[200px] w-full lg:w-auto">
                  {order.orderStatus === 'Pending' && (
                    <button
                      onClick={() => setAssignModal({
                        order,
                        title: t('Start Order', 'آرڈر شروع کریں'),
                        stageOptions: [STAGES[0]],
                        nextStatus: 'Active',
                      })}
                      className="primary-btn w-full py-4 rounded-2xl shadow-lg shadow-primary/20"
                    >
                      {t('Process Order', 'آرڈر شروع کریں')}
                    </button>
                  )}

                  {order.orderStatus === 'Active' && stageIndex === -1 && (
                    // Legacy/old order that became Active before the stage workflow existed
                    <button
                      onClick={() => setAssignModal({
                        order,
                        title: t('Set Work Stage', 'مرحلہ مقرر کریں'),
                        stageOptions: effectiveStages,
                        nextStatus: 'Active',
                      })}
                      className="primary-btn w-full py-4 rounded-2xl shadow-lg shadow-primary/20"
                    >
                      {t('Start Work', 'کام شروع کریں')}
                    </button>
                  )}

                  {order.orderStatus === 'Active' && stageIndex !== -1 && !isLastStage && (
                    workerConfirmedDone ? (
                      <>
                        <button
                          onClick={() => setAssignModal({
                            order,
                            title: `${t(order.workStage, STAGE_URDU_LABELS[order.workStage] || order.workStage)} ${t('Done →', 'مکمل ←')} ${t(effectiveStages[stageIndex + 1], STAGE_URDU_LABELS[effectiveStages[stageIndex + 1]] || effectiveStages[stageIndex + 1])}`,
                            stageOptions: [effectiveStages[stageIndex + 1]],
                            defaultWorkerId: order.assignedWorkerId,
                            nextStatus: 'Active',
                          })}
                          className="w-full py-4 bg-indigo-500 hover:bg-indigo-600 text-white font-bold rounded-2xl shadow-lg shadow-indigo-100 transition-all"
                        >
                          {t(order.workStage, STAGE_URDU_LABELS[order.workStage] || order.workStage)} {t('Done →', 'مکمل ←')} {t(effectiveStages[stageIndex + 1], STAGE_URDU_LABELS[effectiveStages[stageIndex + 1]] || effectiveStages[stageIndex + 1])}
                        </button>
                        <button
                          onClick={() => setAssignModal({
                            order,
                            title: `${t('Reject & Re-Assign', 'مسترد کریں')} — ${t(order.workStage, STAGE_URDU_LABELS[order.workStage] || order.workStage)}`,
                            stageOptions: [order.workStage],
                            defaultWorkerId: order.assignedWorkerId,
                            nextStatus: 'Active',
                            wasReassigned: true,
                          })}
                          className="w-full py-4 bg-red-50 hover:bg-red-100 text-red-600 font-bold rounded-2xl border-2 border-red-200 transition-all flex items-center justify-center gap-2"
                        >
                          <RotateCcw size={18} /> {t('Reject & Re-Assign', 'مسترد کر کے دوبارہ تفویض کریں')}
                        </button>
                      </>
                    ) : order.workerStatus === 'Blocked' ? (
                      <button
                        onClick={() => setGuidanceModal({ order })}
                        className="w-full py-4 bg-red-500 hover:bg-red-600 text-white font-bold rounded-2xl shadow-lg shadow-red-100 transition-all flex items-center justify-center gap-2"
                      >
                        <MessageSquareWarning size={18} /> {order.adminGuidance ? t('Update Guidelines', 'رہنمائی اپڈیٹ کریں') : t('Send Guidelines', 'رہنمائی بھیجیں')}
                      </button>
                    ) : (
                      <button
                        disabled
                        title="Worker ke 'Mark Done' karne ka intezar hai"
                        className="w-full py-4 bg-slate-100 text-slate-400 font-bold rounded-2xl cursor-not-allowed flex items-center justify-center gap-2"
                      >
                        <Clock3 size={18} /> {t('Waiting for Worker', 'ورکر کا انتظار')}
                      </button>
                    )
                  )}

                  {order.orderStatus === 'Active' && stageIndex !== -1 && isLastStage && (
                    workerConfirmedDone ? (
                      <>
                        <button
                          onClick={() => setConfirmModal({
                            order,
                            title: t('Finish Crafting?', 'کیا کام مکمل ہو گیا؟'),
                            message: orderIsMasterTailor
                              ? t(
                                  `Mark "${td(order.orderType)}" as completed — the whole order (Cutting through ${order.workStage}) was handled by ${order.assignedWorkerName || 'the Master Tailor'}?`,
                                  `"${td(order.orderType)}" کو مکمل شدہ نشان زد کریں — پورا آرڈر (کٹنگ سے ${STAGE_URDU_LABELS[order.workStage] || order.workStage} تک) ${order.assignedWorkerName || 'ماسٹر درزی'} نے سنبھالا؟`
                                )
                              : t(
                                  `Mark "${td(order.orderType)}" as completed after ${order.workStage}?`,
                                  `"${td(order.orderType)}" کو ${STAGE_URDU_LABELS[order.workStage] || order.workStage} کے بعد مکمل شدہ نشان زد کریں؟`
                                ),
                            tone: 'success',
                            nextStatus: 'Completed',
                            nextStage: 'Done',
                          })}
                          className="w-full py-4 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-2xl shadow-lg shadow-emerald-100 transition-all"
                        >
                          {t('Finish Crafting (Approve)', 'کام مکمل (منظور کریں)')}
                        </button>
                        <button
                          onClick={() => setAssignModal({
                            order,
                            title: `${t('Reject & Re-Assign', 'مسترد کریں')} — ${t(order.workStage, STAGE_URDU_LABELS[order.workStage] || order.workStage)}`,
                            stageOptions: [order.workStage],
                            defaultWorkerId: order.assignedWorkerId,
                            nextStatus: 'Active',
                            wasReassigned: true,
                          })}
                          className="w-full py-4 bg-red-50 hover:bg-red-100 text-red-600 font-bold rounded-2xl border-2 border-red-200 transition-all flex items-center justify-center gap-2"
                        >
                          <RotateCcw size={18} /> {t('Reject & Re-Assign', 'مسترد کر کے دوبارہ تفویض کریں')}
                        </button>
                      </>
                    ) : order.workerStatus === 'Blocked' ? (
                      <button
                        onClick={() => setGuidanceModal({ order })}
                        className="w-full py-4 bg-red-500 hover:bg-red-600 text-white font-bold rounded-2xl shadow-lg shadow-red-100 transition-all flex items-center justify-center gap-2"
                      >
                        <MessageSquareWarning size={18} /> {order.adminGuidance ? t('Update Guidelines', 'رہنمائی اپڈیٹ کریں') : t('Send Guidelines', 'رہنمائی بھیجیں')}
                      </button>
                    ) : (
                      <button
                        disabled
                        title="Worker ke 'Mark Done' karne ka intezar hai"
                        className="w-full py-4 bg-slate-100 text-slate-400 font-bold rounded-2xl cursor-not-allowed flex items-center justify-center gap-2"
                      >
                        <Clock3 size={18} /> {t('Waiting for Worker', 'ورکر کا انتظار')}
                      </button>
                    )
                  )}

                  {order.orderStatus === 'Completed' && (
                    <button
                      onClick={() => setConfirmModal({
                        order,
                        title: t('Mark as Received?', 'حوالے کر دیا؟'),
                        message: t(
                          `Confirm that "${td(order.orderType)}" has been collected by the customer.`,
                          `تصدیق کریں کہ "${td(order.orderType)}" کسٹمر کو حوالے کر دیا گیا ہے۔`
                        ),
                        tone: 'purple',
                        nextStatus: 'Received By Customer',
                        nextStage: 'Done',
                      })}
                      className="w-full py-4 bg-purple-500 hover:bg-purple-600 text-white font-bold rounded-2xl shadow-lg shadow-purple-100 transition-all flex items-center justify-center gap-2"
                    >
                      <PackageCheck size={20} /> {t('Mark as Received', 'حوالے کر دیا')}
                    </button>
                  )}
                  {order.orderStatus === 'Received By Customer' && (
                    <button
                      className="w-full py-4 bg-purple-100 text-purple-600 font-bold rounded-2xl cursor-default flex items-center justify-center gap-2"
                      disabled
                    >
                      <PackageCheck size={18} /> {t('Delivered', 'حوالے شدہ')} ✓
                    </button>
                  )}
                  <button
                    onClick={() => setSelectedOrder(order)}
                    className="flex items-center justify-center gap-2 w-full py-4 bg-slate-100 text-slate-600 font-bold rounded-2xl hover:bg-slate-200 transition-all"
                  >
                    {t('View Details', 'تفصیلات دیکھیں')} <ArrowRight size={18} />
                  </button>
                </div>
              </div>
            </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {orders.length > 0 && sortedOrders.length === 0 && (
        <div className="text-center py-32 glass-card rounded-[3rem] border-4 border-dashed border-slate-100 bg-transparent">
          <div className="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-6 text-slate-300">
            <Search size={48} />
          </div>
          <h3 className="text-3xl font-black text-slate-400 uppercase tracking-tighter">{t('No matching orders', 'کوئی مماثل آرڈر نہیں')}</h3>
          <p className="text-slate-400 font-medium mt-2">{t('Search badal kar dobara koshish karein', 'تلاش تبدیل کر کے دوبارہ کوشش کریں')}</p>
        </div>
      )}

      {orders.length === 0 && (
        <div className="text-center py-32 glass-card rounded-[3rem] border-4 border-dashed border-slate-100 bg-transparent">
          <div className="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-6 text-slate-300">
            <ClipboardList size={48} />
          </div>
          <h3 className="text-3xl font-black text-slate-400 uppercase tracking-tighter">{t('Your queue is empty', 'آپ کی قطار خالی ہے')}</h3>
          <p className="text-slate-400 font-medium mt-2">{t('Ready for a new masterpiece?', 'نئے شاہکار کے لیے تیار؟')}</p>
        </div>
      )}

      {selectedOrder && (
        <OrderDetailsModal
          order={selectedOrder}
          customerName={getCustomerName(selectedOrder.customerId)}
          onClose={() => setSelectedOrder(null)}
          onEdit={(order) => { setSelectedOrder(null); handleEdit(order); }}
          onDelete={(order) => { setSelectedOrder(null); handleDelete(order._id); }}
          deleting={deletingId === selectedOrder._id}
          designs={designs}
        />
      )}

      {assignModal && (
        <AssignWorkerModal
          title={assignModal.title}
          stageOptions={assignModal.stageOptions}
          defaultStage={assignModal.stageOptions[0]}
          defaultWorkerId={assignModal.defaultWorkerId}
          workers={workers}
          confirming={busy}
          onConfirm={runAssignAction}
          onCancel={() => setAssignModal(null)}
        />
      )}

      {confirmModal && (
        <ConfirmModal
          title={confirmModal.title}
          message={confirmModal.message}
          tone={confirmModal.tone}
          confirming={busy}
          onConfirm={runConfirmAction}
          onCancel={() => setConfirmModal(null)}
        />
      )}

      {guidanceModal && (
        <GuidanceModal
          order={guidanceModal.order}
          sending={sendingGuidance}
          onSend={handleSendGuidance}
          onCancel={() => setGuidanceModal(null)}
        />
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

export default ViewOrders;
