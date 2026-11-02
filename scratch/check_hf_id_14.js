const { poolPromise } = require('../backend/config/db');

async function checkHfId14() {
    const pool = await poolPromise;
    const res = await pool.request().query(`
        SELECT hf_id, myocardial_ischemia, atrial_fibrillation, bradyarrhythmia, ventricular_tachycardia, uncontrolled_hypertension, infection, renal_failure, anaemia, medication_non_adherence, excessive_salt_intake, excessive_water_ingestion, progressive_worsening, precipitating_other, admission_type, admission_reason, other_admission_reason, hospitalization_days
        FROM hf_administrative
        WHERE hf_id = 14
    `);
    console.log(res.recordset[0]);
    process.exit(0);
}
checkHfId14();

