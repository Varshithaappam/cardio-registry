const fs = require('fs');
const path = 'c:/Users/ADMIN/Desktop/projects/cardio-registry/backend/services/hfExportService.js';
let content = fs.readFileSync(path, 'utf8');

const oldBlock = `    // Functional Status (HF form clinical label: NYHA Class I-IV)
    const functionalStatusVal = evaluatePositiveLabel(row, [
      'nyha_class_1',
      'nyha_class_2',
      'nyha_class_3',
      'nyha_class_4'
    ]);`;

const newBlock = `    // Functional Status (HF form clinical label: NYHA Class I-IV, ordered highest severity first)
    const functionalStatusVal = evaluatePositiveLabel(row, [
      'nyha_class_4',
      'nyha_class_3',
      'nyha_class_2',
      'nyha_class_1'
    ]);`;

if (content.includes(oldBlock)) {
  content = content.replace(oldBlock, newBlock);
  fs.writeFileSync(path, content, 'utf8');
  console.log('Replaced successfully (LF)!');
} else {
  const oldBlockCRLF = oldBlock.replace(/\n/g, '\r\n');
  const newBlockCRLF = newBlock.replace(/\n/g, '\r\n');
  if (content.includes(oldBlockCRLF)) {
    content = content.replace(oldBlockCRLF, newBlockCRLF);
    fs.writeFileSync(path, content, 'utf8');
    console.log('Replaced successfully (CRLF)!');
  } else {
    console.error('Target not found!');
  }
}

