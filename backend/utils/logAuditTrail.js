const db = require('../config/db');

const INTERNAL_AUDIT_KEYS = new Set(['_req', '_requser']);

/**
 * Strips internal/non-serializable keys (e.g. Express req) before audit persistence.
 */
function sanitizeAuditPayload(obj) {
  if (obj === null || obj === undefined) return obj;
  if (typeof obj !== 'object') return obj;
  if (obj instanceof Date) return obj;

  if (Array.isArray(obj)) {
    return obj.map((item) => sanitizeAuditPayload(item));
  }

  const cleaned = {};
  for (const [key, value] of Object.entries(obj)) {
    if (INTERNAL_AUDIT_KEYS.has(key)) continue;
    cleaned[key] = sanitizeAuditPayload(value);
  }
  return cleaned;
}

/**
 * Formats Date objects and ISO date strings to YYYY-MM-DD for comparison.
 */
function normalizeDateValue(val) {
  if (val instanceof Date && !isNaN(val.getTime())) {
    return val.toISOString().split('T')[0];
  }

  if (typeof val === 'string') {
    const trimmed = val.trim();
    if (/^\d{4}-\d{2}-\d{2}T/.test(trimmed)) {
      return trimmed.split('T')[0];
    }
    if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
      return trimmed;
    }
  }

  return null;
}

/**
 * Normalizes values for strict data comparison.
 * Treats null, undefined, "", "null", "undefined" as equal (empty string "").
 */
function normalizeVal(val) {
  if (val === null || val === undefined) return '';

  const normalizedDate = normalizeDateValue(val);
  if (normalizedDate) return normalizedDate;

  let rawStr = String(val).trim();
  if (rawStr === 'null' || rawStr === 'undefined' || rawStr === '') return '';

  // ISO date strings e.g., "2026-09-15T00:00:00.000Z" -> "2026-09-15"
  if (/^\d{4}-\d{2}-\d{2}T/.test(rawStr)) {
    rawStr = rawStr.split('T')[0];
  }

  const lower = rawStr.toLowerCase();

  // Boolean / string Yes/No/0/1/Unknown normalizations evaluated BEFORE raw number formatting
  if (['no', 'false', '0'].includes(lower)) return 'No';
  if (['yes', 'true', '1'].includes(lower)) return 'Yes';
  if (['unknown'].includes(lower)) return 'Unknown';
  if (['referred from (department / practice)', 'referred from (department/practice)', 'referred from'].includes(lower)) return '';

  // 1. AV Block Semantic Equivalences
  if (['first degree', '1st degree', '1-degree', '1 degree', '1st-degree'].includes(lower)) return '1st Degree AV Block';
  if (['second degree', '2nd degree', '2-degree', '2 degree', '2nd-degree', 'mobitz type i', 'mobitz type ii', '2nd degree mobitz type 1', '2nd degree mobitz type 2'].includes(lower)) return '2nd Degree AV Block';
  if (['third degree', '3rd degree', 'complete heart block', 'chb', '3-degree', '3 degree', '3rd-degree'].includes(lower)) return 'Complete Heart Block (3rd Degree)';
  if (['none', 'no av block', 'nil'].includes(lower)) return 'None';

  // 2. ECG Rhythm Semantic Equivalences
  if (['sinus', 'sinus rhythm', 'nsr', 'normal sinus rhythm'].includes(lower)) return 'Sinus Rhythm';
  if (['af', 'afib', 'atrial fibrillation', 'atrial fibrillation (af)'].includes(lower)) return 'Atrial Fibrillation';
  if (['svt', 'supraventricular tachycardia', 'supraventricular tachycardia (svt)'].includes(lower)) return 'Supraventricular Tachycardia';
  if (['vt', 'ventricular tachycardia', 'ventricular tachycardia (vt)'].includes(lower)) return 'Ventricular Tachycardia';
  if (['vf', 'ventricular fibrillation', 'ventricular fibrillation (vf)'].includes(lower)) return 'Ventricular Fibrillation';

  // 3. Killip Class Semantic Equivalences
  if (['class i', 'class 1', 'killip 1', 'killip i', 'killip class i', 'killip class 1'].includes(lower)) return 'Killip Class I';
  if (['class ii', 'class 2', 'killip 2', 'killip ii', 'killip class ii', 'killip class 2'].includes(lower)) return 'Killip Class II';
  if (['class iii', 'class 3', 'killip 3', 'killip iii', 'killip class iii', 'killip class 3'].includes(lower)) return 'Killip Class III';
  if (['class iv', 'class 4', 'killip 4', 'killip iv', 'killip class iv', 'killip class 4'].includes(lower)) return 'Killip Class IV';

  // 4. TIMI Risk Semantic Equivalences
  if (['low', 'low risk'].includes(lower)) return 'Low Risk';
  if (['intermediate', 'intermediate risk', 'medium', 'medium risk'].includes(lower)) return 'Intermediate Risk';
  if (['high', 'high risk'].includes(lower)) return 'High Risk';

  // Numbers e.g. "120.00" -> "120", "3.50" -> "3.5"
  if (!isNaN(rawStr) && rawStr !== '') {
    const num = Number(rawStr);
    if (!isNaN(num)) return String(num);
  }

  return rawStr;
}

