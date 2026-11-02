const { poolPromise } = require('../backend/config/db');

async function listAllColumns() {
    const pool = await poolPromise;
    const res = await pool.request().query(`
        SELECT TABLE_NAME, COLUMN_NAME
        FROM INFORMATION_SCHEMA.COLUMNS
        WHERE COLUMN_NAME IN ('reg_patient_id', 'uhid', 'hf_id', 'stemi_id', 'nstemi_id')
        ORDER BY COLUMN_NAME, TABLE_NAME
    `);
    console.log(JSON.stringify(res.recordset, null, 2));
    process.exit(0);
}
listAllColumns();

