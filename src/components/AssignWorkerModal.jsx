import React, { useState } from 'react';
import { HardHat, Layers, Loader2, X, Sparkles, UserCog } from 'lucide-react';
import { isRecommendedForStage, isMasterTailorRole, STAGE_URDU_LABELS } from '../utils/stages';
import { useLanguage } from '../context/LanguageContext';

// Popup with Stage dropdown + Worker dropdown + Yes/No confirm.
// stageOptions: array of stage names to choose from (pass a single-item array to lock the stage).
const AssignWorkerModal = ({ title, stageOptions, defaultStage, workers, defaultWorkerId, onConfirm, onCancel, confirming = false }) => {
  const { t, td } = useLanguage();
  const [stage, setStage] = useState(defaultStage || stageOptions?.[0] || '');
  const [workerId, setWorkerId] = useState(defaultWorkerId || '');

  // ✅ Picking a Master Tailor no longer collapses the stage into one
  // "Full Order" blob — their orders still move through the normal
  // Cutting -> Sewing -> Embroidery? -> Ironing stages so real progress
  // stays visible to the admin. What stays different is that this modal
  // is always opened with defaultWorkerId = the order's current worker
  // (see ViewOrders.jsx), so a Master Tailor is already pre-selected here
  // for every later stage — the admin just confirms, no need to go hunting
  // for the same person again in the dropdown.
  const selectedWorker = workers.find(w => w._id === workerId);
  const isMasterPick = selectedWorker && isMasterTailorRole(selectedWorker.role);

  // Put the workers whose role naturally fits this stage (plus Helpers,
  // who fit every stage) at the top of the list, so the admin doesn't have
  // to hunt for the right person — e.g. Cutting stage surfaces Cutters
  // first, Sewing surfaces Tailors first, and so on.
  const sortedWorkers = [...workers].sort((a, b) => {
    const aRec = isRecommendedForStage(a.role, stage) ? 0 : 1;
    const bRec = isRecommendedForStage(b.role, stage) ? 0 : 1;
    return aRec - bRec;
  });

  const handleConfirm = () => {
    if (!workerId) return; // safety net — button is disabled too, but never trust the UI alone
    const worker = workers.find(w => w._id === workerId);
    if (!worker) return;
    onConfirm({
      stage,
      assignedWorkerId: worker._id,
      assignedWorkerName: worker.name,
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[200] flex items-center justify-center p-3 sm:p-6" onClick={onCancel}>
      <div className="bg-white rounded-[2rem] sm:rounded-[2.5rem] p-6 sm:p-10 max-w-md w-full shadow-2xl relative" onClick={(e) => e.stopPropagation()}>
        <button onClick={onCancel} className="absolute top-8 right-8 p-3 bg-slate-100 hover:bg-slate-200 rounded-2xl text-slate-500 transition-colors">
          <X size={18} />
        </button>

        <h3 className="text-2xl font-black text-slate-800 tracking-tight mb-8 pr-10">{td(title)}</h3>

        <div className="space-y-6">
          {stageOptions && stageOptions.length > 1 && (
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-xs font-black text-slate-500 uppercase tracking-widest">
                <Layers size={14} className="text-primary" /> {t('Stage', 'مرحلہ')}
              </label>
              <select
                className="input-field appearance-none cursor-pointer"
                value={stage}
                onChange={(e) => setStage(e.target.value)}
              >
                {stageOptions.map(s => <option key={s} value={s}>{t(s, STAGE_URDU_LABELS[s] || s)}</option>)}
              </select>
            </div>
          )}

          <div className="space-y-2">
            <label className="flex items-center gap-2 text-xs font-black text-slate-500 uppercase tracking-widest">
              <HardHat size={14} className="text-primary" /> {t('Assign Worker', 'ورکر مقرر کریں')}
            </label>
            <select
              className="input-field appearance-none cursor-pointer"
              value={workerId}
              onChange={(e) => setWorkerId(e.target.value)}
            >
              <option value="" disabled>{t('Select a worker', 'ورکر منتخب کریں')}</option>
              {sortedWorkers.map(w => (
                <option key={w._id} value={w._id}>
                  {isRecommendedForStage(w.role, stage) ? '★ ' : ''}{w.name} — {td(w.role)}
                </option>
              ))}
            </select>
            {!workerId && (
              <p className="text-[11px] text-red-500 font-bold px-1">
                {t('A worker must be selected.', 'کام تفویض کرنے کے لیے ورکر منتخب کرنا ضروری ہے۔')}
              </p>
            )}
            {isMasterPick ? (
              <p className="text-[11px] text-violet-600 font-bold px-1 flex items-center gap-1.5 bg-violet-50 border border-violet-100 rounded-xl px-3 py-2">
                <UserCog size={13} className="flex-shrink-0" /> {t('This is a Master Tailor — they handle every stage of the order themselves, and stay the default going forward.', 'یہ ماسٹر درزی ہیں — آرڈر کا ہر مرحلہ خود سنبھالیں گے، آگے بھی یہی ورکر ڈیفالٹ رہے گا۔')}
              </p>
            ) : stage && (
              <p className="text-[11px] text-slate-400 font-medium px-1 flex items-center gap-1">
                <Sparkles size={11} className="text-primary" /> {t(`★ marked workers best fit the ${stage} stage`, `★ نشان زدہ ورکرز ${STAGE_URDU_LABELS[stage] || stage} مرحلے کے لیے موزوں ترین ہیں`)}
              </p>
            )}
          </div>
        </div>

        <div className="flex gap-4 mt-10">
          <button
            onClick={handleConfirm}
            disabled={confirming || !workerId}
            className="primary-btn flex-1 py-4 rounded-2xl shadow-xl shadow-primary/30 disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {confirming ? <Loader2 className="animate-spin" size={18} /> : t('Yes, Confirm', 'ہاں، تصدیق کریں')}
          </button>
          <button
            onClick={onCancel}
            disabled={confirming}
            className="flex-1 py-4 rounded-2xl bg-slate-100 text-slate-600 font-bold hover:bg-slate-200 transition-all disabled:opacity-60"
          >
            {t('No', 'نہیں')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AssignWorkerModal;
