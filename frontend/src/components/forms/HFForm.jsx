import React, { useState, forwardRef, useImperativeHandle, useMemo, useEffect } from 'react';
import { calculateAge } from '../../utils/calculateAge';
import SectionCard from './common/SectionCard';
import TextInput from './common/TextInput';
import NumberInput from './common/NumberInput';
import DateInput from './common/DateInput';
import TextArea from './common/TextArea';
import Select from './common/Select';
import RadioGroup from './common/RadioGroup';
import CheckboxGroup from './common/CheckboxGroup';
import DrugTable from './common/DrugTable';

const CARDIOLOGISTS = [
  'Dr. K. Sridhar (Cardiologist)',
  'Dr. G. Sundararaman',
  'Dr. Ananth Rao',
  'Dr. Lalitha S.',
  'Dr. Priya Menon',
  'Dr. Rajesh Iyer'
];

const REFERRING_DOCTORS = [
  'Dr. Ananth Rao',
  'Dr. Lalitha S.',
  'Dr. Priya Menon',
  'Dr. Rajesh Iyer',
  'Self / Direct',
  'Emergency Department',
  'General Medicine Clinic'
];

const HIGHEST_EDUCATION_OPTIONS = [
  'Uneducated',
  'Primary',
  'High School',
  'Graduate',
  'Post Graduate'
];

const INSURANCE_OPTIONS = [
  'Arogyasree',
  'CGHS',
  'EHS',
  'Private Insurance',
  'Self Pay'
];

const MEDICAL_HISTORY_OPTIONS = [
  'Prior MI',
  'Prior CABG',
  'Prior PCI',
  'Prior HF Hospitalization',
  'Prior Stroke / TIA',
  'Hypertension',
  'Diabetes Mellitus',
  'Chronic Kidney Disease',
  'COPD',
  'Atrial Fibrillation History'
];

const RISK_FACTOR_OPTIONS = [
  'Family History of CAD',
  'Obesity',
  'Sedentary Lifestyle',
  'High Salt Intake',
  'Current Smoker',
  'Excessive Alcohol Use',
  'Uncontrolled Hypertension',
  'Poor Medication Adherence'
];

const COMORBIDITY_OPTIONS = [
  'Anemia',
  'Hypothyroidism',
  'Hyperthyroidism',
  'Obstructive Sleep Apnea',
  'Peripheral Vascular Disease',
  'Depression / Anxiety',
  'Gout',
  'Liver Disease'
];

const SYMPTOM_OPTIONS = [
  { value: 'dyspneaAtRest', label: 'Dyspnea at rest' },
  { value: 'dyspneaWithExertion', label: 'Dyspnea with exertion' },
  { value: 'fatigue', label: 'Fatigue' },
  { value: 'orthopnea', label: 'Orthopnea' },
  { value: 'lossOfAppetiteBloating', label: 'Loss of Appetite / Bloating' },
  { value: 'decreasedExerciseTolerance', label: 'Decreased Exercise Tolerance' },
  { value: 'pnd', label: 'Paroxysmal Nocturnal Dyspnea (PND)' },
  { value: 'wheeze', label: 'Wheeze' },
  { value: 'weightGain', label: 'Sudden Weight Gain' },
  { value: 'weightLoss', label: 'Unexplained Weight Loss' },
  { value: 'syncope', label: 'Syncope (Fainting)' },
  { value: 'muscleCramps', label: 'Muscle Cramps' },
  { value: 'giddiness', label: 'Giddiness / Lightheadedness' }
];

const VOLUME_OVERLOAD_OPTIONS = [
  { value: 'peripheralEdema', label: 'Peripheral edema' },
  { value: 'rales', label: 'Rales (Pulmonary)' },
  { value: 'jvpElevated', label: 'Elevated JVP' },
  { value: 'hepatomegaly', label: 'Hepatomegaly' },
  { value: 'ascites', label: 'Ascites' }
];

const HF_ETIOLOGY_CV = ['Ischemic', 'Dilated', 'Valvular', 'Toxic', 'Hypertension', 'Myocarditis', 'Congenital'];
const HF_ETIOLOGY_NON_CV = ['Diabetes', 'Thyroid', 'Pregnancy', 'Renal', 'Infection', 'Chemotherapy', 'Alcohol/Drugs'];
const HF_ETIOLOGY_PULM = ['COPD', 'Pulmonary Hypertension', 'Sleep Apnea', 'Pulmonary Embolism'];

const INVESTIGATION_OPTIONS = [
  'ECG',
  'Echocardiogram',
  'Chest X-Ray',
  'BNP / NT-proBNP',
  'Serum Creatinine',
  'Serum Potassium',
  'Hemoglobin',
  'TSH',
  'HbA1c',
  'Coronary Angiography'
];

const MACE_OPTIONS = [
  'Death',
  'Non-fatal MI',
  'Stroke',
  'HF Hospitalization',
  'Urgent Revascularization'
];

const EDUCATION_OPTIONS = [
  'Diet / Salt restriction',
  'Daily weight monitoring',
  'Medication compliance',
  'Symptom recognition & action plan',
  'Fluid restriction counseling',
  'Exercise / activity guidance',
  'Smoking cessation',
  'Alcohol moderation',
  'Device therapy education',
  'Follow-up adherence'
];