const FIELD_LABEL_MAP = {
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
  discharge_date: 'Discharge Date',
  assessmentdate: 'Assessment Date',
  visit_date: 'Visit Date',
  visitdate: 'Visit Date',
  age_gt_75: 'Age > 75',
  timi_total_score: 'TIMI Total Score',
  av_block: 'AV Block',
  bbb: 'BBB',
  rhythm: 'ECG Rhythm',
  ecg_rhythm: 'ECG Rhythm',
  lv_function: 'LV Function',
  mr: 'MR',
  treatment_strategy: 'Treatment Strategy',
  statin_dose: 'Statin Dose',
  discharge_statin_dose: 'Discharge Statin Dose',
  discharge_beta_blocker: 'Discharge Beta Blocker',
  discharge_calcium_channel_blocker: 'Calcium Channel Blocker',
  discharge_nitrate: 'Nitrate',
  discharge_nicorandil: 'Nicorandil',
  discharge_ivabradine: 'Ivabradine',
  discharge_ranolazine: 'Ranolazine',
  discharge_trimetazidine: 'Trimetazidine',
  discharge_aspirin: 'Discharge Aspirin',
  discharge_clopidogrel: 'Clopidogrel',
  discharge_prasugrel: 'Prasugrel',
  discharge_ticagrelor: 'Discharge Ticagrelor',
  discharge_statin: 'Discharge Statin',
  discharge_gp2b3a: 'Gp2b3a',
  discharge_bivaluridin: 'Bivaluridin',
  gp2b3a: 'Gp2b3a',
  bivaluridin: 'Bivaluridin'
};

function formatFieldLabel(key) {
  if (!key) return '';
  const leaf = String(key).split('.').pop();
  const lowerLeaf = leaf.toLowerCase();
  if (FIELD_LABEL_MAP[lowerLeaf]) return FIELD_LABEL_MAP[lowerLeaf];
  return leaf
    .replace(/^appr_/, '')
    .replace(/([A-Z])/g, ' $1')
    .replace(/_/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\b\w/g, c => c.toUpperCase());
}

/**
 * Maps raw constituent boolean database flags (e.g. av_block_none: 'Yes', rhythm_nsr: 'Yes', pami: 'Yes')
 * into canonical group fields (av_block: 'None', rhythm: 'NSR', treatment_strategy: 'PAMI') so diffing
 * against incoming grouped frontend payload strings does not produce ghost updates.
 */
