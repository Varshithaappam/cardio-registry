import React from 'react';

export default function SectionCard({ title, subtitle, children }) {
  return (
    <section className="bg-white border border-gray-200 rounded-xl p-4 md:p-5 space-y-4 text-black">
      <div>
        <h4 className="text-xs font-bold text-black uppercase tracking-wider">{title}</h4>
        {subtitle && <p className="text-[11px] text-black/70 mt-1">{subtitle}</p>}
      </div>
      {children}
    </section>
  );
}
