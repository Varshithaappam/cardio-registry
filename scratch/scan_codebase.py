import os
import re

backend_dir = r"backend"
frontend_dir = r"frontend/src"

print("--- AUDITING BACKEND & FRONTEND ---")

# 1. SQL Interpolation Scan
sql_interp = re.compile(r"SELECT|UPDATE|INSERT|DELETE|FROM|WHERE", re.IGNORECASE)
string_interp = re.compile(r"`[^`]*\${[^}]+}[^`]*`")

print("\n--- [1] SQL String Interpolation Check ---")
for root, dirs, files in os.walk(backend_dir):
    if "node_modules" in root:
        continue
    for file in files:
        if file.endswith(".js"):
            filepath = os.path.join(root, file)
            with open(filepath, "r", encoding="utf-8", errors="ignore") as f:
                lines = f.readlines()
                for idx, line in enumerate(lines, 1):
                    if string_interp.search(line) and sql_interp.search(line):
                        print(f"{filepath}:{idx}: {line.strip()[:120]}")

# 2. Hardcoded JWT Secret / Credentials Check
print("\n--- [2] Hardcoded Credentials & Secrets Check ---")
secret_pattern = re.compile(r"(['\"])(cardio_registry_[^'\"]+|Admin123!|secret[1-9]*)\1")
for root, dirs, files in os.walk("."):
    if any(x in root for x in ["node_modules", ".git", "dist", "build"]):
        continue
    for file in files:
        if file.endswith((".js", ".jsx", ".json", ".env")):
            filepath = os.path.join(root, file)
            with open(filepath, "r", encoding="utf-8", errors="ignore") as f:
                lines = f.readlines()
                for idx, line in enumerate(lines, 1):
                    if secret_pattern.search(line):
                        print(f"{filepath}:{idx}: {line.strip()[:120]}")

# 3. Unhandled Async Errors / Catch Blocks
print("\n--- [3] Empty Catch / Swallowed Error Scan ---")
catch_empty = re.compile(r"catch\s*\([^)]*\)\s*\{\s*\}")
for root, dirs, files in os.walk("."):
    if any(x in root for x in ["node_modules", ".git", "dist", "build"]):
        continue
    for file in files:
        if file.endswith((".js", ".jsx")):
            filepath = os.path.join(root, file)
            with open(filepath, "r", encoding="utf-8", errors="ignore") as f:
                content = f.read()
                matches = catch_empty.finditer(content)
                for m in matches:
                    print(f"{filepath}: Empty catch block found around pos {m.start()}")
