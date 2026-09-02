const db = require('../config/db');

async function createTrigger() {
  const pool = await db.getPool();
  console.log('Creating / Updating trigger TRG_Sync_PatientIdentityIndex...');

  await pool.request().query(`
    CREATE OR ALTER TRIGGER dbo.TRG_Sync_PatientIdentityIndex
    ON dbo.patient_demographics
    AFTER INSERT, UPDATE
    AS
    BEGIN
        SET NOCOUNT ON;

        -- Delete any existing index rows for modified patients to ensure clean upsert
        DELETE FROM dbo.patient_identity_index
        WHERE reg_patient_id IN (SELECT reg_patient_id FROM inserted);

        -- Insert newly normalized and hashed attributes
        INSERT INTO dbo.patient_identity_index (
            reg_patient_id,
            normalized_name,
            name_phonetic,
            normalized_phone,
            phone_hash,
            normalized_email,
            email_hash,
            normalized_uhid,
            uhid_hash,
            normalized_abha,
            abha_hash,
            date_of_birth,
            dob_year,
            gender,
            pincode,
            normalized_address,
            district,
            created_at,
            updated_at
        )
        SELECT
            i.reg_patient_id,
            LOWER(LTRIM(RTRIM(ISNULL(i.patient_name, '')))),
            SOUNDEX(ISNULL(i.patient_name, '')),
            -- Normalized phone: clean non-digits, format +91
            CASE 
                WHEN i.phone_no IS NOT NULL AND LEN(LTRIM(RTRIM(i.phone_no))) >= 10 
                THEN '+91' + RIGHT(REPLACE(REPLACE(REPLACE(REPLACE(i.phone_no, ' ', ''), '-', ''), '(', ''), ')', ''), 10)
                ELSE NULL 
            END,
            -- SHA-256 phone hash
            CASE 
                WHEN i.phone_no IS NOT NULL AND LEN(LTRIM(RTRIM(i.phone_no))) >= 10 
                THEN LOWER(CONVERT(VARCHAR(64), HASHBYTES('SHA2_256', '+91' + RIGHT(REPLACE(REPLACE(REPLACE(REPLACE(i.phone_no, ' ', ''), '-', ''), '(', ''), ')', ''), 10)), 2))
                ELSE NULL 
            END,
            -- Normalized email
            LOWER(LTRIM(RTRIM(i.email))),
            -- SHA-256 email hash
            CASE 
                WHEN i.email IS NOT NULL AND LEN(LTRIM(RTRIM(i.email))) > 0
                THEN LOWER(CONVERT(VARCHAR(64), HASHBYTES('SHA2_256', LOWER(LTRIM(RTRIM(i.email)))), 2))
                ELSE NULL 
            END,
            -- Normalized UHID
            UPPER(LTRIM(RTRIM(i.uhid))),
            -- SHA-256 UHID hash
            CASE 
                WHEN i.uhid IS NOT NULL AND LEN(LTRIM(RTRIM(i.uhid))) > 0
                THEN LOWER(CONVERT(VARCHAR(64), HASHBYTES('SHA2_256', UPPER(LTRIM(RTRIM(i.uhid)))), 2))
                ELSE NULL 
            END,
            -- Normalized ABHA
            REPLACE(LTRIM(RTRIM(i.abha_number)), '-', ''),
            -- SHA-256 ABHA hash
            CASE 
                WHEN i.abha_number IS NOT NULL AND LEN(LTRIM(RTRIM(i.abha_number))) > 0
                THEN LOWER(CONVERT(VARCHAR(64), HASHBYTES('SHA2_256', REPLACE(LTRIM(RTRIM(i.abha_number)), '-', '')), 2))
                ELSE NULL 
            END,
            i.date_of_birth,
            YEAR(i.date_of_birth),
            i.gender,
            i.pincode,
            LOWER(LTRIM(RTRIM(ISNULL(i.address, '')))),
            i.district,
            GETDATE(),
            GETDATE()
        FROM inserted i;
    END;
  `);

  console.log('✓ Trigger TRG_Sync_PatientIdentityIndex created successfully.');
}

if (require.main === module) {
  createTrigger().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
}

module.exports = { createTrigger };
