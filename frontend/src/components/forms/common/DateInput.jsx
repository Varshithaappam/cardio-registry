import React from 'react';
import FormField from './FormField';

function formatDateToView(val) {
  if (!val) return '';
  const dateStr = val.split('T')[0];
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    return `${parts[2]}-${parts[1]}-${parts[0]}`;
  }
  return val;
}

export default function DateInput({
  label,
  value,
  onChange,
  required = false,
  id,
  className = '',
  readOnly = false,
  error = null
}) {
  if (readOnly) {
    return (
      <FormField label={label} required={required} error={error} className={className}>
        <input
          id={id}
          type="text"
          readOnly
          value={formatDateToView(value) || '—'}
          className="w-full p-2 border border-slate-200 rounded-lg text-xs font-medium text-slate-800 bg-white focus:outline-none disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed"
        />
      </FormField>
    );
  }

  const formattedVal = value ? value.split('T')[0] : '';

  return (
    <FormField label={label} required={required} error={error} className={className}>
      <input
        id={id}
        type="date"
        required={required}
        value={formattedVal}
        onChange={(e) => onChange(e.target.value)}
        className={`w-full p-2 border ${error ? 'border-red-500 focus:ring-red-500/20' : 'border-slate-200 focus:ring-teal-500/20'} rounded-lg text-xs font-medium text-slate-800 bg-white focus:outline-none focus:ring-2 disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed`}
      />
    </FormField>
  );
}
