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

/**
 * Case-insensitive string matching helper for radio buttons
 */
export const isRadioChecked = (stateVal, optVal) => {
  if (stateVal === undefined || stateVal === null || optVal === undefined || optVal === null) return false;
  const sStr = String(stateVal).trim().toLowerCase();
  const oStr = String(optVal).trim().toLowerCase();
  if (!sStr || !oStr) return false;
  if (sStr === oStr) return true;
  
  // Custom aliases matching (e.g. 'direct', 'self-pay / direct', 'arogyasree', etc.)
  if ((sStr === 'direct' || sStr === 'self-pay / direct' || sStr === 'self pay / direct') && 
      (oStr === 'direct' || oStr === 'self-pay / direct' || oStr === 'self pay / direct')) return true;
  if ((sStr === 'arogyasree' || sStr === 'aarogyasri') && (oStr === 'arogyasree' || oStr === 'aarogyasri')) return true;
  if ((sStr === 'private insurance' || sStr === 'insurance') && (oStr === 'private insurance' || oStr === 'insurance')) return true;
  if ((sStr === 'government reimbursement' || sStr === 'govt reimbursement') && (oStr === 'government reimbursement' || oStr === 'govt reimbursement')) return true;

  return false;
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
  error = null,
  theme = 'hf'
}) {
  const activeCardStyle = getOptionCardActiveStyles(theme);
  const checkRadioStyle = getCheckRadioStyles(theme);

  return (
    <FormField label={label} required={required} error={error} className={className}>
      <div className={`grid ${columnClass[columns] || columnClass[2]} gap-2`}>
        {options.map((option) => {
          const optionValue = typeof option === 'string' ? option : option.value;
          const optionLabel = typeof option === 'string' ? option : option.label;
          const isChecked = isRadioChecked(value, optionValue);

          return (
            <label
              key={optionValue}
              className={`flex items-center gap-2 p-2.5 border border-slate-200 print:border-slate-200 bg-white text-slate-800 rounded-md text-xs font-normal select-none transition-colors ${
                error ? 'border-red-500' : ''
              } ${readOnly ? 'cursor-default' : 'cursor-pointer hover:border-slate-300'}`}
            >
              <input
                type="radio"
                name={name}
                value={optionValue}
                checked={isChecked}
                onChange={() => onChange(optionValue)}
                className={`${checkRadioStyle} rounded-full shrink-0`}
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
