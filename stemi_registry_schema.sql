-- ==============================================================================
-- SQL SERVER DATABASE SCHEMA SCRIPT: STEMI REGISTRY MODULE (19 SECTIONS)
-- CARE CARDIOVASCULAR REGISTRY
-- Linkage Key: reg_patient_id -> [dbo].[reg_patient](id)
-- ==============================================================================

USE [care];
GO

-- ------------------------------------------------------------------------------
-- 1. PARENT TABLE: stemi_registry (Demographic Information & Core Identifiers)
-- ------------------------------------------------------------------------------
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[stemi_registry]') AND type in (N'U'))
BEGIN
    CREATE TABLE [dbo].[stemi_registry] (
        [stemi_id] INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
        [reg_patient_id] INT NOT NULL,
        [acs_no] VARCHAR(50) NULL,
        [ip_no] VARCHAR(50) NULL,
        [admission_date] DATE NOT NULL,
        [discharge_date] DATE NULL,
        [primary_consultant] VARCHAR(150) NULL,
        [phone] VARCHAR(20) NULL,
        [email] VARCHAR(100) NULL,
        [status] INT NULL DEFAULT 0, -- 0 = Final, 2 = Draft
        [is_deleted] BIT NOT NULL DEFAULT 0,
        [deleted_at] DATETIME2(7) NULL,
        [deleted_by] INT NULL,
        [created_at] DATETIME2(7) NOT NULL DEFAULT GETDATE(),
        [updated_at] DATETIME2(7) NOT NULL DEFAULT GETDATE(),
        CONSTRAINT [FK_stemi_registry_patient] FOREIGN KEY ([reg_patient_id]) REFERENCES [dbo].[reg_patient]([id]) ON DELETE CASCADE
    );
    PRINT '✓ Created table [dbo].[stemi_registry]';
END
GO

-- ------------------------------------------------------------------------------
-- 2. CLINICAL INFORMATION: stemi_administrative (Background History)
-- ------------------------------------------------------------------------------
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[stemi_administrative]') AND type in (N'U'))
BEGIN
    CREATE TABLE [dbo].[stemi_administrative] (
        [stemi_id] INT NOT NULL PRIMARY KEY,
        [hypertension] NVARCHAR(10) NULL DEFAULT 'Unknown',
        [diabetes] NVARCHAR(10) NULL DEFAULT 'Unknown',
        [smoking] NVARCHAR(10) NULL DEFAULT 'Unknown',
        [renal_failure] NVARCHAR(10) NULL DEFAULT 'Unknown',
        [copd] NVARCHAR(10) NULL DEFAULT 'Unknown',
        [cva] NVARCHAR(10) NULL DEFAULT 'Unknown',
        [prior_acs] NVARCHAR(10) NULL DEFAULT 'Unknown',
        [prior_ptca] NVARCHAR(10) NULL DEFAULT 'Unknown',
        [prior_cabg] NVARCHAR(10) NULL DEFAULT 'Unknown',
        [other_background] NVARCHAR(255) NULL,
        [created_at] DATETIME2(7) NOT NULL DEFAULT GETDATE(),
        [updated_at] DATETIME2(7) NOT NULL DEFAULT GETDATE(),
        CONSTRAINT [FK_stemi_admin_registry] FOREIGN KEY ([stemi_id]) REFERENCES [dbo].[stemi_registry]([stemi_id]) ON DELETE CASCADE
    );
    PRINT '✓ Created table [dbo].[stemi_administrative]';
END
GO

