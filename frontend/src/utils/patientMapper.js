const emptyArray = () => [];

const DIABETES_CONTROL_TO_UI = {
  "None (Uncontrolled)": "None",
  "Dietary Control Only": "Diet",
  "Oral Hypoglycemics (OHA)": "Oral",
  "Insulin Therapy": "Insulin",
  Unknown: "Unknown"
};

const DIABETES_CONTROL_TO_DB = {
  None: "None (Uncontrolled)",
  Diet: "Dietary Control Only",
  Oral: "Oral Hypoglycemics (OHA)",
  Insulin: "Insulin Therapy",
  Unknown: "Unknown"
};

const DIALYSIS_TO_UI = {
  "Under Dialysis": "Yes",
  "No Dialysis": "No",
  Unknown: "No"
};

const DIALYSIS_TO_DB = {
  Yes: "Under Dialysis",
  No: "No Dialysis",
  Unknown: "Unknown"
};

export function mapDiabetesControlToDb(value) {
  return DIABETES_CONTROL_TO_DB[value] || value || "Unknown";
}

export function mapDiabetesControlToUi(value) {
  return DIABETES_CONTROL_TO_UI[value] || value || "None";
}

export function mapDialysisStatusToDb(value) {
  return DIALYSIS_TO_DB[value] || value || "Unknown";
}

export function mapDialysisStatusToUi(value) {
  return DIALYSIS_TO_UI[value] || value || "No";
}

export function buildPatientPayload({
  name,
  dob,
  gender,
  mrNo,
  ipNo,
  bloodGroup,
  insuranceMode,
  phone,
  email,
  hypertension,
  smoking,
  diabetes,
  diabetesControl,
  renalFailure,
  dialysisStatus,
  address,
  higherEducation,
  occupation,
  uhid,
  abhaNumber
}) {
  return {
    mr_no: mrNo ? String(mrNo).trim() : null,
    ip_no: ipNo ? String(ipNo).trim() : null,
    patient_name: name,
    date_of_birth: dob,
    gender,
    blood_group: bloodGroup,
    insurance_mode: insuranceMode || "Unknown",
    phone_no: phone,
    email,
    hypertension,
    smoking,
    diabetes,
    diabetes_control_type: diabetes === "Yes" ? mapDiabetesControlToDb(diabetesControl) : "Unknown",
    renal_failure: renalFailure,
    active_dialysis_status: renalFailure === "Yes" ? mapDialysisStatusToDb(dialysisStatus) : "Unknown",
    address: address ? String(address).trim() : null,
    higher_education: higherEducation || "None",
    occupation: occupation ? String(occupation).trim() : null,
    uhid: uhid ? String(uhid).trim() : null,
    abha_number: abhaNumber ? String(abhaNumber).trim() : null
  };
}

const normalizeRecord = (dbPatient) => {
  const patient = dbPatient?.patient || dbPatient || {};
  const { age: _age, ...patientWithoutAge } = patient;
  const { age: _dbAge, ...dbPatientWithoutAge } = dbPatient || {};

  const patientName = patient.patient_name || patient.name || "";
  const regPatientId = patient.reg_patient_id || patient.id || patient.regPatientId || "";
  const dob = patient.date_of_birth || patient.dob || "";
  const bloodGroup = patient.blood_group || patient.bloodGroup || "Unknown";
  const insuranceMode = patient.insurance_mode || patient.insuranceMode || "Unknown";
  const phone = patient.phone_no || patient.phone || "";
  const email = patient.email || "";
  const gender = patient.gender || "Unknown";
  const hypertension = patient.hypertension || patient.comorbidities?.hypertension || "No";
  const smoking = patient.smoking || patient.comorbidities?.smoking || "No";
  const diabetes = patient.diabetes || patient.comorbidities?.diabetes || "No";
  const renalFailure = patient.renal_failure || patient.comorbidities?.renalFailure || "No";
  const diabetesControl = mapDiabetesControlToUi(
    patient.diabetes_control_type || patient.diabetesControl || patient.comorbidities?.diabetesControl
  );
  const dialysisStatus = mapDialysisStatusToUi(
    patient.active_dialysis_status || patient.dialysisStatus || patient.comorbidities?.dialysisStatus
  );
  const address = patient.address || "";
  const higherEducation = patient.higher_education || patient.higherEducation || "None";
  const occupation = patient.occupation || "";
  const mrNo = patient.mr_no || patient.mrNo || "";
  const ipNo = patient.ip_no || patient.ipNo || "";
  const uhid = patient.uhid || patient.uhi || "";
  const abhaNumber = patient.abha_number || patient.abhaNumber || "";
  const createdAt = patient.created_at || patient.createdAt || new Date().toISOString();
  const updatedAt = patient.updated_at || patient.updatedAt || createdAt;

  return {
    patient: {
      id: String(regPatientId),
      name: patientName,
      dob,
      gender,
      mrNo,
      ipNo,
      phone,
      email,
      bloodGroup,
      insuranceMode,
      address,
      higherEducation,
      occupation,
      uhid,
      uhi: uhid,
      abhaNumber,
      abha_number: abhaNumber,
      primaryConsultant: patient.primaryConsultant || "Dr. K. Sridhar",
      createdAt,
      updatedAt,
      hypertension,
      smoking,
      diabetes,
      renalFailure,
      diabetesControl,
      dialysisStatus,
      ...patientWithoutAge
    },
    comorbidities: {
      hypertension,
      diabetes,
      diabetesControl,
      smoking,
      renalFailure,
      dialysisStatus,
      ...patient.comorbidities,
      ...patientWithoutAge
    },
    hospitalizations: Array.isArray(dbPatient?.hospitalizations) ? dbPatient.hospitalizations : emptyArray(),
    hfAssessments: Array.isArray(dbPatient?.hfAssessments) ? dbPatient.hfAssessments : emptyArray(),
    acsEvents: Array.isArray(dbPatient?.acsEvents) ? dbPatient.acsEvents : emptyArray(),
    cabgProcedures: Array.isArray(dbPatient?.cabgProcedures) ? dbPatient.cabgProcedures : emptyArray(),
    followUps: Array.isArray(dbPatient?.followUps) ? dbPatient.followUps : emptyArray(),
    labResults: Array.isArray(dbPatient?.labResults) ? dbPatient.labResults : emptyArray(),
    investigations: Array.isArray(dbPatient?.investigations) ? dbPatient.investigations : emptyArray(),
    medications: Array.isArray(dbPatient?.medications) ? dbPatient.medications : emptyArray(),
    auditTrail: Array.isArray(dbPatient?.auditTrail) ? dbPatient.auditTrail : emptyArray(),
    ...dbPatientWithoutAge
  };
};

export const mapPatientRecord = (dbPatient) => normalizeRecord(dbPatient);

export const mapPatientRecords = (rows = []) => rows.map(mapPatientRecord);
