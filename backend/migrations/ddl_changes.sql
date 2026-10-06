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








-- ============================================================================
-- Table Structure: [dbo].[hf_followup_records]
-- Description: Stores detailed telephonic Heart Failure Follow-up Encounters 
--              derived from "Final HF Followup form (1).xls"
-- Note: All clinical and metadata columns allow NULL values.
-- ============================================================================

IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[hf_followup_records]') AND type in (N'U'))
BEGIN
    CREATE TABLE [dbo].[hf_followup_records] (
        -- Primary Key & Patient Identifiers
        [followup_record_id]               INT IDENTITY(1,1) NOT NULL,
        [reg_patient_id]                   INT NULL,
        [task_id]                          INT NULL,
        [uhid]                             VARCHAR(50) NULL,
        [care_mr_no]                       VARCHAR(50) NULL,

        -- Section 1: Follow-up Encounter Metadata
        [admission_date]                   DATE NULL,
        [discharge_date]                   DATE NULL,
        [patient_followup_date]            DATE NULL,
        [followup_conducted]               VARCHAR(100) NULL, -- e.g., 'Telephonic follow-up'
        [attempt_number]                   INT NULL,          -- 1, 2, or 3
        [answering_status]                 VARCHAR(10) NULL,  -- 'Yes', 'No'
        [no_answer_reason]                 NVARCHAR(255) NULL,

        -- Section 2: General Health & Medication Overview
        [health_status]                    VARCHAR(20) NULL,  -- 'Healthy', 'Unhealthy'
        [health_unhealthy_details]         NVARCHAR(MAX) NULL,
        [medications_still_taking]         NVARCHAR(MAX) NULL,
        [side_effects_observed]            VARCHAR(10) NULL,  -- 'Yes', 'No'
        [side_effects_details]             NVARCHAR(MAX) NULL,
        [physician_medication_changes]     VARCHAR(10) NULL,  -- 'Yes', 'No'
        [physician_medication_changes_details] NVARCHAR(MAX) NULL,

        -- Section 3: Symptom Checklist (Check all that apply)
        [symptom_shortness_of_breath]      VARCHAR(5) NULL,   -- 'Yes', 'No'
        [symptom_chest_pain]               VARCHAR(5) NULL,
        [symptom_dizziness]                VARCHAR(5) NULL,
        [symptom_swelling_feet_ankles_legs]VARCHAR(5) NULL,
        [symptom_trouble_sleeping]         VARCHAR(5) NULL,
        [symptom_sadness_depression]       VARCHAR(5) NULL,
        [symptom_fatigue]                  VARCHAR(5) NULL,
        [symptom_loss_of_appetite]         VARCHAR(5) NULL,
        [symptom_frequent_urination]       VARCHAR(5) NULL,
        [symptom_dry_cough]                VARCHAR(5) NULL,
        [symptom_weight_gain]              VARCHAR(5) NULL,
        [symptom_other_details]            NVARCHAR(255) NULL,

        -- Section 4: Medication Adherence & Structured Drug Checklist
        [medication_adherence]             VARCHAR(10) NULL,  -- 'Yes', 'No'
        [medication_adherence_no_reason]   NVARCHAR(MAX) NULL,
        
        -- Structured Drug Grid (Currently Taking / Present in Recent Visit)
        [acei_ramipril_taking]             VARCHAR(5) NULL,
        [acei_ramipril_recent_visit]       VARCHAR(5) NULL,
        
        [arb_losartan_taking]              VARCHAR(5) NULL,
        [arb_losartan_recent_visit]        VARCHAR(5) NULL,
        [arb_telmisartan_taking]           VARCHAR(5) NULL,
        [arb_telmisartan_recent_visit]     VARCHAR(5) NULL,
        
        [arni_sacubitril_valsartan_taking] VARCHAR(5) NULL,
        [arni_sacubitril_valsartan_recent_visit] VARCHAR(5) NULL,
        [arni_other_name]                  NVARCHAR(150) NULL,
        [arni_other_taking]                VARCHAR(5) NULL,
        [arni_other_recent_visit]          VARCHAR(5) NULL,
        
        [mra_spironolactone_taking]        VARCHAR(5) NULL,
        [mra_spironolactone_recent_visit]  VARCHAR(5) NULL,
        
        [beta_bisoprolol_taking]           VARCHAR(5) NULL,
        [beta_bisoprolol_recent_visit]     VARCHAR(5) NULL,
        [beta_carvedilol_taking]           VARCHAR(5) NULL,
        [beta_carvedilol_recent_visit]     VARCHAR(5) NULL,
        [beta_metoprolol_taking]           VARCHAR(5) NULL,
        [beta_metoprolol_recent_visit]     VARCHAR(5) NULL,
        [beta_nebivolol_taking]            VARCHAR(5) NULL,
        [beta_nebivolol_recent_visit]      VARCHAR(5) NULL,
        
        [sglt2_dapagliflozin_taking]       VARCHAR(5) NULL,
        [sglt2_dapagliflozin_recent_visit] VARCHAR(5) NULL,
        
        [statin_atorvastatin_taking]       VARCHAR(5) NULL,
        [statin_atorvastatin_recent_visit] VARCHAR(5) NULL,
        [statin_rosuvastatin_taking]       VARCHAR(5) NULL,
        [statin_rosuvastatin_recent_visit] VARCHAR(5) NULL,
        
        [diuretic_furosemide_taking]       VARCHAR(5) NULL,
        [diuretic_furosemide_recent_visit] VARCHAR(5) NULL,
        [diuretic_torsemide_taking]        VARCHAR(5) NULL,
        [diuretic_torsemide_recent_visit]  VARCHAR(5) NULL,
        [diuretic_metolazone_taking]       VARCHAR(5) NULL,
        [diuretic_metolazone_recent_visit] VARCHAR(5) NULL,
        
        [other_medication_name]            NVARCHAR(255) NULL,
        [other_medication_taking]          VARCHAR(5) NULL,
        [other_medication_recent_visit]    VARCHAR(5) NULL,
        [medications_grid_json]            NVARCHAR(MAX) NULL,

        -- Section 5: Lab Tests & Investigations
        [bnp_nt_probnp_result]             VARCHAR(50) NULL,
        [creatinine_result]                VARCHAR(50) NULL,
        [sodium_result]                    VARCHAR(50) NULL,
        [hemoglobin_result]                VARCHAR(50) NULL,
        [echo_done]                        VARCHAR(10) NULL,  -- 'Yes', 'No'

        -- Section 6: Major Clinical Events Since Last Follow-up
        [has_major_clinical_event]         VARCHAR(10) NULL,  -- 'Yes', 'No'
        [event_recurrent_mi]               VARCHAR(5) NULL,
        [event_hf_hospitalization]         VARCHAR(5) NULL,
        [event_cardiac_arrest]             VARCHAR(5) NULL,
        [event_arrhythmia]                 VARCHAR(5) NULL,
        [event_repeat_pci]                 VARCHAR(5) NULL,
        [event_recurrent_angina]           VARCHAR(5) NULL,
        [event_new_worsening_hf]           VARCHAR(5) NULL,
        [event_major_bleeding]             VARCHAR(5) NULL,
        [event_stroke_tia]                 VARCHAR(5) NULL,
        [event_cabg]                       VARCHAR(5) NULL,
        [event_cv_hospitalization]         VARCHAR(5) NULL,
        [event_acute_kidney_injury]        VARCHAR(5) NULL,
        [event_death]                      VARCHAR(5) NULL,
        [event_cardiogenic_shock]          VARCHAR(5) NULL,
        [event_device_complication]        VARCHAR(5) NULL,
        [event_other_details]              NVARCHAR(255) NULL,

        -- Section 7: Vaccinations, Mortality & Program Opt-In
        [vaccinations_details]             NVARCHAR(255) NULL,
        [is_deceased]                      VARCHAR(10) NULL,  -- 'Yes', 'No'
        [died_within_30days_discharge]     VARCHAR(10) NULL,  -- 'Yes', 'No'
        [place_of_death]                   NVARCHAR(150) NULL,
        [date_of_death]                    DATE NULL,
        [cause_of_death]                   VARCHAR(50) NULL,  -- 'Cardiac', 'Non-cardiac', 'Others'
        [cause_of_death_other_details]     NVARCHAR(255) NULL,
        [join_program_opt_in]              VARCHAR(10) NULL,  -- 'Yes', 'No'
        [patient_feedback]                 NVARCHAR(MAX) NULL,

        -- Audit Metadata
        [assigned_nurse_name]              VARCHAR(150) NULL,
        [created_by]                       INT NULL,
        [created_at]                       DATETIME2(7) NULL DEFAULT GETDATE(),
        [updated_at]                       DATETIME2(7) NULL,

        -- Constraints
        CONSTRAINT [PK_hf_followup_records] PRIMARY KEY CLUSTERED ([followup_record_id] ASC)
    );

    -- Useful Non-Clustered Indexes for fast querying
    CREATE NONCLUSTERED INDEX [IX_hf_followup_records_patient] 
    ON [dbo].[hf_followup_records] ([reg_patient_id] ASC);

    CREATE NONCLUSTERED INDEX [IX_hf_followup_records_task] 
    ON [dbo].[hf_followup_records] ([task_id] ASC);

    PRINT '[CREATE TABLE] Successfully created table [dbo].[hf_followup_records].';
