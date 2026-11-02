const db = require('../backend/config/db');

async function test() {
    const res = await db.query(`
        SELECT 
            t1.arb_not_used_elevated_creatinine,
            t1.arb_not_used_hyperkalemia,
            t1.arb_not_used_hypotension,
            t1.arb_not_used_other,
            t1.arb_not_used_other_reason,
            t1.aldosterone_not_used_hyperkalemia,
            t1.aldosterone_not_used_hyponatremia,
            t1.aldosterone_not_used_elevated_creatinine,
            t1.aldosterone_not_used_other,
            t1.aldosterone_not_used_other_reason,
            lt.creatinine_result,
            lt.potassium_result,
            ia.systolic_bp_sitting
        FROM dbo.hf_registry hr
        LEFT JOIN dbo.hf_medical_therapy_part1 t1 ON t1.hf_id = hr.hf_id
        LEFT JOIN dbo.hf_initial_assessment ia ON ia.hf_id = hr.hf_id
        LEFT JOIN dbo.hf_lab_tests lt ON lt.hf_id = hr.hf_id
        WHERE hr.hf_id = 20
    `);
    console.log('HF 20 Raw Values:', res.recordset[0]);
    process.exit(0);
}

test();

