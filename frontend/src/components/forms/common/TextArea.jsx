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
  className = ''
}) {
  return (
    <FormField label={label} required={required} className={className}>
      <textarea
        id={id}
        rows={rows}
        value={value ?? ''}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="w-full p-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20"
      />
    </FormField>
  );
}
