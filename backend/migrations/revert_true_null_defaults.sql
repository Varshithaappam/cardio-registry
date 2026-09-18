-- ==============================================================================
-- T-SQL SCRIPT: REVERT "TRUE NULL" SCHEMA CHANGES & RESTORE DEFAULT CONSTRAINTS
-- TARGET DATABASE: [care]
-- TABLES: HF, STEMI, NSTEMI Registry Tables
-- ==============================================================================

USE [care];
GO

-- Helper procedure to add default constraint idempotently
IF OBJECT_ID('tempdb..#AddDefaultConstraint') IS NOT NULL
    DROP PROCEDURE #AddDefaultConstraint;
GO

CREATE PROCEDURE #AddDefaultConstraint
    @TableName NVARCHAR(128),
    @ColumnName NVARCHAR(128),
    @ConstraintName NVARCHAR(128),
    @DefaultValue NVARCHAR(255)
AS
BEGIN
    -- Check if table and column exist
    IF EXISTS (
        SELECT 1 
        FROM sys.columns c
        JOIN sys.tables t ON c.object_id = t.object_id
        WHERE t.name = @TableName AND c.name = @ColumnName
    )
    BEGIN
        -- Check if constraint already exists
        IF NOT EXISTS (
            SELECT 1 
            FROM sys.default_constraints dc
            JOIN sys.tables t ON dc.parent_object_id = t.object_id
            WHERE t.name = @TableName AND dc.name = @ConstraintName
        )
        BEGIN
            DECLARE @sql NVARCHAR(MAX);
            SET @sql = 'ALTER TABLE [dbo].[' + @TableName + '] ADD CONSTRAINT [' + @ConstraintName + '] DEFAULT ' + @DefaultValue + ' FOR [' + @ColumnName + '];';
            EXEC sp_executesql @sql;
            PRINT '✓ Added constraint ' + @ConstraintName + ' on [' + @TableName + '].[' + @ColumnName + ']';
        END
        ELSE
        BEGIN
            PRINT '• Constraint ' + @ConstraintName + ' already exists on [' + @TableName + '].[' + @ColumnName + ']';
        END
    END
    ELSE
    BEGIN
        PRINT '⚠ Column [' + @ColumnName + '] or Table [' + @TableName + '] does not exist.';
    END
END;
GO

PRINT '====================================================================';
PRINT 'RESTORING DEFAULT CONSTRAINTS ON STEMI TABLES...';
PRINT '====================================================================';

-- STEMI Administrative (Background History)
EXEC #AddDefaultConstraint 'stemi_administrative', 'hypertension', 'DF_stemi_admin_hypertension', '''Unknown''';
EXEC #AddDefaultConstraint 'stemi_administrative', 'diabetes', 'DF_stemi_admin_diabetes', '''Unknown''';
EXEC #AddDefaultConstraint 'stemi_administrative', 'smoking', 'DF_stemi_admin_smoking', '''Unknown''';
EXEC #AddDefaultConstraint 'stemi_administrative', 'renal_failure', 'DF_stemi_admin_renal_failure', '''Unknown''';
EXEC #AddDefaultConstraint 'stemi_administrative', 'copd', 'DF_stemi_admin_copd', '''Unknown''';
EXEC #AddDefaultConstraint 'stemi_administrative', 'cva', 'DF_stemi_admin_cva', '''Unknown''';
EXEC #AddDefaultConstraint 'stemi_administrative', 'prior_acs', 'DF_stemi_admin_prior_acs', '''Unknown''';
EXEC #AddDefaultConstraint 'stemi_administrative', 'prior_ptca', 'DF_stemi_admin_prior_ptca', '''Unknown''';
EXEC #AddDefaultConstraint 'stemi_administrative', 'prior_cabg', 'DF_stemi_admin_prior_cabg', '''Unknown''';

