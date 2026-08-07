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
  error = null
}) {
  const isDisabled = disabled || readOnly;
  const handleChange = (val) => {
    if (maxLength && val.length > maxLength) return;
    if (val === '' || /^[0-9]*\.?[0-9]*$/.test(val)) {
      onChange(val);
    } else {
      alert("enter only numbers");
    }
  };

  return (
    <FormField label={label} required={required} error={error} className={className}>
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
        className={error ? INPUT_ERROR_STYLES : isDisabled ? INPUT_DISABLED_STYLES : INPUT_NORMAL_STYLES}
      />
    </FormField>
  );
}