END
ELSE
BEGIN
    PRINT '[CREATE TABLE] Table [dbo].[hf_followup_records] already exists.';
END
GO




-- 1. Add hf_id column to dbo.hf_followup_records if it doesn't exist
IF NOT EXISTS (
    SELECT 1 FROM sys.columns 
    WHERE object_id = OBJECT_ID(N'dbo.hf_followup_records') AND name = 'hf_id'
)
BEGIN
    ALTER TABLE dbo.hf_followup_records ADD hf_id INT NULL;
    PRINT '✓ Added hf_id column to dbo.hf_followup_records';
END
GO

-- 2. Populate hf_id and date fields for all existing records
UPDATE hfr
SET 
  -- Populate hf_id via task_id -> patient_followup_tasks -> hf_followup_assessments -> hf_registry
  hfr.hf_id = COALESCE(
    fa.hf_id,
    CASE WHEN t.source_registry LIKE '%Heart Failure%' THEN t.source_record_id ELSE NULL END,
    (
      SELECT TOP 1 r.hf_id 
      FROM dbo.hf_registry r 
      WHERE r.reg_patient_id = hfr.reg_patient_id 
        AND r.created_at <= hfr.created_at
      ORDER BY r.hf_id DESC
    ),
    (SELECT MAX(r.hf_id) FROM dbo.hf_registry r WHERE r.reg_patient_id = hfr.reg_patient_id)
  ),

  -- Populate date_of_admission from raw_form_json or hf_administrative
  hfr.date_of_admission = COALESCE(
    TRY_CAST(JSON_VALUE(hfr.raw_form_json, '$.date_of_admission') AS DATE),
    adm.visit_date,
    adm.assessment_date
  ),

  -- Populate date_of_discharge from raw_form_json or hf_administrative
  hfr.date_of_discharge = COALESCE(
    TRY_CAST(JSON_VALUE(hfr.raw_form_json, '$.date_of_discharge') AS DATE),
    adm.discharge_date
  ),

  -- Populate admission_date column
  hfr.admission_date = COALESCE(
    TRY_CAST(JSON_VALUE(hfr.raw_form_json, '$.date_of_admission') AS DATE),
    adm.visit_date,
    adm.assessment_date
  ),

  -- Populate discharge_date column
  hfr.discharge_date = COALESCE(
    TRY_CAST(JSON_VALUE(hfr.raw_form_json, '$.date_of_discharge') AS DATE),
    adm.discharge_date
  )

