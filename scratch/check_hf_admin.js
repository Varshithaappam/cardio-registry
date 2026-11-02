const { poolPromise } = require('../backend/config/db');

async function checkHfAdmin() {
    const pool = await poolPromise;
    const res = await pool.request().query(`
        SELECT TOP 15 hf_id, myocardial_ischemia, atrial_fibrillation, infection, renal_failure, anaemia, precipitating_other
        FROM hf_administrative
        ORDER BY hf_id DESC
    `);
    console.log(res.recordset);
    process.exit(0);
}
checkHfAdmin();

