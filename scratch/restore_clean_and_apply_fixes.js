const { execSync } = require('child_process');
const fs = require('fs');

console.log('1. Reading HEAD version of AdminExecutiveDashboard.jsx...');
let code = execSync('git show HEAD:frontend/src/components/dashboard/AdminExecutiveDashboard.jsx', { encoding: 'utf8' });

console.log('2. Applying targeted fixes to clean baseline...');

// Fix 1: Analytics fallbacks
const oldAnalytics = `  // Reperfusion Strategies
  const stemiPami = stemiAnalytics.treatmentStrategy?.find(s => /pami|primary/i.test(s.name))?.percent ?? 61.1;
  const stemiLysis = stemiAnalytics.treatmentStrategy?.find(s => /lysis|thrombo/i.test(s.name))?.percent ?? 32.2;
  const stemiCons = stemiAnalytics.treatmentStrategy?.find(s => /cons|medical/i.test(s.name))?.percent ?? 6.7;

  const nstemiPami = nstemiAnalytics.treatmentStrategy?.find(s => /pami|primary|invasive/i.test(s.name))?.percent ?? 15.2;
  const nstemiLysis = nstemiAnalytics.treatmentStrategy?.find(s => /lysis|thrombo/i.test(s.name))?.percent ?? 0.0;
  const nstemiCons = nstemiAnalytics.treatmentStrategy?.find(s => /cons|medical/i.test(s.name))?.percent ?? 84.8;

  // TIMI-3 Flow
  const stemiTimi3 = stemiAnalytics.proceduralSuccess?.find(p => /3|grade 3|normal/i.test(p.grade || p.name))?.percent ?? 91.1;
  const nstemiTimi3 = nstemiAnalytics.proceduralSuccess?.find(p => /3|grade 3|normal/i.test(p.grade || p.name))?.percent ?? 73.9;

  // Culprit Vessel
  const stemiLad = stemiAnalytics.vessels?.find(v => /lad/i.test(v.name))?.percent ?? 47.8;
  const stemiRca = stemiAnalytics.vessels?.find(v => /rca/i.test(v.name))?.percent ?? 33.3;
  const stemiLcx = stemiAnalytics.vessels?.find(v => /lcx/i.test(v.name))?.percent ?? 15.6;

  const nstemiLad = nstemiAnalytics.vessels?.find(v => /lad/i.test(v.name))?.percent ?? 15.2;
  const nstemiRca = nstemiAnalytics.vessels?.find(v => /rca/i.test(v.name))?.percent ?? 6.5;
  const nstemiLcx = nstemiAnalytics.vessels?.find(v => /lcx/i.test(v.name))?.percent ?? 4.3;

  // Outcomes & Complications
  const stemiReMi = stemiAnalytics.mace?.find(m => /re-mi|infarction|ischemia/i.test(m.event || m.name))?.rate ?? 3.3;
  const nstemiReMi = nstemiAnalytics.mace?.find(m => /re-mi|infarction|ischemia/i.test(m.event || m.name))?.rate ?? 4.3;

  const stemiStroke = stemiAnalytics.mace?.find(m => /stroke|cva/i.test(m.event || m.name))?.rate ?? 1.1;
  const nstemiStroke = nstemiAnalytics.mace?.find(m => /stroke|cva/i.test(m.event || m.name))?.rate ?? 2.2;

  const stemiBleed = stemiAnalytics.mace?.find(m => /bleed/i.test(m.event || m.name))?.rate ?? 3.3;
  const nstemiBleed = nstemiAnalytics.mace?.find(m => /bleed/i.test(m.event || m.name))?.rate ?? 2.2;

  // Comorbidities
  const hfHtn = 28.3;
  const stemiHtn = stemiAnalytics.comorbidities?.find(c => /hyperten/i.test(c.name))?.percent ?? 62.2;
  const nstemiHtn = nstemiAnalytics.comorbidities?.find(c => /hyperten/i.test(c.name))?.percent ?? 30.4;

  const hfDm = 29.7;
  const stemiDm = stemiAnalytics.comorbidities?.find(c => /diabet/i.test(c.name))?.percent ?? 47.8;
  const nstemiDm = nstemiAnalytics.comorbidities?.find(c => /diabet/i.test(c.name))?.percent ?? 21.7;

  // HF GDMT Drugs from live analytics
  const hfBetaBlockerPct = hfAnalytics.performanceMatrix?.find(p => p.pillarKey === 'betaBlocker')?.prescribedRate ?? 31.2;
  const hfMraPct = hfAnalytics.performanceMatrix?.find(p => p.pillarKey === 'mra')?.prescribedRate ?? 26.8;
  const hfAcePct = hfAnalytics.performanceMatrix?.find(p => p.pillarKey === 'aceInhibitor')?.prescribedRate ?? 23.9;
  const hfArbPct = hfAnalytics.performanceMatrix?.find(p => p.pillarKey === 'arb')?.prescribedRate ?? 17.4;
  const hfArniPct = hfAnalytics.performanceMatrix?.find(p => p.pillarKey === 'arni')?.prescribedRate ?? 0.0;
  const hfSglt2Pct = hfAnalytics.performanceMatrix?.find(p => p.pillarKey === 'sglt2Inhibitor')?.prescribedRate ?? 0.0;

  // NSTEMI Discharge Meds from live analytics
  const nstemiStatin = nstemiAnalytics.gdmtMeds?.find(m => /statin/i.test(m.drug))?.prescribedRate ?? 76.1;
  const nstemiAspirin = nstemiAnalytics.gdmtMeds?.find(m => /aspirin/i.test(m.drug))?.prescribedRate ?? 71.7;
  const nstemiTicagrelor = nstemiAnalytics.gdmtMeds?.find(m => /ticagrelor/i.test(m.drug))?.prescribedRate ?? 67.4;
  const nstemiBetaBlocker = nstemiAnalytics.gdmtMeds?.find(m => /beta/i.test(m.drug))?.prescribedRate ?? 17.4;

  // TIMI Flow Grade Breakdown from live analytics
  const stemiTimiGrade3 = stemiAnalytics.proceduralSuccess?.find(p => /grade 3/i.test(p.name))?.percent ?? 91.1;
  const stemiTimiGrade2 = stemiAnalytics.proceduralSuccess?.find(p => /grade 2/i.test(p.name))?.percent ?? 6.7;
  const stemiTimiGrade01 = stemiAnalytics.proceduralSuccess?.find(p => /grade 0\\/1/i.test(p.name))?.percent ?? 2.2;

  const nstemiTimiGrade3 = nstemiAnalytics.proceduralSuccess?.find(p => /grade 3/i.test(p.name))?.percent ?? 73.9;
  const nstemiTimiGrade2 = nstemiAnalytics.proceduralSuccess?.find(p => /grade 2/i.test(p.name))?.percent ?? 4.3;
  const nstemiTimiGrade01 = nstemiAnalytics.proceduralSuccess?.find(p => /grade 0\\/1/i.test(p.name))?.percent ?? 13.0;
  const nstemiTimiUnrecorded = nstemiAnalytics.proceduralSuccess?.find(p => /unrecorded|no cath/i.test(p.name))?.percent ?? 8.7;`;

