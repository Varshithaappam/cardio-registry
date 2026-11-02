path = r'backend\services\gdmtService.js'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

old_block = """  // Contraindication derivations based on clinical thresholds
  const contraBB = (
    hr < 50 || sbp < 90 ||
    String(row.beta_not_used_bradycardia).toLowerCase() === 'yes' ||
    String(row.beta_not_used_hypotension).toLowerCase() === 'yes' ||
    String(row.beta_not_used_heart_blocks).toLowerCase() === 'yes' ||
    String(row.beta_not_used_copd_asthma).toLowerCase() === 'yes' ||
    String(row.beta_not_used_other).toLowerCase() === 'yes' ||
    diagText.includes('shock') ||
    medsText.includes('dobutamine') || medsText.includes('dobu') || medsText.includes('norad') || medsText.includes('noradrenaline') ||
    diagText.includes('sick sinus') ||
    diagText.includes('av block') || diagText.includes('heart block') || diagText.includes('chb')
  ) ? 1 : 0;

  const contraAce = (
    creat > 2.5 || k > 5.5 || sbp < 90 ||
    String(row.ace_not_used_elevated_creatinine).toLowerCase() === 'yes' ||
    String(row.ace_not_used_hyperkalemia).toLowerCase() === 'yes' ||
    String(row.ace_not_used_hypotension).toLowerCase() === 'yes' ||
    String(row.ace_not_used_cough).toLowerCase() === 'yes' ||
    String(row.ace_not_used_other).toLowerCase() === 'yes'
  ) ? 1 : 0;

  const contraArb = (
    creat > 2.5 || k > 5.5 || sbp < 90 ||
    String(row.arb_not_used_elevated_creatinine).toLowerCase() === 'yes' ||
    String(row.arb_not_used_hyperkalemia).toLowerCase() === 'yes' ||
    String(row.arb_not_used_hypotension).toLowerCase() === 'yes' ||
    String(row.arb_not_used_other).toLowerCase() === 'yes'
  ) ? 1 : 0;

  const contraMra = (
    creat > 2.5 || k > 5.0 ||
    String(row.aldosterone_not_used_hyperkalemia).toLowerCase() === 'yes' ||
    String(row.aldosterone_not_used_hyponatremia).toLowerCase() === 'yes' ||
    String(row.aldosterone_not_used_elevated_creatinine).toLowerCase() === 'yes' ||
    String(row.aldosterone_not_used_other).toLowerCase() === 'yes'
  ) ? 1 : 0;

  const contraArni = (creat > 2.5 || k > 5.5 || sbp < 90) ? 1 : 0;"""

new_block = """  // Contraindication derivations based on clinical thresholds
  const contraBB = (
    hr < 50 || sbp < 90 ||
    String(row.beta_not_used_bradycardia).toLowerCase() === 'yes' ||
    String(row.beta_not_used_hypotension).toLowerCase() === 'yes' ||
    String(row.beta_not_used_heart_blocks).toLowerCase() === 'yes' ||
    String(row.beta_not_used_copd_asthma).toLowerCase() === 'yes' ||
    (String(row.beta_not_used_other).toLowerCase() === 'yes' && /brady|block|asthma|copd|hypoten|shock/i.test(row.beta_not_used_other_reason || '')) ||
    diagText.includes('shock') ||
    medsText.includes('dobutamine') || medsText.includes('dobu') || medsText.includes('norad') || medsText.includes('noradrenaline') ||
    diagText.includes('sick sinus') ||
    diagText.includes('av block') || diagText.includes('heart block') || diagText.includes('chb')
  ) ? 1 : 0;

  const contraAce = (
    creat > 2.5 || k > 5.5 || sbp < 90 ||
    String(row.ace_not_used_elevated_creatinine).toLowerCase() === 'yes' ||
    String(row.ace_not_used_hyperkalemia).toLowerCase() === 'yes' ||
    String(row.ace_not_used_hypotension).toLowerCase() === 'yes' ||
    String(row.ace_not_used_cough).toLowerCase() === 'yes' ||
    (String(row.ace_not_used_other).toLowerCase() === 'yes' && /hyperkal|creat|renal|angioedema|cough|hypoten/i.test(row.ace_not_used_other_reason || '')) ||
    diagText.includes('angioedema')
  ) ? 1 : 0;

  const contraArb = (
    creat > 2.5 || k > 5.5 || sbp < 90 ||
    String(row.arb_not_used_elevated_creatinine).toLowerCase() === 'yes' ||
    String(row.arb_not_used_hyperkalemia).toLowerCase() === 'yes' ||
    String(row.arb_not_used_hypotension).toLowerCase() === 'yes' ||
    (String(row.arb_not_used_other).toLowerCase() === 'yes' && /hyperkal|creat|renal|hypoten/i.test(row.arb_not_used_other_reason || ''))
  ) ? 1 : 0;

  const contraMra = (
    creat > 2.5 || k > 5.0 ||
    String(row.aldosterone_not_used_hyperkalemia).toLowerCase() === 'yes' ||
    String(row.aldosterone_not_used_hyponatremia).toLowerCase() === 'yes' ||
    String(row.aldosterone_not_used_elevated_creatinine).toLowerCase() === 'yes' ||
    (String(row.aldosterone_not_used_other).toLowerCase() === 'yes' && /hyperkal|creat|renal|hyponatr/i.test(row.aldosterone_not_used_other_reason || ''))
  ) ? 1 : 0;

  const contraArni = (creat > 2.5 || k > 5.5 || sbp < 100 || diagText.includes('angioedema')) ? 1 : 0;"""

content = content.replace(old_block.replace('\n', '\r\n'), new_block.replace('\n', '\r\n'))
content = content.replace(old_block, new_block)

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)
print('Successfully patched backend/services/gdmtService.js')

