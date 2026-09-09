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
