const db = require('../config/db');

async function run() {
  const sqlQuery = `
ALTER PROCEDURE dbo.usp_RegisterPatient
    @mr_no                 VARCHAR(10)   = NULL,
    @ip_no                 VARCHAR(10)   = NULL,
    @patient_name          NVARCHAR(150),
    @date_of_birth         DATE,
    @gender                NVARCHAR(6)   = 'Unknown',
    @blood_group           NVARCHAR(7)   = 'Unknown',
    @insurance_mode        NVARCHAR(24)  = 'Unknown',
    @phone_no              VARCHAR(15)   = NULL,
    @email                 VARCHAR(100)  = NULL,
    @hypertension          NVARCHAR(7)   = 'No',
    @smoking               NVARCHAR(7)   = 'No',
    @diabetes              NVARCHAR(7)   = 'No',
    @diabetes_control_type NVARCHAR(26)  = 'Unknown',
    @renal_failure         NVARCHAR(7)   = 'No',
    @active_dialysis_status NVARCHAR(14) = 'Unknown',
    @address               VARCHAR(500)  = NULL,
    @house_flat_no         NVARCHAR(100) = NULL,
    @street_locality       NVARCHAR(255) = NULL,
    @village_town          NVARCHAR(150) = NULL,
    @mandal                NVARCHAR(100) = NULL,
    @district              NVARCHAR(100) = NULL,
    @state                 NVARCHAR(100) = NULL,
    @pincode               VARCHAR(10)   = NULL,
    @higher_education      NVARCHAR(13)  = 'None',
    @occupation            VARCHAR(255)  = NULL,
    @uhid                  VARCHAR(50)   = NULL,
    @abha_number           VARCHAR(50)   = NULL,
    @patient_status        VARCHAR(20)   = 'ACTIVE',
    @date_of_death         DATE          = NULL,
    @merged_into_patient_id INT          = NULL,
    @national_id_type      VARCHAR(20)   = NULL,
    @aadhaar_number        VARCHAR(20)   = NULL,
    @abha_address          VARCHAR(100)  = NULL,
    @NewPatientId          INT           = NULL OUTPUT
AS
BEGIN
    SET NOCOUNT ON;

    INSERT INTO dbo.patient_demographics (
        mr_no, ip_no, patient_name, date_of_birth, gender, blood_group,
        insurance_mode, phone_no, email, hypertension, smoking, diabetes,
        diabetes_control_type, renal_failure, active_dialysis_status, address,
        house_flat_no, street_locality, village_town, mandal, district, state, pincode,
        higher_education, occupation, uhid, abha_number,
        patient_status, date_of_death, merged_into_patient_id,
        national_id_type, aadhaar_number, abha_address,
        created_at, updated_at
    )
    VALUES (
        @mr_no, @ip_no, @patient_name, @date_of_birth, @gender, @blood_group,
        @insurance_mode, @phone_no, @email, @hypertension, @smoking, @diabetes,
        @diabetes_control_type, @renal_failure, @active_dialysis_status, @address,
        @house_flat_no, @street_locality, @village_town, @mandal, @district, @state, @pincode,
        @higher_education, @occupation, @uhid, @abha_number,
        ISNULL(@patient_status, 'ACTIVE'), @date_of_death, @merged_into_patient_id,
        @national_id_type, @aadhaar_number, @abha_address,
        SYSDATETIME(), SYSDATETIME()
    );

    SET @NewPatientId = SCOPE_IDENTITY();
    SELECT @NewPatientId AS reg_patient_id;
END;
`;

  try {
    await db.query(sqlQuery);
    console.log('✅ Successfully updated dbo.usp_RegisterPatient');
  } catch (err) {
    console.error('❌ Error updating procedure:', err);
  } finally {
    process.exit(0);
  }
}

run();
