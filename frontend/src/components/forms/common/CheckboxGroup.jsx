import React from 'react';
import FormField from './FormField';
import {
  FORM_STYLES,
  OPTION_CARD_SELECTED_STYLES,
  OPTION_CARD_NORMAL_STYLES,
  OPTION_CARD_ERROR_STYLES,
  OPTION_CARD_DISABLED_STYLES
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
              className={
                isChecked
                  ? FORM_STYLES.optionCardActive
                  : readOnly
                  ? OPTION_CARD_DISABLED_STYLES
                  : error
                  ? OPTION_CARD_ERROR_STYLES
                  : FORM_STYLES.optionCardBase
              }
            >
              <input
                type="checkbox"
                checked={isChecked}
                onChange={() => toggleValue(optionValue)}
                className={`${FORM_STYLES.checkRadioBase} rounded shrink-0 accent-teal-600 disabled:opacity-100 disabled:accent-teal-700`}
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
