const fs = require('fs');
const path = 'c:/Users/ADMIN/Desktop/projects/cardio-registry/frontend/src/utils/excelReportGenerator.js';
let content = fs.readFileSync(path, 'utf8');

// 1. Update buildSheet1 signature and return
const oldBuildSheet1Header = `function buildSheet1(workbook, patients, sheet1Data = null) {
  const ws = workbook.addWorksheet('Sheet1');`;

const newBuildSheet1Header = `function buildSheet1(workbook, patients, sheet1Data = null, wsSheet1 = null) {
  const ws = wsSheet1 || workbook.addWorksheet('Sheet1');
  const finalExportRows = [];`;

if (content.includes(oldBuildSheet1Header)) {
  content = content.replace(oldBuildSheet1Header, newBuildSheet1Header);
} else {
  content = content.replace(oldBuildSheet1Header.replace(/\n/g, '\r\n'), newBuildSheet1Header.replace(/\n/g, '\r\n'));
}

// In buildSheet1 filteredRows.forEach: push rowVals to finalExportRows
const oldDataRowFiltered = `      // Re-number SL No continuously (column 0)
      rowVals[0] = idx + 1;

      // User requirement: what is in IP No(Prosoft) (index 3) have same in IP No(T3) (index 2)
      rowVals[2] = rowVals[3] || rowVals[2] || '';

      const dataRow = ws.addRow(rowVals);`;

const newDataRowFiltered = `      // Re-number SL No continuously (column 0)
      rowVals[0] = idx + 1;

      // User requirement: what is in IP No(Prosoft) (index 3) have same in IP No(T3) (index 2)
      rowVals[2] = rowVals[3] || rowVals[2] || '';
      finalExportRows.push(rowVals);

      const dataRow = ws.addRow(rowVals);`;

if (content.includes(oldDataRowFiltered)) {
  content = content.replace(oldDataRowFiltered, newDataRowFiltered);
} else {
  content = content.replace(oldDataRowFiltered.replace(/\n/g, '\r\n'), newDataRowFiltered.replace(/\n/g, '\r\n'));
}

// Return finalExportRows at end of filteredRows block
const oldReturnFiltered = `    autoFitColumns(ws, 10, 45);
    return;
  }`;

const newReturnFiltered = `    autoFitColumns(ws, 10, 45);
    return finalExportRows;
  }`;

if (content.includes(oldReturnFiltered)) {
  content = content.replace(oldReturnFiltered, newReturnFiltered);
} else {
  content = content.replace(oldReturnFiltered.replace(/\n/g, '\r\n'), newReturnFiltered.replace(/\n/g, '\r\n'));
}

// In fallback block of buildSheet1: push rowValues and return finalExportRows
const oldDataRowFallback = `    const dataRow = ws.addRow(rowValues);
    const r = idx + 2;`;

const newDataRowFallback = `    finalExportRows.push(rowValues);
    const dataRow = ws.addRow(rowValues);
    const r = idx + 2;`;

if (content.includes(oldDataRowFallback)) {
  content = content.replace(oldDataRowFallback, newDataRowFallback);
} else {
  content = content.replace(oldDataRowFallback.replace(/\n/g, '\r\n'), newDataRowFallback.replace(/\n/g, '\r\n'));
}

const oldReturnFallback = `  autoFitColumns(ws, 10, 40);
}

/**
 * Build Notes Sheet`;

const newReturnFallback = `  autoFitColumns(ws, 10, 40);
  return finalExportRows;
}

/**
 * Build Notes Sheet`;

if (content.includes(oldReturnFallback)) {
  content = content.replace(oldReturnFallback, newReturnFallback);
} else {
  content = content.replace(oldReturnFallback.replace(/\n/g, '\r\n'), newReturnFallback.replace(/\n/g, '\r\n'));
}

// 2. Update buildGdmtSummarySheet signature
const oldSummarySig = `function buildGdmtSummarySheet(workbook, analytics, patients) {
  const ws = workbook.addWorksheet('GDMT Summary');`;

const newSummarySig = `function buildGdmtSummarySheet(workbook, analytics, patients, wsSummary = null) {
  const ws = wsSummary || workbook.addWorksheet('GDMT Summary');`;

if (content.includes(oldSummarySig)) {
  content = content.replace(oldSummarySig, newSummarySig);
} else {
  content = content.replace(oldSummarySig.replace(/\n/g, '\r\n'), newSummarySig.replace(/\n/g, '\r\n'));
}

// 3. Update buildContraindicationsSheet signature
const oldContraSig = `function buildContraindicationsSheet(workbook) {
  const ws = workbook.addWorksheet('Contraindications');`;

const newContraSig = `function buildContraindicationsSheet(workbook, wsContra = null) {
  const ws = wsContra || workbook.addWorksheet('Contraindications');`;

if (content.includes(oldContraSig)) {
  content = content.replace(oldContraSig, newContraSig);
} else {
  content = content.replace(oldContraSig.replace(/\n/g, '\r\n'), newContraSig.replace(/\n/g, '\r\n'));
}

