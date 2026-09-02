const db = require('../config/db');

async function updateAuditFK() {
  const pool = await db.getPool();
  console.log('Updating FK constraints on patient_match_audit...');

  await pool.request().query(`
    IF EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = 'FK_audit_candidate')
    BEGIN
      ALTER TABLE [patient_match_audit] DROP CONSTRAINT [FK_audit_candidate];
      PRINT 'Dropped legacy FK_audit_candidate referencing patient_demographics';
    END

    IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = 'FK_audit_staging')
    BEGIN
      ALTER TABLE [patient_match_audit] WITH NOCHECK ADD CONSTRAINT [FK_audit_staging] 
      FOREIGN KEY ([candidate_patient_id]) REFERENCES [patient_staging]([staging_id]);
      PRINT 'Added FK_audit_staging referencing patient_staging(staging_id)';
    END
  `);

  console.log('✓ Foreign key constraints updated.');
}

if (require.main === module) {
  updateAuditFK().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
}

module.exports = { updateAuditFK };
