const { getPatientsCohort } = require('../backend/services/gdmtService');
const { getStemiCohortFromDb, getNstemiCohortFromDb } = require('../backend/services/acsService');

(async () => {
  const hf = await getPatientsCohort();
  const stemi = await getStemiCohortFromDb();
  const nstemi = await getNstemiCohortFromDb();

  const getDate = (r) => {
    return r.admissionDate || r.admission_date || r.date_of_admission || r.visitDate || r.visit_date || r.presentationDate || r.presentation_date || r.created_at || r.createdAt || r.assessmentDate || r.assessment_date;
  };

  const startDate = new Date('2026-08-27T00:00:00');
  const endDate = new Date('2026-11-25T23:59:59');

  const filter = (cohort) => cohort.filter(r => {
    const raw = getDate(r);
    if (!raw) return false;
    const d = new Date(raw);
    if (isNaN(d.getTime())) return false;
    return d >= startDate && d <= endDate;
  });

  const hfFiltered = filter(hf);
  const stemiFiltered = filter(stemi);
  const nstemiFiltered = filter(nstemi);

  console.log(`With Date range 2026-08-27 to 2026-11-25:`);
  console.log(`HF: ${hfFiltered.length} / ${hf.length}`);
  console.log(`STEMI: ${stemiFiltered.length} / ${stemi.length}`);
  console.log(`NSTEMI: ${nstemiFiltered.length} / ${nstemi.length}`);
  console.log(`Total: ${hfFiltered.length + stemiFiltered.length + nstemiFiltered.length} / ${hf.length + stemi.length + nstemi.length}`);

  // Let's print dates of records that didn't match
  console.log('Sample HF dates:', hf.slice(0, 10).map(getDate));
  console.log('Sample STEMI dates:', stemi.slice(0, 10).map(getDate));
  console.log('Sample NSTEMI dates:', nstemi.slice(0, 10).map(getDate));

  process.exit(0);
})();
