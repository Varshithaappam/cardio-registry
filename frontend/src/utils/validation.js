/**
 * Validation Utility for CARE Registry Form fields & MS SQL Database Alignment
 */
import { formatDateForDatabase } from './dateUtils';

/**
 * Clinical Range Thresholds for Vitals Metrics
 */
export const VITALS_CLINICAL_RANGES = {
  weight: { min: 10, max: 400 },
  height: { min: 50, max: 250 },
  heartRate: { min: 10, max: 300 },
  rr: { min: 4, max: 60 },
  o2: { min: 0, max: 100 },
  sysBp: { min: 40, max: 300 },
  diaBp: { min: 20, max: 200 }
};

/**
 * Computes soft validation warning for vitals fields.
 * Returns exact warning string 'Not in clinical range' when entered value is outside clinical threshold.
 */
export const getVitalsWarning = (fieldName, value) => {
  if (value === undefined || value === null || String(value).trim() === '') {
    return null;
  }

  const num = Number(value);
  if (isNaN(num)) return null;

  const key = String(fieldName).toLowerCase().replace(/[^a-z0-9]/g, '');

  let range = null;
  if (key.includes('weight')) range = VITALS_CLINICAL_RANGES.weight;
  else if (key.includes('height')) range = VITALS_CLINICAL_RANGES.height;
  else if (key.includes('hr') || key.includes('heartrate') || key.includes('pulse')) range = VITALS_CLINICAL_RANGES.heartRate;
  else if (key.includes('rr') || key.includes('respiratoryrate')) range = VITALS_CLINICAL_RANGES.rr;
  else if (key.includes('o2') || key.includes('spo2') || key.includes('saturation')) range = VITALS_CLINICAL_RANGES.o2;
  else if (key.includes('sys') || key.includes('systolic')) range = VITALS_CLINICAL_RANGES.sysBp;
  else if (key.includes('dia') || key.includes('diastolic')) range = VITALS_CLINICAL_RANGES.diaBp;

  if (range && (num < range.min || num > range.max)) {
    return 'Not in clinical range';
  }

  return null;
};

export const validateField = (fieldName, value) => {
  if (value === undefined || value === null || String(value).trim() === '') {
    return { isValid: true, error: null, warning: null, status: null, color: null };
  }

  const strVal = String(value).trim();

  // 1. Patient Profile & Admin
  if (fieldName === 'name' || fieldName === 'caregiverName') {
    const lettersRegex = /^[A-Za-z\s]+$/;
    if (!lettersRegex.test(strVal)) {
      return {
        isValid: false,
        error: 'Please enter valid text (letters only).',
        warning: null,
        status: 'Invalid',
        color: 'text-red-500 font-bold'
      };
    }
    return { isValid: true, error: null, warning: null, status: 'Normal', color: 'text-green-600 font-bold' };
  }

  if (fieldName === 'phone' || fieldName === 'caregiverPhone') {
    const phoneRegex = /^\d{10}$/;
    if (!phoneRegex.test(strVal)) {
      return {
        isValid: false,
        error: 'Please enter a valid 10-digit phone number.',
        warning: null,
        status: 'Invalid',
        color: 'text-red-500 font-bold'
      };
    }
    return { isValid: true, error: null, warning: null, status: 'Normal', color: 'text-green-600 font-bold' };
  }

  if (fieldName === 'monthlyIncome') {
    if (!/^\d+$/.test(strVal)) {
      return {
        isValid: false,
        error: 'Please enter valid values like integers or numbers.',
        warning: null,
        status: 'Invalid',
        color: 'text-red-500 font-bold'
      };
    }
    return { isValid: true, error: null, warning: null, status: 'Normal', color: 'text-green-600 font-bold' };
  }

  // 2. Vitals & Metrics
  if (fieldName === 'weight' || fieldName === 'vWeight') {
    const num = parseFloat(strVal);
    if (isNaN(num)) {
      return {
        isValid: false,
        error: 'Please enter valid values like integers or numbers.',
        warning: null,
        status: 'Invalid',
        color: 'text-red-500 font-bold'
      };
    }
    return { isValid: true, error: null, warning: null, status: 'Normal', color: 'text-green-600 font-bold' };
  }

  if (fieldName === 'height' || fieldName === 'vHeight') {
    const num = parseFloat(strVal);
    if (isNaN(num)) {
      return {
        isValid: false,
        error: 'Please enter valid values like integers or numbers.',
        warning: null,
        status: 'Invalid',
        color: 'text-red-500 font-bold'
      };
    }
    return { isValid: true, error: null, warning: null, status: 'Normal', color: 'text-green-600 font-bold' };
  }

  if (fieldName === 'heartRate' || fieldName === 'vHeartRate') {
    const num = parseFloat(strVal);
    if (isNaN(num)) {
      return {
        isValid: false,
        error: 'Please enter valid values like integers or numbers.',
        warning: null,
        status: 'Invalid',
        color: 'text-red-500 font-bold'
      };
    }
    return { isValid: true, error: null, warning: null, status: 'Normal', color: 'text-green-600 font-bold' };
  }

  return { isValid: true, error: null, warning: null, status: null, color: null };
};

