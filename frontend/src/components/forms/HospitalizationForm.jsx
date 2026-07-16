import React, { useState, forwardRef, useImperativeHandle, useMemo, useEffect } from 'react';
import SectionCard from './common/SectionCard';
import TextInput from './common/TextInput';
import NumberInput from './common/NumberInput';
import DateInput from './common/DateInput';

const HospitalizationForm = forwardRef(function HospitalizationForm(
  { patientRecord, editingRecord, onCompletionChange },
  ref
) {
  // Local states
  const [admissionDate, setAdmissionDate] = useState(editingRecord?.admissionDate ?? new Date().toISOString().split('T')[0]);
  const [dischargeDate, setDischargeDate] = useState(editingRecord?.dischargeDate ?? new Date().toISOString().split('T')[0]);
  const [hospitalName, setHospitalName] = useState(editingRecord?.hospitalName ?? 'CARE Heart Institute');
  const [hospitalZip, setHospitalZip] = useState(editingRecord?.hospitalZip ?? '500034');
  const [hospitalState, setHospitalState] = useState(editingRecord?.hospitalState ?? 'Telangana');
  const [payor, setPayor] = useState(editingRecord?.payor ?? 'Arogyasree');
  const [treatingCardiologist, setTreatingCardiologist] = useState(editingRecord?.treatingCardiologist ?? patientRecord.patient.primaryConsultant);
  const [reason, setReason] = useState(editingRecord?.reasonForAdmission ?? '');
  const [isHF, setIsHF] = useState(editingRecord?.isHFAdmission ?? false);
  const [precipitating, setPrecipitating] = useState(editingRecord?.hfPrecipitatingFactors ?? []);

  // Stay charges
  const [costBed, setCostBed] = useState(editingRecord?.costBedCharges ?? 0);
  const [costDrugs, setCostDrugs] = useState(editingRecord?.costDrugsDisposables ?? 0);
  const [costPackages, setCostPackages] = useState(editingRecord?.costPackages ?? 0);
  const [costLab, setCostLab] = useState(editingRecord?.costLabInvestigations ?? 0);
  const [costNonInvasive, setCostNonInvasive] = useState(editingRecord?.costNonInvasiveLabs ?? 0);
  const [costConsults, setCostConsults] = useState(editingRecord?.costConsults ?? 0);
  const [costRadiology, setCostRadiology] = useState(editingRecord?.costRadiology ?? 0);
  const [costMisc, setCostMisc] = useState(editingRecord?.costMiscellaneous ?? 0);

  // Auto-calculated total cost
  const totalCost = useMemo(() => {
    return costBed + costDrugs + costPackages + costLab + costNonInvasive + costConsults + costRadiology + costMisc;
  }, [costBed, costDrugs, costPackages, costLab, costNonInvasive, costConsults, costRadiology, costMisc]);

  // Completion calculation
  const completionPercent = useMemo(() => {
    let filled = 0;
    const total = 4;
    if (admissionDate) filled++;
    if (hospitalName) filled++;
    if (treatingCardiologist) filled++;
    if (reason) filled++;
    return Math.round((filled / total) * 100);
  }, [admissionDate, hospitalName, treatingCardiologist, reason]);

  useEffect(() => {
    onCompletionChange?.(completionPercent);
  }, [completionPercent, onCompletionChange]);

  const getSubmissionData = () => ({
    id: editingRecord?.id ?? `hosp-${Date.now()}`,
    patientId: patientRecord.patient.id,
    admissionDate,
    dischargeDate,
    hospitalName,
    hospitalZip,
    hospitalState,
    payor,
    treatingCardiologist,
    reasonForAdmission: reason,
    isHFAdmission: isHF,
    hfPrecipitatingFactors: isHF ? precipitating : [],
    icuVisit: editingRecord?.icuVisit ?? 'No',
    icuReadmission: editingRecord?.icuReadmission ?? 'No',
    costBedCharges: costBed,
    costDrugsDisposables: costDrugs,
    costPackages: costPackages,
    costLabInvestigations: costLab,
    costNonInvasiveLabs: costNonInvasive,
    costConsults: costConsults,
    costRadiology: costRadiology,
    costMiscellaneous: costMisc,
    costTotal: totalCost,
    dischargeLocation: editingRecord?.dischargeLocation ?? 'Home'
  });

  useImperativeHandle(ref, () => ({
    getSubmissionData
  }));

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <DateInput
          id="hosp-admdt"
          label="Date of Admission"
          value={admissionDate}
          onChange={setAdmissionDate}
          required
        />
        <DateInput
          id="hosp-dischdt"
          label="Date of Discharge"
          value={dischargeDate}
          onChange={setDischargeDate}
        />
        <TextInput
          id="hosp-site"
          label="Hospital / Clinic Site"
          value={hospitalName}
          onChange={setHospitalName}
          required
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <TextInput
          id="hosp-doc"
          label="Treating Cardiologist / Consultant"
          value={treatingCardiologist}
          onChange={setTreatingCardiologist}
          required
        />
        <TextInput
          id="hosp-reason"
          label="Primary Reason for Admission"
          value={reason}
          placeholder="E.g. Decompensated heart failure, angina evaluation"
          onChange={setReason}
          required
        />
      </div>

      {/* Financial stay charges */}
      <SectionCard title="Costs & Hospital Stay Charges">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <NumberInput
            id="cost-bed"
            label="Bed charges (INR)"
            value={costBed}
            onChange={setCostBed}
          />
          <NumberInput
            id="cost-drugs"
            label="Drugs & Disposables"
            value={costDrugs}
            onChange={setCostDrugs}
          />
          <NumberInput
            id="cost-package"
            label="Package Cost"
            value={costPackages}
            onChange={setCostPackages}
          />
          <NumberInput
            id="cost-labs"
            label="Lab Investigations"
            value={costLab}
            onChange={setCostLab}
          />
        </div>

        <div className="border-t border-slate-200 pt-3 flex justify-between items-center text-sm font-bold text-slate-800">
          <span>Total Accumulated Costs:</span>
          <span className="text-blue-600 font-mono">₹{totalCost.toLocaleString()}</span>
        </div>
      </SectionCard>
    </div>
  );
});

export default HospitalizationForm;
