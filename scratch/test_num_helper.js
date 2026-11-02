const { getHfSheet1ExportData } = require('../backend/services/hfExportService');

function toNumericOrEmpty(val) {
  if (val === null || val === undefined) return '';
  const s = String(val).trim();
  if (s === '') return '';
  const num = Number(s);
  return !isNaN(num) ? num : s;
}

console.log('Test "4.2":', toNumericOrEmpty("4.2"), typeof toNumericOrEmpty("4.2"));
console.log('Test "0.9":', toNumericOrEmpty("0.9"), typeof toNumericOrEmpty("0.9"));
console.log('Test null:', toNumericOrEmpty(null));
console.log('Test "":', toNumericOrEmpty(""));