/**
 * Transforms form state payload into clean MS SQL-compatible DB payload:
 * - Converts empty strings to null
 * - Converts DD/MM/YYYY dates to YYYY-MM-DD for database persistence
 */
export const mapFormToDBPayload = (formData) => {
  if (formData === null || formData === undefined) return null;
  if (typeof formData !== 'object') {
    if (typeof formData === 'string') {
      const trimmed = formData.trim();
      if (trimmed === '') return null;
      if (/^\d{2}\/\d{2}\/\d{4}$/.test(trimmed)) {
        return formatDateForDatabase(trimmed);
      }
    }
    return formData;
  }

  if (Array.isArray(formData)) {
    return formData.map(item => mapFormToDBPayload(item));
  }

  const cleaned = {};
  for (const key of Object.keys(formData)) {
    const val = formData[key];
    if (val === '' || (typeof val === 'string' && val.trim() === '')) {
      cleaned[key] = null;
    } else if (typeof val === 'string' && /^\d{2}\/\d{2}\/\d{4}$/.test(val.trim())) {
      cleaned[key] = formatDateForDatabase(val.trim());
    } else if (typeof val === 'object' && val !== null && !(val instanceof Date)) {
      cleaned[key] = mapFormToDBPayload(val);
    } else {
      cleaned[key] = val;
    }
  }
  return cleaned;
};

/**
 * Validates Heart Failure Registry Form data conditionally matching MS SQL schema rules.
 */
export const validateHFForm = (formData = {}, isDraft = false) => {
  // Draft Mode bypasses mandatory validation completely
  if (isDraft) {
    return { isValid: true, errors: {}, missingFields: [] };
  }

  const errors = {};
  const isYes = (val) => val === true || val === 1 || val === '1' || val === 'Yes' || String(val).toLowerCase() === 'yes';

  // 1. Mandatory Vitals & Metrics if entered
  if (formData.vUnableToWeigh !== 'Yes' && (!formData.vWeight || String(formData.vWeight).trim() === '')) {
    errors.vWeight = 'Weight is required unless unable to weigh is selected.';
  }

  // 2. Conditional Medication Validation Rules
  const medDoseMappings = [
    { flag: 'carvedilol', dose: 'carvedilolDose', label: 'Carvedilol Dose' },
    { flag: 'bisoprolol', dose: 'bisoprololDose', label: 'Bisoprolol Dose' },
    { flag: 'metoprololSuccinate', dose: 'metoprololSuccinateDose', label: 'Metoprolol Succinate Dose' },
    { flag: 'nebivolol', dose: 'nebivololDose', label: 'Nebivolol Dose' },
    { flag: 'enalapril', dose: 'enalaprilDose', label: 'Enalapril Dose' },
    { flag: 'ramipril', dose: 'ramiprilDose', label: 'Ramipril Dose' },
    { flag: 'lisinopril', dose: 'lisinoprilDose', label: 'Lisinopril Dose' },
    { flag: 'perindopril', dose: 'perindoprilDose', label: 'Perindopril Dose' },
    { flag: 'valsartan', dose: 'valsartanDose', label: 'Valsartan Dose' },
    { flag: 'losartan', dose: 'losartanDose', label: 'Losartan Dose' },
    { flag: 'telmisartan', dose: 'telmisartanDose', label: 'Telmisartan Dose' },
    { flag: 'olmesartan', dose: 'olmesartanDose', label: 'Olmesartan Dose' },
    { flag: 'spironolactone', dose: 'spironolactoneDose', label: 'Spironolactone Dose' },
    { flag: 'eplerenone', dose: 'eplerenoneDose', label: 'Eplerenone Dose' }
  ];

  medDoseMappings.forEach(({ flag, dose, label }) => {
    if (isYes(formData[flag]) && (!formData[dose] || String(formData[dose]).trim() === '')) {
      errors[dose] = `${label} is required when ${flag} is prescribed.`;
    }
  });

  // 3. Conditional Lab Validation Rules
  const labTests = formData.labTests || {};
  const labKeys = ['calcium', 'glucose', 'hba1c', 'magnesium', 't3', 't4', 'potassium', 'creatinine', 'sodium', 'tsh', 'ldl', 'inr', 'st2'];
  
  labKeys.forEach((key) => {
    const test = labTests[key] || {};
    const resVal = test.result ?? formData[`${key}_result`] ?? formData[key];
    const dateVal = test.date ?? formData[`${key}_date`] ?? formData[`${key}Date`];

    if (resVal && String(resVal).trim() !== '' && (!dateVal || String(dateVal).trim() === '')) {
      errors[`${key}_date`] = `${key.toUpperCase()} Test Date is required when result value is entered.`;
    }
  });

  // 4. MACE Conditional Validation Rules
  if (isYes(formData.maceDeath) || isYes(formData.mace_death)) {
    const deathDate = formData.maceDeathDate || formData.death_date;
    if (!deathDate || String(deathDate).trim() === '') {
      errors.maceDeathDate = 'MACE Death Date is required when MACE Death is checked.';
    }
  }

  const isValid = Object.keys(errors).length === 0;
  return {
    isValid,
    errors,
    missingFields: Object.values(errors)
  };
};
