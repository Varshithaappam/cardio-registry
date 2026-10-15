/**
 * Pure Deterministic Clinical Intelligence & GDMT Adherence Engine
 * Evaluates the 6 GDMT drug classes against clinical guidelines and contraindications.
 */

export const GDMT_PILLARS = [
  { key: 'betaBlocker', name: 'Beta Blocker', agents: 'Bisoprolol, Metoprolol succinate, Carvedilol' },
  { key: 'aceInhibitor', name: 'ACE Inhibitor', agents: 'Ramipril, Enalapril, Lisinopril' },
  { key: 'arb', name: 'ARB', agents: 'Telmisartan, Losartan, Candesartan' },
  { key: 'arni', name: 'ARNI', agents: 'Sacubitril/Valsartan' },
  { key: 'mra', name: 'MRA', agents: 'Spironolactone, Eplerenone' },
  { key: 'sglt2Inhibitor', name: 'SGLT2 Inhibitor', agents: 'Dapagliflozin, Empagliflozin' }
];

export const CONTRAINDICATION_THRESHOLDS = [
  {
    pillar: 'Beta Blocker',
    rules: [
      'Heart Rate < 50 bpm (Severe Symptomatic Bradycardia)',
      'Systolic Blood Pressure < 90 mmHg (Severe Hypotension / Cardiogenic Shock)',
      'High-grade AV Block (2nd or 3rd degree without pacemaker)',
      'Severe Active Bronchospastic Disease / Refractory Asthma'
    ]
  },
  {
    pillar: 'ACE Inhibitor / ARB',
    rules: [
      'Serum Creatinine > 2.5 mg/dL or eGFR < 30 mL/min/1.73m²',
      'Serum Potassium (K⁺) > 5.0 mEq/L (Hyperkalemia)',
      'Systolic Blood Pressure < 90 mmHg (Severe Hypotension)',
      'Documented History of Angioedema (Absolute Contraindication for ACEi)',
      'Bilateral Renal Artery Stenosis'
    ]
  },
  {
    pillar: 'ARNI (Sacubitril/Valsartan)',
    rules: [
      'Serum Creatinine > 2.5 mg/dL or eGFR < 30 mL/min',
      'Serum Potassium (K⁺) > 5.0 mEq/L',
      'Systolic Blood Pressure < 90 mmHg',
      'History of Angioedema related to previous ACEi/ARB therapy',
      'Concomitant ACE inhibitor therapy (requires mandatory 36h washout period)'
    ]
  },
  {
    pillar: 'MRA (Mineralocorticoid Receptor Antagonist)',
    rules: [
      'Serum Potassium (K⁺) > 5.0 mEq/L (High risk of fatal hyperkalemic arrhythmias)',
      'Serum Creatinine > 2.5 mg/dL or eGFR < 30 mL/min',
      'Severe Hyponatremia (Serum Na⁺ < 125 mEq/L)'
    ]
  },
  {
    pillar: 'SGLT2 Inhibitor',
    rules: [
      'Severe Renal Impairment (eGFR < 20-25 mL/min/1.73m²)',
      'Type 1 Diabetes Mellitus (Euglycemic DKA risk without specialist endocrine supervision)',
      'Active Recurrent Mycotic Genitourinary Sepsis / Fournier Gangrene risk'
    ]
  }
];

/**
 * Evaluates a single patient record
 */
