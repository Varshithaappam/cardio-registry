import openpyxl
from datetime import datetime

wb = openpyxl.load_workbook('varshitha.xlsx', data_only=True)

def parse_date(d):
    if not d: return None
    if isinstance(d, datetime): return d
    for fmt in ('%Y-%m-%d', '%d-%m-%Y', '%d/%m/%Y', '%Y/%m/%d'):
        try:
            return datetime.strptime(str(d).strip(), fmt)
        except:
            pass
    return None

def calc_los(adm_str, dis_str):
    d1 = parse_date(adm_str)
    d2 = parse_date(dis_str)
    if d1 and d2:
        diff = (d2 - d1).days
        return max(diff, 1) # at least 1 day if discharged same/next day
    return 0

# 1. STEMI Analysis
ws_stemi = wb['stemi']
stemi_rows = list(ws_stemi.iter_rows(values_only=True))
st_headers = [str(h).strip() for h in stemi_rows[0]]
stemi_data = [{st_headers[i]: r[i] for i in range(len(st_headers))} for r in stemi_rows[1:]]

# 2. NSTEMI Analysis
ws_nstemi = wb['nstemi']
nstemi_rows = list(ws_nstemi.iter_rows(values_only=True))
nst_headers = [str(h).strip() for h in nstemi_rows[0]]
nstemi_data = [{nst_headers[i]: r[i] for i in range(len(nst_headers))} for r in nstemi_rows[1:]]

# 3. HF Analysis
ws_hf = wb['hf']
hf_rows = list(ws_hf.iter_rows(values_only=True))
hf_headers = [str(h).strip() for h in hf_rows[0]]
hf_data = [{hf_headers[i]: r[i] for i in range(len(hf_headers))} for r in hf_rows[1:]]

print(f"Total Rows: HF={len(hf_data)}, STEMI={len(stemi_data)}, NSTEMI={len(nstemi_data)}")

# Hospital Days Calculation
total_los = 0
print("\n--- STEMI ENCOUNTERS ---")
for idx, r in enumerate(stemi_data, 1):
    los = calc_los(r.get('Date of Admission'), r.get('Date of Discharge'))
    total_los += los
    print(f"STEMI #{idx}: ACS={r.get('ACS No / Registry No')}, Adm={r.get('Date of Admission')}, Dis={r.get('Date of Discharge')}, LOS={los} days, Strategy={r.get('Strategy')}, Culprit={r.get('Culprit Vessel')}, Thrombolysis={r.get('Thrombolytic Agents')}, TIMI={r.get('TIMI Score')}")

print("\n--- NSTEMI ENCOUNTERS ---")
for idx, r in enumerate(nstemi_data, 1):
    los = calc_los(r.get('Date of Admission'), r.get('Date of Discharge'))
    total_los += los
    print(f"NSTEMI #{idx}: ACS={r.get('ACS No / Registry No')}, Adm={r.get('Date of Admission')}, Dis={r.get('Date of Discharge')}, LOS={los} days, Strategy={r.get('Strategy')}, Culprit={r.get('Culprit Vessel')}, Thrombolysis={r.get('Thrombolytic Agents')}, TIMI={r.get('TIMI Score')}")

print("\n--- HF ENCOUNTERS ---")
for idx, r in enumerate(hf_data, 1):
    adm = r.get('Date of visit/hospitalization')
    dis = r.get('Discharge Date')
    los = calc_los(adm, dis)
    total_los += los
    ef = r.get('EF%')
    diag = r.get('Present diagnosis')
    hfid = r.get('HF ID')
    print(f"HF #{idx}: ID={hfid}, Adm={adm}, Dis={dis}, LOS={los} days, EF={ef}%, Diag={diag}")

print(f"\nTotal Calculated Hospital Days across all Varshitha records: {total_los} days")
