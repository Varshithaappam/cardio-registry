const { poolPromise } = require('../backend/config/db');

async function findExactRow() {
    const pool = await poolPromise;
    const res = await pool.request().query(`
        SELECT hf_id, myocardial_ischemia, ventricular_tachycardia, uncontrolled_hypertension, infection, renal_failure, anaemia, medication_non_adherence, excessive_salt_intake, excessive_water_ingestion, progressive_worsening, precipitating_other
        FROM hf_administrative
        WHERE anaemia = 'Yes' AND medication_non_adherence = 'Yes'
    `);
    console.log(res.recordset);
    process.exit(0);
}
findExactRow();

