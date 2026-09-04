import React, { useState, forwardRef, useImperativeHandle, useMemo } from 'react';
import { Sparkles } from 'lucide-react';
import SectionCard from './common/SectionCard';
import { LABEL_STYLES, INPUT_DISABLED_STYLES } from './common/formStyles';

const proceduresList = [
  { label: 'Indication for ICCU admission', key: 'appr_iccu_admission' },
  { label: 'ICCU transfer-out', key: 'appr_iccu_transfer_out' },
  { label: 'Indication for TLT', key: 'appr_thrombolysis_indication' },
  { label: 'Indication for PTCA', key: 'appr_ptca_indication' },
  { label: 'Indication for Invasive monitoring', key: 'appr_invasive_monitoring' },
  { label: 'Indication for IABP', key: 'appr_iabp_indication' },
  { label: 'Indication for Invasive Ventilation', key: 'appr_invasive_ventilation' },
  { label: 'Indication for dialysis', key: 'appr_dialysis_indication' },
  { label: 'Any other procedure', key: 'appr_other_procedure_appropriateness', specifyKey: 'appr_other_procedure_name' }
];

const investigationsList = [
  { label: 'Cardiac enzymes', key: 'appr_cardiac_enzymes' },
  { label: 'BNP', key: 'appr_bnp' },
  { label: 'CRP', key: 'appr_crp' },
  { label: 'Lipid Profile', key: 'appr_lipid_profile' },
  { label: 'Bed-side Echo', key: 'appr_bedside_echo' },
  { label: 'CXR', key: 'appr_chest_xray' }
];

const drugsList = [
  { label: 'Beta-blockers', key: 'appr_beta_blockers' },
  { label: 'Aspirin', key: 'appr_aspirin' },
  { label: 'Clopidigrel', key: 'appr_clopidogrel' },
  { label: 'ACE-inhibitor', key: 'appr_ace_inhibitor' },
  { label: 'ARB', key: 'appr_arb' },
  { label: 'Statin', key: 'appr_statin' },
  { label: 'Diuretic', key: 'appr_diuretic' },
  { label: 'Lanoxin', key: 'appr_lanoxin' },
  { label: 'Anticoagulant', key: 'appr_anticoagulant' },
  { label: 'Amiodarone', key: 'appr_amiodarone' },
  { label: 'Any other', key: 'appr_other_drug_appropriateness', specifyKey: 'appr_other_drug_name' }
];

/**
 * Calculates the expected follow-up date by adding months to a base date.
 * If the resulting date falls on a Sunday (day 0), it shifts it forward to Monday (+1 day).
 */
