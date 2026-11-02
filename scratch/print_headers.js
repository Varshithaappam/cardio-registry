const hfExportService = require('../backend/services/hfExportService');

function toExcelCol(i) {
  let col = '';
  let temp = i;
  while (temp >= 0) {
    col = String.fromCharCode((temp % 26) + 65) + col;
    temp = Math.floor(temp / 26) - 1;
  }
  return col;
}

hfExportService.getHfSheet1ExportData().then(res => {
  // Remember frontend modifies headers:
  // const admission2Idx = headers.findIndex(h => /reasons for admission\s*2/i.test(h));
  // const admission3Idx = headers.findIndex(h => /reasons for admission\s*3/i.test(h));
  // if (admission3Idx !== -1) headers[admission3Idx] = 'admission type';
  // if (admission2Idx !== -1) headers.splice(admission2Idx, 1);
  const headers = [...res.headers];
  const admission2Idx = headers.findIndex(h => /reasons for admission\s*2/i.test(h));
  const admission3Idx = headers.findIndex(h => /reasons for admission\s*3/i.test(h));
  if (admission3Idx !== -1) headers[admission3Idx] = 'admission type';
  if (admission2Idx !== -1) headers.splice(admission2Idx, 1);

  headers.forEach((h, i) => {
    console.log(toExcelCol(i) + ' (' + (i + 1) + '): ' + h);
  });
  process.exit(0);
}).catch(console.error);
