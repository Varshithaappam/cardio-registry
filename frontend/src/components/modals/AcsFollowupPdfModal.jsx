import React, { useEffect } from 'react';
import { FileText, Printer, Download, X, Check, Activity, Heart, Shield, AlertTriangle } from 'lucide-react';
import { formatDateForDisplay, formatDateTimeForDisplay } from '../../utils/dateUtils';

const DEFAULT_ACS_DRUG_LIST = [
  { name: 'Beta-blocker', taking: null, inRecentVisit: null },
  { name: 'Calcium-channel blocker', taking: null, inRecentVisit: null },
  { name: 'Nitrate', taking: null, inRecentVisit: null },
  { name: 'Nicorandil', taking: null, inRecentVisit: null },
  { name: 'Ivabradine', taking: null, inRecentVisit: null },
  { name: 'Ranozolidine', taking: null, inRecentVisit: null },
  { name: 'Trimetazidine', taking: null, inRecentVisit: null },
  { name: 'Aspirin', taking: null, inRecentVisit: null },
  { name: 'Clopidigrel', taking: null, inRecentVisit: null },
  { name: 'Prasugrel', taking: null, inRecentVisit: null },
  { name: 'Ticagralor', taking: null, inRecentVisit: null },
  { name: 'Gp2b3a', taking: null, inRecentVisit: null },
  { name: 'Bivaluridin', taking: null, inRecentVisit: null },
  { name: 'Statin', taking: null, inRecentVisit: null, dose: '' },
  { name: 'Any other', isOther: true, otherName: '', taking: null, inRecentVisit: null }
];

