import React, { useState, useRef, useEffect, useCallback, memo } from 'react';

/**
 * TextArea Component
 * Optimized with local state isolation, debounced parent propagation,
 * and React.memo to eliminate typing lag across large medical forms.
 */
function TextArea({
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
  debounceMs = 200,
  onBlur,
  ...restProps
}) {
  const isDisabled = disabled || readOnly;
  const propStrVal = value !== undefined && value !== null ? String(value) : '';
  const [localVal, setLocalVal] = useState(propStrVal);
  const debounceTimerRef = useRef(null);
  const textareaRef = useRef(null);

  useEffect(() => {
    setLocalVal(propStrVal);
  }, [propStrVal]);

  const flushChange = useCallback(
    (newVal) => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
        debounceTimerRef.current = null;
      }
      if (onChange && newVal !== propStrVal) {
        onChange(newVal);
      }
    },
    [onChange, propStrVal]
  );

  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  const currentLength = localVal.length;
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
  }, [localVal]);

  const handleChange = (e) => {
    const newVal = e && e.target !== undefined ? e.target.value : e;
    setLocalVal(newVal);

    if (e && e.target) {
      adjustHeight(e.target);
    }

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      if (onChange) {
        onChange(newVal);
      }
    }, debounceMs);
  };

  const handleBlur = (e) => {
    flushChange(localVal);
    if (onBlur) {
      onBlur(e);
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
          value={localVal}
          placeholder={placeholder}
          maxLength={maxLength}
          onChange={handleChange}
          onBlur={handleBlur}
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

export default memo(TextArea);
