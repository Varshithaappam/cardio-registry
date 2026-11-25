const { getPool } = require('../backend/config/db');

(async () => {
  try {
    const pool = await getPool();
    const hfCols = await pool.request().query("SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'hf_registry' AND (COLUMN_NAME LIKE '%date%' OR COLUMN_NAME LIKE '%time%' OR COLUMN_NAME LIKE '%admission%')");
    console.log('HF date cols:', hfCols.recordset.map(c => c.COLUMN_NAME));

    const stemiCols = await pool.request().query("SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'stemi_registry' AND (COLUMN_NAME LIKE '%date%' OR COLUMN_NAME LIKE '%time%' OR COLUMN_NAME LIKE '%admission%')");
    console.log('STEMI date cols:', stemiCols.recordset.map(c => c.COLUMN_NAME));

    const nstemiCols = await pool.request().query("SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'nstemi_registry' AND (COLUMN_NAME LIKE '%date%' OR COLUMN_NAME LIKE '%time%' OR COLUMN_NAME LIKE '%admission%')");
    console.log('NSTEMI date cols:', nstemiCols.recordset.map(c => c.COLUMN_NAME));

    const hfSample = await pool.request().query("SELECT TOP 5 reg_patient_id, date_of_admission, admission_date, date_of_birth, created_at, created_date, form_date FROM dbo.hf_registry");
    console.log('HF sample:', hfSample.recordset);

    const stemiSample = await pool.request().query("SELECT TOP 5 reg_patient_id, date_of_admission, admission_date, date_of_onset, date_of_birth, created_at, created_date FROM dbo.stemi_registry");
    console.log('STEMI sample:', stemiSample.recordset);

    const nstemiSample = await pool.request().query("SELECT TOP 5 reg_patient_id, date_of_admission, admission_date, date_of_onset, date_of_birth, created_at, created_date FROM dbo.nstemi_registry");
    console.log('NSTEMI sample:', nstemiSample.recordset);

    // Let's check min and max dates in all 3 tables
    const minMaxDates = await pool.request().query(`
      SELECT 'HF' as tbl, MIN(date_of_admission) as min_adm, MAX(date_of_admission) as max_adm, MIN(created_at) as min_cr, MAX(created_at) as max_cr FROM dbo.hf_registry
      UNION ALL
      SELECT 'STEMI' as tbl, MIN(date_of_admission) as min_adm, MAX(date_of_admission) as max_adm, MIN(created_at) as min_cr, MAX(created_at) as max_cr FROM dbo.stemi_registry
      UNION ALL
      SELECT 'NSTEMI' as tbl, MIN(date_of_admission) as min_adm, MAX(date_of_admission) as max_adm, MIN(created_at) as min_cr, MAX(created_at) as max_cr FROM dbo.nstemi_registry
    `);
    console.log('Min/Max dates:', minMaxDates.recordset);

    process.exit(0);
  } catch(err) {
    console.error(err);
    process.exit(1);
  }
})();
