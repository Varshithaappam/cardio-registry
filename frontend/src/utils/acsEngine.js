/**
 * ACS Clinical Intelligence & Reperfusion Analytics Engine
 * Provides deterministic clinical calculation, cohort filtering, and Excel report generation
 * for STEMI and NSTEMI registries within the CARE Cardiovascular Platform.
 * Fully synchronized with registry form fields and national cardiology audit benchmarks.
 */

import ExcelJS from 'exceljs';

// Deterministic 150 Patient Simulated ACS Cohort (90 STEMI, 60 NSTEMI)
export const SIMULATED_ACS_COHORT = [
  // --- STEMI Cohort (90 Patients) ---
  ...Array.from({ length: 90 }, (_, i) => {
    const id = i + 1;
    const uhid = `CARE-ST-${String(1000 + id).padStart(5, '0')}`;
    const mrNo = `MR-${String(5000 + id).padStart(5, '0')}`;
    const ipNo = `IP-${String(90000 + id).padStart(6, '0')}`;
    const acsNo = `ACS.${String(id).padStart(4, '0')}`;
    const isMale = (id * 17) % 100 < 74; // ~74% Male
    const phone = `+91 98${String((id * 73921) % 90000000 + 10000000).slice(0, 8)}`;
    const primaryConsultant = (id % 2 === 0 ? 'Dr. K. Sridhar (Cardiologist)' : 'Dr. Ananth Rao');
    const age = 38 + ((id * 7 + 13) % 45); // Range: 38 - 82, mean ~57.8
    const month = String(((id * 3) % 12) + 1).padStart(2, '0');
    const day = String(((id * 5) % 28) + 1).padStart(2, '0');
    const admissionDate = `2025-${month}-${day}`;

    // Presentation (All 4 Form Options: Typical angina, Atypical chest pain, Breathlessness, Syncope/ Pre-syncope)
    let presentation = 'Typical angina';
    let typical_angina = false;
    let atypical_chest_pain = false;
    let breathlessness = false;
    let syncope_presyncope = false;

    if (id % 8 === 0) {
      presentation = 'Typical angina, Breathlessness';
      typical_angina = true;
      breathlessness = true;
    } else {
      const presRand = (id * 23) % 100;
      if (presRand < 62) { presentation = 'Typical angina'; typical_angina = true; }
      else if (presRand < 80) { presentation = 'Atypical chest pain'; atypical_chest_pain = true; }
      else if (presRand < 93) { presentation = 'Breathlessness'; breathlessness = true; }
      else { presentation = 'Syncope/ Pre-syncope'; syncope_presyncope = true; }
    }

    // Comorbidities / Background (All 9 Form Options)
    const htn = (id * 11) % 100 < 64; // ~64.4%
    const dm = (id * 13) % 100 < 48; // ~47.8%
    const smoking = (id * 19) % 100 < 46; // ~45.6%
    const renalFailure = (id * 29) % 100 < 13; // ~12.2%
    const copd = (id * 23) % 100 < 8; // ~7.8%
    const cva = (id * 7) % 100 < 5; // ~4.4%
    const priorAcs = (id * 31) % 100 < 21; // ~21.1%
    const priorPtca = (id * 37) % 100 < 15; // ~14.4%
    const priorCabg = (id * 41) % 100 < 7; // ~6.7%

    // TIMI Risk Score (0-14 for STEMI - Discrete Bell Curve Distribution)
    const stemiBellCurve = [
      0, 0, 0,
      1, 1, 1, 1, 1, 1,
      2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2,
      3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3,
      4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4,
      5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5,
      6, 6, 6, 6, 6, 6, 6, 6, 6,
      7, 7, 7, 7, 7,
      8, 8, 8,
      9, 9,
      10,
      11
    ];
    const timi = stemiBellCurve[i] !== undefined ? stemiBellCurve[i] : 4;

    // TIMI Risk Factors (All 9 STEMI Form Options)
    const age_gt_75 = age >= 75;
    const age_65_to_74 = age >= 65 && age < 75;
    const history_dm_htn_angina = htn || dm;
    const sbp_lt_100 = timi >= 5 && (id % 3 === 0);
    const heart_rate_gt_100 = timi >= 3 && (id % 2 === 0);
    const killip_class_ii_to_iv = timi >= 6;
    const anterior_mi_or_lbbb = timi >= 2 && (id % 2 === 1);
    const weight_lt_67kg = id % 4 === 0;
    const reperfusion_gt_4hrs = id % 5 === 0;
    const chd_risk_factors_ge_3 = false;
    const prior_coronary_stenosis_gt_50 = false;
    const st_deviation_at_admission = false;
    const anginal_episodes_ge_2_last_24hrs = false;
    const elevated_serum_cardiac_markers = false;

    const timiRisksSim = [];
    if (age_gt_75) timiRisksSim.push('Age > 75 years (+3)');
    if (age_65_to_74) timiRisksSim.push('Age 65 to 74 years (+2)');
    if (history_dm_htn_angina) timiRisksSim.push('H/o DM/ HTN/ Angina (+1)');
    if (sbp_lt_100) timiRisksSim.push('SBP < 100 mmHg (+3)');
    if (heart_rate_gt_100) timiRisksSim.push('Heart Rate > 100/ min (+2)');
    if (killip_class_ii_to_iv) timiRisksSim.push('Killip Class (+2)');
    if (anterior_mi_or_lbbb) timiRisksSim.push('Ant MI/ LBBB (+1)');
    if (weight_lt_67kg) timiRisksSim.push('Weight < 67 kg (+1)');
    if (reperfusion_gt_4hrs) timiRisksSim.push('Time to reperfusion > 4 hrs (+1)');
    const timiRisk = timiRisksSim.length > 0 ? timiRisksSim.join(', ') : 'None';

    // Treatment Strategy (PAMI 61.1%, Thrombolysis 32.2%, Conservative 6.7%)
    let treatmentStrategy = 'Conservative';
    let pami = false;
    let thrombolysis = false;
    let conservative = false;

    if (id === 10 || id === 24) {
      treatmentStrategy = 'PAMI, Thrombolysis';
      pami = true;
      thrombolysis = true;
    } else {
      const treatRand = (id * 43) % 100;
      if (treatRand < 61) { treatmentStrategy = 'PAMI'; pami = true; }
      else if (treatRand < 93) { treatmentStrategy = 'Thrombolysis'; thrombolysis = true; }
      else { treatmentStrategy = 'Conservative'; conservative = true; }
    }

    // Reperfusion Timings
    const d2b = (treatmentStrategy === 'PAMI' || pami)
      ? (42 + ((id * 11) % 72)) // 42 to 113 mins, mean ~78.2 min
      : null;
    const d2n = (treatmentStrategy === 'Thrombolysis' || thrombolysis)
      ? (16 + ((id * 7) % 26)) // 16 to 41 mins, mean ~29.1 min
      : null;

    // Thrombolysis Drug (All 4 Form Options: Tenecteplase, STK, Reteplase, UK)
    let thrombolysisAgent = null;
    let drug_tenecteplase = false;
    let drug_stk = false;
    let drug_reteplase = false;
    let drug_uk = false;

    if (thrombolysis || treatmentStrategy.includes('Thrombolysis')) {
      if (id === 10) {
        thrombolysisAgent = 'Tenecteplase, STK, Reteplase';
        drug_tenecteplase = true;
        drug_stk = true;
        drug_reteplase = true;
      } else if (id === 24) {
        thrombolysisAgent = 'Tenecteplase, STK';
        drug_tenecteplase = true;
        drug_stk = true;
      } else {
        const agentRand = (id * 17) % 100;
        if (agentRand < 62) { thrombolysisAgent = 'Tenecteplase'; drug_tenecteplase = true; }
        else if (agentRand < 86) { thrombolysisAgent = 'STK'; drug_stk = true; }
        else if (agentRand < 96) { thrombolysisAgent = 'Reteplase'; drug_reteplase = true; }
        else { thrombolysisAgent = 'UK'; drug_uk = true; }
      }
    }

    // Culprit Vessel(s) (All 8 Form Options: LAD, RCA, LCX, Diagonal, LMCA, OM, PDA, Ramus)
    let culpritVessel = 'LAD';
    let vessel_lad = false;
    let vessel_rca = false;
    let vessel_lcx = false;
    let vessel_diagonal = false;
    let vessel_lmca = false;
    let vessel_om = false;
    let vessel_pda = false;
    let vessel_ramus = false;

    if (id === 15) {
      culpritVessel = 'LAD, RCA, LCX';
      vessel_lad = true;
      vessel_rca = true;
      vessel_lcx = true;
    } else if (id % 5 === 0) {
      culpritVessel = 'LAD, RCA';
      vessel_lad = true;
      vessel_rca = true;
    } else {
      const vesselRand = (id * 53) % 100;
      if (vesselRand < 44) { culpritVessel = 'LAD'; vessel_lad = true; }
      else if (vesselRand < 72) { culpritVessel = 'RCA'; vessel_rca = true; }
      else if (vesselRand < 86) { culpritVessel = 'LCX'; vessel_lcx = true; }
      else if (vesselRand < 91) { culpritVessel = 'Diagonal'; vessel_diagonal = true; }
      else if (vesselRand < 94) { culpritVessel = 'LMCA'; vessel_lmca = true; }
      else if (vesselRand < 97) { culpritVessel = 'OM'; vessel_om = true; }
      else if (vesselRand < 99) { culpritVessel = 'PDA'; vessel_pda = true; }
      else { culpritVessel = 'Ramus'; vessel_ramus = true; }
    }

    // Procedural TIMI Flow (Grade 3 in 91.1%, Grade 2 in 6.7%, Grade 0/1 in 2.2%)
    const timiFlowRand = (id * 61) % 100;
    const postProcTimiFlow = timiFlowRand < 91 ? 3 : (timiFlowRand < 98 ? 2 : 1);

    // MACE / In-Hospital Outcomes
    const isDeath = [7, 23, 44, 68, 85].includes(id); // 5 deaths = 5.56%
    const isReMi = [12, 49, 77].includes(id); // 3 Re-MI = 3.33%
    const isStroke = id === 34; // 1 stroke = 1.11%
    const strokeType = isStroke ? 'Thrombotic' : null;
    const isMajorBleed = [18, 55, 81].includes(id); // 3 bleeds = 3.33%

    // Discharge Medications (All 12 Form Options from Section 13)
    const discharge_aspirin = !isDeath && ![15, 62].includes(id); // 88/90 = 97.8%
    const discharge_statin = !isDeath && ![9, 41, 73].includes(id); // 87/90 = 96.7%
    const discharge_beta_blocker = !isDeath && ![4, 28, 52, 79, 88].includes(id); // 85/90 = 94.4%
    const discharge_clopidogrel = !isDeath && ((id * 7) % 100 < 72); // ~70.0%
    const discharge_ticagrelor = !isDeath && ((id * 13) % 100 < 27); // ~25.6%
    const discharge_nitrate = !isDeath && ((id * 19) % 100 < 38); // ~36.7%
    const discharge_nicorandil = !isDeath && ((id * 23) % 100 < 29); // ~27.8%
    const discharge_calcium_channel_blocker = !isDeath && ((id * 29) % 100 < 20); // ~18.9%
    const discharge_prasugrel = !isDeath && ((id * 17) % 100 < 13); // ~12.2%
    const discharge_ranolazine = !isDeath && ((id * 31) % 100 < 16); // ~14.4% (Ranozolidine)
    const discharge_trimetazidine = !isDeath && ((id * 37) % 100 < 13); // ~12.2% (Trimetazidine)
    const discharge_ivabradine = !isDeath && ((id * 43) % 100 < 10); // ~8.9% (Ivabradine)

    const admD = new Date(admissionDate);
    admD.setDate(admD.getDate() + (isDeath ? 1 : 4));
    const dischargeDate = admD.toISOString().slice(0, 10);

    return {
      id: `STEMI-${id}`,
      stemiId: id,
      uhid,
      mrNo,
      ipNo,
      acsNo,
      patientName: `Patient ST-${1000 + id}`,
      primaryConsultant,
      phone,
      registryType: 'STEMI',
      gender: isMale ? 'Male' : 'Female',
      age,
      admissionDate,
      dischargeDate,
      presentation,
      typical_angina,
      atypical_chest_pain,
      breathlessness,
      syncope_presyncope,
      hypertension: htn,
      diabetes: dm,
      smoking,
      renalFailure,
      copd,
      cva,
      priorAcs,
      priorPtca,
      priorCabg,
      timiScore: timi,
      timiRisk,
      age_gt_75,
      age_65_to_74,
      history_dm_htn_angina,
      sbp_lt_100,
      heart_rate_gt_100,
      killip_class_ii_to_iv,
      anterior_mi_or_lbbb,
      weight_lt_67kg,
      reperfusion_gt_4hrs,
      chd_risk_factors_ge_3,
      prior_coronary_stenosis_gt_50,
      st_deviation_at_admission,
      anginal_episodes_ge_2_last_24hrs,
      elevated_serum_cardiac_markers,
      treatmentStrategy,
      pami,
      thrombolysis,
      conservative,
      doorToBalloonTime: d2b,
      doorToNeedleTime: d2n,
      thrombolysisAgent,
      drug_tenecteplase,
      drug_stk,
      drug_reteplase,
      drug_uk,
      culpritVessel,
      vessel_lad,
      vessel_rca,
      vessel_lcx,
      vessel_diagonal,
      vessel_lmca,
      vessel_om,
      vessel_pda,
      vessel_ramus,
      postProcTimiFlow,
      death: isDeath,
      reMi: isReMi,
      recurrentIschemia: false,
      stroke: isStroke,
      strokeType,
      majorBleeding: isMajorBleed,
      discharge_aspirin,
      discharge_statin,
      discharge_beta_blocker,
      discharge_clopidogrel,
      discharge_ticagrelor,
      discharge_nitrate,
      discharge_nicorandil,
      discharge_calcium_channel_blocker,
      discharge_prasugrel,
      discharge_ranolazine,
      discharge_trimetazidine,
      discharge_ivabradine,
      // Legacy compatibility
      dischargeDapt: discharge_aspirin && (discharge_clopidogrel || discharge_ticagrelor || discharge_prasugrel),
      dischargeStatin: discharge_statin,
      dischargeBetaBlocker: discharge_beta_blocker,
      dischargeAceiArb: discharge_beta_blocker
    };
  }),

  // --- NSTEMI Cohort (60 Patients) ---
  ...Array.from({ length: 60 }, (_, i) => {
    const id = i + 1;
    const uhid = `CARE-NS-${String(2000 + id).padStart(5, '0')}`;
    const mrNo = `MR-${String(7000 + id).padStart(5, '0')}`;
    const ipNo = `IP-${String(95000 + id).padStart(6, '0')}`;
    const acsNo = `ACS.${String(90 + id).padStart(4, '0')}`;
    const isMale = (id * 19) % 100 < 68; // ~68% Male
    const phone = `+91 97${String((id * 84931) % 90000000 + 10000000).slice(0, 8)}`;
    const primaryConsultant = (id % 2 === 0 ? 'Dr. K. Sridhar (Cardiologist)' : 'Dr. M. Sharma');
    const age = 41 + ((id * 9 + 7) % 45); // Range: 41 - 85, mean ~63
    const month = String(((id * 4) % 12) + 1).padStart(2, '0');
    const day = String(((id * 6) % 28) + 1).padStart(2, '0');
    const admissionDate = `2025-${month}-${day}`;

    // Presentation (All 4 Form Options)
    let presentation = 'Typical angina';
    let typical_angina = false;
    let atypical_chest_pain = false;
    let breathlessness = false;
    let syncope_presyncope = false;

    if (id % 7 === 0) {
      presentation = 'Typical angina, Breathlessness';
      typical_angina = true;
      breathlessness = true;
    } else {
      const presRand = (id * 29) % 100;
      if (presRand < 58) { presentation = 'Typical angina'; typical_angina = true; }
      else if (presRand < 80) { presentation = 'Atypical chest pain'; atypical_chest_pain = true; }
      else if (presRand < 94) { presentation = 'Breathlessness'; breathlessness = true; }
      else { presentation = 'Syncope/ Pre-syncope'; syncope_presyncope = true; }
    }

    // Comorbidities / Background (All 9 Form Options)
    const htn = (id * 13) % 100 < 68; // ~68.3%
    const dm = (id * 17) % 100 < 52; // ~51.7%
    const smoking = (id * 23) % 100 < 37; // ~36.7%
    const renalFailure = (id * 31) % 100 < 17; // ~16.7%
    const copd = (id * 37) % 100 < 9; // ~8.3%
    const cva = (id * 43) % 100 < 6; // ~5.0%
    const priorAcs = (id * 47) % 100 < 24; // ~23.3%
    const priorPtca = (id * 53) % 100 < 14; // ~13.3%
    const priorCabg = (id * 59) % 100 < 7; // ~6.7%

    // TIMI Risk Score (0-7 for NSTEMI - Discrete Distribution)
    const nstemiBellCurve = [
      0, 0,
      1, 1, 1, 1, 1, 1,
      2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2,
      3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3,
      4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4,
      5, 5, 5, 5, 5,
      6, 6, 6,
      7
    ];
    const timi = nstemiBellCurve[i] !== undefined ? nstemiBellCurve[i] : 3;

    // TIMI Risk Factors (All 14 Form Options for NSTEMI)
    const age_gt_75 = age >= 75;
    const age_65_to_74 = age >= 65 && age < 75;
    const history_dm_htn_angina = htn || dm;
    const sbp_lt_100 = timi >= 5 && (id % 4 === 0);
    const heart_rate_gt_100 = timi >= 3 && (id % 3 === 0);
    const killip_class_ii_to_iv = timi >= 5;
    const anterior_mi_or_lbbb = timi >= 4;
    const weight_lt_67kg = id % 5 === 0;
    const reperfusion_gt_4hrs = id % 6 === 0;
    const chd_risk_factors_ge_3 = (htn && dm && smoking);
    const prior_coronary_stenosis_gt_50 = priorPtca || priorCabg;
    const st_deviation_at_admission = timi >= 2;
    const anginal_episodes_ge_2_last_24hrs = id % 3 === 0;
    const elevated_serum_cardiac_markers = true;

    const nstemiTimiRisksSim = [];
    if (age_gt_75) nstemiTimiRisksSim.push('Age > 75 years (+3)');
    if (age_65_to_74) nstemiTimiRisksSim.push('Age 65 to 74 years (+2)');
    if (history_dm_htn_angina) nstemiTimiRisksSim.push('H/o DM/ HTN/ Angina (+1)');
    if (sbp_lt_100) nstemiTimiRisksSim.push('SBP < 100 mmHg (+3)');
    if (heart_rate_gt_100) nstemiTimiRisksSim.push('Heart Rate > 100/ min (+2)');
    if (killip_class_ii_to_iv) nstemiTimiRisksSim.push('Killip Class (+2)');
    if (anterior_mi_or_lbbb) nstemiTimiRisksSim.push('Ant MI/ LBBB (+1)');
    if (weight_lt_67kg) nstemiTimiRisksSim.push('Weight < 67 kg (+1)');
    if (reperfusion_gt_4hrs) nstemiTimiRisksSim.push('Time to reperfusion > 4 hrs (+1)');
    if (chd_risk_factors_ge_3) nstemiTimiRisksSim.push('Presence of at least 3 CHD risk factors (+1)');
    if (prior_coronary_stenosis_gt_50) nstemiTimiRisksSim.push('Prior coronary stenosis of >50% (+1)');
    if (st_deviation_at_admission) nstemiTimiRisksSim.push('Presence of ST deviation at admission (+1)');
    if (anginal_episodes_ge_2_last_24hrs) nstemiTimiRisksSim.push('At least 2 anginal episodes < 24 hrs (+1)');
    if (elevated_serum_cardiac_markers) nstemiTimiRisksSim.push('Elevated serum cardiac markers (+1)');
    const timiRisk = nstemiTimiRisksSim.length > 0 ? nstemiTimiRisksSim.join(', ') : 'None';

    // Treatment Strategy (Early Invasive 63.3%, Selective Invasive 23.3%, Conservative 13.3%)
    let treatmentStrategy = 'Early Invasive';
    let earlyInvasive = false;
    let selectiveInvasive = false;
    let conservative = false;

    const treatRand = (id * 31) % 100;
    if (treatRand < 63) { treatmentStrategy = 'Early Invasive'; earlyInvasive = true; }
    else if (treatRand < 87) { treatmentStrategy = 'Selective Invasive'; selectiveInvasive = true; }
    else { treatmentStrategy = 'Conservative'; conservative = true; }

    // Time to Angiography / Catheterization (hours)
    const timeToCath = treatmentStrategy !== 'Conservative'
      ? (8 + ((id * 5) % 24)) // 8 to 31 hours, mean ~14.2h
      : null;

    // Culprit Vessel(s) (All 8 Form Options)
    let culpritVessel = 'LAD';
    let vessel_lad = false;
    let vessel_rca = false;
    let vessel_lcx = false;
    let vessel_diagonal = false;
    let vessel_lmca = false;
    let vessel_om = false;
    let vessel_pda = false;
    let vessel_ramus = false;

    if (id === 12) {
      culpritVessel = 'LAD, RCA, LCX';
      vessel_lad = true;
      vessel_rca = true;
      vessel_lcx = true;
    } else if (id % 6 === 0) {
      culpritVessel = 'LAD, LCX';
      vessel_lad = true;
      vessel_lcx = true;
    } else {
      const vesselRand = (id * 47) % 100;
      if (vesselRand < 40) { culpritVessel = 'LAD'; vessel_lad = true; }
      else if (vesselRand < 64) { culpritVessel = 'RCA'; vessel_rca = true; }
      else if (vesselRand < 84) { culpritVessel = 'LCX'; vessel_lcx = true; }
      else if (vesselRand < 89) { culpritVessel = 'Diagonal'; vessel_diagonal = true; }
      else if (vesselRand < 94) { culpritVessel = 'LMCA'; vessel_lmca = true; }
      else if (vesselRand < 97) { culpritVessel = 'OM'; vessel_om = true; }
      else if (vesselRand < 99) { culpritVessel = 'PDA'; vessel_pda = true; }
      else { culpritVessel = 'Ramus'; vessel_ramus = true; }
    }

    // Procedural TIMI Flow (Grade 3 in 91.7%, Grade 2 in 6.7%, Grade 0/1 in 1.7%)
    const timiFlowRand = (id * 59) % 100;
    const postProcTimiFlow = timiFlowRand < 92 ? 3 : (timiFlowRand < 98 ? 2 : 1);

    // MACE / In-Hospital Outcomes
    const isDeath = [14, 42].includes(id); // 2 deaths = 3.33%
    const isRecurrentIschemia = [9, 27, 38, 54].includes(id); // 4 = 6.67%
    const isStroke = id === 21; // 1 stroke = 1.67%
    const strokeType = isStroke ? 'Thrombotic' : null;
    const isMajorBleed = id === 33; // 1 bleed = 1.67%

    // Discharge Medications (All 12 Form Options)
    const discharge_aspirin = !isDeath && ![11, 48].includes(id); // 58/60 = 96.7%
    const discharge_statin = !isDeath && ![8, 35, 51].includes(id); // 57/60 = 95.0%
    const discharge_beta_blocker = !isDeath && ![5, 23, 44, 58].includes(id); // 56/60 = 93.3%
    const discharge_clopidogrel = !isDeath && ((id * 7) % 100 < 70); // ~68.3%
    const discharge_ticagrelor = !isDeath && ((id * 13) % 100 < 24); // ~23.3%
    const discharge_nitrate = !isDeath && ((id * 19) % 100 < 42); // ~40.0%
    const discharge_nicorandil = !isDeath && ((id * 23) % 100 < 27); // ~26.7%
    const discharge_calcium_channel_blocker = !isDeath && ((id * 29) % 100 < 23); // ~21.7%
    const discharge_prasugrel = !isDeath && ((id * 17) % 100 < 8); // ~6.7%
    const discharge_ranolazine = !isDeath && ((id * 31) % 100 < 17); // ~15.0%
    const discharge_trimetazidine = !isDeath && ((id * 37) % 100 < 13); // ~11.7%
    const discharge_ivabradine = !isDeath && ((id * 43) % 100 < 10); // ~8.3%

    const admD = new Date(admissionDate);
    admD.setDate(admD.getDate() + (isDeath ? 1 : 3));
    const dischargeDate = admD.toISOString().slice(0, 10);

    return {
      id: `NSTEMI-${id}`,
      nstemiId: id,
      uhid,
      mrNo,
      ipNo,
      acsNo,
      patientName: `Patient NS-${2000 + id}`,
      primaryConsultant,
      phone,
      registryType: 'NSTEMI',
      gender: isMale ? 'Male' : 'Female',
      age,
      admissionDate,
      dischargeDate,
      presentation,
      typical_angina,
      atypical_chest_pain,
      breathlessness,
      syncope_presyncope,
      hypertension: htn,
      diabetes: dm,
      smoking,
      renalFailure,
      copd,
      cva,
      priorAcs,
      priorPtca,
      priorCabg,
      timiScore: timi,
      timiRisk,
      age_gt_75,
      age_65_to_74,
      history_dm_htn_angina,
      sbp_lt_100,
      heart_rate_gt_100,
      killip_class_ii_to_iv,
      anterior_mi_or_lbbb,
      weight_lt_67kg,
      reperfusion_gt_4hrs,
      chd_risk_factors_ge_3,
      prior_coronary_stenosis_gt_50,
      st_deviation_at_admission,
      anginal_episodes_ge_2_last_24hrs,
      elevated_serum_cardiac_markers,
      treatmentStrategy,
      earlyInvasive,
      selectiveInvasive,
      conservative,
      doorToBalloonTime: null,
      doorToNeedleTime: null,
      timeToCathHours: timeToCath,
      thrombolysisAgent: null,
      culpritVessel,
      vessel_lad,
      vessel_rca,
      vessel_lcx,
      vessel_diagonal,
      vessel_lmca,
      vessel_om,
      vessel_pda,
      vessel_ramus,
      postProcTimiFlow,
      death: isDeath,
      reMi: false,
      recurrentIschemia: isRecurrentIschemia,
      stroke: isStroke,
      strokeType,
      majorBleeding: isMajorBleed,
      discharge_aspirin,
      discharge_statin,
      discharge_beta_blocker,
      discharge_clopidogrel,
      discharge_ticagrelor,
      discharge_nitrate,
      discharge_nicorandil,
      discharge_calcium_channel_blocker,
      discharge_prasugrel,
      discharge_ranolazine,
      discharge_trimetazidine,
      discharge_ivabradine,
      // Legacy compatibility
      dischargeDapt: discharge_aspirin && (discharge_clopidogrel || discharge_ticagrelor || discharge_prasugrel),
      dischargeStatin: discharge_statin,
      dischargeBetaBlocker: discharge_beta_blocker,
      dischargeAceiArb: discharge_beta_blocker
    };
  })
];

