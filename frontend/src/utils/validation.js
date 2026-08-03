/**
 * Validation Utility for CARE Registry Form fields & MS SQL Database Alignment
 */
import { formatDateForDatabase } from './dateUtils';

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
  if (fieldName === 'weight') {
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
    if (num < 20.0 || num > 300.0) {
      return {
        isValid: false,
        error: 'Please enter a realistic weight between 20kg and 300kg.',
        warning: null,
        status: 'Invalid',
        color: 'text-red-500 font-bold'
      };
    }
    return { isValid: true, error: null, warning: null, status: 'Normal', color: 'text-green-600 font-bold' };
  }

  if (fieldName === 'height') {
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
    if (num < 50.0 || num > 250.0) {
      return {
        isValid: false,
        error: 'Please enter a realistic height between 50cm and 250cm.',
        warning: null,
        status: 'Invalid',
        color: 'text-red-500 font-bold'
      };
    }
    return { isValid: true, error: null, warning: null, status: 'Normal', color: 'text-green-600 font-bold' };
  }

  if (fieldName === 'heartRate') {
    const num = parseInt(strVal, 10);
    if (isNaN(num) || !/^\d+$/.test(strVal)) {
      return {
        isValid: false,
        error: 'Please enter valid values like integers or numbers.',
        warning: null,
        status: 'Invalid',
        color: 'text-red-500 font-bold'
      };
    }
    if (num < 30 || num > 250) {
      return {
        isValid: false,
        error: 'Please enter a realistic Heart Rate between 30 and 250.',
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

  // Biomarker Check: Allow EITHER BNP OR NT-proBNP (result + date)
  const bnpTest = labTests.bnp || {};
  const bnpRes = bnpTest.result ?? formData.bnp_result ?? formData.bnpResult;
  const bnpDt = bnpTest.date ?? formData.bnp_date ?? formData.bnpDate;
  const hasBnp = bnpRes && String(bnpRes).trim() !== '' && bnpDt && String(bnpDt).trim() !== '';

  const ntProBnpTest = labTests.ntProBnp || labTests.nt_pro_bnp || {};
  const ntRes = ntProBnpTest.result ?? formData.nt_pro_bnp_result ?? formData.ntProBnpResult;
  const ntDt = ntProBnpTest.date ?? formData.nt_pro_bnp_date ?? formData.ntProBnpDate;
  const hasNtProBnp = ntRes && String(ntRes).trim() !== '' && ntDt && String(ntDt).trim() !== '';

  if (!hasBnp && !hasNtProBnp) {
    errors.biomarker = 'Either BNP OR NT-proBNP (Result and Date) is required.';
  }

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
