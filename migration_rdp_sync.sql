-- ====================================================================================================
-- CLINICAL REGISTRY DATABASE MIGRATION SCRIPT (RDP SCHEMA SYNC)
-- ====================================================================================================
-- Description: Synchronizes target RDP database schema to match Local development truth schema.
-- Safety: 100% data-preserving, idempotent, and non-destructive DDL migration.
-- Generated for: Database [care]
--
-- EXECUTION ORDER:
--   SECTION 1: Pre-Flight Safety Checks & Table/Column Renames (sp_rename)
--   SECTION 2: Create Missing Tables (with PKs and Inline Unique Constraints)
--   SECTION 3: Column Additions & Type Modifications
--   SECTION 4: Default Constraints & Data Integrity Defaults
--   SECTION 5: Foreign Key Constraints Re-linking & Creation
--   SECTION 6: Performance & Search Indexes (Non-Clustered / Filtered)
--   SECTION 7: Production Stored Procedures (CREATE OR ALTER)
-- ====================================================================================================

USE [care];
GO

SET ANSI_NULLS ON;
GO
SET QUOTED_IDENTIFIER ON;
GO

PRINT '>>> STARTING RDP DATABASE SCHEMA MIGRATION...';
GO

-- ====================================================================================================
-- SECTION 1: TABLE AND COLUMN RENAMES (sp_rename)
-- ====================================================================================================
-- Safely renames legacy tables and primary/foreign key columns without dropping data or recreating tables.
-- ====================================================================================================

-- 1.1 Rename legacy table [dbo].[patients] -> [dbo].[patient_demographics]
IF OBJECT_ID(N'[dbo].[patients]', N'U') IS NOT NULL 
   AND OBJECT_ID(N'[dbo].[patient_demographics]', N'U') IS NULL
BEGIN
    PRINT '  [RENAME TABLE] Renaming [dbo].[patients] to [dbo].[patient_demographics]...';
    EXEC sp_rename 'dbo.patients', 'patient_demographics';
END
GO

-- 1.2 Rename [patient_id] -> [reg_patient_id] in [dbo].[patient_demographics]
IF OBJECT_ID(N'[dbo].[patient_demographics]', N'U') IS NOT NULL
   AND EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[patient_demographics]') AND name = 'patient_id')
   AND NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[patient_demographics]') AND name = 'reg_patient_id')
BEGIN
    PRINT '  [RENAME COLUMN] Renaming [patient_demographics].[patient_id] to [reg_patient_id]...';
    EXEC sp_rename 'dbo.patient_demographics.patient_id', 'reg_patient_id', 'COLUMN';
END
GO

-- 1.3 Rename [patient_id] -> [reg_patient_id] in [dbo].[hf_registry]
IF OBJECT_ID(N'[dbo].[hf_registry]', N'U') IS NOT NULL
   AND EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[hf_registry]') AND name = 'patient_id')
   AND NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[hf_registry]') AND name = 'reg_patient_id')
BEGIN
    PRINT '  [RENAME COLUMN] Renaming [hf_registry].[patient_id] to [reg_patient_id]...';
    EXEC sp_rename 'dbo.hf_registry.patient_id', 'reg_patient_id', 'COLUMN';
END
GO

-- 1.4 Rename [patient_id] -> [reg_patient_id] in [dbo].[nstemi_registry]
IF OBJECT_ID(N'[dbo].[nstemi_registry]', N'U') IS NOT NULL
   AND EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[nstemi_registry]') AND name = 'patient_id')
   AND NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[nstemi_registry]') AND name = 'reg_patient_id')
BEGIN
    PRINT '  [RENAME COLUMN] Renaming [nstemi_registry].[patient_id] to [reg_patient_id]...';
    EXEC sp_rename 'dbo.nstemi_registry.patient_id', 'reg_patient_id', 'COLUMN';
END
GO

-- 1.5 Rename [patient_id] -> [reg_patient_id] in [dbo].[stemi_registry]
IF OBJECT_ID(N'[dbo].[stemi_registry]', N'U') IS NOT NULL
   AND EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[stemi_registry]') AND name = 'patient_id')
   AND NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[stemi_registry]') AND name = 'reg_patient_id')
BEGIN
    PRINT '  [RENAME COLUMN] Renaming [stemi_registry].[patient_id] to [reg_patient_id]...';
    EXEC sp_rename 'dbo.stemi_registry.patient_id', 'reg_patient_id', 'COLUMN';
END
GO

-- 1.6 Rename [patient_id] -> [reg_patient_id] in [dbo].[cabg_registry]
IF OBJECT_ID(N'[dbo].[cabg_registry]', N'U') IS NOT NULL
   AND EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[cabg_registry]') AND name = 'patient_id')
   AND NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[cabg_registry]') AND name = 'reg_patient_id')
BEGIN
    PRINT '  [RENAME COLUMN] Renaming [cabg_registry].[patient_id] to [reg_patient_id]...';
    EXEC sp_rename 'dbo.cabg_registry.patient_id', 'reg_patient_id', 'COLUMN';
END
GO

-- 1.7 Rename [patient_id] -> [reg_patient_id] in [dbo].[hf_followup_assessments]
IF OBJECT_ID(N'[dbo].[hf_followup_assessments]', N'U') IS NOT NULL
   AND EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[hf_followup_assessments]') AND name = 'patient_id')
   AND NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[hf_followup_assessments]') AND name = 'reg_patient_id')
BEGIN
    PRINT '  [RENAME COLUMN] Renaming [hf_followup_assessments].[patient_id] to [reg_patient_id]...';
    EXEC sp_rename 'dbo.hf_followup_assessments.patient_id', 'reg_patient_id', 'COLUMN';
END
GO

-- 1.8 Rename [patient_id] -> [reg_patient_id] in [dbo].[patient_followup_tasks]
IF OBJECT_ID(N'[dbo].[patient_followup_tasks]', N'U') IS NOT NULL
   AND EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[patient_followup_tasks]') AND name = 'patient_id')
   AND NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[patient_followup_tasks]') AND name = 'reg_patient_id')
BEGIN
    PRINT '  [RENAME COLUMN] Renaming [patient_followup_tasks].[patient_id] to [reg_patient_id]...';
    EXEC sp_rename 'dbo.patient_followup_tasks.patient_id', 'reg_patient_id', 'COLUMN';
END
GO