/**
 * Filter ACS Cohort by registry type and global filters
 */
export function filterAcsCohort(cohort, filters = {}, registryType = 'ALL') {
  if (!Array.isArray(cohort)) return [];

  return cohort.filter(patient => {
    // Registry Type
    if (registryType !== 'ALL' && patient.registryType !== registryType) {
      return false;
    }

    // Date Range Filter
    if (filters.startDate && patient.admissionDate < filters.startDate) return false;
    if (filters.endDate && patient.admissionDate > filters.endDate) return false;

    // Gender Filter
    if (filters.gender && filters.gender !== 'ALL' && patient.gender !== filters.gender) {
      return false;
    }

    // Search query (UHID or Patient Name)
    if (filters.search) {
      const q = filters.search.toLowerCase().trim();
      const matchUhid = patient.uhid?.toLowerCase().includes(q);
      const matchName = patient.patientName?.toLowerCase().includes(q);
      if (!matchUhid && !matchName) return false;
    }

    // Treatment Strategy Filter
    if (filters.strategy && filters.strategy !== 'ALL' && patient.treatmentStrategy !== filters.strategy) {
      return false;
    }

    // TIMI Risk Score Bucket Filter
    if (filters.timiTier && filters.timiTier !== 'ALL') {
      const score = patient.timiScore || 0;
      if (filters.timiTier === 'LOW' && score > 4) return false;
      if (filters.timiTier === 'INTERMEDIATE' && (score < 5 || score > 7)) return false;
      if (filters.timiTier === 'HIGH' && score < 8) return false;
    }

    return true;
  });
}

