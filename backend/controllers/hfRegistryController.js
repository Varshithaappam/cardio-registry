const db = require('../config/db');
const { logAuditTrail } = require('../utils/logAuditTrail');
const { generateAuditExcel } = require('../utils/auditExcelGenerator');

/**
 * Format registry number e.g., HF00001
 */
function formatRegistryNumber(id) {
  return 'HF' + String(id).padStart(5, '0');
}

/**
 * Create Record (POST /api/hf-registry)
 * Protected by authenticateToken + requireRole('ADMIN', 'CLINICIAN', 'DATA_ENTRY')
 */
const createRecord = async (req, res) => {
  const userId = req.user?.id || req.user?.userId || 1;
  const conn = await db.getConnection();
  try {
    await conn.begin();

    const reg_patient_id = req.body.regPatientId || req.body.reg_patient_id;
    if (!reg_patient_id) {
      await conn.rollback();
      conn.release();
      return res.status(400).json({ success: false, message: 'Patient ID is required.' });
    }

    // 1. Insert hf_registry with placeholder hf_registry_no and created_by / updated_by
    const initialStatus = req.body.status || 'draft';
    const result = await db.insert(conn, 'hf_registry', {
      reg_patient_id,
      hf_registry_no: 'HF00000',
      created_by: userId,
      updated_by: userId,
      status: initialStatus
    }, 'hf_id');
    const newRecordId = result.recordset[0].hf_id;

    // 2. Generate and update hf_registry_no
    const hf_registry_no = formatRegistryNumber(newRecordId);
    await conn.query(
      'UPDATE [hf_registry] SET [hf_registry_no] = @registryNo WHERE [hf_id] = @hfId;',
      { registryNo: hf_registry_no, hfId: newRecordId }
    );

    await conn.commit();
    conn.release();

    // 3. Log Audit Action
    logAuditTrail(req, 'CREATE', 'HF', hf_registry_no, reg_patient_id, null, req.body).catch(err => console.error('logAuditTrail error:', err));

    return res.status(201).json({
      success: true,
      message: 'HF Registry record created successfully.',
      data: {
        hf_id: newRecordId,
        hf_registry_no,
        reg_patient_id,
        created_by: userId,
        updated_by: userId
      }
    });
  } catch (error) {
    await conn.rollback();
    conn.release();
    console.error('Error creating HF Registry record:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to create HF Registry record.'
    });
  }
};

/**
 * Update Record (PUT /api/hf-registry/:id)
 * Protected by authenticateToken + requireRole('ADMIN', 'CLINICIAN', 'DATA_ENTRY')
 */
const updateRecord = async (req, res) => {
  const userId = req.user?.id || req.user?.userId || 1;
  const recordId = Number(req.params.id);

  if (!recordId || isNaN(recordId)) {
    return res.status(400).json({ success: false, message: 'Invalid HF Registry ID.' });
  }

  try {
    // 1. Fetch current record before applying changes (previousData)
    const { recordset: rows } = await db.query('SELECT * FROM [hf_registry] WHERE [hf_id] = @recordId;', { recordId });
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'HF Registry record not found.' });
    }
    const previousData = rows[0];

    // 2. Update updated_by and updated_at
    const updateQuery = `
      UPDATE [hf_registry]
      SET [updated_by] = @userId, [updated_at] = SYSDATETIME()
      WHERE [hf_id] = @recordId;
    `;
    await db.query(updateQuery, { userId, recordId });

    // 3. Fetch updated record data (updatedData)
    const { recordset: updatedRows } = await db.query('SELECT * FROM [hf_registry] WHERE [hf_id] = @recordId;', { recordId });
    const updatedData = {
      ...(updatedRows[0] || {}),
      ...(req.body || {})
    };

    // 4. Log Audit Action with old and new values
    logAuditTrail(req, 'UPDATE', 'HF', previousData.hf_registry_no || recordId, previousData.reg_patient_id, previousData, updatedData).catch(err => console.error('logAuditTrail error:', err));

    return res.status(200).json({
      success: true,
      message: 'HF Registry record updated successfully.',
      data: {
        hf_id: recordId,
        updated_by: userId
      }
    });
  } catch (error) {
    console.error('Error updating HF Registry record:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to update HF Registry record.'
    });
  }
};

