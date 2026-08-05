import React from 'react';
import { Scissors } from 'lucide-react';

const DirectoryHero = ({ eyebrow, heading, description, cta, rightContent }) => (
  <div
    className="relative overflow-hidden rounded-2xl sm:rounded-3xl p-5 sm:p-8 lg:p-10 shadow-xl grid grid-cols-1 lg:grid-cols-2 gap-6 items-center w-full min-w-0"
    style={{ background: 'linear-gradient(165deg, #10707F 0%, #0E606E 50%, #0A4A55 100%)' }}
  >
    {/* ── LEFT: brand & title panel ── */}
    <div className="relative z-10 flex flex-col justify-center min-w-0">
      <div className="flex items-center gap-2.5 mb-3 sm:mb-5">
        <div className="w-8 h-8 sm:w-9 sm:h-9 bg-white/20 rounded-lg flex items-center justify-center backdrop-blur-sm border border-white/20 flex-shrink-0">
          <Scissors className="text-white" size={16} />
        </div>
        <span className="text-white font-black text-xs tracking-[0.2em] uppercase truncate">Smart Master</span>
      </div>

      {eyebrow && (
        <span className="inline-flex w-fit items-center gap-2 bg-white/10 border border-white/15 px-3 py-1 rounded-full text-white/90 text-[10px] font-black uppercase tracking-widest mb-3 backdrop-blur-sm">
          {eyebrow}
        </span>
      )}

      <h1 className="text-white font-black text-2xl sm:text-4xl lg:text-5xl leading-tight tracking-tight uppercase max-w-md break-words">
        {heading}
      </h1>

      {description && (
        <p className="mt-2 sm:mt-3 text-white/85 text-xs sm:text-base font-medium leading-relaxed max-w-sm">
          {description}
        </p>
      )}

      {cta && <div className="mt-4 sm:mt-6">{cta}</div>}
    </div>

    {/* ── RIGHT: search / quick actions panel ── */}
    {rightContent && (
      <div className="relative z-10 flex items-center justify-center w-full min-w-0">
        <div className="w-full max-w-md min-w-0">
          {rightContent}
        </div>
      </div>
    )}
  </div>
);

export default DirectoryHero;
