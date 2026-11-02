const { query } = require('../backend/config/db');
const hfExportService = require('../backend/services/hfExportService');
const gdmtService = require('../backend/services/gdmtService');

async function test() {
  try {
    const patients = await gdmtService.getPatientsCohort();
    console.log('Total patients in gdmtService:', patients.length);

    // Let's check patients where functionalStatus has IV
    const nyha4InCohort = patients.filter(p => String(p.functionalStatus || '').toUpperCase().includes('IV'));
    console.log('NYHA IV patients in patients:', nyha4InCohort.length);
    nyha4InCohort.forEach(p => {
      console.log(`hfId: ${p.hfId}, uhid: ${p.uhid}, functionalStatus: "${p.functionalStatus}"`);
    });

    const exportData = await hfExportService.getHfSheet1ExportData();
    const fsIdx = exportData.headers.indexOf('Functional Status');
    console.log('Functional Status column in exportData is index:', fsIdx);

    // Check which rows in exportData have IV in Functional Status
    const nyha4InSheet1 = exportData.rows.filter(r => String(r[fsIdx] || '').toUpperCase().includes('IV'));
    console.log('NYHA IV rows in exportData:', nyha4InSheet1.length);
    nyha4InSheet1.forEach(r => {
      console.log(`hfId: ${r[4]}, uhid: ${r[1]}, fs: "${r[fsIdx]}"`);
    });

    process.exit(0);
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
}

test();

