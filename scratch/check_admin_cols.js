const db = require('../backend/config/db');

async function check() {
    const res = await db.query(`
        SELECT COLUMN_NAME, DATA_TYPE
        FROM INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_NAME = 'hf_administrative'
        ORDER BY ORDINAL_POSITION;
    `);
    console.log('Columns in hf_administrative:');
    for (const r of res.recordset) {
        console.log(`  ${r.COLUMN_NAME} (${r.DATA_TYPE})`);
    }
    process.exit(0);
}

check();