// 4. Update buildCiFlagsSheet signature and renal calculation
const oldCiFlagsBlock = `function buildCiFlagsSheet(workbook, patients) {
  const ws = workbook.addWorksheet('CI Flags');

  const headers = [
    'UHID',
    'Systolic BP',
    'Heart rate',
    'Potassium',
    'Creatinine',
    'Clinical text (Q,U,V,AP,AQ,AR,AS)',
    'Drug text (BU,BV)',
    'Bradycardia',
    'SBP < BB/ACEi/ARB threshold',
    'SBP < ARNI threshold',
    'Shock / inotropes',
    'Asthma / COPD',
    'Hyperkalaemia (ACEi/ARB/ARNI)',
    'Hyperkalaemia (MRA)',
    'Renal impairment (creatinine)',
    'AV block / sick sinus',
    'DKA',
    'UTI / urosepsis',
    'Severe renal (SGLT2)'
  ];

  const headerRow = ws.addRow(headers);
  headerRow.eachCell(cell => {
    cell.fill = HEADER_FILL_NAVY;
    cell.font = HEADER_FONT;
    cell.border = BORDER_THIN;
  });

  patients.forEach((p, idx) => {
    const r = idx + 2;
    const sbp = p.systolicBp || 120;
    const hr = p.heartRate || 72;
    const k = p.potassium || 4.2;
    const creat = p.creatinine || 1.1;

    const row = [
      p.uhid,
      sbp,
      hr,
      k,
      creat,
      p.presentDiagnosis || '',
      p.prescribedDrugsSummary || '',
      hr < 50 ? 1 : 0,
      sbp < 90 ? 1 : 0,
      sbp < 100 ? 1 : 0,
      0,
      0,
      k > 5.5 ? 1 : 0,
      k > 5.0 ? 1 : 0,
      creat > 2.5 ? 1 : 0,
      0,
      0,
      0,
      creat > 3.0 ? 1 : 0
    ];

    const dataRow = ws.addRow(row);

    // Live Excel formulas extracting directly from Sheet1 & Contraindications
    dataRow.getCell(1).value = p.uhid;
    dataRow.getCell(2).value = { formula: \`IFERROR(VALUE(LEFT(Sheet1!AG\${r},FIND("/",Sheet1!AG\${r})-1)),"")\`, result: sbp };
    dataRow.getCell(3).value = { formula: \`IFERROR(IF(ISNUMBER(Sheet1!AC\${r}),Sheet1!AC\${r},VALUE(Sheet1!AC\${r})),"")\`, result: hr };
    dataRow.getCell(4).value = { formula: \`IFERROR(IF(ISNUMBER(Sheet1!BL\${r}),Sheet1!BL\${r},VALUE(Sheet1!BL\${r})),"")\`, result: k };
    dataRow.getCell(5).value = { formula: \`IFERROR(IF(ISNUMBER(Sheet1!BM\${r}),Sheet1!BM\${r},VALUE(Sheet1!BM\${r})),"")\`, result: creat };
    // Clinical text: Present diagnosis (Q), reasons for admissions (U), Previous Diagnosis (V), Comorbidities1-4 (AP, AQ, AR, AS)
    dataRow.getCell(6).value = { formula: \`UPPER(Sheet1!Q\${r}&" | "&Sheet1!U\${r}&" | "&Sheet1!V\${r}&" | "&Sheet1!AP\${r}&" | "&Sheet1!AQ\${r}&" | "&Sheet1!AR\${r}&" | "&Sheet1!AS\${r})\`, result: p.presentDiagnosis || '' };
    dataRow.getCell(7).value = { formula: \`UPPER(Sheet1!BU\${r}&" | "&Sheet1!BV\${r})\`, result: p.prescribedDrugsSummary || '' };
    dataRow.getCell(8).value = { formula: \`IF(AND(ISNUMBER(C\${r}),C\${r}<Contraindications!\$E\$4),1,0)\`, result: hr < 50 ? 1 : 0 };
    dataRow.getCell(9).value = { formula: \`IF(AND(ISNUMBER(B\${r}),B\${r}<Contraindications!\$E\$5),1,0)\`, result: sbp < 90 ? 1 : 0 };
    dataRow.getCell(10).value = { formula: \`IF(AND(ISNUMBER(B\${r}),B\${r}<Contraindications!\$E\$16),1,0)\`, result: sbp < 100 ? 1 : 0 };
    dataRow.getCell(11).value = { formula: \`IF(OR(ISNUMBER(SEARCH("SHOCK",F\${r})),ISNUMBER(SEARCH("DOBUTAMINE",G\${r})),ISNUMBER(SEARCH("DOBU",G\${r})),ISNUMBER(SEARCH("NORAD",G\${r}))),1,0)\`, result: 0 };
    dataRow.getCell(12).value = { formula: \`IF(OR(ISNUMBER(SEARCH("ASTHMA",F\${r})),ISNUMBER(SEARCH("COPD",F\${r})),ISNUMBER(SEARCH("BRONCH",F\${r}))),1,0)\`, result: 0 };
    dataRow.getCell(13).value = { formula: \`IF(OR(AND(ISNUMBER(D\${r}),D\${r}>Contraindications!\$E\$10),ISNUMBER(SEARCH("HYPERKAL",F\${r}))),1,0)\`, result: k > 5.5 ? 1 : 0 };
    dataRow.getCell(14).value = { formula: \`IF(OR(AND(ISNUMBER(D\${r}),D\${r}>Contraindications!\$E\$19),ISNUMBER(SEARCH("HYPERKAL",F\${r}))),1,0)\`, result: k > 5.0 ? 1 : 0 };
    dataRow.getCell(15).value = { formula: \`IF(AND(ISNUMBER(E\${r}),E\${r}>Contraindications!\$E\$11),1,0)\`, result: creat > 2.5 ? 1 : 0 };
    dataRow.getCell(16).value = { formula: \`IF(OR(ISNUMBER(SEARCH("AV BLOCK",F\${r})),ISNUMBER(SEARCH("HEART BLOCK",F\${r})),ISNUMBER(SEARCH("CHB",F\${r})),ISNUMBER(SEARCH("SICK SINUS",F\${r})),ISNUMBER(SEARCH("BRADY",F\${r}))),1,0)\`, result: 0 };
    dataRow.getCell(17).value = { formula: \`IF(OR(ISNUMBER(SEARCH("DKA",F\${r})),ISNUMBER(SEARCH("KETOACID",F\${r}))),1,0)\`, result: 0 };
    dataRow.getCell(18).value = { formula: \`IF(OR(ISNUMBER(SEARCH("UTI",F\${r})),ISNUMBER(SEARCH("UROSEPSIS",F\${r}))),1,0)\`, result: 0 };
    dataRow.getCell(19).value = { formula: \`IF(AND(ISNUMBER(E\${r}),E\${r}>Contraindications!\$E\$21),1,0)\`, result: creat > 3.0 ? 1 : 0 };

    dataRow.eachCell(cell => (cell.border = BORDER_THIN));

    if (idx % 2 === 1) {
      dataRow.eachCell(cell => {
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFF8FAFC' }
        };
      });
    }
  });

  autoFitColumns(ws, 10, 45);
}`;

