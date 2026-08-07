import React from 'react';
import FormField from './FormField';
import { INPUT_NORMAL_STYLES, INPUT_ERROR_STYLES, INPUT_DISABLED_STYLES } from './formStyles';

export default function TextInput({
  label,
  value,
  onChange,
  placeholder = '',
  required = false,
  id,
  className = '',
  disabled = false,
  readOnly = false,
  maxLength = 255,
  error = null
}) {
  const isDisabled = disabled || readOnly;
  return (
    <FormField label={label} required={required} error={error} className={className}>
      <input
        id={id}
        type="text"
        required={required}
        value={value ?? ''}
        placeholder={placeholder}
        maxLength={maxLength}
        onChange={(e) => onChange(e.target.value)}
        disabled={isDisabled}
        readOnly={readOnly}
        className={error ? INPUT_ERROR_STYLES : isDisabled ? INPUT_DISABLED_STYLES : INPUT_NORMAL_STYLES}
      />
    </FormField>
  );
}
