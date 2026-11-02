import zipfile, xml.etree.ElementTree as ET, sys

sys.stdout.reconfigure(encoding='utf-8')

path = r'C:\Users\ADMIN\AppData\Local\Temp\audit_temp.xlsx'
with zipfile.ZipFile(path, 'r') as z:
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

    # Sheet3 is Sheet1
    tree = ET.fromstring(z.read('xl/worksheets/sheet3.xml'))
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

    h = rows[0]
    r1 = rows[1]
    for col in sorted(h.keys(), key=lambda c: (len(c), c)):
        print(f"{col} | {h.get(col, '')} : {r1.get(col, '')}")
