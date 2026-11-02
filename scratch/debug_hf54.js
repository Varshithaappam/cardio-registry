const db = require('../backend/config/db');

async function debug54() {
  const { recordset } = await db.query(`
    WITH RawPool AS (
      SELECT 
        hr.hf_id,
        TRY_CAST(ia.systolic_bp_sitting AS FLOAT) AS sbp,
        TRY_CAST(ia.heart_rate AS FLOAT) AS hr_bpm,
        TRY_CAST(lt.creatinine_result AS FLOAT) AS creat,
        TRY_CAST(lt.potassium_result AS FLOAT) AS k_val,
        LOWER(CONCAT(
            ' ', ISNULL(ha.present_diagnosis, ''),
            ' ', CASE WHEN LOWER(LTRIM(RTRIM(ISNULL(ha.myocardial_ischemia, '')))) = 'yes' THEN 'myocardial ischemia ' ELSE '' END,
            ' ', CASE WHEN LOWER(LTRIM(RTRIM(ISNULL(ha.atrial_fibrillation, '')))) = 'yes' THEN 'atrial fibrillation ' ELSE '' END,
            ' ', CASE WHEN LOWER(LTRIM(RTRIM(ISNULL(ha.bradyarrhythmia, '')))) = 'yes' THEN 'bradyarrhythmia ' ELSE '' END,
            ' ', CASE WHEN LOWER(LTRIM(RTRIM(ISNULL(ha.ventricular_tachycardia, '')))) = 'yes' THEN 'ventricular tachycardia ' ELSE '' END,
            ' ', CASE WHEN LOWER(LTRIM(RTRIM(ISNULL(ha.uncontrolled_hypertension, '')))) = 'yes' THEN 'uncontrolled hypertension ' ELSE '' END,
            ' ', CASE WHEN LOWER(LTRIM(RTRIM(ISNULL(ha.infection, '')))) = 'yes' THEN 'infection ' ELSE '' END,
            ' ', CASE WHEN LOWER(LTRIM(RTRIM(ISNULL(ha.renal_failure, '')))) = 'yes' THEN 'renal failure ' ELSE '' END,
            ' ', CASE WHEN LOWER(LTRIM(RTRIM(ISNULL(ha.anaemia, '')))) = 'yes' THEN 'anaemia ' ELSE '' END,
            ' ', CASE WHEN LOWER(LTRIM(RTRIM(ISNULL(ha.medication_non_adherence, '')))) = 'yes' THEN 'medication non adherence ' ELSE '' END,
            ' ', CASE WHEN LOWER(LTRIM(RTRIM(ISNULL(ha.excessive_salt_intake, '')))) = 'yes' THEN 'excessive salt intake ' ELSE '' END,
            ' ', CASE WHEN LOWER(LTRIM(RTRIM(ISNULL(ha.excessive_water_ingestion, '')))) = 'yes' THEN 'excessive water ingestion ' ELSE '' END,
            ' ', CASE WHEN LOWER(LTRIM(RTRIM(ISNULL(ha.progressive_worsening, '')))) = 'yes' THEN 'progressive worsening ' ELSE '' END,
            ' ', ISNULL(ha.precipitating_other, ''),
            ' ', ISNULL(ia.previous_diagnosis, ''),
            ' ', CASE WHEN LOWER(LTRIM(RTRIM(ISNULL(fa.diabetes_mellitus, '')))) = 'yes' THEN 'diabetes mellitus ' ELSE '' END,
            ' ', CASE WHEN LOWER(LTRIM(RTRIM(ISNULL(fa.hypertension, '')))) = 'yes' THEN 'hypertension ' ELSE '' END,
            ' ', CASE WHEN LOWER(LTRIM(RTRIM(ISNULL(fa.renal_failure, '')))) = 'yes' THEN 'renal failure ckd ' ELSE '' END,
            ' ', CASE WHEN LOWER(LTRIM(RTRIM(ISNULL(fa.cad, '')))) = 'yes' THEN 'cad coronary artery disease ' ELSE '' END
        )) AS diag_text
      FROM dbo.hf_registry hr
      LEFT JOIN dbo.hf_administrative ha ON ha.hf_id = hr.hf_id
      LEFT JOIN dbo.hf_initial_assessment ia ON ia.hf_id = hr.hf_id
      LEFT JOIN dbo.hf_final_clinical_assessment fa ON fa.hf_id = hr.hf_id
      LEFT JOIN dbo.hf_lab_tests lt ON lt.hf_id = hr.hf_id
      WHERE hr.hf_id = 54
    )
    SELECT 
      *,
      CASE WHEN sbp < 90 THEN 1 ELSE 0 END AS flag_i,
      CASE WHEN k_val > 5.5 OR diag_text LIKE '%hyperkal%' THEN 1 ELSE 0 END AS flag_m,
      CASE WHEN creat > 2.5 OR diag_text LIKE '%renal%' OR diag_text LIKE '%ckd%' THEN 1 ELSE 0 END AS flag_o
    FROM RawPool;
  `);

  console.log('RawPool & flags for 54:', recordset[0]);
  process.exit(0);
}

debug54().catch(console.error);

