const { getPool } = require('../backend/config/db');

async function run() {
  const pool = await getPool();
  const cols = await pool.request().query(`
    SELECT TABLE_NAME, COLUMN_NAME 
    FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE (TABLE_NAME IN ('hf_administrative', 'hf_registry', 'stemi_registry', 'nstemi_registry'))
      AND (COLUMN_NAME LIKE '%date%' OR COLUMN_NAME LIKE '%adm%')
    ORDER BY TABLE_NAME, COLUMN_NAME;
  `);
  console.table(cols.recordset);
  process.exit(0);
}

run().catch(e => { console.error(e); process.exit(1); });
