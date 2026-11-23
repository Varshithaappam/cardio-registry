const { getPool } = require('../backend/config/db');

async function run() {
  const pool = await getPool();
  const countsQuery = `
    SELECT
      (SELECT COUNT(*) FROM dbo.hf_registry WHERE is_deleted = 0 OR is_deleted IS NULL) AS hf_total,
      (SELECT COUNT(*) FROM dbo.stemi_registry WHERE is_deleted = 0 OR is_deleted IS NULL) AS stemi_total,
      (SELECT COUNT(*) FROM dbo.nstemi_registry WHERE is_deleted = 0 OR is_deleted IS NULL) AS nstemi_total,
      
      -- HF In-Hospital Deaths
      (SELECT COUNT(*) FROM dbo.hf_registry hr 
       LEFT JOIN dbo.hf_final_clinical_assessment fa ON fa.hf_id = hr.hf_id
       WHERE (hr.is_deleted = 0 OR hr.is_deleted IS NULL) 
         AND (fa.death_hospital = 'Yes' OR fa.death_hospital = '1' OR (fa.mace_death = 'Yes' AND (fa.death_home IS NULL OR fa.death_home = 'No' OR fa.death_home = '0')))) AS hf_in_hosp_deaths,

      -- STEMI In-Hospital Deaths
      (SELECT COUNT(*) FROM dbo.stemi_registry s
       LEFT JOIN dbo.stemi_outcomes o ON o.stemi_id = s.stemi_id
       WHERE (s.is_deleted = 0 OR s.is_deleted IS NULL) AND (o.death = 'Yes' OR o.death = '1')) AS stemi_in_hosp_deaths,

      -- NSTEMI In-Hospital Deaths
      (SELECT COUNT(*) FROM dbo.nstemi_registry n
       LEFT JOIN dbo.nstemi_outcomes o ON o.nstemi_id = n.nstemi_id
       WHERE (n.is_deleted = 0 OR n.is_deleted IS NULL) AND (o.death = 'Yes' OR o.death = '1')) AS nstemi_in_hosp_deaths,

      -- HF Total All-Cause Deaths
      (SELECT COUNT(*) FROM dbo.hf_registry hr 
       LEFT JOIN dbo.hf_final_clinical_assessment fa ON fa.hf_id = hr.hf_id
       WHERE (hr.is_deleted = 0 OR hr.is_deleted IS NULL) 
         AND (fa.mace_death = 'Yes' OR fa.death_date IS NOT NULL OR fa.death_hospital = 'Yes' OR fa.death_home = 'Yes' OR fa.death_hospital = '1' OR fa.death_home = '1')) AS hf_total_deaths
  `;
  const res = await pool.request().query(countsQuery);
  console.log('COUNTS RESULT:', res.recordset[0]);
  process.exit(0);
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
