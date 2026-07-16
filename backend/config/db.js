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

// Test Database Connection
(async () => {
    try {
        const connection = await pool.getConnection();
        console.log("✅ MySQL Database Connected Successfully");
        connection.release();
    } catch (error) {
        console.error("❌ MySQL Connection Failed");
        console.error(error.message);
    }
})();

module.exports = pool;