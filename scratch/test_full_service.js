const db = require('../backend/config/db');

async function testFullServiceMetrics() {
  const pool = await db.getPool();

  // 1. Demographics: Age Distribution
  const ageQ = `
    WITH AllPts AS (
      SELECT 'HF' as registry, COALESCE(TRY_CAST(e.age AS FLOAT), DATEDIFF(YEAR, p.date_of_birth, GETDATE())) as age
      FROM dbo.hf_registry hr
      LEFT JOIN dbo.hf_gdmt_evaluation e ON e.hf_id = hr.hf_id
      LEFT JOIN dbo.patient_demographics p ON p.reg_patient_id = hr.reg_patient_id
      WHERE hr.is_deleted = 0 OR hr.is_deleted IS NULL
      UNION ALL
      SELECT 'STEMI' as registry, DATEDIFF(YEAR, p.date_of_birth, GETDATE()) as age
      FROM dbo.stemi_registry sr
      LEFT JOIN dbo.patient_demographics p ON p.reg_patient_id = sr.reg_patient_id
      WHERE sr.is_deleted = 0 OR sr.is_deleted IS NULL
      UNION ALL
      SELECT 'NSTEMI' as registry, DATEDIFF(YEAR, p.date_of_birth, GETDATE()) as age
      FROM dbo.nstemi_registry nr
      LEFT JOIN dbo.patient_demographics p ON p.reg_patient_id = nr.reg_patient_id
      WHERE nr.is_deleted = 0 OR nr.is_deleted IS NULL
    )
    SELECT
      registry,
      COUNT(*) as total,
      ROUND(SUM(CASE WHEN age < 50 THEN 1.0 ELSE 0 END) / COUNT(*) * 100.0, 1) as lt_50,
      ROUND(SUM(CASE WHEN age >= 50 AND age <= 60 THEN 1.0 ELSE 0 END) / COUNT(*) * 100.0, 1) as b_50_60,
      ROUND(SUM(CASE WHEN age >= 61 AND age <= 70 THEN 1.0 ELSE 0 END) / COUNT(*) * 100.0, 1) as b_61_70,
      ROUND(SUM(CASE WHEN age > 70 THEN 1.0 ELSE 0 END) / COUNT(*) * 100.0, 1) as gt_70
    FROM AllPts
    GROUP BY registry;
  `;
  const ageRes = await pool.request().query(ageQ);
  const hfAge = ageRes.recordset.find(r => r.registry === 'HF') || {};
  const stemiAge = ageRes.recordset.find(r => r.registry === 'STEMI') || {};
  const nstemiAge = ageRes.recordset.find(r => r.registry === 'NSTEMI') || {};

  const ageDistribution = [
    { bracket: '<50', HF: Number(hfAge.lt_50 || 0), STEMI: Number(stemiAge.lt_50 || 0), NSTEMI: Number(nstemiAge.lt_50 || 0) },
    { bracket: '50-60', HF: Number(hfAge.b_50_60 || 0), STEMI: Number(stemiAge.b_50_60 || 0), NSTEMI: Number(nstemiAge.b_50_60 || 0) },
    { bracket: '61-70', HF: Number(hfAge.b_61_70 || 0), STEMI: Number(stemiAge.b_61_70 || 0), NSTEMI: Number(nstemiAge.b_61_70 || 0) },
    { bracket: '>70', HF: Number(hfAge.gt_70 || 0), STEMI: Number(stemiAge.gt_70 || 0), NSTEMI: Number(nstemiAge.gt_70 || 0) }
  ];
  console.log('Age Distribution:', ageDistribution);

  // 2. Gender Distribution
  const genderQ = `
    SELECT 
      'Heart Failure' as registry,
      ROUND(SUM(CASE WHEN p.gender IN ('Male', 'M') THEN 1.0 ELSE 0 END) / COUNT(*) * 100.0, 1) as Male,
      ROUND(SUM(CASE WHEN p.gender IN ('Female', 'F') THEN 1.0 ELSE 0 END) / COUNT(*) * 100.0, 1) as Female
    FROM dbo.hf_registry hr
    LEFT JOIN dbo.patient_demographics p ON p.reg_patient_id = hr.reg_patient_id
    WHERE hr.is_deleted = 0 OR hr.is_deleted IS NULL
    UNION ALL
    SELECT 
      'STEMI' as registry,
      ROUND(SUM(CASE WHEN p.gender IN ('Male', 'M') THEN 1.0 ELSE 0 END) / COUNT(*) * 100.0, 1) as Male,
      ROUND(SUM(CASE WHEN p.gender IN ('Female', 'F') THEN 1.0 ELSE 0 END) / COUNT(*) * 100.0, 1) as Female
    FROM dbo.stemi_registry sr
    LEFT JOIN dbo.patient_demographics p ON p.reg_patient_id = sr.reg_patient_id
    WHERE sr.is_deleted = 0 OR sr.is_deleted IS NULL
    UNION ALL
    SELECT 
      'NSTEMI' as registry,
      ROUND(SUM(CASE WHEN p.gender IN ('Male', 'M') THEN 1.0 ELSE 0 END) / COUNT(*) * 100.0, 1) as Male,
      ROUND(SUM(CASE WHEN p.gender IN ('Female', 'F') THEN 1.0 ELSE 0 END) / COUNT(*) * 100.0, 1) as Female
    FROM dbo.nstemi_registry nr
    LEFT JOIN dbo.patient_demographics p ON p.reg_patient_id = nr.reg_patient_id
    WHERE nr.is_deleted = 0 OR nr.is_deleted IS NULL;
  `;
  const genderRes = await pool.request().query(genderQ);
  console.log('Gender Distribution:', genderRes.recordset);

  // 3. Multimorbidity Overlap
  const overlapQ = `
    WITH HF_Pts AS (SELECT DISTINCT reg_patient_id FROM dbo.hf_registry WHERE (is_deleted = 0 OR is_deleted IS NULL) AND reg_patient_id IS NOT NULL),
    STEMI_Pts AS (SELECT DISTINCT reg_patient_id FROM dbo.stemi_registry WHERE (is_deleted = 0 OR is_deleted IS NULL) AND reg_patient_id IS NOT NULL),
    NSTEMI_Pts AS (SELECT DISTINCT reg_patient_id FROM dbo.nstemi_registry WHERE (is_deleted = 0 OR is_deleted IS NULL) AND reg_patient_id IS NOT NULL)
    SELECT
      (SELECT COUNT(*) FROM HF_Pts h INNER JOIN STEMI_Pts s ON h.reg_patient_id = s.reg_patient_id) as hf_stemi,
      (SELECT COUNT(*) FROM STEMI_Pts s INNER JOIN NSTEMI_Pts n ON s.reg_patient_id = n.reg_patient_id) as stemi_nstemi,
      (SELECT COUNT(*) FROM HF_Pts h INNER JOIN NSTEMI_Pts n ON h.reg_patient_id = n.reg_patient_id) as hf_nstemi,
      (SELECT COUNT(*) FROM HF_Pts h INNER JOIN STEMI_Pts s ON h.reg_patient_id = s.reg_patient_id INNER JOIN NSTEMI_Pts n ON s.reg_patient_id = n.reg_patient_id) as all_three;
  `;
  const overlapRes = await pool.request().query(overlapQ);
  const ovRow = overlapRes.recordset[0] || {};
  const patientOverlap = [
    { name: 'HF & STEMI', patients: Number(ovRow.hf_stemi || 0), fill: '#2563eb' },
    { name: 'STEMI & NSTEMI', patients: Number(ovRow.stemi_nstemi || 0), fill: '#d97706' },
    { name: 'HF & NSTEMI', patients: Number(ovRow.hf_nstemi || 0), fill: '#7c3aed' },
    { name: 'All Three', patients: Number(ovRow.all_three || 0), fill: '#059669' }
  ];
  console.log('Patient Overlap Data:', patientOverlap);

  process.exit(0);
}

testFullServiceMetrics().catch(e => { console.error(e); process.exit(1); });