export function evaluatePatientAdherence(patient) {
  let deviationsCount = 0;
  const pillarEvaluations = {};

  const drugFlags = {
    betaBlocker: { prescribed: Number(patient.betaBlocker) ? 1 : 0, contra: Number(patient.contraBetaBlocker) ? 1 : 0 },
    aceInhibitor: { prescribed: Number(patient.aceInhibitor) ? 1 : 0, contra: Number(patient.contraAceInhibitor) ? 1 : 0 },
    arb: { prescribed: Number(patient.arb) ? 1 : 0, contra: Number(patient.contraArb) ? 1 : 0 },
    arni: { prescribed: Number(patient.arni) ? 1 : 0, contra: Number(patient.contraArni) ? 1 : 0 },
    mra: { prescribed: Number(patient.mra) ? 1 : 0, contra: Number(patient.contraMra) ? 1 : 0 },
    sglt2Inhibitor: { prescribed: Number(patient.sglt2Inhibitor) ? 1 : 0, contra: Number(patient.contraSglt2Inhibitor) ? 1 : 0 }
  };

  GDMT_PILLARS.forEach(p => {
    const flags = drugFlags[p.key];
    const prescribed = flags.prescribed;
    const contraindication = flags.contra;

    let status = '';
    let isDeviation = false;
    let deviationType = 'None';
    let justification = '';

    if (prescribed === 1 && contraindication === 1) {
      status = 'Given with Contraindication';
      isDeviation = true;
      deviationType = 'Given with CI';
      justification = `Pillar prescribed despite active lab/hemodynamic contraindication flag.`;
    } else if (prescribed === 0 && contraindication === 0) {
      status = 'Withheld without Contraindication';
      isDeviation = true;
      deviationType = 'Withheld without CI';
      justification = `Guideline therapy omitted in eligible patient without documented contraindication.`;
    } else if (prescribed === 1 && contraindication === 0) {
      status = 'Appropriate Care (Prescribed)';
      isDeviation = false;
      deviationType = 'None';
      justification = `Prescribed appropriately in concordance with Class I guideline directives.`;
    } else {
      status = 'Appropriate Care (Withheld with CI)';
      isDeviation = false;
      deviationType = 'None';
      justification = `Withheld appropriately due to documented contraindication or safety threshold.`;
    }

    if (isDeviation) deviationsCount++;

    pillarEvaluations[p.key] = {
      name: p.name,
      agents: p.agents,
      prescribed,
      contraindication,
      status,
      isDeviation,
      deviationType,
      justification
    };
  });

  const appropriateCareCount = 6 - deviationsCount;
  const adherencePercent = Math.round((appropriateCareCount / 6) * 1000) / 10;

  let adherenceBracket = '0.0%';
  if (deviationsCount === 0) adherenceBracket = '100.0%';
  else if (deviationsCount === 1) adherenceBracket = '83.3%';
  else if (deviationsCount === 2) adherenceBracket = '66.7%';
  else if (deviationsCount === 3) adherenceBracket = '50.0%';
  else if (deviationsCount === 4) adherenceBracket = '33.3%';
  else if (deviationsCount === 5) adherenceBracket = '16.7%';
  else adherenceBracket = '0.0%';

  const prescribedDrugsCount = Object.values(drugFlags).reduce((sum, d) => sum + d.prescribed, 0);

  return {
    ...patient,
    deviationsCount,
    appropriateCareCount,
    adherencePercent,
    adherenceBracket,
    prescribedDrugsCount,
    pillarEvaluations
  };
}

/**
 * Filter cohort based on universal filter bar
 */
export function filterCohort(cohort, filters = {}) {
  const {
    registry = 'All Registries',
    phenotype = 'All Phenotypes',
    gender = 'All Genders',
    startDate = '',
    endDate = '',
    search = ''
  } = filters;

  const searchNorm = search.trim().toLowerCase();

  return cohort.filter(p => {
    // Registry filter
    if (registry !== 'All Registries') {
      const pReg = String(p.registry || '').toLowerCase();
      const targetReg = registry.toLowerCase();
      if (!pReg.includes(targetReg) && !(targetReg.includes('heart failure') && pReg.includes('hf'))) {
        return false;
      }
    }

    // Phenotype filter
    if (phenotype !== 'All Phenotypes') {
      if (String(p.hfType).toLowerCase() !== phenotype.toLowerCase()) {
        return false;
      }
    }

    // Gender filter
    if (gender !== 'All Genders') {
      if (String(p.gender).toLowerCase() !== gender.toLowerCase()) {
        return false;
      }
    }

    // Date range filter
    if (startDate && p.admissionDate) {
      if (p.admissionDate < startDate) return false;
    }
    if (endDate && p.admissionDate) {
      if (p.admissionDate > endDate) return false;
    }

    // Search filter: UHID, Name, or Prescribed Drug Names
    if (searchNorm) {
      const uhidMatch = String(p.uhid || '').toLowerCase().includes(searchNorm);
      const nameMatch = String(p.name || '').toLowerCase().includes(searchNorm);
      const ipMatch = String(p.ipNo || '').toLowerCase().includes(searchNorm);
      const drugsMatch = String(p.prescribedDrugsSummary || '').toLowerCase().includes(searchNorm);
      if (!uhidMatch && !nameMatch && !ipMatch && !drugsMatch) {
        return false;
      }
    }

    return true;
  });
}

