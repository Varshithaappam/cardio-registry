const { query } = require('../backend/config/db');

async function test() {
  const r = await query(`
    SELECT hf_id, nyha_class_1, nyha_class_2, nyha_class_3, nyha_class_4 
    FROM hf_final_clinical_assessment 
    WHERE nyha_class_4 = 'Yes'
  `);
  console.table(r.recordset);
  process.exit(0);
}
test();