function resolveCanonicalObject(obj) {
  if (!obj || typeof obj !== 'object') return {};
  const flat = { ...obj };

  // 1. AV Block
  if (!flat.av_block) {
    if (flat.av_block_chb === 'Yes') flat.av_block = 'CHB';
    else if (flat.av_block_second_degree === 'Yes') flat.av_block = 'Second Degree';
    else if (flat.av_block_first_degree === 'Yes') flat.av_block = 'First Degree';
    else if (flat.av_block_none === 'Yes') flat.av_block = 'None';
  }

  // 2. BBB
  if (!flat.bbb) {
    if (flat.bbb_lbbb === 'Yes') flat.bbb = 'LBBB';
    else if (flat.bbb_rbbb === 'Yes') flat.bbb = 'RBBB';
    else if (flat.bbb_indeterminate === 'Yes') flat.bbb = 'Indeterminate';
    else if (flat.bbb_none === 'Yes') flat.bbb = 'None';
  }

  // 3. Rhythm
  let rhythmVal = flat.rhythm || flat.ecg_rhythm;
  if (!rhythmVal) {
    if (flat.rhythm_af === 'Yes') rhythmVal = 'AF';
    else if (flat.rhythm_svt === 'Yes') rhythmVal = 'SVT';
    else if (flat.rhythm_vt === 'Yes') rhythmVal = 'VT';
    else if (flat.rhythm_vf === 'Yes') rhythmVal = 'VF';
    else if (flat.rhythm_nsr === 'Yes') rhythmVal = 'NSR';
  }
  if (rhythmVal) {
    flat.rhythm = rhythmVal;
    flat.ecg_rhythm = rhythmVal;
  }

  // 4. LV Function (check specific abnormal values first before normal)
  if (!flat.lv_function) {
    if (flat.lv_function_severe_lvd === 'Yes') flat.lv_function = 'Severe LVD';
    else if (flat.lv_function_moderate_lvd === 'Yes') flat.lv_function = 'Moderate LVD';
    else if (flat.lv_function_mild_lvd === 'Yes') flat.lv_function = 'Mild LVD';
    else if (flat.lv_function_normal === 'Yes') flat.lv_function = 'Normal';
  }

  // 5. MR (check specific abnormal values first before none)
  let mrVal = flat.mr || flat.mr_grade;
  if (!mrVal) {
    if (flat.mr_severe === 'Yes') mrVal = 'Severe';
    else if (flat.mr_moderate === 'Yes') mrVal = 'Moderate';
    else if (flat.mr_mild === 'Yes') mrVal = 'Mild';
    else if (flat.mr_none === 'Yes') mrVal = 'None';
  }
  if (mrVal) {
    flat.mr = mrVal;
    flat.mr_grade = mrVal;
  }

  // 6. Treatment Strategy
  if (!flat.treatment_strategy) {
    if (flat.pami === 'Yes') flat.treatment_strategy = 'PAMI';
    else if (flat.thrombolysis === 'Yes') flat.treatment_strategy = 'Thrombolysis';
    else if (flat.conservative === 'Yes') flat.treatment_strategy = 'Conservative';
  }

  // 7. Stent Type
  if (!flat.stent_type) {
    if (flat.stent_des === 'Yes') flat.stent_type = 'DES';
    else if (flat.stent_bms === 'Yes') flat.stent_type = 'BMS';
  }

  // 8. Heparin Strategy
  if (!flat.heparin_strategy) {
    if (flat.heparin_lmwh === 'Yes') flat.heparin_strategy = 'LMWH alone';
    else if (flat.heparin_ufh_iv === 'Yes') flat.heparin_strategy = 'UFH IV';
    else if (flat.heparin_ufh_sc === 'Yes') flat.heparin_strategy = 'UFH SC';
  }

  // 9. Statin Dose
  if (!flat.statin_dose) {
    if (flat.statin_10mg === 'Yes') flat.statin_dose = '10 mg';
    else if (flat.statin_20mg === 'Yes') flat.statin_dose = '20 mg';
    else if (flat.statin_40mg === 'Yes') flat.statin_dose = '40 mg';
    else if (flat.statin_80mg === 'Yes') flat.statin_dose = '80 mg';
  }

  // 10. Discharge Statin Dose
  if (!flat.discharge_statin_dose) {
    if (flat.discharge_statin_10mg === 'Yes') flat.discharge_statin_dose = '10 mg';
    else if (flat.discharge_statin_20mg === 'Yes') flat.discharge_statin_dose = '20 mg';
    else if (flat.discharge_statin_40mg === 'Yes') flat.discharge_statin_dose = '40 mg';
    else if (flat.discharge_statin_80mg === 'Yes') flat.discharge_statin_dose = '80 mg';
  }

  // 11. Referred From Alias Normalization
  let refFromVal = flat.referredFrom || flat.referred_from;
  if (refFromVal !== undefined) {
    flat.referredFrom = refFromVal;
    flat.referred_from = refFromVal;
  }

  // 12. Fluid And Diet Alias Normalization
  let fluidDietVal = flat.fluidAndDiet || flat['recommendations.fluidAndDiet'] || flat['recommendations.fluid_and_diet_details'] || flat.fluid_and_diet_details;
  if (fluidDietVal !== undefined) {
    flat['recommendations.fluid_and_diet_details'] = fluidDietVal;
    flat['recommendations.fluidAndDiet'] = fluidDietVal;
  }

  // 13. Syncope Frequency Alias Normalization
  let syncopeFreqVal = flat.syncopeFrequency || flat.syncope_frequency;
  if (syncopeFreqVal !== undefined) {
    flat.syncopeFrequency = syncopeFreqVal;
    flat.syncope_frequency = syncopeFreqVal;
  }

  // 14. Complaints Syncope Presyncope Normalization
  let syncopeVal = flat.complaints_syncope || flat.complaints_syncope_presyncope || flat.complaintsSyncope;
  if (syncopeVal !== undefined) {
    flat.complaints_syncope = syncopeVal;
    flat.complaints_syncope_presyncope = syncopeVal;
    flat.complaintsSyncope = syncopeVal;
  }

  // 15. Previous Diagnosis Normalization
  let prevDiagVal = flat.previous_diagnosis || flat.previousDiagnosis;
  if (prevDiagVal !== undefined) {
    flat.previous_diagnosis = prevDiagVal;
    flat.previousDiagnosis = prevDiagVal;
  }

  // 16. Discharge / Treatment Medication Alias Normalization
  const DISCHARGE_MED_KEYS = [
    'beta_blocker', 'calcium_channel_blocker', 'nitrate', 'nicorandil',
    'ivabradine', 'ranolazine', 'trimetazidine', 'aspirin', 'clopidogrel',
    'prasugrel', 'ticagrelor', 'statin', 'statin_10mg', 'statin_20mg',
    'statin_40mg', 'statin_80mg', 'gp2b3a', 'bivaluridin'
  ];
  for (const mKey of DISCHARGE_MED_KEYS) {
    const disKey = `discharge_${mKey}`;
    const val = flat[disKey] !== undefined ? flat[disKey] : flat[mKey];
    if (val !== undefined) {
      flat[disKey] = val;
      flat[mKey] = val;
    }
  }

  return flat;
}

