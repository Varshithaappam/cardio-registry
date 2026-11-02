async function test() {
  const res = await fetch('http://localhost:5000/api/patients/hf-export-sheet1');
  const { headers, rows } = await res.json();
  
  const admission2Idx = headers.findIndex(h => /reasons for admission\s*2/i.test(h));
  console.log('admission2Idx:', admission2Idx);
  if (admission2Idx !== -1) {
    headers.splice(admission2Idx, 1);
  }

  headers.forEach((h, idx) => {
    let letter = '';
    let temp = idx;
    while (temp >= 0) {
      letter = String.fromCharCode((temp % 26) + 65) + letter;
      temp = Math.floor(temp / 26) - 1;
    }
    console.log(`${idx} -> ${letter}: ${h}`);
  });
}
test();

