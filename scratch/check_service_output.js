const hfExportService = require('../backend/services/hfExportService');

async function test() {
  try {
    const data = await hfExportService.getHfSheet1ExportData();
    const fsIdx = data.headers.indexOf('Functional Status');
    console.log('fsIdx:', fsIdx);
    for (const r of data.rows) {
      const hfId = r[4];
      if (['HF00026', '26', 'HF00153', '153', 'HF00158', '158', 'HF00159', '159', 'HF00160', '160', 'HF00163', '163'].includes(hfId)) {
        console.log(`hfId: ${hfId}, UHID: ${r[1]}, Functional Status (idx ${fsIdx}): "${r[fsIdx]}", r[47]: "${r[47]}", r[48]: "${r[48]}", r[49]: "${r[49]}"`);
      }
    }
    process.exit(0);
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
}

test();

