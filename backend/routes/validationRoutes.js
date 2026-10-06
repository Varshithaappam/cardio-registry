const express = require('express');
const router = express.Router();
const db = require('../config/db');
const sql = require('mssql');

/**
 * Strict whitelist mapping allowed tables, their physical table names,
 * allowed unique columns, and primary key for edit-mode exclusion.
 */
const ALLOWED_TARGETS = {
  // Patient Registry / Demographics
  patient_registry: {
    actualTable: 'patient_demographics',
    idColumn: 'reg_patient_id',
    columns: ['mr_no', 'uhid', 'abha_number', 'aadhaar_number', 'phone_no', 'ip_no']
  },
  patient_demographics: {
    actualTable: 'patient_demographics',
    idColumn: 'reg_patient_id',
    columns: ['mr_no', 'uhid', 'abha_number', 'aadhaar_number', 'phone_no', 'ip_no']
  },
  // STEMI Registry
  stemi_registry: {
    actualTable: 'stemi_registry',
    idColumn: 'stemi_id',
    hasSoftDelete: true,
    columns: ['ip_no', 'acs_no']
  },
  // NSTEMI Registry
  nstemi_registry: {
    actualTable: 'nstemi_registry',
    idColumn: 'nstemi_id',
    hasSoftDelete: true,
    columns: ['ip_no', 'acs_no']
  },
  // Heart Failure Registry & Administrative
  hf_registry: {
    actualTable: 'hf_registry',
    idColumn: 'hf_id',
    hasSoftDelete: true,
    columns: ['hf_registry_no', 'visit_id'] // supports visit_id alias directed to hf_administrative if needed
  },
  hf_administrative: {
    actualTable: 'hf_administrative',
    idColumn: 'hf_id',
    columns: ['visit_id', 'care_mr_no']
  }
};

/**
 * GET /api/check-unique
 * Query Parameters:
 *  - table: string (e.g. 'patient_registry', 'stemi_registry', 'hf_administrative')
 *  - column: string (e.g. 'mr_no', 'uhid', 'abha_number', 'ip_no', 'visit_id')
 *  - value: string (the identifier value entered by user)
 *  - excludeId: optional number/string (current record ID to exclude during updates)
 *
 * Returns:
 *  { success: true, isUnique: true | false, table, column }
 */
router.get('/check-unique', async (req, res) => {
  try {
    const { table, column, value, excludeId } = req.query;

    if (!table || !column) {
      return res.status(400).json({
        success: false,
        message: "Query parameters 'table' and 'column' are required."
      });
    }

    const cleanValue = typeof value === 'string' ? value.trim() : '';

    // An empty or undefined field is treated as unique (form required checks handle blank values)
    if (!cleanValue) {
      return res.status(200).json({
        success: true,
        isUnique: true
      });
    }

    const tableKey = String(table).toLowerCase().trim();
    let colKey = String(column).toLowerCase().trim();

    // Map 'visit_id' on 'hf_registry' to 'hf_administrative' table if specified
    let targetConfig = ALLOWED_TARGETS[tableKey];
    if (tableKey === 'hf_registry' && colKey === 'visit_id') {
      targetConfig = ALLOWED_TARGETS['hf_administrative'];
    }

    if (!targetConfig) {
      return res.status(400).json({
        success: false,
        message: `Validation target table '${table}' is not permitted.`
      });
    }

    if (!targetConfig.columns.includes(colKey)) {
      return res.status(400).json({
        success: false,
        message: `Validation column '${column}' is not permitted for table '${table}'.`
      });
    }

    const actualTable = targetConfig.actualTable;
    const actualCol = colKey;
    const idCol = targetConfig.idColumn;

    const pool = await db.getPool();
    const request = pool.request();

    request.input('val', sql.NVarChar, cleanValue);

    let sqlQuery = `
      SELECT TOP 1 1 AS [exists]
      FROM [dbo].[${actualTable}] WITH (NOLOCK)
      WHERE 
    `;

    // Special handling for ABHA number to handle hyphenated vs unhyphenated format
    if (actualCol === 'abha_number') {
      const digitsOnly = cleanValue.replace(/\D/g, '');
      if (digitsOnly.length === 14) {
        request.input('valDigits', sql.NVarChar, digitsOnly);
        sqlQuery += `([abha_number] = @val OR REPLACE([abha_number], '-', '') = @valDigits)`;
      } else {
        sqlQuery += `[${actualCol}] = @val`;
      }
    } else {
      sqlQuery += `[${actualCol}] = @val`;
    }

    // Filter out soft-deleted records if applicable
    if (targetConfig.hasSoftDelete) {
      sqlQuery += ` AND ([is_deleted] = 0 OR [is_deleted] IS NULL)`;
    }

    // Exclude current record ID when editing an existing record
    if (excludeId !== undefined && excludeId !== null && String(excludeId).trim() !== '' && !isNaN(excludeId)) {
      request.input('excludeId', sql.Int, parseInt(excludeId, 10));
      sqlQuery += ` AND [${idCol}] != @excludeId`;
    }

    const result = await request.query(sqlQuery);
    const isUnique = !result.recordset || result.recordset.length === 0;

    return res.status(200).json({
      success: true,
      isUnique,
      table,
      column: actualCol
    });
  } catch (error) {
    console.error('Error executing /api/check-unique query:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to check field uniqueness.'
    });
  }
});

module.exports = router;
