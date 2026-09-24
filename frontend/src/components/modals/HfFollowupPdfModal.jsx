import React, { useEffect } from 'react';
import { FileText, Printer, X, Check } from 'lucide-react';
import { formatDateForDisplay, formatDateTimeForDisplay } from '../../utils/dateUtils';

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

// Strict Sanitization for Yes/No Output values (Fixes 'Ves' typo -> 'Yes')
function sanitizeYesNo(val) {
  if (val === null || val === undefined || val === '') return 'Unspecified';
  const str = String(val).trim().toLowerCase();
  if (str === 'yes' || str === 'ves' || str === 'true' || str === 'y') return 'Yes';
  if (str === 'no' || str === 'false' || str === 'n') return 'No';
  return val;
}

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

export default function HfFollowupPdfModal({ isOpen, onClose, logData = {}, patientData = {} }) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

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
  const dateOfAdmission = merged.date_of_admission || patientData.date_of_admission || patientData.admission_date || null;
  const dateOfDischarge = merged.date_of_discharge || patientData.date_of_discharge || patientData.discharge_date || null;

  const selectedSymptomsList = Array.isArray(merged.selected_symptoms)
    ? merged.selected_symptoms
    : (merged.selected_symptoms ? String(merged.selected_symptoms).split(',').map(s => s.trim()) : []);

  const selectedClinicalEventsList = Array.isArray(merged.selected_clinical_events)
    ? merged.selected_clinical_events
    : (merged.selected_clinical_events ? String(merged.selected_clinical_events).split(',').map(s => s.trim()) : []);

  const rawDrugGrid = (Array.isArray(merged.drug_grid) && merged.drug_grid.length > 0)
    ? merged.drug_grid
    : DEFAULT_DRUG_LIST;

  // Clean Drug Grid filter (Fixes Bug 2 duplicate header row issue)
  const drugGrid = rawDrugGrid.filter((row) => {
    if (!row) return false;
    const cat = (row.category || '').toString().toLowerCase().trim();
    const name = (row.name || row.otherName || '').toString().toLowerCase().trim();
    return cat !== 'category' && name !== 'generic drug name' && cat !== 'check' && name !== 'check';
  });

  const isDeceased = merged.is_deceased === 'Yes';

  const handlePrint = () => {
    const content = document.getElementById('hf-pdf-printable-area');
    if (!content) return;

    let cssStyles = '';
    Array.from(document.styleSheets).forEach(sheet => {
      try {
        if (sheet.cssRules) {
          Array.from(sheet.cssRules).forEach(rule => {
            cssStyles += rule.cssText + '\n';
          });
        }
      } catch (e) {
        // Ignore CORS stylesheet errors if any
      }
    });

    const oldIframe = document.getElementById('hf-pdf-print-frame');
    if (oldIframe) {
      document.body.removeChild(oldIframe);
    }

    const iframe = document.createElement('iframe');
    iframe.id = 'hf-pdf-print-frame';
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = 'none';
    iframe.style.visibility = 'hidden';
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow.document;
    doc.open();
    doc.write(`
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <title>HF_Followup_Report_${mrn}_${followupDate}</title>
        <style>
          @page {
            size: A4 portrait;
            margin: 8mm 10mm 10mm 10mm;
          }
          html, body {
            background: #ffffff !important;
            color: #0f172a !important;
            margin: 0 !important;
            padding: 0 !important;
            font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif !important;
            font-size: 10px !important;
            line-height: 1.3 !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          *, *::before, *::after {
            box-sizing: border-box !important;
            word-break: break-all !important;
            overflow-wrap: anywhere !important;
            white-space: pre-wrap !important;
          }
          table {
            table-layout: fixed !important;
            width: 100% !important;
          }
          .pdf-section-card {
            page-break-inside: avoid !important;
            break-inside: avoid !important;
            margin-bottom: 10px !important;
          }
          ${cssStyles}
        </style>
      </head>
      <body>
        <div style="max-width: 1000px; margin: 0 auto; padding: 6px;">
          ${content.innerHTML}
        </div>
      </body>
      </html>
    `);
    doc.close();

    setTimeout(() => {
      iframe.contentWindow.focus();
      iframe.contentWindow.print();
      setTimeout(() => {
        if (document.body.contains(iframe)) {
          document.body.removeChild(iframe);
        }
      }, 1500);
    }, 400);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-xs flex justify-center items-center p-2 sm:p-3 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-[1500px] w-[96vw] max-h-[96vh] flex flex-col border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header Bar */}
        <div className="bg-slate-900 text-white px-5 py-3 flex justify-between items-center shrink-0 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-teal-600 rounded-xl text-white shadow-xs">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-black tracking-tight text-slate-100 flex items-center gap-2">
                <span>Heart Failure Follow-up Clinical Report</span>
                <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-teal-500/20 text-teal-300 border border-teal-500/30">
                  Live Response View
                </span>
              </h2>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Patient MRN: <strong className="text-slate-200 font-mono break-all">{mrn}</strong> • Follow-up Date: <strong className="text-slate-200">{formatDateForDisplay(followupDate)}</strong>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={handlePrint}
              className="px-4 py-2 bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-500 hover:to-teal-600 text-white font-extrabold text-xs rounded-xl transition-all flex items-center gap-2 shadow-sm border border-teal-400/40 cursor-pointer"
              title="Print or Save this clinical response as PDF"
            >
              <Printer className="w-4 h-4" />
              <span>🖨️ Print / Save as PDF</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
              title="Close View"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Document Content Body */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-4 bg-slate-50/50" id="hf-pdf-printable-area">
          
          {/* CARE HEALTH SYSTEM Header Banner */}
          <div className="bg-gradient-to-r from-teal-800 via-teal-700 to-slate-900 text-white rounded-xl p-4 shadow-xs flex justify-between items-center flex-wrap gap-2 border border-teal-900/40 pdf-section-card">
            <div>
              <h1 className="text-lg font-black tracking-tight text-white uppercase">
                CARE HEALTH SYSTEM
              </h1>
              <p className="text-[11px] text-teal-200 font-medium mt-0.5">Heart Failure Registry • Post-Discharge Patient Outreach Record</p>
            </div>
          </div>

          {/* Continuous Single Report Container */}
          <div className="bg-white rounded-xl p-4 sm:p-5 border border-slate-200 shadow-2xs space-y-4 pdf-section-card">

            {/* Encounter Metadata Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2.5 text-xs bg-slate-50/80 p-3 rounded-xl border border-slate-200">
              <div className="bg-white p-2 rounded-lg border border-slate-200 min-w-0">
                <span className="block text-[9px] font-bold text-slate-500 uppercase">Patient Name</span>
                <span className="font-extrabold text-slate-800 text-xs mt-0.5 block break-words break-all">{patientName}</span>
              </div>
              <div className="bg-white p-2 rounded-lg border border-slate-200 min-w-0">
                <span className="block text-[9px] font-bold text-slate-500 uppercase">UHID / MRN</span>
                <span className="font-extrabold text-slate-800 text-xs mt-0.5 block font-mono break-words break-all">{uhid !== 'N/A' ? uhid : mrn}</span>
              </div>
              <div className="bg-white p-2 rounded-lg border border-slate-200 min-w-0">
                <span className="block text-[9px] font-bold text-slate-500 uppercase">Date Of Admission</span>
                <span className="font-bold text-slate-800 text-[11px] mt-0.5 block">{dateOfAdmission ? formatDateForDisplay(dateOfAdmission) : 'N/A'}</span>
              </div>
              <div className="bg-white p-2 rounded-lg border border-slate-200 min-w-0">
                <span className="block text-[9px] font-bold text-slate-500 uppercase">Date of Discharge</span>
                <span className="font-bold text-slate-800 text-[11px] mt-0.5 block">{dateOfDischarge ? formatDateForDisplay(dateOfDischarge) : 'N/A'}</span>
              </div>
              <div className="bg-white p-2 rounded-lg border border-slate-200 min-w-0">
                <span className="block text-[9px] font-bold text-slate-500 uppercase">Patient Follow-up date</span>
                <span className="font-extrabold text-slate-800 text-[11px] mt-0.5 block">{formatDateForDisplay(followupDate)}</span>
              </div>
              <div className="bg-white p-2 rounded-lg border border-slate-200 min-w-0">
                <span className="block text-[9px] font-bold text-slate-500 uppercase">Follow-up conducted</span>
                <span className="font-bold text-slate-800 text-[11px] mt-0.5 block">{merged.followup_conducted || merged.contact_mode || 'Telephonic follow-up'}</span>
              </div>
              <div className="bg-white p-2 rounded-lg border border-slate-200 min-w-0">
                <span className="block text-[9px] font-bold text-slate-500 uppercase">Follow-up attempts</span>
                <span className="font-bold text-slate-800 text-[11px] mt-0.5 block">{merged.attempt_number || 1}</span>
              </div>
              <div className="bg-white p-2 rounded-lg border border-slate-200 col-span-2 sm:col-span-1 min-w-0">
                <span className="block text-[9px] font-bold text-slate-500 uppercase">Answering Status</span>
                <span className={`inline-block px-2 py-0.5 rounded text-[9px] font-bold uppercase mt-0.5 border ${
                  sanitizeYesNo(merged.answering_status) === 'No' ? 'bg-rose-100 text-rose-800 border-rose-200' : sanitizeYesNo(merged.answering_status) === 'Yes' ? 'bg-emerald-100 text-emerald-800 border-emerald-200' : 'bg-slate-200 text-slate-700 border-slate-300'
                }`}>
                  {sanitizeYesNo(merged.answering_status)}
                </span>
                {merged.no_answer_reason && (
                  <p className="text-[9px] text-rose-700 font-semibold mt-0.5 break-words break-all whitespace-pre-wrap">Reason (If,No): {merged.no_answer_reason}</p>
                )}
              </div>
            </div>

            {/* Health & Medication Status */}
            <div className="space-y-2 pt-1 border-t border-slate-200">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
                <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 min-w-0">
                  <span className="block text-[9px] font-bold text-slate-500 uppercase mb-0.5">Since your last visit,are you</span>
                  <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-extrabold uppercase border ${
                    merged.health_status === 'Unhealthy' ? 'bg-rose-100 text-rose-800 border-rose-200' : merged.health_status === 'Healthy' ? 'bg-emerald-100 text-emerald-800 border-emerald-200' : 'bg-slate-200 text-slate-700 border-slate-300'
                  }`}>
                    {merged.health_status || 'Unspecified'}
                  </span>
                  {merged.health_unhealthy_details && (
                    <p className="text-[10px] text-rose-700 font-semibold mt-1 break-words break-all whitespace-pre-wrap">If unhealthy,Please specify: {merged.health_unhealthy_details}</p>
                  )}
                </div>

                <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 min-w-0">
                  <span className="block text-[9px] font-bold text-slate-500 uppercase mb-0.5">Any sideeffects observed</span>
                  <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-extrabold uppercase border ${
                    sanitizeYesNo(merged.side_effects_observed) === 'Yes' ? 'bg-rose-100 text-rose-800 border-rose-200' : sanitizeYesNo(merged.side_effects_observed) === 'No' ? 'bg-emerald-100 text-emerald-800 border-emerald-200' : 'bg-slate-200 text-slate-700 border-slate-300'
                  }`}>
                    {sanitizeYesNo(merged.side_effects_observed)}
                  </span>
                  {merged.side_effects_details && (
                    <p className="text-[10px] text-rose-700 font-semibold mt-1 break-words break-all whitespace-pre-wrap">If Yes,please describe: {merged.side_effects_details}</p>
                  )}
                </div>

                <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 min-w-0">
                  <span className="block text-[9px] font-bold text-slate-500 uppercase mb-0.5">Any changes in Medications by Physician</span>
                  <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-extrabold uppercase border ${
                    sanitizeYesNo(merged.physician_medication_changes) === 'Yes' ? 'bg-teal-100 text-teal-800 border-teal-200' : sanitizeYesNo(merged.physician_medication_changes) === 'No' ? 'bg-slate-200 text-slate-700 border-slate-300' : 'bg-slate-200 text-slate-700 border-slate-300'
                  }`}>
                    {sanitizeYesNo(merged.physician_medication_changes)}
                  </span>
                  {merged.physician_medication_changes_details && (
                    <p className="text-[10px] text-teal-800 font-semibold mt-1 break-words break-all whitespace-pre-wrap">If Yes,please specify: {merged.physician_medication_changes_details}</p>
                  )}
                </div>
              </div>

              {merged.medications_still_taking && (
                <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 text-xs min-w-0">
                  <span className="font-bold text-slate-600 uppercase text-[9px] block">What Medications are you still taking?(please specify)</span>
                  <p className="font-bold text-slate-800 mt-0.5 leading-snug break-words break-all whitespace-pre-wrap">{merged.medications_still_taking}</p>
                </div>
              )}
            </div>

            {/* Symptoms Checklist */}
            <div className="space-y-2 pt-1 border-t border-slate-200">
              <span className="block font-extrabold text-teal-900 uppercase tracking-wider text-[10px]">
                Any new symptoms,please tick all that apply
              </span>

              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-1.5">
                {ALL_SYMPTOMS.map((sym) => {
                  const isSelected = selectedSymptomsList.some((s) => s.toLowerCase().trim() === sym.toLowerCase().trim());
                  return (
                    <div
                      key={sym}
                      className={`p-1.5 rounded-lg border text-[10px] font-bold flex items-center justify-between transition-all ${
                        isSelected
                          ? 'bg-teal-700 text-white border-teal-700 shadow-2xs'
                          : 'bg-slate-50 text-slate-400 border-slate-200'
                      }`}
                    >
                      <span className="truncate">{sym}</span>
                      <div className={`w-3.5 h-3.5 rounded-full flex items-center justify-center shrink-0 ml-1 ${isSelected ? 'bg-white text-teal-800' : 'border border-slate-300'}`}>
                        {isSelected && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                      </div>
                    </div>
                  );
                })}
              </div>

              {merged.symptom_other_details && (
                <div className="bg-amber-50 p-2 rounded-lg border border-amber-200 text-[11px] text-amber-900 font-semibold break-words break-all whitespace-pre-wrap min-w-0">
                  Other (please specify): {merged.symptom_other_details}
                </div>
              )}
            </div>

            {/* Medication Adherence & Category Drug Table (FIXED TABLE LAYOUT + STRICT 'YES' SANITIZATION) */}
            <div className="space-y-2.5 pt-1 border-t border-slate-200">
              <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 text-xs min-w-0">
                <span className="block text-[9px] font-bold text-slate-500 uppercase mb-0.5">Medication Adherence- Are you following medication as prescribed</span>
                <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-black uppercase border ${
                  sanitizeYesNo(merged.medication_adherence) === 'No' ? 'bg-rose-100 text-rose-800 border-rose-200' : sanitizeYesNo(merged.medication_adherence) === 'Yes' ? 'bg-emerald-100 text-emerald-800 border-emerald-200' : 'bg-slate-200 text-slate-700 border-slate-300'
                }`}>
                  {sanitizeYesNo(merged.medication_adherence)}
                </span>
                {merged.medication_adherence_no_reason && (
                  <p className="text-[10px] text-rose-700 font-semibold mt-1 break-words break-all whitespace-pre-wrap">If no, please specify the reason: {merged.medication_adherence_no_reason}</p>
                )}
              </div>

              <div className="overflow-x-auto rounded-lg border border-slate-200">
                <table className="w-full text-left text-xs border-collapse table-fixed">
                  <thead>
                    <tr className="bg-teal-700 text-white font-extrabold text-[9px] uppercase tracking-wider">
                      <th className="py-1.5 px-2.5 w-1/4 break-words break-all">Category</th>
                      <th className="py-1.5 px-2.5 w-2/5 break-words break-all">Generic Drug Name</th>
                      <th className="py-1.5 px-2 text-center w-1/6 break-words break-all">Check</th>
                      <th className="py-1.5 px-2 text-center w-1/6 break-words break-all">Present in most recent IP/OP visit</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {drugGrid.map((d, index) => {
                      const takingVal = sanitizeYesNo(d.taking);
                      const recentVal = sanitizeYesNo(d.inRecentVisit);
                      const isTakingYes = takingVal === 'Yes';
                      const isTakingNo = takingVal === 'No';

                      return (
                        <tr key={index} className={isTakingYes ? 'bg-emerald-50/70' : index % 2 === 0 ? 'bg-slate-50/50' : 'bg-white'}>
                          <td className="py-1 px-2.5 font-bold text-teal-800 text-[10px] break-words break-all">{d.category || 'Medication'}</td>
                          <td className="py-1 px-2.5 font-extrabold text-slate-800 text-[11px] break-words break-all">{d.isOther && d.otherName ? d.otherName : d.name}</td>
                          <td className="py-1 px-2 text-center">
                            <span className={`inline-block px-2 py-0.5 rounded text-[9px] font-extrabold border ${
                              isTakingYes ? 'bg-emerald-100 text-emerald-800 border-emerald-300' : isTakingNo ? 'bg-rose-100 text-rose-800 border-rose-300' : 'bg-slate-100 text-slate-600 border-slate-300'
                            }`}>
                              {takingVal}
                            </span>
                          </td>
                          <td className="py-1 px-2 text-center">
                            <span className={`inline-block px-2 py-0.5 rounded text-[9px] font-extrabold border ${
                              recentVal === 'Yes' ? 'bg-teal-100 text-teal-800 border-teal-300' : 'bg-slate-100 text-slate-600 border-slate-300'
                            }`}>
                              {recentVal}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Lab Tests & Investigations */}
            <div className="space-y-2 pt-1 border-t border-slate-200">
              <span className="block font-extrabold text-teal-900 uppercase tracking-wider text-[10px]">
                Lab Tests & Investigations
              </span>

              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                <div className="bg-white p-2 rounded-lg border border-slate-200 border-l-4 border-l-teal-600 shadow-2xs min-w-0">
                  <span className="block text-[9px] font-bold text-slate-500 uppercase">BNP/NT-proBNP</span>
                  <span className="font-extrabold text-teal-800 text-xs block mt-0.5 break-words break-all">{merged.bnp_nt_probnp_result || 'Unspecified'}</span>
                </div>

                <div className="bg-white p-2 rounded-lg border border-slate-200 border-l-4 border-l-teal-600 shadow-2xs min-w-0">
                  <span className="block text-[9px] font-bold text-slate-500 uppercase">Creatinine</span>
                  <span className="font-extrabold text-teal-800 text-xs block mt-0.5 break-words break-all">{merged.creatinine_result || 'Unspecified'}</span>
                </div>

                <div className="bg-white p-2 rounded-lg border border-slate-200 border-l-4 border-l-teal-600 shadow-2xs min-w-0">
                  <span className="block text-[9px] font-bold text-slate-500 uppercase">Sodium</span>
                  <span className="font-extrabold text-teal-800 text-xs block mt-0.5 break-words break-all">{merged.sodium_result || 'Unspecified'}</span>
                </div>

                <div className="bg-white p-2 rounded-lg border border-slate-200 border-l-4 border-l-teal-600 shadow-2xs min-w-0">
                  <span className="block text-[9px] font-bold text-slate-500 uppercase">Haemoglobin</span>
                  <span className="font-extrabold text-teal-800 text-xs block mt-0.5 break-words break-all">{merged.hemoglobin_result || 'Unspecified'}</span>
                </div>

                <div className="bg-white p-2 rounded-lg border border-slate-200 border-l-4 border-l-teal-600 shadow-2xs min-w-0">
                  <span className="block text-[9px] font-bold text-slate-500 uppercase">2D ECHO</span>
                  <span className="font-extrabold text-slate-800 text-xs mt-0.5 block break-words break-all">
                    {sanitizeYesNo(merged.echo_done)} {merged.echo_date ? `(${formatDateForDisplay(merged.echo_date)})` : ''}
                  </span>
                </div>
              </div>
            </div>

            {/* Major Clinical Events */}
            <div className="space-y-2 pt-1 border-t border-slate-200">
              <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 text-xs min-w-0">
                <span className="block text-[9px] font-bold text-slate-500 uppercase mb-0.5">Has the patient experienced any major clinical event since the last follow-up?</span>
                <span className={`inline-block px-2 py-0.5 rounded text-[9px] font-black uppercase border ${
                  sanitizeYesNo(merged.has_major_clinical_event) === 'Yes' ? 'bg-rose-100 text-rose-800 border-rose-200' : sanitizeYesNo(merged.has_major_clinical_event) === 'No' ? 'bg-emerald-100 text-emerald-800 border-emerald-200' : 'bg-slate-200 text-slate-700 border-slate-300'
                }`}>
                  {sanitizeYesNo(merged.has_major_clinical_event)}
                </span>
              </div>

              {sanitizeYesNo(merged.has_major_clinical_event) === 'Yes' && (
                <>
                  <span className="block text-[9px] font-bold text-rose-700 uppercase tracking-wider">Yes — select all that apply:</span>
                  <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-1.5">
                    {ALL_CLINICAL_EVENTS.map((evt) => {
                      const isSelected = selectedClinicalEventsList.some((e) => e.toLowerCase().trim() === evt.toLowerCase().trim());
                      return (
                        <div
                          key={evt}
                          className={`p-1.5 rounded-lg border text-[10px] font-bold flex items-center justify-between transition-all ${
                            isSelected
                              ? 'bg-rose-700 text-white border-rose-700 shadow-2xs'
                              : 'bg-slate-50 text-slate-400 border-slate-200'
                          }`}
                        >
                          <span className="truncate">{evt}</span>
                          <div className={`w-3.5 h-3.5 rounded-full flex items-center justify-center shrink-0 ml-1 ${isSelected ? 'bg-white text-rose-800' : 'border border-slate-300'}`}>
                            {isSelected && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}

              {merged.event_other_details && (
                <div className="bg-rose-50 p-2 rounded-lg border border-rose-200 text-[11px] text-rose-900 font-semibold break-words break-all whitespace-pre-wrap min-w-0">
                  Other: {merged.event_other_details}
                </div>
              )}
            </div>

            {/* Vaccinations, Death, Opt-In & Feedback (MORTALITY PROTECTION REPORTING) */}
            <div className="space-y-2 pt-1 border-t border-slate-200">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 min-w-0">
                  <span className="block text-[9px] font-bold text-slate-500 uppercase">Any Vaccinations (please specify)</span>
                  <span className="font-bold text-slate-800 block mt-0.5 text-xs break-words break-all whitespace-pre-wrap">
                    {isDeceased ? 'N/A (Deceased)' : (merged.vaccinations_details || 'None recorded')}
                  </span>
                </div>
                <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 min-w-0">
                  <span className="block text-[9px] font-bold text-slate-500 uppercase">Do you want to join in follow-up program</span>
                  <span className={`inline-block px-2 py-0.5 rounded text-[9px] font-black uppercase mt-0.5 border ${
                    (isDeceased ? 'No' : sanitizeYesNo(merged.join_program_opt_in)) === 'Yes' ? 'bg-emerald-100 text-emerald-800 border-emerald-300' : 'bg-rose-100 text-rose-800 border-rose-200'
                  }`}>
                    {isDeceased ? 'No' : sanitizeYesNo(merged.join_program_opt_in)}
                  </span>
                </div>
              </div>

              {isDeceased && (
                <div className="bg-rose-50 border border-rose-200 rounded-lg p-3 text-xs space-y-1 text-rose-900 min-w-0">
                  <div className="font-black text-xs uppercase text-rose-700">Death: YES</div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                    <div><strong>If death,died within 30days of discharge:</strong> {sanitizeYesNo(merged.died_within_30days_discharge)}</div>
                    <div className="break-words break-all"><strong>Place of death:</strong> {merged.place_of_death || 'N/A'}</div>
                    <div><strong>Date of Death:</strong> {formatDateForDisplay(merged.date_of_death)}</div>
                    <div className="break-words break-all"><strong>Cause of Death:</strong> {merged.cause_of_death === 'Others' ? (merged.cause_of_death_other_details || 'Others specify') : (merged.cause_of_death || 'Cardiac')}</div>
                  </div>
                </div>
              )}

              {!isDeceased && merged.patient_feedback && (
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-xs min-w-0">
                  <span className="font-bold text-slate-600 uppercase text-[9px] block">Patient Feedback:</span>
                  <p className="font-medium text-slate-800 mt-0.5 whitespace-pre-wrap break-words break-all leading-relaxed">{merged.patient_feedback}</p>
                </div>
              )}
            </div>

            {/* Sign-off Footer */}
            <div className="pt-4 border-t border-slate-300 flex justify-between items-end flex-wrap gap-3 text-xs pdf-section-card">
              <div>
                <p className="text-[10px] font-semibold text-slate-500">Report Generated: {formatDateTimeForDisplay(new Date())}</p>
                <p className="text-[9px] text-slate-400">CARE Health System • Heart Failure Audit Registry</p>
              </div>
              <div className="border-t border-slate-900 pt-1 w-44 text-center">
                <span className="font-extrabold text-slate-800 block text-xs">{assignedNurse}</span>
                <span className="text-[8px] text-slate-400 block uppercase font-medium">Staff Nurse Signature & Stamp</span>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
