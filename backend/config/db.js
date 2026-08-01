const mysql = require("mysql2/promise");
require("dotenv").config();

const pool = mysql.createPool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,

    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,

    timezone: "+05:30"
});

// Test Database Connection & Ensure Audit Table Schema Columns
(async () => {
    try {
        const connection = await pool.getConnection();
        console.log("✅ MySQL Database Connected Successfully");

        // Dynamically add previous_values and new_values columns to hf_registry_audit if not present
        try {
            await connection.execute(`
                ALTER TABLE hf_registry_audit 
                ADD COLUMN previous_values TEXT NULL,
                ADD COLUMN new_values TEXT NULL
            `);
            console.log("✅ Added previous_values and new_values columns to hf_registry_audit");
        } catch (err) {
            // Ignore if columns already exist
        }

        // Dynamically add soft delete columns to hf_registry if not present
        try {
            await connection.execute(`
                ALTER TABLE hf_registry 
                ADD COLUMN is_deleted TINYINT(1) DEFAULT 0 NOT NULL,
                ADD COLUMN deleted_at TIMESTAMP NULL DEFAULT NULL,
                ADD COLUMN deleted_by INT NULL DEFAULT NULL
            `);
            console.log("✅ Added soft-delete columns (is_deleted, deleted_at, deleted_by) to hf_registry");
        } catch (err) {
            // Ignore if columns already exist
        }

        // Auto-fix any 'Unknown' or NULL care_mr_no entries in hf_administrative from patients table
        try {
            await connection.execute(`
                UPDATE hf_administrative a
                JOIN hf_registry hf ON a.hf_id = hf.hf_id
                JOIN patients p ON hf.patient_id = p.patient_id
                SET a.care_mr_no = p.mr_no
                WHERE a.care_mr_no = 'Unknown' OR a.care_mr_no IS NULL
            `);
            console.log("✅ Auto-corrected care_mr_no values in hf_administrative from patients table");
        } catch (err) {
            // Ignore if query fails
        }

        connection.release();
    } catch (error) {
        console.error("❌ MySQL Connection Failed");
        console.error(error.message);
    }
})();

module.exports = pool;