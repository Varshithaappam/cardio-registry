const db = require('../backend/config/db');
const { materializeSingleHfGdmt } = require('../backend/services/gdmtEvaluationService');

async function main() {
    try {
        console.log('Connecting to database...');
        const { recordset } = await db.query('SELECT hf_id FROM dbo.hf_registry WHERE is_deleted = 0 OR is_deleted IS NULL ORDER BY hf_id ASC');
        console.log(`Found ${recordset.length} HF records to evaluate.`);
        
        for (const row of recordset) {
            await materializeSingleHfGdmt(row.hf_id);
        }
        console.log('Successfully re-evaluated and materialized all HF records!');

        // Check hf_id = 20 now!
        const evalRes = await db.query('SELECT hf_id, rx_arb, rx_arni, rx_sglt2_inhibitor, ci_arb, ci_arni, ci_mra, deviations_count, adherence_percent FROM dbo.hf_gdmt_evaluation WHERE hf_id = 20');
        console.log('HF ID 20 after re-evaluation:', evalRes.recordset[0]);
        
        process.exit(0);
    } catch (e) {
        console.error('Error during rematerialization:', e);
        process.exit(1);
    }
}

main();

