const fs = require('fs');

const path = 'backend/services/hfExportService.js';
let content = fs.readFileSync(path, 'utf8');

// 1. Update isYes function
const oldIsYes = `function isYes(val) {
  if (val === null || val === undefined) return false;
  const s = String(val).trim().toLowerCase();
  return s === 'yes' || s === '1' || s === 'true';
}`;

const newIsYes = `function isYes(val) {
  if (val === null || val === undefined) return false;
  if (Array.isArray(val)) {
    return val.some(v => isYes(v));
  }
  const s = String(val).trim().toLowerCase();
  return s === 'yes' || s === '1' || s === 'true';
}`;

// 2. Update formatReasonsForAdmissions
const oldRenalCheck = `  if (isYes(row.renal_failure)) reasons.push('Renal failure');`;
const newRenalCheck = `  if (isYes(row.precipitating_renal_failure !== undefined ? row.precipitating_renal_failure : row.renal_failure)) reasons.push('Renal failure');`;

// 3. Update SELECT query to alias ha.renal_failure
const oldSelect = `      ha.infection,\r\n      ha.renal_failure,\r\n      ha.anaemia,`;
const oldSelectLF = `      ha.infection,\n      ha.renal_failure,\n      ha.anaemia,`;

const newSelectLF = `      ha.infection,\n      ha.renal_failure AS precipitating_renal_failure,\n      ha.anaemia,`;
const newSelectCRLF = `      ha.infection,\r\n      ha.renal_failure AS precipitating_renal_failure,\r\n      ha.anaemia,`;

if (content.includes(oldSelect)) {
    content = content.replace(oldSelect, newSelectCRLF);
} else if (content.includes(oldSelectLF)) {
    content = content.replace(oldSelectLF, newSelectLF);
} else {
    console.error('Could not find select statement');
}

// Replace isYes
content = content.replace(oldIsYes.replace(/\r?\n/g, '\r\n'), newIsYes.replace(/\r?\n/g, '\r\n'));
if (!content.includes('Array.isArray(val)')) {
    content = content.replace(oldIsYes.replace(/\r?\n/g, '\n'), newIsYes.replace(/\r?\n/g, '\n'));
}

// Replace renal check
content = content.replace(oldRenalCheck, newRenalCheck);

fs.writeFileSync(path, content, 'utf8');
console.log('Successfully updated backend/services/hfExportService.js');

