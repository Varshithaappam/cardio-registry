-- SQL Server 2022 idempotent reference migration.
-- This file is intentionally NOT executed by application startup.
USE [care];
GO

IF OBJECT_ID(N'dbo.roles', N'U') IS NULL
BEGIN
  CREATE TABLE dbo.roles (
    role_id INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
    role_name NVARCHAR(50) NOT NULL UNIQUE
  );
END;
GO

IF NOT EXISTS (SELECT 1 FROM dbo.roles WHERE role_name = N'ADMIN') INSERT INTO dbo.roles (role_name) VALUES (N'ADMIN');
IF NOT EXISTS (SELECT 1 FROM dbo.roles WHERE role_name = N'CLINICIAN') INSERT INTO dbo.roles (role_name) VALUES (N'CLINICIAN');
IF NOT EXISTS (SELECT 1 FROM dbo.roles WHERE role_name = N'DATA_ENTRY') INSERT INTO dbo.roles (role_name) VALUES (N'DATA_ENTRY');
GO

IF OBJECT_ID(N'dbo.users', N'U') IS NULL
BEGIN
  CREATE TABLE dbo.users (
    user_id INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
    username NVARCHAR(100) NOT NULL UNIQUE,
    email NVARCHAR(100) NOT NULL UNIQUE,
    password_hash NVARCHAR(255) NOT NULL,
    role_id INT NOT NULL,
    is_active BIT NOT NULL CONSTRAINT DF_users_is_active DEFAULT 1,
    created_at DATETIME2 NOT NULL CONSTRAINT DF_users_created_at DEFAULT SYSDATETIME(),
    CONSTRAINT FK_users_roles FOREIGN KEY (role_id) REFERENCES dbo.roles(role_id)
  );
END;
GO

IF COL_LENGTH(N'dbo.hf_registry', N'created_by') IS NULL ALTER TABLE dbo.hf_registry ADD created_by INT NULL;
IF COL_LENGTH(N'dbo.hf_registry', N'updated_by') IS NULL ALTER TABLE dbo.hf_registry ADD updated_by INT NULL;
GO

IF OBJECT_ID(N'dbo.hf_registry_audit', N'U') IS NULL
BEGIN
  CREATE TABLE dbo.hf_registry_audit (
    audit_id INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
    hf_id INT NOT NULL,
    user_id INT NOT NULL,
    action_type NVARCHAR(10) NOT NULL,
    previous_values NVARCHAR(MAX) NULL,
    new_values NVARCHAR(MAX) NULL,
    changed_fields NVARCHAR(MAX) NULL,
    [timestamp] DATETIME2 NOT NULL CONSTRAINT DF_hf_registry_audit_timestamp DEFAULT SYSDATETIME(),
    CONSTRAINT CK_hf_registry_audit_action_type CHECK (action_type IN (N'CREATE', N'UPDATE', N'DELETE')),
    CONSTRAINT FK_hf_registry_audit_registry FOREIGN KEY (hf_id) REFERENCES dbo.hf_registry(hf_id),
    CONSTRAINT FK_hf_registry_audit_users FOREIGN KEY (user_id) REFERENCES dbo.users(user_id)
  );
END;
GO

IF COL_LENGTH(N'dbo.hf_registry_audit', N'previous_values') IS NULL ALTER TABLE dbo.hf_registry_audit ADD previous_values NVARCHAR(MAX) NULL;
IF COL_LENGTH(N'dbo.hf_registry_audit', N'new_values') IS NULL ALTER TABLE dbo.hf_registry_audit ADD new_values NVARCHAR(MAX) NULL;
GO
