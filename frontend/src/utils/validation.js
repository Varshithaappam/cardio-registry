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
 * 1. Reusable 'Gibberish/Spam' Validator
 * - Rejects strings with 5+ identical consecutive characters (e.g., 'aaaaa', '11111')
 * - Rejects 100% numeric strings for text descriptions
 */
export const validateSpamText = (value, isTextDescription = false) => {
  if (!value || typeof value !== 'string') return null;
  const str = value.trim();
  if (!str) return null;

  // Rule A: Reject 5 or more identical consecutive characters
  const repeatingCharRegex = /(.)\1{4,}/;
  if (repeatingCharRegex.test(str)) {
    return "Input contains invalid repeating characters (e.g., 'aaaaa' or '11111')";
  }

  // Rule B: Reject 100% numeric strings if field is a text description
  if (isTextDescription && /^\d+$/.test(str)) {
    return 'Text description cannot consist entirely of numbers';
  }

  return null;
};

/**
 * 2. Specific Field Length Constraints (HF, STEMI, NSTEMI)
 */
export const FIELD_CONSTRAINTS = {
  mrNo: { maxLength: 10, label: 'MR No' },
  ipNo: { maxLength: 10, label: 'IP No' },
  acsNo: { maxLength: 10, label: 'ACS No' },
  monthlyIncome: { maxLength: 15, label: 'Monthly Income' },
  caregiverName: { maxLength: 50, label: 'Caregiver Name' },
  relationship: { maxLength: 30, label: 'Relationship to Patient' },
  shortDetails: { maxLength: 255, label: 'Details / Reason' },
  clinicalNotes: { maxLength: 500, label: 'Clinical Details' }
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

  // Spam / Gibberish check first
  const isDescription = fieldName.toLowerCase().includes('notes') || fieldName.toLowerCase().includes('details') || fieldName.toLowerCase().includes('reason');
  const spamErr = validateSpamText(strVal, isDescription);
  if (spamErr) {
    return {
      isValid: false,
      error: spamErr,
      warning: null,
      status: 'Invalid',
      color: 'text-red-500 font-bold'
    };
  }

  // 1. Patient Profile & Admin Constraints (Max 10 for Medical IDs, Max 15 for Income, Max 50 for Caregiver Name, Max 30 for Relationship)
  const normField = String(fieldName || '').toLowerCase().replace(/[^a-z]/g, '');

  if (['mrno', 'ipno', 'acsno'].includes(normField)) {
    if (strVal.length > 10) {
      return {
        isValid: false,
        error: 'Max 10 characters allowed.',
        warning: null,
        status: 'Invalid',
        color: 'text-red-500 font-bold'
      };
    }
  }

  if (normField === 'uhid') {
    if (strVal.length > 30) {
      return {
        isValid: false,
        error: 'Max 30 characters allowed.',
        warning: null,
        status: 'Invalid',
        color: 'text-red-500 font-bold'
      };
    }
  }

  if ((normField.includes('income') || normField.includes('salary')) && strVal.length > 15) {
    return {
      isValid: false,
      error: 'Max 15 characters allowed.',
      warning: null,
      status: 'Invalid',
      color: 'text-red-500 font-bold'
    };
  }

  if (normField === 'caregivername' || normField === 'attendantname') {
    if (strVal.length > 50) {
      return { isValid: false, error: 'Max 50 characters allowed.', warning: null, status: 'Invalid', color: 'text-red-500 font-bold' };
    }
    const lettersRegex = /^[A-Za-z\s]+$/;
    if (!lettersRegex.test(strVal)) {
      return { isValid: false, error: 'Please enter valid text (letters only).', warning: null, status: 'Invalid', color: 'text-red-500 font-bold' };
    }
    return { isValid: true, error: null, warning: null, status: 'Normal', color: 'text-green-600 font-bold' };
  }

  if ((normField.includes('relationship') || normField === 'caregiverrel') && strVal.length > 30) {
    return { isValid: false, error: 'Max 30 characters allowed.', warning: null, status: 'Invalid', color: 'text-red-500 font-bold' };
  }

  if (fieldName === 'phone' || fieldName === 'caregiverPhone') {
    const phoneRegex = /^\d{10}$/;
    if (!phoneRegex.test(strVal)) {
      return { isValid: false, error: 'Please enter a valid 10-digit phone number.', warning: null, status: 'Invalid', color: 'text-red-500 font-bold' };
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
  if (isDraft) {
    return { isValid: true, errors: {}, missingFields: [] };
  }

  const errors = {};
  const isYes = (val) => val === true || val === 1 || val === '1' || val === 'Yes' || String(val).toLowerCase() === 'yes';

  if (formData.vUnableToWeigh !== 'Yes' && (!formData.vWeight || String(formData.vWeight).trim() === '')) {
    errors.vWeight = 'Weight is required unless unable to weigh is selected.';
  }

  const isValid = Object.keys(errors).length === 0;
  return { isValid, errors, missingFields: Object.values(errors) };
};