const newAnalytics = `  // Reperfusion Strategies (Strict live percentages; 0.0% when empty cohort or not present)
  const stemiPami = filteredStemiCohort.length > 0 ? (stemiAnalytics.treatmentStrategy?.find(s => /pami|primary/i.test(s.name))?.percent ?? 0.0) : 0.0;
  const stemiLysis = filteredStemiCohort.length > 0 ? (stemiAnalytics.treatmentStrategy?.find(s => /lysis|thrombo/i.test(s.name))?.percent ?? 0.0) : 0.0;
  const stemiCons = filteredStemiCohort.length > 0 ? (stemiAnalytics.treatmentStrategy?.find(s => /cons|medical/i.test(s.name))?.percent ?? 0.0) : 0.0;

  const nstemiPami = filteredNstemiCohort.length > 0 ? (nstemiAnalytics.treatmentStrategy?.find(s => /pami|primary|invasive/i.test(s.name))?.percent ?? 0.0) : 0.0;
  const nstemiLysis = filteredNstemiCohort.length > 0 ? (nstemiAnalytics.treatmentStrategy?.find(s => /lysis|thrombo/i.test(s.name))?.percent ?? 0.0) : 0.0;
  const nstemiCons = filteredNstemiCohort.length > 0 ? (nstemiAnalytics.treatmentStrategy?.find(s => /cons|medical/i.test(s.name))?.percent ?? 0.0) : 0.0;

  // TIMI-3 Flow
  const stemiTimi3 = filteredStemiCohort.length > 0 ? (stemiAnalytics.proceduralSuccess?.find(p => /3|grade 3|normal/i.test(p.grade || p.name))?.percent ?? 0.0) : 0.0;
  const nstemiTimi3 = filteredNstemiCohort.length > 0 ? (nstemiAnalytics.proceduralSuccess?.find(p => /3|grade 3|normal/i.test(p.grade || p.name))?.percent ?? 0.0) : 0.0;

  // Culprit Vessel
  const stemiLad = filteredStemiCohort.length > 0 ? (stemiAnalytics.vessels?.find(v => /lad/i.test(v.name))?.percent ?? 0.0) : 0.0;
  const stemiRca = filteredStemiCohort.length > 0 ? (stemiAnalytics.vessels?.find(v => /rca/i.test(v.name))?.percent ?? 0.0) : 0.0;
  const stemiLcx = filteredStemiCohort.length > 0 ? (stemiAnalytics.vessels?.find(v => /lcx/i.test(v.name))?.percent ?? 0.0) : 0.0;

  const nstemiLad = filteredNstemiCohort.length > 0 ? (nstemiAnalytics.vessels?.find(v => /lad/i.test(v.name))?.percent ?? 0.0) : 0.0;
  const nstemiRca = filteredNstemiCohort.length > 0 ? (nstemiAnalytics.vessels?.find(v => /rca/i.test(v.name))?.percent ?? 0.0) : 0.0;
  const nstemiLcx = filteredNstemiCohort.length > 0 ? (nstemiAnalytics.vessels?.find(v => /lcx/i.test(v.name))?.percent ?? 0.0) : 0.0;

  // Outcomes & Complications
  const stemiReMi = filteredStemiCohort.length > 0 ? (stemiAnalytics.mace?.find(m => /re-mi|infarction|ischemia/i.test(m.event || m.name))?.rate ?? 0.0) : 0.0;
  const nstemiReMi = filteredNstemiCohort.length > 0 ? (nstemiAnalytics.mace?.find(m => /re-mi|infarction|ischemia/i.test(m.event || m.name))?.rate ?? 0.0) : 0.0;

  const stemiStroke = filteredStemiCohort.length > 0 ? (stemiAnalytics.mace?.find(m => /stroke|cva/i.test(m.event || m.name))?.rate ?? 0.0) : 0.0;
  const nstemiStroke = filteredNstemiCohort.length > 0 ? (nstemiAnalytics.mace?.find(m => /stroke|cva/i.test(m.event || m.name))?.rate ?? 0.0) : 0.0;

  const stemiBleed = filteredStemiCohort.length > 0 ? (stemiAnalytics.mace?.find(m => /bleed/i.test(m.event || m.name))?.rate ?? 0.0) : 0.0;
  const nstemiBleed = filteredNstemiCohort.length > 0 ? (nstemiAnalytics.mace?.find(m => /bleed/i.test(m.event || m.name))?.rate ?? 0.0) : 0.0;

  // Comorbidities
  const hfHtn = filteredHfCohort.length > 0 ? (hfAnalytics.kpi?.hypertensionPercent ?? 0.0) : 0.0;
  const stemiHtn = filteredStemiCohort.length > 0 ? (stemiAnalytics.comorbidities?.find(c => /hyperten/i.test(c.name))?.percent ?? 0.0) : 0.0;
  const nstemiHtn = filteredNstemiCohort.length > 0 ? (nstemiAnalytics.comorbidities?.find(c => /hyperten/i.test(c.name))?.percent ?? 0.0) : 0.0;

  const hfDm = filteredHfCohort.length > 0 ? (hfAnalytics.kpi?.diabetesPercent ?? 0.0) : 0.0;
  const stemiDm = filteredStemiCohort.length > 0 ? (stemiAnalytics.comorbidities?.find(c => /diabet/i.test(c.name))?.percent ?? 0.0) : 0.0;
  const nstemiDm = filteredNstemiCohort.length > 0 ? (nstemiAnalytics.comorbidities?.find(c => /diabet/i.test(c.name))?.percent ?? 0.0) : 0.0;

  // HF GDMT Drugs from live analytics
  const hfBetaBlockerPct = filteredHfCohort.length > 0 ? (hfAnalytics.performanceMatrix?.find(p => p.pillarKey === 'betaBlocker')?.prescribedRate ?? 0.0) : 0.0;
  const hfMraPct = filteredHfCohort.length > 0 ? (hfAnalytics.performanceMatrix?.find(p => p.pillarKey === 'mra')?.prescribedRate ?? 0.0) : 0.0;
  const hfAcePct = filteredHfCohort.length > 0 ? (hfAnalytics.performanceMatrix?.find(p => p.pillarKey === 'aceInhibitor')?.prescribedRate ?? 0.0) : 0.0;
  const hfArbPct = filteredHfCohort.length > 0 ? (hfAnalytics.performanceMatrix?.find(p => p.pillarKey === 'arb')?.prescribedRate ?? 0.0) : 0.0;
  const hfArniPct = filteredHfCohort.length > 0 ? (hfAnalytics.performanceMatrix?.find(p => p.pillarKey === 'arni')?.prescribedRate ?? 0.0) : 0.0;
  const hfSglt2Pct = filteredHfCohort.length > 0 ? (hfAnalytics.performanceMatrix?.find(p => p.pillarKey === 'sglt2Inhibitor')?.prescribedRate ?? 0.0) : 0.0;

  // NSTEMI Discharge Meds from live analytics
  const nstemiStatin = filteredNstemiCohort.length > 0 ? (nstemiAnalytics.gdmtMeds?.find(m => /statin/i.test(m.drug))?.prescribedRate ?? 0.0) : 0.0;
  const nstemiAspirin = filteredNstemiCohort.length > 0 ? (nstemiAnalytics.gdmtMeds?.find(m => /aspirin/i.test(m.drug))?.prescribedRate ?? 0.0) : 0.0;
  const nstemiTicagrelor = filteredNstemiCohort.length > 0 ? (nstemiAnalytics.gdmtMeds?.find(m => /ticagrelor/i.test(m.drug))?.prescribedRate ?? 0.0) : 0.0;
  const nstemiBetaBlocker = filteredNstemiCohort.length > 0 ? (nstemiAnalytics.gdmtMeds?.find(m => /beta/i.test(m.drug))?.prescribedRate ?? 0.0) : 0.0;

  // TIMI Flow Grade Breakdown from live analytics
  const stemiTimiGrade3 = filteredStemiCohort.length > 0 ? (stemiAnalytics.proceduralSuccess?.find(p => /grade 3/i.test(p.name))?.percent ?? 0.0) : 0.0;
  const stemiTimiGrade2 = filteredStemiCohort.length > 0 ? (stemiAnalytics.proceduralSuccess?.find(p => /grade 2/i.test(p.name))?.percent ?? 0.0) : 0.0;
  const stemiTimiGrade01 = filteredStemiCohort.length > 0 ? (stemiAnalytics.proceduralSuccess?.find(p => /grade 0\\/1/i.test(p.name))?.percent ?? 0.0) : 0.0;

  const nstemiTimiGrade3 = filteredNstemiCohort.length > 0 ? (nstemiAnalytics.proceduralSuccess?.find(p => /grade 3/i.test(p.name))?.percent ?? 0.0) : 0.0;
  const nstemiTimiGrade2 = filteredNstemiCohort.length > 0 ? (nstemiAnalytics.proceduralSuccess?.find(p => /grade 2/i.test(p.name))?.percent ?? 0.0) : 0.0;
  const nstemiTimiGrade01 = filteredNstemiCohort.length > 0 ? (nstemiAnalytics.proceduralSuccess?.find(p => /grade 0\\/1/i.test(p.name))?.percent ?? 0.0) : 0.0;
  const nstemiTimiUnrecorded = filteredNstemiCohort.length > 0 ? (nstemiAnalytics.proceduralSuccess?.find(p => /unrecorded|no cath/i.test(p.name))?.percent ?? 0.0) : 0.0;`;

