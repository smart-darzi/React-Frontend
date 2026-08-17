import React from 'react';

// Minimal underline-only field, matching the reference design's "Email
// Address" / "Password" inputs — label above, single bottom rule (a teal
// gradient line, echoing the reference's blue-purple one), no boxed icon
// well. Shared by Login, Worker Sign Up and Customer Sign Up so every
// field across all three renders identically.
const AuthUnderlineField = ({ label, required, error, hint, className = '', inputClassName = '', accent, ...inputProps }) => {
  return (
    <div className={`space-y-2 ${className}`}>
      {label && (
        <label className="text-[13px] font-bold tracking-wide text-slate-400 uppercase">
          {label}{required && <span className="text-primary"> *</span>}
        </label>
      )}
      <div className="relative">
        <input
          className={`w-full bg-transparent outline-none text-slate-700 placeholder:text-slate-300 text-base sm:text-[15px] py-1.5 ${inputClassName}`}
          {...inputProps}
        />
        <div
          className="absolute bottom-0 left-0 right-0 h-[2px] rounded-full"
          style={{ background: error ? '#ef4444' : (accent || 'linear-gradient(90deg, #4FA6B8, #1C6B82, #0B5E63)') }}
        />
      </div>
      {error ? (
        <p className="text-xs text-red-500 font-semibold px-0.5">⚠ {error}</p>
      ) : hint ? (
        <p className="text-xs text-slate-400 px-0.5">{hint}</p>
      ) : null}
    </div>
  );
};

export default AuthUnderlineField;
