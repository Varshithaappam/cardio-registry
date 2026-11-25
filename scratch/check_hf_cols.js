const { getPool } = require('../backend/config/db');

(async () => {
  try {
    const pool = await getPool();
    const cols = await pool.request().query("SELECT COLUMN_NAME, DATA_TYPE FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'hf_registry'");
    console.log('hf_registry columns:', cols.recordset.map(c => c.COLUMN_NAME));

    const sample = await pool.request().query('SELECT TOP 1 * FROM dbo.hf_registry');
    console.log('sample row 1:', sample.recordset[0]);

    const stemiSample = await pool.request().query('SELECT TOP 1 admission_date, discharge_date, created_at FROM dbo.stemi_registry');
    console.log('stemi dates:', stemiSample.recordset[0]);

    const nstemiSample = await pool.request().query('SELECT TOP 1 admission_date, discharge_date, created_at FROM dbo.nstemi_registry');
    console.log('nstemi dates:', nstemiSample.recordset[0]);

    process.exit(0);
  } catch(e) {
    console.error(e);
    process.exit(1);
  }
})();
