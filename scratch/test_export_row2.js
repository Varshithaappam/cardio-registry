const { getHfSheet1ExportData } = require('../backend/services/hfExportService');

async function testExportRow2() {
    const data = await getHfSheet1ExportData();
    console.log('Total rows:', data.rows.length);
    for (let i = 0; i < Math.min(5, data.rows.length); i++) {
        const row = data.rows[i];
        console.log(`Row ${i+1}:`);
        console.log(`  UHID: ${row[2]}`);
        console.log(`  Col S (Adm Type): ${row[19]}`);
        console.log(`  Col T (Reasons other): ${row[20]}`);
        console.log(`  Col U (Reasons for adm): ${row[21]}`);
    }
    process.exit(0);
}
testExportRow2();