-- 1.9 Rename [patient_id] -> [reg_patient_id] in [dbo].[nurse_outreach_logs]
IF OBJECT_ID(N'[dbo].[nurse_outreach_logs]', N'U') IS NOT NULL
   AND EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[nurse_outreach_logs]') AND name = 'patient_id')
   AND NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[nurse_outreach_logs]') AND name = 'reg_patient_id')
BEGIN
    PRINT '  [RENAME COLUMN] Renaming [nurse_outreach_logs].[patient_id] to [reg_patient_id]...';
    EXEC sp_rename 'dbo.nurse_outreach_logs.patient_id', 'reg_patient_id', 'COLUMN';
END
GO


-- ====================================================================================================
-- SECTION 2: CREATE MISSING TABLES
-- ====================================================================================================

-- 2.1 Table: [dbo].[mpi_scoring_config]
IF OBJECT_ID(N'[dbo].[mpi_scoring_config]', N'U') IS NULL
BEGIN
    PRINT '  [CREATE TABLE] Creating [dbo].[mpi_scoring_config]...';
    CREATE TABLE [dbo].[mpi_scoring_config](
        [config_id] [int] IDENTITY(1,1) NOT NULL,
        [config_type] [varchar](20) NOT NULL,
        [config_key] [varchar](50) NOT NULL,
        [config_value] [decimal](6, 2) NOT NULL,
        [description] [nvarchar](255) NULL,
        [is_active] [bit] NOT NULL CONSTRAINT [DF_mpi_scoring_config_is_active] DEFAULT ((1)),
        [created_at] [datetime2](7) NOT NULL CONSTRAINT [DF_mpi_scoring_config_created_at] DEFAULT (sysdatetime()),
        [updated_at] [datetime2](7) NOT NULL CONSTRAINT [DF_mpi_scoring_config_updated_at] DEFAULT (sysdatetime()),
        CONSTRAINT [PK_mpi_scoring_config] PRIMARY KEY CLUSTERED ([config_id] ASC),
        CONSTRAINT [UQ_mpi_scoring_config_key] UNIQUE NONCLUSTERED ([config_key] ASC)
    );
END
GO

-- 2.2 Table: [dbo].[patient_staging]
IF OBJECT_ID(N'[dbo].[patient_staging]', N'U') IS NULL
BEGIN
    PRINT '  [CREATE TABLE] Creating [dbo].[patient_staging]...';
    CREATE TABLE [dbo].[patient_staging](
        [staging_id] [int] IDENTITY(1,1) NOT NULL,
        [patient_name] [varchar](100) NOT NULL,
        [date_of_birth] [date] NULL,
        [gender] [varchar](10) NULL,
        [phone_no] [varchar](15) NULL,
        [uhid] [varchar](50) NULL,
        [abha_number] [varchar](50) NULL,
        [match_status] [varchar](20) NULL CONSTRAINT [DF_patient_staging_match_status] DEFAULT ('PENDING'),
        [final_action] [varchar](30) NULL,
        [resolved_patient_id] [int] NULL,
        [created_at] [datetime] NULL CONSTRAINT [DF_patient_staging_created_at] DEFAULT (getdate()),
        [updated_at] [datetime] NULL CONSTRAINT [DF_patient_staging_updated_at] DEFAULT (getdate()),
        [mr_no] [varchar](10) NULL,
        [email] [varchar](100) NULL,
        [address] [varchar](500) NULL,
        [pincode] [varchar](10) NULL,
        [raw_payload] [nvarchar](max) NULL,
        [created_by] [varchar](100) NULL,
        CONSTRAINT [PK_patient_staging] PRIMARY KEY CLUSTERED ([staging_id] ASC)
    );
END
GO

-- 2.3 Table: [dbo].[patient_identity_index]
IF OBJECT_ID(N'[dbo].[patient_identity_index]', N'U') IS NULL
BEGIN
    PRINT '  [CREATE TABLE] Creating [dbo].[patient_identity_index]...';
    CREATE TABLE [dbo].[patient_identity_index](
        [reg_patient_id] [int] NOT NULL,
        [normalized_name] [nvarchar](150) NOT NULL,
        [name_soundex]  AS (soundex([normalized_name])) PERSISTED,
        [normalized_phone] [varchar](30) NOT NULL,
        [phone_hash] [char](64) NOT NULL,
        [normalized_address] [nvarchar](500) NULL,
        [normalized_uhid] [varchar](50) NULL,
        [uhid_hash] [char](64) NULL,
        [normalized_abha] [varchar](50) NULL,
        [abha_hash] [char](64) NULL,
        [date_of_birth] [date] NOT NULL,
        [dob_year] [smallint] NOT NULL,
        [gender] [nvarchar](6) NOT NULL,
        [created_at] [datetime2](0) NOT NULL CONSTRAINT [DF_patient_identity_index_created_at] DEFAULT (sysdatetime()),
        [updated_at] [datetime2](0) NOT NULL CONSTRAINT [DF_patient_identity_index_updated_at] DEFAULT (sysdatetime()),
        [district] [nvarchar](100) NULL,
        [normalized_email] [varchar](320) NULL,
        [email_hash] [char](64) NULL,
        [name_phonetic] [varchar](50) NULL,
        [pincode] [varchar](10) NULL,
        CONSTRAINT [PK_patient_identity_index] PRIMARY KEY CLUSTERED ([reg_patient_id] ASC)
    );
END
GO

-- 2.4 Table: [dbo].[patient_match_audit]
IF OBJECT_ID(N'[dbo].[patient_match_audit]', N'U') IS NULL
BEGIN
    PRINT '  [CREATE TABLE] Creating [dbo].[patient_match_audit]...';
    CREATE TABLE [dbo].[patient_match_audit](
        [audit_id] [int] IDENTITY(1,1) NOT NULL,
        [reg_patient_id] [int] NULL,
        [candidate_patient_id] [int] NULL,
        [action] [varchar](50) NOT NULL,
        [decision] [varchar](50) NOT NULL,
        [overall_score] [decimal](5, 2) NULL,
        [field_scores] [nvarchar](max) NULL,
        [reasons] [nvarchar](max) NULL,
        [algorithm_version] [varchar](50) NOT NULL,
        [created_by] [varchar](100) NULL,
        [created_at] [datetime2](0) NOT NULL CONSTRAINT [DF_patient_match_audit_created_at] DEFAULT (sysdatetime()),
        [user_decision] [varchar](50) NULL,
        CONSTRAINT [PK_patient_match_audit] PRIMARY KEY CLUSTERED ([audit_id] ASC)
    );
END
GO

