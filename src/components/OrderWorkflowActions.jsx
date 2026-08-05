import React, { useState } from 'react';
import { useLocalState } from '../context/useLocalState';
import ConfirmModal from './ConfirmModal';
import AssignWorkerModal from './AssignWorkerModal';
import GuidanceModal from './GuidanceModal';
import {
  Clock3, RotateCcw, OctagonAlert, MessageSquareWarning, PackageCheck,
} from 'lucide-react';
import { STAGES, getEffectiveStages, isMasterTailorOrder } from '../utils/stages';
import { useLanguage } from '../context/LanguageContext';
import { useTranslation } from 'react-i18next';

// All of the order's workflow controls (Process Order, Assign Worker,
// Mark Done, Reject/Re-Assign, Send Guidance, Mark as Received) — moved
// here from the Orders list so they only appear once the admin has
// actually opened a specific order, instead of cluttering every row in
// the list. Same behavior/logic as before, just relocated.
const OrderWorkflowActions = ({ order, workers, trailingActions }) => {
  const { updateOrderStatus, sendGuidance } = useLocalState();
  const { t } = useTranslation();
  const { td, tn, language } = useLanguage();
  const ui = (en, ur) => (language === 'ur' ? ur : en);

  const [assignModal, setAssignModal] = useState(null);
  const [confirmModal, setConfirmModal] = useState(null);
  const [guidanceModal, setGuidanceModal] = useState(null);
  const [sendingGuidance, setSendingGuidance] = useState(false);
  const [busy, setBusy] = useState(false);

  const effectiveStages = getEffectiveStages(order);
  const stageIndex = effectiveStages.indexOf(order.workStage);
  const isLastStage = stageIndex === effectiveStages.length - 1;
  const orderIsMasterTailor = isMasterTailorOrder(order, workers);
  // ✅ Gate: admin can only move an order to the next stage (or mark it
  // fully finished) once the worker currently holding this stage has
  // tapped "Mark Done" in their portal (pendingCompletion set for this
  // exact stage). Until then the move/finish buttons stay locked so the
  // admin can't skip ahead of the worker's own confirmation.
  const workerConfirmedDone = order.pendingCompletion
    && order.pendingCompletion.stage === order.workStage;
  // ✅ Shared condition for the compact "waiting on worker" chip — true for
  // both the non-last-stage and last-stage variants, since the disabled
  // placeholder is identical either way. Pulling it up here means it can be
  // rendered once, in the same row as Edit/Delete, instead of as two
  // separate full-width bars scattered through the conditional stack below.
  const isWaitingForWorker = order.orderStatus === 'Active' && stageIndex !== -1
    && !workerConfirmedDone && order.workerStatus !== 'Blocked';

  const handleSendGuidance = async (text) => {
    if (!guidanceModal) return;
    setSendingGuidance(true);
    try {
      await sendGuidance(guidanceModal.order._id, { guidance: text, adminName: 'Admin' });
      setGuidanceModal(null);
    } catch (error) {
      alert(ui('Could not send guidance: ', 'رہنمائی بھیجنے میں مسئلہ: ') + (error.response?.data?.error || error.message));
    } finally {
      setSendingGuidance(false);
    }
  };

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
      alert(ui('Could not update the order: ', 'آرڈر اپڈیٹ نہیں ہو سکا: ') + (error.response?.data?.error || error.message));
    } finally {
      setBusy(false);
    }
  };

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
      alert(ui('Could not update the order: ', 'آرڈر اپڈیٹ نہیں ہو سکا: ') + (error.response?.data?.error || error.message));
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <div className="flex flex-col gap-2 sm:gap-3 w-full mt-8">
        {order.orderStatus === 'Pending' && (
          <button
            onClick={() => setAssignModal({
              order,
              title: t('viewOrders.startOrder'),
              stageOptions: [STAGES[0]],
              nextStatus: 'Active',
            })}
            className="primary-btn w-full py-3 sm:py-4 text-sm rounded-xl shadow-lg shadow-primary/20"
          >
            {t('viewOrders.processOrder')}
          </button>
        )}

        {order.orderStatus === 'Active' && stageIndex === -1 && (
          // Legacy/old order that became Active before the stage workflow existed
          <button
            onClick={() => setAssignModal({
              order,
              title: t('viewOrders.setWorkStage'),
              stageOptions: effectiveStages,
              nextStatus: 'Active',
            })}
            className="primary-btn w-full py-3 sm:py-4 text-sm rounded-xl shadow-lg shadow-primary/20"
          >
            {t('viewOrders.startWork')}
          </button>
        )}

        {order.orderStatus === 'Active' && stageIndex !== -1 && !isLastStage && (
          workerConfirmedDone ? (
            <>
              <button
                onClick={() => setAssignModal({
                  order,
                  title: `${t(`stages.${order.workStage}`, { defaultValue: order.workStage })} ${t('viewOrders.done')} ${t(`stages.${effectiveStages[stageIndex + 1]}`, { defaultValue: effectiveStages[stageIndex + 1] })}`,
                  stageOptions: [effectiveStages[stageIndex + 1]],
                  defaultWorkerId: order.assignedWorkerId,
                  nextStatus: 'Active',
                })}
                className="w-full py-3 sm:py-4 text-sm bg-indigo-500 hover:bg-indigo-600 text-white font-bold rounded-xl shadow-lg shadow-indigo-100 transition-all"
              >
                {t(`stages.${order.workStage}`, { defaultValue: order.workStage })} {t('viewOrders.done')} {t(`stages.${effectiveStages[stageIndex + 1]}`, { defaultValue: effectiveStages[stageIndex + 1] })}
              </button>
              <button
                onClick={() => setAssignModal({
                  order,
                  title: `${t('viewOrders.rejectReAssign')} — ${t(`stages.${order.workStage}`, { defaultValue: order.workStage })}`,
                  stageOptions: [order.workStage],
                  defaultWorkerId: order.assignedWorkerId,
                  nextStatus: 'Active',
                  wasReassigned: true,
                })}
                className="w-full py-3 sm:py-4 text-sm bg-red-50 hover:bg-red-100 text-red-600 font-bold rounded-xl border-2 border-red-200 transition-all flex items-center justify-center gap-2"
              >
                <RotateCcw size={15} /> {t('viewOrders.rejectReAssign')}
              </button>
            </>
          ) : order.workerStatus === 'Blocked' ? (
            <button
              onClick={() => setGuidanceModal({ order })}
              className="w-full py-3 sm:py-4 text-sm bg-red-500 hover:bg-red-600 text-white font-bold rounded-xl shadow-lg shadow-red-100 transition-all flex items-center justify-center gap-2"
            >
              <MessageSquareWarning size={15} /> {order.adminGuidance ? t('viewOrders.updateGuidelines') : t('viewOrders.sendGuidelines')}
            </button>
          ) : null
        )}

        {order.orderStatus === 'Active' && stageIndex !== -1 && isLastStage && (
          workerConfirmedDone ? (
            <>
              <button
                onClick={() => setConfirmModal({
                  order,
                  title: t('viewOrders.finishCrafting'),
                  message: orderIsMasterTailor
                    ? t('viewOrders.markAsCompletedWholeOrderCutting', { v1: td(order.orderType), v2: t(`stages.${order.workStage}`, { defaultValue: order.workStage }), v3: tn(order.assignedWorkerName || 'the Master Tailor') })
                    : t('viewOrders.markAsCompletedAfter', { v1: td(order.orderType), v2: t(`stages.${order.workStage}`, { defaultValue: order.workStage }) }),
                  tone: 'success',
                  nextStatus: 'Completed',
                  nextStage: 'Done',
                })}
                className="w-full py-3 sm:py-4 text-sm bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl shadow-lg shadow-emerald-100 transition-all"
              >
                {t('viewOrders.finishCraftingApprove')}
              </button>
              <button
                onClick={() => setAssignModal({
                  order,
                  title: `${t('viewOrders.rejectReAssign')} — ${t(`stages.${order.workStage}`, { defaultValue: order.workStage })}`,
                  stageOptions: [order.workStage],
                  defaultWorkerId: order.assignedWorkerId,
                  nextStatus: 'Active',
                  wasReassigned: true,
                })}
                className="w-full py-3 sm:py-4 text-sm bg-red-50 hover:bg-red-100 text-red-600 font-bold rounded-xl border-2 border-red-200 transition-all flex items-center justify-center gap-2"
              >
                <RotateCcw size={15} /> {t('viewOrders.rejectReAssign')}
              </button>
            </>
          ) : order.workerStatus === 'Blocked' ? (
            <button
              onClick={() => setGuidanceModal({ order })}
              className="w-full py-3 sm:py-4 text-sm bg-red-500 hover:bg-red-600 text-white font-bold rounded-xl shadow-lg shadow-red-100 transition-all flex items-center justify-center gap-2"
            >
              <MessageSquareWarning size={15} /> {order.adminGuidance ? t('viewOrders.updateGuidelines') : t('viewOrders.sendGuidelines')}
            </button>
          ) : null
        )}

        {order.orderStatus === 'Completed' && (
          <button
            onClick={() => setConfirmModal({
              order,
              title: t('viewOrders.markAsReceived'),
              message: t('viewOrders.confirmThatBeenCollectedByCustomer', { v1: td(order.orderType) }),
              tone: 'purple',
              nextStatus: 'Received By Customer',
              nextStage: 'Done',
            })}
            className="w-full py-3 sm:py-4 text-sm bg-purple-500 hover:bg-purple-600 text-white font-bold rounded-xl shadow-lg shadow-purple-100 transition-all flex items-center justify-center gap-2"
          >
            <PackageCheck size={16} /> {t('viewOrders.markAsReceived2')}
          </button>
        )}
        {order.orderStatus === 'Received By Customer' && (
          <button
            className="w-full py-3 sm:py-4 text-sm bg-purple-100 text-purple-600 font-bold rounded-xl cursor-default flex items-center justify-center gap-2"
            disabled
          >
            <PackageCheck size={14} /> {t('viewOrders.delivered')} ✓
          </button>
        )}

        {order.workerStatus === 'Blocked' && (
          <div className="flex items-start gap-1.5 justify-start text-red-600 bg-red-50 border-2 border-red-200 px-3 py-2 rounded-lg text-xs font-bold">
            <OctagonAlert size={14} className="flex-shrink-0 mt-0.5" />
            {t('viewOrders.reportedBlock', {
              v1: tn(order.assignedWorkerName || 'Worker'),
              v2: t(`stages.${order.workStage}`, { defaultValue: order.workStage }),
              v3: order.workerBlockReason ? `: ${order.workerBlockReason}` : '',
            })}
          </div>
        )}

        {/* ✅ Uniform trailing row — the "waiting on worker" chip (when
            applicable) and Edit/Delete always sit together in a single
            wrapping row, all sized and styled the same way, instead of a
            full-width bar stacked above two small pills. */}
        {(isWaitingForWorker || trailingActions) && (
          <div className="flex flex-row flex-wrap items-center gap-2.5">
            {isWaitingForWorker && (
              <button
                disabled
                title={t('viewOrders.waitingWorkerMarkDone')}
                className="inline-flex items-center justify-center gap-1.5 bg-slate-100 text-slate-400 font-bold py-2 px-4 text-xs rounded-xl cursor-not-allowed"
              >
                <Clock3 size={14} /> {t('viewOrders.waitingWorker')}
              </button>
            )}
            {trailingActions}
          </div>
        )}
      </div>

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
    </>
  );
};

export default OrderWorkflowActions;
