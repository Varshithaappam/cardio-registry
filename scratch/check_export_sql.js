const { query } = require('../backend/config/db');

async function test() {
  try {
    const result = await query(`
      SELECT 
        hr.hf_id,
        fa.nyha_class_1,
        fa.nyha_class_2,
        fa.nyha_class_3,
        fa.nyha_class_4
      FROM dbo.hf_registry hr
      LEFT JOIN dbo.hf_final_clinical_assessment fa ON fa.hf_id = hr.hf_id
      WHERE hr.hf_id IN (26, 153, 158, 159, 160, 163)
    `);
    console.table(result.recordset);
    process.exit(0);
  } catch (err) {
    console.error('DB error:', err.message);
    process.exit(1);
  }
}

test();

