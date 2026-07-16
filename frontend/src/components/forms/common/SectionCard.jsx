import React from 'react';

export default function SectionCard({ title, subtitle, children }) {
  return (
    <section className="bg-slate-50 border border-slate-100 rounded-xl p-4 md:p-5 space-y-4">
      <div>
        <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">{title}</h4>
        {subtitle && <p className="text-[11px] text-slate-500 mt-1">{subtitle}</p>}
      </div>
      {children}
    </section>
  );
}
