const ExcelJS = require('../frontend/node_modules/exceljs');

(async () => {
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.readFile('C:\\Users\\ADMIN\\Downloads\\CARE_CEO_Executive_Registry_Audit_2026-11-25.xlsx');
  const ws = wb.getWorksheet('CEO Dashboard Outcomes & KPIs');
  
  for (let r = 1; r <= ws.rowCount; r++) {
    const row = ws.getRow(r);
    const cells = [];
    row.eachCell({ includeEmpty: false }, (cell, colNumber) => {
      let v = cell.value;
      if (v && typeof v === 'object' && v.result !== undefined) v = v.result;
      cells.push(`[Col${colNumber}]: ${v}`);
    });
    if (cells.length > 0) {
      console.log(`R${r}: ${cells.join(' | ')}`);
    }
  }

  process.exit(0);
})();
