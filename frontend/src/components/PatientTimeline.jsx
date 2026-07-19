/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */


import { calculateDataQualityScore } from '../data/mockPatients';
import { calculateAge } from '../utils/calculateAge';
import HFHistoryList from './HFHistoryList';
import {
  Plus,
  Calendar,
  Users,
  Activity,
  Heart,
  Award,
  Trash2,
  ShieldAlert,
  ArrowLeft,

  Layers,
  LineChart as LineChartIcon,
  Stethoscope,
  ChevronDown } from
'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer } from
'recharts';
import { useState } from 'react';









export default function PatientTimeline({ record, onBack, onAddEventClick, onViewEventDetails, onDeleteEvent }) {
  const [showAddMenu, setShowAddMenu] = useState(false);

  // 1. Compile all timeline events and sort them chronologically (descending)
  const timelineEvents =








  [];

  // Hospitalizations
  record.hospitalizations.forEach((h) => {
    timelineEvents.push({
      id: h.id,
      date: h.admissionDate,
      type: 'Admission',
      title: 'Hospital Admission',
      summary: `${h.hospitalName} • Reason: ${h.reasonForAdmission} • Stay: ${h.totalHospitalStayDays || 0} days`,
      raw: h,
      color: 'bg-blue-500 border-blue-500 text-blue-500',
      icon: Stethoscope
    });
  });

  // HF Assessments
  record.hfAssessments.forEach((hf) => {
    timelineEvents.push({
      id: hf.id,
      date: hf.assessmentDate,
      type: 'HF Assessment',
      title: 'CARE CHF Assessment',
      summary: `NYHA: ${hf.nyhaClass} • Stage: ${hf.stageOfHF} • EF: ${hf.vitals.bmi ? `BMI ${hf.vitals.bmi.toFixed(1)}` : 'N/A'} • Volume Overload: ${hf.volumeOverloadSigns.peripheralEdema ? 'Yes' : 'No'}`,
      raw: hf,
      color: 'bg-teal-500 border-teal-500 text-teal-500',
      icon: Heart
    });
  });

  // ACS Events (STEMI / NSTEMI)
  record.acsEvents.forEach((acs) => {
    timelineEvents.push({
      id: acs.id,
      date: acs.eventDate,
      type: acs.type,
      title: `${acs.type} Myocardial Infarction`,
      summary: `TIMI Score: ${acs.timiCalculatedScore} • Strategy: ${acs.treatmentStrategy} ${
      acs.treatmentStrategy === 'PAMI' ? `• D2B: ${acs.pamiDetails?.doorToBalloonTime || 0}m` : ''}`,

      raw: acs,
      color: acs.type === 'STEMI' ? 'bg-red-500 border-red-500 text-red-500' : 'bg-orange-500 border-orange-500 text-orange-500',
      icon: Activity
    });
  });

  // CABG procedures
  record.cabgProcedures.forEach((cabg) => {
    timelineEvents.push({
      id: cabg.id,
      date: cabg.procedureDate,
      type: 'CABG',
      title: 'CABG / Adult Cardiac Surgery',
      summary: `Surgeon: ${cabg.surgeonName} • Status: ${cabg.procedureStatus} • Bypass Conduits: ${
      cabg.bypassDetails ? `${cabg.bypassDetails.distalAnastomosesArterial} Art / ${cabg.bypassDetails.distalAnastomosesVenous} Ven` : 'No'}`,

      raw: cabg,
      color: 'bg-purple-500 border-purple-500 text-purple-500',
      icon: Award
    });
  });

  // Follow Ups
  record.followUps.forEach((f) => {
    timelineEvents.push({
      id: f.id,
      date: f.dateOfVisit,
      type: 'Follow-up',
      title: `HF Follow-up (${f.followUpInterval})`,
      summary: `Angina: ${f.symptoms.angina} • Compliance: ${
      f.medicationCompliance.betaBlocker === 'Yes' ? 'BB compliant' : 'BB omitted'} • Readmission: ${
      f.adverseEvents.hospitalization ? 'Yes' : 'No'}`,
      raw: f,
      color: 'bg-indigo-500 border-indigo-500 text-indigo-500',
      icon: Calendar
    });
  });

  // Lab Results
  record.labResults.forEach((l) => {
    timelineEvents.push({
      id: l.id,
      date: l.resultDate,
      type: 'Lab',
      title: 'Laboratory Observation',
      summary: `Potassium: ${l.potassium || 'N/A'} • Creatinine: ${l.creatinine || 'N/A'} ${
      l.bnp ? `• BNP: ${l.bnp}` : ''} ${
      l.tropI ? `• Troponin I: ${l.tropI}` : ''}`,
      raw: l,
      color: 'bg-emerald-500 border-emerald-500 text-emerald-500',
      icon: Stethoscope
    });
  });

  // Investigations
  record.investigations.forEach((i) => {
    timelineEvents.push({
      id: i.id,
      date: i.investigationDate,
      type: 'Investigation',
      title: `${i.testType} Diagnostic Report`,
      summary: i.testType === 'ECHO' ? `Ejection Fraction: ${i.results.ef || 'N/A'}% • RWMA: ${i.results.rwma || 'None'}` :
      i.testType === 'ECG' ? `HR: ${i.results.hr || 'N/A'} bpm • Rhythm: ${i.results.rhythm || 'N/A'}` :
      'Diagnostic report logged',
      raw: i,
      color: 'bg-rose-500 border-rose-500 text-rose-500',
      icon: Layers
    });
  });

  // Sort: Latest date first
  timelineEvents.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  // 2. Extract Longitudinal Biomarker trends for charting
  // Ejection Fraction % Trend
  const efTrendData = [];
  // Lab values trends (Creatinine & BNP)
  const labTrendData = [];

  // Sort all data for charts in ascending order (Oldest first)
  const sortedLabs = [...record.labResults].sort((a, b) => new Date(a.resultDate).getTime() - new Date(b.resultDate).getTime());
  sortedLabs.forEach((l) => {
    if (l.creatinine || l.bnp) {
      labTrendData.push({
        date: l.resultDate,
        Creatinine: l.creatinine,
        BNP: l.bnp
      });
    }
  });

  // Look for EF in HF assessments and Echo investigations
  const sortedEFs = [];
  record.hfAssessments.forEach((hf) => {

    // Check if we can infer EF, or if we have it. Let's look inside record investigations instead
  });record.investigations.forEach((inv) => {
    if (inv.testType === 'ECHO' && inv.results.ef) {
      sortedEFs.push({
        date: inv.investigationDate,
        ef: Number(inv.results.ef)
      });
    }
  });
  sortedEFs.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  sortedEFs.forEach((item) => {
    efTrendData.push({
      date: item.date,
      EF: item.ef
    });
  });

  const dq = calculateDataQualityScore(record);

  return (
    <div className="space-y-6">
      
      {/* Back to master & Register record header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <button
          id="btn-back-to-list"
          onClick={onBack}
          className="flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-slate-900 bg-white px-3 py-2 rounded-lg border border-slate-200 shadow-sm w-fit transition-all">
          
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Master Registry</span>
        </button>

        {/* Unified "ADD CLINICAL RECORD" Dropdown Trigger */}
        <div className="relative">
          <button
            id="btn-add-clinical-record"
            onClick={() => setShowAddMenu(!showAddMenu)}
            className="w-full sm:w-auto px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-2">
            
            <Plus className="w-4 h-4" />
            <span>ADD CLINICAL RECORD</span>
            <ChevronDown className={`w-4 h-4 transition-transform ${showAddMenu ? 'rotate-180' : ''}`} />
          </button>

          {showAddMenu &&
          <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden z-30 animate-scaleIn">
              <div className="p-2 border-b border-slate-100 bg-slate-50">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Select Registry Entry</span>
              </div>
              <div className="p-1 divide-y divide-slate-100">
                <button
                id="add-opt-hf"
                onClick={() => {onAddEventClick('HF');setShowAddMenu(false);}}
                className="w-full text-left px-3 py-2 hover:bg-teal-50 text-xs font-semibold text-teal-800 rounded-md transition-colors flex items-center gap-2">
                
                  <Heart className="w-4 h-4 text-teal-500" />
                  <span>+ Heart Failure Assessment</span>
                </button>
                <button
                id="add-opt-stemi"
                onClick={() => {onAddEventClick('STEMI');setShowAddMenu(false);}}
                className="w-full text-left px-3 py-2 hover:bg-red-50 text-xs font-semibold text-red-800 rounded-md transition-colors flex items-center gap-2">
                
                  <Activity className="w-4 h-4 text-red-500" />
                  <span>+ STEMI Event</span>
                </button>
                <button
                id="add-opt-nstemi"
                onClick={() => {onAddEventClick('NSTEMI');setShowAddMenu(false);}}
                className="w-full text-left px-3 py-2 hover:bg-orange-50 text-xs font-semibold text-orange-800 rounded-md transition-colors flex items-center gap-2">
                
                  <Activity className="w-4 h-4 text-orange-500" />
                  <span>+ NSTEMI Event</span>
                </button>
                <button
                id="add-opt-cabg"
                onClick={() => {onAddEventClick('CABG');setShowAddMenu(false);}}
                className="w-full text-left px-3 py-2 hover:bg-purple-50 text-xs font-semibold text-purple-800 rounded-md transition-colors flex items-center gap-2">
                
                  <Award className="w-4 h-4 text-purple-500" />
                  <span>+ CABG Procedure</span>
                </button>
                <button
                id="add-opt-hosp"
                onClick={() => {onAddEventClick('Admission');setShowAddMenu(false);}}
                className="w-full text-left px-3 py-2 hover:bg-blue-50 text-xs font-semibold text-blue-800 rounded-md transition-colors flex items-center gap-2">
                
                  <Stethoscope className="w-4 h-4 text-blue-500" />
                  <span>+ Hospitalization</span>
                </button>
                <button
                id="add-opt-followup"
                onClick={() => {onAddEventClick('Follow-up');setShowAddMenu(false);}}
                className="w-full text-left px-3 py-2 hover:bg-indigo-50 text-xs font-semibold text-indigo-800 rounded-md transition-colors flex items-center gap-2">
                
                  <Calendar className="w-4 h-4 text-indigo-500" />
                  <span>+ Follow-up Visit</span>
                </button>
                <button
                id="add-opt-lab"
                onClick={() => {onAddEventClick('Lab');setShowAddMenu(false);}}
                className="w-full text-left px-3 py-2 hover:bg-emerald-50 text-xs font-semibold text-emerald-800 rounded-md transition-colors flex items-center gap-2">
                
                  <Stethoscope className="w-4 h-4 text-emerald-500" />
                  <span>+ Laboratory Result</span>
                </button>
                <button
                id="add-opt-investigation"
                onClick={() => {onAddEventClick('Investigation');setShowAddMenu(false);}}
                className="w-full text-left px-3 py-2 hover:bg-rose-50 text-xs font-semibold text-rose-800 rounded-md transition-colors flex items-center gap-2">
                
                  <Layers className="w-4 h-4 text-rose-500" />
                  <span>+ Investigation</span>
                </button>
              </div>
            </div>
          }
        </div>
      </div>

      {/* Patient Master Demographics Card */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 space-y-6 relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-teal-500 to-purple-500"></div>
        
        {/* Core Title Details */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider block">Longitudinal Clinical Portfolio</span>
              <h2 className="text-xl font-bold text-slate-800 mt-0.5">{record.patient.name}</h2>
              <span className="text-xs text-slate-400 font-mono">ID: {record.patient.id} • Registered {new Date(record.patient.createdAt).toLocaleDateString()}</span>
            </div>
          </div>

          <div className="flex gap-4 shrink-0">
            <div className="text-center bg-slate-50 border border-slate-100 px-3.5 py-2 rounded-xl">
              <span className="block text-slate-400 text-[10px] font-bold uppercase">Overall Quality</span>
              <span className={`block text-lg font-black ${dq.score >= 85 ? 'text-emerald-600' : 'text-amber-600'}`}>
                {dq.score}%
              </span>
            </div>
            <div className="text-center bg-slate-50 border border-slate-100 px-3.5 py-2 rounded-xl">
              <span className="block text-slate-400 text-[10px] font-bold uppercase">Timeline Records</span>
              <span className="block text-lg font-black text-slate-800">{timelineEvents.length}</span>
            </div>
          </div>
        </div>

        {/* Detailed Demographics Subgrid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 py-4 border-y border-slate-100 text-xs">
          <div>
            <span className="text-slate-400 font-semibold block uppercase">Age & Gender</span>
            <span className="text-slate-700 font-bold block mt-1">{calculateAge(record.patient.dob) ?? '—'} years / {record.patient.gender}</span>
          </div>
          <div>
            <span className="text-slate-400 font-semibold block uppercase">CARE MR Number</span>
            <span className="text-slate-700 font-bold block mt-1">{record.patient.mrNo}</span>
          </div>
          <div>
            <span className="text-slate-400 font-semibold block uppercase">Primary Consultant</span>
            <span className="text-slate-700 font-bold block mt-1">{record.patient.primaryConsultant}</span>
          </div>
          <div>
            <span className="text-slate-400 font-semibold block uppercase">Contact Phone</span>
            <span className="text-slate-700 font-bold block mt-1">{record.patient.phone || 'N/A'}</span>
          </div>
        </div>

        {/* Baseline Comorbidities & Alerts */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-2 text-xs">
            <span className="text-slate-500 font-bold uppercase tracking-wider block">Master Comorbidity Profile</span>
            <div className="flex flex-wrap gap-1.5 pt-1">
              <span className={`px-2 py-0.5 rounded font-semibold ${record.comorbidities.hypertension === 'Yes' ? 'bg-orange-100 text-orange-800' : 'bg-slate-100 text-slate-400'}`}>Hypertension: {record.comorbidities.hypertension}</span>
              <span className={`px-2 py-0.5 rounded font-semibold ${record.comorbidities.diabetes === 'Yes' ? 'bg-indigo-100 text-indigo-800' : 'bg-slate-100 text-slate-400'}`}>Diabetes: {record.comorbidities.diabetes} {record.comorbidities.diabetesControl ? `(${record.comorbidities.diabetesControl})` : ''}</span>
              <span className={`px-2 py-0.5 rounded font-semibold ${record.comorbidities.renalFailure === 'Yes' ? 'bg-pink-100 text-pink-800' : 'bg-slate-100 text-slate-400'}`}>Renal Failure: {record.comorbidities.renalFailure} {record.comorbidities.dialysisStatus === 'Yes' ? '(Dialysis)' : ''}</span>
              <span className={`px-2 py-0.5 rounded font-semibold ${record.comorbidities.smoking === 'Yes' ? 'bg-slate-200 text-slate-800' : 'bg-slate-100 text-slate-400'}`}>Smoking: {record.comorbidities.smoking}</span>
            </div>
          </div>

          <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-2 text-xs">
            <span className="text-slate-500 font-bold uppercase tracking-wider block">Portfolio Consistency Audits</span>
            <div className="space-y-1 overflow-y-auto max-h-16 pr-1">
              {dq.alerts.map((alert, idx) =>
              <div key={idx} className="text-amber-700 flex items-center gap-1">
                  <ShieldAlert className="w-3.5 h-3.5 shrink-0 text-amber-500" />
                  <span className="truncate">{alert}</span>
                </div>
              )}
              {dq.alerts.length === 0 &&
              <span className="text-emerald-600 block font-medium">✔ Record completely consistent. No clinical audits pending.</span>
              }
            </div>
          </div>
        </div>

      </div>

      {/* Visual Longitudinal Trends & Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* EF% Chart */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-4 flex items-center gap-1.5">
            <LineChartIcon className="w-4 h-4 text-teal-600" /> Longitudinal Ejection Fraction Trend (%)
          </h3>
          <div className="h-44">
            {efTrendData.length > 0 ?
            <ResponsiveContainer width="100%" height="100%">
                <LineChart data={efTrendData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="date" stroke="#94a3b8" fontSize={10} />
                  <YAxis stroke="#94a3b8" domain={[0, 100]} fontSize={10} />
                  <Tooltip />
                  <Line type="monotone" dataKey="EF" stroke="#0d9488" strokeWidth={3} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer> :

            <div className="h-full flex items-center justify-center text-slate-400 text-xs">
                No Echo/EF records recorded chronologically to chart.
              </div>
            }
          </div>
        </div>

        {/* Labs (Creatinine & BNP) Chart */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-4 flex items-center gap-1.5">
            <LineChartIcon className="w-4 h-4 text-indigo-600" /> Renal & Heart Failure Biomarker Trends
          </h3>
          <div className="h-44">
            {labTrendData.length > 0 ?
            <ResponsiveContainer width="100%" height="100%">
                <LineChart data={labTrendData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="date" stroke="#94a3b8" fontSize={10} />
                  <YAxis stroke="#94a3b8" fontSize={10} />
                  <Tooltip />
                  <Line type="monotone" dataKey="Creatinine" stroke="#ec4899" strokeWidth={2.5} name="Creatinine (mg/dL)" />
                  <Line type="monotone" dataKey="BNP" stroke="#6366f1" strokeWidth={2.5} name="BNP (pg/mL)" />
                </LineChart>
              </ResponsiveContainer> :

            <div className="h-full flex items-center justify-center text-slate-400 text-xs">
                No potassium/creatinine/BNP results recorded to chart.
              </div>
            }
          </div>
        </div>

        {/* HF History List */}
        <HFHistoryList patientId={record.patient.id} />

      </div>

      {/* Chronological Longitudinal Clinical Timeline */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
        <h3 className="text-sm font-bold text-slate-800 mb-6 flex items-center gap-2">
          <Layers className="w-5 h-5 text-blue-600" /> Longitudinal Clinical Timeline ({timelineEvents.length} entries)
        </h3>

        <div className="relative border-l-2 border-slate-200 ml-4 pl-6 space-y-6">
          {timelineEvents.map((event) => {
            const IconComp = event.icon;

            return (
              <div key={event.id} className="relative group">
                {/* Visual Circle Indicator */}
                <div className={`absolute -left-[35px] top-0.5 p-1.5 rounded-full border bg-white ${event.color} transition-all group-hover:scale-110 z-10`}>
                  <IconComp className="w-4 h-4 text-white" fill="currentColor" />
                </div>

                {/* Timeline Card */}
                <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 hover:border-slate-200 hover:bg-slate-100/30 transition-all flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 font-mono uppercase block">{event.date} • {event.type}</span>
                    <h4 className="text-sm font-bold text-slate-800 mt-1">{event.title}</h4>
                    <p className="text-xs text-slate-600 mt-1 leading-relaxed">{event.summary}</p>
                  </div>

                  <div className="flex gap-2 shrink-0">
                    <button
                      id={`btn-view-ev-${event.id}`}
                      onClick={() => onViewEventDetails(event.raw, event.type)}
                      className="px-3 py-1.5 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 transition-colors">
                      
                      View Details / Edit
                    </button>
                    <button
                      id={`btn-del-ev-${event.id}`}
                      onClick={() => onDeleteEvent(event.id, event.type)}
                      className="p-1.5 bg-red-50 hover:bg-red-100 hover:text-red-700 text-red-600 border border-red-100 rounded-lg transition-colors"
                      title="Delete Record">
                      
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>);

          })}

          {timelineEvents.length === 0 &&
          <div className="text-center py-12 text-slate-400 text-sm pl-0">
              The clinical timeline of this patient is empty. Use the &quot;ADD CLINICAL RECORD&quot; button above to record clinical assessments, surgical bypasses, or lab results.
            </div>
          }
        </div>
      </div>

    </div>);

}