const { poolPromise } = require('../backend/config/db');

async function checkAllRows() {
    const pool = await poolPromise;
    const res = await pool.request().query(`
        SELECT hf_id, infection, renal_failure, anaemia, precipitating_other
        FROM hf_administrative
        WHERE renal_failure = 'No' AND (infection = 'Yes' OR anaemia = 'Yes')
    `);
    console.log(res.recordset);
    process.exit(0);
}
checkAllRows();

