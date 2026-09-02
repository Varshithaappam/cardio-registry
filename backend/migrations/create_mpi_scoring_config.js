const db = require('../config/db');

async function createMpiScoringConfigTable() {
  const pool = await db.getPool();
  console.log('Creating dbo.mpi_scoring_config table if not exists...');

  await pool.request().query(`
    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'mpi_scoring_config')
    BEGIN
      CREATE TABLE [dbo].[mpi_scoring_config] (
        [config_id] INT IDENTITY(1,1) PRIMARY KEY,
        [config_type] VARCHAR(20) NOT NULL, -- 'WEIGHT', 'PENALTY', 'THRESHOLD'
        [config_key] VARCHAR(50) NOT NULL UNIQUE,
        [config_value] DECIMAL(6,2) NOT NULL,
        [description] NVARCHAR(255) NULL,
        [is_active] BIT NOT NULL DEFAULT 1,
        [created_at] DATETIME2 NOT NULL DEFAULT GETDATE(),
        [updated_at] DATETIME2 NOT NULL DEFAULT GETDATE()
      );
      PRINT 'Created table dbo.mpi_scoring_config';
    END
  `);

  // Seed default weights, penalties, and thresholds if table is empty
  const countRes = await pool.request().query('SELECT COUNT(*) AS cnt FROM dbo.mpi_scoring_config');
  if (countRes.recordset[0].cnt === 0) {
    console.log('Seeding default scoring parameters into dbo.mpi_scoring_config...');
    await pool.request().query(`
      INSERT INTO [dbo].[mpi_scoring_config] ([config_type], [config_key], [config_value], [description], [is_active])
      VALUES
        -- Percentage Weights (Sum = 100)
        ('WEIGHT', 'abha', 25.0, 'Weight percentage for ABHA number matching', 1),
        ('WEIGHT', 'uhid', 20.0, 'Weight percentage for Hospital UHID matching', 1),
        ('WEIGHT', 'phone', 15.0, 'Weight percentage for Primary Phone number matching', 1),
        ('WEIGHT', 'dob', 15.0, 'Weight percentage for Date of Birth matching', 1),
        ('WEIGHT', 'name', 15.0, 'Weight percentage for Full Name fuzzy matching', 1),
        ('WEIGHT', 'address', 5.0, 'Weight percentage for Residential Address matching', 1),
        ('WEIGHT', 'email', 3.0, 'Weight percentage for Email Address matching', 1),
        ('WEIGHT', 'gender', 2.0, 'Weight percentage for Gender matching', 1),

        -- Point Penalties (Deducted on explicit conflicts)
        ('PENALTY', 'abhaConflict', 100.0, 'Points deducted on contradictory ABHA numbers', 1),
        ('PENALTY', 'uhidConflict', 80.0, 'Points deducted on contradictory UHIDs', 1),
        ('PENALTY', 'dobConflict', 40.0, 'Points deducted on different birth years', 1),
        ('PENALTY', 'genderConflict', 20.0, 'Points deducted on conflicting gender', 1),
        ('PENALTY', 'phoneConflict', 15.0, 'Points deducted on conflicting phone numbers', 1),

        -- Decision Thresholds
        ('THRESHOLD', 'high_confidence', 95.0, 'Minimum similarity percentage for High Confidence duplicate match', 1),
        ('THRESHOLD', 'review_required', 80.0, 'Minimum similarity percentage for Review Required duplicate review', 1);
    `);
    console.log('✓ Default scoring parameters seeded successfully.');
  } else {
    console.log('dbo.mpi_scoring_config already contains configuration entries.');
  }

  const allRows = await pool.request().query('SELECT config_type, config_key, config_value, is_active FROM dbo.mpi_scoring_config');
  console.log('Current MPI Scoring Config:', allRows.recordset);
}

if (require.main === module) {
  createMpiScoringConfigTable()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('Migration failed:', err);
      process.exit(1);
    });
}

module.exports = { createMpiScoringConfigTable };
