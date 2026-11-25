const { getPatientsCohort } = require('../backend/services/gdmtService');
const { getStemiCohortFromDb, getNstemiCohortFromDb } = require('../backend/services/acsService');

(async () => {
  try {
    const hf = await getPatientsCohort();
    console.log('HF count:', hf?.length);
    if (hf && hf.length > 0) {
      console.log('HF sample admissionDate:', hf[0].admissionDate, 'visitDate:', hf[0].visitDate);
      console.log('HF non-null admissionDate count:', hf.filter(p => p.admissionDate || p.visitDate || p.admission_date).length);
      console.log('HF sample dates across 5 records:', hf.slice(0, 5).map(p => ({
        id: p.regPatientId || p.reg_patient_id,
        admissionDate: p.admissionDate,
        visitDate: p.visitDate
      })));
    }

    const stemi = await getStemiCohortFromDb();
    console.log('STEMI count:', stemi?.length);
    if (stemi && stemi.length > 0) {
      console.log('STEMI sample keys:', Object.keys(stemi[0]));
      console.log('STEMI sample dates:', {
        admission_date: stemi[0].admission_date,
        admissionDate: stemi[0].admissionDate,
        date_of_admission: stemi[0].date_of_admission,
        created_at: stemi[0].created_at
      });
      console.log('STEMI sample dates across 5 records:', stemi.slice(0, 5).map(p => ({
        id: p.reg_patient_id || p.regPatientId,
        admission_date: p.admission_date,
        admissionDate: p.admissionDate,
        created_at: p.created_at
      })));
    }

    const nstemi = await getNstemiCohortFromDb();
    console.log('NSTEMI count:', nstemi?.length);
    if (nstemi && nstemi.length > 0) {
      console.log('NSTEMI sample dates across 5 records:', nstemi.slice(0, 5).map(p => ({
        id: p.reg_patient_id || p.regPatientId,
        admission_date: p.admission_date,
        admissionDate: p.admissionDate,
        created_at: p.created_at
      })));
    }

    process.exit(0);
  } catch(e) {
    console.error(e);
    process.exit(1);
  }
})();
