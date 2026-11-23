const { getPool } = require('../backend/config/db');

async function check() {
  const pool = await getPool();

  // 1. EF Breakdown
  const efRes = await pool.request().query(`
    SELECT 
      SUM(CASE WHEN TRY_CAST(e.ef_percent AS FLOAT) < 40 THEN 1 ELSE 0 END) as hfref,
      SUM(CASE WHEN TRY_CAST(e.ef_percent AS FLOAT) BETWEEN 40 AND 49 THEN 1 ELSE 0 END) as hfmref,
      SUM(CASE WHEN TRY_CAST(e.ef_percent AS FLOAT) >= 50 THEN 1 ELSE 0 END) as hfpef,
      COUNT(*) as total
    FROM dbo.hf_gdmt_evaluation e
  `);
  console.log('1. LVEF Phenotypes (HF):', efRes.recordset[0]);

  // 2. GDMT 4-pillar count
  const gdmtPillars = await pool.request().query(`
    WITH PillarCalc AS (
      SELECT 
        hf_id,
        (CASE WHEN beta_blocker IN ('Yes', '1') THEN 1 ELSE 0 END +
         CASE WHEN mra IN ('Yes', '1') THEN 1 ELSE 0 END +
         CASE WHEN ace_inhibitor IN ('Yes', '1') OR arb IN ('Yes', '1') OR arni IN ('Yes', '1') THEN 1 ELSE 0 END +
         CASE WHEN sglt2_inhibitor IN ('Yes', '1') THEN 1 ELSE 0 END) as pillar_count
      FROM dbo.hf_gdmt_evaluation
    )
    SELECT 
      SUM(CASE WHEN pillar_count = 4 THEN 1 ELSE 0 END) as all_4_pillars,
      SUM(CASE WHEN pillar_count = 3 THEN 1 ELSE 0 END) as three_pillars,
      SUM(CASE WHEN pillar_count = 2 THEN 1 ELSE 0 END) as two_pillars,
      SUM(CASE WHEN pillar_count = 1 THEN 1 ELSE 0 END) as one_pillar,
      SUM(CASE WHEN pillar_count = 0 THEN 1 ELSE 0 END) as zero_pillars,
      COUNT(*) as total
    FROM PillarCalc;
  `);
  console.log('2. GDMT 4-Pillar Count Breakdown:', gdmtPillars.recordset[0]);

  // 3. STEMI & NSTEMI In-Hospital Complications
  const stemiComp = await pool.request().query(`
    SELECT 
      SUM(CASE WHEN ca.lvf IN ('Yes', '1') THEN 1 ELSE 0 END) as acute_lvf,
      SUM(CASE WHEN ca.vt_vf IN ('Yes', '1') THEN 1 ELSE 0 END) as vt_vf,
      SUM(CASE WHEN ca.bbb_chb IN ('Yes', '1') THEN 1 ELSE 0 END) as conduction_block,
      SUM(CASE WHEN ca.sbp_lt_100 IN ('Yes', '1') THEN 1 ELSE 0 END) as cardiogenic_shock_sbp_lt_100,
      COUNT(*) as total
    FROM dbo.stemi_clinical_assessment ca
  `);
  console.log('3. STEMI Acute Hemodynamic/Electrical Complications:', stemiComp.recordset[0]);

  process.exit(0);
}

check().catch(err => {
  console.error(err);
  process.exit(1);
});