FROM dbo.hf_followup_records hfr
LEFT JOIN dbo.patient_followup_tasks t ON hfr.task_id = t.task_id
LEFT JOIN dbo.hf_followup_assessments fa ON (t.source_registry LIKE '%Heart Failure%' AND t.source_record_id = fa.followup_id)
LEFT JOIN dbo.hf_administrative adm ON (fa.hf_id = adm.hf_id OR (t.source_registry LIKE '%Heart Failure%' AND t.source_record_id = adm.hf_id));
GO




IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[stemi_followup_records]') AND type in (N'U'))
BEGIN
    CREATE TABLE [dbo].[stemi_followup_records] (
        -- Primary Key & Episode Identifiers
        [followup_record_id]               INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
        [reg_patient_id]                   INT NOT NULL,
        [task_id]                          INT NULL, -- Maintained for timeline linking
        [stemi_id]                         INT NULL, -- Links to stemi_registry primary key
        [ip_no]                            VARCHAR(50) NULL, -- Inpatient Admission No (e.g., 'IP00001', 'IP00005')
        [acs_no]                           VARCHAR(50) NULL, -- ACS Serial Number
        [uhid]                             VARCHAR(50) NULL, -- Patient UHID

        -- Section 1: Encounter Metadata
        [date_of_admission]                DATE NULL,
        [date_of_discharge]                DATE NULL,
        [patient_followup_date]            DATE NULL,
        [followup_conducted]               NVARCHAR(100) NULL DEFAULT N'Telephonic follow-up',
        [attempt_number]                   INT NULL DEFAULT 1,
        [answering_status]                 NVARCHAR(50) NULL, -- 'Yes', 'No'
        [no_answer_reason]                 NVARCHAR(255) NULL,

        -- Section 2: Clinical Status & Symptom Evaluation
        [health_status]                    NVARCHAR(50) NULL, -- 'Healthy', 'Unhealthy'
        [health_unhealthy_details]         NVARCHAR(MAX) NULL,
        [medications_still_taking]         NVARCHAR(MAX) NULL,
        [side_effects_observed]            NVARCHAR(50) NULL, -- 'Yes', 'No'
        [side_effects_details]             NVARCHAR(MAX) NULL,
        [physician_medication_changes]     NVARCHAR(MAX) NULL,
        [new_health_complaints_details]    NVARCHAR(MAX) NULL,
        [developed_new_symptoms]           NVARCHAR(50) NULL, -- 'Yes', 'No'
        [selected_symptoms]                NVARCHAR(MAX) NULL, -- Chest pain, Shortness of breath, Palpitations, PND, etc.
        [symptom_other_details]            NVARCHAR(MAX) NULL,

        -- Section 3: Medication Adherence & ACS Drug Grid
        [medication_adherence]             NVARCHAR(50) NULL, -- 'Yes', 'No'
        [medication_adherence_no_reason]    NVARCHAR(MAX) NULL,
        [drug_grid_json]                   NVARCHAR(MAX) NULL, -- Beta-blocker, Aspirin, Clopidogrel, Ticagrelor, Statins, etc.

        -- Section 4: Lab Tests & Diagnostics
        [trop_i_result]                    NVARCHAR(100) NULL,
        [creatinine_result]                 NVARCHAR(100) NULL,
        [bnp_nt_probnp_result]             NVARCHAR(100) NULL,
        [hemoglobin_result]                NVARCHAR(100) NULL,
        [sodium_result]                    NVARCHAR(100) NULL,
        [potassium_result]                 NVARCHAR(100) NULL,
        [echo_done]                        NVARCHAR(50) NULL, -- 'Yes', 'No'

        -- Section 5: Major Adverse Cardiac Events (MACE)
        [has_major_clinical_event]         NVARCHAR(50) NULL, -- 'Yes', 'No'
        [selected_clinical_events]         NVARCHAR(MAX) NULL, -- Recurrent MI, Cardiac arrest, Repeat PCI, Stroke/TIA, CABG, etc.
        [event_other_details]              NVARCHAR(MAX) NULL,

        -- Section 6: Vaccinations, Mortality & Program Opt-In
        [vaccinations_details]             NVARCHAR(MAX) NULL,
        [is_deceased]                      NVARCHAR(50) NULL DEFAULT N'No',
        [died_within_30days_discharge]     NVARCHAR(50) NULL,
        [place_of_death]                   NVARCHAR(255) NULL,
        [date_of_death]                    DATE NULL,
        [cause_of_death]                   NVARCHAR(100) NULL, -- 'Cardiac', 'Non-cardiac', 'Others'
        [cause_of_death_other_details]     NVARCHAR(MAX) NULL,
        [join_program_opt_in]              NVARCHAR(50) NULL DEFAULT N'Yes',
        [patient_feedback]                 NVARCHAR(MAX) NULL,

        -- Raw Form Backup & Metadata
        [raw_form_json]                    NVARCHAR(MAX) NULL,
        [created_at]                       DATETIME2 NOT NULL DEFAULT SYSDATETIME()
    );

    -- Performance Index for Fast Episode & Timeline Filtering
    CREATE NONCLUSTERED INDEX [IX_stemi_followup_records_lookup] 
    ON [dbo].[stemi_followup_records] ([reg_patient_id], [task_id], [ip_no]);