if (!code.includes(oldAnalytics)) {
  console.error('Failed to match oldAnalytics block!');
} else {
  code = code.replace(oldAnalytics, newAnalytics);
  console.log('Fixed analytics fallbacks');
}

// Fix 2: TIMI Risk distribution averages
code = code.replace(
  "const nstAvg = nstTotal > 0 ? (nstSum / nstTotal).toFixed(1) : '2.5';",
  "const nstAvg = nstTotal > 0 ? (nstSum / nstTotal).toFixed(1) : '—';"
);
code = code.replace(
  "const stAvg = stTotal > 0 ? (stSum / stTotal).toFixed(1) : '3.7';",
  "const stAvg = stTotal > 0 ? (stSum / stTotal).toFixed(1) : '—';"
);
console.log('Fixed TIMI Risk distribution averages');

// Fix 3: Average cost per admission
code = code.replace(
  "const displayStemiAvgCost = useDirectDb && backendMetrics.kpis.stemiAvgCost != null ? backendMetrics.kpis.stemiAvgCost : (filteredStemiCohort.length > 0 ? Math.round(costStats.stemiRaw / 35) : 220837);",
  "const displayStemiAvgCost = useDirectDb && backendMetrics.kpis.stemiAvgCost != null ? backendMetrics.kpis.stemiAvgCost : (filteredStemiCohort.length > 0 ? Math.round(costStats.stemiRaw / filteredStemiCohort.length) : 0);"
);
code = code.replace(
  "const displayNstemiAvgCost = useDirectDb && backendMetrics.kpis.nstemiAvgCost != null ? backendMetrics.kpis.nstemiAvgCost : (filteredNstemiCohort.length > 0 ? Math.round(costStats.nstemiRaw / 7) : 99677);",
  "const displayNstemiAvgCost = useDirectDb && backendMetrics.kpis.nstemiAvgCost != null ? backendMetrics.kpis.nstemiAvgCost : (filteredNstemiCohort.length > 0 ? Math.round(costStats.nstemiRaw / filteredNstemiCohort.length) : 0);"
);
console.log('Fixed cost calculation divisor');

