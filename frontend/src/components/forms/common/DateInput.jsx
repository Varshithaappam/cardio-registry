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
  readOnly = false
}) {
  if (readOnly) {
    return (
      <FormField label={label} required={required} className={className}>
        <input
          id={id}
          type="text"
          readOnly
          value={formatDateToView(value) || '—'}
          className="w-full p-2 border border-slate-200 rounded-lg text-sm bg-white text-black focus:outline-none"
        />
      </FormField>
    );
  }

  const formattedVal = value ? value.split('T')[0] : '';

  return (
    <FormField label={label} required={required} className={className}>
      <input
        id={id}
        type="date"
        required={required}
        value={formattedVal}
        onChange={(e) => onChange(e.target.value)}
        className="w-full p-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20"
      />
    </FormField>
  );
}
