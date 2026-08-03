import React from 'react';
import FormField from './FormField';

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
        onChange={(e) => onChange(e.target.value)}
        disabled={isDisabled}
        readOnly={readOnly}
        className={`w-full px-3 py-1.5 border rounded-lg text-xs font-medium outline-none transition-colors ${
          error
            ? 'border-red-500 bg-red-50 text-red-900 focus:ring-1 focus:ring-red-500'
            : isDisabled
            ? 'bg-slate-100 text-slate-900 font-semibold border-slate-200 cursor-not-allowed'
            : 'bg-white text-slate-800 border-slate-300 focus:ring-1 focus:ring-blue-500 focus:border-blue-500'
        }`}
      />
    </FormField>
  );
}