/**
 * Soft Delete Record (DELETE /api/hf-registry/:id)
 * Protected by authenticateToken + requireRole('ADMIN', 'CLINICIAN')
 */
const deleteRecord = async (req, res) => {
  const userId = req.user?.id || req.user?.userId || 1;
  const recordId = Number(req.params.id);

  if (!recordId || isNaN(recordId)) {
    return res.status(400).json({ success: false, message: 'Invalid HF Registry ID.' });
  }

  try {
    // 1. Fetch current record before soft-deletion
    const { recordset: rows } = await db.query('SELECT * FROM [hf_registry] WHERE [hf_id] = @recordId;', { recordId });
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'HF Registry record not found.' });
    }
    const previousData = rows[0];

    if (previousData.is_deleted === 1 || previousData.is_deleted === true) {
      return res.status(400).json({ success: false, message: 'HF Registry record is already soft-deleted.' });
    }

    // 2. Perform soft-delete with SQL Server's server-side timestamp.
    await db.query(
      'UPDATE [hf_registry] SET [is_deleted] = 1, [deleted_at] = SYSDATETIME(), [deleted_by] = @userId WHERE [hf_id] = @recordId;',
      { userId, recordId }
    );

    const { recordset: updatedRows } = await db.query('SELECT * FROM [hf_registry] WHERE [hf_id] = @recordId;', { recordId });
    const softDeletedData = updatedRows[0] || { ...previousData, is_deleted: 1, deleted_by: userId, deleted_at: new Date() };

    // 3. Execute logAudit entry with action_type = 'DELETE'
    logAuditTrail(req, 'DELETE', 'HF', previousData.hf_registry_no || recordId, previousData.reg_patient_id, previousData, softDeletedData).catch(err => console.error('logAuditTrail error:', err));

    return res.status(200).json({
      success: true,
      message: 'HF Registry record soft-deleted successfully.',
      data: softDeletedData
    });
  } catch (error) {
    console.error('Error soft-deleting HF Registry record:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to soft-delete HF Registry record.'
    });
  }
};

/**
 * Restore / Undelete Record (PATCH /api/hf-registry/:id/undelete)
 * Protected by authenticateToken + requireRole('ADMIN', 'CLINICIAN')
 */
const undeleteRecord = async (req, res) => {
  const userId = req.user?.id || req.user?.userId || 1;
  const recordId = Number(req.params.id);

  if (!recordId || isNaN(recordId)) {
    return res.status(400).json({ success: false, message: 'Invalid HF Registry ID.' });
  }

  try {
    // 1. Fetch current record before restoring
    const { recordset: rows } = await db.query('SELECT * FROM [hf_registry] WHERE [hf_id] = @recordId;', { recordId });
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'HF Registry record not found.' });
    }
    const previousData = rows[0];

    if (previousData.is_deleted === 0 || previousData.is_deleted === false) {
      return res.status(400).json({ success: false, message: 'HF Registry record is already active.' });
    }

    // 2. Perform restore: clear deleted_at, deleted_by, and set is_deleted = 0
    await db.query(
      'UPDATE [hf_registry] SET [is_deleted] = 0, [deleted_at] = NULL, [deleted_by] = NULL, [updated_at] = SYSDATETIME(), [updated_by] = @userId WHERE [hf_id] = @recordId;',
      { userId, recordId }
    );

    const { recordset: updatedRows } = await db.query('SELECT * FROM [hf_registry] WHERE [hf_id] = @recordId;', { recordId });
    const restoredData = updatedRows[0] || { ...previousData, is_deleted: 0, deleted_by: null, deleted_at: null };

    // 3. Execute audit log with action_type = 'RESTORE'
    logAuditTrail(req, 'RESTORE', 'HF', previousData.hf_registry_no || recordId, previousData.reg_patient_id, previousData, restoredData).catch(err => console.error('logAuditTrail error:', err));

    return res.status(200).json({
      success: true,
      message: 'HF Registry record restored successfully.',
      data: restoredData
    });
  } catch (error) {
    console.error('Error restoring HF Registry record:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to restore HF Registry record.'
    });
  }
};

/**
 * Expose Patient Audit Logs Endpoint (GET /api/hf-registry/patient/:regPatientId/audit)
 * Queries all hf_registry_audit records for a given reg_patient_id across all registries.
 */