-- ------------------------------------------------------------------------------
-- 3 & 4. CLINICAL ASSESSMENT, VITAL SIGNS, TIMI RISK SCORE & OTHER RISK FACTORS
-- ------------------------------------------------------------------------------
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[stemi_clinical_assessment]') AND type in (N'U'))
BEGIN
    CREATE TABLE [dbo].[stemi_clinical_assessment] (
        [stemi_id] INT NOT NULL PRIMARY KEY,
        -- Presentation (Yes / No)
        [typical_angina] NVARCHAR(10) NULL DEFAULT 'No',
        [atypical_chest_pain] NVARCHAR(10) NULL DEFAULT 'No',
        [breathlessness] NVARCHAR(10) NULL DEFAULT 'No',
        [syncope_presyncope] NVARCHAR(10) NULL DEFAULT 'No',
        -- Vitals (Numeric)
        [pulse_rate] INT NULL,
        [systolic_bp] INT NULL,
        [diastolic_bp] INT NULL,
        -- TIMI Risk Score (Yes/No)
        [age_gt_75] NVARCHAR(10) NULL DEFAULT 'No',            -- 3 Points
        [age_65_to_74] NVARCHAR(10) NULL DEFAULT 'No',         -- 2 Points
        [history_dm_htn_angina] NVARCHAR(10) NULL DEFAULT 'No',-- 1 Point
        [sbp_lt_100] NVARCHAR(10) NULL DEFAULT 'No',           -- 3 Points
        [heart_rate_gt_100] NVARCHAR(10) NULL DEFAULT 'No',    -- 2 Points
        [killip_class_ii_to_iv] NVARCHAR(10) NULL DEFAULT 'No',-- 2 Points
        [anterior_mi_or_lbbb] NVARCHAR(10) NULL DEFAULT 'No',  -- 1 Point
        [weight_lt_67kg] NVARCHAR(10) NULL DEFAULT 'No',       -- 1 Point
        [reperfusion_gt_4hrs] NVARCHAR(10) NULL DEFAULT 'No',  -- 1 Point
        [timi_total_score] INT NULL DEFAULT 0,                 -- Total Score (0-14)
        -- Other Risk Factors (Yes / No)
        [lvf] NVARCHAR(10) NULL DEFAULT 'No',
        [vt_vf] NVARCHAR(10) NULL DEFAULT 'No',
        [bbb_chb] NVARCHAR(10) NULL DEFAULT 'No',
        [elevated_bnp] NVARCHAR(10) NULL DEFAULT 'No',
        [elevated_crp] NVARCHAR(10) NULL DEFAULT 'No',
        [created_at] DATETIME2(7) NOT NULL DEFAULT GETDATE(),
        [updated_at] DATETIME2(7) NOT NULL DEFAULT GETDATE(),
        CONSTRAINT [FK_stemi_clinical_registry] FOREIGN KEY ([stemi_id]) REFERENCES [dbo].[stemi_registry]([stemi_id]) ON DELETE CASCADE
    );
    PRINT '✓ Created table [dbo].[stemi_clinical_assessment]';
END
GO

