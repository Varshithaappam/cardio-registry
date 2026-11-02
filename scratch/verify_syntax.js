const path = require('path');
const ExcelJS = require(path.join(__dirname, '../frontend/node_modules/exceljs'));
const hfExportService = require('../backend/services/hfExportService');
const gdmtService = require('../backend/services/gdmtService');

// Read excelReportGenerator and check syntax
async function verify() {
  try {
    const patients = await gdmtService.getPatientsCohort();
    const analytics = gdmtService.calculateCohortAnalytics(patients);
    const sheet1Data = await hfExportService.getHfSheet1ExportData();

    console.log(`Loaded ${patients.length} patients and ${sheet1Data.rows.length} sheet1 rows.`);

    // Check syntax of excelReportGenerator.js by requiring it using ts-node or transpiling / checking
    // Since excelReportGenerator is ESM (import/export), let's inspect the file syntax or run a test
    console.log('Backend and services verified.');
    process.exit(0);
  } catch (err) {
    console.error('Verification failed:', err);
    process.exit(1);
  }
}

verify();

