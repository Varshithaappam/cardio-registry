-- ==============================================================================
-- DDL CHANGES MIGRATION FILE
-- CARE CARDIOVASCULAR REGISTRY - STEMI MODULE
-- Run this script in SQL Server Management Studio (SSMS) on database [care]
-- ==============================================================================

USE [care];
GO

-- 1. Ensure status and soft-delete audit columns exist on [dbo].[stemi_registry]
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.stemi_registry') AND name = 'status')
BEGIN
    ALTER TABLE [dbo].[stemi_registry] ADD [status] INT NULL DEFAULT 0;
    PRINT '✓ Added [status] column to [stemi_registry]';
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.stemi_registry') AND name = 'is_deleted')
BEGIN
    ALTER TABLE [dbo].[stemi_registry] ADD [is_deleted] BIT NOT NULL DEFAULT 0;
    PRINT '✓ Added [is_deleted] column to [stemi_registry]';
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.stemi_registry') AND name = 'deleted_at')
BEGIN
    ALTER TABLE [dbo].[stemi_registry] ADD [deleted_at] DATETIME2(7) NULL;
    PRINT '✓ Added [deleted_at] column to [stemi_registry]';
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.stemi_registry') AND name = 'deleted_by')
BEGIN
    ALTER TABLE [dbo].[stemi_registry] ADD [deleted_by] INT NULL;
    PRINT '✓ Added [deleted_by] column to [stemi_registry]';
END
GO

-- 2. Ensure visit_mode and special_instructions columns exist on [dbo].[stemi_followup]
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.stemi_followup') AND name = 'visit_mode')
BEGIN
    ALTER TABLE [dbo].[stemi_followup] ADD [visit_mode] VARCHAR(50) NULL DEFAULT 'In-Person';
    PRINT '✓ Added [visit_mode] column to [stemi_followup]';
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.stemi_followup') AND name = 'special_instructions')
BEGIN
    ALTER TABLE [dbo].[stemi_followup] ADD [special_instructions] NVARCHAR(500) NULL;
    PRINT '✓ Added [special_instructions] column to [stemi_followup]';
END
GO

PRINT '==============================================================================';
PRINT 'DDL Changes Migration check completed successfully.';
PRINT '==============================================================================';
GO




USE [care];
GO

-- 3. Appropriateness Notes for stemi_appropriateness
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.stemi_appropriateness') AND name = 'iccu_admission_note')
BEGIN
    ALTER TABLE dbo.stemi_appropriateness ADD
        iccu_admission_note NVARCHAR(255) NULL,
        iccu_transfer_out_note NVARCHAR(255) NULL,
        tlt_note NVARCHAR(255) NULL,
        ptca_note NVARCHAR(255) NULL,
        invasive_monitoring_note NVARCHAR(255) NULL,
        iabp_note NVARCHAR(255) NULL,
        invasive_ventilation_note NVARCHAR(255) NULL,
        dialysis_note NVARCHAR(255) NULL,
        any_other_procedure_note NVARCHAR(255) NULL,
        cardiac_enzymes_note NVARCHAR(255) NULL,
        bnp_note NVARCHAR(255) NULL,
        crp_note NVARCHAR(255) NULL,
        lipid_profile_note NVARCHAR(255) NULL,
        bed_side_echo_note NVARCHAR(255) NULL,
        cxr_note NVARCHAR(255) NULL,
        beta_blockers_note NVARCHAR(255) NULL,
        aspirin_note NVARCHAR(255) NULL,
        clopidogrel_note NVARCHAR(255) NULL,
        ace_inhibitor_note NVARCHAR(255) NULL,
        arb_note NVARCHAR(255) NULL,
        statin_note NVARCHAR(255) NULL,
        diuretic_note NVARCHAR(255) NULL,
        lanoxin_note NVARCHAR(255) NULL,
        anticoagulant_note NVARCHAR(255) NULL,
        amiodarone_note NVARCHAR(255) NULL,
        any_other_drug_note NVARCHAR(255) NULL;
    PRINT '✓ Added appropriateness note columns to [stemi_appropriateness]';
END
GO

-- 4. Appropriateness Notes for nstemi_appropriateness
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.nstemi_appropriateness') AND name = 'iccu_admission_note')
BEGIN
    ALTER TABLE dbo.nstemi_appropriateness ADD
        iccu_admission_note NVARCHAR(255) NULL,
        iccu_transfer_out_note NVARCHAR(255) NULL,
        tlt_note NVARCHAR(255) NULL,
        ptca_note NVARCHAR(255) NULL,
        invasive_monitoring_note NVARCHAR(255) NULL,
        iabp_note NVARCHAR(255) NULL,
        invasive_ventilation_note NVARCHAR(255) NULL,
        dialysis_note NVARCHAR(255) NULL,
        any_other_procedure_note NVARCHAR(255) NULL,
        cardiac_enzymes_note NVARCHAR(255) NULL,
        bnp_note NVARCHAR(255) NULL,
        crp_note NVARCHAR(255) NULL,
        lipid_profile_note NVARCHAR(255) NULL,
        bed_side_echo_note NVARCHAR(255) NULL,
        cxr_note NVARCHAR(255) NULL,
        beta_blockers_note NVARCHAR(255) NULL,
        aspirin_note NVARCHAR(255) NULL,
        clopidogrel_note NVARCHAR(255) NULL,
        ace_inhibitor_note NVARCHAR(255) NULL,
        arb_note NVARCHAR(255) NULL,
        statin_note NVARCHAR(255) NULL,
        diuretic_note NVARCHAR(255) NULL,
        lanoxin_note NVARCHAR(255) NULL,
        anticoagulant_note NVARCHAR(255) NULL,
        amiodarone_note NVARCHAR(255) NULL,
        any_other_drug_note NVARCHAR(255) NULL;
    PRINT '✓ Added appropriateness note columns to [nstemi_appropriateness]';
