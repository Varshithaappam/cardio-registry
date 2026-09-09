const { getPool, sql } = require('../config/db');

/**
 * Controller to handle full STEMI Registry CRUD across all 9 modular tables
 * using atomic SQL Transactions matching script.sql database schemas.
 * 
 * Modular Tables:
 * 1. stemi_registry (Parent)
 * 2. stemi_administrative
 * 3. stemi_clinical_assessment
 * 4. stemi_treatment_strategy
 * 5. stemi_diagnostics
 * 6. stemi_outcomes
 * 7. stemi_hospitalization
 * 8. stemi_followup
 * 9. stemi_appropriateness
 */

// Helper to sanitize payload fields (empty string/undefined -> null)
const val = (payload, key, defaultVal = null) => {
  const v = payload[key];
  if (v === undefined || v === null || v === '') return defaultVal;
  return v;
};

// Helper to convert to 'Yes', 'No', 'Unknown' string
const strVal = (payload, key, defaultVal = 'No') => {
  const v = payload[key];
  if (v === true || v === 1 || v === '1' || v === 'Yes' || v === 'yes' || v === 'True' || v === 'Done') return 'Yes';
  if (v === false || v === 0 || v === '0' || v === 'No' || v === 'no' || v === 'False' || v === 'Not done') return 'No';
  if (v === 'Unknown' || v === 'unknown') return 'Unknown';
  if (typeof v === 'string' && v.trim().length > 0) return v.trim();
  return defaultVal;
};

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

/**
 * POST /api/stemi - Submit new STEMI registry record
 */
