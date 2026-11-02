async function test() {
  const cRes = await fetch('http://localhost:5000/api/patients/gdmt-cohort?source=database');
  const cJson = await cRes.json();
  const cohort = cJson.data;

  const sRes = await fetch('http://localhost:5000/api/patients/hf-export-sheet1');
  const sJson = await sRes.json();
  const fsIdx = sJson.headers.indexOf('Functional Status');

  console.log('Comparing cohort vs sheet1 for all patients:');
  let diffCount = 0;
  cohort.forEach(p => {
    // find matching sheet1 row by HF ID
    const sRow = sJson.rows.find(r => {
      const rawHf = String(r[4] || '').replace(/\D/g, '');
      return Number(rawHf) === Number(p.hfId);
    });
    if (sRow) {
      const cFs = p.functionalStatus || '';
      const sFs = sRow[fsIdx] || '';
      if (cFs.toUpperCase() !== sFs.toUpperCase()) {
        diffCount++;
        console.log(`hfId ${p.hfId}: cohort="${cFs}", sheet1="${sFs}"`);
      }
    }
  });
  console.log('Total differences:', diffCount);
}

test();