END;




IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[nstemi_followup_records]') AND type in (N'U'))
BEGIN
    CREATE TABLE [dbo].[nstemi_followup_records] (
        -- Primary Key & Episode Identifiers
        [followup_record_id]               INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
        [reg_patient_id]                   INT NOT NULL,
        [task_id]                          INT NULL, -- Maintained for timeline linking
        [nstemi_id]                        INT NULL, -- Links to nstemi_registry primary key
        [ip_no]                            VARCHAR(50) NULL, -- Inpatient Admission No (e.g., 'IP00001', 'IP00005')
        [acs_no]                           VARCHAR(50) NULL, -- ACS Serial Number
        [uhid]                             VARCHAR(50) NULL, -- Patient UHID

        -- Section 1: Encounter Metadata
        [date_of_admission]                DATE NULL,
        [date_of_discharge]                DATE NULL,
        [patient_followup_date]            DATE NULL,
        [followup_conducted]               NVARCHAR(100) NULL DEFAULT N'Telephonic follow-up',
        [attempt_number]                   INT NULL DEFAULT 1,
        [answering_status]                 NVARCHAR(50) NULL, -- 'Yes', 'No'
        [no_answer_reason]                 NVARCHAR(255) NULL,

        -- Section 2: Clinical Status & Symptom Evaluation
        [health_status]                    NVARCHAR(50) NULL, -- 'Healthy', 'Unhealthy'
        [health_unhealthy_details]         NVARCHAR(MAX) NULL,
        [medications_still_taking]         NVARCHAR(MAX) NULL,
        [side_effects_observed]            NVARCHAR(50) NULL, -- 'Yes', 'No'
        [side_effects_details]             NVARCHAR(MAX) NULL,
        [physician_medication_changes]     NVARCHAR(MAX) NULL,
        [new_health_complaints_details]    NVARCHAR(MAX) NULL,
        [developed_new_symptoms]           NVARCHAR(50) NULL, -- 'Yes', 'No'
        [selected_symptoms]                NVARCHAR(MAX) NULL, -- Chest pain, Shortness of breath, Palpitations, PND, etc.
        [symptom_other_details]            NVARCHAR(MAX) NULL,

        -- Section 3: Medication Adherence & ACS Drug Grid
        [medication_adherence]             NVARCHAR(50) NULL, -- 'Yes', 'No'
        [medication_adherence_no_reason]    NVARCHAR(MAX) NULL,
        [drug_grid_json]                   NVARCHAR(MAX) NULL, -- Beta-blocker, Aspirin, Clopidogrel, Ticagrelor, Statins, etc.

        -- Section 4: Lab Tests & Diagnostics
        [trop_i_result]                    NVARCHAR(100) NULL,
        [creatinine_result]                 NVARCHAR(100) NULL,
        [bnp_nt_probnp_result]             NVARCHAR(100) NULL,
        [hemoglobin_result]                NVARCHAR(100) NULL,
        [sodium_result]                    NVARCHAR(100) NULL,
        [potassium_result]                 NVARCHAR(100) NULL,
        [echo_done]                        NVARCHAR(50) NULL, -- 'Yes', 'No'

        -- Section 5: Major Adverse Cardiac Events (MACE)
        [has_major_clinical_event]         NVARCHAR(50) NULL, -- 'Yes', 'No'
        [selected_clinical_events]         NVARCHAR(MAX) NULL, -- Recurrent MI, Cardiac arrest, Repeat PCI, Stroke/TIA, CABG, etc.
        [event_other_details]              NVARCHAR(MAX) NULL,

        -- Section 6: Vaccinations, Mortality & Program Opt-In
        [vaccinations_details]             NVARCHAR(MAX) NULL,
        [is_deceased]                      NVARCHAR(50) NULL DEFAULT N'No',
        [died_within_30days_discharge]     NVARCHAR(50) NULL,
        [place_of_death]                   NVARCHAR(255) NULL,
        [date_of_death]                    DATE NULL,
        [cause_of_death]                   NVARCHAR(100) NULL, -- 'Cardiac', 'Non-cardiac', 'Others'
        [cause_of_death_other_details]     NVARCHAR(MAX) NULL,
        [join_program_opt_in]              NVARCHAR(50) NULL DEFAULT N'Yes',
        [patient_feedback]                 NVARCHAR(MAX) NULL,

        -- Raw Form Backup & Metadata
        [raw_form_json]                    NVARCHAR(MAX) NULL,
        [created_at]                       DATETIME2 NOT NULL DEFAULT SYSDATETIME()
    );

    -- Performance Index for Fast Episode & Timeline Filtering
    CREATE NONCLUSTERED INDEX [IX_nstemi_followup_records_lookup] 
    ON [dbo].[nstemi_followup_records] ([reg_patient_id], [task_id], [ip_no]);
