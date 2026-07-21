/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import api from '../../api/axios';

import { createPatient } from '../../api/patientApi';
import { calculateDataQualityScore } from '../data/mockPatients';
import { calculateAge } from '../utils/calculateAge';
import { buildPatientPayload, mapPatientRecord } from '../utils/patientMapper';
import RegisterNewPatient from './RegisterNewPatient';
import { Edit } from 'lucide-react';
import {
  Plus,
  Search,

  ChevronRight,
  ShieldAlert,
  Heart,
  Activity,
  Award,
  AlertCircle,
  Table,
  LayoutGrid,
  Eye } from
'lucide-react';









function EncounterCounter({ patientId }) {
  const [counts, setCounts] = useState({ hfCount: 0, stemiCount: 0, nstemiCount: 0, cabgCount: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    async function fetchCounts() {
      try {
        const res = await api.get(`/patients/counts/${patientId}`);
        if (active && res.data && res.data.success) {
          setCounts(res.data.data);
        }
      } catch (err) {
        console.error("Error fetching patient counts:", err);
      } finally {
        if (active) setLoading(false);
      }
    }
    fetchCounts();
    return () => { active = false; };
  }, [patientId]);

  return (
    <>
      <td className="px-4 py-4 text-center font-mono text-[11px]">
        <div className="inline-flex items-center justify-center min-w-[32px] px-1.5 py-1 bg-slate-50 border border-slate-200/60 rounded-lg">
          <span className={`font-extrabold ${counts.hfCount > 0 ? 'text-teal-600' : 'text-slate-400'}`}>
            {loading ? '...' : counts.hfCount}
          </span>
        </div>
      </td>
      <td className="px-4 py-4 text-center font-mono text-[11px]">
        <div className="inline-flex items-center justify-center min-w-[32px] px-1.5 py-1 bg-slate-50 border border-slate-200/60 rounded-lg">
          <span className={`font-extrabold ${counts.stemiCount > 0 ? 'text-red-500' : 'text-slate-400'}`}>
            {loading ? '...' : counts.stemiCount}
          </span>
        </div>
      </td>
      <td className="px-4 py-4 text-center font-mono text-[11px]">
        <div className="inline-flex items-center justify-center min-w-[32px] px-1.5 py-1 bg-slate-50 border border-slate-200/60 rounded-lg">
          <span className={`font-extrabold ${counts.nstemiCount > 0 ? 'text-orange-500' : 'text-slate-400'}`}>
            {loading ? '...' : counts.nstemiCount}
          </span>
        </div>
      </td>
      <td className="px-4 py-4 text-center font-mono text-[11px]">
        <div className="inline-flex items-center justify-center min-w-[32px] px-1.5 py-1 bg-slate-50 border border-slate-200/60 rounded-lg">
          <span className={`font-extrabold ${counts.cabgCount > 0 ? 'text-purple-600' : 'text-slate-400'}`}>
            {loading ? '...' : counts.cabgCount}
          </span>
        </div>
      </td>
    </>
  );
}

