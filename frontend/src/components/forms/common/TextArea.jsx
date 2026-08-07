import React from 'react';
import FormField from './FormField';
import { INPUT_NORMAL_STYLES, INPUT_ERROR_STYLES, INPUT_DISABLED_STYLES } from './formStyles';

export default function TextArea({
  label,
  value,
  onChange,
  placeholder = '',
  required = false,
  rows = 3,
  id,
  className = '',
  readOnly = false,
  disabled = false,
  maxLength = 1500,
  error = null
}) {
  const isDisabled = disabled || readOnly;
  const currentLength = (value ?? '').length;

  return (
    <FormField label={label} required={required} error={error} className={className}>
      <div className="relative w-full">
        <textarea
          id={id}
          rows={rows}
          value={value ?? ''}
          placeholder={placeholder}
          maxLength={maxLength}
          onChange={(e) => onChange(e.target.value)}
          disabled={isDisabled}
          readOnly={readOnly}
          className={`${error ? INPUT_ERROR_STYLES : isDisabled ? INPUT_DISABLED_STYLES : INPUT_NORMAL_STYLES} pb-6`}
        />
        <div className="absolute bottom-2 right-2.5 text-[10px] font-medium text-slate-400 select-none pointer-events-none bg-white/90 px-1 rounded">
          {currentLength}/{maxLength}
        </div>
      </div>
    </FormField>
  );
}
