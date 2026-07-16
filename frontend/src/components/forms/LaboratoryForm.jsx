import React, { useState, forwardRef, useImperativeHandle, useMemo, useEffect } from 'react';
import DateInput from './common/DateInput';
import NumberInput from './common/NumberInput';

const LaboratoryForm = forwardRef(function LaboratoryForm(
  { patientRecord, editingRecord, onCompletionChange },
  ref
) {
  // States
  const [date, setDate] = useState(editingRecord?.resultDate ?? new Date().toISOString().split('T')[0]);
  const [k, setK] = useState(editingRecord?.potassium ?? 4.0);
  const [creat, setCreat] = useState(editingRecord?.creatinine ?? 1.0);
  const [bnp, setBnp] = useState(editingRecord?.bnp ?? 100);
  const [trop, setTrop] = useState(editingRecord?.tropI ?? 0);

  // Completion calculation (defaults exist, so always 100% complete)
  const completionPercent = useMemo(() => {
    return 100;
  }, []);

  useEffect(() => {
    onCompletionChange?.(completionPercent);
  }, [completionPercent, onCompletionChange]);

  const getSubmissionData = () => ({
    id: editingRecord?.id ?? `lab-${Date.now()}`,
    patientId: patientRecord.patient.id,
    resultDate: date,
    potassium: k,
    creatinine: creat,
    bnp,
    tropI: trop
  });

  useImperativeHandle(ref, () => ({
    getSubmissionData
  }));

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <DateInput
          id="lab-date"
          label="Result Date"
          value={date}
          onChange={setDate}
          required
        />
        <NumberInput
          id="lab-k"
          label="Serum Potassium (mEq/L) *"
          step={0.1}
          value={k}
          onChange={setK}
          required
        />
        <NumberInput
          id="lab-creat"
          label="Serum Creatinine (mg/dL) *"
          step={0.01}
          value={creat}
          onChange={setCreat}
          required
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <NumberInput
          id="lab-bnp"
          label="BNP / NT-pro BNP (pg/mL)"
          value={bnp}
          onChange={setBnp}
        />
        <NumberInput
          id="lab-trop"
          label="Troponin-I Level (ng/mL) - ACS Specific"
          step={0.01}
          value={trop}
          placeholder="E.g. 1.25 (positive in ACS)"
          onChange={setTrop}
        />
      </div>
    </div>
  );
});

export default LaboratoryForm;
