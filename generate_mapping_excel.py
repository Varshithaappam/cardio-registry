import openpyxl
from openpyxl.styles import Font, PatternFill, Alignment, Border, Side
from openpyxl.utils import get_column_letter

def build_mapping_workbook(output_filename):
    wb = openpyxl.Workbook()
    # Remove default sheet
    wb.remove(wb.active)

    # Styling Palette
    FONT_FAMILY = "Segoe UI"
    
    # Fonts
    title_font = Font(name=FONT_FAMILY, size=16, bold=True, color="1E3A8A")
    subtitle_font = Font(name=FONT_FAMILY, size=10, italic=True, color="475569")
    section_font = Font(name=FONT_FAMILY, size=12, bold=True, color="1E3A8A")
    header_font = Font(name=FONT_FAMILY, size=11, bold=True, color="FFFFFF")
    cell_font = Font(name=FONT_FAMILY, size=10, color="1E293B")
    cell_bold_font = Font(name=FONT_FAMILY, size=10, bold=True, color="1E293B")
    code_font = Font(name="Consolas", size=9, color="0F172A")
    kpi_val_font = Font(name=FONT_FAMILY, size=14, bold=True, color="0F766E")

    # Fills
    header_fill = PatternFill(start_color="1E3A8A", end_color="1E3A8A", fill_type="solid") # Deep Navy
    subheader_fill = PatternFill(start_color="0284C7", end_color="0284C7", fill_type="solid") # Sky Blue
    accent_fill = PatternFill(start_color="EFF6FF", end_color="EFF6FF", fill_type="solid") # Ice Blue
    zebra_fill = PatternFill(start_color="F8FAFC", end_color="F8FAFC", fill_type="solid") # Slate light
    white_fill = PatternFill(start_color="FFFFFF", end_color="FFFFFF", fill_type="solid")
    tag_calc_fill = PatternFill(start_color="FEF3C7", end_color="FEF3C7", fill_type="solid") # Light Amber for Computed
    tag_raw_fill = PatternFill(start_color="DCFCE7", end_color="DCFCE7", fill_type="solid") # Light Green for Direct DB

    # Borders
    thin_border_side = Side(border_style="thin", color="CBD5E1")
    med_border_side = Side(border_style="medium", color="1E3A8A")
    border_cell = Border(left=thin_border_side, right=thin_border_side, top=thin_border_side, bottom=thin_border_side)
    border_header = Border(left=thin_border_side, right=thin_border_side, top=med_border_side, bottom=med_border_side)
    border_bottom_double = Border(left=thin_border_side, right=thin_border_side, top=thin_border_side, bottom=Side(border_style="double", color="1E3A8A"))

    # Alignments
    align_left = Alignment(horizontal="left", vertical="center", wrap_text=True)
    align_center = Alignment(horizontal="center", vertical="center", wrap_text=True)
    align_right = Alignment(horizontal="right", vertical="center")
    align_header = Alignment(horizontal="center", vertical="center", wrap_text=True)

    # =========================================================================
    # SHEET 1: Overview & Database Schema Summary
    # =========================================================================
    ws_ov = wb.create_sheet(title="Overview & DB Architecture")
    ws_ov.views.sheetView[0].showGridLines = True

    # Title Banner
    ws_ov.merge_cells("A1:G1")
    ws_ov["A1"] = "CARDIOLOGY HF REGISTRY & GDMT CLINICAL DASHBOARD MAPPING SPECIFICATION"
    ws_ov["A1"].font = title_font
    ws_ov["A1"].alignment = Alignment(horizontal="left", vertical="center")
    ws_ov.row_dimensions[1].height = 32

    ws_ov.merge_cells("A2:G2")
    ws_ov["A2"] = "Comprehensive cross-reference between 'dashboard forms and formulae.xlsx' and local MSSQL database 'local_schema and data.sql' (Database: care)"
    ws_ov["A2"].font = subtitle_font
    ws_ov.row_dimensions[2].height = 20

    # Section 1: Core Architecture & Joining Keys
    ws_ov["A4"] = "1. RELATIONAL DATABASE ARCHITECTURE & ENTITY RELATIONSHIP JOIN GRAPH"
    ws_ov["A4"].font = section_font
    
    join_headers = ["Source / Primary Entity", "Join Entity (Table)", "Primary Key / Foreign Key Join Condition", "Cardinality", "Clinical Domain / Purpose"]
    for col_idx, text in enumerate(join_headers, 1):
        cell = ws_ov.cell(5, col_idx, text)
        cell.font = header_font
        cell.fill = header_fill
        cell.alignment = align_header
        cell.border = border_header
    ws_ov.row_dimensions[5].height = 26

    joins_data = [
        ("hf_registry (Core HF Registry)", "patient_demographics", "hf_registry.reg_patient_id = patient_demographics.reg_patient_id", "1 : 1", "Master patient demographics (UHID, Name, DOB, Gender, IP No, Contacts)"),
        ("hf_registry", "hf_administrative", "hf_registry.hf_id = hf_administrative.hf_id", "1 : 1", "Encounter admission/discharge dates, cardiologist, insurer, admission reasons"),
        ("hf_registry", "hf_initial_assessment", "hf_registry.hf_id = hf_initial_assessment.hf_id", "1 : 1", "Vitals (BP, HR, RR, SpO2, Wt, Ht), signs/symptoms, medical/surgical history"),
        ("hf_registry", "hf_final_clinical_assessment", "hf_registry.hf_id = hf_final_clinical_assessment.hf_id", "1 : 1", "HF Phenotype (HFrEF/HFpEF), NYHA class, comorbidities (DM, HTN, CKD), MACE/Death"),
        ("hf_registry", "hf_cardiac_investigations", "hf_registry.hf_id = hf_cardiac_investigations.hf_id", "1 : 1", "Echo (EF%, RWMI), ECG (Q waves, QTc, rhythms, AV conduction blocks), Angiogram"),
        ("hf_registry", "hf_advanced_investigations", "hf_registry.hf_id = hf_advanced_investigations.hf_id", "1 : 1", "Holter monitoring, VT/NSVT, cardiac MRI, cardiopulmonary exercise testing"),
        ("hf_registry", "hf_lab_tests", "hf_registry.hf_id = hf_lab_tests.hf_id", "1 : 1", "Biomarkers & labs (Serum Potassium, Creatinine, Hemoglobin, BNP, NT-proBNP, Na)"),
        ("hf_registry", "hf_device_therapy", "hf_registry.hf_id = hf_device_therapy.hf_id", "1 : 1", "Implanted cardiac devices (CRT-D, CRT-P, ICD, Pacemakers), shock telemetry"),
        ("hf_registry", "hf_medical_therapy_part1", "hf_registry.hf_id = hf_medical_therapy_part1.hf_id", "1 : 1", "Beta blockers, ACEi, ARB, Aldosterone antagonists (MRA) & documented CI reasons"),
        ("hf_registry", "hf_medical_therapy_part2", "hf_registry.hf_id = hf_medical_therapy_part2.hf_id", "1 : 1", "Diuretics (Lasix, Torsemide, Metolazone), antiplatelets, anticoagulants, nitrates"),
        ("hf_registry", "hf_medical_therapy_part3", "hf_registry.hf_id = hf_medical_therapy_part3.hf_id", "1 : 1", "Statins (Atorva, Rosuva), Digoxin, Ivabradine, antidiabetics (Insulin, Metformin)"),
        ("patient_demographics", "hf_followup_records", "patient_demographics.reg_patient_id = hf_followup_records.reg_patient_id", "1 : N", "Longitudinal telephone/outreach follow-ups, post-discharge GDMT (ARNI, SGLT2i, MRA, BB)"),
        ("patient_demographics", "patient_identity_index", "patient_demographics.reg_patient_id = patient_identity_index.reg_patient_id", "1 : 1", "Normalized MPI deduplication tokens (Soundex, Hash of UHID, Phone, ABHA)")
    ]

    for r_idx, row in enumerate(joins_data, 6):
        fill = zebra_fill if r_idx % 2 == 0 else white_fill
        for c_idx, val in enumerate(row, 1):
            cell = ws_ov.cell(r_idx, c_idx, val)
            cell.font = code_font if c_idx == 3 else cell_font
            cell.fill = fill
            cell.border = border_cell
            cell.alignment = align_left if c_idx != 4 else align_center
        ws_ov.row_dimensions[r_idx].height = 22

    # Section 2: Workbook Navigation Guide
    nav_start_row = len(joins_data) + 8
    ws_ov.cell(nav_start_row, 1, "2. MAPPING WORKBOOK STRUCTURE & NAVIGATIONAL INDEX").font = section_font

    nav_headers = ["Sheet Tab Name", "Source Sheet in Dashboard Workbook", "Target DB Scope & Tables", "Mapped Elements", "Core Clinical & Analytical Functionality"]
    for col_idx, text in enumerate(nav_headers, 1):
        cell = ws_ov.cell(nav_start_row + 1, col_idx, text)
        cell.font = header_font
        cell.fill = subheader_fill
        cell.alignment = align_header
        cell.border = border_header
    ws_ov.row_dimensions[nav_start_row + 1].height = 24

    nav_data = [
        ("Sheet1 Mapping", "sheet 1 / sheet 1 formula", "patient_demographics, hf_administrative, hf_initial_assessment, hf_cardiac_investigations, hf_lab_tests, hf_final_clinical_assessment, hf_medical_therapy_part1/2/3, hf_device_therapy", "Columns A to CR (96 Columns)", "Patient-level registry ingestion, clinical demographics, baseline labs, 6-pillar drug intake, contraindication flags, individual deviation flags & adherence %"),
        ("CI Flags Mapping", "CI Flags / CI FLAGS FORMULAE", "hf_initial_assessment, hf_lab_tests, hf_administrative, hf_final_clinical_assessment, hf_medical_therapy_part1/2", "Columns A to S (19 Columns)", "Physiological safety rule engine (Bradycardia, Hypotension thresholds for BB/ACEi/ARB/ARNI, Shock/Inotropes, Asthma/COPD, Hyperkalaemia, Renal cutoffs, Heart Blocks, DKA, UTI)"),
        ("GDMT Summary Mapping", "GDMT Summary / GDMT FORMULA", "Derived aggregations from hf_registry, patient_demographics, hf_medical_therapy_part1, hf_followup_records", "Cohort KPI Aggregates & Distribution Grids", "Pillar uptake percentages (Beta blocker, ACEi, ARB, ARNI, MRA, SGLT2i), multi-drug therapy count distributions (0 to 4+ drugs), deviation breakdown, cohort adherence distribution"),
        ("Key Points Mapping", "key points / key points formula", "patient_demographics, hf_final_clinical_assessment, hf_cardiac_investigations, CI Flags, GDMT Summary", "55 Analytical Metric Parameters & Executive Insights", "Executive clinical report metrics: Age, Gender, HFrEF/HFpEF, Mean EF%, NYHA III/IV, Comorbidities, Mortality, Under-treatment vs Inappropriate prescription rates, Executive narrative synthesis")
    ]

    for r_idx, row in enumerate(nav_data, nav_start_row + 2):
        fill = zebra_fill if r_idx % 2 == 0 else white_fill
        for c_idx, val in enumerate(row, 1):
            cell = ws_ov.cell(r_idx, c_idx, val)
            cell.font = cell_bold_font if c_idx == 1 else cell_font
            cell.fill = fill
            cell.border = border_cell
            cell.alignment = align_left
        ws_ov.row_dimensions[r_idx].height = 28

    # Set column widths for Overview
    ws_ov.column_dimensions["A"].width = 28
    ws_ov.column_dimensions["B"].width = 30
    ws_ov.column_dimensions["C"].width = 45
    ws_ov.column_dimensions["D"].width = 25
    ws_ov.column_dimensions["E"].width = 50
    ws_ov.column_dimensions["F"].width = 20
    ws_ov.column_dimensions["G"].width = 20


    # =========================================================================
    # SHEET 2: Sheet1 Mapping (96 Columns)
    # =========================================================================
    ws_s1 = wb.create_sheet(title="Sheet1 Mapping")
    ws_s1.views.sheetView[0].showGridLines = True
    ws_s1.freeze_panes = "D3"

    ws_s1.merge_cells("A1:J1")
    ws_s1["A1"] = "DATA DICTIONARY & FIELD MAPPING: SHEET 1 (PATIENT REGISTRY COHORT MASTER)"
    ws_s1["A1"].font = title_font
    ws_s1["A1"].alignment = Alignment(horizontal="left", vertical="center")
    ws_s1.row_dimensions[1].height = 30

    s1_headers = [
        "Col Letter",
        "Col Index",
        "Dashboard Column Name",
        "Target Database Table",
        "Target Database Column(s)",
        "Data Type",
        "Mapping Type",
        "Extraction / Transformation Rule & SQL Expression",
        "Dashboard Formula / Dependency",
        "Clinical & Engineering Rationale"
    ]

    for col_idx, text in enumerate(s1_headers, 1):
        cell = ws_s1.cell(2, col_idx, text)
        cell.font = header_font
        cell.fill = header_fill
        cell.alignment = align_header
        cell.border = border_header
    ws_s1.row_dimensions[2].height = 28

    sheet1_mapping_rows = [
        ("A", 1, "12583.0 / Record ID", "hf_registry", "hf_id", "INT", "Direct DB", "hf_registry.hf_id", "None", "Surrogate primary key of the heart failure registry record"),
        ("B", 2, "UHID(T3)", "patient_demographics", "uhid", "VARCHAR(50)", "Direct DB", "patient_demographics.uhid", "None", "Unique Hospital Identification (UHID) issued by T3 hospital HIS"),
        ("C", 3, "IP No(T3)", "patient_demographics", "ip_no", "VARCHAR(10)", "Direct DB", "patient_demographics.ip_no", "None", "Inpatient admission encounter number from T3 HIS"),
        ("D", 4, "IP No(Prosoft)", "hf_administrative", "care_mr_no", "VARCHAR(50)", "Direct DB", "hf_administrative.care_mr_no", "None", "Secondary institutional Medical Record / Prosoft IP Number"),
        ("E", 5, "PINCODE", "patient_demographics", "pincode", "VARCHAR(10)", "Direct DB", "patient_demographics.pincode", "None", "Residential postal area code for geographical demographic analysis"),
        ("F", 6, "Patient name", "patient_demographics", "patient_name", "VARCHAR(150)", "Direct DB", "patient_demographics.patient_name", "None", "Full legal patient name recorded at registration"),
        ("G", 7, "Age", "patient_demographics", "date_of_birth", "INT (Derived)", "Calculated", "DATEDIFF(YEAR, patient_demographics.date_of_birth, hf_administrative.visit_date)", "None", "Calculated patient age in years at date of admission"),
        ("H", 8, "Gender", "patient_demographics", "gender", "NVARCHAR(6)", "Direct DB", "patient_demographics.gender", "None", "Biological gender ('Male', 'Female', 'Other')"),
        ("I", 9, "Contact no 1", "patient_demographics", "phone_no", "VARCHAR(15)", "Direct DB", "patient_demographics.phone_no", "None", "Primary patient contact mobile telephone number"),
        ("J", 10, "Contact no 2", "hf_administrative", "caregiver_phone", "VARCHAR(15)", "Direct DB", "hf_administrative.caregiver_phone", "None", "Secondary emergency or caregiver telephone number"),
        ("K", 11, "Payment", "hf_administrative", "insurance_mode", "NVARCHAR(24)", "Direct DB", "hf_administrative.insurance_mode", "None", "Payer classification ('Cash', 'Insurance', 'PMJAY', 'Arogyasri')"),
        ("L", 12, "Caregiver Name&Relationship to patient", "hf_administrative", "caregiver_name, caregiver_relationship", "VARCHAR(200)", "Concatenated", "CONCAT(hf_administrative.caregiver_name, ' (', hf_administrative.caregiver_relationship, ')')", "None", "Nominated relative or caregiver name and relationship"),
        ("M", 13, "Treating Cardiologist", "hf_administrative", "treating_cardiologist", "VARCHAR(100)", "Direct DB", "hf_administrative.treating_cardiologist", "None", "Primary attending cardiologist responsible for clinical care"),
        ("N", 14, "Date of visit/hospitalization", "hf_administrative", "visit_date", "DATE", "Direct DB", "hf_administrative.visit_date", "None", "Index date of hospitalization or outpatient heart failure consultation"),
        ("O", 15, "Discharge Date", "hf_administrative", "discharge_date", "DATE", "Direct DB", "hf_administrative.discharge_date", "None", "Formal hospital discharge date ending inpatient encounter"),
        ("P", 16, "Present diagnosis", "hf_administrative", "present_diagnosis", "NVARCHAR(MAX)", "Direct DB", "hf_administrative.present_diagnosis", "None", "Primary clinical presentation diagnosis (e.g., 'ADHF/SEV.LVD/SOB')"),
        ("Q", 17, "Reasons for Admission1", "hf_administrative", "admission_reason", "VARCHAR(100)", "Direct DB", "hf_administrative.admission_reason", "None", "Primary clinical etiology prompting acute admission (e.g., 'Ischemic')"),
        ("R", 18, "Reasons for Admission2", "hf_administrative", "other_admission_reason", "NVARCHAR(MAX)", "Direct DB", "hf_administrative.other_admission_reason", "None", "Secondary clinical symptom prompting admission (e.g., 'SOB' / Dyspnea)"),
        ("S", 19, "Reasons for admission3", "hf_administrative", "renal_failure, other_reason", "VARCHAR(100)", "Direct DB", "COALESCE(hf_administrative.other_reason, CASE WHEN hf_administrative.renal_failure='Yes' THEN 'Renal Failure' END)", "None", "Tertiary decompensation trigger or organ failure manifestation"),
        ("T", 20, "Reasons other than HF", "hf_administrative", "other_reason_details", "NVARCHAR(MAX)", "Direct DB", "hf_administrative.other_reason_details", "None", "Non-cardiac precipitating causes (infections, metabolic decompensation)"),
        ("U", 21, "Previous Diagnosis", "hf_initial_assessment", "previous_diagnosis", "NVARCHAR(MAX)", "Direct DB", "hf_initial_assessment.previous_diagnosis", "None", "Documented pre-existing chronic conditions (e.g., 'DM/HTN/S/P CABG/CKD')"),
        ("V", 22, "Medical History", "hf_initial_assessment", "history_cabg, history_ptca, history_stroke, history_past_mi", "VARCHAR(255)", "Concatenated", "CONCAT_WS(', ', CASE WHEN history_cabg='Yes' THEN 'CABG' END, CASE WHEN history_ptca='Yes' THEN 'PTCA' END, CASE WHEN history_past_mi='Yes' THEN 'Past MI' END)", "None", "Prior cardiovascular surgical, interventional, or ischemic events"),
        ("W", 23, "Recent hospitalization date", "hf_initial_assessment", "recent_hospitalization_dates", "NVARCHAR(255)", "Direct DB", "hf_initial_assessment.recent_hospitalization_dates", "None", "Dates of any previous hospital admissions within past 6 to 12 months"),
        ("X", 24, "Reason for hospitalization", "hf_initial_assessment", "recent_hospitalization_reasons", "NVARCHAR(MAX)", "Direct DB", "hf_initial_assessment.recent_hospitalization_reasons", "None", "Documented diagnoses for preceding hospital admissions"),
        ("Y", 25, "VT/VF risk assessment", "hf_initial_assessment", "documented_vt_vf, complaints_syncope_presyncope, documented_pvcs, documented_nsvt", "VARCHAR(200)", "Derived", "Comma-separated positive names: 'Documented episode of VT/VF', 'Complaints of Syncope / Pre-syncope', 'Documented PVCs', 'Documented NSVT' (or 'No')", "None", "Malignant ventricular arrhythmogenic risk stratifier"),
        ("Z", 26, "Weight", "hf_initial_assessment", "weight", "DECIMAL(5,2)", "Direct DB", "hf_initial_assessment.weight", "None", "Patient body weight in kilograms measured at baseline"),
        ("AA", 27, "Height", "hf_initial_assessment", "height", "DECIMAL(5,2)", "Direct DB", "hf_initial_assessment.height", "None", "Patient height in meters or feet/inches measured at baseline"),
        ("AB", 28, "Heart rate", "hf_initial_assessment", "heart_rate", "INT", "Direct DB", "hf_initial_assessment.heart_rate", "None", "Resting heart rate in beats per minute (bpm)"),
        ("AC", 29, "Heart rate variability", "hf_initial_assessment", "heart_rate_regular, heart_rate_irregular", "VARCHAR(20)", "Derived", "CASE WHEN heart_rate_regular='Yes' THEN 'Regular' WHEN heart_rate_irregular='Yes' THEN 'Irregular' ELSE 'Unspecified' END", "None", "Pulse rhythm regularity or variability assessment"),
        ("AD", 30, "Respiratory rate", "hf_initial_assessment", "respiratory_rate", "INT", "Direct DB", "hf_initial_assessment.respiratory_rate", "None", "Baseline resting respiratory rate (breaths per minute)"),
        ("AE", 31, "O₂ Saturation (%)", "hf_initial_assessment", "oxygen_saturation", "DECIMAL(4,1)", "Direct DB", "hf_initial_assessment.oxygen_saturation", "None", "Pulse oximetry arterial oxygen saturation percentage (SpO2 %)"),
        ("AF", 32, "Blood pressure sitting", "hf_initial_assessment", "systolic_bp_sitting, diastolic_bp_sitting", "VARCHAR(20)", "Concatenated", "CONCAT(hf_initial_assessment.systolic_bp_sitting, '/', hf_initial_assessment.diastolic_bp_sitting)", "None", "Seated arterial blood pressure reading (SBP/DBP mmHg)"),
        ("AG", 33, "Blood pressure standing", "hf_initial_assessment", "systolic_bp_standing, diastolic_bp_standing", "VARCHAR(20)", "Concatenated", "CONCAT(hf_initial_assessment.systolic_bp_standing, '/', hf_initial_assessment.diastolic_bp_standing)", "None", "Standing arterial blood pressure reading for orthostatic evaluation"),
        ("AH", 34, "Mental status", "hf_initial_assessment", "mental_status_alert_oriented, mental_status_confused, mental_status_drowsy", "VARCHAR(30)", "Derived", "CASE WHEN mental_status_alert_oriented='Yes' THEN 'Alert/oriented' WHEN mental_status_confused='Yes' THEN 'Confused' WHEN mental_status_drowsy='Yes' THEN 'Drowsy' END", "None", "Neurological consciousness and orientation assessment"),
        ("AI", 35, "Symptoms1", "hf_initial_assessment", "dyspnea_at_rest, dyspnea_with_exertion", "VARCHAR(50)", "Derived", "CASE WHEN dyspnea_at_rest='Yes' THEN 'Dyspnea at rest' WHEN dyspnea_with_exertion='Yes' THEN 'Dyspnea with exertion' END", "None", "Primary exertional / rest respiratory symptom"),
        ("AJ", 36, "Symptoms2", "hf_initial_assessment", "fatigue, orthopnea, pnd", "VARCHAR(50)", "Derived", "CASE WHEN orthopnea='Yes' THEN 'Orthopnea' WHEN pnd='Yes' THEN 'PND' WHEN fatigue='Yes' THEN 'Fatigue' END", "None", "Secondary clinical heart failure symptom"),
        ("AK", 37, "Symptoms3", "hf_initial_assessment", "syncope, giddiness, muscle_cramps, symptom_other_details", "VARCHAR(50)", "Derived", "COALESCE(symptom_other_details, CASE WHEN syncope='Yes' THEN 'Syncope' WHEN giddiness='Yes' THEN 'Giddiness' END)", "None", "Tertiary or neurocardiogenic symptom"),
        ("AL", 38, "Clinical signs of volume overload1", "hf_initial_assessment", "peripheral_edema, ascites", "VARCHAR(50)", "Derived", "CASE WHEN peripheral_edema='Yes' THEN 'Peripheral Edema' WHEN ascites='Yes' THEN 'Ascites' END", "None", "Primary sign of systemic venous congestion"),
        ("AM", 39, "Clinical signs of volume overload2", "hf_initial_assessment", "rales, jugular_venous_pressure, hepatomegaly", "VARCHAR(50)", "Derived", "CASE WHEN rales='Yes' THEN 'Rales' WHEN jugular_venous_pressure='Yes' THEN 'Elevated JVP' WHEN hepatomegaly='Yes' THEN 'Hepatomegaly' END", "None", "Secondary sign of pulmonary or central venous congestion"),
        ("AN", 40, "Type of Heart failure", "hf_final_clinical_assessment", "hfref, hfpef", "VARCHAR(10)", "Derived", "CASE WHEN hfref='Yes' THEN 'HFrEF' WHEN hfpef='Yes' THEN 'HFpEF' ELSE 'HFmrEF' END", "None", "Heart failure phenotype classification (HFrEF <=40%, HFmrEF 41-49%, HFpEF >=50%)"),
        ("AO", 41, "Comorbidities1", "hf_final_clinical_assessment", "hypertension", "VARCHAR(50)", "Derived", "CASE WHEN hf_final_clinical_assessment.hypertension='Yes' OR patient_demographics.hypertension='Yes' THEN 'Hypertension' END", "None", "Primary vascular comorbidity flag"),
        ("AP", 42, "Comorbidities2", "hf_final_clinical_assessment", "cad, valvular_disease", "VARCHAR(50)", "Derived", "CASE WHEN cad='Yes' THEN 'Coronary Artery Disease' WHEN valvular_disease='Yes' THEN 'Valvular Disease' END", "None", "Structural / ischemic cardiac comorbidity"),
        ("AQ", 43, "Comorbidities3", "hf_final_clinical_assessment", "diabetes_mellitus", "VARCHAR(50)", "Derived", "CASE WHEN hf_final_clinical_assessment.diabetes_mellitus='Yes' OR patient_demographics.diabetes='Yes' THEN 'Diabetes mellitus' END", "None", "Metabolic comorbidity flag"),
        ("AR", 44, "Comorbidities4", "hf_final_clinical_assessment", "renal_failure, copd, asthma, anemia", "VARCHAR(50)", "Derived", "CASE WHEN renal_failure='Yes' THEN 'Renal Failure' WHEN copd='Yes' THEN 'COPD' WHEN asthma='Yes' THEN 'Asthma' WHEN anemia='Yes' THEN 'Anemia' END", "None", "Extracardiac chronic organ disease"),
        ("AS", 45, "Risk factors1", "hf_final_clinical_assessment", "smoking, alcohol, risk_factor_other_details", "VARCHAR(50)", "Derived", "CASE WHEN smoking='Yes' THEN 'Smoking' WHEN alcohol='Yes' THEN 'Alcohol' ELSE risk_factor_other_details END", "None", "Behavioral / lifestyle cardiovascular risk factors"),
        ("AT", 46, "Stage of HF", "hf_final_clinical_assessment", "stage_a, stage_b, stage_c, stage_d", "VARCHAR(5)", "Derived", "CASE WHEN stage_d='Yes' THEN 'D' WHEN stage_c='Yes' THEN 'C' WHEN stage_b='Yes' THEN 'B' WHEN stage_a='Yes' THEN 'A' END", "None", "ACC/AHA heart failure progressive staging classification"),
        ("AU", 47, "Functional Status", "hf_final_clinical_assessment", "nyha_class_1, nyha_class_2, nyha_class_3, nyha_class_4", "VARCHAR(20)", "Derived", "CASE WHEN nyha_class_4='Yes' THEN 'NYHA class IV' WHEN nyha_class_3='Yes' THEN 'NYHA class III' WHEN nyha_class_2='Yes' THEN 'NYHA class II' WHEN nyha_class_1='Yes' THEN 'NYHA class I' END", "None", "New York Heart Association symptomatic functional capacity class"),
        ("AV", 48, "AF status", "hf_final_clinical_assessment", "af_permanent, af_paroxysmal, af_persistent, af_nsr", "VARCHAR(20)", "Derived", "CASE WHEN af_permanent='Yes' THEN 'Permanent AF' WHEN af_paroxysmal='Yes' THEN 'Paroxysmal AF' WHEN af_persistent='Yes' THEN 'Persistent AF' WHEN af_nsr='Yes' THEN 'NSR' END", "None", "Atrial fibrillation / normal sinus rhythm status"),
        ("AW", 49, "Major adverse cardiac events (Y/N)", "hf_final_clinical_assessment", "mace_hospitalization, mace_stroke, mace_major_bleed, mace_severe_arrhythmia, mace_major_procedure, mace_death", "VARCHAR(5)", "Derived", "CASE WHEN 'Yes' IN (mace_hospitalization, mace_stroke, mace_major_bleed, mace_severe_arrhythmia, mace_major_procedure, mace_death) THEN 'YES' ELSE 'NO' END", "None", "Composite MACE occurrence flag during episode"),
        ("AX", 50, "Major adverse cardiac events ( unstructured )", "hf_final_clinical_assessment", "mace_other_details, hosp_note, stroke_note, bleed_note, arrhythmia_note", "NVARCHAR(MAX)", "Concatenated", "CONCAT_WS('; ', mace_other_details, hosp_note, stroke_note, bleed_note, arrhythmia_note)", "None", "Free-text narrative detailing adverse clinical outcomes"),
        ("AY", 51, "Major procedures(if any specify)", "hf_final_clinical_assessment", "procedure_note, mace_major_procedure", "NVARCHAR(MAX)", "Direct DB", "hf_final_clinical_assessment.procedure_note", "None", "Invasive or surgical cardiac procedures performed during stay"),
        ("AZ", 52, "Death", "hf_final_clinical_assessment", "mace_death", "VARCHAR(5)", "Derived", "CASE WHEN mace_death='Yes' OR death_date IS NOT NULL THEN 'YES' ELSE 'NO' END", "None", "All-cause in-hospital or 30-day mortality flag"),
        ("BA", 53, "Death Date", "hf_final_clinical_assessment", "death_date", "DATE", "Direct DB", "hf_final_clinical_assessment.death_date", "None", "Certified date of death recorded in registry or HIS"),
        ("BB", 54, "Location of Death", "hf_final_clinical_assessment", "death_hospital, death_home", "VARCHAR(30)", "Derived", "CASE WHEN death_hospital='Yes' THEN 'Hospital' WHEN death_home='Yes' THEN 'Home' ELSE 'Other' END", "None", "Physical location where patient expired"),
        ("BC", 55, "ECG Q waves", "hf_cardiac_investigations", "ecg_qwaves_yes, ecg_qwaves_none", "VARCHAR(5)", "Derived", "CASE WHEN ecg_qwaves_yes='Yes' THEN 'yes' ELSE 'no' END", "None", "Pathological ECG Q-waves signifying previous transmural infarction"),
        ("BD", 56, "Q waves Leads", "hf_cardiac_investigations", "ecg_qwave_leads", "VARCHAR(100)", "Direct DB", "hf_cardiac_investigations.ecg_qwave_leads", "None", "Specific anatomical ECG leads exhibiting pathological Q waves"),
        ("BE", 57, "Any blockages", "hf_cardiac_investigations", "ecg_lbbb, ecg_rbbb, ecg_block_other, ecg_block_other_details", "VARCHAR(50)", "Derived", "CASE WHEN ecg_lbbb = 'Yes' THEN 'lbbb' WHEN ecg_rbbb = 'Yes' THEN 'rbbb' WHEN ecg_block_other = 'Yes' THEN COALESCE(ecg_block_other_details, 'Other') ELSE 'No' END", "None", "Presence of ECG conduction blockages (lbbb, rbbb, or ecg_block_other_details)"),
        ("BF", 58, "QT", "hf_cardiac_investigations", "ecg_qt", "DECIMAL(6,2)", "Direct DB", "hf_cardiac_investigations.ecg_qt", "None", "Uncorrected electrical ventricular repolarization QT interval (ms)"),
        ("BG", 59, "QTC", "hf_cardiac_investigations", "ecg_qtc", "DECIMAL(6,2)", "Direct DB", "hf_cardiac_investigations.ecg_qtc", "None", "Heart-rate corrected QT interval (Bazett/Fridericia formula) (ms)"),
        ("BH", 60, "ECHO(RWMI)", "hf_cardiac_investigations", "rwmi_none, rwmi_global, rwmi_anterior, rwmi_lateral, rwmi_inferior", "VARCHAR(30)", "Derived", "CASE WHEN rwmi_global='Yes' THEN 'Global' WHEN rwmi_anterior='Yes' THEN 'Anterior' WHEN rwmi_inferior='Yes' THEN 'Inferior' WHEN rwmi_lateral='Yes' THEN 'Lateral' ELSE 'None' END", "None", "Echocardiographic regional wall motion abnormality distribution"),
        ("BI", 61, "EF%", "hf_cardiac_investigations", "echo_ef", "DECIMAL(5,2)", "Direct DB", "hf_cardiac_investigations.echo_ef", "None", "Left ventricular ejection fraction percentage measured by 2D Echocardiography"),
        ("BJ", 62, "Holter/Event Recorder", "hf_advanced_investigations", "holter_test_date, ventricular_arrhythmia_yes", "VARCHAR(5)", "Derived", "CASE WHEN holter_test_date IS NOT NULL OR ventricular_arrhythmia_yes='Yes' THEN 'YES' ELSE 'NO' END", "None", "Execution of 24/48-hour ambulatory continuous ECG telemetry"),
        ("BK", 63, "Lab tests Potassium", "hf_lab_tests", "potassium_result", "DECIMAL(4,2)", "Direct DB", "TRY_CAST(hf_lab_tests.potassium_result AS DECIMAL(4,2))", "None", "Baseline serum potassium electrolyte level (mmol/L or mEq/L)"),
        ("BL", 64, "Creatinine", "hf_lab_tests", "creatinine_result", "DECIMAL(4,2)", "Direct DB", "TRY_CAST(hf_lab_tests.creatinine_result AS DECIMAL(4,2))", "None", "Baseline serum creatinine renal function biomarker (mg/dL)"),
        ("BM", 65, "Hb", "hf_lab_tests", "hb_result", "DECIMAL(4,1)", "Direct DB", "TRY_CAST(hf_lab_tests.hb_result AS DECIMAL(4,1))", "None", "Blood hemoglobin concentration (g/dL)"),
        ("BN", 66, "BNP", "hf_lab_tests", "bnp_result", "DECIMAL(8,2)", "Direct DB", "TRY_CAST(hf_lab_tests.bnp_result AS DECIMAL(8,2))", "None", "B-type Natriuretic Peptide heart failure neurohormonal biomarker (pg/mL)"),
        ("BO", 67, "Sodium", "hf_lab_tests", "sodium_result", "DECIMAL(5,1)", "Direct DB", "TRY_CAST(hf_lab_tests.sodium_result AS DECIMAL(5,1))", "None", "Serum sodium electrolyte level (mmol/L)"),
        ("BP", 68, "Uric acid", "hf_lab_tests", "other_lab_test_name, other_lab_test_result", "DECIMAL(5,2)", "Derived", "CASE WHEN other_lab_test_name LIKE '%uric%' THEN TRY_CAST(other_lab_test_result AS DECIMAL(5,2)) END", "None", "Serum uric acid level for hyperuricemia / gout monitoring (mg/dL)"),
        ("BQ", 69, "Total Cholesterol", "hf_lab_tests", "other_lab_test_name, other_lab_test_result", "DECIMAL(6,2)", "Derived", "CASE WHEN other_lab_test_name LIKE '%cholesterol%' THEN TRY_CAST(other_lab_test_result AS DECIMAL(6,2)) END", "None", "Lipid profile total serum cholesterol level (mg/dL)"),
        ("BR", 70, "NT-proBNP", "hf_lab_tests", "nt_pro_bnp_result", "DECIMAL(8,2)", "Direct DB", "TRY_CAST(hf_lab_tests.nt_pro_bnp_result AS DECIMAL(8,2))", "None", "N-terminal pro b-type natriuretic peptide level (pg/mL)"),
        ("BS", 71, "Current device therapy", "hf_device_therapy", "current_device_yes, current_crt_p, current_crt_d, current_icd_sc, current_icd_dc", "VARCHAR(50)", "Derived", "CASE WHEN current_crt_d='Yes' THEN 'CRT-D' WHEN current_crt_p='Yes' THEN 'CRT-P' WHEN current_icd_dc='Yes' OR current_icd_sc='Yes' THEN 'ICD' WHEN current_device_yes='Yes' THEN 'Device Present' ELSE 'None' END", "None", "Active implantable electrophysiological device therapy"),
        ("BT", 72, "Drugs", "hf_medical_therapy_part1/2/3", "All prescribed medication fields", "NVARCHAR(MAX)", "Concatenated", "Concatenation of active brand/trade prescriptions across medical therapy parts", "None", "Raw brand-name medication prescription text recorded at visit"),
        ("BU", 73, "Generic Names", "hf_medical_therapy_part1/2/3, hf_followup_records", "Active molecule names", "NVARCHAR(MAX)", "Normalized", "Standardized generic active ingredients mapped via normalization engine", "None", "Parsed chemical molecular compound names (e.g. Spironolactone, Metoprolol)"),
        ("BV", 74, "Drug Category", "Derived from BU", "Therapeutic classes", "NVARCHAR(MAX)", "Categorized", "Mapped therapeutic classes (e.g. Beta Blocker, Statin, Diuretic, MRA, ARNI)", "None", "Pharmacological classification groups for prescribed regimen"),
        ("BW", 75, "Beta blocker", "hf_medical_therapy_part1", "carvedilol, bisoprolol, metoprolol_succinate, nebivolol, beta_blocker_other", "BIT (0/1)", "Calculated", "CASE WHEN 'Yes' IN (carvedilol, bisoprolol, metoprolol_succinate, nebivolol, beta_blocker_other) THEN 1 ELSE 0 END", "None", "Guideline-Directed Medical Therapy Pillar 1: Evidence-based Beta Blocker prescribed"),
        ("BX", 76, "ACE inhibitor", "hf_medical_therapy_part1", "enalapril, ramipril, lisinopril, perindopril, ace_other", "BIT (0/1)", "Calculated", "CASE WHEN 'Yes' IN (enalapril, ramipril, lisinopril, perindopril, ace_other) THEN 1 ELSE 0 END", "None", "Guideline-Directed Medical Therapy Pillar 2A: ACE Inhibitor prescribed"),
        ("BY", 77, "ARB", "hf_medical_therapy_part1", "valsartan, losartan, telmisartan, olmesartan, arb_other", "BIT (0/1)", "Calculated", "CASE WHEN 'Yes' IN (valsartan, losartan, telmisartan, olmesartan, arb_other) THEN 1 ELSE 0 END", "None", "Guideline-Directed Medical Therapy Pillar 2B: Angiotensin Receptor Blocker prescribed"),
        ("BZ", 78, "ARNI", "hf_followup_records, hf_medical_therapy_part3", "arni_sacubitril_valsartan_taking, other_medication_1_name", "BIT (0/1)", "Calculated", "CASE WHEN arni_sacubitril_valsartan_taking='Yes' OR other_medication_1_name LIKE '%sacubitril%' THEN 1 ELSE 0 END", "None", "Guideline-Directed Medical Therapy Pillar 2C: Angiotensin Receptor-Neprilysin Inhibitor"),
        ("CA", 79, "MRA", "hf_medical_therapy_part1", "spironolactone, eplerenone", "BIT (0/1)", "Calculated", "CASE WHEN 'Yes' IN (spironolactone, eplerenone) THEN 1 ELSE 0 END", "None", "Guideline-Directed Medical Therapy Pillar 3: Mineralocorticoid Receptor Antagonist"),
        ("CB", 80, "SGLT2 inhibitor", "hf_followup_records, hf_medical_therapy_part3", "sglt2_dapagliflozin_taking, other_medication_2_name", "BIT (0/1)", "Calculated", "CASE WHEN sglt2_dapagliflozin_taking='Yes' OR other_medication_2_name LIKE '%dapagliflozin%' THEN 1 ELSE 0 END", "None", "Guideline-Directed Medical Therapy Pillar 4: Sodium-Glucose Cotransporter-2 Inhibitor"),
        ("CC", 81, "Number of GDMT Drugs Taken", "Sheet1 / Calculated", "BW + BX + BY + BZ + CA + CB", "INT (0-6)", "Calculated", "BW + BX + BY + BZ + CA + CB", "=SUM(BW2:CB2)", "Total count of the 6 evaluated GDMT classes currently prescribed to the patient"),
        ("CD", 82, "Known Contraindication for Beta blocker", "CI Flags", "Bradycardia, SBP < BB threshold, Shock/inotropes, Asthma/COPD, AV block", "BIT (0/1)", "Engine Flag", "MAX(CI_Flags.Bradycardia, CI_Flags.SBP_BB, CI_Flags.Shock, CI_Flags.Asthma, CI_Flags.AV_block)", "=IF(OR('CI Flags'!H2=1, 'CI Flags'!I2=1, 'CI Flags'!K2=1, 'CI Flags'!L2=1, 'CI Flags'!P2=1), 1, 0)", "Documented safety contraindication barrier precluding safe Beta Blocker therapy"),
        ("CE", 83, "Known Contraindication for ACE inhibitor", "CI Flags", "SBP < threshold, Hyperkalaemia, Renal impairment", "BIT (0/1)", "Engine Flag", "MAX(CI_Flags.SBP_BB, CI_Flags.Hyperkal_ACE, CI_Flags.Renal_impairment)", "=IF(OR('CI Flags'!I2=1, 'CI Flags'!M2=1, 'CI Flags'!O2=1), 1, 0)", "Documented safety contraindication barrier precluding safe ACE Inhibitor therapy"),
        ("CF", 84, "Known Contraindication for ARB", "CI Flags", "SBP < threshold, Hyperkalaemia, Renal impairment", "BIT (0/1)", "Engine Flag", "MAX(CI_Flags.SBP_BB, CI_Flags.Hyperkal_ACE, CI_Flags.Renal_impairment)", "=IF(OR('CI Flags'!I2=1, 'CI Flags'!M2=1, 'CI Flags'!O2=1), 1, 0)", "Documented safety contraindication barrier precluding safe ARB therapy"),
        ("CG", 85, "Known Contraindication for ARNI", "CI Flags", "SBP < ARNI threshold, Hyperkalaemia, Renal impairment", "BIT (0/1)", "Engine Flag", "MAX(CI_Flags.SBP_ARNI, CI_Flags.Hyperkal_ACE, CI_Flags.Renal_impairment)", "=IF(OR('CI Flags'!J2=1, 'CI Flags'!M2=1, 'CI Flags'!O2=1), 1, 0)", "Documented safety contraindication barrier precluding safe ARNI therapy (stricter SBP >= 100)"),
        ("CH", 86, "Known Contraindication for MRA", "CI Flags", "Hyperkalaemia (MRA), Renal impairment", "BIT (0/1)", "Engine Flag", "MAX(CI_Flags.Hyperkal_MRA, CI_Flags.Renal_impairment)", "=IF(OR('CI Flags'!N2=1, 'CI Flags'!O2=1), 1, 0)", "Documented safety contraindication barrier precluding safe MRA therapy (K > 5.0, Cr > 2.5)"),
        ("CI", 87, "Known Contraindication for SGLT2 inhibitor", "CI Flags", "Severe renal (SGLT2), DKA, UTI/urosepsis", "BIT (0/1)", "Engine Flag", "MAX(CI_Flags.Severe_renal_SGLT2, CI_Flags.DKA, CI_Flags.UTI)", "=IF(OR('CI Flags'!Q2=1, 'CI Flags'!R2=1, 'CI Flags'!S2=1), 1, 0)", "Documented safety contraindication barrier precluding safe SGLT2i therapy (Cr > 3.0, DKA, Urosepsis)"),
        ("CJ", 88, "Deviation for Beta blocker2", "Sheet1 / Evaluated", "BW (Prescribed), CD (Contraindication)", "BIT (0/1)", "Evaluated", "CASE WHEN (BW=1 AND CD=1) OR (BW=0 AND CD=0) THEN 1 ELSE 0 END", "=IF(OR(AND(BW2=1, CD2=1), AND(BW2=0, CD2=0)), 1, 0)", "Clinical deviation indicator: Prescribed despite CI (Risk) OR Withheld without CI (Under-treatment)"),
        ("CK", 89, "Deviation for ACE inhibitor3", "Sheet1 / Evaluated", "BX (Prescribed), CE (Contraindication)", "BIT (0/1)", "Evaluated", "CASE WHEN (BX=1 AND CE=1) OR (BX=0 AND CE=0) THEN 1 ELSE 0 END", "=IF(OR(AND(BX2=1, CE2=1), AND(BX2=0, CE2=0)), 1, 0)", "Clinical deviation indicator for ACE Inhibitor therapy"),
        ("CL", 90, "Deviation for ARB4", "Sheet1 / Evaluated", "BY (Prescribed), CF (Contraindication)", "BIT (0/1)", "Evaluated", "CASE WHEN (BY=1 AND CF=1) OR (BY=0 AND CF=0) THEN 1 ELSE 0 END", "=IF(OR(AND(BY2=1, CF2=1), AND(BY2=0, CF2=0)), 1, 0)", "Clinical deviation indicator for Angiotensin Receptor Blocker therapy"),
        ("CM", 91, "Deviation for ARNI5", "Sheet1 / Evaluated", "BZ (Prescribed), CG (Contraindication)", "BIT (0/1)", "Evaluated", "CASE WHEN (BZ=1 AND CG=1) OR (BZ=0 AND CG=0) THEN 1 ELSE 0 END", "=IF(OR(AND(BZ2=1, CG2=1), AND(BZ2=0, CG2=0)), 1, 0)", "Clinical deviation indicator for ARNI therapy"),
        ("CN", 92, "Deviation for MRA6", "Sheet1 / Evaluated", "CA (Prescribed), CH (Contraindication)", "BIT (0/1)", "Evaluated", "CASE WHEN (CA=1 AND CH=1) OR (CA=0 AND CH=0) THEN 1 ELSE 0 END", "=IF(OR(AND(CA2=1, CH2=1), AND(CA2=0, CH2=0)), 1, 0)", "Clinical deviation indicator for Mineralocorticoid Receptor Antagonist therapy"),
        ("CO", 93, "Deviation for SGLT2 inhibitor7", "Sheet1 / Evaluated", "CB (Prescribed), CI (Contraindication)", "BIT (0/1)", "Evaluated", "CASE WHEN (CB=1 AND CI=1) OR (CB=0 AND CI=0) THEN 1 ELSE 0 END", "=IF(OR(AND(CB2=1, CI2=1), AND(CB2=0, CI2=0)), 1, 0)", "Clinical deviation indicator for SGLT2 Inhibitor therapy"),
        ("CP", 94, "Total Deviations present", "Sheet1 / Aggregated", "CJ + CK + CL + CM + CN + CO", "INT (0-6)", "Calculated", "CJ + CK + CL + CM + CN + CO", "=SUM(CJ2:CO2)", "Total count of guideline deviations across the 6 drug pillars (0 = complete adherence, 6 = complete deviation)"),
        ("CQ", 95, "Total Variables", "Constant Parameter", "Number of Pillars Evaluated", "INT", "Fixed Constant", "6", "=6", "Denominator representing the 6 evaluated therapeutic drug classes"),
        ("CR", 96, "% of GDMT adhered to", "Sheet1 / Evaluated", "CQ (Total Variables), CP (Total Deviations)", "DECIMAL(4,2)", "Calculated", "ROUND((CQ - CP) / CQ, 2)", "=(CQ2-CP2)/CQ2", "Standardized patient adherence proportion: (6 - Deviations) / 6. (Values: 1.0, 0.83, 0.67, 0.50, 0.33, 0.17, 0.0)")
    ]

    for r_idx, row in enumerate(sheet1_mapping_rows, 3):
        fill = zebra_fill if r_idx % 2 == 0 else white_fill
        for c_idx, val in enumerate(row, 1):
            cell = ws_s1.cell(r_idx, c_idx, val)
            cell.font = code_font if c_idx in [5, 8, 9] else (cell_bold_font if c_idx in [1, 3] else cell_font)
            cell.border = border_cell
            
            # Highlight mapping type tags
            if c_idx == 7:
                if val == "Direct DB":
                    cell.fill = tag_raw_fill
                elif val in ["Calculated", "Engine Flag", "Evaluated"]:
                    cell.fill = tag_calc_fill
                else:
                    cell.fill = fill
            else:
                cell.fill = fill
                
            cell.alignment = align_center if c_idx in [1, 2, 6, 7] else align_left
        ws_s1.row_dimensions[r_idx].height = 24

    ws_s1.column_dimensions["A"].width = 12
    ws_s1.column_dimensions["B"].width = 10
    ws_s1.column_dimensions["C"].width = 32
    ws_s1.column_dimensions["D"].width = 28
    ws_s1.column_dimensions["E"].width = 38
    ws_s1.column_dimensions["F"].width = 16
    ws_s1.column_dimensions["G"].width = 16
    ws_s1.column_dimensions["H"].width = 45
    ws_s1.column_dimensions["I"].width = 40
    ws_s1.column_dimensions["J"].width = 45


    # =========================================================================
    # SHEET 3: CI Flags Mapping (19 Columns)
    # =========================================================================
    ws_ci = wb.create_sheet(title="CI Flags Mapping")
    ws_ci.views.sheetView[0].showGridLines = True
    ws_ci.freeze_panes = "C3"

    ws_ci.merge_cells("A1:J1")
    ws_ci["A1"] = "CLINICAL INTELLIGENCE CONTRAINDICATION ENGINE: CI FLAGS MAPPING SPECIFICATION"
    ws_ci["A1"].font = title_font
    ws_ci["A1"].alignment = Alignment(horizontal="left", vertical="center")
    ws_ci.row_dimensions[1].height = 30

    ci_headers = [
        "Col Letter",
        "CI Flag Column Name",
        "Target Database Table(s)",
        "Target Database Column(s)",
        "Clinical Cutoff / Threshold",
        "Rule / Keywords Searched",
        "Source Columns in Sheet1",
        "Dashboard Formula (Excel Syntax)",
        "SQL Deterministic Implementation Expression",
        "Clinical Safety & Guideline Rationale"
    ]

    for col_idx, text in enumerate(ci_headers, 1):
        cell = ws_ci.cell(2, col_idx, text)
        cell.font = header_font
        cell.fill = header_fill
        cell.alignment = align_header
        cell.border = border_header
    ws_ci.row_dimensions[2].height = 28

    ci_flags_mapping = [
        ("A", "UHID", "patient_demographics", "uhid", "N/A", "Exact Key Match", "Sheet1!B (UHID(T3))", "='sheet 1'!B2", "p.uhid", "Patient unique identification number linking CI Flags record to Master Registry Cohort"),
        ("B", "Systolic BP", "hf_initial_assessment", "systolic_bp_sitting", "Numeric SBP in mmHg", "Extracted from seated BP before '/'", "Sheet1!AF (Blood pressure sitting)", "=IFERROR(VALUE(LEFT(Sheet1!AF2, FIND('/', Sheet1!AF2)-1)), \"\")", "ia.systolic_bp_sitting", "Baseline seated systolic blood pressure used to gate vasodilator and neurohormonal therapies"),
        ("C", "Heart rate", "hf_initial_assessment", "heart_rate", "Numeric HR in bpm", "Numerical resting pulse validation", "Sheet1!AB (Heart rate)", "=IF(ISNUMBER(Sheet1!AB2), Sheet1!AB2, \"\")", "ia.heart_rate", "Resting heart rate in beats per minute used to gate chronotropic beta-blockade"),
        ("D", "Potassium", "hf_lab_tests", "potassium_result", "Serum K+ in mEq/L", "Numerical potassium serum level", "Sheet1!BK (Lab tests Potassium)", "=IF(ISNUMBER(Sheet1!BK2), Sheet1!BK2, \"\")", "TRY_CAST(lt.potassium_result AS DECIMAL(4,2))", "Serum potassium level used to monitor hyperkalemia risk under RAASi and MRA therapy"),
        ("E", "Creatinine", "hf_lab_tests", "creatinine_result", "Serum Creatinine in mg/dL", "Numerical creatinine level", "Sheet1!BL (Creatinine)", "=IF(ISNUMBER(Sheet1!BL2), Sheet1!BL2, \"\")", "TRY_CAST(lt.creatinine_result AS DECIMAL(4,2))", "Biomarker of renal function used to establish acute or chronic renal impairment safety thresholds"),
        ("F", "Clinical text (P,S,T,U,X,AO,AP,AQ,AR)", "hf_administrative, hf_initial_assessment, hf_final_clinical_assessment", "present_diagnosis, renal_failure, other_reason_details, previous_diagnosis, recent_hospitalization_reasons, comorbidity fields", "Unstructured Clinical Text", "Concatenation of P, S, T, U, X, AO, AP, AQ, AR with pipe separator", "Sheet1!P, S, T, U, X, AO, AP, AQ, AR", "=UPPER(Sheet1!P2&\" | \"&Sheet1!S2&\" | \"&Sheet1!T2&\" | \"&Sheet1!U2&\" | \"&Sheet1!X2&\" | \"&Sheet1!AO2&\" | \"&Sheet1!AP2&\" | \"&Sheet1!AQ2&\" | \"&Sheet1!AR2)", "UPPER(CONCAT_WS(' | ', ha.present_diagnosis, ha.other_reason, ia.previous_diagnosis, ia.recent_hospitalization_reasons, fa.cad, fa.hypertension, fa.diabetes_mellitus))", "Aggregated free-text clinical corpus parsed by regex / substring search algorithms to detect undocumented barriers"),
        ("G", "Drug text (BT,BU)", "hf_medical_therapy_part1/2/3", "Prescription trade strings & Generic active ingredients", "Medication Regimen Text", "Concatenation of BT (Trade) and BU (Generic) with pipe separator", "Sheet1!BT (Drugs), Sheet1!BU (Generic Names)", "=UPPER(Sheet1!BT2&\" | \"&Sheet1!BU2)", "UPPER(CONCAT_WS(' | ', prescribedDrugsSummary, genericNamesSummary))", "Medication text corpus searched for concurrent vasoactive inotropes, vasopressors, or unmapped formulations"),
        ("H", "Bradycardia", "hf_initial_assessment", "heart_rate", "< 50 bpm (Absolute Contraindication)", "Heart rate < 50 bpm", "CI_Flags!C (Heart rate)", "=IF(AND(ISNUMBER(C2), C2 < Contraindications!$E$4), 1, 0)", "CASE WHEN ia.heart_rate < 50 THEN 1 ELSE 0 END", "Beta-blocker absolute contraindication: Bradycardia precluding negative chronotropic agents"),
        ("I", "SBP < BB/ACEi/ARB threshold", "hf_initial_assessment", "systolic_bp_sitting", "< 90 mmHg (Absolute Contraindication)", "Systolic BP < 90 mmHg", "CI_Flags!B (Systolic BP)", "=IF(AND(ISNUMBER(B2), B2 < Contraindications!$E$5), 1, 0)", "CASE WHEN ia.systolic_bp_sitting < 90 THEN 1 ELSE 0 END", "Absolute hypotension safety threshold precluding Beta Blockers, ACE inhibitors, and ARBs"),
        ("J", "SBP < ARNI threshold", "hf_initial_assessment", "systolic_bp_sitting", "< 100 mmHg (Absolute Contraindication)", "Systolic BP < 100 mmHg (Stricter criteria)", "CI_Flags!B (Systolic BP)", "=IF(AND(ISNUMBER(B2), B2 < Contraindications!$E$16), 1, 0)", "CASE WHEN ia.systolic_bp_sitting < 100 THEN 1 ELSE 0 END", "Sacubitril/Valsartan specific hypotension threshold: Requires baseline SBP >= 100 mmHg before initiation"),
        ("K", "Shock / inotropes", "hf_administrative, hf_initial_assessment, hf_medical_therapy_part2", "present_diagnosis, drug texts", "Active Cardiogenic Shock / Inotrope Support", "Keywords: 'SHOCK' (in Clinical Text F); 'DOBUTAMINE', 'DOBU', 'NORAD' (in Drug Text G)", "CI_Flags!F, CI_Flags!G", "=IF(OR(ISNUMBER(SEARCH(\"SHOCK\",F2)), ISNUMBER(SEARCH(\"DOBUTAMINE\",G2)), ISNUMBER(SEARCH(\"DOBU\",G2)), ISNUMBER(SEARCH(\"NORAD\",G2))), 1, 0)", "CASE WHEN clinicalText LIKE '%SHOCK%' OR drugText LIKE '%DOBUTAMINE%' OR drugText LIKE '%NORAD%' THEN 1 ELSE 0 END", "Absolute contraindication to Beta-blockers during acute hemodynamic instability / inotrope dependency"),
        ("L", "Asthma / COPD", "hf_final_clinical_assessment, hf_initial_assessment", "asthma, copd, clinical_text", "Severe Bronchospastic Airway Disease", "Keywords: 'ASTHMA', 'COPD', 'BRONCH' in Clinical Text F", "CI_Flags!F (Clinical text)", "=IF(OR(ISNUMBER(SEARCH(\"ASTHMA\",F2)), ISNUMBER(SEARCH(\"COPD\",F2)), ISNUMBER(SEARCH(\"BRONCH\",F2))), 1, 0)", "CASE WHEN fa.asthma='Yes' OR fa.copd='Yes' OR clinicalText LIKE '%ASTHMA%' OR clinicalText LIKE '%COPD%' THEN 1 ELSE 0 END", "Relative (COPD) or Absolute (Active severe Asthma) contraindication for non-cardioselective Beta Blockers"),
        ("M", "Hyperkalaemia (ACEi/ARB/ARNI)", "hf_lab_tests, hf_initial_assessment", "potassium_result, clinical_text", "K+ > 5.5 mEq/L (Absolute Contraindication)", "Potassium > 5.5 OR keyword 'HYPERKAL' in Clinical Text F", "CI_Flags!D (Potassium), CI_Flags!F (Clinical text)", "=IF(OR(AND(ISNUMBER(D2), D2 > Contraindications!$E$10), ISNUMBER(SEARCH(\"HYPERKAL\",F2))), 1, 0)", "CASE WHEN TRY_CAST(lt.potassium_result AS DECIMAL(4,2)) > 5.5 OR clinicalText LIKE '%HYPERKAL%' THEN 1 ELSE 0 END", "Safety limit preventing life-threatening hyperkalemic cardiotoxicity under RAAS inhibition"),
        ("N", "Hyperkalaemia (MRA)", "hf_lab_tests, hf_initial_assessment", "potassium_result, clinical_text", "K+ > 5.0 mEq/L (Stricter Absolute Contraindication)", "Potassium > 5.0 OR keyword 'HYPERKAL' in Clinical Text F", "CI_Flags!D (Potassium), CI_Flags!F (Clinical text)", "=IF(OR(AND(ISNUMBER(D2), D2 > Contraindications!$E$20), ISNUMBER(SEARCH(\"HYPERKAL\",F2))), 1, 0)", "CASE WHEN TRY_CAST(lt.potassium_result AS DECIMAL(4,2)) > 5.0 OR clinicalText LIKE '%HYPERKAL%' THEN 1 ELSE 0 END", "Stricter guideline threshold for aldosterone antagonists due to severe risk of potassium retention"),
        ("O", "Renal impairment (creatinine)", "hf_lab_tests", "creatinine_result", "Creatinine > 2.5 mg/dL (Absolute Contraindication)", "Creatinine > 2.5 mg/dL", "CI_Flags!E (Creatinine)", "=IF(AND(ISNUMBER(E2), E2 > Contraindications!$E$11), 1, 0)", "CASE WHEN TRY_CAST(lt.creatinine_result AS DECIMAL(4,2)) > 2.5 THEN 1 ELSE 0 END", "Contraindication for ACEi, ARB, ARNI, and MRA initiation due to risk of precipitating acute renal shutdown"),
        ("P", "AV block / sick sinus", "hf_cardiac_investigations, hf_initial_assessment", "ecg_av_second_degree_block, ecg_av_third_degree_block, clinical_text", "High-grade AV Conduction Block (2nd/3rd Degree)", "Keywords: 'AV BLOCK', 'HEART BLOCK', 'CHB', 'SICK SINUS' in Clinical Text F", "CI_Flags!F (Clinical text)", "=IF(OR(ISNUMBER(SEARCH(\"AV BLOCK\",F2)), ISNUMBER(SEARCH(\"HEART BLOCK\",F2)), ISNUMBER(SEARCH(\"CHB\",F2)), ISNUMBER(SEARCH(\"SICK SINUS\",F2))), 1, 0)", "CASE WHEN ci.ecg_av_second_degree_block='Yes' OR ci.ecg_av_third_degree_block='Yes' OR clinicalText LIKE '%HEART BLOCK%' OR clinicalText LIKE '%CHB%' THEN 1 ELSE 0 END", "Absolute Beta-blocker contraindication: Worsens high-grade nodal conduction failure in absence of pacemaker"),
        ("Q", "DKA", "hf_initial_assessment, hf_final_clinical_assessment", "clinical_text", "Diabetic Ketoacidosis / Euglycemic DKA", "Keywords: 'DKA', 'KETOACID' in Clinical Text F", "CI_Flags!F (Clinical text)", "=IF(OR(ISNUMBER(SEARCH(\"DKA\",F2)), ISNUMBER(SEARCH(\"KETOACID\",F2))), 1, 0)", "CASE WHEN clinicalText LIKE '%DKA%' OR clinicalText LIKE '%KETOACID%' THEN 1 ELSE 0 END", "Absolute contraindication to SGLT2 inhibitors: Risk of inducing life-threatening euglycemic diabetic ketoacidosis"),
        ("R", "UTI / urosepsis", "hf_initial_assessment, hf_administrative", "infection, clinical_text", "Active Severe Genitourinary Sepsis", "Keywords: 'UTI', 'UROSEPSIS' in Clinical Text F", "CI_Flags!F (Clinical text)", "=IF(OR(ISNUMBER(SEARCH(\"UTI\",F2)), ISNUMBER(SEARCH(\"UROSEPSIS\",F2))), 1, 0)", "CASE WHEN ha.infection='Yes' OR clinicalText LIKE '%UTI%' OR clinicalText LIKE '%UROSEPSIS%' THEN 1 ELSE 0 END", "Contraindication to SGLT2 inhibitors: Glucosuria exacerbates acute ascending fungal or bacterial urosepsis"),
        ("S", "Severe renal (SGLT2)", "hf_lab_tests", "creatinine_result", "Creatinine > 3.0 mg/dL / eGFR < 20", "Creatinine > 3.0 mg/dL", "CI_Flags!E (Creatinine)", "=IF(AND(ISNUMBER(E2), E2 > Contraindications!$E$24), 1, 0)", "CASE WHEN TRY_CAST(lt.creatinine_result AS DECIMAL(4,2)) > 3.0 THEN 1 ELSE 0 END", "Safety cutoff where glycemic and hemodynamic efficacy of SGLT2 inhibitors becomes compromised")
    ]

    for r_idx, row in enumerate(ci_flags_mapping, 3):
        fill = zebra_fill if r_idx % 2 == 0 else white_fill
        for c_idx, val in enumerate(row, 1):
            cell = ws_ci.cell(r_idx, c_idx, val)
            cell.font = code_font if c_idx in [4, 8, 9] else (cell_bold_font if c_idx in [1, 2] else cell_font)
            cell.border = border_cell
            cell.fill = fill
            cell.alignment = align_center if c_idx in [1, 5] else align_left
        ws_ci.row_dimensions[r_idx].height = 26

    ws_ci.column_dimensions["A"].width = 12
    ws_ci.column_dimensions["B"].width = 28
    ws_ci.column_dimensions["C"].width = 28
    ws_ci.column_dimensions["D"].width = 30
    ws_ci.column_dimensions["E"].width = 32
    ws_ci.column_dimensions["F"].width = 32
    ws_ci.column_dimensions["G"].width = 26
    ws_ci.column_dimensions["H"].width = 40
    ws_ci.column_dimensions["I"].width = 45
    ws_ci.column_dimensions["J"].width = 45


    # =========================================================================
    # SHEET 4: GDMT Summary Mapping
    # =========================================================================
    ws_gdmt = wb.create_sheet(title="GDMT Summary Mapping")
    ws_gdmt.views.sheetView[0].showGridLines = True
    ws_gdmt.freeze_panes = "C3"

    ws_gdmt.merge_cells("A1:I1")
    ws_gdmt["A1"] = "AGGREGATE ANALYTICS & PILLAR UPTAKE: GDMT SUMMARY MAPPING SPECIFICATION"
    ws_gdmt["A1"].font = title_font
    ws_gdmt["A1"].alignment = Alignment(horizontal="left", vertical="center")
    ws_gdmt.row_dimensions[1].height = 30

    gdmt_headers = [
        "Grid Section",
        "Pillar / Metric Item",
        "Dashboard Output Columns",
        "Target Database Tables & Columns",
        "Cohort Aggregation SQL Query / Expression",
        "Excel Dashboard Formula",
        "Reference Sheet & Cells",
        "Clinical Interpretation & Benchmark Value",
        "Engineering Validation Notes"
    ]

    for col_idx, text in enumerate(gdmt_headers, 1):
        cell = ws_gdmt.cell(2, col_idx, text)
        cell.font = header_font
        cell.fill = header_fill
        cell.alignment = align_header
        cell.border = border_header
    ws_gdmt.row_dimensions[2].height = 28

    gdmt_summary_mapping = [
        ("1. GDMT Pillar Uptake", "Beta blocker", "Patients Received, Total, Proportion, %", "hf_medical_therapy_part1 (carvedilol, bisoprolol, metoprolol_succinate, nebivolol)", "SUM(CASE WHEN carvedilol='Yes' OR bisoprolol='Yes' OR metoprolol_succinate='Yes' OR nebivolol='Yes' THEN 1 ELSE 0 END)", "=COUNTIF(Sheet1!BW2:BW286, 1)", "Sheet1!BW2:BW286", "Cohort uptake of sympathetic blockade (Benchmark: 36-39% baseline adherence)", "Direct sum of binary prescribed flag"),
        ("1. GDMT Pillar Uptake", "ACE inhibitor", "Patients Received, Total, Proportion, %", "hf_medical_therapy_part1 (enalapril, ramipril, lisinopril, perindopril)", "SUM(CASE WHEN enalapril='Yes' OR ramipril='Yes' OR lisinopril='Yes' OR perindopril='Yes' THEN 1 ELSE 0 END)", "=COUNTIF(Sheet1!BX2:BX286, 1)", "Sheet1!BX2:BX286", "Cohort uptake of ACE inhibitors (Benchmark: ~0.8-1% uptake)", "Alternative to ARB/ARNI in RAAS inhibition"),
        ("1. GDMT Pillar Uptake", "ARB", "Patients Received, Total, Proportion, %", "hf_medical_therapy_part1 (valsartan, losartan, telmisartan, olmesartan)", "SUM(CASE WHEN valsartan='Yes' OR losartan='Yes' OR telmisartan='Yes' OR olmesartan='Yes' THEN 1 ELSE 0 END)", "=COUNTIF(Sheet1!BY2:BY286, 1)", "Sheet1!BY2:BY286", "Cohort uptake of Angiotensin Receptor Blockers (Benchmark: ~4.2-4.7% uptake)", "Alternative for ACEi-intolerant patients"),
        ("1. GDMT Pillar Uptake", "ARNI", "Patients Received, Total, Proportion, %", "hf_followup_records (arni_sacubitril_valsartan_taking), clinical texts", "SUM(CASE WHEN arni_sacubitril_valsartan_taking='Yes' OR drug_text LIKE '%SACUBITRIL%' THEN 1 ELSE 0 END)", "=COUNTIF(Sheet1!BZ2:BZ286, 1)", "Sheet1!BZ2:BZ286", "Cohort uptake of Sacubitril/Valsartan (Benchmark: ~19-23% uptake)", "First-line class I recommendation in HFrEF"),
        ("1. GDMT Pillar Uptake", "MRA", "Patients Received, Total, Proportion, %", "hf_medical_therapy_part1 (spironolactone, eplerenone)", "SUM(CASE WHEN spironolactone='Yes' OR eplerenone='Yes' THEN 1 ELSE 0 END)", "=COUNTIF(Sheet1!CA2:CA286, 1)", "Sheet1!CA2:CA286", "Cohort uptake of aldosterone antagonists (Benchmark: ~69-72% uptake)", "Highest baseline utilized drug pillar in cohort"),
        ("1. GDMT Pillar Uptake", "SGLT2 inhibitor", "Patients Received, Total, Proportion, %", "hf_followup_records (sglt2_dapagliflozin_taking), clinical texts", "SUM(CASE WHEN sglt2_dapagliflozin_taking='Yes' OR drug_text LIKE '%DAPAGLIFLOZIN%' THEN 1 ELSE 0 END)", "=COUNTIF(Sheet1!CB2:CB286, 1)", "Sheet1!CB2:CB286", "Cohort uptake of SGLT2 inhibitors (Benchmark: ~10-12% uptake)", "Fourth guideline pillar for HFrEF & HFpEF"),
        ("2. Multi-Drug Polytherapy", "0 Drugs Taken", "Number of Patients, % of Cohort", "Computed from CC (Number of GDMT Drugs Taken)", "COUNT(*) WHERE (BW+BX+BY+BZ+CA+CB) = 0", "=COUNTIF(Sheet1!CC2:CC286, 0)", "Sheet1!CC2:CC286", "Patients receiving zero guideline medical therapies (~14% of cohort)", "Reflects profound care gap or end-stage refractory shock"),
        ("2. Multi-Drug Polytherapy", "1 Drug Taken (Monotherapy)", "Number of Patients, % of Cohort", "Computed from CC", "COUNT(*) WHERE (BW+BX+BY+BZ+CA+CB) = 1", "=COUNTIF(Sheet1!CC2:CC286, 1)", "Sheet1!CC2:CC286", "Patients on a single isolated pillar (~42% of cohort, typically MRA only)", "Dominant clinical pattern at presentation"),
        ("2. Multi-Drug Polytherapy", "2 Drugs Taken (Dual Therapy)", "Number of Patients, % of Cohort", "Computed from CC", "COUNT(*) WHERE (BW+BX+BY+BZ+CA+CB) = 2", "=COUNTIF(Sheet1!CC2:CC286, 2)", "Sheet1!CC2:CC286", "Patients on dual GDMT combination (~32% of cohort, e.g. BB + MRA)", "Moderate partial adherence"),
        ("2. Multi-Drug Polytherapy", "3 Drugs Taken (Triple Therapy)", "Number of Patients, % of Cohort", "Computed from CC", "COUNT(*) WHERE (BW+BX+BY+BZ+CA+CB) = 3", "=COUNTIF(Sheet1!CC2:CC286, 3)", "Sheet1!CC2:CC286", "Patients receiving 3 pillars (~9% of cohort)", "Substantial guideline optimization"),
        ("2. Multi-Drug Polytherapy", "4+ Drugs Taken (Quadruple Therapy)", "Number of Patients, % of Cohort", "Computed from CC", "COUNT(*) WHERE (BW+BX+BY+BZ+CA+CB) >= 4", "=COUNTIF(Sheet1!CC2:CC286, \">=4\")", "Sheet1!CC2:CC286", "Optimal guideline care: Quadruple therapy (~2% of cohort)", "Gold standard comprehensive therapy"),
        ("3. Prescriptions Irrespective of CI", "Beta Blocker Prescribed", "Count of UHID, %", "Sheet1!BW, patient_demographics.uhid", "COUNT(DISTINCT p.uhid) WHERE BW = 1", "=COUNTIF(Sheet1!BW2:BW286, 1)", "Sheet1!BW2:BW286, B2:B286", "Total patients receiving Beta Blocker regardless of contraindication flag", "Numerator: 108 / 278 (38.85%)"),
        ("3. Prescriptions Irrespective of CI", "ACE Inhibitor Prescribed", "Count of UHID, %", "Sheet1!BX, patient_demographics.uhid", "COUNT(DISTINCT p.uhid) WHERE BX = 1", "=COUNTIF(Sheet1!BX2:BX286, 1)", "Sheet1!BX2:BX286, B2:B286", "Total patients receiving ACE Inhibitor", "Numerator: 2 / 278 (0.72%)"),
        ("3. Prescriptions Irrespective of CI", "ARB Prescribed", "Count of UHID, %", "Sheet1!BY, patient_demographics.uhid", "COUNT(DISTINCT p.uhid) WHERE BY = 1", "=COUNTIF(Sheet1!BY2:BY286, 1)", "Sheet1!BY2:BY286, B2:B286", "Total patients receiving ARB", "Numerator: 13 / 278 (4.68%)"),
        ("3. Prescriptions Irrespective of CI", "ARNI Prescribed", "Count of UHID, %", "Sheet1!BZ, patient_demographics.uhid", "COUNT(DISTINCT p.uhid) WHERE BZ = 1", "=COUNTIF(Sheet1!BZ2:BZ286, 1)", "Sheet1!BZ2:BZ286, B2:B286", "Total patients receiving ARNI", "Numerator: 54 / 278 (19.42%)"),
        ("3. Prescriptions Irrespective of CI", "MRA Prescribed", "Count of UHID, %", "Sheet1!CA, patient_demographics.uhid", "COUNT(DISTINCT p.uhid) WHERE CA = 1", "=COUNTIF(Sheet1!CA2:CA286, 1)", "Sheet1!CA2:CA286, B2:B286", "Total patients receiving MRA", "Numerator: 192 / 278 (69.06%)"),
        ("3. Prescriptions Irrespective of CI", "SGLT2 Inhibitor Prescribed", "Count of UHID, %", "Sheet1!CB, patient_demographics.uhid", "COUNT(DISTINCT p.uhid) WHERE CB = 1", "=COUNTIF(Sheet1!CB2:CB286, 1)", "Sheet1!CB2:CB286, B2:B286", "Total patients receiving SGLT2i", "Numerator: 27 / 278 (9.71%)"),
        ("4. Deviations Breakdown", "Deviation for Beta blocker", "Count of UHID, %", "Sheet1!CJ, patient_demographics.uhid", "SUM(CJ)", "=COUNTIF(Sheet1!CJ2:CJ286, 1)", "Sheet1!CJ2:CJ286", "Patients with guideline deviation on Beta Blocker (46.8% deviation rate)", "Given with CI (Harm) or Withheld without CI (Under-treatment)"),
        ("4. Deviations Breakdown", "Deviation for ACE inhibitor", "Count of UHID, %", "Sheet1!CK, patient_demographics.uhid", "SUM(CK)", "=COUNTIF(Sheet1!CK2:CK286, 1)", "Sheet1!CK2:CK286", "Patients with deviation on ACE inhibitor (82.7% deviation rate)", "High due to non-use in absence of identified contraindication"),
        ("4. Deviations Breakdown", "Deviation for ARB", "Count of UHID, %", "Sheet1!CL, patient_demographics.uhid", "SUM(CL)", "=COUNTIF(Sheet1!CL2:CL286, 1)", "Sheet1!CL2:CL286", "Patients with deviation on ARB (78.8% deviation rate)", "High omission rate"),
        ("4. Deviations Breakdown", "Deviation for ARNI", "Count of UHID, %", "Sheet1!CM, patient_demographics.uhid", "SUM(CM)", "=COUNTIF(Sheet1!CM2:CM286, 1)", "Sheet1!CM2:CM286", "Patients with deviation on ARNI (60.1% deviation rate)", "Omitted in eligible patients"),
        ("4. Deviations Breakdown", "Deviation for MRA", "Count of UHID, %", "Sheet1!CN, patient_demographics.uhid", "SUM(CN)", "=COUNTIF(Sheet1!CN2:CN286, 1)", "Sheet1!CN2:CN286", "Patients with deviation on MRA (33.5% deviation rate)", "Lowest deviation; frequent prescribing despite mild renal flag"),
        ("4. Deviations Breakdown", "Deviation for SGLT2 inhibitor", "Count of UHID, %", "Sheet1!CO, patient_demographics.uhid", "SUM(CO)", "=COUNTIF(Sheet1!CO2:CO286, 1)", "Sheet1!CO2:CO286", "Patients with deviation on SGLT2i (72.3% deviation rate)", "Under-treatment represents major clinical quality improvement target"),
        ("5. Adherence Distribution", "0.0% Adherence (6 Deviations)", "UHID Count, % of Cohort", "Sheet1!CP (Total Deviations = 6)", "COUNT(*) WHERE CP = 6", "=COUNTIFS(Sheet1!$CP$2:$CP$286, 6, Sheet1!$B$2:$B$286, \"<>\")", "Sheet1!CP, B", "Patients with zero concordant pillar decisions (~6.5% of cohort)", "Complete care discordance"),
        ("5. Adherence Distribution", "16.7% Adherence (5 Deviations)", "UHID Count, % of Cohort", "Sheet1!CP (Total Deviations = 5)", "COUNT(*) WHERE CP = 5", "=COUNTIFS(Sheet1!$CP$2:$CP$286, 5, Sheet1!$B$2:$B$286, \"<>\")", "Sheet1!CP, B", "Patients with 1 appropriate decision (~26.6% of cohort)", "Severe undertreatment"),
        ("5. Adherence Distribution", "33.3% Adherence (4 Deviations)", "UHID Count, % of Cohort", "Sheet1!CP (Total Deviations = 4)", "COUNT(*) WHERE CP = 4", "=COUNTIFS(Sheet1!$CP$2:$CP$286, 4, Sheet1!$B$2:$B$286, \"<>\")", "Sheet1!CP, B", "Cohort Mode: 2 appropriate decisions (~34.2% of cohort)", "Most frequent adherence profile"),
        ("5. Adherence Distribution", "50.0% Adherence (3 Deviations)", "UHID Count, % of Cohort", "Sheet1!CP (Total Deviations = 3)", "COUNT(*) WHERE CP = 3", "=COUNTIFS(Sheet1!$CP$2:$CP$286, 3, Sheet1!$B$2:$B$286, \"<>\")", "Sheet1!CP, B", "Patients with 3 appropriate decisions (~13.7% of cohort)", "Balanced concordant decisions"),
        ("5. Adherence Distribution", "66.7% Adherence (2 Deviations)", "UHID Count, % of Cohort", "Sheet1!CP (Total Deviations = 2)", "COUNT(*) WHERE CP = 2", "=COUNTIFS(Sheet1!$CP$2:$CP$286, 2, Sheet1!$B$2:$B$286, \"<>\")", "Sheet1!CP, B", "Patients with 4 appropriate decisions (~9.0% of cohort)", "Substantial guideline fidelity"),
        ("5. Adherence Distribution", "83.3% Adherence (1 Deviation)", "UHID Count, % of Cohort", "Sheet1!CP (Total Deviations = 1)", "COUNT(*) WHERE CP = 1", "=COUNTIFS(Sheet1!$CP$2:$CP$286, 1, Sheet1!$B$2:$B$286, \"<>\")", "Sheet1!CP, B", "Patients with 5 appropriate decisions (~6.5% of cohort)", "Near complete guideline adherence"),
        ("5. Adherence Distribution", "100.0% Adherence (0 Deviations)", "UHID Count, % of Cohort", "Sheet1!CP (Total Deviations = 0)", "COUNT(*) WHERE CP = 0", "=COUNTIFS(Sheet1!$CP$2:$CP$286, 0, Sheet1!$B$2:$B$286, \"<>\")", "Sheet1!CP, B", "Patients with complete guideline concordance across all 6 pillars (~3.6% of cohort)", "Benchmark clinical excellence")
    ]

    for r_idx, row in enumerate(gdmt_summary_mapping, 3):
        fill = zebra_fill if r_idx % 2 == 0 else white_fill
        for c_idx, val in enumerate(row, 1):
            cell = ws_gdmt.cell(r_idx, c_idx, val)
            cell.font = code_font if c_idx in [5, 6] else (cell_bold_font if c_idx in [1, 2] else cell_font)
            cell.border = border_cell
            cell.fill = fill
            cell.alignment = align_center if c_idx == 7 else align_left
        ws_gdmt.row_dimensions[r_idx].height = 25

    ws_gdmt.column_dimensions["A"].width = 25
    ws_gdmt.column_dimensions["B"].width = 28
    ws_gdmt.column_dimensions["C"].width = 24
    ws_gdmt.column_dimensions["D"].width = 32
    ws_gdmt.column_dimensions["E"].width = 45
    ws_gdmt.column_dimensions["F"].width = 38
    ws_gdmt.column_dimensions["G"].width = 25
    ws_gdmt.column_dimensions["H"].width = 45
    ws_gdmt.column_dimensions["I"].width = 40


    # =========================================================================
    # SHEET 5: Key Points Mapping
    # =========================================================================
    ws_kp = wb.create_sheet(title="Key Points Mapping")
    ws_kp.views.sheetView[0].showGridLines = True
    ws_kp.freeze_panes = "C3"

    ws_kp.merge_cells("A1:I1")
    ws_kp["A1"] = "EXECUTIVE KPI & CLINICAL DECISION SUMMARY: KEY POINTS MAPPING SPECIFICATION"
    ws_kp["A1"].font = title_font
    ws_kp["A1"].alignment = Alignment(horizontal="left", vertical="center")
    ws_kp.row_dimensions[1].height = 30

    kp_headers = [
        "Parameter Index",
        "Clinical Parameter / KPI Name",
        "Dashboard Source Sheet & Columns",
        "Target Database Table(s)",
        "Target Database Column(s)",
        "SQL Deterministic Implementation Expression",
        "Excel Dashboard Formula",
        "Clinical Insight & Benchmark Value",
        "Clinical Significance & Actionable Insight"
    ]

    for col_idx, text in enumerate(kp_headers, 1):
        cell = ws_kp.cell(2, col_idx, text)
        cell.font = header_font
        cell.fill = header_fill
        cell.alignment = align_header
        cell.border = border_header
    ws_kp.row_dimensions[2].height = 28

    key_points_mapping = [
        (1, "HF records in dataset", "Sheet1!B (UHID(T3))", "patient_demographics", "uhid", "COUNT(DISTINCT p.uhid)", "=COUNTA(Sheet1!B2:B286)", "Total registry cohort size (278 patients)", "Denominator for all epidemiological and therapy uptake calculations"),
        (2, "Male", "Sheet1!H (Gender)", "patient_demographics", "gender", "COUNT(*) WHERE p.gender = 'Male'", "=COUNTIF(Sheet1!H2:H286, \"Male\")", "Male representation (e.g. 182 males / 65.5%)", "Baseline demographic distribution in acute heart failure cohort"),
        (3, "Female", "Sheet1!H (Gender)", "patient_demographics", "gender", "COUNT(*) WHERE p.gender = 'Female'", "=COUNTIF(Sheet1!H2:H286, \"female\")", "Female representation (e.g. 96 females / 34.5%)", "Sex-specific differences in HF etiology and treatment compliance"),
        (4, "Mean age (years)", "Sheet1!G (Age)", "patient_demographics, hf_administrative", "date_of_birth, visit_date", "AVG(DATEDIFF(YEAR, p.date_of_birth, ha.visit_date))", "=AVERAGE(Sheet1!G2:G286)", "Average patient age (e.g. 56.4 years)", "Assesses premature cardiovascular morbidity in Indian registry"),
        (5, "HFrEF (EF <= 40%)", "Sheet1!AN (Type of Heart failure)", "hf_final_clinical_assessment, hf_cardiac_investigations", "hfref, echo_ef", "COUNT(*) WHERE fa.hfref='Yes' OR ci.echo_ef <= 40", "=COUNTIF(Sheet1!AN2:AN286, \"HFrEF\")", "Heart Failure with reduced Ejection Fraction (~78% of cohort)", "Primary target population indicated for full 4-pillar GDMT"),
        (6, "HFpEF (EF >= 50%)", "Sheet1!AN (Type of Heart failure)", "hf_final_clinical_assessment, hf_cardiac_investigations", "hfpef, echo_ef", "COUNT(*) WHERE fa.hfpef='Yes' OR ci.echo_ef >= 50", "=COUNTIF(Sheet1!AN2:AN286, \"HFpEF\")", "Heart Failure with preserved Ejection Fraction (~18% of cohort)", "Target population primarily indicated for SGLT2i and diuretic decongestion"),
        (7, "Mean EF %", "Sheet1!BI (EF%)", "hf_cardiac_investigations", "echo_ef", "AVG(ci.echo_ef)", "=AVERAGE(Sheet1!BI2:BI286)", "Average left ventricular ejection fraction (~32.6%)", "Key quantitative echocardiographic marker of systolic dysfunction"),
        (8, "NYHA class III", "Sheet1!AU (Functional Status)", "hf_final_clinical_assessment", "nyha_class_3", "COUNT(*) WHERE fa.nyha_class_3 = 'Yes'", "=COUNTIF(Sheet1!AU2:AU286, \"NYHA class III\")", "Moderate symptoms with marked limitation (~54% of cohort)", "Predominant functional stage at hospital presentation"),
        (9, "NYHA class IV", "Sheet1!AU (Functional Status)", "hf_final_clinical_assessment", "nyha_class_4", "COUNT(*) WHERE fa.nyha_class_4 = 'Yes'", "=COUNTIF(Sheet1!AU2:AU286, \"NYHA class IV\")", "Severe symptoms at rest (~21% of cohort)", "High-risk acute decompensated subpopulation requiring aggressive management"),
        (10, "Diabetes mellitus", "Sheet1!AO:AR (Comorbidities)", "hf_final_clinical_assessment, patient_demographics", "diabetes_mellitus, diabetes", "COUNT(*) WHERE fa.diabetes_mellitus='Yes' OR p.diabetes='Yes'", "=SUMPRODUCT(--(MMULT(--(Sheet1!AO2:AR286=\"Diabetes mellitus\"),{1;1;1;1})>0))", "Diabetic comorbidity prevalence (~40-42% of cohort)", "Strong independent risk factor and class I indication for SGLT2 inhibitors"),
        (11, "Hypertension", "Sheet1!AO:AR (Comorbidities)", "hf_final_clinical_assessment, patient_demographics", "hypertension", "COUNT(*) WHERE fa.hypertension='Yes' OR p.hypertension='Yes'", "=SUMPRODUCT(--(MMULT(--(UPPER(Sheet1!AO2:AR286)=\"HYPERTENSION\"),{1;1;1;1})>0))", "Hypertension comorbidity prevalence (~60-63% of cohort)", "Major etiological contributor to left ventricular hypertrophy and HF"),
        (12, "Renal failure / CKD flagged", "CI Flags!O (Renal impairment)", "hf_lab_tests, hf_final_clinical_assessment", "creatinine_result, renal_failure", "COUNT(*) WHERE TRY_CAST(lt.creatinine_result AS DECIMAL(4,2)) > 2.5 OR fa.renal_failure='Yes'", "=SUM('CI Flags'!O2:O286)", "Active renal contraindication flag (15 patients / ~5.4%)", "Primary safety barrier limiting RAASi and MRA uptitration"),
        (13, "Deaths recorded", "Sheet1!AZ (Death)", "hf_final_clinical_assessment", "mace_death, death_date", "COUNT(*) WHERE fa.mace_death='Yes' OR fa.death_date IS NOT NULL", "=COUNTIF(Sheet1!AZ2:AZ286, \"Y*\")+COUNTIF(Sheet1!AZ2:AZ286, \"Yes\")", "In-hospital / follow-up mortality (5 recorded deaths)", "Key clinical outcome metric evaluating registry quality of care"),
        (14, "Mean number of GDMT drugs per patient", "Sheet1!CC (Number of GDMT Drugs Taken)", "Sheet1!CC", "SUM(BW..CB) / Total Cohort", "AVG(BW + BX + BY + BZ + CA + CB)", "=AVERAGE(Sheet1!CC2:CC286)", "Average GDMT classes per patient (1.43 classes out of 6)", "Quantifies overall prescribing intensity across the cohort"),
        (15, "Mean % GDMT adherence", "Sheet1!CR (% of GDMT adhered to)", "Sheet1!CR", "(6 - Total Deviations) / 6", "AVG((6.0 - CP) / 6.0)", "=AVERAGE(Sheet1!CR2:CR286)", "Average cohort guideline adherence proportion (~36.2%)", "Core executive composite KPI for quality improvement dashboard"),
        (16, "Beta Blocker Utilization & CI", "Sheet1!BW, Sheet1!CD", "hf_medical_therapy_part1, CI Flags", "carvedilol..nebivolol, CI flags", "SUM(BW), SUM(CD)", "=SUM(Sheet1!BW2:BW286) / =SUM(Sheet1!CD2:CD286)", "38.8% on drug; 14.7% with documented CI", "Primary barriers: Bradycardia (<50 bpm), Shock, Severe Hypotension"),
        (17, "ACE Inhibitor Utilization & CI", "Sheet1!BX, Sheet1!CE", "hf_medical_therapy_part1, CI Flags", "enalapril..perindopril, CI flags", "SUM(BX), SUM(CE)", "=SUM(Sheet1!BX2:BX286) / =SUM(Sheet1!CE2:CE286)", "0.7% on drug; 18.3% with documented CI", "Largely supplanted by ARNI in contemporary specialist practice"),
        (18, "ARB Utilization & CI", "Sheet1!BY, Sheet1!CF", "hf_medical_therapy_part1, CI Flags", "valsartan..olmesartan, CI flags", "SUM(BY), SUM(CF)", "=SUM(Sheet1!BY2:BY286) / =SUM(Sheet1!CF2:CF286)", "4.7% on drug; 18.3% with documented CI", "Preserved for ACEi-cough intolerant patients not transitioned to ARNI"),
        (19, "ARNI Utilization & CI", "Sheet1!BZ, Sheet1!CG", "hf_followup_records, CI Flags", "arni_sacubitril_valsartan_taking, CI flags", "SUM(BZ), SUM(CG)", "=SUM(Sheet1!BZ2:BZ286) / =SUM(Sheet1!CG2:CG286)", "19.4% on drug; 26.3% with documented CI", "Limited by baseline SBP < 100 mmHg and economic affordability"),
        (20, "MRA Utilization & CI", "Sheet1!CA, Sheet1!CH", "hf_medical_therapy_part1, CI Flags", "spironolactone, eplerenone, CI flags", "SUM(CA), SUM(CH)", "=SUM(Sheet1!CA2:CA286) / =SUM(Sheet1!CH2:CH286)", "69.1% on drug; 8.6% with documented CI", "Highest prescribed class; small subset prescribed despite borderline renal flag"),
        (21, "SGLT2i Utilization & CI", "Sheet1!CB, Sheet1!CI", "hf_followup_records, CI Flags", "sglt2_dapagliflozin_taking, CI flags", "SUM(CB), SUM(CI)", "=SUM(Sheet1!CB2:CB286) / =SUM(Sheet1!CI2:CI286)", "9.7% on drug; 7.2% with documented CI", "Significant under-treatment gap representing major intervention target"),
        (22, "Harm Deviation (Given despite CI)", "Sheet1!BW..CB, Sheet1!CD..CI", "Derived cross-tabulation", "prescribed=1 AND contra=1", "SUM(CASE WHEN prescribed=1 AND contra=1 THEN 1 ELSE 0 END)", "=SUMPRODUCT((Sheet1!BW2:BW286=1)*(Sheet1!CD2:CD286=1))", "MRA represents highest harm deviation (~12 patients)", "Patients receiving therapy despite laboratory safety threshold flags"),
        (23, "Omission Deviation (Withheld without CI)", "Sheet1!BW..CB, Sheet1!CD..CI", "Derived cross-tabulation", "prescribed=0 AND contra=0", "SUM(CASE WHEN prescribed=0 AND contra=0 THEN 1 ELSE 0 END)", "=SUMPRODUCT((Sheet1!BW2:BW286=0)*(Sheet1!CD2:CD286=0))", "SGLT2i (201 patients), ACEi (228 patients), ARB (214 patients)", "Dominant clinical deviation mode in heart failure registries"),
        (24, "Quality Action: SGLT2i Optimization", "Sheet1!CB, CI Flags!Q,R,S", "hf_followup_records, hf_lab_tests", "sglt2_dapagliflozin_taking, creatinine_result", "SELECT uhid FROM cohort WHERE CB=0 AND SGLT2_CI=0", "Filter Sheet1 where CB=0 and CI=0", "201 eligible patients withheld without medical justification", "Immediate quality improvement initiative: Initiate Dapagliflozin/Empagliflozin in eligible HFrEF/HFpEF"),
        (25, "Quality Action: ARNI Transition", "Sheet1!BZ, CI Flags!J,M,O", "hf_followup_records, hf_initial_assessment", "arni_taking, systolic_bp_sitting", "SELECT uhid FROM cohort WHERE BZ=0 AND SBP>=100 AND K<=5.5", "Filter Sheet1 where BZ=0 and CG=0", "167 eligible patients withheld without medical justification", "Transition stable patients on ACEi/ARB or de novo HFrEF to Sacubitril/Valsartan")
    ]

    for r_idx, row in enumerate(key_points_mapping, 3):
        fill = zebra_fill if r_idx % 2 == 0 else white_fill
        for c_idx, val in enumerate(row, 1):
            cell = ws_kp.cell(r_idx, c_idx, val)
            cell.font = code_font if c_idx in [6, 7] else (cell_bold_font if c_idx in [1, 2] else cell_font)
            cell.border = border_cell
            cell.fill = fill
            cell.alignment = align_center if c_idx == 1 else align_left
        ws_kp.row_dimensions[r_idx].height = 26

    ws_kp.column_dimensions["A"].width = 16
    ws_kp.column_dimensions["B"].width = 32
    ws_kp.column_dimensions["C"].width = 30
    ws_kp.column_dimensions["D"].width = 32
    ws_kp.column_dimensions["E"].width = 32
    ws_kp.column_dimensions["F"].width = 45
    ws_kp.column_dimensions["G"].width = 38
    ws_kp.column_dimensions["H"].width = 45
    ws_kp.column_dimensions["I"].width = 45

    # Save to disk
    wb.save(output_filename)
    print(f"Successfully generated mapping workbook: {output_filename}")

if __name__ == "__main__":
    build_mapping_workbook("Database_to_Dashboard_Mapping.xlsx")