END;





-- ===============================================================================
-- MS SQL Server Migration Script: Add overall_registry_status Column
-- Tables Affected: 
--   1. Heart Failure:  hf_followup_records & hf_followup_assessments
--   2. STEMI:          stemi_followup_records & stemi_followup
--   3. NSTEMI:         nstemi_followup_records & nstemi_followup
-- Default Value: 'Pending'
-- ===============================================================================

BEGIN TRANSACTION;

-- 1. Heart Failure Tables
IF EXISTS (SELECT * FROM sys.tables WHERE name = 'hf_followup_records')
BEGIN
    IF COL_LENGTH('dbo.hf_followup_records', 'overall_registry_status') IS NULL
    BEGIN
        ALTER TABLE dbo.hf_followup_records 
        ADD overall_registry_status VARCHAR(50) NULL DEFAULT 'Pending';
        PRINT 'Added overall_registry_status to hf_followup_records';
    END
END;

IF EXISTS (SELECT * FROM sys.tables WHERE name = 'hf_followup_assessments')
BEGIN
    IF COL_LENGTH('dbo.hf_followup_assessments', 'overall_registry_status') IS NULL
    BEGIN
        ALTER TABLE dbo.hf_followup_assessments 
        ADD overall_registry_status VARCHAR(50) NULL DEFAULT 'Pending';
        PRINT 'Added overall_registry_status to hf_followup_assessments';
    END
