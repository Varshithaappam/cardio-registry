/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';












import {
  calculateSTEMITimi,
  calculateNSTEMITimi } from
'../data/mockPatients';
import { calculateAge } from '../utils/calculateAge';
import {









  FileText,
  Bookmark } from
'lucide-react';









export default function ClinicalForm({ patientRecord, formType, editingRecord, onCancel, onSave }) {
  const patientAge = calculateAge(patientRecord.patient.dob) ?? 0;

  // Common states
  const [isDraft, setIsDraft] = useState(editingRecord?.isDraft ?? false);
  const [activeTab, setActiveTab] = useState('vitals'); // For subform pagination

  // --- DYNAMIC STATE FOR EACH FORM TYPE ---

  // 1. Hospitalization Form State
  const [h_admissionDate, setHAdmissionDate] = useState(editingRecord?.admissionDate ?? new Date().toISOString().split('T')[0]);
  const [h_dischargeDate, setHDischargeDate] = useState(editingRecord?.dischargeDate ?? new Date().toISOString().split('T')[0]);
  const [h_hospitalName, setHHospitalName] = useState(editingRecord?.hospitalName ?? 'CARE Heart Institute');
  const [h_hospitalZip, setHHospitalZip] = useState(editingRecord?.hospitalZip ?? '500034');
  const [h_hospitalState, setHHospitalState] = useState(editingRecord?.hospitalState ?? 'Telangana');
  const [h_payor, setHPayor] = useState(editingRecord?.payor ?? 'Arogyasree');
  const [h_treatingCardiologist, setHTreatingCardiologist] = useState(editingRecord?.treatingCardiologist ?? patientRecord.patient.primaryConsultant);
  const [h_reason, setHReason] = useState(editingRecord?.reasonForAdmission ?? '');
  const [h_isHF, setHIsHF] = useState(editingRecord?.isHFAdmission ?? formType === 'HF');
  const [h_precipitating, setHPrecipitating] = useState(editingRecord?.hfPrecipitatingFactors ?? []);

  // Hospitalization costs
  const [h_costBed, setHCostBed] = useState(editingRecord?.costBedCharges ?? 0);
  const [h_costDrugs, setHCostDrugs] = useState(editingRecord?.costDrugsDisposables ?? 0);
  const [h_costPackages, setHCostPackages] = useState(editingRecord?.costPackages ?? 0);
  const [h_costLab, setHCostLab] = useState(editingRecord?.costLabInvestigations ?? 0);
  const [h_costNonInvasive, setHCostNonInvasive] = useState(editingRecord?.costNonInvasiveLabs ?? 0);
  const [h_costConsults, setHCostConsults] = useState(editingRecord?.costConsults ?? 0);
  const [h_costRadiology, setHCostRadiology] = useState(editingRecord?.costRadiology ?? 0);
  const [h_costMisc, setHCostMisc] = useState(editingRecord?.costMiscellaneous ?? 0);

  // Auto-calculated total cost
  const h_totalCost = h_costBed + h_costDrugs + h_costPackages + h_costLab + h_costNonInvasive + h_costConsults + h_costRadiology + h_costMisc;

  // 2. HF Assessment Form State
  const [hf_assessmentDate, setHfAssessmentDate] = useState(editingRecord?.assessmentDate ?? new Date().toISOString().split('T')[0]);
  const [hf_visitType, setHfVisitType] = useState(editingRecord?.visitType ?? 'Outpatient');

  // Vitals
  const [v_weight, setVWeight] = useState(editingRecord?.vitals?.weightKg ?? 70);
  const [v_unableToWeigh, setVUnableToWeigh] = useState(editingRecord?.vitals?.unableToWeigh ?? false);
  const [v_unableToWeighReason, setVUnableToWeighReason] = useState(editingRecord?.vitals?.unableToWeighReason ?? '');
  const [v_height, setVHeight] = useState(editingRecord?.vitals?.heightCm ?? 170);
  // Auto-calculated BMI
  const v_bmi = !v_unableToWeigh && v_weight > 0 && v_height > 0 ? Number((v_weight / Math.pow(v_height / 100, 2)).toFixed(1)) : undefined;

  const [v_hr, setVHr] = useState(editingRecord?.vitals?.heartRate ?? 72);
  const [v_hrVar, setVHrVar] = useState(editingRecord?.vitals?.hrVariability ?? 'Regular');
  const [v_rr, setVRr] = useState(editingRecord?.vitals?.respiratoryRate ?? 18);
  const [v_o2, setVO2] = useState(editingRecord?.vitals?.o2Saturation ?? 98);
  const [v_bpSystolic, setVBpSystolic] = useState(editingRecord?.vitals?.bpSittingSystolic ?? 120);
  const [v_bpDiastolic, setVBpDiastolic] = useState(editingRecord?.vitals?.bpSittingDiastolic ?? 80);
  const [v_bpStandingSystolic, setVBpStandingSystolic] = useState(editingRecord?.vitals?.bpStandingSystolic ?? 115);
  const [v_bpStandingDiastolic, setVBpStandingDiastolic] = useState(editingRecord?.vitals?.bpStandingDiastolic ?? 76);
  const [v_mental, setVMental] = useState(editingRecord?.vitals?.mentalStatus ?? 'Alert/Oriented');

  // HF Symptoms
  const [hf_sym_dyspRest, setHfSymDyspRest] = useState(editingRecord?.symptoms?.dyspneaAtRest ?? false);
  const [hf_sym_dyspExert, setHfSymDyspExert] = useState(editingRecord?.symptoms?.dyspneaWithExertion ?? false);
  const [hf_sym_fatigue, setHfSymFatigue] = useState(editingRecord?.symptoms?.fatigue ?? false);
  const [hf_sym_orthopnea, setHfSymOrthopnea] = useState(editingRecord?.symptoms?.orthopnea ?? false);
  const [hf_sym_bloating, setHfSymBloating] = useState(editingRecord?.symptoms?.lossOfAppetiteBloating ?? false);
  const [hf_sym_decreasedEx, setHfSymDecreasedEx] = useState(editingRecord?.symptoms?.decreasedExerciseTolerance ?? false);
  const [hf_sym_wGain, setHfSymWGain] = useState(editingRecord?.symptoms?.weightGain ?? false);
  const [hf_sym_wLoss, setHfSymWLoss] = useState(editingRecord?.symptoms?.weightLoss ?? false);
  const [hf_sym_syncope, setHfSymSyncope] = useState(editingRecord?.symptoms?.syncope ?? false);
  const [hf_sym_pnd, setHfSymPnd] = useState(editingRecord?.symptoms?.pnd ?? false);
  const [hf_sym_cramps, setHfSymCramps] = useState(editingRecord?.symptoms?.muscleCramps ?? false);
  const [hf_sym_wheeze, setHfSymWheeze] = useState(editingRecord?.symptoms?.wheeze ?? false);
  const [hf_sym_giddy, setHfSymGiddy] = useState(editingRecord?.symptoms?.giddiness ?? false);

  // Volume overload
  const [hf_over_edema, setHfOverEdema] = useState(editingRecord?.volumeOverloadSigns?.peripheralEdema ?? false);
  const [hf_over_rales, setHfOverRales] = useState(editingRecord?.volumeOverloadSigns?.rales ?? false);
  const [hf_over_hepato, setHfOverHepato] = useState(editingRecord?.volumeOverloadSigns?.hepatomegaly ?? false);
  const [hf_over_ascites, setHfOverAscites] = useState(editingRecord?.volumeOverloadSigns?.ascites ?? false);
  const [hf_over_jvp, setHfOverJvp] = useState(editingRecord?.volumeOverloadSigns?.jvpElevated ?? false);

  // HF Classifications
  const [hf_type, setHfType] = useState(editingRecord?.typeOfHF ?? 'Unknown');
  const [hf_etiology_cv, setHfEtiologyCV] = useState(editingRecord?.hfEtiology?.cardiovascular ?? []);
  const [hf_etiology_non_cv, setHfEtiologyNonCV] = useState(editingRecord?.hfEtiology?.nonCardiac ?? []);
  const [hf_etiology_pulm, setHfEtiologyPulm] = useState(editingRecord?.hfEtiology?.pulmonary ?? []);
  const [hf_stage, setHfStage] = useState(editingRecord?.stageOfHF ?? 'Stage C');
  const [hf_nyha, setHfNyha] = useState(editingRecord?.nyhaClass ?? 'NYHA Class II');
  const [hf_af, setHfAf] = useState(editingRecord?.afStatus ?? 'NSR');

  // VT/VF risk
  const [hf_risk_vtvf, setHfRiskVtvf] = useState(editingRecord?.vtvfRiskAssessment?.documentedVT_VF ?? false);
  const [hf_risk_syncope, setHfRiskSyncope] = useState(editingRecord?.vtvfRiskAssessment?.syncopeComplaints ?? false);
  const [hf_risk_pvcs, setHfRiskPvcs] = useState(editingRecord?.vtvfRiskAssessment?.documentedPVCs ?? false);
  const [hf_risk_pvcCount, setHfRiskPvcCount] = useState(editingRecord?.vtvfRiskAssessment?.pvcCount ?? 0);
  const [hf_risk_nsvt, setHfRiskNsvt] = useState(editingRecord?.vtvfRiskAssessment?.documentedNSVT ?? false);

  // Device
  const [hf_dev_has, setHfDevHas] = useState(editingRecord?.currentDeviceTherapy?.hasDevice ?? 'No');
  const [hf_dev_type, setHfDevType] = useState(editingRecord?.currentDeviceTherapy?.deviceType ?? '');
  const [hf_dev_brand, setHfDevBrand] = useState(editingRecord?.currentDeviceTherapy?.brand ?? '');

  // 3. ACS (STEMI / NSTEMI) Form State
  const [acs_eventDate, setAcsEventDate] = useState(editingRecord?.eventDate ?? new Date().toISOString().split('T')[0]);
  const [acs_no, setAcsNo] = useState(editingRecord?.acsNo ?? `ACS-${Date.now().toString().substring(8)}`);

  // ACS Presentation
  const [acs_typical, setAcsTypical] = useState(editingRecord?.presentation?.typicalAngina ?? true);
  const [acs_atypical, setAcsAtypical] = useState(editingRecord?.presentation?.atypicalChestPain ?? false);
  const [acs_dysp, setAcsDysp] = useState(editingRecord?.presentation?.breathlessness ?? false);
  const [acs_syncope, setAcsSyncope] = useState(editingRecord?.presentation?.syncopeOrPreSyncope ?? false);
  const [acs_hr, setAcsHr] = useState(editingRecord?.presentation?.pulseRate ?? 76);
  const [acs_sbp, setAcsSbp] = useState(editingRecord?.presentation?.sbp ?? 120);
  const [acs_dbp, setAcsDbp] = useState(editingRecord?.presentation?.dbp ?? 80);

  // STEMI TIMI Score checkboxes
  const [acs_t_age75, setAcsTAge75] = useState(editingRecord?.timiDetails?.age75OrOver ?? patientAge >= 75);
  const [acs_t_age65_74, setAcsTAge6574] = useState(editingRecord?.timiDetails?.age65To74 ?? (patientAge >= 65 && patientAge < 75));
  const [acs_t_history, setAcsTHistory] = useState(editingRecord?.timiDetails?.historyDM_HTN_Angina ?? (patientRecord.comorbidities.diabetes === 'Yes' || patientRecord.comorbidities.hypertension === 'Yes'));
  const [acs_t_sbp100, setAcsTSbp100] = useState(editingRecord?.timiDetails?.sbpLessThan100 ?? false);
  const [acs_t_hr100, setAcsTHr100] = useState(editingRecord?.timiDetails?.hrGreaterThan100 ?? false);
  const [acs_t_killip, setAcsTKillip] = useState(editingRecord?.timiDetails?.killipClass2To4 ?? false);
  const [acs_t_antMI, setAcsTAntMI] = useState(editingRecord?.timiDetails?.anteriorMI_LBBB ?? false);
  const [acs_t_weight67, setAcsTWeight67] = useState(editingRecord?.timiDetails?.weightLessThan67 ?? false);
  const [acs_t_reperfusion4h, setAcsTReperfusion4h] = useState(editingRecord?.timiDetails?.timeToReperfusionGreaterThan4h ?? false);

  // NSTEMI TIMI Score checkboxes
  const [acs_n_age65, setAcsNAge65] = useState(editingRecord?.timiDetails?.age65OrOver ?? patientAge >= 65);
  const [acs_n_chd, setAcsNChd] = useState(editingRecord?.timiDetails?.atLeast3CHD_RiskFactors ?? false);
  const [acs_n_stenosis, setAcsNStenosis] = useState(editingRecord?.timiDetails?.priorCoronaryStenosis50Plus ?? false);
  const [acs_n_st, setAcsNSt] = useState(editingRecord?.timiDetails?.stDeviationAtAdmission ?? false);
  const [acs_n_angina, setAcsNAngina] = useState(editingRecord?.timiDetails?.atLeast2AnginalEpisodesLast24h ?? false);
  const [acs_n_markers, setAcsNMarkers] = useState(editingRecord?.timiDetails?.elevatedSerumCardiacMarkers ?? false);
  const [acs_n_asa, setAcsNAsa] = useState(editingRecord?.timiDetails?.aspirinUseLast7d ?? false);

  // Calculated TIMI
  const [timiScore, setTimiScore] = useState(0);

  useEffect(() => {
    if (formType === 'STEMI') {
      const score = calculateSTEMITimi({
        age75OrOver: acs_t_age75,
        age65To74: acs_t_age65_74,
        historyDM_HTN_Angina: acs_t_history,
        sbpLessThan100: acs_t_sbp100,
        hrGreaterThan100: acs_t_hr100,
        killipClass2To4: acs_t_killip,
        anteriorMI_LBBB: acs_t_antMI,
        weightLessThan67: acs_t_weight67,
        timeToReperfusionGreaterThan4h: acs_t_reperfusion4h
      });
      setTimiScore(score);
    } else if (formType === 'NSTEMI') {
      const score = calculateNSTEMITimi({
        age65OrOver: acs_n_age65,
        atLeast3CHD_RiskFactors: acs_n_chd,
        priorCoronaryStenosis50Plus: acs_n_stenosis,
        stDeviationAtAdmission: acs_n_st,
        atLeast2AnginalEpisodesLast24h: acs_n_angina,
        elevatedSerumCardiacMarkers: acs_n_markers,
        aspirinUseLast7d: acs_n_asa
      });
      setTimiScore(score);
    }
  }, [
  formType, acs_t_age75, acs_t_age65_74, acs_t_history, acs_t_sbp100, acs_t_hr100, acs_t_killip, acs_t_antMI, acs_t_weight67, acs_t_reperfusion4h,
  acs_n_age65, acs_n_chd, acs_n_stenosis, acs_n_st, acs_n_angina, acs_n_markers, acs_n_asa]
  );

  const [acs_strategy, setAcsStrategy] = useState(editingRecord?.treatmentStrategy ?? 'Conservative');

  // PAMI specifics
  const [pami_d2b, setPamiD2b] = useState(editingRecord?.pamiDetails?.doorToBalloonTime ?? 0);
  const [pami_vessels, setPamiVessels] = useState(editingRecord?.pamiDetails?.vessels ?? []);
  const [pami_segment, setPamiSegment] = useState(editingRecord?.pamiDetails?.segment ?? '');
  const [pami_thrombosuction, setPamiThrombosuction] = useState(editingRecord?.pamiDetails?.thrombosuction ?? 'Not done');
  const [pami_stent, setPamiStent] = useState(editingRecord?.pamiDetails?.stentType ?? 'None');
  const [pami_dia, setPamiDia] = useState(editingRecord?.pamiDetails?.stentDiameter ?? 0);
  const [pami_len, setPamiLen] = useState(editingRecord?.pamiDetails?.stentLength ?? 0);
  const [pami_success, setPamiSuccess] = useState(editingRecord?.pamiDetails?.proceduralSuccess ?? 'Yes');
  const [pami_timi, setPamiTimi] = useState(editingRecord?.pamiDetails?.postProcedureTIMIFlow ?? '3');

  // Thrombolysis specifics
  const [tb_d2n, setTbD2n] = useState(editingRecord?.thrombolysisDetails?.doorToNeedleTime ?? 0);
  const [tb_drug, setTbDrug] = useState(editingRecord?.thrombolysisDetails?.drug ?? 'None');
  const [tb_dose, setTbDose] = useState(editingRecord?.thrombolysisDetails?.dose ?? '');

  // Missing ACS and CABG State variables
  const [acs_heparin, setAcsHeparin] = useState(editingRecord?.heparinStrategy ?? 'None');
  const [acs_gp2b3a, setAcsGp2b3a] = useState(editingRecord?.gp2b3a ?? 'No');
  const [acs_bivalirudin, setAcsBivalirudin] = useState(editingRecord?.bivalirudin ?? 'No');
  const [acs_rf_lvf, setAcsRfLvf] = useState(editingRecord?.otherRiskFactors?.lvf ?? false);
  const [acs_rf_vtvf, setAcsRfVtvf] = useState(editingRecord?.otherRiskFactors?.vt_vf ?? false);
  const [acs_rf_bbb, setAcsRfBbb] = useState(editingRecord?.otherRiskFactors?.bbb_chb ?? false);
  const [acs_rf_bnpe, setAcsRfBnpe] = useState(editingRecord?.otherRiskFactors?.elevatedBNP ?? false);
  const [acs_rf_crpe, setAcsRfCrpe] = useState(editingRecord?.otherRiskFactors?.elevatedCRP ?? false);

  const [c_anastomoticDevices, setCAnastomoticDevices] = useState(editingRecord?.bypassDetails?.anastomoticDevice ?? 'None');
  const [c_hasIABP, setCHasIABP] = useState(editingRecord?.iabpUsed === 'Yes');
  const [c_iABPTiming, setCIABPTiming] = useState(
    editingRecord?.iabpDetails?.whenInserted === 'Preoperatively' ? 'Pre-operative' :
    editingRecord?.iabpDetails?.whenInserted === 'Intraoperatively' ? 'Intra-operative' : 'Post-operative'
  );
  const [c_bloodProducts, setCBloodProducts] = useState(() => {
    const list = [];
    if (editingRecord?.intraopBloodProducts?.rbcUnits) list.push('RBC');
    if (editingRecord?.intraopBloodProducts?.ffpUnits) list.push('FFP');
    if (editingRecord?.intraopBloodProducts?.plateletUnits) list.push('Platelets');
    if (editingRecord?.intraopBloodProducts?.cryoUnits) list.push('Cryoprecipitate');
    return list;
  });
  const [c_valveType, setCValveType] = useState('Aortic');
  const [c_valveImplantType, setCValveImplantType] = useState('Mechanical');
  const [c_valveBrand, setCValveBrand] = useState('');
  const [c_valveSize, setCValveSize] = useState(0);
  const [c_vadIndication, setCVadIndication] = useState('Bridge to Transplant');
  const [c_vadType, setCVadType] = useState('LVAD');
  const [c_vadFlowRate, setCVadFlowRate] = useState(0);
  const [c_reexploration, setCReexploration] = useState(editingRecord?.postoperative?.inHospitalComplications?.includes('Reexploration') ?? false);
  const [c_surgicalMortality, setCSurgicalMortality] = useState(editingRecord?.mortality?.operativeDeath === 'Yes');

  // 4. CABG adult cardiac surgery Form State
  const [cabgTab, setCabgTab] = useState('general');
  const [c_date, setCDate] = useState(editingRecord?.procedureDate ?? new Date().toISOString().split('T')[0]);
  const [c_surgeon, setCSurgeon] = useState(editingRecord?.surgeonName ?? 'Dr. Gopala Krishna');
  const [c_surgeonId, setCSurgeonId] = useState(editingRecord?.surgeonId ?? 'SURG-4049');
  const [c_status, setCStatus] = useState(editingRecord?.procedureStatus ?? 'Elective');
  const [c_robotic, setCRobotic] = useState(editingRecord?.roboticAssisted ?? 'No');

  // Urgent/Emergent reasons
  const [c_urgentReason, setCUrgentReason] = useState(editingRecord?.urgentReason ?? '');
  const [c_emergentReason, setCEmergentReason] = useState(editingRecord?.emergentReason ?? '');

  // CPB
  const [c_cpb, setCCpb] = useState(editingRecord?.cpbUtilization ?? 'Full');
  const [c_perf, setCPerf] = useState(editingRecord?.cpbDetails?.perfusionTimeMinutes ?? 0);
  const [c_cann, setCCann] = useState(editingRecord?.cpbDetails?.cannulationMethod ?? 'Aorta and Atrial/Caval');
  const [c_occl, setCOccl] = useState(editingRecord?.aorticOcclusion ?? 'Aortic Crossclamp');
  const [c_xclamp, setCXclamp] = useState(editingRecord?.crossClampTimeMinutes ?? 0);
  const [c_cardioplegia, setCCardioplegia] = useState(editingRecord?.cardioplegiaUsed ?? 'Yes');

  // IABP
  const [c_iabpUsed, setCIabpUsed] = useState(editingRecord?.iabpUsed ?? 'No');
  const [c_iabpWhen, setCIabpWhen] = useState(editingRecord?.iabpDetails?.whenInserted ?? 'Preoperatively');
  const [c_iabpInd, setCIabpInd] = useState(editingRecord?.iabpDetails?.indication ?? 'Hemodynamic Instab');

  // Intraop Blood Products
  const [c_bloodUsed, setCBloodUsed] = useState(editingRecord?.intraopBloodProducts?.used ?? 'No');
  const [c_bloodRbc, setCBloodRbc] = useState(editingRecord?.intraopBloodProducts?.rbcUnits ?? 0);
  const [c_bloodFfp, setCBloodFfp] = useState(editingRecord?.intraopBloodProducts?.ffpUnits ?? 0);
  const [c_bloodCryo, setCBloodCryo] = useState(editingRecord?.intraopBloodProducts?.cryoUnits ?? 0);
  const [c_bloodPlt, setCBloodPlt] = useState(editingRecord?.intraopBloodProducts?.plateletUnits ?? 0);

  // Grafts (Section J)
  const [c_hasBypass, setCHasBypass] = useState(editingRecord?.hasCoronaryBypass ?? 'Yes');
  const [c_distArt, setCDistArt] = useState(editingRecord?.bypassDetails?.distalAnastomosesArterial ?? 2);
  const [c_distVen, setCDistVen] = useState(editingRecord?.bypassDetails?.distalAnastomosesVenous ?? 2);
  const [c_imas, setCImas] = useState(editingRecord?.bypassDetails?.imasUsedGrafts ?? 'Both IMAs');
  const [c_imaHarvest, setCImaHarvest] = useState(editingRecord?.bypassDetails?.imaHarvestTechnique ?? 'Direct Vision');
  const [c_radial, setCRadial] = useState(editingRecord?.bypassDetails?.radialArteryUsed ?? 'No Radial');
  const [c_anastUsed, setCAnastUsed] = useState(editingRecord?.bypassDetails?.anastomoticDeviceUsed ?? 'No');
  const [c_anastDevice, setCAnastDevice] = useState(editingRecord?.bypassDetails?.anastomoticDevice ?? 'Other');
  const [c_imaAnastomoses, setCImaAnastomoses] = useState(editingRecord?.bypassDetails?.imaDistalAnastomosesCount ?? 1);
  const [c_radialAnastomoses, setCRadialAnastomoses] = useState(editingRecord?.bypassDetails?.radialArteryDistalAnastomosesCount ?? 0);

  // Valves (Section K)
  const [c_hasValve, setCHasValve] = useState(editingRecord?.hasValveSurgery ?? 'No');
  const [c_aorticProc, setCAorticProc] = useState(editingRecord?.valveDetails?.aorticProcedure ?? 'No');
  const [c_mitralProc, setCMitralProc] = useState(editingRecord?.valveDetails?.mitralProcedure ?? 'No');
  const [c_tricuspidProc, setCTricuspidProc] = useState(editingRecord?.valveDetails?.tricuspidProcedure ?? 'No');
  const [c_pulmonicProc, setCPulmonicProc] = useState(editingRecord?.valveDetails?.pulmonicProcedure ?? 'No');
  const [c_aorticEnlargement, setCAorticEnlargement] = useState(editingRecord?.valveDetails?.aorticAnnularEnlargement ?? 'No');
  const [c_prosthesisAorticType, setCProsthesisAorticType] = useState(editingRecord?.valveDetails?.prosthesisAortic?.type ?? '');
  const [c_prosthesisAorticName, setCProsthesisAorticName] = useState(editingRecord?.valveDetails?.prosthesisAortic?.name ?? '');
  const [c_prosthesisAorticSize, setCProsthesisAorticSize] = useState(editingRecord?.valveDetails?.prosthesisAortic?.size ?? '');

  // VAD (Section L)
  const [c_hasVAD, setCHasVAD] = useState(editingRecord?.hasVAD ?? 'No');
  const [c_prevVAD, setCPrevVAD] = useState(editingRecord?.vadDetails?.previousVAD ?? 'No');
  const [c_vadInd, setCVadInd] = useState(editingRecord?.vadDetails?.indication ?? 'Bridge to Transplant');
  const [c_vadIntubated, setCVadIntubated] = useState(editingRecord?.vadDetails?.intubatedPreVAD ?? 'No');
  const [c_vadPcwp, setCVadPcwp] = useState(editingRecord?.vadDetails?.hemodynamicsPreVAD?.pcwp ?? 0);
  const [c_vadCvp, setCVadCvp] = useState(editingRecord?.vadDetails?.hemodynamicsPreVAD?.cvp ?? 0);
  const [c_vadPvr, setCVadPvr] = useState(editingRecord?.vadDetails?.hemodynamicsPreVAD?.pvr ?? 0);
  const [c_vadCi, setCVadCi] = useState(editingRecord?.vadDetails?.hemodynamicsPreVAD?.ci ?? 0);
  const [c_vadRvFunc, setCVadRvFunc] = useState(editingRecord?.vadDetails?.hemodynamicsPreVAD?.rvFunction ?? 'Normal');
  const [c_vadImplantType, setCVadImplantType] = useState(editingRecord?.vadDetails?.deviceData?.implantType ?? 'LVAD');
  const [c_vadProductType, setCVadProductType] = useState(editingRecord?.vadDetails?.deviceData?.productType ?? 'HeartMate II');

  // Postoperative and mortality
  const [c_postBlood, setCPostBlood] = useState(editingRecord?.postoperative?.bloodProductsUsed ?? 'No');
  const [c_postRbc, setCPostRbc] = useState(editingRecord?.postoperative?.rbcUnits ?? 0);
  const [c_postFfp, setCPostFfp] = useState(editingRecord?.postoperative?.ffpUnits ?? 0);
  const [c_postCryo, setCPostCryo] = useState(editingRecord?.postoperative?.cryoUnits ?? 0);
  const [c_postPlt, setCPostPlt] = useState(editingRecord?.postoperative?.plateletUnits ?? 0);
  const [c_extubatedOr, setCExtubatedOr] = useState(editingRecord?.postoperative?.extubatedInOR ?? 'No');
  const [c_initVentHours, setCInitVentHours] = useState(editingRecord?.postoperative?.initialVentilationHours ?? 0);
  const [c_reintubated, setCReintubated] = useState(editingRecord?.postoperative?.reintubatedDuringStay ?? 'No');
  const [c_addVentHours, setCAddVentHours] = useState(editingRecord?.postoperative?.additionalVentilationHours ?? 0);
  const [c_complications, setCComplications] = useState(editingRecord?.postoperative?.inHospitalComplications ?? []);

  // Mortality
  const [c_mortality, setCMortality] = useState(editingRecord?.mortality?.mortalityStatus ?? 'No');
  const [c_mortalityDisch, setCMortalityDisch] = useState(editingRecord?.mortality?.dischargeStatus ?? 'Alive');
  const [c_mortality30Days, setCMortality30Days] = useState(editingRecord?.mortality?.statusAt30Days ?? 'Alive');
  const [c_mortalityOpDeath, setCMortalityOpDeath] = useState(editingRecord?.mortality?.operativeDeath ?? 'No');
  const [c_mortalityCause, setCMortalityCause] = useState(editingRecord?.mortality?.primaryCauseOfDeath ?? '');

  // 5. Follow-up state
  const [f_interval, setFInterval] = useState(editingRecord?.followUpInterval ?? '1-month');
  const [f_date, setFDate] = useState(editingRecord?.dateOfVisit ?? new Date().toISOString().split('T')[0]);
  const [f_angina, setFAngina] = useState(editingRecord?.symptoms?.angina ?? 'No');
  const [f_nyha, setFNyha] = useState(editingRecord?.symptoms?.breathlessnessClass ?? 'NYHA Class I');

  // 6. Labs state
  const [l_date, setLDate] = useState(editingRecord?.resultDate ?? new Date().toISOString().split('T')[0]);
  const [l_k, setLK] = useState(editingRecord?.potassium ?? 4.0);
  const [l_creat, setLCreat] = useState(editingRecord?.creatinine ?? 1.0);
  const [l_bnp, setLBNP] = useState(editingRecord?.bnp ?? 100);
  const [l_trop, setLTrop] = useState(editingRecord?.tropI ?? 0);

  // 7. Investigations state
  const [i_date, setIDate] = useState(editingRecord?.investigationDate ?? new Date().toISOString().split('T')[0]);
  const [i_type, setIType] = useState(editingRecord?.testType ?? 'ECG');

  // Custom flexible investigation values based on type
  const [i_ecg_hr, setIEcgHr] = useState(editingRecord?.results?.hr ?? 72);
  const [i_ecg_rhythm, setIEcgRhythm] = useState(editingRecord?.results?.rhythm ?? 'NSR');
  const [i_echo_ef, setIEchoEf] = useState(editingRecord?.results?.ef ?? 55);
  const [i_echo_rwma, setIEchoRwma] = useState(editingRecord?.results?.rwma ?? 'None');


  // Form completion percentage
  const [completionPercent, setCompletionPercent] = useState(15);

  useEffect(() => {
    // Basic reactive completion logic based on mandatory fields
    let filled = 0;
    let total = 6;
    if (formType === 'HF') {
      if (hf_assessmentDate) filled++;
      if (v_weight && !v_unableToWeigh) filled++;
      if (v_height) filled++;
      if (hf_nyha) filled++;
      if (hf_stage) filled++;
      if (hf_type) filled++;
      total = 6;
    } else if (formType === 'STEMI' || formType === 'NSTEMI') {
      if (acs_eventDate) filled++;
      if (acs_no) filled++;
      if (acs_hr) filled++;
      if (acs_sbp) filled++;
      if (acs_strategy) filled++;
      total = 5;
    } else if (formType === 'CABG') {
      if (c_date) filled++;
      if (c_surgeon) filled++;
      if (c_status) filled++;
      if (c_cpb) filled++;
      total = 4;
    } else {
      filled = 3;
      total = 3;
    }
    setCompletionPercent(Math.round(filled / total * 100));
  }, [
  formType, hf_assessmentDate, v_weight, v_unableToWeigh, v_height, hf_nyha, hf_stage, hf_type,
  acs_eventDate, acs_no, acs_hr, acs_sbp, acs_strategy, c_date, c_surgeon, c_status, c_cpb]
  );

  const handleSubmit = (e) => {
    e.preventDefault();

    // Construct final clean data object based on formType
    let submissionData = {};

    if (formType === 'Admission') {
      const hData = {
        id: editingRecord?.id ?? `hosp-${Date.now()}`,
        patientId: patientRecord.patient.id,
        admissionDate: h_admissionDate,
        dischargeDate: h_dischargeDate,
        hospitalName: h_hospitalName,
        hospitalZip: h_hospitalZip,
        hospitalState: h_hospitalState,
        payor: h_payor,
        treatingCardiologist: h_treatingCardiologist,
        reasonForAdmission: h_reason,
        isHFAdmission: h_isHF,
        hfPrecipitatingFactors: h_isHF ? h_precipitating : [],
        icuVisit: 'No',
        icuReadmission: 'No',
        costBedCharges: h_costBed,
        costDrugsDisposables: h_costDrugs,
        costPackages: h_costPackages,
        costLabInvestigations: h_costLab,
        costNonInvasiveLabs: h_costNonInvasive,
        costConsults: h_costConsults,
        costRadiology: h_costRadiology,
        costMiscellaneous: h_costMisc,
        costTotal: h_totalCost,
        dischargeLocation: 'Home'
      };
      submissionData = hData;
    } else
    if (formType === 'HF') {
      const hfData = {
        id: editingRecord?.id ?? `hfa-${Date.now()}`,
        patientId: patientRecord.patient.id,
        assessmentDate: hf_assessmentDate,
        visitType: hf_visitType,
        vitals: {
          weightKg: v_unableToWeigh ? undefined : v_weight,
          unableToWeigh: v_unableToWeigh,
          unableToWeighReason: v_unableToWeigh ? v_unableToWeighReason : undefined,
          heightCm: v_height,
          bmi: v_bmi,
          heartRate: v_hr,
          hrVariability: v_hrVar,
          respiratoryRate: v_rr,
          o2Saturation: v_o2,
          bpSittingSystolic: v_bpSystolic,
          bpSittingDiastolic: v_bpDiastolic,
          bpStandingSystolic: v_bpStandingSystolic,
          bpStandingDiastolic: v_bpStandingDiastolic,
          mentalStatus: v_mental
        },
        symptoms: {
          dyspneaAtRest: hf_sym_dyspRest,
          dyspneaWithExertion: hf_sym_dyspExert,
          fatigue: hf_sym_fatigue,
          orthopnea: hf_sym_orthopnea,
          lossOfAppetiteBloating: hf_sym_bloating,
          decreasedExerciseTolerance: hf_sym_decreasedEx,
          weightGain: hf_sym_wGain,
          weightLoss: hf_sym_wLoss,
          syncope: hf_sym_syncope,
          pnd: hf_sym_pnd,
          muscleCramps: hf_sym_cramps,
          wheeze: hf_sym_wheeze,
          giddiness: hf_sym_giddy
        },
        volumeOverloadSigns: {
          peripheralEdema: hf_over_edema,
          rales: hf_over_rales,
          hepatomegaly: hf_over_hepato,
          ascites: hf_over_ascites,
          jvpElevated: hf_over_jvp
        },
        typeOfHF: hf_type,
        hfEtiology: {
          cardiovascular: hf_etiology_cv,
          nonCardiac: hf_etiology_non_cv,
          pulmonary: hf_etiology_pulm
        },
        stageOfHF: hf_stage,
        nyhaClass: hf_nyha,
        afStatus: hf_af,
        vtvfRiskAssessment: {
          documentedVT_VF: hf_risk_vtvf,
          syncopeComplaints: hf_risk_syncope,
          documentedPVCs: hf_risk_pvcs,
          pvcCount: hf_risk_pvcs ? hf_risk_pvcCount : undefined,
          documentedNSVT: hf_risk_nsvt
        },
        currentDeviceTherapy: {
          hasDevice: hf_dev_has,
          deviceType: hf_dev_has === 'Yes' ? hf_dev_type : undefined,
          brand: hf_dev_has === 'Yes' ? hf_dev_brand : undefined
        },
        deviceEligibility: {
          eligible: 'No'
        },
        educationRecommended: [],
        recommendations: {}
      };
      submissionData = hfData;
    } else
    if (formType === 'STEMI' || formType === 'NSTEMI') {
      const acsData = {
        id: editingRecord?.id ?? `acs-${Date.now()}`,
        patientId: patientRecord.patient.id,
        eventDate: acs_eventDate,
        type: formType,
        acsNo: acs_no,
        presentation: {
          typicalAngina: acs_typical,
          atypicalChestPain: acs_atypical,
          breathlessness: acs_dysp,
          syncopeOrPreSyncope: acs_syncope,
          pulseRate: acs_hr,
          sbp: acs_sbp,
          dbp: acs_dbp
        },
        timiCalculatedScore: timiScore,
        timiDetails: formType === 'STEMI' ? {
          age75OrOver: acs_t_age75,
          age65To74: acs_t_age65_74,
          historyDM_HTN_Angina: acs_t_history,
          sbpLessThan100: acs_t_sbp100,
          hrGreaterThan100: acs_t_hr100,
          killipClass2To4: acs_t_killip,
          anteriorMI_LBBB: acs_t_antMI,
          weightLessThan67: acs_t_weight67,
          timeToReperfusionGreaterThan4h: acs_t_reperfusion4h
        } : {
          age65OrOver: acs_n_age65,
          atLeast3CHD_RiskFactors: acs_n_chd,
          priorCoronaryStenosis50Plus: acs_n_stenosis,
          stDeviationAtAdmission: acs_n_st,
          atLeast2AnginalEpisodesLast24h: acs_n_angina,
          elevatedSerumCardiacMarkers: acs_n_markers,
          aspirinUseLast7d: acs_n_asa
        },
        otherRiskFactors: {
          lvf: acs_rf_lvf,
          vt_vf: acs_rf_vtvf,
          bbb_chb: acs_rf_bbb,
          elevatedBNP: acs_rf_bnpe,
          elevatedCRP: acs_rf_crpe
        },
        treatmentStrategy: acs_strategy,
        pamiDetails: acs_strategy === 'PAMI' ? {
          doorToBalloonTime: pami_d2b,
          vessels: pami_vessels,
          segment: pami_segment,
          thrombosuction: pami_thrombosuction,
          stentType: pami_stent,
          stentDiameter: pami_dia,
          stentLength: pami_len,
          proceduralSuccess: pami_success,
          postProcedureTIMIFlow: pami_timi,
          majorComplications: []
        } : undefined,
        thrombolysisDetails: acs_strategy === 'Thrombolysis' ? {
          doorToNeedleTime: tb_d2n,
          drug: tb_drug,
          dose: tb_dose
        } : undefined,
        heparinStrategy: acs_heparin,
        gp2b3a: acs_gp2b3a,
        bivalirudin: acs_bivalirudin,
        appropriateness: { procedures: {}, investigations: {}, drugs: {} }
      };
      submissionData = acsData;
    } else
    if (formType === 'CABG') {
      const cabgData = {
        id: editingRecord?.id ?? `cabg-${Date.now()}`,
        patientId: patientRecord.patient.id,
        procedureDate: c_date,
        surgeonName: c_surgeon,
        surgeonId: c_surgeonId,
        procedureStatus: c_status,
        urgentReason: c_status === 'Urgent' ? c_urgentReason : undefined,
        emergentReason: c_status === 'Emergent' || c_status === 'Emergent Salvage' ? c_emergentReason : undefined,
        roboticAssisted: c_robotic,
        skinIncisionStart: '08:00',
        skinIncisionStop: '12:30',
        cpbUtilization: c_cpb,
        cpbDetails: c_cpb !== 'None' ? {
          combinationPlan: 'Planned',
          perfusionTimeMinutes: c_perf,
          cannulationMethod: c_cann
        } : undefined,
        aorticOcclusion: c_occl,
        crossClampTimeMinutes: c_occl === 'Aortic Crossclamp' ? c_xclamp : undefined,
        cardioplegiaUsed: c_cardioplegia,
        iabpUsed: c_hasIABP ? 'Yes' : 'No',
        iabpDetails: c_hasIABP ? {
          whenInserted: c_iABPTiming === 'Pre-operative' ? 'Preoperatively' : c_iABPTiming === 'Intra-operative' ? 'Intraoperatively' : 'Postoperatively',
          indication: 'Hemodynamic Instab'
        } : undefined,
        intraopBloodProducts: {
          used: c_bloodProducts.length > 0 ? 'Yes' : 'No',
          rbcUnits: c_bloodProducts.includes('RBC') ? 1 : 0,
          ffpUnits: c_bloodProducts.includes('FFP') ? 1 : 0,
          cryoUnits: c_bloodProducts.includes('Cryoprecipitate') ? 1 : 0,
          plateletUnits: c_bloodProducts.includes('Platelets') ? 1 : 0
        },
        hasCoronaryBypass: c_hasBypass,
        bypassDetails: c_hasBypass === 'Yes' ? {
          distalAnastomosesArterial: c_distArt,
          distalAnastomosesVenous: c_distVen,
          anastomoticDeviceUsed: c_anastomoticDevices !== 'None' ? 'Yes' : 'No',
          anastomoticDevice: c_anastomoticDevices !== 'None' ? c_anastomoticDevices : undefined,
          imasUsedGrafts: c_imas,
          imaHarvestTechnique: c_imaHarvest,
          imaDistalAnastomosesCount: c_imaAnastomoses,
          radialArteryUsed: c_radial,
          radialArteryDistalAnastomosesCount: c_radialAnastomoses
        } : undefined,
        hasValveSurgery: c_hasValve ? 'Yes' : 'No',
        valveDetails: c_hasValve ? {
          aorticProcedure: c_valveType === 'Aortic' ? 'Replacement' : 'No',
          mitralProcedure: c_valveType === 'Mitral' ? 'Replacement' : 'No',
          tricuspidProcedure: c_valveType === 'Tricuspid' ? 'Replacement' : 'No',
          pulmonicProcedure: c_valveType === 'Pulmonary' ? 'Replacement' : 'No',
          aorticAnnularEnlargement: 'No',
          prosthesisAortic: { type: c_valveImplantType, name: c_valveBrand, size: String(c_valveSize) }
        } : undefined,
        hasVAD: c_hasVAD ? 'Yes' : 'No',
        vadDetails: c_hasVAD ? {
          previousVAD: 'No',
          indication: c_vadIndication,
          intubatedPreVAD: 'No',
          hemodynamicsPreVAD: {
            pcwp: 0,
            cvp: 0,
            pvr: 0,
            ci: 0,
            rvFunction: 'Normal',
            rvFunctionMethod: 'Pre-op ECHO',
            vo2Measured: 'No'
          },
          deviceData: { implantType: c_vadType, productType: 'VAD' },
          complications: [],
          dischargeStatus: 'with VAD'
        } : undefined,
        otherCardiacProcedures: [],
        otherNonCardiacProcedures: [],
        postoperative: {
          bloodProductsUsed: c_postBlood,
          rbcUnits: c_postBlood === 'Yes' ? c_postRbc : undefined,
          ffpUnits: c_postBlood === 'Yes' ? c_postFfp : undefined,
          cryoUnits: c_postBlood === 'Yes' ? c_postCryo : undefined,
          plateletUnits: c_postBlood === 'Yes' ? c_postPlt : undefined,
          extubatedInOR: c_extubatedOr,
          initialVentilationHours: c_initVentHours,
          reintubatedDuringStay: c_reintubated,
          additionalVentilationHours: c_reintubated === 'Yes' ? c_addVentHours : undefined,
          inHospitalComplications: c_reexploration ? [...c_complications, 'Reexploration'] : c_complications
        },
        mortality: {
          mortalityStatus: c_mortality,
          dischargeStatus: c_mortalityDisch,
          statusAt30Days: c_mortality30Days,
          operativeDeath: c_surgicalMortality ? 'Yes' : 'No',
          primaryCauseOfDeath: c_mortality === 'Yes' ? c_mortalityCause : undefined
        }
      };
      submissionData = cabgData;
    } else
    if (formType === 'Follow-up') {
      const fData = {
        id: editingRecord?.id ?? `fol-${Date.now()}`,
        patientId: patientRecord.patient.id,
        followUpInterval: f_interval,
        dateOfVisit: f_date,
        symptoms: {
          angina: f_angina,
          breathlessnessClass: f_nyha
        },
        medicationCompliance: {
          dualAntiplatelets: 'Yes',
          statins: 'Yes',
          betaBlocker: 'Yes',
          aceiOrArb: 'Yes',
          aldosteroneAntagonist: 'Yes'
        },
        adverseEvents: {
          acsEvent: false,
          hospitalization: false,
          ptca: false,
          cabg: false,
          stroke: false,
          bleeding: false,
          death: false,
          anyOther: false
        }
      };
      submissionData = fData;
    } else
    if (formType === 'Lab') {
      const lData = {
        id: editingRecord?.id ?? `lab-${Date.now()}`,
        patientId: patientRecord.patient.id,
        resultDate: l_date,
        potassium: l_k,
        creatinine: l_creat,
        bnp: l_bnp,
        tropI: l_trop
      };
      submissionData = lData;
    } else
    if (formType === 'Investigation') {
      const iData = {
        id: editingRecord?.id ?? `inv-${Date.now()}`,
        patientId: patientRecord.patient.id,
        investigationDate: i_date,
        testType: i_type,
        results: i_type === 'ECG' ? {
          hr: i_ecg_hr,
          rhythm: i_ecg_rhythm
        } : i_type === 'ECHO' ? {
          ef: i_echo_ef,
          rwma: i_echo_rwma
        } : {}
      };
      submissionData = iData;
    }

    // Add draft property if checked
    submissionData.isDraft = isDraft;

    onSave(submissionData, formType);
  };

  const formStyles = {
    HF: {
      bg: 'bg-teal-950',
      border: 'border-teal-900',
      text: 'text-teal-400',
      badge: 'bg-teal-500/20 text-teal-300 border-teal-500/30',
      iconBg: 'bg-teal-500/20 text-teal-400',
      barColor: 'bg-teal-500',
      title: 'Heart Failure (HF) Clinical Form',
      subtitle: 'CARE CHF Assessment & Cohort Tracking'
    },
    STEMI: {
      bg: 'bg-red-950',
      border: 'border-red-900',
      text: 'text-red-400',
      badge: 'bg-red-500/20 text-red-300 border-red-500/30',
      iconBg: 'bg-red-500/20 text-red-400',
      barColor: 'bg-red-600',
      title: 'STEMI Emergency Event Form',
      subtitle: 'Primary PCI (PAMI) & Door-to-Balloon Registry'
    },
    NSTEMI: {
      bg: 'bg-orange-950',
      border: 'border-orange-900',
      text: 'text-orange-400',
      badge: 'bg-orange-500/20 text-orange-300 border-orange-500/30',
      iconBg: 'bg-orange-500/20 text-orange-400',
      barColor: 'bg-orange-500',
      title: 'NSTEMI Clinical Event Form',
      subtitle: 'TIMI Risk Stratification & Therapy Registry'
    },
    CABG: {
      bg: 'bg-purple-950',
      border: 'border-purple-900',
      text: 'text-purple-400',
      badge: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
      iconBg: 'bg-purple-500/20 text-purple-400',
      barColor: 'bg-purple-500',
      title: 'CABG Adult Cardiac Surgery Form',
      subtitle: 'STS Quality Database Audit Standard'
    },
    Admission: {
      bg: 'bg-slate-900',
      border: 'border-slate-800',
      text: 'text-blue-400',
      badge: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
      iconBg: 'bg-blue-500/20 text-blue-400',
      barColor: 'bg-blue-500',
      title: 'Admission / Encounter Form',
      subtitle: 'Hospitalization Log & Cost Parameters'
    },
    'Follow-up': {
      bg: 'bg-slate-900',
      border: 'border-slate-800',
      text: 'text-blue-400',
      badge: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
      iconBg: 'bg-blue-500/20 text-blue-400',
      barColor: 'bg-blue-500',
      title: 'Follow-up Visit Registry',
      subtitle: 'Longitudinal Adherence & Compliance'
    },
    Lab: {
      bg: 'bg-slate-900',
      border: 'border-slate-800',
      text: 'text-blue-400',
      badge: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
      iconBg: 'bg-blue-500/20 text-blue-400',
      barColor: 'bg-blue-500',
      title: 'Clinical Lab Result Log',
      subtitle: 'Cardiovascular Lab Biomarkers'
    },
    Investigation: {
      bg: 'bg-slate-900',
      border: 'border-slate-800',
      text: 'text-blue-400',
      badge: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
      iconBg: 'bg-blue-500/20 text-blue-400',
      barColor: 'bg-blue-500',
      title: 'Clinical Diagnostic Report',
      subtitle: 'ECG, ECHO, & Radiology Investigation Logs'
    }
  };

  const currentStyle = formStyles[formType] || formStyles.Admission;

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      
      {/* Form Title Banner */}
      <div className={`p-6 ${currentStyle.bg} text-white border-b ${currentStyle.border} flex justify-between items-center flex-wrap gap-4`}>
        <div className="flex items-center gap-3">
          <div className={`p-2 ${currentStyle.iconBg} rounded-lg`}>
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold">
              {editingRecord ? 'Modify Existing Entry' : 'Record New Entry'}: {currentStyle.title}
            </h3>
            <p className="text-xs text-slate-400 mt-1">Patient Master Reference: {patientRecord.patient.name} ({patientRecord.patient.mrNo}) • {currentStyle.subtitle}</p>
          </div>
        </div>

        {/* Completion Progress Badge */}
        <div className="flex items-center gap-4">
          <div className="text-right">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Form Completeness</span>
            <span className={`text-sm font-extrabold ${currentStyle.text}`}>{completionPercent}%</span>
          </div>
          <div className="w-12 h-1.5 bg-slate-800 rounded-full overflow-hidden">
            <div className={`h-full ${currentStyle.barColor} transition-all duration-300`} style={{ width: `${completionPercent}%` }}></div>
          </div>
        </div>
      </div>

      {/* Primary Interactive Fields */}
      <form onSubmit={handleSubmit} className="p-6 space-y-6">
        
        {/* Render HOSPITAL ADMISSION / ENCOUNTER */}
        {formType === 'Admission' &&
        <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Date of Admission *</label>
                <input
                id="hosp-admdt"
                type="date"
                required
                className="w-full p-2 border border-slate-200 rounded-lg text-sm bg-white"
                value={h_admissionDate}
                onChange={(e) => setHAdmissionDate(e.target.value)} />
              
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Date of Discharge</label>
                <input
                id="hosp-dischdt"
                type="date"
                className="w-full p-2 border border-slate-200 rounded-lg text-sm bg-white"
                value={h_dischargeDate}
                onChange={(e) => setHDischargeDate(e.target.value)} />
              
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Hospital / Clinic Site *</label>
                <input
                id="hosp-site"
                type="text"
                required
                className="w-full p-2 border border-slate-200 rounded-lg text-sm bg-white"
                value={h_hospitalName}
                onChange={(e) => setHHospitalName(e.target.value)} />
              
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Treating Cardiologist / Consultant *</label>
                <input
                id="hosp-doc"
                type="text"
                required
                className="w-full p-2 border border-slate-200 rounded-lg text-sm bg-white"
                value={h_treatingCardiologist}
                onChange={(e) => setHTreatingCardiologist(e.target.value)} />
              
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Primary Reason for Admission *</label>
                <input
                id="hosp-reason"
                type="text"
                required
                placeholder="E.g. Decompensated heart failure, angina evaluation"
                className="w-full p-2 border border-slate-200 rounded-lg text-sm bg-white"
                value={h_reason}
                onChange={(e) => setHReason(e.target.value)} />
              
              </div>
            </div>

            {/* Financial care cost details */}
            <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl space-y-4 mt-6">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Costs & Hospital Stay Charges</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs text-slate-600 mb-1">Bed charges (INR)</label>
                  <input
                  id="cost-bed"
                  type="number"
                  className="w-full p-2 text-xs border border-slate-200 rounded-md bg-white font-mono"
                  value={h_costBed}
                  onChange={(e) => setHCostBed(Number(e.target.value))} />
                
                </div>
                <div>
                  <label className="block text-xs text-slate-600 mb-1">Drugs & Disposables</label>
                  <input
                  id="cost-drugs"
                  type="number"
                  className="w-full p-2 text-xs border border-slate-200 rounded-md bg-white font-mono"
                  value={h_costDrugs}
                  onChange={(e) => setHCostDrugs(Number(e.target.value))} />
                
                </div>
                <div>
                  <label className="block text-xs text-slate-600 mb-1">Package Cost</label>
                  <input
                  id="cost-package"
                  type="number"
                  className="w-full p-2 text-xs border border-slate-200 rounded-md bg-white font-mono"
                  value={h_costPackages}
                  onChange={(e) => setHCostPackages(Number(e.target.value))} />
                
                </div>
                <div>
                  <label className="block text-xs text-slate-600 mb-1">Lab Investigations</label>
                  <input
                  id="cost-labs"
                  type="number"
                  className="w-full p-2 text-xs border border-slate-200 rounded-md bg-white font-mono"
                  value={h_costLab}
                  onChange={(e) => setHCostLab(Number(e.target.value))} />
                
                </div>
              </div>

              <div className="border-t border-slate-200 pt-3 flex justify-between items-center text-sm font-bold text-slate-800">
                <span>Total Accumulated Costs:</span>
                <span className="text-blue-600 font-mono">₹{h_totalCost.toLocaleString()}</span>
              </div>
            </div>
          </div>
        }

        {/* Render HEART FAILURE ASSESSMENT (CARE) */}
        {formType === 'HF' &&
        <div className="space-y-6">
            {/* Tab navigation for clean form pagination */}
            <div className="flex border-b border-slate-200 text-xs font-bold text-slate-500 overflow-x-auto">
              {['vitals', 'symptoms', 'overload', 'classification'].map((tab) =>
            <button
              id={`btn-form-tab-${tab}`}
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 border-b-2 uppercase tracking-wide whitespace-nowrap ${
              activeTab === tab ? 'border-teal-500 text-teal-600' : 'border-transparent hover:text-slate-700'}`
              }>
              
                  {tab}
                </button>
            )}
            </div>

            {activeTab === 'vitals' &&
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Assessment Date *</label>
                  <input
                id="hf-date"
                type="date"
                required
                className="w-full p-2 border border-slate-200 rounded-lg text-sm bg-white"
                value={hf_assessmentDate}
                onChange={(e) => setHfAssessmentDate(e.target.value)} />
              
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Height (cm)</label>
                  <input
                id="hf-height"
                type="number"
                className="w-full p-2 border border-slate-200 rounded-lg text-sm bg-white"
                value={v_height}
                onChange={(e) => setVHeight(Number(e.target.value))} />
              
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Weight (kg) *</label>
                  <input
                id="hf-weight"
                type="number"
                disabled={v_unableToWeigh}
                className="w-full p-2 border border-slate-200 rounded-lg text-sm bg-white disabled:bg-slate-100"
                value={v_weight}
                onChange={(e) => setVWeight(Number(e.target.value))} />
              
                  <div className="flex items-center gap-1.5 mt-1.5">
                    <input
                  id="hf-unweight"
                  type="checkbox"
                  checked={v_unableToWeigh}
                  onChange={(e) => setVUnableToWeigh(e.target.checked)} />
                
                    <label htmlFor="hf-unweight" className="text-xs text-slate-500">Unable to weigh</label>
                  </div>
                </div>

                {v_unableToWeigh &&
            <div className="col-span-3">
                    <label className="block text-xs font-bold text-slate-700 mb-1">Unable to Weigh Reason</label>
                    <input
                id="hf-unweight-reason"
                type="text"
                placeholder="E.g. Patient immobile, severe orthopnea"
                className="w-full p-2 border border-slate-200 rounded-lg text-sm bg-white"
                value={v_unableToWeighReason}
                onChange={(e) => setVUnableToWeighReason(e.target.value)} />
              
                  </div>
            }

                {v_bmi &&
            <div className="col-span-3 bg-teal-50 border border-teal-100 p-3 rounded-lg text-xs text-teal-800 flex items-center justify-between">
                    <span>EHR Calculation Engine:</span>
                    <span><strong>Patient BMI:</strong> {v_bmi} (Normal is 18.5 - 24.9)</span>
                  </div>
            }

                {/* Additional Clinical Vitals */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Heart Rate (bpm) *</label>
                  <input
                id="hf-hr"
                type="number"
                required
                className="w-full p-2 border border-slate-200 rounded-lg text-sm bg-white"
                value={v_hr}
                onChange={(e) => setVHr(Number(e.target.value))} />
              
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">HR Rhythm Variability *</label>
                  <select
                id="hf-hrvar"
                required
                className="w-full p-2 border border-slate-200 rounded-lg text-sm bg-white"
                value={v_hrVar}
                onChange={(e) => setVHrVar(e.target.value)}>
                
                    <option value="Regular">Regular (NSR)</option>
                    <option value="Irregular">Irregular (E.g. AFib, PVCs)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Respiratory Rate (bpm)</label>
                  <input
                id="hf-rr"
                type="number"
                className="w-full p-2 border border-slate-200 rounded-lg text-sm bg-white"
                value={v_rr}
                onChange={(e) => setVRr(Number(e.target.value))} />
              
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">O2 Saturation (%)</label>
                  <input
                id="hf-o2"
                type="number"
                max="100"
                className="w-full p-2 border border-slate-200 rounded-lg text-sm bg-white"
                value={v_o2}
                onChange={(e) => setVO2(Number(e.target.value))} />
              
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">BP Sitting (Systolic/Diastolic)</label>
                  <div className="flex gap-2">
                    <input
                  id="hf-bp-sys"
                  type="number"
                  placeholder="Sys"
                  className="w-1/2 p-2 border border-slate-200 rounded-lg text-sm bg-white"
                  value={v_bpSystolic}
                  onChange={(e) => setVBpSystolic(Number(e.target.value))} />
                
                    <input
                  id="hf-bp-dia"
                  type="number"
                  placeholder="Dia"
                  className="w-1/2 p-2 border border-slate-200 rounded-lg text-sm bg-white"
                  value={v_bpDiastolic}
                  onChange={(e) => setVBpDiastolic(Number(e.target.value))} />
                
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">BP Standing (Systolic/Diastolic)</label>
                  <div className="flex gap-2">
                    <input
                  id="hf-bp-stand-sys"
                  type="number"
                  placeholder="Sys"
                  className="w-1/2 p-2 border border-slate-200 rounded-lg text-sm bg-white"
                  value={v_bpStandingSystolic}
                  onChange={(e) => setVBpStandingSystolic(Number(e.target.value))} />
                
                    <input
                  id="hf-bp-stand-dia"
                  type="number"
                  placeholder="Dia"
                  className="w-1/2 p-2 border border-slate-200 rounded-lg text-sm bg-white"
                  value={v_bpStandingDiastolic}
                  onChange={(e) => setVBpStandingDiastolic(Number(e.target.value))} />
                
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Mental Status *</label>
                  <select
                id="hf-mental"
                required
                className="w-full p-2 border border-slate-200 rounded-lg text-sm bg-white"
                value={v_mental}
                onChange={(e) => setVMental(e.target.value)}>
                
                    <option value="Alert/Oriented">Alert/Oriented</option>
                    <option value="Confused">Confused</option>
                    <option value="Drowsy">Drowsy</option>
                  </select>
                </div>
              </div>
          }

            {activeTab === 'symptoms' &&
          <div className="space-y-4">
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Present Physical Symptoms</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {[
              { id: 'sym-dyspRest', label: 'Dyspnea at rest', val: hf_sym_dyspRest, set: setHfSymDyspRest },
              { id: 'sym-dyspEx', label: 'Dyspnea with exertion', val: hf_sym_dyspExert, set: setHfSymDyspExert },
              { id: 'sym-fat', label: 'Fatigue', val: hf_sym_fatigue, set: setHfSymFatigue },
              { id: 'sym-orth', label: 'Orthopnea', val: hf_sym_orthopnea, set: setHfSymOrthopnea },
              { id: 'sym-bloat', label: 'Loss of Appetite / Bloating', val: hf_sym_bloating, set: setHfSymBloating },
              { id: 'sym-decreased', label: 'Decreased Ex. Tolerance', val: hf_sym_decreasedEx, set: setHfSymDecreasedEx },
              { id: 'sym-pnd', label: 'Paroxysmal Nocturnal Dysp (PND)', val: hf_sym_pnd, set: setHfSymPnd },
              { id: 'sym-wheeze', label: 'Wheeze', val: hf_sym_wheeze, set: setHfSymWheeze },
              { id: 'sym-wgain', label: 'Sudden Weight Gain', val: hf_sym_wGain, set: setHfSymWGain },
              { id: 'sym-wloss', label: 'Unexplained Weight Loss', val: hf_sym_wLoss, set: setHfSymWLoss },
              { id: 'sym-syncope', label: 'Syncope (Fainting)', val: hf_sym_syncope, set: setHfSymSyncope },
              { id: 'sym-cramps', label: 'Muscle Cramps', val: hf_sym_cramps, set: setHfSymCramps },
              { id: 'sym-giddy', label: 'Giddiness / Lightheadedness', val: hf_sym_giddy, set: setHfSymGiddy }].
              map((sym) =>
              <div key={sym.id} className="flex items-center gap-2 p-2 bg-slate-50 border border-slate-100 rounded-lg">
                      <input
                  id={sym.id}
                  type="checkbox"
                  checked={sym.val}
                  onChange={(e) => sym.set(e.target.checked)} />
                
                      <label htmlFor={sym.id} className="text-xs text-slate-700 font-medium cursor-pointer">{sym.label}</label>
                    </div>
              )}
                </div>
              </div>
          }

            {activeTab === 'overload' &&
          <div className="space-y-4">
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Clinical Signs of Volume Overload</h4>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {[
              { id: 'over-edema', label: 'Peripheral edema', val: hf_over_edema, set: setHfOverEdema },
              { id: 'over-rales', label: 'Rales (Pulmonary)', val: hf_over_rales, set: setHfOverRales },
              { id: 'over-jvp', label: 'Elevated JVP (Jugular venous pressure)', val: hf_over_jvp, set: setHfOverJvp },
              { id: 'over-hepato', label: 'Hepatomegaly', val: hf_over_hepato, set: setHfOverHepato },
              { id: 'over-ascites', label: 'Ascites', val: hf_over_ascites, set: setHfOverAscites }].
              map((over) =>
              <div key={over.id} className="flex items-center gap-2 p-3 bg-slate-50 border border-slate-100 rounded-lg">
                      <input
                  id={over.id}
                  type="checkbox"
                  checked={over.val}
                  onChange={(e) => over.set(e.target.checked)} />
                
                      <label htmlFor={over.id} className="text-xs text-slate-700 font-medium cursor-pointer">{over.label}</label>
                    </div>
              )}
                </div>
              </div>
          }

            {activeTab === 'classification' &&
          <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Type of Heart Failure *</label>
                    <select
                  id="hf-type"
                  required
                  className="w-full p-2 border border-slate-200 rounded-lg text-sm bg-white"
                  value={hf_type}
                  onChange={(e) => setHfType(e.target.value)}>
                  
                      <option value="Unknown">Select Type...</option>
                      <option value="HFrEF">HFrEF (Heart Failure with reduced EF)</option>
                      <option value="HFpEF">HFpEF (Heart Failure with preserved EF)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">HF Stage (ACC/AHA) *</label>
                    <select
                  id="hf-stage"
                  required
                  className="w-full p-2 border border-slate-200 rounded-lg text-sm bg-white"
                  value={hf_stage}
                  onChange={(e) => setHfStage(e.target.value)}>
                  
                      <option value="Stage A">Stage A (At Risk)</option>
                      <option value="Stage B">Stage B (Pre-Heart Failure)</option>
                      <option value="Stage C">Stage C (Symptomatic HF)</option>
                      <option value="Stage D">Stage D (Advanced HF)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">NYHA Functional Class *</label>
                    <select
                  id="hf-nyha"
                  required
                  className="w-full p-2 border border-slate-200 rounded-lg text-sm bg-white"
                  value={hf_nyha}
                  onChange={(e) => setHfNyha(e.target.value)}>
                  
                      <option value="NYHA Class I">NYHA Class I (No limitation)</option>
                      <option value="NYHA Class II">NYHA Class II (Slight limitation)</option>
                      <option value="NYHA Class III">NYHA Class III (Marked limitation)</option>
                      <option value="NYHA Class IV">NYHA Class IV (Inability to carry out activity)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Atrial Fibrillation (AF) Status *</label>
                    <select
                  id="hf-af"
                  required
                  className="w-full p-2 border border-slate-200 rounded-lg text-sm bg-white"
                  value={hf_af}
                  onChange={(e) => setHfAf(e.target.value)}>
                  
                      <option value="NSR">Normal Sinus Rhythm (NSR)</option>
                      <option value="Paroxysmal">Paroxysmal AF</option>
                      <option value="Persistent">Persistent AF</option>
                      <option value="Permanent">Permanent AF</option>
                    </select>
                  </div>
                </div>

                {/* Etiology Multi-Checkboxes */}
                <div className="p-4 bg-slate-50 border rounded-xl space-y-4">
                  <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Heart Failure Etiology</h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Cardiovascular */}
                    <div className="space-y-2">
                      <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wide block">Cardiovascular Etiologies</span>
                      <div className="space-y-1.5 text-xs">
                        {['Ischemic', 'Dilated', 'Valvular', 'Toxic', 'Hypertension', 'Congenital', 'Myocarditis'].map((eti) =>
                    <label key={eti} className="flex items-center gap-2 cursor-pointer">
                            <input
                        type="checkbox"
                        checked={hf_etiology_cv.includes(eti)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setHfEtiologyCV([...hf_etiology_cv, eti]);
                          } else {
                            setHfEtiologyCV(hf_etiology_cv.filter((x) => x !== eti));
                          }
                        }} />
                      
                            <span>{eti}</span>
                          </label>
                    )}
                      </div>
                    </div>

                    {/* Non-Cardiac */}
                    <div className="space-y-2">
                      <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wide block">Non-Cardiac Etiologies</span>
                      <div className="space-y-1.5 text-xs">
                        {['Diabetes', 'Thyroid', 'Pregnancy', 'Renal', 'Infection', 'Chemotherapy', 'Alcohol/Drugs'].map((eti) =>
                    <label key={eti} className="flex items-center gap-2 cursor-pointer">
                            <input
                        type="checkbox"
                        checked={hf_etiology_non_cv.includes(eti)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setHfEtiologyNonCV([...hf_etiology_non_cv, eti]);
                          } else {
                            setHfEtiologyNonCV(hf_etiology_non_cv.filter((x) => x !== eti));
                          }
                        }} />
                      
                            <span>{eti}</span>
                          </label>
                    )}
                      </div>
                    </div>

                    {/* Pulmonary */}
                    <div className="space-y-2">
                      <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wide block">Pulmonary Etiologies</span>
                      <div className="space-y-1.5 text-xs">
                        {['COPD', 'Pulmonary Hypertension', 'Sleep Apnea', 'Pulmonary Embolism'].map((eti) =>
                    <label key={eti} className="flex items-center gap-2 cursor-pointer">
                            <input
                        type="checkbox"
                        checked={hf_etiology_pulm.includes(eti)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setHfEtiologyPulm([...hf_etiology_pulm, eti]);
                          } else {
                            setHfEtiologyPulm(hf_etiology_pulm.filter((x) => x !== eti));
                          }
                        }} />
                      
                            <span>{eti}</span>
                          </label>
                    )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* VT/VF Risk Assessment */}
                <div className="p-4 bg-slate-50 border rounded-xl space-y-3">
                  <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Sudden Cardiac Death & VT/VF Risk Stratification</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                    <label className="flex items-center gap-2 p-2.5 bg-white rounded-lg border cursor-pointer">
                      <input
                    type="checkbox"
                    checked={hf_risk_vtvf}
                    onChange={(e) => setHfRiskVtvf(e.target.checked)} />
                  
                      <span className="font-medium text-slate-700">Documented VT / VF</span>
                    </label>
                    <label className="flex items-center gap-2 p-2.5 bg-white rounded-lg border cursor-pointer">
                      <input
                    type="checkbox"
                    checked={hf_risk_syncope}
                    onChange={(e) => setHfRiskSyncope(e.target.checked)} />
                  
                      <span className="font-medium text-slate-700">Recurrent Syncope</span>
                    </label>
                    <label className="flex items-center gap-2 p-2.5 bg-white rounded-lg border cursor-pointer">
                      <input
                    type="checkbox"
                    checked={hf_risk_nsvt}
                    onChange={(e) => setHfRiskNsvt(e.target.checked)} />
                  
                      <span className="font-medium text-slate-700">Documented NSVT</span>
                    </label>
                    <div className="flex flex-col gap-1.5 p-2 bg-white rounded-lg border">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                      type="checkbox"
                      checked={hf_risk_pvcs}
                      onChange={(e) => setHfRiskPvcs(e.target.checked)} />
                    
                        <span className="font-medium text-slate-700">Documented PVCs</span>
                      </label>
                      {hf_risk_pvcs &&
                  <input
                    type="number"
                    placeholder="PVC Count"
                    className="w-full mt-1 p-1 border border-slate-200 rounded text-xs"
                    value={hf_risk_pvcCount}
                    onChange={(e) => setHfRiskPvcCount(Number(e.target.value))} />

                  }
                    </div>
                  </div>
                </div>

                {/* Device Therapy Details */}
                <div className="p-4 bg-slate-50 border rounded-xl space-y-4">
                  <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Active Device Therapy</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-1">Has Implanted Device? *</label>
                      <select
                    id="hf-dev-has"
                    required
                    className="w-full p-2 border border-slate-200 rounded-lg text-sm bg-white"
                    value={hf_dev_has}
                    onChange={(e) => setHfDevHas(e.target.value)}>
                    
                        <option value="No">No</option>
                        <option value="Yes">Yes</option>
                      </select>
                    </div>

                    {hf_dev_has === 'Yes' &&
                <>
                        <div>
                          <label className="block text-xs font-bold text-slate-600 mb-1">Device Type *</label>
                          <select
                      id="hf-dev-type"
                      required
                      className="w-full p-2 border border-slate-200 rounded-lg text-sm bg-white"
                      value={hf_dev_type}
                      onChange={(e) => setHfDevType(e.target.value)}>
                      
                            <option value="">Select Type...</option>
                            <option value="CRT-P">CRT-P (Cardiac Resynchronization Pacemaker)</option>
                            <option value="CRT-D">CRT-D (Cardiac Resynchronization Defibrillator)</option>
                            <option value="ICD-SC">ICD-SC (Single Chamber ICD)</option>
                            <option value="ICD-DC">ICD-DC (Dual Chamber ICD)</option>
                            <option value="Dual Chamber Pacer">Dual Chamber Pacemaker</option>
                            <option value="Single Chamber Pacer">Single Chamber Pacemaker</option>
                            <option value="Other">Other Device</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-600 mb-1">Device Brand / Model</label>
                          <input
                      id="hf-dev-brand"
                      type="text"
                      placeholder="E.g. Medtronic, Boston Scientific"
                      className="w-full p-2 border border-slate-200 rounded-lg text-sm bg-white"
                      value={hf_dev_brand}
                      onChange={(e) => setHfDevBrand(e.target.value)} />
                    
                        </div>
                      </>
                }
                  </div>
                </div>
              </div>
          }
          </div>
        }        {/* Render ACS EVENT (STEMI & NSTEMI) */}
        {(formType === 'STEMI' || formType === 'NSTEMI') &&
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">ACS Log Event Date *</label>
                <input
                id="acs-date"
                type="date"
                required
                className="w-full p-2 border border-slate-200 rounded-lg text-sm bg-white"
                value={acs_eventDate}
                onChange={(e) => setAcsEventDate(e.target.value)} />
              
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">ACS Number / ID *</label>
                <input
                id="acs-id"
                type="text"
                required
                className="w-full p-2 border border-slate-200 rounded-lg text-sm bg-white"
                value={acs_no}
                onChange={(e) => setAcsNo(e.target.value)} />
              
              </div>
            </div>

            {/* Presentation and Vital Signs */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-4">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Clinical Presentation & Vital Signs (On Admission)
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs mb-3">
                <label className="flex items-center gap-2 p-2 bg-white rounded border cursor-pointer">
                  <input type="checkbox" checked={acs_typical} onChange={(e) => setAcsTypical(e.target.checked)} />
                  <span className="font-semibold text-slate-700">Typical Angina</span>
                </label>
                <label className="flex items-center gap-2 p-2 bg-white rounded border cursor-pointer">
                  <input type="checkbox" checked={acs_atypical} onChange={(e) => setAcsAtypical(e.target.checked)} />
                  <span className="font-semibold text-slate-700">Atypical Chest Pain</span>
                </label>
                <label className="flex items-center gap-2 p-2 bg-white rounded border cursor-pointer">
                  <input type="checkbox" checked={acs_dysp} onChange={(e) => setAcsDysp(e.target.checked)} />
                  <span className="font-semibold text-slate-700">Breathlessness</span>
                </label>
                <label className="flex items-center gap-2 p-2 bg-white rounded border cursor-pointer">
                  <input type="checkbox" checked={acs_syncope} onChange={(e) => setAcsSyncope(e.target.checked)} />
                  <span className="font-semibold text-slate-700">Syncope / Pre-Syncope</span>
                </label>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Pulse Rate (bpm) *</label>
                  <input
                  type="number"
                  required
                  className="w-full p-2 text-sm bg-white border border-slate-200 rounded-lg font-mono"
                  value={acs_hr}
                  onChange={(e) => setAcsHr(Number(e.target.value))} />
                
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Systolic BP (mmHg) *</label>
                  <input
                  type="number"
                  required
                  className="w-full p-2 text-sm bg-white border border-slate-200 rounded-lg font-mono"
                  value={acs_sbp}
                  onChange={(e) => setAcsSbp(Number(e.target.value))} />
                
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Diastolic BP (mmHg) *</label>
                  <input
                  type="number"
                  required
                  className="w-full p-2 text-sm bg-white border border-slate-200 rounded-lg font-mono"
                  value={acs_dbp}
                  onChange={(e) => setAcsDbp(Number(e.target.value))} />
                
                </div>
              </div>
            </div>

            {/* TIMI Score points checklist */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-4">
              <div className="flex justify-between items-center">
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  TIMI Risk Stratification score ({formType === 'STEMI' ? 'STEMI Criteria' : 'NSTEMI Criteria'})
                </h4>
                <div className="px-3 py-1 bg-blue-600 text-white rounded text-xs font-black font-mono">
                  Calculated Score: {timiScore} Points
                </div>
              </div>

              {formType === 'STEMI' ?
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs text-slate-600">
                  <label className="flex items-center gap-2 p-2 bg-white rounded border cursor-pointer">
                    <input id="t-age75" type="checkbox" checked={acs_t_age75} onChange={(e) => setAcsTAge75(e.target.checked)} />
                    <span>Age &gt;= 75 yrs (+3 pts)</span>
                  </label>
                  <label className="flex items-center gap-2 p-2 bg-white rounded border cursor-pointer">
                    <input id="t-age65" type="checkbox" checked={acs_t_age65_74} onChange={(e) => setAcsTAge6574(e.target.checked)} />
                    <span>Age 65 to 74 (+2 pts)</span>
                  </label>
                  <label className="flex items-center gap-2 p-2 bg-white rounded border cursor-pointer">
                    <input id="t-history" type="checkbox" checked={acs_t_history} onChange={(e) => setAcsTHistory(e.target.checked)} />
                    <span>H/o DM / HTN / Angina (+1 pt)</span>
                  </label>
                  <label className="flex items-center gap-2 p-2 bg-white rounded border cursor-pointer">
                    <input id="t-sbp" type="checkbox" checked={acs_t_sbp100} onChange={(e) => setAcsTSbp100(e.target.checked)} />
                    <span>SBP &lt; 100 mmHg (+3 pts)</span>
                  </label>
                  <label className="flex items-center gap-2 p-2 bg-white rounded border cursor-pointer">
                    <input id="t-hr" type="checkbox" checked={acs_t_hr100} onChange={(e) => setAcsTHr100(e.target.checked)} />
                    <span>Heart Rate &gt; 100/min (+2 pts)</span>
                  </label>
                  <label className="flex items-center gap-2 p-2 bg-white rounded border cursor-pointer">
                    <input id="t-killip" type="checkbox" checked={acs_t_killip} onChange={(e) => setAcsTKillip(e.target.checked)} />
                    <span>Killip Class II to IV (+2 pts)</span>
                  </label>
                  <label className="flex items-center gap-2 p-2 bg-white rounded border cursor-pointer">
                    <input id="t-antmi" type="checkbox" checked={acs_t_antMI} onChange={(e) => setAcsTAntMI(e.target.checked)} />
                    <span>Ant MI / LBBB (+1 pt)</span>
                  </label>
                  <label className="flex items-center gap-2 p-2 bg-white rounded border cursor-pointer">
                    <input id="t-weight" type="checkbox" checked={acs_t_weight67} onChange={(e) => setAcsTWeight67(e.target.checked)} />
                    <span>Weight &lt; 67 kg (+1 pt)</span>
                  </label>
                  <label className="flex items-center gap-2 p-2 bg-white rounded border cursor-pointer">
                    <input id="t-reper" type="checkbox" checked={acs_t_reperfusion4h} onChange={(e) => setAcsTReperfusion4h(e.target.checked)} />
                    <span>Reperfusion &gt; 4 hrs (+1 pt)</span>
                  </label>
                </div> :

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs text-slate-600">
                  <label className="flex items-center gap-2 p-2 bg-white rounded border cursor-pointer">
                    <input id="n-age65" type="checkbox" checked={acs_n_age65} onChange={(e) => setAcsNAge65(e.target.checked)} />
                    <span>Age &gt;= 65 years (+1 pt)</span>
                  </label>
                  <label className="flex items-center gap-2 p-2 bg-white rounded border cursor-pointer">
                    <input id="n-chd" type="checkbox" checked={acs_n_chd} onChange={(e) => setAcsNChd(e.target.checked)} />
                    <span>At least 3 CHD risk factors (+1)</span>
                  </label>
                  <label className="flex items-center gap-2 p-2 bg-white rounded border cursor-pointer">
                    <input id="n-stenosis" type="checkbox" checked={acs_n_stenosis} onChange={(e) => setAcsNStenosis(e.target.checked)} />
                    <span>Prior Coronary Stenosis &gt;50% (+1)</span>
                  </label>
                  <label className="flex items-center gap-2 p-2 bg-white rounded border cursor-pointer">
                    <input id="n-st" type="checkbox" checked={acs_n_st} onChange={(e) => setAcsNSt(e.target.checked)} />
                    <span>ST deviation at admission (+1)</span>
                  </label>
                  <label className="flex items-center gap-2 p-2 bg-white rounded border cursor-pointer">
                    <input id="n-angina" type="checkbox" checked={acs_n_angina} onChange={(e) => setAcsNAngina(e.target.checked)} />
                    <span>At least 2 angina episodes last 24h (+1)</span>
                  </label>
                  <label className="flex items-center gap-2 p-2 bg-white rounded border cursor-pointer">
                    <input id="n-markers" type="checkbox" checked={acs_n_markers} onChange={(e) => setAcsNMarkers(e.target.checked)} />
                    <span>Elevated Cardiac Markers (+1)</span>
                  </label>
                  <label className="flex items-center gap-2 p-2 bg-white rounded border cursor-pointer">
                    <input id="n-asa" type="checkbox" checked={acs_n_asa} onChange={(e) => setAcsNAsa(e.target.checked)} />
                    <span>Aspirin Use in last 7 days (+1)</span>
                  </label>
                </div>
            }
            </div>

            {/* Anticoagulants and stay details */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-4">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Anticoagulant Therapy & stay risk factors</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Heparin Strategy *</label>
                  <select
                  className="w-full p-2 text-sm bg-white border border-slate-200 rounded-lg"
                  value={acs_heparin}
                  onChange={(e) => setAcsHeparin(e.target.value)}>
                  
                    <option value="None">None</option>
                    <option value="UFH i.v alone">UFH i.v alone</option>
                    <option value="UFH s.c alone">UFH s.c alone</option>
                    <option value="LMWH alone">LMWH alone</option>
                    <option value="UFH i.v+UFHs.c">UFH i.v + UFH s.c</option>
                    <option value="UFH i.v + LMWH">UFH i.v + LMWH</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">GP IIb/IIIa Inhibitor *</label>
                  <select
                  className="w-full p-2 text-sm bg-white border border-slate-200 rounded-lg"
                  value={acs_gp2b3a}
                  onChange={(e) => setAcsGp2b3a(e.target.value)}>
                  
                    <option value="No">No</option>
                    <option value="Yes">Yes</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Bivalirudin *</label>
                  <select
                  className="w-full p-2 text-sm bg-white border border-slate-200 rounded-lg"
                  value={acs_bivalirudin}
                  onChange={(e) => setAcsBivalirudin(e.target.value)}>
                  
                    <option value="No">No</option>
                    <option value="Yes">Yes</option>
                  </select>
                </div>
              </div>

              <div className="border-t border-slate-200 pt-3">
                <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider block mb-2">Other Stay Complications / Risk factors</span>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-xs">
                  <label className="flex items-center gap-2 p-2 bg-white rounded border cursor-pointer">
                    <input type="checkbox" checked={acs_rf_lvf} onChange={(e) => setAcsRfLvf(e.target.checked)} />
                    <span>Left Ventricular Failure (LVF)</span>
                  </label>
                  <label className="flex items-center gap-2 p-2 bg-white rounded border cursor-pointer">
                    <input type="checkbox" checked={acs_rf_vtvf} onChange={(e) => setAcsRfVtvf(e.target.checked)} />
                    <span>VT/VF during stay</span>
                  </label>
                  <label className="flex items-center gap-2 p-2 bg-white rounded border cursor-pointer">
                    <input type="checkbox" checked={acs_rf_bbb} onChange={(e) => setAcsRfBbb(e.target.checked)} />
                    <span>BBB / CHB</span>
                  </label>
                  <label className="flex items-center gap-2 p-2 bg-white rounded border cursor-pointer">
                    <input type="checkbox" checked={acs_rf_bnpe} onChange={(e) => setAcsRfBnpe(e.target.checked)} />
                    <span>Elevated BNP</span>
                  </label>
                  <label className="flex items-center gap-2 p-2 bg-white rounded border cursor-pointer">
                    <input type="checkbox" checked={acs_rf_crpe} onChange={(e) => setAcsRfCrpe(e.target.checked)} />
                    <span>Elevated CRP</span>
                  </label>
                </div>
              </div>
            </div>

            {/* Treatment Strategy and conditionals */}
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Reperfusion Strategy / Treatment Strategy *</label>
                <select
                id="acs-strategy"
                required
                className="w-full p-2 border border-slate-200 rounded-lg text-sm bg-white"
                value={acs_strategy}
                onChange={(e) => setAcsStrategy(e.target.value)}>
                
                  <option value="Conservative">Conservative Medical Management</option>
                  <option value="PAMI">PAMI (Primary Angioplasty / PTCA)</option>
                  <option value="Thrombolysis">Thrombolysis</option>
                </select>
              </div>

              {/* Conditional Primary Angioplasty (PAMI) Segment */}
              {acs_strategy === 'PAMI' &&
            <div className="p-4 bg-teal-50/50 border border-teal-100 rounded-xl space-y-4 animate-fadeIn">
                  <h5 className="text-xs font-bold text-teal-800 uppercase tracking-wider">Primary PCI (PAMI) Details</h5>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">Door to Balloon Time (mins) *</label>
                      <input
                    id="pami-d2b"
                    type="number"
                    required
                    className="w-full p-2 text-sm bg-white border border-slate-200 rounded-lg font-mono"
                    value={pami_d2b}
                    onChange={(e) => setPamiD2b(Number(e.target.value))} />
                  
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">Vessel Dilated Segment</label>
                      <input
                    id="pami-segment"
                    type="text"
                    placeholder="E.g. Proximal LAD"
                    className="w-full p-2 text-sm bg-white border border-slate-200 rounded-lg"
                    value={pami_segment}
                    onChange={(e) => setPamiSegment(e.target.value)} />
                  
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">Stent Implantation</label>
                      <select
                    id="pami-stent"
                    className="w-full p-2 text-sm bg-white border border-slate-200 rounded-lg"
                    value={pami_stent}
                    onChange={(e) => setPamiStent(e.target.value)}>
                    
                        <option value="None">None (Balloon Only)</option>
                        <option value="DES">DES (Drug-Eluting Stent)</option>
                        <option value="BMS">BMS (Bare Metal Stent)</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">Stent Diameter (mm)</label>
                      <input
                    type="number"
                    step="0.1"
                    placeholder="E.g. 3.0"
                    className="w-full p-2 text-sm bg-white border border-slate-200 rounded-lg font-mono"
                    value={pami_dia}
                    onChange={(e) => setPamiDia(Number(e.target.value))} />
                  
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">Stent Length (mm)</label>
                      <input
                    type="number"
                    placeholder="E.g. 18"
                    className="w-full p-2 text-sm bg-white border border-slate-200 rounded-lg font-mono"
                    value={pami_len}
                    onChange={(e) => setPamiLen(Number(e.target.value))} />
                  
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">Thrombosuction Performed? *</label>
                      <select
                    className="w-full p-2 text-sm bg-white border border-slate-200 rounded-lg"
                    value={pami_thrombosuction}
                    onChange={(e) => setPamiThrombosuction(e.target.value)}>
                    
                        <option value="Not done">Not done</option>
                        <option value="Done">Done</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">Procedural Success *</label>
                      <select
                    className="w-full p-2 text-sm bg-white border border-slate-200 rounded-lg"
                    value={pami_success}
                    onChange={(e) => setPamiSuccess(e.target.value)}>
                    
                        <option value="Yes">Yes</option>
                        <option value="No">No</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">Post Procedure TIMI Flow *</label>
                      <select
                    className="w-full p-2 text-sm bg-white border border-slate-200 rounded-lg"
                    value={pami_timi}
                    onChange={(e) => setPamiTimi(e.target.value)}>
                    
                        <option value="0">TIMI 0</option>
                        <option value="1">TIMI 1</option>
                        <option value="2">TIMI 2</option>
                        <option value="3">TIMI 3</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <span className="text-xs font-bold text-slate-700 block">Vessel(s) Treated</span>
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs">
                      {['LMCA', 'LAD', 'LCX', 'RCA', 'Graft'].map((vessel) =>
                  <label key={vessel} className="flex items-center gap-2 p-2 bg-white rounded border cursor-pointer">
                          <input
                      type="checkbox"
                      checked={pami_vessels.includes(vessel)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setPamiVessels([...pami_vessels, vessel]);
                        } else {
                          setPamiVessels(pami_vessels.filter((x) => x !== vessel));
                        }
                      }} />
                    
                          <span>{vessel}</span>
                        </label>
                  )}
                    </div>
                  </div>
                </div>
            }

              {/* Conditional Thrombolysis Segment */}
              {acs_strategy === 'Thrombolysis' &&
            <div className="p-4 bg-red-50/50 border border-red-100 rounded-xl space-y-4 animate-fadeIn">
                  <h5 className="text-xs font-bold text-red-800 uppercase tracking-wider">Thrombolysis Details</h5>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">Door to Needle Time (mins) *</label>
                      <input
                    id="tb-d2n"
                    type="number"
                    required
                    className="w-full p-2 text-sm bg-white border border-slate-200 rounded-lg font-mono"
                    value={tb_d2n}
                    onChange={(e) => setTbD2n(Number(e.target.value))} />
                  
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">Thrombolytic Drug *</label>
                      <select
                    id="tb-drug"
                    required
                    className="w-full p-2 text-sm bg-white border border-slate-200 rounded-lg"
                    value={tb_drug}
                    onChange={(e) => setTbDrug(e.target.value)}>
                    
                        <option value="None">Select Drug...</option>
                        <option value="STK">STK (Streptokinase)</option>
                        <option value="UK">UK (Urokinase)</option>
                        <option value="Reteplase">Reteplase</option>
                        <option value="Tenecteplase">Tenecteplase</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">Dose Administered</label>
                      <input
                    id="tb-dose"
                    type="text"
                    placeholder="E.g. 1.5 Million Units"
                    className="w-full p-2 text-sm bg-white border border-slate-200 rounded-lg"
                    value={tb_dose}
                    onChange={(e) => setTbDose(e.target.value)} />
                  
                    </div>
                  </div>
                </div>
            }
            </div>
          </div>
        }

        {/* Render STS CABG PROCEDURE */}
        {formType === 'CABG' &&
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Date of Surgery *</label>
                <input
                id="cabg-date"
                type="date"
                required
                className="w-full p-2 border border-slate-200 rounded-lg text-sm bg-white"
                value={c_date}
                onChange={(e) => setCDate(e.target.value)} />
              
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Operating Surgeon *</label>
                <input
                id="cabg-surgeon"
                type="text"
                required
                className="w-full p-2 border border-slate-200 rounded-lg text-sm bg-white"
                value={c_surgeon}
                onChange={(e) => setCSurgeon(e.target.value)} />
              
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Procedure Status (Urgency) *</label>
                <select
                id="cabg-status"
                required
                className="w-full p-2 border border-slate-200 rounded-lg text-sm bg-white"
                value={c_status}
                onChange={(e) => setCStatus(e.target.value)}>
                
                  <option value="Elective">Elective</option>
                  <option value="Urgent">Urgent (E.g. AMI, unstable angina)</option>
                  <option value="Emergent">Emergent</option>
                  <option value="Emergent Salvage">Emergent Salvage</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">CPB Utilization *</label>
                <select
                id="cabg-cpb"
                required
                className="w-full p-2 border border-slate-200 rounded-lg text-sm bg-white"
                value={c_cpb}
                onChange={(e) => setCCpb(e.target.value)}>
                
                  <option value="Full">Full Cardiopulmonary Bypass</option>
                  <option value="Combination">Combination</option>
                  <option value="None">None (Off-pump CABG / OPCAB)</option>
                </select>
              </div>
              {c_cpb !== 'None' &&
            <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Perfusion Time (minutes) *</label>
                  <input
                id="cabg-perf"
                type="number"
                required
                className="w-full p-2 border border-slate-200 rounded-lg text-sm bg-white"
                value={c_perf}
                onChange={(e) => setCPerf(Number(e.target.value))} />
              
                </div>
            }
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Aortic Occlusion Type *</label>
                <select
                id="cabg-occl"
                required
                className="w-full p-2 border border-slate-200 rounded-lg text-sm bg-white"
                value={c_occl}
                onChange={(e) => setCOccl(e.target.value)}>
                
                  <option value="Aortic Crossclamp">Aortic Crossclamp</option>
                  <option value="Balloon Occlusion">Balloon Occlusion</option>
                  <option value="None">None</option>
                </select>
              </div>
            </div>

            {/* Section J: Coronary Bypass conduit details - Conditional */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-xs font-bold text-slate-700">Do Coronary Artery Bypass? (Section J)</label>
                <select
                id="cabg-hasbypass"
                className="p-1 text-xs border border-slate-200 rounded bg-white"
                value={c_hasBypass}
                onChange={(e) => setCHasBypass(e.target.value)}>
                
                  <option value="Yes">Yes (Display Section J)</option>
                  <option value="No">No</option>
                </select>
              </div>

              {c_hasBypass === 'Yes' &&
            <div className="p-4 bg-purple-50/50 border border-purple-100 rounded-xl space-y-4 animate-fadeIn">
                  <h5 className="text-xs font-bold text-purple-800 uppercase tracking-wider">Coronary Bypass Graft details</h5>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <label className="block text-xs text-slate-600 mb-1">Arterial Distal Anastomoses</label>
                      <input
                    id="graft-art"
                    type="number"
                    className="w-full p-2 text-xs border border-slate-200 rounded-md bg-white"
                    value={c_distArt}
                    onChange={(e) => setCDistArt(Number(e.target.value))} />
                  
                    </div>
                    <div>
                      <label className="block text-xs text-slate-600 mb-1">Venous Distal Anastomoses</label>
                      <input
                    id="graft-ven"
                    type="number"
                    className="w-full p-2 text-xs border border-slate-200 rounded-md bg-white"
                    value={c_distVen}
                    onChange={(e) => setCDistVen(Number(e.target.value))} />
                  
                    </div>
                    <div>
                      <label className="block text-xs text-slate-600 mb-1">IMAs Used Grafts</label>
                      <select
                    id="graft-imas"
                    className="w-full p-2 text-xs border border-slate-200 rounded-md bg-white"
                    value={c_imas}
                    onChange={(e) => setCImas(e.target.value)}>
                    
                        <option value="Left IMA">Left IMA Only</option>
                        <option value="Right IMA">Right IMA Only</option>
                        <option value="Both IMAs">Both IMAs (LIMA + RIMA)</option>
                        <option value="No IMA">No IMA</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs text-slate-600 mb-1">Radial Artery Used</label>
                      <select
                    id="graft-radial"
                    className="w-full p-2 text-xs border border-slate-200 rounded-md bg-white"
                    value={c_radial}
                    onChange={(e) => setCRadial(e.target.value)}>
                    
                        <option value="No Radial">No Radial</option>
                        <option value="Left Radial">Left Radial</option>
                        <option value="Right Radial">Right Radial</option>
                        <option value="Both Radials">Both Radials</option>
                      </select>
                    </div>
                  </div>

                  {/* Anastomotic Assistive Devices */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Anastomotic Assistive Devices *</label>
                    <select
                  className="w-full p-2 text-xs bg-white border border-slate-200 rounded-lg"
                  value={c_anastomoticDevices}
                  onChange={(e) => setCAnastomoticDevices(e.target.value)}>
                  
                      <option value="None">None</option>
                      <option value="Sutureless Connector">Sutureless Connector</option>
                      <option value="Magnetic Device">Magnetic Device</option>
                      <option value="Other Assistive Device">Other Assistive Device</option>
                    </select>
                  </div>
                </div>
            }
            </div>

            {/* IABP and Intraoperative Blood Products */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-4">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Devices & Consumables (IABP / Blood Products)</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Intra-Aortic Balloon Pump (IABP) Used? *</label>
                  <select
                  className="w-full p-2 text-sm bg-white border border-slate-200 rounded-lg"
                  value={c_hasIABP ? 'Yes' : 'No'}
                  onChange={(e) => setCHasIABP(e.target.value === 'Yes')}>
                  
                    <option value="No">No</option>
                    <option value="Yes">Yes</option>
                  </select>
                </div>
                {c_hasIABP &&
              <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">IABP Insertion Timing *</label>
                    <select
                  className="w-full p-2 text-sm bg-white border border-slate-200 rounded-lg"
                  value={c_iABPTiming}
                  onChange={(e) => setCIABPTiming(e.target.value)}>
                  
                      <option value="Pre-operative">Pre-operative</option>
                      <option value="Intra-operative">Intra-operative</option>
                      <option value="Post-operative">Post-operative</option>
                    </select>
                  </div>
              }
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Intraoperative Blood Products Transfused *</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
                  {['RBC', 'FFP', 'Platelets', 'Cryoprecipitate'].map((prod) =>
                <label key={prod} className="flex items-center gap-2 p-2 bg-white rounded border cursor-pointer">
                      <input
                    type="checkbox"
                    checked={c_bloodProducts.includes(prod)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setCBloodProducts([...c_bloodProducts, prod]);
                      } else {
                        setCBloodProducts(c_bloodProducts.filter((x) => x !== prod));
                      }
                    }} />
                  
                      <span>{prod}</span>
                    </label>
                )}
                </div>
              </div>
            </div>

            {/* Valve Surgery Segment */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-4">
              <div className="flex justify-between items-center">
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Concomitant Valve Operation</h4>
                <select
                className="p-1 text-xs border border-slate-200 rounded bg-white font-semibold"
                value={c_hasValve ? 'Yes' : 'No'}
                onChange={(e) => setCHasValve(e.target.value === 'Yes')}>
                
                  <option value="No">No Valve Op</option>
                  <option value="Yes">Yes (Valve Op Performed)</option>
                </select>
              </div>

              {c_hasValve &&
            <div className="grid grid-cols-1 md:grid-cols-5 gap-3 text-xs animate-fadeIn">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Target Valve</label>
                    <select
                  className="w-full p-1.5 border border-slate-200 rounded bg-white"
                  value={c_valveType}
                  onChange={(e) => setCValveType(e.target.value)}>
                  
                      <option value="Aortic">Aortic Valve</option>
                      <option value="Mitral">Mitral Valve</option>
                      <option value="Tricuspid">Tricuspid Valve</option>
                      <option value="Pulmonary">Pulmonary Valve</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Implant Type</label>
                    <select
                  className="w-full p-1.5 border border-slate-200 rounded bg-white"
                  value={c_valveImplantType}
                  onChange={(e) => setCValveImplantType(e.target.value)}>
                  
                      <option value="Mechanical">Mechanical Valve</option>
                      <option value="Bioprosthetic">Bioprosthetic (Tissue)</option>
                      <option value="Repair (No Implant)">Repair (Ring/Sutures)</option>
                    </select>
                  </div>
                  <div className="col-span-2">
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Valve Brand / Model</label>
                    <input
                  type="text"
                  placeholder="E.g. Carpentier-Edwards Magna"
                  className="w-full p-1.5 border border-slate-200 rounded bg-white"
                  value={c_valveBrand}
                  onChange={(e) => setCValveBrand(e.target.value)} />
                
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Valve Size (mm)</label>
                    <input
                  type="number"
                  placeholder="Size"
                  className="w-full p-1.5 border border-slate-200 rounded bg-white font-mono"
                  value={c_valveSize}
                  onChange={(e) => setCValveSize(Number(e.target.value))} />
                
                  </div>
                </div>
            }
            </div>

            {/* Ventricular Assist Devices (VAD) */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-4">
              <div className="flex justify-between items-center">
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Ventricular Assist Device (VAD) / Mechanical Support</h4>
                <select
                className="p-1 text-xs border border-slate-200 rounded bg-white font-semibold"
                value={c_hasVAD ? 'Yes' : 'No'}
                onChange={(e) => setCHasVAD(e.target.value === 'Yes')}>
                
                  <option value="No">No VAD Support</option>
                  <option value="Yes">Yes (VAD Implemented)</option>
                </select>
              </div>

              {c_hasVAD &&
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs animate-fadeIn">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">VAD Indication</label>
                    <select
                  className="w-full p-1.5 border border-slate-200 rounded bg-white"
                  value={c_vadIndication}
                  onChange={(e) => setCVadIndication(e.target.value)}>
                  
                      <option value="Bridge to Transplant">Bridge to Transplant</option>
                      <option value="Destination Therapy">Destination Therapy</option>
                      <option value="Bridge to Recovery">Bridge to Recovery</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">VAD Device Type</label>
                    <select
                  className="w-full p-1.5 border border-slate-200 rounded bg-white"
                  value={c_vadType}
                  onChange={(e) => setCVadType(e.target.value)}>
                  
                      <option value="LVAD">LVAD (Left Ventricle)</option>
                      <option value="RVAD">RVAD (Right Ventricle)</option>
                      <option value="BiVAD">BiVAD (Bilateral Ventricles)</option>
                    </select>
                  </div>
                  <div className="col-span-2">
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Target Flow Rate (L/min)</label>
                    <input
                  type="number"
                  step="0.1"
                  placeholder="E.g. 4.5"
                  className="w-full p-1.5 border border-slate-200 rounded bg-white font-mono"
                  value={c_vadFlowRate}
                  onChange={(e) => setCVadFlowRate(Number(e.target.value))} />
                
                  </div>
                </div>
            }
            </div>

            {/* Surgical Outcomes and Mortality */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-4">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Post-Operative Complications & Quality Indicators</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <label className="flex items-center gap-2.5 p-3 bg-white rounded-lg border cursor-pointer">
                  <input
                  type="checkbox"
                  checked={c_reexploration}
                  onChange={(e) => setCReexploration(e.target.checked)} />
                
                  <div>
                    <span className="block font-bold text-xs text-slate-700">Surgical Re-exploration Needed</span>
                    <span className="block text-[10px] text-slate-500">For bleeding, cardiac tamponade, or graft dysfunction</span>
                  </div>
                </label>

                <label className="flex items-center gap-2.5 p-3 bg-white rounded-lg border cursor-pointer">
                  <input
                  type="checkbox"
                  checked={c_surgicalMortality}
                  onChange={(e) => setCSurgicalMortality(e.target.checked)} />
                
                  <div>
                    <span className="block font-bold text-xs text-red-700">Operative / 30-day Mortality Recorded</span>
                    <span className="block text-[10px] text-slate-500">Includes deaths during index admission or within 30 days post-op</span>
                  </div>
                </label>
              </div>
            </div>
          </div>
        }

        {/* Render FOLLOW UP */}
        {formType === 'Follow-up' &&
        <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Follow-up Interval *</label>
                <select
                id="fol-interval"
                required
                className="w-full p-2 border border-slate-200 rounded-lg text-sm bg-white"
                value={f_interval}
                onChange={(e) => setFInterval(e.target.value)}>
                
                  <option value="1-month">1-month Follow-up</option>
                  <option value="3-month">3-month Follow-up</option>
                  <option value="6-month">6-month Follow-up</option>
                  <option value="12-month">12-month Follow-up</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Date of Visit *</label>
                <input
                id="fol-date"
                type="date"
                required
                className="w-full p-2 border border-slate-200 rounded-lg text-sm bg-white"
                value={f_date}
                onChange={(e) => setFDate(e.target.value)} />
              
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Recurrent Angina Present? *</label>
                <select
                id="fol-angina"
                required
                className="w-full p-2 border border-slate-200 rounded-lg text-sm bg-white"
                value={f_angina}
                onChange={(e) => setFAngina(e.target.value)}>
                
                  <option value="No">No Angina Symptoms</option>
                  <option value="Yes">Yes (Recurrent ischemia)</option>
                </select>
              </div>
            </div>
          </div>
        }

        {/* Render LABORATORY */}
        {formType === 'Lab' &&
        <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Result Date *</label>
                <input
                id="lab-date"
                type="date"
                required
                className="w-full p-2 border border-slate-200 rounded-lg text-sm bg-white"
                value={l_date}
                onChange={(e) => setLDate(e.target.value)} />
              
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Serum Potassium (mEq/L) *</label>
                <input
                id="lab-k"
                type="number"
                step="0.1"
                required
                className="w-full p-2 border border-slate-200 rounded-lg text-sm bg-white font-mono"
                value={l_k}
                onChange={(e) => setLK(Number(e.target.value))} />
              
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Serum Creatinine (mg/dL) *</label>
                <input
                id="lab-creat"
                type="number"
                step="0.01"
                required
                className="w-full p-2 border border-slate-200 rounded-lg text-sm bg-white font-mono"
                value={l_creat}
                onChange={(e) => setLCreat(Number(e.target.value))} />
              
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">BNP Level (pg/mL) - Heart Failure Specific</label>
                <input
                id="lab-bnp"
                type="number"
                placeholder="E.g. 150 (elevated in HF)"
                className="w-full p-2 border border-slate-200 rounded-lg text-sm bg-white font-mono"
                value={l_bnp}
                onChange={(e) => setLBNP(Number(e.target.value))} />
              
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Troponin-I Level (ng/mL) - ACS Specific</label>
                <input
                id="lab-trop"
                type="number"
                step="0.01"
                placeholder="E.g. 1.25 (positive in ACS)"
                className="w-full p-2 border border-slate-200 rounded-lg text-sm bg-white font-mono"
                value={l_trop}
                onChange={(e) => setLTrop(Number(e.target.value))} />
              
              </div>
            </div>
          </div>
        }

        {/* Render DIAGNOSTIC INVESTIGATION */}
        {formType === 'Investigation' &&
        <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Diagnostic Report Type *</label>
                <select
                id="inv-type"
                required
                className="w-full p-2 border border-slate-200 rounded-lg text-sm bg-white"
                value={i_type}
                onChange={(e) => setIType(e.target.value)}>
                
                  <option value="ECG">ECG (Electrocardiography)</option>
                  <option value="ECHO">ECHO (Echocardiography)</option>
                  <option value="Chest X-Ray">Chest X-Ray</option>
                  <option value="Stress Test">Cardiac Stress Testing</option>
                  <option value="Angiogram">Coronary Angiography</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Date of Test *</label>
                <input
                id="inv-date"
                type="date"
                required
                className="w-full p-2 border border-slate-200 rounded-lg text-sm bg-white"
                value={i_date}
                onChange={(e) => setIDate(e.target.value)} />
              
              </div>
            </div>

            {/* Conditional ECG Sub-Panel */}
            {i_type === 'ECG' &&
          <div className="p-4 bg-slate-50 border rounded-xl space-y-4 animate-fadeIn">
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">ECG Parameters</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-slate-600 mb-1">Heart Rate (bpm)</label>
                    <input
                  id="ecg-hr"
                  type="number"
                  className="w-full p-2 text-xs border rounded bg-white"
                  value={i_ecg_hr}
                  onChange={(e) => setIEcgHr(Number(e.target.value))} />
                
                  </div>
                  <div>
                    <label className="block text-xs text-slate-600 mb-1">ECG Rhythm</label>
                    <input
                  id="ecg-rhythm"
                  type="text"
                  placeholder="NSR, Atrial Fibrillation"
                  className="w-full p-2 text-xs border rounded bg-white"
                  value={i_ecg_rhythm}
                  onChange={(e) => setIEcgRhythm(e.target.value)} />
                
                  </div>
                </div>
              </div>
          }

            {/* Conditional ECHO Sub-Panel */}
            {i_type === 'ECHO' &&
          <div className="p-4 bg-slate-50 border rounded-xl space-y-4 animate-fadeIn">
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Echocardiography Parameters</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-slate-600 mb-1">Ejection Fraction (EF%) *</label>
                    <input
                  id="echo-ef"
                  type="number"
                  required
                  className="w-full p-2 text-xs border rounded bg-white font-mono"
                  value={i_echo_ef}
                  onChange={(e) => setIEchoEf(Number(e.target.value))} />
                
                  </div>
                  <div>
                    <label className="block text-xs text-slate-600 mb-1">Regional Wall Motion Abnormality (RWMA)</label>
                    <input
                  id="echo-rwma"
                  type="text"
                  placeholder="E.g. LAD territory, Hypokinesia"
                  className="w-full p-2 text-xs border rounded bg-white"
                  value={i_echo_rwma}
                  onChange={(e) => setIEchoRwma(e.target.value)} />
                
                  </div>
                </div>
              </div>
          }
          </div>
        }

        {/* Draft/Complete controls & save/cancel buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-slate-100 pt-6">
          <div className="flex items-center gap-2">
            <input
              id="chk-draft"
              type="checkbox"
              className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500"
              checked={isDraft}
              onChange={(e) => setIsDraft(e.target.checked)} />
            
            <div className="text-left">
              <label htmlFor="chk-draft" className="text-xs font-bold text-slate-700 cursor-pointer flex items-center gap-1">
                <Bookmark className="w-3.5 h-3.5 text-amber-500" />
                <span>Save Registry Entry as Draft</span>
              </label>
              <span className="text-[10px] text-slate-400 block mt-0.5">Draft entries bypass immediate completeness rules.</span>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              id="btn-cancel-form"
              type="button"
              onClick={onCancel}
              className="w-full sm:w-auto px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-lg text-xs font-bold">
              
              Cancel
            </button>
            <button
              id="btn-submit-form"
              type="submit"
              className="w-full sm:w-auto px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold shadow-sm">
              
              Verify & Submit Registry
            </button>
          </div>
        </div>

      </form>
    </div>);

}