/**
 * Re-compute all analytics dynamically for a filtered cohort
 */
export function computeAnalytics(patients) {
  const total = patients.length;
  if (total === 0) {
    return {
      cohortSize: 0,
      kpi: {
        totalPatients: 0,
        males: 0,
        females: 0,
        malePercent: 0,
        femalePercent: 0,
        meanAge: 0,
        sdAge: 0,
        meanEf: 0,
        hfrEFCount: 0,
        hfrEFPercent: 0,
        hfmrEFCount: 0,
        hfmrEFPercent: 0,
        hfpEFCount: 0,
        hfpEFPercent: 0,
        nyha1Count: 0,
        nyha2Count: 0,
        nyha3Count: 0,
        nyha3Percent: 0,
        nyha4Count: 0,
        nyha4Percent: 0,
        severeNyhaCount: 0,
        severeNyhaPercent: 0,
        deathsRecorded: 0,
        mortalityPercent: 0,
        meanGdmtDrugs: 0,
        meanAdherencePercent: 0,
        quadrupleTherapyCount: 0,
        quadrupleTherapyPercent: 0,
        tripleTherapyCount: 0,
        tripleTherapyPercent: 0,
        primaryCiCount: 0,
        primaryCiPercent: 0,
        diabetesCount: 0,
        diabetesPercent: 0,
        hypertensionCount: 0,
        hypertensionPercent: 0,
        renalFailureCount: 0,
        renalFailurePercent: 0,
        cadCount: 0,
        cadPercent: 0
      },
      ageDistribution: [],
      adherenceDistribution: [],
      drugsTakenDistribution: [],
      performanceMatrix: []
    };
  }

  let males = 0;
  let females = 0;
  let sumAge = 0;
  let sumEf = 0;
  let countEf = 0;
  let countHFrEF = 0;
  let countHFmrEF = 0;
  let countHFpEF = 0;
  let countNYHA1 = 0;
  let countNYHA2 = 0;
  let countNYHA3 = 0;
  let countNYHA4 = 0;
  let countDeath = 0;

  let countDM = 0;
  let countHTN = 0;
  let countRenal = 0;
  let countCAD = 0;

  let ageUnder50 = 0;
  let age50to60 = 0;
  let age61to70 = 0;
  let ageOver70 = 0;

  let sumAdherence = 0;
  let sumDrugsTaken = 0;
  let countQuadruple = 0;
  let countTriple = 0;
  let countDual = 0;
  let countMono = 0;
  let countZero = 0;
  let countPrimaryCI = 0;

  const adherenceBrackets = {
    '0.0%': 0,
    '16.7%': 0,
    '33.3%': 0,
    '50.0%': 0,
    '66.7%': 0,
    '83.3%': 0,
    '100.0%': 0
  };

  const pillarStats = {
    betaBlocker: { name: 'Beta Blocker', agents: 'Bisoprolol, Metoprolol, Carvedilol', onDrug: 0, withCI: 0, givenWithCI: 0, withheldWithoutCI: 0, appropCare: 0, deviations: 0 },
    aceInhibitor: { name: 'ACE Inhibitor', agents: 'Ramipril, Enalapril, Lisinopril', onDrug: 0, withCI: 0, givenWithCI: 0, withheldWithoutCI: 0, appropCare: 0, deviations: 0 },
    arb: { name: 'ARB', agents: 'Telmisartan, Losartan, Candesartan', onDrug: 0, withCI: 0, givenWithCI: 0, withheldWithoutCI: 0, appropCare: 0, deviations: 0 },
    arni: { name: 'ARNI', agents: 'Sacubitril/Valsartan', onDrug: 0, withCI: 0, givenWithCI: 0, withheldWithoutCI: 0, appropCare: 0, deviations: 0 },
    mra: { name: 'MRA', agents: 'Spironolactone, Eplerenone', onDrug: 0, withCI: 0, givenWithCI: 0, withheldWithoutCI: 0, appropCare: 0, deviations: 0 },
    sglt2Inhibitor: { name: 'SGLT2 Inhibitor', agents: 'Dapagliflozin, Empagliflozin', onDrug: 0, withCI: 0, givenWithCI: 0, withheldWithoutCI: 0, appropCare: 0, deviations: 0 }
  };

  patients.forEach(p => {
    if (p.gender === 'Female') females++;
    else males++;

    sumAge += p.age;
    if (p.age < 50) ageUnder50++;
    else if (p.age <= 60) age50to60++;
    else if (p.age <= 70) age61to70++;
    else ageOver70++;

    if (typeof p.efPercent === 'number' && !isNaN(p.efPercent)) {
      sumEf += p.efPercent;
      countEf++;
    }
    if (p.hfType === 'HFrEF') countHFrEF++;
    else if (p.hfType === 'HFmrEF') countHFmrEF++;
    else countHFpEF++;

    const nyha = String(p.functionalStatus || '').toLowerCase();
    if (nyha.includes('iv')) countNYHA4++;
    else if (nyha.includes('iii')) countNYHA3++;
    else if (nyha.includes('ii')) countNYHA2++;
    else countNYHA1++;

    if (p.death) countDeath++;

    const comorbStr = (p.comorbidities || []).join(' ').toLowerCase();
    if (comorbStr.includes('diabet') || comorbStr.includes('dm')) countDM++;
    if (comorbStr.includes('hyperten') || comorbStr.includes('htn')) countHTN++;
    if (comorbStr.includes('renal') || comorbStr.includes('ckd') || p.creatinine > 2.5) countRenal++;
    if (comorbStr.includes('cad') || comorbStr.includes('cabg') || comorbStr.includes('ischemic')) countCAD++;

    sumAdherence += p.adherencePercent;
    sumDrugsTaken += p.prescribedDrugsCount;

    if (p.prescribedDrugsCount >= 4) countQuadruple++;
    else if (p.prescribedDrugsCount === 3) countTriple++;
    else if (p.prescribedDrugsCount === 2) countDual++;
    else if (p.prescribedDrugsCount === 1) countMono++;
    else countZero++;

    if (p.creatinine > 2.5) countPrimaryCI++;

    if (adherenceBrackets[p.adherenceBracket] !== undefined) {
      adherenceBrackets[p.adherenceBracket]++;
    }

    GDMT_PILLARS.forEach(pillar => {
      const evalStat = p.pillarEvaluations[pillar.key];
      const stats = pillarStats[pillar.key];
      if (evalStat.prescribed) stats.onDrug++;
      if (evalStat.contraindication) stats.withCI++;
      if (evalStat.status === 'Given with Contraindication') stats.givenWithCI++;
      else if (evalStat.status === 'Withheld without Contraindication') stats.withheldWithoutCI++;
      else stats.appropCare++;

      if (evalStat.isDeviation) stats.deviations++;
    });
  });

  const meanAge = sumAge / total;
  const varianceAge = patients.reduce((acc, p) => acc + Math.pow(p.age - meanAge, 2), 0) / total;
  const sdAge = Math.sqrt(varianceAge);
  const meanEf = countEf > 0 ? (sumEf / countEf) : 36.9;

  const performanceMatrix = GDMT_PILLARS.map(pillar => {
    const s = pillarStats[pillar.key];
    const devRate = Math.round((s.deviations / total) * 1000) / 10;
    const appropRate = Math.round((100 - devRate) * 10) / 10;
    return {
      pillarKey: pillar.key,
      drugName: s.name,
      agents: s.agents,
      prescribedCount: s.onDrug,
      prescribedRate: Math.round((s.onDrug / total) * 1000) / 10,
      contraindicatedCount: s.withCI,
      contraindicatedRate: Math.round((s.withCI / total) * 1000) / 10,
      givenWithContraindication: s.givenWithCI,
      withheldWithoutContraindication: s.withheldWithoutCI,
      totalDeviations: s.deviations,
      deviationRate: devRate,
      appropriatenessScore: appropRate
    };
  });

  return {
    cohortSize: total,
    kpi: {
      totalPatients: total,
      males,
      females,
      malePercent: Math.round((males / total) * 1000) / 10,
      femalePercent: Math.round((females / total) * 1000) / 10,
      meanAge: Math.round(meanAge * 10) / 10,
      sdAge: Math.round(sdAge * 10) / 10,
      meanEf: Math.round(meanEf * 10) / 10,
      hfrEFCount: countHFrEF,
      hfrEFPercent: Math.round((countHFrEF / total) * 1000) / 10,
      hfmrEFCount: countHFmrEF,
      hfmrEFPercent: Math.round((countHFmrEF / total) * 1000) / 10,
      hfpEFCount: countHFpEF,
      hfpEFPercent: Math.round((countHFpEF / total) * 1000) / 10,
      nyha1Count: countNYHA1,
      nyha2Count: countNYHA2,
      nyha3Count: countNYHA3,
      nyha3Percent: Math.round((countNYHA3 / total) * 1000) / 10,
      nyha4Count: countNYHA4,
      nyha4Percent: Math.round((countNYHA4 / total) * 1000) / 10,
      severeNyhaCount: countNYHA3 + countNYHA4,
      severeNyhaPercent: Math.round(((countNYHA3 + countNYHA4) / total) * 1000) / 10,
      deathsRecorded: countDeath,
      mortalityPercent: Math.round((countDeath / total) * 1000) / 10,
      meanGdmtDrugs: Math.round((sumDrugsTaken / total) * 100) / 100,
      meanAdherencePercent: Math.round((sumAdherence / total) * 10) / 10,
      quadrupleTherapyCount: countQuadruple,
      quadrupleTherapyPercent: Math.round((countQuadruple / total) * 1000) / 10,
      tripleTherapyCount: countTriple,
      tripleTherapyPercent: Math.round((countTriple / total) * 1000) / 10,
      primaryCiCount: countPrimaryCI,
      primaryCiPercent: Math.round((countPrimaryCI / total) * 1000) / 10,
      diabetesCount: countDM,
      diabetesPercent: Math.round((countDM / total) * 1000) / 10,
      hypertensionCount: countHTN,
      hypertensionPercent: Math.round((countHTN / total) * 1000) / 10,
      renalFailureCount: countRenal,
      renalFailurePercent: Math.round((countRenal / total) * 1000) / 10,
      cadCount: countCAD,
      cadPercent: Math.round((countCAD / total) * 1000) / 10
    },
    ageDistribution: [
      { bracket: '<50 yrs', count: ageUnder50, percent: Math.round((ageUnder50 / total) * 1000) / 10 },
      { bracket: '50-60 yrs', count: age50to60, percent: Math.round((age50to60 / total) * 1000) / 10 },
      { bracket: '61-70 yrs', count: age61to70, percent: Math.round((age61to70 / total) * 1000) / 10 },
      { bracket: '>70 yrs', count: ageOver70, percent: Math.round((ageOver70 / total) * 1000) / 10 }
    ],
    adherenceDistribution: Object.entries(adherenceBrackets).map(([bracket, count]) => ({
      bracket,
      count,
      percent: Math.round((count / total) * 1000) / 10
    })),
    drugsTakenDistribution: [
      { drugs: '0 Drugs', count: countZero, percent: Math.round((countZero / total) * 1000) / 10, label: 'Untreated / Contraindicated' },
      { drugs: '1 Drug', count: countMono, percent: Math.round((countMono / total) * 1000) / 10, label: 'Monotherapy (Dominant)' },
      { drugs: '2 Drugs', count: countDual, percent: Math.round((countDual / total) * 1000) / 10, label: 'Dual Therapy' },
      { drugs: '3 Drugs', count: countTriple, percent: Math.round((countTriple / total) * 1000) / 10, label: 'Triple Therapy' },
      { drugs: '4+ Drugs', count: countQuadruple, percent: Math.round((countQuadruple / total) * 1000) / 10, label: 'Quadruple Guideline Target' }
    ],
    performanceMatrix
  };
}

