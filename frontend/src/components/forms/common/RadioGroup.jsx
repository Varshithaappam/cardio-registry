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
              className={`flex items-center gap-2 p-2.5 bg-white border border-slate-100 rounded-lg cursor-pointer text-xs text-slate-700 font-medium hover:border-slate-200 transition-colors ${readOnly ? "pointer-events-none opacity-80 bg-slate-50" : ""}`}
            >
              <input
                type="radio"
                name={name}
                value={optionValue}
                checked={value === optionValue}
                onChange={() => onChange(optionValue)}
                className="shrink-0"
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
