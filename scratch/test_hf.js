const db = require('../backend/config/db');

async function test() {
  console.log('--- TESTING NSTEMI PURE DYNAMIC QUERY ---');
  const nstemiQ = `
    WITH NstemiCohort AS (
        SELECT 
            nr.nstemi_id,
            -- Mortality Flag (1 = Deceased, 0 = Alive)
            CASE 
                WHEN CAST(o.death AS NVARCHAR(10)) IN ('Yes', '1') 
                THEN 1 ELSE 0 
            END AS is_deceased,
            
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
    ),
    CohortDenominators AS (
        SELECT 
            NULLIF(SUM(CASE WHEN is_deceased = 0 THEN 1 ELSE 0 END), 0) AS total_alive,
            NULLIF(SUM(CASE WHEN is_deceased = 1 THEN 1 ELSE 0 END), 0) AS total_deceased
        FROM NstemiCohort
    )
    SELECT 
        'Sample Cohort Count' AS Risk_Factor,
        d.total_alive AS Alive_Count,
        '100.0%' AS Alive_Pct,
        d.total_deceased AS Deceased_Count,
        '100.0%' AS Deceased_Pct
    FROM CohortDenominators d

    UNION ALL

    SELECT 
        'Elevated cardiac markers',
        SUM(CASE WHEN n.is_deceased = 0 AND n.has_markers = 1 THEN 1 ELSE 0 END),
        CONCAT(CAST(ROUND(SUM(CASE WHEN n.is_deceased = 0 AND n.has_markers = 1 THEN 1.0 ELSE 0 END) * 100.0 / d.total_alive, 1) AS NUMERIC(5,1)), '%'),
        SUM(CASE WHEN n.is_deceased = 1 AND n.has_markers = 1 THEN 1 ELSE 0 END),
        CONCAT(CAST(ROUND(SUM(CASE WHEN n.is_deceased = 1 AND n.has_markers = 1 THEN 1.0 ELSE 0 END) * 100.0 / d.total_deceased, 1) AS NUMERIC(5,1)), '%')
    FROM NstemiCohort n
    CROSS JOIN CohortDenominators d
    GROUP BY d.total_alive, d.total_deceased

    UNION ALL

    SELECT 
        'Hypertension',
        SUM(CASE WHEN n.is_deceased = 0 AND n.has_htn = 1 THEN 1 ELSE 0 END),
        CONCAT(CAST(ROUND(SUM(CASE WHEN n.is_deceased = 0 AND n.has_htn = 1 THEN 1.0 ELSE 0 END) * 100.0 / d.total_alive, 1) AS NUMERIC(5,1)), '%'),
        SUM(CASE WHEN n.is_deceased = 1 AND n.has_htn = 1 THEN 1 ELSE 0 END),
        CONCAT(CAST(ROUND(SUM(CASE WHEN n.is_deceased = 1 AND n.has_htn = 1 THEN 1.0 ELSE 0 END) * 100.0 / d.total_deceased, 1) AS NUMERIC(5,1)), '%')
    FROM NstemiCohort n
    CROSS JOIN CohortDenominators d
    GROUP BY d.total_alive, d.total_deceased

    UNION ALL

    SELECT 
        'Diabetes',
        SUM(CASE WHEN n.is_deceased = 0 AND n.has_dm = 1 THEN 1 ELSE 0 END),
        CONCAT(CAST(ROUND(SUM(CASE WHEN n.is_deceased = 0 AND n.has_dm = 1 THEN 1.0 ELSE 0 END) * 100.0 / d.total_alive, 1) AS NUMERIC(5,1)), '%'),
        SUM(CASE WHEN n.is_deceased = 1 AND n.has_dm = 1 THEN 1 ELSE 0 END),
        CONCAT(CAST(ROUND(SUM(CASE WHEN n.is_deceased = 1 AND n.has_dm = 1 THEN 1.0 ELSE 0 END) * 100.0 / d.total_deceased, 1) AS NUMERIC(5,1)), '%')
    FROM NstemiCohort n
    CROSS JOIN CohortDenominators d
    GROUP BY d.total_alive, d.total_deceased

    UNION ALL

    SELECT 
        'ST deviation at admission',
        SUM(CASE WHEN n.is_deceased = 0 AND n.has_st_dev = 1 THEN 1 ELSE 0 END),
        CONCAT(CAST(ROUND(SUM(CASE WHEN n.is_deceased = 0 AND n.has_st_dev = 1 THEN 1.0 ELSE 0 END) * 100.0 / d.total_alive, 1) AS NUMERIC(5,1)), '%'),
        SUM(CASE WHEN n.is_deceased = 1 AND n.has_st_dev = 1 THEN 1 ELSE 0 END),
        CONCAT(CAST(ROUND(SUM(CASE WHEN n.is_deceased = 1 AND n.has_st_dev = 1 THEN 1.0 ELSE 0 END) * 100.0 / d.total_deceased, 1) AS NUMERIC(5,1)), '%')
    FROM NstemiCohort n
    CROSS JOIN CohortDenominators d
    GROUP BY d.total_alive, d.total_deceased

    UNION ALL

    SELECT 
        '2 or more angina episodes in 24 hrs',
        SUM(CASE WHEN n.is_deceased = 0 AND n.has_angina_24h = 1 THEN 1 ELSE 0 END),
        CONCAT(CAST(ROUND(SUM(CASE WHEN n.is_deceased = 0 AND n.has_angina_24h = 1 THEN 1.0 ELSE 0 END) * 100.0 / d.total_alive, 1) AS NUMERIC(5,1)), '%'),
        SUM(CASE WHEN n.is_deceased = 1 AND n.has_angina_24h = 1 THEN 1 ELSE 0 END),
        CONCAT(CAST(ROUND(SUM(CASE WHEN n.is_deceased = 1 AND n.has_angina_24h = 1 THEN 1.0 ELSE 0 END) * 100.0 / d.total_deceased, 1) AS NUMERIC(5,1)), '%')
    FROM NstemiCohort n
    CROSS JOIN CohortDenominators d
    GROUP BY d.total_alive, d.total_deceased

    UNION ALL

    SELECT 
        '3 or more CHD risk factors',
        SUM(CASE WHEN n.is_deceased = 0 AND n.has_chd3 = 1 THEN 1 ELSE 0 END),
        CONCAT(CAST(ROUND(SUM(CASE WHEN n.is_deceased = 0 AND n.has_chd3 = 1 THEN 1.0 ELSE 0 END) * 100.0 / d.total_alive, 1) AS NUMERIC(5,1)), '%'),
        SUM(CASE WHEN n.is_deceased = 1 AND n.has_chd3 = 1 THEN 1 ELSE 0 END),
        CONCAT(CAST(ROUND(SUM(CASE WHEN n.is_deceased = 1 AND n.has_chd3 = 1 THEN 1.0 ELSE 0 END) * 100.0 / d.total_deceased, 1) AS NUMERIC(5,1)), '%')
    FROM NstemiCohort n
    CROSS JOIN CohortDenominators d
    GROUP BY d.total_alive, d.total_deceased

    UNION ALL

    SELECT 
        'Reperfusion over 4 hrs',
        SUM(CASE WHEN n.is_deceased = 0 AND n.has_rep_gt_4h = 1 THEN 1 ELSE 0 END),
        CONCAT(CAST(ROUND(SUM(CASE WHEN n.is_deceased = 0 AND n.has_rep_gt_4h = 1 THEN 1.0 ELSE 0 END) * 100.0 / d.total_alive, 1) AS NUMERIC(5,1)), '%'),
        SUM(CASE WHEN n.is_deceased = 1 AND n.has_rep_gt_4h = 1 THEN 1 ELSE 0 END),
        CONCAT(CAST(ROUND(SUM(CASE WHEN n.is_deceased = 1 AND n.has_rep_gt_4h = 1 THEN 1.0 ELSE 0 END) * 100.0 / d.total_deceased, 1) AS NUMERIC(5,1)), '%')
    FROM NstemiCohort n
    CROSS JOIN CohortDenominators d
    GROUP BY d.total_alive, d.total_deceased

    UNION ALL

    SELECT 
        'Anterior MI / LBBB',
        SUM(CASE WHEN n.is_deceased = 0 AND n.has_ant_mi = 1 THEN 1 ELSE 0 END),
        CONCAT(CAST(ROUND(SUM(CASE WHEN n.is_deceased = 0 AND n.has_ant_mi = 1 THEN 1.0 ELSE 0 END) * 100.0 / d.total_alive, 1) AS NUMERIC(5,1)), '%'),
        SUM(CASE WHEN n.is_deceased = 1 AND n.has_ant_mi = 1 THEN 1 ELSE 0 END),
        CONCAT(CAST(ROUND(SUM(CASE WHEN n.is_deceased = 1 AND n.has_ant_mi = 1 THEN 1.0 ELSE 0 END) * 100.0 / d.total_deceased, 1) AS NUMERIC(5,1)), '%')
    FROM NstemiCohort n
    CROSS JOIN CohortDenominators d
    GROUP BY d.total_alive, d.total_deceased

    UNION ALL

    SELECT 
        'Prior stenosis over 50%',
        SUM(CASE WHEN n.is_deceased = 0 AND n.has_stenosis_50 = 1 THEN 1 ELSE 0 END),
        CONCAT(CAST(ROUND(SUM(CASE WHEN n.is_deceased = 0 AND n.has_stenosis_50 = 1 THEN 1.0 ELSE 0 END) * 100.0 / d.total_alive, 1) AS NUMERIC(5,1)), '%'),
        SUM(CASE WHEN n.is_deceased = 1 AND n.has_stenosis_50 = 1 THEN 1 ELSE 0 END),
        CONCAT(CAST(ROUND(SUM(CASE WHEN n.is_deceased = 1 AND n.has_stenosis_50 = 1 THEN 1.0 ELSE 0 END) * 100.0 / d.total_deceased, 1) AS NUMERIC(5,1)), '%')
    FROM NstemiCohort n
    CROSS JOIN CohortDenominators d
    GROUP BY d.total_alive, d.total_deceased

    UNION ALL

    SELECT 
        'Heart rate above 100',
        SUM(CASE WHEN n.is_deceased = 0 AND n.has_hr_gt_100 = 1 THEN 1 ELSE 0 END),
        CONCAT(CAST(ROUND(SUM(CASE WHEN n.is_deceased = 0 AND n.has_hr_gt_100 = 1 THEN 1.0 ELSE 0 END) * 100.0 / d.total_alive, 1) AS NUMERIC(5,1)), '%'),
        SUM(CASE WHEN n.is_deceased = 1 AND n.has_hr_gt_100 = 1 THEN 1 ELSE 0 END),
        CONCAT(CAST(ROUND(SUM(CASE WHEN n.is_deceased = 1 AND n.has_hr_gt_100 = 1 THEN 1.0 ELSE 0 END) * 100.0 / d.total_deceased, 1) AS NUMERIC(5,1)), '%')
    FROM NstemiCohort n
    CROSS JOIN CohortDenominators d
    GROUP BY d.total_alive, d.total_deceased

    UNION ALL

    SELECT 
        'Killip class II or higher',
        SUM(CASE WHEN n.is_deceased = 0 AND n.has_killip = 1 THEN 1 ELSE 0 END),
        CONCAT(CAST(ROUND(SUM(CASE WHEN n.is_deceased = 0 AND n.has_killip = 1 THEN 1.0 ELSE 0 END) * 100.0 / d.total_alive, 1) AS NUMERIC(5,1)), '%'),
        SUM(CASE WHEN n.is_deceased = 1 AND n.has_killip = 1 THEN 1 ELSE 0 END),
        CONCAT(CAST(ROUND(SUM(CASE WHEN n.is_deceased = 1 AND n.has_killip = 1 THEN 1.0 ELSE 0 END) * 100.0 / d.total_deceased, 1) AS NUMERIC(5,1)), '%')
    FROM NstemiCohort n
    CROSS JOIN CohortDenominators d
    GROUP BY d.total_alive, d.total_deceased

    UNION ALL

    SELECT 
        'Age 65 to 74',
        SUM(CASE WHEN n.is_deceased = 0 AND n.has_age_65_74 = 1 THEN 1 ELSE 0 END),
        CONCAT(CAST(ROUND(SUM(CASE WHEN n.is_deceased = 0 AND n.has_age_65_74 = 1 THEN 1.0 ELSE 0 END) * 100.0 / d.total_alive, 1) AS NUMERIC(5,1)), '%'),
        SUM(CASE WHEN n.is_deceased = 1 AND n.has_age_65_74 = 1 THEN 1 ELSE 0 END),
        CONCAT(CAST(ROUND(SUM(CASE WHEN n.is_deceased = 1 AND n.has_age_65_74 = 1 THEN 1.0 ELSE 0 END) * 100.0 / d.total_deceased, 1) AS NUMERIC(5,1)), '%')
    FROM NstemiCohort n
    CROSS JOIN CohortDenominators d
    GROUP BY d.total_alive, d.total_deceased

    UNION ALL

    SELECT 
        'Age 75 or older',
        SUM(CASE WHEN n.is_deceased = 0 AND n.has_age_ge_75 = 1 THEN 1 ELSE 0 END),
        CONCAT(CAST(ROUND(SUM(CASE WHEN n.is_deceased = 0 AND n.has_age_ge_75 = 1 THEN 1.0 ELSE 0 END) * 100.0 / d.total_alive, 1) AS NUMERIC(5,1)), '%'),
        SUM(CASE WHEN n.is_deceased = 1 AND n.has_age_ge_75 = 1 THEN 1 ELSE 0 END),
        CONCAT(CAST(ROUND(SUM(CASE WHEN n.is_deceased = 1 AND n.has_age_ge_75 = 1 THEN 1.0 ELSE 0 END) * 100.0 / d.total_deceased, 1) AS NUMERIC(5,1)), '%')
    FROM NstemiCohort n
    CROSS JOIN CohortDenominators d
    GROUP BY d.total_alive, d.total_deceased

    UNION ALL

    SELECT 
        'Elevated CRP',
        SUM(CASE WHEN n.is_deceased = 0 AND n.has_crp = 1 THEN 1 ELSE 0 END),
        CONCAT(CAST(ROUND(SUM(CASE WHEN n.is_deceased = 0 AND n.has_crp = 1 THEN 1.0 ELSE 0 END) * 100.0 / d.total_alive, 1) AS NUMERIC(5,1)), '%'),
        SUM(CASE WHEN n.is_deceased = 1 AND n.has_crp = 1 THEN 1 ELSE 0 END),
        CONCAT(CAST(ROUND(SUM(CASE WHEN n.is_deceased = 1 AND n.has_crp = 1 THEN 1.0 ELSE 0 END) * 100.0 / d.total_deceased, 1) AS NUMERIC(5,1)), '%')
    FROM NstemiCohort n
    CROSS JOIN CohortDenominators d
    GROUP BY d.total_alive, d.total_deceased

    UNION ALL

    SELECT 
        'Elevated BNP',
        SUM(CASE WHEN n.is_deceased = 0 AND n.has_bnp = 1 THEN 1 ELSE 0 END),
        CONCAT(CAST(ROUND(SUM(CASE WHEN n.is_deceased = 0 AND n.has_bnp = 1 THEN 1.0 ELSE 0 END) * 100.0 / d.total_alive, 1) AS NUMERIC(5,1)), '%'),
        SUM(CASE WHEN n.is_deceased = 1 AND n.has_bnp = 1 THEN 1 ELSE 0 END),
        CONCAT(CAST(ROUND(SUM(CASE WHEN n.is_deceased = 1 AND n.has_bnp = 1 THEN 1.0 ELSE 0 END) * 100.0 / d.total_deceased, 1) AS NUMERIC(5,1)), '%')
    FROM NstemiCohort n
    CROSS JOIN CohortDenominators d
    GROUP BY d.total_alive, d.total_deceased

    UNION ALL

    SELECT 
        'Weight below 67 kg',
        SUM(CASE WHEN n.is_deceased = 0 AND n.has_wt_lt_67 = 1 THEN 1 ELSE 0 END),
        CONCAT(CAST(ROUND(SUM(CASE WHEN n.is_deceased = 0 AND n.has_wt_lt_67 = 1 THEN 1.0 ELSE 0 END) * 100.0 / d.total_alive, 1) AS NUMERIC(5,1)), '%'),
        SUM(CASE WHEN n.is_deceased = 1 AND n.has_wt_lt_67 = 1 THEN 1 ELSE 0 END),
        CONCAT(CAST(ROUND(SUM(CASE WHEN n.is_deceased = 1 AND n.has_wt_lt_67 = 1 THEN 1.0 ELSE 0 END) * 100.0 / d.total_deceased, 1) AS NUMERIC(5,1)), '%')
    FROM NstemiCohort n
    CROSS JOIN CohortDenominators d
    GROUP BY d.total_alive, d.total_deceased

    UNION ALL

    SELECT 
        'LVF',
        SUM(CASE WHEN n.is_deceased = 0 AND n.has_lvf = 1 THEN 1 ELSE 0 END),
        CONCAT(CAST(ROUND(SUM(CASE WHEN n.is_deceased = 0 AND n.has_lvf = 1 THEN 1.0 ELSE 0 END) * 100.0 / d.total_alive, 1) AS NUMERIC(5,1)), '%'),
        SUM(CASE WHEN n.is_deceased = 1 AND n.has_lvf = 1 THEN 1 ELSE 0 END),
        CONCAT(CAST(ROUND(SUM(CASE WHEN n.is_deceased = 1 AND n.has_lvf = 1 THEN 1.0 ELSE 0 END) * 100.0 / d.total_deceased, 1) AS NUMERIC(5,1)), '%')
    FROM NstemiCohort n
    CROSS JOIN CohortDenominators d
    GROUP BY d.total_alive, d.total_deceased

    UNION ALL

    SELECT 
        'BBB / CHB',
        SUM(CASE WHEN n.is_deceased = 0 AND n.has_bbb_chb = 1 THEN 1 ELSE 0 END),
        CONCAT(CAST(ROUND(SUM(CASE WHEN n.is_deceased = 0 AND n.has_bbb_chb = 1 THEN 1.0 ELSE 0 END) * 100.0 / d.total_alive, 1) AS NUMERIC(5,1)), '%'),
        SUM(CASE WHEN n.is_deceased = 1 AND n.has_bbb_chb = 1 THEN 1 ELSE 0 END),
        CONCAT(CAST(ROUND(SUM(CASE WHEN n.is_deceased = 1 AND n.has_bbb_chb = 1 THEN 1.0 ELSE 0 END) * 100.0 / d.total_deceased, 1) AS NUMERIC(5,1)), '%')
    FROM NstemiCohort n
    CROSS JOIN CohortDenominators d
    GROUP BY d.total_alive, d.total_deceased

    UNION ALL

    SELECT 
        'Systolic BP below 100',
        SUM(CASE WHEN n.is_deceased = 0 AND n.has_sbp_lt_100 = 1 THEN 1 ELSE 0 END),
        CONCAT(CAST(ROUND(SUM(CASE WHEN n.is_deceased = 0 AND n.has_sbp_lt_100 = 1 THEN 1.0 ELSE 0 END) * 100.0 / d.total_alive, 1) AS NUMERIC(5,1)), '%'),
        SUM(CASE WHEN n.is_deceased = 1 AND n.has_sbp_lt_100 = 1 THEN 1 ELSE 0 END),
        CONCAT(CAST(ROUND(SUM(CASE WHEN n.is_deceased = 1 AND n.has_sbp_lt_100 = 1 THEN 1.0 ELSE 0 END) * 100.0 / d.total_deceased, 1) AS NUMERIC(5,1)), '%')
    FROM NstemiCohort n
    CROSS JOIN CohortDenominators d
    GROUP BY d.total_alive, d.total_deceased

    UNION ALL

    SELECT 
        'VT / VF',
        SUM(CASE WHEN n.is_deceased = 0 AND n.has_vt_vf = 1 THEN 1 ELSE 0 END),
        CONCAT(CAST(ROUND(SUM(CASE WHEN n.is_deceased = 0 AND n.has_vt_vf = 1 THEN 1.0 ELSE 0 END) * 100.0 / d.total_alive, 1) AS NUMERIC(5,1)), '%'),
        SUM(CASE WHEN n.is_deceased = 1 AND n.has_vt_vf = 1 THEN 1 ELSE 0 END),
        CONCAT(CAST(ROUND(SUM(CASE WHEN n.is_deceased = 1 AND n.has_vt_vf = 1 THEN 1.0 ELSE 0 END) * 100.0 / d.total_deceased, 1) AS NUMERIC(5,1)), '%')
    FROM NstemiCohort n
    CROSS JOIN CohortDenominators d
    GROUP BY d.total_alive, d.total_deceased;
  `;
  const resNstemi = await db.query(nstemiQ);
  console.table(resNstemi.recordset);

  process.exit(0);
}

test().catch(e => { console.error(e); process.exit(1); });
