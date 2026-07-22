import React, { useState } from 'react';
import { MessageSquareWarning, Send, Loader2, OctagonAlert } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

// A few ready-made, professional starting points — the admin can tap one
// to drop it straight into the box and tweak it, instead of always typing
// guidance from scratch for the same handful of common situations.
const QUICK_TEMPLATES = [
  {
    label: 'Material mangwa lein',
    text: 'Fabric/material store se mangwa lein — jitni jaldi mile, kaam dobara shuru kar dein.',
  },
  {
    label: 'Measurement dobara check karein',
    text: 'Customer se ek dafa measurement dobara confirm kar lein taake aage kaam theek ho.',
  },
  {
    label: 'Doosre worker se madad lein',
    text: 'Agar khud se hal na ho to kisi senior worker se madad le lein — dair mat karein.',
  },
  {
    label: 'Mujhse baat karein',
    text: 'Iske baare mein pehle mujh se aake baat kar lein, phir kaam aage barhayein.',
  },
];

// Usage: <GuidanceModal order={order} onSend={fn} onCancel={fn} sending={bool} />
const GuidanceModal = ({ order, onSend, onCancel, sending = false }) => {
  const { t } = useLanguage();
  const [text, setText] = useState(order?.adminGuidance || '');

  const handleSend = () => {
    if (!text.trim()) return;
    onSend(text.trim());
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[200] flex items-center justify-center p-3 sm:p-6"
      onClick={onCancel}
    >
      <div
        className="bg-white rounded-[2rem] sm:rounded-[2.5rem] p-6 sm:p-10 max-w-lg w-full shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center text-red-500 mb-6">
          <MessageSquareWarning size={28} />
        </div>
        <h3 className="text-2xl font-black text-slate-800 tracking-tight mb-2">
          {t('Send Guidelines to Worker', 'رہنمائی بھیجیں')}
        </h3>
        <p className="text-slate-500 font-medium mb-4">
          {order?.assignedWorkerName || 'Worker'} ne <span className="font-bold">{order?.workStage}</span> par rukawat report ki hai — unhein aage kya karna hai, yahan likh dein.
        </p>

        {order?.workerWantsGuidance ? (
          <p className="text-xs text-amber-600 font-bold mb-4 bg-amber-50 border border-amber-200 px-3 py-2 rounded-xl">
            Worker ne guidelines mangi hain — jab tak aap nahi bhejenge, wo resume/complete nahi kar sakega.
          </p>
        ) : (
          <p className="text-xs text-slate-400 mb-4">
            Worker ne guidelines nahi mangi (khud resume kar sakta hai) — chahen to phir bhi madad bhej sakte hain.
          </p>
        )}

        {order?.workerBlockReason && (
          <div className="flex items-start gap-2 bg-red-50 border-2 border-red-200 text-red-600 text-sm font-bold px-4 py-3 rounded-2xl mb-5">
            <OctagonAlert size={16} className="mt-0.5 flex-shrink-0" />
            <span>{order.workerBlockReason}</span>
          </div>
        )}

        <div className="flex flex-wrap gap-2 mb-4">
          {QUICK_TEMPLATES.map((tpl) => (
            <button
              key={tpl.label}
              type="button"
              onClick={() => setText(tpl.text)}
              className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold transition-all"
            >
              {tpl.label}
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
            className="flex-1 py-4 rounded-2xl bg-primary hover:bg-primary-dark text-white font-black shadow-xl shadow-primary/30 transition-all disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {sending ? <Loader2 className="animate-spin" size={18} /> : <><Send size={18} /> {t('Send Guidelines', 'بھیج دیں')}</>}
          </button>
          <button
            onClick={onCancel}
            disabled={sending}
            className="flex-1 py-4 rounded-2xl bg-slate-100 text-slate-600 font-bold hover:bg-slate-200 transition-all disabled:opacity-60"
          >
            {t('Cancel', 'منسوخ')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default GuidanceModal;