const newCiFlagsBlock = `function buildCiFlagsSheet(workbook, patients, wsFlags = null) {
  const ws = wsFlags || workbook.addWorksheet('CI Flags');

  const headers = [
    'UHID',
    'Systolic BP',
    'Heart rate',
    'Potassium',
    'Creatinine',
    'Clinical text (Q,U,V,AP,AQ,AR,AS)',
    'Drug text (BU,BV)',
    'Bradycardia',
    'SBP < BB/ACEi/ARB threshold',
    'SBP < ARNI threshold',
    'Shock / inotropes',
    'Asthma / COPD',
    'Hyperkalaemia (ACEi/ARB/ARNI)',
    'Hyperkalaemia (MRA)',
    'Renal impairment (creatinine)',
    'AV block / sick sinus',
    'DKA',
    'UTI / urosepsis',
    'Severe renal (SGLT2)'
  ];

  const headerRow = ws.addRow(headers);
  headerRow.eachCell(cell => {
    cell.fill = HEADER_FILL_NAVY;
    cell.font = HEADER_FONT;
    cell.border = BORDER_THIN;
  });

  const finalCiRows = [];

  patients.forEach((p, idx) => {
    const r = idx + 2;
    const sbp = p.systolicBp || 120;
    const hr = p.heartRate || 72;
    const k = p.potassium || 4.2;
    const creat = p.creatinine || 1.1;

    // Evaluate renal impairment flag from either creatinine > 2.5 OR documented renal failure/CKD in diagnoses/comorbidities
    const hasRenalDiagnosis = Boolean(
      p.renalFailure ||
      (p.comorbidities || []).some(c => /renal|ckd/i.test(c)) ||
      /renal|ckd/i.test(p.presentDiagnosis || '') ||
      /renal|ckd/i.test(p.previousDiagnosis || '')
    );
    const renalFlag = (creat > 2.5 || hasRenalDiagnosis) ? 1 : 0;

    const row = [
      p.uhid,
      sbp,
      hr,
      k,
      creat,
      p.presentDiagnosis || '',
      p.prescribedDrugsSummary || '',
      hr < 50 ? 1 : 0,
      sbp < 90 ? 1 : 0,
      sbp < 100 ? 1 : 0,
      0,
      0,
      k > 5.5 ? 1 : 0,
      k > 5.0 ? 1 : 0,
      renalFlag,
      0,
      0,
      0,
      creat > 3.0 ? 1 : 0
    ];

    finalCiRows.push(row);
    const dataRow = ws.addRow(row);

    // Live Excel formulas extracting directly from Sheet1 & Contraindications
    dataRow.getCell(1).value = p.uhid;
    dataRow.getCell(2).value = { formula: \`IFERROR(VALUE(LEFT(Sheet1!AG\${r},FIND("/",Sheet1!AG\${r})-1)),"")\`, result: sbp };
    dataRow.getCell(3).value = { formula: \`IFERROR(IF(ISNUMBER(Sheet1!AC\${r}),Sheet1!AC\${r},VALUE(Sheet1!AC\${r})),"")\`, result: hr };
    dataRow.getCell(4).value = { formula: \`IFERROR(IF(ISNUMBER(Sheet1!BL\${r}),Sheet1!BL\${r},VALUE(Sheet1!BL\${r})),"")\`, result: k };
    dataRow.getCell(5).value = { formula: \`IFERROR(IF(ISNUMBER(Sheet1!BM\${r}),Sheet1!BM\${r},VALUE(Sheet1!BM\${r})),"")\`, result: creat };
    // Clinical text: Present diagnosis (Q), reasons for admissions (U), Previous Diagnosis (V), Comorbidities1-4 (AP, AQ, AR, AS)
    dataRow.getCell(6).value = { formula: \`UPPER(Sheet1!Q\${r}&" | "&Sheet1!U\${r}&" | "&Sheet1!V\${r}&" | "&Sheet1!AP\${r}&" | "&Sheet1!AQ\${r}&" | "&Sheet1!AR\${r}&" | "&Sheet1!AS\${r})\`, result: p.presentDiagnosis || '' };
    dataRow.getCell(7).value = { formula: \`UPPER(Sheet1!BU\${r}&" | "&Sheet1!BV\${r})\`, result: p.prescribedDrugsSummary || '' };
    dataRow.getCell(8).value = { formula: \`IF(AND(ISNUMBER(C\${r}),C\${r}<Contraindications!\$E\$4),1,0)\`, result: hr < 50 ? 1 : 0 };
    dataRow.getCell(9).value = { formula: \`IF(AND(ISNUMBER(B\${r}),B\${r}<Contraindications!\$E\$5),1,0)\`, result: sbp < 90 ? 1 : 0 };
    dataRow.getCell(10).value = { formula: \`IF(AND(ISNUMBER(B\${r}),B\${r}<Contraindications!\$E\$16),1,0)\`, result: sbp < 100 ? 1 : 0 };
    dataRow.getCell(11).value = { formula: \`IF(OR(ISNUMBER(SEARCH("SHOCK",F\${r})),ISNUMBER(SEARCH("DOBUTAMINE",G\${r})),ISNUMBER(SEARCH("DOBU",G\${r})),ISNUMBER(SEARCH("NORAD",G\${r}))),1,0)\`, result: 0 };
    dataRow.getCell(12).value = { formula: \`IF(OR(ISNUMBER(SEARCH("ASTHMA",F\${r})),ISNUMBER(SEARCH("COPD",F\${r})),ISNUMBER(SEARCH("BRONCH",F\${r}))),1,0)\`, result: 0 };
    dataRow.getCell(13).value = { formula: \`IF(OR(AND(ISNUMBER(D\${r}),D\${r}>Contraindications!\$E\$10),ISNUMBER(SEARCH("HYPERKAL",F\${r}))),1,0)\`, result: k > 5.5 ? 1 : 0 };
    dataRow.getCell(14).value = { formula: \`IF(OR(AND(ISNUMBER(D\${r}),D\${r}>Contraindications!\$E\$19),ISNUMBER(SEARCH("HYPERKAL",F\${r}))),1,0)\`, result: k > 5.0 ? 1 : 0 };
    // Synchronized live formula: evaluates 1 if creatinine > 2.5 OR clinical text contains RENAL or CKD
    dataRow.getCell(15).value = { formula: \`IF(OR(AND(ISNUMBER(E\${r}),E\${r}>Contraindications!\$E\$11),ISNUMBER(SEARCH("RENAL",F\${r})),ISNUMBER(SEARCH("CKD",F\${r}))),1,0)\`, result: renalFlag };
    dataRow.getCell(16).value = { formula: \`IF(OR(ISNUMBER(SEARCH("AV BLOCK",F\${r})),ISNUMBER(SEARCH("HEART BLOCK",F\${r})),ISNUMBER(SEARCH("CHB",F\${r})),ISNUMBER(SEARCH("SICK SINUS",F\${r})),ISNUMBER(SEARCH("BRADY",F\${r}))),1,0)\`, result: 0 };
    dataRow.getCell(17).value = { formula: \`IF(OR(ISNUMBER(SEARCH("DKA",F\${r})),ISNUMBER(SEARCH("KETOACID",F\${r}))),1,0)\`, result: 0 };
    dataRow.getCell(18).value = { formula: \`IF(OR(ISNUMBER(SEARCH("UTI",F\${r})),ISNUMBER(SEARCH("UROSEPSIS",F\${r}))),1,0)\`, result: 0 };
    dataRow.getCell(19).value = { formula: \`IF(AND(ISNUMBER(E\${r}),E\${r}>Contraindications!\$E\$21),1,0)\`, result: creat > 3.0 ? 1 : 0 };

    dataRow.eachCell(cell => (cell.border = BORDER_THIN));

    if (idx % 2 === 1) {
      dataRow.eachCell(cell => {
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFF8FAFC' }
        };
      });
    }
  });

  autoFitColumns(ws, 10, 45);
  return finalCiRows;
}`;