/**
 * Flattens nested HF form payloads (patient, inpatientDetails, investigations, etc.)
 * into dot-notation keys for reliable deep comparison.
 */
function flattenObject(obj, prefix = '') {
  const res = {};
  if (!obj || typeof obj !== 'object') return res;

  for (const key of Object.keys(obj)) {
    const val = obj[key];
    const newKey = prefix ? `${prefix}.${key}` : key;

    if (val === null || val === undefined) continue;

    if (Array.isArray(val)) {
      if (val.length === 0) {
        res[newKey] = '';
      } else if (val.every(item => typeof item !== 'object' || item === null)) {
        res[newKey] = [...val].map(item => normalizeVal(item)).sort().join(', ');
      } else {
        val.forEach((item, idx) => {
          if (item !== null && typeof item === 'object') {
            Object.assign(res, flattenObject(item, `${newKey}[${idx}]`));
          } else {
            res[`${newKey}[${idx}]`] = item;
          }
        });
      }
    } else if (typeof val === 'object' && !(val instanceof Date)) {
      Object.assign(res, flattenObject(val, newKey));
    } else {
      res[newKey] = val;
    }
  }

  return res;
}

function formatAuditDisplayValue(val) {
  const normalizedDate = normalizeDateValue(val);
  if (normalizedDate) return normalizedDate;

  if (val === null || val === undefined) return '—';
  const norm = normalizeVal(val);
  if (norm === '') return '—';
  return val;
}