-- ------------------------------------------------------------------------------
-- 5, 6, 7 & 8. TREATMENT STRATEGY, PAMI DETAILS, THROMBOLYSIS & ACUTE DRUGS
-- ------------------------------------------------------------------------------
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[stemi_treatment_strategy]') AND type in (N'U'))
BEGIN
    CREATE TABLE [dbo].[stemi_treatment_strategy] (
        [stemi_id] INT NOT NULL PRIMARY KEY,
        -- Section 5: Treatment Strategy
        [pami] NVARCHAR(10) NULL DEFAULT 'No',
        [thrombolysis] NVARCHAR(10) NULL DEFAULT 'No',
        [conservative] NVARCHAR(10) NULL DEFAULT 'No',
        -- Section 6: PAMI details
        [door_to_balloon_time] INT NULL, -- min
        [vessel_lmca] NVARCHAR(10) NULL DEFAULT 'No',
        [vessel_lad] NVARCHAR(10) NULL DEFAULT 'No',
        [vessel_diagonal] NVARCHAR(10) NULL DEFAULT 'No',
        [vessel_lcx] NVARCHAR(10) NULL DEFAULT 'No',
        [vessel_ramus] NVARCHAR(10) NULL DEFAULT 'No',
        [vessel_om] NVARCHAR(10) NULL DEFAULT 'No',
        [vessel_rca] NVARCHAR(10) NULL DEFAULT 'No',
        [vessel_pda] NVARCHAR(10) NULL DEFAULT 'No',
        [vessel_segment] NVARCHAR(100) NULL,
        [thrombosuction_done] NVARCHAR(10) NULL DEFAULT 'No',
        [thrombosuction_not_done] NVARCHAR(10) NULL DEFAULT 'No',
        [stent_bms] NVARCHAR(10) NULL DEFAULT 'No',
        [stent_des] NVARCHAR(10) NULL DEFAULT 'No',
        [stent_diameter] DECIMAL(5,2) NULL,
        [stent_length] DECIMAL(5,2) NULL,
        [procedural_success] NVARCHAR(10) NULL DEFAULT 'Yes',
        [timi_flow] TINYINT NULL DEFAULT 3,
        [complication_none] NVARCHAR(10) NULL DEFAULT 'Yes',
        [complication_tamponade] NVARCHAR(10) NULL DEFAULT 'No',
        [complication_major_bleed] NVARCHAR(10) NULL DEFAULT 'No',
        [complication_stroke] NVARCHAR(10) NULL DEFAULT 'No',
        [complication_stent_thrombosis] NVARCHAR(10) NULL DEFAULT 'No',
        [complication_mi] NVARCHAR(10) NULL DEFAULT 'No',
        [complication_death] NVARCHAR(10) NULL DEFAULT 'No',
        [complication_emergency_cabg] NVARCHAR(10) NULL DEFAULT 'No',
        -- Section 7: Thrombolysis details
        [door_to_needle_time] INT NULL, -- min
        [drug_stk] NVARCHAR(10) NULL DEFAULT 'No',
        [drug_uk] NVARCHAR(10) NULL DEFAULT 'No',
        [drug_reteplase] NVARCHAR(10) NULL DEFAULT 'No',
        [drug_tenecteplase] NVARCHAR(10) NULL DEFAULT 'No',
        [thrombolysis_dose] NVARCHAR(100) NULL,
        -- Section 8: Acute Drugs
        [beta_blocker] NVARCHAR(10) NULL DEFAULT 'No',
        [calcium_channel_blocker] NVARCHAR(10) NULL DEFAULT 'No',
        [nitrate] NVARCHAR(10) NULL DEFAULT 'No',
        [nicorandil] NVARCHAR(10) NULL DEFAULT 'No',
        [ivabradine] NVARCHAR(10) NULL DEFAULT 'No',
        [ranolazine] NVARCHAR(10) NULL DEFAULT 'No',
        [trimetazidine] NVARCHAR(10) NULL DEFAULT 'No',
        [aspirin] NVARCHAR(10) NULL DEFAULT 'No',
        [clopidogrel] NVARCHAR(10) NULL DEFAULT 'No',
        [prasugrel] NVARCHAR(10) NULL DEFAULT 'No',
        [ticagrelor] NVARCHAR(10) NULL DEFAULT 'No',
        [heparin_ufh_iv] NVARCHAR(10) NULL DEFAULT 'No',
        [heparin_ufh_sc] NVARCHAR(10) NULL DEFAULT 'No',
        [heparin_lmwh] NVARCHAR(10) NULL DEFAULT 'No',
        [heparin_ufh_iv_sc] NVARCHAR(10) NULL DEFAULT 'No',
        [heparin_ufh_iv_lmwh] NVARCHAR(10) NULL DEFAULT 'No',
        [gp2b3a] NVARCHAR(10) NULL DEFAULT 'No',
        [bivaluridin] NVARCHAR(10) NULL DEFAULT 'No',
        [statin] NVARCHAR(10) NULL DEFAULT 'No',
        [statin_10mg] NVARCHAR(10) NULL DEFAULT 'No',
        [statin_20mg] NVARCHAR(10) NULL DEFAULT 'No',
        [statin_40mg] NVARCHAR(10) NULL DEFAULT 'No',
        [statin_80mg] NVARCHAR(10) NULL DEFAULT 'No',
        [other_drugs] NVARCHAR(255) NULL,
        [cag] NVARCHAR(10) NULL DEFAULT 'No',
        [iabp] NVARCHAR(10) NULL DEFAULT 'No',
        [invasive_ventilation] NVARCHAR(10) NULL DEFAULT 'No',
        [ptca] NVARCHAR(10) NULL DEFAULT 'No',
        [cabg] NVARCHAR(10) NULL DEFAULT 'No',
        [other_procedure] NVARCHAR(255) NULL,
        [created_at] DATETIME2(7) NOT NULL DEFAULT GETDATE(),
        [updated_at] DATETIME2(7) NOT NULL DEFAULT GETDATE(),
        CONSTRAINT [FK_stemi_tx_registry] FOREIGN KEY ([stemi_id]) REFERENCES [dbo].[stemi_registry]([stemi_id]) ON DELETE CASCADE
    );
    PRINT '✓ Created table [dbo].[stemi_treatment_strategy]';
