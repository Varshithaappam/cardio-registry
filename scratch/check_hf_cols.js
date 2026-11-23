const { getPool } = require('../backend/config/db');

async function checkCols() {
  const pool = await getPool();
  const q = `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'hf_gdmt_evaluation'`;
  const res = await pool.request().query(q);
  console.log('hf_gdmt_evaluation columns:', res.recordset.map(x => x.COLUMN_NAME).join(', '));

  const tables = ['hf_medications', 'hf_cardiac_investigations', 'hf_final_clinical_assessment'];
  for (const t of tables) {
    const qT = `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = '${t}'`;
    const resT = await pool.request().query(qT);
    console.log(`${t} columns:`, resT.recordset.map(x => x.COLUMN_NAME).join(', '));
  }

  process.exit(0);
}

checkCols().catch(e => { console.error(e); process.exit(1); });