/**
 * Compute Comprehensive Analytical Aggregations & Benchmarks for ACS Cohort
 * Includes all form options for Presentation, Background Comorbidities, Vessels,
 * Thrombolytic Drugs, and Discharge Medications.
 */
export function computeAcsAnalytics(cohort = [], registryType = 'STEMI') {
  const total = cohort.length;

  if (total === 0) {
    return {
      kpi: {
        totalRecords: 0,
        stemiCount: 0,
        nstemiCount: 0,
        meanAge: 0,
        males: 0,
        females: 0,
        malePercent: 0,
        femalePercent: 0,
        totalDeaths: 0,
        mortalityRate: 0,
        avgTimiScore: 0,
        meanDoorToBalloon: 0,
        d2bComplianceRate: 0,
        meanDoorToNeedle: 0,
        d2nComplianceRate: 0,
        meanTimeToCath: 0,
        cathComplianceRate: 0,
        proceduralSuccessRate: 0
      },
      ageDistribution: [],
      comorbidities: [],
      presentation: [],
      timiScoreDistribution: [],
      treatmentStrategy: [],
      thrombolysisAgents: [],
      vessels: [],
      proceduralSuccess: [],
      gdmtMeds: [],
      mace: []
    };
  }

  // --- Row 1: Top-Level KPI Computations ---
  const stemiCount = cohort.filter(p => p.registryType === 'STEMI').length;
  const nstemiCount = cohort.filter(p => p.registryType === 'NSTEMI').length;

  const totalAge = cohort.reduce((acc, p) => acc + (p.age || 0), 0);
  const meanAge = Number((totalAge / total).toFixed(1));

  const males = cohort.filter(p => p.gender === 'Male').length;
  const females = total - males;
  const malePercent = Number(((males / total) * 100).toFixed(1));
  const femalePercent = Number(((females / total) * 100).toFixed(1));

  const deaths = cohort.filter(p => p.death).length;
  const mortalityRate = Number(((deaths / total) * 100).toFixed(1));

  const totalTimi = cohort.reduce((acc, p) => acc + (p.timiScore || 0), 0);
  const avgTimiScore = Number((totalTimi / total).toFixed(1));

  // Door to Balloon (STEMI Primary PCI)
  const pamiCohort = cohort.filter(p => p.doorToBalloonTime !== null && p.doorToBalloonTime !== undefined);
  const totalD2b = pamiCohort.reduce((acc, p) => acc + Number(p.doorToBalloonTime || 0), 0);
  const meanDoorToBalloon = pamiCohort.length > 0 ? Number((totalD2b / pamiCohort.length).toFixed(1)) : 0;
  const d2bCompliant = pamiCohort.filter(p => p.doorToBalloonTime <= 90).length;
  const d2bComplianceRate = pamiCohort.length > 0 ? Number(((d2bCompliant / pamiCohort.length) * 100).toFixed(1)) : 0;

  // Door to Needle (STEMI Thrombolysis)
  const tltCohortTiming = cohort.filter(p => p.doorToNeedleTime !== null && p.doorToNeedleTime !== undefined);
  const totalD2n = tltCohortTiming.reduce((acc, p) => acc + Number(p.doorToNeedleTime || 0), 0);
  const meanDoorToNeedle = tltCohortTiming.length > 0 ? Number((totalD2n / tltCohortTiming.length).toFixed(1)) : 0;
  const d2nCompliant = tltCohortTiming.filter(p => p.doorToNeedleTime <= 30).length;
  const d2nComplianceRate = tltCohortTiming.length > 0 ? Number(((d2nCompliant / tltCohortTiming.length) * 100).toFixed(1)) : 0;

  // Time to Cath (NSTEMI)
  const cathCohort = cohort.filter(p => p.timeToCathHours !== null && p.timeToCathHours !== undefined);
  const totalCathTime = cathCohort.reduce((acc, p) => acc + Number(p.timeToCathHours || 0), 0);
  const meanTimeToCath = cathCohort.length > 0 ? Number((totalCathTime / cathCohort.length).toFixed(1)) : 0;
  const cathCompliant = cathCohort.filter(p => p.timeToCathHours < 24).length;
  const cathComplianceRate = cathCohort.length > 0 ? Number(((cathCompliant / cathCohort.length) * 100).toFixed(1)) : 0;

  // Procedural Success (TIMI Flow Grade 3)
  const timi3Success = cohort.filter(p => p.postProcTimiFlow === 3).length;
  const proceduralSuccessRate = Number(((timi3Success / total) * 100).toFixed(1));

  // Detect whether to use NSTEMI (Orange & Blue) or STEMI (Red & Blue)
  const isNstemi = registryType === 'NSTEMI' || cohort.some(p => p.registryType === 'NSTEMI' && !cohort.some(x => x.registryType === 'STEMI'));

  // --- Row 2: Demographics, Comorbidities & Clinical Presentation ---

  // 1. Age Spectrum (Records-Based Distribution) - Blue Palette
  const ageBuckets = [
    { bracket: '< 45y', min: 0, max: 44, fill: '#60a5fa' },
    { bracket: '45-54y', min: 45, max: 54, fill: '#3b82f6' },
    { bracket: '55-64y', min: 55, max: 64, fill: '#2563eb' },
    { bracket: '65-74y', min: 65, max: 74, fill: '#1d4ed8' },
    { bracket: '>= 75y', min: 75, max: 120, fill: '#1e40af' }
  ];

  const ageDistribution = ageBuckets.map(b => {
    const count = cohort.filter(p => p.age >= b.min && p.age <= b.max).length;
    return {
      bracket: b.bracket,
      count,
      percent: Number(((count / total) * 100).toFixed(1)),
      fill: b.fill
    };
  });

  // 2. Background Comorbidities (All 9 Form Options) - Blue Palette
  const hasHtn = p => p.hypertension === true || p.hypertension === 'Yes' || p.hypertension === 1;
  const hasDm = p => p.diabetes === true || p.diabetes === 'Yes' || p.diabetes === 1;
  const hasSmoke = p => p.smoking === true || p.smoking === 'Yes' || p.smoking === 1;
  const hasRf = p => p.renalFailure === true || p.renal_failure === 'Yes' || p.renal_failure === true;
  const hasCopd = p => p.copd === true || p.copd === 'Yes';
  const hasCva = p => p.cva === true || p.cva === 'Yes';
  const hasPriorAcs = p => p.priorAcs === true || p.prior_acs === 'Yes' || p.prior_acs === true;
  const hasPriorPtca = p => p.priorPtca === true || p.prior_ptca === 'Yes' || p.prior_ptca === true;
  const hasPriorCabg = p => p.priorCabg === true || p.prior_cabg === 'Yes' || p.prior_cabg === true;

  const comorbiditiesList = [
    { name: 'Hypertension', count: cohort.filter(hasHtn).length, fill: '#1d4ed8' },
    { name: 'Diabetes', count: cohort.filter(hasDm).length, fill: '#2563eb' },
    { name: 'Smoking', count: cohort.filter(hasSmoke).length, fill: '#3b82f6' },
    { name: 'Prior ACS', count: cohort.filter(hasPriorAcs).length, fill: '#0284c7' },
    { name: 'Prior PTCA', count: cohort.filter(hasPriorPtca).length, fill: '#0369a1' },
    { name: 'Renal Failure', count: cohort.filter(hasRf).length, fill: '#38bdf8' },
    { name: 'COPD', count: cohort.filter(hasCopd).length, fill: '#60a5fa' },
    { name: 'Prior CABG', count: cohort.filter(hasPriorCabg).length, fill: '#1e40af' },
    { name: 'CVA', count: cohort.filter(hasCva).length, fill: '#1e3a8a' }
  ];

  const comorbidities = comorbiditiesList.map(item => ({
    ...item,
    percent: Number(((item.count / total) * 100).toFixed(1))
  }));

  // Helper to match string/array/comma-separated multi-options
  const matchOption = (val, target) => {
    if (!val) return false;
    if (Array.isArray(val)) {
      return val.some(item => String(item).trim().toLowerCase() === target.toLowerCase());
    }
    if (typeof val === 'string') {
      return val.split(',').some(item => item.trim().toLowerCase() === target.toLowerCase());
    }
    return false;
  };

  // 3. Presentation in Clinical Information (All 4 Form Options) - Blue Palette
  const isTypical = p => p.typical_angina === true || p.typical_angina === 'Yes' || matchOption(p.presentation, 'Typical angina') || matchOption(p.presentations, 'Typical angina');
  const isAtypical = p => p.atypical_chest_pain === true || p.atypical_chest_pain === 'Yes' || matchOption(p.presentation, 'Atypical chest pain') || matchOption(p.presentations, 'Atypical chest pain');
  const isBreathless = p => p.breathlessness === true || p.breathlessness === 'Yes' || matchOption(p.presentation, 'Breathlessness') || matchOption(p.presentations, 'Breathlessness');
  const isSyncope = p => p.syncope_presyncope === true || p.syncope_presyncope === 'Yes' || matchOption(p.presentation, 'Syncope/ Pre-syncope') || matchOption(p.presentations, 'Syncope/ Pre-syncope');

  const typicalCount = cohort.filter(isTypical).length;
  const atypicalCount = cohort.filter(isAtypical).length;
  const breathCount = cohort.filter(isBreathless).length;
  const syncopeCount = cohort.filter(isSyncope).length;

  const presentation = [
    { name: 'Typical angina', count: typicalCount, percent: Number(((typicalCount / total) * 100).toFixed(1)), fill: '#1d4ed8' },
    { name: 'Atypical chest pain', count: atypicalCount, percent: Number(((atypicalCount / total) * 100).toFixed(1)), fill: '#3b82f6' },
    { name: 'Breathlessness', count: breathCount, percent: Number(((breathCount / total) * 100).toFixed(1)), fill: '#0284c7' },
    { name: 'Syncope/ Pre-syncope', count: syncopeCount, percent: Number(((syncopeCount / total) * 100).toFixed(1)), fill: '#60a5fa' }
  ];

  // 4. TIMI Risk Score Distribution (2 Points as 1 Unit: STEMI Max 16 pts, NSTEMI Max 21 pts) - Blue Palette
  const stemiBins = [
    { label: '0-1', min: 0, max: 1, tier: 'Low Risk', fill: '#93c5fd' },
    { label: '2-3', min: 2, max: 3, tier: 'Low Risk', fill: '#60a5fa' },
    { label: '4-5', min: 4, max: 5, tier: 'Intermediate Risk', fill: '#3b82f6' },
    { label: '6-7', min: 6, max: 7, tier: 'Intermediate Risk', fill: '#2563eb' },
    { label: '8-9', min: 8, max: 9, tier: 'High Risk', fill: '#1d4ed8' },
    { label: '10-11', min: 10, max: 11, tier: 'High Risk', fill: '#1e40af' },
    { label: '12-13', min: 12, max: 13, tier: 'High Risk', fill: '#1e3a8a' },
    { label: '14-16', min: 14, max: 16, tier: 'High Risk', fill: '#172554' }
  ];

  const nstemiBins = [
    { label: '0-1', min: 0, max: 1, tier: 'Low Risk', fill: '#bfdbfe' },
    { label: '2-3', min: 2, max: 3, tier: 'Low Risk', fill: '#93c5fd' },
    { label: '4-5', min: 4, max: 5, tier: 'Low Risk', fill: '#60a5fa' },
    { label: '6-7', min: 6, max: 7, tier: 'Intermediate Risk', fill: '#38bdf8' },
    { label: '8-9', min: 8, max: 9, tier: 'Intermediate Risk', fill: '#0284c7' },
    { label: '10-11', min: 10, max: 11, tier: 'Intermediate Risk', fill: '#0369a1' },
    { label: '12-13', min: 12, max: 13, tier: 'High Risk', fill: '#2563eb' },
    { label: '14-15', min: 14, max: 15, tier: 'High Risk', fill: '#1d4ed8' },
    { label: '16-17', min: 16, max: 17, tier: 'High Risk', fill: '#1e40af' },
    { label: '18-19', min: 18, max: 19, tier: 'High Risk', fill: '#1e3a8a' },
    { label: '20-21', min: 20, max: 21, tier: 'High Risk', fill: '#172554' }
  ];

  const binsConfig = isNstemi ? nstemiBins : stemiBins;

  const timiScoreDistribution = binsConfig.map(bin => {
    const count = cohort.filter(p => {
      const score = Number(p.timiScore ?? p.timi_total_score ?? 0);
      return score >= bin.min && score <= bin.max;
    }).length;
    const percent = Number(((count / total) * 100).toFixed(1));

    return {
      score: bin.label,
      label: bin.label,
      min: bin.min,
      max: bin.max,
      count,
      percent,
      riskTier: bin.tier,
      fill: bin.fill
    };
  });

  // 5. Treatment Strategy - Blue Palette
  const strategyCounts = cohort.reduce((acc, p) => {
    const s = p.treatmentStrategy || 'Conservative';
    acc[s] = (acc[s] || 0) + 1;
    return acc;
  }, {});

  const treatmentStrategy = Object.entries(strategyCounts).map(([name, count]) => {
    let fill = '#2563eb';
    if (name === 'PAMI' || name === 'Early Invasive' || name === 'Invasive') fill = '#1d4ed8';
    else if (name === 'Thrombolysis' || name === 'Selective Invasive') fill = '#3b82f6';
    else fill = '#60a5fa';

    return {
      name,
      count,
      percent: Number(((count / total) * 100).toFixed(1)),
      fill
    };
  });

  // 6. Thrombolysis Details -> Drug (All 4 Form Options) - Blue Palette
  const tltCohort = cohort.filter(p => p.thrombolysisAgent || p.drug_stk || p.drug_tenecteplase || p.drug_uk || p.drug_reteplase);
  const tltTotal = tltCohort.length;

  const getTltAgentCount = (agentKey, formKey) => {
    return cohort.filter(p =>
      p[formKey] === true ||
      p[formKey] === 'Yes' ||
      matchOption(p.thrombolysisAgent, agentKey) ||
      matchOption(p.thrombolyticAgent, agentKey) ||
      matchOption(p.thrombolysisAgents, agentKey) ||
      matchOption(p.thrombolyticAgents, agentKey) ||
      (agentKey === 'STK' && (matchOption(p.thrombolysisAgent, 'Streptokinase') || matchOption(p.thrombolyticAgent, 'Streptokinase'))) ||
      (agentKey === 'UK' && (matchOption(p.thrombolysisAgent, 'Urokinase') || matchOption(p.thrombolyticAgent, 'Urokinase')))
    ).length;
  };

  const tnkCount = getTltAgentCount('Tenecteplase', 'drug_tenecteplase');
  const stkCount = getTltAgentCount('STK', 'drug_stk') || getTltAgentCount('Streptokinase', 'drug_stk');
  const rpaCount = getTltAgentCount('Reteplase', 'drug_reteplase');
  const ukCount = getTltAgentCount('UK', 'drug_uk') || getTltAgentCount('Urokinase', 'drug_uk');

  const thrombolysisAgents = [
    { name: 'Tenecteplase', count: tnkCount, percent: tltTotal ? Number(((tnkCount / tltTotal) * 100).toFixed(1)) : 0, fill: '#1d4ed8' },
    { name: 'STK', count: stkCount, percent: tltTotal ? Number(((stkCount / tltTotal) * 100).toFixed(1)) : 0, fill: '#2563eb' },
    { name: 'Reteplase', count: rpaCount, percent: tltTotal ? Number(((rpaCount / tltTotal) * 100).toFixed(1)) : 0, fill: '#3b82f6' },
    { name: 'UK', count: ukCount, percent: tltTotal ? Number(((ukCount / tltTotal) * 100).toFixed(1)) : 0, fill: '#60a5fa' }
  ];

  // 7. Culprit Vessel Breakdown (All 8 Form Options) - Blue Palette
  const allVesselKeys = [
    { key: 'LAD', formKey: 'vessel_lad', label: 'LAD', color: '#1d4ed8' },
    { key: 'RCA', formKey: 'vessel_rca', label: 'RCA', color: '#2563eb' },
    { key: 'LCX', formKey: 'vessel_lcx', label: 'LCX', color: '#3b82f6' },
    { key: 'Diagonal', formKey: 'vessel_diagonal', label: 'Diagonal', color: '#60a5fa' },
    { key: 'LMCA', formKey: 'vessel_lmca', label: 'LMCA', color: '#0284c7' },
    { key: 'OM', formKey: 'vessel_om', label: 'OM', color: '#0369a1' },
    { key: 'PDA', formKey: 'vessel_pda', label: 'PDA', color: '#38bdf8' },
    { key: 'Ramus', formKey: 'vessel_ramus', label: 'Ramus', color: '#93c5fd' }
  ];

  const vessels = allVesselKeys.map(v => {
    const count = cohort.filter(p =>
      p[v.formKey] === true ||
      p[v.formKey] === 'Yes' ||
      matchOption(p.culpritVessels, v.key) ||
      matchOption(p.culpritVessel, v.key)
    ).length;
    return {
      name: v.label,
      count,
      percent: Number(((count / total) * 100).toFixed(1)),
      fill: v.color
    };
  });

  // 8. Procedural Success (TIMI Flow Grade) - Blue Palette
  const timi3 = cohort.filter(p => p.postProcTimiFlow === 3).length;
  const timi2 = cohort.filter(p => p.postProcTimiFlow === 2).length;
  const timi01 = cohort.filter(p => p.postProcTimiFlow !== null && p.postProcTimiFlow !== undefined && p.postProcTimiFlow < 2).length;

  const proceduralSuccess = [
    { name: 'TIMI Flow Grade 3', count: timi3, percent: Number(((timi3 / total) * 100).toFixed(1)), fill: '#1d4ed8' },
    { name: 'TIMI Flow Grade 2', count: timi2, percent: Number(((timi2 / total) * 100).toFixed(1)), fill: '#3b82f6' },
    { name: 'TIMI Flow Grade 0/1', count: timi01, percent: Number(((timi01 / total) * 100).toFixed(1)), fill: '#93c5fd' }
  ];

  // 9. Discharge Medications (All 12 Form Options) - Blue Palette
  const allMedKeys = [
    { drug: 'Aspirin', formKey: 'discharge_aspirin', category: 'Antiplatelet', fill: '#1d4ed8' },
    { drug: 'Statin', formKey: 'discharge_statin', category: 'Lipid Lowering', fill: '#2563eb' },
    { drug: 'Beta-blocker', formKey: 'discharge_beta_blocker', category: 'Hemodynamic', fill: '#3b82f6' },
    { drug: 'Clopidogrel', formKey: 'discharge_clopidogrel', category: 'Antiplatelet (P2Y12)', fill: '#0284c7' },
    { drug: 'Ticagrelor', formKey: 'discharge_ticagrelor', category: 'Antiplatelet (P2Y12)', fill: '#1e40af' },
    { drug: 'Nitrate', formKey: 'discharge_nitrate', category: 'Anti-anginal', fill: '#0369a1' },
    { drug: 'Nicorandil', formKey: 'discharge_nicorandil', category: 'Anti-anginal', fill: '#38bdf8' },
    { drug: 'Calcium-channel blocker', formKey: 'discharge_calcium_channel_blocker', category: 'Hemodynamic', fill: '#60a5fa' },
    { drug: 'Prasugrel', formKey: 'discharge_prasugrel', category: 'Antiplatelet (P2Y12)', fill: '#1e3a8a' },
    { drug: 'Ranozolidine', formKey: 'discharge_ranolazine', category: 'Anti-anginal', fill: '#93c5fd' },
    { drug: 'Trimetazidine', formKey: 'discharge_trimetazidine', category: 'Metabolic Anti-anginal', fill: '#2563eb' },
    { drug: 'Ivabradine', formKey: 'discharge_ivabradine', category: 'If Channel Inhibitor', fill: '#3b82f6' }
  ];

  const gdmtMeds = allMedKeys.map(m => {
    const prescribedCount = cohort.filter(p =>
      p[m.formKey] === true ||
      p[m.formKey] === 'Yes' ||
      (m.drug === 'Aspirin' && p.discharge_aspirin) ||
      (m.drug === 'Statin' && (p.discharge_statin || p.dischargeStatin)) ||
      (m.drug === 'Beta-blocker' && (p.discharge_beta_blocker || p.dischargeBetaBlocker))
    ).length;
    const prescribedRate = Number(((prescribedCount / total) * 100).toFixed(1));
    return {
      drug: m.drug,
      category: m.category,
      prescribedCount,
      omittedCount: total - prescribedCount,
      prescribedRate,
      omittedRate: Number((100 - prescribedRate).toFixed(1)),
      fill: m.fill
    };
  });

  // 10. MACE / Clinical Outcomes
  const reMiCount = cohort.filter(p => p.reMi).length;
  const strokeCount = cohort.filter(p => p.stroke).length;
  const bleedCount = cohort.filter(p => p.majorBleeding).length;
  const ischemCount = cohort.filter(p => p.recurrentIschemia).length;

  const mace = [
    {
      metric: 'In-Hospital Mortality',
      count: deaths,
      percent: mortalityRate,
      badgeColor: deaths > 0 ? 'bg-rose-50 text-rose-700 border-rose-200' : 'bg-emerald-50 text-emerald-700 border-emerald-200',
      details: `${deaths} of ${total} records`
    },
    {
      metric: isNstemi ? 'Recurrent Ischemia' : 'Target Vessel Re-MI',
      count: isNstemi ? ischemCount : reMiCount,
      percent: Number((((isNstemi ? ischemCount : reMiCount) / total) * 100).toFixed(1)),
      badgeColor: (isNstemi ? ischemCount : reMiCount) > 0 ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-emerald-50 text-emerald-700 border-emerald-200',
      details: isNstemi ? 'Refractory post-infarct angina' : 'Acute re-infarction in target territory'
    },
    {
      metric: 'Non-Fatal Stroke / CVA',
      count: strokeCount,
      percent: Number(((strokeCount / total) * 100).toFixed(1)),
      badgeColor: strokeCount > 0 ? 'bg-indigo-50 text-indigo-700 border-indigo-200' : 'bg-emerald-50 text-emerald-700 border-emerald-200',
      details: 'Cerebrovascular ischemic / embolic events'
    },
    {
      metric: 'Major In-Hospital Bleeding',
      count: bleedCount,
      percent: Number(((bleedCount / total) * 100).toFixed(1)),
      badgeColor: bleedCount > 0 ? 'bg-rose-50 text-rose-700 border-rose-200' : 'bg-emerald-50 text-emerald-700 border-emerald-200',
      details: 'BARC 3-5 / GUSTO severe bleeding events'
    }
  ];

  return {
    kpi: {
      totalRecords: total,
      stemiCount,
      nstemiCount,
      meanAge,
      males,
      females,
      malePercent,
      femalePercent,
      totalDeaths: deaths,
      mortalityRate,
      avgTimiScore,
      meanDoorToBalloon,
      d2bComplianceRate,
      meanDoorToNeedle,
      d2nComplianceRate,
      meanTimeToCath,
      cathComplianceRate,
      proceduralSuccessRate
    },
    ageDistribution,
    comorbidities,
    presentation,
    timiScoreDistribution,
    treatmentStrategy,
    thrombolysisAgents,
    vessels,
    proceduralSuccess,
    gdmtMeds,
    mace
  };
}

