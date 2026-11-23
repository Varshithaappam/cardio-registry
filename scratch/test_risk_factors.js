const { poolPromise } = require('../backend/config/db');

async function testRiskFactors() {
  try {
    const pool = await poolPromise;
    
    // Query NSTEMI cohort
    const nstemiRes = await pool.request().query(`
      SELECT 
        a.nstemi_id,
        a.reg_patient_id,
        p.age,
        adm.hypertension,
        adm.diabetes,
        c.st_deviation_at_admission,
        c.anterior_mi_or_lbbb,
        c.elevated_crp,
        c.elevated_bnp,
        c.heart_rate_gt_100,
        c.killip_class_ii_to_iv,
        c.lvf,
        c.reperfusion_gt_4hrs,
        c.sbp_lt_100,
        c.vt_vf,
        c.weight_lt_67kg,
        c.bbb_chb,
        c.anginal_episodes_ge_2_last_24hrs,
        c.chd_risk_factors_ge_3,
        c.prior_coronary_stenosis_gt_50,
        c.elevated_serum_cardiac_markers,
        o.death
      FROM dbo.nstemi_admission_details a
      LEFT JOIN dbo.patients p ON a.reg_patient_id = p.reg_patient_id
      LEFT JOIN dbo.nstemi_administrative adm ON a.nstemi_id = adm.nstemi_id
      LEFT JOIN dbo.nstemi_clinical_assessment c ON a.nstemi_id = c.nstemi_id
      LEFT JOIN dbo.nstemi_outcomes o ON a.nstemi_id = o.nstemi_id
    `);
    
    const records = nstemiRes.recordset;
    console.log('Total NSTEMI records:', records.length);
    
    const alive = records.filter(r => !r.death || r.death === 'No' || r.death === '0');
    const deceased = records.filter(r => r.death === 'Yes' || r.death === '1' || r.death === 1);
    
    console.log(`NSTEMI: ${alive.length} alive, ${deceased.length} deceased`);

    // STEMI cohort
    const stemiRes = await pool.request().query(`
      SELECT 
        a.stemi_id,
        a.reg_patient_id,
        p.age,
        adm.hypertension,
        adm.diabetes,
        c.st_deviation_at_admission,
        c.anterior_mi_or_lbbb,
        c.elevated_crp,
        c.elevated_bnp,
        c.heart_rate_gt_100,
        c.killip_class_ii_to_iv,
        c.lvf,
        c.reperfusion_gt_4hrs,
        c.sbp_lt_100,
        c.vt_vf,
        c.weight_lt_67kg,
        c.bbb_chb,
        o.death
      FROM dbo.stemi_admission_details a
      LEFT JOIN dbo.patients p ON a.reg_patient_id = p.reg_patient_id
      LEFT JOIN dbo.stemi_administrative adm ON a.stemi_id = adm.stemi_id
      LEFT JOIN dbo.stemi_clinical_assessment c ON a.stemi_id = c.stemi_id
      LEFT JOIN dbo.stemi_outcomes o ON a.stemi_id = o.stemi_id
    `);
    const stemiRecs = stemiRes.recordset;
    const stemiAlive = stemiRecs.filter(r => !r.death || r.death === 'No' || r.death === '0');
    const stemiDeceased = stemiRecs.filter(r => r.death === 'Yes' || r.death === '1' || r.death === 1);
    console.log(`STEMI: ${stemiAlive.length} alive, ${stemiDeceased.length} deceased (out of ${stemiRecs.length})`);

    // HF cohort
    const hfRes = await pool.request().query(`
      SELECT 
        ha.hf_id,
        ha.reg_patient_id,
        p.age,
        ha.hypertension,
        ha.diabetes,
        ha.cad,
        ha.ckd,
        ha.af,
        ha.ef_percent,
        ha.nyha_class,
        fa.death_hospital,
        fa.death_any
      FROM dbo.hf_administrative ha
      LEFT JOIN dbo.patients p ON ha.reg_patient_id = p.reg_patient_id
      LEFT JOIN dbo.hf_final_clinical_assessment fa ON ha.hf_id = fa.hf_id
    `);
    const hfRecs = hfRes.recordset;
    const hfDeceased = hfRecs.filter(r => r.death_hospital === 'Yes' || r.death_hospital === '1' || r.death_any === 'Yes' || r.death_any === '1');
    const hfAlive = hfRecs.filter(r => !hfDeceased.includes(r));
    console.log(`HF: ${hfAlive.length} alive, ${hfDeceased.length} deceased (out of ${hfRecs.length})`);

  } catch (err) {
    console.error(err);
  } finally {
    process.exit(0);
  }
}

testRiskFactors();
