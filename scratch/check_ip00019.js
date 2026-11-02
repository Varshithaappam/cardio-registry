const { poolPromise } = require('../backend/config/db');

async function checkOther() {
    const pool = await poolPromise;
    const res = await pool.request().query(`
        SELECT hr.hf_id, p.uhid, ha.myocardial_ischemia, ha.atrial_fibrillation, ha.bradyarrhythmia, ha.ventricular_tachycardia, ha.uncontrolled_hypertension, ha.infection, ha.renal_failure, ha.anaemia, ha.precipitating_other
        FROM hf_registry hr
        JOIN patient_demographics p ON hr.reg_patient_id = p.reg_patient_id
        JOIN hf_administrative ha ON hr.hf_id = ha.hf_id
        WHERE ha.precipitating_other = 'Other Precipitating Factor'
    `);
    console.log(res.recordset);
    process.exit(0);
}
checkOther();
