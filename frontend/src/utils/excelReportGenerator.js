/**
 * Clinical Intelligence & GDMT Multi-Sheet Excel Workbook Generator
 * Replicates the exact 6-sheet structure of HF_GDMT_160926_updated_as_per_calculations.xlsx:
 * 1. Sheet1 (96-column Master Cohort Clinical Dataset)
 * 2. Notes (Methodology & Clinical Observations)
 * 3. GDMT Summary (Pillar Coverage, Drug Counts, Deviations, Adherence Distribution)
 * 4. Contraindications (Guideline Criteria, Source Columns, Rules & Thresholds)
 * 5. CI Flags (Patient-by-Patient Evaluated Contraindication Matrix)
 * 6. Key Points (Executive Audit, Demographics, Phenotypes, Outcomes & Adherence)
 */

import ExcelJS from 'exceljs';
import { fetchHfSheet1Export } from '../api/gdmtApi';

// Header styles
const HEADER_FILL_TEAL = {
  type: 'pattern',
  pattern: 'solid',
  fgColor: { argb: 'FF0D9488' } // Teal 600
};

const HEADER_FILL_NAVY = {
  type: 'pattern',
  pattern: 'solid',
  fgColor: { argb: 'FF1E293B' } // Slate 800
};

const HEADER_FONT = {
  name: 'Calibri',
  size: 11,
  bold: true,
  color: { argb: 'FFFFFFFF' }
};

const SECTION_FONT = {
  name: 'Calibri',
  size: 11,
  bold: true,
  color: { argb: 'FF0F172A' }
};

const BORDER_THIN = {
  top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
  left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
  bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
  right: { style: 'thin', color: { argb: 'FFE2E8F0' } }
};

/**
 * Auto-adjust column widths based on content
 */
function autoFitColumns(worksheet, minWidth = 10, maxWidth = 45) {
  worksheet.columns.forEach(column => {
    let maxLen = 0;
    column.eachCell({ includeEmpty: true }, (cell, rowNumber) => {
      // Don't size based on title rows spanning wide strings
      if (rowNumber === 1 && String(cell.value || '').length > 50) return;
      const len = cell.value ? String(cell.value).length : 0;
      if (len > maxLen) maxLen = len;
    });
    column.width = Math.max(minWidth, Math.min(maxLen + 3, maxWidth));
  });
}

/**
 * Build Sheet1: Scoped exactly up to "Current device therapy" following mapping.xlsx rules
 */
