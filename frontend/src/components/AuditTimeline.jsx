import React, { useState, useMemo } from 'react';
import ExcelJS from 'exceljs';
import api from '../api/axiosInstance';
import { 
  RotateCw, RotateCcw, Trash2, Shield, Clock, UserCheck, 
  Download, Calendar, Filter, Info, FileSpreadsheet 
} from 'lucide-react';

/**
 * AuditTimeline Component
 * Renders an immutable timeline of system_audit_log records matching the CARE HEALTH SYSTEM portal design.
 * Features 7-day past event timeline filtering & full date-filtered Excel/CSV Audit Log Export.
 *
 * @param {Array} logs - Array of audit log objects fetched from backend system_audit_log table
 * @param {string} patientMr - Patient MR number (e.g., 'MR6243')
 * @param {string} patientName - Patient full name (e.g., 'John Doe')
 */
export default function AuditTimeline({ logs = [], patientMr = 'MR6243', patientName = '' }) {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [actionFilter, setActionFilter] = useState('ALL');
  const [userFilter, setUserFilter] = useState('ALL');

  // Timeline interactive filters
  const [timelineActionFilter, setTimelineActionFilter] = useState('ALL');
  const [timelineUserFilter, setTimelineUserFilter] = useState('ALL');

  // Dynamically extract unique users from audit logs
  const availableUsers = useMemo(() => {
    const set = new Set();
    logs.forEach((log) => {
      const u = log.username || log.user_id;
      if (u) set.add(String(u));
    });
    return Array.from(set).sort();
  }, [logs]);

  // Helper to format ISO/database timestamp in Indian Standard Time (Asia/Kolkata)
  const formatTimestamp = (ts) => {
    if (!ts) return '—';
    try {
      const str = String(ts).trim();
      
      // Parse ISO or DB date string "YYYY-MM-DDTHH:mm:ss" or "YYYY-MM-DD HH:mm:ss"
      const match = str.match(/^(\d{4})-(\d{2})-(\d{2})[T\s](\d{2}):(\d{2})/);
      if (match) {
        const [, y, m, d, hh, mm] = match;
        let hours = parseInt(hh, 10);
        const ampm = hours >= 12 ? 'PM' : 'AM';
        hours = hours % 12 || 12;
        const formattedHour = String(hours).padStart(2, '0');
        return `${d}-${m}-${y}, ${formattedHour}:${mm} ${ampm}`;
      }

      // Fallback for Date objects or timestamps
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
  };

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

  // const normalizeValue = (val) => {
  //   if (val === null || val === undefined) return '';
  //   let s = String(val).trim();
  //   if (s === 'null' || s === 'undefined' || s === '') return '';
  //   if (/^\d{4}-\d{2}-\d{2}T/.test(s)) {
  //     s = s.split('T')[0];
  //   }
  //   const lower = s.toLowerCase();
  //   if (['no', 'false', '0'].includes(lower)) return 'No';
  //   if (['yes', 'true', '1'].includes(lower)) return 'Yes';
  //   if (['unknown'].includes(lower)) return 'Unknown';
  //   if (['referred from (department / practice)', 'referred from (department/practice)', 'referred from'].includes(lower)) return '';
  //   if (!isNaN(s) && s !== '') {
  //     const num = Number(s);
  //     if (!isNaN(num)) return String(num);
  //   }
  //   return s;
  // };

  const normalizeValue = (val) => {
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

    // AV Block Semantic Equivalences
    if (['first degree', '1st degree', '1-degree', '1 degree', '1st-degree'].includes(lower)) return '1st Degree AV Block';
    if (['second degree', '2nd degree', '2-degree', '2 degree', '2nd-degree', 'mobitz type i', 'mobitz type ii'].includes(lower)) return '2nd Degree AV Block';
    if (['third degree', '3rd degree', 'complete heart block', 'chb', '3-degree', '3 degree', '3rd-degree'].includes(lower)) return 'Complete Heart Block (3rd Degree)';
    if (['none', 'no av block', 'nil'].includes(lower)) return 'None';

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

    const FOLLOWUP_TABLE_REGEX = /^(stemi_followup|nstemi_followup|followup|followups|patient_followup_tasks)$/i;

    for (const key of Object.keys(obj)) {
      if (FOLLOWUP_TABLE_REGEX.test(key)) {
        continue;
      }
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
      'id', 'created_at', 'updated_at', 'stemi_id', 'nstemi_id', 'hf_id', 'hfid', 'temphfid',
      'patient_id', 'reg_patient_id', 'regpatientid', 'status', 'is_deleted', 'isdeleted',
      'created_by', 'createdby', 'updated_by', 'updatedby', 'deleted_at', 'deleted_by', 'deletedby',
      'acs_no', 'acsno', 'ip_no', 'ipno', 'hf_registry_no', 'hfregistryno', 'followup',
      'appropriateness', 'stemi_appropriateness', 'nstemi_appropriateness', 'appropriateness_id',
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

    // Helper to check if a top-level key has a nested counterpart (e.g. "address" vs "patient.address")
    const hasNestedCounterpart = (topKey) => {
      if (topKey.includes('.')) return false;
      const lowerTop = topKey.toLowerCase();
      return allKeyArray.some(k => k.includes('.') && k.toLowerCase().endsWith('.' + lowerTop));
    };

    for (const key of allFullKeys) {
      const leaf = key.split('.').pop();
      const lowerLeaf = leaf.toLowerCase();
      const lowerFullKey = key.toLowerCase();

      // Skip modular followup array/table items and timeframe suffix fields from primary registry audit trail
      const FOLLOWUP_KEY_REGEX = /^(stemi_followup|nstemi_followup|followup|followups|patient_followup_tasks)(\[|\.|$)/i;
      const FOLLOWUP_SUFFIX_REGEX = /_(1m|3m|6m|12m|1month|3month|6month|12month)$/i;
      if (FOLLOWUP_KEY_REGEX.test(lowerFullKey) || FOLLOWUP_SUFFIX_REGEX.test(lowerFullKey) || lowerFullKey.includes('followup')) {
        continue;
      }

      // Check exclusion criteria
      if (
        excludedKeys.has(lowerLeaf) ||
        excludedKeys.has(lowerFullKey) ||
        leaf.startsWith('appr_') ||
        lowerLeaf.endsWith('_id') ||
        (lowerLeaf.endsWith('id') && lowerLeaf !== 'visitid')
      ) {
        continue;
      }

      // If top-level key and a nested counterpart exists, skip top-level key
      if (!key.includes('.') && hasNestedCounterpart(key)) {
        continue;
      }

      // Skip canonical group fields that only exist on one side
      if (canonicalGroupKeys.has(lowerLeaf)) {
        if (!oldKeys.has(key) || !newKeys.has(key)) {
          continue;
        }
      }

      const p = flatOld[key];
      const n = flatNew[key];

      const normP = normalizeValue(p);
      const normN = normalizeValue(n);

      if (normP === normN) continue;
      if ((normP === '' || normP === 'No') && (normN === 'No' || normN === 'Unknown' || normN === '' || normN === '0')) continue;

      diffs.push({
        field: formatFieldLabel(key),
        previous: p !== null && p !== undefined && normP !== '' ? String(p) : '—',
        new: n !== null && n !== undefined && normN !== '' ? String(n) : '—'
      });
    }

    // Deduplicate diffs by field label + previous + new
    const uniqueDiffs = [];
    const seen = new Set();
    for (const diff of diffs) {
      const key = `${diff.field}|${diff.previous}|${diff.new}`;
      if (!seen.has(key)) {
        seen.add(key);
        uniqueDiffs.push(diff);
      }
    }

    return uniqueDiffs;
  };

  // Helper to safely parse changed_fields or compare previous/new value objects
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

    // Fallback: If processedList is empty but previous_values and new_values exist, compute diff dynamically
    if (processedList.length === 0 && (log.previous_values || log.new_values)) {
      try {
        const prevObj = typeof log.previous_values === 'string' ? JSON.parse(log.previous_values) : (log.previous_values || {});
        const newObj = typeof log.new_values === 'string' ? JSON.parse(log.new_values) : (log.new_values || {});
        processedList = computeObjectDiff(prevObj, newObj);
      } catch {}
    }

    return processedList;
  };

  // Check if log is from past 1 week (last 7 days)
  const isWithinPastWeek = (ts) => {
    if (!ts) return false;
    try {
      let dateObj;
      const str = String(ts).trim();
      const isoStr = str.includes(' ') && !str.includes('T') ? str.replace(' ', 'T') : str;
      dateObj = new Date(isoStr);
      if (isNaN(dateObj.getTime())) return true;

      const now = new Date();
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      sevenDaysAgo.setHours(0, 0, 0, 0);

      return dateObj >= sevenDaysAgo;
    } catch {
      return true;
    }
  };

  // Timeline displays past 1 week logs filtered by action type and user
  const timelineLogs = useMemo(() => {
    return logs.filter((log) => {
      if (!isWithinPastWeek(log.timestamp)) return false;

      // Filter by Timeline Action Filter
      if (timelineActionFilter && timelineActionFilter !== 'ALL') {
        const act = String(log.action_type || '').toUpperCase();
        if (timelineActionFilter === 'CREATE' && !(act === 'CREATE' || act === 'CREATION')) return false;
        if (timelineActionFilter === 'UPDATE' && !(act === 'UPDATE' || act === 'UPDATED')) return false;
        if (timelineActionFilter === 'DELETE' && !(act === 'DELETE' || act === 'DELETION')) return false;
        if (timelineActionFilter === 'RESTORE' && !(act === 'RESTORE' || act === 'RESTORED' || act === 'UNDELETE')) return false;
        if (!['CREATE', 'UPDATE', 'DELETE', 'RESTORE'].includes(timelineActionFilter) && act !== timelineActionFilter) return false;
      }

      // Filter by Timeline User Filter
      if (timelineUserFilter && timelineUserFilter !== 'ALL') {
        const u = String(log.username || log.user_id || '');
        if (u !== timelineUserFilter) return false;
      }

      return true;
    });
  }, [logs, timelineActionFilter, timelineUserFilter]);

  // Client-side ExcelJS generator fallback
  const generateClientSideExcel = async (filteredLogs) => {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'CARE HEALTH SYSTEM';
    workbook.created = new Date();

    const worksheet = workbook.addWorksheet('Audit Trail', {
      pageSetup: { paperSize: 9, orientation: 'landscape' }
    });

    worksheet.columns = [
      { key: 'audit_id', width: 12 },
      { key: 'timestamp', width: 24 },
      { key: 'action_type', width: 16 },
      { key: 'registry_type', width: 16 },
      { key: 'record_identifier', width: 24 },
      { key: 'user_name', width: 20 },
      { key: 'modified_fields', width: 48 }
    ];

    // Row 1 Title Banner
    worksheet.mergeCells('A1:G1');
    const titleCell = worksheet.getCell('A1');
    titleCell.value = 'CARE HEALTH SYSTEM — AUDIT & VERIFICATION TRAIL REPORT';
    titleCell.font = { name: 'Calibri', size: 14, bold: true, color: { argb: 'FFFFFFFF' } };
    titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4B0082' } };
    titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
    worksheet.getRow(1).height = 32;

    // Row 2 Metadata Header Banner
    worksheet.mergeCells('A2:G2');
    const metaCell = worksheet.getCell('A2');
    const pName = patientName || 'Patient';
    const pMr = patientMr || '—';
    const pId = patientMr || '—';
    const dateStr = (startDate && endDate) ? `${startDate} to ${endDate}` : (startDate ? `From ${startDate}` : (endDate ? `Until ${endDate}` : 'All Actions'));
    const actStr = (actionFilter && actionFilter !== 'ALL') ? actionFilter : 'All Actions';
    const userStr = (userFilter && userFilter !== 'ALL') ? userFilter : 'All Users';
    const totalRecs = filteredLogs.length;

    metaCell.value = `Patient Name: ${pName} | MR No: ${pMr} | Patient ID: ${pId} | Date Range: ${dateStr} | Action: ${actStr} | User: ${userStr} | Total Records: ${totalRecs}`;
    metaCell.font = { name: 'Calibri', size: 10, bold: true, italic: true, color: { argb: 'FF4B0082' } };
    metaCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE6E6FA' } };
    metaCell.alignment = { horizontal: 'center', vertical: 'middle' };
    worksheet.getRow(2).height = 22;

    // Row 3 Spacer
    worksheet.getRow(3).height = 12;

    // Row 4 Table Headers
    const headers = [
      'Audit ID', 'Timestamp (IST)', 'Action Type', 'Registry Type',
      'Record Identifier', 'User Name', 'Modified Fields / Details'
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

    filteredLogs.forEach((log) => {
      const auditId = log.audit_id || '';
      const ts = formatTimestamp(log.timestamp);
      const action = String(log.action_type || '').toUpperCase();
      const regType = String(log.registry_type || 'HF').toUpperCase();
      const recId = log.record_identifier || log.record_id || '—';
      const userName = log.username || log.user_id || 'User';

      const parsedChanges = parseChangedFields(log);
      const modifiedFields = parsedChanges.length > 0
        ? parsedChanges.map(chg => `${chg.field}: "${chg.previous ?? '—'}" -> "${chg.new ?? '—'}"`).join('\n')
        : '—';

      const dataRow = worksheet.addRow([
        auditId,
        ts,
        action,
        regType,
        recId,
        userName,
        modifiedFields
      ]);

      dataRow.eachCell((cell, colNumber) => {
        cell.border = thinBorder;
        cell.font = { name: 'Calibri', size: 10 };

        if (colNumber === 3) {
          const style = actionStyles[action] || { fill: 'FFF3F4F6', fontColor: 'FF1F2937' };
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: style.fill } };
          cell.font = { name: 'Calibri', size: 10, bold: true, color: { argb: style.fontColor } };
          cell.alignment = { horizontal: 'center', vertical: 'top' };
        } else if (colNumber === 7) {
          cell.alignment = { vertical: 'top', horizontal: 'left', wrapText: true };
        } else {
          cell.alignment = { vertical: 'top', horizontal: 'center' };
        }
      });
    });

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const cleanMr = String(patientMr).replace(/[^a-zA-Z0-9_-]/g, '');
    const dateStamp = new Date().toISOString().slice(0, 10);
    link.setAttribute('download', `Audit_Report_${cleanMr}_${dateStamp}.xlsx`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Download filtered Excel Audit report
  const handleDownloadExcel = async () => {
    let filtered = [...logs];

    if (startDate) {
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      filtered = filtered.filter(l => {
        const d = new Date(String(l.timestamp).replace(' ', 'T'));
        return !isNaN(d.getTime()) && d >= start;
      });
    }

    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      filtered = filtered.filter(l => {
        const d = new Date(String(l.timestamp).replace(' ', 'T'));
        return !isNaN(d.getTime()) && d <= end;
      });
    }

    if (actionFilter && actionFilter !== 'ALL') {
      filtered = filtered.filter(l => {
        const act = String(l.action_type || '').toUpperCase();
        if (actionFilter === 'CREATE') return act === 'CREATE' || act === 'CREATION';
        if (actionFilter === 'UPDATE') return act === 'UPDATE' || act === 'UPDATED';
        if (actionFilter === 'DELETE') return act === 'DELETE' || act === 'DELETION';
        if (actionFilter === 'RESTORE') return act === 'RESTORE' || act === 'RESTORED' || act === 'UNDELETE';
        return act === actionFilter;
      });
    }

    if (userFilter && userFilter !== 'ALL') {
      filtered = filtered.filter(l => {
        const u = String(l.username || l.user_id || '');
        return u === userFilter;
      });
    }

    if (filtered.length === 0) {
      alert('No audit logs found matching the selected export filters.');
      return;
    }

    try {
      const response = await api.post(
        '/hf-registry/export-audit-excel',
        {
          logs: filtered,
          patientMr,
          patientName,
          patientId: patientMr,
          startDate,
          endDate,
          actionFilter,
          userFilter
        },
        {
          responseType: 'blob'
        }
      );

      const blob = new Blob([response.data], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      const cleanMr = String(patientMr).replace(/[^a-zA-Z0-9_-]/g, '');
      const dateStamp = new Date().toISOString().slice(0, 10);
      link.setAttribute('download', `Audit_Report_${cleanMr}_${dateStamp}.xlsx`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.warn('Backend export failed or unreachable, generating Excel file via ExcelJS client fallback...', err);
      try {
        await generateClientSideExcel(filtered);
      } catch (fallbackErr) {
        console.error('Error generating Excel report fallback:', fallbackErr);
        alert('Failed to download Excel report. Please try again.');
      }
    }
  };

  // Action badge renderer
  const renderActionBadge = (actionType) => {
    const action = String(actionType).toUpperCase();
    if (action === 'UPDATE') {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-100 border border-amber-300 text-amber-900 font-bold text-xs rounded-full shadow-2xs">
          <RotateCw className="w-3.5 h-3.5 text-amber-700" />
          <span>Update</span>
        </span>
      );
    }
    if (action === 'DELETE' || action === 'DELETION') {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-rose-100 border border-rose-300 text-rose-800 font-bold text-xs rounded-full shadow-2xs">
          <Trash2 className="w-3.5 h-3.5 text-rose-600" />
          <span>Deletion</span>
        </span>
      );
    }
    if (action === 'RESTORE' || action === 'RESTORED' || action === 'UNDELETE') {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-teal-100 border border-teal-300 text-teal-800 font-bold text-xs rounded-full shadow-2xs">
          <RotateCcw className="w-3.5 h-3.5 text-teal-600" />
          <span>Restored</span>
        </span>
      );
    }
    // Default to CREATE / Creation
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-100 border border-emerald-300 text-emerald-800 font-bold text-xs rounded-full shadow-2xs">
        <RotateCcw className="w-3.5 h-3.5 text-emerald-600" />
        <span>Creation</span>
      </span>
    );
  };

  // Format record description text based on registry_type and action_type
  const renderDescriptionText = (log) => {
    const regType = String(log.registry_type || 'Registry').toUpperCase();
    const action = String(log.action_type || '').toUpperCase();
    let recId = log.record_identifier || log.record_id || '—';
    const user = log.username || log.user_id || 'User';

    if (regType === 'HF') {
      if (recId !== '—' && !String(recId).startsWith('HF')) {
        recId = `HF #${recId}`;
      }
    } else if (regType === 'STEMI' || regType === 'NSTEMI') {
      if (recId !== '—' && !String(recId).startsWith('IP')) {
        recId = `IP-${recId}`;
      }
    }

    if (action === 'CREATE' || action === 'CREATION') {
      if (regType === 'HF') {
        return <span className="font-bold text-slate-800">Heart Failure (HF) Record ID: {recId} Created</span>;
      }
      return <span className="font-bold text-slate-800">{regType} Record created with IP No: {recId}</span>;
    }

    if (action === 'DELETE' || action === 'DELETION') {
      if (regType === 'HF') {
        return <span className="font-bold text-rose-700">Heart Failure (HF) Record ID: {recId} has been Deleted</span>;
      }
      return <span className="font-bold text-rose-700">{regType} Record (IP No: {recId}) has been Deleted</span>;
    }

    if (action === 'RESTORE' || action === 'RESTORED' || action === 'UNDELETE') {
      if (regType === 'HF') {
        return <span className="font-bold text-teal-700">{user} restored Heart Failure (HF) Record ID: {recId}</span>;
      }
      return <span className="font-bold text-teal-700">{user} restored {regType} Record (IP No: {recId})</span>;
    }

    if (action === 'UPDATE' || action === 'UPDATED') {
      if (regType === 'HF') {
        return <span className="font-bold text-slate-800">Heart Failure (HF) Record ID: {recId} Updated</span>;
      }
      return <span className="font-bold text-slate-800">{regType} Record (IP No: {recId}) Updated</span>;
    }

    return <span className="font-bold text-slate-800">{user} performed {action} on {regType} Record ({recId})</span>;
  };

  return (
    <div className="w-full bg-white text-slate-800 p-5 sm:p-6 rounded-2xl border border-purple-200/80 shadow-sm space-y-6 font-sans">
      
      {/* AUDIT LOG EXPORT CARD */}
      <div className="bg-purple-50/50 border border-purple-200/90 rounded-2xl p-4 sm:p-5 space-y-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-purple-100 text-purple-700 rounded-xl border border-purple-200 shadow-2xs">
            <FileSpreadsheet className="w-5 h-5 text-purple-700" />
          </div>
          <div>
            <h3 className="text-xs sm:text-sm font-extrabold tracking-wide uppercase text-purple-950 flex items-center gap-2">
              <span>AUDIT LOG EXPORT</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5 font-medium">
              Generate & download filtered .xlsx audit verification reports
            </p>
          </div>
        </div>

        {/* Controls Row: Start Date, End Date, Action Type, User Name, Download Button */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3 items-end pt-1">
          <div>
            <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1 flex items-center gap-1">
              <Calendar className="w-3 h-3 text-purple-600" />
              <span>Start Date</span>
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full bg-white border border-purple-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all shadow-2xs"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1 flex items-center gap-1">
              <Calendar className="w-3 h-3 text-purple-600" />
              <span>End Date</span>
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full bg-white border border-purple-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all shadow-2xs"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1 flex items-center gap-1">
              <Filter className="w-3 h-3 text-purple-600" />
              <span>Action Type</span>
            </label>
            <select
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
              className="w-full bg-white border border-purple-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all shadow-2xs"
            >
              <option value="ALL">All Actions</option>
              <option value="CREATE">Creation</option>
              <option value="UPDATE">Update</option>
              <option value="DELETE">Deletion</option>
              <option value="RESTORE">Restored</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1 flex items-center gap-1">
              <UserCheck className="w-3 h-3 text-purple-600" />
              <span>User Name</span>
            </label>
            <select
              value={userFilter}
              onChange={(e) => setUserFilter(e.target.value)}
              className="w-full bg-white border border-purple-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all shadow-2xs"
            >
              <option value="ALL">All Users</option>
              {availableUsers.map((u) => (
                <option key={u} value={u}>{u}</option>
              ))}
            </select>
          </div>

          <div>
            <button
              onClick={handleDownloadExcel}
              className="w-full bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-extrabold text-xs py-2.5 px-3 rounded-xl shadow-xs hover:shadow transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Download className="w-4 h-4 shrink-0" />
              <span>Download Excel Report</span>
            </button>
          </div>
        </div>
      </div>

      {/* PROMPT NOTE DIRECTLY BELOW AUDIT LOG EXPORT */}
      <div className="bg-purple-50/80 border border-purple-200/90 rounded-xl p-3.5 flex items-start gap-3 shadow-2xs">
        <Info className="w-5 h-5 text-purple-600 shrink-0 mt-0.5" />
        <div className="text-xs text-purple-950 leading-relaxed">
          <span className="font-extrabold text-purple-900 uppercase tracking-wider text-[11px] block sm:inline mr-1">
            ℹ️ Audit Retention Notice:
          </span>
          The Chronological Event Timeline below displays audit log events from the <strong>past 1 week (last 7 days)</strong>.
          To view, query, or export audit logs older than 1 week, please select your desired date range above and click <strong>"Download Excel Report"</strong>.
        </div>
      </div>

      {/* Timeline Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-purple-100 pb-4">
        <div>
          <h2 className="text-sm sm:text-base font-extrabold tracking-wide uppercase text-purple-950 flex flex-wrap items-center gap-2">
            <Shield className="w-4 h-4 text-purple-600 inline-block" />
            <span>CHRONOLOGICAL EVENT TIMELINE</span>
            <span className="text-purple-700/80 font-normal normal-case">
              ({patientName ? `Patient: ${patientName} • ` : ''}MR No: {patientMr})
            </span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Immutable record of modifications, creations, and deletions (showing past 7 days).
          </p>
        </div>

        {/* Timeline Interactive Filters */}
        <div className="flex flex-wrap items-center gap-2 bg-purple-50/70 p-2 rounded-xl border border-purple-200/80">
          <div className="flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-purple-700" />
            <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">Action:</span>
            <select
              value={timelineActionFilter}
              onChange={(e) => setTimelineActionFilter(e.target.value)}
              className="bg-white border border-purple-200 rounded-lg px-2.5 py-1 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500 shadow-2xs"
            >
              <option value="ALL">All Actions</option>
              <option value="CREATE">Creation</option>
              <option value="UPDATE">Update</option>
              <option value="DELETE">Deletion</option>
              <option value="RESTORE">Restored</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5">
            <UserCheck className="w-3.5 h-3.5 text-purple-700" />
            <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">User:</span>
            <select
              value={timelineUserFilter}
              onChange={(e) => setTimelineUserFilter(e.target.value)}
              className="bg-white border border-purple-200 rounded-lg px-2.5 py-1 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500 shadow-2xs"
            >
              <option value="ALL">All Users</option>
              {availableUsers.map((u) => (
                <option key={u} value={u}>{u}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Cards List Container */}
      <div className="space-y-3">
        {timelineLogs.length === 0 ? (
          <div className="text-center py-12 border border-dashed border-purple-200 rounded-xl bg-purple-50/30">
            <Clock className="w-8 h-8 text-purple-400 mx-auto mb-2" />
            <p className="text-xs font-bold text-slate-700">No Audit Trail Records in Past 7 Days</p>
            <p className="text-[11px] text-slate-500 mt-1">
              No modifications recorded within the past week. Use the <strong>Audit Log Export</strong> panel above to query and download older historical logs.
            </p>
          </div>
        ) : (
          timelineLogs.map((log, index) => {
            const parsedChanges = parseChangedFields(log);
            const username = log.username || log.user_id || 'User';
            const isUpdate = String(log.action_type).toUpperCase() === 'UPDATE';

            return (
              <div
                key={log.audit_id || index}
                className="bg-slate-50 hover:bg-slate-100/90 border border-slate-200/90 rounded-xl p-4 transition-all duration-150 shadow-2xs space-y-3"
              >
                {/* Header Row: Timestamp, Action Badge, Description, User */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-3">
                    
                    {/* Timestamp in IST */}
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-purple-900 shrink-0">
                      <Clock className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                      <span>{formatTimestamp(log.timestamp)}</span>
                    </div>

                    {/* Action Badge */}
                    <div className="shrink-0">
                      {renderActionBadge(log.action_type)}
                    </div>

                    {/* Description Title */}
                    <div className="text-xs text-slate-800 font-semibold">
                      {renderDescriptionText(log)}
                    </div>
                  </div>

                  {/* Right Side: User Label */}
                  <div className="flex items-center gap-1.5 text-xs text-slate-700 font-semibold shrink-0 self-end md:self-center bg-white px-3 py-1 rounded-lg border border-slate-200 shadow-2xs">
                    <UserCheck className="w-3.5 h-3.5 text-purple-600" />
                    <span>User: {username}</span>
                  </div>
                </div>

                {/* UPDATE Action: Clean Styled Table for Modified Fields */}
                {isUpdate && parsedChanges.length > 0 && (
                  <div className="overflow-hidden rounded-lg border border-purple-200/80 bg-white shadow-2xs mt-2">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-purple-50/90 border-b border-purple-100 text-[11px] font-bold text-purple-900 uppercase tracking-wider">
                          <th className="py-2.5 px-3.5">Field Modified</th>
                          <th className="py-2.5 px-3.5">Previous Value</th>
                          <th className="py-2.5 px-3.5">New Value</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-purple-50/60 text-slate-800">
                        {parsedChanges.map((change, cIdx) => (
                          <tr key={cIdx} className="hover:bg-purple-50/30 transition-colors">
                            <td className="py-2 px-3.5 font-semibold text-slate-800">
                              {change.field}
                            </td>
                            <td className="py-2 px-3.5">
                              <span className="inline-block px-2.5 py-0.5 bg-slate-100 text-slate-600 rounded border border-slate-200 font-mono text-[11px]">
                                {change.previous !== null && change.previous !== undefined ? String(change.previous) : '—'}
                              </span>
                            </td>
                            <td className="py-2 px-3.5">
                              <span className="inline-block px-2.5 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded font-mono text-[11px] font-bold">
                                {change.new !== null && change.new !== undefined ? String(change.new) : '—'}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Footer Disclaimer */}
      <div className="pt-2 text-center border-t border-purple-100">
        <p className="text-[11px] text-slate-500 font-medium">
          CARE Clinical Registry Portal • Fully verified according to standard guidelines & medical data quality practices.
        </p>
      </div>
    </div>
  );
}