END
GO

-- ------------------------------------------------------------------------------
-- 9, 10 & 11. DIAGNOSTICS, REPORTS (ECG, ECHO, BLOOD, CAG) & INVASIVE PROCEDURES
-- ------------------------------------------------------------------------------
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[stemi_diagnostics]') AND type in (N'U'))
BEGIN
    CREATE TABLE [dbo].[stemi_diagnostics] (
        [stemi_id] INT NOT NULL PRIMARY KEY,
        -- Section 9: Diagnostic Procedures
        [bedside_echo] NVARCHAR(10) NULL DEFAULT 'No',
        [departmental_echo] NVARCHAR(10) NULL DEFAULT 'No',
        [stress_testing] NVARCHAR(10) NULL DEFAULT 'No',
        [lipid_profile] NVARCHAR(10) NULL DEFAULT 'No',
        [bnp] NVARCHAR(10) NULL DEFAULT 'No',
        [crp] NVARCHAR(10) NULL DEFAULT 'No',
        [troponin_test] NVARCHAR(10) NULL DEFAULT 'No',
        [cpk_ckmb] NVARCHAR(10) NULL DEFAULT 'No',
        [rft] NVARCHAR(10) NULL DEFAULT 'No',
        [lft] NVARCHAR(10) NULL DEFAULT 'No',
        [electrolytes] NVARCHAR(10) NULL DEFAULT 'No',
        [hemogram] NVARCHAR(10) NULL DEFAULT 'No',
        [cxr] NVARCHAR(10) NULL DEFAULT 'No',
        [diagnostic_other] NVARCHAR(255) NULL,
        -- Section 10: Reports -> ECG
        [ecg_heart_rate] INT NULL,
        [av_block_none] NVARCHAR(10) NULL DEFAULT 'Yes',
        [av_block_first_degree] NVARCHAR(10) NULL DEFAULT 'No',
        [av_block_second_degree] NVARCHAR(10) NULL DEFAULT 'No',
        [av_block_chb] NVARCHAR(10) NULL DEFAULT 'No',
        [bbb_none] NVARCHAR(10) NULL DEFAULT 'Yes',
        [bbb_rbbb] NVARCHAR(10) NULL DEFAULT 'No',
        [bbb_lbbb] NVARCHAR(10) NULL DEFAULT 'No',
        [bbb_indeterminate] NVARCHAR(10) NULL DEFAULT 'No',
        [qwaves_none] NVARCHAR(10) NULL DEFAULT 'Yes',
        [qwaves_inferior] NVARCHAR(10) NULL DEFAULT 'No',
        [qwaves_anteroseptal] NVARCHAR(10) NULL DEFAULT 'No',
        [qwaves_anterior] NVARCHAR(10) NULL DEFAULT 'No',
        [qwaves_anterolateral] NVARCHAR(10) NULL DEFAULT 'No',
        [qwaves_lateral] NVARCHAR(10) NULL DEFAULT 'No',
        [st_depression_none] NVARCHAR(10) NULL DEFAULT 'Yes',
        [st_depression_inferior] NVARCHAR(10) NULL DEFAULT 'No',
        [st_depression_anteroseptal] NVARCHAR(10) NULL DEFAULT 'No',
        [st_depression_anterior] NVARCHAR(10) NULL DEFAULT 'No',
        [st_depression_anterolateral] NVARCHAR(10) NULL DEFAULT 'No',
        [st_depression_lateral] NVARCHAR(10) NULL DEFAULT 'No',
        [t_inversion_none] NVARCHAR(10) NULL DEFAULT 'Yes',
        [t_inversion_inferior] NVARCHAR(10) NULL DEFAULT 'No',
        [t_inversion_anteroseptal] NVARCHAR(10) NULL DEFAULT 'No',
        [t_inversion_anterior] NVARCHAR(10) NULL DEFAULT 'No',
        [t_inversion_anterolateral] NVARCHAR(10) NULL DEFAULT 'No',
        [t_inversion_lateral] NVARCHAR(10) NULL DEFAULT 'No',
        [rhythm_nsr] NVARCHAR(10) NULL DEFAULT 'Yes',
        [rhythm_af] NVARCHAR(10) NULL DEFAULT 'No',
        [rhythm_svt] NVARCHAR(10) NULL DEFAULT 'No',
        [rhythm_vt] NVARCHAR(10) NULL DEFAULT 'No',
        [rhythm_vf] NVARCHAR(10) NULL DEFAULT 'No',
        [ecg_other] NVARCHAR(MAX) NULL,
        -- Section 10: Reports -> Echo
        [echo_ef] DECIMAL(5,2) NULL,
        [lv_function_normal] NVARCHAR(10) NULL DEFAULT 'Yes',
        [lv_function_mild_lvd] NVARCHAR(10) NULL DEFAULT 'No',
        [lv_function_moderate_lvd] NVARCHAR(10) NULL DEFAULT 'No',
        [lv_function_severe_lvd] NVARCHAR(10) NULL DEFAULT 'No',
        [rwma_lad] NVARCHAR(10) NULL DEFAULT 'No',
        [rwma_rca] NVARCHAR(10) NULL DEFAULT 'No',
        [rwma_lcx] NVARCHAR(10) NULL DEFAULT 'No',
        [mr_none] NVARCHAR(10) NULL DEFAULT 'Yes',
        [mr_mild] NVARCHAR(10) NULL DEFAULT 'No',
        [mr_moderate] NVARCHAR(10) NULL DEFAULT 'No',
        [mr_severe] NVARCHAR(10) NULL DEFAULT 'No',
        [echo_e] DECIMAL(6,2) NULL,
        [echo_a] DECIMAL(6,2) NULL,
        [echo_dt] DECIMAL(6,2) NULL,
        [echo_e_prime] DECIMAL(6,2) NULL,
        [echo_tapsv] DECIMAL(6,2) NULL,
        [echo_other] NVARCHAR(MAX) NULL,
        -- Section 10: Reports -> Blood Investigations
        [hemoglobin] DECIMAL(5,2) NULL,
        [creatinine] DECIMAL(6,2) NULL,
        [troponin_i] VARCHAR(50) NULL,
        [cpk] VARCHAR(50) NULL,
        [ck_mb] VARCHAR(50) NULL,
        [sodium] DECIMAL(5,2) NULL,
        [potassium] DECIMAL(5,2) NULL,
        [rbs_admission] DECIMAL(6,2) NULL,
        -- Section 10: Reports -> Coronary Angiogram
        [angiogram_done] NVARCHAR(10) NULL DEFAULT 'No',
        [angiogram_normal] NVARCHAR(10) NULL DEFAULT 'No',
        [angiogram_1vd] NVARCHAR(10) NULL DEFAULT 'No',
        [angiogram_2vd] NVARCHAR(10) NULL DEFAULT 'No',
        [angiogram_3vd] NVARCHAR(10) NULL DEFAULT 'No',
        [angiogram_lmca] NVARCHAR(10) NULL DEFAULT 'No',
        [created_at] DATETIME2(7) NOT NULL DEFAULT GETDATE(),
        [updated_at] DATETIME2(7) NOT NULL DEFAULT GETDATE(),
        CONSTRAINT [FK_stemi_diag_registry] FOREIGN KEY ([stemi_id]) REFERENCES [dbo].[stemi_registry]([stemi_id]) ON DELETE CASCADE
    );
    PRINT '✓ Created table [dbo].[stemi_diagnostics]';
