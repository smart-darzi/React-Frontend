import React from 'react';

// Boxed field with a left icon well, used by the Worker Sign Up and
// Customer Sign Up pages (Mangools-style reference: label above, bordered
// box, icon separated from the input by a thin rule). Accent is passed in
// per-page so the focus ring/border color is easy to keep consistent
// without hardcoding it here.
const AuthBoxField = ({
  icon: Icon,
  label,
  required,
  error,
  hint,
  accent = '#1C6B82',
  as = 'input',
  children,
  className = '',
  ...inputProps
}) => {
  return (
    <div className={`space-y-1.5 ${className}`}>
      {label && (
        <label className="text-[13px] font-bold tracking-wide text-slate-500">
          {label}{required && <span style={{ color: accent }}> *</span>}
        </label>
      )}
      <div
        className="flex items-stretch border rounded-xl overflow-hidden bg-white transition-all"
        style={{
          borderColor: error ? '#fca5a5' : '#e2e8f0',
          boxShadow: 'none',
        }}
        onFocusCapture={(e) => { e.currentTarget.style.borderColor = error ? '#ef4444' : accent; }}
        onBlurCapture={(e) => { e.currentTarget.style.borderColor = error ? '#fca5a5' : '#e2e8f0'; }}
      >
        {Icon && (
          <div className="flex items-center justify-center px-3.5 bg-slate-50 border-r border-slate-200 min-w-[46px] text-slate-400">
            <Icon size={17} />
          </div>
        )}
        {as === 'select' ? (
          <select
            className="flex-1 px-4 py-3 text-[15px] bg-transparent outline-none text-slate-700 cursor-pointer"
            {...inputProps}
          >
            {children}
          </select>
        ) : (
          <input
            className="flex-1 px-4 py-3 text-[15px] bg-transparent outline-none text-slate-700 placeholder:text-slate-300"
            {...inputProps}
          />
        )}
      </div>
      {error ? (
        <p className="text-xs text-red-500 font-semibold px-0.5">⚠ {error}</p>
      ) : hint ? (
        <p className="text-xs text-slate-400 px-0.5">{hint}</p>
      ) : null}
    </div>
  );
};

export default AuthBoxField;