export const calculateExpectedDate = (baseDate, monthsToAdd) => {
  if (!baseDate) return null;
  const d = new Date(baseDate);
  if (isNaN(d.getTime())) return null;

  d.setMonth(d.getMonth() + monthsToAdd);

  // If Sunday (0), shift to Monday (+1 day)
  if (d.getDay() === 0) {
    d.setDate(d.getDate() + 1);
  }

  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * Formats an ISO date string (YYYY-MM-DD) into user-friendly 'DD-MM-YYYY' format.
 */
export const formatDisplayDate = (dateStr) => {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '';
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}-${month}-${year}`;
};

const getFollowupInitialState = (followupArray) => {
  const state = {
    angina_1m: 'No', angina_3m: 'No', angina_6m: 'No', angina_12m: 'No',
    func_1m: 'None', func_3m: 'None', func_6m: 'None', func_12m: 'None',
    antiang_1m: '', antiang_3m: '', antiang_6m: '', antiang_12m: '',
    dapt_1m: 'No', dapt_3m: 'No', dapt_6m: 'No', dapt_12m: 'No',
    statin_1m: 'No', statin_3m: 'No', statin_6m: 'No', statin_12m: 'No',
    beta_1m: 'No', beta_3m: 'No', beta_6m: 'No', beta_12m: 'No',
    ace_1m: 'No', ace_3m: 'No', ace_6m: 'No', ace_12m: 'No',
    aldo_1m: 'No', aldo_3m: 'No', aldo_6m: 'No', aldo_12m: 'No',
    acs_1m: 'No', acs_3m: 'No', acs_6m: 'No', acs_12m: 'No',
    ptca_1m: 'No', ptca_3m: 'No', ptca_6m: 'No', ptca_12m: 'No',
    cabg_1m: 'No', cabg_3m: 'No', cabg_6m: 'No', cabg_12m: 'No',
    death_1m: 'No', death_3m: 'No', death_6m: 'No', death_12m: 'No',
    other_1m: '', other_3m: '', other_6m: '', other_12m: ''
  };

  if (!followupArray || !Array.isArray(followupArray)) return state;

  const mapping = {
    '1-Month': '1m',
    '3-Month': '3m',
    '6-Month': '6m',
    '12-Month': '12m'
  };

  followupArray.forEach(row => {
    const key = mapping[row.followup_month];
    if (key) {
      state[`angina_${key}`] = row.angina || 'No';
      state[`func_${key}`] = row.functional_class || 'None';
      state[`antiang_${key}`] = row.number_of_antianginals !== null && row.number_of_antianginals !== undefined ? String(row.number_of_antianginals) : '';
      state[`dapt_${key}`] = row.dual_antiplatelets || 'No';
      state[`statin_${key}`] = row.statins || 'No';
      state[`beta_${key}`] = row.beta_blocker || 'No';
      state[`ace_${key}`] = row.acei_arb || 'No';
      state[`aldo_${key}`] = row.aldosterone_antagonist || 'No';
      state[`acs_${key}`] = row.acs_hospitalization || 'No';
      state[`ptca_${key}`] = row.ptca || 'No';
      state[`cabg_${key}`] = row.cabg || 'No';
      state[`death_${key}`] = row.death || 'No';
      state[`other_${key}`] = row.other_event || '';
    }
    if (row.visit_mode && !state.visit_mode) {
      state.visit_mode = row.visit_mode;
    }
    if (row.special_instructions && !state.special_instructions) {
      state.special_instructions = row.special_instructions;
    }
  });

  return state;
};

const NSTEMIForm = forwardRef(function NSTEMIForm(
  { patientRecord, patient: directPatient, editingRecord },
  ref
) {
  const patient = patientRecord?.patient || directPatient || patientRecord || {};

  const patientAge = useMemo(() => {
    const dobVal = patient.dob || patient.date_of_birth;
    if (!dobVal) return patient.age || 0;
    const birthDate = new Date(dobVal);
    if (isNaN(birthDate.getTime())) return patient.age || 0;
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return isNaN(age) ? (patient.age || 0) : age;
  }, [patient.dob, patient.date_of_birth, patient.age]);

  // Initial State mapping precisely to database schemas and UI form elements
  const [formData, setFormData] = useState({
    // Demographic Information
    reg_patient_id: patient.id || patient.reg_patient_id || 1,
    acs_no: editingRecord?.acs_no || '',
    ip_no: editingRecord?.ip_no || '',
    admission_date: editingRecord?.admission_date || new Date().toISOString().split('T')[0],
    discharge_date: editingRecord?.discharge_date || '',
    primary_consultant: editingRecord?.primary_consultant || 'Dr. K. Sridhar (Cardiologist)',

    // Background: Yes/No/Unknown (using 'Yes' / 'No' / 'Unknown' strings)
    hypertension: editingRecord?.hypertension ?? editingRecord?.administrative?.hypertension ?? 'Unknown',
    diabetes: editingRecord?.diabetes ?? editingRecord?.administrative?.diabetes ?? 'Unknown',
    smoking: editingRecord?.smoking ?? editingRecord?.administrative?.smoking ?? 'Unknown',
    renal_failure: editingRecord?.renal_failure ?? editingRecord?.administrative?.renal_failure ?? 'Unknown',
    copd: editingRecord?.copd ?? editingRecord?.administrative?.copd ?? 'Unknown',
    cva: editingRecord?.cva ?? editingRecord?.administrative?.cva ?? 'Unknown',
    prior_acs: editingRecord?.prior_acs ?? editingRecord?.administrative?.prior_acs ?? 'Unknown',
    prior_ptca: editingRecord?.prior_ptca ?? editingRecord?.administrative?.prior_ptca ?? 'Unknown',
    prior_cabg: editingRecord?.prior_cabg ?? editingRecord?.administrative?.prior_cabg ?? 'Unknown',
    other_background: editingRecord?.other_background ?? editingRecord?.administrative?.other_background ?? '',

    // Presentation: Yes/No
    typical_angina: editingRecord?.typical_angina || 'Yes',
    atypical_chest_pain: editingRecord?.atypical_chest_pain || 'No',
    breathlessness: editingRecord?.breathlessness || 'No',
    syncope_presyncope: editingRecord?.syncope_presyncope || 'No',
    pulse_rate: editingRecord?.pulse_rate || '',
    systolic_bp: editingRecord?.systolic_bp || '',
    diastolic_bp: editingRecord?.diastolic_bp || '',

    // Risk Stratification- TIMI Risk score: Points
    age_gt_75: editingRecord?.age_gt_75 || (patientAge >= 75 ? 'Yes' : 'No'),
    age_65_to_74: editingRecord?.age_65_to_74 || (patientAge >= 65 && patientAge < 75 ? 'Yes' : 'No'),
    history_dm_htn_angina: editingRecord?.history_dm_htn_angina || 'No',
    sbp_lt_100: editingRecord?.sbp_lt_100 || 'No',
    heart_rate_gt_100: editingRecord?.heart_rate_gt_100 || 'No',
    killip_class_ii_to_iv: editingRecord?.killip_class_ii_to_iv || 'No',
    anterior_mi_or_lbbb: editingRecord?.anterior_mi_or_lbbb || 'No',
    weight_lt_67kg: editingRecord?.weight_lt_67kg || 'No',
    reperfusion_gt_4hrs: editingRecord?.reperfusion_gt_4hrs || 'No',
    chd_risk_factors_ge_3: editingRecord?.chd_risk_factors_ge_3 || 'No',
    prior_coronary_stenosis_gt_50: editingRecord?.prior_coronary_stenosis_gt_50 || 'No',
    st_deviation_at_admission: editingRecord?.st_deviation_at_admission || 'No',
    anginal_episodes_ge_2_last_24hrs: editingRecord?.anginal_episodes_ge_2_last_24hrs || 'No',
    elevated_serum_cardiac_markers: editingRecord?.elevated_serum_cardiac_markers || 'Yes',
    timi_total_score: editingRecord?.timi_total_score || 1,

    // Other Risk Factors: Yes/No
    lvf: editingRecord?.lvf || 'No',
    vt_vf: editingRecord?.vt_vf || 'No',
    bbb_chb: editingRecord?.bbb_chb || 'No',
    elevated_bnp: editingRecord?.elevated_bnp || 'No',
    elevated_crp: editingRecord?.elevated_crp || 'No',

    // Treatment Strategy: PAMI / Thrombolysis / Conservative
    treatment_strategy: editingRecord?.pami === 'Yes' ? 'PAMI' : (editingRecord?.thrombolysis === 'Yes' ? 'Thrombolysis' : 'Conservative'),
    pami: editingRecord?.pami || 'Yes',
    thrombolysis: editingRecord?.thrombolysis || 'No',
    conservative: editingRecord?.conservative || 'No',

    // PAMI details, if done:
    door_to_balloon_time: editingRecord?.door_to_balloon_time || '',
    vessel_lmca: editingRecord?.vessel_lmca === 'Yes' || editingRecord?.vessel_lmca === true,
    vessel_lad: editingRecord?.vessel_lad === 'Yes' || editingRecord?.vessel_lad === true,
    vessel_diagonal: editingRecord?.vessel_diagonal === 'Yes' || editingRecord?.vessel_diagonal === true,
    vessel_lcx: editingRecord?.vessel_lcx === 'Yes' || editingRecord?.vessel_lcx === true,
    vessel_ramus: editingRecord?.vessel_ramus === 'Yes' || editingRecord?.vessel_ramus === true,
    vessel_om: editingRecord?.vessel_om === 'Yes' || editingRecord?.vessel_om === true,
    vessel_rca: editingRecord?.vessel_rca === 'Yes' || editingRecord?.vessel_rca === true,
    vessel_pda: editingRecord?.vessel_pda === 'Yes' || editingRecord?.vessel_pda === true,
    vessel_segment: editingRecord?.vessel_segment || '',
    thrombosuction_done: editingRecord?.thrombosuction_done === 'Yes' ? 'Done' : (editingRecord?.thrombosuction_not_done === 'Yes' ? 'Not done' : 'Not done'),
    stent_type: editingRecord?.stent_des === 'Yes' ? 'DES' : 'BMS',
    stent_diameter: editingRecord?.stent_diameter || '',
    stent_length: editingRecord?.stent_length || '',
    procedural_success: editingRecord?.procedural_success || 'Yes',
    timi_flow: editingRecord?.timi_flow !== undefined ? editingRecord?.timi_flow : 3,
    complication_none: editingRecord?.complication_none === 'Yes' || editingRecord?.complication_none === true || true,
    complication_tamponade: editingRecord?.complication_tamponade === 'Yes' || editingRecord?.complication_tamponade === true,
    complication_major_bleed: editingRecord?.complication_major_bleed === 'Yes' || editingRecord?.complication_major_bleed === true,
    complication_stroke: editingRecord?.complication_stroke === 'Yes' || editingRecord?.complication_stroke === true,
    complication_stent_thrombosis: editingRecord?.complication_stent_thrombosis === 'Yes' || editingRecord?.complication_stent_thrombosis === true,
    complication_mi: editingRecord?.complication_mi === 'Yes' || editingRecord?.complication_mi === true,
    complication_death: editingRecord?.complication_death === 'Yes' || editingRecord?.complication_death === true,
    complication_emergency_cabg: editingRecord?.complication_emergency_cabg === 'Yes' || editingRecord?.complication_emergency_cabg === true,

    // Thrombolysis details
    door_to_needle_time: editingRecord?.door_to_needle_time || '',
    drug_stk: editingRecord?.drug_stk === 'Yes' || editingRecord?.drug_stk === true,
    drug_uk: editingRecord?.drug_uk === 'Yes' || editingRecord?.drug_uk === true,
    drug_reteplase: editingRecord?.drug_reteplase === 'Yes' || editingRecord?.drug_reteplase === true,
    drug_tenecteplase: editingRecord?.drug_tenecteplase === 'Yes' || editingRecord?.drug_tenecteplase === true,
    thrombolysis_dose: editingRecord?.thrombolysis_dose || '',

    // Drugs (Yes/No)
    beta_blocker: editingRecord?.beta_blocker || 'No',
    calcium_channel_blocker: editingRecord?.calcium_channel_blocker || 'No',
    nitrate: editingRecord?.nitrate || 'No',
    nicorandil: editingRecord?.nicorandil || 'No',
    ivabradine: editingRecord?.ivabradine || 'No',
    ranolazine: editingRecord?.ranolazine || 'No',
    trimetazidine: editingRecord?.trimetazidine || 'No',
    aspirin: editingRecord?.aspirin || 'Yes',
    clopidogrel: editingRecord?.clopidogrel || 'No',
    prasugrel: editingRecord?.prasugrel || 'No',
    ticagrelor: editingRecord?.ticagrelor || 'Yes',
    heparin_strategy: editingRecord?.heparin_ufh_iv === 'Yes' ? 'UFH i.v alone' : (editingRecord?.heparin_ufh_sc === 'Yes' ? 'UFH s.c alone' : (editingRecord?.heparin_lmwh === 'Yes' ? 'LMWH alone' : (editingRecord?.heparin_ufh_iv_sc === 'Yes' ? 'UFH i.v+UFHs.c' : (editingRecord?.heparin_ufh_iv_lmwh === 'Yes' ? 'UFH i.v + LMWH' : 'LMWH alone')))),
    gp2b3a: editingRecord?.gp2b3a || 'No',
    bivaluridin: editingRecord?.bivaluridin || 'No',
    statin: editingRecord?.statin || 'Yes',
    statin_dose: editingRecord?.statin_10mg === 'Yes' ? '10 mg' : (editingRecord?.statin_20mg === 'Yes' ? '20 mg' : (editingRecord?.statin_80mg === 'Yes' ? '80 mg' : '40 mg')),
    other_drugs: editingRecord?.other_drugs || '',

    // Diagnostic Procedures: Yes/No
    bedside_echo: editingRecord?.bedside_echo || 'No',
    departmental_echo: editingRecord?.departmental_echo || 'No',
    stress_testing: editingRecord?.stress_testing || 'No',
    lipid_profile: editingRecord?.lipid_profile || 'No',
    bnp: editingRecord?.bnp || 'No',
    crp: editingRecord?.crp || 'No',
    troponin_test: editingRecord?.troponin_test || 'No',
    cpk_ckmb: editingRecord?.cpk_ckmb || 'No',
    rft: editingRecord?.rft || 'No',
    lft: editingRecord?.lft || 'No',
    electrolytes: editingRecord?.electrolytes || 'No',
    hemogram: editingRecord?.hemogram || 'No',
    cxr: editingRecord?.cxr || 'No',
    diagnostic_other: editingRecord?.diagnostic_other || '',

    // Reports -> ECG:
    ecg_heart_rate: editingRecord?.ecg_heart_rate || '',
    av_block: editingRecord?.av_block_first_degree === 'Yes' ? '1-degree' : (editingRecord?.av_block_second_degree === 'Yes' ? '2-degree' : (editingRecord?.av_block_chb === 'Yes' ? 'CHB' : 'None')),
    bbb: editingRecord?.bbb_rbbb === 'Yes' ? 'RBBB' : (editingRecord?.bbb_lbbb === 'Yes' ? 'LBBB' : (editingRecord?.bbb_indeterminate === 'Yes' ? 'Indeterminate' : 'None')),
    qwaves_none: editingRecord?.qwaves_none === 'Yes' || editingRecord?.qwaves_none === true || true,
    qwaves_inferior: editingRecord?.qwaves_inferior === 'Yes' || editingRecord?.qwaves_inferior === true,
    qwaves_anteroseptal: editingRecord?.qwaves_anteroseptal === 'Yes' || editingRecord?.qwaves_anteroseptal === true,
    qwaves_anterior: editingRecord?.qwaves_anterior === 'Yes' || editingRecord?.qwaves_anterior === true,
    qwaves_anterolateral: editingRecord?.qwaves_anterolateral === 'Yes' || editingRecord?.qwaves_anterolateral === true,
    qwaves_lateral: editingRecord?.qwaves_lateral === 'Yes' || editingRecord?.qwaves_lateral === true,
    st_depression_none: editingRecord?.st_depression_none === 'Yes' || editingRecord?.st_depression_none === true || true,
    st_depression_inferior: editingRecord?.st_depression_inferior === 'Yes' || editingRecord?.st_depression_inferior === true,
    st_depression_anteroseptal: editingRecord?.st_depression_anteroseptal === 'Yes' || editingRecord?.st_depression_anteroseptal === true,
    st_depression_anterior: editingRecord?.st_depression_anterior === 'Yes' || editingRecord?.st_depression_anterior === true,
    st_depression_anterolateral: editingRecord?.st_depression_anterolateral === 'Yes' || editingRecord?.st_depression_anterolateral === true,
    st_depression_lateral: editingRecord?.st_depression_lateral === 'Yes' || editingRecord?.st_depression_lateral === true,
    t_inversion_none: editingRecord?.t_inversion_none === 'Yes' || editingRecord?.t_inversion_none === true || true,
    t_inversion_inferior: editingRecord?.t_inversion_inferior === 'Yes' || editingRecord?.t_inversion_inferior === true,
    t_inversion_anteroseptal: editingRecord?.t_inversion_anteroseptal === 'Yes' || editingRecord?.t_inversion_anteroseptal === true,
    t_inversion_anterior: editingRecord?.t_inversion_anterior === 'Yes' || editingRecord?.t_inversion_anterior === true,
    t_inversion_anterolateral: editingRecord?.t_inversion_anterolateral === 'Yes' || editingRecord?.t_inversion_anterolateral === true,
    t_inversion_lateral: editingRecord?.t_inversion_lateral === 'Yes' || editingRecord?.t_inversion_lateral === true,
    ecg_rhythm: editingRecord?.rhythm_nsr === 'Yes' ? 'NSR' : (editingRecord?.rhythm_af === 'Yes' ? 'AF' : (editingRecord?.rhythm_svt === 'Yes' ? 'SVT' : (editingRecord?.rhythm_vt === 'Yes' ? 'VT' : (editingRecord?.rhythm_vf === 'Yes' ? 'VF' : 'NSR')))),
    ecg_other: editingRecord?.ecg_other || '',

    // Reports -> Echo:
    echo_ef: editingRecord?.echo_ef || '',
    lv_function: editingRecord?.lv_function_normal === 'Yes' ? 'Normal' : (editingRecord?.lv_function_mild_lvd === 'Yes' ? 'Mild LVD' : (editingRecord?.lv_function_moderate_lvd === 'Yes' ? 'Mod. LVD' : (editingRecord?.lv_function_severe_lvd === 'Yes' ? 'Sev.LVD' : 'Normal'))),
    rwma_lad: editingRecord?.rwma_lad === 'Yes' || editingRecord?.rwma_lad === true,
    rwma_rca: editingRecord?.rwma_rca === 'Yes' || editingRecord?.rwma_rca === true,
    rwma_lcx: editingRecord?.rwma_lcx === 'Yes' || editingRecord?.rwma_lcx === true,
    mr: editingRecord?.mr_none === 'Yes' ? 'None' : (editingRecord?.mr_mild === 'Yes' ? 'Mild' : (editingRecord?.mr_moderate === 'Yes' ? 'Mod' : (editingRecord?.mr_severe === 'Yes' ? 'Severe' : 'None'))),
    echo_e: editingRecord?.echo_e || '',
    echo_a: editingRecord?.echo_a || '',
    echo_dt: editingRecord?.echo_dt || '',
    echo_e_prime: editingRecord?.echo_e_prime || '',
    echo_tapsv: editingRecord?.echo_tapsv || '',
    echo_other: editingRecord?.echo_other || '',

    // Reports -> Blood Investigations:
    hemoglobin: editingRecord?.hemoglobin || '',
    creatinine: editingRecord?.creatinine || '',
    troponin_i: editingRecord?.troponin_i || '',
    cpk: editingRecord?.cpk || '',
    ck_mb: editingRecord?.ck_mb || '',
    sodium: editingRecord?.sodium || '',
    potassium: editingRecord?.potassium || '',
    rbs_admission: editingRecord?.rbs_admission || '',

    // Reports -> Coronary Angiogram:
    angiogram_done: editingRecord?.angiogram_done || 'Not done',
    angiogram_normal: editingRecord?.angiogram_normal === 'Yes' || editingRecord?.angiogram_normal === true,
    angiogram_1vd: editingRecord?.angiogram_1vd === 'Yes' || editingRecord?.angiogram_1vd === true,
    angiogram_2vd: editingRecord?.angiogram_2vd === 'Yes' || editingRecord?.angiogram_2vd === true,
    angiogram_3vd: editingRecord?.angiogram_3vd === 'Yes' || editingRecord?.angiogram_3vd === true,
    angiogram_lmca: editingRecord?.angiogram_lmca === 'Yes' || editingRecord?.angiogram_lmca === true,

    // Reports -> Invasive Procedures: Yes/No
    cag: editingRecord?.cag || 'No',
    iabp: editingRecord?.iabp || 'No',
    invasive_ventilation: editingRecord?.invasive_ventilation || 'No',
    ptca: editingRecord?.ptca || 'No',
    cabg: editingRecord?.cabg || 'No',
    other_procedure: editingRecord?.other_procedure || '',

    // Out-comes -> Clinical: Yes/No
    death: editingRecord?.death || 'No',
    stemi_for_nonstemi: editingRecord?.stemi_for_nonstemi || 'No',
    remi_for_nstemi: editingRecord?.remi_for_nstemi || 'No',
    revascularization_recurrent_ischemia: editingRecord?.revascularization_recurrent_ischemia || 'No',
    cva_thrombotic: editingRecord?.cva_thrombotic || 'No',
    cva_hemorrhagic: editingRecord?.cva_hemorrhagic || 'No',
    major_bleeding: editingRecord?.major_bleeding || 'No',
    outcome_other: editingRecord?.outcome_other || '',

    // Out-comes -> Discharge Medications: Yes/No
    discharge_beta_blocker: editingRecord?.discharge_beta_blocker || 'No',
    discharge_calcium_channel_blocker: editingRecord?.discharge_calcium_channel_blocker || 'No',
    discharge_nitrate: editingRecord?.discharge_nitrate || 'No',
    discharge_nicorandil: editingRecord?.discharge_nicorandil || 'No',
    discharge_ivabradine: editingRecord?.discharge_ivabradine || 'No',
    discharge_ranolazine: editingRecord?.discharge_ranolazine || 'No',
    discharge_trimetazidine: editingRecord?.discharge_trimetazidine || 'No',
    discharge_aspirin: editingRecord?.discharge_aspirin || 'Yes',
    discharge_clopidogrel: editingRecord?.discharge_clopidogrel || 'No',
    discharge_prasugrel: editingRecord?.discharge_prasugrel || 'No',
    discharge_ticagrelor: editingRecord?.discharge_ticagrelor || 'Yes',
    discharge_statin: editingRecord?.discharge_statin || 'Yes',
    discharge_statin_dose: editingRecord?.discharge_statin_10mg === 'Yes' ? '10 mg' : (editingRecord?.discharge_statin_20mg === 'Yes' ? '20 mg' : (editingRecord?.discharge_statin_80mg === 'Yes' ? '80 mg' : '40 mg')),
    discharge_other_medication: editingRecord?.discharge_other_medication || '',

    // Length of Stay:
    iccu_hours: editingRecord?.iccu_hours || '',
    stepdown_icu_hours: editingRecord?.stepdown_icu_hours || '',
    floor_days: editingRecord?.floor_days || '',
    total_hospital_stay_days: editingRecord?.total_hospital_stay_days || '',

    // Cost of care:
    bed_charges: editingRecord?.bed_charges || '',
    drugs_disposables_cost: editingRecord?.drugs_disposables_cost || '',
    package_cost: editingRecord?.package_cost || '',
    laboratory_cost: editingRecord?.laboratory_cost || '',
    non_invasive_lab_cost: editingRecord?.non_invasive_lab_cost || '',
    consultation_cost: editingRecord?.consultation_cost || '',
    radiology_cost: editingRecord?.radiology_cost || '',
    miscellaneous_cost: editingRecord?.miscellaneous_cost || '',
    total_cost: editingRecord?.total_cost || '',

    // Follow-up grid states from database followup array
    ...getFollowupInitialState(editingRecord?.followup),
    visit_mode: editingRecord?.visit_mode || editingRecord?.followup?.[0]?.visit_mode || 'In-Person',
    special_instructions: editingRecord?.special_instructions || editingRecord?.followup?.[0]?.special_instructions || editingRecord?.special_clinical_instructions || '',

    // Appropriateness Assessment -> Procedures:
    appr_iccu_admission: editingRecord?.appr_iccu_admission ?? editingRecord?.appropriateness?.iccu_admission ?? editingRecord?.iccu_admission ?? '',
    appr_iccu_transfer_out: editingRecord?.appr_iccu_transfer_out ?? editingRecord?.appropriateness?.iccu_transfer_out ?? editingRecord?.iccu_transfer_out ?? '',
    appr_thrombolysis_indication: editingRecord?.appr_thrombolysis_indication ?? editingRecord?.appropriateness?.thrombolysis_indication ?? editingRecord?.thrombolysis_indication ?? '',
    appr_ptca_indication: editingRecord?.appr_ptca_indication ?? editingRecord?.appropriateness?.ptca_indication ?? editingRecord?.ptca_indication ?? '',
    appr_invasive_monitoring: editingRecord?.appr_invasive_monitoring ?? editingRecord?.appropriateness?.invasive_monitoring ?? editingRecord?.invasive_monitoring ?? '',
    appr_iabp_indication: editingRecord?.appr_iabp_indication ?? editingRecord?.appropriateness?.iabp_indication ?? editingRecord?.iabp_indication ?? '',
    appr_invasive_ventilation: editingRecord?.appr_invasive_ventilation ?? editingRecord?.appropriateness?.invasive_ventilation ?? '',
    appr_dialysis_indication: editingRecord?.appr_dialysis_indication ?? editingRecord?.appropriateness?.dialysis_indication ?? editingRecord?.dialysis_indication ?? '',
    appr_other_procedure_name: editingRecord?.appr_other_procedure_name ?? editingRecord?.appropriateness?.other_procedure_name ?? editingRecord?.other_procedure_name ?? '',
    appr_other_procedure_appropriateness: editingRecord?.appr_other_procedure_appropriateness ?? editingRecord?.appropriateness?.other_procedure_appropriateness ?? editingRecord?.other_procedure_appropriateness ?? '',

    // Appropriateness Assessment -> Investigations:
    appr_cardiac_enzymes: editingRecord?.appr_cardiac_enzymes ?? editingRecord?.appropriateness?.cardiac_enzymes ?? editingRecord?.cardiac_enzymes ?? '',
    appr_bnp: editingRecord?.appr_bnp ?? editingRecord?.appropriateness?.bnp ?? '',
    appr_crp: editingRecord?.appr_crp ?? editingRecord?.appropriateness?.crp ?? '',
    appr_lipid_profile: editingRecord?.appr_lipid_profile ?? editingRecord?.appropriateness?.lipid_profile ?? '',
    appr_bedside_echo: editingRecord?.appr_bedside_echo ?? editingRecord?.appropriateness?.bedside_echo ?? '',
    appr_chest_xray: editingRecord?.appr_chest_xray ?? editingRecord?.appropriateness?.chest_xray ?? editingRecord?.chest_xray ?? '',

    // Appropriateness Assessment -> Drugs:
    appr_beta_blockers: editingRecord?.appr_beta_blockers ?? editingRecord?.appropriateness?.beta_blockers ?? editingRecord?.beta_blockers ?? '',
    appr_aspirin: editingRecord?.appr_aspirin ?? editingRecord?.appropriateness?.aspirin ?? '',
    appr_clopidogrel: editingRecord?.appr_clopidogrel ?? editingRecord?.appropriateness?.clopidogrel ?? '',
    appr_ace_inhibitor: editingRecord?.appr_ace_inhibitor ?? editingRecord?.appropriateness?.ace_inhibitor ?? editingRecord?.ace_inhibitor ?? '',
    appr_arb: editingRecord?.appr_arb ?? editingRecord?.appropriateness?.arb ?? editingRecord?.arb ?? '',
    appr_statin: editingRecord?.appr_statin ?? editingRecord?.appropriateness?.statin ?? '',
    appr_diuretic: editingRecord?.appr_diuretic ?? editingRecord?.appropriateness?.diuretic ?? editingRecord?.diuretic ?? '',
    appr_lanoxin: editingRecord?.appr_lanoxin ?? editingRecord?.appropriateness?.lanoxin ?? editingRecord?.lanoxin ?? '',
    appr_anticoagulant: editingRecord?.appr_anticoagulant ?? editingRecord?.appropriateness?.anticoagulant ?? editingRecord?.anticoagulant ?? '',
    appr_amiodarone: editingRecord?.appr_amiodarone ?? editingRecord?.appropriateness?.amiodarone ?? editingRecord?.amiodarone ?? '',
    appr_other_drug_name: editingRecord?.appr_other_drug_name ?? editingRecord?.appropriateness?.other_drug_name ?? editingRecord?.other_drug_name ?? '',
    appr_other_drug_appropriateness: editingRecord?.appr_other_drug_appropriateness ?? editingRecord?.appropriateness?.other_drug_appropriateness ?? editingRecord?.other_drug_appropriateness ?? ''
  });

  // Calculate dynamic TIMI Score points exactly based on PDF Page 1 & 2
  const calculateTimiScore = (data) => {
    let score = 0;
    if (data.age_gt_75 === 'Yes') score += 3;
    if (data.age_65_to_74 === 'Yes') score += 2;
    if (data.history_dm_htn_angina === 'Yes') score += 1;
    if (data.sbp_lt_100 === 'Yes') score += 3;
    if (data.heart_rate_gt_100 === 'Yes') score += 2;
    if (data.killip_class_ii_to_iv === 'Yes') score += 2;
    if (data.anterior_mi_or_lbbb === 'Yes') score += 1;
    if (data.weight_lt_67kg === 'Yes') score += 1;
    if (data.reperfusion_gt_4hrs === 'Yes') score += 1;
    if (data.chd_risk_factors_ge_3 === 'Yes') score += 1;
    if (data.prior_coronary_stenosis_gt_50 === 'Yes') score += 1;
    if (data.st_deviation_at_admission === 'Yes') score += 1;
    if (data.anginal_episodes_ge_2_last_24hrs === 'Yes') score += 1;
    if (data.elevated_serum_cardiac_markers === 'Yes') score += 1;
    return score;
  };

  const handleChange = (field, value) => {
    setFormData((prev) => {
      const updated = { ...prev, [field]: value };

      // Recompute TIMI Risk Score dynamically
      updated.timi_total_score = calculateTimiScore(updated);

      // Safe date helper
      const isValidDateStr = (dStr) => {
        if (!dStr || typeof dStr !== 'string' || dStr.trim() === '') return false;
        const d = new Date(dStr);
        return !isNaN(d.getTime());
      };

      // Recompute stay duration & validate chronological order
      if (field === 'discharge_date' && value) {
        if (isValidDateStr(value) && isValidDateStr(updated.admission_date) && value.length >= 10 && updated.admission_date.length >= 10) {
          if (new Date(value) < new Date(updated.admission_date)) {
            alert('Date of Discharge cannot be earlier than Date of Admission.');
          }
        }
      }
      if (field === 'admission_date' && value) {
        if (isValidDateStr(value) && isValidDateStr(updated.discharge_date) && value.length >= 10 && updated.discharge_date.length >= 10) {
          if (new Date(updated.discharge_date) < new Date(value)) {
            alert('Date of Discharge cannot be earlier than Date of Admission.');
          }
        }
      }

      if (['iccu_hours', 'stepdown_icu_hours', 'floor_days'].includes(field)) {
        const iccu = parseFloat(updated.iccu_hours) || 0;
        const stepdown = parseFloat(updated.stepdown_icu_hours) || 0;
        const floor = parseFloat(updated.floor_days) || 0;
        updated.total_hospital_stay_days = Math.round(((iccu + stepdown) / 24 + floor) * 10) / 10;
      }

      // Recompute cost summation
      if ([
        'bed_charges', 'drugs_disposables_cost', 'package_cost', 'laboratory_cost',
        'non_invasive_lab_cost', 'consultation_cost', 'radiology_cost', 'miscellaneous_cost'
      ].includes(field)) {
        const costKeys = [
          'bed_charges', 'drugs_disposables_cost', 'package_cost', 'laboratory_cost',
          'non_invasive_lab_cost', 'consultation_cost', 'radiology_cost', 'miscellaneous_cost'
        ];
        let total = 0;
        costKeys.forEach(k => {
          total += parseFloat(updated[k]) || 0;
        });
        updated.total_cost = total;
      }

      return updated;
    });
  };

  // Build flattener payload for backend compatibility matching nstemi_* DB tables
  const getFlattenedData = () => {
    const payload = { ...formData };
    
    // Map statin doses
    payload.statin_10mg = formData.statin === 'Yes' && formData.statin_dose === '10 mg' ? 'Yes' : 'No';
    payload.statin_20mg = formData.statin === 'Yes' && formData.statin_dose === '20 mg' ? 'Yes' : 'No';
    payload.statin_40mg = formData.statin === 'Yes' && formData.statin_dose === '40 mg' ? 'Yes' : 'No';
    payload.statin_80mg = formData.statin === 'Yes' && formData.statin_dose === '80 mg' ? 'Yes' : 'No';

    payload.discharge_statin_10mg = formData.discharge_statin === 'Yes' && formData.discharge_statin_dose === '10 mg' ? 'Yes' : 'No';
    payload.discharge_statin_20mg = formData.discharge_statin === 'Yes' && formData.discharge_statin_dose === '20 mg' ? 'Yes' : 'No';
    payload.discharge_statin_40mg = formData.discharge_statin === 'Yes' && formData.discharge_statin_dose === '40 mg' ? 'Yes' : 'No';
    payload.discharge_statin_80mg = formData.discharge_statin === 'Yes' && formData.discharge_statin_dose === '80 mg' ? 'Yes' : 'No';

    // Map treatment strategies
    payload.pami = formData.treatment_strategy === 'PAMI' ? 'Yes' : 'No';
    payload.thrombolysis = formData.treatment_strategy === 'Thrombolysis' ? 'Yes' : 'No';
    payload.conservative = formData.treatment_strategy === 'Conservative' ? 'Yes' : 'No';

    // Map thrombosuction
    payload.thrombosuction_done = formData.thrombosuction_done === 'Done' ? 'Yes' : 'No';
    payload.thrombosuction_not_done = formData.thrombosuction_done === 'Not done' ? 'Yes' : 'No';

    // Map stent type
    payload.stent_des = formData.stent_type === 'DES' ? 'Yes' : 'No';
    payload.stent_bms = formData.stent_type === 'BMS' ? 'Yes' : 'No';

    // Map ECG parameters
    payload.av_block_none = formData.av_block === 'None' ? 'Yes' : 'No';
    payload.av_block_first_degree = formData.av_block === '1-degree' ? 'Yes' : 'No';
    payload.av_block_second_degree = formData.av_block === '2-degree' ? 'Yes' : 'No';
    payload.av_block_chb = formData.av_block === 'CHB' ? 'Yes' : 'No';

    payload.bbb_none = formData.bbb === 'None' ? 'Yes' : 'No';
    payload.bbb_rbbb = formData.bbb === 'RBBB' ? 'Yes' : 'No';
    payload.bbb_lbbb = formData.bbb === 'LBBB' ? 'Yes' : 'No';
    payload.bbb_indeterminate = formData.bbb === 'Indeterminate' ? 'Yes' : 'No';

    payload.rhythm_nsr = formData.ecg_rhythm === 'NSR' ? 'Yes' : 'No';
    payload.rhythm_af = formData.ecg_rhythm === 'AF' ? 'Yes' : 'No';
    payload.rhythm_svt = formData.ecg_rhythm === 'SVT' ? 'Yes' : 'No';
    payload.rhythm_vt = formData.ecg_rhythm === 'VT' ? 'Yes' : 'No';
    payload.rhythm_vf = formData.ecg_rhythm === 'VF' ? 'Yes' : 'No';

    // Map Echo parameters
    payload.lv_function_normal = formData.lv_function === 'Normal' ? 'Yes' : 'No';
    payload.lv_function_mild_lvd = formData.lv_function === 'Mild LVD' ? 'Yes' : 'No';
    payload.lv_function_moderate_lvd = formData.lv_function === 'Mod. LVD' ? 'Yes' : 'No';
    payload.lv_function_severe_lvd = formData.lv_function === 'Sev.LVD' ? 'Yes' : 'No';

    payload.mr_none = formData.mr === 'None' ? 'Yes' : 'No';
    payload.mr_mild = formData.mr === 'Mild' ? 'Yes' : 'No';
    payload.mr_moderate = formData.mr === 'Mod' ? 'Yes' : 'No';
    payload.mr_severe = formData.mr === 'Severe' ? 'Yes' : 'No';

    // Follow-up mapper to handle table columns with filtering of untouched intervals
    const timeframes = [
      { key: '1m', label: '1-Month', months: 1 },
      { key: '3m', label: '3-Month', months: 3 },
      { key: '6m', label: '6-Month', months: 6 },
      { key: '12m', label: '12-Month', months: 12 }
    ];

    const baseFollowupDate = formData.discharge_date || formData.admission_date;

    payload.followup = timeframes
      .map(tf => {
        const angina = formData[`angina_${tf.key}`] || 'No';
        const funcClass = formData[`func_${tf.key}`] || 'None';
        const antiangRaw = formData[`antiang_${tf.key}`];
        const antianginals = antiangRaw !== '' && antiangRaw !== null && antiangRaw !== undefined ? parseInt(antiangRaw, 10) : null;
        const dapt = formData[`dapt_${tf.key}`] || 'No';
        const statin = formData[`statin_${tf.key}`] || 'No';
        const beta = formData[`beta_${tf.key}`] || 'No';
        const ace = formData[`ace_${tf.key}`] || 'No';
        const aldo = formData[`aldo_${tf.key}`] || 'No';
        const acs = formData[`acs_${tf.key}`] || 'No';
        const ptca = formData[`ptca_${tf.key}`] || 'No';
        const cabg = formData[`cabg_${tf.key}`] || 'No';
        const death = formData[`death_${tf.key}`] || 'No';
        const other = (formData[`other_${tf.key}`] || '').trim();

        return {
          followup_month: tf.label,
          followup_date: calculateExpectedDate(baseFollowupDate, tf.months),
          angina,
          functional_class: funcClass,
          number_of_antianginals: antianginals,
          dual_antiplatelets: dapt,
          statins: statin,
          beta_blocker: beta,
          acei_arb: ace,
          aldosterone_antagonist: aldo,
          acs_hospitalization: acs,
          ptca,
          cabg,
          death,
          other_event: other,
          visit_mode: formData.visit_mode || 'In-Person',
          special_instructions: formData.special_instructions || 'Follow-up in cardiology OPD with repeat lipid profile and ECG.'
        };
      });


    // Map heparin strategy
    payload.heparin_ufh_iv = formData.heparin_strategy === 'UFH i.v alone' ? 'Yes' : 'No';
    payload.heparin_ufh_sc = formData.heparin_strategy === 'UFH s.c alone' ? 'Yes' : 'No';
    payload.heparin_lmwh = formData.heparin_strategy === 'LMWH alone' ? 'Yes' : 'No';
    payload.heparin_ufh_iv_sc = formData.heparin_strategy === 'UFH i.v+UFHs.c' ? 'Yes' : 'No';
    payload.heparin_ufh_iv_lmwh = formData.heparin_strategy === 'UFH i.v + LMWH' ? 'Yes' : 'No';

    // Map Appropriateness Assessment (prefixed to avoid naming collisions in backend):
    payload.appr_iccu_admission = formData.appr_iccu_admission;
    payload.appr_iccu_transfer_out = formData.appr_iccu_transfer_out;
    payload.appr_thrombolysis_indication = formData.appr_thrombolysis_indication;
    payload.appr_ptca_indication = formData.appr_ptca_indication;
    payload.appr_invasive_monitoring = formData.appr_invasive_monitoring;
    payload.appr_iabp_indication = formData.appr_iabp_indication;
    payload.appr_invasive_ventilation = formData.appr_invasive_ventilation;
    payload.appr_dialysis_indication = formData.appr_dialysis_indication;
    payload.appr_other_procedure_name = formData.appr_other_procedure_name;
    payload.appr_other_procedure_appropriateness = formData.appr_other_procedure_appropriateness;

    payload.appr_cardiac_enzymes = formData.appr_cardiac_enzymes;
    payload.appr_bnp = formData.appr_bnp;
    payload.appr_crp = formData.appr_crp;
    payload.appr_lipid_profile = formData.appr_lipid_profile;
    payload.appr_bedside_echo = formData.appr_bedside_echo;
    payload.appr_chest_xray = formData.appr_chest_xray;

    payload.appr_beta_blockers = formData.appr_beta_blockers;
    payload.appr_aspirin = formData.appr_aspirin;
    payload.appr_clopidogrel = formData.appr_clopidogrel;
    payload.appr_ace_inhibitor = formData.appr_ace_inhibitor;
    payload.appr_arb = formData.appr_arb;
    payload.appr_statin = formData.appr_statin;
    payload.appr_diuretic = formData.appr_diuretic;
    payload.appr_lanoxin = formData.appr_lanoxin;
    payload.appr_anticoagulant = formData.appr_anticoagulant;
    payload.appr_amiodarone = formData.appr_amiodarone;
    payload.appr_other_drug_name = formData.appr_other_drug_name;
    payload.appr_other_drug_appropriateness = formData.appr_other_drug_appropriateness;

    // Follow-up visit mode & special instructions
    payload.visit_mode = formData.visit_mode || 'In-Person';
    payload.special_instructions = formData.special_instructions || '';

    return payload;
  };

  const fillDummyData = () => {
    const dummy = {
      reg_patient_id: patient.id || patient.reg_patient_id || 1,
      acs_no: formData.acs_no,
      ip_no: formData.ip_no,
      admission_date: new Date().toISOString().split('T')[0],
      discharge_date: new Date(Date.now() + 5 * 24 * 3600 * 1000).toISOString().split('T')[0],
      primary_consultant: 'Dr. K. Sridhar (Cardiologist)',

      hypertension: 'Yes',
      diabetes: 'Yes',
      smoking: 'No',
      renal_failure: 'No',
      copd: 'No',
      cva: 'No',
      prior_acs: 'No',
      prior_ptca: 'No',
      prior_cabg: 'No',
      other_background: 'None',

      typical_angina: 'Yes',
      atypical_chest_pain: 'No',
      breathlessness: 'Yes',
      syncope_presyncope: 'No',
      pulse_rate: 88,
      systolic_bp: 135,
      diastolic_bp: 85,

      age_gt_75: patientAge >= 75 ? 'Yes' : 'No',
      age_65_to_74: (patientAge >= 65 && patientAge < 75) ? 'Yes' : 'No',
      history_dm_htn_angina: 'Yes',
      sbp_lt_100: 'No',
      heart_rate_gt_100: 'No',
      killip_class_ii_to_iv: 'No',
      anterior_mi_or_lbbb: 'No',
      weight_lt_67kg: 'No',
      reperfusion_gt_4hrs: 'Yes',
      chd_risk_factors_ge_3: 'Yes',
      prior_coronary_stenosis_gt_50: 'Yes',
      st_deviation_at_admission: 'Yes',
      anginal_episodes_ge_2_last_24hrs: 'Yes',
      elevated_serum_cardiac_markers: 'Yes',
      timi_total_score: 5,

      lvf: 'No',
      vt_vf: 'No',
      bbb_chb: 'No',
      elevated_bnp: 'No',
      elevated_crp: 'No',

      treatment_strategy: 'PAMI',
      pami: 'Yes',
      thrombolysis: 'No',
      conservative: 'No',

      door_to_balloon_time: 45,
      vessel_lmca: false,
      vessel_lad: true,
      vessel_diagonal: false,
      vessel_lcx: false,
      vessel_ramus: false,
      vessel_om: false,
      vessel_rca: false,
      vessel_pda: false,
      vessel_segment: 'Proximal',
      thrombosuction_done: 'Not done',
      stent_type: 'DES',
      stent_diameter: 3.5,
      stent_length: 28,
      procedural_success: 'Yes',
      timi_flow: 3,
      complication_none: true,
      complication_tamponade: false,
      complication_major_bleed: false,
      complication_stroke: false,
      complication_stent_thrombosis: false,
      complication_mi: false,
      complication_death: false,
      complication_emergency_cabg: false,

      door_to_needle_time: 30,
      drug_stk: false,
      drug_uk: false,
      drug_reteplase: false,
      drug_tenecteplase: true,
      thrombolysis_dose: '40 mg',

      beta_blocker: 'Yes',
      calcium_channel_blocker: 'No',
      nitrate: 'Yes',
      nicorandil: 'No',
      ivabradine: 'No',
      ranolazine: 'Yes',
      trimetazidine: 'No',
      aspirin: 'Yes',
      clopidogrel: 'No',
      prasugrel: 'No',
      ticagrelor: 'Yes',
      heparin_strategy: 'LMWH alone',
      gp2b3a: 'No',
      bivaluridin: 'No',
      statin: 'Yes',
      statin_dose: '40 mg',
      other_drugs: 'None',

      bedside_echo: 'Yes',
      departmental_echo: 'Yes',
      stress_testing: 'No',
      lipid_profile: 'Yes',
      bnp: 'No',
      crp: 'No',
      troponin_test: 'Yes',
      cpk_ckmb: 'Yes',
      rft: 'Yes',
      lft: 'Yes',
      electrolytes: 'Yes',
      hemogram: 'Yes',
      cxr: 'Yes',
      diagnostic_other: '',

      ecg_heart_rate: 88,
      av_block: 'None',
      bbb: 'None',
      qwaves_none: true,
      qwaves_inferior: false,
      qwaves_anteroseptal: false,
      qwaves_anterior: false,
      qwaves_anterolateral: false,
      qwaves_lateral: false,
      st_depression_none: false,
      st_depression_inferior: false,
      st_depression_anteroseptal: false,
      st_depression_anterior: true,
      st_depression_anterolateral: false,
      st_depression_lateral: false,
      t_inversion_none: false,
      t_inversion_inferior: false,
      t_inversion_anteroseptal: false,
      t_inversion_anterior: true,
      t_inversion_anterolateral: false,
      t_inversion_lateral: false,
      ecg_rhythm: 'NSR',
      ecg_other: '',

      echo_ef: 52,
      lv_function: 'Normal',
      rwma_lad: true,
      rwma_rca: false,
      rwma_lcx: false,
      mr: 'None',
      echo_e: 0.8,
      echo_a: 0.7,
      echo_dt: 190,
      echo_e_prime: 8.5,
      echo_tapsv: 18,
      echo_other: '',

      hemoglobin: 13.8,
      creatinine: 0.95,
      troponin_i: '1.24 ng/mL',
      cpk: '145 U/L',
      ck_mb: '28 U/L',
      sodium: 139,
      potassium: 4.1,
      rbs_admission: 118,

      angiogram_done: 'Yes',
      angiogram_normal: false,
      angiogram_1vd: true,
      angiogram_2vd: false,
      angiogram_3vd: false,
      angiogram_lmca: false,

      cag: 'Yes',
      iabp: 'No',
      invasive_ventilation: 'No',
      ptca: 'Yes',
      cabg: 'No',
      other_procedure: '',

      death: 'No',
      stemi_for_nonstemi: 'No',
      remi_for_nstemi: 'No',
      revascularization_recurrent_ischemia: 'No',
      cva_thrombotic: 'No',
      cva_hemorrhagic: 'No',
      major_bleeding: 'No',
      outcome_other: '',

      discharge_beta_blocker: 'Yes',
      discharge_calcium_channel_blocker: 'No',
      discharge_nitrate: 'Yes',
      discharge_nicorandil: 'No',
      discharge_ivabradine: 'No',
      discharge_ranolazine: 'Yes',
      discharge_trimetazidine: 'No',
      discharge_aspirin: 'Yes',
      discharge_clopidogrel: 'No',
      discharge_prasugrel: 'No',
      discharge_ticagrelor: 'Yes',
      discharge_statin: 'Yes',
      discharge_statin_dose: '40 mg',
      discharge_other_medication: 'Lansoprazole 30mg QD',

      iccu_hours: 36,
      stepdown_icu_hours: 12,
      floor_days: 3,
      total_hospital_stay_days: 5,

      bed_charges: 15000,
      drugs_disposables_cost: 35000,
      package_cost: 95000,
      laboratory_cost: 8500,
      non_invasive_lab_cost: 3200,
      consultation_cost: 7500,
      radiology_cost: 4500,
      miscellaneous_cost: 2500,
      total_cost: 171200,

      angina_1m: 'No', angina_3m: 'No', angina_6m: 'No', angina_12m: 'No',
      func_1m: 'I', func_3m: 'I', func_6m: 'I', func_12m: 'I',
      antiang_1m: '1', antiang_3m: '1', antiang_6m: '1', antiang_12m: '1',
      dapt_1m: 'Yes', dapt_3m: 'Yes', dapt_6m: 'Yes', dapt_12m: 'Yes',
      statin_1m: 'Yes', statin_3m: 'Yes', statin_6m: 'Yes', statin_12m: 'Yes',
      beta_1m: 'Yes', beta_3m: 'Yes', beta_6m: 'Yes', beta_12m: 'Yes',
      ace_1m: 'No', ace_3m: 'No', ace_6m: 'No', ace_12m: 'No',
      aldo_1m: 'No', aldo_3m: 'No', aldo_6m: 'No', aldo_12m: 'No',
      acs_1m: 'No', acs_3m: 'No', acs_6m: 'No', acs_12m: 'No',
      ptca_1m: 'No', ptca_3m: 'No', ptca_6m: 'No', ptca_12m: 'No',
      cabg_1m: 'No', cabg_3m: 'No', cabg_6m: 'No', cabg_12m: 'No',
      death_1m: 'No', death_3m: 'No', death_6m: 'No', death_12m: 'No',
      other_1m: '', other_3m: '', other_6m: '', other_12m: '',

      visit_mode: 'In-Person',
      special_instructions: 'Follow-up in cardiology OPD with repeat lipid profile and ECG.',

      appr_iccu_admission: 'Appropriate',
      appr_iccu_transfer_out: 'Appropriate',
      appr_thrombolysis_indication: 'Inappropriate',
      appr_ptca_indication: 'Appropriate',
      appr_invasive_monitoring: '+',
      appr_iabp_indication: 'Inappropriate',
      appr_invasive_ventilation: 'Inappropriate',
      appr_dialysis_indication: 'Inappropriate',
      appr_other_procedure_name: 'CABG',
      appr_other_procedure_appropriateness: 'Appropriate',

      appr_cardiac_enzymes: 'Appropriate',
      appr_bnp: 'Appropriate',
      appr_crp: 'Inappropriate',
      appr_lipid_profile: 'Appropriate',
      appr_bedside_echo: 'Appropriate',
      appr_chest_xray: 'Appropriate',

      appr_beta_blockers: 'Appropriate',
      appr_aspirin: 'Appropriate',
      appr_clopidogrel: 'Appropriate',
      appr_ace_inhibitor: 'Appropriate',
      appr_arb: 'Inappropriate',
      appr_statin: 'Appropriate',
      appr_diuretic: 'Inappropriate',
      appr_lanoxin: 'Inappropriate',
      appr_anticoagulant: 'Appropriate',
      appr_amiodarone: 'Inappropriate',
      appr_other_drug_name: 'Ivabradine',
      appr_other_drug_appropriateness: 'Appropriate'
    };

    dummy.timi_total_score = calculateTimiScore(dummy);
    setFormData(dummy);
  };

  useImperativeHandle(ref, () => ({
    getSubmissionData: () => getFlattenedData(),
    validateForm: () => {
      if (formData.admission_date && formData.discharge_date) {
        if (new Date(formData.discharge_date) < new Date(formData.admission_date)) {
          alert('Date of Discharge cannot be earlier than Date of Admission.');
          return false;
        }
      }
      return true;
    }
  }));

  // Reusable radio option mapper
  const renderRadio = (field, label, options = ['Yes', 'No']) => (
    <div className="flex items-center justify-between p-2 bg-slate-50/50 border border-slate-100 rounded-lg">
      <span className="font-semibold text-slate-700">{label}</span>
      <div className="flex gap-4">
        {options.map((opt) => (
          <label key={opt} className="flex items-center gap-1.5 cursor-pointer">
            <input
              type="radio"
              name={`${field}-${label}`}
              checked={formData[field] === opt}
              onChange={() => handleChange(field, opt)}
              className="text-orange-600 focus:ring-orange-500"
            />
            <span className="text-[11px] font-bold text-slate-800">{opt}</span>
          </label>
        ))}
      </div>
    </div>
  );

  return (
    <div className="space-y-6 text-slate-800">

      {/* Patient Profile & Administrative Details */}
      <SectionCard title="Patient Profile & Administrative Details" subtitle="Demographics, Dates, Identifiers & Admission context">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs">
          <div>
            <label className={LABEL_STYLES}>Patient Name:</label>
            <input
              type="text"
              readOnly
              disabled
              value={patient.name || patient.patient_name || '—'}
              className={INPUT_DISABLED_STYLES}
            />
          </div>
          <div>
            <label className={LABEL_STYLES}>Age:</label>
            <input
              type="text"
              readOnly
              disabled
              value={patient.age ? `${patient.age} Yrs` : (patientAge ? `${patientAge} Yrs` : '—')}
              className={INPUT_DISABLED_STYLES}
            />
          </div>
          <div>
            <label className={LABEL_STYLES}>Gender:</label>
            <input
              type="text"
              readOnly
              disabled
              value={patient.gender || '—'}
              className={INPUT_DISABLED_STYLES}
            />
          </div>
          <div>
            <label className={LABEL_STYLES}>MR No:</label>
            <input
              type="text"
              readOnly
              disabled
              value={patient.mrNo || patient.mr_no || '—'}
              className={INPUT_DISABLED_STYLES}
            />
          </div>
          <div>
            <label className={LABEL_STYLES}>IP No:</label>
            <input
              type="text"
              value={formData.ip_no || ''}
              onChange={(e) => handleChange('ip_no', e.target.value)}
              placeholder="E.g. IP00001"
              className="w-full p-2 border border-slate-300 rounded-md font-medium text-slate-900 font-mono focus:ring-orange-500 focus:border-orange-500"
            />
          </div>
          <div>
            <label className={LABEL_STYLES}>ACS No / Registry No:</label>
            <input
              type="text"
              value={formData.acs_no || ''}
              onChange={(e) => handleChange('acs_no', e.target.value)}
              placeholder="E.g. ACS00001"
              className="w-full p-2 border border-slate-300 rounded-md font-medium text-slate-900 font-mono focus:ring-orange-500 focus:border-orange-500"
            />
          </div>
          <div>
            <label className="font-bold text-slate-700 block mb-1">Date of Admission:</label>
            <input
              type="date"
              value={formData.admission_date || ''}
              onChange={(e) => handleChange('admission_date', e.target.value)}
              className="w-full p-2 border border-slate-300 rounded-md font-medium text-slate-900"
            />
          </div>
          <div>
            <label className="font-bold text-slate-700 block mb-1">Date of Discharge:</label>
            <input
              type="date"
              value={formData.discharge_date || ''}
              onChange={(e) => handleChange('discharge_date', e.target.value)}
              className="w-full p-2 border border-slate-300 rounded-md font-medium text-slate-900"
            />
          </div>
          <div>
            <label className="font-bold text-slate-700 block mb-1">Primary Consultant:</label>
            <select
              value={formData.primary_consultant}
              onChange={(e) => handleChange('primary_consultant', e.target.value)}
              className="w-full p-2 border border-slate-300 rounded-md bg-white font-medium text-slate-900"
            >
              <option value="Dr. K. Sridhar (Cardiologist)">Dr. K. Sridhar (Cardiologist)</option>
              <option value="Dr. Ananth Rao">Dr. Ananth Rao</option>
              <option value="Dr. M. Sharma">Dr. M. Sharma</option>
            </select>
          </div>
          <div>
            <label className={LABEL_STYLES}>Contact details: Phone:</label>
            <input
              type="text"
              readOnly
              disabled
              value={patient.phone || patient.phone_no || '—'}
              className={INPUT_DISABLED_STYLES}
            />
          </div>
          <div>
            <label className={LABEL_STYLES}>E-mail:</label>
            <input
              type="text"
              readOnly
              disabled
              value={patient.email || '—'}
              className={INPUT_DISABLED_STYLES}
            />
          </div>
        </div>
      </SectionCard>

      {/* Clinical Information - Background */}
      <SectionCard title="Clinical Information" subtitle="Background Details">
        <div className="space-y-4 text-xs">
          <div className="font-bold text-slate-800 border-b pb-1 text-sm">Background:</div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {renderRadio('hypertension', 'Hypertension', ['Yes', 'No', 'Unknown'])}
            {renderRadio('diabetes', 'Diabetes', ['Yes', 'No', 'Unknown'])}
            {renderRadio('smoking', 'Smoking', ['Yes', 'No', 'Unknown'])}
            {renderRadio('renal_failure', 'Renal Failure', ['Yes', 'No', 'Unknown'])}
            {renderRadio('copd', 'COPD', ['Yes', 'No', 'Unknown'])}
            {renderRadio('cva', 'CVA', ['Yes', 'No', 'Unknown'])}
            {renderRadio('prior_acs', 'Prior ACS', ['Yes', 'No', 'Unknown'])}
            {renderRadio('prior_ptca', 'Prior PTCA', ['Yes', 'No', 'Unknown'])}
            {renderRadio('prior_cabg', 'Prior CABG', ['Yes', 'No', 'Unknown'])}
          </div>
          <div>
            <label className="font-bold text-slate-700 block mb-1">Any other</label>
            <input
              type="text"
              value={formData.other_background}
              onChange={(e) => handleChange('other_background', e.target.value)}
              className="w-full p-2 border border-slate-300 rounded-md"
              placeholder="Specify additional clinical history..."
            />
          </div>
        </div>
      </SectionCard>

      {/* Clinical Information - Presentation */}
      <SectionCard title="Clinical Information" subtitle="Presentation details">
        <div className="space-y-4 text-xs">
          <div className="font-bold text-slate-800 border-b pb-1 text-sm">Presentation:</div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {renderRadio('typical_angina', 'Typical angina', ['Yes', 'No'])}
            {renderRadio('atypical_chest_pain', 'Atypical chest pain', ['Yes', 'No'])}
            {renderRadio('breathlessness', 'Breathlessness', ['Yes', 'No'])}
            {renderRadio('syncope_presyncope', 'Syncope/ Pre-syncope', ['Yes', 'No'])}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
            <div>
              <label className="font-bold text-slate-700 block mb-1">Pulse rate:</label>
              <input
                type="number"
                value={formData.pulse_rate}
                onChange={(e) => handleChange('pulse_rate', e.target.value)}
                className="w-full p-2 border border-slate-300 rounded-md"
              />
            </div>
            <div>
              <label className="font-bold text-slate-700 block mb-1">SBP:</label>
              <input
                type="number"
                value={formData.systolic_bp}
                onChange={(e) => handleChange('systolic_bp', e.target.value)}
                className="w-full p-2 border border-slate-300 rounded-md"
              />
            </div>
            <div>
              <label className="font-bold text-slate-700 block mb-1">DBP:</label>
              <input
                type="number"
                value={formData.diastolic_bp}
                onChange={(e) => handleChange('diastolic_bp', e.target.value)}
                className="w-full p-2 border border-slate-300 rounded-md"
              />
            </div>
          </div>
        </div>
      </SectionCard>

      {/* Risk Stratification- TIMI Risk score */}
      <SectionCard title="Risk Stratification- TIMI Risk score: Points">
        <div className="space-y-4 text-xs">
          <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg flex justify-between items-center mb-4">
            <div>
              <span className="font-bold text-orange-950 block text-xs uppercase tracking-wide">Total Calculated TIMI Score</span>
              <span className="text-[10px] text-orange-800">Dynamic score calculation matching point weights</span>
            </div>
            <span className="text-3xl font-black text-orange-600 pr-4">{formData.timi_total_score} Points</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2 border border-slate-100 p-3 rounded-xl bg-white shadow-sm">
            {renderRadio('age_gt_75', 'Age >75 years (+3)', ['Yes', 'No'])}
            {renderRadio('age_65_to_74', 'Age 65 to 74 years (+2)', ['Yes', 'No'])}
            {renderRadio('history_dm_htn_angina', 'H/o DM/ HTN/ Angina (+1)', ['Yes', 'No'])}
            {renderRadio('sbp_lt_100', 'SBP < 100 mmHg (+3)', ['Yes', 'No'])}
            {renderRadio('heart_rate_gt_100', 'Heart Rate > 100/ min (+2)', ['Yes', 'No'])}
            {renderRadio('killip_class_ii_to_iv', 'Killip Class II to IV (+2)', ['Yes', 'No'])}
            {renderRadio('anterior_mi_or_lbbb', 'Ant MI/ LBBBB (+1)', ['Yes', 'No'])}
            {renderRadio('weight_lt_67kg', 'Weight < 67 kg (+1)', ['Yes', 'No'])}
            {renderRadio('reperfusion_gt_4hrs', 'Time to reperfusion > 4 hrs (+1)', ['Yes', 'No'])}
            {renderRadio('chd_risk_factors_ge_3', 'Presence of at least 3 CHD risk factors (+1)', ['Yes', 'No'])}
            {renderRadio('prior_coronary_stenosis_gt_50', 'Prior coronary stenosis of >50% (+1)', ['Yes', 'No'])}
            {renderRadio('st_deviation_at_admission', 'Presence of ST deviation at admission (+1)', ['Yes', 'No'])}
            {renderRadio('anginal_episodes_ge_2_last_24hrs', 'At least 2 anginal episodes < 24 hrs (+1)', ['Yes', 'No'])}
            {renderRadio('elevated_serum_cardiac_markers', 'Elevated serum cardiac markers (+1)', ['Yes', 'No'])}
          </div>

          <div className="font-bold text-slate-800 border-t border-slate-200 pt-3 text-sm">Other Risk Factors:</div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            {renderRadio('lvf', 'LVF', ['Yes', 'No'])}
            {renderRadio('vt_vf', 'VT/VF', ['Yes', 'No'])}
            {renderRadio('bbb_chb', 'BBB/CHB', ['Yes', 'No'])}
            {renderRadio('elevated_bnp', 'Elevated BNP', ['Yes', 'No'])}
            {renderRadio('elevated_crp', 'Elevated CRP', ['Yes', 'No'])}
          </div>
        </div>
      </SectionCard>

      {/* Treatment Strategy Section */}
      <SectionCard title="Treatment Strategy" subtitle="Table: nstemi_treatment_strategy">
        <div className="space-y-4 text-xs">
          <div className="flex gap-6 p-2 bg-slate-50 border rounded-lg">
            <span className="font-bold text-slate-700 pt-1">Strategy:</span>
            {[
              { key: 'PAMI', label: 'PAMI' },
              { key: 'Thrombolysis', label: 'Thrombolysis' },
              { key: 'Conservative', label: 'Conservative' }
            ].map(op => (
              <label key={op.key} className="flex items-center gap-2 cursor-pointer font-bold">
                <input
                  type="radio"
                  name="treatment_strategy"
                  checked={formData.treatment_strategy === op.key}
                  onChange={() => handleChange('treatment_strategy', op.key)}
                />
                <span>{op.label}</span>
              </label>
            ))}
          </div>

          <div className="p-4 bg-slate-50/50 border rounded-xl space-y-4">
            <div className="font-bold text-slate-800 text-sm">PAMI details, if done:</div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Door to Balloon Time:</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={formData.door_to_balloon_time}
                    onChange={(e) => handleChange('door_to_balloon_time', e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded-md"
                  />
                  <span className="font-semibold text-slate-600">min</span>
                </div>
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-1">Segment:</label>
                <input
                  type="text"
                  value={formData.vessel_segment}
                  onChange={(e) => handleChange('vessel_segment', e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded-md"
                />
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-1">Thrombosuction:</label>
                <div className="flex gap-4 mt-2">
                  {['Done', 'Not done'].map(opt => (
                    <label key={opt} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="thrombosuction"
                        checked={formData.thrombosuction_done === opt}
                        onChange={() => handleChange('thrombosuction_done', opt)}
                      />
                      <span>{opt}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Vessel(s):</label>
              <div className="flex flex-wrap gap-2.5">
                {['LMCA', 'LAD', 'Diagonal', 'LCX', 'Ramus', 'OM', 'RCA', 'PDA'].map(vessel => {
                  const key = `vessel_${vessel.toLowerCase()}`;
                  return (
                    <label key={vessel} className="flex items-center gap-1.5 p-2 bg-white border rounded-lg cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData[key]}
                        onChange={(e) => handleChange(key, e.target.checked)}
                        className="rounded text-orange-600 focus:ring-orange-500"
                      />
                      <span>{vessel}</span>
                    </label>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Stent(s):</label>
                <div className="flex items-center gap-6 p-2 bg-white border rounded-lg">
                  {['BMS', 'DES'].map(opt => (
                    <label key={opt} className="flex items-center gap-2 cursor-pointer font-bold">
                      <input
                        type="radio"
                        name="stent_type"
                        checked={formData.stent_type === opt}
                        onChange={() => handleChange('stent_type', opt)}
                      />
                      <span>{opt}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Diameter:</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.stent_diameter}
                    onChange={(e) => handleChange('stent_diameter', e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded-md"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Length:</label>
                  <input
                    type="number"
                    value={formData.stent_length}
                    onChange={(e) => handleChange('stent_length', e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded-md"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-3 pt-2 border-t">
              <span className="font-bold text-slate-800 block text-xs">Result:</span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {renderRadio('procedural_success', 'Procedural success:', ['Yes', 'No'])}
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Post-procedure TIMI flow:</label>
                  <div className="flex gap-4 mt-2">
                    {[0, 1, 2, 3].map(grade => (
                      <label key={grade} className="flex items-center gap-2 cursor-pointer font-bold">
                        <input
                          type="radio"
                          name="timi_flow"
                          checked={formData.timi_flow === grade}
                          onChange={() => handleChange('timi_flow', grade)}
                        />
                        <span>{grade}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-1">Major Complications:</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { key: 'complication_none', label: 'None' },
                    { key: 'complication_tamponade', label: 'Tamponade' },
                    { key: 'complication_major_bleed', label: 'Major bleed' },
                    { key: 'complication_stroke', label: 'Stroke' },
                    { key: 'complication_stent_thrombosis', label: 'Stent thrombosis' },
                    { key: 'complication_mi', label: 'MI' },
                    { key: 'complication_death', label: 'Death' },
                    { key: 'complication_emergency_cabg', label: 'Emergency CABG' }
                  ].map(op => (
                    <label key={op.key} className="flex items-center gap-1.5 p-2 bg-white border rounded-lg cursor-pointer text-[10px]">
                      <input
                        type="checkbox"
                        checked={formData[op.key]}
                        onChange={(e) => handleChange(op.key, e.target.checked)}
                        className="rounded"
                      />
                      <span>{op.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="p-4 bg-slate-50/50 border rounded-xl space-y-4">
            <div className="font-bold text-slate-800 text-sm">Thrombolysis details</div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Door to Needle Time:</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={formData.door_to_needle_time}
                    onChange={(e) => handleChange('door_to_needle_time', e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded-md"
                  />
                  <span className="font-semibold text-slate-600">min</span>
                </div>
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-1">Drug:</label>
                <div className="flex flex-wrap gap-3 mt-2">
                  {[
                    { key: 'drug_stk', label: 'STK' },
                    { key: 'drug_tenecteplase', label: 'Tenectaplase' },
                    { key: 'drug_uk', label: 'UK' },
                    { key: 'drug_reteplase', label: 'Reteplase' }
                  ].map(op => (
                    <label key={op.key} className="flex items-center gap-1.5 cursor-pointer font-bold">
                      <input
                        type="checkbox"
                        checked={formData[op.key] === 'Yes' || formData[op.key] === true}
                        onChange={(e) => handleChange(op.key, e.target.checked ? 'Yes' : 'No')}
                        className="rounded text-orange-600 focus:ring-orange-500"
                      />
                      <span>{op.label}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-1">Dose:</label>
                <input
                  type="text"
                  value={formData.thrombolysis_dose}
                  onChange={(e) => handleChange('thrombolysis_dose', e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded-md"
                />
              </div>
            </div>
          </div>

          {/* Drugs Section */}
          <div className="font-bold text-slate-800 border-t border-slate-200 pt-3 text-sm">Drugs:</div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {renderRadio('beta_blocker', 'Beta-blocker')}
            {renderRadio('calcium_channel_blocker', 'Calcium-channel blocker')}
            {renderRadio('nitrate', 'Nitrate')}
            {renderRadio('nicorandil', 'Nicorandil')}
            {renderRadio('ivabradine', 'Ivabradine')}
            {renderRadio('ranolazine', 'Ranozolidine')}
            {renderRadio('trimetazidine', 'Trimetazidine')}
            {renderRadio('aspirin', 'Aspirin')}
            {renderRadio('clopidogrel', 'Clopidigrel')}
            {renderRadio('prasugrel', 'Prasugrel')}
            {renderRadio('ticagrelor', 'Ticagralor')}
            {renderRadio('gp2b3a', 'Gp2b3a')}
            {renderRadio('bivaluridin', 'Bivaluridin')}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 border-t">
            <div>
              <label className="font-bold text-slate-700 block mb-1">Heparin strategy:</label>
              <div className="space-y-1">
                {[
                  'UFH i.v alone',
                  'UFH s.c alone',
                  'LMWH alone',
                  'UFH i.v+UFHs.c',
                  'UFH i.v + LMWH'
                ].map(op => (
                  <label key={op} className="flex items-center gap-2 cursor-pointer text-xs">
                    <input
                      type="radio"
                      name="heparin_strategy"
                      checked={formData.heparin_strategy === op}
                      onChange={() => handleChange('heparin_strategy', op)}
                    />
                    <span>{op}</span>
                  </label>
                ))}
              </div>
            </div>
            <div>
              <label className="font-bold text-slate-700 block mb-1">Statin:</label>
              {renderRadio('statin', 'Statin Prescribed')}
              {formData.statin === 'Yes' && (
                <div className="flex gap-3 mt-2 pl-2">
                  <span className="font-bold text-slate-500">Dose:</span>
                  {['10 mg', '20 mg', '40 mg', '80 mg'].map(dose => (
                    <label key={dose} className="flex items-center gap-1">
                      <input
                        type="radio"
                        name="statin_dose"
                        checked={formData.statin_dose === dose}
                        onChange={() => handleChange('statin_dose', dose)}
                      />
                      <span>{dose}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>
            <div>
              <label className="font-bold text-slate-700 block mb-1">Any Other</label>
              <input
                type="text"
                value={formData.other_drugs}
                onChange={(e) => handleChange('other_drugs', e.target.value)}
                className="w-full p-2 border border-slate-300 rounded-md"
              />
            </div>
          </div>
        </div>
      </SectionCard>

      {/* Diagnostic Procedures Section */}
      <SectionCard title="Diagnostic Procedures" subtitle="Table: nstemi_diagnostics">
        <div className="space-y-4 text-xs">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {renderRadio('bedside_echo', 'Bed-side echo')}
            {renderRadio('departmental_echo', 'Departmental echo')}
            {renderRadio('stress_testing', 'Stress Testing')}
            {renderRadio('lipid_profile', 'Lipid profile')}
            {renderRadio('bnp', 'BNP')}
            {renderRadio('crp', 'CRP')}
            {renderRadio('troponin_test', 'Trop-T / I')}
            {renderRadio('cpk_ckmb', 'CPK/ CPK-MB')}
            {renderRadio('rft', 'RFT')}
            {renderRadio('lft', 'LFT')}
            {renderRadio('electrolytes', 'Electrolytes')}
            {renderRadio('hemogram', 'Hemogram')}
            {renderRadio('cxr', 'CXR')}
          </div>
          <div>
            <label className="font-bold text-slate-700 block mb-1">Others</label>
            <input
              type="text"
              value={formData.diagnostic_other}
              onChange={(e) => handleChange('diagnostic_other', e.target.value)}
              className="w-full p-2 border border-slate-300 rounded-md"
            />
          </div>

          <div className="font-bold text-slate-800 border-t border-slate-200 pt-3 text-sm">Reports:</div>
          <div className="p-4 bg-slate-50 border rounded-xl space-y-4">
            <span className="font-bold text-slate-800 text-xs block border-b pb-1">ECG:</span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="font-bold text-slate-700 block mb-1">HR:</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={formData.ecg_heart_rate}
                    onChange={(e) => handleChange('ecg_heart_rate', e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded-md"
                  />
                  <span className="font-semibold text-slate-600">bpm;</span>
                </div>
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-1">AV Block:</label>
                <div className="flex flex-wrap gap-3 mt-1.5">
                  {['None', '1-degree', '2-degree', 'CHB'].map(opt => (
                    <label key={opt} className="flex items-center gap-1.5">
                      <input
                        type="radio"
                        name="av_block"
                        checked={formData.av_block === opt}
                        onChange={() => handleChange('av_block', opt)}
                      />
                      <span>{opt}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-1">BBB:</label>
                <div className="flex flex-wrap gap-3 mt-1.5">
                  {['RBBB', 'LBBB', 'Indeterminate', 'None'].map(opt => (
                    <label key={opt} className="flex items-center gap-1.5">
                      <input
                        type="radio"
                        name="bbb"
                        checked={formData.bbb === (opt === 'Indeterminate' ? 'Indeterminate' : opt)}
                        onChange={() => handleChange('bbb', opt)}
                      />
                      <span>{opt}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Q waves:</label>
                <div className="grid grid-cols-2 gap-1.5 mt-1">
                  {['None', 'Inferior', 'Antero-septal', 'Anterior', 'Anterolateral', 'Lateral'].map(loc => {
                    const key = `qwaves_${loc.toLowerCase().replace('-', '')}`;
                    return (
                      <label key={loc} className="flex items-center gap-1">
                        <input
                          type="checkbox"
                          checked={formData[key]}
                          onChange={(e) => handleChange(key, e.target.checked)}
                          className="rounded"
                        />
                        <span className="text-[10px]">{loc}</span>
                      </label>
                    );
                  })}
                </div>
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-1">ST dep:</label>
                <div className="grid grid-cols-2 gap-1.5 mt-1">
                  {['None', 'Inferior', 'Antero-septal', 'Anterior', 'Anterolateral', 'Lateral'].map(loc => {
                    const key = `st_depression_${loc.toLowerCase().replace('-', '')}`;
                    return (
                      <label key={loc} className="flex items-center gap-1">
                        <input
                          type="checkbox"
                          checked={formData[key]}
                          onChange={(e) => handleChange(key, e.target.checked)}
                          className="rounded"
                        />
                        <span className="text-[10px]">{loc}</span>
                      </label>
                    );
                  })}
                </div>
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-1">T inv:</label>
                <div className="grid grid-cols-2 gap-1.5 mt-1">
                  {['None', 'Inferior', 'Antero-septal', 'Anterior', 'Anterolateral', 'Lateral'].map(loc => {
                    const key = `t_inversion_${loc.toLowerCase().replace('-', '')}`;
                    return (
                      <label key={loc} className="flex items-center gap-1">
                        <input
                          type="checkbox"
                          checked={formData[key]}
                          onChange={(e) => handleChange(key, e.target.checked)}
                          className="rounded"
                        />
                        <span className="text-[10px]">{loc}</span>
                      </label>
                    );
                  })}
                </div>
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-1">Rhythm:</label>
                <div className="flex flex-wrap gap-2.5 mt-1.5">
                  {['NSR', 'AF', 'SVT', 'VT', 'VF'].map(r => (
                    <label key={r} className="flex items-center gap-1">
                      <input
                        type="radio"
                        name="ecg_rhythm"
                        checked={formData.ecg_rhythm === r}
                        onChange={() => handleChange('ecg_rhythm', r)}
                      />
                      <span>{r}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
            <div>
              <label className="font-bold text-slate-700 block mb-1">Any other</label>
              <input
                type="text"
                value={formData.ecg_other}
                onChange={(e) => handleChange('ecg_other', e.target.value)}
                className="w-full p-2 border border-slate-300 rounded-md"
              />
            </div>
          </div>

          <div className="p-4 bg-slate-50 border rounded-xl space-y-4">
            <span className="font-bold text-slate-800 text-xs block border-b pb-1">Echo:</span>
            <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              <div>
                <label className="font-bold text-slate-700 block mb-1">EF:</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={formData.echo_ef}
                    onChange={(e) => handleChange('echo_ef', e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded-md font-bold text-slate-900"
                  />
                  <span className="font-semibold text-slate-600">%</span>
                </div>
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-1">LV Function:</label>
                <div className="flex flex-wrap gap-3 mt-1.5">
                  {['Normal', 'Mild LVD', 'Mod. LVD', 'Sev.LVD'].map(opt => (
                    <label key={opt} className="flex items-center gap-1">
                      <input
                        type="radio"
                        name="lv_function"
                        checked={formData.lv_function === opt}
                        onChange={() => handleChange('lv_function', opt)}
                      />
                      <span>{opt}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-1">RWMA:</label>
                <div className="flex flex-wrap gap-3 mt-1.5">
                  {['LAD', 'RCA', 'LCX'].map(opt => {
                    const key = `rwma_${opt.toLowerCase()}`;
                    return (
                      <label key={opt} className="flex items-center gap-1">
                        <input
                          type="checkbox"
                          checked={formData[key]}
                          onChange={(e) => handleChange(key, e.target.checked)}
                          className="rounded"
                        />
                        <span>{opt} territory</span>
                      </label>
                    );
                  })}
                </div>
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-1">MR:</label>
                <div className="flex flex-wrap gap-3 mt-1.5">
                  {['None', 'Mild', 'Mod', 'Severe'].map(opt => (
                    <label key={opt} className="flex items-center gap-1">
                      <input
                        type="radio"
                        name="mr_grade"
                        checked={formData.mr === opt}
                        onChange={() => handleChange('mr', opt)}
                      />
                      <span>{opt}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              <div>
                <label className="font-bold text-slate-700 block mb-1">E:</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.echo_e}
                  onChange={(e) => handleChange('echo_e', e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded-md"
                />
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-1">A:</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.echo_a}
                  onChange={(e) => handleChange('echo_a', e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded-md"
                />
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-1">DT:</label>
                <input
                  type="number"
                  value={formData.echo_dt}
                  onChange={(e) => handleChange('echo_dt', e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded-md"
                />
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-1">E':</label>
                <input
                  type="number"
                  step="0.1"
                  value={formData.echo_e_prime}
                  onChange={(e) => handleChange('echo_e_prime', e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded-md"
                />
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-1">TAPSV:</label>
                <input
                  type="number"
                  step="0.1"
                  value={formData.echo_tapsv}
                  onChange={(e) => handleChange('echo_tapsv', e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded-md"
                />
              </div>
            </div>
            <div>
              <label className="font-bold text-slate-700 block mb-1">Others:</label>
              <input
                type="text"
                value={formData.echo_other}
                onChange={(e) => handleChange('echo_other', e.target.value)}
                className="w-full p-2 border border-slate-300 rounded-md"
              />
            </div>
          </div>

          <div className="p-4 bg-slate-50 border rounded-xl space-y-4">
            <span className="font-bold text-slate-800 text-xs block border-b pb-1">Blood Investigations:</span>
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Hemoglobin:</label>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    step="0.1"
                    value={formData.hemoglobin}
                    onChange={(e) => handleChange('hemoglobin', e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded-md"
                  />
                  <span>gm%</span>
                </div>
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-1">Creat:</label>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    step="0.01"
                    value={formData.creatinine}
                    onChange={(e) => handleChange('creatinine', e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded-md font-bold"
                  />
                  <span>mg/dl</span>
                </div>
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-1">Trop-I:</label>
                <input
                  type="text"
                  value={formData.troponin_i}
                  onChange={(e) => handleChange('troponin_i', e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded-md"
                />
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-1">CPK:</label>
                <input
                  type="text"
                  value={formData.cpk}
                  onChange={(e) => handleChange('cpk', e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded-md"
                />
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-1">CK-MB:</label>
                <input
                  type="text"
                  value={formData.ck_mb}
                  onChange={(e) => handleChange('ck_mb', e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded-md"
                />
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-1">Na:</label>
                <input
                  type="number"
                  step="0.1"
                  value={formData.sodium}
                  onChange={(e) => handleChange('sodium', e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded-md"
                />
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-1">K:</label>
                <input
                  type="number"
                  step="0.1"
                  value={formData.potassium}
                  onChange={(e) => handleChange('potassium', e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded-md"
                />
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-1">RBS at admission:</label>
                <input
                  type="number"
                  value={formData.rbs_admission}
                  onChange={(e) => handleChange('rbs_admission', e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded-md"
                />
              </div>
            </div>
          </div>

          <div className="p-4 bg-slate-50 border rounded-xl space-y-4">
            <span className="font-bold text-slate-800 text-xs block border-b pb-1">Coronary Angiogram:</span>
            <div className="flex flex-wrap items-center gap-6">
              <div className="flex gap-4 p-2 bg-white border rounded-lg">
                {['Done', 'Not done'].map(opt => (
                  <label key={opt} className="flex items-center gap-2 cursor-pointer font-bold">
                    <input
                      type="radio"
                      name="angiogram_perf"
                      checked={formData.angiogram_done === (opt === 'Done' ? 'Yes' : 'No')}
                      onChange={() => handleChange('angiogram_done', opt === 'Done' ? 'Yes' : 'No')}
                    />
                    <span>{opt}</span>
                  </label>
                ))}
              </div>

              {formData.angiogram_done === 'Yes' && (
                <div className="flex flex-wrap items-center gap-3 animate-fadeIn">
                  <span className="font-bold text-slate-500">If done:</span>
                  {['Normal', '1-VD', '2-VD', '3-VD', 'LMCA'].map(opt => {
                    const key = `angiogram_${opt.toLowerCase().replace('-', '')}`;
                    return (
                      <label key={opt} className="flex items-center gap-1.5 p-2 bg-white border rounded-lg cursor-pointer font-medium">
                        <input
                          type="checkbox"
                          checked={formData[key]}
                          onChange={(e) => handleChange(key, e.target.checked)}
                          className="rounded"
                        />
                        <span>{opt}</span>
                      </label>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          <div className="font-bold text-slate-800 border-t border-slate-200 pt-3 text-sm">Invasive Procedures:</div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {renderRadio('cag', 'CAG')}
            {renderRadio('iabp', 'IABP')}
            {renderRadio('invasive_ventilation', 'Invasive Ventilation')}
            {renderRadio('ptca', 'PTCA')}
            {renderRadio('cabg', 'CABG')}
          </div>
          <div>
            <label className="font-bold text-slate-700 block mb-1">Other</label>
            <input
              type="text"
              value={formData.other_procedure}
              onChange={(e) => handleChange('other_procedure', e.target.value)}
              className="w-full p-2 border border-slate-300 rounded-md"
            />
          </div>
        </div>
      </SectionCard>

      {/* Out-comes Section */}
      <SectionCard title="Out-comes" subtitle="Clinical Outcomes & Discharge Meds">
        <div className="space-y-4 text-xs">
          <div className="font-bold text-slate-800 text-sm">Clinical:</div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 border p-3 rounded-xl bg-white shadow-sm">
            {renderRadio('death', 'Death')}
            {renderRadio('stemi_for_nonstemi', 'STEMI for NONSTEMI subjects')}
            {renderRadio('remi_for_nstemi', 'Re-MI for STEMI subjects')}
            {renderRadio('revascularization_recurrent_ischemia', 'Revascularization for recurrent ischemia')}
            {renderRadio('cva_thrombotic', 'CVA-thrombotic')}
            {renderRadio('cva_hemorrhagic', 'CVA-hemorrhagic')}
            {renderRadio('major_bleeding', 'Major Bleeding')}
          </div>
          <div>
            <label className="font-bold text-slate-700 block mb-1">Any other</label>
            <input
              type="text"
              value={formData.outcome_other}
              onChange={(e) => handleChange('outcome_other', e.target.value)}
              className="w-full p-2 border border-slate-300 rounded-md"
            />
          </div>

          <div className="font-bold text-slate-800 border-t border-slate-200 pt-3 text-sm">Discharge Medications:</div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {renderRadio('discharge_beta_blocker', 'Beta-blocker')}
            {renderRadio('discharge_calcium_channel_blocker', 'Calcium-channel blocker')}
            {renderRadio('discharge_nitrate', 'Nitrate')}
            {renderRadio('discharge_nicorandil', 'Nicorandil')}
            {renderRadio('discharge_ivabradine', 'Ivabradine')}
            {renderRadio('discharge_ranolazine', 'Ranozolidine')}
            {renderRadio('discharge_trimetazidine', 'Trimetazidine')}
            {renderRadio('discharge_aspirin', 'Aspirin')}
            {renderRadio('discharge_clopidogrel', 'Clopidigrel')}
            {renderRadio('discharge_prasugrel', 'Prasugrel')}
            {renderRadio('discharge_ticagrelor', 'Ticagralor')}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t pt-2">
            <div>
              <label className="font-bold text-slate-700 block mb-1">Statin:</label>
              {renderRadio('discharge_statin', 'Statin Prescribed')}
              {formData.discharge_statin === 'Yes' && (
                <div className="flex gap-3 mt-2 pl-2">
                  <span className="font-bold text-slate-500">Dose:</span>
                  {['10 mg', '20 mg', '40 mg', '80 mg'].map(dose => (
                    <label key={dose} className="flex items-center gap-1">
                      <input
                        type="radio"
                        name="discharge_statin_dose"
                        checked={formData.discharge_statin_dose === dose}
                        onChange={() => handleChange('discharge_statin_dose', dose)}
                      />
                      <span>{dose}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>
            <div>
              <label className="font-bold text-slate-700 block mb-1">Any Other</label>
              <input
                type="text"
                value={formData.discharge_other_medication}
                onChange={(e) => handleChange('discharge_other_medication', e.target.value)}
                className="w-full p-2 border border-slate-300 rounded-md"
              />
            </div>
          </div>
        </div>
      </SectionCard>

      {/* Appropriateness Grids */}
      <SectionCard title="Appropriateness Assessment" subtitle="Procedures, Investigations & Drugs (PDF Page 6)">
        <div className="space-y-4 text-xs overflow-x-auto">
          <div className="font-bold text-slate-800 text-xs">Appropriateness for various procedures:</div>
          <table className="w-full text-left border-collapse border border-slate-200 min-w-[500px]">
            <thead>
              <tr className="bg-slate-100">
                <th className="p-2 border border-slate-200 font-bold">Procedure</th>
                <th className="p-2 border border-slate-200 text-center font-bold">Appropriate</th>
                <th className="p-2 border border-slate-200 text-center font-bold">Inappropriate</th>
                <th className="p-2 border border-slate-200 text-center font-bold">+</th>
              </tr>
            </thead>
            <tbody>
              {proceduresList.map(item => (
                <tr key={item.key} className="hover:bg-slate-50">
                  <td className="p-2 border border-slate-200">
                    {item.specifyKey ? (
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                        <span className="font-semibold">{item.label}:</span>
                        <input
                          type="text"
                          value={formData[item.specifyKey] || ''}
                          onChange={(e) => handleChange(item.specifyKey, e.target.value)}
                          placeholder="Specify name"
                          className="p-1 text-xs border border-slate-300 rounded-md focus:ring-orange-500 focus:border-orange-500 w-full sm:w-48"
                        />
                      </div>
                    ) : (
                      <span className="font-semibold">{item.label}</span>
                    )}
                  </td>
                  <td className="p-2 border border-slate-200 text-center">
                    <input
                      type="radio"
                      name={item.key}
                      value="Appropriate"
                      checked={formData[item.key] === 'Appropriate'}
                      onChange={() => handleChange(item.key, 'Appropriate')}
                      className="text-orange-600 focus:ring-orange-500"
                    />
                  </td>
                  <td className="p-2 border border-slate-200 text-center">
                    <input
                      type="radio"
                      name={item.key}
                      value="Inappropriate"
                      checked={formData[item.key] === 'Inappropriate'}
                      onChange={() => handleChange(item.key, 'Inappropriate')}
                      className="text-orange-600 focus:ring-orange-500"
                    />
                  </td>
                  <td className="p-2 border border-slate-200 text-center">
                    <input
                      type="radio"
                      name={item.key}
                      value="+"
                      checked={formData[item.key] === '+'}
                      onChange={() => handleChange(item.key, '+')}
                      className="text-orange-600 focus:ring-orange-500"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="font-bold text-slate-800 text-xs pt-3 border-t">Appropriateness for various investigations:</div>
          <table className="w-full text-left border-collapse border border-slate-200 min-w-[500px]">
            <thead>
              <tr className="bg-slate-100">
                <th className="p-2 border border-slate-200 font-bold">Investigation</th>
                <th className="p-2 border border-slate-200 text-center font-bold">Appropriate</th>
                <th className="p-2 border border-slate-200 text-center font-bold">Inappropriate</th>
                <th className="p-2 border border-slate-200 text-center font-bold">+</th>
              </tr>
            </thead>
            <tbody>
              {investigationsList.map(item => (
                <tr key={item.key} className="hover:bg-slate-50">
                  <td className="p-2 border border-slate-200">
                    <span className="font-semibold">{item.label}</span>
                  </td>
                  <td className="p-2 border border-slate-200 text-center">
                    <input
                      type="radio"
                      name={item.key}
                      value="Appropriate"
                      checked={formData[item.key] === 'Appropriate'}
                      onChange={() => handleChange(item.key, 'Appropriate')}
                      className="text-orange-600 focus:ring-orange-500"
                    />
                  </td>
                  <td className="p-2 border border-slate-200 text-center">
                    <input
                      type="radio"
                      name={item.key}
                      value="Inappropriate"
                      checked={formData[item.key] === 'Inappropriate'}
                      onChange={() => handleChange(item.key, 'Inappropriate')}
                      className="text-orange-600 focus:ring-orange-500"
                    />
                  </td>
                  <td className="p-2 border border-slate-200 text-center">
                    <input
                      type="radio"
                      name={item.key}
                      value="+"
                      checked={formData[item.key] === '+'}
                      onChange={() => handleChange(item.key, '+')}
                      className="text-orange-600 focus:ring-orange-500"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="font-bold text-slate-800 text-xs pt-3 border-t">Appropriateness for various drugs:</div>
          <table className="w-full text-left border-collapse border border-slate-200 min-w-[500px]">
            <thead>
              <tr className="bg-slate-100">
                <th className="p-2 border border-slate-200 font-bold">Drug</th>
                <th className="p-2 border border-slate-200 text-center font-bold">Appropriate</th>
                <th className="p-2 border border-slate-200 text-center font-bold">Inappropriate</th>
                <th className="p-2 border border-slate-200 text-center font-bold">+</th>
              </tr>
            </thead>
            <tbody>
              {drugsList.map(item => (
                <tr key={item.key} className="hover:bg-slate-50">
                  <td className="p-2 border border-slate-200">
                    {item.specifyKey ? (
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                        <span className="font-semibold">{item.label}:</span>
                        <input
                          type="text"
                          value={formData[item.specifyKey] || ''}
                          onChange={(e) => handleChange(item.specifyKey, e.target.value)}
                          placeholder="Specify name"
                          className="p-1 text-xs border border-slate-300 rounded-md focus:ring-orange-500 focus:border-orange-500 w-full sm:w-48"
                        />
                      </div>
                    ) : (
                      <span className="font-semibold">{item.label}</span>
                    )}
                  </td>
                  <td className="p-2 border border-slate-200 text-center">
                    <input
                      type="radio"
                      name={item.key}
                      value="Appropriate"
                      checked={formData[item.key] === 'Appropriate'}
                      onChange={() => handleChange(item.key, 'Appropriate')}
                      className="text-orange-600 focus:ring-orange-500"
                    />
                  </td>
                  <td className="p-2 border border-slate-200 text-center">
                    <input
                      type="radio"
                      name={item.key}
                      value="Inappropriate"
                      checked={formData[item.key] === 'Inappropriate'}
                      onChange={() => handleChange(item.key, 'Inappropriate')}
                      className="text-orange-600 focus:ring-orange-500"
                    />
                  </td>
                  <td className="p-2 border border-slate-200 text-center">
                    <input
                      type="radio"
                      name={item.key}
                      value="+"
                      checked={formData[item.key] === '+'}
                      onChange={() => handleChange(item.key, '+')}
                      className="text-orange-600 focus:ring-orange-500"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SectionCard>

      {/* Length of Stay & Cost breakdown */}
      <SectionCard title="Hospitalization Details" subtitle="Length of Stay & Cost of Care (PDF Page 7)">
        <div className="space-y-4 text-xs">
          <div className="font-bold text-slate-800">Length of Stay:</div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div>
              <label className="font-bold text-slate-700 block mb-1">ICCU</label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={formData.iccu_hours}
                  onChange={(e) => handleChange('iccu_hours', e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded-md"
                />
                <span className="font-semibold text-slate-500">hours</span>
              </div>
            </div>
            <div>
              <label className="font-bold text-slate-700 block mb-1">Step-down ICU</label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={formData.stepdown_icu_hours}
                  onChange={(e) => handleChange('stepdown_icu_hours', e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded-md"
                />
                <span className="font-semibold text-slate-500">hours</span>
              </div>
            </div>
            <div>
              <label className="font-bold text-slate-700 block mb-1">Floors</label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={formData.floor_days}
                  onChange={(e) => handleChange('floor_days', e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded-md"
                />
                <span className="font-semibold text-slate-500">days</span>
              </div>
            </div>
            <div>
              <label className="font-bold text-slate-700 block mb-1">Total Hospital stay</label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  disabled
                  value={formData.total_hospital_stay_days || '0'}
                  className={INPUT_DISABLED_STYLES + " font-bold text-slate-950"}
                />
                <span className="font-semibold text-slate-500">days</span>
              </div>
            </div>
          </div>

          <div className="font-bold text-slate-800 border-t pt-3">Cost of care:</div>
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-3">
            <div>
              <label className="font-bold text-slate-700 block mb-1">Bed charges</label>
              <input
                type="number"
                value={formData.bed_charges}
                onChange={(e) => handleChange('bed_charges', e.target.value)}
                className="w-full p-2 border border-slate-300 rounded-md"
              />
            </div>
            <div>
              <label className="font-bold text-slate-700 block mb-1">Drugs & Disposables</label>
              <input
                type="number"
                value={formData.drugs_disposables_cost}
                onChange={(e) => handleChange('drugs_disposables_cost', e.target.value)}
                className="w-full p-2 border border-slate-300 rounded-md"
              />
            </div>
            <div>
              <label className="font-bold text-slate-700 block mb-1">Packages</label>
              <input
                type="number"
                value={formData.package_cost}
                onChange={(e) => handleChange('package_cost', e.target.value)}
                className="w-full p-2 border border-slate-300 rounded-md font-bold text-slate-900 bg-slate-50/50"
              />
            </div>
            <div>
              <label className="font-bold text-slate-700 block mb-1">Lab Investigations</label>
              <input
                type="number"
                value={formData.laboratory_cost}
                onChange={(e) => handleChange('laboratory_cost', e.target.value)}
                className="w-full p-2 border border-slate-300 rounded-md"
              />
            </div>
            <div>
              <label className="font-bold text-slate-700 block mb-1">Non-invasive labs</label>
              <input
                type="number"
                value={formData.non_invasive_lab_cost}
                onChange={(e) => handleChange('non_invasive_lab_cost', e.target.value)}
                className="w-full p-2 border border-slate-300 rounded-md"
              />
            </div>
            <div>
              <label className="font-bold text-slate-700 block mb-1">Consults</label>
              <input
                type="number"
                value={formData.consultation_cost}
                onChange={(e) => handleChange('consultation_cost', e.target.value)}
                className="w-full p-2 border border-slate-300 rounded-md"
              />
            </div>
            <div>
              <label className="font-bold text-slate-700 block mb-1">Radiology</label>
              <input
                type="number"
                value={formData.radiology_cost}
                onChange={(e) => handleChange('radiology_cost', e.target.value)}
                className="w-full p-2 border border-slate-300 rounded-md"
              />
            </div>
            <div>
              <label className="font-bold text-slate-700 block mb-1">Miscellaneous</label>
              <input
                type="number"
                value={formData.miscellaneous_cost}
                onChange={(e) => handleChange('miscellaneous_cost', e.target.value)}
                className="w-full p-2 border border-slate-300 rounded-md"
              />
            </div>
            <div className="col-span-2 p-3 bg-teal-50 border border-teal-200 rounded-lg flex flex-col justify-center items-center">
              <span className="font-bold text-teal-900 uppercase text-[10px] tracking-wider">Total:</span>
              <span className="text-xl font-extrabold text-teal-700">₹ {formData.total_cost || '0'}</span>
            </div>
          </div>
        </div>
      </SectionCard>

      {/* Follow-up Grid Section */}
      <SectionCard title="Follow-up Matrix" subtitle="Long-term Follow-up Grid (PDF Page 8)">
        <div className="space-y-4 text-xs overflow-x-auto">
          <table className="w-full text-left border-collapse border border-slate-200 min-w-[700px]">
            <thead>
              <tr className="bg-slate-100 text-slate-900">
                <th className="p-2.5 border border-slate-200 font-bold w-[240px]">Parameter</th>
                {[
                  { label: '1-month', months: 1 },
                  { label: '3-month', months: 3 },
                  { label: '6-month', months: 6 },
                  { label: '12-month', months: 12 }
                ].map(({ label, months }) => {
                  const baseDate = formData.discharge_date || formData.admission_date;
                  const expDate = calculateExpectedDate(baseDate, months);
                  return (
                    <th key={label} className="p-2 border border-slate-200 text-center font-bold">
                      <div className="text-slate-900 font-semibold">{label}</div>
                      {expDate && (
                        <div className="text-[10px] font-mono text-orange-700 bg-orange-50/90 border border-orange-200 rounded px-1.5 py-0.5 mt-1 inline-block whitespace-nowrap shadow-2xs">
                          📅 {formatDisplayDate(expDate)}
                        </div>
                      )}
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {/* Angina */}
              <tr className="hover:bg-slate-50">
                <td className="p-2 border border-slate-200 font-semibold">Angina</td>
                {['1m', '3m', '6m', '12m'].map(t => (
                  <td key={t} className="p-2 border border-slate-200 text-center">
                    <select
                      value={formData[`angina_${t}`]}
                      onChange={(e) => handleChange(`angina_${t}`, e.target.value)}
                      className="p-1 border rounded w-20 text-center bg-white"
                    >
                      <option value="Yes">Yes</option>
                      <option value="No">No</option>
                    </select>
                  </td>
                ))}
              </tr>

              {/* Func. Class */}
              <tr className="hover:bg-slate-50">
                <td className="p-2 border border-slate-200 font-semibold">Func. Class:</td>
                {['1m', '3m', '6m', '12m'].map(t => (
                  <td key={t} className="p-2 border border-slate-200 text-center">
                    <select
                      value={formData[`func_${t}`] || 'None'}
                      onChange={(e) => handleChange(`func_${t}`, e.target.value)}
                      className="p-1 border rounded w-20 text-center bg-white"
                    >
                      <option value="None">None</option>
                      <option value="I">Class I</option>
                      <option value="II">Class II</option>
                      <option value="III">Class III</option>
                      <option value="IV">Class IV</option>
                    </select>
                  </td>
                ))}
              </tr>

              {/* No. of antianginals */}
              <tr className="hover:bg-slate-50">
                <td className="p-2 border border-slate-200 font-semibold">No. of antianginals:</td>
                {['1m', '3m', '6m', '12m'].map(t => (
                  <td key={t} className="p-2 border border-slate-200 text-center">
                    <input
                      type="number"
                      value={formData[`antiang_${t}`]}
                      onChange={(e) => handleChange(`antiang_${t}`, e.target.value)}
                      className="p-1 border rounded w-20 text-center"
                    />
                  </td>
                ))}
              </tr>

              {/* Dual Antiplatelets */}
              <tr className="hover:bg-slate-50">
                <td className="p-2 border border-slate-200 font-semibold">Dual Antiplatelets:</td>
                {['1m', '3m', '6m', '12m'].map(t => (
                  <td key={t} className="p-2 border border-slate-200 text-center">
                    <select
                      value={formData[`dapt_${t}`]}
                      onChange={(e) => handleChange(`dapt_${t}`, e.target.value)}
                      className="p-1 border rounded w-20 text-center bg-white"
                    >
                      <option value="Yes">Yes</option>
                      <option value="No">No</option>
                    </select>
                  </td>
                ))}
              </tr>

              {/* Statins */}
              <tr className="hover:bg-slate-50">
                <td className="p-2 border border-slate-200 font-semibold">Statins:</td>
                {['1m', '3m', '6m', '12m'].map(t => (
                  <td key={t} className="p-2 border border-slate-200 text-center">
                    <select
                      value={formData[`statin_${t}`]}
                      onChange={(e) => handleChange(`statin_${t}`, e.target.value)}
                      className="p-1 border rounded w-20 text-center bg-white"
                    >
                      <option value="Yes">Yes</option>
                      <option value="No">No</option>
                    </select>
                  </td>
                ))}
              </tr>

              {/* Remaining rows mapping to simple checkboxes/selectors */}
              {[
                { label: 'Beta-blocker:', key: 'beta' },
                { label: 'ACEI/ ARB:', key: 'ace' },
                { label: 'Aldosterone Anta:', key: 'aldo' },
                { label: 'ACS Hospitalization:', key: 'acs' },
                { label: 'PTCA', key: 'ptca' },
                { label: 'CABG', key: 'cabg' },
                { label: 'Death', key: 'death' }
              ].map(row => (
                <tr key={row.key} className="hover:bg-slate-50">
                  <td className="p-2 border border-slate-200 font-semibold">{row.label}</td>
                  {['1m', '3m', '6m', '12m'].map(t => (
                    <td key={t} className="p-2 border border-slate-200 text-center">
                      <select
                        value={formData[`${row.key}_${t}`]}
                        onChange={(e) => handleChange(`${row.key}_${t}`, e.target.value)}
                        className="p-1 border rounded w-20 text-center bg-white"
                      >
                        <option value="Yes">Yes</option>
                        <option value="No">No</option>
                      </select>
                    </td>
                  ))}
                </tr>
              ))}

              {/* Any other */}
              <tr className="hover:bg-slate-50">
                <td className="p-2 border border-slate-200 font-semibold">Any other</td>
                {['1m', '3m', '6m', '12m'].map(t => (
                  <td key={t} className="p-2 border border-slate-200 text-center">
                    <input
                      type="text"
                      value={formData[`other_${t}`]}
                      onChange={(e) => handleChange(`other_${t}`, e.target.value)}
                      className="p-1 border rounded w-24 text-center"
                    />
                  </td>
                ))}
              </tr>
            </tbody>
          </table>

          {/* Follow-up Parameters & Instructions (Visit Mode & Special Instructions) */}
          <div className="mt-6 pt-4 border-t border-slate-200 space-y-4">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Follow-Up Parameters & Instructions
            </h4>

            {/* Visit Mode Radio Buttons */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Visit Mode
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {['In-Person', 'Tele-consultation', 'Phone Check-in'].map((mode) => (
                  <label
                    key={mode}
                    className={`flex items-center gap-2.5 p-3 rounded-lg border text-xs font-medium cursor-pointer transition-all ${
                      formData.visit_mode === mode
                        ? 'bg-orange-50 border-orange-500 text-orange-950 font-semibold shadow-xs'
                        : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name="visit_mode"
                      value={mode}
                      checked={formData.visit_mode === mode}
                      onChange={(e) => handleChange('visit_mode', e.target.value)}
                      className="text-orange-600 focus:ring-orange-500 w-4 h-4"
                    />
                    <span>{mode}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Special Clinical Instructions Textarea with Live Counter */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Special Clinical Instructions For Patient/Caregiver
                </label>
                <span className="text-[11px] font-mono text-slate-400">
                  {(formData.special_instructions?.length || 0)}/500
                </span>
              </div>
              <div className="relative">
                <textarea
                  rows={3}
                  maxLength={500}
                  value={formData.special_instructions || ''}
                  onChange={(e) => handleChange('special_instructions', e.target.value)}
                  placeholder="Specify instructions..."
                  className="w-full p-3 border border-slate-200 rounded-lg text-xs text-slate-800 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all placeholder:text-slate-400 resize-y"
                />
              </div>
            </div>
          </div>
        </div>
      </SectionCard>

    </div>
  );
});

export default NSTEMIForm;
