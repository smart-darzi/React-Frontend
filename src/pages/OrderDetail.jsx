import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useLocalState } from '../context/useLocalState';
import Layout from '../components/Layout';
import DesignDetailModal from '../components/DesignDetailModal';
import DesignThumb from '../components/DesignThumb';
import OrderWorkflowActions from '../components/OrderWorkflowActions';
import {
  ArrowLeft, Scissors, Calendar, User, ClipboardList, Tag, Layers, Pencil,
  History, PlusCircle, UserCog, PlayCircle, OctagonAlert,
  CheckCircle2, PackageCheck, MessageSquareWarning, Clock, PackageSearch,
  Maximize2, Trash2, Loader2, ChevronDown,
} from 'lucide-react';
import {
  getAdminStatusLabel, getAdminStatusColor,
  getWorkerStatus, getWorkerStatusLabel, getWorkerStatusColor,
  STAGE_URDU_LABELS,
} from '../utils/stages';
import { useLanguage } from '../context/LanguageContext';

// Icon + tint per orderHistory event type — same treatment as the old
// OrderDetailsModal, so the timeline reads identically wherever it shows up.
const HISTORY_META = {
  created:       { icon: PlusCircle,          tint: 'bg-slate-100 text-slate-500' },
  edited:        { icon: Pencil,               tint: 'bg-slate-100 text-slate-500' },
  status_change: { icon: UserCog,              tint: 'bg-blue-100 text-blue-600' },
  worker_status: { icon: PlayCircle,           tint: 'bg-indigo-100 text-indigo-600' },
  blocked:       { icon: OctagonAlert,         tint: 'bg-red-100 text-red-600' },
  guidance:      { icon: MessageSquareWarning, tint: 'bg-amber-100 text-amber-600' },
  approved:      { icon: CheckCircle2,         tint: 'bg-emerald-100 text-emerald-600' },
  delivered:     { icon: PackageCheck,         tint: 'bg-purple-100 text-purple-600' },
};

const Row = ({ label, value }) => (
  <div className="bg-slate-50 p-3 sm:p-4 rounded-xl min-w-0">
    <p className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 truncate">{label}</p>
    <p className="font-bold text-slate-700 text-xs sm:text-sm break-words">{value || 'N/A'}</p>
  </div>
);

// ✅ Worker-only privacy filter — a worker should only see order-history
// entries about *their own* work on this order, never another worker's.
// Admin view is completely untouched; this only ever runs for isWorker.
const filterTimelineForWorker = (timeline, workerName) => {
  const name = (workerName || '').trim().toLowerCase();
  return timeline.filter(entry => {
    // Entries the worker authored themselves (started work, blocked,
    // marked complete, self-advanced a stage, ...) are always theirs.
    if (name && entry.by && entry.by.trim().toLowerCase() === name) return true;

    // worker_status / blocked entries are always authored "by" a specific
    // worker — if it wasn't matched above, it belongs to someone else.
    if (entry.type === 'worker_status' || entry.type === 'blocked') return false;

    // Admin's status_change entries cover both per-stage assignments
    // (which name a specific worker) and order-wide milestones like
    // Approve/Deliver (which don't). Only hide the former when it's not
    // this worker; the latter are order-wide and stay visible.
    if (entry.type === 'status_change') {
      const isAssignmentLine = /assign/i.test(entry.description || '');
      if (!isAssignmentLine) return true;
      return Boolean(name) && (entry.description || '').toLowerCase().includes(name);
    }

    // created / edited / guidance — order-wide milestones, not tied to a
    // single worker, so everyone working on the order can see them.
    return true;
  });
};

