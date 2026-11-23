const { getPool } = require('../backend/config/db');

async function run() {
  const pool = await getPool();

  const stemiStrat = await pool.request().query(`
    SELECT 
      t.pami, t.thrombolysis, t.conservative,
      COUNT(*) as count_patients,
      SUM(h.total_cost) as total_cost,
      AVG(h.total_cost) as avg_cost
    FROM dbo.stemi_hospitalization h
    JOIN dbo.stemi_treatment_strategy t ON h.stemi_id = t.stemi_id
    WHERE h.total_cost > 0
    GROUP BY t.pami, t.thrombolysis, t.conservative;
  `);
  console.log('STEMI Cost by Strategy:');
  console.table(stemiStrat.recordset);

  const nstemiStrat = await pool.request().query(`
    SELECT 
      t.pami, t.thrombolysis, t.conservative,
      COUNT(*) as count_patients,
      SUM(h.total_cost) as total_cost,
      AVG(h.total_cost) as avg_cost
    FROM dbo.nstemi_hospitalization h
    JOIN dbo.nstemi_treatment_strategy t ON h.nstemi_id = t.nstemi_id
    WHERE h.total_cost > 0
    GROUP BY t.pami, t.thrombolysis, t.conservative;
  `);
  console.log('NSTEMI Cost by Strategy:');
  console.table(nstemiStrat.recordset);

  process.exit(0);
}

run().catch(e => { console.error(e); process.exit(1); });
