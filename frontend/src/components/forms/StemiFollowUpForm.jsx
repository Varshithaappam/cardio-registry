import React, { useState, useRef, useLayoutEffect, useEffect } from 'react';
import { 
  User, Phone, Calendar, Heart, Shield, Activity, FileText, 
  AlertTriangle, Check, X, Pill, Stethoscope, ChevronDown, Sparkles 
} from 'lucide-react';
import { limitDecimalDigits } from '../../utils/formSanitizers';
import { getLocalDateString } from '../../utils/dateUtils';

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

const DEFAULT_ACS_DRUGS = [
  { name: 'Beta-blocker', taking: 'No', inRecentVisit: 'No' },
  { name: 'Calcium-channel blocker', taking: 'No', inRecentVisit: 'No' },
  { name: 'Nitrate', taking: 'No', inRecentVisit: 'No' },
  { name: 'Nicorandil', taking: 'No', inRecentVisit: 'No' },
  { name: 'Ivabradine', taking: 'No', inRecentVisit: 'No' },
  { name: 'Ranozolidine', taking: 'No', inRecentVisit: 'No' },
  { name: 'Trimetazidine', taking: 'No', inRecentVisit: 'No' },
  { name: 'Aspirin', taking: 'Yes', inRecentVisit: 'Yes' },
  { name: 'Clopidigrel', taking: 'Yes', inRecentVisit: 'Yes' },
  { name: 'Prasugrel', taking: 'No', inRecentVisit: 'No' },
  { name: 'Ticagralor', taking: 'No', inRecentVisit: 'No' },
  { name: 'Gp2b3a', taking: 'No', inRecentVisit: 'No' },
  { name: 'Bivaluridin', taking: 'No', inRecentVisit: 'No' },
  { name: 'Statin', taking: 'Yes', inRecentVisit: 'Yes', dose: '' },
  { name: 'Any other', isOther: true, otherName: '', taking: 'No', inRecentVisit: 'No' }
];

