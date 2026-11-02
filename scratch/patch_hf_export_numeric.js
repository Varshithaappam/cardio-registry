const fs = require('fs');

const path = 'backend/services/hfExportService.js';
let content = fs.readFileSync(path, 'utf8');

// 1. Add toNumericOrEmpty helper
const helperCode = `function toNumericOrEmpty(val) {
  if (val === null || val === undefined) return '';
  const s = String(val).trim();
  if (s === '') return '';
  const num = Number(s);
  return !isNaN(num) ? num : s;
}

`;

if (!content.includes('function toNumericOrEmpty')) {
    content = content.replace('function formatDate(d) {', helperCode + 'function formatDate(d) {');
}

// 2. Wrap lab results in toNumericOrEmpty
const oldLabs = `      row.potassium_result || '',                    // 64. Lab tests Potassium
      row.creatinine_result || '',                   // 65. Creatinine
      row.hb_result || '',                           // 66. Hb
      row.bnp_result || '',                          // 67. BNP
      row.sodium_result || '',                       // 68. Sodium`;

const newLabs = `      toNumericOrEmpty(row.potassium_result),         // 64. Lab tests Potassium
      toNumericOrEmpty(row.creatinine_result),        // 65. Creatinine
      toNumericOrEmpty(row.hb_result),                // 66. Hb
      toNumericOrEmpty(row.bnp_result),               // 67. BNP
      toNumericOrEmpty(row.sodium_result),            // 68. Sodium`;

if (content.includes(oldLabs.replace(/\n/g, '\r\n'))) {
    content = content.replace(oldLabs.replace(/\n/g, '\r\n'), newLabs.replace(/\n/g, '\r\n'));
} else if (content.includes(oldLabs)) {
    content = content.replace(oldLabs, newLabs);
} else {
    console.error('Could not find oldLabs');
}

fs.writeFileSync(path, content, 'utf8');
console.log('Updated backend/services/hfExportService.js with toNumericOrEmpty');

