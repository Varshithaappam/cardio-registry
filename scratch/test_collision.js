const { poolPromise } = require('../backend/config/db');

async function testQueryColCollision() {
    const pool = await poolPromise;
    const res = await pool.request().query(`
        SELECT 
            ha.hf_id,
            ha.renal_failure,
            fa.renal_failure
        FROM hf_administrative ha
        LEFT JOIN hf_final_clinical_assessment fa ON ha.hf_id = fa.hf_id
        WHERE ha.hf_id = 14
    `);
    console.log('Result for hf_id 14:', res.recordset[0]);
    process.exit(0);
}
testQueryColCollision();