END
GO

-- ------------------------------------------------------------------------------
-- 12 & 13. OUTCOMES & DISCHARGE MEDICATIONS
-- ------------------------------------------------------------------------------
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[stemi_outcomes]') AND type in (N'U'))
BEGIN
    CREATE TABLE [dbo].[stemi_outcomes] (
        [stemi_id] INT NOT NULL PRIMARY KEY,
        -- Section 12: Clinical Outcomes
        [death] NVARCHAR(10) NULL DEFAULT 'No',
        [stemi_for_nonstemi] NVARCHAR(10) NULL DEFAULT 'No',
        [remi_for_stemi] NVARCHAR(10) NULL DEFAULT 'No',
        [revascularization_recurrent_ischemia] NVARCHAR(10) NULL DEFAULT 'No',
        [cva_thrombotic] NVARCHAR(10) NULL DEFAULT 'No',
        [cva_hemorrhagic] NVARCHAR(10) NULL DEFAULT 'No',
        [major_bleeding] NVARCHAR(10) NULL DEFAULT 'No',
        [outcome_other] NVARCHAR(255) NULL,
        -- Section 13: Discharge Medications
        [beta_blocker] NVARCHAR(10) NULL DEFAULT 'No',
        [calcium_channel_blocker] NVARCHAR(10) NULL DEFAULT 'No',
        [nitrate] NVARCHAR(10) NULL DEFAULT 'No',
        [nicorandil] NVARCHAR(10) NULL DEFAULT 'No',
        [ivabradine] NVARCHAR(10) NULL DEFAULT 'No',
        [ranolazine] NVARCHAR(10) NULL DEFAULT 'No',
        [trimetazidine] NVARCHAR(10) NULL DEFAULT 'No',
        [aspirin] NVARCHAR(10) NULL DEFAULT 'No',
        [clopidogrel] NVARCHAR(10) NULL DEFAULT 'No',
        [prasugrel] NVARCHAR(10) NULL DEFAULT 'No',
        [ticagrelor] NVARCHAR(10) NULL DEFAULT 'No',
        [statin] NVARCHAR(10) NULL DEFAULT 'No',
        [statin_10mg] NVARCHAR(10) NULL DEFAULT 'No',
        [statin_20mg] NVARCHAR(10) NULL DEFAULT 'No',
        [statin_40mg] NVARCHAR(10) NULL DEFAULT 'No',
        [statin_80mg] NVARCHAR(10) NULL DEFAULT 'No',
        [discharge_other_medication] NVARCHAR(255) NULL,
        [created_at] DATETIME2(7) NOT NULL DEFAULT GETDATE(),
        [updated_at] DATETIME2(7) NOT NULL DEFAULT GETDATE(),
        CONSTRAINT [FK_stemi_outcomes_registry] FOREIGN KEY ([stemi_id]) REFERENCES [dbo].[stemi_registry]([stemi_id]) ON DELETE CASCADE
    );
    PRINT '✓ Created table [dbo].[stemi_outcomes]';
