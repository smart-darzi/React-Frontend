import React from 'react';
import { Delete, X, ArrowRight } from 'lucide-react';
import { useToast } from '../context/ToastContext';

// ✅ Naya on-screen Urdu keyboard — jahan bhi user Urdu type nahi kar sakta
// (jaise Design ka Urdu naam), yahan se click kar ke seedha likh sakta hai.
// Har button ek Urdu letter insert karta hai text ke andar jahan cursor hai.
const ROWS = [
  ['ط', 'ظ', 'ع', 'غ', 'ف', 'ق', 'ک', 'گ', 'ل', 'م'],
  ['ا', 'ب', 'پ', 'ت', 'ٹ', 'ث', 'ج', 'چ', 'ح', 'خ'],
  ['د', 'ڈ', 'ذ', 'ر', 'ڑ', 'ز', 'ژ', 'س', 'ش', 'ص'],
  ['ض', 'ن', 'ں', 'و', 'ہ', 'ھ', 'ء', 'ی', 'ے', 'ئ'],
];

// `value` is the current text of whichever field this keyboard is attached
// to (Urdu Name, Description, ...) — passed in so Done can tell whether
// anything was actually typed before closing.
const UrduKeyboard = ({ value = '', onKey, onBackspace, onSpace, onClose, onDone }) => {
  const toast = useToast();

  const handleDone = () => {
    if (!value || !value.trim()) {
      toast?.showToast('Please type something before pressing Done', 'error');
      return;
    }
    onDone();
  };

  return (
    <div
      dir="rtl"
      className="mt-2 p-3 sm:p-4 bg-white rounded-xl shadow-2xl border-2 border-primary/15 space-y-2 select-none"
      onMouseDown={(e) => e.preventDefault()} // keep focus on the text input
    >
      <div className="flex items-center justify-between mb-1" dir="ltr">
        <span className="text-[10px] font-black uppercase tracking-widest text-primary/70">Urdu Keyboard / اردو کی بورڈ</span>
        <button
          type="button"
          onClick={onClose}
          className="text-slate-400 hover:text-primary transition-colors p-1"
        >
          <X size={14} />
        </button>
      </div>

      {ROWS.map((row, i) => (
        <div key={i} className="flex gap-1.5 justify-center flex-wrap">
          {row.map((ch) => (
            <button
              key={ch}
              type="button"
              onClick={() => onKey(ch)}
              className="w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center rounded-xl bg-white border-2 border-primary/25 text-primary text-lg font-bold hover:bg-primary hover:text-white hover:border-primary active:scale-95 transition-all"
            >
              {ch}
            </button>
          ))}
        </div>
      ))}

      <div className="flex gap-1.5 justify-center pt-1">
        <button
          type="button"
          onClick={onBackspace}
          className="flex-1 max-w-[110px] h-9 sm:h-10 flex items-center justify-center gap-1.5 rounded-xl bg-white border-2 border-red-200 text-red-500 text-xs font-black uppercase hover:bg-red-500 hover:text-white hover:border-red-500 active:scale-95 transition-all"
        >
          <Delete size={14} /> Delete
        </button>
        <button
          type="button"
          onClick={onSpace}
          className="flex-[2] h-9 sm:h-10 flex items-center justify-center rounded-xl bg-white border-2 border-primary/25 text-primary text-xs font-black uppercase hover:bg-primary hover:text-white hover:border-primary active:scale-95 transition-all"
        >
          Space
        </button>
        <button
          type="button"
          onClick={handleDone}
          className="flex-1 max-w-[110px] h-9 sm:h-10 flex items-center justify-center gap-1.5 rounded-xl bg-primary text-white text-xs font-black uppercase hover:opacity-90 active:scale-95 transition-all"
        >
          Done <ArrowRight size={14} />
        </button>
      </div>
    </div>
  );
};

export default UrduKeyboard;
