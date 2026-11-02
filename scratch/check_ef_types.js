const { getHfSheet1ExportData } = require('../backend/services/hfExportService');

async function checkEfValues() {
    const data = await getHfSheet1ExportData();
    // In Sheet1, EF% is at index 61 (62nd column)
    console.log('Total rows:', data.rows.length);
    const efValues = data.rows.map(r => r[61]);
    console.log('Sample EF values:', efValues.slice(0, 10));
    console.log('Types:', efValues.slice(0, 10).map(v => typeof v));
    process.exit(0);
}
checkEfValues();

