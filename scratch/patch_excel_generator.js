const fs = require('fs');

const path = 'frontend/src/utils/excelReportGenerator.js';
let content = fs.readFileSync(path, 'utf8');

// 1. Replace dataRow cell formulas in buildCiFlagsSheet
const targetFormulas = `    dataRow.getCell(3).value = { formula: \`IF(ISNUMBER(Sheet1!AC\${r}),Sheet1!AC\${r},"")\`, result: hr };
    dataRow.getCell(4).value = { formula: \`IF(ISNUMBER(Sheet1!BL\${r}),Sheet1!BL\${r},"")\`, result: k };
    dataRow.getCell(5).value = { formula: \`IF(ISNUMBER(Sheet1!BM\${r}),Sheet1!BM\${r},"")\`, result: creat };`;

const replacementFormulas = `    dataRow.getCell(3).value = { formula: \`IFERROR(IF(ISNUMBER(Sheet1!AC\${r}),Sheet1!AC\${r},VALUE(Sheet1!AC\${r})),"")\`, result: hr };
    dataRow.getCell(4).value = { formula: \`IFERROR(IF(ISNUMBER(Sheet1!BL\${r}),Sheet1!BL\${r},VALUE(Sheet1!BL\${r})),"")\`, result: k };
    dataRow.getCell(5).value = { formula: \`IFERROR(IF(ISNUMBER(Sheet1!BM\${r}),Sheet1!BM\${r},VALUE(Sheet1!BM\${r})),"")\`, result: creat };`;

// 2. Replace formula descriptions in buildCiFlagsFormulaeSheet
const targetDesc = `    ['Heart rate', 'IF(ISNUMBER(Sheet1!AC2),Sheet1!AC2,"")', 'Sheet1', 'Heart rate', 'Numeric heart rate (bpm) extracted from Sheet1 Col AC'],
    ['Potassium', 'IF(ISNUMBER(Sheet1!BL2),Sheet1!BL2,"")', 'Sheet1', 'Potassium', 'Exact serum potassium value (mEq/L) extracted from Sheet1 Col BL'],
    ['Creatinine', 'IF(ISNUMBER(Sheet1!BM2),Sheet1!BM2,"")', 'Sheet1', 'Creatinine', 'Exact serum creatinine value (mg/dL) extracted from Sheet1 Col BM'],`;

const replacementDesc = `    ['Heart rate', 'IFERROR(IF(ISNUMBER(Sheet1!AC2),Sheet1!AC2,VALUE(Sheet1!AC2)),"")', 'Sheet1', 'Heart rate', 'Numeric heart rate (bpm) extracted from Sheet1 Col AC'],
    ['Potassium', 'IFERROR(IF(ISNUMBER(Sheet1!BL2),Sheet1!BL2,VALUE(Sheet1!BL2)),"")', 'Sheet1', 'Potassium', 'Exact serum potassium value (mEq/L) extracted from Sheet1 Col BL'],
    ['Creatinine', 'IFERROR(IF(ISNUMBER(Sheet1!BM2),Sheet1!BM2,VALUE(Sheet1!BM2)),"")', 'Sheet1', 'Creatinine', 'Exact serum creatinine value (mg/dL) extracted from Sheet1 Col BM'],`;

// 3. Fallback sheet1 numeric conversion helper if needed
const helperFn = `function toNumericOrEmpty(val) {
  if (val === null || val === undefined) return '';
  const s = String(val).trim();
  if (s === '') return '';
  const num = Number(s);
  return !isNaN(num) ? num : s;
}
`;

if (!content.includes('function toNumericOrEmpty')) {
    content = helperFn + content;
}

const targetFallback = `      p.potassium || '',
      p.creatinine || '',`;

const replacementFallback = `      toNumericOrEmpty(p.potassium),
      toNumericOrEmpty(p.creatinine),`;

function doReplace(tgt, rep) {
    if (content.includes(tgt.replace(/\n/g, '\r\n'))) {
        content = content.replace(tgt.replace(/\n/g, '\r\n'), rep.replace(/\n/g, '\r\n'));
    } else if (content.includes(tgt)) {
        content = content.replace(tgt, rep);
    } else {
        console.error('Target not found:', tgt);
    }
}

doReplace(targetFormulas, replacementFormulas);
doReplace(targetDesc, replacementDesc);
doReplace(targetFallback, replacementFallback);

fs.writeFileSync(path, content, 'utf8');
console.log('Successfully patched frontend/src/utils/excelReportGenerator.js');

