const db = require('../backend/config/db');

async function testMore() {
  const pool = await db.getPool();

  // 1. TIMI distribution
  const timiQ = `
    SELECT 
      'STEMI' as registry,
      COUNT(*) as total,
      ROUND(AVG(CAST(timi_total_score AS FLOAT)), 1) as avg_score,
      SUM(CASE WHEN timi_total_score <= 3 THEN 1 ELSE 0 END) as low_count,
      SUM(CASE WHEN timi_total_score BETWEEN 4 AND 7 THEN 1 ELSE 0 END) as med_count,
      SUM(CASE WHEN timi_total_score >= 8 THEN 1 ELSE 0 END) as high_count
    FROM dbo.stemi_clinical_assessment ca
    JOIN dbo.stemi_registry sr ON sr.stemi_id = ca.stemi_id
    WHERE (sr.is_deleted = 0 OR sr.is_deleted IS NULL) AND timi_total_score IS NOT NULL
    UNION ALL
    SELECT 
      'NSTEMI' as registry,
      COUNT(*) as total,
      ROUND(AVG(CAST(timi_total_score AS FLOAT)), 1) as avg_score,
      SUM(CASE WHEN timi_total_score <= 4 THEN 1 ELSE 0 END) as low_count,
      SUM(CASE WHEN timi_total_score BETWEEN 5 AND 10 THEN 1 ELSE 0 END) as med_count,
      SUM(CASE WHEN timi_total_score >= 11 THEN 1 ELSE 0 END) as high_count
    FROM dbo.nstemi_clinical_assessment ca
    JOIN dbo.nstemi_registry nr ON nr.nstemi_id = ca.nstemi_id
    WHERE (nr.is_deleted = 0 OR nr.is_deleted IS NULL) AND timi_total_score IS NOT NULL;
  `;
  const timiRes = await pool.request().query(timiQ);
  console.log('TIMI Distribution:');
  console.table(timiRes.recordset);

  // 2. ACS Presentation comparison
  const presQ = `
    SELECT 
      'STEMI' as registry,
      COUNT(*) as total,
      ROUND(SUM(CASE WHEN typical_angina IN ('Yes', '1') OR atypical_chest_pain IN ('Yes', '1') THEN 1.0 ELSE 0 END) / COUNT(*) * 100.0, 1) as chest_pain,
      ROUND(SUM(CASE WHEN breathlessness IN ('Yes', '1') THEN 1.0 ELSE 0 END) / COUNT(*) * 100.0, 1) as dyspnea,
      ROUND(SUM(CASE WHEN syncope_presyncope IN ('Yes', '1') THEN 1.0 ELSE 0 END) / COUNT(*) * 100.0, 1) as syncope,
      ROUND(SUM(CASE WHEN diaphoresis IN ('Yes', '1') THEN 1.0 ELSE 0 END) / COUNT(*) * 100.0, 1) as diaphoresis
    FROM dbo.stemi_clinical_assessment ca
    JOIN dbo.stemi_registry sr ON sr.stemi_id = ca.stemi_id
    WHERE sr.is_deleted = 0 OR sr.is_deleted IS NULL;
  `;
  try {
    const presRes = await pool.request().query(presQ);
    console.table(presRes.recordset);
  } catch (e) {
    console.log('presQ note:', e.message);
  }

  process.exit(0);
}

testMore().catch(e => { console.error(e); process.exit(1); });
