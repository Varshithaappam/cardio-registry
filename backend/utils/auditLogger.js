const db = require('../config/db');

/**
 * Logs clinical actions to the audit table (hf_registry_audit).
 * Ensures foreign key constraints (fk_audit_hf_registry, fk_audit_users) are satisfied.
 */
const logAudit = async (hfId, userId, action, previousData = null, newData = null) => {
  try {
    if (!hfId || isNaN(Number(hfId))) {
      console.warn(`[AuditLogger] Skipped logging: Invalid hf_id (${hfId})`);
      return;
    }

    const targetHfId = Number(hfId);

    // 1. Verify targetHfId exists in hf_registry table
    const [hfRows] = await db.execute('SELECT hf_id FROM hf_registry WHERE hf_id = ?', [targetHfId]);
    if (hfRows.length === 0) {
      console.warn(`[AuditLogger] Skipped logging: hf_id ${targetHfId} does not exist in hf_registry.`);
      return;
    }

    // 2. Verify and resolve valid user_id to satisfy fk_audit_users constraint
    let validUserId = userId ? Number(userId) : null;
    if (validUserId && !isNaN(validUserId)) {
      const [userRows] = await db.execute('SELECT user_id FROM users WHERE user_id = ?', [validUserId]);
      if (userRows.length === 0) {
        validUserId = null;
      }
    }

    if (!validUserId) {
      const [firstUserRows] = await db.execute('SELECT user_id FROM users ORDER BY user_id ASC LIMIT 1');
      if (firstUserRows.length > 0) {
        validUserId = firstUserRows[0].user_id;
      } else {
        console.warn('[AuditLogger] Skipped logging: No valid user accounts found in users table.');
        return;
      }
    }

    const prevStr = previousData ? (typeof previousData === 'object' ? JSON.stringify(previousData) : String(previousData)) : null;
    const newStr = newData ? (typeof newData === 'object' ? JSON.stringify(newData) : String(newData)) : null;
    const changedPayload = JSON.stringify({ previous: previousData, new: newData });

    // 3. Insert into hf_registry_audit
    try {
      const queryWithValues = `
        INSERT INTO hf_registry_audit (hf_id, user_id, action_type, previous_values, new_values, changed_fields, timestamp)
        VALUES (?, ?, ?, ?, ?, ?, NOW())
      `;
      await db.execute(queryWithValues, [targetHfId, validUserId, action, prevStr, newStr, changedPayload]);
    } catch (colErr) {
      const queryFallback = `
        INSERT INTO hf_registry_audit (hf_id, user_id, action_type, changed_fields, timestamp)
        VALUES (?, ?, ?, ?, NOW())
      `;
      await db.execute(queryFallback, [targetHfId, validUserId, action, changedPayload]);
    }

    console.log(`[AuditLogger] ✅ Logged ${action} for hf_id #${targetHfId} by user_id #${validUserId}`);
  } catch (error) {
    console.error('[AuditLogger] ❌ Error writing audit log:', error);
  }
};

const logRegistryAction = async (dbConnection, { hf_id, user_id, action_type, changed_fields }) => {
  const targetDb = (dbConnection && typeof dbConnection.execute === 'function') ? dbConnection : db;
  try {
    const targetHfId = Number(hf_id);
    let validUserId = user_id ? Number(user_id) : 1;

    const details = typeof changed_fields === 'object' ? JSON.stringify(changed_fields) : String(changed_fields);

    try {
      const queryWithValues = `
        INSERT INTO hf_registry_audit (hf_id, user_id, action_type, new_values, changed_fields, timestamp)
        VALUES (?, ?, ?, ?, ?, NOW())
      `;
      await targetDb.execute(queryWithValues, [targetHfId, validUserId, action_type, details, details]);
    } catch {
      const queryFallback = `
        INSERT INTO hf_registry_audit (hf_id, user_id, action_type, changed_fields, timestamp)
        VALUES (?, ?, ?, ?, NOW())
      `;
      await targetDb.execute(queryFallback, [targetHfId, validUserId, action_type, details]);
    }
  } catch (error) {
    console.error('[AuditLogger] ❌ Error writing audit log:', error);
  }
};

module.exports = {
  logAudit,
  logRegistryAction
};
