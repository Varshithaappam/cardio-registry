/**
 * Heart Failure Follow-up Clinical PDF Report Generator
 * Generates an official, high-resolution hospital clinical PDF report for HF Follow-up responses.
 * Uses Blob URL to maintain base URL continuation (eliminating about:blank) and mirrors the exact visual UI of HFFollowUpForm.
 */
import { formatDateForDisplay, formatDateTimeForDisplay } from './dateUtils';

const DEFAULT_DRUG_LIST = [
  { category: 'ACE inhibitor', name: 'Ramipril', taking: null, inRecentVisit: null },
  { category: 'ARB', name: 'Losartan', taking: null, inRecentVisit: null },
  { category: 'ARB', name: 'Telmisartan', taking: null, inRecentVisit: null },
  { category: 'ARNI', name: 'Sacubitril + Valsartan', taking: null, inRecentVisit: null },
  { category: 'ARNI', name: 'Other ARNI', isOther: true, otherName: '', taking: null, inRecentVisit: null },
  { category: 'Aldosterone antagonist (MRA)', name: 'Spironolactone', taking: null, inRecentVisit: null },
  { category: 'Beta blocker', name: 'Bisoprolol', taking: null, inRecentVisit: null },
  { category: 'Beta blocker', name: 'Carvedilol', taking: null, inRecentVisit: null },
  { category: 'Beta blocker', name: 'Metoprolol', taking: null, inRecentVisit: null },
  { category: 'Beta blocker', name: 'Nebivolol', taking: null, inRecentVisit: null },
  { category: 'SGLT2 inhibitor', name: 'Dapagliflozin', taking: null, inRecentVisit: null },
  { category: 'Statin', name: 'Atorvastatin', taking: null, inRecentVisit: null },
  { category: 'Statin', name: 'Rosuvastatin', taking: null, inRecentVisit: null },
  { category: 'Diuretic', name: 'Furosemide', taking: null, inRecentVisit: null },
  { category: 'Diuretic', name: 'Torsemide', taking: null, inRecentVisit: null },
  { category: 'Diuretic', name: 'Metolazone', taking: null, inRecentVisit: null },
  { category: 'Other medication', name: 'Other', isOther: true, otherName: '', taking: null, inRecentVisit: null }
];

const ALL_SYMPTOMS = [
  'Shortness of breath',
  'Chest pain',
  'Dizziness',
  'Swelling in feet, ankles & legs',
  'Trouble sleeping',
  'Sadness or depression',
  'Fatigue',
  'Loss of appetite',
  'Frequent urination',
  'Dry cough',
  'Weight gain'
];

const ALL_CLINICAL_EVENTS = [
  'Recurrent MI',
  'Heart failure hospitalization',
  'Cardiac arrest',
  'Arrhythmia',
  'Repeat PCI',
  'Recurrent angina',
  'New/worsening heart failure',
  'Major bleeding',
  'Stroke/TIA',
  'CABG',
  'Cardiovascular hospitalization',
  'Acute kidney injury',
  'Death',
  'Cardiogenic shock',
  'Device-related complication'
];

function parseNotesFallback(notesStr) {
  if (!notesStr || typeof notesStr !== 'string') return {};
  const parsed = {};
  const lines = notesStr.split('\n');
  lines.forEach(line => {
    const colonIdx = line.indexOf(':');
    if (colonIdx > 0) {
      const key = line.substring(0, colonIdx).trim().toLowerCase();
      const val = line.substring(colonIdx + 1).trim();
      if (key.includes('health status')) parsed.health_status = val;
      if (key.includes('adherence')) parsed.medication_adherence = val;
      if (key.includes('symptoms')) parsed.selected_symptoms = val.split(',').map(s => s.trim());
      if (key.includes('events')) parsed.selected_clinical_events = val.split(',').map(s => s.trim());
      if (key.includes('bnp')) parsed.bnp_nt_probnp_result = val;
      if (key.includes('creatinine')) parsed.creatinine_result = val;
      if (key.includes('sodium')) parsed.sodium_result = val;
      if (key.includes('hemoglobin')) parsed.hemoglobin_result = val;
    }
  });
  return parsed;
}