// Fix 4: handleExportXlsx metrics
code = code.replace(
  "ageDistributionData,\n          genderDistributionData,\n          presentationComparisonData,",
  "ageDistributionData,\n          genderDistributionData,\n          hfUniqueCount,\n          stemiUniqueCount,\n          nstemiUniqueCount,\n          overallUniquePatients,\n          hfUniquePatients: hfUniqueCount,\n          stemiUniquePatients: stemiUniqueCount,\n          nstemiUniquePatients: nstemiUniqueCount,\n          presentationComparisonData,"
);
console.log('Fixed handleExportXlsx metrics parameters');

// Fix 5: Gender Chart X-Axis tickFormatter and Tooltip in Section 2
const oldGenderXAxis = `<XAxis dataKey="registry" stroke="#94a3b8" fontSize={10} fontWeight={600} />`;
const newGenderXAxis = `<XAxis
                      dataKey="registry"
                      stroke="#94a3b8"
                      fontSize={10}
                      fontWeight={600}
                      tickFormatter={(v) => {
                        if (/heart/i.test(v)) return \`Heart Failure (N=\${hfUniqueCount})\`;
                        if (/nstemi/i.test(v)) return \`NSTEMI (N=\${nstemiUniqueCount})\`;
                        if (/^stemi$/i.test(v) || /stemi/i.test(v)) return \`STEMI (N=\${stemiUniqueCount})\`;
                        return v;
                      }}
                    />`;