if (content.includes(oldCiFlagsBlock)) {
  content = content.replace(oldCiFlagsBlock, newCiFlagsBlock);
} else {
  content = content.replace(oldCiFlagsBlock.replace(/\n/g, '\r\n'), newCiFlagsBlock.replace(/\n/g, '\r\n'));
}

// 5. Update buildKeyPointsSheet signature and cohort values derivation
const oldKeyPointsBlock = `function buildKeyPointsSheet(workbook, analytics, patients) {
  const ws = workbook.addWorksheet('Key Points');
  const total = patients.length || 0;

  // Row 1: Title
  const r1 = ws.getRow(1);
  r1.getCell(1).value = 'HF GDMT audit – summary of key points';
  r1.getCell(1).font = { name: 'Calibri', size: 14, bold: true, color: { argb: 'FF000000' } };

  // Row 2: Subtitle
  const r2 = ws.getRow(2);
  r2.getCell(1).value = 'All figures are live formulas linked to Sheet1 and GDMT Summary; they update when the data changes.';
  r2.getCell(1).font = { name: 'Calibri', size: 11, italic: true, color: { argb: 'FF000000' } };

  // Row 4: Header
  const r4 = ws.getRow(4);
  r4.values = ['Cohort metrics', 'Value', 'Source'];
  [1, 2, 3].forEach(c => {
    const cell = r4.getCell(c);
    cell.fill = HEADER_FILL_REF_BLUE;
    cell.font = REF_FONT_BOLD;
    cell.border = BORDER_THIN;
  });

  // Calculate cohort values
  const males = patients.filter(p => String(p.gender).toLowerCase() === 'male').length;
  const females = patients.filter(p => String(p.gender).toLowerCase() === 'female').length;
  const ages = patients.map(p => Number(p.age)).filter(a => !isNaN(a) && a > 0);
  const meanAge = ages.length > 0 ? (ages.reduce((a, b) => a + b, 0) / ages.length) : 0;

  const hfref = patients.filter(p => String(p.hfType).toUpperCase() === 'HFREF').length;
  const hfpef = patients.filter(p => String(p.hfType).toUpperCase() === 'HFPEF').length;
  const efs = patients.map(p => Number(p.efPercent)).filter(e => !isNaN(e) && e > 0);
  const meanEf = efs.length > 0 ? (efs.reduce((a, b) => a + b, 0) / efs.length) : 0;

  const nyha3 = patients.filter(p => String(p.functionalStatus || '').includes('III')).length;
  const nyha4 = patients.filter(p => String(p.functionalStatus || '').includes('IV')).length;

  const dm = patients.filter(p => p.diabetes || (p.comorbidities || []).some(c => c.toLowerCase().includes('diabet'))).length;
  const htn = patients.filter(p => p.hypertension || (p.comorbidities || []).some(c => c.toLowerCase().includes('hyperten'))).length;
  const ckd = patients.filter(p => p.renalFailure || (p.comorbidities || []).some(c => c.toLowerCase().includes('renal') || c.toLowerCase().includes('ckd'))).length;
  const deaths = patients.filter(p => p.death).length;

  const drugsCounts = patients.map(p => p.prescribedDrugsCount || 0);
  const meanDrugs = drugsCounts.length > 0 ? (drugsCounts.reduce((a, b) => a + b, 0) / drugsCounts.length) : 0;

  const adherences = patients.map(p => Number(p.adherencePercent) != null ? Number(p.adherencePercent) / 100 : 0);
  const meanAdh = adherences.length > 0 ? (adherences.reduce((a, b) => a + b, 0) / adherences.length) : 0;

  // Rows 5 to 19: Cohort metrics
  const metricSpecs = [
    { r: 5, label: 'Patients (UHIDs) in dataset', formula: \`COUNTA('Sheet1'!B2:B\${total + 1})\`, result: total, src: 'Sheet1 col B', numFmt: undefined },
    { r: 6, label: 'Male', formula: \`COUNTIF('Sheet1'!I2:I\${total + 1},"Male")\`, result: males, src: 'Sheet1 col I', numFmt: undefined },
    { r: 7, label: 'Female', formula: \`COUNTIF('Sheet1'!I2:I\${total + 1},"Female")\`, result: females, src: 'Sheet1 col I', numFmt: undefined },
    { r: 8, label: 'Mean age (years)', formula: \`AVERAGE('Sheet1'!H2:H\${total + 1})\`, result: meanAge, src: 'Sheet1 col H', numFmt: '0.0' },
    { r: 9, label: 'HFrEF', formula: \`COUNTIF('Sheet1'!AO2:AO\${total + 1},"*HFrEF*")\`, result: hfref, src: 'Sheet1 col AO', numFmt: undefined },
    { r: 10, label: 'HFpEF', formula: \`COUNTIF('Sheet1'!AO2:AO\${total + 1},"*HFpEF*")\`, result: hfpef, src: 'Sheet1 col AO', numFmt: undefined },
    { r: 11, label: 'Mean EF %', formula: \`AVERAGE('Sheet1'!BJ2:BJ\${total + 1})\`, result: meanEf, src: 'Sheet1 col BJ', numFmt: '0.0' },
    { r: 12, label: 'NYHA class III', formula: \`COUNTIF('Sheet1'!AV2:AV\${total + 1},"*III*")\`, result: nyha3, src: 'Sheet1 col AV', numFmt: undefined },
    { r: 13, label: 'NYHA class IV', formula: \`COUNTIF('Sheet1'!AV2:AV\${total + 1},"*IV*")\`, result: nyha4, src: 'Sheet1 col AV', numFmt: undefined },
    { r: 14, label: 'Diabetes mellitus (any comorbidity column)', formula: \`COUNTIF('Sheet1'!AP2:AS\${total + 1},"*Diabet*")\`, result: dm, src: 'Sheet1 col AP:AS', numFmt: undefined },
    { r: 15, label: 'Hypertension', formula: \`COUNTIF('Sheet1'!AP2:AS\${total + 1},"*Hyperten*")\`, result: htn, src: 'Sheet1 col AP:AS', numFmt: undefined },
    { r: 16, label: 'Renal failure / CKD flagged (renal contraindication)', formula: \`COUNTIF('CI Flags'!O2:O\${total + 1},1)\`, result: ckd, src: 'CI Flags col O', numFmt: undefined },
    { r: 17, label: 'Deaths recorded', formula: \`COUNTIF('Sheet1'!BA2:BA\${total + 1},"Yes")\`, result: deaths, src: 'Sheet1 col BA', numFmt: undefined },
    { r: 18, label: 'Mean number of GDMT drugs per patient', formula: \`AVERAGE('Sheet1'!CD2:CD\${total + 1})\`, result: meanDrugs, src: 'Sheet1 col CD', numFmt: '0.0' },
    { r: 19, label: 'Mean % GDMT adherence (no deviation)', formula: \`AVERAGE('Sheet1'!CS2:CS\${total + 1})\`, result: meanAdh, src: 'Sheet1 col CS', numFmt: '0.0%' }
  ];`;

