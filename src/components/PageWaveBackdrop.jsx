import React from 'react';

// Page-wide backdrop — the same wavy blob background as the reference mock
// (a solid colour blob sweeping down the left, layered light rings on the
// right), recoloured into the app's teal family and stretched to sit behind
// the *whole* page's content (header + list + pagination), not just a
// single card. Runs flush to the topbar/sidebar/right edge — no rounding,
// no surrounding margin — since Layout renders this page full-bleed
// (see FULL_BLEED_PATHS in Layout.jsx) instead of inside the usual padded,
// centered column.
const PageWaveBackdrop = ({ children }) => (
  <div className="relative overflow-hidden">
    {/* ── background layer ── */}
    <div className="absolute inset-0 bg-white">
      <svg className="absolute inset-0 w-full h-full" viewBox="0 0 1200 1400" preserveAspectRatio="none">
        {/* solid teal blob sweeping down the left */}
        <path
          d="M0 0 H660 C 620 220, 700 420, 640 620 C 580 820, 500 900, 560 1080 C 610 1230, 520 1320, 460 1400 L0 1400 Z"
          fill="#0E606E"
        />
        {/* layered light wave rings, right side */}
        <path d="M420 0 C 650 60, 780 260, 720 500 C 670 700, 850 820, 800 1050 C 760 1230, 950 1300, 900 1400 L1200 1400 L1200 0 Z" fill="#CDEEF0" opacity="0.55" />
        <path d="M560 0 C 780 90, 880 300, 830 540 C 790 730, 950 850, 910 1080 C 880 1240, 1020 1310, 990 1400 L1200 1400 L1200 0 Z" fill="#B9E4E8" opacity="0.55" />
        <path d="M700 0 C 880 110, 960 330, 930 560 C 900 740, 1030 860, 1000 1080 C 980 1230, 1080 1300, 1060 1400 L1200 1400 L1200 0 Z" fill="#A6D9DE" opacity="0.5" />
        {/* small sparkle/dot accents echoing the reference's decoration */}
        <circle cx="960" cy="300" r="4" fill="#FFFFFF" opacity="0.7" />
        <circle cx="1080" cy="620" r="5" fill="#F5E9D3" opacity="0.6" />
        <circle cx="920" cy="900" r="4" fill="#FFFFFF" opacity="0.6" />
        <path d="M1090 780 l6 14 l14 6 l-14 6 l-6 14 l-6 -14 l-14 -6 l14 -6 Z" fill="#FFFFFF" opacity="0.55" />
      </svg>
    </div>

    {/* ── real page content ── */}
    <div className="relative z-10 p-4 sm:p-6 lg:p-10 space-y-10 min-w-0">
      {children}
    </div>
  </div>
);

export default PageWaveBackdrop;
