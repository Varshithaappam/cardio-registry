import re

eval_path = r"backend/services/gdmtEvaluationService.js"

with open(eval_path, "r", encoding="utf-8") as f:
    eval_content = f.read()

# Replace Flag O check in ci_ace, ci_arb, ci_arni, ci_mra
old_pattern = re.compile(
    r"OR \(creat IS NOT NULL AND creat > 2\.5\) OR diag_text LIKE '%renal%' OR diag_text LIKE '%ckd%'",
    re.MULTILINE
)

new_text = "OR (creat IS NOT NULL AND creat > 2.5)"

eval_content, count = old_pattern.subn(new_text, eval_content)
print(f"Replaced {count} occurrences in gdmtEvaluationService.js")

with open(eval_path, "w", encoding="utf-8") as f:
    f.write(eval_content)

