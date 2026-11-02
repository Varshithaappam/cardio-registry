import openpyxl

wb = openpyxl.load_workbook(r'C:\Users\ADMIN\Desktop\cardio-registry\dashboard forms and formulae.xlsx', data_only=True)
print("Sheets:", wb.sheetnames)

ws_data = None
for name in wb.sheetnames:
    if 'sheet1' in name.lower() or 'data' in name.lower():
        ws_data = wb[name]
        print(f"Using data sheet: {name}")
        break

if ws_data:
    # Check rows 2-10 in data sheet
    # Find columns for CI
    headers = [ws_data.cell(1, col).value for col in range(1, ws_data.max_column + 1)]
    for idx, h in enumerate(headers):
        if 'Known Contraindication' in str(h):
            print(f"Col {idx+1}: {h}")
            vals = [ws_data.cell(r, idx+1).value for r in range(2, min(12, ws_data.max_row + 1))]
            print(f"  First 10 values: {vals}")

# Also check CI Flags
ws_ci = None
for name in wb.sheetnames:
    if 'ci flags' in name.lower():
        ws_ci = wb[name]
        print(f"\nUsing CI Flags sheet: {name}")
        break

if ws_ci:
    ci_headers = [ws_ci.cell(1, col).value for col in range(1, ws_ci.max_column + 1)]
    for idx, h in enumerate(ci_headers):
        vals = [ws_ci.cell(r, idx+1).value for r in range(2, min(12, ws_ci.max_row + 1))]
        non_zeros = [v for v in vals if v not in (0, '0', None, '')]
        print(f"Col {idx+1} ({h}): non-zero samples={non_zeros[:3]}")

