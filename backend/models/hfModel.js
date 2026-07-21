const db = require("../config/db");

// Helpers to execute inserts using a connection (to participate in transaction)

async function insertHfRegistry(conn, { patient_id, hf_registry_no }) {
    const query = `
        INSERT INTO hf_registry (patient_id, hf_registry_no)
        VALUES (?, ?)
    `;
    const [result] = await conn.execute(query, [patient_id, hf_registry_no]);
    return result.insertId;
}

async function insertHfAdministrative(conn, data) {
    const keys = [
        'hf_id', 'assessed_by', 'assessment_date', 'care_mr_no', 'visit_type',
        'address', 'education_level', 'monthly_income', 'occupation', 'caregiver_name',
        'caregiver_relationship', 'caregiver_phone', 'insurance_mode', 'visit_date', 'discharge_date',
        'treating_cardiologist', 'referring_doctor', 'referred_from', 'present_diagnosis', 'myocardial_ischemia',
        'atrial_fibrillation', 'bradyarrhythmia', 'ventricular_tachycardia', 'uncontrolled_hypertension', 'infection',
        'renal_failure', 'anaemia', 'medication_non_adherence', 'excessive_salt_intake', 'excessive_water_ingestion',
        'progressive_worsening', 'precipitating_other', 'other_admission_reason', 'hospitalization_days'
    ];
    const placeholders = keys.map(() => '?').join(', ');
    const query = `
        INSERT INTO hf_administrative (${keys.join(', ')})
        VALUES (${placeholders})
    `;
    const values = keys.map(k => data[k] === undefined ? null : data[k]);
    const [result] = await conn.execute(query, values);
    return result;
}

async function insertHfInitialAssessment(conn, data) {
    const keys = [
        'hf_id', 'assessed_by', 'assessment_date', 'previous_diagnosis', 'history_cabg',
        'history_ptca', 'history_stroke', 'history_major_bleed', 'history_thrombolysis', 'history_past_mi',
        'past_mi_years_ago', 'past_mi_location', 'history_other', 'previous_hf_hospitalization', 'recent_hospitalization_dates',
        'recent_hospitalization_reasons', 'documented_vt_vf', 'documented_pvcs', 'complaints_syncope_presyncope', 'pvc_count',
        'pvc_frequency', 'documented_nsvt', 'nsvt_frequency', 'weight', 'unable_to_weigh',
        'unable_to_weigh_reason', 'height', 'bmi', 'heart_rate', 'heart_rate_regular',
        'heart_rate_irregular', 'respiratory_rate', 'oxygen_saturation', 'systolic_bp_sitting', 'diastolic_bp_sitting',
        'systolic_bp_standing', 'diastolic_bp_standing', 'mental_status_alert_oriented', 'mental_status_confused', 'mental_status_drowsy',
        'dyspnea_at_rest', 'dyspnea_with_exertion', 'fatigue', 'orthopnea', 'loss_of_appetite_bloating',
        'decreased_exercise_tolerance', 'weight_gain', 'weight_loss', 'syncope', 'pnd',
        'muscle_cramps', 'wheeze', 'giddiness', 'symptom_other', 'symptom_other_details',
        'peripheral_edema', 'ascites', 'rales', 'jugular_venous_pressure', 'hepatomegaly',
        'clinical_sign_other', 'clinical_sign_other_details'
    ];
    const placeholders = keys.map(() => '?').join(', ');
    const query = `
        INSERT INTO hf_initial_assessment (${keys.join(', ')})
        VALUES (${placeholders})
    `;
    const values = keys.map(k => data[k] === undefined ? null : data[k]);
    const [result] = await conn.execute(query, values);
    return result;
}

