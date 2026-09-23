/**
 * Global Error Mapping Utility for CARE Health System
 * Sanitizes technical errors (SQL exceptions, unique index constraints, stack traces, null-pointer errors)
 * into clear, professional, clinical-friendly user messages with field-level targeting.
 */

/**
 * Detects specific form field key and human-friendly field name from error text
 */
export function detectFieldFromError(str) {
  if (!str) return null;
  const lower = String(str).toLowerCase();

  if (lower.includes('acs_no') || lower.includes('acsno') || lower.includes('acs_number') || lower.includes('acs registry')) {
    return { targetField: 'acs_no', targetFieldName: 'ACS No / Registry No' };
  }
  if (lower.includes('mr_no') || lower.includes('mrno') || lower.includes('mr_number') || lower.includes('medical record')) {
    return { targetField: 'mr_no', targetFieldName: 'MR No.' };
  }
  if (lower.includes('hf_registry_no') || lower.includes('hf_no') || lower.includes('hfno')) {
    return { targetField: 'hf_registry_no', targetFieldName: 'HF Registry No.' };
  }
  if (lower.includes('phone') || lower.includes('mobile') || lower.includes('contact_no')) {
    return { targetField: 'phone_number', targetFieldName: 'Phone Number' };
  }
  if (lower.includes('patient_id') || lower.includes('patientid')) {
    return { targetField: 'patient_id', targetFieldName: 'Patient ID' };
  }
  if (lower.includes('admission_date') || lower.includes('date_of_admission')) {
    return { targetField: 'admission_date', targetFieldName: 'Date of Admission' };
  }
  if (lower.includes('discharge_date') || lower.includes('date_of_discharge')) {
    return { targetField: 'discharge_date', targetFieldName: 'Date of Discharge' };
  }
  if (lower.includes('dob') || lower.includes('date_of_birth')) {
    return { targetField: 'dob', targetFieldName: 'Date of Birth' };
  }
  if (lower.includes('weight') || lower.includes('v_weight')) {
    return { targetField: 'v_weight', targetFieldName: 'Weight' };
  }
  if (lower.includes('height') || lower.includes('v_height')) {
    return { targetField: 'v_height', targetFieldName: 'Height' };
  }
  if (lower.includes('hr') || lower.includes('v_hr') || lower.includes('heart_rate') || lower.includes('heart rate')) {
    return { targetField: 'v_hr', targetFieldName: 'Heart Rate' };
  }
  if (lower.includes('rr') || lower.includes('v_rr') || lower.includes('respiratory')) {
    return { targetField: 'v_rr', targetFieldName: 'Respiratory Rate' };
  }
  if (lower.includes('o2') || lower.includes('v_o2') || lower.includes('oxygen') || lower.includes('spo2')) {
    return { targetField: 'v_o2', targetFieldName: 'O2 Saturation' };
  }
  if (lower.includes('sys_bp') || lower.includes('systolic') || lower.includes('sbp')) {
    return { targetField: 'v_sys_bp', targetFieldName: 'Systolic BP' };
  }
  if (lower.includes('dia_bp') || lower.includes('diastolic') || lower.includes('dbp')) {
    return { targetField: 'v_dia_bp', targetFieldName: 'Diastolic BP' };
  }

  return null;
}

/**
 * Maps raw backend errors, status codes, and exception objects to friendly user messages.
 * @param {Error|Object|string} error Raw error object or string from API or exception
 * @param {string} fallbackAction Context action description (e.g. 'save changes')
 * @returns {{ title: string, message: string, type: 'danger' | 'warning' | 'info', targetField?: string }}
 */