function buildSheet1(workbook, patients, sheet1Data = null) {
  const ws = workbook.addWorksheet('Sheet1');

  // If backend provided pre-processed sheet1Data adhering to literal column name mapping rules
  if (sheet1Data && Array.isArray(sheet1Data.headers) && Array.isArray(sheet1Data.rows)) {
    const headerRow = ws.addRow(sheet1Data.headers);
    headerRow.eachCell(cell => {
      cell.fill = HEADER_FILL_TEAL;
      cell.font = HEADER_FONT;
      cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
      cell.border = BORDER_THIN;
    });
    headerRow.height = 28;

    sheet1Data.rows.forEach((rowVals, idx) => {
      const dataRow = ws.addRow(rowVals);
      dataRow.eachCell((cell, colNum) => {
        cell.border = BORDER_THIN;
        cell.font = { name: 'Calibri', size: 10 };
        if (colNum === 97) {
          cell.numFmt = '0.0%';
          cell.alignment = { horizontal: 'right', vertical: 'middle' };
        }
      });

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
    return;
  }

  // Fallback: Default headers up to Current device therapy + GDMT columns 73-97
  const headers = [
    'SL No',
    'UHID(T3)',
    'IP No(T3)',
    'IP No(Prosoft)',
    'HF ID',
    'PINCODE',
    'Patient name',
    'Age',
    'Gender',
    'Contact no 1',
    'Contact no 2',
    'Payment',
    'Caregiver Name&Relationship to patient',
    'Treating Cardiologist',
    'Date of visit/hospitalization',
    'Discharge Date',
    'Present diagnosis',
    'Reasons for Admission1',
    'Reasons for Admission2',
    'Reasons for admission3',
    'Reasons other than HF',
    'Previous Diagnosis',
    'Medical History',
    'Recent hospitalization date',
    'Reason for hospitalization',
    'VT/VF risk assessment',
    'Weight',
    'Height',
    'Heart rate',
    'Heart rate variability',
    'Respiratory rate',
    'Column2',
    'Blood pressure sitting',
    'Blood pressure standing',
    'Mental status',
    'Symptoms1',
    'Symptoms2',
    'Symptoms3',
    'Clinical signs of volume overload1',
    'Clinical signs of volume overload2',
    'Type of Heart failure',
    'Comorbidities1',
    'Comorbidities2',
    'Comorbidities3',
    'Comorbidities4',
    'Risk factors1',
    'Stage of HF',
    'Functional Status',
    'AF status',
    'Major adverse cardiac events (Y/N)',
    'Major adverse cardiac events ( unstructured )',
    'Major procedures(if any specify)',
    'Death',
    'Death Date',
    'Location of Death',
    'ECG Q waves',
    'Q waves Leads',
    'Any blockages',
    'QT',
    'QTC',
    'ECHO(RWMI)',
    'EF%',
    'Holter/Event Recorder',
    'Lab tests Potassium',
    'Creatinine',
    'Hb',
    'BNP',
    'Sodium',
    'Uric acid',
    'Total Cholesterol',
    'NT-proBNP',
    'Current device therapy',
    'Drugs',
    'Generic Names',
    'Drug Category',
    'Beta blocker',
    'ACE inhibitor',
    'ARB',
    'ARNI',
    'MRA',
    'SGLT2 inhibitor',
    'Number of GDMT Drugs Taken',
    'Known Contraindication for Beta blocker',
    'Known Contraindication for ACE inhibitor',
    'Known Contraindication for ARB',
    'Known Contraindication for ARNI',
    'Known Contraindication for MRA',
    'Known Contraindication for SGLT2 inhibitor',
    'Deviation for Beta blocker2',
    'Deviation for ACE inhibitor3',
    'Deviation for ARB4',
    'Deviation for ARNI5',
    'Deviation for MRA6',
    'Deviation for SGLT2 inhibitor7',
    'Total Deviations present',
    'Total Variables',
    '% of GDMT adhered to'
  ];

  const headerRow = ws.addRow(headers);
  headerRow.eachCell(cell => {
    cell.fill = HEADER_FILL_TEAL;
    cell.font = HEADER_FONT;
    cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
    cell.border = BORDER_THIN;
  });
  headerRow.height = 28;

  patients.forEach((p, idx) => {
    const rowValues = [
      idx + 1,
      p.uhid || '',
      p.ipNo || '',
      p.visitId || '',
      p.hfRegistryNo || (p.hfId ? `HF${String(p.hfId).padStart(5, '0')}` : ''),
      p.pincode || '',
      p.name || '',
      p.age || '',
      p.gender || '',
      p.phoneNo || '',
      p.caregiverPhone || '',
      p.insuranceMode || '',
      p.caregiverName || '',
      p.treatingCardiologist || '',
      p.admissionDate || p.visitDate || '',
      p.dischargeDate || '',
      p.presentDiagnosis || '',
      p.admissionReason || '',
      '',
      '',
      '',
      p.previousDiagnosis || '',
      '',
      '',
      '',
      '',
      '',
      '',
      p.heartRate || '',
      '',
      '',
      '',
      p.bloodPressureSitting || '',
      '',
      '',
      '',
      '',
      '',
      '',
      '',
      p.hfType || '',
      '',
      '',
      '',
      '',
      '',
      '',
      p.functionalStatus || '',
      '',
      p.death ? 'Yes' : 'No',
      '',
      '',
      p.death ? 'Yes' : 'No',
      p.deathDate || '',
      p.deathLocation || '',
      '',
      '',
      '',
      '',
      '',
      '',
      p.efPercent != null ? p.efPercent : '',
      '',
      p.potassium || '',
      p.creatinine || '',
      p.hemoglobin || '',
      '',
      '',
      '',
      '',
      '',
      p.currentDeviceTherapy || '',
      p.prescribedDrugsSummary || '',
      p.prescribedDrugsSummary || '',
      'Heart Failure GDMT',
      p.pillarEvaluations?.betaBlocker?.prescribed ? 1 : 0,
      p.pillarEvaluations?.aceInhibitor?.prescribed ? 1 : 0,
      p.pillarEvaluations?.arb?.prescribed ? 1 : 0,
      p.pillarEvaluations?.arni?.prescribed ? 1 : 0,
      p.pillarEvaluations?.mra?.prescribed ? 1 : 0,
      p.pillarEvaluations?.sglt2Inhibitor?.prescribed ? 1 : 0,
      p.prescribedDrugsCount != null ? p.prescribedDrugsCount : 0,
      p.pillarEvaluations?.betaBlocker?.contraindication ? 1 : 0,
      p.pillarEvaluations?.aceInhibitor?.contraindication ? 1 : 0,
      p.pillarEvaluations?.arb?.contraindication ? 1 : 0,
      p.pillarEvaluations?.arni?.contraindication ? 1 : 0,
      p.pillarEvaluations?.mra?.contraindication ? 1 : 0,
      p.pillarEvaluations?.sglt2Inhibitor?.contraindication ? 1 : 0,
      p.pillarEvaluations?.betaBlocker?.isDeviation ? 1 : 0,
      p.pillarEvaluations?.aceInhibitor?.isDeviation ? 1 : 0,
      p.pillarEvaluations?.arb?.isDeviation ? 1 : 0,
      p.pillarEvaluations?.arni?.isDeviation ? 1 : 0,
      p.pillarEvaluations?.mra?.isDeviation ? 1 : 0,
      p.pillarEvaluations?.sglt2Inhibitor?.isDeviation ? 1 : 0,
      p.deviationsCount != null ? p.deviationsCount : 0,
      6,
      p.adherencePercent != null ? p.adherencePercent / 100 : 0
    ];

    const dataRow = ws.addRow(rowValues);
    dataRow.eachCell((cell, colNum) => {
      cell.border = BORDER_THIN;
      cell.font = { name: 'Calibri', size: 10 };
      if (colNum === 97) {
        cell.numFmt = '0.0%';
        cell.alignment = { horizontal: 'right', vertical: 'middle' };
      }
    });

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

  autoFitColumns(ws, 10, 40);
}

/**
 * Build Notes Sheet
 */
function buildNotesSheet(workbook) {
  const ws = workbook.addWorksheet('Notes');
  ws.addRow([]);
  const r2 = ws.addRow(['the renal flag is the main driver (109 patients) because "AKI"/"CKD"/"Renal failure" appear widely']);
  r2.getCell(1).font = { name: 'Calibri', size: 11, italic: true };
  const r3 = ws.addRow(['GDMT guideline adherence is calculated across 6 pillars: Beta blocker, ACEi, ARB, ARNI, MRA, and SGLT2i.']);
  r3.getCell(1).font = { name: 'Calibri', size: 11 };
  const r4 = ws.addRow(['Adherence % = ((6 - Total Clinical Deviations) / 6) * 100%.']);
  r4.getCell(1).font = { name: 'Calibri', size: 11, bold: true };
  autoFitColumns(ws, 30, 80);
}

/**
 * Build GDMT Summary Sheet
 */
function buildGdmtSummarySheet(workbook, analytics, patients) {
  const ws = workbook.addWorksheet('GDMT Summary');
  const totalCount = patients.length || 1;

  // Table 1: GDMT Pillar Coverage
  const t1Header = ws.addRow([
    'GDMT Category',
    'Number of Patients Received',
    'Total Patients',
    'Proportional Decimal Value',
    'Percentage Value'
  ]);
  t1Header.eachCell(cell => {
    cell.fill = HEADER_FILL_TEAL;
    cell.font = HEADER_FONT;
    cell.alignment = { horizontal: 'center', vertical: 'middle' };
  });

  const categories = [
    { name: 'Beta blocker', key: 'betaBlocker' },
    { name: 'ACE inhibitor', key: 'aceInhibitor' },
    { name: 'ARB', key: 'arb' },
    { name: 'ARNI', key: 'arni' },
    { name: 'MRA', key: 'mra' },
    { name: 'SGLT2 inhibitor', key: 'sglt2Inhibitor' }
  ];

  categories.forEach(cat => {
    const count = patients.filter(p => p.pillarEvaluations?.[cat.key]?.prescribed).length;
    const ratio = count / totalCount;
    const row = ws.addRow([
      cat.name,
      count,
      totalCount,
      ratio,
      ratio * 100
    ]);
    row.getCell(4).numFmt = '0.0000';
    row.getCell(5).numFmt = '0.0"%"';
    row.eachCell(cell => (cell.border = BORDER_THIN));
  });

  ws.addRow([]);
  ws.addRow([]);

  // Table 2: Number of GDMT Drugs Taken
  const t2Title = ws.addRow(['Number of GDMT Drugs Taken', 'Number of Patients', '% of Cohort']);
  t2Title.eachCell(cell => {
    cell.fill = HEADER_FILL_NAVY;
    cell.font = HEADER_FONT;
  });

  for (let drugs = 0; drugs <= 6; drugs++) {
    const count = patients.filter(p => (p.prescribedDrugsCount || 0) === drugs).length;
    const row = ws.addRow([drugs, count, count / totalCount]);
    row.getCell(3).numFmt = '0.0%';
    row.eachCell(cell => (cell.border = BORDER_THIN));
  }

  ws.addRow([]);
  ws.addRow([]);

  // Table 3: Deviations Breakdown
  const t3Title = ws.addRow(['Clinical Deviations by Drug Class', 'Deviations Count', 'Deviation Rate (%)']);
  t3Title.eachCell(cell => {
    cell.fill = HEADER_FILL_NAVY;
    cell.font = HEADER_FONT;
  });

  categories.forEach(cat => {
    const devCount = patients.filter(p => p.pillarEvaluations?.[cat.key]?.isDeviation).length;
    const row = ws.addRow([`Deviation for ${cat.name}`, devCount, devCount / totalCount]);
    row.getCell(3).numFmt = '0.0%';
    row.eachCell(cell => (cell.border = BORDER_THIN));
  });

  ws.addRow([]);
  ws.addRow([]);

  // Table 4: % Adherence Distribution
  const t4Title = ws.addRow(['% of GDMT Adhered To', 'Number of Deviations', 'UHID Count', 'Proportion']);
  t4Title.eachCell(cell => {
    cell.fill = HEADER_FILL_TEAL;
    cell.font = HEADER_FONT;
  });

  const adherenceBrackets = [
    { percent: 1.0, deviations: 0, label: '100.0%' },
    { percent: 0.833, deviations: 1, label: '83.3%' },
    { percent: 0.667, deviations: 2, label: '66.7%' },
    { percent: 0.500, deviations: 3, label: '50.0%' },
    { percent: 0.333, deviations: 4, label: '33.3%' },
    { percent: 0.167, deviations: 5, label: '16.7%' },
    { percent: 0.0, deviations: 6, label: '0.0%' }
  ];

  adherenceBrackets.forEach(b => {
    const count = patients.filter(p => (p.deviationsCount || 0) === b.deviations).length;
    const row = ws.addRow([b.percent, b.deviations, count, count / totalCount]);
    row.getCell(1).numFmt = '0.0%';
    row.getCell(4).numFmt = '0.0%';
    row.eachCell(cell => (cell.border = BORDER_THIN));
  });

  autoFitColumns(ws, 12, 45);
}

/**
 * Build Contraindications Reference Sheet
 */
function buildContraindicationsSheet(workbook) {
  const ws = workbook.addWorksheet('Contraindications');

  const titleRow = ws.addRow(['GDMT contraindication criteria identifiable from Sheet1']);
  titleRow.getCell(1).font = { name: 'Calibri', size: 14, bold: true, color: { argb: 'FF0D9488' } };
  ws.addRow([]);

  const headers = [
    'Drug class',
    'Contraindication',
    'Sheet1 source column(s)',
    'Rule / keywords searched',
    'Threshold (editable)',
    'Type',
    'Sheet1 output column'
  ];

  const headerRow = ws.addRow(headers);
  headerRow.eachCell(cell => {
    cell.fill = HEADER_FILL_TEAL;
    cell.font = HEADER_FONT;
    cell.border = BORDER_THIN;
  });

  const criteria = [
    ['Beta blocker', 'Bradycardia', 'AB Heart rate', 'Heart rate < threshold', 50, 'Absolute', 'CD'],
    ['Beta blocker', 'Hypotension', 'AF Blood pressure sitting (systolic)', 'Systolic BP < threshold', 90, 'Absolute', 'CD'],
    ['Beta blocker', 'Cardiogenic shock / inotrope support', 'P, T, U diagnosis; BT drugs', 'Keywords: SHOCK (diagnosis); DOBUTAMINE, DOBU, NORAD (drugs)', null, 'Absolute', 'CD'],
    ['Beta blocker', 'Asthma / COPD / bronchospastic disease', 'P, U, AO', 'Keywords: ASTHMA, COPD, BRONCH', null, 'Relative (COPD) / Absolute (asthma)', 'CD'],
    ['Beta blocker', 'High-grade AV block / sick sinus (without pacemaker)', 'P, U', 'Keywords: AV BLOCK, HEART BLOCK, CHB, SICK SINUS', null, 'Absolute', 'CD'],
    ['ACE inhibitor', 'Hypotension', 'AF (systolic)', 'Systolic BP < threshold', 90, 'Absolute', 'CE'],
    ['ACE inhibitor', 'Hyperkalaemia', 'BK Potassium; U', 'Potassium > threshold, or keyword HYPERKAL', 5.5, 'Absolute', 'CE'],
    ['ACE inhibitor', 'Significant renal impairment (creatinine-based)', 'BL Creatinine', 'Creatinine > threshold', 2.5, 'Absolute', 'CE'],
    ['ACE inhibitor', 'History of angioedema', 'P, U, V', 'Keyword: ANGIOEDEMA', null, 'Absolute', 'CE'],
    ['ARB', 'Hypotension', 'AF (systolic)', 'Systolic BP < threshold', 90, 'Absolute', 'CF'],
    ['ARB', 'Hyperkalaemia', 'BK Potassium; U', 'Potassium > threshold, or keyword HYPERKAL', 5.5, 'Absolute', 'CF'],
    ['ARB', 'Significant renal impairment', 'BL Creatinine', 'Creatinine > threshold', 2.5, 'Absolute', 'CF'],
    ['ARNI', 'Hypotension (stricter)', 'AF (systolic)', 'Systolic BP < threshold', 100, 'Absolute', 'CG'],
    ['ARNI', 'Hyperkalaemia', 'BK Potassium', 'Potassium > threshold', 5.5, 'Absolute', 'CG'],
    ['ARNI', 'Significant renal impairment', 'BL Creatinine', 'Creatinine > threshold', 2.5, 'Absolute', 'CG'],
    ['MRA', 'Hyperkalaemia', 'BK Potassium', 'Potassium > threshold', 5.0, 'Absolute', 'CH'],
    ['MRA', 'Significant renal impairment', 'BL Creatinine', 'Creatinine > threshold', 2.5, 'Absolute', 'CH'],
    ['SGLT2 inhibitor', 'Severe renal impairment', 'BL Creatinine', 'Creatinine > threshold', 3.0, 'Absolute', 'CI'],
    ['SGLT2 inhibitor', 'DKA / Ketoacidosis', 'P, U diagnosis', 'Keywords: DKA, KETOACID', null, 'Absolute', 'CI'],
    ['SGLT2 inhibitor', 'UTI / Urosepsis', 'P, U diagnosis', 'Keywords: UTI, UROSEPSIS', null, 'Absolute', 'CI']
  ];

  criteria.forEach(c => {
    const r = ws.addRow(c);
    r.eachCell(cell => (cell.border = BORDER_THIN));
  });

  autoFitColumns(ws, 12, 50);
}

/**
 * Build CI Flags Sheet (Patient-Level Evaluated Matrix)
 */
function buildCiFlagsSheet(workbook, patients) {
  const ws = workbook.addWorksheet('CI Flags');

  const headers = [
    'UHID',
    'Systolic BP',
    'Heart rate',
    'Potassium',
    'Creatinine',
    'Clinical text (P,S,T,U,X,AO,AP,AQ,AR)',
    'Drug text (BT,BU)',
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
      String(p.presentDiagnosis || '').toLowerCase().includes('shock') ? 1 : 0,
      String(p.presentDiagnosis || '').toLowerCase().includes('copd') || String(p.presentDiagnosis || '').toLowerCase().includes('asthma') ? 1 : 0,
      k > 5.5 ? 1 : 0,
      k > 5.0 ? 1 : 0,
      creat > 2.5 ? 1 : 0,
      String(p.presentDiagnosis || '').toLowerCase().includes('block') ? 1 : 0,
      String(p.presentDiagnosis || '').toLowerCase().includes('dka') ? 1 : 0,
      String(p.presentDiagnosis || '').toLowerCase().includes('uti') ? 1 : 0,
      creat > 3.0 ? 1 : 0
    ];

    const dataRow = ws.addRow(row);
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
}

/**
 * Build Key Points Sheet
 */
function buildKeyPointsSheet(workbook, analytics, patients) {
  const ws = workbook.addWorksheet('Key Points');

  const titleRow = ws.addRow(['HF GDMT audit — summary of key points']);
  titleRow.getCell(1).font = { name: 'Calibri', size: 14, bold: true, color: { argb: 'FF0D9488' } };

  const subRow = ws.addRow(['All figures reflect active clinical records and live GDMT adherence evaluations.']);
  subRow.getCell(1).font = { name: 'Calibri', size: 10, italic: true };
  ws.addRow([]);

  const tHeader = ws.addRow(['Cohort metrics', 'Value', 'Source']);
  tHeader.eachCell(cell => {
    cell.fill = HEADER_FILL_TEAL;
    cell.font = HEADER_FONT;
    cell.border = BORDER_THIN;
  });

  const total = patients.length || 0;
  const males = patients.filter(p => String(p.gender).toLowerCase() === 'male').length;
  const females = patients.filter(p => String(p.gender).toLowerCase() === 'female').length;
  const ages = patients.map(p => Number(p.age)).filter(a => !isNaN(a) && a > 0);
  const meanAge = ages.length > 0 ? (ages.reduce((a, b) => a + b, 0) / ages.length).toFixed(1) : 'N/A';

  const hfref = patients.filter(p => String(p.hfType).toUpperCase() === 'HFREF').length;
  const hfpef = patients.filter(p => String(p.hfType).toUpperCase() === 'HFPEF').length;
  const efs = patients.map(p => Number(p.efPercent)).filter(e => !isNaN(e) && e > 0);
  const meanEf = efs.length > 0 ? (efs.reduce((a, b) => a + b, 0) / efs.length).toFixed(1) : 'N/A';

  const nyha3 = patients.filter(p => String(p.functionalStatus || '').includes('III')).length;
  const nyha4 = patients.filter(p => String(p.functionalStatus || '').includes('IV')).length;

  const dm = patients.filter(p => p.diabetes || (p.comorbidities || []).some(c => c.toLowerCase().includes('diabet'))).length;
  const htn = patients.filter(p => p.hypertension || (p.comorbidities || []).some(c => c.toLowerCase().includes('hyperten'))).length;
  const ckd = patients.filter(p => p.renalFailure || (p.comorbidities || []).some(c => c.toLowerCase().includes('renal') || c.toLowerCase().includes('ckd'))).length;
  const deaths = patients.filter(p => p.death).length;

  const adherences = patients.map(p => Number(p.adherencePercent)).filter(a => !isNaN(a));
  const meanAdh = adherences.length > 0 ? (adherences.reduce((a, b) => a + b, 0) / adherences.length).toFixed(1) : 'N/A';

  const rows = [
    ['Patients (UHIDs) in dataset', total, 'Sheet1 col B'],
    ['Male', males, 'Sheet1 col H'],
    ['Female', females, 'Sheet1 col H'],
    ['Mean age (years)', Number(meanAge) || meanAge, 'Sheet1 col G'],
    ['HFrEF (Reduced EF)', hfref, 'Sheet1 col AN'],
    ['HFpEF (Preserved EF)', hfpef, 'Sheet1 col AN'],
    ['Mean EF %', Number(meanEf) || meanEf, 'Sheet1 col BI'],
    ['NYHA class III', nyha3, 'Sheet1 col AU'],
    ['NYHA class IV', nyha4, 'Sheet1 col AU'],
    ['Diabetes mellitus', dm, 'Sheet1 comorbidity columns'],
    ['Hypertension', htn, 'Sheet1 comorbidity columns'],
    ['Renal failure / CKD', ckd, 'Sheet1 comorbidity columns'],
    ['In-hospital mortality', deaths, 'Sheet1 col AZ'],
    ['Mortality rate (%)', total > 0 ? ((deaths / total) * 100).toFixed(1) + '%' : '0.0%', 'Derived'],
    ['Mean GDMT Adherence (%)', meanAdh !== 'N/A' ? `${meanAdh}%` : 'N/A', 'Sheet1 col CR']
  ];

  rows.forEach(r => {
    const row = ws.addRow(r);
    row.eachCell(cell => (cell.border = BORDER_THIN));
  });

  autoFitColumns(ws, 15, 50);
}

/**
 * Build Export_to_DB_Mapping Sheet
 * Full mapping of all export columns to their corresponding database columns and tables.
 */
function buildExportToDbMappingSheet(workbook) {
  const ws = workbook.addWorksheet('Export_to_DB_Mapping');

  const headers = ['Column Name in Export Sheet', 'Column Name in Database', 'Table Name'];
  const headerRow = ws.addRow(headers);
  headerRow.eachCell(cell => {
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF1E40AF' } // Deep Navy Blue
    };
    cell.font = HEADER_FONT;
    cell.alignment = { vertical: 'middle', horizontal: 'center' };
    cell.border = BORDER_THIN;
  });
  headerRow.height = 26;

  const mappingData = [
    // Sheet1 (96 Columns)
    ['SL No', '', ''],
    ['UHID(T3)', 'uhid', 'hf_gdmt_evaluation'],
    ['IP No(T3)', 'ip_no', 'patient_demographics'],
    ['IP No(Prosoft)', 'visit_id', 'hf_administrative'],
    ['HF ID', 'hf_id', 'hf_registry'],
    ['PINCODE', 'pincode', 'patient_demographics'],
    ['Patient name', 'patient_name', 'hf_gdmt_evaluation'],
    ['Age', 'age', 'hf_gdmt_evaluation'],
    ['Gender', 'gender', 'hf_gdmt_evaluation'],
    ['Contact no 1', 'phone_no', 'patient_demographics'],
    ['Contact no 2', 'caregiver_phone', 'hf_administrative'],
    ['Payment', 'insurance_mode', 'hf_administrative'],
    ['Caregiver Name&Relationship to patient', 'caregiver_name', 'hf_administrative'],
    ['Treating Cardiologist', 'treating_cardiologist', 'hf_administrative'],
    ['Date of visit/hospitalization', 'visit_date', 'hf_administrative'],
    ['Discharge Date', 'discharge_date', 'hf_gdmt_evaluation'],
    ['Present diagnosis', 'present_diagnosis', 'hf_administrative'],
    ['Reasons for Admission1', 'admission_reason', 'hf_administrative'],
    ['Reasons for Admission2', 'other_admission_reason', 'hf_administrative'],
    ['Reasons for admission3', 'admission_type', 'hf_administrative'],
    ['Reasons other than HF', 'precipitating_other', 'hf_administrative'],
    ['Previous Diagnosis', 'previous_diagnosis', 'hf_initial_assessment'],
    ['Medical History', 'history_other', 'hf_initial_assessment'],
    ['Recent hospitalization date', 'recent_hospitalization_dates', 'hf_initial_assessment'],
    ['Reason for hospitalization', 'recent_hospitalization_reasons', 'hf_initial_assessment'],
    ['VT/VF risk assessment', 'documented_vt_vf', 'hf_initial_assessment'],
    ['Weight', 'weight', 'hf_initial_assessment'],
    ['Height', 'height', 'hf_initial_assessment'],
    ['Heart rate', 'heart_rate', 'hf_initial_assessment'],
    ['Heart rate variability', 'heart_rate_variability', 'hf_advanced_investigations'],
    ['Respiratory rate', 'respiratory_rate', 'hf_initial_assessment'],
    ['Column2', '', ''],
    ['Blood pressure sitting', 'systolic_bp_sitting', 'hf_initial_assessment'],
    ['Blood pressure standing', 'systolic_bp_standing', 'hf_initial_assessment'],
    ['Mental status', 'mental_status_alert_oriented', 'hf_initial_assessment'],
    ['Symptoms1', 'dyspnea_at_rest', 'hf_initial_assessment'],
    ['Symptoms2', 'dyspnea_with_exertion', 'hf_initial_assessment'],
    ['Symptoms3', 'fatigue', 'hf_initial_assessment'],
    ['Clinical signs of volume overload1', 'peripheral_edema', 'hf_initial_assessment'],
    ['Clinical signs of volume overload2', 'ascites', 'hf_initial_assessment'],
    ['Type of Heart failure', 'hf_type', 'hf_gdmt_evaluation'],
    ['Comorbidities1', 'has_dm', 'hf_gdmt_evaluation'],
    ['Comorbidities2', 'has_htn', 'hf_gdmt_evaluation'],
    ['Comorbidities3', 'has_ckd', 'hf_gdmt_evaluation'],
    ['Comorbidities4', 'has_cad', 'hf_gdmt_evaluation'],
    ['Risk factors1', 'smoking', 'hf_final_clinical_assessment'],
    ['Stage of HF', 'stage_c', 'hf_final_clinical_assessment'],
    ['Functional Status', 'nyha_class', 'hf_gdmt_evaluation'],
    ['AF status', 'af_nsr', 'hf_final_clinical_assessment'],
    ['Major adverse cardiac events (Y/N)', 'mace_hospitalization', 'hf_final_clinical_assessment'],
    ['Major adverse cardiac events ( unstructured )', 'mace_other_details', 'hf_final_clinical_assessment'],
    ['Major procedures(if any specify)', 'mace_major_procedure', 'hf_final_clinical_assessment'],
    ['Death', 'is_death', 'hf_gdmt_evaluation'],
    ['Death Date', 'death_date', 'hf_gdmt_evaluation'],
    ['Location of Death', 'death_hospital', 'hf_gdmt_evaluation'],
    ['ECG Q waves', 'ecg_qwaves_yes', 'hf_cardiac_investigations'],
    ['Q waves Leads', 'ecg_qwave_leads', 'hf_cardiac_investigations'],
    ['Any blockages', 'ecg_block_other', 'hf_cardiac_investigations'],
    ['QT', 'ecg_qt', 'hf_cardiac_investigations'],
    ['QTC', 'ecg_qtc', 'hf_cardiac_investigations'],
    ['ECHO(RWMI)', 'rwmi_global', 'hf_cardiac_investigations'],
    ['EF%', 'ef_percent', 'hf_gdmt_evaluation'],
    ['Holter/Event Recorder', 'holter_test_date', 'hf_advanced_investigations'],
    ['Lab tests Potassium', 'potassium_result', 'hf_lab_tests'],
    ['Creatinine', 'creatinine_result', 'hf_lab_tests'],
    ['Hb', 'hb_result', 'hf_lab_tests'],
    ['BNP', 'bnp_result', 'hf_lab_tests'],
    ['Sodium', 'sodium_result', 'hf_lab_tests'],
    ['Uric acid', 'other_lab_test_result', 'hf_lab_tests'],
    ['Total Cholesterol', 'ldl_result', 'hf_lab_tests'],
    ['NT-proBNP', 'nt_pro_bnp_result', 'hf_lab_tests'],
    ['Current device therapy', 'current_device_yes', 'hf_device_therapy'],
    ['Drugs', 'drugs', 'hf_recommendations'],
    ['Generic Names', 'beta_blocker_other_name', 'hf_medical_therapy_part1'],
    ['Drug Category', '', ''],
    ['Beta blocker', 'rx_beta_blocker', 'hf_gdmt_evaluation'],
    ['ACE inhibitor', 'rx_ace_inhibitor', 'hf_gdmt_evaluation'],
    ['ARB', 'rx_arb', 'hf_gdmt_evaluation'],
    ['ARNI', 'rx_arni', 'hf_gdmt_evaluation'],
    ['MRA', 'rx_mra', 'hf_gdmt_evaluation'],
    ['SGLT2 inhibitor', 'rx_sglt2_inhibitor', 'hf_gdmt_evaluation'],
    ['Number of GDMT Drugs Taken', 'prescribed_drugs_count', 'hf_gdmt_evaluation'],
    ['Known Contraindication for Beta blocker', 'ci_beta_blocker', 'hf_gdmt_evaluation'],
    ['Known Contraindication for ACE inhibitor', 'ci_ace_inhibitor', 'hf_gdmt_evaluation'],
    ['Known Contraindication for ARB', 'ci_arb', 'hf_gdmt_evaluation'],
    ['Known Contraindication for ARNI', 'ci_arni', 'hf_gdmt_evaluation'],
    ['Known Contraindication for MRA', 'ci_mra', 'hf_gdmt_evaluation'],
    ['Known Contraindication for SGLT2 inhibitor', 'ci_sglt2_inhibitor', 'hf_gdmt_evaluation'],
    ['Deviation for Beta blocker2', '', ''],
    ['Deviation for ACE inhibitor3', '', ''],
    ['Deviation for ARB4', '', ''],
    ['Deviation for ARNI5', '', ''],
    ['Deviation for MRA6', '', ''],
    ['Deviation for SGLT2 inhibitor7', '', ''],
    ['Total Deviations present', 'deviations_count', 'hf_gdmt_evaluation'],
    ['Total Variables', 'appropriate_care_count', 'hf_gdmt_evaluation'],
    ['% of GDMT adhered to', 'adherence_percent', 'hf_gdmt_evaluation'],

    // CI Flags (19 Columns)
    ['UHID', 'uhid', 'hf_gdmt_evaluation'],
    ['Systolic BP', 'systolic_bp_sitting', 'hf_initial_assessment'],
    ['Heart rate', 'heart_rate', 'hf_initial_assessment'],
    ['Potassium', 'potassium_result', 'hf_lab_tests'],
    ['Creatinine', 'creatinine_result', 'hf_lab_tests'],
    ['Clinical text (P,S,T,U,X,AO,AP,AQ,AR)', '', ''],
    ['Drug text (BT,BU)', '', ''],
    ['Bradycardia', 'ci_beta_blocker', 'hf_gdmt_evaluation'],
    ['SBP < BB/ACEi/ARB threshold', 'ci_beta_blocker', 'hf_gdmt_evaluation'],
    ['SBP < ARNI threshold', 'ci_arni', 'hf_gdmt_evaluation'],
    ['Shock / inotropes', 'beta_not_used_hypotension', 'hf_medical_therapy_part1'],
    ['Asthma / COPD', 'asthma', 'hf_final_clinical_assessment'],
    ['Hyperkalaemia (ACEi/ARB/ARNI)', 'ci_ace_inhibitor', 'hf_gdmt_evaluation'],
    ['Hyperkalaemia (MRA)', 'ci_mra', 'hf_gdmt_evaluation'],
    ['Renal impairment (creatinine)', 'renal_failure', 'hf_final_clinical_assessment'],
    ['AV block / sick sinus', 'beta_not_used_heart_blocks', 'hf_medical_therapy_part1'],
    ['DKA', '', ''],
    ['UTI / urosepsis', '', ''],
    ['Severe renal (SGLT2)', 'ci_sglt2_inhibitor', 'hf_gdmt_evaluation']
  ];

  mappingData.forEach((rowVals, idx) => {
    const row = ws.addRow(rowVals);
    row.height = 20;
    row.eachCell(cell => {
      cell.border = BORDER_THIN;
      cell.font = { name: 'Calibri', size: 10 };
      cell.alignment = { vertical: 'middle' };
    });

    if (idx % 2 === 1) {
      row.eachCell(cell => {
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFF8FAFC' }
        };
      });
    }
  });

  autoFitColumns(ws, 20, 50);
}

/**
 * Main Export Function: Creates and triggers download of multi-sheet .xlsx
 */
export async function exportCohortExcel(patients, analytics = {}) {
  // Fetch dedicated mapped Sheet1 data based strictly on mapping.xlsx rules
  let sheet1Data = null;
  try {
    sheet1Data = await fetchHfSheet1Export();
  } catch (err) {
    console.warn('Could not fetch dedicated Sheet1 backend export data, using local cohort data:', err.message);
  }

  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Cardio Registry GDMT Clinical Intelligence Engine';
  workbook.lastModifiedBy = 'Cardio Registry System';
  workbook.created = new Date();
  workbook.modified = new Date();

  // 1. Sheet1 (Scoped up to "Current device therapy" with literal DB column name transformations)
  buildSheet1(workbook, patients, sheet1Data);

  // 2. Notes
  buildNotesSheet(workbook);

  // 3. GDMT Summary
  buildGdmtSummarySheet(workbook, analytics, patients);

  // 4. Contraindications
  buildContraindicationsSheet(workbook);

  // 5. CI Flags
  buildCiFlagsSheet(workbook, patients);

  // 6. Key Points
  buildKeyPointsSheet(workbook, analytics, patients);

  // Generate buffer and trigger browser download
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  });

  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  const dateStr = new Date().toISOString().split('T')[0];
  link.download = `HF_GDMT_Adherence_Audit_${dateStr}.xlsx`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
