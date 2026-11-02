const gdmtService = require('../backend/services/gdmtService');

async function check() {
    const patients = await gdmtService.getPatientsCohort();
    const cohort5 = patients.filter(p => [20, 22, 24, 26, 54].includes(p.hfId));
    console.log(`Found ${cohort5.length} matching patients`);
    
    for (const p of cohort5) {
        console.log(`\nPatient HF_ID=${p.hfId}, UHID=${p.uhid}`);
        for (const [k, v] of Object.entries(p.pillarEvaluations || {})) {
            console.log(`  ${k}: prescribed=${v.prescribed}, CI=${v.contraindication}`);
        }
    }

    const analytics = gdmtService.calculateCohortAnalytics(cohort5);
    console.log('\nCohort Performance Matrix:');
    for (const p of analytics.performanceMatrix) {
        console.log(`  ${p.drugName}: onDrug=${p.prescribedCount} (${p.prescribedRate}%), withCI=${p.contraindicatedCount} (${p.contraindicatedRate}%)`);
    }
    process.exit(0);
}

check();