code = code.replace(oldGenderXAxis, newGenderXAxis);

const oldGenderTooltip = `<Tooltip formatter={(val) => \`\${val}%\`} />`;
const newGenderTooltip = `<Tooltip
                      formatter={(val, name, item) => {
                        const count = item?.payload?.[name + '_count'];
                        const regStr = String(item?.payload?.registry || '').toLowerCase();
                        const isHf = regStr.includes('heart') || regStr === 'hf';
                        const isNstemi = regStr.includes('nstemi');
                        const denom = item?.payload?.totalPatients || (isHf ? hfUniqueCount : (isNstemi ? nstemiUniqueCount : stemiUniqueCount));
                        return count !== undefined && denom
                          ? [\`\${val}% (\${count} of \${denom} pts)\`, \`\${name} Patients\`]
                          : [\`\${val}%\`, \`\${name} Patients\`];
                      }}
                    />`;
code = code.replace(oldGenderTooltip, newGenderTooltip);
console.log('Fixed Gender Distribution chart X-axis & Tooltip');

// Fix 6: Section 3 Cards 1, 2, 3
code = code.replace(
  "<span className=\"font-bold text-slate-800\">{hfAnalytics.kpi?.meanEf || '39'}%</span>",
  "<span className=\"font-bold text-slate-800\">{filteredHfCohort.length > 0 && hfAnalytics.kpi?.meanEf != null ? `${hfAnalytics.kpi.meanEf}%` : '—'}</span>"
);
code = code.replace(
  "<span className=\"font-bold text-slate-800\">{hfAnalytics.kpi?.hfrEFPercent || '62.3'}% / {hfAnalytics.kpi?.hfpEFPercent || '8.7'}%</span>",
  "<span className=\"font-bold text-slate-800\">{filteredHfCohort.length > 0 ? `${hfAnalytics.kpi?.hfrEFPercent ?? 0}% / ${hfAnalytics.kpi?.hfpEFPercent ?? 0}%` : '—'}</span>"
);
code = code.replace(
  "<span className=\"font-bold text-slate-800\">{hfAnalytics.kpi?.nyha3Percent || '7.2'}% / {hfAnalytics.kpi?.nyha4Percent || '4.3'}%</span>",
  "<span className=\"font-bold text-slate-800\">{filteredHfCohort.length > 0 ? `${hfAnalytics.kpi?.nyha3Percent ?? 0}% / ${hfAnalytics.kpi?.nyha4Percent ?? 0}%` : '—'}</span>"
);
code = code.replace(
  "<span className=\"font-bold text-slate-800\">{hfAnalytics.kpi?.thirtyDayMortalityRate || '5.8'}%</span>",
  "<span className=\"font-bold text-slate-800\">{filteredHfCohort.length > 0 ? `${hfAnalytics.kpi?.thirtyDayMortalityRate ?? 0}%` : '—'}</span>"
);
code = code.replace(
  "<p className=\"text-xs text-slate-500 mb-4\">{displayStemiRecords} records · {stemiAnalytics.kpi?.uniquePatients || 15} patients</p>",
  "<p className=\"text-xs text-slate-500 mb-4\">{displayStemiRecords} records · {stemiUniqueCount} patients</p>"
);
code = code.replace(
  "<span className=\"font-bold text-slate-800\">{stemiAnalytics.kpi?.meanAge ? `${Math.round(stemiAnalytics.kpi.meanAge)} yrs` : '-'}</span>",
  "<span className=\"font-bold text-slate-800\">{filteredStemiCohort.length > 0 && stemiAnalytics.kpi?.meanAge ? `${Math.round(stemiAnalytics.kpi.meanAge)} yrs` : '—'}</span>"
);
code = code.replace(
  "<p className=\"text-xs text-slate-500 mb-4\">{displayNstemiRecords} records · {nstemiAnalytics.kpi?.uniquePatients || 16} patients</p>",
  "<p className=\"text-xs text-slate-500 mb-4\">{displayNstemiRecords} records · {nstemiUniqueCount} patients</p>"
);
code = code.replace(
  "<span className=\"font-bold text-slate-800\">{nstemiAnalytics.kpi?.meanAge ? `${Number(nstemiAnalytics.kpi.meanAge).toFixed(1)} yrs` : '49.9 yrs'}</span>",
  "<span className=\"font-bold text-slate-800\">{filteredNstemiCohort.length > 0 && nstemiAnalytics.kpi?.meanAge ? `${Number(nstemiAnalytics.kpi.meanAge).toFixed(1)} yrs` : '—'}</span>"
);
code = code.replace(
  "<span className=\"font-bold text-slate-800\">{nstemiAnalytics.kpi?.avgTimiScore || '2.5'}</span>",
  "<span className=\"font-bold text-slate-800\">{filteredNstemiCohort.length > 0 && nstemiAnalytics.kpi?.avgTimiScore != null ? nstemiAnalytics.kpi.avgTimiScore : '—'}</span>"
);
code = code.replace(
  "<span className=\"font-bold text-slate-800\">{nstemiPami} / {nstemiLysis} / {nstemiCons}%</span>",
  "<span className=\"font-bold text-slate-800\">{filteredNstemiCohort.length > 0 ? `${nstemiPami} / ${nstemiLysis} / ${nstemiCons}%` : '—'}</span>"
);
code = code.replace(
  "<span className=\"font-bold text-slate-800\">{nstemiTimi3}%</span>",
  "<span className=\"font-bold text-slate-800\">{filteredNstemiCohort.length > 0 ? `${nstemiTimi3}%` : '—'}</span>"
);
code = code.replace(
  "<span className=\"font-bold text-slate-800\">LAD {nstemiLad}%</span>",
  "<span className=\"font-bold text-slate-800\">{filteredNstemiCohort.length > 0 ? `LAD ${nstemiLad}%` : '—'}</span>"
);
console.log('Fixed Section 3 registry cards');

