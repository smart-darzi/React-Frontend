import React from 'react';
import { Scissors } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import PortalFooter from './PortalFooter';

// Centered single-card auth layout — cream backdrop, soft teal-shade blob
// accents (same teal family as the Login page), brand row + headline
// above the card, and an English/Urdu toggle so this page's own bilingual
// strings can be switched without needing the full app Topbar. Used by
// the worker/customer sign-up pages.
const AuthCardShell = ({ badge, heading, subtitle, children, footer, showLanguageToggle = true }) => {
  const { language, setLanguage } = useLanguage();

  return (
    <div className="min-h-[100dvh] w-full flex flex-col overflow-y-auto relative" style={{ background: '#FBF6EA' }}>
      {/* ── HEADER ── */}
      <div
        className="shrink-0 px-4 sm:px-6 py-3 sm:py-4"
        style={{ background: '#0E606E' }}
      >
        <div className="w-full flex items-center justify-between gap-1.5 sm:gap-3 flex-nowrap">
          <div className="flex items-center gap-1.5 sm:gap-2 min-w-0 flex-1">
            <div className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 bg-white/15 rounded-lg flex items-center justify-center backdrop-blur-sm border border-white/10 flex-shrink-0">
              <Scissors className="text-white" size={12} />
            </div>
            <span className="text-white font-black text-[10px] sm:text-xs md:text-sm tracking-widest uppercase truncate">Smart Master</span>
          </div>
          <div className="flex items-center gap-1.5 sm:gap-3 flex-shrink-0">
            {showLanguageToggle && (
              <div className="flex items-center bg-white/10 border border-white/15 rounded-lg p-0.5 gap-0.5 backdrop-blur-sm">
                <button
                  type="button"
                  onClick={() => setLanguage('en')}
                  className="px-1.5 sm:px-2 md:px-2.5 py-0.5 sm:py-1 rounded-md text-[9px] sm:text-[10px] md:text-xs font-black transition-all"
                  style={language === 'en' ? { background: '#fff', color: '#0E606E' } : { color: 'rgba(255,255,255,0.7)' }}
                >
                  English
                </button>
                <button
                  type="button"
                  onClick={() => setLanguage('ur')}
                  className="px-1.5 sm:px-2 md:px-2.5 py-0.5 sm:py-1 rounded-md text-[9px] sm:text-[10px] md:text-xs font-black transition-all"
                  style={language === 'ur' ? { background: '#fff', color: '#0E606E' } : { color: 'rgba(255,255,255,0.7)' }}
                >
                  اردو
                </button>
              </div>
            )}
            <span className="inline-block text-white/70 text-[9px] sm:text-[11px] md:text-xs font-bold tracking-wide whitespace-nowrap truncate max-w-[90px] sm:max-w-none">
              {new Date().toLocaleDateString(language === 'ur' ? 'ur-PK' : 'en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
            </span>
          </div>
        </div>
      </div>

      <div className="flex-1 w-full flex flex-col items-center px-3 sm:px-4 py-8 sm:py-14">
      {/* card — same width/rounding as the Login card, and the same
          two-part teal-header / white-form layout for visual consistency
          across every auth page. */}
      <div className="relative z-10 w-full max-w-[440px] sm:max-w-[480px] md:max-w-[560px] lg:max-w-[600px] rounded-[20px] sm:rounded-[28px] overflow-hidden shadow-md bg-white border-2" style={{ borderColor: '#1C6B82' }}>
        {/* headline — teal panel, matching the Login page's header */}
        <div
          className="relative px-5 pt-7 pb-9 sm:px-7 sm:pt-9 sm:pb-11 md:px-9 md:pt-10 md:pb-12 text-center"
          style={{ background: 'linear-gradient(135deg, #10707F 0%, #0E606E 55%, #0A4A55 100%)' }}
        >
          {badge && (
            <span
              className="inline-block mb-3 px-5 py-2 sm:px-6 sm:py-2.5 rounded-full text-sm sm:text-base font-black tracking-widest uppercase bg-white/15 text-white border border-white/20 backdrop-blur-sm"
            >
              {badge}
            </span>
          )}
          <h1 className="text-xl sm:text-2xl md:text-3xl font-black tracking-tight text-white">{heading}</h1>
          {subtitle && <p className="text-white/75 font-medium mt-2 text-sm sm:text-base max-w-md mx-auto">{subtitle}</p>}
        </div>

        {/* form panel */}
        <div className="relative px-5 pt-6 pb-7 sm:px-7 sm:pt-7 sm:pb-8 md:px-9 md:pt-8 md:pb-10 bg-white">
          {children}
        </div>
      </div>

      {footer && <div className="relative z-10 mt-6 text-center">{footer}</div>}
      </div>
      <PortalFooter />
    </div>
  );
};

export default AuthCardShell;
