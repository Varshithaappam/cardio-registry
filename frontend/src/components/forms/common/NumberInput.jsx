import React from 'react';
import FormField from './FormField';

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
  disabled = false,
  className = '',
  readOnly = false,
  error = null
}) {
  return (
    <FormField label={label} required={required} error={error} className={className}>
      <input
        id={id}
        type="number"
        min={min}
        max={max}
        step={step}
        disabled={disabled || readOnly}
        required={required}
        value={value ?? ''}
        placeholder={placeholder}
        onChange={(e) => {
          const val = e.target.value;
          onChange(val === '' ? '' : Number(val));
        }}
        className={`w-full p-2 border ${error ? 'border-red-500 focus:ring-red-500/20' : 'border-slate-200 focus:ring-teal-500/20'} rounded-lg text-sm bg-white text-black placeholder:text-black/60 focus:outline-none focus:ring-2 disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed`}
      />
    </FormField>
  );
}
