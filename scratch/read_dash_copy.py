import openpyxl

wb = openpyxl.load_workbook('scratch/dash_copy.xlsx', data_only=True)
print("Sheets:", wb.sheetnames)

for sheet_name in ['Data Sheet', 'Sheet1', 'sheet 1']:
    if sheet_name in wb.sheetnames:
        ws = wb[sheet_name]
        headers = [ws.cell(1, col).value for col in range(1, ws.max_column + 1)]
        print(f"\nFound sheet: {sheet_name}")
        for idx, h in enumerate(headers):
            if any(k in str(h) for k in ['Beta blocker', 'ACE', 'ARB', 'ARNI', 'MRA', 'SGLT2']):
                vals = [ws.cell(r, idx+1).value for r in range(2, min(10, ws.max_row + 1))]
                print(f"Col {idx+1} ({openpyxl.utils.get_column_letter(idx+1)}) - {h}: {vals}")

if 'CI Flags' in wb.sheetnames:
    ws_ci = wb['CI Flags']
    headers = [ws_ci.cell(1, col).value for col in range(1, ws_ci.max_column + 1)]
    print("\nCI Flags Sheet:")
    for idx, h in enumerate(headers):
        vals = [ws_ci.cell(r, idx+1).value for r in range(2, min(10, ws_ci.max_row + 1))]
        print(f"Col {idx+1} ({openpyxl.utils.get_column_letter(idx+1)}) - {h}: {vals}")

