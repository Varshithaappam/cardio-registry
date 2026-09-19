import React, { useState, useRef, useEffect, useCallback, memo } from 'react';
import FormField from './FormField';
import { INPUT_NORMAL_STYLES, INPUT_ERROR_STYLES, INPUT_DISABLED_STYLES } from './formStyles';

/**
 * ValidatedTextField Component
 * Optimized with local state isolation, debounced parent propagation,
 * and React.memo to eliminate typing lag across large medical forms.
 */
function ValidatedTextField({
  label,
  value,
  onChange,
  placeholder = '',
  maxLength = 255,
  warningThreshold = 5,
  required = false,
  disabled = false,
  readOnly = false,
  multiline = false,
  rows = 1,
  id,
  name,
  className = '',
  inputClassName = '',
  error = null,
  showCounter = true,
  type = 'text',
  debounceMs = 200,
  onBlur,
  ...restProps
}) {
  const isDisabled = disabled || readOnly;
  const propStrVal = value !== undefined && value !== null ? String(value) : '';
  const [localVal, setLocalVal] = useState(propStrVal);
  const debounceTimerRef = useRef(null);
  const textareaRef = useRef(null);

  // Synchronize local value when external value changes
  useEffect(() => {
    setLocalVal(propStrVal);
  }, [propStrVal]);

  // Flush pending changes to parent
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

  // Clean up timer on unmount
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
    if (multiline || rows >= 1) {
      adjustHeight();
    }
  }, [localVal, multiline, rows]);

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

  const fieldStyles = error
    ? INPUT_ERROR_STYLES
    : isDisabled
    ? INPUT_DISABLED_STYLES
    : INPUT_NORMAL_STYLES;

  return (
    <FormField label={label} required={required} error={error} className={className}>
      <div className="relative w-full">
        {multiline || rows >= 1 ? (
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
            className={`${fieldStyles} ${inputClassName} resize-none overflow-hidden block transition-[height] duration-75`}
            style={{ height: 'auto' }}
            {...restProps}
          />
        ) : (
          <input
            id={id || name}
            name={name || id}
            type={type}
            required={required}
            value={localVal}
            placeholder={placeholder}
            maxLength={maxLength}
            onChange={handleChange}
            onBlur={handleBlur}
            disabled={isDisabled}
            readOnly={readOnly}
            className={`${fieldStyles} ${inputClassName}`}
            {...restProps}
          />
        )}

        {showCounter && !isDisabled && (
          <div className="flex justify-end items-center mt-1">
            <span
              className={`text-[11px] font-mono transition-colors duration-200 select-none ${
                isWarning
                  ? 'text-rose-500 font-bold animate-pulse'
                  : 'text-slate-400 font-medium'
              }`}
            >
              {currentLength}/{maxLength}
            </span>
          </div>
        )}
      </div>
    </FormField>
  );
}

export default memo(ValidatedTextField);
