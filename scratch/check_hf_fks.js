const { sql, poolPromise } = require('../backend/config/db');

async function checkHF_FKs() {
    const pool = await poolPromise;
    const res = await pool.request().query(`
        SELECT 
            fk.name AS FK_name,
            tp.name AS TableWithFK,
            cp.name AS ColumnWithFK,
            ref.name AS ReferencedTable
        FROM sys.foreign_keys fk
        JOIN sys.foreign_key_columns fkc ON fk.object_id = fkc.constraint_object_id
        JOIN sys.tables tp ON fk.parent_object_id = tp.object_id
        JOIN sys.columns cp ON fkc.parent_object_id = cp.object_id AND fkc.parent_column_id = cp.column_id
        JOIN sys.tables ref ON fk.referenced_object_id = ref.object_id
        WHERE ref.name IN ('hf_registry', 'stemi_registry', 'nstemi_registry')
    `);
    console.log(JSON.stringify(res.recordset, null, 2));
    process.exit(0);
}
checkHF_FKs();

