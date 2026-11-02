const db = require('../backend/config/db');
const gdmtService = require('../backend/services/gdmtService');

async function check() {
    try {
        const patients = await gdmtService.getPatientsCohort();
        console.log(`Total patients: ${patients.length}`);
        
        // Find the 5 patients (or top 5)
        const top5 = patients.slice(0, 5);
        for (let i = 0; i < top5.length; i++) {
            const p = top5[i];
            console.log(`\nPatient ${i+1}: HF_ID=${p.hfId}, UHID=${p.uhid}`);
            console.log('Pillar evaluations:');
            for (const [k, v] of Object.entries(p.pillarEvaluations || {})) {
                console.log(`  ${k}: prescribed=${v.prescribed}, contraindication=${v.contraindication}, reasons=${JSON.stringify(v.reasons || [])}`);
            }
        }

        const analytics = gdmtService.calculateCohortAnalytics(top5);
        console.log('\nTop 5 Performance Matrix:');
        for (const p of analytics.performanceMatrix) {
            console.log(`  ${p.drugName}: onDrug=${p.prescribedCount} (${p.prescribedRate}%), withCI=${p.contraindicatedCount} (${p.contraindicatedRate}%)`);
        }
        
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}

check();

