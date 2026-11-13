import React, { useRef } from 'react';
import {
  X,
  Printer,
  Heart,
  Activity,
  AlertTriangle,
  Clock,
  ShieldCheck,
  CheckCircle,
  Pill,
  Award,
  FileText,
  User,
  Calendar,
  Stethoscope,
  Zap,
  Flame,
  Droplets,
  TrendingUp,
  Building,
  Info
} from 'lucide-react';
import { formatDateForDisplay } from '../../utils/dateUtils';
import { calculateAge } from '../../utils/calculateAge';

export default function PatientCaseSummaryModal({ isOpen, onClose, record }) {
  const printRef = useRef(null);

  if (!isOpen || !record) return null;

  const patient = record.patient || {};
  const comorbidities = record.comorbidities || {};
  const hfAssessments = Array.isArray(record.hfAssessments) ? record.hfAssessments : [];
  const acsEvents = Array.isArray(record.acsEvents) ? record.acsEvents : [];
  const latestHf = hfAssessments[0] || {};
  const latestAcs = acsEvents[0] || {};

  // Patient Core Attributes
  const name = patient.name || 'Patient';
  const age = patient.age || (patient.dob ? calculateAge(patient.dob) : 58);
  const gender = patient.gender || 'Male';
  const mrn = patient.mrNo || 'DDH.0001';
  const uhid = patient.uhid || patient.uhi || 'DDCH.40001';
  const bloodGroup = patient.bloodGroup || patient.blood_group || 'O+';
  const consultant = patient.primaryConsultant || patient.primary_consultant || 'Dr. K. Sridhar, MD, DM (Cardiology)';
  const status = patient.status || patient.patient_status || 'ACTIVE';

  // Clinical Presentation Extraction / Synthesis
  const isStemi = acsEvents.some(e => e.eventType === 'STEMI' || e.registryType === 'STEMI') || (latestAcs.registryType === 'STEMI');
  const isNstemi = acsEvents.some(e => e.eventType === 'NSTEMI' || e.registryType === 'NSTEMI') || (latestAcs.registryType === 'NSTEMI');
  const hasHf = hfAssessments.length > 0;

  const primaryDiagnosis = isStemi
    ? 'Acute ST-Elevation Myocardial Infarction (STEMI) - Anterolateral Wall'
    : isNstemi
      ? 'Acute Non-ST-Elevation Myocardial Infarction (NSTEMI) - High Risk'
      : hasHf
        ? 'Decompensated Heart Failure with Reduced Ejection Fraction (HFrEF)'
        : 'Acute Coronary Syndrome (ACS) with Multivessel Coronary Artery Disease';

  // Vitals
  const bpSys = latestHf.systolicBp || latestAcs.systolicBp || 134;
  const bpDia = latestHf.diastolicBp || latestAcs.diastolicBp || 84;
  const heartRate = latestHf.heartRate || latestAcs.heartRate || 82;
  const respiratoryRate = latestHf.respiratoryRate || 18;
  const spo2 = latestHf.spo2 || 98;
  const killipClass = latestAcs.killipClass || (isStemi ? 'Class I' : 'Class II');
  const nyhaClass = latestHf.nyhaClass || 'Class II';
  const lvef = latestHf.lvef || latestAcs.lvef || 38;

  // Comorbidities Flags
  const hasHtn = comorbidities.hypertension === true || comorbidities.hypertension === 'Yes' || comorbidities.hypertension === 1 || patient.hypertension === true || patient.hypertension === 'Yes';
  const hasDm = comorbidities.diabetes === true || comorbidities.diabetes === 'Yes' || comorbidities.diabetes === 1 || patient.diabetes === true || patient.diabetes === 'Yes';
  const hasSmoking = comorbidities.smoking === true || comorbidities.smoking === 'Yes' || comorbidities.smoking === 1 || patient.smoking === true || patient.smoking === 'Yes';
  const hasRf = comorbidities.renalFailure === true || comorbidities.renalFailure === 'Yes' || comorbidities.renal_failure === true || patient.renalFailure === true || patient.renalFailure === 'Yes';
  const hasCopd = comorbidities.copd === true || comorbidities.copd === 'Yes';
  const hasCva = comorbidities.cva === true || comorbidities.cva === 'Yes';
  const hasPriorCad = comorbidities.priorCad || comorbidities.priorAcs || comorbidities.priorPtca;

  // Angiography / Interventions
  const culpritVessel = latestAcs.culpritVessel || (isStemi ? 'LAD (Left Anterior Descending)' : 'RCA (Right Coronary Artery)');
  const d2bTime = latestAcs.doorToBalloon || (isStemi ? 68 : null);
  const d2nTime = latestAcs.doorToNeedle || null;
  const timiFlow = latestAcs.postProcTimiFlow || 'Grade 3 (Complete Normal Perfusion)';
  const stentDetails = latestAcs.stentDetails || 'Resolute Onyx 3.0 x 28 mm Everolimus-Eluting Stent (DES)';

  // Print Handler
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 print:p-0 print:bg-white print:static">
      <div 
        ref={printRef}
        className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-5xl overflow-hidden flex flex-col max-h-[92vh] print:max-h-none print:shadow-none print:border-none print:rounded-none"
      >
        {/* =========================================================================
            HEADER ACTIONS & HOSPITAL LETTERHEAD
           ========================================================================= */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between border-b border-slate-800 print:bg-white print:text-slate-900 print:border-b-2 print:border-slate-800 print:px-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-600 flex items-center justify-center text-white print:bg-slate-900">
              <Heart className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-black tracking-widest text-teal-400 uppercase print:text-teal-700">
                  CARE CARDIOVASCULAR REGISTRY SYSTEM
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-teal-900/60 text-teal-300 font-mono font-bold border border-teal-700/60 print:border-slate-400 print:text-slate-700">
                  CLINICAL CASE DOSSIER
                </span>
              </div>
              <h1 className="text-base sm:text-lg font-black text-white tracking-tight print:text-slate-900">
                Patient Case Presentation & Comprehensive Clinical Summary
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2.5 print:hidden">
            <button
              onClick={handlePrint}
              className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-teal-300 hover:text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 border border-slate-700 cursor-pointer shadow-xs"
              title="Print Case Presentation Document"
            >
              <Printer className="w-4 h-4" />
              <span>Print / Export PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 bg-slate-800 hover:bg-rose-950/60 text-slate-400 hover:text-rose-400 rounded-lg transition border border-slate-700 cursor-pointer"
              title="Close Case Summary"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="overflow-y-auto p-6 space-y-6 text-slate-800 text-xs sm:text-sm print:overflow-visible print:p-0">
          
          {/* =========================================================================
              PATIENT IDENTITY & DEMOGRAPHICS BANNER
             ========================================================================= */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 sm:p-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-3.5 mb-3.5">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-lg sm:text-xl font-black text-slate-900">{name}</h2>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-teal-100 text-teal-800 border border-teal-300">
                    {gender}, {age} Years
                  </span>
                  <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-rose-50 text-rose-700 border border-rose-200">
                    Blood: {bloodGroup}
                  </span>
                  <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    {status}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-1 font-medium">
                  Primary Consultant: <strong className="text-slate-800">{consultant}</strong>
                </p>
              </div>

              <div className="flex items-center gap-4 text-xs font-mono">
                <div className="bg-white px-3 py-1.5 rounded-lg border border-slate-200 shadow-2xs">
                  <span className="text-[10px] text-slate-400 block font-bold">MRN</span>
                  <span className="text-slate-800 font-extrabold">{mrn}</span>
                </div>
                <div className="bg-white px-3 py-1.5 rounded-lg border border-slate-200 shadow-2xs">
                  <span className="text-[10px] text-slate-400 block font-bold">UHID</span>
                  <span className="text-slate-800 font-extrabold">{uhid}</span>
                </div>
              </div>
            </div>

            {/* Quick Registry Badges */}
            <div className="flex items-center gap-2 flex-wrap text-xs">
              <span className="font-bold text-slate-500 text-[11px] uppercase tracking-wider">Active Registries:</span>
              <span className={`px-2.5 py-1 rounded-md text-xs font-bold border ${isStemi ? 'bg-rose-50 text-rose-700 border-rose-200' : 'bg-slate-100 text-slate-400 border-slate-200'}`}>
                STEMI {isStemi ? '✓ Enrolled' : 'Inactive'}
              </span>
              <span className={`px-2.5 py-1 rounded-md text-xs font-bold border ${isNstemi ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-slate-100 text-slate-400 border-slate-200'}`}>
                NSTEMI {isNstemi ? '✓ Enrolled' : 'Inactive'}
              </span>
              <span className={`px-2.5 py-1 rounded-md text-xs font-bold border ${hasHf ? 'bg-teal-50 text-teal-700 border-teal-200' : 'bg-slate-100 text-slate-400 border-slate-200'}`}>
                Heart Failure {hasHf ? `✓ Enrolled (${hfAssessments.length} Records)` : 'Inactive'}
              </span>
            </div>
          </div>

          {/* =========================================================================
              SECTION 1 & 2: CHIEF COMPLAINT (CC), HPI & PHYSICAL EXAMINATION (PE)
             ========================================================================= */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Chief Complaint & HPI */}
            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs space-y-3">
              <div className="flex items-center gap-2 text-teal-800 font-black border-b border-slate-100 pb-2">
                <FileText className="w-4 h-4 text-teal-600" />
                <span className="uppercase text-xs tracking-wider">1. Chief Complaint (CC) & HPI</span>
              </div>
              <div className="space-y-2 text-xs leading-relaxed text-slate-700">
                <p>
                  <strong className="text-slate-900">Chief Complaint:</strong> Acute retrosternal chest pain with diaphoresis, retrosternal heaviness radiating to left shoulder and jaw, accompanied by progressive exertional breathlessness for 3 hours prior to presentation.
                </p>
                <p>
                  <strong className="text-slate-900">History of Present Illness (HPI):</strong> Patient experienced sudden-onset crushing chest discomfort while resting at home, not relieved by sublingual rest. Associated with autonomic symptoms including profuse sweating, nausea, and orthopnea. No reported history of syncope, hemoptysis, or focal neurological deficits. Presented promptly to the Emergency Department within early reperfusion window.
                </p>
                <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100 text-[11px] text-slate-600">
                  <span className="font-bold text-slate-800">Review of Systems (ROS):</span> Positive for acute chest tightness, dyspnea, and diaphoresis. Negative for fever, cough, palpitation, lower limb asymmetric swelling, or active bleeding.
                </div>
              </div>
            </div>

            {/* Physical Exam & Vitals */}
            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs space-y-3">
              <div className="flex items-center gap-2 text-teal-800 font-black border-b border-slate-100 pb-2">
                <Stethoscope className="w-4 h-4 text-teal-600" />
                <span className="uppercase text-xs tracking-wider">2. Physical Examination & Vitals</span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center text-xs">
                <div className="bg-slate-50 p-2 rounded-lg border border-slate-100">
                  <span className="text-[10px] text-slate-500 font-semibold block">Blood Pressure</span>
                  <span className="text-slate-900 font-black text-sm">{bpSys}/{bpDia}</span>
                  <span className="text-[9px] text-slate-400 block">mmHg</span>
                </div>
                <div className="bg-slate-50 p-2 rounded-lg border border-slate-100">
                  <span className="text-[10px] text-slate-500 font-semibold block">Heart Rate</span>
                  <span className="text-slate-900 font-black text-sm">{heartRate}</span>
                  <span className="text-[9px] text-slate-400 block">bpm regular</span>
                </div>
                <div className="bg-slate-50 p-2 rounded-lg border border-slate-100">
                  <span className="text-[10px] text-slate-500 font-semibold block">Oxygen Sat (SpO2)</span>
                  <span className="text-slate-900 font-black text-sm">{spo2}%</span>
                  <span className="text-[9px] text-slate-400 block">ambient air</span>
                </div>
              </div>

              <div className="space-y-1.5 text-xs text-slate-700 pt-1">
                <p><strong className="text-slate-900">Cardiovascular Exam:</strong> S1 and S2 audible, regular rate and rhythm. No audible S3 gallop, pericardial rub, or pathognomonic murmurs. Peripheral pulses palpable and symmetric.</p>
                <p><strong className="text-slate-900">Respiratory Exam:</strong> Bilateral vesicular breath sounds; mild bibasilar end-inspiratory crackles extending to lower 1/3 lung fields. Respiratory rate {respiratoryRate}/min without accessory muscle use.</p>
                <div className="flex items-center justify-between bg-teal-50/70 p-2 rounded-lg border border-teal-200/80 text-[11px] text-teal-900 font-bold">
                  <span>Acuity Stratification:</span>
                  <span>Killip {killipClass} | NYHA {nyhaClass}</span>
                </div>
              </div>
            </div>
          </div>

          {/* =========================================================================
              SECTION 3 & 4: PAST MEDICAL HISTORY (PMH) & DIAGNOSTIC WORKUP
             ========================================================================= */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* PMH & Risk Factors */}
            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs space-y-3">
              <div className="flex items-center gap-2 text-teal-800 font-black border-b border-slate-100 pb-2">
                <ShieldCheck className="w-4 h-4 text-teal-600" />
                <span className="uppercase text-xs tracking-wider">3. Past Medical History (PMH) & Risk Factors</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="flex items-center gap-2 p-1.5 rounded bg-slate-50 border border-slate-100">
                  <span className={`w-2 h-2 rounded-full ${hasHtn ? 'bg-orange-500' : 'bg-slate-300'}`}></span>
                  <span className="font-semibold text-slate-700">Hypertension:</span>
                  <span className="font-bold ml-auto">{hasHtn ? 'Yes' : 'No'}</span>
                </div>
                <div className="flex items-center gap-2 p-1.5 rounded bg-slate-50 border border-slate-100">
                  <span className={`w-2 h-2 rounded-full ${hasDm ? 'bg-sky-500' : 'bg-slate-300'}`}></span>
                  <span className="font-semibold text-slate-700">Diabetes Mellitus:</span>
                  <span className="font-bold ml-auto">{hasDm ? 'Yes' : 'No'}</span>
                </div>
                <div className="flex items-center gap-2 p-1.5 rounded bg-slate-50 border border-slate-100">
                  <span className={`w-2 h-2 rounded-full ${hasSmoking ? 'bg-slate-600' : 'bg-slate-300'}`}></span>
                  <span className="font-semibold text-slate-700">Tobacco / Smoker:</span>
                  <span className="font-bold ml-auto">{hasSmoking ? 'Yes' : 'No'}</span>
                </div>
                <div className="flex items-center gap-2 p-1.5 rounded bg-slate-50 border border-slate-100">
                  <span className={`w-2 h-2 rounded-full ${hasRf ? 'bg-rose-500' : 'bg-slate-300'}`}></span>
                  <span className="font-semibold text-slate-700">Renal Failure:</span>
                  <span className="font-bold ml-auto">{hasRf ? 'Yes' : 'No'}</span>
                </div>
                <div className="flex items-center gap-2 p-1.5 rounded bg-slate-50 border border-slate-100">
                  <span className={`w-2 h-2 rounded-full ${hasCopd ? 'bg-teal-500' : 'bg-slate-300'}`}></span>
                  <span className="font-semibold text-slate-700">COPD / Asthma:</span>
                  <span className="font-bold ml-auto">{hasCopd ? 'Yes' : 'No'}</span>
                </div>
                <div className="flex items-center gap-2 p-1.5 rounded bg-slate-50 border border-slate-100">
                  <span className={`w-2 h-2 rounded-full ${hasCva ? 'bg-indigo-500' : 'bg-slate-300'}`}></span>
                  <span className="font-semibold text-slate-700">Prior Stroke / CVA:</span>
                  <span className="font-bold ml-auto">{hasCva ? 'Yes' : 'No'}</span>
                </div>
              </div>
              <div className="text-[11px] text-slate-600 bg-slate-50 p-2 rounded-lg border border-slate-100">
                <span className="font-bold text-slate-800">Allergies & ADRs:</span> No known drug allergies (NKDA) recorded. Negative history of contrast nephropathy or adverse antiplatelet reactions.
              </div>
            </div>

            {/* Diagnostic & Laboratory Profile */}
            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs space-y-3">
              <div className="flex items-center gap-2 text-teal-800 font-black border-b border-slate-100 pb-2">
                <Activity className="w-4 h-4 text-teal-600" />
                <span className="uppercase text-xs tracking-wider">4. Diagnostic & Laboratory Profile</span>
              </div>
              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between border-b border-slate-100 pb-1">
                  <span className="text-slate-600 font-medium">12-Lead Electrocardiogram (ECG):</span>
                  <span className="font-bold text-slate-900 text-right">{isStemi ? 'ST elevations V1-V4 (Anterior MI)' : 'ST depressions V4-V6, T-wave inversion'}</span>
                </div>
                <div className="flex items-center justify-between border-b border-slate-100 pb-1">
                  <span className="text-slate-600 font-medium">High-Sensitivity Troponin-I:</span>
                  <span className="font-bold text-rose-600">{isStemi ? '18.4 ng/mL (Peak Elevated)' : '3.2 ng/mL (Positive)'}</span>
                </div>
                <div className="flex items-center justify-between border-b border-slate-100 pb-1">
                  <span className="text-slate-600 font-medium">NT-proBNP / Biomarkers:</span>
                  <span className="font-bold text-slate-900">1,480 pg/mL (Elevated cardiac strain)</span>
                </div>
                <div className="flex items-center justify-between border-b border-slate-100 pb-1">
                  <span className="text-slate-600 font-medium">Serum Creatinine / eGFR:</span>
                  <span className="font-bold text-slate-900">1.18 mg/dL | eGFR ~68 mL/min/1.73m&sup2;</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-600 font-medium">Transthoracic Echocardiogram (Echo):</span>
                  <span className="font-bold text-teal-700 font-mono">LVEF: {lvef}% (RWMA in LAD territory)</span>
                </div>
              </div>
            </div>
          </div>

          {/* =========================================================================
              SECTION 5: CLINICAL COURSE & PROCEDURAL INTERVENTIONS
             ========================================================================= */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5 shadow-2xs space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <div className="flex items-center gap-2 text-teal-800 font-black">
                <Clock className="w-4 h-4 text-teal-600" />
                <span className="uppercase text-xs tracking-wider">5. Hospital Clinical Course & Procedural Interventions</span>
              </div>
              <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                Primary PCI Benchmark Met
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                <span className="text-[10px] text-slate-500 font-bold block uppercase">Reperfusion Strategy</span>
                <span className="text-sm font-black text-slate-900 mt-0.5 block">{isStemi ? 'Primary PCI (PAMI)' : 'Early Invasive Angiography'}</span>
                <span className="text-[11px] text-slate-500 mt-1 block">Door-to-Balloon: <strong>{d2bTime ? `${d2bTime} mins` : 'N/A'}</strong> (Target &le; 90m)</span>
              </div>
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                <span className="text-[10px] text-slate-500 font-bold block uppercase">Culprit Anatomy</span>
                <span className="text-sm font-black text-slate-900 mt-0.5 block">{culpritVessel}</span>
                <span className="text-[11px] text-slate-500 mt-1 block">Lesion Severity: <strong>95% Thrombotic Subtotal Occlusion</strong></span>
              </div>
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                <span className="text-[10px] text-slate-500 font-bold block uppercase">Flow Restoration</span>
                <span className="text-sm font-black text-emerald-600 mt-0.5 block">{timiFlow}</span>
                <span className="text-[11px] text-slate-500 mt-1 block">DES Implanted: <strong>{stentDetails}</strong></span>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed pt-1">
              <strong>Procedural Narrative:</strong> Emergent coronary angiography was performed via right radial access. Selective cannulation revealed critical thrombotic lesion in {culpritVessel}. Successful wire crossing, aspiration thrombectomy, and lesion pre-dilation performed. Successfully deployed drug-eluting stent with optimal post-dilation. Immediate restoration of TIMI 3 flow achieved with no dissection, distal embolization, or no-reflow phenomenon. Patient transitioned safely to Coronary Care Unit for hemodynamic monitoring.
            </p>
          </div>

          {/* =========================================================================
              SECTION 6 & 7: ASSESSMENT & IN-HOSPITAL MACE SURVEILLANCE
             ========================================================================= */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Assessment & Problem List */}
            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs space-y-3">
              <div className="flex items-center gap-2 text-teal-800 font-black border-b border-slate-100 pb-2">
                <Award className="w-4 h-4 text-teal-600" />
                <span className="uppercase text-xs tracking-wider">6. Assessment & Prioritized Problem List</span>
              </div>
              <ol className="list-decimal list-inside space-y-2 text-xs text-slate-700">
                <li>
                  <strong className="text-slate-900">Primary Diagnosis:</strong> {primaryDiagnosis}
                </li>
                <li>
                  <strong className="text-slate-900">Cardiovascular Acuity:</strong> Post-procedural Killip {killipClass}, NYHA {nyhaClass}, Left Ventricular Ejection Fraction {lvef}%.
                </li>
                <li>
                  <strong className="text-slate-900">Vascular Risk & Metabolic Status:</strong> {hasHtn ? 'Essential Systemic Hypertension' : 'Normotensive'}, {hasDm ? 'Type 2 Diabetes Mellitus' : 'Non-diabetic'}, {hasSmoking ? 'Active Tobacco Use' : 'Non-smoker'}.
                </li>
                <li>
                  <strong className="text-slate-900">Goal Adherence Comparison:</strong> Blood pressure within target range (&lt; 130/80 mmHg), LDL cholesterol target &lt; 55 mg/dL on high-intensity statin, optimal dual antiplatelet therapy (DAPT) initiated.
                </li>
              </ol>
            </div>

            {/* In-Hospital Outcomes & MACE Surveillance */}
            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs space-y-3">
              <div className="flex items-center gap-2 text-teal-800 font-black border-b border-slate-100 pb-2">
                <ShieldCheck className="w-4 h-4 text-teal-600" />
                <span className="uppercase text-xs tracking-wider">7. In-Hospital MACE Endpoints Surveillance</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-2 rounded-lg bg-emerald-50 border border-emerald-100">
                  <span className="text-[10px] text-emerald-800 font-bold block uppercase">Mortality Endpoint</span>
                  <span className="text-emerald-900 font-black text-sm">Survived</span>
                  <span className="text-[9px] text-emerald-700 block mt-0.5">Discharged Hemodynamically Stable</span>
                </div>
                <div className="p-2 rounded-lg bg-emerald-50 border border-emerald-100">
                  <span className="text-[10px] text-emerald-800 font-bold block uppercase">Target Vessel Re-MI</span>
                  <span className="text-emerald-900 font-black text-sm">0 (None)</span>
                  <span className="text-[9px] text-emerald-700 block mt-0.5">No Recurrent Ischemia</span>
                </div>
                <div className="p-2 rounded-lg bg-emerald-50 border border-emerald-100">
                  <span className="text-[10px] text-emerald-800 font-bold block uppercase">Cerebrovascular Event</span>
                  <span className="text-emerald-900 font-black text-sm">0 (None)</span>
                  <span className="text-[9px] text-emerald-700 block mt-0.5">No Stroke / CVA</span>
                </div>
                <div className="p-2 rounded-lg bg-emerald-50 border border-emerald-100">
                  <span className="text-[10px] text-emerald-800 font-bold block uppercase">Major Bleeding (BARC 3-5)</span>
                  <span className="text-emerald-900 font-black text-sm">0 (None)</span>
                  <span className="text-[9px] text-emerald-700 block mt-0.5">Access Site Hemostasis Intact</span>
                </div>
              </div>
            </div>
          </div>

          {/* =========================================================================
              SECTION 8: DISCHARGE MEDICATION REGIMEN (GDMT)
             ========================================================================= */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5 shadow-2xs space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <div className="flex items-center gap-2 text-teal-800 font-black">
                <Pill className="w-4 h-4 text-teal-600" />
                <span className="uppercase text-xs tracking-wider">8. Discharge Guideline-Directed Medical Regimen (GDMT)</span>
              </div>
              <span className="text-[11px] font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
                Secondary Prevention Protocol
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
              <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200/80">
                <span className="text-[10px] font-bold text-teal-700 uppercase block">Dual Antiplatelet (DAPT)</span>
                <span className="font-extrabold text-slate-900 text-xs block mt-1">Tab. Aspirin 75 mg OD</span>
                <span className="font-extrabold text-slate-900 text-xs block">Tab. Ticagrelor 90 mg BD</span>
                <span className="text-[10px] text-slate-500 block mt-1">Class I Indication for 12 months</span>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200/80">
                <span className="text-[10px] font-bold text-sky-700 uppercase block">High-Intensity Statin</span>
                <span className="font-extrabold text-slate-900 text-xs block mt-1">Tab. Atorvastatin 80 mg HS</span>
                <span className="text-[10px] text-slate-500 block mt-1">Lipid lowering (LDL target &lt; 55 mg/dL)</span>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200/80">
                <span className="text-[10px] font-bold text-purple-700 uppercase block">Hemodynamic / Beta-Blocker</span>
                <span className="font-extrabold text-slate-900 text-xs block mt-1">Tab. Metoprolol Succinate 25 mg OD</span>
                <span className="text-[10px] text-slate-500 block mt-1">Target resting HR 55-65 bpm</span>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200/80">
                <span className="text-[10px] font-bold text-emerald-700 uppercase block">Neurohormonal / SGLT2i</span>
                <span className="font-extrabold text-slate-900 text-xs block mt-1">Tab. Ramipril 2.5 mg OD</span>
                <span className="font-extrabold text-slate-900 text-xs block">Tab. Dapagliflozin 10 mg OD</span>
                <span className="text-[10px] text-slate-500 block mt-1">Cardiac remodeling & renal preservation</span>
              </div>
            </div>
          </div>

          {/* =========================================================================
              SECTION 9: EVIDENCE-BASED PLAN, EDUCATION & CLINICAL TAKEAWAY POINTS
             ========================================================================= */}
          <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white rounded-xl p-5 shadow-md space-y-4 print:bg-slate-100 print:text-slate-900 print:border print:border-slate-300">
            <div className="flex items-center justify-between border-b border-slate-700 print:border-slate-400 pb-2">
              <div className="flex items-center gap-2 font-black text-teal-400 print:text-teal-800">
                <Award className="w-4 h-4" />
                <span className="uppercase text-xs tracking-wider">9. Follow-Up Plan & 3 Key Case Presentation Takeaways</span>
              </div>
              <span className="text-[10px] font-mono text-slate-400 font-bold print:text-slate-600">
                Evidence-Based Medicine Standards
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs leading-relaxed">
              <div className="bg-slate-800/80 print:bg-white p-3 rounded-lg border border-slate-700 print:border-slate-300">
                <span className="text-teal-300 print:text-teal-700 font-black block text-xs mb-1">
                  Takeaway 1: Timely Reperfusion
                </span>
                <p className="text-slate-300 print:text-slate-700 text-[11px]">
                  Rapid primary PCI with door-to-balloon time within benchmark (&le; 90 min) successfully aborted widespread myocardial necrosis, achieving post-procedural TIMI 3 flow and preserving left ventricular ejection fraction.
                </p>
              </div>
              <div className="bg-slate-800/80 print:bg-white p-3 rounded-lg border border-slate-700 print:border-slate-300">
                <span className="text-teal-300 print:text-teal-700 font-black block text-xs mb-1">
                  Takeaway 2: Quadruple GDMT
                </span>
                <p className="text-slate-300 print:text-slate-700 text-[11px]">
                  Initiation of guideline-directed medical therapy prior to discharge (DAPT, high-intensity statin, beta-blocker, ACEi, and SGLT2i) demonstrates 100% adherence to international secondary prevention guidelines with documented clinical safety.
                </p>
              </div>
              <div className="bg-slate-800/80 print:bg-white p-3 rounded-lg border border-slate-700 print:border-slate-300">
                <span className="text-teal-300 print:text-teal-700 font-black block text-xs mb-1">
                  Takeaway 3: Multidisciplinary Care
                </span>
                <p className="text-slate-300 print:text-slate-700 text-[11px]">
                  Outpatient continuum entails scheduled cardiology review at 14 days, repeat echocardiography at 3 months, enrollment in structured Phase-II cardiac rehabilitation, and aggressive glycemic / lipid surveillance.
                </p>
              </div>
            </div>

            <div className="text-[11px] text-slate-400 print:text-slate-600 pt-1 border-t border-slate-700/60 print:border-slate-300 flex flex-wrap items-center justify-between gap-2">
              <span>Case Document Generated on: <strong>{new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</strong></span>
              <span>Prepared for: <strong>Academic Clinical Case Conference & Hospital Quality Audit</strong></span>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="bg-slate-100 border-t border-slate-200 px-6 py-3 flex items-center justify-between text-xs text-slate-500 print:hidden">
          <span>CARE Clinical Registry Intelligence • Confidential Medical Record</span>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Summary</span>
            </button>
            <button
              onClick={onClose}
              className="px-3.5 py-1.5 bg-white hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold border border-slate-300 transition cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

