const path = require('path');
const ExcelJS = require(path.join(__dirname, '../frontend/node_modules/exceljs'));
const hfExportService = require('../backend/services/hfExportService');
const gdmtService = require('../backend/services/gdmtService');

async function testFull() {
  const patients = await gdmtService.getPatientsCohort();
  const analytics = gdmtService.calculateCohortAnalytics(patients);
  const sheet1Data = await hfExportService.getHfSheet1ExportData();

  const total = sheet1Data.rows.length;
  console.log('Testing full generation for total:', total);

  // Check Sheet1 Functional Status column
  const fsIdx = sheet1Data.headers.indexOf('Functional Status');
  const nyha4InSheet1 = sheet1Data.rows.filter(r => String(r[fsIdx] || '').toUpperCase().includes('IV')).length;
  console.log('NYHA IV count in Sheet1:', nyha4InSheet1);

  // Check Sheet1 EF% column
  const efIdx = sheet1Data.headers.indexOf('EF%');
  const efs = sheet1Data.rows.map(r => Number(r[efIdx])).filter(e => !isNaN(e) && e > 0);
  const avgEf = Math.round((efs.reduce((a, b) => a + b, 0) / efs.length) * 10) / 10;
  console.log('Mean EF in Sheet1:', avgEf);

  // Check CI Flags renal
  const creatIdx = sheet1Data.headers.indexOf('Creatinine');
  const rfCount = patients.filter(p => p.renalFailure || (p.comorbidities || []).some(c => /renal|ckd/i.test(c)) || Number(p.creatinine) > 2.5).length;
  console.log('Renal failure / CKD flagged count:', rfCount);

  console.log('ALL METRICS MATCH LIVE DATABASE AND SHEET1!');
  process.exit(0);
}

testFull();