END
GO

-- ------------------------------------------------------------------------------
-- 14, 15 & 16. APPROPRIATENESS ASSESSMENT (PROCEDURES, INVESTIGATIONS & DRUGS)
-- ------------------------------------------------------------------------------
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[stemi_appropriateness]') AND type in (N'U'))
BEGIN
    CREATE TABLE [dbo].[stemi_appropriateness] (
        [stemi_id] INT NOT NULL PRIMARY KEY,
        -- Section 14: Appropriateness for various procedures
        [appr_iccu_admission] NVARCHAR(30) NULL DEFAULT '+',
        [appr_iccu_transfer_out] NVARCHAR(30) NULL DEFAULT '+',
        [appr_thrombolysis_indication] NVARCHAR(30) NULL DEFAULT '+',
        [appr_ptca_indication] NVARCHAR(30) NULL DEFAULT '+',
        [appr_invasive_monitoring] NVARCHAR(30) NULL DEFAULT '+',
        [appr_iabp_indication] NVARCHAR(30) NULL DEFAULT 'NA',
        [appr_invasive_ventilation] NVARCHAR(30) NULL DEFAULT 'NA',
        [appr_dialysis_indication] NVARCHAR(30) NULL DEFAULT 'NA',
        [appr_other_procedure_name] NVARCHAR(150) NULL,
        [appr_other_procedure_appropriateness] NVARCHAR(30) NULL DEFAULT 'NA',
        -- Section 15: Appropriateness for various investigations
        [appr_cardiac_enzymes] NVARCHAR(30) NULL DEFAULT '+',
        [appr_bnp] NVARCHAR(30) NULL DEFAULT 'NA',
        [appr_crp] NVARCHAR(30) NULL DEFAULT 'NA',
        [appr_lipid_profile] NVARCHAR(30) NULL DEFAULT '+',
        [appr_bedside_echo] NVARCHAR(30) NULL DEFAULT '+',
        [appr_chest_xray] NVARCHAR(30) NULL DEFAULT '+',
        -- Section 16: Appropriateness for various drugs
        [appr_beta_blockers] NVARCHAR(30) NULL DEFAULT '+',
        [appr_aspirin] NVARCHAR(30) NULL DEFAULT '+',
        [appr_clopidogrel] NVARCHAR(30) NULL DEFAULT '+',
        [appr_ace_inhibitor] NVARCHAR(30) NULL DEFAULT '+',
        [appr_arb] NVARCHAR(30) NULL DEFAULT 'NA',
        [appr_statin] NVARCHAR(30) NULL DEFAULT '+',
        [appr_diuretic] NVARCHAR(30) NULL DEFAULT 'NA',
        [appr_lanoxin] NVARCHAR(30) NULL DEFAULT 'NA',
        [appr_anticoagulant] NVARCHAR(30) NULL DEFAULT '+',
        [appr_amiodarone] NVARCHAR(30) NULL DEFAULT 'NA',
        [appr_other_drug_name] NVARCHAR(150) NULL,
        [appr_other_drug_appropriateness] NVARCHAR(30) NULL DEFAULT 'NA',
        [created_at] DATETIME2(7) NOT NULL DEFAULT GETDATE(),
        [updated_at] DATETIME2(7) NOT NULL DEFAULT GETDATE(),
        CONSTRAINT [FK_stemi_appr_registry] FOREIGN KEY ([stemi_id]) REFERENCES [dbo].[stemi_registry]([stemi_id]) ON DELETE CASCADE
    );
    PRINT '✓ Created table [dbo].[stemi_appropriateness]';