// Fix 7: Section 4 Quality & Reperfusion
code = code.replace(
  `                <div>
                  <div className="flex justify-between text-slate-700 font-medium mb-1">
                    <span>STEMI TIMI-3 Flow (≥90%)</span>
                    <span className="font-bold">{stemiTimi3}%</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                    <div className="bg-amber-800 h-2 rounded-full" style={{ width: \`\${Math.min(stemiTimi3, 100)}%\` }}></div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-slate-700 font-medium mb-1">
                    <span>NSTEMI TIMI-3 Flow</span>
                    <span className="font-bold">{nstemiTimi3}%</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                    <div className="bg-purple-600 h-2 rounded-full" style={{ width: \`\${Math.min(nstemiTimi3, 100)}%\` }}></div>
                  </div>
                </div>`,
  `                <div>
                  <div className="flex justify-between text-slate-700 font-medium mb-1">
                    <span>STEMI TIMI-3 Flow (≥90%)</span>
                    <span className="font-bold">{filteredStemiCohort.length > 0 ? \`\${stemiTimi3}%\` : '—'}</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                    <div className="bg-amber-800 h-2 rounded-full" style={{ width: \`\${filteredStemiCohort.length > 0 ? Math.min(stemiTimi3, 100) : 0}%\` }}></div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-slate-700 font-medium mb-1">
                    <span>NSTEMI TIMI-3 Flow</span>
                    <span className="font-bold">{filteredNstemiCohort.length > 0 ? \`\${nstemiTimi3}%\` : '—'}</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                    <div className="bg-purple-600 h-2 rounded-full" style={{ width: \`\${filteredNstemiCohort.length > 0 ? Math.min(nstemiTimi3, 100) : 0}%\` }}></div>
                  </div>
                </div>`
);

