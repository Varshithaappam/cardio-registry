const db = require('../backend/config/db');

async function checkMR3() {
  const { recordset } = await db.query(`
    SELECT hr.hf_id, hr.reg_patient_id, p.mr_no, p.uhid, ha.present_diagnosis, e.*
    FROM hf_registry hr
    LEFT JOIN patient_demographics p ON p.reg_patient_id = hr.reg_patient_id
    LEFT JOIN hf_administrative ha ON ha.hf_id = hr.hf_id
    LEFT JOIN hf_gdmt_evaluation e ON e.hf_id = hr.hf_id
    WHERE p.mr_no LIKE '%MR00003%' OR p.uhid LIKE '%MR00003%'
  `);
  console.log(recordset);
  process.exit(0);
}

checkMR3().catch(console.error);

