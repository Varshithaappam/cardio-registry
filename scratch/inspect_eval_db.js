const db = require('../backend/config/db');

async function inspect() {
    const res = await db.query('SELECT * FROM dbo.hf_gdmt_evaluation WHERE hf_id IN (20, 54)');
    for (const r of res.recordset) {
        console.log(`\n=== HF_ID ${r.hf_id} ===`);
        for (const [k, v] of Object.entries(r)) {
            if (v !== null && v !== '' && v !== 0) {
                console.log(`  ${k}: ${v}`);
            }
        }
    }
    process.exit(0);
}

inspect();

