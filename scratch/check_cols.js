const { poolPromise } = require('../backend/config/db');

async function checkColumns() {
    const pool = await poolPromise;
    const auditCols = await pool.request().query(`
        SELECT COLUMN_NAME, DATA_TYPE FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'patient_match_audit'
    `);
    const stagingCols = await pool.request().query(`
        SELECT COLUMN_NAME, DATA_TYPE FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'patient_staging'
    `);
    console.log('patient_match_audit:', auditCols.recordset.map(c => c.COLUMN_NAME));
    console.log('patient_staging:', stagingCols.recordset.map(c => c.COLUMN_NAME));
    process.exit(0);
}
checkColumns();

