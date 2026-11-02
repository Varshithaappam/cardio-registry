import re

eval_path = r"backend/services/gdmtEvaluationService.js"

with open(eval_path, "r", encoding="utf-8") as f:
    eval_content = f.read()

# Replace diag_text
old_diag_text_pattern = re.compile(
    r"-- Clinical Diagnosis & Presentation Text Pool\s+LOWER\(CONCAT\([\s\S]*?\)\) AS diag_text,",
    re.MULTILINE
)

new_diag_text = """-- Clinical Diagnosis & Presentation Text Pool (strictly matches Export Sheet Column F)
        LOWER(CONCAT(
            ' ', ISNULL(ha.present_diagnosis, ''),
            ' ', CASE WHEN LOWER(LTRIM(RTRIM(ISNULL(ha.myocardial_ischemia, '')))) = 'yes' THEN 'myocardial ischemia ' ELSE '' END,
            ' ', CASE WHEN LOWER(LTRIM(RTRIM(ISNULL(ha.atrial_fibrillation, '')))) = 'yes' THEN 'atrial fibrillation ' ELSE '' END,
            ' ', CASE WHEN LOWER(LTRIM(RTRIM(ISNULL(ha.bradyarrhythmia, '')))) = 'yes' THEN 'bradyarrhythmia ' ELSE '' END,
            ' ', CASE WHEN LOWER(LTRIM(RTRIM(ISNULL(ha.ventricular_tachycardia, '')))) = 'yes' THEN 'ventricular tachycardia ' ELSE '' END,
            ' ', CASE WHEN LOWER(LTRIM(RTRIM(ISNULL(ha.uncontrolled_hypertension, '')))) = 'yes' THEN 'uncontrolled hypertension ' ELSE '' END,
            ' ', CASE WHEN LOWER(LTRIM(RTRIM(ISNULL(ha.infection, '')))) = 'yes' THEN 'infection ' ELSE '' END,
            ' ', CASE WHEN LOWER(LTRIM(RTRIM(ISNULL(ha.renal_failure, '')))) = 'yes' THEN 'renal failure ' ELSE '' END,
            ' ', CASE WHEN LOWER(LTRIM(RTRIM(ISNULL(ha.anaemia, '')))) = 'yes' THEN 'anaemia ' ELSE '' END,
            ' ', CASE WHEN LOWER(LTRIM(RTRIM(ISNULL(ha.medication_non_adherence, '')))) = 'yes' THEN 'medication non adherence ' ELSE '' END,
            ' ', CASE WHEN LOWER(LTRIM(RTRIM(ISNULL(ha.excessive_salt_intake, '')))) = 'yes' THEN 'excessive salt intake ' ELSE '' END,
            ' ', CASE WHEN LOWER(LTRIM(RTRIM(ISNULL(ha.excessive_water_ingestion, '')))) = 'yes' THEN 'excessive water ingestion ' ELSE '' END,
            ' ', CASE WHEN LOWER(LTRIM(RTRIM(ISNULL(ha.progressive_worsening, '')))) = 'yes' THEN 'progressive worsening ' ELSE '' END,
            ' ', ISNULL(ha.precipitating_other, ''),
            ' ', ISNULL(ia.previous_diagnosis, ''),
            ' ', CASE WHEN LOWER(LTRIM(RTRIM(ISNULL(fa.diabetes_mellitus, '')))) = 'yes' THEN 'diabetes mellitus ' ELSE '' END,
            ' ', CASE WHEN LOWER(LTRIM(RTRIM(ISNULL(fa.hypertension, '')))) = 'yes' THEN 'hypertension ' ELSE '' END,
            ' ', CASE WHEN LOWER(LTRIM(RTRIM(ISNULL(fa.renal_failure, '')))) = 'yes' THEN 'renal failure ckd ' ELSE '' END,
            ' ', CASE WHEN LOWER(LTRIM(RTRIM(ISNULL(fa.cad, '')))) = 'yes' THEN 'cad coronary artery disease ' ELSE '' END
        )) AS diag_text,"""