const getPatientAuditLog = async (req, res) => {
  const reg_patient_id = Number(req.params.regPatientId || req.params.id);

  if (!reg_patient_id || isNaN(reg_patient_id)) {
    return res.status(400).json({ success: false, message: 'Invalid Patient ID.' });
  }

  try {
    const query = `
      SELECT 
        s.audit_id, 
        s.registry_type,
        COALESCE(s.record_identifier, CAST(s.record_id AS VARCHAR(100))) AS record_identifier,
        s.patient_id AS reg_patient_id, 
        s.user_id AS username, 
        s.action_type, 
        s.changed_fields,
        s.previous_values,
        s.new_values,
        s.timestamp, 
        p.patient_name, 
        p.mr_no 
      FROM system_audit_log s
      LEFT JOIN patient_demographics p ON TRY_CAST(s.patient_id AS INT) = p.reg_patient_id 
      WHERE (s.patient_id = CAST(@regPatientId AS VARCHAR(100)) OR TRY_CAST(s.patient_id AS INT) = @regPatientId)

      UNION ALL

      SELECT 
        a.audit_id + 1000000 AS audit_id, 
        'HF' AS registry_type,
        CASE 
          WHEN hf.hf_registry_no IS NOT NULL AND hf.hf_registry_no <> '' THEN hf.hf_registry_no
          ELSE 'HF #' + CAST(a.hf_id AS VARCHAR(100))
        END AS record_identifier,
        p.reg_patient_id, 
        COALESCE(u.username, CAST(a.user_id AS VARCHAR(100))) AS username, 
        a.action_type, 
        a.changed_fields,
        a.previous_values,
        a.new_values, 
        a.timestamp, 
        p.patient_name, 
        p.mr_no 
      FROM hf_registry_audit a 
      LEFT JOIN users u ON (CAST(a.user_id AS VARCHAR(100)) = CAST(u.user_id AS VARCHAR(100)) OR u.username = CAST(a.user_id AS VARCHAR(100))) 
      LEFT JOIN hf_registry hf ON a.hf_id = hf.hf_id 
      LEFT JOIN patient_demographics p ON hf.reg_patient_id = p.reg_patient_id 
      WHERE p.reg_patient_id = @regPatientId
        AND NOT EXISTS (
          SELECT 1 FROM system_audit_log s 
          WHERE (s.patient_id = CAST(p.reg_patient_id AS VARCHAR(100)) OR TRY_CAST(s.patient_id AS INT) = p.reg_patient_id)
            AND s.registry_type = 'HF'
            AND s.timestamp BETWEEN DATEADD(second, -5, a.timestamp) AND DATEADD(second, 5, a.timestamp)
        )
      ORDER BY timestamp DESC;
    `;
    const { recordset: rows } = await db.query(query, { regPatientId: reg_patient_id });

    const data = rows.map(row => {
      let prevVal = row.previous_values || null;
      let newVal = row.new_values || null;

      if (!prevVal && !newVal && row.changed_fields) {
        try {
          const parsed = typeof row.changed_fields === 'string' ? JSON.parse(row.changed_fields) : row.changed_fields;
          if (parsed && (parsed.previous !== undefined || parsed.new !== undefined)) {
            prevVal = parsed.previous;
            newVal = parsed.new;
          } else {
            newVal = parsed;
          }
        } catch {
          newVal = row.changed_fields;
        }
      }

      return {
        audit_id: row.audit_id,
        registry_type: row.registry_type || 'HF',
        record_identifier: row.record_identifier || '—',
        reg_patient_id: row.reg_patient_id,
        patient_name: row.patient_name,
        mr_no: row.mr_no,
        username: row.username || 'Dr. Alex V.',
        action_type: row.action_type,
        previous_values: prevVal,
        new_values: newVal,
        changed_fields: row.changed_fields || null,
        timestamp: row.timestamp
      };
    });

    return res.status(200).json({
      success: true,
      data
    });
  } catch (error) {
    console.error('SQL Error (getPatientAuditLog):', error.message || error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to retrieve patient audit history.',
      error: error.message
    });
  }
};

/**
 * Expose Single HF Record Audit Logs Endpoint (GET /api/hf-registry/:id/audit)
 */
