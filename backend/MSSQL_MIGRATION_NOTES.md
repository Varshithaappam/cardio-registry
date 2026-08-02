# SQL Server migration notes

## Changes made

- Replaced the MySQL pool with `mssql/msnodesqlv8`, a reusable Windows-integrated-authentication SQL Server pool, health check, transaction wrapper, and parameterized insert helper.
- Rewrote active database access in controllers, models, services, file routes, and audit logging to use named `@parameters`, `recordset`, `rowsAffected`, `OUTPUT INSERTED`, `TOP 1`, and `SYSDATETIME()`.
- Removed MySQL-only startup `ALTER TABLE` and data-update logic. The application never runs a migration at startup.
- Converted `migrations/init_audit_and_rbac.sql` to idempotent SQL Server T-SQL. It has **not** been executed.
- Added `.env.example` for SQL Server 2022 Express Windows authentication.

## Dependencies

- Added: `mssql`, `msnodesqlv8`
- Removed: `mysql2`

## Environment

```dotenv
DB_SERVER=LENOVO\SQLEXPRESS
DB_DATABASE=care
DB_AUTH_MODE=windows
DB_ODBC_DRIVER=ODBC Driver 18 for SQL Server
DB_ENCRYPT=false
DB_TRUST_SERVER_CERTIFICATE=true
PORT=5000
```

## Commands

```powershell
cd backend
npm install
npm start
```

## Local SQL Server Express prerequisite

The backend uses `msnodesqlv8` so it authenticates as the currently signed-in Windows user. The local instance must have a reachable protocol enabled. During this migration the `SQLEXPRESS` service was running, but TCP/IP and Named Pipes were disabled and SQL Server Browser was disabled, so the application could not reach `LENOVO\SQLEXPRESS` despite the driver being installed.

Enable TCP/IP for `SQLEXPRESS` in SQL Server Configuration Manager and restart the SQL Server service. Alternatively, enable SQL Server Browser for named-instance discovery. No database data or schema changes were performed while diagnosing this.

## Verification

- JavaScript syntax checks passed for all changed database modules.
- `SELECT 1 AS ok` health check is implemented but could not complete until the local SQL Server Express network protocol is enabled.
- Read/write API smoke tests were not run because connection establishment failed before any database query could execute.

## Temporary rollback

Use the previous MySQL-specific commit/backup and restore its MySQL environment variables plus `mysql2`; do not point that code at the SQL Server database.
