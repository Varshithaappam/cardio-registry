const { poolPromise } = require('../backend/config/db');

async function checkAllOtherFactor() {
    const pool = await poolPromise;
    const res = await pool.request().query(`
        SELECT hf_id, admission_type, admission_reason, other_admission_reason, myocardial_ischemia, infection, renal_failure, anaemia, precipitating_other
        FROM hf_administrative
        WHERE precipitating_other = 'Other Precipitating Factor' OR admission_type = 'Admission'
    `);
    console.log(res.recordset);
    process.exit(0);
}
checkAllOtherFactor();

