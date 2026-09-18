import React, { useState, forwardRef, useImperativeHandle, useMemo } from 'react';
import { Sparkles } from 'lucide-react';
import SectionCard from './common/SectionCard';
import { LABEL_STYLES, INPUT_DISABLED_STYLES } from './common/formStyles';
import { useAlert } from '../../context/AlertContext';
import ClinicalMetricBadge from './common/ClinicalMetricBadge';
import NoteInput from './common/NoteInput';

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

const STEMIForm = forwardRef(function STEMIForm(
  { patientRecord, patient: directPatient, editingRecord, readOnly = false },
  ref
) {
  const { showConfirm } = useAlert();
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

    typical_angina: editingRecord?.typical_angina ?? editingRecord?.clinical?.typical_angina ?? 'No',
    atypical_chest_pain: editingRecord?.atypical_chest_pain ?? editingRecord?.clinical?.atypical_chest_pain ?? 'No',
    breathlessness: editingRecord?.breathlessness ?? editingRecord?.clinical?.breathlessness ?? 'No',
    syncope_presyncope: editingRecord?.syncope_presyncope ?? editingRecord?.clinical?.syncope_presyncope ?? 'No',
    pulse_rate: editingRecord?.pulse_rate ?? editingRecord?.clinical?.pulse_rate ?? '',
    systolic_bp: editingRecord?.systolic_bp ?? editingRecord?.clinical?.systolic_bp ?? '',
    diastolic_bp: editingRecord?.diastolic_bp ?? editingRecord?.clinical?.diastolic_bp ?? '',

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
    pami: editingRecord?.pami || 'No',
    thrombolysis: editingRecord?.thrombolysis || 'No',
    conservative: editingRecord?.conservative || 'No',

    // Section 6: PAMI details
    door_to_balloon_time: editingRecord?.door_to_balloon_time || '',
    vessel_lmca: editingRecord?.vessel_lmca === 'Yes' || editingRecord?.vessel_lmca === true,
    vessel_lad: editingRecord ? (editingRecord.vessel_lad === 'Yes' || editingRecord.vessel_lad === true) : true,
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
    procedural_success: editingRecord?.procedural_success || 'No',
    timi_flow: editingRecord?.timi_flow !== undefined ? editingRecord?.timi_flow : 3,
    complication_none: editingRecord ? (editingRecord.complication_none === 'Yes' || editingRecord.complication_none === true) : true,
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
    heparin_strategy: editingRecord?.heparin_ufh_iv === 'Yes' ? 'UFH i.v alone' : (editingRecord?.heparin_ufh_sc === 'Yes' ? 'UFH s.c alone' : (editingRecord?.heparin_lmwh === 'Yes' ? 'LMWH alone' : (editingRecord?.heparin_ufh_iv_sc === 'Yes' ? 'UFH i.v+UFHs.c' : (editingRecord?.heparin_ufh_iv_lmwh === 'Yes' ? 'UFH i.v + LMWH' : 'LMWH alone')))),
    statin: editingRecord?.statin || 'No',
    statin_dose: editingRecord?.statin_10mg === 'Yes' ? '10 mg' : (editingRecord?.statin_20mg === 'Yes' ? '20 mg' : (editingRecord?.statin_80mg === 'Yes' ? '80 mg' : '40 mg')),
    other_drugs: editingRecord?.other_drugs || '',

    // Section 9: Diagnostic Procedures
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

    // Section 10: Reports -> ECG
    ecg_heart_rate: editingRecord?.ecg_heart_rate || '',
    av_block: editingRecord?.av_block_first_degree === 'Yes' ? '1-degree' : (editingRecord?.av_block_second_degree === 'Yes' ? '2-degree' : (editingRecord?.av_block_chb === 'Yes' ? 'CHB' : 'None')),
    bbb: editingRecord?.bbb_rbbb === 'Yes' ? 'RBBB' : (editingRecord?.bbb_lbbb === 'Yes' ? 'LBBB' : (editingRecord?.bbb_indeterminate === 'Yes' ? 'Indeterminate' : 'None')),
    qwaves_none: editingRecord ? (editingRecord.qwaves_none === 'Yes' || editingRecord.qwaves_none === true) : true,
    qwaves_inferior: editingRecord?.qwaves_inferior === 'Yes' || editingRecord?.qwaves_inferior === true,
    qwaves_anteroseptal: editingRecord?.qwaves_anteroseptal === 'Yes' || editingRecord?.qwaves_anteroseptal === true,
    qwaves_anterior: editingRecord?.qwaves_anterior === 'Yes' || editingRecord?.qwaves_anterior === true,
    qwaves_anterolateral: editingRecord?.qwaves_anterolateral === 'Yes' || editingRecord?.qwaves_anterolateral === true,
    qwaves_lateral: editingRecord?.qwaves_lateral === 'Yes' || editingRecord?.qwaves_lateral === true,
    st_depression_none: editingRecord ? (editingRecord.st_depression_none === 'Yes' || editingRecord.st_depression_none === true) : true,
    st_depression_inferior: editingRecord?.st_depression_inferior === 'Yes' || editingRecord?.st_depression_inferior === true,
    st_depression_anteroseptal: editingRecord?.st_depression_anteroseptal === 'Yes' || editingRecord?.st_depression_anteroseptal === true,
    st_depression_anterior: editingRecord?.st_depression_anterior === 'Yes' || editingRecord?.st_depression_anterior === true,
    st_depression_anterolateral: editingRecord?.st_depression_anterolateral === 'Yes' || editingRecord?.st_depression_anterolateral === true,
    st_depression_lateral: editingRecord?.st_depression_lateral === 'Yes' || editingRecord?.st_depression_lateral === true,
    t_inversion_none: editingRecord ? (editingRecord.t_inversion_none === 'Yes' || editingRecord.t_inversion_none === true) : true,
    t_inversion_inferior: editingRecord?.t_inversion_inferior === 'Yes' || editingRecord?.t_inversion_inferior === true,
    t_inversion_anteroseptal: editingRecord?.t_inversion_anteroseptal === 'Yes' || editingRecord?.t_inversion_anteroseptal === true,
    t_inversion_anterior: editingRecord?.t_inversion_anterior === 'Yes' || editingRecord?.t_inversion_anterior === true,
    t_inversion_anterolateral: editingRecord?.t_inversion_anterolateral === 'Yes' || editingRecord?.t_inversion_anterolateral === true,
    t_inversion_lateral: editingRecord?.t_inversion_lateral === 'Yes' || editingRecord?.t_inversion_lateral === true,
    rhythm: editingRecord?.rhythm_af === 'Yes' ? 'AF' : (editingRecord?.rhythm_svt === 'Yes' ? 'SVT' : (editingRecord?.rhythm_vt === 'Yes' ? 'VT' : (editingRecord?.rhythm_vf === 'Yes' ? 'VF' : 'NSR'))),
    ecg_other: editingRecord?.ecg_other || '',

    // Section 10: Reports -> Echo
    echo_ef: editingRecord?.echo_ef || '',
    lv_function: editingRecord?.lv_function_mild_lvd === 'Yes' ? 'Mild LVD' : (editingRecord?.lv_function_moderate_lvd === 'Yes' ? 'Moderate LVD' : (editingRecord?.lv_function_severe_lvd === 'Yes' ? 'Severe LVD' : 'Normal')),
    rwma_lad: editingRecord ? (editingRecord.rwma_lad === 'Yes' || editingRecord.rwma_lad === true) : true,
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
    hemoglobin: editingRecord?.hemoglobin || '',
    creatinine: editingRecord?.creatinine || '',
    troponin_i: editingRecord?.troponin_i || '',
    cpk: editingRecord?.cpk || '',
    ck_mb: editingRecord?.ck_mb || '',
    sodium: editingRecord?.sodium || '',
    potassium: editingRecord?.potassium || '',
    rbs_admission: editingRecord?.rbs_admission || '',

    // Section 10: Reports -> CAG
    angiogram_done: editingRecord?.angiogram_done || 'No',
    angiogram_finding: editingRecord?.angiogram_normal === 'Yes' ? 'Normal' : (editingRecord?.angiogram_1vd === 'Yes' ? '1VD' : (editingRecord?.angiogram_2vd === 'Yes' ? '2VD' : (editingRecord?.angiogram_3vd === 'Yes' ? '3VD' : (editingRecord?.angiogram_lmca === 'Yes' ? 'LMCA' : '1VD')))),

    // Section 11: Invasive Procedures
    cag: editingRecord?.cag || 'No',
    iabp: editingRecord?.iabp || 'No',
    invasive_ventilation: editingRecord?.invasive_ventilation || 'No',
    ptca: editingRecord?.ptca || 'No',
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
    discharge_beta_blocker: editingRecord?.discharge_beta_blocker ?? editingRecord?.outcomes?.beta_blocker ?? 'No',
    discharge_calcium_channel_blocker: editingRecord?.discharge_calcium_channel_blocker ?? editingRecord?.outcomes?.calcium_channel_blocker ?? 'No',
    discharge_nitrate: editingRecord?.discharge_nitrate ?? editingRecord?.outcomes?.nitrate ?? 'No',
    discharge_nicorandil: editingRecord?.discharge_nicorandil ?? editingRecord?.outcomes?.nicorandil ?? 'No',
    discharge_ivabradine: editingRecord?.discharge_ivabradine ?? editingRecord?.outcomes?.ivabradine ?? 'No',
    discharge_ranolazine: editingRecord?.discharge_ranolazine ?? editingRecord?.outcomes?.ranolazine ?? 'No',
    discharge_trimetazidine: editingRecord?.discharge_trimetazidine ?? editingRecord?.outcomes?.trimetazidine ?? 'No',
    discharge_aspirin: editingRecord?.discharge_aspirin ?? editingRecord?.outcomes?.aspirin ?? 'No',
    discharge_clopidogrel: editingRecord?.discharge_clopidogrel ?? editingRecord?.outcomes?.clopidogrel ?? 'No',
    discharge_prasugrel: editingRecord?.discharge_prasugrel ?? editingRecord?.outcomes?.prasugrel ?? 'No',
    discharge_ticagrelor: editingRecord?.discharge_ticagrelor ?? editingRecord?.outcomes?.ticagrelor ?? 'No',
    discharge_statin: editingRecord?.discharge_statin ?? editingRecord?.outcomes?.statin ?? 'No',
    discharge_statin_dose: editingRecord?.discharge_statin_10mg === 'Yes' ? '10 mg' : (editingRecord?.discharge_statin_20mg === 'Yes' ? '20 mg' : (editingRecord?.discharge_statin_80mg === 'Yes' ? '80 mg' : '40 mg')),
    discharge_other_medication: editingRecord?.discharge_other_medication ?? editingRecord?.outcomes?.discharge_other_medication ?? '',

    // Section 14, 15, 16: Appropriateness Assessment
    appr_iccu_admission: editingRecord?.appr_iccu_admission || 'Appropriate',
    appr_iccu_transfer_out: editingRecord?.appr_iccu_transfer_out || 'Appropriate',
    appr_thrombolysis_indication: editingRecord?.appr_thrombolysis_indication || 'Appropriate',
    appr_ptca_indication: editingRecord?.appr_ptca_indication || 'Appropriate',
    appr_invasive_monitoring: editingRecord?.appr_invasive_monitoring || 'Appropriate',
    appr_iabp_indication: editingRecord?.appr_iabp_indication || 'Appropriate',
    appr_invasive_ventilation: editingRecord?.appr_invasive_ventilation || 'Appropriate',
    appr_dialysis_indication: editingRecord?.appr_dialysis_indication || 'Appropriate',
    appr_other_procedure_name: editingRecord?.appr_other_procedure_name || '',
    appr_other_procedure_appropriateness: editingRecord?.appr_other_procedure_appropriateness || 'Appropriate',
    appr_cardiac_enzymes: editingRecord?.appr_cardiac_enzymes || 'Appropriate',
    appr_bnp: editingRecord?.appr_bnp || 'Appropriate',
    appr_crp: editingRecord?.appr_crp || 'Appropriate',
    appr_lipid_profile: editingRecord?.appr_lipid_profile || 'Appropriate',
    appr_bedside_echo: editingRecord?.appr_bedside_echo || 'Appropriate',
    appr_chest_xray: editingRecord?.appr_chest_xray || 'Appropriate',
    appr_beta_blockers: editingRecord?.appr_beta_blockers || 'Appropriate',
    appr_aspirin: editingRecord?.appr_aspirin || 'Appropriate',
    appr_clopidogrel: editingRecord?.appr_clopidogrel || 'Appropriate',
    appr_ace_inhibitor: editingRecord?.appr_ace_inhibitor || 'Appropriate',
    appr_arb: editingRecord?.appr_arb || 'Appropriate',
    appr_statin: editingRecord?.appr_statin || 'Appropriate',
    appr_diuretic: editingRecord?.appr_diuretic || 'Appropriate',
    appr_lanoxin: editingRecord?.appr_lanoxin || 'Appropriate',
    appr_anticoagulant: editingRecord?.appr_anticoagulant || 'Appropriate',
    appr_amiodarone: editingRecord?.appr_amiodarone || 'Appropriate',
    appr_other_drug_name: editingRecord?.appr_other_drug_name || '',
    appr_other_drug_appropriateness: editingRecord?.appr_other_drug_appropriateness || 'Appropriate',

    appr_iccu_admission_note: editingRecord?.appr_iccu_admission_note ?? editingRecord?.appropriateness?.iccu_admission_note ?? editingRecord?.iccu_admission_note ?? '',
    appr_iccu_transfer_out_note: editingRecord?.appr_iccu_transfer_out_note ?? editingRecord?.appropriateness?.iccu_transfer_out_note ?? editingRecord?.iccu_transfer_out_note ?? '',
    appr_thrombolysis_indication_note: editingRecord?.appr_thrombolysis_indication_note ?? editingRecord?.appr_tlt_note ?? editingRecord?.appropriateness?.tlt_note ?? editingRecord?.tlt_note ?? '',
    appr_ptca_indication_note: editingRecord?.appr_ptca_indication_note ?? editingRecord?.appr_ptca_note ?? editingRecord?.appropriateness?.ptca_note ?? editingRecord?.ptca_note ?? '',
    appr_invasive_monitoring_note: editingRecord?.appr_invasive_monitoring_note ?? editingRecord?.appropriateness?.invasive_monitoring_note ?? editingRecord?.invasive_monitoring_note ?? '',
    appr_iabp_indication_note: editingRecord?.appr_iabp_indication_note ?? editingRecord?.appr_iabp_note ?? editingRecord?.appropriateness?.iabp_note ?? editingRecord?.iabp_note ?? '',
    appr_invasive_ventilation_note: editingRecord?.appr_invasive_ventilation_note ?? editingRecord?.appropriateness?.invasive_ventilation_note ?? editingRecord?.invasive_ventilation_note ?? '',
    appr_dialysis_indication_note: editingRecord?.appr_dialysis_indication_note ?? editingRecord?.appropriateness?.dialysis_note ?? editingRecord?.dialysis_note ?? '',
    appr_other_procedure_appropriateness_note: editingRecord?.appr_other_procedure_appropriateness_note ?? editingRecord?.appr_any_other_procedure_note ?? editingRecord?.appropriateness?.any_other_procedure_note ?? editingRecord?.any_other_procedure_note ?? '',

    appr_cardiac_enzymes_note: editingRecord?.appr_cardiac_enzymes_note ?? editingRecord?.appropriateness?.cardiac_enzymes_note ?? editingRecord?.cardiac_enzymes_note ?? '',
    appr_bnp_note: editingRecord?.appr_bnp_note ?? editingRecord?.appropriateness?.bnp_note ?? editingRecord?.bnp_note ?? '',
    appr_crp_note: editingRecord?.appr_crp_note ?? editingRecord?.appropriateness?.crp_note ?? editingRecord?.crp_note ?? '',
    appr_lipid_profile_note: editingRecord?.appr_lipid_profile_note ?? editingRecord?.appropriateness?.lipid_profile_note ?? editingRecord?.lipid_profile_note ?? '',
    appr_bedside_echo_note: editingRecord?.appr_bedside_echo_note ?? editingRecord?.appr_bed_side_echo_note ?? editingRecord?.appropriateness?.bed_side_echo_note ?? editingRecord?.bed_side_echo_note ?? '',
    appr_chest_xray_note: editingRecord?.appr_chest_xray_note ?? editingRecord?.appr_cxr_note ?? editingRecord?.appropriateness?.cxr_note ?? editingRecord?.cxr_note ?? '',

    appr_beta_blockers_note: editingRecord?.appr_beta_blockers_note ?? editingRecord?.appropriateness?.beta_blockers_note ?? editingRecord?.beta_blockers_note ?? '',
    appr_aspirin_note: editingRecord?.appr_aspirin_note ?? editingRecord?.appropriateness?.aspirin_note ?? editingRecord?.aspirin_note ?? '',
    appr_clopidogrel_note: editingRecord?.appr_clopidogrel_note ?? editingRecord?.appropriateness?.clopidogrel_note ?? editingRecord?.clopidogrel_note ?? '',
    appr_ace_inhibitor_note: editingRecord?.appr_ace_inhibitor_note ?? editingRecord?.appropriateness?.ace_inhibitor_note ?? editingRecord?.ace_inhibitor_note ?? '',
    appr_arb_note: editingRecord?.appr_arb_note ?? editingRecord?.appropriateness?.arb_note ?? editingRecord?.arb_note ?? '',
    appr_statin_note: editingRecord?.appr_statin_note ?? editingRecord?.appropriateness?.statin_note ?? editingRecord?.statin_note ?? '',
    appr_diuretic_note: editingRecord?.appr_diuretic_note ?? editingRecord?.appropriateness?.diuretic_note ?? editingRecord?.diuretic_note ?? '',
    appr_lanoxin_note: editingRecord?.appr_lanoxin_note ?? editingRecord?.appropriateness?.lanoxin_note ?? editingRecord?.lanoxin_note ?? '',
    appr_anticoagulant_note: editingRecord?.appr_anticoagulant_note ?? editingRecord?.appropriateness?.anticoagulant_note ?? editingRecord?.anticoagulant_note ?? '',
    appr_amiodarone_note: editingRecord?.appr_amiodarone_note ?? editingRecord?.appropriateness?.amiodarone_note ?? editingRecord?.amiodarone_note ?? '',
    appr_other_drug_appropriateness_note: editingRecord?.appr_other_drug_appropriateness_note ?? editingRecord?.appr_any_other_drug_note ?? editingRecord?.appropriateness?.any_other_drug_note ?? editingRecord?.any_other_drug_note ?? '',

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

  const [formErrors, setFormErrors] = useState({});

  const fillDummyData = () => {
    const todayStr = new Date().toISOString().split('T')[0];
    const d = new Date();
    d.setDate(d.getDate() + 5);
    const dischargeVal = d.toISOString().split('T')[0];
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);

    setFormData({
      reg_patient_id: patient.id || patient.reg_patient_id || 1,
      name: patient.name || patient.patient_name || 'Dummy Patient',
      age: patientAge || 58,
      gender: patient.gender || 'M',
      mr_no: patient.mrNo || patient.mr_no || 'MR-DEMO-001',
      ip_no: `IP-2026-${randomSuffix}`,
      acs_no: editingRecord?.acs_no || `ACS-STEMI-2026-${randomSuffix}`,
      admission_date: todayStr,
      discharge_date: dischargeVal,
      primary_consultant: 'Dr. K. Sridhar (Cardiologist)',
      phone: patient.phone || '+91 98765 43210',
      email: patient.email || 'patient.stemi@example.com',

      hypertension: 'Yes',
      diabetes: 'No',
      smoking: 'Yes',
      renal_failure: 'No',
      copd: 'No',
      cva: 'No',
      prior_acs: 'No',
      prior_ptca: 'No',
      prior_cabg: 'No',
      other_background: 'Dyslipidemia, Family H/o CAD',

      typical_angina: 'Yes',
      atypical_chest_pain: 'No',
      breathlessness: 'Yes',
      syncope_presyncope: 'No',
      pulse_rate: 88,
      systolic_bp: 134,
      diastolic_bp: 86,

      age_gt_75: 'No',
      age_65_to_74: 'No',
      history_dm_htn_angina: 'Yes',
      sbp_lt_100: 'No',
      heart_rate_gt_100: 'No',
      killip_class_ii_to_iv: 'Yes',
      anterior_mi_or_lbbb: 'Yes',
      weight_lt_67kg: 'No',
      reperfusion_gt_4hrs: 'No',
      timi_total_score: 4,

      lvf: 'Yes',
      vt_vf: 'No',
      bbb_chb: 'No',
      elevated_bnp: 'Yes',
      elevated_crp: 'Yes',

      treatment_strategy: 'PAMI',
      pami: 'Yes',
      thrombolysis: 'No',
      conservative: 'No',

      door_to_balloon_time: 55,
      vessel_lmca: false,
      vessel_lad: true,
      vessel_diagonal: false,
      vessel_lcx: false,
      vessel_ramus: false,
      vessel_om: false,
      vessel_rca: false,
      vessel_pda: false,
      vessel_segment: 'Proximal LAD',
      thrombosuction_done: 'Done',
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

      door_to_needle_time: 25,
      drug_stk: false,
      drug_uk: false,
      drug_reteplase: false,
      drug_tenecteplase: true,
      thrombolysis_dose: '40 mg IV bolus',

      heparin_strategy: 'LMWH alone',
      statin: 'Yes',
      statin_dose: '40 mg',
      other_drugs: 'Pantoprazole 40 mg IV, Ondansetron 4 mg',

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
      diagnostic_other: 'Continuous telemetry, Blood Gas Analysis',

      ecg_heart_rate: 88,
      av_block: 'None',
      bbb: 'None',
      qwaves_none: false,
      qwaves_inferior: false,
      qwaves_anteroseptal: true,
      qwaves_anterior: true,
      qwaves_anterolateral: false,
      qwaves_lateral: false,
      st_depression_none: true,
      st_depression_inferior: false,
      st_depression_anteroseptal: false,
      st_depression_anterior: false,
      st_depression_anterolateral: false,
      st_depression_lateral: false,
      t_inversion_none: false,
      t_inversion_inferior: false,
      t_inversion_anteroseptal: true,
      t_inversion_anterior: true,
      t_inversion_anterolateral: false,
      t_inversion_lateral: false,
      rhythm: 'NSR',
      ecg_other: 'ST elevation 3mm V1-V4 with Q waves V1-V3',

      echo_ef: 42,
      lv_function: 'Mild LVD',
      rwma_lad: true,
      rwma_rca: false,
      rwma_lcx: false,
      mr_grade: 'Mild',
      echo_e: 0.85,
      echo_a: 0.65,
      echo_dt: 190,
      echo_e_prime: 8.5,
      echo_tapsv: 18,
      echo_other: 'Antero-septal hypokinesia, LVEDD 52mm',

      hemoglobin: 14.2,
      creatinine: 1.05,
      troponin_i: 'Positive (12.4 ng/ml)',
      cpk: 1250,
      ck_mb: 85,
      sodium: 139,
      potassium: 4.3,
      rbs_admission: 148,

      angiogram_done: 'Yes',
      angiogram_finding: '1VD',

      cag: 'Yes',
      iabp: 'No',
      invasive_ventilation: 'No',
      ptca: 'Yes',
      cabg: 'No',
      other_procedure: 'Thrombosuction & Primary PCI to LAD',

      death: 'No',
      stemi_for_nonstemi: 'No',
      remi_for_stemi: 'No',
      revascularization_recurrent_ischemia: 'No',
      cva_thrombotic: 'No',
      cva_hemorrhagic: 'No',
      major_bleeding: 'No',
      outcome_other: 'Hemodynamically stable at discharge, Killip Class I',

      discharge_beta_blocker: 'Yes',
      discharge_calcium_channel_blocker: 'No',
      discharge_nitrate: 'No',
      discharge_nicorandil: 'No',
      discharge_ivabradine: 'No',
      discharge_ranolazine: 'No',
      discharge_trimetazidine: 'No',
      discharge_aspirin: 'Yes',
      discharge_clopidogrel: 'No',
      discharge_prasugrel: 'No',
      discharge_ticagrelor: 'Yes',
      discharge_statin: 'Yes',
      discharge_statin_dose: '40 mg',
      discharge_other_medication: 'Ramipril 2.5 mg OD, Pantoprazole 40 mg OD',

      appr_iccu_admission: 'Appropriate',
      appr_iccu_admission_note: 'Acute STEMI care',
      appr_iccu_transfer_out: 'Appropriate',
      appr_iccu_transfer_out_note: 'Stable post-PAMI',
      appr_thrombolysis_indication: 'Appropriate',
      appr_thrombolysis_indication_note: '',
      appr_ptca_indication: 'Appropriate',
      appr_ptca_indication_note: 'Primary PCI anterior',
      appr_invasive_monitoring: 'Appropriate',
      appr_invasive_monitoring_note: 'Arterial line PCI',
      appr_iabp_indication: 'Inappropriate',
      appr_iabp_indication_note: 'No shock',
      appr_invasive_ventilation: 'Inappropriate',
      appr_invasive_ventilation_note: 'Spo2 ok nasal prong',
      appr_dialysis_indication: 'Inappropriate',
      appr_dialysis_indication_note: 'Normal renal func',
      appr_other_procedure_name: '',
      appr_other_procedure_appropriateness: 'Inappropriate',
      appr_other_procedure_appropriateness_note: '',

      appr_cardiac_enzymes: 'Appropriate',
      appr_cardiac_enzymes_note: 'Confirm MI necrosis',
      appr_bnp: 'Appropriate',
      appr_bnp_note: 'Assess HF risk',
      appr_crp: 'Inappropriate',
      appr_crp_note: '',
      appr_lipid_profile: 'Appropriate',
      appr_lipid_profile_note: 'Fasting lipid workup',
      appr_bedside_echo: 'Appropriate',
      appr_bedside_echo_note: 'LVEF wall motion',
      appr_chest_xray: 'Appropriate',
      appr_chest_xray_note: 'Rule out congestion',

      appr_beta_blockers: 'Appropriate',
      appr_beta_blockers_note: 'Cardioprotect postMI',
      appr_aspirin: 'Appropriate',
      appr_aspirin_note: 'Antiplatelet load',
      appr_clopidogrel: 'Appropriate',
      appr_clopidogrel_note: '',
      appr_ace_inhibitor: 'Appropriate',
      appr_ace_inhibitor_note: 'LV remodel prevent',
      appr_arb: 'Inappropriate',
      appr_arb_note: 'Tolerates ACE',
      appr_statin: 'Appropriate',
      appr_statin_note: 'High-intensity statin',
      appr_diuretic: 'Inappropriate',
      appr_diuretic_note: '',
      appr_lanoxin: 'Inappropriate',
      appr_lanoxin_note: '',
      appr_anticoagulant: 'Appropriate',
      appr_anticoagulant_note: 'Periproc heparin',
      appr_amiodarone: 'Inappropriate',
      appr_amiodarone_note: '',
      appr_other_drug_name: '',
      appr_other_drug_appropriateness: 'Inappropriate',
      appr_other_drug_appropriateness_note: '',

      iccu_hours: 48,
      stepdown_icu_hours: 24,
      floor_days: 2,
      total_hospital_stay_days: 5,

      bed_charges: 18500,
      drugs_disposables_cost: 32000,
      package_cost: 145000,
      laboratory_cost: 12500,
      non_invasive_lab_cost: 6500,
      consultation_cost: 15000,
      radiology_cost: 4500,
      miscellaneous_cost: 5000,
      total_cost: 239000,

      enabled_1m: true,
      enabled_3m: true,
      enabled_6m: true,
      enabled_12m: true,
      date_1m: calculateExpectedDate(dischargeVal, 1) || '',
      date_3m: calculateExpectedDate(dischargeVal, 3) || '',
      date_6m: calculateExpectedDate(dischargeVal, 6) || '',
      date_12m: calculateExpectedDate(dischargeVal, 12) || '',
      custom_date_1m: false,
      custom_date_3m: false,
      custom_date_6m: false,
      custom_date_12m: false,
      angina_1m: 'No', angina_3m: 'No', angina_6m: 'No', angina_12m: 'No',
      func_1m: 'None', func_3m: 'None', func_6m: 'None', func_12m: 'None',
      antiang_1m: '0', antiang_3m: '0', antiang_6m: '0', antiang_12m: '0',
      dapt_1m: 'Yes', dapt_3m: 'Yes', dapt_6m: 'Yes', dapt_12m: 'Yes',
      statin_1m: 'Yes', statin_3m: 'Yes', statin_6m: 'Yes', statin_12m: 'Yes',
      beta_1m: 'Yes', beta_3m: 'Yes', beta_6m: 'Yes', beta_12m: 'Yes',
      ace_1m: 'Yes', ace_3m: 'Yes', ace_6m: 'Yes', ace_12m: 'Yes',
      aldo_1m: 'No', aldo_3m: 'No', aldo_6m: 'No', aldo_12m: 'No',
      acs_1m: 'No', acs_3m: 'No', acs_6m: 'No', acs_12m: 'No',
      ptca_1m: 'No', ptca_3m: 'No', ptca_6m: 'No', ptca_12m: 'No',
      cabg_1m: 'No', cabg_3m: 'No', cabg_6m: 'No', cabg_12m: 'No',
      death_1m: 'No', death_3m: 'No', death_6m: 'No', death_12m: 'No',
      other_1m: 'Routine 1-month checkup', other_3m: '', other_6m: '', other_12m: '',
      visit_mode: 'In-Person',
      special_instructions: 'Strict compliance with Dual Antiplatelet Therapy (DAPT). Low salt diet, no heavy weight lifting for 4 weeks.'
    });
  };

  const handleChange = (field, value) => {
    setFormData((prev) => {
      const updated = { ...prev, [field]: value };

      if (field === 'treatment_strategy') {
        updated.pami = value === 'PAMI' ? 'Yes' : 'No';
        updated.thrombolysis = value === 'Thrombolysis' ? 'Yes' : 'No';
        updated.conservative = value === 'Conservative' ? 'Yes' : 'No';
      }

      if (field === 'admission_date' || field === 'discharge_date') {
        const base = updated.discharge_date || updated.admission_date;
        if (base) {
          ['1m', '3m', '6m', '12m'].forEach((k, idx) => {
            const months = [1, 3, 6, 12][idx];
            if (!updated[`custom_date_${k}`]) {
              updated[`date_${k}`] = calculateExpectedDate(base, months) || '';
            }
          });
        }
      }

      return updated;
    });

    if (formErrors[field]) {
      setFormErrors((prev) => {
        const newErr = { ...prev };
        delete newErr[field];
        return newErr;
      });
    }
  };

  const validateField = (field, value) => {
    if (field === 'admission_date' && !value) {
      return 'Date of Admission is required';
    }
    if (field === 'discharge_date' && value && formData.admission_date) {
      if (new Date(value) <= new Date(formData.admission_date)) {
        return 'Discharge date must be after admission date';
      }
    }
    return null;
  };

  const validateAllFields = () => {
    const errors = {};
    const errAdm = validateField('admission_date', formData.admission_date);
    if (errAdm) errors.admission_date = errAdm;

    const errDis = validateField('discharge_date', formData.discharge_date);
    if (errDis) errors.discharge_date = errDis;

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const renderFieldError = (field) => {
    if (!formErrors[field]) return null;
    return (
      <span className="text-[10px] font-bold text-red-600 mt-1 block animate-shake">
        ⚠️ {formErrors[field]}
      </span>
    );
  };

  const timiCalculatedScore = useMemo(() => {
    let score = 0;
    if (formData.age_gt_75 === 'Yes') score += 3;
    if (formData.age_65_to_74 === 'Yes') score += 2;
    if (formData.history_dm_htn_angina === 'Yes') score += 1;
    if (formData.sbp_lt_100 === 'Yes') score += 3;
    if (formData.heart_rate_gt_100 === 'Yes') score += 2;
    if (['I', 'II', 'III', 'IV', 'Yes'].includes(formData.killip_class_ii_to_iv)) score += 2;
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

  const autoSumCost = useMemo(() => {
    const costs = [
      formData.bed_charges,
      formData.drugs_disposables_cost,
      formData.package_cost,
      formData.laboratory_cost,
      formData.non_invasive_lab_cost,
      formData.consultation_cost,
      formData.radiology_cost,
      formData.miscellaneous_cost
    ];

    const hasAny = costs.some(c => c !== '' && c !== null && c !== undefined && !isNaN(parseFloat(c)));
    if (!hasAny) return null;

    return costs.reduce((sum, val) => {
      const num = parseFloat(val);
      return sum + (isNaN(num) ? 0 : num);
    }, 0);
  }, [
    formData.bed_charges,
    formData.drugs_disposables_cost,
    formData.package_cost,
    formData.laboratory_cost,
    formData.non_invasive_lab_cost,
    formData.consultation_cost,
    formData.radiology_cost,
    formData.miscellaneous_cost
  ]);

  const getFlattenedData = () => {
    const followupArray = [];
    const mapping = { '1m': '1-Month', '3m': '3-Month', '6m': '6-Month', '12m': '12-Month' };

    ['1m', '3m', '6m', '12m'].forEach(k => {
      if (formData[`enabled_${k}`]) {
        followupArray.push({
          followup_month: mapping[k],
          followup_date: formData[`date_${k}`] || null,
          angina: formData[`angina_${k}`] || 'No',
          functional_class: formData[`func_${k}`] || 'None',
          number_of_antianginals: formData[`antiang_${k}`] !== '' ? parseInt(formData[`antiang_${k}`], 10) : null,
          dual_antiplatelets: formData[`dapt_${k}`] || 'No',
          statins: formData[`statin_${k}`] || 'No',
          beta_blocker: formData[`beta_${k}`] || 'No',
          acei_arb: formData[`ace_${k}`] || 'No',
          aldosterone_antagonist: formData[`aldo_${k}`] || 'No',
          acs_hospitalization: formData[`acs_${k}`] || 'No',
          ptca: formData[`ptca_${k}`] || 'No',
          cabg: formData[`cabg_${k}`] || 'No',
          death: formData[`death_${k}`] || 'No',
          other_event: formData[`other_${k}`] || null,
          visit_mode: formData.visit_mode || 'In-Person',
          special_instructions: formData.special_instructions || null
        });
      }
    });

    return {
      reg_patient_id: formData.reg_patient_id,
      patient_name: formData.name,
      age: formData.age ? parseInt(formData.age, 10) : null,
      gender: formData.gender,
      mr_no: formData.mr_no,
      ip_no: formData.ip_no,
      admission_date: formData.admission_date,
      discharge_date: formData.discharge_date || null,
      primary_consultant: formData.primary_consultant,
      phone: formData.phone,
      email: formData.email,
      acs_no: formData.acs_no,

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

      lvf: formData.lvf,
      vt_vf: formData.vt_vf,
      bbb_chb: formData.bbb_chb,
      elevated_bnp: formData.elevated_bnp,
      elevated_crp: formData.elevated_crp,

      treatment_strategy: formData.treatment_strategy,
      pami: formData.treatment_strategy === 'PAMI' ? 'Yes' : 'No',
      thrombolysis: formData.treatment_strategy === 'Thrombolysis' ? 'Yes' : 'No',
      conservative: formData.treatment_strategy === 'Conservative' ? 'Yes' : 'No',

      door_to_balloon_time: formData.door_to_balloon_time ? parseInt(formData.door_to_balloon_time, 10) : null,
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
      stent_des: formData.stent_type === 'DES' ? 'Yes' : 'No',
      stent_bms: formData.stent_type === 'BMS' ? 'Yes' : 'No',
      stent_diameter: formData.stent_diameter ? parseFloat(formData.stent_diameter) : null,
      stent_length: formData.stent_length ? parseFloat(formData.stent_length) : null,
      procedural_success: formData.procedural_success,
      timi_flow: formData.timi_flow !== null ? parseInt(formData.timi_flow, 10) : null,
      complication_none: formData.complication_none ? 'Yes' : 'No',
      complication_tamponade: formData.complication_tamponade ? 'Yes' : 'No',
      complication_major_bleed: formData.complication_major_bleed ? 'Yes' : 'No',
      complication_stroke: formData.complication_stroke ? 'Yes' : 'No',
      complication_stent_thrombosis: formData.complication_stent_thrombosis ? 'Yes' : 'No',
      complication_mi: formData.complication_mi ? 'Yes' : 'No',
      complication_death: formData.complication_death ? 'Yes' : 'No',
      complication_emergency_cabg: formData.complication_emergency_cabg ? 'Yes' : 'No',

      door_to_needle_time: formData.door_to_needle_time ? parseInt(formData.door_to_needle_time, 10) : null,
      drug_stk: formData.drug_stk ? 'Yes' : 'No',
      drug_uk: formData.drug_uk ? 'Yes' : 'No',
      drug_reteplase: formData.drug_reteplase ? 'Yes' : 'No',
      drug_tenecteplase: formData.drug_tenecteplase ? 'Yes' : 'No',
      thrombolysis_dose: formData.thrombolysis_dose || null,

      heparin_ufh_iv: formData.heparin_strategy === 'UFH i.v alone' ? 'Yes' : 'No',
      heparin_ufh_sc: formData.heparin_strategy === 'UFH s.c alone' ? 'Yes' : 'No',
      heparin_lmwh: formData.heparin_strategy === 'LMWH alone' ? 'Yes' : 'No',
      heparin_ufh_iv_sc: formData.heparin_strategy === 'UFH i.v+UFHs.c' ? 'Yes' : 'No',
      heparin_ufh_iv_lmwh: formData.heparin_strategy === 'UFH i.v + LMWH' ? 'Yes' : 'No',
      statin: formData.statin,
      statin_10mg: formData.statin_dose === '10 mg' ? 'Yes' : 'No',
      statin_20mg: formData.statin_dose === '20 mg' ? 'Yes' : 'No',
      statin_80mg: formData.statin_dose === '80 mg' ? 'Yes' : 'No',
      other_drugs: formData.other_drugs || null,

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

      ecg_heart_rate: formData.ecg_heart_rate ? parseInt(formData.ecg_heart_rate, 10) : null,
      av_block: formData.av_block,
      av_block_none: formData.av_block === 'None' ? 'Yes' : 'No',
      av_block_first_degree: formData.av_block === '1-degree' ? 'Yes' : 'No',
      av_block_second_degree: formData.av_block === '2-degree' ? 'Yes' : 'No',
      av_block_chb: formData.av_block === 'CHB' ? 'Yes' : 'No',
      bbb: formData.bbb,
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
      rhythm: formData.rhythm,
      rhythm_nsr: formData.rhythm === 'NSR' ? 'Yes' : 'No',
      rhythm_af: formData.rhythm === 'AF' ? 'Yes' : 'No',
      rhythm_svt: formData.rhythm === 'SVT' ? 'Yes' : 'No',
      rhythm_vt: formData.rhythm === 'VT' ? 'Yes' : 'No',
      rhythm_vf: formData.rhythm === 'VF' ? 'Yes' : 'No',
      ecg_other: formData.ecg_other || null,

      echo_ef: formData.echo_ef ? parseFloat(formData.echo_ef) : null,
      lv_function: formData.lv_function,
      lv_function_normal: formData.lv_function === 'Normal' ? 'Yes' : 'No',
      lv_function_mild_lvd: formData.lv_function === 'Mild LVD' ? 'Yes' : 'No',
      lv_function_moderate_lvd: formData.lv_function === 'Moderate LVD' ? 'Yes' : 'No',
      lv_function_severe_lvd: formData.lv_function === 'Severe LVD' ? 'Yes' : 'No',
      rwma_lad: formData.rwma_lad ? 'Yes' : 'No',
      rwma_rca: formData.rwma_rca ? 'Yes' : 'No',
      rwma_lcx: formData.rwma_lcx ? 'Yes' : 'No',
      mr: formData.mr_grade,
      mr_grade: formData.mr_grade,
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
      troponin_i: formData.troponin_i !== undefined && formData.troponin_i !== null && formData.troponin_i !== '' ? String(formData.troponin_i) : null,
      cpk: formData.cpk !== undefined && formData.cpk !== null && formData.cpk !== '' ? String(formData.cpk) : null,
      ck_mb: formData.ck_mb !== undefined && formData.ck_mb !== null && formData.ck_mb !== '' ? String(formData.ck_mb) : null,
      sodium: formData.sodium ? parseFloat(formData.sodium) : null,
      potassium: formData.potassium ? parseFloat(formData.potassium) : null,
      rbs_admission: formData.rbs_admission ? parseFloat(formData.rbs_admission) : null,

      angiogram_done: formData.angiogram_done,
      angiogram_normal: formData.angiogram_finding === 'Normal' ? 'Yes' : 'No',
      angiogram_1vd: formData.angiogram_finding === '1VD' ? 'Yes' : 'No',
      angiogram_2vd: formData.angiogram_finding === '2VD' ? 'Yes' : 'No',
      angiogram_3vd: formData.angiogram_finding === '3VD' ? 'Yes' : 'No',
      angiogram_lmca: formData.angiogram_finding === 'LMCA' ? 'Yes' : 'No',

      cag: formData.cag,
      iabp: formData.iabp,
      invasive_ventilation: formData.invasive_ventilation,
      ptca: formData.ptca,
      cabg: formData.cabg,
      other_procedure: formData.other_procedure || null,

      death: formData.death,
      stemi_for_nonstemi: formData.stemi_for_nonstemi,
      remi_for_stemi: formData.remi_for_stemi,
      revascularization_recurrent_ischemia: formData.revascularization_recurrent_ischemia,
      cva_thrombotic: formData.cva_thrombotic,
      cva_hemorrhagic: formData.cva_hemorrhagic,
      major_bleeding: formData.major_bleeding,
      outcome_other: formData.outcome_other || null,

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
      discharge_statin_80mg: formData.discharge_statin_dose === '80 mg' ? 'Yes' : 'No',
      discharge_other_medication: formData.discharge_other_medication || null,

      appr_iccu_admission: formData.appr_iccu_admission,
      appr_iccu_admission_note: (formData.appr_iccu_admission_note || '').slice(0, 150),
      appr_iccu_transfer_out: formData.appr_iccu_transfer_out,
      appr_iccu_transfer_out_note: (formData.appr_iccu_transfer_out_note || '').slice(0, 150),
      appr_thrombolysis_indication: formData.appr_thrombolysis_indication,
      appr_thrombolysis_indication_note: (formData.appr_thrombolysis_indication_note || '').slice(0, 150),
      appr_ptca_indication: formData.appr_ptca_indication,
      appr_ptca_indication_note: (formData.appr_ptca_indication_note || '').slice(0, 150),
      appr_invasive_monitoring: formData.appr_invasive_monitoring,
      appr_invasive_monitoring_note: (formData.appr_invasive_monitoring_note || '').slice(0, 150),
      appr_iabp_indication: formData.appr_iabp_indication,
      appr_iabp_indication_note: (formData.appr_iabp_indication_note || '').slice(0, 150),
      appr_invasive_ventilation: formData.appr_invasive_ventilation,
      appr_invasive_ventilation_note: (formData.appr_invasive_ventilation_note || '').slice(0, 150),
      appr_dialysis_indication: formData.appr_dialysis_indication,
      appr_dialysis_indication_note: (formData.appr_dialysis_indication_note || '').slice(0, 150),
      appr_other_procedure_name: (formData.appr_other_procedure_name || '').slice(0, 150),
      appr_other_procedure_appropriateness: formData.appr_other_procedure_appropriateness,
      appr_other_procedure_appropriateness_note: (formData.appr_other_procedure_appropriateness_note || '').slice(0, 150),

      appr_cardiac_enzymes: formData.appr_cardiac_enzymes,
      appr_cardiac_enzymes_note: (formData.appr_cardiac_enzymes_note || '').slice(0, 150),
      appr_bnp: formData.appr_bnp,
      appr_bnp_note: (formData.appr_bnp_note || '').slice(0, 150),
      appr_crp: formData.appr_crp,
      appr_crp_note: (formData.appr_crp_note || '').slice(0, 150),
      appr_lipid_profile: formData.appr_lipid_profile,
      appr_lipid_profile_note: (formData.appr_lipid_profile_note || '').slice(0, 150),
      appr_bedside_echo: formData.appr_bedside_echo,
      appr_bedside_echo_note: (formData.appr_bedside_echo_note || '').slice(0, 150),
      appr_chest_xray: formData.appr_chest_xray,
      appr_chest_xray_note: (formData.appr_chest_xray_note || '').slice(0, 150),

      appr_beta_blockers: formData.appr_beta_blockers,
      appr_beta_blockers_note: (formData.appr_beta_blockers_note || '').slice(0, 150),
      appr_aspirin: formData.appr_aspirin,
      appr_aspirin_note: (formData.appr_aspirin_note || '').slice(0, 150),
      appr_clopidogrel: formData.appr_clopidogrel,
      appr_clopidogrel_note: (formData.appr_clopidogrel_note || '').slice(0, 150),
      appr_ace_inhibitor: formData.appr_ace_inhibitor,
      appr_ace_inhibitor_note: (formData.appr_ace_inhibitor_note || '').slice(0, 150),
      appr_arb: formData.appr_arb,
      appr_arb_note: (formData.appr_arb_note || '').slice(0, 150),
      appr_statin: formData.appr_statin,
      appr_statin_note: (formData.appr_statin_note || '').slice(0, 150),
      appr_diuretic: formData.appr_diuretic,
      appr_diuretic_note: (formData.appr_diuretic_note || '').slice(0, 150),
      appr_lanoxin: formData.appr_lanoxin,
      appr_lanoxin_note: (formData.appr_lanoxin_note || '').slice(0, 150),
      appr_anticoagulant: formData.appr_anticoagulant,
      appr_anticoagulant_note: (formData.appr_anticoagulant_note || '').slice(0, 150),
      appr_amiodarone: formData.appr_amiodarone,
      appr_amiodarone_note: (formData.appr_amiodarone_note || '').slice(0, 150),
      appr_other_drug_name: (formData.appr_other_drug_name || '').slice(0, 150),
      appr_other_drug_appropriateness: formData.appr_other_drug_appropriateness,
      appr_other_drug_appropriateness_note: (formData.appr_other_drug_appropriateness_note || '').slice(0, 150),

      iccu_hours: formData.iccu_hours ? parseInt(formData.iccu_hours, 10) : null,
      stepdown_icu_hours: formData.stepdown_icu_hours ? parseInt(formData.stepdown_icu_hours, 10) : null,
      floor_days: formData.floor_days ? parseInt(formData.floor_days, 10) : null,
      total_hospital_stay_days: formData.total_hospital_stay_days ? parseInt(formData.total_hospital_stay_days, 10) : null,

      bed_charges: formData.bed_charges ? parseFloat(formData.bed_charges) : null,
      drugs_disposables_cost: formData.drugs_disposables_cost ? parseFloat(formData.drugs_disposables_cost) : null,
      package_cost: formData.package_cost ? parseFloat(formData.package_cost) : null,
      laboratory_cost: formData.laboratory_cost ? parseFloat(formData.laboratory_cost) : null,
      non_invasive_lab_cost: formData.non_invasive_lab_cost ? parseFloat(formData.non_invasive_lab_cost) : null,
      consultation_cost: formData.consultation_cost ? parseFloat(formData.consultation_cost) : null,
      radiology_cost: formData.radiology_cost ? parseFloat(formData.radiology_cost) : null,
      miscellaneous_cost: formData.miscellaneous_cost ? parseFloat(formData.miscellaneous_cost) : null,
      total_cost: formData.total_cost ? parseFloat(formData.total_cost) : (autoSumCost !== null ? autoSumCost : null),

      followup: followupArray
    };
  };

  useImperativeHandle(ref, () => ({
    getSubmissionData: () => getFlattenedData(),
    fillDummyData: () => {
      fillDummyData();
      setFormErrors({});
    },
    validateForm: () => {
      if (formData.admission_date && formData.discharge_date) {
        if (new Date(formData.discharge_date) <= new Date(formData.admission_date)) {
          setFormErrors(prev => ({
            ...prev,
            discharge_date: 'Discharge date must be greater than admission date'
          }));
          alert('Form submission blocked: Date of Discharge must be greater than Date of Admission.');
          return false;
        }
      }
      const isValid = validateAllFields();
      if (!isValid) {
        alert('Form submission blocked: Please fix validation errors highlighted in red.');
        return false;
      }
      return true;
    }
  }));

  const renderRadio = (field, label, options = ['Yes', 'No', 'Unknown']) => (
    <div className="flex items-center justify-between p-2.5 bg-white border border-slate-200 rounded-lg">
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

  const handleAppropriatenessChange = async (fieldKey, newValue, noteKey = `${fieldKey}_note`) => {
    const currentValue = formData[fieldKey];
    const currentNote = formData[noteKey] ? String(formData[noteKey]).trim() : '';

    if (currentValue && currentValue !== newValue && currentNote.length > 0) {
      const keepNote = await showConfirm({
        type: 'warning',
        title: 'Change Status?',
        message: `You are changing the appropriateness status. Do you want to keep your existing note: '${currentNote}'?`,
        confirmText: 'Keep Note',
        cancelText: 'Clear Note'
      });

      if (keepNote) {
        handleChange(fieldKey, newValue);
      } else {
        setFormData((prev) => ({
          ...prev,
          [fieldKey]: newValue,
          [noteKey]: ''
        }));
      }
    } else {
      handleChange(fieldKey, newValue);
    }
  };

  const renderAppropriatenessRadio = (field, label, specifyKey = null) => {
    const noteKey = `${field}_note`;
    const specifyVal = formData[specifyKey] || '';
    const noteVal = formData[noteKey] || '';

    return (
      <div key={field} className="grid grid-cols-12 gap-3 items-center w-full min-w-0 p-3 bg-white border border-slate-200 rounded-lg text-xs min-h-[52px]">
        {/* Column 1: Label / Specify Area (4 Cols) */}
        <div className="col-span-12 md:col-span-4 min-w-0 pr-2">
          {specifyKey ? (
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 min-w-0 w-full">
              <span className="font-semibold text-slate-700 whitespace-nowrap flex-shrink-0">{label}:</span>
              <NoteInput
                value={specifyVal}
                onChange={(val) => handleChange(specifyKey, val)}
                maxLength={150}
                disabled={readOnly}
                readOnly={readOnly}
                placeholder="Specify name"
                className="w-full min-w-0 flex-1"
                focusRingClass="focus:ring-red-500"
              />
            </div>
          ) : (
            <span className="font-semibold text-slate-700 leading-tight block break-words whitespace-normal min-w-0">
              {label}
            </span>
          )}
        </div>

        {/* Column 2: Radio Buttons (3 Cols) */}
        <div className="col-span-12 md:col-span-3 min-w-0 flex items-center justify-start md:justify-center">
          <div className="flex gap-4 flex-shrink-0 min-w-0">
            {['Appropriate', 'Inappropriate'].map((opt) => (
              <label key={opt} className="flex items-center gap-1.5 cursor-pointer text-xs select-none whitespace-nowrap">
                <input
                  type="radio"
                  disabled={readOnly}
                  name={`${field}-${label}`}
                  checked={formData[field] === opt}
                  onChange={() => handleAppropriatenessChange(field, opt, noteKey)}
                  className="text-red-600 focus:ring-red-500 cursor-pointer flex-shrink-0"
                />
                <span className={`font-semibold ${opt === 'Appropriate' ? 'text-emerald-700' : 'text-slate-600'}`}>{opt}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Column 3: Note Input Block (5 Cols) */}
        <div className="col-span-12 md:col-span-5 min-w-0">
          <NoteInput
            value={noteVal}
            onChange={(val) => handleChange(noteKey, val)}
            maxLength={150}
            disabled={readOnly}
            readOnly={readOnly}
            placeholder="Add note..."
            className="w-full min-w-0"
            focusRingClass="focus:ring-red-500"
          />
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6 text-slate-800">
      

      {/* Patient Profile & Administrative Details */}
      <div id="section-1">
        <SectionCard title="Patient Profile & Administrative Details">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs">
            <div>
              <label className={LABEL_STYLES}>Patient Name:</label>
              <input
                type="text"
                readOnly
                disabled
                value={patient.name || patient.patient_name || formData.name || '—'}
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
                value={patient.gender === 'M' ? 'Male' : patient.gender === 'F' ? 'Female' : (patient.gender || '—')}
                className={INPUT_DISABLED_STYLES}
              />
            </div>
            <div>
              <label className={LABEL_STYLES}>MR No:</label>
              <input
                type="text"
                readOnly
                disabled
                value={patient.mrNo || patient.mr_no || formData.mr_no || '—'}
                className={INPUT_DISABLED_STYLES}
              />
            </div>
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className={LABEL_STYLES}>IP No:</label>
                {!readOnly && (
                  <span className={`text-[10px] select-none ${
                    Math.max(0, 30 - (formData.ip_no || '').length) <= 5
                      ? 'text-rose-500 font-bold animate-pulse'
                      : 'text-slate-400 font-medium'
                  }`}>
                    {Math.max(0, 30 - (formData.ip_no || '').length)} left
                  </span>
                )}
              </div>
              <input
                type="text"
                disabled={readOnly}
                value={formData.ip_no}
                maxLength={30}
                onChange={(e) => handleChange('ip_no', e.target.value)}
                placeholder="E.g. IP00001"
                className="w-full p-2 border border-slate-300 rounded-md font-medium text-slate-900 font-mono focus:ring-red-500 focus:border-red-500"
              />
            </div>
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className={LABEL_STYLES}>ACS No / Registry No:</label>
                {!readOnly && (
                  <span className={`text-[10px] select-none ${
                    Math.max(0, 50 - (formData.acs_no || '').length) <= 5
                      ? 'text-rose-500 font-bold animate-pulse'
                      : 'text-slate-400 font-medium'
                  }`}>
                    {Math.max(0, 50 - (formData.acs_no || '').length)} left
                  </span>
                )}
              </div>
              <input
                type="text"
                disabled={readOnly}
                value={formData.acs_no}
                maxLength={50}
                onChange={(e) => handleChange('acs_no', e.target.value)}
                placeholder="E.g. ACS00001"
                className="w-full p-2 border border-slate-300 rounded-md font-medium text-slate-900 font-mono focus:ring-red-500 focus:border-red-500"
              />
            </div>
            <div>
              <label className="font-bold text-slate-700 block mb-1">Date of Admission:</label>
              <input
                type="date"
                disabled={readOnly}
                value={formData.admission_date}
                onChange={(e) => handleChange('admission_date', e.target.value)}
                className={`w-full p-2 border rounded-md font-medium text-slate-900 ${
                  formErrors.admission_date ? 'border-red-500 bg-red-50/50 text-red-900 font-semibold' : 'border-slate-300'
                }`}
              />
              {renderFieldError('admission_date')}
            </div>
            <div>
              <label className="font-bold text-slate-700 block mb-1">Date of Discharge:</label>
              <input
                type="date"
                disabled={readOnly}
                value={formData.discharge_date}
                min={formData.admission_date || undefined}
                onChange={(e) => handleChange('discharge_date', e.target.value)}
                className={`w-full p-2 border rounded-md font-medium text-slate-900 ${
                  formErrors.discharge_date ? 'border-red-500 bg-red-50/50 text-red-900 font-semibold' : 'border-slate-300'
                }`}
              />
              {renderFieldError('discharge_date')}
            </div>
            <div>
              <label className="font-bold text-slate-700 block mb-1">Primary Consultant:</label>
              <select
                disabled={readOnly}
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
                value={patient.phone || patient.contact_phone || formData.phone || '—'}
                className={INPUT_DISABLED_STYLES}
              />
            </div>
            <div>
              <label className={LABEL_STYLES}>E-mail:</label>
              <input
                type="text"
                readOnly
                disabled
                value={patient.email || patient.contact_email || formData.email || '—'}
                className={INPUT_DISABLED_STYLES}
              />
            </div>
          </div>
        </SectionCard>
      </div>

      {/* Clinical Information - Background */}
      <div id="section-2">
        <SectionCard title="Clinical Information">
          <div className="space-y-4 text-xs">
            <div className="font-bold text-slate-800 border-b pb-1 text-sm">Background:</div>
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
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="font-bold text-slate-700 block">Any other</label>
                {!readOnly && (
                  <span className={`text-[10px] select-none ${
                    Math.max(0, 255 - (formData.other_background || '').length) <= 5
                      ? 'text-rose-500 font-bold animate-pulse'
                      : 'text-slate-400 font-medium'
                  }`}>
                    {Math.max(0, 255 - (formData.other_background || '').length)} left
                  </span>
                )}
              </div>
              <input
                type="text"
                disabled={readOnly}
                value={formData.other_background}
                maxLength={255}
                onChange={(e) => handleChange('other_background', e.target.value)}
                className="w-full p-2 border border-slate-300 rounded-md"
                placeholder="Specify additional clinical history..."
              />
            </div>
          </div>
        </SectionCard>
      </div>

      {/* Clinical Information - Presentation */}
      <div id="section-2-presentation">
        <SectionCard title="Clinical Information">
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
                <label className="font-bold text-slate-700 block mb-1">Pulse Rate (bpm):</label>
                <input
                  type="number"
                  disabled={readOnly}
                  value={formData.pulse_rate}
                  onChange={(e) => handleChange('pulse_rate', e.target.value)}
                  className={`w-full p-2 border rounded-md font-bold ${
                    formErrors.pulse_rate ? 'border-red-500 bg-red-50/50 text-red-900' : 'border-slate-300'
                  }`}
                />
                {renderFieldError('pulse_rate')}
                <ClinicalMetricBadge metricId="pulse_rate" value={formData.pulse_rate} />
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-1">SBP (mmHg):</label>
                <input
                  type="number"
                  disabled={readOnly}
                  value={formData.systolic_bp}
                  onChange={(e) => handleChange('systolic_bp', e.target.value)}
                  className={`w-full p-2 border rounded-md font-bold ${
                    formErrors.systolic_bp ? 'border-red-500 bg-red-50/50 text-red-900' : 'border-slate-300'
                  }`}
                />
                {renderFieldError('systolic_bp')}
                <ClinicalMetricBadge metricId="systolic_bp" value={formData.systolic_bp} />
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-1">DBP (mmHg):</label>
                <input
                  type="number"
                  disabled={readOnly}
                  value={formData.diastolic_bp}
                  onChange={(e) => handleChange('diastolic_bp', e.target.value)}
                  className={`w-full p-2 border rounded-md font-bold ${
                    formErrors.diastolic_bp ? 'border-red-500 bg-red-50/50 text-red-900' : 'border-slate-300'
                  }`}
                />
                {renderFieldError('diastolic_bp')}
                <ClinicalMetricBadge metricId="diastolic_bp" value={formData.diastolic_bp} />
              </div>
            </div>
          </div>
        </SectionCard>
      </div>

      {/* Risk Stratification- TIMI Risk score & Other Risk Factors */}
      <div id="section-3">
        <SectionCard title="Risk Stratification- TIMI Risk score: Points">
          <div className="space-y-4 text-xs">
            <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg flex justify-between items-center mb-4">
              <div>
                <span className="font-bold text-orange-950 block text-xs uppercase tracking-wide">Total Calculated TIMI Score</span>
                <span className="text-[10px] text-orange-800">Dynamic score calculation matching point weights</span>
              </div>
              <span className="text-3xl font-black text-orange-600 pr-4">{timiCalculatedScore} Points</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2 border border-slate-100 p-3 rounded-xl bg-white shadow-sm">
              {renderRadio('age_gt_75', 'Age >75 years (+3)', ['Yes', 'No'])}
              {renderRadio('age_65_to_74', 'Age 65 to 74 years (+2)', ['Yes', 'No'])}
              {renderRadio('history_dm_htn_angina', 'H/o DM/ HTN/ Angina (+1)', ['Yes', 'No'])}
              {renderRadio('sbp_lt_100', 'SBP < 100 mmHg (+3)', ['Yes', 'No'])}
              {renderRadio('heart_rate_gt_100', 'Heart Rate > 100/ min (+2)', ['Yes', 'No'])}
              {renderRadio('killip_class_ii_to_iv', 'Killip Class (+2)', ['No', 'I', 'II', 'III', 'IV'])}
              {renderRadio('anterior_mi_or_lbbb', 'Ant MI/ LBBB (+1)', ['Yes', 'No'])}
              {renderRadio('weight_lt_67kg', 'Weight < 67 kg (+1)', ['Yes', 'No'])}
              {renderRadio('reperfusion_gt_4hrs', 'Time to reperfusion > 4 hrs (+1)', ['Yes', 'No'])}
            </div>

            <div id="section-4" className="font-bold text-slate-800 border-t border-slate-200 pt-3 text-sm">Other Risk Factors:</div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
              {renderRadio('lvf', 'LVF', ['Yes', 'No'])}
              {renderRadio('vt_vf', 'VT/VF', ['Yes', 'No'])}
              {renderRadio('bbb_chb', 'BBB/CHB', ['Yes', 'No'])}
              {renderRadio('elevated_bnp', 'Elevated BNP', ['Yes', 'No'])}
              {renderRadio('elevated_crp', 'Elevated CRP', ['Yes', 'No'])}
            </div>
          </div>
        </SectionCard>
      </div>

      {/* Treatment Strategy */}
      <div id="section-5">
        <SectionCard title="Treatment Strategy">
          <div className="space-y-4 text-xs">
            <div className="flex gap-6 p-2 bg-white border border-slate-200 rounded-lg">
              <span className="font-bold text-slate-700 pt-1">Strategy:</span>
              {[
                { key: 'PAMI', label: 'PAMI' },
                { key: 'Thrombolysis', label: 'Thrombolysis' },
                { key: 'Conservative', label: 'Conservative' }
              ].map(op => (
                <label key={op.key} className="flex items-center gap-2 cursor-pointer font-bold">
                  <input
                    type="radio"
                    disabled={readOnly}
                    name="treatment_strategy"
                    checked={formData.treatment_strategy === op.key}
                    onChange={() => handleChange('treatment_strategy', op.key)}
                    className="text-red-600 focus:ring-red-500"
                  />
                  <span>{op.label}</span>
                </label>
              ))}
            </div>

            {/* PAMI details */}
            <div id="section-6" className="p-4 bg-white border border-slate-200 rounded-xl space-y-4">
              <div className="font-bold text-slate-800 text-sm">PAMI details, if done:</div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Door to Balloon Time (min):</label>
                  <input
                    type="number"
                    disabled={readOnly}
                    value={formData.door_to_balloon_time}
                    onChange={(e) => handleChange('door_to_balloon_time', e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded-md font-bold"
                  />
                  <ClinicalMetricBadge metricId="door_to_balloon_time" value={formData.door_to_balloon_time} />
                </div>
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="font-bold text-slate-700 block">Segment:</label>
                    {!readOnly && (
                      <span className={`text-[10px] select-none ${
                        Math.max(0, 100 - (formData.vessel_segment || '').length) <= 5
                          ? 'text-rose-500 font-bold animate-pulse'
                          : 'text-slate-400 font-medium'
                      }`}>
                        {Math.max(0, 100 - (formData.vessel_segment || '').length)} left
                      </span>
                    )}
                  </div>
                  <input
                    type="text"
                    disabled={readOnly}
                    value={formData.vessel_segment}
                    maxLength={100}
                    onChange={(e) => handleChange('vessel_segment', e.target.value)}
                    placeholder="e.g. Proximal LAD"
                    className="w-full p-2 border border-slate-300 rounded-md"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Thrombosuction:</label>
                  <div className="flex gap-4 mt-2">
                    {['Done', 'Not done'].map(opt => (
                      <label key={opt} className="flex items-center gap-2 cursor-pointer font-bold">
                        <input
                          type="radio"
                          disabled={readOnly}
                          name="thrombosuction_done"
                          checked={formData.thrombosuction_done === opt}
                          onChange={() => handleChange('thrombosuction_done', opt)}
                          className="text-red-600 focus:ring-red-500"
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
                    <label key={key} className="flex items-center gap-1.5 p-2 bg-white border rounded-lg cursor-pointer font-medium">
                      <input
                        type="checkbox"
                        disabled={readOnly}
                        checked={formData[key] || false}
                        onChange={(e) => handleChange(key, e.target.checked)}
                        className="rounded text-red-600 focus:ring-red-500"
                      />
                      <span>{label}</span>
                    </label>
                  ))}
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
                          disabled={readOnly}
                          name="stent_type"
                          checked={formData.stent_type === opt}
                          onChange={() => handleChange('stent_type', opt)}
                          className="text-red-600 focus:ring-red-500"
                        />
                        <span>{opt}</span>
                      </label>
                    ))}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Diameter (mm):</label>
                    <input
                      type="number"
                      step="0.1"
                      disabled={readOnly}
                      value={formData.stent_diameter}
                      onChange={(e) => handleChange('stent_diameter', e.target.value)}
                      placeholder="e.g. 3.5"
                      className="w-full p-2 border border-slate-300 rounded-md"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Length (mm):</label>
                    <input
                      type="number"
                      step="0.5"
                      disabled={readOnly}
                      value={formData.stent_length}
                      onChange={(e) => handleChange('stent_length', e.target.value)}
                      placeholder="e.g. 28"
                      className="w-full p-2 border border-slate-300 rounded-md"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-3 pt-2 border-t border-slate-100">
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
                            disabled={readOnly}
                            name="timi_flow"
                            checked={formData.timi_flow === grade}
                            onChange={() => handleChange('timi_flow', grade)}
                            className="text-red-600 focus:ring-red-500"
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
                          disabled={readOnly}
                          checked={formData[op.key] || false}
                          onChange={(e) => handleChange(op.key, e.target.checked)}
                          className="rounded text-red-600 focus:ring-red-500"
                        />
                        <span>{op.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Thrombolysis details */}
            <div id="section-7" className="p-4 bg-white border border-slate-200 rounded-xl space-y-4">
              <div className="font-bold text-slate-800 text-sm">Thrombolysis details</div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Door to Needle Time (min):</label>
                  <input
                    type="number"
                    disabled={readOnly}
                    value={formData.door_to_needle_time}
                    onChange={(e) => handleChange('door_to_needle_time', e.target.value)}
                    placeholder="e.g. 30"
                    className="w-full p-2 border border-slate-300 rounded-md font-bold"
                  />
                  <ClinicalMetricBadge metricId="door_to_needle_time" value={formData.door_to_needle_time} />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Drug:</label>
                  <div className="flex flex-wrap gap-3 mt-2">
                    {[
                      { key: 'drug_stk', label: 'STK' },
                      { key: 'drug_tenecteplase', label: 'Tenecteplase' },
                      { key: 'drug_uk', label: 'UK' },
                      { key: 'drug_reteplase', label: 'Reteplase' }
                    ].map(op => (
                      <label key={op.key} className="flex items-center gap-1.5 cursor-pointer font-bold">
                        <input
                          type="checkbox"
                          disabled={readOnly}
                          checked={formData[op.key] === 'Yes' || formData[op.key] === true}
                          onChange={(e) => handleChange(op.key, e.target.checked ? 'Yes' : 'No')}
                          className="rounded text-red-600 focus:ring-red-500"
                        />
                        <span>{op.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="font-bold text-slate-700 block">Dose:</label>
                    {!readOnly && (
                      <span className={`text-[10px] select-none ${
                        Math.max(0, 100 - (formData.thrombolysis_dose || '').length) <= 5
                          ? 'text-rose-500 font-bold animate-pulse'
                          : 'text-slate-400 font-medium'
                      }`}>
                        {Math.max(0, 100 - (formData.thrombolysis_dose || '').length)} left
                      </span>
                    )}
                  </div>
                  <input
                    type="text"
                    disabled={readOnly}
                    value={formData.thrombolysis_dose}
                    maxLength={100}
                    onChange={(e) => handleChange('thrombolysis_dose', e.target.value)}
                    placeholder="e.g. 40 mg IV bolus"
                    className="w-full p-2 border border-slate-300 rounded-md"
                  />
                </div>
              </div>
            </div>

            <div id="section-8" className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 border-t border-slate-100">
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
                        disabled={readOnly}
                        name="heparin_strategy"
                        checked={formData.heparin_strategy === op}
                        onChange={() => handleChange('heparin_strategy', op)}
                        className="text-red-600 focus:ring-red-500"
                      />
                      <span>{op}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-1">Statin:</label>
                {renderRadio('statin', 'Statin Prescribed', ['Yes', 'No'])}
                {formData.statin === 'Yes' && (
                  <div className="flex gap-3 mt-2 pl-2">
                    <span className="font-bold text-slate-500">Dose:</span>
                    {['10 mg', '20 mg', '40 mg', '80 mg'].map(dose => (
                      <label key={dose} className="flex items-center gap-1">
                        <input
                          type="radio"
                          disabled={readOnly}
                          name="statin_dose"
                          checked={formData.statin_dose === dose}
                          onChange={() => handleChange('statin_dose', dose)}
                          className="text-red-600 focus:ring-red-500"
                        />
                        <span>{dose}</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="font-bold text-slate-700 block">Any Other</label>
                  {!readOnly && (
                    <span className={`text-[10px] select-none ${
                      Math.max(0, 255 - (formData.other_drugs || '').length) <= 5
                        ? 'text-rose-500 font-bold animate-pulse'
                        : 'text-slate-400 font-medium'
                    }`}>
                      {Math.max(0, 255 - (formData.other_drugs || '').length)} left
                    </span>
                  )}
                </div>
                <input
                  type="text"
                  disabled={readOnly}
                  value={formData.other_drugs}
                  maxLength={255}
                  onChange={(e) => handleChange('other_drugs', e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded-md"
                />
              </div>
            </div>
          </div>
        </SectionCard>
      </div>

      {/* Diagnostic Procedures */}
      <div id="section-9">
        <SectionCard title="Diagnostic Procedures">
          <div className="space-y-4 text-xs">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {renderRadio('bedside_echo', 'Bed-side echo', ['Yes', 'No'])}
              {renderRadio('departmental_echo', 'Departmental echo', ['Yes', 'No'])}
              {renderRadio('stress_testing', 'Stress Testing', ['Yes', 'No'])}
              {renderRadio('lipid_profile', 'Lipid profile', ['Yes', 'No'])}
              {renderRadio('bnp', 'BNP', ['Yes', 'No'])}
              {renderRadio('crp', 'CRP', ['Yes', 'No'])}
              {renderRadio('troponin_test', 'Trop-T / I', ['Yes', 'No'])}
              {renderRadio('cpk_ckmb', 'CPK/ CPK-MB', ['Yes', 'No'])}
              {renderRadio('rft', 'RFT', ['Yes', 'No'])}
              {renderRadio('lft', 'LFT', ['Yes', 'No'])}
              {renderRadio('electrolytes', 'Electrolytes', ['Yes', 'No'])}
              {renderRadio('hemogram', 'Hemogram', ['Yes', 'No'])}
              {renderRadio('cxr', 'CXR', ['Yes', 'No'])}
            </div>
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="font-bold text-slate-700 block">Others</label>
                {!readOnly && (
                  <span className={`text-[10px] select-none ${
                    Math.max(0, 255 - (formData.diagnostic_other || '').length) <= 5
                      ? 'text-rose-500 font-bold animate-pulse'
                      : 'text-slate-400 font-medium'
                  }`}>
                    {Math.max(0, 255 - (formData.diagnostic_other || '').length)} left
                  </span>
                )}
              </div>
              <input
                type="text"
                disabled={readOnly}
                value={formData.diagnostic_other}
                maxLength={255}
                onChange={(e) => handleChange('diagnostic_other', e.target.value)}
                className="w-full p-2 border border-slate-300 rounded-md"
              />
            </div>

            <div id="section-10" className="space-y-4 pt-2">
              <div className="font-bold text-slate-800 border-t border-slate-200 pt-3 text-sm">Reports:</div>

              {/* ECG */}
              <div className="p-4 bg-white border border-slate-200 rounded-xl space-y-4">
                <span className="font-bold text-slate-800 text-xs block border-b pb-1">ECG:</span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">HR (bpm):</label>
                    <input
                      type="number"
                      disabled={readOnly}
                      value={formData.ecg_heart_rate}
                      onChange={(e) => handleChange('ecg_heart_rate', e.target.value)}
                      className="w-full p-2 border border-slate-300 rounded-md font-bold"
                    />
                    <ClinicalMetricBadge metricId="ecg_heart_rate" value={formData.ecg_heart_rate} />
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">AV Block:</label>
                    <div className="flex flex-wrap gap-3 mt-1.5">
                      {['None', '1-degree', '2-degree', 'CHB'].map(opt => (
                        <label key={opt} className="flex items-center gap-1.5 cursor-pointer font-semibold">
                          <input
                            type="radio"
                            disabled={readOnly}
                            name="av_block"
                            checked={formData.av_block === opt}
                            onChange={() => handleChange('av_block', opt)}
                            className="text-red-600 focus:ring-red-500"
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
                        <label key={opt} className="flex items-center gap-1.5 cursor-pointer font-semibold">
                          <input
                            type="radio"
                            disabled={readOnly}
                            name="bbb"
                            checked={formData.bbb === opt}
                            onChange={() => handleChange('bbb', opt)}
                            className="text-red-600 focus:ring-red-500"
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
                          <label key={loc} className="flex items-center gap-1 cursor-pointer">
                            <input
                              type="checkbox"
                              disabled={readOnly}
                              checked={formData[key] || false}
                              onChange={(e) => handleChange(key, e.target.checked)}
                              className="rounded text-red-600 focus:ring-red-500"
                            />
                            <span className="text-[10px] font-medium">{loc}</span>
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
                          <label key={loc} className="flex items-center gap-1 cursor-pointer">
                            <input
                              type="checkbox"
                              disabled={readOnly}
                              checked={formData[key] || false}
                              onChange={(e) => handleChange(key, e.target.checked)}
                              className="rounded text-red-600 focus:ring-red-500"
                            />
                            <span className="text-[10px] font-medium">{loc}</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">T inversion:</label>
                    <div className="grid grid-cols-2 gap-1.5 mt-1">
                      {['None', 'Inferior', 'Antero-septal', 'Anterior', 'Anterolateral', 'Lateral'].map(loc => {
                        const key = `t_inversion_${loc.toLowerCase().replace('-', '')}`;
                        return (
                          <label key={loc} className="flex items-center gap-1 cursor-pointer">
                            <input
                              type="checkbox"
                              disabled={readOnly}
                              checked={formData[key] || false}
                              onChange={(e) => handleChange(key, e.target.checked)}
                              className="rounded text-red-600 focus:ring-red-500"
                            />
                            <span className="text-[10px] font-medium">{loc}</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Rhythm:</label>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {['NSR', 'AF', 'SVT', 'VT', 'VF'].map(r => (
                        <label key={r} className="flex items-center gap-1 cursor-pointer font-bold">
                          <input
                            type="radio"
                            disabled={readOnly}
                            name="rhythm"
                            checked={formData.rhythm === r}
                            onChange={() => handleChange('rhythm', r)}
                            className="text-red-600 focus:ring-red-500"
                          />
                          <span>{r}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="font-bold text-slate-700 block">Others (ECG):</label>
                    {!readOnly && (
                      <span className={`text-[10px] select-none ${
                        Math.max(0, 255 - (formData.ecg_other || '').length) <= 5
                          ? 'text-rose-500 font-bold animate-pulse'
                          : 'text-slate-400 font-medium'
                      }`}>
                        {Math.max(0, 255 - (formData.ecg_other || '').length)} left
                      </span>
                    )}
                  </div>
                  <input
                    type="text"
                    disabled={readOnly}
                    value={formData.ecg_other || ''}
                    maxLength={255}
                    onChange={(e) => handleChange('ecg_other', e.target.value.slice(0, 255))}
                    placeholder="Specify other ECG findings..."
                    className="w-full p-2 border border-slate-300 rounded-md"
                  />
                </div>
              </div>

              {/* Echo */}
              <div className="p-4 bg-white border border-slate-200 rounded-xl space-y-4">
                <span className="font-bold text-slate-800 text-xs block border-b pb-1">Echo:</span>
                <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">EF (%):</label>
                    <input
                      type="number"
                      disabled={readOnly}
                      value={formData.echo_ef}
                      onChange={(e) => handleChange('echo_ef', e.target.value)}
                      className="w-full p-2 border border-slate-300 rounded-md font-bold text-slate-900"
                    />
                    <ClinicalMetricBadge metricId="echo_ef" value={formData.echo_ef} />
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">LV Function:</label>
                    <div className="flex flex-wrap gap-3 mt-1.5">
                      {['Normal', 'Mild LVD', 'Moderate LVD', 'Severe LVD'].map(opt => (
                        <label key={opt} className="flex items-center gap-1 cursor-pointer font-medium">
                          <input
                            type="radio"
                            disabled={readOnly}
                            name="lv_function"
                            checked={formData.lv_function === opt}
                            onChange={() => handleChange('lv_function', opt)}
                            className="text-red-600 focus:ring-red-500"
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
                          <label key={opt} className="flex items-center gap-1 cursor-pointer font-medium">
                            <input
                              type="checkbox"
                              disabled={readOnly}
                              checked={formData[key] || false}
                              onChange={(e) => handleChange(key, e.target.checked)}
                              className="rounded text-red-600 focus:ring-red-500"
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
                      {['None', 'Mild', 'Moderate', 'Severe'].map(opt => (
                        <label key={opt} className="flex items-center gap-1 cursor-pointer font-medium">
                          <input
                            type="radio"
                            disabled={readOnly}
                            name="mr_grade"
                            checked={formData.mr_grade === opt}
                            onChange={() => handleChange('mr_grade', opt)}
                            className="text-red-600 focus:ring-red-500"
                          />
                          <span>{opt}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">E (m/s):</label>
                    <input
                      type="number"
                      step="0.01"
                      disabled={readOnly}
                      value={formData.echo_e}
                      onChange={(e) => handleChange('echo_e', e.target.value)}
                      className="w-full p-2 border border-slate-300 rounded-md"
                    />
                    <ClinicalMetricBadge metricId="echo_e" value={formData.echo_e} />
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">A (m/s):</label>
                    <input
                      type="number"
                      step="0.01"
                      disabled={readOnly}
                      value={formData.echo_a}
                      onChange={(e) => handleChange('echo_a', e.target.value)}
                      className="w-full p-2 border border-slate-300 rounded-md"
                    />
                    <ClinicalMetricBadge metricId="echo_a" value={formData.echo_a} />
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">DT (ms):</label>
                    <input
                      type="number"
                      disabled={readOnly}
                      value={formData.echo_dt}
                      onChange={(e) => handleChange('echo_dt', e.target.value)}
                      className="w-full p-2 border border-slate-300 rounded-md"
                    />
                    <ClinicalMetricBadge metricId="echo_dt" value={formData.echo_dt} />
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">E' (cm/s):</label>
                    <input
                      type="number"
                      step="0.1"
                      disabled={readOnly}
                      value={formData.echo_e_prime}
                      onChange={(e) => handleChange('echo_e_prime', e.target.value)}
                      className="w-full p-2 border border-slate-300 rounded-md"
                    />
                    <ClinicalMetricBadge metricId="echo_e_prime" value={formData.echo_e_prime} />
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">TAPSV (mm):</label>
                    <input
                      type="number"
                      step="0.1"
                      disabled={readOnly}
                      value={formData.echo_tapsv}
                      onChange={(e) => handleChange('echo_tapsv', e.target.value)}
                      className="w-full p-2 border border-slate-300 rounded-md"
                    />
                    <ClinicalMetricBadge metricId="echo_tapsv" value={formData.echo_tapsv} />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="font-bold text-slate-700 block">Others (Echo):</label>
                    {!readOnly && (
                      <span className={`text-[10px] select-none ${
                        Math.max(0, 255 - (formData.echo_other || '').length) <= 5
                          ? 'text-rose-500 font-bold animate-pulse'
                          : 'text-slate-400 font-medium'
                      }`}>
                        {Math.max(0, 255 - (formData.echo_other || '').length)} left
                      </span>
                    )}
                  </div>
                  <input
                    type="text"
                    disabled={readOnly}
                    value={formData.echo_other || ''}
                    maxLength={255}
                    onChange={(e) => handleChange('echo_other', e.target.value.slice(0, 255))}
                    placeholder="e.g. Mild TR, PASP 35 mmHg"
                    className="w-full p-2 border border-slate-300 rounded-md"
                  />
                </div>
              </div>

              {/* Blood Investigations */}
              <div className="p-4 bg-white border border-slate-200 rounded-xl space-y-4">
                <span className="font-bold text-slate-800 text-xs block border-b pb-1">Blood Investigations:</span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Hemoglobin (gm%):</label>
                    <input
                      type="number"
                      step="0.1"
                      disabled={readOnly}
                      value={formData.hemoglobin}
                      onChange={(e) => handleChange('hemoglobin', e.target.value)}
                      className="w-full p-2 border border-slate-300 rounded-md font-bold"
                    />
                    <ClinicalMetricBadge metricId="hemoglobin" value={formData.hemoglobin} />
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Creat (mg/dl):</label>
                    <input
                      type="number"
                      step="0.01"
                      disabled={readOnly}
                      value={formData.creatinine}
                      onChange={(e) => handleChange('creatinine', e.target.value)}
                      className="w-full p-2 border border-slate-300 rounded-md font-bold"
                    />
                    <ClinicalMetricBadge metricId="creatinine" value={formData.creatinine} />
                  </div>
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="font-bold text-slate-700 block">Trop-I (ng/ml):</label>
                      {!readOnly && (
                        <span className={`text-[10px] select-none ${
                          Math.max(0, 50 - (formData.troponin_i || '').length) <= 5
                            ? 'text-rose-500 font-bold animate-pulse'
                            : 'text-slate-400 font-medium'
                        }`}>
                          {Math.max(0, 50 - (formData.troponin_i || '').length)} left
                        </span>
                      )}
                    </div>
                    <input
                      type="text"
                      disabled={readOnly}
                      value={formData.troponin_i || ''}
                      maxLength={50}
                      onChange={(e) => handleChange('troponin_i', e.target.value.slice(0, 50))}
                      className="w-full p-2 border border-slate-300 rounded-md"
                    />
                    <ClinicalMetricBadge metricId="troponin_i" value={formData.troponin_i} />
                  </div>
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="font-bold text-slate-700 block">CPK (U/L):</label>
                      {!readOnly && (
                        <span className={`text-[10px] select-none ${
                          Math.max(0, 50 - (formData.cpk || '').length) <= 5
                            ? 'text-rose-500 font-bold animate-pulse'
                            : 'text-slate-400 font-medium'
                        }`}>
                          {Math.max(0, 50 - (formData.cpk || '').length)} left
                        </span>
                      )}
                    </div>
                    <input
                      type="text"
                      disabled={readOnly}
                      value={formData.cpk || ''}
                      maxLength={50}
                      onChange={(e) => handleChange('cpk', e.target.value.slice(0, 50))}
                      className="w-full p-2 border border-slate-300 rounded-md"
                    />
                    <ClinicalMetricBadge metricId="cpk" value={formData.cpk} />
                  </div>
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="font-bold text-slate-700 block">CK-MB (U/L):</label>
                      {!readOnly && (
                        <span className={`text-[10px] select-none ${
                          Math.max(0, 50 - (formData.ck_mb || '').length) <= 5
                            ? 'text-rose-500 font-bold animate-pulse'
                            : 'text-slate-400 font-medium'
                        }`}>
                          {Math.max(0, 50 - (formData.ck_mb || '').length)} left
                        </span>
                      )}
                    </div>
                    <input
                      type="text"
                      disabled={readOnly}
                      value={formData.ck_mb || ''}
                      maxLength={50}
                      onChange={(e) => handleChange('ck_mb', e.target.value.slice(0, 50))}
                      className="w-full p-2 border border-slate-300 rounded-md"
                    />
                    <ClinicalMetricBadge metricId="ck_mb" value={formData.ck_mb} />
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Na (mEq/L):</label>
                    <input
                      type="number"
                      step="0.1"
                      disabled={readOnly}
                      value={formData.sodium}
                      onChange={(e) => handleChange('sodium', e.target.value)}
                      className="w-full p-2 border border-slate-300 rounded-md"
                    />
                    <ClinicalMetricBadge metricId="sodium" value={formData.sodium} />
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">K (mEq/L):</label>
                    <input
                      type="number"
                      step="0.1"
                      disabled={readOnly}
                      value={formData.potassium}
                      onChange={(e) => handleChange('potassium', e.target.value)}
                      className="w-full p-2 border border-slate-300 rounded-md"
                    />
                    <ClinicalMetricBadge metricId="potassium" value={formData.potassium} />
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">RBS at admission (mg/dl):</label>
                    <input
                      type="number"
                      disabled={readOnly}
                      value={formData.rbs_admission}
                      onChange={(e) => handleChange('rbs_admission', e.target.value)}
                      className="w-full p-2 border border-slate-300 rounded-md"
                    />
                    <ClinicalMetricBadge metricId="rbs_admission" value={formData.rbs_admission} />
                  </div>
                </div>
              </div>

              {/* Coronary Angiogram */}
              <div className="p-4 bg-white border border-slate-200 rounded-xl space-y-4">
                <span className="font-bold text-slate-800 text-xs block border-b pb-1">Coronary Angiogram:</span>
                <div className="flex flex-wrap items-center gap-6">
                  <div className="flex gap-4 p-2 bg-white border rounded-lg">
                    {['Done', 'Not done'].map(opt => (
                      <label key={opt} className="flex items-center gap-2 cursor-pointer font-bold">
                        <input
                          type="radio"
                          disabled={readOnly}
                          name="angiogram_done"
                          checked={formData.angiogram_done === (opt === 'Done' ? 'Yes' : 'No')}
                          onChange={() => handleChange('angiogram_done', opt === 'Done' ? 'Yes' : 'No')}
                          className="text-red-600 focus:ring-red-500"
                        />
                        <span>{opt}</span>
                      </label>
                    ))}
                  </div>

                  {formData.angiogram_done === 'Yes' && (
                    <div className="flex flex-wrap items-center gap-3 animate-fadeIn">
                      <span className="font-bold text-slate-500">If done:</span>
                      {['Normal', '1VD', '2VD', '3VD', 'LMCA'].map(opt => (
                        <label key={opt} className="flex items-center gap-1.5 p-2 bg-white border rounded-lg cursor-pointer font-medium">
                          <input
                            type="radio"
                            disabled={readOnly}
                            name="angiogram_finding"
                            checked={formData.angiogram_finding === opt}
                            onChange={() => handleChange('angiogram_finding', opt)}
                            className="text-red-600 focus:ring-red-500"
                          />
                          <span>{opt}</span>
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div id="section-11" className="font-bold text-slate-800 border-t border-slate-200 pt-3 text-sm">Invasive Procedures:</div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
              {renderRadio('cag', 'CAG', ['Yes', 'No'])}
              {renderRadio('iabp', 'IABP', ['Yes', 'No'])}
              {renderRadio('invasive_ventilation', 'Invasive Ventilation', ['Yes', 'No'])}
              {renderRadio('ptca', 'PTCA', ['Yes', 'No'])}
              {renderRadio('cabg', 'CABG', ['Yes', 'No'])}
            </div>
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="font-bold text-slate-700 block">Other</label>
                {!readOnly && (
                  <span className={`text-[10px] select-none ${
                    Math.max(0, 255 - (formData.other_procedure || '').length) <= 5
                      ? 'text-rose-500 font-bold animate-pulse'
                      : 'text-slate-400 font-medium'
                  }`}>
                    {Math.max(0, 255 - (formData.other_procedure || '').length)} left
                  </span>
                )}
              </div>
              <input
                type="text"
                disabled={readOnly}
                value={formData.other_procedure}
                maxLength={255}
                onChange={(e) => handleChange('other_procedure', e.target.value)}
                className="w-full p-2 border border-slate-300 rounded-md"
              />
            </div>
          </div>
        </SectionCard>
      </div>

      {/* Out-comes */}
      <div id="section-12">
        <SectionCard title="Out-comes">
          <div className="space-y-4 text-xs">
            <div className="font-bold text-slate-800 text-sm">Clinical:</div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 border p-3 rounded-xl bg-white shadow-sm">
              {renderRadio('death', 'Death', ['Yes', 'No'])}
              {renderRadio('stemi_for_nonstemi', 'STEMI for NONSTEMI subjects', ['Yes', 'No'])}
              {renderRadio('remi_for_stemi', 'Re-MI for STEMI subjects', ['Yes', 'No'])}
              {renderRadio('revascularization_recurrent_ischemia', 'Revascularization for recurrent ischemia', ['Yes', 'No'])}
              {renderRadio('cva_thrombotic', 'CVA-thrombotic', ['Yes', 'No'])}
              {renderRadio('cva_hemorrhagic', 'CVA-hemorrhagic', ['Yes', 'No'])}
              {renderRadio('major_bleeding', 'Major Bleeding', ['Yes', 'No'])}
            </div>
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="font-bold text-slate-700 block">Any other</label>
                {!readOnly && (
                  <span className={`text-[10px] select-none ${
                    Math.max(0, 255 - (formData.outcome_other || '').length) <= 5
                      ? 'text-rose-500 font-bold animate-pulse'
                      : 'text-slate-400 font-medium'
                  }`}>
                    {Math.max(0, 255 - (formData.outcome_other || '').length)} left
                  </span>
                )}
              </div>
              <input
                type="text"
                disabled={readOnly}
                value={formData.outcome_other}
                maxLength={255}
                onChange={(e) => handleChange('outcome_other', e.target.value)}
                className="w-full p-2 border border-slate-300 rounded-md"
              />
            </div>

            <div id="section-13" className="font-bold text-slate-800 border-t border-slate-200 pt-3 text-sm">Discharge Medications:</div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {renderRadio('discharge_beta_blocker', 'Beta-blocker', ['Yes', 'No'])}
              {renderRadio('discharge_calcium_channel_blocker', 'Calcium-channel blocker', ['Yes', 'No'])}
              {renderRadio('discharge_nitrate', 'Nitrate', ['Yes', 'No'])}
              {renderRadio('discharge_nicorandil', 'Nicorandil', ['Yes', 'No'])}
              {renderRadio('discharge_ivabradine', 'Ivabradine', ['Yes', 'No'])}
              {renderRadio('discharge_ranolazine', 'Ranozolidine', ['Yes', 'No'])}
              {renderRadio('discharge_trimetazidine', 'Trimetazidine', ['Yes', 'No'])}
              {renderRadio('discharge_aspirin', 'Aspirin', ['Yes', 'No'])}
              {renderRadio('discharge_clopidogrel', 'Clopidogrel', ['Yes', 'No'])}
              {renderRadio('discharge_prasugrel', 'Prasugrel', ['Yes', 'No'])}
              {renderRadio('discharge_ticagrelor', 'Ticagrelor', ['Yes', 'No'])}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t pt-2">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Statin:</label>
                {renderRadio('discharge_statin', 'Statin Prescribed', ['Yes', 'No'])}
                {formData.discharge_statin === 'Yes' && (
                  <div className="flex gap-3 mt-2 pl-2">
                    <span className="font-bold text-slate-500">Dose:</span>
                    {['10 mg', '20 mg', '40 mg', '80 mg'].map(dose => (
                      <label key={dose} className="flex items-center gap-1 cursor-pointer">
                        <input
                          type="radio"
                          disabled={readOnly}
                          name="discharge_statin_dose"
                          checked={formData.discharge_statin_dose === dose}
                          onChange={() => handleChange('discharge_statin_dose', dose)}
                          className="text-red-600 focus:ring-red-500"
                        />
                        <span>{dose}</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="font-bold text-slate-700 block">Any Other</label>
                  {!readOnly && (
                    <span className={`text-[10px] select-none ${
                      Math.max(0, 255 - (formData.discharge_other_medication || '').length) <= 5
                        ? 'text-rose-500 font-bold animate-pulse'
                        : 'text-slate-400 font-medium'
                    }`}>
                      {Math.max(0, 255 - (formData.discharge_other_medication || '').length)} left
                    </span>
                  )}
                </div>
                <input
                  type="text"
                  disabled={readOnly}
                  value={formData.discharge_other_medication}
                  maxLength={255}
                  onChange={(e) => handleChange('discharge_other_medication', e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded-md"
                />
              </div>
            </div>
          </div>
        </SectionCard>
      </div>

      {/* Appropriateness Assessment */}
      <div id="section-14">
        <SectionCard title="Appropriateness Assessment">
          <div className="space-y-6 text-xs">
            <div>
              <div className="font-bold text-slate-800 text-xs mb-3 uppercase tracking-wide">Appropriateness for various procedures</div>
              <div className="grid grid-cols-1 gap-3 text-xs w-full">
                {proceduresList.map(item => renderAppropriatenessRadio(item.key, item.label, item.specifyKey))}
              </div>
            </div>

            <div id="section-15" className="pt-4 border-t border-slate-200">
              <div className="font-bold text-slate-800 text-xs mb-3 uppercase tracking-wide">Appropriateness for various investigations</div>
              <div className="grid grid-cols-1 gap-3 text-xs w-full">
                {investigationsList.map(item => renderAppropriatenessRadio(item.key, item.label, item.specifyKey))}
              </div>
            </div>

            <div id="section-16" className="pt-4 border-t border-slate-200">
              <div className="font-bold text-slate-800 text-xs mb-3 uppercase tracking-wide">Appropriateness for various drugs</div>
              <div className="grid grid-cols-1 gap-3 text-xs w-full">
                {drugsList.map(item => renderAppropriatenessRadio(item.key, item.label, item.specifyKey))}
              </div>
            </div>
          </div>
        </SectionCard>
      </div>

      {/* Hospitalization Details */}
      <div id="section-17">
        <SectionCard title="Hospitalization Details">
          <div className="space-y-4 text-xs">
            <div className="font-bold text-slate-800">Length of Stay:</div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div>
                <label className="font-bold text-slate-700 block mb-1">ICCU</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    disabled={readOnly}
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
                    disabled={readOnly}
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
                    disabled={readOnly}
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

            <div id="section-18" className="font-bold text-slate-800 border-t pt-3">Cost of care:</div>
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-3">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Bed charges</label>
                <input
                  type="number"
                  disabled={readOnly}
                  value={formData.bed_charges}
                  onChange={(e) => handleChange('bed_charges', e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded-md"
                />
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-1">Drugs & Disposables</label>
                <input
                  type="number"
                  disabled={readOnly}
                  value={formData.drugs_disposables_cost}
                  onChange={(e) => handleChange('drugs_disposables_cost', e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded-md"
                />
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-1">Packages</label>
                <input
                  type="number"
                  disabled={readOnly}
                  value={formData.package_cost}
                  onChange={(e) => handleChange('package_cost', e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded-md font-bold text-slate-900 bg-white"
                />
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-1">Lab Investigations</label>
                <input
                  type="number"
                  disabled={readOnly}
                  value={formData.laboratory_cost}
                  onChange={(e) => handleChange('laboratory_cost', e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded-md"
                />
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-1">Non-invasive labs</label>
                <input
                  type="number"
                  disabled={readOnly}
                  value={formData.non_invasive_lab_cost}
                  onChange={(e) => handleChange('non_invasive_lab_cost', e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded-md"
                />
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-1">Consults</label>
                <input
                  type="number"
                  disabled={readOnly}
                  value={formData.consultation_cost}
                  onChange={(e) => handleChange('consultation_cost', e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded-md"
                />
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-1">Radiology</label>
                <input
                  type="number"
                  disabled={readOnly}
                  value={formData.radiology_cost}
                  onChange={(e) => handleChange('radiology_cost', e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded-md"
                />
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-1">Miscellaneous</label>
                <input
                  type="number"
                  disabled={readOnly}
                  value={formData.miscellaneous_cost}
                  onChange={(e) => handleChange('miscellaneous_cost', e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded-md"
                />
              </div>
              <div className="col-span-2 p-3 bg-teal-50 border border-teal-200 rounded-lg flex flex-col justify-center items-center">
                <span className="font-bold text-teal-900 uppercase text-[10px] tracking-wider">Total:</span>
                <span className="text-xl font-extrabold text-teal-700">₹ {formData.total_cost !== '' ? formData.total_cost : (autoSumCost !== null ? autoSumCost : '0')}</span>
              </div>
            </div>
          </div>
        </SectionCard>
      </div>

      {/* Follow-up Matrix Grid & Instructions */}
      <div id="section-19">
        <SectionCard title="Follow-up Matrix">
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
                          value={formData[`other_${t}`] || ''}
                          maxLength={255}
                          onChange={(e) => handleChange(`other_${t}`, e.target.value.slice(0, 255))}
                          className="p-1 border border-slate-300 rounded w-24 text-center text-xs"
                          placeholder="Specify..."
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
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {['In-Person', 'Phone Check-in'].map((mode) => (
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
