const { poolPromise } = require('../backend/config/db');

async function testHfRisk() {
  try {
    const pool = await poolPromise;
    const res = await pool.request().query(`
      SELECT 
        ha.hf_id, ha.reg_patient_id, p.age,
        ha.hypertension, ha.diabetes, ha.cad, ha.ckd, ha.af, ha.ef_percent, ha.nyha_class,
        fa.death_hospital, fa.death_any
      FROM dbo.hf_administrative ha
      LEFT JOIN dbo.patients p ON ha.reg_patient_id = p.reg_patient_id
      LEFT JOIN dbo.hf_final_clinical_assessment fa ON ha.hf_id = fa.hf_id
    `);
    
    const hfRecs = res.recordset;
    const isDeceased = p => p.death_hospital === 'Yes' || p.death_hospital === '1' || p.death_any === 'Yes' || p.death_any === '1';
    const aliveCohort = hfRecs.filter(p => !isDeceased(p));
    const deceasedCohort = hfRecs.filter(p => isDeceased(p));
    
    console.log(`HF: ${aliveCohort.length} alive, ${deceasedCohort.length} deceased`);
    
    const defs = [
      { name: 'HFrEF (LVEF < 40%)', check: p => Number(p.ef_percent || 50) < 40 },
      { name: 'Hypertension', check: p => p.hypertension === 'Yes' },
      { name: 'Diabetes', check: p => p.diabetes === 'Yes' },
      { name: 'NYHA Class III / IV', check: p => ['III', 'IV', 'Class III', 'Class IV'].includes(p.nyha_class) },
      { name: 'Renal dysfunction / CKD', check: p => p.ckd === 'Yes' },
      { name: 'Age 65 or older', check: p => Number(p.age || 0) >= 65 },
      { name: 'Prior CAD / MI', check: p => p.cad === 'Yes' },
      { name: 'Atrial Fibrillation (AF)', check: p => p.af === 'Yes' }
    ];
    
    const items = defs.map(d => {
      const aliveN = aliveCohort.filter(d.check).length;
      const deadN = deceasedCohort.filter(d.check).length;
      return {
        name: d.name,
        aliveN,
        alivePct: Math.round((aliveN / aliveCohort.length) * 1000) / 10,
        deadN,
        deadPct: deceasedCohort.length > 0 ? Math.round((deadN / deceasedCohort.length) * 1000) / 10 : 0
      };
    }).sort((a, b) => b.alivePct - a.alivePct);
    
    console.table(items);

  } catch (err) {
    console.error(err);
  } finally {
    process.exit(0);
  }
}

testHfRisk();
