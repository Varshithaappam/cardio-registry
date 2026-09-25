import React, { useState, useRef, useLayoutEffect, useEffect } from 'react';
import { 
  User, Phone, Calendar, Heart, Shield, Activity, FileText, 
  AlertTriangle, Check, X, Pill, Stethoscope, ChevronDown, Sparkles 
} from 'lucide-react';
import { sanitizePositiveInteger } from '../../utils/formSanitizers';
import HfFollowupPdfModal from '../modals/HfFollowupPdfModal';

// Reusable Auto-Resizing Textarea with CSS Word-Wrapping
function AutoTextarea({ value, onChange, placeholder, disabled, className = '', minRows = 1 }) {
  const textareaRef = useRef(null);

  useLayoutEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [value]);

  return (
    <textarea
      ref={textareaRef}
      rows={minRows}
      disabled={disabled}
      value={value || ''}
      onChange={(e) => {
        onChange(e);
        if (textareaRef.current) {
          textareaRef.current.style.height = 'auto';
          textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
        }
      }}
      placeholder={placeholder}
      className={`w-full resize-none break-words break-all whitespace-pre-wrap overflow-hidden focus:outline-none focus:ring-1 transition-all ${className}`}
    />
  );
}

// Strict Sanitization for Yes/No Output values (Fixes 'Ves' typo -> 'Yes')
function sanitizeYesNo(val) {
  if (val === null || val === undefined || val === '') return 'Unspecified';
  const str = String(val).trim().toLowerCase();
  if (str === 'yes' || str === 'ves' || str === 'true' || str === 'y') return 'Yes';
  if (str === 'no' || str === 'false' || str === 'n') return 'No';
  return val;
}

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