const newKeyPointsBlock = `function buildKeyPointsSheet(workbook, analytics, patients, wsKeyPoints = null, sheet1Rows = null, ciFlagsRows = null) {
  const ws = wsKeyPoints || workbook.addWorksheet('Key Points');
  const total = (sheet1Rows && sheet1Rows.length > 0) ? sheet1Rows.length : (patients.length || 0);

  // Row 1: Title
  const r1 = ws.getRow(1);
  r1.getCell(1).value = 'HF GDMT audit – summary of key points';
  r1.getCell(1).font = { name: 'Calibri', size: 14, bold: true, color: { argb: 'FF000000' } };

  // Row 2: Subtitle
  const r2 = ws.getRow(2);
  r2.getCell(1).value = 'All figures are live formulas linked to Sheet1 and GDMT Summary; they update when the data changes.';
  r2.getCell(1).font = { name: 'Calibri', size: 11, italic: true, color: { argb: 'FF000000' } };

  // Row 4: Header
  const r4 = ws.getRow(4);
  r4.values = ['Cohort metrics', 'Value', 'Source'];
  [1, 2, 3].forEach(c => {
    const cell = r4.getCell(c);
    cell.fill = HEADER_FILL_REF_BLUE;
    cell.font = REF_FONT_BOLD;
    cell.border = BORDER_THIN;
  });

  // Calculate cohort values derived synchronously from the exact Sheet1 and CI Flags data
  // Sheet1 Column indices (0-based after admission2 splice):
  // Col B (1): UHID, Col H (7): Age, Col I (8): Gender, Col AO (40): HF Type,
  // Col AP:AS (41-44): Comorbidities 1-4, Col AV (47): Functional Status,
  // Col BA (52): Death, Col BJ (61): EF%, Col CD (81): Drugs Count, Col CS (96): Adherence %
  const males = (sheet1Rows && sheet1Rows.length > 0)
    ? sheet1Rows.filter(r => String(r[8] || '').trim().toLowerCase() === 'male').length
    : patients.filter(p => String(p.gender).toLowerCase() === 'male').length;

  const females = (sheet1Rows && sheet1Rows.length > 0)
    ? sheet1Rows.filter(r => String(r[8] || '').trim().toLowerCase() === 'female').length
    : patients.filter(p => String(p.gender).toLowerCase() === 'female').length;

  let meanAge = 0;
  if (sheet1Rows && sheet1Rows.length > 0) {
    const ages = sheet1Rows.map(r => Number(r[7])).filter(a => !isNaN(a) && a > 0);
    meanAge = ages.length > 0 ? (ages.reduce((a, b) => a + b, 0) / ages.length) : (analytics?.meanAge || 0);
  } else {
    const ages = patients.map(p => Number(p.age)).filter(a => !isNaN(a) && a > 0);
    meanAge = ages.length > 0 ? (ages.reduce((a, b) => a + b, 0) / ages.length) : (analytics?.meanAge || 0);
  }

  const hfref = (sheet1Rows && sheet1Rows.length > 0)
    ? sheet1Rows.filter(r => String(r[40] || '').toUpperCase().includes('HFREF')).length
    : patients.filter(p => String(p.hfType).toUpperCase() === 'HFREF').length;

  const hfpef = (sheet1Rows && sheet1Rows.length > 0)
    ? sheet1Rows.filter(r => String(r[40] || '').toUpperCase().includes('HFPEF')).length
    : patients.filter(p => String(p.hfType).toUpperCase() === 'HFPEF').length;

  // Mean EF %: Must strictly match live Excel formula =AVERAGE('Sheet1'!BJ2:BJ...) which averages only non-blank numbers
  let meanEf = 0;
  if (sheet1Rows && sheet1Rows.length > 0) {
    const sheet1Efs = sheet1Rows.map(r => Number(r[61])).filter(e => !isNaN(e) && e > 0);
    meanEf = sheet1Efs.length > 0
      ? Math.round((sheet1Efs.reduce((a, b) => a + b, 0) / sheet1Efs.length) * 10) / 10
      : (analytics?.meanEf != null ? Number(analytics.meanEf) : 0);
  } else if (analytics?.meanEf != null) {
    meanEf = Number(analytics.meanEf);
  } else {
    const efs = patients.map(p => Number(p.efPercent)).filter(e => !isNaN(e) && e > 0);
    meanEf = efs.length > 0 ? Math.round((efs.reduce((a, b) => a + b, 0) / efs.length) * 10) / 10 : 0;
  }

  // NYHA Functional Class: Must strictly match live Excel formulas =COUNTIF('Sheet1'!AV2:AV..., "*III*") and "*IV*"
  const nyha3 = (sheet1Rows && sheet1Rows.length > 0)
    ? sheet1Rows.filter(r => String(r[47] || '').toUpperCase().includes('III')).length
    : (analytics?.nyha3Count != null ? analytics.nyha3Count : patients.filter(p => String(p.functionalStatus || '').includes('III')).length);

  const nyha4 = (sheet1Rows && sheet1Rows.length > 0)
    ? sheet1Rows.filter(r => String(r[47] || '').toUpperCase().includes('IV')).length
    : (analytics?.nyha4Count != null ? analytics.nyha4Count : patients.filter(p => String(p.functionalStatus || '').includes('IV')).length);

  // Diabetes & Hypertension (Sheet1 Columns AP:AS)
  const dm = (sheet1Rows && sheet1Rows.length > 0)
    ? sheet1Rows.filter(r => [r[41], r[42], r[43], r[44]].some(c => String(c || '').toLowerCase().includes('diabet'))).length
    : patients.filter(p => p.diabetes || (p.comorbidities || []).some(c => c.toLowerCase().includes('diabet'))).length;

  const htn = (sheet1Rows && sheet1Rows.length > 0)
    ? sheet1Rows.filter(r => [r[41], r[42], r[43], r[44]].some(c => String(c || '').toLowerCase().includes('hyperten'))).length
    : patients.filter(p => p.hypertension || (p.comorbidities || []).some(c => c.toLowerCase().includes('hyperten'))).length;

  // Renal failure / CKD: Must strictly match live Excel formula =COUNTIF('CI Flags'!O2:O..., 1)
  const ckd = (ciFlagsRows && ciFlagsRows.length > 0)
    ? ciFlagsRows.filter(r => r[14] === 1).length
    : patients.filter(p => p.renalFailure || (p.comorbidities || []).some(c => c.toLowerCase().includes('renal') || c.toLowerCase().includes('ckd'))).length;

  // Deaths (Sheet1 Column BA)
  const deaths = (sheet1Rows && sheet1Rows.length > 0)
    ? sheet1Rows.filter(r => String(r[52] || '').trim().toLowerCase() === 'yes').length
    : patients.filter(p => p.death).length;

  // Mean GDMT drugs per patient (Sheet1 Column CD)
  let meanDrugs = 0;
  if (sheet1Rows && sheet1Rows.length > 0) {
    const drugsCounts = sheet1Rows.map(r => Number(r[81])).filter(d => !isNaN(d));
    meanDrugs = drugsCounts.length > 0 ? (drugsCounts.reduce((a, b) => a + b, 0) / drugsCounts.length) : (analytics?.meanGdmtDrugs || 0);
  } else {
    const drugsCounts = patients.map(p => p.prescribedDrugsCount || 0);
    meanDrugs = drugsCounts.length > 0 ? (drugsCounts.reduce((a, b) => a + b, 0) / drugsCounts.length) : 0;
  }

  // Mean % GDMT adherence (Sheet1 Column CS)
  let meanAdh = 0;
  if (sheet1Rows && sheet1Rows.length > 0) {
    const adherences = sheet1Rows.map(r => Number(r[96])).filter(a => !isNaN(a));
    meanAdh = adherences.length > 0 ? (adherences.reduce((a, b) => a + b, 0) / adherences.length) : (analytics?.meanAdherencePercent != null ? analytics.meanAdherencePercent / 100 : 0);
  } else {
    const adherences = patients.map(p => Number(p.adherencePercent) != null ? Number(p.adherencePercent) / 100 : 0);
    meanAdh = adherences.length > 0 ? (adherences.reduce((a, b) => a + b, 0) / adherences.length) : 0;
  }

  // Rows 5 to 19: Cohort metrics
  const metricSpecs = [
    { r: 5, label: 'Patients (UHIDs) in dataset', formula: \`COUNTA('Sheet1'!B2:B\${total + 1})\`, result: total, src: 'Sheet1 col B', numFmt: undefined },
    { r: 6, label: 'Male', formula: \`COUNTIF('Sheet1'!I2:I\${total + 1},"Male")\`, result: males, src: 'Sheet1 col I', numFmt: undefined },
    { r: 7, label: 'Female', formula: \`COUNTIF('Sheet1'!I2:I\${total + 1},"Female")\`, result: females, src: 'Sheet1 col I', numFmt: undefined },
    { r: 8, label: 'Mean age (years)', formula: \`AVERAGE('Sheet1'!H2:H\${total + 1})\`, result: meanAge, src: 'Sheet1 col H', numFmt: '0.0' },
    { r: 9, label: 'HFrEF', formula: \`COUNTIF('Sheet1'!AO2:AO\${total + 1},"*HFrEF*")\`, result: hfref, src: 'Sheet1 col AO', numFmt: undefined },
    { r: 10, label: 'HFpEF', formula: \`COUNTIF('Sheet1'!AO2:AO\${total + 1},"*HFpEF*")\`, result: hfpef, src: 'Sheet1 col AO', numFmt: undefined },
    { r: 11, label: 'Mean EF %', formula: \`AVERAGE('Sheet1'!BJ2:BJ\${total + 1})\`, result: meanEf, src: 'Sheet1 col BJ', numFmt: '0.0' },
    { r: 12, label: 'NYHA class III', formula: \`COUNTIF('Sheet1'!AV2:AV\${total + 1},"*III*")\`, result: nyha3, src: 'Sheet1 col AV', numFmt: undefined },
    { r: 13, label: 'NYHA class IV', formula: \`COUNTIF('Sheet1'!AV2:AV\${total + 1},"*IV*")\`, result: nyha4, src: 'Sheet1 col AV', numFmt: undefined },
    { r: 14, label: 'Diabetes mellitus (any comorbidity column)', formula: \`COUNTIF('Sheet1'!AP2:AS\${total + 1},"*Diabet*")\`, result: dm, src: 'Sheet1 col AP:AS', numFmt: undefined },
    { r: 15, label: 'Hypertension', formula: \`COUNTIF('Sheet1'!AP2:AS\${total + 1},"*Hyperten*")\`, result: htn, src: 'Sheet1 col AP:AS', numFmt: undefined },
    { r: 16, label: 'Renal failure / CKD flagged (renal contraindication)', formula: \`COUNTIF('CI Flags'!O2:O\${total + 1},1)\`, result: ckd, src: 'CI Flags col O', numFmt: undefined },
    { r: 17, label: 'Deaths recorded', formula: \`COUNTIF('Sheet1'!BA2:BA\${total + 1},"Yes")\`, result: deaths, src: 'Sheet1 col BA', numFmt: undefined },
    { r: 18, label: 'Mean number of GDMT drugs per patient', formula: \`AVERAGE('Sheet1'!CD2:CD\${total + 1})\`, result: meanDrugs, src: 'Sheet1 col CD', numFmt: '0.0' },
    { r: 19, label: 'Mean % GDMT adherence (no deviation)', formula: \`AVERAGE('Sheet1'!CS2:CS\${total + 1})\`, result: meanAdh, src: 'Sheet1 col CS', numFmt: '0.0%' }
  ];`;

