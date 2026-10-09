import React from 'react';
import FormField from './FormField';
import { INPUT_NORMAL_STYLES, INPUT_ERROR_STYLES, INPUT_DISABLED_STYLES, getInputBaseStyles } from './formStyles';

export default function NumberInput({
  label,
  value,
  onChange,
  placeholder = '',
  required = false,
  id,
  min,
  max,
  step,
  maxLength,
  maxDecimals = 3,
  isPercent = false,
  disabled = false,
  className = '',
  readOnly = false,
  error = null,
  warning = null,
  theme = 'hf'
}) {
  const isDisabled = disabled || readOnly;
  const isPercentage = Boolean(
    isPercent ||
    (label && (label.includes('%') || label.toLowerCase().includes('percent') || label.toLowerCase().includes('ef') || label.toLowerCase().includes('saturation') || label.toLowerCase().includes('hba1c') || label.toLowerCase().includes('pacing') || label.toLowerCase().includes('burden'))) ||
    (id && (id.includes('%') || id.toLowerCase().includes('percent') || id.toLowerCase().includes('ef') || id.toLowerCase().includes('saturation') || id.toLowerCase().includes('hba1c') || id.toLowerCase().includes('pacing') || id.toLowerCase().includes('burden')))
  );

  const handleChange = (val) => {
    if (val === '' || val === null || val === undefined) {
      onChange('');
      return;
    }

    if (maxLength && val.length > maxLength) return;

    // Reject any minus sign or negative input
    if (typeof val === 'string' && val.includes('-')) {
      val = val.replace(/-/g, '');
    }

    // Allow numbers and a single decimal point
    if (/^[0-9]*\.?[0-9]*$/.test(val)) {
      // Limit decimal places to maxDecimals (default 3)
      const parts = val.split('.');
      if (parts[1] && parts[1].length > maxDecimals) {
        val = `${parts[0]}.${parts[1].slice(0, maxDecimals)}`;
      }

      const num = parseFloat(val);
      if (!isNaN(num)) {
        // Enforce Non-negative (min >= 0)
        const effectiveMin = min !== undefined && min !== null ? Math.max(0, Number(min)) : 0;
        if (num < effectiveMin) {
          onChange(String(effectiveMin));
          return;
        }

        // Enforce Percentage Limit (0 to 100)
        if (isPercentage) {
          if (num > 100) {
            onChange('100');
            return;
          }
        }
        // Enforce explicit max prop if passed
        if (max !== undefined && max !== null && num > Number(max)) {
          onChange(String(max));
          return;
        }
      }

      onChange(val);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === '-' || e.key === 'e' || e.key === 'E') {
      e.preventDefault();
    }
  };

  const baseStyles = getInputBaseStyles(theme);
  const inputStyleClass = error
    ? INPUT_ERROR_STYLES
    : isDisabled
    ? INPUT_DISABLED_STYLES
    : baseStyles;

  return (
    <FormField label={label} required={required} error={error} warning={warning} className={className}>
      <input
        id={id}
        type="text"
        disabled={isDisabled}
        readOnly={readOnly}
        required={required}
        value={value ?? ''}
        placeholder={placeholder}
        maxLength={maxLength}
        onKeyDown={handleKeyDown}
        onChange={(e) => handleChange(e.target.value)}
        className={inputStyleClass}
      />
    </FormField>
  );
}
