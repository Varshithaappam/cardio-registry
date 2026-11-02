const { getHfSheet1ExportData } = require('../backend/services/hfExportService');

async function findWhichHfId() {
    const data = await getHfSheet1ExportData();
    // find the row where Col U matches that string
    for (let i = 0; i < data.rows.length; i++) {
        const row = data.rows[i];
        if (row[21] && row[21].includes('Myocardial ischemia, Atrial fibrillation, Bradyarrhythmia')) {
            console.log(`Found at index ${i}:`);
            console.log('  SL No:', row[0]);
            console.log('  UHID:', row[1]);
            console.log('  IP No:', row[2]);
            console.log('  HF Reg No:', row[4]);
            console.log('  Col U:', row[21]);
        }
    }
    process.exit(0);
}
findWhichHfId();

