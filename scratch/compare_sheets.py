import zipfile, xml.etree.ElementTree as ET, sys

sys.stdout.reconfigure(encoding='utf-8')

def get_sheet_names(xlsx_path):
    with zipfile.ZipFile(xlsx_path, 'r') as z:
        wb_tree = ET.fromstring(z.read('xl/workbook.xml'))
        sheets = []
        for s in wb_tree.findall('.//{http://schemas.openxmlformats.org/spreadsheetml/2006/main}sheet'):
            sheets.append(s.attrib['name'])
        return sheets

ref_path = r'C:\Users\ADMIN\Desktop\projects\cardio-registry\dashboard forms and formulae.xlsx'
exp_path = r'C:\Users\ADMIN\AppData\Local\Temp\audit_temp.xlsx'

ref_sheets = get_sheet_names(ref_path)
exp_sheets = get_sheet_names(exp_path)

print('=== REFERENCE SHEETS (dashboard forms and formulae.xlsx) ===')
print(ref_sheets)
print('\n=== EXPORT SHEETS (HF_GDMT_Adherence_Audit) ===')
print(exp_sheets)

# Compare sheet by sheet
print('\n=== SHEET EXISTENCE COMPARISON ===')
all_sheets = set(ref_sheets).union(set(exp_sheets))
for s in ref_sheets:
    if s in exp_sheets:
        print(f"✓ Sheet '{s}' is present in both.")
    else:
        print(f"✗ Sheet '{s}' is MISSING in export!")

for s in exp_sheets:
    if s not in ref_sheets:
        print(f"+ Sheet '{s}' is EXTRA in export (not in reference).")

