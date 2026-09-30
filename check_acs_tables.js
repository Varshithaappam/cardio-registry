const db = require('./backend/config/db');

async function checkAcsTables() {
  try {
    const pool = await db.getPool();
    const stemiRes = await pool.request().query("SELECT OBJECT_ID(N'dbo.stemi_followup_records') AS id;");
    const nstemiRes = await pool.request().query("SELECT OBJECT_ID(N'dbo.nstemi_followup_records') AS id;");
    console.log("stemi_followup_records table:", stemiRes.recordset[0].id);
    console.log("nstemi_followup_records table:", nstemiRes.recordset[0].id);
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

checkAcsTables();
