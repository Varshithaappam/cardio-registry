import React, { useRef, useEffect } from 'react';
import FormField from './FormField';
import { INPUT_NORMAL_STYLES, INPUT_ERROR_STYLES, INPUT_DISABLED_STYLES } from './formStyles';

/**
 * ValidatedTextField Component
 * Reusable input / textarea wrapper enforcing strict maxLength attributes,
 * auto-resizing height for textareas, dynamic live "{used}/{maxLength}" character counters,
 * and Tailwind warning styles when approaching limits.
 */
export default function ValidatedTextField({
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
  ...restProps
}) {
  const isDisabled = disabled || readOnly;
  const strVal = value !== undefined && value !== null ? String(value) : '';
  const currentLength = strVal.length;
  const isWarning = maxLength - currentLength <= warningThreshold;
  const textareaRef = useRef(null);

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
  }, [strVal, multiline, rows]);

  const handleChange = (e) => {
    const newVal = e && e.target !== undefined ? e.target.value : e;
    if (onChange) {
      onChange(newVal);
    }
    if (e && e.target) {
      adjustHeight(e.target);
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
            value={strVal}
            placeholder={placeholder}
            maxLength={maxLength}
            onChange={handleChange}
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
            value={strVal}
            placeholder={placeholder}
            maxLength={maxLength}
            onChange={handleChange}
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