// The actual order body — identical for every role, only the surrounding
// chrome (sidebar vs standalone header) differs below.
const OrderDetailBody = ({ order, customerName, onEdit, onDelete, deleting, isWorker, workerName, designs = [], isAdmin = false, workers = [] }) => {
  const { t, td, tdLog, tn, language } = useLanguage();
  const [viewingDesign, setViewingDesign] = useState(null);
  const [showAllStyling, setShowAllStyling] = useState(false);
  const [showAllEmbroidery, setShowAllEmbroidery] = useState(false);

  let timeline = order.orderHistory?.length
    ? [...order.orderHistory].reverse()
    : (order.stageHistory || [])
        .map(h => ({
          type: 'status_change',
          description: h.workerName
            ? `${tn(h.workerName)} کو ${STAGE_URDU_LABELS[h.stage] || h.stage} کے لیے تفویض کیا گیا / ${h.workerName} assigned to ${h.stage}`
            : (STAGE_URDU_LABELS[h.stage] ? `${STAGE_URDU_LABELS[h.stage]} / ${h.stage}` : h.stage),
          by: 'Admin',
          at: h.at,
        }))
        .reverse();

  // ✅ Only ever restricts the WORKER's own view — Admin (and Customer) keep
  // seeing the full timeline exactly as before.
  if (isWorker) {
    timeline = filterTimelineForWorker(timeline, workerName);
  }

  // Full catalog record for the design saved on this order (if it still
  // exists) — lets us open the real DesignDetailModal with every reference
  // photo, instead of just the single cover shot copied onto the order.
  const linkedDesign = order.selectedDesignId
    ? designs.find(d => d._id === order.selectedDesignId)
    : null;

  // ✅ Same "+N more" badge used on the Worker/Customer portal cards, so
  // the design thumbnail looks consistent everywhere it's shown.
  const extraCount = linkedDesign?.images?.length > 1 ? linkedDesign.images.length - 1 : 0;

  return (
    <>
    <div className="glass-card rounded-xl overflow-hidden">
      {/* ✅ Colored header banner — visually anchors the card with the
          site's primary color instead of blending into the white body,
          while staying part of the same single card (rounded corners +
          overflow-hidden on the outer wrapper keep it seamless). */}
      <div className="bg-gradient-to-r from-primary to-primary-dark px-4 sm:px-6 md:px-10 py-5 sm:py-8">
        <div className="flex items-center gap-3 sm:gap-4">
          <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-xl overflow-hidden flex-shrink-0 bg-white/15 flex items-center justify-center text-white">
            {linkedDesign?.images?.[0]?.url ? (
              <img src={linkedDesign.images[0].url} alt={td(order.orderType)} className="w-full h-full object-cover" />
            ) : (
              <Scissors size={20} className="sm:hidden" />
            )}
            {!linkedDesign?.images?.[0]?.url && <Scissors size={28} className="hidden sm:block" />}
          </div>
          <div className="min-w-0">
            <h2 className="text-lg sm:text-2xl font-black text-white tracking-tighter uppercase truncate">{td(order.orderType)}</h2>
            <span className={`inline-block mt-1 px-3 sm:px-4 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-black uppercase tracking-widest border-2 ${getAdminStatusColor(order)}`}>
              {getAdminStatusLabel(order, language)}
            </span>
          </div>
        </div>

        {/* Meta */}
        <div className="flex flex-wrap gap-3 sm:gap-6 mt-4 sm:mt-6 text-white/90 font-medium text-xs sm:text-sm">
          {customerName && (
            <span className="flex items-center gap-1.5 sm:gap-2">
              <User size={13} className="text-white/70 sm:hidden" /><User size={15} className="text-white/70 hidden sm:block" /> {tn(customerName)}
            </span>
          )}
          {order.orderCategory && (
            <span className="flex items-center gap-1.5 sm:gap-2">
              <Tag size={13} className="text-white/70 sm:hidden" /><Tag size={15} className="text-white/70 hidden sm:block" /> {td(order.orderCategory)}
            </span>
          )}
          <span className="flex items-center gap-1.5 sm:gap-2">
            <Calendar size={13} className="text-white/70 sm:hidden" /><Calendar size={15} className="text-white/70 hidden sm:block" />
            {order.createdAt ? new Date(order.createdAt).toLocaleString() : 'N/A'}
          </span>
        </div>
      </div>

      <div className="p-4 sm:p-6 md:p-10">

      {/* Live Worker Status */}
      {order.orderStatus === 'Active' && (
        <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-6 sm:mb-8 p-3 sm:p-4 rounded-xl bg-indigo-50 border-2 border-indigo-100">
          <span className="text-[9px] sm:text-[10px] font-black text-indigo-400 uppercase tracking-widest">{t('Live Status:', 'موجودہ صورتحال:')}</span>
          <span className={`px-2.5 sm:px-3 py-1 rounded-full text-[10px] sm:text-xs font-black uppercase tracking-widest border-2 ${getWorkerStatusColor(order)}`}>
            {order.assignedWorkerName ? `${order.assignedWorkerName} — ` : ''}{getWorkerStatusLabel(order, language)}
          </span>
          {getWorkerStatus(order) === 'Blocked' && order.workerBlockReason && (
            <span className="flex items-center gap-1.5 text-[11px] sm:text-xs font-bold text-red-600">
              <OctagonAlert size={13} /> {order.workerBlockReason}
            </span>
          )}
          {order.adminGuidance && (
            <span className="flex items-center gap-1.5 text-[11px] sm:text-xs font-bold text-amber-600">
              <MessageSquareWarning size={13} /> {t('Guidance:', 'ہدایت:')} {language === 'ur' ? (order.adminGuidanceUrdu || order.adminGuidance) : order.adminGuidance}
            </span>
          )}
        </div>
      )}


      {/* Styling Section */}
      <div className="space-y-4 mb-6">
        <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
          <Layers size={14} /> {t('Dress Styling', 'ڈریس اسٹائلنگ')}
        </h3>
        {(() => {
          const stylingFields = [
            { label: t('Order Type', 'آرڈر کی قسم'),   value: td(order.orderType) },
            { label: t('Neck Style', 'گلے کا انداز'),   value: td(order.neckStyle) },
            { label: t('Cuff Style', 'کف کا انداز'),   value: td(order.cuffStyle) },
            { label: t('Lap Style', 'لیپ کا انداز'),    value: td(order.lapStyle) },
            { label: t('Pant Style', 'پینٹ کا انداز'),   value: td(order.pantStyle) },
            { label: t('Pocket Style', 'جیب کا انداز'), value: td(order.pocketStyle) },
            { label: t('Button Style', 'بٹن کا انداز'), value: td(order.buttonStyle) },
            { label: t('Elastic', 'الاسٹک'),      value: td(order.elastic) },
          ];
          const visibleFields = showAllStyling ? stylingFields : stylingFields.slice(0, 3);
          return (
            <>
              <div className="overflow-x-auto scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0">
                <div className="grid grid-cols-[repeat(3,minmax(108px,1fr))] gap-2 sm:gap-3">
                  {visibleFields.map(f => (
                    <Row key={f.label} label={f.label} value={f.value} />
                  ))}
                </div>
              </div>
              {stylingFields.length > 3 && (
                <button
                  type="button"
                  onClick={() => setShowAllStyling(v => !v)}
                  className="flex items-center gap-1.5 ml-auto text-xs font-black text-primary uppercase tracking-widest hover:text-primary-dark transition-colors"
                >
                  {showAllStyling ? t('View Less', 'کم دیکھیں') : t('View More', 'مزید دیکھیں')}
                  <ChevronDown size={14} className={`transition-transform ${showAllStyling ? 'rotate-180' : ''}`} />
                </button>
              )}
            </>
          );
        })()}
      </div>

      {/* Embroidery Section */}
      <div className="space-y-4">
        <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
          <ClipboardList size={14} /> {t('Embroidery & Reference', 'کڑھائی اور حوالہ')}
        </h3>
        {(() => {
          const embroideryFields = [
            { label: t('Embroidery', 'کڑھائی'),       value: td(order.embroidery) },
            { label: t('Embroidery Style', 'کڑھائی کا انداز'), value: td(order.style) },
            { label: t('Book Number', 'کتاب نمبر'),      value: order.bookNumber },
            { label: t('Design Number', 'ڈیزائن نمبر'),    value: order.designNumber },
          ];
          const visibleFields = showAllEmbroidery ? embroideryFields : embroideryFields.slice(0, 3);
          return (
            <>
              <div className="overflow-x-auto scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0">
                <div className="grid grid-cols-[repeat(3,minmax(108px,1fr))] gap-2 sm:gap-3">
                  {visibleFields.map(f => (
                    <Row key={f.label} label={f.label} value={f.value} />
                  ))}
                </div>
              </div>
              {embroideryFields.length > 3 && (
                <button
                  type="button"
                  onClick={() => setShowAllEmbroidery(v => !v)}
                  className="flex items-center gap-1.5 ml-auto text-xs font-black text-primary uppercase tracking-widest hover:text-primary-dark transition-colors"
                >
                  {showAllEmbroidery ? t('View Less', 'کم دیکھیں') : t('View More', 'مزید دیکھیں')}
                  <ChevronDown size={14} className={`transition-transform ${showAllEmbroidery ? 'rotate-180' : ''}`} />
                </button>
              )}
            </>
          );
        })()}
      </div>

      {order.selectedDesignImage && (
        <div className="space-y-4 mt-6">
          <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
            <Layers size={14} /> {t('Catalog Design', 'کیٹلاگ ڈیزائن')}
          </h3>
          {(() => {
            const Wrapper = linkedDesign ? 'button' : 'div';
            return (
              <Wrapper
                type={linkedDesign ? 'button' : undefined}
                onClick={linkedDesign ? () => setViewingDesign(linkedDesign) : undefined}
                className={`w-full flex items-center gap-3 sm:gap-4 p-3 sm:p-4 bg-primary/5 border-2 border-primary/20 rounded-xl text-left ${linkedDesign ? 'hover:bg-primary/10 hover:border-primary/30 transition-colors cursor-pointer' : ''}`}
              >
                <div className="relative flex-shrink-0">
                  <DesignThumb src={order.selectedDesignImage} alt={order.selectedDesignName || 'Design'} className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl object-cover" iconSize={20} />
                  {extraCount > 0 && (
                    <span className="absolute -bottom-1 -right-1 px-1.5 py-0.5 rounded-full text-[9px] font-black bg-black/60 text-white">
                      +{extraCount}
                    </span>
                  )}
                </div>
                <div className="min-w-0">
                  <p className="font-black text-slate-800 uppercase truncate">{t(order.selectedDesignName, order.selectedDesignNameUrdu)}</p>
                  {linkedDesign && (
                    <p className="text-[11px] font-bold text-primary flex items-center gap-1 mt-1">
                      <Maximize2 size={11} /> {t('View full design', 'پوری تفصیل دیکھیں')}
                    </p>
                  )}
                </div>
              </Wrapper>
            );
          })()}
        </div>
      )}

      {/* Order History timeline */}
      {timeline.length > 0 && (
        <div className="space-y-4 mt-8 pt-8 border-t border-slate-100">
          <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
            <History size={14} /> {isWorker ? t('Your Order History', 'آپ کی آرڈر کی تاریخ') : t('Order History', 'آرڈر کی تاریخ')}
          </h3>
          <div className="space-y-3">
            {timeline.map((entry, i) => {
              const meta = HISTORY_META[entry.type] || HISTORY_META.status_change;
              const Icon = meta.icon;
              return (
                <div key={i} className="flex items-start gap-2.5 sm:gap-3">
                  <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${meta.tint}`}>
                    <Icon size={13} className="sm:hidden" /><Icon size={14} className="hidden sm:block" />
                  </div>
                  <div className="flex-1 min-w-0 pt-0.5">
                    <p className="font-bold text-slate-700 text-xs sm:text-sm leading-snug">{tdLog(entry.description)}</p>
                    <p className="text-[9px] sm:text-[10px] text-slate-400 font-medium mt-0.5 flex items-center gap-1">
                      <Clock size={10} /> {entry.at ? new Date(entry.at).toLocaleString() : 'N/A'}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {isAdmin && (
        <div className="mt-8 pt-8 border-t border-slate-100">
          <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 mb-4">
            <UserCog size={14} /> {t('Order Actions', 'آرڈر کے اقدامات')}
          </h3>
          <OrderWorkflowActions
            order={order}
            workers={workers}
            trailingActions={(onEdit || onDelete) && (
              <>
                {onEdit && order.orderStatus !== 'Completed' && order.orderStatus !== 'Received By Customer' && (
                  <button
                    onClick={onEdit}
                    className="inline-flex items-center justify-center gap-1.5 primary-btn py-2 px-4 text-xs rounded-xl shadow-lg shadow-primary/20"
                  >
                    <Pencil size={14} /> {t('Edit Order', 'آرڈر میں تبدیلی')}
                  </button>
                )}
                {onDelete && (
                  <button
                    onClick={() => onDelete(order)}
                    disabled={deleting}
                    className="inline-flex items-center justify-center gap-1.5 bg-red-50 text-red-500 font-bold py-2 px-4 text-xs rounded-xl hover:bg-red-500 hover:text-white transition-all disabled:opacity-50"
                  >
                    {deleting ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />} {t('Delete Order', 'آرڈر حذف کریں')}
                  </button>
                )}
              </>
            )}
          />
        </div>
      )}

      {!isAdmin && (onEdit || onDelete) && (
        <div className="flex flex-row flex-wrap gap-2.5 mt-8">
          {onEdit && order.orderStatus !== 'Completed' && order.orderStatus !== 'Received By Customer' && (
            <button
              onClick={onEdit}
              className="inline-flex items-center justify-center gap-1.5 primary-btn py-2 px-4 text-xs rounded-xl shadow-lg shadow-primary/20"
            >
              <Pencil size={14} /> {t('Edit Order', 'آرڈر میں تبدیلی')}
            </button>
          )}
          {onDelete && (
            <button
              onClick={() => onDelete(order)}
              disabled={deleting}
              className="inline-flex items-center justify-center gap-1.5 bg-red-50 text-red-500 font-bold py-2 px-4 text-xs rounded-xl hover:bg-red-500 hover:text-white transition-all disabled:opacity-50"
            >
              {deleting ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />} {t('Delete Order', 'آرڈر حذف کریں')}
            </button>
          )}
        </div>
      )}
      </div>
    </div>

    {viewingDesign && (
      <DesignDetailModal
        design={viewingDesign}
        onClose={() => setViewingDesign(null)}
      />
    )}
    </>
  );
};

const NotFound = ({ onBack }) => {
  const { t } = useLanguage();
  return (
    <div className="glass-card rounded-xl p-16 text-center">
      <div className="w-16 h-16 bg-primary/10 ring-8 ring-primary/5 rounded-full flex items-center justify-center mx-auto mb-5 text-primary/50">
        <PackageSearch size={30} />
      </div>
      <h3 className="text-lg font-bold text-slate-500">{t('Order not found', 'آرڈر نہیں ملا')}</h3>
      <button onClick={onBack} className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary/10 text-primary font-bold text-sm hover:bg-primary/20 transition-colors">
        <ArrowLeft size={16} /> {t('Back', 'واپس')}
      </button>
    </div>
  );
};

const OrderDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { orders, customers, designs, workers, currentUser, currentWorker, currentCustomer, deleteOrder } = useLocalState();
  const { t } = useLanguage();
  const [deleting, setDeleting] = useState(false);

  const order = orders.find(o => o._id?.toString() === id?.toString());
  const customerName = order
    ? customers.find(c => c._id?.toString() === order.customerId?.toString())?.name
    : null;

  const isAdmin = Boolean(currentUser || localStorage.getItem('sd_master_auth'));
  const isWorker = !isAdmin && Boolean(currentWorker || localStorage.getItem('sd_worker_auth'));
  const isCustomer = !isAdmin && !isWorker && Boolean(currentCustomer || localStorage.getItem('sd_customer_auth'));

  const handleEdit = order
    ? () => navigate('/add-order', { state: { editOrder: order } })
    : null;

  const handleDelete = order
    ? async () => {
        if (!window.confirm(t('Are you sure you want to delete this order?', 'کیا آپ واقعی اس آرڈر کو حذف کرنا چاہتے ہیں؟'))) return;
        setDeleting(true);
        try {
          await deleteOrder(order._id);
          navigate('/view-orders');
        } catch (error) {
          alert('Could not delete the order: ' + (error.response?.data?.error || error.message));
        } finally {
          setDeleting(false);
        }
      }
    : null;

  // Admin sees this inside the normal dashboard sidebar/layout, same as
  // every other admin page.
  if (isAdmin) {
    return (
      <Layout>
        <div className="max-w-3xl mx-auto space-y-6">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-2 text-slate-500 font-bold text-sm hover:text-primary transition-colors"
          >
            <ArrowLeft size={16} /> {t('Back', 'واپس')}
          </button>
          {order ? (
            <OrderDetailBody order={order} customerName={customerName} onEdit={handleEdit} onDelete={handleDelete} deleting={deleting} designs={designs} isAdmin workers={workers} />
          ) : (
            <NotFound onBack={() => navigate(-1)} />
          )}
        </div>
      </Layout>
    );
  }

  // Worker / Customer — standalone portal-style page (no admin sidebar),
  // matching the look of the Worker/Customer portals they came from.
  return (
    <div className="min-h-screen fabric-bg p-4 md:p-8">
      <div className="max-w-3xl mx-auto space-y-6">
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
        >
          <button
            onClick={() => navigate(isCustomer ? '/customer-portal' : '/worker-portal')}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-600 font-bold text-sm hover:bg-primary/5 hover:text-primary hover:border-primary/20 transition-colors"
          >
            <ArrowLeft size={16} /> {t('Back', 'واپس')}
          </button>
        </motion.div>
        {order ? (
          <OrderDetailBody
            order={order}
            customerName={customerName}
            onEdit={null}
            isWorker={isWorker}
            workerName={currentWorker?.name}
            designs={designs}
          />
        ) : (
          <NotFound onBack={() => navigate(isCustomer ? '/customer-portal' : '/worker-portal')} />
        )}
      </div>
    </div>
  );
};

export default OrderDetail;
