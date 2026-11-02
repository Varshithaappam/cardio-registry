import os

path = r'backend\services\gdmtEvaluationService.js'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Add other_reason fields to RawPool
old_pool = """        t1.arb_other_name,
        t3.other_medication_1_name,

        -- Form Contraindication Checkboxes
        t1.beta_not_used_bradycardia,
        t1.beta_not_used_heart_blocks,
        t1.beta_not_used_copd_asthma,
        t1.beta_not_used_hypotension,
        t1.beta_not_used_other,

        t1.ace_not_used_elevated_creatinine,
        t1.ace_not_used_hyperkalemia,
        t1.ace_not_used_cough,
        t1.ace_not_used_hypotension,
        t1.ace_not_used_other,

        t1.arb_not_used_elevated_creatinine,
        t1.arb_not_used_hyperkalemia,
        t1.arb_not_used_hypotension,
        t1.arb_not_used_other,

        t1.aldosterone_not_used_hyperkalemia,
        t1.aldosterone_not_used_hyponatremia,
        t1.aldosterone_not_used_elevated_creatinine,
        t1.aldosterone_not_used_other,"""

new_pool = """        t1.arb_other_name,
        t3.other_medication_1_name,
        t3.other_medication_2_name,
        t3.other_medication_3_name,
        t3.other_medication_4_name,

        -- Form Contraindication Checkboxes & Reasons
        t1.beta_not_used_bradycardia,
        t1.beta_not_used_heart_blocks,
        t1.beta_not_used_copd_asthma,
        t1.beta_not_used_hypotension,
        t1.beta_not_used_other,
        t1.beta_not_used_other_reason,

        t1.ace_not_used_elevated_creatinine,
        t1.ace_not_used_hyperkalemia,
        t1.ace_not_used_cough,
        t1.ace_not_used_hypotension,
        t1.ace_not_used_other,
        t1.ace_not_used_other_reason,

        t1.arb_not_used_elevated_creatinine,
        t1.arb_not_used_hyperkalemia,
        t1.arb_not_used_hypotension,
        t1.arb_not_used_other,
        t1.arb_not_used_other_reason,

        t1.aldosterone_not_used_hyperkalemia,
        t1.aldosterone_not_used_hyponatremia,
        t1.aldosterone_not_used_elevated_creatinine,
        t1.aldosterone_not_used_other,
        t1.aldosterone_not_used_other_reason,"""

content = content.replace(old_pool.replace('\n', '\r\n'), new_pool.replace('\n', '\r\n'))
content = content.replace(old_pool, new_pool)

# 2. Fix rx_arni (remove plain valsartan)
old_rx_arni = """        -- 4. ARNI Prescribed (Includes Valsartan & Sacubitril brand names)
        CASE 
            WHEN LOWER(LTRIM(RTRIM(ISNULL(valsartan, '')))) IN ('yes', '1', 'true')
                 OR LOWER(ISNULL(arb_other_name, '')) LIKE '%sacubitril%'
                 OR LOWER(ISNULL(arb_other_name, '')) LIKE '%entresto%'
                 OR LOWER(ISNULL(arb_other_name, '')) LIKE '%cidmus%'
                 OR LOWER(ISNULL(other_medication_1_name, '')) LIKE '%sacubitril%'
                 OR LOWER(ISNULL(other_medication_1_name, '')) LIKE '%entresto%'
                 OR LOWER(ISNULL(other_medication_1_name, '')) LIKE '%cidmus%'
                 OR LOWER(ISNULL(other_medication_1_name, '')) LIKE '%arni%'
            THEN 1 ELSE 0 
        END AS rx_arni,"""

new_rx_arni = """        -- 4. ARNI Prescribed (Sacubitril / Valsartan combinations, Entresto, Cidmus, Vymada, Arney, Sacurise)
        CASE 
            WHEN LOWER(ISNULL(arb_other_name, '')) LIKE '%sacubitril%'
                 OR LOWER(ISNULL(arb_other_name, '')) LIKE '%entresto%'
                 OR LOWER(ISNULL(arb_other_name, '')) LIKE '%cidmus%'
                 OR LOWER(ISNULL(arb_other_name, '')) LIKE '%vymada%'
                 OR LOWER(ISNULL(arb_other_name, '')) LIKE '%arney%'
                 OR LOWER(ISNULL(arb_other_name, '')) LIKE '%sacurise%'
                 OR meds_text LIKE '%sacubitril%'
                 OR meds_text LIKE '%entresto%'
                 OR meds_text LIKE '%cidmus%'
                 OR meds_text LIKE '%vymada%'
                 OR meds_text LIKE '%arney%'
                 OR meds_text LIKE '%sacurise%'
            THEN 1 ELSE 0 
        END AS rx_arni,"""

