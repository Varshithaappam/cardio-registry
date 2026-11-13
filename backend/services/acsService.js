const { getPool, sql } = require('../config/db');

/**
 * Fetch and map all STEMI registry records from database tables
 */
async function getStemiCohortFromDb(includeDeleted = true) {
  const pool = await getPool();
  const whereClause = includeDeleted ? '' : 'WHERE s.is_deleted = 0 OR s.is_deleted IS NULL';
  const query = `
    SELECT 
      s.stemi_id, s.reg_patient_id, s.acs_no, s.ip_no, s.admission_date, s.discharge_date, s.primary_consultant, s.is_deleted,
      p.patient_name, p.gender, p.date_of_birth, p.mr_no, p.uhid, p.phone_no, p.ip_no AS patient_ip_no,
      DATEDIFF(year, p.date_of_birth, ISNULL(s.admission_date, GETDATE())) as age,
      adm.hypertension, adm.diabetes, adm.smoking, adm.renal_failure, adm.copd, adm.cva, adm.prior_acs, adm.prior_ptca, adm.prior_cabg, adm.other_background,
      clin.typical_angina, clin.atypical_chest_pain, clin.breathlessness, clin.syncope_presyncope, clin.timi_total_score,
      clin.age_gt_75, clin.age_65_to_74, clin.history_dm_htn_angina, clin.sbp_lt_100, clin.heart_rate_gt_100,
      clin.killip_class_ii_to_iv, clin.anterior_mi_or_lbbb, clin.weight_lt_67kg, clin.reperfusion_gt_4hrs,
      treat.pami, treat.thrombolysis, treat.conservative, treat.door_to_balloon_time, treat.door_to_needle_time,
      treat.drug_tenecteplase, treat.drug_stk, treat.drug_reteplase, treat.drug_uk,
      treat.vessel_lad, treat.vessel_rca, treat.vessel_lcx, treat.vessel_diagonal, treat.vessel_lmca, treat.vessel_om, treat.vessel_pda, treat.vessel_ramus,
      treat.procedural_success, treat.timi_flow,
      outc.death, outc.remi_for_stemi, outc.cva_thrombotic, outc.cva_hemorrhagic, outc.major_bleeding, outc.discharge_other_medication,
      outc.aspirin, outc.statin, outc.beta_blocker, outc.clopidogrel, outc.ticagrelor, outc.nitrate, outc.nicorandil, outc.calcium_channel_blocker, outc.prasugrel, outc.ranolazine, outc.trimetazidine, outc.ivabradine
    FROM stemi_registry s
    LEFT JOIN patient_demographics p ON s.reg_patient_id = p.reg_patient_id
    LEFT JOIN stemi_administrative adm ON s.stemi_id = adm.stemi_id
    LEFT JOIN stemi_clinical_assessment clin ON s.stemi_id = clin.stemi_id
    LEFT JOIN stemi_treatment_strategy treat ON s.stemi_id = treat.stemi_id
    LEFT JOIN stemi_outcomes outc ON s.stemi_id = outc.stemi_id
    ${whereClause}
    ORDER BY s.stemi_id ASC
  `;

  const result = await pool.request().query(query);
  return result.recordset.map(p => {
    const isPami = p.pami === 'Yes';
    const isTlt = p.thrombolysis === 'Yes';
    const stratList = [];
    if (isPami) stratList.push('PAMI');
    if (isTlt) stratList.push('Thrombolysis');
    if (p.conservative === 'Yes') stratList.push('Conservative');
    const strategy = stratList.length > 0 ? stratList.join(', ') : 'Conservative';

    // Vessels
    const isLad = p.vessel_lad === 'Yes' || p.vessel_lad === true;
    const isRca = p.vessel_rca === 'Yes' || p.vessel_rca === true;
    const isLcx = p.vessel_lcx === 'Yes' || p.vessel_lcx === true;
    const isDiag = p.vessel_diagonal === 'Yes' || p.vessel_diagonal === true;
    const isLmca = p.vessel_lmca === 'Yes' || p.vessel_lmca === true;
    const isOm = p.vessel_om === 'Yes' || p.vessel_om === true;
    const isPda = p.vessel_pda === 'Yes' || p.vessel_pda === true;
    const isRamus = p.vessel_ramus === 'Yes' || p.vessel_ramus === true;

    const checkedVessels = [];
    if (isLad) checkedVessels.push('LAD');
    if (isRca) checkedVessels.push('RCA');
    if (isLcx) checkedVessels.push('LCX');
    if (isDiag) checkedVessels.push('Diagonal');
    if (isLmca) checkedVessels.push('LMCA');
    if (isOm) checkedVessels.push('OM');
    if (isPda) checkedVessels.push('PDA');
    if (isRamus) checkedVessels.push('Ramus');
    const culpritVessel = checkedVessels.length > 0 ? checkedVessels.join(', ') : 'N/A';

    // Thrombolysis agents (show all selected by comma separation)
    const isTnk = p.drug_tenecteplase === 'Yes' || p.drug_tenecteplase === true;
    const isStk = p.drug_stk === 'Yes' || p.drug_stk === true;
    const isRete = p.drug_reteplase === 'Yes' || p.drug_reteplase === true;
    const isUk = p.drug_uk === 'Yes' || p.drug_uk === true;

    const lyticList = [];
    if (isTnk) lyticList.push('Tenecteplase');
    if (isStk) lyticList.push('STK');
    if (isRete) lyticList.push('Reteplase');
    if (isUk) lyticList.push('UK');
    if (lyticList.length === 0 && isTlt) lyticList.push('Tenecteplase');
    const thrombolysisAgent = lyticList.length > 0 ? lyticList.join(', ') : 'N/A';

    // Presentation (show all selected by comma separation)
    const isTypical = p.typical_angina === 'Yes' || p.typical_angina === true;
    const isAtypical = p.atypical_chest_pain === 'Yes' || p.atypical_chest_pain === true;
    const isBreath = p.breathlessness === 'Yes' || p.breathlessness === true;
    const isSyncope = p.syncope_presyncope === 'Yes' || p.syncope_presyncope === true;

    const presentationList = [];
    if (isTypical) presentationList.push('Typical angina');
    if (isAtypical) presentationList.push('Atypical chest pain');
    if (isBreath) presentationList.push('Breathlessness');
    if (isSyncope) presentationList.push('Syncope/ Pre-syncope');
    const presentation = presentationList.length > 0 ? presentationList.join(', ') : 'N/A';

    // Comorbidities (show all selected by comma separation)
    const comorbList = [];
    if (p.hypertension === 'Yes') comorbList.push('Hypertension');
    if (p.diabetes === 'Yes') comorbList.push('Diabetes');
    if (p.smoking === 'Yes') comorbList.push('Smoking');
    if (p.renal_failure === 'Yes') comorbList.push('Renal Failure');
    if (p.copd === 'Yes') comorbList.push('COPD');
    if (p.cva === 'Yes') comorbList.push('CVA');
    if (p.prior_acs === 'Yes') comorbList.push('Prior ACS');
    if (p.prior_ptca === 'Yes') comorbList.push('Prior PTCA');
    if (p.prior_cabg === 'Yes') comorbList.push('Prior CABG');
    if (p.other_background && p.other_background !== 'None' && p.other_background !== '') comorbList.push(p.other_background);
    const comorbidities = comorbList.length > 0 ? comorbList.join(', ') : 'None';

    // Discharge Medications (show all selected by comma separation)
    const medList = [];
    if (p.aspirin === 'Yes') medList.push('Aspirin');
    if (p.statin === 'Yes') medList.push('Statin');
    if (p.beta_blocker === 'Yes') medList.push('Beta-blocker');
    if (p.clopidogrel === 'Yes') medList.push('Clopidogrel');
    if (p.ticagrelor === 'Yes') medList.push('Ticagrelor');
    if (p.prasugrel === 'Yes') medList.push('Prasugrel');
    if (p.nitrate === 'Yes') medList.push('Nitrates');
    if (p.nicorandil === 'Yes') medList.push('Nicorandil');
    if (p.calcium_channel_blocker === 'Yes') medList.push('CCB');
    if (p.ranolazine === 'Yes') medList.push('Ranolazine');
    if (p.trimetazidine === 'Yes') medList.push('Trimetazidine');
    if (p.ivabradine === 'Yes') medList.push('Ivabradine');
    if (p.discharge_other_medication && p.discharge_other_medication !== 'None' && p.discharge_other_medication !== '') medList.push(p.discharge_other_medication);
    const medications = medList.length > 0 ? medList.join(', ') : 'None';

    // TIMI Risk Factors (show all selected by comma separation)
    const timiRiskList = [];
    if (p.age_gt_75 === 'Yes' || p.age_gt_75 === true) timiRiskList.push('Age > 75 years (+3)');
    if (p.age_65_to_74 === 'Yes' || p.age_65_to_74 === true) timiRiskList.push('Age 65 to 74 years (+2)');
    if (p.history_dm_htn_angina === 'Yes' || p.history_dm_htn_angina === true) timiRiskList.push('H/o DM/ HTN/ Angina (+1)');
    if (p.sbp_lt_100 === 'Yes' || p.sbp_lt_100 === true) timiRiskList.push('SBP < 100 mmHg (+3)');
    if (p.heart_rate_gt_100 === 'Yes' || p.heart_rate_gt_100 === true) timiRiskList.push('Heart Rate > 100/ min (+2)');
    if (p.killip_class_ii_to_iv === 'Yes' || p.killip_class_ii_to_iv === true || ['II', 'III', 'IV', 'Class II', 'Class III', 'Class IV'].includes(p.killip_class_ii_to_iv)) timiRiskList.push('Killip Class (+2)');
    if (p.anterior_mi_or_lbbb === 'Yes' || p.anterior_mi_or_lbbb === true) timiRiskList.push('Ant MI/ LBBB (+1)');
    if (p.weight_lt_67kg === 'Yes' || p.weight_lt_67kg === true) timiRiskList.push('Weight < 67 kg (+1)');
    if (p.reperfusion_gt_4hrs === 'Yes' || p.reperfusion_gt_4hrs === true) timiRiskList.push('Time to reperfusion > 4 hrs (+1)');
    const timiRisk = timiRiskList.length > 0 ? timiRiskList.join(', ') : 'None';

    const d2b = p.door_to_balloon_time != null ? Number(p.door_to_balloon_time) : null;
    const d2n = p.door_to_needle_time != null ? Number(p.door_to_needle_time) : null;

    return {
      id: `STEMI-${p.stemi_id}`,
      stemiId: p.stemi_id,
      regPatientId: p.reg_patient_id,
      isDeleted: p.is_deleted === true || p.is_deleted === 1,
      uhid: p.uhid || p.mr_no || `CARE-ST-${String(p.stemi_id).padStart(4, '0')}`,
      mrNo: p.mr_no || 'N/A',
      ipNo: p.ip_no || p.patient_ip_no || 'N/A',
      acsNo: p.acs_no || `ACS.${String(p.stemi_id).padStart(4, '0')}`,
      patientName: p.patient_name || `Patient ST-${p.stemi_id}`,
      primaryConsultant: p.primary_consultant || 'Dr. K. Sridhar (Cardiologist)',
      phone: p.phone_no || 'N/A',
      registryType: 'STEMI',
      gender: p.gender || 'Male',
      age: Number(p.age) || 0,
      admissionDate: p.admission_date ? new Date(p.admission_date).toISOString().slice(0, 10) : '2025-01-01',
      dischargeDate: p.discharge_date ? new Date(p.discharge_date).toISOString().slice(0, 10) : 'N/A',
      presentation,
      presentations: presentationList,
      typical_angina: isTypical,
      atypical_chest_pain: isAtypical,
      breathlessness: isBreath,
      syncope_presyncope: isSyncope,
      hypertension: p.hypertension === 'Yes',
      diabetes: p.diabetes === 'Yes',
      smoking: p.smoking === 'Yes',
      renalFailure: p.renal_failure === 'Yes',
      renal_failure: p.renal_failure === 'Yes',
      copd: p.copd === 'Yes',
      cva: p.cva === 'Yes',
      priorAcs: p.prior_acs === 'Yes',
      prior_acs: p.prior_acs === 'Yes',
      priorPtca: p.prior_ptca === 'Yes',
      prior_ptca: p.prior_ptca === 'Yes',
      priorCabg: p.prior_cabg === 'Yes',
      prior_cabg: p.prior_cabg === 'Yes',
      timiScore: p.timi_total_score != null ? Number(p.timi_total_score) : 0,
      timi_total_score: p.timi_total_score != null ? Number(p.timi_total_score) : 0,
      timiRisk,
      timiRiskList,
      age_gt_75: p.age_gt_75 === 'Yes',
      age_65_to_74: p.age_65_to_74 === 'Yes',
      history_dm_htn_angina: p.history_dm_htn_angina === 'Yes',
      sbp_lt_100: p.sbp_lt_100 === 'Yes',
      heart_rate_gt_100: p.heart_rate_gt_100 === 'Yes',
      killip_class_ii_to_iv: p.killip_class_ii_to_iv === 'Yes' || ['II', 'III', 'IV', 'Class II', 'Class III', 'Class IV'].includes(p.killip_class_ii_to_iv),
      anterior_mi_or_lbbb: p.anterior_mi_or_lbbb === 'Yes',
      weight_lt_67kg: p.weight_lt_67kg === 'Yes',
      reperfusion_gt_4hrs: p.reperfusion_gt_4hrs === 'Yes',
      chd_risk_factors_ge_3: p.chd_risk_factors_ge_3 === 'Yes',
      prior_coronary_stenosis_gt_50: p.prior_coronary_stenosis_gt_50 === 'Yes',
      st_deviation_at_admission: p.st_deviation_at_admission === 'Yes',
      anginal_episodes_ge_2_last_24hrs: p.anginal_episodes_ge_2_last_24hrs === 'Yes',
      elevated_serum_cardiac_markers: p.elevated_serum_cardiac_markers === 'Yes',
      treatmentStrategy: strategy,
      pami: isPami,
      thrombolysis: isTlt,
      conservative: p.conservative === 'Yes',
      doorToBalloonTime: d2b,
      doorToNeedleTime: d2n,
      thrombolysisAgent,
      drug_tenecteplase: isTnk,
      drug_stk: isStk,
      drug_reteplase: isRete,
      drug_uk: isUk,
      culpritVessel,
      culpritVessels: checkedVessels,
      vessel_lad: isLad,
      vessel_rca: isRca,
      vessel_lcx: isLcx,
      vessel_diagonal: isDiag,
      vessel_lmca: isLmca,
      vessel_om: isOm,
      vessel_pda: isPda,
      vessel_ramus: isRamus,
      postProcTimiFlow: p.timi_flow != null ? Number(p.timi_flow) : (p.procedural_success === 'Yes' ? 3 : (p.procedural_success === 'No' ? 0 : null)),
      proceduralSuccess: p.procedural_success === 'Yes',
      procedural_success: p.procedural_success === 'Yes',
      death: p.death === 'Yes' || p.death === true,
      reMi: p.remi_for_stemi === 'Yes',
      remi_for_stemi: p.remi_for_stemi,
      targetVesselReMi: p.remi_for_stemi === 'Yes',
      recurrentIschemia: false,
      stroke: p.cva_thrombotic === 'Yes' || p.cva_hemorrhagic === 'Yes',
      cva_thrombotic: p.cva_thrombotic,
      cva_hemorrhagic: p.cva_hemorrhagic,
      majorBleeding: p.major_bleeding === 'Yes',
      major_bleeding: p.major_bleeding,
      comorbidities,
      medications,
      other_background: p.other_background,
      discharge_other_medication: p.discharge_other_medication,
      discharge_aspirin: p.aspirin === 'Yes',
      discharge_statin: p.statin === 'Yes',
      discharge_beta_blocker: p.beta_blocker === 'Yes',
      discharge_clopidogrel: p.clopidogrel === 'Yes',
      discharge_ticagrelor: p.ticagrelor === 'Yes',
      discharge_nitrate: p.nitrate === 'Yes',
      discharge_nicorandil: p.nicorandil === 'Yes',
      discharge_calcium_channel_blocker: p.calcium_channel_blocker === 'Yes',
      discharge_prasugrel: p.prasugrel === 'Yes',
      discharge_ranolazine: p.ranolazine === 'Yes',
      discharge_trimetazidine: p.trimetazidine === 'Yes',
      discharge_ivabradine: p.ivabradine === 'Yes'
    };
  });
}

