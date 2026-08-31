import React from 'react';
import { UserPlus } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import AuthSplitCard from './AuthSplitCard';

// Shared shell for the worker/customer sign-up pages — reuses the same
// single centered AuthSplitCard box as Login, Forgot Password and Reset
// Password, with the badge/heading/subtitle mirrored inside the form
// side too (so the right panel reads on its own) and the language
// toggle inside the box.
const AuthCardShell = ({ badge, heading, subtitle, children, showLanguageToggle = true, boxHeight = '', scrollable = false }) => {
  const { language, setLanguage } = useLanguage();

  return (
    <AuthSplitCard badgeIcon={UserPlus} badge={badge} panelTitle={heading} panelSubtitle={subtitle} boxHeight={boxHeight} scrollable={scrollable}>
      <div className="space-y-6">
        {showLanguageToggle && (
          <div className="flex justify-end">
            <div className="flex items-center bg-slate-100 rounded-xl p-1 gap-0.5 shrink-0">
              <button
                type="button"
                onClick={() => setLanguage('en')}
                className={`px-2.5 sm:px-3 py-1.5 rounded-xl text-[10px] sm:text-xs font-black transition-all ${language === 'en' ? 'bg-white text-primary shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
              >
                English
              </button>
              <button
                type="button"
                onClick={() => setLanguage('ur')}
                className={`px-2.5 sm:px-3 py-1.5 rounded-xl text-[10px] sm:text-xs font-black transition-all ${language === 'ur' ? 'bg-white text-primary shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
              >
                اردو
              </button>
            </div>
          </div>
        )}

        <div className="space-y-1.5">
          {badge && (
            <span
              className="inline-block px-3 py-1 rounded-full text-[11px] font-black tracking-widest uppercase"
              style={{ background: 'rgba(28,107,130,0.1)', color: '#1C6B82' }}
            >
              {badge}
            </span>
          )}
          <h2 className="text-2xl sm:text-3xl font-black text-slate-800 tracking-tighter">{heading}</h2>
          {subtitle && <p className="text-slate-500 font-medium text-sm sm:text-base">{subtitle}</p>}
        </div>

        {children}
      </div>
    </AuthSplitCard>
  );
};

export default AuthCardShell;
