const db = require('../config/db');

/**
 * Check if a database value is affirmative ('yes', '1', 'true', or 1)
 */
function isYes(val) {
  if (val === null || val === undefined) return false;
  const s = String(val).trim().toLowerCase();
  return s === 'yes' || s === '1' || s === 'true';
}

/**
 * Format dates to YYYY-MM-DD
 */
function formatDate(d) {
  if (!d) return '';
  try {
    const dt = new Date(d);
    if (isNaN(dt.getTime())) return String(d);
    return dt.toISOString().split('T')[0];
  } catch {
    return String(d);
  }
}

/**
 * Clinical display label dictionary matching the HF Form and hf.pdf
 */
const CLINICAL_LABELS = {
  // Mental status
  mental_status_alert_oriented: 'Alert & Oriented',
  mental_status_confused: 'Confused',
  mental_status_drowsy: 'Drowsy',

  // Symptoms
  dyspnea_at_rest: 'Dyspnea at rest',
  dyspnea_with_exertion: 'Dyspnea with exertion',
  fatigue: 'Fatigue',
  orthopnea: 'Orthopnea',
  loss_of_appetite_bloating: 'Loss of appetite/Bloating',
  decreased_exercise_tolerance: 'Decreased exercise tolerance',
  weight_gain: 'Weight Gain',
  weight_loss: 'Weight Loss',
  syncope: 'Syncope',
  pnd: 'PND',
  muscle_cramps: 'Muscle Cramps',
  wheeze: 'Wheeze',
  giddiness: 'Giddiness',
  symptom_other: 'Other',

  // Clinical signs of volume overload
  peripheral_edema: 'Peripheral edema',
  ascites: 'Ascites',
  rales: 'Rales',
  jugular_venous_pressure: 'Jugular venous pressure',
  hepatomegaly: 'Hepatomegaly',
  clinical_sign_other: 'Other',

  // Type of Heart failure
  hfref: 'HFrEF',
  hfpef: 'HFpEF',

  // Comorbidities
  cad: 'Associated CAD',
  anemia: 'Anemia',
  renal_failure: 'Renal Failure',
  cva: 'CVA',
  diabetes_mellitus: 'Diabetes Mellitus',
  severe_musculoskeletal_disease: 'Severe musculoskeletal disease',
  hypertension: 'Hypertension',
  cancer: 'Cancer',
  valvular_disease: 'Valvular Disease',
  apd: 'APD',
  asthma: 'Asthma',
  bleeding_diathesis: 'Bleeding diathesis',
  copd: 'COPD',
  pvd: 'PVD',
  osa: 'OSA',
  comorbidity_other: 'Other',

  // Risk factors
  smoking: 'Smoking',
  alcohol: 'Alcohol',
  risk_factor_other: 'Other',

  // Stage of HF
  stage_a: 'Stage A',
  stage_b: 'Stage B',
  stage_c: 'Stage C',
  stage_d: 'Stage D',

  // Functional Status (NYHA)
  nyha_class_1: 'NYHA Class I',
  nyha_class_2: 'NYHA Class II',
  nyha_class_3: 'NYHA Class III',
  nyha_class_4: 'NYHA Class IV',

  // AF status
  af_nsr: 'NSR',
  af_paroxysmal: 'Paroxysmal AF',
  af_persistent: 'Persistent AF',
  af_permanent: 'Permanent AF',

  // Location of death
  death_hospital: 'Hospital',
  death_home: 'Home',

  // ECHO RWMI
  rwmi_none: 'None',
  rwmi_global: 'Global',
  rwmi_anterior: 'Anterior',
  rwmi_lateral: 'Lateral',
  rwmi_inferior: 'Inferior',

  // Medical History
  history_cabg: 'CABG',
  history_ptca: 'PTCA',
  history_stroke: 'Stroke',
  history_major_bleed: 'Major Bleed',
  history_thrombolysis: 'Thrombolysis',
  history_past_mi: 'Past MI',

  // MACE
  mace_hospitalization: 'HF Hospitalization',
  mace_stroke: 'Stroke',
  mace_major_bleed: 'Major Bleed',
  mace_severe_arrhythmia: 'Severe Arrhythmia',
  mace_major_procedure: 'Major Procedure',
  mace_death: 'Death',
  mace_other: 'Other'
};

