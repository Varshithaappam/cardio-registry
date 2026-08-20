const { getPool, sql } = require('../config/db');

/**
 * Controller to handle full STEMI Registry insertion across 9 modular tables
 * using a single, atomic SQL Transaction.
 * 
 * @route POST /api/stemi
 */
async function createStemiRecord(req, res) {
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

    // Helper to convert to 'Yes' or 'No' string for STEMI assessment columns
    const strVal = (key) => {
      const v = payload[key];
      if (v === true || v === 1 || v === '1' || v === 'Yes' || v === 'yes' || v === 'True') return 'Yes';
      if (v === false || v === 0 || v === '0' || v === 'No' || v === 'no' || v === 'False') return 'No';
      return v || 'No';
    };

    const pool = await getPool();
    transaction = new sql.Transaction(pool);

    // 1. Begin Transaction
    await transaction.begin(sql.ISOLATION_LEVEL.READ_COMMITTED);

    // Generate next ip_no if not present, and make acs_no identical to it
    let finalIpNo = val('ip_no');
    if (!finalIpNo) {
      const { recordset: maxIpRows } = await transaction.request().query(
        `SELECT TOP 1 [ip_no] 
         FROM [stemi_registry] 
         WHERE [ip_no] LIKE 'IP%' 
         ORDER BY [ip_no] DESC;`
      );

      let nextNum = 1;
      if (maxIpRows.length > 0 && maxIpRows[0].ip_no) {
        const lastIpNo = maxIpRows[0].ip_no;
        const numMatch = lastIpNo.match(/\d+/);
        if (numMatch) {
          nextNum = parseInt(numMatch[0], 10) + 1;
        }
      }
      finalIpNo = `IP${String(nextNum).padStart(5, '0')}`;
    }

    // ==========================================
    // TABLE 1: stemi_registry (Parent Table)
    // ==========================================
    const reqRegistry = new sql.Request(transaction);
    reqRegistry.input('reg_patient_id', sql.Int, val('reg_patient_id', 1));
    reqRegistry.input('acs_no', sql.VarChar(50), finalIpNo); // identical to ip_no
    reqRegistry.input('ip_no', sql.VarChar(50), finalIpNo);
    reqRegistry.input('admission_date', sql.VarChar(50), val('admission_date'));
    reqRegistry.input('discharge_date', sql.VarChar(50), val('discharge_date'));
    reqRegistry.input('primary_consultant', sql.VarChar(100), val('primary_consultant'));

    const registryResult = await reqRegistry.query(`
      INSERT INTO [stemi_registry] (
        [reg_patient_id], [acs_no], [ip_no], [admission_date], [discharge_date], [primary_consultant]
      )
      OUTPUT INSERTED.[stemi_id]
      VALUES (
        @reg_patient_id, @acs_no, @ip_no, @admission_date, @discharge_date, @primary_consultant
      );
    `);

    const stemi_id = registryResult.recordset[0].stemi_id;

    // ==========================================
    // TABLE 2: stemi_administrative
    // ==========================================
    const reqAdmin = new sql.Request(transaction);
    reqAdmin.input('stemi_id', sql.Int, stemi_id);
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
      INSERT INTO [stemi_administrative] (
        [stemi_id], [hypertension], [diabetes], [smoking], [renal_failure], [copd], [cva],
        [prior_acs], [prior_ptca], [prior_cabg], [other_background]
      ) VALUES (
        @stemi_id, @hypertension, @diabetes, @smoking, @renal_failure, @copd, @cva,
        @prior_acs, @prior_ptca, @prior_cabg, @other_background
      );
    `);

    // ==========================================
    // TABLE 3: stemi_clinical_assessment
    // ==========================================
    const reqClinical = new sql.Request(transaction);
    reqClinical.input('stemi_id', sql.Int, stemi_id);
    reqClinical.input('typical_angina', sql.NVarChar(50), strVal('typical_angina'));
    reqClinical.input('atypical_chest_pain', sql.NVarChar(50), strVal('atypical_chest_pain'));
    reqClinical.input('breathlessness', sql.NVarChar(50), strVal('breathlessness'));
    reqClinical.input('syncope_presyncope', sql.NVarChar(50), strVal('syncope_presyncope'));
    reqClinical.input('pulse_rate', sql.Int, val('pulse_rate') ? parseInt(val('pulse_rate')) : null);
    reqClinical.input('systolic_bp', sql.Int, val('systolic_bp') ? parseInt(val('systolic_bp')) : null);
    reqClinical.input('diastolic_bp', sql.Int, val('diastolic_bp') ? parseInt(val('diastolic_bp')) : null);
    reqClinical.input('age_gt_75', sql.NVarChar(50), strVal('age_gt_75'));
    reqClinical.input('age_65_to_74', sql.NVarChar(50), strVal('age_65_to_74'));
    reqClinical.input('history_dm_htn_angina', sql.NVarChar(50), strVal('history_dm_htn_angina'));
    reqClinical.input('sbp_lt_100', sql.NVarChar(50), strVal('sbp_lt_100'));
    reqClinical.input('heart_rate_gt_100', sql.NVarChar(50), strVal('heart_rate_gt_100'));
    reqClinical.input('killip_class_ii_to_iv', sql.NVarChar(50), strVal('killip_class_ii_to_iv'));
    reqClinical.input('anterior_mi_or_lbbb', sql.NVarChar(50), strVal('anterior_mi_or_lbbb'));
    reqClinical.input('weight_lt_67kg', sql.NVarChar(50), strVal('weight_lt_67kg'));
    reqClinical.input('reperfusion_gt_4hrs', sql.NVarChar(50), strVal('reperfusion_gt_4hrs'));
    reqClinical.input('lvf', sql.NVarChar(50), strVal('lvf'));
    reqClinical.input('vt_vf', sql.NVarChar(50), strVal('vt_vf'));
    reqClinical.input('bbb_chb', sql.NVarChar(50), strVal('bbb_chb'));
    reqClinical.input('elevated_bnp', sql.NVarChar(50), strVal('elevated_bnp'));
    reqClinical.input('elevated_crp', sql.NVarChar(50), strVal('elevated_crp'));
    reqClinical.input('timi_total_score', sql.Int, val('timi_total_score') !== null ? parseInt(val('timi_total_score')) : 0);

    await reqClinical.query(`
      INSERT INTO [stemi_clinical_assessment] (
        [stemi_id], [typical_angina], [atypical_chest_pain], [breathlessness], [syncope_presyncope],
        [pulse_rate], [systolic_bp], [diastolic_bp], [age_gt_75], [age_65_to_74], [history_dm_htn_angina],
        [sbp_lt_100], [heart_rate_gt_100], [killip_class_ii_to_iv], [anterior_mi_or_lbbb], [weight_lt_67kg],
        [reperfusion_gt_4hrs], [lvf], [vt_vf], [bbb_chb], [elevated_bnp], [elevated_crp], [timi_total_score]
      ) VALUES (
        @stemi_id, @typical_angina, @atypical_chest_pain, @breathlessness, @syncope_presyncope,
        @pulse_rate, @systolic_bp, @diastolic_bp, @age_gt_75, @age_65_to_74, @history_dm_htn_angina,
        @sbp_lt_100, @heart_rate_gt_100, @killip_class_ii_to_iv, @anterior_mi_or_lbbb, @weight_lt_67kg,
        @reperfusion_gt_4hrs, @lvf, @vt_vf, @bbb_chb, @elevated_bnp, @elevated_crp, @timi_total_score
      );
    `);

    // ==========================================
    // TABLE 4: stemi_treatment_strategy
    // ==========================================
    const reqTx = new sql.Request(transaction);
    reqTx.input('stemi_id', sql.Int, stemi_id);
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
      INSERT INTO [stemi_treatment_strategy] (
        [stemi_id], [treatment_strategy], [pami], [door_to_balloon_time], [culprit_segment],
        [stent_type], [stent_diameter], [stent_length], [thrombosuction], [procedural_success],
        [post_procedure_timi_flow], [thrombolysis], [door_to_needle_time], [thrombolytic_drug],
        [thrombolytic_dose], [conservative], [heparin_strategy], [gp2b3a_inhibitor], [bivalirudin]
      ) VALUES (
        @stemi_id, @treatment_strategy, @pami, @door_to_balloon_time, @culprit_segment,
        @stent_type, @stent_diameter, @stent_length, @thrombosuction, @procedural_success,
        @post_procedure_timi_flow, @thrombolysis, @door_to_needle_time, @thrombolytic_drug,
        @thrombolytic_dose, @conservative, @heparin_strategy, @gp2b3a_inhibitor, @bivalirudin
      );
    `);

    // ==========================================
    // TABLE 5: stemi_diagnostics
    // ==========================================
    const reqDiag = new sql.Request(transaction);
    reqDiag.input('stemi_id', sql.Int, stemi_id);
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
      INSERT INTO [stemi_diagnostics] (
        [stemi_id], [bedside_echo], [echo_ef], [ecg_rhythm], [ecg_st_depression],
        [ecg_t_wave_inversion], [troponin_i], [bnp_value], [crp_value], [lipid_profile],
        [serum_creatinine], [hemoglobin]
      ) VALUES (
        @stemi_id, @bedside_echo, @echo_ef, @ecg_rhythm, @ecg_st_depression,
        @ecg_t_wave_inversion, @troponin_i, @bnp_value, @crp_value, @lipid_profile,
        @serum_creatinine, @hemoglobin
      );
    `);

    // ==========================================
    // TABLE 6: stemi_outcomes
    // ==========================================
    const reqOutcomes = new sql.Request(transaction);
    reqOutcomes.input('stemi_id', sql.Int, stemi_id);
    reqOutcomes.input('death', sql.NVarChar(50), strVal('death'));
    reqOutcomes.input('remi_for_stemi', sql.NVarChar(50), strVal('remi_for_stemi'));
    reqOutcomes.input('major_bleeding', sql.NVarChar(50), strVal('major_bleeding'));
    reqOutcomes.input('aspirin', sql.NVarChar(50), strVal('aspirin'));
    reqOutcomes.input('clopidogrel', sql.NVarChar(50), strVal('clopidogrel'));
    reqOutcomes.input('ticagrelor', sql.NVarChar(50), strVal('ticagrelor'));
    reqOutcomes.input('statin', sql.NVarChar(50), strVal('statin'));
    reqOutcomes.input('beta_blocker', sql.NVarChar(50), strVal('beta_blocker'));
    reqOutcomes.input('calcium_channel_blocker', sql.NVarChar(50), strVal('calcium_channel_blocker'));
    reqOutcomes.input('ivabradine', sql.NVarChar(50), strVal('ivabradine'));
    reqOutcomes.input('nicorandil', sql.NVarChar(50), strVal('nicorandil'));
    reqOutcomes.input('ranolazine', sql.NVarChar(50), strVal('ranolazine'));
    reqOutcomes.input('nitrate', sql.NVarChar(50), strVal('nitrate'));
    reqOutcomes.input('trimetazidine', sql.NVarChar(50), strVal('trimetazidine'));
    reqOutcomes.input('prasugrel', sql.NVarChar(50), strVal('prasugrel'));

    await reqOutcomes.query(`
      INSERT INTO [stemi_outcomes] (
        [stemi_id], [death], [remi_for_stemi], [major_bleeding], [aspirin], [clopidogrel],
        [ticagrelor], [statin], [beta_blocker], [calcium_channel_blocker], [ivabradine],
        [nicorandil], [ranolazine], [nitrate], [trimetazidine], [prasugrel]
      ) VALUES (
        @stemi_id, @death, @remi_for_stemi, @major_bleeding, @aspirin, @clopidogrel,
        @ticagrelor, @statin, @beta_blocker, @calcium_channel_blocker, @ivabradine,
        @nicorandil, @ranolazine, @nitrate, @trimetazidine, @prasugrel
      );
    `);

    // ==========================================
    // TABLE 7: stemi_appropriateness
    // ==========================================
    const reqAppr = new sql.Request(transaction);
    reqAppr.input('stemi_id', sql.Int, stemi_id);
    reqAppr.input('iccu_admission', sql.Bit, bitVal('iccu_admission'));
    reqAppr.input('thrombolysis_indication', sql.Bit, bitVal('thrombolysis_indication'));
    reqAppr.input('pami_indication', sql.Bit, bitVal('pami_indication'));
    reqAppr.input('guideline_adherence', sql.Bit, bitVal('guideline_adherence'));
    reqAppr.input('risk_stratification_done', sql.Bit, bitVal('risk_stratification_done'));

    await reqAppr.query(`
      INSERT INTO [stemi_appropriateness] (
        [stemi_id], [iccu_admission], [thrombolysis_indication], [pami_indication],
        [guideline_adherence], [risk_stratification_done]
      ) VALUES (
        @stemi_id, @iccu_admission, @thrombolysis_indication, @pami_indication,
        @guideline_adherence, @risk_stratification_done
      );
    `);

    // ==========================================
    // TABLE 8: stemi_hospitalization
    // ==========================================
    const reqHosp = new sql.Request(transaction);
    reqHosp.input('stemi_id', sql.Int, stemi_id);
    reqHosp.input('iccu_hours', sql.Int, val('iccu_hours') ? parseInt(val('iccu_hours')) : null);
    reqHosp.input('total_hospital_stay_days', sql.Int, val('total_hospital_stay_days') ? parseInt(val('total_hospital_stay_days')) : null);
    reqHosp.input('room_type', sql.VarChar(50), val('room_type'));
    reqHosp.input('total_cost', sql.Float, val('total_cost') ? parseFloat(val('total_cost')) : null);
    reqHosp.input('insurance_covered_amount', sql.Float, val('insurance_covered_amount') ? parseFloat(val('insurance_covered_amount')) : null);

    await reqHosp.query(`
      INSERT INTO [stemi_hospitalization] (
        [stemi_id], [iccu_hours], [total_hospital_stay_days], [room_type],
        [total_cost], [insurance_covered_amount]
      ) VALUES (
        @stemi_id, @iccu_hours, @total_hospital_stay_days, @room_type,
        @total_cost, @insurance_covered_amount
      );
    `);

    // ==========================================
    // TABLE 9: stemi_followup
    // ==========================================
    const reqFollowup = new sql.Request(transaction);
    reqFollowup.input('stemi_id', sql.Int, stemi_id);
    reqFollowup.input('followup_month', sql.VarChar(50), val('followup_month', '1-Month'));
    reqFollowup.input('angina', sql.Bit, bitVal('angina'));
    reqFollowup.input('readmission', sql.Bit, bitVal('readmission'));
    reqFollowup.input('statins', sql.Bit, bitVal('statins'));
    reqFollowup.input('antiplatelets', sql.Bit, bitVal('antiplatelets'));
    reqFollowup.input('compliance_status', sql.VarChar(100), val('compliance_status', 'Good'));

    await reqFollowup.query(`
      INSERT INTO [stemi_followup] (
        [stemi_id], [followup_month], [angina], [readmission],
        [statins], [antiplatelets], [compliance_status]
      ) VALUES (
        @stemi_id, @followup_month, @angina, @readmission,
        @statins, @antiplatelets, @compliance_status
      );
    `);

    // Commit Transaction
    await transaction.commit();

    return res.status(201).json({
      success: true,
      message: 'STEMI Registry record successfully created across all 9 modular tables.',
      data: {
        stemi_id,
        reg_patient_id: val('reg_patient_id', 1),
        acs_no: val('acs_no')
      }
    });

  } catch (error) {
    console.error('❌ Error inserting STEMI Record:', error);
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
      message: error.message || 'Internal server error while creating STEMI record.'
    });
  }
}

module.exports = { createStemiRecord };