-- 2.5 Table: [dbo].[patient_merge_history]
IF OBJECT_ID(N'[dbo].[patient_merge_history]', N'U') IS NULL
BEGIN
    PRINT '  [CREATE TABLE] Creating [dbo].[patient_merge_history]...';
    CREATE TABLE [dbo].[patient_merge_history](
        [merge_id] [int] IDENTITY(1,1) NOT NULL,
        [surviving_patient_id] [int] NOT NULL,
        [retired_patient_id] [int] NOT NULL,
        [retired_mr_no] [varchar](20) NULL,
        [demographics_snapshot] [nvarchar](max) NULL,
        [moved_records_summary] [nvarchar](max) NULL,
        [merge_reason] [nvarchar](500) NULL,
        [merged_by] [varchar](100) NOT NULL,
        [merged_at] [datetime] NOT NULL CONSTRAINT [DF_patient_merge_history_merged_at] DEFAULT (getdate()),
        [is_unmerged] [bit] NOT NULL CONSTRAINT [DF_patient_merge_history_is_unmerged] DEFAULT ((0)),
        [unmerged_at] [datetime] NULL,
        [unmerged_by] [varchar](100) NULL,
        [unmerge_reason] [nvarchar](500) NULL,
        [interim_triage_summary] [nvarchar](max) NULL,
        CONSTRAINT [PK_patient_merge_history] PRIMARY KEY CLUSTERED ([merge_id] ASC)
    );
END
GO

-- 2.6 Table: [dbo].[visit_master]
IF OBJECT_ID(N'[dbo].[visit_master]', N'U') IS NULL
BEGIN
    PRINT '  [CREATE TABLE] Creating [dbo].[visit_master]...';
    CREATE TABLE [dbo].[visit_master](
        [visit_id] [int] IDENTITY(1,1) NOT NULL,
        [visit_code] [varchar](10) NOT NULL,
        [visit_name] [varchar](50) NOT NULL,
        [description] [varchar](255) NULL,
        [is_active] [bit] NULL CONSTRAINT [DF_visit_master_is_active] DEFAULT ((1)),
        CONSTRAINT [PK_visit_master] PRIMARY KEY CLUSTERED ([visit_id] ASC),
        CONSTRAINT [UQ_visit_master_code] UNIQUE NONCLUSTERED ([visit_code] ASC)
    );
END
GO


-- ====================================================================================================
-- SECTION 3: COLUMN ADDITIONS AND DATA TYPE MODIFICATIONS
-- ====================================================================================================

-- 3.1 Columns in [dbo].[patient_demographics]
IF OBJECT_ID(N'[dbo].[patient_demographics]', N'U') IS NOT NULL
BEGIN
    IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[patient_demographics]') AND name = 'uhid')
    BEGIN
        ALTER TABLE [dbo].[patient_demographics] ADD [uhid] [varchar](50) NULL;
        PRINT '  [ADD COLUMN] Added [uhid] to [patient_demographics].';
    END

    IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[patient_demographics]') AND name = 'abha_number')
    BEGIN
        ALTER TABLE [dbo].[patient_demographics] ADD [abha_number] [varchar](50) NULL;
        PRINT '  [ADD COLUMN] Added [abha_number] to [patient_demographics].';
    END

    IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[patient_demographics]') AND name = 'house_flat_no')
    BEGIN
        ALTER TABLE [dbo].[patient_demographics] ADD [house_flat_no] [nvarchar](100) NULL;
        PRINT '  [ADD COLUMN] Added [house_flat_no] to [patient_demographics].';
    END

    IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[patient_demographics]') AND name = 'street_locality')
    BEGIN
        ALTER TABLE [dbo].[patient_demographics] ADD [street_locality] [nvarchar](255) NULL;
        PRINT '  [ADD COLUMN] Added [street_locality] to [patient_demographics].';
    END

    IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[patient_demographics]') AND name = 'village_town')
    BEGIN
        ALTER TABLE [dbo].[patient_demographics] ADD [village_town] [nvarchar](150) NULL;
        PRINT '  [ADD COLUMN] Added [village_town] to [patient_demographics].';
    END

    IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[patient_demographics]') AND name = 'mandal')
    BEGIN
        ALTER TABLE [dbo].[patient_demographics] ADD [mandal] [nvarchar](100) NULL;
        PRINT '  [ADD COLUMN] Added [mandal] to [patient_demographics].';
    END

    IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[patient_demographics]') AND name = 'district')
    BEGIN
        ALTER TABLE [dbo].[patient_demographics] ADD [district] [nvarchar](100) NULL;
        PRINT '  [ADD COLUMN] Added [district] to [patient_demographics].';
    END

    IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[patient_demographics]') AND name = 'state')
    BEGIN
        ALTER TABLE [dbo].[patient_demographics] ADD [state] [nvarchar](100) NULL;
        PRINT '  [ADD COLUMN] Added [state] to [patient_demographics].';
    END

    IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[patient_demographics]') AND name = 'pincode')
    BEGIN
        ALTER TABLE [dbo].[patient_demographics] ADD [pincode] [varchar](10) NULL;
        PRINT '  [ADD COLUMN] Added [pincode] to [patient_demographics].';
    END

    IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[patient_demographics]') AND name = 'patient_status')
    BEGIN
        ALTER TABLE [dbo].[patient_demographics] ADD [patient_status] [varchar](20) NOT NULL CONSTRAINT [DF_patient_demographics_status] DEFAULT ('ACTIVE');
        PRINT '  [ADD COLUMN] Added [patient_status] to [patient_demographics].';
    END

    IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[patient_demographics]') AND name = 'merged_into_patient_id')
    BEGIN
        ALTER TABLE [dbo].[patient_demographics] ADD [merged_into_patient_id] [int] NULL;
        PRINT '  [ADD COLUMN] Added [merged_into_patient_id] to [patient_demographics].';
    END
END
GO

-- 3.2 Columns in [dbo].[hf_administrative]
IF OBJECT_ID(N'[dbo].[hf_administrative]', N'U') IS NOT NULL
BEGIN
    IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[hf_administrative]') AND name = 'visit_id')
    BEGIN
        ALTER TABLE [dbo].[hf_administrative] ADD [visit_id] [varchar](20) NULL;
        PRINT '  [ADD COLUMN] Added [visit_id] to [hf_administrative].';
    END
END
GO

