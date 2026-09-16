/**
 * @file clinicalMetricsConfig.js
 * Centralized WHO/ACC/AHA Clinical Metrics, Standard Ranges, and Threshold Alert Configurations.
 * Shared across STEMI, NSTEMI, and Heart Failure (HF) Registries.
 */

export const CLINICAL_METRICS = {
  // --- VITAL SIGNS ---
  pulse_rate: {
    id: 'pulse_rate',
    label: 'Pulse Rate (bpm)',
    unit: 'bpm',
    possibleRange: { min: 0, max: 300 },
    evaluationType: 'RANGE',
    ranges: {
      normal: { min: 60, max: 100, label: 'Normal (60 - 100 bpm)' },
      medium: { min: 101, max: 119, label: 'Elevated (101 - 119 bpm)' },
      high: { min: 120, max: 300, label: 'Tachycardia (≥ 120 bpm)' }
    }
  },
  sbp: {
    id: 'sbp',
    label: 'Systolic Blood Pressure (SBP) (mmHg)',
    unit: 'mmHg',
    possibleRange: { min: 0, max: 300 },
    evaluationType: 'LOWER_IS_BETTER',
    ranges: {
      normal: { max: 119, label: 'Normal (< 120 mmHg)' },
      medium: { min: 120, max: 139, label: 'Prehypertension (120 - 139 mmHg)' },
      high: { min: 140, max: 300, label: 'Hypertension (≥ 140 mmHg)' }
    }
  },
  dbp: {
    id: 'dbp',
    label: 'Diastolic Blood Pressure (DBP) (mmHg)',
    unit: 'mmHg',
    possibleRange: { min: 0, max: 200 },
    evaluationType: 'LOWER_IS_BETTER',
    ranges: {
      normal: { max: 79, label: 'Normal (< 80 mmHg)' },
      medium: { min: 80, max: 89, label: 'Prehypertension (80 - 89 mmHg)' },
      high: { min: 90, max: 200, label: 'Hypertension (≥ 90 mmHg)' }
    }
  },
  hr_ecg: {
    id: 'hr_ecg',
    label: 'Heart Rate (ECG) (bpm)',
    unit: 'bpm',
    possibleRange: { min: 0, max: 300 },
    evaluationType: 'RANGE',
    ranges: {
      normal: { min: 60, max: 100, label: 'Normal (60 - 100 bpm)' },
      medium: { min: 101, max: 119, label: 'Elevated (101 - 119 bpm)' },
      high: { min: 120, max: 300, label: 'Tachycardia (≥ 120 bpm)' }
    }
  },

  // --- REPERFUSION TIMINGS & PROCEDURES ---
  door_to_balloon: {
    id: 'door_to_balloon',
    label: 'Door to Balloon Time (min)',
    unit: 'min',
    possibleRange: { min: 0, max: 500 },
    evaluationType: 'LOWER_IS_BETTER',
    ranges: {
      normal: { max: 90, label: 'Target Met (≤ 90 min)' },
      medium: { min: 91, max: 120, label: 'Delayed (91 - 120 min)' },
      high: { min: 121, max: 500, label: 'Critical Delay (> 120 min)' }
    }
  },
  door_to_needle: {
    id: 'door_to_needle',
    label: 'Door to Needle Time (min)',
    unit: 'min',
    possibleRange: { min: 0, max: 300 },
    evaluationType: 'LOWER_IS_BETTER',
    ranges: {
      normal: { max: 30, label: 'Target Met (≤ 30 min)' },
      medium: { min: 31, max: 60, label: 'Delayed (31 - 60 min)' },
      high: { min: 61, max: 300, label: 'Critical Delay (> 60 min)' }
    }
  },
  stent_diameter: {
    id: 'stent_diameter',
    label: 'Stent Diameter (mm)',
    unit: 'mm',
    possibleRange: { min: 2.25, max: 5.0 },
    evaluationType: 'INFO_ONLY'
  },
  stent_length: {
    id: 'stent_length',
    label: 'Stent Length (mm)',
    unit: 'mm',
    possibleRange: { min: 8, max: 48 },
    evaluationType: 'INFO_ONLY'
  },
  tenecteplase_dose: {
    id: 'tenecteplase_dose',
    label: 'Tenecteplase Dose (mg)',
    unit: 'mg',
    possibleRange: null,
    evaluationType: 'INFO_ONLY'
  },

  // --- ECHOCARDIOGRAPHY PARAMETERS ---
  ef_echo: {
    id: 'ef_echo',
    label: 'EF (Echo) (%)',
    unit: '%',
    possibleRange: { min: 10, max: 85 },
    evaluationType: 'UPPER_IS_BETTER',
    ranges: {
      normal: { min: 52, max: 72, label: 'Normal (52 - 72%)' },
      medium: { min: 41, max: 51, label: 'Mild Dysfunction (41 - 51%)' },
      high: { min: 0, max: 40, label: 'Heart Failure / Severe (≤ 40%)' }
    }
  },
  e_velocity: {
    id: 'e_velocity',
    label: 'Mitral E Wave Velocity (m/s)',
    unit: 'm/s',
    possibleRange: { min: 0.1, max: 2.5 },
    evaluationType: 'RANGE',
    ranges: {
      normal: { min: 0.6, max: 1.2, label: 'Normal (0.6 - 1.2 m/s)' },
      medium: { label: 'Age-dependent' },
      high: { min: 1.21, max: 2.5, label: 'Restrictive Filling (> 1.2 m/s)' }
    }
  },
  a_velocity: {
    id: 'a_velocity',
    label: 'Mitral A Wave Velocity (m/s)',
    unit: 'm/s',
    possibleRange: { min: 0.1, max: 2.5 },
    evaluationType: 'RANGE',
    ranges: {
      normal: { min: 0.2, max: 0.7, label: 'Normal (0.2 - 0.7 m/s)' },
      medium: { label: 'Age-dependent' },
      high: { min: 1.01, max: 2.5, label: 'Impaired Relaxation (> 1.0 m/s)' }
    }
  },
  deceleration_time: {
    id: 'deceleration_time',
    label: 'Deceleration Time (DT) (ms)',
    unit: 'ms',
    possibleRange: { min: 50, max: 400 },
    evaluationType: 'DUAL_OUTLIER',
    ranges: {
      normal: { min: 160, max: 240, label: 'Normal (160 - 240 ms)' },
      medium: [
        { min: 140, max: 159, label: 'Borderline Low (140 - 159 ms)' },
        { min: 241, max: 280, label: 'Borderline High (241 - 280 ms)' }
      ],
      high: [
        { min: 0, max: 139, label: 'Restrictive (< 140 ms)' },
        { min: 281, max: 1000, label: 'Impaired (> 280 ms)' }
      ]
    }
  },
  e_prime: {
    id: 'e_prime',
    label: "Tissue Doppler E' (cm/s)",
    unit: 'cm/s',
    possibleRange: { min: 2, max: 25 },
    evaluationType: 'UPPER_IS_BETTER',
    ranges: {
      normal: { min: 7, max: 25, label: 'Normal Septal (≥ 7 cm/s)' },
      medium: { min: 5, max: 6.9, label: 'Borderline (5 - 6.9 cm/s)' },
      high: { min: 0, max: 4.9, label: 'Dysfunction (< 5 cm/s)' }
    }
  },
  tapse: {
    id: 'tapse',
    label: 'TAPSE / TAPSV (mm)',
    unit: 'mm',
    possibleRange: { min: 5, max: 35 },
    evaluationType: 'UPPER_IS_BETTER',
    ranges: {
      normal: { min: 17, max: 35, label: 'Normal RV Function (≥ 17 mm)' },
      medium: { min: 15, max: 16.9, label: 'Borderline RV (15 - 16 mm)' },
      high: { min: 0, max: 14.9, label: 'RV Dysfunction (< 15 mm)' }
    }
  },

  // --- CARDIAC LAB & ELECTROLYTE METRICS ---
  hemoglobin: {
    id: 'hemoglobin',
    label: 'Hemoglobin (g/dL)',
    unit: 'g/dL',
    possibleRange: { min: 2, max: 25 },
    evaluationType: 'UPPER_IS_BETTER',
    ranges: {
      normal: { min: 13.8, max: 17.2, label: 'Normal Male (13.8 - 17.2 g/dL)' },
      medium: { min: 10.0, max: 12.0, label: 'Mild Anemia (10.0 - 12.0 g/dL)' },
      high: { min: 0, max: 9.9, label: 'Severe Anemia (< 10.0 g/dL)' }
    }
  },
  serum_creatinine: {
    id: 'serum_creatinine',
    label: 'Serum Creatinine (mg/dL)',
    unit: 'mg/dL',
    possibleRange: { min: 0.1, max: 15.0 },
    evaluationType: 'LOWER_IS_BETTER',
    ranges: {
      normal: { min: 0.74, max: 1.35, label: 'Normal (0.74 - 1.35 mg/dL)' },
      medium: { min: 1.36, max: 1.99, label: 'Elevated (1.36 - 1.99 mg/dL)' },
      high: { min: 2.0, max: 15.0, label: 'Renal Impairment (≥ 2.0 mg/dL)' }
    }
  },
  troponin_i: {
    id: 'troponin_i',
    label: 'Troponin-I (ng/mL)',
    unit: 'ng/mL',
    possibleRange: { min: 0, max: 100 },
    evaluationType: 'LOWER_IS_BETTER',
    ranges: {
      normal: { max: 0.039, label: 'Normal (< 0.04 ng/mL)' },
      medium: { min: 0.04, max: 0.39, label: 'Elevated (0.04 - 0.39 ng/mL)' },
      high: { min: 0.40, max: 100, label: 'Myocardial Infarction (≥ 0.40 ng/mL)' }
    }
  },
  cpk: {
    id: 'cpk',
    label: 'CPK Total (U/L)',
    unit: 'U/L',
    possibleRange: { min: 0, max: 50000 },
    evaluationType: 'LOWER_IS_BETTER',
    ranges: {
      normal: { min: 39, max: 308, label: 'Normal (39 - 308 U/L)' },
      medium: { min: 309, max: 999, label: 'Elevated (309 - 999 U/L)' },
      high: { min: 1000, max: 50000, label: 'High Risk (≥ 1,000 U/L)' }
    }
  },
  ck_mb: {
    id: 'ck_mb',
    label: 'CK-MB (U/L)',
    unit: 'U/L',
    possibleRange: { min: 0, max: 1000 },
    evaluationType: 'LOWER_IS_BETTER',
    ranges: {
      normal: { max: 24.9, label: 'Normal (< 25 U/L)' },
      medium: { min: 25, max: 50, label: 'Elevated (25 - 50 U/L)' },
      high: { min: 50.1, max: 1000, label: 'High (> 50 U/L)' }
    }
  },
  sodium: {
    id: 'sodium',
    label: 'Sodium (Na) (mEq/L)',
    unit: 'mEq/L',
    possibleRange: { min: 100, max: 180 },
    evaluationType: 'DUAL_OUTLIER',
    ranges: {
      normal: { min: 135, max: 145, label: 'Normal (135 - 145 mEq/L)' },
      medium: [
        { min: 130, max: 134, label: 'Mild Hyponatremia (130 - 134 mEq/L)' },
        { min: 146, max: 150, label: 'Mild Hypernatremia (146 - 150 mEq/L)' }
      ],
      high: [
        { min: 0, max: 129, label: 'Severe Hyponatremia (< 130 mEq/L)' },
        { min: 151, max: 200, label: 'Severe Hypernatremia (> 150 mEq/L)' }
      ]
    }
  },
  potassium: {
    id: 'potassium',
    label: 'Potassium (K) (mEq/L)',
    unit: 'mEq/L',
    possibleRange: { min: 1.0, max: 9.0 },
    evaluationType: 'DUAL_OUTLIER',
    ranges: {
      normal: { min: 3.5, max: 5.0, label: 'Normal (3.5 - 5.0 mEq/L)' },
      medium: [
        { min: 3.0, max: 3.4, label: 'Mild Hypokalemia (3.0 - 3.4 mEq/L)' },
        { min: 5.1, max: 5.9, label: 'Mild Hyperkalemia (5.1 - 5.9 mEq/L)' }
      ],
      high: [
        { min: 0, max: 2.99, label: 'Severe Hypokalemia (< 3.0 mEq/L)' },
        { min: 6.0, max: 15.0, label: 'Critical Hyperkalemia (≥ 6.0 mEq/L)' }
      ]
    }
  },
  rbs: {
    id: 'rbs',
    label: 'Random Blood Sugar (RBS) (mg/dL)',
    unit: 'mg/dL',
    possibleRange: { min: 20, max: 1000 },
    evaluationType: 'LOWER_IS_BETTER',
    ranges: {
      normal: { max: 139, label: 'Normal (< 140 mg/dL)' },
      medium: { min: 140, max: 199, label: 'Pre-diabetes / Impaired (140 - 199 mg/dL)' },
      high: { min: 200, max: 1000, label: 'Diabetes / Severe (≥ 200 mg/dL)' }
    }
  },

  // --- HOSPITAL STAY & FINANCIAL AUDITING METRICS (ADMINISTRATIVE) ---
  iccu_stay: { id: 'iccu_stay', label: 'ICCU Stay (hours)', unit: 'hours', evaluationType: 'INFO_ONLY' },
  stepdown_icu_stay: { id: 'stepdown_icu_stay', label: 'Step-down ICU Stay (hours)', unit: 'hours', evaluationType: 'INFO_ONLY' },
  floors_stay: { id: 'floors_stay', label: 'Floors Stay (days)', unit: 'days', evaluationType: 'INFO_ONLY' },
  total_hospital_stay: { id: 'total_hospital_stay', label: 'Total Hospital Stay (days)', unit: 'days', evaluationType: 'INFO_ONLY' },
  bed_charges: { id: 'bed_charges', label: 'Bed Charges (INR ₹)', unit: 'INR (₹)', evaluationType: 'INFO_ONLY' },
  drugs_disposables: { id: 'drugs_disposables', label: 'Drugs & Disposables (INR ₹)', unit: 'INR (₹)', evaluationType: 'INFO_ONLY' },
  packages: { id: 'packages', label: 'Packages (INR ₹)', unit: 'INR (₹)', evaluationType: 'INFO_ONLY' },
  lab_investigations: { id: 'lab_investigations', label: 'Lab Investigations (INR ₹)', unit: 'INR (₹)', evaluationType: 'INFO_ONLY' },
  non_invasive_labs: { id: 'non_invasive_labs', label: 'Non-invasive Labs (INR ₹)', unit: 'INR (₹)', evaluationType: 'INFO_ONLY' },
  consults: { id: 'consults', label: 'Consults (INR ₹)', unit: 'INR (₹)', evaluationType: 'INFO_ONLY' },
  radiology: { id: 'radiology', label: 'Radiology (INR ₹)', unit: 'INR (₹)', evaluationType: 'INFO_ONLY' },
  miscellaneous: { id: 'miscellaneous', label: 'Miscellaneous Charges (INR ₹)', unit: 'INR (₹)', evaluationType: 'INFO_ONLY' }
};