export default function PatientList({ patients, onSelectPatient, onRegisterPatient, onAddEventClick }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [editingPatientRecord, setEditingPatientRecord] = useState(null);
  const [viewMode, setViewMode] = useState('table');

  // New Patient Form State
  const [name, setName] = useState('');
  const [dob, setDob] = useState('1966-01-01');
  const [gender, setGender] = useState('Male');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [insuranceMode, setInsuranceMode] = useState('Direct Cash / Self-Pay');
  const [bloodGroup, setBloodGroup] = useState('Unknown');

  // Co-morbidities state
  const [hypertension, setHypertension] = useState('No');
  const [diabetes, setDiabetes] = useState('No');
  const [diabetesControl, setDiabetesControl] = useState('None');
  const [smoking, setSmoking] = useState('No');
  const [renalFailure, setRenalFailure] = useState('No');
  const [dialysisStatus, setDialysisStatus] = useState('No');

  // Filter patients based on search
  const filteredPatients = patients.filter((p) => {
    return (
      p.patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.patient.mrNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.patient.ipNo && p.patient.ipNo.toLowerCase().includes(searchTerm.toLowerCase()));

  });

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();

    if (!name) {
      alert('Patient Name is required.');
      return;
    }

    const payload = buildPatientPayload({
      name,
      dob,
      gender,
      bloodGroup,
      insuranceMode,
      phone,
      email,
      hypertension,
      smoking,
      diabetes,
      diabetesControl,
      renalFailure,
      dialysisStatus
    });

    try {
      const response = await createPatient(payload);

      if (response?.success) {
        const createdPatient = response.data;
        const newRecord = mapPatientRecord(createdPatient);

        alert('Patient registered successfully.');
        setIsRegistering(false);
        setName('');
        setDob('1966-01-01');
        setGender('Male');
        setPhone('');
        setEmail('');
        setInsuranceMode('Direct Cash / Self-Pay');
        setBloodGroup('Unknown');
        setHypertension('No');
        setDiabetes('No');
        setDiabetesControl('None');
        setSmoking('No');
        setRenalFailure('No');
        setDialysisStatus('No');
        onRegisterPatient(newRecord);
      } else {
        alert(response?.message || 'Patient registration failed.');
      }
    } catch (error) {
      const message = error?.response?.data?.message || error?.message || 'Patient registration failed.';
      alert(message);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Search & Top Action Bar */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-white p-4 rounded-xl shadow-sm border border-slate-200">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3 top-2.5 h-4.5 w-4.5 text-slate-400" />
          <input
            id="patient-search"
            type="text"
            placeholder="Search master list by name, MR No or IP No..."
            className="w-full pl-10 pr-4 py-2 text-sm bg-slate-50 hover:bg-slate-100/50 focus:bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)} />
          
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto justify-end flex-wrap sm:flex-nowrap">
          {/* Tabular/Card Switcher Button Group */}
          
          <button
            id="btn-register-patient"
            onClick={() => setIsRegistering(!isRegistering)}
            className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-2 shrink-0 cursor-pointer">
            
            <Plus className="w-4 h-4" />
            <span>Register New Patient</span>
          </button>
        </div>
      </div>

      {/* Dynamic Master Registration Form Overlay/SlideDown */}
      {isRegistering && (
        <RegisterNewPatient
          onSuccess={(newRecord) => {
            setIsRegistering(false);
            if (onRegisterPatient) {
              onRegisterPatient(newRecord);
            }
          }}
          onCancel={() => setIsRegistering(false)}
        />
      )}

      {/* Edit Patient Modal Overlay */}
      {editingPatientRecord && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="w-full max-w-5xl max-h-[85vh] my-auto flex flex-col">
            <RegisterNewPatient
              initialData={editingPatientRecord}
              isEditMode={true}
              onSuccess={(updatedRecord) => {
                setEditingPatientRecord(null);
                if (onRegisterPatient) {
                  onRegisterPatient(updatedRecord);
                }
              }}
              onCancel={() => setEditingPatientRecord(null)}
            />
          </div>
        </div>
      )}

      {/* Dynamic Master Patient Registry Container */}
      {viewMode === 'table' ?
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden animate-fadeIn">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[1050px]">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="px-5 py-4">Patient Details & Demographics</th>
                  <th className="px-4 py-4">Registry Identifiers</th>
                  <th className="px-4 py-4">Primary Consultant</th>
                  <th className="px-4 py-4">Co-morbidities</th>
                                    <th className="px-4 py-4 text-center">HF</th>
                  <th className="px-4 py-4 text-center">STEMI</th>
                  <th className="px-4 py-4 text-center">NSTEMI</th>
                  <th className="px-4 py-4 text-center">CABG</th>
                  <th className="px-5 py-4 text-right">Registry Shortcuts</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                {filteredPatients.map((record) => {
                const dq = calculateDataQualityScore(record);
                return (
                  <tr key={record.patient.id} className="hover:bg-slate-50/60 transition-colors group">
                      {/* Name & Demographics */}
                      <td className="px-5 py-4">
                        <div>
                          <span
                          id={`tbl-name-${record.patient.id}`}
                          onClick={() => onSelectPatient(record.patient.id)}
                          className="font-extrabold text-slate-900 text-sm hover:text-blue-600 hover:underline cursor-pointer transition-colors block">
                          
                            {record.patient.name}
                          </span>
                          <div className="flex items-center gap-1.5 mt-1 text-[11px] text-slate-500 font-medium">
                            <span className="px-1.5 py-0.2 bg-slate-100 rounded text-slate-600 font-bold uppercase text-[9px]">{record.patient.gender}</span>
                            <span>•</span>
                            <span>{calculateAge(record.patient.dob) ?? '—'} Yrs</span>
                            {record.patient.bloodGroup && record.patient.bloodGroup !== 'Unknown' &&
                          <>
                                <span>•</span>
                                <span className="px-1.5 py-0.2 bg-red-50 text-red-600 rounded font-bold text-[9px] border border-red-100">Blood {record.patient.bloodGroup}</span>
                              </>
                          }
                          </div>
                        </div>
                      </td>

                      {/* Identifiers */}
                      <td className="px-4 py-4 font-mono">
                        <div className="space-y-1">
                          <span className="inline-block text-slate-800 font-bold bg-blue-50 text-blue-700 px-2 py-0.5 rounded text-[10px] border border-blue-100/50">
                            MRN: {record.patient.mrNo}
                          </span>
                          {record.patient.ipNo &&
                        <span className="block text-[10px] text-slate-400 font-semibold px-2">
                              IPN: {record.patient.ipNo}
                            </span>
                        }
                        </div>
                      </td>

                      {/* Consultant & Care */}
                      <td className="px-4 py-4">
                        <div>
                          <span className="font-bold text-slate-800 block text-xs">{record.patient.primaryConsultant || 'Dr. K. Sridhar'}</span>
                          <span className="text-[10px] text-slate-400 font-semibold block mt-0.5">{record.patient.insuranceMode}</span>
                        </div>
                      </td>

                      {/* Co-morbidities */}
                      <td className="px-4 py-4">
                        <div className="flex flex-wrap gap-1 max-w-[210px]">
                          {record.comorbidities.hypertension === 'Yes' &&
                        <span className="px-2 py-0.5 bg-orange-50 text-orange-700 rounded text-[9px] font-bold border border-orange-100 uppercase tracking-wide">HTN</span>
                        }
                          {record.comorbidities.diabetes === 'Yes' &&
                        <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded text-[9px] font-bold border border-indigo-100 uppercase tracking-wide" title={`Controlled via: ${record.comorbidities.diabetesControl}`}>DM ({record.comorbidities.diabetesControl})</span>
                        }
                          {record.comorbidities.renalFailure === 'Yes' &&
                        <span className="px-2 py-0.5 bg-pink-50 text-pink-700 rounded text-[9px] font-bold border border-pink-100 uppercase tracking-wide" title={record.comorbidities.dialysisStatus === 'Yes' ? 'Under active dialysis' : 'No active dialysis'}>CKD {record.comorbidities.dialysisStatus === 'Yes' ? '(Dialysis)' : ''}</span>
                        }
                          {record.comorbidities.smoking === 'Yes' &&
                        <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded text-[9px] font-bold border border-slate-200 uppercase tracking-wide">Smoker</span>
                        }
                          {record.comorbidities.hypertension !== 'Yes' && record.comorbidities.diabetes !== 'Yes' && record.comorbidities.renalFailure !== 'Yes' && record.comorbidities.smoking !== 'Yes' &&
                        <span className="text-slate-400 italic font-medium">None declared</span>
                        }
                        </div>
                      </td>

                      {/* Encounter Counts */}
                      <EncounterCounter patientId={record.patient.id} />

                      {/* Quality Score */}
                      

                      {/* Table Actions */}
                      <td className="px-5 py-4 text-right">
                        <div className="flex items-center justify-end gap-2.5">
                          <button
                            onClick={() => setEditingPatientRecord(record)}
                            className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[10px] font-bold cursor-pointer transition-colors"
                            title="Edit Patient Information"
                          >
                            <Edit className="w-3.5 h-3.5 text-blue-600" />
                          </button>
                          {/* Event Shortcuts */}
                          <div className="flex items-center gap-1 bg-slate-100/50 p-1 rounded-xl border border-slate-200/40">
                            <button
                            id={`tbl-add-hf-${record.patient.id}`}
                            onClick={() => onAddEventClick(record.patient.id, 'HF')}
                            className="px-2 py-1.5 bg-teal-50 hover:bg-teal-100 text-teal-700 rounded-lg text-[10px] font-black cursor-pointer transition-colors"
                            title="Add HF Assessment">
                            
                              + HF
                            </button>
                            <button
                            id={`tbl-add-stemi-${record.patient.id}`}
                            onClick={() => onAddEventClick(record.patient.id, 'STEMI')}
                            className="px-2 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 rounded-lg text-[10px] font-black cursor-pointer transition-colors"
                            title="Add STEMI Case">
                            
                              + STEMI
                            </button>
                            <button
                            id={`tbl-add-nstemi-${record.patient.id}`}
                            onClick={() => onAddEventClick(record.patient.id, 'NSTEMI')}
                            className="px-2 py-1.5 bg-orange-50 hover:bg-orange-100 text-orange-700 rounded-lg text-[10px] font-black cursor-pointer transition-colors"
                            title="Add NSTEMI Case">
                            
                              + NSTEMI
                            </button>
                            <button
                            id={`tbl-add-cabg-${record.patient.id}`}
                            onClick={() => onAddEventClick(record.patient.id, 'CABG')}
                            className="px-2 py-1.5 bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-lg text-[10px] font-black cursor-pointer transition-colors"
                            title="Add CABG Quality Audit">
                            
                              + CABG
                            </button>
                          </div>

                          <button
                          id={`tbl-view-timeline-${record.patient.id}`}
                          onClick={() => onSelectPatient(record.patient.id)}
                          className="px-3 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-black flex items-center gap-1 cursor-pointer transition-all shadow-sm">
                          
                            <Eye className="w-3.5 h-3.5" />
                            <span>Timeline</span>
                          </button>
                        </div>
                      </td>
                    </tr>);

              })}

                {filteredPatients.length === 0 &&
              <tr>
                    <td colSpan={7} className="text-center py-16 text-slate-400 font-semibold bg-white">
                      No registered patients found matching the search criteria. Click &quot;Register New Patient&quot; above to initialize a master record.
                    </td>
                  </tr>
              }
              </tbody>
            </table>
          </div>
        </div> : (

      /* Patients Grid / List View */
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-fadeIn">
          {filteredPatients.map((record) => {
          const dq = calculateDataQualityScore(record);

          return (
            <div
              key={record.patient.id}
              className="bg-white rounded-xl shadow-sm border border-slate-200 hover:border-slate-300 transition-all p-5 flex flex-col justify-between hover:shadow-md relative">
              
                {/* Patient Top Identifier */}
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="text-base font-bold text-slate-800 hover:text-blue-600 cursor-pointer" onClick={() => onSelectPatient(record.patient.id)}>
                        {record.patient.name}
                      </h4>
                      <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                        <span className="px-2 py-0.5 bg-slate-100 rounded text-xs font-semibold text-slate-600">
                          {record.patient.gender} • {calculateAge(record.patient.dob) ?? '—'} Yrs
                        </span>
                        <span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded text-xs font-bold">
                          MR: {record.patient.mrNo}
                        </span>
                        {record.patient.bloodGroup && record.patient.bloodGroup !== 'Unknown' &&
                      <span className="px-1.5 py-0.5 bg-red-50 text-red-600 rounded text-xs font-bold border border-red-100">
                            Blood {record.patient.bloodGroup}
                          </span>
                      }
                      </div>
                    </div>
  
                    {/* Data Quality Indicator */}
                    <div className="text-right">
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Data Quality</span>
                      <span className={`inline-flex items-center gap-1 font-extrabold text-sm ${
                    dq.score >= 85 ? 'text-emerald-600' : 'text-amber-600'}`
                    }>
                        <ShieldAlert className="w-3.5 h-3.5" />
                        {dq.score}%
                      </span>
                    </div>
                  </div>
  
                  {/* Comorbidity Badges */}
                  <div className="mt-4 flex flex-wrap gap-1.5">
                    {record.comorbidities.hypertension === 'Yes' &&
                  <span className="px-2 py-0.5 bg-orange-50 text-orange-700 rounded text-[10px] font-bold border border-orange-100">Hypertension</span>
                  }
                    {record.comorbidities.diabetes === 'Yes' &&
                  <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded text-[10px] font-bold border border-indigo-100">Diabetes ({record.comorbidities.diabetesControl})</span>
                  }
                    {record.comorbidities.renalFailure === 'Yes' &&
                  <span className="px-2 py-0.5 bg-pink-50 text-pink-700 rounded text-[10px] font-bold border border-pink-100">Renal Failure {record.comorbidities.dialysisStatus === 'Yes' ? '(Dialysis)' : ''}</span>
                  }
                    {record.comorbidities.smoking === 'Yes' &&
                  <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded text-[10px] font-bold border border-slate-200">Smoker</span>
                  }
                  </div>
  
                  {/* Clinical History Summaries */}
                  <div className="mt-4 py-3 border-t border-slate-100 grid grid-cols-3 gap-2 text-center text-xs text-slate-500">
                    <div className="bg-slate-50/50 p-2 rounded-lg border border-slate-100">
                      <Heart className="w-4 h-4 mx-auto mb-1 text-teal-600" />
                      <span className="font-bold text-slate-700 block">{record.hfAssessments.length}</span>
                      <span className="text-[10px] text-slate-400 block uppercase">HF Assessments</span>
                    </div>
                    <div className="bg-slate-50/50 p-2 rounded-lg border border-slate-100">
                      <Activity className="w-4 h-4 mx-auto mb-1 text-red-500" />
                      <span className="font-bold text-slate-700 block">{record.acsEvents.length}</span>
                      <span className="text-[10px] text-slate-400 block uppercase">ACS Events</span>
                    </div>
                    <div className="bg-slate-50/50 p-2 rounded-lg border border-slate-100">
                      <Award className="w-4 h-4 mx-auto mb-1 text-purple-500" />
                      <span className="font-bold text-slate-700 block">{record.cabgProcedures.length}</span>
                      <span className="text-[10px] text-slate-400 block uppercase">CABG Audits</span>
                    </div>
                  </div>
  
                  {/* Direct Consistency Alert warning inside patient card */}
                  {dq.alerts.length > 0 &&
                <div className="mt-3 bg-amber-50/50 border border-amber-200 p-2 rounded-lg text-[11px] text-amber-800 flex gap-1.5 items-center">
                      <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                      <span className="truncate"><strong>Quality Check:</strong> {dq.alerts[0]}</span>
                      {dq.alerts.length > 1 &&
                  <span className="bg-amber-100 px-1 py-0.2 rounded text-[9px] font-extrabold shrink-0">+{dq.alerts.length - 1} more</span>
                  }
                    </div>
                }
                </div>
  
                {/* Patient Footer Action Triggers */}
                <div className="mt-5 pt-3 border-t border-slate-100 flex flex-col sm:flex-row gap-2 justify-between items-center">
                  {/* Rapid Record Add Button Select */}
                  <div className="flex gap-1 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
                    <button
                    id={`btn-add-hf-${record.patient.id}`}
                    onClick={() => onAddEventClick(record.patient.id, 'HF')}
                    className="px-2 py-1.5 bg-teal-50 hover:bg-teal-100 text-teal-700 rounded-md text-[10px] font-bold shrink-0 transition-colors cursor-pointer">
                    
                      + HF Assess
                    </button>
                    <button
                    id={`btn-add-stemi-${record.patient.id}`}
                    onClick={() => onAddEventClick(record.patient.id, 'STEMI')}
                    className="px-2 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 rounded-md text-[10px] font-bold shrink-0 transition-colors cursor-pointer">
                    
                      + STEMI
                    </button>
                    <button
                    id={`btn-add-nstemi-${record.patient.id}`}
                    onClick={() => onAddEventClick(record.patient.id, 'NSTEMI')}
                    className="px-2 py-1.5 bg-orange-50 hover:bg-orange-100 text-orange-700 rounded-md text-[10px] font-bold shrink-0 transition-colors cursor-pointer">
                    
                      + NSTEMI
                    </button>
                    <button
                    id={`btn-add-cabg-${record.patient.id}`}
                    onClick={() => onAddEventClick(record.patient.id, 'CABG')}
                    className="px-2 py-1.5 bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-md text-[10px] font-bold shrink-0 transition-colors cursor-pointer">
                    
                      + CABG
                    </button>
                  </div>
  
                  <button
                  id={`btn-view-timeline-${record.patient.id}`}
                  onClick={() => onSelectPatient(record.patient.id)}
                  className="w-full sm:w-auto px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-lg text-xs flex items-center justify-center gap-1 transition-colors mt-2 sm:mt-0 cursor-pointer">
                  
                    <span>Clinical Timeline</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>);

        })}
  
          {filteredPatients.length === 0 &&
        <div className="col-span-2 text-center py-12 bg-white rounded-xl border border-slate-200 text-slate-400 font-medium">
              No registered patient found matching the search criteria. Click &quot;Register New Patient&quot; above to initialize a master record.
            </div>
        }
        </div>)
      }

    </div>);

}