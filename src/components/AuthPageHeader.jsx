import React from 'react';
import { Scissors } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

const AuthPageHeader = ({ title, subtitle, showLanguageToggle = true }) => {
  const { language, setLanguage } = useLanguage();

  return (
    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 sm:gap-6">
      <div className="space-y-2 min-w-0">
        <div className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.24em] text-slate-400">
          <Scissors size={12} className="text-primary" /> Smart Master
        </div>
        <h2 className="text-[clamp(1.5rem,4.5vh,2.25rem)] font-black text-slate-800 tracking-tighter">{title}</h2>
        <p className="text-slate-500 font-medium text-[clamp(0.875rem,2.2vh,1.125rem)]">{subtitle}</p>
      </div>

      {showLanguageToggle && (
        <div className="flex items-center bg-slate-100 rounded-xl p-1 gap-0.5 self-start shrink-0">
          <button
            type="button"
            onClick={() => setLanguage('en')}
            className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all ${language === 'en' ? 'bg-white text-primary shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
          >
            English
          </button>
          <button
            type="button"
            onClick={() => setLanguage('ur')}
            className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all ${language === 'ur' ? 'bg-white text-primary shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
          >
            اردو
          </button>
        </div>
      )}
    </div>
  );
};

export default AuthPageHeader;