const ExcelJS = require('exceljs');

async function testFormulaResult() {
  const wb = new ExcelJS.Workbook();
  const wsKP = wb.addWorksheet('Key Points');
  const wsS1 = wb.addWorksheet('Sheet1');

  // Add dummy row to Sheet1
  wsS1.addRow(['SL', 'UHID', 'EF']);
  wsS1.addRow([1, 'U1', 35]);
  wsS1.addRow([2, 'U2', 40]);
  wsS1.addRow([3, 'U3', '']); // blank EF

  // Calculate average of non-blank EF in Sheet1
  const efVals = [];
  for (let r = 2; r <= 4; r++) {
    const val = wsS1.getRow(r).getCell(3).value;
    if (typeof val === 'number' && !isNaN(val)) efVals.push(val);
  }
  const avg = efVals.reduce((a, b) => a + b, 0) / efVals.length;
  console.log('Calculated avg:', avg); // 37.5

  wsKP.getCell('B11').value = { formula: "AVERAGE('Sheet1'!C2:C4)", result: avg };
  console.log('Cell B11 formula:', wsKP.getCell('B11').value.formula);
  console.log('Cell B11 result:', wsKP.getCell('B11').value.result);
}

testFormulaResult();

