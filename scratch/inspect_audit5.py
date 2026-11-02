import openpyxl

wb = openpyxl.load_workbook('scratch/latest_audit.xlsx', data_only=False)
print("Sheet names:", wb.sheetnames)

# Inspect Sheet1 headers
ws1 = wb['Sheet1']
headers = [ws1.cell(1, col).value for col in range(1, ws1.max_column + 1)]
for idx, h in enumerate(headers):
    if any(k in str(h) for k in ['Beta blocker', 'ACE', 'ARB', 'ARNI', 'MRA', 'SGLT2', 'Deviation', 'adhered']):
        print(f"Col {idx+1} ({openpyxl.utils.get_column_letter(idx+1)}): {h}")

print("\n--- Sheet1 Data (Row 2 to 6) ---")
for r in range(2, min(7, ws1.max_row + 1)):
    uhid = ws1.cell(r, 2).value
    bb_ci = ws1.cell(r, 82).value
    ace_ci = ws1.cell(r, 83).value
    arb_ci = ws1.cell(r, 84).value
    arni_ci = ws1.cell(r, 85).value
    mra_ci = ws1.cell(r, 86).value
    sglt2_ci = ws1.cell(r, 87).value
    print(f"Row {r} (UHID {uhid}): BB_CI={bb_ci}, ACE_CI={ace_ci}, ARB_CI={arb_ci}, ARNI_CI={arni_ci}, MRA_CI={mra_ci}, SGLT2_CI={sglt2_ci}")

# Inspect CI Flags sheet
if 'CI Flags' in wb.sheetnames:
    ws_ci = wb['CI Flags']
    ci_headers = [ws_ci.cell(1, col).value for col in range(1, ws_ci.max_column + 1)]
    print("\n--- CI Flags Headers ---")
    for idx, h in enumerate(ci_headers):
        print(f"Col {idx+1} ({openpyxl.utils.get_column_letter(idx+1)}): {h}")

    print("\n--- CI Flags Data (Row 2 to 6) ---")
    for r in range(2, min(7, ws_ci.max_row + 1)):
        row_vals = [ws_ci.cell(r, col).value for col in range(1, ws_ci.max_column + 1)]
        print(f"CI Row {r}: {row_vals}")

# Also check with data_only=True
wb_val = openpyxl.load_workbook('scratch/latest_audit.xlsx', data_only=True)
ws1_val = wb_val['Sheet1']
print("\n--- Sheet1 Cached Values (Row 2 to 6) ---")
for r in range(2, min(7, ws1_val.max_row + 1)):
    uhid = ws1_val.cell(r, 2).value
    bb_ci = ws1_val.cell(r, 82).value
    ace_ci = ws1_val.cell(r, 83).value
    arb_ci = ws1_val.cell(r, 84).value
    arni_ci = ws1_val.cell(r, 85).value
    mra_ci = ws1_val.cell(r, 86).value
    sglt2_ci = ws1_val.cell(r, 87).value
    print(f"Row {r} (UHID {uhid}): BB_CI={bb_ci}, ACE_CI={ace_ci}, ARB_CI={arb_ci}, ARNI_CI={arni_ci}, MRA_CI={mra_ci}, SGLT2_CI={sglt2_ci}")

