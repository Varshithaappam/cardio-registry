const { sql, poolPromise } = require('../backend/config/db');

async function checkPatient() {
    const pool = await poolPromise;
    const uhid = 'DDCH.00057';
    const patientRes = await pool.request().input('uhid', sql.NVarChar, uhid).query(`
        SELECT reg_patient_id, uhid, patient_name FROM patient_demographics WHERE uhid = @uhid
    `);
    console.log('Patient:', patientRes.recordset);
    if (patientRes.recordset.length > 0) {
        const regId = patientRes.recordset[0].reg_patient_id;
        
        const audit = await pool.request().query(`SELECT COUNT(*) as c FROM patient_match_audit WHERE reg_patient_id = ${regId}`);
        const hf = await pool.request().query(`SELECT hf_id FROM hf_registry WHERE reg_patient_id = ${regId}`);
        const stemi = await pool.request().query(`SELECT stemi_id FROM stemi_registry WHERE reg_patient_id = ${regId}`);
        const nstemi = await pool.request().query(`SELECT nstemi_id FROM nstemi_registry WHERE reg_patient_id = ${regId}`);
        const tasks = await pool.request().query(`SELECT COUNT(*) as c FROM patient_followup_tasks WHERE reg_patient_id = ${regId}`);
        const outreach = await pool.request().query(`SELECT COUNT(*) as c FROM nurse_outreach_logs WHERE reg_patient_id = ${regId}`);
        const identity = await pool.request().query(`SELECT COUNT(*) as c FROM patient_identity_index WHERE reg_patient_id = ${regId}`);
        const gdmt = await pool.request().query(`SELECT COUNT(*) as c FROM hf_gdmt_evaluation WHERE reg_patient_id = ${regId}`);

        console.log({
            regId,
            auditCount: audit.recordset[0].c,
            hfIds: hf.recordset.map(r => r.hf_id),
            stemiIds: stemi.recordset.map(r => r.stemi_id),
            nstemiIds: nstemi.recordset.map(r => r.nstemi_id),
            followupTasks: tasks.recordset[0].c,
            outreachLogs: outreach.recordset[0].c,
            identityIndex: identity.recordset[0].c,
            gdmtCount: gdmt.recordset[0].c
        });
    }
    process.exit(0);
}
checkPatient();

