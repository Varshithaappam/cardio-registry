import React from 'react';

export default function FormField({ label, required = false, children, className = '' }) {
  return (
    <div className={className}>
      {label && (
        <label className="block text-xs font-bold text-slate-700 mb-1">
          {label}{required ? ' *' : ''}
        </label>
      )}
      {children}
    </div>
  );
}
