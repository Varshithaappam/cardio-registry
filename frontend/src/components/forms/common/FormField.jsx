import React from 'react';

export default function FormField({ label, required = false, children, className = '' }) {
  return (
    <div className={className}>
      {label && (
        <label className="block text-xs font-bold text-black mb-1">
          {label}{required ? ' *' : ''}
        </label>
      )}
      {children}
    </div>
  );
}
