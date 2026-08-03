import React from 'react';
import FormField from './FormField';

const columnClass = {
  1: 'grid-cols-1',
  2: 'grid-cols-1 sm:grid-cols-2',
  3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
  4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4'
};

export default function CheckboxGroup({
  label,
  options,
  values = [],
  onChange,
  columns = 2,
  className = '',
  readOnly = false,
  error = null
}) {
  const toggleValue = (optionValue) => {
    if (values.includes(optionValue)) {
      onChange(values.filter((item) => item !== optionValue));
      return;
    }
    onChange([...values, optionValue]);
  };

  return (
    <FormField label={label} error={error} className={className}>
      <div className={`grid ${columnClass[columns] || columnClass[2]} gap-2`}>
        {options.map((option) => {
          const optionValue = typeof option === 'string' ? option : option.value;
          const optionLabel = typeof option === 'string' ? option : option.label;
          const isChecked = values.includes(optionValue);

          return (
            <label
              key={optionValue}
              className={`flex items-center gap-2 px-3 py-1.5 border rounded-lg transition-all text-xs font-medium ${
                isChecked
                  ? readOnly
                    ? 'bg-slate-100 border-slate-300 text-slate-900 font-bold'
                    : 'bg-teal-50/70 border-teal-500 text-teal-900 font-semibold shadow-xs'
                  : readOnly
                  ? 'bg-slate-100/60 border-slate-200 text-slate-500'
                  : error
                  ? 'bg-white border-red-500 text-slate-700'
                  : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
              } ${readOnly ? 'cursor-not-allowed' : 'cursor-pointer'}`}
            >
              <input
                type="checkbox"
                checked={isChecked}
                onChange={() => toggleValue(optionValue)}
                className="shrink-0 accent-teal-600 disabled:opacity-100 disabled:accent-slate-700"
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