-- 3.3 Columns in [dbo].[nstemi_followup]
IF OBJECT_ID(N'[dbo].[nstemi_followup]', N'U') IS NOT NULL
BEGIN
    IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[nstemi_followup]') AND name = 'visit_mode')
    BEGIN
        ALTER TABLE [dbo].[nstemi_followup] ADD [visit_mode] [varchar](50) NULL;
        PRINT '  [ADD COLUMN] Added [visit_mode] to [nstemi_followup].';
    END

    IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[nstemi_followup]') AND name = 'special_instructions')
    BEGIN
        ALTER TABLE [dbo].[nstemi_followup] ADD [special_instructions] [nvarchar](500) NULL;
        PRINT '  [ADD COLUMN] Added [special_instructions] to [nstemi_followup].';
    END
END
GO

-- 3.4 Columns in [dbo].[nstemi_registry]
IF OBJECT_ID(N'[dbo].[nstemi_registry]', N'U') IS NOT NULL
BEGIN
    IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[nstemi_registry]') AND name = 'status')
    BEGIN
        ALTER TABLE [dbo].[nstemi_registry] ADD [status] [int] NULL;
        PRINT '  [ADD COLUMN] Added [status] to [nstemi_registry].';
    END

    IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[nstemi_registry]') AND name = 'is_deleted')
    BEGIN
        ALTER TABLE [dbo].[nstemi_registry] ADD [is_deleted] [bit] NOT NULL CONSTRAINT [DF_nstemi_registry_is_deleted] DEFAULT ((0));
        PRINT '  [ADD COLUMN] Added [is_deleted] to [nstemi_registry].';
    END

    IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[nstemi_registry]') AND name = 'deleted_at')
    BEGIN
        ALTER TABLE [dbo].[nstemi_registry] ADD [deleted_at] [datetime2](7) NULL;
        PRINT '  [ADD COLUMN] Added [deleted_at] to [nstemi_registry].';
    END

    IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[nstemi_registry]') AND name = 'deleted_by')
    BEGIN
        ALTER TABLE [dbo].[nstemi_registry] ADD [deleted_by] [int] NULL;
        PRINT '  [ADD COLUMN] Added [deleted_by] to [nstemi_registry].';
    END
END
GO

-- 3.5 Columns in [dbo].[nurse_outreach_logs]
IF OBJECT_ID(N'[dbo].[nurse_outreach_logs]', N'U') IS NOT NULL
BEGIN
    IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[nurse_outreach_logs]') AND name = 'nstemi_followup_id')
    BEGIN
        ALTER TABLE [dbo].[nurse_outreach_logs] ADD [nstemi_followup_id] [int] NULL;
        PRINT '  [ADD COLUMN] Added [nstemi_followup_id] to [nurse_outreach_logs].';
    END

    IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[nurse_outreach_logs]') AND name = 'registry_type')
    BEGIN
        ALTER TABLE [dbo].[nurse_outreach_logs] ADD [registry_type] [varchar](50) NULL;
        PRINT '  [ADD COLUMN] Added [registry_type] to [nurse_outreach_logs].';
    END

    -- Make task_id nullable to support NSTEMI followups that do not use patient_followup_tasks
    IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[nurse_outreach_logs]') AND name = 'task_id' AND is_nullable = 0)
    BEGIN
        ALTER TABLE [dbo].[nurse_outreach_logs] ALTER COLUMN [task_id] [int] NULL;
        PRINT '  [ALTER COLUMN] Modified [nurse_outreach_logs].[task_id] to NULLABLE.';
    END
END
GO


-- ====================================================================================================
-- SECTION 4: FOREIGN KEYS (RE-BINDING AND NEW CONSTRAINTS)
-- ====================================================================================================

-- 4.1 Re-bind / ensure [dbo].[hf_registry] -> [patient_demographics]
IF OBJECT_ID(N'[dbo].[fk_hf_patient]', N'F') IS NULL
BEGIN
    PRINT '  [ADD FK] Adding fk_hf_patient...';
    ALTER TABLE [dbo].[hf_registry] WITH CHECK ADD CONSTRAINT [fk_hf_patient] 
    FOREIGN KEY([reg_patient_id]) REFERENCES [dbo].[patient_demographics] ([reg_patient_id]);
    ALTER TABLE [dbo].[hf_registry] CHECK CONSTRAINT [fk_hf_patient];
END
GO

-- 4.2 Re-bind / ensure [dbo].[nstemi_registry] -> [patient_demographics]
IF OBJECT_ID(N'[dbo].[fk_nstemi_patient]', N'F') IS NULL
BEGIN
    PRINT '  [ADD FK] Adding fk_nstemi_patient...';
    ALTER TABLE [dbo].[nstemi_registry] WITH CHECK ADD CONSTRAINT [fk_nstemi_patient] 
    FOREIGN KEY([reg_patient_id]) REFERENCES [dbo].[patient_demographics] ([reg_patient_id]);
    ALTER TABLE [dbo].[nstemi_registry] CHECK CONSTRAINT [fk_nstemi_patient];
END
GO

-- 4.3 Re-bind / ensure [dbo].[stemi_registry] -> [patient_demographics]
IF OBJECT_ID(N'[dbo].[fk_stemi_patient]', N'F') IS NULL
BEGIN
    PRINT '  [ADD FK] Adding fk_stemi_patient...';
    ALTER TABLE [dbo].[stemi_registry] WITH CHECK ADD CONSTRAINT [fk_stemi_patient] 
    FOREIGN KEY([reg_patient_id]) REFERENCES [dbo].[patient_demographics] ([reg_patient_id]);
    ALTER TABLE [dbo].[stemi_registry] CHECK CONSTRAINT [fk_stemi_patient];
END
GO

-- 4.4 Re-bind / ensure [dbo].[cabg_registry] -> [patient_demographics]
IF OBJECT_ID(N'[dbo].[fk_cabg_patient]', N'F') IS NULL
BEGIN
    PRINT '  [ADD FK] Adding fk_cabg_patient...';
    ALTER TABLE [dbo].[cabg_registry] WITH CHECK ADD CONSTRAINT [fk_cabg_patient] 
    FOREIGN KEY([reg_patient_id]) REFERENCES [dbo].[patient_demographics] ([reg_patient_id]);
    ALTER TABLE [dbo].[cabg_registry] CHECK CONSTRAINT [fk_cabg_patient];
END
GO

-- 4.5 Re-bind / ensure [dbo].[patient_followup_tasks] -> [patient_demographics]
IF OBJECT_ID(N'[dbo].[FK_followup_tasks_patients]', N'F') IS NULL
BEGIN
    PRINT '  [ADD FK] Adding FK_followup_tasks_patients...';
    ALTER TABLE [dbo].[patient_followup_tasks] WITH CHECK ADD CONSTRAINT [FK_followup_tasks_patients] 
    FOREIGN KEY([reg_patient_id]) REFERENCES [dbo].[patient_demographics] ([reg_patient_id]);
    ALTER TABLE [dbo].[patient_followup_tasks] CHECK CONSTRAINT [FK_followup_tasks_patients];
