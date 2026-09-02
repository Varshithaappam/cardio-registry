const db = require('../config/db');

async function createStoredProcedure() {
  const pool = await db.getPool();
  console.log('Creating / Updating stored procedure dbo.usp_GeneratePatientCandidates...');

  await pool.request().query(`
    CREATE OR ALTER PROCEDURE dbo.usp_GeneratePatientCandidates
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
  `);

  console.log('✓ Stored procedure dbo.usp_GeneratePatientCandidates ready in database.');
}

if (require.main === module) {
  createStoredProcedure().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
}

module.exports = { createStoredProcedure };
