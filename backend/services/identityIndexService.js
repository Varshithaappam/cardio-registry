const db = require('../config/db');
const {
  normalizeName,
  getPhonetic,
  getSoundex,
  normalizePhone,
  normalizeEmail,
  normalizeIdentifier,
  extractPincode,
  normalizeAddress,
  sha256
} = require('./normalizationService');

/**
 * Indexes or updates a single patient into patient_identity_index
 */
async function indexPatient(regPatientId, patientData, externalTransaction = null) {
  if (!regPatientId) return;

  const pool = await db.getPool();
  const request = externalTransaction ? new db.sql.Request(externalTransaction) : pool.request();

  const name = patientData.patient_name || patientData.full_name || patientData.name || '';
  const normalized_name = normalizeName(name);
  const name_phonetic = getPhonetic(name);
  const name_soundex = getSoundex(name);

  const phone = patientData.phone_no || patientData.phone || patientData.contact_phone || '';
  const normalized_phone = normalizePhone(phone);
  const phone_hash = sha256(normalized_phone) || '0'.repeat(64);

  const email = patientData.email || patientData.email_id || patientData.email_address || null;
  const normalized_email = normalizeEmail(email);
  const email_hash = sha256(normalized_email);

  const uhid = patientData.uhid || null;
  const normalized_uhid = normalizeIdentifier(uhid);
  const uhid_hash = sha256(normalized_uhid);

  const abha = patientData.abha_number || patientData.abha || null;
  const normalized_abha = normalizeIdentifier(abha);
  const abha_hash = sha256(normalized_abha);

  const rawDob = patientData.date_of_birth || patientData.dob;
  let date_of_birth = null;
  let dob_year = 1900;
  if (rawDob) {
    const d = new Date(rawDob);
    if (!isNaN(d.getTime())) {
      date_of_birth = d.toISOString().split('T')[0];
      dob_year = d.getFullYear();
    }
  }

  const gender = patientData.gender || 'Unknown';
  const explicitPincode = patientData.pincode || null;
  const address = patientData.address || '';
  const pincode = extractPincode(address, explicitPincode);
  const normalized_address = normalizeAddress(address, {
    house_flat_no: patientData.house_flat_no,
    street_locality: patientData.street_locality,
    village_town: patientData.village_town,
    mandal: patientData.mandal,
    district: patientData.district,
    state: patientData.state,
    pincode: pincode
  });
  const district = patientData.district || null;

  request.input('regPatientId', db.sql.Int, regPatientId);
  request.input('normName', db.sql.NVarChar(250), normalized_name);
  request.input('namePhonetic', db.sql.VarChar(50), name_phonetic);
  request.input('normPhone', db.sql.VarChar(30), normalized_phone);
  request.input('phoneHash', db.sql.Char(64), phone_hash);
  request.input('normEmail', db.sql.VarChar(320), normalized_email);
  request.input('emailHash', db.sql.Char(64), email_hash);
  request.input('normUhid', db.sql.VarChar(100), normalized_uhid);
  request.input('uhidHash', db.sql.Char(64), uhid_hash);
  request.input('normAbha', db.sql.VarChar(50), normalized_abha);
  request.input('abhaHash', db.sql.Char(64), abha_hash);
  request.input('dob', db.sql.Date, date_of_birth);
  request.input('dobYear', db.sql.SmallInt, dob_year);
  request.input('gender', db.sql.NVarChar(30), gender);
  request.input('pincode', db.sql.VarChar(10), pincode);
  request.input('normAddress', db.sql.NVarChar(500), normalized_address);
  request.input('district', db.sql.NVarChar(100), district);

  await request.query(`
    IF EXISTS (SELECT 1 FROM [patient_identity_index] WHERE [reg_patient_id] = @regPatientId)
    BEGIN
      UPDATE [patient_identity_index]
      SET
        [normalized_name] = @normName,
        [name_phonetic] = @namePhonetic,
        [normalized_phone] = @normPhone,
        [phone_hash] = @phoneHash,
        [normalized_email] = @normEmail,
        [email_hash] = @emailHash,
        [normalized_uhid] = @normUhid,
        [uhid_hash] = @uhidHash,
        [normalized_abha] = @normAbha,
        [abha_hash] = @abhaHash,
        [date_of_birth] = @dob,
        [dob_year] = @dobYear,
        [gender] = @gender,
        [pincode] = @pincode,
        [normalized_address] = @normAddress,
        [district] = @district,
        [updated_at] = GETDATE()
      WHERE [reg_patient_id] = @regPatientId;
    END
    ELSE
    BEGIN
      INSERT INTO [patient_identity_index] (
        [reg_patient_id],
        [normalized_name],
        [name_phonetic],
        [normalized_phone],
        [phone_hash],
        [normalized_email],
        [email_hash],
        [normalized_uhid],
        [uhid_hash],
        [normalized_abha],
        [abha_hash],
        [date_of_birth],
        [dob_year],
        [gender],
        [pincode],
        [normalized_address],
        [district],
        [created_at],
        [updated_at]
      ) VALUES (
        @regPatientId,
        @normName,
        @namePhonetic,
        @normPhone,
        @phoneHash,
        @normEmail,
        @emailHash,
        @normUhid,
        @uhidHash,
        @normAbha,
        @abhaHash,
        @dob,
        @dobYear,
        @gender,
        @pincode,
        @normAddress,
        @district,
        GETDATE(),
        GETDATE()
      );
    END
  `);
}

/**
 * Removes a patient from patient_identity_index
 */
async function deleteIndex(regPatientId, externalTransaction = null) {
  if (!regPatientId) return;
  const pool = await db.getPool();
  const request = externalTransaction ? new db.sql.Request(externalTransaction) : pool.request();
  request.input('regPatientId', db.sql.Int, regPatientId);
  await request.query('DELETE FROM [patient_identity_index] WHERE [reg_patient_id] = @regPatientId;');
}

/**
 * Backfills all existing patient records into patient_identity_index
 */
async function backfillAllPatients() {
  const pool = await db.getPool();
  const res = await pool.request().query(`
    SELECT 
      reg_patient_id,
      patient_name,
      date_of_birth,
      gender,
      phone_no,
      email,
      address,
      uhid,
      abha_number,
      house_flat_no,
      street_locality,
      village_town,
      mandal,
      district,
      state,
      pincode
    FROM patient_demographics;
  `);

  console.log(`Backfilling ${res.recordset.length} patients into patient_identity_index...`);
  for (const patient of res.recordset) {
    await indexPatient(patient.reg_patient_id, patient);
  }
  console.log('✓ Backfill completed.');
}

module.exports = {
  indexPatient,
  deleteIndex,
  backfillAllPatients
};