END;

-- 2. STEMI Tables
IF EXISTS (SELECT * FROM sys.tables WHERE name = 'stemi_followup_records')
BEGIN
    IF COL_LENGTH('dbo.stemi_followup_records', 'overall_registry_status') IS NULL
    BEGIN
        ALTER TABLE dbo.stemi_followup_records 
        ADD overall_registry_status VARCHAR(50) NULL DEFAULT 'Pending';
        PRINT 'Added overall_registry_status to stemi_followup_records';
    END
END;

IF EXISTS (SELECT * FROM sys.tables WHERE name = 'stemi_followup')
BEGIN
    IF COL_LENGTH('dbo.stemi_followup', 'overall_registry_status') IS NULL
    BEGIN
        ALTER TABLE dbo.stemi_followup 
        ADD overall_registry_status VARCHAR(50) NULL DEFAULT 'Pending';
        PRINT 'Added overall_registry_status to stemi_followup';
    END
END;

-- 3. NSTEMI Tables
IF EXISTS (SELECT * FROM sys.tables WHERE name = 'nstemi_followup_records')
BEGIN
    IF COL_LENGTH('dbo.nstemi_followup_records', 'overall_registry_status') IS NULL
    BEGIN
        ALTER TABLE dbo.nstemi_followup_records 
        ADD overall_registry_status VARCHAR(50) NULL DEFAULT 'Pending';
        PRINT 'Added overall_registry_status to nstemi_followup_records';
    END
