const { getPatientsCohort } = require('../backend/services/gdmtService');
const { getStemiCohortFromDb, getNstemiCohortFromDb } = require('../backend/services/acsService');

(async () => {
  const hf = await getPatientsCohort();
  const stemi = await getStemiCohortFromDb();
  const nstemi = await getNstemiCohortFromDb();

  const getDate = (r) => {
    return r.admissionDate || r.admission_date || r.date_of_admission || r.visitDate || r.visit_date || r.presentationDate || r.presentation_date || r.created_at || r.createdAt || r.assessmentDate || r.assessment_date;
  };

  const allDates = [...hf, ...stemi, ...nstemi].map(getDate).filter(Boolean).map(d => typeof d === 'string' ? d.slice(0, 10) : new Date(d).toISOString().slice(0, 10));

  allDates.sort();
  console.log('Earliest date in DB:', allDates[0]);
  console.log('Latest date in DB:', allDates[allDates.length - 1]);

  // Group by year-month
  const months = {};
  allDates.forEach(d => {
    const ym = d.slice(0, 7);
    months[ym] = (months[ym] || 0) + 1;
  });
  console.log('Records per month:', months);

  process.exit(0);
})();
