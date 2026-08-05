import React from 'react';
import { Scissors } from 'lucide-react';

// Big two-column hero header, styled after the reference "Contact List"
// landing mock: a wavy blob-shaped colour panel on the left carrying the
// brand mark, a bold oversized heading, a description line and a pill CTA
// button — and a lighter, wave-textured panel on the right where the
// phone mockup used to sit. No phone here (as asked) — that space instead
// holds real, functional content (search / quick actions) passed in via
// `rightContent`, floating over the same layered-wave background so the
// right side still reads as "designed", not empty.
const DirectoryHero = ({ eyebrow, heading, description, cta, rightContent }) => (
  <div className="relative overflow-hidden rounded-[32px] grid lg:grid-cols-2 min-h-[300px] sm:min-h-[340px] bg-transparent">
    {/* ── LEFT: wavy blob panel ── */}
    <div
      className="relative overflow-hidden px-6 py-8 sm:px-10 sm:py-10 flex flex-col justify-center bg-transparent"
    >
      {/* the big soft blob shape sweeping down the panel, same silhouette
          as the reference's purple blob */}


      <div className="relative z-10 flex items-center gap-2.5 mb-6">
        <div className="w-9 h-9 bg-white/20 rounded-lg flex items-center justify-center backdrop-blur-sm border border-white/20">
          <Scissors className="text-white" size={16} />
        </div>
        <span className="text-white font-black text-xs tracking-[0.2em] uppercase">Smart Master</span>
      </div>

      {eyebrow && (
        <span className="relative z-10 inline-flex w-fit items-center gap-2 bg-white/10 border border-white/15 px-3 py-1.5 rounded-full text-white/80 text-[10px] font-black uppercase tracking-widest mb-3 backdrop-blur-sm">
          {eyebrow}
        </span>
      )}

      <h1 className="relative z-10 text-white font-black text-4xl sm:text-5xl lg:text-6xl leading-[0.95] tracking-tighter uppercase max-w-md">
        {heading}
      </h1>

      {description && (
        <p className="relative z-10 mt-4 text-white/75 text-sm sm:text-base font-medium leading-relaxed max-w-sm">
          {description}
        </p>
      )}

      {cta && <div className="relative z-10 mt-7">{cta}</div>}
    </div>

    {/* ── RIGHT: layered wave panel — the phone's old spot, now holding
        real content instead ── */}
    <div className="relative overflow-hidden bg-transparent px-6 py-8 sm:px-10 sm:py-10 flex items-center justify-center">
      <div className="relative z-10 w-full max-w-sm">
        {rightContent}
      </div>
    </div>
  </div>
);

export default DirectoryHero;
