import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useLocalState } from '../context/useLocalState';
import Layout from '../components/Layout';
import DesignDetailModal from '../components/DesignDetailModal';
import {
  ArrowLeft, Scissors, Calendar, User, ClipboardList, Tag, Layers, Pencil,
  History, PlusCircle, UserCog, PlayCircle, OctagonAlert,
  CheckCircle2, PackageCheck, MessageSquareWarning, Clock, PackageSearch,
  Maximize2,
} from 'lucide-react';
import {
  getAdminStatusLabel, getAdminStatusColor,
  getWorkerStatus, getWorkerStatusLabel, getWorkerStatusColor,
} from '../utils/stages';

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
  <div className="bg-slate-50 p-4 rounded-2xl">
    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{label}</p>
    <p className="font-bold text-slate-700 text-sm">{value || 'N/A'}</p>
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
const OrderDetailBody = ({ order, customerName, onEdit, isWorker, workerName, designs = [] }) => {
  const [viewingDesign, setViewingDesign] = useState(null);

  let timeline = order.orderHistory?.length
    ? [...order.orderHistory].reverse()
    : (order.stageHistory || [])
        .map(h => ({
          type: 'status_change',
          description: h.workerName ? `${h.workerName} ko ${h.stage} ke liye assign kiya gaya` : h.stage,
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

  return (
    <>
    <div className="glass-card rounded-[2.5rem] p-6 md:p-10">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <div className="bg-primary/10 p-4 rounded-2xl text-primary flex-shrink-0">
          <Scissors size={28} />
        </div>
        <div className="min-w-0">
          <h2 className="text-2xl font-black text-slate-800 tracking-tighter uppercase truncate">{order.orderType}</h2>
          <span className={`inline-block mt-1 px-4 py-1 rounded-full text-xs font-black uppercase tracking-widest border-2 ${getAdminStatusColor(order)}`}>
            {getAdminStatusLabel(order)}
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
            <Tag size={15} className="text-primary" /> {order.orderCategory}
          </span>
        )}
        <span className="flex items-center gap-2">
          <Calendar size={15} className="text-primary" />
          {order.createdAt ? new Date(order.createdAt).toLocaleString() : 'N/A'}
        </span>
      </div>

      {/* Live Worker Status */}
      {order.orderStatus === 'Active' && (
        <div className="flex flex-wrap items-center gap-3 mb-8 p-4 rounded-2xl bg-indigo-50 border-2 border-indigo-100">
          <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Live Status:</span>
          <span className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-widest border-2 ${getWorkerStatusColor(order)}`}>
            {order.assignedWorkerName ? `${order.assignedWorkerName} — ` : ''}{getWorkerStatusLabel(order)}
          </span>
          {getWorkerStatus(order) === 'Blocked' && order.workerBlockReason && (
            <span className="flex items-center gap-1.5 text-xs font-bold text-red-600">
              <OctagonAlert size={13} /> {order.workerBlockReason}
            </span>
          )}
          {order.adminGuidance && (
            <span className="flex items-center gap-1.5 text-xs font-bold text-amber-600">
              <MessageSquareWarning size={13} /> Guidance: {order.adminGuidance}
            </span>
          )}
        </div>
      )}

      {/* Styling Section */}
      <div className="space-y-4 mb-6">
        <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
          <Layers size={14} /> Dress Styling
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <Row label="Order Type"    value={order.orderType} />
          <Row label="Neck Style"    value={order.neckStyle} />
          <Row label="Cuff Style"    value={order.cuffStyle} />
          <Row label="Lap Style"     value={order.lapStyle} />
          <Row label="Pant Style"    value={order.pantStyle} />
          <Row label="Pocket Style"  value={order.pocketStyle} />
          <Row label="Button Style"  value={order.buttonStyle} />
          <Row label="Elastic"       value={order.elastic} />
        </div>
      </div>

      {/* Embroidery Section */}
      <div className="space-y-4">
        <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
          <ClipboardList size={14} /> Embroidery & Reference
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <Row label="Embroidery"       value={order.embroidery} />
          <Row label="Embroidery Style" value={order.style} />
          <Row label="Book Number"      value={order.bookNumber} />
          <Row label="Design Number"    value={order.designNumber} />
        </div>
      </div>

      {order.selectedDesignImage && (
        <div className="space-y-4 mt-6">
          <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
            <Layers size={14} /> Catalog Design / کیٹلاگ ڈیزائن
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
                  <p className="font-black text-slate-800 uppercase truncate">{order.selectedDesignName}</p>
                  {linkedDesign && (
                    <p className="text-[11px] font-bold text-primary flex items-center gap-1 mt-1">
                      <Maximize2 size={11} /> View full design / پوری تفصیل دیکھیں
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
            <History size={14} /> {isWorker ? 'Your Order History / آپ کی آرڈر کی تاریخ' : 'Order History / آرڈر کی تاریخ'}
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
                    <p className="font-bold text-slate-700 text-sm leading-snug">{entry.description}</p>
                    <p className="text-[10px] text-slate-400 font-medium mt-0.5 flex items-center gap-1">
                      <Clock size={10} /> {entry.at ? new Date(entry.at).toLocaleString() : 'N/A'}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {onEdit && order.orderStatus !== 'Completed' && order.orderStatus !== 'Received By Customer' && (
        <button
          onClick={onEdit}
          className="mt-8 w-full flex items-center justify-center gap-3 primary-btn py-4 rounded-2xl shadow-lg shadow-primary/20"
        >
          <Pencil size={18} /> Edit Order / آرڈر میں تبدیلی
        </button>
      )}
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

const NotFound = ({ onBack }) => (
  <div className="glass-card rounded-[2.5rem] p-16 text-center">
    <div className="w-16 h-16 bg-primary/10 ring-8 ring-primary/5 rounded-full flex items-center justify-center mx-auto mb-5 text-primary/50">
      <PackageSearch size={30} />
    </div>
    <h3 className="text-lg font-bold text-slate-500">Order nahi mila / Order not found</h3>
    <button onClick={onBack} className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary/10 text-primary font-bold text-sm hover:bg-primary/20 transition-colors">
      <ArrowLeft size={16} /> Back
    </button>
  </div>
);

const OrderDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { orders, customers, designs, currentUser, currentWorker, currentCustomer } = useLocalState();

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
            <ArrowLeft size={16} /> Back
          </button>
          {order ? (
            <OrderDetailBody order={order} customerName={customerName} onEdit={handleEdit} designs={designs} />
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
            <ArrowLeft size={16} /> Back
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
