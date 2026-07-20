import React from 'react';
import FormField from './FormField';

export default function TextArea({
  label,
  value,
  onChange,
  placeholder = '',
  required = false,
  rows = 3,
  id,
  className = '',
  readOnly = false
}) {
  return (
    <FormField label={label} required={required} className={className}>
      <textarea
        id={id}
        rows={rows}
        value={value ?? ''}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        disabled={readOnly}
        className="w-full p-2 border border-slate-200 rounded-lg text-sm bg-white text-black placeholder:text-black/60 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
      />
    </FormField>
  );
}
