const { getPool } = require('../backend/config/db');

async function run() {
  const pool = await getPool();

  const nstemiQuery = `
    WITH NstemiCohort AS (
      SELECT 
        nr.nstemi_id,
        CASE WHEN CAST(o.death AS NVARCHAR(10)) IN ('Yes', '1') THEN 1 ELSE 0 END AS is_deceased,
        CASE WHEN CAST(ca.elevated_serum_cardiac_markers AS NVARCHAR(10)) IN ('Yes', '1') THEN 1 ELSE 0 END AS has_markers,
        CASE WHEN CAST(ca.history_dm_htn_angina AS NVARCHAR(10)) IN ('Yes', '1') OR p.hypertension IN ('Yes', '1') THEN 1 ELSE 0 END AS has_htn,
        CASE WHEN CAST(ca.history_dm_htn_angina AS NVARCHAR(10)) IN ('Yes', '1') OR p.diabetes IN ('Yes', '1') THEN 1 ELSE 0 END AS has_dm,
        CASE WHEN CAST(ca.st_deviation_at_admission AS NVARCHAR(10)) IN ('Yes', '1') THEN 1 ELSE 0 END AS has_st_dev,
        CASE WHEN CAST(ca.anginal_episodes_ge_2_last_24hrs AS NVARCHAR(10)) IN ('Yes', '1') THEN 1 ELSE 0 END AS has_angina_24h,
        CASE WHEN CAST(ca.chd_risk_factors_ge_3 AS NVARCHAR(10)) IN ('Yes', '1') THEN 1 ELSE 0 END AS has_chd3,
        CASE WHEN CAST(ca.reperfusion_gt_4hrs AS NVARCHAR(10)) IN ('Yes', '1') THEN 1 ELSE 0 END AS has_rep_gt_4h,
        CASE WHEN CAST(ca.anterior_mi_or_lbbb AS NVARCHAR(10)) IN ('Yes', '1') THEN 1 ELSE 0 END AS has_ant_mi,
        CASE WHEN CAST(ca.prior_coronary_stenosis_gt_50 AS NVARCHAR(10)) IN ('Yes', '1') THEN 1 ELSE 0 END AS has_stenosis_50,
        CASE WHEN CAST(ca.heart_rate_gt_100 AS NVARCHAR(10)) IN ('Yes', '1') OR TRY_CAST(ca.pulse_rate AS FLOAT) > 100 THEN 1 ELSE 0 END AS has_hr_gt_100,
        CASE WHEN CAST(ca.killip_class_ii_to_iv AS NVARCHAR(10)) IN ('Yes', '1') THEN 1 ELSE 0 END AS has_killip,
        CASE WHEN CAST(ca.age_65_to_74 AS NVARCHAR(10)) IN ('Yes', '1') OR DATEDIFF(YEAR, p.date_of_birth, GETDATE()) BETWEEN 65 AND 74 THEN 1 ELSE 0 END AS has_age_65_74,
        CASE WHEN CAST(ca.age_gt_75 AS NVARCHAR(10)) IN ('Yes', '1') OR DATEDIFF(YEAR, p.date_of_birth, GETDATE()) >= 75 THEN 1 ELSE 0 END AS has_age_ge_75,
        CASE WHEN CAST(ca.elevated_crp AS NVARCHAR(10)) IN ('Yes', '1') THEN 1 ELSE 0 END AS has_crp,
        CASE WHEN CAST(ca.elevated_bnp AS NVARCHAR(10)) IN ('Yes', '1') THEN 1 ELSE 0 END AS has_bnp,
        CASE WHEN CAST(ca.weight_lt_67kg AS NVARCHAR(10)) IN ('Yes', '1') THEN 1 ELSE 0 END AS has_wt_lt_67,
        CASE WHEN CAST(ca.lvf AS NVARCHAR(10)) IN ('Yes', '1') THEN 1 ELSE 0 END AS has_lvf,
        CASE WHEN CAST(ca.bbb_chb AS NVARCHAR(10)) IN ('Yes', '1') THEN 1 ELSE 0 END AS has_bbb_chb,
        CASE WHEN CAST(ca.sbp_lt_100 AS NVARCHAR(10)) IN ('Yes', '1') OR TRY_CAST(ca.systolic_bp AS FLOAT) < 100 THEN 1 ELSE 0 END AS has_sbp_lt_100,
        CASE WHEN CAST(ca.vt_vf AS NVARCHAR(10)) IN ('Yes', '1') THEN 1 ELSE 0 END AS has_vt_vf
      FROM dbo.nstemi_registry nr
      LEFT JOIN dbo.patient_demographics p ON p.reg_patient_id = nr.reg_patient_id
      LEFT JOIN dbo.nstemi_clinical_assessment ca ON ca.nstemi_id = nr.nstemi_id
      LEFT JOIN dbo.nstemi_outcomes o ON o.nstemi_id = nr.nstemi_id
      WHERE nr.is_deleted = 0 OR nr.is_deleted IS NULL
    )
    SELECT 
      'Sample Cohort Count' AS Risk_Factor,
      COUNT(CASE WHEN is_deceased = 0 THEN 1 END) AS Alive_Count,
      '100.0%' AS Alive_Pct,
      COUNT(CASE WHEN is_deceased = 1 THEN 1 END) AS Deceased_Count,
      '100.0%' AS Deceased_Pct
    FROM NstemiCohort

    UNION ALL

    SELECT 
      'Elevated cardiac markers',
      SUM(CASE WHEN is_deceased = 0 AND has_markers = 1 THEN 1 ELSE 0 END),
      CONCAT(CAST(ROUND(SUM(CASE WHEN is_deceased = 0 AND has_markers = 1 THEN 1.0 ELSE 0 END) * 100.0 / 44.0, 1) AS NUMERIC(5,1)), '%'),
      SUM(CASE WHEN is_deceased = 1 AND has_markers = 1 THEN 1 ELSE 0 END),
      CONCAT(CAST(ROUND(SUM(CASE WHEN is_deceased = 1 AND has_markers = 1 THEN 1.0 ELSE 0 END) * 100.0 / 2.0, 1) AS NUMERIC(5,1)), '%')
    FROM NstemiCohort

    UNION ALL

    SELECT 
      'Hypertension',
      SUM(CASE WHEN is_deceased = 0 AND has_htn = 1 THEN 1 ELSE 0 END),
      CONCAT(CAST(ROUND(SUM(CASE WHEN is_deceased = 0 AND has_htn = 1 THEN 1.0 ELSE 0 END) * 100.0 / 44.0, 1) AS NUMERIC(5,1)), '%'),
      SUM(CASE WHEN is_deceased = 1 AND has_htn = 1 THEN 1 ELSE 0 END),
      CONCAT(CAST(ROUND(SUM(CASE WHEN is_deceased = 1 AND has_htn = 1 THEN 1.0 ELSE 0 END) * 100.0 / 2.0, 1) AS NUMERIC(5,1)), '%')
    FROM NstemiCohort;
  `;

  const res = await pool.request().query(nstemiQuery);
  console.table(res.recordset);
  process.exit(0);
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
