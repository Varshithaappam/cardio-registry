import React, { useRef } from 'react';
import { Calendar } from 'lucide-react';
import FormField from './FormField';
import { formatDateForDisplay, formatDateForDatabase } from '../../../utils/dateUtils';
import { INPUT_NORMAL_STYLES, INPUT_ERROR_STYLES, INPUT_DISABLED_STYLES } from './formStyles';

export default function DateInput({
  label,
  value,
  onChange,
  required = false,
  id,
  className = '',
  readOnly = false,
  disabled = false,
  error = null,
  placeholder = 'dd/mm/yyyy'
}) {
  const hiddenDateRef = useRef(null);
  const isDisabled = disabled || readOnly;

  if (readOnly) {
    return (
      <FormField label={label} required={required} error={error} className={className}>
        <input
          id={id}
          type="text"
          readOnly
          disabled
          value={formatDateForDisplay(value) || '—'}
          className={INPUT_DISABLED_STYLES}
        />
      </FormField>
    );
  }

  const displayVal = formatDateForDisplay(value);
  const isoVal = value ? String(value).split('T')[0] : '';

  const handleTextChange = (e) => {
    const raw = e.target.value;
    if (!raw.trim()) {
      onChange('');
      return;
    }
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(raw.trim())) {
      onChange(formatDateForDatabase(raw.trim()));
    } else {
      onChange(raw);
    }
  };

  const handleDatePick = (e) => {
    onChange(e.target.value);
  };

  const openPicker = () => {
    if (hiddenDateRef.current && typeof hiddenDateRef.current.showPicker === 'function') {
      hiddenDateRef.current.showPicker();
    } else if (hiddenDateRef.current) {
      hiddenDateRef.current.focus();
      hiddenDateRef.current.click();
    }
  };

  return (
    <FormField label={label} required={required} error={error} className={className}>
      <div className="relative flex items-center w-full">
        <input
          id={id}
          type="text"
          disabled={isDisabled}
          placeholder={placeholder}
          value={displayVal}
          onChange={handleTextChange}
          className={`${error ? INPUT_ERROR_STYLES : isDisabled ? INPUT_DISABLED_STYLES : INPUT_NORMAL_STYLES} pr-8`}
        />
        <button
          type="button"
          tabIndex={-1}
          onClick={openPicker}
          disabled={isDisabled}
          className="absolute right-2.5 p-0.5 text-slate-400 hover:text-teal-600 cursor-pointer disabled:cursor-not-allowed transition-colors"
          title="Choose date"
        >
          <Calendar className="w-3.5 h-3.5" />
        </button>
        <input
          ref={hiddenDateRef}
          type="date"
          value={isoVal && /^\d{4}-\d{2}-\d{2}$/.test(isoVal) ? isoVal : ''}
          onChange={handleDatePick}
          className="sr-only absolute opacity-0 w-0 h-0 pointer-events-none"
          tabIndex={-1}
        />
      </div>
    </FormField>
  );
}