const ALL_SYMPTOMS = [
  'Chest pain/discomfort',
  'Fatigue',
  'Nausea/vomiting',
  'Reduced exercise tolerance',
  'Shortness of breath',
  'Dizziness/light-headedness',
  'Pedal edema',
  'Weakness',
  'Palpitations',
  'Syncope/fainting',
  'Orthopnea',
  'PND',
  'Sweating',
  'Cough'
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

function sanitizeYesNo(val) {
  if (val === null || val === undefined || val === '') return 'Unspecified';
  const str = String(val).trim().toLowerCase();
  if (str === 'yes' || str === 'ves' || str === 'true' || str === 'y') return 'Yes';
  if (str === 'no' || str === 'false' || str === 'n') return 'No';
  return val;
}

export default function AcsFollowupPdfModal({ isOpen, onClose, logData = {}, patientData = {}, registryType = 'STEMI' }) {
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

  // Extract raw form JSON or fallback data
  let rawData = {};
  if (logData.raw_form_json) {
    try {
      rawData = typeof logData.raw_form_json === 'string' 
        ? JSON.parse(logData.raw_form_json) 
        : logData.raw_form_json;
    } catch (_) {
      rawData = {};
    }
  }

  const titleType = (rawData.registry_type || registryType || logData.registry_type || 'STEMI').toUpperCase();
  const isStemi = titleType.includes('STEMI') && !titleType.includes('NSTEMI');

  const selectedSymptoms = Array.isArray(rawData.selected_symptoms)
    ? rawData.selected_symptoms
    : (typeof rawData.selected_symptoms === 'string' && rawData.selected_symptoms ? rawData.selected_symptoms.split(',').map(s => s.trim()) : []);

  const selectedEvents = Array.isArray(rawData.selected_clinical_events)
    ? rawData.selected_clinical_events
    : (typeof rawData.selected_clinical_events === 'string' && rawData.selected_clinical_events ? rawData.selected_clinical_events.split(',').map(e => e.trim()) : []);

  const drugGrid = Array.isArray(rawData.drug_grid) ? rawData.drug_grid : DEFAULT_ACS_DRUG_LIST;

  const handlePrint = () => {
    const content = document.getElementById('acs-pdf-printable-area');
    if (!content) {
      window.print();
      return;
    }

    let cssStyles = '';
    Array.from(document.styleSheets).forEach(sheet => {
      try {
        if (sheet.cssRules) {
          Array.from(sheet.cssRules).forEach(rule => {
            cssStyles += rule.cssText + '\n';
          });
        }
      } catch (_) {}
    });

    const oldIframe = document.getElementById('acs-pdf-print-frame');
    if (oldIframe) {
      document.body.removeChild(oldIframe);
    }

    const iframe = document.createElement('iframe');
    iframe.id = 'acs-pdf-print-frame';
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
        <title>${titleType}_Followup_Report_${patientData.mr_no || 'MRN'}_${logData.created_at ? logData.created_at.split('T')[0] : 'Date'}</title>
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
          }
          ${cssStyles}
        </style>
      </head>
      <body>
        ${content.outerHTML}
      </body>
      </html>
    `);
    doc.close();

    setTimeout(() => {
      iframe.contentWindow.focus();
      iframe.contentWindow.print();
    }, 400);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto animate-fadeIn">
      <div className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh] my-auto">
        {/* Header */}
        <div className={`px-6 py-4 border-b flex items-center justify-between text-white ${isStemi ? 'bg-gradient-to-r from-red-600 to-red-700' : 'bg-gradient-to-r from-amber-600 to-orange-700'}`}>
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-white/15 backdrop-blur-md rounded-xl">
              <FileText className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-lg tracking-tight">
                  {titleType} Detailed Follow-Up Record
                </h3>
                <span className="px-2.5 py-0.5 bg-white/20 text-white font-bold text-[11px] rounded-full uppercase tracking-wider border border-white/20">
                  {titleType}
                </span>
              </div>
              <p className="text-xs text-white/80 font-medium">
                Patient ID: {logData.reg_patient_id || patientData.reg_patient_id || 'N/A'} | Logged: {formatDateTimeForDisplay(logData.created_at || new Date())}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-3.5 py-2 bg-white/15 hover:bg-white/25 text-white font-semibold text-xs rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer border border-white/20"
              title="Print Record"
            >
              <Printer className="w-4 h-4" />
              <span>Print PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 text-white rounded-xl transition-all cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div id="acs-pdf-printable-area" className="p-6 overflow-y-auto space-y-6 text-slate-800 text-sm">
          {/* Patient Overview Card */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
            <div>
              <span className="text-slate-500 font-medium block">Patient Name / UHID:</span>
              <span className="font-bold text-slate-900 text-sm">
                {patientData.patient_name || rawData.patient_name || 'N/A'} ({patientData.uhid || rawData.uhid || 'N/A'})
              </span>
            </div>
            <div>
              <span className="text-slate-500 font-medium block">Episode / IP No:</span>
              <span className="font-bold text-slate-800">
                {rawData.ip_no || patientData.ip_no || 'N/A'} {rawData.acs_no ? `(ACS: ${rawData.acs_no})` : ''}
              </span>
            </div>
            <div>
              <span className="text-slate-500 font-medium block">Follow-up Conducted:</span>
              <span className="font-bold text-slate-800">{rawData.followup_conducted || logData.contact_mode || 'Telephonic follow-up'}</span>
            </div>
            <div>
              <span className="text-slate-500 font-medium block">Attempt / Answering:</span>
              <span className="font-bold text-slate-800">
                Attempt #{rawData.attempt_number || 1} — {rawData.answering_status || 'Yes'}
              </span>
            </div>
          </div>

          {/* Section 1: Health Status & Medication Changes */}
          <div className="border border-slate-200 rounded-xl p-4 space-y-3">
            <h4 className="font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-2 text-xs uppercase tracking-wider text-slate-600">
              <Heart className="w-4 h-4 text-red-500" />
              1. General Health Overview & Medication Changes
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div>
                <span className="text-slate-500 block">General Health Status:</span>
                <span className={`font-bold inline-block px-2 py-0.5 rounded text-xs mt-1 ${rawData.health_status === 'Unhealthy' ? 'bg-red-100 text-red-800' : 'bg-emerald-100 text-emerald-800'}`}>
                  {rawData.health_status || 'Healthy'}
                </span>
                {rawData.health_unhealthy_details && (
                  <p className="text-slate-600 mt-1 italic">{rawData.health_unhealthy_details}</p>
                )}
              </div>
              <div>
                <span className="text-slate-500 block">Side Effects Observed:</span>
                <span className="font-semibold text-slate-800">{sanitizeYesNo(rawData.side_effects_observed)}</span>
                {rawData.side_effects_details && (
                  <p className="text-slate-600 mt-1 italic">{rawData.side_effects_details}</p>
                )}
              </div>
              <div>
                <span className="text-slate-500 block">Physician Medication Changes:</span>
                <span className="font-semibold text-slate-800">{sanitizeYesNo(rawData.physician_medication_changes)}</span>
                {rawData.physician_medication_changes_details && (
                  <p className="text-slate-600 mt-1 italic">{rawData.physician_medication_changes_details}</p>
                )}
              </div>
            </div>
            {rawData.medications_still_taking && (
              <div className="pt-2 text-xs border-t border-slate-100">
                <span className="text-slate-500 block font-medium">Medications Still Taking:</span>
                <p className="text-slate-800 mt-0.5">{rawData.medications_still_taking}</p>
              </div>
            )}
            {rawData.new_health_complaints && (
              <div className="pt-2 text-xs border-t border-slate-100">
                <span className="text-slate-500 block font-medium">New Health Complaints:</span>
                <p className="text-slate-800 mt-0.5">{rawData.new_health_complaints}</p>
              </div>
            )}
          </div>

          {/* Section 2: Symptoms Checklist */}
          <div className="border border-slate-200 rounded-xl p-4 space-y-3">
            <h4 className="font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-2 text-xs uppercase tracking-wider text-slate-600">
              <Activity className="w-4 h-4 text-blue-500" />
              2. New Symptoms Checklist
            </h4>
            {selectedSymptoms.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {selectedSymptoms.map((sym, idx) => (
                  <span key={idx} className="px-2.5 py-1 bg-amber-50 border border-amber-200 text-amber-900 font-medium text-xs rounded-lg flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                    {sym}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-500 italic">No new symptoms reported by patient during this follow-up contact.</p>
            )}
            {rawData.symptom_other_details && (
              <p className="text-xs text-slate-700 bg-slate-50 p-2 rounded border border-slate-200">
                <strong>Other Symptom Details:</strong> {rawData.symptom_other_details}
              </p>
            )}
          </div>

          {/* Section 3: Medication Adherence & Drug Grid */}
          <div className="border border-slate-200 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h4 className="font-bold text-slate-900 flex items-center gap-2 text-xs uppercase tracking-wider text-slate-600">
                <Shield className="w-4 h-4 text-indigo-500" />
                3. Medication Adherence & ACS Drug Grid
              </h4>
              <span className="text-xs font-semibold text-slate-700">
                Adherence: <span className={rawData.medication_adherence === 'No' ? 'text-red-600 font-bold' : 'text-emerald-700 font-bold'}>{rawData.medication_adherence || 'Yes'}</span>
              </span>
            </div>

            {rawData.medication_adherence_no_reason && (
              <p className="text-xs text-red-700 bg-red-50 p-2 rounded border border-red-200">
                <strong>Non-Adherence Reason:</strong> {rawData.medication_adherence_no_reason}
              </p>
            )}

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left border-collapse border border-slate-200 rounded-lg overflow-hidden">
                <thead>
                  <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                    <th className="p-2 border.r border-slate-200">Generic Drug Name</th>
                    <th className="p-2 border-r border-slate-200 text-center w-28">Taking Currently</th>
                    <th className="p-2 text-center w-36">In Recent IP/OP Visit</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {drugGrid.map((drug, i) => (
                    <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}>
                      <td className="p-2 font-medium border-r border-slate-200 text-slate-800">
                        {drug.isOther && drug.otherName ? `Other (${drug.otherName})` : drug.name}
                        {drug.name === 'Statin' && drug.dose ? <span className="text-slate-500 ml-1">(Dose: {drug.dose})</span> : ''}
                      </td>
                      <td className="p-2 border-r border-slate-200 text-center">
                        <span className={`px-2 py-0.5 rounded font-bold text-[11px] ${drug.taking === 'Yes' ? 'bg-emerald-100 text-emerald-800' : drug.taking === 'No' ? 'bg-slate-100 text-slate-600' : 'text-slate-400'}`}>
                          {drug.taking || '—'}
                        </span>
                      </td>
                      <td className="p-2 text-center">
                        <span className={`px-2 py-0.5 rounded font-bold text-[11px] ${drug.inRecentVisit === 'Yes' ? 'bg-blue-100 text-blue-800' : drug.inRecentVisit === 'No' ? 'bg-slate-100 text-slate-600' : 'text-slate-400'}`}>
                          {drug.inRecentVisit || '—'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Section 4: Lab Tests & Investigations */}
          <div className="border border-slate-200 rounded-xl p-4 space-y-3">
            <h4 className="font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-2 text-xs uppercase tracking-wider text-slate-600">
              <FileText className="w-4 h-4 text-purple-500" />
              4. Lab Tests & Investigations
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                <span className="text-slate-500 block font-medium">Trop-I:</span>
                <span className="font-bold text-slate-800 text-sm">{rawData.trop_i_result || '—'}</span>
              </div>
              <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                <span className="text-slate-500 block font-medium">Creatinine:</span>
                <span className="font-bold text-slate-800 text-sm">{rawData.creatinine_result || '—'}</span>
              </div>
              <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                <span className="text-slate-500 block font-medium">BNP / NT-proBNP:</span>
                <span className="font-bold text-slate-800 text-sm">{rawData.bnp_nt_probnp_result || '—'}</span>
              </div>
              <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                <span className="text-slate-500 block font-medium">Haemoglobin:</span>
                <span className="font-bold text-slate-800 text-sm">{rawData.hemoglobin_result || '—'}</span>
              </div>
              <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                <span className="text-slate-500 block font-medium">Sodium:</span>
                <span className="font-bold text-slate-800 text-sm">{rawData.sodium_result || '—'}</span>
              </div>
              <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                <span className="text-slate-500 block font-medium">Potassium:</span>
                <span className="font-bold text-slate-800 text-sm">{rawData.potassium_result || '—'}</span>
              </div>
              <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 col-span-2">
                <span className="text-slate-500 block font-medium">2D ECHO Done:</span>
                <span className="font-bold text-slate-800 text-sm">{rawData.echo_done || '—'}</span>
              </div>
            </div>
          </div>

          {/* Section 5: Major Clinical Events & Death Details */}
          <div className="border border-slate-200 rounded-xl p-4 space-y-3">
            <h4 className="font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-2 text-xs uppercase tracking-wider text-slate-600">
              <AlertTriangle className="w-4 h-4 text-rose-500" />
              5. Major Clinical Events & Mortality Tracking
            </h4>
            <div className="text-xs">
              <span className="text-slate-500 block font-medium mb-1">Has Major Clinical Event:</span>
              <span className={`font-bold inline-block px-2.5 py-0.5 rounded text-xs ${rawData.has_major_clinical_event === 'Yes' ? 'bg-red-100 text-red-800' : 'bg-slate-100 text-slate-700'}`}>
                {rawData.has_major_clinical_event || 'No'}
              </span>
            </div>
            {selectedEvents.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-1">
                {selectedEvents.map((evt, idx) => (
                  <span key={idx} className="px-2.5 py-1 bg-red-50 border border-red-200 text-red-900 font-medium text-xs rounded-lg flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
                    {evt}
                  </span>
                ))}
              </div>
            )}
            {rawData.event_other_details && (
              <p className="text-xs text-slate-700 bg-slate-50 p-2 rounded border border-slate-200">
                <strong>Event Details:</strong> {rawData.event_other_details}
              </p>
            )}

            {rawData.is_deceased === 'Yes' && (
              <div className="bg-rose-50 border border-rose-200 p-3 rounded-xl space-y-2 mt-2 text-xs text-rose-900">
                <span className="font-bold text-rose-800 uppercase block tracking-wider text-[11px]">Deceased Record Details</span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <div>
                    <span className="text-rose-600 block">Died within 30 days:</span>
                    <span className="font-bold">{rawData.died_within_30days_discharge || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-rose-600 block">Date of Death:</span>
                    <span className="font-bold">{formatDateForDisplay(rawData.date_of_death) || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-rose-600 block">Place of Death:</span>
                    <span className="font-bold">{rawData.place_of_death || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-rose-600 block">Cause of Death:</span>
                    <span className="font-bold">{rawData.cause_of_death || 'N/A'}</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Section 6: Program Opt-in & Feedback */}
          <div className="border border-slate-200 rounded-xl p-4 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <span className="text-slate-500 font-medium block">Vaccinations Details:</span>
              <p className="text-slate-800 mt-0.5">{rawData.vaccinations_details || 'None specified'}</p>
            </div>
            <div>
              <span className="text-slate-500 font-medium block">Opt-in to Follow-up Program:</span>
              <span className="font-bold text-slate-800">{rawData.join_program_opt_in || 'Yes'}</span>
            </div>
            {rawData.patient_feedback && (
              <div className="col-span-full border-t border-slate-100 pt-2">
                <span className="text-slate-500 font-medium block">Patient Feedback:</span>
                <p className="text-slate-800 mt-0.5 italic">{rawData.patient_feedback}</p>
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs rounded-xl shadow-sm transition-all cursor-pointer"
          >
            Close Viewer
          </button>
        </div>
      </div>
    </div>
  );
}
