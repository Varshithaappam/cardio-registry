import React from 'react';
import MedicationRow from './MedicationRow';

const emptyDrugRow = () => ({
  id: `drug-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
  name: '',
  dose: '',
  frequency: ''
});

export default function DrugTable({ value = [], onChange, label }) {
  const list = value.length > 0 ? value : [emptyDrugRow()];

  const updateRow = (index, updatedDrug) => {
    const newList = list.map((row, rowIndex) => (rowIndex === index ? updatedDrug : row));
    onChange(newList);
  };

  const removeRow = (index) => {
    const newList = list.filter((_, rowIndex) => rowIndex !== index);
    onChange(newList.length > 0 ? newList : [emptyDrugRow()]);
  };

  const addRow = () => {
    onChange([...list, emptyDrugRow()]);
  };

  return (
    <div className="space-y-3 text-black">
      {label && <label className="block text-xs font-bold text-black">{label}</label>}
      <div className="space-y-3">
        {list.map((drug, index) => (
          <MedicationRow
            key={drug.id || index}
            drug={drug}
            onChange={(updated) => updateRow(index, updated)}
            onRemove={() => removeRow(index)}
            canRemove={list.length > 1}
          />
        ))}
      </div>
      <button
        type="button"
        onClick={addRow}
        className="px-3 py-2 bg-black hover:bg-gray-900 text-white rounded-lg text-xs font-bold border border-white/20 transition-colors"
      >
        + Add Medication Row
      </button>
    </div>
  );
}
