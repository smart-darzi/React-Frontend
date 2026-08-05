import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useLocalState } from '../context/useLocalState';
import { useLanguage } from '../context/LanguageContext';
import ConfirmModal from '../components/ConfirmModal';
import BlockReportModal from '../components/BlockReportModal';
import DesignDetailModal from '../components/DesignDetailModal';
import DesignThumb from '../components/DesignThumb';
import PortalFooter from '../components/PortalFooter';
import { HardHat, LogOut, Scissors, User, Loader2, PackageCheck, Clock3, Lock, OctagonAlert, RotateCcw, MessageSquareWarning, ClipboardList, ChevronDown, Maximize2, Hash, UserCog } from 'lucide-react';
import { getEffectiveStages, getWorkerHistory, getWorkerStatus, getWorkerStatusLabel, getWorkerStatusColor, isWorkerStatusActive, isMasterTailorRole } from '../utils/stages';
import PaginationControls from '../components/PaginationControls';

// Small read-only label/value pair for the "Full Order Details" panel —
// skips rendering entirely if there's no value, so optional fields (e.g.
// bookNumber on an order that never set one) don't leave an empty box.
const DetailField = ({ label, value }) => {
  if (value === undefined || value === null || value === '') return null;
  return (
    <div className="bg-slate-50 border border-slate-100 rounded-xl px-3 py-2">
      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{label}</p>
      <p className="text-xs font-bold text-slate-700 break-words mt-0.5">{value}</p>
    </div>
  );
};

// A short colored tick before each section title — a small, consistent
// wayfinding device that separates "My Assigned Orders" / "Work History"
// as distinct zones on the page, rather than two plain <h2>s.
const SectionHeading = ({ children, eyebrow }) => (
  <div className="mb-5">
    {eyebrow && <p className="text-[11px] font-bold text-primary/70 uppercase tracking-[0.2em] mb-1">{eyebrow}</p>}
    <div className="flex items-center gap-2.5">
      <span className="w-1.5 h-6 rounded-full bg-primary flex-shrink-0" />
      <h2 className="font-display text-2xl font-extrabold text-slate-900">{children}</h2>
    </div>
  </div>
);

// Icon + solid color per worker status — used for the single primary status
// line on each card (replacing a badge buried in a row of other badges).
const WORKER_STATUS_META = {
  Pending: { color: '#64748B' },
  'In-Progress': { color: '#1D4ED8' },
  Blocked: { color: '#DC2626' },
  'Completed-Review': { color: '#B45309' },
  Completed: { color: '#047857' },
};

// Time-based greeting — small touch that makes the header feel like it's
// actually addressing the person who's logged in, not just labeling a role.
// Returns an i18next key suffix (workerPortal.greeting.<key>); the actual
// translated text is looked up at render time via useTranslation.
const getGreetingKey = () => {
  const hour = new Date().getHours();
  if (hour < 12) return 'morning';
  if (hour < 17) return 'afternoon';
  return 'evening';
};