async function createStemiRecord(req, res) {
  let transaction;
  try {
    const payload = req.body || {};
    const getVal = (k, def = null) => val(payload, k, def);
    const getStr = (k, def = 'No') => strVal(payload, k, def);

    const admission_date = getVal('admission_date');
    const discharge_date = getVal('discharge_date');
    if (admission_date && discharge_date && new Date(discharge_date) < new Date(admission_date)) {
      return res.status(400).json({
        success: false,
        message: 'Discharge date cannot be earlier than Admission date.'
      });
    }

    const pool = await getPool();
    transaction = new sql.Transaction(pool);
    await transaction.begin(sql.ISOLATION_LEVEL.READ_COMMITTED);

    // Generate next ip_no if not provided
    let finalIpNo = getVal('ip_no');
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
    let candidateAcsNo = getVal('acs_no') || finalIpNo;
    const dupCheck = await transaction.request()
      .input('candidate_acs', sql.VarChar(50), candidateAcsNo)
      .query(`SELECT 1 FROM [dbo].[stemi_registry] WHERE [acs_no] = @candidate_acs`);

    if (dupCheck.recordset.length > 0) {
      candidateAcsNo = `ACS-STEMI-${Date.now().toString().slice(-5)}-${Math.floor(100 + Math.random() * 900)}`;
    }
    const finalAcsNo = candidateAcsNo;

    // Check if status column exists in stemi_registry at runtime via Node.js
    const hasStatusColRes = await transaction.request().query(
      `SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.stemi_registry') AND name = 'status'`
    );
    const hasStatusCol = hasStatusColRes.recordset.length > 0;

    // ==========================================
    // TABLE 1: stemi_registry (Parent Table)
    // ==========================================
    const reqRegistry = new sql.Request(transaction);
    reqRegistry.input('reg_patient_id', sql.Int, parseInt(getVal('reg_patient_id', 1), 10));
    reqRegistry.input('acs_no', sql.VarChar(50), finalAcsNo);
    reqRegistry.input('ip_no', sql.VarChar(30), finalIpNo);
    reqRegistry.input('admission_date', sql.Date, admission_date ? new Date(admission_date) : new Date());
    reqRegistry.input('discharge_date', sql.Date, discharge_date ? new Date(discharge_date) : null);
    reqRegistry.input('primary_consultant', sql.VarChar(150), getVal('primary_consultant', 'Dr. K. Sridhar (Cardiologist)'));
    if (hasStatusCol) {
      reqRegistry.input('status', sql.Int, payload.status === 'draft' || payload.isDraft ? 2 : 0);
    }

    const registryResult = await reqRegistry.query(`
      INSERT INTO [stemi_registry] (
        [reg_patient_id], [acs_no], [ip_no], [admission_date], [discharge_date], [primary_consultant]
        ${hasStatusCol ? ', [status]' : ''}, [created_at], [updated_at]
      )
      OUTPUT INSERTED.[stemi_id]
      VALUES (
        @reg_patient_id, @acs_no, @ip_no, @admission_date, @discharge_date, @primary_consultant
        ${hasStatusCol ? ', @status' : ''}, GETDATE(), GETDATE()
      );
    `);

    const stemi_id = registryResult.recordset[0].stemi_id;

    // ==========================================
    // TABLE 2: stemi_administrative
    // ==========================================
    const reqAdmin = new sql.Request(transaction);
    reqAdmin.input('stemi_id', sql.Int, stemi_id);
    reqAdmin.input('hypertension', sql.NVarChar(7), getStr('hypertension'));
    reqAdmin.input('diabetes', sql.NVarChar(7), getStr('diabetes'));
    reqAdmin.input('smoking', sql.NVarChar(7), getStr('smoking'));
    reqAdmin.input('renal_failure', sql.NVarChar(7), getStr('renal_failure'));
    reqAdmin.input('copd', sql.NVarChar(7), getStr('copd'));
    reqAdmin.input('cva', sql.NVarChar(7), getStr('cva'));
    reqAdmin.input('prior_acs', sql.NVarChar(7), getStr('prior_acs'));
    reqAdmin.input('prior_ptca', sql.NVarChar(7), getStr('prior_ptca'));
    reqAdmin.input('prior_cabg', sql.NVarChar(7), getStr('prior_cabg'));
    reqAdmin.input('other_background', sql.VarChar(255), getVal('other_background'));

    await reqAdmin.query(`
      INSERT INTO [stemi_administrative] (
        [stemi_id], [hypertension], [diabetes], [smoking], [renal_failure], [copd], [cva],
        [prior_acs], [prior_ptca], [prior_cabg], [other_background], [created_at], [updated_at]
      ) VALUES (
        @stemi_id, @hypertension, @diabetes, @smoking, @renal_failure, @copd, @cva,
        @prior_acs, @prior_ptca, @prior_cabg, @other_background, GETDATE(), GETDATE()
      );
    `);

    // ==========================================
    // TABLE 3: stemi_clinical_assessment
    // ==========================================
    const reqClinical = new sql.Request(transaction);
    reqClinical.input('stemi_id', sql.Int, stemi_id);
    reqClinical.input('typical_angina', sql.NVarChar(3), getStr('typical_angina'));
    reqClinical.input('atypical_chest_pain', sql.NVarChar(3), getStr('atypical_chest_pain'));
    reqClinical.input('breathlessness', sql.NVarChar(3), getStr('breathlessness'));
    reqClinical.input('syncope_presyncope', sql.NVarChar(3), getStr('syncope_presyncope'));
    reqClinical.input('pulse_rate', sql.Int, getVal('pulse_rate') ? parseInt(getVal('pulse_rate'), 10) : null);
    reqClinical.input('systolic_bp', sql.Int, getVal('systolic_bp') ? parseInt(getVal('systolic_bp'), 10) : null);
    reqClinical.input('diastolic_bp', sql.Int, getVal('diastolic_bp') ? parseInt(getVal('diastolic_bp'), 10) : null);
    reqClinical.input('age_gt_75', sql.NVarChar(3), getStr('age_gt_75'));
    reqClinical.input('age_65_to_74', sql.NVarChar(3), getStr('age_65_to_74'));
    reqClinical.input('history_dm_htn_angina', sql.NVarChar(3), getStr('history_dm_htn_angina'));
    reqClinical.input('sbp_lt_100', sql.NVarChar(3), getStr('sbp_lt_100'));
    reqClinical.input('heart_rate_gt_100', sql.NVarChar(3), getStr('heart_rate_gt_100'));
    reqClinical.input('killip_class_ii_to_iv', sql.NVarChar(3), getStr('killip_class_ii_to_iv'));
    reqClinical.input('anterior_mi_or_lbbb', sql.NVarChar(3), getStr('anterior_mi_or_lbbb'));
    reqClinical.input('weight_lt_67kg', sql.NVarChar(3), getStr('weight_lt_67kg'));
    reqClinical.input('reperfusion_gt_4hrs', sql.NVarChar(3), getStr('reperfusion_gt_4hrs'));
    reqClinical.input('lvf', sql.NVarChar(3), getStr('lvf'));
    reqClinical.input('vt_vf', sql.NVarChar(3), getStr('vt_vf'));
    reqClinical.input('bbb_chb', sql.NVarChar(3), getStr('bbb_chb'));
    reqClinical.input('elevated_bnp', sql.NVarChar(3), getStr('elevated_bnp'));
    reqClinical.input('elevated_crp', sql.NVarChar(3), getStr('elevated_crp'));
    reqClinical.input('timi_total_score', sql.Int, getVal('timi_total_score') !== null ? parseInt(getVal('timi_total_score'), 10) : 0);

    await reqClinical.query(`
      INSERT INTO [stemi_clinical_assessment] (
        [stemi_id], [typical_angina], [atypical_chest_pain], [breathlessness], [syncope_presyncope],
        [pulse_rate], [systolic_bp], [diastolic_bp], [age_gt_75], [age_65_to_74], [history_dm_htn_angina],
        [sbp_lt_100], [heart_rate_gt_100], [killip_class_ii_to_iv], [anterior_mi_or_lbbb], [weight_lt_67kg],
        [reperfusion_gt_4hrs], [lvf], [vt_vf], [bbb_chb], [elevated_bnp], [elevated_crp], [timi_total_score],
        [created_at], [updated_at]
      ) VALUES (
        @stemi_id, @typical_angina, @atypical_chest_pain, @breathlessness, @syncope_presyncope,
        @pulse_rate, @systolic_bp, @diastolic_bp, @age_gt_75, @age_65_to_74, @history_dm_htn_angina,
        @sbp_lt_100, @heart_rate_gt_100, @killip_class_ii_to_iv, @anterior_mi_or_lbbb, @weight_lt_67kg,
        @reperfusion_gt_4hrs, @lvf, @vt_vf, @bbb_chb, @elevated_bnp, @elevated_crp, @timi_total_score,
        GETDATE(), GETDATE()
      );
    `);

    // ==========================================
    // TABLE 4: stemi_treatment_strategy
    // ==========================================
    const reqTx = new sql.Request(transaction);
    reqTx.input('stemi_id', sql.Int, stemi_id);
    reqTx.input('pami', sql.NVarChar(3), getStr('pami'));
    reqTx.input('thrombolysis', sql.NVarChar(3), getStr('thrombolysis'));
    reqTx.input('conservative', sql.NVarChar(3), getStr('conservative'));
    reqTx.input('door_to_balloon_time', sql.Int, getVal('door_to_balloon_time') ? parseInt(getVal('door_to_balloon_time'), 10) : null);
    reqTx.input('vessel_lmca', sql.NVarChar(3), getStr('vessel_lmca'));
    reqTx.input('vessel_lad', sql.NVarChar(3), getStr('vessel_lad'));
    reqTx.input('vessel_diagonal', sql.NVarChar(3), getStr('vessel_diagonal'));
    reqTx.input('vessel_lcx', sql.NVarChar(3), getStr('vessel_lcx'));
    reqTx.input('vessel_ramus', sql.NVarChar(3), getStr('vessel_ramus'));
    reqTx.input('vessel_om', sql.NVarChar(3), getStr('vessel_om'));
    reqTx.input('vessel_rca', sql.NVarChar(3), getStr('vessel_rca'));
    reqTx.input('vessel_pda', sql.NVarChar(3), getStr('vessel_pda'));
    reqTx.input('vessel_segment', sql.VarChar(100), getVal('vessel_segment'));
    reqTx.input('thrombosuction_done', sql.NVarChar(3), getStr('thrombosuction_done'));
    reqTx.input('thrombosuction_not_done', sql.NVarChar(3), getStr('thrombosuction_not_done'));
    reqTx.input('stent_bms', sql.NVarChar(3), getStr('stent_bms'));
    reqTx.input('stent_des', sql.NVarChar(3), getStr('stent_des'));
    reqTx.input('stent_diameter', sql.Decimal(5, 2), getVal('stent_diameter') ? parseFloat(getVal('stent_diameter')) : null);
    reqTx.input('stent_length', sql.Decimal(5, 2), getVal('stent_length') ? parseFloat(getVal('stent_length')) : null);
    reqTx.input('procedural_success', sql.NVarChar(3), getStr('procedural_success', 'Yes'));
    reqTx.input('timi_flow', sql.TinyInt, getVal('timi_flow') !== null ? parseInt(getVal('timi_flow'), 10) : 3);
    reqTx.input('complication_none', sql.NVarChar(3), getStr('complication_none', 'Yes'));
    reqTx.input('complication_tamponade', sql.NVarChar(3), getStr('complication_tamponade'));
    reqTx.input('complication_major_bleed', sql.NVarChar(3), getStr('complication_major_bleed'));
    reqTx.input('complication_stroke', sql.NVarChar(3), getStr('complication_stroke'));
    reqTx.input('complication_stent_thrombosis', sql.NVarChar(3), getStr('complication_stent_thrombosis'));
    reqTx.input('complication_mi', sql.NVarChar(3), getStr('complication_mi'));
    reqTx.input('complication_death', sql.NVarChar(3), getStr('complication_death'));
    reqTx.input('complication_emergency_cabg', sql.NVarChar(3), getStr('complication_emergency_cabg'));
    reqTx.input('door_to_needle_time', sql.Int, getVal('door_to_needle_time') ? parseInt(getVal('door_to_needle_time'), 10) : null);
    reqTx.input('drug_stk', sql.NVarChar(3), getStr('drug_stk'));
    reqTx.input('drug_uk', sql.NVarChar(3), getStr('drug_uk'));
    reqTx.input('drug_reteplase', sql.NVarChar(3), getStr('drug_reteplase'));
    reqTx.input('drug_tenecteplase', sql.NVarChar(3), getStr('drug_tenecteplase'));
    reqTx.input('thrombolysis_dose', sql.VarChar(100), getVal('thrombolysis_dose'));
    reqTx.input('beta_blocker', sql.NVarChar(3), getStr('beta_blocker'));
    reqTx.input('calcium_channel_blocker', sql.NVarChar(3), getStr('calcium_channel_blocker'));
    reqTx.input('nitrate', sql.NVarChar(3), getStr('nitrate'));
    reqTx.input('nicorandil', sql.NVarChar(3), getStr('nicorandil'));
    reqTx.input('ivabradine', sql.NVarChar(3), getStr('ivabradine'));
    reqTx.input('ranolazine', sql.NVarChar(3), getStr('ranolazine'));
    reqTx.input('trimetazidine', sql.NVarChar(3), getStr('trimetazidine'));
    reqTx.input('aspirin', sql.NVarChar(3), getStr('aspirin', 'Yes'));
    reqTx.input('clopidogrel', sql.NVarChar(3), getStr('clopidogrel'));
    reqTx.input('prasugrel', sql.NVarChar(3), getStr('prasugrel'));
    reqTx.input('ticagrelor', sql.NVarChar(3), getStr('ticagrelor', 'Yes'));
    reqTx.input('heparin_ufh_iv', sql.NVarChar(3), getStr('heparin_ufh_iv'));
    reqTx.input('heparin_ufh_sc', sql.NVarChar(3), getStr('heparin_ufh_sc'));
    reqTx.input('heparin_lmwh', sql.NVarChar(3), getStr('heparin_lmwh'));
    reqTx.input('heparin_ufh_iv_sc', sql.NVarChar(3), getStr('heparin_ufh_iv_sc'));
    reqTx.input('heparin_ufh_iv_lmwh', sql.NVarChar(3), getStr('heparin_ufh_iv_lmwh'));
    reqTx.input('gp2b3a', sql.NVarChar(3), getStr('gp2b3a'));
    reqTx.input('bivaluridin', sql.NVarChar(3), getStr('bivaluridin'));
    reqTx.input('statin', sql.NVarChar(3), getStr('statin', 'Yes'));
    reqTx.input('statin_10mg', sql.NVarChar(3), getStr('statin_10mg'));
    reqTx.input('statin_20mg', sql.NVarChar(3), getStr('statin_20mg'));
    reqTx.input('statin_40mg', sql.NVarChar(3), getStr('statin_40mg'));
    reqTx.input('statin_80mg', sql.NVarChar(3), getStr('statin_80mg'));
    reqTx.input('other_drugs', sql.VarChar(255), getVal('other_drugs'));
    reqTx.input('cag', sql.NVarChar(3), getStr('cag'));
    reqTx.input('iabp', sql.NVarChar(3), getStr('iabp'));
    reqTx.input('invasive_ventilation', sql.NVarChar(3), getStr('invasive_ventilation'));
    reqTx.input('ptca', sql.NVarChar(3), getStr('ptca'));
    reqTx.input('cabg', sql.NVarChar(3), getStr('cabg'));
    reqTx.input('other_procedure', sql.VarChar(255), getVal('other_procedure'));

    await reqTx.query(`
      INSERT INTO [stemi_treatment_strategy] (
        [stemi_id], [pami], [thrombolysis], [conservative], [door_to_balloon_time],
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
        [cag], [iabp], [invasive_ventilation], [ptca], [cabg], [other_procedure], [created_at], [updated_at]
      ) VALUES (
        @stemi_id, @pami, @thrombolysis, @conservative, @door_to_balloon_time,
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
        @cag, @iabp, @invasive_ventilation, @ptca, @cabg, @other_procedure, GETDATE(), GETDATE()
      );
    `);

    // ==========================================
    // TABLE 5: stemi_diagnostics
    // ==========================================
    const reqDiag = new sql.Request(transaction);
    reqDiag.input('stemi_id', sql.Int, stemi_id);
    reqDiag.input('bedside_echo', sql.NVarChar(3), getStr('bedside_echo'));
    reqDiag.input('departmental_echo', sql.NVarChar(3), getStr('departmental_echo'));
    reqDiag.input('stress_testing', sql.NVarChar(3), getStr('stress_testing'));
    reqDiag.input('lipid_profile', sql.NVarChar(3), getStr('lipid_profile'));
    reqDiag.input('bnp', sql.NVarChar(3), getStr('bnp'));
    reqDiag.input('crp', sql.NVarChar(3), getStr('crp'));
    reqDiag.input('troponin_test', sql.NVarChar(3), getStr('troponin_test'));
    reqDiag.input('cpk_ckmb', sql.NVarChar(3), getStr('cpk_ckmb'));
    reqDiag.input('rft', sql.NVarChar(3), getStr('rft'));
    reqDiag.input('lft', sql.NVarChar(3), getStr('lft'));
    reqDiag.input('electrolytes', sql.NVarChar(3), getStr('electrolytes'));
    reqDiag.input('hemogram', sql.NVarChar(3), getStr('hemogram'));
    reqDiag.input('cxr', sql.NVarChar(3), getStr('cxr'));
    reqDiag.input('diagnostic_other', sql.VarChar(255), getVal('diagnostic_other'));
    reqDiag.input('ecg_heart_rate', sql.Int, getVal('ecg_heart_rate') ? parseInt(getVal('ecg_heart_rate'), 10) : null);
    reqDiag.input('av_block_none', sql.NVarChar(3), getStr('av_block_none', 'Yes'));
    reqDiag.input('av_block_first_degree', sql.NVarChar(3), getStr('av_block_first_degree'));
    reqDiag.input('av_block_second_degree', sql.NVarChar(3), getStr('av_block_second_degree'));
    reqDiag.input('av_block_chb', sql.NVarChar(3), getStr('av_block_chb'));
    reqDiag.input('bbb_none', sql.NVarChar(3), getStr('bbb_none', 'Yes'));
    reqDiag.input('bbb_rbbb', sql.NVarChar(3), getStr('bbb_rbbb'));
    reqDiag.input('bbb_lbbb', sql.NVarChar(3), getStr('bbb_lbbb'));
    reqDiag.input('bbb_indeterminate', sql.NVarChar(3), getStr('bbb_indeterminate'));
    reqDiag.input('qwaves_none', sql.NVarChar(3), getStr('qwaves_none', 'Yes'));
    reqDiag.input('qwaves_inferior', sql.NVarChar(3), getStr('qwaves_inferior'));
    reqDiag.input('qwaves_anteroseptal', sql.NVarChar(3), getStr('qwaves_anteroseptal'));
    reqDiag.input('qwaves_anterior', sql.NVarChar(3), getStr('qwaves_anterior'));
    reqDiag.input('qwaves_anterolateral', sql.NVarChar(3), getStr('qwaves_anterolateral'));
    reqDiag.input('qwaves_lateral', sql.NVarChar(3), getStr('qwaves_lateral'));
    reqDiag.input('st_depression_none', sql.NVarChar(3), getStr('st_depression_none', 'Yes'));
    reqDiag.input('st_depression_inferior', sql.NVarChar(3), getStr('st_depression_inferior'));
    reqDiag.input('st_depression_anteroseptal', sql.NVarChar(3), getStr('st_depression_anteroseptal'));
    reqDiag.input('st_depression_anterior', sql.NVarChar(3), getStr('st_depression_anterior'));
    reqDiag.input('st_depression_anterolateral', sql.NVarChar(3), getStr('st_depression_anterolateral'));
    reqDiag.input('st_depression_lateral', sql.NVarChar(3), getStr('st_depression_lateral'));
    reqDiag.input('t_inversion_none', sql.NVarChar(3), getStr('t_inversion_none', 'Yes'));
    reqDiag.input('t_inversion_inferior', sql.NVarChar(3), getStr('t_inversion_inferior'));
    reqDiag.input('t_inversion_anteroseptal', sql.NVarChar(3), getStr('t_inversion_anteroseptal'));
    reqDiag.input('t_inversion_anterior', sql.NVarChar(3), getStr('t_inversion_anterior'));
    reqDiag.input('t_inversion_anterolateral', sql.NVarChar(3), getStr('t_inversion_anterolateral'));
    reqDiag.input('t_inversion_lateral', sql.NVarChar(3), getStr('t_inversion_lateral'));
    reqDiag.input('rhythm_nsr', sql.NVarChar(3), getStr('rhythm_nsr', 'Yes'));
    reqDiag.input('rhythm_af', sql.NVarChar(3), getStr('rhythm_af'));
    reqDiag.input('rhythm_svt', sql.NVarChar(3), getStr('rhythm_svt'));
    reqDiag.input('rhythm_vt', sql.NVarChar(3), getStr('rhythm_vt'));
    reqDiag.input('rhythm_vf', sql.NVarChar(3), getStr('rhythm_vf'));
    reqDiag.input('ecg_other', sql.NVarChar(sql.MAX), getVal('ecg_other'));
    reqDiag.input('echo_ef', sql.Decimal(5, 2), getVal('echo_ef') ? parseFloat(getVal('echo_ef')) : null);
    reqDiag.input('lv_function_normal', sql.NVarChar(3), getStr('lv_function_normal', 'Yes'));
    reqDiag.input('lv_function_mild_lvd', sql.NVarChar(3), getStr('lv_function_mild_lvd'));
    reqDiag.input('lv_function_moderate_lvd', sql.NVarChar(3), getStr('lv_function_moderate_lvd'));
    reqDiag.input('lv_function_severe_lvd', sql.NVarChar(3), getStr('lv_function_severe_lvd'));
    reqDiag.input('rwma_lad', sql.NVarChar(3), getStr('rwma_lad'));
    reqDiag.input('rwma_rca', sql.NVarChar(3), getStr('rwma_rca'));
    reqDiag.input('rwma_lcx', sql.NVarChar(3), getStr('rwma_lcx'));
    reqDiag.input('mr_none', sql.NVarChar(3), getStr('mr_none', 'Yes'));
    reqDiag.input('mr_mild', sql.NVarChar(3), getStr('mr_mild'));
    reqDiag.input('mr_moderate', sql.NVarChar(3), getStr('mr_moderate'));
    reqDiag.input('mr_severe', sql.NVarChar(3), getStr('mr_severe'));
    reqDiag.input('echo_e', sql.Decimal(6, 2), getVal('echo_e') ? parseFloat(getVal('echo_e')) : null);
    reqDiag.input('echo_a', sql.Decimal(6, 2), getVal('echo_a') ? parseFloat(getVal('echo_a')) : null);
    reqDiag.input('echo_dt', sql.Decimal(6, 2), getVal('echo_dt') ? parseFloat(getVal('echo_dt')) : null);
    reqDiag.input('echo_e_prime', sql.Decimal(6, 2), getVal('echo_e_prime') ? parseFloat(getVal('echo_e_prime')) : null);
    reqDiag.input('echo_tapsv', sql.Decimal(6, 2), getVal('echo_tapsv') ? parseFloat(getVal('echo_tapsv')) : null);
    reqDiag.input('echo_other', sql.NVarChar(sql.MAX), getVal('echo_other'));
    reqDiag.input('hemoglobin', sql.Decimal(5, 2), getVal('hemoglobin') ? parseFloat(getVal('hemoglobin')) : null);
    reqDiag.input('creatinine', sql.Decimal(6, 2), getVal('creatinine') ? parseFloat(getVal('creatinine')) : null);
    reqDiag.input('troponin_i', sql.VarChar(50), getVal('troponin_i'));
    reqDiag.input('cpk', sql.VarChar(50), getVal('cpk'));
    reqDiag.input('ck_mb', sql.VarChar(50), getVal('ck_mb'));
    reqDiag.input('sodium', sql.Decimal(5, 2), getVal('sodium') ? parseFloat(getVal('sodium')) : null);
    reqDiag.input('potassium', sql.Decimal(5, 2), getVal('potassium') ? parseFloat(getVal('potassium')) : null);
    reqDiag.input('rbs_admission', sql.Decimal(6, 2), getVal('rbs_admission') ? parseFloat(getVal('rbs_admission')) : null);
    reqDiag.input('angiogram_done', sql.NVarChar(3), getStr('angiogram_done'));
    reqDiag.input('angiogram_normal', sql.NVarChar(3), getStr('angiogram_normal'));
    reqDiag.input('angiogram_1vd', sql.NVarChar(3), getStr('angiogram_1vd'));
    reqDiag.input('angiogram_2vd', sql.NVarChar(3), getStr('angiogram_2vd'));
    reqDiag.input('angiogram_3vd', sql.NVarChar(3), getStr('angiogram_3vd'));
    reqDiag.input('angiogram_lmca', sql.NVarChar(3), getStr('angiogram_lmca'));

    await reqDiag.query(`
      INSERT INTO [stemi_diagnostics] (
        [stemi_id], [bedside_echo], [departmental_echo], [stress_testing], [lipid_profile],
        [bnp], [crp], [troponin_test], [cpk_ckmb], [rft], [lft], [electrolytes], [hemogram], [cxr],
        [diagnostic_other], [ecg_heart_rate], [av_block_none], [av_block_first_degree], [av_block_second_degree],
        [av_block_chb], [bbb_none], [bbb_rbbb], [bbb_lbbb], [bbb_indeterminate], [qwaves_none],
        [qwaves_inferior], [qwaves_anteroseptal], [qwaves_anterior], [qwaves_anterolateral], [qwaves_lateral],
        [st_depression_none], [st_depression_inferior], [st_depression_anteroseptal], [st_depression_anterior],
        [st_depression_anterolateral], [st_depression_lateral], [t_inversion_none], [t_inversion_inferior],
        [t_inversion_anteroseptal], [t_inversion_anterior], [t_inversion_anterolateral], [t_inversion_lateral],
        [rhythm_nsr], [rhythm_af], [rhythm_svt], [rhythm_vt], [rhythm_vf], [ecg_other], [echo_ef],
        [lv_function_normal], [lv_function_mild_lvd], [lv_function_moderate_lvd], [lv_function_severe_lvd],
        [rwma_lad], [rwma_rca], [rwma_lcx], [mr_none], [mr_mild], [mr_moderate], [mr_severe],
        [echo_e], [echo_a], [echo_dt], [echo_e_prime], [echo_tapsv], [echo_other], [hemoglobin],
        [creatinine], [troponin_i], [cpk], [ck_mb], [sodium], [potassium], [rbs_admission],
        [angiogram_done], [angiogram_normal], [angiogram_1vd], [angiogram_2vd], [angiogram_3vd], [angiogram_lmca],
        [created_at], [updated_at]
      ) VALUES (
        @stemi_id, @bedside_echo, @departmental_echo, @stress_testing, @lipid_profile,
        @bnp, @crp, @troponin_test, @cpk_ckmb, @rft, @lft, @electrolytes, @hemogram, @cxr,
        @diagnostic_other, @ecg_heart_rate, @av_block_none, @av_block_first_degree, @av_block_second_degree,
        @av_block_chb, @bbb_none, @bbb_rbbb, @bbb_lbbb, @bbb_indeterminate, @qwaves_none,
        @qwaves_inferior, @qwaves_anteroseptal, @qwaves_anterior, @qwaves_anterolateral, @qwaves_lateral,
        @st_depression_none, @st_depression_inferior, @st_depression_anteroseptal, @st_depression_anterior,
        @st_depression_anterolateral, @st_depression_lateral, @t_inversion_none, @t_inversion_inferior,
        @t_inversion_anteroseptal, @t_inversion_anterior, @t_inversion_anterolateral, @t_inversion_lateral,
        @rhythm_nsr, @rhythm_af, @rhythm_svt, @rhythm_vt, @rhythm_vf, @ecg_other, @echo_ef,
        @lv_function_normal, @lv_function_mild_lvd, @lv_function_moderate_lvd, @lv_function_severe_lvd,
        @rwma_lad, @rwma_rca, @rwma_lcx, @mr_none, @mr_mild, @mr_moderate, @mr_severe,
        @echo_e, @echo_a, @echo_dt, @echo_e_prime, @echo_tapsv, @echo_other, @hemoglobin,
        @creatinine, @troponin_i, @cpk, @ck_mb, @sodium, @potassium, @rbs_admission,
        @angiogram_done, @angiogram_normal, @angiogram_1vd, @angiogram_2vd, @angiogram_3vd, @angiogram_lmca,
        GETDATE(), GETDATE()
      );
    `);

    // ==========================================
    // TABLE 6: stemi_outcomes
    // ==========================================
    const reqOutcomes = new sql.Request(transaction);
    reqOutcomes.input('stemi_id', sql.Int, stemi_id);
    reqOutcomes.input('death', sql.NVarChar(3), getStr('death'));
    reqOutcomes.input('stemi_for_nonstemi', sql.NVarChar(3), getStr('stemi_for_nonstemi'));
    reqOutcomes.input('remi_for_stemi', sql.NVarChar(3), getStr('remi_for_stemi'));
    reqOutcomes.input('revascularization_recurrent_ischemia', sql.NVarChar(3), getStr('revascularization_recurrent_ischemia'));
    reqOutcomes.input('cva_thrombotic', sql.NVarChar(3), getStr('cva_thrombotic'));
    reqOutcomes.input('cva_hemorrhagic', sql.NVarChar(3), getStr('cva_hemorrhagic'));
    reqOutcomes.input('major_bleeding', sql.NVarChar(3), getStr('major_bleeding'));
    reqOutcomes.input('outcome_other', sql.VarChar(255), getVal('outcome_other'));
    reqOutcomes.input('beta_blocker', sql.NVarChar(3), getStr('discharge_beta_blocker'));
    reqOutcomes.input('calcium_channel_blocker', sql.NVarChar(3), getStr('discharge_calcium_channel_blocker'));
    reqOutcomes.input('nitrate', sql.NVarChar(3), getStr('discharge_nitrate'));
    reqOutcomes.input('nicorandil', sql.NVarChar(3), getStr('discharge_nicorandil'));
    reqOutcomes.input('ivabradine', sql.NVarChar(3), getStr('discharge_ivabradine'));
    reqOutcomes.input('ranolazine', sql.NVarChar(3), getStr('discharge_ranolazine'));
    reqOutcomes.input('trimetazidine', sql.NVarChar(3), getStr('discharge_trimetazidine'));
    reqOutcomes.input('aspirin', sql.NVarChar(3), getStr('discharge_aspirin', 'Yes'));
    reqOutcomes.input('clopidogrel', sql.NVarChar(3), getStr('discharge_clopidogrel'));
    reqOutcomes.input('prasugrel', sql.NVarChar(3), getStr('discharge_prasugrel'));
    reqOutcomes.input('ticagrelor', sql.NVarChar(3), getStr('discharge_ticagrelor', 'Yes'));
    reqOutcomes.input('statin', sql.NVarChar(3), getStr('discharge_statin', 'Yes'));
    reqOutcomes.input('statin_10mg', sql.NVarChar(3), getStr('discharge_statin_10mg'));
    reqOutcomes.input('statin_20mg', sql.NVarChar(3), getStr('discharge_statin_20mg'));
    reqOutcomes.input('statin_40mg', sql.NVarChar(3), getStr('discharge_statin_40mg'));
    reqOutcomes.input('statin_80mg', sql.NVarChar(3), getStr('discharge_statin_80mg'));
    reqOutcomes.input('discharge_other_medication', sql.VarChar(255), getVal('discharge_other_medication'));

    await reqOutcomes.query(`
      INSERT INTO [stemi_outcomes] (
        [stemi_id], [death], [stemi_for_nonstemi], [remi_for_stemi],
        [revascularization_recurrent_ischemia], [cva_thrombotic], [cva_hemorrhagic], [major_bleeding],
        [outcome_other], [beta_blocker], [calcium_channel_blocker], [nitrate], [nicorandil], [ivabradine],
        [ranolazine], [trimetazidine], [aspirin], [clopidogrel], [prasugrel], [ticagrelor], [statin],
        [statin_10mg], [statin_20mg], [statin_40mg], [statin_80mg], [discharge_other_medication],
        [created_at], [updated_at]
      ) VALUES (
        @stemi_id, @death, @stemi_for_nonstemi, @remi_for_stemi,
        @revascularization_recurrent_ischemia, @cva_thrombotic, @cva_hemorrhagic, @major_bleeding,
        @outcome_other, @beta_blocker, @calcium_channel_blocker, @nitrate, @nicorandil, @ivabradine,
        @ranolazine, @trimetazidine, @aspirin, @clopidogrel, @prasugrel, @ticagrelor, @statin,
        @statin_10mg, @statin_20mg, @statin_40mg, @statin_80mg, @discharge_other_medication,
        GETDATE(), GETDATE()
      );
    `);

    // ==========================================
    // TABLE 7: stemi_hospitalization
    // ==========================================
    const reqHosp = new sql.Request(transaction);
    reqHosp.input('stemi_id', sql.Int, stemi_id);
    reqHosp.input('iccu_hours', sql.Decimal(6, 2), getVal('iccu_hours') ? parseFloat(getVal('iccu_hours')) : null);
    reqHosp.input('stepdown_icu_hours', sql.Decimal(6, 2), getVal('stepdown_icu_hours') ? parseFloat(getVal('stepdown_icu_hours')) : null);
    reqHosp.input('floor_days', sql.Decimal(6, 2), getVal('floor_days') ? parseFloat(getVal('floor_days')) : null);
    reqHosp.input('total_hospital_stay_days', sql.Decimal(6, 2), getVal('total_hospital_stay_days') ? parseFloat(getVal('total_hospital_stay_days')) : null);
    reqHosp.input('bed_charges', sql.Decimal(12, 2), getVal('bed_charges') ? parseFloat(getVal('bed_charges')) : null);
    reqHosp.input('drugs_disposables_cost', sql.Decimal(12, 2), getVal('drugs_disposables_cost') ? parseFloat(getVal('drugs_disposables_cost')) : null);
    reqHosp.input('package_cost', sql.Decimal(12, 2), getVal('package_cost') ? parseFloat(getVal('package_cost')) : null);
    reqHosp.input('laboratory_cost', sql.Decimal(12, 2), getVal('laboratory_cost') ? parseFloat(getVal('laboratory_cost')) : null);
    reqHosp.input('non_invasive_lab_cost', sql.Decimal(12, 2), getVal('non_invasive_lab_cost') ? parseFloat(getVal('non_invasive_lab_cost')) : null);
    reqHosp.input('consultation_cost', sql.Decimal(12, 2), getVal('consultation_cost') ? parseFloat(getVal('consultation_cost')) : null);
    reqHosp.input('radiology_cost', sql.Decimal(12, 2), getVal('radiology_cost') ? parseFloat(getVal('radiology_cost')) : null);
    reqHosp.input('miscellaneous_cost', sql.Decimal(12, 2), getVal('miscellaneous_cost') ? parseFloat(getVal('miscellaneous_cost')) : null);
    reqHosp.input('total_cost', sql.Decimal(12, 2), getVal('total_cost') ? parseFloat(getVal('total_cost')) : null);

    await reqHosp.query(`
      INSERT INTO [stemi_hospitalization] (
        [stemi_id], [iccu_hours], [stepdown_icu_hours], [floor_days], [total_hospital_stay_days],
        [bed_charges], [drugs_disposables_cost], [package_cost], [laboratory_cost],
        [non_invasive_lab_cost], [consultation_cost], [radiology_cost], [miscellaneous_cost], [total_cost],
        [created_at], [updated_at]
      ) VALUES (
        @stemi_id, @iccu_hours, @stepdown_icu_hours, @floor_days, @total_hospital_stay_days,
        @bed_charges, @drugs_disposables_cost, @package_cost, @laboratory_cost,
        @non_invasive_lab_cost, @consultation_cost, @radiology_cost, @miscellaneous_cost, @total_cost,
        GETDATE(), GETDATE()
      );
    `);

    // ==========================================
    // TABLE 8: stemi_appropriateness
    // ==========================================
    const reqAppr = new sql.Request(transaction);
    reqAppr.input('stemi_id', sql.Int, stemi_id);
    reqAppr.input('iccu_admission', sql.NVarChar(14), getVal('appr_iccu_admission'));
    reqAppr.input('iccu_transfer_out', sql.NVarChar(14), getVal('appr_iccu_transfer_out'));
    reqAppr.input('thrombolysis_indication', sql.NVarChar(14), getVal('appr_thrombolysis_indication'));
    reqAppr.input('ptca_indication', sql.NVarChar(14), getVal('appr_ptca_indication'));
    reqAppr.input('invasive_monitoring', sql.NVarChar(14), getVal('appr_invasive_monitoring'));
    reqAppr.input('iabp_indication', sql.NVarChar(14), getVal('appr_iabp_indication'));
    reqAppr.input('invasive_ventilation', sql.NVarChar(14), getVal('appr_invasive_ventilation'));
    reqAppr.input('dialysis_indication', sql.NVarChar(14), getVal('appr_dialysis_indication'));
    reqAppr.input('other_procedure_name', sql.VarChar(100), getVal('appr_other_procedure_name'));
    reqAppr.input('other_procedure_appropriateness', sql.NVarChar(14), getVal('appr_other_procedure_appropriateness'));
    reqAppr.input('cardiac_enzymes', sql.NVarChar(14), getVal('appr_cardiac_enzymes'));
    reqAppr.input('bnp', sql.NVarChar(14), getVal('appr_bnp'));
    reqAppr.input('crp', sql.NVarChar(14), getVal('appr_crp'));
    reqAppr.input('lipid_profile', sql.NVarChar(14), getVal('appr_lipid_profile'));
    reqAppr.input('bedside_echo', sql.NVarChar(14), getVal('appr_bedside_echo'));
    reqAppr.input('chest_xray', sql.NVarChar(14), getVal('appr_chest_xray'));
    reqAppr.input('beta_blockers', sql.NVarChar(14), getVal('appr_beta_blockers'));
    reqAppr.input('aspirin', sql.NVarChar(14), getVal('appr_aspirin'));
    reqAppr.input('clopidogrel', sql.NVarChar(14), getVal('appr_clopidogrel'));
    reqAppr.input('ace_inhibitor', sql.NVarChar(14), getVal('appr_ace_inhibitor'));
    reqAppr.input('arb', sql.NVarChar(14), getVal('appr_arb'));
    reqAppr.input('statin', sql.NVarChar(14), getVal('appr_statin'));
    reqAppr.input('diuretic', sql.NVarChar(14), getVal('appr_diuretic'));
    reqAppr.input('lanoxin', sql.NVarChar(14), getVal('appr_lanoxin'));
    reqAppr.input('anticoagulant', sql.NVarChar(14), getVal('appr_anticoagulant'));
    reqAppr.input('amiodarone', sql.NVarChar(14), getVal('appr_amiodarone'));
    reqAppr.input('other_drug_name', sql.VarChar(100), getVal('appr_other_drug_name'));
    reqAppr.input('other_drug_appropriateness', sql.NVarChar(14), getVal('appr_other_drug_appropriateness'));

    await reqAppr.query(`
      INSERT INTO [stemi_appropriateness] (
        [stemi_id], [iccu_admission], [iccu_transfer_out], [thrombolysis_indication], [ptca_indication],
        [invasive_monitoring], [iabp_indication], [invasive_ventilation], [dialysis_indication],
        [other_procedure_name], [other_procedure_appropriateness], [cardiac_enzymes], [bnp], [crp],
        [lipid_profile], [bedside_echo], [chest_xray], [beta_blockers], [aspirin], [clopidogrel],
        [ace_inhibitor], [arb], [statin], [diuretic], [lanoxin], [anticoagulant], [amiodarone],
        [other_drug_name], [other_drug_appropriateness], [created_at], [updated_at]
      ) VALUES (
        @stemi_id, @iccu_admission, @iccu_transfer_out, @thrombolysis_indication, @ptca_indication,
        @invasive_monitoring, @iabp_indication, @invasive_ventilation, @dialysis_indication,
        @other_procedure_name, @other_procedure_appropriateness, @cardiac_enzymes, @bnp, @crp,
        @lipid_profile, @bedside_echo, @chest_xray, @beta_blockers, @aspirin, @clopidogrel,
        @ace_inhibitor, @arb, @statin, @diuretic, @lanoxin, @anticoagulant, @amiodarone,
        @other_drug_name, @other_drug_appropriateness, GETDATE(), GETDATE()
      );
    `);

    // ==========================================
    // TABLE 9: stemi_followup (Only Selected Intervals)
    // ==========================================
    const rawFollowupRows = Array.isArray(payload.followup)
      ? payload.followup
      : typeof payload.followup === 'object' && payload.followup !== null
      ? Object.values(payload.followup)
      : [];

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

    const regPid = parseInt(getVal('reg_patient_id', 1), 10);
    const baseFollowupDate = discharge_date || admission_date;

    for (const row of rawFollowupRows) {
      if (!row || !row.followup_month) continue;
      const followupMonth = row.followup_month;
      const monthsToAdd = monthMap[followupMonth] || 1;

      const reqFollowup = new sql.Request(transaction);
      reqFollowup.input('stemi_id', sql.Int, stemi_id);
      reqFollowup.input('reg_patient_id', sql.Int, regPid);
      reqFollowup.input('followup_month', sql.NVarChar(9), followupMonth);
      reqFollowup.input('angina', sql.VarChar(100), row.angina || 'No');
      reqFollowup.input('functional_class', sql.VarChar(50), row.functional_class || 'None');
      reqFollowup.input('number_of_antianginals', sql.Int, row.number_of_antianginals !== undefined && row.number_of_antianginals !== null && row.number_of_antianginals !== '' ? parseInt(row.number_of_antianginals, 10) : null);
      reqFollowup.input('dual_antiplatelets', sql.NVarChar(3), row.dual_antiplatelets || 'No');
      reqFollowup.input('statins', sql.NVarChar(3), row.statins || 'No');
      reqFollowup.input('beta_blocker', sql.NVarChar(3), row.beta_blocker || 'No');
      reqFollowup.input('acei_arb', sql.NVarChar(3), row.acei_arb || 'No');
      reqFollowup.input('aldosterone_antagonist', sql.NVarChar(3), row.aldosterone_antagonist || 'No');
      reqFollowup.input('acs_hospitalization', sql.NVarChar(3), row.acs_hospitalization || 'No');
      reqFollowup.input('ptca', sql.NVarChar(3), row.ptca || 'No');
      reqFollowup.input('cabg', sql.NVarChar(3), row.cabg || 'No');
      reqFollowup.input('death', sql.NVarChar(3), row.death || 'No');
      reqFollowup.input('other_event', sql.NVarChar(sql.MAX), row.other_event || '');
      reqFollowup.input('visit_mode', sql.VarChar(50), row.visit_mode || getVal('visit_mode', 'In-Person'));
      reqFollowup.input('special_instructions', sql.NVarChar(500), row.special_instructions !== undefined && row.special_instructions !== null && row.special_instructions !== '' ? row.special_instructions : (getVal('special_instructions') || 'Follow-up in cardiology OPD with repeat lipid profile and ECG.'));

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

      // Dynamic column checks for stemi_followup
      const hasVisitModeRes = await transaction.request().query(
        `SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.stemi_followup') AND name = 'visit_mode'`
      );
      const hasVisitMode = hasVisitModeRes.recordset.length > 0;

      const hasSpecialInstructionsRes = await transaction.request().query(
        `SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.stemi_followup') AND name = 'special_instructions'`
      );
      const hasSpecialInstructions = hasSpecialInstructionsRes.recordset.length > 0;

      await reqFollowup.query(`
        INSERT INTO [stemi_followup] (
          [stemi_id], [followup_month], [followup_date], [angina], [functional_class], [number_of_antianginals],
          [dual_antiplatelets], [statins], [beta_blocker], [acei_arb], [aldosterone_antagonist],
          [acs_hospitalization], [ptca], [cabg], [death], [other_event]
          ${hasVisitMode ? ', [visit_mode]' : ''}
          ${hasSpecialInstructions ? ', [special_instructions]' : ''},
          [created_at], [updated_at]
        ) VALUES (
          @stemi_id, @followup_month, @followup_date, @angina, @functional_class, @number_of_antianginals,
          @dual_antiplatelets, @statins, @beta_blocker, @acei_arb, @aldosterone_antagonist,
          @acs_hospitalization, @ptca, @cabg, @death, @other_event
          ${hasVisitMode ? ', @visit_mode' : ''}
          ${hasSpecialInstructions ? ', @special_instructions' : ''},
          GETDATE(), GETDATE()
        );

        -- 2. Synchronize into patient_followup_tasks for Nurse Follow-up Report
        IF EXISTS (
          SELECT 1 FROM [patient_followup_tasks]
          WHERE [reg_patient_id] = @reg_patient_id AND [timeframe] = @followup_month AND [source_registry] = 'STEMI Registry'
        )
        BEGIN
          UPDATE [patient_followup_tasks]
          SET
            [target_date] = @followup_date,
            [visit_mode] = @visit_mode,
            [special_instructions] = @special_instructions,
            [source_record_id] = @stemi_id,
            [updated_at] = GETDATE()
          WHERE [reg_patient_id] = @reg_patient_id AND [timeframe] = @followup_month AND [source_registry] = 'STEMI Registry';
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
            @nextTaskId, @reg_patient_id, 'STEMI Registry', @stemi_id, 'Yes',
            @followup_month, @followup_date, 'CARE Heart Institute', @visit_mode, @special_instructions,
            'Required', GETDATE(), GETDATE()
          );

          SET IDENTITY_INSERT [patient_followup_tasks] OFF;
        END
      `);
    }

    await transaction.commit();

    return res.status(201).json({
      success: true,
      message: 'STEMI Registry record successfully created across all 9 modular tables.',
      data: {
        stemi_id,
        reg_patient_id: getVal('reg_patient_id', 1),
        acs_no: finalAcsNo
      }
    });

  } catch (error) {
    console.error('❌ Error inserting STEMI Record:', error);
    if (transaction) {
      try {
        await transaction.rollback();
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

/**
 * GET /api/stemi/history/:regPatientId - Retrieve STEMI history list for a patient
 */
async function getStemiHistory(req, res) {
  try {
    const regPatientId = req.params.regPatientId;
    const pool = await getPool();

    const hasStatusColRes = await pool.request().query(
      `SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.stemi_registry') AND name = 'status'`
    );
    const hasStatusCol = hasStatusColRes.recordset.length > 0;

    const hasIsDeletedRes = await pool.request().query(
      `SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.stemi_registry') AND name = 'is_deleted'`
    );
    const hasIsDeleted = hasIsDeletedRes.recordset.length > 0;

    const result = await pool.request()
      .input('reg_patient_id', sql.Int, regPatientId)
      .query(`
        SELECT
          [stemi_id],
          [reg_patient_id],
          [acs_no],
          [ip_no],
          [admission_date],
          [discharge_date],
          [primary_consultant],
          ${hasStatusCol ? 'ISNULL([status], 0)' : '0'} AS [status],
          ${hasIsDeleted ? '[is_deleted]' : '0'} AS [is_deleted],
          [created_at],
          [updated_at]
        FROM [stemi_registry]
        WHERE [reg_patient_id] = @reg_patient_id
        ORDER BY [admission_date] DESC, [stemi_id] DESC;
      `);

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

    const historyData = result.recordset.map(row => {
      const isDel = row.is_deleted === true || row.is_deleted === 1 || row.status === 1;
      let statusStr = 'final';
      if (isDel) statusStr = 'deleted';
      else if (row.status === 2) statusStr = 'draft';

      return {
        stemi_id: row.stemi_id,
        reg_patient_id: row.reg_patient_id,
        acs_no: row.acs_no,
        ip_no: row.ip_no,
        admission_date: formatDate(row.admission_date),
        discharge_date: formatDate(row.discharge_date),
        primary_consultant: row.primary_consultant,
        status: statusStr,
        is_deleted: isDel,
        created_at: row.created_at,
        updated_at: row.updated_at
      };
    });

    return res.status(200).json({
      success: true,
      data: historyData
    });
  } catch (error) {
    console.error('Error fetching STEMI history:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Internal server error while fetching STEMI history.'
    });
  }
}

/**
 * GET /api/stemi/:id - Retrieve single full STEMI record for view / edit
 */
async function getStemiRecord(req, res) {
  try {
    const stemi_id = req.params.id;
    const pool = await getPool();

    const tables = [
      'stemi_registry',
      'stemi_administrative',
      'stemi_clinical_assessment',
      'stemi_diagnostics',
      'stemi_treatment_strategy',
      'stemi_hospitalization',
      'stemi_outcomes',
      'stemi_appropriateness'
    ];

    let merged = {};
    for (const table of tables) {
      const result = await pool.request()
        .input('stemi_id', sql.Int, stemi_id)
        .query(`SELECT * FROM [${table}] WHERE [stemi_id] = @stemi_id`);

      if (result.recordset.length > 0) {
        const row = result.recordset[0];
        if (table === 'stemi_outcomes') {
          // Prefix discharge medications to avoid clashing with treatment strategy
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
        } else if (table === 'stemi_appropriateness') {
          merged.appropriateness = row;
          merged.stemi_appropriateness = row;
          for (const k in row) {
            if (k !== 'stemi_id' && k !== 'appropriateness_id' && k !== 'created_at' && k !== 'updated_at') {
              merged[`appr_${k}`] = row[k];
            } else {
              merged[k] = row[k];
            }
          }
        } else if (table === 'stemi_registry') {
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
        message: 'STEMI record not found.'
      });
    }

    // Query follow-up matrix rows
    const resultFollowup = await pool.request()
      .input('stemi_id', sql.Int, stemi_id)
      .query(`SELECT * FROM [stemi_followup] WHERE [stemi_id] = @stemi_id ORDER BY [followup_id] ASC`);

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
    console.error('Error fetching STEMI record:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Internal server error while fetching STEMI record.'
    });
  }
}

/**
 * PUT /api/stemi/:id - Update existing STEMI record
 */
async function updateStemiRecord(req, res) {
  let transaction;
  try {
    const stemi_id = parseInt(req.params.id, 10);
    const payload = req.body || {};
    const getVal = (k, def = null) => val(payload, k, def);
    const getStr = (k, def = 'No') => strVal(payload, k, def);

    const admission_date = getVal('admission_date');
    const discharge_date = getVal('discharge_date');
    if (admission_date && discharge_date && new Date(discharge_date) < new Date(admission_date)) {
      return res.status(400).json({
        success: false,
        message: 'Discharge date cannot be earlier than Admission date.'
      });
    }

    const pool = await getPool();
    transaction = new sql.Transaction(pool);
    await transaction.begin(sql.ISOLATION_LEVEL.READ_COMMITTED);

    const hasStatusColRes = await transaction.request().query(
      `SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.stemi_registry') AND name = 'status'`
    );
    const hasStatusCol = hasStatusColRes.recordset.length > 0;

    let updateAcsNo = getVal('acs_no');
    if (updateAcsNo) {
      const dupCheck = await transaction.request()
        .input('candidate_acs', sql.VarChar(50), updateAcsNo)
        .input('current_stemi_id', sql.Int, stemi_id)
        .query(`SELECT 1 FROM [dbo].[stemi_registry] WHERE [acs_no] = @candidate_acs AND [stemi_id] <> @current_stemi_id`);
      if (dupCheck.recordset.length > 0) {
        updateAcsNo = `${updateAcsNo}-${Math.floor(100 + Math.random() * 900)}`;
      }
    }

    // 1. UPDATE stemi_registry
    const reqReg = new sql.Request(transaction);
    reqReg.input('stemi_id', sql.Int, stemi_id);
    reqReg.input('acs_no', sql.VarChar(50), updateAcsNo);
    reqReg.input('ip_no', sql.VarChar(30), getVal('ip_no'));
    reqReg.input('admission_date', sql.Date, admission_date ? new Date(admission_date) : null);
    reqReg.input('discharge_date', sql.Date, discharge_date ? new Date(discharge_date) : null);
    reqReg.input('primary_consultant', sql.VarChar(150), getVal('primary_consultant'));
    if (hasStatusCol) {
      reqReg.input('status', sql.Int, payload.status === 'draft' || payload.isDraft ? 2 : 0);
    }

    await reqReg.query(`
      UPDATE [stemi_registry]
      SET [acs_no] = @acs_no, [ip_no] = @ip_no, [admission_date] = @admission_date,
          [discharge_date] = @discharge_date, [primary_consultant] = @primary_consultant,
          ${hasStatusCol ? '[status] = @status,' : ''} [updated_at] = GETDATE()
      WHERE [stemi_id] = @stemi_id;
    `);

    // 2. UPDATE stemi_administrative
    const reqAdmin = new sql.Request(transaction);
    reqAdmin.input('stemi_id', sql.Int, stemi_id);
    reqAdmin.input('hypertension', sql.NVarChar(7), getStr('hypertension'));
    reqAdmin.input('diabetes', sql.NVarChar(7), getStr('diabetes'));
    reqAdmin.input('smoking', sql.NVarChar(7), getStr('smoking'));
    reqAdmin.input('renal_failure', sql.NVarChar(7), getStr('renal_failure'));
    reqAdmin.input('copd', sql.NVarChar(7), getStr('copd'));
    reqAdmin.input('cva', sql.NVarChar(7), getStr('cva'));
    reqAdmin.input('prior_acs', sql.NVarChar(7), getStr('prior_acs'));
    reqAdmin.input('prior_ptca', sql.NVarChar(7), getStr('prior_ptca'));
    reqAdmin.input('prior_cabg', sql.NVarChar(7), getStr('prior_cabg'));
    reqAdmin.input('other_background', sql.VarChar(255), getVal('other_background'));

    await reqAdmin.query(`
      UPDATE [stemi_administrative]
      SET [hypertension] = @hypertension, [diabetes] = @diabetes, [smoking] = @smoking,
          [renal_failure] = @renal_failure, [copd] = @copd, [cva] = @cva,
          [prior_acs] = @prior_acs, [prior_ptca] = @prior_ptca, [prior_cabg] = @prior_cabg,
          [other_background] = @other_background, [updated_at] = GETDATE()
      WHERE [stemi_id] = @stemi_id;
    `);

    // 3. UPDATE stemi_clinical_assessment
    const reqClinical = new sql.Request(transaction);
    reqClinical.input('stemi_id', sql.Int, stemi_id);
    reqClinical.input('typical_angina', sql.NVarChar(3), getStr('typical_angina'));
    reqClinical.input('atypical_chest_pain', sql.NVarChar(3), getStr('atypical_chest_pain'));
    reqClinical.input('breathlessness', sql.NVarChar(3), getStr('breathlessness'));
    reqClinical.input('syncope_presyncope', sql.NVarChar(3), getStr('syncope_presyncope'));
    reqClinical.input('pulse_rate', sql.Int, getVal('pulse_rate') ? parseInt(getVal('pulse_rate'), 10) : null);
    reqClinical.input('systolic_bp', sql.Int, getVal('systolic_bp') ? parseInt(getVal('systolic_bp'), 10) : null);
    reqClinical.input('diastolic_bp', sql.Int, getVal('diastolic_bp') ? parseInt(getVal('diastolic_bp'), 10) : null);
    reqClinical.input('age_gt_75', sql.NVarChar(3), getStr('age_gt_75'));
    reqClinical.input('age_65_to_74', sql.NVarChar(3), getStr('age_65_to_74'));
    reqClinical.input('history_dm_htn_angina', sql.NVarChar(3), getStr('history_dm_htn_angina'));
    reqClinical.input('sbp_lt_100', sql.NVarChar(3), getStr('sbp_lt_100'));
    reqClinical.input('heart_rate_gt_100', sql.NVarChar(3), getStr('heart_rate_gt_100'));
    reqClinical.input('killip_class_ii_to_iv', sql.NVarChar(3), getStr('killip_class_ii_to_iv'));
    reqClinical.input('anterior_mi_or_lbbb', sql.NVarChar(3), getStr('anterior_mi_or_lbbb'));
    reqClinical.input('weight_lt_67kg', sql.NVarChar(3), getStr('weight_lt_67kg'));
    reqClinical.input('reperfusion_gt_4hrs', sql.NVarChar(3), getStr('reperfusion_gt_4hrs'));
    reqClinical.input('lvf', sql.NVarChar(3), getStr('lvf'));
    reqClinical.input('vt_vf', sql.NVarChar(3), getStr('vt_vf'));
    reqClinical.input('bbb_chb', sql.NVarChar(3), getStr('bbb_chb'));
    reqClinical.input('elevated_bnp', sql.NVarChar(3), getStr('elevated_bnp'));
    reqClinical.input('elevated_crp', sql.NVarChar(3), getStr('elevated_crp'));
    reqClinical.input('timi_total_score', sql.Int, getVal('timi_total_score') !== null ? parseInt(getVal('timi_total_score'), 10) : 0);

    await reqClinical.query(`
      UPDATE [stemi_clinical_assessment]
      SET [typical_angina] = @typical_angina, [atypical_chest_pain] = @atypical_chest_pain,
          [breathlessness] = @breathlessness, [syncope_presyncope] = @syncope_presyncope,
          [pulse_rate] = @pulse_rate, [systolic_bp] = @systolic_bp, [diastolic_bp] = @diastolic_bp,
          [age_gt_75] = @age_gt_75, [age_65_to_74] = @age_65_to_74, [history_dm_htn_angina] = @history_dm_htn_angina,
          [sbp_lt_100] = @sbp_lt_100, [heart_rate_gt_100] = @heart_rate_gt_100,
          [killip_class_ii_to_iv] = @killip_class_ii_to_iv, [anterior_mi_or_lbbb] = @anterior_mi_or_lbbb,
          [weight_lt_67kg] = @weight_lt_67kg, [reperfusion_gt_4hrs] = @reperfusion_gt_4hrs,
          [lvf] = @lvf, [vt_vf] = @vt_vf, [bbb_chb] = @bbb_chb, [elevated_bnp] = @elevated_bnp,
          [elevated_crp] = @elevated_crp, [timi_total_score] = @timi_total_score, [updated_at] = GETDATE()
      WHERE [stemi_id] = @stemi_id;
    `);

    // 4. UPDATE stemi_treatment_strategy
    const reqTx = new sql.Request(transaction);
    reqTx.input('stemi_id', sql.Int, stemi_id);
    reqTx.input('pami', sql.NVarChar(3), getStr('pami'));
    reqTx.input('thrombolysis', sql.NVarChar(3), getStr('thrombolysis'));
    reqTx.input('conservative', sql.NVarChar(3), getStr('conservative'));
    reqTx.input('door_to_balloon_time', sql.Int, getVal('door_to_balloon_time') ? parseInt(getVal('door_to_balloon_time'), 10) : null);
    reqTx.input('vessel_lmca', sql.NVarChar(3), getStr('vessel_lmca'));
    reqTx.input('vessel_lad', sql.NVarChar(3), getStr('vessel_lad'));
    reqTx.input('vessel_diagonal', sql.NVarChar(3), getStr('vessel_diagonal'));
    reqTx.input('vessel_lcx', sql.NVarChar(3), getStr('vessel_lcx'));
    reqTx.input('vessel_ramus', sql.NVarChar(3), getStr('vessel_ramus'));
    reqTx.input('vessel_om', sql.NVarChar(3), getStr('vessel_om'));
    reqTx.input('vessel_rca', sql.NVarChar(3), getStr('vessel_rca'));
    reqTx.input('vessel_pda', sql.NVarChar(3), getStr('vessel_pda'));
    reqTx.input('vessel_segment', sql.VarChar(100), getVal('vessel_segment'));
    reqTx.input('thrombosuction_done', sql.NVarChar(3), getStr('thrombosuction_done'));
    reqTx.input('thrombosuction_not_done', sql.NVarChar(3), getStr('thrombosuction_not_done'));
    reqTx.input('stent_bms', sql.NVarChar(3), getStr('stent_bms'));
    reqTx.input('stent_des', sql.NVarChar(3), getStr('stent_des'));
    reqTx.input('stent_diameter', sql.Decimal(5, 2), getVal('stent_diameter') ? parseFloat(getVal('stent_diameter')) : null);
    reqTx.input('stent_length', sql.Decimal(5, 2), getVal('stent_length') ? parseFloat(getVal('stent_length')) : null);
    reqTx.input('procedural_success', sql.NVarChar(3), getStr('procedural_success', 'Yes'));
    reqTx.input('timi_flow', sql.TinyInt, getVal('timi_flow') !== null ? parseInt(getVal('timi_flow'), 10) : 3);
    reqTx.input('complication_none', sql.NVarChar(3), getStr('complication_none', 'Yes'));
    reqTx.input('complication_tamponade', sql.NVarChar(3), getStr('complication_tamponade'));
    reqTx.input('complication_major_bleed', sql.NVarChar(3), getStr('complication_major_bleed'));
    reqTx.input('complication_stroke', sql.NVarChar(3), getStr('complication_stroke'));
    reqTx.input('complication_stent_thrombosis', sql.NVarChar(3), getStr('complication_stent_thrombosis'));
    reqTx.input('complication_mi', sql.NVarChar(3), getStr('complication_mi'));
    reqTx.input('complication_death', sql.NVarChar(3), getStr('complication_death'));
    reqTx.input('complication_emergency_cabg', sql.NVarChar(3), getStr('complication_emergency_cabg'));
    reqTx.input('door_to_needle_time', sql.Int, getVal('door_to_needle_time') ? parseInt(getVal('door_to_needle_time'), 10) : null);
    reqTx.input('drug_stk', sql.NVarChar(3), getStr('drug_stk'));
    reqTx.input('drug_uk', sql.NVarChar(3), getStr('drug_uk'));
    reqTx.input('drug_reteplase', sql.NVarChar(3), getStr('drug_reteplase'));
    reqTx.input('drug_tenecteplase', sql.NVarChar(3), getStr('drug_tenecteplase'));
    reqTx.input('thrombolysis_dose', sql.VarChar(100), getVal('thrombolysis_dose'));
    reqTx.input('beta_blocker', sql.NVarChar(3), getStr('beta_blocker'));
    reqTx.input('calcium_channel_blocker', sql.NVarChar(3), getStr('calcium_channel_blocker'));
    reqTx.input('nitrate', sql.NVarChar(3), getStr('nitrate'));
    reqTx.input('nicorandil', sql.NVarChar(3), getStr('nicorandil'));
    reqTx.input('ivabradine', sql.NVarChar(3), getStr('ivabradine'));
    reqTx.input('ranolazine', sql.NVarChar(3), getStr('ranolazine'));
    reqTx.input('trimetazidine', sql.NVarChar(3), getStr('trimetazidine'));
    reqTx.input('aspirin', sql.NVarChar(3), getStr('aspirin', 'Yes'));
    reqTx.input('clopidogrel', sql.NVarChar(3), getStr('clopidogrel'));
    reqTx.input('prasugrel', sql.NVarChar(3), getStr('prasugrel'));
    reqTx.input('ticagrelor', sql.NVarChar(3), getStr('ticagrelor', 'Yes'));
    reqTx.input('heparin_ufh_iv', sql.NVarChar(3), getStr('heparin_ufh_iv'));
    reqTx.input('heparin_ufh_sc', sql.NVarChar(3), getStr('heparin_ufh_sc'));
    reqTx.input('heparin_lmwh', sql.NVarChar(3), getStr('heparin_lmwh'));
    reqTx.input('heparin_ufh_iv_sc', sql.NVarChar(3), getStr('heparin_ufh_iv_sc'));
    reqTx.input('heparin_ufh_iv_lmwh', sql.NVarChar(3), getStr('heparin_ufh_iv_lmwh'));
    reqTx.input('gp2b3a', sql.NVarChar(3), getStr('gp2b3a'));
    reqTx.input('bivaluridin', sql.NVarChar(3), getStr('bivaluridin'));
    reqTx.input('statin', sql.NVarChar(3), getStr('statin', 'Yes'));
    reqTx.input('statin_10mg', sql.NVarChar(3), getStr('statin_10mg'));
    reqTx.input('statin_20mg', sql.NVarChar(3), getStr('statin_20mg'));
    reqTx.input('statin_40mg', sql.NVarChar(3), getStr('statin_40mg'));
    reqTx.input('statin_80mg', sql.NVarChar(3), getStr('statin_80mg'));
    reqTx.input('other_drugs', sql.VarChar(255), getVal('other_drugs'));
    reqTx.input('cag', sql.NVarChar(3), getStr('cag'));
    reqTx.input('iabp', sql.NVarChar(3), getStr('iabp'));
    reqTx.input('invasive_ventilation', sql.NVarChar(3), getStr('invasive_ventilation'));
    reqTx.input('ptca', sql.NVarChar(3), getStr('ptca'));
    reqTx.input('cabg', sql.NVarChar(3), getStr('cabg'));
    reqTx.input('other_procedure', sql.VarChar(255), getVal('other_procedure'));

    await reqTx.query(`
      UPDATE [stemi_treatment_strategy]
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
          [drug_reteplase] = @drug_reteplase, [drug_tenecteplase] = @drug_tenecteplase,
          [thrombolysis_dose] = @thrombolysis_dose, [beta_blocker] = @beta_blocker,
          [calcium_channel_blocker] = @calcium_channel_blocker, [nitrate] = @nitrate, [nicorandil] = @nicorandil,
          [ivabradine] = @ivabradine, [ranolazine] = @ranolazine, [trimetazidine] = @trimetazidine,
          [aspirin] = @aspirin, [clopidogrel] = @clopidogrel, [prasugrel] = @prasugrel, [ticagrelor] = @ticagrelor,
          [heparin_ufh_iv] = @heparin_ufh_iv, [heparin_ufh_sc] = @heparin_ufh_sc, [heparin_lmwh] = @heparin_lmwh,
          [heparin_ufh_iv_sc] = @heparin_ufh_iv_sc, [heparin_ufh_iv_lmwh] = @heparin_ufh_iv_lmwh,
          [gp2b3a] = @gp2b3a, [bivaluridin] = @bivaluridin, [statin] = @statin, [statin_10mg] = @statin_10mg,
          [statin_20mg] = @statin_20mg, [statin_40mg] = @statin_40mg, [statin_80mg] = @statin_80mg,
          [other_drugs] = @other_drugs, [cag] = @cag, [iabp] = @iabp, [invasive_ventilation] = @invasive_ventilation,
          [ptca] = @ptca, [cabg] = @cabg, [other_procedure] = @other_procedure, [updated_at] = GETDATE()
      WHERE [stemi_id] = @stemi_id;
    `);

    // 5. UPDATE stemi_diagnostics
    const reqDiag = new sql.Request(transaction);
    reqDiag.input('stemi_id', sql.Int, stemi_id);
    reqDiag.input('bedside_echo', sql.NVarChar(3), getStr('bedside_echo'));
    reqDiag.input('departmental_echo', sql.NVarChar(3), getStr('departmental_echo'));
    reqDiag.input('stress_testing', sql.NVarChar(3), getStr('stress_testing'));
    reqDiag.input('lipid_profile', sql.NVarChar(3), getStr('lipid_profile'));
    reqDiag.input('bnp', sql.NVarChar(3), getStr('bnp'));
    reqDiag.input('crp', sql.NVarChar(3), getStr('crp'));
    reqDiag.input('troponin_test', sql.NVarChar(3), getStr('troponin_test'));
    reqDiag.input('cpk_ckmb', sql.NVarChar(3), getStr('cpk_ckmb'));
    reqDiag.input('rft', sql.NVarChar(3), getStr('rft'));
    reqDiag.input('lft', sql.NVarChar(3), getStr('lft'));
    reqDiag.input('electrolytes', sql.NVarChar(3), getStr('electrolytes'));
    reqDiag.input('hemogram', sql.NVarChar(3), getStr('hemogram'));
    reqDiag.input('cxr', sql.NVarChar(3), getStr('cxr'));
    reqDiag.input('diagnostic_other', sql.VarChar(255), getVal('diagnostic_other'));
    reqDiag.input('ecg_heart_rate', sql.Int, getVal('ecg_heart_rate') ? parseInt(getVal('ecg_heart_rate'), 10) : null);
    reqDiag.input('av_block_none', sql.NVarChar(3), getStr('av_block_none', 'Yes'));
    reqDiag.input('av_block_first_degree', sql.NVarChar(3), getStr('av_block_first_degree'));
    reqDiag.input('av_block_second_degree', sql.NVarChar(3), getStr('av_block_second_degree'));
    reqDiag.input('av_block_chb', sql.NVarChar(3), getStr('av_block_chb'));
    reqDiag.input('bbb_none', sql.NVarChar(3), getStr('bbb_none', 'Yes'));
    reqDiag.input('bbb_rbbb', sql.NVarChar(3), getStr('bbb_rbbb'));
    reqDiag.input('bbb_lbbb', sql.NVarChar(3), getStr('bbb_lbbb'));
    reqDiag.input('bbb_indeterminate', sql.NVarChar(3), getStr('bbb_indeterminate'));
    reqDiag.input('qwaves_none', sql.NVarChar(3), getStr('qwaves_none', 'Yes'));
    reqDiag.input('qwaves_inferior', sql.NVarChar(3), getStr('qwaves_inferior'));
    reqDiag.input('qwaves_anteroseptal', sql.NVarChar(3), getStr('qwaves_anteroseptal'));
    reqDiag.input('qwaves_anterior', sql.NVarChar(3), getStr('qwaves_anterior'));
    reqDiag.input('qwaves_anterolateral', sql.NVarChar(3), getStr('qwaves_anterolateral'));
    reqDiag.input('qwaves_lateral', sql.NVarChar(3), getStr('qwaves_lateral'));
    reqDiag.input('st_depression_none', sql.NVarChar(3), getStr('st_depression_none', 'Yes'));
    reqDiag.input('st_depression_inferior', sql.NVarChar(3), getStr('st_depression_inferior'));
    reqDiag.input('st_depression_anteroseptal', sql.NVarChar(3), getStr('st_depression_anteroseptal'));
    reqDiag.input('st_depression_anterior', sql.NVarChar(3), getStr('st_depression_anterior'));
    reqDiag.input('st_depression_anterolateral', sql.NVarChar(3), getStr('st_depression_anterolateral'));
    reqDiag.input('st_depression_lateral', sql.NVarChar(3), getStr('st_depression_lateral'));
    reqDiag.input('t_inversion_none', sql.NVarChar(3), getStr('t_inversion_none', 'Yes'));
    reqDiag.input('t_inversion_inferior', sql.NVarChar(3), getStr('t_inversion_inferior'));
    reqDiag.input('t_inversion_anteroseptal', sql.NVarChar(3), getStr('t_inversion_anteroseptal'));
    reqDiag.input('t_inversion_anterior', sql.NVarChar(3), getStr('t_inversion_anterior'));
    reqDiag.input('t_inversion_anterolateral', sql.NVarChar(3), getStr('t_inversion_anterolateral'));
    reqDiag.input('t_inversion_lateral', sql.NVarChar(3), getStr('t_inversion_lateral'));
    reqDiag.input('rhythm_nsr', sql.NVarChar(3), getStr('rhythm_nsr', 'Yes'));
    reqDiag.input('rhythm_af', sql.NVarChar(3), getStr('rhythm_af'));
    reqDiag.input('rhythm_svt', sql.NVarChar(3), getStr('rhythm_svt'));
    reqDiag.input('rhythm_vt', sql.NVarChar(3), getStr('rhythm_vt'));
    reqDiag.input('rhythm_vf', sql.NVarChar(3), getStr('rhythm_vf'));
    reqDiag.input('ecg_other', sql.NVarChar(sql.MAX), getVal('ecg_other'));
    reqDiag.input('echo_ef', sql.Decimal(5, 2), getVal('echo_ef') ? parseFloat(getVal('echo_ef')) : null);
    reqDiag.input('lv_function_normal', sql.NVarChar(3), getStr('lv_function_normal', 'Yes'));
    reqDiag.input('lv_function_mild_lvd', sql.NVarChar(3), getStr('lv_function_mild_lvd'));
    reqDiag.input('lv_function_moderate_lvd', sql.NVarChar(3), getStr('lv_function_moderate_lvd'));
    reqDiag.input('lv_function_severe_lvd', sql.NVarChar(3), getStr('lv_function_severe_lvd'));
    reqDiag.input('rwma_lad', sql.NVarChar(3), getStr('rwma_lad'));
    reqDiag.input('rwma_rca', sql.NVarChar(3), getStr('rwma_rca'));
    reqDiag.input('rwma_lcx', sql.NVarChar(3), getStr('rwma_lcx'));
    reqDiag.input('mr_none', sql.NVarChar(3), getStr('mr_none', 'Yes'));
    reqDiag.input('mr_mild', sql.NVarChar(3), getStr('mr_mild'));
    reqDiag.input('mr_moderate', sql.NVarChar(3), getStr('mr_moderate'));
    reqDiag.input('mr_severe', sql.NVarChar(3), getStr('mr_severe'));
    reqDiag.input('echo_e', sql.Decimal(6, 2), getVal('echo_e') ? parseFloat(getVal('echo_e')) : null);
    reqDiag.input('echo_a', sql.Decimal(6, 2), getVal('echo_a') ? parseFloat(getVal('echo_a')) : null);
    reqDiag.input('echo_dt', sql.Decimal(6, 2), getVal('echo_dt') ? parseFloat(getVal('echo_dt')) : null);
    reqDiag.input('echo_e_prime', sql.Decimal(6, 2), getVal('echo_e_prime') ? parseFloat(getVal('echo_e_prime')) : null);
    reqDiag.input('echo_tapsv', sql.Decimal(6, 2), getVal('echo_tapsv') ? parseFloat(getVal('echo_tapsv')) : null);
    reqDiag.input('echo_other', sql.NVarChar(sql.MAX), getVal('echo_other'));
    reqDiag.input('hemoglobin', sql.Decimal(5, 2), getVal('hemoglobin') ? parseFloat(getVal('hemoglobin')) : null);
    reqDiag.input('creatinine', sql.Decimal(6, 2), getVal('creatinine') ? parseFloat(getVal('creatinine')) : null);
    reqDiag.input('troponin_i', sql.VarChar(50), getVal('troponin_i'));
    reqDiag.input('cpk', sql.VarChar(50), getVal('cpk'));
    reqDiag.input('ck_mb', sql.VarChar(50), getVal('ck_mb'));
    reqDiag.input('sodium', sql.Decimal(5, 2), getVal('sodium') ? parseFloat(getVal('sodium')) : null);
    reqDiag.input('potassium', sql.Decimal(5, 2), getVal('potassium') ? parseFloat(getVal('potassium')) : null);
    reqDiag.input('rbs_admission', sql.Decimal(6, 2), getVal('rbs_admission') ? parseFloat(getVal('rbs_admission')) : null);
    reqDiag.input('angiogram_done', sql.NVarChar(3), getStr('angiogram_done'));
    reqDiag.input('angiogram_normal', sql.NVarChar(3), getStr('angiogram_normal'));
    reqDiag.input('angiogram_1vd', sql.NVarChar(3), getStr('angiogram_1vd'));
    reqDiag.input('angiogram_2vd', sql.NVarChar(3), getStr('angiogram_2vd'));
    reqDiag.input('angiogram_3vd', sql.NVarChar(3), getStr('angiogram_3vd'));
    reqDiag.input('angiogram_lmca', sql.NVarChar(3), getStr('angiogram_lmca'));

    await reqDiag.query(`
      UPDATE [stemi_diagnostics]
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
          [angiogram_1vd] = @angiogram_1vd, [angiogram_2vd] = @angiogram_2vd,
          [angiogram_3vd] = @angiogram_3vd, [angiogram_lmca] = @angiogram_lmca, [updated_at] = GETDATE()
      WHERE [stemi_id] = @stemi_id;
    `);

    // 6. UPDATE stemi_outcomes
    const reqOutcomes = new sql.Request(transaction);
    reqOutcomes.input('stemi_id', sql.Int, stemi_id);
    reqOutcomes.input('death', sql.NVarChar(3), getStr('death'));
    reqOutcomes.input('stemi_for_nonstemi', sql.NVarChar(3), getStr('stemi_for_nonstemi'));
    reqOutcomes.input('remi_for_stemi', sql.NVarChar(3), getStr('remi_for_stemi'));
    reqOutcomes.input('revascularization_recurrent_ischemia', sql.NVarChar(3), getStr('revascularization_recurrent_ischemia'));
    reqOutcomes.input('cva_thrombotic', sql.NVarChar(3), getStr('cva_thrombotic'));
    reqOutcomes.input('cva_hemorrhagic', sql.NVarChar(3), getStr('cva_hemorrhagic'));
    reqOutcomes.input('major_bleeding', sql.NVarChar(3), getStr('major_bleeding'));
    reqOutcomes.input('outcome_other', sql.VarChar(255), getVal('outcome_other'));
    reqOutcomes.input('beta_blocker', sql.NVarChar(3), getStr('discharge_beta_blocker'));
    reqOutcomes.input('calcium_channel_blocker', sql.NVarChar(3), getStr('discharge_calcium_channel_blocker'));
    reqOutcomes.input('nitrate', sql.NVarChar(3), getStr('discharge_nitrate'));
    reqOutcomes.input('nicorandil', sql.NVarChar(3), getStr('discharge_nicorandil'));
    reqOutcomes.input('ivabradine', sql.NVarChar(3), getStr('discharge_ivabradine'));
    reqOutcomes.input('ranolazine', sql.NVarChar(3), getStr('discharge_ranolazine'));
    reqOutcomes.input('trimetazidine', sql.NVarChar(3), getStr('discharge_trimetazidine'));
    reqOutcomes.input('aspirin', sql.NVarChar(3), getStr('discharge_aspirin', 'Yes'));
    reqOutcomes.input('clopidogrel', sql.NVarChar(3), getStr('discharge_clopidogrel'));
    reqOutcomes.input('prasugrel', sql.NVarChar(3), getStr('discharge_prasugrel'));
    reqOutcomes.input('ticagrelor', sql.NVarChar(3), getStr('discharge_ticagrelor', 'Yes'));
    reqOutcomes.input('statin', sql.NVarChar(3), getStr('discharge_statin', 'Yes'));
    reqOutcomes.input('statin_10mg', sql.NVarChar(3), getStr('discharge_statin_10mg'));
    reqOutcomes.input('statin_20mg', sql.NVarChar(3), getStr('discharge_statin_20mg'));
    reqOutcomes.input('statin_40mg', sql.NVarChar(3), getStr('discharge_statin_40mg'));
    reqOutcomes.input('statin_80mg', sql.NVarChar(3), getStr('discharge_statin_80mg'));
    reqOutcomes.input('discharge_other_medication', sql.VarChar(255), getVal('discharge_other_medication'));

    await reqOutcomes.query(`
      UPDATE [stemi_outcomes]
      SET [death] = @death, [stemi_for_nonstemi] = @stemi_for_nonstemi, [remi_for_stemi] = @remi_for_stemi,
          [revascularization_recurrent_ischemia] = @revascularization_recurrent_ischemia,
          [cva_thrombotic] = @cva_thrombotic, [cva_hemorrhagic] = @cva_hemorrhagic, [major_bleeding] = @major_bleeding,
          [outcome_other] = @outcome_other, [beta_blocker] = @beta_blocker,
          [calcium_channel_blocker] = @calcium_channel_blocker, [nitrate] = @nitrate, [nicorandil] = @nicorandil,
          [ivabradine] = @ivabradine, [ranolazine] = @ranolazine, [trimetazidine] = @trimetazidine,
          [aspirin] = @aspirin, [clopidogrel] = @clopidogrel, [prasugrel] = @prasugrel, [ticagrelor] = @ticagrelor,
          [statin] = @statin, [statin_10mg] = @statin_10mg, [statin_20mg] = @statin_20mg,
          [statin_40mg] = @statin_40mg, [statin_80mg] = @statin_80mg,
          [discharge_other_medication] = @discharge_other_medication, [updated_at] = GETDATE()
      WHERE [stemi_id] = @stemi_id;
    `);

    // 7. UPDATE stemi_hospitalization
    const reqHosp = new sql.Request(transaction);
    reqHosp.input('stemi_id', sql.Int, stemi_id);
    reqHosp.input('iccu_hours', sql.Decimal(6, 2), getVal('iccu_hours') ? parseFloat(getVal('iccu_hours')) : null);
    reqHosp.input('stepdown_icu_hours', sql.Decimal(6, 2), getVal('stepdown_icu_hours') ? parseFloat(getVal('stepdown_icu_hours')) : null);
    reqHosp.input('floor_days', sql.Decimal(6, 2), getVal('floor_days') ? parseFloat(getVal('floor_days')) : null);
    reqHosp.input('total_hospital_stay_days', sql.Decimal(6, 2), getVal('total_hospital_stay_days') ? parseFloat(getVal('total_hospital_stay_days')) : null);
    reqHosp.input('bed_charges', sql.Decimal(12, 2), getVal('bed_charges') ? parseFloat(getVal('bed_charges')) : null);
    reqHosp.input('drugs_disposables_cost', sql.Decimal(12, 2), getVal('drugs_disposables_cost') ? parseFloat(getVal('drugs_disposables_cost')) : null);
    reqHosp.input('package_cost', sql.Decimal(12, 2), getVal('package_cost') ? parseFloat(getVal('package_cost')) : null);
    reqHosp.input('laboratory_cost', sql.Decimal(12, 2), getVal('laboratory_cost') ? parseFloat(getVal('laboratory_cost')) : null);
    reqHosp.input('non_invasive_lab_cost', sql.Decimal(12, 2), getVal('non_invasive_lab_cost') ? parseFloat(getVal('non_invasive_lab_cost')) : null);
    reqHosp.input('consultation_cost', sql.Decimal(12, 2), getVal('consultation_cost') ? parseFloat(getVal('consultation_cost')) : null);
    reqHosp.input('radiology_cost', sql.Decimal(12, 2), getVal('radiology_cost') ? parseFloat(getVal('radiology_cost')) : null);
    reqHosp.input('miscellaneous_cost', sql.Decimal(12, 2), getVal('miscellaneous_cost') ? parseFloat(getVal('miscellaneous_cost')) : null);
    reqHosp.input('total_cost', sql.Decimal(12, 2), getVal('total_cost') ? parseFloat(getVal('total_cost')) : null);

    await reqHosp.query(`
      UPDATE [stemi_hospitalization]
      SET [iccu_hours] = @iccu_hours, [stepdown_icu_hours] = @stepdown_icu_hours, [floor_days] = @floor_days,
          [total_hospital_stay_days] = @total_hospital_stay_days, [bed_charges] = @bed_charges,
          [drugs_disposables_cost] = @drugs_disposables_cost, [package_cost] = @package_cost,
          [laboratory_cost] = @laboratory_cost, [non_invasive_lab_cost] = @non_invasive_lab_cost,
          [consultation_cost] = @consultation_cost, [radiology_cost] = @radiology_cost,
          [miscellaneous_cost] = @miscellaneous_cost, [total_cost] = @total_cost, [updated_at] = GETDATE()
      WHERE [stemi_id] = @stemi_id;
    `);

    // 8. UPDATE stemi_appropriateness
    const reqAppr = new sql.Request(transaction);
    reqAppr.input('stemi_id', sql.Int, stemi_id);
    reqAppr.input('iccu_admission', sql.NVarChar(14), getVal('appr_iccu_admission'));
    reqAppr.input('iccu_transfer_out', sql.NVarChar(14), getVal('appr_iccu_transfer_out'));
    reqAppr.input('thrombolysis_indication', sql.NVarChar(14), getVal('appr_thrombolysis_indication'));
    reqAppr.input('ptca_indication', sql.NVarChar(14), getVal('appr_ptca_indication'));
    reqAppr.input('invasive_monitoring', sql.NVarChar(14), getVal('appr_invasive_monitoring'));
    reqAppr.input('iabp_indication', sql.NVarChar(14), getVal('appr_iabp_indication'));
    reqAppr.input('invasive_ventilation', sql.NVarChar(14), getVal('appr_invasive_ventilation'));
    reqAppr.input('dialysis_indication', sql.NVarChar(14), getVal('appr_dialysis_indication'));
    reqAppr.input('other_procedure_name', sql.VarChar(100), getVal('appr_other_procedure_name'));
    reqAppr.input('other_procedure_appropriateness', sql.NVarChar(14), getVal('appr_other_procedure_appropriateness'));
    reqAppr.input('cardiac_enzymes', sql.NVarChar(14), getVal('appr_cardiac_enzymes'));
    reqAppr.input('bnp', sql.NVarChar(14), getVal('appr_bnp'));
    reqAppr.input('crp', sql.NVarChar(14), getVal('appr_crp'));
    reqAppr.input('lipid_profile', sql.NVarChar(14), getVal('appr_lipid_profile'));
    reqAppr.input('bedside_echo', sql.NVarChar(14), getVal('appr_bedside_echo'));
    reqAppr.input('chest_xray', sql.NVarChar(14), getVal('appr_chest_xray'));
    reqAppr.input('beta_blockers', sql.NVarChar(14), getVal('appr_beta_blockers'));
    reqAppr.input('aspirin', sql.NVarChar(14), getVal('appr_aspirin'));
    reqAppr.input('clopidogrel', sql.NVarChar(14), getVal('appr_clopidogrel'));
    reqAppr.input('ace_inhibitor', sql.NVarChar(14), getVal('appr_ace_inhibitor'));
    reqAppr.input('arb', sql.NVarChar(14), getVal('appr_arb'));
    reqAppr.input('statin', sql.NVarChar(14), getVal('appr_statin'));
    reqAppr.input('diuretic', sql.NVarChar(14), getVal('appr_diuretic'));
    reqAppr.input('lanoxin', sql.NVarChar(14), getVal('appr_lanoxin'));
    reqAppr.input('anticoagulant', sql.NVarChar(14), getVal('appr_anticoagulant'));
    reqAppr.input('amiodarone', sql.NVarChar(14), getVal('appr_amiodarone'));
    reqAppr.input('other_drug_name', sql.VarChar(100), getVal('appr_other_drug_name'));
    reqAppr.input('other_drug_appropriateness', sql.NVarChar(14), getVal('appr_other_drug_appropriateness'));

    await reqAppr.query(`
      UPDATE [stemi_appropriateness]
      SET [iccu_admission] = @iccu_admission,
          [iccu_transfer_out] = @iccu_transfer_out,
          [thrombolysis_indication] = @thrombolysis_indication,
          [ptca_indication] = @ptca_indication,
          [invasive_monitoring] = @invasive_monitoring,
          [iabp_indication] = @iabp_indication,
          [invasive_ventilation] = @invasive_ventilation,
          [dialysis_indication] = @dialysis_indication,
          [other_procedure_name] = @other_procedure_name,
          [other_procedure_appropriateness] = @other_procedure_appropriateness,
          [cardiac_enzymes] = @cardiac_enzymes,
          [bnp] = @bnp,
          [crp] = @crp,
          [lipid_profile] = @lipid_profile,
          [bedside_echo] = @bedside_echo,
          [chest_xray] = @chest_xray,
          [beta_blockers] = @beta_blockers,
          [aspirin] = @aspirin,
          [clopidogrel] = @clopidogrel,
          [ace_inhibitor] = @ace_inhibitor,
          [arb] = @arb,
          [statin] = @statin,
          [diuretic] = @diuretic,
          [lanoxin] = @lanoxin,
          [anticoagulant] = @anticoagulant,
          [amiodarone] = @amiodarone,
          [other_drug_name] = @other_drug_name,
          [other_drug_appropriateness] = @other_drug_appropriateness,
          [updated_at] = GETDATE()
      WHERE [stemi_id] = @stemi_id;
    `);

    // 9. UPDATE stemi_followup (Synchronize only selected intervals)
    const rawFollowupRows = Array.isArray(payload.followup)
      ? payload.followup
      : typeof payload.followup === 'object' && payload.followup !== null
      ? Object.values(payload.followup)
      : [];

    const regPid = parseInt(getVal('reg_patient_id', 1), 10);
    const baseFollowupDate = discharge_date || admission_date;
    const selectedMonths = rawFollowupRows.map(r => r.followup_month).filter(Boolean);

    // Delete unselected follow-up intervals from stemi_followup and patient_followup_tasks
    const standardMonthNames = ['1-Month', '3-Month', '6-Month', '12-Month'];
    const unselectedMonths = standardMonthNames.filter(m => !selectedMonths.includes(m));
    for (const unsel of unselectedMonths) {
      const reqDel = new sql.Request(transaction);
      reqDel.input('stemi_id', sql.Int, stemi_id);
      reqDel.input('reg_patient_id', sql.Int, regPid);
      reqDel.input('unsel_month', sql.NVarChar(50), unsel);
      await reqDel.query(`
        DELETE FROM [stemi_followup] WHERE [stemi_id] = @stemi_id AND [followup_month] = @unsel_month;
        DELETE FROM [patient_followup_tasks] WHERE [reg_patient_id] = @reg_patient_id AND [source_registry] = 'STEMI Registry' AND [timeframe] = @unsel_month AND ([source_record_id] = @stemi_id OR [source_record_id] IS NULL);
      `);
    }

    // Upsert each selected interval
    for (const row of rawFollowupRows) {
      if (!row || !row.followup_month) continue;
      const followupMonth = row.followup_month;
      const monthsToAdd = monthMap[followupMonth] || 1;

      const reqFollowup = new sql.Request(transaction);
      reqFollowup.input('stemi_id', sql.Int, stemi_id);
      reqFollowup.input('reg_patient_id', sql.Int, regPid);
      reqFollowup.input('followup_month', sql.NVarChar(9), followupMonth);
      reqFollowup.input('angina', sql.VarChar(100), row.angina || 'No');
      reqFollowup.input('functional_class', sql.VarChar(50), row.functional_class || 'None');
      reqFollowup.input('number_of_antianginals', sql.Int, row.number_of_antianginals !== undefined && row.number_of_antianginals !== null && row.number_of_antianginals !== '' ? parseInt(row.number_of_antianginals, 10) : null);
      reqFollowup.input('dual_antiplatelets', sql.NVarChar(3), row.dual_antiplatelets || 'No');
      reqFollowup.input('statins', sql.NVarChar(3), row.statins || 'No');
      reqFollowup.input('beta_blocker', sql.NVarChar(3), row.beta_blocker || 'No');
      reqFollowup.input('acei_arb', sql.NVarChar(3), row.acei_arb || 'No');
      reqFollowup.input('aldosterone_antagonist', sql.NVarChar(3), row.aldosterone_antagonist || 'No');
      reqFollowup.input('acs_hospitalization', sql.NVarChar(3), row.acs_hospitalization || 'No');
      reqFollowup.input('ptca', sql.NVarChar(3), row.ptca || 'No');
      reqFollowup.input('cabg', sql.NVarChar(3), row.cabg || 'No');
      reqFollowup.input('death', sql.NVarChar(3), row.death || 'No');
      reqFollowup.input('other_event', sql.NVarChar(sql.MAX), row.other_event || '');
      reqFollowup.input('visit_mode', sql.VarChar(50), row.visit_mode || getVal('visit_mode', 'In-Person'));
      reqFollowup.input('special_instructions', sql.NVarChar(500), row.special_instructions !== undefined && row.special_instructions !== null && row.special_instructions !== '' ? row.special_instructions : (getVal('special_instructions') || 'Follow-up in cardiology OPD with repeat lipid profile and ECG.'));

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

      // Dynamic column checks for stemi_followup
      const hasVisitModeRes = await transaction.request().query(
        `SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.stemi_followup') AND name = 'visit_mode'`
      );
      const hasVisitMode = hasVisitModeRes.recordset.length > 0;

      const hasSpecialInstructionsRes = await transaction.request().query(
        `SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.stemi_followup') AND name = 'special_instructions'`
      );
      const hasSpecialInstructions = hasSpecialInstructionsRes.recordset.length > 0;

      await reqFollowup.query(`
        -- 1. UPSERT into stemi_followup
        IF EXISTS (
          SELECT 1 FROM [stemi_followup] 
          WHERE [stemi_id] = @stemi_id AND [followup_month] = @followup_month
        )
        BEGIN
          UPDATE [stemi_followup]
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
            [other_event] = @other_event
            ${hasVisitMode ? ', [visit_mode] = @visit_mode' : ''}
            ${hasSpecialInstructions ? ', [special_instructions] = @special_instructions' : ''},
            [updated_at] = GETDATE()
          WHERE [stemi_id] = @stemi_id AND [followup_month] = @followup_month;
        END
        ELSE
        BEGIN
          INSERT INTO [stemi_followup] (
            [stemi_id], [followup_month], [followup_date], [angina], [functional_class], [number_of_antianginals],
            [dual_antiplatelets], [statins], [beta_blocker], [acei_arb], [aldosterone_antagonist],
            [acs_hospitalization], [ptca], [cabg], [death], [other_event]
            ${hasVisitMode ? ', [visit_mode]' : ''}
            ${hasSpecialInstructions ? ', [special_instructions]' : ''},
            [created_at], [updated_at]
          ) VALUES (
            @stemi_id, @followup_month, @followup_date, @angina, @functional_class, @number_of_antianginals,
            @dual_antiplatelets, @statins, @beta_blocker, @acei_arb, @aldosterone_antagonist,
            @acs_hospitalization, @ptca, @cabg, @death, @other_event
            ${hasVisitMode ? ', @visit_mode' : ''}
            ${hasSpecialInstructions ? ', @special_instructions' : ''},
            GETDATE(), GETDATE()
          );
        END

        -- 2. Synchronize into patient_followup_tasks
        IF EXISTS (
          SELECT 1 FROM [patient_followup_tasks]
          WHERE [reg_patient_id] = @reg_patient_id AND [timeframe] = @followup_month AND [source_registry] = 'STEMI Registry'
        )
        BEGIN
          UPDATE [patient_followup_tasks]
          SET
            [target_date] = @followup_date,
            [visit_mode] = @visit_mode,
            [special_instructions] = @special_instructions,
            [source_record_id] = @stemi_id,
            [updated_at] = GETDATE()
          WHERE [reg_patient_id] = @reg_patient_id AND [timeframe] = @followup_month AND [source_registry] = 'STEMI Registry';
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
            @nextTaskId, @reg_patient_id, 'STEMI Registry', @stemi_id, 'Yes',
            @followup_month, @followup_date, 'CARE Heart Institute', @visit_mode, @special_instructions,
            'Required', GETDATE(), GETDATE()
          );

          SET IDENTITY_INSERT [patient_followup_tasks] OFF;
        END
      `);
    }

    await transaction.commit();

    return res.status(200).json({
      success: true,
      message: 'STEMI Registry record successfully updated.'
    });

  } catch (error) {
    console.error('❌ Error updating STEMI Record:', error);
    if (transaction) {
      try {
        await transaction.rollback();
      } catch (rollbackErr) {
        console.error('⚠️ Transaction Rollback Error:', rollbackErr);
      }
    }

    return res.status(500).json({
      success: false,
      message: error.message || 'Internal server error while updating STEMI record.'
    });
  }
}

/**
 * DELETE /api/stemi/:id - Soft delete STEMI record
 */
async function deleteStemiRecord(req, res) {
  try {
    const stemi_id = parseInt(req.params.id, 10);
    const userId = req.user?.id || 1;
    const pool = await getPool();

    const hasIsDeletedRes = await pool.request().query(
      `SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.stemi_registry') AND name = 'is_deleted'`
    );
    const hasIsDeleted = hasIsDeletedRes.recordset.length > 0;

    const hasStatusRes = await pool.request().query(
      `SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.stemi_registry') AND name = 'status'`
    );
    const hasStatus = hasStatusRes.recordset.length > 0;

    const reqDel = pool.request().input('stemi_id', sql.Int, stemi_id);
    reqDel.input('user_id', sql.Int, userId);
    
    await reqDel.query(`
      UPDATE [stemi_registry]
      SET ${hasIsDeleted ? '[is_deleted] = 1, [deleted_at] = GETDATE(), [deleted_by] = @user_id,' : ''}
          ${hasStatus ? '[status] = 1,' : ''}
          [updated_at] = GETDATE()
      WHERE [stemi_id] = @stemi_id;
    `);

    return res.status(200).json({
      success: true,
      message: 'STEMI record soft-deleted successfully.'
    });
  } catch (error) {
    console.error('Error deleting STEMI record:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Internal server error while deleting STEMI record.'
    });
  }
}

/**
 * PATCH/PUT /api/stemi/:id/undelete - Restore / Undelete STEMI record
 */
async function undeleteStemiRecord(req, res) {
  try {
    const stemi_id = parseInt(req.params.id, 10);
    const pool = await getPool();

    const hasIsDeletedRes = await pool.request().query(
      `SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.stemi_registry') AND name = 'is_deleted'`
    );
    const hasIsDeleted = hasIsDeletedRes.recordset.length > 0;

    const hasStatusRes = await pool.request().query(
      `SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.stemi_registry') AND name = 'status'`
    );
    const hasStatus = hasStatusRes.recordset.length > 0;

    await pool.request()
      .input('stemi_id', sql.Int, stemi_id)
      .query(`
        UPDATE [stemi_registry]
        SET ${hasIsDeleted ? '[is_deleted] = 0, [deleted_at] = NULL, [deleted_by] = NULL,' : ''}
            ${hasStatus ? '[status] = 0,' : ''}
            [updated_at] = GETDATE()
        WHERE [stemi_id] = @stemi_id;
      `);

    return res.status(200).json({
      success: true,
      message: 'STEMI record restored successfully.'
    });
  } catch (error) {
    console.error('Error undeleting STEMI record:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Internal server error while restoring STEMI record.'
    });
  }
}

module.exports = {
  createStemiRecord,
  getStemiHistory,
  getStemiRecord,
  updateStemiRecord,
  deleteStemiRecord,
  undeleteStemiRecord
};