END
GO

-- 4.6 Re-bind / ensure [dbo].[nurse_outreach_logs] -> [patient_demographics]
IF OBJECT_ID(N'[dbo].[FK_outreach_logs_patients]', N'F') IS NULL
BEGIN
    PRINT '  [ADD FK] Adding FK_outreach_logs_patients...';
    ALTER TABLE [dbo].[nurse_outreach_logs] WITH CHECK ADD CONSTRAINT [FK_outreach_logs_patients] 
    FOREIGN KEY([reg_patient_id]) REFERENCES [dbo].[patient_demographics] ([reg_patient_id]);
    ALTER TABLE [dbo].[nurse_outreach_logs] CHECK CONSTRAINT [FK_outreach_logs_patients];
END
GO

-- 4.7 Foreign Key: [dbo].[nurse_outreach_logs] -> [dbo].[nstemi_followup]
IF OBJECT_ID(N'[dbo].[FK_outreach_logs_nstemi]', N'F') IS NULL
BEGIN
    PRINT '  [ADD FK] Adding FK_outreach_logs_nstemi...';
    ALTER TABLE [dbo].[nurse_outreach_logs] WITH CHECK ADD CONSTRAINT [FK_outreach_logs_nstemi] 
    FOREIGN KEY([nstemi_followup_id]) REFERENCES [dbo].[nstemi_followup] ([followup_id]);
    ALTER TABLE [dbo].[nurse_outreach_logs] CHECK CONSTRAINT [FK_outreach_logs_nstemi];
END
GO

-- 4.8 Self-referencing FK on [dbo].[patient_demographics].[merged_into_patient_id]
IF OBJECT_ID(N'[dbo].[FK_patient_demographics_merged_into]', N'F') IS NULL
BEGIN
    PRINT '  [ADD FK] Adding FK_patient_demographics_merged_into...';
    ALTER TABLE [dbo].[patient_demographics] WITH CHECK ADD CONSTRAINT [FK_patient_demographics_merged_into] 
    FOREIGN KEY([merged_into_patient_id]) REFERENCES [dbo].[patient_demographics] ([reg_patient_id]);
    ALTER TABLE [dbo].[patient_demographics] CHECK CONSTRAINT [FK_patient_demographics_merged_into];
END
GO

-- 4.9 Foreign Key: [dbo].[patient_identity_index] -> [dbo].[patient_demographics]
IF OBJECT_ID(N'[dbo].[FK_identity_index_demographics]', N'F') IS NULL
BEGIN
    PRINT '  [ADD FK] Adding FK_identity_index_demographics...';
    ALTER TABLE [dbo].[patient_identity_index] WITH CHECK ADD CONSTRAINT [FK_identity_index_demographics] 
    FOREIGN KEY([reg_patient_id]) REFERENCES [dbo].[patient_demographics] ([reg_patient_id]);
    ALTER TABLE [dbo].[patient_identity_index] CHECK CONSTRAINT [FK_identity_index_demographics];
END
GO

-- 4.10 Foreign Key: [dbo].[patient_match_audit] -> [dbo].[patient_demographics]
IF OBJECT_ID(N'[dbo].[FK_audit_patient]', N'F') IS NULL
BEGIN
    PRINT '  [ADD FK] Adding FK_audit_patient...';
    ALTER TABLE [dbo].[patient_match_audit] WITH CHECK ADD CONSTRAINT [FK_audit_patient] 
    FOREIGN KEY([reg_patient_id]) REFERENCES [dbo].[patient_demographics] ([reg_patient_id]);
    ALTER TABLE [dbo].[patient_match_audit] CHECK CONSTRAINT [FK_audit_patient];
END
GO

-- 4.11 Foreign Key: [dbo].[patient_match_audit] -> [dbo].[patient_staging]
IF OBJECT_ID(N'[dbo].[FK_audit_staging]', N'F') IS NULL
BEGIN
    PRINT '  [ADD FK] Adding FK_audit_staging...';
    ALTER TABLE [dbo].[patient_match_audit] WITH CHECK ADD CONSTRAINT [FK_audit_staging] 
    FOREIGN KEY([candidate_patient_id]) REFERENCES [dbo].[patient_staging] ([staging_id]);
    ALTER TABLE [dbo].[patient_match_audit] CHECK CONSTRAINT [FK_audit_staging];
END
GO

-- 4.12 Foreign Key: [dbo].[patient_merge_history] -> [dbo].[patient_demographics] (surviving)
IF OBJECT_ID(N'[dbo].[FK_merge_history_surviving]', N'F') IS NULL
BEGIN
    PRINT '  [ADD FK] Adding FK_merge_history_surviving...';
    ALTER TABLE [dbo].[patient_merge_history] WITH CHECK ADD CONSTRAINT [FK_merge_history_surviving] 
    FOREIGN KEY([surviving_patient_id]) REFERENCES [dbo].[patient_demographics] ([reg_patient_id]);
    ALTER TABLE [dbo].[patient_merge_history] CHECK CONSTRAINT [FK_merge_history_surviving];
END
GO

-- 4.13 Foreign Key: [dbo].[patient_merge_history] -> [dbo].[patient_demographics] (retired)
IF OBJECT_ID(N'[dbo].[FK_merge_history_retired]', N'F') IS NULL
BEGIN
    PRINT '  [ADD FK] Adding FK_merge_history_retired...';
    ALTER TABLE [dbo].[patient_merge_history] WITH CHECK ADD CONSTRAINT [FK_merge_history_retired] 
    FOREIGN KEY([retired_patient_id]) REFERENCES [dbo].[patient_demographics] ([reg_patient_id]);
    ALTER TABLE [dbo].[patient_merge_history] CHECK CONSTRAINT [FK_merge_history_retired];
END
GO


-- ====================================================================================================
-- SECTION 5: PERFORMANCE AND LOOKUP INDEXES
-- ====================================================================================================

