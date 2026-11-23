const { getPool } = require('../backend/config/db');

async function run() {
  const pool = await getPool();

  const diff = await pool.request().query(`
    SELECT h.stemi_id, h.total_cost, s.is_deleted, s.acs_no
    FROM dbo.stemi_hospitalization h
    LEFT JOIN dbo.stemi_registry s ON h.stemi_id = s.stemi_id
    WHERE s.stemi_id IS NULL OR s.is_deleted = 1;
  `);
  console.log('Orphaned or deleted STEMI hospitalization rows:');
  console.table(diff.recordset);

  const queryAll = await pool.request().query(`
    SELECT 
      SUM(h.total_cost) as all_hosp_cost,
      SUM(CASE WHEN s.is_deleted = 0 OR s.is_deleted IS NULL THEN h.total_cost END) as active_hosp_cost
    FROM dbo.stemi_hospitalization h
    LEFT JOIN dbo.stemi_registry s ON h.stemi_id = s.stemi_id;
  `);
  console.log('All vs Active cost:', queryAll.recordset);

  process.exit(0);
}

run().catch(e => { console.error(e); process.exit(1); });
