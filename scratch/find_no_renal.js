const { poolPromise } = require('../backend/config/db');

async function findNoRenal() {
    const pool = await poolPromise;
    const res = await pool.request().query(`
        SELECT hf_id, myocardial_ischemia, ventricular_tachycardia, uncontrolled_hypertension, infection, renal_failure, anaemia, precipitating_other
        FROM hf_administrative
        WHERE myocardial_ischemia = 'Yes' AND renal_failure = 'No'
    `);
    console.log(res.recordset);
    process.exit(0);
}
findNoRenal();

