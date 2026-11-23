const { getPool, sql } = require('../backend/config/db');

async function testUpdatedService() {
  const pool = await getPool();

  const readmQuery = `
    WITH HfAdm AS (
      SELECT 
        hr.reg_patient_id, hr.hf_id, ha.visit_date, ha.discharge_date,
        LAG(ha.discharge_date) OVER (PARTITION BY hr.reg_patient_id ORDER BY ha.visit_date) as prev_discharge
      FROM dbo.hf_registry hr
      JOIN dbo.hf_administrative ha ON hr.hf_id = ha.hf_id
      WHERE (hr.is_deleted = 0 OR hr.is_deleted IS NULL) AND ha.visit_date IS NOT NULL
    ),
    StemiAdm AS (
      SELECT 
        s.reg_patient_id, s.stemi_id, s.admission_date, s.discharge_date,
        LAG(s.discharge_date) OVER (PARTITION BY s.reg_patient_id ORDER BY s.admission_date) as prev_discharge
      FROM dbo.stemi_registry s
      WHERE (s.is_deleted = 0 OR s.is_deleted IS NULL) AND s.admission_date IS NOT NULL
    ),
    NstemiAdm AS (
      SELECT 
        n.reg_patient_id, n.nstemi_id, n.admission_date, n.discharge_date,
        LAG(n.discharge_date) OVER (PARTITION BY n.reg_patient_id ORDER BY n.admission_date) as prev_discharge
      FROM dbo.nstemi_registry n
      WHERE (n.is_deleted = 0 OR n.is_deleted IS NULL) AND n.admission_date IS NOT NULL
    )
    SELECT
      (SELECT COUNT(*) FROM HfAdm) as hf_total,
      (SELECT COUNT(*) FROM HfAdm WHERE DATEDIFF(day, prev_discharge, visit_date) BETWEEN 0 AND 30) as hf_readm_30d,
      (SELECT COUNT(*) FROM StemiAdm) as stemi_total,
      (SELECT COUNT(*) FROM StemiAdm WHERE DATEDIFF(day, prev_discharge, admission_date) BETWEEN 0 AND 30) as stemi_readm_30d,
      (SELECT COUNT(*) FROM NstemiAdm) as nstemi_total,
      (SELECT COUNT(*) FROM NstemiAdm WHERE DATEDIFF(day, prev_discharge, admission_date) BETWEEN 0 AND 30) as nstemi_readm_30d;
  `;
  const readmRes = await pool.request().query(readmQuery);
  console.log('Readmission raw:', readmRes.recordset[0]);

  process.exit(0);
}

testUpdatedService().catch(e => { console.error(e); process.exit(1); });
