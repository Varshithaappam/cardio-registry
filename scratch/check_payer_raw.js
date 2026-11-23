const { getPool } = require('../backend/config/db');

async function run() {
  const pool = await getPool();

  const res = await pool.request().query(`
    SELECT insurance_mode, COUNT(*) as cnt
    FROM dbo.hf_administrative
    GROUP BY insurance_mode
    ORDER BY cnt DESC;
  `);
  console.log('hf_administrative insurance_mode raw counts:');
  console.table(res.recordset);

  process.exit(0);
}

run().catch(e => { console.error(e); process.exit(1); });
