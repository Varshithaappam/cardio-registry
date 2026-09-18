import React, { useRef, useEffect } from 'react';

/**
 * TextArea Component
 * Auto-resizing textarea starting at 1 row tall when empty, expanding/shrinking
 * dynamically to match exact scrollHeight without extra vertical space or scrollbars.
 * Features live character counter formatted as "{used}/{maxLength}" (e.g. "0/250" or "15/250").
 */
export default function TextArea({
  label,
  value = '',
  onChange,
  placeholder = '',
  required = false,
  rows = 1,
  id,
  name,
  className = '',
  inputClassName = '',
  readOnly = false,
  disabled = false,
  maxLength = 1500,
  warningThreshold = 10,
  error = null,
  showCounter = true,
  ...restProps
}) {
  const textareaRef = useRef(null);
  const isDisabled = disabled || readOnly;
  const strVal = value !== undefined && value !== null ? String(value) : '';
  const currentLength = strVal.length;
  const isWarning = maxLength - currentLength <= warningThreshold;

  const adjustHeight = (el) => {
    const target = el || textareaRef.current;
    if (target) {
      target.style.height = 'auto';
      target.style.height = `${target.scrollHeight}px`;
    }
  };

  useEffect(() => {
    adjustHeight();
  }, [strVal]);

  const handleChange = (e) => {
    const val = e && e.target !== undefined ? e.target.value : e;
    if (onChange) {
      onChange(val);
    }
    if (e && e.target) {
      adjustHeight(e.target);
    }
  };

  return (
    <div className={`w-full ${className}`}>
      {label && (
        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}

      <div className="relative w-full">
        <textarea
          ref={textareaRef}
          id={id || name}
          name={name || id}
          rows={rows}
          value={strVal}
          placeholder={placeholder}
          maxLength={maxLength}
          onChange={handleChange}
          onInput={(e) => adjustHeight(e.target)}
          disabled={isDisabled}
          readOnly={readOnly}
          className={`w-full px-3 py-2 text-xs border border-slate-300 rounded-lg shadow-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500 disabled:bg-slate-100 disabled:text-slate-500 text-slate-800 placeholder:text-slate-400 resize-none overflow-hidden block transition-[height] duration-75 ${
            error ? 'border-red-500 focus:ring-red-500' : ''
          } ${inputClassName}`}
          style={{ height: 'auto' }}
          {...restProps}
        />

        {showCounter && !isDisabled && (
          <div className="flex justify-end items-center mt-1">
            <span
              className={`text-[11px] font-mono select-none transition-colors duration-200 ${
                isWarning
                  ? 'text-rose-500 font-bold animate-pulse'
                  : 'text-slate-400 font-medium'
              }`}
            >
              {currentLength}/{maxLength}
            </span>
          </div>
        )}

        {error && <span className="text-[10px] font-bold text-red-600 mt-1 block">⚠️ {error}</span>}
      </div>
    </div>
  );
}
