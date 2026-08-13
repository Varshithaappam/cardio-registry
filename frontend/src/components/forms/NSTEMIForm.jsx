import React, { useState, forwardRef, useImperativeHandle } from 'react';
import axios from 'axios';
import SectionCard from './common/SectionCard';

const NSTEMIForm = forwardRef(function NSTEMIForm(
  { patientRecord, editingRecord, onCompletionChange, onSubmitSuccess },
  ref
) {
  const patient = patientRecord?.patient || {};

  // Single formData state object mapping to all 9 SQL database tables
  const [formData, setFormData] = useState({
    // Table 1: nstemi_registry
    patient_id: patient.id || patient.patient_id || 1,
    acs_no: editingRecord?.acs_no || `ACS-${Date.now().toString().slice(-6)}`,
    ip_no: editingRecord?.ip_no || '',
    admission_date: editingRecord?.admission_date || new Date().toISOString().split('T')[0],
    discharge_date: editingRecord?.discharge_date || '',
    primary_consultant: editingRecord?.primary_consultant || 'Dr. K. Sridhar (Cardiologist)',

    // Table 2: nstemi_administrative
    hypertension: false,
    diabetes: false,
    smoking: false,
    renal_failure: false,
    copd: false,
    cva: false,
    prior_acs: false,
    prior_ptca: false,
    prior_cabg: false,
    other_background: '',

    // Table 3: nstemi_clinical_assessment
    typical_angina: true,
    atypical_chest_pain: false,
    breathlessness: false,
    syncope_presyncope: false,
    pulse_rate: 76,
    systolic_bp: 130,
    diastolic_bp: 82,
    age_65_or_older: false,
    at_least_3_chd_risk_factors: false,
    prior_coronary_stenosis_50: false,
    st_deviation_admission: false,
    at_least_2_anginal_episodes_24h: false,
    elevated_cardiac_markers: true,
    aspirin_use_last_7d: false,
    timi_total_score: 1,

    // Table 4: nstemi_treatment_strategy
    treatment_strategy: 'PAMI',
    pami: true,
    door_to_balloon_time: 45,
    culprit_segment: 'LAD Proximal',
    stent_type: 'Drug-Eluting Stent (DES)',
    stent_diameter: 3.5,
    stent_length: 28,
    thrombosuction: 'Not done',
    procedural_success: 'Yes',
    post_procedure_timi_flow: '3',
    thrombolysis: false,
    door_to_needle_time: '',
    thrombolytic_drug: 'None',
    thrombolytic_dose: '',
    conservative: false,
    heparin_strategy: 'Unfractionated Heparin (UFH)',
    gp2b3a_inhibitor: 'No',
    bivalirudin: 'No',

    // Table 5: nstemi_diagnostics
    bedside_echo: 'Mild Hypokinesia',
    echo_ef: 52,
    ecg_rhythm: 'Sinus Rhythm',
    ecg_st_depression: true,
    ecg_t_wave_inversion: true,
    troponin_i: 2.45,
    bnp_value: 180,
    crp_value: 4.2,
    lipid_profile: 'LDL: 110 mg/dL, HDL: 42 mg/dL, Triglycerides: 160 mg/dL',
    serum_creatinine: 1.0,
    hemoglobin: 13.8,

    // Table 6: nstemi_outcomes
    death: false,
    reinfarction: false,
    stroke: false,
    major_bleeding: false,
    heart_failure_onset: false,
    cardiogenic_shock: false,
    discharge_aspirin: true,
    discharge_clopidogrel: false,
    discharge_ticagrelor: true,
    discharge_statin: true,
    discharge_beta_blocker: true,
    discharge_acei_arb: true,

    // Table 7: nstemi_appropriateness
    iccu_admission: true,
    thrombolysis_indication: false,
    pami_indication: true,
    guideline_adherence: true,
    risk_stratification_done: true,

    // Table 8: nstemi_hospitalization
    iccu_hours: 36,
    total_hospital_stay_days: 4,
    room_type: 'Deluxe Ward',
    total_cost: 145000,
    insurance_covered_amount: 120000,

    // Table 9: nstemi_followup
    followup_month: '1-Month',
    angina: false,
    readmission: false,
    statins: true,
    antiplatelets: true,
    compliance_status: 'Good'
  });

  const [loading, setLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState(null);

  // Generic Field Change Handler with TIMI Score Auto-Calculation
  const handleChange = (field, value) => {
    setFormData((prev) => {
      const updated = { ...prev, [field]: value };
      
      // Auto recalculate TIMI score when risk factors change
      if ([
        'age_65_or_older',
        'at_least_3_chd_risk_factors',
        'prior_coronary_stenosis_50',
        'st_deviation_admission',
        'at_least_2_anginal_episodes_24h',
        'elevated_cardiac_markers',
        'aspirin_use_last_7d'
      ].includes(field)) {
        let score = 0;
        if (field === 'age_65_or_older' ? value : prev.age_65_or_older) score++;
        if (field === 'at_least_3_chd_risk_factors' ? value : prev.at_least_3_chd_risk_factors) score++;
        if (field === 'prior_coronary_stenosis_50' ? value : prev.prior_coronary_stenosis_50) score++;
        if (field === 'st_deviation_admission' ? value : prev.st_deviation_admission) score++;
        if (field === 'at_least_2_anginal_episodes_24h' ? value : prev.at_least_2_anginal_episodes_24h) score++;
        if (field === 'elevated_cardiac_markers' ? value : prev.elevated_cardiac_markers) score++;
        if (field === 'aspirin_use_last_7d' ? value : prev.aspirin_use_last_7d) score++;
        updated.timi_total_score = score;
      }

      return updated;
    });
  };

  // Imperative handle for parent wrapper integration
  useImperativeHandle(ref, () => ({
    getSubmissionData: () => formData,
    validateForm: () => true
  }));

  // Form Submit Handler
  const handleSubmit = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    setLoading(true);
    setStatusMsg(null);

    try {
      // Send flat payload containing all keys for 9 SQL tables
      const response = await axios.post('/api/nstemi', formData);
      if (response.data && response.data.success) {
        setStatusMsg({ type: 'success', text: response.data.message || 'NSTEMI record created successfully!' });
        if (onSubmitSuccess) onSubmitSuccess(response.data);
      } else {
        setStatusMsg({ type: 'error', text: response.data?.message || 'Failed to submit NSTEMI record.' });
      }
    } catch (err) {
      console.error('NSTEMI Submit Error:', err);
      setStatusMsg({
        type: 'error',
        text: err.response?.data?.message || 'Error submitting NSTEMI record. Please check backend connection.'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 text-slate-800">
      
      {/* Alert Status Banner */}
      {statusMsg && (
        <div className={`p-4 rounded-xl font-semibold text-xs border ${
          statusMsg.type === 'success' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-rose-50 text-rose-800 border-rose-200'
        }`}>
          {statusMsg.text}
        </div>
      )}

      {/* 1. Demographics & Registry Details */}
      <SectionCard title="1. NSTEMI Registry Header" subtitle="Table: nstemi_registry">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
          <div>
            <label className="font-bold text-slate-700 block mb-1">ACS Number</label>
            <input
              type="text"
              value={formData.acs_no}
              onChange={(e) => handleChange('acs_no', e.target.value)}
              className="w-full p-2 border border-slate-300 rounded-md font-mono"
            />
          </div>
          <div>
            <label className="font-bold text-slate-700 block mb-1">IP / Admission No.</label>
            <input
              type="text"
              value={formData.ip_no}
              onChange={(e) => handleChange('ip_no', e.target.value)}
              placeholder="e.g. IP-99231"
              className="w-full p-2 border border-slate-300 rounded-md"
            />
          </div>
          <div>
            <label className="font-bold text-slate-700 block mb-1">Primary Consultant</label>
            <select
              value={formData.primary_consultant}
              onChange={(e) => handleChange('primary_consultant', e.target.value)}
              className="w-full p-2 border border-slate-300 rounded-md bg-white"
            >
              <option value="Dr. K. Sridhar (Cardiologist)">Dr. K. Sridhar (Cardiologist)</option>
              <option value="Dr. Ananth Rao">Dr. Ananth Rao</option>
              <option value="Dr. M. Sharma">Dr. M. Sharma</option>
            </select>
          </div>
          <div>
            <label className="font-bold text-slate-700 block mb-1">Admission Date</label>
            <input
              type="date"
              value={formData.admission_date}
              onChange={(e) => handleChange('admission_date', e.target.value)}
              className="w-full p-2 border border-slate-300 rounded-md"
            />
          </div>
          <div>
            <label className="font-bold text-slate-700 block mb-1">Discharge Date</label>
            <input
              type="date"
              value={formData.discharge_date}
              onChange={(e) => handleChange('discharge_date', e.target.value)}
              className="w-full p-2 border border-slate-300 rounded-md"
            />
          </div>
        </div>
      </SectionCard>

      {/* 2. Clinical Background & Administrative Data */}
      <SectionCard title="2. Administrative & Background Info" subtitle="Table: nstemi_administrative">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 text-xs">
          {[
            { key: 'hypertension', label: 'Hypertension' },
            { key: 'diabetes', label: 'Diabetes Mellitus' },
            { key: 'smoking', label: 'Smoking / Tobacco' },
            { key: 'renal_failure', label: 'Renal Failure' },
            { key: 'copd', label: 'COPD' },
            { key: 'cva', label: 'CVA / Stroke' },
            { key: 'prior_acs', label: 'Prior ACS' },
            { key: 'prior_ptca', label: 'Prior PTCA' },
            { key: 'prior_cabg', label: 'Prior CABG' }
          ].map((item) => (
            <label key={item.key} className="flex items-center gap-2 p-2 bg-slate-50 border border-slate-200 rounded-lg cursor-pointer hover:bg-slate-100">
              <input
                type="checkbox"
                checked={formData[item.key]}
                onChange={(e) => handleChange(item.key, e.target.checked)}
                className="rounded text-orange-600 focus:ring-orange-500"
              />
              <span className="font-medium text-slate-800">{item.label}</span>
            </label>
          ))}
        </div>
        <div className="mt-3 text-xs">
          <label className="font-bold text-slate-700 block mb-1">Other Background / Notes</label>
          <input
            type="text"
            value={formData.other_background}
            onChange={(e) => handleChange('other_background', e.target.value)}
            placeholder="Specify any additional history..."
            className="w-full p-2 border border-slate-300 rounded-md"
          />
        </div>
      </SectionCard>

      {/* 3. Clinical Assessment & TIMI Risk Score */}
      <SectionCard title="3. Presentation & TIMI Risk Score" subtitle="Table: nstemi_clinical_assessment">
        <div className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            <div>
              <label className="font-bold text-slate-700 block mb-1">Pulse Rate (bpm)</label>
              <input
                type="number"
                value={formData.pulse_rate}
                onChange={(e) => handleChange('pulse_rate', e.target.value)}
                className="w-full p-2 border border-slate-300 rounded-md"
              />
            </div>
            <div>
              <label className="font-bold text-slate-700 block mb-1">Systolic BP (mmHg)</label>
              <input
                type="number"
                value={formData.systolic_bp}
                onChange={(e) => handleChange('systolic_bp', e.target.value)}
                className="w-full p-2 border border-slate-300 rounded-md"
              />
            </div>
            <div>
              <label className="font-bold text-slate-700 block mb-1">Diastolic BP (mmHg)</label>
              <input
                type="number"
                value={formData.diastolic_bp}
                onChange={(e) => handleChange('diastolic_bp', e.target.value)}
                className="w-full p-2 border border-slate-300 rounded-md"
              />
            </div>
            <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg flex flex-col justify-center items-center">
              <span className="font-bold text-orange-900 uppercase text-[10px] tracking-wider">Calculated TIMI Score</span>
              <span className="text-2xl font-extrabold text-orange-600">{formData.timi_total_score} / 7</span>
            </div>
          </div>

          <div className="font-bold text-slate-800 border-t border-slate-200 pt-3">TIMI Risk Criteria Checkbox Checklist</div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {[
              { key: 'age_65_or_older', label: 'Age ≥ 65 years (+1)' },
              { key: 'at_least_3_chd_risk_factors', label: '≥ 3 CAD Risk Factors (+1)' },
              { key: 'prior_coronary_stenosis_50', label: 'Prior Coronary Stenosis ≥ 50% (+1)' },
              { key: 'st_deviation_admission', label: 'ST Segment Deviation on ECG (+1)' },
              { key: 'at_least_2_anginal_episodes_24h', label: '≥ 2 Anginal Episodes in last 24h (+1)' },
              { key: 'elevated_cardiac_markers', label: 'Elevated Serum Cardiac Markers (+1)' },
              { key: 'aspirin_use_last_7d', label: 'Aspirin use in last 7 days (+1)' }
            ].map((item) => (
              <label key={item.key} className="flex items-center gap-2 p-2.5 bg-white border border-slate-200 rounded-lg cursor-pointer hover:border-orange-300">
                <input
                  type="checkbox"
                  checked={formData[item.key]}
                  onChange={(e) => handleChange(item.key, e.target.checked)}
                  className="rounded text-orange-600 focus:ring-orange-500"
                />
                <span className="font-medium text-slate-700">{item.label}</span>
              </label>
            ))}
          </div>
        </div>
      </SectionCard>

      {/* 4. Treatment Strategy & Procedures */}
      <SectionCard title="4. Treatment Strategy & Procedures" subtitle="Table: nstemi_treatment_strategy">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
          <div>
            <label className="font-bold text-slate-700 block mb-1">Primary Strategy</label>
            <select
              value={formData.treatment_strategy}
              onChange={(e) => {
                const strat = e.target.value;
                handleChange('treatment_strategy', strat);
                handleChange('pami', strat === 'PAMI');
                handleChange('thrombolysis', strat === 'Thrombolysis');
                handleChange('conservative', strat === 'Conservative');
              }}
              className="w-full p-2 border border-slate-300 rounded-md bg-white font-bold"
            >
              <option value="PAMI">PAMI (Primary PCI)</option>
              <option value="Thrombolysis">Thrombolysis</option>
              <option value="Conservative">Conservative Medical Mgmt</option>
            </select>
          </div>

          {formData.treatment_strategy === 'PAMI' && (
            <>
              <div>
                <label className="font-bold text-slate-700 block mb-1">Door to Balloon (Mins)</label>
                <input
                  type="number"
                  value={formData.door_to_balloon_time}
                  onChange={(e) => handleChange('door_to_balloon_time', e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded-md"
                />
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-1">Culprit Segment</label>
                <input
                  type="text"
                  value={formData.culprit_segment}
                  onChange={(e) => handleChange('culprit_segment', e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded-md"
                />
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-1">Stent Type</label>
                <input
                  type="text"
                  value={formData.stent_type}
                  onChange={(e) => handleChange('stent_type', e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded-md"
                />
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-1">Stent Diameter (mm)</label>
                <input
                  type="number"
                  step="0.1"
                  value={formData.stent_diameter}
                  onChange={(e) => handleChange('stent_diameter', e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded-md"
                />
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-1">Stent Length (mm)</label>
                <input
                  type="number"
                  value={formData.stent_length}
                  onChange={(e) => handleChange('stent_length', e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded-md"
                />
              </div>
            </>
          )}

          <div>
            <label className="font-bold text-slate-700 block mb-1">Anticoagulant Strategy</label>
            <select
              value={formData.heparin_strategy}
              onChange={(e) => handleChange('heparin_strategy', e.target.value)}
              className="w-full p-2 border border-slate-300 rounded-md bg-white"
            >
              <option value="Unfractionated Heparin (UFH)">Unfractionated Heparin (UFH)</option>
              <option value="LMWH (Enoxaparin)">LMWH (Enoxaparin)</option>
              <option value="Fondaparinux">Fondaparinux</option>
              <option value="None">None</option>
            </select>
          </div>
        </div>
      </SectionCard>

      {/* 5. Diagnostics, Echo & Labs */}
      <SectionCard title="5. Diagnostics, Echo & Labs" subtitle="Table: nstemi_diagnostics">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
          <div>
            <label className="font-bold text-slate-700 block mb-1">Echocardiogram EF (%)</label>
            <input
              type="number"
              value={formData.echo_ef}
              onChange={(e) => handleChange('echo_ef', e.target.value)}
              className="w-full p-2 border border-slate-300 rounded-md"
            />
          </div>
          <div>
            <label className="font-bold text-slate-700 block mb-1">Troponin I (ng/mL)</label>
            <input
              type="number"
              step="0.01"
              value={formData.troponin_i}
              onChange={(e) => handleChange('troponin_i', e.target.value)}
              className="w-full p-2 border border-slate-300 rounded-md"
            />
          </div>
          <div>
            <label className="font-bold text-slate-700 block mb-1">BNP (pg/mL)</label>
            <input
              type="number"
              value={formData.bnp_value}
              onChange={(e) => handleChange('bnp_value', e.target.value)}
              className="w-full p-2 border border-slate-300 rounded-md"
            />
          </div>
          <div>
            <label className="font-bold text-slate-700 block mb-1">Serum Creatinine (mg/dL)</label>
            <input
              type="number"
              step="0.1"
              value={formData.serum_creatinine}
              onChange={(e) => handleChange('serum_creatinine', e.target.value)}
              className="w-full p-2 border border-slate-300 rounded-md"
            />
          </div>
        </div>
      </SectionCard>

      {/* 6. Outcomes & Discharge Medications */}
      <SectionCard title="6. Outcomes & Discharge Meds" subtitle="Table: nstemi_outcomes">
        <div className="space-y-3 text-xs">
          <div className="font-bold text-slate-800">In-Hospital Complications</div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {[
              { key: 'death', label: 'In-Hospital Death' },
              { key: 'reinfarction', label: 'Re-Infarction' },
              { key: 'stroke', label: 'Stroke' },
              { key: 'major_bleeding', label: 'Major Bleeding' },
              { key: 'heart_failure_onset', label: 'Heart Failure' },
              { key: 'cardiogenic_shock', label: 'Cardiogenic Shock' }
            ].map((item) => (
              <label key={item.key} className="flex items-center gap-2 p-2 bg-rose-50/50 border border-rose-200 rounded-lg cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData[item.key]}
                  onChange={(e) => handleChange(item.key, e.target.checked)}
                  className="rounded text-rose-600 focus:ring-rose-500"
                />
                <span className="font-medium text-rose-950">{item.label}</span>
              </label>
            ))}
          </div>

          <div className="font-bold text-slate-800 pt-2 border-t border-slate-200">Discharge Guideline Directed Medical Therapy (GDMT)</div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {[
              { key: 'discharge_aspirin', label: 'Aspirin' },
              { key: 'discharge_clopidogrel', label: 'Clopidogrel' },
              { key: 'discharge_ticagrelor', label: 'Ticagrelor' },
              { key: 'discharge_statin', label: 'Statin' },
              { key: 'discharge_beta_blocker', label: 'Beta Blocker' },
              { key: 'discharge_acei_arb', label: 'ACEi / ARB / ARNI' }
            ].map((item) => (
              <label key={item.key} className="flex items-center gap-2 p-2 bg-emerald-50/50 border border-emerald-200 rounded-lg cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData[item.key]}
                  onChange={(e) => handleChange(item.key, e.target.checked)}
                  className="rounded text-emerald-600 focus:ring-emerald-500"
                />
                <span className="font-medium text-emerald-950">{item.label}</span>
              </label>
            ))}
          </div>
        </div>
      </SectionCard>

      {/* 7. Appropriateness & Quality Metrics */}
      <SectionCard title="7. Quality & Appropriateness Metrics" subtitle="Table: nstemi_appropriateness">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
          {[
            { key: 'iccu_admission', label: 'ICCU / CCU Admission Indicated' },
            { key: 'thrombolysis_indication', label: 'Thrombolysis Indication Checked' },
            { key: 'pami_indication', label: 'PAMI / Invasive Indication Met' },
            { key: 'guideline_adherence', label: 'ACC/AHA Guideline Adherent' },
            { key: 'risk_stratification_done', label: 'TIMI Risk Stratification Documented' }
          ].map((item) => (
            <label key={item.key} className="flex items-center gap-2 p-2.5 bg-slate-50 border border-slate-200 rounded-lg cursor-pointer">
              <input
                type="checkbox"
                checked={formData[item.key]}
                onChange={(e) => handleChange(item.key, e.target.checked)}
                className="rounded text-orange-600 focus:ring-orange-500"
              />
              <span className="font-medium text-slate-800">{item.label}</span>
            </label>
          ))}
        </div>
      </SectionCard>

      {/* 8. Hospitalization Logistics & Costs */}
      <SectionCard title="8. Hospitalization & Logistics" subtitle="Table: nstemi_hospitalization">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
          <div>
            <label className="font-bold text-slate-700 block mb-1">ICCU Hours</label>
            <input
              type="number"
              value={formData.iccu_hours}
              onChange={(e) => handleChange('iccu_hours', e.target.value)}
              className="w-full p-2 border border-slate-300 rounded-md"
            />
          </div>
          <div>
            <label className="font-bold text-slate-700 block mb-1">Total Stay (Days)</label>
            <input
              type="number"
              value={formData.total_hospital_stay_days}
              onChange={(e) => handleChange('total_hospital_stay_days', e.target.value)}
              className="w-full p-2 border border-slate-300 rounded-md"
            />
          </div>
          <div>
            <label className="font-bold text-slate-700 block mb-1">Total Cost (₹)</label>
            <input
              type="number"
              value={formData.total_cost}
              onChange={(e) => handleChange('total_cost', e.target.value)}
              className="w-full p-2 border border-slate-300 rounded-md"
            />
          </div>
          <div>
            <label className="font-bold text-slate-700 block mb-1">Insurance Amount (₹)</label>
            <input
              type="number"
              value={formData.insurance_covered_amount}
              onChange={(e) => handleChange('insurance_covered_amount', e.target.value)}
              className="w-full p-2 border border-slate-300 rounded-md"
            />
          </div>
        </div>
      </SectionCard>

      {/* 9. Follow-up Matrix */}
      <SectionCard title="9. Long-term Follow-up Matrix" subtitle="Table: nstemi_followup">
        <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-5 gap-4 text-xs">
          <div>
            <label className="font-bold text-slate-700 block mb-1">Follow-up Interval</label>
            <select
              value={formData.followup_month}
              onChange={(e) => handleChange('followup_month', e.target.value)}
              className="w-full p-2 border border-slate-300 rounded-md bg-white"
            >
              <option value="1-Month">1-Month</option>
              <option value="3-Months">3-Months</option>
              <option value="6-Months">6-Months</option>
              <option value="1-Year">1-Year</option>
            </select>
          </div>

          <label className="flex items-center gap-2 p-2 bg-slate-50 border border-slate-200 rounded-lg cursor-pointer self-end">
            <input
              type="checkbox"
              checked={formData.angina}
              onChange={(e) => handleChange('angina', e.target.checked)}
              className="rounded text-orange-600 focus:ring-orange-500"
            />
            <span className="font-medium text-slate-800">Recurrent Angina</span>
          </label>

          <label className="flex items-center gap-2 p-2 bg-slate-50 border border-slate-200 rounded-lg cursor-pointer self-end">
            <input
              type="checkbox"
              checked={formData.readmission}
              onChange={(e) => handleChange('readmission', e.target.checked)}
              className="rounded text-orange-600 focus:ring-orange-500"
            />
            <span className="font-medium text-slate-800">Hospital Readmission</span>
          </label>

          <div>
            <label className="font-bold text-slate-700 block mb-1">Compliance Status</label>
            <select
              value={formData.compliance_status}
              onChange={(e) => handleChange('compliance_status', e.target.value)}
              className="w-full p-2 border border-slate-300 rounded-md bg-white"
            >
              <option value="Good">Good Compliance</option>
              <option value="Partial">Partial Compliance</option>
              <option value="Poor">Non-Compliant</option>
            </select>
          </div>
        </div>
      </SectionCard>

      {/* Submit Button Controls */}
      <div className="flex items-center justify-end gap-3 border-t border-slate-200 pt-4">
        <button
          type="submit"
          disabled={loading}
          className="px-6 py-2.5 bg-orange-600 hover:bg-orange-700 text-white rounded-lg font-bold text-xs shadow-md transition-colors cursor-pointer disabled:opacity-50"
        >
          {loading ? 'Submitting Registry Record...' : 'Submit NSTEMI Registry Entry'}
        </button>
      </div>

    </form>
  );
});

export default NSTEMIForm;