/**
 * Deeply compares oldData (DB) vs newData (req.body) for UPDATE actions.
 * Flattens nested HF payloads, resolves canonical group fields, and normalizes dates before comparison.
 */
function getChangedFields(oldObj, newObj) {
  if (!oldObj || !newObj) return [];

  const excludedKeys = new Set([
    'id', 'created_at', 'updated_at', 'patient_id', 'reg_patient_id', 'regpatientid',
    'is_deleted', 'isdeleted', 'deleted_at', 'deleted_by', 'deletedby', 'status',
    'created_by', 'createdby', 'updated_by', 'updatedby', 'stemi_id', 'nstemi_id',
    'hf_id', 'hfid', 'temphfid', 'acs_no', 'acsno', 'ip_no', 'ipno',
    'hf_registry_no', 'hfregistryno', 'followup', 'appropriateness',
    'stemi_appropriateness', 'nstemi_appropriateness', 'appropriateness_id',
    'care_mr_no', 'caremrno', 'mr_no', 'mrno', 'encounterid', 'encounter_id',
    'assessed_by', 'assessedby', 'visit_id', 'visitid', 'isdraft', 'is_draft',
    '_req', 'deleted_by_user', 'deletedbyuser',
    // Demographic read-only & auto-computed follow-up fields
    'patient_name', 'patientname', 'name', 'age', 'gender', 'phone', 'email',
    'date_1m', 'date_3m', 'date_6m', 'date_12m', 'date_1month', 'date_3month', 'date_6month', 'date_12month',
    'target_date', 'timeframe', 'followup_date', 'followup_month', 'followup_id', 'task_id',
    'source_record_id', 'source_registry', 'clinic_location', 'address', 'patient',
    // Followup form-default fields (sent with defaults like 'None'/'In-Person' even when DB has null)
    'func_1m', 'func_3m', 'func_6m', 'func_12m',
    'visit_mode', 'visitmode', 'special_instructions',
    'functional_class', 'mr_grade',
    // Grouped constituent raw boolean flags
    'av_block_none', 'av_block_first_degree', 'av_block_second_degree', 'av_block_chb',
    'bbb_none', 'bbb_lbbb', 'bbb_rbbb', 'bbb_indeterminate',
    'rhythm_nsr', 'rhythm_af', 'rhythm_svt', 'rhythm_vt', 'rhythm_vf',
    'lv_function_normal', 'lv_function_mild_lvd', 'lv_function_moderate_lvd', 'lv_function_severe_lvd',
    'mr_none', 'mr_mild', 'mr_moderate', 'mr_severe',
    'pami', 'thrombolysis', 'conservative',
    'stent_des', 'stent_bms',
    'heparin_lmwh', 'heparin_ufh_iv', 'heparin_ufh_sc',
    'statin_10mg', 'statin_20mg', 'statin_40mg', 'statin_80mg',
    'discharge_statin_10mg', 'discharge_statin_20mg', 'discharge_statin_40mg', 'discharge_statin_80mg',
    'fluidanddiet'
  ]);

  // Keys that are synthetically created by resolveCanonicalObject — if these only exist
  // on one side, skip diffing (the other side simply didn't include them in its payload).
  const canonicalGroupKeys = new Set([
    'av_block', 'bbb', 'rhythm', 'ecg_rhythm', 'lv_function', 'mr',
    'treatment_strategy', 'stent_type', 'heparin_strategy',
    'statin_dose', 'discharge_statin_dose'
  ]);

  const flatOld = resolveCanonicalObject(flattenObject(sanitizeAuditPayload(oldObj)));
  const flatNew = resolveCanonicalObject(flattenObject(sanitizeAuditPayload(newObj)));
  const oldKeys = new Set(Object.keys(flatOld));
  const newKeys = new Set(Object.keys(flatNew));
  const allFullKeys = new Set([...oldKeys, ...newKeys]);
  const allKeyArray = Array.from(allFullKeys);

  const hasNestedCounterpart = (topKey) => {
    if (topKey.includes('.')) return false;
    const lowerTop = topKey.toLowerCase();
    return allKeyArray.some(k => k.includes('.') && k.toLowerCase().endsWith('.' + lowerTop));
  };

  const changes = [];

  for (const key of allFullKeys) {
    const leaf = key.split('.').pop();
    const lowerLeaf = leaf.toLowerCase();
    const lowerFullKey = key.toLowerCase();

    // Skip modular followup array/table items from primary registry audit trail
    const FOLLOWUP_KEY_REGEX = /^(stemi_followup|nstemi_followup|followup|followups|patient_followup_tasks)(\[|\.|$)/i;
    if (FOLLOWUP_KEY_REGEX.test(lowerFullKey) || lowerFullKey.includes('followup')) {
      continue;
    }

    if (
      excludedKeys.has(lowerLeaf) ||
      excludedKeys.has(lowerFullKey) ||
      leaf.startsWith('appr_') ||
      lowerLeaf.endsWith('_id') ||
      (lowerLeaf.endsWith('id') && lowerLeaf !== 'visitid')
    ) {
      continue;
    }

    if (!key.includes('.') && hasNestedCounterpart(key)) {
      continue;
    }

    // Skip un-prefixed medication keys when discharge_ prefixed counterpart exists
    const DISCHARGE_MED_SET = new Set([
      'beta_blocker', 'calcium_channel_blocker', 'nitrate', 'nicorandil',
      'ivabradine', 'ranolazine', 'trimetazidine', 'aspirin', 'clopidogrel',
      'prasugrel', 'ticagrelor', 'statin', 'statin_10mg', 'statin_20mg',
      'statin_40mg', 'statin_80mg', 'gp2b3a', 'bivaluridin'
    ]);
    if (!lowerFullKey.startsWith('discharge_') && DISCHARGE_MED_SET.has(lowerLeaf)) {
      if (allFullKeys.has(`discharge_${lowerLeaf}`)) {
        continue;
      }
    }

    // Skip canonical group fields that only exist on one side.
    // This happens when the DB has boolean flags (resolved to group) but the form
    // payload didn't include the group field at all (or vice versa).
    if (canonicalGroupKeys.has(lowerLeaf)) {
      if (!oldKeys.has(key) || !newKeys.has(key)) {
        continue;
      }
    }

    const prevVal = flatOld[key];
    const newVal = flatNew[key];
    const normPrev = normalizeVal(prevVal);
    const normNew = normalizeVal(newVal);

    if (normPrev === normNew) continue;

    if ((normPrev === '' || normPrev === 'No') && (normNew === 'No' || normNew === 'Unknown' || normNew === '' || normNew === '0')) {
      continue;
    }

    changes.push({
      field: formatFieldLabel(key),
      previous: formatAuditDisplayValue(prevVal),
      new: formatAuditDisplayValue(newVal)
    });
  }

  const uniqueChanges = [];
  const seen = new Set();
  for (const change of changes) {
    const dedupeKey = `${change.field}|${change.previous}|${change.new}`;
    if (!seen.has(dedupeKey)) {
      seen.add(dedupeKey);
      uniqueChanges.push(change);
    }
  }

  return uniqueChanges;
}

/**
 * Dynamically formats record identifiers based on registry type.
 * HF records: "HF00001" or "HF #<id>"
 * STEMI / NSTEMI records: "IP-<no>" or "IP00001"
 */
function formatRecordIdentifier(registryType, identifier, dataObj = null) {
  const reg = String(registryType || '').toUpperCase();
  let id = identifier;

  if (dataObj) {
    if (reg === 'HF' && (dataObj.hf_registry_no || dataObj.hf_id)) {
      id = dataObj.hf_registry_no || dataObj.hf_id;
    } else if ((reg === 'STEMI' || reg === 'NSTEMI') && (dataObj.ip_no || dataObj.acs_no)) {
      id = dataObj.ip_no || dataObj.acs_no;
    }
  }

  if (id === null || id === undefined || id === '' || id === 'null' || id === 'undefined') {
    return '—';
  }

  const strId = String(id).trim();

  if (reg === 'HF') {
    if (strId.startsWith('HF')) return strId;
    return `HF #${strId}`;
  } else if (reg === 'STEMI' || reg === 'NSTEMI') {
    if (strId.startsWith('IP')) return strId;
    return `IP-${strId}`;
  }

  return strId;
}

/**
 * Reusable Express Audit Logger Utility
 * Writes immutable action record into system_audit_log table
 *
 * @param {Object} req - Express request object (containing req.user)
 * @param {string} actionType - 'CREATE' | 'UPDATE' | 'DELETE' | 'RESTORE'
 * @param {string} registryType - 'HF' | 'STEMI' | 'NSTEMI'
 * @param {string|number} recordIdentifier - HF ID for HF, or IP No for STEMI/NSTEMI
 * @param {number} patientId - Associated Patient DB Primary Key ID
 * @param {Object} [oldData=null] - Object state before mutation
 * @param {Object} [newData=null] - Object state after mutation
 */
async function logAuditTrail(req, actionType, registryType, recordIdentifier, patientId, oldData = null, newData = null) {
  try {
    // Extract logged-in user from req.user or request headers
    const username = req?.user?.username || req?.user?.name || req?.user?.email || req?.headers?.['x-user-name'] || req?.body?.username || 'varshitha_appam';
    const normalizedAction = String(actionType).toUpperCase();
    const normalizedRegistry = String(registryType).toUpperCase();
    const safeOldData = sanitizeAuditPayload(oldData);
    const safeNewData = sanitizeAuditPayload(newData);
    const formattedRecordId = formatRecordIdentifier(normalizedRegistry, recordIdentifier, safeNewData || safeOldData);

    let changedFieldsJSON = null;

    if (normalizedAction === 'UPDATE' && safeOldData && safeNewData) {
      const changedArray = getChangedFields(safeOldData, safeNewData);
      changedFieldsJSON = JSON.stringify(changedArray);
    }

    const prevJSON = safeOldData ? JSON.stringify(safeOldData) : null;
    const newJSON = safeNewData ? JSON.stringify(safeNewData) : null;

    const query = `
      INSERT INTO [system_audit_log] 
        ([registry_type], [record_identifier], [record_id], [patient_id], [user_id], [action_type], [changed_fields], [previous_values], [new_values], [timestamp])
      VALUES 
        (@registryType, @recordIdentifier, @recordIdentifier, @patientId, @username, @actionType, @changedFields, @previousValues, @newValues, SYSDATETIME());
    `;

    await db.query(query, {
      registryType: normalizedRegistry,
      recordIdentifier: formattedRecordId,
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

module.exports = {
  logAuditTrail,
  getChangedFields,
  formatRecordIdentifier,
  sanitizeAuditPayload,
  normalizeVal,
  flattenObject
};



