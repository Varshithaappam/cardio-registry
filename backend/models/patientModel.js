const db = require('../config/db');

const patientFields = [
  'mr_no', 'ip_no', 'patient_name', 'date_of_birth', 'gender', 'blood_group',
  'insurance_mode', 'phone_no', 'email', 'hypertension', 'smoking', 'diabetes',
  'diabetes_control_type', 'renal_failure', 'active_dialysis_status', 'address',
  'higher_education', 'occupation', 'uhid', 'abha_number'
];

function patientParameters(patientData, includeNumbers = true) {
  const fields = includeNumbers ? patientFields : patientFields.filter((field) => field !== 'mr_no' && field !== 'ip_no');
  return Object.fromEntries(fields.map((field) => [
    field,
    patientData[field] === undefined ? null : patientData[field]
  ]));
}

async function createPatient(patientData) {
  return db.insert(null, 'patient_demographics', patientParameters(patientData), 'reg_patient_id');
}

async function updatePatientNumbers(regPatientId, mr_no, ip_no) {
  return db.query(
    'UPDATE [patient_demographics] SET [mr_no] = @mr_no, [ip_no] = @ip_no WHERE [reg_patient_id] = @regPatientId;',
    { regPatientId, mr_no, ip_no }
  );
}

async function getAllPatients() {
  const result = await db.query('SELECT * FROM [patient_demographics] ORDER BY [reg_patient_id] DESC;');
  return result.recordset;
}

async function getPatientById(regPatientId) {
  const result = await db.query('SELECT * FROM [patient_demographics] WHERE [reg_patient_id] = @regPatientId;', { regPatientId });
  return result.recordset[0];
}

async function updatePatient(regPatientId, patientData) {
  const parameters = { regPatientId, ...patientParameters(patientData, true) };
  return db.query(`
    UPDATE [patient_demographics]
    SET [mr_no] = COALESCE(@mr_no, [mr_no]),
        [patient_name] = @patient_name,
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
        [occupation] = @occupation,
        [uhid] = @uhid,
        [abha_number] = @abha_number
    WHERE [reg_patient_id] = @regPatientId;
  `, parameters);
}

async function deletePatient(regPatientId) {
  return db.query('DELETE FROM [patient_demographics] WHERE [reg_patient_id] = @regPatientId;', { regPatientId });
}

async function getPatientCounts(regPatientId) {
  const result = await db.query(`
    SELECT
      (SELECT COUNT(*) FROM [hf_registry] WHERE [reg_patient_id] = @regPatientId) AS hfCount,
      (SELECT COUNT(*) FROM [stemi_registry] WHERE [reg_patient_id] = @regPatientId) AS stemiCount,
      (SELECT COUNT(*) FROM [nstemi_registry] WHERE [reg_patient_id] = @regPatientId) AS nstemiCount,
      (SELECT COUNT(*) FROM [cabg_registry] WHERE [reg_patient_id] = @regPatientId) AS cabgCount;
  `, { regPatientId });
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
