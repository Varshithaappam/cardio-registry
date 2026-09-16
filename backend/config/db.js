// const sql = require('mssql/msnodesqlv8');
// require('dotenv').config();

// const authMode = (process.env.DB_AUTH_MODE || 'windows').toLowerCase();
// const configuredServer = process.env.DB_SERVER;
// const database = process.env.DB_DATABASE || 'care';

// if (!configuredServer) {
//   throw new Error('DB_SERVER is required for the SQL Server connection.');
// }

// const [server, instanceName] = configuredServer.split('\\', 2);

// const config = {
//   server,
//   database,
//   driver: authMode === 'windows' ? (process.env.DB_ODBC_DRIVER || 'ODBC Driver 18 for SQL Server') : undefined,
//   pool: { max: 10, min: 0, idleTimeoutMillis: 30000 },
//   options: {
//     trustedConnection: authMode === 'windows',
//     encrypt: process.env.DB_ENCRYPT === 'true',
//     trustServerCertificate: process.env.DB_TRUST_SERVER_CERTIFICATE !== 'false',
//     instanceName: instanceName || undefined
//   }
// };

// if (authMode !== 'windows') {
//   config.user = process.env.DB_USER;
//   config.password = process.env.DB_PASSWORD;
// }

// let poolPromise;

// function getPool() {
//   if (!poolPromise) {
//     poolPromise = new sql.ConnectionPool(config).connect().catch((error) => {
//       poolPromise = undefined;
//       throw error;
//     });
//   }
//   return poolPromise;
// }

// function quoteIdentifier(identifier) {
//   if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(identifier)) {
//     throw new Error(`Invalid SQL identifier: ${identifier}`);
//   }
//   return `[${identifier}]`;
// }

// function addParameters(request, parameters = {}) {
//   Object.entries(parameters).forEach(([name, value]) => {
//     if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(name)) {
//       throw new Error(`Invalid SQL parameter name: ${name}`);
//     }
//     request.input(name, value === undefined ? null : value);
//   });
//   return request;
// }

// async function query(statement, parameters = {}, transaction) {
//   const pool = transaction ? null : await getPool();
//   const request = transaction ? new sql.Request(transaction) : pool.request();
//   return addParameters(request, parameters).query(statement);
// }

// async function insert(connection, table, data, identityColumn) {
//   const keys = Object.keys(data);
//   if (keys.length === 0) throw new Error(`Cannot insert an empty row into ${table}.`);

//   const fields = keys.map(quoteIdentifier).join(', ');
//   const values = keys.map((key) => `@${key}`).join(', ');
//   const output = identityColumn ? ` OUTPUT INSERTED.${quoteIdentifier(identityColumn)}` : '';
//   const parameters = Object.fromEntries(keys.map((key) => [key, data[key] === undefined ? null : data[key]]));
//   const statement = `INSERT INTO ${quoteIdentifier(table)} (${fields})${output} VALUES (${values});`;
//   return connection?.query ? connection.query(statement, parameters) : query(statement, parameters);
// }

// async function getConnection() {
//   const transaction = new sql.Transaction(await getPool());
//   let started = false;

//   return {
//     async begin() {
//       await transaction.begin(sql.ISOLATION_LEVEL.READ_COMMITTED);
//       started = true;
//     },
//     query(statement, parameters = {}) {
//       return query(statement, parameters, started ? transaction : undefined);
//     },
//     async commit() {
//       if (started) {
//         await transaction.commit();
//         started = false;
//       }
//     },
//     async rollback() {
//       if (started) {
//         await transaction.rollback();
//         started = false;
//       }
//     },
//     release() {}
//   };
// }

// async function healthCheck() {
//   try {
//     const result = await query('SELECT 1 AS ok;');
//     if (result.recordset?.[0]?.ok !== 1) throw new Error('SQL Server health check returned an unexpected result.');
//     console.log('✅ SQL Server Database Connected Successfully');
//     return result.recordset[0];
//   } catch (error) {
//     console.error('❌ SQL Server Connection Failed');
//     console.error(`Server: ${configuredServer}`);
//     console.error(`Database: ${database}`);
//     console.error(`Authentication mode: ${authMode}`);
//     console.error(`Reason: ${error.message}`);
//     throw error;
//   }
// }

// module.exports = { sql, getPool, getConnection, query, insert, healthCheck };

const sql = require('mssql');
require('dotenv').config();

