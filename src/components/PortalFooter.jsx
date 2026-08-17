import React from 'react';
import { Scissors, Phone, Mail } from 'lucide-react';

// Shared footer for the Customer and Worker portals (and every other page
// that uses it) — same footer everywhere in the site, per design. Laid
// out as a proper multi-row footer (brand block + contact block, then a
// copyright bar underneath) instead of squeezing everything onto one
// line, so nothing ever overlaps or gets unreadably small. Stacks to a
// single column on phones, sits side-by-side from sm/tablet up.
//
// NOTE: phone number and email below are placeholders — swap them for
// the shop's real WhatsApp/phone number and official email address.
const SHOP_PHONE = '+92 300 1234567';
const SHOP_EMAIL = 'info@smartmaster.pk';

const PortalFooter = () => (
  <footer className="shrink-0 w-full px-4 sm:px-6 pt-6 sm:pt-10 pb-5 sm:pb-8">
    <div className="border-t border-primary/10 pt-5 sm:pt-8">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-5 sm:gap-8">
        {/* Brand */}
        <div className="flex items-center gap-2.5">
          <span className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg sm:rounded-xl bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
            <Scissors size={14} className="sm:w-[15px] sm:h-[15px]" />
          </span>
          <div>
            <p className="font-display text-sm font-extrabold text-slate-800 leading-tight">Smart Master</p>
            <p className="text-slate-500 text-xs font-medium leading-tight mt-0.5">Tailoring, done right</p>
          </div>
        </div>

        {/* Contact */}
        <div className="sm:text-right">
          <p className="text-slate-700 text-[11px] font-bold uppercase tracking-wide mb-2">Contact Us</p>
          <div className="flex flex-col gap-1.5">
            <a
              href={`tel:${SHOP_PHONE.replace(/\s+/g, '')}`}
              className="flex items-center gap-2 sm:justify-end text-slate-600 hover:text-primary text-xs font-semibold transition-colors"
            >
              <Phone size={13} className="flex-shrink-0" />
              <span>{SHOP_PHONE}</span>
            </a>
            <a
              href={`mailto:${SHOP_EMAIL}`}
              className="flex items-center gap-2 sm:justify-end text-slate-600 hover:text-primary text-xs font-semibold transition-colors"
            >
              <Mail size={13} className="flex-shrink-0" />
              <span>{SHOP_EMAIL}</span>
            </a>
          </div>
        </div>
      </div>

      <div className="mt-5 sm:mt-8 pt-4 border-t border-primary/10 text-center">
        <p className="text-slate-500 text-[11px] font-medium">
          © {new Date().getFullYear()} Smart Master. All rights reserved.
        </p>
      </div>
    </div>
  </footer>
);

export default PortalFooter;
