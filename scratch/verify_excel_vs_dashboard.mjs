import ExcelJS from 'exceljs';
import gdmtService from '../backend/services/gdmtService.js';
import hfExportService from '../backend/services/hfExportService.js';

async function verify() {
  console.log('Fetching patients from gdmtService...');
  const patients = await gdmtService.getPatientsCohort();
  const cohort5 = patients.filter(p => [20, 22, 24, 26, 54].includes(p.hfId));
  const sheet1Data = await hfExportService.getHfSheet1ExportData('20,22,24,26,54');

  console.log(`Cohort size: ${cohort5.length}`);
  console.log(`Sheet1 backend rows: ${sheet1Data.rows.length}`);

  for (let i = 0; i < cohort5.length; i++) {
    const p = cohort5[i];
    const s1Row = sheet1Data.rows[i];
    
    // Check known contraindications from Sheet1 vs Patient
    // Sheet1 backend indices:
    // 83: ciBB, 84: ciAce, 85: ciArb, 86: ciArni, 87: ciMra, 88: ciSglt2
    const s1CiBB = s1Row[82];
    const s1CiAce = s1Row[83];
    const s1CiArb = s1Row[84];
    const s1CiArni = s1Row[85];
    const s1CiMra = s1Row[86];
    const s1CiSglt2 = s1Row[87];

    console.log(`\nPatient HF_ID ${p.hfId}:`);
    console.log(`  BB CI:   Dashboard=${p.contraBetaBlocker}, Sheet1=${s1CiBB} => ${p.contraBetaBlocker === s1CiBB ? 'MATCH' : 'MISMATCH'}`);
    console.log(`  ACE CI:  Dashboard=${p.contraAceInhibitor}, Sheet1=${s1CiAce} => ${p.contraAceInhibitor === s1CiAce ? 'MATCH' : 'MISMATCH'}`);
    console.log(`  ARB CI:  Dashboard=${p.contraArb}, Sheet1=${s1CiArb} => ${p.contraArb === s1CiArb ? 'MATCH' : 'MISMATCH'}`);
    console.log(`  ARNI CI: Dashboard=${p.contraArni}, Sheet1=${s1CiArni} => ${p.contraArni === s1CiArni ? 'MATCH' : 'MISMATCH'}`);
    console.log(`  MRA CI:  Dashboard=${p.contraMra}, Sheet1=${s1CiMra} => ${p.contraMra === s1CiMra ? 'MATCH' : 'MISMATCH'}`);
    console.log(`  SGLT2 CI: Dashboard=${p.contraSglt2Inhibitor}, Sheet1=${s1CiSglt2} => ${p.contraSglt2Inhibitor === s1CiSglt2 ? 'MATCH' : 'MISMATCH'}`);

    const s1Dev = s1Row[94];
    const s1Adh = s1Row[96];
    console.log(`  Deviations: Dashboard=${p.deviationsCount}, Sheet1=${s1Dev} => ${p.deviationsCount === s1Dev ? 'MATCH' : 'MISMATCH'}`);
    console.log(`  Adherence %: Dashboard=${p.adherencePercent}%, Sheet1=${s1Adh * 100}%`);
  }

  process.exit(0);
}

verify().catch(e => {
  console.error(e);
  process.exit(1);
});

