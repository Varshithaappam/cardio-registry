const db = require('../backend/config/db');
const hfExportService = require('../backend/services/hfExportService');
const gdmtService = require('../backend/services/gdmtService');

async function check() {
  const cohort = await gdmtService.getPatientsCohort();
  const exportData = await hfExportService.getHfSheet1ExportData();

  console.log('Cohort total:', cohort.length);
  console.log('Export data total:', exportData.rows.length);

  // Check functionalStatus in cohort
  const cohortIV = cohort.filter(p => String(p.functionalStatus || '').includes('IV'));
  console.log('Cohort Class IV count:', cohortIV.length);
  cohortIV.forEach(p => console.log('Cohort IV hfId:', p.hfId, 'status:', p.functionalStatus));

  // Check Functional Status in Sheet1 exportData
  const avIdx = exportData.headers.indexOf('Functional Status');
  const exportIV = exportData.rows.filter(r => String(r[avIdx] || '').includes('IV'));
  console.log('Export Data Class IV count:', exportIV.length);
  exportIV.forEach(r => console.log('Export IV hfId:', r[4], 'status:', r[avIdx]));

  process.exit(0);
}
check().catch(console.error);

