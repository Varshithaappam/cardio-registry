const db = require('./backend/config/db');

async function inspectTables() {
  try {
    const pool = await db.getPool();
    const tables = ['patient_demographics', 'hf_registry', 'stemi_registry', 'nstemi_registry', 'patient_followup_tasks', 'nurse_outreach_logs', 'hf_followup_assessments'];
    for (const t of tables) {
      const res = await pool.request().query(`
        SELECT COLUMN_NAME, DATA_TYPE 
        FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_NAME = '${t}'
      `);
      console.log(`=== ${t} Columns ===`);
      console.log(res.recordset.map(r => r.COLUMN_NAME).join(', '));
    }
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

inspectTables();
