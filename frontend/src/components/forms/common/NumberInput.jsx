import React, { useState, useEffect, useRef, useCallback, memo } from 'react';
import FormField from './FormField';
import { INPUT_NORMAL_STYLES, INPUT_ERROR_STYLES, INPUT_DISABLED_STYLES } from './formStyles';

function NumberInput({
  label,
  value,
  onChange,
  placeholder = '',
  required = false,
  id,
  min,
  max,
  step,
  maxLength,
  disabled = false,
  className = '',
  readOnly = false,
  error = null,
  debounceMs = 200,
  onBlur
}) {
  const isDisabled = disabled || readOnly;
  const propStrVal = value !== undefined && value !== null ? String(value) : '';
  const [localVal, setLocalVal] = useState(propStrVal);
  const debounceTimerRef = useRef(null);

  useEffect(() => {
    setLocalVal(propStrVal);
  }, [propStrVal]);

  const flushChange = useCallback(
    (newVal) => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
        debounceTimerRef.current = null;
      }
      if (onChange && newVal !== propStrVal) {
        onChange(newVal);
      }
    },
    [onChange, propStrVal]
  );

  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  const handleChange = (val) => {
    if (maxLength && val.length > maxLength) return;
    if (val === '' || /^[0-9]*\.?[0-9]*$/.test(val)) {
      setLocalVal(val);

      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }

      debounceTimerRef.current = setTimeout(() => {
        if (onChange) {
          onChange(val);
        }
      }, debounceMs);
    }
  };

  const handleBlur = (e) => {
    flushChange(localVal);
    if (onBlur) {
      onBlur(e);
    }
  };

  return (
    <FormField label={label} required={required} error={error} className={className}>
      <input
        id={id}
        type="text"
        disabled={isDisabled}
        readOnly={readOnly}
        required={required}
        value={localVal}
        placeholder={placeholder}
        maxLength={maxLength}
        onChange={(e) => handleChange(e.target.value)}
        onBlur={handleBlur}
        className={error ? INPUT_ERROR_STYLES : isDisabled ? INPUT_DISABLED_STYLES : INPUT_NORMAL_STYLES}
      />
    </FormField>
  );
}

export default memo(NumberInput);
