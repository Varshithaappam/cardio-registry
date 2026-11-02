const { poolPromise } = require('../backend/config/db');

async function checkHfAdminYes() {
    const pool = await poolPromise;
    const res = await pool.request().query(`
        SELECT hf_id, myocardial_ischemia, atrial_fibrillation, infection, renal_failure, anaemia, excessive_salt_intake, precipitating_other
        FROM hf_administrative
        WHERE uncontrolled_hypertension = 'Yes'
    `);
    console.log(res.recordset);
    process.exit(0);
}
checkHfAdminYes();

