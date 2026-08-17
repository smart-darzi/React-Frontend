import React from 'react';

// Wrapper for the customer/worker directory pages. The parent Layout
// already supplies the padded, centered, cream-background column (same
// as every other admin page) — this just adds the vertical spacing
// between the header/search box and the list below it.
const PageWaveBackdrop = ({ children }) => (
  <div className="space-y-6 sm:space-y-8 lg:space-y-10">
    {children}
  </div>
);

export default PageWaveBackdrop;
