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
  readOnly = false,
  error = null
}) {
  return (
    <FormField label={label} required={required} error={error} className={className}>
      <textarea
        id={id}
        rows={rows}
        value={value ?? ''}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        disabled={readOnly}
        className={`w-full p-2 border ${error ? 'border-red-500 focus:ring-red-500/20' : 'border-slate-200 focus:ring-teal-500/20'} rounded-lg text-xs font-medium text-slate-800 bg-white placeholder:text-slate-400 focus:outline-none focus:ring-2 disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed`}
      />
    </FormField>
  );
}
