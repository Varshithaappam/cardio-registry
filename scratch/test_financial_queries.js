const { getPool } = require('../backend/config/db');

(async () => {
  try {
    const pool = await getPool();

    // 1. Cost by Culprit Vessel & Procedural Acuity
    const vesselQ = await pool.request().query(`
      WITH VesselCost AS (
        SELECT 
          'STEMI' as registry,
          h.total_cost,
          CASE WHEN t.vessel_lad = '1' OR t.vessel_lad = 'Yes' THEN 1 ELSE 0 END as is_lad,
          CASE WHEN t.vessel_rca = '1' OR t.vessel_rca = 'Yes' THEN 1 ELSE 0 END as is_rca,
          CASE WHEN t.vessel_lcx = '1' OR t.vessel_lcx = 'Yes' THEN 1 ELSE 0 END as is_lcx,
          CASE WHEN t.vessel_lmca = '1' OR t.vessel_lmca = 'Yes' THEN 1 ELSE 0 END as is_lmca
        FROM dbo.stemi_hospitalization h
        JOIN dbo.stemi_treatment_strategy t ON h.stemi_id = t.stemi_id
        WHERE h.total_cost > 0
        UNION ALL
        SELECT 
          'NSTEMI' as registry,
          h.total_cost,
          CASE WHEN t.vessel_lad = '1' OR t.vessel_lad = 'Yes' THEN 1 ELSE 0 END as is_lad,
          CASE WHEN t.vessel_rca = '1' OR t.vessel_rca = 'Yes' THEN 1 ELSE 0 END as is_rca,
          CASE WHEN t.vessel_lcx = '1' OR t.vessel_lcx = 'Yes' THEN 1 ELSE 0 END as is_lcx,
          CASE WHEN t.vessel_lmca = '1' OR t.vessel_lmca = 'Yes' THEN 1 ELSE 0 END as is_lmca
        FROM dbo.nstemi_hospitalization h
        JOIN dbo.nstemi_treatment_strategy t ON h.nstemi_id = t.nstemi_id
        WHERE h.total_cost > 0
      )
      SELECT 
        CASE 
          WHEN is_lmca = 1 OR (is_lad + is_rca + is_lcx + is_lmca) > 1 THEN 'Left Main / Multivessel'
          WHEN is_lad = 1 THEN 'LAD (Anterior MI)'
          WHEN is_rca = 1 THEN 'RCA (Inferior MI)'
          WHEN is_lcx = 1 THEN 'LCx (Lateral MI)'
          ELSE 'Other / Conservative'
        END AS vessel_category,
        COUNT(*) as patient_count,
        ROUND(AVG(CAST(total_cost AS FLOAT)), 0) as avg_cost,
        SUM(total_cost) as total_cost
      FROM VesselCost
      GROUP BY 
        CASE 
          WHEN is_lmca = 1 OR (is_lad + is_rca + is_lcx + is_lmca) > 1 THEN 'Left Main / Multivessel'
          WHEN is_lad = 1 THEN 'LAD (Anterior MI)'
          WHEN is_rca = 1 THEN 'RCA (Inferior MI)'
          WHEN is_lcx = 1 THEN 'LCx (Lateral MI)'
          ELSE 'Other / Conservative'
        END
      ORDER BY avg_cost DESC;
    `);
    console.log('1. Cost by Culprit Vessel & Acuity:');
    console.table(vesselQ.recordset);

    // 2. Risk-Adjusted Cost by TIMI Risk Tier
    const timiQ = await pool.request().query(`
      WITH StemiTimi AS (
        SELECT 
          s.stemi_id,
          h.total_cost,
          (
            CASE WHEN DATEDIFF(year, p.date_of_birth, s.admission_date) >= 75 THEN 3
                 WHEN DATEDIFF(year, p.date_of_birth, s.admission_date) >= 65 THEN 2 ELSE 0 END +
            CASE WHEN pe.killip_class IN ('Class II', 'Class III', 'Class IV', '2', '3', '4') THEN 2 ELSE 0 END +
            CASE WHEN pe.systolic_bp < 100 THEN 3 ELSE 0 END +
            CASE WHEN pe.heart_rate > 100 THEN 2 ELSE 0 END +
            CASE WHEN e.presentation_st_elevation = 'Yes' OR e.elevation_v1_v4 = 'Yes' THEN 1 ELSE 0 END +
            CASE WHEN DATEDIFF(hour, e.symptom_onset_time, s.admission_date) > 4 THEN 1 ELSE 0 END +
            CASE WHEN ph.diabetes = 'Yes' OR ph.hypertension = 'Yes' OR ph.angina = 'Yes' THEN 1 ELSE 0 END
          ) as timi_score
        FROM dbo.stemi_registry s
        JOIN dbo.stemi_hospitalization h ON s.stemi_id = h.stemi_id
        LEFT JOIN dbo.registered_patients p ON s.reg_patient_id = p.reg_patient_id
        LEFT JOIN dbo.stemi_physical_examination pe ON s.stemi_id = pe.stemi_id
        LEFT JOIN dbo.stemi_initial_evaluation e ON s.stemi_id = e.stemi_id
        LEFT JOIN dbo.stemi_past_history ph ON s.stemi_id = ph.stemi_id
        WHERE h.total_cost > 0
      ),
      NstemiTimi AS (
        SELECT 
          n.nstemi_id,
          h.total_cost,
          (
            CASE WHEN DATEDIFF(year, p.date_of_birth, n.admission_date) >= 65 THEN 1 ELSE 0 END +
            CASE WHEN (
              (CASE WHEN ph.hypertension = 'Yes' THEN 1 ELSE 0 END) +
              (CASE WHEN ph.diabetes = 'Yes' THEN 1 ELSE 0 END) +
              (CASE WHEN ph.smoking = 'Yes' THEN 1 ELSE 0 END) +
              (CASE WHEN ph.dyslipidemia = 'Yes' THEN 1 ELSE 0 END) +
              (CASE WHEN ph.family_history = 'Yes' THEN 1 ELSE 0 END)
            ) >= 3 THEN 1 ELSE 0 END +
            CASE WHEN ph.prior_stenosis_50 = 'Yes' THEN 1 ELSE 0 END +
            CASE WHEN e.st_deviation_admission = 'Yes' THEN 1 ELSE 0 END +
            CASE WHEN e.angina_episodes_24h = 'Yes' THEN 1 ELSE 0 END +
            CASE WHEN e.elevated_cardiac_markers = 'Yes' THEN 1 ELSE 0 END +
            CASE WHEN ph.aspirin_last_7_days = 'Yes' THEN 1 ELSE 0 END
          ) as timi_score
        FROM dbo.nstemi_registry n
        JOIN dbo.nstemi_hospitalization h ON n.nstemi_id = h.nstemi_id
        LEFT JOIN dbo.registered_patients p ON n.reg_patient_id = p.reg_patient_id
        LEFT JOIN dbo.nstemi_physical_examination pe ON n.nstemi_id = pe.nstemi_id
        LEFT JOIN dbo.nstemi_initial_evaluation e ON n.nstemi_id = e.nstemi_id
        LEFT JOIN dbo.nstemi_past_history ph ON n.nstemi_id = ph.nstemi_id
        WHERE h.total_cost > 0
      ),
      CombinedTimiCost AS (
        SELECT total_cost,
          CASE 
            WHEN timi_score <= 3 THEN 'Low Risk (TIMI 0-3)'
            WHEN timi_score <= 7 THEN 'Medium Risk (TIMI 4-7)'
            ELSE 'High Risk (TIMI 8+)'
          END as risk_tier,
          CASE 
            WHEN timi_score <= 3 THEN 1
            WHEN timi_score <= 7 THEN 2
            ELSE 3
          END as tier_order
        FROM StemiTimi
        UNION ALL
        SELECT total_cost,
          CASE 
            WHEN timi_score <= 4 THEN 'Low Risk (TIMI 0-4)'
            WHEN timi_score <= 10 THEN 'Medium Risk (TIMI 5-10)'
            ELSE 'High Risk (TIMI 11+)'
          END as risk_tier,
          CASE 
            WHEN timi_score <= 4 THEN 1
            WHEN timi_score <= 10 THEN 2
            ELSE 3
          END as tier_order
        FROM NstemiTimi
      )
      SELECT 
        risk_tier,
        COUNT(*) as patient_count,
        ROUND(AVG(CAST(total_cost AS FLOAT)), 0) as avg_cost,
        SUM(total_cost) as total_cost
      FROM CombinedTimiCost
      GROUP BY risk_tier, tier_order
      ORDER BY tier_order ASC;
    `);
    console.log('\n2. Risk-Adjusted Cost by TIMI Risk Tier:');
    console.table(timiQ.recordset);

    // 3. Average Cost & Revenue Realization by Payer Scheme
    const payerCostQ = await pool.request().query(`
      WITH PayerCostUnion AS (
        SELECT 
          'HF' as registry,
          COALESCE(ha.insurance_mode, 'Direct / Cash') as raw_mode,
          COALESCE(fa.hospital_stay_days * 3500 + 15000, 45000) as cost_estimate
        FROM dbo.hf_registry hr
        JOIN dbo.hf_administrative ha ON hr.hf_id = ha.hf_id
        LEFT JOIN dbo.hf_final_clinical_assessment fa ON hr.hf_id = fa.hf_id
        WHERE hr.is_deleted = 0 OR hr.is_deleted IS NULL
        UNION ALL
        SELECT 
          'STEMI' as registry,
          COALESCE(ha.insurance_mode, 'Private Insurance') as raw_mode,
          h.total_cost
        FROM dbo.stemi_hospitalization h
        JOIN dbo.stemi_registry s ON h.stemi_id = s.stemi_id
        LEFT JOIN dbo.hf_administrative ha ON s.reg_patient_id = ha.hf_id
        WHERE h.total_cost > 0
        UNION ALL
        SELECT 
          'NSTEMI' as registry,
          COALESCE(ha.insurance_mode, 'Government') as raw_mode,
          h.total_cost
        FROM dbo.nstemi_hospitalization h
        JOIN dbo.nstemi_registry n ON h.nstemi_id = n.nstemi_id
        LEFT JOIN dbo.hf_administrative ha ON n.reg_patient_id = ha.hf_id
        WHERE h.total_cost > 0
      )
      SELECT 
        CASE 
          WHEN LOWER(raw_mode) LIKE '%private%' OR LOWER(raw_mode) LIKE '%insurance%' OR LOWER(raw_mode) LIKE '%tpa%' THEN 'Private Insurance'
          WHEN LOWER(raw_mode) LIKE '%arogya%' THEN 'Arogyasree Scheme'
          WHEN LOWER(raw_mode) LIKE '%gov%' OR LOWER(raw_mode) LIKE '%cghs%' OR LOWER(raw_mode) LIKE '%echs%' THEN 'Government Reimbursement'
          ELSE 'Direct / Self-Pay Cash'
        END as payer_scheme,
        COUNT(*) as patient_count,
        ROUND(AVG(CAST(cost_estimate AS FLOAT)), 0) as avg_cost,
        SUM(cost_estimate) as total_revenue
      FROM PayerCostUnion
      GROUP BY 
        CASE 
          WHEN LOWER(raw_mode) LIKE '%private%' OR LOWER(raw_mode) LIKE '%insurance%' OR LOWER(raw_mode) LIKE '%tpa%' THEN 'Private Insurance'
          WHEN LOWER(raw_mode) LIKE '%arogya%' THEN 'Arogyasree Scheme'
          WHEN LOWER(raw_mode) LIKE '%gov%' OR LOWER(raw_mode) LIKE '%cghs%' OR LOWER(raw_mode) LIKE '%echs%' THEN 'Government Reimbursement'
          ELSE 'Direct / Self-Pay Cash'
        END
      ORDER BY avg_cost DESC;
    `);
    console.log('\n3. Average Cost & Revenue Realization by Payer Scheme:');
    console.table(payerCostQ.recordset);

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
})();
