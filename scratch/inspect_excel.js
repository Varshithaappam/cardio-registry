const ExcelJS = require('../frontend/node_modules/exceljs');

(async () => {
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.readFile('C:\\Users\\ADMIN\\Downloads\\CARE_CEO_Executive_Registry_Audit_2026-11-25.xlsx');
  
  console.log('Sheet names:', wb.worksheets.map(w => w.name));

  for (const ws of wb.worksheets) {
    console.log(`\n======================================================`);
    console.log(`SHEET: ${ws.name} (RowCount: ${ws.rowCount}, ColCount: ${ws.columnCount})`);
    console.log(`======================================================`);

    // Print rows of Tab 1
    if (ws.name === 'CEO Dashboard Outcomes & KPIs') {
      for (let r = 1; r <= ws.rowCount; r++) {
        const row = ws.getRow(r);
        const vals = [];
        row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
          if (colNumber <= 8) {
            let v = cell.value;
            if (v && typeof v === 'object' && v.result !== undefined) v = v.result;
            if (v !== null && v !== undefined && String(v).trim() !== '') {
              vals.push(`[Col ${colNumber}]: ${String(v).trim()}`);
            }
          }
        });
        if (vals.length > 0) {
          console.log(`Row ${r}: ${vals.join(' | ')}`);
        }
      }
    } else {
      // For cohort sheets, print row count, headers (row 1), and first 3 data rows
      const headerRow = ws.getRow(1);
      const headers = [];
      headerRow.eachCell((cell, colNumber) => {
        headers.push(cell.value);
      });
      console.log('Headers (count ' + headers.length + '):', headers.slice(0, 15).join(', ') + '...');
      console.log('Data rows count:', ws.rowCount - 1);
      for (let r = 2; r <= Math.min(ws.rowCount, 7); r++) {
        const row = ws.getRow(r);
        const vals = [];
        row.eachCell((cell) => vals.push(cell.value));
        console.log(`Row ${r}:`, vals.slice(0, 8).join(' | '));
      }
    }
  }

  process.exit(0);
})().catch(err => {
  console.error(err);
  process.exit(1);
});