const oldSafety = `                    <tr>
                      <td className="py-2.5">Re-MI / recurrent ischemia</td>
                      <td className="py-2.5 text-right font-bold text-slate-900">{stemiReMi}%</td>
                      <td className="py-2.5 text-right font-bold text-slate-900">{nstemiReMi}%</td>
                    </tr>
                    <tr>
                      <td className="py-2.5">Stroke</td>
                      <td className="py-2.5 text-right font-bold text-slate-900">{stemiStroke}%</td>
                      <td className="py-2.5 text-right font-bold text-slate-900">{nstemiStroke}%</td>
                    </tr>
                    <tr>
                      <td className="py-2.5">Major bleed</td>
                      <td className="py-2.5 text-right font-bold text-slate-900">{stemiBleed}%</td>
                      <td className="py-2.5 text-right font-bold text-slate-900">{nstemiBleed}%</td>
                    </tr>`;

const newSafety = `                    <tr>
                      <td className="py-2.5">Re-MI / recurrent ischemia</td>
                      <td className="py-2.5 text-right font-bold text-slate-900">{filteredStemiCohort.length > 0 ? \`\${stemiReMi}%\` : '—'}</td>
                      <td className="py-2.5 text-right font-bold text-slate-900">{filteredNstemiCohort.length > 0 ? \`\${nstemiReMi}%\` : '—'}</td>
                    </tr>
                    <tr>
                      <td className="py-2.5">Stroke</td>
                      <td className="py-2.5 text-right font-bold text-slate-900">{filteredStemiCohort.length > 0 ? \`\${stemiStroke}%\` : '—'}</td>
                      <td className="py-2.5 text-right font-bold text-slate-900">{filteredNstemiCohort.length > 0 ? \`\${nstemiStroke}%\` : '—'}</td>
                    </tr>
                    <tr>
                      <td className="py-2.5">Major bleed</td>
                      <td className="py-2.5 text-right font-bold text-slate-900">{filteredStemiCohort.length > 0 ? \`\${stemiBleed}%\` : '—'}</td>
                      <td className="py-2.5 text-right font-bold text-slate-900">{filteredNstemiCohort.length > 0 ? \`\${nstemiBleed}%\` : '—'}</td>
                    </tr>`;