END
GO

-- ------------------------------------------------------------------------------
-- 17 & 18. LENGTH OF STAY & COST OF CARE
-- ------------------------------------------------------------------------------
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[stemi_hospitalization]') AND type in (N'U'))
BEGIN
    CREATE TABLE [dbo].[stemi_hospitalization] (
        [stemi_id] INT NOT NULL PRIMARY KEY,
        -- Section 17: Length of Stay
        [iccu_hours] INT NULL,
        [stepdown_icu_hours] INT NULL,
        [floor_days] INT NULL,
        [total_hospital_stay_days] INT NULL,
        -- Section 18: Cost of care
        [bed_charges] DECIMAL(12,2) NULL,
        [drugs_disposables_cost] DECIMAL(12,2) NULL,
        [package_cost] DECIMAL(12,2) NULL,
        [laboratory_cost] DECIMAL(12,2) NULL,
        [non_invasive_lab_cost] DECIMAL(12,2) NULL,
        [consultation_cost] DECIMAL(12,2) NULL,
        [radiology_cost] DECIMAL(12,2) NULL,
        [miscellaneous_cost] DECIMAL(12,2) NULL,
        [total_cost] DECIMAL(12,2) NULL,
        [created_at] DATETIME2(7) NOT NULL DEFAULT GETDATE(),
        [updated_at] DATETIME2(7) NOT NULL DEFAULT GETDATE(),
        CONSTRAINT [FK_stemi_hosp_registry] FOREIGN KEY ([stemi_id]) REFERENCES [dbo].[stemi_registry]([stemi_id]) ON DELETE CASCADE
    );
    PRINT '✓ Created table [dbo].[stemi_hospitalization]';
END
GO

