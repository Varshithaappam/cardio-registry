-- ============================================================================
-- SQL Migration Script: Add Missing Columns for STEMI & NSTEMI Followup Records
-- Database Target: [care] or [test] on RDP SQL Server (SQLEXPRESS)
-- Description: Adds 5 missing columns required by the backend when saving 
--              STEMI and NSTEMI outreach logs.
-- ============================================================================

-- 1. Ensure columns exist on [dbo].[stemi_followup_records]
IF OBJECT_ID('dbo.stemi_followup_records', 'U') IS NOT NULL
BEGIN
    IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.stemi_followup_records') AND name = 'followup_date')
    BEGIN
        ALTER TABLE dbo.stemi_followup_records ADD followup_date DATE NULL;
        PRINT 'Added followup_date to stemi_followup_records';
    END

    IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.stemi_followup_records') AND name = 'physician_medication_changes_details')
    BEGIN
        ALTER TABLE dbo.stemi_followup_records ADD physician_medication_changes_details NVARCHAR(MAX) NULL;
        PRINT 'Added physician_medication_changes_details to stemi_followup_records';
    END

    IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.stemi_followup_records') AND name = 'new_health_complaints')
    BEGIN
        ALTER TABLE dbo.stemi_followup_records ADD new_health_complaints NVARCHAR(MAX) NULL;
        PRINT 'Added new_health_complaints to stemi_followup_records';
    END

    IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.stemi_followup_records') AND name = 'has_new_symptoms')
    BEGIN
        ALTER TABLE dbo.stemi_followup_records ADD has_new_symptoms NVARCHAR(50) NULL;
        PRINT 'Added has_new_symptoms to stemi_followup_records';
    END

    IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.stemi_followup_records') AND name = 'assigned_nurse_name')
    BEGIN
        ALTER TABLE dbo.stemi_followup_records ADD assigned_nurse_name NVARCHAR(150) NULL;
        PRINT 'Added assigned_nurse_name to stemi_followup_records';
    END
END;
GO

-- 2. Ensure columns exist on [dbo].[nstemi_followup_records]
IF OBJECT_ID('dbo.nstemi_followup_records', 'U') IS NOT NULL
BEGIN
    IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.nstemi_followup_records') AND name = 'followup_date')
    BEGIN
        ALTER TABLE dbo.nstemi_followup_records ADD followup_date DATE NULL;
        PRINT 'Added followup_date to nstemi_followup_records';
    END

    IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.nstemi_followup_records') AND name = 'physician_medication_changes_details')
    BEGIN
        ALTER TABLE dbo.nstemi_followup_records ADD physician_medication_changes_details NVARCHAR(MAX) NULL;
        PRINT 'Added physician_medication_changes_details to nstemi_followup_records';
    END

    IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.nstemi_followup_records') AND name = 'new_health_complaints')
    BEGIN
        ALTER TABLE dbo.nstemi_followup_records ADD new_health_complaints NVARCHAR(MAX) NULL;
        PRINT 'Added new_health_complaints to nstemi_followup_records';
    END

    IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.nstemi_followup_records') AND name = 'has_new_symptoms')
    BEGIN
        ALTER TABLE dbo.nstemi_followup_records ADD has_new_symptoms NVARCHAR(50) NULL;
        PRINT 'Added has_new_symptoms to nstemi_followup_records';
    END

    IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.nstemi_followup_records') AND name = 'assigned_nurse_name')
    BEGIN
        ALTER TABLE dbo.nstemi_followup_records ADD assigned_nurse_name NVARCHAR(150) NULL;
        PRINT 'Added assigned_nurse_name to nstemi_followup_records';
    END
END;
GO
