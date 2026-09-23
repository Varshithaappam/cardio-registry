import React from 'react';
import FormField from './FormField';
import { INPUT_NORMAL_STYLES, INPUT_ERROR_STYLES, INPUT_DISABLED_STYLES } from './formStyles';

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
  disabled = false,
  className = '',
  readOnly = false,
  error = null,
  warning = null
}) {
  const isDisabled = disabled || readOnly;
  const isPercentage = Boolean(
    (label && (label.includes('%') || label.toLowerCase().includes('percent') || label.toLowerCase().includes('ef'))) ||
    (id && (id.includes('%') || id.toLowerCase().includes('percent') || id.toLowerCase().includes('ef')))
  );

  const handleChange = (val) => {
    if (val === '' || val === null || val === undefined) {
      onChange('');
      return;
    }

    if (maxLength && val.length > maxLength) return;

    // Allow numbers and a single decimal point
    if (/^[0-9]*\.?[0-9]*$/.test(val)) {
      // Limit decimal places to 2
      const parts = val.split('.');
      if (parts[1] && parts[1].length > 2) {
        val = `${parts[0]}.${parts[1].slice(0, 2)}`;
      }

      const num = parseFloat(val);
      if (!isNaN(num)) {
        // Enforce Percentage Limit (0 to 100)
        if (isPercentage && num > 100) {
          onChange('100');
          return;
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

  const inputStyleClass = error
    ? INPUT_ERROR_STYLES
    : warning
    ? `${INPUT_NORMAL_STYLES} border-amber-400 focus:ring-amber-500 focus:border-amber-500 bg-amber-50/20`
    : isDisabled
    ? INPUT_DISABLED_STYLES
    : INPUT_NORMAL_STYLES;

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
        onChange={(e) => handleChange(e.target.value)}
        className={inputStyleClass}
      />
    </FormField>
  );
}
