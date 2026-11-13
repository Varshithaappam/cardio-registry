import openpyxl
import json

wb = openpyxl.load_workbook('varshitha.xlsx', data_only=True)

def inspect_sheet(name):
    ws = wb[name]
    rows = list(ws.iter_rows(values_only=True))
    headers = [str(h).strip() if h is not None else f'col_{i}' for i, h in enumerate(rows[0])]
    print(f"=== {name.upper()} (Total rows: {len(rows)-1}) ===")
    records = []
    for idx, r in enumerate(rows[1:], 1):
        rec = {headers[i]: r[i] for i in range(min(len(headers), len(r)))}
        records.append(rec)
    return records

hf_records = inspect_sheet('hf')
for idx, rec in enumerate(hf_records, 1):
    print(f"HF #{idx}: ID={rec.get('HF ID')}, IP={rec.get('IP No(T3)')}, Adm={rec.get('Date of visit/hospitalization')}, Disch={rec.get('Discharge Date')}, EF={rec.get('EF%')}, HR={rec.get('Heart rate')}, BP={rec.get('Blood pressure sitting')}, K={rec.get('Lab tests Potassium')}, Cr={rec.get('Creatinine')}, Hb={rec.get('Hb')}, Diag={rec.get('Present diagnosis')}")

stemi_records = inspect_sheet('stemi')
for idx, rec in enumerate(stemi_records, 1):
    print(f"STEMI #{idx}: ACS={rec.get('ACS No / Registry No')}, IP={rec.get('IP No')}, Adm={rec.get('Date of Admission')}, Dis={rec.get('Date of Discharge')}, Vessel={rec.get('Culprit Vessel')}, TIMI={rec.get('TIMI Score')}, Flow={rec.get('TIMI Flow')}, D2B={rec.get('D2B (min)')}, D2N={rec.get('D2N (min)')}, Meds={rec.get('Medications')}")

nstemi_records = inspect_sheet('nstemi')
for idx, rec in enumerate(nstemi_records, 1):
    print(f"NSTEMI #{idx}: ACS={rec.get('ACS No / Registry No')}, IP={rec.get('IP No')}, Adm={rec.get('Date of Admission')}, Dis={rec.get('Date of Discharge')}, Vessel={rec.get('Culprit Vessel')}, TIMI={rec.get('TIMI Score')}, Flow={rec.get('TIMI Flow')}, D2B={rec.get('D2B (min)')}, Meds={rec.get('Medications')}")