END;

IF EXISTS (SELECT * FROM sys.tables WHERE name = 'nstemi_followup')
BEGIN
    IF COL_LENGTH('dbo.nstemi_followup', 'overall_registry_status') IS NULL
    BEGIN
        ALTER TABLE dbo.nstemi_followup 
        ADD overall_registry_status VARCHAR(50) NULL DEFAULT 'Pending';
        PRINT 'Added overall_registry_status to nstemi_followup';
    END
END;

COMMIT TRANSACTION;

-- Set existing records with NULL status to 'Completed'
UPDATE dbo.hf_followup_records     SET overall_registry_status = 'Completed' WHERE overall_registry_status IS NULL OR overall_registry_status = 'Pending';
UPDATE dbo.stemi_followup_records  SET overall_registry_status = 'Completed' WHERE overall_registry_status IS NULL OR overall_registry_status = 'Pending';
UPDATE dbo.nstemi_followup_records SET overall_registry_status = 'Completed' WHERE overall_registry_status IS NULL OR overall_registry_status = 'Pending';




-- Convert ghost Phone Call logs to Detailed Form Logged entries
UPDATE dbo.nurse_outreach_logs
SET 
  outcome = 'Detailed Form Logged', 
  contact_mode = 'Detailed Form Submission'
WHERE raw_form_json IS NOT NULL 
  AND (outcome = 'Patient Contacted & Appointment Confirmed' OR contact_mode = 'Phone Call');





  -- A. Supersede older open tasks for NSTEMI encounters
UPDATE t
SET t.status = 'Superseded by new encounter', t.updated_at = GETDATE()
FROM dbo.patient_followup_tasks t
INNER JOIN (
  SELECT reg_patient_id, MAX(nstemi_id) AS max_id 
  FROM dbo.nstemi_registry 
  GROUP BY reg_patient_id
) latest_nr ON t.reg_patient_id = latest_nr.reg_patient_id
WHERE t.source_registry LIKE '%NSTEMI%'
  AND t.source_record_id < latest_nr.max_id
  AND t.status NOT LIKE '%Superseded%'
  AND t.status != 'Completed';

-- B. Supersede older open tasks for STEMI encounters
UPDATE t
SET t.status = 'Superseded by new encounter', t.updated_at = GETDATE()
FROM dbo.patient_followup_tasks t
INNER JOIN (
  SELECT reg_patient_id, MAX(stemi_id) AS max_id 
  FROM dbo.stemi_registry 
  GROUP BY reg_patient_id
) latest_sr ON t.reg_patient_id = latest_sr.reg_patient_id
WHERE t.source_registry LIKE '%STEMI%' AND t.source_registry NOT LIKE '%NSTEMI%'
  AND t.source_record_id < latest_sr.max_id
  AND t.status NOT LIKE '%Superseded%'
  AND t.status != 'Completed';

