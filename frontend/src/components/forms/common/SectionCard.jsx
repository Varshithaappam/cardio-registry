import React from 'react';
import { FORM_STYLES } from './formStyles';

export default function SectionCard({ title, subtitle, children, className = '', disabled = false }) {
  return (
    <section className={`border border-slate-200 rounded-xl p-4 space-y-4 transition-all shadow-xs bg-white ${
      disabled ? 'bg-slate-100/50 border-slate-200/60 opacity-60 text-slate-400 select-none pointer-events-none' : ''
    } ${className}`}>
      <div className="border-b border-slate-200/80 pb-2">
        <h4 className={`${FORM_STYLES.mainHeading} ${disabled ? 'text-slate-400' : ''}`}>{title}</h4>
        {subtitle && <p className={`${FORM_STYLES.sectionDescription} ${disabled ? 'text-slate-400/80' : ''}`}>{subtitle}</p>}
      </div>
      {children}
    </section>
  );
}
