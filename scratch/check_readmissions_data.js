const { getPool } = require('../backend/config/db');

async function run() {
  const pool = await getPool();

  // 1. HF
  const hfMaceHosp = await pool.request().query(`
    SELECT mace_hospitalization, COUNT(*) as cnt
    FROM dbo.hf_final_clinical_assessment
    GROUP BY mace_hospitalization;
  `);
  console.log('HF Final Assessment mace_hospitalization:');
  console.table(hfMaceHosp.recordset);

  // 2. STEMI Followup
  const stemiHosp = await pool.request().query(`
    SELECT acs_hospitalization, COUNT(*) as cnt
    FROM dbo.stemi_followup
    GROUP BY acs_hospitalization;
  `);
  console.log('STEMI Followup acs_hospitalization:');
  console.table(stemiHosp.recordset);

  // 3. NSTEMI Followup
  const nstemiHosp = await pool.request().query(`
    SELECT acs_hospitalization, COUNT(*) as cnt
    FROM dbo.nstemi_followup
    GROUP BY acs_hospitalization;
  `);
  console.log('NSTEMI Followup acs_hospitalization:');
  console.table(nstemiHosp.recordset);

  // 4. Repeated admissions by patient (reg_patient_id having multiple admissions in each registry)
  const hfRepeats = await pool.request().query(`
    SELECT reg_patient_id, COUNT(*) as admissions
    FROM dbo.hf_registry
    WHERE is_deleted = 0 OR is_deleted IS NULL
    GROUP BY reg_patient_id
    HAVING COUNT(*) > 1;
  `);
  console.log('HF patients with >1 admission in hf_registry:', hfRepeats.recordset.length);

  const stemiRepeats = await pool.request().query(`
    SELECT reg_patient_id, COUNT(*) as admissions
    FROM dbo.stemi_registry
    WHERE is_deleted = 0 OR is_deleted IS NULL
    GROUP BY reg_patient_id
    HAVING COUNT(*) > 1;
  `);
  console.log('STEMI patients with >1 admission in stemi_registry:', stemiRepeats.recordset.length);

  const nstemiRepeats = await pool.request().query(`
    SELECT reg_patient_id, COUNT(*) as admissions
    FROM dbo.nstemi_registry
    WHERE is_deleted = 0 OR is_deleted IS NULL
    GROUP BY reg_patient_id
    HAVING COUNT(*) > 1;
  `);
  console.log('NSTEMI patients with >1 admission in nstemi_registry:', nstemiRepeats.recordset.length);

  process.exit(0);
}

run().catch(e => { console.error(e); process.exit(1); });
