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
  readOnly = false
}) {
  return (
    <FormField label={label} required={required} className={className}>
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
        className="w-full p-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 disabled:bg-slate-100"
      />
    </FormField>
  );
}
