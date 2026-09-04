USE [care_2];
GO

SET ANSI_NULLS ON;
GO
SET QUOTED_IDENTIFIER ON;
GO

CREATE OR ALTER PROCEDURE [dbo].[usp_RegisterPatient]
    @mr_no                  VARCHAR(10)   = NULL,
    @ip_no                  VARCHAR(10)   = NULL,
    @patient_name           NVARCHAR(150),
    @date_of_birth          DATE,
    @gender                 NVARCHAR(6)   = 'Unknown',
    @blood_group            NVARCHAR(7)   = 'Unknown',
    @insurance_mode         NVARCHAR(24)  = 'Unknown',
    @phone_no               VARCHAR(15)   = NULL,
    @email                  VARCHAR(100)  = NULL,
    @hypertension           NVARCHAR(7)   = 'No',
    @smoking                NVARCHAR(7)   = 'No',
    @diabetes               NVARCHAR(7)   = 'No',
    @diabetes_control_type  NVARCHAR(26)  = 'Unknown',
    @renal_failure          NVARCHAR(7)   = 'No',
    @active_dialysis_status NVARCHAR(14)  = 'Unknown',
    @address                VARCHAR(500)  = NULL,
    @house_flat_no          NVARCHAR(100) = NULL,
    @street_locality        NVARCHAR(255) = NULL,
    @village_town           NVARCHAR(150) = NULL,
    @mandal                 NVARCHAR(100) = NULL,
    @district               NVARCHAR(100) = NULL,
    @state                  NVARCHAR(100) = NULL,
    @pincode                VARCHAR(10)   = NULL,
    @higher_education       NVARCHAR(13)  = 'None',
    @occupation             VARCHAR(255)  = NULL,
    @uhid                   VARCHAR(50)   = NULL,
    @abha_number            VARCHAR(50)   = NULL,
    @patient_status         VARCHAR(20)   = 'ACTIVE',
    @merged_into_patient_id INT           = NULL,
    @NewPatientId           INT           = NULL OUTPUT
AS
BEGIN
    SET NOCOUNT ON;

    INSERT INTO dbo.patient_demographics (
        mr_no, ip_no, patient_name, date_of_birth, gender, blood_group,
        insurance_mode, phone_no, email, hypertension, smoking, diabetes,
        diabetes_control_type, renal_failure, active_dialysis_status, address,
        house_flat_no, street_locality, village_town, mandal, district, state, pincode,
        higher_education, occupation, uhid, abha_number,
        patient_status, merged_into_patient_id,
        created_at, updated_at
    )
    VALUES (
        @mr_no, @ip_no, @patient_name, @date_of_birth, @gender, @blood_group,
        @insurance_mode, @phone_no, @email, @hypertension, @smoking, @diabetes,
        @diabetes_control_type, @renal_failure, @active_dialysis_status, @address,
        @house_flat_no, @street_locality, @village_town, @mandal, @district, @state, @pincode,
        @higher_education, @occupation, @uhid, @abha_number,
        ISNULL(@patient_status, 'ACTIVE'), @merged_into_patient_id,
        GETDATE(), GETDATE()
    );

    SET @NewPatientId = SCOPE_IDENTITY();
    SELECT @NewPatientId AS reg_patient_id;
END;
GO


