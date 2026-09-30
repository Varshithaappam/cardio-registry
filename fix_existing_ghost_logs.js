const db = require('./backend/config/db');

async function fixGhostLogs() {
  try {
    const pool = await db.getPool();
    const result = await pool.request().query(`
      UPDATE nurse_outreach_logs
      SET outcome = 'Detailed Form Logged', contact_mode = 'Detailed Form Submission'
      WHERE raw_form_json IS NOT NULL 
        AND (outcome = 'Patient Contacted & Appointment Confirmed' OR contact_mode = 'Phone Call');
    `);
    console.log(`✅ Updated ${result.rowsAffected[0]} ghost outreach log entries to 'Detailed Form Logged'.`);
    process.exit(0);
  } catch (err) {
    console.error("❌ Error updating ghost logs:", err);
    process.exit(1);
  }
}

fixGhostLogs();
