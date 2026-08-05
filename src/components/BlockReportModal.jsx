import React, { useState } from 'react';
import { OctagonAlert, Loader2, ShieldAlert } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { STAGE_URDU_LABELS } from '../utils/stages';

// Usage: <BlockReportModal order={order} onSubmit={fn} onCancel={fn} submitting={bool} error={string} />
// Worker reports why their work is stuck, and says whether they want the
// Admin to send back written guidance before they resume — if yes, the
// worker's own portal keeps "Resume Work" / "Mark Completed" locked until
// that guidance actually arrives.
const BlockReportModal = ({ order, onSubmit, onCancel, submitting = false, error = '' }) => {
  const { t, td } = useLanguage();
  const [reason, setReason] = useState('');
  const [wantsGuidance, setWantsGuidance] = useState(null); // null = not yet answered

  const handleSubmit = () => {
    if (wantsGuidance === null) return;
    onSubmit({ reason: reason.trim(), wantsGuidance });
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[200] flex items-center justify-center p-3 sm:p-6"
      onClick={onCancel}
    >
      <div
        className="bg-white rounded-[2rem] sm:rounded-[2.5rem] p-6 sm:p-10 max-w-md w-full shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-16 h-16 bg-red-100 rounded-xl flex items-center justify-center text-red-500 mb-6">
          <OctagonAlert size={28} />
        </div>
        <h3 className="text-2xl font-black text-slate-800 tracking-tight mb-2">
          {t('Report a Block', 'رکاوٹ رپورٹ کریں')}
        </h3>
        <p className="text-slate-500 font-medium mb-6">
          {order?.orderType ? td(order.orderType) : ''} — {t(
            `What's the issue with ${order?.workStage || ''}?`,
            `${STAGE_URDU_LABELS[order?.workStage] || order?.workStage || ''} میں کیا مسئلہ آ رہا ہے؟`
          )}
        </p>

        <textarea
          dir="ltr"
          className="input-field w-full min-h-[90px] resize-none mb-6"
          placeholder={t('Describe the issue (optional)...', 'وجہ لکھیں (اختیاری)...')}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          autoFocus
        />

        <p className="text-sm font-black text-slate-600 uppercase tracking-widest mb-3">
          {t('Do you want Admin to send guidelines?', 'کیا آپ چاہتے ہیں ایڈمن آپ کو گائیڈ لائنز بھیجے؟')}
        </p>
        <div className="flex gap-4 mb-8">
          <button
            type="button"
            onClick={() => setWantsGuidance(true)}
            className={`flex-1 py-3 rounded-xl font-black transition-all border-2 ${
              wantsGuidance === true
                ? 'bg-primary text-white border-primary shadow-lg shadow-primary/20'
                : 'bg-white text-slate-500 border-slate-200 hover:border-primary/40'
            }`}
          >
            {t('Yes', 'ہاں')}
          </button>
          <button
            type="button"
            onClick={() => setWantsGuidance(false)}
            className={`flex-1 py-3 rounded-xl font-black transition-all border-2 ${
              wantsGuidance === false
                ? 'bg-slate-600 text-white border-slate-600 shadow-lg shadow-slate-200'
                : 'bg-white text-slate-500 border-slate-200 hover:border-slate-400'
            }`}
          >
            {t('No', 'نہیں')}
          </button>
        </div>
        {wantsGuidance === true && (
          <p className="text-xs text-slate-400 -mt-4 mb-6">
            {t(
              "You won't be able to resume or complete the work until Admin's guidelines arrive.",
              'ایڈمن کی گائیڈ لائنز آنے تک آپ کام دوبارہ شروع یا مکمل نہیں کر سکیں گے۔'
            )}
          </p>
        )}

        {error && (
          <div className="flex items-center gap-3 bg-red-50 border border-red-100 text-red-600 px-4 py-3 rounded-xl text-sm font-bold mb-6">
            <ShieldAlert size={16} className="flex-shrink-0" />
            {error}
          </div>
        )}

        <div className="flex gap-4">
          <button
            onClick={handleSubmit}
            disabled={submitting || wantsGuidance === null}
            className="flex-1 py-4 rounded-xl bg-red-500 hover:bg-red-600 text-white font-black shadow-xl shadow-red-100 transition-all disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {submitting ? <Loader2 className="animate-spin" size={18} /> : t('Send Report', 'رپورٹ بھیجیں')}
          </button>
          <button
            onClick={onCancel}
            disabled={submitting}
            className="flex-1 py-4 rounded-xl bg-slate-100 text-slate-600 font-bold hover:bg-slate-200 transition-all disabled:opacity-60"
          >
            {t('Cancel', 'منسوخ')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default BlockReportModal;