const WorkerPortal = () => {
  const { currentWorker, workerLogout, orders, customers, designs, updateWorkerStatus, loading } = useLocalState();
  const navigate = useNavigate();
  const { language, setLanguage, td, tn } = useLanguage();
  const { t } = useTranslation();
  const [confirmModal, setConfirmModal] = useState(null);
  const [blockModalOrder, setBlockModalOrder] = useState(null);
  const [reportingBlock, setReportingBlock] = useState(false);
  const [blockError, setBlockError] = useState('');
  const [busy, setBusy] = useState(false);
  // Still used to open the read-only design detail modal when a worker taps
  // an order's reference-design thumbnail (see the order card below).
  const [viewingDesign, setViewingDesign] = useState(null);
  // ✅ Work History pagination — mirrors the Admin's Workers page (3 entries
  // per page), so a worker with a long history isn't stuck scrolling one
  // giant table.
  const [historyPage, setHistoryPage] = useState(1);
  const HISTORY_PAGE_SIZE = 3;

  const handleLogout = () => {
    workerLogout();
    navigate('/login');
  };

  const getCustomerName = (id) => {
    const c = customers.find(c => c._id === id);
    return c ? tn(c.name) : t('viewOrders.unknownCustomer');
  };

  // Compare as strings — assignedWorkerId can come back as a Mongo ObjectId
  // while currentWorker._id is a plain string (or vice versa), so a strict
  // === would silently fail to match and the worker would see an empty list.
  // Sorted newest-assignment-first (by updatedAt, which bumps every time the
  // Admin (re)assigns a stage to this worker) so a fresh task the Admin just
  // handed over shows up at the top of the list instead of getting buried
  // under older orders.
  const myOrders = orders
    .filter(o => o.assignedWorkerId?.toString() === currentWorker?._id?.toString() && o.orderStatus === 'Active')
    .sort((a, b) => new Date(b.updatedAt || b.createdAt || 0) - new Date(a.updatedAt || a.createdAt || 0));

  // Past work this worker has completed — pulled from every order's
  // stageHistory log (see utils/stages.js), so a Cutter/Tailor/Embroidery
  // worker's earlier finished stage still shows up here even after the
  // order has since moved on to a different worker for the next stage.
  const myHistory = getWorkerHistory(orders, currentWorker?._id);
  const historyTotalPages = Math.max(1, Math.ceil(myHistory.length / HISTORY_PAGE_SIZE));
  const historySafePage = Math.min(historyPage, historyTotalPages);
  const pagedHistory = myHistory.slice(
    (historySafePage - 1) * HISTORY_PAGE_SIZE,
    historySafePage * HISTORY_PAGE_SIZE
  );

  // ── Section tabs — "Assigned Orders" and "Work History" are two distinct
  // views now (only one renders at a time), instead of both being stacked
  // in one long scroll. That stacking used to leave a big empty gap
  // whenever "Assigned Orders" was empty (a tall dashed placeholder) sitting
  // right above a short/empty history table — switching to real tabs means
  // an empty state only ever fills its own tab, never leaves dead space
  // dragging the rest of the page down with it.
  const [activeTab, setActiveTab] = useState('assigned-orders');

  // ✅ Worker's own happy-path status: Pending -> In-Progress ->
  // Completed-Review -> Completed. The first two steps are quick, low-risk
  // taps (no confirmation needed). The final step is the one that actually
  // notifies the admin, so it keeps the same confirm-dialog safety net the
  // old single "Mark Done" button had.
  const [statusBusyId, setStatusBusyId] = useState(null);
  const [expandedOrders, setExpandedOrders] = useState(() => new Set());
  const toggleExpanded = (orderId) => {
    setExpandedOrders(prev => {
      const next = new Set(prev);
      next.has(orderId) ? next.delete(orderId) : next.add(orderId);
      return next;
    });
  };

  // ✅ One order at a time — a worker can only have a single order actively
  // In-Progress / Blocked / Completed-Review. Every other assigned order
  // has to wait (stays "Pending", Start Work disabled) until this one is
  // sent off to the Admin (workerStatus -> "Completed"), at which point it
  // no longer counts as active and the next order can be started.
  const activeOrder = myOrders.find(o => isWorkerStatusActive(o));
  const isMasterTailor = isMasterTailorRole(currentWorker?.role);

  const advanceWorkerStatus = async (order, nextStatus, extra = {}) => {
    setStatusBusyId(order._id);
    try {
      await updateWorkerStatus(order._id, {
        workerStatus: nextStatus,
        workerId: currentWorker?._id,
        workerName: currentWorker?.name,
        ...extra,
      });
    } catch (error) {
      alert(t('workerPortal.statusUpdateFailed', { error: error.response?.data?.error || error.message }));
    } finally {
      setStatusBusyId(null);
    }
  };

  // Worker hit a snag mid-task (fabric khatam, machine kharab, waiting on
  // something) — flags the order as Blocked with an optional note, plus
  // whether they want the Admin's written guidance before resuming. This
  // doesn't send anything to the Admin's approval queue; it's purely the
  // worker's own status, same as In-Progress/Completed-Review.
  const handleReportBlock = (order) => { setBlockError(''); setBlockModalOrder(order); };

  const submitBlockReport = async ({ reason, wantsGuidance }) => {
    if (!blockModalOrder) return;
    setReportingBlock(true);
    setBlockError('');
    try {
      await updateWorkerStatus(blockModalOrder._id, {
        workerStatus: 'Blocked',
        workerId: currentWorker?._id,
        workerName: currentWorker?.name,
        blockReason: reason,
        wantsGuidance,
      });
      setBlockModalOrder(null);
    } catch (error) {
      setBlockError(error.response?.data?.error || error.message || t('workerPortal.couldNotSendReport'));
    } finally {
      setReportingBlock(false);
    }
  };

  const runConfirm = async () => {
    if (!confirmModal) return;
    setBusy(true);
    try {
      await updateWorkerStatus(confirmModal.order._id, {
        workerStatus: 'Completed',
        workerId: currentWorker?._id,
        workerName: currentWorker?.name,
      });
      setConfirmModal(null);
    } catch (error) {
      alert(t('workerPortal.couldNotNotifyAdmin', { error: error.response?.data?.error || error.message }));
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return (
      <div className="h-screen flex flex-col items-center justify-center space-y-4">
        <Loader2 className="animate-spin text-primary" size={48} />
        <p className="text-slate-500 font-bold animate-pulse uppercase tracking-tighter">{t('workerPortal.loading')}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col justify-between fabric-bg p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-8 w-full flex-1 flex flex-col justify-between">
        <motion.header
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
          className="relative rounded-xl overflow-hidden"
          style={{ background: 'linear-gradient(155deg, #10707F 0%, #0E606E 50%, #0A4A55 100%)', boxShadow: '0 20px 40px -20px rgba(10,74,85,0.5)' }}
        >
          <div className="absolute inset-0 opacity-[0.07]" style={{ backgroundImage: 'repeating-linear-gradient(90deg, #fff 0px, #fff 1px, transparent 1px, transparent 10px)' }} />
          <div className="relative flex items-center justify-between gap-4 p-6 md:p-7">
            <div className="flex items-center gap-4 min-w-0">
              <div className="w-14 h-14 bg-white/15 border border-white/20 rounded-xl flex items-center justify-center text-white flex-shrink-0">
                <HardHat size={22} />
              </div>
              <div className="min-w-0">
                <p className="text-white/60 text-[10px] font-bold uppercase tracking-[0.2em] mb-0.5">{t('workerPortal.portalLabel')}</p>
                <h1 className="font-display text-xl font-extrabold text-white truncate">
                  {t(`workerPortal.greeting.${getGreetingKey()}`)}, {tn(currentWorker?.name?.split(' ')[0]) || 'there'}
                </h1>
              </div>
            </div>
            <div className="flex items-center gap-2.5 flex-shrink-0">
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
                className="flex items-center justify-center gap-2 px-5 py-2.5 bg-white/10 border border-white/15 text-white text-sm font-bold rounded-xl hover:bg-white/20 transition-all flex-shrink-0"
              >
                <LogOut size={16} /> {t('workerPortal.logout')}
              </button>
            </div>
          </div>

          {/* ── Section tabs — switches between "Assigned Orders" and "Work
              History" as two separate views, rather than anchoring a scroll
              to sections stacked in one long page. ── */}
          <nav className="relative flex items-center gap-1 px-4 md:px-5 border-t border-white/15 overflow-x-auto scrollbar-hide">
            {[
              { id: 'assigned-orders', label: t('workerPortal.tabs.assignedOrders') },
              { id: 'work-history', label: t('workerPortal.tabs.workHistory') },
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

        {activeTab === 'assigned-orders' && (
        <div>
          <SectionHeading eyebrow={`${myOrders.length} ${t('workerPortal.assignedCount')}`}>{t('workerPortal.assignedOrdersHeading')}</SectionHeading>

          {myOrders.length === 0 ? (
            <div className="bg-white rounded-xl border border-dashed border-slate-200 p-10 text-center">
              <div className="w-14 h-14 bg-primary-light ring-8 ring-primary-light/40 rounded-full flex items-center justify-center mx-auto mb-4 text-primary/40">
                <Scissors size={26} />
              </div>
              <h3 className="text-lg font-bold text-slate-400">{t('workerPortal.noOrdersTitle')}</h3>
              <p className="text-slate-400 text-sm font-medium mt-1.5">{t('workerPortal.noOrdersHint')}</p>
            </div>
          ) : (
            <div className="space-y-5">
              {myOrders.map((order, cardIndex) => {
                const effectiveStages = getEffectiveStages(order);
                const stageIndex = effectiveStages.indexOf(order.workStage);
                const isLastStage = stageIndex === effectiveStages.length - 1;
                const workerStatus = getWorkerStatus(order);
                const isBusy = statusBusyId === order._id;
                // This worker already sent the finished work to the admin
                // (workerStatus reached "Completed") and is waiting on the
                // admin to confirm it.
                const awaitingAdmin = order.pendingCompletion
                  && order.pendingCompletion.stage === order.workStage
                  && order.pendingCompletion.workerId?.toString() === currentWorker?._id?.toString();
                // Another one of this worker's orders is already active
                // (In-Progress / Blocked / Completed-Review) and it isn't
                // this one — so this order has to wait its turn.
                const lockedByOtherOrder = activeOrder && activeOrder._id !== order._id;
                const isExpanded = expandedOrders.has(order._id);
                return (
                  <motion.div
                    key={order._id}
                    layout
                    initial={{ opacity: 0, y: 14 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: cardIndex * 0.05, ease: 'easeOut' }}
                    className="relative bg-white rounded-xl border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow overflow-hidden"
                  >
                    <div className="p-6 space-y-4">
                      {/* ── Title row: icon tinted by status, name, and a single
                          bold status line on the right — the one thing that
                          matters most about this card at a glance. ── */}
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                        <div className="flex items-center gap-3.5 min-w-0">
                          <div
                            className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
                            style={{ backgroundColor: `${(WORKER_STATUS_META[workerStatus] || {}).color || '#94A3B8'}1A`, color: (WORKER_STATUS_META[workerStatus] || {}).color || '#64748B' }}
                          >
                            <Scissors size={19} />
                          </div>
                          <div className="min-w-0">
                            <h3 className="font-display text-lg font-bold text-slate-900 truncate">{td(order.orderType)}</h3>
                            <p className="flex items-center gap-1.5 text-slate-500 text-xs font-medium mt-0.5">
                              <User size={12} /> {getCustomerName(order.customerId)}
                            </p>
                          </div>
                        </div>

                        {awaitingAdmin ? (
                          <span className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 text-amber-600 text-xs font-bold rounded-xl whitespace-nowrap">
                            <Clock3 size={13} /> {t('workerPortal.awaitingAdminConfirmation')}
                          </span>
                        ) : (
                          <span
                            className="flex-shrink-0 flex items-center gap-1.5 text-xs font-bold whitespace-nowrap"
                            style={{ color: (WORKER_STATUS_META[workerStatus] || {}).color || '#64748B' }}
                          >
                            <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: (WORKER_STATUS_META[workerStatus] || {}).color || '#94A3B8' }} />
                            {getWorkerStatusLabel(order, language)}
                          </span>
                        )}
                      </div>

                      {/* ── Secondary tags: stage, re-assigned, wait-your-turn —
                          quieter than the primary status so they don't compete. ── */}
                      <div className="flex flex-wrap items-center gap-1.5 pl-[3.25rem]">
                        <span className="inline-block px-2.5 py-1 rounded-xl text-[10px] font-bold uppercase tracking-wide bg-slate-50 text-slate-500 border border-slate-100">
                          {order.workStage ? t(`stages.${order.workStage}`, { defaultValue: order.workStage }) : t('workerPortal.notStarted')}
                        </span>
                        {isMasterTailor && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-[10px] font-bold uppercase tracking-wide bg-violet-50 text-violet-600 border border-violet-100">
                            <UserCog size={11} /> {t('workerPortal.masterTailor')}
                          </span>
                        )}
                        {order.wasReassigned && (
                          <span className="inline-block px-2.5 py-1 rounded-xl text-[10px] font-bold uppercase tracking-wide bg-red-50 text-red-600 border border-red-200">
                            {t('workerPortal.reAssigned')}
                          </span>
                        )}
                        {lockedByOtherOrder && workerStatus === 'Pending' && (
                          <span className="inline-block px-2.5 py-1 rounded-xl text-[10px] font-bold uppercase tracking-wide bg-slate-100 text-slate-400">
                            {t('workerPortal.waitYourTurn')}
                          </span>
                        )}
                      </div>

                      {workerStatus === 'Blocked' && order.workerBlockReason && (
                        <p className="text-red-500 text-xs font-bold pl-[3.25rem]">{t('workerPortal.blockReason', { reason: order.workerBlockReason })}</p>
                      )}
                      {workerStatus === 'Blocked' && order.workerWantsGuidance && !order.adminGuidance && (
                        <p className="text-amber-500 text-xs font-bold pl-[3.25rem]">{t('workerPortal.waitingForGuidanceRequest')}</p>
                      )}
                      {workerStatus === 'Blocked' && order.adminGuidance && (
                        <div className="flex items-start gap-1.5 ml-[3.25rem] bg-emerald-50 border border-emerald-100 text-emerald-700 text-xs font-bold px-3 py-2 rounded-xl">
                          <MessageSquareWarning size={14} className="mt-0.5 flex-shrink-0" />
                          <span>{t('workerPortal.adminGuidance', { guidance: language === 'ur' ? (order.adminGuidanceUrdu || order.adminGuidance) : order.adminGuidance })}</span>
                        </div>
                      )}

                      {/* ✅ Catalog design picture — shown up front (not hidden
                          behind the toggle) since it's the worker's actual visual
                          reference while sewing/embroidering, not just metadata.
                          Clickable when the full catalog record still exists, so
                          the worker can flip through every reference photo (not
                          just the one cover shot saved on the order itself). */}
                      {order.selectedDesignImage && (() => {
                        const linkedDesign = order.selectedDesignId
                          ? designs.find(d => d._id === order.selectedDesignId)
                          : null;
                        const extraCount = linkedDesign?.images?.length > 1 ? linkedDesign.images.length - 1 : 0;
                        const Wrapper = linkedDesign ? 'button' : 'div';
                        // ✅ Pick ONE language's name to show, matching the
                        // toggle — never English name + Urdu name mixed on
                        // the same card. Prefer the live catalog design's
                        // name (kept in sync if it's ever edited), falling
                        // back to whatever was denormalized onto the order
                        // itself if the catalog design was later deleted.
                        const displayName = language === 'ur'
                          ? (linkedDesign?.nameUrdu || order.selectedDesignNameUrdu || linkedDesign?.name || order.selectedDesignName)
                          : (linkedDesign?.name || order.selectedDesignName);
                        return (
                          <Wrapper
                            type={linkedDesign ? 'button' : undefined}
                            onClick={linkedDesign ? () => setViewingDesign(linkedDesign) : undefined}
                            className={`flex items-center gap-3 ml-[3.25rem] bg-slate-50 border border-slate-100 rounded-xl p-2.5 pr-4 text-left ${linkedDesign ? 'hover:bg-slate-100 hover:border-slate-200 transition-colors cursor-pointer' : ''}`}
                          >
                            <div className="relative flex-shrink-0">
                              <DesignThumb
                                src={order.selectedDesignImage}
                                alt={displayName || 'Design'}
                                className="w-11 h-11 rounded-xl object-cover"
                                iconSize={16}
                              />
                              {extraCount > 0 && (
                                <span className="absolute -bottom-1 -right-1 px-1.5 py-0.5 rounded-full text-[8px] font-bold bg-black/60 text-white">
                                  +{extraCount}
                                </span>
                              )}
                            </div>
                            <div className="min-w-0">
                              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{t('workerPortal.referenceDesign')}</p>
                              <p dir={language === 'ur' && (linkedDesign?.nameUrdu || order.selectedDesignNameUrdu) ? 'rtl' : 'ltr'} className="text-xs font-bold text-slate-700 truncate">{displayName}</p>
                              {linkedDesign && (
                                <p className="text-[10px] font-bold text-primary flex items-center gap-1 mt-0.5">
                                  <Maximize2 size={10} /> {t('workerPortal.viewAllPhotos')}
                                </p>
                              )}
                            </div>
                          </Wrapper>
                        );
                      })()}

                      {/* ✅ Full order spec — neck/cuff/lap/pant/pocket/button/
                          elastic/embroidery/style/book & design numbers. Kept
                          collapsed by default so cards don't get overwhelming,
                          but every field the Admin filled in is available here. */}
                      <div className="pl-[3.25rem]">
                        <button
                          type="button"
                          onClick={() => toggleExpanded(order._id)}
                          className="flex items-center gap-1.5 text-primary font-bold text-xs uppercase tracking-wide hover:text-primary-dark transition-colors"
                        >
                          <ClipboardList size={13} />
                          {isExpanded ? t('workerPortal.hideOrderDetails') : t('workerPortal.viewFullOrderDetails')}
                          <ChevronDown size={13} className={`transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                        </button>
                        {isExpanded && (
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 mt-3">
                            <DetailField label={t('workerPortal.fields.category')} value={td(order.orderCategory)} />
                            <DetailField label={t('workerPortal.fields.neck')} value={td(order.neckStyle)} />
                            <DetailField label={t('workerPortal.fields.cuff')} value={td(order.cuffStyle)} />
                            <DetailField label={t('workerPortal.fields.lap')} value={td(order.lapStyle)} />
                            <DetailField label={t('workerPortal.fields.pant')} value={td(order.pantStyle)} />
                            <DetailField label={t('workerPortal.fields.pocket')} value={td(order.pocketStyle)} />
                            <DetailField label={t('workerPortal.fields.button')} value={td(order.buttonStyle)} />
                            <DetailField label={t('workerPortal.fields.elastic')} value={td(order.elastic)} />
                            <DetailField label={t('workerPortal.fields.embroidery')} value={td(order.embroidery)} />
                            <DetailField label={t('workerPortal.fields.stitchStyle')} value={td(order.style)} />
                            <DetailField label={t('workerPortal.fields.bookNumber')} value={order.bookNumber} />
                            <DetailField label={t('workerPortal.fields.designNumber')} value={order.designNumber} />
                          </div>
                        )}
                      </div>
                    </div>

                    {/* ── Action footer — its own full-width row so buttons
                        never squeeze awkwardly next to the title on small
                        screens. Hidden entirely once the stage is invalid or
                        the worker is just waiting on the Admin. ── */}
                    {!awaitingAdmin && stageIndex !== -1 && (
                      <div className="border-t border-slate-100 bg-slate-50/60 px-6 py-4">
                        {workerStatus === 'Pending' ? (
                          lockedByOtherOrder ? (
                            <div
                              className="flex items-center gap-2 text-slate-400 font-bold text-sm"
                              title={t('workerPortal.completeCurrentOrderFirstTitle')}
                            >
                              <Lock size={16} /> {t('workerPortal.completeCurrentOrderFirst')}
                            </div>
                          ) : (
                            <button
                              onClick={() => advanceWorkerStatus(order, 'In-Progress')}
                              disabled={isBusy}
                              className="primary-btn px-6 py-2.5 rounded-xl text-sm shadow-sm disabled:opacity-60 inline-flex items-center gap-2"
                            >
                              {isBusy
                                ? <Loader2 className="animate-spin" size={16} />
                                : (isMasterTailor && stageIndex > 0
                                    ? t('workerPortal.continueStage', { stage: t(`stages.${order.workStage}`, { defaultValue: order.workStage }) })
                                    : t('workerPortal.startWork'))}
                            </button>
                          )
                        ) : workerStatus === 'In-Progress' ? (
                          <div className="flex flex-wrap items-center gap-2.5">
                            <button
                              onClick={() => advanceWorkerStatus(order, 'Completed-Review')}
                              disabled={isBusy}
                              className="px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-bold text-sm rounded-xl shadow-sm disabled:opacity-60"
                            >
                              {isBusy ? <Loader2 className="animate-spin" size={16} /> : t('workerPortal.markCompletedReview')}
                            </button>
                            <button
                              onClick={() => handleReportBlock(order)}
                              disabled={isBusy}
                              className="flex items-center gap-2 px-5 py-2.5 bg-white border border-red-200 hover:bg-red-50 text-red-500 font-bold text-sm rounded-xl disabled:opacity-60"
                            >
                              <OctagonAlert size={16} /> {t('workerPortal.reportBlock')}
                            </button>
                          </div>
                        ) : workerStatus === 'Blocked' ? (
                          order.workerWantsGuidance && !order.adminGuidance ? (
                            <div className="flex items-center gap-2 text-amber-600 font-bold text-sm">
                              <Clock3 size={16} /> {t('workerPortal.waitingForGuidelines')}
                            </div>
                          ) : (
                            <div className="flex flex-wrap items-center gap-2.5">
                              <button
                                onClick={() => advanceWorkerStatus(order, 'Completed-Review')}
                                disabled={isBusy}
                                className="px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-bold text-sm rounded-xl shadow-sm disabled:opacity-60"
                              >
                                {isBusy ? <Loader2 className="animate-spin" size={16} /> : t('workerPortal.markCompletedReview')}
                              </button>
                              <button
                                onClick={() => advanceWorkerStatus(order, 'In-Progress')}
                                disabled={isBusy}
                                className="flex items-center gap-2 px-5 py-2.5 bg-white border border-slate-200 hover:bg-slate-100 text-slate-600 font-bold text-sm rounded-xl disabled:opacity-60"
                              >
                                <RotateCcw size={16} /> {t('workerPortal.resumeWork')}
                              </button>
                            </div>
                          )
                        ) : workerStatus === 'Completed-Review' ? (
                          isLastStage ? (
                            <button
                              onClick={() => setConfirmModal({
                                order,
                                title: order.wasReassigned ? t('workerPortal.redoFinishedTitle') : t('workerPortal.finishCraftingTitle'),
                                message: order.wasReassigned
                                  ? t('workerPortal.confirmFinishRedoMessage', { orderType: td(order.orderType) })
                                  : t('workerPortal.confirmFinishMessage', { orderType: td(order.orderType) }),
                                tone: 'success',
                              })}
                              className="flex items-center gap-2 px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-sm rounded-xl shadow-sm"
                            >
                              <PackageCheck size={16} /> {order.wasReassigned ? t('workerPortal.finishCraftingRedo') : t('workerPortal.finishCrafting')}
                            </button>
                          ) : (
                            <button
                              onClick={() => setConfirmModal({
                                order,
                                title: isMasterTailor
                                  ? t('workerPortal.masterStageTitle', { stage: t(`stages.${order.workStage}`, { defaultValue: order.workStage }), nextStage: t(`stages.${effectiveStages[stageIndex + 1]}`, { defaultValue: effectiveStages[stageIndex + 1] }) })
                                  : (order.wasReassigned ? t('workerPortal.stageDoneRedoTitle', { stage: t(`stages.${order.workStage}`, { defaultValue: order.workStage }) }) : t('workerPortal.stageDoneTitle', { stage: t(`stages.${order.workStage}`, { defaultValue: order.workStage }) })),
                                message: isMasterTailor
                                  ? t('workerPortal.confirmMasterStageMessage', { orderType: td(order.orderType), stage: t(`stages.${order.workStage}`, { defaultValue: order.workStage }), nextStage: t(`stages.${effectiveStages[stageIndex + 1]}`, { defaultValue: effectiveStages[stageIndex + 1] }) })
                                  : (order.wasReassigned
                                      ? t('workerPortal.confirmStageRedoMessage', { orderType: td(order.orderType), stage: t(`stages.${order.workStage}`, { defaultValue: order.workStage }) })
                                      : t('workerPortal.confirmStageMessage', { orderType: td(order.orderType), stage: t(`stages.${order.workStage}`, { defaultValue: order.workStage }) })),
                                tone: 'primary',
                              })}
                              className="primary-btn px-6 py-2.5 rounded-xl text-sm shadow-sm"
                            >
                              {(() => {
                                const stageLabel = t(`stages.${order.workStage}`, { defaultValue: order.workStage });
                                const nextStageLabel = t(`stages.${effectiveStages[stageIndex + 1]}`, { defaultValue: effectiveStages[stageIndex + 1] });
                                return isMasterTailor
                                  ? t('workerPortal.markStageDoneArrow', { stage: stageLabel, nextStage: nextStageLabel })
                                  : (order.wasReassigned
                                      ? t('workerPortal.markStageDoneRedo', { stage: stageLabel })
                                      : t('workerPortal.markStageDone', { stage: stageLabel }));
                              })()}
                            </button>
                          )
                        ) : null}
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
        )}


        {activeTab === 'work-history' && (
          <div>
            <SectionHeading eyebrow={`${myHistory.length} ${t('workerPortal.completedCount')}`}>{t('workerPortal.historyHeading')}</SectionHeading>
            {myHistory.length === 0 ? (
              <div className="bg-white rounded-xl border border-dashed border-slate-200 p-10 text-center">
                <div className="w-14 h-14 bg-primary-light ring-8 ring-primary-light/40 rounded-full flex items-center justify-center mx-auto mb-4 text-primary/40">
                  <Hash size={26} />
                </div>
                <h3 className="text-lg font-bold text-slate-400">{t('workerPortal.noHistoryTitle')}</h3>
                <p className="text-slate-400 text-sm font-medium mt-1.5">{t('workerPortal.noHistoryHint')}</p>
              </div>
            ) : (
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="overflow-x-auto scrollbar-hide">
                <table className="w-full text-sm min-w-[640px]">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100">
                      <th className="text-left font-bold uppercase text-[10px] tracking-widest text-slate-400 px-6 py-3">
                        <span className="flex items-center gap-1.5"><Hash size={11} /> {t('workerPortal.table.order')}</span>
                      </th>
                      <th className="text-left font-bold uppercase text-[10px] tracking-widest text-slate-400 px-6 py-3">{t('workerPortal.table.customer')}</th>
                      <th className="text-left font-bold uppercase text-[10px] tracking-widest text-slate-400 px-6 py-3">{t('workerPortal.table.stage')}</th>
                      <th className="text-right font-bold uppercase text-[10px] tracking-widest text-slate-400 px-6 py-3">{t('workerPortal.table.date')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pagedHistory.map(({ order, stage, at }, i) => (
                      <motion.tr
                        key={`${order._id}-${stage}-${at}`}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.25, delay: Math.min(i, 10) * 0.03 }}
                        onClick={() => navigate(`/order/${order._id}`)}
                        className={`cursor-pointer transition-colors hover:bg-slate-50 ${i > 0 ? 'border-t border-slate-100' : ''}`}
                      >
                        <td className="px-6 py-3.5 font-bold text-slate-800 whitespace-nowrap">{td(order.orderType)}</td>
                        <td className="px-6 py-3.5 text-slate-500 font-medium whitespace-nowrap">{getCustomerName(order.customerId)}</td>
                        <td className="px-6 py-3.5">
                          <span className="inline-block px-2.5 py-1 rounded-xl text-[10px] font-bold uppercase tracking-wide bg-emerald-50 text-emerald-700 whitespace-nowrap">
                            {t(`stages.${stage}`, { defaultValue: stage })}
                          </span>
                        </td>
                        <td className="px-6 py-3.5 text-right text-slate-400 text-xs font-medium whitespace-nowrap">
                          {new Date(at).toLocaleString()}
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {historyTotalPages > 1 && (
                <div className="flex items-center justify-between gap-4 px-6 py-4 bg-slate-50 border-t border-slate-100">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    {t('workerPortal.pageOf', { current: historySafePage, total: historyTotalPages })}
                  </p>
                  <PaginationControls
                    currentPage={historySafePage}
                    totalPages={historyTotalPages}
                    onPrev={() => setHistoryPage(p => Math.max(1, p - 1))}
                    onNext={() => setHistoryPage(p => Math.min(historyTotalPages, p + 1))}
                  />
                </div>
              )}
            </div>
            )}
          </div>
        )}

        <PortalFooter />
      </div>

      {confirmModal && (
        <ConfirmModal
          title={confirmModal.title}
          message={confirmModal.message}
          tone={confirmModal.tone}
          confirming={busy}
          onConfirm={runConfirm}
          onCancel={() => setConfirmModal(null)}
        />
      )}

      {blockModalOrder && (
        <BlockReportModal
          order={blockModalOrder}
          submitting={reportingBlock}
          error={blockError}
          onSubmit={submitBlockReport}
          onCancel={() => { setBlockModalOrder(null); setBlockError(''); }}
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

export default WorkerPortal;