const FIELD_ALIASES = {
  systolic_bp: 'sbp',
  diastolic_bp: 'dbp',
  door_to_balloon_time: 'door_to_balloon',
  door_to_needle_time: 'door_to_needle',
  ecg_heart_rate: 'hr_ecg',
  echo_ef: 'ef_echo',
  echo_e: 'e_velocity',
  echo_a: 'a_velocity',
  echo_dt: 'deceleration_time',
  echo_e_prime: 'e_prime',
  echo_tapsv: 'tapse',
  creatinine: 'serum_creatinine',
  rbs_admission: 'rbs'
};

/**
 * Evaluates a numeric patient value against WHO/ACC/AHA clinical metrics rules.
 * @param {string} metricId - Key from CLINICAL_METRICS or alias (e.g., 'pulse_rate', 'systolic_bp', 'troponin_i')
 * @param {number|string} rawValue - Patient input value
 * @returns {Object|null} Alert status & Tailwind UI styles OR null if empty/invalid/out-of-scope.
 */
export function evaluateClinicalMetric(metricId, rawValue) {
  const resolvedKey = FIELD_ALIASES[metricId] || metricId;
  const config = CLINICAL_METRICS[resolvedKey];

  // Strict Null Fallback: Return null if no config, empty/null/undefined value, or INFO_ONLY metric
  if (!config || rawValue === '' || rawValue === null || rawValue === undefined) {
    return null;
  }

  const val = parseFloat(rawValue);
  if (isNaN(val)) {
    return null;
  }

  if (config.evaluationType === 'INFO_ONLY' || !config.ranges) {
    return null;
  }

  const { ranges } = config;

  // 1. Check HIGH / SEVERE Range
  let isHigh = false;
  let highLabel = ranges.high?.label || 'Severe / High Risk';

  if (Array.isArray(ranges.high)) {
    isHigh = ranges.high.some(r => (r.min !== undefined ? val >= r.min : true) && (r.max !== undefined ? val <= r.max : true));
  } else if (ranges.high) {
    isHigh = (ranges.high.min !== undefined ? val >= ranges.high.min : true) && (ranges.high.max !== undefined ? val <= ranges.high.max : true);
  }

  if (isHigh) {
    return {
      status: 'HIGH',
      severity: 'high',
      label: highLabel,
      badgeClass: 'bg-rose-50 text-rose-700 border-rose-200 font-bold',
      textClass: 'text-rose-600',
      borderClass: 'border-rose-300 focus:ring-rose-500/20'
    };
  }

  // 2. Check MEDIUM / BORDERLINE Range
  let isMedium = false;
  let mediumLabel = ranges.medium?.label || 'Borderline / Medium';

  if (Array.isArray(ranges.medium)) {
    isMedium = ranges.medium.some(r => (r.min !== undefined ? val >= r.min : true) && (r.max !== undefined ? val <= r.max : true));
  } else if (ranges.medium) {
    isMedium = (ranges.medium.min !== undefined ? val >= ranges.medium.min : true) && (ranges.medium.max !== undefined ? val <= ranges.medium.max : true);
  }

  if (isMedium) {
    return {
      status: 'MEDIUM',
      severity: 'medium',
      label: mediumLabel,
      badgeClass: 'bg-amber-50 text-amber-700 border-amber-200 font-bold',
      textClass: 'text-amber-600',
      borderClass: 'border-amber-300 focus:ring-amber-500/20'
    };
  }

  // 3. Check NORMAL Range
  let isNormal = false;
  let normalLabel = ranges.normal?.label || 'Normal';

  if (Array.isArray(ranges.normal)) {
    isNormal = ranges.normal.some(r => (r.min !== undefined ? val >= r.min : true) && (r.max !== undefined ? val <= r.max : true));
  } else if (ranges.normal) {
    isNormal = (ranges.normal.min !== undefined ? val >= ranges.normal.min : true) && (ranges.normal.max !== undefined ? val <= ranges.normal.max : true);
  }

  if (isNormal) {
    return {
      status: 'NORMAL',
      severity: 'low',
      label: normalLabel,
      badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200 font-medium',
      textClass: 'text-emerald-600',
      borderClass: 'border-emerald-300 focus:ring-emerald-500/20'
    };
  }

  // Strict Null Fallback if not matching any defined range
  return null;
}

export default CLINICAL_METRICS;
