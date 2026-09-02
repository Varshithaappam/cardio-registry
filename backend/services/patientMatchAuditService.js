const db = require('../config/db');

/**
 * Logs a match event / human decision into patient_match_audit
 */
async function logMatchAudit({
  reg_patient_id = null,
  candidate_patient_id = null,
  action = 'VERIFY',
  decision = 'NO_LIKELY_MATCH',
  user_decision = null,
  overall_score = 0.0,
  field_scores = null,
  reasons = null,
  algorithm_version = 'v1.0.0',
  created_by = 'System'
}) {
  const pool = await db.getPool();
  const request = pool.request();

  const fieldScoresJson = field_scores ? JSON.stringify(field_scores) : null;
  const reasonsJson = reasons ? JSON.stringify(reasons) : null;

  request.input('regPatientId', db.sql.Int, reg_patient_id);
  request.input('candPatientId', db.sql.Int, candidate_patient_id);
  request.input('action', db.sql.VarChar(50), action);
  request.input('decision', db.sql.VarChar(50), decision);
  request.input('userDecision', db.sql.VarChar(50), user_decision);
  request.input('overallScore', db.sql.Decimal(5, 2), overall_score);
  request.input('fieldScores', db.sql.NVarChar(db.sql.MAX), fieldScoresJson);
  request.input('reasons', db.sql.NVarChar(db.sql.MAX), reasonsJson);
  request.input('algoVersion', db.sql.VarChar(50), algorithm_version);
  request.input('createdBy', db.sql.VarChar(150), created_by);

  const res = await request.query(`
    INSERT INTO [patient_match_audit] (
      [reg_patient_id],
      [candidate_patient_id],
      [action],
      [decision],
      [user_decision],
      [overall_score],
      [field_scores],
      [reasons],
      [algorithm_version],
      [created_by],
      [created_at]
    ) VALUES (
      @regPatientId,
      @candPatientId,
      @action,
      @decision,
      @userDecision,
      @overallScore,
      @fieldScores,
      @reasons,
      @algoVersion,
      @createdBy,
      GETDATE()
    );
    SELECT SCOPE_IDENTITY() AS audit_id;
  `);

  return res.recordset[0]?.audit_id;
}

/**
 * Fetches paginated audit logs
 */
async function getAuditHistory({ limit = 50, offset = 0, patientId = null }) {
  const pool = await db.getPool();
  const request = pool.request();
  request.input('limit', db.sql.Int, limit);
  request.input('offset', db.sql.Int, offset);
  request.input('patientId', db.sql.Int, patientId);

  const res = await request.query(`
    SELECT 
      a.audit_id,
      a.reg_patient_id,
      a.candidate_patient_id,
      a.action,
      a.decision,
      a.user_decision,
      a.overall_score,
      a.field_scores,
      a.reasons,
      a.algorithm_version,
      a.created_by,
      a.created_at,
      p.patient_name AS patient_name,
      p.mr_no AS patient_mr_no,
      c.patient_name AS candidate_name,
      c.mr_no AS candidate_mr_no
    FROM [patient_match_audit] a
    LEFT JOIN [patient_demographics] p ON a.reg_patient_id = p.reg_patient_id
    LEFT JOIN [patient_demographics] c ON a.candidate_patient_id = c.reg_patient_id
    WHERE (@patientId IS NULL OR a.reg_patient_id = @patientId OR a.candidate_patient_id = @patientId)
    ORDER BY a.created_at DESC, a.audit_id DESC
    OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY;
  `);

  const countRes = await pool.request().query(`
    SELECT COUNT(*) AS total FROM [patient_match_audit];
  `);

  return {
    total: countRes.recordset[0]?.total || 0,
    logs: res.recordset.map(r => ({
      ...r,
      field_scores: r.field_scores ? JSON.parse(r.field_scores) : null,
      reasons: r.reasons ? JSON.parse(r.reasons) : []
    }))
  };
}

module.exports = {
  logMatchAudit,
  getAuditHistory
};
