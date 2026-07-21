import React from 'react';
import { AlertTriangle, Loader2 } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

// Generic Yes / No confirmation popup.
// Usage: <ConfirmModal title="..." message="..." onConfirm={fn} onCancel={fn} confirming={bool} />
// title/message are expected to already be in the current language (built
// with `t()` at the call site) — `td` below is just a safety net in case a
// caller still passes an old-style combined "English / اردو" string.
const ConfirmModal = ({ title, message, confirmLabel, cancelLabel, onConfirm, onCancel, confirming = false, tone = 'primary' }) => {
  const { t, td } = useLanguage();
  const toneClasses = {
    primary: 'bg-primary hover:bg-primary-dark shadow-primary/30',
    danger: 'bg-red-500 hover:bg-red-600 shadow-red-200',
    success: 'bg-emerald-500 hover:bg-emerald-600 shadow-emerald-200',
    purple: 'bg-purple-500 hover:bg-purple-600 shadow-purple-200',
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
        <div className="w-16 h-16 bg-amber-100 rounded-2xl flex items-center justify-center text-amber-500 mb-6">
          <AlertTriangle size={28} />
        </div>
        <h3 className="text-2xl font-black text-slate-800 tracking-tight mb-2">{td(title)}</h3>
        {message && <p className="text-slate-500 font-medium mb-8">{td(message)}</p>}

        <div className="flex gap-4">
          <button
            onClick={onConfirm}
            disabled={confirming}
            className={`flex-1 py-4 rounded-2xl text-white font-black shadow-xl transition-all disabled:opacity-60 flex items-center justify-center gap-2 ${toneClasses[tone] || toneClasses.primary}`}
          >
            {confirming ? <Loader2 className="animate-spin" size={18} /> : (confirmLabel ? td(confirmLabel) : t('Yes', 'ہاں'))}
          </button>
          <button
            onClick={onCancel}
            disabled={confirming}
            className="flex-1 py-4 rounded-2xl bg-slate-100 text-slate-600 font-bold hover:bg-slate-200 transition-all disabled:opacity-60"
          >
            {cancelLabel ? td(cancelLabel) : t('No', 'نہیں')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;
