/**
 * Validation Utility for CARE Registry Form fields
 */

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
    if (num < 60) {
      return {
        isValid: true,
        error: null,
        warning: 'Heart Rate is Low (Bradycardia).',
        status: 'Low (Bradycardia)',
        color: 'text-red-500 font-bold'
      };
    }
    if (num > 100) {
      return {
        isValid: true,
        error: null,
        warning: 'Heart Rate is High (Tachycardia).',
        status: 'High (Tachycardia)',
        color: 'text-red-500 font-bold'
      };
    }
    return { isValid: true, error: null, warning: null, status: 'Normal', color: 'text-green-600 font-bold' };
  }

  if (fieldName === 'systolicBp') {
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
    if (num < 60 || num > 260) {
      return {
        isValid: false,
        error: 'Please enter a realistic Systolic BP between 60 and 260.',
        warning: null,
        status: 'Invalid',
        color: 'text-red-500 font-bold'
      };
    }
    if (num < 90) {
      return {
        isValid: true,
        error: null,
        warning: 'Systolic BP is Low.',
        status: 'Low',
        color: 'text-red-500 font-bold'
      };
    }
    if (num > 140) {
      return {
        isValid: true,
        error: null,
        warning: 'Systolic BP is High.',
        status: 'High',
        color: 'text-red-500 font-bold'
      };
    }
    return { isValid: true, error: null, warning: null, status: 'Normal', color: 'text-green-600 font-bold' };
  }

  if (fieldName === 'diastolicBp') {
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
    if (num < 40 || num > 150) {
      return {
        isValid: false,
        error: 'Please enter a realistic Diastolic BP between 40 and 150.',
        warning: null,
        status: 'Invalid',
        color: 'text-red-500 font-bold'
      };
    }
    return { isValid: true, error: null, warning: null, status: 'Normal', color: 'text-green-600 font-bold' };
  }

  if (fieldName === 'o2Saturation') {
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
    if (num < 50 || num > 100) {
      return {
        isValid: false,
        error: 'Please enter a realistic O₂ Saturation between 50 and 100.',
        warning: null,
        status: 'Invalid',
        color: 'text-red-500 font-bold'
      };
    }
    if (num < 90) {
      return {
        isValid: true,
        error: null,
        warning: 'O₂ Saturation is Critical.',
        status: 'Critical',
        color: 'text-red-500 font-bold'
      };
    }
    if (num >= 95) {
      return { isValid: true, error: null, warning: null, status: 'Normal', color: 'text-green-600 font-bold' };
    }
    return {
      isValid: true,
      error: null,
      warning: 'O₂ Saturation is Low.',
      status: 'Low',
      color: 'text-yellow-600 font-bold'
    };
  }

  // 3. Medical Therapy (Doses)
  if (fieldName.endsWith('Dose') || fieldName.endsWith('dose') || fieldName === 'dose') {
    const doseRegex = /^\d+(\.\d+)?$/;
    if (!doseRegex.test(strVal)) {
      return {
        isValid: false,
        error: 'Please enter valid values like integers or numbers for the drug dose.',
        warning: null,
        status: 'Invalid',
        color: 'text-red-500 font-bold'
      };
    }
    const num = parseFloat(strVal);
    if (num < 10.0 || num > 200.0) {
      return {
        isValid: true,
        error: null,
        warning: 'Dose is outside standard expected range. Please verify.',
        status: 'Abnormal',
        color: 'text-yellow-600 font-bold'
      };
    }
    return { isValid: true, error: null, warning: null, status: 'Normal', color: 'text-green-600 font-bold' };
  }

  // 4. Lab Tests & Imaging
  if (fieldName === 'echoEfPercent') {
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
    if (num < 1 || num > 100) {
      return {
        isValid: false,
        error: 'Please enter a valid EF% between 1% and 100%.',
        warning: null,
        status: 'Invalid',
        color: 'text-red-500 font-bold'
      };
    }
    return { isValid: true, error: null, warning: null, status: 'Normal', color: 'text-green-600 font-bold' };
  }

  if (fieldName === 'potassium') {
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
    if (num < 1.0 || num > 10.0) {
      return {
        isValid: false,
        error: 'Please enter a valid Potassium level between 1.0 and 10.0 mmol/L.',
        warning: null,
        status: 'Invalid',
        color: 'text-red-500 font-bold'
      };
    }
    if (num < 3.5) {
      return {
        isValid: true,
        error: null,
        warning: 'Potassium is Low.',
        status: 'Low',
        color: 'text-red-500 font-bold'
      };
    }
    if (num > 5.0) {
      return {
        isValid: true,
        error: null,
        warning: 'Potassium is High.',
        status: 'High',
        color: 'text-red-500 font-bold'
      };
    }
    return { isValid: true, error: null, warning: null, status: 'Normal', color: 'text-green-600 font-bold' };
  }

  if (fieldName === 'creatinine') {
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
    if (num < 0.1 || num > 15.0) {
      return {
        isValid: false,
        error: 'Please enter a valid Creatinine level between 0.1 and 15.0 mg/dL.',
        warning: null,
        status: 'Invalid',
        color: 'text-red-500 font-bold'
      };
    }
    return { isValid: true, error: null, warning: null, status: 'Normal', color: 'text-green-600 font-bold' };
  }

  return { isValid: true, error: null, warning: null, status: null, color: null };
};
