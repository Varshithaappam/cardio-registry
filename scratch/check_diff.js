const db = require('../backend/config/db');
const hfExportService = require('../backend/services/hfExportService');
const gdmtService = require('../backend/services/gdmtService');

async function check() {
  const cohort = await gdmtService.getPatientsCohort();
  const exportData = await hfExportService.getHfSheet1ExportData();

  // Find which filter produced 71 patients on the user's screen
  // User had 71 patients. Let's see: maybe patients with some filter, or first 71?
  // Let's check all patients in cohort who have nyha4:
  cohort.forEach((p, idx) => {
    const isIV = String(p.functionalStatus || '').toUpperCase().includes('IV');
    if (isIV) {
      // Find matching row in exportData
      const sheetRow = exportData.rows.find(r => Number(r[4].replace(/\D/g, '')) === p.hfId);
      const avVal = sheetRow ? sheetRow[exportData.headers.indexOf('Functional Status')] : 'NOT FOUND';
      console.log(`hfId: ${p.hfId}, cohort functionalStatus: "${p.functionalStatus}", Sheet1 AV: "${avVal}"`);
    }
  });

  process.exit(0);
}
check().catch(console.error);