content = content.replace(old_rx_arni.replace('\n', '\r\n'), new_rx_arni.replace('\n', '\r\n'))
content = content.replace(old_rx_arni, new_rx_arni)

# 3. Fix rx_sglt2 (remove artificial modulo and check all meds_text)
old_rx_sglt2 = """        -- 6. SGLT2 Inhibitor Prescribed
        CASE 
            WHEN LOWER(ISNULL(other_medication_1_name, '')) LIKE '%dapa%'
                 OR LOWER(ISNULL(other_medication_1_name, '')) LIKE '%oxra%'
                 OR LOWER(ISNULL(other_medication_1_name, '')) LIKE '%empagli%'
                 OR LOWER(ISNULL(other_medication_1_name, '')) LIKE '%forxiga%'
                 OR LOWER(ISNULL(other_medication_1_name, '')) LIKE '%jardiance%'
                 OR (LOWER(ISNULL(has_dm, 0)) = 1 AND hf_id % 4 = 0)
            THEN 1 ELSE 0 
        END AS rx_sglt2,"""

new_rx_sglt2 = """        -- 6. SGLT2 Inhibitor Prescribed
        CASE 
            WHEN meds_text LIKE '%dapa%'
                 OR meds_text LIKE '%forxiga%'
                 OR meds_text LIKE '%oxra%'
                 OR meds_text LIKE '%empagli%'
                 OR meds_text LIKE '%jardiance%'
                 OR meds_text LIKE '%gibi%'
                 OR meds_text LIKE '%cana%'
                 OR meds_text LIKE '%invokana%'
            THEN 1 ELSE 0 
        END AS rx_sglt2,"""

content = content.replace(old_rx_sglt2.replace('\n', '\r\n'), new_rx_sglt2.replace('\n', '\r\n'))
content = content.replace(old_rx_sglt2, new_rx_sglt2)

# 4. Fix contraindications (remove unconditional _other, fix ARNI SBP to 100, add angioedema)
old_ci = """        -- 1. Beta Blocker CI (Including shock, dobutamine, noradrenaline, and sick sinus syndrome)
        CASE 
            WHEN LOWER(ISNULL(beta_not_used_bradycardia, '')) IN ('yes', '1', 'true')
                 OR LOWER(ISNULL(beta_not_used_heart_blocks, '')) IN ('yes', '1', 'true')
                 OR LOWER(ISNULL(beta_not_used_copd_asthma, '')) IN ('yes', '1', 'true')
                 OR LOWER(ISNULL(beta_not_used_hypotension, '')) IN ('yes', '1', 'true')
                 OR LOWER(ISNULL(beta_not_used_other, '')) IN ('yes', '1', 'true')
                 OR ISNULL(hr_bpm, 72) < 50
                 OR ISNULL(sbp, 120) < 90
                 OR diag_text LIKE '%shock%'
                 OR meds_text LIKE '%dobutamine%' OR meds_text LIKE '%dobu%' OR meds_text LIKE '%norad%' OR meds_text LIKE '%noradrenaline%'
                 OR diag_text LIKE '%sick sinus%'
                 OR diag_text LIKE '%av block%' OR diag_text LIKE '%heart block%' OR diag_text LIKE '%chb%'
            THEN 1 ELSE 0 
        END AS ci_bb,

        -- 2. ACE Inhibitor CI
        CASE 
            WHEN LOWER(ISNULL(ace_not_used_elevated_creatinine, '')) IN ('yes', '1', 'true')
                 OR LOWER(ISNULL(ace_not_used_hyperkalemia, '')) IN ('yes', '1', 'true')
                 OR LOWER(ISNULL(ace_not_used_cough, '')) IN ('yes', '1', 'true')
                 OR LOWER(ISNULL(ace_not_used_hypotension, '')) IN ('yes', '1', 'true')
                 OR LOWER(ISNULL(ace_not_used_other, '')) IN ('yes', '1', 'true')
                 OR ISNULL(creat, 1.1) > 2.5
                 OR ISNULL(k_val, 4.2) > 5.5
                 OR ISNULL(sbp, 120) < 90
            THEN 1 ELSE 0 
        END AS ci_ace,

        -- 3. ARB CI
        CASE 
            WHEN LOWER(ISNULL(arb_not_used_elevated_creatinine, '')) IN ('yes', '1', 'true')
                 OR LOWER(ISNULL(arb_not_used_hyperkalemia, '')) IN ('yes', '1', 'true')
                 OR LOWER(ISNULL(arb_not_used_hypotension, '')) IN ('yes', '1', 'true')
                 OR LOWER(ISNULL(arb_not_used_other, '')) IN ('yes', '1', 'true')
                 OR ISNULL(creat, 1.1) > 2.5
                 OR ISNULL(k_val, 4.2) > 5.5
                 OR ISNULL(sbp, 120) < 90
            THEN 1 ELSE 0 
        END AS ci_arb,

        -- 4. ARNI CI
        CASE 
            WHEN ISNULL(creat, 1.1) > 2.5
                 OR ISNULL(k_val, 4.2) > 5.5
                 OR ISNULL(sbp, 120) < 90
            THEN 1 ELSE 0 
        END AS ci_arni,

        -- 5. MRA CI
        CASE 
            WHEN LOWER(ISNULL(aldosterone_not_used_hyperkalemia, '')) IN ('yes', '1', 'true')
                 OR LOWER(ISNULL(aldosterone_not_used_hyponatremia, '')) IN ('yes', '1', 'true')
                 OR LOWER(ISNULL(aldosterone_not_used_elevated_creatinine, '')) IN ('yes', '1', 'true')
                 OR LOWER(ISNULL(aldosterone_not_used_other, '')) IN ('yes', '1', 'true')
                 OR ISNULL(creat, 1.1) > 2.5
                 OR ISNULL(k_val, 4.2) > 5.0
            THEN 1 ELSE 0 
        END AS ci_mra,"""

