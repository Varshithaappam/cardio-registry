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
import { validateField } from '../../utils/validation';

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
  'Direct'
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

function normalizeInsuranceModeForForm(val) {
  if (!val) return '';
  const trimmed = String(val).trim();
  if (trimmed === 'Direct Cash / Self-Pay' || trimmed === 'Direct' || trimmed.startsWith('Direct')) {
    return 'Direct ';
  }
  if (trimmed === 'Arogyasree Scheme' || trimmed === 'Arogyasree' || trimmed.startsWith('Arogyasree')) {
    return 'Arogyasree';
  }
  if (trimmed === 'Government Reimbursement' || trimmed.startsWith('Government')) {
    return 'Government Reimbursement';
  }
  if (trimmed === 'Private Insurance' || trimmed.startsWith('Private')) {
    return 'Private Insurance';
  }
  return val;
}

const hf = forwardRef(function hf(
  { patientRecord, editingRecord, onCompletionChange, readOnly = false },
  ref
) {
  const patient = patientRecord?.patient || {};

  const getClassification = (fieldName, valStr) => {
    if (valStr === undefined || valStr === null || String(valStr).trim() === '') {
      return { status: '', classNames: '', message: '' };
    }
    const val = parseFloat(valStr);
    if (isNaN(val)) {
      return { status: '', classNames: '', message: '' };
    }

    const isMale = !patient?.gender || patient?.gender?.toLowerCase().startsWith('m');
    
    if (fieldName === 'qrs') {
      const outOfBounds = val < 50 || val > 300;
      if (outOfBounds) return { status: 'out', classNames: 'border-red-500 bg-red-50 text-red-700', message: 'Alert: Must be between 50 and 300 ms' };
      if (val >= 120 || val<80) return { status: 'abnormal', classNames: 'border-rose-500 bg-rose-50 text-rose-700 font-semibold', message: 'Prolonged/Abnormal' };
      if (val >= 110 && val < 120) return { status: 'borderline', classNames: 'border-amber-500 bg-amber-50 text-amber-700 font-semibold', message: 'Borderline' };
      return { status: 'normal', classNames: 'border-emerald-500 bg-emerald-50 text-emerald-700', message: 'Normal' };
    }

    if (fieldName === 'qt') {
      const outOfBounds = val < 200 || val > 750;
      if (outOfBounds) return { status: 'out', classNames: 'border-red-500 bg-red-50 text-red-700', message: 'Alert: Must be between 200 and 750 ms' };
      if (val<350 || val > 460 ) return { status: 'abnormal', classNames: 'border-rose-500 bg-rose-50 text-rose-700 font-semibold', message: 'Prolonged/Abnormal' };
      if (val >= 441 && val <= 460) return { status: 'borderline', classNames: 'border-amber-500 bg-amber-50 text-amber-700 font-semibold', message: 'Borderline' };
      return { status: 'normal', classNames: 'border-emerald-500 bg-emerald-50 text-emerald-700', message: 'Normal' };
    }

    if (fieldName === 'qtc') {
      if (isMale) {
        const outOfBounds = val < 200 || val > 750;
        if (outOfBounds) return { status: 'out', classNames: 'border-red-500 bg-red-50 text-red-700', message: 'Alert: Must be between 200 and 750 ms (Men)' };
        if (val<350 || val >= 451) return { status: 'abnormal', classNames: 'border-rose-500 bg-rose-50 text-rose-700 font-semibold', message: 'Prolonged/Abnormal (Men)' };
        if (val >= 431 && val <= 450) return { status: 'borderline', classNames: 'border-amber-500 bg-amber-50 text-amber-700 font-semibold', message: 'Borderline (Men)' };
        return { status: 'normal', classNames: 'border-emerald-500 bg-emerald-50 text-emerald-700', message: 'Normal (Men)' };
      } else {
        const outOfBounds = val < 200 || val > 750;
        if (outOfBounds) return { status: 'out', classNames: 'border-red-500 bg-red-50 text-red-700', message: 'Alert: Must be between 200 and 750 ms (Women)' };
        if (val<350 || val >= 471) return { status: 'abnormal', classNames: 'border-rose-500 bg-rose-50 text-rose-700 font-semibold', message: 'Prolonged/Abnormal (Women)' };
        if (val >= 451 && val <= 470) return { status: 'borderline', classNames: 'border-amber-500 bg-amber-50 text-amber-700 font-semibold', message: 'Borderline (Women)' };
        return { status: 'normal', classNames: 'border-emerald-500 bg-emerald-50 text-emerald-700', message: 'Normal (Women)' };
      }
    }

    if (fieldName === 'ctRatio') {
      const outOfBounds = val < 0.20 || val > 0.90;
      if (outOfBounds) return { status: 'out', classNames: 'border-red-500 bg-red-50 text-red-700', message: 'Alert: Must be between 0.20 and 0.90' };
      if (val<0.35 || val > 0.55) return { status: 'abnormal', classNames: 'border-rose-500 bg-rose-50 text-rose-700 font-semibold', message: 'Prolonged/Abnormal (>0.55)' };
      if (val >= 0.51 && val <= 0.55) return { status: 'borderline', classNames: 'border-amber-500 bg-amber-50 text-amber-700 font-semibold', message: 'Borderline (0.51-0.55)' };
      return { status: 'normal', classNames: 'border-emerald-500 bg-emerald-50 text-emerald-700', message: 'Normal (<=0.50)' };
    }

    if (fieldName === 'ef') {
      const outOfBounds = val < 1 || val > 100;
      if (outOfBounds) return { status: 'out', classNames: 'border-red-500 bg-red-50 text-red-700', message: 'Alert: Must be between 1% and 100%' };
      if (val<10 || val <= 40) return { status: 'abnormal', classNames: 'border-rose-500 bg-rose-50 text-rose-700 font-semibold', message: 'Prolonged/Abnormal (<=40%)' };
      if (val >= 41 && val <= 49) return { status: 'borderline', classNames: 'border-amber-500 bg-amber-50 text-amber-700 font-semibold', message: 'Borderline (41-49%)' };
      return { status: 'normal', classNames: 'border-emerald-500 bg-emerald-50 text-emerald-700', message: 'Normal (>=50%)' };
    }

    if (fieldName === 'eaRatio') {
      const outOfBounds = val < 0.1 || val > 5.0;
      if (outOfBounds) return { status: 'out', classNames: 'border-red-500 bg-red-50 text-red-700', message: 'Alert: Must be between 0.1 and 5.0' };
      if (val < 0.7 || val > 2.0) return { status: 'abnormal', classNames: 'border-rose-500 bg-rose-50 text-rose-700 font-semibold', message: 'Abnormal' };
      if (val >= 0.7 && val < 0.8) return { status: 'borderline', classNames: 'border-amber-500 bg-amber-50 text-amber-700 font-semibold', message: 'Borderline (0.7-0.8)' };
      return { status: 'normal', classNames: 'border-emerald-500 bg-emerald-50 text-emerald-700', message: 'Normal (0.8-2.0)' };
    }

    if (fieldName === 'tapse') {
      const outOfBounds = val < 1 || val > 50;
      if (outOfBounds) return { status: 'out', classNames: 'border-red-500 bg-red-50 text-red-700', message: 'Alert: Must be between 1 and 50 mm' };
      if (val < 15 || val > 40) return { status: 'abnormal', classNames: 'border-rose-500 bg-rose-50 text-rose-700 font-semibold', message: 'Abnormal (<15 mm)' };
      if (val >= 15 && val <= 16) return { status: 'borderline', classNames: 'border-amber-500 bg-amber-50 text-amber-700 font-semibold', message: 'Borderline (15-16 mm)' };
      return { status: 'normal', classNames: 'border-emerald-500 bg-emerald-50 text-emerald-700', message: 'Normal (>=17 mm)' };
    }

    if (fieldName === 'eePrime') {
      const outOfBounds = val < 3 || val > 30;
      if (outOfBounds) return { status: 'out', classNames: 'border-red-500 bg-red-50 text-red-700', message: 'Alert: Must be between 3 and 30' };
      if (val > 14) return { status: 'abnormal', classNames: 'border-rose-500 bg-rose-50 text-rose-700 font-semibold', message: 'Prolonged/Abnormal (>14)' };
      if (val >= 8 && val <= 14) return { status: 'borderline', classNames: 'border-amber-500 bg-amber-50 text-amber-700 font-semibold', message: 'Borderline (8-14)' };
      return { status: 'normal', classNames: 'border-emerald-500 bg-emerald-50 text-emerald-700', message: 'Normal (<8)' };
    }

    if (fieldName === 'eDecel') {
      const outOfBounds = val < 80 || val > 400;
      if (outOfBounds) return { status: 'out', classNames: 'border-red-500 bg-red-50 text-red-700', message: 'Alert: Must be between 80 and 400 ms' };
      if (val < 160 || val > 240) return { status: 'abnormal', classNames: 'border-rose-500 bg-rose-50 text-rose-700 font-semibold', message: 'Prolonged/Abnormal (<160 or >240)' };
      if (val >= 201 && val <= 240) return { status: 'borderline', classNames: 'border-amber-500 bg-amber-50 text-amber-700 font-semibold', message: 'Borderline (201-240 ms)' };
      return { status: 'normal', classNames: 'border-emerald-500 bg-emerald-50 text-emerald-700', message: 'Normal (160-200 ms)' };
    }

    if (fieldName === 'rvsp') {
      const outOfBounds = val < 15 || val > 120;
      if (outOfBounds) return { status: 'out', classNames: 'border-red-500 bg-red-50 text-red-700', message: 'Alert: Must be between 15 and 120 mmHg' };
      if (val > 40) return { status: 'abnormal', classNames: 'border-rose-500 bg-rose-50 text-rose-700 font-semibold', message: 'Prolonged/Abnormal (>40)' };
      if (val >= 36 && val <= 40) return { status: 'borderline', classNames: 'border-amber-500 bg-amber-50 text-amber-700 font-semibold', message: 'Borderline (36-40 mmHg)' };
      return { status: 'normal', classNames: 'border-emerald-500 bg-emerald-50 text-emerald-700', message: 'Normal (<=35 mmHg)' };
    }

    if (fieldName === 'potassium') {
      const outOfBounds = val < 3.5 || val > 5.0;
      if (outOfBounds) return { status: 'out', classNames: 'border-red-500 bg-red-50 text-red-700', message: 'Alert: Must be between 3.5 and 5.0 mmol/L' };
      if (val < 3.2 || val > 5.3) return { status: 'abnormal', classNames: 'border-rose-500 bg-rose-50 text-rose-700 font-semibold', message: 'Prolonged/Abnormal' };
      if ((val >= 3.2 && val <= 3.4) || (val >= 5.1 && val <= 5.3)) return { status: 'borderline', classNames: 'border-amber-500 bg-amber-50 text-amber-700 font-semibold', message: 'Borderline' };
      return { status: 'normal', classNames: 'border-emerald-500 bg-emerald-50 text-emerald-700', message: 'Normal' };
    }

    if (fieldName === 'creatinine') {
      const outOfBounds = val < 0.6 || val > 1.2;
      if (outOfBounds) return { status: 'out', classNames: 'border-red-500 bg-red-50 text-red-700', message: 'Alert: Must be between 0.6 and 1.2 mg/dL' };
      if (val > 1.4) return { status: 'abnormal', classNames: 'border-rose-500 bg-rose-50 text-rose-700 font-semibold', message: 'Prolonged/Abnormal (>1.4)' };
      if (val >= 1.3 && val <= 1.4) return { status: 'borderline', classNames: 'border-amber-500 bg-amber-50 text-amber-700 font-semibold', message: 'Borderline (1.3-1.4)' };
      return { status: 'normal', classNames: 'border-emerald-500 bg-emerald-50 text-emerald-700', message: 'Normal' };
    }

    if (fieldName === 'hb') {
      const outOfBounds = val < 12.0 || val > 17.5;
      if (outOfBounds) return { status: 'out', classNames: 'border-red-500 bg-red-50 text-red-700', message: 'Alert: Must be between 12.0 and 17.5 g/dL' };
      if (val < 10.0) return { status: 'abnormal', classNames: 'border-rose-500 bg-rose-50 text-rose-700 font-semibold', message: 'Prolonged/Abnormal (<10.0)' };
      if (val >= 10.0 && val <= 11.9) return { status: 'borderline', classNames: 'border-amber-500 bg-amber-50 text-amber-700 font-semibold', message: 'Borderline (10.0-11.9)' };
      
      if (isMale) {
        if (val >= 13.5 && val <= 17.5) return { status: 'normal', classNames: 'border-emerald-500 bg-emerald-50 text-emerald-700', message: 'Normal (Men)' };
      } else {
        if (val >= 12.0 && val <= 16.0) return { status: 'normal', classNames: 'border-emerald-500 bg-emerald-50 text-emerald-700', message: 'Normal (Women)' };
      }
      return { status: '', classNames: '', message: '' };
    }

    if (fieldName === 'calcium') {
      const outOfBounds = val < 8.4 || val > 10.2;
      if (outOfBounds) return { status: 'out', classNames: 'border-red-500 bg-red-50 text-red-700', message: 'Alert: Must be between 8.4 and 10.2 mg/dL' };
      if (val < 8.0 || val > 10.5) return { status: 'abnormal', classNames: 'border-rose-500 bg-rose-50 text-rose-700 font-semibold', message: 'Prolonged/Abnormal' };
      if ((val >= 8.0 && val <= 8.3) || (val >= 10.3 && val <= 10.5)) return { status: 'borderline', classNames: 'border-amber-500 bg-amber-50 text-amber-700 font-semibold', message: 'Borderline' };
      return { status: 'normal', classNames: 'border-emerald-500 bg-emerald-50 text-emerald-700', message: 'Normal' };
    }

    if (fieldName === 'bun') {
      const outOfBounds = val < 7 || val > 18;
      if (outOfBounds) return { status: 'out', classNames: 'border-red-500 bg-red-50 text-red-700', message: 'Alert: Must be between 7 and 18 mg/dL' };
      if (val > 25) return { status: 'abnormal', classNames: 'border-rose-500 bg-rose-50 text-rose-700 font-semibold', message: 'Prolonged/Abnormal (>25)' };
      if (val >= 19 && val <= 25) return { status: 'borderline', classNames: 'border-amber-500 bg-amber-50 text-amber-700 font-semibold', message: 'Borderline (19-25)' };
      return { status: 'normal', classNames: 'border-emerald-500 bg-emerald-50 text-emerald-700', message: 'Normal' };
    }

    if (fieldName === 'glucose') {
      const outOfBounds = val < 70 || val > 100;
      if (outOfBounds) return { status: 'out', classNames: 'border-red-500 bg-red-50 text-red-700', message: 'Alert: Must be between 70 and 100 mg/dL' };
      if (val < 70 || val >= 126) return { status: 'abnormal', classNames: 'border-rose-500 bg-rose-50 text-rose-700 font-semibold', message: 'Prolonged/Abnormal' };
      if (val >= 101 && val <= 125) return { status: 'borderline', classNames: 'border-amber-500 bg-amber-50 text-amber-700 font-semibold', message: 'Borderline (101-125)' };
      return { status: 'normal', classNames: 'border-emerald-500 bg-emerald-50 text-emerald-700', message: 'Normal' };
    }

    if (fieldName === 'hba1c') {
      const outOfBounds = val < 4.0 || val > 5.6;
      if (outOfBounds) return { status: 'out', classNames: 'border-red-500 bg-red-50 text-red-700', message: 'Alert: Must be between 4.0% and 5.6%' };
      if (val >= 6.5) return { status: 'abnormal', classNames: 'border-rose-500 bg-rose-50 text-rose-700 font-semibold', message: 'Prolonged/Abnormal (>=6.5%)' };
      if (val >= 5.7 && val <= 6.4) return { status: 'borderline', classNames: 'border-amber-500 bg-amber-50 text-amber-700 font-semibold', message: 'Borderline (5.7-6.4%)' };
      return { status: 'normal', classNames: 'border-emerald-500 bg-emerald-50 text-emerald-700', message: 'Normal (<5.7%)' };
    }

    if (fieldName === 'magnesium') {
      const outOfBounds = val < 1.5 || val > 2.0;
      if (outOfBounds) return { status: 'out', classNames: 'border-red-500 bg-red-50 text-red-700', message: 'Alert: Must be between 1.5 and 2.0 mg/dL' };
      if (val < 1.3 || val > 2.1) return { status: 'abnormal', classNames: 'border-rose-500 bg-rose-50 text-rose-700 font-semibold', message: 'Prolonged/Abnormal' };
      if (val >= 1.3 && val <= 1.4) return { status: 'borderline', classNames: 'border-amber-500 bg-amber-50 text-amber-700 font-semibold', message: 'Borderline' };
      return { status: 'normal', classNames: 'border-emerald-500 bg-emerald-50 text-emerald-700', message: 'Normal' };
    }

    if (fieldName === 'sodium') {
      const outOfBounds = val < 136 || val > 146;
      if (outOfBounds) return { status: 'out', classNames: 'border-red-500 bg-red-50 text-red-700', message: 'Alert: Must be between 136 and 146 mmol/L' };
      if (val < 130 || val > 146) return { status: 'abnormal', classNames: 'border-rose-500 bg-rose-50 text-rose-700 font-semibold', message: 'Prolonged/Abnormal' };
      if (val >= 130 && val <= 135) return { status: 'borderline', classNames: 'border-amber-500 bg-amber-50 text-amber-700 font-semibold', message: 'Borderline' };
      return { status: 'normal', classNames: 'border-emerald-500 bg-emerald-50 text-emerald-700', message: 'Normal' };
    }

    if (fieldName === 'tsh') {
      const outOfBounds = val < 0.4 || val > 4.0;
      if (outOfBounds) return { status: 'out', classNames: 'border-red-500 bg-red-50 text-red-700', message: 'Alert: Must be between 0.4 and 4.0 µIU/mL' };
      if (val < 0.4 || val > 5.5) return { status: 'abnormal', classNames: 'border-rose-500 bg-rose-50 text-rose-700 font-semibold', message: 'Prolonged/Abnormal' };
      if (val >= 4.1 && val <= 5.5) return { status: 'borderline', classNames: 'border-amber-500 bg-amber-50 text-amber-700 font-semibold', message: 'Borderline' };
      return { status: 'normal', classNames: 'border-emerald-500 bg-emerald-50 text-emerald-700', message: 'Normal' };
    }

    if (fieldName === 't3') {
      const outOfBounds = val < 100 || val > 200;
      if (outOfBounds) return { status: 'out', classNames: 'border-red-500 bg-red-50 text-red-700', message: 'Alert: Must be between 100 and 200 ng/dL' };
      if (val < 80 || val > 200) return { status: 'abnormal', classNames: 'border-rose-500 bg-rose-50 text-rose-700 font-semibold', message: 'Prolonged/Abnormal' };
      if (val >= 80 && val <= 99) return { status: 'borderline', classNames: 'border-amber-500 bg-amber-50 text-amber-700 font-semibold', message: 'Borderline' };
      return { status: 'normal', classNames: 'border-emerald-500 bg-emerald-50 text-emerald-700', message: 'Normal' };
    }

    if (fieldName === 't4') {
      const outOfBounds = val < 4.5 || val > 12.0;
      if (outOfBounds) return { status: 'out', classNames: 'border-red-500 bg-red-50 text-red-700', message: 'Alert: Must be between 4.5 and 12.0 µg/dL' };
      if (val < 3.8 || val > 12.0) return { status: 'abnormal', classNames: 'border-rose-500 bg-rose-50 text-rose-700 font-semibold', message: 'Prolonged/Abnormal' };
      if (val >= 3.8 && val <= 4.4) return { status: 'borderline', classNames: 'border-amber-500 bg-amber-50 text-amber-700 font-semibold', message: 'Borderline' };
      return { status: 'normal', classNames: 'border-emerald-500 bg-emerald-50 text-emerald-700', message: 'Normal' };
    }

    if (fieldName === 'bnp') {
      const outOfBounds = val < 0 || val > 100;
      if (outOfBounds) return { status: 'out', classNames: 'border-red-500 bg-red-50 text-red-700', message: 'Alert: Must be between 0 and 100 pg/mL' };
      if (val > 400) return { status: 'abnormal', classNames: 'border-rose-500 bg-rose-50 text-rose-700 font-semibold', message: 'Prolonged/Abnormal' };
      if (val >= 100 && val <= 400) return { status: 'borderline', classNames: 'border-amber-500 bg-amber-50 text-amber-700 font-semibold', message: 'Borderline' };
      return { status: 'normal', classNames: 'border-emerald-500 bg-emerald-50 text-emerald-700', message: 'Normal' };
    }

    if (fieldName === 'ntProBnp') {
      const outOfBounds = val < 0 || val > 300;
      if (outOfBounds) return { status: 'out', classNames: 'border-red-500 bg-red-50 text-red-700', message: 'Alert: Must be between 0 and 300 pg/mL' };
      if (val > 900) return { status: 'abnormal', classNames: 'border-rose-500 bg-rose-50 text-rose-700 font-semibold', message: 'Prolonged/Abnormal' };
      if (val >= 300 && val <= 900) return { status: 'borderline', classNames: 'border-amber-500 bg-amber-50 text-amber-700 font-semibold', message: 'Borderline' };
      return { status: 'normal', classNames: 'border-emerald-500 bg-emerald-50 text-emerald-700', message: 'Normal' };
    }

    if (fieldName === 'ldl') {
      const outOfBounds = val < 0 || val > 100;
      if (outOfBounds) return { status: 'out', classNames: 'border-red-500 bg-red-50 text-red-700', message: 'Alert: Must be between 0 and 100 mg/dL' };
      if (val >= 130) return { status: 'abnormal', classNames: 'border-rose-500 bg-rose-50 text-rose-700 font-semibold', message: 'Prolonged/Abnormal' };
      if (val >= 100 && val <= 129) return { status: 'borderline', classNames: 'border-amber-500 bg-amber-50 text-amber-700 font-semibold', message: 'Borderline' };
      return { status: 'normal', classNames: 'border-emerald-500 bg-emerald-50 text-emerald-700', message: 'Normal' };
    }

    if (fieldName === 'inr') {
      const outOfBounds = val < 0.8 || val > 1.2;
      if (outOfBounds) return { status: 'out', classNames: 'border-red-500 bg-red-50 text-red-700', message: 'Alert: Must be between 0.8 and 1.2' };
      if (val >= 2.0 && val <= 3.0) return { status: 'abnormal', classNames: 'border-rose-500 bg-rose-50 text-rose-700 font-semibold', message: 'Abnormal (2.0-3.0)' };
      if (val >= 1.5 && val <= 1.9) return { status: 'borderline', classNames: 'border-amber-500 bg-amber-50 text-amber-700 font-semibold', message: 'Borderline (1.5-1.9)' };
      return { status: 'normal', classNames: 'border-emerald-500 bg-emerald-50 text-emerald-700', message: 'Normal' };
    }

    if (fieldName === 'st2') {
      const outOfBounds = val < 0 || val > 35;
      if (outOfBounds) return { status: 'out', classNames: 'border-red-500 bg-red-50 text-red-700', message: 'Alert: Must be between 0 and 35 ng/mL' };
      if (val > 50) return { status: 'abnormal', classNames: 'border-rose-500 bg-rose-50 text-rose-700 font-semibold', message: 'Prolonged/Abnormal (>50)' };
      if (val >= 35 && val <= 50) return { status: 'borderline', classNames: 'border-amber-500 bg-amber-50 text-amber-700 font-semibold', message: 'Borderline (35-50)' };
      return { status: 'normal', classNames: 'border-emerald-500 bg-emerald-50 text-emerald-700', message: 'Normal' };
    }

    if (fieldName === 'carvedilol') {
      const outOfBounds = val < 3.125 || val > 50;
      if (outOfBounds) return { status: 'out', classNames: 'border-red-500 bg-red-50 text-red-700', message: 'Alert: Must be between 3.125 and 50 mg/day' };
      if (val > 50) return { status: 'abnormal', classNames: 'border-rose-500 bg-rose-50 text-rose-700 font-semibold', message: 'Prolonged/Abnormal' };
      if (val >= 6.25 && val <= 12.5) return { status: 'borderline', classNames: 'border-amber-500 bg-amber-50 text-amber-700 font-semibold', message: 'Borderline' };
      return { status: 'normal', classNames: 'border-emerald-500 bg-emerald-50 text-emerald-700', message: 'Normal' };
    }

    if (fieldName === 'bisoprolol') {
      const outOfBounds = val < 1.25 || val > 10;
      if (outOfBounds) return { status: 'out', classNames: 'border-red-500 bg-red-50 text-red-700', message: 'Alert: Must be between 1.25 and 10 mg/day' };
      if (val > 10) return { status: 'abnormal', classNames: 'border-rose-500 bg-rose-50 text-rose-700 font-semibold', message: 'Prolonged/Abnormal' };
      if (val >= 2.5 && val <= 5) return { status: 'borderline', classNames: 'border-amber-500 bg-amber-50 text-amber-700 font-semibold', message: 'Borderline' };
      return { status: 'normal', classNames: 'border-emerald-500 bg-emerald-50 text-emerald-700', message: 'Normal' };
    }

    if (fieldName === 'metoprolol') {
      const outOfBounds = val < 12.5 || val > 200;
      if (outOfBounds) return { status: 'out', classNames: 'border-red-500 bg-red-50 text-red-700', message: 'Alert: Must be between 12.5 and 200 mg/day' };
      if (val > 200) return { status: 'abnormal', classNames: 'border-rose-500 bg-rose-50 text-rose-700 font-semibold', message: 'Prolonged/Abnormal' };
      if (val >= 25 && val <= 100) return { status: 'borderline', classNames: 'border-amber-500 bg-amber-50 text-amber-700 font-semibold', message: 'Borderline' };
      return { status: 'normal', classNames: 'border-emerald-500 bg-emerald-50 text-emerald-700', message: 'Normal' };
    }

    if (fieldName === 'nebivolol') {
      const outOfBounds = val < 1.25 || val > 10;
      if (outOfBounds) return { status: 'out', classNames: 'border-red-500 bg-red-50 text-red-700', message: 'Alert: Must be between 1.25 and 10 mg/day' };
      if (val > 10) return { status: 'abnormal', classNames: 'border-rose-500 bg-rose-50 text-rose-700 font-semibold', message: 'Prolonged/Abnormal' };
      if (val >= 2.5 && val <= 5) return { status: 'borderline', classNames: 'border-amber-500 bg-amber-50 text-amber-700 font-semibold', message: 'Borderline' };
      return { status: 'normal', classNames: 'border-emerald-500 bg-emerald-50 text-emerald-700', message: 'Normal' };
    }

    if (fieldName === 'enalapril') {
      const outOfBounds = val < 2.5 || val > 40;
      if (outOfBounds) return { status: 'out', classNames: 'border-red-500 bg-red-50 text-red-700', message: 'Alert: Must be between 2.5 and 40 mg/day' };
      if (val > 40) return { status: 'abnormal', classNames: 'border-rose-500 bg-rose-50 text-rose-700 font-semibold', message: 'Prolonged/Abnormal' };
      if (val >= 5 && val <= 10) return { status: 'borderline', classNames: 'border-amber-500 bg-amber-50 text-amber-700 font-semibold', message: 'Borderline' };
      return { status: 'normal', classNames: 'border-emerald-500 bg-emerald-50 text-emerald-700', message: 'Normal' };
    }

    if (fieldName === 'ramipril') {
      const outOfBounds = val < 1.25 || val > 20;
      if (outOfBounds) return { status: 'out', classNames: 'border-red-500 bg-red-50 text-red-700', message: 'Alert: Must be between 1.25 and 20 mg/day' };
      if (val > 20) return { status: 'abnormal', classNames: 'border-rose-500 bg-rose-50 text-rose-700 font-semibold', message: 'Prolonged/Abnormal' };
      if (val >= 2.5 && val <= 5) return { status: 'borderline', classNames: 'border-amber-500 bg-amber-50 text-amber-700 font-semibold', message: 'Borderline' };
      return { status: 'normal', classNames: 'border-emerald-500 bg-emerald-50 text-emerald-700', message: 'Normal' };
    }

    if (fieldName === 'lisinopril') {
      const outOfBounds = val < 2.5 || val > 40;
      if (outOfBounds) return { status: 'out', classNames: 'border-red-500 bg-red-50 text-red-700', message: 'Alert: Must be between 2.5 and 40 mg/day' };
      if (val > 40) return { status: 'abnormal', classNames: 'border-rose-500 bg-rose-50 text-rose-700 font-semibold', message: 'Prolonged/Abnormal' };
      if (val >= 5 && val <= 10) return { status: 'borderline', classNames: 'border-amber-500 bg-amber-50 text-amber-700 font-semibold', message: 'Borderline' };
      return { status: 'normal', classNames: 'border-emerald-500 bg-emerald-50 text-emerald-700', message: 'Normal' };
    }

    if (fieldName === 'perindopril') {
      const outOfBounds = val < 2 || val > 16;
      if (outOfBounds) return { status: 'out', classNames: 'border-red-500 bg-red-50 text-red-700', message: 'Alert: Must be between 2 and 16 mg/day' };
      if (val > 16) return { status: 'abnormal', classNames: 'border-rose-500 bg-rose-50 text-rose-700 font-semibold', message: 'Prolonged/Abnormal' };
      if (val >= 2 && val <= 4) return { status: 'borderline', classNames: 'border-amber-500 bg-amber-50 text-amber-700 font-semibold', message: 'Borderline' };
      return { status: 'normal', classNames: 'border-emerald-500 bg-emerald-50 text-emerald-700', message: 'Normal' };
    }

    if (fieldName === 'valsartan') {
      const outOfBounds = val < 40 || val > 320;
      if (outOfBounds) return { status: 'out', classNames: 'border-red-500 bg-red-50 text-red-700', message: 'Alert: Must be between 40 and 320 mg/day' };
      if (val > 320) return { status: 'abnormal', classNames: 'border-rose-500 bg-rose-50 text-rose-700 font-semibold', message: 'Prolonged/Abnormal' };
      if (val >= 80 && val <= 160) return { status: 'borderline', classNames: 'border-amber-500 bg-amber-50 text-amber-700 font-semibold', message: 'Borderline' };
      return { status: 'normal', classNames: 'border-emerald-500 bg-emerald-50 text-emerald-700', message: 'Normal' };
    }

    if (fieldName === 'losartan') {
      const outOfBounds = val < 25 || val > 150;
      if (outOfBounds) return { status: 'out', classNames: 'border-red-500 bg-red-50 text-red-700', message: 'Alert: Must be between 25 and 150 mg/day' };
      if (val > 150) return { status: 'abnormal', classNames: 'border-rose-500 bg-rose-50 text-rose-700 font-semibold', message: 'Prolonged/Abnormal' };
      if (val >= 50 && val <= 100) return { status: 'borderline', classNames: 'border-amber-500 bg-amber-50 text-amber-700 font-semibold', message: 'Borderline' };
      return { status: 'normal', classNames: 'border-emerald-500 bg-emerald-50 text-emerald-700', message: 'Normal' };
    }

    if (fieldName === 'telmisartan') {
      const outOfBounds = val < 20 || val > 80;
      if (outOfBounds) return { status: 'out', classNames: 'border-red-500 bg-red-50 text-red-700', message: 'Alert: Must be between 20 and 80 mg/day' };
      if (val > 80) return { status: 'abnormal', classNames: 'border-rose-500 bg-rose-50 text-rose-700 font-semibold', message: 'Prolonged/Abnormal' };
      if (val >= 20 && val <= 40) return { status: 'borderline', classNames: 'border-amber-500 bg-amber-50 text-amber-700 font-semibold', message: 'Borderline' };
      return { status: 'normal', classNames: 'border-emerald-500 bg-emerald-50 text-emerald-700', message: 'Normal' };
    }

    if (fieldName === 'olmesartan') {
      const outOfBounds = val < 10 || val > 40;
      if (outOfBounds) return { status: 'out', classNames: 'border-red-500 bg-red-50 text-red-700', message: 'Alert: Must be between 10 and 40 mg/day' };
      if (val > 40) return { status: 'abnormal', classNames: 'border-rose-500 bg-rose-50 text-rose-700 font-semibold', message: 'Prolonged/Abnormal' };
      if (val >= 10 && val <= 20) return { status: 'borderline', classNames: 'border-amber-500 bg-amber-50 text-amber-700 font-semibold', message: 'Borderline' };
      return { status: 'normal', classNames: 'border-emerald-500 bg-emerald-50 text-emerald-700', message: 'Normal' };
    }

    if (fieldName === 'spironolactone') {
      const outOfBounds = val < 12.5 || val > 50;
      if (outOfBounds) return { status: 'out', classNames: 'border-red-500 bg-red-50 text-red-700', message: 'Alert: Must be between 12.5 and 50 mg/day' };
      if (val > 50) return { status: 'abnormal', classNames: 'border-rose-500 bg-rose-50 text-rose-700 font-semibold', message: 'Prolonged/Abnormal' };
      if (val === 12.5) return { status: 'borderline', classNames: 'border-amber-500 bg-amber-50 text-amber-700 font-semibold', message: 'Borderline' };
      return { status: 'normal', classNames: 'border-emerald-500 bg-emerald-50 text-emerald-700', message: 'Normal' };
    }

    if (fieldName === 'eplerenone') {
      const outOfBounds = val < 25 || val > 50;
      if (outOfBounds) return { status: 'out', classNames: 'border-red-500 bg-red-50 text-red-700', message: 'Alert: Must be between 25 and 50 mg/day' };
      if (val > 50) return { status: 'abnormal', classNames: 'border-rose-500 bg-rose-50 text-rose-700 font-semibold', message: 'Prolonged/Abnormal' };
      if (val === 25) return { status: 'borderline', classNames: 'border-amber-500 bg-amber-50 text-amber-700 font-semibold', message: 'Borderline' };
      return { status: 'normal', classNames: 'border-emerald-500 bg-emerald-50 text-emerald-700', message: 'Normal' };
    }

    if (fieldName === 'warfarin') {
      const outOfBounds = val < 1 || val > 15;
      if (outOfBounds) return { status: 'out', classNames: 'border-red-500 bg-red-50 text-red-700', message: 'Alert: Must be between 1 and 15 mg/day' };
      if (val > 15) return { status: 'abnormal', classNames: 'border-rose-500 bg-rose-50 text-rose-700 font-semibold', message: 'Prolonged/Abnormal' };
      if (val >= 1 && val <= 2) return { status: 'borderline', classNames: 'border-amber-500 bg-amber-50 text-amber-700 font-semibold', message: 'Borderline' };
      return { status: 'normal', classNames: 'border-emerald-500 bg-emerald-50 text-emerald-700', message: 'Normal' };
    }

    if (fieldName === 'acitrom') {
      const outOfBounds = val < 1 || val > 8;
      if (outOfBounds) return { status: 'out', classNames: 'border-red-500 bg-red-50 text-red-700', message: 'Alert: Must be between 1 and 8 mg/day' };
      if (val > 8) return { status: 'abnormal', classNames: 'border-rose-500 bg-rose-50 text-rose-700 font-semibold', message: 'Prolonged/Abnormal' };
      if (val === 1) return { status: 'borderline', classNames: 'border-amber-500 bg-amber-50 text-amber-700 font-semibold', message: 'Borderline' };
      return { status: 'normal', classNames: 'border-emerald-500 bg-emerald-50 text-emerald-700', message: 'Normal' };
    }

    if (fieldName === 'ufh') {
      const outOfBounds = val < 200 || val > 40000;
      if (outOfBounds) return { status: 'out', classNames: 'border-red-500 bg-red-50 text-red-700', message: 'Alert: Must be between 200 and 40000 units/day' };
      if (val > 25000) return { status: 'abnormal', classNames: 'border-rose-500 bg-rose-50 text-rose-700 font-semibold', message: 'Prolonged/Abnormal' };
      if (val < 15000) return { status: 'borderline', classNames: 'border-amber-500 bg-amber-50 text-amber-700 font-semibold', message: 'Borderline' };
      return { status: 'normal', classNames: 'border-emerald-500 bg-emerald-50 text-emerald-700', message: 'Normal' };
    }

    if (fieldName === 'lmwh') {
      const outOfBounds = val < 20 || val > 180;
      if (outOfBounds) return { status: 'out', classNames: 'border-red-500 bg-red-50 text-red-700', message: 'Alert: Must be between 20 and 180 mg/day' };
      if (val > 180) return { status: 'abnormal', classNames: 'border-rose-500 bg-rose-50 text-rose-700 font-semibold', message: 'Prolonged/Abnormal' };
      if (val >= 20 && val < 40) return { status: 'borderline', classNames: 'border-amber-500 bg-amber-50 text-amber-700 font-semibold', message: 'Borderline' };
      return { status: 'normal', classNames: 'border-emerald-500 bg-emerald-50 text-emerald-700', message: 'Normal' };
    }

    if (fieldName === 'aspirin') {
      const outOfBounds = val < 75 || val > 325;
      if (outOfBounds) return { status: 'out', classNames: 'border-red-500 bg-red-50 text-red-700', message: 'Alert: Must be between 75 and 325 mg/day' };
      if (val > 325) return { status: 'abnormal', classNames: 'border-rose-500 bg-rose-50 text-rose-700 font-semibold', message: 'Prolonged/Abnormal' };
      if (val >= 150 && val <= 162) return { status: 'borderline', classNames: 'border-amber-500 bg-amber-50 text-amber-700 font-semibold', message: 'Borderline' };
      return { status: 'normal', classNames: 'border-emerald-500 bg-emerald-50 text-emerald-700', message: 'Normal' };
    }

    if (fieldName === 'clopidogrel') {
      const outOfBounds = val < 75 || val > 150;
      if (outOfBounds) return { status: 'out', classNames: 'border-red-500 bg-red-50 text-red-700', message: 'Alert: Must be between 75 and 150 mg/day' };
      if (val > 150) return { status: 'abnormal', classNames: 'border-rose-500 bg-rose-50 text-rose-700 font-semibold', message: 'Prolonged/Abnormal' };
      if (val >= 300 && val <= 600) return { status: 'borderline', classNames: 'border-amber-500 bg-amber-50 text-amber-700 font-semibold', message: 'Borderline' };
      return { status: 'normal', classNames: 'border-emerald-500 bg-emerald-50 text-emerald-700', message: 'Normal' };
    }

    if (fieldName === 'prasugrel') {
      const outOfBounds = val < 5 || val > 10;
      if (outOfBounds) return { status: 'out', classNames: 'border-red-500 bg-red-50 text-red-700', message: 'Alert: Must be between 5 and 10 mg/day' };
      if (val > 10) return { status: 'abnormal', classNames: 'border-rose-500 bg-rose-50 text-rose-700 font-semibold', message: 'Prolonged/Abnormal' };
      if (val === 5) return { status: 'borderline', classNames: 'border-amber-500 bg-amber-50 text-amber-700 font-semibold', message: 'Borderline' };
      return { status: 'normal', classNames: 'border-emerald-500 bg-emerald-50 text-emerald-700', message: 'Normal' };
    }

    if (fieldName === 'ticagrelor') {
      const outOfBounds = val < 90 || val > 180;
      if (outOfBounds) return { status: 'out', classNames: 'border-red-500 bg-red-50 text-red-700', message: 'Alert: Must be between 90 and 180 mg/day' };
      if (val > 180) return { status: 'abnormal', classNames: 'border-rose-500 bg-rose-50 text-rose-700 font-semibold', message: 'Prolonged/Abnormal' };
      if (val === 120 || val === 60) return { status: 'borderline', classNames: 'border-amber-500 bg-amber-50 text-amber-700 font-semibold', message: 'Borderline' };
      return { status: 'normal', classNames: 'border-emerald-500 bg-emerald-50 text-emerald-700', message: 'Normal' };
    }

    if (fieldName === 'amiodarone') {
      const outOfBounds = val < 100 || val > 400;
      if (outOfBounds) return { status: 'out', classNames: 'border-red-500 bg-red-50 text-red-700', message: 'Alert: Must be between 100 and 400 mg/day' };
      if (val > 400) return { status: 'abnormal', classNames: 'border-rose-500 bg-rose-50 text-rose-700 font-semibold', message: 'Prolonged/Abnormal' };
      if (val === 400) return { status: 'borderline', classNames: 'border-amber-500 bg-amber-50 text-amber-700 font-semibold', message: 'Borderline' };
      return { status: 'normal', classNames: 'border-emerald-500 bg-emerald-50 text-emerald-700', message: 'Normal' };
    }

    if (fieldName === 'furosemide') {
      const outOfBounds = val < 20 || val > 600;
      if (outOfBounds) return { status: 'out', classNames: 'border-red-500 bg-red-50 text-red-700', message: 'Alert: Must be between 20 and 600 mg/day' };
      if (val > 600) return { status: 'abnormal', classNames: 'border-rose-500 bg-rose-50 text-rose-700 font-semibold', message: 'Prolonged/Abnormal' };
      if (val >= 120 && val <= 240) return { status: 'borderline', classNames: 'border-amber-500 bg-amber-50 text-amber-700 font-semibold', message: 'Borderline' };
      return { status: 'normal', classNames: 'border-emerald-500 bg-emerald-50 text-emerald-700', message: 'Normal' };
    }

    if (fieldName === 'torsemide') {
      const outOfBounds = val < 5 || val > 200;
      if (outOfBounds) return { status: 'out', classNames: 'border-red-500 bg-red-50 text-red-700', message: 'Alert: Must be between 5 and 200 mg/day' };
      if (val > 200) return { status: 'abnormal', classNames: 'border-rose-500 bg-rose-50 text-rose-700 font-semibold', message: 'Prolonged/Abnormal' };
      if (val >= 40 && val <= 100) return { status: 'borderline', classNames: 'border-amber-500 bg-amber-50 text-amber-700 font-semibold', message: 'Borderline' };
      return { status: 'normal', classNames: 'border-emerald-500 bg-emerald-50 text-emerald-700', message: 'Normal' };
    }

    if (fieldName === 'metolazone') {
      const outOfBounds = val < 2.5 || val > 20;
      if (outOfBounds) return { status: 'out', classNames: 'border-red-500 bg-red-50 text-red-700', message: 'Alert: Must be between 2.5 and 20 mg/day' };
      if (val > 20) return { status: 'abnormal', classNames: 'border-rose-500 bg-rose-50 text-rose-700 font-semibold', message: 'Prolonged/Abnormal' };
      if (val === 10) return { status: 'borderline', classNames: 'border-amber-500 bg-amber-50 text-amber-700 font-semibold', message: 'Borderline' };
      return { status: 'normal', classNames: 'border-emerald-500 bg-emerald-50 text-emerald-700', message: 'Normal' };
    }

    if (fieldName === 'digoxin') {
      const outOfBounds = val < 0.0625 || val > 0.25;
      if (outOfBounds) return { status: 'out', classNames: 'border-red-500 bg-red-50 text-red-700', message: 'Alert: Must be between 0.0625 and 0.25 mg/day' };
      if (val > 0.25) return { status: 'abnormal', classNames: 'border-rose-500 bg-rose-50 text-rose-700 font-semibold', message: 'Prolonged/Abnormal' };
      if (val === 0.0625) return { status: 'borderline', classNames: 'border-amber-500 bg-amber-50 text-amber-700 font-semibold', message: 'Borderline' };
      return { status: 'normal', classNames: 'border-emerald-500 bg-emerald-50 text-emerald-700', message: 'Normal' };
    }

    if (fieldName === 'ivabradine') {
      const outOfBounds = val < 5 || val > 15;
      if (outOfBounds) return { status: 'out', classNames: 'border-red-500 bg-red-50 text-red-700', message: 'Alert: Must be between 5 and 15 mg/day' };
      if (val > 15) return { status: 'abnormal', classNames: 'border-rose-500 bg-rose-50 text-rose-700 font-semibold', message: 'Prolonged/Abnormal' };
      if (val === 5) return { status: 'borderline', classNames: 'border-amber-500 bg-amber-50 text-amber-700 font-semibold', message: 'Borderline' };
      return { status: 'normal', classNames: 'border-emerald-500 bg-emerald-50 text-emerald-700', message: 'Normal' };
    }

    if (fieldName === 'atorvastatin') {
      const outOfBounds = val < 10 || val > 80;
      if (outOfBounds) return { status: 'out', classNames: 'border-red-500 bg-red-50 text-red-700', message: 'Alert: Must be between 10 and 80 mg/day' };
      if (val > 80) return { status: 'abnormal', classNames: 'border-rose-500 bg-rose-50 text-rose-700 font-semibold', message: 'Prolonged/Abnormal' };
      if (val >= 10 && val <= 20) return { status: 'borderline', classNames: 'border-amber-500 bg-amber-50 text-amber-700 font-semibold', message: 'Borderline' };
      return { status: 'normal', classNames: 'border-emerald-500 bg-emerald-50 text-emerald-700', message: 'Normal' };
    }

    if (fieldName === 'simvastatin') {
      const outOfBounds = val < 10 || val > 40;
      if (outOfBounds) return { status: 'out', classNames: 'border-red-500 bg-red-50 text-red-700', message: 'Alert: Must be between 10 and 40 mg/day' };
      if (val > 40) return { status: 'abnormal', classNames: 'border-rose-500 bg-rose-50 text-rose-700 font-semibold', message: 'Prolonged/Abnormal' };
      if (val === 10) return { status: 'borderline', classNames: 'border-amber-500 bg-amber-50 text-amber-700 font-semibold', message: 'Borderline' };
      return { status: 'normal', classNames: 'border-emerald-500 bg-emerald-50 text-emerald-700', message: 'Normal' };
    }

    if (fieldName === 'rosuvastatin') {
      const outOfBounds = val < 5 || val > 40;
      if (outOfBounds) return { status: 'out', classNames: 'border-red-500 bg-red-50 text-red-700', message: 'Alert: Must be between 5 and 40 mg/day' };
      if (val > 40) return { status: 'abnormal', classNames: 'border-rose-500 bg-rose-50 text-rose-700 font-semibold', message: 'Prolonged/Abnormal' };
      if (val === 5) return { status: 'borderline', classNames: 'border-amber-500 bg-amber-50 text-amber-700 font-semibold', message: 'Borderline' };
      return { status: 'normal', classNames: 'border-emerald-500 bg-emerald-50 text-emerald-700', message: 'Normal' };
    }

    if (fieldName === 'sulfonylureas') {
      const outOfBounds = val < 1 || val > 500;
      if (outOfBounds) return { status: 'out', classNames: 'border-red-500 bg-red-50 text-red-700', message: 'Alert: Must be between 1 and 500 mg/day' };
      if (val > 500) return { status: 'abnormal', classNames: 'border-rose-500 bg-rose-50 text-rose-700 font-semibold', message: 'Prolonged/Abnormal' };
      if (val < 30) return { status: 'borderline', classNames: 'border-amber-500 bg-amber-50 text-amber-700 font-semibold', message: 'Borderline' };
      return { status: 'normal', classNames: 'border-emerald-500 bg-emerald-50 text-emerald-700', message: 'Normal' };
    }

    if (fieldName === 'metformin') {
      const outOfBounds = val < 500 || val > 2550;
      if (outOfBounds) return { status: 'out', classNames: 'border-red-500 bg-red-50 text-red-700', message: 'Alert: Must be between 500 and 2550 mg/day' };
      if (val > 2550) return { status: 'abnormal', classNames: 'border-rose-500 bg-rose-50 text-rose-700 font-semibold', message: 'Prolonged/Abnormal' };
      if (val === 500) return { status: 'borderline', classNames: 'border-amber-500 bg-amber-50 text-amber-700 font-semibold', message: 'Borderline' };
      return { status: 'normal', classNames: 'border-emerald-500 bg-emerald-50 text-emerald-700', message: 'Normal' };
    }

    if (fieldName === 'glitazone') {
      const outOfBounds = val < 15 || val > 45;
      if (outOfBounds) return { status: 'out', classNames: 'border-red-500 bg-red-50 text-red-700', message: 'Alert: Must be between 15 and 45 mg/day' };
      if (val > 45) return { status: 'abnormal', classNames: 'border-rose-500 bg-rose-50 text-rose-700 font-semibold', message: 'Prolonged/Abnormal' };
      if (val === 15) return { status: 'borderline', classNames: 'border-amber-500 bg-amber-50 text-amber-700 font-semibold', message: 'Borderline' };
      return { status: 'normal', classNames: 'border-emerald-500 bg-emerald-50 text-teal-700', message: 'Normal' };
    }

    if (fieldName === 'gliptin') {
      const outOfBounds = val < 5 || val > 100;
      if (outOfBounds) return { status: 'out', classNames: 'border-red-500 bg-red-50 text-red-700', message: 'Alert: Must be between 5 and 100 mg/day' };
      if (val > 100) return { status: 'abnormal', classNames: 'border-rose-500 bg-rose-50 text-rose-700 font-semibold', message: 'Prolonged/Abnormal' };
      if (val < 25) return { status: 'borderline', classNames: 'border-amber-500 bg-amber-50 text-amber-700 font-semibold', message: 'Borderline' };
      return { status: 'normal', classNames: 'border-emerald-500 bg-emerald-50 text-emerald-700', message: 'Normal' };
    }

    if (fieldName === 'acarbose') {
      const outOfBounds = val < 50 || val > 300;
      if (outOfBounds) return { status: 'out', classNames: 'border-red-500 bg-red-50 text-red-700', message: 'Alert: Must be between 50 and 300 mg/day' };
      if (val > 300) return { status: 'abnormal', classNames: 'border-rose-500 bg-rose-50 text-rose-700 font-semibold', message: 'Prolonged/Abnormal' };
      if (val >= 25 && val < 150) return { status: 'borderline', classNames: 'border-amber-500 bg-amber-50 text-amber-700 font-semibold', message: 'Borderline' };
      return { status: 'normal', classNames: 'border-emerald-500 bg-emerald-50 text-emerald-700', message: 'Normal' };
    }

    if (fieldName === 'insulin') {
      const outOfBounds = val < 5 || val > 150;
      if (outOfBounds) return { status: 'out', classNames: 'border-red-500 bg-red-50 text-red-700', message: 'Alert: Must be between 5 and 150 units/day' };
      if (val >= 101 && val <= 150) return { status: 'abnormal', classNames: 'border-rose-500 bg-rose-50 text-rose-700 font-semibold', message: 'Prolonged/Abnormal' };
      if (val >= 5 && val <= 9) return { status: 'borderline', classNames: 'border-amber-500 bg-amber-50 text-amber-700 font-semibold', message: 'Borderline' };
      return { status: 'normal', classNames: 'border-emerald-500 bg-emerald-50 text-emerald-700', message: 'Normal' };
    }

    if (fieldName === 'antihypertensive') {
      const outOfBounds = val < 1 || val > 300;
      if (outOfBounds) return { status: 'out', classNames: 'border-red-500 bg-red-50 text-red-700', message: 'Alert: Must be between 1 and 300 mg/day' };
      if (val >= 201 && val <= 300) return { status: 'abnormal', classNames: 'border-rose-500 bg-rose-50 text-rose-700 font-semibold', message: 'Prolonged/Abnormal' };
      if (val >= 1 && val <= 9) return { status: 'borderline', classNames: 'border-amber-500 bg-amber-50 text-amber-700 font-semibold', message: 'Borderline' };
      return { status: 'normal', classNames: 'border-emerald-500 bg-emerald-50 text-emerald-700', message: 'Normal' };
    }

    if (fieldName === 'thyroxine') {
      const outOfBounds = val < 25 || val > 300;
      if (outOfBounds) return { status: 'out', classNames: 'border-red-500 bg-red-50 text-red-700', message: 'Alert: Must be between 25 and 300 mcg/day' };
      if (val >= 151 && val <= 300) return { status: 'abnormal', classNames: 'border-rose-500 bg-rose-50 text-rose-700 font-semibold', message: 'Prolonged/Abnormal' };
      if (val >= 25 && val <= 49) return { status: 'borderline', classNames: 'border-amber-500 bg-amber-50 text-amber-700 font-semibold', message: 'Borderline' };
      return { status: 'normal', classNames: 'border-emerald-500 bg-emerald-50 text-emerald-700', message: 'Normal' };
    }

    if (fieldName === 'numberOfShocks') {
      const outOfBounds = val < 0 || val > 50;
      if (outOfBounds) return { status: 'out', classNames: 'border-red-500 bg-red-50 text-red-700', message: 'Alert: Must be between 0 and 50' };
      if (val >= 3) return { status: 'abnormal', classNames: 'border-rose-500 bg-rose-50 text-rose-700 font-semibold', message: 'Prolonged/Abnormal' };
      if (val >= 1 && val <= 2) return { status: 'borderline', classNames: 'border-amber-500 bg-amber-50 text-amber-700 font-semibold', message: 'Borderline' };
      return { status: 'normal', classNames: 'border-emerald-500 bg-emerald-50 text-emerald-700', message: 'Normal' };
    }

    if (fieldName === 'appropriateShocks') {
      const outOfBounds = val < 0 || val > 50;
      if (outOfBounds) return { status: 'out', classNames: 'border-red-500 bg-red-50 text-red-700', message: 'Alert: Must be between 0 and 50' };
      if (val >= 2) return { status: 'abnormal', classNames: 'border-rose-500 bg-rose-50 text-rose-700 font-semibold', message: 'Prolonged/Abnormal' };
      if (val === 1) return { status: 'borderline', classNames: 'border-amber-500 bg-amber-50 text-amber-700 font-semibold', message: 'Borderline' };
      return { status: 'normal', classNames: 'border-emerald-500 bg-emerald-50 text-emerald-700', message: 'Normal' };
    }

    if (fieldName === 'inappropriateShocks') {
      const outOfBounds = val < 0 || val > 50;
      if (outOfBounds) return { status: 'out', classNames: 'border-red-500 bg-red-50 text-red-700', message: 'Alert: Must be between 0 and 50' };
      if (val >= 2) return { status: 'abnormal', classNames: 'border-rose-500 bg-rose-50 text-rose-700 font-semibold', message: 'Prolonged/Abnormal' };
      if (val === 1) return { status: 'borderline', classNames: 'border-amber-500 bg-amber-50 text-amber-700 font-semibold', message: 'Borderline' };
      return { status: 'normal', classNames: 'border-emerald-500 bg-emerald-50 text-emerald-700', message: 'Normal' };
    }

    if (fieldName === 'bivPacingPercent') {
      const outOfBounds = val < 0 || val > 100;
      if (outOfBounds) return { status: 'out', classNames: 'border-red-500 bg-red-50 text-red-700', message: 'Alert: Must be between 0 and 100 %' };
      if (val < 85) return { status: 'abnormal', classNames: 'border-rose-500 bg-rose-50 text-rose-700 font-semibold', message: 'Prolonged/Abnormal' };
      if (val >= 85 && val <= 91) return { status: 'borderline', classNames: 'border-amber-500 bg-amber-50 text-amber-700 font-semibold', message: 'Borderline' };
      return { status: 'normal', classNames: 'border-emerald-500 bg-emerald-50 text-emerald-700', message: 'Normal' };
    }

    if (fieldName === 'afibBurden') {
      const outOfBounds = val < 0 || val > 100;
      if (outOfBounds) return { status: 'out', classNames: 'border-red-500 bg-red-50 text-red-700', message: 'Alert: Must be between 0 and 100 %' };
      if (val > 10) return { status: 'abnormal', classNames: 'border-rose-500 bg-rose-50 text-rose-700 font-semibold', message: 'Prolonged/Abnormal' };
      if (val > 0 && val <= 10) return { status: 'borderline', classNames: 'border-amber-500 bg-amber-50 text-amber-700 font-semibold', message: 'Borderline' };
      return { status: 'normal', classNames: 'border-emerald-500 bg-emerald-50 text-emerald-700', message: 'Normal' };
    }

    if (fieldName === 'nsvtEpisodes') {
      const outOfBounds = val < 0 || val > 100;
      if (outOfBounds) return { status: 'out', classNames: 'border-red-500 bg-red-50 text-red-700', message: 'Alert: Must be between 0 and 100' };
      if (val > 5) return { status: 'abnormal', classNames: 'border-rose-500 bg-rose-50 text-rose-700 font-semibold', message: 'Prolonged/Abnormal' };
      if (val >= 1 && val <= 5) return { status: 'borderline', classNames: 'border-amber-500 bg-amber-50 text-amber-700 font-semibold', message: 'Borderline' };
      return { status: 'normal', classNames: 'border-emerald-500 bg-emerald-50 text-emerald-700', message: 'Normal' };
    }

    if (fieldName === 'svtEpisodes') {
      const outOfBounds = val < 0 || val > 100;
      if (outOfBounds) return { status: 'out', classNames: 'border-red-500 bg-red-50 text-red-700', message: 'Alert: Must be between 0 and 100' };
      if (val > 3) return { status: 'abnormal', classNames: 'border-rose-500 bg-rose-50 text-rose-700 font-semibold', message: 'Prolonged/Abnormal' };
      if (val >= 1 && val <= 3) return { status: 'borderline', classNames: 'border-amber-500 bg-amber-50 text-amber-700 font-semibold', message: 'Borderline' };
      return { status: 'normal', classNames: 'border-emerald-500 bg-emerald-50 text-emerald-700', message: 'Normal' };
    }

    return { status: '', classNames: '', message: '' };
  };

  const renderDrugRow = (drug, errorKey) => {
    const cls = drug.clsKey ? getClassification(drug.clsKey, drug.dose) : { status: '', classNames: '', message: '' };
    const outErr = (cls.status === 'out') ? cls.message : null;
    const displayErr = outErr || (errorKey ? formErrors[errorKey] : null) || doseErrors[drug.label];
    const unit = drug.unit || 'mg/day';

    return (
      <div key={drug.label} className="flex items-center justify-between gap-2 py-0.5" id={errorKey || undefined}>
        <label className="flex items-center gap-1.5 cursor-pointer whitespace-nowrap">
          {drug.isOther && (
            <input disabled={readOnly}
              type="checkbox"
              checked={drug.val === 'Yes'}
              onChange={(e) => drug.set(e.target.checked ? 'Yes' : 'No')}
              className="rounded border-slate-300 text-teal-600 focus:ring-teal-500 w-3.5 h-3.5"
            />
          )}
          <span className="font-medium text-slate-700">{drug.label}</span>
        </label>
        <div className="flex items-center gap-1.5">
          {drug.name !== undefined && (
            <input disabled={readOnly}
              type="text"
              value={drug.name}
              onChange={(e) => drug.setName(e.target.value)}
              className="border border-slate-300 rounded p-1 text-xs w-36 focus:ring-1 focus:ring-teal-500 focus:border-teal-500 outline-none disabled:bg-slate-100 disabled:text-slate-400"
              placeholder="Details"
            />
          )}
          <div className="flex flex-col items-end">
            <div className="flex items-center gap-1">
              <input disabled={readOnly}
                type="text"
                value={drug.dose}
                onChange={(e) => handleDoseChange(e.target.value, drug.setDose, drug.label)}
                className={`border rounded p-1 text-xs w-24 focus:ring-0 outline-none text-right disabled:bg-slate-100 disabled:text-slate-400 ${
                  cls.status === 'normal' ? 'border-emerald-300 bg-emerald-50 text-emerald-800' :
                  cls.status === 'borderline' ? 'border-amber-300 bg-amber-50 text-amber-800 font-semibold' :
                  cls.status === 'abnormal' ? 'border-rose-300 bg-rose-50 text-rose-800 font-semibold' :
                  cls.status === 'out' || displayErr ? 'border-red-500 bg-red-50 text-red-800 font-bold' :
                  'border-slate-300'
                }`}
                placeholder="Dose"
              />
              <span className="text-[10px] text-slate-400 whitespace-nowrap">{unit}</span>
            </div>
            {drug.clsKey && cls.status && cls.status !== 'out' && (
              <span className={`text-[8px] px-1 py-0.2 rounded font-bold mt-0.5 whitespace-nowrap leading-none ${
                cls.status === 'normal' ? 'bg-emerald-100 text-emerald-800' :
                cls.status === 'borderline' ? 'bg-amber-100 text-amber-800' :
                'bg-rose-100 text-rose-800'
              }`}>{cls.message}</span>
            )}
            {displayErr && (
              <span className="text-red-500 text-[9px] block font-bold text-right w-full mt-0.5">{displayErr}</span>
            )}
          </div>
        </div>
      </div>
    );
  };
  const renderDeviceMetric = (label, value, setValue, fieldName, unit, errorKey, required = false, disabled = false, type = 'text') => {
    const cls = getClassification(fieldName, value);
    const outErr = (cls.status === 'out') ? cls.message : null;
    const displayErr = outErr || formErrors[errorKey];
    return (
      <div className="flex flex-col">
        <label className="block text-[10px] text-slate-600 mb-1">
          {label} {required && <span className="text-red-500 font-bold ml-0.5">*</span>}
        </label>
        <div className="flex items-center gap-1.5 w-full">
          <input disabled={readOnly || disabled}
            type={type}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            className={`border px-2 py-1 text-xs w-full focus:ring-1 focus:ring-teal-500 focus:border-teal-500 outline-none rounded text-right font-mono ${
              cls.status === 'normal' ? 'bg-emerald-50 text-emerald-800 border-emerald-300' :
              cls.status === 'borderline' ? 'bg-amber-50 text-amber-800 border-amber-300 font-semibold' :
              cls.status === 'abnormal' ? 'bg-rose-50 text-rose-800 border-rose-300 font-semibold' :
              cls.status === 'out' || formErrors[errorKey] ? 'bg-red-50 text-red-800 border-red-500 font-bold' :
              'border-slate-300'
            }`}
          />
          {unit && <span className="text-[10px] text-slate-400 font-medium whitespace-nowrap">{unit}</span>}
        </div>
        {cls.status && cls.status !== 'out' && (
          <span className={`text-[9px] font-bold mt-0.5 ${
            cls.status === 'normal' ? 'text-emerald-600' :
            cls.status === 'borderline' ? 'text-amber-600' :
            'text-rose-600'
          }`}>{cls.message}</span>
        )}
        {displayErr && (
          <span className="text-red-500 text-[9px] block font-bold mt-0.5 leading-tight">{displayErr}</span>
        )}
      </div>
    );
  };


  // State Management
  // 1. Patient Profile Fields
  
  const [address, setAddress] = useState(editingRecord?.patient?.address || editingRecord?.address || patient.address || '');
  const [highestEducation, setHighestEducation] = useState(() => {
    return editingRecord?.patient?.highestEducation ||
           editingRecord?.patient?.higherEducation ||
           editingRecord?.patient?.higher_education ||
           editingRecord?.highestEducation ||
           patient.highestEducation ||
           patient.higherEducation ||
           patient.higher_education ||
           '';
  });
  const [monthlyIncome, setMonthlyIncome] = useState(editingRecord?.patient?.monthlyIncome || patient.monthlyIncome || '');
  const [monthlyIncomeError, setMonthlyIncomeError] = useState(null);
  const [occupation, setOccupation] = useState(editingRecord?.patient?.occupation || patient.occupation || '');
  const [caregiverName, setCaregiverName] = useState(editingRecord?.patient?.caregiverName || patient.caregiverName || '');
  const [caregiverNameError, setCaregiverNameError] = useState(null);
  const [caregiverPhoneError, setCaregiverPhoneError] = useState(null);
  const [vWeightError, setVWeightError] = useState(null);
  const [vHeightError, setVHeightError] = useState(null);
  const [vHrError, setVHrError] = useState(null);
  const [vBpSittingSystolicError, setVBpSittingSystolicError] = useState(null);
  const [vBpSittingDiastolicError, setVBpSittingDiastolicError] = useState(null);
  const [vO2Error, setVO2Error] = useState(null);
  const [echoEfPercentError, setEchoEfPercentError] = useState(null);
  const [potassiumError, setPotassiumError] = useState(null);
  const [creatinineError, setCreatinineError] = useState(null);
  const [doseErrors, setDoseErrors] = useState({});
  const [labErrors, setLabErrors] = useState({});
  const [caregiverRelationship, setCaregiverRelationship] = useState(editingRecord?.patient?.caregiverRelationship || patient.caregiverRelationship || '');
  const [caregiverPhone, setCaregiverPhone] = useState(editingRecord?.patient?.caregiverPhone || patient.caregiverPhone || '');
  const [insuranceMode, setInsuranceMode] = useState(() => {
    const rawMode = editingRecord?.patient?.insuranceMode ||
                    editingRecord?.patient?.insurance_mode ||
                    editingRecord?.insuranceMode ||
                    '';
    return normalizeInsuranceModeForForm(rawMode);
  });
  const [referredFrom, setReferredFrom] = useState(editingRecord?.patient?.referredFrom || editingRecord?.referredFrom || editingRecord?.inpatientDetails?.referredFrom || '');
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
  const [hfType, setHfType] = useState(() => {
    const raw = editingRecord?.typeOfHF || editingRecord?.finalAssessment?.finalTypeOfHF;
    if (raw && (raw.includes('HFpEF') || raw.includes('preserved'))) return 'HFpEF (HF with preserved EF)';
    if (raw && (raw.includes('HFrEF') || raw.includes('reduced'))) return 'HFrEF (HF with reduced EF)';
    if (editingRecord?.finalClinicalAssessment?.hfpef === 'Yes') return 'HFpEF (HF with preserved EF)';
    if (editingRecord?.finalClinicalAssessment?.hfref === 'Yes') return 'HFrEF (HF with reduced EF)';
    return 'HFrEF (HF with reduced EF)';
  });
  const [hfStage, setHfStage] = useState(() => {
    const raw = editingRecord?.stageOfHF || editingRecord?.finalAssessment?.finalStage;
    if (raw) return raw;
    if (editingRecord?.finalClinicalAssessment?.stage_a === 'Yes') return 'Stage A';
    if (editingRecord?.finalClinicalAssessment?.stage_b === 'Yes') return 'Stage B';
    if (editingRecord?.finalClinicalAssessment?.stage_c === 'Yes') return 'Stage C';
    if (editingRecord?.finalClinicalAssessment?.stage_d === 'Yes') return 'Stage D';
    return 'Stage C';
  });
  const [hfNyha, setHfNyha] = useState(() => {
    const raw = editingRecord?.nyhaClass || editingRecord?.finalAssessment?.finalNyhaClass;
    if (raw) return raw;
    if (editingRecord?.finalClinicalAssessment?.nyha_class_1 === 'Yes') return 'NYHA Class I';
    if (editingRecord?.finalClinicalAssessment?.nyha_class_2 === 'Yes') return 'NYHA Class II';
    if (editingRecord?.finalClinicalAssessment?.nyha_class_3 === 'Yes') return 'NYHA Class III';
    if (editingRecord?.finalClinicalAssessment?.nyha_class_4 === 'Yes') return 'NYHA Class IV';
    return 'NYHA Class II';
  });
  const [hfAf, setHfAf] = useState(editingRecord?.afStatus ?? 'NSR');
  const [hfEtiologyCv, setHfEtiologyCv] = useState(editingRecord?.hfEtiology?.cardiovascular ?? []);
  const [hfEtiologyNonCv, setHfEtiologyNonCv] = useState(editingRecord?.hfEtiology?.nonCardiac ?? []);
  const [hfEtiologyPulm, setHfEtiologyPulm] = useState(editingRecord?.hfEtiology?.pulmonary ?? []);

  // 4. Final Clinical Assessment States
  const [finalNyha, setFinalNyha] = useState(editingRecord?.finalAssessment?.finalNyhaClass ?? editingRecord?.nyhaClass ?? 'NYHA Class II');
  const [finalStage, setFinalStage] = useState(editingRecord?.finalAssessment?.finalStage ?? editingRecord?.stageOfHF ?? 'Stage C');
  const [finalHfType, setFinalHfType] = useState(editingRecord?.finalAssessment?.finalTypeOfHF ?? editingRecord?.typeOfHF ?? 'HFrEF (HF with reduced EF)');
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
  const [maceNone, setMaceNone] = useState(editingRecord?.finalAssessment?.maceNone ?? 'No');
  const [hospNote, setHospNote] = useState(editingRecord?.finalAssessment?.hospNote || editingRecord?.hosp_note || editingRecord?.finalClinicalAssessment?.hosp_note || '');
  const [strokeNote, setStrokeNote] = useState(editingRecord?.finalAssessment?.strokeNote || editingRecord?.stroke_note || editingRecord?.finalClinicalAssessment?.stroke_note || '');
  const [bleedNote, setBleedNote] = useState(editingRecord?.finalAssessment?.bleedNote || editingRecord?.bleed_note || editingRecord?.finalClinicalAssessment?.bleed_note || '');
  const [arrhythmiaNote, setArrhythmiaNote] = useState(editingRecord?.finalAssessment?.arrhythmiaNote || editingRecord?.arrhythmia_note || editingRecord?.finalClinicalAssessment?.arrhythmia_note || '');
  const [procedureNote, setProcedureNote] = useState(editingRecord?.finalAssessment?.procedureNote || editingRecord?.procedure_note || editingRecord?.finalClinicalAssessment?.procedure_note || '');
  const [otherNote, setOtherNote] = useState(editingRecord?.finalAssessment?.otherNote || editingRecord?.other_note || editingRecord?.finalClinicalAssessment?.other_note || '');
  const [deathNote, setDeathNote] = useState(editingRecord?.finalAssessment?.deathNote || editingRecord?.death_note || editingRecord?.finalClinicalAssessment?.death_note || '');

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

  const renderInlineDate = (val, onChange, className = "border-b border-slate-300 p-0 focus:ring-0 text-xs bg-transparent", error = null) => {
    if (readOnly) {
      return <span className="text-slate-900 font-bold text-xs px-1">{formatDateToView(val) || '—'}</span>;
    }
    const formattedVal = val ? val.split('T')[0] : '';
    const finalClassName = error ? "border-b border-red-500 p-0 focus:ring-0 text-xs bg-red-50/50 text-red-700" : className;
    return (
      <input
        type="date"
        value={formattedVal}
        onChange={(e) => onChange(e.target.value)}
        className={finalClassName}
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

  const handleFieldChange = (fieldName, value, setter, setErrorState) => {
    const res = validateField(fieldName, value);
    if (!res.isValid) {
      setErrorState(res.error);
    } else if (res.warning) {
      setErrorState(res.warning);
    } else {
      setErrorState(null);
    }
    setter(value);
  };

  const handleDoseChange = (val, setDose, label) => {
    const res = validateField('dose', val);
    setDose(val);
    setDoseErrors(prev => ({
      ...prev,
      [label]: res.isValid ? (res.warning || null) : res.error
    }));
  };

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
  const [ecgExtraBeats, setEcgExtraBeats] = useState(() => {
    const raw = editingRecord?.investigations?.ecgExtraBeats;
    if (raw) {
      if (raw.includes('APC')) return 'APC';
      if (raw.includes('VPC')) return 'VPC';
      if (raw.includes('None')) return 'None';
      return raw;
    }
    if (editingRecord?.cardiacInvestigations?.ecg_apc === 'Yes') return 'APC';
    if (editingRecord?.cardiacInvestigations?.ecg_vpc === 'Yes') return 'VPC';
    if (editingRecord?.cardiacInvestigations?.ecg_extra_beats_none === 'Yes') return 'None';
    return '';
  });
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
  const [chkEchoEfPercent, setChkEchoEfPercent] = useState(Boolean(editingRecord?.investigations?.echoEfPercent));
  const [echoEfPercent, setEchoEfPercent] = useState(editingRecord?.investigations?.echoEfPercent ?? '');
  const [chkEchoEaRatio, setChkEchoEaRatio] = useState(Boolean(editingRecord?.investigations?.echoEaRatio));
  const [echoEaRatio, setEchoEaRatio] = useState(editingRecord?.investigations?.echoEaRatio ?? '');
  const [chkEchoRvTapsv, setChkEchoRvTapsv] = useState(Boolean(editingRecord?.investigations?.echoRvTapsv));
  const [echoRvTapsv, setEchoRvTapsv] = useState(editingRecord?.investigations?.echoRvTapsv ?? '');
  const [chkEchoEePrimeRatio, setChkEchoEePrimeRatio] = useState(Boolean(editingRecord?.investigations?.echoEePrimeRatio));
  const [echoEePrimeRatio, setEchoEePrimeRatio] = useState(editingRecord?.investigations?.echoEePrimeRatio ?? '');
  const [chkEchoEDecelTime, setChkEchoEDecelTime] = useState(Boolean(editingRecord?.investigations?.echoEDecelTime));
  const [echoEDecelTime, setEchoEDecelTime] = useState(editingRecord?.investigations?.echoEDecelTime ?? '');
  const [echoLaDimension, setEchoLaDimension] = useState(editingRecord?.investigations?.echoLaDimension ?? false);
  const [echoLvSystole, setEchoLvSystole] = useState(editingRecord?.investigations?.echoLvSystole ?? false);
  const [echoLvDiastole, setEchoLvDiastole] = useState(editingRecord?.investigations?.echoLvDiastole ?? false);
  const [echoMrMitralRegurg, setEchoMrMitralRegurg] = useState(() => {
    const raw = editingRecord?.investigations?.echoMrMitralRegurg;
    if (raw) {
      if (raw.includes('4plus') || raw.includes('4+')) return '4plus';
      if (raw.includes('3plus') || raw.includes('3+')) return '3plus';
      if (raw.includes('2plus') || raw.includes('2+')) return '2plus';
      if (raw.includes('1plus') || raw.includes('1+')) return '1plus';
      if (raw.includes('None')) return 'None';
      return raw;
    }
    if (editingRecord?.cardiacInvestigations?.mitral_regurgitation_4plus === 'Yes') return '4plus';
    if (editingRecord?.cardiacInvestigations?.mitral_regurgitation_3plus === 'Yes') return '3plus';
    if (editingRecord?.cardiacInvestigations?.mitral_regurgitation_2plus === 'Yes') return '2plus';
    if (editingRecord?.cardiacInvestigations?.mitral_regurgitation_1plus === 'Yes') return '1plus';
    if (editingRecord?.cardiacInvestigations?.mitral_regurgitation_none === 'Yes') return 'None';
    return '';
  });
  const [echoOtherValves, setEchoOtherValves] = useState(editingRecord?.investigations?.echoOtherValves ?? '');
  const [echoRvSystolicPressure, setEchoRvSystolicPressure] = useState(editingRecord?.investigations?.echoRvSystolicPressure ?? '');
  const [echoRvFunction, setEchoRvFunction] = useState(editingRecord?.investigations?.echoRvFunction ?? '');
  const [echoRwmi, setEchoRwmi] = useState(() => {
    const raw = editingRecord?.investigations?.echoRwmi;
    if (raw) {
      if (raw.includes('None') || raw.includes('No RWMI')) return 'None';
      if (raw.includes('Global')) return 'Global';
      if (raw.includes('Anterior')) return 'Anterior';
      if (raw.includes('Lateral')) return 'Lateral';
      if (raw.includes('Inferior')) return 'Inferior';
      return raw;
    }
    if (editingRecord?.cardiacInvestigations?.rwmi_none === 'Yes') return 'None';
    if (editingRecord?.cardiacInvestigations?.rwmi_global === 'Yes') return 'Global';
    if (editingRecord?.cardiacInvestigations?.rwmi_anterior === 'Yes') return 'Anterior';
    if (editingRecord?.cardiacInvestigations?.rwmi_lateral === 'Yes') return 'Lateral';
    if (editingRecord?.cardiacInvestigations?.rwmi_inferior === 'Yes') return 'Inferior';
    return '';
  });

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
  const [chkMriLvef, setChkMriLvef] = useState(Boolean(editingRecord?.investigations?.mriLvef));
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

  // 10. Imaging & Document Upload States
  const [tempHfId] = useState(() => 'temp-' + Date.now() + '-' + Math.round(Math.random() * 1000));
  const [uploadedDocs, setUploadedDocs] = useState([]);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [fileMetadata, setFileMetadata] = useState({});
  const [uploading, setUploading] = useState(false);

  // Central validation errors dictionary state
  const [formErrors, setFormErrors] = useState({});

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

  useEffect(() => {
    if (editingRecord) {
      // 1. HF Type, Stage, NYHA
      const rawType = editingRecord.typeOfHF || editingRecord.finalAssessment?.finalTypeOfHF;
      if (rawType && (rawType.includes('HFpEF') || rawType.includes('preserved'))) setHfType('HFpEF (HF with preserved EF)');
      else if (rawType && (rawType.includes('HFrEF') || rawType.includes('reduced'))) setHfType('HFrEF (HF with reduced EF)');
      else if (editingRecord.finalClinicalAssessment?.hfpef === 'Yes') setHfType('HFpEF (HF with preserved EF)');
      else if (editingRecord.finalClinicalAssessment?.hfref === 'Yes') setHfType('HFrEF (HF with reduced EF)');

      const rawStage = editingRecord.stageOfHF || editingRecord.finalAssessment?.finalStage;
      if (rawStage) setHfStage(rawStage);
      else if (editingRecord.finalClinicalAssessment?.stage_a === 'Yes') setHfStage('Stage A');
      else if (editingRecord.finalClinicalAssessment?.stage_b === 'Yes') setHfStage('Stage B');
      else if (editingRecord.finalClinicalAssessment?.stage_c === 'Yes') setHfStage('Stage C');
      else if (editingRecord.finalClinicalAssessment?.stage_d === 'Yes') setHfStage('Stage D');

      const rawNyha = editingRecord.nyhaClass || editingRecord.finalAssessment?.finalNyhaClass;
      if (rawNyha) setHfNyha(rawNyha);
      else if (editingRecord.finalClinicalAssessment?.nyha_class_1 === 'Yes') setHfNyha('NYHA Class I');
      else if (editingRecord.finalClinicalAssessment?.nyha_class_2 === 'Yes') setHfNyha('NYHA Class II');
      else if (editingRecord.finalClinicalAssessment?.nyha_class_3 === 'Yes') setHfNyha('NYHA Class III');
      else if (editingRecord.finalClinicalAssessment?.nyha_class_4 === 'Yes') setHfNyha('NYHA Class IV');

      // 2. Extra Beats
      const rawEb = editingRecord.investigations?.ecgExtraBeats;
      if (rawEb) {
        if (rawEb.includes('APC')) setEcgExtraBeats('APC');
        else if (rawEb.includes('VPC')) setEcgExtraBeats('VPC');
        else if (rawEb.includes('None')) setEcgExtraBeats('None');
      } else if (editingRecord.cardiacInvestigations?.ecg_apc === 'Yes') setEcgExtraBeats('APC');
      else if (editingRecord.cardiacInvestigations?.ecg_vpc === 'Yes') setEcgExtraBeats('VPC');
      else if (editingRecord.cardiacInvestigations?.ecg_extra_beats_none === 'Yes') setEcgExtraBeats('None');

      // 3. MR Mitral Regurgitation
      const rawMr = editingRecord.investigations?.echoMrMitralRegurg;
      if (rawMr) {
        if (rawMr.includes('4plus') || rawMr.includes('4+')) setEchoMrMitralRegurg('4plus');
        else if (rawMr.includes('3plus') || rawMr.includes('3+')) setEchoMrMitralRegurg('3plus');
        else if (rawMr.includes('2plus') || rawMr.includes('2+')) setEchoMrMitralRegurg('2plus');
        else if (rawMr.includes('1plus') || rawMr.includes('1+')) setEchoMrMitralRegurg('1plus');
        else if (rawMr.includes('None')) setEchoMrMitralRegurg('None');
      } else if (editingRecord.cardiacInvestigations?.mitral_regurgitation_4plus === 'Yes') setEchoMrMitralRegurg('4plus');
      else if (editingRecord.cardiacInvestigations?.mitral_regurgitation_3plus === 'Yes') setEchoMrMitralRegurg('3plus');
      else if (editingRecord.cardiacInvestigations?.mitral_regurgitation_2plus === 'Yes') setEchoMrMitralRegurg('2plus');
      else if (editingRecord.cardiacInvestigations?.mitral_regurgitation_1plus === 'Yes') setEchoMrMitralRegurg('1plus');
      else if (editingRecord.cardiacInvestigations?.mitral_regurgitation_none === 'Yes') setEchoMrMitralRegurg('None');

      // 4. RWMI
      const rawRwmi = editingRecord.investigations?.echoRwmi;
      if (rawRwmi) {
        if (rawRwmi.includes('None') || rawRwmi.includes('No RWMI')) setEchoRwmi('None');
        else if (rawRwmi.includes('Global')) setEchoRwmi('Global');
        else if (rawRwmi.includes('Anterior')) setEchoRwmi('Anterior');
        else if (rawRwmi.includes('Lateral')) setEchoRwmi('Lateral');
        else if (rawRwmi.includes('Inferior')) setEchoRwmi('Inferior');
      } else if (editingRecord.cardiacInvestigations?.rwmi_none === 'Yes') setEchoRwmi('None');
      else if (editingRecord.cardiacInvestigations?.rwmi_global === 'Yes') setEchoRwmi('Global');
      else if (editingRecord.cardiacInvestigations?.rwmi_anterior === 'Yes') setEchoRwmi('Anterior');
      else if (editingRecord.cardiacInvestigations?.rwmi_lateral === 'Yes') setEchoRwmi('Lateral');
      else if (editingRecord.cardiacInvestigations?.rwmi_inferior === 'Yes') setEchoRwmi('Inferior');

      // 5. Lab Tests
      if (editingRecord.investigations?.labTests) {
        setLabTests(editingRecord.investigations.labTests);
      }
    }
  }, [editingRecord]);

  const fetchUploadedDocuments = async () => {
    const activeHfId = editingRecord?.id || tempHfId;
    if (!activeHfId) return;
    try {
      const response = await api.get(`/documents/${activeHfId}`);
      if (response.data && response.data.success) {
        setUploadedDocs(response.data.data);
      }
    } catch (err) {
      console.error("Error loading uploaded documents:", err);
    }
  };

  const handleFileSelection = (e) => {
    const files = Array.from(e.target.files);
    
    // 1. Limit check
    if (uploadedDocs.length + selectedFiles.length + files.length > 5) {
      alert(`Upload blocked. A maximum of 5 files can be uploaded per Heart Failure form. Currently has ${uploadedDocs.length} uploaded and ${selectedFiles.length} pending.`);
      return;
    }

    // 2. Allowed file types (PDF, JPEG, JPG, PNG)
    const allowedMimeTypes = ["application/pdf", "image/jpeg", "image/jpg", "image/png"];
    const invalidFile = files.find(f => !allowedMimeTypes.includes(f.type));
    if (invalidFile) {
      alert(`Invalid file type: ${invalidFile.name}. Only PDFs and Images (JPEG, JPG, PNG) are allowed.`);
      return;
    }

    // 3. File size limit (5MB)
    const largeFile = files.find(f => f.size > 5 * 1024 * 1024);
    if (largeFile) {
      alert(`File size too large: ${largeFile.name}. There is a strict file size limit of 5 MB per file.`);
      return;
    }

    // Add to selected files & initialize metadata
    setSelectedFiles(prev => [...prev, ...files]);
    const initialMeta = {};
    files.forEach(f => {
      initialMeta[f.name] = { type: 'Other', notes: '' };
    });
    setFileMetadata(prev => ({ ...prev, ...initialMeta }));
  };

  const handleRemoveSelectedFile = (fileName) => {
    setSelectedFiles(prev => prev.filter(f => f.name !== fileName));
    setFileMetadata(prev => {
      const copy = { ...prev };
      delete copy[fileName];
      return copy;
    });
  };

  const handleMetadataChange = (fileName, key, value) => {
    setFileMetadata(prev => ({
      ...prev,
      [fileName]: {
        ...prev[fileName],
        [key]: value
      }
    }));
  };

  const handleUploadDocuments = async () => {
    if (selectedFiles.length === 0) {
      alert("Please select at least one document to upload.");
      return;
    }
    
    setUploading(true);
    const formData = new FormData();
    selectedFiles.forEach(file => {
      formData.append("files", file);
      formData.append("document_types", fileMetadata[file.name]?.type || "Other");
      formData.append("notes", fileMetadata[file.name]?.notes || "");
    });
    formData.append("hf_id", editingRecord?.id || tempHfId);
    formData.append("care_mr_no", patient.mrNo || "Unknown");

    try {
      const response = await api.post("/documents/upload", formData, {
        headers: {
          "Content-Type": "multipart/form-data"
        }
      });
      if (response.data && response.data.success) {
        alert("Documents uploaded successfully.");
        setSelectedFiles([]);
        setFileMetadata({});
        fetchUploadedDocuments();
      } else {
        alert(response.data?.message || "Failed to upload documents.");
      }
    } catch (error) {
      console.error("Error uploading documents:", error);
      alert(error.response?.data?.message || "Failed to upload documents.");
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteDocument = async (docId) => {
    if (!window.confirm("Are you sure you want to delete this document? This action cannot be undone.")) {
      return;
    }
    try {
      const response = await api.delete(`/documents/${docId}`);
      if (response.data && response.data.success) {
        alert("Document deleted successfully.");
        fetchUploadedDocuments();
      } else {
        alert(response.data?.message || "Failed to delete document.");
      }
    } catch (error) {
      console.error("Error deleting document:", error);
      alert(error.response?.data?.message || "Failed to delete document.");
    }
  };

  useEffect(() => {
    fetchUploadedDocuments();
  }, [editingRecord, tempHfId]);

  useEffect(() => {
    if (patientRecord?.patient) {
      const p = patientRecord.patient;
      const edu = p.highestEducation || p.higherEducation || p.higher_education;
      if (edu) {
        setHighestEducation(edu);
      }
      if (p.address && (!address || address === '')) {
        setAddress(p.address);
      }
      if (p.occupation && (!occupation || occupation === '')) {
        setOccupation(p.occupation);
      }
    }
  }, [patientRecord]);

  const getSubmissionData = () => {
    // Map lab tests checked property based on results presence
    const finalLabTests = {};
    Object.keys(labTests).forEach(key => {
      if (key === 'other') {
        finalLabTests.other = labTests.other;
      } else {
        const hasResult = labTests[key].result !== undefined && labTests[key].result !== null && String(labTests[key].result).trim() !== '';
        finalLabTests[key] = {
          ...labTests[key],
          checked: hasResult
        };
      }
    });

    return {
    id: editingRecord?.id ?? `hfa-${Date.now()}`,
    tempHfId: !editingRecord?.id ? tempHfId : undefined,
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

    typeOfHF: hfType || finalHfType,
    hfEtiology: {
      cardiovascular: hfEtiologyCv,
      nonCardiac: hfEtiologyNonCv,
      pulmonary: hfEtiologyPulm
    },
    stageOfHF: hfStage || finalStage,
    nyhaClass: hfNyha || finalNyha,
    afStatus: hfAf,
    finalAssessment: {
      finalNyhaClass: hfNyha,
      finalStage: hfStage,
      finalTypeOfHF: hfType,
      comorbidities,
      otherComorbidity,
      riskFactors,
      otherRiskFactor,
      etiologyOther,
      etiologyOtherDetails,
      maceNone,
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
      hospNote: maceHospitalization === 'Yes' ? hospNote : undefined,
      strokeNote: maceStroke === 'Yes' ? strokeNote : undefined,
      bleedNote: maceMajorBleed === 'Yes' ? bleedNote : undefined,
      arrhythmiaNote: maceSevereArrhythmia === 'Yes' ? arrhythmiaNote : undefined,
      procedureNote: maceProcedures === 'Yes' ? procedureNote : undefined,
      otherNote: maceOther === 'Yes' ? otherNote : undefined,
      deathNote: maceDeath === 'Yes' ? deathNote : undefined,
      clinicalNotes: finalClinicalNotes
    },
    investigations: {
      vacPneumococcal: vacPneumococcal ? 'Yes' : 'No',
      vacPneumococcalDate: vacPneumococcalDate || null,
      vacInfluenza: vacInfluenza ? 'Yes' : 'No',
      vacInfluenzaDate: vacInfluenzaDate || null,
      bloodGroup: bloodGroup || null,
      labTests: finalLabTests,
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
      carvedilol: (carvedilol === 'Yes' || carvedilolDose) ? 'Yes' : 'No',
      carvedilol_dose: carvedilolDose || null,
      bisoprolol: (bisoprolol === 'Yes' || bisoprololDose) ? 'Yes' : 'No',
      bisoprolol_dose: bisoprololDose || null,
      metoprolol_succinate: (metoprololSuccinate === 'Yes' || metoprololSuccinateDose) ? 'Yes' : 'No',
      metoprolol_succinate_dose: metoprololSuccinateDose || null,
      nebivolol: (nebivolol === 'Yes' || nebivololDose) ? 'Yes' : 'No',
      nebivolol_dose: nebivololDose || null,
      beta_blocker_other: (betaBlockerOther === 'Yes' || betaBlockerOtherDose || betaBlockerOtherName) ? 'Yes' : 'No',
      beta_blocker_other_name: betaBlockerOtherName || null,
      beta_blocker_other_dose: betaBlockerOtherDose || null,
      beta_not_used_bradycardia: betaNotUsedBradycardia === 'Yes' ? 'Yes' : 'No',
      beta_not_used_heart_blocks: betaNotUsedHeartBlocks === 'Yes' ? 'Yes' : 'No',
      beta_not_used_copd_asthma: betaNotUsedCopdAsthma === 'Yes' ? 'Yes' : 'No',
      beta_not_used_hypotension: betaNotUsedHypotension === 'Yes' ? 'Yes' : 'No',
      beta_not_used_other: betaNotUsedOther === 'Yes' ? 'Yes' : 'No',
      beta_not_used_other_reason: betaNotUsedOther === 'Yes' ? (betaNotUsedOtherReason || null) : null,
      enalapril: (enalapril === 'Yes' || enalaprilDose) ? 'Yes' : 'No',
      enalapril_dose: enalaprilDose || null,
      ramipril: (ramipril === 'Yes' || ramiprilDose) ? 'Yes' : 'No',
      ramipril_dose: ramiprilDose || null,
      lisinopril: (lisinopril === 'Yes' || lisinoprilDose) ? 'Yes' : 'No',
      lisinopril_dose: lisinoprilDose || null,
      perindopril: (perindopril === 'Yes' || perindoprilDose) ? 'Yes' : 'No',
      perindopril_dose: perindoprilDose || null,
      ace_other: (aceOther === 'Yes' || aceOtherDose || aceOtherName) ? 'Yes' : 'No',
      ace_other_name: aceOtherName || null,
      ace_other_dose: aceOtherDose || null,
      ace_not_used_elevated_creatinine: aceNotUsedElevatedCreatinine === 'Yes' ? 'Yes' : 'No',
      ace_not_used_hyperkalemia: aceNotUsedHyperkalemia === 'Yes' ? 'Yes' : 'No',
      ace_not_used_cough: aceNotUsedCough === 'Yes' ? 'Yes' : 'No',
      ace_not_used_hypotension: aceNotUsedHypotension === 'Yes' ? 'Yes' : 'No',
      ace_not_used_other: aceNotUsedOther === 'Yes' ? 'Yes' : 'No',
      ace_not_used_other_reason: aceNotUsedOther === 'Yes' ? (aceNotUsedOtherReason || null) : null,
      valsartan: (valsartan === 'Yes' || valsartanDose) ? 'Yes' : 'No',
      valsartan_dose: valsartanDose || null,
      losartan: (losartan === 'Yes' || losartanDose) ? 'Yes' : 'No',
      losartan_dose: losartanDose || null,
      telmisartan: (telmisartan === 'Yes' || telmisartanDose) ? 'Yes' : 'No',
      telmisartan_dose: telmisartanDose || null,
      olmesartan: (olmesartan === 'Yes' || olmesartanDose) ? 'Yes' : 'No',
      olmesartan_dose: olmesartanDose || null,
      arb_other: (arbOther === 'Yes' || arbOtherDose || arbOtherName) ? 'Yes' : 'No',
      arb_other_name: arbOtherName || null,
      arb_other_dose: arbOtherDose || null,
      arb_not_used_elevated_creatinine: arbNotUsedElevatedCreatinine === 'Yes' ? 'Yes' : 'No',
      arb_not_used_hyperkalemia: arbNotUsedHyperkalemia === 'Yes' ? 'Yes' : 'No',
      arb_not_used_hypotension: arbNotUsedHypotension === 'Yes' ? 'Yes' : 'No',
      arb_not_used_other: arbNotUsedOther === 'Yes' ? 'Yes' : 'No',
      arb_not_used_other_reason: arbNotUsedOther === 'Yes' ? (arbNotUsedOtherReason || null) : null,
      spironolactone: (spironolactone === 'Yes' || spironolactoneDose) ? 'Yes' : 'No',
      spironolactone_dose: spironolactoneDose || null,
      eplerenone: (eplerenone === 'Yes' || eplerenoneDose) ? 'Yes' : 'No',
      eplerenone_dose: eplerenoneDose || null,
      aldosterone_not_used_hyperkalemia: aldosteroneNotUsedHyperkalemia === 'Yes' ? 'Yes' : 'No',
      aldosterone_not_used_hyponatremia: aldosteroneNotUsedHyponatremia === 'Yes' ? 'Yes' : 'No',
      aldosterone_not_used_elevated_creatinine: aldosteroneNotUsedElevatedCreatinine === 'Yes' ? 'Yes' : 'No',
      aldosterone_not_used_other: aldosteroneNotUsedOther === 'Yes' ? 'Yes' : 'No',
      aldosterone_not_used_other_reason: aldosteroneNotUsedOther === 'Yes' ? (aldosteroneNotUsedOtherReason || null) : null,
      hydralazine: (hydralazine === 'Yes' || hydralazineDose || hydralazineName) ? 'Yes' : 'No',
      hydralazine_name: hydralazineName || null,
      hydralazine_dose: hydralazineDose || null,
      nitrate_1: (nitrate1 === 'Yes' || nitrate1Dose || nitrate1Name) ? 'Yes' : 'No',
      nitrate_1_name: nitrate1Name || null,
      nitrate_1_dose: nitrate1Dose || null,
      nitrate_2: (nitrate2 === 'Yes' || nitrate2Dose || nitrate2Name) ? 'Yes' : 'No',
      nitrate_2_name: nitrate2Name || null,
      nitrate_2_dose: nitrate2Dose || null,
      warfarin: (warfarin === 'Yes' || warfarinInr || warfarinTargetInr) ? 'Yes' : 'No',
      warfarin_inr: warfarinInr || null,
      warfarin_target_inr: warfarinTargetInr || null,
      vitamin_k_inhibitor: (vitaminKInhibitor === 'Yes' || vitaminKInhibitorDose || vitaminKInhibitorName) ? 'Yes' : 'No',
      vitamin_k_inhibitor_name: vitaminKInhibitorName || null,
      vitamin_k_inhibitor_dose: vitaminKInhibitorDose || null,
      noac: (noac === 'Yes' || noacDose || noacName) ? 'Yes' : 'No',
      noac_name: noacName || null,
      noac_dose: noacDose || null,
      acitrom: (acitrom === 'Yes' || acitromDose) ? 'Yes' : 'No',
      acitrom_dose: acitromDose || null,
      ufh: (ufh === 'Yes' || ufhDose) ? 'Yes' : 'No',
      ufh_dose: ufhDose || null,
      lmwh: (lmwh === 'Yes' || lmwhDose) ? 'Yes' : 'No',
      lmwh_dose: lmwhDose || null,
      aspirin: (aspirin === 'Yes' || aspirinDose) ? 'Yes' : 'No',
      aspirin_dose: aspirinDose || null,
      clopidogrel: (clopidogrel === 'Yes' || clopidogrelDose) ? 'Yes' : 'No',
      clopidogrel_dose: clopidogrelDose || null,
      prasugrel: (prasugrel === 'Yes' || prasugrelDose) ? 'Yes' : 'No',
      prasugrel_dose: prasugrelDose || null,
      ticagrelor: (ticagrelor === 'Yes' || ticagrelorDose) ? 'Yes' : 'No',
      ticagrelor_dose: ticagrelorDose || null,
      amiodarone: (amiodarone === 'Yes' || amiodaroneDose) ? 'Yes' : 'No',
      amiodarone_dose: amiodaroneDose || null,
      antiarrhythmic_other: (antiarrhythmicOther === 'Yes' || antiarrhythmicOtherDose || antiarrhythmicOtherName) ? 'Yes' : 'No',
      antiarrhythmic_other_name: antiarrhythmicOtherName || null,
      antiarrhythmic_other_dose: antiarrhythmicOtherDose || null,
      furosemide: (furosemide === 'Yes' || furosemideDose) ? 'Yes' : 'No',
      furosemide_dose: furosemideDose || null,
      torsemide: (torsemide === 'Yes' || torsemideDose) ? 'Yes' : 'No',
      torsemide_dose: torsemideDose || null,
      metolazone: (metolazone === 'Yes' || metolazoneDose) ? 'Yes' : 'No',
      metolazone_dose: metolazoneDose || null,
      diuretic_other: (diureticOther === 'Yes' || diureticOtherDose || diureticOtherName) ? 'Yes' : 'No',
      diuretic_other_name: diureticOtherName || null,
      diuretic_other_dose: diureticOtherDose || null,
      diuretic_not_used_hyponatremia: diureticNotUsedHyponatremia === 'Yes' ? 'Yes' : 'No',
      diuretic_not_used_hypokalemia: diureticNotUsedHypokalemia === 'Yes' ? 'Yes' : 'No',
      diuretic_not_used_worsening_renal_failure: diureticNotUsedWorseningRenalFailure === 'Yes' ? 'Yes' : 'No',
      diuretic_not_used_hypotension: diureticNotUsedHypotension === 'Yes' ? 'Yes' : 'No',
      diuretic_not_used_other: diureticNotUsedOther === 'Yes' ? 'Yes' : 'No',
      diuretic_not_used_other_reason: diureticNotUsedOther === 'Yes' ? (diureticNotUsedOtherReason || null) : null,
      digoxin: (digoxin === 'Yes' || digoxinDose || digoxinName) ? 'Yes' : 'No',
      digoxin_name: digoxinName || null,
      digoxin_dose: digoxinDose || null,
      ivabradine: (ivabradine === 'Yes' || ivabradineDose) ? 'Yes' : 'No',
      ivabradine_dose: ivabradineDose || null,
      atorvastatin: (atorvastatin === 'Yes' || atorvastatinDose) ? 'Yes' : 'No',
      atorvastatin_dose: atorvastatinDose || null,
      simvastatin: (simvastatin === 'Yes' || simvastatinDose) ? 'Yes' : 'No',
      simvastatin_dose: simvastatinDose || null,
      rosuvastatin: (rosuvastatin === 'Yes' || rosuvastatinDose) ? 'Yes' : 'No',
      rosuvastatin_dose: rosuvastatinDose || null,
      sulfonylureas: (sulfonylureas === 'Yes' || sulfonylureasDose) ? 'Yes' : 'No',
      sulfonylureas_dose: sulfonylureasDose || null,
      metformin: (metformin === 'Yes' || metforminDose) ? 'Yes' : 'No',
      metformin_dose: metforminDose || null,
      glitazone: (glitazone === 'Yes' || glitazoneDose) ? 'Yes' : 'No',
      glitazone_dose: glitazoneDose || null,
      gliptin: (gliptin === 'Yes' || gliptinDose) ? 'Yes' : 'No',
      gliptin_dose: gliptinDose || null,
      acarbose_derivative: (acarboseDerivative === 'Yes' || acarboseDerivativeDose) ? 'Yes' : 'No',
      acarbose_derivative_dose: acarboseDerivativeDose || null,
      human_insulin: (humanInsulin === 'Yes' || humanInsulinDose) ? 'Yes' : 'No',
      human_insulin_dose: humanInsulinDose || null,
      synthetic_insulin: (syntheticInsulin === 'Yes' || syntheticInsulinDose) ? 'Yes' : 'No',
      synthetic_insulin_dose: syntheticInsulinDose || null,
      antihypertensive: (antihypertensive === 'Yes' || antihypertensiveDose || antihypertensiveName) ? 'Yes' : 'No',
      antihypertensive_name: antihypertensiveName || null,
      antihypertensive_dose: antihypertensiveDose || null,
      thyroxine: (thyroxine === 'Yes' || thyroxineDose) ? 'Yes' : 'No',
      thyroxine_dose: thyroxineDose || null,
      other_medication_1: (otherMedication1 === 'Yes' || otherMedication1Dose || otherMedication1Name) ? 'Yes' : 'No',
      other_medication_1_name: otherMedication1Name || null,
      other_medication_1_dose: otherMedication1Dose || null,
      other_medication_2: (otherMedication2 === 'Yes' || otherMedication2Dose || otherMedication2Name) ? 'Yes' : 'No',
      other_medication_2_name: otherMedication2Name || null,
      other_medication_2_dose: otherMedication2Dose || null,
      other_medication_3: (otherMedication3 === 'Yes' || otherMedication3Dose || otherMedication3Name) ? 'Yes' : 'No',
      other_medication_3_name: otherMedication3Name || null,
      other_medication_3_dose: otherMedication3Dose || null,
      other_medication_4: (otherMedication4 === 'Yes' || otherMedication4Dose || otherMedication4Name) ? 'Yes' : 'No',
      other_medication_4_name: otherMedication4Name || null,
      other_medication_4_dose: otherMedication4Dose || null
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
      icd_shock: (icdShock === 'Yes' || numberOfShocks !== '' || appropriateShocks !== '' || inappropriateShocks !== '' || causeOfShocks !== '') ? 'Yes' : 'No',
      number_of_shocks: numberOfShocks !== '' ? Number(numberOfShocks) : null,
      appropriate_shocks: appropriateShocks !== '' ? Number(appropriateShocks) : null,
      inappropriate_shocks: inappropriateShocks !== '' ? Number(inappropriateShocks) : null,
      cause_of_shocks: causeOfShocks || null,
      atp: (atp === 'Yes' || atpTimes !== '' || atpSuccessAlways === 'Yes' || atpSuccessMostTimes === 'Yes' || atpSuccessSometimes === 'Yes' || atpSuccessNotSuccessful === 'Yes') ? 'Yes' : 'No',
      atp_times: atpTimes !== '' ? Number(atpTimes) : null,
      atp_success_always: atpSuccessAlways === 'Yes' ? 'Yes' : 'No',
      atp_success_most_times: atpSuccessMostTimes === 'Yes' ? 'Yes' : 'No',
      atp_success_sometimes: atpSuccessSometimes === 'Yes' ? 'Yes' : 'No',
      atp_success_not_successful: atpSuccessNotSuccessful === 'Yes' ? 'Yes' : 'No',
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
      fluid_and_diet: (recFluidDiet === 'Yes' || recFluidDietDetails) ? 'Yes' : 'No',
      fluid_and_diet_details: recFluidDietDetails || null,
      exercise: (recExercise === 'Yes' || recExerciseDetails) ? 'Yes' : 'No',
      exercise_details: recExerciseDetails || null,
      yoga: (recYoga === 'Yes' || recYogaDetails) ? 'Yes' : 'No',
      yoga_details: recYogaDetails || null,
      smoking_cessation: (recSmokingCessation === 'Yes' || recSmokingCessationDetails) ? 'Yes' : 'No',
      smoking_cessation_details: recSmokingCessationDetails || null,
      stress_management: (recStressManagement === 'Yes' || recStressManagementDetails) ? 'Yes' : 'No',
      stress_management_details: recStressManagementDetails || null,
      drugs: (recDrugs === 'Yes' || recDrugsDetails) ? 'Yes' : 'No',
      drugs_details: recDrugsDetails || null,
      investigations: (recInvestigations === 'Yes' || recInvestigationsDetails) ? 'Yes' : 'No',
      investigations_details: recInvestigationsDetails || null,
      procedures: (recProcedures === 'Yes' || recProceduresDetails) ? 'Yes' : 'No',
      procedures_details: recProceduresDetails || null,
      other_recommendation: (recOther === 'Yes' || recOtherDetails) ? 'Yes' : 'No',
      other_recommendation_details: recOtherDetails || null
    }
  };
};

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

  const validateForm = (isDraft = false) => {
    if (isDraft) {
      setFormErrors({});
      return true;
    }

    const newErrors = {};

    // Helper to validate simple inputs
    const req = (val, key, msg = 'This field is required') => {
      if (val === undefined || val === null || String(val).trim() === '') {
        newErrors[key] = msg;
      }
    };

    // Helper to check at least one true checkbox/value in an array or object
    const reqOneOf = (arrOrObj, key, msg = 'Please select at least one option') => {
      if (Array.isArray(arrOrObj)) {
        if (arrOrObj.length === 0) newErrors[key] = msg;
      } else if (typeof arrOrObj === 'object' && arrOrObj !== null) {
        const hasAny = Object.values(arrOrObj).some(v => v === true || v === 'Yes');
        if (!hasAny) newErrors[key] = msg;
      }
    };

    // --- Section 1: Profile & Administrative ---
    req(visitType, 'visitType');
    req(caregiverName, 'caregiverName');
    req(caregiverRelationship, 'caregiverRelationship');
    req(caregiverPhone, 'caregiverPhone');
    req(insuranceMode, 'insuranceMode');
    req(assessmentDate, 'assessmentDate');
    req(presentDiagnosis, 'presentDiagnosis');

    // Date of Discharge & Cardiologist are unconditionally required
    req(dischargeDate, 'dischargeDate');
    req(treatingCardiologist, 'treatingCardiologist');

    if (visitType === 'Inpatient') {
      req(daysHospitalized, 'daysHospitalized');
      if (presentDiagnosis !== 'Heart Failure') {
        req(nonHfAdmissionReason, 'nonHfAdmissionReason');
      }
    }

    // --- Section 2: Inpatient Precipitating Factors ---
    if (presentDiagnosis === 'Heart Failure') {
      reqOneOf(precipitatingFactors, 'precipitatingFactors');
    }

    // --- Section 3: Initial Clinical Assessment ---
    req(previousDiagnosis, 'previousDiagnosis');
    req(previousHfHospitalization, 'previousHfHospitalization');
    if (previousHfHospitalization === 'Yes') {
      req(recentHospitalizationDates, 'recentHospitalizationDates');
      req(recentHospitalizationReasons, 'recentHospitalizationReasons');
    }

    // Medical History
    const hasHistory = [historyCabg, historyPtca, historyStroke, historyMajorBleed, historyThrombolysis, historyPastMi].some(h => h === 'Yes');
    if (!hasHistory) {
      newErrors.medicalHistory = 'Please select at least one medical history option';
    }
    if (historyPastMi === 'Yes') {
      req(pastMiYearsAgo, 'pastMiYearsAgo');
      req(pastMiLocation, 'pastMiLocation');
    }

    // VT/VF Risk assessment subfields
    if (complaintsSyncope === 'Yes') {
      req(syncopeFrequency, 'syncopeFrequency');
    }
    if (documentedPvcs === 'Yes') {
      req(pvcCount, 'pvcCount');
      req(pvcFrequency, 'pvcFrequency');
    }
    if (documentedNsvt === 'Yes') {
      req(nsvtFrequency, 'nsvtFrequency');
    }

    // Vitals
    req(vUnableToWeigh, 'vUnableToWeigh');
    if (vUnableToWeigh === 'Yes') {
      req(vUnableToWeighReason, 'vUnableToWeighReason');
    } else {
      req(vWeight, 'vWeight');
    }
    req(vHeight, 'vHeight');
    req(vHr, 'vHr');
    if (vHrRegular !== 'Yes' && vHrIrregular !== 'Yes') {
      newErrors.vHrRegular = 'Please select regularity';
    }
    req(vRr, 'vRr');
    req(vBpSittingSystolic, 'vBpSittingSystolic');
    req(vBpSittingDiastolic, 'vBpSittingDiastolic');
    req(vBpStandingSystolic, 'vBpStandingSystolic');
    req(vBpStandingDiastolic, 'vBpStandingDiastolic');

    // O2 Saturation
    req(vO2, 'vO2');

    // Mental Status
    const hasMentalStatus = [vMentalAlert, vMentalConfused, vMentalDrowsy].some(m => m === 'Yes');
    if (!hasMentalStatus) {
      newErrors.mentalStatus = 'Please select mental status';
    }

    // Symptoms
    const hasSymptom = [symptomDyspneaAtRest, symptomDyspneaWithExertion, symptomFatigue, symptomOrthopnea, symptomLossOfAppetite, symptomDecreasedExercise, symptomWeightGain, symptomWeightLoss, symptomSyncope, symptomPnd, symptomMuscleCramps, symptomWheeze, symptomGiddiness, symptomOther].some(s => s === 'Yes');
    if (!hasSymptom) {
      newErrors.symptoms = 'Please select at least one symptom';
    }

    // Clinical Signs of Volume Overload
    const hasSign = [signPeripheralEdema, signRales, signHepatomegaly, signAscites, signJvp, signClinicalOther].some(s => s === 'Yes');
    if (!hasSign) {
      newErrors.clinicalSigns = 'Please select at least one clinical sign';
    }

    // --- Section 4: Final Clinical Assessment ---
    req(hfType, 'hfType');
    req(hfStage, 'hfStage');
    
    // Checkboxes / arrays for Etiology: Cardiovascular, Non-cardiac, Pulmonary, Comorbidities
    reqOneOf(hfEtiologyCv, 'hfEtiologyCv', 'Select at least one cardiovascular etiology');
    reqOneOf(hfEtiologyNonCv, 'hfEtiologyNonCv', 'Select at least one non-cardiac etiology');
    reqOneOf(hfEtiologyPulm, 'hfEtiologyPulm', 'Select at least one pulmonary etiology');
    reqOneOf(comorbidities, 'comorbidities', 'Select at least one comorbidity');
    
    // MACE Checkbox selection
    const hasMace = [maceHospitalization, maceStroke, maceProcedures, maceMajorBleed, maceSevereArrhythmia, maceOther, maceDeath, maceNone].some(m => m === 'Yes');
    if (!hasMace) {
      newErrors.mace = 'Please select at least one MACE option or No MACE Events';
    }

    if (maceHospitalization === 'Yes') req(hospNote, 'hospNote');
    if (maceStroke === 'Yes') req(strokeNote, 'strokeNote');
    if (maceMajorBleed === 'Yes') req(bleedNote, 'bleedNote');
    if (maceSevereArrhythmia === 'Yes') req(arrhythmiaNote, 'arrhythmiaNote');
    if (maceProcedures === 'Yes') req(procedureNote, 'procedureNote');
    if (maceDeath === 'Yes') {
      req(maceDeathDate, 'maceDeathDate');
      req(maceDeathLocation, 'maceDeathLocation');
      req(maceDeathReason, 'maceDeathReason');
    }

    // --- Section 5: Investigations ---
    const checkLimits = (valStr, fieldName, errorKey) => {
      if (valStr !== undefined && valStr !== null && String(valStr).trim() !== '') {
        const res = getClassification(fieldName, valStr);
        if (res.status === 'out') {
          newErrors[errorKey] = res.message;
        }
      }
    };

    req(ecgDate, 'ecgDate');
    req(ecgQrsDuration, 'ecgQrsDuration');
    checkLimits(ecgQrsDuration, 'qrs', 'ecgQrsDuration');
    checkLimits(ecgQt, 'qt', 'ecgQt');
    checkLimits(ecgQtc, 'qtc', 'ecgQtc');

    req(ecgRhythm, 'ecgRhythm');
    if (ecgRhythm === 'Other') req(ecgRhythmOther, 'ecgRhythmOther');
    req(ecgBlockages, 'ecgBlockages');

    req(cxrDate, 'cxrDate');
    req(cxrCtRatio, 'cxrCtRatio');
    checkLimits(cxrCtRatio, 'ctRatio', 'cxrCtRatio');

    req(echoDate, 'echoDate');
    req(echoEfPercent, 'echoEfPercent');
    checkLimits(echoEfPercent, 'ef', 'echoEfPercent');

    req(echoEaRatio, 'echoEaRatio');
    checkLimits(echoEaRatio, 'eaRatio', 'echoEaRatio');

    req(echoRvTapsv, 'echoRvTapsv');
    checkLimits(echoRvTapsv, 'tapse', 'echoRvTapsv');

    req(echoEePrimeRatio, 'echoEePrimeRatio');
    checkLimits(echoEePrimeRatio, 'eePrime', 'echoEePrimeRatio');

    req(echoEDecelTime, 'echoEDecelTime');
    checkLimits(echoEDecelTime, 'eDecel', 'echoEDecelTime');

    req(echoMrMitralRegurg, 'echoMrMitralRegurg');
    req(echoOtherValves, 'echoOtherValves');

    req(echoRvSystolicPressure, 'echoRvSystolicPressure');
    checkLimits(echoRvSystolicPressure, 'rvsp', 'echoRvSystolicPressure');

    req(echoRvFunction, 'echoRvFunction');
    req(echoRwmi, 'echoRwmi');

    req(holterDate, 'holterDate');
    req(holterVentricularArrhythmia, 'holterVentricularArrhythmia');
    req(holterAtrialArrhythmias, 'holterAtrialArrhythmias');
    req(holterHrv, 'holterHrv');
    if (['Yes', 'Complex VPC', 'NSVT', 'VT'].includes(holterVentricularArrhythmia) && !holterVpcChecked) {
      newErrors.holterVpcChecked = 'VPC must be checked if ventricular arrhythmia is documented';
    }

    req(sixMwtStatus, 'sixMwtStatus');
    if (sixMwtStatus === 'Done') {
      req(sixMwtDistance, 'sixMwtDistance');
      req(sixMwtHrRecovery, 'sixMwtHrRecovery');
    } else if (sixMwtStatus === 'Not Done') {
      req(sixMwtNotDoneReason, 'sixMwtNotDoneReason');
    }
    req(anaerobicDate, 'anaerobicDate');
    req(angioStatus, 'angioStatus');
    if (angioStatus === 'Done') {
      req(angioFinding, 'angioFinding');
    }

    if (vacPneumococcal) {
      req(vacPneumococcalDate, 'vacPneumococcalDate');
    }
    if (vacInfluenza) {
      req(vacInfluenzaDate, 'vacInfluenzaDate');
    }

    // Lab Tests section: At least one lab test from the lab test list must have its result and date filled.
    const hasAnyLabTest = Object.keys(labTests).some(key => {
      if (key === 'other') return false;
      const test = labTests[key];
      return test && test.result && String(test.result).trim() !== '' && test.date && String(test.date).trim() !== '';
    });
    if (!hasAnyLabTest) {
      newErrors.labTests = 'Please enter result and date for at least one lab test';
    }

    ['potassium', 'creatinine', 'hb', 'calcium', 'bun', 'glucose', 'hba1c', 'magnesium', 'sodium', 'tsh', 't3', 't4', 'bnp', 'ntProBnp', 'ldl', 'inr', 'st2'].forEach(key => {
      const valStr = labTests[key]?.result;
      if (valStr !== undefined && valStr !== null && String(valStr).trim() !== '') {
        const res = getClassification(key, valStr);
        if (res.status === 'out') {
          newErrors[key] = res.message;
        }
      }
    });

    // --- Section 6: Medical Therapy ---
    req(drugIntoleranceContraindications, 'drugIntoleranceContraindications');
    req(recommendedConsults, 'recommendedConsults');

    // 1. Beta-Blocker
    const hasBetaDose = [carvedilolDose, bisoprololDose, metoprololSuccinateDose, nebivololDose, betaBlockerOtherDose].some(d => d && String(d).trim() !== '');
    const hasBetaContra = [betaNotUsedBradycardia, betaNotUsedHeartBlocks, betaNotUsedCopdAsthma, betaNotUsedHypotension, betaNotUsedOther].some(c => c === 'Yes');
    
    if (carvedilolDose && String(carvedilolDose).trim() !== '') checkLimits(carvedilolDose, 'carvedilol', 'carvedilolDose');
    if (bisoprololDose && String(bisoprololDose).trim() !== '') checkLimits(bisoprololDose, 'bisoprolol', 'bisoprololDose');
    if (metoprololSuccinateDose && String(metoprololSuccinateDose).trim() !== '') checkLimits(metoprololSuccinateDose, 'metoprolol', 'metoprololSuccinateDose');
    if (nebivololDose && String(nebivololDose).trim() !== '') checkLimits(nebivololDose, 'nebivolol', 'nebivololDose');

    if (enalaprilDose && String(enalaprilDose).trim() !== '') checkLimits(enalaprilDose, 'enalapril', 'enalaprilDose');
    if (ramiprilDose && String(ramiprilDose).trim() !== '') checkLimits(ramiprilDose, 'ramipril', 'ramiprilDose');
    if (lisinoprilDose && String(lisinoprilDose).trim() !== '') checkLimits(lisinoprilDose, 'lisinopril', 'lisinoprilDose');
    if (perindoprilDose && String(perindoprilDose).trim() !== '') checkLimits(perindoprilDose, 'perindopril', 'perindoprilDose');

    if (valsartanDose && String(valsartanDose).trim() !== '') checkLimits(valsartanDose, 'valsartan', 'valsartanDose');
    if (losartanDose && String(losartanDose).trim() !== '') checkLimits(losartanDose, 'losartan', 'losartanDose');
    if (telmisartanDose && String(telmisartanDose).trim() !== '') checkLimits(telmisartanDose, 'telmisartan', 'telmisartanDose');
    if (olmesartanDose && String(olmesartanDose).trim() !== '') checkLimits(olmesartanDose, 'olmesartan', 'olmesartanDose');

    if (spironolactoneDose && String(spironolactoneDose).trim() !== '') checkLimits(spironolactoneDose, 'spironolactone', 'spironolactoneDose');
    if (eplerenoneDose && String(eplerenoneDose).trim() !== '') checkLimits(eplerenoneDose, 'eplerenone', 'eplerenoneDose');

    if (acitromDose && String(acitromDose).trim() !== '') checkLimits(acitromDose, 'acitrom', 'acitromDose');
    if (ufhDose && String(ufhDose).trim() !== '') checkLimits(ufhDose, 'ufh', 'ufhDose');
    if (lmwhDose && String(lmwhDose).trim() !== '') checkLimits(lmwhDose, 'lmwh', 'lmwhDose');

    if (aspirinDose && String(aspirinDose).trim() !== '') checkLimits(aspirinDose, 'aspirin', 'aspirinDose');
    if (clopidogrelDose && String(clopidogrelDose).trim() !== '') checkLimits(clopidogrelDose, 'clopidogrel', 'clopidogrelDose');
    if (prasugrelDose && String(prasugrelDose).trim() !== '') checkLimits(prasugrelDose, 'prasugrel', 'prasugrelDose');
    if (ticagrelorDose && String(ticagrelorDose).trim() !== '') checkLimits(ticagrelorDose, 'ticagrelor', 'ticagrelorDose');

    if (amiodaroneDose && String(amiodaroneDose).trim() !== '') checkLimits(amiodaroneDose, 'amiodarone', 'amiodaroneDose');

    if (furosemideDose && String(furosemideDose).trim() !== '') checkLimits(furosemideDose, 'furosemide', 'furosemideDose');
    if (torsemideDose && String(torsemideDose).trim() !== '') checkLimits(torsemideDose, 'torsemide', 'torsemideDose');
    if (metolazoneDose && String(metolazoneDose).trim() !== '') checkLimits(metolazoneDose, 'metolazone', 'metolazoneDose');

    if (digoxinDose && String(digoxinDose).trim() !== '') checkLimits(digoxinDose, 'digoxin', 'digoxinDose');
    if (ivabradineDose && String(ivabradineDose).trim() !== '') checkLimits(ivabradineDose, 'ivabradine', 'ivabradineDose');

    if (atorvastatinDose && String(atorvastatinDose).trim() !== '') checkLimits(atorvastatinDose, 'atorvastatin', 'atorvastatinDose');
    if (simvastatinDose && String(simvastatinDose).trim() !== '') checkLimits(simvastatinDose, 'simvastatin', 'simvastatinDose');
    if (rosuvastatinDose && String(rosuvastatinDose).trim() !== '') checkLimits(rosuvastatinDose, 'rosuvastatin', 'rosuvastatinDose');

    if (sulfonylureasDose && String(sulfonylureasDose).trim() !== '') checkLimits(sulfonylureasDose, 'sulfonylureas', 'sulfonylureasDose');
    if (metforminDose && String(metforminDose).trim() !== '') checkLimits(metforminDose, 'metformin', 'metforminDose');
    if (glitazoneDose && String(glitazoneDose).trim() !== '') checkLimits(glitazoneDose, 'glitazone', 'glitazoneDose');
    if (gliptinDose && String(gliptinDose).trim() !== '') checkLimits(gliptinDose, 'gliptin', 'gliptinDose');
    if (acarboseDerivativeDose && String(acarboseDerivativeDose).trim() !== '') checkLimits(acarboseDerivativeDose, 'acarbose', 'acarboseDerivativeDose');
    if (humanInsulinDose && String(humanInsulinDose).trim() !== '') checkLimits(humanInsulinDose, 'insulin', 'humanInsulinDose');
    if (syntheticInsulinDose && String(syntheticInsulinDose).trim() !== '') checkLimits(syntheticInsulinDose, 'insulin', 'syntheticInsulinDose');
    if (antihypertensiveDose && String(antihypertensiveDose).trim() !== '') checkLimits(antihypertensiveDose, 'antihypertensive', 'antihypertensiveDose');
    if (thyroxineDose && String(thyroxineDose).trim() !== '') checkLimits(thyroxineDose, 'thyroxine', 'thyroxineDose');

    if (!hasBetaDose && !hasBetaContra) newErrors.betaBlocker = 'Please enter a dose or select a contraindication';

    // 2. ACE Inhibitor
    const hasAceDose = [enalaprilDose, ramiprilDose, lisinoprilDose, perindoprilDose, aceOtherDose].some(d => d && String(d).trim() !== '');
    const hasAceContra = [aceNotUsedElevatedCreatinine, aceNotUsedHyperkalemia, aceNotUsedCough, aceNotUsedHypotension, aceNotUsedOther].some(c => c === 'Yes');
    if (!hasAceDose && !hasAceContra) newErrors.aceInhibitor = 'Please enter a dose or select a contraindication';

    // 3. Angiotensin Receptor Blocker
    const hasArbDose = [losartanDose, telmisartanDose, valsartanDose, olmesartanDose, arbOtherDose].some(d => d && String(d).trim() !== '');
    const hasArbContra = [arbNotUsedElevatedCreatinine, arbNotUsedHyperkalemia, arbNotUsedHypotension, arbNotUsedOther].some(c => c === 'Yes');
    if (!hasArbDose && !hasArbContra) newErrors.arb = 'Please enter a dose or select a contraindication';

    // 4. Aldosterone Antagonist
    const hasAldoDose = [spironolactoneDose, eplerenoneDose].some(d => d && String(d).trim() !== '');
    const hasAldoContra = [aldosteroneNotUsedHyperkalemia, aldosteroneNotUsedHyponatremia, aldosteroneNotUsedElevatedCreatinine, aldosteroneNotUsedOther].some(c => c === 'Yes');
    if (!hasAldoDose && !hasAldoContra) newErrors.aldosterone = 'Please enter a dose or select a contraindication';

    // 5. Hydralazine
    const hasHydraDose = [hydralazineDose, hydralazineName].some(d => d && String(d).trim() !== '');
    if (!hasHydraDose) newErrors.hydralazine = 'Please specify Hydralazine dose or details';

    // 6. Nitrate
    const hasNitrateDose = [nitrate1Dose, nitrate2Dose, nitrate1Name, nitrate2Name].some(d => d && String(d).trim() !== '');
    if (!hasNitrateDose) newErrors.nitrate = 'Please specify Nitrate dose or details';

    // 7. Anticoagulation
    const hasAnticoagDose = [warfarinInr, warfarinTargetInr, vitaminKInhibitorDose, vitaminKInhibitorName, noacDose, noacName, acitromDose, ufhDose, lmwhDose].some(d => d && String(d).trim() !== '');
    if (!hasAnticoagDose) newErrors.anticoagulation = 'Please specify Anticoagulation dose or details';

    // 8. Anti-platelet
    const hasAntiplateletDose = [aspirinDose, clopidogrelDose, prasugrelDose, ticagrelorDose].some(d => d && String(d).trim() !== '');
    if (!hasAntiplateletDose) newErrors.antiplatelet = 'Please specify Anti-platelet dose';

    // 9. Antiarrhythmic
    const hasAntiarrhythmicDose = [amiodaroneDose, antiarrhythmicOtherDose, antiarrhythmicOtherName].some(d => d && String(d).trim() !== '');
    if (!hasAntiarrhythmicDose) newErrors.antiarrhythmic = 'Please specify Antiarrhythmic dose';

    // 10. Diuretic
    const hasDiureticDose = [furosemideDose, torsemideDose, metolazoneDose, diureticOtherDose].some(d => d && String(d).trim() !== '');
    const hasDiureticContra = [diureticNotUsedHyponatremia, diureticNotUsedHypokalemia, diureticNotUsedWorseningRenalFailure, diureticNotUsedHypotension, diureticNotUsedOther].some(c => c === 'Yes');
    if (!hasDiureticDose && !hasDiureticContra) newErrors.diuretic = 'Please enter a dose or select a contraindication';

    // 11. Digoxin
    const hasDigoxinDose = [digoxinDose, digoxinName].some(d => d && String(d).trim() !== '');
    if (!hasDigoxinDose) newErrors.digoxin = 'Please specify Digoxin dose';

    // 12. Ivabradine
    const hasIvabradineDose = [ivabradineDose].some(d => d && String(d).trim() !== '');
    if (!hasIvabradineDose) newErrors.ivabradine = 'Please specify Ivabradine dose';

    // 13. Statins
    const hasStatinDose = [atorvastatinDose, simvastatinDose, rosuvastatinDose].some(d => d && String(d).trim() !== '');
    if (!hasStatinDose) newErrors.statins = 'Please specify Statin dose';

    // 14. Antidiabetics
    const hasAntidiabeticsDose = [sulfonylureasDose, metforminDose, glitazoneDose, gliptinDose, acarboseDerivativeDose, humanInsulinDose, syntheticInsulinDose].some(d => d && String(d).trim() !== '');
    if (!hasAntidiabeticsDose) newErrors.antidiabetics = 'Please specify Antidiabetic dose';

    // --- Section 7: Device Therapy ---
    const hasCurrentDevice = currentDeviceNone === 'Yes' || [currentDeviceYes, currentCrtP, currentCrtD, currentIcdSc, currentIcdDc, currentDualChamberPacemaker, currentSingleChamberPacemaker, currentDeviceOther].some(c => c === 'Yes');
    if (!hasCurrentDevice) newErrors.currentDevice = 'Please select current device therapy status';

    const hasEligibleDevice = eligibleNo === 'Yes' || [eligibleYes, eligibleCrtP, eligibleCrtD, eligibleIcdSc, eligibleIcdDc, eligibleDualChamberPacemaker, eligibleSingleChamberPacemaker, eligibleOther].some(c => c === 'Yes');
    if (!hasEligibleDevice) newErrors.eligibleDevice = 'Please select eligibility status';

    req(eligibleDeviceBrand, 'eligibleDeviceBrand');
    
    const hasAcceptance = patientAcceptanceYes === 'Yes' || patientAcceptanceNo === 'Yes';
    if (!hasAcceptance) {
      newErrors.patientAcceptance = 'Please select patient acceptance';
    } else if (patientAcceptanceNo === 'Yes') {
      req(patientAcceptanceReason, 'patientAcceptanceReason');
    }

    req(icdShock, 'icdShock');
    if (icdShock === 'Yes') {
      req(numberOfShocks, 'numberOfShocks');
      req(appropriateShocks, 'appropriateShocks');
      req(inappropriateShocks, 'inappropriateShocks');
      req(causeOfShocks, 'causeOfShocks');

      if (numberOfShocks && String(numberOfShocks).trim() !== '') checkLimits(numberOfShocks, 'numberOfShocks', 'numberOfShocks');
      if (appropriateShocks && String(appropriateShocks).trim() !== '') checkLimits(appropriateShocks, 'appropriateShocks', 'appropriateShocks');
      if (inappropriateShocks && String(inappropriateShocks).trim() !== '') checkLimits(inappropriateShocks, 'inappropriateShocks', 'inappropriateShocks');
    }

    req(atp, 'atp');
    if (atp === 'Yes') {
      req(atpTimes, 'atpTimes');
    }

    req(bivPacingPercent, 'bivPacingPercent');
    if (bivPacingPercent && String(bivPacingPercent).trim() !== '') checkLimits(bivPacingPercent, 'bivPacingPercent', 'bivPacingPercent');

    req(afibBurden, 'afibBurden');
    if (afibBurden && String(afibBurden).trim() !== '') checkLimits(afibBurden, 'afibBurden', 'afibBurden');

    req(nsvtEpisodes, 'nsvtEpisodes');
    if (nsvtEpisodes && String(nsvtEpisodes).trim() !== '') checkLimits(nsvtEpisodes, 'nsvtEpisodes', 'nsvtEpisodes');

    if (svtEpisodes && String(svtEpisodes).trim() !== '') checkLimits(svtEpisodes, 'svtEpisodes', 'svtEpisodes');

    // --- Section 8 & 9: Education & Recommendations ---
    const allCounseling = [eduDiet, eduExercise, eduWeight, eduDisease, eduSmoking, eduAlcohol, eduCompliance, eduWorsened, eduDevice].every(c => c === 'Yes');
    if (!allCounseling) newErrors.patientEducation = 'All counseling topics must be documented';

    const hasAnyRecommendation = [
      recFluidDietDetails,
      recExerciseDetails,
      recYogaDetails,
      recSmokingCessationDetails,
      recStressManagementDetails,
      recDrugsDetails,
      recInvestigationsDetails,
      recProceduresDetails,
      recOtherDetails
    ].some(d => d && String(d).trim() !== '');

    if (!hasAnyRecommendation) {
      newErrors.recommendations = 'At least one recommendation detail must be entered';
    }

    setFormErrors(newErrors);

    if (Object.keys(newErrors).length > 0) {
      console.log('Validation failed:', newErrors);
      alert('Please fill out all mandatory fields highlighted in red.');
      
      const firstErrorKey = Object.keys(newErrors)[0];
      const elementCandidates = [
        document.getElementById(`hf-${firstErrorKey}`),
        document.getElementById(firstErrorKey),
        document.getElementById(`${firstErrorKey}Block`),
        document.getElementsByName(firstErrorKey)[0],
        document.getElementById(firstErrorKey === 'labTests' ? 'labTestsBlock' : ''),
        document.getElementById(firstErrorKey === 'symptoms' ? 'symptomsBlock' : ''),
        document.getElementById(firstErrorKey === 'clinicalSigns' ? 'clinicalSignsBlock' : ''),
        document.getElementById(firstErrorKey === 'medicalHistory' ? 'medicalHistoryBlock' : ''),
        document.getElementById(firstErrorKey === 'mentalStatus' ? 'mentalStatusBlock' : ''),
        document.getElementById(firstErrorKey === 'mace' ? 'maceBlock' : ''),
        document.getElementById(firstErrorKey === 'recommendations' ? 'recommendationsBlock' : '')
      ];
      
      const errorElement = elementCandidates.find(el => el !== null && el !== undefined);
      if (errorElement) {
        errorElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        const input = errorElement.tagName === 'INPUT' || errorElement.tagName === 'SELECT' || errorElement.tagName === 'TEXTAREA'
          ? errorElement
          : errorElement.querySelector('input:not([disabled]), select:not([disabled]), textarea:not([disabled])');
        if (input) {
          setTimeout(() => {
            try { input.focus(); } catch(e) {}
          }, 500);
        }
      }
      return false;
    }

    return true;
  };

  useImperativeHandle(ref, () => ({
    getSubmissionData,
    handleSubmit,
    validateForm
  }));

  return (
    <fieldset disabled={readOnly} className="contents border-none p-0 m-0">
      <div className="space-y-6">
      {/* 1. Patient Profile */}
      <SectionCard title="1. Patient Profile" subtitle="Master registry demographics and baseline comorbidities">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs md:col-span-1">
            <span className="text-slate-400 font-semibold uppercase block">HF ID</span>
            <span className="text-slate-800 font-bold block mt-1">{editingRecord?.hf_registry_no || editingRecord?.hfRegistryNo || 'New'}</span>
          </div>
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs md:col-span-1">
            <span className="text-slate-400 font-semibold uppercase block">CARE MR No.</span>
            <span className="text-slate-800 font-bold block mt-1">{patient.mrNo || '—'}</span>
          </div>
          <div className="md:col-span-2">
            <RadioGroup readOnly={readOnly}
              id="visitType"
              label="Visit Type"
              name="hf-visit-type"
              value={visitType}
              onChange={setVisitType}
              options={['Inpatient', 'Outpatient', 'Home']}
              columns={3}
              required={true}
              error={formErrors.visitType}
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
  {patientAge ?? '—'} years / {patient.dob 
    ? new Date(patient.dob).toLocaleDateString('en-GB', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      }).replace(/\//g, '-') 
    : '—'}
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
            <span className="text-slate-800 font-bold block mt-1 whitespace-pre-wrap">{patient.address || address || editingRecord?.address || editingRecord?.patient?.address || '—'}</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs">
            <span className="text-slate-400 font-semibold uppercase block">Highest Education Level</span>
            <span className="text-slate-800 font-bold block mt-1">{patient.higherEducation || highestEducation || '—'}</span>
          </div>
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs">
            <span className="text-slate-400 font-semibold uppercase block">Occupation</span>
            <span className="text-slate-800 font-bold block mt-1">{patient.occupation || occupation || '—'}</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <TextInput readOnly={readOnly}
            id="monthlyIncome"
            label="Monthly Income"
            value={monthlyIncome}
            onChange={(val) => handleFieldChange('monthlyIncome', val, setMonthlyIncome, setMonthlyIncomeError)}
            placeholder="E.g. 40000"
            required={false}
            error={monthlyIncomeError}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <TextInput readOnly={readOnly}
            id="caregiverName"
            label="Caregiver Name"
            value={caregiverName}
            onChange={(val) => handleFieldChange('caregiverName', val, setCaregiverName, setCaregiverNameError)}
            placeholder="Caregiver Name"
            required={true}
            error={formErrors.caregiverName || caregiverNameError}
          />
          <TextInput readOnly={readOnly}
            id="caregiverRelationship"
            label="Relationship to Patient"
            value={caregiverRelationship}
            onChange={setCaregiverRelationship}
            placeholder="E.g. Son / Spouse"
            required={true}
            error={formErrors.caregiverRelationship}
          />
          <TextInput readOnly={readOnly}
            id="caregiverPhone"
            label="Caregiver Phone No."
            value={caregiverPhone}
            onChange={(val) => handleFieldChange('caregiverPhone', val, setCaregiverPhone, setCaregiverPhoneError)}
            placeholder="Caregiver Phone number"
            required={true}
            error={formErrors.caregiverPhone || caregiverPhoneError}
          />
        </div>

        <div className="grid grid-cols-1 gap-4 mb-4">
          <RadioGroup readOnly={readOnly}
            id="insuranceMode"
            label="Insurance / Payment Mode"
            name="hf-insurance"
            value={insuranceMode}
            onChange={setInsuranceMode}
            options={INSURANCE_OPTIONS}
            columns={5}
            required={true}
            error={formErrors.insuranceMode}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <DateInput readOnly={readOnly}
            id="assessmentDate"
            label="Date of Visit / Hospitalization"
            value={assessmentDate}
            onChange={setAssessmentDate}
            required={true}
            error={formErrors.assessmentDate}
          />
          <DateInput readOnly={readOnly}
            id="dischargeDate"
            label="Date of Discharge"
            value={dischargeDate}
            onChange={setDischargeDate}
            required={visitType === 'Inpatient'}
            error={formErrors.dischargeDate}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <Select readOnly={readOnly}
            id="treatingCardiologist"
            label="Treating Cardiologist"
            value={treatingCardiologist}
            onChange={setTreatingCardiologist}
            options={CARDIOLOGISTS}
            required={visitType === 'Inpatient'}
            error={formErrors.treatingCardiologist}
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
            id="presentDiagnosis"
            label="Present Diagnosis"
            value={presentDiagnosis}
            onChange={setPresentDiagnosis}
            placeholder="Enter active diagnoses, comorbidities, and main reasons for admission/consultation..."
            rows={4}
            required={true}
            error={formErrors.presentDiagnosis}
          />
        </div>
      </SectionCard>

      {/* 2. Inpatient Details Section */}
      <SectionCard title="2. Inpatient Details" subtitle="Precipitating factors and admission context for heart failure hospitalizations">
        <fieldset disabled={readOnly || visitType !== 'Inpatient'} className={`space-y-4 ${visitType !== 'Inpatient' ? 'opacity-50 pointer-events-none' : ''}`}>
          <CheckboxGroup readOnly={readOnly || visitType !== 'Inpatient'}
            label="If admission for heart failure, please select precipitating factors for admission:"
            options={PRECIPITATING_FACTORS_OPTIONS}
            values={precipitatingFactors}
            onChange={setPrecipitatingFactors}
            columns={3}
            required={visitType === 'Inpatient' && presentDiagnosis === 'Heart Failure'}
            error={formErrors.precipitatingFactors}
          />

          <div className="grid grid-cols-1 gap-4">
            <TextInput readOnly={readOnly || visitType !== 'Inpatient'}
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
              <TextInput readOnly={readOnly || visitType !== 'Inpatient'}
                id="nonHfAdmissionReason"
                label="If admission for reasons other than heart failure, please specify reason(s):"
                value={nonHfAdmissionReason}
                onChange={setNonHfAdmissionReason}
                placeholder="E.g., Elective procedure, trauma, etc."
                required={visitType === 'Inpatient' && presentDiagnosis !== 'Heart Failure'}
                error={formErrors.nonHfAdmissionReason}
              />
            </div>
            <div>
              <NumberInput readOnly={readOnly || visitType !== 'Inpatient'}
                id="daysHospitalized"
                label="No. of days hospitalized"
                value={daysHospitalized}
                onChange={setDaysHospitalized}
                placeholder="Number of days"
                required={visitType === 'Inpatient'}
                error={formErrors.daysHospitalized}
              />
              <span className="text-[10px] text-slate-400 block mt-1">
                Note: Update LOS & date of discharge upon receiving info.
              </span>
            </div>
          </div>
        </fieldset>
      </SectionCard>

      {/* 3. Initial Clinical Assessment Dashboard */}
      <SectionCard title="3. Initial Clinical Assessment" subtitle="Patient background, prior hospitalizations, vitals layout and diagnostic signs">
        <div className="space-y-5">
          
          {/* Subsection: Previous Diagnosis */}
          <div className="bg-slate-50 p-4 border border-slate-200 rounded-xl">
            <TextInput readOnly={readOnly}
              id="previousDiagnosis"
              label="Previous Diagnosis"
              value={previousDiagnosis}
              onChange={setPreviousDiagnosis}
              placeholder="Specify historical diagnostic parameters..."
              required={true}
              error={formErrors.previousDiagnosis}
            />
          </div>

          {/* Subsection: Medical History Layout Panel */}
          <div className={`bg-slate-50 p-4 border rounded-xl space-y-3 ${formErrors.medicalHistory ? 'border-red-500 bg-red-50/20' : 'border-slate-200'}`} id="medicalHistoryBlock">
            <span className="form-subsection-heading">Medical History <span className="text-red-500 font-bold ml-0.5">*</span></span>
            {formErrors.medicalHistory && (
              <span className="text-red-500 text-[10px] font-bold block mt-1">{formErrors.medicalHistory}</span>
            )}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 text-xs">
              <label className="flex items-center gap-2 p-2 bg-white rounded-lg border border-slate-200 cursor-pointer">
                <input disabled={readOnly} type="checkbox" checked={historyCabg === 'Yes'} onChange={(e) => setHistoryCabg(e.target.checked ? 'Yes' : 'No')} />
                <span className="font-medium text-slate-700">CABG</span>
              </label>
              <label className="flex items-center gap-2 p-2 bg-white rounded-lg border border-slate-200 cursor-pointer">
                <input disabled={readOnly} type="checkbox" checked={historyPtca === 'Yes'} onChange={(e) => setHistoryPtca(e.target.checked ? 'Yes' : 'No')} />
                <span className="font-medium text-slate-700">PTCA</span>
              </label>
              <label className="flex items-center gap-2 p-2 bg-white rounded-lg border border-slate-200 cursor-pointer">
                <input disabled={readOnly} type="checkbox" checked={historyStroke === 'Yes'} onChange={(e) => setHistoryStroke(e.target.checked ? 'Yes' : 'No')} />
                <span className="font-medium text-slate-700">Stroke</span>
              </label>
              <label className="flex items-center gap-2 p-2 bg-white rounded-lg border border-slate-200 cursor-pointer">
                <input disabled={readOnly} type="checkbox" checked={historyMajorBleed === 'Yes'} onChange={(e) => setHistoryMajorBleed(e.target.checked ? 'Yes' : 'No')} />
                <span className="font-medium text-slate-700">Major Bleed</span>
              </label>
              <label className="flex items-center gap-2 p-2 bg-white rounded-lg border border-slate-200 cursor-pointer">
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
              <div className={`contents ${historyPastMi === 'Yes' ? '' : 'opacity-60'}`}>
                <NumberInput readOnly={readOnly} disabled={historyPastMi !== 'Yes'} id="pastMiYearsAgo" label="No. of years ago" value={pastMiYearsAgo} onChange={setPastMiYearsAgo} placeholder="Years" required={historyPastMi === 'Yes'} error={formErrors.pastMiYearsAgo} />
                <TextInput readOnly={readOnly} disabled={historyPastMi !== 'Yes'} id="pastMiLocation" label="Location of MI" value={pastMiLocation} onChange={setPastMiLocation} placeholder="Anterior / Inferior etc." required={historyPastMi === 'Yes'} error={formErrors.pastMiLocation} />
              </div>
            </div>
            <TextInput readOnly={readOnly} id="hf-history-other" label="Others (Specify separate medical histories)" value={historyOther} onChange={setHistoryOther} placeholder="E.g. Dyslipidemia, PVD" />
          </div>

          {/* Subsection: Recent Hospitalization logs */}
          <div className="bg-slate-50 p-4 border border-slate-200 rounded-xl space-y-3">
            <span className="form-subsection-heading">Recent Hospitalization(s)</span>
            <RadioGroup readOnly={readOnly}
              id="previousHfHospitalization"
              label="History of hospitalization for heart failure:"
              name="hf-history-hosp"
              value={previousHfHospitalization}
              onChange={setPreviousHfHospitalization}
              options={['Yes', 'No']}
              columns={2}
              required={true}
              error={formErrors.previousHfHospitalization}
            />
            <div className={`grid grid-cols-1 md:grid-cols-2 gap-4 ${previousHfHospitalization === 'Yes' ? '' : 'opacity-60'}`}>
              <TextInput readOnly={readOnly} disabled={previousHfHospitalization !== 'Yes'} id="recentHospitalizationDates" label="Date(s)" value={recentHospitalizationDates} onChange={setRecentHospitalizationDates} placeholder="E.g. March 2026, Dec 2025" required={previousHfHospitalization === 'Yes'} error={formErrors.recentHospitalizationDates} />
              <TextInput readOnly={readOnly} disabled={previousHfHospitalization !== 'Yes'} id="recentHospitalizationReasons" label="Reason(s)" value={recentHospitalizationReasons} onChange={setRecentHospitalizationReasons} placeholder="E.g. Decompensated HF secondary to infection" required={previousHfHospitalization === 'Yes'} error={formErrors.recentHospitalizationReasons} />
            </div>
          </div>

          {/* Subsection: VT/VF Risk Panel */}
          <div className="bg-slate-50 p-4 border border-slate-200 rounded-xl space-y-4">
            <span className="form-subsection-heading">VT/VF Risk Assessment <span className="text-red-500 font-bold ml-0.5">*</span></span>
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
                  <div className={`${complaintsSyncope === 'Yes' ? '' : 'opacity-60'}`}>
                    <TextInput readOnly={readOnly} disabled={complaintsSyncope !== 'Yes'} id="syncopeFrequency" label="Frequency of episodes" value={syncopeFrequency} onChange={setSyncopeFrequency} placeholder="E.g. Twice in last month" required={complaintsSyncope === 'Yes'} error={formErrors.syncopeFrequency} />
                  </div>
                </div>
              </div>

              <div className="space-y-3 bg-white p-3 rounded-lg border border-slate-200">
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer">
                    <input disabled={readOnly} type="checkbox" checked={documentedPvcs === 'Yes'} onChange={(e) => setDocumentedPvcs(e.target.checked ? 'Yes' : 'No')} />
                    <span>Documented PVCs</span>
                  </label>
                  <div className={`${documentedPvcs === 'Yes' ? '' : 'opacity-60'}`}>
                    <div className="grid grid-cols-2 gap-2">
                      <NumberInput readOnly={readOnly} disabled={documentedPvcs !== 'Yes'} id="pvcCount" label="Number of PVCs" value={pvcCount} onChange={setPvcCount} required={documentedPvcs === 'Yes'} error={formErrors.pvcCount} />
                      <TextInput readOnly={readOnly} disabled={documentedPvcs !== 'Yes'} id="pvcFrequency" label="Frequency / Pattern" value={pvcFrequency} onChange={setPvcFrequency} placeholder="E.g. Bigeminy" required={documentedPvcs === 'Yes'} error={formErrors.pvcFrequency} />
                    </div>
                  </div>
                </div>

                <hr className="border-slate-100" />

                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer">
                    <input disabled={readOnly} type="checkbox" checked={documentedNsvt === 'Yes'} onChange={(e) => setDocumentedNsvt(e.target.checked ? 'Yes' : 'No')} />
                    <span>Documented NSVT</span>
                  </label>
                  <div className={`${documentedNsvt === 'Yes' ? '' : 'opacity-60'}`}>
                    <TextInput readOnly={readOnly} disabled={documentedNsvt !== 'Yes'} id="nsvtFrequency" label="Frequency of episodes" value={nsvtFrequency} onChange={setNsvtFrequency} placeholder="Runs / duration" required={documentedNsvt === 'Yes'} error={formErrors.nsvtFrequency} />
                  </div>
                </div>
              </div>

            </div>
          </div>

          {/* Subsection: Physical Vitals Panels */}
          <div className="bg-slate-50 p-4 border border-slate-200 rounded-xl space-y-4">
            <span className="form-subsection-heading">Vitals Metrics</span>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <NumberInput readOnly={readOnly} id="vWeight" label="Weight (kg)" disabled={vUnableToWeigh === 'Yes'} value={vWeight} onChange={(val) => handleFieldChange('weight', val, setVWeight, setVWeightError)} required={vUnableToWeigh === 'No'} error={formErrors.vWeight || vWeightError} />
                <label className="flex items-center gap-1.5 mt-1.5 text-xs text-slate-500 cursor-pointer">
                  <input disabled={readOnly} type="checkbox" checked={vUnableToWeigh === 'Yes'} onChange={(e) => setVUnableToWeigh(e.target.checked ? 'Yes' : 'No')} />
                  <span>Unable to weigh (Measure at earliest opportunity)</span>
                </label>
                <div className={`mt-2 ${vUnableToWeigh === 'Yes' ? '' : 'opacity-60'}`}>
                  <TextInput readOnly={readOnly} disabled={vUnableToWeigh !== 'Yes'} id="vUnableToWeighReason" label="Specify Reason" value={vUnableToWeighReason} onChange={setVUnableToWeighReason} required={vUnableToWeigh === 'Yes'} error={formErrors.vUnableToWeighReason} />
                </div>
              </div>
              <div>
                <NumberInput readOnly={readOnly} id="vHeight" label="Height (Cm)" value={vHeight} onChange={(val) => handleFieldChange('height', val, setVHeight, setVHeightError)} required={true} error={formErrors.vHeight || vHeightError} />
              </div>
              <div className="p-3 bg-white rounded-lg border border-slate-200 flex flex-col justify-center">
                <span className="text-slate-400 font-semibold text-[10px] uppercase block">Calculated BMI</span>
                <span className="text-slate-800 font-bold text-sm block mt-0.5">{vBmi ?? '—'}</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <NumberInput readOnly={readOnly} id="vHr" label="Heart Rate (resting) (Bpm)" required={true} value={vHr} onChange={(val) => handleFieldChange('heartRate', val, setVHr, setVHrError)} error={formErrors.vHr || vHrError} />
              </div>
              <div className="md:col-span-2">
                <label className="form-field-label mb-2">Regularity <span className="text-red-500 font-bold ml-0.5">*</span></label>
                <div className="grid grid-cols-2 gap-4">
                  <label className={`flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer p-2 bg-white rounded-lg border ${formErrors.vHrRegular ? 'border-red-500' : 'border-slate-200'}`}>
                    <input disabled={readOnly} type="checkbox" checked={vHrRegular === 'Yes'} onChange={(e) => {
                      setVHrRegular(e.target.checked ? 'Yes' : 'No');
                      if(e.target.checked) setVHrIrregular('No');
                    }} />
                    <span>Regular</span>
                  </label>
                  <label className={`flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer p-2 bg-white rounded-lg border ${formErrors.vHrRegular ? 'border-red-500' : 'border-slate-200'}`}>
                    <input disabled={readOnly} type="checkbox" checked={vHrIrregular === 'Yes'} onChange={(e) => {
                      setVHrIrregular(e.target.checked ? 'Yes' : 'No');
                      if(e.target.checked) setVHrRegular('No');
                    }} />
                    <span>Irregular</span>
                  </label>
                </div>
                {formErrors.vHrRegular && (
                  <span className="text-red-500 text-[10px] font-bold block mt-1">{formErrors.vHrRegular}</span>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <NumberInput readOnly={readOnly} id="vRr" label="Respiratory Rate" value={vRr} onChange={setVRr} required={true} error={formErrors.vRr} />
              <NumberInput readOnly={readOnly} id="vO2" label="O₂ Saturation (%)" max={100} value={vO2} onChange={(val) => handleFieldChange('o2Saturation', val, setVO2, setVO2Error)} required={true} error={formErrors.vO2 || vO2Error} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-3 bg-white rounded-lg border border-slate-200">
                <label className="form-field-label mb-1">Blood Pressure: Sitting / Supine (mmHg) <span className="text-red-500 font-bold ml-0.5">*</span></label>
                <div className="flex gap-2">
                  <NumberInput readOnly={readOnly} id="vBpSittingSystolic" value={vBpSittingSystolic} onChange={(val) => handleFieldChange('systolicBp', val, setVBpSittingSystolic, setVBpSittingSystolicError)} placeholder="Sys" required={true} error={formErrors.vBpSittingSystolic || vBpSittingSystolicError} />
                  <span className="self-center text-slate-400">/</span>
                  <NumberInput readOnly={readOnly} id="vBpSittingDiastolic" value={vBpSittingDiastolic} onChange={(val) => handleFieldChange('diastolicBp', val, setVBpSittingDiastolic, setVBpSittingDiastolicError)} placeholder="Dia" required={true} error={formErrors.vBpSittingDiastolic || vBpSittingDiastolicError} />
                </div>
              </div>
              <div className="p-3 bg-white rounded-lg border border-slate-200">
                <label className="form-field-label mb-1">Blood Pressure: Standing (mmHg) <span className="text-red-500 font-bold ml-0.5">*</span></label>
                <div className="flex gap-2">
                  <NumberInput readOnly={readOnly} id="vBpStandingSystolic" value={vBpStandingSystolic} onChange={setVBpStandingSystolic} placeholder="Sys" required={true} error={formErrors.vBpStandingSystolic} />
                  <span className="self-center text-slate-400">/</span>
                  <NumberInput readOnly={readOnly} id="vBpStandingDiastolic" value={vBpStandingDiastolic} onChange={setVBpStandingDiastolic} placeholder="Dia" required={true} error={formErrors.vBpStandingDiastolic} />
                </div>
              </div>
            </div>

            <div className="space-y-2" id="mentalStatusBlock">
              <label className="form-field-label">Mental Status <span className="text-red-500 font-bold ml-0.5">*</span></label>
              <div className={`grid grid-cols-3 gap-3 text-xs p-1 rounded ${formErrors.mentalStatus ? 'border border-red-500 bg-red-50/20' : ''}`}>
                <label className="flex items-center gap-2 p-2 bg-white rounded-lg border border-slate-200 cursor-pointer">
                  <input disabled={readOnly} type="checkbox" checked={vMentalAlert === 'Yes'} onChange={(e) => {
                    setVMentalAlert(e.target.checked ? 'Yes' : 'No');
                    if(e.target.checked) { setVMentalConfused('No'); setVMentalDrowsy('No'); }
                  }} />
                  <span>Alert / Oriented</span>
                </label>
                <label className="flex items-center gap-2 p-2 bg-white rounded-lg border border-slate-200 cursor-pointer">
                  <input disabled={readOnly} type="checkbox" checked={vMentalConfused === 'Yes'} onChange={(e) => {
                    setVMentalConfused(e.target.checked ? 'Yes' : 'No');
                    if(e.target.checked) { setVMentalAlert('No'); setVMentalDrowsy('No'); }
                  }} />
                  <span>Confused</span>
                </label>
                <label className="flex items-center gap-2 p-2 bg-white rounded-lg border border-slate-200 cursor-pointer">
                  <input disabled={readOnly} type="checkbox" checked={vMentalDrowsy === 'Yes'} onChange={(e) => {
                    setVMentalDrowsy(e.target.checked ? 'Yes' : 'No');
                    if(e.target.checked) { setVMentalAlert('No'); setVMentalConfused('No'); }
                  }} />
                  <span>Drowsy</span>
                </label>
              </div>
              {formErrors.mentalStatus && (
                <span className="text-red-500 text-[10px] font-bold block mt-1">{formErrors.mentalStatus}</span>
              )}
            </div>
          </div>

          {/* Subsection: Present Symptoms Matrix */}
          <div className={`bg-slate-50 p-4 border rounded-xl space-y-3 ${formErrors.symptoms ? 'border-red-500 bg-red-50/20' : 'border-slate-200'}`} id="symptomsBlock">
            <span className="form-subsection-heading">Symptoms <span className="text-red-500 font-bold ml-0.5">*</span></span>
            {formErrors.symptoms && (
              <span className="text-red-500 text-[10px] font-bold block mt-1">{formErrors.symptoms}</span>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2 text-xs bg-white p-3 rounded-lg border border-slate-200">
              
              <div className="flex items-center justify-between py-1 border-b border-slate-100">
                <span className="form-field-label">Dyspnea at rest:</span>
                <RadioGroup readOnly={readOnly} name="s-dar" value={symptomDyspneaAtRest} onChange={setSymptomDyspneaAtRest} options={['Yes', 'No']} columns={2} hideLabel />
              </div>
              <div className="flex items-center justify-between py-1 border-b border-slate-100">
                <span className="form-field-label">Weight Loss:</span>
                <RadioGroup readOnly={readOnly} name="s-wl" value={symptomWeightLoss} onChange={setSymptomWeightLoss} options={['Yes', 'No']} columns={2} hideLabel />
              </div>

              <div className="flex items-center justify-between py-1 border-b border-slate-100">
                <span className="form-field-label">Dyspnea with exertion:</span>
                <RadioGroup readOnly={readOnly} name="s-dwe" value={symptomDyspneaWithExertion} onChange={setSymptomDyspneaWithExertion} options={['Yes', 'No']} columns={2} hideLabel />
              </div>
              <div className="flex items-center justify-between py-1 border-b border-slate-100">
                <span className="form-field-label">Syncopy:</span>
                <RadioGroup readOnly={readOnly} name="s-sync" value={symptomSyncope} onChange={setSymptomSyncope} options={['Yes', 'No']} columns={2} hideLabel />
              </div>

              <div className="flex items-center justify-between py-1 border-b border-slate-100">
                <span className="form-field-label">Fatigue:</span>
                <RadioGroup readOnly={readOnly} name="s-fat" value={symptomFatigue} onChange={setSymptomFatigue} options={['Yes', 'No']} columns={2} hideLabel />
              </div>
              <div className="flex items-center justify-between py-1 border-b border-slate-100">
                <span className="form-field-label">PND:</span>
                <RadioGroup readOnly={readOnly} name="s-pnd" value={symptomPnd} onChange={setSymptomPnd} options={['Yes', 'No']} columns={2} hideLabel />
              </div>

              <div className="flex items-center justify-between py-1 border-b border-slate-100">
                <span className="form-field-label">Orthopnea:</span>
                <RadioGroup readOnly={readOnly} name="s-orth" value={symptomOrthopnea} onChange={setSymptomOrthopnea} options={['Yes', 'No']} columns={2} hideLabel />
              </div>
              <div className="flex items-center justify-between py-1 border-b border-slate-100">
                <span className="form-field-label">Muscle Cramps:</span>
                <RadioGroup readOnly={readOnly} name="s-mc" value={symptomMuscleCramps} onChange={setSymptomMuscleCramps} options={['Yes', 'No']} columns={2} hideLabel />
              </div>

              <div className="flex items-center justify-between py-1 border-b border-slate-100">
                <span className="form-field-label">Loss of appetite/Bloating:</span>
                <RadioGroup readOnly={readOnly} name="s-loa" value={symptomLossOfAppetite} onChange={setSymptomLossOfAppetite} options={['Yes', 'No']} columns={2} hideLabel />
              </div>
              <div className="flex items-center justify-between py-1 border-b border-slate-100">
                <span className="form-field-label">Wheeze:</span>
                <RadioGroup readOnly={readOnly} name="s-whz" value={symptomWheeze} onChange={setSymptomWheeze} options={['Yes', 'No']} columns={2} hideLabel />
              </div>

              <div className="flex items-center justify-between py-1 border-b border-slate-100">
                <span className="form-field-label">Decreased exercise tolerance:</span>
                <RadioGroup readOnly={readOnly} name="s-det" value={symptomDecreasedExercise} onChange={setSymptomDecreasedExercise} options={['Yes', 'No']} columns={2} hideLabel />
              </div>
              <div className="flex items-center justify-between py-1 border-b border-slate-100">
                <span className="form-field-label">Giddiness:</span>
                <RadioGroup readOnly={readOnly} name="s-gid" value={symptomGiddiness} onChange={setSymptomGiddiness} options={['Yes', 'No']} columns={2} hideLabel />
              </div>

              <div className="flex items-center justify-between py-1">
                <span className="form-field-label">Weight Gain:</span>
                <RadioGroup readOnly={readOnly} name="s-wg" value={symptomWeightGain} onChange={setSymptomWeightGain} options={['Yes', 'No']} columns={2} hideLabel />
              </div>
              <div className="flex flex-col justify-center py-1">
                <div className="flex items-center justify-between">
                  <span className="form-field-label">Other:</span>
                  <RadioGroup readOnly={readOnly} name="s-oth" value={symptomOther} onChange={setSymptomOther} options={['Yes', 'No']} columns={2} hideLabel />
                </div>
                <div className={`mt-1 ${symptomOther === 'Yes' ? '' : 'opacity-60'}`}>
                  <TextInput readOnly={readOnly} disabled={symptomOther !== 'Yes'} id="hf-sym-oth-det" value={symptomOtherDetails} onChange={setSymptomOtherDetails} placeholder="Specify other symptom details" />
                </div>
              </div>

            </div>
          </div>

          {/* Subsection: Clinical Signs of Volume Overload */}
          <div className={`bg-slate-50 p-4 border rounded-xl space-y-3 ${formErrors.clinicalSigns ? 'border-red-500 bg-red-50/20' : 'border-slate-200'}`} id="clinicalSignsBlock">
            <span className="form-subsection-heading">Clinical Signs of Volume Overload <span className="text-red-500 font-bold ml-0.5">*</span></span>
            {formErrors.clinicalSigns && (
              <span className="text-red-500 text-[10px] font-bold block mt-1">{formErrors.clinicalSigns}</span>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2 text-xs bg-white p-3 rounded-lg border border-slate-200">
              
              <div className="flex items-center justify-between py-1 border-b border-slate-100">
                <span className="form-field-label">Peripheral edema:</span>
                <RadioGroup readOnly={readOnly} name="sg-pe" value={signPeripheralEdema} onChange={setSignPeripheralEdema} options={['Yes', 'No']} columns={2} hideLabel />
              </div>
              <div className="flex items-center justify-between py-1 border-b border-slate-100">
                <span className="form-field-label">Ascites:</span>
                <RadioGroup readOnly={readOnly} name="sg-asc" value={signAscites} onChange={setSignAscites} options={['Yes', 'No']} columns={2} hideLabel />
              </div>

              <div className="flex items-center justify-between py-1 border-b border-slate-100">
                <span className="form-field-label">Rales:</span>
                <RadioGroup readOnly={readOnly} name="sg-ral" value={signRales} onChange={setSignRales} options={['Yes', 'No']} columns={2} hideLabel />
              </div>
              <div className="flex items-center justify-between py-1 border-b border-slate-100">
                <span className="form-field-label">Jugular venous pressure:</span>
                <RadioGroup readOnly={readOnly} name="sg-jvp" value={signJvp} onChange={setSignJvp} options={['Yes', 'No']} columns={2} hideLabel />
              </div>

              <div className="flex items-center justify-between py-1">
                <span className="form-field-label">Hepatomegaly:</span>
                <RadioGroup readOnly={readOnly} name="sg-hep" value={signHepatomegaly} onChange={setSignHepatomegaly} options={['Yes', 'No']} columns={2} hideLabel />
              </div>
              <div className="flex flex-col justify-center py-1">
                <div className="flex items-center justify-between">
                  <span className="form-field-label">Other:</span>
                  <RadioGroup readOnly={readOnly} name="sg-oth" value={signClinicalOther} onChange={setSignClinicalOther} options={['Yes', 'No']} columns={2} hideLabel />
                </div>
                <div className={`mt-1 ${signClinicalOther === 'Yes' ? '' : 'opacity-60'}`}>
                  <TextInput readOnly={readOnly} disabled={signClinicalOther !== 'Yes'} id="hf-sign-oth-det" value={signClinicalOtherDetails} onChange={setSignClinicalOtherDetails} placeholder="Specify other signs" />
                </div>
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
              id="hfType"
              label="Type of Heart Failure" 
              name="hf-type" 
              value={hfType} 
              onChange={setHfType} 
              required={true} 
              columns={2} 
              options={['HFrEF (HF with reduced EF)', 'HFpEF (HF with preserved EF)']} 
              error={formErrors.hfType}
            />
          </div>

          {/* HF Etiology Full Width Section */}
          <div className="border-b border-slate-200 bg-white">
            <div className="px-3 py-1.5 bg-slate-100 font-bold text-slate-700 text-xs border-b border-slate-200 uppercase tracking-wider">
              HF Etiology
            </div>
            <div className="p-3 space-y-3">
              <div>
                <CheckboxGroup readOnly={readOnly} id="hfEtiologyCv" label="Cardiovascular" options={HF_ETIOLOGY_CV} values={hfEtiologyCv} onChange={setHfEtiologyCv} columns={3} required={true} error={formErrors.hfEtiologyCv} />
              </div>
              <div className="space-y-3 pt-3">
                {/* Non-cardiac Row */}
                <div className={`grid grid-cols-1 lg:grid-cols-12 gap-3 items-center py-2.5 border-t border-slate-100 ${formErrors.hfEtiologyNonCv ? 'bg-red-50/30 border border-red-200 rounded p-2' : ''}`}>
                  <div className="lg:col-span-3 font-bold text-slate-700 uppercase tracking-wider text-[11px]">
                    Non-cardiac <span className="text-red-500 font-bold ml-0.5">*</span>
                  </div>
                  <div className="lg:col-span-9 flex flex-wrap gap-x-6 gap-y-2">
                    {HF_ETIOLOGY_NON_CV.map((opt) => (
                      <label key={opt} className="flex items-center gap-1.5 text-xs text-slate-800 font-medium cursor-pointer">
                        <input
                          disabled={readOnly}
                          type="checkbox"
                          checked={hfEtiologyNonCv.includes(opt)}
                          onChange={() => {
                            const updated = hfEtiologyNonCv.includes(opt)
                              ? hfEtiologyNonCv.filter(x => x !== opt)
                              : [...hfEtiologyNonCv, opt];
                            setHfEtiologyNonCv(updated);
                          }}
                          className="accent-teal-600 cursor-pointer"
                        />
                        <span>{opt}</span>
                      </label>
                    ))}
                  </div>
                  {formErrors.hfEtiologyNonCv && (
                    <div className="lg:col-span-12">
                      <span className="text-red-500 text-[10px] font-bold block mt-1">{formErrors.hfEtiologyNonCv}</span>
                    </div>
                  )}
                </div>
                
                <hr className="border-slate-100" />
                
                {/* Pulmonary Row */}
                <div className={`grid grid-cols-1 lg:grid-cols-12 gap-3 items-center py-2.5 ${formErrors.hfEtiologyPulm ? 'bg-red-50/30 border border-red-200 rounded p-2' : ''}`}>
                  <div className="lg:col-span-3 font-bold text-slate-700 uppercase tracking-wider text-[11px]">
                    Pulmonary <span className="text-red-500 font-bold ml-0.5">*</span>
                  </div>
                  <div className="lg:col-span-9 flex flex-wrap gap-x-6 gap-y-2">
                    {HF_ETIOLOGY_PULM.map((opt) => (
                      <label key={opt} className="flex items-center gap-1.5 text-xs text-slate-800 font-medium cursor-pointer">
                        <input
                          disabled={readOnly}
                          type="checkbox"
                          checked={hfEtiologyPulm.includes(opt)}
                          onChange={() => {
                            const updated = hfEtiologyPulm.includes(opt)
                              ? hfEtiologyPulm.filter(x => x !== opt)
                              : [...hfEtiologyPulm, opt];
                            setHfEtiologyPulm(updated);
                          }}
                          className="accent-teal-600 cursor-pointer"
                        />
                        <span>{opt}</span>
                      </label>
                    ))}
                  </div>
                  {formErrors.hfEtiologyPulm && (
                    <div className="lg:col-span-12">
                      <span className="text-red-500 text-[10px] font-bold block mt-1">{formErrors.hfEtiologyPulm}</span>
                    </div>
                  )}
                </div>
                </div>
                
                <hr className="border-slate-100" />
                
                {/* Others Row */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 items-center py-2.5">
                  <div className="lg:col-span-3 font-bold text-slate-700 uppercase tracking-wider text-[11px]">Others (please specify)</div>
                  <div className="lg:col-span-9">
                    <input
                      disabled={readOnly}
                      type="text"
                      value={etiologyOtherDetails}
                      onChange={(e) => {
                        const val = e.target.value;
                        setEtiologyOtherDetails(val);
                        setEtiologyOther(val ? 'Yes' : 'No');
                      }}
                      className="w-full border border-slate-300 rounded p-1.5 text-xs bg-white text-slate-800 font-medium focus:ring-1 focus:ring-teal-500 focus:border-teal-500 outline-none"
                      placeholder="Specify other etiology..."
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Comorbidities & Risk Factors Full Width Section */}
          <div className="border-b border-slate-200 bg-white">
            <div className="px-3 py-1.5 bg-slate-100 font-bold text-slate-700 text-xs border-b border-slate-200 uppercase tracking-wider">
              Comorbidities & Risk Factors
            </div>
            <div className="p-3 space-y-3">
              <div>
                <CheckboxGroup readOnly={readOnly} id="comorbidities" label="Comorbidities" options={COMORBIDITIES_OPTIONS} values={comorbidities} onChange={setComorbidities} columns={3} required={true} error={formErrors.comorbidities} />
                <div className="mt-2 pl-1 max-w-md">
                  <span className="text-[11px] font-medium text-slate-600">Others:</span>
                  <input disabled={readOnly} type="text" value={otherComorbidity} onChange={(e) => setOtherComorbidity(e.target.value)} className="w-full border border-slate-300 rounded p-1 text-xs mt-0.5" />
                </div>
              </div>
              <div className="pt-2 border-t border-slate-100">
                <CheckboxGroup readOnly={readOnly} label="Risk Factors" options={RISK_FACTOR_OPTIONS} values={riskFactors} onChange={setRiskFactors} columns={2} />
                <div className="mt-2 pl-1 max-w-md">
                  <span className="text-[11px] font-medium text-slate-600">Others:</span>
                  <input disabled={readOnly} type="text" value={otherRiskFactor} onChange={(e) => setOtherRiskFactor(e.target.value)} className="w-full border border-slate-300 rounded p-1 text-xs mt-0.5" />
                </div>
              </div>
            </div>
          </div>

          {/* Stage, Functional Status, and AF Rows */}
          <div className="p-3 border-b border-slate-200 grid grid-cols-1 gap-3">
            <RadioGroup readOnly={readOnly} id="hfStage" label="Stage of HF" name="hf-stage" value={hfStage} onChange={setHfStage} required={true} columns={4} options={['Stage A', 'Stage B', 'Stage C', 'Stage D']} error={formErrors.hfStage} />
            <hr className="border-slate-100" />
            <RadioGroup readOnly={readOnly} id="hfNyha" label="Functional Status" name="hf-nyha" value={hfNyha} onChange={setHfNyha} required={false} columns={4} options={['NYHA Class I', 'NYHA Class II', 'NYHA Class III', 'NYHA Class IV']} />
            <hr className="border-slate-100" />
            <RadioGroup readOnly={readOnly} label="AF Status" name="hf-af" value={hfAf} onChange={setHfAf} required={false} columns={4} options={['Permanent', 'Paroxysmal', 'Persistent', 'NSR']} />
          </div>

          {/* Major Adverse Cardiac Events (MACE) Full Width Layout */}
          <div className={`border rounded-lg overflow-hidden bg-white ${formErrors.mace ? 'border-red-500 bg-red-50/20' : 'border-slate-200'}`} id="maceBlock">
            <div className="px-3 py-1.5 bg-slate-100 font-bold text-slate-700 text-xs border-b border-slate-200 uppercase tracking-wider">
              Major Adverse Cardiac Events (MACE) <span className="text-red-500 font-bold ml-0.5">*</span>
            </div>
            {formErrors.mace && (
              <div className="p-2.5 bg-red-50 text-red-700 font-bold text-xs border-b border-red-200">
                {formErrors.mace}
              </div>
            )}
            <div className="p-3 grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Col 1 */}
              <div className="space-y-3">
                <div className="space-y-1">
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input disabled={readOnly} type="checkbox" checked={maceHospitalization === 'Yes'} onChange={(e) => {
                      const val = e.target.checked ? 'Yes' : 'No';
                      setMaceHospitalization(val);
                      if (val === 'No') setHospNote('');
                      if (val === 'Yes') setMaceNone('No');
                    }} className="accent-teal-600 cursor-pointer" />
                    <span className="text-xs font-semibold text-slate-700">Hospitalization</span>
                  </label>
                  <input disabled={readOnly || maceHospitalization !== 'Yes'} type="text" value={hospNote} onChange={(e) => setHospNote(e.target.value)} placeholder="Hospitalization note..." className="w-full border border-slate-300 rounded p-1 text-[11px] disabled:bg-slate-100 disabled:text-slate-400" />
                </div>

                <div className="space-y-1">
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input disabled={readOnly} type="checkbox" checked={maceStroke === 'Yes'} onChange={(e) => {
                      const val = e.target.checked ? 'Yes' : 'No';
                      setMaceStroke(val);
                      if (val === 'No') setStrokeNote('');
                      if (val === 'Yes') setMaceNone('No');
                    }} className="accent-teal-600 cursor-pointer" />
                    <span className="text-xs font-semibold text-slate-700">Stroke</span>
                  </label>
                  <input disabled={readOnly || maceStroke !== 'Yes'} type="text" value={strokeNote} onChange={(e) => setStrokeNote(e.target.value)} placeholder="Stroke note..." className="w-full border border-slate-300 rounded p-1 text-[11px] disabled:bg-slate-100 disabled:text-slate-400" />
                </div>

                <div className="space-y-1">
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input disabled={readOnly} type="checkbox" checked={maceMajorBleed === 'Yes'} onChange={(e) => {
                      const val = e.target.checked ? 'Yes' : 'No';
                      setMaceMajorBleed(val);
                      if (val === 'No') setBleedNote('');
                      if (val === 'Yes') setMaceNone('No');
                    }} className="accent-teal-600 cursor-pointer" />
                    <span className="text-xs font-semibold text-slate-700">Major Bleed</span>
                  </label>
                  <input disabled={readOnly || maceMajorBleed !== 'Yes'} type="text" value={bleedNote} onChange={(e) => setBleedNote(e.target.value)} placeholder="Bleed note..." className="w-full border border-slate-300 rounded p-1 text-[11px] disabled:bg-slate-100 disabled:text-slate-400" />
                </div>

                <div className="space-y-1">
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input disabled={readOnly} type="checkbox" checked={maceSevereArrhythmia === 'Yes'} onChange={(e) => {
                      const val = e.target.checked ? 'Yes' : 'No';
                      setMaceSevereArrhythmia(val);
                      if (val === 'No') setArrhythmiaNote('');
                      if (val === 'Yes') setMaceNone('No');
                    }} className="accent-teal-600 cursor-pointer" />
                    <span className="text-xs font-semibold text-slate-700">Severe Arrhythmia</span>
                  </label>
                  <input disabled={readOnly || maceSevereArrhythmia !== 'Yes'} type="text" value={arrhythmiaNote} onChange={(e) => setArrhythmiaNote(e.target.value)} placeholder="Arrhythmia note..." className="w-full border border-slate-300 rounded p-1 text-[11px] disabled:bg-slate-100 disabled:text-slate-400" />
                </div>
              </div>
              
              {/* Col 2 */}
              <div className="space-y-3">
                <div className="space-y-1">
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input disabled={readOnly} type="checkbox" checked={maceProcedures === 'Yes'} onChange={(e) => {
                      const val = e.target.checked ? 'Yes' : 'No';
                      setMaceProcedures(val);
                      if (val === 'No') setProcedureNote('');
                      if (val === 'Yes') setMaceNone('No');
                    }} className="accent-teal-600 cursor-pointer" />
                    <span className="text-xs font-semibold text-slate-700">Major Procedures</span>
                  </label>
                  <input disabled={readOnly || maceProcedures !== 'Yes'} type="text" value={procedureNote} onChange={(e) => setProcedureNote(e.target.value)} placeholder="Procedure note..." className="w-full border border-slate-300 rounded p-1 text-[11px] disabled:bg-slate-100 disabled:text-slate-400" />
                </div>

                <div className="space-y-1.5">
                  <label className="flex items-center gap-1.5 cursor-pointer font-bold text-teal-600">
                    <input disabled={readOnly} type="checkbox" checked={maceOther === 'Yes'} onChange={(e) => {
                      const val = e.target.checked ? 'Yes' : 'No';
                      setMaceOther(val);
                      if (val === 'No') { setOtherNote(''); setMaceOtherDetails(''); }
                      if (val === 'Yes') setMaceNone('No');
                    }} className="accent-teal-600 cursor-pointer" />
                    <span className="text-xs font-bold">Other</span>
                  </label>
                  <div>
                    <span className="text-[10px] text-slate-500 block font-medium">Details :</span>
                    <input disabled={readOnly || maceOther !== 'Yes'} type="text" value={maceOtherDetails} onChange={(e) => setMaceOtherDetails(e.target.value)} placeholder="Specify details..." className="w-full border border-slate-300 rounded p-1 text-[11px] disabled:bg-slate-100 disabled:text-slate-400" />
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block font-medium">Notes :</span>
                    <input disabled={readOnly || maceOther !== 'Yes'} type="text" value={otherNote} onChange={(e) => setOtherNote(e.target.value)} placeholder="Other note..." className="w-full border border-slate-300 rounded p-1 text-[11px] disabled:bg-slate-100 disabled:text-slate-400" />
                  </div>
                </div>

                <div className="space-y-1.5 pt-2 border-t border-slate-100">
                  <label className="flex items-center gap-1.5 cursor-pointer font-bold text-teal-700">
                    <input disabled={readOnly} type="checkbox" checked={maceNone === 'Yes'} onChange={(e) => {
                      const val = e.target.checked ? 'Yes' : 'No';
                      setMaceNone(val);
                      if (val === 'Yes') {
                        setMaceHospitalization('No');
                        setMaceStroke('No');
                        setMaceProcedures('No');
                        setMaceMajorBleed('No');
                        setMaceSevereArrhythmia('No');
                        setMaceOther('No');
                        setMaceDeath('No');
                        setHospNote('');
                        setStrokeNote('');
                        setProcedureNote('');
                        setBleedNote('');
                        setArrhythmiaNote('');
                        setOtherNote('');
                        setMaceOtherDetails('');
                        setMaceDeathDate('');
                        setMaceDeathLocation('');
                        setMaceDeathReason('');
                        setDeathNote('');
                      }
                    }} className="accent-teal-600 cursor-pointer" />
                    <span className="text-xs font-bold uppercase text-teal-700">No MACE Events</span>
                  </label>
                </div>
              </div>

              {/* Col 3: Death Context */}
              <div className="space-y-2 bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                <label className="flex items-center gap-1.5 cursor-pointer font-bold text-red-700">
                  <input disabled={readOnly} type="checkbox" checked={maceDeath === 'Yes'} onChange={(e) => {
                    const val = e.target.checked ? 'Yes' : 'No';
                    setMaceDeath(val);
                    if (val === 'No') { setDeathNote(''); setMaceDeathReason(''); setMaceDeathDate(''); setMaceDeathLocation(''); }
                    if (val === 'Yes') setMaceNone('No');
                  }} className="accent-red-600 cursor-pointer" />
                  <span>Death</span>
                </label>
                <div className={`space-y-1.5 mt-1 ${maceDeath === 'Yes' ? '' : 'opacity-60'}`}>
                    <div>
                      <span className="text-[10px] text-slate-500 block">Date:</span>
                      {renderInlineDate(maceDeathDate, setMaceDeathDate, "w-full border border-slate-300 rounded p-0.5 text-xs bg-white")}
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 block">Location:</span>
                      <div className="flex gap-2">
                        <label className="flex items-center gap-1 text-xs cursor-pointer"><input disabled={readOnly} type="radio" name="d-loc" checked={maceDeathLocation === 'Home'} onChange={() => setMaceDeathLocation('Home')} /> Home</label>
                        <label className="flex items-center gap-1 text-xs cursor-pointer"><input disabled={readOnly} type="radio" name="d-loc" checked={maceDeathLocation === 'Hospital'} onChange={() => setMaceDeathLocation('Hospital')} /> Hospital</label>
                      </div>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 block font-medium">Reason :</span>
                      <input disabled={readOnly || maceDeath !== 'Yes'} type="text" value={maceDeathReason} onChange={(e) => setMaceDeathReason(e.target.value)} className="w-full border border-slate-300 rounded p-0.5 text-xs disabled:bg-slate-100 disabled:text-slate-400" placeholder="Cause of death" />
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 block font-medium">Note :</span>
                      <input disabled={readOnly || maceDeath !== 'Yes'} type="text" value={deathNote} onChange={(e) => setDeathNote(e.target.value)} className="w-full border border-slate-300 rounded p-0.5 text-xs disabled:bg-slate-100 disabled:text-slate-400" placeholder="Death note / observations" />
                    </div>
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
          <div className="border-b border-slate-300 bg-white" id="ecgBlock">
            <div className="px-3 py-1.5 bg-slate-100 font-bold border-b border-slate-300 text-slate-700 text-xs uppercase tracking-wider">
              ECG (Electrocardiogram)
            </div>
            <div className="p-3 space-y-3">
              <div className="flex flex-wrap gap-4 border-b border-slate-100 pb-2">
                <div className="flex items-center gap-1">
                  <span className="font-semibold text-slate-600">Date of test: <span className="text-red-500 font-bold ml-0.5">*</span></span>
                  {renderInlineDate(ecgDate, setEcgDate, "border-b border-slate-300 p-0 focus:ring-0 text-xs bg-transparent", formErrors.ecgDate)}
                </div>
                {(() => {
                  const qrsCls = getClassification('qrs', ecgQrsDuration);
                  return (
                    <div className="flex flex-col gap-1" id="ecgQrsDurationBlock">
                      <div className="flex items-center gap-1.5">
                        <span className="font-semibold text-slate-600">QRS duration: <span className="text-red-500 font-bold ml-0.5">*</span></span>
                        <input disabled={readOnly} 
                          type="text" 
                          value={ecgQrsDuration} 
                          onChange={(e) => setEcgQrsDuration(e.target.value)} 
                          className={`border-b p-0 focus:ring-0 text-xs w-24 rounded px-1 ${
                            qrsCls.status === 'normal' ? 'bg-emerald-50 text-emerald-800 border-emerald-300' :
                            qrsCls.status === 'borderline' ? 'bg-amber-50 text-amber-800 border-amber-300 font-semibold' :
                            qrsCls.status === 'abnormal' ? 'bg-rose-50 text-rose-800 border-rose-300 font-semibold' :
                            qrsCls.status === 'out' || formErrors.ecgQrsDuration ? 'bg-red-50 text-red-800 border-red-500 font-bold' :
                            'border-slate-300'
                          }`} 
                        />
                        <span className="text-slate-500 text-xs ml-1 font-medium">ms</span>
                        {qrsCls.status && qrsCls.status !== 'out' && (
                          <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${
                            qrsCls.status === 'normal' ? 'bg-emerald-100 text-emerald-800' :
                            qrsCls.status === 'borderline' ? 'bg-amber-100 text-amber-800' :
                            'bg-rose-100 text-rose-800'
                          }`}>{qrsCls.message}</span>
                        )}
                      </div>
                      {(qrsCls.status === 'out' || formErrors.ecgQrsDuration) && (
                        <span className="text-red-500 text-[10px] font-bold mt-0.5 block">{qrsCls.status === 'out' ? qrsCls.message : formErrors.ecgQrsDuration}</span>
                      )}
                    </div>
                  );
                })()}
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className={`border rounded p-2 bg-slate-50/50 ${formErrors.ecgRhythm ? 'border-red-500' : 'border-slate-200'}`} id="ecgRhythm">
                  <span className="block font-bold mb-1 text-slate-700">Rhythm <span className="text-red-500 font-bold ml-0.5">*</span></span>
                  {['Sinus', 'AF'].map(r => (
                    <label key={r} className="flex items-center gap-1.5 mt-0.5"><input disabled={readOnly} type="radio" name="ecg_rhy" checked={ecgRhythm === r} onChange={() => setEcgRhythm(r)} /> {r}</label>
                  ))}
                  <label className="mt-1 flex items-center gap-1.5 cursor-pointer whitespace-nowrap">
                    <input disabled={readOnly} type="radio" name="ecg_rhy" checked={ecgRhythm === 'Other'} onChange={() => setEcgRhythm('Other')} className="rounded-full border-slate-300 text-teal-600 focus:ring-teal-500" />
                    <span className="text-slate-700">Other:</span>
                    <input disabled={readOnly || ecgRhythm !== 'Other'} type="text" value={ecgRhythmOther} onChange={(e) => { setEcgRhythm('Other'); setEcgRhythmOther(e.target.value); }} className={`border-b p-0 text-xs flex-1 bg-transparent focus:ring-0 ${formErrors.ecgRhythmOther ? 'border-red-500 text-red-700 bg-red-50' : 'border-slate-300'}`} />
                  </label>
                  {formErrors.ecgRhythm && (
                    <span className="text-red-500 text-[10px] font-bold block mt-1">{formErrors.ecgRhythm}</span>
                  )}
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

                <div className={`border rounded p-2 bg-slate-50/50 ${formErrors.ecgBlockages ? 'border-red-500' : 'border-slate-200'}`} id="ecgBlockages">
                  <span className="block font-bold mb-1 text-slate-700">Blockages <span className="text-red-500 font-bold ml-0.5">*</span></span>
                  {['LBBB', 'RBB'].map(bl => (
                    <label key={bl} className="flex items-center gap-1.5 mt-0.5"><input disabled={readOnly} type="radio" name="ecg_bl" checked={ecgBlockages === bl} onChange={() => setEcgBlockages(bl)} /> {bl}</label>
                  ))}
                  <label className="mt-1 flex items-center gap-1.5 cursor-pointer whitespace-nowrap">
                    <input disabled={readOnly} type="radio" name="ecg_bl" checked={ecgBlockages === 'Other'} onChange={() => setEcgBlockages('Other')} className="rounded-full border-slate-300 text-teal-600 focus:ring-teal-500" />
                    <span className="text-slate-700">Other:</span>
                    <input disabled={readOnly || ecgBlockages !== 'Other'} type="text" value={ecgBlockagesOther} onChange={(e) => { setEcgBlockages('Other'); setEcgBlockagesOther(e.target.value); }} className={`border-b p-0 text-xs flex-1 bg-transparent focus:ring-0 ${formErrors.ecgBlockagesOther ? 'border-red-500 text-red-700 bg-red-50' : 'border-slate-300'}`} />
                  </label>
                  {formErrors.ecgBlockages && (
                    <span className="text-red-500 text-[10px] font-bold block mt-1">{formErrors.ecgBlockages}</span>
                  )}
                </div>

                <div className="border border-slate-200 rounded p-2 bg-slate-50/50">
                  <span className="block font-bold mb-1 text-slate-700">Extra Beats</span>
                  {['APC', 'VPC', 'None'].map(eb => (
                    <label key={eb} className="flex items-center gap-1.5 mt-0.5"><input disabled={readOnly} type="radio" name="ecg_ex" checked={ecgExtraBeats === eb} onChange={() => setEcgExtraBeats(eb)} /> {eb}</label>
                  ))}
                </div>

                {(() => {
                  const qtCls = getClassification('qt', ecgQt);
                  const qtcCls = getClassification('qtc', ecgQtc);
                  return (
                    <div className="border border-slate-200 rounded p-2 bg-slate-50/50 space-y-2" id="ecgQtBlock">
                      <span className="block font-bold text-slate-700 text-xs">QT & QTc Intervals</span>
                      
                      <div className="flex flex-col gap-0.5">
                        <div className="flex items-center gap-1.5">
                          <span className="w-8 font-medium text-xs">QT:</span>
                          <input disabled={readOnly} 
                            type="text" 
                            value={ecgQt} 
                            onChange={(e) => setEcgQt(e.target.value)} 
                            className={`border-b p-0 w-full text-xs focus:ring-0 rounded px-1 ${
                              qtCls.status === 'normal' ? 'bg-emerald-50 text-emerald-800 border-emerald-300' :
                              qtCls.status === 'borderline' ? 'bg-amber-50 text-amber-800 border-amber-300 font-semibold' :
                              qtCls.status === 'abnormal' ? 'bg-rose-50 text-rose-800 border-rose-300 font-semibold' :
                              qtCls.status === 'out' || formErrors.ecgQt ? 'bg-red-50 text-red-800 border-red-500 font-bold' :
                              'border-slate-300'
                            }`} 
                          />
                          <span className="text-slate-500 text-xs ml-1 font-medium">ms</span>
                          {qtCls.status && qtCls.status !== 'out' && (
                            <span className={`text-[9px] px-1 py-0.2 rounded font-bold whitespace-nowrap ${
                              qtCls.status === 'normal' ? 'bg-emerald-100 text-emerald-800' :
                              qtCls.status === 'borderline' ? 'bg-amber-100 text-amber-800' :
                              'bg-rose-100 text-rose-800'
                            }`}>{qtCls.message}</span>
                          )}
                        </div>
                        {(qtCls.status === 'out' || formErrors.ecgQt) && (
                          <span className="text-red-500 text-[10px] font-bold block pl-8 mt-0.5">{qtCls.status === 'out' ? qtCls.message : formErrors.ecgQt}</span>
                        )}
                      </div>

                      <div className="flex flex-col gap-0.5">
                        <div className="flex items-center gap-1.5">
                          <span className="w-8 font-medium text-xs">QTC:</span>
                          <input disabled={readOnly} 
                            type="text" 
                            value={ecgQtc} 
                            onChange={(e) => setEcgQtc(e.target.value)} 
                            className={`border-b p-0 w-full text-xs focus:ring-0 rounded px-1 ${
                              qtcCls.status === 'normal' ? 'bg-emerald-50 text-emerald-800 border-emerald-300' :
                              qtcCls.status === 'borderline' ? 'bg-amber-50 text-amber-800 border-amber-300 font-semibold' :
                              qtcCls.status === 'abnormal' ? 'bg-rose-50 text-rose-800 border-rose-300 font-semibold' :
                              qtcCls.status === 'out' || formErrors.ecgQtc ? 'bg-red-50 text-red-800 border-red-500 font-bold' :
                              'border-slate-300'
                            }`} 
                          />
                          <span className="text-slate-500 text-xs ml-1 font-medium">ms</span>
                          {qtcCls.status && qtcCls.status !== 'out' && (
                            <span className={`text-[9px] px-1 py-0.2 rounded font-bold whitespace-nowrap ${
                              qtcCls.status === 'normal' ? 'bg-emerald-100 text-emerald-800' :
                              qtcCls.status === 'borderline' ? 'bg-amber-100 text-amber-800' :
                              'bg-rose-100 text-rose-800'
                            }`}>{qtcCls.message}</span>
                          )}
                        </div>
                        {(qtcCls.status === 'out' || formErrors.ecgQtc) && (
                          <span className="text-red-500 text-[10px] font-bold block pl-8 mt-0.5">{qtcCls.status === 'out' ? qtcCls.message : formErrors.ecgQtc}</span>
                        )}
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>
          </div>

          {/* Chest X-ray Block */}
          <div className="border-b border-slate-300 bg-white" id="cxrBlock">
            <div className="px-3 py-1.5 bg-slate-100 font-bold border-b border-slate-300 text-slate-700 text-xs uppercase tracking-wider">
              Chest X-ray
            </div>
            <div className="p-3 space-y-2">
              <div className="flex items-center gap-1 border-b border-slate-100 pb-1.5">
                <span className="font-semibold text-slate-600">Date of test: <span className="text-red-500 font-bold ml-0.5">*</span></span>
                {renderInlineDate(cxrDate, setCxrDate, "border-b border-slate-300 p-0 focus:ring-0 text-xs bg-transparent", formErrors.cxrDate)}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1.5">
                {(() => {
                  const ctRatioCls = getClassification('ctRatio', cxrCtRatio);
                  return (
                    <div className="flex flex-col gap-1 w-full" id="cxrCtRatioBlock">
                      <div className="flex items-center gap-1.5 w-full">
                        <span className="font-semibold text-slate-600 text-xs whitespace-nowrap">CT ratio <span className="text-red-500 font-bold ml-0.5">*</span>:</span>
                        <input disabled={readOnly} 
                          type="text" 
                          value={cxrCtRatio} 
                          onChange={(e) => setCxrCtRatio(e.target.value)} 
                          className={`border-b p-0 focus:ring-0 text-xs w-full rounded px-1 ${
                            ctRatioCls.status === 'normal' ? 'bg-emerald-50 text-emerald-800 border-emerald-300' :
                            ctRatioCls.status === 'borderline' ? 'bg-amber-50 text-amber-800 border-amber-300 font-semibold' :
                            ctRatioCls.status === 'abnormal' ? 'bg-rose-50 text-rose-800 border-rose-300 font-semibold' :
                            ctRatioCls.status === 'out' || formErrors.cxrCtRatio ? 'bg-red-50 text-red-800 border-red-500 font-bold' :
                            'border-slate-300'
                          }`} 
                        />
                        {ctRatioCls.status && ctRatioCls.status !== 'out' && (
                          <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold whitespace-nowrap ${
                            ctRatioCls.status === 'normal' ? 'bg-emerald-100 text-emerald-800' :
                            ctRatioCls.status === 'borderline' ? 'bg-amber-100 text-amber-800' :
                            'bg-rose-100 text-rose-800'
                          }`}>{ctRatioCls.message}</span>
                        )}
                      </div>
                      {(ctRatioCls.status === 'out' || formErrors.cxrCtRatio) && (
                        <span className="text-red-500 text-[10px] font-bold mt-0.5 block">{ctRatioCls.status === 'out' ? ctRatioCls.message : formErrors.cxrCtRatio}</span>
                      )}
                    </div>
                  );
                })()}
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
          <div className="border-b border-slate-300 bg-white" id="echoBlock">
            <div className="px-3 py-1.5 bg-slate-100 font-bold border-b border-slate-300 text-slate-700 text-xs uppercase tracking-wider">
              ECHO (Echocardiogram)
            </div>
            <div className="p-3 space-y-3">
              <div className="flex items-center gap-1 border-b border-slate-100 pb-1.5">
                <span className="font-semibold text-slate-600">Date of test: <span className="text-red-500 font-bold ml-0.5">*</span></span>
                {renderInlineDate(echoDate, setEchoDate, "border-b border-slate-300 p-0 focus:ring-0 text-xs bg-transparent", formErrors.echoDate)}
              </div>
              
              {/* Metric inputs section */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 border-b border-slate-100 pb-2">
                <div className="space-y-1.5">
                  {(() => {
                    const efCls = getClassification('ef', echoEfPercent);
                    return (
                      <div className="flex flex-col gap-0.5" id="echoEfPercentBlock">
                        <div className="flex items-center gap-1.5">
                          <span className="w-24 font-medium flex items-center gap-0.5">
                            EF% <span className="text-red-500 font-bold">*</span>:
                          </span>
                          <input
                            disabled={readOnly}
                            type="text"
                            value={echoEfPercent}
                            onChange={(e) => handleFieldChange('echoEfPercent', e.target.value, setEchoEfPercent, setEchoEfPercentError)}
                            placeholder="E.g. 45"
                            className={`border-b p-0 w-full focus:ring-0 text-xs disabled:bg-slate-100 disabled:text-slate-400 rounded px-1 ${
                              efCls.status === 'normal' ? 'bg-emerald-50 text-emerald-800 border-emerald-300' :
                              efCls.status === 'borderline' ? 'bg-amber-50 text-amber-800 border-amber-300 font-semibold' :
                              efCls.status === 'abnormal' ? 'bg-rose-50 text-rose-800 border-rose-300 font-semibold' :
                              efCls.status === 'out' || formErrors.echoEfPercent || echoEfPercentError ? 'bg-red-50 text-red-800 border-red-500 font-bold' :
                              'border-slate-300'
                            }`}
                          />
                          {efCls.status && efCls.status !== 'out' && (
                            <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold whitespace-nowrap ${
                              efCls.status === 'normal' ? 'bg-emerald-100 text-emerald-800' :
                              efCls.status === 'borderline' ? 'bg-amber-100 text-amber-800' :
                              'bg-rose-100 text-rose-800'
                            }`}>{efCls.message}</span>
                          )}
                        </div>
                        {(efCls.status === 'out' || formErrors.echoEfPercent || echoEfPercentError) && (
                          <span className="text-red-500 text-[10px] font-bold block pl-24 mt-0.5">{efCls.status === 'out' ? efCls.message : (formErrors.echoEfPercent || echoEfPercentError)}</span>
                        )}
                      </div>
                    );
                  })()}

                  {(() => {
                    const eaCls = getClassification('eaRatio', echoEaRatio);
                    return (
                      <div className="flex flex-col gap-0.5" id="echoEaRatioBlock">
                        <div className="flex items-center gap-1.5">
                          <span className="w-24 font-medium">E/A ratio <span className="text-red-500 font-bold">*</span>:</span>
                          <input
                            disabled={readOnly}
                            type="text"
                            value={echoEaRatio}
                            onChange={(e) => setEchoEaRatio(e.target.value)}
                            className={`border-b p-0 w-full focus:ring-0 text-xs disabled:bg-slate-100 disabled:text-slate-400 rounded px-1 ${
                              eaCls.status === 'normal' ? 'bg-emerald-50 text-emerald-800 border-emerald-300' :
                              eaCls.status === 'borderline' ? 'bg-amber-50 text-amber-800 border-amber-300 font-semibold' :
                              eaCls.status === 'abnormal' ? 'bg-rose-50 text-rose-800 border-rose-300 font-semibold' :
                              eaCls.status === 'out' || formErrors.echoEaRatio ? 'bg-red-50 text-red-800 border-red-500 font-bold' :
                              'border-slate-300'
                            }`}
                          />
                          {eaCls.status && eaCls.status !== 'out' && (
                            <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold whitespace-nowrap ${
                              eaCls.status === 'normal' ? 'bg-emerald-100 text-emerald-800' :
                              eaCls.status === 'borderline' ? 'bg-amber-100 text-amber-800' :
                              'bg-rose-100 text-rose-800'
                            }`}>{eaCls.message}</span>
                          )}
                        </div>
                        {(eaCls.status === 'out' || formErrors.echoEaRatio) && (
                          <span className="text-red-500 text-[10px] font-bold block pl-24 mt-0.5">{eaCls.status === 'out' ? eaCls.message : formErrors.echoEaRatio}</span>
                        )}
                      </div>
                    );
                  })()}

                  {(() => {
                    const tapseCls = getClassification('tapse', echoRvTapsv);
                    return (
                      <div className="flex flex-col gap-0.5" id="echoRvTapsvBlock">
                        <div className="flex items-center gap-1.5">
                          <span className="w-24 font-medium">RV TAPSV <span className="text-red-500 font-bold">*</span>:</span>
                          <input
                            disabled={readOnly}
                            type="text"
                            value={echoRvTapsv}
                            onChange={(e) => setEchoRvTapsv(e.target.value)}
                            className={`border-b p-0 w-full focus:ring-0 text-xs disabled:bg-slate-100 disabled:text-slate-400 rounded px-1 ${
                              tapseCls.status === 'normal' ? 'bg-emerald-50 text-emerald-800 border-emerald-300' :
                              tapseCls.status === 'borderline' ? 'bg-amber-50 text-amber-800 border-amber-300 font-semibold' :
                              tapseCls.status === 'abnormal' ? 'bg-rose-50 text-rose-800 border-rose-300 font-semibold' :
                              tapseCls.status === 'out' || formErrors.echoRvTapsv ? 'bg-red-50 text-red-800 border-red-500 font-bold' :
                              'border-slate-300'
                            }`}
                          />
                          {tapseCls.status && tapseCls.status !== 'out' && (
                            <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold whitespace-nowrap ${
                              tapseCls.status === 'normal' ? 'bg-emerald-100 text-emerald-800' :
                              tapseCls.status === 'borderline' ? 'bg-amber-100 text-amber-800' :
                              'bg-rose-100 text-rose-800'
                            }`}>{tapseCls.message}</span>
                          )}
                        </div>
                        {(tapseCls.status === 'out' || formErrors.echoRvTapsv) && (
                          <span className="text-red-500 text-[10px] font-bold block pl-24 mt-0.5">{tapseCls.status === 'out' ? tapseCls.message : formErrors.echoRvTapsv}</span>
                        )}
                      </div>
                    );
                  })()}
                </div>

                <div className="space-y-2">
                  {(() => {
                    const eePrimeCls = getClassification('eePrime', echoEePrimeRatio);
                    return (
                      <div className="flex flex-col gap-0.5" id="echoEePrimeRatioBlock">
                        <div className="flex items-center gap-1.5">
                          <span className="w-32 font-medium text-xs">E/E' ratio <span className="text-red-500 font-bold">*</span>:</span>
                          <input
                            disabled={readOnly}
                            type="text"
                            value={echoEePrimeRatio}
                            onChange={(e) => setEchoEePrimeRatio(e.target.value)}
                            className={`border-b p-0 w-full focus:ring-0 text-xs disabled:bg-slate-100 disabled:text-slate-400 rounded px-1 ${
                              eePrimeCls.status === 'normal' ? 'bg-emerald-50 text-emerald-800 border-emerald-300' :
                              eePrimeCls.status === 'borderline' ? 'bg-amber-50 text-amber-800 border-amber-300 font-semibold' :
                              eePrimeCls.status === 'abnormal' ? 'bg-rose-50 text-rose-800 border-rose-300 font-semibold' :
                              eePrimeCls.status === 'out' || formErrors.echoEePrimeRatio ? 'bg-red-50 text-red-800 border-red-500 font-bold' :
                              'border-slate-300'
                            }`}
                          />
                          <span className="text-slate-500 text-xs ml-1 font-medium">ratio</span>
                          {eePrimeCls.status && eePrimeCls.status !== 'out' && (
                            <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold whitespace-nowrap ${
                              eePrimeCls.status === 'normal' ? 'bg-emerald-100 text-emerald-800' :
                              eePrimeCls.status === 'borderline' ? 'bg-amber-100 text-amber-800' :
                              'bg-rose-100 text-rose-800'
                            }`}>{eePrimeCls.message}</span>
                          )}
                        </div>
                        {(eePrimeCls.status === 'out' || formErrors.echoEePrimeRatio) && (
                          <span className="text-red-500 text-[10px] font-bold block pl-32 mt-0.5">{eePrimeCls.status === 'out' ? eePrimeCls.message : formErrors.echoEePrimeRatio}</span>
                        )}
                      </div>
                    );
                  })()}

                  {(() => {
                    const eDecelCls = getClassification('eDecel', echoEDecelTime);
                    return (
                      <div className="flex flex-col gap-0.5" id="echoEDecelTimeBlock">
                        <div className="flex items-center gap-1.5">
                          <span className="w-32 font-medium text-xs">E deceleration time <span className="text-red-500 font-bold">*</span>:</span>
                          <input
                            disabled={readOnly}
                            type="text"
                            value={echoEDecelTime}
                            onChange={(e) => setEchoEDecelTime(e.target.value)}
                            className={`border-b p-0 w-full focus:ring-0 text-xs disabled:bg-slate-100 disabled:text-slate-400 rounded px-1 ${
                              eDecelCls.status === 'normal' ? 'bg-emerald-50 text-emerald-800 border-emerald-300' :
                              eDecelCls.status === 'borderline' ? 'bg-amber-50 text-amber-800 border-amber-300 font-semibold' :
                              eDecelCls.status === 'abnormal' ? 'bg-rose-50 text-rose-800 border-rose-300 font-semibold' :
                              eDecelCls.status === 'out' || formErrors.echoEDecelTime ? 'bg-red-50 text-red-800 border-red-500 font-bold' :
                              'border-slate-300'
                            }`}
                          />
                          <span className="text-slate-500 text-xs ml-1 font-medium">ms</span>
                          {eDecelCls.status && eDecelCls.status !== 'out' && (
                            <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold whitespace-nowrap ${
                              eDecelCls.status === 'normal' ? 'bg-emerald-100 text-emerald-800' :
                              eDecelCls.status === 'borderline' ? 'bg-amber-100 text-amber-800' :
                              'bg-rose-100 text-rose-800'
                            }`}>{eDecelCls.message}</span>
                          )}
                        </div>
                        {(eDecelCls.status === 'out' || formErrors.echoEDecelTime) && (
                          <span className="text-red-500 text-[10px] font-bold block pl-32 mt-0.5">{eDecelCls.status === 'out' ? eDecelCls.message : formErrors.echoEDecelTime}</span>
                        )}
                      </div>
                    );
                  })()}
                </div>
              </div>

              {/* Binary evaluation blocks */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="flex items-center gap-1.5"><input disabled={readOnly} type="checkbox" checked={echoLaDimension} onChange={(e) => setEchoLaDimension(e.target.checked)} /> Left Atrium Dimension</label>
                  <label className="flex items-center gap-1.5"><input disabled={readOnly} type="checkbox" checked={echoLvSystole} onChange={(e) => setEchoLvSystole(e.target.checked)} /> Left Ventricle Systole</label>
                  <label className="flex items-center gap-1.5"><input disabled={readOnly} type="checkbox" checked={echoLvDiastole} onChange={(e) => setEchoLvDiastole(e.target.checked)} /> Left Ventricle Diastole</label>
                  
                  <div className={`pt-1.5 border-t border-slate-100 mt-1 ${formErrors.echoMrMitralRegurg ? 'border-red-500 bg-red-50/20' : ''}`} id="echoMrMitralRegurgBlock">
                    <span className="block font-semibold text-slate-600 mb-0.5"><input disabled={readOnly} type="checkbox" checked={echoMrMitralRegurg !== ''} readOnly /> MR mitral regurgitation <span className="text-red-500 font-bold ml-0.5">*</span>:</span>
                    <div className="grid grid-cols-3 gap-1">
                      {['None', '1plus', '2plus', '3plus', '4plus'].map(lvl => (
                        <label key={lvl} className="flex items-center gap-1 text-[11px]"><input disabled={readOnly} type="radio" name="echo_mr" checked={echoMrMitralRegurg === lvl} onChange={() => setEchoMrMitralRegurg(lvl)} /> {lvl}</label>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="space-y-2 bg-slate-50/50 p-2 rounded border border-slate-200">
                  <div className="flex items-center gap-1" id="echoOtherValvesBlock"><span className="font-semibold text-slate-600">Other Valves <span className="text-red-500 font-bold ml-0.5">*</span>:</span><input disabled={readOnly} type="text" value={echoOtherValves} onChange={(e) => setEchoOtherValves(e.target.value)} className={`border-b p-0 bg-transparent text-xs w-full focus:ring-0 ${formErrors.echoOtherValves ? 'border-red-500 bg-red-50 text-red-700 font-bold' : 'border-slate-300'}`} /></div>
                  {(() => {
                    const rvspCls = getClassification('rvsp', echoRvSystolicPressure);
                    return (
                      <div className="flex flex-col gap-0.5 w-full" id="echoRvSystolicPressureBlock">
                        <div className="flex items-center gap-1.5 w-full">
                          <span className="font-semibold text-slate-600 text-xs whitespace-nowrap">RV Systolic Pressure <span className="text-red-500 font-bold ml-0.5">*</span>:</span>
                          <input
                            disabled={readOnly}
                            type="text"
                            value={echoRvSystolicPressure}
                            onChange={(e) => setEchoRvSystolicPressure(e.target.value)}
                            className={`border-b p-0 w-full focus:ring-0 text-xs disabled:bg-slate-100 disabled:text-slate-400 rounded px-1 ${
                              rvspCls.status === 'normal' ? 'bg-emerald-50 text-emerald-800 border-emerald-300' :
                              rvspCls.status === 'borderline' ? 'bg-amber-50 text-amber-800 border-amber-300 font-semibold' :
                              rvspCls.status === 'abnormal' ? 'bg-rose-50 text-rose-800 border-rose-300 font-semibold' :
                              rvspCls.status === 'out' || formErrors.echoRvSystolicPressure ? 'bg-red-50 text-red-800 border-red-500 font-bold' :
                              'border-slate-300'
                            }`}
                          />
                          <span className="text-slate-500 text-xs ml-1 font-medium">mmHg</span>
                          {rvspCls.status && rvspCls.status !== 'out' && (
                            <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold whitespace-nowrap ${
                              rvspCls.status === 'normal' ? 'bg-emerald-100 text-emerald-800' :
                              rvspCls.status === 'borderline' ? 'bg-amber-100 text-amber-800' :
                              'bg-rose-100 text-rose-800'
                            }`}>{rvspCls.message}</span>
                          )}
                        </div>
                        {(rvspCls.status === 'out' || formErrors.echoRvSystolicPressure) && (
                          <span className="text-red-500 text-[10px] font-bold block mt-0.5">{rvspCls.status === 'out' ? rvspCls.message : formErrors.echoRvSystolicPressure}</span>
                        )}
                      </div>
                    );
                  })()}
                  
                  <div className={`flex items-center gap-4 py-0.5 ${formErrors.echoRvFunction ? 'border border-red-500 bg-red-50/20 p-1 rounded' : ''}`} id="echoRvFunctionBlock">
                    <span className="font-semibold text-slate-600">RV Function <span className="text-red-500 font-bold ml-0.5">*</span>:</span>
                    <label className="flex items-center gap-1"><input disabled={readOnly} type="radio" name="echo_rvf" checked={echoRvFunction === 'Normal'} onChange={() => setEchoRvFunction('Normal')} /> Normal</label>
                    <label className="flex items-center gap-1"><input disabled={readOnly} type="radio" name="echo_rvf" checked={echoRvFunction === 'Impaired'} onChange={() => setEchoRvFunction('Impaired')} /> Impaired</label>
                  </div>

                  <div className={`border-t border-slate-200 pt-1 ${formErrors.echoRwmi ? 'border border-red-500 bg-red-50/20 p-1 rounded' : ''}`} id="echoRwmiBlock">
                    <span className="block font-semibold text-slate-600 mb-0.5">RWMI <span className="text-red-500 font-bold ml-0.5">*</span>:</span>
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
          <div className="border-b border-slate-300 bg-white" id="holterBlock">
            <div className="px-3 py-1.5 bg-slate-100 font-bold border-b border-slate-300 text-slate-700 text-xs uppercase tracking-wider">
              Holter / Event Recorder
            </div>
            <div className="p-3 space-y-2">
              <div className="flex items-center gap-1 border-b border-slate-100 pb-1.5">
                <span className="font-semibold text-slate-600">Date of test: <span className="text-red-500 font-bold ml-0.5">*</span></span>
                {renderInlineDate(holterDate, setHolterDate, "border-b border-slate-300 p-0 focus:ring-0 text-xs bg-transparent", formErrors.holterDate)}
              </div>
              <div className="space-y-1.5">
                <div id="holterVpcCheckedBlock" className={formErrors.holterVpcChecked ? 'border border-red-500 bg-red-50/20 p-1 rounded' : ''}>
                  <label className="flex items-center gap-1.5 font-semibold text-slate-700">
                    <input disabled={readOnly} type="checkbox" checked={holterVpcChecked} onChange={(e) => setHolterVpcChecked(e.target.checked)} />
                    VPC <span className="text-red-500 font-bold ml-0.5">*</span>:
                  </label>
                  {formErrors.holterVpcChecked && (
                    <span className="text-red-500 text-[10px] font-bold block mt-0.5">{formErrors.holterVpcChecked}</span>
                  )}
                  <div className={`pl-5 flex flex-wrap gap-4 items-center mt-1 bg-slate-50 p-1.5 rounded border ${formErrors.holterVentricularArrhythmia ? 'border-red-500 bg-red-50/20' : 'border-slate-200'}`} id="holterVentricularArrhythmiaBlock">
                    <span className="font-medium text-slate-600">Ventricular Arrhythmia <span className="text-red-500 font-bold ml-0.5">*</span>:</span>
                    {['No', 'Yes', 'Complex VPC', 'NSVT', 'VT'].map(opt => (
                      <label key={opt} className="flex items-center gap-1 text-[11px]"><input disabled={readOnly} type="radio" name="holter_va" checked={holterVentricularArrhythmia === opt} onChange={() => setHolterVentricularArrhythmia(opt)} /> {opt}</label>
                    ))}
                  </div>
                </div>
                
                <div className={`flex flex-wrap gap-4 items-center pt-1 p-1 rounded ${formErrors.holterAtrialArrhythmias ? 'border border-red-500 bg-red-50/20' : ''}`} id="holterAtrialArrhythmiasBlock">
                  <span className="font-semibold text-slate-700">Atrial Arrhythmias <span className="text-red-500 font-bold ml-0.5">*</span>:</span>
                  {['None', 'APCs', 'AF'].map(opt => (
                    <label key={opt} className="flex items-center gap-1"><input disabled={readOnly} type="radio" name="holter_aa" checked={holterAtrialArrhythmias === opt} onChange={() => setHolterAtrialArrhythmias(opt)} /> {opt}</label>
                  ))}
                </div>

                <div className="flex items-center gap-1 pt-1" id="holterHrvBlock">
                  <span className="font-semibold text-slate-700">Heart rate variability <span className="text-red-500 font-bold ml-0.5">*</span>:</span>
                  <input disabled={readOnly} type="text" value={holterHrv} onChange={(e) => setHolterHrv(e.target.value)} className={`border-b p-0 focus:ring-0 text-xs w-full ${formErrors.holterHrv ? 'border-red-500 bg-red-50 text-red-700 font-bold' : 'border-slate-300'}`} />
                </div>
              </div>
            </div>
          </div>

          {/* Stress Test Block */}
          <div className="border-b border-slate-300 bg-white">
            <div className="px-3 py-1.5 bg-slate-100 font-bold border-b border-slate-300 text-slate-700 text-xs uppercase tracking-wider">
              Stress Test
            </div>
            <div className="p-3 space-y-2">
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
          <div className="border-b border-slate-300 bg-white">
            <div className="px-3 py-1.5 bg-slate-100 font-bold border-b border-slate-300 text-slate-700 text-xs uppercase tracking-wider">
              MRI
            </div>
            <div className="p-3 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-1">
                <input
                  disabled={readOnly}
                  type="checkbox"
                  checked={chkMriLvef}
                  onChange={(e) => {
                    const checked = e.target.checked;
                    setChkMriLvef(checked);
                    if (!checked) setMriLvef('');
                  }}
                  className="accent-teal-600 cursor-pointer"
                />
                <span className="font-semibold">LVEF:</span>
                <input
                  disabled={readOnly}
                  type="text"
                  value={mriLvef}
                  onChange={(e) => setMriLvef(e.target.value)}
                  className="border-b border-slate-300 p-0 text-xs w-28 focus:ring-0 disabled:bg-slate-100 disabled:text-slate-400"
                />
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
          <div className="border-b border-slate-300 bg-white">
            <div className="px-3 py-1.5 bg-slate-100 font-bold border-b border-slate-300 text-slate-700 text-xs uppercase tracking-wider">
              PET
            </div>
            <div className="p-3 flex items-center justify-end gap-1">
              <span className="text-slate-500 font-medium">Date of test:</span>
              {renderInlineDate(petDate, setPetDate, "border-b border-slate-300 p-0 text-xs focus:ring-0")}
            </div>
          </div>

          {/* 6-Minute Walk Test Block */}
          <div className="border-b border-slate-300 bg-white" id="sixMwtBlock">
            <div className="px-3 py-1.5 bg-slate-100 font-bold border-b border-slate-300 text-slate-700 text-xs uppercase tracking-wider">
              6-Minute Walk Test
            </div>
            <div className="p-3 space-y-2">
              <div className="flex items-center gap-1 border-b border-slate-100 pb-1.5">
                <span className="font-semibold text-slate-600">Date of test: <span className="text-red-500 font-bold ml-0.5">*</span></span>
                {renderInlineDate(sixMwtDate, setSixMwtDate, "border-b border-slate-300 p-0 focus:ring-0 text-xs bg-transparent", formErrors.sixMwtDate)}
              </div>
              <div className={`space-y-2 p-2 rounded ${formErrors.sixMwtStatus ? 'border border-red-500 bg-red-50/30' : ''}`}>
                <div>
                  <label className="flex items-center gap-1.5 font-bold text-slate-700"><input disabled={readOnly} type="radio" name="six_mwt" checked={sixMwtStatus === 'Done'} onChange={() => setSixMwtStatus('Done')} /> Done:</label>
                  {sixMwtStatus === 'Done' && (
                    <div className="mt-1 grid grid-cols-1 sm:grid-cols-2 gap-4 pl-5 bg-slate-50 p-2 rounded border border-slate-200">
                      <div className="flex items-center gap-1">
                        <span>▪ Distance walked in m: <span className="text-red-500 font-bold">*</span></span>
                        <input disabled={readOnly} type="text" value={sixMwtDistance} onChange={(e) => setSixMwtDistance(e.target.value)} className={`border-b p-0 text-xs w-full focus:ring-0 bg-transparent ${formErrors.sixMwtDistance ? 'border-red-500 text-red-700' : 'border-slate-300'}`} />
                      </div>
                      <div className="flex items-center gap-1">
                        <span>▪ Heart rate recovery in first 1 minute: <span className="text-red-500 font-bold">*</span></span>
                        <input disabled={readOnly} type="text" value={sixMwtHrRecovery} onChange={(e) => setSixMwtHrRecovery(e.target.value)} className={`border-b p-0 text-xs w-full focus:ring-0 bg-transparent ${formErrors.sixMwtHrRecovery ? 'border-red-500 text-red-700' : 'border-slate-300'}`} />
                      </div>
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <label className="flex items-center gap-1.5 font-bold text-slate-700 whitespace-nowrap"><input disabled={readOnly} type="radio" name="six_mwt" checked={sixMwtStatus === 'Not Done'} onChange={() => setSixMwtStatus('Not Done')} /> Not Done, Reasons:</label>
                  {sixMwtStatus === 'Not Done' && (
                    <input disabled={readOnly} type="text" value={sixMwtNotDoneReason} onChange={(e) => setSixMwtNotDoneReason(e.target.value)} className={`border-b p-0 text-xs w-full focus:ring-0 bg-transparent ${formErrors.sixMwtNotDoneReason ? 'border-red-500 text-red-700' : 'border-slate-300'}`} placeholder="Specify clinical barriers..." />
                  )}
                </div>
                {formErrors.sixMwtStatus && (
                  <span className="text-red-500 text-[10px] font-bold block mt-1">{formErrors.sixMwtStatus}</span>
                )}
              </div>
            </div>
          </div>

          {/* Anaerobic Threshold Block */}
          <div className="border-b border-slate-300 bg-white" id="anaerobicBlock">
            <div className="px-3 py-1.5 bg-slate-100 font-bold border-b border-slate-300 text-slate-700 text-xs uppercase tracking-wider">
              Anaerobic Threshold
            </div>
            <div className="p-3 flex items-center justify-end gap-1">
              <span className="text-slate-500 font-medium">Date of test: <span className="text-red-500 font-bold ml-0.5">*</span></span>
              {renderInlineDate(anaerobicDate, setAnaerobicDate, "border-b border-slate-300 p-0 text-xs focus:ring-0 bg-transparent", formErrors.anaerobicDate)}
            </div>
          </div>

          {/* Angiogram Block */}
          <div className="border-b border-slate-300 bg-white" id="angioBlock">
            <div className="px-3 py-1.5 bg-slate-100 font-bold border-b border-slate-300 text-slate-700 text-xs uppercase tracking-wider">
              Angiogram
            </div>
            <div className="p-3 space-y-2">
              <div className="flex items-center gap-1 border-b border-slate-100 pb-1.5">
                <span className="font-semibold text-slate-600">Date of test: <span className="text-red-500 font-bold ml-0.5">*</span></span>
                {renderInlineDate(angioDate, setAngioDate, "border-b border-slate-300 p-0 focus:ring-0 text-xs bg-transparent", formErrors.angioDate)}
              </div>
              <div className={`space-y-1.5 p-2 rounded ${formErrors.angioStatus ? 'border border-red-500 bg-red-50/30' : ''}`}>
                <div>
                  <label className="flex items-center gap-1.5 font-bold text-slate-700"><input disabled={readOnly} type="radio" name="angio_st" checked={angioStatus === 'Done'} onChange={() => setAngioStatus('Done')} /> Done:</label>
                  {angioStatus === 'Done' && (
                    <div className={`mt-1 flex flex-wrap gap-4 pl-5 bg-slate-50 p-2 rounded border ${formErrors.angioFinding ? 'border-red-500' : 'border-slate-200'}`}>
                      {['Normal', '1 vessel disease', '2 vessel disease', '3 vessel disease', 'LMCA'].map(f => (
                        <label key={f} className="flex items-center gap-1"><input disabled={readOnly} type="radio" name="angio_find" checked={angioFinding === f} onChange={() => setOriginalAngioFinding(f)} /> {f}</label>
                      ))}
                      {formErrors.angioFinding && (
                        <span className="text-red-500 text-[10px] font-bold block w-full mt-1">{formErrors.angioFinding}</span>
                      )}
                    </div>
                  )}
                </div>
                <label className="flex items-center gap-1.5 font-bold text-slate-700"><input disabled={readOnly} type="radio" name="angio_st" checked={angioStatus === 'Not Done'} onChange={() => setAngioStatus('Not Done')} /> Not Done</label>
                {formErrors.angioStatus && (
                  <span className="text-red-500 text-[10px] font-bold block mt-1">{formErrors.angioStatus}</span>
                )}
              </div>
            </div>
          </div>

          {/* Endomyocardial biopsy Block */}
          <div className="bg-white">
            <div className="px-3 py-1.5 bg-slate-100 font-bold border-b border-slate-300 text-slate-700 text-xs uppercase tracking-wider">
              Endomyocardial Biopsy
            </div>
            <div className="p-3 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-1.5"><input disabled={readOnly} type="radio" name="biopsy_st" checked={biopsyStatus === 'Done'} onChange={() => setBiopsyStatus('Done')} /> Done</label>
                <label className="flex items-center gap-1.5"><input disabled={readOnly} type="radio" name="biopsy_st" checked={biopsyStatus === 'Not Done'} onChange={() => setBiopsyStatus('Not Done')} /> Not Done</label>
              </div>
              {biopsyStatus === 'Done' && (
                <div className="flex items-center gap-1">
                  <span className="font-semibold text-slate-700">Date of test:</span>
                  {renderInlineDate(biopsyDate, setBiopsyDate)}
                </div>
              )}
            </div>
          </div>

          {/* Vaccinations Row */}
          <div className={`border-b border-slate-300 bg-white ${formErrors.vacPneumococcalDate || formErrors.vacInfluenzaDate ? 'border-red-500 bg-red-50/20' : ''}`} id="vaccinationsBlock">
            <div className="px-3 py-1.5 bg-slate-100 font-bold border-b border-slate-300 text-slate-700 text-xs uppercase tracking-wider">
              Vaccinations
            </div>
            <div className="p-3 flex flex-wrap gap-6 items-center">
              <div className="flex items-center gap-2" id="vacPneumococcalBlock">
                <span className="font-medium text-slate-700">Pneumococcal (Date of test :</span>
                {renderInlineDate(vacPneumococcalDate, (val) => {
                  setVacPneumococcalDate(val);
                  setVacPneumococcal(val !== '');
                }, "border-b border-slate-400 p-0 text-xs w-28 focus:ring-0 outline-none", formErrors.vacPneumococcalDate)}
              </div>
              <div className="flex items-center gap-2" id="vacInfluenzaBlock">
                <span className="font-medium text-slate-700">Influenza (Date of test :</span>
                {renderInlineDate(vacInfluenzaDate, (val) => {
                  setVacInfluenzaDate(val);
                  setVacInfluenza(val !== '');
                }, "border-b border-slate-400 p-0 text-xs w-28 focus:ring-0 outline-none", formErrors.vacInfluenzaDate)}
              </div>
            </div>
          </div>

          {/* Lab Tests Composite Header */}
          <div className="px-3 py-1.5 bg-slate-100 font-bold border-b border-slate-300 text-slate-700 text-xs uppercase tracking-wider flex items-center justify-between flex-wrap gap-2">
            <div>Lab Tests <span className="text-red-500 font-bold ml-0.5">*</span></div>
            <div className="text-[10px] text-slate-500 font-normal italic">(*Potassium and Creatinine tests are required for all follow-up visits)</div>
          </div>

          <div className="p-3 grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-2.5 border-b border-slate-300" id="labTestsBlock">
            
            {/* Left Column Labs */}
            <div className="space-y-1">
              <div className="grid grid-cols-3 text-[10px] uppercase tracking-wider font-bold text-slate-400 pb-1">
                <span>Please specify:</span>
                <span className="text-center italic">Results</span>
                <span className="text-right italic">Date</span>
              </div>
              {[
                { key: 'potassium', label: 'Potassium', unit: 'mmol/L', clsKey: 'potassium' },
                { key: 'creatinine', label: 'Creatinine', unit: 'mg/dL', clsKey: 'creatinine' },
                { key: 'hb', label: 'Hb', unit: 'g/dL', clsKey: 'hb' },
                { key: 'calcium', label: 'Calcium', unit: 'mg/dL', clsKey: 'calcium' },
                { key: 'bun', label: 'BUN', unit: 'mg/dL', clsKey: 'bun' },
                { key: 'glucose', label: 'Glucose', unit: 'mg/dL', clsKey: 'glucose' },
                { key: 'hba1c', label: 'HBa1c', unit: '%', clsKey: 'hba1c' },
                { key: 'magnesium', label: 'Magnesium', unit: 'mg/dL', clsKey: 'magnesium' },
                { key: 'sodium', label: 'Sodium', unit: 'mEq/L', clsKey: 'sodium' },
                { key: 'tsh', label: 'TSH', unit: 'µIU/mL', clsKey: 'tsh' },
                { key: 't3', label: 'T3', unit: 'ng/dL', clsKey: 't3' },
                { key: 't4', label: 'T4', unit: 'µg/dL', clsKey: 't4' }
              ].map((item) => {
                const valStr = labTests[item.key].result;
                const cls = item.clsKey ? getClassification(item.clsKey, valStr) : { status: '', classNames: '', message: '' };
                const outErr = (cls.status === 'out') ? cls.message : null;
                const displayErr = outErr || formErrors[item.key] || labErrors[item.key];
                
                return (
                  <div key={item.key} className="grid grid-cols-3 items-center gap-2 py-0.5" id={`lab-${item.key}`}>
                    <label className="flex items-center gap-1.5 truncate">
                      <span className="truncate">{item.label}{item.isRequired && <span className="text-red-500 font-bold ml-0.5">*</span>}</span>
                    </label>
                    <div className="flex flex-col items-center w-full">
                      <div className="flex items-center gap-1 w-full">
                        <input disabled={readOnly}
                          type="text"
                          value={valStr}
                          onChange={(e) => {
                            const val = e.target.value;
                            const res = validateField(item.key, val);
                            setLabErrors(prev => ({
                              ...prev,
                              [item.key]: res.isValid ? null : res.error
                            }));
                            handleLabChange(item.key, 'result', val);
                          }}
                          className={`border-b px-1 py-0 text-center text-xs focus:ring-0 outline-none w-full rounded ${
                            cls.status === 'normal' ? 'bg-emerald-50 text-emerald-800 border-emerald-300' :
                            cls.status === 'borderline' ? 'bg-amber-50 text-amber-800 border-amber-300 font-semibold' :
                            cls.status === 'abnormal' ? 'bg-rose-50 text-rose-800 border-rose-300 font-semibold' :
                            cls.status === 'out' || formErrors[item.key] || labErrors[item.key] ? 'bg-red-50 text-red-800 border-red-500 font-bold' :
                            'border-slate-300'
                          }`}
                        />
                        {item.unit && <span className="text-[9px] text-slate-500 font-medium whitespace-nowrap">{item.unit}</span>}
                      </div>
                      {item.clsKey && cls.status && cls.status !== 'out' && (
                        <span className={`text-[8px] px-1 py-0.2 rounded font-bold mt-0.5 whitespace-nowrap leading-none ${
                          cls.status === 'normal' ? 'bg-emerald-100 text-emerald-800' :
                          cls.status === 'borderline' ? 'bg-amber-100 text-amber-800' :
                          'bg-rose-100 text-rose-800'
                        }`}>{cls.message}</span>
                      )}
                      {displayErr && (
                        <span className="text-red-500 text-[8px] block font-bold mt-0.5 text-center leading-tight">{displayErr}</span>
                      )}
                    </div>
                    {readOnly ? (
                      <span className="text-slate-900 font-bold text-xs text-right w-full block">{formatDateToView(labTests[item.key].date) || '—'}</span>
                    ) : (
                      <input type="date" value={labTests[item.key].date ? labTests[item.key].date.split('T')[0] : ''} onChange={(e) => handleLabChange(item.key, 'date', e.target.value)} className="border-b border-slate-300 px-1 py-0 text-right text-[11px] focus:ring-0 outline-none w-full" />
                    )}
                  </div>
                );
              })}
            </div>

            {/* Right Column Labs */}
            <div className="space-y-1">
              <div className="grid grid-cols-3 text-[10px] uppercase tracking-wider font-bold text-slate-400 pb-1">
                <span>When required:</span>
                <span className="text-center italic">Results</span>
                <span className="text-right italic">Date</span>
              </div>
              {[
                { key: 'bnp', label: 'BNP', unit: 'pg/mL', clsKey: 'bnp' },
                { key: 'ntProBnp', label: 'NT-pro BNP', unit: 'pg/mL', clsKey: 'ntProBnp' },
                { key: 'ldl', label: 'LDL', unit: 'mg/dL', clsKey: 'ldl' },
                { key: 'inr', label: 'INR', unit: 'ratio', clsKey: 'inr' },
                { key: 'st2', label: 'ST2', unit: 'ng/mL', clsKey: 'st2' }
              ].map((item) => {
                const valStr = labTests[item.key].result;
                const cls = item.clsKey ? getClassification(item.clsKey, valStr) : { status: '', classNames: '', message: '' };
                const outErr = (cls.status === 'out') ? cls.message : null;
                const displayErr = outErr || formErrors[item.key] || labErrors[item.key];
                
                return (
                  <div key={item.key} className="grid grid-cols-3 items-center gap-2 py-0.5" id={`lab-${item.key}`}>
                    <label className="flex items-center gap-1.5 truncate">
                      <span className="truncate">{item.label}{item.isRequired && <span className="text-red-500 font-bold ml-0.5">*</span>}</span>
                    </label>
                    <div className="flex flex-col items-center w-full">
                      <div className="flex items-center gap-1 w-full">
                        <input disabled={readOnly}
                          type="text"
                          value={valStr}
                          onChange={(e) => {
                            const val = e.target.value;
                            const res = validateField(item.key, val);
                            setLabErrors(prev => ({
                              ...prev,
                              [item.key]: res.isValid ? null : res.error
                            }));
                            handleLabChange(item.key, 'result', val);
                          }}
                          className={`border-b px-1 py-0 text-center text-xs focus:ring-0 outline-none w-full rounded ${
                            cls.status === 'normal' ? 'bg-emerald-50 text-emerald-800 border-emerald-300' :
                            cls.status === 'borderline' ? 'bg-amber-50 text-amber-800 border-amber-300 font-semibold' :
                            cls.status === 'abnormal' ? 'bg-rose-50 text-rose-800 border-rose-300 font-semibold' :
                            cls.status === 'out' || formErrors[item.key] || labErrors[item.key] ? 'bg-red-50 text-red-800 border-red-500 font-bold' :
                            'border-slate-300'
                          }`}
                        />
                        {item.unit && <span className="text-[9px] text-slate-500 font-medium whitespace-nowrap">{item.unit}</span>}
                      </div>
                      {item.clsKey && cls.status && cls.status !== 'out' && (
                        <span className={`text-[8px] px-1 py-0.2 rounded font-bold mt-0.5 whitespace-nowrap leading-none ${
                          cls.status === 'normal' ? 'bg-emerald-100 text-emerald-800' :
                          cls.status === 'borderline' ? 'bg-amber-100 text-amber-800' :
                          'bg-rose-100 text-rose-800'
                        }`}>{cls.message}</span>
                      )}
                      {displayErr && (
                        <span className="text-red-500 text-[8px] block font-bold mt-0.5 text-center leading-tight">{displayErr}</span>
                      )}
                    </div>
                    {readOnly ? (
                      <span className="text-slate-900 font-bold text-xs text-right w-full block">{formatDateToView(labTests[item.key].date) || '—'}</span>
                    ) : (
                      <input type="date" value={labTests[item.key].date ? labTests[item.key].date.split('T')[0] : ''} onChange={(e) => handleLabChange(item.key, 'date', e.target.value)} className="border-b border-slate-300 px-1 py-0 text-right text-[11px] focus:ring-0 outline-none w-full" />
                    )}
                  </div>
                );
              })}
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
          <div className={`grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-slate-200 ${formErrors.betaBlocker ? 'border border-red-500 bg-red-50/20' : ''}`} id="drugBetaBlocker">
            <div className="lg:col-span-3 bg-slate-50/70 p-3 flex flex-col justify-center">
              <span className="font-bold text-slate-800 text-[11px] uppercase">Beta-Blocker <span className="text-red-500 font-bold ml-0.5">*</span></span>
              {formErrors.betaBlocker && (
                <span className="text-red-500 text-[10px] font-bold block mt-1">{formErrors.betaBlocker}</span>
              )}
            </div>
            <div className="lg:col-span-5 p-3 space-y-2">
              {[
                { val: carvedilol, set: setCarvedilol, dose: carvedilolDose, setDose: setCarvedilolDose, label: 'Carvedilol', clsKey: 'carvedilol' },
                { val: bisoprolol, set: setBisoprolol, dose: bisoprololDose, setDose: setBisoprololDose, label: 'Bisoprolol', clsKey: 'bisoprolol' },
                { val: metoprololSuccinate, set: setMetoprololSuccinate, dose: metoprololSuccinateDose, setDose: setMetoprololSuccinateDose, label: 'Metoprolol Succinate', clsKey: 'metoprolol' },
                { val: nebivolol, set: setNebivolol, dose: nebivololDose, setDose: setNebivololDose, label: 'Nebivolol', clsKey: 'nebivolol' },
                { val: betaBlockerOther, set: setBetaBlockerOther, dose: betaBlockerOtherDose, setDose: setBetaBlockerOtherDose, label: 'Other:', name: betaBlockerOtherName, setName: setBetaBlockerOtherName, isOther: true }
              ].map((drug) => {
                const errorKey = drug.label === 'Metoprolol Succinate' ? 'metoprololSuccinateDose' : (drug.label === 'Carvedilol' ? 'carvedilolDose' : (drug.label === 'Bisoprolol' ? 'bisoprololDose' : (drug.label === 'Nebivolol' ? 'nebivololDose' : '')));
                return renderDrugRow(drug, errorKey);
              })}
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
              <div className="mt-1.5">
                <input disabled={readOnly || betaNotUsedOther !== 'Yes'}
                  type="text"
                  value={betaNotUsedOtherReason}
                  onChange={(e) => setBetaNotUsedOtherReason(e.target.value)}
                  className="border border-slate-300 rounded p-1 text-xs w-full focus:ring-1 focus:ring-teal-500 focus:border-teal-500 outline-none disabled:bg-slate-100 disabled:text-slate-400"
                  placeholder="Specify other reason..."
                />
              </div>
            </div>
          </div>

          {/* ACE Inhibitors Row */}
          <div className={`grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-slate-200 ${formErrors.aceInhibitor ? 'border border-red-500 bg-red-50/20' : ''}`} id="drugAceInhibitor">
            <div className="lg:col-span-3 bg-slate-50/70 p-3 flex flex-col justify-center">
              <span className="font-bold text-slate-800 text-[11px] uppercase">ACE Inhibitor <span className="text-red-500 font-bold ml-0.5">*</span></span>
              {formErrors.aceInhibitor && (
                <span className="text-red-500 text-[10px] font-bold block mt-1">{formErrors.aceInhibitor}</span>
              )}
            </div>
            <div className="lg:col-span-5 p-3 space-y-2">
              {[
                { val: enalapril, set: setEnalapril, dose: enalaprilDose, setDose: setEnalaprilDose, label: 'Enalapril', clsKey: 'enalapril' },
                { val: ramipril, set: setRamipril, dose: ramiprilDose, setDose: setRamiprilDose, label: 'Ramipril', clsKey: 'ramipril' },
                { val: lisinopril, set: setLisinopril, dose: lisinoprilDose, setDose: setLisinoprilDose, label: 'Lisinopril', clsKey: 'lisinopril' },
                { val: perindopril, set: setPerindopril, dose: perindoprilDose, setDose: setPerindoprilDose, label: 'Perindopril', clsKey: 'perindopril' },
                { val: aceOther, set: setAceOther, dose: aceOtherDose, setDose: setAceOtherDose, label: 'Other:', name: aceOtherName, setName: setAceOtherName, isOther: true }
              ].map((drug) => {
                const errorKey = drug.label === 'Enalapril' ? 'enalaprilDose' : (drug.label === 'Ramipril' ? 'ramiprilDose' : (drug.label === 'Lisinopril' ? 'lisinoprilDose' : (drug.label === 'Perindopril' ? 'perindoprilDose' : (drug.isOther ? 'aceOtherDose' : ''))));
                return renderDrugRow(drug, errorKey);
              })}
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
              <div className="mt-1.5">
                <input disabled={readOnly || aceNotUsedOther !== 'Yes'}
                  type="text"
                  value={aceNotUsedOtherReason}
                  onChange={(e) => setAceNotUsedOtherReason(e.target.value)}
                  className="border border-slate-300 rounded p-1 text-xs w-full focus:ring-1 focus:ring-teal-500 focus:border-teal-500 outline-none disabled:bg-slate-100 disabled:text-slate-400"
                  placeholder="Specify other reason..."
                />
              </div>
            </div>
          </div>

          {/* ARBs Row */}
          <div className={`grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-slate-200 ${formErrors.arb ? 'border border-red-500 bg-red-50/20' : ''}`} id="drugArb">
            <div className="lg:col-span-3 bg-slate-50/70 p-3 flex flex-col justify-center">
              <span className="font-bold text-slate-800 text-[11px] uppercase">Angiotensin Receptor Blocker <span className="text-red-500 font-bold ml-0.5">*</span></span>
              {formErrors.arb && (
                <span className="text-red-500 text-[10px] font-bold block mt-1">{formErrors.arb}</span>
              )}
            </div>
            <div className="lg:col-span-5 p-3 space-y-2">
              {[
                { val: valsartan, set: setValsartan, dose: valsartanDose, setDose: setValsartanDose, label: 'Valsartan', clsKey: 'valsartan' },
                { val: losartan, set: setLosartan, dose: losartanDose, setDose: setLosartanDose, label: 'Losartan', clsKey: 'losartan' },
                { val: telmisartan, set: setTelmisartan, dose: telmisartanDose, setDose: setTelmisartanDose, label: 'Telmisartan', clsKey: 'telmisartan' },
                { val: olmesartan, set: setOlmesartan, dose: olmesartanDose, setDose: setOlmesartanDose, label: 'Olmesartan', clsKey: 'olmesartan' },
                { val: arbOther, set: setArbOther, dose: arbOtherDose, setDose: setArbOtherDose, label: 'Other:', name: arbOtherName, setName: setArbOtherName, isOther: true }
              ].map((drug) => {
                const errorKey = drug.label === 'Valsartan' ? 'valsartanDose' : (drug.label === 'Losartan' ? 'losartanDose' : (drug.label === 'Telmisartan' ? 'telmisartanDose' : (drug.label === 'Olmesartan' ? 'olmesartanDose' : (drug.isOther ? 'arbOtherDose' : ''))));
                return renderDrugRow(drug, errorKey);
              })}
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
              <div className="mt-1.5">
                <input disabled={readOnly || arbNotUsedOther !== 'Yes'}
                  type="text"
                  value={arbNotUsedOtherReason}
                  onChange={(e) => setArbNotUsedOtherReason(e.target.value)}
                  className="border border-slate-300 rounded p-1 text-xs w-full focus:ring-1 focus:ring-teal-500 focus:border-teal-500 outline-none disabled:bg-slate-100 disabled:text-slate-400"
                  placeholder="Specify other reason..."
                />
              </div>
            </div>
          </div>

          {/* Aldosterone Antagonists Row */}
          <div className={`grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-slate-200 ${formErrors.aldosterone ? 'border border-red-500 bg-red-50/20' : ''}`} id="drugAldosterone">
            <div className="lg:col-span-3 bg-slate-50/70 p-3 flex flex-col justify-center">
              <span className="font-bold text-slate-800 text-[11px] uppercase">Aldosterone Antagonist <span className="text-red-500 font-bold ml-0.5">*</span></span>
              {formErrors.aldosterone && (
                <span className="text-red-500 text-[10px] font-bold block mt-1">{formErrors.aldosterone}</span>
              )}
            </div>
            <div className="lg:col-span-5 p-3 space-y-2">
              {[
                { val: spironolactone, set: setSpironolactone, dose: spironolactoneDose, setDose: setSpironolactoneDose, label: 'Spironolactone', clsKey: 'spironolactone' },
                { val: eplerenone, set: setEplerenone, dose: eplerenoneDose, setDose: setEplerenoneDose, label: 'Eplerenone', clsKey: 'eplerenone' }
              ].map((drug) => {
                const errorKey = drug.label === 'Spironolactone' ? 'spironolactoneDose' : (drug.label === 'Eplerenone' ? 'eplerenoneDose' : '');
                return renderDrugRow(drug, errorKey);
              })}
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
              <div className="mt-1.5">
                <input disabled={readOnly || aldosteroneNotUsedOther !== 'Yes'}
                  type="text"
                  value={aldosteroneNotUsedOtherReason}
                  onChange={(e) => setAldosteroneNotUsedOtherReason(e.target.value)}
                  className="border border-slate-300 rounded p-1 text-xs w-full focus:ring-1 focus:ring-teal-500 focus:border-teal-500 outline-none disabled:bg-slate-100 disabled:text-slate-400"
                  placeholder="Specify other reason..."
                />
              </div>
            </div>
          </div>

          {/* Hydralazine Row */}
          <div className={`grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-slate-200 ${formErrors.hydralazine ? 'border border-red-500 bg-red-50/20' : ''}`} id="drugHydralazine">
            <div className="lg:col-span-3 bg-slate-50/70 p-3 flex flex-col justify-center">
              <span className="font-bold text-slate-800 text-[11px] uppercase">Hydralazine <span className="text-red-500 font-bold ml-0.5">*</span></span>
              {formErrors.hydralazine && (
                <span className="text-red-500 text-[10px] font-bold block mt-1">{formErrors.hydralazine}</span>
              )}
            </div>
            <div className="lg:col-span-9 p-3">
              <div className="flex items-center gap-3">

                <div className="flex items-center gap-1.5 flex-1">
                  <input disabled={readOnly}
                    type="text"
                    value={hydralazineName}
                    onChange={(e) => setHydralazineName(e.target.value)}
                    className="border border-slate-300 rounded p-1.5 text-xs flex-1 max-w-md focus:ring-1 focus:ring-teal-500 focus:border-teal-500 outline-none disabled:bg-slate-100 disabled:text-slate-400"
                    placeholder="Details"
                  />
                  <div className="flex flex-col items-end w-28">
                    <input disabled={readOnly}
                      type="text"
                      value={hydralazineDose}
                      onChange={(e) => handleDoseChange(e.target.value, setHydralazineDose, 'Hydralazine')}
                      className="border border-slate-300 rounded p-1 text-xs w-full focus:ring-1 focus:ring-teal-500 focus:border-teal-500 outline-none text-right disabled:bg-slate-100 disabled:text-slate-400"
                      placeholder="Dose"
                    />
                    {doseErrors['Hydralazine'] && (
                      <span className="text-red-500 text-[9px] block font-bold text-right w-full mt-0.5">{doseErrors['Hydralazine']}</span>
                    )}
                  </div>
                  <span className="text-[10px] text-slate-400">/per day</span>
                </div>
              </div>
            </div>
          </div>

          {/* Nitrate Row */}
          <div className={`grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-slate-200 ${formErrors.nitrate ? 'border border-red-500 bg-red-50/20' : ''}`} id="drugNitrate">
            <div className="lg:col-span-3 bg-slate-50/70 p-3 flex flex-col justify-center">
              <span className="font-bold text-slate-800 text-[11px] uppercase">Nitrate <span className="text-red-500 font-bold ml-0.5">*</span></span>
              {formErrors.nitrate && (
                <span className="text-red-500 text-[10px] font-bold block mt-1">{formErrors.nitrate}</span>
              )}
            </div>
            <div className="lg:col-span-9 p-3 space-y-3">
              {[
                { val: nitrate1, set: setNitrate1, name: nitrate1Name, setName: setNitrate1Name, dose: nitrate1Dose, setDose: setNitrate1Dose, label: 'Nitrate 1' },
                { val: nitrate2, set: setNitrate2, name: nitrate2Name, setName: setNitrate2Name, dose: nitrate2Dose, setDose: setNitrate2Dose, label: 'Nitrate 2' }
              ].map((nitrate, idx) => (
                <div key={idx} className="flex items-center gap-3">

                  <div className="flex items-center gap-1.5 flex-1">
                    <input disabled={readOnly || nitrate.val !== 'Yes'}
                      type="text"
                      value={nitrate.name}
                      onChange={(e) => nitrate.setName(e.target.value)}
                      className="border border-slate-300 rounded p-1.5 text-xs flex-1 max-w-md focus:ring-1 focus:ring-teal-500 focus:border-teal-500 outline-none disabled:bg-slate-100 disabled:text-slate-400"
                      placeholder={`${nitrate.label} Details`}
                    />
                    <input disabled={readOnly || nitrate.val !== 'Yes'}
                      type="text"
                      value={nitrate.dose}
                      onChange={(e) => nitrate.setDose(e.target.value)}
                      className="border border-slate-300 rounded p-1.5 text-xs w-28 focus:ring-1 focus:ring-teal-500 focus:border-teal-500 outline-none text-right disabled:bg-slate-100 disabled:text-slate-400"
                      placeholder="Dose"
                    />
                    <span className="text-[10px] text-slate-400">/per day</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Anticoagulation Row */}
          <div className={`grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-slate-200 ${formErrors.anticoagulation ? 'border border-red-500 bg-red-50/20' : ''}`} id="drugAnticoagulation">
            <div className="lg:col-span-3 bg-slate-50/70 p-3 flex flex-col justify-center">
              <span className="font-bold text-slate-800 text-[11px] uppercase">Anticoagulation <span className="text-red-500 font-bold ml-0.5">*</span></span>
              {formErrors.anticoagulation && (
                <span className="text-red-500 text-[10px] font-bold block mt-1">{formErrors.anticoagulation}</span>
              )}
            </div>
            <div className="lg:col-span-9 p-3 space-y-3">
              {/* Warfarin */}
              <div className="flex flex-col sm:flex-row sm:items-center gap-3 pb-2 border-b border-slate-100">
                <label className="flex items-center gap-1.5 cursor-pointer whitespace-nowrap">
                  <span className="font-medium text-slate-700">Warfarin</span>
                </label>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1">
                    <span className="text-xs text-slate-600">INR:</span>
                    <input disabled={readOnly}
                      type="text"
                      value={warfarinInr}
                      onChange={(e) => handleFieldChange('inr', e.target.value, setWarfarinInr, (err) => {})}
                      className="border border-slate-300 rounded p-1 text-xs w-20 focus:ring-1 focus:ring-teal-500 focus:border-teal-500 outline-none text-right disabled:bg-slate-100 disabled:text-slate-400"
                      placeholder="INR"
                    />
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-xs text-slate-600">Target INR:</span>
                    <input disabled={readOnly}
                      type="text"
                      value={warfarinTargetInr}
                      onChange={(e) => setWarfarinTargetInr(e.target.value)}
                      className="border border-slate-300 rounded p-1 text-xs w-20 focus:ring-1 focus:ring-teal-500 focus:border-teal-500 outline-none text-right disabled:bg-slate-100 disabled:text-slate-400"
                      placeholder="Target INR"
                    />
                  </div>
                </div>
              </div>

              {/* Vitamin K Inhibitor */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-100">
                <label className="flex items-center gap-1.5 cursor-pointer whitespace-nowrap">
                  <span className="font-medium text-slate-700">Vitamin K Inhibitor</span>
                </label>
                <div className="flex items-center gap-1.5">
                  <input disabled={readOnly}
                    type="text"
                    value={vitaminKInhibitorName}
                    onChange={(e) => setVitaminKInhibitorName(e.target.value)}
                    className="border border-slate-300 rounded p-1 text-xs w-36 focus:ring-1 focus:ring-teal-500 focus:border-teal-500 outline-none disabled:bg-slate-100 disabled:text-slate-400"
                    placeholder="Name"
                  />
                  <input disabled={readOnly}
                    type="text"
                    value={vitaminKInhibitorDose}
                    onChange={(e) => setVitaminKInhibitorDose(e.target.value)}
                    className="border border-slate-300 rounded p-1 text-xs w-24 focus:ring-1 focus:ring-teal-500 focus:border-teal-500 outline-none text-right disabled:bg-slate-100 disabled:text-slate-400"
                    placeholder="Dose"
                  />
                  <span className="text-[10px] text-slate-400">/per day</span>
                </div>
              </div>

              {/* NOAC */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-100">
                <label className="flex items-center gap-1.5 cursor-pointer whitespace-nowrap">
                  <span className="font-medium text-slate-700">NOAC</span>
                </label>
                <div className="flex items-center gap-1.5">
                  <input disabled={readOnly}
                    type="text"
                    value={noacName}
                    onChange={(e) => setNoacName(e.target.value)}
                    className="border border-slate-300 rounded p-1 text-xs w-36 focus:ring-1 focus:ring-teal-500 focus:border-teal-500 outline-none disabled:bg-slate-100 disabled:text-slate-400"
                    placeholder="Name"
                  />
                  <input disabled={readOnly}
                    type="text"
                    value={noacDose}
                    onChange={(e) => setNoacDose(e.target.value)}
                    className="border border-slate-300 rounded p-1 text-xs w-24 focus:ring-1 focus:ring-teal-500 focus:border-teal-500 outline-none text-right disabled:bg-slate-100 disabled:text-slate-400"
                    placeholder="Dose"
                  />
                  <span className="text-[10px] text-slate-400">/per day</span>
                </div>
              </div>

              {/* Acitrom, UFH, LMWH */}
              <div className="space-y-2">
                {[
                  { val: acitrom, set: setAcitrom, dose: acitromDose, setDose: setAcitromDose, label: 'Acitrom', clsKey: 'acitrom' },
                  { val: ufh, set: setUfh, dose: ufhDose, setDose: setUfhDose, label: 'UFH', clsKey: 'ufh', unit: 'units/day' },
                  { val: lmwh, set: setLmwh, dose: lmwhDose, setDose: setLmwhDose, label: 'LMWH', clsKey: 'lmwh' }
                ].map((drug) => {
                  const errorKey = drug.label === 'Acitrom' ? 'acitromDose' : (drug.label === 'UFH' ? 'ufhDose' : (drug.label === 'LMWH' ? 'lmwhDose' : ''));
                  return renderDrugRow(drug, errorKey);
                })}
              </div>
            </div>
          </div>

          {/* Antiplatelets Row */}
          <div className={`grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-slate-200 ${formErrors.antiplatelet ? 'border border-red-500 bg-red-50/20' : ''}`} id="drugAntiplatelet">
            <div className="lg:col-span-3 bg-slate-50/70 p-3 flex flex-col justify-center">
              <span className="font-bold text-slate-800 text-[11px] uppercase">Anti-platelet <span className="text-red-500 font-bold ml-0.5">*</span></span>
              {formErrors.antiplatelet && (
                <span className="text-red-500 text-[10px] font-bold block mt-1">{formErrors.antiplatelet}</span>
              )}
            </div>
            <div className="lg:col-span-9 p-3 space-y-2">
              {[
                { val: aspirin, set: setAspirin, dose: aspirinDose, setDose: setAspirinDose, label: 'Aspirin', clsKey: 'aspirin' },
                { val: clopidogrel, set: setClopidogrel, dose: clopidogrelDose, setDose: setClopidogrelDose, label: 'Clopidogrel', clsKey: 'clopidogrel' },
                { val: prasugrel, set: setPrasugrel, dose: prasugrelDose, setDose: setPrasugrelDose, label: 'Prasugrel', clsKey: 'prasugrel' },
                { val: ticagrelor, set: setTicagrelor, dose: ticagrelorDose, setDose: setTicagrelorDose, label: 'Ticagrelor', clsKey: 'ticagrelor' }
              ].map((drug) => {
                const errorKey = drug.label === 'Aspirin' ? 'aspirinDose' : (drug.label === 'Clopidogrel' ? 'clopidogrelDose' : (drug.label === 'Prasugrel' ? 'prasugrelDose' : (drug.label === 'Ticagrelor' ? 'ticagrelorDose' : '')));
                return renderDrugRow(drug, errorKey);
              })}
            </div>
          </div>

          {/* Antiarrhythmics Row */}
          <div className={`grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-slate-200 ${formErrors.antiarrhythmic ? 'border border-red-500 bg-red-50/20' : ''}`} id="drugAntiarrhythmic">
            <div className="lg:col-span-3 bg-slate-50/70 p-3 flex flex-col justify-center">
              <span className="font-bold text-slate-800 text-[11px] uppercase">Antiarrhythmic <span className="text-red-500 font-bold ml-0.5">*</span></span>
              {formErrors.antiarrhythmic && (
                <span className="text-red-500 text-[10px] font-bold block mt-1">{formErrors.antiarrhythmic}</span>
              )}
            </div>
            <div className="lg:col-span-9 p-3 space-y-2">
              {[
                { val: amiodarone, set: setAmiodarone, dose: amiodaroneDose, setDose: setAmiodaroneDose, label: 'Amiodarone', clsKey: 'amiodarone' },
                { val: antiarrhythmicOther, set: setAntiarrhythmicOther, dose: antiarrhythmicOtherDose, setDose: setAntiarrhythmicOtherDose, label: 'Other:', name: antiarrhythmicOtherName, setName: setAntiarrhythmicOtherName, isOther: true }
              ].map((drug) => {
                const errorKey = drug.label === 'Amiodarone' ? 'amiodaroneDose' : (drug.isOther ? 'antiarrhythmicOtherDose' : '');
                return renderDrugRow(drug, errorKey);
              })}
            </div>
          </div>

          {/* Diuretics Row */}
          <div className={`grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-slate-200 ${formErrors.diuretic ? 'border border-red-500 bg-red-50/20' : ''}`} id="drugDiuretic">
            <div className="lg:col-span-3 bg-slate-50/70 p-3 flex flex-col justify-center">
              <span className="font-bold text-slate-800 text-[11px] uppercase">Diuretic <span className="text-red-500 font-bold ml-0.5">*</span></span>
              {formErrors.diuretic && (
                <span className="text-red-500 text-[10px] font-bold block mt-1">{formErrors.diuretic}</span>
              )}
            </div>
            <div className="lg:col-span-5 p-3 space-y-2">
              {[
                { val: furosemide, set: setFurosemide, dose: furosemideDose, setDose: setFurosemideDose, label: 'Furosemide', clsKey: 'furosemide' },
                { val: torsemide, set: setTorsemide, dose: torsemideDose, setDose: setTorsemideDose, label: 'Torsemide', clsKey: 'torsemide' },
                { val: metolazone, set: setMetolazone, dose: metolazoneDose, setDose: setMetolazoneDose, label: 'Metolazone', clsKey: 'metolazone' },
                { val: diureticOther, set: setDiureticOther, dose: diureticOtherDose, setDose: setDiureticOtherDose, label: 'Other:', name: diureticOtherName, setName: setDiureticOtherName, isOther: true }
              ].map((drug) => {
                const errorKey = drug.label === 'Furosemide' ? 'furosemideDose' : (drug.label === 'Torsemide' ? 'torsemideDose' : (drug.label === 'Metolazone' ? 'metolazoneDose' : (drug.isOther ? 'diureticOtherDose' : '')));
                return renderDrugRow(drug, errorKey);
              })}
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
              <div className="mt-1.5">
                <input disabled={readOnly || diureticNotUsedOther !== 'Yes'}
                  type="text"
                  value={diureticNotUsedOtherReason}
                  onChange={(e) => setDiureticNotUsedOtherReason(e.target.value)}
                  className="border border-slate-300 rounded p-1 text-xs w-full focus:ring-1 focus:ring-teal-500 focus:border-teal-500 outline-none disabled:bg-slate-100 disabled:text-slate-400"
                  placeholder="Specify other reason..."
                />
              </div>
            </div>
          </div>

          {/* Digoxin Row */}
          <div className={`grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-slate-200 ${formErrors.digoxin ? 'border border-red-500 bg-red-50/20' : ''}`} id="drugDigoxin">
            <div className="lg:col-span-3 bg-slate-50/70 p-3 flex flex-col justify-center">
              <span className="font-bold text-slate-800 text-[11px] uppercase">Digoxin <span className="text-red-500 font-bold ml-0.5">*</span></span>
              {formErrors.digoxin && (
                <span className="text-red-500 text-[10px] font-bold block mt-1">{formErrors.digoxin}</span>
              )}
            </div>
            <div className="lg:col-span-9 p-3">
              {renderDrugRow({ val: digoxin, set: setDigoxin, dose: digoxinDose, setDose: setDigoxinDose, label: 'Digoxin', name: digoxinName, setName: setDigoxinName, clsKey: 'digoxin' }, 'digoxinDose')}
            </div>
           </div>
 
           {/* Ivabradine Row */}
           <div className={`grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-slate-200 ${formErrors.ivabradine ? 'border border-red-500 bg-red-50/20' : ''}`} id="drugIvabradine">
             <div className="lg:col-span-3 bg-slate-50/70 p-3 flex flex-col justify-center">
               <span className="font-bold text-slate-800 text-[11px] uppercase">Ivabradine <span className="text-red-500 font-bold ml-0.5">*</span></span>
               {formErrors.ivabradine && (
                 <span className="text-red-500 text-[10px] font-bold block mt-1">{formErrors.ivabradine}</span>
               )}
             </div>
             <div className="lg:col-span-9 p-3">
               {renderDrugRow({ val: ivabradine, set: setIvabradine, dose: ivabradineDose, setDose: setIvabradineDose, label: 'Ivabradine', isOther: true, clsKey: 'ivabradine' }, 'ivabradineDose')}
             </div>
          </div>

          {/* Statins Row */}
          <div className={`grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-slate-200 ${formErrors.statins ? 'border border-red-500 bg-red-50/20' : ''}`} id="drugStatins">
            <div className="lg:col-span-3 bg-slate-50/70 p-3 flex flex-col justify-center">
              <span className="font-bold text-slate-800 text-[11px] uppercase">Statins <span className="text-red-500 font-bold ml-0.5">*</span></span>
              {formErrors.statins && (
                <span className="text-red-500 text-[10px] font-bold block mt-1">{formErrors.statins}</span>
              )}
            </div>
            <div className="lg:col-span-9 p-3 space-y-2">
              {[
                { val: atorvastatin, set: setAtorvastatin, dose: atorvastatinDose, setDose: setAtorvastatinDose, label: 'Atorvastatin', clsKey: 'atorvastatin' },
                { val: simvastatin, set: setSimvastatin, dose: simvastatinDose, setDose: setSimvastatinDose, label: 'Simvastatin', clsKey: 'simvastatin' },
                { val: rosuvastatin, set: setRosuvastatin, dose: rosuvastatinDose, setDose: setRosuvastatinDose, label: 'Rosuvastatin', clsKey: 'rosuvastatin' }
              ].map((drug) => {
                const errorKey = drug.label === 'Atorvastatin' ? 'atorvastatinDose' : (drug.label === 'Simvastatin' ? 'simvastatinDose' : (drug.label === 'Rosuvastatin' ? 'rosuvuvastatinDose' : ''));
                return renderDrugRow(drug, errorKey);
              })}
            </div>
          </div>

          {/* Antidiabetics Row */}
          <div className={`grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-slate-200 ${formErrors.antidiabetics ? 'border border-red-500 bg-red-50/20' : ''}`} id="drugAntidiabetics">
            <div className="lg:col-span-3 bg-slate-50/70 p-3 flex flex-col justify-center">
              <span className="font-bold text-slate-800 text-[11px] uppercase">Antidiabetics <span className="text-red-500 font-bold ml-0.5">*</span></span>
              {formErrors.antidiabetics && (
                <span className="text-red-500 text-[10px] font-bold block mt-1">{formErrors.antidiabetics}</span>
              )}
            </div>
            <div className="lg:col-span-9 p-3 space-y-2">
              {[
                { val: sulfonylureas, set: setSulfonylureas, dose: sulfonylureasDose, setDose: setSulfonylureasDose, label: 'Sulfonylureas', clsKey: 'sulfonylureas' },
                { val: metformin, set: setMetformin, dose: metforminDose, setDose: setMetforminDose, label: 'Metformin', clsKey: 'metformin' },
                { val: glitazone, set: setGlitazone, dose: glitazoneDose, setDose: setGlitazoneDose, label: 'Glitazone', clsKey: 'glitazone' },
                { val: gliptin, set: setGliptin, dose: gliptinDose, setDose: setGliptinDose, label: 'Gliptin', clsKey: 'gliptin' },
                { val: acarboseDerivative, set: setAcarboseDerivative, dose: acarboseDerivativeDose, setDose: setAcarboseDerivativeDose, label: 'Acarbose Derivative', clsKey: 'acarbose' },
                { val: humanInsulin, set: setHumanInsulin, dose: humanInsulinDose, setDose: setHumanInsulinDose, label: 'Human Insulin', unit: 'units/day', clsKey: 'insulin' },
                { val: syntheticInsulin, set: setSyntheticInsulin, dose: syntheticInsulinDose, setDose: setSyntheticInsulinDose, label: 'Synthetic Insulin', unit: 'units/day', clsKey: 'insulin' }
              ].map((drug) => {
                const errorKey = drug.label === 'Sulfonylureas' ? 'sulfonylureasDose' : (drug.label === 'Metformin' ? 'metforminDose' : (drug.label === 'Glitazone' ? 'glitazoneDose' : (drug.label === 'Gliptin' ? 'gliptinDose' : (drug.label === 'Acarbose Derivative' ? 'acarboseDerivativeDose' : (drug.label === 'Human Insulin' ? 'humanInsulinDose' : (drug.label === 'Synthetic Insulin' ? 'syntheticInsulinDose' : ''))))));
                return renderDrugRow(drug, errorKey);
              })}
            </div>
          </div>

          {/* Other Row */}
          <div className="grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-slate-200">
            <div className="lg:col-span-3 bg-slate-50/70 p-3 flex flex-col justify-center">
              <span className="font-bold text-slate-800 text-[11px] uppercase">Other</span>
            </div>
            <div className="lg:col-span-9 p-3 space-y-3">
              {renderDrugRow({
                val: antihypertensiveName || antihypertensiveDose ? 'Yes' : 'No',
                set: () => {},
                dose: antihypertensiveDose,
                setDose: setAntihypertensiveDose,
                label: 'Anti-hypertensive',
                name: antihypertensiveName,
                setName: setAntihypertensiveName,
                clsKey: 'antihypertensive',
                unit: 'mg/day'
              }, 'antihypertensiveDose')}

              {renderDrugRow({
                val: thyroxineDose ? 'Yes' : 'No',
                set: () => {},
                dose: thyroxineDose,
                setDose: setThyroxineDose,
                label: 'Thyroxine',
                clsKey: 'thyroxine',
                unit: 'mcg/day'
              }, 'thyroxineDose')}

              {/* Custom Other Medications 1 - 4 */}
              {[
                { val: otherMedication1, set: setOtherMedication1, name: otherMedication1Name, setName: setOtherMedication1Name, dose: otherMedication1Dose, setDose: setOtherMedication1Dose, label: 'Other Medication 1', isOther: true },
                { val: otherMedication2, set: setOtherMedication2, name: otherMedication2Name, setName: setOtherMedication2Name, dose: otherMedication2Dose, setDose: setOtherMedication2Dose, label: 'Other Medication 2', isOther: true },
                { val: otherMedication3, set: setOtherMedication3, name: otherMedication3Name, setName: setOtherMedication3Name, dose: otherMedication3Dose, setDose: setOtherMedication3Dose, label: 'Other Medication 3', isOther: true },
                { val: otherMedication4, set: setOtherMedication4, name: otherMedication4Name, setName: setOtherMedication4Name, dose: otherMedication4Dose, setDose: setOtherMedication4Dose, label: 'Other Medication 4', isOther: true }
              ].map((drug, idx) => (
                <div key={idx} className="flex items-center justify-between gap-3 pt-2 border-t border-slate-100 last:border-0">
                  <div className="flex items-center gap-3 flex-1">
                    <input disabled={readOnly}
                      type="checkbox"
                      checked={drug.val === 'Yes'}
                      onChange={(e) => drug.set(e.target.checked ? 'Yes' : 'No')}
                      className="rounded border-slate-300 text-teal-600 focus:ring-teal-500 w-3.5 h-3.5"
                    />
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
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </SectionCard>   {/* 7. Device Therapy */}
      <SectionCard title="7. Device Therapy" subtitle="Current implanted devices and eligibility assessment">
        <div className="border border-slate-300 rounded-lg overflow-hidden text-xs bg-white divide-y divide-slate-300">
          
          {/* Current Device Therapy */}
          <div className={`grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-slate-200 ${formErrors.currentDevice ? 'border border-red-500 bg-red-50/20' : ''}`} id="currentDeviceBlock">
            <div className="lg:col-span-3 bg-slate-50/70 p-3 flex flex-col justify-center">
              <span className="font-bold text-slate-800 text-[11px] uppercase">Current Device Therapy <span className="text-red-500 font-bold ml-0.5">*</span></span>
              {formErrors.currentDevice && (
                <span className="text-red-500 text-[10px] font-bold block mt-1">{formErrors.currentDevice}</span>
              )}
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

              <div className="space-y-3">
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
                          <input disabled={readOnly || currentDeviceYes !== 'Yes'}
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
                    <input type="text"
                      disabled={readOnly || currentDeviceYes !== 'Yes'}
                      value={currentDeviceBrand}
                      onChange={(e) => setCurrentDeviceBrand(e.target.value)}
                      className="border border-slate-300 rounded p-1.5 text-xs w-full max-w-md focus:ring-1 focus:ring-teal-500 focus:border-teal-500 outline-none"
                      placeholder="E.g. Medtronic, Boston Scientific"
                    />
                  </div>
                </div>
            </div>
          </div>

          {/* Eligibility for device therapy */}
          <div className={`grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-slate-200 ${formErrors.eligibleDevice ? 'border border-red-500 bg-red-50/20' : ''}`} id="eligibleDeviceBlock">
            <div className="lg:col-span-3 bg-slate-50/70 p-3 flex flex-col justify-center">
              <span className="font-bold text-slate-800 text-[11px] uppercase">Eligibility for Device Therapy <span className="text-red-500 font-bold ml-0.5">*</span></span>
              {formErrors.eligibleDevice && (
                <span className="text-red-500 text-[10px] font-bold block mt-1">{formErrors.eligibleDevice}</span>
              )}
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

              <div className="space-y-4">
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
                          <input disabled={readOnly || eligibleYes !== 'Yes'}
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
                      <label className="block text-xs font-semibold text-slate-600 mb-1">Recommended Brand / Model <span className="text-red-500 font-bold ml-0.5">*</span></label>
                      <input type="text"
                        disabled={readOnly || eligibleYes !== 'Yes'}
                        value={eligibleDeviceBrand}
                        onChange={(e) => setEligibleDeviceBrand(e.target.value)}
                        className={`border rounded p-1.5 text-xs w-full focus:ring-1 focus:ring-teal-500 focus:border-teal-500 outline-none ${formErrors.eligibleDeviceBrand ? 'border-red-500 bg-red-50 text-red-700' : 'border-slate-300'}`}
                        placeholder="E.g. Medtronic, Boston Scientific"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">Patient Acceptance <span className="text-red-500 font-bold ml-0.5">*</span></label>
                      <div className={`flex items-center gap-4 mt-2 p-1 rounded ${formErrors.patientAcceptance ? 'border border-red-500 bg-red-50/20' : ''}`}>
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
                      {formErrors.patientAcceptance && (
                        <span className="text-red-500 text-[10px] font-bold block mt-1">{formErrors.patientAcceptance}</span>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">If No, reasons:</label>
                    <textarea disabled={readOnly || patientAcceptanceNo !== 'Yes'}
                      value={patientAcceptanceReason}
                      onChange={(e) => setPatientAcceptanceReason(e.target.value)}
                      className="border border-slate-300 rounded p-1.5 text-xs w-full focus:ring-1 focus:ring-teal-500 focus:border-teal-500 outline-none disabled:bg-slate-100 disabled:text-slate-400"
                      placeholder="Describe patient refusal or clinical reasons..."
                      rows={2}
                    />
                  </div>
                </div>
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
          <div className={`grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-slate-200 ${formErrors.icdShock || formErrors.atp ? 'border border-red-500 bg-red-50/20' : ''}`} id="icdTherapyBlock">
            <div className="lg:col-span-3 bg-slate-50/70 p-3 flex flex-col justify-center">
              <span className="font-bold text-slate-800 text-[11px] uppercase">ICD Therapy Administered</span>
              {(formErrors.icdShock || formErrors.atp) && (
                <span className="text-red-500 text-[10px] font-bold block mt-1">{formErrors.icdShock || formErrors.atp}</span>
              )}
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
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pl-5">
                  {renderDeviceMetric('# of shocks', numberOfShocks, setNumberOfShocks, 'numberOfShocks', 'Count', 'numberOfShocks', true, icdShock !== 'Yes', 'number')}
                  {renderDeviceMetric('# of appropriate shocks', appropriateShocks, setAppropriateShocks, 'appropriateShocks', 'Count', 'appropriateShocks', true, icdShock !== 'Yes', 'number')}
                  {renderDeviceMetric('# of inappropriate shocks', inappropriateShocks, setInappropriateShocks, 'inappropriateShocks', 'Count', 'inappropriateShocks', true, icdShock !== 'Yes', 'number')}
                  <div className="md:col-span-3">
                    <label className="block text-[10px] text-slate-600 mb-1">Cause of Shocks</label>
                    <input disabled={readOnly || icdShock !== 'Yes'}
                      type="text"
                      value={causeOfShocks}
                      onChange={(e) => setCauseOfShocks(e.target.value)}
                      className="border border-slate-300 rounded p-1 text-xs w-full focus:ring-1 focus:ring-teal-500 focus:border-teal-500 outline-none disabled:bg-slate-100 disabled:text-slate-400"
                      placeholder="E.g. VT, VF, noise, SVT"
                    />
                  </div>
                </div>
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
                      <label className="block text-[10px] text-slate-600 mb-1"># of times <span className="text-red-500 font-bold ml-0.5">*</span></label>
                      <input disabled={readOnly}
                        type="number"
                        value={atpTimes}
                        onChange={(e) => setAtpTimes(e.target.value)}
                        className={`border rounded p-1 text-xs w-28 focus:ring-1 focus:ring-teal-500 focus:border-teal-500 outline-none text-right ${formErrors.atpTimes ? 'border-red-500 bg-red-50 text-red-700' : 'border-slate-300'}`}
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
          <div className={`grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-slate-200 ${formErrors.bivPacingPercent || formErrors.afibBurden || formErrors.nsvtEpisodes ? 'border border-red-500 bg-red-50/20' : ''}`} id="technicalLogBlock">
            <div className="lg:col-span-3 bg-slate-50/70 p-3 flex flex-col justify-center">
              <span className="font-bold text-slate-800 text-[11px] uppercase">Technical Log Parameters</span>
              {(formErrors.bivPacingPercent || formErrors.afibBurden || formErrors.nsvtEpisodes) && (
                <span className="text-red-500 text-[10px] font-bold block mt-1">Please fill mandatory parameters</span>
              )}
            </div>
            <div className="lg:col-span-9 p-3 grid grid-cols-2 md:grid-cols-3 gap-3">
              {renderDeviceMetric('BiV pacing (%)', bivPacingPercent, setBivPacingPercent, 'bivPacingPercent', '%', 'bivPacingPercent', true)}
              {renderDeviceMetric('AFib burden', afibBurden, setAfibBurden, 'afibBurden', '%', 'afibBurden', true)}
              {renderDeviceMetric('NSVT episodes (#)', nsvtEpisodes, setNsvtEpisodes, 'nsvtEpisodes', 'Count', 'nsvtEpisodes', true, false, 'number')}
              {renderDeviceMetric('SVT episodes (#)', svtEpisodes, setSvtEpisodes, 'svtEpisodes', 'Count', 'svtEpisodes', false, false, 'number')}
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
        <div className={`border rounded-lg overflow-hidden text-xs bg-white ${formErrors.patientEducation ? 'border-red-500 bg-red-50/20' : 'border-slate-300'}`} id="patientEducationBlock">
          <div className="grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-slate-200">
            <div className="lg:col-span-3 bg-slate-50/70 p-3 flex flex-col justify-center">
              <span className="font-bold text-slate-800 text-[11px] uppercase">Recommend Patient Education <span className="text-red-500 font-bold ml-0.5">*</span></span>
              {formErrors.patientEducation && (
                <span className="text-red-500 text-[10px] font-bold block mt-1">{formErrors.patientEducation}</span>
              )}
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
                    {item.isOther && (
                      <input disabled={readOnly || item.val !== 'Yes'}
                        type="text"
                        value={eduOtherDetails}
                        onChange={(e) => setEduOtherDetails(e.target.value)}
                        className="border border-slate-300 rounded p-1.5 text-xs w-full max-w-md focus:ring-1 focus:ring-teal-500 focus:border-teal-500 outline-none disabled:bg-slate-100 disabled:text-slate-400"
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
        <div className={`border rounded-lg overflow-hidden text-xs bg-white divide-y divide-slate-300 ${formErrors.recommendations ? 'border-red-500 bg-red-50/20' : 'border-slate-300'}`} id="recommendationsBlock">
          {formErrors.recommendations && (
            <div className="p-2.5 bg-red-50 text-red-700 font-bold text-xs border-b border-red-200">
              {formErrors.recommendations}
            </div>
          )}
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
                  <span className="font-bold text-slate-800 text-[11px] uppercase">
                    {rec.label}
                  </span>
                </label>
              </div>
              <div className="lg:col-span-9 p-3">
                <textarea disabled={readOnly}
                  value={rec.details}
                  onChange={(e) => rec.setDetails(e.target.value)}
                  className={`w-full border rounded p-1.5 text-xs focus:ring-1 focus:ring-teal-500 focus:border-teal-500 outline-none disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed ${formErrors.recommendations ? 'border-red-500 bg-red-50 text-red-700 font-bold' : 'border-slate-300'}`}
                  placeholder={`Details for ${rec.label}...`}
                  rows={2}
                />
              </div>
            </div>
          ))}
        </div>
      </SectionCard>
      {/* 10. Imaging & Document Upload */}
      <SectionCard title="10. IMAGING & DOCUMENT UPLOAD" subtitle="Upload patient documents such as ECG, ECHO, Lab Reports, etc. (Max 5 files, 5MB limit, PDF or images)">
        <div className="space-y-4">
          {uploadedDocs.length > 0 ? (
            <div className="space-y-2">
              <label className="form-field-label">Uploaded Documents ({uploadedDocs.length}/5):</label>
              <div className="border border-slate-200 rounded-lg overflow-hidden bg-white text-xs divide-y divide-slate-100">
                {uploadedDocs.map(doc => (
                  <div key={doc.id} className="p-3 flex items-center justify-between flex-wrap gap-2 hover:bg-slate-50 transition-colors">
                    <div className="flex-1 min-w-[200px]">
                      <span className="font-bold text-slate-800 uppercase text-[10px] bg-slate-100 px-1.5 py-0.5 rounded mr-2">{doc.document_type}</span>
                      <a href={`http://localhost:5000/uploads/${doc.file_path}`} target="_blank" rel="noopener noreferrer" className="text-teal-600 hover:text-teal-700 hover:underline font-semibold break-all">
                        {doc.original_file_name}
                      </a>
                      <span className="text-slate-400 text-[10px] ml-2">({doc.file_size_kb} KB)</span>
                      {doc.notes && <p className="text-slate-500 text-[10px] mt-1 font-medium italic">Notes: {doc.notes}</p>}
                    </div>
                    {!readOnly && (
                      <button type="button" onClick={() => handleDeleteDocument(doc.id)} className="px-2.5 py-1 text-[11px] font-bold text-red-600 hover:bg-red-50 rounded border border-red-200 transition-colors">
                        Delete
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-xs text-slate-500 italic mb-2">No documents uploaded yet for this entry.</p>
          )}

          {!readOnly && uploadedDocs.length < 5 && (
            <div className="space-y-4 border-t border-slate-100 pt-4">
              <div>
                <label className="form-field-label mb-1">Select Files to Upload:</label>
                <input 
                  type="file" 
                  multiple 
                  onChange={handleFileSelection} 
                  className="w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-teal-50 file:text-teal-700 hover:file:bg-teal-100 cursor-pointer"
                  accept=".pdf,.jpeg,.jpg,.png"
                />
              </div>

              {selectedFiles.length > 0 && (
                <div className="space-y-3 bg-slate-50 p-3 rounded-lg border border-slate-200">
                  <label className="form-field-label">Configure Upload Details:</label>
                  {selectedFiles.map(file => (
                    <div key={file.name} className="p-3 bg-white border border-slate-200 rounded-lg space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-slate-800 text-xs truncate max-w-[70%]">{file.name}</span>
                        <button type="button" onClick={() => handleRemoveSelectedFile(file.name)} className="text-xs text-red-500 hover:underline font-bold">Remove</button>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                        <div className="md:col-span-1">
                          <label className="block text-[10px] font-bold text-slate-500 mb-0.5">Document Type</label>
                          <select 
                            value={fileMetadata[file.name]?.type || 'Other'} 
                            onChange={(e) => handleMetadataChange(file.name, 'type', e.target.value)}
                            className="w-full p-1.5 border border-slate-200 rounded text-xs bg-white text-slate-800"
                          >
                            <option value="ECG">ECG</option>
                            <option value="ECHO">ECHO</option>
                            <option value="Lab Report">Lab Report</option>
                            <option value="X-Ray">X-Ray</option>
                            <option value="Other">Other</option>
                          </select>
                        </div>
                        <div className="md:col-span-2">
                          <label className="block text-[10px] font-bold text-slate-500 mb-0.5">Notes</label>
                          <input 
                            type="text" 
                            placeholder="E.g. Admission ECG, post-procedure echo"
                            value={fileMetadata[file.name]?.notes || ''} 
                            onChange={(e) => handleMetadataChange(file.name, 'notes', e.target.value)}
                            className="w-full p-1.5 border border-slate-200 rounded text-xs bg-white text-slate-800"
                          />
                        </div>
                      </div>
                    </div>
                  ))}

                  <button 
                    type="button" 
                    disabled={uploading}
                    onClick={handleUploadDocuments}
                    className="w-full py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-bold shadow-sm disabled:opacity-50 transition-colors"
                  >
                    {uploading ? "Uploading..." : `Upload ${selectedFiles.length} Document(s)`}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </SectionCard>

    </div>
    </fieldset>
  );
});

export default hf;