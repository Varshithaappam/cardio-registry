const INSURANCE_ALIASES = {
    Direct: "Direct Cash / Self-Pay",
    Arogyasree: "Arogyasree Scheme"
};

const DIABETES_CONTROL_ALIASES = {
    None: "None (Uncontrolled)",
    Diet: "Dietary Control Only",
    Oral: "Oral Hypoglycemics (OHA)",
    Insulin: "Insulin Therapy"
};

const DIALYSIS_ALIASES = {
    Yes: "Under Dialysis",
    No: "No Dialysis"
};

const VALID_GENDERS = ["Male", "Female", "Other"];
const VALID_YES_NO_UNKNOWN = ["Yes", "No", "Unknown"];
const VALID_INSURANCE = [
    "Direct Cash / Self-Pay",
    "Private Insurance",
    "Government Reimbursement",
    "Arogyasree Scheme",
    "Unknown"
];
const VALID_BLOOD_GROUPS = [
    "A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-", "Unknown"
];
const VALID_DIABETES_CONTROL = [
    "None (Uncontrolled)",
    "Dietary Control Only",
    "Oral Hypoglycemics (OHA)",
    "Insulin Therapy",
    "Unknown"
];
const VALID_DIALYSIS_STATUS = ["Under Dialysis", "No Dialysis", "Unknown"];
const VALID_HIGHER_EDUCATION = ["Primary", "Secondary", "Graduate", "Post Graduate", "None"];

function normalizeInsuranceMode(value) {
    if (!value) return "Unknown";
    return INSURANCE_ALIASES[value] || value;
}

function normalizeDiabetesControlType(value, diabetes) {
    if (diabetes !== "Yes") return "Unknown";
    if (!value) return "Unknown";
    return DIABETES_CONTROL_ALIASES[value] || value;
}

function normalizeDialysisStatus(value, renalFailure) {
    if (renalFailure !== "Yes") return "Unknown";
    if (!value) return "Unknown";
    return DIALYSIS_ALIASES[value] || value;
}

function validateEnum(value, allowedValues, fieldName) {
    if (!allowedValues.includes(value)) {
        throw new Error(
            `Invalid value "${value}" for ${fieldName}. Allowed values: ${allowedValues.join(", ")}`
        );
    }
}