const authMode = (process.env.DB_AUTH_MODE || 'sql').toLowerCase();
const configuredServer = process.env.DB_SERVER || 'localhost';
const database = process.env.DB_DATABASE || 'care';

const [server, instanceName] = configuredServer.split('\\', 2);

const config = {
  server,
  database,
  user: process.env.DB_USER || 'dbuser',
  password: process.env.DB_PASSWORD || 'Admin123!',
  requestTimeout: 60000, // <-- Add this line here
  pool: { max: 100, min: 0, idleTimeoutMillis: 30000 },
  options: {
    trustedConnection: authMode === 'windows',
    encrypt: process.env.DB_ENCRYPT === 'true',
    trustServerCertificate: process.env.DB_TRUST_SERVER_CERTIFICATE !== 'false',
    instanceName: instanceName || undefined,
    enableArithAbort: true
  }
};

let poolPromise;

function getPool() {
  if (!poolPromise) {
    poolPromise = new sql.ConnectionPool(config).connect().catch((error) => {
      poolPromise = undefined;
      throw error;
    });
  }
  return poolPromise;
}

function quoteIdentifier(identifier) {
  if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(identifier)) {
    throw new Error(`Invalid SQL identifier: ${identifier}`);
  }
  return `[${identifier}]`;
}

function addParameters(request, parameters = {}) {
  if (Array.isArray(parameters)) {
    parameters.forEach((param, index) => {
      request.input(`param${index}`, param === undefined ? null : param);
    });
  } else if (parameters && typeof parameters === 'object') {
    Object.entries(parameters).forEach(([name, value]) => {
      if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(name)) {
        throw new Error(`Invalid SQL parameter name: ${name}`);
      }
      request.input(name, value === undefined ? null : value);
    });
  } else if (parameters !== undefined && parameters !== null) {
    request.input('param0', parameters);
  }
  return request;
}

async function query(statement, parameters = {}, transaction) {
  const pool = transaction ? null : await getPool();
  const request = transaction ? new sql.Request(transaction) : pool.request();
  
  // Auto-detect named parameters if statement has @keys but an unmapped primitive or object was passed
  if (typeof parameters !== 'object' || parameters === null || Array.isArray(parameters)) {
    const matches = statement.match(/@([a-zA-Z0-9_]+)/g);
    if (matches && matches.length > 0 && (parameters === undefined || parameters === null || typeof parameters !== 'object')) {
      const paramName = matches[0].substring(1);
      request.input(paramName, parameters);
      return request.query(statement);
    }
  }

  return addParameters(request, parameters).query(statement);
}

async function insert(connection, table, data, identityColumn) {
  const keys = Object.keys(data);
  if (keys.length === 0) throw new Error(`Cannot insert an empty row into ${table}.`);

  const fields = keys.map(quoteIdentifier).join(', ');
  const values = keys.map((key) => `@${key}`).join(', ');
  const output = identityColumn ? ` OUTPUT INSERTED.${quoteIdentifier(identityColumn)}` : '';
  const parameters = Object.fromEntries(keys.map((key) => [key, data[key] === undefined ? null : data[key]]));
  const statement = `INSERT INTO ${quoteIdentifier(table)} (${fields})${output} VALUES (${values});`;
  return connection?.query ? connection.query(statement, parameters) : query(statement, parameters);
}

async function getConnection() {
  const transaction = new sql.Transaction(await getPool());
  let started = false;

  return {
    async begin() {
      await transaction.begin(sql.ISOLATION_LEVEL.READ_COMMITTED);
      started = true;
    },
    query(statement, parameters = {}) {
      return query(statement, parameters, started ? transaction : undefined);
    },
    async commit() {
      if (started) {
        await transaction.commit();
        started = false;
      }
    },
    async rollback() {
      if (started) {
        await transaction.rollback();
        started = false;
      }
    },
    release() {}
  };
}

