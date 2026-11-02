import zipfile, xml.etree.ElementTree as ET, sys

sys.stdout.reconfigure(encoding='utf-8')

def parse_full_sheet(xlsx_path, sheet_name):
    with zipfile.ZipFile(xlsx_path, 'r') as z:
        # shared strings
        shared_strings = []
        if 'xl/sharedStrings.xml' in z.namelist():
            tree = ET.fromstring(z.read('xl/sharedStrings.xml'))
            for si in tree.findall('{http://schemas.openxmlformats.org/spreadsheetml/2006/main}si'):
                t = si.find('{http://schemas.openxmlformats.org/spreadsheetml/2006/main}t')
                if t is not None:
                    shared_strings.append(t.text or '')
                else:
                    text = ''.join(rt.text or '' for rt in si.findall('.//{http://schemas.openxmlformats.org/spreadsheetml/2006/main}t'))
                    shared_strings.append(text)

        wb_tree = ET.fromstring(z.read('xl/workbook.xml'))
        sheets = {}
        for s in wb_tree.findall('.//{http://schemas.openxmlformats.org/spreadsheetml/2006/main}sheet'):
            sheets[s.attrib['name']] = s.attrib['sheetId'], s.attrib['{http://schemas.openxmlformats.org/officeDocument/2006/relationships}id']

        # Find target sheet case-insensitively
        target_key = None
        for k in sheets:
            if k.strip().lower() == sheet_name.strip().lower() or k.strip().lower().replace(' ', '') == sheet_name.strip().lower().replace(' ', ''):
                target_key = k
                break
        
        if not target_key:
            return None

        rels_tree = ET.fromstring(z.read('xl/_rels/workbook.xml.rels'))
        sheet_files = {}
        for r in rels_tree.findall('{http://schemas.openxmlformats.org/package/2006/relationships}Relationship'):
            sheet_files[r.attrib['Id']] = r.attrib['Target']

        r_id = sheets[target_key][1]
        target = sheet_files[r_id]
        if not target.startswith('xl/'):
            target = 'xl/' + target
        tree = ET.fromstring(z.read(target))
        rows = []
        for r in tree.findall('.//{http://schemas.openxmlformats.org/spreadsheetml/2006/main}row'):
            row_dict = {}
            for c in r.findall('{http://schemas.openxmlformats.org/spreadsheetml/2006/main}c'):
                ref = c.attrib['r']
                col = ''.join(filter(str.isalpha, ref))
                v = c.find('{http://schemas.openxmlformats.org/spreadsheetml/2006/main}v')
                f = c.find('{http://schemas.openxmlformats.org/spreadsheetml/2006/main}f')
                val = v.text if v is not None else ''
                t = c.attrib.get('t')
                if t == 's' and val:
                    val = shared_strings[int(val)]
                formula = f.text if f is not None else None
                row_dict[col] = (val, formula)
            rows.append(row_dict)
        return rows

ref_path = r'C:\Users\ADMIN\Desktop\projects\cardio-registry\dashboard forms and formulae.xlsx'
exp_path = r'C:\Users\ADMIN\AppData\Local\Temp\audit_temp.xlsx'

pairs = [
    ('sheet 1', 'Sheet1'),
    ('CI Flags', 'CI Flags'),
    ('Contraindications', 'Contraindications'),
    ('GDMT Summary', 'GDMT Summary'),
    ('key points', 'Key Points')
]

for ref_name, exp_name in pairs:
    print(f"\n=======================================================")
    print(f"COMPARING: Ref '{ref_name}' vs Export '{exp_name}'")
    print(f"=======================================================")
    r_rows = parse_full_sheet(ref_path, ref_name)
    e_rows = parse_full_sheet(exp_path, exp_name)
    
    if not r_rows:
        print(f"Ref '{ref_name}' not found!")
        continue
    if not e_rows:
        print(f"Exp '{exp_name}' not found!")
        continue

    print(f"Row counts -> Ref: {len(r_rows)} rows | Export: {len(e_rows)} rows")
    
    # Compare headers
    r_h = {k: v[0] for k, v in r_rows[0].items()} if r_rows else {}
    e_h = {k: v[0] for k, v in e_rows[0].items()} if e_rows else {}
    
    # If first row is a title row (e.g. key points or contraindications), check row 2 or 3
    if ref_name in ('Contraindications', 'key points', 'GDMT Summary') and len(r_rows) > 2:
        print(f"Ref Row 1: {[v[0] for v in r_rows[0].values()]}")
        print(f"Exp Row 1: {[v[0] for v in e_rows[0].values()]}")
        if len(r_rows) > 1:
            print(f"Ref Row 2: {[v[0] for v in r_rows[1].values()]}")
        if len(e_rows) > 1:
            print(f"Exp Row 2: {[v[0] for v in e_rows[1].values()]}")

    print(f"Column counts -> Ref: {len(r_h)} cols | Export: {len(e_h)} cols")

    # Column name comparison for Sheet1 and CI Flags
    if ref_name in ('sheet 1', 'CI Flags'):
        r_cols = [r_h.get(c, '') for c in sorted(r_h.keys(), key=lambda x: (len(x), x))]
        e_cols = [e_h.get(c, '') for c in sorted(e_h.keys(), key=lambda x: (len(x), x))]
        diffs = []
        max_len = max(len(r_cols), len(e_cols))
        for i in range(max_len):
            rc = r_cols[i] if i < len(r_cols) else '<MISSING>'
            ec = e_cols[i] if i < len(e_cols) else '<MISSING>'
            if rc != ec:
                diffs.append((i+1, rc, ec))
        if diffs:
            print(f"Header differences ({len(diffs)} columns differ):")
            for idx, rc, ec in diffs[:15]:
                print(f"  Col #{idx}: Ref='{rc}'  VS  Export='{ec}'")
            if len(diffs) > 15:
                print(f"  ... and {len(diffs)-15} more differences.")
        else:
            print("✓ All headers match 100% identically!")

