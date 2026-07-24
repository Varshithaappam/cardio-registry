const db = require("../config/db");
const hfModel = require("../models/hfModel");

/**
 * Format an HF registry number from the database insert ID.
 * Example: 1 -> HF00001
 */
function formatRegistryNumber(id) {
    return `HF${String(id).padStart(5, '0')}`;
}

async function saveHfAssessment(data) {
    const conn = await db.getConnection();
    try {
        await conn.beginTransaction();

        // 1. Insert hf_registry with a placeholder and then update it with the final number
        const hf_id = await hfModel.insertHfRegistry(conn, {
            patient_id: data.patientId,
            hf_registry_no: 'HF00000'
        });
        const hf_registry_no = formatRegistryNumber(hf_id);
        await conn.execute(
            "UPDATE hf_registry SET hf_registry_no = ? WHERE hf_id = ?",
            [hf_registry_no, hf_id]
        );

        // Update pre-uploaded documents to final hf_id
        if (data.tempHfId) {
            await conn.execute(
                "UPDATE hf_patient_documents SET hf_id = ? WHERE hf_id = ?",
                [hf_id, data.tempHfId]
            );
        }

        const withHfId = (obj) => ({ ...obj, hf_id });

        // 2. Insert hf_administrative
        const adminData = {
            assessed_by: data.assessed_by,
            assessment_date: data.assessmentDate,
            care_mr_no: data.patient?.mrNo || 'Unknown',
            visit_type: data.visitType || 'Outpatient',
            address: data.patient?.address,
            education_level: data.patient?.highestEducation,
            monthly_income: data.patient?.monthlyIncome ? Number(data.patient.monthlyIncome) : null,
            occupation: data.patient?.occupation,
            caregiver_name: data.patient?.caregiverName,
            caregiver_relationship: data.patient?.caregiverRelationship,
            caregiver_phone: data.patient?.caregiverPhone,
            insurance_mode: data.patient?.insuranceMode,
            visit_date: data.assessmentDate,
            discharge_date: data.inpatientDetails?.dischargeDate,
            treating_cardiologist: data.inpatientDetails?.treatingCardiologist,
            referring_doctor: data.inpatientDetails?.referringDoctor,
            referred_from: data.patient?.referredFrom || data.inpatientDetails?.referredFrom || null,
            present_diagnosis: data.patient?.presentDiagnosis,
            myocardial_ischemia: data.inpatientDetails?.precipitatingFactors?.includes('Myocardial ischemia') ? 'Yes' : 'No',
            atrial_fibrillation: data.inpatientDetails?.precipitatingFactors?.includes('Atrial fibrillation') ? 'Yes' : 'No',
            bradyarrhythmia: data.inpatientDetails?.precipitatingFactors?.includes('Bradyarrhythmia') ? 'Yes' : 'No',
            ventricular_tachycardia: data.inpatientDetails?.precipitatingFactors?.includes('Ventricular tachycardia') ? 'Yes' : 'No',
            uncontrolled_hypertension: data.inpatientDetails?.precipitatingFactors?.includes('Uncontrolled hypertension') ? 'Yes' : 'No',
            infection: data.inpatientDetails?.precipitatingFactors?.includes('Infection') ? 'Yes' : 'No',
            renal_failure: data.inpatientDetails?.precipitatingFactors?.includes('Renal failure') ? 'Yes' : 'No',
            anaemia: data.inpatientDetails?.precipitatingFactors?.includes('Anaemia') ? 'Yes' : 'No',
            medication_non_adherence: data.inpatientDetails?.precipitatingFactors?.includes('Medication non adherence') ? 'Yes' : 'No',
            excessive_salt_intake: data.inpatientDetails?.precipitatingFactors?.includes('Excessive salt intake') ? 'Yes' : 'No',
            excessive_water_ingestion: data.inpatientDetails?.precipitatingFactors?.includes('Excessive water ingestion') ? 'Yes' : 'No',
            progressive_worsening: data.inpatientDetails?.precipitatingFactors?.includes('Progressive worsening') ? 'Yes' : 'No',
            precipitating_other: data.inpatientDetails?.otherPrecipitatingFactor,
            other_admission_reason: data.inpatientDetails?.nonHfAdmissionReason,
            hospitalization_days: data.inpatientDetails?.daysHospitalized ? Number(data.inpatientDetails.daysHospitalized) : null
        };
        await hfModel.insertHfAdministrative(conn, withHfId(adminData));

        // 3. Insert hf_initial_assessment
        const initialData = {
            assessed_by: data.assessed_by,
            assessment_date: data.assessmentDate,
            previous_diagnosis: data.previous_diagnosis,
            history_cabg: data.history_cabg,
            history_ptca: data.history_ptca,
            history_stroke: data.history_stroke,
            history_major_bleed: data.history_major_bleed,
            history_thrombolysis: data.history_thrombolysis,
            history_past_mi: data.history_past_mi,
            past_mi_years_ago: data.past_mi_years_ago ? Number(data.past_mi_years_ago) : null,
            past_mi_location: data.past_mi_location,
            history_other: data.history_other,
            previous_hf_hospitalization: data.previous_hf_hospitalization,
            recent_hospitalization_dates: data.recent_hospitalization_dates,
            recent_hospitalization_reasons: data.recent_hospitalization_reasons,
            documented_vt_vf: data.documented_vt_vf,
            documented_pvcs: data.documented_pvcs,
            complaints_syncope_presyncope: data.complaints_syncope || 'No',
            pvc_count: data.pvc_count ? Number(data.pvc_count) : null,
            pvc_frequency: data.pvc_frequency,
            documented_nsvt: data.documented_nsvt,
            nsvt_frequency: data.nsvt_frequency,
            weight: data.weight ? Number(data.weight) : null,
            unable_to_weigh: data.unable_to_weigh,
            unable_to_weigh_reason: data.unable_to_weigh_reason,
            height: data.height ? Number(data.height) : null,
            bmi: data.bmi ? Number(data.bmi) : null,
            heart_rate: data.heart_rate ? Number(data.heart_rate) : null,
            heart_rate_regular: data.heart_rate_regular,
            heart_rate_irregular: data.heart_rate_irregular,
            respiratory_rate: data.respiratory_rate ? Number(data.respiratory_rate) : null,
            oxygen_saturation: data.oxygen_saturation ? Number(data.oxygen_saturation) : null,
            systolic_bp_sitting: data.systolic_bp_sitting ? Number(data.systolic_bp_sitting) : null,
            diastolic_bp_sitting: data.diastolic_bp_sitting ? Number(data.diastolic_bp_sitting) : null,
            systolic_bp_standing: data.systolic_bp_standing ? Number(data.systolic_bp_standing) : null,
            diastolic_bp_standing: data.diastolic_bp_standing ? Number(data.diastolic_bp_standing) : null,
            mental_status_alert_oriented: data.mental_status_alert || 'No',
            mental_status_confused: data.mental_status_confused,
            mental_status_drowsy: data.mental_status_drowsy,
            dyspnea_at_rest: data.dyspnea_at_rest,
            dyspnea_with_exertion: data.dyspnea_with_exertion,
            fatigue: data.fatigue,
            orthopnea: data.orthopnea,
            loss_of_appetite_bloating: data.loss_of_appetite_bloating,
            decreased_exercise_tolerance: data.decreased_exercise_tolerance,
            weight_gain: data.weight_gain,
            weight_loss: data.weight_loss,
            syncope: data.syncope,
            pnd: data.pnd,
            muscle_cramps: data.muscle_cramps,
            wheeze: data.wheeze,
            giddiness: data.giddiness,
            symptom_other: data.symptom_other,
            symptom_other_details: data.symptom_other_details,
            peripheral_edema: data.peripheral_edema,
            ascites: data.ascites,
            rales: data.rales,
            jugular_venous_pressure: data.jugular_venous_pressure,
            hepatomegaly: data.hepatomegaly,
            clinical_sign_other: data.clinical_sign_other,
            clinical_sign_other_details: data.clinical_sign_other_details
        };
        await hfModel.insertHfInitialAssessment(conn, withHfId(initialData));

        // 4. Insert hf_final_clinical_assessment
        const finalData = {
            hfref: (data.typeOfHF && (data.typeOfHF === 'HFrEF (HF with reduced EF)' || data.typeOfHF.includes('reduced'))) || (data.finalAssessment?.finalTypeOfHF && (data.finalAssessment.finalTypeOfHF === 'HFrEF (HF with reduced EF)' || data.finalAssessment.finalTypeOfHF.includes('reduced'))) ? 'Yes' : 'No',
            hfpef: (data.typeOfHF && (data.typeOfHF === 'HFpEF (HF with preserved EF)' || data.typeOfHF.includes('preserved'))) || (data.finalAssessment?.finalTypeOfHF && (data.finalAssessment.finalTypeOfHF === 'HFpEF (HF with preserved EF)' || data.finalAssessment.finalTypeOfHF.includes('preserved'))) ? 'Yes' : 'No',
            etiology_ischemic: data.hfEtiology?.cardiovascular?.includes('Ischemic') ? 'Yes' : 'No',
            etiology_toxic: data.hfEtiology?.cardiovascular?.includes('Toxic (Alcohol, Cocaine, Chemotherapeutic)') ? 'Yes' : 'No',
            etiology_idiopathic: data.hfEtiology?.cardiovascular?.includes('Idiopathic (Dilated)') ? 'Yes' : 'No',
            etiology_hypertrophic: data.hfEtiology?.cardiovascular?.includes('Hypertrophic') ? 'Yes' : 'No',
            etiology_restrictive: data.hfEtiology?.cardiovascular?.includes('Restrictive (Amyloid, Sarcoid)') ? 'Yes' : 'No',
            etiology_valvular_rheumatic: data.hfEtiology?.cardiovascular?.includes('Valvular/ Rheumatic heart disease') ? 'Yes' : 'No',
            etiology_hypertensive: data.hfEtiology?.cardiovascular?.includes('Hypertensive') ? 'Yes' : 'No',
            etiology_tachycardia_induced: data.hfEtiology?.cardiovascular?.includes('Tachycardia Induced') ? 'Yes' : 'No',
            etiology_metabolic_disease: data.hfEtiology?.cardiovascular?.includes('Metabolic Diseases/Hemochromatosis/Wilson’s Disease') ? 'Yes' : 'No',
            etiology_hiv_viral_cardiomyopathy: data.hfEtiology?.cardiovascular?.includes('HIV and Viral Cardiomyopathy') ? 'Yes' : 'No',
            etiology_inflammatory_cardiomyopathy: data.hfEtiology?.cardiovascular?.includes('Inflammatory cardiomyopathy') ? 'Yes' : 'No',
            etiology_reduced_ef_previous_mi: data.hfEtiology?.cardiovascular?.includes('Reduced EF with/wo previous MI') ? 'Yes' : 'No',
            etiology_pregnancy: data.hfEtiology?.nonCardiac?.includes('Pregnancy') ? 'Yes' : 'No',
            etiology_thyroid_disease: data.hfEtiology?.nonCardiac?.includes('Thyroid Disease') ? 'Yes' : 'No',
            etiology_pheochromocytoma: data.hfEtiology?.nonCardiac?.includes('Pheochromocytoma') ? 'Yes' : 'No',
            etiology_chronic_renal_disease: data.hfEtiology?.nonCardiac?.includes('Chronic Renal Disease') ? 'Yes' : 'No',
            etiology_cor_pulmonale_copd: data.hfEtiology?.pulmonary?.includes('Cor Pulmonale secondary to COPD') ? 'Yes' : 'No',
            etiology_pulmonary_hypertension: data.hfEtiology?.pulmonary?.includes('Pulmonary Hypertension') ? 'Yes' : 'No',
            etiology_other: data.finalAssessment?.etiologyOther || 'No',
            etiology_other_details: data.finalAssessment?.etiologyOtherDetails || null,
            cad: data.finalAssessment?.comorbidities?.includes('Associated CAD') ? 'Yes' : 'No',
            renal_failure: (data.finalAssessment?.comorbidities?.includes('Renal Failure') || data.finalAssessment?.comorbidities?.includes('Renal failure')) ? 'Yes' : 'No',
            diabetes_mellitus: data.finalAssessment?.comorbidities?.includes('Diabetes Mellitus') ? 'Yes' : 'No',
            hypertension: data.finalAssessment?.comorbidities?.includes('Hypertension') ? 'Yes' : 'No',
            valvular_disease: data.finalAssessment?.comorbidities?.includes('Valvular Disease') ? 'Yes' : 'No',
            asthma: data.finalAssessment?.comorbidities?.includes('Asthma') ? 'Yes' : 'No',
            copd: data.finalAssessment?.comorbidities?.includes('COPD') ? 'Yes' : 'No',
            osa: data.finalAssessment?.comorbidities?.includes('OSA') ? 'Yes' : 'No',
            anemia: (data.finalAssessment?.comorbidities?.includes('Anemia') || data.finalAssessment?.comorbidities?.includes('Anaemia')) ? 'Yes' : 'No',
            cva: data.finalAssessment?.comorbidities?.includes('CVA') ? 'Yes' : 'No',
            severe_musculoskeletal_disease: data.finalAssessment?.comorbidities?.includes('Severe musculoskeletal disease') ? 'Yes' : 'No',
            cancer: data.finalAssessment?.comorbidities?.includes('Cancer') ? 'Yes' : 'No',
            apd: data.finalAssessment?.comorbidities?.includes('APD') ? 'Yes' : 'No',
            bleeding_diathesis: data.finalAssessment?.comorbidities?.includes('Bleeding diathesis') ? 'Yes' : 'No',
            pvd: data.finalAssessment?.comorbidities?.includes('PVD') ? 'Yes' : 'No',
            comorbidity_other: data.finalAssessment?.otherComorbidity ? 'Yes' : 'No',
            comorbidity_other_details: data.finalAssessment?.otherComorbidity || null,
            smoking: data.finalAssessment?.riskFactors?.includes('Smoking') ? 'Yes' : 'No',
            alcohol: data.finalAssessment?.riskFactors?.includes('Alcohol') ? 'Yes' : 'No',
            risk_factor_other: data.finalAssessment?.otherRiskFactor ? 'Yes' : 'No',
            risk_factor_other_details: data.finalAssessment?.otherRiskFactor || null,
            stage_a: (data.stageOfHF === 'Stage A' || data.finalAssessment?.finalStage === 'Stage A') ? 'Yes' : 'No',
            stage_b: (data.stageOfHF === 'Stage B' || data.finalAssessment?.finalStage === 'Stage B') ? 'Yes' : 'No',
            stage_c: (data.stageOfHF === 'Stage C' || data.finalAssessment?.finalStage === 'Stage C') ? 'Yes' : 'No',
            stage_d: (data.stageOfHF === 'Stage D' || data.finalAssessment?.finalStage === 'Stage D') ? 'Yes' : 'No',
            nyha_class_1: (data.nyhaClass === 'NYHA Class I' || data.finalAssessment?.finalNyhaClass === 'NYHA Class I') ? 'Yes' : 'No',
            nyha_class_2: (data.nyhaClass === 'NYHA Class II' || data.finalAssessment?.finalNyhaClass === 'NYHA Class II') ? 'Yes' : 'No',
            nyha_class_3: (data.nyhaClass === 'NYHA Class III' || data.finalAssessment?.finalNyhaClass === 'NYHA Class III') ? 'Yes' : 'No',
            nyha_class_4: (data.nyhaClass === 'NYHA Class IV' || data.finalAssessment?.finalNyhaClass === 'NYHA Class IV') ? 'Yes' : 'No',
            af_permanent: data.afStatus === 'Permanent' ? 'Yes' : 'No',
            af_paroxysmal: data.afStatus === 'Paroxysmal' ? 'Yes' : 'No',
            af_persistent: data.afStatus === 'Persistent' ? 'Yes' : 'No',
            af_nsr: data.afStatus === 'NSR' ? 'Yes' : 'No',
            mace_hospitalization: data.finalAssessment?.maceHospitalization || 'No',
            mace_stroke: data.finalAssessment?.maceStroke || 'No',
            mace_major_bleed: data.finalAssessment?.maceMajorBleed || 'No',
            mace_severe_arrhythmia: data.finalAssessment?.maceSevereArrhythmia || 'No',
            mace_major_procedure: data.finalAssessment?.maceProcedures || 'No',
            mace_other: data.finalAssessment?.maceOther || 'No',
            mace_other_details: data.finalAssessment?.maceOtherDetails || null,
            mace_death: data.finalAssessment?.maceDeath || 'No',
            death_date: data.finalAssessment?.maceDeathDate || null,
            death_home: data.finalAssessment?.maceDeathLocation === 'Home' ? 'Yes' : 'No',
            death_hospital: data.finalAssessment?.maceDeathLocation === 'Hospital' ? 'Yes' : 'No',
            death_reason: data.finalAssessment?.maceDeathReason || null,
            hosp_note: data.finalAssessment?.hospNote || data.hosp_note || null,
            stroke_note: data.finalAssessment?.strokeNote || data.stroke_note || null,
            bleed_note: data.finalAssessment?.bleedNote || data.bleed_note || null,
            arrhythmia_note: data.finalAssessment?.arrhythmiaNote || data.arrhythmia_note || null,
            procedure_note: data.finalAssessment?.procedureNote || data.procedure_note || null,
            other_note: data.finalAssessment?.otherNote || data.other_note || null,
            death_note: data.finalAssessment?.deathNote || data.death_note || null
        };
        await hfModel.insertHfFinalClinicalAssessment(conn, withHfId(finalData));

        // 5, 6, 7. Insert medicalTherapy parts 1, 2, 3
        if (data.medicalTherapy) {
            await hfModel.insertHfMedicalTherapyPart1(conn, withHfId(data.medicalTherapy));
            await hfModel.insertHfMedicalTherapyPart2(conn, withHfId(data.medicalTherapy));
            await hfModel.insertHfMedicalTherapyPart3(conn, withHfId(data.medicalTherapy));
        }

        // 8. Insert deviceTherapy
        if (data.deviceTherapy) {
            await hfModel.insertHfDeviceTherapy(conn, withHfId(data.deviceTherapy));
        }

        // 9. Insert patientEducation
        if (data.patientEducation) {
            await hfModel.insertHfPatientEducation(conn, withHfId(data.patientEducation));
        }

        // 10. Insert recommendations
        if (data.recommendations) {
            await hfModel.insertHfRecommendations(conn, withHfId(data.recommendations));
        }

        // 11, 12, 13. Insert Investigations
        if (data.investigations) {
            const labData = {
                pneumococcal_vaccination: data.investigations.vacPneumococcal || 'No',
                pneumococcal_vaccination_date: data.investigations.vacPneumococcalDate || null,
                influenza_vaccination: data.investigations.vacInfluenza || 'No',
                influenza_vaccination_date: data.investigations.vacInfluenzaDate || null,
                blood_group: data.investigations.bloodGroup || null,
                potassium_result: data.investigations.labTests?.potassium?.result || null,
                potassium_date: data.investigations.labTests?.potassium?.date || null,
                creatinine_result: data.investigations.labTests?.creatinine?.result || null,
                creatinine_date: data.investigations.labTests?.creatinine?.date || null,
                hb_result: data.investigations.labTests?.hb?.result || null,
                hb_date: data.investigations.labTests?.hb?.date || null,
                calcium_result: data.investigations.labTests?.calcium?.result || null,
                calcium_date: data.investigations.labTests?.calcium?.date || null,
                bun_result: data.investigations.labTests?.bun?.result || null,
                bun_date: data.investigations.labTests?.bun?.date || null,
                glucose_result: data.investigations.labTests?.glucose?.result || null,
                glucose_date: data.investigations.labTests?.glucose?.date || null,
                hba1c_result: data.investigations.labTests?.hba1c?.result || null,
                hba1c_date: data.investigations.labTests?.hba1c?.date || null,
                magnesium_result: data.investigations.labTests?.magnesium?.result || null,
                magnesium_date: data.investigations.labTests?.magnesium?.date || null,
                sodium_result: data.investigations.labTests?.sodium?.result || null,
                sodium_date: data.investigations.labTests?.sodium?.date || null,
                tsh_result: data.investigations.labTests?.tsh?.result || null,
                tsh_date: data.investigations.labTests?.tsh?.date || null,
                t3_result: data.investigations.labTests?.t3?.result || null,
                t3_date: data.investigations.labTests?.t3?.date || null,
                t4_result: data.investigations.labTests?.t4?.result || null,
                t4_date: data.investigations.labTests?.t4?.date || null,
                bnp_result: data.investigations.labTests?.bnp?.result || null,
                bnp_date: data.investigations.labTests?.bnp?.date || null,
                nt_pro_bnp_result: (data.investigations.labTests?.ntProBnp?.result || data.investigations.labTests?.nt_pro_bnp?.result) || null,
                nt_pro_bnp_date: (data.investigations.labTests?.ntProBnp?.date || data.investigations.labTests?.nt_pro_bnp?.date) || null,
                ldl_result: data.investigations.labTests?.ldl?.result || null,
                ldl_date: data.investigations.labTests?.ldl?.date || null,
                inr_result: data.investigations.labTests?.inr?.result || null,
                inr_date: data.investigations.labTests?.inr?.date || null,
                st2_result: data.investigations.labTests?.st2?.result || null,
                st2_date: data.investigations.labTests?.st2?.date || null,
                other_lab_test_name: data.investigations.labTests?.other?.name || null,
                other_lab_test_result: data.investigations.labTests?.other?.result || null,
                other_lab_test_date: data.investigations.labTests?.other?.date || null
            };
            await hfModel.insertHfLabTests(conn, withHfId(labData));

            const cardiacData = {
                ecg_test_date: data.investigations.ecgDate || null,
                ecg_qrs_duration: (data.investigations?.ecgQrsDuration && !isNaN(parseFloat(data.investigations.ecgQrsDuration))) ? parseFloat(data.investigations.ecgQrsDuration) : null,
                ecg_rhythm_sinus: (data.investigations?.ecgRhythm === 'Sinus' || data.investigations?.ecgRhythm === 'Sinus Rhythm') ? 'Yes' : 'No',
                ecg_rhythm_af: (data.investigations?.ecgRhythm === 'AF' || data.investigations?.ecgRhythm === 'Atrial Fibrillation (AF)') ? 'Yes' : 'No',
                ecg_rhythm_other: data.investigations.ecgRhythm === 'Other' ? 'Yes' : 'No',
                ecg_rhythm_other_details: data.investigations.ecgRhythmOther || null,
                ecg_av_normal: (data.investigations?.ecgAvConduction === 'Normal' || data.investigations?.ecgAvConduction === 'Normal Conduction') ? 'Yes' : 'No',
                ecg_av_first_degree_block: (data.investigations?.ecgAvConduction === '1st degree AV block' || data.investigations?.ecgAvConduction === '1st Degree AV Block') ? 'Yes' : 'No',
                ecg_av_second_degree_block: (data.investigations?.ecgAvConduction === '2nd degree AV block' || data.investigations?.ecgAvConduction === '2nd Degree AV Block') ? 'Yes' : 'No',
                ecg_av_third_degree_block: (data.investigations?.ecgAvConduction === '3rd degree AV block' || data.investigations?.ecgAvConduction === 'Complete Heart Block (3rd Degree)') ? 'Yes' : 'No',
                ecg_qwaves_yes: data.investigations.ecgQWaves === 'Yes' ? 'Yes' : 'No',
                ecg_qwaves_none: (data.investigations.ecgQWaves === 'No' || data.investigations.ecgQWaves === 'None') ? 'Yes' : 'No',
                ecg_qwave_leads: data.investigations.ecgQWavesLeads || null,
                ecg_lbbb: data.investigations.ecgBlockages === 'LBBB' ? 'Yes' : 'No',
                ecg_rbbb: data.investigations.ecgBlockages === 'RBBB' ? 'Yes' : 'No',
                ecg_block_other: data.investigations.ecgBlockages === 'Other Block' ? 'Yes' : 'No',
                ecg_block_other_details: data.investigations.ecgBlockagesOther || null,
                ecg_apc: (data.investigations?.ecgExtraBeats === 'APC' || data.investigations?.ecgExtraBeats === 'APCs') ? 'Yes' : 'No',
                ecg_vpc: (data.investigations?.ecgExtraBeats === 'VPC' || data.investigations?.ecgExtraBeats === 'VPCs') ? 'Yes' : 'No',
                ecg_extra_beats_none: (data.investigations?.ecgExtraBeats === 'None') ? 'Yes' : 'No',
                ecg_qt: data.investigations.ecgQt ? Number(data.investigations.ecgQt) : null,
                ecg_qtc: data.investigations.ecgQtc ? Number(data.investigations.ecgQtc) : null,
                chest_xray_test_date: data.investigations.cxrDate || null,
                cardiothoracic_ratio: (data.investigations?.cxrCtRatio && !isNaN(parseFloat(data.investigations.cxrCtRatio))) ? parseFloat(data.investigations.cxrCtRatio) : null,
                chest_pvh: data.investigations.cxrPvh ? 'Yes' : 'No',
                chest_pulmonary_edema: data.investigations.cxrPulmonaryEdema ? 'Yes' : 'No',
                chest_pleural_effusion: data.investigations.cxrPleuralEffusion ? 'Yes' : 'No',
                chest_other: data.investigations.cxrOthers ? 'Yes' : 'No',
                chest_other_details: data.investigations.cxrOthers || null,
                echo_test_date: data.investigations.echoDate || null,
                echo_ef: data.investigations.echoEfPercent ? Number(data.investigations.echoEfPercent) : null,
                echo_ea_ratio: data.investigations.echoEaRatio ? Number(data.investigations.echoEaRatio) : null,
                echo_ee_ratio: data.investigations.echoEePrimeRatio ? Number(data.investigations.echoEePrimeRatio) : null,
                echo_deceleration_time: data.investigations.echoEDecelTime ? Number(data.investigations.echoEDecelTime) : null,
                echo_rv_tapsv: data.investigations.echoRvTapsv ? Number(data.investigations.echoRvTapsv) : null,
                echo_left_atrium_dimension: data.investigations.echoLaDimension ? 'Yes' : 'No',
                echo_left_ventricle_systole: data.investigations.echoLvSystole ? 'Yes' : 'No',
                echo_left_ventricle_diastole: data.investigations.echoLvDiastole ? 'Yes' : 'No',
                mitral_regurgitation_none: (data.investigations?.echoMrMitralRegurg === 'None' || data.investigations?.echoMrMitralRegurg === 'None / Trace') ? 'Yes' : 'No',
                mitral_regurgitation_1plus: (data.investigations?.echoMrMitralRegurg === '1plus' || data.investigations?.echoMrMitralRegurg === 'Mild (1+)') ? 'Yes' : 'No',
                mitral_regurgitation_2plus: (data.investigations?.echoMrMitralRegurg === '2plus' || data.investigations?.echoMrMitralRegurg === 'Moderate (2+)') ? 'Yes' : 'No',
                mitral_regurgitation_3plus: (data.investigations?.echoMrMitralRegurg === '3plus' || data.investigations?.echoMrMitralRegurg === 'Moderate-Severe (3+)') ? 'Yes' : 'No',
                mitral_regurgitation_4plus: (data.investigations?.echoMrMitralRegurg === '4plus' || data.investigations?.echoMrMitralRegurg === 'Severe (4+)') ? 'Yes' : 'No',
                other_valves: data.investigations.echoOtherValves || null,
                rv_systolic_pressure: data.investigations.echoRvSystolicPressure || null,
                rv_function_normal: data.investigations.echoRvFunction === 'Normal' ? 'Yes' : 'No',
                rv_function_impaired: data.investigations.echoRvFunction === 'Impaired' ? 'Yes' : 'No',
                rwmi_none: (data.investigations?.echoRwmi === 'None' || data.investigations?.echoRwmi === 'No RWMI') ? 'Yes' : 'No',
                rwmi_global: (data.investigations?.echoRwmi === 'Global' || data.investigations?.echoRwmi === 'Global Hypokinesia') ? 'Yes' : 'No',
                rwmi_anterior: (data.investigations?.echoRwmi === 'Anterior' || data.investigations?.echoRwmi === 'Anterior Wall Hypokinesia') ? 'Yes' : 'No',
                rwmi_lateral: (data.investigations?.echoRwmi === 'Lateral' || data.investigations?.echoRwmi === 'Lateral Wall Hypokinesia') ? 'Yes' : 'No',
                rwmi_inferior: (data.investigations?.echoRwmi === 'Inferior' || data.investigations?.echoRwmi === 'Inferior Wall Hypokinesia') ? 'Yes' : 'No'
            };
            await hfModel.insertHfCardiacInvestigations(conn, withHfId(cardiacData));

            const advancedData = {
                holter_test_date: data.investigations.holterDate || null,
                ventricular_arrhythmia_no: data.investigations.holterVentricularArrhythmia === 'No' ? 'Yes' : 'No',
                ventricular_arrhythmia_yes: data.investigations.holterVentricularArrhythmia === 'Yes' ? 'Yes' : 'No',
                ventricular_arrhythmia_complex_vpc: data.investigations.holterVentricularArrhythmia === 'Complex VPC' ? 'Yes' : 'No',
                ventricular_arrhythmia_nsvt: data.investigations.holterVentricularArrhythmia === 'NSVT' ? 'Yes' : 'No',
                ventricular_arrhythmia_vt: data.investigations.holterVentricularArrhythmia === 'VT' ? 'Yes' : 'No',
                atrial_arrhythmia_none: data.investigations.holterAtrialArrhythmias === 'None' ? 'Yes' : 'No',
                atrial_arrhythmia_apcs: data.investigations.holterAtrialArrhythmias === 'APCs' ? 'Yes' : 'No',
                atrial_arrhythmia_af: data.investigations.holterAtrialArrhythmias === 'AF' ? 'Yes' : 'No',
                ventricular_pvc: data.investigations.holterVpcChecked ? 'Yes' : 'No',
                heart_rate_variability: data.investigations.holterHrv || null,
                stress_test_done: data.investigations.stressStatus === 'Done' ? 'Yes' : 'No',
                stress_test_date: data.investigations.stressDate || null,
                stress_test_not_done: data.investigations.stressStatus === 'Not Done' ? 'Yes' : 'No',
                stress_mets_achieved: data.investigations.stressMets ? Number(data.investigations.stressMets) : null,
                stress_target_heart_rate_achieved: data.investigations.stressTargetHr || null,
                stress_ischemic_changes_yes: (data.investigations.stressIschemicChanges === 'Yes' || data.investigations.stressIschemicChanges === 'Present') ? 'Yes' : 'No',
                stress_ischemic_changes_no: (data.investigations.stressIschemicChanges === 'No' || data.investigations.stressIschemicChanges === 'Absent') ? 'Yes' : 'No',
                stress_arrhythmias_yes: data.investigations.stressArrhythmias === 'Yes' ? 'Yes' : 'No',
                stress_arrhythmias_no: data.investigations.stressArrhythmias === 'No' ? 'Yes' : 'No',
                mri_test_date: data.investigations.mriDate || null,
                mri_lvef: data.investigations.mriLvef ? Number(data.investigations.mriLvef) : null,
                mri_scar_present: (data.investigations.mriScar === 'Yes' || data.investigations.mriScar === 'Present') ? 'Yes' : 'No',
                mri_scar_absent: (data.investigations.mriScar === 'No' || data.investigations.mriScar === 'Absent') ? 'Yes' : 'No',
                pet_test_date: data.investigations.petDate || null,
                six_minute_walk_done: data.investigations.sixMwtStatus === 'Done' ? 'Yes' : 'No',
                six_minute_walk_date: data.investigations.sixMwtDate || null,
                six_minute_walk_distance: data.investigations.sixMwtDistance ? Number(data.investigations.sixMwtDistance) : null,
                six_minute_walk_heart_rate_recovery: data.investigations.sixMwtHrRecovery || null,
                six_minute_walk_not_done: data.investigations.sixMwtStatus === 'Not Done' ? 'Yes' : 'No',
                six_minute_walk_reason: data.investigations.sixMwtNotDoneReason || null,
                anaerobic_threshold_test_date: data.investigations.anaerobicDate || null,
                angiogram_done: data.investigations.angioStatus === 'Done' ? 'Yes' : 'No',
                angiogram_test_date: data.investigations.angioDate || null,
                angiogram_normal: (data.investigations?.angioFinding === 'Normal' || data.investigations?.angioFinding === 'Normal Coronaries') ? 'Yes' : 'No',
                angiogram_one_vessel_disease: (data.investigations?.angioFinding === '1 vessel disease' || data.investigations?.angioFinding === 'Single Vessel Disease (SVD)') ? 'Yes' : 'No',
                angiogram_two_vessel_disease: (data.investigations?.angioFinding === '2 vessel disease' || data.investigations?.angioFinding === 'Double Vessel Disease (DVD)') ? 'Yes' : 'No',
                angiogram_three_vessel_disease: (data.investigations?.angioFinding === '3 vessel disease' || data.investigations?.angioFinding === 'Triple Vessel Disease (TVD)') ? 'Yes' : 'No',
                angiogram_lmca: (data.investigations?.angioFinding === 'LMCA' || data.investigations?.angioFinding === 'Left Main Disease') ? 'Yes' : 'No',
                angiogram_not_done: data.investigations.angioStatus === 'Not Done' ? 'Yes' : 'No',
                biopsy_done: data.investigations.biopsyStatus === 'Done' ? 'Yes' : 'No',
                biopsy_test_date: data.investigations.biopsyDate || null,
                biopsy_not_done: data.investigations.biopsyStatus === 'Not Done' ? 'Yes' : 'No'
            };
            await hfModel.insertHfAdvancedInvestigations(conn, withHfId(advancedData));
        }

        await conn.commit();
        return { hf_id, hf_registry_no };
    } catch (err) {
        await conn.rollback();
        throw err;
    } finally {
        conn.release();
    }
}


