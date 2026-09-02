const db = require('../config/db');

async function addCreatedByToStaging() {
  const pool = await db.getPool();
  console.log('Checking created_by column in dbo.patient_staging...');

  await pool.request().query(`
    IF NOT EXISTS (
      SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_NAME = 'patient_staging' AND COLUMN_NAME = 'created_by'
    )
    BEGIN
      ALTER TABLE dbo.patient_staging ADD [created_by] VARCHAR(100) NULL;
      PRINT 'Added created_by column to dbo.patient_staging';
    END
    ELSE
    BEGIN
      PRINT 'created_by column already exists in dbo.patient_staging';
    END
  `);

  console.log('✓ Migration addCreatedByToStaging completed.');
}

if (require.main === module) {
  addCreatedByToStaging()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('Migration failed:', err);
      process.exit(1);
    });
}

module.exports = { addCreatedByToStaging };