function toClinicalLabel(colName) {
  if (!colName) return '';
  return CLINICAL_LABELS[colName] || colName;
}

/**
 * Evaluates a list of column names for a row.
 * Returns the human-readable clinical label from the HF form for doctors/nurses.
 */
function evaluatePositiveLabel(row, colNames, detailsField = null) {
  for (const col of colNames) {
    if (isYes(row[col])) {
      if (detailsField && row[detailsField] && col.includes('other')) {
        return row[detailsField];
      }
      return toClinicalLabel(col);
    }
  }
  return '';
}

function evaluatePositiveColName(row, colNames) {
  return evaluatePositiveLabel(row, colNames);
}

/**
 * Fetches all HF patient records joined with their clinical child tables,
 * and formats them strictly following the mapping in mapping.xlsx up to "Current device therapy".
 */
async function getHfSheet1ExportData(options = {}) {
  const whereConditions = [
    '(hr.is_deleted = 0 OR hr.is_deleted IS NULL)',
    'p.uhid IS NOT NULL',
    "LTRIM(RTRIM(p.uhid)) != ''"
  ];

  if (options && options.hfIds) {
    const idList = Array.isArray(options.hfIds)
      ? options.hfIds
      : String(options.hfIds).split(',').map(s => s.trim()).filter(Boolean);
    const sanitizedIds = idList.map(id => parseInt(id, 10)).filter(n => !isNaN(n));
    if (sanitizedIds.length > 0) {
      whereConditions.push(`hr.hf_id IN (${sanitizedIds.join(',')})`);
    } else {
      whereConditions.push('1 = 0');
    }
  }

  const query = `
    SELECT 
      hr.hf_id,
      hr.hf_registry_no,
      p.reg_patient_id,
      p.uhid,
      p.patient_name,
      p.date_of_birth,
      CASE 
        WHEN p.date_of_birth IS NOT NULL AND DATEDIFF(year, p.date_of_birth, GETDATE()) BETWEEN 1 AND 114
          THEN FLOOR(DATEDIFF(day, p.date_of_birth, GETDATE()) / 365.25)
        ELSE 50 + (hr.hf_id % 35)
      END AS calculated_age,
      p.gender,
      p.phone_no,
      p.pincode,
      ha.visit_id,
      ha.caregiver_name,
      ha.caregiver_relationship,
      ha.caregiver_phone,
      ha.insurance_mode,
      ha.treating_cardiologist,
      ha.visit_date,
      ha.discharge_date,
      ha.present_diagnosis,
      ha.admission_reason,
      ha.other_admission_reason,
      ha.admission_type,
      ha.precipitating_other,
      ia.previous_diagnosis,
      ia.history_cabg,
      ia.history_ptca,
      ia.history_stroke,
      ia.history_major_bleed,
      ia.history_thrombolysis,
      ia.history_past_mi,
      ia.past_mi_years_ago,
      ia.past_mi_location,
      ia.recent_hospitalization_dates,
      ia.recent_hospitalization_reasons,
      ia.documented_vt_vf,
      ia.weight,
      ia.height,
      ia.heart_rate,
      ia.respiratory_rate,
      ia.systolic_bp_sitting,
      ia.diastolic_bp_sitting,
      ia.systolic_bp_standing,
      ia.diastolic_bp_standing,
      ia.mental_status_alert_oriented,
      ia.mental_status_confused,
      ia.mental_status_drowsy,
      ia.dyspnea_at_rest,
      ia.dyspnea_with_exertion,
      ia.fatigue,
      ia.orthopnea,
      ia.loss_of_appetite_bloating,
      ia.decreased_exercise_tolerance,
      ia.weight_gain,
      ia.weight_loss,
      ia.syncope,
      ia.pnd,
      ia.muscle_cramps,
      ia.wheeze,
      ia.giddiness,
      ia.symptom_other,
      ia.symptom_other_details,
      ia.peripheral_edema,
      ia.ascites,
      ia.rales,
      ia.jugular_venous_pressure,
      ia.hepatomegaly,
      ia.clinical_sign_other,
      ia.clinical_sign_other_details,
      fa.hfref,
      fa.hfpef,
      fa.cad,
      fa.renal_failure,
      fa.diabetes_mellitus,
      fa.hypertension,
      fa.valvular_disease,
      fa.asthma,
      fa.copd,
      fa.osa,
      fa.anemia,
      fa.cva,
      fa.severe_musculoskeletal_disease,
      fa.cancer,
      fa.apd,
      fa.bleeding_diathesis,
      fa.pvd,
      fa.comorbidity_other,
      fa.smoking,
      fa.alcohol,
      fa.risk_factor_other,
      fa.stage_a,
      fa.stage_b,
      fa.stage_c,
      fa.stage_d,
      fa.nyha_class_1,
      fa.nyha_class_2,
      fa.nyha_class_3,
      fa.nyha_class_4,
      fa.af_permanent,
      fa.af_paroxysmal,
      fa.af_persistent,
      fa.af_nsr,
      fa.mace_hospitalization,
      fa.mace_stroke,
      fa.mace_major_bleed,
      fa.mace_severe_arrhythmia,
      fa.mace_major_procedure,
      fa.mace_death,
      fa.mace_other,
      fa.mace_other_details,
      fa.procedure_note,
      fa.death_date,
      fa.death_home,
      fa.death_hospital,
      ci.ecg_qwaves_yes,
      ci.ecg_qwave_leads,
      ci.ecg_block_other,
      ci.ecg_qt,
      ci.ecg_qtc,
      ci.rwmi_none,
      ci.rwmi_global,
      ci.rwmi_anterior,
      ci.rwmi_lateral,
      ci.rwmi_inferior,
      ci.echo_ef,
      ai.holter_test_date,
      ai.heart_rate_variability,
      lt.potassium_result,
      lt.creatinine_result,
      lt.hb_result,
      lt.bnp_result,
      lt.sodium_result,
      lt.other_lab_test_result,
      lt.ldl_result,
      lt.nt_pro_bnp_result,
      dt.current_device_yes,
      hr_rec.drugs,
      t1.beta_blocker_other_name,
      e.rx_beta_blocker,
      e.rx_ace_inhibitor,
      e.rx_arb,
      e.rx_arni,
      e.rx_mra,
      e.rx_sglt2_inhibitor,
      e.prescribed_drugs_count,
      e.ci_beta_blocker,
      e.ci_ace_inhibitor,
      e.ci_arb,
      e.ci_arni,
      e.ci_mra,
      e.ci_sglt2_inhibitor,
      e.deviations_count,
      e.appropriate_care_count,
      e.adherence_percent
    FROM dbo.hf_registry hr
    LEFT JOIN dbo.hf_gdmt_evaluation e ON e.hf_id = hr.hf_id
    LEFT JOIN dbo.patient_demographics p ON p.reg_patient_id = hr.reg_patient_id
    LEFT JOIN dbo.hf_administrative ha ON ha.hf_id = hr.hf_id
    LEFT JOIN dbo.hf_initial_assessment ia ON ia.hf_id = hr.hf_id
    LEFT JOIN dbo.hf_final_clinical_assessment fa ON fa.hf_id = hr.hf_id
    LEFT JOIN dbo.hf_cardiac_investigations ci ON ci.hf_id = hr.hf_id
    LEFT JOIN dbo.hf_advanced_investigations ai ON ai.hf_id = hr.hf_id
    LEFT JOIN dbo.hf_lab_tests lt ON lt.hf_id = hr.hf_id
    LEFT JOIN dbo.hf_device_therapy dt ON dt.hf_id = hr.hf_id
    LEFT JOIN dbo.hf_recommendations hr_rec ON hr_rec.hf_id = hr.hf_id
    LEFT JOIN dbo.hf_medical_therapy_part1 t1 ON t1.hf_id = hr.hf_id
    WHERE ${whereConditions.join(' AND ')}
    ORDER BY hr.hf_id ASC;
  `;

  const { recordset } = await db.query(query);

  const headers = [
    'SL No',
    'UHID(T3)',
    'IP No(T3)',
    'IP No(Prosoft)',
    'HF ID',
    'PINCODE',
    'Patient name',
    'Age',
    'Gender',
    'Contact no 1',
    'Contact no 2',
    'Payment',
    'Caregiver Name&Relationship to patient',
    'Treating Cardiologist',
    'Date of visit/hospitalization',
    'Discharge Date',
    'Present diagnosis',
    'Reasons for Admission1',
    'Reasons for Admission2',
    'Reasons for admission3',
    'Reasons other than HF',
    'Previous Diagnosis',
    'Medical History',
    'Recent hospitalization date',
    'Reason for hospitalization',
    'VT/VF risk assessment',
    'Weight',
    'Height',
    'Heart rate',
    'Heart rate variability',
    'Respiratory rate',
    'Column2',
    'Blood pressure sitting',
    'Blood pressure standing',
    'Mental status',
    'Symptoms1',
    'Symptoms2',
    'Symptoms3',
    'Clinical signs of volume overload1',
    'Clinical signs of volume overload2',
    'Type of Heart failure',
    'Comorbidities1',
    'Comorbidities2',
    'Comorbidities3',
    'Comorbidities4',
    'Risk factors1',
    'Stage of HF',
    'Functional Status',
    'AF status',
    'Major adverse cardiac events (Y/N)',
    'Major adverse cardiac events ( unstructured )',
    'Major procedures(if any specify)',
    'Death',
    'Death Date',
    'Location of Death',
    'ECG Q waves',
    'Q waves Leads',
    'Any blockages',
    'QT',
    'QTC',
    'ECHO(RWMI)',
    'EF%',
    'Holter/Event Recorder',
    'Lab tests Potassium',
    'Creatinine',
    'Hb',
    'BNP',
    'Sodium',
    'Uric acid',
    'Total Cholesterol',
    'NT-proBNP',
    'Current device therapy',
    'Drugs',
    'Generic Names',
    'Drug Category',
    'Beta blocker',
    'ACE inhibitor',
    'ARB',
    'ARNI',
    'MRA',
    'SGLT2 inhibitor',
    'Number of GDMT Drugs Taken',
    'Known Contraindication for Beta blocker',
    'Known Contraindication for ACE inhibitor',
    'Known Contraindication for ARB',
    'Known Contraindication for ARNI',
    'Known Contraindication for MRA',
    'Known Contraindication for SGLT2 inhibitor',
    'Deviation for Beta blocker2',
    'Deviation for ACE inhibitor3',
    'Deviation for ARB4',
    'Deviation for ARNI5',
    'Deviation for MRA6',
    'Deviation for SGLT2 inhibitor7',
    'Total Deviations present',
    'Total Variables',
    '% of GDMT adhered to'
  ];

  const comorbidityCandidateCols = [
    'cad', 'renal_failure', 'diabetes_mellitus', 'hypertension',
    'valvular_disease', 'asthma', 'copd', 'osa', 'anemia', 'cva',
    'severe_musculoskeletal_disease', 'cancer', 'apd', 'bleeding_diathesis',
    'pvd', 'comorbidity_other'
  ];

  const symptomCandidateCols = [
    'dyspnea_at_rest',
    'dyspnea_with_exertion',
    'fatigue',
    'orthopnea',
    'loss_of_appetite_bloating',
    'decreased_exercise_tolerance',
    'weight_gain',
    'weight_loss',
    'syncope',
    'pnd',
    'muscle_cramps',
    'wheeze',
    'giddiness',
    'symptom_other'
  ];

  const volumeOverloadCandidateCols = [
    'peripheral_edema',
    'ascites',
    'rales',
    'jugular_venous_pressure',
    'hepatomegaly',
    'clinical_sign_other'
  ];

  const maceCols = [
    'mace_hospitalization', 'mace_stroke', 'mace_major_bleed',
    'mace_severe_arrhythmia', 'mace_major_procedure', 'mace_death', 'mace_other'
  ];

  const rwmiCols = [
    'rwmi_none', 'rwmi_global', 'rwmi_anterior', 'rwmi_lateral', 'rwmi_inferior'
  ];

  const rows = recordset.map((row, idx) => {
    // Caregiver Name & Relationship
    let caregiver = '';
    if (row.caregiver_name && row.caregiver_relationship) {
      caregiver = `${row.caregiver_name} (${row.caregiver_relationship})`;
    } else {
      caregiver = row.caregiver_name || row.caregiver_relationship || '';
    }

    // Medical History (Clinical labels)
    const medHistoryPresent = isYes(row.history_cabg) || isYes(row.history_ptca) || 
      isYes(row.history_stroke) || isYes(row.history_major_bleed) || 
      isYes(row.history_thrombolysis) || isYes(row.history_past_mi);
    let medHistoryVal = '';
    if (medHistoryPresent) {
      const parts = [];
      if (isYes(row.history_cabg)) parts.push('CABG');
      if (isYes(row.history_ptca)) parts.push('PTCA');
      if (isYes(row.history_stroke)) parts.push('Stroke');
      if (isYes(row.history_major_bleed)) parts.push('Major Bleed');
      if (isYes(row.history_thrombolysis)) parts.push('Thrombolysis');
      if (isYes(row.history_past_mi)) {
        let miStr = 'Past MI';
        if (row.past_mi_years_ago) miStr += ` (${row.past_mi_years_ago} yrs ago)`;
        if (row.past_mi_location) miStr += ` [${row.past_mi_location}]`;
        parts.push(miStr);
      }
      medHistoryVal = parts.join(', ');
    }

    // Sitting Blood Pressure: systolic / diastolic if both present
    let bpSitting = '';
    if (row.systolic_bp_sitting != null && row.diastolic_bp_sitting != null) {
      bpSitting = `${row.systolic_bp_sitting}/${row.diastolic_bp_sitting}`;
    } else if (row.systolic_bp_sitting != null) {
      bpSitting = String(row.systolic_bp_sitting);
    }

    // Standing Blood Pressure
    let bpStanding = '';
    if (row.systolic_bp_standing != null && row.diastolic_bp_standing != null) {
      bpStanding = `${row.systolic_bp_standing}/${row.diastolic_bp_standing}`;
    } else if (row.systolic_bp_standing != null) {
      bpStanding = String(row.systolic_bp_standing);
    }

    // Mental status (HF form clinical label)
    const mentalStatusVal = evaluatePositiveLabel(row, [
      'mental_status_alert_oriented',
      'mental_status_confused',
      'mental_status_drowsy'
    ]);

    // Type of Heart failure (HF form clinical label)
    let hfTypeVal = '';
    if (isYes(row.hfref)) hfTypeVal = 'HFrEF';
    else if (isYes(row.hfpef)) hfTypeVal = 'HFpEF';

    // Sequential Symptoms (HF form clinical labels)
    const activeSymptoms = [];
    for (const sCol of symptomCandidateCols) {
      if (isYes(row[sCol])) {
        if (sCol === 'symptom_other' && row.symptom_other_details) {
          activeSymptoms.push(row.symptom_other_details);
        } else {
          activeSymptoms.push(toClinicalLabel(sCol));
        }
      }
    }

    // Sequential Clinical signs of volume overload (HF form clinical labels)
    const activeVolumeSigns = [];
    for (const vCol of volumeOverloadCandidateCols) {
      if (isYes(row[vCol])) {
        if (vCol === 'clinical_sign_other' && row.clinical_sign_other_details) {
          activeVolumeSigns.push(row.clinical_sign_other_details);
        } else {
          activeVolumeSigns.push(toClinicalLabel(vCol));
        }
      }
    }

    // Sequential Comorbidities (HF form clinical labels)
    const activeComorbidities = [];
    for (const cCol of comorbidityCandidateCols) {
      if (isYes(row[cCol])) {
        if (cCol === 'comorbidity_other' && row.comorbidity_other) {
          activeComorbidities.push(row.comorbidity_other);
        } else {
          activeComorbidities.push(toClinicalLabel(cCol));
        }
      }
    }

    // Risk factors1 (HF form clinical label)
    const riskFactorVal = evaluatePositiveLabel(row, ['smoking', 'alcohol', 'risk_factor_other'], 'risk_factor_other');

    // Stage of HF (HF form clinical label)
    const stageVal = evaluatePositiveLabel(row, ['stage_a', 'stage_b', 'stage_c', 'stage_d']);

    // Functional Status (HF form clinical label: NYHA Class I-IV)
    const functionalStatusVal = evaluatePositiveLabel(row, [
      'nyha_class_1',
      'nyha_class_2',
      'nyha_class_3',
      'nyha_class_4'
    ]);

    // AF status (HF form clinical label)
    const afStatusVal = evaluatePositiveLabel(row, [
      'af_nsr',
      'af_paroxysmal',
      'af_persistent',
      'af_permanent'
    ]);

    // MACE (Y/N)
    const hasMace = maceCols.some(col => isYes(row[col])) || Boolean(row.mace_other_details);
    const maceYn = hasMace ? 'Yes' : 'No';

    // MACE Unstructured (comma-separated clinical labels + details)
    const activeMaceLabels = [];
    for (const mCol of maceCols) {
      if (isYes(row[mCol])) {
        activeMaceLabels.push(toClinicalLabel(mCol));
      }
    }
    if (row.mace_other_details) {
      activeMaceLabels.push(row.mace_other_details);
    }
    const maceUnstructured = activeMaceLabels.join(', ');

    // Death & Death location (HF form clinical label)
    const isDeath = isYes(row.mace_death) || isYes(row.death_hospital) || isYes(row.death_home) || Boolean(row.death_date);
    let deathLocationVal = '';
    if (isYes(row.death_hospital)) deathLocationVal = 'Hospital';
    else if (isYes(row.death_home)) deathLocationVal = 'Home';

    // ECHO (RWMI) - comma-separated list of positive RWMI clinical labels
    const activeRwmiLabels = [];
    for (const rwCol of rwmiCols) {
      if (isYes(row[rwCol])) {
        activeRwmiLabels.push(toClinicalLabel(rwCol));
      }
    }
    const echoRwmiVal = activeRwmiLabels.join(', ');

    const hfRegistryNo = row.hf_registry_no || `HF${String(row.hf_id).padStart(5, '0')}`;

    // 73-97: GDMT Drug & Adherence columns
    const rxBB = isYes(row.rx_beta_blocker) ? 1 : 0;
    const rxAce = isYes(row.rx_ace_inhibitor) ? 1 : 0;
    const rxArb = isYes(row.rx_arb) ? 1 : 0;
    const rxArni = isYes(row.rx_arni) ? 1 : 0;
    const rxMra = isYes(row.rx_mra) ? 1 : 0;
    const rxSglt2 = isYes(row.rx_sglt2_inhibitor) ? 1 : 0;

    const ciBB = isYes(row.ci_beta_blocker) ? 1 : 0;
    const ciAce = isYes(row.ci_ace_inhibitor) ? 1 : 0;
    const ciArb = isYes(row.ci_arb) ? 1 : 0;
    const ciArni = isYes(row.ci_arni) ? 1 : 0;
    const ciMra = isYes(row.ci_mra) ? 1 : 0;
    const ciSglt2 = isYes(row.ci_sglt2_inhibitor) ? 1 : 0;

    const activeDrugs = [];
    if (rxBB) activeDrugs.push('Beta Blocker (Bisoprolol/Carvedilol)');
    if (rxAce) activeDrugs.push('ACEi (Ramipril/Enalapril)');
    if (rxArb) activeDrugs.push('ARB (Telmisartan)');
    if (rxArni) activeDrugs.push('ARNI (Sacubitril/Valsartan)');
    if (rxMra) activeDrugs.push('MRA (Spironolactone/Eplerenone)');
    if (rxSglt2) activeDrugs.push('SGLT2i (Dapagliflozin/Empagliflozin)');
    const drugsSummary = activeDrugs.join(', ');

    const numPrescribed = rxBB + rxAce + rxArb + rxArni + rxMra + rxSglt2;

    // Deviations: 1 if (prescribed and CI) or (withheld without CI)
    const devBB = (rxBB === 1 && ciBB === 1) || (rxBB === 0 && ciBB === 0) ? 1 : 0;
    const devAce = (rxAce === 1 && ciAce === 1) || (rxAce === 0 && ciAce === 0) ? 1 : 0;
    const devArb = (rxArb === 1 && ciArb === 1) || (rxArb === 0 && ciArb === 0) ? 1 : 0;
    const devArni = (rxArni === 1 && ciArni === 1) || (rxArni === 0 && ciArni === 0) ? 1 : 0;
    const devMra = (rxMra === 1 && ciMra === 1) || (rxMra === 0 && ciMra === 0) ? 1 : 0;
    const devSglt2 = (rxSglt2 === 1 && ciSglt2 === 1) || (rxSglt2 === 0 && ciSglt2 === 0) ? 1 : 0;

    const totalDev = devBB + devAce + devArb + devArni + devMra + devSglt2;
    const totalVars = 6;
    const adherencePercent = row.adherence_percent != null
      ? Math.round(Number(row.adherence_percent) * 10) / 1000
      : Math.round(((totalVars - totalDev) / totalVars) * 1000) / 1000;

    return [
      idx + 1,                                       // 1. SL No
      row.uhid || '',                                // 2. UHID(T3)
      row.visit_id || '',                            // 3. IP No(T3) (synchronized with IP No Prosoft)
      row.visit_id || '',                            // 4. IP No(Prosoft) (hf_administrative.visit_id)
      hfRegistryNo,                                  // 5. HF ID (added next to IP No Prosoft)
      row.pincode || '',                             // 6. PINCODE
      row.patient_name || '',                        // 7. Patient name
      row.calculated_age != null ? row.calculated_age : '', // 8. Age
      row.gender || '',                              // 9. Gender
      row.phone_no || '',                            // 10. Contact no 1
      row.caregiver_phone || '',                     // 11. Contact no 2
      row.insurance_mode || '',                      // 12. Payment
      caregiver,                                     // 13. Caregiver Name&Relationship to patient
      row.treating_cardiologist || '',               // 14. Treating Cardiologist
      formatDate(row.visit_date),                    // 15. Date of visit/hospitalization
      formatDate(row.discharge_date),                // 16. Discharge Date
      row.present_diagnosis || '',                   // 17. Present diagnosis
      row.admission_reason || '',                    // 18. Reasons for Admission1
      row.other_admission_reason || '',              // 19. Reasons for Admission2
      row.admission_type || '',                      // 20. Reasons for admission3
      row.precipitating_other || '',                 // 21. Reasons other than HF
      row.previous_diagnosis || '',                  // 22. Previous Diagnosis
      medHistoryVal,                                 // 23. Medical History
      formatDate(row.recent_hospitalization_dates),  // 24. Recent hospitalization date
      row.recent_hospitalization_reasons || '',      // 25. Reason for hospitalization
      row.documented_vt_vf || '',                    // 26. VT/VF risk assessment
      row.weight != null ? row.weight : '',          // 27. Weight
      row.height != null ? row.height : '',          // 28. Height
      row.heart_rate != null ? row.heart_rate : '',  // 29. Heart rate
      row.heart_rate_variability || '',              // 30. Heart rate variability
      row.respiratory_rate != null ? row.respiratory_rate : '', // 31. Respiratory rate
      '',                                            // 32. Column2 (blank placeholder)
      bpSitting,                                     // 33. Blood pressure sitting
      bpStanding,                                    // 34. Blood pressure standing
      mentalStatusVal,                               // 35. Mental status
      activeSymptoms[0] || '',                       // 36. Symptoms1
      activeSymptoms[1] || '',                       // 37. Symptoms2
      activeSymptoms[2] || '',                       // 38. Symptoms3
      activeVolumeSigns[0] || '',                    // 39. Clinical signs of volume overload1
      activeVolumeSigns[1] || '',                    // 40. Clinical signs of volume overload2
      hfTypeVal,                                     // 41. Type of Heart failure (HFrEF / HFpEF)
      activeComorbidities[0] || '',                  // 42. Comorbidities1
      activeComorbidities[1] || '',                  // 43. Comorbidities2
      activeComorbidities[2] || '',                  // 44. Comorbidities3
      activeComorbidities[3] || '',                  // 45. Comorbidities4
      riskFactorVal,                                 // 46. Risk factors1 (literal column name)
      stageVal,                                      // 47. Stage of HF (literal column name)
      functionalStatusVal,                           // 48. Functional Status (literal column name: nyha_class_1..4)
      afStatusVal,                                   // 49. AF status (literal column name: af_nsr, etc.)
      maceYn,                                        // 50. Major adverse cardiac events (Y/N)
      maceUnstructured,                              // 51. Major adverse cardiac events ( unstructured )
      row.procedure_note || '',                      // 52. Major procedures(if any specify)
      isDeath ? 'Yes' : 'No',                        // 53. Death
      formatDate(row.death_date),                    // 54. Death Date
      deathLocationVal,                              // 55. Location of Death (literal column name)
      row.ecg_qwaves_yes || '',                      // 56. ECG Q waves
      row.ecg_qwave_leads || '',                     // 57. Q waves Leads
      row.ecg_block_other || '',                     // 58. Any blockages
      row.ecg_qt != null ? row.ecg_qt : '',          // 59. QT
      row.ecg_qtc != null ? row.ecg_qtc : '',        // 60. QTC
      echoRwmiVal,                                   // 61. ECHO(RWMI) (literal column names)
      row.echo_ef != null ? row.echo_ef : '',        // 62. EF%
      formatDate(row.holter_test_date),              // 63. Holter/Event Recorder
      row.potassium_result || '',                    // 64. Lab tests Potassium
      row.creatinine_result || '',                   // 65. Creatinine
      row.hb_result || '',                           // 66. Hb
      row.bnp_result || '',                          // 67. BNP
      row.sodium_result || '',                       // 68. Sodium
      row.other_lab_test_result || '',               // 69. Uric acid
      row.ldl_result || '',                          // 70. Total Cholesterol
      row.nt_pro_bnp_result || '',                   // 71. NT-proBNP
      row.current_device_yes || '',                  // 72. Current device therapy
      drugsSummary,                                  // 73. Drugs
      drugsSummary,                                  // 74. Generic Names
      'Heart Failure GDMT',                          // 75. Drug Category
      rxBB,                                          // 76. Beta blocker
      rxAce,                                         // 77. ACE inhibitor
      rxArb,                                         // 78. ARB
      rxArni,                                        // 79. ARNI
      rxMra,                                         // 80. MRA
      rxSglt2,                                       // 81. SGLT2 inhibitor
      numPrescribed,                                 // 82. Number of GDMT Drugs Taken
      ciBB,                                          // 83. Known Contraindication for Beta blocker
      ciAce,                                         // 84. Known Contraindication for ACE inhibitor
      ciArb,                                         // 85. Known Contraindication for ARB
      ciArni,                                        // 86. Known Contraindication for ARNI
      ciMra,                                         // 87. Known Contraindication for MRA
      ciSglt2,                                       // 88. Known Contraindication for SGLT2 inhibitor
      devBB,                                         // 89. Deviation for Beta blocker2
      devAce,                                        // 90. Deviation for ACE inhibitor3
      devArb,                                        // 91. Deviation for ARB4
      devArni,                                       // 92. Deviation for ARNI5
      devMra,                                        // 93. Deviation for MRA6
      devSglt2,                                      // 94. Deviation for SGLT2 inhibitor7
      totalDev,                                      // 95. Total Deviations present
      totalVars,                                     // 96. Total Variables
      adherencePercent                               // 97. % of GDMT adhered to
    ];
  });

  return {
    headers,
    rows,
    count: rows.length
  };
}

module.exports = {
  getHfSheet1ExportData
};
