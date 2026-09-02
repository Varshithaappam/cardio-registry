const db = require('../config/db');

async function migrate() {
  const pool = await db.getPool();
  console.log('Starting Patient Identity Resolution Schema Migration...');

  // 1. Ensure patient_identity_index columns
  await pool.request().query(`
    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'patient_identity_index' AND COLUMN_NAME = 'normalized_email')
    BEGIN
      ALTER TABLE patient_identity_index ADD normalized_email VARCHAR(320) NULL;
      PRINT 'Added normalized_email to patient_identity_index';
    END;

    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'patient_identity_index' AND COLUMN_NAME = 'email_hash')
    BEGIN
      ALTER TABLE patient_identity_index ADD email_hash CHAR(64) NULL;
      PRINT 'Added email_hash to patient_identity_index';
    END;

    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'patient_identity_index' AND COLUMN_NAME = 'name_phonetic')
    BEGIN
      ALTER TABLE patient_identity_index ADD name_phonetic VARCHAR(50) NULL;
      PRINT 'Added name_phonetic to patient_identity_index';
    END;

    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'patient_identity_index' AND COLUMN_NAME = 'pincode')
    BEGIN
      ALTER TABLE patient_identity_index ADD pincode VARCHAR(10) NULL;
      PRINT 'Added pincode to patient_identity_index';
    END;

    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'patient_identity_index' AND COLUMN_NAME = 'district')
    BEGIN
      ALTER TABLE patient_identity_index ADD district NVARCHAR(100) NULL;
      PRINT 'Added district to patient_identity_index';
    END;
  `);

  // 2. Ensure patient_match_audit columns
  await pool.request().query(`
    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'patient_match_audit' AND COLUMN_NAME = 'user_decision')
    BEGIN
      ALTER TABLE patient_match_audit ADD user_decision VARCHAR(50) NULL;
      PRINT 'Added user_decision to patient_match_audit';
    END;
  `);

  // 3. Create Search & Blocking Indexes
  await pool.request().query(`
    -- Phone Hash Index
    IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_id_phone_hash' AND object_id = OBJECT_ID('patient_identity_index'))
    BEGIN
      CREATE NONCLUSTERED INDEX IX_id_phone_hash ON patient_identity_index(phone_hash);
      PRINT 'Created index IX_id_phone_hash';
    END;

    -- ABHA Hash Index (Filtered)
    IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_id_abha_hash' AND object_id = OBJECT_ID('patient_identity_index'))
    BEGIN
      CREATE NONCLUSTERED INDEX IX_id_abha_hash ON patient_identity_index(abha_hash) WHERE abha_hash IS NOT NULL;
      PRINT 'Created index IX_id_abha_hash';
    END;

    -- UHID Hash Index (Filtered)
    IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_id_uhid_hash' AND object_id = OBJECT_ID('patient_identity_index'))
    BEGIN
      CREATE NONCLUSTERED INDEX IX_id_uhid_hash ON patient_identity_index(uhid_hash) WHERE uhid_hash IS NOT NULL;
      PRINT 'Created index IX_id_uhid_hash';
    END;

    -- Email Hash Index (Filtered)
    IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_id_email_hash' AND object_id = OBJECT_ID('patient_identity_index'))
    BEGIN
      CREATE NONCLUSTERED INDEX IX_id_email_hash ON patient_identity_index(email_hash) WHERE email_hash IS NOT NULL;
      PRINT 'Created index IX_id_email_hash';
    END;

    -- Multi-Factor Blocking Index (dob_year, gender)
    IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_id_blocking' AND object_id = OBJECT_ID('patient_identity_index'))
    BEGIN
      CREATE NONCLUSTERED INDEX IX_id_blocking ON patient_identity_index(dob_year, gender);
      PRINT 'Created index IX_id_blocking';
    END;

    -- Pincode Index (Filtered)
    IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_id_pincode' AND object_id = OBJECT_ID('patient_identity_index'))
    BEGIN
      CREATE NONCLUSTERED INDEX IX_id_pincode ON patient_identity_index(pincode) WHERE pincode IS NOT NULL;
      PRINT 'Created index IX_id_pincode';
    END;
  `);

  console.log('✓ Migration completed successfully.');
}

migrate()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Migration failed:', err);
    process.exit(1);
  });
