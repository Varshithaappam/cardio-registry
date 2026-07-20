import React from 'react';

export default function MedicationRow({ drug, onChange, onRemove, canRemove = true }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-12 gap-2 items-end p-3 bg-white border border-gray-200 rounded-lg text-black">
      <div className="md:col-span-4">
        <label className="block text-[10px] font-bold text-black uppercase mb-1">Drug Name</label>
        <input
          type="text"
          value={drug.name ?? ''}
          placeholder="E.g. Carvedilol"
          onChange={(e) => onChange({ ...drug, name: e.target.value })}
          className="w-full p-2 border border-slate-200 rounded-lg text-sm bg-white text-black placeholder:text-black/60 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
        />
      </div>
      <div className="md:col-span-3">
        <label className="block text-[10px] font-bold text-black uppercase mb-1">Dose</label>
        <input
          type="text"
          value={drug.dose ?? ''}
          placeholder="E.g. 3.125 mg"
          onChange={(e) => onChange({ ...drug, dose: e.target.value })}
          className="w-full p-2 border border-slate-200 rounded-lg text-sm bg-white text-black placeholder:text-black/60 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
        />
      </div>
      <div className="md:col-span-3">
        <label className="block text-[10px] font-bold text-black uppercase mb-1">Frequency</label>
        <input
          type="text"
          value={drug.frequency ?? ''}
          placeholder="E.g. BID"
          onChange={(e) => onChange({ ...drug, frequency: e.target.value })}
          className="w-full p-2 border border-slate-200 rounded-lg text-sm bg-white text-black placeholder:text-black/60 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
        />
      </div>
      <div className="md:col-span-2 flex justify-end">
        {canRemove && (
          <button
            type="button"
            onClick={onRemove}
            className="px-3 py-2 text-xs font-bold text-red-600 hover:bg-red-50 border border-red-100 rounded-lg transition-colors w-full md:w-auto"
          >
            Remove
          </button>
        )}
      </div>
    </div>
  );
}
