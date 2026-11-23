const { getPool } = require('../backend/config/db');

async function run() {
  const pool = await getPool();
  const res = await pool.request().query(`
    SELECT TABLE_NAME, COLUMN_NAME, DATA_TYPE
    FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE COLUMN_NAME LIKE '%cost%' 
       OR COLUMN_NAME LIKE '%charge%'
       OR COLUMN_NAME LIKE '%amount%'
       OR COLUMN_NAME LIKE '%bill%'
       OR COLUMN_NAME LIKE '%readmi%'
       OR COLUMN_NAME LIKE '%re_admi%'
    ORDER BY TABLE_NAME, COLUMN_NAME
  `);
  console.log('Columns matching cost or readmission:');
  console.table(res.recordset);

  // Check readmissions across registries
  const hfCols = await pool.request().query(`
    SELECT TABLE_NAME, COLUMN_NAME 
    FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE (TABLE_NAME LIKE 'hf_%' OR TABLE_NAME LIKE 'stemi_%' OR TABLE_NAME LIKE 'nstemi_%')
      AND (COLUMN_NAME LIKE '%readmi%' OR COLUMN_NAME LIKE '%re_admi%' OR COLUMN_NAME LIKE '%hosp%')
  `);
  console.log('\nPotential Readmission Columns:');
  console.table(hfCols.recordset);

  process.exit(0);
}

run().catch(e => { console.error(e); process.exit(1); });
