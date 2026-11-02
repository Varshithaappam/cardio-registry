const { getHfSheet1ExportData } = require('../backend/services/hfExportService');

async function inspectColsAroundEf() {
    const data = await getHfSheet1ExportData();
    for (let i = 55; i <= 65; i++) {
        console.log(`Index ${i} (${data.headers[i]}): sample = ${data.rows[2][i]}`);
    }
    process.exit(0);
}
inspectColsAroundEf();

