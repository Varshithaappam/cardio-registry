import React, { useState, forwardRef, useImperativeHandle, useMemo } from 'react';
import SectionCard from './common/SectionCard';
import { LABEL_STYLES, INPUT_DISABLED_STYLES } from './common/formStyles';
import { Sparkles, Layers, ArrowUpRight } from 'lucide-react';

const proceduresList = [
  { label: 'Indication for ICCU admission', key: 'appr_iccu_admission' },
  { label: 'ICCU transfer-out', key: 'appr_iccu_transfer_out' },
  { label: 'Indication for TLT (Thrombolysis)', key: 'appr_thrombolysis_indication' },
  { label: 'Indication for Primary PTCA (PAMI)', key: 'appr_ptca_indication' },
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
  { label: 'Clopidogrel', key: 'appr_clopidogrel' },
  { label: 'ACE-inhibitor', key: 'appr_ace_inhibitor' },
  { label: 'ARB', key: 'appr_arb' },
  { label: 'Statin', key: 'appr_statin' },
  { label: 'Diuretic', key: 'appr_diuretic' },
  { label: 'Lanoxin', key: 'appr_lanoxin' },
  { label: 'Anticoagulant', key: 'appr_anticoagulant' },
  { label: 'Amiodarone', key: 'appr_amiodarone' },
  { label: 'Any other', key: 'appr_other_drug_appropriateness', specifyKey: 'appr_other_drug_name' }
];

