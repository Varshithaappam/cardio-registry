const db = require('../config/db');

const patientFields = [
  'mr_no', 'ip_no', 'patient_name', 'date_of_birth', 'gender', 'blood_group',
  'insurance_mode', 'phone_no', 'email', 'hypertension', 'smoking', 'diabetes',
  'diabetes_control_type', 'renal_failure', 'active_dialysis_status', 'address',
  'house_flat_no', 'street_locality', 'village_town', 'mandal', 'district', 'state', 'pincode',
  'higher_education', 'occupation', 'uhid', 'abha_number',
  'patient_status', 'date_of_death', 'merged_into_patient_id'
];

async function createPatient(patientData) {
  const pool = await db.getPool();
  const request = pool.request();

  request.input('mr_no', db.sql.VarChar(10), patientData.mr_no || null);
  request.input('ip_no', db.sql.VarChar(10), patientData.ip_no || null);
  request.input('patient_name', db.sql.NVarChar(150), patientData.patient_name);
  request.input('date_of_birth', db.sql.Date, patientData.date_of_birth);
  request.input('gender', db.sql.NVarChar(6), patientData.gender || 'Unknown');
  request.input('blood_group', db.sql.NVarChar(7), patientData.blood_group || 'Unknown');
  request.input('insurance_mode', db.sql.NVarChar(24), patientData.insurance_mode || 'Unknown');
  request.input('phone_no', db.sql.VarChar(15), patientData.phone_no || null);
  request.input('email', db.sql.VarChar(100), patientData.email || null);
  request.input('hypertension', db.sql.NVarChar(7), patientData.hypertension || 'No');
  request.input('smoking', db.sql.NVarChar(7), patientData.smoking || 'No');
  request.input('diabetes', db.sql.NVarChar(7), patientData.diabetes || 'No');
  request.input('diabetes_control_type', db.sql.NVarChar(26), patientData.diabetes_control_type || 'Unknown');
  request.input('renal_failure', db.sql.NVarChar(7), patientData.renal_failure || 'No');
  request.input('active_dialysis_status', db.sql.NVarChar(14), patientData.active_dialysis_status || 'Unknown');
  request.input('address', db.sql.VarChar(500), patientData.address || null);
  request.input('house_flat_no', db.sql.NVarChar(100), patientData.house_flat_no || null);
  request.input('street_locality', db.sql.NVarChar(255), patientData.street_locality || null);
  request.input('village_town', db.sql.NVarChar(150), patientData.village_town || null);
  request.input('mandal', db.sql.NVarChar(100), patientData.mandal || null);
  request.input('district', db.sql.NVarChar(100), patientData.district || null);
  request.input('state', db.sql.NVarChar(100), patientData.state || null);
  request.input('pincode', db.sql.VarChar(10), patientData.pincode || null);
  request.input('higher_education', db.sql.NVarChar(13), patientData.higher_education || 'None');
  request.input('occupation', db.sql.VarChar(255), patientData.occupation || null);
  request.input('uhid', db.sql.VarChar(50), patientData.uhid || null);
  request.input('abha_number', db.sql.VarChar(50), patientData.abha_number || null);
  request.input('patient_status', db.sql.VarChar(20), patientData.patient_status || 'ACTIVE');
  request.input('date_of_death', db.sql.Date, patientData.date_of_death || null);
  request.input('merged_into_patient_id', db.sql.Int, patientData.merged_into_patient_id || null);
  request.output('NewPatientId', db.sql.Int);

  const res = await request.execute('dbo.usp_RegisterPatient');
  const regPatientId = res.output?.NewPatientId || res.recordset?.[0]?.reg_patient_id;

  return {
    recordset: [{ reg_patient_id: regPatientId }],
    rowsAffected: res.rowsAffected
  };
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
  const pool = await db.getPool();
  const request = pool.request();

  request.input('regPatientId', db.sql.Int, regPatientId);
  request.input('mr_no', db.sql.VarChar(10), patientData.mr_no || null);
  request.input('ip_no', db.sql.VarChar(10), patientData.ip_no || null);
  request.input('patient_name', db.sql.VarChar(150), patientData.patient_name);
  request.input('date_of_birth', db.sql.Date, patientData.date_of_birth);
  request.input('gender', db.sql.NVarChar(6), patientData.gender || 'Unknown');
  request.input('blood_group', db.sql.NVarChar(7), patientData.blood_group || 'Unknown');
  request.input('insurance_mode', db.sql.NVarChar(24), patientData.insurance_mode || 'Unknown');
  request.input('phone_no', db.sql.VarChar(15), patientData.phone_no || null);
  request.input('email', db.sql.VarChar(100), patientData.email || null);
  request.input('hypertension', db.sql.NVarChar(7), patientData.hypertension || 'No');
  request.input('smoking', db.sql.NVarChar(7), patientData.smoking || 'No');
  request.input('diabetes', db.sql.NVarChar(7), patientData.diabetes || 'No');
  request.input('diabetes_control_type', db.sql.NVarChar(26), patientData.diabetes_control_type || 'Unknown');
  request.input('renal_failure', db.sql.NVarChar(7), patientData.renal_failure || 'No');
  request.input('active_dialysis_status', db.sql.NVarChar(14), patientData.active_dialysis_status || 'Unknown');
  request.input('address', db.sql.VarChar(500), patientData.address || null);
  request.input('house_flat_no', db.sql.NVarChar(100), patientData.house_flat_no || null);
  request.input('street_locality', db.sql.NVarChar(255), patientData.street_locality || null);
  request.input('village_town', db.sql.NVarChar(150), patientData.village_town || null);
  request.input('mandal', db.sql.NVarChar(100), patientData.mandal || null);
  request.input('district', db.sql.NVarChar(100), patientData.district || null);
  request.input('state', db.sql.NVarChar(100), patientData.state || null);
  request.input('pincode', db.sql.VarChar(10), patientData.pincode || null);
  request.input('higher_education', db.sql.NVarChar(13), patientData.higher_education || 'None');
  request.input('occupation', db.sql.VarChar(255), patientData.occupation || null);
  request.input('uhid', db.sql.VarChar(50), patientData.uhid || null);
  request.input('abha_number', db.sql.VarChar(50), patientData.abha_number || null);
  request.input('patient_status', db.sql.VarChar(20), patientData.patient_status || 'ACTIVE');
  request.input('date_of_death', db.sql.Date, patientData.date_of_death || null);
  request.input('merged_into_patient_id', db.sql.Int, patientData.merged_into_patient_id || null);

  return request.query(`
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
        [house_flat_no] = @house_flat_no,
        [street_locality] = @street_locality,
        [village_town] = @village_town,
        [mandal] = @mandal,
        [district] = @district,
        [state] = @state,
        [pincode] = @pincode,
        [higher_education] = @higher_education,
        [occupation] = @occupation,
        [uhid] = @uhid,
        [abha_number] = @abha_number,
        [patient_status] = COALESCE(@patient_status, [patient_status]),
        [date_of_death] = @date_of_death,
        [merged_into_patient_id] = @merged_into_patient_id,
        [updated_at] = GETDATE()
    WHERE [reg_patient_id] = @regPatientId;
  `);
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

async function getAllPatientCounts() {
  const result = await db.query(`
    SELECT 
      pd.[reg_patient_id] AS patientId,
      (SELECT COUNT(1) FROM [hf_registry] WITH (NOLOCK) WHERE [reg_patient_id] = pd.[reg_patient_id]) AS hfCount,
      (SELECT COUNT(1) FROM [stemi_registry] WITH (NOLOCK) WHERE [reg_patient_id] = pd.[reg_patient_id]) AS stemiCount,
      (SELECT COUNT(1) FROM [nstemi_registry] WITH (NOLOCK) WHERE [reg_patient_id] = pd.[reg_patient_id]) AS nstemiCount,
      (SELECT COUNT(1) FROM [cabg_registry] WITH (NOLOCK) WHERE [reg_patient_id] = pd.[reg_patient_id]) AS cabgCount
    FROM [patient_demographics] pd WITH (NOLOCK);
  `);

  const countsMap = {};
  (result.recordset || []).forEach(row => {
    countsMap[row.patientId] = {
      hfCount: row.hfCount || 0,
      stemiCount: row.stemiCount || 0,
      nstemiCount: row.nstemiCount || 0,
      cabgCount: row.cabgCount || 0
    };
  });
  return countsMap;
}

module.exports = {
  createPatient,
  updatePatientNumbers,
  getAllPatients,
  getPatientById,
  updatePatient,
  deletePatient,
  getPatientCounts,
  getAllPatientCounts
};