/**
 * Fetch and map all NSTEMI registry records from database tables
 */
async function getNstemiCohortFromDb() {
  const pool = await getPool();
  const query = `
    SELECT 
      n.nstemi_id, n.reg_patient_id, n.acs_no, n.ip_no, n.admission_date, n.discharge_date, n.primary_consultant,
      p.patient_name, p.gender, p.date_of_birth, p.mr_no, p.uhid, p.phone_no, p.ip_no AS patient_ip_no,
      DATEDIFF(year, p.date_of_birth, ISNULL(n.admission_date, GETDATE())) as age,
      adm.hypertension, adm.diabetes, adm.smoking, adm.renal_failure, adm.copd, adm.cva, adm.prior_acs, adm.prior_ptca, adm.prior_cabg, adm.other_background,
      clin.typical_angina, clin.atypical_chest_pain, clin.breathlessness, clin.syncope_presyncope, clin.timi_total_score,
      clin.age_gt_75, clin.age_65_to_74, clin.history_dm_htn_angina, clin.sbp_lt_100, clin.heart_rate_gt_100,
      clin.killip_class_ii_to_iv, clin.anterior_mi_or_lbbb, clin.weight_lt_67kg, clin.reperfusion_gt_4hrs,
      clin.chd_risk_factors_ge_3, clin.prior_coronary_stenosis_gt_50, clin.st_deviation_at_admission,
      clin.anginal_episodes_ge_2_last_24hrs, clin.elevated_serum_cardiac_markers,
      treat.pami, treat.thrombolysis, treat.conservative, treat.door_to_balloon_time, treat.door_to_needle_time,
      treat.drug_tenecteplase, treat.drug_stk, treat.drug_reteplase, treat.drug_uk,
      treat.vessel_lad, treat.vessel_rca, treat.vessel_lcx, treat.vessel_diagonal, treat.vessel_lmca, treat.vessel_om, treat.vessel_pda, treat.vessel_ramus,
      treat.procedural_success, treat.timi_flow,
      outc.death, outc.stemi_for_nonstemi, outc.remi_for_nstemi, outc.revascularization_recurrent_ischemia, outc.cva_thrombotic, outc.cva_hemorrhagic, outc.major_bleeding, outc.discharge_other_medication,
      outc.aspirin, outc.statin, outc.beta_blocker, outc.clopidogrel, outc.ticagrelor, outc.nitrate, outc.nicorandil, outc.calcium_channel_blocker, outc.prasugrel, outc.ranolazine, outc.trimetazidine, outc.ivabradine
    FROM nstemi_registry n
    LEFT JOIN patient_demographics p ON n.reg_patient_id = p.reg_patient_id
    LEFT JOIN nstemi_administrative adm ON n.nstemi_id = adm.nstemi_id
    LEFT JOIN nstemi_clinical_assessment clin ON n.nstemi_id = clin.nstemi_id
    LEFT JOIN nstemi_treatment_strategy treat ON n.nstemi_id = treat.nstemi_id
    LEFT JOIN nstemi_outcomes outc ON n.nstemi_id = outc.nstemi_id
    WHERE n.is_deleted = 0 OR n.is_deleted IS NULL
    ORDER BY n.nstemi_id ASC
  `;

  const result = await pool.request().query(query);
  return result.recordset.map(p => {
    // In NSTEMI, strategy is Early Invasive (<24h), Selective Invasive, or Conservative
    let strategy = 'Early Invasive';
    if (p.conservative === 'Yes') strategy = 'Conservative';
    else if (p.pami === 'Yes') strategy = 'Early Invasive';
    else strategy = 'Selective Invasive';

    // Vessels (show all selected by comma separation)
    const isLad = p.vessel_lad === 'Yes' || p.vessel_lad === true;
    const isRca = p.vessel_rca === 'Yes' || p.vessel_rca === true;
    const isLcx = p.vessel_lcx === 'Yes' || p.vessel_lcx === true;
    const isDiag = p.vessel_diagonal === 'Yes' || p.vessel_diagonal === true;
    const isLmca = p.vessel_lmca === 'Yes' || p.vessel_lmca === true;
    const isOm = p.vessel_om === 'Yes' || p.vessel_om === true;
    const isPda = p.vessel_pda === 'Yes' || p.vessel_pda === true;
    const isRamus = p.vessel_ramus === 'Yes' || p.vessel_ramus === true;

    const checkedVessels = [];
    if (isLad) checkedVessels.push('LAD');
    if (isRca) checkedVessels.push('RCA');
    if (isLcx) checkedVessels.push('LCX');
    if (isDiag) checkedVessels.push('Diagonal');
    if (isLmca) checkedVessels.push('LMCA');
    if (isOm) checkedVessels.push('OM');
    if (isPda) checkedVessels.push('PDA');
    if (isRamus) checkedVessels.push('Ramus');
    const culpritVessel = checkedVessels.length > 0 ? checkedVessels.join(', ') : 'N/A';

    // Thrombolysis agents (show all selected by comma separation)
    const isTnk = p.drug_tenecteplase === 'Yes' || p.drug_tenecteplase === true;
    const isStk = p.drug_stk === 'Yes' || p.drug_stk === true;
    const isRete = p.drug_reteplase === 'Yes' || p.drug_reteplase === true;
    const isUk = p.drug_uk === 'Yes' || p.drug_uk === true;

    const lyticList = [];
    if (isTnk) lyticList.push('Tenecteplase');
    if (isStk) lyticList.push('STK');
    if (isRete) lyticList.push('Reteplase');
    if (isUk) lyticList.push('UK');
    if (lyticList.length === 0 && p.thrombolysis === 'Yes') lyticList.push('Tenecteplase');
    const thrombolysisAgent = lyticList.length > 0 ? lyticList.join(', ') : 'N/A';

    // Presentation (show all selected by comma separation)
    const isTypical = p.typical_angina === 'Yes' || p.typical_angina === true;
    const isAtypical = p.atypical_chest_pain === 'Yes' || p.atypical_chest_pain === true;
    const isBreath = p.breathlessness === 'Yes' || p.breathlessness === true;
    const isSyncope = p.syncope_presyncope === 'Yes' || p.syncope_presyncope === true;

    const presentationList = [];
    if (isTypical) presentationList.push('Typical angina');
    if (isAtypical) presentationList.push('Atypical chest pain');
    if (isBreath) presentationList.push('Breathlessness');
    if (isSyncope) presentationList.push('Syncope/ Pre-syncope');
    const presentation = presentationList.length > 0 ? presentationList.join(', ') : 'N/A';

    // Comorbidities (show all selected by comma separation)
    const comorbList = [];
    if (p.hypertension === 'Yes') comorbList.push('Hypertension');
    if (p.diabetes === 'Yes') comorbList.push('Diabetes');
    if (p.smoking === 'Yes') comorbList.push('Smoking');
    if (p.renal_failure === 'Yes') comorbList.push('Renal Failure');
    if (p.copd === 'Yes') comorbList.push('COPD');
    if (p.cva === 'Yes') comorbList.push('CVA');
    if (p.prior_acs === 'Yes') comorbList.push('Prior ACS');
    if (p.prior_ptca === 'Yes') comorbList.push('Prior PTCA');
    if (p.prior_cabg === 'Yes') comorbList.push('Prior CABG');
    if (p.other_background && p.other_background !== 'None' && p.other_background !== '') comorbList.push(p.other_background);
    const comorbidities = comorbList.length > 0 ? comorbList.join(', ') : 'None';

    // Discharge Medications (show all selected by comma separation)
    const medList = [];
    if (p.aspirin === 'Yes') medList.push('Aspirin');
    if (p.statin === 'Yes') medList.push('Statin');
    if (p.beta_blocker === 'Yes') medList.push('Beta-blocker');
    if (p.clopidogrel === 'Yes') medList.push('Clopidogrel');
    if (p.ticagrelor === 'Yes') medList.push('Ticagrelor');
    if (p.prasugrel === 'Yes') medList.push('Prasugrel');
    if (p.nitrate === 'Yes') medList.push('Nitrates');
    if (p.nicorandil === 'Yes') medList.push('Nicorandil');
    if (p.calcium_channel_blocker === 'Yes') medList.push('CCB');
    if (p.ranolazine === 'Yes') medList.push('Ranolazine');
    if (p.trimetazidine === 'Yes') medList.push('Trimetazidine');
    if (p.ivabradine === 'Yes') medList.push('Ivabradine');
    if (p.discharge_other_medication && p.discharge_other_medication !== 'None' && p.discharge_other_medication !== '') medList.push(p.discharge_other_medication);
    const medications = medList.length > 0 ? medList.join(', ') : 'None';

    // TIMI Risk Factors (show all selected by comma separation)
    const timiRiskList = [];
    if (p.age_gt_75 === 'Yes' || p.age_gt_75 === true) timiRiskList.push('Age > 75 years (+3)');
    if (p.age_65_to_74 === 'Yes' || p.age_65_to_74 === true) timiRiskList.push('Age 65 to 74 years (+2)');
    if (p.history_dm_htn_angina === 'Yes' || p.history_dm_htn_angina === true) timiRiskList.push('H/o DM/ HTN/ Angina (+1)');
    if (p.sbp_lt_100 === 'Yes' || p.sbp_lt_100 === true) timiRiskList.push('SBP < 100 mmHg (+3)');
    if (p.heart_rate_gt_100 === 'Yes' || p.heart_rate_gt_100 === true) timiRiskList.push('Heart Rate > 100/ min (+2)');
    if (p.killip_class_ii_to_iv === 'Yes' || p.killip_class_ii_to_iv === true || ['II', 'III', 'IV', 'Class II', 'Class III', 'Class IV'].includes(p.killip_class_ii_to_iv)) timiRiskList.push('Killip Class (+2)');
    if (p.anterior_mi_or_lbbb === 'Yes' || p.anterior_mi_or_lbbb === true) timiRiskList.push('Ant MI/ LBBB (+1)');
    if (p.weight_lt_67kg === 'Yes' || p.weight_lt_67kg === true) timiRiskList.push('Weight < 67 kg (+1)');
    if (p.reperfusion_gt_4hrs === 'Yes' || p.reperfusion_gt_4hrs === true) timiRiskList.push('Time to reperfusion > 4 hrs (+1)');
    if (p.chd_risk_factors_ge_3 === 'Yes' || p.chd_risk_factors_ge_3 === true) timiRiskList.push('Presence of at least 3 CHD risk factors (+1)');
    if (p.prior_coronary_stenosis_gt_50 === 'Yes' || p.prior_coronary_stenosis_gt_50 === true) timiRiskList.push('Prior coronary stenosis of >50% (+1)');
    if (p.st_deviation_at_admission === 'Yes' || p.st_deviation_at_admission === true) timiRiskList.push('Presence of ST deviation at admission (+1)');
    if (p.anginal_episodes_ge_2_last_24hrs === 'Yes' || p.anginal_episodes_ge_2_last_24hrs === true) timiRiskList.push('At least 2 anginal episodes < 24 hrs (+1)');
    if (p.elevated_serum_cardiac_markers === 'Yes' || p.elevated_serum_cardiac_markers === true) timiRiskList.push('Elevated serum cardiac markers (+1)');
    const timiRisk = timiRiskList.length > 0 ? timiRiskList.join(', ') : 'None';

    // NSTEMI Door to Cath in hours
    const timeToCath = p.door_to_balloon_time != null ? Number(p.door_to_balloon_time) / 60 : null;

    return {
      id: `NSTEMI-${p.nstemi_id}`,
      nstemiId: p.nstemi_id,
      regPatientId: p.reg_patient_id,
      uhid: p.uhid || p.mr_no || `CARE-NST-${String(p.nstemi_id).padStart(4, '0')}`,
      mrNo: p.mr_no || 'N/A',
      ipNo: p.ip_no || p.patient_ip_no || 'N/A',
      acsNo: p.acs_no || `ACS.${String(p.nstemi_id).padStart(4, '0')}`,
      patientName: p.patient_name || `Patient NST-${p.nstemi_id}`,
      primaryConsultant: p.primary_consultant || 'Dr. K. Sridhar (Cardiologist)',
      phone: p.phone_no || 'N/A',
      registryType: 'NSTEMI',
      gender: p.gender || 'Male',
      age: Number(p.age) || 0,
      admissionDate: p.admission_date ? new Date(p.admission_date).toISOString().slice(0, 10) : '2025-01-01',
      dischargeDate: p.discharge_date ? new Date(p.discharge_date).toISOString().slice(0, 10) : 'N/A',
      presentation,
      presentations: presentationList,
      typical_angina: isTypical,
      atypical_chest_pain: isAtypical,
      breathlessness: isBreath,
      syncope_presyncope: isSyncope,
      hypertension: p.hypertension === 'Yes',
      diabetes: p.diabetes === 'Yes',
      smoking: p.smoking === 'Yes',
      renalFailure: p.renal_failure === 'Yes',
      renal_failure: p.renal_failure === 'Yes',
      copd: p.copd === 'Yes',
      cva: p.cva === 'Yes',
      priorAcs: p.prior_acs === 'Yes',
      prior_acs: p.prior_acs === 'Yes',
      priorPtca: p.prior_ptca === 'Yes',
      prior_ptca: p.prior_ptca === 'Yes',
      priorCabg: p.prior_cabg === 'Yes',
      prior_cabg: p.prior_cabg === 'Yes',
      timiScore: p.timi_total_score != null ? Number(p.timi_total_score) : 0,
      timi_total_score: p.timi_total_score != null ? Number(p.timi_total_score) : 0,
      timiRisk,
      timiRiskList,
      age_gt_75: p.age_gt_75 === 'Yes',
      age_65_to_74: p.age_65_to_74 === 'Yes',
      history_dm_htn_angina: p.history_dm_htn_angina === 'Yes',
      sbp_lt_100: p.sbp_lt_100 === 'Yes',
      heart_rate_gt_100: p.heart_rate_gt_100 === 'Yes',
      killip_class_ii_to_iv: p.killip_class_ii_to_iv === 'Yes' || ['II', 'III', 'IV', 'Class II', 'Class III', 'Class IV'].includes(p.killip_class_ii_to_iv),
      anterior_mi_or_lbbb: p.anterior_mi_or_lbbb === 'Yes',
      weight_lt_67kg: p.weight_lt_67kg === 'Yes',
      reperfusion_gt_4hrs: p.reperfusion_gt_4hrs === 'Yes',
      chd_risk_factors_ge_3: p.chd_risk_factors_ge_3 === 'Yes',
      prior_coronary_stenosis_gt_50: p.prior_coronary_stenosis_gt_50 === 'Yes',
      st_deviation_at_admission: p.st_deviation_at_admission === 'Yes',
      anginal_episodes_ge_2_last_24hrs: p.anginal_episodes_ge_2_last_24hrs === 'Yes',
      elevated_serum_cardiac_markers: p.elevated_serum_cardiac_markers === 'Yes',
      treatmentStrategy: strategy,
      pami: p.pami === 'Yes',
      thrombolysis: p.thrombolysis === 'Yes',
      conservative: p.conservative === 'Yes',
      doorToBalloonTime: null,
      doorToNeedleTime: null,
      timeToCathHours: timeToCath,
      thrombolysisAgent,
      drug_tenecteplase: isTnk,
      drug_stk: isStk,
      drug_reteplase: isRete,
      drug_uk: isUk,
      culpritVessel,
      culpritVessels: checkedVessels,
      vessel_lad: isLad,
      vessel_rca: isRca,
      vessel_lcx: isLcx,
      vessel_diagonal: isDiag,
      vessel_lmca: isLmca,
      vessel_om: isOm,
      vessel_pda: isPda,
      vessel_ramus: isRamus,
      postProcTimiFlow: p.timi_flow != null ? Number(p.timi_flow) : (p.procedural_success === 'Yes' ? 3 : (p.procedural_success === 'No' ? 0 : null)),
      proceduralSuccess: p.procedural_success === 'Yes',
      procedural_success: p.procedural_success === 'Yes',
      death: p.death === 'Yes' || p.death === true,
      reMi: p.remi_for_nstemi === 'Yes',
      remi_for_nstemi: p.remi_for_nstemi,
      targetVesselReMi: p.remi_for_nstemi === 'Yes',
      recurrentIschemia: p.revascularization_recurrent_ischemia === 'Yes' || p.stemi_for_nonstemi === 'Yes',
      stroke: p.cva_thrombotic === 'Yes' || p.cva_hemorrhagic === 'Yes',
      cva_thrombotic: p.cva_thrombotic,
      cva_hemorrhagic: p.cva_hemorrhagic,
      majorBleeding: p.major_bleeding === 'Yes',
      major_bleeding: p.major_bleeding,
      comorbidities,
      medications,
      other_background: p.other_background,
      discharge_other_medication: p.discharge_other_medication,
      discharge_aspirin: p.aspirin === 'Yes',
      discharge_statin: p.statin === 'Yes',
      discharge_beta_blocker: p.beta_blocker === 'Yes',
      discharge_clopidogrel: p.clopidogrel === 'Yes',
      discharge_ticagrelor: p.ticagrelor === 'Yes',
      discharge_nitrate: p.nitrate === 'Yes',
      discharge_nicorandil: p.nicorandil === 'Yes',
      discharge_calcium_channel_blocker: p.calcium_channel_blocker === 'Yes',
      discharge_prasugrel: p.prasugrel === 'Yes',
      discharge_ranolazine: p.ranolazine === 'Yes',
      discharge_trimetazidine: p.trimetazidine === 'Yes',
      discharge_ivabradine: p.ivabradine === 'Yes'
    };
  });
}

module.exports = {
  getStemiCohortFromDb,
  getNstemiCohortFromDb
};