-- STEMI Clinical Assessment (Presentation & Risk Factors)
EXEC #AddDefaultConstraint 'stemi_clinical_assessment', 'typical_angina', 'DF_stemi_clin_typical_angina', '''No''';
EXEC #AddDefaultConstraint 'stemi_clinical_assessment', 'atypical_chest_pain', 'DF_stemi_clin_atypical_chest_pain', '''No''';
EXEC #AddDefaultConstraint 'stemi_clinical_assessment', 'breathlessness', 'DF_stemi_clin_breathlessness', '''No''';
EXEC #AddDefaultConstraint 'stemi_clinical_assessment', 'syncope_presyncope', 'DF_stemi_clin_syncope_presyncope', '''No''';
EXEC #AddDefaultConstraint 'stemi_clinical_assessment', 'age_gt_75', 'DF_stemi_clin_age_gt_75', '''No''';
EXEC #AddDefaultConstraint 'stemi_clinical_assessment', 'age_65_to_74', 'DF_stemi_clin_age_65_to_74', '''No''';
EXEC #AddDefaultConstraint 'stemi_clinical_assessment', 'history_dm_htn_angina', 'DF_stemi_clin_history_dm_htn_angina', '''No''';
EXEC #AddDefaultConstraint 'stemi_clinical_assessment', 'sbp_lt_100', 'DF_stemi_clin_sbp_lt_100', '''No''';
EXEC #AddDefaultConstraint 'stemi_clinical_assessment', 'heart_rate_gt_100', 'DF_stemi_clin_heart_rate_gt_100', '''No''';
EXEC #AddDefaultConstraint 'stemi_clinical_assessment', 'killip_class_ii_to_iv', 'DF_stemi_clin_killip_class', '''No''';
EXEC #AddDefaultConstraint 'stemi_clinical_assessment', 'anterior_mi_or_lbbb', 'DF_stemi_clin_anterior_mi', '''No''';
EXEC #AddDefaultConstraint 'stemi_clinical_assessment', 'weight_lt_67kg', 'DF_stemi_clin_weight_lt_67kg', '''No''';
EXEC #AddDefaultConstraint 'stemi_clinical_assessment', 'reperfusion_gt_4hrs', 'DF_stemi_clin_reperfusion', '''No''';
EXEC #AddDefaultConstraint 'stemi_clinical_assessment', 'lvf', 'DF_stemi_clin_lvf', '''No''';
EXEC #AddDefaultConstraint 'stemi_clinical_assessment', 'vt_vf', 'DF_stemi_clin_vt_vf', '''No''';
EXEC #AddDefaultConstraint 'stemi_clinical_assessment', 'bbb_chb', 'DF_stemi_clin_bbb_chb', '''No''';
EXEC #AddDefaultConstraint 'stemi_clinical_assessment', 'elevated_bnp', 'DF_stemi_clin_elevated_bnp', '''No''';
EXEC #AddDefaultConstraint 'stemi_clinical_assessment', 'elevated_crp', 'DF_stemi_clin_elevated_crp', '''No''';

-- STEMI Treatment Strategy
EXEC #AddDefaultConstraint 'stemi_treatment_strategy', 'pami', 'DF_stemi_tx_pami', '''No''';
EXEC #AddDefaultConstraint 'stemi_treatment_strategy', 'thrombolysis', 'DF_stemi_tx_thrombolysis', '''No''';
EXEC #AddDefaultConstraint 'stemi_treatment_strategy', 'conservative', 'DF_stemi_tx_conservative', '''No''';
EXEC #AddDefaultConstraint 'stemi_treatment_strategy', 'procedural_success', 'DF_stemi_tx_procedural_success', '''No''';
EXEC #AddDefaultConstraint 'stemi_treatment_strategy', 'statin', 'DF_stemi_tx_statin', '''No''';

-- STEMI Diagnostics
EXEC #AddDefaultConstraint 'stemi_diagnostics', 'bedside_echo', 'DF_stemi_dx_bedside_echo', '''No''';
EXEC #AddDefaultConstraint 'stemi_diagnostics', 'departmental_echo', 'DF_stemi_dx_departmental_echo', '''No''';
EXEC #AddDefaultConstraint 'stemi_diagnostics', 'stress_testing', 'DF_stemi_dx_stress_testing', '''No''';
EXEC #AddDefaultConstraint 'stemi_diagnostics', 'lipid_profile', 'DF_stemi_dx_lipid_profile', '''No''';
EXEC #AddDefaultConstraint 'stemi_diagnostics', 'bnp', 'DF_stemi_dx_bnp', '''No''';
EXEC #AddDefaultConstraint 'stemi_diagnostics', 'crp', 'DF_stemi_dx_crp', '''No''';
EXEC #AddDefaultConstraint 'stemi_diagnostics', 'troponin_test', 'DF_stemi_dx_troponin_test', '''No''';
EXEC #AddDefaultConstraint 'stemi_diagnostics', 'cpk_ckmb', 'DF_stemi_dx_cpk_ckmb', '''No''';
EXEC #AddDefaultConstraint 'stemi_diagnostics', 'rft', 'DF_stemi_dx_rft', '''No''';
EXEC #AddDefaultConstraint 'stemi_diagnostics', 'lft', 'DF_stemi_dx_lft', '''No''';
EXEC #AddDefaultConstraint 'stemi_diagnostics', 'electrolytes', 'DF_stemi_dx_electrolytes', '''No''';
EXEC #AddDefaultConstraint 'stemi_diagnostics', 'hemogram', 'DF_stemi_dx_hemogram', '''No''';
EXEC #AddDefaultConstraint 'stemi_diagnostics', 'cxr', 'DF_stemi_dx_cxr', '''No''';

-- STEMI Outcomes
EXEC #AddDefaultConstraint 'stemi_outcomes', 'death', 'DF_stemi_outcomes_death', '''No''';
EXEC #AddDefaultConstraint 'stemi_outcomes', 'stemi_for_nonstemi', 'DF_stemi_outcomes_stemi_nonstemi', '''No''';
EXEC #AddDefaultConstraint 'stemi_outcomes', 'remi_for_stemi', 'DF_stemi_outcomes_remi_stemi', '''No''';
EXEC #AddDefaultConstraint 'stemi_outcomes', 'revascularization_recurrent_ischemia', 'DF_stemi_outcomes_revasc', '''No''';
EXEC #AddDefaultConstraint 'stemi_outcomes', 'cva_thrombotic', 'DF_stemi_outcomes_cva_thrombotic', '''No''';
EXEC #AddDefaultConstraint 'stemi_outcomes', 'cva_hemorrhagic', 'DF_stemi_outcomes_cva_hemorrhagic', '''No''';
EXEC #AddDefaultConstraint 'stemi_outcomes', 'major_bleeding', 'DF_stemi_outcomes_major_bleeding', '''No''';

