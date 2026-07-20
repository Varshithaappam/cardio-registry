import React, { useState, forwardRef, useImperativeHandle, useMemo, useEffect } from 'react';
import api from '../../../api/axios';
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
  'Primary',
  'Secondary',
  'Graduate',
  'Post Graduate',
  'None'
];

const INSURANCE_OPTIONS = [
  'Private Insurance',
  'Government Reimbursement',
  'Arogyasree',
  'Direct '
];

const PRECIPITATING_FACTORS_OPTIONS = [
  'Myocardial ischemia',
  'Atrial fibrillation',
  'Bradyarrhythmia',
  'Ventricular tachycardia',
  'Uncontrolled hypertension',
  'Infection',
  'Renal failure',
  'Anaemia',
  'Medication non adherence',
  'Excessive salt intake',
  'Excessive water ingestion',
  'Progressive worsening'
];

const HF_ETIOLOGY_CV = [
  'Ischemic',
  'Toxic (Alcohol, Cocaine, Chemotherapeutic)',
  'Idiopathic (Dilated)',
  'Hypertrophic',
  'Restrictive (Amyloid, Sarcoid)',
  'Valvular/ Rheumatic heart disease',
  'Hypertensive',
  'Tachycardia Induced',
  'Metabolic Diseases/Hemochromatosis/Wilson’s Disease',
  'HIV and Viral Cardiomyopathy',
  'Inflammatory cardiomyopathy',
  'Reduced EF with/wo previous MI'
];

const HF_ETIOLOGY_NON_CV = [
  'Pregnancy',
  'Thyroid Disease',
  'Pheochromocytoma',
  'Chronic Renal Disease'
];

const HF_ETIOLOGY_PULM = [
  'Cor Pulmonale secondary to COPD',
  'Pulmonary Hypertension'
];

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

const COMORBIDITIES_OPTIONS = [
  'Associated CAD', 'Anemia',
  'Renal Failure', 'CVA',
  'Diabetes Mellitus', 'Severe musculoskeletal disease',
  'Hypertension', 'Cancer',
  'Valvular Disease', 'APD',
  'Asthma', 'Bleeding diathesis',
  'COPD', 'PVD',
  'OSA'
];

