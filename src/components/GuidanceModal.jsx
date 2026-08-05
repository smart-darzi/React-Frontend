import React, { useState } from 'react';
import { MessageSquareWarning, Send, Loader2, OctagonAlert } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { STAGE_URDU_LABELS } from '../utils/stages';

// A few ready-made, professional starting points — the admin can tap one
// to drop it straight into the box and tweak it, instead of always typing
// guidance from scratch for the same handful of common situations.
const QUICK_TEMPLATES = [
  {
    labelEn: 'Order material',
    labelUr: 'میٹریل منگوائیں',
    textEn: 'Please order the fabric/material from the store — resume work as soon as it arrives.',
    textUr: 'فیبرک/میٹریل اسٹور سے منگوا لیں — جیسے ہی ملے، کام دوبارہ شروع کر دیں۔',
  },
  {
    labelEn: 'Re-check measurement',
    labelUr: 'ماپ دوبارہ چیک کریں',
    textEn: 'Please reconfirm the measurement with the customer once, so the work ahead is correct.',
    textUr: 'کسٹمر سے ایک دفعہ ماپ دوبارہ کنفرم کر لیں تاکہ آگے کام ٹھیک ہو۔',
  },
  {
    labelEn: 'Get help from another worker',
    labelUr: 'دوسرے ورکر سے مدد لیں',
    textEn: "If you can't resolve it yourself, please get help from a senior worker — don't delay.",
    textUr: 'اگر خود سے حل نہ ہو تو کسی سینئر ورکر سے مدد لے لیں — دیر نہ کریں۔',
  },
  {
    labelEn: 'Talk to me first',
    labelUr: 'مجھ سے بات کریں',
    textEn: 'Please come and talk to me about this first, then move the work forward.',
    textUr: 'اس کے بارے میں پہلے مجھ سے آ کر بات کر لیں، پھر کام آگے بڑھائیں۔',
  },
];

// Usage: <GuidanceModal order={order} onSend={fn} onCancel={fn} sending={bool} />
const GuidanceModal = ({ order, onSend, onCancel, sending = false }) => {
  const { t, tn, language } = useLanguage();
  const [text, setText] = useState(
    (language === 'ur' ? (order?.adminGuidanceUrdu || order?.adminGuidance) : order?.adminGuidance) || ''
  );

  const handleSend = () => {
    if (!text.trim()) return;
    onSend(text.trim());
  };

  const workerName = tn(order?.assignedWorkerName || t('Worker', 'ورکر'));
  const stageName = t(order?.workStage, STAGE_URDU_LABELS[order?.workStage] || order?.workStage);

  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[200] flex items-center justify-center p-3 sm:p-6"
      onClick={onCancel}
    >
      <div
        className="bg-white rounded-xl p-6 sm:p-10 max-w-lg w-full shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-16 h-16 bg-red-100 rounded-xl flex items-center justify-center text-red-500 mb-6">
          <MessageSquareWarning size={28} />
        </div>
        <h3 className="text-2xl font-black text-slate-800 tracking-tight mb-2">
          {t('Send Guidelines to Worker', 'رہنمائی بھیجیں')}
        </h3>
        <p className="text-slate-500 font-medium mb-4">
          {t(
            `${workerName} reported a block on `,
            `${workerName} نے `
          )}
          <span className="font-bold">{stageName}</span>
          {t(
            ' — write down what they should do next.',
            ' پر رکاوٹ رپورٹ کی ہے — انہیں آگے کیا کرنا ہے، یہاں لکھ دیں۔'
          )}
        </p>

        {order?.workerWantsGuidance ? (
          <p className="text-xs text-amber-600 font-bold mb-4 bg-amber-50 border border-amber-200 px-3 py-2 rounded-xl">
            {t(
              "The worker has requested guidance — until you send it, they won't be able to resume/complete the work.",
              'ورکر نے رہنمائی مانگی ہے — جب تک آپ نہیں بھیجیں گے، وہ کام دوبارہ شروع/مکمل نہیں کر سکے گا۔'
            )}
          </p>
        ) : (
          <p className="text-xs text-slate-400 mb-4">
            {t(
              "The worker hasn't requested guidance (they can resume on their own) — you can still send help if you'd like.",
              'ورکر نے رہنمائی نہیں مانگی (خود دوبارہ شروع کر سکتا ہے) — چاہیں تو پھر بھی مدد بھیج سکتے ہیں۔'
            )}
          </p>
        )}

        {order?.workerBlockReason && (
          <div className="flex items-start gap-2 bg-red-50 border-2 border-red-200 text-red-600 text-sm font-bold px-4 py-3 rounded-xl mb-5">
            <OctagonAlert size={16} className="mt-0.5 flex-shrink-0" />
            <span>{order.workerBlockReason}</span>
          </div>
        )}

        <div className="flex flex-wrap gap-2 mb-4">
          {QUICK_TEMPLATES.map((tpl) => (
            <button
              key={tpl.labelEn}
              type="button"
              onClick={() => setText(t(tpl.textEn, tpl.textUr))}
              className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold transition-all"
            >
              {t(tpl.labelEn, tpl.labelUr)}
            </button>
          ))}
        </div>

        <textarea
          dir="ltr"
          className="input-field w-full min-h-[110px] resize-none"
          placeholder={t('Write guidance here...', 'یہاں رہنمائی لکھیں...')}
          value={text}
          onChange={(e) => setText(e.target.value)}
          autoFocus
        />

        <div className="flex gap-4 mt-8">
          <button
            onClick={handleSend}
            disabled={sending || !text.trim()}
            className="flex-1 py-2.5 text-sm rounded-xl bg-primary hover:bg-primary-dark text-white font-black shadow-xl shadow-primary/30 transition-all disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {sending ? <Loader2 className="animate-spin" size={16} /> : <><Send size={16} /> {t('Send Guidelines', 'بھیج دیں')}</>}
          </button>
          <button
            onClick={onCancel}
            disabled={sending}
            className="flex-1 py-2.5 text-sm rounded-xl bg-slate-100 text-slate-600 font-bold hover:bg-slate-200 transition-all disabled:opacity-60"
          >
            {t('Cancel', 'منسوخ')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default GuidanceModal;
