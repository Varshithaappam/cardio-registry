import React from 'react';
import { FORM_STYLES } from './formStyles';

export default function FormField({ label, required = false, error, warning, children, className = '' }) {
  return (
    <div className={className}>
      {label && (
        <label className={FORM_STYLES.label}>
          {label}
        </label>
      )}
      {children}
      {error ? (
        <span className="text-red-500 text-[10px] font-bold block mt-1">
          {error}
        </span>
      ) : warning ? (
        <span className="text-amber-600 font-semibold text-xs flex items-center gap-1 mt-1">
          <svg className="w-3.5 h-3.5 text-amber-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          {warning}
        </span>
      ) : null}
    </div>
  );
}
