import React, { useState } from 'react';
import {
  X, Scissors, Calendar, User, ClipboardList, Tag, Layers, Pencil,
  History, PlusCircle, UserCog, PlayCircle, OctagonAlert,
  CheckCircle2, PackageCheck, MessageSquareWarning, Clock, Trash2, Loader2,
  Maximize2,
} from 'lucide-react';
import {
  getAdminStatusLabel, getAdminStatusColor,
  getWorkerStatus, getWorkerStatusLabel, getWorkerStatusColor,
  STAGE_URDU_LABELS,
} from '../utils/stages';
import DesignDetailModal from './DesignDetailModal';
import { useLanguage } from '../context/LanguageContext';

// Icon + tint per orderHistory event type — lets the timeline read at a
// glance (red for blocked, green for approved/delivered, etc.) instead of
// every entry looking identical.
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

const Row = ({ label, value, fallback }) => (
  <div className="bg-slate-50 p-4 rounded-2xl">
    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{label}</p>
    <p className="font-bold text-slate-700 text-sm">{value || fallback}</p>
  </div>
);

const OrderDetailsModal = ({ order, customerName, onClose, onEdit, onDelete, deleting, designs = [] }) => {
  const [viewingDesign, setViewingDesign] = useState(null);
  const { t, td, tdLog } = useLanguage();

  if (!order) return null;

  // Full catalog record for the design saved on this order (if it still
  // exists) — lets us open the real DesignDetailModal with every reference
  // photo, instead of just the single cover shot copied onto the order.
  const linkedDesign = order.selectedDesignId
    ? designs.find(d => d._id === order.selectedDesignId)
    : null;

  const stageLabel = (stage) => (stage ? t(stage, STAGE_URDU_LABELS[stage] || stage) : stage);

  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center p-3 sm:p-6"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-[2rem] sm:rounded-[2.5rem] p-6 sm:p-10 max-w-2xl w-full max-h-[85vh] overflow-y-auto shadow-2xl relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-8 right-8 p-3 bg-slate-100 hover:bg-slate-200 rounded-2xl text-slate-500 transition-colors"
        >
          <X size={20} />
        </button>

        {/* Header */}
        <div className="flex items-center gap-4 mb-6 pr-16">
          <div className="bg-primary/10 p-4 rounded-2xl text-primary">
            <Scissors size={28} />
          </div>
          <div>
            <h2 className="text-2xl font-black text-slate-800 tracking-tighter uppercase">{td(order.orderType)}</h2>
            <span className={`inline-block mt-1 px-4 py-1 rounded-full text-xs font-black uppercase tracking-widest border-2 ${getAdminStatusColor(order)}`}>
              {getAdminStatusLabel(order, t('en', 'ur'))}
            </span>
          </div>
        </div>

        {/* Meta */}
        <div className="flex flex-wrap gap-6 mb-8 text-slate-600 font-medium text-sm">
          {customerName && (
            <span className="flex items-center gap-2">
              <User size={15} className="text-primary" /> {customerName}
            </span>
          )}
          {order.orderCategory && (
            <span className="flex items-center gap-2">
              <Tag size={15} className="text-primary" /> {td(order.orderCategory)}
            </span>
          )}
          <span className="flex items-center gap-2">
            <Calendar size={15} className="text-primary" />
            {order.createdAt ? new Date(order.createdAt).toLocaleString() : t('N/A', 'دستیاب نہیں')}
          </span>
        </div>

        {/* Live Worker Status — what's actually happening on this order right
            now (separate from the Admin-facing status badge above, which
            only shows the Admin's own side of the workflow). */}
        {order.orderStatus === 'Active' && (
          <div className="flex flex-wrap items-center gap-3 mb-8 p-4 rounded-2xl bg-indigo-50 border-2 border-indigo-100">
            <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">{t('Live Status:', 'موجودہ صورتحال:')}</span>
            <span className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-widest border-2 ${getWorkerStatusColor(order)}`}>
              {order.assignedWorkerName ? `${order.assignedWorkerName} — ` : ''}{getWorkerStatusLabel(order, t('en', 'ur'))}
            </span>
            {getWorkerStatus(order) === 'Blocked' && order.workerBlockReason && (
              <span className="flex items-center gap-1.5 text-xs font-bold text-red-600">
                <OctagonAlert size={13} /> {order.workerBlockReason}
              </span>
            )}
            {order.adminGuidance && (
              <span className="flex items-center gap-1.5 text-xs font-bold text-amber-600">
                <MessageSquareWarning size={13} /> {t('Guidance:', 'رہنمائی:')} {order.adminGuidance}
              </span>
            )}
          </div>
        )}

        {/* Styling Section */}
        <div className="space-y-4 mb-6">
          <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
            <Layers size={14} /> {t('Dress Styling', 'ملبوس کی طرز')}
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <Row label={t('Order Type', 'آرڈر کی قسم')}       value={td(order.orderType)} fallback={t('N/A', 'دستیاب نہیں')} />
            <Row label={t('Neck Style', 'گلا')}                value={td(order.neckStyle)} fallback={t('N/A', 'دستیاب نہیں')} />
            <Row label={t('Cuff Style', 'کف')}                 value={td(order.cuffStyle)} fallback={t('N/A', 'دستیاب نہیں')} />
            <Row label={t('Lap Style', 'لیپ')}                 value={td(order.lapStyle)} fallback={t('N/A', 'دستیاب نہیں')} />
            <Row label={t('Pant Style', 'پینٹ کی طرز')}        value={td(order.pantStyle)} fallback={t('N/A', 'دستیاب نہیں')} />
            <Row label={t('Pocket Style', 'جیب کی طرز')}       value={td(order.pocketStyle)} fallback={t('N/A', 'دستیاب نہیں')} />
            <Row label={t('Button Style', 'بٹن کی طرز')}       value={td(order.buttonStyle)} fallback={t('N/A', 'دستیاب نہیں')} />
            <Row label={t('Elastic', 'الاسٹک')}                 value={td(order.elastic)} fallback={t('N/A', 'دستیاب نہیں')} />
          </div>
        </div>

        {/* Embroidery Section */}
        <div className="space-y-4">
          <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
            <ClipboardList size={14} /> {t('Embroidery & Reference', 'کڑھائی اور حوالہ')}
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <Row label={t('Embroidery', 'کڑھائی')}             value={td(order.embroidery)} fallback={t('N/A', 'دستیاب نہیں')} />
            <Row label={t('Embroidery Style', 'کڑھائی کی طرز')} value={td(order.style)} fallback={t('N/A', 'دستیاب نہیں')} />      {/* ✅ correct field name */}
            <Row label={t('Book Number', 'بک نمبر')}           value={order.bookNumber} fallback={t('N/A', 'دستیاب نہیں')} />
            <Row label={t('Design Number', 'ڈیزائن نمبر')}     value={order.designNumber} fallback={t('N/A', 'دستیاب نہیں')} />
          </div>
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
                  className={`w-full flex items-center gap-4 p-4 bg-primary/5 border-2 border-primary/20 rounded-2xl text-left ${linkedDesign ? 'hover:bg-primary/10 hover:border-primary/30 transition-colors cursor-pointer' : ''}`}
                >
                  <img src={order.selectedDesignImage} alt={order.selectedDesignName || 'Design'} className="w-16 h-16 rounded-xl object-cover flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="font-black text-slate-800 uppercase truncate">{td(order.selectedDesignName)}</p>
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

        {/* Order History — full timeline of everything that's happened on
            this order, newest first. orderHistory is the rich, human-
            readable event log (added alongside this feature); orders
            created before that change won't have it, so we fall back to
            the older stageHistory log (which only records stage hand-offs)
            so the timeline still shows *something* for old orders. */}
        {(() => {
          const timeline = order.orderHistory?.length
            ? [...order.orderHistory].reverse()
            : (order.stageHistory || [])
                .map(h => ({
                  type: 'status_change',
                  description: h.workerName
                    ? t(`${h.workerName} assigned to ${stageLabel(h.stage)}`, `${h.workerName} کو ${stageLabel(h.stage)} کے لیے تفویض کیا گیا`)
                    : stageLabel(h.stage),
                  by: 'Admin',
                  at: h.at,
                }))
                .reverse();
          if (timeline.length === 0) return null;
          return (
            <div className="space-y-4 mt-8 pt-8 border-t border-slate-100">
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <History size={14} /> {t('Order History', 'آرڈر کی تاریخ')}
              </h3>
              <div className="space-y-3">
                {timeline.map((entry, i) => {
                  const meta = HISTORY_META[entry.type] || HISTORY_META.status_change;
                  const Icon = meta.icon;
                  return (
                    <div key={i} className="flex items-start gap-3">
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${meta.tint}`}>
                        <Icon size={14} />
                      </div>
                      <div className="flex-1 min-w-0 pt-0.5">
                        <p className="font-bold text-slate-700 text-sm leading-snug">{tdLog(entry.description)}</p>
                        <p className="text-[10px] text-slate-400 font-medium mt-0.5 flex items-center gap-1">
                          <Clock size={10} /> {entry.at ? new Date(entry.at).toLocaleString() : t('N/A', 'دستیاب نہیں')}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })()}

        <div className="flex flex-col sm:flex-row gap-3 mt-8">
          {onEdit && order.orderStatus !== 'Completed' && order.orderStatus !== 'Received By Customer' && (
            <button
              onClick={() => onEdit(order)}
              className="flex-1 flex items-center justify-center gap-3 primary-btn py-4 rounded-2xl shadow-lg shadow-primary/20"
            >
              <Pencil size={18} /> {t('Edit Order', 'آرڈر میں تبدیلی')}
            </button>
          )}
          {onDelete && (
            <button
              onClick={() => onDelete(order)}
              disabled={deleting}
              className="flex-1 flex items-center justify-center gap-3 bg-red-50 text-red-500 font-bold py-4 rounded-2xl hover:bg-red-500 hover:text-white transition-all disabled:opacity-50"
            >
              {deleting ? <Loader2 size={18} className="animate-spin" /> : <Trash2 size={18} />} {t('Delete Order', 'حذف کریں')}
            </button>
          )}
        </div>
      </div>

      {viewingDesign && (
        <DesignDetailModal
          design={viewingDesign}
          onClose={() => setViewingDesign(null)}
        />
      )}
    </div>
  );
};

export default OrderDetailsModal;
