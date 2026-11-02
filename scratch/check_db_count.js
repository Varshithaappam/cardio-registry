const { query } = require('../backend/config/db');

async function test() {
  const countRes = await query('SELECT count(*) as cnt FROM hf_registry');
  console.log('hf_registry count in local DB:', countRes.recordset[0].cnt);
  process.exit(0);
}
test();

