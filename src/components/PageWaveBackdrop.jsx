import React from 'react';

const PageWaveBackdrop = ({ children }) => (
  <div className="relative overflow-hidden min-h-screen fabric-bg">
    {/* ── real page content ── */}
    <div className="relative z-10 p-3.5 sm:p-6 lg:p-10 space-y-5 sm:space-y-8 min-w-0 max-w-6xl mx-auto">
      {children}
    </div>
  </div>
);

export default PageWaveBackdrop;
