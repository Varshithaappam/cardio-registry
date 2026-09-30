const db = require('../backend/config/db');

(async () => {
  try {
    const pool = await db.getPool();
    
    // Test updated NSTEMI query with OUTER APPLY for TOP 1 nf and TOP 1 nr
    const pRes = await pool.request().query(`
      SELECT nol.log_id, nol.reg_patient_id, COUNT(*) AS match_count
      FROM nurse_outreach_logs nol
      LEFT JOIN patient_followup_tasks t ON nol.task_id = t.task_id
      OUTER APPLY (
        SELECT TOP 1 nf.followup_id, nf.nstemi_id, nf.followup_month
        FROM nstemi_followup nf
        WHERE (nol.nstemi_followup_id IS NOT NULL AND nf.followup_id = nol.nstemi_followup_id)
           OR (t.source_record_id IS NOT NULL AND nf.nstemi_id = t.source_record_id AND (t.timeframe IS NULL OR nf.followup_month = t.timeframe))
        ORDER BY CASE WHEN nol.nstemi_followup_id = nf.followup_id THEN 0 ELSE 1 END ASC, nf.followup_id DESC
      ) nf
      OUTER APPLY (
        SELECT TOP 1 nr.nstemi_id, nr.acs_no, nr.ip_no
        FROM nstemi_registry nr
        WHERE (nf.nstemi_id IS NOT NULL AND nr.nstemi_id = nf.nstemi_id)
           OR (t.source_record_id IS NOT NULL AND nr.nstemi_id = t.source_record_id)
           OR (nr.reg_patient_id = nol.reg_patient_id)
        ORDER BY CASE WHEN t.source_record_id = nr.nstemi_id THEN 0 ELSE 1 END ASC, nr.nstemi_id DESC
      ) nr
      WHERE nol.registry_type = 'NSTEMI' OR t.source_registry LIKE '%NSTEMI%'
      GROUP BY nol.log_id, nol.reg_patient_id
      HAVING COUNT(*) > 1
    `);
    console.log('Duplicate log_ids with OUTER APPLY in NSTEMI query:', pRes.recordset);

    process.exit(0);
  } catch (err) {
    console.error('Error running duplicate test:', err);
    process.exit(1);
  }
})();