export function generateHfFollowupPdf(logData = {}, patientData = {}) {
  let raw = {};
  if (logData.raw_form_json) {
    try {
      raw = typeof logData.raw_form_json === 'string' 
        ? JSON.parse(logData.raw_form_json) 
        : logData.raw_form_json;
    } catch (e) {
      raw = {};
    }
  } else if (logData.notes) {
    raw = parseNotesFallback(logData.notes);
  }

  const merged = { ...patientData, ...logData, ...raw };

  const patientName = merged.patient_name || patientData.patient_name || patientData.name || 'N/A';
  const mrn = merged.care_mr_no || merged.mr_no || patientData.mr_no || patientData.mrNo || 'N/A';
  const uhid = merged.uhid || patientData.uhid || patientData.uhi || 'N/A';
  const age = merged.age || patientData.age || 'N/A';
  const gender = merged.gender || patientData.gender || 'N/A';
  const phone = merged.phone_no || patientData.phone_no || patientData.phone || 'N/A';
  const assignedNurse = merged.assigned_nurse || merged.nurse_name || patientData.assigned_nurse || 'Staff Nurse';
  const followupDate = merged.patient_followup_date || merged.contact_date || new Date().toISOString().split('T')[0];

  const selectedSymptomsList = Array.isArray(merged.selected_symptoms)
    ? merged.selected_symptoms
    : (merged.selected_symptoms ? String(merged.selected_symptoms).split(',').map(s => s.trim()) : []);

  const selectedClinicalEventsList = Array.isArray(merged.selected_clinical_events)
    ? merged.selected_clinical_events
    : (merged.selected_clinical_events ? String(merged.selected_clinical_events).split(',').map(s => s.trim()) : []);

  const drugGrid = (Array.isArray(merged.drug_grid) && merged.drug_grid.length > 0)
    ? merged.drug_grid
    : DEFAULT_DRUG_LIST;

  const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>HF_Followup_Report_${mrn}_${followupDate}</title>
  <style>
    @page {
      size: A4;
      margin: 8mm 10mm 10mm 10mm;
    }
    html, body {
      height: auto !important;
      overflow: visible !important;
    }
    body {
      font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      color: #0f172a;
      background-color: #f8fafc;
      margin: 0;
      padding: 0;
      font-size: 11px;
      line-height: 1.4;
    }
    
    /* Top Action Bar for View Mode */
    .top-action-bar {
      position: sticky;
      top: 0;
      z-index: 1000;
      background: #0f172a;
      color: #ffffff;
      padding: 10px 20px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    }
    .top-action-bar .brand-text {
      font-weight: 800;
      font-size: 13px;
      letter-spacing: 0.05em;
      color: #2dd4bf;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .top-action-bar .btn-print {
      background: linear-gradient(135deg, #0d9488 0%, #0f766e 100%);
      color: #ffffff;
      border: 1px solid #2dd4bf;
      padding: 8px 18px;
      border-radius: 8px;
      font-weight: 700;
      font-size: 12px;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 6px;
      box-shadow: 0 2px 6px rgba(13, 148, 136, 0.4);
      transition: all 0.2s ease;
    }
    .top-action-bar .btn-print:hover {
      background: #115e59;
      transform: translateY(-1px);
    }

    .document-container {
      max-width: 900px;
      margin: 16px auto;
      background: #ffffff;
      border: 1px solid #cbd5e1;
      border-radius: 12px;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.06);
      padding: 20px;
    }

    /* Form Header Banner - Exact Match to HFFollowUpForm */
    .form-header-card {
      background: linear-gradient(135deg, #0f766e 0%, #115e59 50%, #0f172a 100%);
      color: #ffffff;
      padding: 16px 20px;
      border-radius: 10px;
      margin-bottom: 16px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .form-header-card h1 {
      margin: 0;
      font-size: 17px;
      font-weight: 800;
      letter-spacing: -0.01em;
      text-transform: uppercase;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .form-header-card p {
      margin: 3px 0 0 0;
      font-size: 10px;
      color: #99f6e4;
      font-weight: 500;
    }
    .hospital-badge {
      background: rgba(255, 255, 255, 0.15);
      border: 1px solid rgba(255, 255, 255, 0.3);
      backdrop-filter: blur(4px);
      padding: 6px 12px;
      border-radius: 8px;
      text-align: right;
    }
    .hospital-badge .org-name {
      font-weight: 800;
      font-size: 11px;
      letter-spacing: 0.05em;
    }
    .hospital-badge .doc-title {
      font-size: 9px;
      color: #ccfbf1;
    }

    /* Section Cards matching HFFollowUpForm UI */
    .section-card {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 10px;
      padding: 14px 16px;
      margin-bottom: 14px;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.02);
      page-break-inside: avoid;
      break-inside: avoid;
    }
    .section-title {
      font-size: 11px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: #0f766e;
      border-bottom: 2px solid #ccfbf1;
      padding-bottom: 6px;
      margin-bottom: 12px;
      display: flex;
      align-items: center;
      gap: 6px;
    }
    
    .grid-2 { display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; }
    .grid-3 { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; }
    .grid-4 { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; }

    .field-box {
      background: #f8fafc;
      border: 1px solid #f1f5f9;
      border-radius: 8px;
      padding: 8px 10px;
    }
    .field-label {
      font-size: 9px;
      font-weight: 700;
      text-transform: uppercase;
      color: #64748b;
      margin-bottom: 3px;
      display: block;
    }
    .field-value {
      font-size: 11px;
      font-weight: 700;
      color: #0f172a;
    }
    .badge-status {
      display: inline-block;
      padding: 3px 8px;
      border-radius: 6px;
      font-weight: 700;
      font-size: 10px;
    }
    .badge-yes { background: #dcfce7; color: #15803d; border: 1px solid #bbf7d0; }
    .badge-no { background: #ffe4e6; color: #be123c; border: 1px solid #fecdd3; }
    .badge-teal { background: #ccfbf1; color: #0f766e; border: 1px solid #99f6e4; }

    /* Interactive Checklist Pills matching HFFollowUpForm UI */
    .checklist-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 8px;
    }
    .checklist-pill {
      border-radius: 8px;
      padding: 6px 10px;
      font-size: 10px;
      font-weight: 600;
      display: flex;
      align-items: center;
      gap: 6px;
      transition: all 0.15s ease;
    }
    .checklist-pill.active-symptom {
      background: #0f766e;
      color: #ffffff;
      border: 1px solid #0d9488;
      box-shadow: 0 1px 3px rgba(15, 118, 110, 0.3);
    }
    .checklist-pill.inactive-symptom {
      background: #f8fafc;
      color: #94a3b8;
      border: 1px solid #e2e8f0;
    }
    .checklist-pill.active-event {
      background: #be123c;
      color: #ffffff;
      border: 1px solid #9f1239;
      box-shadow: 0 1px 3px rgba(190, 18, 60, 0.3);
    }
    .checklist-pill.inactive-event {
      background: #f8fafc;
      color: #94a3b8;
      border: 1px solid #e2e8f0;
    }

    /* Medication Table - Visual Copy of Form Input Grid */
    .med-table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 8px;
      font-size: 10px;
    }
    .med-table th {
      background: #0f766e;
      color: #ffffff;
      font-weight: 700;
      text-transform: uppercase;
      padding: 7px 10px;
      text-align: left;
      font-size: 9px;
      letter-spacing: 0.03em;
    }
    .med-table th:first-child { border-top-left-radius: 6px; }
    .med-table th:last-child { border-top-right-radius: 6px; }
    .med-table td {
      padding: 6px 10px;
      border-bottom: 1px solid #e2e8f0;
    }
    .med-table tr:nth-child(even) {
      background: #f8fafc;
    }
    .med-table tr.active-row {
      background: #f0fdf4;
    }

    /* Lab Metric Cards */
    .lab-metric-card {
      background: #ffffff;
      border: 1px solid #cbd5e1;
      border-left: 4px solid #0f766e;
      border-radius: 8px;
      padding: 8px 10px;
    }

    /* Sign-off footer */
    .footer-sign {
      margin-top: 24px;
      padding-top: 14px;
      border-top: 1px dashed #cbd5e1;
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
    }

    @media print {
      html, body {
        height: auto !important;
        overflow: visible !important;
        background: #ffffff !important;
      }
      .top-action-bar {
        display: none !important;
      }
      .document-container {
        max-width: 100% !important;
        margin: 0 !important;
        padding: 0 !important;
        border: none !important;
        box-shadow: none !important;
      }
      body {
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }
    }
  </style>
</head>
<body>

  <!-- Sticky View Bar -->
  <div class="top-action-bar">
    <div class="brand-text">
      <span>📄 CARE Health System • Heart Failure Follow-up Clinical Report</span>
    </div>
    <button class="btn-print" onclick="window.print()">
      🖨️ Print / Save as PDF
    </button>
  </div>

  <div class="document-container">
    <!-- Header Banner -->
    <div class="form-header-card">
      <div>
        <h1>❤️ CARE HEALTH SYSTEM</h1>
        <p>Heart Failure Registry • Post-Discharge Patient Outreach Record</p>
      </div>
    </div>

    <!-- Section 1: Patient & Encounter Information -->
    <div class="section-card" style="background: #f8fafc;">
      <div class="section-title">
        <span>📅 1. Patient & Encounter Information</span>
      </div>
      <div class="grid-4">
        <div class="field-box">
          <span class="field-label">Patient Name</span>
          <span class="field-value">${patientName}</span>
        </div>
        <div class="field-box">
          <span class="field-label">CARE MR No / UHID</span>
          <span class="field-value">${mrn} ${uhid !== 'N/A' ? `/ ${uhid}` : ''}</span>
        </div>
        <div class="field-box">
          <span class="field-label">Age / Gender</span>
          <span class="field-value">${age} Yrs / ${gender}</span>
        </div>
        <div class="field-box">
          <span class="field-label">Phone Number</span>
          <span class="field-value">${phone}</span>
        </div>
        <div class="field-box">
          <span class="field-label">Follow-up Date</span>
          <span class="field-value">${formatDateForDisplay(followupDate)}</span>
        </div>
        <div class="field-box">
          <span class="field-label">Encounter Mode</span>
          <span class="field-value">${merged.followup_conducted || merged.contact_mode || 'Telephonic follow-up'} (Attempt #${merged.attempt_number || 1})</span>
        </div>
        <div class="field-box">
          <span class="field-label">Assigned Nurse</span>
          <span class="field-value">${assignedNurse}</span>
        </div>
        <div class="field-box">
          <span class="field-label">Answering Status</span>
          <span class="badge-status ${merged.answering_status === 'No' ? 'badge-no' : 'badge-yes'}">
            ${merged.answering_status || 'Yes'} ${merged.no_answer_reason ? `(${merged.no_answer_reason})` : ''}
          </span>
        </div>
      </div>
    </div>

    <!-- Section 2: General Health & Current Medication Status -->
    <div class="section-card">
      <div class="section-title">
        <span>❤️ 2. General Health & Current Medication Status</span>
      </div>
      <div class="grid-4">
        <div class="field-box">
          <span class="field-label">General Health Status</span>
          <span class="badge-status ${merged.health_status === 'Unhealthy' ? 'badge-no' : 'badge-yes'}">
            ${merged.health_status || 'Healthy'}
          </span>
          ${merged.health_unhealthy_details ? `<div style="margin-top:4px; font-size:10px; color:#be123c;">${merged.health_unhealthy_details}</div>` : ''}
        </div>
        <div class="field-box">
          <span class="field-label">Medication Adherence</span>
          <span class="badge-status ${merged.medication_adherence === 'No' ? 'badge-no' : 'badge-yes'}">
            ${merged.medication_adherence || 'Yes'}
          </span>
          ${merged.medication_adherence_no_reason ? `<div style="margin-top:4px; font-size:10px; color:#be123c;">${merged.medication_adherence_no_reason}</div>` : ''}
        </div>
        <div class="field-box">
          <span class="field-label">Side Effects Observed</span>
          <span class="badge-status ${merged.side_effects_observed === 'Yes' ? 'badge-no' : 'badge-yes'}">
            ${merged.side_effects_observed || 'No'}
          </span>
          ${merged.side_effects_details ? `<div style="margin-top:4px; font-size:10px; color:#be123c;">${merged.side_effects_details}</div>` : ''}
        </div>
        <div class="field-box">
          <span class="field-label">Physician Med Changes</span>
          <span class="badge-status ${merged.physician_medication_changes === 'Yes' ? 'badge-teal' : 'badge-yes'}">
            ${merged.physician_medication_changes || 'No'}
          </span>
          ${merged.physician_medication_changes_details ? `<div style="margin-top:4px; font-size:10px; color:#0f766e;">${merged.physician_medication_changes_details}</div>` : ''}
        </div>
      </div>
      ${merged.medications_still_taking ? `
        <div style="margin-top: 10px; background: #f1f5f9; padding: 8px 12px; border-radius: 6px; border: 1px solid #e2e8f0;">
          <span class="field-label">Patient Reported Medications:</span>
          <span style="font-weight: 700; color: #334155;">${merged.medications_still_taking}</span>
        </div>
      ` : ''}
    </div>

    <!-- Section 3: Symptoms Checklist Grid (Exact Visual Match to Form) -->
    <div class="section-card">
      <div class="section-title">
        <span>⚡ 3. New / Worsening Symptoms Checklist</span>
      </div>
      <div class="checklist-grid">
        ${ALL_SYMPTOMS.map(sym => {
          const isSelected = selectedSymptomsList.some(s => s.toLowerCase().trim() === sym.toLowerCase().trim());
          return `
            <div class="checklist-pill ${isSelected ? 'active-symptom' : 'inactive-symptom'}">
              <span>${isSelected ? '✓' : '○'}</span>
              <span>${sym}</span>
            </div>
          `;
        }).join('')}
      </div>
      ${merged.symptom_other_details ? `
        <div style="margin-top: 10px; background: #fff7ed; border: 1px solid #ffedd5; padding: 8px 10px; border-radius: 6px; color: #c2410c; font-weight: 600;">
          Other Symptom Details: ${merged.symptom_other_details}
        </div>
      ` : ''}
    </div>

    <!-- Section 4: Medication Adherence & Visual 17-Drug Category Grid -->
    <div class="section-card">
      <div class="section-title">
        <span>💊 4. Structured 17-Drug Category Medication Checklist</span>
      </div>
      <table class="med-table">
        <thead>
          <tr>
            <th style="width: 25%;">Drug Category</th>
            <th style="width: 35%;">Medication Name</th>
            <th style="width: 20%; text-align: center;">Currently Taking?</th>
            <th style="width: 20%; text-align: center;">Prescribed in Recent Visit?</th>
          </tr>
        </thead>
        <tbody>
          ${drugGrid.map(d => {
            const isTaking = d.taking === 'Yes';
            const isNoTaking = d.taking === 'No';
            return `
              <tr class="${isTaking ? 'active-row' : ''}">
                <td style="font-weight: 700; color: #0f766e;">${d.category || 'Medication'}</td>
                <td style="font-weight: 800; color: #0f172a;">${d.isOther && d.otherName ? d.otherName : d.name}</td>
                <td style="text-align: center;">
                  <span class="badge-status ${isTaking ? 'badge-yes' : isNoTaking ? 'badge-no' : 'badge-teal'}" style="font-size:9px;">
                    ${d.taking || 'Unspecified'}
                  </span>
                </td>
                <td style="text-align: center;">
                  <span class="badge-status ${d.inRecentVisit === 'Yes' ? 'badge-yes' : 'badge-teal'}" style="font-size:9px;">
                    ${d.inRecentVisit || 'Unspecified'}
                  </span>
                </td>
              </tr>
            `;
          }).join('')}
        </tbody>
      </table>
    </div>

    <!-- Section 5: Lab Tests & Investigations -->
    <div class="section-card">
      <div class="section-title">
        <span>5. Lab Tests & Investigations</span>
      </div>
      <div class="grid-4">
        <div class="lab-metric-card">
          <span class="field-label">BNP / NT-proBNP</span>
          <div style="font-size: 12px; font-weight: 800; color: #0f766e;">
            ${merged.bnp_nt_probnp_result || 'Unspecified'}
          </div>
          ${merged.bnp_date ? `<div style="font-size: 9px; color: #64748b;">${formatDateForDisplay(merged.bnp_date)}</div>` : ''}
        </div>
        <div class="lab-metric-card">
          <span class="field-label">Creatinine</span>
          <div style="font-size: 12px; font-weight: 800; color: #0f766e;">
            ${merged.creatinine_result || 'Unspecified'}
          </div>
          ${merged.creatinine_date ? `<div style="font-size: 9px; color: #64748b;">${formatDateForDisplay(merged.creatinine_date)}</div>` : ''}
        </div>
        <div class="lab-metric-card">
          <span class="field-label">Sodium</span>
          <div style="font-size: 12px; font-weight: 800; color: #0f766e;">
            ${merged.sodium_result || 'Unspecified'}
          </div>
          ${merged.sodium_date ? `<div style="font-size: 9px; color: #64748b;">${formatDateForDisplay(merged.sodium_date)}</div>` : ''}
        </div>
        <div class="lab-metric-card">
          <span class="field-label">Hemoglobin</span>
          <div style="font-size: 12px; font-weight: 800; color: #0f766e;">
            ${merged.hemoglobin_result || 'Unspecified'}
          </div>
          ${merged.hemoglobin_date ? `<div style="font-size: 9px; color: #64748b;">${formatDateForDisplay(merged.hemoglobin_date)}</div>` : ''}
        </div>
      </div>
      <div style="margin-top: 10px;" class="grid-2">
        <div class="field-box">
          <span class="field-label">2D Echocardiogram Conducted</span>
          <span class="field-value">${merged.echo_done || 'No'} ${merged.echo_date ? `(${formatDateForDisplay(merged.echo_date)})` : ''}</span>
        </div>
        ${merged.echo_lvef ? `
          <div class="field-box">
            <span class="field-label">LVEF Ejection Fraction (%)</span>
            <span class="field-value" style="color: #0f766e;">${merged.echo_lvef}%</span>
          </div>
        ` : ''}
      </div>
    </div>

    <!-- Section 6: Major Clinical Events Checklist (Exact Visual Match to Form) -->
    <div class="section-card">
      <div class="section-title">
        <span>🚨 6. Major Clinical Events Since Last Follow-up</span>
      </div>
      <div class="checklist-grid">
        ${ALL_CLINICAL_EVENTS.map(evt => {
          const isSelected = selectedClinicalEventsList.some(e => e.toLowerCase().trim() === evt.toLowerCase().trim());
          return `
            <div class="checklist-pill ${isSelected ? 'active-event' : 'inactive-event'}">
              <span>${isSelected ? '✓' : '○'}</span>
              <span>${evt}</span>
            </div>
          `;
        }).join('')}
      </div>
      ${merged.event_other_details ? `
        <div style="margin-top: 10px; background: #fff1f2; border: 1px solid #fecdd3; padding: 8px 10px; border-radius: 6px; color: #be123c; font-weight: 600;">
          Event Details: ${merged.event_other_details}
        </div>
      ` : ''}
    </div>

    <!-- Section 7: Vaccinations, Deceased Record & Nurse Opt-in / Feedback -->
    <div class="section-card">
      <div class="section-title">
        <span>🛡️ 7. Vaccinations, Mortality & Opt-In Status</span>
      </div>
      <div class="grid-2">
        <div class="field-box">
          <span class="field-label">Vaccinations Recorded</span>
          <div style="font-weight: 700; color: #334155; margin-top: 2px;">${merged.vaccinations_details || 'None recorded'}</div>
        </div>
        <div class="field-box">
          <span class="field-label">Follow-up Program Opt-In</span>
          <span class="badge-status badge-yes" style="margin-top: 2px;">${merged.join_program_opt_in || 'Yes'}</span>
        </div>
      </div>

      ${merged.is_deceased === 'Yes' ? `
        <div style="margin-top: 12px; background: #fff1f2; border: 1px solid #fecdd3; padding: 10px 14px; border-radius: 8px; color: #be123c;">
          <div style="font-weight: 800; text-transform: uppercase; font-size: 11px;">⚠️ PATIENT DECEASED RECORD</div>
          <div class="grid-4" style="margin-top: 8px; color: #9f1239;">
            <div><strong>Died in 30 Days:</strong> ${merged.died_within_30days_discharge || 'No'}</div>
            <div><strong>Place of Death:</strong> ${merged.place_of_death || 'N/A'}</div>
            <div><strong>Date of Death:</strong> ${formatDateForDisplay(merged.date_of_death)}</div>
            <div><strong>Cause:</strong> ${merged.cause_of_death === 'Others' ? (merged.cause_of_death_other_details || 'Others') : (merged.cause_of_death || 'Cardiac')}</div>
          </div>
        </div>
      ` : ''}

      ${merged.patient_feedback ? `
        <div style="margin-top: 12px; background: #f8fafc; border: 1px solid #e2e8f0; padding: 10px 14px; border-radius: 8px;">
          <span class="field-label">Patient Feedback & Nurse Observations</span>
          <div style="font-weight: 600; color: #334155; margin-top: 4px; white-space: pre-line;">${merged.patient_feedback}</div>
        </div>
      ` : ''}
    </div>

    <!-- Sign-off Footer -->
    <div class="footer-sign">
      <div>
        <div style="font-size: 9px; color: #64748b; font-weight: 600;">Report Generated: ${formatDateTimeForDisplay(new Date())}</div>
        <div style="font-size: 9px; color: #64748b;">CARE Health System • Heart Failure Audit Registry</div>
      </div>
      <div style="border-top: 1px solid #0f172a; width: 180px; text-align: center; padding-top: 4px;">
        <div style="font-weight: 700; font-size: 11px;">${assignedNurse}</div>
        <div style="font-size: 9px; color: #64748b;">Staff Nurse Signature & Stamp</div>
      </div>
    </div>
  </div>

</body>
</html>
  `;

  // Create Blob URL to keep the app base URL context intact (prevents about:blank)
  const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
  const blobUrl = URL.createObjectURL(blob);
  const printWindow = window.open(blobUrl, '_blank');
  
  if (!printWindow) {
    alert('Please allow popups to view the Heart Failure Follow-up report.');
  }
}
