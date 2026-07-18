/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from "react";
import { getAllPatients } from "../api/patientApi";
import api from "../api/axios";
import { mapPatientRecords } from "./utils/patientMapper";

import Dashboard from "./components/Dashboard";
import PatientList from "./components/PatientList";
import MappingMatrix from "./components/MappingMatrix";
import PatientTimeline from "./components/PatientTimeline";
import ClinicalForm from "./components/ClinicalForm";
import EventViewer from "./components/EventViewer";
import NurseLogin from "./components/NurseLogin";

import {
  Heart,
  Users,
  Layers,
  LayoutDashboard,
  LogOut,
  UserCheck,
} from "lucide-react";

export default function App() {
  // Nurse login status
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [nurse, setNurse] = useState(null);

  // 1. Central Registry State (Prefilled with high-fidelity, representative clinical portfolios)
const [records, setRecords] = useState([]);

  // 2. Navigation & Router States
  const [currentView, setCurrentView] = useState('dashboard');
  const [selectedPatientId, setSelectedPatientId] = useState(null);

  // 3. Form & Viewer Active States
  const [activeFormType, setActiveFormType] = useState('HF');
  const [editingRecord, setEditingRecord] = useState(null);
  const [activeViewerEvent, setActiveViewerEvent] = useState(null);
  const [activeViewerType, setActiveViewerType] = useState('');

  // 4. Helper to find active patient record
  const activePatientRecord = records.find((r) => r?.patient?.id === selectedPatientId) || null;

  // --- ACTIONS & MUTATORS ---

  // Register a brand new patient
  const handleRegisterPatient = async (newPatientRecord) => {
    try {
      await loadPatients();
      setSelectedPatientId(newPatientRecord?.patient?.id || null);
      setCurrentView('patients');
    } catch (error) {
      console.error('Failed to refresh patients after registration:', error);
    }
  };

  // Add or update an event in a patient's portfolio
  const handleSaveClinicalEvent = async (eventData, formType) => {
    if (!selectedPatientId) return;

    if (formType === 'HF') {
      try {
        console.log("Saving HF Assessment to backend:", eventData);
        const response = await api.post("/hf-assessment", eventData);
        if (response.data && response.data.success) {
          alert("Heart Failure Assessment details saved into database successfully.");
        } else {
          alert(response.data?.message || "Failed to save Heart Failure Assessment details.");
        }
      } catch (error) {
        console.error("Error saving HF assessment:", error);
        alert(error.response?.data?.message || "Failed to save Heart Failure Assessment details.");
      }
    }

    setRecords((prevRecords) => {
      return prevRecords.map((rec) => {
        if (rec.patient.id !== selectedPatientId) return rec;

        // Clone record deeply to prevent mutations
        const updated = { ...rec };

        if (formType === 'Admission') {
          const exists = updated.hospitalizations.some((h) => h.id === eventData.id);
          if (exists) {
            updated.hospitalizations = updated.hospitalizations.map((h) => h.id === eventData.id ? eventData : h);
          } else {
            updated.hospitalizations = [eventData, ...updated.hospitalizations];
          }
        } else
        if (formType === 'HF') {
          const exists = updated.hfAssessments.some((h) => h.id === eventData.id);
          if (exists) {
            updated.hfAssessments = updated.hfAssessments.map((h) => h.id === eventData.id ? eventData : h);
          } else {
            updated.hfAssessments = [eventData, ...updated.hfAssessments];
          }
        } else
        if (formType === 'STEMI' || formType === 'NSTEMI') {
          const exists = updated.acsEvents.some((a) => a.id === eventData.id);
          if (exists) {
            updated.acsEvents = updated.acsEvents.map((a) => a.id === eventData.id ? eventData : a);
          } else {
            updated.acsEvents = [eventData, ...updated.acsEvents];
          }
        } else
        if (formType === 'CABG') {
          const exists = updated.cabgProcedures.some((c) => c.id === eventData.id);
          if (exists) {
            updated.cabgProcedures = updated.cabgProcedures.map((c) => c.id === eventData.id ? eventData : c);
          } else {
            updated.cabgProcedures = [eventData, ...updated.cabgProcedures];
          }
        } else
        if (formType === 'Follow-up') {
          const exists = updated.followUps.some((f) => f.id === eventData.id);
          if (exists) {
            updated.followUps = updated.followUps.map((f) => f.id === eventData.id ? eventData : f);
          } else {
            updated.followUps = [eventData, ...updated.followUps];
          }
        } else
        if (formType === 'Lab') {
          const exists = updated.labResults.some((l) => l.id === eventData.id);
          if (exists) {
            updated.labResults = updated.labResults.map((l) => l.id === eventData.id ? eventData : l);
          } else {
            updated.labResults = [eventData, ...updated.labResults];
          }
        } else
        if (formType === 'Investigation') {
          const exists = updated.investigations.some((i) => i.id === eventData.id);
          if (exists) {
            updated.investigations = updated.investigations.map((i) => i.id === eventData.id ? eventData : i);
          } else {
            updated.investigations = [eventData, ...updated.investigations];
          }
        }

        return updated;
      });
    });

    setEditingRecord(null);
    setCurrentView('timeline');
  };

  // Delete an event
  const handleDeleteClinicalEvent = (eventId, type) => {
    if (!selectedPatientId) return;

    if (!window.confirm('Are you sure you want to delete this clinical record from the patient timeline? This action is irreversible.')) {
      return;
    }

    setRecords((prevRecords) => {
      return prevRecords.map((rec) => {
        if (rec.patient.id !== selectedPatientId) return rec;

        const updated = { ...rec };
        if (type === 'Admission') {
          updated.hospitalizations = updated.hospitalizations.filter((h) => h.id !== eventId);
        } else if (type === 'HF Assessment') {
          updated.hfAssessments = updated.hfAssessments.filter((h) => h.id !== eventId);
        } else if (type === 'STEMI' || type === 'NSTEMI') {
          updated.acsEvents = updated.acsEvents.filter((a) => a.id !== eventId);
        } else if (type === 'CABG') {
          updated.cabgProcedures = updated.cabgProcedures.filter((c) => c.id !== eventId);
        } else if (type === 'Follow-up') {
          updated.followUps = updated.followUps.filter((f) => f.id !== eventId);
        } else if (type === 'Lab') {
          updated.labResults = updated.labResults.filter((l) => l.id !== eventId);
        } else if (type === 'Investigation') {
          updated.investigations = updated.investigations.filter((i) => i.id !== eventId);
        }

        return updated;
      });
    });
  };

  // Open active view/edit
  const handleViewEventDetails = (event, type) => {
    setActiveViewerEvent(event);
    setActiveViewerType(type);
    setCurrentView('viewer');
  };

  const handleOpenAddForm = (formType) => {
    setActiveFormType(formType);
    setEditingRecord(null);
    setCurrentView('form');
  };


  const loadPatients = async () => {
    try {
        const response = await getAllPatients();

        if (response.success) {
            const mappedPatients = mapPatientRecords(response.data);
            setRecords(mappedPatients);
            return mappedPatients;
        }
    } catch (error) {
        console.error("Failed to load patients:", error);
    }

    return [];
};

useEffect(() => {
    loadPatients();
}, []);

  if (!isLoggedIn) {
    return <NurseLogin onLogin={(name, role) => {setIsLoggedIn(true);setNurse({ name, role });}} />;
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      
      {/* Top Professional Clinician Bar */}
      <header className="bg-slate-900 text-white border-b border-slate-800 shrink-0 shadow-sm relative z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex justify-between items-center flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-600 text-white rounded-xl">
              <Heart className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <h1 className="text-sm sm:text-base font-black tracking-tight flex items-center gap-1.5 text-slate-100">
                <span>CARE CARDIOVASCULAR REGISTRY</span>
                <span className="px-2 py-0.5 bg-blue-500/20 text-blue-400 rounded-md text-[9px] font-bold border border-blue-500/30">v1.2.0</span>
              </h1>
              <p className="text-[10px] text-slate-400 mt-0.5">Comprehensive Longitudinal Clinical Audit Platform</p>
            </div>
          </div>

          {/* Nurse Profile Info & Logout Action */}
          <div className="flex items-center gap-3 flex-wrap sm:flex-nowrap">
            <div className="flex items-center gap-2 bg-slate-800/80 border border-slate-700/60 rounded-xl px-3.5 py-1.5">
              <UserCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              <div className="text-left hidden xs:block">
                <span className="block text-xs font-black text-slate-100 leading-none">{nurse?.name}</span>
                <span className="block text-[9px] text-slate-400 font-semibold mt-0.5">{nurse?.role}</span>
              </div>
              <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse shrink-0 ml-1"></span>
            </div>

            <button
              id="btn-logout"
              onClick={() => {
                setIsLoggedIn(false);
                setNurse(null);
                setCurrentView('dashboard');
                setSelectedPatientId(null);
              }}
              className="px-3 py-2 bg-slate-800 hover:bg-red-950/30 text-slate-300 hover:text-red-400 border border-slate-700/60 hover:border-red-500/30 rounded-xl transition-all flex items-center gap-1.5 text-xs font-bold cursor-pointer"
              title="Secure Log Out">
              
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex-1 w-full flex flex-col md:flex-row gap-6">
        
        {/* Left Side App Navigation Menu */}
        <aside className="w-full md:w-64 shrink-0 flex flex-col gap-2">
          
          <button
            id="nav-dash"
            onClick={() => {setCurrentView('dashboard');setSelectedPatientId(null);}}
            className={`w-full px-4 py-3 rounded-xl text-left text-xs font-bold transition-all flex items-center gap-3 border ${
            currentView === 'dashboard' ?
            'bg-blue-600 text-white border-blue-600 shadow-sm' :
            'bg-white hover:bg-slate-100 text-slate-600 border-slate-200'}`
            }>
            
            <LayoutDashboard className="w-4 h-4" />
            <span>Clinical Intelligence Dashboard</span>
          </button>

          <button
            id="nav-patients"
            onClick={() => {setCurrentView('patients');setSelectedPatientId(null);}}
            className={`w-full px-4 py-3 rounded-xl text-left text-xs font-bold transition-all flex items-center gap-3 border ${
            currentView === 'patients' || currentView === 'timeline' || currentView === 'form' || currentView === 'viewer' ?
            'bg-blue-600 text-white border-blue-600 shadow-sm' :
            'bg-white hover:bg-slate-100 text-slate-600 border-slate-200'}`
            }>
            
            <Users className="w-4 h-4" />
            <span>Master Patient Registry</span>
          </button>

          <button
            id="nav-mapping"
            onClick={() => {setCurrentView('mapping');setSelectedPatientId(null);}}
            className={`w-full px-4 py-3 rounded-xl text-left text-xs font-bold transition-all flex items-center gap-3 border ${
            currentView === 'mapping' ?
            'bg-blue-600 text-white border-blue-600 shadow-sm' :
            'bg-white hover:bg-slate-100 text-slate-600 border-slate-200'}`
            }>
            
            <Layers className="w-4 h-4" />
            <span>Source Clinical Form Mapping</span>
          </button>

          {/* Quick Context Subpanel if patient is selected */}
          {selectedPatientId && activePatientRecord &&
          <div className="mt-4 p-4 bg-slate-900 text-white rounded-2xl border border-slate-800 space-y-3.5 animate-fadeIn">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Active Patient Scope</span>
              <div>
                <span className="text-xs font-bold block truncate">{activePatientRecord.patient.name}</span>
                <span className="text-[10px] text-slate-400 block mt-0.5">MR No: {activePatientRecord.patient.mrNo}</span>
              </div>
              <div className="flex flex-col gap-1.5 pt-1 border-t border-slate-800">
                <button
                id="aside-view-portfolio"
                onClick={() => setCurrentView('timeline')}
                className={`w-full text-left px-2 py-1.5 rounded text-[11px] font-bold transition-colors ${
                currentView === 'timeline' ? 'bg-blue-500 text-white' : 'text-slate-300 hover:bg-slate-800'}`
                }>
                
                  ✔ View Longitudinal Timeline
                </button>
              </div>
            </div>
          }

        </aside>

        {/* Right Main Panel */}
        <main className="flex-1 min-w-0">
          
          {/* Dashboard View */}
          {currentView === 'dashboard' &&
          <Dashboard
            patients={records}
            onSelectPatient={(id) => {
              setSelectedPatientId(id);
              setCurrentView('timeline');
            }} />

          }

          {/* Patient Master Registry View */}
          {currentView === 'patients' &&
          <PatientList
            patients={records}
            onRegisterPatient={handleRegisterPatient}
            onSelectPatient={(id) => {
              setSelectedPatientId(id);
              setCurrentView('timeline');
            }}
            onAddEventClick={(patientId, formType) => {
              setSelectedPatientId(patientId);
              handleOpenAddForm(formType);
            }} />

          }

          {/* Source Form Mapping Matrix View */}
          {currentView === 'mapping' &&
          <MappingMatrix />
          }

          {/* Patient Timeline / Portfolio View */}
          {currentView === 'timeline' && activePatientRecord &&
          <PatientTimeline
            record={activePatientRecord}
            onBack={() => {
              setSelectedPatientId(null);
              setCurrentView('patients');
            }}
            onAddEventClick={handleOpenAddForm}
            onViewEventDetails={handleViewEventDetails}
            onDeleteEvent={handleDeleteClinicalEvent} />

          }

          {/* Dynamic Clinical Data Capture Form */}
          {currentView === 'form' && activePatientRecord &&
          <ClinicalForm
            patientRecord={activePatientRecord}
            formType={activeFormType}
            editingRecord={editingRecord}
            onCancel={() => setCurrentView('timeline')}
            onSave={handleSaveClinicalEvent} />

          }

          {/* Clinical Audit Sheet Viewer */}
          {currentView === 'viewer' && activeViewerEvent &&
          <EventViewer
            event={activeViewerEvent}
            type={activeViewerType}
            onBack={() => setCurrentView('timeline')} />

          }

        </main>

      </div>

      {/* Humble Footer */}
      <footer className="bg-white border-t border-slate-200 py-4 shrink-0 text-center text-slate-400 text-xs">
        <div className="max-w-7xl mx-auto px-4">
          <span>CARE Clinical Registry Portal • Fully verified according to standard guidelines & medical data quality practices.</span>
        </div>
      </footer>

    </div>);

}


