const db = require('../config/db');

async function prunePatientStaging() {
  const pool = await db.getPool();
  console.log('Pruning extra clinical and expanded address columns from dbo.patient_staging...');

  const columnsToDrop = [
    'ip_no',
    'blood_group',
    'insurance_mode',
    'higher_education',
    'occupation',
    'hypertension',
    'smoking',
    'diabetes',
    'diabetes_control_type',
    'renal_failure',
    'active_dialysis_status',
    'house_flat_no',
    'street_locality',
    'village_town',
    'mandal',
    'district',
    'state'
  ];

  for (const col of columnsToDrop) {
    await pool.request().query(`
      IF EXISTS (
        SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_NAME = 'patient_staging' AND COLUMN_NAME = '${col}'
      )
      BEGIN
        ALTER TABLE dbo.patient_staging DROP COLUMN [${col}];
        PRINT 'Dropped column: ${col}';
      END
    `);
  }

  // Ensure email, pincode, address, and raw_payload exist in lean schema
  const requiredColumns = [
    { name: 'email', type: 'VARCHAR(100) NULL' },
    { name: 'pincode', type: 'VARCHAR(10) NULL' },
    { name: 'address', type: 'VARCHAR(500) NULL' },
    { name: 'mr_no', type: 'VARCHAR(10) NULL' },
    { name: 'raw_payload', type: 'NVARCHAR(MAX) NULL' }
  ];

  for (const col of requiredColumns) {
    await pool.request().query(`
      IF NOT EXISTS (
        SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_NAME = 'patient_staging' AND COLUMN_NAME = '${col.name}'
      )
      BEGIN
        ALTER TABLE dbo.patient_staging ADD [${col.name}] ${col.type};
        PRINT 'Added missing column: ${col.name}';
      END
    `);
  }

  const res = await pool.request().query(`
    SELECT COLUMN_NAME, DATA_TYPE 
    FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_NAME = 'patient_staging'
  `);
  console.log('Final columns in dbo.patient_staging:', res.recordset.map(c => c.COLUMN_NAME));
  console.log('✓ dbo.patient_staging schema pruned successfully.');
}

if (require.main === module) {
  prunePatientStaging()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('Migration failed:', err);
      process.exit(1);
    });
}

module.exports = { prunePatientStaging };