PRINT '====================================================================';
PRINT 'RESTORING DEFAULT CONSTRAINTS ON NSTEMI TABLES...';
PRINT '====================================================================';

-- NSTEMI Administrative
EXEC #AddDefaultConstraint 'nstemi_administrative', 'hypertension', 'DF_nstemi_admin_hypertension', '''Unknown''';
EXEC #AddDefaultConstraint 'nstemi_administrative', 'diabetes', 'DF_nstemi_admin_diabetes', '''Unknown''';
EXEC #AddDefaultConstraint 'nstemi_administrative', 'smoking', 'DF_nstemi_admin_smoking', '''Unknown''';
EXEC #AddDefaultConstraint 'nstemi_administrative', 'renal_failure', 'DF_nstemi_admin_renal_failure', '''Unknown''';
EXEC #AddDefaultConstraint 'nstemi_administrative', 'copd', 'DF_nstemi_admin_copd', '''Unknown''';
EXEC #AddDefaultConstraint 'nstemi_administrative', 'cva', 'DF_nstemi_admin_cva', '''Unknown''';
EXEC #AddDefaultConstraint 'nstemi_administrative', 'prior_acs', 'DF_nstemi_admin_prior_acs', '''Unknown''';
EXEC #AddDefaultConstraint 'nstemi_administrative', 'prior_ptca', 'DF_nstemi_admin_prior_ptca', '''Unknown''';
EXEC #AddDefaultConstraint 'nstemi_administrative', 'prior_cabg', 'DF_nstemi_admin_prior_cabg', '''Unknown''';

-- NSTEMI Clinical Assessment
EXEC #AddDefaultConstraint 'nstemi_clinical_assessment', 'typical_angina', 'DF_nstemi_clin_typical_angina', '''No''';
EXEC #AddDefaultConstraint 'nstemi_clinical_assessment', 'atypical_chest_pain', 'DF_nstemi_clin_atypical_chest_pain', '''No''';
EXEC #AddDefaultConstraint 'nstemi_clinical_assessment', 'breathlessness', 'DF_nstemi_clin_breathlessness', '''No''';
EXEC #AddDefaultConstraint 'nstemi_clinical_assessment', 'syncope_presyncope', 'DF_nstemi_clin_syncope_presyncope', '''No''';
EXEC #AddDefaultConstraint 'nstemi_clinical_assessment', 'age_gt_75', 'DF_nstemi_clin_age_gt_75', '''No''';
EXEC #AddDefaultConstraint 'nstemi_clinical_assessment', 'age_65_to_74', 'DF_nstemi_clin_age_65_to_74', '''No''';
EXEC #AddDefaultConstraint 'nstemi_clinical_assessment', 'history_dm_htn_angina', 'DF_nstemi_clin_history_dm_htn_angina', '''No''';
EXEC #AddDefaultConstraint 'nstemi_clinical_assessment', 'sbp_lt_100', 'DF_nstemi_clin_sbp_lt_100', '''No''';
EXEC #AddDefaultConstraint 'nstemi_clinical_assessment', 'heart_rate_gt_100', 'DF_nstemi_clin_heart_rate_gt_100', '''No''';
EXEC #AddDefaultConstraint 'nstemi_clinical_assessment', 'chd_risk_factors_ge_3', 'DF_nstemi_clin_chd_risk', '''No''';
EXEC #AddDefaultConstraint 'nstemi_clinical_assessment', 'st_deviation_at_admission', 'DF_nstemi_clin_st_dev', '''No''';
EXEC #AddDefaultConstraint 'nstemi_clinical_assessment', 'elevated_serum_cardiac_markers', 'DF_nstemi_clin_markers', '''No''';

PRINT '====================================================================';
PRINT 'RESTORING DEFAULT CONSTRAINTS ON HF TABLES...';
PRINT '====================================================================';

-- HF Registry / Clinical Assessment
EXEC #AddDefaultConstraint 'hf_registry', 'hr_regularity', 'DF_hf_hr_regularity', '''Regular''';
EXEC #AddDefaultConstraint 'hf_registry', 'mental_status', 'DF_hf_mental_status', '''Alert / Oriented''';
EXEC #AddDefaultConstraint 'hf_registry', 'ecg_rhythm', 'DF_hf_ecg_rhythm', '''NSR''';
EXEC #AddDefaultConstraint 'hf_registry', 'av_block', 'DF_hf_av_block', '''None''';

DROP PROCEDURE #AddDefaultConstraint;
GO

PRINT '✓ Revert SQL script completed successfully.';
