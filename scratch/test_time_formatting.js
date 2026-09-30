const db = require('../backend/config/db');

// Import or copy formatDateTimeForDisplay logic to test
const formatDateTimeForDisplay = (dateVal) => {
  if (!dateVal) return 'N/A';
  let str = String(dateVal).trim();
  if (!str || str === 'null' || str === 'undefined') return 'N/A';

  if (str.includes('T') || str.includes(' ')) {
    const cleanStr = str.replace('T', ' ').split('.')[0].replace('Z', '');
    const [datePart, timePart] = cleanStr.split(' ');
    if (datePart && timePart) {
      const [year, month, day] = datePart.split('-');
      const timeComponents = timePart.split(':');
      if (year && month && day && timeComponents.length >= 2) {
        const hour = timeComponents[0].padStart(2, '0');
        const minute = timeComponents[1].padStart(2, '0');
        const formattedDay = day.padStart(2, '0');
        const formattedMonth = month.padStart(2, '0');
        return `${formattedDay}-${formattedMonth}-${year}, ${hour}:${minute}`;
      }
    }
  }

  const dateObj = new Date(str);
  if (isNaN(dateObj.getTime())) return str;

  const day = String(dateObj.getDate()).padStart(2, '0');
  const month = String(dateObj.getMonth() + 1).padStart(2, '0');
  const year = dateObj.getFullYear();
  const hours = String(dateObj.getHours()).padStart(2, '0');
  const minutes = String(dateObj.getMinutes()).padStart(2, '0');

  return `${day}-${month}-${year}, ${hours}:${minutes}`;
};

(async () => {
  try {
    const pool = await db.getPool();
    const res = await pool.request().query('SELECT TOP 5 log_id, created_at, contact_date FROM nurse_outreach_logs ORDER BY log_id DESC');
    console.log('Testing timestamp formatting for latest 5 DB records:');
    for (const row of res.recordset) {
      console.log(`Log #${row.log_id} | DB Raw created_at: ${row.created_at.toISOString()} | Formatted: ${formatDateTimeForDisplay(row.created_at.toISOString())}`);
    }
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
})();
