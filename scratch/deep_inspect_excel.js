const ExcelJS = require('../frontend/node_modules/exceljs');

(async () => {
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.readFile('C:\\Users\\ADMIN\\Downloads\\CARE_CEO_Executive_Registry_Audit_2026-11-25.xlsx');

  console.log('--- SHEET ROW COUNTS ---');
  wb.worksheets.forEach(ws => console.log(`${ws.name}: ${ws.rowCount} rows`));

  const ws = wb.getWorksheet('CEO Dashboard Outcomes & KPIs');
  
  // Section 1: Headline
  console.log('\n--- TAB 1: HEADLINE KPIS (Rows 6-17) ---');
  for (let r = 6; r <= 17; r++) {
    const row = ws.getRow(r);
    const vals = [];
    row.eachCell((c) => vals.push(c.value));
    console.log(`R${r}:`, vals.join(' | '));
  }

  // Section 2: Demographics
  console.log('\n--- TAB 1: DEMOGRAPHICS (Rows 18-40) ---');
  for (let r = 18; r <= 40; r++) {
    const row = ws.getRow(r);
    const vals = [];
    row.eachCell((c) => vals.push(c.value));
    if (vals.length > 0) console.log(`R${r}:`, vals.join(' | '));
  }

  // Section 3: Three Registries
  console.log('\n--- TAB 1: THREE REGISTRIES (Rows 41-75) ---');
  for (let r = 41; r <= 75; r++) {
    const row = ws.getRow(r);
    const vals = [];
    row.eachCell((c) => vals.push(c.value));
    if (vals.length > 0) console.log(`R${r}:`, vals.join(' | '));
  }

  // Section 4: Quality & Safety
  console.log('\n--- TAB 1: QUALITY & SAFETY (Rows 76-110) ---');
  for (let r = 76; r <= 110; r++) {
    const row = ws.getRow(r);
    const vals = [];
    row.eachCell((c) => vals.push(c.value));
    if (vals.length > 0) console.log(`R${r}:`, vals.join(' | '));
  }

  // Section 5: Risk Stratification
  console.log('\n--- TAB 1: TIMI RISK (Rows 111-130) ---');
  for (let r = 111; r <= 130; r++) {
    const row = ws.getRow(r);
    const vals = [];
    row.eachCell((c) => vals.push(c.value));
    if (vals.length > 0) console.log(`R${r}:`, vals.join(' | '));
  }

  // Section 6: Trends
  console.log('\n--- TAB 1: MONTHLY TRENDS (Rows 131-141) ---');
  for (let r = 131; r <= 141; r++) {
    const row = ws.getRow(r);
    const vals = [];
    row.eachCell((c) => vals.push(c.value));
    if (vals.length > 0) console.log(`R${r}:`, vals.join(' | '));
  }

  // Section 7: Financials
  console.log('\n--- TAB 1: FINANCIALS (Rows 142-169) ---');
  for (let r = 142; r <= 169; r++) {
    const row = ws.getRow(r);
    const vals = [];
    row.eachCell((c) => vals.push(c.value));
    if (vals.length > 0) console.log(`R${r}:`, vals.join(' | '));
  }

  process.exit(0);
})();
