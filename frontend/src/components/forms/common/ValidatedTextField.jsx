import React, { useRef, useEffect } from 'react';
import FormField from './FormField';
import { INPUT_NORMAL_STYLES, INPUT_ERROR_STYLES, INPUT_DISABLED_STYLES } from './formStyles';
import { validateTextWithChar } from '../../../utils/formSanitizers';

/**
 * ValidatedTextField Component
 * Reusable input / textarea wrapper enforcing strict maxLength attributes,
 * auto-resizing height for textareas, dynamic live "{used}/{maxLength}" character counters,
 * and Tailwind warning styles when approaching limits.
 */
export default function ValidatedTextField({
  label,
  value,
  onChange,
  placeholder = '',
  maxLength = 255,
  warningThreshold = 5,
  required = false,
  disabled = false,
  readOnly = false,
  multiline = false,
  rows = 1,
  id,
  name,
  className = '',
  inputClassName = '',
  error = null,
  showCounter = true,
  type = 'text',
  validateAlphabetical = true,
  isPhone = false,
  ...restProps
}) {
  const isPhoneField = Boolean(
    isPhone ||
    type === 'tel' ||
    (id && (String(id).toLowerCase().includes('phone') || String(id).toLowerCase().includes('mobile') || String(id).toLowerCase().includes('contact'))) ||
    (name && (String(name).toLowerCase().includes('phone') || String(name).toLowerCase().includes('mobile') || String(name).toLowerCase().includes('contact'))) ||
    (label && (String(label).toLowerCase().includes('phone') || String(label).toLowerCase().includes('mobile') || String(label).toLowerCase().includes('contact')))
  );

  const isNumericField = Boolean(
    type === 'number' ||
    (id && (String(id).toLowerCase().includes('income') || String(id).toLowerCase().includes('salary') || String(id).toLowerCase().includes('amount') || String(id).toLowerCase().includes('cost') || String(id).toLowerCase().includes('price') || String(id).toLowerCase().includes('uhid') || String(id).toLowerCase().includes('abha'))) ||
    (name && (String(name).toLowerCase().includes('income') || String(name).toLowerCase().includes('salary') || String(name).toLowerCase().includes('amount') || String(name).toLowerCase().includes('cost') || String(name).toLowerCase().includes('price') || String(name).toLowerCase().includes('uhid') || String(name).toLowerCase().includes('abha'))) ||
    (label && (String(label).toLowerCase().includes('income') || String(label).toLowerCase().includes('salary') || String(label).toLowerCase().includes('amount') || String(label).toLowerCase().includes('cost') || String(label).toLowerCase().includes('price') || String(label).toLowerCase().includes('uhid') || String(label).toLowerCase().includes('abha')))
  );

  const effectiveMaxLength = isPhoneField ? 10 : maxLength;
  const shouldShowCounter = showCounter && !isPhoneField;
  const effectiveValidateAlphabetical = validateAlphabetical && !isPhoneField && !isNumericField;

  const isDisabled = disabled || readOnly;
  const strVal = value !== undefined && value !== null ? String(value) : '';
  const currentLength = strVal.length;
  const isWarning = effectiveMaxLength - currentLength <= warningThreshold;
  const textareaRef = useRef(null);

  const hasCharError = effectiveValidateAlphabetical && type === 'text' && strVal.trim().length > 0 && !validateTextWithChar(strVal);
  const effectiveError = error || (hasCharError ? 'Must contain at least 1 letter (A-Z)' : null);

  const adjustHeight = (el) => {
    const target = el || textareaRef.current;
    if (target) {
      target.style.height = 'auto';
      target.style.height = `${target.scrollHeight}px`;
    }
  };

  useEffect(() => {
    if (multiline || rows >= 1) {
      adjustHeight();
    }
  }, [strVal, multiline, rows]);

  const handleChange = (e) => {
    let newVal = e && e.target !== undefined ? e.target.value : e;
    if (isPhoneField && typeof newVal === 'string') {
      newVal = newVal.replace(/\D/g, '').slice(0, 10);
    }
    if (onChange) {
      onChange(newVal);
    }
    if (e && e.target) {
      adjustHeight(e.target);
    }
  };

  const fieldStyles = effectiveError
    ? INPUT_ERROR_STYLES
    : isDisabled
    ? INPUT_DISABLED_STYLES
    : INPUT_NORMAL_STYLES;

  return (
    <FormField label={label} required={required} error={effectiveError} className={className}>
      <div className="relative w-full">
        {multiline || rows >= 1 ? (
          <textarea
            ref={textareaRef}
            id={id || name}
            name={name || id}
            rows={rows}
            value={strVal}
            placeholder={placeholder}
            maxLength={effectiveMaxLength}
            onChange={handleChange}
            onInput={(e) => adjustHeight(e.target)}
            disabled={isDisabled}
            readOnly={readOnly}
            className={`${fieldStyles} ${inputClassName} resize-none overflow-hidden block transition-[height] duration-75`}
            style={{ height: 'auto' }}
            {...restProps}
          />
        ) : (
          <input
            id={id || name}
            name={name || id}
            type={isPhoneField ? 'tel' : type}
            required={required}
            value={strVal}
            placeholder={placeholder || (isPhoneField ? 'E.g. 9848012345' : '')}
            maxLength={effectiveMaxLength}
            onChange={handleChange}
            disabled={isDisabled}
            readOnly={readOnly}
            className={`${fieldStyles} ${inputClassName}`}
            {...restProps}
          />
        )}

        {shouldShowCounter && !isDisabled && (
          <div className="flex justify-end items-center mt-1">
            <span
              className={`text-[11px] font-mono transition-colors duration-200 select-none ${
                isWarning
                  ? 'text-rose-500 font-bold animate-pulse'
                  : 'text-slate-400 font-medium'
              }`}
            >
              {currentLength}/{effectiveMaxLength}
            </span>
          </div>
        )}
      </div>
    </FormField>
  );
}