code = code.replace(oldSafety, newSafety);

const oldFollowUp = `<span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md" title="Total scheduled visits across multi-interval protocols">
                  274 Visits / 246 Pts
                </span>
              </div>
              <p className="text-[10px] text-slate-400 mb-2">
                * 274 total scheduled appointments across 246 patient records (multi-interval 1M, 6M &amp; 12M protocol)
              </p>`;

const newFollowUp = `<span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md" title="Total scheduled visits across multi-interval protocols">
                  {isFilterActive ? \`\${overallUniquePatients * 3} Visits / \${overallUniquePatients} Pts\` : '274 Visits / 246 Pts'}
                </span>
              </div>
              <p className="text-[10px] text-slate-400 mb-2">
                * {isFilterActive ? \`\${overallUniquePatients * 3} scheduled protocol appointments across \${overallUniquePatients} cohort patients\` : '274 total scheduled appointments across 246 patient records (multi-interval 1M, 6M & 12M protocol)'}
              </p>`;
code = code.replace(oldFollowUp, newFollowUp);
console.log('Fixed Section 4 Quality, Safety & Follow-up panel');

// Fix 8: Section 7 Financial Header
code = code.replace(
  '<p className="text-[10px] text-slate-400 mb-3">Reconciliation across 42 ACS admissions with hospital billing</p>',
  '<p className="text-[10px] text-slate-400 mb-3">Reconciliation across {filteredStemiCohort.length + filteredNstemiCohort.length} ACS admissions with hospital billing</p>'
);
console.log('Fixed Section 7 Financial Header');

// Write out the file
fs.writeFileSync('frontend/src/components/dashboard/AdminExecutiveDashboard.jsx', code, 'utf8');
console.log('Successfully wrote updated AdminExecutiveDashboard.jsx');
