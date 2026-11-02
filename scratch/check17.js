const { poolPromise } = require('../backend/config/db');

async function check17() {
    const pool = await poolPromise;
    const res = await pool.request().query(`
        SELECT hf_id, infection, renal_failure, anaemia, precipitating_other
        FROM hf_administrative
        WHERE hf_id = 17
    `);
    console.log(res.recordset);
    process.exit(0);
}
check17();