const SYMPTOM_OPTIONS = [
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

const CLINICAL_EVENT_OPTIONS = [
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

export default function HFFollowUpForm({
  patientData = {},
  taskData = {},
  initialForm = null,
  onSave,
  onCancel,
  readOnly = false
}) {
  // Section 1: Encounter Metadata & Hospital Dates
  const [uhid, setUhid] = useState(
    initialForm?.uhid || patientData?.uhid || patientData?.uhi || taskData?.uhid || taskData?.uhi || ''
  );
  const [dateOfAdmission, setDateOfAdmission] = useState(
    initialForm?.date_of_admission || initialForm?.admission_date || patientData?.date_of_admission || patientData?.admission_date || patientData?.admissionDate || taskData?.date_of_admission || taskData?.admission_date || ''
  );
  const [dateOfDischarge, setDateOfDischarge] = useState(
    initialForm?.date_of_discharge || initialForm?.discharge_date || patientData?.date_of_discharge || patientData?.discharge_date || patientData?.dischargeDate || taskData?.date_of_discharge || taskData?.discharge_date || ''
  );
  const [followupDate, setFollowupDate] = useState(
    initialForm?.patient_followup_date || new Date().toISOString().split('T')[0]
  );
  const [followupConducted, setFollowupConducted] = useState(
    initialForm?.followup_conducted || 'Telephonic follow-up'
  );
  const [attemptNumber, setAttemptNumber] = useState(
    initialForm?.attempt_number || taskData?.current_attempt_count || 1
  );
  const [answeringStatus, setAnsweringStatus] = useState(
    initialForm?.answering_status || ''
  );
  const [noAnswerReason, setNoAnswerReason] = useState(
    initialForm?.no_answer_reason || ''
  );

  // Section 2: Health Status & Medication Overview
  const [healthStatus, setHealthStatus] = useState(
    initialForm?.health_status || ''
  );
  const [healthUnhealthyDetails, setHealthUnhealthyDetails] = useState(
    initialForm?.health_unhealthy_details || ''
  );
  const [medicationsStillTaking, setMedicationsStillTaking] = useState(
    initialForm?.medications_still_taking || ''
  );
  const [sideEffectsObserved, setSideEffectsObserved] = useState(
    initialForm?.side_effects_observed || ''
  );
  const [sideEffectsDetails, setSideEffectsDetails] = useState(
    initialForm?.side_effects_details || ''
  );
  const [physicianMedicationChanges, setPhysicianMedicationChanges] = useState(
    initialForm?.physician_medication_changes || ''
  );
  const [physicianMedicationChangesDetails, setPhysicianMedicationChangesDetails] = useState(
    initialForm?.physician_medication_changes_details || ''
  );

  // Section 3: Symptom Checklist
  const [selectedSymptoms, setSelectedSymptoms] = useState(
    initialForm?.selected_symptoms || []
  );
  const [symptomOtherDetails, setSymptomOtherDetails] = useState(
    initialForm?.symptom_other_details || ''
  );

  // Section 4: Medication Adherence & Structured Grid
  const [medicationAdherence, setMedicationAdherence] = useState(
    initialForm?.medication_adherence || ''
  );
  const [medicationAdherenceReason, setMedicationAdherenceReason] = useState(
    initialForm?.medication_adherence_no_reason || ''
  );
  const [drugGrid, setDrugGrid] = useState(
    initialForm?.drug_grid || DEFAULT_DRUG_LIST
  );

  // Section 5: Lab Tests & Investigations
  const [bnpResult, setBnpResult] = useState(
    initialForm?.bnp_nt_probnp_result || ''
  );
  const [creatinineResult, setCreatinineResult] = useState(
    initialForm?.creatinine_result || ''
  );
  const [sodiumResult, setSodiumResult] = useState(
    initialForm?.sodium_result || ''
  );
  const [hemoglobinResult, setHemoglobinResult] = useState(
    initialForm?.hemoglobin_result || ''
  );
  const [echoDone, setEchoDone] = useState(
    initialForm?.echo_done || ''
  );

  // Section 6: Major Clinical Events
  const [hasMajorClinicalEvent, setHasMajorClinicalEvent] = useState(
    initialForm?.has_major_clinical_event || ''
  );
  const [selectedClinicalEvents, setSelectedClinicalEvents] = useState(
    initialForm?.selected_clinical_events || []
  );
  const [eventOtherDetails, setEventOtherDetails] = useState(
    initialForm?.event_other_details || ''
  );

  // Section 7: Vaccinations, Death, Opt-In & Feedback
  const [vaccinationsDetails, setVaccinationsDetails] = useState(
    initialForm?.vaccinations_details || ''
  );
  const [isDeceased, setIsDeceased] = useState(
    initialForm?.is_deceased || ''
  );
  const [diedWithin30Days, setDiedWithin30Days] = useState(
    initialForm?.died_within_30days_discharge || ''
  );
  const [placeOfDeath, setPlaceOfDeath] = useState(
    initialForm?.place_of_death || ''
  );
  const [dateOfDeath, setDateOfDeath] = useState(
    initialForm?.date_of_death || ''
  );
  const [causeOfDeath, setCauseOfDeath] = useState(
    initialForm?.cause_of_death || ''
  );
  const [causeOfDeathOther, setCauseOfDeathOther] = useState(
    initialForm?.cause_of_death_other_details || ''
  );
  const [joinProgramOptIn, setJoinProgramOptIn] = useState(
    initialForm?.join_program_opt_in || ''
  );
  const [patientFeedback, setPatientFeedback] = useState(
    initialForm?.patient_feedback || ''
  );

  // PDF Preview State
  const [isPdfModalOpen, setIsPdfModalOpen] = useState(false);
  const [previewFormData, setPreviewFormData] = useState(null);

  // MORTALITY CONTRADICTION FIX: Auto-clear & disable fields when isDeceased === 'Yes'
  useEffect(() => {
    if (isDeceased === 'Yes') {
      setJoinProgramOptIn('No');
      setVaccinationsDetails('');
      setPatientFeedback('');
    }
  }, [isDeceased]);

  // Clean Drug Grid filter to prevent header row duplication
  const cleanDrugGrid = (Array.isArray(drugGrid) ? drugGrid : DEFAULT_DRUG_LIST).filter((row) => {
    if (!row) return false;
    const cat = (row.category || '').toString().toLowerCase().trim();
    const name = (row.name || row.otherName || '').toString().toLowerCase().trim();
    return cat !== 'category' && name !== 'generic drug name' && cat !== 'check' && name !== 'check';
  });

  // Toggle Symptom helper
  const toggleSymptom = (sym) => {
    if (readOnly) return;
    if (selectedSymptoms.includes(sym)) {
      setSelectedSymptoms(selectedSymptoms.filter((s) => s !== sym));
    } else {
      setSelectedSymptoms([...selectedSymptoms, sym]);
    }
  };

  // Toggle Clinical Event helper
  const toggleClinicalEvent = (evt) => {
    if (readOnly) return;
    if (selectedClinicalEvents.includes(evt)) {
      setSelectedClinicalEvents(selectedClinicalEvents.filter((e) => e !== evt));
    } else {
      setSelectedClinicalEvents([...selectedClinicalEvents, evt]);
    }
  };

  // Update Drug Grid row
  const handleDrugGridChange = (index, field, value) => {
    if (readOnly) return;
    const updated = [...drugGrid];
    updated[index] = { ...updated[index], [field]: value };
    setDrugGrid(updated);
  };

  // Auto-fill Sample Data for Testing
  const handleFillDummyData = () => {
    setUhid(uhid || 'UHID992817');
    setDateOfAdmission(dateOfAdmission || '2026-08-10');
    setDateOfDischarge(dateOfDischarge || '2026-08-18');
    setFollowupDate(new Date().toISOString().split('T')[0]);
    setAttemptNumber(1);
    setAnsweringStatus('Yes');
    setNoAnswerReason('');

    setHealthStatus('Healthy');
    setHealthUnhealthyDetails('');
    setMedicationsStillTaking('Ramipril 5mg daily, Bisoprolol 2.5mg daily, Furosemide 20mg morning');
    setSideEffectsObserved('No');
    setSideEffectsDetails('');
    setPhysicianMedicationChanges('No');
    setPhysicianMedicationChangesDetails('');

    setSelectedSymptoms(['Shortness of breath', 'Fatigue']);
    setSymptomOtherDetails('Mild leg fatigue on walking long distance');

    setMedicationAdherence('Yes');
    setMedicationAdherenceReason('');

    const filledGrid = DEFAULT_DRUG_LIST.map((row, idx) => {
      if (idx === 0) return { ...row, taking: 'Yes', inRecentVisit: 'Yes' };
      if (idx === 5) return { ...row, taking: 'Yes', inRecentVisit: 'Yes' };
      if (idx === 6) return { ...row, taking: 'Yes', inRecentVisit: 'Yes' };
      if (idx === 13) return { ...row, taking: 'Yes', inRecentVisit: 'Yes' };
      return { ...row, taking: 'No', inRecentVisit: 'No' };
    });
    setDrugGrid(filledGrid);

    setBnpResult('180 pg/mL');
    setCreatinineResult('1.1 mg/dL');
    setSodiumResult('139 mEq/L');
    setHemoglobinResult('13.4 g/dL');
    setEchoDone('Yes');

    setHasMajorClinicalEvent('No');
    setSelectedClinicalEvents([]);
    setEventOtherDetails('');

    setVaccinationsDetails('Influenza (Annual), Pneumococcal (PCV20)');
    setIsDeceased('No');
    setDiedWithin30Days('');
    setPlaceOfDeath('');
    setDateOfDeath('');
    setCauseOfDeath('');
    setCauseOfDeathOther('');

    setJoinProgramOptIn('Yes');
    setPatientFeedback('Patient is feeling much better and actively participating in cardiac rehabilitation sessions.');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (readOnly) return;

    // Validation Checks
    const validationErrors = [];

    // 1. RED FIELDS (Mandatory in ALL cases)
    if (!uhid || !String(uhid).trim()) {
      validationErrors.push("UHID is required.");
    }
    if (attemptNumber === null || attemptNumber === undefined || attemptNumber === '') {
      validationErrors.push("Follow-up attempts in a month is required.");
    }
    if (!answeringStatus || !String(answeringStatus).trim()) {
      validationErrors.push("Answering Status (Yes/No) is required.");
    }

    if (answeringStatus === 'No' && (!noAnswerReason || !String(noAnswerReason).trim())) {
      validationErrors.push("Reason (If, No) is required when Answering Status is No.");
    }

    // 2. ORANGE FIELDS (Mandatory ONLY when Answering Status is 'Yes')
    if (answeringStatus === 'Yes') {
      if (!healthStatus || !String(healthStatus).trim()) {
        validationErrors.push("Health Status ('Since your last visit, are you Healthy / Unhealthy') is required when Answering Status is Yes.");
      }
      if (healthStatus === 'Unhealthy' && (!healthUnhealthyDetails || !String(healthUnhealthyDetails).trim())) {
        validationErrors.push("Please specify details for 'Unhealthy' health status.");
      }
    }

    if (validationErrors.length > 0) {
      alert(`Please complete the required fields before saving:\n\n• ${validationErrors.join('\n• ')}`);
      return;
    }

    const payload = {
      uhid: uhid,
      date_of_admission: dateOfAdmission,
      date_of_discharge: dateOfDischarge,

      patient_followup_date: followupDate,
      followup_conducted: followupConducted,
      attempt_number: Number(attemptNumber),
      answering_status: answeringStatus,
      no_answer_reason: answeringStatus === 'No' ? noAnswerReason : null,

      health_status: healthStatus,
      health_unhealthy_details: healthStatus === 'Unhealthy' ? healthUnhealthyDetails : null,
      medications_still_taking: medicationsStillTaking,
      side_effects_observed: sideEffectsObserved,
      side_effects_details: sideEffectsObserved === 'Yes' ? sideEffectsDetails : null,
      physician_medication_changes: physicianMedicationChanges,
      physician_medication_changes_details: physicianMedicationChanges === 'Yes' ? physicianMedicationChangesDetails : null,

      selected_symptoms: selectedSymptoms,
      symptom_other_details: symptomOtherDetails,

      medication_adherence: medicationAdherence,
      medication_adherence_no_reason: medicationAdherence === 'No' ? medicationAdherenceReason : null,
      drug_grid: cleanDrugGrid,

      bnp_nt_probnp_result: bnpResult,
      creatinine_result: creatinineResult,
      sodium_result: sodiumResult,
      hemoglobin_result: hemoglobinResult,
      echo_done: echoDone,

      has_major_clinical_event: hasMajorClinicalEvent,
      selected_clinical_events: hasMajorClinicalEvent === 'Yes' ? selectedClinicalEvents : [],
      event_other_details: eventOtherDetails,

      vaccinations_details: isDeceased === 'Yes' ? null : vaccinationsDetails,
      is_deceased: isDeceased,
      died_within_30days_discharge: isDeceased === 'Yes' ? diedWithin30Days : null,
      place_of_death: isDeceased === 'Yes' ? placeOfDeath : null,
      date_of_death: isDeceased === 'Yes' ? dateOfDeath : null,
      cause_of_death: isDeceased === 'Yes' ? causeOfDeath : null,
      cause_of_death_other_details: isDeceased === 'Yes' && causeOfDeath === 'Others' ? causeOfDeathOther : null,
      join_program_opt_in: isDeceased === 'Yes' ? 'No' : joinProgramOptIn,
      patient_feedback: isDeceased === 'Yes' ? null : patientFeedback,

      created_at: new Date().toISOString()
    };

    onSave?.(payload);
  };

  return (
    <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden font-sans text-sm w-full max-w-[1380px] mx-auto my-2 animate-fadeIn">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-teal-800 via-teal-700 to-slate-900 text-white px-5 py-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-teal-600/50 flex items-center justify-center border border-teal-400/30 shrink-0">
            <Heart className="w-5 h-5 text-teal-200" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-white tracking-tight">
                Heart Failure Telephonic Follow-Up Assessment
              </h2>
              <span className="px-2.5 py-0.5 rounded-full bg-teal-500/30 text-teal-200 text-[10px] font-bold uppercase border border-teal-400/30">
                HF Follow-up
              </span>
            </div>
            <p className="text-teal-200/90 text-xs mt-0.5">
              Patient: <strong className="text-white">{patientData?.name || patientData?.patient_name || 'Test Patient'}</strong> | 
              MRN: <strong className="text-teal-100">{patientData?.mrNo || patientData?.mr_no || 'MR00001'}</strong> | 
              UHID: <strong className="text-teal-100">{patientData?.uhid || patientData?.uhi || 'N/A'}</strong>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          {!readOnly && (
            <button
              type="button"
              onClick={handleFillDummyData}
              className="px-3 py-1.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 font-bold text-xs rounded-xl border border-amber-400/40 transition-all flex items-center gap-1.5 shadow-xs cursor-pointer"
              title="Auto-fill sample data for testing all form sections"
            >
              <Sparkles className="w-4 h-4 text-amber-300 animate-pulse" />
              <span>Fill Sample</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => {
              const currentFormData = {
                uhid: uhid,
                date_of_admission: dateOfAdmission,
                date_of_discharge: dateOfDischarge,
                patient_followup_date: followupDate,
                followup_conducted: followupConducted,
                attempt_number: attemptNumber,
                answering_status: answeringStatus,
                no_answer_reason: noAnswerReason,
                health_status: healthStatus,
                health_unhealthy_details: healthUnhealthyDetails,
                medications_still_taking: medicationsStillTaking,
                side_effects_observed: sideEffectsObserved,
                side_effects_details: sideEffectsDetails,
                physician_medication_changes: physicianMedicationChanges,
                physician_medication_changes_details: physicianMedicationChangesDetails,
                selected_symptoms: selectedSymptoms,
                symptom_other_details: symptomOtherDetails,
                medication_adherence: medicationAdherence,
                medication_adherence_no_reason: medicationAdherenceReason,
                drug_grid: cleanDrugGrid,
                bnp_nt_probnp_result: bnpResult,
                creatinine_result: creatinineResult,
                sodium_result: sodiumResult,
                hemoglobin_result: hemoglobinResult,
                echo_done: echoDone,
                has_major_clinical_event: hasMajorClinicalEvent,
                selected_clinical_events: selectedClinicalEvents,
                event_other_details: eventOtherDetails,
                vaccinations_details: isDeceased === 'Yes' ? null : vaccinationsDetails,
                is_deceased: isDeceased,
                died_within_30days_discharge: diedWithin30Days,
                place_of_death: placeOfDeath,
                date_of_death: dateOfDeath,
                cause_of_death: causeOfDeath,
                cause_of_death_other_details: causeOfDeathOther,
                join_program_opt_in: isDeceased === 'Yes' ? 'No' : joinProgramOptIn,
                patient_feedback: isDeceased === 'Yes' ? null : patientFeedback
              };
              setPreviewFormData(currentFormData);
              setIsPdfModalOpen(true);
            }}
            className="px-3 py-1.5 bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs rounded-xl border border-teal-400/40 transition-all flex items-center gap-1.5 shadow-xs cursor-pointer"
            title="Download / Print full PDF report of this response"
          >
            <FileText className="w-4 h-4" />
            <span>View PDF</span>
          </button>

          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="p-1.5 rounded-lg text-teal-200 hover:text-white hover:bg-teal-600/40 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="p-5 space-y-4 max-h-[85vh] overflow-y-auto">
        
        {/* Continuous Single Form Container */}
        <div className="space-y-4">

          {/* 1. Encounter Metadata Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2.5 bg-slate-50/70 p-3 rounded-xl border border-slate-200/90 text-xs">
            <div className="min-w-0">
              <label className="block text-xs font-bold text-rose-600 leading-tight mb-1">
                UHID <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                disabled={readOnly}
                value={uhid}
                onChange={(e) => setUhid(e.target.value)}
                placeholder="UHID..."
                className="w-full px-2 py-1.5 bg-white border border-rose-300 rounded-md focus:ring-1 focus:ring-rose-500 text-xs font-medium h-8 break-all"
              />
            </div>

            <div className="min-w-0">
              <label className="block text-xs font-bold text-slate-700 leading-tight mb-1">Date Of Admission</label>
              <input
                type="date"
                disabled={readOnly}
                value={dateOfAdmission}
                onChange={(e) => setDateOfAdmission(e.target.value)}
                className="w-full px-1.5 py-1.5 bg-white border border-slate-300 rounded-md focus:ring-1 focus:ring-teal-500 text-xs font-medium h-8"
              />
            </div>

            <div className="min-w-0">
              <label className="block text-xs font-bold text-slate-700 leading-tight mb-1">Date of Discharge</label>
              <input
                type="date"
                disabled={readOnly}
                value={dateOfDischarge}
                onChange={(e) => setDateOfDischarge(e.target.value)}
                className="w-full px-1.5 py-1.5 bg-white border border-slate-300 rounded-md focus:ring-1 focus:ring-teal-500 text-xs font-medium h-8"
              />
            </div>

            <div className="min-w-0">
              <label className="block text-xs font-bold text-slate-700 leading-tight mb-1">Patient Follow-up date</label>
              <input
                type="date"
                disabled={readOnly}
                value={followupDate}
                onChange={(e) => setFollowupDate(e.target.value)}
                className="w-full px-1.5 py-1.5 bg-white border border-slate-300 rounded-md focus:ring-1 focus:ring-teal-500 text-xs font-medium h-8"
              />
            </div>

            <div className="min-w-0">
              <label className="block text-xs font-bold text-slate-700 leading-tight mb-1">Follow-up conducted</label>
              <input
                type="text"
                disabled
                value={followupConducted}
                className="w-full px-2 py-1.5 bg-slate-100 text-slate-700 font-medium border border-slate-300 rounded-md cursor-not-allowed text-xs h-8"
              />
            </div>

            <div className="min-w-0">
              <label className="block text-xs font-bold text-rose-600 leading-tight mb-1">
                Follow-up attempts <span className="text-rose-500">*</span>
              </label>
              <select
                disabled={readOnly}
                value={attemptNumber}
                onChange={(e) => setAttemptNumber(e.target.value)}
                className="w-full px-2 py-1.5 bg-white border border-rose-300 rounded-md focus:ring-1 focus:ring-rose-500 text-xs font-medium h-8"
              >
                <option value={1}>1</option>
                <option value={2}>2</option>
                <option value={3}>3</option>
              </select>
            </div>

            <div className="min-w-0">
              <label className="block text-xs font-bold text-rose-600 leading-tight mb-1">
                Answering Status <span className="text-rose-500">*</span>
              </label>
              <select
                disabled={readOnly}
                value={answeringStatus}
                onChange={(e) => setAnsweringStatus(e.target.value)}
                className="w-full px-2 py-1.5 bg-white border border-rose-300 rounded-md focus:ring-1 focus:ring-rose-500 text-xs font-medium h-8"
              >
                <option value="Yes">Yes</option>
                <option value="No">No</option>
              </select>
            </div>

            {answeringStatus === 'No' && (
              <div className="col-span-full">
                <label className="block text-xs font-bold text-rose-700 leading-tight mb-0.5">
                  Reason (If,No): <span className="text-rose-500">*</span>
                </label>
                <AutoTextarea
                  disabled={readOnly}
                  value={noAnswerReason}
                  onChange={(e) => setNoAnswerReason(e.target.value)}
                  placeholder="Specify reason..."
                  className="px-2.5 py-1.5 bg-white border border-rose-300 rounded-md text-xs min-h-[32px] focus:ring-rose-500/20 focus:border-rose-500"
                />
              </div>
            )}
          </div>

          {/* 2. General Health & Medication Overview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className={`p-2.5 rounded-xl border transition-colors ${answeringStatus === 'Yes' ? 'bg-amber-50/40 border-amber-200' : 'bg-slate-50/50 border-slate-200/80'}`}>
              <label className={`block text-xs font-bold leading-tight mb-1 ${answeringStatus === 'Yes' ? 'text-amber-800' : 'text-slate-800'}`}>
                Since your last visit,are you {answeringStatus === 'Yes' && <span className="text-amber-600 font-bold">*</span>}
              </label>
              <div className="flex items-center gap-4 bg-white px-2.5 py-1.5 rounded-md border border-slate-300 h-8">
                {['Healthy', 'Unhealthy'].map((opt) => (
                  <label key={opt} className="flex items-center gap-1.5 cursor-pointer font-bold text-slate-700 text-xs">
                    <input
                      type="radio"
                      disabled={readOnly}
                      name="healthStatus"
                      checked={healthStatus === opt}
                      onChange={() => setHealthStatus(opt)}
                      className="text-teal-600 focus:ring-teal-500 w-4 h-4"
                    />
                    <span>{opt}</span>
                  </label>
                ))}
              </div>
              {healthStatus === 'Unhealthy' && (
                <div className="mt-1.5">
                  <label className="block text-[11px] font-bold text-amber-700 leading-tight mb-0.5">
                    If unhealthy,Please specify <span className="text-amber-600">*</span>
                  </label>
                  <AutoTextarea
                    disabled={readOnly}
                    value={healthUnhealthyDetails}
                    onChange={(e) => setHealthUnhealthyDetails(e.target.value)}
                    placeholder="If unhealthy,Please specify..."
                    className="px-2.5 py-1.5 bg-white border border-amber-300 rounded-md text-xs min-h-[32px] focus:ring-amber-500/20 focus:border-amber-500"
                  />
                </div>
              )}
            </div>

            <div className="bg-slate-50/50 p-2.5 rounded-xl border border-slate-200/80">
              <label className="block text-xs font-bold text-slate-800 leading-tight mb-1">
                Any sideeffects observed
              </label>
              <div className="flex items-center gap-4 bg-white px-2.5 py-1.5 rounded-md border border-slate-300 h-8">
                {['Yes', 'No'].map((opt) => (
                  <label key={opt} className="flex items-center gap-1.5 cursor-pointer font-bold text-slate-700 text-xs">
                    <input
                      type="radio"
                      disabled={readOnly}
                      name="sideEffects"
                      checked={sideEffectsObserved === opt}
                      onChange={() => setSideEffectsObserved(opt)}
                      className="text-teal-600 focus:ring-teal-500 w-4 h-4"
                    />
                    <span>{opt}</span>
                  </label>
                ))}
              </div>
              {sideEffectsObserved === 'Yes' && (
                <div className="mt-1.5">
                  <AutoTextarea
                    disabled={readOnly}
                    value={sideEffectsDetails}
                    onChange={(e) => setSideEffectsDetails(e.target.value)}
                    placeholder="If Yes,please describe..."
                    className="px-2.5 py-1.5 bg-white border border-rose-300 rounded-md text-xs min-h-[32px] focus:ring-rose-500/20 focus:border-rose-500"
                  />
                </div>
              )}
            </div>

            <div className="bg-slate-50/50 p-2.5 rounded-xl border border-slate-200/80">
              <label className="block text-xs font-bold text-slate-800 leading-tight mb-1">
                Any changes in Medications by Physician
              </label>
              <div className="flex items-center gap-4 bg-white px-2.5 py-1.5 rounded-md border border-slate-300 h-8">
                {['Yes', 'No'].map((opt) => (
                  <label key={opt} className="flex items-center gap-1.5 cursor-pointer font-bold text-slate-700 text-xs">
                    <input
                      type="radio"
                      disabled={readOnly}
                      name="physicianChanges"
                      checked={physicianMedicationChanges === opt}
                      onChange={() => setPhysicianMedicationChanges(opt)}
                      className="text-teal-600 focus:ring-teal-500 w-4 h-4"
                    />
                    <span>{opt}</span>
                  </label>
                ))}
              </div>
              {physicianMedicationChanges === 'Yes' && (
                <div className="mt-1.5">
                  <AutoTextarea
                    disabled={readOnly}
                    value={physicianMedicationChangesDetails}
                    onChange={(e) => setPhysicianMedicationChangesDetails(e.target.value)}
                    placeholder="If Yes,please specify..."
                    className="px-2.5 py-1.5 bg-white border border-slate-300 rounded-md text-xs min-h-[32px] focus:ring-teal-500/20 focus:border-teal-500"
                  />
                </div>
              )}
            </div>

            <div className="col-span-full">
              <label className="block text-xs font-bold text-slate-800 leading-tight mb-1">
                What Medications are you still taking?(please specify)
              </label>
              <AutoTextarea
                minRows={1}
                disabled={readOnly}
                value={medicationsStillTaking}
                onChange={(e) => setMedicationsStillTaking(e.target.value)}
                placeholder="Specify all current medications taking..."
                className="px-2.5 py-1.5 bg-white border border-slate-300 rounded-md text-xs min-h-[40px] focus:ring-teal-500/20 focus:border-teal-500"
              />
            </div>
          </div>

          {/* 3. Symptom Checklist */}
          <div className="space-y-2 pt-2 border-t border-slate-200">
            <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider">
              Any new symptoms,please tick all that apply
            </label>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
              {SYMPTOM_OPTIONS.map((sym) => {
                const isChecked = selectedSymptoms.includes(sym);
                return (
                  <button
                    type="button"
                    key={sym}
                    disabled={readOnly}
                    onClick={() => toggleSymptom(sym)}
                    className={`px-2.5 py-1.5 rounded-lg border text-left flex items-center justify-between transition-all cursor-pointer ${
                      isChecked
                        ? 'bg-teal-50 border-teal-500 text-teal-900 font-bold shadow-2xs'
                        : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300 font-medium'
                    }`}
                  >
                    <span className="text-[11px] leading-tight truncate">{sym}</span>
                    <div className={`w-4 h-4 rounded flex items-center justify-center border shrink-0 ml-1.5 ${
                      isChecked ? 'bg-teal-600 border-teal-600 text-white' : 'border-slate-300 bg-white'
                    }`}>
                      {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="flex items-start gap-2 pt-1">
              <span className="text-xs font-bold text-slate-600 shrink-0 mt-1.5">Other (please specify):</span>
              <AutoTextarea
                disabled={readOnly}
                value={symptomOtherDetails}
                onChange={(e) => setSymptomOtherDetails(e.target.value)}
                placeholder="Specify any other symptoms..."
                className="px-2.5 py-1.5 bg-white border border-slate-300 rounded-md text-xs min-h-[32px] focus:ring-teal-500/20 focus:border-teal-500"
              />
            </div>
          </div>

          {/* 4. Medication Adherence & Category Drug Table */}
          <div className="space-y-2.5 pt-2 border-t border-slate-200">
            <div className="bg-slate-50/50 px-3 py-2 rounded-lg border border-slate-200/90 flex flex-wrap items-center justify-between gap-2">
              <label className="text-xs font-bold text-slate-800">
                Medication Adherence- Are you following medication as prescribed
              </label>
              <div className="flex items-center gap-4">
                {['Yes', 'No'].map((opt) => (
                  <label key={opt} className="flex items-center gap-1.5 cursor-pointer font-bold text-slate-700 text-xs">
                    <input
                      type="radio"
                      disabled={readOnly}
                      name="medAdherence"
                      checked={medicationAdherence === opt}
                      onChange={() => setMedicationAdherence(opt)}
                      className="text-teal-600 focus:ring-teal-500 w-4 h-4"
                    />
                    <span>{opt}</span>
                  </label>
                ))}
              </div>
              {medicationAdherence === 'No' && (
                <div className="w-full pt-1.5">
                  <AutoTextarea
                    disabled={readOnly}
                    value={medicationAdherenceReason}
                    onChange={(e) => setMedicationAdherenceReason(e.target.value)}
                    placeholder="If no, please specify the reason..."
                    className="px-2.5 py-1.5 bg-white border border-rose-300 rounded-md text-xs min-h-[32px] focus:ring-rose-500/20 focus:border-rose-500"
                  />
                </div>
              )}
            </div>

            {/* Fixed Layout Drug Table */}
            <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-2xs">
              <table className="w-full text-left border-collapse table-fixed min-w-[700px]">
                <thead>
                  <tr className="bg-slate-100 text-slate-800 font-bold uppercase text-[10px] tracking-wider border-b border-slate-200">
                    <th className="py-2 px-3 w-1/4 break-words break-all">Category</th>
                    <th className="py-2 px-3 w-2/5 break-words break-all">Generic Drug Name</th>
                    <th className="py-2 px-2 text-center w-1/6 break-words break-all">Check</th>
                    <th className="py-2 px-2 text-center w-1/6 break-words break-all">Present in most recent IP/OP visit</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {cleanDrugGrid.map((row, idx) => {
                    const isTakingYes = sanitizeYesNo(row.taking) === 'Yes';
                    const isTakingNo = sanitizeYesNo(row.taking) === 'No';
                    const isRecentYes = sanitizeYesNo(row.inRecentVisit) === 'Yes';
                    const isRecentNo = sanitizeYesNo(row.inRecentVisit) === 'No';

                    return (
                      <tr key={idx} className="hover:bg-teal-50/30 transition-colors">
                        <td className="py-1.5 px-3 font-bold text-teal-900 text-xs break-words break-all">
                          {row.category}
                        </td>
                        <td className="py-1.5 px-3 text-slate-800 text-xs font-semibold break-words break-all">
                          {row.isOther ? (
                            <AutoTextarea
                              disabled={readOnly}
                              value={row.otherName || ''}
                              onChange={(e) => handleDrugGridChange(idx, 'otherName', e.target.value)}
                              placeholder="Please specify..."
                              className="px-2 py-1 border border-slate-300 rounded bg-white text-xs min-h-[28px]"
                            />
                          ) : (
                            row.name
                          )}
                        </td>
                        <td className="py-1.5 px-2 text-center">
                          <div className="flex items-center justify-center gap-3">
                            {['Yes', 'No'].map((opt) => (
                              <label key={opt} className="flex items-center gap-1 cursor-pointer font-bold text-slate-700 text-xs">
                                <input
                                  type="radio"
                                  disabled={readOnly}
                                  name={`taking_${idx}`}
                                  checked={sanitizeYesNo(row.taking) === opt}
                                  onChange={() => handleDrugGridChange(idx, 'taking', opt)}
                                  className="text-teal-600 focus:ring-teal-500 w-3.5 h-3.5"
                                />
                                <span>{opt}</span>
                              </label>
                            ))}
                          </div>
                        </td>
                        <td className="py-1.5 px-2 text-center">
                          <div className="flex items-center justify-center gap-3">
                            {['Yes', 'No'].map((opt) => (
                              <label key={opt} className="flex items-center gap-1 cursor-pointer font-bold text-slate-700 text-xs">
                                <input
                                  type="radio"
                                  disabled={readOnly}
                                  name={`recent_${idx}`}
                                  checked={sanitizeYesNo(row.inRecentVisit) === opt}
                                  onChange={() => handleDrugGridChange(idx, 'inRecentVisit', opt)}
                                  className="text-teal-600 focus:ring-teal-500 w-3.5 h-3.5"
                                />
                                <span>{opt}</span>
                              </label>
                            ))}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* 5. Lab Tests & Investigations */}
          <div className="space-y-2 pt-2 border-t border-slate-200">
            <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider">
              Lab Tests & Investigations
            </label>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2.5">
              <div className="bg-slate-50/70 p-2.5 rounded-xl border border-slate-200">
                <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">BNP/NT-proBNP</label>
                <input
                  type="text"
                  disabled={readOnly}
                  value={bnpResult}
                  onChange={(e) => setBnpResult(e.target.value)}
                  placeholder="pg/mL..."
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-md text-xs font-semibold h-8 break-all"
                />
              </div>

              <div className="bg-slate-50/70 p-2.5 rounded-xl border border-slate-200">
                <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">Creatinine</label>
                <input
                  type="text"
                  disabled={readOnly}
                  value={creatinineResult}
                  onChange={(e) => setCreatinineResult(e.target.value)}
                  placeholder="mg/dL..."
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-md text-xs font-semibold h-8 break-all"
                />
              </div>

              <div className="bg-slate-50/70 p-2.5 rounded-xl border border-slate-200">
                <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">Sodium</label>
                <input
                  type="text"
                  disabled={readOnly}
                  value={sodiumResult}
                  onChange={(e) => setSodiumResult(e.target.value)}
                  placeholder="mEq/L..."
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-md text-xs font-semibold h-8 break-all"
                />
              </div>

              <div className="bg-slate-50/70 p-2.5 rounded-xl border border-slate-200">
                <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">Haemoglobin</label>
                <input
                  type="text"
                  disabled={readOnly}
                  value={hemoglobinResult}
                  onChange={(e) => setHemoglobinResult(e.target.value)}
                  placeholder="g/dL..."
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-md text-xs font-semibold h-8 break-all"
                />
              </div>

              <div className="bg-slate-50/70 p-2.5 rounded-xl border border-slate-200">
                <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">2D ECHO</label>
                <div className="flex items-center justify-around bg-white px-2 py-1.5 border border-slate-300 rounded-md h-8">
                  {['Yes', 'No'].map((opt) => (
                    <label key={opt} className="flex items-center gap-1.5 cursor-pointer text-slate-800 font-bold text-xs">
                      <input
                        type="radio"
                        disabled={readOnly}
                        name="echoDone"
                        checked={echoDone === opt}
                        onChange={() => setEchoDone(opt)}
                        className="text-teal-600 focus:ring-teal-500 w-4 h-4"
                      />
                      <span>{opt}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* 6. Major Clinical Events */}
          <div className="space-y-2 pt-2 border-t border-slate-200">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <label className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Has the patient experienced any major clinical event since the last follow-up?
              </label>

              <div className="flex items-center gap-3 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200">
                {['Yes', 'No'].map((opt) => (
                  <label key={opt} className="flex items-center gap-1.5 cursor-pointer font-bold text-slate-700 text-xs">
                    <input
                      type="radio"
                      disabled={readOnly}
                      name="majorEventsToggle"
                      checked={hasMajorClinicalEvent === opt}
                      onChange={() => setHasMajorClinicalEvent(opt)}
                      className="text-teal-600 focus:ring-teal-500 w-4 h-4"
                    />
                    <span>{opt === 'Yes' ? 'Yes — select all that apply' : 'No'}</span>
                  </label>
                ))}
              </div>
            </div>

            {hasMajorClinicalEvent === 'Yes' && (
              <div className="space-y-2 pt-1">
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
                  {CLINICAL_EVENT_OPTIONS.map((evt) => {
                    const isChecked = selectedClinicalEvents.includes(evt);
                    return (
                      <button
                        type="button"
                        key={evt}
                        disabled={readOnly}
                        onClick={() => toggleClinicalEvent(evt)}
                        className={`px-2.5 py-1.5 rounded-lg border text-left flex items-center justify-between transition-all cursor-pointer ${
                          isChecked
                            ? 'bg-rose-50 border-rose-500 text-rose-900 font-bold shadow-2xs'
                            : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300 font-medium'
                        }`}
                      >
                        <span className="text-[11px] leading-tight truncate">{evt}</span>
                        <div className={`w-4 h-4 rounded flex items-center justify-center border shrink-0 ml-1.5 ${
                          isChecked ? 'bg-rose-600 border-rose-600 text-white' : 'border-slate-300 bg-white'
                        }`}>
                          {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                        </div>
                      </button>
                    );
                  })}
                </div>

                <div className="flex items-start gap-2 pt-1">
                  <span className="text-xs font-bold text-slate-600 shrink-0 mt-1.5">Other:</span>
                  <AutoTextarea
                    disabled={readOnly}
                    value={eventOtherDetails}
                    onChange={(e) => setEventOtherDetails(e.target.value)}
                    placeholder="Specify..."
                    className="px-2.5 py-1.5 bg-white border border-slate-300 rounded-md text-xs min-h-[32px] focus:ring-teal-500/20 focus:border-teal-500"
                  />
                </div>
              </div>
            )}
          </div>

          {/* 7. Vaccinations, Death, Opt-In & Feedback */}
          <div className="space-y-3 pt-2 border-t border-slate-200">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="bg-slate-50/50 p-2.5 rounded-xl border border-slate-200/80">
                <label className="block text-xs font-bold text-slate-800 leading-tight mb-1">Any Vaccinations (please specify)</label>
                <AutoTextarea
                  disabled={readOnly || isDeceased === 'Yes'}
                  value={isDeceased === 'Yes' ? 'N/A (Deceased)' : vaccinationsDetails}
                  onChange={(e) => setVaccinationsDetails(e.target.value)}
                  placeholder={isDeceased === 'Yes' ? 'N/A (Deceased)' : 'Specify vaccinations...'}
                  className={`px-2.5 py-1.5 border rounded-md text-xs min-h-[32px] ${
                    isDeceased === 'Yes' ? 'bg-slate-100 text-slate-400 border-slate-300 cursor-not-allowed' : 'bg-white border-slate-300 focus:ring-teal-500/20 focus:border-teal-500'
                  }`}
                />
              </div>

              <div className="bg-slate-50/50 p-2.5 rounded-xl border border-slate-200/80">
                <label className="block text-xs font-bold text-slate-800 leading-tight mb-1">Do you want to join in follow-up program</label>
                <div className={`flex items-center gap-4 px-2.5 py-1.5 rounded-md border h-8 ${
                  isDeceased === 'Yes' ? 'bg-slate-100 border-slate-300 opacity-60 cursor-not-allowed' : 'bg-white border-slate-300'
                }`}>
                  {['Yes', 'No'].map((opt) => (
                    <label key={opt} className="flex items-center gap-1.5 cursor-pointer font-bold text-slate-700 text-xs">
                      <input
                        type="radio"
                        disabled={readOnly || isDeceased === 'Yes'}
                        name="programOptIn"
                        checked={(isDeceased === 'Yes' ? 'No' : joinProgramOptIn) === opt}
                        onChange={() => setJoinProgramOptIn(opt)}
                        className="text-teal-600 focus:ring-teal-500 w-4 h-4"
                      />
                      <span>{opt}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            {/* Death Sub-Block */}
            <div className="bg-slate-50/60 p-2.5 rounded-xl border border-slate-200 space-y-2">
              <div className="flex items-center justify-between">
                <label className="font-bold text-slate-800 text-xs uppercase tracking-wider">Death</label>
                <div className="flex items-center gap-4 bg-white px-2.5 py-1 rounded-lg border border-slate-300">
                  {['Yes', 'No'].map((opt) => (
                    <label key={opt} className="flex items-center gap-1.5 cursor-pointer font-bold text-slate-700 text-xs">
                      <input
                        type="radio"
                        disabled={readOnly}
                        name="isDeceased"
                        checked={isDeceased === opt}
                        onChange={() => setIsDeceased(opt)}
                        className="text-teal-600 focus:ring-teal-500 w-4 h-4"
                      />
                      <span>{opt}</span>
                    </label>
                  ))}
                </div>
              </div>

              {isDeceased === 'Yes' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5 pt-2 border-t border-slate-200 bg-rose-50/60 p-2.5 rounded-lg border border-rose-200">
                  <div>
                    <label className="block font-bold text-rose-900 text-[11px] leading-tight mb-1">If death,died within 30days of discharge</label>
                    <div className="flex items-center gap-3 bg-white px-2 py-1 rounded border border-rose-300 h-8">
                      {['Yes', 'No'].map((opt) => (
                        <label key={opt} className="flex items-center gap-1 cursor-pointer text-xs font-bold text-rose-900">
                          <input
                            type="radio"
                            disabled={readOnly}
                            name="died30"
                            checked={diedWithin30Days === opt}
                            onChange={() => setDiedWithin30Days(opt)}
                            className="text-rose-600 focus:ring-rose-500 w-3.5 h-3.5"
                          />
                          <span>{opt}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-rose-900 text-[11px] leading-tight mb-1">Place of death</label>
                    <AutoTextarea
                      disabled={readOnly}
                      value={placeOfDeath}
                      onChange={(e) => setPlaceOfDeath(e.target.value)}
                      placeholder="Place of death..."
                      className="px-2.5 py-1.5 bg-white border border-rose-300 rounded-md text-xs min-h-[32px] focus:ring-rose-500/20 focus:border-rose-500"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-rose-900 text-[11px] leading-tight mb-1">Date of Death</label>
                    <input
                      type="date"
                      disabled={readOnly}
                      value={dateOfDeath}
                      onChange={(e) => setDateOfDeath(e.target.value)}
                      className="w-full px-2 py-1.5 bg-white border border-rose-300 rounded-md text-xs h-8"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-rose-900 text-[11px] leading-tight mb-1">Cause of Death</label>
                    <div className="bg-white p-2 rounded-md border border-rose-300 space-y-1.5 min-h-[32px]">
                      <div className="flex items-center gap-2.5 flex-wrap">
                        {['Cardiac', 'Non-cardiac', 'Others'].map((opt) => (
                          <label key={opt} className="flex items-center gap-1 cursor-pointer text-xs font-bold text-rose-900">
                            <input
                              type="radio"
                              disabled={readOnly}
                              name="causeDeath"
                              checked={causeOfDeath === opt}
                              onChange={() => setCauseOfDeath(opt)}
                              className="text-rose-600 focus:ring-rose-500 w-3.5 h-3.5"
                            />
                            <span>{opt === 'Others' ? 'Others specify' : opt}</span>
                          </label>
                        ))}
                      </div>

                      {causeOfDeath === 'Others' && (
                        <div className="pt-1.5 border-t border-rose-100">
                          <AutoTextarea
                            disabled={readOnly}
                            value={causeOfDeathOther}
                            onChange={(e) => setCauseOfDeathOther(e.target.value)}
                            placeholder="Others specify..."
                            className="px-2.5 py-1.5 bg-rose-50/50 border border-rose-300 rounded-md text-xs min-h-[32px] focus:ring-rose-500/20 focus:border-rose-500"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-800 leading-tight mb-1">Patient Feedback</label>
              <AutoTextarea
                minRows={1}
                disabled={readOnly || isDeceased === 'Yes'}
                value={isDeceased === 'Yes' ? 'N/A (Deceased)' : patientFeedback}
                onChange={(e) => setPatientFeedback(e.target.value)}
                placeholder={isDeceased === 'Yes' ? 'N/A (Deceased)' : 'Patient Feedback...'}
                className={`px-2.5 py-1.5 border rounded-md text-xs min-h-[48px] ${
                  isDeceased === 'Yes' ? 'bg-slate-100 text-slate-400 border-slate-300 cursor-not-allowed' : 'bg-white border-slate-300 focus:ring-teal-500/20 focus:border-teal-500'
                }`}
              />
            </div>
          </div>

        </div>

        {/* Action Buttons Footer */}
        {!readOnly && (
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
            {onCancel && (
              <button
                type="button"
                onClick={onCancel}
                className="px-5 py-2.5 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 font-bold text-xs transition-all cursor-pointer"
              >
                Cancel
              </button>
            )}
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 active:bg-teal-800 text-white font-bold text-xs shadow-md transition-all cursor-pointer flex items-center gap-2"
            >
              <Check className="w-4 h-4 stroke-[3]" />
              Save Detailed HF Follow-up Log
            </button>
          </div>
        )}
      </form>

      <HfFollowupPdfModal
        isOpen={isPdfModalOpen}
        onClose={() => setIsPdfModalOpen(false)}
        logData={previewFormData}
        patientData={patientData}
      />
    </div>
  );
}