function normalizePatientInput(body = {}) {
    const patient_name = String(body.patient_name || "").trim();
    const date_of_birth = body.date_of_birth;
    const gender = body.gender || "Unknown";
    const blood_group = body.blood_group || "Unknown";
    const insurance_mode = normalizeInsuranceMode(body.insurance_mode);
    const phone_no = body.phone_no ? String(body.phone_no).trim() : null;
    const email = body.email ? String(body.email).trim() : null;
    const hypertension = body.hypertension || "Unknown";
    const smoking = body.smoking || "Unknown";
    const diabetes = body.diabetes || "Unknown";
    const renal_failure = body.renal_failure || "Unknown";
    const diabetes_control_type = normalizeDiabetesControlType(
        body.diabetes_control_type,
        diabetes
    );
    const active_dialysis_status = normalizeDialysisStatus(
        body.active_dialysis_status,
        renal_failure
    );
    const house_flat_no = body.house_flat_no ? String(body.house_flat_no).trim().substring(0, 100) : null;
    const street_locality = body.street_locality ? String(body.street_locality).trim().substring(0, 255) : null;
    const village_town = body.village_town ? String(body.village_town).trim().substring(0, 150) : null;
    const mandal = body.mandal ? String(body.mandal).trim().substring(0, 100) : null;
    const district = body.district ? String(body.district).trim().substring(0, 100) : null;
    const state = body.state ? String(body.state).trim().substring(0, 100) : null;
    const pincode = body.pincode ? String(body.pincode).trim().substring(0, 10) : null;

    let address = body.address ? String(body.address).trim().substring(0, 500) : null;
    if (!address) {
        const addressParts = [house_flat_no, street_locality, village_town, mandal, district, state, pincode].filter(Boolean);
        if (addressParts.length > 0) {
            address = addressParts.join(', ').substring(0, 500);
        }
    }

    const higher_education = body.higher_education || "None";
    const occupation = body.occupation ? String(body.occupation).trim().substring(0, 255) : null;
    const mr_no = body.mr_no || body.mrNo ? String(body.mr_no || body.mrNo).trim().substring(0, 10) : null;
    const ip_no = body.ip_no || body.ipNo ? String(body.ip_no || body.ipNo).trim().substring(0, 10) : null;
    const uhid = body.uhid || body.uhi ? String(body.uhid || body.uhi).trim() : null;
    const abha_number = body.abha_number || body.abhaNumber || body.abha ? String(body.abha_number || body.abhaNumber || body.abha).trim() : null;
    const patient_status = body.patient_status ? String(body.patient_status).trim().toUpperCase() : "ACTIVE";
    const date_of_death = (patient_status === "DECEASED" && (body.date_of_death || body.dateOfDeath))
        ? (body.date_of_death || body.dateOfDeath)
        : null;
    const merged_into_patient_id = body.merged_into_patient_id ? parseInt(body.merged_into_patient_id, 10) : null;

    if (!patient_name) {
        throw new Error("Patient name is required.");
    }

    if (!date_of_birth) {
        throw new Error("Date of birth is required.");
    }

    if (!mr_no) {
        throw new Error("MR Number (mr_no) is required.");
    }

    validateEnum(gender, VALID_GENDERS, "gender");
    validateEnum(blood_group, VALID_BLOOD_GROUPS, "blood_group");
    validateEnum(insurance_mode, VALID_INSURANCE, "insurance_mode");
    validateEnum(hypertension, VALID_YES_NO_UNKNOWN, "hypertension");
    validateEnum(smoking, VALID_YES_NO_UNKNOWN, "smoking");
    validateEnum(diabetes, VALID_YES_NO_UNKNOWN, "diabetes");
    validateEnum(renal_failure, VALID_YES_NO_UNKNOWN, "renal_failure");
    validateEnum(diabetes_control_type, VALID_DIABETES_CONTROL, "diabetes_control_type");
    validateEnum(active_dialysis_status, VALID_DIALYSIS_STATUS, "active_dialysis_status");
    validateEnum(higher_education, VALID_HIGHER_EDUCATION, "higher_education");

    return {
        mr_no,
        ip_no,
        patient_name,
        date_of_birth,
        gender,
        blood_group,
        insurance_mode,
        phone_no,
        email,
        hypertension,
        smoking,
        diabetes,
        diabetes_control_type,
        renal_failure,
        active_dialysis_status,
        address,
        house_flat_no,
        street_locality,
        village_town,
        mandal,
        district,
        state,
        pincode,
        higher_education,
        occupation,
        uhid,
        abha_number,
        patient_status,
        date_of_death,
        merged_into_patient_id
    };
}

function mapDatabaseError(error) {
    if (!error || (!error.code && !error.number)) {
        return {
            status: 500,
            message: error?.message || "An unexpected error occurred."
        };
    }

    switch (error.number || error.code) {
        case 245:
        case 241:
            return {
                status: 400,
                message: `Invalid field value: ${error.sqlMessage || error.message}`
            };
        case 2601:
        case 2627:
            return {
                status: 409,
                message: "A patient with the same MR Number already exists."
            };
        case 515:
            return {
                status: 400,
                message: `Missing required field: ${error.sqlMessage || error.message}`
            };
        case "ECONNREFUSED":
        case "ELOGIN":
        case "ESOCKET":
            return {
                status: 503,
                message: "Database connection failed. Please verify backend database settings."
            };
        default:
            return {
                status: 500,
                message: error.sqlMessage || error.message || "Failed to process patient request."
            };
    }
}

module.exports = {
    normalizePatientInput,
    mapDatabaseError,
    VALID_HIGHER_EDUCATION
};
