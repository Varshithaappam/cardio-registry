import sys

path = r'frontend\src\utils\excelReportGenerator.js'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Update buildSheet1 to inject live formulas in filteredRows
old_sheet1_rows = """      const dataRow = ws.addRow(rowVals);
      dataRow.eachCell((cell, colNum) => {
        cell.border = BORDER_THIN;
        cell.font = { name: 'Calibri', size: 10 };
        if (colNum === headers.length) {
          cell.numFmt = '0.0%';
          cell.alignment = { horizontal: 'right', vertical: 'middle' };
        }
      });"""

new_sheet1_rows = """      const dataRow = ws.addRow(rowVals);
      const r = idx + 2;

      // Inject live Excel formulas matching the official 'sheet 1 formula' specification
      // Known Contraindications (dynamically derived from 'CI Flags')
      dataRow.getCell(82).value = { formula: `IF(OR('CI Flags'!H${r}=1,'CI Flags'!I${r}=1,'CI Flags'!K${r}=1,'CI Flags'!L${r}=1,'CI Flags'!P${r}=1),1,0)`, result: rowVals[81] };
      dataRow.getCell(83).value = { formula: `IF(OR('CI Flags'!I${r}=1,'CI Flags'!M${r}=1,'CI Flags'!O${r}=1),1,0)`, result: rowVals[82] };
      dataRow.getCell(84).value = { formula: `IF(OR('CI Flags'!I${r}=1,'CI Flags'!M${r}=1,'CI Flags'!O${r}=1),1,0)`, result: rowVals[83] };
      dataRow.getCell(85).value = { formula: `IF(OR('CI Flags'!J${r}=1,'CI Flags'!M${r}=1,'CI Flags'!O${r}=1),1,0)`, result: rowVals[84] };
      dataRow.getCell(86).value = { formula: `IF(OR('CI Flags'!N${r}=1,'CI Flags'!O${r}=1),1,0)`, result: rowVals[85] };
      dataRow.getCell(87).value = { formula: `IF(OR('CI Flags'!Q${r}=1,'CI Flags'!R${r}=1,'CI Flags'!S${r}=1),1,0)`, result: rowVals[86] };

      // Guideline Deviations (Prescribed == Contraindication)
      dataRow.getCell(88).value = { formula: `IF(BW${r}=CD${r},1,0)`, result: rowVals[87] };
      dataRow.getCell(89).value = { formula: `IF(BX${r}=CE${r},1,0)`, result: rowVals[88] };
      dataRow.getCell(90).value = { formula: `IF(BY${r}=CF${r},1,0)`, result: rowVals[89] };
      dataRow.getCell(91).value = { formula: `IF(BZ${r}=CG${r},1,0)`, result: rowVals[90] };
      dataRow.getCell(92).value = { formula: `IF(CA${r}=CH${r},1,0)`, result: rowVals[91] };
      dataRow.getCell(93).value = { formula: `IF(CB${r}=CI${r},1,0)`, result: rowVals[92] };

      // Total Deviations, Variables & % Adherence
      dataRow.getCell(94).value = { formula: `SUM(CJ${r}:CO${r})`, result: rowVals[93] };
      dataRow.getCell(95).value = 6;
      dataRow.getCell(96).value = { formula: `(CQ${r}-CP${r})/CQ${r}`, result: rowVals[95] };

      dataRow.eachCell((cell, colNum) => {
        cell.border = BORDER_THIN;
        cell.font = { name: 'Calibri', size: 10 };
        if (colNum === headers.length) {
          cell.numFmt = '0.0%';
          cell.alignment = { horizontal: 'right', vertical: 'middle' };
        }
      });"""

content = content.replace(old_sheet1_rows.replace('\n', '\r\n'), new_sheet1_rows.replace('\n', '\r\n'))
content = content.replace(old_sheet1_rows, new_sheet1_rows)

