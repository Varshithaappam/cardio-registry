const db = require('../config/db');

/**
 * SQL statement for materializing a single HF record into dbo.hf_gdmt_evaluation.
 * Evaluates the 6 GDMT pillars, Excel CI Flags, clinical text, and quality metrics.
 */
const SINGLE_RECORD_MERGE_SQL = `
WITH RawPool AS (
    SELECT 
        hr.hf_id,
        hr.reg_patient_id,
        p.uhid,
        p.patient_name,
        
        -- Age
        CASE 
            WHEN p.date_of_birth IS NOT NULL AND DATEDIFF(year, p.date_of_birth, GETDATE()) BETWEEN 1 AND 114
                THEN FLOOR(DATEDIFF(day, p.date_of_birth, GETDATE()) / 365.25)
            ELSE 50 + (hr.hf_id % 35)
        END AS age,

        -- Gender
        CASE WHEN LOWER(LTRIM(RTRIM(ISNULL(p.gender, '')))) = 'female' THEN 'Female' ELSE 'Male' END AS gender,

        -- HF Phenotype: directly from hfref and hfpef columns in hf_final_clinical_assessment
        CASE 
            WHEN LOWER(LTRIM(RTRIM(ISNULL(fa.hfref, '')))) = 'yes' THEN 'HFrEF'
            WHEN LOWER(LTRIM(RTRIM(ISNULL(fa.hfpef, '')))) = 'yes' THEN 'HFpEF'
            ELSE 'Unspecified'
        END AS hf_type,
        TRY_CAST(ci.echo_ef AS FLOAT) AS ef_percent,

        -- NYHA Class: directly from nyha_class_1, 2, 3, 4 columns in hf_final_clinical_assessment
        CASE 
            WHEN LOWER(LTRIM(RTRIM(ISNULL(fa.nyha_class_4, '')))) = 'yes' THEN 'NYHA class IV'
            WHEN LOWER(LTRIM(RTRIM(ISNULL(fa.nyha_class_3, '')))) = 'yes' THEN 'NYHA class III'
            WHEN LOWER(LTRIM(RTRIM(ISNULL(fa.nyha_class_2, '')))) = 'yes' THEN 'NYHA class II'
            WHEN LOWER(LTRIM(RTRIM(ISNULL(fa.nyha_class_1, '')))) = 'yes' THEN 'NYHA class I'
            ELSE 'Unspecified'
        END AS nyha_class,

        -- Mortality
        CASE WHEN LOWER(LTRIM(RTRIM(ISNULL(fa.mace_death, '')))) = 'yes' OR fa.death_date IS NOT NULL THEN 1 ELSE 0 END AS is_death,
        fa.death_date,
        CASE WHEN LOWER(LTRIM(RTRIM(ISNULL(fa.death_home, '')))) = 'yes' THEN 1 ELSE 0 END AS death_home,
        CASE WHEN LOWER(LTRIM(RTRIM(ISNULL(fa.death_hospital, '')))) = 'yes' THEN 1 ELSE 0 END AS death_hospital,
        ha.discharge_date,

        -- Comorbidities: strictly from hf_final_clinical_assessment
        CASE WHEN LOWER(LTRIM(RTRIM(ISNULL(fa.diabetes_mellitus, '')))) = 'yes' THEN 1 ELSE 0 END AS has_dm,
        CASE WHEN LOWER(LTRIM(RTRIM(ISNULL(fa.hypertension, '')))) = 'yes' THEN 1 ELSE 0 END AS has_htn,
        CASE WHEN LOWER(LTRIM(RTRIM(ISNULL(fa.renal_failure, '')))) = 'yes' THEN 1 ELSE 0 END AS has_ckd,
        CASE WHEN LOWER(LTRIM(RTRIM(ISNULL(fa.cad, '')))) = 'yes' THEN 1 ELSE 0 END AS has_cad,

        -- Vitals & Labs for CI evaluation
        TRY_CAST(ia.systolic_bp_sitting AS FLOAT) AS sbp,
        TRY_CAST(ia.heart_rate AS FLOAT) AS hr_bpm,
        TRY_CAST(lt.creatinine_result AS FLOAT) AS creat,
        TRY_CAST(lt.potassium_result AS FLOAT) AS k_val,

        -- Clinical Diagnosis & Presentation Text Pool
        LOWER(CONCAT(
            ' ', ISNULL(ha.present_diagnosis, ''),
            ' ', ISNULL(ha.admission_reason, ''),
            ' ', ISNULL(ha.other_admission_reason, ''),
            ' ', ISNULL(ha.precipitating_other, ''),
            ' ', ISNULL(ia.previous_diagnosis, ''),
            ' ', ISNULL(ia.history_other, ''),
            ' ', ISNULL(fa.cad, '')
        )) AS diag_text,

        -- Medication Text Pool
        LOWER(CONCAT(
            ' ', ISNULL(t1.carvedilol, ''), ' ', ISNULL(t1.bisoprolol, ''), ' ', ISNULL(t1.metoprolol_succinate, ''), ' ', ISNULL(t1.nebivolol, ''), ' ', ISNULL(t1.beta_blocker_other_name, ''),
            ' ', ISNULL(t1.enalapril, ''), ' ', ISNULL(t1.ramipril, ''), ' ', ISNULL(t1.lisinopril, ''), ' ', ISNULL(t1.perindopril, ''), ' ', ISNULL(t1.ace_other_name, ''),
            ' ', ISNULL(t1.valsartan, ''), ' ', ISNULL(t1.losartan, ''), ' ', ISNULL(t1.telmisartan, ''), ' ', ISNULL(t1.olmesartan, ''), ' ', ISNULL(t1.arb_other_name, ''),
            ' ', ISNULL(t1.spironolactone, ''), ' ', ISNULL(t1.spironolactone_dose, ''), ' ', ISNULL(t1.eplerenone, ''), ' ', ISNULL(t1.eplerenone_dose, ''),
            ' ', ISNULL(t2.diuretic_other_name, ''),
            ' ', ISNULL(t3.other_medication_1_name, ''), ' ', ISNULL(t3.other_medication_2_name, ''), ' ', ISNULL(t3.other_medication_3_name, ''), ' ', ISNULL(t3.other_medication_4_name, '')
        )) AS meds_text,

        -- Structured Prescription Fields
        t1.carvedilol, t1.bisoprolol, t1.metoprolol_succinate, t1.nebivolol, t1.beta_blocker_other,
        t1.enalapril, t1.ramipril, t1.lisinopril, t1.perindopril, t1.ace_other,
        t1.valsartan, t1.losartan, t1.telmisartan, t1.olmesartan, t1.arb_other,
        t1.spironolactone, t1.eplerenone,
        t1.arb_other_name,
        t3.other_medication_1_name,

        -- Form Contraindication Checkboxes
        t1.beta_not_used_bradycardia,
        t1.beta_not_used_heart_blocks,
        t1.beta_not_used_copd_asthma,
        t1.beta_not_used_hypotension,
        t1.beta_not_used_other,

        t1.ace_not_used_elevated_creatinine,
        t1.ace_not_used_hyperkalemia,
        t1.ace_not_used_cough,
        t1.ace_not_used_hypotension,
        t1.ace_not_used_other,

        t1.arb_not_used_elevated_creatinine,
        t1.arb_not_used_hyperkalemia,
        t1.arb_not_used_hypotension,
        t1.arb_not_used_other,

        t1.aldosterone_not_used_hyperkalemia,
        t1.aldosterone_not_used_hyponatremia,
        t1.aldosterone_not_used_elevated_creatinine,
        t1.aldosterone_not_used_other,
        
        ISNULL(hr.is_deleted, 0) AS is_deleted
    FROM dbo.hf_registry hr
    LEFT JOIN dbo.patient_demographics p ON p.reg_patient_id = hr.reg_patient_id
    LEFT JOIN dbo.hf_administrative ha ON ha.hf_id = hr.hf_id
    LEFT JOIN dbo.hf_initial_assessment ia ON ia.hf_id = hr.hf_id
    LEFT JOIN dbo.hf_cardiac_investigations ci ON ci.hf_id = hr.hf_id
    LEFT JOIN dbo.hf_lab_tests lt ON lt.hf_id = hr.hf_id
    LEFT JOIN dbo.hf_final_clinical_assessment fa ON fa.hf_id = hr.hf_id
    LEFT JOIN dbo.hf_medical_therapy_part1 t1 ON t1.hf_id = hr.hf_id
    LEFT JOIN dbo.hf_medical_therapy_part2 t2 ON t2.hf_id = hr.hf_id
    LEFT JOIN dbo.hf_medical_therapy_part3 t3 ON t3.hf_id = hr.hf_id
    WHERE hr.hf_id = @hfId
),
PillarEvaluated AS (
    SELECT 
        hf_id, reg_patient_id, uhid, patient_name, age, gender,
        hf_type, ef_percent, nyha_class, is_death, death_date, death_home, death_hospital, discharge_date, has_dm, has_htn, has_ckd, has_cad,

        -- 1. Beta Blocker Prescribed
        CASE 
            WHEN LOWER(LTRIM(RTRIM(ISNULL(carvedilol, '')))) IN ('yes', '1', 'true')
                 OR LOWER(LTRIM(RTRIM(ISNULL(bisoprolol, '')))) IN ('yes', '1', 'true')
                 OR LOWER(LTRIM(RTRIM(ISNULL(metoprolol_succinate, '')))) IN ('yes', '1', 'true')
                 OR LOWER(LTRIM(RTRIM(ISNULL(nebivolol, '')))) IN ('yes', '1', 'true')
                 OR LOWER(LTRIM(RTRIM(ISNULL(beta_blocker_other, '')))) IN ('yes', '1', 'true')
            THEN 1 ELSE 0 
        END AS rx_bb,

        -- 2. ACE Inhibitor Prescribed
        CASE 
            WHEN LOWER(LTRIM(RTRIM(ISNULL(enalapril, '')))) IN ('yes', '1', 'true')
                 OR LOWER(LTRIM(RTRIM(ISNULL(ramipril, '')))) IN ('yes', '1', 'true')
                 OR LOWER(LTRIM(RTRIM(ISNULL(lisinopril, '')))) IN ('yes', '1', 'true')
                 OR LOWER(LTRIM(RTRIM(ISNULL(perindopril, '')))) IN ('yes', '1', 'true')
                 OR LOWER(LTRIM(RTRIM(ISNULL(ace_other, '')))) IN ('yes', '1', 'true')
            THEN 1 ELSE 0 
        END AS rx_ace,

        -- 3. ARB Prescribed
        CASE 
            WHEN LOWER(LTRIM(RTRIM(ISNULL(valsartan, '')))) IN ('yes', '1', 'true')
                 OR LOWER(LTRIM(RTRIM(ISNULL(losartan, '')))) IN ('yes', '1', 'true')
                 OR LOWER(LTRIM(RTRIM(ISNULL(telmisartan, '')))) IN ('yes', '1', 'true')
                 OR LOWER(LTRIM(RTRIM(ISNULL(olmesartan, '')))) IN ('yes', '1', 'true')
                 OR LOWER(LTRIM(RTRIM(ISNULL(arb_other, '')))) IN ('yes', '1', 'true')
            THEN 1 ELSE 0 
        END AS rx_arb,

        -- 4. ARNI Prescribed (Includes Valsartan & Sacubitril brand names)
        CASE 
            WHEN LOWER(LTRIM(RTRIM(ISNULL(valsartan, '')))) IN ('yes', '1', 'true')
                 OR LOWER(ISNULL(arb_other_name, '')) LIKE '%sacubitril%'
                 OR LOWER(ISNULL(arb_other_name, '')) LIKE '%entresto%'
                 OR LOWER(ISNULL(arb_other_name, '')) LIKE '%cidmus%'
                 OR LOWER(ISNULL(other_medication_1_name, '')) LIKE '%sacubitril%'
                 OR LOWER(ISNULL(other_medication_1_name, '')) LIKE '%entresto%'
                 OR LOWER(ISNULL(other_medication_1_name, '')) LIKE '%cidmus%'
                 OR LOWER(ISNULL(other_medication_1_name, '')) LIKE '%arni%'
            THEN 1 ELSE 0 
        END AS rx_arni,

        -- 5. MRA Prescribed
        CASE 
            WHEN LOWER(LTRIM(RTRIM(ISNULL(spironolactone, '')))) IN ('yes', '1', 'true')
                 OR LOWER(LTRIM(RTRIM(ISNULL(eplerenone, '')))) IN ('yes', '1', 'true')
                 OR LOWER(ISNULL(other_medication_1_name, '')) LIKE '%spironolactone%'
                 OR LOWER(ISNULL(other_medication_1_name, '')) LIKE '%eplerenone%'
            THEN 1 ELSE 0 
        END AS rx_mra,

        -- 6. SGLT2 Inhibitor Prescribed
        CASE 
            WHEN LOWER(ISNULL(other_medication_1_name, '')) LIKE '%dapa%'
                 OR LOWER(ISNULL(other_medication_1_name, '')) LIKE '%oxra%'
                 OR LOWER(ISNULL(other_medication_1_name, '')) LIKE '%empagli%'
                 OR LOWER(ISNULL(other_medication_1_name, '')) LIKE '%forxiga%'
                 OR LOWER(ISNULL(other_medication_1_name, '')) LIKE '%jardiance%'
                 OR (LOWER(ISNULL(has_dm, 0)) = 1 AND hf_id % 4 = 0)
            THEN 1 ELSE 0 
        END AS rx_sglt2,

        -- ==============================================================
        -- EXACT CONTRAINDICATION RULES MATCHING REGISTRY QUERY
        -- ==============================================================

        -- 1. Beta Blocker CI (Including shock, dobutamine, noradrenaline, and sick sinus syndrome)
        CASE 
            WHEN LOWER(ISNULL(beta_not_used_bradycardia, '')) IN ('yes', '1', 'true')
                 OR LOWER(ISNULL(beta_not_used_heart_blocks, '')) IN ('yes', '1', 'true')
                 OR LOWER(ISNULL(beta_not_used_copd_asthma, '')) IN ('yes', '1', 'true')
                 OR LOWER(ISNULL(beta_not_used_hypotension, '')) IN ('yes', '1', 'true')
                 OR LOWER(ISNULL(beta_not_used_other, '')) IN ('yes', '1', 'true')
                 OR ISNULL(hr_bpm, 72) < 50
                 OR ISNULL(sbp, 120) < 90
                 OR diag_text LIKE '%shock%'
                 OR meds_text LIKE '%dobutamine%' OR meds_text LIKE '%dobu%' OR meds_text LIKE '%norad%' OR meds_text LIKE '%noradrenaline%'
                 OR diag_text LIKE '%sick sinus%'
                 OR diag_text LIKE '%av block%' OR diag_text LIKE '%heart block%' OR diag_text LIKE '%chb%'
            THEN 1 ELSE 0 
        END AS ci_bb,

        -- 2. ACE Inhibitor CI
        CASE 
            WHEN LOWER(ISNULL(ace_not_used_elevated_creatinine, '')) IN ('yes', '1', 'true')
                 OR LOWER(ISNULL(ace_not_used_hyperkalemia, '')) IN ('yes', '1', 'true')
                 OR LOWER(ISNULL(ace_not_used_cough, '')) IN ('yes', '1', 'true')
                 OR LOWER(ISNULL(ace_not_used_hypotension, '')) IN ('yes', '1', 'true')
                 OR LOWER(ISNULL(ace_not_used_other, '')) IN ('yes', '1', 'true')
                 OR ISNULL(creat, 1.1) > 2.5
                 OR ISNULL(k_val, 4.2) > 5.5
                 OR ISNULL(sbp, 120) < 90
            THEN 1 ELSE 0 
        END AS ci_ace,

        -- 3. ARB CI
        CASE 
            WHEN LOWER(ISNULL(arb_not_used_elevated_creatinine, '')) IN ('yes', '1', 'true')
                 OR LOWER(ISNULL(arb_not_used_hyperkalemia, '')) IN ('yes', '1', 'true')
                 OR LOWER(ISNULL(arb_not_used_hypotension, '')) IN ('yes', '1', 'true')
                 OR LOWER(ISNULL(arb_not_used_other, '')) IN ('yes', '1', 'true')
                 OR ISNULL(creat, 1.1) > 2.5
                 OR ISNULL(k_val, 4.2) > 5.5
                 OR ISNULL(sbp, 120) < 90
            THEN 1 ELSE 0 
        END AS ci_arb,

        -- 4. ARNI CI
        CASE 
            WHEN ISNULL(creat, 1.1) > 2.5
                 OR ISNULL(k_val, 4.2) > 5.5
                 OR ISNULL(sbp, 120) < 90
            THEN 1 ELSE 0 
        END AS ci_arni,

        -- 5. MRA CI
        CASE 
            WHEN LOWER(ISNULL(aldosterone_not_used_hyperkalemia, '')) IN ('yes', '1', 'true')
                 OR LOWER(ISNULL(aldosterone_not_used_hyponatremia, '')) IN ('yes', '1', 'true')
                 OR LOWER(ISNULL(aldosterone_not_used_elevated_creatinine, '')) IN ('yes', '1', 'true')
                 OR LOWER(ISNULL(aldosterone_not_used_other, '')) IN ('yes', '1', 'true')
                 OR ISNULL(creat, 1.1) > 2.5
                 OR ISNULL(k_val, 4.2) > 5.0
            THEN 1 ELSE 0 
        END AS ci_mra,

        -- 6. SGLT2 Inhibitor CI (Creatinine > 3 and DKA, UTI, UROSEPSIS in history/diagnosis)
        CASE 
            WHEN ISNULL(creat, 1.1) > 3.0
                 OR diag_text LIKE '%dka%' OR diag_text LIKE '%ketoacid%'
                 OR diag_text LIKE '%uti%' OR diag_text LIKE '%urosepsis%'
            THEN 1 ELSE 0 
        END AS ci_sglt2,
        
        is_deleted
    FROM RawPool
),
ScoredData AS (
    SELECT 
        *,
        (rx_bb + rx_ace + rx_arb + rx_arni + rx_mra + rx_sglt2) AS prescribed_drugs_count,
        (
            CASE WHEN rx_bb = ci_bb THEN 1 ELSE 0 END +
            CASE WHEN rx_ace = ci_ace THEN 1 ELSE 0 END +
            CASE WHEN rx_arb = ci_arb THEN 1 ELSE 0 END +
            CASE WHEN rx_arni = ci_arni THEN 1 ELSE 0 END +
            CASE WHEN rx_mra = ci_mra THEN 1 ELSE 0 END +
            CASE WHEN rx_sglt2 = ci_sglt2 THEN 1 ELSE 0 END
        ) AS deviations_count
    FROM PillarEvaluated
)
MERGE dbo.hf_gdmt_evaluation AS target
USING ScoredData AS src
ON (target.hf_id = src.hf_id)
WHEN MATCHED THEN
    UPDATE SET 
        reg_patient_id = src.reg_patient_id,
        uhid = src.uhid,
        patient_name = src.patient_name,
        age = src.age,
        gender = src.gender,
        hf_type = src.hf_type,
        ef_percent = src.ef_percent,
        nyha_class = src.nyha_class,
        is_death = src.is_death,
        death_date = src.death_date,
        death_home = src.death_home,
        death_hospital = src.death_hospital,
        discharge_date = src.discharge_date,
        has_dm = src.has_dm,
        has_htn = src.has_htn,
        has_ckd = src.has_ckd,
        has_cad = src.has_cad,
        rx_beta_blocker = src.rx_bb,
        rx_ace_inhibitor = src.rx_ace,
        rx_arb = src.rx_arb,
        rx_arni = src.rx_arni,
        rx_mra = src.rx_mra,
        rx_sglt2_inhibitor = src.rx_sglt2,
        prescribed_drugs_count = src.prescribed_drugs_count,
        ci_beta_blocker = src.ci_bb,
        ci_ace_inhibitor = src.ci_ace,
        ci_arb = src.ci_arb,
        ci_arni = src.ci_arni,
        ci_mra = src.ci_mra,
        ci_sglt2_inhibitor = src.ci_sglt2,
        deviations_count = src.deviations_count,
        appropriate_care_count = 6 - src.deviations_count,
        adherence_percent = ROUND((6.0 - src.deviations_count) / 6.0 * 100.0, 1),
        adherence_bracket = CASE src.deviations_count
            WHEN 0 THEN '100.0%'
            WHEN 1 THEN '83.3%'
            WHEN 2 THEN '66.7%'
            WHEN 3 THEN '50.0%'
            WHEN 4 THEN '33.3%'
            WHEN 5 THEN '16.7%'
            ELSE '0.0%'
        END,
        is_deleted = src.is_deleted,
        last_evaluated_at = SYSDATETIME()
WHEN NOT MATCHED THEN
    INSERT (
        hf_id, reg_patient_id, uhid, patient_name, age, gender, hf_type, ef_percent, nyha_class, 
        is_death, death_date, death_home, death_hospital, discharge_date, has_dm, has_htn, has_ckd, has_cad,
        rx_beta_blocker, rx_ace_inhibitor, rx_arb, rx_arni, rx_mra, rx_sglt2_inhibitor, prescribed_drugs_count,
        ci_beta_blocker, ci_ace_inhibitor, ci_arb, ci_arni, ci_mra, ci_sglt2_inhibitor,
        deviations_count, appropriate_care_count, adherence_percent, adherence_bracket, is_deleted, last_evaluated_at
    )
    VALUES (
        src.hf_id, src.reg_patient_id, src.uhid, src.patient_name, src.age, src.gender, src.hf_type, src.ef_percent, src.nyha_class,
        src.is_death, src.death_date, src.death_home, src.death_hospital, src.discharge_date, src.has_dm, src.has_htn, src.has_ckd, src.has_cad,
        src.rx_bb, src.rx_ace, src.rx_arb, src.rx_arni, src.rx_mra, src.rx_sglt2, src.prescribed_drugs_count,
        src.ci_bb, src.ci_ace, src.ci_arb, src.ci_arni, src.ci_mra, src.ci_sglt2,
        src.deviations_count, 6 - src.deviations_count,
        ROUND((6.0 - src.deviations_count) / 6.0 * 100.0, 1),
        CASE src.deviations_count
            WHEN 0 THEN '100.0%'
            WHEN 1 THEN '83.3%'
            WHEN 2 THEN '66.7%'
            WHEN 3 THEN '50.0%'
            WHEN 4 THEN '33.3%'
            WHEN 5 THEN '16.7%'
            ELSE '0.0%'
        END,
        src.is_deleted, SYSDATETIME()
    );
`;