const ACS_SYMPTOMS = [
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

const ACS_CLINICAL_EVENTS = [
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

export default function StemiFollowUpForm({ patientData = {}, taskData = {}, onSave, onCancel, registryType = 'STEMI', readOnly = false }) {
  const isStemi = registryType.toUpperCase().includes('STEMI') && !registryType.toUpperCase().includes('NSTEMI');

  const [formData, setFormData] = useState({
    is_detailed_stemi_form: isStemi,
    is_detailed_nstemi_form: !isStemi,
    is_detailed_acs_form: true,
    overall_registry_status: 'Completed',
    patient_followup_date: getLocalDateString(),
    followup_conducted: 'Telephonic follow-up',
    attempt_number: 1,
    answering_status: 'Yes',
    no_answer_reason: '',
    health_status: 'Healthy',
    health_unhealthy_details: '',
    medications_still_taking: '',
    side_effects_observed: 'No',
    side_effects_details: '',
    physician_medication_changes: 'No',
    physician_medication_changes_details: '',
    new_health_complaints: '',
    has_new_symptoms: 'No',
    selected_symptoms: [],
    symptom_other_details: '',
    medication_adherence: 'Yes',
    medication_adherence_no_reason: '',
    drug_grid: DEFAULT_ACS_DRUGS.map(d => ({ ...d })),
    trop_i_result: '',
    creatinine_result: '',
    bnp_nt_probnp_result: '',
    hemoglobin_result: '',
    sodium_result: '',
    potassium_result: '',
    echo_done: 'No',
    has_major_clinical_event: 'No',
    selected_clinical_events: [],
    event_other_details: '',
    vaccinations_details: '',
    is_deceased: 'No',
    died_within_30days_discharge: 'No',
    place_of_death: '',
    date_of_death: '',
    cause_of_death: 'Cardiac',
    cause_of_death_other_details: '',
    join_program_opt_in: 'Yes',
    patient_feedback: '',
    date_of_admission: patientData.date_of_admission || taskData.date_of_admission || patientData.admission_date || '',
    date_of_discharge: patientData.date_of_discharge || taskData.date_of_discharge || patientData.discharge_date || '',
    ip_no: patientData.ip_no || taskData.ip_no || patientData.ipNo || '',
    acs_no: patientData.acs_no || taskData.acs_no || patientData.acsNo || ''
  });

  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setFormData((prev) => ({
      ...prev,
      date_of_admission: prev.date_of_admission || patientData.date_of_admission || taskData.date_of_admission || patientData.admission_date || '',
      date_of_discharge: prev.date_of_discharge || patientData.date_of_discharge || taskData.date_of_discharge || patientData.discharge_date || '',
      ip_no: prev.ip_no || patientData.ip_no || taskData.ip_no || patientData.ipNo || '',
      acs_no: prev.acs_no || patientData.acs_no || taskData.acs_no || patientData.acsNo || ''
    }));
  }, [patientData, taskData]);

  const handleSymptomToggle = (symptom) => {
    setFormData((prev) => {
      const current = prev.selected_symptoms || [];
      const updated = current.includes(symptom)
        ? current.filter((s) => s !== symptom)
        : [...current, symptom];
      return {
        ...prev,
        selected_symptoms: updated,
        has_new_symptoms: updated.length > 0 ? 'Yes' : prev.has_new_symptoms
      };
    });
  };

  const handleEventToggle = (evt) => {
    setFormData((prev) => {
      const current = prev.selected_clinical_events || [];
      const updated = current.includes(evt)
        ? current.filter((e) => e !== evt)
        : [...current, evt];
      return {
        ...prev,
        selected_clinical_events: updated,
        has_major_clinical_event: updated.length > 0 ? 'Yes' : prev.has_major_clinical_event
      };
    });
  };

  const handleDrugGridChange = (index, field, value) => {
    setFormData((prev) => {
      const grid = [...prev.drug_grid];
      grid[index] = { ...grid[index], [field]: value };
      return { ...prev, drug_grid: grid };
    });
  };

  const handleFillDummyData = () => {
    const filledGrid = DEFAULT_ACS_DRUGS.map((d) => {
      if (d.name === 'Aspirin' || d.name === 'Clopidigrel' || d.name === 'Statin' || d.name === 'Beta-blocker') {
        return { ...d, taking: 'Yes', inRecentVisit: 'Yes', dose: d.name === 'Statin' ? '80mg' : '' };
      }
      return { ...d, taking: 'No', inRecentVisit: 'No' };
    });

    setFormData((prev) => ({
      ...prev,
      ip_no: prev.ip_no || patientData.ip_no || taskData.ip_no || (isStemi ? 'IP-2026-8891' : 'IP00002'),
      acs_no: prev.acs_no || patientData.acs_no || taskData.acs_no || (isStemi ? 'ACS-STEMI-2026-904' : 'IP00002'),
      patient_followup_date: getLocalDateString(),
      followup_conducted: 'Telephonic follow-up',
      attempt_number: 1,
      answering_status: 'Yes',
      no_answer_reason: '',
      health_status: 'Healthy',
      health_unhealthy_details: '',
      medications_still_taking: 'Aspirin 75mg daily, Clopidogrel 75mg daily, Atorvastatin 80mg night, Metoprolol 50mg twice daily',
      side_effects_observed: 'No',
      side_effects_details: '',
      physician_medication_changes: 'No',
      physician_medication_changes_details: '',
      new_health_complaints: 'Mild exertion fatigue, otherwise feeling well',
      has_new_symptoms: 'Yes',
      selected_symptoms: ['Chest pain/discomfort', 'Fatigue'],
      symptom_other_details: 'Occasional mild tightness after walking long distance',
      medication_adherence: 'Yes',
      medication_adherence_no_reason: '',
      drug_grid: filledGrid,
      trop_i_result: '0.02 ng/mL',
      creatinine_result: '1.0 mg/dL',
      bnp_nt_probnp_result: '120 pg/mL',
      hemoglobin_result: '14.2 g/dL',
      sodium_result: '140 mEq/L',
      potassium_result: '4.3 mEq/L',
      echo_done: 'Yes',
      has_major_clinical_event: 'No',
      selected_clinical_events: [],
      event_other_details: '',
      vaccinations_details: 'Influenza vaccine taken on 15-Aug-2026',
      is_deceased: 'No',
      died_within_30days_discharge: 'No',
      place_of_death: '',
      date_of_death: '',
      cause_of_death: 'Cardiac',
      cause_of_death_other_details: '',
      join_program_opt_in: 'Yes',
      patient_feedback: 'Patient reports good compliance with prescribed dual antiplatelet therapy and regular blood pressure checks.'
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (onSave) {
        await onSave(formData);
      }
    } catch (err) {
      console.error('Error submitting form:', err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-white w-full rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh] animate-fadeIn">
      {/* Form Header */}
      <div className={`px-6 py-4 flex items-center justify-between text-white ${isStemi ? 'bg-gradient-to-r from-red-600 via-rose-600 to-red-700' : 'bg-gradient-to-r from-amber-600 via-orange-600 to-amber-700'}`}>
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-white/15 backdrop-blur-md rounded-xl">
            <FileText className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="font-extrabold text-lg tracking-tight">
              {isStemi ? 'STEMI Detailed Follow-Up Form' : 'NSTEMI Detailed Follow-Up Form'}
            </h2>
            <p className="text-xs text-white/80 font-medium">
              Patient: {patientData.patient_name || 'N/A'} (UHID: {patientData.uhid || patientData.reg_patient_id || 'N/A'})
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {/* Overall Registry Status (White background dropdown for clean readability) */}
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border border-white/30 shadow-xs ${isStemi ? 'bg-red-900/60' : 'bg-amber-900/60'}`}>
            <span className="text-xs font-bold text-white/90">Overall Status:</span>
            <select
              value={formData.overall_registry_status || 'Completed'}
              onChange={(e) => setFormData({ ...formData, overall_registry_status: e.target.value })}
              className="bg-white text-slate-900 font-bold text-xs px-2.5 py-1 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-400 cursor-pointer shadow-xs"
            >
              <option value="Completed" className="bg-white text-slate-900 font-medium py-1">Completed</option>
              <option value="Pending" className="bg-white text-slate-900 font-medium py-1">Pending</option>
              <option value="In Progress" className="bg-white text-slate-900 font-medium py-1">In Progress</option>
              <option value="Unable to Contact" className="bg-white text-slate-900 font-medium py-1">Unable to Contact</option>
              <option value="Deceased" className="bg-white text-slate-900 font-medium py-1">Deceased</option>
            </select>
          </div>

          <button
            onClick={onCancel}
            type="button"
            className="p-2 hover:bg-white/20 text-white rounded-xl transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Form Content */}
      <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-6 text-xs text-slate-800">
        
        {/* Section 1: Outreach Metadata & Dates */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-4">
          <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider border-b border-slate-200 pb-2">
            1. Patient & Outreach Details
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-slate-600 font-semibold mb-1">IP No. (Hospital Episode)</label>
              <input
                type="text"
                placeholder="e.g. IP-2026-8891"
                value={formData.ip_no}
                onChange={(e) => setFormData({ ...formData, ip_no: e.target.value })}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 font-medium text-slate-800"
              />
            </div>

            <div>
              <label className="block text-slate-600 font-semibold mb-1">ACS No. / Episode ID</label>
              <input
                type="text"
                placeholder="e.g. ACS-STEMI-2026-904"
                value={formData.acs_no}
                onChange={(e) => setFormData({ ...formData, acs_no: e.target.value })}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 font-medium text-slate-800"
              />
            </div>

            <div>
              <label className="block text-slate-600 font-semibold mb-1">Follow-Up Date</label>
              <input
                type="date"
                value={formData.patient_followup_date}
                onChange={(e) => setFormData({ ...formData, patient_followup_date: e.target.value })}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 font-medium"
              />
            </div>

            <div>
              <label className="block text-slate-600 font-semibold mb-1">Follow-Up Conducted</label>
              <select
                value={formData.followup_conducted}
                onChange={(e) => setFormData({ ...formData, followup_conducted: e.target.value })}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 font-medium"
              >
                <option value="Telephonic follow-up">Telephonic follow-up</option>
                <option value="Physical Visit">Physical Visit</option>
                <option value="OPD Visit">OPD Visit</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-600 font-semibold mb-1">Follow-Up Attempt in Month</label>
              <select
                value={formData.attempt_number}
                onChange={(e) => setFormData({ ...formData, attempt_number: parseInt(e.target.value, 10) })}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 font-medium"
              >
                <option value={1}>Attempt 1</option>
                <option value={2}>Attempt 2</option>
                <option value={3}>Attempt 3</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-600 font-semibold mb-1">Answering Status</label>
              <select
                value={formData.answering_status}
                onChange={(e) => setFormData({ ...formData, answering_status: e.target.value })}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 font-medium"
              >
                <option value="Yes">Yes (Answered)</option>
                <option value="No">No (Unreachable)</option>
              </select>
            </div>

            {formData.answering_status === 'No' && (
              <div className="col-span-full">
                <label className="block text-slate-600 font-semibold mb-1">Reason for No Answer</label>
                <input
                  type="text"
                  placeholder="e.g. Switched off, Wrong number, No answer after 3 rings"
                  value={formData.no_answer_reason}
                  onChange={(e) => setFormData({ ...formData, no_answer_reason: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            )}
          </div>
        </div>

        {/* Section 2: General Health & Medication Overview */}
        <div className="border border-slate-200 rounded-xl p-4 space-y-4">
          <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider border-b border-slate-100 pb-2">
            2. General Health Overview
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-600 font-semibold mb-1">Since your last visit, are you:</label>
              <div className="flex items-center gap-4 mt-1">
                <label className="flex items-center gap-1.5 cursor-pointer font-medium">
                  <input
                    type="radio"
                    name="health_status"
                    value="Healthy"
                    checked={formData.health_status === 'Healthy'}
                    onChange={(e) => setFormData({ ...formData, health_status: e.target.value })}
                    className="w-4 h-4 text-emerald-600"
                  />
                  Healthy
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer font-medium text-rose-600">
                  <input
                    type="radio"
                    name="health_status"
                    value="Unhealthy"
                    checked={formData.health_status === 'Unhealthy'}
                    onChange={(e) => setFormData({ ...formData, health_status: e.target.value })}
                    className="w-4 h-4 text-rose-600"
                  />
                  Unhealthy
                </label>
              </div>
            </div>

            {formData.health_status === 'Unhealthy' && (
              <div className="col-span-full">
                <label className="block text-slate-600 font-semibold mb-1">If Unhealthy, please specify details:</label>
                <AutoTextarea
                  value={formData.health_unhealthy_details}
                  onChange={(e) => setFormData({ ...formData, health_unhealthy_details: e.target.value })}
                  placeholder="Describe patient health issues or symptoms..."
                  className="px-3 py-2 bg-white border border-slate-300 rounded-lg border-rose-300"
                />
              </div>
            )}

            <div className="col-span-full">
              <label className="block text-slate-600 font-semibold mb-1">What Medications are you still taking? (please specify)</label>
              <AutoTextarea
                value={formData.medications_still_taking}
                onChange={(e) => setFormData({ ...formData, medications_still_taking: e.target.value })}
                placeholder="List current ongoing medications..."
                className="px-3 py-2 bg-white border border-slate-300 rounded-lg"
              />
            </div>

            <div>
              <label className="block text-slate-600 font-semibold mb-1">Any side effects observed?</label>
              <select
                value={formData.side_effects_observed}
                onChange={(e) => setFormData({ ...formData, side_effects_observed: e.target.value })}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg"
              >
                <option value="No">No</option>
                <option value="Yes">Yes</option>
              </select>
            </div>

            {formData.side_effects_observed === 'Yes' && (
              <div>
                <label className="block text-slate-600 font-semibold mb-1">If Yes, please describe side effects:</label>
                <input
                  type="text"
                  value={formData.side_effects_details}
                  onChange={(e) => setFormData({ ...formData, side_effects_details: e.target.value })}
                  placeholder="e.g. Gastric irritation, dizziness, muscle pain"
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg"
                />
              </div>
            )}

            <div>
              <label className="block text-slate-600 font-semibold mb-1">Any changes in Medications by Physician?</label>
              <select
                value={formData.physician_medication_changes}
                onChange={(e) => setFormData({ ...formData, physician_medication_changes: e.target.value })}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg"
              >
                <option value="No">No</option>
                <option value="Yes">Yes</option>
              </select>
            </div>

            {formData.physician_medication_changes === 'Yes' && (
              <div>
                <label className="block text-slate-600 font-semibold mb-1">If Yes, specify changes:</label>
                <input
                  type="text"
                  value={formData.physician_medication_changes_details}
                  onChange={(e) => setFormData({ ...formData, physician_medication_changes_details: e.target.value })}
                  placeholder="e.g. Dose altered, new drug added"
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg"
                />
              </div>
            )}

            <div className="col-span-full">
              <label className="block text-slate-600 font-semibold mb-1">Any new health complaints? (please describe)</label>
              <AutoTextarea
                value={formData.new_health_complaints}
                onChange={(e) => setFormData({ ...formData, new_health_complaints: e.target.value })}
                placeholder="Details of new health complaints..."
                className="px-3 py-2 bg-white border border-slate-300 rounded-lg"
              />
            </div>
          </div>
        </div>

        {/* Section 3: New Symptoms Checklist */}
        <div className="border border-slate-200 rounded-xl p-4 space-y-4">
          <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider border-b border-slate-100 pb-2">
            3. New Symptoms Checklist
          </h3>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
            {ACS_SYMPTOMS.map((symptom, idx) => {
              const isSelected = formData.selected_symptoms.includes(symptom);
              return (
                <label
                  key={idx}
                  className={`flex items-center gap-2 p-2 rounded-lg border cursor-pointer transition-all ${
                    isSelected 
                      ? 'bg-amber-50 border-amber-300 text-amber-900 font-bold shadow-xs' 
                      : 'bg-slate-50/50 border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => handleSymptomToggle(symptom)}
                    className="w-4 h-4 text-amber-600 rounded focus:ring-amber-500"
                  />
                  <span>{symptom}</span>
                </label>
              );
            })}
          </div>

          <div>
            <label className="block text-slate-600 font-semibold mb-1">Other Symptoms (specify):</label>
            <input
              type="text"
              value={formData.symptom_other_details}
              onChange={(e) => setFormData({ ...formData, symptom_other_details: e.target.value })}
              placeholder="Any other unlisted symptoms..."
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg"
            />
          </div>
        </div>

        {/* Section 4: Medication Adherence & Drug Grid Table */}
        <div className="border border-slate-200 rounded-xl p-4 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider">
              4. Medication Adherence & Drug Grid
            </h3>
            <div className="flex items-center gap-3">
              <span className="font-semibold text-slate-700">Following medication as prescribed?</span>
              <select
                value={formData.medication_adherence}
                onChange={(e) => setFormData({ ...formData, medication_adherence: e.target.value })}
                className="px-2 py-1 bg-white border border-slate-300 rounded-md font-bold text-xs"
              >
                <option value="Yes">Yes</option>
                <option value="No">No</option>
              </select>
            </div>
          </div>

          {formData.medication_adherence === 'No' && (
            <div>
              <label className="block text-slate-600 font-semibold mb-1">If No, please specify reason:</label>
              <input
                type="text"
                value={formData.medication_adherence_no_reason}
                onChange={(e) => setFormData({ ...formData, medication_adherence_no_reason: e.target.value })}
                placeholder="Reason for non-adherence (e.g. Cost, side effects, forgot)"
                className="w-full px-3 py-2 bg-white border border-red-300 rounded-lg"
              />
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse border border-slate-200 rounded-lg overflow-hidden">
              <thead>
                <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                  <th className="p-2 border-r border-slate-200">Generic Drug Name</th>
                  <th className="p-2 border-r border-slate-200 text-center w-36">Taking Currently</th>
                  <th className="p-2 text-center w-48">Present in Recent IP/OP Visit</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {formData.drug_grid.map((drug, index) => (
                  <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}>
                    <td className="p-2 border-r border-slate-200 font-medium text-slate-800">
                      {drug.isOther ? (
                        <div className="flex items-center gap-2">
                          <span>Other:</span>
                          <input
                            type="text"
                            placeholder="Specify drug name..."
                            value={drug.otherName || ''}
                            onChange={(e) => handleDrugGridChange(index, 'otherName', e.target.value)}
                            className="px-2 py-1 border border-slate-300 rounded w-full"
                          />
                        </div>
                      ) : (
                        <div className="flex items-center justify-between">
                          <span>{drug.name}</span>
                          {drug.name === 'Statin' && (
                            <input
                              type="text"
                              placeholder="Dose..."
                              value={drug.dose || ''}
                              onChange={(e) => handleDrugGridChange(index, 'dose', e.target.value)}
                              className="px-2 py-0.5 border border-slate-300 rounded text-xs w-24 ml-2"
                            />
                          )}
                        </div>
                      )}
                    </td>
                    <td className="p-2 border-r border-slate-200 text-center">
                      <div className="flex items-center justify-center gap-3">
                        <label className="flex items-center gap-1 cursor-pointer">
                          <input
                            type="radio"
                            name={`taking_${index}`}
                            value="Yes"
                            checked={drug.taking === 'Yes'}
                            onChange={() => handleDrugGridChange(index, 'taking', 'Yes')}
                          />
                          Yes
                        </label>
                        <label className="flex items-center gap-1 cursor-pointer">
                          <input
                            type="radio"
                            name={`taking_${index}`}
                            value="No"
                            checked={drug.taking === 'No'}
                            onChange={() => handleDrugGridChange(index, 'taking', 'No')}
                          />
                          No
                        </label>
                      </div>
                    </td>
                    <td className="p-2 text-center">
                      <div className="flex items-center justify-center gap-3">
                        <label className="flex items-center gap-1 cursor-pointer">
                          <input
                            type="radio"
                            name={`recent_${index}`}
                            value="Yes"
                            checked={drug.inRecentVisit === 'Yes'}
                            onChange={() => handleDrugGridChange(index, 'inRecentVisit', 'Yes')}
                          />
                          Yes
                        </label>
                        <label className="flex items-center gap-1 cursor-pointer">
                          <input
                            type="radio"
                            name={`recent_${index}`}
                            value="No"
                            checked={drug.inRecentVisit === 'No'}
                            onChange={() => handleDrugGridChange(index, 'inRecentVisit', 'No')}
                          />
                          No
                        </label>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Section 5: Lab Tests & Investigations */}
        <div className="border border-slate-200 rounded-xl p-4 space-y-4">
          <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider border-b border-slate-100 pb-2">
            5. Lab Tests & Investigations
          </h3>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            <div>
              <label className="block text-slate-600 font-semibold mb-1">Trop-I Result</label>
              <input
                type="text"
                value={formData.trop_i_result}
                onChange={(e) => setFormData({ ...formData, trop_i_result: limitDecimalDigits(e.target.value, 3) })}
                placeholder="Trop-I (e.g. 0.04)"
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg"
              />
            </div>

            <div>
              <label className="block text-slate-600 font-semibold mb-1">Creatinine</label>
              <input
                type="text"
                value={formData.creatinine_result}
                onChange={(e) => setFormData({ ...formData, creatinine_result: limitDecimalDigits(e.target.value, 3) })}
                placeholder="Creatinine (e.g. 1.1)"
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg"
              />
            </div>

            <div>
              <label className="block text-slate-600 font-semibold mb-1">BNP / NT-proBNP</label>
              <input
                type="text"
                value={formData.bnp_nt_probnp_result}
                onChange={(e) => setFormData({ ...formData, bnp_nt_probnp_result: limitDecimalDigits(e.target.value, 3) })}
                placeholder="BNP (e.g. 450 pg/mL)"
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg"
              />
            </div>

            <div>
              <label className="block text-slate-600 font-semibold mb-1">Haemoglobin</label>
              <input
                type="text"
                value={formData.hemoglobin_result}
                onChange={(e) => setFormData({ ...formData, hemoglobin_result: limitDecimalDigits(e.target.value, 3) })}
                placeholder="Hb (e.g. 13.5)"
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg"
              />
            </div>

            <div>
              <label className="block text-slate-600 font-semibold mb-1">Sodium</label>
              <input
                type="text"
                value={formData.sodium_result}
                onChange={(e) => setFormData({ ...formData, sodium_result: limitDecimalDigits(e.target.value, 3) })}
                placeholder="Sodium (e.g. 138)"
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg"
              />
            </div>

            <div>
              <label className="block text-slate-600 font-semibold mb-1">Potassium</label>
              <input
                type="text"
                value={formData.potassium_result}
                onChange={(e) => setFormData({ ...formData, potassium_result: limitDecimalDigits(e.target.value, 3) })}
                placeholder="Potassium (e.g. 4.2)"
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg"
              />
            </div>

            <div className="col-span-2">
              <label className="block text-slate-600 font-semibold mb-1">2D ECHO Done?</label>
              <select
                value={formData.echo_done}
                onChange={(e) => setFormData({ ...formData, echo_done: e.target.value })}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg"
              >
                <option value="No">No</option>
                <option value="Yes">Yes</option>
              </select>
            </div>
          </div>
        </div>

        {/* Section 6: Major Clinical Events & Mortality */}
        <div className="border border-slate-200 rounded-xl p-4 space-y-4">
          <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider border-b border-slate-100 pb-2">
            6. Major Clinical Events & Mortality Tracking
          </h3>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
            {ACS_CLINICAL_EVENTS.map((evt, idx) => {
              const isSelected = formData.selected_clinical_events.includes(evt);
              return (
                <label
                  key={idx}
                  className={`flex items-center gap-2 p-2 rounded-lg border cursor-pointer transition-all ${
                    isSelected 
                      ? 'bg-red-50 border-red-300 text-red-900 font-bold shadow-xs' 
                      : 'bg-slate-50/50 border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => handleEventToggle(evt)}
                    className="w-4 h-4 text-red-600 rounded focus:ring-red-500"
                  />
                  <span>{evt}</span>
                </label>
              );
            })}
          </div>

          <div>
            <label className="block text-slate-600 font-semibold mb-1">Other Clinical Event Details:</label>
            <input
              type="text"
              value={formData.event_other_details}
              onChange={(e) => setFormData({ ...formData, event_other_details: e.target.value })}
              placeholder="Details of other major clinical events..."
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg"
            />
          </div>

          <div className="border-t border-slate-100 pt-3 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-600 font-semibold mb-1">Death Occurred?</label>
              <select
                value={formData.is_deceased}
                onChange={(e) => setFormData({ ...formData, is_deceased: e.target.value })}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg font-bold text-rose-700"
              >
                <option value="No">No</option>
                <option value="Yes">Yes</option>
              </select>
            </div>

            {formData.is_deceased === 'Yes' && (
              <>
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Died within 30 days of discharge?</label>
                  <select
                    value={formData.died_within_30days_discharge}
                    onChange={(e) => setFormData({ ...formData, died_within_30days_discharge: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg"
                  >
                    <option value="No">No</option>
                    <option value="Yes">Yes</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Date of Death</label>
                  <input
                    type="date"
                    value={formData.date_of_death}
                    onChange={(e) => setFormData({ ...formData, date_of_death: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Place of Death</label>
                  <input
                    type="text"
                    value={formData.place_of_death}
                    onChange={(e) => setFormData({ ...formData, place_of_death: e.target.value })}
                    placeholder="e.g. Hospital, Home, In-Transit"
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Cause of Death</label>
                  <select
                    value={formData.cause_of_death}
                    onChange={(e) => setFormData({ ...formData, cause_of_death: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg"
                  >
                    <option value="Cardiac">Cardiac</option>
                    <option value="Non-cardiac">Non-cardiac</option>
                    <option value="Others specify">Others specify</option>
                  </select>
                </div>

                {formData.cause_of_death === 'Others specify' && (
                  <div>
                    <label className="block text-slate-600 font-semibold mb-1">Specify Other Cause of Death:</label>
                    <input
                      type="text"
                      value={formData.cause_of_death_other_details}
                      onChange={(e) => setFormData({ ...formData, cause_of_death_other_details: e.target.value })}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg"
                    />
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Section 7: Vaccinations & Program Opt-In */}
        <div className="border border-slate-200 rounded-xl p-4 space-y-4">
          <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider border-b border-slate-100 pb-2">
            7. Vaccinations, Program Opt-in & Feedback
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-600 font-semibold mb-1">Any Vaccinations (please specify)</label>
              <input
                type="text"
                value={formData.vaccinations_details}
                onChange={(e) => setFormData({ ...formData, vaccinations_details: e.target.value })}
                placeholder="e.g. Influenza, Pneumococcal"
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg"
              />
            </div>

            <div>
              <label className="block text-slate-600 font-semibold mb-1">Do you want to join in follow-up program?</label>
              <select
                value={formData.join_program_opt_in}
                onChange={(e) => setFormData({ ...formData, join_program_opt_in: e.target.value })}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg font-bold text-emerald-700"
              >
                <option value="Yes">Yes</option>
                <option value="No">No</option>
              </select>
            </div>

            <div className="col-span-full">
              <label className="block text-slate-600 font-semibold mb-1">Patient Feedback</label>
              <AutoTextarea
                value={formData.patient_feedback}
                onChange={(e) => setFormData({ ...formData, patient_feedback: e.target.value })}
                placeholder="Notes or patient feedback on overall health/care..."
                className="px-3 py-2 bg-white border border-slate-300 rounded-lg"
              />
            </div>
          </div>
        </div>

        {/* Form Actions */}
        {!readOnly ? (
          <div className="flex items-center justify-end gap-3 border-t border-slate-200 pt-4">
            <button
              type="button"
              onClick={onCancel}
              className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-all cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className={`px-6 py-2.5 text-white font-extrabold rounded-xl shadow-lg transition-all cursor-pointer disabled:opacity-50 ${isStemi ? 'bg-red-600 hover:bg-red-700' : 'bg-amber-600 hover:bg-amber-700'}`}
            >
              {submitting ? 'Saving...' : `Save ${isStemi ? 'STEMI' : 'NSTEMI'} Detailed Follow-Up`}
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-end gap-3 border-t border-slate-200 pt-4">
            <button
              type="button"
              onClick={onCancel}
              className="px-6 py-2.5 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-xl transition-all cursor-pointer shadow-md"
            >
              Close Form
            </button>
          </div>
        )}
      </form>
    </div>
  );
}
