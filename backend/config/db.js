const sql = require('mssql/msnodesqlv8');
require('dotenv').config();

const authMode = (process.env.DB_AUTH_MODE || 'windows').toLowerCase();
const configuredServer = process.env.DB_SERVER;
const database = process.env.DB_DATABASE || 'care';

if (!configuredServer) {
  throw new Error('DB_SERVER is required for the SQL Server connection.');
}

const [server, instanceName] = configuredServer.split('\\', 2);

const config = {
  server,
  database,
  driver: authMode === 'windows' ? (process.env.DB_ODBC_DRIVER || 'ODBC Driver 18 for SQL Server') : undefined,
  pool: { max: 10, min: 0, idleTimeoutMillis: 30000 },
  options: {
    trustedConnection: authMode === 'windows',
    encrypt: process.env.DB_ENCRYPT === 'true',
    trustServerCertificate: process.env.DB_TRUST_SERVER_CERTIFICATE !== 'false',
    instanceName: instanceName || undefined
  }
};

if (authMode !== 'windows') {
  config.user = process.env.DB_USER;
  config.password = process.env.DB_PASSWORD;
}

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
  Object.entries(parameters).forEach(([name, value]) => {
    if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(name)) {
      throw new Error(`Invalid SQL parameter name: ${name}`);
    }
    request.input(name, value === undefined ? null : value);
  });
  return request;
}

async function query(statement, parameters = {}, transaction) {
  const pool = transaction ? null : await getPool();
  const request = transaction ? new sql.Request(transaction) : pool.request();
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

async function healthCheck() {
  try {
    const result = await query('SELECT 1 AS ok;');
    if (result.recordset?.[0]?.ok !== 1) throw new Error('SQL Server health check returned an unexpected result.');
    console.log('✅ SQL Server Database Connected Successfully');
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

module.exports = { sql, getPool, getConnection, query, insert, healthCheck };
