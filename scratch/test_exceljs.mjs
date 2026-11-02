import ExcelJS from 'exceljs';
import fs from 'fs';

// Quick verification script
async function test() {
  const wb = new ExcelJS.Workbook();
  const ws1 = wb.addWorksheet('Sheet1');
  ws1.addRow(['UHID', 'AF', 'AB', 'BK', 'BL', 'BW', 'BX', 'BY', 'BZ', 'CA', 'CB', 'CD', 'CE', 'CF', 'CG', 'CH', 'CI']);
  ws1.addRow(['MR00010', '120/80', 72, 4.0, 1.3, 1, 1, 1, 0, 1, 0, 
    { formula: "IF(OR('CI Flags'!H2=1,'CI Flags'!I2=1),1,0)", result: 0 },
    { formula: "IF(OR('CI Flags'!I2=1,'CI Flags'!M2=1),1,0)", result: 0 },
    { formula: "IF(OR('CI Flags'!I2=1,'CI Flags'!M2=1,'CI Flags'!O2=1),1,0)", result: 0 },
    { formula: "IF(OR('CI Flags'!J2=1,'CI Flags'!M2=1),1,0)", result: 0 },
    { formula: "IF(OR('CI Flags'!N2=1,'CI Flags'!O2=1),1,0)", result: 0 },
    { formula: "IF(OR('CI Flags'!Q2=1,'CI Flags'!R2=1),1,0)", result: 0 }
  ]);

  const ws2 = wb.addWorksheet('CI Flags');
  ws2.addRow(['UHID', 'Systolic BP', 'Heart rate']);
  ws2.addRow(['MR00010', { formula: 'IFERROR(VALUE(LEFT(Sheet1!B2,FIND("/",Sheet1!B2)-1)),"")', result: 120 }, 72]);

  const buffer = await wb.xlsx.writeBuffer();
  fs.writeFileSync('scratch/test_out.xlsx', Buffer.from(buffer));
  console.log('Workbook created successfully, size:', buffer.length);
}

test();

