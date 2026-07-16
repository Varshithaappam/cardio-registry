/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';

import { createPatient } from '../../api/patientApi';
import { calculateDataQualityScore } from '../data/mockPatients';
import { calculateAge } from '../utils/calculateAge';
import { buildPatientPayload, mapPatientRecord } from '../utils/patientMapper';
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








export default function PatientList({ patients, onSelectPatient, onRegisterPatient, onAddEventClick }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
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
          <div className="flex items-center p-1 bg-slate-100 rounded-xl border border-slate-200 shrink-0">
            <button
              id="btn-view-mode-table"
              type="button"
              onClick={() => setViewMode('table')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              viewMode === 'table' ?
              'bg-white text-blue-700 shadow-sm border-slate-250' :
              'text-slate-500 hover:text-slate-800'}`
              }>
              
              <Table className="w-3.5 h-3.5" />
              <span>Tabular Registry</span>
            </button>
            <button
              id="btn-view-mode-cards"
              type="button"
              onClick={() => setViewMode('cards')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              viewMode === 'cards' ?
              'bg-white text-blue-700 shadow-sm border-slate-250' :
              'text-slate-500 hover:text-slate-800'}`
              }>
              
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Clinical Cards</span>
            </button>
          </div>

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
      {isRegistering &&
      <form onSubmit={handleRegisterSubmit} className="bg-white rounded-xl shadow-md border border-blue-200 p-6 space-y-6 relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-blue-500"></div>
          <div>
            <h3 className="text-base font-bold text-slate-800">Master Registry: Patient Registration</h3>
            <p className="text-xs text-slate-500 mt-1">Initialize the Patient Master Record and Patient Clinical Profile.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Demographic Parameters */}
            <div className="space-y-3.5 bg-slate-50 p-4 rounded-xl border border-slate-100">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Demographics</h4>
              
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Full Name *</label>
                <input
                id="reg-name"
                type="text"
                required
                className="w-full p-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="E.g. Ramesh Chandra Malhotra" />
              
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Date of Birth</label>
                <input
                id="reg-dob"
                type="date"
                required
                className="w-full p-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                value={dob}
                onChange={(e) => setDob(e.target.value)} />
              
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Age (Years)</label>
                  <input
                  id="reg-age"
                  type="number"
                  readOnly
                  className="w-full p-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  value={calculateAge(dob) ?? ''} />
                
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Gender *</label>
                  <select
                  id="reg-gender"
                  className="w-full p-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  value={gender}
                  onChange={(e) => setGender(e.target.value)}>
                  
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Clinical & Contact Parameters */}
            <div className="space-y-3.5 bg-slate-50 p-4 rounded-xl border border-slate-100">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Clinical & Contact</h4>
              

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Blood Group</label>
                  <select
                  id="reg-bloodgroup"
                  className="w-full p-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  value={bloodGroup}
                  onChange={(e) => setBloodGroup(e.target.value)}>
                  
                    <option value="Unknown">Unknown</option>
                    <option value="A+">A+</option>
                    <option value="A-">A-</option>
                    <option value="B+">B+</option>
                    <option value="B-">B-</option>
                    <option value="AB+">AB+</option>
                    <option value="AB-">AB-</option>
                    <option value="O+">O+</option>
                    <option value="O-">O-</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Insurance Mode</label>
                  <select
                  id="reg-insurance"
                  className="w-full p-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  value={insuranceMode}
                  onChange={(e) => setInsuranceMode(e.target.value)}>
                  
                    <option value="Direct Cash / Self-Pay">Direct Cash / Self-Pay</option>
                    <option value="Private Insurance">Private Insurance</option>
                    <option value="Government Reimbursement">Government Reimbursement</option>
                    <option value="Arogyasree Scheme">Arogyasree Scheme</option>
                    <option value="Unknown">Unknown</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Contact Phone</label>
                <input
                id="reg-phone"
                type="text"
                placeholder="+91 98480 12345"
                className="w-full p-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                value={phone}
                onChange={(e) => setPhone(e.target.value)} />
              
              </div>
            </div>

            {/* Core Baseline Co-morbidities & Conditional Checks */}
            <div className="space-y-3.5 bg-slate-50 p-4 rounded-xl border border-slate-100">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Baseline Comorbidities</h4>
              
              <div className="grid grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wide mb-1">Hypertension</label>
                  <div className="flex gap-1.5">
                    {['Yes', 'No', 'Unknown'].map((opt) =>
                  <button
                    id={`btn-htn-${opt.toLowerCase()}`}
                    type="button"
                    key={opt}
                    onClick={() => setHypertension(opt)}
                    className={`flex-1 py-1 text-xs font-bold rounded-md border text-center transition-all ${
                    hypertension === opt ?
                    'bg-blue-600 border-blue-600 text-white shadow-sm' :
                    'bg-white border-slate-200 hover:bg-slate-100 text-slate-600'}`
                    }>
                    
                        {opt === 'Unknown' ? 'Unk' : opt}
                      </button>
                  )}
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wide mb-1">Smoking</label>
                  <div className="flex gap-1.5">
                    {['Yes', 'No', 'Unknown'].map((opt) =>
                  <button
                    id={`btn-smoking-${opt.toLowerCase()}`}
                    type="button"
                    key={opt}
                    onClick={() => setSmoking(opt)}
                    className={`flex-1 py-1 text-xs font-bold rounded-md border text-center transition-all ${
                    smoking === opt ?
                    'bg-blue-600 border-blue-600 text-white shadow-sm' :
                    'bg-white border-slate-200 hover:bg-slate-100 text-slate-600'}`
                    }>
                    
                        {opt === 'Unknown' ? 'Unk' : opt}
                      </button>
                  )}
                  </div>
                </div>
              </div>

              {/* Diabetes with Conditional Selection */}
              <div className="space-y-1.5">
                <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wide mb-1">Diabetes Mellitus</label>
                <div className="flex gap-1.5">
                  {['Yes', 'No', 'Unknown'].map((opt) =>
                <button
                  id={`btn-diab-${opt.toLowerCase()}`}
                  type="button"
                  key={opt}
                  onClick={() => setDiabetes(opt)}
                  className={`flex-1 py-1 text-xs font-bold rounded-md border text-center transition-all ${
                  diabetes === opt ?
                  'bg-blue-600 border-blue-600 text-white shadow-sm' :
                  'bg-white border-slate-200 hover:bg-slate-100 text-slate-600'}`
                  }>
                  
                      {opt === 'Unknown' ? 'Unk' : opt}
                    </button>
                )}
                </div>

                {/* Conditional Diabetes Control Block */}
                {diabetes === 'Yes' &&
              <div className="mt-2 p-2.5 bg-blue-50/50 border border-blue-100 rounded-lg animate-fadeIn">
                    <label className="block text-[10px] font-bold text-blue-800 uppercase mb-1">Diabetes Control Type *</label>
                    <select
                  id="reg-diabcontrol"
                  required
                  className="w-full p-1.5 text-xs bg-white border border-blue-200 rounded-md focus:outline-none"
                  value={diabetesControl}
                  onChange={(e) => setDiabetesControl(e.target.value)}>
                  
                      <option value="None">None (Uncontrolled)</option>
                      <option value="Diet">Dietary Control Only</option>
                      <option value="Oral">Oral Hypoglycemics (OHA)</option>
                      <option value="Insulin">Insulin Therapy</option>
                      <option value="Unknown">Unknown</option>
                    </select>
                  </div>
              }
              </div>

              {/* Renal Failure with Conditional Dialysis Status */}
              <div className="space-y-1.5">
                <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wide mb-1">Renal Failure (CKD)</label>
                <div className="flex gap-1.5">
                  {['Yes', 'No', 'Unknown'].map((opt) =>
                <button
                  id={`btn-renal-${opt.toLowerCase()}`}
                  type="button"
                  key={opt}
                  onClick={() => setRenalFailure(opt)}
                  className={`flex-1 py-1 text-xs font-bold rounded-md border text-center transition-all ${
                  renalFailure === opt ?
                  'bg-blue-600 border-blue-600 text-white shadow-sm' :
                  'bg-white border-slate-200 hover:bg-slate-100 text-slate-600'}`
                  }>
                  
                      {opt === 'Unknown' ? 'Unk' : opt}
                    </button>
                )}
                </div>

                {/* Conditional Dialysis Block */}
                {renalFailure === 'Yes' &&
              <div className="mt-2 p-2.5 bg-blue-50/50 border border-blue-100 rounded-lg animate-fadeIn">
                    <label className="block text-[10px] font-bold text-blue-800 uppercase mb-1">Active Dialysis Status *</label>
                    <div className="flex gap-2 mt-1">
                      {['Yes', 'No'].map((opt) =>
                  <button
                    id={`btn-dialysis-${opt.toLowerCase()}`}
                    type="button"
                    key={opt}
                    onClick={() => setDialysisStatus(opt)}
                    className={`flex-1 py-1 text-xs font-semibold rounded-md border text-center ${
                    dialysisStatus === opt ?
                    'bg-blue-600 border-blue-600 text-white' :
                    'bg-white border-slate-200 hover:bg-slate-100 text-slate-600'}`
                    }>
                    
                          {opt === 'Yes' ? 'Under Dialysis' : 'No Dialysis'}
                        </button>
                  )}
                    </div>
                  </div>
              }
              </div>

            </div>
          </div>

          <div className="flex items-center justify-end gap-3.5 border-t border-slate-100 pt-4">
            <button
            id="btn-cancel-reg"
            type="button"
            onClick={() => setIsRegistering(false)}
            className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-lg text-xs font-bold">
            
              Cancel
            </button>
            <button
            id="btn-submit-reg"
            type="submit"
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold shadow-sm">
            
              Verify & Register Patient
            </button>
          </div>
        </form>
      }

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
                  <th className="px-4 py-4 text-center">Encounter Counts</th>
                  <th className="px-4 py-4 text-center">Audit Quality</th>
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
                      <td className="px-4 py-4 text-center">
                        <div className="inline-flex items-center gap-2 bg-slate-50 border border-slate-200/60 p-1.5 rounded-xl font-mono text-[11px]">
                          <div className="flex flex-col items-center px-2">
                            <span className="text-[8px] text-slate-400 font-black tracking-wider uppercase">HF</span>
                            <span className={`font-extrabold ${record.hfAssessments.length > 0 ? 'text-teal-600' : 'text-slate-400'}`}>{record.hfAssessments.length}</span>
                          </div>
                          <span className="w-[1px] h-5 bg-slate-200"></span>
                          <div className="flex flex-col items-center px-2">
                            <span className="text-[8px] text-slate-400 font-black tracking-wider uppercase">ACS</span>
                            <span className={`font-extrabold ${record.acsEvents.length > 0 ? 'text-red-500' : 'text-slate-400'}`}>{record.acsEvents.length}</span>
                          </div>
                          <span className="w-[1px] h-5 bg-slate-200"></span>
                          <div className="flex flex-col items-center px-2">
                            <span className="text-[8px] text-slate-400 font-black tracking-wider uppercase">CABG</span>
                            <span className={`font-extrabold ${record.cabgProcedures.length > 0 ? 'text-purple-600' : 'text-slate-400'}`}>{record.cabgProcedures.length}</span>
                          </div>
                        </div>
                      </td>

                      {/* Quality Score */}
                      <td className="px-4 py-4 text-center">
                        <div className="inline-block">
                          <span className={`inline-flex items-center gap-1 font-extrabold text-xs px-2.5 py-1 rounded-lg border ${
                        dq.score >= 85 ?
                        'bg-emerald-50 text-emerald-700 border-emerald-100' :
                        'bg-amber-50 text-amber-700 border-amber-100'}`
                        }>
                            <ShieldAlert className="w-3.5 h-3.5 shrink-0" />
                            {dq.score}%
                          </span>
                          {dq.alerts.length > 0 &&
                        <div
                          className="text-[9px] text-amber-600 font-bold mt-1 max-w-[130px] mx-auto truncate"
                          title={dq.alerts.join('\n')}>
                          
                              ⚠️ {dq.alerts[0]}
                            </div>
                        }
                        </div>
                      </td>

                      {/* Table Actions */}
                      <td className="px-5 py-4 text-right">
                        <div className="flex items-center justify-end gap-2.5">
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