const getAuditLog = async (req, res) => {
  const targetId = Number(req.params.id);

  if (!targetId || isNaN(targetId)) {
    return res.status(400).json({ success: false, message: 'Invalid ID.' });
  }

  try {
    const hfQuery = `
      SELECT 
        a.audit_id, 
        a.hf_id, 
        a.action_type, 
        a.changed_fields,
        a.previous_values,
        a.new_values, 
        a.timestamp, 
        COALESCE(u.username, CAST(a.user_id AS VARCHAR(100))) AS username, 
        u.email, 
        p.reg_patient_id, 
        p.patient_name, 
        p.mr_no 
      FROM hf_registry_audit a 
      LEFT JOIN users u ON (CAST(a.user_id AS VARCHAR(100)) = CAST(u.user_id AS VARCHAR(100)) OR u.username = CAST(a.user_id AS VARCHAR(100))) 
      LEFT JOIN hf_registry hf ON a.hf_id = hf.hf_id 
      LEFT JOIN patient_demographics p ON hf.reg_patient_id = p.reg_patient_id 
      WHERE a.hf_id = @targetId
      ORDER BY a.timestamp DESC;
    `;
    let { recordset: rows } = await db.query(hfQuery, { targetId });

    // Fallback if no rows found by JOINs
    if (rows.length === 0) {
      const fallbackQuery = `
        SELECT a.*, COALESCE(u.username, CAST(a.user_id AS VARCHAR(100))) AS username, u.email
        FROM hf_registry_audit a
        LEFT JOIN users u ON (CAST(a.user_id AS VARCHAR(100)) = CAST(u.user_id AS VARCHAR(100)) OR u.username = CAST(a.user_id AS VARCHAR(100)))
        WHERE a.hf_id = @targetId
        ORDER BY a.timestamp DESC
      `;
      const { recordset: fallbackRows } = await db.query(fallbackQuery, { targetId });
      rows = fallbackRows;
    }

    const data = rows.map(row => {
      let prevVal = row.previous_values || null;
      let newVal = row.new_values || null;

      if (!prevVal && !newVal && row.changed_fields) {
        try {
          const parsed = typeof row.changed_fields === 'string' ? JSON.parse(row.changed_fields) : row.changed_fields;
          if (parsed && (parsed.previous !== undefined || parsed.new !== undefined)) {
            prevVal = parsed.previous;
            newVal = parsed.new;
          } else {
            newVal = parsed;
          }
        } catch {
          newVal = row.changed_fields;
        }
      }

      return {
        audit_id: row.audit_id,
        hf_id: row.hf_id,
        user_id: row.user_id,
        username: row.username,
        email: row.email,
        action_type: row.action_type,
        previous_values: prevVal,
        new_values: newVal,
        changed_fields: row.changed_fields || null,
        timestamp: row.timestamp
      };
    });

    return res.status(200).json({
      success: true,
      data
    });
  } catch (error) {
    console.error('Error fetching audit log:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to retrieve audit log.'
    });
  }
};

/**
 * Expose Patient Audit Excel Export Endpoint (POST /api/hf-registry/export-audit-excel)
 */