async function insertHfFinalClinicalAssessment(conn, data) {
    const keys = [
        'hf_id', 'hfref', 'hfpef', 'etiology_ischemic', 'etiology_toxic',
        'etiology_idiopathic', 'etiology_hypertrophic', 'etiology_restrictive', 'etiology_valvular_rheumatic', 'etiology_hypertensive',
        'etiology_tachycardia_induced', 'etiology_metabolic_disease', 'etiology_hiv_viral_cardiomyopathy', 'etiology_inflammatory_cardiomyopathy', 'etiology_reduced_ef_previous_mi',
        'etiology_pregnancy', 'etiology_thyroid_disease', 'etiology_pheochromocytoma', 'etiology_chronic_renal_disease', 'etiology_cor_pulmonale_copd',
        'etiology_pulmonary_hypertension', 'etiology_other', 'etiology_other_details', 'cad', 'renal_failure',
        'diabetes_mellitus', 'hypertension', 'valvular_disease', 'asthma', 'copd',
        'osa', 'anemia', 'cva', 'severe_musculoskeletal_disease', 'cancer',
        'apd', 'bleeding_diathesis', 'pvd', 'comorbidity_other', 'comorbidity_other_details',
        'smoking', 'alcohol', 'risk_factor_other', 'risk_factor_other_details', 'stage_a',
        'stage_b', 'stage_c', 'stage_d', 'nyha_class_1', 'nyha_class_2',
        'nyha_class_3', 'nyha_class_4', 'af_permanent', 'af_paroxysmal', 'af_persistent',
        'af_nsr', 'mace_hospitalization', 'mace_stroke', 'mace_major_bleed', 'mace_severe_arrhythmia',
        'mace_major_procedure', 'mace_other', 'mace_other_details', 'mace_death', 'death_date',
        'death_home', 'death_hospital', 'death_reason', 'hosp_note', 'stroke_note', 'bleed_note', 'arrhythmia_note', 'procedure_note', 'other_note', 'death_note'
    ];
    const placeholders = keys.map(() => '?').join(', ');
    const query = `
        INSERT INTO hf_final_clinical_assessment (${keys.join(', ')})
        VALUES (${placeholders})
    `;
    const values = keys.map(k => data[k] === undefined ? null : data[k]);
    const [result] = await conn.execute(query, values);
    return result;
}

async function insertHfMedicalTherapyPart1(conn, data) {
    const keys = [
        'hf_id', 'recommended_consults', 'drug_intolerance_contraindications', 'carvedilol', 'carvedilol_dose',
        'bisoprolol', 'bisoprolol_dose', 'metoprolol_succinate', 'metoprolol_succinate_dose', 'nebivolol',
        'nebivolol_dose', 'beta_blocker_other', 'beta_blocker_other_name', 'beta_blocker_other_dose', 'beta_not_used_bradycardia',
        'beta_not_used_heart_blocks', 'beta_not_used_copd_asthma', 'beta_not_used_hypotension', 'beta_not_used_other', 'beta_not_used_other_reason',
        'enalapril', 'enalapril_dose', 'ramipril', 'ramipril_dose', 'lisinopril',
        'lisinopril_dose', 'perindopril', 'perindopril_dose', 'ace_other', 'ace_other_name',
        'ace_other_dose', 'ace_not_used_elevated_creatinine', 'ace_not_used_hyperkalemia', 'ace_not_used_cough', 'ace_not_used_hypotension',
        'ace_not_used_other', 'ace_not_used_other_reason', 'valsartan', 'valsartan_dose', 'losartan',
        'losartan_dose', 'telmisartan', 'telmisartan_dose', 'olmesartan', 'olmesartan_dose',
        'arb_other', 'arb_other_name', 'arb_other_dose', 'arb_not_used_elevated_creatinine', 'arb_not_used_hyperkalemia',
        'arb_not_used_hypotension', 'arb_not_used_other', 'arb_not_used_other_reason', 'spironolactone', 'spironolactone_dose',
        'eplerenone', 'eplerenone_dose', 'aldosterone_not_used_hyperkalemia', 'aldosterone_not_used_hyponatremia', 'aldosterone_not_used_elevated_creatinine',
        'aldosterone_not_used_other', 'aldosterone_not_used_other_reason'
    ];
    const placeholders = keys.map(() => '?').join(', ');
    const query = `
        INSERT INTO hf_medical_therapy_part1 (${keys.join(', ')})
        VALUES (${placeholders})
    `;
    const values = keys.map(k => data[k] === undefined ? null : data[k]);
    const [result] = await conn.execute(query, values);
    return result;
}