const CONTRAINDICATION_OPTIONS = [
  'ACE-I intolerance',
  'ARB intolerance',
  'Beta-blocker intolerance',
  'MRA intolerance',
  'SGLT2i intolerance',
  'Diuretic resistance',
  'Renal dysfunction limiting therapy',
  'Hyperkalemia limiting MRA'
];

const DEVICE_TYPES = [
  'CRT-P',
  'CRT-D',
  'ICD-SC',
  'ICD-DC',
  'Dual Chamber Pacemaker',
  'Single Chamber Pacemaker',
  'Other'
];

const mapSymptomsToObject = (selected = []) =>
  SYMPTOM_OPTIONS.reduce((acc, item) => {
    acc[item.value] = selected.includes(item.value);
    return acc;
  }, {});

const mapVolumeToObject = (selected = []) =>
  VOLUME_OVERLOAD_OPTIONS.reduce((acc, item) => {
    acc[item.value] = selected.includes(item.value);
    return acc;
  }, {});

const mapObjectToSelected = (source = {}, options) =>
  options.filter((option) => source[option.value]).map((option) => option.value);

const HFForm = forwardRef(function HFForm(
  { patientRecord, editingRecord, onCompletionChange },
  ref
) {
  const patient = patientRecord?.patient || {};
  const comorbidities = patientRecord?.comorbidities || {};

  // State Management
  // 1. Patient Profile extra fields
  const [highestEducation, setHighestEducation] = useState(patient.highestEducation ?? editingRecord?.patient?.highestEducation ?? '');
  const [monthlyIncome, setMonthlyIncome] = useState(patient.monthlyIncome ?? editingRecord?.patient?.monthlyIncome ?? '');
  const [occupation, setOccupation] = useState(patient.occupation ?? editingRecord?.patient?.occupation ?? '');
  const [caregiverName, setCaregiverName] = useState(patient.caregiverName ?? editingRecord?.patient?.caregiverName ?? '');
  const [caregiverRelationship, setCaregiverRelationship] = useState(patient.caregiverRelationship ?? editingRecord?.patient?.caregiverRelationship ?? '');
  const [insuranceMode, setInsuranceMode] = useState(patient.insuranceMode ?? editingRecord?.patient?.insuranceMode ?? '');

  // 2. Inpatient & Visit Details
  const [assessmentDate, setAssessmentDate] = useState(editingRecord?.assessmentDate ?? new Date().toISOString().split('T')[0]);
  const [visitType, setVisitType] = useState(editingRecord?.visitType ?? 'Outpatient');
  const [treatingCardiologist, setTreatingCardiologist] = useState(
    editingRecord?.inpatientDetails?.treatingCardiologist ?? patient.primaryConsultant ?? CARDIOLOGISTS[0]
  );
  const [referringDoctor, setReferringDoctor] = useState(
    editingRecord?.inpatientDetails?.referringDoctor ?? patient.referringDoctor ?? REFERRING_DOCTORS[0]
  );
  const [admissionDate, setAdmissionDate] = useState(editingRecord?.inpatientDetails?.admissionDate ?? '');
  const [dischargeDate, setDischargeDate] = useState(editingRecord?.inpatientDetails?.dischargeDate ?? '');
  const [wardUnit, setWardUnit] = useState(editingRecord?.inpatientDetails?.wardUnit ?? '');
  const [encounterId, setEncounterId] = useState(editingRecord?.inpatientDetails?.encounterId ?? editingRecord?.encounterId ?? '');

  // 3. Initial Clinical Assessment
  const [vWeight, setVWeight] = useState(editingRecord?.vitals?.weightKg ?? 70);
  const [vUnableToWeigh, setVUnableToWeigh] = useState(editingRecord?.vitals?.unableToWeigh ?? false);
  const [vUnableToWeighReason, setVUnableToWeighReason] = useState(editingRecord?.vitals?.unableToWeighReason ?? '');
  const [vHeight, setVHeight] = useState(editingRecord?.vitals?.heightCm ?? 170);
  const [vHr, setVHr] = useState(editingRecord?.vitals?.heartRate ?? 72);
  const [vHrVar, setVHrVar] = useState(editingRecord?.vitals?.hrVariability ?? 'Regular');
  const [vRr, setVRr] = useState(editingRecord?.vitals?.respiratoryRate ?? 18);
  const [vO2, setVO2] = useState(editingRecord?.vitals?.o2Saturation ?? 98);
  const [vBpSystolic, setVBpSystolic] = useState(editingRecord?.vitals?.bpSittingSystolic ?? 120);
  const [vBpDiastolic, setVBpDiastolic] = useState(editingRecord?.vitals?.bpSittingDiastolic ?? 80);
  const [vBpStandingSystolic, setVBpStandingSystolic] = useState(editingRecord?.vitals?.bpStandingSystolic ?? 115);
  const [vBpStandingDiastolic, setVBpStandingDiastolic] = useState(editingRecord?.vitals?.bpStandingDiastolic ?? 76);
  const [vMental, setVMental] = useState(editingRecord?.vitals?.mentalStatus ?? 'Alert/Oriented');

  const [selectedSymptoms, setSelectedSymptoms] = useState(
    mapObjectToSelected(editingRecord?.symptoms, SYMPTOM_OPTIONS)
  );
  const [selectedVolumeOverload, setSelectedVolumeOverload] = useState(
    mapObjectToSelected(editingRecord?.volumeOverloadSigns, VOLUME_OVERLOAD_OPTIONS)
  );
  const [medicalHistory, setMedicalHistory] = useState(editingRecord?.initialAssessment?.medicalHistory ?? []);
  const [riskFactors, setRiskFactors] = useState(editingRecord?.initialAssessment?.riskFactors ?? []);
  const [assessmentComorbidities, setAssessmentComorbidities] = useState(
    editingRecord?.initialAssessment?.comorbidities ?? []
  );

  const [hfType, setHfType] = useState(editingRecord?.typeOfHF ?? 'Unknown');
  const [hfStage, setHfStage] = useState(editingRecord?.stageOfHF ?? 'Stage C');
  const [hfNyha, setHfNyha] = useState(editingRecord?.nyhaClass ?? 'NYHA Class II');
  const [hfAf, setHfAf] = useState(editingRecord?.afStatus ?? 'NSR');
  const [hfEtiologyCv, setHfEtiologyCv] = useState(editingRecord?.hfEtiology?.cardiovascular ?? []);
  const [hfEtiologyNonCv, setHfEtiologyNonCv] = useState(editingRecord?.hfEtiology?.nonCardiac ?? []);
  const [hfEtiologyPulm, setHfEtiologyPulm] = useState(editingRecord?.hfEtiology?.pulmonary ?? []);
  const [initialClinicalNotes, setInitialClinicalNotes] = useState(editingRecord?.initialAssessment?.clinicalNotes ?? '');

  // 4. Final Clinical Assessment
  const [finalNyha, setFinalNyha] = useState(editingRecord?.finalAssessment?.finalNyhaClass ?? editingRecord?.nyhaClass ?? 'NYHA Class II');
  const [finalStage, setFinalStage] = useState(editingRecord?.finalAssessment?.finalStage ?? editingRecord?.stageOfHF ?? 'Stage C');
  const [finalHfType, setFinalHfType] = useState(editingRecord?.finalAssessment?.finalTypeOfHF ?? editingRecord?.typeOfHF ?? 'Unknown');
  const [maceEvents, setMaceEvents] = useState(editingRecord?.finalAssessment?.mace ?? []);
  const [finalClinicalNotes, setFinalClinicalNotes] = useState(editingRecord?.finalAssessment?.clinicalNotes ?? '');

  const [hfRiskVtvf, setHfRiskVtvf] = useState(editingRecord?.vtvfRiskAssessment?.documentedVT_VF ?? false);
  const [hfRiskSyncope, setHfRiskSyncope] = useState(editingRecord?.vtvfRiskAssessment?.syncopeComplaints ?? false);
  const [hfRiskPvcs, setHfRiskPvcs] = useState(editingRecord?.vtvfRiskAssessment?.documentedPVCs ?? false);
  const [hfRiskPvcCount, setHfRiskPvcCount] = useState(editingRecord?.vtvfRiskAssessment?.pvcCount ?? 0);
  const [hfRiskNsvt, setHfRiskNsvt] = useState(editingRecord?.vtvfRiskAssessment?.documentedNSVT ?? false);

  // 5. Investigations
  const [selectedInvestigations, setSelectedInvestigations] = useState(
    editingRecord?.investigations?.selected ?? []
  );
  const [ecgHr, setEcgHr] = useState(editingRecord?.investigations?.ecgHr ?? '');
  const [echoEf, setEchoEf] = useState(editingRecord?.investigations?.echoEf ?? '');
  const [bnpValue, setBnpValue] = useState(editingRecord?.investigations?.bnp ?? '');
  const [creatinineValue, setCreatinineValue] = useState(editingRecord?.investigations?.creatinine ?? '');
  const [potassiumValue, setPotassiumValue] = useState(editingRecord?.investigations?.potassium ?? '');
  const [investigationNotes, setInvestigationNotes] = useState(editingRecord?.investigations?.notes ?? '');

  // 6. Medical Therapy
  const [drugRows, setDrugRows] = useState(
    editingRecord?.medicalTherapy?.drugs ?? [{ id: `drug-${Date.now()}`, name: '', dose: '', frequency: '' }]
  );
  const [drugContraindications, setDrugContraindications] = useState(
    editingRecord?.drugContraindications ?? []
  );

  // 7. Device Therapy
  const [hfDevHas, setHfDevHas] = useState(editingRecord?.currentDeviceTherapy?.hasDevice ?? 'No');
  const [hfDevType, setHfDevType] = useState(editingRecord?.currentDeviceTherapy?.deviceType ?? '');
  const [hfDevBrand, setHfDevBrand] = useState(editingRecord?.currentDeviceTherapy?.brand ?? '');
  const [deviceEligible, setDeviceEligible] = useState(editingRecord?.deviceEligibility?.eligible ?? 'No');
  const [eligibleDeviceType, setEligibleDeviceType] = useState(editingRecord?.deviceEligibility?.deviceType ?? '');
  const [eligibleDeviceBrand, setEligibleDeviceBrand] = useState(editingRecord?.deviceEligibility?.brand ?? '');
  const [patientAcceptance, setPatientAcceptance] = useState(editingRecord?.deviceEligibility?.patientAcceptance ?? 'Unknown');

  // 8. Patient Education
  const [educationRecommended, setEducationRecommended] = useState(editingRecord?.educationRecommended ?? []);

  // 9. Recommendations
  const [recFluidDiet, setRecFluidDiet] = useState(editingRecord?.recommendations?.fluidAndDiet ?? '');
  const [recExercise, setRecExercise] = useState(editingRecord?.recommendations?.exercise ?? '');
  const [recYoga, setRecYoga] = useState(editingRecord?.recommendations?.yoga ?? '');
  const [recDrugs, setRecDrugs] = useState(editingRecord?.recommendations?.drugs ?? '');
  const [recInvestigations, setRecInvestigations] = useState(editingRecord?.recommendations?.investigations ?? '');
  const [recProcedures, setRecProcedures] = useState(editingRecord?.recommendations?.procedures ?? '');

  // Calculations
  const vBmi = useMemo(() => {
    if (!vUnableToWeigh && vWeight > 0 && vHeight > 0) {
      return Number((vWeight / Math.pow(vHeight / 100, 2)).toFixed(1));
    }
    return undefined;
  }, [vWeight, vHeight, vUnableToWeigh]);

  const patientAge = calculateAge(patient.dob);

  const completionPercent = useMemo(() => {
    let filled = 0;
    const total = 8;
    if (assessmentDate) filled++;
    if (visitType) filled++;
    if ((vWeight > 0 && !vUnableToWeigh) || vUnableToWeigh) filled++;
    if (hfNyha) filled++;
    if (hfStage) filled++;
    if (hfType && hfType !== 'Unknown') filled++;
    if (treatingCardiologist) filled++;
    if (finalNyha) filled++;
    return Math.round((filled / total) * 100);
  }, [assessmentDate, visitType, vWeight, vUnableToWeigh, hfNyha, hfStage, hfType, treatingCardiologist, finalNyha]);

  useEffect(() => {
    onCompletionChange?.(completionPercent);
  }, [completionPercent, onCompletionChange]);

  const getSubmissionData = () => ({
    id: editingRecord?.id ?? `hfa-${Date.now()}`,
    patientId: patient.id,
    encounterId: encounterId || editingRecord?.encounterId,
    assessmentDate,
    visitType,
    patient: {
      highestEducation,
      monthlyIncome,
      occupation,
      caregiverName,
      caregiverRelationship,
      insuranceMode
    },
    inpatientDetails: {
      treatingCardiologist,
      referringDoctor,
      admissionDate: admissionDate || undefined,
      dischargeDate: dischargeDate || undefined,
      wardUnit: wardUnit || undefined,
      encounterId: encounterId || undefined
    },
    vitals: {
      weightKg: vUnableToWeigh ? undefined : vWeight,
      unableToWeigh: vUnableToWeigh,
      unableToWeighReason: vUnableToWeigh ? vUnableToWeighReason : undefined,
      heightCm: vHeight,
      bmi: vBmi,
      heartRate: vHr,
      hrVariability: vHrVar,
      respiratoryRate: vRr,
      o2Saturation: vO2,
      bpSittingSystolic: vBpSystolic,
      bpSittingDiastolic: vBpDiastolic,
      bpStandingSystolic: vBpStandingSystolic,
      bpStandingDiastolic: vBpStandingDiastolic,
      mentalStatus: vMental
    },
    symptoms: mapSymptomsToObject(selectedSymptoms),
    volumeOverloadSigns: mapVolumeToObject(selectedVolumeOverload),
    initialAssessment: {
      medicalHistory,
      riskFactors,
      comorbidities: assessmentComorbidities,
      clinicalNotes: initialClinicalNotes
    },
    finalAssessment: {
      finalNyhaClass: finalNyha,
      finalStage,
      finalTypeOfHF: finalHfType,
      mace: maceEvents,
      clinicalNotes: finalClinicalNotes
    },
    typeOfHF: finalHfType !== 'Unknown' ? finalHfType : hfType,
    hfEtiology: {
      cardiovascular: hfEtiologyCv,
      nonCardiac: hfEtiologyNonCv,
      pulmonary: hfEtiologyPulm
    },
    stageOfHF: finalStage || hfStage,
    nyhaClass: finalNyha || hfNyha,
    afStatus: hfAf,
    vtvfRiskAssessment: {
      documentedVT_VF: hfRiskVtvf,
      syncopeComplaints: hfRiskSyncope,
      documentedPVCs: hfRiskPvcs,
      pvcCount: hfRiskPvcs ? hfRiskPvcCount : undefined,
      documentedNSVT: hfRiskNsvt
    },
    investigations: {
      selected: selectedInvestigations,
      ecgHr: ecgHr || undefined,
      echoEf: echoEf !== '' ? Number(echoEf) : undefined,
      bnp: bnpValue !== '' ? Number(bnpValue) : undefined,
      creatinine: creatinineValue !== '' ? Number(creatinineValue) : undefined,
      potassium: potassiumValue !== '' ? Number(potassiumValue) : undefined,
      notes: investigationNotes || undefined
    },
    medicalTherapy: {
      drugs: drugRows.filter((drug) => drug.name || drug.dose || drug.frequency)
    },
    drugContraindications,
    currentDeviceTherapy: {
      hasDevice: hfDevHas,
      deviceType: hfDevHas === 'Yes' ? hfDevType : undefined,
      brand: hfDevHas === 'Yes' ? hfDevBrand : undefined
    },
    deviceEligibility: {
      eligible: deviceEligible,
      deviceType: deviceEligible === 'Yes' ? eligibleDeviceType : undefined,
      brand: deviceEligible === 'Yes' ? eligibleDeviceBrand : undefined,
      patientAcceptance: deviceEligible === 'Yes' ? patientAcceptance : undefined
    },
    educationRecommended,
    recommendations: {
      fluidAndDiet: recFluidDiet || undefined,
      exercise: recExercise || undefined,
      yoga: recYoga || undefined,
      drugs: recDrugs || undefined,
      investigations: recInvestigations || undefined,
      procedures: recProcedures || undefined
    }
  });

  useImperativeHandle(ref, () => ({
    getSubmissionData
  }));

  return (
    <div className="space-y-6">
      {/* 1. Patient Profile */}
      <SectionCard title="1. Patient Profile" subtitle="Master registry demographics and baseline comorbidities">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
          <div className="p-3 bg-white border border-slate-100 rounded-lg">
            <span className="text-slate-400 font-semibold uppercase block">Patient Name</span>
            <span className="text-slate-800 font-bold block mt-1">{patient.name}</span>
          </div>
          <div className="p-3 bg-white border border-slate-100 rounded-lg">
            <span className="text-slate-400 font-semibold uppercase block">MR Number</span>
            <span className="text-slate-800 font-bold block mt-1">{patient.mrNo}</span>
          </div>
          <div className="p-3 bg-white border border-slate-100 rounded-lg">
            <span className="text-slate-400 font-semibold uppercase block">Age / Gender</span>
            <span className="text-slate-800 font-bold block mt-1">{patientAge ?? '—'} years / {patient.gender}</span>
          </div>
          <div className="p-3 bg-white border border-slate-100 rounded-lg">
            <span className="text-slate-400 font-semibold uppercase block">Date of Birth</span>
            <span className="text-slate-800 font-bold block mt-1">{patient.dob || 'N/A'}</span>
          </div>
          <div className="p-3 bg-white border border-slate-100 rounded-lg">
            <span className="text-slate-400 font-semibold uppercase block">Primary Consultant</span>
            <span className="text-slate-800 font-bold block mt-1">{patient.primaryConsultant || 'N/A'}</span>
          </div>
        </div>

        {/* Extra demographics matching CARE HF assessment Word document */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
          <TextInput
            id="hf-monthly-income"
            label="Monthly Income"
            value={monthlyIncome}
            onChange={setMonthlyIncome}
            placeholder="E.g. ₹40,000"
          />
          <TextInput
            id="hf-occupation"
            label="Occupation"
            value={occupation}
            onChange={setOccupation}
            placeholder="E.g. Farmer / Retired"
          />
          <TextInput
            id="hf-caregiver-name"
            label="Caregiver Name"
            value={caregiverName}
            onChange={setCaregiverName}
            placeholder="Caregiver name"
          />
          <TextInput
            id="hf-caregiver-rel"
            label="Caregiver Relationship"
            value={caregiverRelationship}
            onChange={setCaregiverRelationship}
            placeholder="E.g. Son / Spouse"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <RadioGroup
            label="Highest Education Level"
            name="hf-education"
            value={highestEducation}
            onChange={setHighestEducation}
            options={HIGHEST_EDUCATION_OPTIONS}
            columns={3}
          />
          <RadioGroup
            label="Insurance Mode / Payment Method"
            name="hf-insurance"
            value={insuranceMode}
            onChange={setInsuranceMode}
            options={INSURANCE_OPTIONS}
            columns={2}
          />
        </div>

        <div className="flex flex-wrap gap-1.5 pt-1">
          {comorbidities.hypertension === 'Yes' && <span className="px-2 py-0.5 bg-orange-50 text-orange-700 rounded text-[10px] font-bold border border-orange-100">HTN</span>}
          {comorbidities.diabetes === 'Yes' && <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded text-[10px] font-bold border border-indigo-100">DM</span>}
          {comorbidities.renalFailure === 'Yes' && <span className="px-2 py-0.5 bg-pink-50 text-pink-700 rounded text-[10px] font-bold border border-pink-100">CKD</span>}
          {comorbidities.smoking === 'Yes' && <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded text-[10px] font-bold border border-slate-200">Smoker</span>}
        </div>
      </SectionCard>

      {/* 2. Inpatient & Visit Details */}
      <SectionCard title="2. Inpatient & Visit Details" subtitle="Encounter context and responsible clinicians">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <DateInput id="hf-date" label="Assessment Date" value={assessmentDate} onChange={setAssessmentDate} required />
          <TextInput
            id="hf-encounter-id"
            label="Encounter / IP Number"
            value={encounterId}
            onChange={setEncounterId}
            placeholder="Optional encounter reference"
          />
          <TextInput
            id="hf-ward"
            label="Ward / Unit"
            value={wardUnit}
            onChange={setWardUnit}
            placeholder="E.g. CCU / Ward 4B"
          />
          <DateInput id="hf-admission-date" label="Admission Date" value={admissionDate} onChange={setAdmissionDate} />
          <DateInput id="hf-discharge-date" label="Discharge Date" value={dischargeDate} onChange={setDischargeDate} />
          <Select
            id="hf-treating-cardiologist"
            label="Treating Cardiologist"
            value={treatingCardiologist}
            onChange={setTreatingCardiologist}
            options={CARDIOLOGISTS}
            required
          />
          <Select
            id="hf-referring-doctor"
            label="Referring Doctor"
            value={referringDoctor}
            onChange={setReferringDoctor}
            options={REFERRING_DOCTORS}
          />
        </div>
        <RadioGroup
          label="Visit Type"
          name="hf-visit-type"
          value={visitType}
          onChange={setVisitType}
          required
          columns={4}
          options={['Inpatient', 'Outpatient', 'Emergency', 'Telehealth']}
        />
      </SectionCard>

      {/* 3. Initial Clinical Assessment */}
      <SectionCard title="3. Initial Clinical Assessment" subtitle="Presentation, vitals, symptoms and baseline classification">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <NumberInput id="hf-height" label="Height (cm)" value={vHeight} onChange={setVHeight} />
          <div>
            <NumberInput
              id="hf-weight"
              label="Weight (kg)"
              disabled={vUnableToWeigh}
              value={vWeight}
              onChange={setVWeight}
              required={!vUnableToWeigh}
            />
            <label className="flex items-center gap-1.5 mt-1.5 text-xs text-slate-500 cursor-pointer">
              <input id="hf-unweight" type="checkbox" checked={vUnableToWeigh} onChange={(e) => setVUnableToWeigh(e.target.checked)} />
              Unable to weigh
            </label>
          </div>
          {vUnableToWeigh && (
            <TextInput
              id="hf-unweight-reason"
              label="Unable to Weigh Reason"
              value={vUnableToWeighReason}
              onChange={setVUnableToWeighReason}
            />
          )}
          <NumberInput id="hf-hr" label="Heart Rate (bpm)" required value={vHr} onChange={setVHr} />
          <NumberInput id="hf-rr" label="Respiratory Rate (bpm)" value={vRr} onChange={setVRr} />
          <NumberInput id="hf-o2" label="O2 Saturation (%)" max={100} value={vO2} onChange={setVO2} />
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">BP Sitting (Sys / Dia)</label>
            <div className="flex gap-2">
              <NumberInput id="hf-bp-sys" value={vBpSystolic} onChange={setVBpSystolic} placeholder="Sys" />
              <NumberInput id="hf-bp-dia" value={vBpDiastolic} onChange={setVBpDiastolic} placeholder="Dia" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">BP Standing (Sys / Dia)</label>
            <div className="flex gap-2">
              <NumberInput id="hf-bp-stand-sys" value={vBpStandingSystolic} onChange={setVBpStandingSystolic} placeholder="Sys" />
              <NumberInput id="hf-bp-stand-dia" value={vBpStandingDiastolic} onChange={setVBpStandingDiastolic} placeholder="Dia" />
            </div>
          </div>
        </div>

        {vBmi && (
          <div className="bg-teal-50 border border-teal-100 p-3 rounded-lg text-xs text-teal-800 flex items-center justify-between">
            <span>EHR Calculation Engine:</span>
            <span><strong>Patient BMI:</strong> {vBmi} (Normal is 18.5 - 24.9)</span>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <RadioGroup
            label="HR Rhythm Variability"
            name="hf-hrvar"
            value={vHrVar}
            onChange={setVHrVar}
            options={['Regular', 'Irregular']}
            required
            columns={2}
          />
          <RadioGroup
            label="Mental Status"
            name="hf-mental"
            value={vMental}
            onChange={setVMental}
            options={['Alert/Oriented', 'Confused', 'Drowsy']}
            required
            columns={3}
          />
        </div>

        <CheckboxGroup label="Present Symptoms" options={SYMPTOM_OPTIONS} values={selectedSymptoms} onChange={setSelectedSymptoms} columns={3} />
        <CheckboxGroup label="Volume Overload Signs" options={VOLUME_OVERLOAD_OPTIONS} values={selectedVolumeOverload} onChange={setSelectedVolumeOverload} columns={3} />
        <CheckboxGroup label="Medical History" options={MEDICAL_HISTORY_OPTIONS} values={medicalHistory} onChange={setMedicalHistory} columns={3} />
        <CheckboxGroup label="Risk Factors" options={RISK_FACTOR_OPTIONS} values={riskFactors} onChange={setRiskFactors} columns={3} />
        <CheckboxGroup label="Comorbidities" options={COMORBIDITY_OPTIONS} values={assessmentComorbidities} onChange={setAssessmentComorbidities} columns={3} />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <RadioGroup label="Type of Heart Failure" name="hf-type" value={hfType} onChange={setHfType} required columns={2} options={['HFrEF', 'HFpEF', 'HFmrEF', 'Unknown']} />
          <RadioGroup label="HF Stage (ACC/AHA)" name="hf-stage" value={hfStage} onChange={setHfStage} required columns={2} options={['Stage A', 'Stage B', 'Stage C', 'Stage D']} />
          <RadioGroup label="NYHA Functional Class" name="hf-nyha" value={hfNyha} onChange={setHfNyha} required columns={2} options={['NYHA Class I', 'NYHA Class II', 'NYHA Class III', 'NYHA Class IV']} />
          <RadioGroup label="Atrial Fibrillation (AF) Status" name="hf-af" value={hfAf} onChange={setHfAf} required columns={2} options={['NSR', 'Paroxysmal', 'Persistent', 'Permanent']} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <CheckboxGroup label="HF Etiology — Cardiovascular" options={HF_ETIOLOGY_CV} values={hfEtiologyCv} onChange={setHfEtiologyCv} columns={1} />
          <CheckboxGroup label="HF Etiology — Non-Cardiac" options={HF_ETIOLOGY_NON_CV} values={hfEtiologyNonCv} onChange={setHfEtiologyNonCv} columns={1} />
          <CheckboxGroup label="HF Etiology — Pulmonary" options={HF_ETIOLOGY_PULM} values={hfEtiologyPulm} onChange={setHfEtiologyPulm} columns={1} />
        </div>

        <TextArea id="hf-initial-notes" label="Initial Clinical Notes / Diagnosis" value={initialClinicalNotes} onChange={setInitialClinicalNotes} placeholder="Document initial clinical impression and working diagnosis." rows={4} />
      </SectionCard>

      {/* 4. Final Clinical Assessment */}
      <SectionCard title="4. Final Clinical Assessment" subtitle="Discharge or end-of-visit classification and outcomes">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <RadioGroup label="Final Type of HF" name="hf-final-type" value={finalHfType} onChange={setFinalHfType} columns={2} options={['HFrEF', 'HFpEF', 'HFmrEF', 'Unknown']} />
          <RadioGroup label="Final HF Stage (ACC/AHA)" name="hf-final-stage" value={finalStage} onChange={setFinalStage} columns={2} options={['Stage A', 'Stage B', 'Stage C', 'Stage D']} />
          <RadioGroup label="Final NYHA Class" name="hf-final-nyha" value={finalNyha} onChange={setFinalNyha} required columns={2} options={['NYHA Class I', 'NYHA Class II', 'NYHA Class III', 'NYHA Class IV']} />
        </div>

        <CheckboxGroup label="MACE (Major Adverse Cardiovascular Events)" options={MACE_OPTIONS} values={maceEvents} onChange={setMaceEvents} columns={3} />

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          <label className="flex items-center gap-2 p-2.5 bg-white rounded-lg border border-slate-200 cursor-pointer">
            <input type="checkbox" checked={hfRiskVtvf} onChange={(e) => setHfRiskVtvf(e.target.checked)} />
            <span className="font-medium text-slate-700">Documented VT / VF</span>
          </label>
          <label className="flex items-center gap-2 p-2.5 bg-white rounded-lg border border-slate-200 cursor-pointer">
            <input type="checkbox" checked={hfRiskSyncope} onChange={(e) => setHfRiskSyncope(e.target.checked)} />
            <span className="font-medium text-slate-700">Recurrent Syncope</span>
          </label>
          <label className="flex items-center gap-2 p-2.5 bg-white rounded-lg border border-slate-200 cursor-pointer">
            <input type="checkbox" checked={hfRiskNsvt} onChange={(e) => setHfRiskNsvt(e.target.checked)} />
            <span className="font-medium text-slate-700">Documented NSVT</span>
          </label>
          <div className="p-2.5 bg-white rounded-lg border border-slate-200 space-y-1.5">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={hfRiskPvcs} onChange={(e) => setHfRiskPvcs(e.target.checked)} />
              <span className="font-medium text-slate-700">Documented PVCs</span>
            </label>
            {hfRiskPvcs && (
              <NumberInput id="hf-risk-pvc-count" value={hfRiskPvcCount} onChange={setHfRiskPvcCount} placeholder="PVC Count" />
            )}
          </div>
        </div>

        <TextArea id="hf-final-notes" label="Final Clinical Notes / Summary" value={finalClinicalNotes} onChange={setFinalClinicalNotes} placeholder="Document final assessment, response to therapy and discharge summary." rows={4} />
      </SectionCard>

      {/* 5. Investigations */}
      <SectionCard title="5. Investigations" subtitle="Diagnostic tests ordered or reviewed during this encounter">
        <CheckboxGroup label="Investigations Performed / Ordered" options={INVESTIGATION_OPTIONS} values={selectedInvestigations} onChange={setSelectedInvestigations} columns={3} />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <NumberInput id="hf-ecg-hr" label="ECG Heart Rate (bpm)" value={ecgHr} onChange={setEcgHr} />
          <NumberInput id="hf-echo-ef" label="Echo EF (%)" value={echoEf} onChange={setEchoEf} />
          <NumberInput id="hf-bnp" label="BNP / NT-proBNP" value={bnpValue} onChange={setBnpValue} />
          <NumberInput id="hf-creatinine" label="Serum Creatinine (mg/dL)" step={0.01} value={creatinineValue} onChange={setCreatinineValue} />
          <NumberInput id="hf-potassium" label="Serum Potassium (mEq/L)" step={0.01} value={potassiumValue} onChange={setPotassiumValue} />
        </div>
        <TextArea id="hf-investigation-notes" label="Investigation Notes" value={investigationNotes} onChange={setInvestigationNotes} placeholder="Summarize key investigation findings." rows={3} />
      </SectionCard>

      {/* 6. Medical Therapy (Dose & Frequency) */}
      <SectionCard title="6. Medical Therapy (Dose & Frequency)" subtitle="Guideline-directed medical therapy with dosing details">
        <DrugTable value={drugRows} onChange={setDrugRows} />
        <CheckboxGroup label="Drug Contraindications / Intolerances" options={CONTRAINDICATION_OPTIONS} values={drugContraindications} onChange={setDrugContraindications} columns={2} />
      </SectionCard>

      {/* 7. Device Therapy */}
      <SectionCard title="7. Device Therapy" subtitle="Current implanted devices and eligibility assessment">
        <RadioGroup label="Has Implanted Device?" name="hf-dev-has" value={hfDevHas} onChange={setHfDevHas} required columns={2} options={['No', 'Yes']} />
        {hfDevHas === 'Yes' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <RadioGroup label="Current Device Type" name="hf-dev-type" value={hfDevType} onChange={setHfDevType} required columns={2} options={DEVICE_TYPES} />
            <TextInput id="hf-dev-brand" label="Device Brand / Model" value={hfDevBrand} onChange={setHfDevBrand} placeholder="E.g. Medtronic, Boston Scientific" />
          </div>
        )}
        <RadioGroup label="Device Therapy Eligible?" name="hf-dev-eligible" value={deviceEligible} onChange={setDeviceEligible} columns={2} options={['No', 'Yes']} />
        {deviceEligible === 'Yes' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <RadioGroup label="Recommended Device Type" name="hf-eligible-type" value={eligibleDeviceType} onChange={setEligibleDeviceType} columns={2} options={DEVICE_TYPES} />
            <TextInput id="hf-eligible-brand" label="Recommended Brand / Model" value={eligibleDeviceBrand} onChange={setEligibleDeviceBrand} />
            <RadioGroup label="Patient Acceptance" name="hf-dev-acceptance" value={patientAcceptance} onChange={setPatientAcceptance} columns={3} options={['Yes', 'No', 'Unknown']} />
          </div>
        )}
      </SectionCard>

      {/* 8. Patient Education */}
      <SectionCard title="8. Patient Education" subtitle="Counseling topics documented for this visit">
        <CheckboxGroup label="Education Recommended" options={EDUCATION_OPTIONS} values={educationRecommended} onChange={setEducationRecommended} columns={2} />
      </SectionCard>

      {/* 9. Recommendations */}
      <SectionCard title="9. Recommendations" subtitle="Discharge plan, follow-up and therapeutic guidance">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <TextArea id="hf-rec-fluid" label="Fluid & Diet Recommendations" value={recFluidDiet} onChange={setRecFluidDiet} placeholder="E.g. Restrict fluids to 1.5L daily. Salt < 2g/day." rows={3} />
          <TextArea id="hf-rec-exercise" label="Exercise Recommendations" value={recExercise} onChange={setRecExercise} placeholder="E.g. Gentle walking 10 minutes, as tolerated." rows={3} />
          <TextArea id="hf-rec-yoga" label="Yoga / Breathing Exercises" value={recYoga} onChange={setRecYoga} placeholder="E.g. Pranayama breathing exercise only." rows={3} />
          <TextArea id="hf-rec-drugs" label="Drug Recommendations" value={recDrugs} onChange={setRecDrugs} placeholder="Summarize medication plan and titration guidance." rows={3} />
          <TextArea id="hf-rec-investigations" label="Investigation Recommendations" value={recInvestigations} onChange={setRecInvestigations} placeholder="E.g. Repeat Creatinine and Potassium in 3 days." rows={3} />
          <TextArea id="hf-rec-procedures" label="Procedure Recommendations" value={recProcedures} onChange={setRecProcedures} placeholder="E.g. Schedule diagnostic coronary angiogram." rows={3} />
        </div>
      </SectionCard>
    </div>
  );
});

export default HFForm;
