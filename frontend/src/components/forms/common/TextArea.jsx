import React from 'react';
import ValidatedTextField from './ValidatedTextField';

export default function TextArea({
  label,
  value,
  onChange,
  placeholder = '',
  required = false,
  rows = 3,
  id,
  name,
  className = '',
  readOnly = false,
  disabled = false,
  maxLength = 1500,
  warningThreshold = 10,
  error = null,
  showCounter = true,
  ...rest
}) {
  return (
    <ValidatedTextField
      label={label}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      required={required}
      rows={rows}
      id={id}
      name={name}
      className={className}
      disabled={disabled}
      readOnly={readOnly}
      maxLength={maxLength}
      warningThreshold={warningThreshold}
      error={error}
      showCounter={showCounter}
      multiline={true}
      {...rest}
    />
  );
}
