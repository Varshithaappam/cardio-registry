const { poolPromise } = require('../backend/config/db');

async function checkColTypes() {
    const pool = await poolPromise;
    const res = await pool.request().query(`
        SELECT COLUMN_NAME, DATA_TYPE, CHARACTER_MAXIMUM_LENGTH
        FROM INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_NAME = 'hf_administrative'
          AND COLUMN_NAME IN ('myocardial_ischemia', 'infection', 'renal_failure', 'anaemia')
    `);
    console.log(res.recordset);
    process.exit(0);
}
checkColTypes();

