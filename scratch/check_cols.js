const { getPool } = require('../backend/config/db');

async function checkCols() {
  const pool = await getPool();
  const tables = ['patient_demographics', 'stemi_clinical_assessment', 'nstemi_clinical_assessment'];
  for (const t of tables) {
    const q = `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = '${t}'`;
    const res = await pool.request().query(q);
    console.log(`=== ${t} ===`);
    console.log(res.recordset.map(r => r.COLUMN_NAME).join(', '));
  }
  process.exit(0);
}

checkCols().catch(e => { console.error(e); process.exit(1); });
