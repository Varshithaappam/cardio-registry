import React from 'react';

export default function FormField({ label, required = false, error, children, className = '' }) {
  return (
    <div className={className}>
      {label && (
        <label className="form-field-label mb-1">
          {label}{required && <span className="text-red-500 font-bold ml-0.5">*</span>}
        </label>
      )}
      {children}
      {error && (
        <span className="text-red-500 text-[10px] font-bold block mt-1">
          {error}
        </span>
      )}
    </div>
  );
}
