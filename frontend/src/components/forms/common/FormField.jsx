import React from 'react';

export default function FormField({ label, required = false, error, children, className = '' }) {
  return (
    <div className={className}>
      {label && (
        <label className="text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5 block">
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
