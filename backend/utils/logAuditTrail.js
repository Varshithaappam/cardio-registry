const db = require('../config/db');

/**
 * Normalizes values for strict data comparison.
 * Treats null, undefined, "", "null", "undefined" as equal (empty string "").
 */
function normalizeVal(val) {
  if (val === null || val === undefined) return '';
  if (val instanceof Date) {
    const year = val.getUTCFullYear();
    const month = String(val.getUTCMonth() + 1).padStart(2, '0');
    const day = String(val.getUTCDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
  let s = String(val).trim();
  if (s === 'null' || s === 'undefined' || s === '') return '';

  // ISO date strings e.g., "2026-09-15T00:00:00.000Z" -> "2026-09-15"
  if (/^\d{4}-\d{2}-\d{2}T/.test(s)) {
    s = s.split('T')[0];
  }

  // Numbers e.g. "120.00" -> "120", "3.50" -> "3.5"
  if (!isNaN(s) && s !== '') {
    const num = Number(s);
    if (!isNaN(num)) return String(num);
  }

  // Boolean / string Yes/No/Unknown normalizations
  const lower = s.toLowerCase();
  if (['no', 'false', '0'].includes(lower)) return 'No';
  if (['yes', 'true', '1'].includes(lower)) return 'Yes';
  if (['unknown'].includes(lower)) return 'Unknown';

  return s;
}

/**
 * Deeply compares oldData (DB) vs newData (req.body) for UPDATE actions.
 * ONLY includes keys present in oldObj where the normalized value has strictly changed.
 */
function getChangedFields(oldObj, newObj) {
  if (!oldObj || !newObj) return [];
  const changes = [];

  // Ignore Metadata & Internal keys
  const excludedKeys = new Set([
    'id', 'created_at', 'updated_at', 'patient_id', 'reg_patient_id',
    'is_deleted', 'deleted_at', 'deleted_by', 'status', 'created_by', 'updated_by',
    'stemi_id', 'nstemi_id', 'hf_id', 'acs_no', 'ip_no', 'hf_registry_no',
    'followup', 'appropriateness', 'stemi_appropriateness', 'nstemi_appropriateness',
    'appropriateness_id'
  ]);

  const fieldLabelMap = {
    weight: 'Weight (kg)',
    weight_kg: 'Weight (kg)',
    height: 'Height (cm)',
    height_cm: 'Height (cm)',
    pulse_rate: 'Pulse Rate (bpm)',
    sbp: 'SBP (mmHg)',
    systolic_bp: 'SBP (mmHg)',
    dbp: 'DBP (mmHg)',
    diastolic_bp: 'DBP (mmHg)',
    ef: 'Ejection Fraction (%)',
    echo_ef: 'EF (%)',
    primary_diagnosis: 'Primary Diagnosis',
    primary_consultant: 'Primary Consultant',
    discharge_status: 'Discharge Status',
    nyha_class: 'NYHA Class',
    stent_type: 'Stent Type',
    heparin_strategy: 'Heparin Strategy',
    thrombolysis_dose: 'Thrombolysis Dose',
    troponin_i: 'Trop-I',
    creatinine: 'Creatinine (mg/dl)',
    hemoglobin: 'Hemoglobin (gm%)',
    hypertension: 'Hypertension',
    diabetes: 'Diabetes',
    smoking: 'Smoking',
    renal_failure: 'Renal Failure',
    copd: 'COPD',
    cva: 'CVA',
    prior_acs: 'Prior ACS',
    prior_ptca: 'Prior PTCA',
    prior_cabg: 'Prior CABG',
    admission_date: 'Admission Date',
    discharge_date: 'Discharge Date'
  };

  const formatFieldLabel = (key) => {
    const lowerKey = key.toLowerCase();
    if (fieldLabelMap[lowerKey]) return fieldLabelMap[lowerKey];
    return key
      .replace(/^appr_/, '')
      .replace(/([A-Z])/g, ' $1')
      .replace(/_/g, ' ')
      .trim()
      .replace(/\b\w/g, c => c.toUpperCase());
  };

  // Iterate through keys of incoming newData (from req.body)
  for (const key of Object.keys(newObj)) {
    if (excludedKeys.has(key.toLowerCase()) || key.startsWith('appr_')) {
      continue;
    }

    const newVal = newObj[key];
    if (typeof newVal === 'object' && newVal !== null) {
      continue; // Skip nested objects/arrays
    }

    // Find matching key in oldObj (case-insensitive)
    let matchedOldKey = Object.keys(oldObj).find(k => k.toLowerCase() === key.toLowerCase());
    if (!matchedOldKey) {
      continue; // Skip fields not present in existing DB record
    }

    const prevVal = oldObj[matchedOldKey];

    // Edge Case Handling: Normalize null, "", undefined, numbers, dates, booleans
    const normPrev = normalizeVal(prevVal);
    const normNew = normalizeVal(newVal);

    // Treat null (DB) and "" (frontend empty string) as equal
    if (normPrev === normNew) {
      continue;
    }

    // Ignore transitions from null/empty to default form values (e.g. "" to "No" or "" to "Unknown")
    if (normPrev === '' && (normNew === 'No' || normNew === 'Unknown')) {
      continue;
    }

    // Push object ONLY if values are strictly different
    changes.push({
      field: formatFieldLabel(key),
      previous: prevVal !== null && prevVal !== undefined && normPrev !== '' ? prevVal : '—',
      new: newVal !== null && newVal !== undefined && normNew !== '' ? newVal : '—'
    });
  }

  return changes;
}

/**
 * Reusable Express Audit Logger Utility
 * Writes immutable action record into system_audit_log table
 *
 * @param {Object} req - Express request object (containing req.user)
 * @param {string} actionType - 'CREATE' | 'UPDATE' | 'DELETE'
 * @param {string} registryType - 'HF' | 'STEMI' | 'NSTEMI'
 * @param {string|number} recordIdentifier - HF ID for HF, or IP No for STEMI/NSTEMI
 * @param {number} patientId - Associated Patient DB Primary Key ID
 * @param {Object} [oldData=null] - Object state before mutation
 * @param {Object} [newData=null] - Object state after mutation
 */
async function logAuditTrail(req, actionType, registryType, recordIdentifier, patientId, oldData = null, newData = null) {
  try {
    // Extract logged-in user from req.user
    const username = req?.user?.username || req?.user?.name || req?.user?.email || req?.user?.user_id || 'Dr. Alex V.';
    const normalizedAction = String(actionType).toUpperCase();
    const normalizedRegistry = String(registryType).toUpperCase();
    const normalizedRecordId = String(recordIdentifier);

    let changedFieldsJSON = null;

    if (normalizedAction === 'UPDATE' && oldData && newData) {
      const changedArray = getChangedFields(oldData, newData);
      changedFieldsJSON = JSON.stringify(changedArray);
    }

    const prevJSON = oldData ? JSON.stringify(oldData) : null;
    const newJSON = newData ? JSON.stringify(newData) : null;

    const query = `
      INSERT INTO [system_audit_log] 
        ([registry_type], [record_identifier], [record_id], [patient_id], [user_id], [action_type], [changed_fields], [previous_values], [new_values], [timestamp])
      VALUES 
        (@registryType, @recordIdentifier, @recordIdentifier, @patientId, @username, @actionType, @changedFields, @previousValues, @newValues, SYSDATETIME());
    `;

    await db.query(query, {
      registryType: normalizedRegistry,
      recordIdentifier: normalizedRecordId,
      patientId: patientId ? Number(patientId) : null,
      username: String(username),
      actionType: normalizedAction,
      changedFields: changedFieldsJSON,
      previousValues: prevJSON,
      newValues: newJSON
    });
  } catch (error) {
    console.error('[logAuditTrail] Error logging audit event:', error.message);
  }
}

module.exports = { logAuditTrail, getChangedFields };



