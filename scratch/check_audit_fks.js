const { poolPromise } = require('../backend/config/db');

async function checkAuditFKs() {
    const pool = await poolPromise;
    const res = await pool.request().query(`
        SELECT 
            fk.name AS FK_name,
            tp.name AS TableWithFK,
            cp.name AS ColumnWithFK,
            ref.name AS ReferencedTable,
            cr.name AS ReferencedColumn
        FROM sys.foreign_keys fk
        JOIN sys.foreign_key_columns fkc ON fk.object_id = fkc.constraint_object_id
        JOIN sys.tables tp ON fk.parent_object_id = tp.object_id
        JOIN sys.columns cp ON fkc.parent_object_id = cp.object_id AND fkc.parent_column_id = cp.column_id
        JOIN sys.tables ref ON fk.referenced_object_id = ref.object_id
        JOIN sys.columns cr ON fkc.referenced_object_id = cr.object_id AND fkc.referenced_column_id = cr.column_id
        WHERE tp.name IN ('patient_match_audit', 'patient_staging') 
           OR ref.name IN ('patient_match_audit', 'patient_staging')
    `);
    console.log(JSON.stringify(res.recordset, null, 2));
    process.exit(0);
}
checkAuditFKs();

