import React from 'react';
import { 
  X, 
  Activity, 
  Heart, 
  User, 
  Calendar, 
  AlertTriangle, 
  CheckCircle2, 
  ShieldAlert, 
  Pill, 
  FileText,
  BadgeAlert,
  Flame,
  Droplets
} from 'lucide-react';
import { GDMT_PILLARS } from '../../utils/gdmtEngine';

export default function PatientDossierModal({ patient, isOpen, onClose }) {
  if (!isOpen || !patient) return null;

  const evalMap = patient.pillarEvaluations || {};

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4">
      <div 
        className="w-full max-w-4xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Top Banner */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-teal-950 p-6 text-white shrink-0 relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-xl hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-teal-500/20 border border-teal-400/30 flex items-center justify-center text-teal-400 shrink-0">
                <Heart className="w-6 h-6 animate-pulse" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-xl font-bold tracking-tight text-white">{patient.name || 'Unnamed Patient'}</h2>
                  <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-teal-500/20 text-teal-300 border border-teal-400/30 font-bold">
                    UHID: {patient.uhid}
                  </span>
                  <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-slate-800 text-slate-300 border border-slate-700">
                    IP No: {patient.ipNo}
                  </span>
                </div>
                <p className="text-xs text-slate-300 mt-1 flex items-center gap-3 flex-wrap">
                  <span className="flex items-center gap-1">
                    <User className="w-3.5 h-3.5 text-teal-400" />
                    {patient.gender}, {patient.age} yrs
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1 font-semibold text-teal-200">
                    {patient.hfType} (LVEF {patient.efPercent}%)
                  </span>
                  <span>•</span>
                  <span className="text-amber-300 font-medium">
                    {patient.functionalStatus}
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1 text-slate-300">
                    <Calendar className="w-3.5 h-3.5" />
                    Admitted: {patient.admissionDate || 'N/A'}
                  </span>
                </p>
              </div>
            </div>

            {/* Adherence Score Badge */}
            <div className="flex items-center gap-3 bg-white/10 border border-white/10 px-4 py-2.5 rounded-xl backdrop-blur-xs shrink-0">
              <div className="text-right">
                <span className="block text-[10px] text-slate-300 font-semibold uppercase tracking-wider">GDMT Adherence</span>
                <span className={`block text-2xl font-black font-mono leading-none ${
                  patient.adherencePercent >= 80 ? 'text-emerald-400' :
                  patient.adherencePercent >= 50 ? 'text-amber-400' : 'text-rose-400'
                }`}>
                  {patient.adherencePercent}%
                </span>
              </div>
              <div className="h-8 w-px bg-white/20"></div>
              <div className="text-left">
                <span className="block text-[10px] text-slate-300 font-semibold uppercase tracking-wider">Deviations</span>
                <span className="block text-lg font-bold font-mono text-white">
                  {patient.deviationsCount} / 6
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Labs & Clinical Telemetry Grid */}
          <div>
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <Activity className="w-4 h-4 text-teal-600" />
              Admission Vitals & Laboratory Safety Markers
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
              {/* BP */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
                <span className="text-[10px] font-bold text-slate-500 uppercase block">Blood Pressure</span>
                <span className="text-base font-black font-mono text-slate-900 block mt-0.5">
                  {patient.bloodPressureSitting || '120/80'}
                </span>
                <span className="text-[10px] text-slate-500">mmHg sitting</span>
              </div>

              {/* HR */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
                <span className="text-[10px] font-bold text-slate-500 uppercase block">Heart Rate</span>
                <span className={`text-base font-black font-mono block mt-0.5 ${
                  patient.heartRate < 50 ? 'text-purple-600' : 'text-slate-900'
                }`}>
                  {patient.heartRate} bpm
                </span>
                <span className="text-[10px] text-slate-500">
                  {patient.heartRate < 50 ? '⚠️ Severe Bradycardia' : 'Resting rhythm'}
                </span>
              </div>

              {/* Creatinine */}
              <div className={`rounded-xl p-3 border ${
                patient.creatinine > 2.5 ? 'bg-red-50 border-red-300 text-red-950' : 'bg-slate-50 border-slate-200'
              }`}>
                <span className="text-[10px] font-bold uppercase block text-slate-500">Creatinine</span>
                <span className={`text-base font-black font-mono block mt-0.5 ${
                  patient.creatinine > 2.5 ? 'text-red-600' : 'text-slate-900'
                }`}>
                  {patient.creatinine} mg/dL
                </span>
                <span className="text-[10px] text-slate-500">
                  {patient.creatinine > 2.5 ? '🚨 Renal CI Triggered' : 'Normal range'}
                </span>
              </div>

              {/* Potassium */}
              <div className={`rounded-xl p-3 border ${
                patient.potassium > 5.0 ? 'bg-amber-50 border-amber-300 text-amber-950' : 'bg-slate-50 border-slate-200'
              }`}>
                <span className="text-[10px] font-bold uppercase block text-slate-500">Potassium (K⁺)</span>
                <span className={`text-base font-black font-mono block mt-0.5 ${
                  patient.potassium > 5.0 ? 'text-amber-600' : 'text-slate-900'
                }`}>
                  {patient.potassium} mEq/L
                </span>
                <span className="text-[10px] text-slate-500">
                  {patient.potassium > 5.0 ? '⚠️ Hyperkalemia CI' : 'Normal electrolytes'}
                </span>
              </div>

              {/* Hemoglobin */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
                <span className="text-[10px] font-bold text-slate-500 uppercase block">Hemoglobin</span>
                <span className="text-base font-black font-mono text-slate-900 block mt-0.5">
                  {patient.hemoglobin || '12.5'} g/dL
                </span>
                <span className="text-[10px] text-slate-500">Whole blood</span>
              </div>

              {/* LVEF */}
              <div className="bg-teal-50 border border-teal-200 rounded-xl p-3">
                <span className="text-[10px] font-bold text-teal-800 uppercase block">Ejection Fraction</span>
                <span className="text-base font-black font-mono text-teal-900 block mt-0.5">
                  {patient.efPercent}%
                </span>
                <span className="text-[10px] text-teal-700 font-semibold">{patient.hfType}</span>
              </div>
            </div>
          </div>

          {/* Comorbidities */}
          <div>
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Comorbidities & Secondary Risk Factors</h4>
            <div className="flex flex-wrap gap-1.5">
              {(patient.comorbidities && patient.comorbidities.length > 0) ? (
                patient.comorbidities.map((c, i) => (
                  <span key={i} className="px-2.5 py-1 bg-slate-100 text-slate-800 border border-slate-200 rounded-md text-xs font-medium">
                    {c}
                  </span>
                ))
              ) : (
                <span className="text-xs text-slate-400 italic">No comorbid conditions recorded.</span>
              )}
              {patient.death && (
                <span className="px-2.5 py-1 bg-red-100 text-red-700 border border-red-300 rounded-md text-xs font-bold flex items-center gap-1">
                  <BadgeAlert className="w-3.5 h-3.5" />
                  In-Hospital Mortality Recorded
                </span>
              )}
            </div>
          </div>

          {/* 6 GDMT Drug Pillars Evaluation Cards */}
          <div>
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Pill className="w-4 h-4 text-teal-600" />
                6-Pillar GDMT Guideline Concordance & Deviation Analysis
              </span>
              <span className="text-[11px] text-slate-400 font-normal">
                Standard Class I Recommendation Evaluation
              </span>
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {GDMT_PILLARS.map((pillar) => {
                const evalData = evalMap[pillar.key] || {
                  prescribed: 0,
                  contraindication: 0,
                  status: 'Withheld without Contraindication',
                  isDeviation: true,
                  deviationType: 'Withheld without CI',
                  justification: 'No record available.'
                };

                const isDev = evalData.isDeviation;
                const isGivenWithCI = evalData.deviationType === 'Given with CI';
                const isWithheldNoCI = evalData.deviationType === 'Withheld without CI';

                return (
                  <div 
                    key={pillar.key} 
                    className={`p-4 rounded-xl border transition-all ${
                      isGivenWithCI ? 'bg-red-50/60 border-red-200 shadow-2xs' :
                      isWithheldNoCI ? 'bg-amber-50/50 border-amber-200 shadow-2xs' :
                      'bg-emerald-50/40 border-emerald-200 shadow-2xs'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h5 className="font-bold text-slate-900 text-sm">{pillar.name}</h5>
                        <p className="text-[11px] text-slate-500 italic mt-0.5">{pillar.agents}</p>
                      </div>

                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold shrink-0 flex items-center gap-1 ${
                        isGivenWithCI ? 'bg-red-600 text-white' :
                        isWithheldNoCI ? 'bg-amber-500 text-white' :
                        'bg-emerald-600 text-white'
                      }`}>
                        {isDev ? <AlertTriangle className="w-3 h-3" /> : <CheckCircle2 className="w-3 h-3" />}
                        {evalData.status}
                      </span>
                    </div>

                    <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                      <div className="bg-white/80 p-2 rounded-lg border border-slate-200/60">
                        <span className="text-[10px] text-slate-400 block font-semibold uppercase">Prescribed</span>
                        <span className={`font-bold font-mono ${evalData.prescribed ? 'text-teal-700' : 'text-slate-500'}`}>
                          {evalData.prescribed ? 'YES (Active Therapy)' : 'NO (Not Prescribed)'}
                        </span>
                      </div>
                      <div className="bg-white/80 p-2 rounded-lg border border-slate-200/60">
                        <span className="text-[10px] text-slate-400 block font-semibold uppercase">Contraindication</span>
                        <span className={`font-bold font-mono ${evalData.contraindication ? 'text-rose-600' : 'text-slate-500'}`}>
                          {evalData.contraindication ? 'YES (CI Flagged)' : 'NO (Eligible)'}
                        </span>
                      </div>
                    </div>

                    <p className="mt-2 text-[11px] text-slate-600 leading-normal">
                      <strong>Clinical Justification:</strong> {evalData.justification}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Prescribed Drug Summary */}
          {patient.prescribedDrugsSummary && (
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
              <h5 className="text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-slate-500" />
                Raw Prescription / Generic Formulary Lines
              </h5>
              <p className="text-xs font-mono text-slate-800 break-words leading-relaxed">
                {patient.prescribedDrugsSummary}
              </p>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-2 shrink-0">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer"
          >
            Close Dossier
          </button>
        </div>
      </div>
    </div>
  );
}