-- ------------------------------------------------------------------------------
-- 19. FOLLOW-UP MATRIX GRID (1-Month, 3-Month, 6-Month, 12-Month)
-- ------------------------------------------------------------------------------
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[stemi_followup]') AND type in (N'U'))
BEGIN
    CREATE TABLE [dbo].[stemi_followup] (
        [followup_id] INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
        [stemi_id] INT NOT NULL,
        [followup_month] VARCHAR(20) NOT NULL, -- '1-Month', '3-Month', '6-Month', '12-Month'
        [followup_date] DATE NULL,
        [angina] NVARCHAR(10) NULL DEFAULT 'No',
        [functional_class] VARCHAR(50) NULL DEFAULT 'None',
        [number_of_antianginals] INT NULL DEFAULT 0,
        [dual_antiplatelets] NVARCHAR(10) NULL DEFAULT 'No',
        [statins] NVARCHAR(10) NULL DEFAULT 'No',
        [beta_blocker] NVARCHAR(10) NULL DEFAULT 'No',
        [acei_arb] NVARCHAR(10) NULL DEFAULT 'No',
        [aldosterone_antagonist] NVARCHAR(10) NULL DEFAULT 'No',
        [acs_hospitalization] NVARCHAR(10) NULL DEFAULT 'No',
        [ptca] NVARCHAR(10) NULL DEFAULT 'No',
        [cabg] NVARCHAR(10) NULL DEFAULT 'No',
        [death] NVARCHAR(10) NULL DEFAULT 'No',
        [other_event] NVARCHAR(255) NULL,
        [visit_mode] VARCHAR(50) NULL DEFAULT 'In-Person',
        [special_instructions] NVARCHAR(500) NULL,
        [created_at] DATETIME2(7) NOT NULL DEFAULT GETDATE(),
        [updated_at] DATETIME2(7) NOT NULL DEFAULT GETDATE(),
        CONSTRAINT [FK_stemi_followup_registry] FOREIGN KEY ([stemi_id]) REFERENCES [dbo].[stemi_registry]([stemi_id]) ON DELETE CASCADE
    );
    PRINT '✓ Created table [dbo].[stemi_followup]';
END
GO

-- ------------------------------------------------------------------------------
-- MIGRATION PATCH: Ensure [status] and soft delete columns exist on [stemi_registry]
-- ------------------------------------------------------------------------------
IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[stemi_registry]') AND type in (N'U'))
BEGIN
    IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[stemi_registry]') AND name = N'status')
    BEGIN
        ALTER TABLE [dbo].[stemi_registry] ADD [status] INT NULL DEFAULT 0;
        PRINT '✓ Added column [status] to [dbo].[stemi_registry]';
    END

    IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[stemi_registry]') AND name = N'is_deleted')
    BEGIN
        ALTER TABLE [dbo].[stemi_registry] ADD [is_deleted] BIT NOT NULL DEFAULT 0;
        PRINT '✓ Added column [is_deleted] to [dbo].[stemi_registry]';
    END

    IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[stemi_registry]') AND name = N'deleted_at')
    BEGIN
        ALTER TABLE [dbo].[stemi_registry] ADD [deleted_at] DATETIME2(7) NULL;
        PRINT '✓ Added column [deleted_at] to [dbo].[stemi_registry]';
    END

    IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[stemi_registry]') AND name = N'deleted_by')
    BEGIN
        ALTER TABLE [dbo].[stemi_registry] ADD [deleted_by] INT NULL;
        PRINT '✓ Added column [deleted_by] to [dbo].[stemi_registry]';
    END
END
GO

IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[stemi_followup]') AND type in (N'U'))
BEGIN
    IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[stemi_followup]') AND name = N'visit_mode')
    BEGIN
        ALTER TABLE [dbo].[stemi_followup] ADD [visit_mode] VARCHAR(50) NULL DEFAULT 'In-Person';
        PRINT '✓ Added column [visit_mode] to [dbo].[stemi_followup]';
    END

    IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[stemi_followup]') AND name = N'special_instructions')
    BEGIN
        ALTER TABLE [dbo].[stemi_followup] ADD [special_instructions] NVARCHAR(500) NULL;
        PRINT '✓ Added column [special_instructions] to [dbo].[stemi_followup]';
    END
END
GO


