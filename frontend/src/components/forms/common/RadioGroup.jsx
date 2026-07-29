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
  readOnly = false,
  error = null
}) {
  return (
    <FormField label={label} required={required} error={error} className={className}>
      <div className={`grid ${columnClass[columns] || columnClass[2]} gap-2`}>
        {options.map((option) => {
          const optionValue = typeof option === 'string' ? option : option.value;
          const optionLabel = typeof option === 'string' ? option : option.label;

          return (
            <label
              key={optionValue}
              className={`flex items-center gap-2 px-3 py-1.5 border rounded-lg transition-colors text-xs font-medium ${
                value === optionValue
                  ? 'bg-blue-50/50 border-blue-500 text-blue-900 font-semibold'
                  : error
                  ? 'bg-white border-red-500 text-slate-700'
                  : 'bg-white border-slate-200 text-slate-700'
              } ${readOnly ? 'pointer-events-none' : 'cursor-pointer hover:border-slate-300'} transition-all duration-150`}
            >
              <input
                type="radio"
                name={name}
                value={optionValue}
                checked={value === optionValue}
                onChange={() => onChange(optionValue)}
                className="shrink-0 accent-blue-600 disabled:opacity-100 disabled:accent-blue-600"
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