/**
 * Generates and triggers download of CSV report for filtered cohort
 */
export function exportCohortCsv(patients) {
  if (!patients || patients.length === 0) return;

  const headers = [
    'UHID',
    'IP No',
    'Patient Name',
    'Age',
    'Gender',
    'HF Phenotype',
    'Registry',
    'Admission Date',
    'LVEF %',
    'NYHA Class',
    'In-Hospital Mortality',
    'Blood Pressure',
    'Heart Rate (bpm)',
    'Serum Creatinine (mg/dL)',
    'Serum Potassium (mEq/L)',
    'Hemoglobin (g/dL)',
    'Prescribed GDMT Count',
    'Total Deviations',
    'Adherence %',
    'Adherence Bracket',
    'Beta Blocker Prescribed',
    'Beta Blocker CI',
    'Beta Blocker Status',
    'ACEi Prescribed',
    'ACEi CI',
    'ACEi Status',
    'ARB Prescribed',
    'ARB CI',
    'ARB Status',
    'ARNI Prescribed',
    'ARNI CI',
    'ARNI Status',
    'MRA Prescribed',
    'MRA CI',
    'MRA Status',
    'SGLT2i Prescribed',
    'SGLT2i CI',
    'SGLT2i Status',
    'Prescribed Drugs Summary'
  ];

  const rows = patients.map(p => [
    p.uhid,
    p.ipNo,
    `"${(p.name || '').replace(/"/g, '""')}"`,
    p.age,
    p.gender,
    p.hfType,
    p.registry,
    p.admissionDate,
    p.efPercent,
    p.functionalStatus,
    p.death ? 'YES' : 'NO',
    p.bloodPressureSitting,
    p.heartRate,
    p.creatinine,
    p.potassium,
    p.hemoglobin,
    p.prescribedDrugsCount,
    p.deviationsCount,
    `${p.adherencePercent}%`,
    p.adherenceBracket,
    p.pillarEvaluations.betaBlocker.prescribed,
    p.pillarEvaluations.betaBlocker.contraindication,
    `"${p.pillarEvaluations.betaBlocker.status}"`,
    p.pillarEvaluations.aceInhibitor.prescribed,
    p.pillarEvaluations.aceInhibitor.contraindication,
    `"${p.pillarEvaluations.aceInhibitor.status}"`,
    p.pillarEvaluations.arb.prescribed,
    p.pillarEvaluations.arb.contraindication,
    `"${p.pillarEvaluations.arb.status}"`,
    p.pillarEvaluations.arni.prescribed,
    p.pillarEvaluations.arni.contraindication,
    `"${p.pillarEvaluations.arni.status}"`,
    p.pillarEvaluations.mra.prescribed,
    p.pillarEvaluations.mra.contraindication,
    `"${p.pillarEvaluations.mra.status}"`,
    p.pillarEvaluations.sglt2Inhibitor.prescribed,
    p.pillarEvaluations.sglt2Inhibitor.contraindication,
    `"${p.pillarEvaluations.sglt2Inhibitor.status}"`,
    `"${(p.prescribedDrugsSummary || '').replace(/"/g, '""')}"`
  ]);

  const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `GDMT_Clinical_Intelligence_Cohort_${new Date().toISOString().split('T')[0]}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
