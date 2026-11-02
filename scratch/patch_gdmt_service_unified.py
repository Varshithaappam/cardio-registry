import re

service_path = r"backend/services/gdmtService.js"

with open(service_path, "r", encoding="utf-8") as f:
    content = f.read()

# Replace block from `// ARNI and SGLT2 inhibitor prescription mapping` through `const contraSglt2 = ...`
pattern = re.compile(
    r"// ARNI and SGLT2 inhibitor prescription mapping[\s\S]*?const contraSglt2 =[\s\S]*?\? 1 : 0;",
    re.MULTILINE
)

replacement = """// ARNI and SGLT2 inhibitor prescription mapping (strictly matches Export Sheet & Registry definition)
  const otherMedsText = [
    row.arb_other_name,
    row.other_medication_1_name,
    row.other_medication_2_name,
    row.other_medication_3_name,
    row.other_medication_4_name,
    row.antihypertensive_name,
    row.drugs
  ].filter(Boolean).join(' ').toLowerCase();

  const arniPrescribed = (
    otherMedsText.includes('sacubitril') ||
    otherMedsText.includes('entresto') ||
    otherMedsText.includes('cidmus') ||
    otherMedsText.includes('vymada') ||
    otherMedsText.includes('arney') ||
    otherMedsText.includes('sacurise')
  ) ? 1 : 0;

  const sglt2Prescribed = (
    otherMedsText.includes('dapa') ||
    otherMedsText.includes('forxiga') ||
    otherMedsText.includes('oxra') ||
    otherMedsText.includes('empagli') ||
    otherMedsText.includes('jardiance') ||
    otherMedsText.includes('cana') ||
    otherMedsText.includes('invokana')
  ) ? 1 : 0;

  // Clinical text (matching Export Sheet Column F)
  const reasonsForAdmissions = [];
  if (String(row.myocardial_ischemia).toLowerCase() === 'yes') reasonsForAdmissions.push('myocardial ischemia');
  if (String(row.atrial_fibrillation).toLowerCase() === 'yes') reasonsForAdmissions.push('atrial fibrillation');
  if (String(row.bradyarrhythmia).toLowerCase() === 'yes') reasonsForAdmissions.push('bradyarrhythmia');
  if (String(row.ventricular_tachycardia).toLowerCase() === 'yes') reasonsForAdmissions.push('ventricular tachycardia');
  if (String(row.uncontrolled_hypertension).toLowerCase() === 'yes') reasonsForAdmissions.push('uncontrolled hypertension');
  if (String(row.infection).toLowerCase() === 'yes') reasonsForAdmissions.push('infection');
  if (String(row.ha_rf || row.renal_failure).toLowerCase() === 'yes') reasonsForAdmissions.push('renal failure');
  if (String(row.anaemia).toLowerCase() === 'yes') reasonsForAdmissions.push('anaemia');
  if (String(row.medication_non_adherence).toLowerCase() === 'yes') reasonsForAdmissions.push('medication non adherence');
  if (String(row.excessive_salt_intake).toLowerCase() === 'yes') reasonsForAdmissions.push('excessive salt intake');
  if (String(row.excessive_water_ingestion).toLowerCase() === 'yes') reasonsForAdmissions.push('excessive water ingestion');
  if (String(row.progressive_worsening).toLowerCase() === 'yes') reasonsForAdmissions.push('progressive worsening');
  if (row.precipitating_other && String(row.precipitating_other).trim().length > 0) reasonsForAdmissions.push(String(row.precipitating_other).trim());

  const diagText = String(
    `${row.present_diagnosis || ''} ${reasonsForAdmissions.join(' ')} ${row.previous_diagnosis || ''} ${hasDM ? 'diabetes mellitus' : ''} ${hasHTN ? 'hypertension' : ''} ${hasRF ? 'renal failure ckd' : ''} ${hasCAD ? 'cad coronary artery disease' : ''}`
  ).toLowerCase();

  const medsText = String(
    `${row.other_medication_1_name || ''} ${row.other_medication_2_name || ''} ${row.other_medication_3_name || ''} ${row.other_medication_4_name || ''} ${row.beta_blocker_other_name || ''} ${row.ace_other_name || ''} ${row.arb_other_name || ''}`
  ).toLowerCase();

  // Vitals & Labs for CI evaluation
  const hrVal = (row.heart_rate !== null && row.heart_rate !== undefined && !isNaN(Number(row.heart_rate))) ? Number(row.heart_rate) : null;
  const sbpVal = (row.systolic_bp_sitting !== null && row.systolic_bp_sitting !== undefined && !isNaN(Number(row.systolic_bp_sitting))) ? Number(row.systolic_bp_sitting) : null;
  const kVal = (row.potassium_result !== null && row.potassium_result !== undefined && !isNaN(Number(row.potassium_result))) ? Number(row.potassium_result) : null;
  const creatVal = (row.creatinine_result !== null && row.creatinine_result !== undefined && !isNaN(Number(row.creatinine_result))) ? Number(row.creatinine_result) : null;

  // Exact 12 CI Flags matching Export Sheet
  const flagH = hrVal !== null && hrVal < 50;
  const flagI = sbpVal !== null && sbpVal < 90;
  const flagJ = sbpVal !== null && sbpVal < 100;
  const flagK = diagText.includes('shock') || medsText.includes('dobutamine') || medsText.includes('dobu') || medsText.includes('norad');
  const flagL = diagText.includes('asthma') || diagText.includes('copd') || diagText.includes('bronch');
  const flagM = (kVal !== null && kVal > 5.5) || diagText.includes('hyperkal');
  const flagN = (kVal !== null && kVal > 5.0) || diagText.includes('hyperkal');
  const flagO = (creatVal !== null && creatVal > 2.5) || diagText.includes('renal') || diagText.includes('ckd');
  const flagP = diagText.includes('av block') || diagText.includes('heart block') || diagText.includes('chb') || diagText.includes('sick sinus') || diagText.includes('brady');
  const flagQ = diagText.includes('dka') || diagText.includes('ketoacid');
  const flagR = diagText.includes('uti') || diagText.includes('urosepsis');
  const flagS = creatVal !== null && creatVal > 3.0;

  // 6 Contraindication flags
  const contraBB = (flagH || flagI || flagK || flagL || flagP) ? 1 : 0;
  const contraAce = (flagI || flagM || flagO) ? 1 : 0;
  const contraArb = (flagI || flagM || flagO) ? 1 : 0;
  const contraArni = (flagJ || flagM || flagO) ? 1 : 0;
  const contraMra = (flagN || flagO) ? 1 : 0;
  const contraSglt2 = (flagQ || flagR || flagS) ? 1 : 0;"""

new_content, count = pattern.subn(replacement, content, count=1)
print(f"Replaced blocks in gdmtService: {count}")

with open(service_path, "w", encoding="utf-8") as f:
    f.write(new_content)