# 2. Update buildCiFlagsSheet to use live Excel formulas matching 'CI FLAGS FORMULAE'
old_ci_flags = """  patients.forEach((p, idx) => {
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

    const dataRow = ws.addRow(row);"""

new_ci_flags = """  patients.forEach((p, idx) => {
    const r = idx + 2;
    const sbp = p.systolicBp || 120;
    const hr = p.heartRate || 72;
    const k = p.potassium || 4.2;
    const creat = p.creatinine || 1.1;
    const diag = p.presentDiagnosis || '';
    const diagLower = String(diag).toLowerCase();
    const drugSumm = p.prescribedDrugsSummary || '';

    // Live Excel formulas matching CI FLAGS FORMULAE specification
    const row = [
      p.uhid || '',
      { formula: `IFERROR(VALUE(LEFT(Sheet1!AF${r},FIND("/",Sheet1!AF${r})-1)),"")`, result: sbp },
      { formula: `IF(ISNUMBER(Sheet1!AB${r}),Sheet1!AB${r},"")`, result: hr },
      { formula: `IF(ISNUMBER(Sheet1!BK${r}),Sheet1!BK${r},"")`, result: k },
      { formula: `IF(ISNUMBER(Sheet1!BL${r}),Sheet1!BL${r},"")`, result: creat },
      { formula: `UPPER(Sheet1!P${r}&" | "&Sheet1!S${r}&" | "&Sheet1!T${r}&" | "&Sheet1!U${r}&" | "&Sheet1!X${r}&" | "&Sheet1!AO${r}&" | "&Sheet1!AP${r}&" | "&Sheet1!AQ${r}&" | "&Sheet1!AR${r})`, result: diag },
      { formula: `UPPER(Sheet1!BT${r}&" | "&Sheet1!BU${r})`, result: drugSumm },
      { formula: `IF(AND(ISNUMBER(C${r}),C${r}<Contraindications!$E$4),1,0)`, result: hr < 50 ? 1 : 0 },
      { formula: `IF(AND(ISNUMBER(B${r}),B${r}<Contraindications!$E$5),1,0)`, result: sbp < 90 ? 1 : 0 },
      { formula: `IF(AND(ISNUMBER(B${r}),B${r}<Contraindications!$E$16),1,0)`, result: sbp < 100 ? 1 : 0 },
      { formula: `IF(OR(ISNUMBER(SEARCH("SHOCK",F${r})),ISNUMBER(SEARCH("DOBUTAMINE",G${r})),ISNUMBER(SEARCH("DOBU",G${r})),ISNUMBER(SEARCH("NORAD",G${r}))),1,0)`, result: diagLower.includes('shock') ? 1 : 0 },
      { formula: `IF(OR(ISNUMBER(SEARCH("ASTHMA",F${r})),ISNUMBER(SEARCH("COPD",F${r})),ISNUMBER(SEARCH("BRONCH",F${r}))),1,0)`, result: (diagLower.includes('copd') || diagLower.includes('asthma')) ? 1 : 0 },
      { formula: `IF(OR(AND(ISNUMBER(D${r}),D${r}>Contraindications!$E$10),ISNUMBER(SEARCH("HYPERKAL",F${r}))),1,0)`, result: k > 5.5 ? 1 : 0 },
      { formula: `IF(OR(AND(ISNUMBER(D${r}),D${r}>Contraindications!$E$19),ISNUMBER(SEARCH("HYPERKAL",F${r}))),1,0)`, result: k > 5.0 ? 1 : 0 },
      { formula: `IF(AND(ISNUMBER(E${r}),E${r}>Contraindications!$E$11),1,0)`, result: creat > 2.5 ? 1 : 0 },
      { formula: `IF(OR(ISNUMBER(SEARCH("AV BLOCK",F${r})),ISNUMBER(SEARCH("HEART BLOCK",F${r})),ISNUMBER(SEARCH("CHB",F${r})),ISNUMBER(SEARCH("SICK SINUS",F${r}))),1,0)`, result: diagLower.includes('block') ? 1 : 0 },
      { formula: `IF(OR(ISNUMBER(SEARCH("DKA",F${r})),ISNUMBER(SEARCH("KETOACID",F${r}))),1,0)`, result: diagLower.includes('dka') ? 1 : 0 },
      { formula: `IF(OR(ISNUMBER(SEARCH("UTI",F${r})),ISNUMBER(SEARCH("UROSEPSIS",F${r}))),1,0)`, result: diagLower.includes('uti') ? 1 : 0 },
      { formula: `IF(AND(ISNUMBER(E${r}),E${r}>Contraindications!$E$21),1,0)`, result: creat > 3.0 ? 1 : 0 }
    ];

    const dataRow = ws.addRow(row);"""

