async function checkCohort() {
  try {
    const res = await fetch('http://localhost:5000/api/patients/gdmt-cohort?source=database');
    const json = await res.json();
    console.log('Success:', json.success, 'Total records:', json.data ? json.data.length : 0);
    const cohort = json.data;
    if (cohort) {
      const fsCount = {};
      cohort.forEach(p => {
        const fs = p.functionalStatus;
        fsCount[fs] = (fsCount[fs] || 0) + 1;
      });
      console.log('functionalStatus in gdmt cohort:', fsCount);

      const efs = cohort.map(p => Number(p.efPercent)).filter(n => !isNaN(n) && n > 0);
      const avgEf = efs.reduce((a, b) => a + b, 0) / efs.length;
      console.log('Average EF from gdmt cohort:', avgEf, 'count:', efs.length);

      const nyha4Patients = cohort.filter(p => String(p.functionalStatus || '').includes('IV'));
      console.log('NYHA IV patients in cohort:', nyha4Patients.map(p => ({ hfId: p.hfId, uhid: p.uhid, fs: p.functionalStatus, ef: p.efPercent })));

      // Now let's fetch hf-export-sheet1 and compare!
      const sheet1Res = await fetch('http://localhost:5000/api/patients/hf-export-sheet1');
      const sheet1Data = await sheet1Res.json();
      const allowedHfIds = new Set(cohort.map(p => Number(p.hfId)).filter(Boolean));
      const allowedUhids = new Set(cohort.map(p => String(p.uhid || '').trim().toUpperCase()).filter(Boolean));
      
      const filteredSheet1Rows = sheet1Data.rows.filter(rowVals => {
        const rawHf = String(rowVals[4] || '').replace(/\D/g, '');
        const parsedHfId = rawHf ? parseInt(rawHf, 10) : null;
        if (parsedHfId && allowedHfIds.has(parsedHfId)) return true;
        const rowUhid = String(rowVals[1] || '').trim().toUpperCase();
        if (rowUhid && allowedUhids.has(rowUhid)) return true;
        return false;
      });

      console.log('Filtered sheet1 rows count:', filteredSheet1Rows.length);
      const fsSheet1Idx = sheet1Data.headers.indexOf('Functional Status');
      const efSheet1Idx = sheet1Data.headers.indexOf('EF%');
      console.log('fsSheet1Idx:', fsSheet1Idx, 'efSheet1Idx:', efSheet1Idx);

      const sheet1FsCount = {};
      filteredSheet1Rows.forEach(r => {
        const val = r[fsSheet1Idx];
        sheet1FsCount[val] = (sheet1FsCount[val] || 0) + 1;
      });
      console.log('Sheet1 Functional Status count for cohort:', sheet1FsCount);

      const sheet1Efs = filteredSheet1Rows.map(r => Number(r[efSheet1Idx])).filter(n => !isNaN(n) && n > 0);
      const avgSheet1Ef = sheet1Efs.reduce((a, b) => a + b, 0) / sheet1Efs.length;
      console.log('Average Sheet1 EF for cohort:', avgSheet1Ef, 'count:', sheet1Efs.length);

      // Let's find which patients in cohort have NYHA IV vs what is in filteredSheet1Rows!
      nyha4Patients.forEach(p => {
        const matchRow = filteredSheet1Rows.find(r => {
          const rawHf = String(r[4] || '').replace(/\D/g, '');
          return Number(rawHf) === Number(p.hfId) || String(r[1]).trim().toUpperCase() === String(p.uhid).trim().toUpperCase();
        });
        if (matchRow) {
          console.log(`Cohort patient hfId ${p.hfId} uhid ${p.uhid}: cohort fs="${p.functionalStatus}", sheet1 fs="${matchRow[fsSheet1Idx]}"`);
        } else {
          console.log(`Cohort patient hfId ${p.hfId} uhid ${p.uhid}: NOT FOUND in filteredSheet1Rows!`);
        }
      });
    }
  } catch (err) {
    console.error('Error:', err.message);
  }
}
checkCohort();
