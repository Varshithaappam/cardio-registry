import React, { useRef } from 'react';
import { Calendar } from 'lucide-react';
import FormField from './FormField';
import { formatDateForDisplay, formatDateForDatabase } from '../../../utils/dateUtils';

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
          className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-semibold text-slate-900 bg-slate-100 cursor-not-allowed outline-none"
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
          className={`w-full px-3 py-1.5 pr-8 border rounded-lg text-xs font-medium outline-none transition-colors ${
            error
              ? 'border-red-500 bg-red-50 text-red-900 focus:ring-1 focus:ring-red-500'
              : isDisabled
              ? 'bg-slate-100 text-slate-900 font-semibold border-slate-200 cursor-not-allowed'
              : 'bg-white text-slate-800 border-slate-300 focus:ring-1 focus:ring-blue-500 focus:border-blue-500'
          }`}
        />
        <button
          type="button"
          tabIndex={-1}
          onClick={openPicker}
          disabled={isDisabled}
          className="absolute right-2 p-0.5 text-slate-400 hover:text-slate-600 cursor-pointer disabled:cursor-not-allowed"
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
