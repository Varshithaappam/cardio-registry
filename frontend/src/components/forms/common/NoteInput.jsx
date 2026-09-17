import React, { useRef, useEffect } from 'react';

/**
 * NoteInput Component
 * Auto-expanding, auto-resizing textarea for notes enforcing a strict character limit (default 150)
 * with a subtle character counter ({currentLength}/150) and clean view/print mode rendering.
 * Enforces strict width containment (w-full min-w-0 break-words) to prevent grid overflow.
 */
export default function NoteInput({
  value = '',
  onChange,
  maxLength = 150,
  disabled = false,
  readOnly = false,
  placeholder = 'Add note...',
  className = '',
  focusRingClass = 'focus:ring-red-500'
}) {
  const strVal = value !== undefined && value !== null ? String(value) : '';
  const currentLength = strVal.length;
  const isViewMode = disabled || readOnly;
  const textareaRef = useRef(null);

  const adjustHeight = (el) => {
    const target = el || textareaRef.current;
    if (target) {
      target.style.height = 'auto';
      target.style.height = `${target.scrollHeight}px`;
    }
  };

  useEffect(() => {
    if (!isViewMode) {
      adjustHeight();
    }
  }, [strVal, isViewMode]);

  const handleChange = (e) => {
    const target = e.target;
    const val = target.value.slice(0, maxLength);
    if (onChange) {
      onChange(val);
    }
    adjustHeight(target);
  };

  if (isViewMode) {
    return (
      <div className={`relative w-full min-w-0 ${className}`}>
        <div className="h-auto w-full break-words whitespace-normal text-xs text-slate-800 bg-slate-50 border border-slate-200 rounded px-2.5 py-1.5 min-h-[32px] flex items-center min-w-0">
          {strVal ? (
            <span className="break-words whitespace-normal w-full">{strVal}</span>
          ) : (
            <span className="text-slate-400 italic">No note provided</span>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={`relative w-full min-w-0 ${className}`}>
      <textarea
        ref={textareaRef}
        rows={1}
        value={strVal}
        maxLength={maxLength}
        onChange={handleChange}
        onInput={(e) => adjustHeight(e.target)}
        placeholder={placeholder}
        className={`w-full min-w-0 px-2.5 py-1.5 pr-14 text-xs border border-slate-300 rounded focus:ring-1 ${focusRingClass} resize-none overflow-hidden transition-all bg-white font-normal text-slate-800 leading-normal block min-h-[32px] break-words whitespace-normal`}
      />
      <small className="absolute right-1.5 bottom-1.5 text-[9px] font-mono text-gray-400 select-none pointer-events-none bg-white/90 px-0.5 rounded">
        {currentLength}/{maxLength}
      </small>
    </div>
  );
}
