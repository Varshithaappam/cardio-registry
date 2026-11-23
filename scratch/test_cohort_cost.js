const { getStemiCohortFromDb, getNstemiCohortFromDb } = require('../backend/services/acsService');

async function run() {
  const stemi = await getStemiCohortFromDb();
  const nstemi = await getNstemiCohortFromDb();

  console.log('STEMI cohort length:', stemi.length);
  console.log('NSTEMI cohort length:', nstemi.length);

  let stemiSum = 0;
  let stemiCount = 0;
  stemi.forEach(p => {
    const cost = Number(p.totalCost ?? p.total_cost ?? 0);
    if (cost > 0) {
      stemiSum += cost;
      stemiCount++;
    }
  });

  let nstemiSum = 0;
  let nstemiCount = 0;
  nstemi.forEach(p => {
    const cost = Number(p.totalCost ?? p.total_cost ?? 0);
    if (cost > 0) {
      nstemiSum += cost;
      nstemiCount++;
    }
  });

  console.log(`STEMI: count=${stemiCount}, sum=${stemiSum}`);
  console.log(`NSTEMI: count=${nstemiCount}, sum=${nstemiSum}`);
  console.log(`Combined: sum=${stemiSum + nstemiSum}`);

  process.exit(0);
}

run().catch(e => { console.error(e); process.exit(1); });
