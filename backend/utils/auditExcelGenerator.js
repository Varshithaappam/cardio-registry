const ExcelJS = require('exceljs');

/**
 * Audit Log Excel Export Generator using ExcelJS
 * Formats audit trail data into a styled Excel (.xlsx) document.
 */

// Helper map for user-friendly field labels
const FIELD_LABEL_MAP = {
  department: 'Department',
  doctor: 'Doctor',
  treatingcardiologist: 'Treating Cardiologist',
  referringdoctor: 'Referring Doctor',
  insurancemode: 'Insurance Mode',
  highesteducation: 'Education Level',
  monthlyincome: 'Monthly Income',
  occupation: 'Occupation',
  caregivername: 'Caregiver Name',
  caregiverrelationship: 'Caregiver Relationship',
  caregiverphone: 'Caregiver Phone',
  referredfrom: 'Referred From',
  presentdiagnosis: 'Present Diagnosis',
  dischargedate: 'Discharge Date',
  precipitatingfactors: 'Precipitating Factors',
  dayshospitalized: 'Days Hospitalized',
  typeofhf: 'Type of Heart Failure',
  finaltypeofhf: 'Type of Heart Failure',
  nyhaclass: 'NYHA Class',
  stageofhf: 'Stage of Heart Failure',
  lvefpercent: 'LVEF (%)',
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
  monthly_income: 'Monthly Income',
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
  discharge_statin_dose: 'Discharge Statin Dose'
};

const formatFieldLabel = (key) => {
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
};

const normalizeVal = (val) => {
  if (val === null || val === undefined) return '';
  let s = String(val).trim();
  if (s === 'null' || s === 'undefined' || s === '') return '';
  if (/^\d{4}-\d{2}-\d{2}T/.test(s)) {
    s = s.split('T')[0];
  }
  const lower = s.toLowerCase();
  if (['no', 'false', '0'].includes(lower)) return 'No';
  if (['yes', 'true', '1'].includes(lower)) return 'Yes';
  if (['unknown'].includes(lower)) return 'Unknown';
  if (['referred from (department / practice)', 'referred from (department/practice)', 'referred from'].includes(lower)) return '';
  if (!isNaN(s) && s !== '') {
    const num = Number(s);
    if (!isNaN(num)) return String(num);
  }
  return s;
};

const resolveCanonicalObject = (obj) => {
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

  return flat;
};

