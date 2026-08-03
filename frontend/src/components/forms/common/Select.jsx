import React from 'react';
import FormField from './FormField';

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
        className={`w-full px-3 py-1.5 border rounded-lg text-xs font-medium outline-none transition-colors ${
          error
            ? 'border-red-500 bg-red-50 text-red-900 focus:ring-1 focus:ring-red-500'
            : isDisabled
            ? 'bg-slate-100 text-slate-900 font-semibold border-slate-200 cursor-not-allowed'
            : 'bg-white text-slate-800 border-slate-300 focus:ring-1 focus:ring-blue-500 focus:border-blue-500'
        }`}
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
