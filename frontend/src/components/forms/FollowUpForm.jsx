import React, { useState, forwardRef, useImperativeHandle, useMemo, useEffect } from 'react';
import SectionCard from './common/SectionCard';
import DateInput from './common/DateInput';
import Select from './common/Select';

const FollowUpForm = forwardRef(function FollowUpForm(
  { patientRecord, editingRecord, onCompletionChange },
  ref
) {
  // States
  const [interval, setInterval] = useState(editingRecord?.followUpInterval ?? '1-month');
  const [date, setDate] = useState(editingRecord?.dateOfVisit ?? new Date().toISOString().split('T')[0]);
  const [angina, setAngina] = useState(editingRecord?.symptoms?.angina ?? 'No');
  const [nyha, setNyha] = useState(editingRecord?.symptoms?.breathlessnessClass ?? 'NYHA Class I');

  // Completion calculation (always 100% since defaults exist, but we can track if needed)
  const completionPercent = useMemo(() => {
    return 100;
  }, []);

  useEffect(() => {
    onCompletionChange?.(completionPercent);
  }, [completionPercent, onCompletionChange]);

  const getSubmissionData = () => ({
    id: editingRecord?.id ?? `fol-${Date.now()}`,
    patientId: patientRecord.patient.id,
    followUpInterval: interval,
    dateOfVisit: date,
    symptoms: {
      angina,
      breathlessnessClass: nyha
    },
    medicationCompliance: editingRecord?.medicationCompliance ?? {
      dualAntiplatelets: 'Yes',
      statins: 'Yes',
      betaBlocker: 'Yes',
      aceiOrArb: 'Yes',
      aldosteroneAntagonist: 'Yes'
    },
    adverseEvents: editingRecord?.adverseEvents ?? {
      acsEvent: false,
      hospitalization: false,
      ptca: false,
      cabg: false,
      stroke: false,
      bleeding: false,
      death: false,
      anyOther: false
    }
  });

  useImperativeHandle(ref, () => ({
    getSubmissionData
  }));

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Select
          id="fol-interval"
          label="Follow-up Interval"
          value={interval}
          onChange={setInterval}
          options={[
            { value: '1-month', label: '1-month Follow-up' },
            { value: '3-month', label: '3-month Follow-up' },
            { value: '6-month', label: '6-month Follow-up' },
            { value: '12-month', label: '12-month Follow-up' }
          ]}
          required
        />
        <DateInput
          id="fol-date"
          label="Date of Visit"
          value={date}
          onChange={setDate}
          required
        />
        <Select
          id="fol-angina"
          label="Recurrent Angina Present?"
          value={angina}
          onChange={setAngina}
          options={[
            { value: 'No', label: 'No Angina Symptoms' },
            { value: 'Yes', label: 'Yes (Recurrent ischemia)' }
          ]}
          required
        />
      </div>
    </div>
  );
});

export default FollowUpForm;
