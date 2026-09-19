import React, { memo } from 'react';
import ValidatedTextField from './ValidatedTextField';

function TextInput({
  label,
  value,
  onChange,
  placeholder = '',
  required = false,
  id,
  name,
  className = '',
  disabled = false,
  readOnly = false,
  maxLength = 255,
  warningThreshold = 5,
  error = null,
  showCounter = true,
  type = 'text',
  ...rest
}) {
  return (
    <ValidatedTextField
      label={label}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      required={required}
      id={id}
      name={name}
      className={className}
      disabled={disabled}
      readOnly={readOnly}
      maxLength={maxLength}
      warningThreshold={warningThreshold}
      error={error}
      showCounter={showCounter}
      type={type}
      multiline={false}
      {...rest}
    />
  );
}

export default memo(TextInput);