new_ci = """        -- 1. Beta Blocker CI (Including shock, dobutamine, noradrenaline, and sick sinus syndrome)
        CASE 
            WHEN LOWER(ISNULL(beta_not_used_bradycardia, '')) IN ('yes', '1', 'true')
                 OR LOWER(ISNULL(beta_not_used_heart_blocks, '')) IN ('yes', '1', 'true')
                 OR LOWER(ISNULL(beta_not_used_copd_asthma, '')) IN ('yes', '1', 'true')
                 OR LOWER(ISNULL(beta_not_used_hypotension, '')) IN ('yes', '1', 'true')
                 OR (
                     LOWER(ISNULL(beta_not_used_other, '')) IN ('yes', '1', 'true')
                     AND (
                         LOWER(ISNULL(beta_not_used_other_reason, '')) LIKE '%brady%'
                         OR LOWER(ISNULL(beta_not_used_other_reason, '')) LIKE '%heart block%'
                         OR LOWER(ISNULL(beta_not_used_other_reason, '')) LIKE '%av block%'
                         OR LOWER(ISNULL(beta_not_used_other_reason, '')) LIKE '%hypoten%'
                         OR LOWER(ISNULL(beta_not_used_other_reason, '')) LIKE '%shock%'
                         OR LOWER(ISNULL(beta_not_used_other_reason, '')) LIKE '%asthma%'
                         OR LOWER(ISNULL(beta_not_used_other_reason, '')) LIKE '%copd%'
                     )
                 )
                 OR ISNULL(hr_bpm, 72) < 50
                 OR ISNULL(sbp, 120) < 90
                 OR diag_text LIKE '%shock%'
                 OR meds_text LIKE '%dobutamine%' OR meds_text LIKE '%dobu%' OR meds_text LIKE '%norad%' OR meds_text LIKE '%noradrenaline%'
                 OR diag_text LIKE '%sick sinus%'
                 OR diag_text LIKE '%av block%' OR diag_text LIKE '%heart block%' OR diag_text LIKE '%chb%'
            THEN 1 ELSE 0 
        END AS ci_bb,

        -- 2. ACE Inhibitor CI
        CASE 
            WHEN LOWER(ISNULL(ace_not_used_elevated_creatinine, '')) IN ('yes', '1', 'true')
                 OR LOWER(ISNULL(ace_not_used_hyperkalemia, '')) IN ('yes', '1', 'true')
                 OR LOWER(ISNULL(ace_not_used_cough, '')) IN ('yes', '1', 'true')
                 OR LOWER(ISNULL(ace_not_used_hypotension, '')) IN ('yes', '1', 'true')
                 OR (
                     LOWER(ISNULL(ace_not_used_other, '')) IN ('yes', '1', 'true')
                     AND (
                         LOWER(ISNULL(ace_not_used_other_reason, '')) LIKE '%hyperkal%'
                         OR LOWER(ISNULL(ace_not_used_other_reason, '')) LIKE '%creat%'
                         OR LOWER(ISNULL(ace_not_used_other_reason, '')) LIKE '%renal%'
                         OR LOWER(ISNULL(ace_not_used_other_reason, '')) LIKE '%angioedema%'
                         OR LOWER(ISNULL(ace_not_used_other_reason, '')) LIKE '%cough%'
                         OR LOWER(ISNULL(ace_not_used_other_reason, '')) LIKE '%hypoten%'
                     )
                 )
                 OR ISNULL(creat, 1.1) > 2.5
                 OR ISNULL(k_val, 4.2) > 5.5
                 OR ISNULL(sbp, 120) < 90
                 OR diag_text LIKE '%angioedema%'
            THEN 1 ELSE 0 
        END AS ci_ace,

        -- 3. ARB CI
        CASE 
            WHEN LOWER(ISNULL(arb_not_used_elevated_creatinine, '')) IN ('yes', '1', 'true')
                 OR LOWER(ISNULL(arb_not_used_hyperkalemia, '')) IN ('yes', '1', 'true')
                 OR LOWER(ISNULL(arb_not_used_hypotension, '')) IN ('yes', '1', 'true')
                 OR (
                     LOWER(ISNULL(arb_not_used_other, '')) IN ('yes', '1', 'true')
                     AND (
                         LOWER(ISNULL(arb_not_used_other_reason, '')) LIKE '%hyperkal%'
                         OR LOWER(ISNULL(arb_not_used_other_reason, '')) LIKE '%creat%'
                         OR LOWER(ISNULL(arb_not_used_other_reason, '')) LIKE '%renal%'
                         OR LOWER(ISNULL(arb_not_used_other_reason, '')) LIKE '%hypoten%'
                     )
                 )
                 OR ISNULL(creat, 1.1) > 2.5
                 OR ISNULL(k_val, 4.2) > 5.5
                 OR ISNULL(sbp, 120) < 90
            THEN 1 ELSE 0 
        END AS ci_arb,

        -- 4. ARNI CI (Stricter SBP < 100 mmHg and angioedema)
        CASE 
            WHEN ISNULL(creat, 1.1) > 2.5
                 OR ISNULL(k_val, 4.2) > 5.5
                 OR ISNULL(sbp, 120) < 100
                 OR diag_text LIKE '%angioedema%'
            THEN 1 ELSE 0 
        END AS ci_arni,

        -- 5. MRA CI
        CASE 
            WHEN LOWER(ISNULL(aldosterone_not_used_hyperkalemia, '')) IN ('yes', '1', 'true')
                 OR LOWER(ISNULL(aldosterone_not_used_hyponatremia, '')) IN ('yes', '1', 'true')
                 OR LOWER(ISNULL(aldosterone_not_used_elevated_creatinine, '')) IN ('yes', '1', 'true')
                 OR (
                     LOWER(ISNULL(aldosterone_not_used_other, '')) IN ('yes', '1', 'true')
                     AND (
                         LOWER(ISNULL(aldosterone_not_used_other_reason, '')) LIKE '%hyperkal%'
                         OR LOWER(ISNULL(aldosterone_not_used_other_reason, '')) LIKE '%creat%'
                         OR LOWER(ISNULL(aldosterone_not_used_other_reason, '')) LIKE '%renal%'
                         OR LOWER(ISNULL(aldosterone_not_used_other_reason, '')) LIKE '%hyponatr%'
                     )
                 )
                 OR ISNULL(creat, 1.1) > 2.5
                 OR ISNULL(k_val, 4.2) > 5.0
            THEN 1 ELSE 0 
        END AS ci_mra,"""

content = content.replace(old_ci.replace('\n', '\r\n'), new_ci.replace('\n', '\r\n'))
content = content.replace(old_ci, new_ci)

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)
print('Successfully patched backend/services/gdmtEvaluationService.js')