async function insertHfMedicalTherapyPart2(conn, data) {
    const keys = [
        'hf_id', 'hydralazine', 'hydralazine_name', 'hydralazine_dose', 'nitrate_1',
        'nitrate_1_name', 'nitrate_1_dose', 'nitrate_2', 'nitrate_2_name', 'nitrate_2_dose',
        'warfarin', 'warfarin_inr', 'warfarin_target_inr', 'vitamin_k_inhibitor', 'vitamin_k_inhibitor_name',
        'vitamin_k_inhibitor_dose', 'noac', 'noac_name', 'noac_dose', 'acitrom',
        'acitrom_dose', 'ufh', 'ufh_dose', 'lmwh', 'lmwh_dose',
        'aspirin', 'aspirin_dose', 'clopidogrel', 'clopidogrel_dose', 'prasugrel',
        'prasugrel_dose', 'ticagrelor', 'ticagrelor_dose', 'amiodarone', 'amiodarone_dose',
        'antiarrhythmic_other', 'antiarrhythmic_other_name', 'antiarrhythmic_other_dose', 'furosemide', 'furosemide_dose',
        'torsemide', 'torsemide_dose', 'metolazone', 'metolazone_dose', 'diuretic_other',
        'diuretic_other_name', 'diuretic_other_dose', 'diuretic_not_used_hyponatremia', 'diuretic_not_used_hypokalemia', 'diuretic_not_used_worsening_renal_failure',
        'diuretic_not_used_hypotension', 'diuretic_not_used_other', 'diuretic_not_used_other_reason'
    ];
    const placeholders = keys.map(() => '?').join(', ');
    const query = `
        INSERT INTO hf_medical_therapy_part2 (${keys.join(', ')})
        VALUES (${placeholders})
    `;
    const values = keys.map(k => data[k] === undefined ? null : data[k]);
    const [result] = await conn.execute(query, values);
    return result;
}

async function insertHfMedicalTherapyPart3(conn, data) {
    const keys = [
        'hf_id', 'digoxin', 'digoxin_name', 'digoxin_dose', 'ivabradine',
        'ivabradine_dose', 'atorvastatin', 'atorvastatin_dose', 'simvastatin', 'simvastatin_dose',
        'rosuvastatin', 'rosuvastatin_dose', 'sulfonylureas', 'sulfonylureas_dose', 'metformin',
        'metformin_dose', 'glitazone', 'glitazone_dose', 'gliptin', 'gliptin_dose',
        'acarbose_derivative', 'acarbose_derivative_dose', 'human_insulin', 'human_insulin_dose', 'synthetic_insulin',
        'synthetic_insulin_dose', 'antihypertensive', 'antihypertensive_name', 'antihypertensive_dose', 'thyroxine',
        'thyroxine_dose', 'other_medication_1', 'other_medication_1_name', 'other_medication_1_dose', 'other_medication_2',
        'other_medication_2_name', 'other_medication_2_dose', 'other_medication_3', 'other_medication_3_name', 'other_medication_3_dose',
        'other_medication_4', 'other_medication_4_name', 'other_medication_4_dose'
    ];
    const placeholders = keys.map(() => '?').join(', ');
    const query = `
        INSERT INTO hf_medical_therapy_part3 (${keys.join(', ')})
        VALUES (${placeholders})
    `;
    const values = keys.map(k => data[k] === undefined ? null : data[k]);
    const [result] = await conn.execute(query, values);
    return result;
}