export const calculateExpectedDate = (baseDate, monthsToAdd) => {
  if (!baseDate) return null;
  const d = new Date(baseDate);
  if (isNaN(d.getTime())) return null;

  d.setMonth(d.getMonth() + monthsToAdd);

  if (d.getDay() === 0) {
    d.setDate(d.getDate() + 1);
  }

  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const formatDisplayDate = (dateStr) => {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '';
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}-${month}-${year}`;
};

const getFollowupInitialState = (followupArray, baseDate) => {
  const state = {
    enabled_1m: false, enabled_3m: false, enabled_6m: false, enabled_12m: false,
    date_1m: calculateExpectedDate(baseDate, 1) || '',
    date_3m: calculateExpectedDate(baseDate, 3) || '',
    date_6m: calculateExpectedDate(baseDate, 6) || '',
    date_12m: calculateExpectedDate(baseDate, 12) || '',
    custom_date_1m: false, custom_date_3m: false, custom_date_6m: false, custom_date_12m: false,
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
    other_1m: '', other_3m: '', other_6m: '', other_12m: '',
    visit_mode: 'In-Person',
    special_instructions: ''
  };

  if (!followupArray || !Array.isArray(followupArray)) return state;

  const mapping = {
    '1-Month': '1m', '1-month': '1m', '1m': '1m',
    '3-Month': '3m', '3-month': '3m', '3m': '3m',
    '6-Month': '6m', '6-month': '6m', '6m': '6m',
    '12-Month': '12m', '12-month': '12m', '12m': '12m'
  };

  followupArray.forEach(row => {
    const key = mapping[row.followup_month];
    if (key) {
      state[`enabled_${key}`] = true;
      if (row.followup_date) {
        state[`date_${key}`] = String(row.followup_date).split('T')[0];
        state[`custom_date_${key}`] = true;
      }
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

// 19 Sections Navigation Anchors
const SECTIONS_LIST = [
  { id: 'section-1', title: '1. Demographic Information', short: '1. Demographics' },
  { id: 'section-2', title: '2. Clinical Information', short: '2. Clinical Info' },
  { id: 'section-3', title: '3. Risk Stratification - TIMI Risk score', short: '3. TIMI Score' },
  { id: 'section-4', title: '4. Other Risk Factors', short: '4. Risk Factors' },
  { id: 'section-5', title: '5. Treatment Strategy', short: '5. Treatment Strategy' },
  { id: 'section-6', title: '6. PAMI details, if done', short: '6. PAMI Details' },
  { id: 'section-7', title: '7. Thrombolysis details', short: '7. Thrombolysis' },
  { id: 'section-8', title: '8. Drugs', short: '8. Acute Drugs' },
  { id: 'section-9', title: '9. Diagnostic Procedures', short: '9. Diagnostics' },
  { id: 'section-10', title: '10. Reports (ECG, Echo, Labs, CAG)', short: '10. Reports' },
  { id: 'section-11', title: '11. Invasive Procedures', short: '11. Invasive Proc.' },
  { id: 'section-12', title: '12. Out-comes', short: '12. Outcomes' },
  { id: 'section-13', title: '13. Discharge Medications', short: '13. Discharge Meds' },
  { id: 'section-14', title: '14. Appropriateness for various procedures', short: '14. Appr. Procedures' },
  { id: 'section-15', title: '15. Appropriateness for various investigations', short: '15. Appr. Labs' },
  { id: 'section-16', title: '16. Appropriateness for various drugs', short: '16. Appr. Drugs' },
  { id: 'section-17', title: '17. Length of Stay', short: '17. Length of Stay' },
  { id: 'section-18', title: '18. Cost of care', short: '18. Cost of Care' },
  { id: 'section-19', title: '19. Follow-up Matrix', short: '19. Follow-up' }
];

const STEMIForm = forwardRef(function STEMIForm(
  { patientRecord, patient: directPatient, editingRecord, readOnly = false },
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
    // Section 1: Demographic Information
    reg_patient_id: patient.id || patient.reg_patient_id || 1,
    name: patient.name || patient.patient_name || '',
    age: patientAge || patient.age || '',
    gender: patient.gender || 'M',
    mr_no: patient.mrNo || patient.mr_no || '',
    ip_no: editingRecord?.ip_no || '',
    admission_date: editingRecord?.admission_date || new Date().toISOString().split('T')[0],
    discharge_date: editingRecord?.discharge_date || '',
    primary_consultant: editingRecord?.primary_consultant || 'Dr. K. Sridhar (Cardiologist)',
    phone: patient.phone || patient.contact_phone || editingRecord?.phone || '',
    email: patient.email || patient.contact_email || editingRecord?.email || '',
    acs_no: editingRecord?.acs_no || '',

    // Section 2: Clinical Information (Background & Presentation & Vitals)
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

    typical_angina: editingRecord?.typical_angina ?? editingRecord?.clinical?.typical_angina ?? 'Yes',
    atypical_chest_pain: editingRecord?.atypical_chest_pain ?? editingRecord?.clinical?.atypical_chest_pain ?? 'No',
    breathlessness: editingRecord?.breathlessness ?? editingRecord?.clinical?.breathlessness ?? 'No',
    syncope_presyncope: editingRecord?.syncope_presyncope ?? editingRecord?.clinical?.syncope_presyncope ?? 'No',
    pulse_rate: editingRecord?.pulse_rate ?? editingRecord?.clinical?.pulse_rate ?? 72,
    systolic_bp: editingRecord?.systolic_bp ?? editingRecord?.clinical?.systolic_bp ?? 120,
    diastolic_bp: editingRecord?.diastolic_bp ?? editingRecord?.clinical?.diastolic_bp ?? 80,

    // Section 3: Risk Stratification - TIMI Risk score
    age_gt_75: editingRecord?.age_gt_75 || (patientAge >= 75 ? 'Yes' : 'No'),
    age_65_to_74: editingRecord?.age_65_to_74 || (patientAge >= 65 && patientAge < 75 ? 'Yes' : 'No'),
    history_dm_htn_angina: editingRecord?.history_dm_htn_angina || 'No',
    sbp_lt_100: editingRecord?.sbp_lt_100 || 'No',
    heart_rate_gt_100: editingRecord?.heart_rate_gt_100 || 'No',
    killip_class_ii_to_iv: editingRecord?.killip_class_ii_to_iv || 'No',
    anterior_mi_or_lbbb: editingRecord?.anterior_mi_or_lbbb || 'No',
    weight_lt_67kg: editingRecord?.weight_lt_67kg || 'No',
    reperfusion_gt_4hrs: editingRecord?.reperfusion_gt_4hrs || 'No',
    timi_total_score: editingRecord?.timi_total_score !== undefined ? editingRecord.timi_total_score : 0,

    // Section 4: Other Risk Factors
    lvf: editingRecord?.lvf || 'No',
    vt_vf: editingRecord?.vt_vf || 'No',
    bbb_chb: editingRecord?.bbb_chb || 'No',
    elevated_bnp: editingRecord?.elevated_bnp || 'No',
    elevated_crp: editingRecord?.elevated_crp || 'No',

    // Section 5: Treatment Strategy
    treatment_strategy: editingRecord?.pami === 'Yes' ? 'PAMI' : (editingRecord?.thrombolysis === 'Yes' ? 'Thrombolysis' : (editingRecord?.conservative === 'Yes' ? 'Conservative' : 'PAMI')),
    pami: editingRecord?.pami || 'Yes',
    thrombolysis: editingRecord?.thrombolysis || 'No',
    conservative: editingRecord?.conservative || 'No',

    // Section 6: PAMI details
    door_to_balloon_time: editingRecord?.door_to_balloon_time || '',
    vessel_lmca: editingRecord?.vessel_lmca === 'Yes' || editingRecord?.vessel_lmca === true,
    vessel_lad: editingRecord?.vessel_lad === 'Yes' || editingRecord?.vessel_lad === true || true,
    vessel_diagonal: editingRecord?.vessel_diagonal === 'Yes' || editingRecord?.vessel_diagonal === true,
    vessel_lcx: editingRecord?.vessel_lcx === 'Yes' || editingRecord?.vessel_lcx === true,
    vessel_ramus: editingRecord?.vessel_ramus === 'Yes' || editingRecord?.vessel_ramus === true,
    vessel_om: editingRecord?.vessel_om === 'Yes' || editingRecord?.vessel_om === true,
    vessel_rca: editingRecord?.vessel_rca === 'Yes' || editingRecord?.vessel_rca === true,
    vessel_pda: editingRecord?.vessel_pda === 'Yes' || editingRecord?.vessel_pda === true,
    vessel_segment: editingRecord?.vessel_segment || '',
    thrombosuction_done: editingRecord?.thrombosuction_done === 'Yes' ? 'Done' : (editingRecord?.thrombosuction_not_done === 'Yes' ? 'Not done' : 'Not done'),
    stent_type: editingRecord?.stent_des === 'Yes' ? 'DES' : (editingRecord?.stent_bms === 'Yes' ? 'BMS' : 'DES'),
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

    // Section 7: Thrombolysis details
    door_to_needle_time: editingRecord?.door_to_needle_time || '',
    drug_stk: editingRecord?.drug_stk === 'Yes' || editingRecord?.drug_stk === true,
    drug_uk: editingRecord?.drug_uk === 'Yes' || editingRecord?.drug_uk === true,
    drug_reteplase: editingRecord?.drug_reteplase === 'Yes' || editingRecord?.drug_reteplase === true,
    drug_tenecteplase: editingRecord?.drug_tenecteplase === 'Yes' || editingRecord?.drug_tenecteplase === true,
    thrombolysis_dose: editingRecord?.thrombolysis_dose || '',

    // Section 8: Acute Drugs
    beta_blocker: editingRecord?.beta_blocker || 'Yes',
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

    // Section 9: Diagnostic Procedures
    bedside_echo: editingRecord?.bedside_echo || 'Yes',
    departmental_echo: editingRecord?.departmental_echo || 'No',
    stress_testing: editingRecord?.stress_testing || 'No',
    lipid_profile: editingRecord?.lipid_profile || 'Yes',
    bnp: editingRecord?.bnp || 'No',
    crp: editingRecord?.crp || 'No',
    troponin_test: editingRecord?.troponin_test || 'Yes',
    cpk_ckmb: editingRecord?.cpk_ckmb || 'Yes',
    rft: editingRecord?.rft || 'Yes',
    lft: editingRecord?.lft || 'Yes',
    electrolytes: editingRecord?.electrolytes || 'Yes',
    hemogram: editingRecord?.hemogram || 'Yes',
    cxr: editingRecord?.cxr || 'Yes',
    diagnostic_other: editingRecord?.diagnostic_other || '',

    // Section 10: Reports -> ECG
    ecg_heart_rate: editingRecord?.ecg_heart_rate || 72,
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
    rhythm: editingRecord?.rhythm_af === 'Yes' ? 'AF' : (editingRecord?.rhythm_svt === 'Yes' ? 'SVT' : (editingRecord?.rhythm_vt === 'Yes' ? 'VT' : (editingRecord?.rhythm_vf === 'Yes' ? 'VF' : 'NSR'))),
    ecg_other: editingRecord?.ecg_other || '',

    // Section 10: Reports -> Echo
    echo_ef: editingRecord?.echo_ef || 50,
    lv_function: editingRecord?.lv_function_mild_lvd === 'Yes' ? 'Mild LVD' : (editingRecord?.lv_function_moderate_lvd === 'Yes' ? 'Moderate LVD' : (editingRecord?.lv_function_severe_lvd === 'Yes' ? 'Severe LVD' : 'Normal')),
    rwma_lad: editingRecord?.rwma_lad === 'Yes' || editingRecord?.rwma_lad === true || true,
    rwma_rca: editingRecord?.rwma_rca === 'Yes' || editingRecord?.rwma_rca === true,
    rwma_lcx: editingRecord?.rwma_lcx === 'Yes' || editingRecord?.rwma_lcx === true,
    mr_grade: editingRecord?.mr_mild === 'Yes' ? 'Mild' : (editingRecord?.mr_moderate === 'Yes' ? 'Moderate' : (editingRecord?.mr_severe === 'Yes' ? 'Severe' : 'None')),
    echo_e: editingRecord?.echo_e || '',
    echo_a: editingRecord?.echo_a || '',
    echo_dt: editingRecord?.echo_dt || '',
    echo_e_prime: editingRecord?.echo_e_prime || '',
    echo_tapsv: editingRecord?.echo_tapsv || '',
    echo_other: editingRecord?.echo_other || '',

    // Section 10: Reports -> Blood Investigations
    hemoglobin: editingRecord?.hemoglobin || 13.5,
    creatinine: editingRecord?.creatinine || 0.9,
    troponin_i: editingRecord?.troponin_i || 'Positive',
    cpk: editingRecord?.cpk || '',
    ck_mb: editingRecord?.ck_mb || '',
    sodium: editingRecord?.sodium || 138,
    potassium: editingRecord?.potassium || 4.2,
    rbs_admission: editingRecord?.rbs_admission || 130,

    // Section 10: Reports -> CAG
    angiogram_done: editingRecord?.angiogram_done || 'Yes',
    angiogram_finding: editingRecord?.angiogram_normal === 'Yes' ? 'Normal' : (editingRecord?.angiogram_1vd === 'Yes' ? '1VD' : (editingRecord?.angiogram_2vd === 'Yes' ? '2VD' : (editingRecord?.angiogram_3vd === 'Yes' ? '3VD' : (editingRecord?.angiogram_lmca === 'Yes' ? 'LMCA' : '1VD')))),

    // Section 11: Invasive Procedures
    cag: editingRecord?.cag || 'Yes',
    iabp: editingRecord?.iabp || 'No',
    invasive_ventilation: editingRecord?.invasive_ventilation || 'No',
    ptca: editingRecord?.ptca || 'Yes',
    cabg: editingRecord?.cabg || 'No',
    other_procedure: editingRecord?.other_procedure || '',

    // Section 12: Outcomes
    death: editingRecord?.death || 'No',
    stemi_for_nonstemi: editingRecord?.stemi_for_nonstemi || 'No',
    remi_for_stemi: editingRecord?.remi_for_stemi || 'No',
    revascularization_recurrent_ischemia: editingRecord?.revascularization_recurrent_ischemia || 'No',
    cva_thrombotic: editingRecord?.cva_thrombotic || 'No',
    cva_hemorrhagic: editingRecord?.cva_hemorrhagic || 'No',
    major_bleeding: editingRecord?.major_bleeding || 'No',
    outcome_other: editingRecord?.outcome_other || '',

    // Section 13: Discharge Medications
    discharge_beta_blocker: editingRecord?.discharge_beta_blocker ?? editingRecord?.outcomes?.beta_blocker ?? 'Yes',
    discharge_calcium_channel_blocker: editingRecord?.discharge_calcium_channel_blocker ?? editingRecord?.outcomes?.calcium_channel_blocker ?? 'No',
    discharge_nitrate: editingRecord?.discharge_nitrate ?? editingRecord?.outcomes?.nitrate ?? 'No',
    discharge_nicorandil: editingRecord?.discharge_nicorandil ?? editingRecord?.outcomes?.nicorandil ?? 'No',
    discharge_ivabradine: editingRecord?.discharge_ivabradine ?? editingRecord?.outcomes?.ivabradine ?? 'No',
    discharge_ranolazine: editingRecord?.discharge_ranolazine ?? editingRecord?.outcomes?.ranolazine ?? 'No',
    discharge_trimetazidine: editingRecord?.discharge_trimetazidine ?? editingRecord?.outcomes?.trimetazidine ?? 'No',
    discharge_aspirin: editingRecord?.discharge_aspirin ?? editingRecord?.outcomes?.aspirin ?? 'Yes',
    discharge_clopidogrel: editingRecord?.discharge_clopidogrel ?? editingRecord?.outcomes?.clopidogrel ?? 'No',
    discharge_prasugrel: editingRecord?.discharge_prasugrel ?? editingRecord?.outcomes?.prasugrel ?? 'No',
    discharge_ticagrelor: editingRecord?.discharge_ticagrelor ?? editingRecord?.outcomes?.ticagrelor ?? 'Yes',
    discharge_statin: editingRecord?.discharge_statin ?? editingRecord?.outcomes?.statin ?? 'Yes',
    discharge_statin_dose: editingRecord?.discharge_statin_10mg === 'Yes' ? '10 mg' : (editingRecord?.discharge_statin_20mg === 'Yes' ? '20 mg' : (editingRecord?.discharge_statin_80mg === 'Yes' ? '80 mg' : '40 mg')),
    discharge_other_medication: editingRecord?.discharge_other_medication ?? editingRecord?.outcomes?.discharge_other_medication ?? '',

    // Section 14, 15, 16: Appropriateness Assessment
    appr_iccu_admission: editingRecord?.appr_iccu_admission || 'Appropriate',
    appr_iccu_transfer_out: editingRecord?.appr_iccu_transfer_out || 'Appropriate',
    appr_thrombolysis_indication: editingRecord?.appr_thrombolysis_indication || 'Appropriate',
    appr_ptca_indication: editingRecord?.appr_ptca_indication || 'Appropriate',
    appr_invasive_monitoring: editingRecord?.appr_invasive_monitoring || 'Appropriate',
    appr_iabp_indication: editingRecord?.appr_iabp_indication || 'Inappropriate',
    appr_invasive_ventilation: editingRecord?.appr_invasive_ventilation || 'Inappropriate',
    appr_dialysis_indication: editingRecord?.appr_dialysis_indication || 'Inappropriate',
    appr_other_procedure_name: editingRecord?.appr_other_procedure_name || '',
    appr_other_procedure_appropriateness: editingRecord?.appr_other_procedure_appropriateness || 'Inappropriate',
    appr_cardiac_enzymes: editingRecord?.appr_cardiac_enzymes || 'Appropriate',
    appr_bnp: editingRecord?.appr_bnp || 'Inappropriate',
    appr_crp: editingRecord?.appr_crp || 'Inappropriate',
    appr_lipid_profile: editingRecord?.appr_lipid_profile || 'Appropriate',
    appr_bedside_echo: editingRecord?.appr_bedside_echo || 'Appropriate',
    appr_chest_xray: editingRecord?.appr_chest_xray || 'Appropriate',
    appr_beta_blockers: editingRecord?.appr_beta_blockers || 'Appropriate',
    appr_aspirin: editingRecord?.appr_aspirin || 'Appropriate',
    appr_clopidogrel: editingRecord?.appr_clopidogrel || 'Appropriate',
    appr_ace_inhibitor: editingRecord?.appr_ace_inhibitor || 'Appropriate',
    appr_arb: editingRecord?.appr_arb || 'Inappropriate',
    appr_statin: editingRecord?.appr_statin || 'Appropriate',
    appr_diuretic: editingRecord?.appr_diuretic || 'Inappropriate',
    appr_lanoxin: editingRecord?.appr_lanoxin || 'Inappropriate',
    appr_anticoagulant: editingRecord?.appr_anticoagulant || 'Appropriate',
    appr_amiodarone: editingRecord?.appr_amiodarone || 'Inappropriate',
    appr_other_drug_name: editingRecord?.appr_other_drug_name || '',
    appr_other_drug_appropriateness: editingRecord?.appr_other_drug_appropriateness || 'Inappropriate',

    // Section 17: Length of Stay
    iccu_hours: editingRecord?.iccu_hours || 48,
    stepdown_icu_hours: editingRecord?.stepdown_icu_hours || 24,
    floor_days: editingRecord?.floor_days || 2,
    total_hospital_stay_days: editingRecord?.total_hospital_stay_days || 5,

    // Section 18: Cost of care
    bed_charges: editingRecord?.bed_charges || '',
    drugs_disposables_cost: editingRecord?.drugs_disposables_cost || '',
    package_cost: editingRecord?.package_cost || '',
    laboratory_cost: editingRecord?.laboratory_cost || '',
    non_invasive_lab_cost: editingRecord?.non_invasive_lab_cost || '',
    consultation_cost: editingRecord?.consultation_cost || '',
    radiology_cost: editingRecord?.radiology_cost || '',
    miscellaneous_cost: editingRecord?.miscellaneous_cost || '',
    total_cost: editingRecord?.total_cost || '',

    // Section 19: Follow-up grid state
    ...getFollowupInitialState(
      editingRecord?.followup || editingRecord?.stemi_followup,
      editingRecord?.discharge_date || editingRecord?.admission_date || new Date().toISOString().split('T')[0]
    )
  });

  // Function to fill complete dummy test data across all 19 sections
  const fillDummyData = () => {
    const todayStr = new Date().toISOString().split('T')[0];
    const d = new Date();
    d.setDate(d.getDate() + 5);
    const dischargeVal = d.toISOString().split('T')[0];

    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const dummy = {
      // Section 1: Demographics
      ip_no: `IP-2026-${randomSuffix}`,
      acs_no: editingRecord?.acs_no || `ACS-STEMI-2026-${randomSuffix}`,
      admission_date: todayStr,
      discharge_date: dischargeVal,
      primary_consultant: 'Dr. K. Sridhar (Cardiologist)',
      phone: patient.phone || patient.contact_phone || '+91 98765 43210',
      email: patient.email || patient.contact_email || 'patient.stemi@example.com',

      // Section 2: Clinical Info
      hypertension: 'Yes',
      diabetes: 'Yes',
      smoking: 'Yes',
      renal_failure: 'No',
      copd: 'No',
      cva: 'No',
      prior_acs: 'No',
      prior_ptca: 'No',
      prior_cabg: 'No',
      other_background: 'Dyslipidemia, Family History of CAD',

      typical_angina: 'Yes',
      atypical_chest_pain: 'No',
      breathlessness: 'Yes',
      syncope_presyncope: 'No',
      pulse_rate: 104,
      systolic_bp: 95,
      diastolic_bp: 65,

      // Section 3: TIMI Risk score
      age_gt_75: 'No',
      age_65_to_74: 'Yes',
      history_dm_htn_angina: 'Yes',
      sbp_lt_100: 'Yes',
      heart_rate_gt_100: 'Yes',
      killip_class_ii_to_iv: 'Yes',
      anterior_mi_or_lbbb: 'Yes',
      weight_lt_67kg: 'Yes',
      reperfusion_gt_4hrs: 'Yes',

      // Section 4: Other Risk Factors
      lvf: 'Yes',
      vt_vf: 'No',
      bbb_chb: 'Yes',
      elevated_bnp: 'Yes',
      elevated_crp: 'Yes',

      // Section 5: Treatment Strategy
      treatment_strategy: 'PAMI',
      pami: 'Yes',
      thrombolysis: 'No',
      conservative: 'No',

      // Section 6: PAMI details
      door_to_balloon_time: 45,
      vessel_lmca: false,
      vessel_lad: true,
      vessel_diagonal: true,
      vessel_lcx: false,
      vessel_ramus: false,
      vessel_om: false,
      vessel_rca: false,
      vessel_pda: false,
      vessel_segment: 'Proximal LAD',
      thrombosuction_done: 'Done',
      stent_type: 'DES',
      stent_diameter: 3.5,
      stent_length: 28.0,
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

      // Section 7: Thrombolysis details
      door_to_needle_time: 25,
      drug_tenecteplase: true,
      drug_stk: false,
      drug_uk: false,
      drug_reteplase: false,
      thrombolysis_dose: '40 mg IV Single Bolus',

      // Section 8: Drugs
      beta_blocker: 'Yes',
      calcium_channel_blocker: 'No',
      nitrate: 'Yes',
      nicorandil: 'Yes',
      ivabradine: 'No',
      ranolazine: 'Yes',
      trimetazidine: 'No',
      aspirin: 'Yes',
      clopidogrel: 'No',
      prasugrel: 'No',
      ticagrelor: 'Yes',
      heparin_strategy: 'UFH i.v + LMWH',
      gp2b3a: 'Yes',
      bivaluridin: 'No',
      statin: 'Yes',
      statin_dose: '80 mg',
      other_drugs: 'Pantoprazole 40mg IV, Ondansetron 4mg',

      // Section 9: Diagnostic Procedures
      bedside_echo: 'Yes',
      departmental_echo: 'Yes',
      stress_testing: 'No',
      lipid_profile: 'Yes',
      bnp: 'Yes',
      crp: 'Yes',
      troponin_test: 'Yes',
      cpk_ckmb: 'Yes',
      rft: 'Yes',
      lft: 'Yes',
      electrolytes: 'Yes',
      hemogram: 'Yes',
      cxr: 'Yes',
      diagnostic_other: 'Coronary Angiography (CAG), 12-Lead Holter',

      // Section 10: Reports
      ecg_heart_rate: 104,
      av_block: '1-degree',
      bbb: 'LBBB',
      qwaves_none: false,
      qwaves_anterior: true,
      qwaves_anteroseptal: true,
      st_depression_none: false,
      st_depression_lateral: true,
      t_inversion_none: false,
      t_inversion_anterior: true,
      t_inversion_anteroseptal: true,
      rhythm: 'NSR',
      ecg_other: 'ST elevation 4mm in V1-V4, reciprocal ST depression in II, III, aVF',

      echo_ef: 40,
      lv_function: 'Mod. LVD',
      rwma_lad: true,
      rwma_rca: false,
      rwma_lcx: false,
      mr_grade: 'Mild',
      echo_e: 0.85,
      echo_a: 0.65,
      echo_dt: 180,
      echo_e_prime: 7.5,
      echo_tapsv: 16.5,
      echo_other: 'Antero-septal hypokinesia, LVEDD 54mm',

      hemoglobin: 13.8,
      creatinine: 1.1,
      troponin_i: '14.5 ng/ml (High Positive)',
      cpk: '1250 IU/L',
      ck_mb: '120 IU/L',
      sodium: 138,
      potassium: 4.3,
      rbs_admission: 168,

      angiogram_done: 'Yes',
      angiogram_finding: '1VD',

      // Section 11: Invasive Procedures
      cag: 'Yes',
      ptca: 'Yes',
      iabp: 'No',
      invasive_ventilation: 'No',
      cabg: 'No',
      other_procedure: 'Radial Artery Hemostasis Banding',

      // Section 12: Outcomes
      death: 'No',
      stemi_for_nonstemi: 'No',
      remi_for_stemi: 'No',
      revascularization_recurrent_ischemia: 'No',
      cva_thrombotic: 'No',
      cva_hemorrhagic: 'No',
      major_bleeding: 'No',
      outcome_other: 'Uneventful recovery, Haemodynamically stable',

      // Section 13: Discharge Medications
      discharge_beta_blocker: 'Yes',
      discharge_calcium_channel_blocker: 'No',
      discharge_nitrate: 'Yes',
      discharge_nicorandil: 'Yes',
      discharge_ivabradine: 'No',
      discharge_ranolazine: 'Yes',
      discharge_trimetazidine: 'No',
      discharge_aspirin: 'Yes',
      discharge_clopidogrel: 'No',
      discharge_prasugrel: 'No',
      discharge_ticagrelor: 'Yes',
      discharge_statin: 'Yes',
      discharge_statin_dose: '80 mg',
      discharge_other_medication: 'Metoprolol Succinate 50mg OD, Ramipril 2.5mg OD, Atorvastatin 80mg HS',

      // Section 14, 15, 16: Appropriateness Assessment
      appr_iccu_admission: 'Appropriate',
      appr_iccu_transfer_out: 'Appropriate',
      appr_thrombolysis_indication: 'Appropriate',
      appr_ptca_indication: 'Appropriate',
      appr_invasive_monitoring: 'Appropriate',
      appr_iabp_indication: 'Inappropriate',
      appr_invasive_ventilation: 'Inappropriate',
      appr_dialysis_indication: 'Inappropriate',
      appr_other_procedure_name: 'CABG',
      appr_other_procedure_appropriateness: 'Inappropriate',

      appr_cardiac_enzymes: 'Appropriate',
      appr_bnp: 'Appropriate',
      appr_crp: 'Appropriate',
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
      appr_other_drug_name: 'ARNI',
      appr_other_drug_appropriateness: 'Inappropriate',

      // Section 17: Length of Stay
      iccu_hours: 48,
      stepdown_icu_hours: 24,
      floor_days: 3,
      total_hospital_stay_days: 6,

      // Section 18: Cost of care
      bed_charges: 18000,
      drugs_disposables_cost: 42000,
      package_cost: 110000,
      laboratory_cost: 9500,
      non_invasive_lab_cost: 3500,
      consultation_cost: 8500,
      radiology_cost: 4000,
      miscellaneous_cost: 2500,
      total_cost: 198000,

      // Section 19: Followup Matrix
      enabled_1m: true, enabled_3m: true, enabled_6m: true, enabled_12m: true,
      date_1m: calculateExpectedDate(dischargeVal, 1),
      date_3m: calculateExpectedDate(dischargeVal, 3),
      date_6m: calculateExpectedDate(dischargeVal, 6),
      date_12m: calculateExpectedDate(dischargeVal, 12),
      angina_1m: 'No', angina_3m: 'No', angina_6m: 'No', angina_12m: 'No',
      func_1m: 'Class I', func_3m: 'Class I', func_6m: 'None', func_12m: 'None',
      antiang_1m: '1', antiang_3m: '1', antiang_6m: '1', antiang_12m: '1',
      dapt_1m: 'Yes', dapt_3m: 'Yes', dapt_6m: 'Yes', dapt_12m: 'Yes',
      statin_1m: 'Yes', statin_3m: 'Yes', statin_6m: 'Yes', statin_12m: 'Yes',
      beta_1m: 'Yes', beta_3m: 'Yes', beta_6m: 'Yes', beta_12m: 'Yes',
      ace_1m: 'Yes', ace_3m: 'Yes', ace_6m: 'Yes', ace_12m: 'Yes',
      aldo_1m: 'No', aldo_3m: 'No', aldo_6m: 'No', aldo_12m: 'No',
      acs_1m: 'No', acs_3m: 'No', acs_6m: 'No', acs_12m: 'No',
      ptca_1m: 'No', ptca_3m: 'No', ptca_6m: 'No', ptca_12m: 'No',
      cabg_1m: 'No', cabg_3m: 'No', cabg_6m: 'No', cabg_12m: 'No',
      death_1m: 'No', death_3m: 'No', death_6m: 'No', death_12m: 'No',
      other_1m: 'Patient doing well on DAPT',
      other_3m: 'Lipid LDL 55 mg/dL',
      other_6m: 'Echo EF improved to 50%',
      other_12m: 'Completed 1yr DAPT audit',
      visit_mode: 'In-Person',
      special_instructions: 'Follow up in cardiology OPD with repeat lipid profile, LFT, and 12-lead ECG.'
    };

    setFormData(prev => ({ ...prev, ...dummy }));
  };

  // Calculate STEMI TIMI Risk Score (0 to 16 pts)
  const timiCalculatedScore = useMemo(() => {
    let score = 0;
    if (formData.age_gt_75 === 'Yes') score += 3;
    if (formData.age_65_to_74 === 'Yes') score += 2;
    if (formData.history_dm_htn_angina === 'Yes') score += 1;
    if (formData.sbp_lt_100 === 'Yes') score += 3;
    if (formData.heart_rate_gt_100 === 'Yes') score += 2;
    if (formData.killip_class_ii_to_iv === 'Yes') score += 2;
    if (formData.anterior_mi_or_lbbb === 'Yes') score += 1;
    if (formData.weight_lt_67kg === 'Yes') score += 1;
    if (formData.reperfusion_gt_4hrs === 'Yes') score += 1;
    return score;
  }, [
    formData.age_gt_75,
    formData.age_65_to_74,
    formData.history_dm_htn_angina,
    formData.sbp_lt_100,
    formData.heart_rate_gt_100,
    formData.killip_class_ii_to_iv,
    formData.anterior_mi_or_lbbb,
    formData.weight_lt_67kg,
    formData.reperfusion_gt_4hrs
  ]);

  const timiRiskCategory = useMemo(() => {
    if (timiCalculatedScore <= 2) return { label: 'Low Risk', color: 'bg-emerald-100 text-emerald-800 border-emerald-300', mortality: '1.6% - 2.2% 30-Day Mortality' };
    if (timiCalculatedScore <= 5) return { label: 'Intermediate Risk', color: 'bg-rose-100 text-rose-800 border-rose-300', mortality: '4.4% - 7.3% 30-Day Mortality' };
    if (timiCalculatedScore <= 8) return { label: 'High Risk', color: 'bg-red-100 text-red-800 border-red-300', mortality: '12.4% - 26.8% 30-Day Mortality' };
    return { label: 'Very High / Critical Risk', color: 'bg-red-200 text-red-950 border-red-400 font-extrabold', mortality: '35.9% 30-Day Mortality' };
  }, [timiCalculatedScore]);

  // Auto-calculated sum of hospitalization costs
  const autoSumCost = useMemo(() => {
    const fields = [
      'bed_charges', 'drugs_disposables_cost', 'package_cost', 'laboratory_cost',
      'non_invasive_lab_cost', 'consultation_cost', 'radiology_cost', 'miscellaneous_cost'
    ];
    let sum = 0;
    let hasAny = false;
    fields.forEach(f => {
      const val = parseFloat(formData[f]);
      if (!isNaN(val)) {
        sum += val;
        hasAny = true;
      }
    });
    return hasAny ? sum : null;
  }, [
    formData.bed_charges, formData.drugs_disposables_cost, formData.package_cost,
    formData.laboratory_cost, formData.non_invasive_lab_cost, formData.consultation_cost,
    formData.radiology_cost, formData.miscellaneous_cost
  ]);

  const handleChange = (field, value) => {
    setFormData(prev => {
      const updated = { ...prev, [field]: value };

      if ((field === 'admission_date' || field === 'discharge_date') && value) {
        const baseDate = updated.discharge_date || updated.admission_date;
        ['1m', '3m', '6m', '12m'].forEach(k => {
          if (!prev[`custom_date_${k}`]) {
            const months = k === '1m' ? 1 : k === '3m' ? 3 : k === '6m' ? 6 : 12;
            updated[`date_${k}`] = calculateExpectedDate(baseDate, months) || '';
          }
        });
      }

      return updated;
    });
  };

  const getFlattenedData = () => {
    const strategy = formData.treatment_strategy;
    const isPami = strategy === 'PAMI';
    const isTb = strategy === 'Thrombolysis';
    const isCons = strategy === 'Conservative';

    const intervals = [
      { key: '1m', monthLabel: '1-Month', months: 1 },
      { key: '3m', monthLabel: '3-Month', months: 3 },
      { key: '6m', monthLabel: '6-Month', months: 6 },
      { key: '12m', monthLabel: '12-Month', months: 12 }
    ];

    const followupArray = [];
    const baseFollowupDate = formData.discharge_date || formData.admission_date;

    intervals.forEach(({ key, monthLabel, months }) => {
      if (formData[`enabled_${key}`]) {
        const finalDate = formData[`date_${key}`] || calculateExpectedDate(baseFollowupDate, months);
        followupArray.push({
          followup_month: monthLabel,
          followup_date: finalDate,
          angina: formData[`angina_${key}`] || 'No',
          functional_class: formData[`func_${key}`] || 'None',
          number_of_antianginals: formData[`antiang_${key}`] !== '' ? parseInt(formData[`antiang_${key}`], 10) : null,
          dual_antiplatelets: formData[`dapt_${key}`] || 'No',
          statins: formData[`statin_${key}`] || 'No',
          beta_blocker: formData[`beta_${key}`] || 'No',
          acei_arb: formData[`ace_${key}`] || 'No',
          aldosterone_antagonist: formData[`aldo_${key}`] || 'No',
          acs_hospitalization: formData[`acs_${key}`] || 'No',
          ptca: formData[`ptca_${key}`] || 'No',
          cabg: formData[`cabg_${key}`] || 'No',
          death: formData[`death_${key}`] || 'No',
          other_event: formData[`other_${key}`] || '',
          visit_mode: formData.visit_mode || 'In-Person',
          special_instructions: formData.special_instructions || ''
        });
      }
    });

    return {
      // 1. Demographic Information
      reg_patient_id: patient.id || patient.reg_patient_id || formData.reg_patient_id || 1,
      name: formData.name,
      age: formData.age ? parseInt(formData.age, 10) : null,
      gender: formData.gender,
      mr_no: formData.mr_no,
      acs_no: formData.acs_no || formData.ip_no || 'STEMI-' + Date.now(),
      ip_no: formData.ip_no || 'IP' + Date.now().toString().slice(-5),
      admission_date: formData.admission_date,
      discharge_date: formData.discharge_date || null,
      primary_consultant: formData.primary_consultant || 'Dr. K. Sridhar (Cardiologist)',
      phone: formData.phone || null,
      email: formData.email || null,

      // 2. Clinical Information (Background & Presentation & Vitals)
      hypertension: formData.hypertension,
      diabetes: formData.diabetes,
      smoking: formData.smoking,
      renal_failure: formData.renal_failure,
      copd: formData.copd,
      cva: formData.cva,
      prior_acs: formData.prior_acs,
      prior_ptca: formData.prior_ptca,
      prior_cabg: formData.prior_cabg,
      other_background: formData.other_background || null,

      typical_angina: formData.typical_angina,
      atypical_chest_pain: formData.atypical_chest_pain,
      breathlessness: formData.breathlessness,
      syncope_presyncope: formData.syncope_presyncope,
      pulse_rate: formData.pulse_rate ? parseInt(formData.pulse_rate, 10) : null,
      systolic_bp: formData.systolic_bp ? parseInt(formData.systolic_bp, 10) : null,
      diastolic_bp: formData.diastolic_bp ? parseInt(formData.diastolic_bp, 10) : null,

      // 3. Risk Stratification - TIMI Risk score
      age_gt_75: formData.age_gt_75,
      age_65_to_74: formData.age_65_to_74,
      history_dm_htn_angina: formData.history_dm_htn_angina,
      sbp_lt_100: formData.sbp_lt_100,
      heart_rate_gt_100: formData.heart_rate_gt_100,
      killip_class_ii_to_iv: formData.killip_class_ii_to_iv,
      anterior_mi_or_lbbb: formData.anterior_mi_or_lbbb,
      weight_lt_67kg: formData.weight_lt_67kg,
      reperfusion_gt_4hrs: formData.reperfusion_gt_4hrs,
      timi_total_score: timiCalculatedScore,

      // 4. Other Risk Factors
      lvf: formData.lvf,
      vt_vf: formData.vt_vf,
      bbb_chb: formData.bbb_chb,
      elevated_bnp: formData.elevated_bnp,
      elevated_crp: formData.elevated_crp,

      // 5. Treatment Strategy
      pami: isPami ? 'Yes' : 'No',
      thrombolysis: isTb ? 'Yes' : 'No',
      conservative: isCons ? 'Yes' : 'No',

      // 6. PAMI details
      door_to_balloon_time: isPami && formData.door_to_balloon_time ? parseInt(formData.door_to_balloon_time, 10) : null,
      vessel_lmca: formData.vessel_lmca ? 'Yes' : 'No',
      vessel_lad: formData.vessel_lad ? 'Yes' : 'No',
      vessel_diagonal: formData.vessel_diagonal ? 'Yes' : 'No',
      vessel_lcx: formData.vessel_lcx ? 'Yes' : 'No',
      vessel_ramus: formData.vessel_ramus ? 'Yes' : 'No',
      vessel_om: formData.vessel_om ? 'Yes' : 'No',
      vessel_rca: formData.vessel_rca ? 'Yes' : 'No',
      vessel_pda: formData.vessel_pda ? 'Yes' : 'No',
      vessel_segment: formData.vessel_segment || null,
      thrombosuction_done: formData.thrombosuction_done === 'Done' ? 'Yes' : 'No',
      thrombosuction_not_done: formData.thrombosuction_done === 'Not done' ? 'Yes' : 'No',
      stent_bms: formData.stent_type === 'BMS' ? 'Yes' : 'No',
      stent_des: formData.stent_type === 'DES' ? 'Yes' : 'No',
      stent_diameter: formData.stent_diameter ? parseFloat(formData.stent_diameter) : null,
      stent_length: formData.stent_length ? parseFloat(formData.stent_length) : null,
      procedural_success: formData.procedural_success,
      timi_flow: parseInt(formData.timi_flow, 10),
      complication_none: formData.complication_none ? 'Yes' : 'No',
      complication_tamponade: formData.complication_tamponade ? 'Yes' : 'No',
      complication_major_bleed: formData.complication_major_bleed ? 'Yes' : 'No',
      complication_stroke: formData.complication_stroke ? 'Yes' : 'No',
      complication_stent_thrombosis: formData.complication_stent_thrombosis ? 'Yes' : 'No',
      complication_mi: formData.complication_mi ? 'Yes' : 'No',
      complication_death: formData.complication_death ? 'Yes' : 'No',
      complication_emergency_cabg: formData.complication_emergency_cabg ? 'Yes' : 'No',

      // 7. Thrombolysis details
      door_to_needle_time: isTb && formData.door_to_needle_time ? parseInt(formData.door_to_needle_time, 10) : null,
      drug_stk: formData.drug_stk ? 'Yes' : 'No',
      drug_uk: formData.drug_uk ? 'Yes' : 'No',
      drug_reteplase: formData.drug_reteplase ? 'Yes' : 'No',
      drug_tenecteplase: formData.drug_tenecteplase ? 'Yes' : 'No',
      thrombolysis_dose: formData.thrombolysis_dose || null,

      // 8. Acute Drugs
      beta_blocker: formData.beta_blocker,
      calcium_channel_blocker: formData.calcium_channel_blocker,
      nitrate: formData.nitrate,
      nicorandil: formData.nicorandil,
      ivabradine: formData.ivabradine,
      ranolazine: formData.ranolazine,
      trimetazidine: formData.trimetazidine,
      aspirin: formData.aspirin,
      clopidogrel: formData.clopidogrel,
      prasugrel: formData.prasugrel,
      ticagrelor: formData.ticagrelor,
      heparin_ufh_iv: formData.heparin_strategy === 'UFH i.v alone' ? 'Yes' : 'No',
      heparin_ufh_sc: formData.heparin_strategy === 'UFH s.c alone' ? 'Yes' : 'No',
      heparin_lmwh: formData.heparin_strategy === 'LMWH alone' ? 'Yes' : 'No',
      heparin_ufh_iv_sc: formData.heparin_strategy === 'UFH i.v+UFHs.c' ? 'Yes' : 'No',
      heparin_ufh_iv_lmwh: formData.heparin_strategy === 'UFH i.v + LMWH' ? 'Yes' : 'No',
      gp2b3a: formData.gp2b3a,
      bivaluridin: formData.bivaluridin,
      statin: formData.statin,
      statin_10mg: formData.statin_dose === '10 mg' ? 'Yes' : 'No',
      statin_20mg: formData.statin_dose === '20 mg' ? 'Yes' : 'No',
      statin_40mg: formData.statin_dose === '40 mg' ? 'Yes' : 'No',
      statin_80mg: formData.statin_dose === '80 mg' ? 'Yes' : 'No',
      other_drugs: formData.other_drugs || null,

      // 9. Diagnostic Procedures
      bedside_echo: formData.bedside_echo,
      departmental_echo: formData.departmental_echo,
      stress_testing: formData.stress_testing,
      lipid_profile: formData.lipid_profile,
      bnp: formData.bnp,
      crp: formData.crp,
      troponin_test: formData.troponin_test,
      cpk_ckmb: formData.cpk_ckmb,
      rft: formData.rft,
      lft: formData.lft,
      electrolytes: formData.electrolytes,
      hemogram: formData.hemogram,
      cxr: formData.cxr,
      diagnostic_other: formData.diagnostic_other || null,

      // 10. Reports (ECG, Echo, Blood Labs, CAG)
      ecg_heart_rate: formData.ecg_heart_rate ? parseInt(formData.ecg_heart_rate, 10) : null,
      av_block_none: formData.av_block === 'None' ? 'Yes' : 'No',
      av_block_first_degree: formData.av_block === '1-degree' ? 'Yes' : 'No',
      av_block_second_degree: formData.av_block === '2-degree' ? 'Yes' : 'No',
      av_block_chb: formData.av_block === 'CHB' ? 'Yes' : 'No',
      bbb_none: formData.bbb === 'None' ? 'Yes' : 'No',
      bbb_rbbb: formData.bbb === 'RBBB' ? 'Yes' : 'No',
      bbb_lbbb: formData.bbb === 'LBBB' ? 'Yes' : 'No',
      bbb_indeterminate: formData.bbb === 'Indeterminate' ? 'Yes' : 'No',
      qwaves_none: formData.qwaves_none ? 'Yes' : 'No',
      qwaves_inferior: formData.qwaves_inferior ? 'Yes' : 'No',
      qwaves_anteroseptal: formData.qwaves_anteroseptal ? 'Yes' : 'No',
      qwaves_anterior: formData.qwaves_anterior ? 'Yes' : 'No',
      qwaves_anterolateral: formData.qwaves_anterolateral ? 'Yes' : 'No',
      qwaves_lateral: formData.qwaves_lateral ? 'Yes' : 'No',
      st_depression_none: formData.st_depression_none ? 'Yes' : 'No',
      st_depression_inferior: formData.st_depression_inferior ? 'Yes' : 'No',
      st_depression_anteroseptal: formData.st_depression_anteroseptal ? 'Yes' : 'No',
      st_depression_anterior: formData.st_depression_anterior ? 'Yes' : 'No',
      st_depression_anterolateral: formData.st_depression_anterolateral ? 'Yes' : 'No',
      st_depression_lateral: formData.st_depression_lateral ? 'Yes' : 'No',
      t_inversion_none: formData.t_inversion_none ? 'Yes' : 'No',
      t_inversion_inferior: formData.t_inversion_inferior ? 'Yes' : 'No',
      t_inversion_anteroseptal: formData.t_inversion_anteroseptal ? 'Yes' : 'No',
      t_inversion_anterior: formData.t_inversion_anterior ? 'Yes' : 'No',
      t_inversion_anterolateral: formData.t_inversion_anterolateral ? 'Yes' : 'No',
      t_inversion_lateral: formData.t_inversion_lateral ? 'Yes' : 'No',
      rhythm_nsr: formData.rhythm === 'NSR' ? 'Yes' : 'No',
      rhythm_af: formData.rhythm === 'AF' ? 'Yes' : 'No',
      rhythm_svt: formData.rhythm === 'SVT' ? 'Yes' : 'No',
      rhythm_vt: formData.rhythm === 'VT' ? 'Yes' : 'No',
      rhythm_vf: formData.rhythm === 'VF' ? 'Yes' : 'No',
      ecg_other: formData.ecg_other || null,

      echo_ef: formData.echo_ef ? parseFloat(formData.echo_ef) : null,
      lv_function_normal: formData.lv_function === 'Normal' ? 'Yes' : 'No',
      lv_function_mild_lvd: formData.lv_function === 'Mild LVD' ? 'Yes' : 'No',
      lv_function_moderate_lvd: formData.lv_function === 'Moderate LVD' ? 'Yes' : 'No',
      lv_function_severe_lvd: formData.lv_function === 'Severe LVD' ? 'Yes' : 'No',
      rwma_lad: formData.rwma_lad ? 'Yes' : 'No',
      rwma_rca: formData.rwma_rca ? 'Yes' : 'No',
      rwma_lcx: formData.rwma_lcx ? 'Yes' : 'No',
      mr_none: formData.mr_grade === 'None' ? 'Yes' : 'No',
      mr_mild: formData.mr_grade === 'Mild' ? 'Yes' : 'No',
      mr_moderate: formData.mr_grade === 'Moderate' ? 'Yes' : 'No',
      mr_severe: formData.mr_grade === 'Severe' ? 'Yes' : 'No',
      echo_e: formData.echo_e ? parseFloat(formData.echo_e) : null,
      echo_a: formData.echo_a ? parseFloat(formData.echo_a) : null,
      echo_dt: formData.echo_dt ? parseFloat(formData.echo_dt) : null,
      echo_e_prime: formData.echo_e_prime ? parseFloat(formData.echo_e_prime) : null,
      echo_tapsv: formData.echo_tapsv ? parseFloat(formData.echo_tapsv) : null,
      echo_other: formData.echo_other || null,

      hemoglobin: formData.hemoglobin ? parseFloat(formData.hemoglobin) : null,
      creatinine: formData.creatinine ? parseFloat(formData.creatinine) : null,
      troponin_i: formData.troponin_i || null,
      cpk: formData.cpk || null,
      ck_mb: formData.ck_mb || null,
      sodium: formData.sodium ? parseFloat(formData.sodium) : null,
      potassium: formData.potassium ? parseFloat(formData.potassium) : null,
      rbs_admission: formData.rbs_admission ? parseFloat(formData.rbs_admission) : null,

      angiogram_done: formData.angiogram_done,
      angiogram_normal: formData.angiogram_finding === 'Normal' ? 'Yes' : 'No',
      angiogram_1vd: formData.angiogram_finding === '1VD' ? 'Yes' : 'No',
      angiogram_2vd: formData.angiogram_finding === '2VD' ? 'Yes' : 'No',
      angiogram_3vd: formData.angiogram_finding === '3VD' ? 'Yes' : 'No',
      angiogram_lmca: formData.angiogram_finding === 'LMCA' ? 'Yes' : 'No',

      // 11. Invasive Procedures
      cag: formData.cag,
      iabp: formData.iabp,
      invasive_ventilation: formData.invasive_ventilation,
      ptca: formData.ptca,
      cabg: formData.cabg,
      other_procedure: formData.other_procedure || null,

      // 12. Outcomes
      death: formData.death,
      stemi_for_nonstemi: formData.stemi_for_nonstemi,
      remi_for_stemi: formData.remi_for_stemi,
      revascularization_recurrent_ischemia: formData.revascularization_recurrent_ischemia,
      cva_thrombotic: formData.cva_thrombotic,
      cva_hemorrhagic: formData.cva_hemorrhagic,
      major_bleeding: formData.major_bleeding,
      outcome_other: formData.outcome_other || null,

      // 13. Discharge Medications
      discharge_beta_blocker: formData.discharge_beta_blocker,
      discharge_calcium_channel_blocker: formData.discharge_calcium_channel_blocker,
      discharge_nitrate: formData.discharge_nitrate,
      discharge_nicorandil: formData.discharge_nicorandil,
      discharge_ivabradine: formData.discharge_ivabradine,
      discharge_ranolazine: formData.discharge_ranolazine,
      discharge_trimetazidine: formData.discharge_trimetazidine,
      discharge_aspirin: formData.discharge_aspirin,
      discharge_clopidogrel: formData.discharge_clopidogrel,
      discharge_prasugrel: formData.discharge_prasugrel,
      discharge_ticagrelor: formData.discharge_ticagrelor,
      discharge_statin: formData.discharge_statin,
      discharge_statin_10mg: formData.discharge_statin_dose === '10 mg' ? 'Yes' : 'No',
      discharge_statin_20mg: formData.discharge_statin_dose === '20 mg' ? 'Yes' : 'No',
      discharge_statin_40mg: formData.discharge_statin_dose === '40 mg' ? 'Yes' : 'No',
      discharge_statin_80mg: formData.discharge_statin_dose === '80 mg' ? 'Yes' : 'No',
      discharge_other_medication: formData.discharge_other_medication || null,

      // 14, 15, 16. Appropriateness Assessment
      appr_iccu_admission: formData.appr_iccu_admission,
      appr_iccu_transfer_out: formData.appr_iccu_transfer_out,
      appr_thrombolysis_indication: formData.appr_thrombolysis_indication,
      appr_ptca_indication: formData.appr_ptca_indication,
      appr_invasive_monitoring: formData.appr_invasive_monitoring,
      appr_iabp_indication: formData.appr_iabp_indication,
      appr_invasive_ventilation: formData.appr_invasive_ventilation,
      appr_dialysis_indication: formData.appr_dialysis_indication,
      appr_other_procedure_name: formData.appr_other_procedure_name || null,
      appr_other_procedure_appropriateness: formData.appr_other_procedure_appropriateness,

      appr_cardiac_enzymes: formData.appr_cardiac_enzymes,
      appr_bnp: formData.appr_bnp,
      appr_crp: formData.appr_crp,
      appr_lipid_profile: formData.appr_lipid_profile,
      appr_bedside_echo: formData.appr_bedside_echo,
      appr_chest_xray: formData.appr_chest_xray,

      appr_beta_blockers: formData.appr_beta_blockers,
      appr_aspirin: formData.appr_aspirin,
      appr_clopidogrel: formData.appr_clopidogrel,
      appr_ace_inhibitor: formData.appr_ace_inhibitor,
      appr_arb: formData.appr_arb,
      appr_statin: formData.appr_statin,
      appr_diuretic: formData.appr_diuretic,
      appr_lanoxin: formData.appr_lanoxin,
      appr_anticoagulant: formData.appr_anticoagulant,
      appr_amiodarone: formData.appr_amiodarone,
      appr_other_drug_name: formData.appr_other_drug_name || null,
      appr_other_drug_appropriateness: formData.appr_other_drug_appropriateness,

      // 17. Length of Stay
      iccu_hours: formData.iccu_hours ? parseInt(formData.iccu_hours, 10) : null,
      stepdown_icu_hours: formData.stepdown_icu_hours ? parseInt(formData.stepdown_icu_hours, 10) : null,
      floor_days: formData.floor_days ? parseInt(formData.floor_days, 10) : null,
      total_hospital_stay_days: formData.total_hospital_stay_days ? parseInt(formData.total_hospital_stay_days, 10) : null,

      // 18. Cost of care
      bed_charges: formData.bed_charges ? parseFloat(formData.bed_charges) : null,
      drugs_disposables_cost: formData.drugs_disposables_cost ? parseFloat(formData.drugs_disposables_cost) : null,
      package_cost: formData.package_cost ? parseFloat(formData.package_cost) : null,
      laboratory_cost: formData.laboratory_cost ? parseFloat(formData.laboratory_cost) : null,
      non_invasive_lab_cost: formData.non_invasive_lab_cost ? parseFloat(formData.non_invasive_lab_cost) : null,
      consultation_cost: formData.consultation_cost ? parseFloat(formData.consultation_cost) : null,
      radiology_cost: formData.radiology_cost ? parseFloat(formData.radiology_cost) : null,
      miscellaneous_cost: formData.miscellaneous_cost ? parseFloat(formData.miscellaneous_cost) : null,
      total_cost: formData.total_cost ? parseFloat(formData.total_cost) : (autoSumCost !== null ? autoSumCost : null),

      // 19. Followup Matrix
      followup: followupArray
    };
  };

  useImperativeHandle(ref, () => ({
    getSubmissionData: () => getFlattenedData(),
    fillDummyData: () => fillDummyData(),
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

  const renderRadio = (field, label, options = ['Yes', 'No', 'Unknown']) => (
    <div className="flex items-center justify-between p-2.5 bg-slate-50/70 border border-slate-200/80 rounded-lg">
      <span className="text-xs font-semibold text-slate-700">{label}</span>
      <div className="flex gap-3">
        {options.map((opt) => (
          <label key={opt} className="flex items-center gap-1.5 cursor-pointer text-xs">
            <input
              type="radio"
              disabled={readOnly}
              name={`${field}-${label}`}
              checked={formData[field] === opt}
              onChange={() => handleChange(field, opt)}
              className="text-red-600 focus:ring-red-500"
            />
            <span className="font-bold text-slate-800">{opt}</span>
          </label>
        ))}
      </div>
    </div>
  );

  const renderAppropriatenessRadio = (field, label) => (
    <div className="flex items-center justify-between p-2.5 bg-slate-50/70 border border-slate-200/80 rounded-lg">
      <span className="text-xs font-semibold text-slate-700">{label}</span>
      <div className="flex gap-3">
        {['Appropriate', 'Inappropriate'].map((opt) => (
          <label key={opt} className="flex items-center gap-1.5 cursor-pointer text-xs">
            <input
              type="radio"
              disabled={readOnly}
              name={`${field}-${label}`}
              checked={formData[field] === opt || (formData[field] === '+' && opt === 'Appropriate') || (formData[field] === 'NA' && opt === 'Inappropriate')}
              onChange={() => handleChange(field, opt)}
              className="text-red-600 focus:ring-red-500"
            />
            <span className={`font-bold ${opt === 'Appropriate' ? 'text-emerald-700' : 'text-slate-600'}`}>{opt}</span>
          </label>
        ))}
      </div>
    </div>
  );

  const scrollToSection = (sectionId) => {
    const el = document.getElementById(sectionId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div className="space-y-6 text-slate-800">
      {/* Sticky Table of Contents / Section Anchor Bar */}
      {!readOnly && (
        <div className="sticky top-14 z-30 bg-slate-900/95 backdrop-blur-md border border-slate-800 rounded-xl p-3 text-white shadow-lg">
          <div className="flex items-center justify-between flex-wrap gap-2 mb-2">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 bg-red-600 text-white rounded text-xs font-black uppercase tracking-wider shadow-xs">
                STEMI LONG FORM (19 SECTIONS)
              </span>
              <span className="text-xs text-slate-300 font-semibold hidden sm:inline">
                Click any section badge to jump directly
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                id="btn-stemi-fill-dummy-data"
                type="button"
                onClick={fillDummyData}
                className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-xs font-extrabold transition-all flex items-center gap-1.5 cursor-pointer shadow-sm border border-red-500"
                title="Autofill complete test data across all 19 STEMI sections"
              >
                <Sparkles className="w-3.5 h-3.5 text-rose-200 animate-pulse" />
                <span>Fill Dummy Data (Test STEMI)</span>
              </button>
            </div>
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden py-1">
            {SECTIONS_LIST.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => scrollToSection(s.id)}
                className="px-2.5 py-1 bg-slate-800 hover:bg-red-600 text-slate-200 hover:text-white rounded text-[11px] font-bold transition-all shrink-0 border border-slate-700 hover:border-red-500 cursor-pointer"
              >
                {s.short}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SECTION 1: Demographic Information                                        */}
      {/* ========================================================================= */}
      <div id="section-1">
        <SectionCard title="1. Demographic Information" subtitle="Demographics, Patient Linkage, Contact details & Administrative Keys">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
            <div>
              <label className={LABEL_STYLES}>Name</label>
              <input
                type="text"
                disabled={readOnly}
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-1 focus:ring-red-500 font-medium"
              />
            </div>
            <div>
              <label className={LABEL_STYLES}>Age (yrs)</label>
              <input
                type="number"
                disabled={readOnly}
                value={formData.age}
                onChange={(e) => handleChange('age', e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-1 focus:ring-red-500 font-bold"
              />
            </div>
            <div>
              <label className={LABEL_STYLES}>Gender (M/F)</label>
              <select
                disabled={readOnly}
                value={formData.gender}
                onChange={(e) => handleChange('gender', e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-1 focus:ring-red-500 bg-white font-bold"
              >
                <option value="M">Male (M)</option>
                <option value="F">Female (F)</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div>
              <label className={LABEL_STYLES}>MR No</label>
              <input
                type="text"
                disabled={readOnly}
                value={formData.mr_no}
                onChange={(e) => handleChange('mr_no', e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-1 focus:ring-red-500 font-mono"
              />
            </div>
            <div>
              <label className={LABEL_STYLES}>IP No</label>
              <input
                type="text"
                disabled={readOnly}
                value={formData.ip_no}
                onChange={(e) => handleChange('ip_no', e.target.value)}
                placeholder="e.g. IP00123"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-1 focus:ring-red-500 font-mono"
              />
            </div>
            <div>
              <label className={LABEL_STYLES}>ACS No</label>
              <input
                type="text"
                disabled={readOnly}
                value={formData.acs_no}
                onChange={(e) => handleChange('acs_no', e.target.value)}
                placeholder="e.g. ACS-2026-001"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-1 focus:ring-red-500 font-mono"
              />
            </div>
            <div>
              <label className={LABEL_STYLES}>Date of Admission *</label>
              <input
                type="date"
                disabled={readOnly}
                value={formData.admission_date}
                onChange={(e) => handleChange('admission_date', e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-1 focus:ring-red-500"
              />
            </div>
            <div>
              <label className={LABEL_STYLES}>Date of Discharge</label>
              <input
                type="date"
                disabled={readOnly}
                value={formData.discharge_date}
                onChange={(e) => handleChange('discharge_date', e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-1 focus:ring-red-500"
              />
            </div>
            <div>
              <label className={LABEL_STYLES}>Primary Consultant</label>
              <input
                type="text"
                disabled={readOnly}
                value={formData.primary_consultant}
                onChange={(e) => handleChange('primary_consultant', e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-1 focus:ring-red-500 font-medium"
              />
            </div>
            <div>
              <label className={LABEL_STYLES}>Contact details: Phone</label>
              <input
                type="text"
                disabled={readOnly}
                value={formData.phone}
                onChange={(e) => handleChange('phone', e.target.value)}
                placeholder="e.g. +91 98765 43210"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-1 focus:ring-red-500"
              />
            </div>
            <div>
              <label className={LABEL_STYLES}>Contact details: E-mail</label>
              <input
                type="email"
                disabled={readOnly}
                value={formData.email}
                onChange={(e) => handleChange('email', e.target.value)}
                placeholder="e.g. patient@example.com"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-1 focus:ring-red-500"
              />
            </div>
          </div>
        </SectionCard>
      </div>

      {/* ========================================================================= */}
      {/* SECTION 2: Clinical Information                                          */}
      {/* ========================================================================= */}
      <div id="section-2" className="space-y-6">
        <SectionCard title="2. Clinical Information - Background History" subtitle="Options: Yes / No / Unknown">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {renderRadio('hypertension', 'Hypertension')}
            {renderRadio('diabetes', 'Diabetes')}
            {renderRadio('smoking', 'Smoking')}
            {renderRadio('renal_failure', 'Renal Failure')}
            {renderRadio('copd', 'COPD')}
            {renderRadio('cva', 'CVA')}
            {renderRadio('prior_acs', 'Prior ACS')}
            {renderRadio('prior_ptca', 'Prior PTCA')}
            {renderRadio('prior_cabg', 'Prior CABG')}
          </div>
          <div className="mt-4">
            <label className={LABEL_STYLES}>Any other</label>
            <input
              type="text"
              disabled={readOnly}
              value={formData.other_background}
              onChange={(e) => handleChange('other_background', e.target.value)}
              placeholder="e.g. Dyslipidemia, Peripheral vascular disease"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-1 focus:ring-red-500"
            />
          </div>
        </SectionCard>

        <SectionCard title="2. Clinical Information - Presentation & Vitals" subtitle="Presentation (Yes / No) and Vitals (Numeric)">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
            {renderRadio('typical_angina', 'Typical angina', ['Yes', 'No'])}
            {renderRadio('atypical_chest_pain', 'Atypical chest pain', ['Yes', 'No'])}
            {renderRadio('breathlessness', 'Breathlessness', ['Yes', 'No'])}
            {renderRadio('syncope_presyncope', 'Syncope/ Pre-syncope', ['Yes', 'No'])}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-3 border-t border-slate-100">
            <div>
              <label className={LABEL_STYLES}>Pulse rate</label>
              <input
                type="number"
                disabled={readOnly}
                value={formData.pulse_rate}
                onChange={(e) => handleChange('pulse_rate', e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-1 focus:ring-red-500 font-bold"
              />
            </div>
            <div>
              <label className={LABEL_STYLES}>SBP</label>
              <input
                type="number"
                disabled={readOnly}
                value={formData.systolic_bp}
                onChange={(e) => handleChange('systolic_bp', e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-1 focus:ring-red-500 font-bold"
              />
            </div>
            <div>
              <label className={LABEL_STYLES}>DBP</label>
              <input
                type="number"
                disabled={readOnly}
                value={formData.diastolic_bp}
                onChange={(e) => handleChange('diastolic_bp', e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-1 focus:ring-red-500 font-bold"
              />
            </div>
          </div>
        </SectionCard>
      </div>

      {/* ========================================================================= */}
      {/* SECTION 3: Risk Stratification - TIMI Risk score                         */}
      {/* ========================================================================= */}
      <div id="section-3">
        <SectionCard title="3. Risk Stratification - TIMI Risk score" subtitle="Checkboxes (Yes/No) that automatically calculate a Total Score field">
          <div className="mb-6 p-4 rounded-xl bg-slate-900 text-white flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm border border-slate-800">
            <div>
              <span className="text-[10px] uppercase tracking-wider text-slate-400 font-extrabold block">STEMI TIMI Risk Calculator</span>
              <div className="flex items-center gap-3 mt-1">
                <span className="text-3xl font-black text-red-500">{timiCalculatedScore} / 16</span>
                <span className={`px-2.5 py-1 rounded-md text-xs font-extrabold border ${timiRiskCategory.color}`}>
                  {timiRiskCategory.label}
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-1">{timiRiskCategory.mortality}</p>
            </div>
            <div className="text-xs text-slate-400 space-y-1 text-left md:text-right border-t md:border-t-0 pt-2 md:pt-0 border-slate-800">
              <div>Total Score: <strong className="text-white font-mono text-sm">{timiCalculatedScore} Points</strong></div>
              <div>Calculated automatically from points criteria below.</div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
            {renderRadio('age_gt_75', 'Age >75 years (3 Points)', ['Yes', 'No'])}
            {renderRadio('age_65_to_74', 'Age 65 to 74 years (2 Points)', ['Yes', 'No'])}
            {renderRadio('history_dm_htn_angina', 'H/o DM/ HTN/Angina (1 Point)', ['Yes', 'No'])}
            {renderRadio('sbp_lt_100', 'SBP < 100 mmHg (3 Points)', ['Yes', 'No'])}
            {renderRadio('heart_rate_gt_100', 'Heart Rate > 100/ min (2 Points)', ['Yes', 'No'])}
            {renderRadio('killip_class_ii_to_iv', 'Killip Class II to IV (2 Points)', ['Yes', 'No'])}
            {renderRadio('anterior_mi_or_lbbb', 'Ant MI/LBBBB (1 Point)', ['Yes', 'No'])}
            {renderRadio('weight_lt_67kg', 'Weight < 67 kg (1 Point)', ['Yes', 'No'])}
            {renderRadio('reperfusion_gt_4hrs', 'Time to reperfusion > 4 hrs (1 Point)', ['Yes', 'No'])}
          </div>
        </SectionCard>
      </div>

      {/* ========================================================================= */}
      {/* SECTION 4: Other Risk Factors                                             */}
      {/* ========================================================================= */}
      <div id="section-4">
        <SectionCard title="4. Other Risk Factors" subtitle="Options (Yes / No)">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
            {renderRadio('lvf', 'LVF', ['Yes', 'No'])}
            {renderRadio('vt_vf', 'VT/VF', ['Yes', 'No'])}
            {renderRadio('bbb_chb', 'BBB/CHB', ['Yes', 'No'])}
            {renderRadio('elevated_bnp', 'Elevated BNP', ['Yes', 'No'])}
            {renderRadio('elevated_crp', 'Elevated CRP', ['Yes', 'No'])}
          </div>
        </SectionCard>
      </div>

      {/* ========================================================================= */}
      {/* SECTION 5: Treatment Strategy                                            */}
      {/* ========================================================================= */}
      <div id="section-5">
        <SectionCard title="5. Treatment Strategy" subtitle="Options (Select one): PAMI, Thrombolysis, Conservative">
          <div className="flex flex-wrap gap-4 p-4 bg-slate-50 rounded-xl border border-slate-200">
            {['PAMI', 'Thrombolysis', 'Conservative'].map((strat) => (
              <label key={strat} className="flex items-center gap-2 cursor-pointer font-bold text-xs text-slate-800">
                <input
                  type="radio"
                  disabled={readOnly}
                  name="treatment_strategy"
                  checked={formData.treatment_strategy === strat}
                  onChange={() => handleChange('treatment_strategy', strat)}
                  className="text-red-600 focus:ring-red-500 w-4 h-4"
                />
                <span>{strat}</span>
              </label>
            ))}
          </div>
        </SectionCard>
      </div>

      {/* ========================================================================= */}
      {/* SECTION 6: PAMI details, if done                                         */}
      {/* ========================================================================= */}
      <div id="section-6">
        <SectionCard title="6. PAMI details, if done" subtitle="Door to Balloon Time, Vessels, Segment, Thrombosuction, Stents, Result & Major Complications">
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div>
                <label className={LABEL_STYLES}>Door to Balloon Time (min)</label>
                <input
                  type="number"
                  disabled={readOnly}
                  value={formData.door_to_balloon_time}
                  onChange={(e) => handleChange('door_to_balloon_time', e.target.value)}
                  placeholder="e.g. 60"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-1 focus:ring-red-500 font-bold"
                />
              </div>
              <div>
                <label className={LABEL_STYLES}>Segment (Text)</label>
                <input
                  type="text"
                  disabled={readOnly}
                  value={formData.vessel_segment}
                  onChange={(e) => handleChange('vessel_segment', e.target.value)}
                  placeholder="e.g. Proximal LAD"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-1 focus:ring-red-500"
                />
              </div>
              <div>
                <label className={LABEL_STYLES}>Thrombosuction (Done / Not done)</label>
                <select
                  disabled={readOnly}
                  value={formData.thrombosuction_done}
                  onChange={(e) => handleChange('thrombosuction_done', e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-1 focus:ring-red-500 bg-white"
                >
                  <option value="Done">Done</option>
                  <option value="Not done">Not done</option>
                </select>
              </div>
            </div>

            <div>
              <label className={LABEL_STYLES}>Vessel(s): LMCA, LAD, Diagonal, LCX, Ramus, OM, RCA, PDA</label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                {[
                  { key: 'vessel_lmca', label: 'LMCA' },
                  { key: 'vessel_lad', label: 'LAD' },
                  { key: 'vessel_diagonal', label: 'Diagonal' },
                  { key: 'vessel_lcx', label: 'LCX' },
                  { key: 'vessel_ramus', label: 'Ramus' },
                  { key: 'vessel_om', label: 'OM' },
                  { key: 'vessel_rca', label: 'RCA' },
                  { key: 'vessel_pda', label: 'PDA' }
                ].map(({ key, label }) => (
                  <label key={key} className="flex items-center gap-2 p-2 bg-slate-50 border border-slate-200 rounded-lg cursor-pointer text-xs font-semibold">
                    <input
                      type="checkbox"
                      disabled={readOnly}
                      checked={formData[key] || false}
                      onChange={(e) => handleChange(key, e.target.checked)}
                      className="text-red-600 rounded"
                    />
                    <span>{label}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
              <div>
                <label className={LABEL_STYLES}>Stent(s) (BMS / DES)</label>
                <select
                  disabled={readOnly}
                  value={formData.stent_type}
                  onChange={(e) => handleChange('stent_type', e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-1 focus:ring-red-500 bg-white font-bold"
                >
                  <option value="DES">DES</option>
                  <option value="BMS">BMS</option>
                </select>
              </div>
              <div>
                <label className={LABEL_STYLES}>Dimensions: Diameter</label>
                <input
                  type="number"
                  step="0.1"
                  disabled={readOnly}
                  value={formData.stent_diameter}
                  onChange={(e) => handleChange('stent_diameter', e.target.value)}
                  placeholder="e.g. 3.0"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-1 focus:ring-red-500"
                />
              </div>
              <div>
                <label className={LABEL_STYLES}>Dimensions: Length</label>
                <input
                  type="number"
                  step="0.5"
                  disabled={readOnly}
                  value={formData.stent_length}
                  onChange={(e) => handleChange('stent_length', e.target.value)}
                  placeholder="e.g. 24.0"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-1 focus:ring-red-500"
                />
              </div>
              <div>
                <label className={LABEL_STYLES}>Result: Post-procedure TIMI flow (0/1/2/3)</label>
                <select
                  disabled={readOnly}
                  value={formData.timi_flow}
                  onChange={(e) => handleChange('timi_flow', e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-1 focus:ring-red-500 bg-white font-bold"
                >
                  <option value={3}>3</option>
                  <option value={2}>2</option>
                  <option value={1}>1</option>
                  <option value={0}>0</option>
                </select>
              </div>
            </div>

            {renderRadio('procedural_success', 'Result: Procedural success (Yes/No)', ['Yes', 'No'])}

            <div>
              <label className={LABEL_STYLES}>Major Complications (Multi-select)</label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                {[
                  { key: 'complication_none', label: 'None' },
                  { key: 'complication_tamponade', label: 'Tamponade' },
                  { key: 'complication_major_bleed', label: 'Major bleed' },
                  { key: 'complication_stroke', label: 'Stroke' },
                  { key: 'complication_stent_thrombosis', label: 'Stent thrombosis' },
                  { key: 'complication_mi', label: 'MI' },
                  { key: 'complication_death', label: 'Death' },
                  { key: 'complication_emergency_cabg', label: 'Emergency CABG' }
                ].map(({ key, label }) => (
                  <label key={key} className="flex items-center gap-2 p-2 bg-slate-50 border border-slate-200 rounded-lg cursor-pointer text-xs font-semibold">
                    <input
                      type="checkbox"
                      disabled={readOnly}
                      checked={formData[key] || false}
                      onChange={(e) => {
                        if (key === 'complication_none' && e.target.checked) {
                          setFormData(prev => ({
                            ...prev,
                            complication_none: true,
                            complication_tamponade: false,
                            complication_major_bleed: false,
                            complication_stroke: false,
                            complication_stent_thrombosis: false,
                            complication_mi: false,
                            complication_death: false,
                            complication_emergency_cabg: false
                          }));
                        } else {
                          setFormData(prev => ({
                            ...prev,
                            [key]: e.target.checked,
                            complication_none: false
                          }));
                        }
                      }}
                      className="text-red-600 rounded"
                    />
                    <span>{label}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        </SectionCard>
      </div>

      {/* ========================================================================= */}
      {/* SECTION 7: Thrombolysis details                                          */}
      {/* ========================================================================= */}
      <div id="section-7">
        <SectionCard title="7. Thrombolysis details" subtitle="Door to Needle Time, Drug: STK, UK, Reteplase, Tenectaplase & Dose">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs mb-4">
            <div>
              <label className={LABEL_STYLES}>Door to Needle Time (min)</label>
              <input
                type="number"
                disabled={readOnly}
                value={formData.door_to_needle_time}
                onChange={(e) => handleChange('door_to_needle_time', e.target.value)}
                placeholder="e.g. 30"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-1 focus:ring-red-500 font-bold"
              />
            </div>
            <div>
              <label className={LABEL_STYLES}>Dose (Text)</label>
              <input
                type="text"
                disabled={readOnly}
                value={formData.thrombolysis_dose}
                onChange={(e) => handleChange('thrombolysis_dose', e.target.value)}
                placeholder="e.g. 40 mg IV bolus"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-1 focus:ring-red-500"
              />
            </div>
          </div>

          <div>
            <label className={LABEL_STYLES}>Drug: STK, UK, Reteplase, Tenectaplase</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
              {[
                { key: 'drug_stk', label: 'STK' },
                { key: 'drug_uk', label: 'UK' },
                { key: 'drug_reteplase', label: 'Reteplase' },
                { key: 'drug_tenecteplase', label: 'Tenectaplase' }
              ].map(({ key, label }) => (
                <label key={key} className="flex items-center gap-2 p-2 bg-slate-50 border border-slate-200 rounded-lg cursor-pointer text-xs font-semibold">
                  <input
                    type="checkbox"
                    disabled={readOnly}
                    checked={formData[key] || false}
                    onChange={(e) => handleChange(key, e.target.checked)}
                    className="text-red-600 rounded"
                  />
                  <span>{label}</span>
                </label>
              ))}
            </div>
          </div>
        </SectionCard>
      </div>

      {/* ========================================================================= */}
      {/* SECTION 8: Drugs                                                          */}
      {/* ========================================================================= */}
      <div id="section-8" className="space-y-6">
        <SectionCard title="8. Drugs - Acute Drugs (Yes/No)" subtitle="Beta-blocker, Calcium-channel blocker, Nitrate, Nicorandil, Ivabradine, Ranozolidine, Trimetazidine, Aspirin, Clopidigrel, Prasugrel, Ticagralor">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
            {renderRadio('beta_blocker', 'Beta-blocker', ['Yes', 'No'])}
            {renderRadio('calcium_channel_blocker', 'Calcium-channel blocker', ['Yes', 'No'])}
            {renderRadio('nitrate', 'Nitrate', ['Yes', 'No'])}
            {renderRadio('nicorandil', 'Nicorandil', ['Yes', 'No'])}
            {renderRadio('ivabradine', 'Ivabradine', ['Yes', 'No'])}
            {renderRadio('ranolazine', 'Ranozolidine', ['Yes', 'No'])}
            {renderRadio('trimetazidine', 'Trimetazidine', ['Yes', 'No'])}
            {renderRadio('aspirin', 'Aspirin', ['Yes', 'No'])}
            {renderRadio('clopidogrel', 'Clopidigrel', ['Yes', 'No'])}
            {renderRadio('prasugrel', 'Prasugrel', ['Yes', 'No'])}
            {renderRadio('ticagrelor', 'Ticagralor', ['Yes', 'No'])}
          </div>
        </SectionCard>

        <SectionCard title="8. Drugs - Heparin Strategy & Other Drugs" subtitle="Heparin strategy (Select one), Other Drugs (Yes/No), Statin Dose, Any Other (Text)">
          <div className="space-y-4">
            <div>
              <label className={LABEL_STYLES}>Heparin strategy (Select one): UFH i.v alone, UFH s.c alone, LMWH alone, UFH i.v+UFHs.c, UFH i.v + LMWH</label>
              <select
                disabled={readOnly}
                value={formData.heparin_strategy}
                onChange={(e) => handleChange('heparin_strategy', e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-1 focus:ring-red-500 bg-white font-semibold"
              >
                <option value="UFH i.v alone">UFH i.v alone</option>
                <option value="UFH s.c alone">UFH s.c alone</option>
                <option value="LMWH alone">LMWH alone</option>
                <option value="UFH i.v+UFHs.c">UFH i.v+UFHs.c</option>
                <option value="UFH i.v + LMWH">UFH i.v + LMWH</option>
              </select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
              {renderRadio('gp2b3a', 'Gp2b3a', ['Yes', 'No'])}
              {renderRadio('bivaluridin', 'Bivaluridin', ['Yes', 'No'])}
              {renderRadio('statin', 'Statin', ['Yes', 'No'])}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div>
                <label className={LABEL_STYLES}>Statin Dose: 10 mg, 20 mg, 40 mg, 80 mg</label>
                <select
                  disabled={readOnly}
                  value={formData.statin_dose}
                  onChange={(e) => handleChange('statin_dose', e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-1 focus:ring-red-500 bg-white font-bold"
                >
                  <option value="10 mg">10 mg</option>
                  <option value="20 mg">20 mg</option>
                  <option value="40 mg">40 mg</option>
                  <option value="80 mg">80 mg</option>
                </select>
              </div>
              <div>
                <label className={LABEL_STYLES}>Any Other (Text)</label>
                <input
                  type="text"
                  disabled={readOnly}
                  value={formData.other_drugs}
                  onChange={(e) => handleChange('other_drugs', e.target.value)}
                  placeholder="e.g. Fondaparinux, ARNI, Digoxin"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-1 focus:ring-red-500"
                />
              </div>
            </div>
          </div>
        </SectionCard>
      </div>

      {/* ========================================================================= */}
      {/* SECTION 9: Diagnostic Procedures                                         */}
      {/* ========================================================================= */}
      <div id="section-9">
        <SectionCard title="9. Diagnostic Procedures" subtitle="Options (Yes/No): Bed-side echo, Departmental echo, Stress Testing, Lipid profile, BNP, CRP, Trop-T/I, CPK/CPK-MB, RFT, LFT, Electrolytes, Hemogram, CXR, Others">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
            {renderRadio('bedside_echo', 'Bed-side echo', ['Yes', 'No'])}
            {renderRadio('departmental_echo', 'Departmental echo', ['Yes', 'No'])}
            {renderRadio('stress_testing', 'Stress Testing', ['Yes', 'No'])}
            {renderRadio('lipid_profile', 'Lipid profile', ['Yes', 'No'])}
            {renderRadio('bnp', 'BNP', ['Yes', 'No'])}
            {renderRadio('crp', 'CRP', ['Yes', 'No'])}
            {renderRadio('troponin_test', 'Trop-T/I', ['Yes', 'No'])}
            {renderRadio('cpk_ckmb', 'CPK/CPK-MB', ['Yes', 'No'])}
            {renderRadio('rft', 'RFT', ['Yes', 'No'])}
            {renderRadio('lft', 'LFT', ['Yes', 'No'])}
            {renderRadio('electrolytes', 'Electrolytes', ['Yes', 'No'])}
            {renderRadio('hemogram', 'Hemogram', ['Yes', 'No'])}
            {renderRadio('cxr', 'CXR', ['Yes', 'No'])}
          </div>
          <div className="mt-4">
            <label className={LABEL_STYLES}>Others</label>
            <input
              type="text"
              disabled={readOnly}
              value={formData.diagnostic_other}
              onChange={(e) => handleChange('diagnostic_other', e.target.value)}
              placeholder="e.g. Holter monitoring, CT Coronary Angiogram"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-1 focus:ring-red-500"
            />
          </div>
        </SectionCard>
      </div>

      {/* ========================================================================= */}
      {/* SECTION 10: Reports (ECG, Echo, Blood Investigations, Angiogram)         */}
      {/* ========================================================================= */}
      <div id="section-10" className="space-y-6">
        <SectionCard title="10. Reports - ECG" subtitle="HR (bpm), AV Block, BBB, Q waves, ST dep, T inv, Rhythm, Any other">
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div>
                <label className={LABEL_STYLES}>HR (bpm)</label>
                <input
                  type="number"
                  disabled={readOnly}
                  value={formData.ecg_heart_rate}
                  onChange={(e) => handleChange('ecg_heart_rate', e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-1 focus:ring-red-500 font-bold"
                />
              </div>
              <div>
                <label className={LABEL_STYLES}>AV Block (None / 1-degree / 2-degree / CHB)</label>
                <select
                  disabled={readOnly}
                  value={formData.av_block}
                  onChange={(e) => handleChange('av_block', e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-1 focus:ring-red-500 bg-white"
                >
                  <option value="None">None</option>
                  <option value="1-degree">1-degree</option>
                  <option value="2-degree">2-degree</option>
                  <option value="CHB">CHB</option>
                </select>
              </div>
              <div>
                <label className={LABEL_STYLES}>BBB (RBBB / LBBB / Inderminate / None)</label>
                <select
                  disabled={readOnly}
                  value={formData.bbb}
                  onChange={(e) => handleChange('bbb', e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-1 focus:ring-red-500 bg-white"
                >
                  <option value="None">None</option>
                  <option value="RBBB">RBBB</option>
                  <option value="LBBB">LBBB</option>
                  <option value="Indeterminate">Inderminate</option>
                </select>
              </div>
            </div>

            <div>
              <label className={LABEL_STYLES}>Q waves (None / Inferior / Antero-septal / Anterior / Anterolateral / Lateral)</label>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 pt-1">
                {[
                  { key: 'qwaves_none', label: 'None' },
                  { key: 'qwaves_inferior', label: 'Inferior' },
                  { key: 'qwaves_anteroseptal', label: 'Antero-septal' },
                  { key: 'qwaves_anterior', label: 'Anterior' },
                  { key: 'qwaves_anterolateral', label: 'Anterolateral' },
                  { key: 'qwaves_lateral', label: 'Lateral' }
                ].map(({ key, label }) => (
                  <label key={key} className="flex items-center gap-2 p-2 bg-slate-50 border border-slate-200 rounded-lg cursor-pointer text-xs font-semibold">
                    <input
                      type="checkbox"
                      disabled={readOnly}
                      checked={formData[key] || false}
                      onChange={(e) => handleChange(key, e.target.checked)}
                      className="text-red-600 rounded"
                    />
                    <span>{label}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className={LABEL_STYLES}>ST dep (None / Inferior / Antero-septal / Anterior / Anterolateral / Lateral)</label>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 pt-1">
                {[
                  { key: 'st_depression_none', label: 'None' },
                  { key: 'st_depression_inferior', label: 'Inferior' },
                  { key: 'st_depression_anteroseptal', label: 'Antero-septal' },
                  { key: 'st_depression_anterior', label: 'Anterior' },
                  { key: 'st_depression_anterolateral', label: 'Anterolateral' },
                  { key: 'st_depression_lateral', label: 'Lateral' }
                ].map(({ key, label }) => (
                  <label key={key} className="flex items-center gap-2 p-2 bg-slate-50 border border-slate-200 rounded-lg cursor-pointer text-xs font-semibold">
                    <input
                      type="checkbox"
                      disabled={readOnly}
                      checked={formData[key] || false}
                      onChange={(e) => handleChange(key, e.target.checked)}
                      className="text-red-600 rounded"
                    />
                    <span>{label}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className={LABEL_STYLES}>T inv (None / Inferior / Antero-septal / Anterior / Anterolateral / Lateral)</label>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 pt-1">
                {[
                  { key: 't_inversion_none', label: 'None' },
                  { key: 't_inversion_inferior', label: 'Inferior' },
                  { key: 't_inversion_anteroseptal', label: 'Antero-septal' },
                  { key: 't_inversion_anterior', label: 'Anterior' },
                  { key: 't_inversion_anterolateral', label: 'Anterolateral' },
                  { key: 't_inversion_lateral', label: 'Lateral' }
                ].map(({ key, label }) => (
                  <label key={key} className="flex items-center gap-2 p-2 bg-slate-50 border border-slate-200 rounded-lg cursor-pointer text-xs font-semibold">
                    <input
                      type="checkbox"
                      disabled={readOnly}
                      checked={formData[key] || false}
                      onChange={(e) => handleChange(key, e.target.checked)}
                      className="text-red-600 rounded"
                    />
                    <span>{label}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div>
                <label className={LABEL_STYLES}>Rhythm (NSR / AF / SVT / VT / VF)</label>
                <select
                  disabled={readOnly}
                  value={formData.rhythm}
                  onChange={(e) => handleChange('rhythm', e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-1 focus:ring-red-500 bg-white font-bold"
                >
                  <option value="NSR">NSR</option>
                  <option value="AF">AF</option>
                  <option value="SVT">SVT</option>
                  <option value="VT">VT</option>
                  <option value="VF">VF</option>
                </select>
              </div>
              <div>
                <label className={LABEL_STYLES}>Any other</label>
                <input
                  type="text"
                  disabled={readOnly}
                  value={formData.ecg_other}
                  onChange={(e) => handleChange('ecg_other', e.target.value)}
                  placeholder="e.g. S1Q3T3 pattern, PR depression"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-1 focus:ring-red-500"
                />
              </div>
            </div>
          </div>
        </SectionCard>

        <SectionCard title="10. Reports - Echo" subtitle="EF (%), LV Function (Normal / Mild LVD / Mod. LVD / Sev.LVD), RWMA (LAD / RCA / LCX territory), MR (None / Mild / Mod / Severe), E, A, DT, E', TAPSV, Others">
          <div className="space-y-4 text-xs">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className={LABEL_STYLES}>EF (%)</label>
                <input
                  type="number"
                  disabled={readOnly}
                  value={formData.echo_ef}
                  onChange={(e) => handleChange('echo_ef', e.target.value)}
                  placeholder="e.g. 50"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-1 focus:ring-red-500 font-bold"
                />
              </div>
              <div>
                <label className={LABEL_STYLES}>LV Function (Normal / Mild LVD / Mod. LVD / Sev.LVD)</label>
                <select
                  disabled={readOnly}
                  value={formData.lv_function}
                  onChange={(e) => handleChange('lv_function', e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-1 focus:ring-red-500 bg-white font-semibold"
                >
                  <option value="Normal">Normal</option>
                  <option value="Mild LVD">Mild LVD</option>
                  <option value="Mod. LVD">Mod. LVD</option>
                  <option value="Sev.LVD">Sev.LVD</option>
                </select>
              </div>
              <div>
                <label className={LABEL_STYLES}>MR (None / Mild / Mod / Severe)</label>
                <select
                  disabled={readOnly}
                  value={formData.mr_grade}
                  onChange={(e) => handleChange('mr_grade', e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-1 focus:ring-red-500 bg-white font-semibold"
                >
                  <option value="None">None</option>
                  <option value="Mild">Mild</option>
                  <option value="Mod">Mod</option>
                  <option value="Severe">Severe</option>
                </select>
              </div>
            </div>

            <div>
              <label className={LABEL_STYLES}>RWMA (LAD / RCA / LCX territory)</label>
              <div className="grid grid-cols-3 gap-2 pt-1 max-w-md">
                {[
                  { key: 'rwma_lad', label: 'LAD territory' },
                  { key: 'rwma_rca', label: 'RCA territory' },
                  { key: 'rwma_lcx', label: 'LCX territory' }
                ].map(({ key, label }) => (
                  <label key={key} className="flex items-center gap-2 p-2 bg-slate-50 border border-slate-200 rounded-lg cursor-pointer text-xs font-semibold">
                    <input
                      type="checkbox"
                      disabled={readOnly}
                      checked={formData[key] || false}
                      onChange={(e) => handleChange(key, e.target.checked)}
                      className="text-red-600 rounded"
                    />
                    <span>{label}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-2">
              <div>
                <label className={LABEL_STYLES}>E</label>
                <input
                  type="number"
                  step="0.1"
                  disabled={readOnly}
                  value={formData.echo_e}
                  onChange={(e) => handleChange('echo_e', e.target.value)}
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs"
                />
              </div>
              <div>
                <label className={LABEL_STYLES}>A</label>
                <input
                  type="number"
                  step="0.1"
                  disabled={readOnly}
                  value={formData.echo_a}
                  onChange={(e) => handleChange('echo_a', e.target.value)}
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs"
                />
              </div>
              <div>
                <label className={LABEL_STYLES}>DT</label>
                <input
                  type="number"
                  step="1"
                  disabled={readOnly}
                  value={formData.echo_dt}
                  onChange={(e) => handleChange('echo_dt', e.target.value)}
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs"
                />
              </div>
              <div>
                <label className={LABEL_STYLES}>E'</label>
                <input
                  type="number"
                  step="0.1"
                  disabled={readOnly}
                  value={formData.echo_e_prime}
                  onChange={(e) => handleChange('echo_e_prime', e.target.value)}
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs"
                />
              </div>
              <div>
                <label className={LABEL_STYLES}>TAPSV</label>
                <input
                  type="number"
                  step="0.1"
                  disabled={readOnly}
                  value={formData.echo_tapsv}
                  onChange={(e) => handleChange('echo_tapsv', e.target.value)}
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs"
                />
              </div>
            </div>

            <div>
              <label className={LABEL_STYLES}>Others</label>
              <input
                type="text"
                disabled={readOnly}
                value={formData.echo_other}
                onChange={(e) => handleChange('echo_other', e.target.value)}
                placeholder="e.g. Mild TR, PASP 35 mmHg"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-1 focus:ring-red-500"
              />
            </div>
          </div>
        </SectionCard>

        <SectionCard title="10. Reports - Blood Investigations (Numeric fields)" subtitle="Hemoglobin (gm%), Creat (mg/dl), Trop-I, CPK, CK-MB, Na, K, RBS at admission">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
            <div>
              <label className={LABEL_STYLES}>Hemoglobin (gm%)</label>
              <input
                type="number"
                step="0.1"
                disabled={readOnly}
                value={formData.hemoglobin}
                onChange={(e) => handleChange('hemoglobin', e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-bold"
              />
            </div>
            <div>
              <label className={LABEL_STYLES}>Creat (mg/dl)</label>
              <input
                type="number"
                step="0.01"
                disabled={readOnly}
                value={formData.creatinine}
                onChange={(e) => handleChange('creatinine', e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-bold"
              />
            </div>
            <div>
              <label className={LABEL_STYLES}>Trop-I</label>
              <input
                type="text"
                disabled={readOnly}
                value={formData.troponin_i}
                onChange={(e) => handleChange('troponin_i', e.target.value)}
                placeholder="e.g. Positive / 2.5 ng/ml"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
              />
            </div>
            <div>
              <label className={LABEL_STYLES}>CPK</label>
              <input
                type="text"
                disabled={readOnly}
                value={formData.cpk}
                onChange={(e) => handleChange('cpk', e.target.value)}
                placeholder="e.g. 450 IU/L"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
              />
            </div>
            <div>
              <label className={LABEL_STYLES}>CK-MB</label>
              <input
                type="text"
                disabled={readOnly}
                value={formData.ck_mb}
                onChange={(e) => handleChange('ck_mb', e.target.value)}
                placeholder="e.g. 45 ng/ml"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
              />
            </div>
            <div>
              <label className={LABEL_STYLES}>Na</label>
              <input
                type="number"
                disabled={readOnly}
                value={formData.sodium}
                onChange={(e) => handleChange('sodium', e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
              />
            </div>
            <div>
              <label className={LABEL_STYLES}>K</label>
              <input
                type="number"
                step="0.1"
                disabled={readOnly}
                value={formData.potassium}
                onChange={(e) => handleChange('potassium', e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
              />
            </div>
            <div>
              <label className={LABEL_STYLES}>RBS at admission</label>
              <input
                type="number"
                disabled={readOnly}
                value={formData.rbs_admission}
                onChange={(e) => handleChange('rbs_admission', e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
              />
            </div>
          </div>
        </SectionCard>

        <SectionCard title="10. Reports - Coronary Angiogram" subtitle="Done / Not done. If done: Normal / 1-VD / 2-VD / 3-VD / LMCA">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            {renderRadio('angiogram_done', 'Coronary Angiogram (Done / Not done)', ['Yes', 'No'])}
            {formData.angiogram_done === 'Yes' && (
              <div>
                <label className={LABEL_STYLES}>If done: Normal / 1-VD / 2-VD / 3-VD / LMCA</label>
                <select
                  disabled={readOnly}
                  value={formData.angiogram_finding}
                  onChange={(e) => handleChange('angiogram_finding', e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-1 focus:ring-red-500 bg-white font-bold"
                >
                  <option value="Normal">Normal</option>
                  <option value="1VD">1-VD</option>
                  <option value="2VD">2-VD</option>
                  <option value="3VD">3-VD</option>
                  <option value="LMCA">LMCA</option>
                </select>
              </div>
            )}
          </div>
        </SectionCard>
      </div>

      {/* ========================================================================= */}
      {/* SECTION 11: Invasive Procedures                                          */}
      {/* ========================================================================= */}
      <div id="section-11">
        <SectionCard title="11. Invasive Procedures" subtitle="Options (Yes / No): IABP, CAG, Invasive Ventilation, PTCA, CABG, Other">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
            {renderRadio('iabp', 'IABP', ['Yes', 'No'])}
            {renderRadio('cag', 'CAG', ['Yes', 'No'])}
            {renderRadio('invasive_ventilation', 'Invasive Ventilation', ['Yes', 'No'])}
            {renderRadio('ptca', 'PTCA', ['Yes', 'No'])}
            {renderRadio('cabg', 'CABG', ['Yes', 'No'])}
          </div>
          <div className="mt-4">
            <label className={LABEL_STYLES}>Other</label>
            <input
              type="text"
              disabled={readOnly}
              value={formData.other_procedure}
              onChange={(e) => handleChange('other_procedure', e.target.value)}
              placeholder="e.g. Pericardiocentesis, TPI"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-1 focus:ring-red-500"
            />
          </div>
        </SectionCard>
      </div>

      {/* ========================================================================= */}
      {/* SECTION 12: Out-comes                                                   */}
      {/* ========================================================================= */}
      <div id="section-12">
        <SectionCard title="12. Out-comes" subtitle="Clinical (Yes / No): Death, STEMI for NONSTEMI subjects, Re-MI for STEMI subjects, Revascularization for recurrent ischemia, CVA-thrombotic, CVA-hemorrhagic, Major Bleeding, Any other">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
            {renderRadio('death', 'Death', ['Yes', 'No'])}
            {renderRadio('stemi_for_nonstemi', 'STEMI for NONSTEMI subjects', ['Yes', 'No'])}
            {renderRadio('remi_for_stemi', 'Re-MI for STEMI subjects', ['Yes', 'No'])}
            {renderRadio('revascularization_recurrent_ischemia', 'Revascularization for recurrent ischemia', ['Yes', 'No'])}
            {renderRadio('cva_thrombotic', 'CVA-thrombotic', ['Yes', 'No'])}
            {renderRadio('cva_hemorrhagic', 'CVA-hemorrhagic', ['Yes', 'No'])}
            {renderRadio('major_bleeding', 'Major Bleeding', ['Yes', 'No'])}
          </div>
          <div className="mt-4">
            <label className={LABEL_STYLES}>Any other</label>
            <input
              type="text"
              disabled={readOnly}
              value={formData.outcome_other}
              onChange={(e) => handleChange('outcome_other', e.target.value)}
              placeholder="e.g. Cardiogenic shock resolved, Heart failure hospitalization"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-1 focus:ring-red-500"
            />
          </div>
        </SectionCard>
      </div>

      {/* ========================================================================= */}
      {/* SECTION 13: Discharge Medications                                         */}
      {/* ========================================================================= */}
      <div id="section-13">
        <SectionCard title="13. Discharge Medications" subtitle="Options (Yes / No): Beta-blocker, Calcium-channel blocker, Nitrate, Nicorandil, Ivabradine, Ranozolidine, Trimetazidine, Aspirin, Clopidigrel, Prasugrel, Ticagralor, Statin, Statin Dose & Any Other">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 text-xs mb-4">
            {renderRadio('discharge_beta_blocker', 'Beta-blocker', ['Yes', 'No'])}
            {renderRadio('discharge_calcium_channel_blocker', 'Calcium-channel blocker', ['Yes', 'No'])}
            {renderRadio('discharge_nitrate', 'Nitrate', ['Yes', 'No'])}
            {renderRadio('discharge_nicorandil', 'Nicorandil', ['Yes', 'No'])}
            {renderRadio('discharge_ivabradine', 'Ivabradine', ['Yes', 'No'])}
            {renderRadio('discharge_ranolazine', 'Ranozolidine', ['Yes', 'No'])}
            {renderRadio('discharge_trimetazidine', 'Trimetazidine', ['Yes', 'No'])}
            {renderRadio('discharge_aspirin', 'Aspirin', ['Yes', 'No'])}
            {renderRadio('discharge_clopidogrel', 'Clopidigrel', ['Yes', 'No'])}
            {renderRadio('discharge_prasugrel', 'Prasugrel', ['Yes', 'No'])}
            {renderRadio('discharge_ticagrelor', 'Ticagralor', ['Yes', 'No'])}
            {renderRadio('discharge_statin', 'Statin', ['Yes', 'No'])}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div>
              <label className={LABEL_STYLES}>Statin Dose: 10 mg, 20 mg, 40 mg, 80 mg</label>
              <select
                disabled={readOnly}
                value={formData.discharge_statin_dose}
                onChange={(e) => handleChange('discharge_statin_dose', e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-1 focus:ring-red-500 bg-white font-bold"
              >
                <option value="10 mg">10 mg</option>
                <option value="20 mg">20 mg</option>
                <option value="40 mg">40 mg</option>
                <option value="80 mg">80 mg</option>
              </select>
            </div>
            <div>
              <label className={LABEL_STYLES}>Any Other (Text)</label>
              <input
                type="text"
                disabled={readOnly}
                value={formData.discharge_other_medication}
                onChange={(e) => handleChange('discharge_other_medication', e.target.value)}
                placeholder="e.g. Ramipril 2.5 mg, Spironolactone 25 mg"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-1 focus:ring-red-500"
              />
            </div>
          </div>
        </SectionCard>
      </div>

      {/* ========================================================================= */}
      {/* SECTION 14: Appropriateness for various procedures                       */}
      {/* ========================================================================= */}
      <div id="section-14">
        <SectionCard title="14. Appropriateness for various procedures" subtitle="Options (Appropriate / Inappropriate): Indication for ICCU admission, ICCU transfer-out, Indication for TLT, Indication for PTCA, Indication for Invasive monitoring, Indication for IABP, Indication for Invasive Ventilation, Indication for dialysis, Any other procedure">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
            {proceduresList.map(item => renderAppropriatenessRadio(item.key, item.label))}
          </div>
          {formData.appr_other_procedure_appropriateness === 'Appropriate' && (
            <div className="mt-3">
              <label className={LABEL_STYLES}>Specify Any other procedure</label>
              <input
                type="text"
                disabled={readOnly}
                value={formData.appr_other_procedure_name}
                onChange={(e) => handleChange('appr_other_procedure_name', e.target.value)}
                placeholder="e.g. Pericardiocentesis"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
              />
            </div>
          )}
        </SectionCard>
      </div>

      {/* ========================================================================= */}
      {/* SECTION 15: Appropriateness for various investigations                   */}
      {/* ========================================================================= */}
      <div id="section-15">
        <SectionCard title="15. Appropriateness for various investigations" subtitle="Options (Appropriate / Inappropriate): Cardiac enzymes, BNP, CRP, Lipid Profile, Bed-side Echo, CXR">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
            {investigationsList.map(item => renderAppropriatenessRadio(item.key, item.label))}
          </div>
        </SectionCard>
      </div>

      {/* ========================================================================= */}
      {/* SECTION 16: Appropriateness for various drugs                            */}
      {/* ========================================================================= */}
      <div id="section-16">
        <SectionCard title="16. Appropriateness for various drugs" subtitle="Options (Appropriate / Inappropriate): Beta-blockers, Aspirin, Clopidigrel, ACE-inhibitor, ARB, Statin, Diuretic, Lanoxin, Anticoagulant, Amiodarone, Any other">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
            {drugsList.map(item => renderAppropriatenessRadio(item.key, item.label))}
          </div>
          {formData.appr_other_drug_appropriateness === 'Appropriate' && (
            <div className="mt-3">
              <label className={LABEL_STYLES}>Specify Any other drug</label>
              <input
                type="text"
                disabled={readOnly}
                value={formData.appr_other_drug_name}
                onChange={(e) => handleChange('appr_other_drug_name', e.target.value)}
                placeholder="e.g. ARNI / Sacubitril Valsartan"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
              />
            </div>
          )}
        </SectionCard>
      </div>

      {/* ========================================================================= */}
      {/* SECTION 17: Length of Stay                                                */}
      {/* ========================================================================= */}
      <div id="section-17">
        <SectionCard title="17. Length of Stay" subtitle="Numeric Fields: ICCU (hours), Step-down ICU (hours), Floors (days), Total Hospital stay (days)">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
            <div>
              <label className={LABEL_STYLES}>ICCU (hours)</label>
              <input
                type="number"
                disabled={readOnly}
                value={formData.iccu_hours}
                onChange={(e) => handleChange('iccu_hours', e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-bold"
              />
            </div>
            <div>
              <label className={LABEL_STYLES}>Step-down ICU (hours)</label>
              <input
                type="number"
                disabled={readOnly}
                value={formData.stepdown_icu_hours}
                onChange={(e) => handleChange('stepdown_icu_hours', e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-bold"
              />
            </div>
            <div>
              <label className={LABEL_STYLES}>Floors (days)</label>
              <input
                type="number"
                disabled={readOnly}
                value={formData.floor_days}
                onChange={(e) => handleChange('floor_days', e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-bold"
              />
            </div>
            <div>
              <label className={LABEL_STYLES}>Total Hospital stay (days)</label>
              <input
                type="number"
                disabled={readOnly}
                value={formData.total_hospital_stay_days}
                onChange={(e) => handleChange('total_hospital_stay_days', e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-bold text-red-700 bg-red-50/30"
              />
            </div>
          </div>
        </SectionCard>
      </div>

      {/* ========================================================================= */}
      {/* SECTION 18: Cost of care                                                  */}
      {/* ========================================================================= */}
      <div id="section-18">
        <SectionCard title="18. Cost of care" subtitle="Numeric Fields: Bed charges, Drugs & Disposables, Packages, Lab Investigations, Non-invasive labs, Consults, Radiology, Miscellaneous, Total">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
            <div>
              <label className={LABEL_STYLES}>Bed charges (₹)</label>
              <input
                type="number"
                disabled={readOnly}
                value={formData.bed_charges}
                onChange={(e) => handleChange('bed_charges', e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
              />
            </div>
            <div>
              <label className={LABEL_STYLES}>Drugs & Disposables (₹)</label>
              <input
                type="number"
                disabled={readOnly}
                value={formData.drugs_disposables_cost}
                onChange={(e) => handleChange('drugs_disposables_cost', e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
              />
            </div>
            <div>
              <label className={LABEL_STYLES}>Packages (₹)</label>
              <input
                type="number"
                disabled={readOnly}
                value={formData.package_cost}
                onChange={(e) => handleChange('package_cost', e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
              />
            </div>
            <div>
              <label className={LABEL_STYLES}>Lab Investigations (₹)</label>
              <input
                type="number"
                disabled={readOnly}
                value={formData.laboratory_cost}
                onChange={(e) => handleChange('laboratory_cost', e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
              />
            </div>
            <div>
              <label className={LABEL_STYLES}>Non-invasive labs (₹)</label>
              <input
                type="number"
                disabled={readOnly}
                value={formData.non_invasive_lab_cost}
                onChange={(e) => handleChange('non_invasive_lab_cost', e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
              />
            </div>
            <div>
              <label className={LABEL_STYLES}>Consults (₹)</label>
              <input
                type="number"
                disabled={readOnly}
                value={formData.consultation_cost}
                onChange={(e) => handleChange('consultation_cost', e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
              />
            </div>
            <div>
              <label className={LABEL_STYLES}>Radiology (₹)</label>
              <input
                type="number"
                disabled={readOnly}
                value={formData.radiology_cost}
                onChange={(e) => handleChange('radiology_cost', e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
              />
            </div>
            <div>
              <label className={LABEL_STYLES}>Miscellaneous (₹)</label>
              <input
                type="number"
                disabled={readOnly}
                value={formData.miscellaneous_cost}
                onChange={(e) => handleChange('miscellaneous_cost', e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
              />
            </div>
            <div>
              <label className={LABEL_STYLES}>Total (₹)</label>
              <input
                type="number"
                disabled={readOnly}
                value={formData.total_cost !== '' ? formData.total_cost : (autoSumCost !== null ? autoSumCost : '')}
                onChange={(e) => handleChange('total_cost', e.target.value)}
                placeholder={autoSumCost !== null ? `Auto-sum: ₹${autoSumCost}` : '₹ Total'}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-black text-red-700 bg-red-50/40"
              />
            </div>
          </div>
        </SectionCard>
      </div>

      {/* ========================================================================= */}
      {/* SECTION 19: Follow-up Matrix Grid                                         */}
      {/* ========================================================================= */}
      {/* ========================================================================= */}
      {/* SECTION 19: Follow-up Matrix Grid & Instructions                         */}
      {/* ========================================================================= */}
      <div id="section-19">
        <SectionCard title="FOLLOW-UP MATRIX" subtitle="Long-term Follow-up Grid (PDF Page 8)">
          <div className="space-y-6 text-xs">
            <div className="overflow-x-auto border border-slate-200 rounded-xl bg-white shadow-2xs">
              <table className="w-full text-left text-xs border-collapse min-w-[750px]">
                <thead>
                  <tr className="bg-slate-50 text-slate-700 text-[11px] font-bold">
                    <th className="p-3 border border-slate-200 w-44">Parameter</th>
                    {[
                      { key: '1m', label: '1-Month', months: 1 },
                      { key: '3m', label: '3-Month', months: 3 },
                      { key: '6m', label: '6-Month', months: 6 },
                      { key: '12m', label: '12-Month', months: 12 }
                    ].map(({ key, label, months }) => {
                      const isEnabled = !!formData[`enabled_${key}`];
                      const baseDate = formData.discharge_date || formData.admission_date;
                      const defaultCalculatedDate = calculateExpectedDate(baseDate, months);
                      const currentDateVal = formData[`date_${key}`] || defaultCalculatedDate;

                      return (
                        <th
                          key={key}
                          className={`p-2.5 border border-slate-200 text-center transition-all ${
                            isEnabled ? 'bg-red-50/60 border-red-200' : 'bg-slate-100/70 text-slate-400'
                          }`}
                        >
                          <div className="flex flex-col items-center gap-1.5">
                            <label className="flex items-center gap-1.5 cursor-pointer select-none">
                              <input
                                type="checkbox"
                                disabled={readOnly}
                                checked={isEnabled}
                                onChange={(e) => {
                                  const checked = e.target.checked;
                                  setFormData(prev => ({
                                    ...prev,
                                    [`enabled_${key}`]: checked,
                                    ...(!prev[`date_${key}`] ? { [`date_${key}`]: calculateExpectedDate(prev.discharge_date || prev.admission_date, months) } : {})
                                  }));
                                }}
                                className="w-4 h-4 text-red-600 rounded border-slate-300 focus:ring-red-500 cursor-pointer"
                              />
                              <span className={`font-bold text-xs ${isEnabled ? 'text-slate-900' : 'text-slate-500'}`}>
                                {label}
                              </span>
                            </label>

                            {isEnabled ? (
                              <div className="w-full flex flex-col items-center gap-1 mt-0.5">
                                <input
                                  type="date"
                                  disabled={readOnly}
                                  value={currentDateVal || ''}
                                  onChange={(e) => {
                                    const newDate = e.target.value;
                                    setFormData(prev => ({
                                      ...prev,
                                      [`date_${key}`]: newDate,
                                      [`custom_date_${key}`]: true
                                    }));
                                  }}
                                  className="w-full max-w-[130px] p-1 text-[11px] font-mono border border-red-300 rounded bg-white text-slate-800 text-center focus:ring-1 focus:ring-red-500 focus:border-red-500"
                                />
                                {currentDateVal && (
                                  <span className="text-[10px] font-mono text-red-700 bg-red-100/70 border border-red-200 rounded px-1.5 py-0.5 whitespace-nowrap shadow-2xs">
                                    📅 {formatDisplayDate(currentDateVal)}
                                  </span>
                                )}
                              </div>
                            ) : (
                              <span className="text-[10px] font-medium text-slate-400 bg-slate-200/60 rounded px-2 py-0.5 mt-1 inline-block">
                                Not Scheduled
                              </span>
                            )}
                          </div>
                        </th>
                      );
                    })}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {/* Angina */}
                  <tr className="hover:bg-slate-50">
                    <td className="p-2.5 border border-slate-200 font-semibold">Angina</td>
                    {['1m', '3m', '6m', '12m'].map(t => (
                      <td
                        key={t}
                        className={`p-2 border border-slate-200 text-center transition-opacity ${
                          !formData[`enabled_${t}`] ? 'bg-slate-50/70 opacity-30 pointer-events-none' : 'bg-white'
                        }`}
                      >
                        <select
                          disabled={readOnly || !formData[`enabled_${t}`]}
                          value={formData[`angina_${t}`] || 'No'}
                          onChange={(e) => handleChange(`angina_${t}`, e.target.value)}
                          className="p-1 border border-slate-300 rounded w-20 text-center bg-white"
                        >
                          <option value="Yes">Yes</option>
                          <option value="No">No</option>
                        </select>
                      </td>
                    ))}
                  </tr>

                  {/* Func. Class */}
                  <tr className="hover:bg-slate-50">
                    <td className="p-2.5 border border-slate-200 font-semibold">Func. Class:</td>
                    {['1m', '3m', '6m', '12m'].map(t => (
                      <td
                        key={t}
                        className={`p-2 border border-slate-200 text-center transition-opacity ${
                          !formData[`enabled_${t}`] ? 'bg-slate-50/70 opacity-30 pointer-events-none' : 'bg-white'
                        }`}
                      >
                        <select
                          disabled={readOnly || !formData[`enabled_${t}`]}
                          value={formData[`func_${t}`] || 'None'}
                          onChange={(e) => handleChange(`func_${t}`, e.target.value)}
                          className="p-1 border border-slate-300 rounded w-20 text-center bg-white"
                        >
                          <option value="None">None</option>
                          <option value="Class I">Class I</option>
                          <option value="Class II">Class II</option>
                          <option value="Class III">Class III</option>
                          <option value="Class IV">Class IV</option>
                        </select>
                      </td>
                    ))}
                  </tr>

                  {/* No. of antianginals */}
                  <tr className="hover:bg-slate-50">
                    <td className="p-2.5 border border-slate-200 font-semibold">No. of antianginals:</td>
                    {['1m', '3m', '6m', '12m'].map(t => (
                      <td
                        key={t}
                        className={`p-2 border border-slate-200 text-center transition-opacity ${
                          !formData[`enabled_${t}`] ? 'bg-slate-50/70 opacity-30 pointer-events-none' : 'bg-white'
                        }`}
                      >
                        <input
                          type="number"
                          disabled={readOnly || !formData[`enabled_${t}`]}
                          value={formData[`antiang_${t}`]}
                          onChange={(e) => handleChange(`antiang_${t}`, e.target.value)}
                          placeholder="0"
                          className="p-1 border border-slate-300 rounded w-20 text-center font-bold"
                        />
                      </td>
                    ))}
                  </tr>

                  {/* Dual Antiplatelets */}
                  <tr className="hover:bg-slate-50">
                    <td className="p-2.5 border border-slate-200 font-semibold">Dual Antiplatelets:</td>
                    {['1m', '3m', '6m', '12m'].map(t => (
                      <td
                        key={t}
                        className={`p-2 border border-slate-200 text-center transition-opacity ${
                          !formData[`enabled_${t}`] ? 'bg-slate-50/70 opacity-30 pointer-events-none' : 'bg-white'
                        }`}
                      >
                        <select
                          disabled={readOnly || !formData[`enabled_${t}`]}
                          value={formData[`dapt_${t}`] || 'No'}
                          onChange={(e) => handleChange(`dapt_${t}`, e.target.value)}
                          className="p-1 border border-slate-300 rounded w-20 text-center bg-white"
                        >
                          <option value="Yes">Yes</option>
                          <option value="No">No</option>
                        </select>
                      </td>
                    ))}
                  </tr>

                  {/* Statins */}
                  <tr className="hover:bg-slate-50">
                    <td className="p-2.5 border border-slate-200 font-semibold">Statins:</td>
                    {['1m', '3m', '6m', '12m'].map(t => (
                      <td
                        key={t}
                        className={`p-2 border border-slate-200 text-center transition-opacity ${
                          !formData[`enabled_${t}`] ? 'bg-slate-50/70 opacity-30 pointer-events-none' : 'bg-white'
                        }`}
                      >
                        <select
                          disabled={readOnly || !formData[`enabled_${t}`]}
                          value={formData[`statin_${t}`] || 'No'}
                          onChange={(e) => handleChange(`statin_${t}`, e.target.value)}
                          className="p-1 border border-slate-300 rounded w-20 text-center bg-white"
                        >
                          <option value="Yes">Yes</option>
                          <option value="No">No</option>
                        </select>
                      </td>
                    ))}
                  </tr>

                  {/* Remaining rows */}
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
                      <td className="p-2.5 border border-slate-200 font-semibold">{row.label}</td>
                      {['1m', '3m', '6m', '12m'].map(t => (
                        <td
                          key={t}
                          className={`p-2 border border-slate-200 text-center transition-opacity ${
                            !formData[`enabled_${t}`] ? 'bg-slate-50/70 opacity-30 pointer-events-none' : 'bg-white'
                          }`}
                        >
                          <select
                            disabled={readOnly || !formData[`enabled_${t}`]}
                            value={formData[`${row.key}_${t}`] || 'No'}
                            onChange={(e) => handleChange(`${row.key}_${t}`, e.target.value)}
                            className="p-1 border border-slate-300 rounded w-20 text-center bg-white"
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
                    <td className="p-2.5 border border-slate-200 font-semibold">Any other</td>
                    {['1m', '3m', '6m', '12m'].map(t => (
                      <td
                        key={t}
                        className={`p-2 border border-slate-200 text-center transition-opacity ${
                          !formData[`enabled_${t}`] ? 'bg-slate-50/70 opacity-30 pointer-events-none' : 'bg-white'
                        }`}
                      >
                        <input
                          type="text"
                          disabled={readOnly || !formData[`enabled_${t}`]}
                          value={formData[`other_${t}`]}
                          onChange={(e) => handleChange(`other_${t}`, e.target.value)}
                          className="p-1 border border-slate-300 rounded w-24 text-center"
                        />
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>

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
                          ? 'bg-red-50 border-red-500 text-red-950 font-semibold shadow-xs'
                          : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                      }`}
                    >
                      <input
                        type="radio"
                        disabled={readOnly}
                        name="visit_mode"
                        value={mode}
                        checked={formData.visit_mode === mode}
                        onChange={(e) => handleChange('visit_mode', e.target.value)}
                        className="text-red-600 focus:ring-red-500 w-4 h-4"
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
                    disabled={readOnly}
                    value={formData.special_instructions || ''}
                    onChange={(e) => handleChange('special_instructions', e.target.value)}
                    placeholder="Specify follow-up instructions..."
                    className="w-full p-3 border border-slate-200 rounded-lg text-xs text-slate-800 focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all placeholder:text-slate-400 resize-y"
                  />
                </div>
              </div>
            </div>
          </div>
        </SectionCard>
      </div>
    </div>
  );
});

export default STEMIForm;