export function getFriendlyErrorMessage(error, fallbackAction = 'save changes') {
  // Extract raw message string from various possible error formats
  let rawMsg = '';
  let status = null;

  if (typeof error === 'string') {
    rawMsg = error;
  } else if (error && typeof error === 'object') {
    status = error.response?.status || error.status || null;
    rawMsg =
      error.response?.data?.message ||
      error.response?.data?.error ||
      error.message ||
      JSON.stringify(error);
  }

  const str = String(rawMsg || '').trim();
  const lower = str.toLowerCase();
  const fieldInfo = detectFieldFromError(str);

  // 1. Duplicate Key / Unique Constraint Errors
  // Catches SQL Server error 2627 / 2601, unique index violations (UX_* / PK_*), duplicate entry strings
  const isDuplicate =
    lower.includes('2627') ||
    lower.includes('2601') ||
    lower.includes('duplicate key') ||
    lower.includes('unique index') ||
    lower.includes('unique constraint') ||
    lower.includes('ux_') ||
    lower.includes('pk_') ||
    lower.includes('already exists') ||
    status === 409;

  if (isDuplicate) {
    const fieldLabel = fieldInfo?.targetFieldName || 'identifier (e.g., ACS No / MR No)';
    return {
      title: 'Duplicate Record Identifier',
      message: `A record with this ${fieldLabel} already exists. Please verify the entry.`,
      type: 'warning',
      targetField: fieldInfo?.targetField || 'acs_no' // Fallback to acs_no for registry forms
    };
  }

  // 1.5. Arithmetic / Numeric Overflow / Huge Number Errors
  const isOverflow =
    lower.includes('arithmetic overflow') ||
    lower.includes('numeric overflow') ||
    lower.includes('overflow converting') ||
    lower.includes('out of range') ||
    lower.includes('too large') ||
    lower.includes('too huge') ||
    lower.includes('exceeds maximum') ||
    lower.includes('overflow');

  if (isOverflow) {
    const fieldLabel = fieldInfo?.targetFieldName ? `'${fieldInfo.targetFieldName}'` : 'the numerical field';
    return {
      title: 'Value Exceeds Allowed Limit',
      message: `The entered number for ${fieldLabel} is too huge. Please verify the entry and enter a valid number within the permitted range.`,
      type: 'warning',
      targetField: fieldInfo?.targetField || null
    };
  }

  // 2. Validation / Required Fields Errors
  const isValidation =
    status === 400 ||
    status === 422 ||
    lower.includes('validation') ||
    lower.includes('required field') ||
    lower.includes('cannot be null') ||
    lower.includes('invalid field') ||
    lower.includes('please provide');

  if (isValidation) {
    let cleanMessage = fieldInfo?.targetFieldName
      ? `Please check the '${fieldInfo.targetFieldName}' field and enter a valid value.`
      : 'Please verify that all required fields are filled out correctly and try again.';
    if (str && !isTechnicalString(str) && str.length < 150) {
      cleanMessage = str;
    }
    return {
      title: 'Validation Action Required',
      message: cleanMessage,
      type: 'warning',
      targetField: fieldInfo?.targetField || null
    };
  }

  // 3. Server / Network / Connection Failures (500 series or network drops)
  const isServerNetworkError =
    (status >= 500 && status < 600) ||
    lower.includes('network error') ||
    lower.includes('econnrefused') ||
    lower.includes('etimedout') ||
    lower.includes('timeout') ||
    lower.includes('failed to fetch') ||
    status === 0;

  if (isServerNetworkError) {
    return {
      title: 'Service Temporarily Unavailable',
      message: `Unable to ${fallbackAction} right now. Please check your connection or try again.`,
      type: 'danger',
      targetField: null
    };
  }

  // 4. Authorization / Permission Errors
  if (status === 401 || status === 403 || lower.includes('unauthorized') || lower.includes('forbidden')) {
    return {
      title: 'Access Restricted',
      message: 'Your session has expired or you do not have permission for this operation. Please log in again.',
      type: 'warning',
      targetField: null
    };
  }

  // 5. General Fallback for Raw Technical Strings (SQL syntax, null-pointer, stack traces, schema details)
  if (isTechnicalString(str)) {
    return {
      title: 'Operation Could Not Be Completed',
      message: `Unable to ${fallbackAction} right now. Please verify your data entry or try again later.`,
      type: 'danger',
      targetField: fieldInfo?.targetField || null
    };
  }

  // 6. Clean Non-Technical Message Fallback
  return {
    title: 'Notice',
    message: str && str.length < 200 ? str : `Unable to ${fallbackAction} right now. Please try again.`,
    type: 'danger',
    targetField: fieldInfo?.targetField || null
  };
}

/**
 * Checks if a string contains raw technical database/code jargon (SQL, database schemas, object names)
 */
function isTechnicalString(str) {
  if (!str) return false;
  const lower = str.toLowerCase();
  return (
    lower.includes('dbo.') ||
    lower.includes('sql server') ||
    lower.includes('syntax error') ||
    lower.includes('foreign key') ||
    lower.includes('null pointer') ||
    lower.includes('referenceerror') ||
    lower.includes('typeerror') ||
    lower.includes('stack trace') ||
    lower.includes('at ') && lower.includes('.js') ||
    lower.includes('cannot insert') ||
    lower.includes('statement terminated') ||
    lower.includes('select ') ||
    lower.includes('insert into') ||
    lower.includes('update ')
  );
}

export default getFriendlyErrorMessage;