async function insertHfDeviceTherapy(conn, data) {
    const keys = [
        'hf_id', 'current_device_none', 'current_device_yes', 'current_crt_p', 'current_crt_d',
        'current_icd_sc', 'current_icd_dc', 'current_dual_chamber_pacemaker', 'current_single_chamber_pacemaker', 'current_device_other',
        'current_device_other_name', 'current_device_brand', 'eligible_no', 'eligible_yes', 'eligible_crt_p',
        'eligible_crt_d', 'eligible_icd_sc', 'eligible_icd_dc', 'eligible_dual_chamber_pacemaker', 'eligible_single_chamber_pacemaker',
        'eligible_other', 'eligible_other_name', 'eligible_device_brand', 'patient_acceptance_yes', 'patient_acceptance_no',
        'patient_acceptance_reason', 'implant_date', 'icd_shock', 'number_of_shocks', 'appropriate_shocks',
        'inappropriate_shocks', 'cause_of_shocks', 'atp', 'atp_times', 'atp_success_always',
        'atp_success_most_times', 'atp_success_sometimes', 'atp_success_not_successful', 'biv_pacing_percent', 'afib_burden',
        'nsvt_episodes', 'svt_episodes', 'device_volume_alert', 'notes'
    ];
    const placeholders = keys.map(() => '?').join(', ');
    const query = `
        INSERT INTO hf_device_therapy (${keys.join(', ')})
        VALUES (${placeholders})
    `;
    const values = keys.map(k => data[k] === undefined ? null : data[k]);
    const [result] = await conn.execute(query, values);
    return result;
}

async function insertHfPatientEducation(conn, data) {
    const keys = [
        'hf_id', 'diet_2000mg_salt_restriction', 'exercise_activity_promoted', 'daily_weight_monitoring', 'disease_process_explained',
        'smoking_cessation', 'alcohol_cessation', 'medication_compliance', 'worsened_symptoms_education', 'device_therapy_education',
        'education_other', 'education_other_details'
    ];
    const placeholders = keys.map(() => '?').join(', ');
    const query = `
        INSERT INTO hf_patient_education (${keys.join(', ')})
        VALUES (${placeholders})
    `;
    const values = keys.map(k => data[k] === undefined ? null : data[k]);
    const [result] = await conn.execute(query, values);
    return result;
}

async function insertHfRecommendations(conn, data) {
    const keys = [
        'hf_id', 'fluid_and_diet', 'fluid_and_diet_details', 'exercise', 'exercise_details',
        'yoga', 'yoga_details', 'smoking_cessation', 'smoking_cessation_details', 'stress_management',
        'stress_management_details', 'drugs', 'drugs_details', 'investigations', 'investigations_details',
        'procedures', 'procedures_details', 'other_recommendation', 'other_recommendation_details'
    ];
    const placeholders = keys.map(() => '?').join(', ');
    const query = `
        INSERT INTO hf_recommendations (${keys.join(', ')})
        VALUES (${placeholders})
    `;
    const values = keys.map(k => data[k] === undefined ? null : data[k]);
    const [result] = await conn.execute(query, values);
    return result;
}

async function insertHfLabTests(conn, data) {
    const keys = [
        'hf_id', 'pneumococcal_vaccination', 'pneumococcal_vaccination_date', 'influenza_vaccination', 'influenza_vaccination_date',
        'blood_group', 'potassium_result', 'potassium_date', 'creatinine_result', 'creatinine_date',
        'hb_result', 'hb_date', 'calcium_result', 'calcium_date', 'bun_result',
        'bun_date', 'glucose_result', 'glucose_date', 'hba1c_result', 'hba1c_date',
        'magnesium_result', 'magnesium_date', 'sodium_result', 'sodium_date', 'tsh_result',
        'tsh_date', 't3_result', 't3_date', 't4_result', 't4_date',
        'bnp_result', 'bnp_date', 'nt_pro_bnp_result', 'nt_pro_bnp_date', 'ldl_result',
        'ldl_date', 'inr_result', 'inr_date', 'st2_result', 'st2_date',
        'other_lab_test_name', 'other_lab_test_result', 'other_lab_test_date'
    ];
    const placeholders = keys.map(() => '?').join(', ');
    const query = `
        INSERT INTO hf_lab_tests (${keys.join(', ')})
        VALUES (${placeholders})
    `;
    const values = keys.map(k => data[k] === undefined ? null : data[k]);
    const [result] = await conn.execute(query, values);
    return result;
}

