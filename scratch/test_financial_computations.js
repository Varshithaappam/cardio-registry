const { getPatientsCohort } = require('../backend/services/gdmtService');
const { getStemiCohortFromDb, getNstemiCohortFromDb } = require('../backend/services/acsService');

(async () => {
  const hf = await getPatientsCohort();
  const stemi = await getStemiCohortFromDb();
  const nstemi = await getNstemiCohortFromDb();

  const getRecordCost = (p) => {
    const direct = p.totalCost ?? p.total_cost ?? p.totalHospitalCost ?? p.cost;
    if (direct !== null && direct !== undefined && !isNaN(Number(direct)) && Number(direct) > 0) {
      return Number(direct);
    }
    const comp = (
      Number(p.bed_charges || 0) +
      Number(p.drugs_disposables_cost || 0) +
      Number(p.package_cost || 0) +
      Number(p.laboratory_cost || 0) +
      Number(p.non_invasive_lab_cost || 0) +
      Number(p.consultation_cost || 0) +
      Number(p.radiology_cost || 0) +
      Number(p.miscellaneous_cost || 0)
    );
    return comp > 0 ? comp : 0;
  };

  // 1. Cost Component Composition (Donut / Composition Bar)
  let totalPackage = 0, totalDrugs = 0, totalBeds = 0, totalLabs = 0, totalConsults = 0, totalRadiology = 0, totalMisc = 0;
  let countWithCost = 0;
  [...stemi, ...nstemi].forEach(p => {
    const cost = getRecordCost(p);
    if (cost > 0) {
      countWithCost++;
      totalPackage += Number(p.package_cost || 0);
      totalDrugs += Number(p.drugs_disposables_cost || 0);
      totalBeds += Number(p.bed_charges || 0);
      totalLabs += Number(p.laboratory_cost || 0) + Number(p.non_invasive_lab_cost || 0);
      totalConsults += Number(p.consultation_cost || 0);
      totalRadiology += Number(p.radiology_cost || 0);
      totalMisc += Number(p.miscellaneous_cost || 0);
    }
  });

  const grandTotalCost = totalPackage + totalDrugs + totalBeds + totalLabs + totalConsults + totalRadiology + totalMisc;
  console.log('1. Cost Component Composition:');
  console.log({
    CathLabPackages: { amount: totalPackage, pct: ((totalPackage/grandTotalCost)*100).toFixed(1) + '%' },
    DrugsAndDisposables: { amount: totalDrugs, pct: ((totalDrugs/grandTotalCost)*100).toFixed(1) + '%' },
    BedAndICUCharges: { amount: totalBeds, pct: ((totalBeds/grandTotalCost)*100).toFixed(1) + '%' },
    DiagnosticsAndLabs: { amount: totalLabs, pct: ((totalLabs/grandTotalCost)*100).toFixed(1) + '%' },
    ConsultsAndOther: { amount: totalConsults + totalRadiology + totalMisc, pct: (((totalConsults + totalRadiology + totalMisc)/grandTotalCost)*100).toFixed(1) + '%' }
  });

  // 2. Cost by Culprit Vessel & Procedural Acuity (LAD vs RCA vs LCx vs Multivessel)
  const isTrue = v => v === true || v === 'Yes' || v === 'yes' || v === 1 || v === '1';
  const vesselStats = {
    'LAD (Anterior MI)': { sum: 0, count: 0 },
    'RCA (Inferior MI)': { sum: 0, count: 0 },
    'LCx (Lateral MI)': { sum: 0, count: 0 },
    'Left Main / Multivessel': { sum: 0, count: 0 },
    'Conservative / Other': { sum: 0, count: 0 }
  };

  [...stemi, ...nstemi].forEach(p => {
    const cost = getRecordCost(p);
    if (cost > 0) {
      const lad = isTrue(p.vessel_lad);
      const rca = isTrue(p.vessel_rca);
      const lcx = isTrue(p.vessel_lcx);
      const lmca = isTrue(p.vessel_lmca);
      const vesselCount = (lad ? 1 : 0) + (rca ? 1 : 0) + (lcx ? 1 : 0) + (lmca ? 1 : 0);

      let cat = 'Conservative / Other';
      if (lmca || vesselCount > 1) cat = 'Left Main / Multivessel';
      else if (lad) cat = 'LAD (Anterior MI)';
      else if (rca) cat = 'RCA (Inferior MI)';
      else if (lcx) cat = 'LCx (Lateral MI)';

      vesselStats[cat].sum += cost;
      vesselStats[cat].count++;
    }
  });

  console.log('\n2. Cost by Culprit Vessel & Procedural Acuity:');
  for (const [k, v] of Object.entries(vesselStats)) {
    if (v.count > 0) {
      console.log(`${k}: Count=${v.count}, AvgCost=₹${Math.round(v.sum / v.count).toLocaleString('en-IN')}, TotalCost=₹${v.sum.toLocaleString('en-IN')}`);
    }
  }

  // 3. Risk-Adjusted Cost by TIMI Risk Tier
  const timiStats = {
    'Low Risk': { sum: 0, count: 0, stemiCount: 0, nstemiCount: 0 },
    'Medium Risk': { sum: 0, count: 0, stemiCount: 0, nstemiCount: 0 },
    'High Risk': { sum: 0, count: 0, stemiCount: 0, nstemiCount: 0 }
  };

  stemi.forEach(p => {
    const cost = getRecordCost(p);
    if (cost > 0) {
      const s = Number(p.timiScore ?? p.timi_total_score ?? p.timi_risk_score ?? 0);
      let tier = 'Low Risk';
      if (s > 7) tier = 'High Risk';
      else if (s >= 4) tier = 'Medium Risk';
      timiStats[tier].sum += cost;
      timiStats[tier].count++;
      timiStats[tier].stemiCount++;
    }
  });

  nstemi.forEach(p => {
    const cost = getRecordCost(p);
    if (cost > 0) {
      const s = Number(p.timiScore ?? p.timi_total_score ?? p.timi_risk_score ?? 0);
      let tier = 'Low Risk';
      if (s > 10) tier = 'High Risk';
      else if (s >= 5) tier = 'Medium Risk';
      timiStats[tier].sum += cost;
      timiStats[tier].count++;
      timiStats[tier].nstemiCount++;
    }
  });

  console.log('\n3. Risk-Adjusted Cost by TIMI Risk Tier:');
  for (const [k, v] of Object.entries(timiStats)) {
    if (v.count > 0) {
      console.log(`${k}: Count=${v.count} (STEMI:${v.stemiCount}, NSTEMI:${v.nstemiCount}), AvgCost=₹${Math.round(v.sum / v.count).toLocaleString('en-IN')}`);
    }
  }

  // 4. Average Cost & Revenue Realization by Payer Scheme
  const payerStats = {
    'Private Insurance': { sum: 0, count: 0 },
    'Arogyasree Scheme': { sum: 0, count: 0 },
    'Government Reimbursement': { sum: 0, count: 0 },
    'Direct / Self-Pay Cash': { sum: 0, count: 0 }
  };

  [...hf, ...stemi, ...nstemi].forEach(p => {
    const mode = (p.insurance_mode || p.insuranceMode || p.payment_mode || p.paymentMode || '').toLowerCase();
    let cat = 'Direct / Self-Pay Cash';
    if (mode.includes('private') || mode.includes('insurance') || mode.includes('tpa')) cat = 'Private Insurance';
    else if (mode.includes('arogya')) cat = 'Arogyasree Scheme';
    else if (mode.includes('gov') || mode.includes('cghs') || mode.includes('echs')) cat = 'Government Reimbursement';

    const cost = getRecordCost(p);
    if (cost > 0) {
      payerStats[cat].sum += cost;
      payerStats[cat].count++;
    } else {
      // HF with hospital stay days estimate
      const stayDays = Number(p.hospitalStayDays || p.hospitalization_days || p.stay || 4);
      const estHfCost = stayDays * 5000 + 20000;
      payerStats[cat].sum += estHfCost;
      payerStats[cat].count++;
    }
  });

  console.log('\n4. Average Cost & Revenue Realization by Payer Scheme:');
  for (const [k, v] of Object.entries(payerStats)) {
    if (v.count > 0) {
      console.log(`${k}: Count=${v.count}, AvgCost=₹${Math.round(v.sum / v.count).toLocaleString('en-IN')}, TotalRevenue=₹${v.sum.toLocaleString('en-IN')}`);
    }
  }

  process.exit(0);
})();
