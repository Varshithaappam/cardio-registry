import React, { useState, forwardRef, useImperativeHandle, useMemo, useEffect } from 'react';
import { calculateSTEMITimi } from '../../data/mockPatients';
import SectionCard from './common/SectionCard';
import TextInput from './common/TextInput';
import NumberInput from './common/NumberInput';
import DateInput from './common/DateInput';
import Select from './common/Select';
import { LABEL_STYLES, INPUT_DISABLED_STYLES } from './common/formStyles';

const STEMIForm = forwardRef(function STEMIForm(
  { patientRecord, editingRecord, onCompletionChange },
  ref
) {
  const patient = patientRecord?.patient || {};
  const patientAge = useMemo(() => {
    if (!patient.dob) return 0;
    const birthDate = new Date(patient.dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  }, [patient.dob]);

  // States
  const [eventDate, setEventDate] = useState(editingRecord?.admission_date || editingRecord?.admissionDate || editingRecord?.eventDate || new Date().toISOString().split('T')[0]);
  const [acsNo, setAcsNo] = useState(editingRecord?.acs_no || editingRecord?.acsNo || '');
  const [ipNo, setIpNo] = useState(editingRecord?.ip_no || editingRecord?.ipNo || '');
  const [primaryConsultant, setPrimaryConsultant] = useState(editingRecord?.primary_consultant || editingRecord?.primaryConsultant || 'Dr. K. Sridhar (Cardiologist)');
  const [dischargeDate, setDischargeDate] = useState(editingRecord?.discharge_date || editingRecord?.dischargeDate || '');
  
  // Presentation
  const [typical, setTypical] = useState(editingRecord?.presentation?.typicalAngina ?? true);
  const [atypical, setAtypical] = useState(editingRecord?.presentation?.atypicalChestPain ?? false);
  const [dysp, setDysp] = useState(editingRecord?.presentation?.breathlessness ?? false);
  const [syncope, setSyncope] = useState(editingRecord?.presentation?.syncopeOrPreSyncope ?? false);
  const [hr, setHr] = useState(editingRecord?.presentation?.pulseRate ?? 72);
  const [sbp, setSbp] = useState(editingRecord?.presentation?.sbp ?? 120);
  const [dbp, setDbp] = useState(editingRecord?.presentation?.dbp ?? 80);

  // TIMI Specifics
  const [tAge75, setTAge75] = useState(editingRecord?.timiDetails?.age75OrOver ?? patientAge >= 75);
  const [tAge65_74, setTAge65_74] = useState(editingRecord?.timiDetails?.age65To74 ?? (patientAge >= 65 && patientAge < 75));
  const [tHistory, setTHistory] = useState(editingRecord?.timiDetails?.historyDM_HTN_Angina ?? false);
  const [tSbp100, setTSbp100] = useState(editingRecord?.timiDetails?.sbpLessThan100 ?? false);
  const [tHr100, setTHr100] = useState(editingRecord?.timiDetails?.hrGreaterThan100 ?? false);
  const [tKillip, setTKillip] = useState(editingRecord?.timiDetails?.killipClass2To4 ?? false);
  const [tAntMI, setTAntMI] = useState(editingRecord?.timiDetails?.anteriorMI_LBBB ?? false);
  const [tWeight67, setTWeight67] = useState(editingRecord?.timiDetails?.weightLessThan67 ?? false);
  const [tReperfusion4h, setTReperfusion4h] = useState(editingRecord?.timiDetails?.timeToReperfusionGreaterThan4h ?? false);

  // Anticoagulants
  const [heparin, setHeparin] = useState(editingRecord?.heparinStrategy ?? 'None');
  const [gp2b3a, setGp2b3a] = useState(editingRecord?.gp2b3a ?? 'No');
  const [bivalirudin, setBivalirudin] = useState(editingRecord?.bivalirudin ?? 'No');

  // Other Risk Factors
  const [rfLvf, setRfLvf] = useState(editingRecord?.otherRiskFactors?.lvf ?? false);
  const [rfVtvf, setRfVtvf] = useState(editingRecord?.otherRiskFactors?.vt_vf ?? false);
  const [rfBbb, setRfBbb] = useState(editingRecord?.otherRiskFactors?.bbb_chb ?? false);
  const [rfBnpe, setRfBnpe] = useState(editingRecord?.otherRiskFactors?.elevatedBNP ?? false);
  const [rfCrpe, setRfCrpe] = useState(editingRecord?.otherRiskFactors?.elevatedCRP ?? false);

  // Strategy
  const [strategy, setStrategy] = useState(editingRecord?.treatmentStrategy ?? 'Conservative');

  // PAMI Details
  const [pamiD2b, setPamiD2b] = useState(editingRecord?.pamiDetails?.doorToBalloonTime ?? 0);
  const [pamiSegment, setPamiSegment] = useState(editingRecord?.pamiDetails?.segment ?? '');
  const [pamiStent, setPamiStent] = useState(editingRecord?.pamiDetails?.stentType ?? 'None');
  const [pamiDia, setPamiDia] = useState(editingRecord?.pamiDetails?.stentDiameter ?? 0);
  const [pamiLen, setPamiLen] = useState(editingRecord?.pamiDetails?.stentLength ?? 0);
  const [pamiThrombosuction, setPamiThrombosuction] = useState(editingRecord?.pamiDetails?.thrombosuction ?? 'Not done');
  const [pamiSuccess, setPamiSuccess] = useState(editingRecord?.pamiDetails?.proceduralSuccess ?? 'Yes');
  const [pamiTimi, setPamiTimi] = useState(editingRecord?.pamiDetails?.postProcedureTIMIFlow ?? '3');
  const [pamiVessels, setPamiVessels] = useState(editingRecord?.pamiDetails?.vessels ?? []);

  // Thrombolysis Details
  const [tbD2n, setTbD2n] = useState(editingRecord?.thrombolysisDetails?.doorToNeedleTime ?? 0);
  const [tbDrug, setTbDrug] = useState(editingRecord?.thrombolysisDetails?.drug ?? 'None');
  const [tbDose, setTbDose] = useState(editingRecord?.thrombolysisDetails?.dose ?? '');

  // Timi calculated score
  const timiScore = useMemo(() => {
    return calculateSTEMITimi({
      age75OrOver: tAge75,
      age65To74: tAge65_74,
      historyDM_HTN_Angina: tHistory,
      sbpLessThan100: tSbp100,
      hrGreaterThan100: tHr100,
      killipClass2To4: tKillip,
      anteriorMI_LBBB: tAntMI,
      weightLessThan67: tWeight67,
      timeToReperfusionGreaterThan4h: tReperfusion4h
    });
  }, [tAge75, tAge65_74, tHistory, tSbp100, tHr100, tKillip, tAntMI, tWeight67, tReperfusion4h]);

  // Completion calculation
  const completionPercent = useMemo(() => {
    let filled = 0;
    const total = 5;
    if (eventDate) filled++;
    if (acsNo) filled++;
    if (hr) filled++;
    if (sbp) filled++;
    if (strategy) filled++;
    return Math.round((filled / total) * 100);
  }, [eventDate, acsNo, hr, sbp, strategy]);

  useEffect(() => {
    onCompletionChange?.(completionPercent);
  }, [completionPercent, onCompletionChange]);

  const getSubmissionData = () => ({
    reg_patient_id: patient.id || patient.reg_patient_id || 1,
    acs_no: acsNo,
    ip_no: ipNo,
    admission_date: eventDate,
    discharge_date: dischargeDate,
    primary_consultant: primaryConsultant,

    typical_angina: typical,
    atypical_chest_pain: atypical,
    breathlessness: dysp,
    syncope_presyncope: syncope,
    pulse_rate: hr,
    systolic_bp: sbp,
    diastolic_bp: dbp,

    age_gt_75: tAge75,
    age_65_to_74: tAge65_74,
    history_dm_htn_angina: tHistory,
    sbp_lt_100: tSbp100,
    heart_rate_gt_100: tHr100,
    killip_class_ii_to_iv: tKillip,
    anterior_mi_or_lbbb: tAntMI,
    weight_lt_67kg: tWeight67,
    reperfusion_gt_4hrs: tReperfusion4h,

    lvf: rfLvf,
    vt_vf: rfVtvf,
    bbb_chb: rfBbb,
    elevated_bnp: rfBnpe,
    elevated_crp: rfCrpe,

    treatment_strategy: strategy,
    pami: strategy === 'PAMI',
    door_to_balloon_time: strategy === 'PAMI' ? pamiD2b : null,
    culprit_segment: strategy === 'PAMI' ? pamiSegment : '',
    stent_type: strategy === 'PAMI' ? pamiStent : 'None',
    stent_diameter: strategy === 'PAMI' ? pamiDia : null,
    stent_length: strategy === 'PAMI' ? pamiLen : null,
    thrombosuction: strategy === 'PAMI' ? pamiThrombosuction : 'Not done',
    procedural_success: strategy === 'PAMI' ? pamiSuccess : 'Yes',
    post_procedure_timi_flow: strategy === 'PAMI' ? pamiTimi : '3',

    thrombolysis: strategy === 'Thrombolysis',
    door_to_needle_time: strategy === 'Thrombolysis' ? tbD2n : null,
    thrombolytic_drug: strategy === 'Thrombolysis' ? tbDrug : 'None',
    thrombolytic_dose: strategy === 'Thrombolysis' ? tbDose : '',

    conservative: strategy === 'Conservative',
    heparin_strategy: heparin,
    gp2b3a_inhibitor: gp2b3a,
    bivalirudin: bivalirudin,

    timi_total_score: timiScore,
    hypertension: false,
    diabetes: false,
    smoking: false,
    renal_failure: false,
    copd: false,
    cva: false,
    prior_acs: false,
    prior_ptca: false,
    prior_cabg: false,
    other_background: ''
  });

  useImperativeHandle(ref, () => ({
    getSubmissionData,
    validateForm: () => {
      if (eventDate && dischargeDate && new Date(dischargeDate) < new Date(eventDate)) {
        alert('Discharge date cannot be earlier than Admission date.');
        return false;
      }
      return true;
    }
  }));

  return (
    <div className="space-y-6">
      {/* Patient Demographic Information (Read-only) */}
      <SectionCard title="Patient Demographic Information (Read-Only)">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
          <div>
            <label className={LABEL_STYLES}>Patient Name</label>
            <input
              type="text"
              readOnly
              disabled
              value={patient.name || patient.patient_name || '—'}
              className={INPUT_DISABLED_STYLES}
            />
          </div>
          <div>
            <label className={LABEL_STYLES}>Age</label>
            <input
              type="text"
              readOnly
              disabled
              value={patientAge ? `${patientAge} Years` : '—'}
              className={INPUT_DISABLED_STYLES}
            />
          </div>
          <div>
            <label className={LABEL_STYLES}>Gender</label>
            <input
              type="text"
              readOnly
              disabled
              value={patient.gender || '—'}
              className={INPUT_DISABLED_STYLES}
            />
          </div>
          <div>
            <label className={LABEL_STYLES}>MR Number</label>
            <input
              type="text"
              readOnly
              disabled
              value={patient.mrNo || patient.mr_no || '—'}
              className={INPUT_DISABLED_STYLES}
            />
          </div>
          <div>
            <label className={LABEL_STYLES}>Contact Phone</label>
            <input
              type="text"
              readOnly
              disabled
              value={patient.phone || patient.phone_no || '—'}
              className={INPUT_DISABLED_STYLES}
            />
          </div>
          <div>
            <label className={LABEL_STYLES}>Email Address</label>
            <input
              type="text"
              readOnly
              disabled
              value={patient.email || '—'}
              className={INPUT_DISABLED_STYLES}
            />
          </div>
        </div>
      </SectionCard>

      {/* 1. Demographics & Registry Details */}
      <SectionCard title="1. STEMI Registry Header" subtitle="Table: stemi_registry">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
          <div>
            <label className="font-bold text-slate-700 block mb-1">ACS Number</label>
            <input
              type="text"
              readOnly
              disabled
              value={acsNo || 'Auto-generated upon save'}
              className={INPUT_DISABLED_STYLES + " font-mono text-teal-600 bg-teal-50/20"}
            />
          </div>
          <div>
            <label className="font-bold text-slate-700 block mb-1">IP / Admission No.</label>
            <input
              type="text"
              readOnly
              disabled
              value={ipNo || 'Auto-generated upon save'}
              className={INPUT_DISABLED_STYLES + " font-mono text-teal-600 bg-teal-50/20"}
            />
          </div>
          <div>
            <label className="font-bold text-slate-700 block mb-1">Primary Consultant</label>
            <select
              value={primaryConsultant}
              onChange={(e) => setPrimaryConsultant(e.target.value)}
              className="w-full p-2 border border-slate-300 rounded-md bg-white font-medium text-slate-900"
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
              value={eventDate}
              onChange={(e) => {
                const val = e.target.value;
                setEventDate(val);
                if (dischargeDate && val && new Date(dischargeDate) < new Date(val)) {
                  alert('Discharge date cannot be earlier than Admission date.');
                }
              }}
              className="w-full p-2 border border-slate-300 rounded-md font-medium text-slate-900"
            />
          </div>
          <div>
            <label className="font-bold text-slate-700 block mb-1">Discharge Date</label>
            <input
              type="date"
              value={dischargeDate}
              onChange={(e) => {
                const val = e.target.value;
                setDischargeDate(val);
                if (eventDate && val && new Date(val) < new Date(eventDate)) {
                  alert('Discharge date cannot be earlier than Admission date.');
                }
              }}
              className="w-full p-2 border border-slate-300 rounded-md font-medium text-slate-900"
            />
          </div>
        </div>
      </SectionCard>

      {/* Presentation and Vital Signs */}
      <SectionCard title="Clinical Presentation & Vital Signs (On Admission)">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs mb-3">
          <label className="flex items-center gap-2 p-2 bg-white rounded border cursor-pointer">
            <input type="checkbox" checked={typical} onChange={(e) => setTypical(e.target.checked)} />
            <span className="font-semibold text-slate-700">Typical Angina</span>
          </label>
          <label className="flex items-center gap-2 p-2 bg-white rounded border cursor-pointer">
            <input type="checkbox" checked={atypical} onChange={(e) => setAtypical(e.target.checked)} />
            <span className="font-semibold text-slate-700">Atypical Chest Pain</span>
          </label>
          <label className="flex items-center gap-2 p-2 bg-white rounded border cursor-pointer">
            <input type="checkbox" checked={dysp} onChange={(e) => setDysp(e.target.checked)} />
            <span className="font-semibold text-slate-700">Breathlessness</span>
          </label>
          <label className="flex items-center gap-2 p-2 bg-white rounded border cursor-pointer">
            <input type="checkbox" checked={syncope} onChange={(e) => setSyncope(e.target.checked)} />
            <span className="font-semibold text-slate-700">Syncope / Pre-Syncope</span>
          </label>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <NumberInput label="Pulse Rate (bpm)" value={hr} onChange={setHr} required />
          <NumberInput label="Systolic BP (mmHg)" value={sbp} onChange={setSbp} required />
          <NumberInput label="Diastolic BP (mmHg)" value={dbp} onChange={setDbp} required />
        </div>
      </SectionCard>

      {/* TIMI Score points checklist */}
      <SectionCard title={`TIMI Risk Stratification score (STEMI Criteria)`}>
        <div className="flex justify-between items-center mb-3">
          <span className="text-xs text-slate-500 font-medium">Select all applying criteria below:</span>
          <div className="px-3 py-1 bg-blue-600 text-white rounded text-xs font-black font-mono">
            Calculated Score: {timiScore} Points
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs text-slate-600">
          <label className="flex items-center gap-2 p-2 bg-white rounded border cursor-pointer">
            <input type="checkbox" checked={tAge75} onChange={(e) => setTAge75(e.target.checked)} />
            <span>Age &gt;= 75 yrs (+3 pts)</span>
          </label>
          <label className="flex items-center gap-2 p-2 bg-white rounded border cursor-pointer">
            <input type="checkbox" checked={tAge65_74} onChange={(e) => setTAge65_74(e.target.checked)} />
            <span>Age 65 to 74 (+2 pts)</span>
          </label>
          <label className="flex items-center gap-2 p-2 bg-white rounded border cursor-pointer">
            <input type="checkbox" checked={tHistory} onChange={(e) => setTHistory(e.target.checked)} />
            <span>H/o DM / HTN / Angina (+1 pt)</span>
          </label>
          <label className="flex items-center gap-2 p-2 bg-white rounded border cursor-pointer">
            <input type="checkbox" checked={tSbp100} onChange={(e) => setTSbp100(e.target.checked)} />
            <span>SBP &lt; 100 mmHg (+3 pts)</span>
          </label>
          <label className="flex items-center gap-2 p-2 bg-white rounded border cursor-pointer">
            <input type="checkbox" checked={tHr100} onChange={(e) => setTHr100(e.target.checked)} />
            <span>Heart Rate &gt; 100/min (+2 pts)</span>
          </label>
          <label className="flex items-center gap-2 p-2 bg-white rounded border cursor-pointer">
            <input type="checkbox" checked={tKillip} onChange={(e) => setTKillip(e.target.checked)} />
            <span>Killip Class II to IV (+2 pts)</span>
          </label>
          <label className="flex items-center gap-2 p-2 bg-white rounded border cursor-pointer">
            <input type="checkbox" checked={tAntMI} onChange={(e) => setTAntMI(e.target.checked)} />
            <span>Ant MI / LBBB (+1 pt)</span>
          </label>
          <label className="flex items-center gap-2 p-2 bg-white rounded border cursor-pointer">
            <input type="checkbox" checked={tWeight67} onChange={(e) => setTWeight67(e.target.checked)} />
            <span>Weight &lt; 67 kg (+1 pt)</span>
          </label>
          <label className="flex items-center gap-2 p-2 bg-white rounded border cursor-pointer">
            <input type="checkbox" checked={tReperfusion4h} onChange={(e) => setTReperfusion4h(e.target.checked)} />
            <span>Reperfusion &gt; 4 hrs (+1 pt)</span>
          </label>
        </div>
      </SectionCard>

      {/* Anticoagulants and stay details */}
      <SectionCard title="Anticoagulant Therapy & stay risk factors">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Select
            label="Heparin Strategy"
            value={heparin}
            onChange={setHeparin}
            options={[
              'None',
              'UFH i.v alone',
              'UFH s.c alone',
              'LMWH alone',
              'UFH i.v+UFHs.c',
              'UFH i.v + LMWH'
            ]}
            required
          />
          <Select
            label="GP IIb/IIIa Inhibitor"
            value={gp2b3a}
            onChange={setGp2b3a}
            options={['No', 'Yes']}
            required
          />
          <Select
            label="Bivalirudin"
            value={bivalirudin}
            onChange={setBivalirudin}
            options={['No', 'Yes']}
            required
          />
        </div>

        <div className="border-t border-slate-200 pt-3">
          <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider block mb-2">Other Stay Complications / Risk factors</span>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-xs">
            <label className="flex items-center gap-2 p-2 bg-white rounded border cursor-pointer">
              <input type="checkbox" checked={rfLvf} onChange={(e) => setRfLvf(e.target.checked)} />
              <span>Left Ventricular Failure (LVF)</span>
            </label>
            <label className="flex items-center gap-2 p-2 bg-white rounded border cursor-pointer">
              <input type="checkbox" checked={rfVtvf} onChange={(e) => setRfVtvf(e.target.checked)} />
              <span>VT/VF during stay</span>
            </label>
            <label className="flex items-center gap-2 p-2 bg-white rounded border cursor-pointer">
              <input type="checkbox" checked={rfBbb} onChange={(e) => setRfBbb(e.target.checked)} />
              <span>BBB / CHB</span>
            </label>
            <label className="flex items-center gap-2 p-2 bg-white rounded border cursor-pointer">
              <input type="checkbox" checked={rfBnpe} onChange={(e) => setRfBnpe(e.target.checked)} />
              <span>Elevated BNP</span>
            </label>
            <label className="flex items-center gap-2 p-2 bg-white rounded border cursor-pointer">
              <input type="checkbox" checked={rfCrpe} onChange={(e) => setRfCrpe(e.target.checked)} />
              <span>Elevated CRP</span>
            </label>
          </div>
        </div>
      </SectionCard>

      {/* Treatment Strategy and conditionals */}
      <div className="space-y-4">
        <Select
          id="acs-strategy"
          label="Reperfusion Strategy / Treatment Strategy"
          value={strategy}
          onChange={setStrategy}
          options={[
            { value: 'Conservative', label: 'Conservative Medical Management' },
            { value: 'PAMI', label: 'PAMI (Primary Angioplasty / PTCA)' },
            { value: 'Thrombolysis', label: 'Thrombolysis' }
          ]}
          required
        />

        {/* Conditional Primary Angioplasty (PAMI) Segment */}
        {strategy === 'PAMI' && (
          <div className="p-4 bg-teal-50/50 border border-teal-100 rounded-xl space-y-4 animate-fadeIn">
            <h5 className="text-xs font-bold text-teal-800 uppercase tracking-wider">Primary PCI (PAMI) Details</h5>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <NumberInput id="pami-d2b" label="Door to Balloon Time (mins)" value={pamiD2b} onChange={setPamiD2b} required />
              <TextInput id="pami-segment" label="Vessel Dilated Segment" value={pamiSegment} onChange={setPamiSegment} placeholder="E.g. Proximal LAD" />
              <Select
                id="pami-stent"
                label="Stent Implantation"
                value={pamiStent}
                onChange={setPamiStent}
                options={[
                  { value: 'None', label: 'None (Balloon Only)' },
                  { value: 'DES', label: 'DES (Drug-Eluting Stent)' },
                  { value: 'BMS', label: 'BMS (Bare Metal Stent)' }
                ]}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <NumberInput label="Stent Diameter (mm)" step={0.1} value={pamiDia} onChange={setPamiDia} placeholder="E.g. 3.0" />
              <NumberInput label="Stent Length (mm)" value={pamiLen} onChange={setPamiLen} placeholder="E.g. 18" />
              <Select
                label="Thrombosuction Performed?"
                value={pamiThrombosuction}
                onChange={setPamiThrombosuction}
                options={['Not done', 'Done']}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Select
                label="Procedural Success"
                value={pamiSuccess}
                onChange={setPamiSuccess}
                options={['Yes', 'No']}
              />
              <Select
                label="Post Procedure TIMI Flow"
                value={pamiTimi}
                onChange={setPamiTimi}
                options={[
                  { value: '0', label: 'TIMI 0' },
                  { value: '1', label: 'TIMI 1' },
                  { value: '2', label: 'TIMI 2' },
                  { value: '3', label: 'TIMI 3' }
                ]}
              />
            </div>

            <div className="space-y-1.5">
              <span className="text-xs font-bold text-slate-700 block">Vessel(s) Treated</span>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs">
                {['LMCA', 'LAD', 'LCX', 'RCA', 'Graft'].map((vessel) => (
                  <label key={vessel} className="flex items-center gap-2 p-2 bg-white rounded border cursor-pointer">
                    <input
                      type="checkbox"
                      checked={pamiVessels.includes(vessel)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setPamiVessels([...pamiVessels, vessel]);
                        } else {
                          setPamiVessels(pamiVessels.filter((x) => x !== vessel));
                        }
                      }}
                    />
                    <span>{vessel}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Conditional Thrombolysis Segment */}
        {strategy === 'Thrombolysis' && (
          <div className="p-4 bg-red-50/50 border border-red-100 rounded-xl space-y-4 animate-fadeIn">
            <h5 className="text-xs font-bold text-red-800 uppercase tracking-wider">Thrombolysis Details</h5>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <NumberInput id="tb-d2n" label="Door to Needle Time (mins)" value={tbD2n} onChange={setTbD2n} required />
              <Select
                id="tb-drug"
                label="Thrombolytic Drug"
                value={tbDrug}
                onChange={setTbDrug}
                options={[
                  { value: 'None', label: 'Select Drug...' },
                  { value: 'STK', label: 'STK (Streptokinase)' },
                  { value: 'UK', label: 'UK (Urokinase)' },
                  { value: 'Reteplase', label: 'Reteplase' },
                  { value: 'Tenecteplase', label: 'Tenecteplase' }
                ]}
                required
              />
              <TextInput id="tb-dose" label="Dose Administered" value={tbDose} onChange={setTbDose} placeholder="E.g. 1.5 Million Units" />
            </div>
          </div>
        )}
      </div>
    </div>
  );
});

export default STEMIForm;