-- 5.1 Indexes on [dbo].[patient_demographics]
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE object_id = OBJECT_ID(N'[dbo].[patient_demographics]') AND name = N'UX_patients_mr_no')
BEGIN
    PRINT '  [CREATE INDEX] Creating UX_patients_mr_no...';
    CREATE UNIQUE NONCLUSTERED INDEX [UX_patients_mr_no] ON [dbo].[patient_demographics] ([mr_no] ASC)
    WHERE ([mr_no] IS NOT NULL);
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE object_id = OBJECT_ID(N'[dbo].[patient_demographics]') AND name = N'UX_patients_ip_no')
BEGIN
    PRINT '  [CREATE INDEX] Creating UX_patients_ip_no...';
    CREATE UNIQUE NONCLUSTERED INDEX [UX_patients_ip_no] ON [dbo].[patient_demographics] ([ip_no] ASC)
    WHERE ([ip_no] IS NOT NULL);
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE object_id = OBJECT_ID(N'[dbo].[patient_demographics]') AND name = N'IX_patient_demographics_merged_into')
BEGIN
    PRINT '  [CREATE INDEX] Creating IX_patient_demographics_merged_into...';
    CREATE NONCLUSTERED INDEX [IX_patient_demographics_merged_into] ON [dbo].[patient_demographics] ([merged_into_patient_id] ASC);
END
GO

-- 5.2 Indexes on [dbo].[patient_identity_index]
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE object_id = OBJECT_ID(N'[dbo].[patient_identity_index]') AND name = N'IX_identity_phone_hash')
BEGIN
    PRINT '  [CREATE INDEX] Creating IX_identity_phone_hash...';
    CREATE NONCLUSTERED INDEX [IX_identity_phone_hash] ON [dbo].[patient_identity_index] ([phone_hash] ASC);
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE object_id = OBJECT_ID(N'[dbo].[patient_identity_index]') AND name = N'IX_id_phone_hash')
BEGIN
    PRINT '  [CREATE INDEX] Creating IX_id_phone_hash...';
    CREATE NONCLUSTERED INDEX [IX_id_phone_hash] ON [dbo].[patient_identity_index] ([phone_hash] ASC);
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE object_id = OBJECT_ID(N'[dbo].[patient_identity_index]') AND name = N'IX_id_abha_hash')
BEGIN
    PRINT '  [CREATE INDEX] Creating IX_id_abha_hash...';
    CREATE NONCLUSTERED INDEX [IX_id_abha_hash] ON [dbo].[patient_identity_index] ([abha_hash] ASC);
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE object_id = OBJECT_ID(N'[dbo].[patient_identity_index]') AND name = N'IX_id_uhid_hash')
BEGIN
    PRINT '  [CREATE INDEX] Creating IX_id_uhid_hash...';
    CREATE NONCLUSTERED INDEX [IX_id_uhid_hash] ON [dbo].[patient_identity_index] ([uhid_hash] ASC);
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE object_id = OBJECT_ID(N'[dbo].[patient_identity_index]') AND name = N'IX_id_email_hash')
BEGIN
    PRINT '  [CREATE INDEX] Creating IX_id_email_hash...';
    CREATE NONCLUSTERED INDEX [IX_id_email_hash] ON [dbo].[patient_identity_index] ([email_hash] ASC);
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE object_id = OBJECT_ID(N'[dbo].[patient_identity_index]') AND name = N'IX_id_blocking')
BEGIN
    PRINT '  [CREATE INDEX] Creating IX_id_blocking...';
    CREATE NONCLUSTERED INDEX [IX_id_blocking] ON [dbo].[patient_identity_index] ([dob_year] ASC, [gender] ASC);
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE object_id = OBJECT_ID(N'[dbo].[patient_identity_index]') AND name = N'IX_identity_blocking_dob_gender')
BEGIN
    PRINT '  [CREATE INDEX] Creating IX_identity_blocking_dob_gender...';
    CREATE NONCLUSTERED INDEX [IX_identity_blocking_dob_gender] ON [dbo].[patient_identity_index] ([date_of_birth] ASC, [gender] ASC);
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE object_id = OBJECT_ID(N'[dbo].[patient_identity_index]') AND name = N'IX_id_pincode')
BEGIN
    PRINT '  [CREATE INDEX] Creating IX_id_pincode...';
    CREATE NONCLUSTERED INDEX [IX_id_pincode] ON [dbo].[patient_identity_index] ([pincode] ASC);
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE object_id = OBJECT_ID(N'[dbo].[patient_identity_index]') AND name = N'IX_identity_soundex')
BEGIN
    PRINT '  [CREATE INDEX] Creating IX_identity_soundex...';
    CREATE NONCLUSTERED INDEX [IX_identity_soundex] ON [dbo].[patient_identity_index] ([name_soundex] ASC);
END
GO

-- 5.3 Indexes on [dbo].[patient_match_audit]
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE object_id = OBJECT_ID(N'[dbo].[patient_match_audit]') AND name = N'IX_audit_patient_id')
BEGIN
    PRINT '  [CREATE INDEX] Creating IX_audit_patient_id...';
    CREATE NONCLUSTERED INDEX [IX_audit_patient_id] ON [dbo].[patient_match_audit] ([reg_patient_id] ASC);
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE object_id = OBJECT_ID(N'[dbo].[patient_match_audit]') AND name = N'IX_audit_candidate_id')
BEGIN
    PRINT '  [CREATE INDEX] Creating IX_audit_candidate_id...';
    CREATE NONCLUSTERED INDEX [IX_audit_candidate_id] ON [dbo].[patient_match_audit] ([candidate_patient_id] ASC);
END
GO

-- 5.4 Indexes on [dbo].[patient_merge_history]
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE object_id = OBJECT_ID(N'[dbo].[patient_merge_history]') AND name = N'IX_merge_history_surviving')
BEGIN
    PRINT '  [CREATE INDEX] Creating IX_merge_history_surviving...';
    CREATE NONCLUSTERED INDEX [IX_merge_history_surviving] ON [dbo].[patient_merge_history] ([surviving_patient_id] ASC);
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE object_id = OBJECT_ID(N'[dbo].[patient_merge_history]') AND name = N'IX_merge_history_retired')
BEGIN
    PRINT '  [CREATE INDEX] Creating IX_merge_history_retired...';
    CREATE NONCLUSTERED INDEX [IX_merge_history_retired] ON [dbo].[patient_merge_history] ([retired_patient_id] ASC);
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE object_id = OBJECT_ID(N'[dbo].[patient_merge_history]') AND name = N'IX_merge_history_active')
BEGIN
    PRINT '  [CREATE INDEX] Creating IX_merge_history_active...';
    CREATE NONCLUSTERED INDEX [IX_merge_history_active] ON [dbo].[patient_merge_history] ([is_unmerged] ASC);
