import React, { useState } from 'react';
import { Palette } from 'lucide-react';

// Design/order thumbnail with a graceful fallback — some catalog images can
// end up with a dead/expired URL (deleted from Cloudinary, bad paste, etc.),
// which used to render the browser's ugly broken-image icon everywhere a
// design photo is shown. This swaps in a clean placeholder instead the
// moment the image is missing or fails to load — used on every page that
// renders a design/order thumbnail (Customer/Worker portals, Admin Designs,
// Add Order, Order Detail, View Orders, Design/Order detail modals).
const DesignThumb = ({ src, alt, className, iconSize = 18 }) => {
  const [broken, setBroken] = useState(false);
  if (!src || broken) {
    return (
      <div className={`${className} flex items-center justify-center bg-slate-50 text-slate-300`}>
        <Palette size={iconSize} />
      </div>
    );
  }
  return (
    <img
      src={src}
      alt={alt}
      className={className}
      onError={() => setBroken(true)}
    />
  );
};

export default DesignThumb;