if (content.includes(oldKeyPointsBlock)) {
  content = content.replace(oldKeyPointsBlock, newKeyPointsBlock);
} else {
  content = content.replace(oldKeyPointsBlock.replace(/\n/g, '\r\n'), newKeyPointsBlock.replace(/\n/g, '\r\n'));
}

// 6. Update exportCohortExcel tab creation and execution order
const oldExportBlock = `  // 1. Key Points (Executive Audit & Clinical Insights)
  buildKeyPointsSheet(workbook, analytics, patients);

  // 2. GDMT Summary (Pillar Coverage, Deviation Counts, Adherence Distribution)
  buildGdmtSummarySheet(workbook, analytics, patients);

  // 3. Sheet1 (Master Cohort Dataset mapped up to Current device therapy + GDMT columns)
  buildSheet1(workbook, patients, sheet1Data);

  // 4. Contraindications
  buildContraindicationsSheet(workbook);

  // 5. CI Flags
  buildCiFlagsSheet(workbook, patients);`;

const newExportBlock = `  // Create worksheets in exact visual order to keep Tab #1 as Key Points
  const wsKeyPoints = workbook.addWorksheet('Key Points');
  const wsGdmtSummary = workbook.addWorksheet('GDMT Summary');
  const wsSheet1 = workbook.addWorksheet('Sheet1');
  const wsContraindications = workbook.addWorksheet('Contraindications');
  const wsCiFlags = workbook.addWorksheet('CI Flags');

  // 1. Build Sheet1 first to obtain exact rendered rows and columns
  const sheet1Rows = buildSheet1(workbook, patients, sheet1Data, wsSheet1);

  // 2. Build Contraindications reference rules
  buildContraindicationsSheet(workbook, wsContraindications);

  // 3. Build CI Flags and obtain exact flag results
  const ciFlagsRows = buildCiFlagsSheet(workbook, patients, wsCiFlags);

  // 4. Build GDMT Summary
  buildGdmtSummarySheet(workbook, analytics, patients, wsGdmtSummary);

  // 5. Build Key Points using exact Sheet1 and CI Flags data so formula results match 100%
  buildKeyPointsSheet(workbook, analytics, patients, wsKeyPoints, sheet1Rows, ciFlagsRows);`;

if (content.includes(oldExportBlock)) {
  content = content.replace(oldExportBlock, newExportBlock);
} else {
  content = content.replace(oldExportBlock.replace(/\n/g, '\r\n'), newExportBlock.replace(/\n/g, '\r\n'));
}

fs.writeFileSync(path, content, 'utf8');
console.log('Successfully applied all fixes to excelReportGenerator.js!');

