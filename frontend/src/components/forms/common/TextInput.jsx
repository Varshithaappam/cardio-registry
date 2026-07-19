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
  readOnly = false
}) {
  return (
    <FormField label={label} required={required} className={className}>
      <input
        id={id}
        type="text"
        required={required}
        value={value ?? ''}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        disabled={readOnly}
        className="w-full p-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20"
      />
    </FormField>
  );
}
