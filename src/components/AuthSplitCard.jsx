import React from 'react';
import AuthSidePanel from './AuthSidePanel';

// One centered card holding BOTH halves — the teal brand/illustration
// panel and the white form panel — side by side (stacked on phones).
// Used by every public auth screen (Login, Forgot Password, Reset
// Password, Worker Sign Up, Customer Sign Up) so they all look like one
// unified split card floating on the light cream page background,
// instead of two independent full-height columns.
const AuthSplitCard = ({ badgeIcon, badge, panelTitle, panelSubtitle, panelFooter, children, maxWidth = 'max-w-6xl', boxHeight = '', scrollable = false }) => {
  return (
    <div className="min-h-[100dvh] w-full flex items-center justify-center p-3 sm:p-6 lg:p-10 overflow-y-auto" style={{ background: '#FDFBF3' }}>
      <div
        className={`w-full ${maxWidth} my-auto rounded-[22px] sm:rounded-[28px] overflow-hidden shadow-xl border-2 bg-white flex flex-col lg:flex-row ${boxHeight}`}
        style={{ borderColor: '#1C6B82' }}
      >
        <AuthSidePanel badgeIcon={badgeIcon} badge={badge} title={panelTitle} subtitle={panelSubtitle} footer={panelFooter} />
        <div
          className={`flex-1 min-w-0 p-6 sm:p-10 md:p-12 lg:p-14 ${
            scrollable ? 'overflow-y-auto scrollbar-hide' : 'flex items-center justify-center'
          }`}
        >
          <div className={`w-full max-w-lg ${scrollable ? 'mx-auto' : ''}`}>
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthSplitCard;