END
GO


-- ====================================================================================================
-- SECTION 6: STORED PROCEDURES (CREATE OR ALTER)
-- ====================================================================================================

-- 6.4 Stored Procedure: [dbo].[usp_GeneratePatientCandidates]
PRINT '  [DEPLOY SP] Deploying stored procedure [dbo].[usp_GeneratePatientCandidates]...';
GO
CREATE OR ALTER PROCEDURE [dbo].[usp_GeneratePatientCandidates]
        @phoneHash CHAR(64) = NULL,
        @abhaHash CHAR(64) = NULL,
        @uhidHash CHAR(64) = NULL,
        @emailHash CHAR(64) = NULL,
        @dob DATE = NULL,
        @dobYear SMALLINT = NULL,
        @gender NVARCHAR(30) = NULL,
        @pincode VARCHAR(10) = NULL,
        @firstWord NVARCHAR(50) = NULL,
        @namePhonetic VARCHAR(50) = NULL,
        @nameSoundex VARCHAR(5) = NULL
    AS
    BEGIN
        SET NOCOUNT ON;

        SELECT DISTINCT TOP 100
            i.reg_patient_id,
            i.normalized_name,
            i.name_phonetic,
            i.name_soundex,
            i.normalized_phone,
            i.phone_hash,
            i.normalized_email,
            i.email_hash,
            i.normalized_uhid,
            i.uhid_hash,
            i.normalized_abha,
            i.abha_hash,
            i.date_of_birth,
            i.dob_year,
            i.gender,
            i.pincode,
            i.normalized_address,
            i.district,
            p.mr_no,
            p.ip_no,
            p.patient_name,
            p.phone_no,
            p.email,
            p.address
        FROM dbo.patient_identity_index i
        INNER JOIN dbo.patient_demographics p ON i.reg_patient_id = p.reg_patient_id
        WHERE (i.phone_hash = @phoneHash AND @phoneHash IS NOT NULL AND @phoneHash != 'NONE')
           OR (i.abha_hash = @abhaHash AND @abhaHash IS NOT NULL AND @abhaHash != 'NONE')
           OR (i.uhid_hash = @uhidHash AND @uhidHash IS NOT NULL AND @uhidHash != 'NONE')
           OR (i.email_hash = @emailHash AND @emailHash IS NOT NULL AND @emailHash != 'NONE')
           OR (i.date_of_birth = @dob AND @dob IS NOT NULL)
           OR (i.dob_year = @dobYear AND @dobYear IS NOT NULL AND @dobYear > 1900)
           OR (i.pincode = @pincode AND @pincode IS NOT NULL AND @pincode != 'NONE')
           OR (i.name_phonetic IS NOT NULL AND @namePhonetic IS NOT NULL AND @namePhonetic != 'NONE' AND i.name_phonetic LIKE @namePhonetic)
           OR (i.normalized_name LIKE @firstWord + '%' AND @firstWord IS NOT NULL AND @firstWord != '')
           OR (i.name_soundex = @nameSoundex AND @nameSoundex IS NOT NULL AND @nameSoundex != '')
           OR (i.dob_year = @dobYear AND i.gender = @gender AND @dobYear IS NOT NULL AND @gender IS NOT NULL);
    END;
GO

-- 6.4 Stored Procedure: [dbo].[usp_MergeMasterPatients]
PRINT '  [DEPLOY SP] Deploying stored procedure [dbo].[usp_MergeMasterPatients]...';
GO
CREATE OR ALTER PROCEDURE [dbo].[usp_MergeMasterPatients]
    @SurvivingPatientId INT,
    @RetiredPatientId   INT,
    @MergedBy           VARCHAR(100),
    @MergeReason        NVARCHAR(500) = NULL,
    @NewMergeId         INT OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    IF @SurvivingPatientId IS NULL OR @RetiredPatientId IS NULL OR @SurvivingPatientId = @RetiredPatientId
    BEGIN
        RAISERROR('Invalid merge parameters: IDs must be distinct and non-null.', 16, 1);
        RETURN;
    END

    BEGIN TRY
        BEGIN TRANSACTION;

        DECLARE @DemographicsSnapshot NVARCHAR(MAX);
        DECLARE @RetiredMrNo VARCHAR(20);

        SELECT 
            @RetiredMrNo = mr_no,
            @DemographicsSnapshot = (
                SELECT * FROM dbo.patient_demographics 
                WHERE reg_patient_id = @RetiredPatientId 
                FOR JSON PATH, WITHOUT_ARRAY_WRAPPER
            )
        FROM dbo.patient_demographics
        WHERE reg_patient_id = @RetiredPatientId;

        DECLARE @HfIdsJson NVARCHAR(MAX) = N'[]';
        DECLARE @NstemiIdsJson NVARCHAR(MAX) = N'[]';
        DECLARE @StemiIdsJson NVARCHAR(MAX) = N'[]';

        IF OBJECT_ID(N'dbo.hf_registry', N'U') IS NOT NULL
            SELECT @HfIdsJson = ISNULL((SELECT hf_id FROM dbo.hf_registry WHERE reg_patient_id = @RetiredPatientId FOR JSON PATH), N'[]');

        IF OBJECT_ID(N'dbo.nstemi_registry', N'U') IS NOT NULL
            SELECT @NstemiIdsJson = ISNULL((SELECT nstemi_id FROM dbo.nstemi_registry WHERE reg_patient_id = @RetiredPatientId FOR JSON PATH), N'[]');

        IF OBJECT_ID(N'dbo.stemi_registry', N'U') IS NOT NULL
            SELECT @StemiIdsJson = ISNULL((SELECT stemi_id FROM dbo.stemi_registry WHERE reg_patient_id = @RetiredPatientId FOR JSON PATH), N'[]');

        DECLARE @MovedSummaryJson NVARCHAR(MAX) = (
            SELECT JSON_QUERY(@HfIdsJson) AS hf_ids, JSON_QUERY(@NstemiIdsJson) AS nstemi_ids, JSON_QUERY(@StemiIdsJson) AS stemi_ids
            FOR JSON PATH, WITHOUT_ARRAY_WRAPPER
        );

        INSERT INTO dbo.patient_merge_history (
            surviving_patient_id, retired_patient_id, retired_mr_no,
            demographics_snapshot, moved_records_summary, merge_reason, merged_by, merged_at, is_unmerged
        ) VALUES (
            @SurvivingPatientId, @RetiredPatientId, @RetiredMrNo,
            @DemographicsSnapshot, @MovedSummaryJson, @MergeReason, @MergedBy, GETDATE(), 0
        );

        SET @NewMergeId = SCOPE_IDENTITY();

        IF OBJECT_ID(N'dbo.hf_registry', N'U') IS NOT NULL
            UPDATE dbo.hf_registry SET reg_patient_id = @SurvivingPatientId WHERE reg_patient_id = @RetiredPatientId;

        IF OBJECT_ID(N'dbo.nstemi_registry', N'U') IS NOT NULL
            UPDATE dbo.nstemi_registry SET reg_patient_id = @SurvivingPatientId WHERE reg_patient_id = @RetiredPatientId;

        IF OBJECT_ID(N'dbo.stemi_registry', N'U') IS NOT NULL
            UPDATE dbo.stemi_registry SET reg_patient_id = @SurvivingPatientId WHERE reg_patient_id = @RetiredPatientId;

        UPDATE dbo.patient_demographics
        SET patient_status = 'MERGED', merged_into_patient_id = @SurvivingPatientId, updated_at = GETDATE()
        WHERE reg_patient_id = @RetiredPatientId;

        IF OBJECT_ID(N'dbo.patient_identity_index', N'U') IS NOT NULL
            DELETE FROM dbo.patient_identity_index WHERE reg_patient_id = @RetiredPatientId;

        COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        THROW;
    END CATCH
