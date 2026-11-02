const db = require('../backend/config/db');

async function checkSchema() {
  const { recordset } = await db.query(`
    SELECT TABLE_NAME, COLUMN_NAME, DATA_TYPE, CHARACTER_MAXIMUM_LENGTH
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_NAME IN ('hf_administrative', 'stemi_registry', 'nstemi_registry', 'hf_gdmt_evaluation', 'hf_final_clinical_assessment')
    ORDER BY TABLE_NAME, ORDINAL_POSITION
  `);
  
  const tables = {};
  for (const row of recordset) {
    if (!tables[row.TABLE_NAME]) tables[row.TABLE_NAME] = [];
    tables[row.TABLE_NAME].push(row.COLUMN_NAME);
  }
  
  console.log(JSON.stringify(tables, null, 2));
  process.exit(0);
}

checkSchema().catch(console.error);

