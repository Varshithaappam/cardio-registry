const { getHfSheet1ExportData } = require('../backend/services/hfExportService');

function indexToExcelCol(idx) {
    let s = '';
    while (idx > 0) {
        let m = (idx - 1) % 26;
        s = String.fromCharCode(65 + m) + s;
        idx = Math.floor((idx - m) / 26);
    }
    return s;
}

async function checkSheet1Columns() {
    const data = await getHfSheet1ExportData();
    // In buildSheet1 in excelReportGenerator.js:
    // It takes sheet1Data.headers, removes Reasons for Admission2, renames Reasons for admission3 to admission type
    const headers = [...data.headers];
    const admission2Idx = headers.findIndex(h => /reasons for admission\s*2/i.test(h));
    const admission3Idx = headers.findIndex(h => /reasons for admission\s*3/i.test(h));
    if (admission3Idx !== -1) {
        headers[admission3Idx] = 'admission type';
    }
    if (admission2Idx !== -1) {
        headers.splice(admission2Idx, 1);
    }

    console.log(`Total columns in Sheet1: ${headers.length}\n`);
    headers.forEach((h, i) => {
        const colLetter = indexToExcelCol(i + 1);
        console.log(`${colLetter} (${i+1}): "${h}"`);
    });
    process.exit(0);
}
checkSheet1Columns();

