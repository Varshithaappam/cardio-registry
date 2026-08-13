const { getPool, sql } = require('../config/db');

/**
 * Controller to handle full NSTEMI Registry insertion across 9 modular tables
 * using a single, atomic SQL Transaction.
 * 
 * @route POST /api/nstemi
 */
async function createNstemiRecord(req, res) {
  let transaction;
  try {
    const payload = req.body || {};

    // Helper to sanitize payload fields (empty string/undefined -> null)
    const val = (key, defaultVal = null) => {
      const v = payload[key];
      if (v === undefined || v === null || v === '') return defaultVal;
      return v;
    };

    // Helper to convert boolean/string to 1 or 0 for BIT columns
    const bitVal = (key) => {
      const v = payload[key];
      if (v === true || v === 1 || v === '1' || v === 'Yes' || v === 'yes' || v === 'True') return 1;
      if (v === false || v === 0 || v === '0' || v === 'No' || v === 'no' || v === 'False') return 0;
      return null;
    };

    const pool = await getPool();
    transaction = new sql.Transaction(pool);

    // 1. Begin Transaction
    await transaction.begin(sql.ISOLATION_LEVEL.READ_COMMITTED);

    // ==========================================
    // TABLE 1: nstemi_registry (Parent Table)
    // ==========================================
    const reqRegistry = new sql.Request(transaction);
    reqRegistry.input('patient_id', sql.Int, val('patient_id', 1));
    reqRegistry.input('acs_no', sql.VarChar(50), val('acs_no', 'ACS-' + Date.now().toString().slice(-6)));
    reqRegistry.input('ip_no', sql.VarChar(50), val('ip_no'));
    reqRegistry.input('admission_date', sql.VarChar(50), val('admission_date'));
    reqRegistry.input('discharge_date', sql.VarChar(50), val('discharge_date'));
    reqRegistry.input('primary_consultant', sql.VarChar(100), val('primary_consultant'));

    const registryResult = await reqRegistry.query(`
      INSERT INTO [nstemi_registry] (
        [patient_id], [acs_no], [ip_no], [admission_date], [discharge_date], [primary_consultant]
      )
      OUTPUT INSERTED.[nstemi_id]
      VALUES (
        @patient_id, @acs_no, @ip_no, @admission_date, @discharge_date, @primary_consultant
      );
    `);

    const nstemi_id = registryResult.recordset[0].nstemi_id;

    // ==========================================
    // TABLE 2: nstemi_administrative
    // ==========================================
    const reqAdmin = new sql.Request(transaction);
    reqAdmin.input('nstemi_id', sql.Int, nstemi_id);
    reqAdmin.input('hypertension', sql.Bit, bitVal('hypertension'));
    reqAdmin.input('diabetes', sql.Bit, bitVal('diabetes'));
    reqAdmin.input('smoking', sql.Bit, bitVal('smoking'));
    reqAdmin.input('renal_failure', sql.Bit, bitVal('renal_failure'));
    reqAdmin.input('copd', sql.Bit, bitVal('copd'));
    reqAdmin.input('cva', sql.Bit, bitVal('cva'));
    reqAdmin.input('prior_acs', sql.Bit, bitVal('prior_acs'));
    reqAdmin.input('prior_ptca', sql.Bit, bitVal('prior_ptca'));
    reqAdmin.input('prior_cabg', sql.Bit, bitVal('prior_cabg'));
    reqAdmin.input('other_background', sql.NVarChar(sql.MAX), val('other_background'));

    await reqAdmin.query(`
      INSERT INTO [nstemi_administrative] (
        [nstemi_id], [hypertension], [diabetes], [smoking], [renal_failure], [copd], [cva],
        [prior_acs], [prior_ptca], [prior_cabg], [other_background]
      ) VALUES (
        @nstemi_id, @hypertension, @diabetes, @smoking, @renal_failure, @copd, @cva,
        @prior_acs, @prior_ptca, @prior_cabg, @other_background
      );
    `);

    // ==========================================
    // TABLE 3: nstemi_clinical_assessment
    // ==========================================
    const reqClinical = new sql.Request(transaction);
    reqClinical.input('nstemi_id', sql.Int, nstemi_id);
    reqClinical.input('typical_angina', sql.Bit, bitVal('typical_angina'));
    reqClinical.input('atypical_chest_pain', sql.Bit, bitVal('atypical_chest_pain'));
    reqClinical.input('breathlessness', sql.Bit, bitVal('breathlessness'));
    reqClinical.input('syncope_presyncope', sql.Bit, bitVal('syncope_presyncope'));
    reqClinical.input('pulse_rate', sql.Int, val('pulse_rate') ? parseInt(val('pulse_rate')) : null);
    reqClinical.input('systolic_bp', sql.Int, val('systolic_bp') ? parseInt(val('systolic_bp')) : null);
    reqClinical.input('diastolic_bp', sql.Int, val('diastolic_bp') ? parseInt(val('diastolic_bp')) : null);
    reqClinical.input('age_65_or_older', sql.Bit, bitVal('age_65_or_older'));
    reqClinical.input('at_least_3_chd_risk_factors', sql.Bit, bitVal('at_least_3_chd_risk_factors'));
    reqClinical.input('prior_coronary_stenosis_50', sql.Bit, bitVal('prior_coronary_stenosis_50'));
    reqClinical.input('st_deviation_admission', sql.Bit, bitVal('st_deviation_admission'));
    reqClinical.input('at_least_2_anginal_episodes_24h', sql.Bit, bitVal('at_least_2_anginal_episodes_24h'));
    reqClinical.input('elevated_cardiac_markers', sql.Bit, bitVal('elevated_cardiac_markers'));
    reqClinical.input('aspirin_use_last_7d', sql.Bit, bitVal('aspirin_use_last_7d'));
    reqClinical.input('timi_total_score', sql.Int, val('timi_total_score') !== null ? parseInt(val('timi_total_score')) : 0);

    await reqClinical.query(`
      INSERT INTO [nstemi_clinical_assessment] (
        [nstemi_id], [typical_angina], [atypical_chest_pain], [breathlessness], [syncope_presyncope],
        [pulse_rate], [systolic_bp], [diastolic_bp], [age_65_or_older], [at_least_3_chd_risk_factors],
        [prior_coronary_stenosis_50], [st_deviation_admission], [at_least_2_anginal_episodes_24h],
        [elevated_cardiac_markers], [aspirin_use_last_7d], [timi_total_score]
      ) VALUES (
        @nstemi_id, @typical_angina, @atypical_chest_pain, @breathlessness, @syncope_presyncope,
        @pulse_rate, @systolic_bp, @diastolic_bp, @age_65_or_older, @at_least_3_chd_risk_factors,
        @prior_coronary_stenosis_50, @st_deviation_admission, @at_least_2_anginal_episodes_24h,
        @elevated_cardiac_markers, @aspirin_use_last_7d, @timi_total_score
      );
    `);

    // ==========================================
    // TABLE 4: nstemi_treatment_strategy
    // ==========================================
    const reqTx = new sql.Request(transaction);
    reqTx.input('nstemi_id', sql.Int, nstemi_id);
    reqTx.input('treatment_strategy', sql.VarChar(50), val('treatment_strategy', 'Conservative'));
    reqTx.input('pami', sql.Bit, bitVal('pami'));
    reqTx.input('door_to_balloon_time', sql.Int, val('door_to_balloon_time') ? parseInt(val('door_to_balloon_time')) : null);
    reqTx.input('culprit_segment', sql.VarChar(100), val('culprit_segment'));
    reqTx.input('stent_type', sql.VarChar(100), val('stent_type'));
    reqTx.input('stent_diameter', sql.Float, val('stent_diameter') ? parseFloat(val('stent_diameter')) : null);
    reqTx.input('stent_length', sql.Float, val('stent_length') ? parseFloat(val('stent_length')) : null);
    reqTx.input('thrombosuction', sql.VarChar(50), val('thrombosuction'));
    reqTx.input('procedural_success', sql.VarChar(50), val('procedural_success'));
    reqTx.input('post_procedure_timi_flow', sql.VarChar(50), val('post_procedure_timi_flow'));
    reqTx.input('thrombolysis', sql.Bit, bitVal('thrombolysis'));
    reqTx.input('door_to_needle_time', sql.Int, val('door_to_needle_time') ? parseInt(val('door_to_needle_time')) : null);
    reqTx.input('thrombolytic_drug', sql.VarChar(100), val('thrombolytic_drug'));
    reqTx.input('thrombolytic_dose', sql.VarChar(100), val('thrombolytic_dose'));
    reqTx.input('conservative', sql.Bit, bitVal('conservative'));
    reqTx.input('heparin_strategy', sql.VarChar(100), val('heparin_strategy'));
    reqTx.input('gp2b3a_inhibitor', sql.VarChar(50), val('gp2b3a_inhibitor'));
    reqTx.input('bivalirudin', sql.VarChar(50), val('bivalirudin'));

    await reqTx.query(`
      INSERT INTO [nstemi_treatment_strategy] (
        [nstemi_id], [treatment_strategy], [pami], [door_to_balloon_time], [culprit_segment],
        [stent_type], [stent_diameter], [stent_length], [thrombosuction], [procedural_success],
        [post_procedure_timi_flow], [thrombolysis], [door_to_needle_time], [thrombolytic_drug],
        [thrombolytic_dose], [conservative], [heparin_strategy], [gp2b3a_inhibitor], [bivalirudin]
      ) VALUES (
        @nstemi_id, @treatment_strategy, @pami, @door_to_balloon_time, @culprit_segment,
        @stent_type, @stent_diameter, @stent_length, @thrombosuction, @procedural_success,
        @post_procedure_timi_flow, @thrombolysis, @door_to_needle_time, @thrombolytic_drug,
        @thrombolytic_dose, @conservative, @heparin_strategy, @gp2b3a_inhibitor, @bivalirudin
      );
    `);

    // ==========================================
    // TABLE 5: nstemi_diagnostics
    // ==========================================
    const reqDiag = new sql.Request(transaction);
    reqDiag.input('nstemi_id', sql.Int, nstemi_id);
    reqDiag.input('bedside_echo', sql.VarChar(100), val('bedside_echo'));
    reqDiag.input('echo_ef', sql.Float, val('echo_ef') ? parseFloat(val('echo_ef')) : null);
    reqDiag.input('ecg_rhythm', sql.VarChar(100), val('ecg_rhythm'));
    reqDiag.input('ecg_st_depression', sql.Bit, bitVal('ecg_st_depression'));
    reqDiag.input('ecg_t_wave_inversion', sql.Bit, bitVal('ecg_t_wave_inversion'));
    reqDiag.input('troponin_i', sql.Float, val('troponin_i') ? parseFloat(val('troponin_i')) : null);
    reqDiag.input('bnp_value', sql.Float, val('bnp_value') ? parseFloat(val('bnp_value')) : null);
    reqDiag.input('crp_value', sql.Float, val('crp_value') ? parseFloat(val('crp_value')) : null);
    reqDiag.input('lipid_profile', sql.NVarChar(sql.MAX), val('lipid_profile'));
    reqDiag.input('serum_creatinine', sql.Float, val('serum_creatinine') ? parseFloat(val('serum_creatinine')) : null);
    reqDiag.input('hemoglobin', sql.Float, val('hemoglobin') ? parseFloat(val('hemoglobin')) : null);

    await reqDiag.query(`
      INSERT INTO [nstemi_diagnostics] (
        [nstemi_id], [bedside_echo], [echo_ef], [ecg_rhythm], [ecg_st_depression],
        [ecg_t_wave_inversion], [troponin_i], [bnp_value], [crp_value], [lipid_profile],
        [serum_creatinine], [hemoglobin]
      ) VALUES (
        @nstemi_id, @bedside_echo, @echo_ef, @ecg_rhythm, @ecg_st_depression,
        @ecg_t_wave_inversion, @troponin_i, @bnp_value, @crp_value, @lipid_profile,
        @serum_creatinine, @hemoglobin
      );
    `);

    // ==========================================
    // TABLE 6: nstemi_outcomes
    // ==========================================
    const reqOutcomes = new sql.Request(transaction);
    reqOutcomes.input('nstemi_id', sql.Int, nstemi_id);
    reqOutcomes.input('death', sql.Bit, bitVal('death'));
    reqOutcomes.input('reinfarction', sql.Bit, bitVal('reinfarction'));
    reqOutcomes.input('stroke', sql.Bit, bitVal('stroke'));
    reqOutcomes.input('major_bleeding', sql.Bit, bitVal('major_bleeding'));
    reqOutcomes.input('heart_failure_onset', sql.Bit, bitVal('heart_failure_onset'));
    reqOutcomes.input('cardiogenic_shock', sql.Bit, bitVal('cardiogenic_shock'));
    reqOutcomes.input('discharge_aspirin', sql.Bit, bitVal('discharge_aspirin'));
    reqOutcomes.input('discharge_clopidogrel', sql.Bit, bitVal('discharge_clopidogrel'));
    reqOutcomes.input('discharge_ticagrelor', sql.Bit, bitVal('discharge_ticagrelor'));
    reqOutcomes.input('discharge_statin', sql.Bit, bitVal('discharge_statin'));
    reqOutcomes.input('discharge_beta_blocker', sql.Bit, bitVal('discharge_beta_blocker'));
    reqOutcomes.input('discharge_acei_arb', sql.Bit, bitVal('discharge_acei_arb'));

    await reqOutcomes.query(`
      INSERT INTO [nstemi_outcomes] (
        [nstemi_id], [death], [reinfarction], [stroke], [major_bleeding],
        [heart_failure_onset], [cardiogenic_shock], [discharge_aspirin],
        [discharge_clopidogrel], [discharge_ticagrelor], [discharge_statin],
        [discharge_beta_blocker], [discharge_acei_arb]
      ) VALUES (
        @nstemi_id, @death, @reinfarction, @stroke, @major_bleeding,
        @heart_failure_onset, @cardiogenic_shock, @discharge_aspirin,
        @discharge_clopidogrel, @discharge_ticagrelor, @discharge_statin,
        @discharge_beta_blocker, @discharge_acei_arb
      );
    `);

    // ==========================================
    // TABLE 7: nstemi_appropriateness
    // ==========================================
    const reqAppr = new sql.Request(transaction);
    reqAppr.input('nstemi_id', sql.Int, nstemi_id);
    reqAppr.input('iccu_admission', sql.Bit, bitVal('iccu_admission'));
    reqAppr.input('thrombolysis_indication', sql.Bit, bitVal('thrombolysis_indication'));
    reqAppr.input('pami_indication', sql.Bit, bitVal('pami_indication'));
    reqAppr.input('guideline_adherence', sql.Bit, bitVal('guideline_adherence'));
    reqAppr.input('risk_stratification_done', sql.Bit, bitVal('risk_stratification_done'));

    await reqAppr.query(`
      INSERT INTO [nstemi_appropriateness] (
        [nstemi_id], [iccu_admission], [thrombolysis_indication], [pami_indication],
        [guideline_adherence], [risk_stratification_done]
      ) VALUES (
        @nstemi_id, @iccu_admission, @thrombolysis_indication, @pami_indication,
        @guideline_adherence, @risk_stratification_done
      );
    `);

    // ==========================================
    // TABLE 8: nstemi_hospitalization
    // ==========================================
    const reqHosp = new sql.Request(transaction);
    reqHosp.input('nstemi_id', sql.Int, nstemi_id);
    reqHosp.input('iccu_hours', sql.Int, val('iccu_hours') ? parseInt(val('iccu_hours')) : null);
    reqHosp.input('total_hospital_stay_days', sql.Int, val('total_hospital_stay_days') ? parseInt(val('total_hospital_stay_days')) : null);
    reqHosp.input('room_type', sql.VarChar(50), val('room_type'));
    reqHosp.input('total_cost', sql.Float, val('total_cost') ? parseFloat(val('total_cost')) : null);
    reqHosp.input('insurance_covered_amount', sql.Float, val('insurance_covered_amount') ? parseFloat(val('insurance_covered_amount')) : null);

    await reqHosp.query(`
      INSERT INTO [nstemi_hospitalization] (
        [nstemi_id], [iccu_hours], [total_hospital_stay_days], [room_type],
        [total_cost], [insurance_covered_amount]
      ) VALUES (
        @nstemi_id, @iccu_hours, @total_hospital_stay_days, @room_type,
        @total_cost, @insurance_covered_amount
      );
    `);

    // ==========================================
    // TABLE 9: nstemi_followup
    // ==========================================
    const reqFollowup = new sql.Request(transaction);
    reqFollowup.input('nstemi_id', sql.Int, nstemi_id);
    reqFollowup.input('followup_month', sql.VarChar(50), val('followup_month', '1-Month'));
    reqFollowup.input('angina', sql.Bit, bitVal('angina'));
    reqFollowup.input('readmission', sql.Bit, bitVal('readmission'));
    reqFollowup.input('statins', sql.Bit, bitVal('statins'));
    reqFollowup.input('antiplatelets', sql.Bit, bitVal('antiplatelets'));
    reqFollowup.input('compliance_status', sql.VarChar(100), val('compliance_status', 'Good'));

    await reqFollowup.query(`
      INSERT INTO [nstemi_followup] (
        [nstemi_id], [followup_month], [angina], [readmission],
        [statins], [antiplatelets], [compliance_status]
      ) VALUES (
        @nstemi_id, @followup_month, @angina, @readmission,
        @statins, @antiplatelets, @compliance_status
      );
    `);

    // Commit Transaction
    await transaction.commit();

    return res.status(201).json({
      success: true,
      message: 'NSTEMI Registry record successfully created across all 9 modular tables.',
      data: {
        nstemi_id,
        patient_id: val('patient_id', 1),
        acs_no: val('acs_no')
      }
    });

  } catch (error) {
    console.error('❌ Error inserting NSTEMI Record:', error);
    if (transaction) {
      try {
        await transaction.rollback();
        console.log('🔄 SQL Transaction rolled back successfully.');
      } catch (rollbackErr) {
        console.error('⚠️ Transaction Rollback Error:', rollbackErr);
      }
    }

    return res.status(500).json({
      success: false,
      message: error.message || 'Internal server error while creating NSTEMI record.'
    });
  }
}

module.exports = { createNstemiRecord };
