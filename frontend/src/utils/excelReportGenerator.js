function toNumericOrEmpty(val) {
  if (val === null || val === undefined) return '';
  const s = String(val).trim();
  if (s === '') return '';
  const num = Number(s);
  return !isNaN(num) ? num : s;
}
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

const HEADER_FILL_REF_BLUE = {
  type: 'pattern',
  pattern: 'solid',
  fgColor: { argb: 'FFD9E1F2' }
};

const REF_FONT_BOLD = {
  name: 'Calibri',
  size: 11,
  bold: true,
  color: { argb: 'FF000000' }
};

const REF_FONT_REGULAR = {
  name: 'Calibri',
  size: 11,
  color: { argb: 'FF000000' }
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
function buildSheet1(workbook, patients, sheet1Data = null, wsSheet1 = null) {
  const ws = wsSheet1 || workbook.addWorksheet('Sheet1');
  const finalExportRows = [];

  // If backend provided pre-processed sheet1Data adhering to literal column name mapping rules
  if (sheet1Data && Array.isArray(sheet1Data.headers) && Array.isArray(sheet1Data.rows)) {
    const allowedHfIds = new Set((patients || []).map(p => Number(p.hfId)).filter(Boolean));
    const allowedUhids = new Set((patients || []).map(p => String(p.uhid || '').trim().toUpperCase()).filter(Boolean));
    const filterActive = Boolean(patients && patients.length > 0 && (allowedHfIds.size > 0 || allowedUhids.size > 0));

    // If filters are active, match the filtered cohort by HF ID or UHID
    const filteredRows = sheet1Data.rows.filter(rowVals => {
      if (!filterActive) return true;

      // Check HF ID (column index 4, e.g. "HF00154" or "154")
      const rawHf = String(rowVals[4] || '').replace(/\D/g, '');
      const parsedHfId = rawHf ? parseInt(rawHf, 10) : null;
      if (parsedHfId && allowedHfIds.has(parsedHfId)) return true;

      // Check UHID / Identifier (column index 1)
      const rowUhid = String(rowVals[1] || '').trim().toUpperCase();
      if (rowUhid && allowedUhids.has(rowUhid)) return true;

      return false;
    });

    // Prepare headers: remove Reasons for Admission2 and rename Reasons for admission3 to admission type
    const headers = [...sheet1Data.headers];
    const admission2Idx = headers.findIndex(h => /reasons for admission\s*2/i.test(h));
    const admission3Idx = headers.findIndex(h => /reasons for admission\s*3/i.test(h));
    if (admission3Idx !== -1) {
      headers[admission3Idx] = 'admission type';
    }
    if (admission2Idx !== -1) {
      headers.splice(admission2Idx, 1);
    }

    const col2Idx = headers.findIndex(h => /^column\s*2$/i.test(h.trim()));
    if (col2Idx !== -1) {
      headers[col2Idx] = 'O₂ Saturation (%)';
    }

    const headerRow = ws.addRow(headers);
    headerRow.eachCell(cell => {
      cell.fill = HEADER_FILL_TEAL;
      cell.font = HEADER_FONT;
      cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
      cell.border = BORDER_THIN;
    });
    headerRow.height = 28;

    filteredRows.forEach((rawRowVals, idx) => {
      const rowVals = [...rawRowVals];
      if (admission2Idx !== -1) {
        rowVals.splice(admission2Idx, 1);
      }

      // Re-number SL No continuously (column 0)
      rowVals[0] = idx + 1;

      // User requirement: what is in IP No(Prosoft) (index 3) have same in IP No(T3) (index 2)
      rowVals[2] = rowVals[3] || rowVals[2] || '';
      finalExportRows.push(rowVals);

      const dataRow = ws.addRow(rowVals);
      const r = idx + 2;

      // Known Contraindications (cells 83 to 88)
      dataRow.getCell(83).value = { formula: `IF(OR('CI Flags'!H${r}=1,'CI Flags'!I${r}=1,'CI Flags'!K${r}=1,'CI Flags'!L${r}=1,'CI Flags'!P${r}=1),1,0)`, result: rowVals[82] };
      dataRow.getCell(84).value = { formula: `IF(OR('CI Flags'!I${r}=1,'CI Flags'!M${r}=1,'CI Flags'!O${r}=1),1,0)`, result: rowVals[83] };
      dataRow.getCell(85).value = { formula: `IF(OR('CI Flags'!I${r}=1,'CI Flags'!M${r}=1,'CI Flags'!O${r}=1),1,0)`, result: rowVals[84] };
      dataRow.getCell(86).value = { formula: `IF(OR('CI Flags'!J${r}=1,'CI Flags'!M${r}=1,'CI Flags'!O${r}=1),1,0)`, result: rowVals[85] };
      dataRow.getCell(87).value = { formula: `IF(OR('CI Flags'!N${r}=1,'CI Flags'!O${r}=1),1,0)`, result: rowVals[86] };
      dataRow.getCell(88).value = { formula: `IF(OR('CI Flags'!Q${r}=1,'CI Flags'!R${r}=1,'CI Flags'!S${r}=1),1,0)`, result: rowVals[87] };

      // Guideline Deviations (cells 89 to 94)
      dataRow.getCell(89).value = { formula: `IF(BX${r}=CE${r},1,0)`, result: rowVals[88] };
      dataRow.getCell(90).value = { formula: `IF(BY${r}=CF${r},1,0)`, result: rowVals[89] };
      dataRow.getCell(91).value = { formula: `IF(BZ${r}=CG${r},1,0)`, result: rowVals[90] };
      dataRow.getCell(92).value = { formula: `IF(CA${r}=CH${r},1,0)`, result: rowVals[91] };
      dataRow.getCell(93).value = { formula: `IF(CB${r}=CI${r},1,0)`, result: rowVals[92] };
      dataRow.getCell(94).value = { formula: `IF(CC${r}=CJ${r},1,0)`, result: rowVals[93] };

      // Total Deviations, Variables & Adherence (cells 95 to 97)
      dataRow.getCell(95).value = { formula: `SUM(CK${r}:CP${r})`, result: rowVals[94] };
      dataRow.getCell(96).value = 6;
      dataRow.getCell(97).value = { formula: `(CR${r}-CQ${r})/CR${r}`, result: rowVals[96] };

      dataRow.eachCell((cell, colNum) => {
        cell.border = BORDER_THIN;
        cell.font = { name: 'Calibri', size: 10 };
        if (colNum === headers.length) {
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
    return finalExportRows;
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
    'admission type',
    'Reasons other than HF',
    'reasons for admissions',
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
    'O₂ Saturation (%)',
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
  const uhidPatients = (patients || []).filter(p => p.uhid && String(p.uhid).trim() !== '');

  uhidPatients.forEach((p, idx) => {
    const ipVal = p.visitId || p.ipNo || '';
    const rowValues = [
      idx + 1,
      p.uhid || '',
      ipVal,
      ipVal,
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
      p.admissionReason || '',
      p.previousDiagnosis || '',
      '',
      '',
      '',
      '',
      '',
      '',
      p.heartRate || '',
      '',
      p.respiratoryRate || '',
      p.oxygenSaturation || '',
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
      toNumericOrEmpty(p.potassium),
      toNumericOrEmpty(p.creatinine),
      p.hemoglobin || '',
      '',
      '',
      '',
      '',
      '',
      p.currentDeviceTherapy || '',
      p.prescribedDrugsSummary || '',
      p.prescribedDrugsSummary || '',
      p.prescribedDrugsSummary || '',
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

    finalExportRows.push(rowValues);
    const dataRow = ws.addRow(rowValues);
    const r = idx + 2;

    dataRow.getCell(83).value = { formula: `IF(OR('CI Flags'!H${r}=1,'CI Flags'!I${r}=1,'CI Flags'!K${r}=1,'CI Flags'!L${r}=1,'CI Flags'!P${r}=1),1,0)`, result: rowValues[82] };
    dataRow.getCell(84).value = { formula: `IF(OR('CI Flags'!I${r}=1,'CI Flags'!M${r}=1,'CI Flags'!O${r}=1),1,0)`, result: rowValues[83] };
    dataRow.getCell(85).value = { formula: `IF(OR('CI Flags'!I${r}=1,'CI Flags'!M${r}=1,'CI Flags'!O${r}=1),1,0)`, result: rowValues[84] };
    dataRow.getCell(86).value = { formula: `IF(OR('CI Flags'!J${r}=1,'CI Flags'!M${r}=1,'CI Flags'!O${r}=1),1,0)`, result: rowValues[85] };
    dataRow.getCell(87).value = { formula: `IF(OR('CI Flags'!N${r}=1,'CI Flags'!O${r}=1),1,0)`, result: rowValues[86] };
    dataRow.getCell(88).value = { formula: `IF(OR('CI Flags'!Q${r}=1,'CI Flags'!R${r}=1,'CI Flags'!S${r}=1),1,0)`, result: rowValues[87] };

    dataRow.getCell(89).value = { formula: `IF(BX${r}=CE${r},1,0)`, result: rowValues[88] };
    dataRow.getCell(90).value = { formula: `IF(BY${r}=CF${r},1,0)`, result: rowValues[89] };
    dataRow.getCell(91).value = { formula: `IF(BZ${r}=CG${r},1,0)`, result: rowValues[90] };
    dataRow.getCell(92).value = { formula: `IF(CA${r}=CH${r},1,0)`, result: rowValues[91] };
    dataRow.getCell(93).value = { formula: `IF(CB${r}=CI${r},1,0)`, result: rowValues[92] };
    dataRow.getCell(94).value = { formula: `IF(CC${r}=CJ${r},1,0)`, result: rowValues[93] };

    dataRow.getCell(95).value = { formula: `SUM(CK${r}:CP${r})`, result: rowValues[94] };
    dataRow.getCell(96).value = 6;
    dataRow.getCell(97).value = { formula: `(CR${r}-CQ${r})/CR${r}`, result: rowValues[96] };

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
  return finalExportRows;
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
 * Build GDMT Summary Sheet matching HF_GDMT_160926_updated_as_per_calculations.xlsx format
 */
function buildGdmtSummarySheet(workbook, analytics, patients, wsSummary = null) {
  const ws = wsSummary || workbook.addWorksheet('GDMT Summary');
  const totalCount = patients.length || 1;

  const categories = [
    { name: 'Beta blocker', key: 'betaBlocker' },
    { name: 'ACE inhibitor', key: 'aceInhibitor' },
    { name: 'ARB', key: 'arb' },
    { name: 'ARNI', key: 'arni' },
    { name: 'MRA', key: 'mra' },
    { name: 'SGLT2 inhibitor', key: 'sglt2Inhibitor' }
  ];

  // Table 1 (Rows 1-7): GDMT Category
  const r1 = ws.getRow(1);
  r1.values = [
    'GDMT Category',
    'Number of Patients Received',
    'Total Patients',
    'Proportional Decimal Value',
    'Percentage Value'
  ];
  r1.eachCell(cell => {
    cell.font = REF_FONT_BOLD;
    cell.alignment = { vertical: 'middle', wrapText: true };
    cell.border = BORDER_THIN;
  });

  categories.forEach((cat, idx) => {
    const rowNum = idx + 2;
    const count = patients.filter(p => p.pillarEvaluations?.[cat.key]?.prescribed).length;
    const ratio = totalCount > 0 ? count / totalCount : 0;
    const pct = ratio * 100;
    const row = ws.getRow(rowNum);
    row.values = [cat.name, count, totalCount, ratio, pct];
    row.getCell(4).numFmt = '0.0000000000000000';
    row.getCell(5).numFmt = '0.00';
    row.eachCell(cell => {
      cell.font = REF_FONT_REGULAR;
      cell.border = BORDER_THIN;
    });
  });

  // Table 2 (Rows 10-17): Number of GDMT Drugs Taken
  const r10 = ws.getRow(10);
  r10.values = ['Number of GDMT Drugs Taken', 'Number of Patients'];
  r10.eachCell(cell => {
    cell.font = REF_FONT_BOLD;
    cell.border = BORDER_THIN;
  });

  for (let drugs = 0; drugs <= 6; drugs++) {
    const rowNum = 11 + drugs;
    const count = patients.filter(p => (p.prescribedDrugsCount || 0) === drugs).length;
    const row = ws.getRow(rowNum);
    row.values = [drugs, count];
    row.eachCell(cell => {
      cell.font = REF_FONT_REGULAR;
      cell.border = BORDER_THIN;
    });
  }

  // Table 3 (Rows 21-26): Drugs given irrespective of present or absence of contra indication
  const r21 = ws.getRow(21);
  r21.getCell(1).value = 'Drugs given irrsepective of present or absence of contra indication';
  r21.getCell(1).font = REF_FONT_BOLD;

  const r22 = ws.getRow(22);
  r22.getCell(4).value = 'Beta blocker'; r22.getCell(5).value = 1;
  r22.getCell(7).value = 'ACE inhibitor'; r22.getCell(8).value = 1;
  r22.getCell(10).value = 'ARB'; r22.getCell(11).value = 1;
  r22.getCell(13).value = 'ARNI'; r22.getCell(14).value = 1;
  r22.getCell(16).value = 'MRA'; r22.getCell(17).value = 1;
  r22.getCell(19).value = 'SGLT2 inhibitor'; r22.getCell(20).value = 1;
  [4, 7, 10, 13, 16, 19].forEach(col => {
    r22.getCell(col).font = REF_FONT_BOLD;
    r22.getCell(col + 1).font = REF_FONT_REGULAR;
  });

  const r24 = ws.getRow(24);
  r24.getCell(1).value = 'Count of UHID(T3)';
  [4, 7, 10, 13, 16, 19].forEach(col => {
    r24.getCell(col).value = 'Count of UHID(T3)';
  });

  const r25 = ws.getRow(25);
  r25.getCell(1).value = totalCount;
  r25.getCell(4).value = patients.filter(p => p.pillarEvaluations?.betaBlocker?.prescribed).length;
  r25.getCell(7).value = patients.filter(p => p.pillarEvaluations?.aceInhibitor?.prescribed).length;
  r25.getCell(10).value = patients.filter(p => p.pillarEvaluations?.arb?.prescribed).length;
  r25.getCell(13).value = patients.filter(p => p.pillarEvaluations?.arni?.prescribed).length;
  r25.getCell(16).value = patients.filter(p => p.pillarEvaluations?.mra?.prescribed).length;
  r25.getCell(19).value = patients.filter(p => p.pillarEvaluations?.sglt2Inhibitor?.prescribed).length;

  const r26 = ws.getRow(26);
  r26.getCell(1).value = 'Percentage';
  r26.getCell(1).font = REF_FONT_BOLD;
  [
    { col: 4, letter: 'D' },
    { col: 7, letter: 'G' },
    { col: 10, letter: 'J' },
    { col: 13, letter: 'M' },
    { col: 16, letter: 'P' },
    { col: 19, letter: 'S' }
  ].forEach(item => {
    const cell = r26.getCell(item.col);
    const countVal = r25.getCell(item.col).value || 0;
    cell.value = {
      formula: `${item.letter}25/$A$25`,
      result: totalCount > 0 ? countVal / totalCount : 0
    };
    cell.numFmt = '0.0%';
  });

  // Table 4 (Rows 30-35): Deviations
  const r30 = ws.getRow(30);
  r30.getCell(1).value = 'Deviations - conditions where Contraindication absent - drug absent OR Contraindication present - drug present';
  r30.getCell(1).font = REF_FONT_BOLD;

  const r31 = ws.getRow(31);
  r31.getCell(4).value = 'Deviation for Beta blocker2'; r31.getCell(5).value = 1;
  r31.getCell(7).value = 'Deviation for ACE inhibitor3'; r31.getCell(8).value = 1;
  r31.getCell(10).value = 'Deviation for ARB4'; r31.getCell(11).value = 1;
  r31.getCell(13).value = 'Deviation for ARNI5'; r31.getCell(14).value = 1;
  r31.getCell(16).value = 'Deviation for MRA6'; r31.getCell(17).value = 1;
  r31.getCell(19).value = 'Deviation for SGLT2 inhibitor7'; r31.getCell(20).value = 1;
  [4, 7, 10, 13, 16, 19].forEach(col => {
    r31.getCell(col).font = REF_FONT_BOLD;
    r31.getCell(col + 1).font = REF_FONT_REGULAR;
  });

  const r33 = ws.getRow(33);
  r33.getCell(1).value = 'Count of UHID(T3)';
  [4, 7, 10, 13, 16, 19].forEach(col => {
    r33.getCell(col).value = 'Count of UHID(T3)';
  });

  const r34 = ws.getRow(34);
  r34.getCell(1).value = totalCount;
  r34.getCell(4).value = patients.filter(p => p.pillarEvaluations?.betaBlocker?.isDeviation).length;
  r34.getCell(7).value = patients.filter(p => p.pillarEvaluations?.aceInhibitor?.isDeviation).length;
  r34.getCell(10).value = patients.filter(p => p.pillarEvaluations?.arb?.isDeviation).length;
  r34.getCell(13).value = patients.filter(p => p.pillarEvaluations?.arni?.isDeviation).length;
  r34.getCell(16).value = patients.filter(p => p.pillarEvaluations?.mra?.isDeviation).length;
  r34.getCell(19).value = patients.filter(p => p.pillarEvaluations?.sglt2Inhibitor?.isDeviation).length;

  const r35 = ws.getRow(35);
  r35.getCell(1).value = 'Percentage';
  r35.getCell(1).font = REF_FONT_BOLD;
  [
    { col: 4, letter: 'D' },
    { col: 7, letter: 'G' },
    { col: 10, letter: 'J' },
    { col: 13, letter: 'M' },
    { col: 16, letter: 'P' },
    { col: 19, letter: 'S' }
  ].forEach(item => {
    const cell = r35.getCell(item.col);
    const devVal = r34.getCell(item.col).value || 0;
    cell.value = {
      formula: `${item.letter}34/$A$25`,
      result: totalCount > 0 ? devVal / totalCount : 0
    };
    cell.numFmt = '0.0%';
  });

  // Table 5 (Rows 37-46): % adherence to GDMT distribution
  const r37 = ws.getRow(37);
  r37.getCell(1).value = '% adherence to GDMT distribution';
  r37.getCell(1).font = REF_FONT_BOLD;

  const r38 = ws.getRow(38);
  r38.getCell(1).value = '% of GDMT adhered to';
  r38.getCell(2).value = 'Number of deviations';
  r38.getCell(3).value = 'UHID count';
  [1, 2, 3].forEach(c => {
    const cell = r38.getCell(c);
    cell.fill = HEADER_FILL_REF_BLUE;
    cell.font = REF_FONT_BOLD;
    cell.border = BORDER_THIN;
  });

  const adhRows = [
    { dev: 6, formula: '1-6/6', pct: 0 },
    { dev: 5, formula: '1-5/6', pct: 1 / 6 },
    { dev: 4, formula: '1-4/6', pct: 2 / 6 },
    { dev: 3, formula: '1-3/6', pct: 3 / 6 },
    { dev: 2, formula: '1-2/6', pct: 4 / 6 },
    { dev: 1, formula: '1-1/6', pct: 5 / 6 },
    { dev: 0, formula: '1-0/6', pct: 1 }
  ];

  adhRows.forEach((item, idx) => {
    const rowNum = 39 + idx;
    const count = patients.filter(p => (p.deviationsCount || 0) === item.dev).length;
    const row = ws.getRow(rowNum);
    row.getCell(1).value = { formula: item.formula, result: item.pct };
    row.getCell(1).numFmt = '0.0%';
    row.getCell(2).value = item.dev;
    row.getCell(3).value = count;
    [1, 2, 3].forEach(c => {
      row.getCell(c).font = REF_FONT_REGULAR;
      row.getCell(c).border = BORDER_THIN;
    });
  });

  const r46 = ws.getRow(46);
  r46.getCell(1).value = 'Total';
  r46.getCell(1).font = REF_FONT_BOLD;
  r46.getCell(1).border = BORDER_THIN;
  r46.getCell(2).border = BORDER_THIN;
  r46.getCell(3).value = { formula: 'SUM(C39:C45)', result: totalCount };
  r46.getCell(3).font = REF_FONT_BOLD;
  r46.getCell(3).border = BORDER_THIN;

  // Table 6 (Rows 60-64): Number of GDMT Drugs Taken (pivot format)
  const r60 = ws.getRow(60);
  r60.getCell(4).value = 'Number of GDMT Drugs Taken'; r60.getCell(5).value = 0;
  r60.getCell(7).value = 'Number of GDMT Drugs Taken'; r60.getCell(8).value = 1;
  r60.getCell(10).value = 'Number of GDMT Drugs Taken'; r60.getCell(11).value = 2;
  r60.getCell(13).value = 'Number of GDMT Drugs Taken'; r60.getCell(14).value = 3;
  r60.getCell(16).value = 'Number of GDMT Drugs Taken'; r60.getCell(17).value = 4;
  r60.getCell(19).value = 'Number of GDMT Drugs Taken'; r60.getCell(20).value = 5;
  [4, 7, 10, 13, 16, 19].forEach(col => {
    r60.getCell(col).font = REF_FONT_BOLD;
    r60.getCell(col + 1).font = REF_FONT_REGULAR;
  });

  const r62 = ws.getRow(62);
  r62.getCell(1).value = 'Count of UHID(T3)';
  [4, 7, 10, 13, 16, 19].forEach(col => {
    r62.getCell(col).value = 'Count of UHID(T3)';
  });

  const r63 = ws.getRow(63);
  r63.getCell(1).value = totalCount;
  r63.getCell(4).value = patients.filter(p => (p.prescribedDrugsCount || 0) === 0).length;
  r63.getCell(7).value = patients.filter(p => (p.prescribedDrugsCount || 0) === 1).length;
  r63.getCell(10).value = patients.filter(p => (p.prescribedDrugsCount || 0) === 2).length;
  r63.getCell(13).value = patients.filter(p => (p.prescribedDrugsCount || 0) === 3).length;
  r63.getCell(16).value = patients.filter(p => (p.prescribedDrugsCount || 0) === 4).length;
  r63.getCell(19).value = patients.filter(p => (p.prescribedDrugsCount || 0) >= 5).length;

  const r64 = ws.getRow(64);
  r64.getCell(1).value = 'Percentage';
  r64.getCell(1).font = REF_FONT_BOLD;
  [
    { col: 4, letter: 'D' },
    { col: 7, letter: 'G' },
    { col: 10, letter: 'J' },
    { col: 13, letter: 'M' },
    { col: 16, letter: 'P' },
    { col: 19, letter: 'S' }
  ].forEach(item => {
    const cell = r64.getCell(item.col);
    const countVal = r63.getCell(item.col).value || 0;
    cell.value = {
      formula: `${item.letter}63/$A$63`,
      result: totalCount > 0 ? countVal / totalCount : 0
    };
    cell.numFmt = '0.0%';
  });

  ws.columns = [
    { width: 28 }, { width: 14 }, { width: 14 }, { width: 28 }, { width: 8 },
    { width: 4 }, { width: 28 }, { width: 8 }, { width: 4 }, { width: 28 },
    { width: 8 }, { width: 4 }, { width: 28 }, { width: 8 }, { width: 4 },
    { width: 28 }, { width: 8 }, { width: 4 }, { width: 28 }, { width: 8 }
  ];
}

/**
 * Build Contraindications Reference Sheet
 */
function buildContraindicationsSheet(workbook, wsContra = null) {
  const ws = wsContra || workbook.addWorksheet('Contraindications');

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
function buildCiFlagsSheet(workbook, patients, wsFlags = null) {
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
    dataRow.getCell(2).value = { formula: `IFERROR(VALUE(LEFT(Sheet1!AG${r},FIND("/",Sheet1!AG${r})-1)),"")`, result: sbp };
    dataRow.getCell(3).value = { formula: `IFERROR(IF(ISNUMBER(Sheet1!AC${r}),Sheet1!AC${r},VALUE(Sheet1!AC${r})),"")`, result: hr };
    dataRow.getCell(4).value = { formula: `IFERROR(IF(ISNUMBER(Sheet1!BL${r}),Sheet1!BL${r},VALUE(Sheet1!BL${r})),"")`, result: k };
    dataRow.getCell(5).value = { formula: `IFERROR(IF(ISNUMBER(Sheet1!BM${r}),Sheet1!BM${r},VALUE(Sheet1!BM${r})),"")`, result: creat };
    // Clinical text: Present diagnosis (Q), reasons for admissions (U), Previous Diagnosis (V), Comorbidities1-4 (AP, AQ, AR, AS)
    dataRow.getCell(6).value = { formula: `UPPER(Sheet1!Q${r}&" | "&Sheet1!U${r}&" | "&Sheet1!V${r}&" | "&Sheet1!AP${r}&" | "&Sheet1!AQ${r}&" | "&Sheet1!AR${r}&" | "&Sheet1!AS${r})`, result: p.presentDiagnosis || '' };
    dataRow.getCell(7).value = { formula: `UPPER(Sheet1!BU${r}&" | "&Sheet1!BV${r})`, result: p.prescribedDrugsSummary || '' };
    dataRow.getCell(8).value = { formula: `IF(AND(ISNUMBER(C${r}),C${r}<Contraindications!$E$4),1,0)`, result: hr < 50 ? 1 : 0 };
    dataRow.getCell(9).value = { formula: `IF(AND(ISNUMBER(B${r}),B${r}<Contraindications!$E$5),1,0)`, result: sbp < 90 ? 1 : 0 };
    dataRow.getCell(10).value = { formula: `IF(AND(ISNUMBER(B${r}),B${r}<Contraindications!$E$16),1,0)`, result: sbp < 100 ? 1 : 0 };
    dataRow.getCell(11).value = { formula: `IF(OR(ISNUMBER(SEARCH("SHOCK",F${r})),ISNUMBER(SEARCH("DOBUTAMINE",G${r})),ISNUMBER(SEARCH("DOBU",G${r})),ISNUMBER(SEARCH("NORAD",G${r}))),1,0)`, result: 0 };
    dataRow.getCell(12).value = { formula: `IF(OR(ISNUMBER(SEARCH("ASTHMA",F${r})),ISNUMBER(SEARCH("COPD",F${r})),ISNUMBER(SEARCH("BRONCH",F${r}))),1,0)`, result: 0 };
    dataRow.getCell(13).value = { formula: `IF(OR(AND(ISNUMBER(D${r}),D${r}>Contraindications!$E$10),ISNUMBER(SEARCH("HYPERKAL",F${r}))),1,0)`, result: k > 5.5 ? 1 : 0 };
    dataRow.getCell(14).value = { formula: `IF(OR(AND(ISNUMBER(D${r}),D${r}>Contraindications!$E$19),ISNUMBER(SEARCH("HYPERKAL",F${r}))),1,0)`, result: k > 5.0 ? 1 : 0 };
    // Synchronized live formula: evaluates 1 if creatinine > 2.5 OR clinical text contains RENAL or CKD
    dataRow.getCell(15).value = { formula: `IF(OR(AND(ISNUMBER(E${r}),E${r}>Contraindications!$E$11),ISNUMBER(SEARCH("RENAL",F${r})),ISNUMBER(SEARCH("CKD",F${r}))),1,0)`, result: renalFlag };
    dataRow.getCell(16).value = { formula: `IF(OR(ISNUMBER(SEARCH("AV BLOCK",F${r})),ISNUMBER(SEARCH("HEART BLOCK",F${r})),ISNUMBER(SEARCH("CHB",F${r})),ISNUMBER(SEARCH("SICK SINUS",F${r})),ISNUMBER(SEARCH("BRADY",F${r}))),1,0)`, result: 0 };
    dataRow.getCell(17).value = { formula: `IF(OR(ISNUMBER(SEARCH("DKA",F${r})),ISNUMBER(SEARCH("KETOACID",F${r}))),1,0)`, result: 0 };
    dataRow.getCell(18).value = { formula: `IF(OR(ISNUMBER(SEARCH("UTI",F${r})),ISNUMBER(SEARCH("UROSEPSIS",F${r}))),1,0)`, result: 0 };
    dataRow.getCell(19).value = { formula: `IF(AND(ISNUMBER(E${r}),E${r}>Contraindications!$E$21),1,0)`, result: creat > 3.0 ? 1 : 0 };

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
}

/**
 * Build CI FLAGS FORMULAE Sheet: Documentation showing how every CI Flag is extracted and calculated
 */
function buildCiFlagsFormulaeSheet(workbook) {
  const ws = workbook.addWorksheet('CI FLAGS FORMULAE');

  const headers = ['Columns', 'formula', 'Sheet', 'Columns', 'Explanation'];
  const headerRow = ws.addRow(headers);
  headerRow.eachCell(cell => {
    cell.fill = HEADER_FILL_NAVY;
    cell.font = HEADER_FONT;
    cell.border = BORDER_THIN;
  });

  const formulaRows = [
    ['UHID', '', 'Sheet1', 'UHID(T3)', 'Unique Hospital Identifier from Sheet1 Col B'],
    ['Systolic BP', 'IFERROR(VALUE(LEFT(Sheet1!AG2,FIND("/",Sheet1!AG2)-1)),"")', 'Sheet1', 'Blood pressure sitting', 'Till slash e.g. 110/80 so value of Systolic BP=110'],
    ['Heart rate', 'IFERROR(IF(ISNUMBER(Sheet1!AC2),Sheet1!AC2,VALUE(Sheet1!AC2)),"")', 'Sheet1', 'Heart rate', 'Numeric heart rate (bpm) extracted from Sheet1 Col AC'],
    ['Potassium', 'IFERROR(IF(ISNUMBER(Sheet1!BL2),Sheet1!BL2,VALUE(Sheet1!BL2)),"")', 'Sheet1', 'Potassium', 'Exact serum potassium value (mEq/L) extracted from Sheet1 Col BL'],
    ['Creatinine', 'IFERROR(IF(ISNUMBER(Sheet1!BM2),Sheet1!BM2,VALUE(Sheet1!BM2)),"")', 'Sheet1', 'Creatinine', 'Exact serum creatinine value (mg/dL) extracted from Sheet1 Col BM'],
    ['Clinical text (Q,U,V,AP,AQ,AR,AS)', 'UPPER(Sheet1!Q2&" | "&Sheet1!U2&" | "&Sheet1!V2&" | "&Sheet1!AP2&" | "&Sheet1!AQ2&" | "&Sheet1!AR2&" | "&Sheet1!AS2)', 'Sheet1', 'Present diagnosis, reasons for admissions, previous diagnosis, comorbidities', 'Concatenated uppercase string of clinical diagnoses, admissions, and comorbidities'],
    ['Drug text (BU,BV)', 'UPPER(Sheet1!BU2&" | "&Sheet1!BV2)', 'Sheet1', 'Drugs, Generic Names', 'Concatenated uppercase string of active generic medications and drug names'],
    ['Bradycardia', 'IF(AND(ISNUMBER(C2),C2<Contraindications!$E$4),1,0)', 'CI Flags, Contraindications', 'Heart rate < threshold here threshold = 50', 'Flagged 1 if resting heart rate < 50 bpm (Contraindications!E4)'],
    ['SBP < BB/ACEi/ARB threshold', 'IF(AND(ISNUMBER(B2),B2<Contraindications!$E$5),1,0)', 'CI Flags, Contraindications', 'Systolic BP < threshold here threshold = 90', 'Flagged 1 if sitting systolic BP < 90 mmHg (Contraindications!E5)'],
    ['SBP < ARNI threshold', 'IF(AND(ISNUMBER(B2),B2<Contraindications!$E$16),1,0)', 'CI Flags, Contraindications', 'Systolic BP < threshold (stricter than ACEi/ARB) here threshold = 100', 'Flagged 1 if sitting systolic BP < 100 mmHg (Contraindications!E16)'],
    ['Shock / inotropes', 'IF(OR(ISNUMBER(SEARCH("SHOCK",F2)),ISNUMBER(SEARCH("DOBUTAMINE",G2)),ISNUMBER(SEARCH("DOBU",G2)),ISNUMBER(SEARCH("NORAD",G2))),1,0)', 'CI Flags', 'Clinical text, Drug text', 'Flagged 1 if diagnosis mentions SHOCK or drugs include inotropes (DOBUTAMINE, NORAD)'],
    ['Asthma / COPD', 'IF(OR(ISNUMBER(SEARCH("ASTHMA",F2)),ISNUMBER(SEARCH("COPD",F2)),ISNUMBER(SEARCH("BRONCH",F2))),1,0)', 'CI Flags', 'Clinical text', 'Flagged 1 if diagnosis or comorbidities mention ASTHMA, COPD, or BRONCHOSPASM'],
    ['Hyperkalaemia (ACEi/ARB/ARNI)', 'IF(OR(AND(ISNUMBER(D2),D2>Contraindications!$E$10),ISNUMBER(SEARCH("HYPERKAL",F2))),1,0)', 'CI Flags, Contraindications', 'Potassium > threshold, or keyword HYPERKAL here threshold = 5.5', 'Flagged 1 if serum potassium > 5.5 mEq/L or clinical text contains HYPERKAL'],
    ['Hyperkalaemia (MRA)', 'IF(OR(AND(ISNUMBER(D2),D2>Contraindications!$E$19),ISNUMBER(SEARCH("HYPERKAL",F2))),1,0)', 'CI Flags, Contraindications', 'Potassium > threshold, or keyword HYPERKAL here threshold = 5.0', 'Flagged 1 if serum potassium > 5.0 mEq/L or clinical text contains HYPERKAL'],
    ['Renal impairment (creatinine)', 'IF(OR(AND(ISNUMBER(E2),E2>Contraindications!$E$11),ISNUMBER(SEARCH("RENAL",F2)),ISNUMBER(SEARCH("CKD",F2))),1,0)', 'CI Flags, Contraindications', 'Creatinine > threshold or keyword RENAL/CKD here threshold = 2.5', 'Flagged 1 if serum creatinine > 2.5 mg/dL or clinical text contains RENAL or CKD'],
    ['AV block / sick sinus', 'IF(OR(ISNUMBER(SEARCH("AV BLOCK",F2)),ISNUMBER(SEARCH("HEART BLOCK",F2)),ISNUMBER(SEARCH("CHB",F2)),ISNUMBER(SEARCH("SICK SINUS",F2)),ISNUMBER(SEARCH("BRADY",F2))),1,0)', 'CI Flags', 'Clinical text', 'Flagged 1 if AV block, complete heart block (CHB), bradyarrhythmia, or sick sinus syndrome documented'],
    ['DKA', 'IF(OR(ISNUMBER(SEARCH("DKA",F2)),ISNUMBER(SEARCH("KETOACID",F2))),1,0)', 'CI Flags', 'Clinical text', 'Flagged 1 if clinical text mentions DKA or KETOACIDOSIS'],
    ['UTI / urosepsis', 'IF(OR(ISNUMBER(SEARCH("UTI",F2)),ISNUMBER(SEARCH("UROSEPSIS",F2))),1,0)', 'CI Flags', 'Clinical text', 'Flagged 1 if clinical text mentions UTI or UROSEPSIS'],
    ['Severe renal (SGLT2)', 'IF(AND(ISNUMBER(E2),E2>Contraindications!$E$21),1,0)', 'CI Flags, Contraindications', 'Creatinine > threshold here threshold = 3.0', 'Flagged 1 if serum creatinine > 3.0 mg/dL (Contraindications!E21)']
  ];

  formulaRows.forEach((rVals, idx) => {
    const row = ws.addRow(rVals);
    row.eachCell(cell => (cell.border = BORDER_THIN));
    if (idx % 2 === 1) {
      row.eachCell(cell => {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8FAFC' } };
      });
    }
  });

  autoFitColumns(ws, 12, 55);
}

/**
 * Build sheet 1 formula Sheet: Documentation showing how every Sheet1 CI & Deviation formula is calculated
 */
function buildSheet1FormulaeSheet(workbook) {
  const ws = workbook.addWorksheet('sheet 1 formula');

  const headers = ['Columns', 'formula', 'Sheet', 'Columns', 'Explanation'];
  const headerRow = ws.addRow(headers);
  headerRow.eachCell(cell => {
    cell.fill = HEADER_FILL_TEAL;
    cell.font = HEADER_FONT;
    cell.border = BORDER_THIN;
  });

  const formulaRows = [
    ['Known Contraindication for Beta blocker', "IF(OR('CI Flags'!H2=1, 'CI Flags'!I2=1, 'CI Flags'!K2=1, 'CI Flags'!L2=1, 'CI Flags'!P2=1), 1, 0)", 'CI Flags', 'Bradycardia, SBP < BB threshold, Shock, Asthma/COPD, AV block', '1 if any of the 5 Beta blocker contraindications in CI Flags is active, else 0'],
    ['Known Contraindication for ACE inhibitor', "IF(OR('CI Flags'!I2=1,'CI Flags'!M2=1,'CI Flags'!O2=1),1,0)", 'CI Flags', 'SBP < ACE threshold, Hyperkalaemia (>5.5), Renal impairment (>2.5/keyword)', '1 if hypotension, hyperkalemia, or renal impairment is active in CI Flags, else 0'],
    ['Known Contraindication for ARB', "IF(OR('CI Flags'!I2=1,'CI Flags'!M2=1,'CI Flags'!O2=1),1,0)", 'CI Flags', 'SBP < ARB threshold, Hyperkalaemia (>5.5), Renal impairment (>2.5/keyword)', '1 if hypotension, hyperkalemia, or renal impairment is active in CI Flags, else 0'],
    ['Known Contraindication for ARNI', "IF(OR('CI Flags'!J2=1,'CI Flags'!M2=1,'CI Flags'!O2=1),1,0)", 'CI Flags', 'SBP < ARNI threshold (<100), Hyperkalaemia (>5.5), Renal impairment (>2.5/keyword)', '1 if stricter hypotension (<100), hyperkalemia, or renal impairment is active in CI Flags, else 0'],
    ['Known Contraindication for MRA', "IF(OR('CI Flags'!N2=1,'CI Flags'!O2=1),1,0)", 'CI Flags', 'Hyperkalaemia MRA (>5.0), Renal impairment (>2.5/keyword)', '1 if stricter hyperkalemia (>5.0) or renal impairment is active in CI Flags, else 0'],
    ['Known Contraindication for SGLT2 inhibitor', "IF(OR('CI Flags'!Q2=1,'CI Flags'!R2=1,'CI Flags'!S2=1),1,0)", 'CI Flags', 'DKA, UTI / urosepsis, Severe renal SGLT2 (>3.0)', '1 if DKA, UTI/urosepsis, or severe renal impairment (>3.0) is active in CI Flags, else 0'],
    ['Deviation for Beta blocker2', 'IF(BX2=CE2,1,0)', 'Sheet1', 'Beta blocker (Col BX), Known Contraindication for Beta blocker (Col CE)', '1 if prescribed with CI (1=1) or omitted without CI (0=0); 0 if guideline adherent'],
    ['Deviation for ACE inhibitor3', 'IF(BY2=CF2,1,0)', 'Sheet1', 'ACE inhibitor (Col BY), Known Contraindication for ACE inhibitor (Col CF)', '1 if prescribed with CI (1=1) or omitted without CI (0=0); 0 if guideline adherent'],
    ['Deviation for ARB4', 'IF(BZ2=CG2,1,0)', 'Sheet1', 'ARB (Col BZ), Known Contraindication for ARB (Col CG)', '1 if prescribed with CI (1=1) or omitted without CI (0=0); 0 if guideline adherent'],
    ['Deviation for ARNI5', 'IF(CA2=CH2,1,0)', 'Sheet1', 'ARNI (Col CA), Known Contraindication for ARNI (Col CH)', '1 if prescribed with CI (1=1) or omitted without CI (0=0); 0 if guideline adherent'],
    ['Deviation for MRA6', 'IF(CB2=CI2,1,0)', 'Sheet1', 'MRA (Col CB), Known Contraindication for MRA (Col CI)', '1 if prescribed with CI (1=1) or omitted without CI (0=0); 0 if guideline adherent'],
    ['Deviation for SGLT2 inhibitor7', 'IF(CC2=CJ2,1,0)', 'Sheet1', 'SGLT2 inhibitor (Col CC), Known Contraindication for SGLT2 inhibitor (Col CJ)', '1 if prescribed with CI (1=1) or omitted without CI (0=0); 0 if guideline adherent'],
    ['Total Deviations present', 'SUM(CK2:CP2)', 'Sheet1', 'Deviation columns CK through CP', 'Sum of all deviation flags across the 6 guideline drug classes'],
    ['Total Variables', '6', 'Sheet1', 'Standard guideline pillars count', 'Standard 6 evaluable GDMT drug classes'],
    ['% of GDMT adhered to', '(CR2-CQ2)/CR2', 'Sheet1', 'Total Variables (Col CR), Total Deviations present (Col CQ)', 'Adherence formula: 1 - (Total Deviations / 6), formatted as percentage (0.0%)']
  ];

  formulaRows.forEach((rVals, idx) => {
    const row = ws.addRow(rVals);
    row.eachCell(cell => (cell.border = BORDER_THIN));
    if (idx % 2 === 1) {
      row.eachCell(cell => {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8FAFC' } };
      });
    }
  });

  autoFitColumns(ws, 12, 55);
}


/**
 * Build Key Points Sheet matching HF_GDMT_160926_updated_as_per_calculations.xlsx format
 */
function buildKeyPointsSheet(workbook, analytics, patients, wsKeyPoints = null, sheet1Rows = null, ciFlagsRows = null) {
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
  }

  // Rows 5 to 19: Cohort metrics
  const metricSpecs = [
    { r: 5, label: 'HF records (UHIDs) in dataset', formula: `COUNTA('Sheet1'!B2:B${total + 1})`, result: total, src: 'Sheet1 col B', numFmt: undefined },
    { r: 6, label: 'Male', formula: `COUNTIF('Sheet1'!I2:I${total + 1},"Male")`, result: males, src: 'Sheet1 col I', numFmt: undefined },
    { r: 7, label: 'Female', formula: `COUNTIF('Sheet1'!I2:I${total + 1},"Female")`, result: females, src: 'Sheet1 col I', numFmt: undefined },
    { r: 8, label: 'Mean age (years)', formula: `AVERAGE('Sheet1'!H2:H${total + 1})`, result: meanAge, src: 'Sheet1 col H', numFmt: '0.0' },
    { r: 9, label: 'HFrEF', formula: `COUNTIF('Sheet1'!AO2:AO${total + 1},"*HFrEF*")`, result: hfref, src: 'Sheet1 col AO', numFmt: undefined },
    { r: 10, label: 'HFpEF', formula: `COUNTIF('Sheet1'!AO2:AO${total + 1},"*HFpEF*")`, result: hfpef, src: 'Sheet1 col AO', numFmt: undefined },
    { r: 11, label: 'Mean EF %', formula: `AVERAGE('Sheet1'!BJ2:BJ${total + 1})`, result: meanEf, src: 'Sheet1 col BJ', numFmt: '0.0' },
    { r: 12, label: 'NYHA class III', formula: `COUNTIF('Sheet1'!AV2:AV${total + 1},"*III*")`, result: nyha3, src: 'Sheet1 col AV', numFmt: undefined },
    { r: 13, label: 'NYHA class IV', formula: `COUNTIF('Sheet1'!AV2:AV${total + 1},"*IV*")`, result: nyha4, src: 'Sheet1 col AV', numFmt: undefined },
    { r: 14, label: 'Diabetes mellitus (any comorbidity column)', formula: `COUNTIF('Sheet1'!AP2:AS${total + 1},"*Diabet*")`, result: dm, src: 'Sheet1 col AP:AS', numFmt: undefined },
    { r: 15, label: 'Hypertension', formula: `COUNTIF('Sheet1'!AP2:AS${total + 1},"*Hyperten*")`, result: htn, src: 'Sheet1 col AP:AS', numFmt: undefined },
    { r: 16, label: 'Renal failure / CKD flagged (renal contraindication)', formula: `COUNTIF('CI Flags'!O2:O${total + 1},1)`, result: ckd, src: 'CI Flags col O', numFmt: undefined },
    { r: 17, label: 'Deaths recorded', formula: `COUNTIF('Sheet1'!BA2:BA${total + 1},"Yes")`, result: deaths, src: 'Sheet1 col BA', numFmt: undefined },
    { r: 18, label: 'Mean number of GDMT drugs per patient', formula: `AVERAGE('Sheet1'!CD2:CD${total + 1})`, result: meanDrugs, src: 'Sheet1 col CD', numFmt: '0.0' },
    { r: 19, label: 'Mean % GDMT adherence (no deviation)', formula: `AVERAGE('Sheet1'!CS2:CS${total + 1})`, result: meanAdh, src: 'Sheet1 col CS', numFmt: '0.0%' }
  ];

  metricSpecs.forEach(m => {
    const row = ws.getRow(m.r);
    row.getCell(1).value = m.label;
    if (m.formula && total > 0) {
      row.getCell(2).value = { formula: m.formula, result: m.result };
    } else {
      row.getCell(2).value = m.result;
    }
    if (m.numFmt) row.getCell(2).numFmt = m.numFmt;
    row.getCell(3).value = m.src;
    [1, 2, 3].forEach(c => {
      row.getCell(c).font = REF_FONT_REGULAR;
      row.getCell(c).border = BORDER_THIN;
    });
  });

  // Table 2 (Rows 21-27): GDMT Class Uptake & Contraindications
  const r21 = ws.getRow(21);
  r21.values = ['GDMT class', 'Patients on drug', '% of cohort', 'Contraindication present', '% with contraindication'];
  [1, 2, 3, 4, 5].forEach(c => {
    const cell = r21.getCell(c);
    cell.fill = HEADER_FILL_REF_BLUE;
    cell.font = REF_FONT_BOLD;
    cell.border = BORDER_THIN;
  });

  const categories = [
    { name: 'Beta blocker', key: 'betaBlocker', row: 22 },
    { name: 'ACE inhibitor', key: 'aceInhibitor', row: 23 },
    { name: 'ARB', key: 'arb', row: 24 },
    { name: 'ARNI', key: 'arni', row: 25 },
    { name: 'MRA', key: 'mra', row: 26 },
    { name: 'SGLT2 inhibitor', key: 'sglt2Inhibitor', row: 27 }
  ];

  categories.forEach(cat => {
    const row = ws.getRow(cat.row);
    const onDrug = patients.filter(p => p.pillarEvaluations?.[cat.key]?.prescribed).length;
    const withCi = patients.filter(p => p.pillarEvaluations?.[cat.key]?.contraindication).length;
    row.getCell(1).value = cat.name;
    row.getCell(2).value = onDrug;
    row.getCell(3).value = { formula: `B${cat.row}/$B$5`, result: total > 0 ? onDrug / total : 0 };
    row.getCell(3).numFmt = '0.0%';
    row.getCell(4).value = withCi;
    row.getCell(5).value = { formula: `D${cat.row}/$B$5`, result: total > 0 ? withCi / total : 0 };
    row.getCell(5).numFmt = '0.0%';
    [1, 2, 3, 4, 5].forEach(c => {
      row.getCell(c).font = REF_FONT_REGULAR;
      row.getCell(c).border = BORDER_THIN;
    });
  });

  // Table 3 (Rows 29-35): GDMT Class Deviations & Appropriateness
  const r29 = ws.getRow(29);
  r29.values = ['GDMT class', 'Drug given despite contraindication', 'Drug withheld with no contraindication', 'Total deviations', '% deviation', '% appropriate'];
  [1, 2, 3, 4, 5, 6].forEach(c => {
    const cell = r29.getCell(c);
    cell.fill = HEADER_FILL_REF_BLUE;
    cell.font = REF_FONT_BOLD;
    cell.border = BORDER_THIN;
  });

  categories.forEach((cat, idx) => {
    const rNum = 30 + idx;
    const row = ws.getRow(rNum);
    const givenWithCi = patients.filter(p => p.pillarEvaluations?.[cat.key]?.prescribed === 1 && p.pillarEvaluations?.[cat.key]?.contraindication === 1).length;
    const withheldNoCi = patients.filter(p => p.pillarEvaluations?.[cat.key]?.prescribed === 0 && p.pillarEvaluations?.[cat.key]?.contraindication === 0).length;
    const totalDev = givenWithCi + withheldNoCi;
    const devPct = total > 0 ? totalDev / total : 0;
    const appPct = 1 - devPct;

    row.getCell(1).value = cat.name;
    row.getCell(2).value = givenWithCi;
    row.getCell(3).value = withheldNoCi;
    row.getCell(4).value = { formula: `B${rNum}+C${rNum}`, result: totalDev };
    row.getCell(5).value = { formula: `D${rNum}/$B$5`, result: devPct };
    row.getCell(5).numFmt = '0.0%';
    row.getCell(6).value = { formula: `1-E${rNum}`, result: appPct };
    row.getCell(6).numFmt = '0.0%';
    [1, 2, 3, 4, 5, 6].forEach(c => {
      row.getCell(c).font = REF_FONT_REGULAR;
      row.getCell(c).border = BORDER_THIN;
    });
  });

  // Table 4 (Rows 37-44): % GDMT adhered to distribution
  const r37 = ws.getRow(37);
  r37.values = ['% GDMT adhered to', 'UHID count', '% of cohort'];
  [1, 2, 3].forEach(c => {
    const cell = r37.getCell(c);
    cell.fill = HEADER_FILL_REF_BLUE;
    cell.font = REF_FONT_BOLD;
    cell.border = BORDER_THIN;
  });

  const adhDistrib = [
    { dev: 6, refSummaryRow: 39, label: '0.0%', pct: 0 },
    { dev: 5, refSummaryRow: 40, label: '16.7%', pct: 1 / 6 },
    { dev: 4, refSummaryRow: 41, label: '33.3%', pct: 2 / 6 },
    { dev: 3, refSummaryRow: 42, label: '50.0%', pct: 3 / 6 },
    { dev: 2, refSummaryRow: 43, label: '66.7%', pct: 4 / 6 },
    { dev: 1, refSummaryRow: 44, label: '83.3%', pct: 5 / 6 },
    { dev: 0, refSummaryRow: 45, label: '100.0%', pct: 1 }
  ];

  adhDistrib.forEach((item, idx) => {
    const rNum = 38 + idx;
    const row = ws.getRow(rNum);
    const count = patients.filter(p => (p.deviationsCount || 0) === item.dev).length;
    row.getCell(1).value = { formula: `'GDMT Summary'!A${item.refSummaryRow}`, result: item.pct };
    row.getCell(1).numFmt = '0.0%';
    row.getCell(2).value = { formula: `'GDMT Summary'!C${item.refSummaryRow}`, result: count };
    row.getCell(3).value = { formula: `B${rNum}/$B$5`, result: total > 0 ? count / total : 0 };
    row.getCell(3).numFmt = '0.0%';
    [1, 2, 3].forEach(c => {
      row.getCell(c).font = REF_FONT_REGULAR;
      row.getCell(c).border = BORDER_THIN;
    });
  });

  // Section 5: Key Points Narrative (Rows 46-55)
  const r46 = ws.getRow(46);
  r46.getCell(1).value = 'Key points';
  r46.getCell(1).font = { name: 'Calibri', size: 12, bold: true, color: { argb: 'FF000000' } };

  // Compute live strings
  const mraOn = patients.filter(p => p.pillarEvaluations?.mra?.prescribed).length;
  const bbOn = patients.filter(p => p.pillarEvaluations?.betaBlocker?.prescribed).length;
  const arniOn = patients.filter(p => p.pillarEvaluations?.arni?.prescribed).length;
  const sglt2On = patients.filter(p => p.pillarEvaluations?.sglt2Inhibitor?.prescribed).length;
  const arbOn = patients.filter(p => p.pillarEvaluations?.arb?.prescribed).length;
  const aceOn = patients.filter(p => p.pillarEvaluations?.aceInhibitor?.prescribed).length;

  const toPctStr = n => total > 0 ? Math.round((n / total) * 100) + '%' : '0%';

  const mraWithheld = patients.filter(p => p.pillarEvaluations?.mra?.prescribed === 0 && p.pillarEvaluations?.mra?.contraindication === 0).length;
  const mraGivenCi = patients.filter(p => p.pillarEvaluations?.mra?.prescribed === 1 && p.pillarEvaluations?.mra?.contraindication === 1).length;
  const aceWithheld = patients.filter(p => p.pillarEvaluations?.aceInhibitor?.prescribed === 0 && p.pillarEvaluations?.aceInhibitor?.contraindication === 0).length;
  const arbWithheld = patients.filter(p => p.pillarEvaluations?.arb?.prescribed === 0 && p.pillarEvaluations?.arb?.contraindication === 0).length;
  const sglt2Withheld = patients.filter(p => p.pillarEvaluations?.sglt2Inhibitor?.prescribed === 0 && p.pillarEvaluations?.sglt2Inhibitor?.contraindication === 0).length;
  const bbWithheld = patients.filter(p => p.pillarEvaluations?.betaBlocker?.prescribed === 0 && p.pillarEvaluations?.betaBlocker?.contraindication === 0).length;
  const arniWithheld = patients.filter(p => p.pillarEvaluations?.arni?.prescribed === 0 && p.pillarEvaluations?.arni?.contraindication === 0).length;

  const p47Res = `1. Cohort: ${total} heart-failure patients (${males} male, ${females} female), mean age ${Math.round(meanAge)} years; ${hfref} HFrEF and ${hfpef} HFpEF, mean EF ${Math.round(meanEf)}%. Most were NYHA class III (${nyha3}) or IV (${nyha4}).`;
  const p48Res = `2. Comorbidity burden is high: diabetes in ${dm} (${toPctStr(dm)}), hypertension in ${htn} (${toPctStr(htn)}), and a renal impairment / AKI flag in ${ckd} (${toPctStr(ckd)}). ${deaths} deaths were recorded.`;
  const p49Res = `3. GDMT uptake is low: patients take on average ${meanDrugs.toFixed(1)} of 6 GDMT classes. MRA is the most used (${toPctStr(mraOn)}), followed by beta blocker (${toPctStr(bbOn)}) and ARNI (${toPctStr(arniOn)}). SGLT2 inhibitors (${toPctStr(sglt2On)}), ARB (${toPctStr(arbOn)}) and ACE inhibitors (${toPctStr(aceOn)}) are rarely used.`;
  const p50Res = `4. Contraindications identified from the data are common: RAAS agents (ACEi/ARB ${toPctStr(patients.filter(p => p.pillarEvaluations?.aceInhibitor?.contraindication || p.pillarEvaluations?.arb?.contraindication).length)}, ARNI ${toPctStr(patients.filter(p => p.pillarEvaluations?.arni?.contraindication).length)}) and MRA (${toPctStr(patients.filter(p => p.pillarEvaluations?.mra?.contraindication).length)}) are mainly limited by renal impairment / hyperkalaemia; beta blockers (${toPctStr(patients.filter(p => p.pillarEvaluations?.betaBlocker?.contraindication).length)}) by shock/inotropes, hypotension and airway disease; SGLT2i (${toPctStr(patients.filter(p => p.pillarEvaluations?.sglt2Inhibitor?.contraindication).length)}) by UTI and severe renal impairment.`;
  const p51Res = `5. Under-treatment is the dominant deviation: drug withheld with no identified contraindication in ${aceWithheld} (ACEi), ${arbWithheld} (ARB), ${sglt2Withheld} (SGLT2i), ${bbWithheld} (beta blocker) and ${arniWithheld} (ARNI) patients. Note ACEi/ARB/ARNI are alternatives, so a patient on one is counted as a deviation for the other two.`;
  const p52Res = `6. MRA shows the opposite pattern: ${mraGivenCi} patients received an MRA despite a flagged contraindication (mostly renal/hyperkalaemia), versus ${mraWithheld} withheld without one.`;

  const fullAdhCount = patients.filter(p => (p.deviationsCount || 0) === 0).length;
  const zeroAdhCount = patients.filter(p => (p.deviationsCount || 0) === 6).length;
  const p53Res = `7. Overall adherence (no deviation across the 6 classes) averages ${Math.round(meanAdh * 100)}%. Only ${fullAdhCount} patients (${toPctStr(fullAdhCount)}) had full adherence and ${zeroAdhCount} (${toPctStr(zeroAdhCount)}) had none.`;
  const p54Res = `8. Highest deviation rates by class: SGLT2 inhibitor ${toPctStr(patients.filter(p => p.pillarEvaluations?.sglt2Inhibitor?.isDeviation).length)}, ACE inhibitor ${toPctStr(patients.filter(p => p.pillarEvaluations?.aceInhibitor?.isDeviation).length)}, ARB ${toPctStr(patients.filter(p => p.pillarEvaluations?.arb?.isDeviation).length)}; lowest: MRA ${toPctStr(patients.filter(p => p.pillarEvaluations?.mra?.isDeviation).length)} and ARNI ${toPctStr(patients.filter(p => p.pillarEvaluations?.arni?.isDeviation).length)}.`;
  const p55Res = `9. Limitations: contraindications are inferred from keyword search of free-text diagnosis/history fields and single lab values (creatinine, potassium) with editable thresholds on the Contraindications sheet; eGFR, pregnancy, prior intolerance and drug-titration history are not captured.`;

  const narrativeRows = [
    { r: 47, formula: `"1. Cohort: "&B5&" heart-failure patients ("&B6&" male, "&B7&" female), mean age "&TEXT(B8,"0")&" years; "&B9&" HFrEF and "&B10&" HFpEF, mean EF "&TEXT(B11,"0")&"%. Most were NYHA class III ("&B12&") or IV ("&B13&")."`, res: p47Res },
    { r: 48, formula: `"2. Comorbidity burden is high: diabetes in "&B14&" ("&TEXT(B14/B5,"0%")&"), hypertension in "&B15&" ("&TEXT(B15/B5,"0%")&"), and a renal impairment / AKI flag in "&B16&" ("&TEXT(B16/B5,"0%")&"). "&B17&" deaths were recorded."`, res: p48Res },
    { r: 49, formula: `"3. GDMT uptake is low: patients take on average "&TEXT(B18,"0.0")&" of 6 GDMT classes. MRA is the most used ("&TEXT(C26,"0%")&"), followed by beta blocker ("&TEXT(C22,"0%")&") and ARNI ("&TEXT(C25,"0%")&"). SGLT2 inhibitors ("&TEXT(C27,"0%")&"), ARB ("&TEXT(C24,"0%")&") and ACE inhibitors ("&TEXT(C23,"0%")&") are rarely used."`, res: p49Res },
    { r: 50, formula: `"4. Contraindications identified from the data are common: RAAS agents (ACEi/ARB "&TEXT(E23,"0%")&", ARNI "&TEXT(E25,"0%")&") and MRA ("&TEXT(E26,"0%")&") are mainly limited by renal impairment / hyperkalaemia; beta blockers ("&TEXT(E22,"0%")&") by shock/inotropes, hypotension and airway disease; SGLT2i ("&TEXT(E27,"0%")&") by UTI and severe renal impairment."`, res: p50Res },
    { r: 51, formula: `"5. Under-treatment is the dominant deviation: drug withheld with no identified contraindication in "&C31&" (ACEi), "&C32&" (ARB), "&C35&" (SGLT2i), "&C30&" (beta blocker) and "&C33&" (ARNI) patients. Note ACEi/ARB/ARNI are alternatives, so a patient on one is counted as a deviation for the other two."`, res: p51Res },
    { r: 52, formula: `"6. MRA shows the opposite pattern: "&B34&" patients received an MRA despite a flagged contraindication (mostly renal/hyperkalaemia), versus "&C34&" withheld without one."`, res: p52Res },
    { r: 53, formula: `"7. Overall adherence (no deviation across the 6 classes) averages "&TEXT(B19,"0%")&". Only "&B44&" patients ("&TEXT(C44,"0%")&") had full adherence and "&B38&" ("&TEXT(C38,"0%")&") had none."`, res: p53Res },
    { r: 54, formula: `"8. Highest deviation rates by class: SGLT2 inhibitor "&TEXT(E35,"0%")&", ACE inhibitor "&TEXT(E31,"0%")&", ARB "&TEXT(E32,"0%")&"; lowest: MRA "&TEXT(E34,"0%")&" and ARNI "&TEXT(E33,"0%")&"."`, res: p54Res },
    { r: 55, formula: undefined, res: p55Res }
  ];

  narrativeRows.forEach(n => {
    ws.mergeCells(`A${n.r}:F${n.r}`);
    const cell = ws.getCell(`A${n.r}`);
    if (n.formula && total > 0) {
      cell.value = { formula: n.formula, result: n.res };
    } else {
      cell.value = n.res;
    }
    cell.font = REF_FONT_REGULAR;
    cell.alignment = { vertical: 'top', wrapText: true };
    ws.getRow(n.r).height = 28;
  });

  ws.columns = [
    { width: 45 },
    { width: 20 },
    { width: 20 },
    { width: 20 },
    { width: 20 },
    { width: 20 }
  ];
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
    ['admission type', 'admission_type', 'hf_administrative'],
    ['Reasons other than HF', 'precipitating_other', 'hf_administrative'],
    ['Previous Diagnosis', 'previous_diagnosis', 'hf_initial_assessment'],
    ['Medical History', 'history_other', 'hf_initial_assessment'],
    ['Recent hospitalization date', 'recent_hospitalization_dates', 'hf_initial_assessment'],
    ['Reason for hospitalization', 'recent_hospitalization_reasons', 'hf_initial_assessment'],
    ['VT/VF risk assessment', 'documented_vt_vf, complaints_syncope_presyncope, documented_pvcs, documented_nsvt', 'hf_initial_assessment'],
    ['Weight', 'weight', 'hf_initial_assessment'],
    ['Height', 'height', 'hf_initial_assessment'],
    ['Heart rate', 'heart_rate', 'hf_initial_assessment'],
    ['Heart rate variability', 'heart_rate_variability', 'hf_advanced_investigations'],
    ['Respiratory rate', 'respiratory_rate', 'hf_initial_assessment'],
    ['O₂ Saturation (%)', 'oxygen_saturation', 'hf_initial_assessment'],
    ['Blood pressure sitting', 'systolic_bp_sitting', 'hf_initial_assessment'],
    ['Blood pressure standing', 'systolic_bp_standing', 'hf_initial_assessment'],
    ['Mental status', 'mental_status_alert_oriented', 'hf_initial_assessment'],
    ['Symptoms1', 'dyspnea_at_rest', 'hf_initial_assessment'],
    ['Symptoms2', 'dyspnea_with_exertion', 'hf_initial_assessment'],
    ['Symptoms3', 'All remaining active symptoms from 3rd onwards', 'hf_initial_assessment'],
    ['Clinical signs of volume overload1', 'peripheral_edema', 'hf_initial_assessment'],
    ['Clinical signs of volume overload2', 'All remaining active volume overload signs from 2nd onwards', 'hf_initial_assessment'],
    ['Type of Heart failure', 'hf_type', 'hf_gdmt_evaluation'],
    ['Comorbidities1', 'cad', 'hf_final_clinical_assessment'],
    ['Comorbidities2', 'renal_failure / diabetes_mellitus', 'hf_final_clinical_assessment'],
    ['Comorbidities3', 'hypertension / other active comorbidity', 'hf_final_clinical_assessment'],
    ['Comorbidities4', 'All remaining active comorbidities from 4th onwards (comma-separated)', 'hf_final_clinical_assessment'],
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
    ['Any blockages', 'ecg_lbbb, ecg_rbbb, ecg_block_other, ecg_block_other_details', 'hf_cardiac_investigations'],
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
    ['Uric acid', 'other_lab_test_result (when test name is Uric Acid)', 'hf_lab_tests'],
    ['Total Cholesterol', 'other_lab_test_result (when test name is Total Cholesterol)', 'hf_lab_tests'],
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
  // Fetch dedicated mapped Sheet1 data based strictly on mapping.xlsx rules and active filters
  const hfIds = (patients || []).map(p => p.hfId).filter(Boolean);
  let sheet1Data = null;
  try {
    sheet1Data = await fetchHfSheet1Export(hfIds.length > 0 ? hfIds.join(',') : undefined);
  } catch (err) {
    console.warn('Could not fetch dedicated Sheet1 backend export data, using local cohort data:', err.message);
  }

  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Cardio Registry GDMT Clinical Intelligence Engine';
  workbook.lastModifiedBy = 'Cardio Registry System';
  workbook.created = new Date();
  workbook.modified = new Date();

  // Create worksheets in exact visual order to keep Tab #1 as Key Points
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
  buildKeyPointsSheet(workbook, analytics, patients, wsKeyPoints, sheet1Rows, ciFlagsRows);

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
