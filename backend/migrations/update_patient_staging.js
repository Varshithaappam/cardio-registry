const db = require('../config/db');

async function migratePatientStaging() {
  const pool = await db.getPool();
  console.log('Checking / Updating columns for dbo.patient_staging...');

  const columnsToAdd = [
    { name: 'mr_no', type: 'VARCHAR(10) NULL' },
    { name: 'ip_no', type: 'VARCHAR(10) NULL' },
    { name: 'blood_group', type: 'NVARCHAR(7) NULL' },
    { name: 'insurance_mode', type: 'NVARCHAR(24) NULL' },
    { name: 'email', type: 'VARCHAR(100) NULL' },
    { name: 'address', type: 'VARCHAR(500) NULL' },
    { name: 'house_flat_no', type: 'NVARCHAR(100) NULL' },
    { name: 'street_locality', type: 'NVARCHAR(255) NULL' },
    { name: 'village_town', type: 'NVARCHAR(150) NULL' },
    { name: 'mandal', type: 'NVARCHAR(100) NULL' },
    { name: 'district', type: 'NVARCHAR(100) NULL' },
    { name: 'state', type: 'NVARCHAR(100) NULL' },
    { name: 'pincode', type: 'VARCHAR(10) NULL' },
    { name: 'higher_education', type: 'NVARCHAR(13) NULL' },
    { name: 'occupation', type: 'VARCHAR(255) NULL' },
    { name: 'hypertension', type: 'NVARCHAR(7) NULL' },
    { name: 'smoking', type: 'NVARCHAR(7) NULL' },
    { name: 'diabetes', type: 'NVARCHAR(7) NULL' },
    { name: 'diabetes_control_type', type: 'NVARCHAR(26) NULL' },
    { name: 'renal_failure', type: 'NVARCHAR(7) NULL' },
    { name: 'active_dialysis_status', type: 'NVARCHAR(14) NULL' },
    { name: 'raw_payload', type: 'NVARCHAR(MAX) NULL' }
  ];

  for (const col of columnsToAdd) {
    await pool.request().query(`
      IF NOT EXISTS (
        SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_NAME = 'patient_staging' AND COLUMN_NAME = '${col.name}'
      )
      BEGIN
        ALTER TABLE dbo.patient_staging ADD [${col.name}] ${col.type};
        PRINT 'Added column ${col.name}';
      END
    `);
  }

  console.log('✓ dbo.patient_staging schema verified.');
}

if (require.main === module) {
  migratePatientStaging().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
}

module.exports = { migratePatientStaging };