-- C. Supersede older open tasks for Heart Failure encounters
UPDATE t
SET t.status = 'Superseded by new encounter', t.updated_at = GETDATE()
FROM dbo.patient_followup_tasks t
INNER JOIN (
  SELECT reg_patient_id, MAX(hf_id) AS max_id 
  FROM dbo.hf_registry 
  GROUP BY reg_patient_id
) latest_hf ON t.reg_patient_id = latest_hf.reg_patient_id
WHERE t.source_registry LIKE '%Heart Failure%'
  AND t.source_record_id < latest_hf.max_id
  AND t.status NOT LIKE '%Superseded%'
  AND t.status != 'Completed';





-- ===============================================================================
-- Additional RDP Synchronization & Safety Check
-- Ensures all outreach log tables have proper foreign key & json columns
-- ===============================================================================

BEGIN TRANSACTION;

-- 1. Check & Add missing columns in nurse_outreach_logs
IF EXISTS (SELECT * FROM sys.tables WHERE name = 'nurse_outreach_logs')
BEGIN
    IF COL_LENGTH('dbo.nurse_outreach_logs', 'stemi_id') IS NULL
        ALTER TABLE dbo.nurse_outreach_logs ADD stemi_id INT NULL;

    IF COL_LENGTH('dbo.nurse_outreach_logs', 'nstemi_id') IS NULL
        ALTER TABLE dbo.nurse_outreach_logs ADD nstemi_id INT NULL;

    IF COL_LENGTH('dbo.nurse_outreach_logs', 'hf_id') IS NULL
        ALTER TABLE dbo.nurse_outreach_logs ADD hf_id INT NULL;

    IF COL_LENGTH('dbo.nurse_outreach_logs', 'registry_type') IS NULL
        ALTER TABLE dbo.nurse_outreach_logs ADD registry_type VARCHAR(50) NULL;

    IF COL_LENGTH('dbo.nurse_outreach_logs', 'raw_form_json') IS NULL
        ALTER TABLE dbo.nurse_outreach_logs ADD raw_form_json NVARCHAR(MAX) NULL;

    PRINT '✓ Verified columns in nurse_outreach_logs';
END;

-- 2. Check & Add missing columns in stemi_followup
IF EXISTS (SELECT * FROM sys.tables WHERE name = 'stemi_followup')
BEGIN
    IF COL_LENGTH('dbo.stemi_followup', 'visit_mode') IS NULL
        ALTER TABLE dbo.stemi_followup ADD visit_mode NVARCHAR(50) NULL;

    IF COL_LENGTH('dbo.stemi_followup', 'special_instructions') IS NULL
        ALTER TABLE dbo.stemi_followup ADD special_instructions NVARCHAR(500) NULL;

    PRINT '✓ Verified columns in stemi_followup';
END;

-- 3. Check & Add missing columns in nstemi_followup
IF EXISTS (SELECT * FROM sys.tables WHERE name = 'nstemi_followup')
BEGIN
    IF COL_LENGTH('dbo.nstemi_followup', 'visit_mode') IS NULL
        ALTER TABLE dbo.nstemi_followup ADD visit_mode NVARCHAR(50) NULL;

    IF COL_LENGTH('dbo.nstemi_followup', 'special_instructions') IS NULL
        ALTER TABLE dbo.nstemi_followup ADD special_instructions NVARCHAR(500) NULL;

    PRINT '✓ Verified columns in nstemi_followup';
END;

COMMIT TRANSACTION;




ALTER TABLE [dbo].[patient_demographics]
ADD [national_id_type] VARCHAR(20) NULL,      -- 'ABHA' or 'Aadhaar'
    [aadhaar_number]   VARCHAR(20) NULL,      -- Formatted or 12-digit string
    [abha_address]     VARCHAR(100) NULL;     -- e.g., 'username@abdm'