async function insertHfCardiacInvestigations(conn, data) {
    const keys = [
        'hf_id', 'ecg_test_date', 'ecg_qrs_duration', 'ecg_rhythm_sinus', 'ecg_rhythm_af',
        'ecg_rhythm_other', 'ecg_rhythm_other_details', 'ecg_av_normal', 'ecg_av_first_degree_block', 'ecg_av_second_degree_block',
        'ecg_av_third_degree_block', 'ecg_qwaves_yes', 'ecg_qwaves_none', 'ecg_qwave_leads', 'ecg_lbbb',
        'ecg_rbbb', 'ecg_block_other', 'ecg_block_other_details', 'ecg_apc', 'ecg_vpc',
        'ecg_extra_beats_none', 'ecg_qt', 'ecg_qtc', 'chest_xray_test_date', 'cardiothoracic_ratio',
        'chest_pvh', 'chest_pulmonary_edema', 'chest_pleural_effusion', 'chest_other', 'chest_other_details',
        'echo_test_date', 'echo_ef', 'echo_ea_ratio', 'echo_ee_ratio', 'echo_deceleration_time',
        'echo_rv_tapsv', 'echo_left_atrium_dimension', 'echo_left_ventricle_systole', 'echo_left_ventricle_diastole', 'mitral_regurgitation_none',
        'mitral_regurgitation_1plus', 'mitral_regurgitation_2plus', 'mitral_regurgitation_3plus', 'mitral_regurgitation_4plus', 'other_valves',
        'rv_systolic_pressure', 'rv_function_normal', 'rv_function_impaired', 'rwmi_none', 'rwmi_global',
        'rwmi_anterior', 'rwmi_lateral', 'rwmi_inferior'
    ];
    const placeholders = keys.map(() => '?').join(', ');
    const query = `
        INSERT INTO hf_cardiac_investigations (${keys.join(', ')})
        VALUES (${placeholders})
    `;
    const values = keys.map(k => data[k] === undefined ? null : data[k]);
    const [result] = await conn.execute(query, values);
    return result;
}

async function insertHfAdvancedInvestigations(conn, data) {
    const keys = [
        'hf_id', 'holter_test_date', 'ventricular_arrhythmia_no', 'ventricular_arrhythmia_yes', 'ventricular_arrhythmia_complex_vpc',
        'ventricular_arrhythmia_nsvt', 'ventricular_arrhythmia_vt', 'atrial_arrhythmia_none', 'atrial_arrhythmia_apcs', 'atrial_arrhythmia_af',
        'ventricular_pvc', 'heart_rate_variability', 'stress_test_done', 'stress_test_date', 'stress_test_not_done',
        'stress_mets_achieved', 'stress_target_heart_rate_achieved', 'stress_ischemic_changes_yes', 'stress_ischemic_changes_no', 'stress_arrhythmias_yes',
        'stress_arrhythmias_no', 'mri_test_date', 'mri_lvef', 'mri_scar_present', 'mri_scar_absent',
        'pet_test_date', 'six_minute_walk_done', 'six_minute_walk_date', 'six_minute_walk_distance', 'six_minute_walk_heart_rate_recovery',
        'six_minute_walk_not_done', 'six_minute_walk_reason', 'anaerobic_threshold_test_date', 'angiogram_done', 'angiogram_test_date',
        'angiogram_normal', 'angiogram_one_vessel_disease', 'angiogram_two_vessel_disease', 'angiogram_three_vessel_disease', 'angiogram_lmca',
        'angiogram_not_done', 'biopsy_done', 'biopsy_test_date', 'biopsy_not_done'
    ];
    const placeholders = keys.map(() => '?').join(', ');
    const query = `
        INSERT INTO hf_advanced_investigations (${keys.join(', ')})
        VALUES (${placeholders})
    `;
    const values = keys.map(k => data[k] === undefined ? null : data[k]);
    const [result] = await conn.execute(query, values);
    return result;
}

module.exports = {
    insertHfRegistry,
    insertHfAdministrative,
    insertHfInitialAssessment,
    insertHfFinalClinicalAssessment,
    insertHfMedicalTherapyPart1,
    insertHfMedicalTherapyPart2,
    insertHfMedicalTherapyPart3,
    insertHfDeviceTherapy,
    insertHfPatientEducation,
    insertHfRecommendations,
    insertHfLabTests,
    insertHfCardiacInvestigations,
    insertHfAdvancedInvestigations
};