content = content.replace(old_ci_flags.replace('\n', '\r\n'), new_ci_flags.replace('\n', '\r\n'))
content = content.replace(old_ci_flags, new_ci_flags)

# 3. Add buildCiFlagsFormulaeSheet and buildSheet1FormulaeSheet
formula_sheets_code = """
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
    ['Systolic BP', 'IFERROR(VALUE(LEFT(Sheet1!AF2,FIND("/",Sheet1!AF2)-1)),"")', 'Sheet1', 'Blood pressure sitting', 'Till slash e.g. 110/80 so value of Systolic BP=110'],
    ['Heart rate', 'IF(ISNUMBER(Sheet1!AB2),Sheet1!AB2,"")', 'Sheet1', 'Heart rate', 'Numeric heart rate (bpm) extracted from Sheet1 Col AB'],
    ['Potassium', 'IF(ISNUMBER(Sheet1!BK2),Sheet1!BK2,"")', 'Sheet1', 'Potassium', 'Exact serum potassium value (mEq/L) extracted from Sheet1 Col BK'],
    ['Creatinine', 'IF(ISNUMBER(Sheet1!BL2),Sheet1!BL2,"")', 'Sheet1', 'Creatinine', 'Exact serum creatinine value (mg/dL) extracted from Sheet1 Col BL'],
    ['Clinical text (P,S,T,U,X,AO,AP,AQ,AR)', 'UPPER(Sheet1!P2&" | "&Sheet1!S2&" | "&Sheet1!T2&" | "&Sheet1!U2&" | "&Sheet1!X2&" | "&Sheet1!AO2&" | "&Sheet1!AP2&" | "&Sheet1!AQ2&" | "&Sheet1!AR2)', 'Sheet1', 'Present diagnosis, admission type, reasons other than HF, previous diagnosis, comorbidities', 'Concatenated uppercase string of clinical diagnoses and presentations'],
    ['Drug text (BT,BU)', 'UPPER(Sheet1!BT2&" | "&Sheet1!BU2)', 'Sheet1', 'Drugs, Generic Names', 'Concatenated uppercase string of active generic medications and drug names'],
    ['Bradycardia', 'IF(AND(ISNUMBER(C2),C2<Contraindications!$E$4),1,0)', 'CI Flags, Contraindications', 'Heart rate < threshold here threshold = 50', 'Flagged 1 if resting heart rate < 50 bpm (Contraindications!E4)'],
    ['SBP < BB/ACEi/ARB threshold', 'IF(AND(ISNUMBER(B2),B2<Contraindications!$E$5),1,0)', 'CI Flags, Contraindications', 'Systolic BP < threshold here threshold = 90', 'Flagged 1 if sitting systolic BP < 90 mmHg (Contraindications!E5)'],
    ['SBP < ARNI threshold', 'IF(AND(ISNUMBER(B2),B2<Contraindications!$E$16),1,0)', 'CI Flags, Contraindications', 'Systolic BP < threshold (stricter than ACEi/ARB) here threshold = 100', 'Flagged 1 if sitting systolic BP < 100 mmHg (Contraindications!E16)'],
    ['Shock / inotropes', 'IF(OR(ISNUMBER(SEARCH("SHOCK",F2)),ISNUMBER(SEARCH("DOBUTAMINE",G2)),ISNUMBER(SEARCH("DOBU",G2)),ISNUMBER(SEARCH("NORAD",G2))),1,0)', 'CI Flags', 'Clinical text, Drug text', 'Flagged 1 if diagnosis mentions SHOCK or drugs include inotropes (DOBUTAMINE, NORAD)'],
    ['Asthma / COPD', 'IF(OR(ISNUMBER(SEARCH("ASTHMA",F2)),ISNUMBER(SEARCH("COPD",F2)),ISNUMBER(SEARCH("BRONCH",F2))),1,0)', 'CI Flags', 'Clinical text', 'Flagged 1 if diagnosis or comorbidities mention ASTHMA, COPD, or BRONCHOSPASM'],
    ['Hyperkalaemia (ACEi/ARB/ARNI)', 'IF(OR(AND(ISNUMBER(D2),D2>Contraindications!$E$10),ISNUMBER(SEARCH("HYPERKAL",F2))),1,0)', 'CI Flags, Contraindications', 'Potassium > threshold, or keyword HYPERKAL here threshold = 5.5', 'Flagged 1 if serum potassium > 5.5 mEq/L or clinical text contains HYPERKAL'],
    ['Hyperkalaemia (MRA)', 'IF(OR(AND(ISNUMBER(D2),D2>Contraindications!$E$19),ISNUMBER(SEARCH("HYPERKAL",F2))),1,0)', 'CI Flags, Contraindications', 'Potassium > threshold, or keyword HYPERKAL here threshold = 5.0', 'Flagged 1 if serum potassium > 5.0 mEq/L or clinical text contains HYPERKAL'],
    ['Renal impairment (creatinine)', 'IF(AND(ISNUMBER(E2),E2>Contraindications!$E$11),1,0)', 'CI Flags, Contraindications', 'Creatinine > threshold here threshold = 2.5', 'Flagged 1 if serum creatinine > 2.5 mg/dL (Contraindications!E11)'],
    ['AV block / sick sinus', 'IF(OR(ISNUMBER(SEARCH("AV BLOCK",F2)),ISNUMBER(SEARCH("HEART BLOCK",F2)),ISNUMBER(SEARCH("CHB",F2)),ISNUMBER(SEARCH("SICK SINUS",F2))),1,0)', 'CI Flags', 'Clinical text', 'Flagged 1 if AV block, complete heart block (CHB), or sick sinus syndrome documented'],
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
    ['Known Contraindication for ACE inhibitor', "IF(OR('CI Flags'!I2=1,'CI Flags'!M2=1,'CI Flags'!O2=1),1,0)", 'CI Flags', 'SBP < ACE threshold, Hyperkalaemia (>5.5), Renal impairment (>2.5)', '1 if hypotension, hyperkalemia, or renal impairment is active in CI Flags, else 0'],
    ['Known Contraindication for ARB', "IF(OR('CI Flags'!I2=1,'CI Flags'!M2=1,'CI Flags'!O2=1),1,0)", 'CI Flags', 'SBP < ARB threshold, Hyperkalaemia (>5.5), Renal impairment (>2.5)', '1 if hypotension, hyperkalemia, or renal impairment is active in CI Flags, else 0'],
    ['Known Contraindication for ARNI', "IF(OR('CI Flags'!J2=1,'CI Flags'!M2=1,'CI Flags'!O2=1),1,0)", 'CI Flags', 'SBP < ARNI threshold (<100), Hyperkalaemia (>5.5), Renal impairment (>2.5)', '1 if stricter hypotension (<100), hyperkalemia, or renal impairment is active in CI Flags, else 0'],
    ['Known Contraindication for MRA', "IF(OR('CI Flags'!N2=1,'CI Flags'!O2=1),1,0)", 'CI Flags', 'Hyperkalaemia MRA (>5.0), Renal impairment (>2.5)', '1 if stricter hyperkalemia (>5.0) or renal impairment is active in CI Flags, else 0'],
    ['Known Contraindication for SGLT2 inhibitor', "IF(OR('CI Flags'!Q2=1,'CI Flags'!R2=1,'CI Flags'!S2=1),1,0)", 'CI Flags', 'DKA, UTI / urosepsis, Severe renal SGLT2 (>3.0)', '1 if DKA, UTI/urosepsis, or severe renal impairment (>3.0) is active in CI Flags, else 0'],
    ['Deviation for Beta blocker2', 'IF(BW2=CD2,1,0)', 'Sheet1', 'Beta blocker (Col BW), Known Contraindication for Beta blocker (Col CD)', '1 if prescribed with CI (1=1) or omitted without CI (0=0); 0 if guideline adherent'],
    ['Deviation for ACE inhibitor3', 'IF(BX2=CE2,1,0)', 'Sheet1', 'ACE inhibitor (Col BX), Known Contraindication for ACE inhibitor (Col CE)', '1 if prescribed with CI (1=1) or omitted without CI (0=0); 0 if guideline adherent'],
    ['Deviation for ARB4', 'IF(BY2=CF2,1,0)', 'Sheet1', 'ARB (Col BY), Known Contraindication for ARB (Col CF)', '1 if prescribed with CI (1=1) or omitted without CI (0=0); 0 if guideline adherent'],
    ['Deviation for ARNI5', 'IF(BZ2=CG2,1,0)', 'Sheet1', 'ARNI (Col BZ), Known Contraindication for ARNI (Col CG)', '1 if prescribed with CI (1=1) or omitted without CI (0=0); 0 if guideline adherent'],
    ['Deviation for MRA6', 'IF(CA2=CH2,1,0)', 'Sheet1', 'MRA (Col CA), Known Contraindication for MRA (Col CH)', '1 if prescribed with CI (1=1) or omitted without CI (0=0); 0 if guideline adherent'],
    ['Deviation for SGLT2 inhibitor7', 'IF(CB2=CI2,1,0)', 'Sheet1', 'SGLT2 inhibitor (Col CB), Known Contraindication for SGLT2 inhibitor (Col CI)', '1 if prescribed with CI (1=1) or omitted without CI (0=0); 0 if guideline adherent'],
    ['Total Deviations present', 'SUM(CJ2:CO2)', 'Sheet1', 'Deviation columns CJ through CO', 'Sum of all deviation flags across the 6 guideline drug classes'],
    ['Total Variables', '6', 'Sheet1', 'Standard guideline pillars count', 'Standard 6 evaluable GDMT drug classes'],
    ['% of GDMT adhered to', '(CQ2-CP2)/CQ2', 'Sheet1', 'Total Variables (Col CQ), Total Deviations present (Col CP)', 'Adherence formula: 1 - (Total Deviations / 6), formatted as percentage (0.0%)']
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
"""

# Insert these two functions before buildKeyPointsSheet
target_insert = "function buildKeyPointsSheet"
content = content.replace(target_insert, formula_sheets_code + "\n" + target_insert)

# 4. Update exportCohortExcel to call buildCiFlagsFormulaeSheet and buildSheet1FormulaeSheet
old_export_calls = """  // 6. CI Flags
  buildCiFlagsSheet(workbook, patients);"""

new_export_calls = """  // 6. CI Flags
  buildCiFlagsSheet(workbook, patients);

  // 7. CI FLAGS FORMULAE (Formula guide & calculation explanation)
  buildCiFlagsFormulaeSheet(workbook);

  // 8. sheet 1 formula (Sheet1 Formula guide & calculation explanation)
  buildSheet1FormulaeSheet(workbook);"""

content = content.replace(old_export_calls.replace('\n', '\r\n'), new_export_calls.replace('\n', '\r\n'))
content = content.replace(old_export_calls, new_export_calls)

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)
print('Successfully patched frontend/src/utils/excelReportGenerator.js')

