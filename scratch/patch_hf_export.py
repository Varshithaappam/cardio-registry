with open('backend/services/hfExportService.js', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Add SQL fields
target_sql = """      ha.admission_type,
      ha.precipitating_other,"""

replacement_sql = """      ha.admission_type,
      ha.myocardial_ischemia,
      ha.atrial_fibrillation,
      ha.bradyarrhythmia,
      ha.ventricular_tachycardia,
      ha.uncontrolled_hypertension,
      ha.infection,
      ha.renal_failure,
      ha.anaemia,
      ha.medication_non_adherence,
      ha.excessive_salt_intake,
      ha.excessive_water_ingestion,
      ha.progressive_worsening,
      ha.precipitating_other,"""

# 2. Add helper function before getHfSheet1ExportData
target_func_pos = "async function getHfSheet1ExportData(options = {}) {"

helper_func = """function formatReasonsForAdmissions(row) {
  const reasons = [];
  if (isYes(row.myocardial_ischemia)) reasons.push('Myocardial ischemia');
  if (isYes(row.atrial_fibrillation)) reasons.push('Atrial fibrillation');
  if (isYes(row.bradyarrhythmia)) reasons.push('Bradyarrhythmia');
  if (isYes(row.ventricular_tachycardia)) reasons.push('Ventricular tachycardia');
  if (isYes(row.uncontrolled_hypertension)) reasons.push('Uncontrolled hypertension');
  if (isYes(row.infection)) reasons.push('Infection');
  if (isYes(row.renal_failure)) reasons.push('Renal failure');
  if (isYes(row.anaemia)) reasons.push('Anaemia');
  if (isYes(row.medication_non_adherence)) reasons.push('Medication non adherence');
  if (isYes(row.excessive_salt_intake)) reasons.push('Excessive salt intake');
  if (isYes(row.excessive_water_ingestion)) reasons.push('Excessive water ingestion');
  if (isYes(row.progressive_worsening)) reasons.push('Progressive worsening');
  if (row.precipitating_other && String(row.precipitating_other).trim() !== '' && !/^(no|0|false)$/i.test(String(row.precipitating_other).trim())) {
    const o = String(row.precipitating_other).trim();
    reasons.push(o.toLowerCase() === 'yes' ? 'Other' : o);
  }
  return reasons.join(', ');
}

"""

# 3. Add to headers
target_headers = """    'Reasons other than HF',
    'Previous Diagnosis',"""

replacement_headers = """    'Reasons other than HF',
    'reasons for admissions',
    'Previous Diagnosis',"""

# 4. Add to mapped row
target_row = """      row.precipitating_other || '',                 // 21. Reasons other than HF
      row.previous_diagnosis || '',                  // 22. Previous Diagnosis"""

replacement_row = """      row.precipitating_other || '',                 // 21. Reasons other than HF
      formatReasonsForAdmissions(row),               // 22. reasons for admissions
      row.previous_diagnosis || '',                  // 23. Previous Diagnosis"""

assert target_sql in content, "target_sql not found"
assert target_func_pos in content, "target_func_pos not found"
assert target_headers in content, "target_headers not found"
assert target_row in content, "target_row not found"

content = content.replace(target_sql, replacement_sql, 1)
content = content.replace(target_func_pos, helper_func + target_func_pos, 1)
content = content.replace(target_headers, replacement_headers, 1)
content = content.replace(target_row, replacement_row, 1)

with open('backend/services/hfExportService.js', 'w', encoding='utf-8') as f:
    f.write(content)

print("SUCCESSfully patched backend/services/hfExportService.js")

