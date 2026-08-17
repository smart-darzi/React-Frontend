import React, { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown } from 'lucide-react';

/*
 * A dropdown whose option panel is rendered into a React portal attached to
 * `document.body`, positioned with `position: fixed` from the trigger
 * button's live `getBoundingClientRect()`.
 *
 * Why: the previous dropdowns rendered their option panel as a normal
 * `absolute` child positioned relative to the field. That works fine as
 * long as every ancestor has `overflow: visible` — but several of our
 * layouts wrap fields in a horizontally-scrolling container
 * (`overflow-x-auto`, used so wide grids can scroll on narrow screens).
 * Setting `overflow-x` to anything other than `visible` forces the browser
 * to also clip the *vertical* axis (per the CSS overflow spec, an
 * unspecified `overflow-y` next to a non-visible `overflow-x` computes to
 * `auto`, not `visible`). That silently clipped the open panel — it was
 * there, just invisible — until the container itself was scrolled far
 * enough that the clipped region came into view. Portaling straight to
 * `document.body` sidesteps every ancestor's overflow/transform/z-index
 * entirely, so this can't regress no matter what container a field ends up
 * inside, on any device.
 */
const Dropdown = ({
  value,
  options,
  onChange,
  placeholder = 'Please Select',
  disabled = false,
  triggerClassName = '',
  panelClassName = '',
  optionClassName = '',
  showClearOption = false,
  clearLabel,
  renderTrigger,
  maxPanelHeight = 240,
}) => {
  const [open, setOpen] = useState(false);
  const [coords, setCoords] = useState(null);
  const triggerRef = useRef(null);
  const panelRef = useRef(null);

  const selected = options.find(o => o.value === value);
  const selectedLabel = selected ? selected.label : '';

  const updatePosition = useCallback(() => {
    const el = triggerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    const spaceAbove = rect.top;
    const openUp = spaceBelow < maxPanelHeight && spaceAbove > spaceBelow;
    setCoords({
      left: rect.left,
      width: rect.width,
      top: openUp ? null : rect.bottom + 4,
      bottom: openUp ? window.innerHeight - rect.top + 4 : null,
    });
  }, [maxPanelHeight]);

  useEffect(() => {
    if (!open) return;
    updatePosition();
    const handle = () => updatePosition();
    // capture:true so this also fires for scrolling inside any nested
    // scroll container (e.g. a modal body), not just the window itself.
    window.addEventListener('scroll', handle, true);
    window.addEventListener('resize', handle);
    return () => {
      window.removeEventListener('scroll', handle, true);
      window.removeEventListener('resize', handle);
    };
  }, [open, updatePosition]);

  useEffect(() => {
    if (!open) return;
    const handleOutside = (e) => {
      if (triggerRef.current?.contains(e.target)) return;
      if (panelRef.current?.contains(e.target)) return;
      setOpen(false);
    };
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, [open]);

  // Close automatically if this field scrolls out from under the panel
  // (e.g. long options list left open while the page is scrolled a lot).
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open]);

  const choose = (val) => {
    onChange(val);
    setOpen(false);
  };

  return (
    <>
      <button
        type="button"
        ref={triggerRef}
        disabled={disabled}
        onClick={() => setOpen(o => !o)}
        className={triggerClassName}
      >
        {renderTrigger ? (
          renderTrigger({ open, selectedLabel, selected: !!selected })
        ) : (
          <>
            <span className={`truncate ${selected ? '' : 'text-slate-400'}`}>
              {selected ? selectedLabel : placeholder}
            </span>
            <ChevronDown
              size={16}
              className={`text-slate-400 transition-transform flex-shrink-0 ml-2 ${open ? 'rotate-180' : ''}`}
            />
          </>
        )}
      </button>

      {open && coords && createPortal(
        <div
          ref={panelRef}
          style={{
            position: 'fixed',
            top: coords.top ?? undefined,
            bottom: coords.bottom ?? undefined,
            left: coords.left,
            width: coords.width,
            zIndex: 9999,
          }}
          className={`bg-white border border-slate-200 rounded-xl shadow-2xl overflow-hidden ${panelClassName}`}
        >
          {/* scrollbar-hide: the list still scrolls with wheel/touch/drag,
              it just doesn't draw a visible track/thumb over the options —
              matches the app's scrollbar-hide treatment used elsewhere. */}
          <div className="overflow-y-auto scrollbar-hide" style={{ maxHeight: maxPanelHeight }}>
            {showClearOption && (
              <button
                type="button"
                onClick={() => choose('')}
                className="w-full text-left px-4 py-2 text-sm text-slate-400 hover:bg-slate-50 font-medium"
              >
                {clearLabel ?? placeholder}
              </button>
            )}
            {options.map(opt => (
              <button
                key={opt.value}
                type="button"
                onClick={() => choose(opt.value)}
                className={`w-full text-left px-4 py-2 text-sm font-semibold hover:bg-primary/10 hover:text-primary transition-colors ${
                  value === opt.value ? 'bg-primary text-white' : 'text-slate-700'
                } ${optionClassName}`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>,
        document.body
      )}
    </>
  );
};

export default Dropdown;