async function getHfHistory(patientId) {
    const query = `
        SELECT hf_id, hf_registry_no, created_at, 
               COALESCE(
                   (SELECT assessment_date FROM hf_initial_assessment WHERE hf_initial_assessment.hf_id = hf_registry.hf_id LIMIT 1),
                   (SELECT assessment_date FROM hf_administrative WHERE hf_administrative.hf_id = hf_registry.hf_id LIMIT 1)
               ) as assessment_date
        FROM hf_registry
        WHERE patient_id = ?
        ORDER BY created_at DESC
    `;
    const [rows] = await db.execute(query, [patientId]);
    return rows;
}

async function getHfAssessment(hf_id) {
    const conn = await db.getConnection();
    try {
        const [registries] = await conn.execute("SELECT * FROM hf_registry WHERE hf_id = ?", [hf_id]);
        if (registries.length === 0) return null;
        const registry = registries[0];

        const [adminRows] = await conn.execute("SELECT * FROM hf_administrative WHERE hf_id = ?", [hf_id]);
        const [initialRows] = await conn.execute("SELECT * FROM hf_initial_assessment WHERE hf_id = ?", [hf_id]);
        const [finalRows] = await conn.execute("SELECT * FROM hf_final_clinical_assessment WHERE hf_id = ?", [hf_id]);
        const [part1Rows] = await conn.execute("SELECT * FROM hf_medical_therapy_part1 WHERE hf_id = ?", [hf_id]);
        const [part2Rows] = await conn.execute("SELECT * FROM hf_medical_therapy_part2 WHERE hf_id = ?", [hf_id]);
        const [part3Rows] = await conn.execute("SELECT * FROM hf_medical_therapy_part3 WHERE hf_id = ?", [hf_id]);
        const [deviceRows] = await conn.execute("SELECT * FROM hf_device_therapy WHERE hf_id = ?", [hf_id]);
        const [educationRows] = await conn.execute("SELECT * FROM hf_patient_education WHERE hf_id = ?", [hf_id]);
        const [recommendationRows] = await conn.execute("SELECT * FROM hf_recommendations WHERE hf_id = ?", [hf_id]);
        const [labRows] = await conn.execute("SELECT * FROM hf_lab_tests WHERE hf_id = ?", [hf_id]);
        const [cardiacRows] = await conn.execute("SELECT * FROM hf_cardiac_investigations WHERE hf_id = ?", [hf_id]);
        const [advancedRows] = await conn.execute("SELECT * FROM hf_advanced_investigations WHERE hf_id = ?", [hf_id]);

        const admin = adminRows[0] || {};
        const initial = initialRows[0] || {};
        const final = finalRows[0] || {};
        const part1 = part1Rows[0] || {};
        const part2 = part2Rows[0] || {};
        const part3 = part3Rows[0] || {};
        const device = deviceRows[0] || {};
        const education = educationRows[0] || {};
        const recommendation = recommendationRows[0] || {};
        const lab = labRows[0] || {};
        const cardiac = cardiacRows[0] || {};
        const advanced = advancedRows[0] || {};

        // Merge medical therapy
        const medicalTherapy = { ...part1, ...part2, ...part3 };

        // Deconstruct precipitating factors
        const precipitatingFactors = [];
        if (admin.myocardial_ischemia === 'Yes') precipitatingFactors.push('Myocardial ischemia');
        if (admin.atrial_fibrillation === 'Yes') precipitatingFactors.push('Atrial fibrillation');
        if (admin.bradyarrhythmia === 'Yes') precipitatingFactors.push('Bradyarrhythmia');
        if (admin.ventricular_tachycardia === 'Yes') precipitatingFactors.push('Ventricular tachycardia');
        if (admin.uncontrolled_hypertension === 'Yes') precipitatingFactors.push('Uncontrolled hypertension');
        if (admin.infection === 'Yes') precipitatingFactors.push('Infection');
        if (admin.renal_failure === 'Yes') precipitatingFactors.push('Renal failure');
        if (admin.anaemia === 'Yes') precipitatingFactors.push('Anaemia');
        if (admin.medication_non_adherence === 'Yes') precipitatingFactors.push('Medication non adherence');
        if (admin.excessive_salt_intake === 'Yes') precipitatingFactors.push('Excessive salt intake');
        if (admin.excessive_water_ingestion === 'Yes') precipitatingFactors.push('Excessive water ingestion');
        if (admin.progressive_worsening === 'Yes') precipitatingFactors.push('Progressive worsening');

        // Deconstruct cardiovascular etiologies
        const cvEtiology = [];
        if (final.etiology_ischemic === 'Yes') cvEtiology.push('Ischemic');
        if (final.etiology_toxic === 'Yes') cvEtiology.push('Toxic (Alcohol, Cocaine, Chemotherapeutic)');
        if (final.etiology_idiopathic === 'Yes') cvEtiology.push('Idiopathic (Dilated)');
        if (final.etiology_hypertrophic === 'Yes') cvEtiology.push('Hypertrophic');
        if (final.etiology_restrictive === 'Yes') cvEtiology.push('Restrictive (Amyloid, Sarcoid)');
        if (final.etiology_valvular_rheumatic === 'Yes') cvEtiology.push('Valvular/ Rheumatic heart disease');
        if (final.etiology_hypertensive === 'Yes') cvEtiology.push('Hypertensive');
        if (final.etiology_tachycardia_induced === 'Yes') cvEtiology.push('Tachycardia Induced');
        if (final.etiology_metabolic_disease === 'Yes') cvEtiology.push('Metabolic Diseases/Hemochromatosis/Wilson’s Disease');
        if (final.etiology_hiv_viral_cardiomyopathy === 'Yes') cvEtiology.push('HIV and Viral Cardiomyopathy');
        if (final.etiology_inflammatory_cardiomyopathy === 'Yes') cvEtiology.push('Inflammatory cardiomyopathy');
        if (final.etiology_reduced_ef_previous_mi === 'Yes') cvEtiology.push('Reduced EF with/wo previous MI');

        // Deconstruct non-cardiac etiologies
        const ncEtiology = [];
        if (final.etiology_pregnancy === 'Yes') ncEtiology.push('Pregnancy');
        if (final.etiology_thyroid_disease === 'Yes') ncEtiology.push('Thyroid Disease');
        if (final.etiology_pheochromocytoma === 'Yes') ncEtiology.push('Pheochromocytoma');
        if (final.etiology_chronic_renal_disease === 'Yes') ncEtiology.push('Chronic Renal Disease');

        // Deconstruct pulmonary etiologies
        const pulmEtiology = [];
        if (final.etiology_cor_pulmonale_copd === 'Yes') pulmEtiology.push('Cor Pulmonale secondary to COPD');
        if (final.etiology_pulmonary_hypertension === 'Yes') pulmEtiology.push('Pulmonary Hypertension');

        // Deconstruct comorbidities
        const comorbidities = [];
        if (final.cad === 'Yes') comorbidities.push('Associated CAD');
        if (final.renal_failure === 'Yes') comorbidities.push('Renal Failure');
        if (final.diabetes_mellitus === 'Yes') comorbidities.push('Diabetes Mellitus');
        if (final.hypertension === 'Yes') comorbidities.push('Hypertension');
        if (final.valvular_disease === 'Yes') comorbidities.push('Valvular Disease');
        if (final.asthma === 'Yes') comorbidities.push('Asthma');
        if (final.copd === 'Yes') comorbidities.push('COPD');
        if (final.osa === 'Yes') comorbidities.push('OSA');
        if (final.anemia === 'Yes') comorbidities.push('Anemia');
        if (final.cva === 'Yes') comorbidities.push('CVA');
        if (final.severe_musculoskeletal_disease === 'Yes') comorbidities.push('Severe musculoskeletal disease');
        if (final.cancer === 'Yes') comorbidities.push('Cancer');
        if (final.apd === 'Yes') comorbidities.push('APD');
        if (final.bleeding_diathesis === 'Yes') comorbidities.push('Bleeding diathesis');
        if (final.pvd === 'Yes') comorbidities.push('PVD');

        // Deconstruct risk factors
        const riskFactors = [];
        if (final.smoking === 'Yes') riskFactors.push('Smoking');
        if (final.alcohol === 'Yes') riskFactors.push('Alcohol');

        // Parse ECG Rhythm & AV blockages
        let ecgRhythm = '';
        if (cardiac.ecg_rhythm_sinus === 'Yes') ecgRhythm = 'Sinus';
        else if (cardiac.ecg_rhythm_af === 'Yes') ecgRhythm = 'AF';
        else if (cardiac.ecg_rhythm_other === 'Yes') ecgRhythm = 'Other';

        let ecgAvConduction = '';
        if (cardiac.ecg_av_normal === 'Yes') ecgAvConduction = 'Normal';
        else if (cardiac.ecg_av_first_degree_block === 'Yes') ecgAvConduction = '1st degree AV block';
        else if (cardiac.ecg_av_second_degree_block === 'Yes') ecgAvConduction = '2nd degree AV block';
        else if (cardiac.ecg_av_third_degree_block === 'Yes') ecgAvConduction = '3rd degree AV block';

        let ecgQWaves = '';
        if (cardiac.ecg_qwaves_yes === 'Yes') ecgQWaves = 'Yes';
        else if (cardiac.ecg_qwaves_none === 'Yes') ecgQWaves = 'None';

        let ecgBlockages = '';
        if (cardiac.ecg_lbbb === 'Yes') ecgBlockages = 'LBBB';
        else if (cardiac.ecg_rbbb === 'Yes') ecgBlockages = 'RBBB';
        else if (cardiac.ecg_block_other === 'Yes') ecgBlockages = 'Other Block';

        let ecgExtraBeats = '';
        if (cardiac.ecg_apc === 'Yes') ecgExtraBeats = 'APC';
        else if (cardiac.ecg_vpc === 'Yes') ecgExtraBeats = 'VPC';
        else if (cardiac.ecg_extra_beats_none === 'Yes') ecgExtraBeats = 'None';

        // Parse Echo Mitral Regurg dimensions
        let echoMrMitralRegurg = '';
        if (cardiac.mitral_regurgitation_none === 'Yes') echoMrMitralRegurg = 'None';
        else if (cardiac.mitral_regurgitation_1plus === 'Yes') echoMrMitralRegurg = '1plus';
        else if (cardiac.mitral_regurgitation_2plus === 'Yes') echoMrMitralRegurg = '2plus';
        else if (cardiac.mitral_regurgitation_3plus === 'Yes') echoMrMitralRegurg = '3plus';
        else if (cardiac.mitral_regurgitation_4plus === 'Yes') echoMrMitralRegurg = '4plus';

        let echoRvFunction = '';
        if (cardiac.rv_function_normal === 'Yes') echoRvFunction = 'Normal';
        else if (cardiac.rv_function_impaired === 'Yes') echoRvFunction = 'Impaired';

        let echoRwmi = '';
        if (cardiac.rwmi_none === 'Yes') echoRwmi = 'None';
        else if (cardiac.rwmi_global === 'Yes') echoRwmi = 'Global';
        else if (cardiac.rwmi_anterior === 'Yes') echoRwmi = 'Anterior';
        else if (cardiac.rwmi_lateral === 'Yes') echoRwmi = 'Lateral';
        else if (cardiac.rwmi_inferior === 'Yes') echoRwmi = 'Inferior';

        // Parse Advanced Investigations
        let holterVentricularArrhythmia = '';
        if (advanced.ventricular_arrhythmia_no === 'Yes') holterVentricularArrhythmia = 'No';
        else if (advanced.ventricular_arrhythmia_yes === 'Yes') holterVentricularArrhythmia = 'Yes';
        else if (advanced.ventricular_arrhythmia_complex_vpc === 'Yes') holterVentricularArrhythmia = 'Complex VPC';
        else if (advanced.ventricular_arrhythmia_nsvt === 'Yes') holterVentricularArrhythmia = 'NSVT';
        else if (advanced.ventricular_arrhythmia_vt === 'Yes') holterVentricularArrhythmia = 'VT';

        let holterAtrialArrhythmias = '';
        if (advanced.atrial_arrhythmia_none === 'Yes') holterAtrialArrhythmias = 'None';
        else if (advanced.atrial_arrhythmia_apcs === 'Yes') holterAtrialArrhythmias = 'APCs';
        else if (advanced.atrial_arrhythmia_af === 'Yes') holterAtrialArrhythmias = 'AF';

        let stressStatus = '';
        if (advanced.stress_test_done === 'Yes') stressStatus = 'Done';
        else if (advanced.stress_test_not_done === 'Yes') stressStatus = 'Not Done';

        let sixMwtStatus = '';
        if (advanced.six_minute_walk_done === 'Yes') sixMwtStatus = 'Done';
        else if (advanced.six_minute_walk_not_done === 'Yes') sixMwtStatus = 'Not Done';

        let angioStatus = '';
        if (advanced.angiogram_done === 'Yes') angioStatus = 'Done';
        else if (advanced.angiogram_not_done === 'Yes') angioStatus = 'Not Done';

        let angioFinding = '';
        if (advanced.angiogram_normal === 'Yes') angioFinding = 'Normal';
        else if (advanced.angiogram_one_vessel_disease === 'Yes') angioFinding = '1 vessel disease';
        else if (advanced.angiogram_two_vessel_disease === 'Yes') angioFinding = '2 vessel disease';
        else if (advanced.angiogram_three_vessel_disease === 'Yes') angioFinding = '3 vessel disease';
        else if (advanced.angiogram_lmca === 'Yes') angioFinding = 'LMCA';

        let biopsyStatus = '';
        if (advanced.biopsy_done === 'Yes') biopsyStatus = 'Done';
        else if (advanced.biopsy_not_done === 'Yes') biopsyStatus = 'Not Done';

        let stressIschemicChanges = '';
        if (advanced.stress_ischemic_changes_yes === 'Yes') stressIschemicChanges = 'Yes';
        else if (advanced.stress_ischemic_changes_no === 'Yes') stressIschemicChanges = 'No';

        let stressArrhythmias = '';
        if (advanced.stress_arrhythmias_yes === 'Yes') stressArrhythmias = 'Yes';
        else if (advanced.stress_arrhythmias_no === 'Yes') stressArrhythmias = 'No';

        let mriScar = '';
        if (advanced.mri_scar_present === 'Yes') mriScar = 'Yes';
        else if (advanced.mri_scar_absent === 'Yes') mriScar = 'No';

        return {
            id: registry.hf_id,
            hfRegistryNo: registry.hf_registry_no,
            hf_registry_no: registry.hf_registry_no,
            patientId: registry.patient_id,
            encounterId: admin.care_mr_no,
            assessmentDate: admin.assessment_date,
            visitType: admin.visit_type,
            address: admin.address,
            referredFrom: admin.referred_from,
            patient: {
                address: admin.address,
                highestEducation: admin.education_level,
                monthlyIncome: admin.monthly_income,
                occupation: admin.occupation,
                caregiverName: admin.caregiver_name,
                caregiverRelationship: admin.caregiver_relationship,
                caregiverPhone: admin.caregiver_phone,
                insuranceMode: admin.insurance_mode,
                referredFrom: admin.referred_from,
                presentDiagnosis: admin.present_diagnosis
            },
            inpatientDetails: {
                treatingCardiologist: admin.treating_cardiologist,
                referringDoctor: admin.referring_doctor,
                referredFrom: admin.referred_from,
                dischargeDate: admin.discharge_date,
                encounterId: admin.care_mr_no,
                precipitatingFactors,
                otherPrecipitatingFactor: admin.precipitating_other,
                nonHfAdmissionReason: admin.other_admission_reason,
                daysHospitalized: admin.hospitalization_days
            },
            previous_diagnosis: initial.previous_diagnosis,
            previousDiagnosis: initial.previous_diagnosis,
            history_cabg: initial.history_cabg,
            history_ptca: initial.history_ptca,
            history_stroke: initial.history_stroke,
            history_major_bleed: initial.history_major_bleed,
            history_thrombolysis: initial.history_thrombolysis,
            history_past_mi: initial.history_past_mi,
            past_mi_years_ago: initial.past_mi_years_ago,
            past_mi_location: initial.past_mi_location,
            history_other: initial.history_other,
            previous_hf_hospitalization: initial.previous_hf_hospitalization,
            recent_hospitalization_dates: initial.recent_hospitalization_dates,
            recent_hospitalization_reasons: initial.recent_hospitalization_reasons,
            documented_vt_vf: initial.documented_vt_vf,
            complaints_syncope: initial.complaints_syncope_presyncope,
            syncope_frequency: initial.pvc_frequency,
            documented_pvcs: initial.documented_pvcs,
            pvc_count: initial.pvc_count,
            pvc_frequency: initial.pvc_frequency,
            documented_nsvt: initial.documented_nsvt,
            nsvt_frequency: initial.nsvt_frequency,
            
            weight: initial.weight,
            unable_to_weigh: initial.unable_to_weigh,
            unable_to_weigh_reason: initial.unable_to_weigh_reason,
            height: initial.height,
            bmi: initial.bmi,
            heart_rate: initial.heart_rate,
            heart_rate_regular: initial.heart_rate_regular,
            heart_rate_irregular: initial.heart_rate_irregular,
            respiratory_rate: initial.respiratory_rate,
            oxygen_saturation: initial.oxygen_saturation,
            systolic_bp_sitting: initial.systolic_bp_sitting,
            diastolic_bp_sitting: initial.diastolic_bp_sitting,
            systolic_bp_standing: initial.systolic_bp_standing,
            diastolic_bp_standing: initial.diastolic_bp_standing,
            mental_status_alert: initial.mental_status_alert_oriented,
            mental_status_confused: initial.mental_status_confused,
            mental_status_drowsy: initial.mental_status_drowsy,
            
            dyspnea_at_rest: initial.dyspnea_at_rest,
            dyspnea_with_exertion: initial.dyspnea_with_exertion,
            fatigue: initial.fatigue,
            orthopnea: initial.orthopnea,
            loss_of_appetite_bloating: initial.loss_of_appetite_bloating,
            decreased_exercise_tolerance: initial.decreased_exercise_tolerance,
            weight_gain: initial.weight_gain,
            weight_loss: initial.weight_loss,
            syncope: initial.syncope,
            pnd: initial.pnd,
            muscle_cramps: initial.muscle_cramps,
            wheeze: initial.wheeze,
            giddiness: initial.giddiness,
            symptom_other: initial.symptom_other,
            symptom_other_details: initial.symptom_other_details,
            
            peripheral_edema: initial.peripheral_edema,
            rales: initial.rales,
            hepatomegaly: initial.hepatomegaly,
            ascites: initial.ascites,
            jugular_venous_pressure: initial.jugular_venous_pressure,
            clinical_sign_other: initial.clinical_sign_other,
            clinical_sign_other_details: initial.clinical_sign_other_details,

            typeOfHF: final.hfref === 'Yes' ? 'HFrEF (HF with reduced EF)' : (final.hfpef === 'Yes' ? 'HFpEF (HF with preserved EF)' : 'HFrEF (HF with reduced EF)'),
            hfEtiology: {
                cardiovascular: cvEtiology,
                nonCardiac: ncEtiology,
                pulmonary: pulmEtiology
            },
            stageOfHF: final.stage_a === 'Yes' ? 'Stage A' : (final.stage_b === 'Yes' ? 'Stage B' : (final.stage_c === 'Yes' ? 'Stage C' : (final.stage_d === 'Yes' ? 'Stage D' : ''))),
            nyhaClass: final.nyha_class_1 === 'Yes' ? 'NYHA Class I' : (final.nyha_class_2 === 'Yes' ? 'NYHA Class II' : (final.nyha_class_3 === 'Yes' ? 'NYHA Class III' : (final.nyha_class_4 === 'Yes' ? 'NYHA Class IV' : ''))),
            afStatus: final.af_permanent === 'Yes' ? 'Permanent' : (final.af_paroxysmal === 'Yes' ? 'Paroxysmal' : (final.af_persistent === 'Yes' ? 'Persistent' : (final.af_nsr === 'Yes' ? 'NSR' : ''))),
            finalAssessment: {
                finalNyhaClass: final.nyha_class_1 === 'Yes' ? 'NYHA Class I' : (final.nyha_class_2 === 'Yes' ? 'NYHA Class II' : (final.nyha_class_3 === 'Yes' ? 'NYHA Class III' : (final.nyha_class_4 === 'Yes' ? 'NYHA Class IV' : ''))),
                finalStage: final.stage_a === 'Yes' ? 'Stage A' : (final.stage_b === 'Yes' ? 'Stage B' : (final.stage_c === 'Yes' ? 'Stage C' : (final.stage_d === 'Yes' ? 'Stage D' : ''))),
                finalTypeOfHF: final.hfref === 'Yes' ? 'HFrEF (HF with reduced EF)' : (final.hfpef === 'Yes' ? 'HFpEF (HF with preserved EF)' : 'HFrEF (HF with reduced EF)'),
                comorbidities,
                otherComorbidity: final.comorbidity_other_details,
                riskFactors,
                etiologyOther: final.etiology_other,
                etiologyOtherDetails: final.etiology_other_details,
                otherRiskFactor: final.risk_factor_other_details,
                maceHospitalization: final.mace_hospitalization,
                maceStroke: final.mace_stroke,
                maceProcedures: final.mace_major_procedure,
                maceMajorBleed: final.mace_major_bleed,
                maceSevereArrhythmia: final.mace_severe_arrhythmia,
                maceOther: final.mace_other,
                maceOtherDetails: final.mace_other_details,
                maceDeath: final.mace_death,
                maceDeathDate: final.death_date,
                maceDeathLocation: final.death_home === 'Yes' ? 'Home' : (final.death_hospital === 'Yes' ? 'Hospital' : null),
                maceDeathReason: final.death_reason,
                hospNote: final.hosp_note,
                strokeNote: final.stroke_note,
                bleedNote: final.bleed_note,
                arrhythmiaNote: final.arrhythmia_note,
                procedureNote: final.procedure_note,
                otherNote: final.other_note,
                deathNote: final.death_note,
                clinicalNotes: final.death_reason
            },
            investigations: {
                vacPneumococcal: lab.pneumococcal_vaccination,
                vacPneumococcalDate: lab.pneumococcal_vaccination_date,
                vacInfluenza: lab.influenza_vaccination,
                vacInfluenzaDate: lab.influenza_vaccination_date,
                bloodGroup: lab.blood_group,
                labTests: {
                    potassium: { checked: !!lab.potassium_result, result: lab.potassium_result, date: lab.potassium_date },
                    creatinine: { checked: !!lab.creatinine_result, result: lab.creatinine_result, date: lab.creatinine_date },
                    hb: { checked: !!lab.hb_result, result: lab.hb_result, date: lab.hb_date },
                    calcium: { checked: !!lab.calcium_result, result: lab.calcium_result, date: lab.calcium_date },
                    bun: { checked: !!lab.bun_result, result: lab.bun_result, date: lab.bun_date },
                    glucose: { checked: !!lab.glucose_result, result: lab.glucose_result, date: lab.glucose_date },
                    hba1c: { checked: !!lab.hba1c_result, result: lab.hba1c_result, date: lab.hba1c_date },
                    magnesium: { checked: !!lab.magnesium_result, result: lab.magnesium_result, date: lab.magnesium_date },
                    sodium: { checked: !!lab.sodium_result, result: lab.sodium_result, date: lab.sodium_date },
                    tsh: { checked: !!lab.tsh_result, result: lab.tsh_result, date: lab.tsh_date },
                    t3: { checked: !!lab.t3_result, result: lab.t3_result, date: lab.t3_date },
                    t4: { checked: !!lab.t4_result, result: lab.t4_result, date: lab.t4_date },
                    bnp: { checked: !!lab.bnp_result, result: lab.bnp_result, date: lab.bnp_date },
                    ntProBnp: { checked: !!lab.nt_pro_bnp_result, result: lab.nt_pro_bnp_result, date: lab.nt_pro_bnp_date },
                    ldl: { checked: !!lab.ldl_result, result: lab.ldl_result, date: lab.ldl_date },
                    inr: { checked: !!lab.inr_result, result: lab.inr_result, date: lab.inr_date },
                    st2: { checked: !!lab.st2_result, result: lab.st2_result, date: lab.st2_date },
                    other: { checked: !!lab.other_lab_test_name, name: lab.other_lab_test_name, result: lab.other_lab_test_result, date: lab.other_lab_test_date }
                },
                ecgDate: cardiac.ecg_test_date,
                ecgQrsDuration: cardiac.ecg_qrs_duration,
                ecgRhythm,
                ecgRhythmOther: cardiac.ecg_rhythm_other_details,
                ecgAvConduction,
                ecgQWaves,
                ecgQWavesLeads: cardiac.ecg_qwave_leads,
                ecgBlockages,
                ecgBlockagesOther: cardiac.ecg_block_other_details,
                ecgExtraBeats,
                ecgQt: cardiac.ecg_qt,
                ecgQtc: cardiac.ecg_qtc,
                cxrDate: cardiac.chest_xray_test_date,
                cxrCtRatio: cardiac.cardiothoracic_ratio,
                cxrPvh: cardiac.chest_pvh === 'Yes',
                cxrPulmonaryEdema: cardiac.chest_pulmonary_edema === 'Yes',
                cxrPleuralEffusion: cardiac.chest_pleural_effusion === 'Yes',
                cxrOthers: cardiac.chest_other_details,
                echoDate: cardiac.echo_test_date,
                echoEfPercent: cardiac.echo_ef,
                echoEaRatio: cardiac.echo_ea_ratio,
                echoRvTapsv: cardiac.echo_rv_tapsv,
                echoEePrimeRatio: cardiac.echo_ee_ratio,
                echoEDecelTime: cardiac.echo_deceleration_time,
                echoLaDimension: cardiac.echo_left_atrium_dimension === 'Yes',
                echoLvSystole: cardiac.echo_left_ventricle_systole === 'Yes',
                echoLvDiastole: cardiac.echo_left_ventricle_diastole === 'Yes',
                echoMrMitralRegurg,
                echoOtherValves: cardiac.other_valves,
                echoRvSystolicPressure: cardiac.rv_systolic_pressure,
                echoRvFunction,
                echoRwmi,
                holterDate: advanced.holter_test_date,
                holterVpcChecked: advanced.ventricular_pvc === 'Yes',
                holterVentricularArrhythmia,
                holterAtrialArrhythmias,
                holterHrv: advanced.heart_rate_variability,
                stressStatus,
                stressDate: advanced.stress_test_date,
                stressMets: advanced.stress_mets_achieved,
                stressTargetHr: advanced.stress_target_heart_rate_achieved,
                stressIschemicChanges,
                stressArrhythmias,
                mriLvef: advanced.mri_lvef,
                mriScar,
                mriDate: advanced.mri_test_date,
                petDate: advanced.pet_test_date,
                sixMwtStatus,
                sixMwtDate: advanced.six_minute_walk_date,
                sixMwtDistance: advanced.six_minute_walk_distance,
                sixMwtHrRecovery: advanced.six_minute_walk_heart_rate_recovery,
                sixMwtNotDoneReason: advanced.six_minute_walk_reason,
                anaerobicDate: advanced.anaerobic_threshold_test_date,
                angioStatus,
                angioDate: advanced.angiogram_test_date,
                angioFinding,
                biopsyStatus,
                biopsyDate: advanced.biopsy_test_date
            },
            medicalTherapy,
            deviceTherapy: device,
            patientEducation: education,
            recommendations: {
                fluidAndDiet: recommendation.fluid_and_diet_details,
                fluid_and_diet: recommendation.fluid_and_diet,
                fluid_and_diet_details: recommendation.fluid_and_diet_details,
                exercise: recommendation.exercise,
                exercise_details: recommendation.exercise_details,
                yoga: recommendation.yoga,
                yoga_details: recommendation.yoga_details,
                smoking_cessation: recommendation.smoking_cessation,
                smoking_cessation_details: recommendation.smoking_cessation_details,
                stress_management: recommendation.stress_management,
                stress_management_details: recommendation.stress_management_details,
                drugs: recommendation.drugs,
                drugs_details: recommendation.drugs_details,
                investigations: recommendation.investigations,
                investigations_details: recommendation.investigations_details,
                procedures: recommendation.procedures,
                procedures_details: recommendation.procedures_details,
                other_recommendation: recommendation.other_recommendation,
                other_recommendation_details: recommendation.other_recommendation_details
            }
        };
    } finally {
        conn.release();
    }
}

module.exports = {
    saveHfAssessment,
    getHfHistory,
    getHfAssessment
};