const exportPatientAuditExcel = async (req, res) => {
  try {
    let logs = req.body?.logs;
    const patientName = req.body?.patientName || req.query?.patientName || '';
    const patientMr = req.body?.patientMr || req.query?.patientMr || '';
    const patientId = req.body?.patientId || req.query?.patientId || req.params?.regPatientId || '';
    const startDate = req.body?.startDate || req.query?.startDate || '';
    const endDate = req.body?.endDate || req.query?.endDate || '';
    const actionFilter = req.body?.actionFilter || req.query?.actionFilter || 'ALL';

    if (!logs || !Array.isArray(logs) || logs.length === 0) {
      const reg_patient_id = Number(patientId || req.params?.regPatientId);
      if (reg_patient_id && !isNaN(reg_patient_id)) {
        const query = `
          SELECT 
            s.audit_id, 
            s.registry_type,
            COALESCE(s.record_identifier, CAST(s.record_id AS VARCHAR(100))) AS record_identifier,
            s.patient_id AS reg_patient_id, 
            s.user_id AS username, 
            s.action_type, 
            s.changed_fields,
            s.previous_values,
            s.new_values,
            s.timestamp, 
            p.patient_name, 
            p.mr_no 
          FROM system_audit_log s
          LEFT JOIN patient_demographics p ON TRY_CAST(s.patient_id AS INT) = p.reg_patient_id 
          WHERE (s.patient_id = CAST(@regPatientId AS VARCHAR(100)) OR TRY_CAST(s.patient_id AS INT) = @regPatientId)

          UNION ALL

          SELECT 
            a.audit_id + 1000000 AS audit_id, 
            'HF' AS registry_type,
            CASE 
              WHEN hf.hf_registry_no IS NOT NULL AND hf.hf_registry_no <> '' THEN hf.hf_registry_no
              ELSE 'HF #' + CAST(a.hf_id AS VARCHAR(100))
            END AS record_identifier,
            p.reg_patient_id, 
            COALESCE(u.username, CAST(a.user_id AS VARCHAR(100))) AS username, 
            a.action_type, 
            a.changed_fields,
            a.previous_values,
            a.new_values, 
            a.timestamp, 
            p.patient_name, 
            p.mr_no 
          FROM hf_registry_audit a 
          LEFT JOIN users u ON (CAST(a.user_id AS VARCHAR(100)) = CAST(u.user_id AS VARCHAR(100)) OR u.username = CAST(a.user_id AS VARCHAR(100))) 
          LEFT JOIN hf_registry hf ON a.hf_id = hf.hf_id 
          LEFT JOIN patient_demographics p ON hf.reg_patient_id = p.reg_patient_id 
          WHERE p.reg_patient_id = @regPatientId
            AND NOT EXISTS (
              SELECT 1 FROM system_audit_log s 
              WHERE (s.patient_id = CAST(p.reg_patient_id AS VARCHAR(100)) OR TRY_CAST(s.patient_id AS INT) = p.reg_patient_id)
                AND s.registry_type = 'HF'
                AND s.timestamp BETWEEN DATEADD(second, -5, a.timestamp) AND DATEADD(second, 5, a.timestamp)
            )
          ORDER BY timestamp DESC;
        `;
        const { recordset: rows } = await db.query(query, { regPatientId: reg_patient_id });
        logs = rows.map(row => ({
          audit_id: row.audit_id,
          registry_type: row.registry_type || 'HF',
          record_identifier: row.record_identifier || '—',
          reg_patient_id: row.reg_patient_id,
          patient_name: row.patient_name,
          mr_no: row.mr_no,
          username: row.username || 'User',
          action_type: row.action_type,
          previous_values: row.previous_values,
          new_values: row.new_values,
          changed_fields: row.changed_fields || null,
          timestamp: row.timestamp
        }));

        if (startDate) {
          const start = new Date(startDate);
          start.setHours(0, 0, 0, 0);
          logs = logs.filter(l => new Date(String(l.timestamp).replace(' ', 'T')) >= start);
        }
        if (endDate) {
          const end = new Date(endDate);
          end.setHours(23, 59, 59, 999);
          logs = logs.filter(l => new Date(String(l.timestamp).replace(' ', 'T')) <= end);
        }
        if (actionFilter && actionFilter !== 'ALL') {
          logs = logs.filter(l => {
            const act = String(l.action_type || '').toUpperCase();
            if (actionFilter === 'CREATE') return act === 'CREATE' || act === 'CREATION';
            if (actionFilter === 'UPDATE') return act === 'UPDATE' || act === 'UPDATED';
            if (actionFilter === 'DELETE') return act === 'DELETE' || act === 'DELETION';
            if (actionFilter === 'RESTORE') return act === 'RESTORE' || act === 'RESTORED';
            return act === actionFilter;
          });
        }
      }
    }

    return await generateAuditExcel({
      logs: logs || [],
      patientName,
      patientMr,
      patientId: patientId || (logs && logs[0]?.reg_patient_id ? String(logs[0].reg_patient_id) : ''),
      startDate,
      endDate,
      actionFilter
    }, res);
  } catch (error) {
    console.error('Error generating audit excel report:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to generate Excel audit report.'
    });
  }
};

module.exports = {
  createRecord,
  updateRecord,
  deleteRecord,
  undeleteRecord,
  softDeleteRegistryRecord: deleteRecord,
  getAuditLog,
  getPatientAuditLog,
  exportPatientAuditExcel
};
