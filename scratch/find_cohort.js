const gdmtService = require('../backend/services/gdmtService');
const hfExportService = require('../backend/services/hfExportService');

async function check() {
  const cohort = await gdmtService.getPatientsCohort();
  const exportData = await hfExportService.getHfSheet1ExportData();

  console.log('Total in cohort:', cohort.length);
  // Let's check patients with non-null admissionDate or something?
  // Let's check unique UHIDs:
  const uhids = new Set(cohort.map(p => p.uhid));
  console.log('Total unique UHIDs in cohort:', uhids.size);

  // In Image 1: UHIDs: 31, Total HF Records: 71
  // Let's check if there are 71 records where something is true, or maybe the export was done with 71 patients
  // Let's check which 71 patients have:
  // Male: 23, Female: 8 among unique patients (or in records: Male: 34, Female: 37 in Image 2!)
  // Look at Image 2:
  // Male: 34 Sheet1 col I
  // Female: 37 Sheet1 col I
  // 34 + 37 = 71!
  // HFrEF: 50 Sheet1 col AO
  // HFpEF: 10 Sheet1 col AO
  // NYHA III: 12
  // NYHA IV in Image 2: 3, but in Image 3: 2!
  // Why did Image 3 have 2 for NYHA IV, but Image 2 had 3?
  // And Mean EF%: Image 2 had 38.3, but Image 3 had 36.8!

  process.exit(0);
}
check().catch(console.error);

