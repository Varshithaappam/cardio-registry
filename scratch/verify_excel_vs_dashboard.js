const gdmtService = require('../backend/services/gdmtService');
const hfExportService = require('../backend/services/hfExportService');

async function verify() {
  console.log('Fetching patients from gdmtService...');
  const patients = await gdmtService.getPatientsCohort();
  const cohort = patients;
  const sheet1Data = await hfExportService.getHfSheet1ExportData();

  console.log(`Total patients: ${cohort.length}`);
  console.log(`Sheet1 backend rows: ${sheet1Data.rows.length}`);

  let mismatches = 0;
  for (let i = 0; i < cohort.length; i++) {
    const p = cohort[i];
    const s1Row = sheet1Data.rows[i];
    
    const s1CiBB = s1Row[83];
    const s1CiAce = s1Row[84];
    const s1CiArb = s1Row[85];
    const s1CiArni = s1Row[86];
    const s1CiMra = s1Row[87];
    const s1CiSglt2 = s1Row[88];
    const s1Dev = s1Row[95];

    if (
      p.contraBetaBlocker !== s1CiBB ||
      p.contraAceInhibitor !== s1CiAce ||
      p.contraArb !== s1CiArb ||
      p.contraArni !== s1CiArni ||
      p.contraMra !== s1CiMra ||
      p.contraSglt2Inhibitor !== s1CiSglt2 ||
      p.deviationsCount !== s1Dev
    ) {
      mismatches++;
      console.log(`Mismatch at patient HF_ID ${p.hfId}: Dashboard CI [${p.contraBetaBlocker},${p.contraAceInhibitor},${p.contraArb},${p.contraArni},${p.contraMra},${p.contraSglt2Inhibitor}] vs Sheet1 [${s1CiBB},${s1CiAce},${s1CiArb},${s1CiArni},${s1CiMra},${s1CiSglt2}]`);
    }
  }

  console.log(`\nVerification complete: ${mismatches} mismatches found across ${cohort.length} patients.`);

  process.exit(0);
}

verify().catch(e => {
  console.error(e);
  process.exit(1);
});
