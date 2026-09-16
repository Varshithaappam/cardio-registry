const { getPool, sql } = require('../config/db');
const { logAuditTrail } = require('../utils/logAuditTrail');

async function saveAppropriatenessHelper(transaction, tableName, idField, idVal, isUpdate, getVal) {
  const colRes = await new sql.Request(transaction).query(
    `SELECT name FROM sys.columns WHERE object_id = OBJECT_ID('dbo.${tableName}')`
  );
  let existingCols = new Set(colRes.recordset ? colRes.recordset.map(r => r.name) : []);

  const candidateInputs = {
    iccu_admission: { type: sql.NVarChar(50), val: getVal('appr_iccu_admission') },
    iccu_transfer_out: { type: sql.NVarChar(50), val: getVal('appr_iccu_transfer_out') },
    thrombolysis_indication: { type: sql.NVarChar(50), val: getVal('appr_thrombolysis_indication') },
    ptca_indication: { type: sql.NVarChar(50), val: getVal('appr_ptca_indication') },
    invasive_monitoring: { type: sql.NVarChar(50), val: getVal('appr_invasive_monitoring') },
    iabp_indication: { type: sql.NVarChar(50), val: getVal('appr_iabp_indication') },
    invasive_ventilation: { type: sql.NVarChar(50), val: getVal('appr_invasive_ventilation') },
    dialysis_indication: { type: sql.NVarChar(50), val: getVal('appr_dialysis_indication') },
    other_procedure_name: { type: sql.VarChar(255), val: getVal('appr_other_procedure_name') },
    other_procedure_appropriateness: { type: sql.NVarChar(50), val: getVal('appr_other_procedure_appropriateness') },
    cardiac_enzymes: { type: sql.NVarChar(50), val: getVal('appr_cardiac_enzymes') },
    bnp: { type: sql.NVarChar(50), val: getVal('appr_bnp') },
    crp: { type: sql.NVarChar(50), val: getVal('appr_crp') },
    lipid_profile: { type: sql.NVarChar(50), val: getVal('appr_lipid_profile') },
    bedside_echo: { type: sql.NVarChar(50), val: getVal('appr_bedside_echo') },
    chest_xray: { type: sql.NVarChar(50), val: getVal('appr_chest_xray') },
    beta_blockers: { type: sql.NVarChar(50), val: getVal('appr_beta_blockers') },
    aspirin: { type: sql.NVarChar(50), val: getVal('appr_aspirin') },
    clopidogrel: { type: sql.NVarChar(50), val: getVal('appr_clopidogrel') },
    ace_inhibitor: { type: sql.NVarChar(50), val: getVal('appr_ace_inhibitor') },
    arb: { type: sql.NVarChar(50), val: getVal('appr_arb') },
    statin: { type: sql.NVarChar(50), val: getVal('appr_statin') },
    diuretic: { type: sql.NVarChar(50), val: getVal('appr_diuretic') },
    lanoxin: { type: sql.NVarChar(50), val: getVal('appr_lanoxin') },
    anticoagulant: { type: sql.NVarChar(50), val: getVal('appr_anticoagulant') },
    amiodarone: { type: sql.NVarChar(50), val: getVal('appr_amiodarone') },
    other_drug_name: { type: sql.VarChar(255), val: getVal('appr_other_drug_name') },
    other_drug_appropriateness: { type: sql.NVarChar(50), val: getVal('appr_other_drug_appropriateness') },

    // Notes:
    iccu_admission_note: { type: sql.NVarChar(255), val: getVal('appr_iccu_admission_note') },
    iccu_transfer_out_note: { type: sql.NVarChar(255), val: getVal('appr_iccu_transfer_out_note') },
    tlt_note: { type: sql.NVarChar(255), val: getVal('appr_thrombolysis_indication_note') },
    ptca_note: { type: sql.NVarChar(255), val: getVal('appr_ptca_indication_note') },
    invasive_monitoring_note: { type: sql.NVarChar(255), val: getVal('appr_invasive_monitoring_note') },
    iabp_note: { type: sql.NVarChar(255), val: getVal('appr_iabp_indication_note') },
    invasive_ventilation_note: { type: sql.NVarChar(255), val: getVal('appr_invasive_ventilation_note') },
    dialysis_note: { type: sql.NVarChar(255), val: getVal('appr_dialysis_indication_note') },
    any_other_procedure_note: { type: sql.NVarChar(255), val: getVal('appr_other_procedure_appropriateness_note') || getVal('appr_other_procedure_note') },
    cardiac_enzymes_note: { type: sql.NVarChar(255), val: getVal('appr_cardiac_enzymes_note') },
    bnp_note: { type: sql.NVarChar(255), val: getVal('appr_bnp_note') },
    crp_note: { type: sql.NVarChar(255), val: getVal('appr_crp_note') },
    lipid_profile_note: { type: sql.NVarChar(255), val: getVal('appr_lipid_profile_note') },
    bed_side_echo_note: { type: sql.NVarChar(255), val: getVal('appr_bedside_echo_note') || getVal('appr_bed_side_echo_note') },
    cxr_note: { type: sql.NVarChar(255), val: getVal('appr_chest_xray_note') || getVal('appr_cxr_note') },
    beta_blockers_note: { type: sql.NVarChar(255), val: getVal('appr_beta_blockers_note') },
    aspirin_note: { type: sql.NVarChar(255), val: getVal('appr_aspirin_note') },
    clopidogrel_note: { type: sql.NVarChar(255), val: getVal('appr_clopidogrel_note') },
    ace_inhibitor_note: { type: sql.NVarChar(255), val: getVal('appr_ace_inhibitor_note') },
    arb_note: { type: sql.NVarChar(255), val: getVal('appr_arb_note') },
    statin_note: { type: sql.NVarChar(255), val: getVal('appr_statin_note') },
    diuretic_note: { type: sql.NVarChar(255), val: getVal('appr_diuretic_note') },
    lanoxin_note: { type: sql.NVarChar(255), val: getVal('appr_lanoxin_note') },
    anticoagulant_note: { type: sql.NVarChar(255), val: getVal('appr_anticoagulant_note') },
    amiodarone_note: { type: sql.NVarChar(255), val: getVal('appr_amiodarone_note') },
    any_other_drug_note: { type: sql.NVarChar(255), val: getVal('appr_other_drug_appropriateness_note') || getVal('appr_other_drug_note') }
  };

  const reqAppr = new sql.Request(transaction);
  reqAppr.input(idField, sql.Int, idVal);

  const activeCols = [];
  for (const [colName, colMeta] of Object.entries(candidateInputs)) {
    if (existingCols.has(colName)) {
      activeCols.push(colName);
      reqAppr.input(colName, colMeta.type, colMeta.val !== undefined ? colMeta.val : null);
    }
  }

  if (isUpdate) {
    if (activeCols.length === 0) return;
    const setClause = activeCols.map(c => `[${c}] = @${c}`).join(', ');
    const updateSql = `
      UPDATE [${tableName}]
      SET ${setClause}${existingCols.has('updated_at') ? ', [updated_at] = GETDATE()' : ''}
      WHERE [${idField}] = @${idField};
    `;
    await reqAppr.query(updateSql);
  } else {
    const colList = [`[${idField}]`, ...activeCols.map(c => `[${c}]`)].join(', ');
    const valList = [`@${idField}`, ...activeCols.map(c => `@${c}`)].join(', ');
    const insertSql = `
      INSERT INTO [${tableName}] (
        ${colList}${existingCols.has('created_at') ? ', [created_at], [updated_at]' : ''}
      ) VALUES (
        ${valList}${existingCols.has('created_at') ? ', GETDATE(), GETDATE()' : ''}
      );
    `;
    await reqAppr.query(insertSql);
  }
}

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

    const toStr = (v) => (v !== undefined && v !== null && v !== '' ? String(v) : null);

    // Helper to convert boolean/string to 1 or 0 for BIT columns
    const bitVal = (key) => {
      const v = payload[key];
      if (v === true || v === 1 || v === '1' || v === 'Yes' || v === 'yes' || v === 'True') return 1;
      if (v === false || v === 0 || v === '0' || v === 'No' || v === 'no' || v === 'False') return 0;
      return null;
    };

    // Helper to convert to string ('Yes', 'No', 'Unknown', etc.)
    const strVal = (key, defaultVal = 'No') => {
      const v = payload[key];
      if (v === true || v === 1 || v === '1' || v === 'Yes' || v === 'yes' || v === 'True' || v === 'Done') return 'Yes';
      if (v === false || v === 0 || v === '0' || v === 'No' || v === 'no' || v === 'False' || v === 'Not done') return 'No';
      if (v === 'Unknown' || v === 'unknown') return 'Unknown';
      if (typeof v === 'string' && v.trim().length > 0) return v.trim();
      return defaultVal;
    };

    const admission_date = val('admission_date');
    const discharge_date = val('discharge_date');
    if (admission_date && discharge_date && new Date(discharge_date) < new Date(admission_date)) {
      return res.status(400).json({
        success: false,
        message: 'Discharge date cannot be earlier than Admission date.'
      });
    }

    const pool = await getPool();
    transaction = new sql.Transaction(pool);

    // 1. Begin Transaction
    await transaction.begin(sql.ISOLATION_LEVEL.READ_COMMITTED);

    // Generate next ip_no if not present, and handle acs_no
    let finalIpNo = val('ip_no');
    if (!finalIpNo) {
      const { recordset: maxIpRows } = await transaction.request().query(
        `SELECT TOP 1 [ip_no] 
         FROM [nstemi_registry] 
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
    const finalAcsNo = val('acs_no') || finalIpNo;

    // ==========================================
    // TABLE 1: nstemi_registry (Parent Table)
    // ==========================================
    const reqRegistry = new sql.Request(transaction);
    reqRegistry.input('reg_patient_id', sql.Int, val('reg_patient_id', 1));
    reqRegistry.input('acs_no', sql.VarChar(50), finalAcsNo);
    reqRegistry.input('ip_no', sql.VarChar(50), finalIpNo);
    reqRegistry.input('admission_date', sql.VarChar(50), admission_date);
    reqRegistry.input('discharge_date', sql.VarChar(50), discharge_date);
    reqRegistry.input('primary_consultant', sql.VarChar(150), val('primary_consultant'));
    reqRegistry.input('status', sql.Int, payload.status === 'draft' || payload.isDraft ? 2 : 0);

    const registryResult = await reqRegistry.query(`
      INSERT INTO [nstemi_registry] (
        [reg_patient_id], [acs_no], [ip_no], [admission_date], [discharge_date], [primary_consultant], [status]
      )
      OUTPUT INSERTED.[nstemi_id]
      VALUES (
        @reg_patient_id, @acs_no, @ip_no, @admission_date, @discharge_date, @primary_consultant, @status
      );
    `);

    const nstemi_id = registryResult.recordset[0].nstemi_id;

    // ==========================================
    // TABLE 2: nstemi_administrative
    // ==========================================
    const reqAdmin = new sql.Request(transaction);
    reqAdmin.input('nstemi_id', sql.Int, nstemi_id);
    reqAdmin.input('hypertension', sql.NVarChar(7), strVal('hypertension'));
    reqAdmin.input('diabetes', sql.NVarChar(7), strVal('diabetes'));
    reqAdmin.input('smoking', sql.NVarChar(7), strVal('smoking'));
    reqAdmin.input('renal_failure', sql.NVarChar(7), strVal('renal_failure'));
    reqAdmin.input('copd', sql.NVarChar(7), strVal('copd'));
    reqAdmin.input('cva', sql.NVarChar(7), strVal('cva'));
    reqAdmin.input('prior_acs', sql.NVarChar(7), strVal('prior_acs'));
    reqAdmin.input('prior_ptca', sql.NVarChar(7), strVal('prior_ptca'));
    reqAdmin.input('prior_cabg', sql.NVarChar(7), strVal('prior_cabg'));
    reqAdmin.input('other_background', sql.VarChar(255), val('other_background'));

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
    reqClinical.input('typical_angina', sql.NVarChar(3), strVal('typical_angina'));
    reqClinical.input('atypical_chest_pain', sql.NVarChar(3), strVal('atypical_chest_pain'));
    reqClinical.input('breathlessness', sql.NVarChar(3), strVal('breathlessness'));
    reqClinical.input('syncope_presyncope', sql.NVarChar(3), strVal('syncope_presyncope'));
    reqClinical.input('pulse_rate', sql.Int, val('pulse_rate') ? parseInt(val('pulse_rate')) : null);
    reqClinical.input('systolic_bp', sql.Int, val('systolic_bp') ? parseInt(val('systolic_bp')) : null);
    reqClinical.input('diastolic_bp', sql.Int, val('diastolic_bp') ? parseInt(val('diastolic_bp')) : null);
    
    // TIMI risk factors
    reqClinical.input('age_gt_75', sql.NVarChar(3), strVal('age_gt_75'));
    reqClinical.input('age_65_to_74', sql.NVarChar(3), strVal('age_65_to_74'));
    reqClinical.input('history_dm_htn_angina', sql.NVarChar(3), strVal('history_dm_htn_angina'));
    reqClinical.input('sbp_lt_100', sql.NVarChar(3), strVal('sbp_lt_100'));
    reqClinical.input('heart_rate_gt_100', sql.NVarChar(3), strVal('heart_rate_gt_100'));
    reqClinical.input('killip_class_ii_to_iv', sql.NVarChar(3), strVal('killip_class_ii_to_iv'));
    reqClinical.input('anterior_mi_or_lbbb', sql.NVarChar(3), strVal('anterior_mi_or_lbbb'));
    reqClinical.input('weight_lt_67kg', sql.NVarChar(3), strVal('weight_lt_67kg'));
    reqClinical.input('reperfusion_gt_4hrs', sql.NVarChar(3), strVal('reperfusion_gt_4hrs'));
    reqClinical.input('chd_risk_factors_ge_3', sql.NVarChar(3), strVal('chd_risk_factors_ge_3'));
    reqClinical.input('prior_coronary_stenosis_gt_50', sql.NVarChar(3), strVal('prior_coronary_stenosis_gt_50'));
    reqClinical.input('st_deviation_at_admission', sql.NVarChar(3), strVal('st_deviation_at_admission'));
    reqClinical.input('anginal_episodes_ge_2_last_24hrs', sql.NVarChar(3), strVal('anginal_episodes_ge_2_last_24hrs'));
    reqClinical.input('elevated_serum_cardiac_markers', sql.NVarChar(3), strVal('elevated_serum_cardiac_markers'));
    reqClinical.input('timi_total_score', sql.SmallInt, val('timi_total_score') !== null ? parseInt(val('timi_total_score')) : 0);

    // Complications
    reqClinical.input('lvf', sql.NVarChar(3), strVal('lvf'));
    reqClinical.input('vt_vf', sql.NVarChar(3), strVal('vt_vf'));
    reqClinical.input('bbb_chb', sql.NVarChar(3), strVal('bbb_chb'));
    reqClinical.input('elevated_bnp', sql.NVarChar(3), strVal('elevated_bnp'));
    reqClinical.input('elevated_crp', sql.NVarChar(3), strVal('elevated_crp'));

    await reqClinical.query(`
      INSERT INTO [nstemi_clinical_assessment] (
        [nstemi_id], [typical_angina], [atypical_chest_pain], [breathlessness], [syncope_presyncope],
        [pulse_rate], [systolic_bp], [diastolic_bp], [age_gt_75], [age_65_to_74], [history_dm_htn_angina],
        [sbp_lt_100], [heart_rate_gt_100], [killip_class_ii_to_iv], [anterior_mi_or_lbbb], [weight_lt_67kg],
        [reperfusion_gt_4hrs], [chd_risk_factors_ge_3], [prior_coronary_stenosis_gt_50],
        [st_deviation_at_admission], [anginal_episodes_ge_2_last_24hrs], [elevated_serum_cardiac_markers],
        [timi_total_score], [lvf], [vt_vf], [bbb_chb], [elevated_bnp], [elevated_crp]
      ) VALUES (
        @nstemi_id, @typical_angina, @atypical_chest_pain, @breathlessness, @syncope_presyncope,
        @pulse_rate, @systolic_bp, @diastolic_bp, @age_gt_75, @age_65_to_74, @history_dm_htn_angina,
        @sbp_lt_100, @heart_rate_gt_100, @killip_class_ii_to_iv, @anterior_mi_or_lbbb, @weight_lt_67kg,
        @reperfusion_gt_4hrs, @chd_risk_factors_ge_3, @prior_coronary_stenosis_gt_50,
        @st_deviation_at_admission, @anginal_episodes_ge_2_last_24hrs, @elevated_serum_cardiac_markers,
        @timi_total_score, @lvf, @vt_vf, @bbb_chb, @elevated_bnp, @elevated_crp
      );
    `);

    // ==========================================
    // TABLE 4: nstemi_diagnostics
    // ==========================================
    const reqDiag = new sql.Request(transaction);
    reqDiag.input('nstemi_id', sql.Int, nstemi_id);
    reqDiag.input('bedside_echo', sql.NVarChar(3), strVal('bedside_echo'));
    reqDiag.input('departmental_echo', sql.NVarChar(3), strVal('departmental_echo'));
    reqDiag.input('stress_testing', sql.NVarChar(3), strVal('stress_testing'));
    reqDiag.input('lipid_profile', sql.NVarChar(3), strVal('lipid_profile'));
    reqDiag.input('bnp', sql.NVarChar(3), strVal('bnp'));
    reqDiag.input('crp', sql.NVarChar(3), strVal('crp'));
    reqDiag.input('troponin_test', sql.NVarChar(3), strVal('troponin_test'));
    reqDiag.input('cpk_ckmb', sql.NVarChar(3), strVal('cpk_ckmb'));
    reqDiag.input('rft', sql.NVarChar(3), strVal('rft'));
    reqDiag.input('lft', sql.NVarChar(3), strVal('lft'));
    reqDiag.input('electrolytes', sql.NVarChar(3), strVal('electrolytes'));
    reqDiag.input('hemogram', sql.NVarChar(3), strVal('hemogram'));
    reqDiag.input('cxr', sql.NVarChar(3), strVal('cxr'));
    reqDiag.input('diagnostic_other', sql.VarChar(255), val('diagnostic_other'));

    // ECG Findings
    reqDiag.input('ecg_heart_rate', sql.Int, val('ecg_heart_rate') ? parseInt(val('ecg_heart_rate')) : null);
    reqDiag.input('av_block_none', sql.NVarChar(3), strVal('av_block_none'));
    reqDiag.input('av_block_first_degree', sql.NVarChar(3), strVal('av_block_first_degree'));
    reqDiag.input('av_block_second_degree', sql.NVarChar(3), strVal('av_block_second_degree'));
    reqDiag.input('av_block_chb', sql.NVarChar(3), strVal('av_block_chb'));
    reqDiag.input('bbb_none', sql.NVarChar(3), strVal('bbb_none'));
    reqDiag.input('bbb_rbbb', sql.NVarChar(3), strVal('bbb_rbbb'));
    reqDiag.input('bbb_lbbb', sql.NVarChar(3), strVal('bbb_lbbb'));
    reqDiag.input('bbb_indeterminate', sql.NVarChar(3), strVal('bbb_indeterminate'));
    reqDiag.input('qwaves_none', sql.NVarChar(3), strVal('qwaves_none'));
    reqDiag.input('qwaves_inferior', sql.NVarChar(3), strVal('qwaves_inferior'));
    reqDiag.input('qwaves_anteroseptal', sql.NVarChar(3), strVal('qwaves_anteroseptal'));
    reqDiag.input('qwaves_anterior', sql.NVarChar(3), strVal('qwaves_anterior'));
    reqDiag.input('qwaves_anterolateral', sql.NVarChar(3), strVal('qwaves_anterolateral'));
    reqDiag.input('qwaves_lateral', sql.NVarChar(3), strVal('qwaves_lateral'));
    reqDiag.input('st_depression_none', sql.NVarChar(3), strVal('st_depression_none'));
    reqDiag.input('st_depression_inferior', sql.NVarChar(3), strVal('st_depression_inferior'));
    reqDiag.input('st_depression_anteroseptal', sql.NVarChar(3), strVal('st_depression_anteroseptal'));
    reqDiag.input('st_depression_anterior', sql.NVarChar(3), strVal('st_depression_anterior'));
    reqDiag.input('st_depression_anterolateral', sql.NVarChar(3), strVal('st_depression_anterolateral'));
    reqDiag.input('st_depression_lateral', sql.NVarChar(3), strVal('st_depression_lateral'));
    reqDiag.input('t_inversion_none', sql.NVarChar(3), strVal('t_inversion_none'));
    reqDiag.input('t_inversion_inferior', sql.NVarChar(3), strVal('t_inversion_inferior'));
    reqDiag.input('t_inversion_anteroseptal', sql.NVarChar(3), strVal('t_inversion_anteroseptal'));
    reqDiag.input('t_inversion_anterior', sql.NVarChar(3), strVal('t_inversion_anterior'));
    reqDiag.input('t_inversion_anterolateral', sql.NVarChar(3), strVal('t_inversion_anterolateral'));
    reqDiag.input('t_inversion_lateral', sql.NVarChar(3), strVal('t_inversion_lateral'));
    reqDiag.input('rhythm_nsr', sql.NVarChar(3), strVal('rhythm_nsr'));
    reqDiag.input('rhythm_af', sql.NVarChar(3), strVal('rhythm_af'));
    reqDiag.input('rhythm_svt', sql.NVarChar(3), strVal('rhythm_svt'));
    reqDiag.input('rhythm_vt', sql.NVarChar(3), strVal('rhythm_vt'));
    reqDiag.input('rhythm_vf', sql.NVarChar(3), strVal('rhythm_vf'));
    reqDiag.input('ecg_other', sql.NVarChar(sql.MAX), val('ecg_other'));

    // Echo Findings
    reqDiag.input('echo_ef', sql.Decimal(5, 2), val('echo_ef') ? parseFloat(val('echo_ef')) : null);
    reqDiag.input('lv_function_normal', sql.NVarChar(3), strVal('lv_function_normal'));
    reqDiag.input('lv_function_mild_lvd', sql.NVarChar(3), strVal('lv_function_mild_lvd'));
    reqDiag.input('lv_function_moderate_lvd', sql.NVarChar(3), strVal('lv_function_moderate_lvd'));
    reqDiag.input('lv_function_severe_lvd', sql.NVarChar(3), strVal('lv_function_severe_lvd'));
    reqDiag.input('rwma_lad', sql.NVarChar(3), strVal('rwma_lad'));
    reqDiag.input('rwma_rca', sql.NVarChar(3), strVal('rwma_rca'));
    reqDiag.input('rwma_lcx', sql.NVarChar(3), strVal('rwma_lcx'));
    reqDiag.input('mr_none', sql.NVarChar(3), strVal('mr_none'));
    reqDiag.input('mr_mild', sql.NVarChar(3), strVal('mr_mild'));
    reqDiag.input('mr_moderate', sql.NVarChar(3), strVal('mr_moderate'));
    reqDiag.input('mr_severe', sql.NVarChar(3), strVal('mr_severe'));
    reqDiag.input('echo_e', sql.Decimal(5, 2), val('echo_e') ? parseFloat(val('echo_e')) : null);
    reqDiag.input('echo_a', sql.Decimal(5, 2), val('echo_a') ? parseFloat(val('echo_a')) : null);
    reqDiag.input('echo_dt', sql.Decimal(5, 2), val('echo_dt') ? parseFloat(val('echo_dt')) : null);
    reqDiag.input('echo_e_prime', sql.Decimal(5, 2), val('echo_e_prime') ? parseFloat(val('echo_e_prime')) : null);
    reqDiag.input('echo_tapsv', sql.Decimal(5, 2), val('echo_tapsv') ? parseFloat(val('echo_tapsv')) : null);
    reqDiag.input('echo_other', sql.NVarChar(sql.MAX), val('echo_other'));

    // Blood Labs
    reqDiag.input('hemoglobin', sql.Decimal(5, 2), val('hemoglobin') ? parseFloat(val('hemoglobin')) : null);
    reqDiag.input('creatinine', sql.Decimal(5, 2), val('creatinine') ? parseFloat(val('creatinine')) : null);
    reqDiag.input('troponin_i', sql.VarChar(50), toStr(val('troponin_i')));
    reqDiag.input('cpk', sql.VarChar(50), toStr(val('cpk')));
    reqDiag.input('ck_mb', sql.VarChar(50), toStr(val('ck_mb')));
    reqDiag.input('sodium', sql.Decimal(5, 2), val('sodium') ? parseFloat(val('sodium')) : null);
    reqDiag.input('potassium', sql.Decimal(5, 2), val('potassium') ? parseFloat(val('potassium')) : null);
    reqDiag.input('rbs_admission', sql.Decimal(5, 2), val('rbs_admission') ? parseFloat(val('rbs_admission')) : null);

    // Angiogram
    reqDiag.input('angiogram_done', sql.NVarChar(3), strVal('angiogram_done'));
    reqDiag.input('angiogram_normal', sql.NVarChar(3), strVal('angiogram_normal'));
    reqDiag.input('angiogram_1vd', sql.NVarChar(3), strVal('angiogram_1vd'));
    reqDiag.input('angiogram_2vd', sql.NVarChar(3), strVal('angiogram_2vd'));
    reqDiag.input('angiogram_3vd', sql.NVarChar(3), strVal('angiogram_3vd'));
    reqDiag.input('angiogram_lmca', sql.NVarChar(3), strVal('angiogram_lmca'));

    await reqDiag.query(`
      INSERT INTO [nstemi_diagnostics] (
        [nstemi_id], [bedside_echo], [departmental_echo], [stress_testing], [lipid_profile],
        [bnp], [crp], [troponin_test], [cpk_ckmb], [rft], [lft], [electrolytes], [hemogram], [cxr],
        [diagnostic_other], [ecg_heart_rate], [av_block_none], [av_block_first_degree],
        [av_block_second_degree], [av_block_chb], [bbb_none], [bbb_rbbb], [bbb_lbbb], [bbb_indeterminate],
        [qwaves_none], [qwaves_inferior], [qwaves_anteroseptal], [qwaves_anterior], [qwaves_anterolateral],
        [qwaves_lateral], [st_depression_none], [st_depression_inferior], [st_depression_anteroseptal],
        [st_depression_anterior], [st_depression_anterolateral], [st_depression_lateral], [t_inversion_none],
        [t_inversion_inferior], [t_inversion_anteroseptal], [t_inversion_anterior], [t_inversion_anterolateral],
        [t_inversion_lateral], [rhythm_nsr], [rhythm_af], [rhythm_svt], [rhythm_vt], [rhythm_vf],
        [ecg_other], [echo_ef], [lv_function_normal], [lv_function_mild_lvd], [lv_function_moderate_lvd],
        [lv_function_severe_lvd], [rwma_lad], [rwma_rca], [rwma_lcx], [mr_none], [mr_mild], [mr_moderate],
        [mr_severe], [echo_e], [echo_a], [echo_dt], [echo_e_prime], [echo_tapsv], [echo_other],
        [hemoglobin], [creatinine], [troponin_i], [cpk], [ck_mb], [sodium], [potassium], [rbs_admission],
        [angiogram_done], [angiogram_normal], [angiogram_1vd], [angiogram_2vd], [angiogram_3vd], [angiogram_lmca]
      ) VALUES (
        @nstemi_id, @bedside_echo, @departmental_echo, @stress_testing, @lipid_profile,
        @bnp, @crp, @troponin_test, @cpk_ckmb, @rft, @lft, @electrolytes, @hemogram, @cxr,
        @diagnostic_other, @ecg_heart_rate, @av_block_none, @av_block_first_degree,
        @av_block_second_degree, @av_block_chb, @bbb_none, @bbb_rbbb, @bbb_lbbb, @bbb_indeterminate,
        @qwaves_none, @qwaves_inferior, @qwaves_anteroseptal, @qwaves_anterior, @qwaves_anterolateral,
        @qwaves_lateral, @st_depression_none, @st_depression_inferior, @st_depression_anteroseptal,
        @st_depression_anterior, @st_depression_anterolateral, @st_depression_lateral, @t_inversion_none,
        @t_inversion_inferior, @t_inversion_anteroseptal, @t_inversion_anterior, @t_inversion_anterolateral,
        @t_inversion_lateral, @rhythm_nsr, @rhythm_af, @rhythm_svt, @rhythm_vt, @rhythm_vf,
        @ecg_other, @echo_ef, @lv_function_normal, @lv_function_mild_lvd, @lv_function_moderate_lvd,
        @lv_function_severe_lvd, @rwma_lad, @rwma_rca, @rwma_lcx, @mr_none, @mr_mild, @mr_moderate,
        @mr_severe, @echo_e, @echo_a, @echo_dt, @echo_e_prime, @echo_tapsv, @echo_other,
        @hemoglobin, @creatinine, @troponin_i, @cpk, @ck_mb, @sodium, @potassium, @rbs_admission,
        @angiogram_done, @angiogram_normal, @angiogram_1vd, @angiogram_2vd, @angiogram_3vd, @angiogram_lmca
      );
    `);

    // ==========================================
    // TABLE 5: nstemi_treatment_strategy
    // ==========================================
    const reqTx = new sql.Request(transaction);
    reqTx.input('nstemi_id', sql.Int, nstemi_id);
    reqTx.input('pami', sql.NVarChar(3), strVal('pami'));
    reqTx.input('thrombolysis', sql.NVarChar(3), strVal('thrombolysis'));
    reqTx.input('conservative', sql.NVarChar(3), strVal('conservative'));
    reqTx.input('door_to_balloon_time', sql.Int, val('door_to_balloon_time') ? parseInt(val('door_to_balloon_time')) : null);
    
    // Vessels
    reqTx.input('vessel_lmca', sql.NVarChar(3), strVal('vessel_lmca'));
    reqTx.input('vessel_lad', sql.NVarChar(3), strVal('vessel_lad'));
    reqTx.input('vessel_diagonal', sql.NVarChar(3), strVal('vessel_diagonal'));
    reqTx.input('vessel_lcx', sql.NVarChar(3), strVal('vessel_lcx'));
    reqTx.input('vessel_ramus', sql.NVarChar(3), strVal('vessel_ramus'));
    reqTx.input('vessel_om', sql.NVarChar(3), strVal('vessel_om'));
    reqTx.input('vessel_rca', sql.NVarChar(3), strVal('vessel_rca'));
    reqTx.input('vessel_pda', sql.NVarChar(3), strVal('vessel_pda'));
    reqTx.input('vessel_segment', sql.VarChar(100), val('vessel_segment'));

    // Intervention Specs
    reqTx.input('thrombosuction_done', sql.NVarChar(3), strVal('thrombosuction_done'));
    reqTx.input('thrombosuction_not_done', sql.NVarChar(3), strVal('thrombosuction_not_done'));
    reqTx.input('stent_bms', sql.NVarChar(3), strVal('stent_bms'));
    reqTx.input('stent_des', sql.NVarChar(3), strVal('stent_des'));
    reqTx.input('stent_diameter', sql.Decimal(5, 2), val('stent_diameter') ? parseFloat(val('stent_diameter')) : null);
    reqTx.input('stent_length', sql.Decimal(5, 2), val('stent_length') ? parseFloat(val('stent_length')) : null);
    reqTx.input('procedural_success', sql.NVarChar(3), strVal('procedural_success'));
    reqTx.input('timi_flow', sql.TinyInt, val('timi_flow') !== null ? parseInt(val('timi_flow')) : null);

    // Complications
    reqTx.input('complication_none', sql.NVarChar(3), strVal('complication_none'));
    reqTx.input('complication_tamponade', sql.NVarChar(3), strVal('complication_tamponade'));
    reqTx.input('complication_major_bleed', sql.NVarChar(3), strVal('complication_major_bleed'));
    reqTx.input('complication_stroke', sql.NVarChar(3), strVal('complication_stroke'));
    reqTx.input('complication_stent_thrombosis', sql.NVarChar(3), strVal('complication_stent_thrombosis'));
    reqTx.input('complication_mi', sql.NVarChar(3), strVal('complication_mi'));
    reqTx.input('complication_death', sql.NVarChar(3), strVal('complication_death'));
    reqTx.input('complication_emergency_cabg', sql.NVarChar(3), strVal('complication_emergency_cabg'));

    // Thrombolysis
    reqTx.input('door_to_needle_time', sql.Int, val('door_to_needle_time') ? parseInt(val('door_to_needle_time')) : null);
    reqTx.input('drug_stk', sql.NVarChar(3), strVal('drug_stk'));
    reqTx.input('drug_uk', sql.NVarChar(3), strVal('drug_uk'));
    reqTx.input('drug_reteplase', sql.NVarChar(3), strVal('drug_reteplase'));
    reqTx.input('drug_tenecteplase', sql.NVarChar(3), strVal('drug_tenecteplase'));
    reqTx.input('thrombolysis_dose', sql.VarChar(100), val('thrombolysis_dose'));

    // Medical Therapy
    reqTx.input('beta_blocker', sql.NVarChar(3), strVal('beta_blocker'));
    reqTx.input('calcium_channel_blocker', sql.NVarChar(3), strVal('calcium_channel_blocker'));
    reqTx.input('nitrate', sql.NVarChar(3), strVal('nitrate'));
    reqTx.input('nicorandil', sql.NVarChar(3), strVal('nicorandil'));
    reqTx.input('ivabradine', sql.NVarChar(3), strVal('ivabradine'));
    reqTx.input('ranolazine', sql.NVarChar(3), strVal('ranolazine'));
    reqTx.input('trimetazidine', sql.NVarChar(3), strVal('trimetazidine'));
    reqTx.input('aspirin', sql.NVarChar(3), strVal('aspirin'));
    reqTx.input('clopidogrel', sql.NVarChar(3), strVal('clopidogrel'));
    reqTx.input('prasugrel', sql.NVarChar(3), strVal('prasugrel'));
    reqTx.input('ticagrelor', sql.NVarChar(3), strVal('ticagrelor'));
    reqTx.input('heparin_ufh_iv', sql.NVarChar(3), strVal('heparin_ufh_iv'));
    reqTx.input('heparin_ufh_sc', sql.NVarChar(3), strVal('heparin_ufh_sc'));
    reqTx.input('heparin_lmwh', sql.NVarChar(3), strVal('heparin_lmwh'));
    reqTx.input('heparin_ufh_iv_sc', sql.NVarChar(3), strVal('heparin_ufh_iv_sc'));
    reqTx.input('heparin_ufh_iv_lmwh', sql.NVarChar(3), strVal('heparin_ufh_iv_lmwh'));
    reqTx.input('gp2b3a', sql.NVarChar(3), strVal('gp2b3a'));
    reqTx.input('bivaluridin', sql.NVarChar(3), strVal('bivaluridin')); // database spelling with 'u'
    reqTx.input('statin', sql.NVarChar(3), strVal('statin'));
    reqTx.input('statin_10mg', sql.NVarChar(3), strVal('statin_10mg'));
    reqTx.input('statin_20mg', sql.NVarChar(3), strVal('statin_20mg'));
    reqTx.input('statin_40mg', sql.NVarChar(3), strVal('statin_40mg'));
    reqTx.input('statin_80mg', sql.NVarChar(3), strVal('statin_80mg'));
    reqTx.input('other_drugs', sql.VarChar(255), val('other_drugs'));

    // Procedures Done
    reqTx.input('cag', sql.NVarChar(3), strVal('cag'));
    reqTx.input('iabp', sql.NVarChar(3), strVal('iabp'));
    reqTx.input('invasive_ventilation', sql.NVarChar(3), strVal('invasive_ventilation'));
    reqTx.input('ptca', sql.NVarChar(3), strVal('ptca'));
    reqTx.input('cabg', sql.NVarChar(3), strVal('cabg'));
    reqTx.input('other_procedure', sql.VarChar(255), val('other_procedure'));

    await reqTx.query(`
      INSERT INTO [nstemi_treatment_strategy] (
        [nstemi_id], [pami], [thrombolysis], [conservative], [door_to_balloon_time],
        [vessel_lmca], [vessel_lad], [vessel_diagonal], [vessel_lcx], [vessel_ramus], [vessel_om],
        [vessel_rca], [vessel_pda], [vessel_segment], [thrombosuction_done], [thrombosuction_not_done],
        [stent_bms], [stent_des], [stent_diameter], [stent_length], [procedural_success], [timi_flow],
        [complication_none], [complication_tamponade], [complication_major_bleed], [complication_stroke],
        [complication_stent_thrombosis], [complication_mi], [complication_death], [complication_emergency_cabg],
        [door_to_needle_time], [drug_stk], [drug_uk], [drug_reteplase], [drug_tenecteplase], [thrombolysis_dose],
        [beta_blocker], [calcium_channel_blocker], [nitrate], [nicorandil], [ivabradine], [ranolazine],
        [trimetazidine], [aspirin], [clopidogrel], [prasugrel], [ticagrelor], [heparin_ufh_iv],
        [heparin_ufh_sc], [heparin_lmwh], [heparin_ufh_iv_sc], [heparin_ufh_iv_lmwh], [gp2b3a],
        [bivaluridin], [statin], [statin_10mg], [statin_20mg], [statin_40mg], [statin_80mg], [other_drugs],
        [cag], [iabp], [invasive_ventilation], [ptca], [cabg], [other_procedure]
      ) VALUES (
        @nstemi_id, @pami, @thrombolysis, @conservative, @door_to_balloon_time,
        @vessel_lmca, @vessel_lad, @vessel_diagonal, @vessel_lcx, @vessel_ramus, @vessel_om,
        @vessel_rca, @vessel_pda, @vessel_segment, @thrombosuction_done, @thrombosuction_not_done,
        @stent_bms, @stent_des, @stent_diameter, @stent_length, @procedural_success, @timi_flow,
        @complication_none, @complication_tamponade, @complication_major_bleed, @complication_stroke,
        @complication_stent_thrombosis, @complication_mi, @complication_death, @complication_emergency_cabg,
        @door_to_needle_time, @drug_stk, @drug_uk, @drug_reteplase, @drug_tenecteplase, @thrombolysis_dose,
        @beta_blocker, @calcium_channel_blocker, @nitrate, @nicorandil, @ivabradine, @ranolazine,
        @trimetazidine, @aspirin, @clopidogrel, @prasugrel, @ticagrelor, @heparin_ufh_iv,
        @heparin_ufh_sc, @heparin_lmwh, @heparin_ufh_iv_sc, @heparin_ufh_iv_lmwh, @gp2b3a,
        @bivaluridin, @statin, @statin_10mg, @statin_20mg, @statin_40mg, @statin_80mg, @other_drugs,
        @cag, @iabp, @invasive_ventilation, @ptca, @cabg, @other_procedure
      );
    `);

    // ==========================================
    // TABLE 6: nstemi_hospitalization
    // ==========================================
    const reqHosp = new sql.Request(transaction);
    reqHosp.input('nstemi_id', sql.Int, nstemi_id);
    reqHosp.input('iccu_hours', sql.Decimal(5, 2), val('iccu_hours') ? parseFloat(val('iccu_hours')) : null);
    reqHosp.input('stepdown_icu_hours', sql.Decimal(5, 2), val('stepdown_icu_hours') ? parseFloat(val('stepdown_icu_hours')) : null);
    reqHosp.input('floor_days', sql.Decimal(5, 2), val('floor_days') ? parseFloat(val('floor_days')) : null);
    reqHosp.input('total_hospital_stay_days', sql.Decimal(5, 2), val('total_hospital_stay_days') ? parseFloat(val('total_hospital_stay_days')) : null);
    
    // Costs
    reqHosp.input('bed_charges', sql.Decimal(12, 2), val('bed_charges') ? parseFloat(val('bed_charges')) : null);
    reqHosp.input('drugs_disposables_cost', sql.Decimal(12, 2), val('drugs_disposables_cost') ? parseFloat(val('drugs_disposables_cost')) : null);
    reqHosp.input('package_cost', sql.Decimal(12, 2), val('package_cost') ? parseFloat(val('package_cost')) : null);
    reqHosp.input('laboratory_cost', sql.Decimal(12, 2), val('laboratory_cost') ? parseFloat(val('laboratory_cost')) : null);
    reqHosp.input('non_invasive_lab_cost', sql.Decimal(12, 2), val('non_invasive_lab_cost') ? parseFloat(val('non_invasive_lab_cost')) : null);
    reqHosp.input('consultation_cost', sql.Decimal(12, 2), val('consultation_cost') ? parseFloat(val('consultation_cost')) : null);
    reqHosp.input('radiology_cost', sql.Decimal(12, 2), val('radiology_cost') ? parseFloat(val('radiology_cost')) : null);
    reqHosp.input('miscellaneous_cost', sql.Decimal(12, 2), val('miscellaneous_cost') ? parseFloat(val('miscellaneous_cost')) : null);
    reqHosp.input('total_cost', sql.Decimal(12, 2), val('total_cost') ? parseFloat(val('total_cost')) : null);

    await reqHosp.query(`
      INSERT INTO [nstemi_hospitalization] (
        [nstemi_id], [iccu_hours], [stepdown_icu_hours], [floor_days], [total_hospital_stay_days],
        [bed_charges], [drugs_disposables_cost], [package_cost], [laboratory_cost],
        [non_invasive_lab_cost], [consultation_cost], [radiology_cost], [miscellaneous_cost], [total_cost]
      ) VALUES (
        @nstemi_id, @iccu_hours, @stepdown_icu_hours, @floor_days, @total_hospital_stay_days,
        @bed_charges, @drugs_disposables_cost, @package_cost, @laboratory_cost,
        @non_invasive_lab_cost, @consultation_cost, @radiology_cost, @miscellaneous_cost, @total_cost
      );
    `);

    // ==========================================
    // TABLE 7: nstemi_outcomes
    // ==========================================
    const reqOutcomes = new sql.Request(transaction);
    reqOutcomes.input('nstemi_id', sql.Int, nstemi_id);
    reqOutcomes.input('death', sql.NVarChar(3), strVal('death'));
    reqOutcomes.input('stemi_for_nonstemi', sql.NVarChar(3), strVal('stemi_for_nonstemi'));
    reqOutcomes.input('remi_for_nstemi', sql.NVarChar(3), strVal('remi_for_nstemi'));
    reqOutcomes.input('revascularization_recurrent_ischemia', sql.NVarChar(3), strVal('revascularization_recurrent_ischemia'));
    reqOutcomes.input('cva_thrombotic', sql.NVarChar(3), strVal('cva_thrombotic'));
    reqOutcomes.input('cva_hemorrhagic', sql.NVarChar(3), strVal('cva_hemorrhagic'));
    reqOutcomes.input('major_bleeding', sql.NVarChar(3), strVal('major_bleeding'));
    reqOutcomes.input('outcome_other', sql.VarChar(255), val('outcome_other'));

    // Discharge Medications
    reqOutcomes.input('beta_blocker', sql.NVarChar(3), strVal('discharge_beta_blocker'));
    reqOutcomes.input('calcium_channel_blocker', sql.NVarChar(3), strVal('discharge_calcium_channel_blocker'));
    reqOutcomes.input('nitrate', sql.NVarChar(3), strVal('discharge_nitrate'));
    reqOutcomes.input('nicorandil', sql.NVarChar(3), strVal('discharge_nicorandil'));
    reqOutcomes.input('ivabradine', sql.NVarChar(3), strVal('discharge_ivabradine'));
    reqOutcomes.input('ranolazine', sql.NVarChar(3), strVal('discharge_ranolazine'));
    reqOutcomes.input('trimetazidine', sql.NVarChar(3), strVal('discharge_trimetazidine'));
    reqOutcomes.input('aspirin', sql.NVarChar(3), strVal('discharge_aspirin'));
    reqOutcomes.input('clopidogrel', sql.NVarChar(3), strVal('discharge_clopidogrel'));
    reqOutcomes.input('prasugrel', sql.NVarChar(3), strVal('discharge_prasugrel'));
    reqOutcomes.input('ticagrelor', sql.NVarChar(3), strVal('discharge_ticagrelor'));
    reqOutcomes.input('statin', sql.NVarChar(3), strVal('discharge_statin'));
    reqOutcomes.input('statin_10mg', sql.NVarChar(3), strVal('discharge_statin_10mg'));
    reqOutcomes.input('statin_20mg', sql.NVarChar(3), strVal('discharge_statin_20mg'));
    reqOutcomes.input('statin_40mg', sql.NVarChar(3), strVal('discharge_statin_40mg'));
    reqOutcomes.input('statin_80mg', sql.NVarChar(3), strVal('discharge_statin_80mg'));
    reqOutcomes.input('discharge_other_medication', sql.VarChar(255), val('discharge_other_medication'));

    await reqOutcomes.query(`
      INSERT INTO [nstemi_outcomes] (
        [nstemi_id], [death], [stemi_for_nonstemi], [remi_for_nstemi],
        [revascularization_recurrent_ischemia], [cva_thrombotic], [cva_hemorrhagic], [major_bleeding],
        [outcome_other], [beta_blocker], [calcium_channel_blocker], [nitrate], [nicorandil], [ivabradine],
        [ranolazine], [trimetazidine], [aspirin], [clopidogrel], [prasugrel], [ticagrelor], [statin],
        [statin_10mg], [statin_20mg], [statin_40mg], [statin_80mg], [discharge_other_medication]
      ) VALUES (
        @nstemi_id, @death, @stemi_for_nonstemi, @remi_for_nstemi,
        @revascularization_recurrent_ischemia, @cva_thrombotic, @cva_hemorrhagic, @major_bleeding,
        @outcome_other, @beta_blocker, @calcium_channel_blocker, @nitrate, @nicorandil, @ivabradine,
        @ranolazine, @trimetazidine, @aspirin, @clopidogrel, @prasugrel, @ticagrelor, @statin,
        @statin_10mg, @statin_20mg, @statin_40mg, @statin_80mg, @discharge_other_medication
      );
    `);

    // ==========================================
    // TABLE 9: nstemi_appropriateness
    // ==========================================
    await saveAppropriatenessHelper(transaction, 'nstemi_appropriateness', 'nstemi_id', nstemi_id, false, val);

    // ==========================================
    // TABLE 8: nstemi_followup (4 rows)
    // ==========================================
    const visitMode = val('visit_mode', null) || (req.body.followup?.[0]?.visit_mode ?? 'In-Person');
    const specialInstructions = val('special_instructions', null) || val('special_clinical_instructions', null) || (req.body.followup?.[0]?.special_instructions ?? '');
    const baseDate = val('discharge_date', null) || val('admission_date', null);

    const monthMap = {
      '1-Month': 1, '1-month': 1, '1m': 1,
      '3-Month': 3, '3-month': 3, '3m': 3,
      '6-Month': 6, '6-month': 6, '6m': 6,
      '12-Month': 12, '12-month': 12, '12m': 12
    };

    const calculateBackendExpectedDate = (baseDateStr, months) => {
      if (!baseDateStr || !months) return null;
      try {
        const d = new Date(baseDateStr);
        if (isNaN(d.getTime())) return null;
        d.setMonth(d.getMonth() + months);
        if (d.getDay() === 0) d.setDate(d.getDate() + 1);
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
      } catch (e) {
        return null;
      }
    };

    const rawFollowupRows = Array.isArray(req.body.followup)
      ? req.body.followup
      : typeof req.body.followup === 'object' && req.body.followup !== null
      ? Object.values(req.body.followup)
      : [];

    const regPid = parseInt(val('reg_patient_id', 1), 10);
    const baseFollowupDate = discharge_date || admission_date;

    for (const row of rawFollowupRows) {
      if (!row || !row.followup_month) continue;
      const followupMonth = row.followup_month;
      const monthsToAdd = monthMap[followupMonth] || 1;

      const reqFollowup = new sql.Request(transaction);
      reqFollowup.input('nstemi_id', sql.Int, nstemi_id);
      reqFollowup.input('reg_patient_id', sql.Int, regPid);
      reqFollowup.input('followup_month', sql.NVarChar(50), followupMonth);
      reqFollowup.input('angina', sql.VarChar(50), row.angina || 'No');
      reqFollowup.input('functional_class', sql.VarChar(50), row.functional_class || 'None');
      reqFollowup.input('number_of_antianginals', sql.Int, row.number_of_antianginals !== undefined && row.number_of_antianginals !== null && row.number_of_antianginals !== '' ? parseInt(row.number_of_antianginals, 10) : null);
      reqFollowup.input('dual_antiplatelets', sql.NVarChar(50), row.dual_antiplatelets || 'No');
      reqFollowup.input('statins', sql.NVarChar(50), row.statins || 'No');
      reqFollowup.input('beta_blocker', sql.NVarChar(50), row.beta_blocker || 'No');
      reqFollowup.input('acei_arb', sql.NVarChar(50), row.acei_arb || 'No');
      reqFollowup.input('aldosterone_antagonist', sql.NVarChar(50), row.aldosterone_antagonist || 'No');
      reqFollowup.input('acs_hospitalization', sql.NVarChar(50), row.acs_hospitalization || 'No');
      reqFollowup.input('ptca', sql.NVarChar(50), row.ptca || 'No');
      reqFollowup.input('cabg', sql.NVarChar(50), row.cabg || 'No');
      reqFollowup.input('death', sql.NVarChar(50), row.death || 'No');
      reqFollowup.input('other_event', sql.NVarChar(255), row.other_event || '');
      reqFollowup.input('visit_mode', sql.VarChar(50), row.visit_mode || val('visit_mode', null) || 'In-Person');
      reqFollowup.input('special_instructions', sql.NVarChar(500), row.special_instructions !== undefined && row.special_instructions !== null && row.special_instructions !== '' ? row.special_instructions : (val('special_instructions', null) || val('special_clinical_instructions', null) || 'Follow-up in cardiology OPD with repeat lipid profile and ECG.'));

      let finalFollowupDate = row.followup_date;
      if (!finalFollowupDate && baseFollowupDate) {
        finalFollowupDate = calculateBackendExpectedDate(baseFollowupDate, monthsToAdd);
      }
      if (typeof finalFollowupDate === 'string') {
        finalFollowupDate = finalFollowupDate.trim();
        if (finalFollowupDate.includes('T')) finalFollowupDate = finalFollowupDate.split('T')[0];
        if (finalFollowupDate === '' || finalFollowupDate === 'null' || finalFollowupDate === 'undefined') {
          finalFollowupDate = null;
        }
      }
      reqFollowup.input('followup_date', sql.Date, finalFollowupDate ? new Date(finalFollowupDate) : null);

      await reqFollowup.query(`
        -- 1. UPSERT into nstemi_followup
        IF EXISTS (
          SELECT 1 FROM [nstemi_followup] 
          WHERE [nstemi_id] = @nstemi_id AND [followup_month] = @followup_month
        )
        BEGIN
          UPDATE [nstemi_followup]
          SET
            [followup_date] = @followup_date,
            [angina] = @angina,
            [functional_class] = @functional_class,
            [number_of_antianginals] = @number_of_antianginals,
            [dual_antiplatelets] = @dual_antiplatelets,
            [statins] = @statins,
            [beta_blocker] = @beta_blocker,
            [acei_arb] = @acei_arb,
            [aldosterone_antagonist] = @aldosterone_antagonist,
            [acs_hospitalization] = @acs_hospitalization,
            [ptca] = @ptca,
            [cabg] = @cabg,
            [death] = @death,
            [other_event] = @other_event,
            [visit_mode] = @visit_mode,
            [special_instructions] = @special_instructions,
            [updated_at] = GETDATE()
          WHERE [nstemi_id] = @nstemi_id AND [followup_month] = @followup_month;
        END
        ELSE
        BEGIN
          INSERT INTO [nstemi_followup] (
            [nstemi_id], [followup_month], [followup_date], [angina], [functional_class], [number_of_antianginals],
            [dual_antiplatelets], [statins], [beta_blocker], [acei_arb], [aldosterone_antagonist],
            [acs_hospitalization], [ptca], [cabg], [death], [other_event],
            [visit_mode], [special_instructions], [created_at], [updated_at]
          ) VALUES (
            @nstemi_id, @followup_month, @followup_date, @angina, @functional_class, @number_of_antianginals,
            @dual_antiplatelets, @statins, @beta_blocker, @acei_arb, @aldosterone_antagonist,
            @acs_hospitalization, @ptca, @cabg, @death, @other_event,
            @visit_mode, @special_instructions, GETDATE(), GETDATE()
          );
        END

        -- 2. Synchronize into patient_followup_tasks checking both patientId and timeframe
        IF EXISTS (
          SELECT 1 FROM [patient_followup_tasks]
          WHERE [reg_patient_id] = @reg_patient_id AND [timeframe] = @followup_month AND [source_registry] = 'NSTEMI Registry'
        )
        BEGIN
          UPDATE [patient_followup_tasks]
          SET
            [target_date] = @followup_date,
            [visit_mode] = @visit_mode,
            [special_instructions] = @special_instructions,
            [source_record_id] = @nstemi_id,
            [updated_at] = GETDATE()
          WHERE [reg_patient_id] = @reg_patient_id AND [timeframe] = @followup_month AND [source_registry] = 'NSTEMI Registry';
        END
        ELSE
        BEGIN
          SET IDENTITY_INSERT [patient_followup_tasks] ON;

          DECLARE @nextTaskId INT;
          SELECT @nextTaskId = ISNULL(MAX(task_id), 0) + 1 FROM [patient_followup_tasks] WITH (TABLOCKX, HOLDLOCK);

          INSERT INTO [patient_followup_tasks] (
            [task_id], [reg_patient_id], [source_registry], [source_record_id], [is_followup_required],
            [timeframe], [target_date], [clinic_location], [visit_mode], [special_instructions],
            [status], [created_at], [updated_at]
          ) VALUES (
            @nextTaskId, @reg_patient_id, 'NSTEMI Registry', @nstemi_id, 'Yes',
            @followup_month, @followup_date, 'CARE Heart Institute', @visit_mode, @special_instructions,
            'Required', GETDATE(), GETDATE()
          );

          SET IDENTITY_INSERT [patient_followup_tasks] OFF;
        END
      `);
    }

    // Commit Transaction
    await transaction.commit();

    logAuditTrail(
      req,
      'CREATE',
      'NSTEMI',
      finalIpNo || finalAcsNo || nstemi_id,
      val('reg_patient_id', 1),
      null,
      payload
    ).catch(err => console.error('[NSTEMI Audit] Create error:', err));

    return res.status(201).json({
      success: true,
      message: 'NSTEMI Registry record successfully created across all 9 modular tables.',
      data: {
        nstemi_id,
        reg_patient_id: val('reg_patient_id', 1),
        acs_no: finalIpNo
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

async function getNstemiHistory(req, res) {
  try {
    const regPatientId = req.params.regPatientId;
    const pool = await getPool();
    const result = await pool.request()
      .input('regPatientId', sql.Int, regPatientId)
      .query(`
        SELECT n.nstemi_id, n.acs_no, n.ip_no, n.admission_date, n.discharge_date, n.created_at,
               n.[status],
               p.patient_name
        FROM nstemi_registry n
        LEFT JOIN patient_demographics p ON p.reg_patient_id = n.reg_patient_id
        WHERE n.reg_patient_id = @regPatientId
        ORDER BY n.created_at DESC
      `);
    const historyData = result.recordset.map(row => {
      let statusStr = 'final';
      if (row.status === 2) statusStr = 'draft';
      else if (row.status === 1) statusStr = 'deleted';
      return { ...row, status: statusStr, is_deleted: row.status === 1 };
    });
    return res.status(200).json({
      success: true,
      data: historyData
    });
  } catch (error) {
    console.error('Error fetching NSTEMI history:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Internal server error while fetching NSTEMI history.'
    });
  }
}

async function getNstemiRecord(req, res) {
  try {
    const nstemi_id = req.params.id;
    const pool = await getPool();
    
    const tables = [
      'nstemi_registry',
      'nstemi_administrative',
      'nstemi_clinical_assessment',
      'nstemi_diagnostics',
      'nstemi_treatment_strategy',
      'nstemi_hospitalization',
      'nstemi_outcomes',
      'nstemi_appropriateness'
    ];
    
    let merged = {};
    for (const table of tables) {
      const result = await pool.request()
        .input('nstemi_id', sql.Int, nstemi_id)
        .query(`SELECT * FROM [${table}] WHERE [nstemi_id] = @nstemi_id`);
      if (result.recordset.length > 0) {
        const row = result.recordset[0];
        if (table === 'nstemi_outcomes') {
          // Prefix outcomes clashing fields with discharge_
          const clashingOutcomes = [
            'beta_blocker', 'calcium_channel_blocker', 'nitrate', 'nicorandil', 'ivabradine', 'ranolazine',
            'trimetazidine', 'aspirin', 'clopidogrel', 'prasugrel', 'ticagrelor', 'statin',
            'statin_10mg', 'statin_20mg', 'statin_40mg', 'statin_80mg'
          ];
          for (const k in row) {
            if (clashingOutcomes.includes(k)) {
              merged[`discharge_${k}`] = row[k];
            } else {
              merged[k] = row[k];
            }
          }
        } else if (table === 'nstemi_appropriateness') {
          // Prefix appropriateness columns with appr_ and attach sub-object
          merged.appropriateness = { ...row };
          merged.nstemi_appropriateness = { ...row };
          for (const k in row) {
            if (k !== 'nstemi_id' && k !== 'appropriateness_id' && k !== 'created_at' && k !== 'updated_at') {
              merged[`appr_${k}`] = row[k];
            } else {
              merged[k] = row[k];
            }
          }
          const noteAliases = {
            appr_iccu_admission_note: row.iccu_admission_note,
            appr_iccu_transfer_out_note: row.iccu_transfer_out_note,
            appr_thrombolysis_indication_note: row.tlt_note || row.thrombolysis_indication_note,
            appr_ptca_indication_note: row.ptca_note || row.ptca_indication_note,
            appr_invasive_monitoring_note: row.invasive_monitoring_note,
            appr_iabp_indication_note: row.iabp_note || row.iabp_indication_note,
            appr_invasive_ventilation_note: row.invasive_ventilation_note,
            appr_dialysis_indication_note: row.dialysis_note || row.dialysis_indication_note,
            appr_other_procedure_appropriateness_note: row.any_other_procedure_note || row.other_procedure_note,
            appr_cardiac_enzymes_note: row.cardiac_enzymes_note,
            appr_bnp_note: row.bnp_note,
            appr_crp_note: row.crp_note,
            appr_lipid_profile_note: row.lipid_profile_note,
            appr_bedside_echo_note: row.bed_side_echo_note || row.bedside_echo_note,
            appr_chest_xray_note: row.cxr_note || row.chest_xray_note,
            appr_beta_blockers_note: row.beta_blockers_note,
            appr_aspirin_note: row.aspirin_note,
            appr_clopidogrel_note: row.clopidogrel_note,
            appr_ace_inhibitor_note: row.ace_inhibitor_note,
            appr_arb_note: row.arb_note,
            appr_statin_note: row.statin_note,
            appr_diuretic_note: row.diuretic_note,
            appr_lanoxin_note: row.lanoxin_note,
            appr_anticoagulant_note: row.anticoagulant_note,
            appr_amiodarone_note: row.amiodarone_note,
            appr_other_drug_appropriateness_note: row.any_other_drug_note || row.other_drug_note
          };
          Object.assign(merged, noteAliases);
          Object.assign(merged.appropriateness, noteAliases);
        } else if (table === 'nstemi_registry') {
          const formatDate = (val) => {
            if (!val) return null;
            if (val instanceof Date) {
              const year = val.getUTCFullYear();
              const month = String(val.getUTCMonth() + 1).padStart(2, '0');
              const day = String(val.getUTCDate()).padStart(2, '0');
              return `${year}-${month}-${day}`;
            }
            if (typeof val === 'string') {
              if (val.includes('T')) {
                return val.split('T')[0];
              }
              const match = val.match(/^(\d{4}-\d{2}-\d{2})/);
              if (match) return match[1];
            }
            try {
              const d = new Date(val);
              if (!isNaN(d.getTime())) {
                const year = d.getUTCFullYear();
                const month = String(d.getUTCMonth() + 1).padStart(2, '0');
                const day = String(d.getUTCDate()).padStart(2, '0');
                return `${year}-${month}-${day}`;
              }
            } catch (e) {}
            return null;
          };
          row.admission_date = formatDate(row.admission_date);
          row.discharge_date = formatDate(row.discharge_date);
          merged = { ...merged, ...row };
        } else {
          merged = { ...merged, ...row };
        }
      }
    }
    
    if (Object.keys(merged).length === 0) {
      return res.status(404).json({
        success: false,
        message: 'NSTEMI record not found.'
      });
    }

    // Query follow-up matrix rows separately
    const resultFollowup = await pool.request()
      .input('nstemi_id', sql.Int, nstemi_id)
      .query(`SELECT * FROM [nstemi_followup] WHERE [nstemi_id] = @nstemi_id ORDER BY [followup_id] ASC`);
    
    merged.followup = (resultFollowup.recordset || []).map(r => {
      const formatDate = (val) => {
        if (!val) return null;
        if (val instanceof Date) {
          const year = val.getUTCFullYear();
          const month = String(val.getUTCMonth() + 1).padStart(2, '0');
          const day = String(val.getUTCDate()).padStart(2, '0');
          return `${year}-${month}-${day}`;
        }
        if (typeof val === 'string') {
          if (val.includes('T')) return val.split('T')[0];
          const match = val.match(/^(\d{4}-\d{2}-\d{2})/);
          if (match) return match[1];
        }
        return val;
      };
      return {
        ...r,
        followup_date: formatDate(r.followup_date)
      };
    });

    // Attach latest visit_mode and special_instructions from nstemi_followup rows
    if (merged.followup && merged.followup.length > 0) {
      const rowWithVisitMode = merged.followup.find(r => r.visit_mode) || merged.followup[0];
      const rowWithInstructions = merged.followup.find(r => r.special_instructions) || merged.followup[0];
      merged.visit_mode = rowWithVisitMode?.visit_mode || 'In-Person';
      merged.special_instructions = rowWithInstructions?.special_instructions || '';
    }

    return res.status(200).json({
      success: true,
      data: merged
    });
  } catch (error) {
    console.error('Error fetching NSTEMI record:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Internal server error while fetching NSTEMI record.'
    });
  }
}

async function deleteNstemiRecord(req, res) {
  try {
    const nstemi_id = req.params.id;
    const pool = await getPool();
    const { recordset: existingRows } = await pool.request()
      .input('nstemi_id', sql.Int, nstemi_id)
      .query(`SELECT [nstemi_id], [reg_patient_id], [ip_no], [acs_no] FROM [nstemi_registry] WHERE [nstemi_id] = @nstemi_id`);
    const oldRecord = existingRows[0] || {};

    await pool.request()
      .input('nstemi_id', sql.Int, nstemi_id)
      .query('UPDATE [nstemi_registry] SET [status] = 1, [updated_at] = GETDATE() WHERE [nstemi_id] = @nstemi_id');

    logAuditTrail(
      req,
      'DELETE',
      'NSTEMI',
      oldRecord.ip_no || oldRecord.acs_no || nstemi_id,
      oldRecord.reg_patient_id,
      oldRecord,
      { ...oldRecord, is_deleted: 1 }
    ).catch(err => console.error('[NSTEMI Audit] Delete error:', err));

    return res.status(200).json({
      success: true,
      message: 'NSTEMI record soft-deleted successfully.'
    });
  } catch (error) {
    console.error('Error soft-deleting NSTEMI record:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Internal server error while soft-deleting NSTEMI record.'
    });
  }
}

async function undeleteNstemiRecord(req, res) {
  try {
    const nstemi_id = req.params.id;
    const pool = await getPool();

    const { recordset: existingRows } = await pool.request()
      .input('nstemi_id', sql.Int, nstemi_id)
      .query(`SELECT [nstemi_id], [reg_patient_id], [ip_no], [acs_no] FROM [nstemi_registry] WHERE [nstemi_id] = @nstemi_id`);
    const oldRecord = existingRows[0] || {};

    await pool.request()
      .input('nstemi_id', sql.Int, nstemi_id)
      .query('UPDATE [nstemi_registry] SET [status] = 0, [updated_at] = GETDATE() WHERE [nstemi_id] = @nstemi_id');

    logAuditTrail(
      req,
      'RESTORE',
      'NSTEMI',
      oldRecord.ip_no || oldRecord.acs_no || nstemi_id,
      oldRecord.reg_patient_id,
      oldRecord,
      { ...oldRecord, is_deleted: 0 }
    ).catch(err => console.error('[NSTEMI Audit] Restore error:', err));

    return res.status(200).json({
      success: true,
      message: 'NSTEMI record restored successfully.'
    });
  } catch (error) {
    console.error('Error restoring NSTEMI record:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Internal server error while restoring NSTEMI record.'
    });
  }
}

async function fetchNstemiFullData(nstemi_id) {
  const pool = await getPool();
  const tables = [
    'nstemi_registry', 'nstemi_administrative', 'nstemi_clinical_assessment',
    'nstemi_diagnostics', 'nstemi_treatment_strategy', 'nstemi_hospitalization',
    'nstemi_outcomes', 'nstemi_appropriateness'
  ];
  let merged = {};
  for (const table of tables) {
    try {
      const res = await pool.request()
        .input('nstemi_id', sql.Int, nstemi_id)
        .query(`SELECT * FROM [${table}] WHERE [nstemi_id] = @nstemi_id`);
      if (res.recordset && res.recordset.length > 0) {
        const row = res.recordset[0];
        if (table === 'nstemi_outcomes') {
          const clashingOutcomes = [
            'beta_blocker', 'calcium_channel_blocker', 'nitrate', 'nicorandil', 'ivabradine', 'ranolazine',
            'trimetazidine', 'aspirin', 'clopidogrel', 'prasugrel', 'ticagrelor', 'statin',
            'statin_10mg', 'statin_20mg', 'statin_40mg', 'statin_80mg'
          ];
          for (const k in row) {
            if (clashingOutcomes.includes(k)) {
              merged[`discharge_${k}`] = row[k];
            } else {
              merged[k] = row[k];
            }
          }
        } else if (table === 'nstemi_appropriateness') {
          for (const k in row) {
            if (k !== 'nstemi_id' && k !== 'appropriateness_id' && k !== 'created_at' && k !== 'updated_at') {
              merged[`appr_${k}`] = row[k];
            } else {
              merged[k] = row[k];
            }
          }
        } else {
          merged = { ...merged, ...row };
        }
      }
    } catch (tblErr) {
      console.warn(`[fetchNstemiFullData] Notice reading table ${table}:`, tblErr.message);
    }
  }
  return merged;
}

async function updateNstemiRecord(req, res) {
  const nstemi_id = Number(req.params.id || req.body.nstemi_id || req.body.id);
  if (!nstemi_id || isNaN(nstemi_id)) {
    return res.status(400).json({
      success: false,
      message: 'A valid NSTEMI ID is required to update the record.'
    });
  }

  let transaction;
  try {
    const payload = req.body || {};
    const oldRecord = await fetchNstemiFullData(nstemi_id);

    const val = (key, defaultVal = null) => {
      const v = payload[key];
      if (v === undefined || v === null || v === '') return defaultVal;
      return v;
    };

    const toStr = (v) => (v !== undefined && v !== null && v !== '' ? String(v) : null);

    const bitVal = (key) => {
      const v = payload[key];
      if (v === true || v === 1 || v === '1' || v === 'Yes' || v === 'yes' || v === 'True') return 1;
      if (v === false || v === 0 || v === '0' || v === 'No' || v === 'no' || v === 'False') return 0;
      return null;
    };

    const strVal = (key, defaultVal = 'No') => {
      const v = payload[key];
      if (v === true || v === 1 || v === '1' || v === 'Yes' || v === 'yes' || v === 'True' || v === 'Done') return 'Yes';
      if (v === false || v === 0 || v === '0' || v === 'No' || v === 'no' || v === 'False' || v === 'Not done') return 'No';
      if (v === 'Unknown' || v === 'unknown') return 'Unknown';
      if (typeof v === 'string' && v.trim().length > 0) return v.trim();
      return defaultVal;
    };

    const admission_date = val('admission_date');
    const discharge_date = val('discharge_date');
    if (admission_date && discharge_date && new Date(discharge_date) < new Date(admission_date)) {
      return res.status(400).json({
        success: false,
        message: 'Discharge date cannot be earlier than Admission date.'
      });
    }

    const pool = await getPool();
    transaction = new sql.Transaction(pool);
    await transaction.begin(sql.ISOLATION_LEVEL.READ_COMMITTED);

    // Verify record exists before modifying
    const checkResult = await transaction.request()
      .input('nstemi_id', sql.Int, nstemi_id)
      .query(`SELECT [nstemi_id] FROM [nstemi_registry] WHERE [nstemi_id] = @nstemi_id;`);

    if (checkResult.recordset.length === 0) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: `NSTEMI record with ID ${nstemi_id} was not found.`
      });
    }

    // 1. UPDATE nstemi_registry
    const reqRegistry = new sql.Request(transaction);
    reqRegistry.input('nstemi_id', sql.Int, nstemi_id);
    reqRegistry.input('ip_no', sql.VarChar(50), val('ip_no'));
    reqRegistry.input('acs_no', sql.VarChar(50), val('acs_no'));
    reqRegistry.input('admission_date', sql.VarChar(50), admission_date);
    reqRegistry.input('discharge_date', sql.VarChar(50), discharge_date);
    reqRegistry.input('primary_consultant', sql.VarChar(150), val('primary_consultant'));
    reqRegistry.input('status', sql.Int, payload.status === 'draft' || payload.isDraft ? 2 : 0);
    await reqRegistry.query(`
      UPDATE [nstemi_registry]
      SET [ip_no] = COALESCE(@ip_no, [ip_no]),
          [acs_no] = COALESCE(@acs_no, [acs_no]),
          [admission_date] = @admission_date,
          [discharge_date] = @discharge_date,
          [primary_consultant] = @primary_consultant,
          [status] = @status,
          [updated_at] = GETDATE()
      WHERE [nstemi_id] = @nstemi_id;
    `);

    // 2. UPDATE nstemi_administrative
    const reqAdmin = new sql.Request(transaction);
    reqAdmin.input('nstemi_id', sql.Int, nstemi_id);
    reqAdmin.input('hypertension', sql.NVarChar(7), strVal('hypertension'));
    reqAdmin.input('diabetes', sql.NVarChar(7), strVal('diabetes'));
    reqAdmin.input('smoking', sql.NVarChar(7), strVal('smoking'));
    reqAdmin.input('renal_failure', sql.NVarChar(7), strVal('renal_failure'));
    reqAdmin.input('copd', sql.NVarChar(7), strVal('copd'));
    reqAdmin.input('cva', sql.NVarChar(7), strVal('cva'));
    reqAdmin.input('prior_acs', sql.NVarChar(7), strVal('prior_acs'));
    reqAdmin.input('prior_ptca', sql.NVarChar(7), strVal('prior_ptca'));
    reqAdmin.input('prior_cabg', sql.NVarChar(7), strVal('prior_cabg'));
    reqAdmin.input('other_background', sql.VarChar(255), val('other_background'));
    await reqAdmin.query(`
      UPDATE [nstemi_administrative]
      SET [hypertension] = @hypertension,
          [diabetes] = @diabetes,
          [smoking] = @smoking,
          [renal_failure] = @renal_failure,
          [copd] = @copd,
          [cva] = @cva,
          [prior_acs] = @prior_acs,
          [prior_ptca] = @prior_ptca,
          [prior_cabg] = @prior_cabg,
          [other_background] = @other_background,
          [updated_at] = GETDATE()
      WHERE [nstemi_id] = @nstemi_id;
    `);

    // 3. UPDATE nstemi_clinical_assessment
    const reqClinical = new sql.Request(transaction);
    reqClinical.input('nstemi_id', sql.Int, nstemi_id);
    reqClinical.input('typical_angina', sql.NVarChar(3), strVal('typical_angina'));
    reqClinical.input('atypical_chest_pain', sql.NVarChar(3), strVal('atypical_chest_pain'));
    reqClinical.input('breathlessness', sql.NVarChar(3), strVal('breathlessness'));
    reqClinical.input('syncope_presyncope', sql.NVarChar(3), strVal('syncope_presyncope'));
    reqClinical.input('pulse_rate', sql.Int, val('pulse_rate') ? parseInt(val('pulse_rate')) : null);
    reqClinical.input('systolic_bp', sql.Int, val('systolic_bp') ? parseInt(val('systolic_bp')) : null);
    reqClinical.input('diastolic_bp', sql.Int, val('diastolic_bp') ? parseInt(val('diastolic_bp')) : null);
    reqClinical.input('age_gt_75', sql.NVarChar(3), strVal('age_gt_75'));
    reqClinical.input('age_65_to_74', sql.NVarChar(3), strVal('age_65_to_74'));
    reqClinical.input('history_dm_htn_angina', sql.NVarChar(3), strVal('history_dm_htn_angina'));
    reqClinical.input('sbp_lt_100', sql.NVarChar(3), strVal('sbp_lt_100'));
    reqClinical.input('heart_rate_gt_100', sql.NVarChar(3), strVal('heart_rate_gt_100'));
    reqClinical.input('killip_class_ii_to_iv', sql.NVarChar(3), strVal('killip_class_ii_to_iv'));
    reqClinical.input('anterior_mi_or_lbbb', sql.NVarChar(3), strVal('anterior_mi_or_lbbb'));
    reqClinical.input('weight_lt_67kg', sql.NVarChar(3), strVal('weight_lt_67kg'));
    reqClinical.input('reperfusion_gt_4hrs', sql.NVarChar(3), strVal('reperfusion_gt_4hrs'));
    reqClinical.input('chd_risk_factors_ge_3', sql.NVarChar(3), strVal('chd_risk_factors_ge_3'));
    reqClinical.input('prior_coronary_stenosis_gt_50', sql.NVarChar(3), strVal('prior_coronary_stenosis_gt_50'));
    reqClinical.input('st_deviation_at_admission', sql.NVarChar(3), strVal('st_deviation_at_admission'));
    reqClinical.input('anginal_episodes_ge_2_last_24hrs', sql.NVarChar(3), strVal('anginal_episodes_ge_2_last_24hrs'));
    reqClinical.input('elevated_serum_cardiac_markers', sql.NVarChar(3), strVal('elevated_serum_cardiac_markers'));
    reqClinical.input('timi_total_score', sql.SmallInt, val('timi_total_score') !== null ? parseInt(val('timi_total_score')) : 0);
    reqClinical.input('lvf', sql.NVarChar(3), strVal('lvf'));
    reqClinical.input('vt_vf', sql.NVarChar(3), strVal('vt_vf'));
    reqClinical.input('bbb_chb', sql.NVarChar(3), strVal('bbb_chb'));
    reqClinical.input('elevated_bnp', sql.NVarChar(3), strVal('elevated_bnp'));
    reqClinical.input('elevated_crp', sql.NVarChar(3), strVal('elevated_crp'));
    await reqClinical.query(`
      UPDATE [nstemi_clinical_assessment]
      SET [typical_angina] = @typical_angina,
          [atypical_chest_pain] = @atypical_chest_pain,
          [breathlessness] = @breathlessness,
          [syncope_presyncope] = @syncope_presyncope,
          [pulse_rate] = @pulse_rate,
          [systolic_bp] = @systolic_bp,
          [diastolic_bp] = @diastolic_bp,
          [age_gt_75] = @age_gt_75,
          [age_65_to_74] = @age_65_to_74,
          [history_dm_htn_angina] = @history_dm_htn_angina,
          [sbp_lt_100] = @sbp_lt_100,
          [heart_rate_gt_100] = @heart_rate_gt_100,
          [killip_class_ii_to_iv] = @killip_class_ii_to_iv,
          [anterior_mi_or_lbbb] = @anterior_mi_or_lbbb,
          [weight_lt_67kg] = @weight_lt_67kg,
          [reperfusion_gt_4hrs] = @reperfusion_gt_4hrs,
          [chd_risk_factors_ge_3] = @chd_risk_factors_ge_3,
          [prior_coronary_stenosis_gt_50] = @prior_coronary_stenosis_gt_50,
          [st_deviation_at_admission] = @st_deviation_at_admission,
          [anginal_episodes_ge_2_last_24hrs] = @anginal_episodes_ge_2_last_24hrs,
          [elevated_serum_cardiac_markers] = @elevated_serum_cardiac_markers,
          [timi_total_score] = @timi_total_score,
          [lvf] = @lvf,
          [vt_vf] = @vt_vf,
          [bbb_chb] = @bbb_chb,
          [elevated_bnp] = @elevated_bnp,
          [elevated_crp] = @elevated_crp,
          [updated_at] = GETDATE()
      WHERE [nstemi_id] = @nstemi_id;
    `);

    // 4. UPDATE nstemi_diagnostics
    const reqDiag = new sql.Request(transaction);
    reqDiag.input('nstemi_id', sql.Int, nstemi_id);
    reqDiag.input('bedside_echo', sql.NVarChar(3), strVal('bedside_echo'));
    reqDiag.input('departmental_echo', sql.NVarChar(3), strVal('departmental_echo'));
    reqDiag.input('stress_testing', sql.NVarChar(3), strVal('stress_testing'));
    reqDiag.input('lipid_profile', sql.NVarChar(3), strVal('lipid_profile'));
    reqDiag.input('bnp', sql.NVarChar(3), strVal('bnp'));
    reqDiag.input('crp', sql.NVarChar(3), strVal('crp'));
    reqDiag.input('troponin_test', sql.NVarChar(3), strVal('troponin_test'));
    reqDiag.input('cpk_ckmb', sql.NVarChar(3), strVal('cpk_ckmb'));
    reqDiag.input('rft', sql.NVarChar(3), strVal('rft'));
    reqDiag.input('lft', sql.NVarChar(3), strVal('lft'));
    reqDiag.input('electrolytes', sql.NVarChar(3), strVal('electrolytes'));
    reqDiag.input('hemogram', sql.NVarChar(3), strVal('hemogram'));
    reqDiag.input('cxr', sql.NVarChar(3), strVal('cxr'));
    reqDiag.input('diagnostic_other', sql.VarChar(255), val('diagnostic_other'));
    reqDiag.input('ecg_heart_rate', sql.Int, val('ecg_heart_rate') ? parseInt(val('ecg_heart_rate')) : null);
    reqDiag.input('av_block_none', sql.NVarChar(3), strVal('av_block_none'));
    reqDiag.input('av_block_first_degree', sql.NVarChar(3), strVal('av_block_first_degree'));
    reqDiag.input('av_block_second_degree', sql.NVarChar(3), strVal('av_block_second_degree'));
    reqDiag.input('av_block_chb', sql.NVarChar(3), strVal('av_block_chb'));
    reqDiag.input('bbb_none', sql.NVarChar(3), strVal('bbb_none'));
    reqDiag.input('bbb_rbbb', sql.NVarChar(3), strVal('bbb_rbbb'));
    reqDiag.input('bbb_lbbb', sql.NVarChar(3), strVal('bbb_lbbb'));
    reqDiag.input('bbb_indeterminate', sql.NVarChar(3), strVal('bbb_indeterminate'));
    reqDiag.input('qwaves_none', sql.NVarChar(3), strVal('qwaves_none'));
    reqDiag.input('qwaves_inferior', sql.NVarChar(3), strVal('qwaves_inferior'));
    reqDiag.input('qwaves_anteroseptal', sql.NVarChar(3), strVal('qwaves_anteroseptal'));
    reqDiag.input('qwaves_anterior', sql.NVarChar(3), strVal('qwaves_anterior'));
    reqDiag.input('qwaves_anterolateral', sql.NVarChar(3), strVal('qwaves_anterolateral'));
    reqDiag.input('qwaves_lateral', sql.NVarChar(3), strVal('qwaves_lateral'));
    reqDiag.input('st_depression_none', sql.NVarChar(3), strVal('st_depression_none'));
    reqDiag.input('st_depression_inferior', sql.NVarChar(3), strVal('st_depression_inferior'));
    reqDiag.input('st_depression_anteroseptal', sql.NVarChar(3), strVal('st_depression_anteroseptal'));
    reqDiag.input('st_depression_anterior', sql.NVarChar(3), strVal('st_depression_anterior'));
    reqDiag.input('st_depression_anterolateral', sql.NVarChar(3), strVal('st_depression_anterolateral'));
    reqDiag.input('st_depression_lateral', sql.NVarChar(3), strVal('st_depression_lateral'));
    reqDiag.input('t_inversion_none', sql.NVarChar(3), strVal('t_inversion_none'));
    reqDiag.input('t_inversion_inferior', sql.NVarChar(3), strVal('t_inversion_inferior'));
    reqDiag.input('t_inversion_anteroseptal', sql.NVarChar(3), strVal('t_inversion_anteroseptal'));
    reqDiag.input('t_inversion_anterior', sql.NVarChar(3), strVal('t_inversion_anterior'));
    reqDiag.input('t_inversion_anterolateral', sql.NVarChar(3), strVal('t_inversion_anterolateral'));
    reqDiag.input('t_inversion_lateral', sql.NVarChar(3), strVal('t_inversion_lateral'));
    reqDiag.input('rhythm_nsr', sql.NVarChar(3), strVal('rhythm_nsr'));
    reqDiag.input('rhythm_af', sql.NVarChar(3), strVal('rhythm_af'));
    reqDiag.input('rhythm_svt', sql.NVarChar(3), strVal('rhythm_svt'));
    reqDiag.input('rhythm_vt', sql.NVarChar(3), strVal('rhythm_vt'));
    reqDiag.input('rhythm_vf', sql.NVarChar(3), strVal('rhythm_vf'));
    reqDiag.input('ecg_other', sql.NVarChar(sql.MAX), val('ecg_other'));
    reqDiag.input('echo_ef', sql.Decimal(5, 2), val('echo_ef') ? parseFloat(val('echo_ef')) : null);
    reqDiag.input('lv_function_normal', sql.NVarChar(3), strVal('lv_function_normal'));
    reqDiag.input('lv_function_mild_lvd', sql.NVarChar(3), strVal('lv_function_mild_lvd'));
    reqDiag.input('lv_function_moderate_lvd', sql.NVarChar(3), strVal('lv_function_moderate_lvd'));
    reqDiag.input('lv_function_severe_lvd', sql.NVarChar(3), strVal('lv_function_severe_lvd'));
    reqDiag.input('rwma_lad', sql.NVarChar(3), strVal('rwma_lad'));
    reqDiag.input('rwma_rca', sql.NVarChar(3), strVal('rwma_rca'));
    reqDiag.input('rwma_lcx', sql.NVarChar(3), strVal('rwma_lcx'));
    reqDiag.input('mr_none', sql.NVarChar(3), strVal('mr_none'));
    reqDiag.input('mr_mild', sql.NVarChar(3), strVal('mr_mild'));
    reqDiag.input('mr_moderate', sql.NVarChar(3), strVal('mr_moderate'));
    reqDiag.input('mr_severe', sql.NVarChar(3), strVal('mr_severe'));
    reqDiag.input('echo_e', sql.Decimal(5, 2), val('echo_e') ? parseFloat(val('echo_e')) : null);
    reqDiag.input('echo_a', sql.Decimal(5, 2), val('echo_a') ? parseFloat(val('echo_a')) : null);
    reqDiag.input('echo_dt', sql.Decimal(5, 2), val('echo_dt') ? parseFloat(val('echo_dt')) : null);
    reqDiag.input('echo_e_prime', sql.Decimal(5, 2), val('echo_e_prime') ? parseFloat(val('echo_e_prime')) : null);
    reqDiag.input('echo_tapsv', sql.Decimal(5, 2), val('echo_tapsv') ? parseFloat(val('echo_tapsv')) : null);
    reqDiag.input('echo_other', sql.NVarChar(sql.MAX), val('echo_other'));
    reqDiag.input('hemoglobin', sql.Decimal(5, 2), val('hemoglobin') ? parseFloat(val('hemoglobin')) : null);
    reqDiag.input('creatinine', sql.Decimal(5, 2), val('creatinine') ? parseFloat(val('creatinine')) : null);
    reqDiag.input('troponin_i', sql.VarChar(50), toStr(val('troponin_i')));
    reqDiag.input('cpk', sql.VarChar(50), toStr(val('cpk')));
    reqDiag.input('ck_mb', sql.VarChar(50), toStr(val('ck_mb')));
    reqDiag.input('sodium', sql.Decimal(5, 2), val('sodium') ? parseFloat(val('sodium')) : null);
    reqDiag.input('potassium', sql.Decimal(5, 2), val('potassium') ? parseFloat(val('potassium')) : null);
    reqDiag.input('rbs_admission', sql.Decimal(5, 2), val('rbs_admission') ? parseFloat(val('rbs_admission')) : null);
    reqDiag.input('angiogram_done', sql.NVarChar(3), strVal('angiogram_done'));
    reqDiag.input('angiogram_normal', sql.NVarChar(3), strVal('angiogram_normal'));
    reqDiag.input('angiogram_1vd', sql.NVarChar(3), strVal('angiogram_1vd'));
    reqDiag.input('angiogram_2vd', sql.NVarChar(3), strVal('angiogram_2vd'));
    reqDiag.input('angiogram_3vd', sql.NVarChar(3), strVal('angiogram_3vd'));
    reqDiag.input('angiogram_lmca', sql.NVarChar(3), strVal('angiogram_lmca'));
    await reqDiag.query(`
      UPDATE [nstemi_diagnostics]
      SET [bedside_echo] = @bedside_echo, [departmental_echo] = @departmental_echo,
          [stress_testing] = @stress_testing, [lipid_profile] = @lipid_profile,
          [bnp] = @bnp, [crp] = @crp, [troponin_test] = @troponin_test, [cpk_ckmb] = @cpk_ckmb,
          [rft] = @rft, [lft] = @lft, [electrolytes] = @electrolytes, [hemogram] = @hemogram,
          [cxr] = @cxr, [diagnostic_other] = @diagnostic_other, [ecg_heart_rate] = @ecg_heart_rate,
          [av_block_none] = @av_block_none, [av_block_first_degree] = @av_block_first_degree,
          [av_block_second_degree] = @av_block_second_degree, [av_block_chb] = @av_block_chb,
          [bbb_none] = @bbb_none, [bbb_rbbb] = @bbb_rbbb, [bbb_lbbb] = @bbb_lbbb, [bbb_indeterminate] = @bbb_indeterminate,
          [qwaves_none] = @qwaves_none, [qwaves_inferior] = @qwaves_inferior, [qwaves_anteroseptal] = @qwaves_anteroseptal,
          [qwaves_anterior] = @qwaves_anterior, [qwaves_anterolateral] = @qwaves_anterolateral, [qwaves_lateral] = @qwaves_lateral,
          [st_depression_none] = @st_depression_none, [st_depression_inferior] = @st_depression_inferior,
          [st_depression_anteroseptal] = @st_depression_anteroseptal, [st_depression_anterior] = @st_depression_anterior,
          [st_depression_anterolateral] = @st_depression_anterolateral, [st_depression_lateral] = @st_depression_lateral,
          [t_inversion_none] = @t_inversion_none, [t_inversion_inferior] = @t_inversion_inferior,
          [t_inversion_anteroseptal] = @t_inversion_anteroseptal, [t_inversion_anterior] = @t_inversion_anterior,
          [t_inversion_anterolateral] = @t_inversion_anterolateral, [t_inversion_lateral] = @t_inversion_lateral,
          [rhythm_nsr] = @rhythm_nsr, [rhythm_af] = @rhythm_af, [rhythm_svt] = @rhythm_svt,
          [rhythm_vt] = @rhythm_vt, [rhythm_vf] = @rhythm_vf, [ecg_other] = @ecg_other,
          [echo_ef] = @echo_ef, [lv_function_normal] = @lv_function_normal, [lv_function_mild_lvd] = @lv_function_mild_lvd,
          [lv_function_moderate_lvd] = @lv_function_moderate_lvd, [lv_function_severe_lvd] = @lv_function_severe_lvd,
          [rwma_lad] = @rwma_lad, [rwma_rca] = @rwma_rca, [rwma_lcx] = @rwma_lcx,
          [mr_none] = @mr_none, [mr_mild] = @mr_mild, [mr_moderate] = @mr_moderate, [mr_severe] = @mr_severe,
          [echo_e] = @echo_e, [echo_a] = @echo_a, [echo_dt] = @echo_dt, [echo_e_prime] = @echo_e_prime,
          [echo_tapsv] = @echo_tapsv, [echo_other] = @echo_other, [hemoglobin] = @hemoglobin,
          [creatinine] = @creatinine, [troponin_i] = @troponin_i, [cpk] = @cpk, [ck_mb] = @ck_mb,
          [sodium] = @sodium, [potassium] = @potassium, [rbs_admission] = @rbs_admission,
          [angiogram_done] = @angiogram_done, [angiogram_normal] = @angiogram_normal,
          [angiogram_1vd] = @angiogram_1vd, [angiogram_2vd] = @angiogram_2vd, [angiogram_3vd] = @angiogram_3vd,
          [angiogram_lmca] = @angiogram_lmca, [updated_at] = GETDATE()
      WHERE [nstemi_id] = @nstemi_id;
    `);

    // 5. UPDATE nstemi_treatment_strategy
    const reqTx = new sql.Request(transaction);
    reqTx.input('nstemi_id', sql.Int, nstemi_id);
    reqTx.input('pami', sql.NVarChar(3), strVal('pami'));
    reqTx.input('thrombolysis', sql.NVarChar(3), strVal('thrombolysis'));
    reqTx.input('conservative', sql.NVarChar(3), strVal('conservative'));
    reqTx.input('door_to_balloon_time', sql.Int, val('door_to_balloon_time') ? parseInt(val('door_to_balloon_time')) : null);
    reqTx.input('vessel_lmca', sql.NVarChar(3), strVal('vessel_lmca'));
    reqTx.input('vessel_lad', sql.NVarChar(3), strVal('vessel_lad'));
    reqTx.input('vessel_diagonal', sql.NVarChar(3), strVal('vessel_diagonal'));
    reqTx.input('vessel_lcx', sql.NVarChar(3), strVal('vessel_lcx'));
    reqTx.input('vessel_ramus', sql.NVarChar(3), strVal('vessel_ramus'));
    reqTx.input('vessel_om', sql.NVarChar(3), strVal('vessel_om'));
    reqTx.input('vessel_rca', sql.NVarChar(3), strVal('vessel_rca'));
    reqTx.input('vessel_pda', sql.NVarChar(3), strVal('vessel_pda'));
    reqTx.input('vessel_segment', sql.VarChar(100), val('vessel_segment'));
    reqTx.input('thrombosuction_done', sql.NVarChar(3), strVal('thrombosuction_done'));
    reqTx.input('thrombosuction_not_done', sql.NVarChar(3), strVal('thrombosuction_not_done'));
    reqTx.input('stent_bms', sql.NVarChar(3), strVal('stent_bms'));
    reqTx.input('stent_des', sql.NVarChar(3), strVal('stent_des'));
    reqTx.input('stent_diameter', sql.Decimal(5, 2), val('stent_diameter') ? parseFloat(val('stent_diameter')) : null);
    reqTx.input('stent_length', sql.Decimal(5, 2), val('stent_length') ? parseFloat(val('stent_length')) : null);
    reqTx.input('procedural_success', sql.NVarChar(3), strVal('procedural_success'));
    reqTx.input('timi_flow', sql.TinyInt, val('timi_flow') !== null ? parseInt(val('timi_flow')) : null);
    reqTx.input('complication_none', sql.NVarChar(3), strVal('complication_none'));
    reqTx.input('complication_tamponade', sql.NVarChar(3), strVal('complication_tamponade'));
    reqTx.input('complication_major_bleed', sql.NVarChar(3), strVal('complication_major_bleed'));
    reqTx.input('complication_stroke', sql.NVarChar(3), strVal('complication_stroke'));
    reqTx.input('complication_stent_thrombosis', sql.NVarChar(3), strVal('complication_stent_thrombosis'));
    reqTx.input('complication_mi', sql.NVarChar(3), strVal('complication_mi'));
    reqTx.input('complication_death', sql.NVarChar(3), strVal('complication_death'));
    reqTx.input('complication_emergency_cabg', sql.NVarChar(3), strVal('complication_emergency_cabg'));
    reqTx.input('door_to_needle_time', sql.Int, val('door_to_needle_time') ? parseInt(val('door_to_needle_time')) : null);
    reqTx.input('drug_stk', sql.NVarChar(3), strVal('drug_stk'));
    reqTx.input('drug_uk', sql.NVarChar(3), strVal('drug_uk'));
    reqTx.input('drug_reteplase', sql.NVarChar(3), strVal('drug_reteplase'));
    reqTx.input('drug_tenecteplase', sql.NVarChar(3), strVal('drug_tenecteplase'));
    reqTx.input('thrombolysis_dose', sql.VarChar(100), val('thrombolysis_dose'));
    reqTx.input('beta_blocker', sql.NVarChar(3), strVal('beta_blocker'));
    reqTx.input('calcium_channel_blocker', sql.NVarChar(3), strVal('calcium_channel_blocker'));
    reqTx.input('nitrate', sql.NVarChar(3), strVal('nitrate'));
    reqTx.input('nicorandil', sql.NVarChar(3), strVal('nicorandil'));
    reqTx.input('ivabradine', sql.NVarChar(3), strVal('ivabradine'));
    reqTx.input('ranolazine', sql.NVarChar(3), strVal('ranolazine'));
    reqTx.input('trimetazidine', sql.NVarChar(3), strVal('trimetazidine'));
    reqTx.input('aspirin', sql.NVarChar(3), strVal('aspirin'));
    reqTx.input('clopidogrel', sql.NVarChar(3), strVal('clopidogrel'));
    reqTx.input('prasugrel', sql.NVarChar(3), strVal('prasugrel'));
    reqTx.input('ticagrelor', sql.NVarChar(3), strVal('ticagrelor'));
    reqTx.input('heparin_ufh_iv', sql.NVarChar(3), strVal('heparin_ufh_iv'));
    reqTx.input('heparin_ufh_sc', sql.NVarChar(3), strVal('heparin_ufh_sc'));
    reqTx.input('heparin_lmwh', sql.NVarChar(3), strVal('heparin_lmwh'));
    reqTx.input('heparin_ufh_iv_sc', sql.NVarChar(3), strVal('heparin_ufh_iv_sc'));
    reqTx.input('heparin_ufh_iv_lmwh', sql.NVarChar(3), strVal('heparin_ufh_iv_lmwh'));
    reqTx.input('gp2b3a', sql.NVarChar(3), strVal('gp2b3a'));
    reqTx.input('bivaluridin', sql.NVarChar(3), strVal('bivaluridin'));
    reqTx.input('statin', sql.NVarChar(3), strVal('statin'));
    reqTx.input('statin_10mg', sql.NVarChar(3), strVal('statin_10mg'));
    reqTx.input('statin_20mg', sql.NVarChar(3), strVal('statin_20mg'));
    reqTx.input('statin_40mg', sql.NVarChar(3), strVal('statin_40mg'));
    reqTx.input('statin_80mg', sql.NVarChar(3), strVal('statin_80mg'));
    reqTx.input('other_drugs', sql.VarChar(255), val('other_drugs'));
    reqTx.input('cag', sql.NVarChar(3), strVal('cag'));
    reqTx.input('iabp', sql.NVarChar(3), strVal('iabp'));
    reqTx.input('invasive_ventilation', sql.NVarChar(3), strVal('invasive_ventilation'));
    reqTx.input('ptca', sql.NVarChar(3), strVal('ptca'));
    reqTx.input('cabg', sql.NVarChar(3), strVal('cabg'));
    reqTx.input('other_procedure', sql.VarChar(255), val('other_procedure'));
    await reqTx.query(`
      UPDATE [nstemi_treatment_strategy]
      SET [pami] = @pami, [thrombolysis] = @thrombolysis, [conservative] = @conservative,
          [door_to_balloon_time] = @door_to_balloon_time, [vessel_lmca] = @vessel_lmca,
          [vessel_lad] = @vessel_lad, [vessel_diagonal] = @vessel_diagonal, [vessel_lcx] = @vessel_lcx,
          [vessel_ramus] = @vessel_ramus, [vessel_om] = @vessel_om, [vessel_rca] = @vessel_rca,
          [vessel_pda] = @vessel_pda, [vessel_segment] = @vessel_segment,
          [thrombosuction_done] = @thrombosuction_done, [thrombosuction_not_done] = @thrombosuction_not_done,
          [stent_bms] = @stent_bms, [stent_des] = @stent_des, [stent_diameter] = @stent_diameter,
          [stent_length] = @stent_length, [procedural_success] = @procedural_success, [timi_flow] = @timi_flow,
          [complication_none] = @complication_none, [complication_tamponade] = @complication_tamponade,
          [complication_major_bleed] = @complication_major_bleed, [complication_stroke] = @complication_stroke,
          [complication_stent_thrombosis] = @complication_stent_thrombosis, [complication_mi] = @complication_mi,
          [complication_death] = @complication_death, [complication_emergency_cabg] = @complication_emergency_cabg,
          [door_to_needle_time] = @door_to_needle_time, [drug_stk] = @drug_stk, [drug_uk] = @drug_uk,
          [drug_reteplase] = @drug_reteplase, [drug_tenecteplase] = @drug_tenecteplase, [thrombolysis_dose] = @thrombolysis_dose,
          [beta_blocker] = @beta_blocker, [calcium_channel_blocker] = @calcium_channel_blocker, [nitrate] = @nitrate,
          [nicorandil] = @nicorandil, [ivabradine] = @ivabradine, [ranolazine] = @ranolazine,
          [trimetazidine] = @trimetazidine, [aspirin] = @aspirin, [clopidogrel] = @clopidogrel,
          [prasugrel] = @prasugrel, [ticagrelor] = @ticagrelor, [heparin_ufh_iv] = @heparin_ufh_iv,
          [heparin_ufh_sc] = @heparin_ufh_sc, [heparin_lmwh] = @heparin_lmwh, [heparin_ufh_iv_sc] = @heparin_ufh_iv_sc,
          [heparin_ufh_iv_lmwh] = @heparin_ufh_iv_lmwh, [gp2b3a] = @gp2b3a, [bivaluridin] = @bivaluridin,
          [statin] = @statin, [statin_10mg] = @statin_10mg, [statin_20mg] = @statin_20mg,
          [statin_40mg] = @statin_40mg, [statin_80mg] = @statin_80mg, [other_drugs] = @other_drugs,
          [cag] = @cag, [iabp] = @iabp, [invasive_ventilation] = @invasive_ventilation,
          [ptca] = @ptca, [cabg] = @cabg, [other_procedure] = @other_procedure, [updated_at] = GETDATE()
      WHERE [nstemi_id] = @nstemi_id;
    `);

    // 6. UPDATE nstemi_hospitalization
    const reqHosp = new sql.Request(transaction);
    reqHosp.input('nstemi_id', sql.Int, nstemi_id);
    reqHosp.input('iccu_hours', sql.Decimal(5, 2), val('iccu_hours') ? parseFloat(val('iccu_hours')) : null);
    reqHosp.input('stepdown_icu_hours', sql.Decimal(5, 2), val('stepdown_icu_hours') ? parseFloat(val('stepdown_icu_hours')) : null);
    reqHosp.input('floor_days', sql.Decimal(5, 2), val('floor_days') ? parseFloat(val('floor_days')) : null);
    reqHosp.input('total_hospital_stay_days', sql.Decimal(5, 2), val('total_hospital_stay_days') ? parseFloat(val('total_hospital_stay_days')) : null);
    reqHosp.input('bed_charges', sql.Decimal(12, 2), val('bed_charges') ? parseFloat(val('bed_charges')) : null);
    reqHosp.input('drugs_disposables_cost', sql.Decimal(12, 2), val('drugs_disposables_cost') ? parseFloat(val('drugs_disposables_cost')) : null);
    reqHosp.input('package_cost', sql.Decimal(12, 2), val('package_cost') ? parseFloat(val('package_cost')) : null);
    reqHosp.input('laboratory_cost', sql.Decimal(12, 2), val('laboratory_cost') ? parseFloat(val('laboratory_cost')) : null);
    reqHosp.input('non_invasive_lab_cost', sql.Decimal(12, 2), val('non_invasive_lab_cost') ? parseFloat(val('non_invasive_lab_cost')) : null);
    reqHosp.input('consultation_cost', sql.Decimal(12, 2), val('consultation_cost') ? parseFloat(val('consultation_cost')) : null);
    reqHosp.input('radiology_cost', sql.Decimal(12, 2), val('radiology_cost') ? parseFloat(val('radiology_cost')) : null);
    reqHosp.input('miscellaneous_cost', sql.Decimal(12, 2), val('miscellaneous_cost') ? parseFloat(val('miscellaneous_cost')) : null);
    reqHosp.input('total_cost', sql.Decimal(12, 2), val('total_cost') ? parseFloat(val('total_cost')) : null);
    await reqHosp.query(`
      UPDATE [nstemi_hospitalization]
      SET [iccu_hours] = @iccu_hours, [stepdown_icu_hours] = @stepdown_icu_hours, [floor_days] = @floor_days,
          [total_hospital_stay_days] = @total_hospital_stay_days, [bed_charges] = @bed_charges,
          [drugs_disposables_cost] = @drugs_disposables_cost, [package_cost] = @package_cost,
          [laboratory_cost] = @laboratory_cost, [non_invasive_lab_cost] = @non_invasive_lab_cost,
          [consultation_cost] = @consultation_cost, [radiology_cost] = @radiology_cost,
          [miscellaneous_cost] = @miscellaneous_cost, [total_cost] = @total_cost, [updated_at] = GETDATE()
      WHERE [nstemi_id] = @nstemi_id;
    `);

    // 7. UPDATE nstemi_outcomes
    const reqOutcomes = new sql.Request(transaction);
    reqOutcomes.input('nstemi_id', sql.Int, nstemi_id);
    reqOutcomes.input('death', sql.NVarChar(3), strVal('death'));
    reqOutcomes.input('stemi_for_nonstemi', sql.NVarChar(3), strVal('stemi_for_nonstemi'));
    reqOutcomes.input('remi_for_nstemi', sql.NVarChar(3), strVal('remi_for_nstemi'));
    reqOutcomes.input('revascularization_recurrent_ischemia', sql.NVarChar(3), strVal('revascularization_recurrent_ischemia'));
    reqOutcomes.input('cva_thrombotic', sql.NVarChar(3), strVal('cva_thrombotic'));
    reqOutcomes.input('cva_hemorrhagic', sql.NVarChar(3), strVal('cva_hemorrhagic'));
    reqOutcomes.input('major_bleeding', sql.NVarChar(3), strVal('major_bleeding'));
    reqOutcomes.input('outcome_other', sql.VarChar(255), val('outcome_other'));
    reqOutcomes.input('beta_blocker', sql.NVarChar(3), strVal('discharge_beta_blocker'));
    reqOutcomes.input('calcium_channel_blocker', sql.NVarChar(3), strVal('discharge_calcium_channel_blocker'));
    reqOutcomes.input('nitrate', sql.NVarChar(3), strVal('discharge_nitrate'));
    reqOutcomes.input('nicorandil', sql.NVarChar(3), strVal('discharge_nicorandil'));
    reqOutcomes.input('ivabradine', sql.NVarChar(3), strVal('discharge_ivabradine'));
    reqOutcomes.input('ranolazine', sql.NVarChar(3), strVal('discharge_ranolazine'));
    reqOutcomes.input('trimetazidine', sql.NVarChar(3), strVal('discharge_trimetazidine'));
    reqOutcomes.input('aspirin', sql.NVarChar(3), strVal('discharge_aspirin'));
    reqOutcomes.input('clopidogrel', sql.NVarChar(3), strVal('discharge_clopidogrel'));
    reqOutcomes.input('prasugrel', sql.NVarChar(3), strVal('discharge_prasugrel'));
    reqOutcomes.input('ticagrelor', sql.NVarChar(3), strVal('discharge_ticagrelor'));
    reqOutcomes.input('statin', sql.NVarChar(3), strVal('discharge_statin'));
    reqOutcomes.input('statin_10mg', sql.NVarChar(3), strVal('discharge_statin_10mg'));
    reqOutcomes.input('statin_20mg', sql.NVarChar(3), strVal('discharge_statin_20mg'));
    reqOutcomes.input('statin_40mg', sql.NVarChar(3), strVal('discharge_statin_40mg'));
    reqOutcomes.input('statin_80mg', sql.NVarChar(3), strVal('discharge_statin_80mg'));
    reqOutcomes.input('discharge_other_medication', sql.VarChar(255), val('discharge_other_medication'));
    await reqOutcomes.query(`
      UPDATE [nstemi_outcomes]
      SET [death] = @death, [stemi_for_nonstemi] = @stemi_for_nonstemi, [remi_for_nstemi] = @remi_for_nstemi,
          [revascularization_recurrent_ischemia] = @revascularization_recurrent_ischemia,
          [cva_thrombotic] = @cva_thrombotic, [cva_hemorrhagic] = @cva_hemorrhagic, [major_bleeding] = @major_bleeding,
          [outcome_other] = @outcome_other, [beta_blocker] = @beta_blocker,
          [calcium_channel_blocker] = @calcium_channel_blocker, [nitrate] = @nitrate, [nicorandil] = @nicorandil,
          [ivabradine] = @ivabradine, [ranolazine] = @ranolazine, [trimetazidine] = @trimetazidine,
          [aspirin] = @aspirin, [clopidogrel] = @clopidogrel, [prasugrel] = @prasugrel, [ticagrelor] = @ticagrelor,
          [statin] = @statin, [statin_10mg] = @statin_10mg, [statin_20mg] = @statin_20mg,
          [statin_40mg] = @statin_40mg, [statin_80mg] = @statin_80mg,
          [discharge_other_medication] = @discharge_other_medication, [updated_at] = GETDATE()
      WHERE [nstemi_id] = @nstemi_id;
    `);

    // 9. UPDATE nstemi_appropriateness
    await saveAppropriatenessHelper(transaction, 'nstemi_appropriateness', 'nstemi_id', nstemi_id, true, val);

    // 8. UPDATE nstemi_followup (UPSERT: Update existing interval rows or Insert new ones without deleting)
    const visitMode = val('visit_mode', null) || (req.body.followup?.[0]?.visit_mode ?? 'In-Person');
    const specialInstructions = val('special_instructions', null) || val('special_clinical_instructions', null) || (req.body.followup?.[0]?.special_instructions ?? '');
    const baseDate = val('discharge_date', null) || val('admission_date', null);

    const monthMap = {
      '1-Month': 1, '1-month': 1, '1m': 1,
      '3-Month': 3, '3-month': 3, '3m': 3,
      '6-Month': 6, '6-month': 6, '6m': 6,
      '12-Month': 12, '12-month': 12, '12m': 12
    };

    const calculateBackendExpectedDate = (baseDateStr, months) => {
      if (!baseDateStr || !months) return null;
      try {
        const d = new Date(baseDateStr);
        if (isNaN(d.getTime())) return null;
        d.setMonth(d.getMonth() + months);
        if (d.getDay() === 0) d.setDate(d.getDate() + 1);
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
      } catch (e) {
        return null;
      }
    };

    const rawFollowupRows = Array.isArray(req.body.followup)
      ? req.body.followup
      : typeof req.body.followup === 'object' && req.body.followup !== null
      ? Object.values(req.body.followup)
      : [];

    const regPid = parseInt(val('reg_patient_id', 1), 10);
    const baseFollowupDate = discharge_date || admission_date;
    const selectedMonths = rawFollowupRows.map(r => r.followup_month).filter(Boolean);

    // Clean up unselected follow-up intervals from nstemi_followup and patient_followup_tasks
    const standardMonthNames = ['1-Month', '3-Month', '6-Month', '12-Month'];
    const unselectedMonths = standardMonthNames.filter(m => !selectedMonths.includes(m));
    for (const unsel of unselectedMonths) {
      const reqDel = new sql.Request(transaction);
      reqDel.input('nstemi_id', sql.Int, nstemi_id);
      reqDel.input('reg_patient_id', sql.Int, regPid);
      reqDel.input('unsel_month', sql.NVarChar(50), unsel);
      await reqDel.query(`
        DELETE FROM [nstemi_followup] WHERE [nstemi_id] = @nstemi_id AND [followup_month] = @unsel_month;
        DELETE FROM [patient_followup_tasks] WHERE [reg_patient_id] = @reg_patient_id AND [source_registry] = 'NSTEMI Registry' AND [timeframe] = @unsel_month AND ([source_record_id] = @nstemi_id OR [source_record_id] IS NULL);
      `);
    }

    // Upsert each selected interval
    for (const row of rawFollowupRows) {
      if (!row || !row.followup_month) continue;
      const followupMonth = row.followup_month;
      const monthsToAdd = monthMap[followupMonth] || 1;

      const reqFollowup = new sql.Request(transaction);
      reqFollowup.input('nstemi_id', sql.Int, nstemi_id);
      reqFollowup.input('reg_patient_id', sql.Int, regPid);
      reqFollowup.input('followup_month', sql.NVarChar(50), followupMonth);
      reqFollowup.input('angina', sql.VarChar(50), row.angina || 'No');
      reqFollowup.input('functional_class', sql.VarChar(50), row.functional_class || 'None');
      reqFollowup.input('number_of_antianginals', sql.Int, row.number_of_antianginals !== undefined && row.number_of_antianginals !== null && row.number_of_antianginals !== '' ? parseInt(row.number_of_antianginals, 10) : null);
      reqFollowup.input('dual_antiplatelets', sql.NVarChar(50), row.dual_antiplatelets || 'No');
      reqFollowup.input('statins', sql.NVarChar(50), row.statins || 'No');
      reqFollowup.input('beta_blocker', sql.NVarChar(50), row.beta_blocker || 'No');
      reqFollowup.input('acei_arb', sql.NVarChar(50), row.acei_arb || 'No');
      reqFollowup.input('aldosterone_antagonist', sql.NVarChar(50), row.aldosterone_antagonist || 'No');
      reqFollowup.input('acs_hospitalization', sql.NVarChar(50), row.acs_hospitalization || 'No');
      reqFollowup.input('ptca', sql.NVarChar(50), row.ptca || 'No');
      reqFollowup.input('cabg', sql.NVarChar(50), row.cabg || 'No');
      reqFollowup.input('death', sql.NVarChar(50), row.death || 'No');
      reqFollowup.input('other_event', sql.NVarChar(255), row.other_event || '');
      reqFollowup.input('visit_mode', sql.VarChar(50), row.visit_mode || val('visit_mode', null) || 'In-Person');
      reqFollowup.input('special_instructions', sql.NVarChar(500), row.special_instructions !== undefined && row.special_instructions !== null && row.special_instructions !== '' ? row.special_instructions : (val('special_instructions', null) || val('special_clinical_instructions', null) || 'Follow-up in cardiology OPD with repeat lipid profile and ECG.'));

      let finalFollowupDate = row.followup_date;
      if (!finalFollowupDate && baseFollowupDate) {
        finalFollowupDate = calculateBackendExpectedDate(baseFollowupDate, monthsToAdd);
      }
      if (typeof finalFollowupDate === 'string') {
        finalFollowupDate = finalFollowupDate.trim();
        if (finalFollowupDate.includes('T')) finalFollowupDate = finalFollowupDate.split('T')[0];
        if (finalFollowupDate === '' || finalFollowupDate === 'null' || finalFollowupDate === 'undefined') {
          finalFollowupDate = null;
        }
      }
      reqFollowup.input('followup_date', sql.Date, finalFollowupDate ? new Date(finalFollowupDate) : null);

      await reqFollowup.query(`
        -- 1. UPSERT into nstemi_followup
        IF EXISTS (
          SELECT 1 FROM [nstemi_followup] 
          WHERE [nstemi_id] = @nstemi_id AND [followup_month] = @followup_month
        )
        BEGIN
          UPDATE [nstemi_followup]
          SET
            [followup_date] = @followup_date,
            [angina] = @angina,
            [functional_class] = @functional_class,
            [number_of_antianginals] = @number_of_antianginals,
            [dual_antiplatelets] = @dual_antiplatelets,
            [statins] = @statins,
            [beta_blocker] = @beta_blocker,
            [acei_arb] = @acei_arb,
            [aldosterone_antagonist] = @aldosterone_antagonist,
            [acs_hospitalization] = @acs_hospitalization,
            [ptca] = @ptca,
            [cabg] = @cabg,
            [death] = @death,
            [other_event] = @other_event,
            [visit_mode] = @visit_mode,
            [special_instructions] = @special_instructions,
            [updated_at] = GETDATE()
          WHERE [nstemi_id] = @nstemi_id AND [followup_month] = @followup_month;
        END
        ELSE
        BEGIN
          INSERT INTO [nstemi_followup] (
            [nstemi_id], [followup_month], [followup_date], [angina], [functional_class], [number_of_antianginals],
            [dual_antiplatelets], [statins], [beta_blocker], [acei_arb], [aldosterone_antagonist],
            [acs_hospitalization], [ptca], [cabg], [death], [other_event],
            [visit_mode], [special_instructions], [created_at], [updated_at]
          ) VALUES (
            @nstemi_id, @followup_month, @followup_date, @angina, @functional_class, @number_of_antianginals,
            @dual_antiplatelets, @statins, @beta_blocker, @acei_arb, @aldosterone_antagonist,
            @acs_hospitalization, @ptca, @cabg, @death, @other_event,
            @visit_mode, @special_instructions, GETDATE(), GETDATE()
          );
        END

        -- 2. Synchronize into patient_followup_tasks checking both patientId and timeframe
        IF EXISTS (
          SELECT 1 FROM [patient_followup_tasks]
          WHERE [reg_patient_id] = @reg_patient_id AND [timeframe] = @followup_month AND [source_registry] = 'NSTEMI Registry'
        )
        BEGIN
          UPDATE [patient_followup_tasks]
          SET
            [target_date] = @followup_date,
            [visit_mode] = @visit_mode,
            [special_instructions] = @special_instructions,
            [source_record_id] = @nstemi_id,
            [updated_at] = GETDATE()
          WHERE [reg_patient_id] = @reg_patient_id AND [timeframe] = @followup_month AND [source_registry] = 'NSTEMI Registry';
        END
        ELSE
        BEGIN
          SET IDENTITY_INSERT [patient_followup_tasks] ON;

          DECLARE @nextTaskId INT;
          SELECT @nextTaskId = ISNULL(MAX(task_id), 0) + 1 FROM [patient_followup_tasks] WITH (TABLOCKX, HOLDLOCK);

          INSERT INTO [patient_followup_tasks] (
            [task_id], [reg_patient_id], [source_registry], [source_record_id], [is_followup_required],
            [timeframe], [target_date], [clinic_location], [visit_mode], [special_instructions],
            [status], [created_at], [updated_at]
          ) VALUES (
            @nextTaskId, @reg_patient_id, 'NSTEMI Registry', @nstemi_id, 'Yes',
            @followup_month, @followup_date, 'CARE Heart Institute', @visit_mode, @special_instructions,
            'Required', GETDATE(), GETDATE()
          );

          SET IDENTITY_INSERT [patient_followup_tasks] OFF;
        END
      `);
    }

    await transaction.commit();

    logAuditTrail(
      req,
      'UPDATE',
      'NSTEMI',
      val('ip_no') || val('acs_no') || oldRecord.ip_no || nstemi_id,
      val('reg_patient_id') || oldRecord.reg_patient_id || 1,
      oldRecord,
      payload
    ).catch(err => console.error('[NSTEMI Audit] Update error:', err));

    return res.status(200).json({
      success: true,
      message: 'NSTEMI Registry record successfully updated.'
    });

  } catch (error) {
    console.error('❌ Error updating NSTEMI Record:', error);
    if (transaction) {
      try { await transaction.rollback(); } catch (r) {}
    }
    return res.status(500).json({
      success: false,
      message: error.message || 'Internal server error while updating NSTEMI record.'
    });
  }
}

module.exports = {
  createNstemiRecord,
  getNstemiHistory,
  getNstemiRecord,
  updateNstemiRecord,
  deleteNstemiRecord,
  undeleteNstemiRecord
};
