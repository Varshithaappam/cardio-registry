const db = require('../backend/config/db');
const gdmtService = require('../backend/services/gdmtService');
const hfExportService = require('../backend/services/hfExportService');

async function testAll() {
  console.log('Testing unified adherence and contraindications across Dashboard and Export Sheet...');

  const cohort = await gdmtService.getPatientsCohort();
  console.log(`Fetched ${cohort.length} patients from gdmtService.`);

  const exportData = await hfExportService.getHfSheet1ExportData();
  console.log(`Fetched ${exportData.count} patients from hfExportService.`);

  // Test the 5 cohort records from the user's screenshots: 20, 22, 24, 26, 54
  const testIds = [20, 22, 24, 26, 54];
  const cohortSub = cohort.filter(p => testIds.includes(p.hfId));

  console.log('\n--- 5-Record Cohort Verification ---');
  for (const p of cohortSub) {
    console.log(`HF_ID ${p.hfId} (${p.uhid}):`);
    console.log(`  Prescribed: BB=${p.betaBlocker}, ACE=${p.aceInhibitor}, ARB=${p.arb}, ARNI=${p.arni}, MRA=${p.mra}, SGLT2=${p.sglt2Inhibitor}`);
    console.log(`  Contraindication: BB=${p.contraBetaBlocker}, ACE=${p.contraAceInhibitor}, ARB=${p.contraArb}, ARNI=${p.contraArni}, MRA=${p.contraMra}, SGLT2=${p.contraSglt2Inhibitor}`);
    console.log(`  Deviations: ${p.deviationsCount}, Adherence: ${p.adherencePercent}%`);
  }

  const analytics = gdmtService.calculateCohortAnalytics(cohortSub);
  console.log('\n--- Performance Matrix for 5 Records ---');
  for (const item of analytics.performanceMatrix) {
    console.log(`  ${item.drugName}: onDrug=${item.prescribedCount} (${item.prescribedRate}%), withCI=${item.contraindicatedCount} (${item.contraindicatedRate}%)`);
  }

  console.log('\n--- Full Registry (137 Records) Summary ---');
  const fullAnalytics = gdmtService.calculateCohortAnalytics(cohort);
  console.log(`Mean Adherence: ${fullAnalytics.kpi.meanAdherencePercent}%`);
  for (const item of fullAnalytics.performanceMatrix) {
    console.log(`  ${item.drugName}: onDrug=${item.prescribedCount} (${item.prescribedRate}%), withCI=${item.contraindicatedCount} (${item.contraindicatedRate}%)`);
  }

  process.exit(0);
}

testAll().catch(err => {
  console.error(err);
  process.exit(1);
});