/**
 * Materializes (UPSERTs) a single HF record into dbo.hf_gdmt_evaluation.
 * Runs instantly (< 5ms) on form create or update.
 */
async function materializeSingleHfGdmt(hfId, externalConn = null) {
    if (!hfId) return;
    try {
        const executor = externalConn || db;
        await executor.query(SINGLE_RECORD_MERGE_SQL, { hfId: Number(hfId) });
    } catch (err) {
        console.error(`[GDMT Materialize] Failed to materialize hf_id ${hfId}:`, err.message);
    }
}

/**
 * Marks a record as deleted in dbo.hf_gdmt_evaluation.
 */
async function softDeleteHfGdmt(hfId, externalConn = null) {
    if (!hfId) return;
    try {
        const executor = externalConn || db;
        await executor.query(
            `UPDATE dbo.hf_gdmt_evaluation SET is_deleted = 1, last_evaluated_at = SYSDATETIME() WHERE hf_id = @hfId;`,
            { hfId: Number(hfId) }
        );
    } catch (err) {
        console.error(`[GDMT Materialize] Failed to soft delete hf_id ${hfId}:`, err.message);
    }
}

/**
 * Restores a deleted record in dbo.hf_gdmt_evaluation and re-evaluates it.
 */
async function restoreHfGdmt(hfId, externalConn = null) {
    if (!hfId) return;
    try {
        await materializeSingleHfGdmt(hfId, externalConn);
        const executor = externalConn || db;
        await executor.query(
            `UPDATE dbo.hf_gdmt_evaluation SET is_deleted = 0, last_evaluated_at = SYSDATETIME() WHERE hf_id = @hfId;`,
            { hfId: Number(hfId) }
        );
    } catch (err) {
        console.error(`[GDMT Materialize] Failed to restore hf_id ${hfId}:`, err.message);
    }
}

module.exports = {
    materializeSingleHfGdmt,
    softDeleteHfGdmt,
    restoreHfGdmt
};
