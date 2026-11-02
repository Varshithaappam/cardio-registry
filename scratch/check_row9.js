const { poolPromise } = require('../backend/config/db');

async function checkRow9() {
    const pool = await poolPromise;
    const res = await pool.request().query(`
        SELECT TOP 20 hf_id, ventricular_tachycardia, uncontrolled_hypertension, infection, renal_failure, anaemia, medication_non_adherence, excessive_salt_intake, excessive_water_ingestion, progressive_worsening, precipitating_other
        FROM hf_administrative
        ORDER BY hf_id ASC
    `);
    res.recordset.forEach((r, idx) => {
        console.log(`Row ${idx+1}: hf_id=${r.hf_id}, VT=${r.ventricular_tachycardia}, HTN=${r.uncontrolled_hypertension}, Inf=${r.infection}, Renal=${r.renal_failure}, Anaemia=${r.anaemia}, Other=${r.precipitating_other}`);
    });
    process.exit(0);
}
checkRow9();

