const db = require('../config/db');
const { logAudit } = require('../utils/auditLogger');

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

    const patient_id = req.body.patientId || req.body.patient_id;
    if (!patient_id) {
      await conn.rollback();
      conn.release();
      return res.status(400).json({ success: false, message: 'Patient ID is required.' });
    }

    // 1. Insert hf_registry with placeholder hf_registry_no and created_by / updated_by
    const initialStatus = req.body.status || 'draft';
    const result = await db.insert(conn, 'hf_registry', {
      patient_id,
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
    await logAudit(newRecordId, userId, 'CREATE', null, req.body);

    return res.status(201).json({
      success: true,
      message: 'HF Registry record created successfully.',
      data: {
        hf_id: newRecordId,
        hf_registry_no,
        patient_id,
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
    await logAudit(recordId, userId, 'UPDATE', previousData, updatedData);

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

    // 3. Execute non-blocking logAudit entry with action_type = 'DELETE' capturing soft-deleted state
    logAudit(recordId, userId, 'DELETE', previousData, softDeletedData).catch(err => {
      console.error('Audit Logging Error on soft delete:', err);
    });

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
 * Expose Patient Audit Logs Endpoint (GET /api/hf-registry/patient/:patientId/audit)
 * Queries all hf_registry_audit records for a given patient_id across all registries.
 */
const getPatientAuditLog = async (req, res) => {
  const patient_id = Number(req.params.patientId || req.params.id);

  if (!patient_id || isNaN(patient_id)) {
    return res.status(400).json({ success: false, message: 'Invalid Patient ID.' });
  }

  try {
    const query = `
      SELECT 
        a.audit_id, 
        a.hf_id, 
        a.action_type, 
        a.changed_fields,
        a.previous_values,
        a.new_values, 
        a.timestamp, 
        u.username, 
        u.email, 
        p.patient_id, 
        p.patient_name, 
        p.mr_no 
      FROM hf_registry_audit a 
      JOIN users u ON a.user_id = u.user_id 
      JOIN hf_registry hf ON a.hf_id = hf.hf_id 
      JOIN patients p ON hf.patient_id = p.patient_id 
      WHERE p.patient_id = @patientId
      ORDER BY a.timestamp DESC;
    `;
    const { recordset: rows } = await db.query(query, { patientId: patient_id });

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
        patient_id: row.patient_id,
        patient_name: row.patient_name,
        mr_no: row.mr_no,
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
    console.error('Error fetching patient audit history:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to retrieve patient audit history.'
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
    // Attempt by patient_id first to get all patient records
    const patientQuery = `
      SELECT 
        a.audit_id, 
        a.hf_id, 
        a.action_type, 
        a.changed_fields,
        a.previous_values,
        a.new_values, 
        a.timestamp, 
        u.username, 
        u.email, 
        p.patient_id, 
        p.patient_name, 
        p.mr_no 
      FROM hf_registry_audit a 
      JOIN users u ON a.user_id = u.user_id 
      JOIN hf_registry hf ON a.hf_id = hf.hf_id 
      JOIN patients p ON hf.patient_id = p.patient_id 
      WHERE p.patient_id = @targetId
      ORDER BY a.timestamp DESC;
    `;
    let { recordset: rows } = await db.query(patientQuery, { targetId });

    // Fallback by hf_id if no rows found by patient_id
    if (rows.length === 0) {
      const hfQuery = `
        SELECT a.*, u.username, u.email
        FROM hf_registry_audit a
        JOIN users u ON a.user_id = u.user_id
        WHERE a.hf_id = @targetId
        ORDER BY a.timestamp DESC
      `;
      const { recordset: hfRows } = await db.query(hfQuery, { targetId });
      rows = hfRows;
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

module.exports = {
  createRecord,
  updateRecord,
  deleteRecord,
  softDeleteRegistryRecord: deleteRecord,
  getAuditLog,
  getPatientAuditLog
};
