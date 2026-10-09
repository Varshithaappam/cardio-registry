import React from 'react';
import FormField from './FormField';
import {
  FORM_STYLES,
  OPTION_CARD_SELECTED_STYLES,
  OPTION_CARD_NORMAL_STYLES,
  OPTION_CARD_ERROR_STYLES,
  OPTION_CARD_DISABLED_STYLES,
  getOptionCardActiveStyles,
  getCheckRadioStyles
} from './formStyles';

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
  error = null,
  theme = 'hf'
}) {
  const toggleValue = (optionValue) => {
    if (values.includes(optionValue)) {
      onChange(values.filter((item) => item !== optionValue));
      return;
    }
    onChange([...values, optionValue]);
  };

  const activeCardStyle = getOptionCardActiveStyles(theme);
  const checkRadioStyle = getCheckRadioStyles(theme);

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
              className={`flex items-center gap-2 p-2.5 border border-slate-200 print:border-slate-200 bg-white text-slate-800 rounded-md text-xs font-normal select-none transition-colors ${
                error ? 'border-red-500' : ''
              } ${readOnly ? 'cursor-default' : 'cursor-pointer hover:border-slate-300'}`}
            >
              <input
                type="checkbox"
                checked={isChecked}
                onChange={() => toggleValue(optionValue)}
                className={`${checkRadioStyle} rounded shrink-0`}
                disabled={readOnly}
              />
              <span className="truncate">{optionLabel}</span>
            </label>
          );
        })}
      </div>
    </FormField>
  );
}
