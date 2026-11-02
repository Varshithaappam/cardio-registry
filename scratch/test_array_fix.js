const { poolPromise } = require('../backend/config/db');

function isYes(val) {
  if (val === null || val === undefined) return false;
  if (Array.isArray(val)) {
    return val.some(v => isYes(v));
  }
  const s = String(val).trim().toLowerCase();
  return s === 'yes' || s === '1' || s === 'true';
}

async function testWithArrayFix() {
    const pool = await poolPromise;
    const res = await pool.request().query(`
        SELECT 
            ha.hf_id,
            ha.myocardial_ischemia,
            ha.atrial_fibrillation,
            ha.bradyarrhythmia,
            ha.ventricular_tachycardia,
            ha.uncontrolled_hypertension,
            ha.infection,
            ha.renal_failure,
            ha.anaemia,
            fa.renal_failure
        FROM hf_administrative ha
        LEFT JOIN hf_final_clinical_assessment fa ON ha.hf_id = fa.hf_id
        WHERE ha.hf_id = 14
    `);
    const row = res.recordset[0];
    console.log('Row 14 renal_failure:', row.renal_failure);
    console.log('isYes(row.renal_failure) with Array support:', isYes(row.renal_failure));
    process.exit(0);
}
testWithArrayFix();

