const db = require('./backend/config/db');

async function test() {
  try {
    const pool = await db.getPool();
    const result = await pool.request().query("SELECT TOP 10 reg_patient_id, patient_name, mr_no, created_at FROM patient_demographics ORDER BY reg_patient_id DESC");
    console.log("Recent patients in DB:", result.recordset);
    process.exit(0);
  } catch (err) {
    console.error("DB Error:", err);
    process.exit(1);
  }
}

test();
