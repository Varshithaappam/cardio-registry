import React from 'react';

export default function SectionCard({ title, subtitle, children }) {
  return (
    <section className="border border-slate-200 rounded-xl bg-white p-5 shadow-sm space-y-4 text-black">
      <div>
        <h4 className="form-section-heading">{title}</h4>
        {subtitle && <p className="form-supporting-text mt-1">{subtitle}</p>}
      </div>
      {children}
    </section>
  );
}