END
GO

-- 6.4 Stored Procedure: [dbo].[usp_RegisterPatient]
PRINT '  [DEPLOY SP] Deploying stored procedure [dbo].[usp_RegisterPatient]...';
GO
CREATE OR ALTER PROCEDURE [dbo].[usp_RegisterPatient]
    @PatientName    NVARCHAR(150),
    @DOB            DATE,
    @Gender         NVARCHAR(6),
    @PhoneNo        VARCHAR(15),
    @Email          VARCHAR(100) = NULL,
    @UHID           VARCHAR(50) = NULL,
    @ABHANumber     VARCHAR(50) = NULL,
    @HouseFlatNo    NVARCHAR(100) = NULL,
    @StreetLocality NVARCHAR(255) = NULL,
    @VillageTown    NVARCHAR(150) = NULL,
    @Mandal         NVARCHAR(100) = NULL,
    @District       NVARCHAR(100) = NULL,
    @State          NVARCHAR(100) = NULL,
    @Pincode        VARCHAR(10) = NULL,
    @PatientStatus  VARCHAR(20) = 'ACTIVE',
    @NewPatientId   INT OUTPUT
AS
BEGIN
    SET NOCOUNT ON;

    -- Clean insert that triggers the identity index sync safely
    INSERT INTO dbo.patient_demographics (
        patient_name, date_of_birth, gender, phone_no, email, 
        uhid, abha_number, house_flat_no, street_locality, 
        village_town, mandal, district, state, pincode, patient_status
    )
    VALUES (
        @PatientName, @DOB, @Gender, @PhoneNo, @Email, 
        @UHID, @ABHANumber, @HouseFlatNo, @StreetLocality, 
        @VillageTown, @Mandal, @District, @State, @Pincode, @PatientStatus
    );

    -- Safely capture the newly generated ID
    SET @NewPatientId = SCOPE_IDENTITY();
END;
GO

-- 6.4 Stored Procedure: [dbo].[usp_UnmergeMasterPatients]
PRINT '  [DEPLOY SP] Deploying stored procedure [dbo].[usp_UnmergeMasterPatients]...';
GO
CREATE OR ALTER PROCEDURE [dbo].[usp_UnmergeMasterPatients]
    @MergeId            INT,
    @UnmergedBy         VARCHAR(100),
    @UnmergeReason      NVARCHAR(500) = NULL,
    @InterimTriageJson  NVARCHAR(MAX) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    DECLARE @SurvivingPatientId INT, @RetiredPatientId INT, @MovedRecordsSummary NVARCHAR(MAX), @IsUnmerged BIT;
    SELECT @SurvivingPatientId = surviving_patient_id, @RetiredPatientId = retired_patient_id,
           @MovedRecordsSummary = moved_records_summary, @IsUnmerged = is_unmerged
        FROM dbo.patient_merge_history WHERE merge_id = @MergeId;

    IF @SurvivingPatientId IS NULL OR @IsUnmerged = 1
    BEGIN
        RAISERROR('Invalid or already unmerged merge ID.', 16, 1);
        RETURN;
    END

    BEGIN TRY
        BEGIN TRANSACTION;

        IF OBJECT_ID(N'dbo.hf_registry', N'U') IS NOT NULL AND ISJSON(@MovedRecordsSummary) = 1
            UPDATE H SET H.reg_patient_id = @RetiredPatientId FROM dbo.hf_registry H
            INNER JOIN OPENJSON(@MovedRecordsSummary, '$.hf_ids') WITH (hf_id INT '$.hf_id') J ON H.hf_id = J.hf_id;

        IF OBJECT_ID(N'dbo.nstemi_registry', N'U') IS NOT NULL AND ISJSON(@MovedRecordsSummary) = 1
            UPDATE N SET N.reg_patient_id = @RetiredPatientId FROM dbo.nstemi_registry N
            INNER JOIN OPENJSON(@MovedRecordsSummary, '$.nstemi_ids') WITH (nstemi_id INT '$.nstemi_id') J ON N.nstemi_id = J.nstemi_id;

        IF OBJECT_ID(N'dbo.stemi_registry', N'U') IS NOT NULL AND ISJSON(@MovedRecordsSummary) = 1
            UPDATE S SET S.reg_patient_id = @RetiredPatientId FROM dbo.stemi_registry S
            INNER JOIN OPENJSON(@MovedRecordsSummary, '$.stemi_ids') WITH (stemi_id INT '$.stemi_id') J ON S.stemi_id = J.stemi_id;

        UPDATE dbo.patient_demographics
        SET patient_status = 'ACTIVE', merged_into_patient_id = NULL, updated_at = GETDATE()
        WHERE reg_patient_id = @RetiredPatientId;

        UPDATE dbo.patient_merge_history
        SET is_unmerged = 1, unmerged_at = GETDATE(), unmerged_by = @UnmergedBy, unmerge_reason = @UnmergeReason, interim_triage_summary = @InterimTriageJson
        WHERE merge_id = @MergeId;

        COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        THROW;
    END CATCH
END
GO

PRINT '>>> RDP DATABASE SCHEMA MIGRATION COMPLETED SUCCESSFULLY!';
GO
