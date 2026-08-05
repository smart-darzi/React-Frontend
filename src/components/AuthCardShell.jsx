import React from 'react';
import { Scissors } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

// Centered single-card auth layout — cream backdrop, soft teal-shade blob
// accents (same teal family as the Login page), brand row + headline
// above the card, and an English/Urdu toggle so this page's own bilingual
// strings can be switched without needing the full app Topbar. Used by
// the worker/customer sign-up pages.
const AuthCardShell = ({ heading, subtitle, children, footer, showLanguageToggle = true }) => {
  const { language, setLanguage } = useLanguage();

  return (
    <div
      className="min-h-[100dvh] w-full flex flex-col items-center overflow-y-auto relative px-4 py-10 sm:py-14"
      style={{ background: '#FBF6EC' }}
    >
      {/* decorative blobs — teal shades with a cream undertone */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div
          className="hidden sm:block absolute top-24 right-[8%] w-72 h-72 rounded-[45%_55%_60%_40%/50%_45%_55%_50%] opacity-90"
          style={{ background: 'linear-gradient(135deg, #4FA6B8 0%, #0B5E63 100%)', filter: 'blur(2px)' }}
        />
        <div
          className="hidden sm:block absolute bottom-16 left-[6%] w-24 h-24 rounded-[55%_45%_40%_60%/45%_55%_50%_50%]"
          style={{ background: 'linear-gradient(135deg, #4FA6B8 0%, #1C6B82 100%)' }}
        />
        <div className="absolute top-10 left-1/2 -translate-x-1/2 w-40 h-40 rounded-full bg-teal-100/50 blur-2xl" />
      </div>

      {/* top row: brand + language toggle */}
      <div className="relative z-10 w-full max-w-md flex items-center justify-between mb-8">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #4FA6B8, #0B5E63)' }}>
            <Scissors className="text-white" size={15} />
          </div>
          <span className="font-black text-lg tracking-tight text-slate-800">Smart Master</span>
        </div>

        {showLanguageToggle && (
          <div className="flex items-center bg-white rounded-xl p-1 gap-0.5 shadow-sm border border-slate-100">
            <button
              type="button"
              onClick={() => setLanguage('en')}
              className="px-3 py-1.5 rounded-lg text-xs font-black transition-all"
              style={language === 'en' ? { background: '#1C6B82', color: '#fff' } : { color: '#94a3b8' }}
            >
              English
            </button>
            <button
              type="button"
              onClick={() => setLanguage('ur')}
              className="px-3 py-1.5 rounded-lg text-xs font-black transition-all"
              style={language === 'ur' ? { background: '#1C6B82', color: '#fff' } : { color: '#94a3b8' }}
            >
              اردو
            </button>
          </div>
        )}
      </div>

      {/* headline */}
      <div className="relative z-10 text-center mb-8 px-4">
        <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-800">{heading}</h1>
        {subtitle && <p className="text-slate-500 font-medium mt-2 max-w-md mx-auto">{subtitle}</p>}
      </div>

      {/* card */}
      <div className="relative z-10 w-full max-w-md bg-white rounded-2xl shadow-xl border border-slate-100 p-6 sm:p-8">
        {children}
      </div>

      {footer && <div className="relative z-10 mt-6 text-center">{footer}</div>}
    </div>
  );
};

export default AuthCardShell;
