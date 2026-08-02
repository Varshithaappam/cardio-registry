const db = require('../config/db');

const patientFields = [
  'mr_no', 'ip_no', 'patient_name', 'date_of_birth', 'gender', 'blood_group',
  'insurance_mode', 'phone_no', 'email', 'hypertension', 'smoking', 'diabetes',
  'diabetes_control_type', 'renal_failure', 'active_dialysis_status', 'address',
  'higher_education', 'occupation'
];

function patientParameters(patientData, includeNumbers = true) {
  const fields = includeNumbers ? patientFields : patientFields.filter((field) => field !== 'mr_no' && field !== 'ip_no');
  return Object.fromEntries(fields.map((field) => [
    field,
    patientData[field] === undefined ? null : patientData[field]
  ]));
}

async function createPatient(patientData) {
  return db.insert(null, 'patients', patientParameters(patientData), 'patient_id');
}

async function updatePatientNumbers(patientId, mr_no, ip_no) {
  return db.query(
    'UPDATE [patients] SET [mr_no] = @mr_no, [ip_no] = @ip_no WHERE [patient_id] = @patientId;',
    { patientId, mr_no, ip_no }
  );
}

async function getAllPatients() {
  const result = await db.query('SELECT * FROM [patients] ORDER BY [patient_id] DESC;');
  return result.recordset;
}

async function getPatientById(patientId) {
  const result = await db.query('SELECT * FROM [patients] WHERE [patient_id] = @patientId;', { patientId });
  return result.recordset[0];
}

async function updatePatient(patientId, patientData) {
  const parameters = { patientId, ...patientParameters(patientData, false) };
  return db.query(`
    UPDATE [patients]
    SET [patient_name] = @patient_name,
        [date_of_birth] = @date_of_birth,
        [gender] = @gender,
        [blood_group] = @blood_group,
        [insurance_mode] = @insurance_mode,
        [phone_no] = @phone_no,
        [email] = @email,
        [hypertension] = @hypertension,
        [smoking] = @smoking,
        [diabetes] = @diabetes,
        [diabetes_control_type] = @diabetes_control_type,
        [renal_failure] = @renal_failure,
        [active_dialysis_status] = @active_dialysis_status,
        [address] = @address,
        [higher_education] = @higher_education,
        [occupation] = @occupation
    WHERE [patient_id] = @patientId;
  `, parameters);
}

async function deletePatient(patientId) {
  return db.query('DELETE FROM [patients] WHERE [patient_id] = @patientId;', { patientId });
}

async function getPatientCounts(patientId) {
  const result = await db.query(`
    SELECT
      (SELECT COUNT(*) FROM [hf_registry] WHERE [patient_id] = @patientId) AS hfCount,
      (SELECT COUNT(*) FROM [stemi_registry] WHERE [patient_id] = @patientId) AS stemiCount,
      (SELECT COUNT(*) FROM [nstemi_registry] WHERE [patient_id] = @patientId) AS nstemiCount,
      (SELECT COUNT(*) FROM [cabg_registry] WHERE [patient_id] = @patientId) AS cabgCount;
  `, { patientId });
  return result.recordset[0];
}

module.exports = {
  createPatient,
  updatePatientNumbers,
  getAllPatients,
  getPatientById,
  updatePatient,
  deletePatient,
  getPatientCounts
};
