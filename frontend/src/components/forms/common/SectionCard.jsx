import React from 'react';

export default function SectionCard({ title, subtitle, children, className = '', disabled = false }) {
  return (
    <section className={`border rounded-xl p-4 space-y-4 transition-all shadow-xs ${
      disabled 
        ? 'bg-slate-100/50 border-slate-200/60 opacity-60 text-slate-400 select-none pointer-events-none' 
        : 'bg-slate-50/70 border border-slate-200 text-black'
    } ${className}`}>
      <div className="border-b border-slate-200/80 pb-2">
        <h4 className={`text-xs font-bold uppercase tracking-wider transition-colors ${disabled ? 'text-slate-400' : 'text-slate-800'}`}>{title}</h4>
        {subtitle && <p className={`text-[11px] transition-colors mt-0.5 ${disabled ? 'text-slate-400/80' : 'text-slate-500 font-medium'}`}>{subtitle}</p>}
      </div>
      {children}
    </section>
  );
}
