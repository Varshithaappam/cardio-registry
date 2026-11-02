const { query } = require('../backend/config/db');

async function test() {
  try {
    const result = await query(`
      SELECT hf_id, nyha_class_1, nyha_class_2, nyha_class_3, nyha_class_4
      FROM hf_final_clinical_assessment
      WHERE hf_id IN (26, 153, 158, 159, 160, 163)
    `);
    console.log('Query result:');
    console.table(result.recordset);
    process.exit(0);
  } catch (err) {
    console.error('DB error:', err.message);
    process.exit(1);
  }
}

test();
