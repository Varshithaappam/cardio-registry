const db = require('../config/db');
const { sanitizeAuditPayload } = require('./logAuditTrail');

async function resolveAuditUserId(userId) {
  const requestedUserId = userId ? Number(userId) : null;
  if (requestedUserId && !Number.isNaN(requestedUserId) && requestedUserId !== 1) {
    const { recordset } = await db.query('SELECT [user_id] FROM [users] WHERE [user_id] = @userId;', { userId: requestedUserId });
    if (recordset.length > 0) return requestedUserId;
  }

  // Look up varshitha_appam (user_id 7) if requestedUserId is 1 or missing
  const { recordset: varshithaRows } = await db.query(`SELECT TOP 1 [user_id] FROM [users] WHERE [username] = 'varshitha_appam';`);
  if (varshithaRows.length > 0) return varshithaRows[0].user_id;

  if (requestedUserId && !Number.isNaN(requestedUserId)) {
    const { recordset } = await db.query('SELECT [user_id] FROM [users] WHERE [user_id] = @userId;', { userId: requestedUserId });
    if (recordset.length > 0) return requestedUserId;
  }

  const { recordset } = await db.query('SELECT TOP 1 [user_id] FROM [users] ORDER BY [user_id] ASC;');
  return recordset[0]?.user_id || null;
}

async function writeAudit(targetDb, values, includeSnapshots) {
  const snapshotColumns = includeSnapshots ? ', [previous_values], [new_values]' : '';
  const snapshotParameters = includeSnapshots ? ', @previousValues, @newValues' : '';
  return targetDb.query(`
    INSERT INTO [hf_registry_audit] ([hf_id], [user_id], [action_type], [changed_fields]${snapshotColumns}, [timestamp])
    VALUES (@hfId, @userId, @actionType, @changedFields${snapshotParameters}, SYSDATETIME());
  `, values);
}

const logAudit = async (hfId, userId, action, previousData = null, newData = null) => {
  try {
    const targetHfId = Number(hfId);
    if (!targetHfId || Number.isNaN(targetHfId)) return;

    const { recordset: hfRows } = await db.query('SELECT [hf_id] FROM [hf_registry] WHERE [hf_id] = @hfId;', { hfId: targetHfId });
    if (hfRows.length === 0) return;

    const validUserId = await resolveAuditUserId(userId);
    if (!validUserId) return;

    const safePreviousData = sanitizeAuditPayload(previousData);
    const safeNewData = sanitizeAuditPayload(newData);

    const values = {
      hfId: targetHfId,
      userId: validUserId,
      actionType: action,
      previousValues: safePreviousData ? JSON.stringify(safePreviousData) : null,
      newValues: safeNewData ? JSON.stringify(safeNewData) : null,
      changedFields: JSON.stringify({ previous: safePreviousData, new: safeNewData })
    };

    try {
      await writeAudit(db, values, true);
    } catch {
      await writeAudit(db, values, false);
    }
  } catch (error) {
    console.error('[AuditLogger] Error writing audit log:', error.message);
  }
};

const logRegistryAction = async (dbConnection, { hf_id, user_id, action_type, changed_fields }) => {
  const targetDb = dbConnection?.query ? dbConnection : db;
  const details = typeof changed_fields === 'object' ? JSON.stringify(changed_fields) : String(changed_fields);
  const values = {
    hfId: Number(hf_id),
    userId: Number(user_id) || 1,
    actionType: action_type,
    previousValues: null,
    newValues: details,
    changedFields: details
  };

  try {
    await writeAudit(targetDb, values, true);
  } catch (error) {
    console.error('[AuditLogger] Error writing audit log:', error.message);
  }
};

module.exports = { logAudit, logRegistryAction };
