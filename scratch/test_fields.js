const { getPatientsCohort } = require('../backend/services/gdmtService');
const { getStemiCohortFromDb, getNstemiCohortFromDb } = require('../backend/services/acsService');

(async () => {
  const hf = await getPatientsCohort();
  const stemi = await getStemiCohortFromDb();
  const nstemi = await getNstemiCohortFromDb();

  console.log('HF death fields sample:', hf.slice(0, 3).map(p => ({
    death: p.death,
    is_death: p.is_death,
    death_hospital: p.death_hospital,
    in_hospital_death: p.in_hospital_death,
    gender: p.gender,
    age: p.age,
    consultant: p.primaryConsultant || p.primary_consultant || p.consultant_name || p.treatingCardiologist,
    payment: p.insuranceMode || p.paymentMode || p.insurance_mode
  })));

  console.log('STEMI fields sample:', stemi.slice(0, 3).map(p => ({
    death: p.death,
    gender: p.gender,
    age: p.age,
    consultant: p.primaryConsultant || p.primary_consultant || p.consultant_name,
    payment: p.insuranceMode || p.paymentMode || p.insurance_mode
  })));

  console.log('NSTEMI fields sample:', nstemi.slice(0, 3).map(p => ({
    death: p.death,
    gender: p.gender,
    age: p.age,
    consultant: p.primaryConsultant || p.primary_consultant || p.consultant_name,
    payment: p.insuranceMode || p.paymentMode || p.insurance_mode
  })));

  process.exit(0);
})();
