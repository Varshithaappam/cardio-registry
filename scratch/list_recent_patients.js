const db = require('../backend/config/db');

async function listPatients() {
  const { recordset } = await db.query(`
    SELECT TOP 10 reg_patient_id, mr_no, uhid, patient_name
    FROM patient_demographics
    ORDER BY reg_patient_id DESC
  `);
  console.log(recordset);
  process.exit(0);
}

listPatients().catch(console.error);

