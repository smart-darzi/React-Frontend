import React, { useState } from 'react';
import {
  X, Scissors, Calendar, User, ClipboardList, Tag, Layers, Pencil,
  History, PlusCircle, UserCog, PlayCircle, OctagonAlert,
  CheckCircle2, PackageCheck, MessageSquareWarning, Clock, Trash2, Loader2,
  Maximize2, ChevronDown,
} from 'lucide-react';
import {
  getAdminStatusLabel, getAdminStatusColor,
  getWorkerStatus, getWorkerStatusLabel, getWorkerStatusColor,
} from '../utils/stages';
import DesignDetailModal from './DesignDetailModal';
import DesignThumb from './DesignThumb';
import { useLanguage } from '../context/LanguageContext';
import { useTranslation } from 'react-i18next';

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

const Row = ({ label, value, naLabel }) => (
  <div className="bg-slate-50 p-4 rounded-xl">
    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{label}</p>
    <p className="font-bold text-slate-700 text-sm">{value || naLabel}</p>
  </div>
);

const OrderDetailsModal = ({ order, customerName, onClose, onEdit, onDelete, deleting, designs = [] }) => {
  const { t } = useTranslation();
  const { td, tdLog, tn, language } = useLanguage();
  const [viewingDesign, setViewingDesign] = useState(null);
  const [showAllStyling, setShowAllStyling] = useState(false);

  if (!order) return null;

  // Full catalog record for the design saved on this order (if it still
  // exists) — lets us open the real DesignDetailModal with every reference
  // photo, instead of just the single cover shot copied onto the order.
  const linkedDesign = order.selectedDesignId
    ? designs.find(d => d._id === order.selectedDesignId)
    : null;

  // ✅ Pick ONE language's name to show, matching the toggle — never
  // English name + Urdu name mixed on the same card. Prefer the live
  // catalog design's name, falling back to whatever was denormalized
  // onto the order itself if the catalog design was later deleted.
  const selectedDesignDisplayName = language === 'ur'
    ? (linkedDesign?.nameUrdu || order.selectedDesignNameUrdu || linkedDesign?.name || order.selectedDesignName)
    : (linkedDesign?.name || order.selectedDesignName);

  // ✅ Same "+N more" badge used on the Worker/Customer portal cards, so
  // the design thumbnail looks consistent everywhere it's shown.
  const extraCount = linkedDesign?.images?.length > 1 ? linkedDesign.images.length - 1 : 0;

  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center p-3 sm:p-6"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl max-w-2xl w-full max-h-[85vh] overflow-y-auto shadow-2xl relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-6 right-6 sm:top-8 sm:right-8 p-3 bg-white/15 hover:bg-white/25 rounded-xl text-white transition-colors z-10"
        >
          <X size={20} />
        </button>

        {/* ✅ Colored header banner — visually anchors the modal with the
            site's primary color instead of blending into the white body,
            while staying part of the same single card. */}
        <div className="bg-gradient-to-r from-primary to-primary-dark rounded-t-xl px-6 sm:px-10 py-8">
          <div className="flex items-center gap-4 pr-14">
            <div className="bg-white/15 p-4 rounded-xl text-white flex-shrink-0">
              <Scissors size={28} />
            </div>
            <div className="min-w-0">
              <h2 className="text-2xl font-black text-white tracking-tighter uppercase truncate">{td(order.orderType)}</h2>
              <span className={`inline-block mt-1 px-4 py-1 rounded-full text-xs font-black uppercase tracking-widest border-2 ${getAdminStatusColor(order)}`}>
                {getAdminStatusLabel(order, language)}
              </span>
            </div>
          </div>

          {/* Meta */}
          <div className="flex flex-wrap gap-6 mt-6 text-white/90 font-medium text-sm">
            {customerName && (
              <span className="flex items-center gap-2">
                <User size={15} className="text-white/70" /> {tn(customerName)}
              </span>
            )}
            {order.orderCategory && (
              <span className="flex items-center gap-2">
                <Tag size={15} className="text-white/70" /> {td(order.orderCategory)}
              </span>
            )}
            <span className="flex items-center gap-2">
              <Calendar size={15} className="text-white/70" />
              {order.createdAt ? new Date(order.createdAt).toLocaleString() : t('orderDetails.na')}
            </span>
          </div>
        </div>

        <div className="p-6 sm:p-10">

        {/* Live Worker Status — what's actually happening on this order right
            now (separate from the Admin-facing status badge above, which
            only shows the Admin's own side of the workflow). */}
        {order.orderStatus === 'Active' && (
          <div className="flex flex-wrap items-center gap-3 mb-8 p-4 rounded-xl bg-indigo-50 border-2 border-indigo-100">
            <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">{t('orderDetails.liveStatus')}</span>
            <span className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-widest border-2 ${getWorkerStatusColor(order)}`}>
              {order.assignedWorkerName ? `${order.assignedWorkerName} — ` : ''}{getWorkerStatusLabel(order, language)}
            </span>
            {getWorkerStatus(order) === 'Blocked' && order.workerBlockReason && (
              <span className="flex items-center gap-1.5 text-xs font-bold text-red-600">
                <OctagonAlert size={13} /> {order.workerBlockReason}
              </span>
            )}
            {order.adminGuidance && (
              <span className="flex items-center gap-1.5 text-xs font-bold text-amber-600">
                <MessageSquareWarning size={13} /> {t('orderDetails.guidance')} {language === 'ur' ? (order.adminGuidanceUrdu || order.adminGuidance) : order.adminGuidance}
              </span>
            )}
          </div>
        )}

        {/* Styling Section */}
        <div className="space-y-4 mb-6">
          <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
            <Layers size={14} /> {t('orderDetails.dressStyling')}
          </h3>
          {(() => {
            const stylingFields = [
              { label: t('orderDetails.orderType'),   value: td(order.orderType) },
              { label: t('orderDetails.neckStyle'),   value: td(order.neckStyle) },
              { label: t('orderDetails.cuffStyle'),   value: td(order.cuffStyle) },
              { label: t('orderDetails.lapStyle'),    value: td(order.lapStyle) },
              { label: t('orderDetails.pantStyle'),   value: td(order.pantStyle) },
              { label: t('orderDetails.pocketStyle'), value: td(order.pocketStyle) },
              { label: t('orderDetails.buttonStyle'), value: td(order.buttonStyle) },
              { label: t('orderDetails.elastic'),     value: td(order.elastic) },
            ];
            const visibleFields = showAllStyling ? stylingFields : stylingFields.slice(0, 3);
            return (
              <>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {visibleFields.map(f => (
                    <Row key={f.label} label={f.label} value={f.value} naLabel={t('orderDetails.na')} />
                  ))}
                </div>
                {stylingFields.length > 3 && (
                  <button
                    type="button"
                    onClick={() => setShowAllStyling(v => !v)}
                    className="flex items-center gap-1.5 mx-auto text-xs font-black text-primary uppercase tracking-widest hover:text-primary-dark transition-colors"
                  >
                    {showAllStyling ? t('orderDetails.viewLess') : t('orderDetails.viewMore')}
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
            <ClipboardList size={14} /> {t('orderDetails.embroideryReference')}
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <Row label={t('orderDetails.embroidery')}       value={td(order.embroidery)} naLabel={t('orderDetails.na')} />
            <Row label={t('orderDetails.embroideryStyle')} value={td(order.style)} naLabel={t('orderDetails.na')} />      {/* ✅ correct field name */}
            <Row label={t('orderDetails.bookNumber')}      value={order.bookNumber} naLabel={t('orderDetails.na')} />
            <Row label={t('orderDetails.designNumber')}    value={order.designNumber} naLabel={t('orderDetails.na')} />
          </div>
        </div>

        {order.selectedDesignImage && (
          <div className="space-y-4 mt-6">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <Layers size={14} /> {t('orderDetails.catalogDesign')}
            </h3>
            {(() => {
              const Wrapper = linkedDesign ? 'button' : 'div';
              return (
                <Wrapper
                  type={linkedDesign ? 'button' : undefined}
                  onClick={linkedDesign ? () => setViewingDesign(linkedDesign) : undefined}
                  className={`w-full flex items-center gap-4 p-4 bg-primary/5 border-2 border-primary/20 rounded-xl text-left ${linkedDesign ? 'hover:bg-primary/10 hover:border-primary/30 transition-colors cursor-pointer' : ''}`}
                >
                  <div className="relative flex-shrink-0">
                    <DesignThumb src={order.selectedDesignImage} alt={selectedDesignDisplayName || 'Design'} className="w-16 h-16 rounded-xl object-cover" iconSize={20} />
                    {extraCount > 0 && (
                      <span className="absolute -bottom-1 -right-1 px-1.5 py-0.5 rounded-full text-[9px] font-black bg-black/60 text-white">
                        +{extraCount}
                      </span>
                    )}
                  </div>
                  <div className="min-w-0">
                    <p dir={language === 'ur' && (linkedDesign?.nameUrdu || order.selectedDesignNameUrdu) ? 'rtl' : 'ltr'} className="font-black text-slate-800 uppercase truncate">{selectedDesignDisplayName}</p>
                    {linkedDesign && (
                      <p className="text-[11px] font-bold text-primary flex items-center gap-1 mt-1">
                        <Maximize2 size={11} /> {t('orderDetails.viewFullDesign')}
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
                    ? t('orderDetails.assignedToStage', { worker: tn(h.workerName), stage: t(`stages.${h.stage}`, { defaultValue: h.stage }) })
                    : t(`stages.${h.stage}`, { defaultValue: h.stage }),
                  by: 'Admin',
                  at: h.at,
                }))
                .reverse();
          if (timeline.length === 0) return null;
          return (
            <div className="space-y-4 mt-8 pt-8 border-t border-slate-100">
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <History size={14} /> {t('orderDetails.orderHistory')}
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
                          <Clock size={10} /> {entry.at ? new Date(entry.at).toLocaleString() : t('orderDetails.na')}
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
              className="flex-1 flex items-center justify-center gap-3 primary-btn py-4 rounded-xl shadow-lg shadow-primary/20"
            >
              <Pencil size={18} /> {t('orderDetails.editOrder')}
            </button>
          )}
          {onDelete && (
            <button
              onClick={() => onDelete(order)}
              disabled={deleting}
              className="flex-1 flex items-center justify-center gap-3 bg-red-50 text-red-500 font-bold py-4 rounded-xl hover:bg-red-500 hover:text-white transition-all disabled:opacity-50"
            >
              {deleting ? <Loader2 size={18} className="animate-spin" /> : <Trash2 size={18} />} {t('orderDetails.deleteOrder')}
            </button>
          )}
        </div>
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
