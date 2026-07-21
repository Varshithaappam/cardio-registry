import React, { useState } from 'react';
import { 
  ArrowLeft, Plus, Activity, Heart, Stethoscope, Scissors, FileText, 
  Clock, ShieldAlert, CheckCircle, ChevronRight, RefreshCw, Calendar, 
  MapPin, AlertCircle, Edit, Trash2, Eye, User, Briefcase, GraduationCap
} from 'lucide-react';
import { calculateDataQualityScore } from '../data/mockPatients';
import HFHistoryList from './HFHistoryList';
import RegisterNewPatient from './RegisterNewPatient';

// Age calculator helper
function calculateAge(dobString) {
  if (!dobString) return null;
  const dob = new Date(dobString);
  const diffMs = Date.now() - dob.getTime();
  const ageDate = new Date(diffMs);
  return Math.abs(ageDate.getUTCFullYear() - 1970);
}

// Module Icon Map
const MODULE_ICONS = {
  HF: <Activity className="w-5 h-5 text-teal-600" />,
  STEMI: <Heart className="w-5 h-5 text-rose-600" />,
  NSTEMI: <Stethoscope className="w-5 h-5 text-amber-600" />,
  CABG: <Scissors className="w-5 h-5 text-indigo-600" />,
  HOSP: <FileText className="w-5 h-5 text-blue-600" />,
  FOLLOWUP: <Clock className="w-5 h-5 text-purple-600" />,
};

// Module Color Badges
const MODULE_BADGES = {
  HF: 'bg-teal-50 border-teal-200 text-teal-700',
  STEMI: 'bg-rose-50 border-rose-200 text-rose-700',
  NSTEMI: 'bg-amber-50 border-amber-200 text-amber-700',
  CABG: 'bg-indigo-50 border-indigo-200 text-indigo-700',
  HOSP: 'bg-blue-50 border-blue-200 text-blue-700',
  FOLLOWUP: 'bg-purple-50 border-purple-200 text-purple-700',
};

