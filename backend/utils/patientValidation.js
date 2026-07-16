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

    if (!patient_name) {
        throw new Error("Patient name is required.");
    }

    if (!date_of_birth) {
        throw new Error("Date of birth is required.");
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

    return {
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
        active_dialysis_status
    };
}

function mapDatabaseError(error) {
    if (!error || !error.code) {
        return {
            status: 500,
            message: error?.message || "An unexpected error occurred."
        };
    }

    switch (error.code) {
        case "ER_TRUNCATED_WRONG_VALUE_FOR_FIELD":
        case "WARN_DATA_TRUNCATED":
            return {
                status: 400,
                message: `Invalid field value: ${error.sqlMessage || error.message}`
            };
        case "ER_DUP_ENTRY":
            return {
                status: 409,
                message: "A patient with the same MR Number or IP Number already exists."
            };
        case "ER_BAD_NULL_ERROR":
            return {
                status: 400,
                message: `Missing required field: ${error.sqlMessage || error.message}`
            };
        case "ECONNREFUSED":
        case "ER_ACCESS_DENIED_ERROR":
        case "ER_BAD_DB_ERROR":
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
    mapDatabaseError
};
