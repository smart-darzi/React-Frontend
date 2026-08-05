import React from 'react';
import { Scissors, Phone } from 'lucide-react';

// Shared footer for the Customer and Worker portals — closes out the page
// with the shop's own mark rather than just trailing off after the last
// section. Kept static (no live settings are wired into these portals yet).
const PortalFooter = () => (
  <footer className="w-full pb-3 sm:pb-5">
    <div className="flex flex-row items-center justify-between gap-2 border-t border-primary/10 pt-3.5 w-full min-w-0">
      <div className="flex items-center gap-2 min-w-0 flex-shrink-0">
        <span className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
          <Scissors size={13} />
        </span>
        <div className="min-w-0">
          <p className="font-display text-xs sm:text-sm font-extrabold text-slate-700 leading-tight truncate">Smart Master</p>
          <p className="hidden md:block text-slate-400 text-[10px] font-medium leading-tight truncate">Tailoring, done right</p>
        </div>
      </div>
      <div className="flex items-center gap-1.5 sm:gap-3 text-slate-400 text-[11px] sm:text-xs font-medium flex-shrink-0 whitespace-nowrap">
        <span className="hidden sm:flex items-center gap-1.5"><Phone size={12} /> Contact shop</span>
        <span className="hidden sm:inline text-slate-300">·</span>
        <span>© {new Date().getFullYear()} Smart Master</span>
      </div>
    </div>
  </footer>
);

export default PortalFooter;
