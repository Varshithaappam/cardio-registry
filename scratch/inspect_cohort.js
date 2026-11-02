async function test() {
  try {
    const res = await fetch('http://localhost:5000/api/patients/hf-export-sheet1');
    const { headers, rows } = await res.json();
    console.log('Total rows:', rows.length);
    console.log('Total headers:', headers.length);
    
    // Find index of Functional Status, EF%, etc.
    const fsIdx = headers.indexOf('Functional Status');
    const efIdx = headers.indexOf('EF%');
    console.log('Functional Status header index:', fsIdx);
    console.log('EF% header index:', efIdx);

    // Let's check headers around 40-50
    headers.forEach((h, idx) => {
      let letter = '';
      let temp = idx;
      while (temp >= 0) {
        letter = String.fromCharCode((temp % 26) + 65) + letter;
        temp = Math.floor(temp / 26) - 1;
      }
      if ((idx >= 40 && idx <= 55) || (idx >= 58 && idx <= 65)) {
        console.log(`${idx}: ${letter} -> ${h}`);
      }
    });

    // Check count of NYHA in rows
    const counts = {};
    rows.forEach(r => {
      const val = r[fsIdx];
      counts[val] = (counts[val] || 0) + 1;
    });
    console.log('NYHA distribution in Sheet1 export:', counts);

    // Let's also check ef values
    const efs = rows.map(r => Number(r[efIdx])).filter(n => !isNaN(n) && n > 0);
    const avgEf = efs.reduce((a, b) => a + b, 0) / efs.length;
    console.log('Average EF from Sheet1:', avgEf, 'count:', efs.length);

  } catch (err) {
    console.error('Error:', err.message);
  }
}

test();
