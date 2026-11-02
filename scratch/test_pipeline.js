const path = require('path');
const ExcelJS = require(path.join(__dirname, '../frontend/node_modules/exceljs'));
const hfExportService = require('../backend/services/hfExportService');
const gdmtService = require('../backend/services/gdmtService');

async function testPipeline() {
  try {
    const patients = await gdmtService.getPatientsCohort();
    const analytics = gdmtService.calculateCohortAnalytics(patients);
    const sheet1Data = await hfExportService.getHfSheet1ExportData();

    console.log(`Patients: ${patients.length}, Sheet1 rows: ${sheet1Data.rows.length}`);

    const workbook = new ExcelJS.Workbook();
    const wsKeyPoints = workbook.addWorksheet('Key Points');
    const wsGdmtSummary = workbook.addWorksheet('GDMT Summary');
    const wsSheet1 = workbook.addWorksheet('Sheet1');
    const wsContra = workbook.addWorksheet('Contraindications');
    const wsCiFlags = workbook.addWorksheet('CI Flags');

    // Simulate Sheet1 rows
    const admission2Idx = sheet1Data.headers.findIndex(h => /reasons for admission\s*2/i.test(h));
    const processedSheet1Rows = sheet1Data.rows.map((raw, idx) => {
      const r = [...raw];
      if (admission2Idx !== -1) r.splice(admission2Idx, 1);
      r[0] = idx + 1;
      r[2] = r[3] || r[2] || '';
      return r;
    });

    console.log('Processed Sheet1 rows count:', processedSheet1Rows.length);
    console.log('Functional Status (col 47) sample:', processedSheet1Rows.slice(0, 5).map(r => r[47]));

    const nyha4Count = processedSheet1Rows.filter(r => String(r[47] || '').toUpperCase().includes('IV')).length;
    console.log('Count of NYHA IV in processed Sheet1:', nyha4Count);

    const efVals = processedSheet1Rows.map(r => Number(r[61])).filter(e => !isNaN(e) && e > 0);
    const meanEf = Math.round((efVals.reduce((a, b) => a + b, 0) / efVals.length) * 10) / 10;
    console.log('Mean EF from non-blank Sheet1 cells:', meanEf);

    process.exit(0);
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
}

testPipeline();

