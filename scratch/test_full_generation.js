const path = require('path');
const ExcelJS = require(path.join(__dirname, '../frontend/node_modules/exceljs'));
const hfExportService = require('../backend/services/hfExportService');
const gdmtService = require('../backend/services/gdmtService');

async function testExport() {
  try {
    const patients = await gdmtService.getPatientsCohort();
    const analytics = gdmtService.calculateCohortAnalytics(patients);
    const sheet1Data = await hfExportService.getHfSheet1ExportData();

    console.log(`Loaded ${patients.length} patients and ${sheet1Data.rows.length} sheet1 rows.`);

    // Check NYHA IV count in Sheet1 now that hfExportService has been updated:
    const fsIdx = sheet1Data.headers.indexOf('Functional Status');
    const sheet1Nyha4 = sheet1Data.rows.filter(r => String(r[fsIdx] || '').toUpperCase().includes('IV')).length;
    console.log(`Sheet1 NYHA IV count with updated order: ${sheet1Nyha4}`);

    // Check EF values in Sheet1:
    const efIdx = sheet1Data.headers.indexOf('EF%');
    const sheet1Efs = sheet1Data.rows.map(r => Number(r[efIdx])).filter(e => !isNaN(e) && e > 0);
    const sheet1MeanEf = Math.round((sheet1Efs.reduce((a, b) => a + b, 0) / sheet1Efs.length) * 10) / 10;
    console.log(`Sheet1 Mean EF: ${sheet1MeanEf}, analytics.meanEf: ${analytics.meanEf}`);
    process.exit(0);
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
}

testExport();
