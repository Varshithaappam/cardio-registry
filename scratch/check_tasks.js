const db = require('../backend/config/db');

(async () => {
  try {
    const pool = await db.getPool();
    const res = await pool.request().query(`
      SELECT 
        task_id, reg_patient_id, source_registry, status, target_date, assigned_nurse, nurse_notes
      FROM patient_followup_tasks
      ORDER BY task_id DESC
    `);
    console.log('All patient_followup_tasks in DB:');
    console.table(res.recordset);
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
})();
