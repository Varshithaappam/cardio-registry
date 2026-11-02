import zipfile, xml.etree.ElementTree as ET

path = r'C:\Users\ADMIN\AppData\Local\Temp\audit_temp.xlsx'
with zipfile.ZipFile(path, 'r') as z:
    # Read shared strings
    shared_strings = []
    if 'xl/sharedStrings.xml' in z.namelist():
        tree = ET.fromstring(z.read('xl/sharedStrings.xml'))
        for si in tree.findall('{http://schemas.openxmlformats.org/spreadsheetml/2006/main}si'):
            t = si.find('{http://schemas.openxmlformats.org/spreadsheetml/2006/main}t')
            if t is not None:
                shared_strings.append(t.text or '')
            else:
                # might have r/t
                text = ''.join(rt.text or '' for rt in si.findall('.//{http://schemas.openxmlformats.org/spreadsheetml/2006/main}t'))
                shared_strings.append(text)

    # Read workbook to find sheet names
    wb_tree = ET.fromstring(z.read('xl/workbook.xml'))
    sheets = {}
    for s in wb_tree.findall('.//{http://schemas.openxmlformats.org/spreadsheetml/2006/main}sheet'):
        sheets[s.attrib['name']] = s.attrib['sheetId'], s.attrib['{http://schemas.openxmlformats.org/officeDocument/2006/relationships}id']
    print('Sheets in workbook:', sheets)

    # Read rels
    rels_tree = ET.fromstring(z.read('xl/_rels/workbook.xml.rels'))
    sheet_files = {}
    for r in rels_tree.findall('{http://schemas.openxmlformats.org/package/2006/relationships}Relationship'):
        sheet_files[r.attrib['Id']] = r.attrib['Target']
    print('Sheet files:', sheet_files)

    def parse_sheet(sheet_name):
        r_id = sheets[sheet_name][1]
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
                val = v.text if v is not None else ''
                t = c.attrib.get('t')
                if t == 's' and val:
                    val = shared_strings[int(val)]
                row_dict[col] = val
            rows.append(row_dict)
        return rows

    # Let's inspect Sheet1
    sheet1_rows = parse_sheet('Sheet1')
    print('Sheet1 total rows:', len(sheet1_rows))
    header = sheet1_rows[0]
    row1 = sheet1_rows[1] if len(sheet1_rows) > 1 else {}
    print('--- Sheet1 Row 1 Header & Values ---')
    for col in sorted(header.keys(), key=lambda c: (len(c), c)):
        h_val = header.get(col, '')
        r_val = row1.get(col, '')
        if 'ARB' in h_val or 'Contraindication' in h_val or 'Deviation' in h_val or 'Blood pressure' in h_val or 'Creatinine' in h_val or 'Potassium' in h_val or 'SL No' in h_val or 'UHID' in h_val:
            print(f"Col {col}: {h_val} = {r_val}")

    # Let's inspect CI Flags
    if 'CI Flags' in sheets:
        ci_rows = parse_sheet('CI Flags')
        print('\n--- CI Flags Sheet ---')
        ci_h = ci_rows[0]
        ci_r1 = ci_rows[1] if len(ci_rows) > 1 else {}
        for col in sorted(ci_h.keys(), key=lambda c: (len(c), c)):
            print(f"CI Col {col}: {ci_h.get(col, '')} = {ci_r1.get(col, '')}")

