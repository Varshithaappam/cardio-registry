import React from 'react';
import FormField from './FormField';
import { INPUT_NORMAL_STYLES, INPUT_ERROR_STYLES, INPUT_DISABLED_STYLES } from './formStyles';

export default function Select({
  label,
  value,
  onChange,
  options = [],
  required = false,
  id,
  placeholder = 'Select...',
  className = '',
  readOnly = false,
  disabled = false,
  error = null
}) {
  const isDisabled = disabled || readOnly;
  return (
    <FormField label={label} required={required} error={error} className={className}>
      <select
        id={id}
        required={required}
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value)}
        disabled={isDisabled}
        className={error ? INPUT_ERROR_STYLES : isDisabled ? INPUT_DISABLED_STYLES : INPUT_NORMAL_STYLES}
      >
        <option value="" disabled>{placeholder}</option>
        {options.map((option) => {
          const optionValue = typeof option === 'string' ? option : option.value;
          const optionLabel = typeof option === 'string' ? option : option.label;
          return (
            <option key={optionValue} value={optionValue}>
              {optionLabel}
            </option>
          );
        })}
      </select>
    </FormField>
  );
}
