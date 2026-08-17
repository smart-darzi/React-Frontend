import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';

// Boxed field with a left icon well, used by the Worker Sign Up and
// Customer Sign Up pages (Mangools-style reference: label above, bordered
// box, icon separated from the input by a thin rule). Accent is passed in
// per-page so the focus ring/border color is easy to keep consistent
// without hardcoding it here.
//
// as="select" renders a fully custom dropdown instead of a native
// <select> — native select popups are rendered by the OS/browser and
// their width can't be reliably constrained with CSS, which made the
// options list spill wider than the card (and the screen) on some
// devices. This version is plain HTML/CSS/JS, so it always matches the
// field's own width and font size, on every device.
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
  value,
  onChange,
  disabled,
  placeholder,
  ...inputProps
}) => {
  if (as === 'select') {
    const options = [];
    React.Children.forEach(children, (child) => {
      if (!child || !child.props) return;
      options.push({
        value: child.props.value,
        label: child.props.children,
        disabled: child.props.disabled,
      });
    });

    const [open, setOpen] = useState(false);
    const rootRef = useRef(null);

    useEffect(() => {
      if (!open) return;
      const onDocPointerDown = (e) => {
        if (rootRef.current && !rootRef.current.contains(e.target)) setOpen(false);
      };
      const onKeyDown = (e) => { if (e.key === 'Escape') setOpen(false); };
      document.addEventListener('mousedown', onDocPointerDown);
      document.addEventListener('keydown', onKeyDown);
      return () => {
        document.removeEventListener('mousedown', onDocPointerDown);
        document.removeEventListener('keydown', onKeyDown);
      };
    }, [open]);

    const selected = options.find(o => o.value === value);

    const selectOption = (opt) => {
      if (opt.disabled) return;
      setOpen(false);
      onChange && onChange({ target: { value: opt.value } });
    };

    return (
      <div className={`space-y-1.5 ${className}`} ref={rootRef}>
        {label && (
          <label className="text-[13px] font-bold tracking-wide text-slate-500">
            {label}{required && <span style={{ color: accent }}> *</span>}
          </label>
        )}
        <div className="relative">
          <button
            type="button"
            disabled={disabled}
            aria-haspopup="listbox"
            aria-expanded={open}
            onClick={() => setOpen(o => !o)}
            className="w-full flex items-stretch border rounded-xl overflow-hidden bg-white transition-all text-left disabled:opacity-60 disabled:cursor-not-allowed"
            style={{ borderColor: error ? '#fca5a5' : (open ? accent : '#e2e8f0') }}
          >
            {Icon && (
              <span className="flex items-center justify-center px-3 sm:px-3.5 bg-slate-50 border-r border-slate-200 min-w-[42px] sm:min-w-[46px] text-slate-400 flex-shrink-0">
                <Icon size={17} />
              </span>
            )}
            <span className={`flex-1 min-w-0 px-3 sm:px-4 py-3 text-base sm:text-[15px] truncate ${selected ? 'text-slate-700' : 'text-slate-300'}`}>
              {selected ? selected.label : (options[0] ? options[0].label : placeholder)}
            </span>
            <span className="flex items-center pr-3 sm:pr-3.5 pl-1 text-slate-400 flex-shrink-0">
              <ChevronDown size={16} className={`transition-transform duration-150 ${open ? 'rotate-180' : ''}`} />
            </span>
          </button>

          {open && (
            <div
              role="listbox"
              className="absolute z-50 left-0 right-0 mt-1.5 max-w-full bg-white border border-slate-200 rounded-xl shadow-xl max-h-60 overflow-y-auto py-1"
            >
              {options.map((opt, i) => {
                const isSelected = opt.value === value;
                return (
                  <button
                    key={`${opt.value}-${i}`}
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    disabled={opt.disabled}
                    onClick={() => selectOption(opt)}
                    className="w-full text-left px-4 py-2.5 text-[15px] flex items-center justify-between gap-2 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
                    style={isSelected ? { color: accent, fontWeight: 700 } : undefined}
                  >
                    <span className="truncate">{opt.label}</span>
                    {isSelected && <Check size={15} style={{ color: accent }} className="flex-shrink-0" />}
                  </button>
                );
              })}
            </div>
          )}
        </div>
        {error ? (
          <p className="text-xs text-red-500 font-semibold px-0.5">⚠ {error}</p>
        ) : hint ? (
          <p className="text-xs text-slate-400 px-0.5">{hint}</p>
        ) : null}
      </div>
    );
  }

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
          <div className="flex items-center justify-center px-3 sm:px-3.5 bg-slate-50 border-r border-slate-200 min-w-[42px] sm:min-w-[46px] text-slate-400 flex-shrink-0">
            <Icon size={17} />
          </div>
        )}
        <input
          className="flex-1 min-w-0 px-3 sm:px-4 py-3 text-base sm:text-[15px] bg-transparent outline-none text-slate-700 placeholder:text-slate-300"
          value={value}
          onChange={onChange}
          disabled={disabled}
          placeholder={placeholder}
          {...inputProps}
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

export default AuthBoxField;
