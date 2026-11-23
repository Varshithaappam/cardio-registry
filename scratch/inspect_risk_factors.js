const { poolPromise } = require('../backend/config/db');

async function inspect() {
  try {
    const pool = await poolPromise;
    
    // Check STEMI tables and columns
    const cols = await pool.request().query(`
      SELECT COLUMN_NAME, TABLE_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE (TABLE_NAME LIKE 'stemi_%' OR TABLE_NAME LIKE 'nstemi_%')
      ORDER BY TABLE_NAME, COLUMN_NAME
    `);
    
    const relevantCols = cols.recordset.filter(c => 
      /timi|killip|risk|death|mortality|st_|ecg|crp|bnp|weight|reperfusion|stenosis|angina|marker|troponin|lvf|vt|vf|chb|bbb|anterior|hypertension|diabetes|sbp|pulse|heart_rate/i.test(c.COLUMN_NAME)
    );
    console.log('Total relevant cols:', relevantCols.length);
    console.log(JSON.stringify(relevantCols, null, 2));

  } catch (err) {
    console.error(err);
  } finally {
    process.exit(0);
  }
}

inspect();
