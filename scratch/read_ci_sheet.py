import zipfile, xml.etree.ElementTree as ET

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

    # Sheet5 is Contraindications
    tree = ET.fromstring(z.read('xl/worksheets/sheet5.xml'))
    for r in tree.findall('.//{http://schemas.openxmlformats.org/spreadsheetml/2006/main}row'):
        row_vals = []
        for c in r.findall('{http://schemas.openxmlformats.org/spreadsheetml/2006/main}c'):
            v = c.find('{http://schemas.openxmlformats.org/spreadsheetml/2006/main}v')
            val = v.text if v is not None else ''
            t = c.attrib.get('t')
            if t == 's' and val:
                val = shared_strings[int(val)]
            row_vals.append(val)
        print(row_vals)

