import React from 'react';
import FormField from './FormField';
import { INPUT_NORMAL_STYLES, INPUT_ERROR_STYLES, INPUT_DISABLED_STYLES } from './formStyles';

/**
 * ValidatedTextField Component
 * Reusable input / textarea wrapper enforcing strict maxLength attributes,
 * dynamic live "X characters left" counters, and Tailwind warning styles when approaching limits.
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
  rows = 3,
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
  const remaining = Math.max(0, maxLength - currentLength);
  const isWarning = remaining <= warningThreshold;

  const handleChange = (e) => {
    const newVal = e && e.target !== undefined ? e.target.value : e;
    if (onChange) {
      onChange(newVal);
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
        {multiline || rows > 1 ? (
          <textarea
            id={id || name}
            name={name || id}
            rows={rows}
            value={strVal}
            placeholder={placeholder}
            maxLength={maxLength}
            onChange={handleChange}
            disabled={isDisabled}
            readOnly={readOnly}
            className={`${fieldStyles} ${inputClassName}`}
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
              className={`text-[11px] transition-colors duration-200 select-none ${
                isWarning
                  ? 'text-rose-500 font-bold animate-pulse'
                  : 'text-slate-400 font-medium'
              }`}
            >
              {remaining} characters left
            </span>
          </div>
        )}
      </div>
    </FormField>
  );
}
