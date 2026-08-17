import React from 'react';
import { Scissors } from 'lucide-react';

// Big two-column hero header for the customer/worker directory pages: a
// solid teal panel on the left carrying the brand mark, heading and CTA,
// and a light panel on the right holding real functional content (search /
// quick actions) passed in via `rightContent`. Both panels are fully
// self-contained (own backgrounds) so this component doesn't depend on
// anything drawn behind it by the page — and stacks to a single column
// on small screens via the grid below.
const DirectoryHero = ({ eyebrow, heading, description, cta, rightContent }) => (
  <div className="relative overflow-hidden rounded-2xl sm:rounded-[32px] grid lg:grid-cols-2 min-h-0">
    {/* ── LEFT: solid brand panel ── */}
    <div
      className="relative px-5 py-8 sm:px-10 sm:py-10 flex flex-col justify-center"
      style={{ background: 'linear-gradient(150deg, #10707F 0%, #0E606E 55%, #0A4A55 100%)' }}
    >
      <div className="relative z-10 flex items-center gap-2.5 mb-6">
        <div className="w-9 h-9 bg-white/20 rounded-lg flex items-center justify-center backdrop-blur-sm border border-white/20 flex-shrink-0">
          <Scissors className="text-white" size={16} />
        </div>
        <span className="text-white font-black text-xs tracking-[0.2em] uppercase">Smart Master</span>
      </div>

      {eyebrow && (
        <span className="relative z-10 inline-flex w-fit items-center gap-2 bg-white/10 border border-white/15 px-3 py-1.5 rounded-full text-white/80 text-[10px] font-black uppercase tracking-widest mb-3 backdrop-blur-sm">
          {eyebrow}
        </span>
      )}

      <h1 className="relative z-10 text-white font-black text-3xl sm:text-4xl lg:text-5xl leading-[0.95] tracking-tighter uppercase max-w-md break-words">
        {heading}
      </h1>

      {description && (
        <p className="relative z-10 mt-4 text-white/75 text-sm sm:text-base font-medium leading-relaxed max-w-sm">
          {description}
        </p>
      )}

      {cta && <div className="relative z-10 mt-7">{cta}</div>}
    </div>

    {/* ── RIGHT: light panel holding real content ── */}
    <div className="relative bg-slate-100 px-5 py-8 sm:px-10 sm:py-10 flex items-center justify-center">
      <div className="relative z-10 w-full max-w-sm">
        {rightContent}
      </div>
    </div>
  </div>
);

export default DirectoryHero;
