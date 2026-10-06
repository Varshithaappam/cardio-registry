import os
import re

print("=== DEEP CODEBASE AUDIT SCANNER ===")

backend_routes_dir = r"backend/routes"
frontend_src_dir = r"frontend/src"

# 1. Audit Route Authentication Coverage
print("\n--- [A] ROUTE AUTHENTICATION AUDIT ---")
for file in os.listdir(backend_routes_dir):
    if file.endswith(".js"):
        filepath = os.path.join(backend_routes_dir, file)
        with open(filepath, "r", encoding="utf-8") as f:
            content = f.read()
            lines = content.splitlines()
            unauth_routes = []
            for idx, line in enumerate(lines, 1):
                if re.search(r"router\.(get|post|put|patch|delete)\s*\(", line):
                    if "authenticateToken" not in line and "passport" not in line and "public" not in line:
                        unauth_routes.append((idx, line.strip()))
            if unauth_routes:
                print(f"\nFile: {filepath} ({len(unauth_routes)} unauthenticated routes)")
                for line_no, rtext in unauth_routes[:10]: # show first 10
                    print(f"  L{line_no}: {rtext[:100]}")

# 2. Audit App.js Route Mount Conflicts
print("\n--- [B] EXPRESS APP.JS ROUTE MOUNTING ISSUES ---")
app_js = r"backend/app.js"
if os.path.exists(app_js):
    with open(app_js, "r", encoding="utf-8") as f:
        content = f.read()
        lines = content.splitlines()
        for idx, line in enumerate(lines, 1):
            if "app.use" in line or "app.get" in line or "app.patch" in line or "app.put" in line:
                print(f"  L{idx}: {line.strip()}")

# 3. Check Date Parsing and Timezone Issues in Frontend
print("\n--- [C] FRONTEND TIMEZONE / ISO DATE ISSUES ---")
iso_date_pattern = re.compile(r"toISOString\(\)\.split\(['\"]T['\"]\)")
for root, dirs, files in os.walk(frontend_src_dir):
    for file in files:
        if file.endswith((".js", ".jsx")):
            filepath = os.path.join(root, file)
            with open(filepath, "r", encoding="utf-8", errors="ignore") as f:
                lines = f.readlines()
                for idx, line in enumerate(lines, 1):
                    if iso_date_pattern.search(line):
                        print(f"  {filepath}:L{idx}: {line.strip()[:100]}")

# 4. Check Frontend Console Errors & Unhandled Promises
print("\n--- [D] UNHANDLED PROMISE / TRY-CATCH AUDIT IN FRONTEND ---")
async_fn = re.compile(r"async\s+\([^\)]*\)\s*=>|async\s+function")
for root, dirs, files in os.walk(frontend_src_dir):
    for file in files:
        if file.endswith((".js", ".jsx")):
            filepath = os.path.join(root, file)
            with open(filepath, "r", encoding="utf-8", errors="ignore") as f:
                content = f.read()
                if "axios" in content or "fetch" in content:
                    if "try" not in content and ".catch" not in content:
                        print(f"  API call in {filepath} missing try/catch or .catch()!")