eval_content, count1 = old_diag_text_pattern.subn(new_diag_text, eval_content, count=1)
print(f"diag_text replaced: {count1}")

# Replace Contraindications block in PillarEvaluated
old_ci_pattern = re.compile(
    r"-- ==============================================================\s+-- EXACT CONTRAINDICATION RULES MATCHING REGISTRY QUERY[\s\S]*?THEN 1 ELSE 0 \s+END AS ci_sglt2,",
    re.MULTILINE
)

new_ci = """-- ==============================================================
        -- EXACT CONTRAINDICATION RULES MATCHING EXPORT SHEET CI FLAGS
        -- ==============================================================

        -- 1. Beta Blocker CI: Flag H || Flag I || Flag K || Flag L || Flag P
        CASE 
            WHEN (hr_bpm IS NOT NULL AND hr_bpm < 50)
                 OR (sbp IS NOT NULL AND sbp < 90)
                 OR diag_text LIKE '%shock%' 
                 OR meds_text LIKE '%dobutamine%' OR meds_text LIKE '%dobu%' OR meds_text LIKE '%norad%'
                 OR diag_text LIKE '%asthma%' OR diag_text LIKE '%copd%' OR diag_text LIKE '%bronch%'
                 OR diag_text LIKE '%av block%' OR diag_text LIKE '%heart block%' OR diag_text LIKE '%chb%' OR diag_text LIKE '%sick sinus%' OR diag_text LIKE '%brady%'
            THEN 1 ELSE 0 
        END AS ci_bb,

        -- 2. ACE Inhibitor CI: Flag I || Flag M || Flag O
        CASE 
            WHEN (sbp IS NOT NULL AND sbp < 90)
                 OR (k_val IS NOT NULL AND k_val > 5.5) OR diag_text LIKE '%hyperkal%'
                 OR (creat IS NOT NULL AND creat > 2.5) OR diag_text LIKE '%renal%' OR diag_text LIKE '%ckd%'
            THEN 1 ELSE 0 
        END AS ci_ace,

        -- 3. ARB CI: Flag I || Flag M || Flag O
        CASE 
            WHEN (sbp IS NOT NULL AND sbp < 90)
                 OR (k_val IS NOT NULL AND k_val > 5.5) OR diag_text LIKE '%hyperkal%'
                 OR (creat IS NOT NULL AND creat > 2.5) OR diag_text LIKE '%renal%' OR diag_text LIKE '%ckd%'
            THEN 1 ELSE 0 
        END AS ci_arb,

        -- 4. ARNI CI: Flag J || Flag M || Flag O
        CASE 
            WHEN (sbp IS NOT NULL AND sbp < 100)
                 OR (k_val IS NOT NULL AND k_val > 5.5) OR diag_text LIKE '%hyperkal%'
                 OR (creat IS NOT NULL AND creat > 2.5) OR diag_text LIKE '%renal%' OR diag_text LIKE '%ckd%'
            THEN 1 ELSE 0 
        END AS ci_arni,

        -- 5. MRA CI: Flag N || Flag O
        CASE 
            WHEN (k_val IS NOT NULL AND k_val > 5.0) OR diag_text LIKE '%hyperkal%'
                 OR (creat IS NOT NULL AND creat > 2.5) OR diag_text LIKE '%renal%' OR diag_text LIKE '%ckd%'
            THEN 1 ELSE 0 
        END AS ci_mra,

        -- 6. SGLT2 Inhibitor CI: Flag Q || Flag R || Flag S
        CASE 
            WHEN diag_text LIKE '%dka%' OR diag_text LIKE '%ketoacid%'
                 OR diag_text LIKE '%uti%' OR diag_text LIKE '%urosepsis%'
                 OR (creat IS NOT NULL AND creat > 3.0)
            THEN 1 ELSE 0 
        END AS ci_sglt2,"""

eval_content, count2 = old_ci_pattern.subn(new_ci, eval_content, count=1)
print(f"ci block replaced: {count2}")

with open(eval_path, "w", encoding="utf-8") as f:
    f.write(eval_content)