END
GO



CREATE TABLE [dbo].[system_audit_log](
    [audit_id] [int] IDENTITY(1,1) NOT NULL PRIMARY KEY,
    [registry_type] [varchar](50) NOT NULL, 
    [record_identifier] [varchar](100) NULL, 
    [record_id] [varchar](100) NULL,             -- Changed from INT to safely hold strings
    [patient_id] [varchar](100) NULL,            -- Added missing column
    [user_id] [varchar](100) NULL,               -- Changed from INT to safely hold strings
    [action_type] [varchar](50) NOT NULL,        -- Increased from 20 to 50
    [changed_fields] [nvarchar](max) NULL,  
    [previous_values] [nvarchar](max) NULL, 
    [new_values] [nvarchar](max) NULL,      
    [timestamp] [datetime2](0) DEFAULT (sysutcdatetime())
);
-- Add a foreign key constraint linking back to your users
ALTER TABLE [dbo].[system_audit_log]  WITH CHECK ADD CONSTRAINT [fk_system_audit_user] FOREIGN KEY([user_id])
REFERENCES [dbo].[users] ([user_id]);






-- 1. Index on Master Patient Demographics Key
IF EXISTS (SELECT * FROM sys.tables WHERE name = 'patient_demographics') 
   AND NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_patient_demographics_reg_id')
BEGIN
    CREATE NONCLUSTERED INDEX IX_patient_demographics_reg_id
    ON [dbo].[patient_demographics] ([reg_patient_id]);
END
GO

-- 2. Index on Patient Follow-up Tasks Key
IF EXISTS (SELECT * FROM sys.tables WHERE name = 'patient_followup_tasks') 
   AND NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_patient_followup_tasks_reg_id')
BEGIN
    CREATE NONCLUSTERED INDEX IX_patient_followup_tasks_reg_id
    ON [dbo].[patient_followup_tasks] ([reg_patient_id]);
END
GO

-- 3. Index on Heart Failure Registry Key
IF EXISTS (SELECT * FROM sys.tables WHERE name = 'hf_registry') 
   AND NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_hf_registry_reg_patient')
BEGIN
    CREATE NONCLUSTERED INDEX IX_hf_registry_reg_patient
    ON [dbo].[hf_registry] ([reg_patient_id]);
END
GO

-- 4. Index on STEMI Registry Key
IF EXISTS (SELECT * FROM sys.tables WHERE name = 'stemi_registry') 
   AND NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_stemi_registry_reg_patient')
BEGIN
    CREATE NONCLUSTERED INDEX IX_stemi_registry_reg_patient
    ON [dbo].[stemi_registry] ([reg_patient_id]);
END
GO

-- 5. Index on NSTEMI Registry Key
IF EXISTS (SELECT * FROM sys.tables WHERE name = 'nstemi_registry') 
   AND NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_nstemi_registry_reg_patient')
BEGIN
    CREATE NONCLUSTERED INDEX IX_nstemi_registry_reg_patient
    ON [dbo].[nstemi_registry] ([reg_patient_id]);
END
GO




ALTER TABLE [stemi_treatment_strategy] DROP COLUMN 
  beta_blocker, calcium_channel_blocker, nitrate, nicorandil, ivabradine, 
  ranolazine, trimetazidine, aspirin, clopidogrel, prasugrel, ticagrelor, gp2b3a, bivaluridin;

ALTER TABLE [nstemi_treatment_strategy] DROP COLUMN 
  beta_blocker, calcium_channel_blocker, nitrate, nicorandil, ivabradine, 
  ranolazine, trimetazidine, aspirin, clopidogrel, prasugrel, ticagrelor, gp2b3a, bivaluridin;


DECLARE @sql NVARCHAR(MAX) = '';

-- Generate the ALTER TABLE statements dynamically
SELECT @sql = @sql + 'ALTER TABLE dbo.' + TABLE_NAME + ' ALTER COLUMN ' + COLUMN_NAME + ' NVARCHAR(150) NULL; ' + CHAR(13)
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_NAME IN ('stemi_appropriateness', 'nstemi_appropriateness')
  AND COLUMN_NAME LIKE '%_note';

-- Execute the generated statements
EXEC sp_executesql @sql;

PRINT '✓ All note columns in both tables successfully updated to NVARCHAR(150)';


