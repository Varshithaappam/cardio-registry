import openpyxl

wb_val = openpyxl.load_workbook('scratch/latest_audit.xlsx', data_only=True)
ws_ci = wb_val['CI Flags']
headers = [ws_ci.cell(1, col).value for col in range(1, ws_ci.max_column + 1)]

print("--- CI Flags Evaluated / Cached Values ---")
for r in range(2, min(7, ws_ci.max_row + 1)):
    print(f"\nRow {r}:")
    for col in range(1, ws_ci.max_column + 1):
        h = headers[col - 1]
        val = ws_ci.cell(r, col).value
        print(f"  {openpyxl.utils.get_column_letter(col)} ({h}): {repr(val)}")

ws1 = wb_val['Sheet1']
print("\n--- Sheet1 Source Values for Row 2 ---")
print("AF2 (BP sitting):", repr(ws1['AF2'].value))
print("AB2 (Heart rate):", repr(ws1['AB2'].value))
print("BK2 (Potassium):", repr(ws1['BK2'].value))
print("BL2 (Creatinine):", repr(ws1['BL2'].value))
print("P2:", repr(ws1['P2'].value))
print("S2:", repr(ws1['S2'].value))
print("T2:", repr(ws1['T2'].value))
print("U2:", repr(ws1['U2'].value))
print("X2:", repr(ws1['X2'].value))
print("AO2:", repr(ws1['AO2'].value))
print("AP2:", repr(ws1['AP2'].value))
print("AQ2:", repr(ws1['AQ2'].value))
print("AR2:", repr(ws1['AR2'].value))
print("BT2:", repr(ws1['BT2'].value))
print("BU2:", repr(ws1['BU2'].value))

print("\n--- Sheet1 Source Values for Row 6 ---")
print("AF6 (BP sitting):", repr(ws1['AF6'].value))
print("AB6 (Heart rate):", repr(ws1['AB6'].value))
print("BK6 (Potassium):", repr(ws1['BK6'].value))
print("BL6 (Creatinine):", repr(ws1['BL6'].value))
print("P6:", repr(ws1['P6'].value))
print("S6:", repr(ws1['S6'].value))
print("T6:", repr(ws1['T6'].value))
print("U6:", repr(ws1['U6'].value))
print("X6:", repr(ws1['X6'].value))
print("AO6:", repr(ws1['AO6'].value))
print("AP6:", repr(ws1['AP6'].value))
print("AQ6:", repr(ws1['AQ6'].value))
print("AR6:", repr(ws1['AR6'].value))
print("BT6:", repr(ws1['BT6'].value))
print("BU6:", repr(ws1['BU6'].value))

