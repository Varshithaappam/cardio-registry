const { getPool } = require('../backend/config/db');

async function run() {
  const pool = await getPool();

  // 1. HF readmission
  // In hf_final_clinical_assessment or hf_followup_records or hf_initial_assessment
  const hfFinal = await pool.request().query(`
    SELECT COLUMN_NAME, DATA_TYPE 
    FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_NAME = 'hf_final_clinical_assessment'
  `);
  console.log('hf_final_clinical_assessment columns:', hfFinal.recordset.map(c => c.COLUMN_NAME));

  const hfFollowup = await pool.request().query(`
    SELECT COLUMN_NAME, DATA_TYPE 
    FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_NAME = 'hf_followup_records'
  `);
  console.log('hf_followup_records columns:', hfFollowup.recordset.map(c => c.COLUMN_NAME));

  // Check data in hf_followup_records
  const hfFuData = await pool.request().query(`
    SELECT 
      COUNT(*) as total_followups,
      COUNT(DISTINCT hf_id) as distinct_hf_patients,
      COUNT(CASE WHEN event_hf_hospitalization = 'Yes' OR event_hf_hospitalization = '1' OR event_cv_hospitalization = 'Yes' OR event_cv_hospitalization = '1' THEN 1 END) as hf_readmitted
    FROM dbo.hf_followup_records;
  `);
  console.log('hf_followup_records readmission count:');
  console.table(hfFuData.recordset);

  // 2. STEMI readmission
  const stemiOutcomes = await pool.request().query(`
    SELECT COLUMN_NAME, DATA_TYPE 
    FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_NAME = 'stemi_outcomes'
  `);
  console.log('stemi_outcomes columns:', stemiOutcomes.recordset.map(c => c.COLUMN_NAME));

  const stemiFollowup = await pool.request().query(`
    SELECT COLUMN_NAME, DATA_TYPE 
    FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_NAME = 'stemi_followup' OR TABLE_NAME = 'stemi_followup_records'
  `);
  console.log('stemi_followup columns:', stemiFollowup.recordset.map(c => `${c.TABLE_NAME}.${c.COLUMN_NAME}`));

  // 3. NSTEMI readmission
  const nstemiOutcomes = await pool.request().query(`
    SELECT COLUMN_NAME, DATA_TYPE 
    FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_NAME = 'nstemi_outcomes'
  `);
  console.log('nstemi_outcomes columns:', nstemiOutcomes.recordset.map(c => c.COLUMN_NAME));

  const nstemiFollowup = await pool.request().query(`
    SELECT COLUMN_NAME, DATA_TYPE 
    FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_NAME = 'nstemi_followup' OR TABLE_NAME = 'nstemi_followup_records'
  `);
  console.log('nstemi_followup columns:', nstemiFollowup.recordset.map(c => `${c.TABLE_NAME}.${c.COLUMN_NAME}`));

  process.exit(0);
}

run().catch(e => { console.error(e); process.exit(1); });
