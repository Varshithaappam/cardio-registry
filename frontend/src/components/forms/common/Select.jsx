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
  readOnly = false
}) {
  return (
    <FormField label={label} required={required} className={className}>
      <select
        id={id}
        required={required}
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value)}
        disabled={readOnly}
        className="w-full p-2 border border-slate-200 rounded-lg text-sm bg-white text-black placeholder:text-black/60 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
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
