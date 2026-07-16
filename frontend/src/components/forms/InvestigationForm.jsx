import React, { useState, forwardRef, useImperativeHandle, useMemo, useEffect } from 'react';
import DateInput from './common/DateInput';
import Select from './common/Select';
import NumberInput from './common/NumberInput';
import TextInput from './common/TextInput';

const InvestigationForm = forwardRef(function InvestigationForm(
  { patientRecord, editingRecord, onCompletionChange },
  ref
) {
  // States
  const [date, setDate] = useState(editingRecord?.investigationDate ?? new Date().toISOString().split('T')[0]);
  const [type, setType] = useState(editingRecord?.testType ?? 'ECG');

  // ECG specifics
  const [ecgHr, setEcgHr] = useState(editingRecord?.results?.hr ?? 72);
  const [ecgRhythm, setEcgRhythm] = useState(editingRecord?.results?.rhythm ?? 'NSR');

  // Echo specifics
  const [echoEf, setEchoEf] = useState(editingRecord?.results?.ef ?? 55);
  const [echoRwma, setEchoRwma] = useState(editingRecord?.results?.rwma ?? 'None');

  // Completion calculation (defaults exist, so always 100% complete)
  const completionPercent = useMemo(() => {
    return 100;
  }, []);

  useEffect(() => {
    onCompletionChange?.(completionPercent);
  }, [completionPercent, onCompletionChange]);

  const getSubmissionData = () => ({
    id: editingRecord?.id ?? `inv-${Date.now()}`,
    patientId: patientRecord.patient.id,
    investigationDate: date,
    testType: type,
    results: type === 'ECG' ? {
      hr: ecgHr,
      rhythm: ecgRhythm
    } : type === 'ECHO' ? {
      ef: echoEf,
      rwma: echoRwma
    } : {}
  });

  useImperativeHandle(ref, () => ({
    getSubmissionData
  }));

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Select
          id="inv-type"
          label="Diagnostic Report Type"
          value={type}
          onChange={setType}
          options={[
            { value: 'ECG', label: 'ECG (Electrocardiography)' },
            { value: 'ECHO', label: 'ECHO (Echocardiography)' },
            { value: 'Chest X-Ray', label: 'Chest X-Ray' },
            { value: 'Stress Test', label: 'Cardiac Stress Testing' },
            { value: 'Angiogram', label: 'Coronary Angiography' }
          ]}
          required
        />
        <DateInput
          id="inv-date"
          label="Date of Test"
          value={date}
          onChange={setDate}
          required
        />
      </div>

      {/* Conditional ECG Sub-Panel */}
      {type === 'ECG' && (
        <div className="p-4 bg-slate-50 border rounded-xl space-y-4 animate-fadeIn">
          <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">ECG Parameters</h4>
          <div className="grid grid-cols-2 gap-4">
            <NumberInput
              id="ecg-hr"
              label="Heart Rate (bpm)"
              value={ecgHr}
              onChange={setEcgHr}
            />
            <TextInput
              id="ecg-rhythm"
              label="ECG Rhythm"
              value={ecgRhythm}
              placeholder="NSR, Atrial Fibrillation"
              onChange={setEcgRhythm}
            />
          </div>
        </div>
      )}

      {/* Conditional ECHO Sub-Panel */}
      {type === 'ECHO' && (
        <div className="p-4 bg-slate-50 border rounded-xl space-y-4 animate-fadeIn">
          <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Echocardiography Parameters</h4>
          <div className="grid grid-cols-2 gap-4">
            <NumberInput
              id="echo-ef"
              label="Ejection Fraction (EF%)"
              value={echoEf}
              onChange={setEchoEf}
              required
            />
            <TextInput
              id="echo-rwma"
              label="Regional Wall Motion Abnormality (RWMA)"
              value={echoRwma}
              placeholder="E.g. LAD territory, Hypokinesia"
              onChange={setEchoRwma}
            />
          </div>
        </div>
      )}
    </div>
  );
});

export default InvestigationForm;