const RISK_FACTOR_OPTIONS = [
  'Smoking',
  'Alcohol'
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

const hf = forwardRef(function hf(
  { patientRecord, editingRecord, onCompletionChange, readOnly = false },
  ref
) {
  const patient = patientRecord?.patient || {};

  // State Management
  // 1. Patient Profile Fields
  
  const [address, setAddress] = useState(editingRecord?.patient?.address || patient.address || '');
  const [highestEducation, setHighestEducation] = useState(patient.highestEducation ?? editingRecord?.patient?.highestEducation ?? '');
  const [monthlyIncome, setMonthlyIncome] = useState(patient.monthlyIncome ?? editingRecord?.patient?.monthlyIncome ?? '');
  const [occupation, setOccupation] = useState(patient.occupation ?? editingRecord?.patient?.occupation ?? '');
  const [caregiverName, setCaregiverName] = useState(patient.caregiverName ?? editingRecord?.patient?.caregiverName ?? '');
  const [caregiverRelationship, setCaregiverRelationship] = useState(patient.caregiverRelationship ?? editingRecord?.patient?.caregiverRelationship ?? '');
  const [caregiverPhone, setCaregiverPhone] = useState(patient.caregiverPhone ?? editingRecord?.patient?.caregiverPhone ?? '');
  const [insuranceMode, setInsuranceMode] = useState(patient.insuranceMode ?? editingRecord?.patient?.insuranceMode ?? '');
  const [referredFrom, setReferredFrom] = useState(editingRecord?.patient?.referredFrom ?? '');
  const [presentDiagnosis, setPresentDiagnosis] = useState(editingRecord?.patient?.presentDiagnosis ?? '');

  // 2. Inpatient Course Metrics
  const [precipitatingFactors, setPrecipitatingFactors] = useState(editingRecord?.inpatientDetails?.precipitatingFactors ?? []);
  const [otherPrecipitatingFactor, setOtherPrecipitatingFactor] = useState(editingRecord?.inpatientDetails?.otherPrecipitatingFactor ?? '');
  const [nonHfAdmissionReason, setNonHfAdmissionReason] = useState(editingRecord?.inpatientDetails?.nonHfAdmissionReason ?? '');
  const [daysHospitalized, setDaysHospitalized] = useState(editingRecord?.inpatientDetails?.daysHospitalized ?? '');

  // Visit Info Context
  const [assessmentDate, setAssessmentDate] = useState(editingRecord?.assessmentDate ?? new Date().toISOString().split('T')[0]);
  const [visitType, setVisitType] = useState(editingRecord?.visitType ?? 'Outpatient');
  const [treatingCardiologist, setTreatingCardiologist] = useState(
    editingRecord?.inpatientDetails?.treatingCardiologist ?? patient.primaryConsultant ?? CARDIOLOGISTS[0]
  );
  const [referringDoctor, setReferringDoctor] = useState(
    editingRecord?.inpatientDetails?.referringDoctor ?? patient.referringDoctor ?? REFERRING_DOCTORS[0]
  );
  const [dischargeDate, setDischargeDate] = useState(editingRecord?.inpatientDetails?.dischargeDate ?? '');
  const [encounterId, setEncounterId] = useState(editingRecord?.inpatientDetails?.encounterId ?? editingRecord?.encounterId ?? '');

  // 3. Initial Clinical Assessment States
  const [previousDiagnosis, setPreviousDiagnosis] = useState(editingRecord?.previousDiagnosis ?? '');
  
  // Medical History Enums/Flags
  const [historyCabg, setHistoryCabg] = useState(editingRecord?.history_cabg ?? 'No');
  const [historyPtca, setHistoryPtca] = useState(editingRecord?.history_ptca ?? 'No');
  const [historyStroke, setHistoryStroke] = useState(editingRecord?.history_stroke ?? 'No');
  const [historyMajorBleed, setHistoryMajorBleed] = useState(editingRecord?.history_major_bleed ?? 'No');
  const [historyThrombolysis, setHistoryThrombolysis] = useState(editingRecord?.history_thrombolysis ?? 'No');
  const [historyPastMi, setHistoryPastMi] = useState(editingRecord?.history_past_mi ?? 'No');
  const [pastMiYearsAgo, setPastMiYearsAgo] = useState(editingRecord?.past_mi_years_ago ?? '');
  const [pastMiLocation, setPastMiLocation] = useState(editingRecord?.past_mi_location ?? '');
  const [historyOther, setHistoryOther] = useState(editingRecord?.history_other ?? '');

  // Recent Hospitalization Details
  const [previousHfHospitalization, setPreviousHfHospitalization] = useState(editingRecord?.previous_hf_hospitalization ?? 'No');
  const [recentHospitalizationDates, setRecentHospitalizationDates] = useState(editingRecord?.recent_hospitalization_dates ?? '');
  const [recentHospitalizationReasons, setRecentHospitalizationReasons] = useState(editingRecord?.recent_hospitalization_reasons ?? '');

  // VT/VF Risk Assessment Details
  const [documentedVtVf, setDocumentedVtVf] = useState(editingRecord?.documented_vt_vf ?? 'No');
  const [complaintsSyncope, setComplaintsSyncope] = useState(editingRecord?.complaints_syncope ?? 'No');
  const [syncopeFrequency, setSyncopeFrequency] = useState(editingRecord?.syncope_frequency ?? '');
  const [documentedPvcs, setDocumentedPvcs] = useState(editingRecord?.documented_pvcs ?? 'No');
  const [pvcCount, setPvcCount] = useState(editingRecord?.pvc_count ?? '');
  const [pvcFrequency, setPvcFrequency] = useState(editingRecord?.pvc_frequency ?? '');
  const [documentedNsvt, setDocumentedNsvt] = useState(editingRecord?.documented_nsvt ?? 'No');
  const [nsvtFrequency, setNsvtFrequency] = useState(editingRecord?.nsvt_frequency ?? '');

  // Vitals & Metrics
  const [vWeight, setVWeight] = useState(editingRecord?.weight ?? 70);
  const [vUnableToWeigh, setVUnableToWeigh] = useState(editingRecord?.unable_to_weigh ?? 'No');
  const [vUnableToWeighReason, setVUnableToWeighReason] = useState(editingRecord?.unable_to_weigh_reason ?? '');
  const [vHeight, setVHeight] = useState(editingRecord?.height ?? 170);
  const [vHr, setVHr] = useState(editingRecord?.heart_rate ?? 72);
  const [vHrRegular, setVHrRegular] = useState(editingRecord?.heart_rate_regular ?? 'Yes');
  const [vHrIrregular, setVHrIrregular] = useState(editingRecord?.heart_rate_irregular ?? 'No');
  const [vRr, setVRr] = useState(editingRecord?.respiratory_rate ?? 18);
  const [vO2, setVO2] = useState(editingRecord?.oxygen_saturation ?? 98);
  const [vBpSittingSystolic, setVBpSittingSystolic] = useState(editingRecord?.systolic_bp_sitting ?? 120);
  const [vBpSittingDiastolic, setVBpSittingDiastolic] = useState(editingRecord?.diastolic_bp_sitting ?? 80);
  const [vBpStandingSystolic, setVBpStandingSystolic] = useState(editingRecord?.systolic_bp_standing ?? 115);
  const [vBpStandingDiastolic, setVBpStandingDiastolic] = useState(editingRecord?.diastolic_bp_standing ?? 76);
  
  const [vMentalAlert, setVMentalAlert] = useState(editingRecord?.mental_status_alert ?? 'Yes');
  const [vMentalConfused, setVMentalConfused] = useState(editingRecord?.mental_status_confused ?? 'No');
  const [vMentalDrowsy, setVMentalDrowsy] = useState(editingRecord?.mental_status_drowsy ?? 'No');

  // Symptoms Checklist Variables (Enum 'Yes'/'No')
  const [symptomDyspneaAtRest, setSymptomDyspneaAtRest] = useState(editingRecord?.dyspnea_at_rest ?? 'No');
  const [symptomDyspneaWithExertion, setSymptomDyspneaWithExertion] = useState(editingRecord?.dyspnea_with_exertion ?? 'No');
  const [symptomFatigue, setSymptomFatigue] = useState(editingRecord?.fatigue ?? 'No');
  const [symptomOrthopnea, setSymptomOrthopnea] = useState(editingRecord?.orthopnea ?? 'No');
  const [symptomLossOfAppetite, setSymptomLossOfAppetite] = useState(editingRecord?.loss_of_appetite_bloating ?? 'No');
  const [symptomDecreasedExercise, setSymptomDecreasedExercise] = useState(editingRecord?.decreased_exercise_tolerance ?? 'No');
  const [symptomWeightGain, setSymptomWeightGain] = useState(editingRecord?.weight_gain ?? 'No');
  const [symptomWeightLoss, setSymptomWeightLoss] = useState(editingRecord?.weight_loss ?? 'No');
  const [symptomSyncope, setSymptomSyncope] = useState(editingRecord?.syncope ?? 'No');
  const [symptomPnd, setSymptomPnd] = useState(editingRecord?.pnd ?? 'No');
  const [symptomMuscleCramps, setSymptomMuscleCramps] = useState(editingRecord?.muscle_cramps ?? 'No');
  const [symptomWheeze, setSymptomWheeze] = useState(editingRecord?.wheeze ?? 'No');
  const [symptomGiddiness, setSymptomGiddiness] = useState(editingRecord?.giddiness ?? 'No');
  const [symptomOther, setSymptomOther] = useState(editingRecord?.symptom_other ?? 'No');
  const [symptomOtherDetails, setSymptomOtherDetails] = useState(editingRecord?.symptom_other_details ?? '');

  // Volume Overload Signs Checklist Variables (Enum 'Yes'/'No')
  const [signPeripheralEdema, setSignPeripheralEdema] = useState(editingRecord?.peripheral_edema ?? 'No');
  const [signRales, setSignRales] = useState(editingRecord?.rales ?? 'No');
  const [signHepatomegaly, setSignHepatomegaly] = useState(editingRecord?.hepatomegaly ?? 'No');
  const [signAscites, setSignAscites] = useState(editingRecord?.ascites ?? 'No');
  const [signJvp, setSignJvp] = useState(editingRecord?.jugular_venous_pressure ?? 'No');
  const [signClinicalOther, setSignClinicalOther] = useState(editingRecord?.clinical_sign_other ?? 'No');
  const [signClinicalOtherDetails, setSignClinicalOtherDetails] = useState(editingRecord?.clinical_sign_other_details ?? '');

  // Global Context Parameters
  const [hfType, setHfType] = useState(editingRecord?.typeOfHF ?? 'Unknown');
  const [hfStage, setHfStage] = useState(editingRecord?.stageOfHF ?? 'Stage C');
  const [hfNyha, setHfNyha] = useState(editingRecord?.nyhaClass ?? 'NYHA Class II');
  const [hfAf, setHfAf] = useState(editingRecord?.afStatus ?? 'NSR');
  const [hfEtiologyCv, setHfEtiologyCv] = useState(editingRecord?.hfEtiology?.cardiovascular ?? []);
  const [hfEtiologyNonCv, setHfEtiologyNonCv] = useState(editingRecord?.hfEtiology?.nonCardiac ?? []);
  const [hfEtiologyPulm, setHfEtiologyPulm] = useState(editingRecord?.hfEtiology?.pulmonary ?? []);

  // 4. Final Clinical Assessment States
  const [finalNyha, setFinalNyha] = useState(editingRecord?.finalAssessment?.finalNyhaClass ?? editingRecord?.nyhaClass ?? 'NYHA Class II');
  const [finalStage, setFinalStage] = useState(editingRecord?.finalAssessment?.finalStage ?? editingRecord?.stageOfHF ?? 'Stage C');
  const [finalHfType, setFinalHfType] = useState(editingRecord?.finalAssessment?.finalTypeOfHF ?? editingRecord?.typeOfHF ?? 'Unknown');
  const [maceEvents, setMaceEvents] = useState(editingRecord?.finalAssessment?.mace ?? []);
  const [finalClinicalNotes, setFinalClinicalNotes] = useState(editingRecord?.finalAssessment?.clinicalNotes ?? '');

  // New Comorbidities & Risk Factors states
    const [etiologyOther, setEtiologyOther] = useState(editingRecord?.finalAssessment?.etiologyOther ?? 'No');
  const [etiologyOtherDetails, setEtiologyOtherDetails] = useState(editingRecord?.finalAssessment?.etiologyOtherDetails ?? '');
  const [comorbidities, setComorbidities] = useState(editingRecord?.finalAssessment?.comorbidities ?? []);
  const [otherComorbidity, setOtherComorbidity] = useState(editingRecord?.finalAssessment?.otherComorbidity ?? '');
  const [riskFactors, setRiskFactors] = useState(editingRecord?.finalAssessment?.riskFactors ?? []);
  const [otherRiskFactor, setOtherRiskFactor] = useState(editingRecord?.finalAssessment?.otherRiskFactor ?? '');

  // Expanded MACE States matching the image fields exactly
  const [maceHospitalization, setMaceHospitalization] = useState(editingRecord?.finalAssessment?.maceHospitalization ?? 'No');
  const [maceStroke, setMaceStroke] = useState(editingRecord?.finalAssessment?.maceStroke ?? 'No');
  const [maceProcedures, setMaceProcedures] = useState(editingRecord?.finalAssessment?.maceProcedures ?? 'No');
  const [maceMajorBleed, setMaceMajorBleed] = useState(editingRecord?.finalAssessment?.maceMajorBleed ?? 'No');
  const [maceSevereArrhythmia, setMaceSevereArrhythmia] = useState(editingRecord?.finalAssessment?.maceSevereArrhythmia ?? 'No');
  const [maceOther, setMaceOther] = useState(editingRecord?.finalAssessment?.maceOther ?? 'No');
  const [maceOtherDetails, setMaceOtherDetails] = useState(editingRecord?.finalAssessment?.maceOtherDetails ?? '');

  // Death fields inside MACE
  const [maceDeath, setMaceDeath] = useState(editingRecord?.finalAssessment?.maceDeath ?? 'No');
  const [maceDeathDate, setMaceDeathDate] = useState(editingRecord?.finalAssessment?.maceDeathDate ?? '');
  const [maceDeathLocation, setMaceDeathLocation] = useState(editingRecord?.finalAssessment?.maceDeathLocation ?? '');
  const [maceDeathReason, setMaceDeathReason] = useState(editingRecord?.finalAssessment?.maceDeathReason ?? '');

  // 5. Investigations
  const [selectedInvestigations, setSelectedInvestigations] = useState(editingRecord?.investigations?.selected ?? []).selected || [];

  // --- Vaccinations & Blood Group States ---
  const [vacPneumococcal, setVacPneumococcal] = useState(editingRecord?.investigations?.vacPneumococcal ?? false);
  const [vacPneumococcalDate, setVacPneumococcalDate] = useState(editingRecord?.investigations?.vacPneumococcalDate ?? '');
  const [vacInfluenza, setVacInfluenza] = useState(editingRecord?.investigations?.vacInfluenza ?? false);
  const [vacInfluenzaDate, setVacInfluenzaDate] = useState(editingRecord?.investigations?.vacInfluenzaDate ?? '');
  const [bloodGroup, setBloodGroup] = useState(editingRecord?.investigations?.bloodGroup ?? '');

  // --- Lab Test State Structure ---
  
  const formatDateToView = (val) => {
    if (!val) return '';
    const dateStr = val.split('T')[0];
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      return `${parts[2]}-${parts[1]}-${parts[0]}`;
    }
    return val;
  };

  const renderInlineDate = (val, onChange, className = "border-b border-slate-300 p-0 focus:ring-0 text-xs bg-transparent") => {
    if (readOnly) {
      return <span className="text-slate-900 font-bold text-xs px-1">{formatDateToView(val) || '—'}</span>;
    }
    const formattedVal = val ? val.split('T')[0] : '';
    return (
      <input
        type="date"
        value={formattedVal}
        onChange={(e) => onChange(e.target.value)}
        className={className}
      />
    );
  };

  const [labTests, setLabTests] = useState(editingRecord?.investigations?.labTests ?? {
    potassium: { checked: false, result: '', date: '' },
    creatinine: { checked: false, result: '', date: '' },
    hb: { checked: false, result: '', date: '' },
    calcium: { checked: false, result: '', date: '' },
    bun: { checked: false, result: '', date: '' },
    glucose: { checked: false, result: '', date: '' },
    hba1c: { checked: false, result: '', date: '' },
    magnesium: { checked: false, result: '', date: '' },
    sodium: { checked: false, result: '', date: '' },
    tsh: { checked: false, result: '', date: '' },
    t3: { checked: false, result: '', date: '' },
    t4: { checked: false, result: '', date: '' },
    bnp: { checked: false, result: '', date: '' },
    ntProBnp: { checked: false, result: '', date: '' },
    ldl: { checked: false, result: '', date: '' },
    inr: { checked: false, result: '', date: '' },
    st2: { checked: false, result: '', date: '' },
    other: { checked: false, name: '', result: '', date: '' }
  });

  const handleLabChange = (key, field, value) => {
    setLabTests(prev => ({
      ...prev,
      [key]: { ...prev[key], [field]: value }
    }));
  };

  // --- Diagnostic Modality States ---
  // ECG
  const [ecgDate, setEcgDate] = useState(editingRecord?.investigations?.ecgDate ?? '');
  const [ecgQrsDuration, setEcgQrsDuration] = useState(editingRecord?.investigations?.ecgQrsDuration ?? '');
  const [ecgRhythm, setEcgRhythm] = useState(editingRecord?.investigations?.ecgRhythm ?? '');
  const [ecgRhythmOther, setEcgRhythmOther] = useState(editingRecord?.investigations?.ecgRhythmOther ?? '');
  const [ecgAvConduction, setEcgAvConduction] = useState(editingRecord?.investigations?.ecgAvConduction ?? '');
  const [ecgQWaves, setEcgQWaves] = useState(editingRecord?.investigations?.ecgQWaves ?? '');
  const [ecgQWavesLeads, setEcgQWavesLeads] = useState(editingRecord?.investigations?.ecgQWavesLeads ?? '');
  const [ecgBlockages, setEcgBlockages] = useState(editingRecord?.investigations?.ecgBlockages ?? '');
  const [ecgBlockagesOther, setEcgBlockagesOther] = useState(editingRecord?.investigations?.ecgBlockagesOther ?? '');
  const [ecgExtraBeats, setEcgExtraBeats] = useState(editingRecord?.investigations?.ecgExtraBeats ?? '');
  const [ecgQt, setEcgQt] = useState(editingRecord?.investigations?.ecgQt ?? '');
  const [ecgQtc, setEcgQtc] = useState(editingRecord?.investigations?.ecgQtc ?? '');

  // Chest X-ray
  const [cxrDate, setCxrDate] = useState(editingRecord?.investigations?.cxrDate ?? '');
  const [cxrCtRatio, setCxrCtRatio] = useState(editingRecord?.investigations?.cxrCtRatio ?? '');
  const [cxrPvh, setCxrPvh] = useState(editingRecord?.investigations?.cxrPvh ?? false);
  const [cxrPulmonaryEdema, setCxrPulmonaryEdema] = useState(editingRecord?.investigations?.cxrPulmonaryEdema ?? false);
  const [cxrPleuralEffusion, setCxrPleuralEffusion] = useState(editingRecord?.investigations?.cxrPleuralEffusion ?? false);
  const [cxrOthers, setCxrOthers] = useState(editingRecord?.investigations?.cxrOthers ?? '');

  // ECHO
  const [echoDate, setEchoDate] = useState(editingRecord?.investigations?.echoDate ?? '');
  const [echoEfPercent, setEchoEfPercent] = useState(editingRecord?.investigations?.echoEfPercent ?? '');
  const [echoEaRatio, setEchoEaRatio] = useState(editingRecord?.investigations?.echoEaRatio ?? '');
  const [echoRvTapsv, setEchoRvTapsv] = useState(editingRecord?.investigations?.echoRvTapsv ?? '');
  const [echoEePrimeRatio, setEchoEePrimeRatio] = useState(editingRecord?.investigations?.echoEePrimeRatio ?? '');
  const [echoEDecelTime, setEchoEDecelTime] = useState(editingRecord?.investigations?.echoEDecelTime ?? '');
  const [echoLaDimension, setEchoLaDimension] = useState(editingRecord?.investigations?.echoLaDimension ?? false);
  const [echoLvSystole, setEchoLvSystole] = useState(editingRecord?.investigations?.echoLvSystole ?? false);
  const [echoLvDiastole, setEchoLvDiastole] = useState(editingRecord?.investigations?.echoLvDiastole ?? false);
  const [echoMrMitralRegurg, setEchoMrMitralRegurg] = useState(editingRecord?.investigations?.echoMrMitralRegurg ?? '');
  const [echoOtherValves, setEchoOtherValves] = useState(editingRecord?.investigations?.echoOtherValves ?? '');
  const [echoRvSystolicPressure, setEchoRvSystolicPressure] = useState(editingRecord?.investigations?.echoRvSystolicPressure ?? '');
  const [echoRvFunction, setEchoRvFunction] = useState(editingRecord?.investigations?.echoRvFunction ?? '');
  const [echoRwmi, setEchoRwmi] = useState(editingRecord?.investigations?.echoRwmi ?? '');

  // Holter
  const [holterDate, setHolterDate] = useState(editingRecord?.investigations?.holterDate ?? '');
  const [holterVpcChecked, setHolterVpcChecked] = useState(editingRecord?.investigations?.holterVpcChecked ?? false);
  const [holterVentricularArrhythmia, setHolterVentricularArrhythmia] = useState(editingRecord?.investigations?.holterVentricularArrhythmia ?? '');
  const [holterAtrialArrhythmias, setHolterAtrialArrhythmias] = useState(editingRecord?.investigations?.holterAtrialArrhythmias ?? '');
  const [holterHrv, setHolterHrv] = useState(editingRecord?.investigations?.holterHrv ?? '');

  // Stress Test
  const [stressStatus, setStressStatus] = useState(editingRecord?.investigations?.stressStatus ?? '');
  const [stressDate, setStressDate] = useState(editingRecord?.investigations?.stressDate ?? '');
  const [stressMets, setStressMets] = useState(editingRecord?.investigations?.stressMets ?? '');
  const [stressTargetHr, setStressTargetHr] = useState(editingRecord?.investigations?.stressTargetHr ?? '');
  const [stressIschemicChanges, setStressIschemicChanges] = useState(editingRecord?.investigations?.stressIschemicChanges ?? '');
  const [stressArrhythmias, setStressArrhythmias] = useState(editingRecord?.investigations?.stressArrhythmias ?? '');

  // Cardiac MRI / PET / 6MWT / Anaerobic / Angiogram / Biopsy
  const [mriLvef, setMriLvef] = useState(editingRecord?.investigations?.mriLvef ?? '');
  const [mriScar, setMriScar] = useState(editingRecord?.investigations?.mriScar ?? '');
  const [mriDate, setMriDate] = useState(editingRecord?.investigations?.mriDate ?? '');
  const [petDate, setPetDate] = useState(editingRecord?.investigations?.petDate ?? '');
  const [sixMwtStatus, setSixMwtStatus] = useState(editingRecord?.investigations?.sixMwtStatus ?? '');
  const [sixMwtDate, setSixMwtDate] = useState(editingRecord?.investigations?.sixMwtDate ?? '');
  const [sixMwtDistance, setSixMwtDistance] = useState(editingRecord?.investigations?.sixMwtDistance ?? '');
  const [sixMwtHrRecovery, setSixMwtHrRecovery] = useState(editingRecord?.investigations?.sixMwtHrRecovery ?? '');
  const [sixMwtNotDoneReason, setSixMwtNotDoneReason] = useState(editingRecord?.investigations?.sixMwtNotDoneReason ?? '');
  const [anaerobicDate, setAnaerobicDate] = useState(editingRecord?.investigations?.anaerobicDate ?? '');
  const [angioStatus, setAngioStatus] = useState(editingRecord?.investigations?.angioStatus ?? '');
  const [angioDate, setAngioDate] = useState(editingRecord?.investigations?.angioDate ?? '');
  const [angioFinding, setAngioFinding] = useState(editingRecord?.investigations?.angioFinding ?? '');
  const [biopsyStatus, setBiopsyStatus] = useState(editingRecord?.investigations?.biopsyStatus ?? '');
  const [biopsyDate, setBiopsyDate] = useState(editingRecord?.investigations?.biopsyDate ?? '');

  // 6. Medical Therapy
  // Part 1: Beta Blockers, ACE Inhibitors, ARBs, Aldosterone Antagonists
  const [carvedilol, setCarvedilol] = useState(editingRecord?.medicalTherapy?.carvedilol ?? 'No');
  const [carvedilolDose, setCarvedilolDose] = useState(editingRecord?.medicalTherapy?.carvedilol_dose ?? editingRecord?.medicalTherapy?.carvedilolDose ?? '');
  const [bisoprolol, setBisoprolol] = useState(editingRecord?.medicalTherapy?.bisoprolol ?? 'No');
  const [bisoprololDose, setBisoprololDose] = useState(editingRecord?.medicalTherapy?.bisoprolol_dose ?? editingRecord?.medicalTherapy?.bisoprololDose ?? '');
  const [metoprololSuccinate, setMetoprololSuccinate] = useState(editingRecord?.medicalTherapy?.metoprolol_succinate ?? editingRecord?.medicalTherapy?.metoprololSuccinate ?? 'No');
  const [metoprololSuccinateDose, setMetoprololSuccinateDose] = useState(editingRecord?.medicalTherapy?.metoprolol_succinate_dose ?? editingRecord?.medicalTherapy?.metoprololSuccinateDose ?? '');
  const [nebivolol, setNebivolol] = useState(editingRecord?.medicalTherapy?.nebivolol ?? 'No');
  const [nebivololDose, setNebivololDose] = useState(editingRecord?.medicalTherapy?.nebivolol_dose ?? editingRecord?.medicalTherapy?.nebivololDose ?? '');
  const [betaBlockerOther, setBetaBlockerOther] = useState(editingRecord?.medicalTherapy?.beta_blocker_other ?? editingRecord?.medicalTherapy?.betaBlockerOther ?? 'No');
  const [betaBlockerOtherName, setBetaBlockerOtherName] = useState(editingRecord?.medicalTherapy?.beta_blocker_other_name ?? editingRecord?.medicalTherapy?.betaBlockerOtherName ?? '');
  const [betaBlockerOtherDose, setBetaBlockerOtherDose] = useState(editingRecord?.medicalTherapy?.beta_blocker_other_dose ?? editingRecord?.medicalTherapy?.betaBlockerOtherDose ?? '');
  const [betaNotUsedBradycardia, setBetaNotUsedBradycardia] = useState(editingRecord?.medicalTherapy?.beta_not_used_bradycardia ?? editingRecord?.medicalTherapy?.betaNotUsedBradycardia ?? 'No');
  const [betaNotUsedHeartBlocks, setBetaNotUsedHeartBlocks] = useState(editingRecord?.medicalTherapy?.beta_not_used_heart_blocks ?? editingRecord?.medicalTherapy?.betaNotUsedHeartBlocks ?? 'No');
  const [betaNotUsedCopdAsthma, setBetaNotUsedCopdAsthma] = useState(editingRecord?.medicalTherapy?.beta_not_used_copd_asthma ?? editingRecord?.medicalTherapy?.betaNotUsedCopdAsthma ?? 'No');
  const [betaNotUsedHypotension, setBetaNotUsedHypotension] = useState(editingRecord?.medicalTherapy?.beta_not_used_hypotension ?? editingRecord?.medicalTherapy?.betaNotUsedHypotension ?? 'No');
  const [betaNotUsedOther, setBetaNotUsedOther] = useState(editingRecord?.medicalTherapy?.beta_not_used_other ?? editingRecord?.medicalTherapy?.betaNotUsedOther ?? 'No');
  const [betaNotUsedOtherReason, setBetaNotUsedOtherReason] = useState(editingRecord?.medicalTherapy?.beta_not_used_other_reason ?? editingRecord?.medicalTherapy?.betaNotUsedOtherReason ?? '');

  const [enalapril, setEnalapril] = useState(editingRecord?.medicalTherapy?.enalapril ?? 'No');
  const [enalaprilDose, setEnalaprilDose] = useState(editingRecord?.medicalTherapy?.enalapril_dose ?? editingRecord?.medicalTherapy?.enalaprilDose ?? '');
  const [ramipril, setRamipril] = useState(editingRecord?.medicalTherapy?.ramipril ?? 'No');
  const [ramiprilDose, setRamiprilDose] = useState(editingRecord?.medicalTherapy?.ramipril_dose ?? editingRecord?.medicalTherapy?.ramiprilDose ?? '');
  const [lisinopril, setLisinopril] = useState(editingRecord?.medicalTherapy?.lisinopril ?? 'No');
  const [lisinoprilDose, setLisinoprilDose] = useState(editingRecord?.medicalTherapy?.lisinopril_dose ?? editingRecord?.medicalTherapy?.lisinoprilDose ?? '');
  const [perindopril, setPerindopril] = useState(editingRecord?.medicalTherapy?.perindopril ?? 'No');
  const [perindoprilDose, setPerindoprilDose] = useState(editingRecord?.medicalTherapy?.perindopril_dose ?? editingRecord?.medicalTherapy?.perindoprilDose ?? '');
  const [aceOther, setAceOther] = useState(editingRecord?.medicalTherapy?.ace_other ?? editingRecord?.medicalTherapy?.aceOther ?? 'No');
  const [aceOtherName, setAceOtherName] = useState(editingRecord?.medicalTherapy?.ace_other_name ?? editingRecord?.medicalTherapy?.aceOtherName ?? '');
  const [aceOtherDose, setAceOtherDose] = useState(editingRecord?.medicalTherapy?.ace_other_dose ?? editingRecord?.medicalTherapy?.aceOtherDose ?? '');
  const [aceNotUsedElevatedCreatinine, setAceNotUsedElevatedCreatinine] = useState(editingRecord?.medicalTherapy?.ace_not_used_elevated_creatinine ?? editingRecord?.medicalTherapy?.aceNotUsedElevatedCreatinine ?? 'No');
  const [aceNotUsedHyperkalemia, setAceNotUsedHyperkalemia] = useState(editingRecord?.medicalTherapy?.ace_not_used_hyperkalemia ?? editingRecord?.medicalTherapy?.aceNotUsedHyperkalemia ?? 'No');
  const [aceNotUsedCough, setAceNotUsedCough] = useState(editingRecord?.medicalTherapy?.ace_not_used_cough ?? editingRecord?.medicalTherapy?.aceNotUsedCough ?? 'No');
  const [aceNotUsedHypotension, setAceNotUsedHypotension] = useState(editingRecord?.medicalTherapy?.ace_not_used_hypotension ?? editingRecord?.medicalTherapy?.aceNotUsedHypotension ?? 'No');
  const [aceNotUsedOther, setAceNotUsedOther] = useState(editingRecord?.medicalTherapy?.ace_not_used_other ?? editingRecord?.medicalTherapy?.aceNotUsedOther ?? 'No');
  const [aceNotUsedOtherReason, setAceNotUsedOtherReason] = useState(editingRecord?.medicalTherapy?.ace_not_used_other_reason ?? editingRecord?.medicalTherapy?.aceNotUsedOtherReason ?? '');

  const [valsartan, setValsartan] = useState(editingRecord?.medicalTherapy?.valsartan ?? 'No');
  const [valsartanDose, setValsartanDose] = useState(editingRecord?.medicalTherapy?.valsartan_dose ?? editingRecord?.medicalTherapy?.valsartanDose ?? '');
  const [losartan, setLosartan] = useState(editingRecord?.medicalTherapy?.losartan ?? 'No');
  const [losartanDose, setLosartanDose] = useState(editingRecord?.medicalTherapy?.losartan_dose ?? editingRecord?.medicalTherapy?.losartanDose ?? '');
  const [telmisartan, setTelmisartan] = useState(editingRecord?.medicalTherapy?.telmisartan ?? 'No');
  const [telmisartanDose, setTelmisartanDose] = useState(editingRecord?.medicalTherapy?.telmisartan_dose ?? editingRecord?.medicalTherapy?.telmisartanDose ?? '');
  const [olmesartan, setOlmesartan] = useState(editingRecord?.medicalTherapy?.olmesartan ?? 'No');
  const [olmesartanDose, setOlmesartanDose] = useState(editingRecord?.medicalTherapy?.olmesartan_dose ?? editingRecord?.medicalTherapy?.olmesartanDose ?? '');
  const [arbOther, setArbOther] = useState(editingRecord?.medicalTherapy?.arb_other ?? editingRecord?.medicalTherapy?.arbOther ?? 'No');
  const [arbOtherName, setArbOtherName] = useState(editingRecord?.medicalTherapy?.arb_other_name ?? editingRecord?.medicalTherapy?.arbOtherName ?? '');
  const [arbOtherDose, setArbOtherDose] = useState(editingRecord?.medicalTherapy?.arb_other_dose ?? editingRecord?.medicalTherapy?.arbOtherDose ?? '');
  const [arbNotUsedElevatedCreatinine, setArbNotUsedElevatedCreatinine] = useState(editingRecord?.medicalTherapy?.arb_not_used_elevated_creatinine ?? editingRecord?.medicalTherapy?.arbNotUsedElevatedCreatinine ?? 'No');
  const [arbNotUsedHyperkalemia, setArbNotUsedHyperkalemia] = useState(editingRecord?.medicalTherapy?.arb_not_used_hyperkalemia ?? editingRecord?.medicalTherapy?.arbNotUsedHyperkalemia ?? 'No');
  const [arbNotUsedHypotension, setArbNotUsedHypotension] = useState(editingRecord?.medicalTherapy?.arb_not_used_hypotension ?? editingRecord?.medicalTherapy?.arbNotUsedHypotension ?? 'No');
  const [arbNotUsedOther, setArbNotUsedOther] = useState(editingRecord?.medicalTherapy?.arb_not_used_other ?? editingRecord?.medicalTherapy?.arbNotUsedOther ?? 'No');
  const [arbNotUsedOtherReason, setArbNotUsedOtherReason] = useState(editingRecord?.medicalTherapy?.arb_not_used_other_reason ?? editingRecord?.medicalTherapy?.arbNotUsedOtherReason ?? '');

  const [spironolactone, setSpironolactone] = useState(editingRecord?.medicalTherapy?.spironolactone ?? 'No');
  const [spironolactoneDose, setSpironolactoneDose] = useState(editingRecord?.medicalTherapy?.spironolactone_dose ?? editingRecord?.medicalTherapy?.spironolactoneDose ?? '');
  const [eplerenone, setEplerenone] = useState(editingRecord?.medicalTherapy?.eplerenone ?? 'No');
  const [eplerenoneDose, setEplerenoneDose] = useState(editingRecord?.medicalTherapy?.eplerenone_dose ?? editingRecord?.medicalTherapy?.eplerenoneDose ?? '');
  const [aldosteroneNotUsedHyperkalemia, setAldosteroneNotUsedHyperkalemia] = useState(editingRecord?.medicalTherapy?.aldosterone_not_used_hyperkalemia ?? editingRecord?.medicalTherapy?.aldosteroneNotUsedHyperkalemia ?? 'No');
  const [aldosteroneNotUsedHyponatremia, setAldosteroneNotUsedHyponatremia] = useState(editingRecord?.medicalTherapy?.aldosterone_not_used_hyponatremia ?? editingRecord?.medicalTherapy?.aldosteroneNotUsedHyponatremia ?? 'No');
  const [aldosteroneNotUsedElevatedCreatinine, setAldosteroneNotUsedElevatedCreatinine] = useState(editingRecord?.medicalTherapy?.aldosterone_not_used_elevated_creatinine ?? editingRecord?.medicalTherapy?.aldosteroneNotUsedElevatedCreatinine ?? 'No');
  const [aldosteroneNotUsedOther, setAldosteroneNotUsedOther] = useState(editingRecord?.medicalTherapy?.aldosterone_not_used_other ?? editingRecord?.medicalTherapy?.aldosteroneNotUsedOther ?? 'No');
  const [aldosteroneNotUsedOtherReason, setAldosteroneNotUsedOtherReason] = useState(editingRecord?.medicalTherapy?.aldosterone_not_used_other_reason ?? editingRecord?.medicalTherapy?.aldosteroneNotUsedOtherReason ?? '');

  // Part 2: Vasodilators, Anticoagulation, Antiplatelets, Antiarrhythmics, Diuretics
  const [hydralazine, setHydralazine] = useState(editingRecord?.medicalTherapy?.hydralazine ?? 'No');
  const [hydralazineName, setHydralazineName] = useState(editingRecord?.medicalTherapy?.hydralazine_name ?? editingRecord?.medicalTherapy?.hydralazineName ?? '');
  const [hydralazineDose, setHydralazineDose] = useState(editingRecord?.medicalTherapy?.hydralazine_dose ?? editingRecord?.medicalTherapy?.hydralazineDose ?? '');
  const [nitrate1, setNitrate1] = useState(editingRecord?.medicalTherapy?.nitrate_1 ?? editingRecord?.medicalTherapy?.nitrate1 ?? 'No');
  const [nitrate1Name, setNitrate1Name] = useState(editingRecord?.medicalTherapy?.nitrate_1_name ?? editingRecord?.medicalTherapy?.nitrate1Name ?? '');
  const [nitrate1Dose, setNitrate1Dose] = useState(editingRecord?.medicalTherapy?.nitrate_1_dose ?? editingRecord?.medicalTherapy?.nitrate1Dose ?? '');
  const [nitrate2, setNitrate2] = useState(editingRecord?.medicalTherapy?.nitrate_2 ?? editingRecord?.medicalTherapy?.nitrate2 ?? 'No');
  const [nitrate2Name, setNitrate2Name] = useState(editingRecord?.medicalTherapy?.nitrate_2_name ?? editingRecord?.medicalTherapy?.nitrate2Name ?? '');
  const [nitrate2Dose, setNitrate2Dose] = useState(editingRecord?.medicalTherapy?.nitrate_2_dose ?? editingRecord?.medicalTherapy?.nitrate2Dose ?? '');

  const [warfarin, setWarfarin] = useState(editingRecord?.medicalTherapy?.warfarin ?? 'No');
  const [warfarinInr, setWarfarinInr] = useState(editingRecord?.medicalTherapy?.warfarin_inr ?? editingRecord?.medicalTherapy?.warfarinInr ?? '');
  const [warfarinTargetInr, setWarfarinTargetInr] = useState(editingRecord?.medicalTherapy?.warfarin_target_inr ?? editingRecord?.medicalTherapy?.warfarinTargetInr ?? '');
  const [vitaminKInhibitor, setVitaminKInhibitor] = useState(editingRecord?.medicalTherapy?.vitamin_k_inhibitor ?? editingRecord?.medicalTherapy?.vitaminKInhibitor ?? 'No');
  const [vitaminKInhibitorName, setVitaminKInhibitorName] = useState(editingRecord?.medicalTherapy?.vitamin_k_inhibitor_name ?? editingRecord?.medicalTherapy?.vitaminKInhibitorName ?? '');
  const [vitaminKInhibitorDose, setVitaminKInhibitorDose] = useState(editingRecord?.medicalTherapy?.vitamin_k_inhibitor_dose ?? editingRecord?.medicalTherapy?.vitaminKInhibitorDose ?? '');
  const [noac, setNoac] = useState(editingRecord?.medicalTherapy?.noac ?? 'No');
  const [noacName, setNoacName] = useState(editingRecord?.medicalTherapy?.noac_name ?? editingRecord?.medicalTherapy?.noacName ?? '');
  const [noacDose, setNoacDose] = useState(editingRecord?.medicalTherapy?.noac_dose ?? editingRecord?.medicalTherapy?.noacDose ?? '');
  const [acitrom, setAcitrom] = useState(editingRecord?.medicalTherapy?.acitrom ?? 'No');
  const [acitromDose, setAcitromDose] = useState(editingRecord?.medicalTherapy?.acitrom_dose ?? editingRecord?.medicalTherapy?.acitromDose ?? '');
  const [ufh, setUfh] = useState(editingRecord?.medicalTherapy?.ufh ?? 'No');
  const [ufhDose, setUfhDose] = useState(editingRecord?.medicalTherapy?.ufh_dose ?? editingRecord?.medicalTherapy?.ufhDose ?? '');
  const [lmwh, setLmwh] = useState(editingRecord?.medicalTherapy?.lmwh ?? 'No');
  const [lmwhDose, setLmwhDose] = useState(editingRecord?.medicalTherapy?.lmwh_dose ?? editingRecord?.medicalTherapy?.lmwhDose ?? '');

  const [aspirin, setAspirin] = useState(editingRecord?.medicalTherapy?.aspirin ?? 'No');
  const [aspirinDose, setAspirinDose] = useState(editingRecord?.medicalTherapy?.aspirin_dose ?? editingRecord?.medicalTherapy?.aspirinDose ?? '');
  const [clopidogrel, setClopidogrel] = useState(editingRecord?.medicalTherapy?.clopidogrel ?? 'No');
  const [clopidogrelDose, setClopidogrelDose] = useState(editingRecord?.medicalTherapy?.clopidogrel_dose ?? editingRecord?.medicalTherapy?.clopidogrelDose ?? '');
  const [prasugrel, setPrasugrel] = useState(editingRecord?.medicalTherapy?.prasugrel ?? 'No');
  const [prasugrelDose, setPrasugrelDose] = useState(editingRecord?.medicalTherapy?.prasugrel_dose ?? editingRecord?.medicalTherapy?.prasugrelDose ?? '');
  const [ticagrelor, setTicagrelor] = useState(editingRecord?.medicalTherapy?.ticagrelor ?? 'No');
  const [ticagrelorDose, setTicagrelorDose] = useState(editingRecord?.medicalTherapy?.ticagrelor_dose ?? editingRecord?.medicalTherapy?.ticagrelorDose ?? '');

  const [amiodarone, setAmiodarone] = useState(editingRecord?.medicalTherapy?.amiodarone ?? 'No');
  const [amiodaroneDose, setAmiodaroneDose] = useState(editingRecord?.medicalTherapy?.amiodarone_dose ?? editingRecord?.medicalTherapy?.amiodaroneDose ?? '');
  const [antiarrhythmicOther, setAntiarrhythmicOther] = useState(editingRecord?.medicalTherapy?.antiarrhythmic_other ?? editingRecord?.medicalTherapy?.antiarrhythmicOther ?? 'No');
  const [antiarrhythmicOtherName, setAntiarrhythmicOtherName] = useState(editingRecord?.medicalTherapy?.antiarrhythmic_other_name ?? editingRecord?.medicalTherapy?.antiarrhythmicOtherName ?? '');
  const [antiarrhythmicOtherDose, setAntiarrhythmicOtherDose] = useState(editingRecord?.medicalTherapy?.antiarrhythmic_other_dose ?? editingRecord?.medicalTherapy?.antiarrhythmicOtherDose ?? '');

  const [furosemide, setFurosemide] = useState(editingRecord?.medicalTherapy?.furosemide ?? 'No');
  const [furosemideDose, setFurosemideDose] = useState(editingRecord?.medicalTherapy?.furosemide_dose ?? editingRecord?.medicalTherapy?.furosemideDose ?? '');
  const [torsemide, setTorsemide] = useState(editingRecord?.medicalTherapy?.torsemide ?? 'No');
  const [torsemideDose, setTorsemideDose] = useState(editingRecord?.medicalTherapy?.torsemide_dose ?? editingRecord?.medicalTherapy?.torsemideDose ?? '');
  const [metolazone, setMetolazone] = useState(editingRecord?.medicalTherapy?.metolazone ?? 'No');
  const [metolazoneDose, setMetolazoneDose] = useState(editingRecord?.medicalTherapy?.metolazone_dose ?? editingRecord?.medicalTherapy?.metolazoneDose ?? '');
  const [diureticOther, setDiureticOther] = useState(editingRecord?.medicalTherapy?.diuretic_other ?? editingRecord?.medicalTherapy?.diureticOther ?? 'No');
  const [diureticOtherName, setDiureticOtherName] = useState(editingRecord?.medicalTherapy?.diuretic_other_name ?? editingRecord?.medicalTherapy?.diureticOtherName ?? '');
  const [diureticOtherDose, setDiureticOtherDose] = useState(editingRecord?.medicalTherapy?.diuretic_other_dose ?? editingRecord?.medicalTherapy?.diureticOtherDose ?? '');
  const [diureticNotUsedHyponatremia, setDiureticNotUsedHyponatremia] = useState(editingRecord?.medicalTherapy?.diuretic_not_used_hyponatremia ?? editingRecord?.medicalTherapy?.diureticNotUsedHyponatremia ?? 'No');
  const [diureticNotUsedHypokalemia, setDiureticNotUsedHypokalemia] = useState(editingRecord?.medicalTherapy?.diuretic_not_used_hypokalemia ?? editingRecord?.medicalTherapy?.diureticNotUsedHypokalemia ?? 'No');
  const [diureticNotUsedWorseningRenalFailure, setDiureticNotUsedWorseningRenalFailure] = useState(editingRecord?.medicalTherapy?.diuretic_not_used_worsening_renal_failure ?? editingRecord?.medicalTherapy?.diureticNotUsedWorseningRenalFailure ?? 'No');
  const [diureticNotUsedHypotension, setDiureticNotUsedHypotension] = useState(editingRecord?.medicalTherapy?.diuretic_not_used_hypotension ?? editingRecord?.medicalTherapy?.diureticNotUsedHypotension ?? 'No');
  const [diureticNotUsedOther, setDiureticNotUsedOther] = useState(editingRecord?.medicalTherapy?.diuretic_not_used_other ?? editingRecord?.medicalTherapy?.diureticNotUsedOther ?? 'No');
  const [diureticNotUsedOtherReason, setDiureticNotUsedOtherReason] = useState(editingRecord?.medicalTherapy?.diuretic_not_used_other_reason ?? editingRecord?.medicalTherapy?.diureticNotUsedOtherReason ?? '');

  // Part 3: Digoxin, Ivabradine, Statins, Diabetes, Antihypertensive, Thyroxine, Others
  const [digoxin, setDigoxin] = useState(editingRecord?.medicalTherapy?.digoxin ?? 'No');
  const [digoxinName, setDigoxinName] = useState(editingRecord?.medicalTherapy?.digoxin_name ?? editingRecord?.medicalTherapy?.digoxinName ?? '');
  const [digoxinDose, setDigoxinDose] = useState(editingRecord?.medicalTherapy?.digoxin_dose ?? editingRecord?.medicalTherapy?.digoxinDose ?? '');
  const [ivabradine, setIvabradine] = useState(editingRecord?.medicalTherapy?.ivabradine ?? 'No');
  const [ivabradineDose, setIvabradineDose] = useState(editingRecord?.medicalTherapy?.ivabradine_dose ?? editingRecord?.medicalTherapy?.ivabradineDose ?? '');
  const [atorvastatin, setAtorvastatin] = useState(editingRecord?.medicalTherapy?.atorvastatin ?? 'No');
  const [atorvastatinDose, setAtorvastatinDose] = useState(editingRecord?.medicalTherapy?.atorvastatin_dose ?? editingRecord?.medicalTherapy?.atorvastatinDose ?? '');
  const [simvastatin, setSimvastatin] = useState(editingRecord?.medicalTherapy?.simvastatin ?? 'No');
  const [simvastatinDose, setSimvastatinDose] = useState(editingRecord?.medicalTherapy?.simvastatin_dose ?? editingRecord?.medicalTherapy?.simvastatinDose ?? '');
  const [rosuvastatin, setRosuvastatin] = useState(editingRecord?.medicalTherapy?.rosuvastatin ?? 'No');
  const [rosuvastatinDose, setRosuvastatinDose] = useState(editingRecord?.medicalTherapy?.rosuvastatin_dose ?? editingRecord?.medicalTherapy?.rosuvastatinDose ?? '');
  const [sulfonylureas, setSulfonylureas] = useState(editingRecord?.medicalTherapy?.sulfonylureas ?? 'No');
  const [sulfonylureasDose, setSulfonylureasDose] = useState(editingRecord?.medicalTherapy?.sulfonylureas_dose ?? editingRecord?.medicalTherapy?.sulfonylureasDose ?? '');
  const [metformin, setMetformin] = useState(editingRecord?.medicalTherapy?.metformin ?? 'No');
  const [metforminDose, setMetforminDose] = useState(editingRecord?.medicalTherapy?.metformin_dose ?? editingRecord?.medicalTherapy?.metforminDose ?? '');
  const [glitazone, setGlitazone] = useState(editingRecord?.medicalTherapy?.glitazone ?? 'No');
  const [glitazoneDose, setGlitazoneDose] = useState(editingRecord?.medicalTherapy?.glitazone_dose ?? editingRecord?.medicalTherapy?.glitazoneDose ?? '');
  const [gliptin, setGliptin] = useState(editingRecord?.medicalTherapy?.gliptin ?? 'No');
  const [gliptinDose, setGliptinDose] = useState(editingRecord?.medicalTherapy?.gliptin_dose ?? editingRecord?.medicalTherapy?.gliptinDose ?? '');
  const [acarboseDerivative, setAcarboseDerivative] = useState(editingRecord?.medicalTherapy?.acarbose_derivative ?? editingRecord?.medicalTherapy?.acarboseDerivative ?? 'No');
  const [acarboseDerivativeDose, setAcarboseDerivativeDose] = useState(editingRecord?.medicalTherapy?.acarbose_derivative_dose ?? editingRecord?.medicalTherapy?.acarboseDerivativeDose ?? '');
  const [humanInsulin, setHumanInsulin] = useState(editingRecord?.medicalTherapy?.human_insulin ?? editingRecord?.medicalTherapy?.humanInsulin ?? 'No');
  const [humanInsulinDose, setHumanInsulinDose] = useState(editingRecord?.medicalTherapy?.human_insulin_dose ?? editingRecord?.medicalTherapy?.humanInsulinDose ?? '');
  const [syntheticInsulin, setSyntheticInsulin] = useState(editingRecord?.medicalTherapy?.synthetic_insulin ?? editingRecord?.medicalTherapy?.syntheticInsulin ?? 'No');
  const [syntheticInsulinDose, setSyntheticInsulinDose] = useState(editingRecord?.medicalTherapy?.synthetic_insulin_dose ?? editingRecord?.medicalTherapy?.syntheticInsulinDose ?? '');
  const [antihypertensive, setAntihypertensive] = useState(editingRecord?.medicalTherapy?.antihypertensive ?? 'No');
  const [antihypertensiveName, setAntihypertensiveName] = useState(editingRecord?.medicalTherapy?.antihypertensive_name ?? editingRecord?.medicalTherapy?.antihypertensiveName ?? '');
  const [antihypertensiveDose, setAntihypertensiveDose] = useState(editingRecord?.medicalTherapy?.antihypertensive_dose ?? editingRecord?.medicalTherapy?.antihypertensiveDose ?? '');
  const [thyroxine, setThyroxine] = useState(editingRecord?.medicalTherapy?.thyroxine ?? 'No');
  const [thyroxineDose, setThyroxineDose] = useState(editingRecord?.medicalTherapy?.thyroxine_dose ?? editingRecord?.medicalTherapy?.thyroxineDose ?? '');

  const [otherMedication1, setOtherMedication1] = useState(editingRecord?.medicalTherapy?.other_medication_1 ?? editingRecord?.medicalTherapy?.otherMedication1 ?? 'No');
  const [otherMedication1Name, setOtherMedication1Name] = useState(editingRecord?.medicalTherapy?.other_medication_1_name ?? editingRecord?.medicalTherapy?.otherMedication1Name ?? '');
  const [otherMedication1Dose, setOtherMedication1Dose] = useState(editingRecord?.medicalTherapy?.other_medication_1_dose ?? editingRecord?.medicalTherapy?.otherMedication1Dose ?? '');
  const [otherMedication2, setOtherMedication2] = useState(editingRecord?.medicalTherapy?.other_medication_2 ?? editingRecord?.medicalTherapy?.otherMedication2 ?? 'No');
  const [otherMedication2Name, setOtherMedication2Name] = useState(editingRecord?.medicalTherapy?.other_medication_2_name ?? editingRecord?.medicalTherapy?.otherMedication2Name ?? '');
  const [otherMedication2Dose, setOtherMedication2Dose] = useState(editingRecord?.medicalTherapy?.other_medication_2_dose ?? editingRecord?.medicalTherapy?.otherMedication2Dose ?? '');
  const [otherMedication3, setOtherMedication3] = useState(editingRecord?.medicalTherapy?.other_medication_3 ?? editingRecord?.medicalTherapy?.otherMedication3 ?? 'No');
  const [otherMedication3Name, setOtherMedication3Name] = useState(editingRecord?.medicalTherapy?.other_medication_3_name ?? editingRecord?.medicalTherapy?.otherMedication3Name ?? '');
  const [otherMedication3Dose, setOtherMedication3Dose] = useState(editingRecord?.medicalTherapy?.other_medication_3_dose ?? editingRecord?.medicalTherapy?.otherMedication3Dose ?? '');
  const [otherMedication4, setOtherMedication4] = useState(editingRecord?.medicalTherapy?.other_medication_4 ?? editingRecord?.medicalTherapy?.otherMedication4 ?? 'No');
  const [otherMedication4Name, setOtherMedication4Name] = useState(editingRecord?.medicalTherapy?.other_medication_4_name ?? editingRecord?.medicalTherapy?.otherMedication4Name ?? '');
  const [otherMedication4Dose, setOtherMedication4Dose] = useState(editingRecord?.medicalTherapy?.other_medication_4_dose ?? editingRecord?.medicalTherapy?.otherMedication4Dose ?? '');

  const [recommendedConsults, setRecommendedConsults] = useState(editingRecord?.medicalTherapy?.recommended_consults ?? editingRecord?.medicalTherapy?.recommendedConsults ?? '');
  const [drugIntoleranceContraindications, setDrugIntoleranceContraindications] = useState(editingRecord?.medicalTherapy?.drug_intolerance_contraindications ?? editingRecord?.medicalTherapy?.drugIntoleranceContraindications ?? '');

  // 7. Device Therapy States
  const [currentDeviceNone, setCurrentDeviceNone] = useState(() => {
    if (editingRecord?.deviceTherapy?.current_device_none) return editingRecord.deviceTherapy.current_device_none;
    const hasDev = editingRecord?.currentDeviceTherapy?.hasDevice ?? editingRecord?.currentDeviceTherapy?.has_device;
    return hasDev === 'No' ? 'Yes' : 'No';
  });

  const [currentDeviceYes, setCurrentDeviceYes] = useState(() => {
    if (editingRecord?.deviceTherapy?.current_device_yes) return editingRecord.deviceTherapy.current_device_yes;
    const hasDev = editingRecord?.currentDeviceTherapy?.hasDevice ?? editingRecord?.currentDeviceTherapy?.has_device;
    return hasDev === 'Yes' ? 'Yes' : 'No';
  });

  const [currentCrtP, setCurrentCrtP] = useState(() => {
    if (editingRecord?.deviceTherapy?.current_crt_p) return editingRecord.deviceTherapy.current_crt_p;
    const devType = editingRecord?.currentDeviceTherapy?.deviceType ?? editingRecord?.currentDeviceTherapy?.device_type;
    return devType === 'CRT-P' ? 'Yes' : 'No';
  });

  const [currentCrtD, setCurrentCrtD] = useState(() => {
    if (editingRecord?.deviceTherapy?.current_crt_d) return editingRecord.deviceTherapy.current_crt_d;
    const devType = editingRecord?.currentDeviceTherapy?.deviceType ?? editingRecord?.currentDeviceTherapy?.device_type;
    return devType === 'CRT-D' ? 'Yes' : 'No';
  });

  const [currentIcdSc, setCurrentIcdSc] = useState(() => {
    if (editingRecord?.deviceTherapy?.current_icd_sc) return editingRecord.deviceTherapy.current_icd_sc;
    const devType = editingRecord?.currentDeviceTherapy?.deviceType ?? editingRecord?.currentDeviceTherapy?.device_type;
    return devType === 'ICD-SC' ? 'Yes' : 'No';
  });

  const [currentIcdDc, setCurrentIcdDc] = useState(() => {
    if (editingRecord?.deviceTherapy?.current_icd_dc) return editingRecord.deviceTherapy.current_icd_dc;
    const devType = editingRecord?.currentDeviceTherapy?.deviceType ?? editingRecord?.currentDeviceTherapy?.device_type;
    return devType === 'ICD-DC' ? 'Yes' : 'No';
  });

  const [currentDualChamberPacemaker, setCurrentDualChamberPacemaker] = useState(() => {
    if (editingRecord?.deviceTherapy?.current_dual_chamber_pacemaker) return editingRecord.deviceTherapy.current_dual_chamber_pacemaker;
    const devType = editingRecord?.currentDeviceTherapy?.deviceType ?? editingRecord?.currentDeviceTherapy?.device_type;
    return devType === 'Dual Chamber Pacer Mode' || devType === 'Dual Chamber Pacemaker' ? 'Yes' : 'No';
  });

  const [currentSingleChamberPacemaker, setCurrentSingleChamberPacemaker] = useState(() => {
    if (editingRecord?.deviceTherapy?.current_single_chamber_pacemaker) return editingRecord.deviceTherapy.current_single_chamber_pacemaker;
    const devType = editingRecord?.currentDeviceTherapy?.deviceType ?? editingRecord?.currentDeviceTherapy?.device_type;
    return devType === 'Single Chamber Pacer Mode' || devType === 'Single Chamber Pacemaker' ? 'Yes' : 'No';
  });

  const [currentDeviceOther, setCurrentDeviceOther] = useState(() => {
    if (editingRecord?.deviceTherapy?.current_device_other) return editingRecord.deviceTherapy.current_device_other;
    const devType = editingRecord?.currentDeviceTherapy?.deviceType ?? editingRecord?.currentDeviceTherapy?.device_type;
    return devType === 'Other' ? 'Yes' : 'No';
  });

  const [currentDeviceOtherName, setCurrentDeviceOtherName] = useState(() => {
    if (editingRecord?.deviceTherapy?.current_device_other_name) return editingRecord.deviceTherapy.current_device_other_name;
    const devType = editingRecord?.currentDeviceTherapy?.deviceType ?? editingRecord?.currentDeviceTherapy?.device_type;
    return devType === 'Other' ? (editingRecord?.currentDeviceTherapy?.otherName ?? editingRecord?.currentDeviceTherapy?.other_name ?? '') : '';
  });

  const [currentDeviceBrand, setCurrentDeviceBrand] = useState(() => {
    return editingRecord?.deviceTherapy?.current_device_brand ?? editingRecord?.currentDeviceTherapy?.brand ?? editingRecord?.currentDeviceTherapy?.device_brand ?? '';
  });

  // Eligibility
  const [eligibleNo, setEligibleNo] = useState(() => {
    if (editingRecord?.deviceTherapy?.eligible_no) return editingRecord.deviceTherapy.eligible_no;
    const elig = editingRecord?.deviceEligibility?.eligible;
    return elig === 'No' ? 'Yes' : 'No';
  });

  const [eligibleYes, setEligibleYes] = useState(() => {
    if (editingRecord?.deviceTherapy?.eligible_yes) return editingRecord.deviceTherapy.eligible_yes;
    const elig = editingRecord?.deviceEligibility?.eligible;
    return elig === 'Yes' ? 'Yes' : 'No';
  });

  const [eligibleCrtP, setEligibleCrtP] = useState(() => {
    if (editingRecord?.deviceTherapy?.eligible_crt_p) return editingRecord.deviceTherapy.eligible_crt_p;
    const eligType = editingRecord?.deviceEligibility?.deviceType ?? editingRecord?.deviceEligibility?.device_type;
    return eligType === 'CRT-P' ? 'Yes' : 'No';
  });

  const [eligibleCrtD, setEligibleCrtD] = useState(() => {
    if (editingRecord?.deviceTherapy?.eligible_crt_d) return editingRecord.deviceTherapy.eligible_crt_d;
    const eligType = editingRecord?.deviceEligibility?.deviceType ?? editingRecord?.deviceEligibility?.device_type;
    return eligType === 'CRT-D' ? 'Yes' : 'No';
  });

  const [eligibleIcdSc, setEligibleIcdSc] = useState(() => {
    if (editingRecord?.deviceTherapy?.eligible_icd_sc) return editingRecord.deviceTherapy.eligible_icd_sc;
    const eligType = editingRecord?.deviceEligibility?.deviceType ?? editingRecord?.deviceEligibility?.device_type;
    return eligType === 'ICD-SC' ? 'Yes' : 'No';
  });

  const [eligibleIcdDc, setEligibleIcdDc] = useState(() => {
    if (editingRecord?.deviceTherapy?.eligible_icd_dc) return editingRecord.deviceTherapy.eligible_icd_dc;
    const eligType = editingRecord?.deviceEligibility?.deviceType ?? editingRecord?.deviceEligibility?.device_type;
    return eligType === 'ICD-DC' ? 'Yes' : 'No';
  });

  const [eligibleDualChamberPacemaker, setEligibleDualChamberPacemaker] = useState(() => {
    if (editingRecord?.deviceTherapy?.eligible_dual_chamber_pacemaker) return editingRecord.deviceTherapy.eligible_dual_chamber_pacemaker;
    const eligType = editingRecord?.deviceEligibility?.deviceType ?? editingRecord?.deviceEligibility?.device_type;
    return eligType === 'Dual Chamber Pacer Mode' || eligType === 'Dual Chamber Pacemaker' ? 'Yes' : 'No';
  });

  const [eligibleSingleChamberPacemaker, setEligibleSingleChamberPacemaker] = useState(() => {
    if (editingRecord?.deviceTherapy?.eligible_single_chamber_pacemaker) return editingRecord.deviceTherapy.eligible_single_chamber_pacemaker;
    const eligType = editingRecord?.deviceEligibility?.deviceType ?? editingRecord?.deviceEligibility?.device_type;
    return eligType === 'Single Chamber Pacer Mode' || eligType === 'Single Chamber Pacemaker' ? 'Yes' : 'No';
  });

  const [eligibleOther, setEligibleOther] = useState(() => {
    if (editingRecord?.deviceTherapy?.eligible_other) return editingRecord.deviceTherapy.eligible_other;
    const eligType = editingRecord?.deviceEligibility?.deviceType ?? editingRecord?.deviceEligibility?.device_type;
    return eligType === 'Other' ? 'Yes' : 'No';
  });

  const [eligibleOtherName, setEligibleOtherName] = useState(() => {
    if (editingRecord?.deviceTherapy?.eligible_other_name) return editingRecord.deviceTherapy.eligible_other_name;
    const eligType = editingRecord?.deviceEligibility?.deviceType ?? editingRecord?.deviceEligibility?.device_type;
    return eligType === 'Other' ? (editingRecord?.deviceEligibility?.otherName ?? editingRecord?.deviceEligibility?.other_name ?? '') : '';
  });

  const [eligibleDeviceBrand, setEligibleDeviceBrand] = useState(() => {
    return editingRecord?.deviceTherapy?.eligible_device_brand ?? editingRecord?.deviceEligibility?.brand ?? editingRecord?.deviceEligibility?.device_brand ?? '';
  });

  const [patientAcceptanceYes, setPatientAcceptanceYes] = useState(() => {
    if (editingRecord?.deviceTherapy?.patient_acceptance_yes) return editingRecord.deviceTherapy.patient_acceptance_yes;
    const acc = editingRecord?.deviceEligibility?.patientAcceptance ?? editingRecord?.deviceEligibility?.patient_acceptance;
    return acc === 'Yes' ? 'Yes' : 'No';
  });

  const [patientAcceptanceNo, setPatientAcceptanceNo] = useState(() => {
    if (editingRecord?.deviceTherapy?.patient_acceptance_no) return editingRecord.deviceTherapy.patient_acceptance_no;
    const acc = editingRecord?.deviceEligibility?.patientAcceptance ?? editingRecord?.deviceEligibility?.patient_acceptance;
    return acc === 'No' ? 'Yes' : 'No';
  });

  const [patientAcceptanceReason, setPatientAcceptanceReason] = useState(() => {
    return editingRecord?.deviceTherapy?.patient_acceptance_reason ?? editingRecord?.deviceEligibility?.reason ?? editingRecord?.deviceEligibility?.patient_acceptance_reason ?? '';
  });

  // Implant Date, ICD Shock, ATP, etc.
  const [implantDate, setImplantDate] = useState(() => {
    if (editingRecord?.deviceTherapy?.implant_date) {
      return editingRecord.deviceTherapy.implant_date.substring(0, 10);
    }
    return '';
  });
  const [icdShock, setIcdShock] = useState(editingRecord?.deviceTherapy?.icd_shock ?? 'No');
  const [numberOfShocks, setNumberOfShocks] = useState(editingRecord?.deviceTherapy?.number_of_shocks ?? '');
  const [appropriateShocks, setAppropriateShocks] = useState(editingRecord?.deviceTherapy?.appropriate_shocks ?? '');
  const [inappropriateShocks, setInappropriateShocks] = useState(editingRecord?.deviceTherapy?.inappropriate_shocks ?? '');
  const [causeOfShocks, setCauseOfShocks] = useState(editingRecord?.deviceTherapy?.cause_of_shocks ?? '');
  const [atp, setAtp] = useState(editingRecord?.deviceTherapy?.atp ?? 'No');
  const [atpTimes, setAtpTimes] = useState(editingRecord?.deviceTherapy?.atp_times ?? '');
  const [atpSuccessAlways, setAtpSuccessAlways] = useState(editingRecord?.deviceTherapy?.atp_success_always ?? 'No');
  const [atpSuccessMostTimes, setAtpSuccessMostTimes] = useState(editingRecord?.deviceTherapy?.atp_success_most_times ?? 'No');
  const [atpSuccessSometimes, setAtpSuccessSometimes] = useState(editingRecord?.deviceTherapy?.atp_success_sometimes ?? 'No');
  const [atpSuccessNotSuccessful, setAtpSuccessNotSuccessful] = useState(editingRecord?.deviceTherapy?.atp_success_not_successful ?? 'No');

  const [bivPacingPercent, setBivPacingPercent] = useState(editingRecord?.deviceTherapy?.biv_pacing_percent ?? '');
  const [afibBurden, setAfibBurden] = useState(editingRecord?.deviceTherapy?.afib_burden ?? '');
  const [nsvtEpisodes, setNsvtEpisodes] = useState(editingRecord?.deviceTherapy?.nsvt_episodes ?? '');
  const [svtEpisodes, setSvtEpisodes] = useState(editingRecord?.deviceTherapy?.svt_episodes ?? '');
  const [deviceVolumeAlert, setDeviceVolumeAlert] = useState(editingRecord?.deviceTherapy?.device_volume_alert ?? '');
  const [deviceNotes, setDeviceNotes] = useState(editingRecord?.deviceTherapy?.notes ?? '');

  // 8. Patient Education States
  const [eduDiet, setEduDiet] = useState(() => {
    if (editingRecord?.patientEducation?.diet_2000mg_salt_restriction) return editingRecord.patientEducation.diet_2000mg_salt_restriction;
    return editingRecord?.educationRecommended?.includes('Diet: 2000-mg salt restriction') ? 'Yes' : 'No';
  });
  const [eduExercise, setEduExercise] = useState(() => {
    if (editingRecord?.patientEducation?.exercise_activity_promoted) return editingRecord.patientEducation.exercise_activity_promoted;
    return editingRecord?.educationRecommended?.includes('Exercise/activity promoted') ? 'Yes' : 'No';
  });
  const [eduWeight, setEduWeight] = useState(() => {
    if (editingRecord?.patientEducation?.daily_weight_monitoring) return editingRecord.patientEducation.daily_weight_monitoring;
    return editingRecord?.educationRecommended?.includes('Daily weight monitoring') ? 'Yes' : 'No';
  });
  const [eduDisease, setEduDisease] = useState(() => {
    if (editingRecord?.patientEducation?.disease_process_explained) return editingRecord.patientEducation.disease_process_explained;
    return editingRecord?.educationRecommended?.includes('Disease process') ? 'Yes' : 'No';
  });
  const [eduSmoking, setEduSmoking] = useState(() => {
    if (editingRecord?.patientEducation?.smoking_cessation) return editingRecord.patientEducation.smoking_cessation;
    return editingRecord?.educationRecommended?.includes('Smoking cessation') ? 'Yes' : 'No';
  });
  const [eduAlcohol, setEduAlcohol] = useState(() => {
    if (editingRecord?.patientEducation?.alcohol_cessation) return editingRecord.patientEducation.alcohol_cessation;
    return editingRecord?.educationRecommended?.includes('Alcohol cessation') ? 'Yes' : 'No';
  });
  const [eduCompliance, setEduCompliance] = useState(() => {
    if (editingRecord?.patientEducation?.medication_compliance) return editingRecord.patientEducation.medication_compliance;
    return editingRecord?.educationRecommended?.includes('Medication compliance') ? 'Yes' : 'No';
  });
  const [eduWorsened, setEduWorsened] = useState(() => {
    if (editingRecord?.patientEducation?.worsened_symptoms_education) return editingRecord.patientEducation.worsened_symptoms_education;
    return editingRecord?.educationRecommended?.includes('What to do for worsened symptoms') ? 'Yes' : 'No';
  });
  const [eduDevice, setEduDevice] = useState(() => {
    if (editingRecord?.patientEducation?.device_therapy_education) return editingRecord.patientEducation.device_therapy_education;
    return editingRecord?.educationRecommended?.includes('Device therapy') ? 'Yes' : 'No';
  });
  const [eduOther, setEduOther] = useState(() => {
    if (editingRecord?.patientEducation?.education_other) return editingRecord.patientEducation.education_other;
    return editingRecord?.educationRecommended?.some(x => x.startsWith('Other:')) ? 'Yes' : 'No';
  });
  const [eduOtherDetails, setEduOtherDetails] = useState(() => {
    if (editingRecord?.patientEducation?.education_other_details) return editingRecord.patientEducation.education_other_details;
    const otherItem = editingRecord?.educationRecommended?.find(x => x.startsWith('Other:'));
    return otherItem ? otherItem.substring(6).trim() : '';
  });

  // 9. Recommendations States
  const [recFluidDiet, setRecFluidDiet] = useState(editingRecord?.recommendations?.fluid_and_diet ?? (editingRecord?.recommendations?.fluidAndDiet ? 'Yes' : 'No'));
  const [recFluidDietDetails, setRecFluidDietDetails] = useState(editingRecord?.recommendations?.fluid_and_diet_details ?? editingRecord?.recommendations?.fluidAndDiet ?? '');

  const [recExercise, setRecExercise] = useState(editingRecord?.recommendations?.exercise ?? (editingRecord?.recommendations?.exercise ? 'Yes' : 'No'));
  const [recExerciseDetails, setRecExerciseDetails] = useState(editingRecord?.recommendations?.exercise_details ?? editingRecord?.recommendations?.exercise ?? '');

  const [recYoga, setRecYoga] = useState(editingRecord?.recommendations?.yoga ?? (editingRecord?.recommendations?.yoga ? 'Yes' : 'No'));
  const [recYogaDetails, setRecYogaDetails] = useState(editingRecord?.recommendations?.yoga_details ?? editingRecord?.recommendations?.yoga ?? '');

  const [recSmokingCessation, setRecSmokingCessation] = useState(editingRecord?.recommendations?.smoking_cessation ?? (editingRecord?.recommendations?.smokingCessation ? 'Yes' : 'No'));
  const [recSmokingCessationDetails, setRecSmokingCessationDetails] = useState(editingRecord?.recommendations?.smoking_cessation_details ?? editingRecord?.recommendations?.smokingCessation ?? '');

  const [recStressManagement, setRecStressManagement] = useState(editingRecord?.recommendations?.stress_management ?? (editingRecord?.recommendations?.stressManagement ? 'Yes' : 'No'));
  const [recStressManagementDetails, setRecStressManagementDetails] = useState(editingRecord?.recommendations?.stress_management_details ?? editingRecord?.recommendations?.stressManagement ?? '');

  const [recDrugs, setRecDrugs] = useState(editingRecord?.recommendations?.drugs ?? (editingRecord?.recommendations?.drugs ? 'Yes' : 'No'));
  const [recDrugsDetails, setRecDrugsDetails] = useState(editingRecord?.recommendations?.drugs_details ?? editingRecord?.recommendations?.drugs ?? '');

  const [recInvestigations, setRecInvestigations] = useState(editingRecord?.recommendations?.investigations ?? (editingRecord?.recommendations?.investigations ? 'Yes' : 'No'));
  const [recInvestigationsDetails, setRecInvestigationsDetails] = useState(editingRecord?.recommendations?.investigations_details ?? editingRecord?.recommendations?.investigations ?? '');

  const [recProcedures, setRecProcedures] = useState(editingRecord?.recommendations?.procedures ?? (editingRecord?.recommendations?.procedures ? 'Yes' : 'No'));
  const [recProceduresDetails, setRecProceduresDetails] = useState(editingRecord?.recommendations?.procedures_details ?? editingRecord?.recommendations?.procedures ?? '');

  const [recOther, setRecOther] = useState(editingRecord?.recommendations?.other_recommendation ?? (editingRecord?.recommendations?.otherRecommendation ? 'Yes' : 'No'));
  const [recOtherDetails, setRecOtherDetails] = useState(editingRecord?.recommendations?.other_recommendation_details ?? editingRecord?.recommendations?.otherRecommendation ?? '');
  // Calculators
  const vBmi = useMemo(() => {
    if (vUnableToWeigh === 'No' && vWeight > 0 && vHeight > 0) {
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
    if ((vWeight > 0 && vUnableToWeigh === 'No') || vUnableToWeigh === 'Yes') filled++;
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
      caregiverPhone,
      insuranceMode,
      referredFrom,
      presentDiagnosis,
      address
    },
    inpatientDetails: {
      treatingCardiologist,
      referringDoctor,
      dischargeDate: dischargeDate || undefined,
      encounterId: encounterId || undefined,
      precipitatingFactors,
      otherPrecipitatingFactor: otherPrecipitatingFactor || undefined,
      nonHfAdmissionReason: nonHfAdmissionReason || undefined,
      daysHospitalized: daysHospitalized !== '' ? Number(daysHospitalized) : undefined
    },
    
    previous_diagnosis: previousDiagnosis || null,
    history_cabg: historyCabg === 'Yes' ? 'Yes' : 'No',
    history_ptca: historyPtca === 'Yes' ? 'Yes' : 'No',
    history_stroke: historyStroke === 'Yes' ? 'Yes' : 'No',
    history_major_bleed: historyMajorBleed === 'Yes' ? 'Yes' : 'No',
    history_thrombolysis: historyThrombolysis === 'Yes' ? 'Yes' : 'No',
    history_past_mi: historyPastMi === 'Yes' ? 'Yes' : 'No',
    past_mi_years_ago: historyPastMi === 'Yes' && pastMiYearsAgo !== '' ? Number(pastMiYearsAgo) : null,
    past_mi_location: historyPastMi === 'Yes' ? pastMiLocation : null,
    history_other: historyOther || null,
    previous_hf_hospitalization: previousHfHospitalization === 'Yes' ? 'Yes' : 'No',
    recent_hospitalization_dates: recentHospitalizationDates || null,
    recent_hospitalization_reasons: recentHospitalizationReasons || null,
    documented_vt_vf: documentedVtVf === 'Yes' ? 'Yes' : 'No',
    complaints_syncope: complaintsSyncope === 'Yes' ? 'Yes' : 'No',
    syncope_frequency: complaintsSyncope === 'Yes' ? syncopeFrequency : null,
    documented_pvcs: documentedPvcs === 'Yes' ? 'Yes' : 'No',
    pvc_count: documentedPvcs === 'Yes' && pvcCount !== '' ? Number(pvcCount) : null,
    pvc_frequency: documentedPvcs === 'Yes' ? pvcFrequency : null,
    documented_nsvt: documentedNsvt === 'Yes' ? 'Yes' : 'No',
    nsvt_frequency: documentedNsvt === 'Yes' ? nsvtFrequency : null,
    
    weight: vUnableToWeigh === 'Yes' ? null : (vWeight ? Number(vWeight) : null),
    unable_to_weigh: vUnableToWeigh === 'Yes' ? 'Yes' : 'No',
    unable_to_weigh_reason: vUnableToWeigh === 'Yes' ? vUnableToWeighReason : null,
    height: vHeight ? Number(vHeight) : null,
    bmi: vBmi ? Number(vBmi) : null,
    heart_rate: vHr ? Number(vHr) : null,
    heart_rate_regular: vHrRegular === 'Yes' ? 'Yes' : 'No',
    heart_rate_irregular: vHrIrregular === 'Yes' ? 'Yes' : 'No',
    respiratory_rate: vRr ? Number(vRr) : null,
    oxygen_saturation: vO2 ? Number(vO2) : null,
    systolic_bp_sitting: vBpSittingSystolic ? Number(vBpSittingSystolic) : null,
    diastolic_bp_sitting: vBpSittingDiastolic ? Number(vBpSittingDiastolic) : null,
    systolic_bp_standing: vBpStandingSystolic ? Number(vBpStandingSystolic) : null,
    diastolic_bp_standing: vBpStandingDiastolic ? Number(vBpStandingDiastolic) : null,
    mental_status_alert: vMentalAlert === 'Yes' ? 'Yes' : 'No',
    mental_status_confused: vMentalConfused === 'Yes' ? 'Yes' : 'No',
    mental_status_drowsy: vMentalDrowsy === 'Yes' ? 'Yes' : 'No',
    
    dyspnea_at_rest: symptomDyspneaAtRest === 'Yes' ? 'Yes' : 'No',
    dyspnea_with_exertion: symptomDyspneaWithExertion === 'Yes' ? 'Yes' : 'No',
    fatigue: symptomFatigue === 'Yes' ? 'Yes' : 'No',
    orthopnea: symptomOrthopnea === 'Yes' ? 'Yes' : 'No',
    loss_of_appetite_bloating: symptomLossOfAppetite === 'Yes' ? 'Yes' : 'No',
    decreased_exercise_tolerance: symptomDecreasedExercise === 'Yes' ? 'Yes' : 'No',
    weight_gain: symptomWeightGain === 'Yes' ? 'Yes' : 'No',
    weight_loss: symptomWeightLoss === 'Yes' ? 'Yes' : 'No',
    syncope: symptomSyncope === 'Yes' ? 'Yes' : 'No',
    pnd: symptomPnd === 'Yes' ? 'Yes' : 'No',
    muscle_cramps: symptomMuscleCramps === 'Yes' ? 'Yes' : 'No',
    wheeze: symptomWheeze === 'Yes' ? 'Yes' : 'No',
    giddiness: symptomGiddiness === 'Yes' ? 'Yes' : 'No',
    symptom_other: symptomOther === 'Yes' ? 'Yes' : 'No',
    symptom_other_details: symptomOther === 'Yes' ? symptomOtherDetails : null,
    
    peripheral_edema: signPeripheralEdema === 'Yes' ? 'Yes' : 'No',
    rales: signRales === 'Yes' ? 'Yes' : 'No',
    hepatomegaly: signHepatomegaly === 'Yes' ? 'Yes' : 'No',
    ascites: signAscites === 'Yes' ? 'Yes' : 'No',
    jugular_venous_pressure: signJvp === 'Yes' ? 'Yes' : 'No',
    clinical_sign_other: signClinicalOther === 'Yes' ? 'Yes' : 'No',
    clinical_sign_other_details: signClinicalOther === 'Yes' ? signClinicalOtherDetails : null,

    typeOfHF: finalHfType !== 'Unknown' ? finalHfType : hfType,
    hfEtiology: {
      cardiovascular: hfEtiologyCv,
      nonCardiac: hfEtiologyNonCv,
      pulmonary: hfEtiologyPulm
    },
    stageOfHF: finalStage || hfStage,
    nyhaClass: finalNyha || hfNyha,
    afStatus: hfAf,
    finalAssessment: {
      finalNyhaClass: finalNyha,
      finalStage,
      finalTypeOfHF: finalHfType,
      comorbidities,
      otherComorbidity,
      riskFactors,
      otherRiskFactor,
      etiologyOther,
      etiologyOtherDetails,
      maceHospitalization,
      maceStroke,
      maceProcedures,
      maceMajorBleed,
      maceSevereArrhythmia,
      maceOther,
      maceOtherDetails,
      maceDeath,
      maceDeathDate: maceDeath === 'Yes' ? maceDeathDate : undefined,
      maceDeathLocation: maceDeath === 'Yes' ? maceDeathLocation : undefined,
      maceDeathReason: maceDeath === 'Yes' ? maceDeathReason : undefined,
      clinicalNotes: finalClinicalNotes
    },
    investigations: {
      vacPneumococcal: vacPneumococcal ? 'Yes' : 'No',
      vacPneumococcalDate: vacPneumococcalDate || null,
      vacInfluenza: vacInfluenza ? 'Yes' : 'No',
      vacInfluenzaDate: vacInfluenzaDate || null,
      bloodGroup: bloodGroup || null,
      labTests,
      ecgDate,
      ecgQrsDuration,
      ecgRhythm,
      ecgRhythmOther,
      ecgAvConduction,
      ecgQWaves,
      ecgQWavesLeads,
      ecgBlockages,
      ecgBlockagesOther,
      ecgExtraBeats,
      ecgQt,
      ecgQtc,
      cxrDate,
      cxrCtRatio,
      cxrPvh,
      cxrPulmonaryEdema,
      cxrPleuralEffusion,
      cxrOthers,
      echoDate,
      echoEfPercent,
      echoEaRatio,
      echoRvTapsv,
      echoEePrimeRatio,
      echoEDecelTime,
      echoLaDimension,
      echoLvSystole,
      echoLvDiastole,
      echoMrMitralRegurg,
      echoOtherValves,
      echoRvSystolicPressure,
      echoRvFunction,
      echoRwmi,
      holterDate,
      holterVpcChecked,
      holterVentricularArrhythmia,
      holterAtrialArrhythmias,
      holterHrv,
      stressStatus,
      stressDate,
      stressMets,
      stressTargetHr,
      stressIschemicChanges,
      stressArrhythmias,
      mriLvef,
      mriScar,
      mriDate,
      petDate,
      sixMwtStatus,
      sixMwtDate,
      sixMwtDistance,
      sixMwtHrRecovery,
      sixMwtNotDoneReason,
      anaerobicDate,
      angioStatus,
      angioDate,
      angioFinding,
      biopsyStatus,
      biopsyDate
    },
    medicalTherapy: {
      recommended_consults: recommendedConsults || null,
      drug_intolerance_contraindications: drugIntoleranceContraindications || null,
      carvedilol: carvedilol === 'Yes' ? 'Yes' : 'No',
      carvedilol_dose: carvedilol === 'Yes' ? (carvedilolDose || null) : null,
      bisoprolol: bisoprolol === 'Yes' ? 'Yes' : 'No',
      bisoprolol_dose: bisoprolol === 'Yes' ? (bisoprololDose || null) : null,
      metoprolol_succinate: metoprololSuccinate === 'Yes' ? 'Yes' : 'No',
      metoprolol_succinate_dose: metoprololSuccinate === 'Yes' ? (metoprololSuccinateDose || null) : null,
      nebivolol: nebivolol === 'Yes' ? 'Yes' : 'No',
      nebivolol_dose: nebivolol === 'Yes' ? (nebivololDose || null) : null,
      beta_blocker_other: betaBlockerOther === 'Yes' ? 'Yes' : 'No',
      beta_blocker_other_name: betaBlockerOther === 'Yes' ? (betaBlockerOtherName || null) : null,
      beta_blocker_other_dose: betaBlockerOther === 'Yes' ? (betaBlockerOtherDose || null) : null,
      beta_not_used_bradycardia: betaNotUsedBradycardia === 'Yes' ? 'Yes' : 'No',
      beta_not_used_heart_blocks: betaNotUsedHeartBlocks === 'Yes' ? 'Yes' : 'No',
      beta_not_used_copd_asthma: betaNotUsedCopdAsthma === 'Yes' ? 'Yes' : 'No',
      beta_not_used_hypotension: betaNotUsedHypotension === 'Yes' ? 'Yes' : 'No',
      beta_not_used_other: betaNotUsedOther === 'Yes' ? 'Yes' : 'No',
      beta_not_used_other_reason: betaNotUsedOther === 'Yes' ? (betaNotUsedOtherReason || null) : null,
      enalapril: enalapril === 'Yes' ? 'Yes' : 'No',
      enalapril_dose: enalapril === 'Yes' ? (enalaprilDose || null) : null,
      ramipril: ramipril === 'Yes' ? 'Yes' : 'No',
      ramipril_dose: ramipril === 'Yes' ? (ramiprilDose || null) : null,
      lisinopril: lisinopril === 'Yes' ? 'Yes' : 'No',
      lisinopril_dose: lisinopril === 'Yes' ? (lisinoprilDose || null) : null,
      perindopril: perindopril === 'Yes' ? 'Yes' : 'No',
      perindopril_dose: perindopril === 'Yes' ? (perindoprilDose || null) : null,
      ace_other: aceOther === 'Yes' ? 'Yes' : 'No',
      ace_other_name: aceOther === 'Yes' ? (aceOtherName || null) : null,
      ace_other_dose: aceOther === 'Yes' ? (aceOtherDose || null) : null,
      ace_not_used_elevated_creatinine: aceNotUsedElevatedCreatinine === 'Yes' ? 'Yes' : 'No',
      ace_not_used_hyperkalemia: aceNotUsedHyperkalemia === 'Yes' ? 'Yes' : 'No',
      ace_not_used_cough: aceNotUsedCough === 'Yes' ? 'Yes' : 'No',
      ace_not_used_hypotension: aceNotUsedHypotension === 'Yes' ? 'Yes' : 'No',
      ace_not_used_other: aceNotUsedOther === 'Yes' ? 'Yes' : 'No',
      ace_not_used_other_reason: aceNotUsedOther === 'Yes' ? (aceNotUsedOtherReason || null) : null,
      valsartan: valsartan === 'Yes' ? 'Yes' : 'No',
      valsartan_dose: valsartan === 'Yes' ? (valsartanDose || null) : null,
      losartan: losartan === 'Yes' ? 'Yes' : 'No',
      losartan_dose: losartan === 'Yes' ? (losartanDose || null) : null,
      telmisartan: telmisartan === 'Yes' ? 'Yes' : 'No',
      telmisartan_dose: telmisartan === 'Yes' ? (telmisartanDose || null) : null,
      olmesartan: olmesartan === 'Yes' ? 'Yes' : 'No',
      olmesartan_dose: olmesartan === 'Yes' ? (olmesartanDose || null) : null,
      arb_other: arbOther === 'Yes' ? 'Yes' : 'No',
      arb_other_name: arbOther === 'Yes' ? (arbOtherName || null) : null,
      arb_other_dose: arbOther === 'Yes' ? (arbOtherDose || null) : null,
      arb_not_used_elevated_creatinine: arbNotUsedElevatedCreatinine === 'Yes' ? 'Yes' : 'No',
      arb_not_used_hyperkalemia: arbNotUsedHyperkalemia === 'Yes' ? 'Yes' : 'No',
      arb_not_used_hypotension: arbNotUsedHypotension === 'Yes' ? 'Yes' : 'No',
      arb_not_used_other: arbNotUsedOther === 'Yes' ? 'Yes' : 'No',
      arb_not_used_other_reason: arbNotUsedOther === 'Yes' ? (arbNotUsedOtherReason || null) : null,
      spironolactone: spironolactone === 'Yes' ? 'Yes' : 'No',
      spironolactone_dose: spironolactone === 'Yes' ? (spironolactoneDose || null) : null,
      eplerenone: eplerenone === 'Yes' ? 'Yes' : 'No',
      eplerenone_dose: eplerenone === 'Yes' ? (eplerenoneDose || null) : null,
      aldosterone_not_used_hyperkalemia: aldosteroneNotUsedHyperkalemia === 'Yes' ? 'Yes' : 'No',
      aldosterone_not_used_hyponatremia: aldosteroneNotUsedHyponatremia === 'Yes' ? 'Yes' : 'No',
      aldosterone_not_used_elevated_creatinine: aldosteroneNotUsedElevatedCreatinine === 'Yes' ? 'Yes' : 'No',
      aldosterone_not_used_other: aldosteroneNotUsedOther === 'Yes' ? 'Yes' : 'No',
      aldosterone_not_used_other_reason: aldosteroneNotUsedOther === 'Yes' ? (aldosteroneNotUsedOtherReason || null) : null,
      hydralazine: hydralazine === 'Yes' ? 'Yes' : 'No',
      hydralazine_name: hydralazine === 'Yes' ? (hydralazineName || null) : null,
      hydralazine_dose: hydralazine === 'Yes' ? (hydralazineDose || null) : null,
      nitrate_1: nitrate1 === 'Yes' ? 'Yes' : 'No',
      nitrate_1_name: nitrate1 === 'Yes' ? (nitrate1Name || null) : null,
      nitrate_1_dose: nitrate1 === 'Yes' ? (nitrate1Dose || null) : null,
      nitrate_2: nitrate2 === 'Yes' ? 'Yes' : 'No',
      nitrate_2_name: nitrate2 === 'Yes' ? (nitrate2Name || null) : null,
      nitrate_2_dose: nitrate2 === 'Yes' ? (nitrate2Dose || null) : null,
      warfarin: warfarin === 'Yes' ? 'Yes' : 'No',
      warfarin_inr: warfarin === 'Yes' ? (warfarinInr || null) : null,
      warfarin_target_inr: warfarin === 'Yes' ? (warfarinTargetInr || null) : null,
      vitamin_k_inhibitor: vitaminKInhibitor === 'Yes' ? 'Yes' : 'No',
      vitamin_k_inhibitor_name: vitaminKInhibitor === 'Yes' ? (vitaminKInhibitorName || null) : null,
      vitamin_k_inhibitor_dose: vitaminKInhibitor === 'Yes' ? (vitaminKInhibitorDose || null) : null,
      noac: noac === 'Yes' ? 'Yes' : 'No',
      noac_name: noac === 'Yes' ? (noacName || null) : null,
      noac_dose: noac === 'Yes' ? (noacDose || null) : null,
      acitrom: acitrom === 'Yes' ? 'Yes' : 'No',
      acitrom_dose: acitrom === 'Yes' ? (acitromDose || null) : null,
      ufh: ufh === 'Yes' ? 'Yes' : 'No',
      ufh_dose: ufh === 'Yes' ? (ufhDose || null) : null,
      lmwh: lmwh === 'Yes' ? 'Yes' : 'No',
      lmwh_dose: lmwh === 'Yes' ? (lmwhDose || null) : null,
      aspirin: aspirin === 'Yes' ? 'Yes' : 'No',
      aspirin_dose: aspirin === 'Yes' ? (aspirinDose || null) : null,
      clopidogrel: clopidogrel === 'Yes' ? 'Yes' : 'No',
      clopidogrel_dose: clopidogrel === 'Yes' ? (clopidogrelDose || null) : null,
      prasugrel: prasugrel === 'Yes' ? 'Yes' : 'No',
      prasugrel_dose: prasugrel === 'Yes' ? (prasugrelDose || null) : null,
      ticagrelor: ticagrelor === 'Yes' ? 'Yes' : 'No',
      ticagrelor_dose: ticagrelor === 'Yes' ? (ticagrelorDose || null) : null,
      amiodarone: amiodarone === 'Yes' ? 'Yes' : 'No',
      amiodarone_dose: amiodarone === 'Yes' ? (amiodaroneDose || null) : null,
      antiarrhythmic_other: antiarrhythmicOther === 'Yes' ? 'Yes' : 'No',
      antiarrhythmic_other_name: antiarrhythmicOther === 'Yes' ? (antiarrhythmicOtherName || null) : null,
      antiarrhythmic_other_dose: antiarrhythmicOther === 'Yes' ? (antiarrhythmicOtherDose || null) : null,
      furosemide: furosemide === 'Yes' ? 'Yes' : 'No',
      furosemide_dose: furosemide === 'Yes' ? (furosemideDose || null) : null,
      torsemide: torsemide === 'Yes' ? 'Yes' : 'No',
      torsemide_dose: torsemide === 'Yes' ? (torsemideDose || null) : null,
      metolazone: metolazone === 'Yes' ? 'Yes' : 'No',
      metolazone_dose: metolazone === 'Yes' ? (metolazoneDose || null) : null,
      diuretic_other: diureticOther === 'Yes' ? 'Yes' : 'No',
      diuretic_other_name: diureticOther === 'Yes' ? (diureticOtherName || null) : null,
      diuretic_other_dose: diureticOther === 'Yes' ? (diureticOtherDose || null) : null,
      diuretic_not_used_hyponatremia: diureticNotUsedHyponatremia === 'Yes' ? 'Yes' : 'No',
      diuretic_not_used_hypokalemia: diureticNotUsedHypokalemia === 'Yes' ? 'Yes' : 'No',
      diuretic_not_used_worsening_renal_failure: diureticNotUsedWorseningRenalFailure === 'Yes' ? 'Yes' : 'No',
      diuretic_not_used_hypotension: diureticNotUsedHypotension === 'Yes' ? 'Yes' : 'No',
      diuretic_not_used_other: diureticNotUsedOther === 'Yes' ? 'Yes' : 'No',
      diuretic_not_used_other_reason: diureticNotUsedOther === 'Yes' ? (diureticNotUsedOtherReason || null) : null,
      digoxin: digoxin === 'Yes' ? 'Yes' : 'No',
      digoxin_name: digoxin === 'Yes' ? (digoxinName || null) : null,
      digoxin_dose: digoxin === 'Yes' ? (digoxinDose || null) : null,
      ivabradine: ivabradine === 'Yes' ? 'Yes' : 'No',
      ivabradine_dose: ivabradine === 'Yes' ? (ivabradineDose || null) : null,
      atorvastatin: atorvastatin === 'Yes' ? 'Yes' : 'No',
      atorvastatin_dose: atorvastatin === 'Yes' ? (atorvastatinDose || null) : null,
      simvastatin: simvastatin === 'Yes' ? 'Yes' : 'No',
      simvastatin_dose: simvastatin === 'Yes' ? (simvastatinDose || null) : null,
      rosuvastatin: rosuvastatin === 'Yes' ? 'Yes' : 'No',
      rosuvastatin_dose: rosuvastatin === 'Yes' ? (rosuvastatinDose || null) : null,
      sulfonylureas: sulfonylureas === 'Yes' ? 'Yes' : 'No',
      sulfonylureas_dose: sulfonylureas === 'Yes' ? (sulfonylureasDose || null) : null,
      metformin: metformin === 'Yes' ? 'Yes' : 'No',
      metformin_dose: metformin === 'Yes' ? (metforminDose || null) : null,
      glitazone: glitazone === 'Yes' ? 'Yes' : 'No',
      glitazone_dose: glitazone === 'Yes' ? (glitazoneDose || null) : null,
      gliptin: gliptin === 'Yes' ? 'Yes' : 'No',
      gliptin_dose: gliptin === 'Yes' ? (gliptinDose || null) : null,
      acarbose_derivative: acarboseDerivative === 'Yes' ? 'Yes' : 'No',
      acarbose_derivative_dose: acarboseDerivative === 'Yes' ? (acarboseDerivativeDose || null) : null,
      human_insulin: humanInsulin === 'Yes' ? 'Yes' : 'No',
      human_insulin_dose: humanInsulin === 'Yes' ? (humanInsulinDose || null) : null,
      synthetic_insulin: syntheticInsulin === 'Yes' ? 'Yes' : 'No',
      synthetic_insulin_dose: syntheticInsulin === 'Yes' ? (syntheticInsulinDose || null) : null,
      antihypertensive: antihypertensive === 'Yes' ? 'Yes' : 'No',
      antihypertensive_name: antihypertensive === 'Yes' ? (antihypertensiveName || null) : null,
      antihypertensive_dose: antihypertensive === 'Yes' ? (antihypertensiveDose || null) : null,
      thyroxine: thyroxine === 'Yes' ? 'Yes' : 'No',
      thyroxine_dose: thyroxine === 'Yes' ? (thyroxineDose || null) : null,
      other_medication_1: otherMedication1 === 'Yes' ? 'Yes' : 'No',
      other_medication_1_name: otherMedication1 === 'Yes' ? (otherMedication1Name || null) : null,
      other_medication_1_dose: otherMedication1 === 'Yes' ? (otherMedication1Dose || null) : null,
      other_medication_2: otherMedication2 === 'Yes' ? 'Yes' : 'No',
      other_medication_2_name: otherMedication2 === 'Yes' ? (otherMedication2Name || null) : null,
      other_medication_2_dose: otherMedication2 === 'Yes' ? (otherMedication2Dose || null) : null,
      other_medication_3: otherMedication3 === 'Yes' ? 'Yes' : 'No',
      other_medication_3_name: otherMedication3 === 'Yes' ? (otherMedication3Name || null) : null,
      other_medication_3_dose: otherMedication3 === 'Yes' ? (otherMedication3Dose || null) : null,
      other_medication_4: otherMedication4 === 'Yes' ? 'Yes' : 'No',
      other_medication_4_name: otherMedication4 === 'Yes' ? (otherMedication4Name || null) : null,
      other_medication_4_dose: otherMedication4 === 'Yes' ? (otherMedication4Dose || null) : null
    },
    deviceTherapy: {
      current_device_none: currentDeviceNone === 'Yes' ? 'Yes' : 'No',
      current_device_yes: currentDeviceYes === 'Yes' ? 'Yes' : 'No',
      current_crt_p: currentCrtP === 'Yes' ? 'Yes' : 'No',
      current_crt_d: currentCrtD === 'Yes' ? 'Yes' : 'No',
      current_icd_sc: currentIcdSc === 'Yes' ? 'Yes' : 'No',
      current_icd_dc: currentIcdDc === 'Yes' ? 'Yes' : 'No',
      current_dual_chamber_pacemaker: currentDualChamberPacemaker === 'Yes' ? 'Yes' : 'No',
      current_single_chamber_pacemaker: currentSingleChamberPacemaker === 'Yes' ? 'Yes' : 'No',
      current_device_other: currentDeviceOther === 'Yes' ? 'Yes' : 'No',
      current_device_other_name: currentDeviceOther === 'Yes' ? (currentDeviceOtherName || null) : null,
      current_device_brand: currentDeviceBrand || null,
      eligible_no: eligibleNo === 'Yes' ? 'Yes' : 'No',
      eligible_yes: eligibleYes === 'Yes' ? 'Yes' : 'No',
      eligible_crt_p: eligibleCrtP === 'Yes' ? 'Yes' : 'No',
      eligible_crt_d: eligibleCrtD === 'Yes' ? 'Yes' : 'No',
      eligible_icd_sc: eligibleIcdSc === 'Yes' ? 'Yes' : 'No',
      eligible_icd_dc: eligibleIcdDc === 'Yes' ? 'Yes' : 'No',
      eligible_dual_chamber_pacemaker: eligibleDualChamberPacemaker === 'Yes' ? 'Yes' : 'No',
      eligible_single_chamber_pacemaker: eligibleSingleChamberPacemaker === 'Yes' ? 'Yes' : 'No',
      eligible_other: eligibleOther === 'Yes' ? 'Yes' : 'No',
      eligible_other_name: eligibleOther === 'Yes' ? (eligibleOtherName || null) : null,
      eligible_device_brand: eligibleDeviceBrand || null,
      patient_acceptance_yes: patientAcceptanceYes === 'Yes' ? 'Yes' : 'No',
      patient_acceptance_no: patientAcceptanceNo === 'Yes' ? 'Yes' : 'No',
      patient_acceptance_reason: patientAcceptanceNo === 'Yes' ? (patientAcceptanceReason || null) : null,
      implant_date: implantDate || null,
      icd_shock: icdShock === 'Yes' ? 'Yes' : 'No',
      number_of_shocks: icdShock === 'Yes' && numberOfShocks !== '' ? Number(numberOfShocks) : null,
      appropriate_shocks: icdShock === 'Yes' && appropriateShocks !== '' ? Number(appropriateShocks) : null,
      inappropriate_shocks: icdShock === 'Yes' && inappropriateShocks !== '' ? Number(inappropriateShocks) : null,
      cause_of_shocks: icdShock === 'Yes' ? (causeOfShocks || null) : null,
      atp: atp === 'Yes' ? 'Yes' : 'No',
      atp_times: atp === 'Yes' && atpTimes !== '' ? Number(atpTimes) : null,
      atp_success_always: atp === 'Yes' && atpSuccessAlways === 'Yes' ? 'Yes' : 'No',
      atp_success_most_times: atp === 'Yes' && atpSuccessMostTimes === 'Yes' ? 'Yes' : 'No',
      atp_success_sometimes: atp === 'Yes' && atpSuccessSometimes === 'Yes' ? 'Yes' : 'No',
      atp_success_not_successful: atp === 'Yes' && atpSuccessNotSuccessful === 'Yes' ? 'Yes' : 'No',
      biv_pacing_percent: bivPacingPercent !== '' ? Number(bivPacingPercent) : null,
      afib_burden: afibBurden || null,
      nsvt_episodes: nsvtEpisodes !== '' ? Number(nsvtEpisodes) : null,
      svt_episodes: svtEpisodes !== '' ? Number(svtEpisodes) : null,
      device_volume_alert: deviceVolumeAlert || null,
      notes: deviceNotes || null
    },
    patientEducation: {
      diet_2000mg_salt_restriction: eduDiet === 'Yes' ? 'Yes' : 'No',
      exercise_activity_promoted: eduExercise === 'Yes' ? 'Yes' : 'No',
      daily_weight_monitoring: eduWeight === 'Yes' ? 'Yes' : 'No',
      disease_process_explained: eduDisease === 'Yes' ? 'Yes' : 'No',
      smoking_cessation: eduSmoking === 'Yes' ? 'Yes' : 'No',
      alcohol_cessation: eduAlcohol === 'Yes' ? 'Yes' : 'No',
      medication_compliance: eduCompliance === 'Yes' ? 'Yes' : 'No',
      worsened_symptoms_education: eduWorsened === 'Yes' ? 'Yes' : 'No',
      device_therapy_education: eduDevice === 'Yes' ? 'Yes' : 'No',
      education_other: eduOther === 'Yes' ? 'Yes' : 'No',
      education_other_details: eduOther === 'Yes' ? (eduOtherDetails || null) : null
    },
    recommendations: {
      fluid_and_diet: recFluidDiet === 'Yes' ? 'Yes' : 'No',
      fluid_and_diet_details: recFluidDietDetails || null,
      exercise: recExercise === 'Yes' ? 'Yes' : 'No',
      exercise_details: recExerciseDetails || null,
      yoga: recYoga === 'Yes' ? 'Yes' : 'No',
      yoga_details: recYogaDetails || null,
      smoking_cessation: recSmokingCessation === 'Yes' ? 'Yes' : 'No',
      smoking_cessation_details: recSmokingCessationDetails || null,
      stress_management: recStressManagement === 'Yes' ? 'Yes' : 'No',
      stress_management_details: recStressManagementDetails || null,
      drugs: recDrugs === 'Yes' ? 'Yes' : 'No',
      drugs_details: recDrugsDetails || null,
      investigations: recInvestigations === 'Yes' ? 'Yes' : 'No',
      investigations_details: recInvestigationsDetails || null,
      procedures: recProcedures === 'Yes' ? 'Yes' : 'No',
      procedures_details: recProceduresDetails || null,
      other_recommendation: recOther === 'Yes' ? 'Yes' : 'No',
      other_recommendation_details: recOtherDetails || null
    }
  });

  const handleSubmit = async (event) => {
    if (event && event.preventDefault) event.preventDefault();
    const data = getSubmissionData();
    try {
      console.log("Submitting HF Assessment payload directly:", data);
      const response = await api.post("/hf-assessment", data);
      if (response.data && response.data.success) {
        alert("Heart Failure Assessment details saved into database successfully.");
      } else {
        alert(response.data?.message || "Failed to save Heart Failure Assessment details.");
      }
      return response.data;
    } catch (error) {
      console.error("Error saving HF Assessment:", error);
      alert(error.response?.data?.message || "Failed to save Heart Failure Assessment details.");
      throw error;
    }
  };

  useImperativeHandle(ref, () => ({
    getSubmissionData,
    handleSubmit
  }));

  return (
    <fieldset disabled={readOnly} className="contents border-none p-0 m-0">
      <div className="space-y-6">
      {/* 1. Patient Profile */}
      <SectionCard title="1. Patient Profile" subtitle="Master registry demographics and baseline comorbidities">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs">
            <span className="text-slate-400 font-semibold uppercase block">HF ID</span>
            <span className="text-slate-800 font-bold block mt-1">{editingRecord?.hf_registry_no || editingRecord?.hfRegistryNo || 'New'}</span>
          </div>
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs">
            <span className="text-slate-400 font-semibold uppercase block">CARE MR No.</span>
            <span className="text-slate-800 font-bold block mt-1">{patient.mrNo || '—'}</span>
          </div>
          <div>
            <RadioGroup readOnly={readOnly}
              label="Visit Type"
              name="hf-visit-type"
              value={visitType}
              onChange={setVisitType}
              options={['Inpatient', 'Outpatient', 'Home']}
              columns={3}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs">
            <span className="text-slate-400 font-semibold uppercase block">Patient Name</span>
            <span className="text-slate-800 font-bold block mt-1">{patient.name || '—'}</span>
          </div>
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs">
            <span className="text-slate-400 font-semibold uppercase block">Gender</span>
            <span className="text-slate-800 font-bold block mt-1">{patient.gender || '—'}</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs">
            <span className="text-slate-400 font-semibold uppercase block">Age & Date of Birth</span>
            <span className="text-slate-800 font-bold block mt-1">
              {patientAge ?? '—'} years / {patient.dob || '—'}
            </span>
          </div>
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs">
            <span className="text-slate-400 font-semibold uppercase block">Phone No.</span>
            <span className="text-slate-800 font-bold block mt-1">{patient.phone || '—'}</span>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 mb-4">
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs">
            <span className="text-slate-400 font-semibold uppercase block mb-1">Address</span>
            <textarea disabled={readOnly}
              className="w-full bg-white border border-slate-200 p-2 text-slate-800 font-medium focus:ring-0 resize-none text-xs rounded-lg"
              rows={2}
              value={address}
              onChange={(e) => setAddress(e.target.value)}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 mb-4">
          <RadioGroup readOnly={readOnly}
            label="Highest Education Level"
            name="hf-education"
            value={highestEducation}
            onChange={setHighestEducation}
            options={HIGHEST_EDUCATION_OPTIONS}
            columns={5}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <TextInput readOnly={readOnly}
            id="hf-monthly-income"
            label="Monthly Income"
            value={monthlyIncome}
            onChange={setMonthlyIncome}
            placeholder="E.g. ₹40,000"
          />
          <TextInput readOnly={readOnly}
            id="hf-occupation"
            label="Occupation"
            value={occupation}
            onChange={setOccupation}
            placeholder="E.g. Farmer / Retired"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <TextInput readOnly={readOnly}
            id="hf-caregiver-name"
            label="Caregiver Name"
            value={caregiverName}
            onChange={setCaregiverName}
            placeholder="Caregiver Name"
          />
          <TextInput readOnly={readOnly}
            id="hf-caregiver-rel"
            label="Relationship to Patient"
            value={caregiverRelationship}
            onChange={setCaregiverRelationship}
            placeholder="E.g. Son / Spouse"
          />
          <TextInput readOnly={readOnly}
            id="hf-caregiver-phone"
            label="Caregiver Phone No."
            value={caregiverPhone}
            onChange={setCaregiverPhone}
            placeholder="Caregiver Phone number"
          />
        </div>

        <div className="grid grid-cols-1 gap-4 mb-4">
          <RadioGroup readOnly={readOnly}
            label="Insurance / Payment Mode"
            name="hf-insurance"
            value={insuranceMode}
            onChange={setInsuranceMode}
            options={INSURANCE_OPTIONS}
            columns={5}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <DateInput readOnly={readOnly}
            id="hf-visit-date"
            label="Date of Visit / Hospitalization"
            value={assessmentDate}
            onChange={setAssessmentDate}
          />
          <DateInput readOnly={readOnly}
            id="hf-discharge-date"
            label="Date of Discharge"
            value={dischargeDate}
            onChange={setDischargeDate}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <Select readOnly={readOnly}
            id="hf-treating-cardiologist"
            label="Treating Cardiologist"
            value={treatingCardiologist}
            onChange={setTreatingCardiologist}
            options={CARDIOLOGISTS}
          />
          <Select readOnly={readOnly}
            id="hf-referring-doctor"
            label="Referring Doctor"
            value={referringDoctor}
            onChange={setReferringDoctor}
            options={REFERRING_DOCTORS}
          />
        </div>

        <div className="grid grid-cols-1 gap-4 mb-4">
          <TextInput readOnly={readOnly}
            id="hf-referred-from"
            label="Referred From (Department / Practice)"
            value={referredFrom}
            onChange={setReferredFrom}
            placeholder="E.g. Cardiology Department / Community Clinic"
          />
        </div>

        <div className="grid grid-cols-1 gap-4 mb-4">
          <TextArea readOnly={readOnly}
            id="hf-present-diagnosis"
            label="Present Diagnosis"
            value={presentDiagnosis}
            onChange={setPresentDiagnosis}
            placeholder="Enter active diagnoses, comorbidities, and main reasons for admission/consultation..."
            rows={4}
          />
        </div>
      </SectionCard>

      {/* 2. Inpatient Details Section */}
      <SectionCard title="2. Inpatient Details" subtitle="Precipitating factors and admission context for heart failure hospitalizations">
        <div className="space-y-4">
          <CheckboxGroup readOnly={readOnly}
            label="If admission for heart failure, please select precipitating factors for admission:"
            options={PRECIPITATING_FACTORS_OPTIONS}
            values={precipitatingFactors}
            onChange={setPrecipitatingFactors}
            columns={3}
          />

          <div className="grid grid-cols-1 gap-4">
            <TextInput readOnly={readOnly}
              id="hf-precipitating-other"
              label="Other Precipitating Factor"
              value={otherPrecipitatingFactor}
              onChange={setOtherPrecipitatingFactor}
              placeholder="Specify other precipitating factors if any"
            />
          </div>

          <hr className="border-slate-200 my-2" />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <TextInput readOnly={readOnly}
                id="hf-non-hf-reason"
                label="If admission for reasons other than heart failure, please specify reason(s):"
                value={nonHfAdmissionReason}
                onChange={setNonHfAdmissionReason}
                placeholder="E.g., Elective procedure, trauma, etc."
              />
            </div>
            <div>
              <NumberInput readOnly={readOnly}
                id="hf-days-hospitalized"
                label="No. of days hospitalized"
                value={daysHospitalized}
                onChange={setDaysHospitalized}
                placeholder="Number of days"
              />
              <span className="text-[10px] text-slate-400 block mt-1">
                Note: Update LOS & date of discharge upon receiving info.
              </span>
            </div>
          </div>
        </div>
      </SectionCard>

      {/* 3. Initial Clinical Assessment Dashboard */}
      <SectionCard title="3. Initial Clinical Assessment" subtitle="Patient background, prior hospitalizations, vitals layout and diagnostic signs">
        <div className="space-y-5">
          
          {/* Subsection: Previous Diagnosis */}
          <div className="bg-slate-50 p-4 border border-slate-200 rounded-xl">
            <TextInput readOnly={readOnly}
              id="hf-prev-diagnosis"
              label="Previous Diagnosis"
              value={previousDiagnosis}
              onChange={setPreviousDiagnosis}
              placeholder="Specify historical diagnostic parameters..."
            />
          </div>

          {/* Subsection: Medical History Layout Panel */}
          <div className="bg-slate-50 p-4 border border-slate-200 rounded-xl space-y-3">
            <span className="block text-xs font-bold text-slate-700 border-b border-slate-200 pb-1">Medical History</span>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 text-xs">
              <label className="flex items-center gap-2 p-2 bg-white rounded-lg border cursor-pointer">
                <input disabled={readOnly} type="checkbox" checked={historyCabg === 'Yes'} onChange={(e) => setHistoryCabg(e.target.checked ? 'Yes' : 'No')} />
                <span className="font-medium text-slate-700">CABG</span>
              </label>
              <label className="flex items-center gap-2 p-2 bg-white rounded-lg border cursor-pointer">
                <input disabled={readOnly} type="checkbox" checked={historyPtca === 'Yes'} onChange={(e) => setHistoryPtca(e.target.checked ? 'Yes' : 'No')} />
                <span className="font-medium text-slate-700">PTCA</span>
              </label>
              <label className="flex items-center gap-2 p-2 bg-white rounded-lg border cursor-pointer">
                <input disabled={readOnly} type="checkbox" checked={historyStroke === 'Yes'} onChange={(e) => setHistoryStroke(e.target.checked ? 'Yes' : 'No')} />
                <span className="font-medium text-slate-700">Stroke</span>
              </label>
              <label className="flex items-center gap-2 p-2 bg-white rounded-lg border cursor-pointer">
                <input disabled={readOnly} type="checkbox" checked={historyMajorBleed === 'Yes'} onChange={(e) => setHistoryMajorBleed(e.target.checked ? 'Yes' : 'No')} />
                <span className="font-medium text-slate-700">Major Bleed</span>
              </label>
              <label className="flex items-center gap-2 p-2 bg-white rounded-lg border cursor-pointer">
                <input disabled={readOnly} type="checkbox" checked={historyThrombolysis === 'Yes'} onChange={(e) => setHistoryThrombolysis(e.target.checked ? 'Yes' : 'No')} />
                <span className="font-medium text-slate-700">Thrombolysis</span>
              </label>
            </div>

            <div className="p-3 bg-white rounded-lg border border-slate-200 grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="flex items-center h-full">
                <label className="flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer">
                  <input disabled={readOnly} type="checkbox" checked={historyPastMi === 'Yes'} onChange={(e) => setHistoryPastMi(e.target.checked ? 'Yes' : 'No')} />
                  <span>Past MI</span>
                </label>
              </div>
              {historyPastMi === 'Yes' && (
                <>
                  <NumberInput readOnly={readOnly} id="hf-mi-years" label="No. of years ago" value={pastMiYearsAgo} onChange={setPastMiYearsAgo} placeholder="Years" />
                  <TextInput readOnly={readOnly} id="hf-mi-loc" label="Location of MI" value={pastMiLocation} onChange={setPastMiLocation} placeholder="Anterior / Inferior etc." />
                </>
              )}
            </div>
            <TextInput readOnly={readOnly} id="hf-history-other" label="Others (Specify separate medical histories)" value={historyOther} onChange={setHistoryOther} placeholder="E.g. Dyslipidemia, PVD" />
          </div>

          {/* Subsection: Recent Hospitalization logs */}
          <div className="bg-slate-50 p-4 border border-slate-200 rounded-xl space-y-3">
            <span className="block text-xs font-bold text-slate-700 border-b border-slate-200 pb-1">Recent Hospitalization(s)</span>
            <RadioGroup readOnly={readOnly}
              label="History of hospitalization for heart failure:"
              name="hf-history-hosp"
              value={previousHfHospitalization}
              onChange={setPreviousHfHospitalization}
              options={['Yes', 'No']}
              columns={2}
            />
            {previousHfHospitalization === 'Yes' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <TextInput readOnly={readOnly} id="hf-hosp-dates" label="Date(s)" value={recentHospitalizationDates} onChange={setRecentHospitalizationDates} placeholder="E.g. March 2026, Dec 2025" />
                <TextInput readOnly={readOnly} id="hf-hosp-reasons" label="Reason(s)" value={recentHospitalizationReasons} onChange={setRecentHospitalizationReasons} placeholder="E.g. Decompensated HF secondary to infection" />
              </div>
            )}
          </div>

          {/* Subsection: VT/VF Risk Panel */}
          <div className="bg-slate-50 p-4 border border-slate-200 rounded-xl space-y-4">
            <span className="block text-xs font-bold text-slate-700 border-b border-slate-200 pb-1">VT/VF Risk Assessment</span>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              <div className="space-y-3 bg-white p-3 rounded-lg border border-slate-200">
                <label className="flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer">
                  <input disabled={readOnly} type="checkbox" checked={documentedVtVf === 'Yes'} onChange={(e) => setDocumentedVtVf(e.target.checked ? 'Yes' : 'No')} />
                  <span>Documented episode of VT/VF</span>
                </label>
                
                <hr className="border-slate-100" />
                
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer">
                    <input disabled={readOnly} type="checkbox" checked={complaintsSyncope === 'Yes'} onChange={(e) => setComplaintsSyncope(e.target.checked ? 'Yes' : 'No')} />
                    <span>Complaints of Syncope / Pre-syncope</span>
                  </label>
                  {complaintsSyncope === 'Yes' && (
                    <TextInput readOnly={readOnly} id="hf-syncope-freq" label="Frequency of episodes" value={syncopeFrequency} onChange={setSyncopeFrequency} placeholder="E.g. Twice in last month" />
                  )}
                </div>
              </div>

              <div className="space-y-3 bg-white p-3 rounded-lg border border-slate-200">
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer">
                    <input disabled={readOnly} type="checkbox" checked={documentedPvcs === 'Yes'} onChange={(e) => setDocumentedPvcs(e.target.checked ? 'Yes' : 'No')} />
                    <span>Documented PVCs</span>
                  </label>
                  {documentedPvcs === 'Yes' && (
                    <div className="grid grid-cols-2 gap-2">
                      <NumberInput readOnly={readOnly} id="hf-pvc-count" label="Number of PVCs" value={pvcCount} onChange={setPvcCount} />
                      <TextInput readOnly={readOnly} id="hf-pvc-freq" label="Frequency / Pattern" value={pvcFrequency} onChange={setPvcFrequency} placeholder="E.g. Bigeminy" />
                    </div>
                  )}
                </div>

                <hr className="border-slate-100" />

                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer">
                    <input disabled={readOnly} type="checkbox" checked={documentedNsvt === 'Yes'} onChange={(e) => setDocumentedNsvt(e.target.checked ? 'Yes' : 'No')} />
                    <span>Documented NSVT</span>
                  </label>
                  {documentedNsvt === 'Yes' && (
                    <TextInput readOnly={readOnly} id="hf-nsvt-freq" label="Frequency of episodes" value={nsvtFrequency} onChange={setNsvtFrequency} placeholder="Runs / duration" />
                  )}
                </div>
              </div>

            </div>
          </div>

          {/* Subsection: Physical Vitals Panels */}
          <div className="bg-slate-50 p-4 border border-slate-200 rounded-xl space-y-4">
            <span className="block text-xs font-bold text-slate-700 border-b border-slate-200 pb-1">Vitals Metrics</span>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <NumberInput readOnly={readOnly} id="hf-weight" label="Weight (kg)" disabled={vUnableToWeigh === 'Yes'} value={vWeight} onChange={setVWeight} required={vUnableToWeigh === 'No'} />
                <label className="flex items-center gap-1.5 mt-1.5 text-xs text-slate-500 cursor-pointer">
                  <input disabled={readOnly} type="checkbox" checked={vUnableToWeigh === 'Yes'} onChange={(e) => setVUnableToWeigh(e.target.checked ? 'Yes' : 'No')} />
                  <span>Unable to weigh (Measure at earliest opportunity)</span>
                </label>
                {vUnableToWeigh === 'Yes' && (
                  <div className="mt-2">
                    <TextInput readOnly={readOnly} id="hf-weigh-reason" label="Specify Reason" value={vUnableToWeighReason} onChange={setVUnableToWeighReason} />
                  </div>
                )}
              </div>
              <NumberInput readOnly={readOnly} id="hf-height" label="Height (Cm)" value={vHeight} onChange={setVHeight} />
              <div className="p-3 bg-white rounded-lg border border-slate-200 flex flex-col justify-center">
                <span className="text-slate-400 font-semibold text-[10px] uppercase block">Calculated BMI</span>
                <span className="text-slate-800 font-bold text-sm block mt-0.5">{vBmi ?? '—'}</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <NumberInput readOnly={readOnly} id="hf-hr" label="Heart Rate (resting) (Bpm)" required value={vHr} onChange={setVHr} />
              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-slate-700 mb-2">Variability</label>
                <div className="grid grid-cols-2 gap-4">
                  <label className="flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer p-2 bg-white rounded-lg border">
                    <input disabled={readOnly} type="checkbox" checked={vHrRegular === 'Yes'} onChange={(e) => {
                      setVHrRegular(e.target.checked ? 'Yes' : 'No');
                      if(e.target.checked) setVHrIrregular('No');
                    }} />
                    <span>Regular</span>
                  </label>
                  <label className="flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer p-2 bg-white rounded-lg border">
                    <input disabled={readOnly} type="checkbox" checked={vHrIrregular === 'Yes'} onChange={(e) => {
                      setVHrIrregular(e.target.checked ? 'Yes' : 'No');
                      if(e.target.checked) setVHrRegular('No');
                    }} />
                    <span>Irregular</span>
                  </label>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <NumberInput readOnly={readOnly} id="hf-rr" label="Respiratory Rate" value={vRr} onChange={setVRr} />
              <NumberInput readOnly={readOnly} id="hf-o2" label="O₂ Saturation (%)" max={100} value={vO2} onChange={setVO2} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-3 bg-white rounded-lg border border-slate-200">
                <label className="block text-xs font-bold text-slate-700 mb-1">Blood Pressure: Sitting / Supine (mmHg)</label>
                <div className="flex gap-2">
                  <NumberInput readOnly={readOnly} id="hf-bps-sys" value={vBpSittingSystolic} onChange={setVBpSittingSystolic} placeholder="Sys" />
                  <span className="self-center text-slate-400">/</span>
                  <NumberInput readOnly={readOnly} id="hf-bps-dia" value={vBpSittingDiastolic} onChange={setVBpSittingDiastolic} placeholder="Dia" />
                </div>
              </div>
              <div className="p-3 bg-white rounded-lg border border-slate-200">
                <label className="block text-xs font-bold text-slate-700 mb-1">Blood Pressure: Standing (mmHg)</label>
                <div className="flex gap-2">
                  <NumberInput readOnly={readOnly} id="hf-bpd-sys" value={vBpStandingSystolic} onChange={setVBpStandingSystolic} placeholder="Sys" />
                  <span className="self-center text-slate-400">/</span>
                  <NumberInput readOnly={readOnly} id="hf-bpd-dia" value={vBpStandingDiastolic} onChange={setVBpStandingDiastolic} placeholder="Dia" />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-700">Mental Status</label>
              <div className="grid grid-cols-3 gap-3 text-xs">
                <label className="flex items-center gap-2 p-2 bg-white rounded-lg border cursor-pointer">
                  <input disabled={readOnly} type="checkbox" checked={vMentalAlert === 'Yes'} onChange={(e) => {
                    setVMentalAlert(e.target.checked ? 'Yes' : 'No');
                    if(e.target.checked) { setVMentalConfused('No'); setVMentalDrowsy('No'); }
                  }} />
                  <span>Alert / Oriented</span>
                </label>
                <label className="flex items-center gap-2 p-2 bg-white rounded-lg border cursor-pointer">
                  <input disabled={readOnly} type="checkbox" checked={vMentalConfused === 'Yes'} onChange={(e) => {
                    setVMentalConfused(e.target.checked ? 'Yes' : 'No');
                    if(e.target.checked) { setVMentalAlert('No'); setVMentalDrowsy('No'); }
                  }} />
                  <span>Confused</span>
                </label>
                <label className="flex items-center gap-2 p-2 bg-white rounded-lg border cursor-pointer">
                  <input disabled={readOnly} type="checkbox" checked={vMentalDrowsy === 'Yes'} onChange={(e) => {
                    setVMentalDrowsy(e.target.checked ? 'Yes' : 'No');
                    if(e.target.checked) { setVMentalAlert('No'); setVMentalConfused('No'); }
                  }} />
                  <span>Drowsy</span>
                </label>
              </div>
            </div>
          </div>

          {/* Subsection: Present Symptoms Matrix */}
          <div className="bg-slate-50 p-4 border border-slate-200 rounded-xl space-y-3">
            <span className="block text-xs font-bold text-slate-700 border-b border-slate-200 pb-1">Symptoms</span>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2 text-xs bg-white p-3 rounded-lg border border-slate-200">
              
              <div className="flex items-center justify-between py-1 border-b border-slate-100">
                <span>Dyspnea at rest:</span>
                <RadioGroup readOnly={readOnly} name="s-dar" value={symptomDyspneaAtRest} onChange={setSymptomDyspneaAtRest} options={['Yes', 'No']} columns={2} hideLabel />
              </div>
              <div className="flex items-center justify-between py-1 border-b border-slate-100">
                <span>Weight Loss:</span>
                <RadioGroup readOnly={readOnly} name="s-wl" value={symptomWeightLoss} onChange={setSymptomWeightLoss} options={['Yes', 'No']} columns={2} hideLabel />
              </div>

              <div className="flex items-center justify-between py-1 border-b border-slate-100">
                <span>Dyspnea with exertion:</span>
                <RadioGroup readOnly={readOnly} name="s-dwe" value={symptomDyspneaWithExertion} onChange={setSymptomDyspneaWithExertion} options={['Yes', 'No']} columns={2} hideLabel />
              </div>
              <div className="flex items-center justify-between py-1 border-b border-slate-100">
                <span>Syncopy:</span>
                <RadioGroup readOnly={readOnly} name="s-sync" value={symptomSyncope} onChange={setSymptomSyncope} options={['Yes', 'No']} columns={2} hideLabel />
              </div>

              <div className="flex items-center justify-between py-1 border-b border-slate-100">
                <span>Fatigue:</span>
                <RadioGroup readOnly={readOnly} name="s-fat" value={symptomFatigue} onChange={setSymptomFatigue} options={['Yes', 'No']} columns={2} hideLabel />
              </div>
              <div className="flex items-center justify-between py-1 border-b border-slate-100">
                <span>PND:</span>
                <RadioGroup readOnly={readOnly} name="s-pnd" value={symptomPnd} onChange={setSymptomPnd} options={['Yes', 'No']} columns={2} hideLabel />
              </div>

              <div className="flex items-center justify-between py-1 border-b border-slate-100">
                <span>Orthopnea:</span>
                <RadioGroup readOnly={readOnly} name="s-orth" value={symptomOrthopnea} onChange={setSymptomOrthopnea} options={['Yes', 'No']} columns={2} hideLabel />
              </div>
              <div className="flex items-center justify-between py-1 border-b border-slate-100">
                <span>Muscle Cramps:</span>
                <RadioGroup readOnly={readOnly} name="s-mc" value={symptomMuscleCramps} onChange={setSymptomMuscleCramps} options={['Yes', 'No']} columns={2} hideLabel />
              </div>

              <div className="flex items-center justify-between py-1 border-b border-slate-100">
                <span>Loss of appetite/Bloating:</span>
                <RadioGroup readOnly={readOnly} name="s-loa" value={symptomLossOfAppetite} onChange={setSymptomLossOfAppetite} options={['Yes', 'No']} columns={2} hideLabel />
              </div>
              <div className="flex items-center justify-between py-1 border-b border-slate-100">
                <span>Wheeze:</span>
                <RadioGroup readOnly={readOnly} name="s-whz" value={symptomWheeze} onChange={setSymptomWheeze} options={['Yes', 'No']} columns={2} hideLabel />
              </div>

              <div className="flex items-center justify-between py-1 border-b border-slate-100">
                <span>Decreased exercise tolerance:</span>
                <RadioGroup readOnly={readOnly} name="s-det" value={symptomDecreasedExercise} onChange={setSymptomDecreasedExercise} options={['Yes', 'No']} columns={2} hideLabel />
              </div>
              <div className="flex items-center justify-between py-1 border-b border-slate-100">
                <span>Giddiness:</span>
                <RadioGroup readOnly={readOnly} name="s-gid" value={symptomGiddiness} onChange={setSymptomGiddiness} options={['Yes', 'No']} columns={2} hideLabel />
              </div>

              <div className="flex items-center justify-between py-1">
                <span>Weight Gain:</span>
                <RadioGroup readOnly={readOnly} name="s-wg" value={symptomWeightGain} onChange={setSymptomWeightGain} options={['Yes', 'No']} columns={2} hideLabel />
              </div>
              <div className="flex flex-col justify-center py-1">
                <div className="flex items-center justify-between">
                  <span>Other:</span>
                  <RadioGroup readOnly={readOnly} name="s-oth" value={symptomOther} onChange={setSymptomOther} options={['Yes', 'No']} columns={2} hideLabel />
                </div>
                {symptomOther === 'Yes' && (
                  <div className="mt-1">
                    <TextInput readOnly={readOnly} id="hf-sym-oth-det" value={symptomOtherDetails} onChange={setSymptomOtherDetails} placeholder="Specify other symptom details" />
                  </div>
                )}
              </div>

            </div>
          </div>

          {/* Subsection: Clinical Signs of Volume Overload */}
          <div className="bg-slate-50 p-4 border border-slate-200 rounded-xl space-y-3">
            <span className="block text-xs font-bold text-slate-700 border-b border-slate-200 pb-1">Clinical Signs of Volume Overload</span>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2 text-xs bg-white p-3 rounded-lg border border-slate-200">
              
              <div className="flex items-center justify-between py-1 border-b border-slate-100">
                <span>Peripheral edema:</span>
                <RadioGroup readOnly={readOnly} name="sg-pe" value={signPeripheralEdema} onChange={setSignPeripheralEdema} options={['Yes', 'No']} columns={2} hideLabel />
              </div>
              <div className="flex items-center justify-between py-1 border-b border-slate-100">
                <span>Ascites:</span>
                <RadioGroup readOnly={readOnly} name="sg-asc" value={signAscites} onChange={setSignAscites} options={['Yes', 'No']} columns={2} hideLabel />
              </div>

              <div className="flex items-center justify-between py-1 border-b border-slate-100">
                <span>Rales:</span>
                <RadioGroup readOnly={readOnly} name="sg-ral" value={signRales} onChange={setSignRales} options={['Yes', 'No']} columns={2} hideLabel />
              </div>
              <div className="flex items-center justify-between py-1 border-b border-slate-100">
                <span>Jugular venous pressure:</span>
                <RadioGroup readOnly={readOnly} name="sg-jvp" value={signJvp} onChange={setSignJvp} options={['Yes', 'No']} columns={2} hideLabel />
              </div>

              <div className="flex items-center justify-between py-1">
                <span>Hepatomegaly:</span>
                <RadioGroup readOnly={readOnly} name="sg-hep" value={signHepatomegaly} onChange={setSignHepatomegaly} options={['Yes', 'No']} columns={2} hideLabel />
              </div>
              <div className="flex flex-col justify-center py-1">
                <div className="flex items-center justify-between">
                  <span>Other:</span>
                  <RadioGroup readOnly={readOnly} name="sg-oth" value={signClinicalOther} onChange={setSignClinicalOther} options={['Yes', 'No']} columns={2} hideLabel />
                </div>
                {signClinicalOther === 'Yes' && (
                  <div className="mt-1">
                    <TextInput readOnly={readOnly} id="hf-sign-oth-det" value={signClinicalOtherDetails} onChange={setSignClinicalOtherDetails} placeholder="Specify other signs" />
                  </div>
                )}
              </div>

            </div>
          </div>
        </div>
      </SectionCard>

      {/* 4. Final Clinical Assessment */}
      <SectionCard title="4. Final Clinical Assessment" subtitle="Discharge classification, structural etiologies, and outcomes layout">
        <div className="space-y-4 border border-slate-200 rounded-lg overflow-hidden bg-white text-xs">
          
          {/* Type of Heart Failure Row */}
          <div className="p-3 bg-slate-50 border-b border-slate-200">
            <RadioGroup readOnly={readOnly} 
              label="Type of Heart Failure" 
              name="hf-type" 
              value={hfType} 
              onChange={setHfType} 
              required 
              columns={2} 
              options={['HFrEF (HF with reduced EF)', 'HFpEF (HF with preserved EF)']} 
            />
          </div>

          {/* HF Etiology Complex Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 border-b border-slate-200">
            <div className="p-3 border-r border-slate-200 bg-slate-50/50 font-bold text-slate-700">
              HF Etiology
            </div>
            <div className="p-3 md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <CheckboxGroup readOnly={readOnly} label="Cardiovascular" options={HF_ETIOLOGY_CV} values={hfEtiologyCv} onChange={setHfEtiologyCv} columns={1} />
              </div>
              <div className="space-y-4">
                <CheckboxGroup readOnly={readOnly} label="Non-cardiac" options={HF_ETIOLOGY_NON_CV} values={hfEtiologyNonCv} onChange={setHfEtiologyNonCv} columns={1} />
                <CheckboxGroup readOnly={readOnly} label="Pulmonary" options={HF_ETIOLOGY_PULM} values={hfEtiologyPulm} onChange={setHfEtiologyPulm} columns={1} />
                <div>
                  <span className="block font-bold text-slate-700 mb-1">Others (please specify):</span>
                  <input
                    disabled={readOnly}
                    type="text"
                    value={etiologyOtherDetails}
                    onChange={(e) => {
                      const val = e.target.value;
                      setEtiologyOtherDetails(val);
                      setEtiologyOther(val ? 'Yes' : 'No');
                    }}
                    className="w-full border border-slate-300 rounded p-1 text-xs bg-white text-slate-800 font-medium"
                    placeholder="Specify other etiology..."
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Comorbidities & Risk Factors Layout */}
          <div className="grid grid-cols-1 md:grid-cols-3 border-b border-slate-200">
            <div className="p-3 border-r border-slate-200 bg-slate-50/50 font-bold text-slate-700">
              Comorbidities & Risk Factors
            </div>
            <div className="p-3 md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <CheckboxGroup readOnly={readOnly} label="Comorbidities" options={COMORBIDITIES_OPTIONS} values={comorbidities} onChange={setComorbidities} columns={1} />
                <div className="mt-2 pl-1">
                  <span className="text-[11px] font-medium text-slate-600">Others:</span>
                  <input disabled={readOnly} type="text" value={otherComorbidity} onChange={(e) => setOtherComorbidity(e.target.value)} className="w-full border border-slate-300 rounded p-1 text-xs mt-0.5" />
                </div>
              </div>
              <div>
                <CheckboxGroup readOnly={readOnly} label="Risk Factors" options={RISK_FACTOR_OPTIONS} values={riskFactors} onChange={setRiskFactors} columns={1} />
                <div className="mt-2 pl-1">
                  <span className="text-[11px] font-medium text-slate-600">Others:</span>
                  <input disabled={readOnly} type="text" value={otherRiskFactor} onChange={(e) => setOtherRiskFactor(e.target.value)} className="w-full border border-slate-300 rounded p-1 text-xs mt-0.5" />
                </div>
              </div>
            </div>
          </div>

          {/* Stage, Functional Status, and AF Rows */}
          <div className="p-3 border-b border-slate-200 grid grid-cols-1 gap-3">
            <RadioGroup readOnly={readOnly} label="Stage of HF" name="hf-stage" value={hfStage} onChange={setHfStage} required columns={4} options={['Stage A', 'Stage B', 'Stage C', 'Stage D']} />
            <hr className="border-slate-100" />
            <RadioGroup readOnly={readOnly} label="Functional Status *required" name="hf-nyha" value={hfNyha} onChange={setHfNyha} required columns={4} options={['NYHA Class I', 'NYHA Class II', 'NYHA Class III', 'NYHA Class IV']} />
            <hr className="border-slate-100" />
            <RadioGroup readOnly={readOnly} label="AF Status *required" name="hf-af" value={hfAf} onChange={setHfAf} required columns={4} options={['Permanent', 'Paroxysmal', 'Persistent', 'NSR']} />
          </div>

          {/* Complex Major Adverse Cardiac Events (MACE) Table Layout */}
          <div className="grid grid-cols-1 md:grid-cols-3">
            <div className="p-3 border-r border-slate-200 bg-slate-50/50 font-bold text-slate-700 flex items-center">
              Major Adverse Cardiac Events
            </div>
            <div className="p-3 md:col-span-2 grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Col 1 */}
              <div className="space-y-2">
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input disabled={readOnly} type="checkbox" checked={maceHospitalization === 'Yes'} onChange={(e) => setMaceHospitalization(e.target.checked ? 'Yes' : 'No')} />
                  <span>Hospitalization</span>
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input disabled={readOnly} type="checkbox" checked={maceStroke === 'Yes'} onChange={(e) => setMaceStroke(e.target.checked ? 'Yes' : 'No')} />
                  <span>Stroke</span>
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input disabled={readOnly} type="checkbox" checked={maceMajorBleed === 'Yes'} onChange={(e) => setMaceMajorBleed(e.target.checked ? 'Yes' : 'No')} />
                  <span>Major Bleed</span>
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input disabled={readOnly} type="checkbox" checked={maceSevereArrhythmia === 'Yes'} onChange={(e) => setMaceSevereArrhythmia(e.target.checked ? 'Yes' : 'No')} />
                  <span>Severe Arrhythmia</span>
                </label>
              </div>
              
              {/* Col 2 */}
              <div className="space-y-2">
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input disabled={readOnly} type="checkbox" checked={maceProcedures === 'Yes'} onChange={(e) => setMaceProcedures(e.target.checked ? 'Yes' : 'No')} />
                  <span>Major Procedures:</span>
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input disabled={readOnly} type="checkbox" checked={maceOther === 'Yes'} onChange={(e) => setMaceOther(e.target.checked ? 'Yes' : 'No')} />
                  <span>Other:</span>
                </label>
                {maceOther === 'Yes' && (
                  <input disabled={readOnly} type="text" value={maceOtherDetails} onChange={(e) => setMaceOtherDetails(e.target.value)} className="w-full border border-slate-300 rounded p-1 text-[11px]" placeholder="Specify details..." />
                )}
              </div>

              {/* Col 3: Death Context */}
              <div className="space-y-2 bg-slate-50 p-2 rounded border border-slate-200">
                <label className="flex items-center gap-1.5 cursor-pointer font-bold text-red-700">
                  <input disabled={readOnly} type="checkbox" checked={maceDeath === 'Yes'} onChange={(e) => setMaceDeath(e.target.checked ? 'Yes' : 'No')} />
                  <span>Death:</span>
                </label>
                {maceDeath === 'Yes' && (
                  <div className="space-y-1.5 mt-1">
                    <div>
                      <span className="text-[10px] text-slate-500 block">Date:</span>
                      {renderInlineDate(maceDeathDate, setMaceDeathDate, "w-full border border-slate-300 rounded p-0.5 text-xs bg-white")}
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 block">Location:</span>
                      <div className="flex gap-2">
                        <label className="flex items-center gap-1"><input disabled={readOnly} type="radio" name="d-loc" checked={maceDeathLocation === 'Home'} onChange={() => setMaceDeathLocation('Home')} /> Home</label>
                        <label className="flex items-center gap-1"><input disabled={readOnly} type="radio" name="d-loc" checked={maceDeathLocation === 'Hospital'} onChange={() => setMaceDeathLocation('Hospital')} /> Hospital</label>
                      </div>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 block">Reason:</span>
                      <input disabled={readOnly} type="text" value={maceDeathReason} onChange={(e) => setMaceDeathReason(e.target.value)} className="w-full border border-slate-300 rounded p-0.5 text-xs" placeholder="Cause of death" />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="mt-4">
          <TextArea readOnly={readOnly} id="hf-final-notes" label="Final Clinical Notes / Summary" value={finalClinicalNotes} onChange={setFinalClinicalNotes} placeholder="Document final assessment, response to therapy and discharge summary." rows={3} />
        </div>
      </SectionCard>

      {/* 5. Investigations */}
      <SectionCard title="5. Investigations" subtitle="Complete clinical test records, laboratory metrics, and physiological studies grid mapping">
        <div className="border border-slate-300 rounded-lg overflow-hidden text-xs bg-white space-y-0.5">
          
          

          {/* ECG Block */}
          <div className="grid grid-cols-1 md:grid-cols-4 border-b border-slate-300">
            <div className="p-2.5 bg-slate-100 font-bold border-r border-slate-300 text-slate-700 flex flex-col justify-between">
              <span>ECG <span className="text-red-600 font-normal">*required</span></span>
            </div>
            <div className="p-2.5 md:col-span-3 space-y-3">
              <div className="flex flex-wrap gap-4 border-b border-slate-100 pb-2">
                <div className="flex items-center gap-1">
                  <span className="font-semibold text-slate-600">Date of test:</span>
                  {renderInlineDate(ecgDate, setEcgDate)}
                </div>
                <div className="flex items-center gap-1">
                  <span className="font-semibold text-slate-600">QRS duration:</span>
                  <input disabled={readOnly} type="text" value={ecgQrsDuration} onChange={(e) => setEcgQrsDuration(e.target.value)} className="border-b border-slate-300 p-0 focus:ring-0 text-xs w-24" />
                </div>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="border border-slate-200 rounded p-2 bg-slate-50/50">
                  <span className="block font-bold mb-1 text-slate-700">Rhythm</span>
                  {['Sinus', 'AF'].map(r => (
                    <label key={r} className="flex items-center gap-1.5 mt-0.5"><input disabled={readOnly} type="radio" name="ecg_rhy" checked={ecgRhythm === r} onChange={() => setEcgRhythm(r)} /> {r}</label>
                  ))}
                  <div className="mt-1 flex items-center gap-1">
                    <input disabled={readOnly} type="radio" name="ecg_rhy" checked={ecgRhythm === 'Other'} onChange={() => setEcgRhythm('Other')} />
                    <input disabled={readOnly} type="text" placeholder="Other:" value={ecgRhythmOther} onChange={(e) => { setEcgRhythm('Other'); setEcgRhythmOther(e.target.value); }} className="border-b border-slate-300 p-0 text-xs w-full bg-transparent focus:ring-0" />
                  </div>
                </div>

                <div className="border border-slate-200 rounded p-2 bg-slate-50/50">
                  <span className="block font-bold mb-1 text-slate-700">AV Conduction</span>
                  {['Normal', '1st degree AV block', '2nd degree AV block', '3rd degree AV block'].map(av => (
                    <label key={av} className="flex items-center gap-1.5 mt-0.5"><input disabled={readOnly} type="radio" name="ecg_av" checked={ecgAvConduction === av} onChange={() => setEcgAvConduction(av)} /> {av}</label>
                  ))}
                </div>

                <div className="border border-slate-200 rounded p-2 bg-slate-50/50">
                  <span className="block font-bold mb-1 text-slate-700">Q Waves</span>
                  <label className="flex items-center gap-1.5"><input disabled={readOnly} type="radio" name="ecg_qw" checked={ecgQWaves === 'Yes'} onChange={() => setEcgQWaves('Yes')} /> Yes</label>
                  {ecgQWaves === 'Yes' && (
                    <div className="pl-4 flex items-center gap-1 mt-0.5">
                      <span className="text-[10px] text-slate-500">• Leads:</span>
                      <input disabled={readOnly} type="text" value={ecgQWavesLeads} onChange={(e) => setEcgQWavesLeads(e.target.value)} className="border-b border-slate-300 p-0 text-xs w-full focus:ring-0" />
                    </div>
                  )}
                  <label className="flex items-center gap-1.5 mt-0.5"><input disabled={readOnly} type="radio" name="ecg_qw" checked={ecgQWaves === 'None'} onChange={() => setEcgQWaves('None')} /> None</label>
                </div>

                <div className="border border-slate-200 rounded p-2 bg-slate-50/50">
                  <span className="block font-bold mb-1 text-slate-700">Blockages</span>
                  {['LBBB', 'RBB'].map(bl => (
                    <label key={bl} className="flex items-center gap-1.5 mt-0.5"><input disabled={readOnly} type="radio" name="ecg_bl" checked={ecgBlockages === bl} onChange={() => setEcgBlockages(bl)} /> {bl}</label>
                  ))}
                  <div className="mt-1 flex items-center gap-1">
                    <input disabled={readOnly} type="radio" name="ecg_bl" checked={ecgBlockages === 'Other'} onChange={() => setEcgBlockages('Other')} />
                    <input disabled={readOnly} type="text" placeholder="Other:" value={ecgBlockagesOther} onChange={(e) => { setEcgBlockages('Other'); setEcgBlockagesOther(e.target.value); }} className="border-b border-slate-300 p-0 text-xs w-full bg-transparent focus:ring-0" />
                  </div>
                </div>

                <div className="border border-slate-200 rounded p-2 bg-slate-50/50">
                  <span className="block font-bold mb-1 text-slate-700">Extra Beats</span>
                  {['APC', 'VPC', 'None'].map(eb => (
                    <label key={eb} className="flex items-center gap-1.5 mt-0.5"><input disabled={readOnly} type="radio" name="ecg_ex" checked={ecgExtraBeats === eb} onChange={() => setEcgExtraBeats(eb)} /> {eb}</label>
                  ))}
                </div>

                <div className="border border-slate-200 rounded p-2 bg-slate-50/50 space-y-1">
                  <span className="block font-bold text-slate-700">QT Interval</span>
                  <div className="flex items-center gap-1"><span className="w-8 font-medium">QT:</span><input disabled={readOnly} type="text" value={ecgQt} onChange={(e) => setEcgQt(e.target.value)} className="border-b border-slate-300 p-0 w-full text-xs focus:ring-0" /></div>
                  <div className="flex items-center gap-1"><span className="w-8 font-medium">QTC:</span><input disabled={readOnly} type="text" value={ecgQtc} onChange={(e) => setEcgQtc(e.target.value)} className="border-b border-slate-300 p-0 w-full text-xs focus:ring-0" /></div>
                </div>
              </div>
            </div>
          </div>

          {/* Chest X-ray Block */}
          <div className="grid grid-cols-1 md:grid-cols-4 border-b border-slate-300">
            <div className="p-2.5 bg-slate-100 font-bold border-r border-slate-300 text-slate-700 flex items-center">Chest X-ray</div>
            <div className="p-2.5 md:col-span-3 space-y-2">
              <div className="flex items-center gap-1 border-b border-slate-100 pb-1.5">
                <span className="font-semibold text-slate-600">Date of test:</span>
                {renderInlineDate(cxrDate, setCxrDate)}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1.5">
                <div className="flex items-center gap-1">
                  <span className="font-medium">CT ratio:</span>
                  <input disabled={readOnly} type="text" value={cxrCtRatio} onChange={(e) => setCxrCtRatio(e.target.value)} className="border-b border-slate-300 p-0 focus:ring-0 text-xs w-full" />
                </div>
                <label className="flex items-center gap-1.5"><input disabled={readOnly} type="checkbox" checked={cxrPleuralEffusion} onChange={(e) => setCxrPleuralEffusion(e.target.checked)} /> Pleural effusion</label>
                <label className="flex items-center gap-1.5"><input disabled={readOnly} type="checkbox" checked={cxrPvh} onChange={(e) => setCxrPvh(e.target.checked)} /> PVH</label>
                <div className="flex items-center gap-1">
                  <span className="text-slate-500">Others:</span>
                  <input disabled={readOnly} type="text" value={cxrOthers} onChange={(e) => setCxrOthers(e.target.value)} className="border-b border-slate-300 p-0 focus:ring-0 text-xs w-full" />
                </div>
                <label className="flex items-center gap-1.5"><input disabled={readOnly} type="checkbox" checked={cxrPulmonaryEdema} onChange={(e) => setCxrPulmonaryEdema(e.target.checked)} /> Pulmonary edema</label>
              </div>
            </div>
          </div>

          {/* ECHO Block */}
          <div className="grid grid-cols-1 md:grid-cols-4 border-b border-slate-300">
            <div className="p-2.5 bg-slate-100 font-bold border-r border-slate-300 text-slate-700 flex items-center">ECHO</div>
            <div className="p-2.5 md:col-span-3 space-y-3">
              <div className="flex items-center gap-1 border-b border-slate-100 pb-1.5">
                <span className="font-semibold text-slate-600">Date of test:</span>
                {renderInlineDate(echoDate, setEchoDate)}
              </div>
              
              {/* Metric inputs section */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 border-b border-slate-100 pb-2">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-1.5"><input disabled={readOnly} type="checkbox" checked={echoEfPercent !== ''} readOnly /><span className="w-20 font-medium">EF%:</span><input disabled={readOnly} type="text" value={echoEfPercent} onChange={(e) => setEchoEfPercent(e.target.value)} className="border-b border-slate-300 p-0 w-full focus:ring-0 text-xs" /></div>
                  <div className="flex items-center gap-1.5"><input disabled={readOnly} type="checkbox" checked={echoEaRatio !== ''} readOnly /><span className="w-20 font-medium">E/A ratio:</span><input disabled={readOnly} type="text" value={echoEaRatio} onChange={(e) => setEchoEaRatio(e.target.value)} className="border-b border-slate-300 p-0 w-full focus:ring-0 text-xs" /></div>
                  <div className="flex items-center gap-1.5"><input disabled={readOnly} type="checkbox" checked={echoRvTapsv !== ''} readOnly /><span className="w-20 font-medium">RV TAPSV:</span><input disabled={readOnly} type="text" value={echoRvTapsv} onChange={(e) => setEchoRvTapsv(e.target.value)} className="border-b border-slate-300 p-0 w-full focus:ring-0 text-xs" /></div>
                </div>
                <div className="space-y-1.5">
                  <div className="flex items-center gap-1.5"><input disabled={readOnly} type="checkbox" checked={echoEePrimeRatio !== ''} readOnly /><span className="w-32 font-medium">E/E' ratio:</span><input disabled={readOnly} type="text" value={echoEePrimeRatio} onChange={(e) => setEchoEePrimeRatio(e.target.value)} className="border-b border-slate-300 p-0 w-full focus:ring-0 text-xs" /></div>
                  <div className="flex items-center gap-1.5"><input disabled={readOnly} type="checkbox" checked={echoEDecelTime !== ''} readOnly /><span className="w-32 font-medium">E deceleration time:</span><input disabled={readOnly} type="text" value={echoEDecelTime} onChange={(e) => setEchoEDecelTime(e.target.value)} className="border-b border-slate-300 p-0 w-full focus:ring-0 text-xs" /></div>
                </div>
              </div>

              {/* Binary evaluation blocks */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="flex items-center gap-1.5"><input disabled={readOnly} type="checkbox" checked={echoLaDimension} onChange={(e) => setEchoLaDimension(e.target.checked)} /> Left Atrium Dimension</label>
                  <label className="flex items-center gap-1.5"><input disabled={readOnly} type="checkbox" checked={echoLvSystole} onChange={(e) => setEchoLvSystole(e.target.checked)} /> Left Ventricle Systole</label>
                  <label className="flex items-center gap-1.5"><input disabled={readOnly} type="checkbox" checked={echoLvDiastole} onChange={(e) => setEchoLvDiastole(e.target.checked)} /> Left Ventricle Diastole</label>
                  
                  <div className="pt-1.5 border-t border-slate-100 mt-1">
                    <span className="block font-semibold text-slate-600 mb-0.5"><input disabled={readOnly} type="checkbox" checked={echoMrMitralRegurg !== ''} readOnly /> MR mitral regurgitation:</span>
                    <div className="grid grid-cols-3 gap-1">
                      {['None', '1plus', '2plus', '3plus', '4plus'].map(lvl => (
                        <label key={lvl} className="flex items-center gap-1 text-[11px]"><input disabled={readOnly} type="radio" name="echo_mr" checked={echoMrMitralRegurg === lvl} onChange={() => setEchoMrMitralRegurg(lvl)} /> {lvl}</label>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="space-y-2 bg-slate-50/50 p-2 rounded border border-slate-200">
                  <div className="flex items-center gap-1"><span className="font-semibold text-slate-600">Other Valves:</span><input disabled={readOnly} type="text" value={echoOtherValves} onChange={(e) => setEchoOtherValves(e.target.value)} className="border-b border-slate-300 p-0 bg-transparent text-xs w-full focus:ring-0" /></div>
                  <div className="flex items-center gap-1"><span className="font-semibold text-slate-600">RV Systolic Pressure:</span><input disabled={readOnly} type="text" value={echoRvSystolicPressure} onChange={(e) => setEchoRvSystolicPressure(e.target.value)} className="border-b border-slate-300 p-0 bg-transparent text-xs w-full focus:ring-0" /></div>
                  
                  <div className="flex items-center gap-4 py-0.5">
                    <span className="font-semibold text-slate-600">RV Function:</span>
                    <label className="flex items-center gap-1"><input disabled={readOnly} type="radio" name="echo_rvf" checked={echoRvFunction === 'Normal'} onChange={() => setEchoRvFunction('Normal')} /> Normal</label>
                    <label className="flex items-center gap-1"><input disabled={readOnly} type="radio" name="echo_rvf" checked={echoRvFunction === 'Impaired'} onChange={() => setEchoRvFunction('Impaired')} /> Impaired</label>
                  </div>

                  <div className="border-t border-slate-200 pt-1">
                    <span className="block font-semibold text-slate-600 mb-0.5">RWMI:</span>
                    <div className="flex flex-wrap gap-x-3 gap-y-1">
                      {['None', 'Global', 'Inferior', 'Anterior', 'Lateral'].map(r => (
                        <label key={r} className="flex items-center gap-1 text-[11px]"><input disabled={readOnly} type="radio" name="echo_rwmi" checked={echoRwmi === r} onChange={() => setEchoRwmi(r)} /> {r}</label>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Holter / Event Recorder Block */}
          <div className="grid grid-cols-1 md:grid-cols-4 border-b border-slate-300">
            <div className="p-2.5 bg-slate-100 font-bold border-r border-slate-300 text-slate-700 flex items-center">Holter/ Event Recorder</div>
            <div className="p-2.5 md:col-span-3 space-y-2">
              <div className="flex items-center gap-1 border-b border-slate-100 pb-1.5">
                <span className="font-semibold text-slate-600">Date of test:</span>
                {renderInlineDate(holterDate, setHolterDate)}
              </div>
              <div className="space-y-1.5">
                <div>
                  <label className="flex items-center gap-1.5 font-semibold text-slate-700"><input disabled={readOnly} type="checkbox" checked={holterVpcChecked} onChange={(e) => setHolterVpcChecked(e.target.checked)} /> VPC:</label>
                  <div className="pl-5 flex flex-wrap gap-4 items-center mt-1 bg-slate-50 p-1.5 rounded border">
                    <span className="font-medium text-slate-600">Ventricular Arrhythmia:</span>
                    {['No', 'Yes', 'Complex VPC', 'NSVT', 'VT'].map(opt => (
                      <label key={opt} className="flex items-center gap-1 text-[11px]"><input disabled={readOnly} type="radio" name="holter_va" checked={holterVentricularArrhythmia === opt} onChange={() => setHolterVentricularArrhythmia(opt)} /> {opt}</label>
                    ))}
                  </div>
                </div>
                
                <div className="flex flex-wrap gap-4 items-center pt-1">
                  <span className="font-semibold text-slate-700">Atrial Arrhythmias:</span>
                  {['None', 'APCs', 'AF'].map(opt => (
                    <label key={opt} className="flex items-center gap-1"><input disabled={readOnly} type="radio" name="holter_aa" checked={holterAtrialArrhythmias === opt} onChange={() => setHolterAtrialArrhythmias(opt)} /> {opt}</label>
                  ))}
                </div>

                <div className="flex items-center gap-1 pt-1">
                  <span className="font-semibold text-slate-700">Heart rate variability:</span>
                  <input disabled={readOnly} type="text" value={holterHrv} onChange={(e) => setHolterHrv(e.target.value)} className="border-b border-slate-300 p-0 focus:ring-0 text-xs w-full" />
                </div>
              </div>
            </div>
          </div>

          {/* Stress Test Block */}
          <div className="grid grid-cols-1 md:grid-cols-4 border-b border-slate-300">
            <div className="p-2.5 bg-slate-100 font-bold border-r border-slate-300 text-slate-700 flex items-center">Stress Test</div>
            <div className="p-2.5 md:col-span-3 space-y-2">
              <div className="flex items-center gap-1 border-b border-slate-100 pb-1.5">
                <span className="font-semibold text-slate-600">Date of test:</span>
                {renderInlineDate(stressDate, setStressDate)}
              </div>
              <div className="space-y-1.5">
                <label className="flex items-center gap-1.5"><input disabled={readOnly} type="radio" name="stress_status" checked={stressStatus === 'Not Done'} onChange={() => setStressStatus('Not Done')} /> Not Done</label>
                <div>
                  <label className="flex items-center gap-1.5"><input disabled={readOnly} type="radio" name="stress_status" checked={stressStatus === 'Done'} onChange={() => setStressStatus('Done')} /> Done</label>
                  {stressStatus === 'Done' && (
                    <div className="mt-1.5 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 pl-5 bg-slate-50 p-2 rounded border">
                      <div className="flex items-center gap-1"><span>▪ METS achieved:</span><input disabled={readOnly} type="text" value={stressMets} onChange={(e) => setStressMets(e.target.value)} className="border-b border-slate-300 bg-transparent p-0 text-xs w-full focus:ring-0" /></div>
                      <div className="flex items-center gap-3">
                        <span>▪ Ischemic changes:</span>
                        <label className="flex items-center gap-1"><input disabled={readOnly} type="radio" name="stress_isc" checked={stressIschemicChanges === 'Yes'} onChange={() => setStressIschemicChanges('Yes')} /> Yes</label>
                        <label className="flex items-center gap-1"><input disabled={readOnly} type="radio" name="stress_isc" checked={stressIschemicChanges === 'No'} onChange={() => setStressIschemicChanges('No')} /> No</label>
                      </div>
                      <div className="flex items-center gap-1"><span>▪ Target heart rate achieved:</span><input disabled={readOnly} type="text" value={stressTargetHr} onChange={(e) => setStressTargetHr(e.target.value)} className="border-b border-slate-300 bg-transparent p-0 text-xs w-full focus:ring-0" /></div>
                      <div className="flex items-center gap-3">
                        <span>▪ Arrhythmias:</span>
                        <label className="flex items-center gap-1"><input disabled={readOnly} type="radio" name="stress_arr" checked={stressArrhythmias === 'Yes'} onChange={() => setStressArrhythmias('Yes')} /> Yes</label>
                        <label className="flex items-center gap-1"><input disabled={readOnly} type="radio" name="stress_arr" checked={stressArrhythmias === 'No'} onChange={() => setStressArrhythmias('No')} /> No</label>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* MRI Block */}
          <div className="grid grid-cols-1 md:grid-cols-4 border-b border-slate-300">
            <div className="p-2.5 bg-slate-100 font-bold border-r border-slate-300 text-slate-700 flex items-center">MRI</div>
            <div className="p-2.5 md:col-span-3 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-1">
                <input disabled={readOnly} type="checkbox" checked={mriLvef !== ''} readOnly />
                <span className="font-semibold">LVEF:</span>
                <input disabled={readOnly} type="text" value={mriLvef} onChange={(e) => setMriLvef(e.target.value)} className="border-b border-slate-300 p-0 text-xs w-28 focus:ring-0" />
              </div>
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-1.5"><input disabled={readOnly} type="radio" name="mri_scar" checked={mriScar === 'Present'} onChange={() => setMriScar('Present')} /> Scar Present</label>
                <label className="flex items-center gap-1.5"><input disabled={readOnly} type="radio" name="mri_scar" checked={mriScar === 'Absent'} onChange={() => setMriScar('Absent')} /> Scar Absent</label>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-slate-500 font-medium">Date of test:</span>
                {renderInlineDate(mriDate, setMriDate, "border-b border-slate-300 p-0 text-xs focus:ring-0")}
              </div>
            </div>
          </div>

          {/* PET Block */}
          <div className="grid grid-cols-1 md:grid-cols-4 border-b border-slate-300">
            <div className="p-2.5 bg-slate-100 font-bold border-r border-slate-300 text-slate-700 flex items-center">PET</div>
            <div className="p-2.5 md:col-span-3 flex items-center justify-end gap-1">
              <span className="text-slate-500 font-medium">Date of test:</span>
              {renderInlineDate(petDate, setPetDate, "border-b border-slate-300 p-0 text-xs focus:ring-0")}
            </div>
          </div>

          {/* 6-Minute Walk Test Block */}
          <div className="grid grid-cols-1 md:grid-cols-4 border-b border-slate-300">
            <div className="p-2.5 bg-slate-100 font-bold border-r border-slate-300 text-slate-700 flex items-center">6-Minute Walk Test</div>
            <div className="p-2.5 md:col-span-3 space-y-2">
              <div className="flex items-center gap-1 border-b border-slate-100 pb-1.5">
                <span className="font-semibold text-slate-600">Date of test:</span>
                {renderInlineDate(sixMwtDate, setSixMwtDate)}
              </div>
              <div className="space-y-2">
                <div>
                  <label className="flex items-center gap-1.5 font-bold text-slate-700"><input disabled={readOnly} type="radio" name="six_mwt" checked={sixMwtStatus === 'Done'} onChange={() => setSixMwtStatus('Done')} /> Done:</label>
                  {sixMwtStatus === 'Done' && (
                    <div className="mt-1 grid grid-cols-1 sm:grid-cols-2 gap-4 pl-5 bg-slate-50 p-2 rounded border">
                      <div className="flex items-center gap-1"><span>▪ Distance walked in m:</span><input disabled={readOnly} type="text" value={sixMwtDistance} onChange={(e) => setSixMwtDistance(e.target.value)} className="border-b border-slate-300 bg-transparent p-0 text-xs w-full focus:ring-0" /></div>
                      <div className="flex items-center gap-1"><span>▪ Heart rate recovery in first 1 minute:</span><input disabled={readOnly} type="text" value={sixMwtHrRecovery} onChange={(e) => setSixMwtHrRecovery(e.target.value)} className="border-b border-slate-300 bg-transparent p-0 text-xs w-full focus:ring-0" /></div>
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <label className="flex items-center gap-1.5 font-bold text-slate-700 whitespace-nowrap"><input disabled={readOnly} type="radio" name="six_mwt" checked={sixMwtStatus === 'Not Done'} onChange={() => setSixMwtStatus('Not Done')} /> Not Done, Reasons:</label>
                  {sixMwtStatus === 'Not Done' && (
                    <input disabled={readOnly} type="text" value={sixMwtNotDoneReason} onChange={(e) => setSixMwtNotDoneReason(e.target.value)} className="border-b border-slate-300 p-0 text-xs w-full focus:ring-0" placeholder="Specify clinical barriers..." />
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Anaerobic Threshold Block */}
          <div className="grid grid-cols-1 md:grid-cols-4 border-b border-slate-300">
            <div className="p-2.5 bg-slate-100 font-bold border-r border-slate-300 text-slate-700 flex items-center">Anaerobic Threshold</div>
            <div className="p-2.5 md:col-span-3 flex items-center justify-end gap-1">
              <span className="text-slate-500 font-medium">Date of test:</span>
              {renderInlineDate(anaerobicDate, setAnaerobicDate, "border-b border-slate-300 p-0 text-xs focus:ring-0")}
            </div>
          </div>

          {/* Angiogram Block */}
          <div className="grid grid-cols-1 md:grid-cols-4 border-b border-slate-300">
            <div className="p-2.5 bg-slate-100 font-bold border-r border-slate-300 text-slate-700 flex items-center">Angiogram</div>
            <div className="p-2.5 md:col-span-3 space-y-2">
              <div className="flex items-center gap-1 border-b border-slate-100 pb-1.5">
                <span className="font-semibold text-slate-600">Date of test:</span>
                {renderInlineDate(angioDate, setAngioDate)}
              </div>
              <div className="space-y-1.5">
                <div>
                  <label className="flex items-center gap-1.5 font-bold text-slate-700"><input disabled={readOnly} type="radio" name="angio_st" checked={angioStatus === 'Done'} onChange={() => setAngioStatus('Done')} /> Done:</label>
                  {angioStatus === 'Done' && (
                    <div className="mt-1 flex flex-wrap gap-4 pl-5 bg-slate-50 p-2 rounded border">
                      {['Normal', '1 vessel disease', '2 vessel disease', '3 vessel disease', 'LMCA'].map(f => (
                        <label key={f} className="flex items-center gap-1"><input disabled={readOnly} type="radio" name="angio_find" checked={angioFinding === f} onChange={() => setAngioFinding(f)} /> {f}</label>
                      ))}
                    </div>
                  )}
                </div>
                <label className="flex items-center gap-1.5 font-bold text-slate-700"><input disabled={readOnly} type="radio" name="angio_st" checked={angioStatus === 'Not Done'} onChange={() => setAngioStatus('Not Done')} /> Not Done</label>
              </div>
            </div>
          </div>

          {/* Endomyocardial biopsy Block */}
          <div className="grid grid-cols-1 md:grid-cols-4">
            <div className="p-2.5 bg-slate-100 font-bold border-r border-slate-300 text-slate-700 flex items-center">Endomyocardial biopsy</div>
            <div className="p-2.5 md:col-span-3 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-1">
                <span className="font-semibold text-slate-700">Date of test:</span>
                {renderInlineDate(biopsyDate, setBiopsyDate)}
              </div>
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-1.5"><input disabled={readOnly} type="radio" name="biopsy_st" checked={biopsyStatus === 'Done'} onChange={() => setBiopsyStatus('Done')} /> Done</label>
                <label className="flex items-center gap-1.5"><input disabled={readOnly} type="radio" name="biopsy_st" checked={biopsyStatus === 'Not Done'} onChange={() => setBiopsyStatus('Not Done')} /> Not Done</label>
              </div>
            </div>
          </div>

          {/* Vaccinations Row */}
          <div className="grid grid-cols-1 md:grid-cols-4 border-b border-slate-300">
            <div className="p-2.5 bg-slate-100 font-bold border-r border-slate-300 text-slate-700 flex items-center">Vaccinations</div>
            <div className="p-2.5 md:col-span-3 flex flex-wrap gap-6 items-center">
              <div className="flex items-center gap-2">
                <input disabled={readOnly} type="checkbox" id="v-pneumo" checked={vacPneumococcal} onChange={(e) => setVacPneumococcal(e.target.checked)} />
                <label htmlFor="v-pneumo" className="font-medium">Pneumococcal (Date of test:</label>
                {renderInlineDate(vacPneumococcalDate, setVacPneumococcalDate, "border-b border-slate-400 p-0 text-xs w-28 focus:ring-0 outline-none")}
              </div>
              <div className="flex items-center gap-2">
                <input disabled={readOnly} type="checkbox" id="v-flu" checked={vacInfluenza} onChange={(e) => setVacInfluenza(e.target.checked)} />
                <label htmlFor="v-flu" className="font-medium">Influenza (Date of test:</label>
                {renderInlineDate(vacInfluenzaDate, setVacInfluenzaDate, "border-b border-slate-400 p-0 text-xs w-28 focus:ring-0 outline-none")}
              </div>
            </div>
          </div>

          {/* Blood Group Row */}
          <div className="grid grid-cols-1 md:grid-cols-4 border-b border-slate-300">
            <div className="p-2.5 bg-slate-100 font-bold border-r border-slate-300 text-slate-700 flex items-center">Blood group</div>
            <div className="p-2.5 md:col-span-3 grid grid-cols-4 sm:grid-cols-8 gap-2">
              {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map((bg) => (
                <label key={bg} className="flex items-center gap-1.5 cursor-pointer">
                  <input disabled={readOnly} type="radio" name="blood_group_options" checked={bloodGroup === bg} onChange={() => setBloodGroup(bg)} />
                  <span>{bg}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Lab Tests Composite Row */}
          <div className="grid grid-cols-1 md:grid-cols-4 border-b border-slate-300">
            <div className="p-2.5 bg-slate-100 font-bold border-r border-slate-300 text-slate-700">
              <div>Lab Tests</div>
              <div className="text-[10px] text-slate-500 font-normal italic mt-1">(*Potassium and Creatinine tests are required for all follow-up visits)</div>
            </div>
            
            {/* Dynamic Lab Grid Blocks */}
            <div className="p-2.5 md:col-span-3 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2">
              
              {/* Left Column Labs */}
              <div className="space-y-1">
                <div className="grid grid-cols-3 text-[10px] uppercase tracking-wider font-bold text-slate-400 pb-1">
                  <span>Please specify:</span>
                  <span className="text-center italic">Results</span>
                  <span className="text-right italic">Date</span>
                </div>
                {[
                  { key: 'potassium', label: 'Potassium*' },
                  { key: 'creatinine', label: 'Creatinine*' },
                  { key: 'hb', label: 'Hb' },
                  { key: 'calcium', label: 'Calcium' },
                  { key: 'bun', label: 'BUN' },
                  { key: 'glucose', label: 'Glucose' },
                  { key: 'hba1c', label: 'HBa1c' },
                  { key: 'magnesium', label: 'Magnesium' },
                  { key: 'sodium', label: 'Sodium' },
                  { key: 'tsh', label: 'TSH' },
                  { key: 't3', label: 'T3' },
                  { key: 't4', label: 'T4' }
                ].map((item) => (
                  <div key={item.key} className="grid grid-cols-3 items-center gap-2 py-0.5">
                    <label className="flex items-center gap-1.5 truncate">
                      <input disabled={readOnly} type="checkbox" checked={labTests[item.key].checked} onChange={(e) => handleLabChange(item.key, 'checked', e.target.checked)} />
                      <span className="truncate">{item.label}</span>
                    </label>
                    <input disabled={readOnly} type="text" value={labTests[item.key].result} onChange={(e) => handleLabChange(item.key, 'result', e.target.value)} className="border-b border-slate-300 px-1 py-0 text-center text-xs focus:ring-0 outline-none w-full" />
                    {readOnly ? <span className="text-slate-900 font-bold text-xs text-right w-full block">{formatDateToView(labTests[item.key].date) || '—'}</span> : <input type="date" value={labTests[item.key].date ? labTests[item.key].date.split('T')[0] : ''} onChange={(e) => handleLabChange(item.key, 'date', e.target.value)} className="border-b border-slate-300 px-1 py-0 text-right text-[11px] focus:ring-0 outline-none w-full" />}
                  </div>
                ))}
              </div>

              {/* Right Column Labs */}
              <div className="space-y-1">
                <div className="grid grid-cols-3 text-[10px] uppercase tracking-wider font-bold text-slate-400 pb-1">
                  <span>When required:</span>
                  <span className="text-center italic">Results</span>
                  <span className="text-right italic">Date</span>
                </div>
                {[
                  { key: 'bnp', label: 'BNP' },
                  { key: 'ntProBnp', label: 'NT-pro BNP' },
                  { key: 'ldl', label: 'LDL' },
                  { key: 'inr', label: 'INR' },
                  { key: 'st2', label: 'ST2' }
                ].map((item) => (
                  <div key={item.key} className="grid grid-cols-3 items-center gap-2 py-0.5">
                    <label className="flex items-center gap-1.5 truncate">
                      <input disabled={readOnly} type="checkbox" checked={labTests[item.key].checked} onChange={(e) => handleLabChange(item.key, 'checked', e.target.checked)} />
                      <span className="truncate">{item.label}</span>
                    </label>
                    <input disabled={readOnly} type="text" value={labTests[item.key].result} onChange={(e) => handleLabChange(item.key, 'result', e.target.value)} className="border-b border-slate-300 px-1 py-0 text-center text-xs focus:ring-0 outline-none w-full" />
                    {readOnly ? <span className="text-slate-900 font-bold text-xs text-right w-full block">{formatDateToView(labTests[item.key].date) || '—'}</span> : <input type="date" value={labTests[item.key].date ? labTests[item.key].date.split('T')[0] : ''} onChange={(e) => handleLabChange(item.key, 'date', e.target.value)} className="border-b border-slate-300 px-1 py-0 text-right text-[11px] focus:ring-0 outline-none w-full" />}
                  </div>
                ))}
                {/* Custom Lab Field */}
                <div className="grid grid-cols-3 items-center gap-2 py-0.5">
                  <div className="flex items-center gap-1">
                    <input disabled={readOnly} type="checkbox" checked={labTests.other.checked} onChange={(e) => handleLabChange('other', 'checked', e.target.checked)} />
                    <input disabled={readOnly} type="text" placeholder="Other:" value={labTests.other.name || ''} onChange={(e) => handleLabChange('other', 'name', e.target.value)} className="border-b border-slate-300 p-0 text-xs w-full focus:ring-0 outline-none" />
                  </div>
                  <input disabled={readOnly} type="text" value={labTests.other.result} onChange={(e) => handleLabChange('other', 'result', e.target.value)} className="border-b border-slate-300 px-1 py-0 text-center text-xs focus:ring-0 outline-none w-full" />
                  {readOnly ? <span className="text-slate-900 font-bold text-xs text-right w-full block">{formatDateToView(labTests.other.date) || '—'}</span> : <input type="date" value={labTests.other.date ? labTests.other.date.split('T')[0] : ''} onChange={(e) => handleLabChange('other', 'date', e.target.value)} className="border-b border-slate-300 px-1 py-0 text-right text-[11px] focus:ring-0 outline-none w-full" />}
                </div>
              </div>

            </div>
          </div>

        </div>
      </SectionCard>

      {/* 6. Medical Therapy (Dose & Frequency) */}
      <SectionCard title="6. Medical Therapy (Dose & Frequency)" subtitle="Guideline-directed medical therapy with dosing details">
        <div className="border border-slate-300 rounded-lg overflow-hidden text-xs bg-white divide-y divide-slate-300">
          
          {/* Header row */}
          <div className="hidden lg:grid lg:grid-cols-12 bg-slate-100 font-bold text-slate-700 border-b border-slate-300 uppercase tracking-wider text-[10px]">
            <div className="lg:col-span-3 p-2.5 border-r border-slate-300">Drug Category</div>
            <div className="lg:col-span-5 p-2.5 border-r border-slate-300">Medications & Doses (per day)</div>
            <div className="lg:col-span-4 p-2.5">Contraindications / Reason Not Used</div>
          </div>

          {/* Recommended Consults */}
          <div className="grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-slate-200">
            <div className="lg:col-span-3 bg-slate-50/70 p-3 flex flex-col justify-center">
              <span className="font-bold text-slate-800 text-[11px] uppercase">Recommended Consults</span>
            </div>
            <div className="lg:col-span-9 p-3">
              <input disabled={readOnly}
                type="text"
                value={recommendedConsults}
                onChange={(e) => setRecommendedConsults(e.target.value)}
                className="w-full border border-slate-300 rounded p-1.5 text-xs focus:ring-1 focus:ring-teal-500 focus:border-teal-500 outline-none"
                placeholder="Please specify..."
              />
            </div>
          </div>

          {/* Drug Intolerance(s)/Contraindications */}
          <div className="grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-slate-200">
            <div className="lg:col-span-3 bg-slate-50/70 p-3 flex flex-col justify-center">
              <span className="font-bold text-slate-800 text-[11px] uppercase">Drug Intolerance(s) / Contraindications</span>
            </div>
            <div className="lg:col-span-9 p-3">
              <input disabled={readOnly}
                type="text"
                value={drugIntoleranceContraindications}
                onChange={(e) => setDrugIntoleranceContraindications(e.target.value)}
                className="w-full border border-slate-300 rounded p-1.5 text-xs focus:ring-1 focus:ring-teal-500 focus:border-teal-500 outline-none"
                placeholder="Please specify..."
              />
            </div>
          </div>

          {/* Beta Blockers Row */}
          <div className="grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-slate-200">
            <div className="lg:col-span-3 bg-slate-50/70 p-3 flex flex-col justify-center">
              <span className="font-bold text-slate-800 text-[11px] uppercase">Beta-Blocker</span>
            </div>
            <div className="lg:col-span-5 p-3 space-y-2">
              {[
                { val: carvedilol, set: setCarvedilol, dose: carvedilolDose, setDose: setCarvedilolDose, label: 'Carvedilol' },
                { val: bisoprolol, set: setBisoprolol, dose: bisoprololDose, setDose: setBisoprololDose, label: 'Bisoprolol' },
                { val: metoprololSuccinate, set: setMetoprololSuccinate, dose: metoprololSuccinateDose, setDose: setMetoprololSuccinateDose, label: 'Metoprolol Succinate' },
                { val: nebivolol, set: setNebivolol, dose: nebivololDose, setDose: setNebivololDose, label: 'Nebivolol' },
                { val: betaBlockerOther, set: setBetaBlockerOther, dose: betaBlockerOtherDose, setDose: setBetaBlockerOtherDose, label: 'Other:', name: betaBlockerOtherName, setName: setBetaBlockerOtherName }
              ].map((drug) => (
                <div key={drug.label} className="flex items-center justify-between gap-2 py-0.5">
                  <label className="flex items-center gap-1.5 cursor-pointer whitespace-nowrap">
                    <input disabled={readOnly}
                      type="checkbox"
                      checked={drug.val === 'Yes'}
                      onChange={(e) => drug.set(e.target.checked ? 'Yes' : 'No')}
                      className="rounded border-slate-300 text-teal-600 focus:ring-teal-500 w-3.5 h-3.5"
                    />
                    <span className="font-medium text-slate-700">{drug.label}</span>
                  </label>
                  {drug.val === 'Yes' && (
                    <div className="flex items-center gap-1.5">
                      {drug.name !== undefined && (
                        <input disabled={readOnly}
                          type="text"
                          value={drug.name}
                          onChange={(e) => drug.setName(e.target.value)}
                          className="border border-slate-300 rounded p-1 text-xs w-36 focus:ring-1 focus:ring-teal-500 focus:border-teal-500 outline-none"
                          placeholder="Name"
                        />
                      )}
                      <input disabled={readOnly}
                        type="text"
                        value={drug.dose}
                        onChange={(e) => drug.setDose(e.target.value)}
                        className="border border-slate-300 rounded p-1 text-xs w-24 focus:ring-1 focus:ring-teal-500 focus:border-teal-500 outline-none text-right"
                        placeholder="Dose"
                      />
                      <span className="text-[10px] text-slate-400">/per day</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
            <div className="lg:col-span-4 p-3 bg-slate-50/30 space-y-2">
              <span className="block font-semibold text-slate-500 uppercase text-[9px] mb-1">Contraindication/reason not used:</span>
              <div className="grid grid-cols-2 gap-1.5">
                {[
                  { val: betaNotUsedBradycardia, set: setBetaNotUsedBradycardia, label: 'Bradycardia' },
                  { val: betaNotUsedHeartBlocks, set: setBetaNotUsedHeartBlocks, label: 'Heart blocks' },
                  { val: betaNotUsedCopdAsthma, set: setBetaNotUsedCopdAsthma, label: 'COPD/ Asthma' },
                  { val: betaNotUsedHypotension, set: setBetaNotUsedHypotension, label: 'Hypotension' },
                  { val: betaNotUsedOther, set: setBetaNotUsedOther, label: 'Other' }
                ].map((item) => (
                  <label key={item.label} className="flex items-center gap-1.5 cursor-pointer text-slate-700">
                    <input disabled={readOnly}
                      type="checkbox"
                      checked={item.val === 'Yes'}
                      onChange={(e) => item.set(e.target.checked ? 'Yes' : 'No')}
                      className="rounded border-slate-300 text-teal-600 focus:ring-teal-500 w-3.5 h-3.5"
                    />
                    <span>{item.label}</span>
                  </label>
                ))}
              </div>
              {betaNotUsedOther === 'Yes' && (
                <div className="mt-1.5">
                  <input disabled={readOnly}
                    type="text"
                    value={betaNotUsedOtherReason}
                    onChange={(e) => setBetaNotUsedOtherReason(e.target.value)}
                    className="border border-slate-300 rounded p-1 text-xs w-full focus:ring-1 focus:ring-teal-500 focus:border-teal-500 outline-none"
                    placeholder="Specify other reason..."
                  />
                </div>
              )}
            </div>
          </div>

          {/* ACE Inhibitors Row */}
          <div className="grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-slate-200">
            <div className="lg:col-span-3 bg-slate-50/70 p-3 flex flex-col justify-center">
              <span className="font-bold text-slate-800 text-[11px] uppercase">ACE Inhibitor</span>
            </div>
            <div className="lg:col-span-5 p-3 space-y-2">
              {[
                { val: enalapril, set: setEnalapril, dose: enalaprilDose, setDose: setEnalaprilDose, label: 'Enalapril' },
                { val: ramipril, set: setRamipril, dose: ramiprilDose, setDose: setRamiprilDose, label: 'Ramipril' },
                { val: lisinopril, set: setLisinopril, dose: lisinoprilDose, setDose: setLisinoprilDose, label: 'Lisinopril' },
                { val: perindopril, set: setPerindopril, dose: perindoprilDose, setDose: setPerindoprilDose, label: 'Perindopril' },
                { val: aceOther, set: setAceOther, dose: aceOtherDose, setDose: setAceOtherDose, label: 'Other:', name: aceOtherName, setName: setAceOtherName }
              ].map((drug) => (
                <div key={drug.label} className="flex items-center justify-between gap-2 py-0.5">
                  <label className="flex items-center gap-1.5 cursor-pointer whitespace-nowrap">
                    <input disabled={readOnly}
                      type="checkbox"
                      checked={drug.val === 'Yes'}
                      onChange={(e) => drug.set(e.target.checked ? 'Yes' : 'No')}
                      className="rounded border-slate-300 text-teal-600 focus:ring-teal-500 w-3.5 h-3.5"
                    />
                    <span className="font-medium text-slate-700">{drug.label}</span>
                  </label>
                  {drug.val === 'Yes' && (
                    <div className="flex items-center gap-1.5">
                      {drug.name !== undefined && (
                        <input disabled={readOnly}
                          type="text"
                          value={drug.name}
                          onChange={(e) => drug.setName(e.target.value)}
                          className="border border-slate-300 rounded p-1 text-xs w-36 focus:ring-1 focus:ring-teal-500 focus:border-teal-500 outline-none"
                          placeholder="Name"
                        />
                      )}
                      <input disabled={readOnly}
                        type="text"
                        value={drug.dose}
                        onChange={(e) => drug.setDose(e.target.value)}
                        className="border border-slate-300 rounded p-1 text-xs w-24 focus:ring-1 focus:ring-teal-500 focus:border-teal-500 outline-none text-right"
                        placeholder="Dose"
                      />
                      <span className="text-[10px] text-slate-400">/per day</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
            <div className="lg:col-span-4 p-3 bg-slate-50/30 space-y-2">
              <span className="block font-semibold text-slate-500 uppercase text-[9px] mb-1">Contraindication/reason not used:</span>
              <div className="grid grid-cols-2 gap-1.5">
                {[
                  { val: aceNotUsedElevatedCreatinine, set: setAceNotUsedElevatedCreatinine, label: 'Elevated creatinine (Renal failure)' },
                  { val: aceNotUsedHyperkalemia, set: setAceNotUsedHyperkalemia, label: 'Hyperkalemia' },
                  { val: aceNotUsedCough, set: setAceNotUsedCough, label: 'Cough' },
                  { val: aceNotUsedHypotension, set: setAceNotUsedHypotension, label: 'Hypotension' },
                  { val: aceNotUsedOther, set: setAceNotUsedOther, label: 'Other' }
                ].map((item) => (
                  <label key={item.label} className="flex items-center gap-1.5 cursor-pointer text-slate-700">
                    <input disabled={readOnly}
                      type="checkbox"
                      checked={item.val === 'Yes'}
                      onChange={(e) => item.set(e.target.checked ? 'Yes' : 'No')}
                      className="rounded border-slate-300 text-teal-600 focus:ring-teal-500 w-3.5 h-3.5"
                    />
                    <span>{item.label}</span>
                  </label>
                ))}
              </div>
              {aceNotUsedOther === 'Yes' && (
                <div className="mt-1.5">
                  <input disabled={readOnly}
                    type="text"
                    value={aceNotUsedOtherReason}
                    onChange={(e) => setAceNotUsedOtherReason(e.target.value)}
                    className="border border-slate-300 rounded p-1 text-xs w-full focus:ring-1 focus:ring-teal-500 focus:border-teal-500 outline-none"
                    placeholder="Specify other reason..."
                  />
                </div>
              )}
            </div>
          </div>

          {/* ARBs Row */}
          <div className="grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-slate-200">
            <div className="lg:col-span-3 bg-slate-50/70 p-3 flex flex-col justify-center">
              <span className="font-bold text-slate-800 text-[11px] uppercase">Angiotensin Receptor Blocker</span>
            </div>
            <div className="lg:col-span-5 p-3 space-y-2">
              {[
                { val: valsartan, set: setValsartan, dose: valsartanDose, setDose: setValsartanDose, label: 'Valsartan' },
                { val: losartan, set: setLosartan, dose: losartanDose, setDose: setLosartanDose, label: 'Losartan' },
                { val: telmisartan, set: setTelmisartan, dose: telmisartanDose, setDose: setTelmisartanDose, label: 'Telmisartan' },
                { val: olmesartan, set: setOlmesartan, dose: olmesartanDose, setDose: setOlmesartanDose, label: 'Olmesartan' },
                { val: arbOther, set: setArbOther, dose: arbOtherDose, setDose: setArbOtherDose, label: 'Other:', name: arbOtherName, setName: setArbOtherName }
              ].map((drug) => (
                <div key={drug.label} className="flex items-center justify-between gap-2 py-0.5">
                  <label className="flex items-center gap-1.5 cursor-pointer whitespace-nowrap">
                    <input disabled={readOnly}
                      type="checkbox"
                      checked={drug.val === 'Yes'}
                      onChange={(e) => drug.set(e.target.checked ? 'Yes' : 'No')}
                      className="rounded border-slate-300 text-teal-600 focus:ring-teal-500 w-3.5 h-3.5"
                    />
                    <span className="font-medium text-slate-700">{drug.label}</span>
                  </label>
                  {drug.val === 'Yes' && (
                    <div className="flex items-center gap-1.5">
                      {drug.name !== undefined && (
                        <input disabled={readOnly}
                          type="text"
                          value={drug.name}
                          onChange={(e) => drug.setName(e.target.value)}
                          className="border border-slate-300 rounded p-1 text-xs w-36 focus:ring-1 focus:ring-teal-500 focus:border-teal-500 outline-none"
                          placeholder="Name"
                        />
                      )}
                      <input disabled={readOnly}
                        type="text"
                        value={drug.dose}
                        onChange={(e) => drug.setDose(e.target.value)}
                        className="border border-slate-300 rounded p-1 text-xs w-24 focus:ring-1 focus:ring-teal-500 focus:border-teal-500 outline-none text-right"
                        placeholder="Dose"
                      />
                      <span className="text-[10px] text-slate-400">/per day</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
            <div className="lg:col-span-4 p-3 bg-slate-50/30 space-y-2">
              <span className="block font-semibold text-slate-500 uppercase text-[9px] mb-1">Contraindication/reason not used:</span>
              <div className="grid grid-cols-2 gap-1.5">
                {[
                  { val: arbNotUsedElevatedCreatinine, set: setArbNotUsedElevatedCreatinine, label: 'Elevated creatinine (Renal failure)' },
                  { val: arbNotUsedHyperkalemia, set: setArbNotUsedHyperkalemia, label: 'Hyperkalemia' },
                  { val: arbNotUsedHypotension, set: setArbNotUsedHypotension, label: 'Hypotension' },
                  { val: arbNotUsedOther, set: setArbNotUsedOther, label: 'Others' }
                ].map((item) => (
                  <label key={item.label} className="flex items-center gap-1.5 cursor-pointer text-slate-700">
                    <input disabled={readOnly}
                      type="checkbox"
                      checked={item.val === 'Yes'}
                      onChange={(e) => item.set(e.target.checked ? 'Yes' : 'No')}
                      className="rounded border-slate-300 text-teal-600 focus:ring-teal-500 w-3.5 h-3.5"
                    />
                    <span>{item.label}</span>
                  </label>
                ))}
              </div>
              {arbNotUsedOther === 'Yes' && (
                <div className="mt-1.5">
                  <input disabled={readOnly}
                    type="text"
                    value={arbNotUsedOtherReason}
                    onChange={(e) => setArbNotUsedOtherReason(e.target.value)}
                    className="border border-slate-300 rounded p-1 text-xs w-full focus:ring-1 focus:ring-teal-500 focus:border-teal-500 outline-none"
                    placeholder="Specify other reason..."
                  />
                </div>
              )}
            </div>
          </div>

          {/* Aldosterone Antagonists Row */}
          <div className="grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-slate-200">
            <div className="lg:col-span-3 bg-slate-50/70 p-3 flex flex-col justify-center">
              <span className="font-bold text-slate-800 text-[11px] uppercase">Aldosterone Antagonist</span>
            </div>
            <div className="lg:col-span-5 p-3 space-y-2">
              {[
                { val: spironolactone, set: setSpironolactone, dose: spironolactoneDose, setDose: setSpironolactoneDose, label: 'Spironolactone' },
                { val: eplerenone, set: setEplerenone, dose: eplerenoneDose, setDose: setEplerenoneDose, label: 'Eplerenone' }
              ].map((drug) => (
                <div key={drug.label} className="flex items-center justify-between gap-2 py-0.5">
                  <label className="flex items-center gap-1.5 cursor-pointer whitespace-nowrap">
                    <input disabled={readOnly}
                      type="checkbox"
                      checked={drug.val === 'Yes'}
                      onChange={(e) => drug.set(e.target.checked ? 'Yes' : 'No')}
                      className="rounded border-slate-300 text-teal-600 focus:ring-teal-500 w-3.5 h-3.5"
                    />
                    <span className="font-medium text-slate-700">{drug.label}</span>
                  </label>
                  {drug.val === 'Yes' && (
                    <div className="flex items-center gap-1">
                      <input disabled={readOnly}
                        type="text"
                        value={drug.dose}
                        onChange={(e) => drug.setDose(e.target.value)}
                        className="border border-slate-300 rounded p-1 text-xs w-24 focus:ring-1 focus:ring-teal-500 focus:border-teal-500 outline-none text-right"
                        placeholder="Dose"
                      />
                      <span className="text-[10px] text-slate-400">/per day</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
            <div className="lg:col-span-4 p-3 bg-slate-50/30 space-y-2">
              <span className="block font-semibold text-slate-500 uppercase text-[9px] mb-1">Contraindication/reason not used:</span>
              <div className="grid grid-cols-2 gap-1.5">
                {[
                  { val: aldosteroneNotUsedHyperkalemia, set: setAldosteroneNotUsedHyperkalemia, label: 'Hyperkalemia' },
                  { val: aldosteroneNotUsedHyponatremia, set: setAldosteroneNotUsedHyponatremia, label: 'Hyponatremia' },
                  { val: aldosteroneNotUsedElevatedCreatinine, set: setAldosteroneNotUsedElevatedCreatinine, label: 'Elevated creatinine (Renal failure)' },
                  { val: aldosteroneNotUsedOther, set: setAldosteroneNotUsedOther, label: 'Other' }
                ].map((item) => (
                  <label key={item.label} className="flex items-center gap-1.5 cursor-pointer text-slate-700">
                    <input disabled={readOnly}
                      type="checkbox"
                      checked={item.val === 'Yes'}
                      onChange={(e) => item.set(e.target.checked ? 'Yes' : 'No')}
                      className="rounded border-slate-300 text-teal-600 focus:ring-teal-500 w-3.5 h-3.5"
                    />
                    <span>{item.label}</span>
                  </label>
                ))}
              </div>
              {aldosteroneNotUsedOther === 'Yes' && (
                <div className="mt-1.5">
                  <input disabled={readOnly}
                    type="text"
                    value={aldosteroneNotUsedOtherReason}
                    onChange={(e) => setAldosteroneNotUsedOtherReason(e.target.value)}
                    className="border border-slate-300 rounded p-1 text-xs w-full focus:ring-1 focus:ring-teal-500 focus:border-teal-500 outline-none"
                    placeholder="Specify other reason..."
                  />
                </div>
              )}
            </div>
          </div>

          {/* Hydralazine Row */}
          <div className="grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-slate-200">
            <div className="lg:col-span-3 bg-slate-50/70 p-3 flex flex-col justify-center">
              <span className="font-bold text-slate-800 text-[11px] uppercase">Hydralazine</span>
            </div>
            <div className="lg:col-span-9 p-3">
              <div className="flex items-center gap-3">
                <input disabled={readOnly}
                  type="checkbox"
                  checked={hydralazine === 'Yes'}
                  onChange={(e) => setHydralazine(e.target.checked ? 'Yes' : 'No')}
                  className="rounded border-slate-300 text-teal-600 focus:ring-teal-500 w-3.5 h-3.5"
                />
                {hydralazine === 'Yes' && (
                  <div className="flex items-center gap-1.5 flex-1">
                    <input disabled={readOnly}
                      type="text"
                      value={hydralazineName}
                      onChange={(e) => setHydralazineName(e.target.value)}
                      className="border border-slate-300 rounded p-1.5 text-xs flex-1 max-w-md focus:ring-1 focus:ring-teal-500 focus:border-teal-500 outline-none"
                      placeholder="Details"
                    />
                    <input disabled={readOnly}
                      type="text"
                      value={hydralazineDose}
                      onChange={(e) => setHydralazineDose(e.target.value)}
                      className="border border-slate-300 rounded p-1.5 text-xs w-28 focus:ring-1 focus:ring-teal-500 focus:border-teal-500 outline-none text-right"
                      placeholder="Dose"
                    />
                    <span className="text-[10px] text-slate-400">/per day</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Nitrate Row */}
          <div className="grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-slate-200">
            <div className="lg:col-span-3 bg-slate-50/70 p-3 flex flex-col justify-center">
              <span className="font-bold text-slate-800 text-[11px] uppercase">Nitrate</span>
            </div>
            <div className="lg:col-span-9 p-3 space-y-3">
              {[
                { val: nitrate1, set: setNitrate1, name: nitrate1Name, setName: setNitrate1Name, dose: nitrate1Dose, setDose: setNitrate1Dose, label: 'Nitrate 1' },
                { val: nitrate2, set: setNitrate2, name: nitrate2Name, setName: setNitrate2Name, dose: nitrate2Dose, setDose: setNitrate2Dose, label: 'Nitrate 2' }
              ].map((nitrate, idx) => (
                <div key={idx} className="flex items-center gap-3">
                  <input disabled={readOnly}
                    type="checkbox"
                    checked={nitrate.val === 'Yes'}
                    onChange={(e) => nitrate.set(e.target.checked ? 'Yes' : 'No')}
                    className="rounded border-slate-300 text-teal-600 focus:ring-teal-500 w-3.5 h-3.5"
                  />
                  {nitrate.val === 'Yes' && (
                    <div className="flex items-center gap-1.5 flex-1">
                      <input disabled={readOnly}
                        type="text"
                        value={nitrate.name}
                        onChange={(e) => nitrate.setName(e.target.value)}
                        className="border border-slate-300 rounded p-1.5 text-xs flex-1 max-w-md focus:ring-1 focus:ring-teal-500 focus:border-teal-500 outline-none"
                        placeholder={`${nitrate.label} Details`}
                      />
                      <input disabled={readOnly}
                        type="text"
                        value={nitrate.dose}
                        onChange={(e) => nitrate.setDose(e.target.value)}
                        className="border border-slate-300 rounded p-1.5 text-xs w-28 focus:ring-1 focus:ring-teal-500 focus:border-teal-500 outline-none text-right"
                        placeholder="Dose"
                      />
                      <span className="text-[10px] text-slate-400">/per day</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Anticoagulation Row */}
          <div className="grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-slate-200">
            <div className="lg:col-span-3 bg-slate-50/70 p-3 flex flex-col justify-center">
              <span className="font-bold text-slate-800 text-[11px] uppercase">Anticoagulation</span>
            </div>
            <div className="lg:col-span-9 p-3 space-y-3">
              {/* Warfarin */}
              <div className="flex flex-col sm:flex-row sm:items-center gap-3 pb-2 border-b border-slate-100">
                <label className="flex items-center gap-1.5 cursor-pointer whitespace-nowrap">
                  <input disabled={readOnly}
                    type="checkbox"
                    checked={warfarin === 'Yes'}
                    onChange={(e) => setWarfarin(e.target.checked ? 'Yes' : 'No')}
                    className="rounded border-slate-300 text-teal-600 focus:ring-teal-500 w-3.5 h-3.5"
                  />
                  <span className="font-medium text-slate-700">Warfarin</span>
                </label>
                {warfarin === 'Yes' && (
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1">
                      <span className="text-xs text-slate-600">INR:</span>
                      <input disabled={readOnly}
                        type="text"
                        value={warfarinInr}
                        onChange={(e) => setWarfarinInr(e.target.value)}
                        className="border border-slate-300 rounded p-1 text-xs w-20 focus:ring-1 focus:ring-teal-500 focus:border-teal-500 outline-none text-right"
                        placeholder="INR"
                      />
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="text-xs text-slate-600">Target INR:</span>
                      <input disabled={readOnly}
                        type="text"
                        value={warfarinTargetInr}
                        onChange={(e) => setWarfarinTargetInr(e.target.value)}
                        className="border border-slate-300 rounded p-1 text-xs w-20 focus:ring-1 focus:ring-teal-500 focus:border-teal-500 outline-none text-right"
                        placeholder="Target INR"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Vitamin K Inhibitor */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-100">
                <label className="flex items-center gap-1.5 cursor-pointer whitespace-nowrap">
                  <input disabled={readOnly}
                    type="checkbox"
                    checked={vitaminKInhibitor === 'Yes'}
                    onChange={(e) => setVitaminKInhibitor(e.target.checked ? 'Yes' : 'No')}
                    className="rounded border-slate-300 text-teal-600 focus:ring-teal-500 w-3.5 h-3.5"
                  />
                  <span className="font-medium text-slate-700">Vitamin K Inhibitor</span>
                </label>
                {vitaminKInhibitor === 'Yes' && (
                  <div className="flex items-center gap-1.5">
                    <input disabled={readOnly}
                      type="text"
                      value={vitaminKInhibitorName}
                      onChange={(e) => setVitaminKInhibitorName(e.target.value)}
                      className="border border-slate-300 rounded p-1 text-xs w-36 focus:ring-1 focus:ring-teal-500 focus:border-teal-500 outline-none"
                      placeholder="Name"
                    />
                    <input disabled={readOnly}
                      type="text"
                      value={vitaminKInhibitorDose}
                      onChange={(e) => setVitaminKInhibitorDose(e.target.value)}
                      className="border border-slate-300 rounded p-1 text-xs w-24 focus:ring-1 focus:ring-teal-500 focus:border-teal-500 outline-none text-right"
                      placeholder="Dose"
                    />
                    <span className="text-[10px] text-slate-400">/per day</span>
                  </div>
                )}
              </div>

              {/* NOAC */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-100">
                <label className="flex items-center gap-1.5 cursor-pointer whitespace-nowrap">
                  <input disabled={readOnly}
                    type="checkbox"
                    checked={noac === 'Yes'}
                    onChange={(e) => setNoac(e.target.checked ? 'Yes' : 'No')}
                    className="rounded border-slate-300 text-teal-600 focus:ring-teal-500 w-3.5 h-3.5"
                  />
                  <span className="font-medium text-slate-700">NOAC</span>
                </label>
                {noac === 'Yes' && (
                  <div className="flex items-center gap-1.5">
                    <input disabled={readOnly}
                      type="text"
                      value={noacName}
                      onChange={(e) => setNoacName(e.target.value)}
                      className="border border-slate-300 rounded p-1 text-xs w-36 focus:ring-1 focus:ring-teal-500 focus:border-teal-500 outline-none"
                      placeholder="Name"
                    />
                    <input disabled={readOnly}
                      type="text"
                      value={noacDose}
                      onChange={(e) => setNoacDose(e.target.value)}
                      className="border border-slate-300 rounded p-1 text-xs w-24 focus:ring-1 focus:ring-teal-500 focus:border-teal-500 outline-none text-right"
                      placeholder="Dose"
                    />
                    <span className="text-[10px] text-slate-400">/per day</span>
                  </div>
                )}
              </div>

              {/* Acitrom, UFH, LMWH */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[
                  { val: acitrom, set: setAcitrom, dose: acitromDose, setDose: setAcitromDose, label: 'Acitrom' },
                  { val: ufh, set: setUfh, dose: ufhDose, setDose: setUfhDose, label: 'UFH' },
                  { val: lmwh, set: setLmwh, dose: lmwhDose, setDose: setLmwhDose, label: 'LMWH' }
                ].map((drug) => (
                  <div key={drug.label} className="flex items-center justify-between gap-2">
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input disabled={readOnly}
                        type="checkbox"
                        checked={drug.val === 'Yes'}
                        onChange={(e) => drug.set(e.target.checked ? 'Yes' : 'No')}
                        className="rounded border-slate-300 text-teal-600 focus:ring-teal-500 w-3.5 h-3.5"
                      />
                      <span className="font-medium text-slate-700">{drug.label}</span>
                    </label>
                    {drug.val === 'Yes' && (
                      <div className="flex items-center gap-1">
                        <input disabled={readOnly}
                          type="text"
                          value={drug.dose}
                          onChange={(e) => drug.setDose(e.target.value)}
                          className="border border-slate-300 rounded p-1 text-xs w-20 focus:ring-1 focus:ring-teal-500 focus:border-teal-500 outline-none text-right"
                          placeholder="Dose"
                        />
                        <span className="text-[10px] text-slate-400">/day</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Antiplatelets Row */}
          <div className="grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-slate-200">
            <div className="lg:col-span-3 bg-slate-50/70 p-3 flex flex-col justify-center">
              <span className="font-bold text-slate-800 text-[11px] uppercase">Anti-platelet</span>
            </div>
            <div className="lg:col-span-9 p-3 space-y-2">
              {[
                { val: aspirin, set: setAspirin, dose: aspirinDose, setDose: setAspirinDose, label: 'Aspirin' },
                { val: clopidogrel, set: setClopidogrel, dose: clopidogrelDose, setDose: setClopidogrelDose, label: 'Clopidogrel' },
                { val: prasugrel, set: setPrasugrel, dose: prasugrelDose, setDose: setPrasugrelDose, label: 'Prasugrel' },
                { val: ticagrelor, set: setTicagrelor, dose: ticagrelorDose, setDose: setTicagrelorDose, label: 'Ticagrelor' }
              ].map((drug) => (
                <div key={drug.label} className="flex items-center justify-between gap-2 py-0.5">
                  <label className="flex items-center gap-1.5 cursor-pointer whitespace-nowrap">
                    <input disabled={readOnly}
                      type="checkbox"
                      checked={drug.val === 'Yes'}
                      onChange={(e) => drug.set(e.target.checked ? 'Yes' : 'No')}
                      className="rounded border-slate-300 text-teal-600 focus:ring-teal-500 w-3.5 h-3.5"
                    />
                    <span className="font-medium text-slate-700">{drug.label}</span>
                  </label>
                  {drug.val === 'Yes' && (
                    <div className="flex items-center gap-1">
                      <input disabled={readOnly}
                        type="text"
                        value={drug.dose}
                        onChange={(e) => drug.setDose(e.target.value)}
                        className="border border-slate-300 rounded p-1 text-xs w-24 focus:ring-1 focus:ring-teal-500 focus:border-teal-500 outline-none text-right"
                        placeholder="Dose"
                      />
                      <span className="text-[10px] text-slate-400">/per day</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Antiarrhythmics Row */}
          <div className="grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-slate-200">
            <div className="lg:col-span-3 bg-slate-50/70 p-3 flex flex-col justify-center">
              <span className="font-bold text-slate-800 text-[11px] uppercase">Antiarrhythmic</span>
            </div>
            <div className="lg:col-span-9 p-3 space-y-2">
              {[
                { val: amiodarone, set: setAmiodarone, dose: amiodaroneDose, setDose: setAmiodaroneDose, label: 'Amiodarone' },
                { val: antiarrhythmicOther, set: setAntiarrhythmicOther, dose: antiarrhythmicOtherDose, setDose: setAntiarrhythmicOtherDose, label: 'Other:', name: antiarrhythmicOtherName, setName: setAntiarrhythmicOtherName }
              ].map((drug) => (
                <div key={drug.label} className="flex items-center justify-between gap-2 py-0.5">
                  <label className="flex items-center gap-1.5 cursor-pointer whitespace-nowrap">
                    <input disabled={readOnly}
                      type="checkbox"
                      checked={drug.val === 'Yes'}
                      onChange={(e) => drug.set(e.target.checked ? 'Yes' : 'No')}
                      className="rounded border-slate-300 text-teal-600 focus:ring-teal-500 w-3.5 h-3.5"
                    />
                    <span className="font-medium text-slate-700">{drug.label}</span>
                  </label>
                  {drug.val === 'Yes' && (
                    <div className="flex items-center gap-1.5">
                      {drug.name !== undefined && (
                        <input disabled={readOnly}
                          type="text"
                          value={drug.name}
                          onChange={(e) => drug.setName(e.target.value)}
                          className="border border-slate-300 rounded p-1 text-xs w-36 focus:ring-1 focus:ring-teal-500 focus:border-teal-500 outline-none"
                          placeholder="Details"
                        />
                      )}
                      <input disabled={readOnly}
                        type="text"
                        value={drug.dose}
                        onChange={(e) => drug.setDose(e.target.value)}
                        className="border border-slate-300 rounded p-1 text-xs w-24 focus:ring-1 focus:ring-teal-500 focus:border-teal-500 outline-none text-right"
                        placeholder="Dose"
                      />
                      <span className="text-[10px] text-slate-400">/per day</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Diuretics Row */}
          <div className="grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-slate-200">
            <div className="lg:col-span-3 bg-slate-50/70 p-3 flex flex-col justify-center">
              <span className="font-bold text-slate-800 text-[11px] uppercase">Diuretic</span>
            </div>
            <div className="lg:col-span-5 p-3 space-y-2">
              {[
                { val: furosemide, set: setFurosemide, dose: furosemideDose, setDose: setFurosemideDose, label: 'Furosemide' },
                { val: torsemide, set: setTorsemide, dose: torsemideDose, setDose: setTorsemideDose, label: 'Torsemide' },
                { val: metolazone, set: setMetolazone, dose: metolazoneDose, setDose: setMetolazoneDose, label: 'Metolazone' },
                { val: diureticOther, set: setDiureticOther, dose: diureticOtherDose, setDose: setDiureticOtherDose, label: 'Other:', name: diureticOtherName, setName: setDiureticOtherName }
              ].map((drug) => (
                <div key={drug.label} className="flex items-center justify-between gap-2 py-0.5">
                  <label className="flex items-center gap-1.5 cursor-pointer whitespace-nowrap">
                    <input disabled={readOnly}
                      type="checkbox"
                      checked={drug.val === 'Yes'}
                      onChange={(e) => drug.set(e.target.checked ? 'Yes' : 'No')}
                      className="rounded border-slate-300 text-teal-600 focus:ring-teal-500 w-3.5 h-3.5"
                    />
                    <span className="font-medium text-slate-700">{drug.label}</span>
                  </label>
                  {drug.val === 'Yes' && (
                    <div className="flex items-center gap-1.5">
                      {drug.name !== undefined && (
                        <input disabled={readOnly}
                          type="text"
                          value={drug.name}
                          onChange={(e) => drug.setName(e.target.value)}
                          className="border border-slate-300 rounded p-1 text-xs w-36 focus:ring-1 focus:ring-teal-500 focus:border-teal-500 outline-none"
                          placeholder="Details"
                        />
                      )}
                      <input disabled={readOnly}
                        type="text"
                        value={drug.dose}
                        onChange={(e) => drug.setDose(e.target.value)}
                        className="border border-slate-300 rounded p-1 text-xs w-24 focus:ring-1 focus:ring-teal-500 focus:border-teal-500 outline-none text-right"
                        placeholder="Dose"
                      />
                      <span className="text-[10px] text-slate-400">/per day</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
            <div className="lg:col-span-4 p-3 bg-slate-50/30 space-y-2">
              <span className="block font-semibold text-slate-500 uppercase text-[9px] mb-1">Contraindication/reason not used:</span>
              <div className="grid grid-cols-2 gap-1.5">
                {[
                  { val: diureticNotUsedHyponatremia, set: setDiureticNotUsedHyponatremia, label: 'Hyponatremia' },
                  { val: diureticNotUsedHypokalemia, set: setDiureticNotUsedHypokalemia, label: 'Hypokalemia' },
                  { val: diureticNotUsedWorseningRenalFailure, set: setDiureticNotUsedWorseningRenalFailure, label: 'Worsening renal failure' },
                  { val: diureticNotUsedHypotension, set: setDiureticNotUsedHypotension, label: 'Hypotension' },
                  { val: diureticNotUsedOther, set: setDiureticNotUsedOther, label: 'Other' }
                ].map((item) => (
                  <label key={item.label} className="flex items-center gap-1.5 cursor-pointer text-slate-700">
                    <input disabled={readOnly}
                      type="checkbox"
                      checked={item.val === 'Yes'}
                      onChange={(e) => item.set(e.target.checked ? 'Yes' : 'No')}
                      className="rounded border-slate-300 text-teal-600 focus:ring-teal-500 w-3.5 h-3.5"
                    />
                    <span>{item.label}</span>
                  </label>
                ))}
              </div>
              {diureticNotUsedOther === 'Yes' && (
                <div className="mt-1.5">
                  <input disabled={readOnly}
                    type="text"
                    value={diureticNotUsedOtherReason}
                    onChange={(e) => setDiureticNotUsedOtherReason(e.target.value)}
                    className="border border-slate-300 rounded p-1 text-xs w-full focus:ring-1 focus:ring-teal-500 focus:border-teal-500 outline-none"
                    placeholder="Specify other reason..."
                  />
                </div>
              )}
            </div>
          </div>

          {/* Digoxin Row */}
          <div className="grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-slate-200">
            <div className="lg:col-span-3 bg-slate-50/70 p-3 flex flex-col justify-center">
              <span className="font-bold text-slate-800 text-[11px] uppercase">Digoxin</span>
            </div>
            <div className="lg:col-span-9 p-3">
              <div className="flex items-center gap-3">
                <input disabled={readOnly}
                  type="checkbox"
                  checked={digoxin === 'Yes'}
                  onChange={(e) => setDigoxin(e.target.checked ? 'Yes' : 'No')}
                  className="rounded border-slate-300 text-teal-600 focus:ring-teal-500 w-3.5 h-3.5"
                />
                {digoxin === 'Yes' && (
                  <div className="flex items-center gap-1.5 flex-1">
                    <input disabled={readOnly}
                      type="text"
                      value={digoxinName}
                      onChange={(e) => setDigoxinName(e.target.value)}
                      className="border border-slate-300 rounded p-1.5 text-xs flex-1 max-w-md focus:ring-1 focus:ring-teal-500 focus:border-teal-500 outline-none"
                      placeholder="Details"
                    />
                    <input disabled={readOnly}
                      type="text"
                      value={digoxinDose}
                      onChange={(e) => setDigoxinDose(e.target.value)}
                      className="border border-slate-300 rounded p-1.5 text-xs w-28 focus:ring-1 focus:ring-teal-500 focus:border-teal-500 outline-none text-right"
                      placeholder="Dose"
                    />
                    <span className="text-[10px] text-slate-400">/per day</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Ivabradine Row */}
          <div className="grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-slate-200">
            <div className="lg:col-span-3 bg-slate-50/70 p-3 flex flex-col justify-center">
              <span className="font-bold text-slate-800 text-[11px] uppercase">Ivabradine</span>
            </div>
            <div className="lg:col-span-9 p-3">
              <div className="flex items-center justify-between gap-2 py-0.5">
                <label className="flex items-center gap-1.5 cursor-pointer whitespace-nowrap">
                  <input disabled={readOnly}
                    type="checkbox"
                    checked={ivabradine === 'Yes'}
                    onChange={(e) => setIvabradine(e.target.checked ? 'Yes' : 'No')}
                    className="rounded border-slate-300 text-teal-600 focus:ring-teal-500 w-3.5 h-3.5"
                  />
                  <span className="font-medium text-slate-700">Ivabradine</span>
                </label>
                {ivabradine === 'Yes' && (
                  <div className="flex items-center gap-1">
                    <input disabled={readOnly}
                      type="text"
                      value={ivabradineDose}
                      onChange={(e) => setIvabradineDose(e.target.value)}
                      className="border border-slate-300 rounded p-1 text-xs w-24 focus:ring-1 focus:ring-teal-500 focus:border-teal-500 outline-none text-right"
                      placeholder="Dose"
                    />
                    <span className="text-[10px] text-slate-400">/per day</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Statins Row */}
          <div className="grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-slate-200">
            <div className="lg:col-span-3 bg-slate-50/70 p-3 flex flex-col justify-center">
              <span className="font-bold text-slate-800 text-[11px] uppercase">Statins</span>
            </div>
            <div className="lg:col-span-9 p-3 space-y-2">
              {[
                { val: atorvastatin, set: setAtorvastatin, dose: atorvastatinDose, setDose: setAtorvastatinDose, label: 'Atorvastatin' },
                { val: simvastatin, set: setSimvastatin, dose: simvastatinDose, setDose: setSimvastatinDose, label: 'Simvastatin' },
                { val: rosuvastatin, set: setRosuvastatin, dose: rosuvastatinDose, setDose: setRosuvastatinDose, label: 'Rosuvastatin' }
              ].map((drug) => (
                <div key={drug.label} className="flex items-center justify-between gap-2 py-0.5">
                  <label className="flex items-center gap-1.5 cursor-pointer whitespace-nowrap">
                    <input disabled={readOnly}
                      type="checkbox"
                      checked={drug.val === 'Yes'}
                      onChange={(e) => drug.set(e.target.checked ? 'Yes' : 'No')}
                      className="rounded border-slate-300 text-teal-600 focus:ring-teal-500 w-3.5 h-3.5"
                    />
                    <span className="font-medium text-slate-700">{drug.label}</span>
                  </label>
                  {drug.val === 'Yes' && (
                    <div className="flex items-center gap-1">
                      <input disabled={readOnly}
                        type="text"
                        value={drug.dose}
                        onChange={(e) => drug.setDose(e.target.value)}
                        className="border border-slate-300 rounded p-1 text-xs w-24 focus:ring-1 focus:ring-teal-500 focus:border-teal-500 outline-none text-right"
                        placeholder="Dose"
                      />
                      <span className="text-[10px] text-slate-400">/per day</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Antidiabetics Row */}
          <div className="grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-slate-200">
            <div className="lg:col-span-3 bg-slate-50/70 p-3 flex flex-col justify-center">
              <span className="font-bold text-slate-800 text-[11px] uppercase">Antidiabetics</span>
            </div>
            <div className="lg:col-span-9 p-3 space-y-2">
              {[
                { val: sulfonylureas, set: setSulfonylureas, dose: sulfonylureasDose, setDose: setSulfonylureasDose, label: 'Sulfonylureas' },
                { val: metformin, set: setMetformin, dose: metforminDose, setDose: setMetforminDose, label: 'Metformin' },
                { val: glitazone, set: setGlitazone, dose: glitazoneDose, setDose: setGlitazoneDose, label: 'Glitazone' },
                { val: gliptin, set: setGliptin, dose: gliptinDose, setDose: setGliptinDose, label: 'Gliptin' },
                { val: acarboseDerivative, set: setAcarboseDerivative, dose: acarboseDerivativeDose, setDose: setAcarboseDerivativeDose, label: 'Acarbose Derivative' },
                { val: humanInsulin, set: setHumanInsulin, dose: humanInsulinDose, setDose: setHumanInsulinDose, label: 'Human Insulin' },
                { val: syntheticInsulin, set: setSyntheticInsulin, dose: syntheticInsulinDose, setDose: setSyntheticInsulinDose, label: 'Synthetic Insulin' }
              ].map((drug) => (
                <div key={drug.label} className="flex items-center justify-between gap-2 py-0.5">
                  <label className="flex items-center gap-1.5 cursor-pointer whitespace-nowrap">
                    <input disabled={readOnly}
                      type="checkbox"
                      checked={drug.val === 'Yes'}
                      onChange={(e) => drug.set(e.target.checked ? 'Yes' : 'No')}
                      className="rounded border-slate-300 text-teal-600 focus:ring-teal-500 w-3.5 h-3.5"
                    />
                    <span className="font-medium text-slate-700">{drug.label}</span>
                  </label>
                  {drug.val === 'Yes' && (
                    <div className="flex items-center gap-1">
                      <input disabled={readOnly}
                        type="text"
                        value={drug.dose}
                        onChange={(e) => drug.setDose(e.target.value)}
                        className="border border-slate-300 rounded p-1 text-xs w-24 focus:ring-1 focus:ring-teal-500 focus:border-teal-500 outline-none text-right"
                        placeholder="Dose"
                      />
                      <span className="text-[10px] text-slate-400">/per day</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Other Row */}
          <div className="grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-slate-200">
            <div className="lg:col-span-3 bg-slate-50/70 p-3 flex flex-col justify-center">
              <span className="font-bold text-slate-800 text-[11px] uppercase">Other</span>
            </div>
            <div className="lg:col-span-9 p-3 space-y-3">
              {/* Anti-hypertensive */}
              <div className="flex items-center justify-between gap-2 py-0.5">
                <label className="flex items-center gap-1.5 cursor-pointer whitespace-nowrap">
                  <input disabled={readOnly}
                    type="checkbox"
                    checked={antihypertensive === 'Yes'}
                    onChange={(e) => setAntihypertensive(e.target.checked ? 'Yes' : 'No')}
                    className="rounded border-slate-300 text-teal-600 focus:ring-teal-500 w-3.5 h-3.5"
                  />
                  <span className="font-medium text-slate-700">Anti-hypertensive</span>
                </label>
                {antihypertensive === 'Yes' && (
                  <div className="flex items-center gap-1.5">
                    <input disabled={readOnly}
                      type="text"
                      value={antihypertensiveName}
                      onChange={(e) => setAntihypertensiveName(e.target.value)}
                      className="border border-slate-300 rounded p-1 text-xs w-36 focus:ring-1 focus:ring-teal-500 focus:border-teal-500 outline-none"
                      placeholder="Details"
                    />
                    <input disabled={readOnly}
                      type="text"
                      value={antihypertensiveDose}
                      onChange={(e) => setAntihypertensiveDose(e.target.value)}
                      className="border border-slate-300 rounded p-1 text-xs w-24 focus:ring-1 focus:ring-teal-500 focus:border-teal-500 outline-none text-right"
                      placeholder="Dose"
                    />
                    <span className="text-[10px] text-slate-400">/per day</span>
                  </div>
                )}
              </div>

              {/* Thyroxine */}
              <div className="flex items-center justify-between gap-2 py-0.5">
                <label className="flex items-center gap-1.5 cursor-pointer whitespace-nowrap">
                  <input disabled={readOnly}
                    type="checkbox"
                    checked={thyroxine === 'Yes'}
                    onChange={(e) => setThyroxine(e.target.checked ? 'Yes' : 'No')}
                    className="rounded border-slate-300 text-teal-600 focus:ring-teal-500 w-3.5 h-3.5"
                  />
                  <span className="font-medium text-slate-700">Thyroxine</span>
                </label>
                {thyroxine === 'Yes' && (
                  <div className="flex items-center gap-1">
                    <input disabled={readOnly}
                      type="text"
                      value={thyroxineDose}
                      onChange={(e) => setThyroxineDose(e.target.value)}
                      className="border border-slate-300 rounded p-1 text-xs w-24 focus:ring-1 focus:ring-teal-500 focus:border-teal-500 outline-none text-right"
                      placeholder="Dose"
                    />
                    <span className="text-[10px] text-slate-400">/per day</span>
                  </div>
                )}
              </div>

              {/* Custom Other Medications 1 - 4 */}
              {[
                { val: otherMedication1, set: setOtherMedication1, name: otherMedication1Name, setName: setOtherMedication1Name, dose: otherMedication1Dose, setDose: setOtherMedication1Dose, label: 'Other Medication 1' },
                { val: otherMedication2, set: setOtherMedication2, name: otherMedication2Name, setName: setOtherMedication2Name, dose: otherMedication2Dose, setDose: setOtherMedication2Dose, label: 'Other Medication 2' },
                { val: otherMedication3, set: setOtherMedication3, name: otherMedication3Name, setName: setOtherMedication3Name, dose: otherMedication3Dose, setDose: setOtherMedication3Dose, label: 'Other Medication 3' },
                { val: otherMedication4, set: setOtherMedication4, name: otherMedication4Name, setName: setOtherMedication4Name, dose: otherMedication4Dose, setDose: setOtherMedication4Dose, label: 'Other Medication 4' }
              ].map((drug, idx) => (
                <div key={idx} className="flex items-center justify-between gap-3 pt-2 border-t border-slate-100 last:border-0">
                  <div className="flex items-center gap-3 flex-1">
                    <input disabled={readOnly}
                      type="checkbox"
                      checked={drug.val === 'Yes'}
                      onChange={(e) => drug.set(e.target.checked ? 'Yes' : 'No')}
                      className="rounded border-slate-300 text-teal-600 focus:ring-teal-500 w-3.5 h-3.5"
                    />
                    {drug.val === 'Yes' && (
                      <div className="flex items-center gap-1.5 flex-1">
                        <input disabled={readOnly}
                          type="text"
                          value={drug.name}
                          onChange={(e) => drug.setName(e.target.value)}
                          className="border border-slate-300 rounded p-1 text-xs flex-1 max-w-md focus:ring-1 focus:ring-teal-500 focus:border-teal-500 outline-none"
                          placeholder={`Other Medication ${idx + 1} Name`}
                        />
                        <input disabled={readOnly}
                          type="text"
                          value={drug.dose}
                          onChange={(e) => drug.setDose(e.target.value)}
                          className="border border-slate-300 rounded p-1.5 text-xs w-28 focus:ring-1 focus:ring-teal-500 focus:border-teal-500 outline-none text-right"
                          placeholder="Dose"
                        />
                        <span className="text-[10px] text-slate-400">/per day</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </SectionCard>\n\n      {/* 7. Device Therapy */}
      <SectionCard title="7. Device Therapy" subtitle="Current implanted devices and eligibility assessment">
        <div className="border border-slate-300 rounded-lg overflow-hidden text-xs bg-white divide-y divide-slate-300">
          
          {/* Current Device Therapy */}
          <div className="grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-slate-200">
            <div className="lg:col-span-3 bg-slate-50/70 p-3 flex flex-col justify-center">
              <span className="font-bold text-slate-800 text-[11px] uppercase">Current Device Therapy</span>
            </div>
            <div className="lg:col-span-9 p-3 space-y-3">
              <div className="flex items-center gap-6 pb-2 border-b border-slate-100">
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input disabled={readOnly}
                    type="checkbox"
                    checked={currentDeviceNone === 'Yes'}
                    onChange={(e) => {
                      const val = e.target.checked ? 'Yes' : 'No';
                      setCurrentDeviceNone(val);
                      if (val === 'Yes') {
                        setCurrentDeviceYes('No');
                        setCurrentCrtP('No');
                        setCurrentCrtD('No');
                        setCurrentIcdSc('No');
                        setCurrentIcdDc('No');
                        setCurrentDualChamberPacemaker('No');
                        setCurrentSingleChamberPacemaker('No');
                        setCurrentDeviceOther('No');
                        setCurrentDeviceOtherName('');
                        setCurrentDeviceBrand('');
                      }
                    }}
                    className="rounded border-slate-300 text-teal-600 focus:ring-teal-500 w-3.5 h-3.5"
                  />
                  <span className="font-medium text-slate-700">No Device</span>
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input disabled={readOnly}
                    type="checkbox"
                    checked={currentDeviceYes === 'Yes'}
                    onChange={(e) => {
                      const val = e.target.checked ? 'Yes' : 'No';
                      setCurrentDeviceYes(val);
                      if (val === 'Yes') {
                        setCurrentDeviceNone('No');
                      }
                    }}
                    className="rounded border-slate-300 text-teal-600 focus:ring-teal-500 w-3.5 h-3.5"
                  />
                  <span className="font-medium text-slate-700">Yes, Has Device</span>
                </label>
              </div>

              {currentDeviceYes === 'Yes' && (
                <div className="space-y-3 animate-fadeIn">
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {[
                      { val: currentCrtP, set: setCurrentCrtP, label: 'CRT-P' },
                      { val: currentCrtD, set: setCurrentCrtD, label: 'CRT-D' },
                      { val: currentIcdSc, set: setCurrentIcdSc, label: 'ICD-SC' },
                      { val: currentIcdDc, set: setCurrentIcdDc, label: 'ICD-DC' },
                      { val: currentDualChamberPacemaker, set: setCurrentDualChamberPacemaker, label: 'Dual Chamber Pacer Mode' },
                      { val: currentSingleChamberPacemaker, set: setCurrentSingleChamberPacemaker, label: 'Single Chamber Pacer Mode' },
                      { val: currentDeviceOther, set: setCurrentDeviceOther, label: 'Other', isOther: true }
                    ].map((device) => (
                      <div key={device.label} className="flex flex-col gap-1">
                        <label className="flex items-center gap-1.5 cursor-pointer">
                          <input disabled={readOnly}
                            type="checkbox"
                            checked={device.val === 'Yes'}
                            onChange={(e) => device.set(e.target.checked ? 'Yes' : 'No')}
                            className="rounded border-slate-300 text-teal-600 focus:ring-teal-500 w-3.5 h-3.5"
                          />
                          <span className="text-slate-700">{device.label}</span>
                        </label>
                        {device.isOther && device.val === 'Yes' && (
                          <input disabled={readOnly}
                            type="text"
                            value={currentDeviceOtherName}
                            onChange={(e) => setCurrentDeviceOtherName(e.target.value)}
                            className="border border-slate-300 rounded p-1 text-xs w-full focus:ring-1 focus:ring-teal-500 focus:border-teal-500 outline-none"
                            placeholder="Specify device..."
                          />
                        )}
                      </div>
                    ))}
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Device Brand / Model</label>
                    <input disabled={readOnly}
                      type="text"
                      value={currentDeviceBrand}
                      onChange={(e) => setCurrentDeviceBrand(e.target.value)}
                      className="border border-slate-300 rounded p-1.5 text-xs w-full max-w-md focus:ring-1 focus:ring-teal-500 focus:border-teal-500 outline-none"
                      placeholder="E.g. Medtronic, Boston Scientific"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Eligibility for device therapy */}
          <div className="grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-slate-200">
            <div className="lg:col-span-3 bg-slate-50/70 p-3 flex flex-col justify-center">
              <span className="font-bold text-slate-800 text-[11px] uppercase">Eligibility for Device Therapy</span>
            </div>
            <div className="lg:col-span-9 p-3 space-y-3">
              <div className="flex items-center gap-6 pb-2 border-b border-slate-100">
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input disabled={readOnly}
                    type="checkbox"
                    checked={eligibleNo === 'Yes'}
                    onChange={(e) => {
                      const val = e.target.checked ? 'Yes' : 'No';
                      setEligibleNo(val);
                      if (val === 'Yes') {
                        setEligibleYes('No');
                        setEligibleCrtP('No');
                        setEligibleCrtD('No');
                        setEligibleIcdSc('No');
                        setEligibleIcdDc('No');
                        setEligibleDualChamberPacemaker('No');
                        setEligibleSingleChamberPacemaker('No');
                        setEligibleOther('No');
                        setEligibleOtherName('');
                        setEligibleDeviceBrand('');
                        setPatientAcceptanceYes('No');
                        setPatientAcceptanceNo('No');
                        setPatientAcceptanceReason('');
                      }
                    }}
                    className="rounded border-slate-300 text-teal-600 focus:ring-teal-500 w-3.5 h-3.5"
                  />
                  <span className="font-medium text-slate-700">Not Eligible</span>
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input disabled={readOnly}
                    type="checkbox"
                    checked={eligibleYes === 'Yes'}
                    onChange={(e) => {
                      const val = e.target.checked ? 'Yes' : 'No';
                      setEligibleYes(val);
                      if (val === 'Yes') {
                        setEligibleNo('No');
                      }
                    }}
                    className="rounded border-slate-300 text-teal-600 focus:ring-teal-500 w-3.5 h-3.5"
                  />
                  <span className="font-medium text-slate-700">Eligible</span>
                </label>
              </div>

              {eligibleYes === 'Yes' && (
                <div className="space-y-4 animate-fadeIn">
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {[
                      { val: eligibleCrtP, set: setEligibleCrtP, label: 'CRT-P' },
                      { val: eligibleCrtD, set: setEligibleCrtD, label: 'CRT-D' },
                      { val: eligibleIcdSc, set: setEligibleIcdSc, label: 'ICD-SC' },
                      { val: eligibleIcdDc, set: setEligibleIcdDc, label: 'ICD-DC' },
                      { val: eligibleDualChamberPacemaker, set: setEligibleDualChamberPacemaker, label: 'Dual Chamber Pacer Mode' },
                      { val: eligibleSingleChamberPacemaker, set: setEligibleSingleChamberPacemaker, label: 'Single Chamber Pacer Mode' },
                      { val: eligibleOther, set: setEligibleOther, label: 'Other', isOther: true }
                    ].map((device) => (
                      <div key={device.label} className="flex flex-col gap-1">
                        <label className="flex items-center gap-1.5 cursor-pointer">
                          <input disabled={readOnly}
                            type="checkbox"
                            checked={device.val === 'Yes'}
                            onChange={(e) => device.set(e.target.checked ? 'Yes' : 'No')}
                            className="rounded border-slate-300 text-teal-600 focus:ring-teal-500 w-3.5 h-3.5"
                          />
                          <span className="text-slate-700">{device.label}</span>
                        </label>
                        {device.isOther && device.val === 'Yes' && (
                          <input disabled={readOnly}
                            type="text"
                            value={eligibleOtherName}
                            onChange={(e) => setEligibleOtherName(e.target.value)}
                            className="border border-slate-300 rounded p-1 text-xs w-full focus:ring-1 focus:ring-teal-500 focus:border-teal-500 outline-none"
                            placeholder="Specify device..."
                          />
                        )}
                      </div>
                    ))}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">Recommended Brand / Model</label>
                      <input disabled={readOnly}
                        type="text"
                        value={eligibleDeviceBrand}
                        onChange={(e) => setEligibleDeviceBrand(e.target.value)}
                        className="border border-slate-300 rounded p-1.5 text-xs w-full focus:ring-1 focus:ring-teal-500 focus:border-teal-500 outline-none"
                        placeholder="E.g. Medtronic, Boston Scientific"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">Patient Acceptance</label>
                      <div className="flex items-center gap-4 mt-2">
                        <label className="flex items-center gap-1.5 cursor-pointer">
                          <input disabled={readOnly}
                            type="checkbox"
                            checked={patientAcceptanceYes === 'Yes'}
                            onChange={(e) => {
                              const val = e.target.checked ? 'Yes' : 'No';
                              setPatientAcceptanceYes(val);
                              if (val === 'Yes') {
                                setPatientAcceptanceNo('No');
                                setPatientAcceptanceReason('');
                              }
                            }}
                            className="rounded border-slate-300 text-teal-600 focus:ring-teal-500 w-3.5 h-3.5"
                          />
                          <span className="text-slate-700">Yes</span>
                        </label>
                        <label className="flex items-center gap-1.5 cursor-pointer">
                          <input disabled={readOnly}
                            type="checkbox"
                            checked={patientAcceptanceNo === 'Yes'}
                            onChange={(e) => {
                              const val = e.target.checked ? 'Yes' : 'No';
                              setPatientAcceptanceNo(val);
                              if (val === 'Yes') {
                                setPatientAcceptanceYes('No');
                              }
                            }}
                            className="rounded border-slate-300 text-teal-600 focus:ring-teal-500 w-3.5 h-3.5"
                          />
                          <span className="text-slate-700">No</span>
                        </label>
                      </div>
                    </div>
                  </div>

                  {patientAcceptanceNo === 'Yes' && (
                    <div className="animate-fadeIn">
                      <label className="block text-xs font-semibold text-slate-600 mb-1">If No, reasons:</label>
                      <textarea disabled={readOnly}
                        value={patientAcceptanceReason}
                        onChange={(e) => setPatientAcceptanceReason(e.target.value)}
                        className="border border-slate-300 rounded p-1.5 text-xs w-full focus:ring-1 focus:ring-teal-500 focus:border-teal-500 outline-none"
                        placeholder="Describe patient refusal or clinical reasons..."
                        rows={2}
                      />
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Date of Implant */}
          <div className="grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-slate-200">
            <div className="lg:col-span-3 bg-slate-50/70 p-3 flex flex-col justify-center">
              <span className="font-bold text-slate-800 text-[11px] uppercase">Date of Implant</span>
            </div>
            <div className="lg:col-span-9 p-3">
              <input disabled={readOnly}
                type="date"
                value={implantDate}
                onChange={(e) => setImplantDate(e.target.value)}
                className="border border-slate-300 rounded p-1.5 text-xs focus:ring-1 focus:ring-teal-500 focus:border-teal-500 outline-none w-full max-w-xs"
              />
            </div>
          </div>

          {/* ICD Therapy Administered */}
          <div className="grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-slate-200">
            <div className="lg:col-span-3 bg-slate-50/70 p-3 flex flex-col justify-center">
              <span className="font-bold text-slate-800 text-[11px] uppercase">ICD Therapy Administered</span>
            </div>
            <div className="lg:col-span-9 p-3 space-y-4">
              {/* ICD Shock */}
              <div className="space-y-3 pb-3 border-b border-slate-100">
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input disabled={readOnly}
                    type="checkbox"
                    checked={icdShock === 'Yes'}
                    onChange={(e) => setIcdShock(e.target.checked ? 'Yes' : 'No')}
                    className="rounded border-slate-300 text-teal-600 focus:ring-teal-500 w-3.5 h-3.5"
                  />
                  <span className="font-semibold text-slate-700">ICD Shock</span>
                </label>
                {icdShock === 'Yes' && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pl-5 animate-fadeIn">
                    <div>
                      <label className="block text-[10px] text-slate-600 mb-1"># of shocks</label>
                      <input disabled={readOnly}
                        type="number"
                        value={numberOfShocks}
                        onChange={(e) => setNumberOfShocks(e.target.value)}
                        className="border border-slate-300 rounded p-1 text-xs w-full focus:ring-1 focus:ring-teal-500 focus:border-teal-500 outline-none text-right"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-slate-600 mb-1"># of appropriate shocks</label>
                      <input disabled={readOnly}
                        type="number"
                        value={appropriateShocks}
                        onChange={(e) => setAppropriateShocks(e.target.value)}
                        className="border border-slate-300 rounded p-1 text-xs w-full focus:ring-1 focus:ring-teal-500 focus:border-teal-500 outline-none text-right"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-slate-600 mb-1"># of inappropriate shocks</label>
                      <input disabled={readOnly}
                        type="number"
                        value={inappropriateShocks}
                        onChange={(e) => setInappropriateShocks(e.target.value)}
                        className="border border-slate-300 rounded p-1 text-xs w-full focus:ring-1 focus:ring-teal-500 focus:border-teal-500 outline-none text-right"
                      />
                    </div>
                    <div className="md:col-span-3">
                      <label className="block text-[10px] text-slate-600 mb-1">Cause of Shocks</label>
                      <input disabled={readOnly}
                        type="text"
                        value={causeOfShocks}
                        onChange={(e) => setCauseOfShocks(e.target.value)}
                        className="border border-slate-300 rounded p-1 text-xs w-full focus:ring-1 focus:ring-teal-500 focus:border-teal-500 outline-none"
                        placeholder="E.g. VT, VF, noise, SVT"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* ATP */}
              <div className="space-y-3">
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input disabled={readOnly}
                    type="checkbox"
                    checked={atp === 'Yes'}
                    onChange={(e) => setAtp(e.target.checked ? 'Yes' : 'No')}
                    className="rounded border-slate-300 text-teal-600 focus:ring-teal-500 w-3.5 h-3.5"
                  />
                  <span className="font-semibold text-slate-700">ATP</span>
                </label>
                {atp === 'Yes' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pl-5 animate-fadeIn">
                    <div>
                      <label className="block text-[10px] text-slate-600 mb-1"># of times</label>
                      <input disabled={readOnly}
                        type="number"
                        value={atpTimes}
                        onChange={(e) => setAtpTimes(e.target.value)}
                        className="border border-slate-300 rounded p-1 text-xs w-28 focus:ring-1 focus:ring-teal-500 focus:border-teal-500 outline-none text-right"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-slate-600 mb-1">ATP successful?</label>
                      <div className="flex flex-wrap items-center gap-3 mt-1.5">
                        {[
                          { val: atpSuccessAlways, set: setAtpSuccessAlways, label: 'Always' },
                          { val: atpSuccessMostTimes, set: setAtpSuccessMostTimes, label: 'Most times' },
                          { val: atpSuccessSometimes, set: setAtpSuccessSometimes, label: 'Sometimes' },
                          { val: atpSuccessNotSuccessful, set: setAtpSuccessNotSuccessful, label: 'Not successful' }
                        ].map((choice) => (
                          <label key={choice.label} className="flex items-center gap-1 cursor-pointer text-slate-700">
                            <input disabled={readOnly}
                              type="checkbox"
                              checked={choice.val === 'Yes'}
                              onChange={(e) => {
                                const checked = e.target.checked ? 'Yes' : 'No';
                                choice.set(checked);
                                if (checked === 'Yes') {
                                  if (choice.label !== 'Always') setAtpSuccessAlways('No');
                                  if (choice.label !== 'Most times') setAtpSuccessMostTimes('No');
                                  if (choice.label !== 'Sometimes') setAtpSuccessSometimes('No');
                                  if (choice.label !== 'Not successful') setAtpSuccessNotSuccessful('No');
                                }
                              }}
                              className="rounded-full border-slate-300 text-teal-600 focus:ring-teal-500 w-3 h-3"
                            />
                            <span className="text-[10px]">{choice.label}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Technical Log Parameters */}
          <div className="grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-slate-200">
            <div className="lg:col-span-3 bg-slate-50/70 p-3 flex flex-col justify-center">
              <span className="font-bold text-slate-800 text-[11px] uppercase">Technical Log Parameters</span>
            </div>
            <div className="lg:col-span-9 p-3 grid grid-cols-2 md:grid-cols-3 gap-3">
              <div>
                <label className="block text-[10px] text-slate-600 mb-1">BiV pacing (%)</label>
                <input disabled={readOnly}
                  type="text"
                  value={bivPacingPercent}
                  onChange={(e) => setBivPacingPercent(e.target.value)}
                  className="border border-slate-300 rounded p-1 text-xs w-full focus:ring-1 focus:ring-teal-500 focus:border-teal-500 outline-none text-right font-mono"
                  placeholder="E.g. 98.5"
                />
              </div>
              <div>
                <label className="block text-[10px] text-slate-600 mb-1">AFib burden</label>
                <input disabled={readOnly}
                  type="text"
                  value={afibBurden}
                  onChange={(e) => setAfibBurden(e.target.value)}
                  className="border border-slate-300 rounded p-1 text-xs w-full focus:ring-1 focus:ring-teal-500 focus:border-teal-500 outline-none font-mono"
                  placeholder="E.g. 2% or 10 min/day"
                />
              </div>
              <div>
                <label className="block text-[10px] text-slate-600 mb-1">NSVT episodes (#)</label>
                <input disabled={readOnly}
                  type="number"
                  value={nsvtEpisodes}
                  onChange={(e) => setNsvtEpisodes(e.target.value)}
                  className="border border-slate-300 rounded p-1 text-xs w-full focus:ring-1 focus:ring-teal-500 focus:border-teal-500 outline-none text-right font-mono"
                />
              </div>
              <div>
                <label className="block text-[10px] text-slate-600 mb-1">SVT episodes (#)</label>
                <input disabled={readOnly}
                  type="number"
                  value={svtEpisodes}
                  onChange={(e) => setSvtEpisodes(e.target.value)}
                  className="border border-slate-300 rounded p-1 text-xs w-full focus:ring-1 focus:ring-teal-500 focus:border-teal-500 outline-none text-right font-mono"
                />
              </div>
              <div className="col-span-2">
                <label className="block text-[10px] text-slate-600 mb-1">Device Volume alert</label>
                <input disabled={readOnly}
                  type="text"
                  value={deviceVolumeAlert}
                  onChange={(e) => setDeviceVolumeAlert(e.target.value)}
                  className="border border-slate-300 rounded p-1 text-xs w-full focus:ring-1 focus:ring-teal-500 focus:border-teal-500 outline-none"
                  placeholder="Details of any volume/fluid alerts"
                />
              </div>
            </div>
          </div>

          {/* Notes */}
          <div className="grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-slate-200">
            <div className="lg:col-span-3 bg-slate-50/70 p-3 flex flex-col justify-center">
              <span className="font-bold text-slate-800 text-[11px] uppercase">Notes</span>
            </div>
            <div className="lg:col-span-9 p-3">
              <textarea disabled={readOnly}
                value={deviceNotes}
                onChange={(e) => setDeviceNotes(e.target.value)}
                className="w-full border border-slate-300 rounded p-1.5 text-xs focus:ring-1 focus:ring-teal-500 focus:border-teal-500 outline-none"
                placeholder="Additional device notes..."
                rows={3}
              />
            </div>
          </div>

        </div>
      </SectionCard>

      {/* 8. Patient Education */}
      <SectionCard title="8. Patient Education" subtitle="Counseling topics documented for this visit">
        <div className="border border-slate-300 rounded-lg overflow-hidden text-xs bg-white divide-y divide-slate-300">
          <div className="grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-slate-200">
            <div className="lg:col-span-3 bg-slate-50/70 p-3 flex flex-col justify-center">
              <span className="font-bold text-slate-800 text-[11px] uppercase">Recommend Patient Education</span>
            </div>
            <div className="lg:col-span-9 p-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { val: eduDiet, set: setEduDiet, label: 'Diet: 2000-mg salt restriction' },
                  { val: eduExercise, set: setEduExercise, label: 'Exercise/activity promoted' },
                  { val: eduWeight, set: setEduWeight, label: 'Daily weight monitoring' },
                  { val: eduDisease, set: setEduDisease, label: 'Disease process explained' },
                  { val: eduSmoking, set: setEduSmoking, label: 'Smoking cessation' },
                  { val: eduAlcohol, set: setEduAlcohol, label: 'Alcohol cessation' },
                  { val: eduCompliance, set: setEduCompliance, label: 'Medication compliance' },
                  { val: eduWorsened, set: setEduWorsened, label: 'What to do for worsened symptoms' },
                  { val: eduDevice, set: setEduDevice, label: 'Device therapy education' },
                  { val: eduOther, set: setEduOther, label: 'Other', isOther: true }
                ].map((item) => (
                  <div key={item.label} className="flex flex-col gap-1.5 py-0.5">
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input disabled={readOnly}
                        type="checkbox"
                        checked={item.val === 'Yes'}
                        onChange={(e) => item.set(e.target.checked ? 'Yes' : 'No')}
                        className="rounded border-slate-300 text-teal-600 focus:ring-teal-500 w-3.5 h-3.5"
                      />
                      <span className="text-slate-700">{item.label}</span>
                    </label>
                    {item.isOther && item.val === 'Yes' && (
                      <input disabled={readOnly}
                        type="text"
                        value={eduOtherDetails}
                        onChange={(e) => setEduOtherDetails(e.target.value)}
                        className="border border-slate-300 rounded p-1.5 text-xs w-full max-w-md focus:ring-1 focus:ring-teal-500 focus:border-teal-500 outline-none"
                        placeholder="Specify other counseling topic..."
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </SectionCard>

      {/* 9. Recommendations */}
      <SectionCard title="9. Recommendations" subtitle="Discharge plan, follow-up and therapeutic guidance">
        <div className="border border-slate-300 rounded-lg overflow-hidden text-xs bg-white divide-y divide-slate-300">
          {[
            { val: recFluidDiet, set: setRecFluidDiet, details: recFluidDietDetails, setDetails: setRecFluidDietDetails, label: 'Fluid and Diet' },
            { val: recExercise, set: setRecExercise, details: recExerciseDetails, setDetails: setRecExerciseDetails, label: 'Exercise' },
            { val: recYoga, set: setRecYoga, details: recYogaDetails, setDetails: setRecYogaDetails, label: 'Yoga' },
            { val: recSmokingCessation, set: setRecSmokingCessation, details: recSmokingCessationDetails, setDetails: setRecSmokingCessationDetails, label: 'Smoking Cessation' },
            { val: recStressManagement, set: setRecStressManagement, details: recStressManagementDetails, setDetails: setRecStressManagementDetails, label: 'Stress Management' },
            { val: recDrugs, set: setRecDrugs, details: recDrugsDetails, setDetails: setRecDrugsDetails, label: 'Drugs' },
            { val: recInvestigations, set: setRecInvestigations, details: recInvestigationsDetails, setDetails: setRecInvestigationsDetails, label: 'Investigations' },
            { val: recProcedures, set: setRecProcedures, details: recProceduresDetails, setDetails: setRecProceduresDetails, label: 'Procedures' },
            { val: recOther, set: setRecOther, details: recOtherDetails, setDetails: setRecOtherDetails, label: 'Others' }
          ].map((rec) => (
            <div key={rec.label} className="grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-slate-200">
              <div className="lg:col-span-3 bg-slate-50/70 p-3 flex items-center">
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input disabled={readOnly}
                    type="checkbox"
                    checked={rec.val === 'Yes'}
                    onChange={(e) => rec.set(e.target.checked ? 'Yes' : 'No')}
                    className="rounded border-slate-300 text-teal-600 focus:ring-teal-500 w-3.5 h-3.5"
                  />
                  <span className="font-bold text-slate-800 text-[11px] uppercase">{rec.label}</span>
                </label>
              </div>
              <div className="lg:col-span-9 p-3">
                {rec.val === 'Yes' ? (
                  <textarea disabled={readOnly}
                    value={rec.details}
                    onChange={(e) => rec.setDetails(e.target.value)}
                    className="w-full border border-slate-300 rounded p-1.5 text-xs focus:ring-1 focus:ring-teal-500 focus:border-teal-500 outline-none animate-fadeIn"
                    placeholder={`Details for ${rec.label}...`}
                    rows={2}
                  />
                ) : (
                  <span className="text-slate-400 italic text-[11px]">Not recommended</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </SectionCard>
    </div>
    </fieldset>
  );
});

export default hf;