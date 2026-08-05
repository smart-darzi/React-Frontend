import React from 'react';
import { Scissors } from 'lucide-react';

// Shared left panel for every public auth screen (Login, Worker Sign Up,
// Customer Sign Up) — flowing blob/wave shapes like the reference, built
// from the "Timeless Teal" swatch set (Moroccan Blue, New World, Teal
// Zeal, Tidewater, Gypsy Teal) instead of the reference's stock purple.
// One gradient + one shape language, reused with different copy per page
// so all three read as the same product.
const AuthBlobPanel = ({ eyebrow, title, subtitle, footer }) => {
  return (
    <div className="relative hidden lg:flex lg:flex-col lg:justify-between w-full lg:w-1/2 shrink-0 overflow-hidden bg-white">
      <svg
        className="absolute inset-0 w-full h-full"
        viewBox="0 0 700 900"
        preserveAspectRatio="xMidYMid slice"
      >
        <defs>
          <linearGradient id="tealBlend" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#4FA6B8" />   {/* New World   */}
            <stop offset="35%" stopColor="#1C6B82" />  {/* Moroccan Blue */}
            <stop offset="68%" stopColor="#0B5E63" />  {/* Gypsy Teal  */}
            <stop offset="100%" stopColor="#173F45" /> {/* Teal Zeal   */}
          </linearGradient>
          <linearGradient id="tealBlendSoft" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#6E97A6" />   {/* Tidewater   */}
            <stop offset="100%" stopColor="#1C6B82" /> {/* Moroccan Blue */}
          </linearGradient>
        </defs>

        {/* big flowing wave, corner to corner */}
        <path
          d="M0 0 H700 V420 C560 380 520 520 430 500 C300 470 300 620 190 640 C90 660 60 760 0 800 Z"
          fill="url(#tealBlend)"
        />
        {/* secondary wave, softer tone, bottom-left drop */}
        <path
          d="M0 620 C120 610 160 720 60 780 C20 805 0 830 0 860 Z"
          fill="url(#tealBlendSoft)"
          opacity="0.9"
        />
        {/* accent circles, echoing the reference's overlapping-circle motif */}
        <circle cx="150" cy="330" r="58" fill="url(#tealBlendSoft)" opacity="0.85" />
        <circle cx="120" cy="700" r="70" fill="#0B5E63" opacity="0.9" />
        <circle cx="560" cy="760" r="30" fill="#4FA6B8" opacity="0.5" />
      </svg>

      {/* Logo */}
      <div className="relative z-10 flex items-center gap-3 p-[clamp(1.5rem,4vh,3.75rem)]">
        <div className="w-11 h-11 bg-white rounded-full flex items-center justify-center shrink-0 shadow-md">
          <Scissors className="text-primary" size={20} />
        </div>
        <div className="leading-tight">
          <p className="text-white/70 text-xs font-medium tracking-[0.2em] uppercase">Smart</p>
          <p className="text-white font-black text-lg tracking-[0.2em] uppercase -mt-0.5">Master</p>
        </div>
      </div>

      {/* Headline block */}
      <div className="relative z-10 px-[clamp(1.5rem,4vh,3.75rem)] space-y-4 max-w-md">
        {eyebrow && (
          <span className="inline-flex items-center gap-2 bg-white/15 border border-white/15 px-4 py-1.5 rounded-full backdrop-blur-sm text-white/90 text-xs font-bold tracking-widest uppercase">
            {eyebrow}
          </span>
        )}
        <h1 className="text-[clamp(2rem,5.5vh,3.5rem)] font-black text-white leading-[1.05] tracking-tighter">
          {title}
        </h1>
        {subtitle && (
          <p className="text-white/70 text-[clamp(0.9rem,2.1vh,1.05rem)] font-medium leading-relaxed">
            {subtitle}
          </p>
        )}
      </div>

      <p className="relative z-10 px-[clamp(1.5rem,4vh,3.75rem)] pb-[clamp(1.5rem,4vh,3.75rem)] text-slate-400 text-xs font-black tracking-[0.2em] uppercase">
        {footer}
      </p>
    </div>
  );
};

export default AuthBlobPanel;
