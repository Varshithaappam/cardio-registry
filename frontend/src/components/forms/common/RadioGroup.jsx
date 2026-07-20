import React from 'react';
import FormField from './FormField';

const columnClass = {
  1: 'grid-cols-1',
  2: 'grid-cols-1 sm:grid-cols-2',
  3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
  4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4'
};

export default function RadioGroup({
  label,
  name,
  options,
  value,
  onChange,
  required = false,
  columns = 2,
  className = '',
  readOnly = false
}) {
  return (
    <FormField label={label} required={required} className={className}>
      <div className={`grid ${columnClass[columns] || columnClass[2]} gap-2`}>
        {options.map((option) => {
          const optionValue = typeof option === 'string' ? option : option.value;
          const optionLabel = typeof option === 'string' ? option : option.label;

          return (
            <label
              key={optionValue}
              className={`flex items-center gap-2 p-2.5 bg-white border border-slate-200 rounded-lg ${readOnly ? 'pointer-events-none' : 'cursor-pointer hover:border-slate-300'} text-xs text-black font-medium transition-colors`}
            >
              <input
                type="radio"
                name={name}
                value={optionValue}
                checked={value === optionValue}
                onChange={() => onChange(optionValue)}
                className="shrink-0 accent-teal-600 disabled:opacity-100 disabled:accent-black"
                disabled={readOnly}
              />
              <span>{optionLabel}</span>
            </label>
          );
        })}
      </div>
    </FormField>
  );
}