const flattenObject = (obj, prefix = '') => {
  let res = {};
  if (!obj || typeof obj !== 'object') return res;

  for (const key of Object.keys(obj)) {
    const val = obj[key];
    const newKey = prefix ? `${prefix}.${key}` : key;

    if (val !== null && val !== undefined) {
      if (Array.isArray(val)) {
        if (val.length === 0) {
          res[newKey] = '';
        } else if (val.every(item => typeof item !== 'object')) {
          res[newKey] = [...val].sort().join(', ');
        } else {
          val.forEach((item, idx) => {
            if (typeof item === 'object') {
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
  }
  return res;
};

const computeObjectDiff = (oldObj, newObj) => {
  if (!oldObj || !newObj || typeof oldObj !== 'object' || typeof newObj !== 'object') return [];

  const flatOld = resolveCanonicalObject(flattenObject(oldObj));
  const flatNew = resolveCanonicalObject(flattenObject(newObj));

  const diffs = [];
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
    // Followup form-default fields
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
    'discharge_statin_10mg', 'discharge_statin_20mg', 'discharge_statin_40mg', 'discharge_statin_80mg'
  ]);

  const canonicalGroupKeys = new Set([
    'av_block', 'bbb', 'rhythm', 'ecg_rhythm', 'lv_function', 'mr',
    'treatment_strategy', 'stent_type', 'heparin_strategy',
    'statin_dose', 'discharge_statin_dose'
  ]);

  const oldKeys = new Set(Object.keys(flatOld));
  const newKeys = new Set(Object.keys(flatNew));
  const allFullKeys = new Set([...oldKeys, ...newKeys]);
  const allKeyArray = Array.from(allFullKeys);

  const hasNestedCounterpart = (topKey) => {
    if (topKey.includes('.')) return false;
    const lowerTop = topKey.toLowerCase();
    return allKeyArray.some(k => k.includes('.') && k.toLowerCase().endsWith('.' + lowerTop));
  };

  for (const key of allFullKeys) {
    const leaf = key.split('.').pop();
    const lowerLeaf = leaf.toLowerCase();
    const lowerFullKey = key.toLowerCase();

    // Skip modular followup array items from primary registry audit trail
    if (lowerFullKey.startsWith('followup') || lowerFullKey.includes('followup[')) {
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

    if (canonicalGroupKeys.has(lowerLeaf)) {
      if (!oldKeys.has(key) || !newKeys.has(key)) {
        continue;
      }
    }

    const p = flatOld[key];
    const n = flatNew[key];

    const normP = normalizeVal(p);
    const normN = normalizeVal(n);

    if (normP === normN) continue;
    if ((normP === '' || normP === 'No') && (normN === 'No' || normN === 'Unknown' || normN === '' || normN === '0')) continue;

    diffs.push({
      field: formatFieldLabel(key),
      previous: p !== null && p !== undefined && normP !== '' ? String(p) : '—',
      new: n !== null && n !== undefined && normN !== '' ? String(n) : '—'
    });
  }

  const uniqueDiffs = [];
  const seen = new Set();
  for (const diff of diffs) {
    const k = `${diff.field}|${diff.previous}|${diff.new}`;
    if (!seen.has(k)) {
      seen.add(k);
      uniqueDiffs.push(diff);
    }
  }

  return uniqueDiffs;
};

const parseChangedFields = (log) => {
  if (!log) return [];
  const changedFields = log.changed_fields;
  let list = [];

  if (Array.isArray(changedFields)) {
    list = changedFields;
  } else if (changedFields) {
    try {
      const parsed = typeof changedFields === 'string' ? JSON.parse(changedFields) : changedFields;
      if (Array.isArray(parsed)) {
        list = parsed;
      } else if (parsed && typeof parsed === 'object') {
        if (parsed.previous !== undefined || parsed.new !== undefined) {
          if (typeof parsed.previous === 'object' || typeof parsed.new === 'object') {
            list = computeObjectDiff(parsed.previous, parsed.new);
          } else {
            list = [{ field: 'Record Details', previous: parsed.previous, new: parsed.new }];
          }
        }
      }
    } catch {}
  }

  let processedList = [];
  for (const item of list) {
    if (item && typeof item === 'object') {
      const prevIsObj = item.previous && typeof item.previous === 'object';
      const newIsObj = item.new && typeof item.new === 'object';
      if (prevIsObj || newIsObj || item.field === 'Record Details') {
        const diffs = computeObjectDiff(
          prevIsObj ? item.previous : {},
          newIsObj ? item.new : {}
        );
        processedList.push(...diffs);
      } else {
        processedList.push({
          field: formatFieldLabel(item.field),
          previous: item.previous !== null && item.previous !== undefined ? String(item.previous) : '—',
          new: item.new !== null && item.new !== undefined ? String(item.new) : '—'
        });
      }
    }
  }

  if (processedList.length === 0 && (log.previous_values || log.new_values)) {
    try {
      const prevObj = typeof log.previous_values === 'string' ? JSON.parse(log.previous_values) : (log.previous_values || {});
      const newObj = typeof log.new_values === 'string' ? JSON.parse(log.new_values) : (log.new_values || {});
      processedList = computeObjectDiff(prevObj, newObj);
    } catch {}
  }

  return processedList;
};

function formatTimestampIST(ts) {
  if (!ts) return '—';
  try {
    const str = String(ts).trim();
    const match = str.match(/^(\d{4})-(\d{2})-(\d{2})[T\s](\d{2}):(\d{2})/);
    if (match) {
      const [, y, m, d, hh, mm] = match;
      let hours = parseInt(hh, 10);
      const ampm = hours >= 12 ? 'PM' : 'AM';
      hours = hours % 12 || 12;
      const formattedHour = String(hours).padStart(2, '0');
      return `${d}-${m}-${y}, ${formattedHour}:${mm} ${ampm}`;
    }

    const dObj = new Date(ts);
    if (isNaN(dObj.getTime())) return str;
    const day = String(dObj.getDate()).padStart(2, '0');
    const month = String(dObj.getMonth() + 1).padStart(2, '0');
    const year = dObj.getFullYear();
    let hours = dObj.getHours();
    const minutes = String(dObj.getMinutes()).padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12 || 12;
    return `${day}-${month}-${year}, ${String(hours).padStart(2, '0')}:${minutes} ${ampm}`;
  } catch {
    return String(ts);
  }
}

function formatModifiedFields(parsedChanges) {
  if (!parsedChanges || !Array.isArray(parsedChanges) || parsedChanges.length === 0) {
    return '—';
  }
  return parsedChanges
    .map(chg => `${chg.field}: "${chg.previous ?? '—'}" -> "${chg.new ?? '—'}"`)
    .join('\n');
}

function formatRawValues(log) {
  const action = String(log.action_type || '').toUpperCase();
  let prevStr = '';
  if (log.previous_values) {
    try {
      const parsed = typeof log.previous_values === 'string' ? JSON.parse(log.previous_values) : log.previous_values;
      prevStr = JSON.stringify(parsed);
    } catch {
      prevStr = String(log.previous_values);
    }
  }

  if (action === 'CREATE' || action === 'CREATION') {
    return 'Prev: null | New:';
  } else if (action === 'UPDATE' || action === 'UPDATED') {
    return prevStr ? `Prev:\n${prevStr}` : 'Prev:';
  } else {
    return prevStr ? `Prev:\n${prevStr}` : 'Prev:';
  }
}

async function generateAuditExcel({ logs = [], patientName = '', patientMr = '', patientId = '', startDate = '', endDate = '', actionFilter = '' }, res) {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'CARE HEALTH SYSTEM';
  workbook.lastModifiedBy = 'CARE HEALTH SYSTEM';
  workbook.created = new Date();

  const worksheet = workbook.addWorksheet('Audit Trail', {
    pageSetup: { paperSize: 9, orientation: 'landscape' }
  });

  // Column definitions and widths
  worksheet.columns = [
    { key: 'audit_id', width: 12 },
    { key: 'timestamp', width: 24 },
    { key: 'action_type', width: 16 },
    { key: 'registry_type', width: 16 },
    { key: 'record_identifier', width: 24 },
    { key: 'user_name', width: 20 },
    { key: 'modified_fields', width: 48 },
    { key: 'raw_values', width: 48 }
  ];

  // Row 1: Banner Title
  worksheet.mergeCells('A1:H1');
  const titleCell = worksheet.getCell('A1');
  titleCell.value = 'CARE HEALTH SYSTEM — AUDIT & VERIFICATION TRAIL REPORT';
  titleCell.font = { name: 'Calibri', size: 14, bold: true, color: { argb: 'FFFFFFFF' } };
  titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4B0082' } };
  titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
  worksheet.getRow(1).height = 32;

  // Row 2: Metadata Header
  worksheet.mergeCells('A2:H2');
  const metaCell = worksheet.getCell('A2');
  const pName = patientName || 'Patient';
  const pMr = patientMr || '—';
  const pId = patientId || '—';
  const dateStr = (startDate && endDate) ? `${startDate} to ${endDate}` : (startDate ? `From ${startDate}` : (endDate ? `Until ${endDate}` : 'All Actions'));
  const actStr = (actionFilter && actionFilter !== 'ALL') ? actionFilter : 'All Actions';
  const totalRecs = logs.length;

  metaCell.value = `Patient Name: ${pName} | MR No: ${pMr} | Patient ID: ${pId} | Date Range: ${dateStr} | Action: ${actStr} | Total Records: ${totalRecs}`;
  metaCell.font = { name: 'Calibri', size: 10, bold: true, italic: true, color: { argb: 'FF4B0082' } };
  metaCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE6E6FA' } };
  metaCell.alignment = { horizontal: 'center', vertical: 'middle' };
  worksheet.getRow(2).height = 22;

  // Row 3: Spacer
  worksheet.getRow(3).height = 12;

  // Row 4: Table Column Headers
  const headers = [
    'Audit ID', 'Timestamp (IST)', 'Action Type', 'Registry Type',
    'Record Identifier', 'User Name', 'Modified Fields / Details', 'Raw Values'
  ];
  const headerRow = worksheet.getRow(4);
  headerRow.values = headers;
  headerRow.height = 24;

  headerRow.eachCell((cell) => {
    cell.font = { name: 'Calibri', size: 11, bold: true, color: { argb: 'FFFFFFFF' } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4B0082' } };
    cell.alignment = { horizontal: 'center', vertical: 'middle' };
  });

  const actionStyles = {
    CREATE: { fill: 'FFD1FAE5', fontColor: 'FF065F46' },
    CREATION: { fill: 'FFD1FAE5', fontColor: 'FF065F46' },
    UPDATE: { fill: 'FFFEF3C7', fontColor: 'FF92400E' },
    UPDATED: { fill: 'FFFEF3C7', fontColor: 'FF92400E' },
    DELETE: { fill: 'FFFEE2E2', fontColor: 'FF991B1B' },
    DELETION: { fill: 'FFFEE2E2', fontColor: 'FF991B1B' },
    RESTORE: { fill: 'FFCCFBF1', fontColor: 'FF115E59' },
    RESTORED: { fill: 'FFCCFBF1', fontColor: 'FF115E59' }
  };

  const thinBorder = {
    top: { style: 'thin', color: { argb: 'FFE0E0E0' } },
    left: { style: 'thin', color: { argb: 'FFE0E0E0' } },
    bottom: { style: 'thin', color: { argb: 'FFE0E0E0' } },
    right: { style: 'thin', color: { argb: 'FFE0E0E0' } }
  };

  logs.forEach((log) => {
    const auditId = log.audit_id || '';
    const ts = formatTimestampIST(log.timestamp);
    const action = String(log.action_type || '').toUpperCase();
    const regType = String(log.registry_type || 'HF').toUpperCase();
    const recId = log.record_identifier || log.record_id || '—';
    const userName = log.username || log.user_id || 'User';

    const parsedChanges = parseChangedFields(log);
    const modifiedFields = formatModifiedFields(parsedChanges);
    const rawValues = formatRawValues(log);

    const dataRow = worksheet.addRow([
      auditId,
      ts,
      action,
      regType,
      recId,
      userName,
      modifiedFields,
      rawValues
    ]);

    dataRow.eachCell((cell, colNumber) => {
      cell.border = thinBorder;
      cell.font = { name: 'Calibri', size: 10 };

      if (colNumber === 3) {
        const style = actionStyles[action] || { fill: 'FFF3F4F6', fontColor: 'FF1F2937' };
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: style.fill } };
        cell.font = { name: 'Calibri', size: 10, bold: true, color: { argb: style.fontColor } };
        cell.alignment = { horizontal: 'center', vertical: 'top' };
      } else if (colNumber === 7 || colNumber === 8) {
        cell.alignment = { vertical: 'top', horizontal: 'left', wrapText: true };
      } else {
        cell.alignment = { vertical: 'top', horizontal: 'center' };
      }
    });
  });

  const cleanMr = String(patientMr || 'Patient').replace(/[^a-zA-Z0-9_-]/g, '');
  const fileName = `Audit_Report_${cleanMr}_${new Date().toISOString().slice(0, 10)}.xlsx`;

  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);

  await workbook.xlsx.write(res);
  res.end();
}

module.exports = {
  generateAuditExcel,
  parseChangedFields,
  computeObjectDiff
};