export default function PatientTimeline({ record, onBack, onAddEventClick, onViewEventDetails, onDeleteEvent, onRefreshPatient }) {
  const [activeTab, setActiveTab] = useState('timeline');
  const [isEditingPatient, setIsEditingPatient] = useState(false);

  if (!record || !record.patient) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 text-center">
        <AlertCircle className="w-12 h-12 text-amber-500 mx-auto mb-3" />
        <h3 className="text-lg font-bold text-slate-800">Patient Record Not Found</h3>
        <p className="text-xs text-slate-500 mt-1 mb-4">The requested patient record could not be loaded or was deleted.</p>
        <button
          onClick={onBack}
          className="px-4 py-2 bg-blue-600 text-white text-xs font-bold rounded-lg hover:bg-blue-700 transition-colors"
        >
          Return to Master Patient List
        </button>
      </div>
    );
  }

  // Flatten timeline events chronologically
  const timelineEvents = [
    ...(record.hfAssessments || []).map(a => ({
      type: 'HF',
      title: `Heart Failure Assessment (${a.status === 'draft' ? 'Draft' : 'Final'})`,
      date: a.assessment_date || a.createdAt,
      status: a.status || 'final',
      details: `NYHA Class: ${a.nyhaClass || a.initial_nyha_class || 'N/A'} • LVEF: ${a.lvef || 'N/A'}% • Weight: ${a.weight || 'N/A'} kg`,
      raw: a,
      id: a.hf_id || a.id
    })),
    ...(record.acsEvents || []).map(e => ({
      type: e.type || 'STEMI',
      title: `${e.type || 'ACS'} Event (${e.status || 'final'})`,
      date: e.event_date || e.admission_date || e.createdAt,
      status: e.status || 'final',
      details: `Killip Class: ${e.killipClass || 'I'} • Door to Balloon: ${e.doorToBalloonTime || 'N/A'} mins`,
      raw: e,
      id: e.id
    })),
    ...(record.cabgProcedures || []).map(c => ({
      type: 'CABG',
      title: 'CABG Surgical Intervention',
      date: c.surgery_date || c.createdAt,
      status: 'final',
      details: `Grafts: ${c.graftCount || 'N/A'} • CPB Time: ${c.cpbTime || 'N/A'} mins`,
      raw: c,
      id: c.id
    })),
    ...(record.hospitalizations || []).map(h => ({
      type: 'HOSP',
      title: 'Acute Hospitalization Encounter',
      date: h.admissionDate || h.createdAt,
      status: 'final',
      details: `Reason: ${h.reasonForAdmission || 'Unspecified'} • LOS: ${h.lengthOfStayDays || 'N/A'} days`,
      raw: h,
      id: h.id
    })),
    ...(record.followUps || []).map(f => ({
      type: 'FOLLOWUP',
      title: 'Post-Discharge Follow-Up Assessment',
      date: f.followUpDate || f.createdAt,
      status: 'final',
      details: `Clinical Status: ${f.status || 'Stable'} • NYHA: ${f.nyhaClass || 'N/A'}`,
      raw: f,
      id: f.id
    }))
  ].sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));

  const dq = calculateDataQualityScore(record);

  const handleEditPatientSuccess = (updatedPatientData) => {
    setIsEditingPatient(false);
    if (onRefreshPatient) {
      onRefreshPatient();
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Top Header & Actions Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-xl shadow-sm border border-slate-200">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
            title="Back to Master List"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-lg font-bold text-slate-800">Master Patient Clinical Portfolio</h1>
            <p className="text-xs text-slate-500">Longitudinal registry timeline and baseline clinical profile.</p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setIsEditingPatient(true)}
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition-all border border-slate-300 flex items-center gap-1.5 cursor-pointer"
          >
            <Edit className="w-3.5 h-3.5 text-blue-600" />
            <span>Edit Patient Info</span>
          </button>
          <button
            onClick={onAddEventClick}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-all shadow-sm flex items-center gap-2 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>ADD CLINICAL EVENT</span>
          </button>
        </div>
      </div>

      {/* Edit Patient Modal Overlay */}
      {isEditingPatient && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="w-full max-w-5xl max-h-[85vh] my-auto flex flex-col">
            <RegisterNewPatient
              initialData={record}
              isEditMode={true}
              onSuccess={handleEditPatientSuccess}
              onCancel={() => setIsEditingPatient(false)}
            />
          </div>
        </div>
      )}

      {/* Patient Master Demographics Card */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 space-y-6 relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-teal-500 to-purple-500"></div>
        
        {/* Core Title Details */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
              <User className="w-6 h-6" />
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
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 py-4 border-y border-slate-100 text-xs">
          <div>
            <span className="text-slate-400 font-semibold block uppercase">Age / Gender</span>
            <span className="text-slate-700 font-bold block mt-1">{calculateAge(record.patient.dob) ?? '—'} yrs / {record.patient.gender}</span>
          </div>
          <div>
            <span className="text-slate-400 font-semibold block uppercase">MR Number</span>
            <span className="text-slate-700 font-bold block mt-1">{record.patient.mrNo}</span>
          </div>
          <div>
            <span className="text-slate-400 font-semibold block uppercase">Contact Phone</span>
            <span className="text-slate-700 font-bold block mt-1">{record.patient.phone || 'N/A'}</span>
          </div>
          <div>
            <span className="text-slate-400 font-semibold block uppercase">Higher Education</span>
            <span className="text-slate-700 font-bold block mt-1">{record.patient.higherEducation || 'None'}</span>
          </div>
          <div>
            <span className="text-slate-400 font-semibold block uppercase">Occupation</span>
            <span className="text-slate-700 font-bold block mt-1">{record.patient.occupation || 'N/A'}</span>
          </div>
          <div className="col-span-2 md:col-span-1">
            <span className="text-slate-400 font-semibold block uppercase">Insurance Mode</span>
            <span className="text-slate-700 font-bold block mt-1 truncate">{record.patient.insuranceMode || 'Self-Pay'}</span>
          </div>
        </div>

        {/* Address Banner */}
        {record.patient.address && (
          <div className="bg-slate-50 p-3 rounded-lg border border-slate-200/60 flex items-start gap-2 text-xs">
            <MapPin className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-slate-700">Address: </span>
              <span className="text-slate-600">{record.patient.address}</span>
            </div>
          </div>
        )}

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
              {dq.alerts.map((alert, idx) => (
                <div key={idx} className="text-amber-700 flex items-center gap-1">
                  <ShieldAlert className="w-3.5 h-3.5 shrink-0 text-amber-500" />
                  <span className="truncate">{alert}</span>
                </div>
              ))}
              {dq.alerts.length === 0 && (
                <span className="text-emerald-600 block font-medium">✔ Record completely consistent. No clinical audits pending.</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="border-b border-slate-200 flex items-center gap-4 text-xs font-bold">
        <button
          onClick={() => setActiveTab('timeline')}
          className={`py-3 px-1 border-b-2 transition-colors flex items-center gap-1.5 cursor-pointer ${
            activeTab === 'timeline'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>Clinical Timeline ({timelineEvents.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('hf')}
          className={`py-3 px-1 border-b-2 transition-colors flex items-center gap-1.5 cursor-pointer ${
            activeTab === 'hf'
              ? 'border-teal-600 text-teal-600'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <Activity className="w-4 h-4" />
          <span>Heart Failure Registry ({record.hfAssessments?.length || 0})</span>
        </button>
      </div>

      {/* Tab Content 1: Full Clinical Timeline */}
      {activeTab === 'timeline' && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Chronological Event Timeline</h3>
            <span className="text-xs text-slate-400">Ordered newest to oldest</span>
          </div>

          {timelineEvents.length === 0 ? (
            <div className="text-center py-12 bg-slate-50 rounded-xl border border-dashed border-slate-200">
              <Activity className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <p className="text-xs text-slate-500">No clinical events recorded for this patient yet.</p>
              <button
                onClick={onAddEventClick}
                className="mt-3 px-3 py-1.5 bg-blue-600 text-white text-xs font-bold rounded-lg hover:bg-blue-700 transition-colors inline-flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                Add First Event
              </button>
            </div>
          ) : (
            <div className="relative border-l-2 border-slate-200 pl-6 ml-4 space-y-6">
              {timelineEvents.map((evt, idx) => (
                <div key={idx} className="relative group">
                  {/* Timeline Node Dot */}
                  <div className="absolute -left-[31px] top-1.5 bg-white p-1 rounded-full border border-slate-300 shadow-xs">
                    {MODULE_ICONS[evt.type] || <Activity className="w-4 h-4 text-blue-600" />}
                  </div>

                  <div className="bg-slate-50 hover:bg-slate-100/80 p-4 rounded-xl border border-slate-200 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`px-2 py-0.5 text-[10px] font-bold rounded-md border uppercase ${MODULE_BADGES[evt.type]}`}>
                          {evt.type}
                        </span>
                        <h4 className="text-sm font-bold text-slate-800">{evt.title}</h4>
                        {evt.status === 'draft' && (
                          <span className="px-2 py-0.5 bg-amber-100 text-amber-800 text-[10px] font-bold rounded-md">Draft</span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 mt-1">{evt.details}</p>
                      <div className="flex items-center gap-1 text-[10px] text-slate-400 mt-2 font-mono">
                        <Calendar className="w-3 h-3" />
                        <span>{new Date(evt.date).toLocaleDateString()}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => onViewEventDetails(evt)}
                        className="px-3 py-1.5 bg-white border border-slate-200 hover:bg-blue-50 hover:border-blue-300 hover:text-blue-600 text-slate-700 rounded-lg text-xs font-semibold transition-all flex items-center gap-1 cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>View Assessment</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab Content 2: HF Registry Assessment List */}
      {activeTab === 'hf' && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 space-y-6">
          <HFHistoryList patientId={record.patient.id} />
        </div>
      )}
    </div>
  );
}