async function ensureAppropriatenessColumns() {
  try {
    const tables = ['stemi_appropriateness', 'nstemi_appropriateness'];
    const columns = [
      'iccu_admission_note', 'iccu_transfer_out_note', 'tlt_note', 'ptca_note',
      'invasive_monitoring_note', 'iabp_note', 'invasive_ventilation_note', 'dialysis_note',
      'any_other_procedure_note', 'cardiac_enzymes_note', 'bnp_note', 'crp_note',
      'lipid_profile_note', 'bed_side_echo_note', 'cxr_note', 'beta_blockers_note',
      'aspirin_note', 'clopidogrel_note', 'ace_inhibitor_note', 'arb_note',
      'statin_note', 'diuretic_note', 'lanoxin_note', 'anticoagulant_note',
      'amiodarone_note', 'any_other_drug_note'
    ];

    for (const table of tables) {
      const checkTbl = await query(`SELECT OBJECT_ID(N'dbo.[${table}]') AS id;`);
      if (checkTbl.recordset?.[0]?.id) {
        for (const col of columns) {
          const checkCol = await query(
            `SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'dbo.[${table}]') AND name = '${col}'`
          );
          if (!checkCol.recordset || checkCol.recordset.length === 0) {
            try {
              await query(`ALTER TABLE dbo.[${table}] ADD [${col}] NVARCHAR(255) NULL;`);
              console.log(`✓ Auto-added column [${col}] to dbo.[${table}]`);
            } catch (err) {
              console.warn(`Could not add column [${col}] to dbo.[${table}]:`, err.message);
            }
          }
        }
      }
    }
  } catch (err) {
    console.warn('Auto column check notice:', err.message);
  }
}
async function ensureAuditTable() {
  try {
    const checkTableQuery = `
      IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'system_audit_log')
      BEGIN
        CREATE TABLE [dbo].[system_audit_log] (
          [audit_id] INT IDENTITY(1,1) PRIMARY KEY,
          [registry_type] VARCHAR(50) NOT NULL,
          [record_identifier] VARCHAR(100) NULL,
          [record_id] VARCHAR(100) NULL,
          [patient_id] VARCHAR(100) NULL,
          [user_id] VARCHAR(100) NULL,
          [action_type] VARCHAR(50) NOT NULL,
          [changed_fields] NVARCHAR(MAX) NULL,
          [previous_values] NVARCHAR(MAX) NULL,
          [new_values] NVARCHAR(MAX) NULL,
          [timestamp] DATETIME2 DEFAULT (SYSDATETIME())
        );
        PRINT 'Created table dbo.system_audit_log';
      END
      ELSE
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.system_audit_log') AND name = 'record_identifier')
          ALTER TABLE dbo.[system_audit_log] ADD [record_identifier] VARCHAR(100) NULL;
        IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.system_audit_log') AND name = 'record_id')
          ALTER TABLE dbo.[system_audit_log] ADD [record_id] VARCHAR(100) NULL;
        IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.system_audit_log') AND name = 'patient_id')
          ALTER TABLE dbo.[system_audit_log] ADD [patient_id] VARCHAR(100) NULL;
        IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.system_audit_log') AND name = 'previous_values')
          ALTER TABLE dbo.[system_audit_log] ADD [previous_values] NVARCHAR(MAX) NULL;
        IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.system_audit_log') AND name = 'new_values')
          ALTER TABLE dbo.[system_audit_log] ADD [new_values] NVARCHAR(MAX) NULL;
      END

      -- Force existing columns to VARCHAR on the remote server
      ALTER TABLE dbo.[system_audit_log] ALTER COLUMN [patient_id] VARCHAR(100) NULL;
      ALTER TABLE dbo.[system_audit_log] ALTER COLUMN [record_id] VARCHAR(100) NULL;
      ALTER TABLE dbo.[system_audit_log] ALTER COLUMN [record_identifier] VARCHAR(100) NULL;
      ALTER TABLE dbo.[system_audit_log] ALTER COLUMN [user_id] VARCHAR(100) NULL;
    `;
    await query(checkTableQuery);
    console.log('✓ Verified/Initialized [system_audit_log] database table');
  } catch (err) {
    console.warn('⚠️ system_audit_log table check notice:', err.message);
  }
}

async function healthCheck() {
  try {
    const result = await query('SELECT 1 AS ok;');
    if (result.recordset?.[0]?.ok !== 1) throw new Error('SQL Server health check returned an unexpected result.');
    console.log('✅ SQL Server Database Connected Successfully');
    await ensureAuditTable();
    await ensureAppropriatenessColumns();
    return result.recordset[0];
  } catch (error) {
    console.error('❌ SQL Server Connection Failed');
    console.error(`Server: ${configuredServer}`);
    console.error(`Database: ${database}`);
    console.error(`Authentication mode: ${authMode}`);
    console.error(`Reason: ${error.message}`);
    throw error;
  }
}

module.exports = { sql, getPool, getConnection, query, insert, healthCheck, ensureAppropriatenessColumns, ensureAuditTable };


