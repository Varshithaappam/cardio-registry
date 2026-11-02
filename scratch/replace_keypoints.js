const fs = require('fs');
const path = 'c:/Users/ADMIN/Desktop/projects/cardio-registry/frontend/src/utils/excelReportGenerator.js';
let content = fs.readFileSync(path, 'utf8');

const targetHeader = `function buildKeyPointsSheet(workbook, analytics, patients) {
  const ws = workbook.addWorksheet('Key Points');
  const total = patients.length || 0;`;

const newKeyPointsFunction = `function buildKeyPointsSheet(workbook, analytics, patients, wsKeyPoints = null, sheet1Rows = null, ciFlagsRows = null) {
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
  // Sheet1 Column indices: Col B (1): UHID, Col H (7): Age, Col I (8): Gender, Col AO (40): HF Type,
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
  }`;

// Find start of buildKeyPointsSheet and replace up to metricSpecs
const fnStart = content.indexOf('function buildKeyPointsSheet(');
const specsStart = content.indexOf('  // Rows 5 to 19: Cohort metrics', fnStart);

if (fnStart !== -1 && specsStart !== -1) {
  content = content.substring(0, fnStart) + newKeyPointsFunction + '\n\n' + content.substring(specsStart);
  fs.writeFileSync(path, content, 'utf8');
  console.log('Successfully updated buildKeyPointsSheet implementation!');
} else {
  console.error('Could not locate buildKeyPointsSheet indices!', fnStart, specsStart);
}