/**
 * Generate and download Excel audit file for ACS Registry (STEMI and NSTEMI)
 */
export async function generateAcsAuditExcel(cohort, filters = {}, registryType = 'ALL') {
  // If filters provided, ensure active cohort honors filters
  const targetCohort = (filters && Object.keys(filters).length > 0)
    ? filterAcsCohort(cohort, filters)
    : cohort;

  const analytics = computeAcsAnalytics(targetCohort);
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'CARE ACS Registry Intelligence';
  workbook.created = new Date();

  // --- SHEET 1: Executive KPI & Quality Metric Summary ---
  const summarySheet = workbook.addWorksheet('Executive ACS Dashboard');
  summarySheet.views = [{ state: 'frozen', ySplit: 1 }];
  summarySheet.columns = [
    { header: 'Registry Dimension', key: 'dimension', width: 26 },
    { header: 'Clinical Metric', key: 'metric', width: 34 },
    { header: 'Observed Value', key: 'observed', width: 24 },
    { header: 'Guideline Standard', key: 'standard', width: 36 }
  ];

  const sumHeaderRow = summarySheet.getRow(1);
  sumHeaderRow.height = 28;
  sumHeaderRow.eachCell((cell) => {
    cell.font = { name: 'Segoe UI', size: 10, bold: true, color: { argb: 'FFFFFFFF' } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0F766E' } }; // teal-700
    cell.alignment = { vertical: 'middle', horizontal: 'center' };
    cell.border = {
      top: { style: 'thin', color: { argb: 'FFCBD5E1' } },
      left: { style: 'thin', color: { argb: 'FFCBD5E1' } },
      bottom: { style: 'medium', color: { argb: 'FF134E4A' } },
      right: { style: 'thin', color: { argb: 'FFCBD5E1' } }
    };
  });

  const summaryRows = [
    ['Demographics', 'Cohort Total Audited Records', `${analytics.kpi.totalRecords} Records`, '100% Case Enrollment'],
    ['Demographics', 'Mean Patient Age', `${analytics.kpi.meanAge} Years`, 'National Benchmark ~60y'],
    ['Demographics', 'Gender Distribution', `Male: ${analytics.kpi.malePercent}% | Female: ${analytics.kpi.femalePercent}%`, 'ACC-NCDR Standard'],
    ['Clinical Acuity', 'In-Hospital Mortality', `${analytics.kpi.totalDeaths} (${analytics.kpi.mortalityRate}%)`, 'Target < 6.0% in STEMI'],
    ['Clinical Acuity', 'Mean Admission TIMI Risk Score', `${analytics.kpi.avgTimiScore} Points`, 'Risk Stratification Score'],
    ['Reperfusion Timings', 'Mean Door-to-Balloon (D2B) Time', `${analytics.kpi.meanDoorToBalloon} mins (${analytics.kpi.d2bComplianceRate}% compliant)`, 'Guideline Target <= 90 mins'],
    ['Reperfusion Timings', 'Mean Door-to-Needle (D2N) Time', `${analytics.kpi.meanDoorToNeedle} mins (${analytics.kpi.d2nComplianceRate}% compliant)`, 'Guideline Target <= 30 mins'],
    ['Procedural Outcomes', 'Procedural Success (TIMI Flow 3)', `${analytics.kpi.proceduralSuccessRate}%`, 'Target >= 90% Flow Restoration'],
    ['Discharge GDMT', 'Aspirin Therapy', `${analytics.gdmtMeds.find(m => m.drug === 'Aspirin')?.prescribedRate || 95}% Prescribed`, 'Class I Indication (>=90%)'],
    ['Discharge GDMT', 'Statin Therapy', `${analytics.gdmtMeds.find(m => m.drug === 'Statin')?.prescribedRate || 92}% Prescribed`, 'Class I Indication (>=90%)'],
    ['Discharge GDMT', 'Beta-Blocker Therapy', `${analytics.gdmtMeds.find(m => m.drug === 'Beta-blocker')?.prescribedRate || 88}% Prescribed`, 'Class I Indication (>=85%)'],
    ['Discharge GDMT', 'Clopidogrel / P2Y12 Inhibitors', `${analytics.gdmtMeds.find(m => m.drug === 'Clopidogrel')?.prescribedRate || 70}% Prescribed`, 'Dual Antiplatelet Indication']
  ];

  summaryRows.forEach((rowVals, rIdx) => {
    const row = summarySheet.addRow(rowVals);
    row.height = 20;
    const isEven = rIdx % 2 === 0;
    row.eachCell((cell, colNum) => {
      cell.font = { name: 'Segoe UI', size: 9 };
      cell.border = {
        top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        right: { style: 'thin', color: { argb: 'FFE2E8F0' } }
      };
      if (isEven) {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF0FDFA' } }; // light teal-50
      }
      cell.alignment = colNum === 2 ? { vertical: 'middle', horizontal: 'left' } : { vertical: 'middle', horizontal: 'center' };
    });
  });

  // --- SHEET 2: Individual Patient Registry Roster ---
  const patientSheet = workbook.addWorksheet('Patient Cohort Data');
  patientSheet.views = [{ state: 'frozen', ySplit: 1 }];

  patientSheet.columns = [
    { header: 'SI No', key: 'siNo', width: 8 },
    { header: 'MR No', key: 'mrNo', width: 14 },
    { header: 'IP No', key: 'ipNo', width: 14 },
    { header: 'ACS No / Registry No', key: 'acsNo', width: 22 },
    { header: 'Patient ID', key: 'patientId', width: 18 },
    { header: 'Patient Name', key: 'patientName', width: 24 },
    { header: 'Primary Consultant', key: 'primaryConsultant', width: 28 },
    { header: 'Type', key: 'registryType', width: 12 },
    { header: 'Gender', key: 'gender', width: 10 },
    { header: 'Age', key: 'age', width: 8 },
    { header: 'Contact details: Phone', key: 'phone', width: 22 },
    { header: 'Date of Admission', key: 'admissionDate', width: 18 },
    { header: 'Date of Discharge', key: 'dischargeDate', width: 18 },
    { header: 'Presentation', key: 'presentation', width: 28 },
    { header: 'TIMI Score', key: 'timiScore', width: 12 },
    { header: 'TIMI Risk', key: 'timiRisk', width: 16 },
    { header: 'Strategy', key: 'strategy', width: 22 },
    { header: 'D2B (min)', key: 'doorToBalloonTime', width: 12 },
    { header: 'D2N (min)', key: 'doorToNeedleTime', width: 12 },
    { header: 'Comorbidities', key: 'comorbidities', width: 36 },
    { header: 'Medications', key: 'medications', width: 42 },
    { header: 'Thrombolytic Agents', key: 'thrombolysisAgent', width: 28 },
    { header: 'Culprit Vessel', key: 'culpritVessel', width: 22 },
    { header: 'TIMI Flow', key: 'postProcTimiFlow', width: 14 },
    { header: 'Mortality', key: 'mortality', width: 12 },
    { header: 'Target Vessel Re-MI', key: 'reMi', width: 20 },
    { header: 'Non-Fatal Stroke / CVA', key: 'stroke', width: 22 },
    { header: 'Major In-Hospital Bleeding', key: 'majorBleeding', width: 26 }
  ];

  // Style Header Row (Dark Slate / Navy theme)
  const headerRow = patientSheet.getRow(1);
  headerRow.height = 28;
  headerRow.eachCell((cell) => {
    cell.font = { name: 'Segoe UI', size: 10, bold: true, color: { argb: 'FFFFFFFF' } };
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF1E293B' } // slate-800
    };
    cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
    cell.border = {
      top: { style: 'thin', color: { argb: 'FFCBD5E1' } },
      left: { style: 'thin', color: { argb: 'FFCBD5E1' } },
      bottom: { style: 'medium', color: { argb: 'FF0F172A' } },
      right: { style: 'thin', color: { argb: 'FFCBD5E1' } }
    };
  });

  const isYes = (v) => v === true || v === 1 || v === '1' || v === 'Yes' || v === 'yes';

  // Helper to collect all selected options from boolean flags, arrays, and comma-separated strings
  const collectOptions = (flagDefs, ...textOrArraySources) => {
    const set = new Set();
    // 1. Process flag definitions: [[flagValue, label], ...]
    if (Array.isArray(flagDefs)) {
      for (const [flagVal, label] of flagDefs) {
        if (isYes(flagVal)) set.add(label);
      }
    }
    // 2. Process text strings or arrays
    for (const src of textOrArraySources) {
      if (Array.isArray(src)) {
        src.forEach(item => {
          if (item != null) {
            const trimmed = String(item).trim();
            if (trimmed && trimmed !== 'N/A' && trimmed !== 'None' && trimmed !== 'undefined' && trimmed !== 'null') {
              set.add(trimmed);
            }
          }
        });
      } else if (typeof src === 'string') {
        src.split(',').forEach(item => {
          const trimmed = item.trim();
          if (trimmed && trimmed !== 'N/A' && trimmed !== 'None' && trimmed !== 'undefined' && trimmed !== 'null') {
            set.add(trimmed);
          }
        });
      }
    }
    return Array.from(set);
  };

  targetCohort.forEach((p, index) => {
    // 1. SI No: index + 1

    // 2. MR No
    const mrNo = p.mrNo || p.mr_no || p.care_mr_no || (p.uhid ? p.uhid.replace('CARE-', 'MR-') : 'N/A');

    // 3. IP No
    const ipNo = p.ipNo || p.ip_no || p.patient_ip_no || 'N/A';

    // 4. ACS No / Registry No
    const acsNo = p.acsNo || p.acs_no || (p.stemiId ? `ACS.${String(p.stemiId).padStart(4, '0')}` : (p.nstemiId ? `ACS.${String(p.nstemiId).padStart(4, '0')}` : (p.id ? `ACS.${String(p.id).replace(/\D/g, '').padStart(4, '0')}` : 'N/A')));

    // 5. Patient ID
    const patientId = p.uhid || (p.regPatientId ? `PAT-${p.regPatientId}` : (p.reg_patient_id ? `PAT-${p.reg_patient_id}` : (p.id || 'N/A')));

    // 6. Patient Name
    const patientName = p.patientName || p.patient_name || (p.stemiId ? `Patient ST-${p.stemiId}` : (p.nstemiId ? `Patient NS-${p.nstemiId}` : 'Patient'));

    // 7. Primary Consultant
    const primaryConsultant = p.primaryConsultant || p.primary_consultant || 'Dr. K. Sridhar (Cardiologist)';

    // 8. Type
    const typeStr = p.registryType || registryType || 'STEMI';

    // 9. Gender
    const gender = p.gender || 'N/A';

    // 10. Age
    const age = p.age != null && p.age !== '' ? Number(p.age) : 'N/A';

    // 11. Contact details: Phone
    const phone = p.phone || p.phone_no || p.phoneNo || p.contact_phone || 'N/A';

    // 12. Date of Admission & 13. Date of Discharge
    const formatDateVal = (v) => {
      if (!v) return 'N/A';
      try {
        const d = new Date(v);
        if (isNaN(d.getTime())) return String(v);
        return d.toISOString().slice(0, 10);
      } catch {
        return String(v);
      }
    };
    const admissionDate = formatDateVal(p.admissionDate || p.admission_date);
    const dischargeDate = formatDateVal(p.dischargeDate || p.discharge_date);

    // 14. Presentation (show all selected by comma separation)
    const presList = collectOptions(
      [
        [p.typical_angina || p.typicalAngina, 'Typical angina'],
        [p.atypical_chest_pain || p.atypicalChestPain, 'Atypical chest pain'],
        [p.breathlessness, 'Breathlessness'],
        [p.syncope_presyncope || p.syncopePresyncope, 'Syncope/ Pre-syncope']
      ],
      p.presentation,
      p.presentations
    );
    const presentationStr = presList.length > 0 ? presList.join(', ') : 'N/A';

    // 15. TIMI Score
    const timiScoreVal = p.timiScore != null ? p.timiScore : (p.timi_total_score != null ? p.timi_total_score : null);

    // 16. TIMI Risk (show all selected TIMI risk factors by comma separation)
    const timiRisksList = collectOptions(
      [
        [p.age_gt_75, 'Age > 75 years (+3)'],
        [p.age_65_to_74, 'Age 65 to 74 years (+2)'],
        [p.history_dm_htn_angina, 'H/o DM/ HTN/ Angina (+1)'],
        [p.sbp_lt_100, 'SBP < 100 mmHg (+3)'],
        [p.heart_rate_gt_100, 'Heart Rate > 100/ min (+2)'],
        [p.killip_class_ii_to_iv || ['II', 'III', 'IV', 'Class II', 'Class III', 'Class IV'].includes(p.killipClass), 'Killip Class (+2)'],
        [p.anterior_mi_or_lbbb, 'Ant MI/ LBBB (+1)'],
        [p.weight_lt_67kg, 'Weight < 67 kg (+1)'],
        [p.reperfusion_gt_4hrs, 'Time to reperfusion > 4 hrs (+1)'],
        [p.chd_risk_factors_ge_3, 'Presence of at least 3 CHD risk factors (+1)'],
        [p.prior_coronary_stenosis_gt_50, 'Prior coronary stenosis of >50% (+1)'],
        [p.st_deviation_at_admission, 'Presence of ST deviation at admission (+1)'],
        [p.anginal_episodes_ge_2_last_24hrs, 'At least 2 anginal episodes < 24 hrs (+1)'],
        [p.elevated_serum_cardiac_markers, 'Elevated serum cardiac markers (+1)']
      ],
      p.timiRisk,
      p.timiRisks,
      p.timiRiskList,
      p.timi_risk_factors,
      p.timiRiskFactors
    );
    const timiRiskStr = timiRisksList.length > 0 ? timiRisksList.join(', ') : 'None';

    // 17. Strategy (show all selected by comma separation)
    const stratList = collectOptions(
      [
        [p.pami, 'PAMI'],
        [p.thrombolysis, 'Thrombolysis'],
        [p.conservative, 'Conservative'],
        [p.earlyInvasive || p.early_invasive, 'Early Invasive'],
        [p.selectiveInvasive || p.selective_invasive, 'Selective Invasive']
      ],
      p.treatmentStrategy,
      p.strategy,
      p.strategies
    );
    if (stratList.length === 0) {
      stratList.push(String(typeStr).toUpperCase().includes('NSTEMI') ? 'Early Invasive' : 'Conservative');
    }
    const strategyStr = stratList.join(', ');

    // 18. D2B (min) & 19. D2N (min)
    const doorToBalloonTime = p.doorToBalloonTime != null ? Number(p.doorToBalloonTime) : (p.door_to_balloon_time != null ? Number(p.door_to_balloon_time) : 'N/A');
    const doorToNeedleTime = p.doorToNeedleTime != null ? Number(p.doorToNeedleTime) : (p.door_to_needle_time != null ? Number(p.door_to_needle_time) : 'N/A');

    // 20. Comorbidities (show all selected by comma separation)
    const comorbList = collectOptions(
      [
        [p.hypertension, 'Hypertension'],
        [p.diabetes, 'Diabetes'],
        [p.smoking, 'Smoking'],
        [p.renalFailure || p.renal_failure, 'Renal Failure'],
        [p.copd, 'COPD'],
        [p.cva, 'CVA'],
        [p.priorAcs || p.prior_acs, 'Prior ACS'],
        [p.priorPtca || p.prior_ptca, 'Prior PTCA'],
        [p.priorCabg || p.prior_cabg, 'Prior CABG']
      ],
      p.other_background,
      p.other_comorbidities,
      p.comorbidities,
      p.comorbidity
    );
    const comorbiditiesStr = comorbList.length > 0 ? comorbList.join(', ') : 'None';

    // 21. Medications (show all selected by comma separation)
    const medList = collectOptions(
      [
        [p.discharge_aspirin || p.aspirin, 'Aspirin'],
        [p.discharge_statin || p.statin, 'Statin'],
        [p.discharge_beta_blocker || p.beta_blocker, 'Beta-blocker'],
        [p.discharge_clopidogrel || p.clopidogrel, 'Clopidogrel'],
        [p.discharge_ticagrelor || p.ticagrelor, 'Ticagrelor'],
        [p.discharge_prasugrel || p.prasugrel, 'Prasugrel'],
        [p.discharge_nitrate || p.nitrate, 'Nitrates'],
        [p.discharge_nicorandil || p.nicorandil, 'Nicorandil'],
        [p.discharge_calcium_channel_blocker || p.calcium_channel_blocker, 'CCB'],
        [p.discharge_ranolazine || p.ranolazine, 'Ranolazine'],
        [p.discharge_trimetazidine || p.trimetazidine, 'Trimetazidine'],
        [p.discharge_ivabradine || p.ivabradine, 'Ivabradine']
      ],
      p.discharge_other_medication,
      p.other_medications,
      p.medications,
      p.medication
    );
    const medicationsStr = medList.length > 0 ? medList.join(', ') : 'None';

    // 22. Thrombolytic Agents (show all selected by comma separation e.g. Tenecteplase, STK, Reteplase)
    const lyticList = collectOptions(
      [
        [p.drug_tenecteplase || p.tenecteplase, 'Tenecteplase'],
        [p.drug_stk || p.stk || p.streptokinase, 'STK'],
        [p.drug_reteplase || p.reteplase, 'Reteplase'],
        [p.drug_uk || p.uk || p.urokinase, 'UK']
      ],
      p.thrombolysisAgent,
      p.thrombolysis_agent,
      p.thrombolyticAgent,
      p.thrombolytic_agent,
      p.thrombolysisAgents,
      p.thrombolyticAgents,
      p.thrombolytic_agents
    );
    const lyticStr = lyticList.length > 0 ? lyticList.join(', ') : 'N/A';

    // 23. Culprit Vessel (show all selected by comma separation e.g. LAD, RCA, LCX)
    const vesselList = collectOptions(
      [
        [p.vessel_lad || p.lad, 'LAD'],
        [p.vessel_rca || p.rca, 'RCA'],
        [p.vessel_lcx || p.lcx, 'LCX'],
        [p.vessel_diagonal || p.diagonal, 'Diagonal'],
        [p.vessel_lmca || p.lmca, 'LMCA'],
        [p.vessel_om || p.om, 'OM'],
        [p.vessel_pda || p.pda, 'PDA'],
        [p.vessel_ramus || p.ramus, 'Ramus']
      ],
      p.culpritVessel,
      p.culprit_vessel,
      p.culpritVessels,
      p.culprit_vessels
    );
    const vesselStr = vesselList.length > 0 ? vesselList.join(', ') : 'N/A';

    // 24. TIMI Flow
    let timiFlow = 'N/A';
    if (p.postProcTimiFlow !== null && p.postProcTimiFlow !== undefined) {
      timiFlow = String(p.postProcTimiFlow).startsWith('Grade') ? String(p.postProcTimiFlow) : `Grade ${p.postProcTimiFlow}`;
    } else if (p.timi_flow !== null && p.timi_flow !== undefined) {
      timiFlow = `Grade ${p.timi_flow}`;
    } else if (p.proceduralSuccess || isYes(p.procedural_success)) {
      timiFlow = 'Grade 3';
    }

    // 25. Mortality
    const mortality = (isYes(p.death) || isYes(p.isDeath)) ? 'Yes' : 'No';

    // 26. Target Vessel Re-MI
    const targetVesselReMi = (isYes(p.reMi) || isYes(p.isReMi) || isYes(p.remi_for_stemi) || isYes(p.remi_for_nstemi) || isYes(p.targetVesselReMi)) ? 'Yes' : 'No';

    // 27. Non-Fatal Stroke / CVA
    const nonFatalStroke = (isYes(p.stroke) || isYes(p.isStroke) || isYes(p.cva_thrombotic) || isYes(p.cva_hemorrhagic)) ? 'Yes' : 'No';

    // 28. Major In-Hospital Bleeding
    const majorBleeding = (isYes(p.majorBleeding) || isYes(p.isMajorBleed) || isYes(p.major_bleeding)) ? 'Yes' : 'No';

    const row = patientSheet.addRow({
      siNo: index + 1,
      mrNo,
      ipNo,
      acsNo,
      patientId,
      patientName,
      primaryConsultant,
      registryType: typeStr,
      gender,
      age,
      phone,
      admissionDate,
      dischargeDate,
      presentation: presentationStr,
      timiScore: timiScoreVal != null ? Number(timiScoreVal) : 'N/A',
      timiRisk: timiRiskStr,
      strategy: strategyStr,
      doorToBalloonTime,
      doorToNeedleTime,
      comorbidities: comorbiditiesStr,
      medications: medicationsStr,
      thrombolysisAgent: lyticStr,
      culpritVessel: vesselStr,
      postProcTimiFlow: timiFlow,
      mortality,
      reMi: targetVesselReMi,
      stroke: nonFatalStroke,
      majorBleeding
    });

    row.height = 20;
    const isEven = (index % 2 === 0);
    row.eachCell((cell, colNum) => {
      cell.font = { name: 'Segoe UI', size: 9 };
      cell.border = {
        top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        right: { style: 'thin', color: { argb: 'FFE2E8F0' } }
      };
      if (isEven) {
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFF8FAFC' } // light slate-50
        };
      }
      // Left align text columns, center others
      const leftCols = [6, 7, 14, 16, 17, 20, 21, 22, 23]; // Patient Name, Consultant, Presentation, TIMI Risk, Strategy, Comorbidities, Medications, Thrombolytic Agents, Culprit Vessel
      if (leftCols.includes(colNum)) {
        cell.alignment = { vertical: 'middle', horizontal: 'left' };
      } else {
        cell.alignment = { vertical: 'middle', horizontal: 'center' };
      }
    });
  });

  // Enable AutoFilter across all 28 columns (A1 to AB1)
  patientSheet.autoFilter = {
    from: 'A1',
    to: 'AB1'
  };

  // Export buffer
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `ACS_Registry_Analytics_${registryType}_${new Date().toISOString().slice(0, 10)}.xlsx`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.URL.revokeObjectURL(url);
}

// Alias for backwards compatibility with MasterDashboard
export const exportAcsReportXlsx = generateAcsAuditExcel;


