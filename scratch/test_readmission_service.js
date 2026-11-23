const { getPool } = require('../backend/config/db');

async function testReadmissions() {
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
      -- HF
      (SELECT COUNT(*) FROM HfAdm) as hf_total,
      (SELECT COUNT(*) FROM HfAdm WHERE DATEDIFF(day, prev_discharge, visit_date) BETWEEN 0 AND 30) as hf_readm_30d,
      
      -- STEMI
      (SELECT COUNT(*) FROM StemiAdm) as stemi_total,
      (SELECT COUNT(*) FROM StemiAdm WHERE DATEDIFF(day, prev_discharge, admission_date) BETWEEN 0 AND 30) as stemi_readm_30d,

      -- NSTEMI
      (SELECT COUNT(*) FROM NstemiAdm) as nstemi_total,
      (SELECT COUNT(*) FROM NstemiAdm WHERE DATEDIFF(day, prev_discharge, admission_date) BETWEEN 0 AND 30) as nstemi_readm_30d;
  `;

  const res = await pool.request().query(readmQuery);
  const row = res.recordset[0];
  console.log('Readmission metrics:', row);

  const hfRate = (row.hf_readm_30d / row.hf_total * 100).toFixed(1);
  const stemiRate = (row.stemi_readm_30d / row.stemi_total * 100).toFixed(1);
  const nstemiRate = (row.nstemi_readm_30d / row.nstemi_total * 100).toFixed(1);

  const totalReadm = row.hf_readm_30d + row.stemi_readm_30d + row.nstemi_readm_30d;
  const totalDenom = row.hf_total + row.stemi_total + row.nstemi_total;
  const overallRate = (totalReadm / totalDenom * 100).toFixed(1);

  console.log(`Overall Readmission Rate: ${overallRate}% (${totalReadm}/${totalDenom})`);
  console.log(`HF Readmission Rate: ${hfRate}% (${row.hf_readm_30d}/${row.hf_total})`);
  console.log(`STEMI Readmission Rate: ${stemiRate}% (${row.stemi_readm_30d}/${row.stemi_total})`);
  console.log(`NSTEMI Readmission Rate: ${nstemiRate}% (${row.nstemi_readm_30d}/${row.nstemi_total})`);

  process.exit(0);
}

testReadmissions().catch(e => { console.error(e); process.exit(1); });
