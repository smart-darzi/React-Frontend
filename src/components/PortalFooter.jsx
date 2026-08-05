import React from 'react';
import { Scissors, Phone } from 'lucide-react';

// Shared footer for the Customer and Worker portals — closes out the page
// with the shop's own mark rather than just trailing off after the last
// section. Kept static (no live settings are wired into these portals yet).
const PortalFooter = () => (
  <footer className="pt-2">
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-t border-primary/10 pt-6">
      <div className="flex items-center gap-2.5">
        <span className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
          <Scissors size={14} />
        </span>
        <div>
          <p className="font-display text-sm font-extrabold text-slate-700 leading-tight">Smart Master</p>
          <p className="text-slate-400 text-[11px] font-medium leading-tight">Tailoring, done right</p>
        </div>
      </div>
      <div className="flex items-center gap-4 text-slate-400 text-xs font-medium">
        <span className="flex items-center gap-1.5"><Phone size={12} /> Contact the shop for any questions</span>
        <span className="text-slate-300">·</span>
        <span>© {new Date().getFullYear()} Smart Master</span>
      </div>
    </div>
  </footer>
);

export default PortalFooter;
