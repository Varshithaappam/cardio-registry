const { getPool } = require('../backend/config/db');

async function run() {
  const pool = await getPool();

  // Test 30-day readmissions across registries:
  // Patient readmitted within 30 days of prior admission discharge_date

  const hfReadm = await pool.request().query(`
    WITH OrderedAdm AS (
      SELECT 
        hr.reg_patient_id, hr.hf_id, ha.admission_date, ha.discharge_date,
        LAG(ha.discharge_date) OVER (PARTITION BY hr.reg_patient_id ORDER BY ha.admission_date) as prev_discharge
      FROM dbo.hf_registry hr
      JOIN dbo.hf_administrative ha ON hr.hf_id = ha.hf_id
      WHERE (hr.is_deleted = 0 OR hr.is_deleted IS NULL)
        AND ha.admission_date IS NOT NULL
    )
    SELECT 
      COUNT(*) as total_admissions,
      COUNT(prev_discharge) as repeat_admissions,
      COUNT(CASE WHEN DATEDIFF(day, prev_discharge, admission_date) BETWEEN 0 AND 30 THEN 1 END) as readm_30d,
      ROUND(COUNT(CASE WHEN DATEDIFF(day, prev_discharge, admission_date) BETWEEN 0 AND 30 THEN 1 END) * 100.0 / NULLIF(COUNT(*), 0), 1) as readm_30d_rate
    FROM OrderedAdm;
  `);
  console.log('HF 30-day Readmissions:');
  console.table(hfReadm.recordset);

  const stemiReadm = await pool.request().query(`
    WITH OrderedAdm AS (
      SELECT 
        s.reg_patient_id, s.stemi_id, s.admission_date, s.discharge_date,
        LAG(s.discharge_date) OVER (PARTITION BY s.reg_patient_id ORDER BY s.admission_date) as prev_discharge
      FROM dbo.stemi_registry s
      WHERE (s.is_deleted = 0 OR s.is_deleted IS NULL)
        AND s.admission_date IS NOT NULL
    )
    SELECT 
      COUNT(*) as total_admissions,
      COUNT(prev_discharge) as repeat_admissions,
      COUNT(CASE WHEN DATEDIFF(day, prev_discharge, admission_date) BETWEEN 0 AND 30 THEN 1 END) as readm_30d,
      ROUND(COUNT(CASE WHEN DATEDIFF(day, prev_discharge, admission_date) BETWEEN 0 AND 30 THEN 1 END) * 100.0 / NULLIF(COUNT(*), 0), 1) as readm_30d_rate
    FROM OrderedAdm;
  `);
  console.log('STEMI 30-day Readmissions:');
  console.table(stemiReadm.recordset);

  const nstemiReadm = await pool.request().query(`
    WITH OrderedAdm AS (
      SELECT 
        n.reg_patient_id, n.nstemi_id, n.admission_date, n.discharge_date,
        LAG(n.discharge_date) OVER (PARTITION BY n.reg_patient_id ORDER BY n.admission_date) as prev_discharge
      FROM dbo.nstemi_registry n
      WHERE (n.is_deleted = 0 OR n.is_deleted IS NULL)
        AND n.admission_date IS NOT NULL
    )
    SELECT 
      COUNT(*) as total_admissions,
      COUNT(prev_discharge) as repeat_admissions,
      COUNT(CASE WHEN DATEDIFF(day, prev_discharge, admission_date) BETWEEN 0 AND 30 THEN 1 END) as readm_30d,
      ROUND(COUNT(CASE WHEN DATEDIFF(day, prev_discharge, admission_date) BETWEEN 0 AND 30 THEN 1 END) * 100.0 / NULLIF(COUNT(*), 0), 1) as readm_30d_rate
    FROM OrderedAdm;
  `);
  console.log('NSTEMI 30-day Readmissions:');
  console.table(nstemiReadm.recordset);

  process.exit(0);
}

run().catch(e => { console.error(e); process.exit(1); });
