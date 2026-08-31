import React from 'react';
import { Scissors } from 'lucide-react';

// Shared left panel for every public auth screen (Login, Forgot Password,
// Worker Sign Up, Customer Sign Up) — same teal gradient + night-sky
// illustration as the Reset Password page, so all auth screens read as
// one consistent, split-screen design. On phones this collapses into a
// slim top strip (just the logo); the illustration, badge and headline
// only appear from the lg breakpoint up, exactly like Reset Password.
const AuthSidePanel = ({ badgeIcon: BadgeIcon, badge, title, subtitle, footer }) => {
  return (
    <div
      className="flex flex-row lg:flex-col items-center lg:items-stretch justify-start lg:justify-between w-full lg:w-[44%] xl:w-[40%] gap-4 lg:gap-0 p-5 sm:p-6 lg:p-8 xl:p-10 relative overflow-hidden shrink-0"
      style={{ background: 'linear-gradient(145deg, #0E606E 0%, #0A4A55 50%, #083840 100%)' }}
    >
      <div className="hidden lg:block absolute -top-24 -left-24 w-96 h-96 rounded-full opacity-10"
           style={{ background: 'radial-gradient(circle, white, transparent)' }} />
      <div className="hidden lg:block absolute bottom-0 right-0 w-72 h-72 rounded-full opacity-10 translate-x-1/3 translate-y-1/3"
           style={{ background: 'radial-gradient(circle, white, transparent)' }} />

      {/* night-sky illustration: shooting stars up top, scattered dots
          for stars, soft hill/cloud silhouette along the bottom edge */}
      <svg
        className="hidden lg:block pointer-events-none absolute inset-0 w-full h-full"
        viewBox="0 0 500 900" preserveAspectRatio="none"
      >
        <g stroke="#EAF6F4" strokeWidth="2.5" strokeLinecap="round" opacity="0.55">
          <line x1="80" y1="70" x2="140" y2="20" />
          <line x1="150" y1="120" x2="195" y2="80" />
          <line x1="330" y1="55" x2="380" y2="10" />
        </g>
        <g fill="#EAF6F4">
          <circle cx="145" cy="18" r="3" opacity="0.9" />
          <circle cx="382" cy="8" r="3" opacity="0.9" />
        </g>
        <g fill="#FFFFFF" opacity="0.5">
          <circle cx="60" cy="180" r="2" />
          <circle cx="230" cy="140" r="2.5" />
          <circle cx="410" cy="200" r="2" />
          <circle cx="300" cy="260" r="1.8" />
          <circle cx="120" cy="300" r="2" />
          <circle cx="430" cy="330" r="2.2" />
          <circle cx="40" cy="380" r="1.8" />
        </g>
        <path
          d="M0 620 C 60 560, 140 560, 190 610 C 230 560, 300 560, 340 610 C 380 570, 450 575, 500 615 L500 900 L0 900 Z"
          fill="#0A4A55" opacity="0.55"
        />
        <path
          d="M0 700 C 80 650, 160 660, 210 700 C 260 655, 340 660, 390 705 C 430 675, 470 680, 500 705 L500 900 L0 900 Z"
          fill="#083840" opacity="0.7"
        />
      </svg>

      {/* Logo — always visible, even on the mobile strip */}
      <div className="flex items-center gap-2.5 sm:gap-3 relative z-10 min-w-0">
        <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm border border-white/10 flex-shrink-0">
          <Scissors className="text-white" size={20} />
        </div>
        <div className="min-w-0">
          <p className="text-white font-black text-base sm:text-lg tracking-widest uppercase truncate">Smart Master</p>
          <p className="text-white/50 text-[10px] sm:text-xs font-medium tracking-widest truncate">TAILORING MANAGEMENT</p>
        </div>
      </div>

      {/* Badge + headline — desktop/tablet only */}
      <div className="hidden lg:block relative z-10 space-y-3">
        {badge && (
          <div className="inline-flex items-center gap-2 bg-white/10 border border-white/10 px-4 py-2 rounded-full backdrop-blur-sm">
            {BadgeIcon && <BadgeIcon size={14} className="text-white/80" />}
            <span className="text-white/80 text-xs font-bold tracking-widest uppercase">{badge}</span>
          </div>
        )}
        <h1 className="text-[clamp(1.5rem,3.2vw,2.75rem)] font-black text-white leading-[1.1] tracking-tighter">
          {title}
        </h1>
        {subtitle && (
          <p className="text-white/60 text-[clamp(0.75rem,1vw,0.9rem)] font-medium leading-relaxed max-w-xs">
            {subtitle}
          </p>
        )}
      </div>

      <p className="hidden lg:block text-white/30 text-sm font-medium relative z-10">
        {footer || `© ${new Date().getFullYear()} Smart Master`}
      </p>
    </div>
  );
};

export default AuthSidePanel;
